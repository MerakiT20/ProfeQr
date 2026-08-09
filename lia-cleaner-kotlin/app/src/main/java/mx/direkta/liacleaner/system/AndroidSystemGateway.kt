package mx.direkta.liacleaner.system

/**
 * Punto de entrada para las funciones Android reales.
 *
 * La UI no debe llamar PackageManager/UsageStatsManager directamente. En las
 * siguientes iteraciones esta interfaz se conectará con implementaciones nativas
 * y repositorios testeables.
 */
interface AndroidSystemGateway {
    suspend fun hasUsageAccess(): Boolean
    suspend fun installedPackages(): List<String>
    suspend fun requestUninstall(packageName: String)
}
