package mx.direkta.liacleaner.ui

import androidx.compose.foundation.Image
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
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Apps
import androidx.compose.material.icons.filled.CleaningServices
import androidx.compose.material.icons.filled.DeleteOutline
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Info
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
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
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
import kotlinx.coroutines.launch
import mx.direkta.liacleaner.model.AppCandidate
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
    val advancedPhotoAnalyzer = remember { AdvancedPhotoAnalyzer(context.applicationContext, photoAnalyzer) }

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

    LaunchedEffect(Unit) { refreshApps() }

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
        Box(Modifier.fillMaxSize().padding(padding)) {
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
        modifier = Modifier.fillMaxSize().padding(horizontal = 20.dp),
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
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.08f))
                ) {
                    Column(Modifier.padding(18.dp)) {
                        Text("Falta acceso de uso", fontWeight = FontWeight.SemiBold)
                        Text(
                            "Actívalo para calcular inactividad, tamaño real de las apps y el desglose del almacenamiento.",
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(Modifier.height(10.dp))
                        Button(onClick = onGrantUsage) { Text("Dar acceso") }
                    }
                }
            }
        }

        item {
            StorageOverviewCard(
                usageAccess = usageAccess,
                onGrantUsage = onGrantUsage
            )
        }

        item {
            Card(
                shape = RoundedCornerShape(28.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(2.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(22.dp),
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
                if (candidates.isNotEmpty() && candidates.none { it.sizeBytes != null }) "—" else formatBytes(recoverableBytes),
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
                modifier = Modifier.fillMaxWidth().height(56.dp),
                shape = RoundedCornerShape(18.dp)
            ) { Text("Revisar aplicaciones") }
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
    val protectedApps = apps.count { it.isProtected }
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
            AppSortMode.INACTIVITY -> filtered.sortedByDescending { it.daysSinceLastUse ?: it.installAgeDays ?: -1 }
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
            title = { Text(if (app.isSystemComponent) "Abrir ${app.name}?" else "Desinstalar ${app.name}?") },
            text = {
                Text(
                    if (app.isSystemComponent) {
                        "Es un componente protegido. LIA abrirá su ficha de Android y no intentará desinstalarlo."
                    } else {
                        "LIA Cleaner abrirá el desinstalador de Android. Android pedirá la confirmación final."
                    }
                )
            },
            confirmButton = {
                TextButton(onClick = {
                    pendingUninstall = null
                    onUninstall(app.packageName)
                }) { Text(if (app.isSystemComponent) "Abrir ficha" else "Desinstalar") }
            },
            dismissButton = { TextButton(onClick = { pendingUninstall = null }) { Text("Cancelar") } }
        )
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(horizontal = 14.dp),
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
                        "${apps.size} visibles en el análisis",
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                IconButton(onClick = onRefresh) { Icon(Icons.Default.Refresh, contentDescription = "Actualizar") }
            }
        }

        if (!usageAccess) {
            item {
                Card(
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.08f))
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

        if (apps.any { it.isSystemComponent }) {
            item {
                Card(
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.45f))
                ) {
                    Column(Modifier.padding(14.dp)) {
                        Text("Vista de sistema activa", fontWeight = FontWeight.SemiBold)
                        Text(
                            "$protectedApps componentes protegidos visibles. No cuentan como espacio liberable ni se recomiendan para eliminar.",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }

        if (usageAccess && noDataApps > 0 && noDataApps >= (apps.size - protectedApps).coerceAtLeast(1)) {
            item {
                Card(
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.45f))
                ) {
                    Column(Modifier.padding(14.dp)) {
                        Text("Permiso activo, pero faltan estadísticas", fontWeight = FontWeight.SemiBold)
                        Text(
                            "Android/HyperOS no devolvió historial utilizable. LIA no inventará candidatas.",
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
                Card(shape = RoundedCornerShape(18.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                    Column(Modifier.fillMaxWidth().padding(18.dp)) {
                        Text("No hay candidatas con los datos actuales", fontWeight = FontWeight.SemiBold)
                        Text(
                            if (!usageAccess) "Activa el acceso de uso y vuelve a esta pantalla."
                            else "Quita el filtro para revisar las apps con evidencia insuficiente.",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }

        items(visibleApps, key = { it.packageName }) { app ->
            AppRow(app = app, onAction = { pendingUninstall = app })
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
            Text(recoverable, fontSize = 30.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.secondary)
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
private fun SortChip(label: String, selected: Boolean, onClick: () -> Unit) {
    FilterChip(selected = selected, onClick = onClick, label = { Text(label, fontSize = 12.sp) })
}

@Composable
private fun AppRow(app: AppCandidate, onAction: () -> Unit) {
    Card(shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 10.dp, vertical = 9.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            AppIcon(app.packageName)
            Column(Modifier.weight(1f).padding(horizontal = 10.dp)) {
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
                IconButton(onClick = onAction, modifier = Modifier.size(36.dp)) {
                    Icon(
                        if (app.isSystemComponent) Icons.Default.Info else Icons.Default.DeleteOutline,
                        contentDescription = if (app.isSystemComponent) "Ver ${app.name}" else "Desinstalar ${app.name}",
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
    RecommendationReason.PROTECTED_APP -> if (app.isSystemComponent) "Sistema · protegida" else "Protegida de recomendaciones automáticas"
    RecommendationReason.USED_RECENTLY -> "Uso reciente"
}

@Composable
private fun AppIcon(packageName: String) {
    val context = LocalContext.current
    val bitmap = remember(packageName) {
        runCatching {
            context.packageManager.getApplicationIcon(packageName).toBitmap(width = 96, height = 96).asImageBitmap()
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
            modifier = Modifier.size(42.dp).clip(RoundedCornerShape(11.dp)).background(MaterialTheme.colorScheme.primary.copy(alpha = 0.10f)),
            contentAlignment = Alignment.Center
        ) { Icon(Icons.Default.Apps, null, tint = MaterialTheme.colorScheme.primary) }
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
                "Apps, fotos, archivos y descargas. LIA analiza; tú decides qué borrar.",
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
            PhotoCleanerSectionV2(
                photoAnalyzer = photoAnalyzer,
                advancedPhotoAnalyzer = advancedPhotoAnalyzer
            )
        }
        item { FileCleanerSection() }
        item { Spacer(Modifier.height(12.dp)) }
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
    return String.format("%.2f GB", mb / 1024.0)
}
