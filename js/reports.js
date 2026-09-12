/* --- Reports --- */
function attendanceReportData(range){
  const students = [...getActiveStudents()].sort((a,b)=>(a.listNo||999)-(b.listNo||999));
  const dates = attendanceRegisteredDates(db.group.attendance,range);
  const general = students.map(s=>{
    const row = {LISTA:s.listNo,NOMBRE:s.name};
    dates.forEach(d=>row[d]=(db.group.attendance[d]||[]).some(r=>String(r.studentId)===String(s.id))?1:0);
    row.ASISTENCIAS = dates.reduce((acc,d)=>acc+(row[d]||0),0);
    row.FALTAS = dates.length - row.ASISTENCIAS;
    row.PORCENTAJE = dates.length ? `${Math.round((row.ASISTENCIAS/dates.length)*100)}%` : '0%';
    return row;
  });
  const faltas = [...general].map(r=>({LISTA:r.LISTA,NOMBRE:r.NOMBRE,FALTAS:r.FALTAS,ASISTENCIAS:r.ASISTENCIAS,PORCENTAJE:r.PORCENTAJE}));
  const orden = [...faltas].sort((a,b)=>b.FALTAS-a.FALTAS||a.NOMBRE.localeCompare(b.NOMBRE));
  const activeIds=new Set(students.map(s=>String(s.id)));
  const base = dates.map(d=>{ const pres=new Set((db.group.attendance[d]||[]).map(r=>String(r.studentId)).filter(id=>activeIds.has(id))).size; return {FECHA:d,ASISTENCIAS:pres,FALTAS:Math.max(students.length-pres,0),TOTAL:students.length}; });
  return {general,faltas,orden,base};
}
function worksReportData(range){
  const works = db.group.works.filter(w=>(!range.start||w.date>=range.start)&&(!range.end||w.date<=range.end));
  const records=works.map(w=>{
    const student=findStudent(w.studentId);
    return {studentKey:String(w.studentId||`${w.listNo}__${normalizeStudentNameForMatch(w.studentName)}`),workKey:String(w.key||`${w.date}__${w.campo}__${w.asignatura}__${w.title}`),FECHA:w.date,LISTA:student?.listNo??w.listNo,ALUMNO:student?.name||w.studentName,CAMPO_FORMATIVO:w.campo,ASIGNATURA:w.asignatura,TRABAJO:w.title,PUNTAJE:Number(w.score),HORA:w.time};
  });
  const detalle = records.map(({studentKey,workKey,...row})=>row);
  const base = [...detalle].sort((a,b)=>a.FECHA.localeCompare(b.FECHA)||a.ASIGNATURA.localeCompare(b.ASIGNATURA)||a.LISTA-b.LISTA);
  const studentsById = new Map();
  records.forEach(d=>{
    let item = studentsById.get(d.studentKey);
    if(!item){ item = {LISTA:d.LISTA,ALUMNO:d.ALUMNO,TOTAL_PUNTOS:0,REGISTROS:0,PROMEDIO:0}; studentsById.set(d.studentKey,item); }
    item.TOTAL_PUNTOS += Number(d.PUNTAJE||0);
    item.REGISTROS += 1;
    item.PROMEDIO = (item.TOTAL_PUNTOS/item.REGISTROS).toFixed(2);
  });
  const worksByKey = new Map();
  records.forEach(d=>{
    let item = worksByKey.get(d.workKey);
    if(!item){ item = {FECHA:d.FECHA,TRABAJO:d.TRABAJO,CAMPO_FORMATIVO:d.CAMPO_FORMATIVO,ASIGNATURA:d.ASIGNATURA,EXCELENTE:0,COMPLETO:0,INCOMPLETO:0,NO_ENTREGADO:0,PROMEDIO:0,_sum:0,_n:0}; worksByKey.set(d.workKey,item); }
    if(d.PUNTAJE===3)item.EXCELENTE++; else if(d.PUNTAJE===2)item.COMPLETO++; else if(d.PUNTAJE===1)item.INCOMPLETO++; else item.NO_ENTREGADO++;
    item._sum += Number(d.PUNTAJE||0);
    item._n += 1;
    item.PROMEDIO = (item._sum/item._n).toFixed(2);
  });
  const resumenAlumnos=[...studentsById.values()].sort((a,b)=>Number(a.LISTA)-Number(b.LISTA)||String(a.ALUMNO).localeCompare(String(b.ALUMNO)));
  const limpio = [...worksByKey.values()].map(({_sum,_n,...r})=>r).sort((a,b)=>String(a.FECHA).localeCompare(String(b.FECHA))||String(a.TRABAJO).localeCompare(String(b.TRABAJO)));
  return {detalle,base,resumenAlumnos,resumenTrabajos:limpio};
}

