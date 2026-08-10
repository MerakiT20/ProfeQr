package mx.direkta.liacleaner.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

private val LightColors = lightColorScheme(
    primary = Color(0xFF2563EB),
    onPrimary = Color.White,
    primaryContainer = Color(0xFFEAF1FF),
    onPrimaryContainer = Color(0xFF123A84),
    secondary = Color(0xFF16A77A),
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFE3F7F0),
    onSecondaryContainer = Color(0xFF075B45),
    tertiary = Color(0xFF7657D8),
    onTertiary = Color.White,
    tertiaryContainer = Color(0xFFF0ECFF),
    background = Color(0xFFF7F8FA),
    onBackground = Color(0xFF172033),
    surface = Color(0xFFFFFFFF),
    onSurface = Color(0xFF172033),
    surfaceVariant = Color(0xFFF1F3F6),
    onSurfaceVariant = Color(0xFF626A78),
    outline = Color(0xFFD6DAE1),
    outlineVariant = Color(0xFFE5E8ED),
    error = Color(0xFFD84949)
)

private val DarkColors = darkColorScheme(
    primary = Color(0xFF9AB9FF),
    secondary = Color(0xFF6AD8B6),
    tertiary = Color(0xFFC2B1FF),
    background = Color(0xFF111318),
    surface = Color(0xFF191C22),
    surfaceVariant = Color(0xFF242832)
)

private val LiaTypography = Typography(
    headlineLarge = TextStyle(fontSize = 30.sp, lineHeight = 36.sp, fontWeight = FontWeight.Bold),
    headlineMedium = TextStyle(fontSize = 24.sp, lineHeight = 30.sp, fontWeight = FontWeight.Bold),
    titleLarge = TextStyle(fontSize = 19.sp, lineHeight = 24.sp, fontWeight = FontWeight.SemiBold),
    titleMedium = TextStyle(fontSize = 16.sp, lineHeight = 21.sp, fontWeight = FontWeight.SemiBold),
    bodyLarge = TextStyle(fontSize = 15.sp, lineHeight = 21.sp),
    bodyMedium = TextStyle(fontSize = 13.sp, lineHeight = 19.sp),
    bodySmall = TextStyle(fontSize = 11.sp, lineHeight = 16.sp),
    labelLarge = TextStyle(fontSize = 14.sp, lineHeight = 18.sp, fontWeight = FontWeight.SemiBold)
)

@Composable
fun LiaCleanerTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = if (isSystemInDarkTheme()) DarkColors else LightColors,
        typography = LiaTypography,
        content = content
    )
}
