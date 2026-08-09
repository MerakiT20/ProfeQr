package mx.direkta.liacleaner.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Apps
import androidx.compose.material.icons.filled.CleaningServices
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Storage
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import mx.direkta.liacleaner.model.AppCandidate
import mx.direkta.liacleaner.model.Recommendation

private val demoApps = listOf(
    AppCandidate("Facebook Lite", "com.facebook.lite", "1.2 GB", 143, Recommendation.REMOVE),
    AppCandidate("Booking", "com.booking", "486 MB", 197, Recommendation.REMOVE),
    AppCandidate("Google Maps", "com.google.android.apps.maps", "1.8 GB", 1, Recommendation.KEEP),
    AppCandidate("Pinterest", "com.pinterest", "320 MB", 90, Recommendation.REVIEW)
)

@Composable
fun LiaCleanerApp() {
    var tab by remember { mutableIntStateOf(0) }

    Scaffold(
        bottomBar = {
            NavigationBar {
                NavigationBarItem(
                    selected = tab == 0,
                    onClick = { tab = 0 },
                    icon = { Icon(Icons.Default.Home, null) },
                    label = { Text("Inicio") }
                )
                NavigationBarItem(
                    selected = tab == 1,
                    onClick = { tab = 1 },
                    icon = { Icon(Icons.Default.Apps, null) },
                    label = { Text("Apps") }
                )
                NavigationBarItem(
                    selected = tab == 2,
                    onClick = { tab = 2 },
                    icon = { Icon(Icons.Default.CleaningServices, null) },
                    label = { Text("Limpiar") }
                )
            }
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            when (tab) {
                0 -> HomeScreen(onReviewApps = { tab = 1 })
                1 -> AppsScreen()
                else -> CleanScreen()
            }
        }
    }
}

@Composable
private fun HomeScreen(onReviewApps: () -> Unit) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 20.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item { Spacer(Modifier.height(12.dp)) }
        item {
            Text("Buen día", fontSize = 16.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text("LIA Cleaner", fontSize = 30.sp, fontWeight = FontWeight.Bold)
        }
        item {
            Card(
                shape = RoundedCornerShape(28.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(2.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(22.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text("Estado del teléfono", fontWeight = FontWeight.SemiBold)
                        Spacer(Modifier.height(8.dp))
                        Text("68/100", fontSize = 34.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                        Text("Buen estado", color = MaterialTheme.colorScheme.secondary)
                    }
                    HealthRing(score = 68)
                }
            }
        }
        item {
            Text("Espacio recuperable", color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text("14.7 GB", fontSize = 32.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.secondary)
        }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                MetricCard("Apps sin usar", "12", Modifier.weight(1f))
                MetricCard("Archivos grandes", "24", Modifier.weight(1f))
            }
        }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                MetricCard("Almacenamiento", "64%", Modifier.weight(1f))
                MetricCard("Recomendaciones", "8", Modifier.weight(1f))
            }
        }
        item {
            Button(
                onClick = onReviewApps,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                shape = RoundedCornerShape(18.dp)
            ) {
                Text("Revisar ahora")
            }
        }
        item { Spacer(Modifier.height(8.dp)) }
    }
}

@Composable
private fun HealthRing(score: Int) {
    Box(
        modifier = Modifier
            .size(96.dp)
            .clip(RoundedCornerShape(48.dp))
            .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.10f)),
        contentAlignment = Alignment.Center
    ) {
        Text(score.toString(), fontSize = 28.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
    }
}

@Composable
private fun MetricCard(title: String, value: String, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Column(Modifier.padding(18.dp)) {
            Text(title, fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Spacer(Modifier.height(8.dp))
            Text(value, fontSize = 24.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun AppsScreen() {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 20.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        item { Spacer(Modifier.height(16.dp)) }
        item {
            Text("Apps sin usar", fontSize = 28.sp, fontWeight = FontWeight.Bold)
            Text("Ordenadas por última vez utilizadas", color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        items(demoApps) { app -> AppRow(app) }
    }
}

@Composable
private fun AppRow(app: AppCandidate) {
    Card(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(46.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.10f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.Apps, null, tint = MaterialTheme.colorScheme.primary)
            }
            Column(
                modifier = Modifier
                    .weight(1f)
                    .padding(horizontal = 12.dp)
            ) {
                Text(app.name, fontWeight = FontWeight.SemiBold)
                val lastUse = if (app.daysSinceLastUse <= 1) "usada ayer" else "hace ${app.daysSinceLastUse} días"
                Text(lastUse, fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                if (app.recommendation == Recommendation.REMOVE) {
                    Text("Candidata a eliminar", fontSize = 12.sp, color = MaterialTheme.colorScheme.secondary)
                }
            }
            Text(app.sizeLabel, fontWeight = FontWeight.SemiBold)
        }
    }
}

@Composable
private fun CleanScreen() {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 20.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item { Spacer(Modifier.height(16.dp)) }
        item {
            Text("Limpieza guiada", fontSize = 28.sp, fontWeight = FontWeight.Bold)
            Text("Revisa antes de eliminar. LIA Cleaner no borra nada importante sin tu acción.", color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        item { CleanAction("Eliminar apps sin usar", "Hasta 3.2 GB") }
        item { CleanAction("Borrar archivos grandes", "Hasta 6.8 GB") }
        item { CleanAction("Revisar descargas", "Hasta 1.1 GB") }
    }
}

@Composable
private fun CleanAction(title: String, amount: String) {
    Card(
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(18.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Default.Storage, null, tint = MaterialTheme.colorScheme.primary)
            Column(
                modifier = Modifier
                    .weight(1f)
                    .padding(horizontal = 14.dp)
            ) {
                Text(title, fontWeight = FontWeight.SemiBold)
                Text(amount, color = MaterialTheme.colorScheme.secondary)
            }
        }
    }
}
