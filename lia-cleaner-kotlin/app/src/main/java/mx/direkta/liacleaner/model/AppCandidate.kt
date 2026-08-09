package mx.direkta.liacleaner.model

data class AppCandidate(
    val name: String,
    val packageName: String,
    val sizeLabel: String,
    val daysSinceLastUse: Int,
    val recommendation: Recommendation
)

enum class Recommendation {
    KEEP,
    REVIEW,
    REMOVE
}