function monthDateRange(month=''){
  const match=/^(\d{4})-(\d{2})$/.exec(String(month));
  if(!match) return {start:'',end:''};
  const year=Number(match[1]),monthNumber=Number(match[2]);
  if(monthNumber<1||monthNumber>12) return {start:'',end:''};
  const lastDay=new Date(year,monthNumber,0).getDate();
  return {start:`${match[1]}-${match[2]}-01`,end:`${match[1]}-${match[2]}-${String(lastDay).padStart(2,'0')}`};
}


// CDN GUARD: verificar XLSX antes de exportar
function checkXLSX(){
  if(typeof XLSX === 'undefined'){
    toast('No se pudo cargar el componente local de Excel. Recarga la aplicación.');
    return false;
  }
  return true;
}
function styleSheet(ws){
  if(!ws['!ref']) return;
  const range = XLSX.utils.decode_range(ws['!ref']);
  ws['!cols'] = [];
  for(let C=range.s.c; C<=range.e.c; C++) ws['!cols'].push({wch:16});
  for(let C=range.s.c; C<=range.e.c; C++){
    const cell = XLSX.utils.encode_cell({r:0,c:C});
    if(ws[cell]){
      ws[cell].s = {
        font:{bold:true,color:{rgb:'FFFFFF'}},
        fill:{fgColor:{rgb:'1E3A8A'}},
        alignment:{horizontal:'center',vertical:'center'},
        border:{
          top:{style:'thin',color:{rgb:'D1D5DB'}},
          bottom:{style:'thin',color:{rgb:'D1D5DB'}},
          left:{style:'thin',color:{rgb:'D1D5DB'}},
          right:{style:'thin',color:{rgb:'D1D5DB'}}
        }
      };
    }
  }
  for(let R=1; R<=range.e.r; R++){
    for(let C=range.s.c; C<=range.e.c; C++){
      const cell = XLSX.utils.encode_cell({r:R,c:C});
      if(ws[cell]){
        ws[cell].s = {
          alignment:{vertical:'center'},
          border:{
            top:{style:'thin',color:{rgb:'E5E7EB'}},
            bottom:{style:'thin',color:{rgb:'E5E7EB'}},
            left:{style:'thin',color:{rgb:'E5E7EB'}},
            right:{style:'thin',color:{rgb:'E5E7EB'}}
          }
        };
      }
    }
  }
  ws['!autofilter'] = {ref: ws['!ref']};
}

let reportsTab = 'internal';

