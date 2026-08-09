package mx.direkta.liacleaner.ui

import android.Manifest
import android.app.Activity
import android.os.Build
import android.provider.MediaStore
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.IntentSenderRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Apps
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.CleaningServices
import androidx.compose.material.icons.filled.DeleteOutline
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Storage
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.graphics.drawable.toBitmap
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import mx.direkta.liacleaner.model.AppCandidate
import mx.direkta.liacleaner.model.PhotoGroup
import mx.direkta.liacleaner.model.PhotoGroupKind
import mx.direkta.liacleaner.model.PhotoItem
import mx.direkta.liacleaner.model.PhotoScanResult
import mx.direkta.liacleaner.model.Recommendation
import mx.direkta.liacleaner.model.RecommendationReason
import mx.direkta.liacleaner.photo.AdvancedPhotoAnalyzer
import mx.direkta.liacleaner.photo.PhotoAnalyzer
import mx.direkta.liacleaner.system.AndroidSystemGateway

enum class AppSortMode {
    INACTIVITY,
    SIZE,
    LOW_USAGE,
    NAME
}

@Composable
fun LiaCleanerApp(systemGateway: AndroidSystemGateway) {
    var tab by remember { mutableIntStateOf(0) }
    var apps by remember { mutableStateOf<List<AppCandidate>>(emptyList()) }
    var usageAccess by remember { mutableStateOf(false) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val photoAnalyzer = remember { PhotoAnalyzer(context.applicationContext) }
    val advancedPhotoAnalyzer = remember {
        AdvancedPhotoAnalyzer(context.applicationContext, photoAnalyzer)
    }

    fun refreshApps() {
        scope.launch {
            loading = true
            error = null
            runCatching {
                usageAccess = systemGateway.hasUsageAccess()
                apps = systemGateway.installedApps()
            }.onFailure {
                error = it.message ?: "No fue posible leer las aplicaciones del teléfono."
            }
            loading = false
        }
    }

    LaunchedEffect(Unit) {
        refreshApps()
    }

    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) refreshApps()
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

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
                0 -> HomeScreen(
                    apps = apps,
                    usageAccess = usageAccess,
                    onReviewApps = { tab = 1 },
                    onGrantUsage = systemGateway::openUsageAccessSettings
                )
                1 -> AppsScreen(
                    apps = apps,
                    usageAccess = usageAccess,
                    loading = loading,
                    error = error,
                    onGrantUsage = systemGateway::openUsageAccessSettings,
                    onRefresh = ::refreshApps,
                    onUninstall = systemGateway::requestUninstall
                )
                else -> CleanScreen(
                    apps = apps,
                    onReviewApps = { tab = 1 },
                    photoAnalyzer = photoAnalyzer,
                    advancedPhotoAnalyzer = advancedPhotoAnalyzer
                )
            }
        }
    }
}

