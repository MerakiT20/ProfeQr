package mx.direkta.liacleaner.file

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * Process-level shared scan session for Files and Videos.
 * The scan is intentionally detached from the lifetime of a Composable so
 * changing tabs or rotating the device does not cancel the work.
 */
data class FileScanUiState(
    val scanning: Boolean = false,
    val done: Int = 0,
    val total: Int = 0,
    val result: FileScanResult? = null,
    val message: String? = null,
    val startedAtMs: Long = 0L
) {
    val progress: Float
        get() = if (total > 0) (done.toFloat() / total.toFloat()).coerceIn(0f, 1f) else 0f
}

object FileScanSession {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val _state = MutableStateFlow(FileScanUiState())
    val state: StateFlow<FileScanUiState> = _state.asStateFlow()
    private var job: Job? = null

    fun start(analyzer: FileCleanerAnalyzer, force: Boolean = false) {
        if (job?.isActive == true) return
        if (!force && _state.value.result != null) return

        job = scope.launch {
            _state.value = _state.value.copy(
                scanning = true,
                done = 0,
                total = 0,
                message = "Analizando almacenamiento…",
                startedAtMs = System.currentTimeMillis()
            )
            runCatching {
                analyzer.scan { done, total ->
                    // Avoid flooding Compose with thousands of updates.
                    if (done == total || done % 50 == 0) {
                        _state.value = _state.value.copy(done = done, total = total)
                    }
                }
            }.onSuccess { result ->
                _state.value = _state.value.copy(
                    scanning = false,
                    done = result.files.size,
                    total = result.files.size,
                    result = result,
                    message = "Análisis terminado: ${result.files.size} archivos revisados."
                )
            }.onFailure { error ->
                _state.value = _state.value.copy(
                    scanning = false,
                    message = error.message ?: "No fue posible analizar el almacenamiento."
                )
            }
        }
    }

    fun refresh(analyzer: FileCleanerAnalyzer) = start(analyzer, force = true)

    fun setMessage(message: String) {
        _state.value = _state.value.copy(message = message)
    }

    fun replaceResult(result: FileScanResult?, message: String? = null) {
        if (job?.isActive == true) return
        _state.value = _state.value.copy(result = result, message = message)
    }

    fun clear(message: String? = null) {
        if (job?.isActive == true) return
        _state.value = FileScanUiState(message = message)
    }
}
