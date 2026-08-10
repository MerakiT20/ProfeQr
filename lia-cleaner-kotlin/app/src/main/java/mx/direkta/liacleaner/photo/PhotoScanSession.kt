package mx.direkta.liacleaner.photo

import android.content.Context
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkInfo
import androidx.work.WorkManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import mx.direkta.liacleaner.model.PhotoGroup
import mx.direkta.liacleaner.model.PhotoScanResult

data class PhotoScanUiState(
    val scanning: Boolean = false,
    val advancedScanning: Boolean = false,
    val done: Int = 0,
    val total: Int = 0,
    val quickResult: PhotoScanResult? = null,
    val aiGroups: List<PhotoGroup> = emptyList(),
    val message: String? = null
)

/** Persistent photo scan state backed by WorkManager and a local result cache. */
object PhotoScanSession {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val _state = MutableStateFlow(PhotoScanUiState())
    val state: StateFlow<PhotoScanUiState> = _state.asStateFlow()

    private var quickObserver: Job? = null
    private var advancedObserver: Job? = null
    private var attached = false
    private var appContext: Context? = null

    fun attach(context: Context) {
        val app = context.applicationContext
        appContext = app
        if (attached && quickObserver?.isActive == true && advancedObserver?.isActive == true) return
        attached = true
        if (_state.value.quickResult == null) {
            val cached = PhotoScanCache.load(app)
            if (cached.quick != null) {
                _state.value = _state.value.copy(
                    quickResult = cached.quick,
                    aiGroups = cached.aiGroups,
                    message = "Último análisis de fotos restaurado."
                )
            }
        }

        val manager = WorkManager.getInstance(app)
        quickObserver?.cancel()
        quickObserver = scope.launch {
            manager.getWorkInfosForUniqueWorkFlow(PhotoQuickScanWorker.UNIQUE_NAME).collect { infos ->
                val info = infos.lastOrNull { it.state == WorkInfo.State.RUNNING || it.state == WorkInfo.State.ENQUEUED || it.state == WorkInfo.State.BLOCKED }
                    ?: infos.lastOrNull() ?: return@collect
                when (info.state) {
                    WorkInfo.State.ENQUEUED, WorkInfo.State.BLOCKED -> {
                        _state.value = _state.value.copy(scanning = true, advancedScanning = false, message = "Análisis de fotos en cola…")
                    }
                    WorkInfo.State.RUNNING -> {
                        _state.value = _state.value.copy(
                            scanning = true,
                            advancedScanning = false,
                            done = info.progress.getInt(PhotoQuickScanWorker.KEY_DONE, 0),
                            total = info.progress.getInt(PhotoQuickScanWorker.KEY_TOTAL, 0),
                            message = "Analizando fotos por hash…"
                        )
                    }
                    WorkInfo.State.SUCCEEDED -> {
                        val cached = PhotoScanCache.load(app)
                        _state.value = _state.value.copy(
                            scanning = false,
                            done = cached.quick?.photos?.size ?: 0,
                            total = cached.quick?.photos?.size ?: 0,
                            quickResult = cached.quick,
                            aiGroups = cached.aiGroups,
                            message = "Análisis por hash terminado."
                        )
                    }
                    WorkInfo.State.FAILED -> {
                        _state.value = _state.value.copy(scanning = false, message = info.outputData.getString(PhotoQuickScanWorker.KEY_ERROR) ?: "No fue posible analizar las fotos.")
                    }
                    WorkInfo.State.CANCELLED -> _state.value = _state.value.copy(scanning = false)
                }
            }
        }

        advancedObserver?.cancel()
        advancedObserver = scope.launch {
            manager.getWorkInfosForUniqueWorkFlow(PhotoAdvancedScanWorker.UNIQUE_NAME).collect { infos ->
                val info = infos.lastOrNull { it.state == WorkInfo.State.RUNNING || it.state == WorkInfo.State.ENQUEUED || it.state == WorkInfo.State.BLOCKED }
                    ?: infos.lastOrNull() ?: return@collect
                when (info.state) {
                    WorkInfo.State.ENQUEUED, WorkInfo.State.BLOCKED -> {
                        _state.value = _state.value.copy(advancedScanning = true, message = "Análisis avanzado en cola…")
                    }
                    WorkInfo.State.RUNNING -> {
                        _state.value = _state.value.copy(
                            advancedScanning = true,
                            done = info.progress.getInt(PhotoAdvancedScanWorker.KEY_DONE, 0),
                            total = info.progress.getInt(PhotoAdvancedScanWorker.KEY_TOTAL, 0),
                            message = "Analizando similitud con IA…"
                        )
                    }
                    WorkInfo.State.SUCCEEDED -> {
                        val cached = PhotoScanCache.load(app)
                        _state.value = _state.value.copy(
                            advancedScanning = false,
                            quickResult = cached.quick ?: _state.value.quickResult,
                            aiGroups = cached.aiGroups,
                            message = "Análisis avanzado terminado."
                        )
                    }
                    WorkInfo.State.FAILED -> {
                        _state.value = _state.value.copy(advancedScanning = false, message = info.outputData.getString(PhotoAdvancedScanWorker.KEY_ERROR) ?: "No fue posible completar el análisis avanzado.")
                    }
                    WorkInfo.State.CANCELLED -> _state.value = _state.value.copy(advancedScanning = false)
                }
            }
        }
    }

