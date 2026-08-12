package mx.direkta.liacleaner.photo

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import androidx.work.workDataOf

class PhotoAdvancedScanWorker(
    appContext: Context,
    params: WorkerParameters
) : CoroutineWorker(appContext, params) {

    override suspend fun doWork(): Result {
        val cached = PhotoScanCache.load(applicationContext)
        val quick = cached.quick
            ?: return Result.failure(workDataOf(KEY_ERROR to "Primero ejecuta el análisis rápido por hash."))
        val photoAnalyzer = PhotoAnalyzer(applicationContext)
        if (!photoAnalyzer.hasPhotoAccess()) {
            return Result.failure(workDataOf(KEY_ERROR to "Falta acceso a las fotos."))
        }
        val advanced = AdvancedPhotoAnalyzer(applicationContext, photoAnalyzer)
        return runCatching {
            val groups = advanced.analyze(quick) { done, total ->
                setProgress(workDataOf(KEY_DONE to done, KEY_TOTAL to total))
            }
            PhotoScanCache.saveAi(applicationContext, groups)
            Result.success(workDataOf(KEY_GROUPS to groups.size))
        }.getOrElse { error ->
            Result.failure(workDataOf(KEY_ERROR to (error.message ?: "No fue posible completar el análisis avanzado.")))
        }
    }

    companion object {
        const val UNIQUE_NAME = "lia_photo_advanced_scan"
        const val TAG = "lia_photo_advanced_scan"
        const val KEY_DONE = "done"
        const val KEY_TOTAL = "total"
        const val KEY_GROUPS = "groups"
        const val KEY_ERROR = "error"
    }
}
