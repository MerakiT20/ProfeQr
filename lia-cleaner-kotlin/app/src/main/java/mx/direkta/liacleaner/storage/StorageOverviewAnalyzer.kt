package mx.direkta.liacleaner.storage

import android.app.usage.StorageStatsManager
import android.content.Context
import android.os.Environment
import android.os.Process
import android.os.StatFs
import android.os.storage.StorageManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlin.math.roundToLong

data class StorageOverview(
    val totalBytes: Long,
    val freeBytes: Long,
    val appBytes: Long?,
    val imageBytes: Long?,
    val videoBytes: Long?,
    val audioBytes: Long?,
    val otherBytes: Long?,
    val detailed: Boolean
) {
    val usedBytes: Long get() = (totalBytes - freeBytes).coerceAtLeast(0L)
}

data class ReconciledStorage(
    val apps: Long,
    val images: Long,
    val videos: Long,
    val audio: Long,
    val other: Long
)

object StorageCategoryReconciler {
    /**
     * OEMs can report category accounting on a different basis than getFreeBytes().
     * When categories exceed displayed used bytes, scale all known categories
     * proportionally instead of truncating whichever category happens to be last.
     */
    fun reconcile(used: Long, apps: Long, images: Long, videos: Long, audio: Long): ReconciledStorage {
        val safeUsed = used.coerceAtLeast(0L)
        val raw = longArrayOf(apps, images, videos, audio).map { it.coerceAtLeast(0L) }
        val sum = raw.sum()
        if (sum <= safeUsed || sum == 0L) {
            return ReconciledStorage(raw[0], raw[1], raw[2], raw[3], (safeUsed - sum).coerceAtLeast(0L))
        }
        val factor = safeUsed.toDouble() / sum.toDouble()
        val scaled = raw.map { (it * factor).roundToLong().coerceAtLeast(0L) }.toMutableList()
        var scaledSum = scaled.sum()
        if (scaledSum > safeUsed) {
            var excess = scaledSum - safeUsed
            for (i in scaled.indices.reversed()) {
                if (excess <= 0L) break
                val remove = minOf(excess, scaled[i])
                scaled[i] -= remove
                excess -= remove
            }
            scaledSum = scaled.sum()
        }
        return ReconciledStorage(scaled[0], scaled[1], scaled[2], scaled[3], (safeUsed - scaledSum).coerceAtLeast(0L))
    }
}

class StorageOverviewAnalyzer(private val context: Context) {

    suspend fun load(hasUsageAccess: Boolean): StorageOverview = withContext(Dispatchers.IO) {
        val manager = context.getSystemService(StorageStatsManager::class.java)
        val total = runCatching { manager.getTotalBytes(StorageManager.UUID_DEFAULT) }
            .getOrElse { fallbackStatFs().first }
        val free = runCatching { manager.getFreeBytes(StorageManager.UUID_DEFAULT) }
            .getOrElse { fallbackStatFs().second }
            .coerceIn(0L, total.coerceAtLeast(0L))

        if (!hasUsageAccess) return@withContext StorageOverview(total, free, null, null, null, null, null, false)

        val userStats = runCatching { manager.queryStatsForUser(StorageManager.UUID_DEFAULT, Process.myUserHandle()) }.getOrNull()
        val external = runCatching { manager.queryExternalStatsForUser(StorageManager.UUID_DEFAULT, Process.myUserHandle()) }.getOrNull()
        val used = (total - free).coerceAtLeast(0L)

        val appsRaw = userStats?.let {
            (it.appBytes + (it.dataBytes - it.cacheBytes).coerceAtLeast(0L)).coerceAtLeast(0L)
        }
        val detailed = appsRaw != null && external != null
        if (!detailed) return@withContext StorageOverview(total, free, null, null, null, null, null, false)

        val reconciled = StorageCategoryReconciler.reconcile(
            used = used,
            apps = appsRaw ?: 0L,
            images = external?.imageBytes ?: 0L,
            videos = external?.videoBytes ?: 0L,
            audio = external?.audioBytes ?: 0L
        )

        StorageOverview(
            totalBytes = total,
            freeBytes = free,
            appBytes = reconciled.apps,
            imageBytes = reconciled.images,
            videoBytes = reconciled.videos,
            audioBytes = reconciled.audio,
            otherBytes = reconciled.other,
            detailed = true
        )
    }

    private fun fallbackStatFs(): Pair<Long, Long> {
        val stat = StatFs(Environment.getDataDirectory().absolutePath)
        return stat.totalBytes.coerceAtLeast(0L) to stat.availableBytes.coerceAtLeast(0L)
    }
}
