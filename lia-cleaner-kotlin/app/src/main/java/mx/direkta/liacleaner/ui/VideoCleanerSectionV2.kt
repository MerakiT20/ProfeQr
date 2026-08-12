package mx.direkta.liacleaner.ui

import android.graphics.Bitmap
import android.os.Build
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.DeleteOutline
import androidx.compose.material.icons.filled.Movie
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.RadioButtonUnchecked
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
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
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import mx.direkta.liacleaner.file.CleanerFileItem
import mx.direkta.liacleaner.file.CleanerFileKind
import mx.direkta.liacleaner.file.DuplicateFileGroup
import mx.direkta.liacleaner.file.FileCleanerAnalyzer
import mx.direkta.liacleaner.file.FileScanSession
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun VideoCleanerSectionV2() {
    val context = LocalContext.current
    val app = context.applicationContext
    val lifecycleOwner = LocalLifecycleOwner.current
    val analyzer = remember { FileCleanerAnalyzer(app) }
    val session by FileScanSession.state.collectAsStateWithLifecycle()
    var hasAccess by remember { mutableStateOf(analyzer.hasBroadFileAccess()) }
    var minSize by remember { mutableStateOf(50L * MB) }
    var minAge by remember { mutableIntStateOf(0) }
    var limit by remember { mutableIntStateOf(30) }
    var selected by remember { mutableStateOf(setOf<String>()) }
    var pendingDelete by remember { mutableStateOf<List<CleanerFileItem>?>(null) }
    var pendingTitle by remember { mutableStateOf("") }

    LaunchedEffect(Unit) { FileScanSession.attach(app) }

    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) hasAccess = analyzer.hasBroadFileAccess()
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    fun askDelete(title: String, items: List<CleanerFileItem>) {
        if (items.isEmpty()) return
        pendingTitle = title
        pendingDelete = items.distinctBy { it.file.absolutePath }
    }

    pendingDelete?.let { files ->
        AlertDialog(
            onDismissRequest = { pendingDelete = null },
            title = { Text(pendingTitle) },
            text = { Text("Se eliminarán ${files.size} video(s) y se liberarán ${vBytes(files.sumOf { it.sizeBytes })}. El análisis actual se conservará; no será necesario repetirlo.") },
            confirmButton = {
                TextButton(onClick = {
                    pendingDelete = null
                    selected = selected - files.map { it.file.absolutePath }.toSet()
                    FileScanSession.delete(app, analyzer, files, "video")
                }) { Text("Eliminar") }
            },
            dismissButton = { TextButton(onClick = { pendingDelete = null }) { Text("Cancelar") } }
        )
    }

    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        if (!hasAccess && Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            Card(shape = RoundedCornerShape(18.dp)) {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Acceso a videos", fontWeight = FontWeight.Bold)
                    Text("Necesario para analizar videos grandes, antiguos y duplicados.", fontSize = 12.sp)
                    Button(analyzer::openBroadFileAccessSettings, Modifier.fillMaxWidth()) { Text("Dar acceso") }
                }
            }
            return@Column
        }

        Card(shape = RoundedCornerShape(18.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
            Column(Modifier.fillMaxWidth().padding(15.dp), verticalArrangement = Arrangement.spacedBy(9.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(Modifier.size(42.dp).background(MaterialTheme.colorScheme.tertiary.copy(alpha = .12f), CircleShape), contentAlignment = Alignment.Center) {
                        Icon(Icons.Default.Movie, null, tint = MaterialTheme.colorScheme.tertiary)
                    }
                    Column(Modifier.weight(1f).padding(start = 12.dp)) {
                        Text(if (session.scanning) "${session.phaseLabel.ifBlank { "Analizando almacenamiento" }}…" else "Videos", fontWeight = FontWeight.Bold, fontSize = 17.sp)
                        Text(if (session.scanning) "Puedes cambiar de pestaña; el análisis continúa." else "Grandes, antiguos y duplicados exactos.", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    if (!session.scanning) IconButton(onClick = { FileScanSession.refresh(app) }) { Icon(Icons.Default.Refresh, "Actualizar") }
                }
                if (session.scanning) {
                    LinearProgressIndicator(progress = { session.progress }, modifier = Modifier.fillMaxWidth())
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(if (session.total > 0) "${session.done} / ${session.total}" else "Preparando…", fontSize = 11.sp)
                        Text("${(session.progress * 100).toInt()}%", fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                    }
                } else Button(onClick = { FileScanSession.start(app, force = session.result != null) }, modifier = Modifier.fillMaxWidth()) { Text("Analizar almacenamiento") }
            }
        }

        session.message?.let { Text(it, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant) }

        session.result?.let { result ->
            val videos = result.files.filter { it.kind == CleanerFileKind.VIDEO }
            val groups = result.duplicateGroups.filter { g -> g.files.all { it.kind == CleanerFileKind.VIDEO } }
            val allDuplicateCopies = groups.flatMap { g -> g.files.filter { it.file.absolutePath != g.keep.file.absolutePath } }.distinctBy { it.file.absolutePath }

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                VStat("Videos", videos.size.toString(), Modifier.weight(1f))
                VStat("Duplicados", groups.size.toString(), Modifier.weight(1f))
                VStat("Liberable", vBytes(groups.sumOf { it.recoverableBytes }), Modifier.weight(1f))
            }

            if (groups.isNotEmpty()) {
                Button(
                    onClick = { askDelete("¿Eliminar todos los duplicados exactos?", allDuplicateCopies) },
                    enabled = !session.deleting,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.DeleteOutline, null)
                    Spacer(Modifier.size(6.dp))
                    Text("Conservar 1 de cada grupo · eliminar ${allDuplicateCopies.size}")
                }
                Text("Duplicados exactos", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                groups.take(12).forEach { group ->
                    VideoDuplicateCard(group, analyzer) {
                        askDelete("¿Conservar 1 y eliminar las copias?", group.files.filter { it.file.absolutePath != group.keep.file.absolutePath })
                    }
                }
            }

            Text("Filtros", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
            LazyRow(horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                listOf(0L to "Todos", 50L * MB to ">50 MB", 200L * MB to ">200 MB", 500L * MB to ">500 MB", 1024L * MB to ">1 GB").forEach { (v, l) ->
                    item { FilterChip(minSize == v, { minSize = v; limit = 30 }, label = { Text(l) }) }
                }
            }
            LazyRow(horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                listOf(0 to "Cualquiera", 30 to ">30 d", 90 to ">90 d", 180 to ">180 d", 365 to ">1 año").forEach { (v, l) ->
                    item { FilterChip(minAge == v, { minAge = v; limit = 30 }, label = { Text(l) }) }
                }
            }

            val now = System.currentTimeMillis()
            val age = minAge * 86400000L
            val filtered = videos.filter { it.sizeBytes >= minSize }
                .filter { minAge == 0 || (it.bestDateMs > 0 && now - it.bestDateMs >= age) }
                .sortedByDescending { it.sizeBytes }

            if (selected.isNotEmpty()) {
                val selectedItems = videos.filter { it.file.absolutePath in selected }
                Button(
                    onClick = { askDelete("¿Eliminar ${selectedItems.size} videos seleccionados?", selectedItems) },
                    modifier = Modifier.fillMaxWidth()
                ) { Text("Eliminar seleccionados (${selectedItems.size}) · ${vBytes(selectedItems.sumOf { it.sizeBytes })}") }
                TextButton(onClick = { selected = emptySet() }) { Text("Cancelar selección") }
            }

            filtered.take(limit).forEach { item ->
                VideoItemCard(
                    item = item,
                    analyzer = analyzer,
                    selected = item.file.absolutePath in selected,
                    onToggle = {
                        val path = item.file.absolutePath
                        selected = if (path in selected) selected - path else selected + path
                    },
                    onDelete = { askDelete("¿Eliminar ${item.name}?", listOf(item)) }
                )
            }
            if (limit < filtered.size) OutlinedButton(onClick = { limit += 30 }, modifier = Modifier.fillMaxWidth()) { Text("Mostrar 30 más") }
        }
    }
}

@Composable
private fun VideoDuplicateCard(group: DuplicateFileGroup, analyzer: FileCleanerAnalyzer, onDeleteCopies: () -> Unit) {
    Card(shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = .25f))) {
        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(7.dp)) {
            Text("${group.files.size} copias · ${vBytes(group.recoverableBytes)} recuperables", fontWeight = FontWeight.SemiBold)
            Text("Conservar: ${group.keep.name}", fontSize = 10.sp, color = MaterialTheme.colorScheme.secondary, maxLines = 2)
            LazyRow(horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                items(group.files, key = { it.file.absolutePath }) { item ->
                    VideoThumbnail(item, analyzer, keep = item.file.absolutePath == group.keep.file.absolutePath)
                }
            }
            OutlinedButton(onClick = onDeleteCopies, modifier = Modifier.fillMaxWidth()) { Text("Conservar 1 y eliminar copias") }
        }
    }
}

