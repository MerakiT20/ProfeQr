// ── DOC VIEWER & STUDENT PROFILE — stubs conectados ────────────
// docViewer: redirige a Biblioteca (es donde viven los documentos)
let docViewerCategory = '';
function openDocViewer(category){
  docViewerCategory = category||'';
  librarySectionFilter = category||'Todas';
  currentScreen = 'biblioteca';
  renderCurrentScreen();
}
function renderDocViewer(){
  // Stub: redirige automáticamente a biblioteca
  openDocViewer(docViewerCategory);
  return '<div class="card"><div class="small">Redirigiendo a Biblioteca...</div></div>';
}
function bindDocViewer(){}

// studentProfile: perfil de alumno con datos reales del DB
let studentProfileId = '';
function openStudentProfile(sid){
  studentProfileId = sid||'';
  currentScreen = 'studentProfile';
  renderCurrentScreen();
}
function renderStudentProfile(){
  const s = db.group.students.find(x=>x.id===studentProfileId);
  if(!s){
    return '<div class="card"><div class="section-title">Perfil de alumno</div>' +
           '<div class="small">Alumno no encontrado.</div>' +
           '<button class="btn secondary" style="margin-top:10px" onclick="currentScreen=\'students\';renderCurrentScreen()">Volver a alumnos</button></div>';
  }
  const attRows = Object.values(db.group.attendance||{}).flat().filter(r=>r.studentId===s.id);
  const uDates  = [...new Set(attRows.map(r=>r.date))];
  const totalD  = Object.keys(db.group.attendance||{}).length;
  const faltas  = Math.max(totalD - uDates.length, 0);
  const pct     = totalD>0 ? Math.round((uDates.length/totalD)*100) : 0;
  const works   = (db.group.works||[]).filter(w=>w.studentId===s.id);
  const pts     = works.reduce((a,b)=>a+Number(b.score||0),0);
  const prom    = works.length ? (pts/works.length).toFixed(2) : '—';
  const reps    = (db.group.bitacoraReports||[]).filter(r=>r.alumno_id===s.id||(r.studentIds||[]).includes(s.id));
  const openInc = reps.filter(r=>buildReportStatus(normalizeBitacoraReport(r))!=='cerrado').length;
  let html = '<div class="card">';
  html += '<div class="section-title">' + esc(s.name) + '</div>';
  html += '<div class="small">Lista ' + (s.listNo||'—') + ' &nbsp;·&nbsp; ' + esc(s.qr||'—') + ' &nbsp;·&nbsp; ' + (s.active===false?'Suspendido':'Activo') + '</div>';
  html += '<div class="row row2" style="margin-top:14px">';
  html += '<div class="kpi"><span class="small">Asistencias</span><strong>' + uDates.length + '</strong></div>';
  html += '<div class="kpi"><span class="small">Faltas</span><strong style="color:var(--bad)">' + faltas + '</strong></div>';
  html += '<div class="kpi"><span class="small">% Asistencia</span><strong>' + pct + '%</strong></div>';
  html += '<div class="kpi"><span class="small">Trabajos</span><strong>' + works.length + '</strong></div>';
  html += '<div class="kpi"><span class="small">Promedio</span><strong>' + prom + '</strong></div>';
  html += '<div class="kpi"><span class="small">Incidencias</span><strong style="color:' + (openInc>0?'var(--warn)':'var(--text)') + '">' + reps.length + '</strong></div>';
  html += '</div>';
  if(reps.length>0){
    html += '<div style="margin-top:12px"><div class="small" style="font-weight:700;margin-bottom:6px">INCIDENCIAS REGISTRADAS</div>';
    reps.forEach(function(r){
      html += '<div class="item"><div><div class="item-title">' + esc(r.folio||'—') + ' &mdash; Ruta ' + esc(r.type||r.ruta||'?') + '</div>';
      html += '<div class="item-sub">' + esc(r.fecha||r.date||'—') + '</div></div></div>';
    });
    html += '</div>';
  }
  html += '<div class="row row2" style="margin-top:14px">';
  html += '<button class="btn secondary" onclick="currentScreen=\'students\';renderCurrentScreen()">&#8592; Volver</button>';
  html += '<button class="btn secondary" onclick="currentScreen=\'attendance\';renderCurrentScreen()">Ver asistencia</button>';
  html += '</div>';
  html += '</div>';
  return html;
}
function bindStudentProfile(){}