function renderReports(){
  return `
  <div class="card">
    <div class="tabs">
      <button class="tab ${reportsTab==='internal'?'active':''}" data-reports-tab="internal">Resumen General</button>
      <button class="tab ${reportsTab==='attendance'?'active':''}" data-reports-tab="attendance">Asistencia</button>
      <button class="tab ${reportsTab==='works'?'active':''}" data-reports-tab="works">Trabajos</button>
      <button class="tab ${reportsTab==='bitacora'?'active':''}" data-reports-tab="bitacora">Bitácora</button>
    </div>
  </div>
  <div id="reports-content">${renderReportsContent()}</div>`;
}
function renderReportsContent(){
  if(reportsTab==='internal') return renderInternalReports();
  if(reportsTab==='bitacora') return renderBitacoraReportExport();
  if(reportsTab==='attendance'){
    return `
    <div class="card">
      <div class="section-title">Reporte de asistencia</div>
      <div class="row">
        <div><div class="small">Desde</div><input type="date" id="att-r-from"></div>
        <div><div class="small">Hasta</div><input type="date" id="att-r-to"></div>
        <div><div class="small">O generar por mes</div><input type="month" id="att-r-month"></div>
        <button class="btn primary" id="att-export-btn">Exportar reporte de asistencia</button>
        <div class="help">Incluye faltas, concentrado general por día, orden por más faltas y base lista para gráficas.</div>
      </div>
    </div>`;
  }
  return `
  <div class="card">
    <div class="section-title">Reporte de trabajos</div>
    <div class="row">
      <div><div class="small">Desde</div><input type="date" id="works-r-from"></div>
      <div><div class="small">Hasta</div><input type="date" id="works-r-to"></div>
      <div><div class="small">O generar por mes</div><input type="month" id="works-r-month"></div>
      <button class="btn primary" id="works-export-btn">Exportar reporte de trabajos</button>
      <div class="help">Incluye seguimiento detallado, base ordenada, resumen por alumno y resumen por trabajo.</div>
    </div>
  </div>`;
}
function renderInternalReports(){
  const students = [...getActiveStudents()].sort((a,b)=>(a.listNo||999)-(b.listNo||999));
  const attDates = attendanceRegisteredDates();
  const activeIds=new Set(students.map(s=>String(s.id)));
  const todayAtt = new Set((db.group.attendance[today()]||[]).map(r=>String(r.studentId)).filter(id=>activeIds.has(id))).size;
  return `
  <div class="card">
    <div class="section-title">Resumen General</div>
    <div class="report-grid">
      <div>
        <div class="small">Selecciona un alumno</div>
        <select id="internal-student-select">
          <option value="">Seleccionar alumno</option>
          ${students.map(s=>`<option value="${esc(s.id)}">Lista ${esc(s.listNo)} · ${esc(s.name)}</option>`).join('')}
        </select>
        <div id="internal-student-card" class="help">Aquí podrás ver cuántas faltas y trabajos tiene un alumno en específico.</div>
      </div>
      <div>
        <div class="row row2">
          <div class="kpi"><span class="small">Alumnos</span><strong>${students.length}</strong></div>
          <div class="kpi"><span class="small">Días con pase</span><strong>${attDates.length}</strong></div>
          <div class="kpi"><span class="small">Asistencias hoy</span><strong>${todayAtt}</strong></div>
          <div class="kpi"><span class="small">Faltas hoy</span><strong>${Math.max(students.length-todayAtt,0)}</strong></div>
        </div>
      </div>
    </div>
  </div>
  <div class="report-grid">
    <div class="chart-wrap"><canvas id="att-chart" height="220"></canvas></div>
    <div class="chart-wrap"><canvas id="works-chart" height="220"></canvas></div>
  </div>`;
}
function bindReports(){
  document.querySelectorAll('[data-reports-tab]').forEach(btn=>btn.onclick = async () => {
    destroyCharts();
    reportsTab = btn.dataset.reportsTab;
    renderCurrentScreen();
  });

  if(reportsTab === 'internal'){
    const sel = document.getElementById('internal-student-select');
    if(sel) sel.onchange = () => {
      const s = db.group.students.find(x=>String(x.id)===String(sel.value));
      const card = document.getElementById('internal-student-card');
      if(!s){
        card.className='help';
        card.innerHTML='Aquí podrás ver cuántas faltas y trabajos tiene un alumno en específico.';
        return;
      }
      const registeredDates=attendanceRegisteredDates();
      const uniqueDates = registeredDates.filter(date=>(db.group.attendance[date]||[]).some(r=>String(r.studentId)===String(s.id)));
      const totalDays = registeredDates.length;
      const works = db.group.works.filter(w=>String(w.studentId)===String(s.id));
      const bitas = (db.group.bitacoraReports||[]).filter(r=>(r.studentIds||[]).some(id=>String(id)===String(s.id)));
      const totalPoints = works.reduce((a,b)=>a+Number(b.score||0),0);
      card.className='';
      card.innerHTML = `
      <div style="margin-top:12px">
        <div class="kpi"><div class="item-title">${esc(s.name)}</div><div class="small">Lista ${s.listNo} · ${esc(s.qr)}</div></div>
        <div class="row row2" style="margin-top:10px">
          <div class="kpi"><span class="small">Faltas</span><strong>${Math.max(totalDays-uniqueDates.length,0)}</strong></div>
          <div class="kpi"><span class="small">Asistencias</span><strong>${uniqueDates.length}</strong></div>
          <div class="kpi"><span class="small">% asistencia</span><strong>${totalDays?Math.round((uniqueDates.length/totalDays)*100):0}%</strong></div>
          <div class="kpi"><span class="small">Trabajos</span><strong>${works.length}</strong></div>
          <div class="kpi"><span class="small">Puntos</span><strong>${totalPoints}</strong></div>
          <div class="kpi"><span class="small">Promedio</span><strong>${works.length?(totalPoints/works.length).toFixed(2):'0.00'}</strong></div>
          <div class="kpi"><span class="small">Reportes bitácora</span><strong>${bitas.length}</strong></div>
        </div>
      </div>`;
    };
    mountCharts();
  }

  if(reportsTab === 'bitacora'){ bindBitacoraReportExport(); }

  if(reportsTab === 'attendance'){
    document.getElementById('att-export-btn').onclick = () => {
      if(!checkXLSX()) return;
      const month = document.getElementById('att-r-month').value;
      let start = document.getElementById('att-r-from').value;
      let end = document.getElementById('att-r-to').value;
      if(month){
        ({start,end}=monthDateRange(month));
      }
      const data = attendanceReportData({start,end});
      const wb = XLSX.utils.book_new();
      const ws1 = XLSX.utils.json_to_sheet(data.faltas);
      const ws2 = XLSX.utils.json_to_sheet(data.general);
      const ws3 = XLSX.utils.json_to_sheet(data.orden);
      const ws4 = XLSX.utils.json_to_sheet(data.base);
      styleSheet(ws1); styleSheet(ws2); styleSheet(ws3); styleSheet(ws4);
      XLSX.utils.book_append_sheet(wb,ws1,'REPORTE FALTAS');
      XLSX.utils.book_append_sheet(wb,ws2,'CONCENTRADO GENERAL');
      XLSX.utils.book_append_sheet(wb,ws3,'ORDEN FALTAS');
      XLSX.utils.book_append_sheet(wb,ws4,'BASE GRAFICAS');
      XLSX.writeFile(wb,safeFileName(`ProfeQr_Asistencia_${db.config.group}_${month||'reporte'}.xlsx`));
      toast('Reporte de asistencia exportado');
    };
  }

  if(reportsTab === 'works'){
    document.getElementById('works-export-btn').onclick = () => {
      if(!checkXLSX()) return;
      const month = document.getElementById('works-r-month').value;
      let start = document.getElementById('works-r-from').value;
      let end = document.getElementById('works-r-to').value;
      if(month){
        ({start,end}=monthDateRange(month));
      }
      const data = worksReportData({start,end});
      const wb = XLSX.utils.book_new();
      const ws1 = XLSX.utils.json_to_sheet(data.detalle);
      const ws2 = XLSX.utils.json_to_sheet(data.base);
      const ws3 = XLSX.utils.json_to_sheet(data.resumenAlumnos);
      const ws4 = XLSX.utils.json_to_sheet(data.resumenTrabajos);
      styleSheet(ws1); styleSheet(ws2); styleSheet(ws3); styleSheet(ws4);
      XLSX.utils.book_append_sheet(wb,ws1,'SEGUIMIENTO TRABAJOS');
      XLSX.utils.book_append_sheet(wb,ws2,'BASE ORDENADA');
      XLSX.utils.book_append_sheet(wb,ws3,'RESUMEN POR ALUMNO');
      XLSX.utils.book_append_sheet(wb,ws4,'RESUMEN POR TRABAJO');
      XLSX.writeFile(wb,safeFileName(`ProfeQr_Trabajos_${db.config.group}_${month||'reporte'}.xlsx`));
      toast('Reporte de trabajos exportado');
    };
  }
}
function mountCharts(){
  const attCanvas = document.getElementById('att-chart');
  const worksCanvas = document.getElementById('works-chart');
  if(attCanvas){
    const dates = attendanceRegisteredDates();
    const activeIds=new Set(getActiveStudents().map(s=>String(s.id)));
    const values = dates.map(d=>new Set((db.group.attendance[d]||[]).map(r=>String(r.studentId)).filter(id=>activeIds.has(id))).size);
    if(attChart) attChart.destroy();
    attChart = new Chart(attCanvas, {
      type:'bar',
      data:{labels:dates.length?dates:['Sin datos'], datasets:[{label:'Asistencias por día', data:values.length?values:[0], backgroundColor:'#2563EB'}]},
      options:{responsive:true, plugins:{legend:{display:false}}}
    });
  }
  if(worksCanvas){
    const rows = db.group.works;
    const counts = [rows.filter(r=>r.score===3).length, rows.filter(r=>r.score===2).length, rows.filter(r=>r.score===1).length, rows.filter(r=>r.score===0).length];
    if(worksChart) worksChart.destroy();
    worksChart = new Chart(worksCanvas, {
      type:'doughnut',
      data:{
        labels:['Excelente','Completo','Incompleto','No entregado'],
        datasets:[{data:counts, backgroundColor:[LOGROS[3].color,LOGROS[2].color,LOGROS[1].color,LOGROS[0].color]}]
      },
      options:{responsive:true}
    });
  }
}
