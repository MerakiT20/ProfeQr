package mx.direkta.liacleaner.system

import mx.direkta.liacleaner.model.AppCandidate

interface AndroidSystemGateway {
    suspend fun hasUsageAccess(): Boolean
    fun openUsageAccessSettings()
    suspend fun installedApps(): List<AppCandidate>
    fun requestUninstall(packageName: String)
}
