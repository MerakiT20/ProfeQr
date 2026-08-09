package mx.direkta.liacleaner.photo

import android.content.Context
import com.google.mediapipe.framework.image.BitmapImageBuilder
import com.google.mediapipe.tasks.components.containers.Embedding
import com.google.mediapipe.tasks.core.BaseOptions
import com.google.mediapipe.tasks.vision.imageembedder.ImageEmbedder
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import mx.direkta.liacleaner.model.PhotoGroup
import mx.direkta.liacleaner.model.PhotoGroupKind
import mx.direkta.liacleaner.model.PhotoItem
import mx.direkta.liacleaner.model.PhotoScanResult
import kotlin.math.abs

class AdvancedPhotoAnalyzer(
    private val context: Context,
    private val photoAnalyzer: PhotoAnalyzer
) {
    suspend fun analyze(
        quickResult: PhotoScanResult,
        onProgress: suspend (done: Int, total: Int) -> Unit = { _, _ -> }
    ): List<PhotoGroup> = withContext(Dispatchers.IO) {
        val alreadyGrouped = quickResult.quickGroups
            .flatMapTo(mutableSetOf()) { group -> group.photos.map { it.id } }
        val candidates = quickResult.photos.filterNot { it.id in alreadyGrouped }
        if (candidates.size < 2) return@withContext emptyList()

        val baseOptions = BaseOptions.builder()
            .setModelAssetPath(MODEL_PATH)
            .build()
        val options = ImageEmbedder.ImageEmbedderOptions.builder()
            .setBaseOptions(baseOptions)
            .setQuantize(false)
            .build()
        val embedder = ImageEmbedder.createFromOptions(context, options)

        try {
            val embeddings = LinkedHashMap<Long, Embedding>(candidates.size)
            candidates.forEachIndexed { index, photo ->
                val bitmap = photoAnalyzer.loadPreview(photo.uri, 256)
                if (bitmap != null) {
                    try {
                        val mpImage = BitmapImageBuilder(bitmap).build()
                        val embedding = embedder.embed(mpImage)
                            .embeddingResult()
                            .embeddings()
                            .firstOrNull()
                        if (embedding != null) embeddings[photo.id] = embedding
                    } finally {
                        bitmap.recycle()
                    }
                }
                onProgress(index + 1, candidates.size)
            }

            if (embeddings.size < 2) return@withContext emptyList()
            buildAiGroups(candidates, embeddings, embedder)
        } finally {
            embedder.close()
        }
    }

    private fun buildAiGroups(
        photos: List<PhotoItem>,
        embeddings: Map<Long, Embedding>,
        embedder: ImageEmbedder
    ): List<PhotoGroup> {
        val byId = photos.associateBy { it.id }
        val buckets = mutableMapOf<String, MutableList<Long>>()
        val pairs = linkedSetOf<IdPair>()

        embeddings.forEach { (id, embedding) ->
            val vector = embedding.floatEmbedding()
            if (vector.isNotEmpty()) {
                for (band in 0 until 4) {
                    var signature = 0
                    for (bit in 0 until 12) {
                        val index = ((band * 97) + (bit * 53)) % vector.size
                        if (vector[index] >= 0f) signature = signature or (1 shl bit)
                    }
                    buckets.getOrPut("$band-$signature") { mutableListOf() }.add(id)
                }
            }
        }

        buckets.values.forEach { ids ->
            if (ids.size in 2..100) {
                for (i in 0 until ids.lastIndex) {
                    for (j in i + 1 until ids.size) {
                        pairs += IdPair.of(ids[i], ids[j])
                    }
                }
            }
        }

        val dated = photos
            .filter { it.id in embeddings && it.dateTakenMs > 0L }
            .sortedBy { it.dateTakenMs }
        val thirtyDays = 30L * 24L * 60L * 60L * 1000L
        dated.forEachIndexed { index, first ->
            val limit = minOf(dated.size, index + 21)
            for (j in index + 1 until limit) {
                val second = dated[j]
                if (second.dateTakenMs - first.dateTakenMs > thirtyDays) break
                pairs += IdPair.of(first.id, second.id)
            }
        }

        val unionFind = UnionFind(embeddings.keys.toList())
        val acceptedScores = mutableMapOf<IdPair, Double>()

        pairs.forEach { pair ->
            val firstPhoto = byId[pair.a] ?: return@forEach
            val secondPhoto = byId[pair.b] ?: return@forEach
            val firstEmbedding = embeddings[pair.a] ?: return@forEach
            val secondEmbedding = embeddings[pair.b] ?: return@forEach
            val similarity = ImageEmbedder.cosineSimilarity(firstEmbedding, secondEmbedding)

            if (acceptSimilarity(firstPhoto, secondPhoto, similarity)) {
                unionFind.union(pair.a, pair.b)
                acceptedScores[pair] = similarity
            }
        }

        return unionFind.groups()
            .mapNotNull { ids ->
                if (ids.size < 2) return@mapNotNull null
                val groupPhotos = ids.mapNotNull(byId::get)
                if (groupPhotos.size < 2) return@mapNotNull null

                val groupIdSet = groupPhotos.mapTo(mutableSetOf()) { it.id }
                val scores = acceptedScores
                    .filterKeys { it.a in groupIdSet && it.b in groupIdSet }
                    .values
                val representativeSimilarity = scores.average().takeIf { !it.isNaN() }

                PhotoGroup(
                    id = "ai-${groupPhotos.minOf { it.id }}",
                    kind = PhotoGroupKind.AI_SIMILAR,
                    photos = groupPhotos.sortedByDescending { it.sizeBytes },
                    similarity = representativeSimilarity
                )
            }
            .sortedByDescending { it.recoverableBytes }
    }

    private fun acceptSimilarity(
        first: PhotoItem,
        second: PhotoItem,
        similarity: Double
    ): Boolean {
        val ratio1 = if (first.height > 0) first.width.toDouble() / first.height else 0.0
        val ratio2 = if (second.height > 0) second.width.toDouble() / second.height else 0.0
        val aspectClose = ratio1 == 0.0 || ratio2 == 0.0 || abs(ratio1 - ratio2) <= 0.25
        val timeClose = first.dateTakenMs > 0L && second.dateTakenMs > 0L &&
            abs(first.dateTakenMs - second.dateTakenMs) <= 24L * 60L * 60L * 1000L

        return similarity >= 0.985 ||
            (similarity >= 0.970 && aspectClose) ||
            (similarity >= 0.960 && aspectClose && timeClose)
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

    companion object {
        const val MODEL_PATH = "mobilenet_v3_small.tflite"
    }
}