@Composable
private fun VideoThumbnail(item: CleanerFileItem, analyzer: FileCleanerAnalyzer, keep: Boolean = false) {
    val bitmap by produceState<Bitmap?>(null, item.file.absolutePath) {
        value = analyzer.loadVideoThumbnail(item, 180, 120)
    }
    Box(
        Modifier.size(110.dp, 76.dp).clip(RoundedCornerShape(10.dp)).background(Color.Black.copy(alpha = .08f))
            .clickable { analyzer.openVideo(item) },
        contentAlignment = Alignment.Center
    ) {
        if (bitmap != null) Image(bitmap!!.asImageBitmap(), item.name, Modifier.matchParentSize(), contentScale = ContentScale.Crop)
        Icon(Icons.Default.PlayArrow, "Reproducir", tint = Color.White, modifier = Modifier.size(30.dp).background(Color.Black.copy(alpha = .38f), CircleShape).padding(4.dp))
        if (keep) Text("CONSERVAR", fontSize = 7.sp, color = Color.White, modifier = Modifier.align(Alignment.TopStart).background(MaterialTheme.colorScheme.secondary).padding(3.dp))
    }
}

@Composable
private fun VideoItemCard(item: CleanerFileItem, analyzer: FileCleanerAnalyzer, selected: Boolean, onToggle: () -> Unit, onDelete: () -> Unit) {
    Card(shape = RoundedCornerShape(15.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
        Row(Modifier.fillMaxWidth().padding(9.dp), verticalAlignment = Alignment.CenterVertically) {
            VideoThumbnail(item, analyzer)
            Column(Modifier.weight(1f).padding(horizontal = 10.dp)) {
                Text(item.name, fontWeight = FontWeight.SemiBold, fontSize = 13.sp, maxLines = 2)
                Text("${vBytes(item.sizeBytes)} · ${vDate(item.bestDateMs)}", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text("Toca la miniatura para reproducir", fontSize = 9.sp, color = MaterialTheme.colorScheme.primary)
            }
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                IconButton(onClick = onToggle) {
                    Icon(if (selected) Icons.Default.CheckCircle else Icons.Default.RadioButtonUnchecked, if (selected) "Seleccionado" else "Seleccionar", tint = if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant)
                }
                IconButton(onClick = onDelete) { Icon(Icons.Default.DeleteOutline, "Eliminar") }
            }
        }
    }
}

@Composable private fun VStat(t: String, v: String, m: Modifier) { Box(m.background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = .35f), RoundedCornerShape(14.dp)).padding(10.dp)) { Column { Text(v, fontWeight = FontWeight.Bold, fontSize = 15.sp, maxLines = 1); Text(t, fontSize = 9.sp, color = MaterialTheme.colorScheme.onSurfaceVariant) } } }
private fun vBytes(b: Long): String { if (b < 1024) return "$b B"; val k = b / 1024.0; if (k < 1024) return String.format(Locale.getDefault(), "%.0f KB", k); val m = k / 1024.0; if (m < 1024) return String.format(Locale.getDefault(), "%.1f MB", m); return String.format(Locale.getDefault(), "%.2f GB", m / 1024.0) }
private fun vDate(ms: Long) = if (ms <= 0) "fecha desconocida" else SimpleDateFormat("dd MMM yyyy", Locale.getDefault()).format(Date(ms))
private const val MB = 1024L * 1024L
