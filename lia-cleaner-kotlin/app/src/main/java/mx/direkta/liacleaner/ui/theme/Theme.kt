package mx.direkta.liacleaner.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightColors = lightColorScheme(
    primary = Color(0xFF1359E8),
    onPrimary = Color.White,
    primaryContainer = Color(0xFFE8F0FF),
    onPrimaryContainer = Color(0xFF0D2F73),
    secondary = Color(0xFF18B987),
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFE3F8F1),
    onSecondaryContainer = Color(0xFF075E47),
    tertiary = Color(0xFF8E5CF5),
    onTertiary = Color.White,
    tertiaryContainer = Color(0xFFF0E9FF),
    background = Color(0xFFF6F8FC),
    onBackground = Color(0xFF172033),
    surface = Color(0xFFFFFFFF),
    onSurface = Color(0xFF172033),
    surfaceVariant = Color(0xFFF0F3F8),
    onSurfaceVariant = Color(0xFF616A7A),
    outline = Color(0xFFD5DAE4),
    error = Color(0xFFD94A4A)
)

private val DarkColors = darkColorScheme(
    primary = Color(0xFF8CB4FF),
    secondary = Color(0xFF65D7B4),
    tertiary = Color(0xFFC2A9FF)
)

@Composable
fun LiaCleanerTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = if (isSystemInDarkTheme()) DarkColors else LightColors,
        typography = MaterialTheme.typography,
        content = content
    )
}
