package mx.direkta.liacleaner.system

import android.content.Context

class CleanerPreferences(context: Context) {
    private val preferences = context.getSharedPreferences(
        "lia_cleaner_settings",
        Context.MODE_PRIVATE
    )

    var showSystemApps: Boolean
        get() = preferences.getBoolean(KEY_SHOW_SYSTEM_APPS, false)
        set(value) {
            preferences.edit().putBoolean(KEY_SHOW_SYSTEM_APPS, value).apply()
        }

    fun markUsageSettingsOpened() {
        preferences.edit().putBoolean(KEY_USAGE_SETTINGS_PENDING_REFRESH, true).apply()
    }

    fun consumeUsageSettingsRefresh(): Boolean {
        val pending = preferences.getBoolean(KEY_USAGE_SETTINGS_PENDING_REFRESH, false)
        if (pending) {
            preferences.edit().putBoolean(KEY_USAGE_SETTINGS_PENDING_REFRESH, false).apply()
        }
        return pending
    }

    companion object {
        private const val KEY_SHOW_SYSTEM_APPS = "show_system_apps"
        private const val KEY_USAGE_SETTINGS_PENDING_REFRESH = "usage_settings_pending_refresh"
    }
}
