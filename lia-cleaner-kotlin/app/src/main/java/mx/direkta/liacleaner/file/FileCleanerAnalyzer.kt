package mx.direkta.liacleaner.file

import android.content.ContentUris
import android.content.Context
import android.content.Intent
import android.media.MediaScannerConnection
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.provider.Settings
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileInputStream
import java.security.MessageDigest

class FileCleanerAnalyzer(private val context: Context) {

    enum class ScanPhase { DISCOVERING, CATALOGING, HASHING_DUPLICATES, FINALIZING }

    fun hasBroadFileAccess(): Boolean = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        Environment.isExternalStorageManager()
    } else true

    fun openBroadFileAccessSettings() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            context.startActivity(
                Intent(
                    Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION,
                    Uri.parse("package:${context.packageName}")
                ).apply { addFlags(Intent.FLAG_ACTIVITY_NEW_TASK) }
            )
        }
    }

    suspend fun scan(
        onProgress: suspend (done: Int, total: Int) -> Unit = { _, _ -> }
    ): FileScanResult = scanDetailed { _, done, total -> onProgress(done, total) }

    suspend fun scanDetailed(
        onProgress: suspend (phase: ScanPhase, done: Int, total: Int) -> Unit = { _, _, _ -> }
    ): FileScanResult = withContext(Dispatchers.IO) {
        if (!hasBroadFileAccess()) error("Falta acceso especial a todos los archivos.")

        val root = Environment.getExternalStorageDirectory()
        val downloadMetadata = queryDownloadMetadata()
        val roots = PUBLIC_DIRS.map { File(root, it) }.filter { it.exists() && it.canRead() }

        val discovered = mutableListOf<File>()
        roots.forEachIndexed { index, dir ->
            collectFiles(dir, discovered)
            onProgress(ScanPhase.DISCOVERING, index + 1, roots.size)
        }

        val total = discovered.size
        val items = ArrayList<CleanerFileItem>(total)
        discovered.forEachIndexed { index, file ->
            val relative = runCatching {
                file.parentFile?.relativeTo(root)?.path?.replace(File.separatorChar, '/')?.let {
                    if (it.isBlank()) "" else "$it/"
                } ?: ""
            }.getOrDefault("")
            val metadata = downloadMetadata["${relative}${file.name}".lowercase()]
            items += CleanerFileItem(
                file = file,
                name = file.name,
                sizeBytes = file.length().coerceAtLeast(0L),
                modifiedMs = file.lastModified().coerceAtLeast(0L),
                addedMs = metadata?.addedMs,
                relativePath = relative,
                kind = kindFor(file.name),
                isDownload = relative.startsWith("Download/", true) || relative.startsWith("Downloads/", true)
            )
            if (index + 1 == total || (index + 1) % 50 == 0) onProgress(ScanPhase.CATALOGING, index + 1, total)
        }

        val candidateGroups = items.filter { it.sizeBytes > 0L }.groupBy { it.sizeBytes }.values.filter { it.size > 1 }
        val hashTotal = candidateGroups.sumOf { it.size }
        var hashed = 0
        val duplicates = mutableListOf<DuplicateFileGroup>()
        candidateGroups.forEach { sameSize ->
            val byDigest = sameSize.mapNotNull { item ->
                val digest = sha256(item.file)
                hashed++
                if (hashed == hashTotal || hashed % 10 == 0) onProgress(ScanPhase.HASHING_DUPLICATES, hashed, hashTotal)
                digest?.let { it to item }
            }.groupBy({ it.first }, { it.second })
            byDigest.forEach { (digest, matches) ->
                if (matches.size > 1) duplicates += DuplicateFileGroup(digest, matches.sortedByDescending { it.bestDateMs })
            }
        }

        onProgress(ScanPhase.FINALIZING, 1, 1)
        FileScanResult(
            files = items.sortedByDescending { it.sizeBytes },
            duplicateGroups = duplicates.sortedByDescending { it.recoverableBytes }
        )
    }

    fun deleteFiles(files: List<CleanerFileItem>): DeleteResult {
        var deletedCount = 0
        var deletedBytes = 0L
        val failed = mutableListOf<String>()

        files.distinctBy { it.file.absolutePath }.forEach { item ->
            val success = deleteSharedFile(item)
            if (success) {
                deletedCount++
                deletedBytes += item.sizeBytes
            } else failed += item.name
        }
        return DeleteResult(deletedCount, deletedBytes, failed)
    }

    private fun deleteSharedFile(item: CleanerFileItem): Boolean {
        if (!isAllowedPath(item.file)) return false
        val path = item.file.absolutePath

        // MANAGE_EXTERNAL_STORAGE grants access to MediaStore.Files as well as direct
        // shared-storage paths. Prefer deleting an indexed row so Android updates its
        // media database atomically with the underlying file.
        if (deleteMediaStoreEntry(path) == true) return true

        val direct = runCatching { item.file.delete() }.getOrDefault(false)
        if (direct && (item.kind == CleanerFileKind.IMAGE || item.kind == CleanerFileKind.VIDEO || item.kind == CleanerFileKind.AUDIO)) {
            MediaScannerConnection.scanFile(context, arrayOf(path), null, null)
        }
        return direct
    }

    private fun deleteMediaStoreEntry(path: String): Boolean? = runCatching {
        val filesUri = MediaStore.Files.getContentUri("external")
        context.contentResolver.query(
            filesUri,
            arrayOf(MediaStore.Files.FileColumns._ID),
            "${MediaStore.MediaColumns.DATA}=?",
            arrayOf(path),
            null
        )?.use { cursor ->
            if (!cursor.moveToFirst()) return@use null
            val rowUri = ContentUris.withAppendedId(filesUri, cursor.getLong(0))
            context.contentResolver.delete(rowUri, null, null) > 0
        }
    }.getOrNull()

    private fun collectFiles(directory: File, output: MutableList<File>) {
        val children = runCatching { directory.listFiles() }.getOrNull() ?: return
        children.forEach { file ->
            if (file.isDirectory) {
                if (!file.isHidden && file.name != ".thumbnails") collectFiles(file, output)
            } else if (file.isFile && file.canRead() && !file.isHidden && file.length() > 0L) output += file
        }
    }

    private fun isAllowedPath(file: File): Boolean {
        val root = Environment.getExternalStorageDirectory().canonicalFile
        val canonical = runCatching { file.canonicalFile }.getOrNull() ?: return false
        if (!canonical.path.startsWith(root.path + File.separator)) return false
        val relative = runCatching { canonical.relativeTo(root).path }.getOrNull() ?: return false
        val top = relative.substringBefore(File.separator)
        return PUBLIC_DIRS.any { it.equals(top, true) }
    }

    private fun sha256(file: File): String? = runCatching {
        val digest = MessageDigest.getInstance("SHA-256")
        FileInputStream(file).use { input ->
            val buffer = ByteArray(DEFAULT_BUFFER_SIZE * 4)
            while (true) {
                val count = input.read(buffer)
                if (count <= 0) break
                digest.update(buffer, 0, count)
            }
        }
        digest.digest().joinToString("") { "%02x".format(it) }
    }.getOrNull()

    private fun queryDownloadMetadata(): Map<String, DownloadMetadata> {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return emptyMap()
        val output = mutableMapOf<String, DownloadMetadata>()
        val uri = MediaStore.Downloads.getContentUri(MediaStore.VOLUME_EXTERNAL)
        val projection = arrayOf(MediaStore.Downloads.DISPLAY_NAME, MediaStore.Downloads.RELATIVE_PATH, MediaStore.Downloads.DATE_ADDED, MediaStore.Downloads.DATE_MODIFIED)
        runCatching {
            context.contentResolver.query(uri, projection, null, null, null)?.use { cursor ->
                val nameIndex = cursor.getColumnIndexOrThrow(MediaStore.Downloads.DISPLAY_NAME)
                val pathIndex = cursor.getColumnIndexOrThrow(MediaStore.Downloads.RELATIVE_PATH)
                val addedIndex = cursor.getColumnIndexOrThrow(MediaStore.Downloads.DATE_ADDED)
                val modifiedIndex = cursor.getColumnIndexOrThrow(MediaStore.Downloads.DATE_MODIFIED)
                while (cursor.moveToNext()) {
                    val name = cursor.getString(nameIndex) ?: continue
                    val path = cursor.getString(pathIndex).orEmpty()
                    val added = cursor.getLong(addedIndex).takeIf { it > 0L }?.times(1000L)
                    val modified = cursor.getLong(modifiedIndex).takeIf { it > 0L }?.times(1000L)
                    output["$path$name".lowercase()] = DownloadMetadata(added, modified)
                }
            }
        }
        return output
    }

    private fun kindFor(name: String): CleanerFileKind = when (name.substringAfterLast('.', "").lowercase()) {
        "jpg", "jpeg", "png", "webp", "gif", "heic", "heif", "bmp" -> CleanerFileKind.IMAGE
        "mp4", "mkv", "avi", "mov", "webm", "3gp", "m4v" -> CleanerFileKind.VIDEO
        "mp3", "aac", "m4a", "wav", "flac", "ogg", "opus" -> CleanerFileKind.AUDIO
        "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "rtf", "csv", "odt", "ods", "odp" -> CleanerFileKind.DOCUMENT
        "zip", "rar", "7z", "tar", "gz", "bz2", "xz" -> CleanerFileKind.ARCHIVE
        "apk", "apks", "xapk" -> CleanerFileKind.APK
        else -> CleanerFileKind.OTHER
    }

    data class DeleteResult(val deletedCount: Int, val deletedBytes: Long, val failedNames: List<String>)
    private data class DownloadMetadata(val addedMs: Long?, val modifiedMs: Long?)

    companion object {
        private val PUBLIC_DIRS = listOf(
            Environment.DIRECTORY_DOWNLOADS, Environment.DIRECTORY_DOCUMENTS, Environment.DIRECTORY_DCIM,
            Environment.DIRECTORY_PICTURES, Environment.DIRECTORY_MOVIES, Environment.DIRECTORY_MUSIC,
            Environment.DIRECTORY_PODCASTS, Environment.DIRECTORY_RINGTONES
        )
    }
}
