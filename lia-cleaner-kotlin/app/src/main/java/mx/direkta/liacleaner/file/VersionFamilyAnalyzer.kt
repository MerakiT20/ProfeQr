package mx.direkta.liacleaner.file

import java.io.File
import java.util.Locale

data class VersionFamily(
    val key: String,
    val displayName: String,
    val extension: String,
    val files: List<CleanerFileItem>
) {
    val latest: CleanerFileItem get() = files.first()
    val removableKeepingOne: List<CleanerFileItem> get() = files.drop(1)
    fun removableKeeping(count: Int): List<CleanerFileItem> = files.drop(count.coerceAtLeast(1))
    val removableBytesKeepingOne: Long get() = removableKeepingOne.sumOf { it.sizeBytes }
}

object VersionFamilyAnalyzer {
    private data class Parsed(
        val familyKey: String,
        val displayName: String,
        val extension: String,
        val versionParts: List<Int>?,
        val copyNumber: Int?,
        val dateNumber: Long?
    )

    fun findFamilies(files: List<CleanerFileItem>): List<VersionFamily> {
        return files
            .filter { it.kind in setOf(CleanerFileKind.DOCUMENT, CleanerFileKind.ARCHIVE, CleanerFileKind.APK, CleanerFileKind.OTHER) }
            .mapNotNull { item -> parse(item.file)?.let { parsed -> Triple(parsed.familyKey, parsed, item) } }
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
                    files = sorted.map { it.third }
                )
            }
            .filter { family ->
                family.files.map { it.name.lowercase(Locale.ROOT) }.distinct().size > 1
            }
            .sortedByDescending { it.removableBytesKeepingOne }
    }

    private fun parse(file: File): Parsed? {
        val name = file.name
        val ext = name.substringAfterLast('.', "").lowercase(Locale.ROOT)
        if (ext.isBlank()) return null
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

        if (!recognized) return null
        if (stem.length < 3) return null

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
            dateNumber = dateNumber
        )
    }

    private fun compareEntries(aParsed: Parsed, a: CleanerFileItem, bParsed: Parsed, b: CleanerFileItem): Int {
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
