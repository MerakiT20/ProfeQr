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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.DeleteOutline
import androidx.compose.material.icons.filled.Image
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
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
    var visibleHash by remember { mutableIntStateOf(20) }
    var visibleAi by remember { mutableIntStateOf(20) }
    var pendingDelete by remember { mutableStateOf<PendingPhotoDelete?>(null) }

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
        if (result.resultCode == Activity.RESULT_OK) {
            PhotoScanSession.invalidateResults("Eliminación completada. Analiza de nuevo para actualizar los grupos.")
            visibleHash = 20
            visibleAi = 20
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
        if (photos.isEmpty()) return
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            val request = MediaStore.createDeleteRequest(context.contentResolver, photos.map { it.uri })
            deleteLauncher.launch(IntentSenderRequest.Builder(request.intentSender).build())
        } else {
            scope.launch(Dispatchers.IO) {
                photos.forEach { runCatching { context.contentResolver.delete(it.uri, null, null) } }
                withContext(Dispatchers.Main) { PhotoScanSession.invalidateResults("Eliminación completada.") }
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
                }) { Text("Continuar") }
            },
            dismissButton = { TextButton(onClick = { pendingDelete = null }) { Text("Cancelar") } }
        )
    }

    Card(shape = RoundedCornerShape(22.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
        Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Image, null, tint = MaterialTheme.colorScheme.primary)
                Column(Modifier.weight(1f).padding(start = 12.dp)) {
                    Text("Fotos", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                    Text("Hash primero; IA avanzada cuando tú la solicitas.", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }

            if (!photoAccess) {
                Button(onClick = ::requestAccess, modifier = Modifier.fillMaxWidth()) { Text("Dar acceso a fotos") }
            } else {
                Button(
                    onClick = { visibleHash = 20; visibleAi = 20; PhotoScanSession.startQuick(photoAnalyzer) },
                    enabled = !session.scanning && !session.advancedScanning,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    if (session.scanning) {
                        CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp)
                        Spacer(Modifier.size(8.dp))
                        Text(if (session.total > 0) "${session.done} / ${session.total}" else "Preparando…")
                    } else Text(if (session.quickResult == null) "Analizar fotos" else "Analizar de nuevo")
                }
            }

            if (session.scanning || session.advancedScanning) {
                Text("Puedes cambiar de pestaña o girar el teléfono; el análisis continuará.", fontSize = 11.sp, color = MaterialTheme.colorScheme.secondary)
            }
            session.message?.let { Text(it, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant) }

            session.quickResult?.let { result ->
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    V3Stat("Fotos", result.photos.size.toString(), Modifier.weight(1f))
                    V3Stat("Exactas", result.exactGroups.size.toString(), Modifier.weight(1f))
                    V3Stat("Casi iguales", result.nearGroups.size.toString(), Modifier.weight(1f))
                }
                V3Stat("Espacio recuperable", v3Bytes(result.recoverableBytes), Modifier.fillMaxWidth())

                if (result.quickGroups.isNotEmpty()) {
                    Text("Resultados por hash", fontWeight = FontWeight.Bold)
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        result.quickGroups.take(visibleHash).forEach { group ->
                            V3PhotoGroup(group, photoAnalyzer) { photos, automatic ->
                                pendingDelete = pendingFor(group, photos, automatic)
                            }
                        }
                    }
                    if (visibleHash < result.quickGroups.size) {
                        OutlinedButton(onClick = { visibleHash += 20 }, modifier = Modifier.fillMaxWidth()) {
                            Text("Mostrar 20 grupos más")
                        }
                    }
                }

                Card(shape = RoundedCornerShape(18.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary.copy(alpha = .06f))) {
                    Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(7.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.AutoAwesome, null, tint = MaterialTheme.colorScheme.primary)
                            Text("Análisis avanzado con IA", Modifier.padding(start = 8.dp), fontWeight = FontWeight.Bold)
                        }
                        Text("Encuentra similitudes visuales. Requiere más tiempo, memoria y batería.", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        OutlinedButton(
                            onClick = { visibleAi = 20; PhotoScanSession.startAdvanced(advancedPhotoAnalyzer) },
                            enabled = !session.scanning && !session.advancedScanning,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            if (session.advancedScanning) {
                                CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp)
                                Spacer(Modifier.size(8.dp))
                                Text(if (session.total > 0) "${session.done} / ${session.total}" else "Analizando…")
                            } else Text(if (session.aiGroups.isEmpty()) "Iniciar análisis avanzado" else "Repetir análisis avanzado")
                        }
                    }
                }

                if (session.aiGroups.isNotEmpty()) {
                    Text("Similares encontradas por IA", fontWeight = FontWeight.Bold)
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        session.aiGroups.take(visibleAi).forEach { group ->
                            V3PhotoGroup(group, photoAnalyzer) { photos, automatic ->
                                pendingDelete = pendingFor(group, photos, automatic)
                            }
                        }
                    }
                    if (visibleAi < session.aiGroups.size) {
                        OutlinedButton(onClick = { visibleAi += 20 }, modifier = Modifier.fillMaxWidth()) { Text("Mostrar 20 grupos más") }
                    }
                }
            }
        }
    }
}

private data class PendingPhotoDelete(val photos: List<PhotoItem>, val title: String, val message: String)

