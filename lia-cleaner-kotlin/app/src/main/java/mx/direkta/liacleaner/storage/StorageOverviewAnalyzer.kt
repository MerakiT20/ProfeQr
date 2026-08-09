package mx.direkta.liacleaner.storage

import android.app.usage.StorageStatsManager
import android.content.Context
import android.os.Environment
import android.os.Process
import android.os.StatFs
import android.os.storage.StorageManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

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

class StorageOverviewAnalyzer(private val context: Context) {

    suspend fun load(hasUsageAccess: Boolean): StorageOverview = withContext(Dispatchers.IO) {
        val manager = context.getSystemService(StorageStatsManager::class.java)
        val total = runCatching { manager.getTotalBytes(StorageManager.UUID_DEFAULT) }
            .getOrElse { fallbackStatFs().first }
        val free = runCatching { manager.getFreeBytes(StorageManager.UUID_DEFAULT) }
            .getOrElse { fallbackStatFs().second }
            .coerceIn(0L, total.coerceAtLeast(0L))

        if (!hasUsageAccess) {
            return@withContext StorageOverview(total, free, null, null, null, null, null, false)
        }

        val userStats = runCatching {
            manager.queryStatsForUser(StorageManager.UUID_DEFAULT, Process.myUserHandle())
        }.getOrNull()
        val external = runCatching {
            manager.queryExternalStatsForUser(StorageManager.UUID_DEFAULT, Process.myUserHandle())
        }.getOrNull()

        val used = (total - free).coerceAtLeast(0L)
        val imagesRaw = external?.imageBytes?.coerceAtLeast(0L)
        val videosRaw = external?.videoBytes?.coerceAtLeast(0L)
        val audioRaw = external?.audioBytes?.coerceAtLeast(0L)

        // getFreeBytes() is intended for end-user display and may count reclaimable
        // cache as effectively free. StorageStats.dataBytes includes cache. Remove
        // cache from the Apps bucket so the visual categories use the same accounting
        // basis as the displayed used/free values.
        val appsRaw = userStats?.let {
            (it.appBytes + (it.dataBytes - it.cacheBytes).coerceAtLeast(0L)).coerceAtLeast(0L)
        }

        val detailed = appsRaw != null && external != null
        if (!detailed) {
            return@withContext StorageOverview(total, free, null, null, null, null, null, false)
        }

        // OEM accounting can still differ slightly. Allocate categories against the
        // real used total and clamp sequentially so the donut can never exceed 100%.
        var remaining = used
        val images = (imagesRaw ?: 0L).coerceAtMost(remaining).also { remaining -= it }
        val videos = (videosRaw ?: 0L).coerceAtMost(remaining).also { remaining -= it }
        val audio = (audioRaw ?: 0L).coerceAtMost(remaining).also { remaining -= it }
        val apps = (appsRaw ?: 0L).coerceAtMost(remaining).also { remaining -= it }
        val other = remaining.coerceAtLeast(0L)

        StorageOverview(
            totalBytes = total,
            freeBytes = free,
            appBytes = apps,
            imageBytes = images,
            videoBytes = videos,
            audioBytes = audio,
            otherBytes = other,
            detailed = true
        )
    }

    private fun fallbackStatFs(): Pair<Long, Long> {
        val stat = StatFs(Environment.getDataDirectory().absolutePath)
        return stat.totalBytes.coerceAtLeast(0L) to stat.availableBytes.coerceAtLeast(0L)
    }
}
