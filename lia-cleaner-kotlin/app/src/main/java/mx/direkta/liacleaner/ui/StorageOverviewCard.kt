package mx.direkta.liacleaner.ui

import androidx.compose.foundation.Canvas
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.produceState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import mx.direkta.liacleaner.storage.StorageOverview
import mx.direkta.liacleaner.storage.StorageOverviewAnalyzer

enum class StorageCategory { APPS, IMAGES, VIDEOS, AUDIO, OTHER, FREE }

private data class StorageSlice(val label: String, val bytes: Long, val color: Color, val category: StorageCategory?)

@Composable
fun StorageOverviewCard(
    usageAccess: Boolean,
    onGrantUsage: () -> Unit,
    onCategorySelected: (StorageCategory) -> Unit = {}
) {
    val context = LocalContext.current
    val overview by produceState<StorageOverview?>(initialValue = null, usageAccess) {
        value = StorageOverviewAnalyzer(context.applicationContext).load(usageAccess)
    }

    Card(shape = RoundedCornerShape(26.dp), colors = CardDefaults.cardColors(containerColor = Color.White), elevation = CardDefaults.cardElevation(1.dp)) {
        Column(Modifier.fillMaxWidth().padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("Almacenamiento interno", fontSize = 18.sp, fontWeight = FontWeight.Bold)
            val data = overview
            if (data == null) {
                Text("Calculando uso del almacenamiento…", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                return@Column
            }
            val slices = storageSlices(data)
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(18.dp)) {
                StorageDonut(data, slices)
                Column(Modifier.weight(1f)) {
                    Text("${storageBytes(data.usedBytes)} usados", fontSize = 20.sp, fontWeight = FontWeight.Bold)
                    Text("de ${storageBytes(data.totalBytes)}", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(Modifier.size(6.dp))
                    Text("${storageBytes(data.freeBytes)} libres", fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.secondary)
                }
            }
            slices.chunked(2).forEach { pair ->
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    pair.forEach { slice -> StorageLegendItem(slice, Modifier.weight(1f), onCategorySelected) }
                    if (pair.size == 1) Spacer(Modifier.weight(1f))
                }
            }
            if (!data.detailed) {
                Text(
                    if (usageAccess) "Android no devolvió el desglose detallado. El total usado y libre sí es real."
                    else "Activa Acceso de uso para separar Apps, Imágenes, Videos y Audio.",
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                if (!usageAccess) androidx.compose.material3.TextButton(onClick = onGrantUsage) { Text("Activar desglose") }
            } else {
                Text("Toca Apps, Imágenes, Videos u Otros para abrir directamente su herramienta de limpieza.", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}

@Composable
private fun storageSlices(data: StorageOverview): List<StorageSlice> {
    val s = MaterialTheme.colorScheme
    val out = mutableListOf<StorageSlice>()
    if (data.detailed) {
        out += StorageSlice("Apps", data.appBytes ?: 0L, s.primary, StorageCategory.APPS)
        out += StorageSlice("Imágenes", data.imageBytes ?: 0L, s.secondary, StorageCategory.IMAGES)
        out += StorageSlice("Videos", data.videoBytes ?: 0L, s.tertiary, StorageCategory.VIDEOS)
        out += StorageSlice("Audio", data.audioBytes ?: 0L, s.error, StorageCategory.AUDIO)
        out += StorageSlice("Otros", data.otherBytes ?: 0L, s.onSurfaceVariant, StorageCategory.OTHER)
    } else out += StorageSlice("Usado", data.usedBytes, s.primary, null)
    out += StorageSlice("Libre", data.freeBytes, s.surfaceVariant, StorageCategory.FREE)
    return out
}

@Composable
private fun StorageDonut(data: StorageOverview, slices: List<StorageSlice>) {
    val usedSlices = slices.filter { it.label != "Libre" && it.bytes > 0L }
    val usedCategoryTotal = usedSlices.sumOf { it.bytes }.coerceAtLeast(1L)
    val total = data.totalBytes.coerceAtLeast(1L)
    val usedSweep = 360f * (data.usedBytes.toDouble() / total).coerceIn(0.0, 1.0).toFloat()
    val freeColor = slices.firstOrNull { it.label == "Libre" }?.color ?: MaterialTheme.colorScheme.surfaceVariant
    Box(Modifier.size(142.dp), contentAlignment = Alignment.Center) {
        Canvas(Modifier.size(142.dp)) {
            val stroke = Stroke(width = 22.dp.toPx())
            var start = -90f
            usedSlices.forEach { slice ->
                val sweep = usedSweep * (slice.bytes.toDouble() / usedCategoryTotal).toFloat()
                if (sweep > 0f) { drawArc(slice.color, start, sweep, false, style = stroke); start += sweep }
            }
            val freeSweep = (360f - usedSweep).coerceAtLeast(0f)
            if (freeSweep > 0f) drawArc(freeColor, -90f + usedSweep, freeSweep, false, style = stroke)
        }
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            val percent = ((data.usedBytes * 100.0) / total).coerceIn(0.0, 100.0).toInt()
            Text("$percent%", fontSize = 24.sp, fontWeight = FontWeight.Bold)
            Text("usado", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun StorageLegendItem(slice: StorageSlice, modifier: Modifier, onSelected: (StorageCategory) -> Unit) {
    val clickable = slice.category != null && slice.category != StorageCategory.FREE
    Row(
        modifier = modifier
            .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f), RoundedCornerShape(13.dp))
            .then(if (clickable) Modifier.clickable { onSelected(slice.category!!) } else Modifier)
            .padding(horizontal = 9.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(7.dp)
    ) {
        Box(Modifier.size(9.dp).background(slice.color, CircleShape))
        Column(Modifier.weight(1f)) {
            Text(slice.label, fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text(storageBytes(slice.bytes), fontSize = 12.sp, fontWeight = FontWeight.SemiBold, maxLines = 1)
        }
    }
}

private fun storageBytes(bytes: Long): String {
    if (bytes < 1024L) return "$bytes B"
    val kb = bytes / 1024.0
    if (kb < 1024.0) return String.format("%.0f KB", kb)
    val mb = kb / 1024.0
    if (mb < 1024.0) return String.format("%.1f MB", mb)
    val gb = mb / 1024.0
    if (gb < 1024.0) return String.format("%.1f GB", gb)
    return String.format("%.2f TB", gb / 1024.0)
}
