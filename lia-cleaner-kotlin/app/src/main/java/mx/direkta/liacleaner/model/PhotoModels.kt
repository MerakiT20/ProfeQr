package mx.direkta.liacleaner.model

import android.net.Uri

data class PhotoItem(
    val id: Long,
    val uri: Uri,
    val name: String,
    val sizeBytes: Long,
    val width: Int,
    val height: Int,
    val dateTakenMs: Long,
    val dateModifiedMs: Long,
    val sha256: String? = null,
    val dHash: Long? = null,
    val pHash: Long? = null
)

enum class PhotoGroupKind {
    EXACT,
    NEAR_DUPLICATE,
    AI_SIMILAR
}

data class PhotoGroup(
    val id: String,
    val kind: PhotoGroupKind,
    val photos: List<PhotoItem>,
    val similarity: Double? = null
) {
    val recoverableBytes: Long
        get() {
            if (photos.size < 2) return 0L
            val total = photos.sumOf { it.sizeBytes }
            val keep = photos.maxOfOrNull { it.sizeBytes } ?: 0L
            return (total - keep).coerceAtLeast(0L)
        }
}

data class PhotoScanResult(
    val photos: List<PhotoItem>,
    val exactGroups: List<PhotoGroup>,
    val nearGroups: List<PhotoGroup>,
    val analyzedAtMs: Long = System.currentTimeMillis()
) {
    val quickGroups: List<PhotoGroup>
        get() = exactGroups + nearGroups

    val recoverableBytes: Long
        get() = quickGroups.sumOf { it.recoverableBytes }
}