@Composable
private fun HomeScreen(
    apps: List<AppCandidate>,
    usageAccess: Boolean,
    onReviewApps: () -> Unit,
    onGrantUsage: () -> Unit
) {
    val candidates = apps.filter { it.recommendation == Recommendation.REMOVE }
    val recoverableBytes = candidates.mapNotNull { it.sizeBytes }.sum()
    val dataUnavailable = apps.count {
        it.reason == RecommendationReason.USAGE_DATA_UNAVAILABLE ||
            it.reason == RecommendationReason.USAGE_ACCESS_REQUIRED
    }
    val analysisReady = usageAccess && apps.isNotEmpty() && dataUnavailable < apps.size
    val score = (100 - candidates.size * 2).coerceIn(45, 100)

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

        if (!usageAccess) {
            item {
                Card(
                    shape = RoundedCornerShape(22.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.08f)
                    )
                ) {
                    Column(Modifier.padding(18.dp)) {
                        Text("Falta acceso de uso", fontWeight = FontWeight.SemiBold)
                        Text(
                            "Actívalo para calcular inactividad y tamaño real de las apps.",
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(Modifier.height(10.dp))
                        Button(onClick = onGrantUsage) { Text("Dar acceso") }
                    }
                }
            }
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
                    Column(Modifier.weight(1f)) {
                        Text("Estado del análisis", fontWeight = FontWeight.SemiBold)
                        Spacer(Modifier.height(8.dp))
                        Text(
                            if (analysisReady) "$score/100" else "Pendiente",
                            fontSize = if (analysisReady) 34.sp else 26.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Text(
                            if (analysisReady) "${candidates.size} apps candidatas" else "Faltan datos de uso",
                            color = MaterialTheme.colorScheme.secondary
                        )
                    }
                    HealthRing(if (analysisReady) score.toString() else "—")
                }
            }
        }

        item {
            Text("Espacio liberable en apps", color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text(
                if (candidates.isNotEmpty() && candidates.none { it.sizeBytes != null }) "—"
                else formatBytes(recoverableBytes),
                fontSize = 32.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.secondary
            )
        }

        item {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                MetricCard("Apps detectadas", apps.size.toString(), Modifier.weight(1f))
                MetricCard("Candidatas", candidates.size.toString(), Modifier.weight(1f))
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
                Text("Revisar aplicaciones")
            }
        }
        item { Spacer(Modifier.height(8.dp)) }
    }
}

