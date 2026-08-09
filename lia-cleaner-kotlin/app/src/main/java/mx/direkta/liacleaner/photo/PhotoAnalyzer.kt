package mx.direkta.liacleaner.photo

import android.Manifest
import android.content.ContentUris
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import android.util.Size
import androidx.core.content.ContextCompat
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import mx.direkta.liacleaner.model.PhotoGroup
import mx.direkta.liacleaner.model.PhotoGroupKind
import mx.direkta.liacleaner.model.PhotoItem
import mx.direkta.liacleaner.model.PhotoScanResult
import java.security.MessageDigest
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.cos

class PhotoAnalyzer(
    private val context: Context
) {
    private val resolver = context.contentResolver
    private val cache = PhotoHashCache(context)

    fun hasPhotoAccess(): Boolean {
        return when {
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU -> {
                val full = ContextCompat.checkSelfPermission(
                    context,
                    Manifest.permission.READ_MEDIA_IMAGES
                ) == PackageManager.PERMISSION_GRANTED
                val partial = Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE &&
                    ContextCompat.checkSelfPermission(
                        context,
                        Manifest.permission.READ_MEDIA_VISUAL_USER_SELECTED
                    ) == PackageManager.PERMISSION_GRANTED
                full || partial
            }
            else -> ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.READ_EXTERNAL_STORAGE
            ) == PackageManager.PERMISSION_GRANTED
        }
    }

    suspend fun quickScan(
        onProgress: suspend (done: Int, total: Int) -> Unit = { _, _ -> }
    ): PhotoScanResult = withContext(Dispatchers.IO) {
        val photos = queryPhotos()
        cache.removeMissing(photos.mapTo(mutableSetOf()) { it.id })

        val duplicateSizeIds = photos
            .asSequence()
            .filter { it.sizeBytes > 0L }
            .groupBy { it.sizeBytes }
            .values
            .filter { it.size > 1 }
            .flatten()
            .mapTo(mutableSetOf()) { it.id }

        val analyzed = ArrayList<PhotoItem>(photos.size)
        photos.forEachIndexed { index, photo ->
            val cached = cache.get(photo.id, photo.sizeBytes, photo.dateModifiedMs)
            var sha = cached?.sha256
            var dHash = cached?.dHash
            var pHash = cached?.pHash

            if (photo.id in duplicateSizeIds && sha == null) {
                sha = computeSha256(photo.uri)
            }

            if (dHash == null || pHash == null) {
                decodeSmallBitmap(photo.uri)?.let { bitmap ->
                    try {
                        if (dHash == null) dHash = calculateDHash(bitmap)
                        if (pHash == null) pHash = calculatePHash(bitmap)
                    } finally {
                        bitmap.recycle()
                    }
                }
            }

            cache.put(
                CachedPhotoHash(
                    id = photo.id,
                    sizeBytes = photo.sizeBytes,
                    modifiedMs = photo.dateModifiedMs,
                    sha256 = sha,
                    dHash = dHash,
                    pHash = pHash
                )
            )

            analyzed += photo.copy(sha256 = sha, dHash = dHash, pHash = pHash)
            onProgress(index + 1, photos.size)
        }

        val exactGroups = analyzed
            .filter { it.sha256 != null }
            .groupBy { it.sha256!! }
            .filterValues { it.size > 1 }
            .map { (sha, items) ->
                PhotoGroup(
                    id = "exact-${sha.take(16)}",
                    kind = PhotoGroupKind.EXACT,
                    photos = items.sortedByDescending { it.sizeBytes },
                    similarity = 1.0
                )
            }
            .sortedByDescending { it.recoverableBytes }

        val exactExtraIds = exactGroups.flatMap { group ->
            group.photos.drop(1).map { it.id }
        }.toSet()

        val nearInput = analyzed.filterNot { it.id in exactExtraIds }
        val nearGroups = buildNearDuplicateGroups(nearInput)

        PhotoScanResult(
            photos = analyzed,
            exactGroups = exactGroups,
            nearGroups = nearGroups
        )
    }

    private fun queryPhotos(): List<PhotoItem> {
        val collection = MediaStore.Images.Media.EXTERNAL_CONTENT_URI
        val projection = arrayOf(
            MediaStore.Images.Media._ID,
            MediaStore.Images.Media.DISPLAY_NAME,
            MediaStore.Images.Media.SIZE,
            MediaStore.Images.Media.WIDTH,
            MediaStore.Images.Media.HEIGHT,
            MediaStore.Images.Media.DATE_TAKEN,
            MediaStore.Images.Media.DATE_MODIFIED
        )

        val output = mutableListOf<PhotoItem>()
        resolver.query(
            collection,
            projection,
            null,
            null,
            "${MediaStore.Images.Media.DATE_TAKEN} DESC"
        )?.use { cursor ->
            val idCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media._ID)
            val nameCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DISPLAY_NAME)
            val sizeCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.SIZE)
            val widthCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.WIDTH)
            val heightCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.HEIGHT)
            val takenCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DATE_TAKEN)
            val modifiedCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DATE_MODIFIED)

            while (cursor.moveToNext()) {
                val id = cursor.getLong(idCol)
                val uri = ContentUris.withAppendedId(collection, id)
                output += PhotoItem(
                    id = id,
                    uri = uri,
                    name = cursor.getString(nameCol) ?: "Foto $id",
                    sizeBytes = cursor.getLong(sizeCol).coerceAtLeast(0L),
                    width = cursor.getInt(widthCol).coerceAtLeast(0),
                    height = cursor.getInt(heightCol).coerceAtLeast(0),
                    dateTakenMs = cursor.getLong(takenCol).coerceAtLeast(0L),
                    dateModifiedMs = cursor.getLong(modifiedCol).coerceAtLeast(0L) * 1000L
                )
            }
        }
        return output
    }

    private fun computeSha256(uri: Uri): String? = runCatching {
        val digest = MessageDigest.getInstance("SHA-256")
        resolver.openInputStream(uri)?.use { input ->
            val buffer = ByteArray(DEFAULT_BUFFER_SIZE)
            while (true) {
                val read = input.read(buffer)
                if (read <= 0) break
                digest.update(buffer, 0, read)
            }
        } ?: return@runCatching null
        digest.digest().joinToString("") { byte -> "%02x".format(byte) }
    }.getOrNull()

    fun loadPreview(uri: Uri, edge: Int = 256): Bitmap? = runCatching {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            resolver.loadThumbnail(uri, Size(edge, edge), null)
        } else {
            decodeSampledBitmap(uri, edge, edge)
        }
    }.getOrNull()

    private fun decodeSmallBitmap(uri: Uri): Bitmap? = loadPreview(uri, 256)

    private fun decodeSampledBitmap(uri: Uri, requestedWidth: Int, requestedHeight: Int): Bitmap? {
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        resolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, bounds) }
        if (bounds.outWidth <= 0 || bounds.outHeight <= 0) return null

        var sample = 1
        while (
            bounds.outWidth / (sample * 2) >= requestedWidth &&
            bounds.outHeight / (sample * 2) >= requestedHeight
        ) {
            sample *= 2
        }

        val options = BitmapFactory.Options().apply { inSampleSize = sample }
        return resolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, options) }
    }

    private fun calculateDHash(source: Bitmap): Long {
        val bitmap = Bitmap.createScaledBitmap(source, 9, 8, true)
        var hash = 0L
        var bit = 0
        try {
            for (y in 0 until 8) {
                for (x in 0 until 8) {
                    val left = luminance(bitmap.getPixel(x, y))
                    val right = luminance(bitmap.getPixel(x + 1, y))
                    if (left > right) hash = hash or (1L shl bit)
                    bit++
                }
            }
        } finally {
            if (bitmap !== source) bitmap.recycle()
        }
        return hash
    }

    private fun calculatePHash(source: Bitmap): Long {
        val size = 32
        val bitmap = Bitmap.createScaledBitmap(source, size, size, true)
        val gray = Array(size) { DoubleArray(size) }
        try {
            for (x in 0 until size) {
                for (y in 0 until size) {
                    gray[x][y] = luminance(bitmap.getPixel(x, y)).toDouble()
                }
            }
        } finally {
            if (bitmap !== source) bitmap.recycle()
        }

        val coeffs = DoubleArray(64)
        var index = 0
        for (u in 0 until 8) {
            for (v in 0 until 8) {
                var sum = 0.0
                for (x in 0 until size) {
                    val cx = cos(((2 * x + 1) * u * PI) / (2.0 * size))
                    for (y in 0 until size) {
                        val cy = cos(((2 * y + 1) * v * PI) / (2.0 * size))
                        sum += gray[x][y] * cx * cy
                    }
                }
                coeffs[index++] = sum
            }
        }

        val medianValues = coeffs.copyOfRange(1, coeffs.size).sorted()
        val median = medianValues[medianValues.size / 2]
        var hash = 0L
        coeffs.forEachIndexed { i, value ->
            if (value > median) hash = hash or (1L shl i)
        }
        return hash
    }

    private fun luminance(color: Int): Int {
        val r = (color shr 16) and 0xff
        val g = (color shr 8) and 0xff
        val b = color and 0xff
        return ((299 * r + 587 * g + 114 * b) / 1000)
    }

    private fun buildNearDuplicateGroups(photos: List<PhotoItem>): List<PhotoGroup> {
        if (photos.size < 2) return emptyList()

        val byId = photos.associateBy { it.id }
        val candidates = linkedSetOf<IdPair>()
        val buckets = mutableMapOf<String, MutableList<Long>>()

        photos.forEach { photo ->
            addHashBuckets(buckets, "p", photo.id, photo.pHash)
            addHashBuckets(buckets, "d", photo.id, photo.dHash)
        }

        buckets.values.forEach { ids ->
            if (ids.size in 2..80) {
                for (i in 0 until ids.lastIndex) {
                    for (j in i + 1 until ids.size) {
                        candidates += IdPair.of(ids[i], ids[j])
                    }
                }
            }
        }

        val dated = photos
            .filter { it.dateTakenMs > 0L }
            .sortedBy { it.dateTakenMs }
        val sevenDaysMs = 7L * 24L * 60L * 60L * 1000L
        dated.forEachIndexed { i, first ->
            val max = minOf(dated.size, i + 31)
            for (j in i + 1 until max) {
                val second = dated[j]
                if (second.dateTakenMs - first.dateTakenMs > sevenDaysMs) break
                candidates += IdPair.of(first.id, second.id)
            }
        }

        val unionFind = UnionFind(photos.map { it.id })
        candidates.forEach { pair ->
            val first = byId[pair.a] ?: return@forEach
            val second = byId[pair.b] ?: return@forEach
            if (looksNearlyIdentical(first, second)) {
                unionFind.union(first.id, second.id)
            }
        }

        return unionFind.groups()
            .mapNotNull { ids ->
                if (ids.size < 2) return@mapNotNull null
                val groupPhotos = ids.mapNotNull(byId::get)
                if (groupPhotos.size < 2) return@mapNotNull null
                PhotoGroup(
                    id = "near-${groupPhotos.minOf { it.id }}",
                    kind = PhotoGroupKind.NEAR_DUPLICATE,
                    photos = groupPhotos.sortedByDescending { it.sizeBytes }
                )
            }
            .sortedByDescending { it.recoverableBytes }
    }

    private fun addHashBuckets(
        buckets: MutableMap<String, MutableList<Long>>,
        prefix: String,
        id: Long,
        hash: Long?
    ) {
        if (hash == null) return
        for (chunk in 0 until 4) {
            val value = (hash ushr (chunk * 16)) and 0xffffL
            buckets.getOrPut("$prefix-$chunk-$value") { mutableListOf() }.add(id)
        }
    }

    private fun looksNearlyIdentical(first: PhotoItem, second: PhotoItem): Boolean {
        val p1 = first.pHash ?: return false
        val p2 = second.pHash ?: return false
        val d1 = first.dHash ?: return false
        val d2 = second.dHash ?: return false

        val pDistance = java.lang.Long.bitCount(p1 xor p2)
        val dDistance = java.lang.Long.bitCount(d1 xor d2)
        val firstRatio = if (first.height > 0) first.width.toDouble() / first.height else 0.0
        val secondRatio = if (second.height > 0) second.width.toDouble() / second.height else 0.0
        val aspectClose = firstRatio == 0.0 || secondRatio == 0.0 || abs(firstRatio - secondRatio) <= 0.10

        return (pDistance <= 8 && dDistance <= 10) ||
            (aspectClose && pDistance <= 10 && dDistance <= 7)
    }

    private data class IdPair(val a: Long, val b: Long) {
        companion object {
            fun of(first: Long, second: Long): IdPair =
                if (first <= second) IdPair(first, second) else IdPair(second, first)
        }
    }

    private class UnionFind(ids: List<Long>) {
        private val parent = ids.associateWith { it }.toMutableMap()

        private fun find(id: Long): Long {
            val p = parent[id] ?: id
            if (p == id) return id
            val root = find(p)
            parent[id] = root
            return root
        }

        fun union(a: Long, b: Long) {
            val rootA = find(a)
            val rootB = find(b)
            if (rootA != rootB) parent[rootB] = rootA
        }

        fun groups(): List<List<Long>> = parent.keys
            .groupBy { find(it) }
            .values
            .map { it.toList() }
    }
}