    fun startQuick(context: Context) {
        val app = context.applicationContext
        attach(app)
        if (_state.value.scanning || _state.value.advancedScanning) return
        WorkManager.getInstance(app).cancelUniqueWork(PhotoAdvancedScanWorker.UNIQUE_NAME)
        val request = OneTimeWorkRequestBuilder<PhotoQuickScanWorker>().addTag(PhotoQuickScanWorker.TAG).build()
        WorkManager.getInstance(app).enqueueUniqueWork(PhotoQuickScanWorker.UNIQUE_NAME, ExistingWorkPolicy.REPLACE, request)
        _state.value = _state.value.copy(
            scanning = true,
            advancedScanning = false,
            done = 0,
            total = 0,
            aiGroups = emptyList(),
            message = "Preparando análisis persistente de fotos…"
        )
    }

    fun startAdvanced(context: Context) {
        val app = context.applicationContext
        attach(app)
        if (_state.value.quickResult == null || _state.value.scanning || _state.value.advancedScanning) return
        val request = OneTimeWorkRequestBuilder<PhotoAdvancedScanWorker>().addTag(PhotoAdvancedScanWorker.TAG).build()
        WorkManager.getInstance(app).enqueueUniqueWork(PhotoAdvancedScanWorker.UNIQUE_NAME, ExistingWorkPolicy.REPLACE, request)
        _state.value = _state.value.copy(advancedScanning = true, done = 0, total = 0, message = "Preparando análisis avanzado…")
    }

    // Compatibility overloads used by the already-tested V3 Compose screen.
    fun startQuick(analyzer: PhotoAnalyzer) {
        val context = appContext ?: return
        startQuick(context)
    }

    fun startAdvanced(analyzer: AdvancedPhotoAnalyzer) {
        val context = appContext ?: return
        startAdvanced(context)
    }

    fun invalidateResults(context: Context, message: String = "Contenido actualizado. Analiza de nuevo para verificar resultados.") {
        val app = context.applicationContext
        val manager = WorkManager.getInstance(app)
        manager.cancelUniqueWork(PhotoQuickScanWorker.UNIQUE_NAME)
        manager.cancelUniqueWork(PhotoAdvancedScanWorker.UNIQUE_NAME)
        PhotoScanCache.clear(app)
        _state.value = PhotoScanUiState(message = message)
    }

    fun invalidateResults(message: String = "Contenido actualizado. Analiza de nuevo para verificar resultados.") {
        val context = appContext
        if (context != null) invalidateResults(context, message) else _state.value = PhotoScanUiState(message = message)
    }

    fun setMessage(message: String) {
        _state.value = _state.value.copy(message = message)
    }
}
