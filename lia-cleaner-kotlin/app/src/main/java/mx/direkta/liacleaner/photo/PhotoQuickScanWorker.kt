package mx.direkta.liacleaner.photo

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import androidx.work.workDataOf

class PhotoQuickScanWorker(
    appContext: Context,
    params: WorkerParameters
) : CoroutineWorker(appContext, params) {

    override suspend fun doWork(): Result {
        val analyzer = PhotoAnalyzer(applicationContext)
        if (!analyzer.hasPhotoAccess()) {
            return Result.failure(workDataOf(KEY_ERROR to "Falta acceso a las fotos."))
        }
        return runCatching {
            val result = analyzer.quickScan { done, total ->
                setProgress(workDataOf(KEY_DONE to done, KEY_TOTAL to total))
            }
            PhotoScanCache.saveQuick(applicationContext, result)
            Result.success(workDataOf(KEY_COUNT to result.photos.size))
        }.getOrElse { error ->
            Result.failure(workDataOf(KEY_ERROR to (error.message ?: "No fue posible analizar las fotos.")))
        }
    }

    companion object {
        const val UNIQUE_NAME = "lia_photo_quick_scan"
        const val TAG = "lia_photo_quick_scan"
        const val KEY_DONE = "done"
        const val KEY_TOTAL = "total"
        const val KEY_COUNT = "count"
        const val KEY_ERROR = "error"
    }
}
