package mx.direkta.liacleaner.system

import android.content.pm.ApplicationInfo

object SystemAppClassifier {
    fun isSystemComponent(appInfo: ApplicationInfo, label: String): Boolean {
        val flags = appInfo.flags
        val installedInSystemImage = (flags and ApplicationInfo.FLAG_SYSTEM) != 0
        val updatedBuiltInApp = (flags and ApplicationInfo.FLAG_UPDATED_SYSTEM_APP) != 0
        val persistentProcess = (flags and ApplicationInfo.FLAG_PERSISTENT) != 0
        val sourceDir = appInfo.sourceDir.orEmpty()
        val systemPath = SYSTEM_PATH_PREFIXES.any(sourceDir::startsWith)

        return installedInSystemImage ||
            updatedBuiltInApp ||
            persistentProcess ||
            systemPath ||
            SystemComponentHeuristics.looksLikeSystemComponent(appInfo.packageName, label)
    }

    private val SYSTEM_PATH_PREFIXES = listOf(
        "/system/",
        "/system_ext/",
        "/product/",
        "/vendor/",
        "/odm/",
        "/apex/"
    )
}

/**
 * Some security/Mainline components are distributed or updated independently and
 * do not always look like classic FLAG_SYSTEM packages on every OEM build.
 */
object SystemComponentHeuristics {
    private val exactPackages = setOf(
        "com.android.settings",
        "com.android.systemui",
        "com.android.shell",
        "com.android.packageinstaller",
        "com.android.permissioncontroller",
        "com.android.vending",
        "com.google.android.gms",
        "com.google.android.webview",
        "com.google.android.safetycore",
        "com.google.android.contactkeys",
        "com.google.android.modulemetadata",
        "com.google.android.permissioncontroller",
        "com.google.android.packageinstaller",
        "com.google.android.ext.services",
        "com.google.android.ext.shared",
        "com.google.android.configupdater",
        "com.google.android.adservices.api",
        "com.google.android.ondevicepersonalization.services"
    )

    private val packagePrefixes = listOf(
        "com.android.providers.",
        "com.android.networkstack",
        "com.google.android.networkstack",
        "com.google.mainline.",
        "com.google.android.cellbroadcast",
        "com.google.android.overlay."
    )

    private val labelTerms = listOf(
        "android system",
        "system ui",
        "safetycore",
        "key verifier",
        "permission controller",
        "package installer",
        "google play services",
        "carrier services",
        "device health services",
        "private compute services",
        "mobile device information"
    )

    fun looksLikeSystemComponent(packageName: String, label: String): Boolean {
        val pkg = packageName.lowercase()
        val normalizedLabel = label.lowercase()
        return pkg in exactPackages ||
            packagePrefixes.any(pkg::startsWith) ||
            labelTerms.any(normalizedLabel::contains)
    }
}
