package mx.direkta.liacleaner.file

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/** Process-level shared scan/deletion session for Files and Videos. */
data class FileScanUiState(
    val scanning: Boolean = false,
    val deleting: Boolean = false,
    val phase: FileCleanerAnalyzer.ScanPhase? = null,
    val done: Int = 0,
    val total: Int = 0,
    val result: FileScanResult? = null,
    val message: String? = null,
    val startedAtMs: Long = 0L
) {
    val progress: Float get() = if (total > 0) (done.toFloat() / total.toFloat()).coerceIn(0f, 1f) else 0f
    val phaseLabel: String get() = when (phase) {
        FileCleanerAnalyzer.ScanPhase.DISCOVERING -> "Buscando archivos"
        FileCleanerAnalyzer.ScanPhase.CATALOGING -> "Catalogando"
        FileCleanerAnalyzer.ScanPhase.HASHING_DUPLICATES -> "Comparando duplicados"
        FileCleanerAnalyzer.ScanPhase.FINALIZING -> "Finalizando"
        null -> ""
    }
}

object FileScanSession {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val _state = MutableStateFlow(FileScanUiState())
    val state: StateFlow<FileScanUiState> = _state.asStateFlow()
    private var job: Job? = null
    private var deleteJob: Job? = null

    fun start(analyzer: FileCleanerAnalyzer, force: Boolean = false) {
        if (job?.isActive == true || deleteJob?.isActive == true) return
        if (!force && _state.value.result != null) return
        job = scope.launch {
            _state.value = _state.value.copy(
                scanning = true, phase = FileCleanerAnalyzer.ScanPhase.DISCOVERING,
                done = 0, total = 0, message = "Analizando almacenamiento…",
                startedAtMs = System.currentTimeMillis()
            )
            runCatching {
                analyzer.scanDetailed { phase, done, total ->
                    _state.value = _state.value.copy(phase = phase, done = done, total = total)
                }
            }.onSuccess { result ->
                _state.value = _state.value.copy(
                    scanning = false, phase = null,
                    done = result.files.size, total = result.files.size,
                    result = result,
                    message = "Análisis terminado: ${result.files.size} archivos revisados."
                )
            }.onFailure { error ->
                _state.value = _state.value.copy(
                    scanning = false, phase = null,
                    message = error.message ?: "No fue posible analizar el almacenamiento."
                )
            }
        }
    }

    fun refresh(analyzer: FileCleanerAnalyzer) = start(analyzer, force = true)

    fun delete(analyzer: FileCleanerAnalyzer, items: List<CleanerFileItem>, noun: String = "archivo") {
        if (items.isEmpty() || deleteJob?.isActive == true || job?.isActive == true) return
        deleteJob = scope.launch {
            _state.value = _state.value.copy(deleting = true, message = "Eliminando ${items.size} ${noun}(s)…")
            val deletion = runCatching { analyzer.deleteFiles(items) }
            deletion.onSuccess { result ->
                val msg = if (result.failedNames.isEmpty()) {
                    "${result.deletedCount} ${noun}(s) eliminados · ${formatBytes(result.deletedBytes)} liberados."
                } else {
                    "${result.deletedCount} eliminados; ${result.failedNames.size} no pudieron borrarse."
                }
                _state.value = _state.value.copy(deleting = false, result = null, message = msg)
                start(analyzer, force = true)
            }.onFailure { error ->
                _state.value = _state.value.copy(deleting = false, message = error.message ?: "No fue posible completar el borrado.")
            }
        }
    }

    fun setMessage(message: String) { _state.value = _state.value.copy(message = message) }
    fun replaceResult(result: FileScanResult?, message: String? = null) {
        if (job?.isActive == true || deleteJob?.isActive == true) return
        _state.value = _state.value.copy(result = result, message = message)
    }
    fun clear(message: String? = null) {
        if (job?.isActive == true || deleteJob?.isActive == true) return
        _state.value = FileScanUiState(message = message)
    }

    private fun formatBytes(bytes: Long): String {
        if (bytes < 1024L) return "$bytes B"
        val kb = bytes / 1024.0
        if (kb < 1024.0) return String.format("%.0f KB", kb)
        val mb = kb / 1024.0
        if (mb < 1024.0) return String.format("%.1f MB", mb)
        return String.format("%.2f GB", mb / 1024.0)
    }
}
