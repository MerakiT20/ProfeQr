package mx.direkta.liacleaner.photo

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

/**
 * Process-level scan session. Unlike rememberCoroutineScope(), this scope is not
 * cancelled when the user rotates the phone or changes tabs, so an active scan
 * keeps running and its progress/results remain observable when the UI returns.
 */
object PhotoScanSession {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    private val _state = MutableStateFlow(PhotoScanUiState())
    val state: StateFlow<PhotoScanUiState> = _state.asStateFlow()

    private var quickJob: Job? = null
    private var advancedJob: Job? = null

    fun startQuick(analyzer: PhotoAnalyzer) {
        if (quickJob?.isActive == true || advancedJob?.isActive == true) return
        quickJob = scope.launch {
            _state.value = _state.value.copy(
                scanning = true,
                advancedScanning = false,
                done = 0,
                total = 0,
                aiGroups = emptyList(),
                message = "Analizando fotos…"
            )
            runCatching {
                analyzer.quickScan { done, total ->
                    // Updating Compose thousands of times adds overhead. Throttle the
                    // observable progress while still keeping the exact final value.
                    if (done == total || done % 25 == 0) {
                        _state.value = _state.value.copy(done = done, total = total)
                    }
                }
            }.onSuccess { result ->
                _state.value = _state.value.copy(
                    scanning = false,
                    done = result.photos.size,
                    total = result.photos.size,
                    quickResult = result,
                    message = "Análisis por hash terminado."
                )
            }.onFailure { error ->
                _state.value = _state.value.copy(
                    scanning = false,
                    message = error.message ?: "No fue posible analizar las fotos."
                )
            }
        }
    }

    fun startAdvanced(analyzer: AdvancedPhotoAnalyzer) {
        val quick = _state.value.quickResult ?: return
        if (quickJob?.isActive == true || advancedJob?.isActive == true) return
        advancedJob = scope.launch {
            _state.value = _state.value.copy(
                advancedScanning = true,
                done = 0,
                total = 0,
                message = "Analizando similitud con IA…"
            )
            runCatching {
                analyzer.analyze(quick) { done, total ->
                    if (done == total || done % 10 == 0) {
                        _state.value = _state.value.copy(done = done, total = total)
                    }
                }
            }.onSuccess { groups ->
                _state.value = _state.value.copy(
                    advancedScanning = false,
                    aiGroups = groups,
                    message = "Análisis avanzado terminado."
                )
            }.onFailure { error ->
                _state.value = _state.value.copy(
                    advancedScanning = false,
                    message = error.message ?: "No fue posible completar el análisis avanzado."
                )
            }
        }
    }

    fun invalidateResults(message: String = "Contenido actualizado. Analiza de nuevo para verificar resultados.") {
        if (quickJob?.isActive == true || advancedJob?.isActive == true) return
        _state.value = PhotoScanUiState(message = message)
    }

    fun setMessage(message: String) {
        _state.value = _state.value.copy(message = message)
    }
}
