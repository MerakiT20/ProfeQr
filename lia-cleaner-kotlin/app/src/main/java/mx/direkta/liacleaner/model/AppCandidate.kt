package mx.direkta.liacleaner.model

data class AppCandidate(
    val name: String,
    val packageName: String,
    val sizeBytes: Long?,
    val daysSinceLastUse: Int?,
    val totalTimeInForegroundMs: Long,
    val recommendation: Recommendation
)

enum class Recommendation {
    KEEP,
    REVIEW,
    REMOVE
}
