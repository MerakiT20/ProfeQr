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
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.DeleteSweep
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.PhotoLibrary
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import mx.direkta.liacleaner.model.PhotoGroup
import mx.direkta.liacleaner.model.PhotoGroupKind
import mx.direkta.liacleaner.model.PhotoItem
import mx.direkta.liacleaner.photo.AdvancedPhotoAnalyzer
import mx.direkta.liacleaner.photo.PhotoAnalyzer
import mx.direkta.liacleaner.photo.PhotoScanSession

@Composable
fun PhotoCleanerSectionV3(photoAnalyzer: PhotoAnalyzer, advancedPhotoAnalyzer: AdvancedPhotoAnalyzer) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val scope = rememberCoroutineScope()
    val session by PhotoScanSession.state.collectAsStateWithLifecycle()
    var photoAccess by remember { mutableStateOf(photoAnalyzer.hasPhotoAccess()) }
    var visibleHash by remember { mutableIntStateOf(12) }
    var visibleAi by remember { mutableIntStateOf(12) }
    var pendingDelete by remember { mutableStateOf<PendingPhotoDelete?>(null) }
    var manualOpen by remember { mutableStateOf(false) }
    var deleteQueue by remember { mutableStateOf<List<List<PhotoItem>>>(emptyList()) }
    var activeBatch by remember { mutableStateOf<List<PhotoItem>>(emptyList()) }

    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) photoAccess = photoAnalyzer.hasPhotoAccess()
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    val permissionLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) {
        photoAccess = photoAnalyzer.hasPhotoAccess()
        PhotoScanSession.setMessage(if (photoAccess) "Acceso concedido." else "Android no concedió acceso a las fotos.")
    }

    val deleteLauncher = rememberLauncherForActivityResult(ActivityResultContracts.StartIntentSenderForResult()) { result ->
        val deleted = activeBatch
        if (result.resultCode == Activity.RESULT_OK && deleted.isNotEmpty()) {
            PhotoScanSession.removeDeleted(context, deleted.map { it.id }.toSet(), "Eliminación completada sin perder el análisis.")
            activeBatch = emptyList()
        } else {
            activeBatch = emptyList()
            deleteQueue = emptyList()
        }
    }

    LaunchedEffect(deleteQueue, activeBatch) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && activeBatch.isEmpty() && deleteQueue.isNotEmpty()) {
            val next = deleteQueue.first()
            deleteQueue = deleteQueue.drop(1)
            activeBatch = next
            val request = MediaStore.createDeleteRequest(context.contentResolver, next.map { it.uri })
            deleteLauncher.launch(IntentSenderRequest.Builder(request.intentSender).build())
        }
    }

    fun requestAccess() {
        val permissions = when {
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE -> arrayOf(Manifest.permission.READ_MEDIA_IMAGES, Manifest.permission.READ_MEDIA_VISUAL_USER_SELECTED)
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU -> arrayOf(Manifest.permission.READ_MEDIA_IMAGES)
            else -> arrayOf(Manifest.permission.READ_EXTERNAL_STORAGE)
        }
        permissionLauncher.launch(permissions)
    }

    fun deletePhotos(photos: List<PhotoItem>) {
        val unique = photos.distinctBy { it.id }
        if (unique.isEmpty()) return
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            deleteQueue = unique.chunked(2000)
        } else {
            scope.launch(Dispatchers.IO) {
                val deleted = unique.filter { runCatching { context.contentResolver.delete(it.uri, null, null) > 0 }.getOrDefault(false) }
                withContext(Dispatchers.Main) {
                    PhotoScanSession.removeDeleted(context, deleted.map { it.id }.toSet(), "Eliminación completada sin perder el análisis.")
                }
            }
        }
    }

    pendingDelete?.let { pending ->
        AlertDialog(
            onDismissRequest = { pendingDelete = null },
            title = { Text(pending.title) },
            text = { Text(pending.message) },
            confirmButton = {
                TextButton(onClick = {
                    val photos = pending.photos
                    pendingDelete = null
                    deletePhotos(photos)
                }) { Text("Eliminar") }
            },
            dismissButton = { TextButton(onClick = { pendingDelete = null }) { Text("Cancelar") } }
        )
    }

    val allManualGroups = remember(session.quickResult, session.aiGroups) {
        buildList {
            session.quickResult?.let { addAll(it.exactGroups); addAll(it.nearGroups) }
            addAll(session.aiGroups)
        }.distinctBy { it.id }
    }

    if (manualOpen && allManualGroups.isNotEmpty()) {
        PhotoManualSession(
            groups = allManualGroups,
            analyzer = photoAnalyzer,
            onClose = { manualOpen = false },
            onDelete = { photos ->
                manualOpen = false
                pendingDelete = PendingPhotoDelete(
                    photos,
                    "¿Eliminar ${photos.size} fotos seleccionadas?",
                    "Revisaste cada grupo y elegiste qué fotografía conservar. Android mostrará la confirmación final."
                )
            }
        )
    }

    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Card(shape = RoundedCornerShape(18.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
            Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        Modifier.size(44.dp).background(MaterialTheme.colorScheme.primary.copy(alpha = .10f), RoundedCornerShape(13.dp)),
                        contentAlignment = Alignment.Center
                    ) { Icon(Icons.Default.PhotoLibrary, null, tint = MaterialTheme.colorScheme.primary) }
                    Column(Modifier.weight(1f).padding(start = 12.dp)) {
                        Text("Fotos", fontWeight = FontWeight.Bold, fontSize = 19.sp)
                        Text("Duplicados exactos, casi idénticos y similitud con IA.", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }

                if (!photoAccess) {
                    Button(onClick = ::requestAccess, modifier = Modifier.fillMaxWidth()) { Text("Dar acceso a fotos") }
                } else {
                    Button(
                        onClick = { visibleHash = 12; visibleAi = 12; PhotoScanSession.startQuick(photoAnalyzer) },
                        enabled = !session.scanning && !session.advancedScanning,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        if (session.scanning) {
                            CircularProgressIndicator(Modifier.size(18.dp), strokeWidth = 2.dp)
                            Spacer(Modifier.size(8.dp))
                            Text(if (session.total > 0) "Analizando ${session.done} / ${session.total}" else "Preparando…")
                        } else Text(if (session.quickResult == null) "Analizar fotos" else "Actualizar análisis")
                    }
                }

                if (session.scanning || session.advancedScanning) {
                    if (session.total > 0) LinearProgressIndicator(progress = { (session.done.toFloat() / session.total).coerceIn(0f, 1f) }, modifier = Modifier.fillMaxWidth())
                    Text("Puedes cambiar de pestaña; el análisis continúa.", fontSize = 11.sp, color = MaterialTheme.colorScheme.secondary)
                }
                session.message?.let { Text(it, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant) }
            }
        }

        session.quickResult?.let { result ->
            val exactCopies = result.exactGroups.flatMap { group ->
                val keep = bestPhoto(group.photos)
                group.photos.filter { it.id != keep.id }
            }.distinctBy { it.id }

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                ModernPhotoStat("Fotos", result.photos.size.toString(), Modifier.weight(1f))
                ModernPhotoStat("Exactas", result.exactGroups.size.toString(), Modifier.weight(1f))
                ModernPhotoStat("Casi iguales", result.nearGroups.size.toString(), Modifier.weight(1f))
            }

            if (result.exactGroups.isNotEmpty()) {
                Card(shape = RoundedCornerShape(18.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondary.copy(alpha = .08f))) {
                    Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("Limpieza rápida", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        Text("${result.exactGroups.size} grupos exactos · ${v3Bytes(result.exactGroups.sumOf { it.recoverableBytes })} recuperables", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Button(
                            onClick = {
                                pendingDelete = PendingPhotoDelete(
                                    exactCopies,
                                    "¿Eliminar todas las copias exactas?",
                                    "LIA conservará automáticamente una fotografía por cada grupo exacto y eliminará ${exactCopies.size} copias."
                                )
                            },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(Icons.Default.DeleteSweep, null)
                            Spacer(Modifier.size(7.dp))
                            Text("Eliminar todas las copias exactas (${exactCopies.size})")
                        }
                    }
                }
            }

            if (allManualGroups.isNotEmpty()) {
                OutlinedButton(onClick = { manualOpen = true }, modifier = Modifier.fillMaxWidth()) {
                    Icon(Icons.Default.PhotoLibrary, null)
                    Spacer(Modifier.size(7.dp))
                    Text("Revisión manual grupo por grupo (${allManualGroups.size})")
                }
            }

            if (result.quickGroups.isNotEmpty()) {
                Text("Resultados", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    result.quickGroups.take(visibleHash).forEach { group ->
                        CompactPhotoGroup(group, photoAnalyzer) { manualOpen = true }
                    }
                }
                if (visibleHash < result.quickGroups.size) {
                    OutlinedButton(onClick = { visibleHash += 12 }, modifier = Modifier.fillMaxWidth()) { Text("Mostrar 12 grupos más") }
                }
            }

            Card(shape = RoundedCornerShape(18.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.tertiary.copy(alpha = .07f))) {
                Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(7.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.AutoAwesome, null, tint = MaterialTheme.colorScheme.tertiary)
                        Text("Análisis avanzado con IA", Modifier.padding(start = 8.dp), fontWeight = FontWeight.Bold)
                    }
                    Text("Busca fotografías visualmente similares. Requiere más tiempo, memoria y batería.", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    OutlinedButton(
                        onClick = { visibleAi = 12; PhotoScanSession.startAdvanced(advancedPhotoAnalyzer) },
                        enabled = !session.scanning && !session.advancedScanning,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        if (session.advancedScanning) {
                            CircularProgressIndicator(Modifier.size(18.dp), strokeWidth = 2.dp)
                            Spacer(Modifier.size(8.dp))
                            Text(if (session.total > 0) "${session.done} / ${session.total}" else "Analizando…")
                        } else Text(if (session.aiGroups.isEmpty()) "Iniciar análisis avanzado" else "Actualizar análisis avanzado")
                    }
                }
            }

            if (session.aiGroups.isNotEmpty()) {
                Text("Similares con IA", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                session.aiGroups.take(visibleAi).forEach { group -> CompactPhotoGroup(group, photoAnalyzer) { manualOpen = true } }
                if (visibleAi < session.aiGroups.size) OutlinedButton(onClick = { visibleAi += 12 }, modifier = Modifier.fillMaxWidth()) { Text("Mostrar 12 grupos más") }
            }
        }
    }
}

