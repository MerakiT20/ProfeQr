/* --- Centro de Atención del Grupo --- */
function attentionMonthKey(dateStr=today()){ return String(dateStr||today()).slice(0,7); }
function attentionReportDate(r){ return String(r?.date || r?.eventDate || r?.createdAt || '').slice(0,10); }
function attentionFollowUpDate(r){
  const d=r?.data||{};
  return String(r?.followUp?.date || d.a_followup_date || d.b_followup_date || d.c_followup_date || '').slice(0,10);
}
function attentionHasAgreement(r){
  const d=r?.data||{};
  return !!String(d.a_commitments || d.b_commitment || d.c_agreement || '').trim();
}
function buildAttentionCenterData(monthKey=attentionMonthKey()){
  const students=getActiveStudents();
  const monthDates=Object.keys(db.group.attendance||{}).filter(d=>String(d).startsWith(monthKey)).sort();
  const monthWorks=(db.group.works||[]).filter(w=>String(w.date||'').startsWith(monthKey));
  const assignmentKeys=[...new Set(monthWorks.map(w=>w.key).filter(Boolean))];
  const reports=(db.group.bitacoraReports||[]).map(normalizeBitacoraReport);
  const monthReports=reports.filter(r=>attentionReportDate(r).startsWith(monthKey) && buildReportStatus(r)!=='borrador');
  const openReports=reports.filter(r=>buildReportStatus(r)!=='cerrado' && buildReportStatus(r)!=='borrador');
  const todayKey=today();

  const studentsData=students.map(s=>{
    const presentDates=monthDates.filter(d=>(db.group.attendance[d]||[]).some(row=>row.studentId===s.id));
    const absences=Math.max(monthDates.length-presentDates.length,0);
    let pendingWorks=0;
    for(const key of assignmentKeys){
      const row=monthWorks.find(w=>w.key===key && w.studentId===s.id);
      if(!row || Number(row.score)===0) pendingWorks++;
    }
    const incidents=monthReports.filter(r=>(r.studentIds||[]).includes(s.id)).length;
    const studentOpen=openReports.filter(r=>(r.studentIds||[]).includes(s.id));
    const followups=studentOpen.filter(r=>attentionFollowUpDate(r)).length;
    const overdueFollowups=studentOpen.filter(r=>{ const d=attentionFollowUpDate(r); return d && d<todayKey; }).length;
    const overdueAgreements=studentOpen.filter(r=>{ const d=attentionFollowUpDate(r); return attentionHasAgreement(r) && d && d<todayKey; }).length;
    const reasons=[];
    if(absences>=3) reasons.push(`${absences} faltas`);
    if(pendingWorks>=3) reasons.push(`${pendingWorks} trabajos pendientes`);
    if(incidents>=2) reasons.push(`${incidents} incidencias`);
    if(overdueFollowups>0) reasons.push(`${overdueFollowups} seguimiento${overdueFollowups===1?'':'s'} vencido${overdueFollowups===1?'':'s'}`);
    if(overdueAgreements>0) reasons.push(`${overdueAgreements} acuerdo${overdueAgreements===1?'':'s'} vencido${overdueAgreements===1?'':'s'}`);
    let level='none';
    if(absences>=5 || pendingWorks>=5 || overdueFollowups>0 || overdueAgreements>0 || (incidents>=2 && (absences>=3 || pendingWorks>=3))) level='red';
    else if(reasons.length || followups>0) level='yellow';
    return {studentId:s.id,name:s.name,listNo:s.listNo,absences,pendingWorks,incidents,followups,overdueFollowups,overdueAgreements,reasons,level};
  });

  const attention=studentsData.filter(x=>x.level!=='none').sort((a,b)=>{
    const rank={red:2,yellow:1,none:0};
    if(rank[b.level]!==rank[a.level]) return rank[b.level]-rank[a.level];
    const aw=a.absences+a.pendingWorks+a.incidents+a.overdueFollowups*2+a.overdueAgreements*2;
    const bw=b.absences+b.pendingWorks+b.incidents+b.overdueFollowups*2+b.overdueAgreements*2;
    return bw-aw;
  });
  const followupReports=openReports.filter(r=>attentionFollowUpDate(r));
  const overdueAgreementReports=followupReports.filter(r=>attentionHasAgreement(r) && attentionFollowUpDate(r)<todayKey);
  const followupStudents=new Set(followupReports.flatMap(r=>r.studentIds||[]).filter(Boolean));
  return {
    monthKey,
    registeredDays:monthDates.length,
    activeStudents:students.length,
    assignmentCount:assignmentKeys.length,
    attention,
    followupStudentCount:followupStudents.size,
    overdueAgreementCount:overdueAgreementReports.length
  };
}

