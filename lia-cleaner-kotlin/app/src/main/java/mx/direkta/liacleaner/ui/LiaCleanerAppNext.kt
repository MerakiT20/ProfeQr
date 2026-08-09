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
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CleaningServices
import androidx.compose.material.icons.filled.DeleteOutline
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Settings
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
import mx.direkta.liacleaner.photo.AdvancedPhotoAnalyzer
import mx.direkta.liacleaner.photo.PhotoAnalyzer
import mx.direkta.liacleaner.system.AndroidSystemGateway

enum class CleanFocus { OVERVIEW, PHOTOS, VIDEOS, FILES }
private enum class NextSort { INACTIVITY, SIZE, LOW_USAGE, NAME }

@Composable
fun LiaCleanerAppNext(systemGateway: AndroidSystemGateway, onOpenSettings: () -> Unit) {
    var tab by remember { mutableIntStateOf(0) }
    var cleanFocus by remember { mutableStateOf(CleanFocus.OVERVIEW) }
    var apps by remember { mutableStateOf<List<AppCandidate>>(emptyList()) }
    var usageAccess by remember { mutableStateOf(false) }
    var loading by remember { mutableStateOf(true) }
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val photoAnalyzer = remember { PhotoAnalyzer(context.applicationContext) }
    val advancedPhotoAnalyzer = remember { AdvancedPhotoAnalyzer(context.applicationContext, photoAnalyzer) }

    fun refresh() {
        scope.launch {
            loading = true
            runCatching {
                usageAccess = systemGateway.hasUsageAccess()
                apps = systemGateway.installedApps()
            }
            loading = false
        }
    }

    LaunchedEffect(Unit) { refresh() }
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, e -> if (e == Lifecycle.Event.ON_RESUME) refresh() }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    fun openClean(focus: CleanFocus) { cleanFocus = focus; tab = 2 }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        bottomBar = {
            NavigationBar(containerColor = MaterialTheme.colorScheme.surface) {
                NavigationBarItem(tab == 0, { tab = 0 }, { Icon(Icons.Default.Home, null) }, label = { Text("Inicio") })
                NavigationBarItem(tab == 1, { tab = 1 }, { Icon(Icons.Default.Apps, null) }, label = { Text("Apps") })
                NavigationBarItem(tab == 2, { tab = 2; cleanFocus = CleanFocus.OVERVIEW }, { Icon(Icons.Default.CleaningServices, null) }, label = { Text("Limpiar") })
            }
        }
    ) { padding ->
        Box(Modifier.fillMaxSize().padding(padding)) {
            when (tab) {
                0 -> NextHomeScreen(
                    apps = apps,
                    usageAccess = usageAccess,
                    onGrantUsage = systemGateway::openUsageAccessSettings,
                    onOpenSettings = onOpenSettings,
                    onStorage = { category ->
                        when (category) {
                            StorageCategory.APPS -> tab = 1
                            StorageCategory.IMAGES -> openClean(CleanFocus.PHOTOS)
                            StorageCategory.VIDEOS -> openClean(CleanFocus.VIDEOS)
                            StorageCategory.AUDIO, StorageCategory.OTHER -> openClean(CleanFocus.FILES)
                            StorageCategory.FREE -> Unit
                        }
                    },
                    onReviewApps = { tab = 1 }
                )
                1 -> NextAppsScreen(apps, loading, ::refresh, systemGateway::requestUninstall, onOpenSettings)
                else -> NextCleanScreen(
                    focus = cleanFocus,
                    onFocus = { cleanFocus = it },
                    apps = apps,
                    onReviewApps = { tab = 1 },
                    onOpenSettings = onOpenSettings,
                    photoAnalyzer = photoAnalyzer,
                    advancedPhotoAnalyzer = advancedPhotoAnalyzer
                )
            }
        }
    }
}