private data class PendingPhotoDelete(val photos: List<PhotoItem>, val title: String, val message: String)

@Composable
private fun PhotoManualSession(
    groups: List<PhotoGroup>,
    analyzer: PhotoAnalyzer,
    onClose: () -> Unit,
    onDelete: (List<PhotoItem>) -> Unit
) {
    var index by remember(groups) { mutableIntStateOf(0) }
    var keepByGroup by remember(groups) {
        mutableStateOf(groups.associate { it.id to bestPhoto(it.photos).id })
    }
    val group = groups[index]
    val keepId = keepByGroup[group.id] ?: bestPhoto(group.photos).id
    val allKeepIds = keepByGroup.values.toSet()
    val deleteSelection = groups.flatMap { g -> g.photos.filter { it.id != keepByGroup[g.id] } }.filterNot { it.id in allKeepIds }.distinctBy { it.id }

    Dialog(onDismissRequest = onClose, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Surface(Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
            Column(Modifier.fillMaxSize().padding(horizontal = 18.dp, vertical = 12.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = onClose) { Icon(Icons.Default.ArrowBack, "Cerrar") }
                    Column(Modifier.weight(1f)) {
                        Text("Revisión manual", fontSize = 24.sp, fontWeight = FontWeight.Bold)
                        Text("Grupo ${index + 1} de ${groups.size}", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    Text("${((index + 1) * 100 / groups.size)}%", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                }
                LinearProgressIndicator(progress = { (index + 1).toFloat() / groups.size.toFloat() }, modifier = Modifier.fillMaxWidth())

                Card(shape = RoundedCornerShape(20.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                    Column(Modifier.fillMaxWidth().padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text(manualGroupTitle(group), fontWeight = FontWeight.Bold, fontSize = 17.sp)
                        Text("Toca la foto que quieres conservar. Las demás quedarán marcadas para eliminar.", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            items(group.photos, key = { it.id }) { photo ->
                                ManualPhotoThumb(photo, analyzer, keep = photo.id == keepId) {
                                    keepByGroup = keepByGroup + (group.id to photo.id)
                                }
                            }
                        }
                        Text("Se eliminarán ${group.photos.count { it.id != keepId }} de este grupo.", fontSize = 12.sp, color = MaterialTheme.colorScheme.secondary)
                    }
                }

                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedButton(onClick = { if (index > 0) index-- }, enabled = index > 0, modifier = Modifier.weight(1f)) {
                        Icon(Icons.Default.ArrowBack, null); Spacer(Modifier.size(4.dp)); Text("Anterior")
                    }
                    Button(onClick = { if (index < groups.lastIndex) index++ }, enabled = index < groups.lastIndex, modifier = Modifier.weight(1f)) {
                        Text("Siguiente"); Spacer(Modifier.size(4.dp)); Icon(Icons.Default.ArrowForward, null)
                    }
                }

                Spacer(Modifier.weight(1f))
                Card(shape = RoundedCornerShape(18.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondary.copy(alpha = .08f))) {
                    Column(Modifier.fillMaxWidth().padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text("Resumen de la sesión", fontWeight = FontWeight.Bold)
                        Text("${groups.size} grupos · ${deleteSelection.size} fotos marcadas para eliminar", fontSize = 12.sp)
                        Button(onClick = { onDelete(deleteSelection) }, enabled = deleteSelection.isNotEmpty(), modifier = Modifier.fillMaxWidth()) {
                            Icon(Icons.Default.DeleteSweep, null); Spacer(Modifier.size(7.dp)); Text("Eliminar seleccionadas (${deleteSelection.size})")
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ManualPhotoThumb(photo: PhotoItem, analyzer: PhotoAnalyzer, keep: Boolean, onKeep: () -> Unit) {
    val image by produceState<ImageBitmap?>(null, photo.id) {
        value = withContext(Dispatchers.IO) { analyzer.loadPreview(photo.uri, 360)?.asImageBitmap() }
    }
    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(5.dp)) {
        Box(
            Modifier.size(160.dp).clip(RoundedCornerShape(16.dp)).background(MaterialTheme.colorScheme.surfaceVariant).clickable(onClick = onKeep)
        ) {
            if (image != null) Image(image!!, photo.name, Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
            else Icon(Icons.Default.Image, null, Modifier.align(Alignment.Center))
            if (keep) {
                Box(Modifier.fillMaxSize().background(MaterialTheme.colorScheme.secondary.copy(alpha = .10f)))
                Box(Modifier.align(Alignment.TopEnd).padding(8.dp).background(MaterialTheme.colorScheme.secondary, CircleShape).padding(5.dp)) {
                    Icon(Icons.Default.CheckCircle, null, tint = Color.White, modifier = Modifier.size(20.dp))
                }
            }
            Text(v3Bytes(photo.sizeBytes), fontSize = 9.sp, color = Color.White, modifier = Modifier.align(Alignment.BottomStart).background(Color.Black.copy(alpha = .55f)).padding(horizontal = 6.dp, vertical = 3.dp))
        }
        Text(if (keep) "CONSERVAR" else "Eliminar", color = if (keep) MaterialTheme.colorScheme.secondary else MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 11.sp, fontWeight = if (keep) FontWeight.Bold else FontWeight.Normal)
    }
}

@Composable
private fun CompactPhotoGroup(group: PhotoGroup, analyzer: PhotoAnalyzer, onReview: () -> Unit) {
    val keep = remember(group.id) { bestPhoto(group.photos) }
    Card(shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
        Column(Modifier.fillMaxWidth().padding(11.dp), verticalArrangement = Arrangement.spacedBy(7.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Column(Modifier.weight(1f)) {
                    Text("${manualGroupTitle(group)} · ${group.photos.size} fotos", fontWeight = FontWeight.SemiBold)
                    Text("Hasta ${v3Bytes(group.recoverableBytes)} recuperables", fontSize = 11.sp, color = MaterialTheme.colorScheme.secondary)
                }
                group.similarity?.let { Text("${(it * 100).toInt()}%", fontWeight = FontWeight.Bold) }
            }
            LazyRow(horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                items(group.photos.take(4), key = { it.id }) { photo -> CompactPhotoThumb(photo, analyzer, keep = photo.id == keep.id) }
            }
            TextButton(onClick = onReview, modifier = Modifier.align(Alignment.End)) { Text("Revisar en sesión manual") }
        }
    }
}

@Composable
private fun CompactPhotoThumb(photo: PhotoItem, analyzer: PhotoAnalyzer, keep: Boolean) {
    val image by produceState<ImageBitmap?>(null, photo.id) {
        value = withContext(Dispatchers.IO) { analyzer.loadPreview(photo.uri, 160)?.asImageBitmap() }
    }
    Box(Modifier.size(76.dp).clip(RoundedCornerShape(11.dp)).background(MaterialTheme.colorScheme.surfaceVariant)) {
        if (image != null) Image(image!!, photo.name, Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
        if (keep) Icon(Icons.Default.CheckCircle, null, tint = MaterialTheme.colorScheme.secondary, modifier = Modifier.align(Alignment.TopEnd).padding(4.dp).size(18.dp))
    }
}

@Composable
private fun ModernPhotoStat(title: String, value: String, modifier: Modifier) {
    Card(modifier, shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
        Column(Modifier.padding(11.dp)) {
            Text(value, fontSize = 18.sp, fontWeight = FontWeight.Bold)
            Text(title, fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

private fun manualGroupTitle(group: PhotoGroup) = when (group.kind) {
    PhotoGroupKind.EXACT -> "Duplicadas exactas"
    PhotoGroupKind.NEAR_DUPLICATE -> "Casi idénticas"
    PhotoGroupKind.AI_SIMILAR -> "Similares con IA"
}

private fun bestPhoto(photos: List<PhotoItem>): PhotoItem = photos.maxWithOrNull(
    compareBy<PhotoItem> { it.width.toLong() * it.height.toLong() }
        .thenBy { it.sizeBytes }
        .thenBy { it.dateModifiedMs }
) ?: photos.first()

private fun v3Bytes(bytes: Long): String {
    if (bytes < 1024) return "$bytes B"
    val kb = bytes / 1024.0
    if (kb < 1024) return String.format("%.0f KB", kb)
    val mb = kb / 1024.0
    if (mb < 1024) return String.format("%.1f MB", mb)
    return String.format("%.2f GB", mb / 1024.0)
}
