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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DeleteOutline
import androidx.compose.material.icons.filled.Movie
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import mx.direkta.liacleaner.file.CleanerFileItem
import mx.direkta.liacleaner.file.CleanerFileKind
import mx.direkta.liacleaner.file.DuplicateFileGroup
import mx.direkta.liacleaner.file.FileCleanerAnalyzer
import mx.direkta.liacleaner.file.FileScanResult
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun VideoCleanerSection() {
    val context = androidx.compose.ui.platform.LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val analyzer = remember { FileCleanerAnalyzer(context.applicationContext) }
    val scope = rememberCoroutineScope()
    var hasAccess by remember { mutableStateOf(analyzer.hasBroadFileAccess()) }
    var scan by remember { mutableStateOf<FileScanResult?>(null) }
    var scanning by remember { mutableStateOf(false) }
    var done by remember { mutableIntStateOf(0) }
    var total by remember { mutableIntStateOf(0) }
    var minSize by remember { mutableStateOf(50L * MB) }
    var minAgeDays by remember { mutableIntStateOf(0) }
    var visibleLimit by remember { mutableIntStateOf(30) }
    var deleteItem by remember { mutableStateOf<CleanerFileItem?>(null) }
    var deleteGroup by remember { mutableStateOf<DuplicateFileGroup?>(null) }
    var message by remember { mutableStateOf<String?>(null) }

    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) hasAccess = analyzer.hasBroadFileAccess()
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    fun runScan() {
        if (!analyzer.hasBroadFileAccess()) {
            analyzer.openBroadFileAccessSettings()
            return
        }
        scope.launch {
            scanning = true
            message = null
            done = 0
            total = 0
            runCatching {
                analyzer.scan { d, t ->
                    if (d == t || d % 50 == 0) withContext(Dispatchers.Main) { done = d; total = t }
                }
            }.onSuccess {
                scan = it
                message = "Videos analizados."
            }.onFailure { message = it.message ?: "No fue posible analizar los videos." }
            scanning = false
        }
    }

    fun delete(items: List<CleanerFileItem>) {
        scope.launch {
            val result = withContext(Dispatchers.IO) { analyzer.deleteFiles(items) }
            message = "${result.deletedCount} archivo(s) eliminados · ${videoBytes(result.deletedBytes)} liberados."
            scan = runCatching { analyzer.scan() }.getOrNull()
        }
    }

    deleteItem?.let { item ->
        AlertDialog(
            onDismissRequest = { deleteItem = null },
            title = { Text("¿Eliminar ${item.name}?") },
            text = { Text("Se liberarán ${videoBytes(item.sizeBytes)}. Esta acción requiere tu confirmación.") },
            confirmButton = { TextButton(onClick = { deleteItem = null; delete(listOf(item)) }) { Text("Eliminar") } },
            dismissButton = { TextButton(onClick = { deleteItem = null }) { Text("Cancelar") } }
        )
    }

    deleteGroup?.let { group ->
        val copies = group.files.filter { it.file.absolutePath != group.keep.file.absolutePath }
        AlertDialog(
            onDismissRequest = { deleteGroup = null },
            title = { Text("¿Conservar un video y eliminar ${copies.size} copias?") },
            text = { Text("Solo se eliminarán archivos con SHA-256 idéntico. Se conservará ${group.keep.name}.") },
            confirmButton = { TextButton(onClick = { deleteGroup = null; delete(copies) }) { Text("Eliminar copias") } },
            dismissButton = { TextButton(onClick = { deleteGroup = null }) { Text("Cancelar") } }
        )
    }

    Card(
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = androidx.compose.ui.graphics.Color.White)
    ) {
        Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Movie, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                Column(Modifier.weight(1f).padding(start = 12.dp)) {
                    Text("Videos", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                    Text("Videos grandes, antiguos y duplicados exactos.", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }

            if (!hasAccess && Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                Button(onClick = analyzer::openBroadFileAccessSettings, modifier = Modifier.fillMaxWidth()) { Text("Dar acceso a archivos") }
            } else {
                Button(onClick = ::runScan, enabled = !scanning, modifier = Modifier.fillMaxWidth()) {
                    if (scanning) {
                        CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                        Spacer(Modifier.size(8.dp))
                        Text(if (total > 0) "$done / $total" else "Analizando videos…")
                    } else Text(if (scan == null) "Analizar videos" else "Analizar de nuevo")
                }
            }

            message?.let { Text(it, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant) }

            scan?.let { result ->
                val videos = result.files.filter { it.kind == CleanerFileKind.VIDEO }
                val videoGroups = result.duplicateGroups.filter { group -> group.files.all { it.kind == CleanerFileKind.VIDEO } }
                val recoverable = videoGroups.sumOf { it.recoverableBytes }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    VideoStat("Videos", videos.size.toString(), Modifier.weight(1f))
                    VideoStat("Duplicados", videoGroups.size.toString(), Modifier.weight(1f))
                    VideoStat("Recuperable", videoBytes(recoverable), Modifier.weight(1f))
                }

                if (videoGroups.isNotEmpty()) {
                    Text("Duplicados exactos", fontWeight = FontWeight.SemiBold)
                    videoGroups.take(10).forEach { group ->
                        Card(
                            shape = RoundedCornerShape(14.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.28f))
                        ) {
                            Column(Modifier.fillMaxWidth().padding(10.dp)) {
                                Text("${group.files.size} copias · ${videoBytes(group.recoverableBytes)} recuperables", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                                Text("Conservar: ${group.keep.name}", fontSize = 10.sp, color = MaterialTheme.colorScheme.secondary)
                                OutlinedButton(onClick = { deleteGroup = group }, modifier = Modifier.fillMaxWidth()) { Text("Conservar 1 y eliminar copias") }
                            }
                        }
                    }
                }

                Text("Tamaño mínimo", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                LazyRow(horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                    listOf(0L to "Todos", 50L * MB to ">50 MB", 200L * MB to ">200 MB", 500L * MB to ">500 MB", 1024L * MB to ">1 GB").forEach { (bytes, label) ->
                        item { FilterChip(selected = minSize == bytes, onClick = { minSize = bytes; visibleLimit = 30 }, label = { Text(label) }) }
                    }
                }
                Text("Antigüedad", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                LazyRow(horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                    listOf(0 to "Cualquiera", 30 to ">30 d", 90 to ">90 d", 180 to ">180 d", 365 to ">1 año").forEach { (days, label) ->
                        item { FilterChip(selected = minAgeDays == days, onClick = { minAgeDays = days; visibleLimit = 30 }, label = { Text(label) }) }
                    }
                }

                val now = System.currentTimeMillis()
                val minAgeMs = minAgeDays * 24L * 60L * 60L * 1000L
                val filtered = videos
                    .filter { it.sizeBytes >= minSize }
                    .filter { minAgeDays == 0 || (it.bestDateMs > 0 && now - it.bestDateMs >= minAgeMs) }
                    .sortedByDescending { it.sizeBytes }

                filtered.take(visibleLimit).forEach { item ->
                    Card(shape = RoundedCornerShape(14.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.22f))) {
                        Row(Modifier.fillMaxWidth().padding(10.dp), verticalAlignment = Alignment.CenterVertically) {
                            Column(Modifier.weight(1f)) {
                                Text(item.name, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, maxLines = 1)
                                Text("${videoBytes(item.sizeBytes)} · ${videoDate(item.bestDateMs)}", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            IconButton(onClick = { deleteItem = item }) { Icon(Icons.Default.DeleteOutline, contentDescription = "Eliminar ${item.name}") }
                        }
                    }
                }
                if (visibleLimit < filtered.size) {
                    OutlinedButton(onClick = { visibleLimit += 30 }, modifier = Modifier.fillMaxWidth()) { Text("Mostrar 30 más") }
                }
            }
        }
    }
}

@Composable
private fun VideoStat(title: String, value: String, modifier: Modifier) {
    Box(modifier.background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f), RoundedCornerShape(13.dp)).padding(9.dp)) {
        Column { Text(value, fontSize = 14.sp, fontWeight = FontWeight.Bold, maxLines = 1); Text(title, fontSize = 9.sp, color = MaterialTheme.colorScheme.onSurfaceVariant) }
    }
}

private fun videoBytes(bytes: Long): String {
    if (bytes < 1024) return "$bytes B"
    val kb = bytes / 1024.0
    if (kb < 1024) return String.format(Locale.getDefault(), "%.0f KB", kb)
    val mb = kb / 1024.0
    if (mb < 1024) return String.format(Locale.getDefault(), "%.1f MB", mb)
    return String.format(Locale.getDefault(), "%.2f GB", mb / 1024.0)
}

private fun videoDate(ms: Long): String = if (ms <= 0) "fecha desconocida" else SimpleDateFormat("dd MMM yyyy", Locale.getDefault()).format(Date(ms))
private const val MB = 1024L * 1024L
