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
        val total = runCatching {
            manager.getTotalBytes(StorageManager.UUID_DEFAULT)
        }.getOrElse { fallbackStatFs().first }
        val free = runCatching {
            manager.getFreeBytes(StorageManager.UUID_DEFAULT)
        }.getOrElse { fallbackStatFs().second }
            .coerceIn(0L, total.coerceAtLeast(0L))

        if (!hasUsageAccess) {
            return@withContext StorageOverview(
                totalBytes = total,
                freeBytes = free,
                appBytes = null,
                imageBytes = null,
                videoBytes = null,
                audioBytes = null,
                otherBytes = null,
                detailed = false
            )
        }

        val userStats = runCatching {
            manager.queryStatsForUser(StorageManager.UUID_DEFAULT, Process.myUserHandle())
        }.getOrNull()
        val external = runCatching {
            manager.queryExternalStatsForUser(StorageManager.UUID_DEFAULT, Process.myUserHandle())
        }.getOrNull()

        val apps = userStats?.let {
            // dataBytes already includes cache, so do not add cacheBytes again.
            (it.appBytes + it.dataBytes).coerceAtLeast(0L)
        }
        val images = external?.imageBytes?.coerceAtLeast(0L)
        val videos = external?.videoBytes?.coerceAtLeast(0L)
        val audio = external?.audioBytes?.coerceAtLeast(0L)
        val detailed = apps != null && external != null
        val used = (total - free).coerceAtLeast(0L)
        val known = listOfNotNull(apps, images, videos, audio).sum()
        val other = if (detailed) (used - known).coerceAtLeast(0L) else null

        StorageOverview(
            totalBytes = total,
            freeBytes = free,
            appBytes = apps,
            imageBytes = images,
            videoBytes = videos,
            audioBytes = audio,
            otherBytes = other,
            detailed = detailed
        )
    }

    private fun fallbackStatFs(): Pair<Long, Long> {
        val stat = StatFs(Environment.getDataDirectory().absolutePath)
        return stat.totalBytes.coerceAtLeast(0L) to stat.availableBytes.coerceAtLeast(0L)
    }
}
