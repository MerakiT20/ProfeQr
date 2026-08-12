/* --- Attendance --- */
let attendanceDate = today();
let attendanceTab = 'scan';

function renderAttendance(){
  const students = [...getActiveStudents()].sort((a,b)=>(a.listNo||999)-(b.listNo||999));
  const rows = db.group.attendance[attendanceDate] || [];
  const presentIds = new Set(rows.map(r=>r.studentId));
  const absent = students.filter(s=>!presentIds.has(s.id));

  return `
  <div class="card">
    <div class="small">Fecha de registro</div>
    <input id="att-date" type="date" value="${attendanceDate}">
  </div>
  <div class="stats">
    <div class="stat"><div class="stat-num" style="color:var(--ok)" id="att-count-present">${rows.length}</div><div class="stat-label">Asistencias</div></div>
    <div class="stat"><div class="stat-num" style="color:var(--bad)" id="att-count-absent">${absent.length}</div><div class="stat-label">Faltas</div></div>
    <div class="stat"><div class="stat-num" style="color:var(--primary3)" id="att-count-total">${students.length}</div><div class="stat-label">Total</div></div>
  </div>
  <div class="card no-print">
    <div class="row row2">
      <button class="btn primary" id="att-register-all" ${isExpired()?'disabled':''}>Registrar todos</button>
      <button class="btn bad" id="att-clear-all" ${isExpired()?'disabled':''}>Borrar todos</button>
    </div>
  </div>
  <div class="card">
    <div class="tabs">
      <button class="tab ${attendanceTab==='scan'?'active':''}" data-att-tab="scan">Escanear QR</button>
      <button class="tab ${attendanceTab==='manual'?'active':''}" data-att-tab="manual">Manual</button>
      <button class="tab ${attendanceTab==='summary'?'active':''}" data-att-tab="summary">Resumen</button>
    </div>
  </div>
  <div id="attendance-content">${renderAttendanceContent()}</div>`;
}
function renderAttContent(){ return renderAttendanceContent(); }
function renderAttendanceContent(){
  const students = [...getActiveStudents()].sort((a,b)=>(a.listNo||999)-(b.listNo||999));
  const rows = db.group.attendance[attendanceDate] || [];
  const presentIds = new Set(rows.map(r=>r.studentId));
  const absent = students.filter(s=>!presentIds.has(s.id));

  if(attendanceTab==='scan'){
    const history = rows.map(r=>({label:r.studentName, meta:r.time}));
    return `
    <div class="card scanner-panel">
      <div class="row row2">
        <button class="btn ok" id="att-scanner-start" ${isExpired()?'disabled':''}>📷 Encender cámara</button>
        <button class="btn bad" id="att-scanner-stop">⏹ Detener cámara</button>
      </div>
      <div style="margin-top:10px" class="badge primary" id="att-status">Cámara apagada</div>
      <div class="scan-student">
        <div class="label">Último alumno leído</div>
        <div class="name" id="att-last-student">Esperando lectura...</div>
      </div>
      <div style="margin-top:10px"><div id="qr-reader"></div></div>
      <hr style="border:none;border-top:1px solid var(--line);margin:10px 0">
      <div class="item-title" style="margin-bottom:8px">Últimos registros</div>
      <div id="att-history">
        ${history.length ? history.slice(0,8).map(h=>`<div class="item"><div><div class="item-title">${esc(h.label)}</div><div class="item-sub">${esc(h.meta)}</div></div></div>`).join('') : '<div class="small">Sin registros todavía.</div>'}
      </div>
    </div>`;
  }

  if(attendanceTab==='manual'){
    return `<div class="card">
      <div class="section-title">Registro manual</div>
      ${students.map(s=>`
        <div class="item">
          <div><div class="item-title" style="cursor:pointer" onclick="openStudentProfile('${s.id}')">${esc(s.name)} ›</div><div class="item-sub">Lista ${s.listNo} · ${esc(s.qr)}</div></div>
          <button class="mini" data-toggle-att="${s.id}" style="background:${presentIds.has(s.id)?'#FEE2E2':'var(--soft)'};color:${presentIds.has(s.id)?'var(--bad)':'var(--primary2)'}" ${isExpired()?'disabled':''}>${presentIds.has(s.id)?'Marcar falta':'Registrar'}</button>
        </div>`).join('')}
    </div>`;
  }

  return `<div class="card">
    <div class="section-title">Resumen del día</div>
    <div class="badge ok">Presentes (${rows.length})</div>
    <div style="margin-top:10px">${rows.map(r=>`<div class="item"><div><div class="item-title">${esc(r.studentName)}</div><div class="item-sub">${esc(r.time)}</div></div></div>`).join('') || '<div class="small">Sin registros.</div>'}</div>
    <hr style="border:none;border-top:1px solid var(--line);margin:10px 0">
    <div class="badge bad">Ausentes (${absent.length})</div>
    <div style="margin-top:10px">${absent.map(s=>`<div class="item"><div class="item-title">${esc(s.name)}</div></div>`).join('') || '<div class="small">Sin ausentes.</div>'}</div>
  </div>`;
}
function bindAttendance(){
  document.getElementById('att-date').onchange = async e => {
    await attendanceScanner.stop();
    attendanceDate = e.target.value;
    renderCurrentScreen();
  };
  document.querySelectorAll('[data-att-tab]').forEach(btn=>btn.onclick = async () => {
    await attendanceScanner.stop();
    attendanceTab = btn.dataset.attTab;
    renderCurrentScreen();
  });
  document.getElementById('att-register-all').onclick = () => {
    if(!canWrite()) return writeBlockedMessage();
    const rows = db.group.attendance[attendanceDate] || [];
    const existingIds = new Set(rows.map(r=>r.studentId));
    const extra = getActiveStudents().filter(s=>!existingIds.has(s.id)).map(s=>({id:uid(),date:attendanceDate,time:nowTime(),studentId:s.id,studentName:s.name,listNo:s.listNo,source:'TODOS'}));
    db.group.attendance[attendanceDate] = [...extra, ...rows];
    if(!saveDb()) return;
    toast(`Se registraron ${extra.length}`);
    renderCurrentScreen();
  };
  document.getElementById('att-clear-all').onclick = () => {
    if(!canWrite()) return writeBlockedMessage();
    if(!confirm('¿Borrar todos los registros de esta fecha?')) return;
    const clearedDate = attendanceDate;
    const backup = db.group.attendance[clearedDate] ? [...db.group.attendance[clearedDate]] : [];
    db.group.attendance[clearedDate] = [];
    if(!saveDb()){
      db.group.attendance[clearedDate] = backup;
      return;
    }
    const toastEl = document.getElementById('toast');
    if(toastEl){
      toastEl.innerHTML = 'Registros borrados &nbsp;<button id="undo-clear" style="background:#fff;color:#111;border:none;border-radius:8px;padding:2px 8px;font-weight:800;cursor:pointer">Deshacer</button>';
      toastEl.classList.remove('hidden');
      clearTimeout(window.__toastTimer);
      const undoBtn = document.getElementById('undo-clear');
      if(undoBtn) undoBtn.onclick = () => {
        db.group.attendance[clearedDate] = backup;
        if(saveDb()){
          toast('Restaurado ✓');
          if(attendanceDate === clearedDate) renderCurrentScreen();
        }
      };
      window.__toastTimer = setTimeout(()=>{ toastEl.classList.add('hidden'); toastEl.innerHTML=''; }, 8000);
    }
    renderCurrentScreen();
  };
  document.querySelectorAll('[data-toggle-att]').forEach(btn=>btn.onclick = () => {
    if(!canWrite()) return writeBlockedMessage();
    const id = btn.dataset.toggleAtt;
    const rows = db.group.attendance[attendanceDate] || [];
    if(rows.some(r=>r.studentId===id)){
      db.group.attendance[attendanceDate] = rows.filter(r=>r.studentId!==id);
      toast('Se marcó falta');
    }else{
      const s = db.group.students.find(x=>x.id===id);
      rows.unshift({id:uid(),date:attendanceDate,time:nowTime(),studentId:s.id,studentName:s.name,listNo:s.listNo,source:'MANUAL'});
      db.group.attendance[attendanceDate] = rows;
      toast(`Registrado: ${s.name}`);
    }
    saveDb();
    renderCurrentScreen();
  });
  const start = document.getElementById('att-scanner-start');
  const stop = document.getElementById('att-scanner-stop');
  if(start) start.onclick = () => attendanceScanner.start({
    containerId:'qr-reader',
    statusEl:document.getElementById('att-status'),
    lastNameEl:document.getElementById('att-last-student'),
    historyEl:document.getElementById('att-history'),
    onDecoded: handleAttendanceScan
  });
  if(stop) stop.onclick = () => attendanceScanner.stop();
}
function handleAttendanceScan(code){
  if(!canWrite()) return {valid:false,status:'Captura bloqueada',name:'Licencia vencida'};
  const s = getActiveStudents().find(x=>x.qr===code);
  if(!s) return {valid:false,status:'QR inválido',name:'Código no reconocido'};
  const rows = db.group.attendance[attendanceDate] || [];
  if(rows.some(r=>r.studentId===s.id)){
    return {
      valid:true,status:'Duplicado',statusType:'bad',name:s.name,
      history: rows.map(r=>({label:r.studentName, meta:r.time})),
      counters:{
        'att-count-present': rows.length,
        'att-count-absent': Math.max(getActiveStudents().length - rows.length, 0),
        'att-count-total': getActiveStudents().length
      }
    };
  }
  rows.unshift({id:uid(),date:attendanceDate,time:nowTime(),studentId:s.id,studentName:s.name,listNo:s.listNo,source:'QR'});
  db.group.attendance[attendanceDate] = rows;
  if(!saveDb()) return {valid:false,status:'Sin espacio para guardar',name:s.name};
  return {
    valid:true,status:'Registrado',statusType:'ok',name:s.name,
    history: rows.map(r=>({label:r.studentName, meta:r.time})),
    counters:{
      'att-count-present': rows.length,
      'att-count-absent': Math.max(getActiveStudents().length - rows.length, 0),
      'att-count-total': getActiveStudents().length
    }
  };
}

