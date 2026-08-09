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
fun PhotoCleanerSectionV2(
    photoAnalyzer: PhotoAnalyzer,
    advancedPhotoAnalyzer: AdvancedPhotoAnalyzer
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val scope = rememberCoroutineScope()
    val session by PhotoScanSession.state.collectAsStateWithLifecycle()
    var photoAccess by remember { mutableStateOf(photoAnalyzer.hasPhotoAccess()) }
    var visibleGroups by remember { mutableIntStateOf(20) }
    var bulkConfirm by remember { mutableStateOf<List<PhotoItem>?>(null) }

    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) photoAccess = photoAnalyzer.hasPhotoAccess()
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) {
        photoAccess = photoAnalyzer.hasPhotoAccess()
        PhotoScanSession.setMessage(if (photoAccess) "Acceso concedido." else "Android no concedió acceso a las fotos.")
    }

    val deleteLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.StartIntentSenderForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            PhotoScanSession.invalidateResults("Eliminación completada. Analiza de nuevo para actualizar los grupos.")
            visibleGroups = 20
        }
    }

    fun requestPhotoAccess() {
        val permissions = when {
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE -> arrayOf(
                Manifest.permission.READ_MEDIA_IMAGES,
                Manifest.permission.READ_MEDIA_VISUAL_USER_SELECTED
            )
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU -> arrayOf(Manifest.permission.READ_MEDIA_IMAGES)
            else -> arrayOf(Manifest.permission.READ_EXTERNAL_STORAGE)
        }
        permissionLauncher.launch(permissions)
    }

    fun startQuick() {
        if (!photoAnalyzer.hasPhotoAccess()) {
            photoAccess = false
            requestPhotoAccess()
            return
        }
        visibleGroups = 20
        PhotoScanSession.startQuick(photoAnalyzer)
    }

    fun deletePhotos(photos: List<PhotoItem>) {
        if (photos.isEmpty()) return
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            val pendingIntent = MediaStore.createDeleteRequest(context.contentResolver, photos.map { it.uri })
            deleteLauncher.launch(IntentSenderRequest.Builder(pendingIntent.intentSender).build())
        } else {
            scope.launch(Dispatchers.IO) {
                photos.forEach { runCatching { context.contentResolver.delete(it.uri, null, null) } }
                withContext(Dispatchers.Main) {
                    PhotoScanSession.invalidateResults("Eliminación completada. Analiza de nuevo para actualizar.")
                    visibleGroups = 20
                }
            }
        }
    }

    bulkConfirm?.let { photos ->
        AlertDialog(
            onDismissRequest = { bulkConfirm = null },
            title = { Text("¿Conservar una copia por grupo?") },
            text = {
                Text(
                    "LIA conservará una fotografía de cada grupo de duplicados EXACTOS y propondrá eliminar ${photos.size} copias idénticas. Android mostrará la confirmación final. Las fotos casi iguales y las de IA no se borran automáticamente."
                )
            },
            confirmButton = {
                TextButton(onClick = { bulkConfirm = null; deletePhotos(photos) }) { Text("Continuar") }
            },
            dismissButton = { TextButton(onClick = { bulkConfirm = null }) { Text("Cancelar") } }
        )
    }

    Card(
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Column(Modifier.fillMaxWidth().padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Image, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                Column(Modifier.weight(1f).padding(horizontal = 12.dp)) {
                    Text("Fotos", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                    Text("Duplicados exactos y fotos similares. Hash primero; IA solo si la solicitas.", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }

            Spacer(Modifier.size(12.dp))
            if (!photoAccess) {
                Text("Da acceso a las fotos que quieras analizar.", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Spacer(Modifier.size(8.dp))
                Button(onClick = ::requestPhotoAccess, modifier = Modifier.fillMaxWidth()) { Text("Dar acceso a fotos") }
            } else {
                Button(
                    onClick = ::startQuick,
                    enabled = !session.scanning && !session.advancedScanning,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    if (session.scanning) {
                        CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                        Spacer(Modifier.size(8.dp))
                        Text(if (session.total > 0) "${session.done} / ${session.total}" else "Preparando análisis…")
                    } else {
                        Text(if (session.quickResult == null) "Analizar fotos" else "Analizar de nuevo")
                    }
                }
            }

            if (session.scanning) {
                Spacer(Modifier.size(6.dp))
                Text(
                    "Puedes cambiar de pestaña o girar el teléfono; el análisis continuará.",
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.secondary
                )
            }

            session.message?.let {
                Spacer(Modifier.size(7.dp))
                Text(it, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }

            session.quickResult?.let { result ->
                Spacer(Modifier.size(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    PhotoStat("Fotos", result.photos.size.toString(), Modifier.weight(1f))
                    PhotoStat("Exactas", result.exactGroups.size.toString(), Modifier.weight(1f))
                    PhotoStat("Casi iguales", result.nearGroups.size.toString(), Modifier.weight(1f))
                }
                Spacer(Modifier.size(8.dp))
                PhotoStat("Espacio potencialmente recuperable", photoBytes(result.recoverableBytes), Modifier.fillMaxWidth())

                val exactCopies = remember(result.analyzedAtMs) {
                    result.exactGroups.flatMap { group ->
                        val keep = bestPhoto(group.photos)
                        group.photos.filter { it.id != keep.id }
                    }
                }
                if (exactCopies.isNotEmpty()) {
                    Spacer(Modifier.size(9.dp))
                    Button(
                        onClick = { bulkConfirm = exactCopies },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Conservar 1 por grupo exacto · eliminar ${exactCopies.size} copias")
                    }
                    Text(
                        "Esta acción masiva solo incluye duplicados SHA-256 exactos. La selección manual sigue disponible abajo.",
                        fontSize = 10.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                val groups = result.quickGroups
                if (groups.isNotEmpty()) {
                    Spacer(Modifier.size(10.dp))
                    Text("Resultados por hash", fontWeight = FontWeight.Bold)
                    Text("Se muestran por lotes para evitar saturar memoria después del análisis.", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(Modifier.size(7.dp))
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        groups.take(visibleGroups).forEach { group ->
                            PhotoGroupCardV2(group, photoAnalyzer, ::deletePhotos)
                        }
                    }
                    if (visibleGroups < groups.size) {
                        Spacer(Modifier.size(8.dp))
                        OutlinedButton(onClick = { visibleGroups += 20 }, modifier = Modifier.fillMaxWidth()) {
                            Text("Mostrar 20 grupos más (${groups.size - visibleGroups} restantes)")
                        }
                    }
                } else {
                    Spacer(Modifier.size(10.dp))
                    Text("No se encontraron duplicados o fotos casi idénticas.", fontSize = 12.sp)
                }

                Spacer(Modifier.size(14.dp))
                Card(
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.06f))
                ) {
                    Column(Modifier.padding(14.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.AutoAwesome, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                            Text("Análisis avanzado con IA", Modifier.padding(start = 8.dp), fontWeight = FontWeight.Bold)
                        }
                        Spacer(Modifier.size(5.dp))
                        Text(
                            "Busca similitudes que los hashes pueden no detectar. Requiere más tiempo, memoria y batería. Todo se procesa en el teléfono.",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(Modifier.size(8.dp))
                        OutlinedButton(
                            onClick = { PhotoScanSession.startAdvanced(advancedPhotoAnalyzer) },
                            enabled = !session.scanning && !session.advancedScanning,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            if (session.advancedScanning) {
                                CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                                Spacer(Modifier.size(8.dp))
                                Text(if (session.total > 0) "${session.done} / ${session.total}" else "Analizando con IA…")
                            } else Text(if (session.aiGroups.isEmpty()) "Iniciar análisis avanzado" else "Repetir análisis avanzado")
                        }
                    }
                }

                if (session.aiGroups.isNotEmpty()) {
                    Spacer(Modifier.size(10.dp))
                    Text("Similares encontradas por IA", fontWeight = FontWeight.Bold)
                    Text("Siempre requieren selección manual.", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        session.aiGroups.take(visibleGroups).forEach { group -> PhotoGroupCardV2(group, photoAnalyzer, ::deletePhotos) }
                    }
                }
            }
        }
    }
}

@Composable
private fun PhotoStat(title: String, value: String, modifier: Modifier) {
    Box(modifier = modifier.background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f), RoundedCornerShape(14.dp)).padding(10.dp)) {
        Column { Text(value, fontSize = 17.sp, fontWeight = FontWeight.Bold); Text(title, fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant) }
    }
}

@Composable
private fun PhotoGroupCardV2(group: PhotoGroup, analyzer: PhotoAnalyzer, onDelete: (List<PhotoItem>) -> Unit) {
    val keep = remember(group.id) { bestPhoto(group.photos) }
    val initial = remember(group.id) {
        if (group.kind == PhotoGroupKind.EXACT) group.photos.filter { it.id != keep.id }.map { it.id }.toSet() else emptySet()
    }
    var selectedIds by remember(group.id) { mutableStateOf(initial) }
    val title = when (group.kind) {
        PhotoGroupKind.EXACT -> "Duplicado exacto"
        PhotoGroupKind.NEAR_DUPLICATE -> "Casi idénticas"
        PhotoGroupKind.AI_SIMILAR -> "Similares con IA"
    }

    Card(shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f))) {
        Column(Modifier.fillMaxWidth().padding(10.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Column(Modifier.weight(1f)) {
                    Text("$title · ${group.photos.size} fotos", fontWeight = FontWeight.SemiBold)
                    Text("Hasta ${photoBytes(group.recoverableBytes)} recuperables", fontSize = 11.sp, color = MaterialTheme.colorScheme.secondary)
                }
                group.similarity?.let { Text("${(it * 100).toInt()}%", fontWeight = FontWeight.Bold) }
            }
            Spacer(Modifier.size(7.dp))
            LazyRow(horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                items(group.photos, key = { it.id }) { photo ->
                    PhotoThumbV2(photo, analyzer, photo.id in selectedIds, photo.id == keep.id) {
                        selectedIds = if (photo.id in selectedIds) selectedIds - photo.id else selectedIds + photo.id
                    }
                }
            }
            if (group.kind == PhotoGroupKind.EXACT) {
                Spacer(Modifier.size(6.dp))
                OutlinedButton(
                    onClick = { onDelete(group.photos.filter { it.id != keep.id }) },
                    modifier = Modifier.fillMaxWidth()
                ) { Text("Conservar 1 y eliminar copias (${group.photos.size - 1})") }
            }
            if (selectedIds.isNotEmpty()) {
                Spacer(Modifier.size(7.dp))
                OutlinedButton(onClick = { onDelete(group.photos.filter { it.id in selectedIds }) }, modifier = Modifier.fillMaxWidth()) {
                    Icon(Icons.Default.DeleteOutline, contentDescription = null)
                    Spacer(Modifier.size(6.dp))
                    Text("Selección manual (${selectedIds.size})")
                }
            }
        }
    }
}

@Composable
private fun PhotoThumbV2(photo: PhotoItem, analyzer: PhotoAnalyzer, selected: Boolean, keep: Boolean, onToggle: () -> Unit) {
    val image by produceState<ImageBitmap?>(initialValue = null, key1 = photo.id) {
        value = withContext(Dispatchers.IO) { analyzer.loadPreview(photo.uri, 160)?.asImageBitmap() }
    }
    Box(
        modifier = Modifier.size(88.dp).clip(RoundedCornerShape(12.dp)).background(MaterialTheme.colorScheme.surface).clickable(onClick = onToggle)
    ) {
        if (image != null) Image(image!!, photo.name, Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
        else Icon(Icons.Default.Image, contentDescription = null, modifier = Modifier.align(Alignment.Center))
        if (selected) {
            Box(Modifier.fillMaxSize().background(MaterialTheme.colorScheme.primary.copy(alpha = 0.2f)))
            Icon(Icons.Default.CheckCircle, contentDescription = "Seleccionada", tint = MaterialTheme.colorScheme.primary, modifier = Modifier.align(Alignment.TopEnd).padding(5.dp))
        }
        if (keep) {
            Text("CONSERVAR", fontSize = 7.sp, color = Color.White, modifier = Modifier.align(Alignment.TopStart).background(MaterialTheme.colorScheme.secondary.copy(alpha = 0.92f)).padding(horizontal = 4.dp, vertical = 2.dp))
        }
        Text(photoBytes(photo.sizeBytes), fontSize = 8.sp, color = Color.White, modifier = Modifier.align(Alignment.BottomStart).background(Color.Black.copy(alpha = 0.55f)).padding(3.dp))
    }
}

private fun bestPhoto(photos: List<PhotoItem>): PhotoItem = photos.maxWithOrNull(
    compareBy<PhotoItem> { it.width.toLong() * it.height.toLong() }
        .thenBy { it.sizeBytes }
        .thenBy { it.dateTakenMs }
) ?: photos.first()

private fun photoBytes(bytes: Long): String {
    if (bytes < 1024L) return "$bytes B"
    val kb = bytes / 1024.0
    if (kb < 1024.0) return String.format("%.0f KB", kb)
    val mb = kb / 1024.0
    if (mb < 1024.0) return String.format("%.1f MB", mb)
    return String.format("%.2f GB", mb / 1024.0)
}