function renderCurrentScreen(){
  const host = document.getElementById('screen-host');
  let html = '';
  if(isExpired()){
    html += `<div class="expired-banner">${esc(licenseRuntime?.message || 'Activación requerida. Puedes consultar y exportar, pero no modificar datos.')}</div>`;
  }
  if(currentScreen==='home') html += renderHome();
  if(currentScreen==='agenda') html += renderAgenda();
  if(currentScreen==='cte') html += renderCteAgreements();
  if(currentScreen==='guardias') html += renderGuardCommissions();
  if(currentScreen==='biblioteca') html += renderLibrary();
  if(currentScreen==='students') html += renderStudents();
  if(currentScreen==='attendance') html += renderAttendance();
  if(currentScreen==='works') html += renderWorks();
  if(currentScreen==='bitacora') html += renderBitacora();
  if(currentScreen==='bitacoraForm') html += renderBitacoraForm();
  if(currentScreen==='bitacoraPreview') html += renderBitacoraPreview();
  if(currentScreen==='cards') html += renderCards();
  if(currentScreen==='reports') html += renderReports();
  if(currentScreen==='settings')      html += renderSettings();
  if(currentScreen==='docViewer')      html += renderDocViewer();
  if(currentScreen==='studentProfile') html += renderStudentProfile();
  host.innerHTML = html;

  if(currentScreen==='home') bindHome();
  if(currentScreen==='agenda') bindAgenda();
  if(currentScreen==='cte') bindCteAgreements();
  if(currentScreen==='guardias') bindGuardCommissions();
  if(currentScreen==='biblioteca') bindLibrary();
  if(currentScreen==='students') bindStudents();
  if(currentScreen==='attendance') bindAttendance();
  if(currentScreen==='works') bindWorks();
  if(currentScreen==='bitacora') bindBitacora();
  if(currentScreen==='bitacoraForm') bindBitacoraForm();
  if(currentScreen==='bitacoraPreview') bindBitacoraPreview();
  if(currentScreen==='cards') bindCards();
  if(currentScreen==='reports') bindReports();
  if(currentScreen==='settings')      bindSettings();
  if(currentScreen==='docViewer')      bindDocViewer();
  if(currentScreen==='studentProfile') bindStudentProfile();
}

function dash11GetStats(){
  const todayRows = db.group.attendance?.[today()]||[];
  const students = getActiveStudents();
  const total = students.length;
  const present = todayRows.length;
  const absent = Math.max(total - present, 0);
  const pct = total>0 ? Math.round((present/total)*100) : 0;
  const works = db.group.works||[];
  const todayKey = today();
  const todayWorks = works.filter(w=>w.date===todayKey);
  const delivered = todayWorks.filter(w=>w.score>=2).length;
  const incomplete = todayWorks.filter(w=>w.score===1).length;
  const pending = todayWorks.filter(w=>w.score===0).length;
  const openInc = (db.group.bitacoraReports||[]).filter(r=>buildReportStatus(normalizeBitacoraReport(r))!=='cerrado').length;
  const highFaltas = students.filter(s=>{
    const allDates=Object.keys(db.group.attendance||{});
    const att=allDates.filter(d=>(db.group.attendance[d]||[]).some(r=>r.studentId===s.id)).length;
    const totalD=allDates.length;
    return totalD>0 && ((totalD-att)/totalD)>0.2;
  }).length;
  const agenda = agendaHomeData();
  return {present,absent,pct,total,delivered,incomplete,pending,openInc,highFaltas,
          agendaOverdue:agenda.overdue.length, agendaToday:agenda.today, agendaNext7:agenda.next7, agendaOverdueItems:agenda.overdue};
}

