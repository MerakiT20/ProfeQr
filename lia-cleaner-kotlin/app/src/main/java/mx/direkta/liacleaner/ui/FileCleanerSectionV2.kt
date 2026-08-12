package mx.direkta.liacleaner.ui

import android.os.Build
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.DeleteOutline
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Folder
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
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
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
import mx.direkta.liacleaner.file.FileSortMode
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun FileCleanerSectionV2() {
    val context = LocalContext.current
    val app = context.applicationContext
    val lifecycleOwner = LocalLifecycleOwner.current
    val analyzer = remember { FileCleanerAnalyzer(app) }
    val session by FileScanSession.state.collectAsStateWithLifecycle()
    var hasAccess by remember { mutableStateOf(analyzer.hasBroadFileAccess()) }
    var mode by remember { mutableStateOf(FileMode.LARGE) }
    var minSize by remember { mutableStateOf(100L * MB) }
    var minAge by remember { mutableIntStateOf(0) }
    var kind by remember { mutableStateOf<CleanerFileKind?>(null) }
    var sort by remember { mutableStateOf(FileSortMode.SIZE) }
    var limit by remember { mutableIntStateOf(30) }
    var selected by remember { mutableStateOf(setOf<String>()) }
    var pendingDelete by remember { mutableStateOf<List<CleanerFileItem>?>(null) }
    var pendingTitle by remember { mutableStateOf("") }

    LaunchedEffect(Unit) { FileScanSession.attach(app) }

    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event -> if (event == Lifecycle.Event.ON_RESUME) hasAccess = analyzer.hasBroadFileAccess() }
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
            text = { Text("Se eliminarán ${files.size} archivo(s) y se liberarán ${fmtBytes(files.sumOf { it.sizeBytes })}. El análisis actual se conservará.") },
            confirmButton = {
                TextButton(onClick = {
                    pendingDelete = null
                    selected = selected - files.map { it.file.absolutePath }.toSet()
                    FileScanSession.delete(app, analyzer, files)
                }) { Text("Eliminar") }
            },
            dismissButton = { TextButton(onClick = { pendingDelete = null }) { Text("Cancelar") } }
        )
    }

    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        if (!hasAccess && Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            ModernInfoCard("Acceso a archivos", "Necesario para revisar carpetas públicas y detectar duplicados exactos.") {
                Button(onClick = analyzer::openBroadFileAccessSettings, modifier = Modifier.fillMaxWidth()) { Text("Dar acceso") }
            }
            return@Column
        }

        ScanProgressCard(
            title = if (session.scanning) session.phaseLabel.ifBlank { "Preparando análisis" } else "Archivos y descargas",
            subtitle = if (session.scanning) "Trabajo persistente: puedes cambiar de pestaña o salir de LIA." else "Tamaño, antigüedad, tipo y duplicados exactos.",
            progress = session.progress, done = session.done, total = session.total,
            scanning = session.scanning, deleting = session.deleting,
            onScan = { if (session.result != null) FileScanSession.refresh(app) else FileScanSession.start(app) }
        )

        session.message?.let { Text(it, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant) }

        session.result?.let { result ->
            val groups = result.duplicateGroups
            val allDuplicateCopies = groups.flatMap { g -> g.files.filter { it.file.absolutePath != g.keep.file.absolutePath } }.distinctBy { it.file.absolutePath }

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                MiniStat("Archivos", result.files.size.toString(), Modifier.weight(1f))
                MiniStat("Duplicados", groups.size.toString(), Modifier.weight(1f))
                MiniStat("Liberable", fmtBytes(result.duplicateRecoverableBytes), Modifier.weight(1f))
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
            }

            LazyRow(horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                FileMode.entries.forEach { item { FilterChip(mode == it, { mode = it; limit = 30 }, label = { Text(it.label) }) } }
            }

            if (mode == FileMode.DUPLICATES) {
                groups.take(limit).forEach { group ->
                    DuplicateFileCard(group) {
                        askDelete("¿Conservar 1 y eliminar las copias?", group.files.filter { it.file.absolutePath != group.keep.file.absolutePath })
                    }
                }
                if (limit < groups.size) OutlinedButton({ limit += 30 }, Modifier.fillMaxWidth()) { Text("Mostrar 30 más") }
            } else {
                Text("Filtros", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                LazyRow(horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                    listOf(0L to "Todos", 10L * MB to ">10 MB", 100L * MB to ">100 MB", 500L * MB to ">500 MB", 1024L * MB to ">1 GB").forEach { (v, l) -> item { FilterChip(minSize == v, { minSize = v; limit = 30 }, label = { Text(l) }) } }
                }
                LazyRow(horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                    listOf(0 to "Cualquier fecha", 30 to ">30 d", 90 to ">90 d", 180 to ">180 d", 365 to ">1 año").forEach { (v, l) -> item { FilterChip(minAge == v, { minAge = v; limit = 30 }, label = { Text(l) }) } }
                }
                LazyRow(horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                    item { FilterChip(kind == null, { kind = null }, label = { Text("Todos") }) }
                    CleanerFileKind.entries.forEach { k -> item { FilterChip(kind == k, { kind = k }, label = { Text(kindLabel(k)) }) } }
                }
                LazyRow(horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                    FileSortMode.entries.forEach { s -> item { FilterChip(sort == s, { sort = s }, label = { Text(sortLabel(s)) }) } }
                }

                val filtered = filterFilesV2(result.files, mode, minSize, minAge, kind, sort)
                if (selected.isNotEmpty()) {
                    val selectedItems = result.files.filter { it.file.absolutePath in selected }
                    Button(
                        onClick = { askDelete("¿Eliminar ${selectedItems.size} archivos seleccionados?", selectedItems) },
                        modifier = Modifier.fillMaxWidth()
                    ) { Text("Eliminar seleccionados (${selectedItems.size}) · ${fmtBytes(selectedItems.sumOf { it.sizeBytes })}") }
                    TextButton(onClick = { selected = emptySet() }) { Text("Cancelar selección") }
                }

                filtered.take(limit).forEach { file ->
                    FileItemCard(
                        file = file,
                        selected = file.file.absolutePath in selected,
                        onToggle = {
                            val path = file.file.absolutePath
                            selected = if (path in selected) selected - path else selected + path
                        },
                        onDelete = { askDelete("¿Eliminar ${file.name}?", listOf(file)) }
                    )
                }
                if (limit < filtered.size) OutlinedButton({ limit += 30 }, Modifier.fillMaxWidth()) { Text("Mostrar 30 más") }
                if (filtered.isEmpty()) Text("No hay archivos que coincidan con estos filtros.", fontSize = 12.sp)
            }
        }
    }
}

