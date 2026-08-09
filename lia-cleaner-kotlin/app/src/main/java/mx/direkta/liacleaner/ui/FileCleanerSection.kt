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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Archive
import androidx.compose.material.icons.filled.AudioFile
import androidx.compose.material.icons.filled.DeleteOutline
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Folder
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.InstallMobile
import androidx.compose.material.icons.filled.Movie
import androidx.compose.material.icons.filled.WarningAmber
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
import mx.direkta.liacleaner.file.FileSortMode
import mx.direkta.liacleaner.file.FileViewMode
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun FileCleanerSection() {
    val context = androidx.compose.ui.platform.LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val analyzer = remember { FileCleanerAnalyzer(context.applicationContext) }
    val scope = rememberCoroutineScope()

    var hasAccess by remember { mutableStateOf(analyzer.hasBroadFileAccess()) }
    var result by remember { mutableStateOf<FileScanResult?>(null) }
    var scanning by remember { mutableStateOf(false) }
    var progressDone by remember { mutableIntStateOf(0) }
    var progressTotal by remember { mutableIntStateOf(0) }
    var message by remember { mutableStateOf<String?>(null) }

    var viewMode by remember { mutableStateOf(FileViewMode.LARGE) }
    var sortMode by remember { mutableStateOf(FileSortMode.SIZE) }
    var minSize by remember { mutableStateOf(100L * MB) }
    var minAgeDays by remember { mutableIntStateOf(0) }
    var kind by remember { mutableStateOf<CleanerFileKind?>(null) }
    var visibleLimit by remember { mutableIntStateOf(30) }
    var deleteFile by remember { mutableStateOf<CleanerFileItem?>(null) }
    var deleteDuplicateGroup by remember { mutableStateOf<DuplicateFileGroup?>(null) }

    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) {
                hasAccess = analyzer.hasBroadFileAccess()
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    fun scan() {
        if (!analyzer.hasBroadFileAccess()) {
            hasAccess = false
            analyzer.openBroadFileAccessSettings()
            return
        }
        scope.launch {
            scanning = true
            message = null
            progressDone = 0
            progressTotal = 0
            runCatching {
                analyzer.scan { done, total ->
                    withContext(Dispatchers.Main) {
                        progressDone = done
                        progressTotal = total
                    }
                }
            }.onSuccess {
                result = it
                message = "Análisis terminado: ${it.files.size} archivos revisados."
                visibleLimit = 30
            }.onFailure {
                message = it.message ?: "No fue posible analizar los archivos."
            }
            scanning = false
        }
    }

    fun delete(items: List<CleanerFileItem>) {
        scope.launch {
            val deletion = withContext(Dispatchers.IO) { analyzer.deleteFiles(items) }
            message = if (deletion.failedNames.isEmpty()) {
                "Eliminados ${deletion.deletedCount} archivos · ${fileBytes(deletion.deletedBytes)} liberados."
            } else {
                "Se eliminaron ${deletion.deletedCount}; ${deletion.failedNames.size} no pudieron borrarse."
            }
            result = runCatching { analyzer.scan() }.getOrNull()
        }
    }

    deleteFile?.let { item ->
        AlertDialog(
            onDismissRequest = { deleteFile = null },
            title = { Text("¿Eliminar ${item.name}?") },
            text = { Text("Se borrará ${fileBytes(item.sizeBytes)}. Esta acción no se puede deshacer desde LIA Cleaner.") },
            confirmButton = {
                TextButton(onClick = {
                    deleteFile = null
                    delete(listOf(item))
                }) { Text("Eliminar") }
            },
            dismissButton = { TextButton(onClick = { deleteFile = null }) { Text("Cancelar") } }
        )
    }

    deleteDuplicateGroup?.let { group ->
        val copies = group.files.filter { it.file.absolutePath != group.keep.file.absolutePath }
        AlertDialog(
            onDismissRequest = { deleteDuplicateGroup = null },
            title = { Text("¿Eliminar ${copies.size} copias duplicadas?") },
            text = {
                Text("LIA conservará ${group.keep.name} y eliminará solo archivos con el mismo SHA-256. Se liberarían ${fileBytes(copies.sumOf { it.sizeBytes })}.")
            },
            confirmButton = {
                TextButton(onClick = {
                    deleteDuplicateGroup = null
                    delete(copies)
                }) { Text("Eliminar copias") }
            },
            dismissButton = { TextButton(onClick = { deleteDuplicateGroup = null }) { Text("Cancelar") } }
        )
    }

    Card(
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = androidx.compose.ui.graphics.Color.White)
    ) {
        Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Folder, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                Column(Modifier.weight(1f).padding(horizontal = 12.dp)) {
                    Text("Archivos y descargas", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                    Text(
                        "Filtra por tamaño, antigüedad, tipo y duplicados exactos.",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            if (!hasAccess && Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            MaterialTheme.colorScheme.primary.copy(alpha = 0.07f),
                            RoundedCornerShape(16.dp)
                        )
                        .padding(12.dp)
                ) {
                    Text("Acceso especial a archivos", fontWeight = FontWeight.SemiBold)
                    Text(
                        "Necesario para revisar archivos públicos y detectar duplicados. LIA excluye Android/data y carpetas privadas.",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(Modifier.size(8.dp))
                    Button(onClick = analyzer::openBroadFileAccessSettings, modifier = Modifier.fillMaxWidth()) {
                        Text("Dar acceso a archivos")
                    }
                }
            } else {
                Button(
                    onClick = ::scan,
                    enabled = !scanning,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    if (scanning) {
                        CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                        Spacer(Modifier.size(8.dp))
                        Text(
                            if (progressTotal > 0) "Analizando $progressDone / $progressTotal"
                            else "Buscando archivos…"
                        )
                    } else {
                        Text(if (result == null) "Analizar archivos" else "Analizar de nuevo")
                    }
                }
            }

            Text(
                "Nota: Android no ofrece un contador fiable de cuántas veces se usa un archivo. Para antigüedad, LIA usa fecha de descarga cuando está disponible y, si no, fecha de modificación.",
                fontSize = 11.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            message?.let {
                Text(it, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }

            result?.let { scan ->
                FileStats(scan)

                LazyRow(horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                    item { ModeChip("Grandes", viewMode == FileViewMode.LARGE) { viewMode = FileViewMode.LARGE; visibleLimit = 30 } }
                    item { ModeChip("Descargas", viewMode == FileViewMode.DOWNLOADS) { viewMode = FileViewMode.DOWNLOADS; visibleLimit = 30 } }
                    item { ModeChip("Todos", viewMode == FileViewMode.ALL) { viewMode = FileViewMode.ALL; visibleLimit = 30 } }
                    item { ModeChip("Duplicados", viewMode == FileViewMode.DUPLICATES) { viewMode = FileViewMode.DUPLICATES; visibleLimit = 30 } }
                }

                if (viewMode == FileViewMode.DUPLICATES) {
                    DuplicateGroups(
                        groups = scan.duplicateGroups.take(visibleLimit),
                        total = scan.duplicateGroups.size,
                        onDeleteCopies = { deleteDuplicateGroup = it },
                        onShowMore = { visibleLimit += 30 }
                    )
                } else {
                    Text("Tamaño mínimo", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                        sizePresets.forEach { preset ->
                            item {
                                ModeChip(preset.label, minSize == preset.bytes) {
                                    minSize = preset.bytes
                                    visibleLimit = 30
                                }
                            }
                        }
                    }

                    Text("Antigüedad", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                        agePresets.forEach { preset ->
                            item {
                                ModeChip(preset.label, minAgeDays == preset.days) {
                                    minAgeDays = preset.days
                                    visibleLimit = 30
                                }
                            }
                        }
                    }

                    Text("Tipo", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                        item { ModeChip("Todos", kind == null) { kind = null; visibleLimit = 30 } }
                        CleanerFileKind.entries.forEach { type ->
                            item { ModeChip(fileKindLabel(type), kind == type) { kind = type; visibleLimit = 30 } }
                        }
                    }

                    Text("Ordenar", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                        item { ModeChip("Tamaño", sortMode == FileSortMode.SIZE) { sortMode = FileSortMode.SIZE } }
                        item { ModeChip("Fecha", sortMode == FileSortMode.DATE) { sortMode = FileSortMode.DATE } }
                        item { ModeChip("Nombre", sortMode == FileSortMode.NAME) { sortMode = FileSortMode.NAME } }
                    }

                    val filtered = filterFiles(scan.files, viewMode, minSize, minAgeDays, kind, sortMode)
                    Text(
                        "Mostrando ${minOf(visibleLimit, filtered.size)} de ${filtered.size}",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Column(verticalArrangement = Arrangement.spacedBy(7.dp)) {
                        filtered.take(visibleLimit).forEach { item ->
                            FileRow(item, onDelete = { deleteFile = item })
                        }
                    }
                    if (visibleLimit < filtered.size) {
                        OutlinedButton(onClick = { visibleLimit += 30 }, modifier = Modifier.fillMaxWidth()) {
                            Text("Mostrar 30 más")
                        }
                    }
                    if (filtered.isEmpty()) {
                        Text(
                            "No hay archivos que coincidan con estos filtros.",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun FileStats(scan: FileScanResult) {
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        FileStat("Archivos", scan.files.size.toString(), Modifier.weight(1f))
        FileStat("Descargas", scan.downloadFiles.size.toString(), Modifier.weight(1f))
        FileStat("Duplicados", scan.duplicateGroups.size.toString(), Modifier.weight(1f))
    }
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondary.copy(alpha = 0.07f))
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text("Duplicados recuperables", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text(fileBytes(scan.duplicateRecoverableBytes), fontSize = 22.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.secondary)
            }
            Text(fileBytes(scan.totalBytes), fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun FileStat(title: String, value: String, modifier: Modifier) {
    Box(
        modifier = modifier
            .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.45f), RoundedCornerShape(14.dp))
            .padding(10.dp)
    ) {
        Column {
            Text(value, fontSize = 18.sp, fontWeight = FontWeight.Bold)
            Text(title, fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun FileRow(item: CleanerFileItem, onDelete: () -> Unit) {
    Card(
        shape = RoundedCornerShape(15.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.24f))
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 10.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(fileKindIcon(item.kind), contentDescription = null, tint = MaterialTheme.colorScheme.primary)
            Column(Modifier.weight(1f).padding(horizontal = 10.dp)) {
                Text(item.name, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, maxLines = 1)
                Text(
                    item.relativePath.ifBlank { "Almacenamiento interno" },
                    fontSize = 10.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1
                )
                Text(
                    "${if (item.isDownload && item.addedMs != null) "Descargado" else "Modificado"}: ${fileDate(item.bestDateMs)}",
                    fontSize = 10.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Column(horizontalAlignment = Alignment.End) {
                Text(fileBytes(item.sizeBytes), fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                IconButton(onClick = onDelete, modifier = Modifier.size(34.dp)) {
                    Icon(Icons.Default.DeleteOutline, contentDescription = "Eliminar ${item.name}", tint = MaterialTheme.colorScheme.primary)
                }
            }
        }
    }
}

@Composable
private fun DuplicateGroups(
    groups: List<DuplicateFileGroup>,
    total: Int,
    onDeleteCopies: (DuplicateFileGroup) -> Unit,
    onShowMore: () -> Unit
) {
    if (total == 0) {
        Text("No se encontraron duplicados exactos por SHA-256.", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        return
    }
    Text(
        "Duplicados exactos: mismo contenido SHA-256. LIA conserva la copia más reciente.",
        fontSize = 11.sp,
        color = MaterialTheme.colorScheme.onSurfaceVariant
    )
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        groups.forEach { group ->
            Card(
                shape = RoundedCornerShape(15.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.28f))
            ) {
                Column(Modifier.fillMaxWidth().padding(11.dp)) {
                    Text("${group.files.size} copias · ${fileBytes(group.recoverableBytes)} recuperables", fontWeight = FontWeight.SemiBold)
                    Text("Conservar: ${group.keep.name}", fontSize = 11.sp, color = MaterialTheme.colorScheme.secondary)
                    group.files.take(4).forEach { file ->
                        Text("• ${file.relativePath}${file.name}", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1)
                    }
                    if (group.files.size > 4) Text("+ ${group.files.size - 4} más", fontSize = 10.sp)
                    Spacer(Modifier.size(6.dp))
                    OutlinedButton(onClick = { onDeleteCopies(group) }, modifier = Modifier.fillMaxWidth()) {
                        Icon(Icons.Default.DeleteOutline, contentDescription = null)
                        Spacer(Modifier.size(6.dp))
                        Text("Eliminar copias (${group.files.size - 1})")
                    }
                }
            }
        }
    }
    if (groups.size < total) {
        OutlinedButton(onClick = onShowMore, modifier = Modifier.fillMaxWidth()) { Text("Mostrar más grupos") }
    }
}

@Composable
private fun ModeChip(label: String, selected: Boolean, onClick: () -> Unit) {
    FilterChip(selected = selected, onClick = onClick, label = { Text(label, fontSize = 11.sp) })
}

private fun filterFiles(
    source: List<CleanerFileItem>,
    mode: FileViewMode,
    minSize: Long,
    minAgeDays: Int,
    kind: CleanerFileKind?,
    sort: FileSortMode
): List<CleanerFileItem> {
    val now = System.currentTimeMillis()
    val ageMs = minAgeDays.toLong() * 24L * 60L * 60L * 1000L
    val filtered = source.asSequence()
        .filter {
            when (mode) {
                FileViewMode.DOWNLOADS -> it.isDownload
                FileViewMode.LARGE -> it.sizeBytes >= 100L * MB
                FileViewMode.ALL -> true
                FileViewMode.DUPLICATES -> false
            }
        }
        .filter { it.sizeBytes >= minSize }
        .filter { minAgeDays == 0 || (it.bestDateMs > 0L && now - it.bestDateMs >= ageMs) }
        .filter { kind == null || it.kind == kind }
        .toList()

    return when (sort) {
        FileSortMode.SIZE -> filtered.sortedByDescending { it.sizeBytes }
        FileSortMode.DATE -> filtered.sortedBy { it.bestDateMs.takeIf { date -> date > 0L } ?: Long.MAX_VALUE }
        FileSortMode.NAME -> filtered.sortedBy { it.name.lowercase() }
    }
}

private fun fileKindLabel(kind: CleanerFileKind): String = when (kind) {
    CleanerFileKind.IMAGE -> "Imágenes"
    CleanerFileKind.VIDEO -> "Video"
    CleanerFileKind.AUDIO -> "Audio"
    CleanerFileKind.DOCUMENT -> "Documentos"
    CleanerFileKind.ARCHIVE -> "Comprimidos"
    CleanerFileKind.APK -> "APK"
    CleanerFileKind.OTHER -> "Otros"
}

private fun fileKindIcon(kind: CleanerFileKind) = when (kind) {
    CleanerFileKind.IMAGE -> Icons.Default.Image
    CleanerFileKind.VIDEO -> Icons.Default.Movie
    CleanerFileKind.AUDIO -> Icons.Default.AudioFile
    CleanerFileKind.DOCUMENT -> Icons.Default.Description
    CleanerFileKind.ARCHIVE -> Icons.Default.Archive
    CleanerFileKind.APK -> Icons.Default.InstallMobile
    CleanerFileKind.OTHER -> Icons.Default.Folder
}

private fun fileBytes(bytes: Long): String {
    if (bytes < 1024L) return "$bytes B"
    val kb = bytes / 1024.0
    if (kb < 1024.0) return String.format(Locale.getDefault(), "%.0f KB", kb)
    val mb = kb / 1024.0
    if (mb < 1024.0) return String.format(Locale.getDefault(), "%.1f MB", mb)
    return String.format(Locale.getDefault(), "%.2f GB", mb / 1024.0)
}

private fun fileDate(ms: Long): String {
    if (ms <= 0L) return "fecha desconocida"
    return SimpleDateFormat("dd MMM yyyy", Locale.getDefault()).format(Date(ms))
}

private data class SizePreset(val label: String, val bytes: Long)
private val sizePresets = listOf(
    SizePreset("Todos", 0L),
    SizePreset(">10 MB", 10L * MB),
    SizePreset(">100 MB", 100L * MB),
    SizePreset(">500 MB", 500L * MB),
    SizePreset(">1 GB", 1024L * MB)
)

private data class AgePreset(val label: String, val days: Int)
private val agePresets = listOf(
    AgePreset("Cualquier fecha", 0),
    AgePreset(">30 d", 30),
    AgePreset(">90 d", 90),
    AgePreset(">180 d", 180),
    AgePreset(">1 año", 365)
)

private const val MB = 1024L * 1024L
