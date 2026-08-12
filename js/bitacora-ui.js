function bitacoraFilteredReports(){
  let reports=(db.group.bitacoraReports||[]).map(normalizeBitacoraReport).sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''));
  const f=bitacoraFilters||{};
  if(f.student) reports=reports.filter(r=>(r.studentIds||[]).includes(f.student));
  if(f.route) reports=reports.filter(r=>r.type===f.route);
  if(f.status) reports=reports.filter(r=>buildReportStatus(r)===f.status);
  if(f.light) reports=reports.filter(r=>buildReportTrafficLight(r)===f.light);
  if(f.due==='overdue') reports=reports.filter(isBitacoraOverdue);
  if(f.due==='upcoming') reports=reports.filter(r=>{const fu=getBitacoraFollowUpDate(r); return fu && fu>=today() && buildReportStatus(r)!=='cerrado';});
  return reports;
}
function renderBitacoraDashboard(reports){
  const s=bitacoraSummary(reports);
  return `<div class="card"><div class="section-title">Tablero de seguimiento</div>
    <div class="stats stats4 bit-kpis">
      <div class="stat"><div class="stat-num">${s.total}</div><div class="stat-label">Reportes</div></div>
      <div class="stat"><div class="stat-num" style="color:var(--warn)">${s.abiertos}</div><div class="stat-label">Abiertos</div></div>
      <div class="stat"><div class="stat-num" style="color:var(--bad)">${s.rojos}</div><div class="stat-label">Semáforo rojo</div></div>
      <div class="stat"><div class="stat-num" style="color:var(--ok)">${s.cerrados}</div><div class="stat-label">Cerrados</div></div>
      <div class="stat"><div class="stat-num" style="color:var(--bad)">${s.vencidos}</div><div class="stat-label">Vencidos</div></div>
      <div class="stat"><div class="stat-num" style="color:var(--primary3)">${s.proximos}</div><div class="stat-label">Próximos</div></div>
      <div class="stat"><div class="stat-num" style="color:var(--bad)">${s.reincidentes}</div><div class="stat-label">Alumnos reincidentes</div></div>
      <div class="stat"><div class="stat-num" style="color:var(--warn)">${s.amarillos}</div><div class="stat-label">En seguimiento</div></div>
    </div>
    <div class="help">Semáforo: verde cerrado, amarillo en seguimiento, rojo grave/canalizado/vencido/reincidente, gris borrador.</div>
  </div>`;
}
function renderBitacoraFilters(){
  return `<div class="card"><div class="section-title">Filtros de seguimiento</div>
    <div class="row row3">
      <div><div class="small">Alumno</div><select id="bit-filter-student"><option value="">Todos</option>${(db.group.students||[]).map(s=>`<option value="${s.id}" ${bitacoraFilters.student===s.id?'selected':''}>${esc(s.listNo)} · ${esc(s.name)}</option>`).join('')}</select></div>
      <div><div class="small">Ruta</div><select id="bit-filter-route"><option value="">Todas</option><option value="A" ${bitacoraFilters.route==='A'?'selected':''}>Ruta A</option><option value="B" ${bitacoraFilters.route==='B'?'selected':''}>Ruta B</option><option value="C" ${bitacoraFilters.route==='C'?'selected':''}>Ruta C</option><option value="CIT" ${bitacoraFilters.route==='CIT'?'selected':''}>Citatorio</option></select></div>
      <div><div class="small">Estatus</div><select id="bit-filter-status"><option value="">Todos</option>${['borrador','abierto','en seguimiento','canalizado','cerrado'].map(x=>`<option ${bitacoraFilters.status===x?'selected':''}>${x}</option>`).join('')}</select></div>
      <div><div class="small">Semáforo</div><select id="bit-filter-light"><option value="">Todos</option>${['gris','verde','amarillo','rojo'].map(x=>`<option ${bitacoraFilters.light===x?'selected':''}>${x}</option>`).join('')}</select></div>
      <div><div class="small">Seguimiento</div><select id="bit-filter-due"><option value="">Todos</option><option value="overdue" ${bitacoraFilters.due==='overdue'?'selected':''}>Vencidos</option><option value="upcoming" ${bitacoraFilters.due==='upcoming'?'selected':''}>Próximos</option></select></div>
      <button class="btn secondary" id="bit-clear-filters">Limpiar filtros</button>
    </div>
  </div>`;
}
function renderBitacora(){
  const reports=bitacoraFilteredReports();
  return `<div class="card"><div class="section-title">📋 Bitácora de Incidencias</div><div class="help">Fase 5.3: seguimiento directivo, dictado corregido y exportación PDF/Word opcional. Usa los alumnos de ProfeQr.</div></div>
  <div class="home" style="margin-bottom:14px">
    <button class="home-card" data-bit-start="A"><div class="home-icon">🚨</div><div class="home-label">Ruta A<br><span class="small">Violencia / grave</span></div></button>
    <button class="home-card" data-bit-start="B"><div class="home-icon">📋</div><div class="home-label">Ruta B<br><span class="small">Indisciplina</span></div></button>
    <button class="home-card" data-bit-start="C"><div class="home-icon">📆</div><div class="home-label">Ruta C<br><span class="small">Inasistencias</span></div></button>
    <button class="home-card" data-bit-start="CIT"><div class="home-icon">✉️</div><div class="home-label">Citatorio<br><span class="small">Ligado o directo</span></div></button>
  </div>
  ${renderBitacoraDashboard((db.group.bitacoraReports||[]).map(normalizeBitacoraReport))}
  ${renderBitacoraFilters()}
  <div class="card"><div class="tabs"><button class="tab ${bitacoraTab==='new'?'active':''}" data-bit-tab="new">Historial</button><button class="tab ${bitacoraTab==='student'?'active':''}" data-bit-tab="student">Ficha por alumno</button></div><div style="margin-top:12px">${bitacoraTab==='student'?renderBitacoraByStudent():renderBitacoraRecent(reports)}</div></div>`;
}
function renderTrafficBadge(r){
  const light=buildReportTrafficLight(r); const map={verde:'🟢',amarillo:'🟡',rojo:'🔴',gris:'⚪'};
  return `<span class="traffic-badge traffic-${light}">${map[light]||'⚪'} ${esc(light||'gris')}</span>`;
}
function renderBitacoraRecent(reports){
  if(!reports.length) return '<div class="small">Sin reportes con esos filtros.</div>';
  return reports.map(r=>`<div class="bit-report-card">
    <div class="bit-report-main">
      <div class="item-title">${esc(r.folio)} · ${esc(bitTypeName(r.type))}</div>
      <div class="item-sub">${esc(r.date||'')} · ${(r.studentIds||[]).map(getStudentLabel).join('; ') || 'Sin alumno ligado'}</div>
      <div class="item-sub">${renderTrafficBadge(r)} <span class="badge primary">${esc(buildReportStatus(r))}</span> Seguimiento: <b>${esc(getBitacoraFollowUpDate(r)||'sin fecha')}</b></div>
      <div class="help"><b>Próximo paso:</b> ${esc(bitacoraNextStep(r))}</div>
    </div>
    <div class="bit-report-actions">
      <button class="mini" data-bit-open="${r.id}">Abrir</button>
      <button class="mini" data-bit-pdf="${r.id}">PDF</button>
      <button class="mini" data-bit-word="${r.id}">Word</button>
      ${buildReportStatus(r)!=='cerrado'?`<button class="mini" data-bit-close="${r.id}" style="background:#DCFCE7;color:var(--ok)">Cerrar</button>`:''}
      ${buildReportStatus(r)==='cerrado'?`<button class="mini" data-bit-reopen="${r.id}" style="background:#FEF3C7;color:var(--warn)">Reabrir</button>`:''}
    </div>
  </div>`).join('');
}
function renderBitacoraByStudent(){
  return `<select id="bit-student-filter"><option value="">— Seleccionar alumno —</option>${(db.group.students||[]).map(s=>`<option value="${s.id}">${esc(s.listNo)} · ${esc(s.name)} (${bitacoraStudentReincidence(s.id)} reportes)</option>`).join('')}</select><div id="bit-student-detail" style="margin-top:12px" class="small">Selecciona un alumno para ver su ficha integral de bitácora.</div>`;
}
function renderBitacoraStudentCard(studentId){
  const s=findStudent(studentId); if(!s) return 'Alumno no encontrado.';
  const arr=(db.group.bitacoraReports||[]).map(normalizeBitacoraReport).filter(r=>(r.studentIds||[]).includes(studentId)).sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''));
  const sum=bitacoraSummary(arr);
  return `<div class="kpi"><div class="item-title">${esc(s.name)}</div><div class="small">Lista ${esc(s.listNo)} · ${esc(s.qr||'')}</div></div>
    <div class="stats stats4" style="margin:10px 0">
      <div class="stat"><div class="stat-num">${sum.total}</div><div class="stat-label">Reportes</div></div>
      <div class="stat"><div class="stat-num" style="color:var(--bad)">${sum.rojos}</div><div class="stat-label">Rojos</div></div>
      <div class="stat"><div class="stat-num" style="color:var(--warn)">${sum.abiertos}</div><div class="stat-label">Abiertos</div></div>
      <div class="stat"><div class="stat-num" style="color:var(--ok)">${sum.cerrados}</div><div class="stat-label">Cerrados</div></div>
    </div>${arr.length?renderBitacoraRecent(arr):'<div class="small">Sin reportes para este alumno.</div>'}`;
}
function bindBitacora(){
  document.querySelectorAll('[data-bit-start]').forEach(btn=>btn.onclick=()=>startBitacora(btn.dataset.bitStart));
  document.querySelectorAll('[data-bit-tab]').forEach(btn=>btn.onclick=()=>{ bitacoraTab=btn.dataset.bitTab; renderCurrentScreen(); });
  const filterMap=[['bit-filter-student','student'],['bit-filter-route','route'],['bit-filter-status','status'],['bit-filter-light','light'],['bit-filter-due','due']];
  filterMap.forEach(([id,key])=>{ const el=document.getElementById(id); if(el) el.onchange=()=>{ bitacoraFilters[key]=el.value; renderCurrentScreen(); }; });
  const clear=document.getElementById('bit-clear-filters'); if(clear) clear.onclick=()=>{ bitacoraFilters={student:'',route:'',status:'',light:'',due:''}; renderCurrentScreen(); };
  document.querySelectorAll('[data-bit-open]').forEach(btn=>btn.onclick=()=>openBitacoraReport(btn.dataset.bitOpen));
  document.querySelectorAll('[data-bit-pdf]').forEach(btn=>btn.onclick=()=>downloadBitacoraPdf((db.group.bitacoraReports||[]).find(r=>r.id===btn.dataset.bitPdf)));
  document.querySelectorAll('[data-bit-word]').forEach(btn=>btn.onclick=()=>downloadBitacoraWord((db.group.bitacoraReports||[]).find(r=>r.id===btn.dataset.bitWord)));
  document.querySelectorAll('[data-bit-close]').forEach(btn=>btn.onclick=()=>changeBitacoraStatus(btn.dataset.bitClose,'cerrado'));
  document.querySelectorAll('[data-bit-reopen]').forEach(btn=>btn.onclick=()=>changeBitacoraStatus(btn.dataset.bitReopen,'en seguimiento'));
  const sel=document.getElementById('bit-student-filter'); if(sel) sel.onchange=()=>{ const detail=document.getElementById('bit-student-detail'); detail.innerHTML=sel.value?renderBitacoraStudentCard(sel.value):'Selecciona un alumno para ver su ficha integral de bitácora.'; bindBitacora(); };
}
function changeBitacoraStatus(id,status){
  const r=(db.group.bitacoraReports||[]).find(x=>x.id===id); if(!r) return;
  r.status=status; refreshBitacoraComputedFields(r); saveDb(); toast(status==='cerrado'?'Reporte cerrado':'Reporte reabierto'); renderCurrentScreen();
}
function startBitacora(type){
  if(!canWrite()) return writeBlockedMessage();
  if(type!=='CIT' && getActiveStudents().length===0){ toast('Primero agrega alumnos al grupo'); currentScreen='students'; renderCurrentScreen(); return; }
  bitacoraStep=0;
  bitacoraDraft={id:uid(),schemaVersion:2,folio:bitacoraFolio(),type,route:type,status:'abierto',trafficLight:'amarillo',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),date:today(),time:nowTime().slice(0,5),eventDate:today(),eventTime:nowTime().slice(0,5),institutional:buildBitacoraInstitutionalSnapshot(),reporter:{name:db.config?.teacher||'',role:'docente',source:'observación directa'},studentIds:[],data:{},followUp:{date:'',responsible:db.config?.teacher||'',notes:''},documentText:''};
  currentScreen='bitacoraForm'; renderCurrentScreen();
}
function continuarDraft(){ if(wizDraftLoad()){ currentScreen='bitacoraForm'; renderCurrentScreen(); } }
function renderBitacoraForm(){
  if(!bitacoraDraft) return '<div class="card"><div class="section-title">Sin borrador</div></div>';
  const steps=BIT_STEPS[bitacoraDraft.type]||[];
  return `${renderBitStepper()}${renderBitStep(bitacoraDraft.type, bitacoraStep)}<div class="card"><div class="row row2"><button class="btn secondary" id="bit-cancel">Cancelar</button><button class="btn secondary" id="bit-prev" ${bitacoraStep===0?'disabled':''}>← Atrás</button><button class="btn primary" id="bit-next">${bitacoraStep===steps.length-1?'Preparar vista previa':'Siguiente →'}</button></div></div>`;
}
function renderBitStepper(){ const steps=BIT_STEPS[bitacoraDraft.type]||[]; return `<div class="card"><div class="small">Folio ${bitacoraDraft.folio} · ${bitTypeName(bitacoraDraft.type)}</div><div class="wiz-steps">${steps.map((s,i)=>`<span class="wiz-step ${i<bitacoraStep?'done':''} ${i===bitacoraStep?'active':''}">${i+1}. ${esc(s)}</span>`).join('')}</div></div>`; }
function commonStepCard(icon,title,subtitle,body){ return `<div class="card"><div class="section-title">${icon} ${title}</div><div class="help" style="margin-bottom:12px">${subtitle}</div>${body}</div>`; }
function renderBitStep(type, step){ const d=bitacoraDraft.data||{}; if(type==='A') return renderBitStepA(step,d); if(type==='B') return renderBitStepB(step,d); if(type==='C') return renderBitStepC(step,d); return renderBitStepCit(step,d); }
function renderReporterFields(d){ return `<div class="card"><div class="section-title">Datos de reporte</div><div class="row row2">${bitInput('bit-reporter', 'Persona que reporta', bitacoraDraft.reporter?.name||'', 'Nombre completo', 'text', true)}${bitChoice('bit-reporter-role','Carácter', ['docente','alumno','madre/padre/tutor','directivo','otro'], bitacoraDraft.reporter?.role||'docente', true)}${bitChoice('bit-reporter-source','Fuente de información', ['observación directa','información de terceros','ambas'], bitacoraDraft.reporter?.source||'observación directa', true)}</div></div>`; }
function renderBitStepA(step,d){
  if(step===0) return renderReporterFields(d)+commonStepCard('🚨','Ruta A: personas involucradas','Registra roles solo como presuntos y de forma neutral.',`<div class="row row2"><div><div class="small">Alumno principal *</div><select id="a-victim">${activeStudentOptions(d.a_victim||'')}</select></div>${bitChoice('a-victim-role','Rol del alumno principal', BIT_OPTS.rolesA, d.a_victim_role||'presunto receptor', true)}</div><div class="row row2" style="margin-top:10px"><div><div class="small">Otro alumno involucrado</div><select id="a-aggressor">${activeStudentOptions(d.a_aggressor||'')}</select></div>${bitChoice('a-aggressor-role','Rol de otro alumno', BIT_OPTS.rolesA, d.a_aggressor_role||'presunto generador')}</div>${bitText('a-others','Otros involucrados externos',d.a_others||'','Nombre, grupo, cargo o relación',false,2,false)}`);
  if(step===1) return commonStepCard('📌','Clasificación','Elige una categoría. Si no aparece, usa Otra.',`${bitChoice('a-subtype','Tipo de violencia/incidencia',BIT_OPTS.tiposA,d.a_subtype||'',true)}${bitChoice('a-severity','Gravedad inicial',BIT_OPTS.gravedadA,d.a_severity||'',true)}`);
  if(step===2) return commonStepCard('⚠️','Matriz de riesgo','Marca solo lo que conste o haya sido referido. Las alertas no son diagnóstico.',`${bitChecks('a-risk','Indicadores de riesgo',BIT_OPTS.riesgosA,d.riskFlags||[])}${bitRiskAlert(d.riskFlags||[])}`);
  if(step===3) return commonStepCard('📍','Lugar y momento','Ubica el hecho sin mezclarlo con la relatoría.',`<div class="row row2">${bitInput('bit-date','Fecha de elaboración',bitacoraDraft.date,'','date',true)}${bitInput('bit-time','Hora de elaboración',bitacoraDraft.time,'','time',true)}${bitInput('bit-event-date','Fecha aproximada del hecho',bitacoraDraft.eventDate,'','date',true)}${bitInput('bit-event-time','Hora aproximada del hecho',bitacoraDraft.eventTime,'','time')}</div>${bitChoice('a-place','Lugar exacto',BIT_OPTS.lugares,d.a_place||'',true)}${bitText('a-place-detail','Detalles del lugar',d.a_place_detail||'','Ej. junto a la puerta del aula, durante receso',false,2,false)}`);
  if(step===4) return commonStepCard('🗣️','Relatoría objetiva','Separa lo observado de lo referido. Dicta si lo necesitas y revisa antes de avanzar.',`${bitText('a-observed','Hechos observados directamente',d.a_observed||'','Qué vio, escuchó o constató el docente.',false,5,true)}${bitText('a-referred','Hechos referidos por terceros',d.a_referred||'','Lo que alumnos, tutor o personal manifestaron.',false,4,true)}${bitText('a-spontaneous','Manifestaciones espontáneas',d.a_spontaneous||'','Palabras textuales si se dijeron espontáneamente. No interrogar.',false,3,true)}`);
  if(step===5) return commonStepCard('📎','Testigos y evidencias','Registra evidencia disponible, sin difundir datos sensibles.',`${bitText('a-witnesses','Testigos',d.a_witnesses||'','Nombre, grupo y qué observaron.',false,3,true)}${bitChecks('a-evidence','Evidencias o anexos',BIT_OPTS.evidencias,d.a_evidence||[])}${bitText('a-evidence-detail','Descripción de evidencias',d.a_evidence_detail||'','Qué se conserva, quién lo resguarda y dónde.',false,3,true)}`);
  if(step===6) return commonStepCard('🛡️','Acciones inmediatas de protección','Documenta la actuación inmediata.',`${bitChecks('a-actions','Acciones realizadas',BIT_OPTS.accionesA,d.a_actions||[])}${bitText('a-protection','Medidas inmediatas de protección',d.a_protection||'','Separación, acompañamiento, resguardo, supervisión, etc.',true,4,true)}`);
  if(step===7) return commonStepCard('☎️','Notificación a familia y dirección','Registra cómo y cuándo se notificó o por qué no fue posible.',`<div class="row row2">${bitChoice('a-notice-director','Aviso a dirección', ['sí','no','no aplica'], d.a_notice_director||'sí', true)}${bitChoice('a-notice-tutor','Aviso a tutor', ['sí','no','no localizado'], d.a_notice_tutor||'', true)}${bitChoice('a-notice-medium','Medio de notificación', BIT_OPTS.mediosContacto, d.a_notice_medium||'')}${bitInput('a-notice-time','Fecha/hora de notificación',d.a_notice_time||'','','datetime-local')}</div>${bitInput('a-tutor','Nombre del tutor contactado',d.a_tutor||'','Nombre completo')}${bitText('a-notice-notes','Detalle de notificación',d.a_notice_notes||'','Respuesta del tutor, intento de contacto o motivo de no notificación.',false,3,true)}`);
  if(step===8) return commonStepCard('🏥','Canalización o aviso a autoridad','No emitas conclusiones; registra aviso, orientación o canalización.',`${bitChecks('a-channel','Instancias consideradas o contactadas',BIT_OPTS.canales,d.a_channel||[])}${bitText('a-channel-detail','Detalle de canalización o aviso',d.a_channel_detail||'','Instancia, fecha, persona que recibe, folio externo si existe.',false,3,true)}<div class="row row2">${bitInput('a-followup-date','Fecha de seguimiento',d.a_followup_date||'','','date')}${bitInput('a-followup-responsible','Responsable de seguimiento',d.a_followup_responsible||db.config?.teacher||'','Nombre')}</div>`);
  if(step===9) return commonStepCard('✅','Compromisos y seguimiento','Cierra con acuerdos claros y fecha verificable.',`${bitText('a-commitments','Acuerdos y compromisos',d.a_commitments||'','Compromisos de alumno, familia, escuela y seguimiento.',false,4,true)}${bitText('a-notes','Observaciones finales',d.a_notes||'','Datos no incluidos en apartados anteriores.',false,3,true)}${bitChoice('a-status','Estatus inicial',BIT_OPTS.estatus,d.a_status||'en seguimiento')}`);
  return commonStepCard('👁️','Previa','Se generará una vista previa editable antes de guardar.','<div class="alert-legal"><b>Revisión obligatoria</b><p>La acta incluirá encabezado, relatoría, evidencias, acciones, notificaciones, canalización, acuerdos, firmas y notas de privacidad/alcance.</p></div>');
}
function renderBitStepB(step,d){
  if(step===0) return renderReporterFields(d)+commonStepCard('📋','Ruta B: alumno y datos base','No se usa lenguaje de víctima/agresor/receptor/generador.',`<div class="row row2"><div><div class="small">Alumno *</div><select id="b-student">${activeStudentOptions(d.b_student||'')}</select></div>${bitInput('bit-event-date','Fecha',bitacoraDraft.eventDate,'','date',true)}${bitInput('bit-event-time','Hora',bitacoraDraft.eventTime,'','time')}${bitChoice('b-place','Lugar',BIT_OPTS.lugares,d.b_place||'',true)}</div>`);
  if(step===1) return commonStepCard('✍️','Conducta o incumplimiento','Describe conducta observable, no etiqueta personal.',`${bitChoice('b-subtype','Tipo de falta',BIT_OPTS.tiposB,d.b_subtype||'',true)}${bitText('b-conduct','Conducta observable',d.b_conduct||'','Qué hizo o dejó de hacer el alumno de forma observable.',true,4,true)}${bitText('b-rule','Norma, acuerdo o indicación incumplida',d.b_rule||'','Ej. acuerdo de clase, indicación docente, reglamento interno.',true,3,true)}${bitChecks('b-escalate','Indicadores que podrían escalar a Ruta A',BIT_OPTS.escalamientoB,d.b_escalate||[])}${shouldEscalateB(d.b_escalate)?'<div class="alert-legal red"><b>Se recomienda Ruta A</b><p>Esta situación no debe documentarse como simple indisciplina. Puedes continuar si es un registro formativo menor, pero considera escalar.</p></div>':''}`);
  if(step===2) return commonStepCard('🔎','Contexto y antecedentes','Registra reincidencia y afectación sin prejuzgar.',`${bitChoice('b-repeat','Reincidencia',BIT_OPTS.reincidencia,d.b_repeat||'',true)}${bitText('b-prior','Antecedentes relacionados',d.b_prior||'','Registros previos o intervenciones anteriores.',false,3,true)}${bitText('b-effect','Afectación al grupo o actividad',d.b_effect||'','Cómo afectó la clase, seguridad, aprendizaje o convivencia.',false,3,true)}${bitText('b-response','Respuesta del alumno',d.b_response||'','Qué manifestó o cómo reaccionó, sin interpretar.',false,3,true)}`);
  if(step===3) return commonStepCard('🧑‍🏫','Intervención docente','Documenta qué hizo el maestro antes de la medida.',`${bitText('b-intervention','Intervención previa del docente',d.b_intervention||'','Diálogo, indicación, reconducción, apoyo, mediación, etc.',true,4,true)}${bitText('b-support','Apoyo o seguimiento escolar',d.b_support||'','Apoyos acordados por docente o escuela.',false,3,true)}`);
  if(step===4) return commonStepCard('🧩','Medida formativa','La medida debe ser proporcional y educativa.',`${bitChoice('b-measure','Medida formativa aplicada',BIT_OPTS.medidasB,d.b_measure||'',true)}${bitText('b-repair','Reparación del daño, si aplica',d.b_repair||'','Acción concreta para reparar o compensar.',false,3,true)}${bitChoice('b-notice-tutor','Notificación a tutor', ['sí','no','no aplica'], d.b_notice_tutor||'no aplica')}`);
  if(step===5) return commonStepCard('✅','Compromisos y seguimiento','Define qué se revisará y cuándo.',`${bitText('b-commitment','Compromiso del alumno',d.b_commitment||'','Conducta o acción concreta que se compromete a realizar.',true,3,true)}${bitText('b-family','Compromiso familiar, si aplica',d.b_family||'','Acuerdo con madre, padre o tutor.',false,3,true)}<div class="row row2">${bitInput('b-followup-date','Fecha de seguimiento',d.b_followup_date||'','','date',true)}${bitInput('b-followup-responsible','Responsable',d.b_followup_responsible||db.config?.teacher||'','Nombre')}</div>${bitChoice('b-status','Estatus inicial',BIT_OPTS.estatus,d.b_status||'en seguimiento')}`);
  return commonStepCard('👁️','Previa','Se generará una vista previa editable antes de guardar.','<div class="alert-legal"><b>Revisión obligatoria</b><p>La Ruta B mantendrá lenguaje formativo y no usará términos de violencia.</p></div>');
}
function renderBitStepC(step,d){
  if(step===0) return renderReporterFields(d)+commonStepCard('📆','Ruta C: alumno','Usa asistencia ProfeQr para detectar faltas y documentar seguimiento.',`<div><div class="small">Alumno *</div><select id="c-student">${activeStudentOptions(d.c_student||'')}</select></div>`);
  if(step===1) return commonStepCard('🗓️','Periodo revisado','Selecciona el periodo que quieres revisar.',`<div class="row row2">${bitInput('c-start','Inicio del periodo',d.c_start||today(),'','date',true)}${bitInput('c-end','Fin del periodo',d.c_end||today(),'','date',true)}</div>${bitChoice('c-consecutive','Tipo de ausencias', ['consecutivas','intermitentes','por determinar'], d.c_consecutive||'por determinar')}`);
  if(step===2){ const abs=d.c_absences_auto||calculateAbsences(d.c_student,d.c_start,d.c_end); return commonStepCard('📌','Faltas detectadas','Estas fechas se calculan desde asistencia ProfeQr. Puedes agregar observaciones o justificantes.',`<div class="alert-legal"><b>Faltas detectadas: ${abs.length}</b><p>${abs.join(', ')||'No se detectaron faltas en el periodo o no hay asistencia capturada.'}</p></div>${bitText('c-justified','Justificantes o motivos por fecha',d.c_justified||'','Ej. 12/09 enfermedad con justificante; 13/09 sin contacto.',false,4,true)}${bitText('c-manual','Observaciones sobre asistencia',d.c_manual||'','Aclaraciones si el registro de asistencia está incompleto.',false,3,true)}`); }
  if(step===3) return commonStepCard('☎️','Contacto con familia','Documenta contacto o intento de contacto.',`${bitChoice('c-contact-medium','Medio de contacto',BIT_OPTS.mediosContacto,d.c_contact_medium||'',true)}<div class="row row2">${bitInput('c-tutor','Tutor contactado',d.c_tutor||'','Nombre completo')}${bitInput('c-contact-date','Fecha/hora de contacto',d.c_contact_date||'','','datetime-local')}</div>${bitText('c-contact-response','Respuesta del tutor o intento de contacto',d.c_contact_response||'','Qué respondió, o describir intento sin respuesta.',true,4,true)}${bitChoice('c-requires-cit','¿Requiere citatorio?', ['sí','no','por valorar'], d.c_requires_cit||'por valorar')}`);
  if(step===4) return commonStepCard('⚠️','Riesgo académico y acuerdos','La app sugiere semáforo según faltas y respuesta familiar.',`${bitChoice('c-risk','Riesgo de rezago o abandono',BIT_OPTS.riesgoC,d.c_risk||'',true)}${bitText('c-pending-work','Trabajos pendientes o afectación académica',d.c_pending_work||'','Actividades o aprendizajes pendientes.',false,3,true)}${bitText('c-agreement','Acuerdos de regularización',d.c_agreement||'','Compromisos de asistencia, entrega de trabajos y comunicación.',true,4,true)}<div class="alert-legal"><b>Semáforo sugerido</b><p>${getAbsenceRiskC(d).toUpperCase()} según faltas detectadas, riesgo y contacto familiar.</p></div>`);
  if(step===5) return commonStepCard('✅','Seguimiento','Programa una revisión verificable.',`<div class="row row2">${bitInput('c-followup-date','Fecha de revisión',d.c_followup_date||'','','date',true)}${bitInput('c-followup-responsible','Responsable',d.c_followup_responsible||db.config?.teacher||'','Nombre')}</div>${bitChoice('c-channel','¿Requiere canalización o aviso a dirección?', ['no','dirección','supervisión','trabajo social','otra'], d.c_channel||'no')}${bitChoice('c-status','Estatus inicial',BIT_OPTS.estatus,d.c_status||'en seguimiento')}`);
  return commonStepCard('👁️','Previa','Se generará una vista previa editable con línea de tiempo de inasistencias.','<div class="alert-legal"><b>Revisión obligatoria</b><p>La Ruta C no trata la inasistencia como violencia ni indisciplina automática.</p></div>');
}
function renderBitStepCit(step,d){
  if(step===0) return commonStepCard('✉️','Citatorio: alumno','Puede generarse directo o ligado a un reporte.',`<div><div class="small">Alumno *</div><select id="cit-student">${activeStudentOptions(d.cit_student||'')}</select></div>${bitInput('cit-related','Folio relacionado',d.cit_related||'','Opcional')}`);
  if(step===1) return commonStepCard('👤','Tutor citado','Registra destinatario.',`<div class="row row2">${bitInput('cit-tutor','Tutor citado',d.cit_tutor||'','Nombre completo', 'text', true)}${bitChoice('cit-relation','Parentesco',['Madre','Padre','Tutor/a','Otro'],d.cit_relation||'Madre')}</div>`);
  if(step===2) return commonStepCard('📅','Fecha, hora y lugar','Datos de la cita.',`<div class="row row2">${bitInput('cit-date','Fecha de cita',d.cit_date||today(),'','date',true)}${bitInput('cit-time','Hora de cita',d.cit_time||'','','time',true)}</div>${bitInput('cit-place','Lugar',d.cit_place||'Dirección escolar','Lugar de atención','text',true)}`);
  if(step===3) return commonStepCard('📝','Motivo','Motivo y detalle del citatorio.',`${bitChoice('cit-reason','Motivo',['seguimiento de incidencia','inasistencias reiteradas','conducta o cumplimiento','entrega de acuerdos','otro'],d.cit_reason||'',true)}${bitText('cit-detail','Detalle del motivo',d.cit_detail||'','Explicación breve, objetiva y respetuosa.',true,4,true)}`);
  if(step===4) return commonStepCard('📨','Entrega y acuse','Registra cómo se entregó o envió.',`${bitChoice('cit-medium','Medio de entrega',BIT_OPTS.mediosContacto,d.cit_medium||'',true)}${bitInput('cit-delivered-by','Persona que entrega/envía',d.cit_delivered_by||db.config?.teacher||'','Nombre')}${bitText('cit-ack','Acuse o evidencia de envío',d.cit_ack||'','Firma, captura, mensaje de recibido u observación.',false,3,true)}`);
  return commonStepCard('👁️','Previa','Se generará vista previa editable del citatorio.','<div class="alert-legal"><b>Revisión obligatoria</b><p>El citatorio se guardará como reporte ligado al alumno y al folio relacionado si existe.</p></div>');
}
