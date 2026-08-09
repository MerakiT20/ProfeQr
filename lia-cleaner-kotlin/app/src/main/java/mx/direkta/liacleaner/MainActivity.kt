package mx.direkta.liacleaner

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import mx.direkta.liacleaner.system.AndroidSystemGatewayImpl
import mx.direkta.liacleaner.system.CleanerPreferences
import mx.direkta.liacleaner.ui.LiaCleanerRoot
import mx.direkta.liacleaner.ui.theme.LiaCleanerTheme

class MainActivity : ComponentActivity() {
    private lateinit var preferences: CleanerPreferences

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        preferences = CleanerPreferences(applicationContext)
        val systemGateway = AndroidSystemGatewayImpl(applicationContext)

        setContent {
            LiaCleanerTheme {
                LiaCleanerRoot(
                    systemGateway = systemGateway,
                    preferences = preferences,
                    onPreferencesChanged = { recreate() }
                )
            }
        }
    }

    override fun onResume() {
        super.onResume()
        if (::preferences.isInitialized && preferences.consumeUsageSettingsRefresh()) {
            window.decorView.post { recreate() }
        }
    }
}
