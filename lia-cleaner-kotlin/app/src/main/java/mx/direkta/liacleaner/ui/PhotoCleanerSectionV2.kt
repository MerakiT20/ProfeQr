package mx.direkta.liacleaner.ui

import androidx.compose.runtime.Composable
import mx.direkta.liacleaner.photo.AdvancedPhotoAnalyzer
import mx.direkta.liacleaner.photo.PhotoAnalyzer

/** Compatibility entry point so existing navigation keeps working. */
@Composable
fun PhotoCleanerSectionV2(
    photoAnalyzer: PhotoAnalyzer,
    advancedPhotoAnalyzer: AdvancedPhotoAnalyzer
) {
    PhotoCleanerSectionV3(photoAnalyzer, advancedPhotoAnalyzer)
}