private fun pendingFor(group: PhotoGroup, photos: List<PhotoItem>, automatic: Boolean): PendingPhotoDelete {
    val title = if (automatic) "¿Conservar una y eliminar el resto?" else "¿Eliminar selección?"
    val message = when (group.kind) {
        PhotoGroupKind.EXACT -> "Estas fotos tienen contenido SHA-256 idéntico. LIA conservará una copia y Android mostrará la confirmación final."
        PhotoGroupKind.NEAR_DUPLICATE -> "Estas fotos son casi idénticas, pero no son el mismo archivo. Revisa la miniatura marcada CONSERVAR antes de continuar."
        PhotoGroupKind.AI_SIMILAR -> "La IA considera estas fotos visualmente similares. No es una garantía de duplicado. Revisa cuál se conservará antes de borrar."
    }
    return PendingPhotoDelete(photos, title, message)
}

@Composable
private fun V3PhotoGroup(group: PhotoGroup, analyzer: PhotoAnalyzer, onDelete: (List<PhotoItem>, Boolean) -> Unit) {
    val keep = remember(group.id) { v3BestPhoto(group.photos) }
    var selected by remember(group.id) { mutableStateOf(group.photos.filter { it.id != keep.id }.map { it.id }.toSet()) }
    val title = when (group.kind) {
        PhotoGroupKind.EXACT -> "Duplicado exacto"
        PhotoGroupKind.NEAR_DUPLICATE -> "Casi idénticas"
        PhotoGroupKind.AI_SIMILAR -> "Similares con IA"
    }

    Card(shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = .3f))) {
        Column(Modifier.fillMaxWidth().padding(10.dp), verticalArrangement = Arrangement.spacedBy(7.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Column(Modifier.weight(1f)) {
                    Text("$title · ${group.photos.size} fotos", fontWeight = FontWeight.SemiBold)
                    Text("Hasta ${v3Bytes(group.recoverableBytes)} recuperables", fontSize = 11.sp, color = MaterialTheme.colorScheme.secondary)
                }
                group.similarity?.let { Text("${(it * 100).toInt()}%", fontWeight = FontWeight.Bold) }
            }
            LazyRow(horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                items(group.photos, key = { it.id }) { photo ->
                    V3Thumb(photo, analyzer, selected = photo.id in selected, keep = photo.id == keep.id) {
                        if (photo.id != keep.id) selected = if (photo.id in selected) selected - photo.id else selected + photo.id
                    }
                }
            }
            Button(
                onClick = { onDelete(group.photos.filter { it.id != keep.id }, true) },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Conservar 1 y eliminar el resto (${group.photos.size - 1})")
            }
            OutlinedButton(
                onClick = { onDelete(group.photos.filter { it.id in selected }, false) },
                enabled = selected.isNotEmpty(),
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(Icons.Default.DeleteOutline, null)
                Spacer(Modifier.size(6.dp))
                Text("Selección manual (${selected.size})")
            }
        }
    }
}

@Composable
private fun V3Thumb(photo: PhotoItem, analyzer: PhotoAnalyzer, selected: Boolean, keep: Boolean, onToggle: () -> Unit) {
    val image by produceState<ImageBitmap?>(null, photo.id) {
        value = withContext(Dispatchers.IO) { analyzer.loadPreview(photo.uri, 160)?.asImageBitmap() }
    }
    Box(Modifier.size(88.dp).clip(RoundedCornerShape(12.dp)).background(MaterialTheme.colorScheme.surface).clickable(onClick = onToggle)) {
        if (image != null) Image(image!!, photo.name, Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
        else Icon(Icons.Default.Image, null, Modifier.align(Alignment.Center))
        if (selected) {
            Box(Modifier.fillMaxSize().background(MaterialTheme.colorScheme.primary.copy(alpha = .18f)))
            Icon(Icons.Default.CheckCircle, null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.align(Alignment.TopEnd).padding(4.dp))
        }
        if (keep) Text("CONSERVAR", fontSize = 8.sp, color = Color.White, modifier = Modifier.align(Alignment.TopStart).background(MaterialTheme.colorScheme.secondary).padding(4.dp))
        Text(v3Bytes(photo.sizeBytes), fontSize = 8.sp, color = Color.White, modifier = Modifier.align(Alignment.BottomStart).background(Color.Black.copy(alpha = .55f)).padding(3.dp))
    }
}

@Composable
private fun V3Stat(title: String, value: String, modifier: Modifier) {
    Box(modifier.background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = .4f), RoundedCornerShape(14.dp)).padding(10.dp)) {
        Column { Text(value, fontSize = 16.sp, fontWeight = FontWeight.Bold); Text(title, fontSize = 9.sp, color = MaterialTheme.colorScheme.onSurfaceVariant) }
    }
}

private fun v3BestPhoto(photos: List<PhotoItem>): PhotoItem = photos.maxWithOrNull(compareBy<PhotoItem> { it.width.toLong() * it.height.toLong() }.thenBy { it.sizeBytes }.thenBy { it.dateModifiedMs }) ?: photos.first()

private fun v3Bytes(bytes: Long): String {
    if (bytes < 1024) return "$bytes B"
    val kb = bytes / 1024.0
    if (kb < 1024) return String.format("%.0f KB", kb)
    val mb = kb / 1024.0
    if (mb < 1024) return String.format("%.1f MB", mb)
    return String.format("%.2f GB", mb / 1024.0)
}