function renderAttentionCenter(){
  const A=buildAttentionCenterData();
  const monthLabel=new Intl.DateTimeFormat('es-MX',{month:'long',year:'numeric'}).format(new Date(`${A.monthKey}-01T12:00:00`));
  const top=A.attention.slice(0,5);
  const studentRows=top.length ? top.map(x=>{
    const color=x.level==='red'?'var(--bad)':'var(--warn)';
    const marker=x.level==='red'?'🔴':'🟠';
    const detail=x.reasons.length?x.reasons.join(' · '):`${x.followups} seguimiento${x.followups===1?'':'s'} abierto${x.followups===1?'':'s'}`;
    return `<button class="item" data-attention-student="${esc(x.studentId)}" style="width:100%;text-align:left;border:0;background:transparent;cursor:pointer">
      <div><div class="item-title">${marker} ${esc(x.name)}</div><div class="item-sub">${esc(detail)}</div></div>
      <span class="mini" style="color:${color}">Ver ficha →</span>
    </button>`;
  }).join('') : '<div class="small">No hay señales que superen los umbrales actuales. Esto no sustituye la revisión docente.</div>';

  return `<div class="card" id="attention-center">
    <div class="section-title">Centro de Atención del Grupo</div>
    <div class="help">Resumen automático de ${esc(monthLabel)}. Usa datos ya registrados; no genera diagnósticos.</div>
    <div class="stats stats4" style="margin-top:12px">
      <div class="stat"><div class="stat-num">${A.registeredDays}</div><div class="stat-label">Días con asistencia registrada</div></div>
      <div class="stat"><div class="stat-num">${A.activeStudents}</div><div class="stat-label">Alumnos activos</div></div>
      <div class="stat"><div class="stat-num" style="color:var(--warn)">${A.followupStudentCount}</div><div class="stat-label">Alumnos con seguimiento</div></div>
      <div class="stat"><div class="stat-num" style="color:${A.overdueAgreementCount?'var(--bad)':'var(--ok)'}">${A.overdueAgreementCount}</div><div class="stat-label">Acuerdos/compromisos vencidos</div></div>
    </div>
    <div style="margin-top:14px"><div class="small" style="font-weight:800;margin-bottom:6px">NECESITAN ATENCIÓN</div>${studentRows}</div>
    <div class="row row2" style="margin-top:12px">
      <button class="btn secondary" data-attention-open="bitacora">Ver seguimientos</button>
      <button class="btn secondary" data-attention-open="reports">Ver reportes</button>
    </div>
    <div class="help" style="margin-top:10px">Umbrales iniciales: 3 faltas o 3 trabajos pendientes = atención; 5 o más, seguimiento vencido o acuerdo vencido = prioridad. Se calculan sobre días y trabajos registrados en ProfeQr.</div>
  </div>`;
}
function bindAttentionCenter(){
  document.querySelectorAll('[data-attention-student]').forEach(btn=>btn.onclick=()=>openStudentProfile(btn.dataset.attentionStudent));
  document.querySelectorAll('[data-attention-open]').forEach(btn=>btn.onclick=()=>{ currentScreen=btn.dataset.attentionOpen; renderCurrentScreen(); });
}

// Integra el centro al Inicio sin alterar el dashboard existente.
const __renderHomeBeforeAttention=renderHome;
renderHome=function(){ return __renderHomeBeforeAttention()+renderAttentionCenter(); };
const __bindHomeBeforeAttention=bindHome;
bindHome=function(){ __bindHomeBeforeAttention(); bindAttentionCenter(); };
