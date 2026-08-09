package mx.direkta.liacleaner.model

data class AppCandidate(
    val name: String,
    val packageName: String,
    val sizeBytes: Long?,
    val daysSinceLastUse: Int?,
    val installAgeDays: Int?,
    val totalTimeInForegroundMs: Long?,
    val recommendation: Recommendation,
    val reason: RecommendationReason,
    val isProtected: Boolean = false,
    val isSystemComponent: Boolean = false
)

enum class Recommendation {
    KEEP,
    REVIEW,
    REMOVE
}

enum class RecommendationReason {
    USAGE_ACCESS_REQUIRED,
    USAGE_DATA_UNAVAILABLE,
    PROTECTED_APP,
    USED_RECENTLY,
    UNUSED_90_TO_179_DAYS,
    UNUSED_180_PLUS_DAYS,
    NO_USAGE_RECORDED_OLD_APP,
    NO_USAGE_RECORDED_RECENT_APP
}

data class RecommendationDecision(
    val recommendation: Recommendation,
    val reason: RecommendationReason
)

object AppRecommendationEngine {
    fun evaluate(
        usageAccess: Boolean,
        usageDatasetAvailable: Boolean,
        daysSinceLastUse: Int?,
        installAgeDays: Int?,
        isProtected: Boolean
    ): RecommendationDecision {
        if (isProtected) {
            return RecommendationDecision(Recommendation.KEEP, RecommendationReason.PROTECTED_APP)
        }
        if (!usageAccess) {
            return RecommendationDecision(Recommendation.REVIEW, RecommendationReason.USAGE_ACCESS_REQUIRED)
        }
        if (!usageDatasetAvailable) {
            return RecommendationDecision(Recommendation.REVIEW, RecommendationReason.USAGE_DATA_UNAVAILABLE)
        }

        if (daysSinceLastUse != null) {
            return when {
                daysSinceLastUse >= 180 -> RecommendationDecision(
                    Recommendation.REMOVE,
                    RecommendationReason.UNUSED_180_PLUS_DAYS
                )
                daysSinceLastUse >= 90 -> RecommendationDecision(
                    Recommendation.REVIEW,
                    RecommendationReason.UNUSED_90_TO_179_DAYS
                )
                else -> RecommendationDecision(
                    Recommendation.KEEP,
                    RecommendationReason.USED_RECENTLY
                )
            }
        }

        return when {
            installAgeDays != null && installAgeDays >= 180 -> RecommendationDecision(
                Recommendation.REMOVE,
                RecommendationReason.NO_USAGE_RECORDED_OLD_APP
            )
            else -> RecommendationDecision(
                Recommendation.REVIEW,
                RecommendationReason.NO_USAGE_RECORDED_RECENT_APP
            )
        }
    }
}
