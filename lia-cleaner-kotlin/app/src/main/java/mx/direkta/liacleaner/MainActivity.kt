package mx.direkta.liacleaner

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import mx.direkta.liacleaner.ui.LiaCleanerApp
import mx.direkta.liacleaner.ui.theme.LiaCleanerTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            LiaCleanerTheme {
                LiaCleanerApp()
            }
        }
    }
}
