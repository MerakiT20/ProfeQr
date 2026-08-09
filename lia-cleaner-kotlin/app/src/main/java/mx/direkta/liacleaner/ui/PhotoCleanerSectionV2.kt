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
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
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
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import mx.direkta.liacleaner.model.PhotoGroup
import mx.direkta.liacleaner.model.PhotoGroupKind
import mx.direkta.liacleaner.model.PhotoItem
import mx.direkta.liacleaner.model.PhotoScanResult
import mx.direkta.liacleaner.photo.AdvancedPhotoAnalyzer
import mx.direkta.liacleaner.photo.PhotoAnalyzer

@Composable
fun PhotoCleanerSectionV2(
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
        message = if (photoAccess) "Acceso concedido." else "Android no concedió acceso a las fotos."
    }

    val deleteLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.StartIntentSenderForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            quickResult = null
            aiGroups = emptyList()
            message = "Eliminación completada. Analiza de nuevo para actualizar."
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
            val pendingIntent = MediaStore.createDeleteRequest(context.contentResolver, photos.map { it.uri })
            deleteLauncher.launch(IntentSenderRequest.Builder(pendingIntent.intentSender).build())
        } else {
            scope.launch(Dispatchers.IO) {
                photos.forEach { runCatching { context.contentResolver.delete(it.uri, null, null) } }
                withContext(Dispatchers.Main) {
                    quickResult = null
                    aiGroups = emptyList()
                    message = "Eliminación completada."
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
                        "Hash primero; IA avanzada solo si la solicitas.",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Spacer(Modifier.size(12.dp))
            if (!photoAccess) {
                Text(
                    "Da acceso a las fotos que quieras analizar.",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(Modifier.size(8.dp))
                Button(onClick = ::requestPhotoAccess, modifier = Modifier.fillMaxWidth()) { Text("Dar acceso a fotos") }
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
                Spacer(Modifier.size(7.dp))
                Text(it, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }

            quickResult?.let { result ->
                Spacer(Modifier.size(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    PhotoStat("Fotos", result.photos.size.toString(), Modifier.weight(1f))
                    PhotoStat("Exactas", result.exactGroups.size.toString(), Modifier.weight(1f))
                    PhotoStat("Casi iguales", result.nearGroups.size.toString(), Modifier.weight(1f))
                }
                Spacer(Modifier.size(8.dp))
                PhotoStat("Espacio potencialmente recuperable", photoBytes(result.recoverableBytes), Modifier.fillMaxWidth())

                if (result.quickGroups.isNotEmpty()) {
                    Spacer(Modifier.size(10.dp))
                    Text("Resultados por hash", fontWeight = FontWeight.Bold)
                    Text(
                        "Los duplicados exactos vienen preseleccionados; las casi iguales requieren revisión.",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(Modifier.size(7.dp))
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        result.quickGroups.forEach { group -> PhotoGroupCardV2(group, photoAnalyzer, ::deletePhotos) }
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
                            "Busca similitudes que los hashes pueden no detectar. Requiere más tiempo, memoria y batería; todo se procesa en el teléfono.",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(Modifier.size(8.dp))
                        OutlinedButton(
                            onClick = ::runAdvancedScan,
                            enabled = !scanning && !advancedScanning,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            if (advancedScanning) {
                                CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                                Spacer(Modifier.size(8.dp))
                                Text(if (total > 0) "$done / $total" else "Analizando con IA…")
                            } else Text(if (aiGroups.isEmpty()) "Iniciar análisis avanzado" else "Repetir análisis avanzado")
                        }
                    }
                }

                if (aiGroups.isNotEmpty()) {
                    Spacer(Modifier.size(10.dp))
                    Text("Similares encontradas por IA", fontWeight = FontWeight.Bold)
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        aiGroups.forEach { group -> PhotoGroupCardV2(group, photoAnalyzer, ::deletePhotos) }
                    }
                }
            }
        }
    }
}

@Composable
private fun PhotoStat(title: String, value: String, modifier: Modifier) {
    Box(
        modifier = modifier
            .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f), RoundedCornerShape(14.dp))
            .padding(10.dp)
    ) {
        Column {
            Text(value, fontSize = 17.sp, fontWeight = FontWeight.Bold)
            Text(title, fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun PhotoGroupCardV2(
    group: PhotoGroup,
    analyzer: PhotoAnalyzer,
    onDelete: (List<PhotoItem>) -> Unit
) {
    val initial = remember(group.id) {
        if (group.kind == PhotoGroupKind.EXACT) group.photos.drop(1).map { it.id }.toSet() else emptySet()
    }
    var selectedIds by remember(group.id) { mutableStateOf(initial) }
    val title = when (group.kind) {
        PhotoGroupKind.EXACT -> "Duplicado exacto"
        PhotoGroupKind.NEAR_DUPLICATE -> "Casi idénticas"
        PhotoGroupKind.AI_SIMILAR -> "Similares con IA"
    }

    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f))
    ) {
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
                    PhotoThumbV2(
                        photo = photo,
                        analyzer = analyzer,
                        selected = photo.id in selectedIds,
                        onToggle = {
                            selectedIds = if (photo.id in selectedIds) selectedIds - photo.id else selectedIds + photo.id
                        }
                    )
                }
            }
            if (selectedIds.isNotEmpty()) {
                Spacer(Modifier.size(7.dp))
                OutlinedButton(
                    onClick = { onDelete(group.photos.filter { it.id in selectedIds }) },
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
private fun PhotoThumbV2(
    photo: PhotoItem,
    analyzer: PhotoAnalyzer,
    selected: Boolean,
    onToggle: () -> Unit
) {
    val image by produceState<ImageBitmap?>(initialValue = null, key1 = photo.id) {
        value = withContext(Dispatchers.IO) { analyzer.loadPreview(photo.uri, 180)?.asImageBitmap() }
    }
    Box(
        modifier = Modifier
            .size(92.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(MaterialTheme.colorScheme.surface)
            .clickable(onClick = onToggle)
    ) {
        if (image != null) {
            Image(image!!, photo.name, Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
        } else {
            Icon(Icons.Default.Image, contentDescription = null, modifier = Modifier.align(Alignment.Center))
        }
        if (selected) {
            Box(Modifier.fillMaxSize().background(MaterialTheme.colorScheme.primary.copy(alpha = 0.2f)))
            Icon(Icons.Default.CheckCircle, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.align(Alignment.TopEnd).padding(5.dp))
        }
        Text(
            photoBytes(photo.sizeBytes),
            fontSize = 9.sp,
            color = Color.White,
            modifier = Modifier.align(Alignment.BottomStart).background(Color.Black.copy(alpha = 0.55f)).padding(3.dp)
        )
    }
}

private fun photoBytes(bytes: Long): String {
    if (bytes < 1024L) return "$bytes B"
    val kb = bytes / 1024.0
    if (kb < 1024.0) return String.format("%.0f KB", kb)
    val mb = kb / 1024.0
    if (mb < 1024.0) return String.format("%.1f MB", mb)
    return String.format("%.2f GB", mb / 1024.0)
}
