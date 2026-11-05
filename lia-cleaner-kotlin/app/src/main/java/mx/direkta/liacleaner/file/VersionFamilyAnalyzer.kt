package mx.direkta.liacleaner.file

import android.content.pm.PackageManager
import android.os.Build
import java.io.File
import java.util.Locale

data class VersionMetadata(
    val packageName: String? = null,
    val versionName: String? = null,
    val versionCode: Long? = null,
    val dateMs: Long = 0L
)

data class VersionFamily(
    val key: String,
    val displayName: String,
    val extension: String,
    val files: List<CleanerFileItem>,
    val metadataByPath: Map<String, VersionMetadata> = emptyMap()
) {
    val latest: CleanerFileItem get() = files.first()
    val removableKeepingOne: List<CleanerFileItem> get() = files.drop(1)
    fun removableKeeping(count: Int): List<CleanerFileItem> = files.drop(count.coerceAtLeast(1))
    val removableBytesKeepingOne: Long get() = removableKeepingOne.sumOf { it.sizeBytes }
    fun metadata(file: CleanerFileItem): VersionMetadata? = metadataByPath[file.file.absolutePath]
}

object VersionFamilyAnalyzer {
    private data class Parsed(
        val familyKey: String,
        val displayName: String,
        val extension: String,
        val versionParts: List<Int>?,
        val copyNumber: Int?,
        val dateNumber: Long?,
        val apkMeta: VersionMetadata?
    )

    fun findFamilies(
        files: List<CleanerFileItem>,
        packageManager: PackageManager? = null
    ): List<VersionFamily> {
        return files
            .filter { it.kind in setOf(CleanerFileKind.DOCUMENT, CleanerFileKind.ARCHIVE, CleanerFileKind.APK, CleanerFileKind.OTHER) }
            .mapNotNull { item -> parse(item, packageManager)?.let { parsed -> Triple(parsed.familyKey, parsed, item) } }
            .groupBy { it.first }
            .values
            .mapNotNull { entries ->
                if (entries.size < 2) return@mapNotNull null
                val parsed = entries.first().second
                val sorted = entries.sortedWith { a, b -> compareEntries(b.second, b.third, a.second, a.third) }
                VersionFamily(
                    key = entries.first().first,
                    displayName = parsed.displayName,
                    extension = parsed.extension,
                    files = sorted.map { it.third },
                    metadataByPath = entries.associate { entry ->
                        entry.third.file.absolutePath to (
                            entry.second.apkMeta ?: VersionMetadata(dateMs = entry.third.bestDateMs)
                        )
                    }
                )
            }
            .filter { family ->
                family.files.map { it.name.lowercase(Locale.ROOT) }.distinct().size > 1
            }
            .sortedByDescending { it.removableBytesKeepingOne }
    }

    private fun parse(item: CleanerFileItem, packageManager: PackageManager?): Parsed? {
        val file = item.file
        val name = file.name
        val ext = name.substringAfterLast('.', "").lowercase(Locale.ROOT)
        if (ext.isBlank()) return null

        if (ext == "apk" && packageManager != null) {
            readApkMetadata(file, packageManager)?.let { meta ->
                val appLabel = readApkLabel(file, packageManager) ?: meta.packageName.orEmpty()
                val family = meta.packageName?.takeIf { it.isNotBlank() } ?: return@let
                return Parsed(
                    familyKey = "apk:$family",
                    displayName = appLabel.ifBlank { name.substringBeforeLast('.') },
                    extension = ext,
                    versionParts = meta.versionName?.split(Regex("""[^0-9]+"""))?.mapNotNull { it.toIntOrNull() }?.takeIf { it.isNotEmpty() },
                    copyNumber = null,
                    dateNumber = null,
                    apkMeta = meta.copy(dateMs = item.bestDateMs)
                )
            }
        }

        var stem = name.substringBeforeLast('.').trim()
        if (stem.length < 3) return null

        var version: List<Int>? = null
        var copyNumber: Int? = null
        var dateNumber: Long? = null
        var recognized = false

        val versionRegex = Regex("""(?i)(?:[._\-\s]?(?:v|ver|version|build)\s*[_\-]?)((?:\d+\.)*\d+)$""")
        versionRegex.find(stem)?.let { m ->
            version = m.groupValues[1].split('.').mapNotNull { it.toIntOrNull() }
            stem = stem.removeRange(m.range).trim(' ', '-', '_', '.')
            recognized = true
        }

        val dateRegex = Regex("""(?:[._\-\s]?)(20\d{2})[._\-]?(0[1-9]|1[0-2])[._\-]?([0-2]\d|3[01])$""")
        dateRegex.find(stem)?.let { m ->
            dateNumber = (m.groupValues[1] + m.groupValues[2] + m.groupValues[3]).toLongOrNull()
            stem = stem.removeRange(m.range).trim(' ', '-', '_', '.')
            recognized = true
        }

        val copyRegexes = listOf(
            Regex("""\s*\((\d+)\)$"""),
            Regex("""(?i)[._\-\s]+(?:copy|copia)\s*(\d*)$"""),
            Regex("""(?i)[._\-\s]+(?:final|rev|revision|revisión)\s*(\d*)$""")
        )
        for (regex in copyRegexes) {
            val m = regex.find(stem) ?: continue
            copyNumber = m.groupValues.getOrNull(1)?.toIntOrNull() ?: 1
            stem = stem.removeRange(m.range).trim(' ', '-', '_', '.')
            recognized = true
            break
        }

        if (!recognized || stem.length < 3) return null

        val normalized = stem
            .lowercase(Locale.ROOT)
            .replace(Regex("""[^a-z0-9áéíóúüñ]+"""), " ")
            .trim()
            .replace(Regex("""\s+"""), " ")
        if (normalized.length < 3) return null

        return Parsed(
            familyKey = "$normalized|$ext",
            displayName = stem,
            extension = ext,
            versionParts = version,
            copyNumber = copyNumber,
            dateNumber = dateNumber,
            apkMeta = null
        )
    }

