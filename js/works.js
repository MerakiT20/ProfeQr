/* --- Works --- */
let workDate = today();
let workCampo = CAMPOS[0].campo;
let workAsignatura = CAMPOS[0].asignaturas[0];
let workTitle = sessionStorage.getItem('profeqr_workTitle') || '';
let workScoreMode = 2;
let worksTab = 'scan';

function currentWorkKey(){ return `${workDate}__${workCampo}__${workAsignatura}__${workTitle.trim().toLowerCase()}`; }
function currentWorkRows(){ return db.group.works.filter(w=>w.key===currentWorkKey()); }

function saveOrUpdateWork(studentId, score, source='QR'){
  if(!canWrite()) return 'blocked';
  const s = db.group.students.find(x=>x.id===studentId);
  const key = currentWorkKey();
  const existing = db.group.works.find(w=>w.key===key && w.studentId===studentId);
  if(existing){
    existing.score = score;
    existing.time = nowTime();
    existing.source = source;
    if(!saveDb()) return 'blocked';
    toast(`Actualizado: ${s.name}`);
    return 'updated';
  }
  db.group.works.unshift({
    id:uid(),key,date:workDate,campo:workCampo,asignatura:workAsignatura,title:workTitle,
    score,studentId:s.id,studentName:s.name,listNo:s.listNo,time:nowTime(),source
  });
  if(!saveDb()) return 'blocked';
  toast(`Trabajo registrado: ${s.name}`);
  return 'created';
}