@Composable
private fun ScanProgressCard(title: String, subtitle: String, progress: Float, done: Int, total: Int, scanning: Boolean, deleting: Boolean, onScan: () -> Unit) {
    Card(shape = RoundedCornerShape(20.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
        Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier.size(42.dp).background(MaterialTheme.colorScheme.primary.copy(alpha = .10f), CircleShape), contentAlignment = Alignment.Center) { Icon(Icons.Default.Folder, null, tint = MaterialTheme.colorScheme.primary) }
                Column(Modifier.weight(1f).padding(start = 12.dp)) { Text(title, fontWeight = FontWeight.Bold, fontSize = 17.sp); Text(subtitle, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant) }
                if (!scanning && !deleting) IconButton(onClick = onScan) { Icon(Icons.Default.Refresh, "Actualizar") }
            }
            if (scanning) {
                LinearProgressIndicator(progress = { progress }, modifier = Modifier.fillMaxWidth())
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) { Text(if (total > 0) "$done / $total" else "Preparando…", fontSize = 11.sp); Text("${(progress * 100).toInt()}%", fontWeight = FontWeight.SemiBold, fontSize = 11.sp) }
            } else Button(onClick = onScan, enabled = !deleting, modifier = Modifier.fillMaxWidth()) { Text(if (deleting) "Eliminando…" else "Analizar archivos") }
        }
    }
}

