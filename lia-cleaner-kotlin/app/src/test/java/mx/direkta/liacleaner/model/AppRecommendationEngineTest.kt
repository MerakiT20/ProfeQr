package mx.direkta.liacleaner.model

import org.junit.Assert.assertEquals
import org.junit.Test

class AppRecommendationEngineTest {

    @Test
    fun `known inactivity over 180 days is removable`() {
        val result = AppRecommendationEngine.evaluate(
            usageAccess = true,
            usageDatasetAvailable = true,
            daysSinceLastUse = 181,
            installAgeDays = 400,
            isProtected = false
        )
        assertEquals(Recommendation.REMOVE, result.recommendation)
        assertEquals(RecommendationReason.UNUSED_180_PLUS_DAYS, result.reason)
    }

    @Test
    fun `old app with no recorded usage becomes candidate when dataset works`() {
        val result = AppRecommendationEngine.evaluate(
            usageAccess = true,
            usageDatasetAvailable = true,
            daysSinceLastUse = null,
            installAgeDays = 365,
            isProtected = false
        )
        assertEquals(Recommendation.REMOVE, result.recommendation)
        assertEquals(RecommendationReason.NO_USAGE_RECORDED_OLD_APP, result.reason)
    }

    @Test
    fun `missing global usage dataset never fabricates candidate`() {
        val result = AppRecommendationEngine.evaluate(
            usageAccess = true,
            usageDatasetAvailable = false,
            daysSinceLastUse = null,
            installAgeDays = 365,
            isProtected = false
        )
        assertEquals(Recommendation.REVIEW, result.recommendation)
        assertEquals(RecommendationReason.USAGE_DATA_UNAVAILABLE, result.reason)
    }

    @Test
    fun `protected app is never recommended for removal`() {
        val result = AppRecommendationEngine.evaluate(
            usageAccess = true,
            usageDatasetAvailable = true,
            daysSinceLastUse = 500,
            installAgeDays = 900,
            isProtected = true
        )
        assertEquals(Recommendation.KEEP, result.recommendation)
        assertEquals(RecommendationReason.PROTECTED_APP, result.reason)
    }

    @Test
    fun `recently used app is kept`() {
        val result = AppRecommendationEngine.evaluate(
            usageAccess = true,
            usageDatasetAvailable = true,
            daysSinceLastUse = 4,
            installAgeDays = 500,
            isProtected = false
        )
        assertEquals(Recommendation.KEEP, result.recommendation)
        assertEquals(RecommendationReason.USED_RECENTLY, result.reason)
    }
}