function renderHome(){
  const S = dash11GetStats();
  const cfg = db.config||{};
  const school = cfg.school||'ProfeQr';
  const group = cfg.group||db.group?.name||'';
  const todayLabel = formatLongDate(today());

  // Módulos grid 3x4
  const grid = [
    {id:'bitacora',  icon:'shield-alert', label:'Incidencias',    sub:'Registra y da seguimiento'},
    {id:'students',  icon:'users',        label:'Alumnos',        sub:'Información y expedientes'},
    {id:'cards',     icon:'qr',           label:'Tarjetas QR',    sub:'Genera y gestiona códigos'},
    {id:'agenda',    icon:'calendar-evt', label:'Agenda',         sub:'Organiza tus actividades'},
    {id:'cte',       icon:'cte',          label:'CTE',            sub:'Consejo Técnico Escolar'},
    {id:'guardias',  icon:'guard',        label:'Guardias',       sub:'Administra turnos y comisiones'},
    {id:'biblioteca',icon:'book',         label:'Biblioteca',     sub:'Recursos y materiales de apoyo'},
    {id:'agenda',    icon:'clock',        label:'Horario',        sub:'Busca en tu agenda'},
    {id:'agenda',    icon:'calendar-all', label:'Calendario',     sub:'Fechas clave y eventos'},
    {id:'guardias',  icon:'star-guard',   label:'Rol de guardias',sub:'Consulta el rol de guardias'},
    {id:'biblioteca',icon:'folder',       label:'Documentos',     sub:'Recursos y formatos'},
    {id:'settings',  icon:'settings',     label:'Ajustes',        sub:'Preferencias de la aplicación'},
  ];

  function svgIcon(name){
    const icons={
      'shield-alert':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      'users':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
      'qr':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/><line x1="18" y1="14" x2="18" y2="14.01"/><line x1="21" y1="17" x2="21" y2="17.01"/><line x1="18" y1="20" x2="18" y2="20.01"/><line x1="21" y1="14" x2="21" y2="14.01"/></svg>',
      'calendar-evt':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="12" cy="15" r="2"/></svg>',
      'cte':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
      'guard':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
      'book':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
      'clock':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
      'calendar-all':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
      'star-guard':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
      'folder':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
      'settings':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
      'chart':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>',
      'check-list':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
    };
    return `<div class="dash11-svg-icon">${icons[name]||icons['settings']}</div>`;
  }

  const alertasFaltasColor = S.highFaltas>0 ? '#DC2626' : '#059669';
  const alertasIncColor = S.openInc>0 ? '#D97706' : '#059669';

  return `
<div class="dash11-wrap">

  <!-- CONTEXT BAR -->
  <div class="dash11-context">
    <span class="dash11-ctx-icon">🏫</span>
    <span class="dash11-ctx-school">${esc(school)}</span>
    <span class="dash11-ctx-dot">•</span>
    <span class="dash11-ctx-group">${esc(group)}</span>
    <span class="dash11-ctx-dot">•</span>
    <span class="dash11-ctx-today">Hoy</span>
  </div>

  <!-- TOP SUMMARY CARDS -->
  <div class="dash11-top-cards">
    <!-- Asistencia -->
    <div class="dash11-summary-card">
      <div class="dash11-sc-header">
        <span class="dash11-sc-icon">👥</span>
        <span class="dash11-sc-title">Asistencia de hoy</span>
      </div>
      <div class="dash11-sc-row">
        <div class="dash11-sc-num" style="color:#2563EB">${S.present}<span class="dash11-sc-lbl">presentes</span></div>
        <div class="dash11-sc-num" style="color:#DC2626">${S.absent}<span class="dash11-sc-lbl">faltas</span></div>
      </div>
      <div class="dash11-sc-pct">${S.pct}%<span class="dash11-sc-lbl-s"> asistencia</span></div>
    </div>
    <!-- Trabajos -->
    <div class="dash11-summary-card">
      <div class="dash11-sc-header">
        <span class="dash11-sc-icon">💼</span>
        <span class="dash11-sc-title">Trabajos</span>
      </div>
      <div class="dash11-sc-row">
        <div class="dash11-sc-num" style="color:#059669">${S.delivered}<span class="dash11-sc-lbl">entregados</span></div>
        <div class="dash11-sc-num" style="color:#D97706">${S.incomplete}<span class="dash11-sc-lbl">incompletos</span></div>
      </div>
      <div class="dash11-sc-num" style="color:#6B7280;font-size:18px">${S.pending}<span class="dash11-sc-lbl"> pendientes</span></div>
    </div>
    <!-- Alertas -->
    <div class="dash11-summary-card">
      <div class="dash11-sc-header">
        <span class="dash11-sc-icon">🔔</span>
        <span class="dash11-sc-title">Alertas</span>
      </div>
      <div class="dash11-alert-row" data-go="students">
        <span class="dash11-alert-icon" style="color:${alertasFaltasColor}">👤</span>
        <span class="dash11-alert-txt">${S.highFaltas} alumnos<br><small>con faltas</small></span>
        <span class="dash11-alert-arr">›</span>
      </div>
      <div class="dash11-alert-row" data-go="bitacora">
        <span class="dash11-alert-icon" style="color:${alertasIncColor}">⚠️</span>
        <span class="dash11-alert-txt">${S.openInc} incidencia${S.openInc!==1?'s':''}<br><small>abiertas</small></span>
        <span class="dash11-alert-arr">›</span>
      </div>
    </div>
  </div>

  <!-- MAIN ACTION BUTTONS -->
  <div class="dash11-main-btns">
    <button class="dash11-main-btn dash11-main-btn-primary" data-go="attendance">
      <div class="dash11-main-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
      </div>
      <div class="dash11-main-label">Pase de lista</div>
      <div class="dash11-main-sub">Registra asistencia</div>
    </button>
    <button class="dash11-main-btn dash11-main-btn-primary" data-go="works">
      <div class="dash11-main-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
      </div>
      <div class="dash11-main-label">Trabajos</div>
      <div class="dash11-main-sub">Revisa entregas</div>
    </button>
    <button class="dash11-main-btn dash11-main-btn-primary" data-go="reports">
      <div class="dash11-main-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>
      </div>
      <div class="dash11-main-label">Reportes</div>
      <div class="dash11-main-sub">Consulta y genera</div>
    </button>
  </div>

  <!-- MODULE GRID 3x4 -->
  <div class="dash11-grid">
    ${grid.map(m=>`
    <button class="dash11-tile" data-go="${m.id}">
      ${svgIcon(m.icon)}
      <div class="dash11-tile-label">${esc(m.label)}</div>
      <div class="dash11-tile-sub">${esc(m.sub)}</div>
    </button>`).join('')}
  </div>

  <!-- ACCESOS RÁPIDOS -->
  <div class="dash11-section-title">Accesos rápidos</div>
  <div class="dash11-chips-row">
    <button class="dash11-chip" data-go="agenda">🕐 Horario</button>
    <button class="dash11-chip" data-go="agenda">📅 Calendario</button>
    <button class="dash11-chip" data-go="guardias">🛡️ Guardias</button>
    <button class="dash11-chip" data-go="biblioteca">📄 Documentos</button>
  </div>

  <!-- REPORTES RÁPIDOS -->
  <div class="dash11-section-title">Reportes rápidos</div>
  <div class="dash11-report-row">
    <button class="dash11-report-btn" data-go="reports">
      <span class="dash11-report-icon">👥</span>
      <div><div class="dash11-report-title">Grupo</div><div class="dash11-report-sub">Resumen general del grupo</div></div>
      <span class="dash11-report-arr">›</span>
    </button>
    <button class="dash11-report-btn" data-go="reports">
      <span class="dash11-report-icon">👤</span>
      <div><div class="dash11-report-title">Alumno</div><div class="dash11-report-sub">Reporte individual</div></div>
      <span class="dash11-report-arr">›</span>
    </button>
  </div>

  <!-- AGENDA HOY -->
  ${S.agendaToday.length||S.agendaOverdueItems.length?`
  <div class="dash11-section-title">Agenda del día</div>
  <div class="dash11-agenda-mini">
    ${S.agendaOverdueItems.slice(0,2).map(ev=>`<div class="dash11-agenda-item danger">${renderMiniAgendaItem(ev)}</div>`).join('')}
    ${S.agendaToday.slice(0,4).map(ev=>`<div class="dash11-agenda-item">${renderMiniAgendaItem(ev)}</div>`).join('')}
    <button class="dash11-agenda-more" data-go="agenda">Ver agenda completa ›</button>
  </div>`:``}

</div>`;
}

function bindHome(){
  document.querySelectorAll('[data-go]').forEach(btn=>btn.onclick=async()=>{
    await stopDynamicModules(); currentScreen=btn.dataset.go; renderCurrentScreen();
  });
  document.querySelectorAll('[data-quick-event]').forEach(btn=>btn.addEventListener('click',()=>{
    currentScreen='agenda'; agendaTab='form'; agendaEditingId=''; renderCurrentScreen();
  }));
}