    @Suppress("DEPRECATION")
    private fun readApkMetadata(file: File, packageManager: PackageManager): VersionMetadata? {
        val info = runCatching {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                packageManager.getPackageArchiveInfo(file.absolutePath, PackageManager.PackageInfoFlags.of(0))
            } else {
                packageManager.getPackageArchiveInfo(file.absolutePath, 0)
            }
        }.getOrNull() ?: return null

        val versionCode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) info.longVersionCode else info.versionCode.toLong()
        return VersionMetadata(
            packageName = info.packageName,
            versionName = info.versionName,
            versionCode = versionCode,
            dateMs = file.lastModified()
        )
    }

    @Suppress("DEPRECATION")
    private fun readApkLabel(file: File, packageManager: PackageManager): String? {
        val info = runCatching {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                packageManager.getPackageArchiveInfo(
                    file.absolutePath,
                    PackageManager.PackageInfoFlags.of(PackageManager.GET_META_DATA.toLong())
                )
            } else {
                packageManager.getPackageArchiveInfo(file.absolutePath, PackageManager.GET_META_DATA)
            }
        }.getOrNull() ?: return null
        val appInfo = info.applicationInfo ?: return null
        appInfo.sourceDir = file.absolutePath
        appInfo.publicSourceDir = file.absolutePath
        return runCatching { packageManager.getApplicationLabel(appInfo).toString() }.getOrNull()
    }

    private fun compareEntries(aParsed: Parsed, a: CleanerFileItem, bParsed: Parsed, b: CleanerFileItem): Int {
        val aApk = aParsed.apkMeta
        val bApk = bParsed.apkMeta
        if (aApk != null || bApk != null) {
            val av = aApk?.versionCode ?: Long.MIN_VALUE
            val bv = bApk?.versionCode ?: Long.MIN_VALUE
            if (av != bv) return av.compareTo(bv)
        }
        compareVersionParts(aParsed.versionParts, bParsed.versionParts).takeIf { it != 0 }?.let { return it }
        val aDate = aParsed.dateNumber ?: Long.MIN_VALUE
        val bDate = bParsed.dateNumber ?: Long.MIN_VALUE
        if (aDate != bDate) return aDate.compareTo(bDate)
        val aCopy = aParsed.copyNumber ?: Int.MIN_VALUE
        val bCopy = bParsed.copyNumber ?: Int.MIN_VALUE
        if (aCopy != bCopy) return aCopy.compareTo(bCopy)
        return a.bestDateMs.compareTo(b.bestDateMs)
    }

    private fun compareVersionParts(a: List<Int>?, b: List<Int>?): Int {
        if (a == null && b == null) return 0
        if (a != null && b == null) return 1
        if (a == null && b != null) return -1
        val aa = a ?: emptyList()
        val bb = b ?: emptyList()
        val n = maxOf(aa.size, bb.size)
        for (i in 0 until n) {
            val av = aa.getOrElse(i) { 0 }
            val bv = bb.getOrElse(i) { 0 }
            if (av != bv) return av.compareTo(bv)
        }
        return 0
    }
}
