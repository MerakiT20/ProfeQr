package mx.direkta.liacleaner.system

import android.app.AppOpsManager
import android.app.usage.StorageStatsManager
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Process
import android.provider.Settings
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import mx.direkta.liacleaner.model.AppCandidate
import mx.direkta.liacleaner.model.Recommendation

class AndroidSystemGatewayImpl(
    private val context: Context
) : AndroidSystemGateway {

    private val packageManager = context.packageManager

    override suspend fun hasUsageAccess(): Boolean = withContext(Dispatchers.IO) {
        val appOps = context.getSystemService(AppOpsManager::class.java)
        val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            appOps.unsafeCheckOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                context.packageName
            )
        } else {
            @Suppress("DEPRECATION")
            appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                context.packageName
            )
        }
        mode == AppOpsManager.MODE_ALLOWED
    }

    override fun openUsageAccessSettings() {
        val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
    }

    override suspend fun installedApps(): List<AppCandidate> = withContext(Dispatchers.IO) {
        val usageAllowed = hasUsageAccess()
        val now = System.currentTimeMillis()
        val dayMs = 24L * 60L * 60L * 1000L
        val twoYearsAgo = now - 730L * dayMs
        val ninetyDaysAgo = now - 90L * dayMs

        val usageManager = if (usageAllowed) {
            context.getSystemService(UsageStatsManager::class.java)
        } else {
            null
        }

        val lastUseMap = usageManager?.queryAndAggregateUsageStats(twoYearsAgo, now) ?: emptyMap()
        val recentUsageMap = usageManager?.queryAndAggregateUsageStats(ninetyDaysAgo, now) ?: emptyMap()

        val storageManager = if (usageAllowed) {
            context.getSystemService(StorageStatsManager::class.java)
        } else {
            null
        }

        val installed = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            packageManager.getInstalledApplications(PackageManager.ApplicationInfoFlags.of(0))
        } else {
            @Suppress("DEPRECATION")
            packageManager.getInstalledApplications(0)
        }

        installed.asSequence()
            .filter { it.packageName != context.packageName }
            .filter { it.enabled }
            .filter { (it.flags and ApplicationInfo.FLAG_SYSTEM) == 0 }
            .map { appInfo ->
                val longStats = lastUseMap[appInfo.packageName]
                val recentStats = recentUsageMap[appInfo.packageName]
                val lastTimeUsed = longStats?.lastTimeUsed?.takeIf { it > 0L }
                val daysSinceLastUse = lastTimeUsed?.let {
                    ((now - it).coerceAtLeast(0L) / dayMs).toInt()
                }

                val sizeBytes = if (storageManager != null) {
                    runCatching {
                        val storageStats = storageManager.queryStatsForPackage(
                            appInfo.storageUuid,
                            appInfo.packageName,
                            Process.myUserHandle()
                        )
                        storageStats.appBytes + storageStats.dataBytes + storageStats.cacheBytes
                    }.getOrNull()
                } else {
                    null
                }

                val recommendation = when {
                    !usageAllowed -> Recommendation.REVIEW
                    daysSinceLastUse == null -> Recommendation.REVIEW
                    daysSinceLastUse >= 180 -> Recommendation.REMOVE
                    daysSinceLastUse >= 90 -> Recommendation.REVIEW
                    else -> Recommendation.KEEP
                }

                AppCandidate(
                    name = packageManager.getApplicationLabel(appInfo).toString(),
                    packageName = appInfo.packageName,
                    sizeBytes = sizeBytes,
                    daysSinceLastUse = daysSinceLastUse,
                    totalTimeInForegroundMs = recentStats?.totalTimeInForeground ?: 0L,
                    recommendation = recommendation
                )
            }
            .sortedWith(
                compareByDescending<AppCandidate> { it.daysSinceLastUse ?: -1 }
                    .thenByDescending { it.sizeBytes ?: 0L }
            )
            .toList()
    }

    @Suppress("DEPRECATION")
    override fun requestUninstall(packageName: String) {
        val intent = Intent(Intent.ACTION_UNINSTALL_PACKAGE).apply {
            data = Uri.parse("package:$packageName")
            putExtra(Intent.EXTRA_RETURN_RESULT, false)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
    }
}
