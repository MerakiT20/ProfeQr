package mx.direkta.liacleaner.file

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

/** Shared scan/deletion state for Files and Videos, backed by WorkManager. */
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
    private var observerJob: Job? = null
    private var deleteJob: Job? = null
    private var attached = false

    fun attach(context: Context) {
        if (attached && observerJob?.isActive == true) return
        val app = context.applicationContext
        attached = true

        if (_state.value.result == null) {
            FileScanCache.load(app)?.let { cached ->
                _state.value = _state.value.copy(
                    result = cached,
                    message = "Último análisis restaurado: ${cached.files.size} archivos."
                )
            }
        }

        val manager = WorkManager.getInstance(app)
        observerJob?.cancel()
        observerJob = scope.launch {
            manager.getWorkInfosForUniqueWorkFlow(FileScanWorker.UNIQUE_NAME).collect { infos ->
                val info = infos.lastOrNull { it.state == WorkInfo.State.RUNNING || it.state == WorkInfo.State.ENQUEUED || it.state == WorkInfo.State.BLOCKED }
                    ?: infos.lastOrNull()
                    ?: return@collect
                when (info.state) {
                    WorkInfo.State.ENQUEUED, WorkInfo.State.BLOCKED -> {
                        _state.value = _state.value.copy(scanning = true, message = "Análisis en cola…")
                    }
                    WorkInfo.State.RUNNING -> {
                        val progress = info.progress
                        val phase = runCatching {
                            FileCleanerAnalyzer.ScanPhase.valueOf(progress.getString(FileScanWorker.KEY_PHASE).orEmpty())
                        }.getOrNull()
                        _state.value = _state.value.copy(
                            scanning = true,
                            phase = phase,
                            done = progress.getInt(FileScanWorker.KEY_DONE, 0),
                            total = progress.getInt(FileScanWorker.KEY_TOTAL, 0),
                            message = "Analizando almacenamiento…"
                        )
                    }
                    WorkInfo.State.SUCCEEDED -> {
                        val cached = FileScanCache.load(app)
                        _state.value = _state.value.copy(
                            scanning = false,
                            phase = null,
                            done = cached?.files?.size ?: 0,
                            total = cached?.files?.size ?: 0,
                            result = cached,
                            message = cached?.let { "Análisis terminado: ${it.files.size} archivos revisados." }
                                ?: "El análisis terminó, pero no fue posible restaurar sus resultados."
                        )
                    }
                    WorkInfo.State.FAILED -> {
                        _state.value = _state.value.copy(
                            scanning = false,
                            phase = null,
                            message = info.outputData.getString(FileScanWorker.KEY_ERROR) ?: "El análisis no pudo completarse."
                        )
                    }
                    WorkInfo.State.CANCELLED -> {
                        _state.value = _state.value.copy(scanning = false, phase = null, message = "Análisis cancelado.")
                    }
                }
            }
        }
    }

    fun start(context: Context, force: Boolean = false) {
        val app = context.applicationContext
        attach(app)
        if (deleteJob?.isActive == true) return
        if (!force && _state.value.result != null && !_state.value.scanning) return

        val request = OneTimeWorkRequestBuilder<FileScanWorker>()
            .addTag(FileScanWorker.TAG)
            .build()
        WorkManager.getInstance(app).enqueueUniqueWork(
            FileScanWorker.UNIQUE_NAME,
            if (force) ExistingWorkPolicy.REPLACE else ExistingWorkPolicy.KEEP,
            request
        )
        _state.value = _state.value.copy(
            scanning = true,
            phase = FileCleanerAnalyzer.ScanPhase.DISCOVERING,
            done = 0,
            total = 0,
            message = "Preparando análisis persistente…",
            startedAtMs = System.currentTimeMillis()
        )
    }

    fun refresh(context: Context) {
        FileScanCache.clear(context.applicationContext)
        _state.value = _state.value.copy(result = null)
        start(context, force = true)
    }

    fun delete(context: Context, analyzer: FileCleanerAnalyzer, items: List<CleanerFileItem>, noun: String = "archivo") {
        if (items.isEmpty() || deleteJob?.isActive == true || _state.value.scanning) return
        val app = context.applicationContext
        deleteJob = scope.launch {
            _state.value = _state.value.copy(deleting = true, message = "Eliminando ${items.size} ${noun}(s)…")
            runCatching { analyzer.deleteFiles(items) }
                .onSuccess { deletion ->
                    val msg = if (deletion.failedNames.isEmpty()) {
                        "${deletion.deletedCount} ${noun}(s) eliminados · ${formatBytes(deletion.deletedBytes)} liberados."
                    } else {
                        "${deletion.deletedCount} eliminados; ${deletion.failedNames.size} no pudieron borrarse."
                    }
                    val current = _state.value.result
                    val updated = current?.removePaths(deletion.deletedPaths)
                    if (updated != null) FileScanCache.save(app, updated)
                    _state.value = _state.value.copy(
                        deleting = false,
                        result = updated,
                        done = updated?.files?.size ?: 0,
                        total = updated?.files?.size ?: 0,
                        message = msg
                    )
                }
                .onFailure { error ->
                    _state.value = _state.value.copy(deleting = false, message = error.message ?: "No fue posible completar el borrado.")
                }
        }
    }

    fun setMessage(message: String) { _state.value = _state.value.copy(message = message) }

    fun clear(context: Context, message: String? = null) {
        if (_state.value.scanning || deleteJob?.isActive == true) return
        FileScanCache.clear(context.applicationContext)
        _state.value = FileScanUiState(message = message)
    }

    private fun FileScanResult.removePaths(paths: Set<String>): FileScanResult {
        if (paths.isEmpty()) return this
        val remainingFiles = files.filterNot { it.file.absolutePath in paths }
        val remainingByPath = remainingFiles.associateBy { it.file.absolutePath }
        val groups = duplicateGroups.mapNotNull { group ->
            val members = group.files.mapNotNull { remainingByPath[it.file.absolutePath] }
            if (members.size > 1) DuplicateFileGroup(group.sha256, members.sortedByDescending { it.bestDateMs }) else null
        }.sortedByDescending { it.recoverableBytes }
        return FileScanResult(remainingFiles, groups)
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
