package mx.direkta.liacleaner.storage

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class StorageCategoryReconcilerTest {

    @Test
    fun keepsValuesWhenKnownCategoriesFitUsedSpace() {
        val result = StorageCategoryReconciler.reconcile(
            used = 1000,
            apps = 400,
            images = 200,
            videos = 100,
            audio = 50
        )
        assertEquals(400, result.apps)
        assertEquals(200, result.images)
        assertEquals(100, result.videos)
        assertEquals(50, result.audio)
        assertEquals(250, result.other)
    }

    @Test
    fun scalesAllKnownCategoriesWhenOemTotalsExceedUsedSpace() {
        val result = StorageCategoryReconciler.reconcile(
            used = 1000,
            apps = 900,
            images = 300,
            videos = 200,
            audio = 100
        )
        val total = result.apps + result.images + result.videos + result.audio + result.other
        assertEquals(1000, total)
        assertTrue(result.apps > result.images)
        assertTrue(result.images > result.videos)
        assertTrue(result.videos > result.audio)
        assertTrue(result.apps > 0)
    }

    @Test
    fun neverProducesNegativeValues() {
        val result = StorageCategoryReconciler.reconcile(
            used = 500,
            apps = -100,
            images = 900,
            videos = -2,
            audio = 0
        )
        assertTrue(result.apps >= 0)
        assertTrue(result.images >= 0)
        assertTrue(result.videos >= 0)
        assertTrue(result.audio >= 0)
        assertTrue(result.other >= 0)
        assertEquals(500, result.apps + result.images + result.videos + result.audio + result.other)
    }
}
