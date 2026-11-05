package mx.direkta.liacleaner.file

import java.io.File

enum class CleanerFileKind {
    IMAGE,
    VIDEO,
    AUDIO,
    DOCUMENT,
    ARCHIVE,
    APK,
    OTHER
}

data class CleanerFileItem(
    val file: File,
    val name: String,
    val sizeBytes: Long,
    val modifiedMs: Long,
    val addedMs: Long?,
    val relativePath: String,
    val kind: CleanerFileKind,
    val isDownload: Boolean
) {
    val bestDateMs: Long get() = addedMs?.takeIf { it > 0L } ?: modifiedMs
}

data class DuplicateFileGroup(
    val sha256: String,
    val files: List<CleanerFileItem>
) {
    val recoverableBytes: Long
        get() = files.sortedByDescending { it.bestDateMs }.drop(1).sumOf { it.sizeBytes }

    val keep: CleanerFileItem
        get() = files.maxByOrNull { it.bestDateMs } ?: files.first()
}

data class FileScanResult(
    val files: List<CleanerFileItem>,
    val duplicateGroups: List<DuplicateFileGroup>
) {
    val totalBytes: Long get() = files.sumOf { it.sizeBytes }
    val downloadFiles: List<CleanerFileItem> get() = files.filter { it.isDownload }
    val duplicateRecoverableBytes: Long get() = duplicateGroups.sumOf { it.recoverableBytes }
}

enum class FileViewMode {
    ALL,
    LARGE,
    DOWNLOADS,
    DUPLICATES
}

enum class FileSortMode {
    SIZE,
    DATE,
    NAME
}
