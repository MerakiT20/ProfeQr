package mx.direkta.liacleaner.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
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

private data class StorageSlice(
    val label: String,
    val bytes: Long,
    val color: Color
)

@Composable
fun StorageOverviewCard(
    usageAccess: Boolean,
    onGrantUsage: () -> Unit
) {
    val context = LocalContext.current
    val overview by produceState<StorageOverview?>(initialValue = null, usageAccess) {
        value = StorageOverviewAnalyzer(context.applicationContext).load(usageAccess)
    }

    Card(
        shape = RoundedCornerShape(26.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(1.dp)
    ) {
        Column(
            modifier = Modifier.fillMaxWidth().padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text("Almacenamiento interno", fontSize = 18.sp, fontWeight = FontWeight.Bold)

            val data = overview
            if (data == null) {
                Text(
                    "Calculando uso del almacenamiento…",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                return@Column
            }

            val slices = storageSlices(data)
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(18.dp)
            ) {
                StorageDonut(data, slices)
                Column(Modifier.weight(1f)) {
                    Text(
                        "${storageBytes(data.usedBytes)} usados",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        "de ${storageBytes(data.totalBytes)}",
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(Modifier.size(6.dp))
                    Text(
                        "${storageBytes(data.freeBytes)} libres",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.secondary
                    )
                }
            }

            slices.chunked(2).forEach { pair ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    pair.forEach { slice ->
                        StorageLegendItem(slice, Modifier.weight(1f))
                    }
                    if (pair.size == 1) Spacer(Modifier.weight(1f))
                }
            }

            if (!data.detailed) {
                Text(
                    if (usageAccess) {
                        "Android no devolvió el desglose detallado. El total usado y libre sí es real."
                    } else {
                        "Activa Acceso de uso para separar Apps, Imágenes, Videos y Audio."
                    },
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                if (!usageAccess) {
                    androidx.compose.material3.TextButton(onClick = onGrantUsage) {
                        Text("Activar desglose")
                    }
                }
            } else {
                Text(
                    "Otros incluye documentos, descargas, archivos del sistema y contenido no clasificado en las categorías anteriores.",
                    fontSize = 10.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun storageSlices(data: StorageOverview): List<StorageSlice> {
    val scheme = MaterialTheme.colorScheme
    val slices = mutableListOf<StorageSlice>()
    if (data.detailed) {
        slices += StorageSlice("Apps", data.appBytes ?: 0L, scheme.primary)
        slices += StorageSlice("Imágenes", data.imageBytes ?: 0L, scheme.secondary)
        slices += StorageSlice("Videos", data.videoBytes ?: 0L, scheme.tertiary)
        slices += StorageSlice("Audio", data.audioBytes ?: 0L, scheme.error)
        slices += StorageSlice("Otros", data.otherBytes ?: 0L, scheme.onSurfaceVariant)
    } else {
        slices += StorageSlice("Usado", data.usedBytes, scheme.primary)
    }
    slices += StorageSlice("Libre", data.freeBytes, scheme.surfaceVariant)
    return slices
}

@Composable
private fun StorageDonut(data: StorageOverview, slices: List<StorageSlice>) {
    val usedSlices = slices.filter { it.label != "Libre" && it.bytes > 0L }
    val usedCategoryTotal = usedSlices.sumOf { it.bytes }.coerceAtLeast(1L)
    val total = data.totalBytes.coerceAtLeast(1L)
    val usedSweep = 360f * (data.usedBytes.toDouble() / total.toDouble()).coerceIn(0.0, 1.0).toFloat()
    val freeColor = slices.firstOrNull { it.label == "Libre" }?.color
        ?: MaterialTheme.colorScheme.surfaceVariant

    Box(modifier = Modifier.size(142.dp), contentAlignment = Alignment.Center) {
        Canvas(Modifier.size(142.dp)) {
            val stroke = Stroke(width = 22.dp.toPx())
            var start = -90f
            usedSlices.forEach { slice ->
                val sweep = usedSweep * (slice.bytes.toDouble() / usedCategoryTotal.toDouble()).toFloat()
                if (sweep > 0f) {
                    drawArc(
                        color = slice.color,
                        startAngle = start,
                        sweepAngle = sweep,
                        useCenter = false,
                        style = stroke
                    )
                    start += sweep
                }
            }
            val freeSweep = (360f - usedSweep).coerceAtLeast(0f)
            if (freeSweep > 0f) {
                drawArc(
                    color = freeColor,
                    startAngle = -90f + usedSweep,
                    sweepAngle = freeSweep,
                    useCenter = false,
                    style = stroke
                )
            }
        }
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            val percent = ((data.usedBytes * 100.0) / total).coerceIn(0.0, 100.0).toInt()
            Text("$percent%", fontSize = 24.sp, fontWeight = FontWeight.Bold)
            Text("usado", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun StorageLegendItem(slice: StorageSlice, modifier: Modifier = Modifier) {
    Row(
        modifier = modifier
            .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f), RoundedCornerShape(13.dp))
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
