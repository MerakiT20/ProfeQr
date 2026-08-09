package mx.direkta.liacleaner.system

import android.accounts.AccountManager
import android.app.AppOpsManager
import android.app.usage.StorageStatsManager
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageInfo
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Process
import android.provider.Settings
import android.provider.Telephony
import android.telecom.TelecomManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import mx.direkta.liacleaner.model.AppCandidate
import mx.direkta.liacleaner.model.AppRecommendationEngine
import java.io.File

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

        // Several OEMs, including some Xiaomi/HyperOS builds, can return sparse data
        // from queryAndAggregateUsageStats() over long ranges. Query explicit buckets
        // first, then use the aggregate API as fallback.
        val longUsage = if (usageManager != null) {
            val monthly = queryUsage(usageManager, UsageStatsManager.INTERVAL_MONTHLY, twoYearsAgo, now)
            val yearly = queryUsage(usageManager, UsageStatsManager.INTERVAL_YEARLY, twoYearsAgo, now)
            mergeUsage(monthly, yearly)
                .ifEmpty { queryAggregateFallback(usageManager, twoYearsAgo, now) }
        } else {
            emptyMap()
        }

        val recentUsage = if (usageManager != null) {
            queryUsage(usageManager, UsageStatsManager.INTERVAL_DAILY, ninetyDaysAgo, now)
                .ifEmpty { queryAggregateFallback(usageManager, ninetyDaysAgo, now) }
        } else {
            emptyMap()
        }

        val usageDatasetAvailable = usageAllowed && (longUsage.values + recentUsage.values).any {
            (it.lastTimeUsed ?: 0L) > 0L || (it.totalTimeInForegroundMs ?: 0L) > 0L
        }

        val storageManager = if (usageAllowed) {
            context.getSystemService(StorageStatsManager::class.java)
        } else {
            null
        }

        val protectedPackages = protectedPackages()

        val installed = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            packageManager.getInstalledApplications(PackageManager.ApplicationInfoFlags.of(0))
        } else {
            @Suppress("DEPRECATION")
            packageManager.getInstalledApplications(0)
        }

        val userApps = installed
            .filter { it.packageName != context.packageName }
            .filter { it.enabled }
            .filter { (it.flags and ApplicationInfo.FLAG_SYSTEM) == 0 }

        // queryStatsForUid() is normally faster than queryStatsForPackage(). Use it
        // for the common one-package-per-UID case, while keeping package-level stats
        // for shared UIDs so the same storage is not attributed to several apps.
        val uidCounts = userApps.groupingBy { it.uid }.eachCount()

        userApps.asSequence()
            .map { appInfo ->
                val label = packageManager.getApplicationLabel(appInfo).toString()
                val longStats = longUsage[appInfo.packageName]
                val recentStats = recentUsage[appInfo.packageName]
                val lastTimeUsed = listOfNotNull(
                    longStats?.lastTimeUsed,
                    recentStats?.lastTimeUsed
                ).maxOrNull()?.takeIf { it > 0L }

                val daysSinceLastUse = lastTimeUsed?.let {
                    ((now - it).coerceAtLeast(0L) / dayMs).toInt()
                }

                val packageInfo = packageInfo(appInfo.packageName)
                val installAgeDays = packageInfo?.firstInstallTime
                    ?.takeIf { it > 0L && it <= now }
                    ?.let { ((now - it) / dayMs).toInt() }

                val sizeBytes = if (storageManager != null) {
                    runCatching {
                        val storageStats = if (uidCounts[appInfo.uid] == 1) {
                            storageManager.queryStatsForUid(
                                appInfo.storageUuid,
                                appInfo.uid
                            )
                        } else {
                            storageManager.queryStatsForPackage(
                                appInfo.storageUuid,
                                appInfo.packageName,
                                Process.myUserHandle()
                            )
                        }
                        storageStats.appBytes + storageStats.dataBytes + storageStats.cacheBytes
                    }.getOrNull() ?: installedApkBytes(appInfo)
                } else {
                    null
                }

                val isProtected = appInfo.packageName in protectedPackages ||
                    looksSensitive(appInfo.packageName, label)

                val decision = AppRecommendationEngine.evaluate(
                    usageAccess = usageAllowed,
                    usageDatasetAvailable = usageDatasetAvailable,
                    daysSinceLastUse = daysSinceLastUse,
                    installAgeDays = installAgeDays,
                    isProtected = isProtected
                )

                AppCandidate(
                    name = label,
                    packageName = appInfo.packageName,
                    sizeBytes = sizeBytes,
                    daysSinceLastUse = daysSinceLastUse,
                    installAgeDays = installAgeDays,
                    totalTimeInForegroundMs = recentStats?.totalTimeInForegroundMs,
                    recommendation = decision.recommendation,
                    reason = decision.reason,
                    isProtected = isProtected
                )
            }
            .sortedWith(
                compareByDescending<AppCandidate> {
                    it.daysSinceLastUse ?: it.installAgeDays ?: -1
                }.thenByDescending { it.sizeBytes ?: 0L }
            )
            .toList()
    }

    private fun queryUsage(
        manager: UsageStatsManager,
        interval: Int,
        begin: Long,
        end: Long
    ): Map<String, UsageAggregate> {
        val stats = runCatching {
            manager.queryUsageStats(interval, begin, end)
        }.getOrNull().orEmpty()

        if (stats.isEmpty()) return emptyMap()

        val output = mutableMapOf<String, UsageAggregate>()
        stats.forEach { stat ->
            val previous = output[stat.packageName]
            val last = maxOf(previous?.lastTimeUsed ?: 0L, stat.lastTimeUsed)
            val total = (previous?.totalTimeInForegroundMs ?: 0L) + stat.totalTimeInForeground
            output[stat.packageName] = UsageAggregate(
                lastTimeUsed = last.takeIf { it > 0L },
                totalTimeInForegroundMs = total
            )
        }
        return output
    }

    private fun queryAggregateFallback(
        manager: UsageStatsManager,
        begin: Long,
        end: Long
    ): Map<String, UsageAggregate> = runCatching {
        manager.queryAndAggregateUsageStats(begin, end).mapValues { (_, stat) ->
            UsageAggregate(
                lastTimeUsed = stat.lastTimeUsed.takeIf { it > 0L },
                totalTimeInForegroundMs = stat.totalTimeInForeground
            )
        }
    }.getOrDefault(emptyMap())

    private fun mergeUsage(
        first: Map<String, UsageAggregate>,
        second: Map<String, UsageAggregate>
    ): Map<String, UsageAggregate> {
        if (first.isEmpty()) return second
        if (second.isEmpty()) return first

        val keys = first.keys + second.keys
        return keys.associateWith { packageName ->
            val a = first[packageName]
            val b = second[packageName]
            UsageAggregate(
                lastTimeUsed = maxOf(a?.lastTimeUsed ?: 0L, b?.lastTimeUsed ?: 0L)
                    .takeIf { it > 0L },
                // Long-range totals are not shown, so avoid double counting overlapping buckets.
                totalTimeInForegroundMs = maxOf(
                    a?.totalTimeInForegroundMs ?: 0L,
                    b?.totalTimeInForegroundMs ?: 0L
                )
            )
        }
    }

    private fun packageInfo(packageName: String): PackageInfo? = runCatching {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            packageManager.getPackageInfo(packageName, PackageManager.PackageInfoFlags.of(0))
        } else {
            @Suppress("DEPRECATION")
            packageManager.getPackageInfo(packageName, 0)
        }
    }.getOrNull()

    private fun installedApkBytes(appInfo: ApplicationInfo): Long? = runCatching {
        val paths = buildList {
            appInfo.sourceDir?.let(::add)
            appInfo.splitSourceDirs?.let(::addAll)
        }
        paths.sumOf { File(it).length().coerceAtLeast(0L) }.takeIf { it > 0L }
    }.getOrNull()

    @Suppress("DEPRECATION")
    private fun protectedPackages(): Set<String> {
        val output = mutableSetOf<String>()

        runCatching {
            packageManager.resolveActivity(
                Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME),
                PackageManager.MATCH_DEFAULT_ONLY
            )?.activityInfo?.packageName
        }.getOrNull()?.let(output::add)

        runCatching {
            Settings.Secure.getString(context.contentResolver, Settings.Secure.DEFAULT_INPUT_METHOD)
                ?.substringBefore('/')
        }.getOrNull()?.takeIf { it.isNotBlank() }?.let(output::add)

        runCatching { Telephony.Sms.getDefaultSmsPackage(context) }
            .getOrNull()?.let(output::add)

        runCatching { context.getSystemService(TelecomManager::class.java)?.defaultDialerPackage }
            .getOrNull()?.let(output::add)

        runCatching {
            packageManager.resolveActivity(
                Intent(Intent.ACTION_VIEW, Uri.parse("https://example.com")),
                PackageManager.MATCH_DEFAULT_ONLY
            )?.activityInfo?.packageName
        }.getOrNull()?.let(output::add)

        runCatching { AccountManager.get(context).authenticatorTypes.toList() }
            .getOrDefault(emptyList())
            .mapNotNullTo(output) { it.packageName }

        return output
    }

    private fun looksSensitive(packageName: String, label: String): Boolean {
        val text = "$packageName $label".lowercase()
        val protectedTerms = listOf(
            "authenticator", "autenticador", "otp", "token",
            "password", "contraseña", "passkey",
            "bank", "banco", "wallet", "cartera",
            "launcher", "keyboard", "teclado",
            "dialer", "telefono", "teléfono",
            "messages", "mensajes", "sms",
            "emergency", "emergencia"
        )
        return protectedTerms.any(text::contains)
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

    private data class UsageAggregate(
        val lastTimeUsed: Long?,
        val totalTimeInForegroundMs: Long?
    )
}
