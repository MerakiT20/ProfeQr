package mx.direkta.liacleaner.file

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.Data
import androidx.work.WorkerParameters
import androidx.work.workDataOf

class FileScanWorker(
    appContext: Context,
    params: WorkerParameters
) : CoroutineWorker(appContext, params) {

    override suspend fun doWork(): Result {
        val analyzer = FileCleanerAnalyzer(applicationContext)
        if (!analyzer.hasBroadFileAccess()) {
            return Result.failure(workDataOf(KEY_ERROR to "Falta acceso especial a archivos."))
        }

        return runCatching {
            val result = analyzer.scanDetailed { phase, done, total ->
                setProgress(progressData(phase, done, total))
            }
            FileScanCache.save(applicationContext, result)
            Result.success(
                workDataOf(
                    KEY_FILES to result.files.size,
                    KEY_GROUPS to result.duplicateGroups.size
                )
            )
        }.getOrElse { error ->
            Result.failure(workDataOf(KEY_ERROR to (error.message ?: "No fue posible analizar el almacenamiento.")))
        }
    }

    private fun progressData(phase: FileCleanerAnalyzer.ScanPhase, done: Int, total: Int): Data =
        workDataOf(
            KEY_PHASE to phase.name,
            KEY_DONE to done,
            KEY_TOTAL to total
        )

    companion object {
        const val UNIQUE_NAME = "lia_file_scan"
        const val TAG = "lia_file_scan"
        const val KEY_PHASE = "phase"
        const val KEY_DONE = "done"
        const val KEY_TOTAL = "total"
        const val KEY_FILES = "files"
        const val KEY_GROUPS = "groups"
        const val KEY_ERROR = "error"
    }
}