@Composable
private fun HealthRing(label: String) {
    Box(
        modifier = Modifier
            .size(96.dp)
            .clip(RoundedCornerShape(48.dp))
            .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.10f)),
        contentAlignment = Alignment.Center
    ) {
        Text(label, fontSize = 28.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
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
private fun AppsScreen(
    apps: List<AppCandidate>,
    usageAccess: Boolean,
    loading: Boolean,
    error: String?,
    onGrantUsage: () -> Unit,
    onRefresh: () -> Unit,
    onUninstall: (String) -> Unit
) {
    var pendingUninstall by remember { mutableStateOf<AppCandidate?>(null) }
    var sortMode by remember { mutableStateOf(AppSortMode.INACTIVITY) }
    var onlyCandidates by remember { mutableStateOf(false) }
    var searchQuery by remember { mutableStateOf("") }

    val candidateApps = apps.filter { it.recommendation == Recommendation.REMOVE }
    val recoverableKnown = candidateApps.mapNotNull { it.sizeBytes }
    val recoverableBytes = recoverableKnown.sum()
    val reviewApps = apps.count { it.recommendation == Recommendation.REVIEW }
    val recentApps = apps.count { it.recommendation == Recommendation.KEEP && !it.isProtected }
    val noDataApps = apps.count {
        it.reason == RecommendationReason.USAGE_DATA_UNAVAILABLE ||
            it.reason == RecommendationReason.USAGE_ACCESS_REQUIRED
    }

    val visibleApps = remember(apps, sortMode, onlyCandidates, searchQuery) {
        val filtered = apps.asSequence()
            .filter { !onlyCandidates || it.recommendation == Recommendation.REMOVE }
            .filter {
                searchQuery.isBlank() ||
                    it.name.contains(searchQuery, ignoreCase = true) ||
                    it.packageName.contains(searchQuery, ignoreCase = true)
            }
            .toList()

        when (sortMode) {
            AppSortMode.INACTIVITY -> filtered.sortedByDescending {
                it.daysSinceLastUse ?: it.installAgeDays ?: -1
            }
            AppSortMode.SIZE -> filtered.sortedByDescending { it.sizeBytes ?: -1L }
            AppSortMode.LOW_USAGE -> filtered.sortedWith(
                compareBy<AppCandidate> { it.totalTimeInForegroundMs ?: Long.MAX_VALUE }
                    .thenByDescending { it.daysSinceLastUse ?: it.installAgeDays ?: -1 }
            )
            AppSortMode.NAME -> filtered.sortedBy { it.name.lowercase() }
        }
    }

    pendingUninstall?.let { app ->
        AlertDialog(
            onDismissRequest = { pendingUninstall = null },
            title = { Text("Desinstalar ${app.name}?") },
            text = {
                Text("LIA Cleaner abrirá el desinstalador de Android. Android te pedirá la confirmación final.")
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        pendingUninstall = null
                        onUninstall(app.packageName)
                    }
                ) { Text("Desinstalar") }
            },
            dismissButton = {
                TextButton(onClick = { pendingUninstall = null }) { Text("Cancelar") }
            }
        )
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 14.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        item { Spacer(Modifier.height(10.dp)) }
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text("Aplicaciones", fontSize = 26.sp, fontWeight = FontWeight.Bold)
                    Text(
                        "${apps.size} instaladas por el usuario",
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                IconButton(onClick = onRefresh) {
                    Icon(Icons.Default.Refresh, contentDescription = "Actualizar")
                }
            }
        }

        if (!usageAccess) {
            item {
                Card(
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.08f)
                    )
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(Modifier.weight(1f)) {
                            Text("Activa Acceso de uso", fontWeight = FontWeight.SemiBold)
                            Text(
                                "Necesario para inactividad, tiempo de uso y tamaño.",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        TextButton(onClick = onGrantUsage) { Text("Abrir") }
                    }
                }
            }
        }

        if (usageAccess && noDataApps > 0 && noDataApps >= (apps.size - apps.count { it.isProtected }).coerceAtLeast(1)) {
            item {
                Card(
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.45f)
                    )
                ) {
                    Column(Modifier.padding(14.dp)) {
                        Text("Permiso activo, pero faltan estadísticas", fontWeight = FontWeight.SemiBold)
                        Text(
                            "Android/HyperOS no devolvió un historial utilizable. LIA no inventará candidatas hasta tener evidencia suficiente.",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }

        item {
            AppStatsSummary(
                candidateCount = candidateApps.size,
                recoverable = if (candidateApps.isNotEmpty() && recoverableKnown.isEmpty()) "—" else formatBytes(recoverableBytes),
                reviewCount = reviewApps,
                recentCount = recentApps,
                noDataCount = noDataApps,
                knownSizes = recoverableKnown.size
            )
        }

        item {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                shape = RoundedCornerShape(16.dp),
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                placeholder = { Text("Buscar app") }
            )
        }

        item {
            FilterChip(
                selected = onlyCandidates,
                onClick = { onlyCandidates = !onlyCandidates },
                label = { Text("Solo candidatas a eliminar") }
            )
        }

        item {
            Text("Ordenar por", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            LazyRow(horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                item { SortChip("Inactividad", sortMode == AppSortMode.INACTIVITY) { sortMode = AppSortMode.INACTIVITY } }
                item { SortChip("Tamaño", sortMode == AppSortMode.SIZE) { sortMode = AppSortMode.SIZE } }
                item { SortChip("Menos usadas", sortMode == AppSortMode.LOW_USAGE) { sortMode = AppSortMode.LOW_USAGE } }
                item { SortChip("Nombre", sortMode == AppSortMode.NAME) { sortMode = AppSortMode.NAME } }
            }
        }

        item {
            Text(
                "Mostrando ${visibleApps.size} de ${apps.size}",
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        if (loading) {
            item {
                Box(Modifier.fillMaxWidth().padding(18.dp), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            }
        }

        error?.let { message -> item { Text(message, color = MaterialTheme.colorScheme.error) } }

        if (!loading && onlyCandidates && visibleApps.isEmpty()) {
            item {
                Card(
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White)
                ) {
                    Column(Modifier.fillMaxWidth().padding(18.dp)) {
                        Text("No hay candidatas con los datos actuales", fontWeight = FontWeight.SemiBold)
                        Text(
                            if (!usageAccess) "Activa el acceso de uso y vuelve a esta pantalla."
                            else "Quita este filtro para revisar las apps sin historial o con evidencia insuficiente.",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }

        items(visibleApps, key = { it.packageName }) { app ->
            AppRow(app = app, onUninstall = { pendingUninstall = app })
        }
        item { Spacer(Modifier.height(10.dp)) }
    }
}

@Composable
private fun AppStatsSummary(
    candidateCount: Int,
    recoverable: String,
    reviewCount: Int,
    recentCount: Int,
    noDataCount: Int,
    knownSizes: Int
) {
    Card(
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(1.dp)
    ) {
        Column(Modifier.fillMaxWidth().padding(16.dp)) {
            Text("Espacio que podrías liberar", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Spacer(Modifier.height(3.dp))
            Text(
                recoverable,
                fontSize = 30.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.secondary
            )
            Text(
                "$candidateCount candidatas · tamaño conocido en $knownSizes",
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(Modifier.height(14.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                CompactStat("Revisar", reviewCount.toString(), Modifier.weight(1f))
                CompactStat("Uso reciente", recentCount.toString(), Modifier.weight(1f))
                CompactStat("Sin datos", noDataCount.toString(), Modifier.weight(1f))
            }
        }
    }
}

@Composable
private fun CompactStat(title: String, value: String, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(14.dp))
            .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.45f))
            .padding(horizontal = 10.dp, vertical = 9.dp)
    ) {
        Column {
            Text(value, fontSize = 18.sp, fontWeight = FontWeight.Bold)
            Text(title, fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1)
        }
    }
}

@Composable
private fun MiniStatCard(title: String, value: String, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Column(Modifier.padding(horizontal = 10.dp, vertical = 9.dp)) {
            Text(title, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text(value, fontSize = 16.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun SortChip(label: String, selected: Boolean, onClick: () -> Unit) {
    FilterChip(
        selected = selected,
        onClick = onClick,
        label = { Text(label, fontSize = 12.sp) }
    )
}

@Composable
private fun AppRow(app: AppCandidate, onUninstall: () -> Unit) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 10.dp, vertical = 9.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            AppIcon(app.packageName)
            Column(
                modifier = Modifier.weight(1f).padding(horizontal = 10.dp)
            ) {
                Text(app.name, fontSize = 15.sp, fontWeight = FontWeight.SemiBold, maxLines = 1)
                Text(
                    usageDescription(app),
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1
                )
                Text(
                    recommendationDescription(app),
                    fontSize = 11.sp,
                    color = recommendationColor(app)
                )
            }
            Column(horizontalAlignment = Alignment.End) {
                Text(formatBytes(app.sizeBytes), fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                IconButton(onClick = onUninstall, modifier = Modifier.size(36.dp)) {
                    Icon(
                        Icons.Default.DeleteOutline,
                        contentDescription = "Desinstalar ${app.name}",
                        tint = MaterialTheme.colorScheme.primary
                    )
                }
            }
        }
    }
}

@Composable
private fun recommendationColor(app: AppCandidate): Color = when (app.recommendation) {
    Recommendation.REMOVE -> MaterialTheme.colorScheme.secondary
    Recommendation.REVIEW -> MaterialTheme.colorScheme.primary
    Recommendation.KEEP -> MaterialTheme.colorScheme.onSurfaceVariant
}

private fun usageDescription(app: AppCandidate): String {
    val last = when {
        app.daysSinceLastUse == 0 -> "Usada hoy"
        app.daysSinceLastUse == 1 -> "Usada ayer"
        app.daysSinceLastUse != null -> "Hace ${app.daysSinceLastUse} días"
        app.installAgeDays != null -> "Sin uso registrado · instalada hace ${app.installAgeDays} d"
        else -> "Sin historial de uso"
    }
    return "$last · Uso 90 d: ${formatUsage(app.totalTimeInForegroundMs)}"
}

private fun recommendationDescription(app: AppCandidate): String = when (app.reason) {
    RecommendationReason.UNUSED_180_PLUS_DAYS -> "Candidata: 180+ días sin usar"
    RecommendationReason.NO_USAGE_RECORDED_OLD_APP -> "Candidata: antigua y sin uso registrado"
    RecommendationReason.UNUSED_90_TO_179_DAYS -> "Conviene revisar: 90+ días sin usar"
    RecommendationReason.NO_USAGE_RECORDED_RECENT_APP -> "Conviene revisar: sin uso registrado"
    RecommendationReason.USAGE_DATA_UNAVAILABLE -> "Android no devolvió historial suficiente"
    RecommendationReason.USAGE_ACCESS_REQUIRED -> "Falta permiso de estadísticas de uso"
    RecommendationReason.PROTECTED_APP -> "Protegida de recomendaciones automáticas"
    RecommendationReason.USED_RECENTLY -> "Uso reciente"
}

@Composable
private fun AppIcon(packageName: String) {
    val context = LocalContext.current
    val bitmap = remember(packageName) {
        runCatching {
            context.packageManager
                .getApplicationIcon(packageName)
                .toBitmap(width = 96, height = 96)
                .asImageBitmap()
        }.getOrNull()
    }

    if (bitmap != null) {
        Image(
            bitmap = bitmap,
            contentDescription = null,
            modifier = Modifier.size(42.dp).clip(RoundedCornerShape(11.dp)),
            contentScale = ContentScale.Fit
        )
    } else {
        Box(
            modifier = Modifier
                .size(42.dp)
                .clip(RoundedCornerShape(11.dp))
                .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.10f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(Icons.Default.Apps, null, tint = MaterialTheme.colorScheme.primary)
        }
    }
}

@Composable
private fun CleanScreen(
    apps: List<AppCandidate>,
    onReviewApps: () -> Unit,
    photoAnalyzer: PhotoAnalyzer,
    advancedPhotoAnalyzer: AdvancedPhotoAnalyzer
) {
    val candidates = apps.filter { it.recommendation == Recommendation.REMOVE }
    val appRecoverable = candidates.mapNotNull { it.sizeBytes }.sum()

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(horizontal = 14.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        item { Spacer(Modifier.height(12.dp)) }
        item {
            Text("Limpieza guiada", fontSize = 28.sp, fontWeight = FontWeight.Bold)
            Text(
                "LIA recomienda; tú decides qué eliminar.",
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        item {
            CleanAction(
                title = "${candidates.size} apps candidatas",
                amount = if (candidates.isNotEmpty() && candidates.none { it.sizeBytes != null }) "—" else formatBytes(appRecoverable),
                onClick = onReviewApps
            )
        }
        item {
            PhotoCleanerSection(
                photoAnalyzer = photoAnalyzer,
                advancedPhotoAnalyzer = advancedPhotoAnalyzer
            )
        }
        item { CleanAction("Archivos grandes", "Próxima fase", onClick = {}) }
        item { CleanAction("Descargas", "Próxima fase", onClick = {}) }
        item { Spacer(Modifier.height(12.dp)) }
    }
}

@Composable
private fun PhotoCleanerSection(
    photoAnalyzer: PhotoAnalyzer,
    advancedPhotoAnalyzer: AdvancedPhotoAnalyzer
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var photoAccess by remember { mutableStateOf(photoAnalyzer.hasPhotoAccess()) }
    var quickResult by remember { mutableStateOf<PhotoScanResult?>(null) }
    var aiGroups by remember { mutableStateOf<List<PhotoGroup>>(emptyList()) }
    var scanning by remember { mutableStateOf(false) }
    var advancedScanning by remember { mutableStateOf(false) }
    var done by remember { mutableIntStateOf(0) }
    var total by remember { mutableIntStateOf(0) }
    var message by remember { mutableStateOf<String?>(null) }

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) {
        photoAccess = photoAnalyzer.hasPhotoAccess()
        message = if (photoAccess) {
            "Acceso concedido. Ya puedes analizar las fotos disponibles."
        } else {
            "Android no concedió acceso a las fotos."
        }
    }

    val deleteLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.StartIntentSenderForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            quickResult = null
            aiGroups = emptyList()
            message = "Eliminación completada. Analiza de nuevo para actualizar los resultados."
        }
    }

    fun requestPhotoAccess() {
        val permissions = when {
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE -> arrayOf(
                Manifest.permission.READ_MEDIA_IMAGES,
                Manifest.permission.READ_MEDIA_VISUAL_USER_SELECTED
            )
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU -> arrayOf(
                Manifest.permission.READ_MEDIA_IMAGES
            )
            else -> arrayOf(Manifest.permission.READ_EXTERNAL_STORAGE)
        }
        permissionLauncher.launch(permissions)
    }

    fun runQuickScan() {
        if (!photoAnalyzer.hasPhotoAccess()) {
            photoAccess = false
            requestPhotoAccess()
            return
        }
        scope.launch {
            scanning = true
            aiGroups = emptyList()
            message = null
            done = 0
            total = 0
            runCatching {
                photoAnalyzer.quickScan { progressDone, progressTotal ->
                    withContext(Dispatchers.Main) {
                        done = progressDone
                        total = progressTotal
                    }
                }
            }.onSuccess {
                quickResult = it
                message = "Análisis rápido terminado."
            }.onFailure {
                message = it.message ?: "No fue posible analizar las fotos."
            }
            scanning = false
        }
    }

    fun runAdvancedScan() {
        val quick = quickResult ?: return
        scope.launch {
            advancedScanning = true
            message = null
            done = 0
            total = 0
            runCatching {
                advancedPhotoAnalyzer.analyze(quick) { progressDone, progressTotal ->
                    withContext(Dispatchers.Main) {
                        done = progressDone
                        total = progressTotal
                    }
                }
            }.onSuccess {
                aiGroups = it
                message = "Análisis avanzado terminado."
            }.onFailure {
                message = it.message ?: "No fue posible completar el análisis avanzado."
            }
            advancedScanning = false
        }
    }

    fun deletePhotos(photos: List<PhotoItem>) {
        if (photos.isEmpty()) return
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            val pendingIntent = MediaStore.createDeleteRequest(
                context.contentResolver,
                photos.map { it.uri }
            )
            deleteLauncher.launch(
                IntentSenderRequest.Builder(pendingIntent.intentSender).build()
            )
        } else {
            scope.launch(Dispatchers.IO) {
                photos.forEach { photo ->
                    runCatching { context.contentResolver.delete(photo.uri, null, null) }
                }
                withContext(Dispatchers.Main) {
                    quickResult = null
                    aiGroups = emptyList()
                    message = "Eliminación completada. Analiza de nuevo para actualizar."
                }
            }
        }
    }

    Card(
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Column(Modifier.fillMaxWidth().padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Image, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                Column(Modifier.weight(1f).padding(horizontal = 12.dp)) {
                    Text("Fotos duplicadas y similares", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                    Text(
                        "Primero usa hashes: rápido, local y de bajo consumo.",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Spacer(Modifier.height(12.dp))

            if (!photoAccess) {
                Text(
                    "Necesitamos permiso para leer las fotos que quieras analizar. En Android 14+ puedes permitir toda la biblioteca o solo una selección.",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(Modifier.height(8.dp))
                Button(onClick = ::requestPhotoAccess, modifier = Modifier.fillMaxWidth()) {
                    Text("Dar acceso a fotos")
                }
            } else {
                Button(
                    onClick = ::runQuickScan,
                    enabled = !scanning && !advancedScanning,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    if (scanning) {
                        CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                        Spacer(Modifier.size(8.dp))
                        Text(if (total > 0) "$done / $total" else "Analizando…")
                    } else {
                        Text(if (quickResult == null) "Analizar fotos" else "Analizar de nuevo")
                    }
                }
            }

            message?.let {
                Spacer(Modifier.height(8.dp))
                Text(it, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }

            quickResult?.let { result ->
                Spacer(Modifier.height(14.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    MiniStatCard("Fotos", result.photos.size.toString(), Modifier.weight(1f))
                    MiniStatCard("Exactas", result.exactGroups.size.toString(), Modifier.weight(1f))
                    MiniStatCard("Casi iguales", result.nearGroups.size.toString(), Modifier.weight(1f))
                }
                Spacer(Modifier.height(8.dp))
                MiniStatCard(
                    title = "Espacio potencialmente recuperable",
                    value = formatBytes(result.recoverableBytes),
                    modifier = Modifier.fillMaxWidth()
                )

                if (result.quickGroups.isEmpty()) {
                    Spacer(Modifier.height(12.dp))
                    Text("Los hashes no encontraron duplicados o fotos casi idénticas.")
                } else {
                    Spacer(Modifier.height(12.dp))
                    Text("Resultados por hash", fontWeight = FontWeight.Bold)
                    Text(
                        "Los duplicados exactos vienen preseleccionados. En fotos casi iguales debes elegir qué borrar.",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(Modifier.height(8.dp))
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        result.quickGroups.forEach { group ->
                            PhotoGroupCard(group, photoAnalyzer, ::deletePhotos)
                        }
                    }
                }

                Spacer(Modifier.height(16.dp))
                Card(
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.06f)
                    )
                ) {
                    Column(Modifier.padding(14.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.AutoAwesome, null, tint = MaterialTheme.colorScheme.primary)
                            Text(
                                "Análisis avanzado con IA",
                                modifier = Modifier.padding(start = 8.dp),
                                fontWeight = FontWeight.Bold
                            )
                        }
                        Spacer(Modifier.height(6.dp))
                        Text(
                            "Busca similitudes que los hashes pueden no detectar, como recortes, ediciones o cambios de encuadre. Requiere más tiempo, memoria y batería. Todo se procesa en este dispositivo; tus fotos no se envían a Internet.",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(Modifier.height(10.dp))
                        OutlinedButton(
                            onClick = ::runAdvancedScan,
                            enabled = !scanning && !advancedScanning,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            if (advancedScanning) {
                                CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                                Spacer(Modifier.size(8.dp))
                                Text(if (total > 0) "$done / $total" else "Analizando con IA…")
                            } else {
                                Text(if (aiGroups.isEmpty()) "Iniciar análisis avanzado" else "Repetir análisis avanzado")
                            }
                        }
                    }
                }

                if (aiGroups.isNotEmpty()) {
                    Spacer(Modifier.height(12.dp))
                    Text("Similares encontradas por IA", fontWeight = FontWeight.Bold)
                    Text(
                        "Revisión manual obligatoria: LIA no preselecciona fotos similares para borrar.",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(Modifier.height(8.dp))
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        aiGroups.forEach { group ->
                            PhotoGroupCard(group, photoAnalyzer, ::deletePhotos)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun PhotoGroupCard(
    group: PhotoGroup,
    analyzer: PhotoAnalyzer,
    onDelete: (List<PhotoItem>) -> Unit
) {
    val defaultSelection = remember(group.id) {
        if (group.kind == PhotoGroupKind.EXACT) {
            group.photos.drop(1).mapTo(mutableSetOf()) { it.id }
        } else {
            mutableSetOf()
        }
    }
    var selectedIds by remember(group.id) { mutableStateOf(defaultSelection.toSet()) }

    val title = when (group.kind) {
        PhotoGroupKind.EXACT -> "Duplicado exacto"
        PhotoGroupKind.NEAR_DUPLICATE -> "Casi idénticas"
        PhotoGroupKind.AI_SIMILAR -> "Similares con IA"
    }

    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.34f))
    ) {
        Column(Modifier.fillMaxWidth().padding(10.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(Modifier.weight(1f)) {
                    Text("$title · ${group.photos.size} fotos", fontWeight = FontWeight.SemiBold)
                    Text(
                        "Hasta ${formatBytes(group.recoverableBytes)} recuperables",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.secondary
                    )
                }
                group.similarity?.let { score ->
                    Text("${(score * 100).toInt()}%", fontWeight = FontWeight.Bold)
                }
            }

            Spacer(Modifier.height(8.dp))
            LazyRow(horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                items(group.photos, key = { it.id }) { photo ->
                    PhotoThumbnail(
                        photo = photo,
                        analyzer = analyzer,
                        selected = photo.id in selectedIds,
                        onToggle = {
                            selectedIds = if (photo.id in selectedIds) {
                                selectedIds - photo.id
                            } else {
                                selectedIds + photo.id
                            }
                        }
                    )
                }
            }

            Spacer(Modifier.height(8.dp))
            val helper = when (group.kind) {
                PhotoGroupKind.EXACT -> "LIA propone conservar la primera copia y borrar las demás."
                PhotoGroupKind.NEAR_DUPLICATE -> "Revisa las miniaturas y marca solo las que quieras borrar."
                PhotoGroupKind.AI_SIMILAR -> "La IA detectó parecido visual; revisa antes de seleccionar."
            }
            Text(helper, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)

            if (selectedIds.isNotEmpty()) {
                Spacer(Modifier.height(6.dp))
                OutlinedButton(
                    onClick = {
                        onDelete(group.photos.filter { it.id in selectedIds })
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.DeleteOutline, contentDescription = null)
                    Spacer(Modifier.size(6.dp))
                    Text("Eliminar seleccionadas (${selectedIds.size})")
                }
            }
        }
    }
}

@Composable
private fun PhotoThumbnail(
    photo: PhotoItem,
    analyzer: PhotoAnalyzer,
    selected: Boolean,
    onToggle: () -> Unit
) {
    val image by produceState<ImageBitmap?>(initialValue = null, key1 = photo.id) {
        value = withContext(Dispatchers.IO) {
            analyzer.loadPreview(photo.uri, 180)?.asImageBitmap()
        }
    }

    Box(
        modifier = Modifier
            .size(96.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(MaterialTheme.colorScheme.surface)
            .clickable(onClick = onToggle)
    ) {
        if (image != null) {
            Image(
                bitmap = image!!,
                contentDescription = photo.name,
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Crop
            )
        } else {
            Icon(
                Icons.Default.Image,
                contentDescription = null,
                modifier = Modifier.align(Alignment.Center),
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        if (selected) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.20f))
            )
            Icon(
                Icons.Default.CheckCircle,
                contentDescription = "Seleccionada",
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.align(Alignment.TopEnd).padding(5.dp)
            )
        }
        Text(
            formatBytes(photo.sizeBytes),
            fontSize = 9.sp,
            color = Color.White,
            modifier = Modifier
                .align(Alignment.BottomStart)
                .background(Color.Black.copy(alpha = 0.55f))
                .padding(horizontal = 4.dp, vertical = 2.dp)
        )
    }
}

@Composable
private fun CleanAction(title: String, amount: String, onClick: () -> Unit) {
    Card(
        onClick = onClick,
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(18.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Default.Storage, null, tint = MaterialTheme.colorScheme.primary)
            Column(Modifier.weight(1f).padding(horizontal = 14.dp)) {
                Text(title, fontWeight = FontWeight.SemiBold)
                Text(amount, color = MaterialTheme.colorScheme.secondary)
            }
        }
    }
}

private fun formatUsage(milliseconds: Long?): String {
    if (milliseconds == null) return "sin datos"
    if (milliseconds <= 0L) return "0 min"
    val totalMinutes = milliseconds / 60_000L
    if (totalMinutes < 1L) return "<1 min"
    if (totalMinutes < 60L) return "$totalMinutes min"
    val hours = totalMinutes / 60L
    val minutes = totalMinutes % 60L
    return if (minutes == 0L) "$hours h" else "$hours h $minutes min"
}

private fun formatBytes(bytes: Long?): String {
    if (bytes == null) return "—"
    if (bytes < 1024L) return "$bytes B"
    val kb = bytes / 1024.0
    if (kb < 1024.0) return String.format("%.0f KB", kb)
    val mb = kb / 1024.0
    if (mb < 1024.0) return String.format("%.1f MB", mb)
    val gb = mb / 1024.0
    return String.format("%.2f GB", gb)
}