@Composable
private fun ScreenHeader(title: String, subtitle: String? = null, onSettings: () -> Unit, onBack: (() -> Unit)? = null) {
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        if (onBack != null) IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, "Volver") }
        Column(Modifier.weight(1f)) {
            Text(title, fontSize = 28.sp, fontWeight = FontWeight.Bold)
            subtitle?.let { Text(it, fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant) }
        }
        IconButton(onClick = onSettings) { Icon(Icons.Default.Settings, "Configuración") }
    }
}

@Composable
private fun NextHomeScreen(
    apps: List<AppCandidate>, usageAccess: Boolean, onGrantUsage: () -> Unit,
    onOpenSettings: () -> Unit, onStorage: (StorageCategory) -> Unit, onReviewApps: () -> Unit
) {
    val candidates = apps.filter { it.recommendation == Recommendation.REMOVE }
    val recoverable = candidates.mapNotNull { it.sizeBytes }.sum()
    LazyColumn(Modifier.fillMaxSize().padding(horizontal = 20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        item { Spacer(Modifier.height(10.dp)) }
        item { ScreenHeader("LIA Cleaner", "Buen día", onOpenSettings) }
        if (!usageAccess) item {
            Card(shape = RoundedCornerShape(18.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary.copy(alpha = .08f))) {
                Column(Modifier.padding(14.dp)) {
                    Text("Falta acceso de uso", fontWeight = FontWeight.SemiBold)
                    Text("Actívalo para analizar apps y almacenamiento con mayor precisión.", fontSize = 12.sp)
                    TextButton(onClick = onGrantUsage) { Text("Dar acceso") }
                }
            }
        }
        item { StorageOverviewCard(usageAccess, onGrantUsage, onStorage) }
        item {
            Card(shape = RoundedCornerShape(20.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondary.copy(alpha = .08f))) {
                Column(Modifier.fillMaxWidth().padding(18.dp)) {
                    Text("Espacio recuperable", fontWeight = FontWeight.Bold)
                    Text(nextBytes(recoverable), fontSize = 30.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.secondary)
                    Text("${candidates.size} apps candidatas para revisar", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 12.sp)
                    Spacer(Modifier.height(8.dp))
                    Button(onClick = onReviewApps, modifier = Modifier.fillMaxWidth()) { Text("Ver recomendaciones") }
                }
            }
        }
        item { Spacer(Modifier.height(8.dp)) }
    }
}

@Composable
private fun NextAppsScreen(
    apps: List<AppCandidate>, loading: Boolean, onRefresh: () -> Unit,
    onAction: (String) -> Unit, onSettings: () -> Unit
) {
    var sort by remember { mutableStateOf(NextSort.INACTIVITY) }
    var onlyCandidates by remember { mutableStateOf(false) }
    var query by remember { mutableStateOf("") }
    var pending by remember { mutableStateOf<AppCandidate?>(null) }
    val shown = remember(apps, sort, onlyCandidates, query) {
        val f = apps.filter { (!onlyCandidates || it.recommendation == Recommendation.REMOVE) && (query.isBlank() || it.name.contains(query, true)) }
        when (sort) {
            NextSort.INACTIVITY -> f.sortedByDescending { it.daysSinceLastUse ?: it.installAgeDays ?: -1 }
            NextSort.SIZE -> f.sortedByDescending { it.sizeBytes ?: -1 }
            NextSort.LOW_USAGE -> f.sortedBy { it.totalTimeInForegroundMs ?: Long.MAX_VALUE }
            NextSort.NAME -> f.sortedBy { it.name.lowercase() }
        }
    }
    pending?.let { app ->
        AlertDialog(
            onDismissRequest = { pending = null },
            title = { Text(if (app.isSystemComponent) "Abrir ${app.name}" else "Desinstalar ${app.name}?") },
            text = { Text(if (app.isSystemComponent) "Es un componente protegido; LIA abrirá su ficha de Android." else "Android pedirá la confirmación final.") },
            confirmButton = { TextButton(onClick = { pending = null; onAction(app.packageName) }) { Text(if (app.isSystemComponent) "Abrir" else "Desinstalar") } },
            dismissButton = { TextButton(onClick = { pending = null }) { Text("Cancelar") } }
        )
    }
    LazyColumn(Modifier.fillMaxSize().padding(horizontal = 14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        item { Spacer(Modifier.height(10.dp)) }
        item { ScreenHeader("Aplicaciones", "${apps.size} visibles", onSettings) }
        item { OutlinedTextField(query, { query = it }, Modifier.fillMaxWidth(), singleLine = true, leadingIcon = { Icon(Icons.Default.Search, null) }, placeholder = { Text("Buscar app") }) }
        item { FilterChip(onlyCandidates, { onlyCandidates = !onlyCandidates }, label = { Text("Solo candidatas") }) }
        item {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                item { FilterChip(sort == NextSort.INACTIVITY, { sort = NextSort.INACTIVITY }, label = { Text("Inactividad") }) }
                item { FilterChip(sort == NextSort.SIZE, { sort = NextSort.SIZE }, label = { Text("Tamaño") }) }
                item { FilterChip(sort == NextSort.LOW_USAGE, { sort = NextSort.LOW_USAGE }, label = { Text("Menos usadas") }) }
                item { FilterChip(sort == NextSort.NAME, { sort = NextSort.NAME }, label = { Text("Nombre") }) }
            }
        }
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("Mostrando ${shown.size}", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                IconButton(onClick = onRefresh) { Icon(Icons.Default.Refresh, "Actualizar") }
            }
        }
        if (loading) item { Box(Modifier.fillMaxWidth().padding(20.dp), contentAlignment = Alignment.Center) { CircularProgressIndicator() } }
        items(shown, key = { it.packageName }) { app ->
            Card(shape = RoundedCornerShape(15.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                Row(Modifier.fillMaxWidth().padding(10.dp), verticalAlignment = Alignment.CenterVertically) {
                    NextAppIcon(app.packageName)
                    Column(Modifier.weight(1f).padding(horizontal = 10.dp)) {
                        Text(app.name, fontWeight = FontWeight.SemiBold, maxLines = 1)
                        Text(nextUsage(app), fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text(if (app.isSystemComponent) "Sistema · protegida" else if (app.recommendation == Recommendation.REMOVE) "Candidata a eliminar" else "Revisar / conservar", fontSize = 10.sp, color = if (app.recommendation == Recommendation.REMOVE) MaterialTheme.colorScheme.secondary else MaterialTheme.colorScheme.primary)
                    }
                    Column(horizontalAlignment = Alignment.End) {
                        Text(nextBytes(app.sizeBytes ?: 0), fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                        IconButton(onClick = { pending = app }) { Icon(if (app.isSystemComponent) Icons.Default.Info else Icons.Default.DeleteOutline, null) }
                    }
                }
            }
        }
    }
}

@Composable
private fun NextCleanScreen(
    focus: CleanFocus, onFocus: (CleanFocus) -> Unit, apps: List<AppCandidate>, onReviewApps: () -> Unit,
    onOpenSettings: () -> Unit, photoAnalyzer: PhotoAnalyzer, advancedPhotoAnalyzer: AdvancedPhotoAnalyzer
) {
    val candidates = apps.filter { it.recommendation == Recommendation.REMOVE }
    LazyColumn(Modifier.fillMaxSize().padding(horizontal = 14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        item { Spacer(Modifier.height(10.dp)) }
        item { ScreenHeader(if (focus == CleanFocus.OVERVIEW) "Limpieza guiada" else when (focus) { CleanFocus.PHOTOS -> "Fotos"; CleanFocus.VIDEOS -> "Videos"; CleanFocus.FILES -> "Archivos"; else -> "Limpieza" }, null, onOpenSettings, if (focus != CleanFocus.OVERVIEW) ({ onFocus(CleanFocus.OVERVIEW) }) else null) }
        item {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                item { FilterChip(focus == CleanFocus.OVERVIEW, { onFocus(CleanFocus.OVERVIEW) }, label = { Text("Resumen") }) }
                item { FilterChip(focus == CleanFocus.PHOTOS, { onFocus(CleanFocus.PHOTOS) }, label = { Text("Fotos") }) }
                item { FilterChip(focus == CleanFocus.VIDEOS, { onFocus(CleanFocus.VIDEOS) }, label = { Text("Videos") }) }
                item { FilterChip(focus == CleanFocus.FILES, { onFocus(CleanFocus.FILES) }, label = { Text("Archivos") }) }
            }
        }
        if (focus == CleanFocus.OVERVIEW) {
            item { CleanJump("${candidates.size} apps candidatas", nextBytes(candidates.mapNotNull { it.sizeBytes }.sum()), onReviewApps) }
            item { CleanJump("Fotos duplicadas y similares", "Hash + IA opcional") { onFocus(CleanFocus.PHOTOS) } }
            item { CleanJump("Videos", "Grandes, antiguos y duplicados") { onFocus(CleanFocus.VIDEOS) } }
            item { CleanJump("Archivos y descargas", "Tamaño, antigüedad y duplicados") { onFocus(CleanFocus.FILES) } }
        } else if (focus == CleanFocus.PHOTOS) {
            item { PhotoCleanerSectionV2(photoAnalyzer, advancedPhotoAnalyzer) }
        } else if (focus == CleanFocus.VIDEOS) {
            item { VideoCleanerSectionV2() }
        } else {
            item { FileCleanerSectionV2() }
        }
        item { Spacer(Modifier.height(10.dp)) }
    }
}

@Composable
private fun CleanJump(title: String, subtitle: String, onClick: () -> Unit) {
    Card(onClick = onClick, shape = RoundedCornerShape(18.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
        Row(Modifier.fillMaxWidth().padding(18.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.size(42.dp).background(MaterialTheme.colorScheme.primary.copy(alpha=.09f), RoundedCornerShape(12.dp)), contentAlignment = Alignment.Center) {
                Icon(Icons.Default.Storage, null, tint = MaterialTheme.colorScheme.primary)
            }
            Column(Modifier.padding(start = 12.dp)) { Text(title, fontWeight = FontWeight.SemiBold); Text(subtitle, color = MaterialTheme.colorScheme.secondary, fontSize = 12.sp) }
        }
    }
}

@Composable
private fun NextAppIcon(packageName: String) {
    val context = LocalContext.current
    val image = remember(packageName) { runCatching { context.packageManager.getApplicationIcon(packageName).toBitmap(88, 88).asImageBitmap() }.getOrNull() }
    if (image != null) Image(image, null, Modifier.size(40.dp).clip(RoundedCornerShape(10.dp)), contentScale = ContentScale.Fit)
    else Box(Modifier.size(40.dp).background(MaterialTheme.colorScheme.primary.copy(.1f), RoundedCornerShape(10.dp)))
}

private fun nextUsage(app: AppCandidate): String = when {
    app.daysSinceLastUse == 0 -> "Usada hoy"
    app.daysSinceLastUse == 1 -> "Usada ayer"
    app.daysSinceLastUse != null -> "Hace ${app.daysSinceLastUse} días"
    app.installAgeDays != null -> "Sin uso registrado · instalada hace ${app.installAgeDays} d"
    else -> "Sin historial"
}

private fun nextBytes(bytes: Long): String {
    if (bytes < 1024) return "$bytes B"
    val kb = bytes / 1024.0
    if (kb < 1024) return String.format("%.0f KB", kb)
    val mb = kb / 1024.0
    if (mb < 1024) return String.format("%.1f MB", mb)
    return String.format("%.2f GB", mb / 1024.0)
}