@Composable private fun ModernInfoCard(title: String, subtitle: String, content: @Composable () -> Unit) { Card(shape = RoundedCornerShape(20.dp)) { Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) { Text(title, fontWeight = FontWeight.Bold); Text(subtitle, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant); content() } } }
@Composable private fun MiniStat(title: String, value: String, modifier: Modifier) { Box(modifier.background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = .35f), RoundedCornerShape(14.dp)).padding(10.dp)) { Column { Text(value, fontWeight = FontWeight.Bold, fontSize = 15.sp, maxLines = 1); Text(title, fontSize = 9.sp, color = MaterialTheme.colorScheme.onSurfaceVariant) } } }
@Composable private fun DuplicateFileCard(group: DuplicateFileGroup, onDelete: () -> Unit) { Card(shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = .25f))) { Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(5.dp)) { Text("${group.files.size} copias · ${fmtBytes(group.recoverableBytes)} recuperables", fontWeight = FontWeight.SemiBold); Text("Conservar: ${group.keep.name}", fontSize = 10.sp, color = MaterialTheme.colorScheme.secondary); group.files.take(3).forEach { Text("• ${it.name}", fontSize = 10.sp, maxLines = 1) }; OutlinedButton(onDelete, Modifier.fillMaxWidth()) { Text("Conservar 1 y eliminar copias") } } } }
@Composable private fun FileItemCard(file: CleanerFileItem, selected: Boolean, onToggle: () -> Unit, onDelete: () -> Unit) { Card(shape = RoundedCornerShape(15.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) { Row(Modifier.fillMaxWidth().padding(10.dp), verticalAlignment = Alignment.CenterVertically) { Icon(Icons.Default.Description, null, tint = MaterialTheme.colorScheme.primary); Column(Modifier.weight(1f).padding(horizontal = 10.dp)) { Text(file.name, fontWeight = FontWeight.SemiBold, fontSize = 13.sp, maxLines = 1); Text("${fmtBytes(file.sizeBytes)} · ${fmtDate(file.bestDateMs)}", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant) }; IconButton(onClick = onToggle) { Icon(if (selected) Icons.Default.CheckCircle else Icons.Default.RadioButtonUnchecked, if (selected) "Seleccionado" else "Seleccionar", tint = if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant) }; IconButton(onClick = onDelete) { Icon(Icons.Default.DeleteOutline, "Eliminar") } } } }

private enum class FileMode(val label: String) { LARGE("Grandes"), DOWNLOADS("Descargas"), ALL("Todos"), DUPLICATES("Duplicados") }
private fun filterFilesV2(source: List<CleanerFileItem>, mode: FileMode, minSize: Long, minAge: Int, kind: CleanerFileKind?, sort: FileSortMode): List<CleanerFileItem> { val now = System.currentTimeMillis(); val age = minAge * 86400000L; val f = source.filter { when (mode) { FileMode.DOWNLOADS -> it.isDownload; FileMode.LARGE -> it.sizeBytes >= 100L * MB; FileMode.ALL -> true; FileMode.DUPLICATES -> false } }.filter { it.sizeBytes >= minSize }.filter { minAge == 0 || (it.bestDateMs > 0 && now - it.bestDateMs >= age) }.filter { kind == null || it.kind == kind }; return when (sort) { FileSortMode.SIZE -> f.sortedByDescending { it.sizeBytes }; FileSortMode.DATE -> f.sortedBy { it.bestDateMs.takeIf { x -> x > 0 } ?: Long.MAX_VALUE }; FileSortMode.NAME -> f.sortedBy { it.name.lowercase() } } }
private fun kindLabel(k: CleanerFileKind) = when (k) { CleanerFileKind.IMAGE -> "Imágenes"; CleanerFileKind.VIDEO -> "Videos"; CleanerFileKind.AUDIO -> "Audio"; CleanerFileKind.DOCUMENT -> "Documentos"; CleanerFileKind.ARCHIVE -> "Comprimidos"; CleanerFileKind.APK -> "APK"; CleanerFileKind.OTHER -> "Otros" }
private fun sortLabel(s: FileSortMode) = when (s) { FileSortMode.SIZE -> "Tamaño"; FileSortMode.DATE -> "Fecha"; FileSortMode.NAME -> "Nombre" }
private fun fmtBytes(bytes: Long): String { if (bytes < 1024) return "$bytes B"; val kb = bytes / 1024.0; if (kb < 1024) return String.format(Locale.getDefault(), "%.0f KB", kb); val mb = kb / 1024.0; if (mb < 1024) return String.format(Locale.getDefault(), "%.1f MB", mb); return String.format(Locale.getDefault(), "%.2f GB", mb / 1024.0) }
private fun fmtDate(ms: Long) = if (ms <= 0) "fecha desconocida" else SimpleDateFormat("dd MMM yyyy", Locale.getDefault()).format(Date(ms))
private const val MB = 1024L * 1024L
