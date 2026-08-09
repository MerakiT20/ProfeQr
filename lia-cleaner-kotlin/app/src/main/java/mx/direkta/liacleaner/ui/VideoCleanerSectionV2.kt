package mx.direkta.liacleaner.ui

import android.os.Build
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DeleteOutline
import androidx.compose.material.icons.filled.Movie
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
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun VideoCleanerSectionV2() {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val analyzer = remember { FileCleanerAnalyzer(context.applicationContext) }
    val session by FileScanSession.state.collectAsStateWithLifecycle()
    var hasAccess by remember { mutableStateOf(analyzer.hasBroadFileAccess()) }
    var minSize by remember { mutableStateOf(50L * MB) }
    var minAge by remember { mutableIntStateOf(0) }
    var limit by remember { mutableIntStateOf(30) }
    var pendingFile by remember { mutableStateOf<CleanerFileItem?>(null) }
    var pendingGroup by remember { mutableStateOf<DuplicateFileGroup?>(null) }

    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event -> if (event == Lifecycle.Event.ON_RESUME) hasAccess = analyzer.hasBroadFileAccess() }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    fun scan(force:Boolean=false){
        if(!analyzer.hasBroadFileAccess()){ hasAccess=false; analyzer.openBroadFileAccessSettings(); return }
        if(force) FileScanSession.refresh(analyzer) else FileScanSession.start(analyzer)
    }

    pendingFile?.let{ item -> AlertDialog(onDismissRequest={pendingFile=null},title={Text("¿Eliminar ${item.name}?")},text={Text("Se liberarán ${vBytes(item.sizeBytes)}.")},confirmButton={TextButton(onClick={pendingFile=null;FileScanSession.delete(analyzer,listOf(item),"video")}){Text("Eliminar")}},dismissButton={TextButton(onClick={pendingFile=null}){Text("Cancelar")}}) }
    pendingGroup?.let{ group -> val copies=group.files.filter{it.file.absolutePath!=group.keep.file.absolutePath}; AlertDialog(onDismissRequest={pendingGroup=null},title={Text("Conservar 1 y eliminar ${copies.size} copias")},text={Text("Solo se eliminarán videos con SHA-256 idéntico. Se conservará ${group.keep.name}.")},confirmButton={TextButton(onClick={pendingGroup=null;FileScanSession.delete(analyzer,copies,"video")}){Text("Eliminar copias")}},dismissButton={TextButton(onClick={pendingGroup=null}){Text("Cancelar")}}) }

    Column(verticalArrangement=Arrangement.spacedBy(12.dp)){
        if(!hasAccess && Build.VERSION.SDK_INT>=Build.VERSION_CODES.R){
            Card(shape=RoundedCornerShape(20.dp)){Column(Modifier.padding(16.dp),verticalArrangement=Arrangement.spacedBy(8.dp)){Text("Acceso a videos",fontWeight=FontWeight.Bold);Text("Necesario para analizar videos grandes, antiguos y duplicados.",fontSize=12.sp);Button(analyzer::openBroadFileAccessSettings,Modifier.fillMaxWidth()){Text("Dar acceso")}}}
            return@Column
        }

        Card(shape=RoundedCornerShape(20.dp),colors=CardDefaults.cardColors(containerColor=MaterialTheme.colorScheme.surface)){
            Column(Modifier.fillMaxWidth().padding(16.dp),verticalArrangement=Arrangement.spacedBy(10.dp)){
                Row(verticalAlignment=Alignment.CenterVertically){
                    Box(Modifier.size(42.dp).background(MaterialTheme.colorScheme.tertiary.copy(alpha=.12f),CircleShape),contentAlignment=Alignment.Center){Icon(Icons.Default.Movie,null,tint=MaterialTheme.colorScheme.tertiary)}
                    Column(Modifier.weight(1f).padding(start=12.dp)){
                        Text(if(session.scanning) session.phaseLabel else "Videos",fontWeight=FontWeight.Bold,fontSize=17.sp)
                        Text(if(session.scanning)"Analizando almacenamiento; puedes cambiar de pestaña." else "Grandes, antiguos y duplicados exactos.",fontSize=11.sp,color=MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    if(!session.scanning && !session.deleting)IconButton(onClick={scan(session.result!=null)}){Icon(Icons.Default.Refresh,"Actualizar")}
                }
                if(session.scanning){
                    LinearProgressIndicator(progress={session.progress},modifier=Modifier.fillMaxWidth())
                    Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween){Text(if(session.total>0)"${session.done} / ${session.total}" else "Preparando…",fontSize=11.sp);Text("${(session.progress*100).toInt()}%",fontSize=11.sp,fontWeight=FontWeight.SemiBold)}
                } else Button(onClick={scan(session.result!=null)},enabled=!session.deleting,modifier=Modifier.fillMaxWidth()){Text(if(session.deleting)"Eliminando…" else "Analizar almacenamiento")}
            }
        }

        session.message?.let{Text(it,fontSize=11.sp,color=MaterialTheme.colorScheme.onSurfaceVariant)}

        session.result?.let{result->
            val videos=result.files.filter{it.kind==CleanerFileKind.VIDEO}
            val groups=result.duplicateGroups.filter{g->g.files.all{it.kind==CleanerFileKind.VIDEO}}
            Row(horizontalArrangement=Arrangement.spacedBy(8.dp)){VStat("Videos",videos.size.toString(),Modifier.weight(1f));VStat("Duplicados",groups.size.toString(),Modifier.weight(1f));VStat("Liberable",vBytes(groups.sumOf{it.recoverableBytes}),Modifier.weight(1f))}
            if(groups.isNotEmpty()){
                Text("Duplicados exactos",fontWeight=FontWeight.SemiBold,fontSize=13.sp)
                groups.take(10).forEach{g->Card(shape=RoundedCornerShape(16.dp),colors=CardDefaults.cardColors(containerColor=MaterialTheme.colorScheme.surfaceVariant.copy(alpha=.25f))){Column(Modifier.padding(12.dp),verticalArrangement=Arrangement.spacedBy(5.dp)){Text("${g.files.size} copias · ${vBytes(g.recoverableBytes)} recuperables",fontWeight=FontWeight.SemiBold);Text("Conservar: ${g.keep.name}",fontSize=10.sp,color=MaterialTheme.colorScheme.secondary);OutlinedButton(onClick={pendingGroup=g},modifier=Modifier.fillMaxWidth()){Text("Conservar 1 y eliminar copias")}}}}
            }
            Text("Filtros",fontWeight=FontWeight.SemiBold,fontSize=13.sp)
            LazyRow(horizontalArrangement=Arrangement.spacedBy(7.dp)){listOf(0L to "Todos",50L*MB to ">50 MB",200L*MB to ">200 MB",500L*MB to ">500 MB",1024L*MB to ">1 GB").forEach{(v,l)->item{FilterChip(minSize==v,{minSize=v;limit=30},label={Text(l)})}}}
            LazyRow(horizontalArrangement=Arrangement.spacedBy(7.dp)){listOf(0 to "Cualquiera",30 to ">30 d",90 to ">90 d",180 to ">180 d",365 to ">1 año").forEach{(v,l)->item{FilterChip(minAge==v,{minAge=v;limit=30},label={Text(l)})}}}
            val now=System.currentTimeMillis(); val age=minAge*86400000L
            val filtered=videos.filter{it.sizeBytes>=minSize}.filter{minAge==0||(it.bestDateMs>0&&now-it.bestDateMs>=age)}.sortedByDescending{it.sizeBytes}
            filtered.take(limit).forEach{item->Card(shape=RoundedCornerShape(15.dp),colors=CardDefaults.cardColors(containerColor=MaterialTheme.colorScheme.surface)){Row(Modifier.fillMaxWidth().padding(10.dp),verticalAlignment=Alignment.CenterVertically){Column(Modifier.weight(1f)){Text(item.name,fontWeight=FontWeight.SemiBold,fontSize=13.sp,maxLines=1);Text("${vBytes(item.sizeBytes)} · ${vDate(item.bestDateMs)}",fontSize=10.sp,color=MaterialTheme.colorScheme.onSurfaceVariant)};IconButton(onClick={pendingFile=item}){Icon(Icons.Default.DeleteOutline,"Eliminar")}}}}
            if(limit<filtered.size)OutlinedButton(onClick={limit+=30},modifier=Modifier.fillMaxWidth()){Text("Mostrar 30 más")}
        }
    }
}

@Composable private fun VStat(t:String,v:String,m:Modifier){Box(m.background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha=.35f),RoundedCornerShape(14.dp)).padding(10.dp)){Column{Text(v,fontWeight=FontWeight.Bold,fontSize=15.sp,maxLines=1);Text(t,fontSize=9.sp,color=MaterialTheme.colorScheme.onSurfaceVariant)}}}
private fun vBytes(b:Long):String{if(b<1024)return "$b B";val k=b/1024.0;if(k<1024)return String.format(Locale.getDefault(),"%.0f KB",k);val m=k/1024.0;if(m<1024)return String.format(Locale.getDefault(),"%.1f MB",m);return String.format(Locale.getDefault(),"%.2f GB",m/1024.0)}
private fun vDate(ms:Long)=if(ms<=0)"fecha desconocida" else SimpleDateFormat("dd MMM yyyy",Locale.getDefault()).format(Date(ms))
private const val MB=1024L*1024L
