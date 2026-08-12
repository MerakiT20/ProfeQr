function buildBitacoraDocument(r){
  refreshBitacoraComputedFields(r);
  const d = r.data || {};
  const title = buildBitacoraTitle(r.type);
  const intro = `${title}\n${'='.repeat(title.length)}\n\n${buildInstitutionalHeader(r)}\n\n${buildCommonIdentification(r)}`;
  let routeBody = '';

  if(r.type==='A'){
    routeBody = [
      bitSection('1. DATOS DE LAS PERSONAS INVOLUCRADAS', [
        `Alumno principal: ${getStudentLabel(d.a_victim)}`,
        `Rol del alumno principal: ${bitNA(d.a_victim_role,'No especificado')}`,
        `Otro alumno registrado: ${d.a_aggressor ? getStudentLabel(d.a_aggressor) : 'No especificado'}`,
        `Rol del otro alumno: ${bitNA(d.a_aggressor_role,'No especificado')}`,
        `Otros involucrados o referencias: ${bitNA(d.a_others)}`
      ].join('\n')),
      bitSection('2. CLASIFICACIÓN INICIAL DEL HECHO', [
        `Tipo de violencia/incidencia: ${bitNA(d.a_subtype)}`,
        `Gravedad inicial: ${bitNA(d.a_severity)}`,
        `Lugar exacto: ${bitNA(d.a_place)} ${bitNA(d.a_place_detail,'')}`,
        `Matriz de riesgo marcada: ${bitNA(d.riskFlags,'Sin indicadores críticos marcados')}`,
        buildRiskNoticeA(d),
        buildAntiRevictimizationNotice(d)
      ].join('\n')),
      bitSection('3. HECHOS OBSERVADOS DIRECTAMENTE', bitNA(d.a_observed,'No se registraron hechos observados directamente.')),
      bitSection('4. HECHOS REFERIDOS POR TERCEROS', bitNA(d.a_referred,'No se registraron hechos referidos por terceros.')),
      bitSection('5. MANIFESTACIONES ESPONTÁNEAS', bitNA(d.a_spontaneous,'No se registraron manifestaciones espontáneas.')),
      bitSection('6. TESTIGOS, EVIDENCIAS Y ANEXOS', [
        `Testigos: ${bitNA(d.a_witnesses)}`,
        `Evidencias/anexos: ${bitNA(d.a_evidence,'No registrados')}`,
        `Detalle de evidencias: ${bitNA(d.a_evidence_detail)}`,
        'Nota: describir evidencias sin alterar, destruir o difundir datos personales o imágenes sensibles.'
      ].join('\n')),
      bitSection('7. ACCIONES INMEDIATAS DE PROTECCIÓN', [
        `Acciones realizadas: ${bitNA(d.a_actions,'No registradas')}`,
        `Medidas de protección: ${bitNA(d.a_protection)}`
      ].join('\n')),
      bitSection('8. NOTIFICACIONES REALIZADAS', [
        `Aviso a dirección: ${bitNA(d.a_notice_director)}`,
        `Notificación a madre/padre/tutor: ${bitNA(d.a_notice_tutor)}`,
        `Medio de notificación: ${bitNA(d.a_notice_medium)}`,
        `Fecha y hora de notificación: ${bitNA(d.a_notice_time)}`,
        `Tutor contactado: ${bitNA(d.a_tutor)}`,
        `Detalle de notificación: ${bitNA(d.a_notice_notes)}`
      ].join('\n')),
      bitSection('9. CANALIZACIÓN O AVISO A INSTANCIAS', [
        `Instancias consideradas o notificadas: ${bitNA(d.a_channel,'No registradas')}`,
        `Detalle de canalización/aviso: ${bitNA(d.a_channel_detail)}`
      ].join('\n')),
      bitSection('10. ACUERDOS Y SEGUIMIENTO', [
        `Acuerdos: ${bitNA(d.a_commitments)}`,
        `Fecha de seguimiento: ${bitNA(d.a_followup_date)}`,
        `Responsable del seguimiento: ${bitNA(d.a_followup_responsible)}`,
        `Observaciones adicionales: ${bitNA(d.a_notes)}`
      ].join('\n'))
    ].join('\n');
  }

  if(r.type==='B'){
    routeBody = [
      bitSection('1. DATOS DEL ALUMNO', [
        `Alumno: ${getStudentLabel(d.b_student)}`,
        `Lugar: ${bitNA(d.b_place)}`
      ].join('\n')),
      bitSection('2. CONDUCTA O INCUMPLIMIENTO OBSERVABLE', [
        `Tipo de falta: ${bitNA(d.b_subtype)}`,
        `Conducta observable: ${bitNA(d.b_conduct)}`,
        `Norma, acuerdo o indicación incumplida: ${bitNA(d.b_rule)}`,
        `Indicadores que podrían requerir escalamiento a Ruta A: ${bitNA(d.b_escalate,'No marcados')}`,
        (Array.isArray(d.b_escalate)&&d.b_escalate.length) ? 'Aviso: si existe lesión, amenaza, acoso reiterado, ciberacoso, violencia sexual, arma o riesgo físico/emocional, este caso debe valorarse como Ruta A.' : 'No se activó sugerencia automática de escalamiento.'
      ].join('\n')),
      bitSection('3. CONTEXTO Y ANTECEDENTES', [
        `Reincidencia: ${bitNA(d.b_repeat)}`,
        `Antecedentes relacionados: ${bitNA(d.b_prior)}`,
        `Afectación al grupo o actividad: ${bitNA(d.b_effect)}`,
        `Respuesta del alumno: ${bitNA(d.b_response)}`
      ].join('\n')),
      bitSection('4. INTERVENCIÓN DOCENTE', [
        `Intervención realizada: ${bitNA(d.b_intervention)}`,
        `Apoyo o seguimiento escolar: ${bitNA(d.b_support)}`
      ].join('\n')),
      bitSection('5. MEDIDA FORMATIVA Y REPARACIÓN', [
        `Medida formativa aplicada: ${bitNA(d.b_measure)}`,
        `Reparación del daño, si aplica: ${bitNA(d.b_repair,'No aplica')}`,
        `Notificación a tutor: ${bitNA(d.b_notice_tutor)}`
      ].join('\n')),
      bitSection('6. COMPROMISOS Y SEGUIMIENTO', [
        `Compromiso del alumno: ${bitNA(d.b_commitment)}`,
        `Compromiso familiar/tutor: ${bitNA(d.b_family,'No aplica')}`,
        `Fecha de seguimiento: ${bitNA(d.b_followup_date)}`,
        `Responsable del seguimiento: ${bitNA(d.b_followup_responsible)}`,
        'Nota: esta ruta documenta una intervención educativa formativa. No usa lenguaje de víctima, agresor, receptor o generador.'
      ].join('\n'))
    ].join('\n');
  }

  if(r.type==='C'){
    const timeline = Array.isArray(d.c_timeline) ? d.c_timeline : [];
    routeBody = [
      bitSection('1. DATOS DEL ALUMNO Y PERIODO REVISADO', [
        `Alumno: ${getStudentLabel(d.c_student)}`,
        `Periodo revisado: ${bitNA(d.c_start)} al ${bitNA(d.c_end)}`,
        `Tipo de ausencias: ${bitNA(d.c_consecutive)}`
      ].join('\n')),
      bitSection('2. FALTAS DETECTADAS DESDE ASISTENCIA PROFEQR', [
        `Total de faltas detectadas: ${Array.isArray(d.c_absences_auto)?d.c_absences_auto.length:0}`,
        `Fechas de inasistencia: ${bitNA(d.c_absences_auto,'Sin faltas detectadas o asistencia incompleta en el periodo.')}`
      ].join('\n')),
      bitSection('3. MOTIVOS, JUSTIFICANTES Y EVIDENCIA', [
        `Justificantes/motivos registrados: ${bitNA(d.c_justified,'No se registraron justificantes.')}`,
        `Observaciones adicionales: ${bitNA(d.c_manual)}`
      ].join('\n')),
      bitSection('4. CONTACTO CON MADRE, PADRE O TUTOR', [
        `Medio de contacto: ${bitNA(d.c_contact_medium)}`,
        `Tutor contactado: ${bitNA(d.c_tutor)}`,
        `Fecha y hora de contacto: ${bitNA(d.c_contact_date)}`,
        `Respuesta o intento de contacto: ${bitNA(d.c_contact_response)}`,
        `Requiere citatorio: ${bitNA(d.c_requires_cit)}`
      ].join('\n')),
      bitSection('5. RIESGO ACADÉMICO Y REGULARIZACIÓN', [
        `Riesgo de rezago/abandono: ${bitNA(d.c_risk)}`,
        `Trabajos pendientes: ${bitNA(d.c_pending_work)}`,
        `Acuerdos de regularización: ${bitNA(d.c_agreement)}`
      ].join('\n')),
      bitSection('6. LÍNEA DE TIEMPO DE SEGUIMIENTO', timeline.length ? timeline.map(x=>`- ${bitNA(x.fecha,'sin fecha')}: acción/contacto: ${bitNA(x.accion,'pendiente')}; respuesta: ${bitNA(x.respuesta,'pendiente')}; acuerdo: ${bitNA(x.acuerdo,'pendiente')}; seguimiento/resultado: ${bitNA(x.seguimiento,'pendiente')}`).join('\n') : 'Sin línea de tiempo registrada.'),
      bitSection('7. SEGUIMIENTO PROGRAMADO', [
        `Fecha de seguimiento: ${bitNA(d.c_followup_date)}`,
        `Responsable del seguimiento: ${bitNA(d.c_followup_responsible)}`,
        `Canalización o aviso a dirección: ${bitNA(d.c_channel)}`
      ].join('\n'))
    ].join('\n');
  }

  if(r.type==='CIT'){
    routeBody = [
      bitSection('1. DATOS DEL CITATORIO', [
        `Alumno: ${getStudentLabel(d.cit_student)}`,
        `Folio relacionado: ${bitNA(d.cit_related,'No relacionado')}`,
        `Ruta relacionada: ${bitNA(d.cit_route,'No especificada')}`,
        `Tutor citado: ${bitNA(d.cit_tutor)}`,
        `Parentesco: ${bitNA(d.cit_relation)}`
      ].join('\n')),
      bitSection('2. FECHA, HORA Y LUGAR DE CITA', [
        `Fecha de cita: ${bitNA(d.cit_date)}`,
        `Hora de cita: ${bitNA(d.cit_time)}`,
        `Lugar: ${bitNA(d.cit_place)}`
      ].join('\n')),
      bitSection('3. MOTIVO Y DETALLE', [
        `Motivo: ${bitNA(d.cit_reason)}`,
        `Detalle: ${bitNA(d.cit_detail)}`
      ].join('\n')),
      bitSection('4. ENTREGA Y ACUSE', [
        `Medio de entrega: ${bitNA(d.cit_medium)}`,
        `Persona que entrega/envía: ${bitNA(d.cit_delivered_by)}`,
        `Acuse o evidencia de envío: ${bitNA(d.cit_ack)}`,
        'La cita tiene finalidad de seguimiento escolar y establecimiento de acuerdos en beneficio del alumno.'
      ].join('\n'))
    ].join('\n');
  }

  const closing = [
    bitSection('NOTA DE PRIVACIDAD Y ALCANCE', buildPrivacyAndScope()),
    bitSection('DECLARACIÓN DE REVISIÓN', 'El presente documento se elaboró con base en la información capturada por el docente responsable. Antes de firmarse o compartirse, debe revisarse que el contenido corresponda a los hechos observados, hechos referidos y actuaciones realizadas.'),
    bitSection('FIRMAS', buildSignatureBlock(r.type))
  ].join('\n');
  return `${intro}\n${routeBody}\n${closing}`;
}
function renderBitacoraPreview(){
  if(!bitacoraDraft) return '<div class="card"><div class="section-title">Sin borrador</div></div>';
  const d = bitacoraDraft.data || {};
  const checks = [
    'Encabezado institucional completo',
    'Datos de identificación y folio',
    'Alumno(s) ligados por studentId',
    'Hechos observados y/o referidos separados',
    'Evidencias y anexos descritos',
    'Acciones, notificaciones y seguimiento',
    'Nota de privacidad y alcance',
    'Firmas requeridas'
  ];
  const routeAlert = bitacoraDraft.type==='A' && Array.isArray(d.riskFlags) && d.riskFlags.length
    ? `<div class="alert-danger"><b>Revisión especial Ruta A</b><p>Hay indicadores de riesgo marcados. Verifica medidas de protección, notificación y canalización antes de guardar.</p></div>`
    : '';
  return `<div class="card"><div class="section-title">Vista previa obligatoria</div>
    <div class="help">Revisa y edita el acta final antes de guardar. El documento incluye estructura institucional, privacidad, alcance y firmas.</div>
    ${routeAlert}
    <div class="preview-checklist">${checks.map(c=>`<label><input type="checkbox" checked disabled> ${esc(c)}</label>`).join('')}</div>
    <textarea id="bit-preview-text" style="min-height:520px;margin-top:12px;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:13px;line-height:1.5">${esc(bitacoraDraft.documentText||'')}</textarea>
    <label style="display:flex;gap:8px;margin-top:12px"><input type="checkbox" id="bit-validate"> Confirmo que revisé el documento y que corresponde a la información capturada.</label>
    <div class="row row3" style="margin-top:12px">
      <button class="btn secondary" id="bit-edit">Regresar a editar</button>
      <button class="btn ghost" id="bit-refresh-doc">Reconstruir acta</button>
      <button class="btn primary" id="bit-save">Guardar</button>
      <button class="btn ok" id="bit-save-pdf">Guardar + PDF</button>
      <button class="btn warn" id="bit-save-word">Guardar + Word</button>
    </div>
  </div>`;
}
function bindBitacoraPreview(){
  document.getElementById('bit-edit').onclick=()=>{ currentScreen='bitacoraForm'; renderCurrentScreen(); };
  const refresh = document.getElementById('bit-refresh-doc');
  if(refresh) refresh.onclick=()=>{
    if(!confirm('Esto reconstruirá el acta con los datos estructurados y reemplazará las ediciones manuales de esta vista previa. ¿Continuar?')) return;
    bitacoraDraft.documentText = buildBitacoraDocument(bitacoraDraft);
    document.getElementById('bit-preview-text').value = bitacoraDraft.documentText;
    toast('Acta reconstruida');
  };
  const doSave=(format)=>{
    if(!document.getElementById('bit-validate').checked) return toast('Marca la validación final');
    bitacoraDraft.documentText=document.getElementById('bit-preview-text').value;
    saveBitacoraDraft(format);
  };
  document.getElementById('bit-save').onclick=()=>doSave('none');
  document.getElementById('bit-save-pdf').onclick=()=>doSave('pdf');
  document.getElementById('bit-save-word').onclick=()=>doSave('word');
}
function saveBitacoraDraft(format='none'){
  refreshBitacoraComputedFields(bitacoraDraft);
  db.group.bitacoraReports=db.group.bitacoraReports||[];
  const idx=db.group.bitacoraReports.findIndex(r=>r.id===bitacoraDraft.id);
  if(idx>=0) db.group.bitacoraReports[idx]={...bitacoraDraft}; else db.group.bitacoraReports.unshift({...bitacoraDraft});
  if(!saveDb()) return;
  const saved={...bitacoraDraft};
  wizDraftClear(); // FIX: limpiar draft al guardar
  bitacoraDraft=null;
  toast('Bitácora guardada');
  if(format==='pdf') downloadBitacoraPdf(saved);
  if(format==='word') downloadBitacoraWord(saved);
  currentScreen='bitacora';
  renderCurrentScreen();
}
function openBitacoraReport(id){ const r=(db.group.bitacoraReports||[]).find(x=>x.id===id); if(!r) return; bitacoraDraft={...normalizeBitacoraReport(r),data:{...(r.data||{})}}; bitacoraStep=(BIT_STEPS[r.type]||[]).length-1; currentScreen='bitacoraPreview'; renderCurrentScreen(); }
function downloadBitacoraPdf(r){
  if(!r) return;
  const text=r.documentText||buildBitacoraDocument(r);
  const name=`${r.folio}_${bitTypeName(r.type).replace(/\s+/g,'_')}.pdf`;
  // FIX v4: robust jsPDF detection (CDN puede exponerlo de distintas formas)
  const jsPDFCtor = window.jspdf?.jsPDF || window.jsPDF;
  if(!jsPDFCtor){ downloadTextFile(name.replace('.pdf','.txt'), text); toast('jsPDF no disponible. Descargando como texto.'); return; }
  const doc=new jsPDFCtor({unit:'pt',format:'letter'});
  const margin=42;
  let y=48;
  const pageH=792;
  const pageW=612;
  const usableW=pageW-(margin*2);
  function addFooter(){
    const page=doc.internal.getNumberOfPages();
    doc.setFont('times','normal'); doc.setFontSize(8);
    doc.text(`ProfeQr Bitácora · ${r.folio} · Página ${page}`, margin, pageH-24);
  }
  function newPage(){ addFooter(); doc.addPage(); y=48; }
  doc.setFont('times','bold'); doc.setFontSize(12);
  doc.text(buildBitacoraTitle(r.type), margin, y); y+=18;
  doc.setFont('times','normal'); doc.setFontSize(10);
  const lines=doc.splitTextToSize(text, usableW);
  lines.forEach(line=>{
    if(y>742) newPage();
    if(/^[A-ZÁÉÍÓÚÑ0-9 ,.()\/\-]+$/.test(line.trim()) && line.trim().length>5 && line.trim().length<90){
      doc.setFont('times','bold');
    }else{
      doc.setFont('times','normal');
    }
    doc.text(line, margin, y);
    y+=13;
  });
  addFooter();
  // FIX v4: usar blob + URL para compatibilidad con Chrome móvil
  try {
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; a.target = '_blank';
    document.body.appendChild(a); a.click();
    setTimeout(()=>{ document.body.removeChild(a); URL.revokeObjectURL(url); }, 2000);
    toast('PDF generado. Revisa tus descargas.');
  } catch(e) {
    try { doc.save(name); } catch(e2) { toast('Error al generar PDF: '+e2.message); }
  }
}
function downloadBitacoraWord(r){
  if(!r) return;
  const raw = r.documentText||buildBitacoraDocument(r);
  const title = buildBitacoraTitle(r.type);
  const htmlText = raw.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
  const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${r.folio}</title>
  <style>body{font-family:Arial,Helvetica,sans-serif;font-size:12pt;line-height:1.45;color:#111} h1{font-size:15pt;text-align:center} .meta{font-size:10pt;color:#444}</style></head>
  <body><h1>${title}</h1><div class="meta">Folio ${r.folio} · Generado desde ProfeQr Bitácora</div><hr>${htmlText}</body></html>`;
  // FIX v4: blob para mejor compatibilidad
  try {
    const blob = new Blob([html], {type:'application/msword;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${r.folio}_editable.doc`; a.target = '_blank';
    document.body.appendChild(a); a.click();
    setTimeout(()=>{ document.body.removeChild(a); URL.revokeObjectURL(url); }, 2000);
    toast('Documento Word descargado.');
  } catch(e) { downloadTextFile(`${r.folio}_word_editable.doc`, html, 'application/msword;charset=utf-8'); }
}
function renderBitacoraReportExport(){
  const all=(db.group.bitacoraReports||[]).map(normalizeBitacoraReport); const s=bitacoraSummary(all);
  return `<div class="card"><div class="section-title">Reporte de Bitácora</div>
    <div class="stats stats4" style="margin-bottom:12px">
      <div class="stat"><div class="stat-num">${s.total}</div><div class="stat-label">Total</div></div>
      <div class="stat"><div class="stat-num" style="color:var(--bad)">${s.rojos}</div><div class="stat-label">Rojos</div></div>
      <div class="stat"><div class="stat-num" style="color:var(--warn)">${s.vencidos}</div><div class="stat-label">Vencidos</div></div>
      <div class="stat"><div class="stat-num" style="color:var(--ok)">${s.cerrados}</div><div class="stat-label">Cerrados</div></div>
    </div>
    <div class="row">
      <div><div class="small">Desde</div><input type="date" id="bit-r-from"></div>
      <div><div class="small">Hasta</div><input type="date" id="bit-r-to"></div>
      <button class="btn primary" id="bit-export-xlsx">Exportar Excel de bitácora</button>
      <button class="btn secondary" id="bit-export-all-docs">Descargar concentrado Word editable</button>
      <div class="help">Incluye estatus, semáforo, reincidencia, seguimiento vencido/próximo, canalización, tutor notificado y próximo paso.</div>
    </div>
  </div>`;
}
function bitacoraRowsForExport(start='', end=''){
  return (db.group.bitacoraReports||[]).map(normalizeBitacoraReport).filter(r=>(!start||r.date>=start)&&(!end||r.date<=end)).map(r=>{
    const i=r.institutional||{}; const status=buildReportStatus(r); const light=buildReportTrafficLight(r); const fu=getBitacoraFollowUpDate(r);
    return {
      FOLIO:r.folio,
      RUTA:bitTypeName(r.type),
      ESTATUS:status,
      SEMAFORO:light,
      FECHA_REPORTE:r.date||'',
      HORA_REPORTE:r.time||'',
      FECHA_HECHO:r.eventDate||'',
      HORA_HECHO:r.eventTime||'',
      ALUMNOS:(r.studentIds||[]).map(getStudentLabel).join('; '),
      GRUPO:i.group||'',
      TIPO_ESPECIFICO:getBitacoraSpecificType(r),
      GRAVEDAD:getBitacoraSeverity(r),
      REPORTA:r.reporter?.name||'',
      CARACTER_REPORTA:r.reporter?.role||'',
      OBSERVACION_DIRECTA:r.reporter?.source||'',
      TUTOR_NOTIFICADO:(r.data?.a_notice_tutor||r.data?.b_notice_tutor||r.data?.c_contact_medium||'')?'sí':'',
      MEDIO_NOTIFICACION:r.data?.a_notice_medium||r.data?.c_contact_medium||'',
      CANALIZACION:(r.data?.a_channel||r.data?.c_channel||'')?'sí':'',
      INSTANCIA:Array.isArray(r.data?.a_channel)?r.data.a_channel.join('; '):(r.data?.c_channel||''),
      SEGUIMIENTO_PROGRAMADO:fu?'sí':'no',
      FECHA_SEGUIMIENTO:fu,
      SEGUIMIENTO_VENCIDO:isBitacoraOverdue(r)?'sí':'no',
      RESPONSABLE:r.followUp?.responsible||i.teacher||'',
      REINCIDENCIA:isBitacoraRecurrent(r)?'sí':'no',
      REPORTES_DEL_ALUMNO:(r.studentIds||[]).map(id=>`${getStudentLabel(id)}: ${bitacoraStudentReincidence(id)}`).join('; '),
      PROXIMO_PASO:bitacoraNextStep(r),
      CERRADO:status==='cerrado'?'sí':'no',
      OBSERVACIONES:(r.documentText||'').slice(0,1200)
    };
  });
}
function bindBitacoraReportExport(){
  const exp=document.getElementById('bit-export-xlsx'); if(exp) exp.onclick=()=>{
    const rows=bitacoraRowsForExport(valOf('bit-r-from'),valOf('bit-r-to'));
    const wb=XLSX.utils.book_new(); const ws=XLSX.utils.json_to_sheet(rows); styleSheet(ws); XLSX.utils.book_append_sheet(wb,ws,'BITACORA_SEGUIMIENTO'); XLSX.writeFile(wb,`ProfeQr_Bitacora_Seguimiento_${today()}.xlsx`); toast('Bitácora exportada');
  };
  const all=document.getElementById('bit-export-all-docs'); if(all) all.onclick=()=>{
    const text=(db.group.bitacoraReports||[]).map(r=>`${r.folio} · ${bitTypeName(r.type)} · ${buildReportTrafficLight(r)} · ${buildReportStatus(r)}\nPróximo paso: ${bitacoraNextStep(r)}\n\n${r.documentText||buildBitacoraDocument(r)}`).join('\n\n==============================\n\n');
    downloadTextFile(`Concentrado_Bitacora_${today()}.doc`, `<html><meta charset="utf-8"><body style="font-family:Arial;white-space:pre-wrap">${esc(text)}</body></html>`, 'application/msword;charset=utf-8');
  };
}
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  const banner = document.getElementById('install-banner');
  if(banner) banner.classList.remove('hidden');
});


// FIX v4: actualizar fechas solo si NO fue seleccionada manualmente una fecha histórica
document.addEventListener('visibilitychange', () => {
  if(document.visibilityState !== 'visible') return;
  const now = today();
  // Solo actualizar si la fecha actual ya era "hoy" (no si el maestro eligió una histórica)
  let changed = false;
  if(attendanceDate === dateAdd(now,-1)){ attendanceDate = now; changed = true; }
  if(workDate === dateAdd(now,-1)){ workDate = now; changed = true; }
  if(changed && (currentScreen === 'attendance' || currentScreen === 'works')){
    toast('📅 Fecha actualizada al día de hoy');
    renderCurrentScreen();
  }
});

if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
}

