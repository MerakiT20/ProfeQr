package mx.direkta.liacleaner.ui

/**
 * Overload used when Android did not return a 90-day UsageStats bucket.
 * A missing record is not the same as a measured zero minutes.
 */
internal fun formatUsage(milliseconds: Long?): String {
    if (milliseconds == null) return "sin datos"
    if (milliseconds <= 0L) return "0 min"
    val totalMinutes = milliseconds / 60_000L
    if (totalMinutes < 1L) return "<1 min"
    if (totalMinutes < 60L) return "$totalMinutes min"
    val hours = totalMinutes / 60L
    val minutes = totalMinutes % 60L
    return if (minutes == 0L) "$hours h" else "$hours h $minutes min"
}