function renderWorks(){
  const students = [...getActiveStudents()].sort((a,b)=>(a.listNo||999)-(b.listNo||999));
  const rows = currentWorkRows();
  const counts = {
    3: rows.filter(r=>r.score===3).length,
    2: rows.filter(r=>r.score===2).length,
    1: rows.filter(r=>r.score===1).length,
    0: rows.filter(r=>r.score===0).length + Math.max(students.length - rows.length, 0)
  };
  return `
  <div class="card">
    <div class="section-title">Datos del trabajo</div>
    <div class="row">
      <div><div class="small">Fecha</div><input id="work-date" type="date" value="${workDate}"></div>
      <div><div class="small">Campo formativo</div><select id="work-campo">${CAMPOS.map(c=>`<option value="${c.campo}" ${c.campo===workCampo?'selected':''}>${c.campo}</option>`).join('')}</select></div>
      <div><div class="small">Asignatura</div><select id="work-asignatura">${(CAMPOS.find(c=>c.campo===workCampo)||CAMPOS[0]).asignaturas.map(a=>`<option value="${a}" ${a===workAsignatura?'selected':''}>${a}</option>`).join('')}</select></div>
      <div><div class="small">Nombre del trabajo</div><input id="work-title" value="${esc(workTitle)}" placeholder="Ej. Fracciones equivalentes"></div>
      <div class="small">Modo activo</div>
      <div class="row row3">${[3,2,1].map(v=>`<button class="btn" data-score-mode="${v}" style="background:${workScoreMode===v?LOGROS[v].color:'var(--chip)'};color:${workScoreMode===v?'#fff':'#374151'}">${LOGROS[v].label} (${v})</button>`).join('')}</div>
      <button class="btn warn" id="mark-zero-btn" ${isExpired()?'disabled':''}>Marcar pendientes como 0</button>
      <div class="help">Si dejas vacíos algunos alumnos, este botón les asigna “No entregado”.</div>
    </div>
  </div>
  <div class="stats stats4">
    <div class="stat"><div class="stat-num" style="color:${LOGROS[3].color}" id="works-count-3">${counts[3]}</div><div class="stat-label">${LOGROS[3].label}</div></div>
    <div class="stat"><div class="stat-num" style="color:${LOGROS[2].color}" id="works-count-2">${counts[2]}</div><div class="stat-label">${LOGROS[2].label}</div></div>
    <div class="stat"><div class="stat-num" style="color:${LOGROS[1].color}" id="works-count-1">${counts[1]}</div><div class="stat-label">${LOGROS[1].label}</div></div>
    <div class="stat"><div class="stat-num" style="color:${LOGROS[0].color}" id="works-count-0">${counts[0]}</div><div class="stat-label">${LOGROS[0].label}</div></div>
  </div>
  <div class="card">
    <div class="tabs">
      <button class="tab ${worksTab==='scan'?'active':''}" data-works-tab="scan">Escanear QR</button>
      <button class="tab ${worksTab==='manual'?'active':''}" data-works-tab="manual">Manual</button>
      <button class="tab ${worksTab==='summary'?'active':''}" data-works-tab="summary">Resumen</button>
    </div>
  </div>
  <div id="works-content">${renderWorksContent()}</div>`;
}
function renderWorksContent(){
  const students = [...getActiveStudents()].sort((a,b)=>(a.listNo||999)-(b.listNo||999));
  const rows = currentWorkRows();
  const byStudent = new Map(rows.map(r=>[r.studentId,r]));

  if(worksTab==='scan'){
    const history = rows.map(r=>({label:`${r.studentName} — ${LOGROS[r.score].label}`, meta:r.time}));
    return `
    <div class="card scanner-panel">
      <div class="row row2">
        <button class="btn ok" id="works-scanner-start" ${isExpired()?'disabled':''}>📷 Encender cámara</button>
        <button class="btn bad" id="works-scanner-stop">⏹ Detener cámara</button>
      </div>
      <div style="margin-top:10px" class="badge primary" id="works-status">Cámara apagada</div>
      <div class="scan-student">
        <div class="label">Último alumno leído</div>
        <div class="name" id="works-last-student">Esperando lectura...</div>
      </div>
      <div style="margin-top:10px"><div id="qr-reader-works"></div></div>
      <hr style="border:none;border-top:1px solid var(--line);margin:10px 0">
      <div class="item-title" style="margin-bottom:8px">Últimos registros</div>
      <div id="works-history">
        ${history.length ? history.slice(0,8).map(h=>`<div class="item"><div><div class="item-title">${esc(h.label)}</div><div class="item-sub">${esc(h.meta)}</div></div></div>`).join('') : '<div class="small">Sin registros todavía.</div>'}
      </div>
    </div>`;
  }

  if(worksTab==='manual'){
    return `<div class="card">
      <div class="section-title">Registro manual</div>
      ${students.map(s=>{
        const cur = byStudent.get(s.id);
        return `<div class="item">
          <div><div class="item-title">${esc(s.name)}</div><div class="item-sub">Lista ${s.listNo} · ${esc(s.qr)}${cur?` · Actual: ${LOGROS[cur.score].label}`:''}</div></div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">${[3,2,1,0].map(v=>`<button class="mini" data-manual-work="${s.id}|${v}" style="background:${LOGROS[v].color};color:#fff" ${isExpired()?'disabled':''}>${v}</button>`).join('')}</div>
        </div>`;
      }).join('')}
    </div>`;
  }

  return `<div class="card">
    <div class="section-title">Resumen del trabajo</div>
    ${rows.map(r=>`<div class="item"><div><div class="item-title">${esc(r.studentName)}</div><div class="item-sub">${esc(r.time)}</div></div><span class="badge" style="background:${LOGROS[r.score].color};color:#fff">${LOGROS[r.score].label} (${r.score})</span></div>`).join('') || '<div class="small">Todavía no hay registros.</div>'}
  </div>`;
}
function bindWorks(){
  document.getElementById('work-date').onchange = async e => { await worksScanner.stop(); workDate = e.target.value; renderCurrentScreen(); };
  document.getElementById('work-campo').onchange = async e => { await worksScanner.stop(); workCampo = e.target.value; workAsignatura = (CAMPOS.find(c=>c.campo===workCampo)||CAMPOS[0]).asignaturas[0]; renderCurrentScreen(); };
  document.getElementById('work-asignatura').onchange = async e => { await worksScanner.stop(); workAsignatura = e.target.value; renderCurrentScreen(); };
  document.getElementById('work-title').oninput = e => { workTitle = e.target.value; sessionStorage.setItem('profeqr_workTitle', workTitle); };
  document.querySelectorAll('[data-score-mode]').forEach(btn=>btn.onclick = ()=>{ workScoreMode = Number(btn.dataset.scoreMode); renderCurrentScreen(); });
  document.querySelectorAll('[data-works-tab]').forEach(btn=>btn.onclick = async ()=>{ await worksScanner.stop(); worksTab = btn.dataset.worksTab; renderCurrentScreen(); });
  document.getElementById('mark-zero-btn').onclick = () => {
    if(!canWrite()) return writeBlockedMessage();
    if(!workTitle.trim()) return toast('Primero escribe el nombre del trabajo');
    const key = currentWorkKey();
    const current = db.group.works.filter(w=>w.key===key);
    const currentIds = new Set(current.map(w=>w.studentId));
    const extra = getActiveStudents().filter(s=>!currentIds.has(s.id)).map(s=>({
      id:uid(),key,date:workDate,campo:workCampo,asignatura:workAsignatura,title:workTitle,score:0,studentId:s.id,studentName:s.name,listNo:s.listNo,time:nowTime(),source:'AUTO0'
    }));
    db.group.works = [...extra, ...db.group.works];
    if(!saveDb()) return;
    toast(`Pendientes marcados como 0: ${extra.length}`);
    renderCurrentScreen();
  };
  document.querySelectorAll('[data-manual-work]').forEach(btn=>btn.onclick = () => {
    if(!canWrite()) return writeBlockedMessage();
    if(!workTitle.trim()) return toast('Primero escribe el nombre del trabajo');
    const [sid,score] = btn.dataset.manualWork.split('|');
    saveOrUpdateWork(sid, Number(score), 'MANUAL');
    renderCurrentScreen();
  });
  const start = document.getElementById('works-scanner-start');
  const stop = document.getElementById('works-scanner-stop');
  if(start) start.onclick = () => worksScanner.start({
    containerId:'qr-reader-works',
    statusEl:document.getElementById('works-status'),
    lastNameEl:document.getElementById('works-last-student'),
    historyEl:document.getElementById('works-history'),
    onDecoded: handleWorksScan
  });
  if(stop) stop.onclick = () => worksScanner.stop();
}
function handleWorksScan(code){
  if(!canWrite()) return {valid:false,status:'Captura bloqueada',name:'Licencia vencida'};
  if(!workTitle.trim()) return {valid:false,status:'Falta el nombre del trabajo',name:'Escribe el nombre primero'};
  const s = getActiveStudents().find(x=>x.qr===code);
  if(!s) return {valid:false,status:'QR inválido',name:'Código no reconocido'};
  const result = saveOrUpdateWork(s.id, workScoreMode, 'QR');
  if(result === 'blocked') return {valid:false,status:'Captura bloqueada',name:'Licencia vencida'};
  const rows = currentWorkRows();
  return {
    valid:true,
    status: result === 'updated' ? 'Actualizado' : 'Registrado',
    statusType: result === 'updated' ? 'primary' : 'ok',
    name:s.name,
    history: rows.map(r=>({label:`${r.studentName} — ${LOGROS[r.score].label}`, meta:r.time})),
    counters:{
      'works-count-3': rows.filter(r=>r.score===3).length,
      'works-count-2': rows.filter(r=>r.score===2).length,
      'works-count-1': rows.filter(r=>r.score===1).length,
      'works-count-0': rows.filter(r=>r.score===0).length + Math.max(getActiveStudents().length - rows.length, 0)
    }
  };
}

