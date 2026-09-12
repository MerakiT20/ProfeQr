function bindBitacoraForm(){
  bindChoiceButtons(); bindMicButtons();
  document.getElementById('bit-cancel').onclick=()=>{ if(confirm('¿Cancelar este reporte?')){ wizDraftClear(); bitacoraDraft=null; currentScreen='bitacora'; renderCurrentScreen(); } };
  document.getElementById('bit-prev').onclick=()=>{ collectBitStep(); wizDraftSave(); if(bitacoraStep>0) bitacoraStep--; renderCurrentScreen(); };
  document.getElementById('bit-next').onclick=()=>{ collectBitStep(); if(!validateBitStep()) return; wizDraftSave(); const steps=BIT_STEPS[bitacoraDraft.type]||[]; if(bitacoraStep>=steps.length-1) return prepareBitPreview(); bitacoraStep++; renderCurrentScreen(); };
}
function collectMounted(target,key,id,reader=valOf){
  if(document.getElementById(id)) target[key]=reader(id);
}
function collectMountedChecks(target,key,name){
  if(document.querySelector(`input[name="${name}"]`)) target[key]=getChecks(name);
}
function collectCommon(){
  bitacoraDraft.reporter=bitacoraDraft.reporter||{};
  collectMounted(bitacoraDraft.reporter,'name','bit-reporter');
  collectMounted(bitacoraDraft.reporter,'role','bit-reporter-role',getChoice);
  collectMounted(bitacoraDraft.reporter,'source','bit-reporter-source',getChoice);
  collectMounted(bitacoraDraft,'date','bit-date');
  collectMounted(bitacoraDraft,'time','bit-time');
  collectMounted(bitacoraDraft,'eventDate','bit-event-date');
  collectMounted(bitacoraDraft,'eventTime','bit-event-time');
}
function collectBitStep(){
  if(!bitacoraDraft) return false; const d=bitacoraDraft.data||{}; collectCommon();
  if(bitacoraDraft.type==='A'){
    [['a_victim','a-victim'],['a_aggressor','a-aggressor'],['a_others','a-others'],['a_place_detail','a-place-detail'],['a_observed','a-observed'],['a_referred','a-referred'],['a_spontaneous','a-spontaneous'],['a_witnesses','a-witnesses'],['a_evidence_detail','a-evidence-detail'],['a_protection','a-protection'],['a_notice_time','a-notice-time'],['a_tutor','a-tutor'],['a_notice_notes','a-notice-notes'],['a_channel_detail','a-channel-detail'],['a_followup_date','a-followup-date'],['a_followup_responsible','a-followup-responsible'],['a_commitments','a-commitments'],['a_notes','a-notes']].forEach(([key,id])=>collectMounted(d,key,id));
    [['a_victim_role','a-victim-role'],['a_aggressor_role','a-aggressor-role'],['a_subtype','a-subtype'],['a_severity','a-severity'],['a_place','a-place'],['a_notice_director','a-notice-director'],['a_notice_tutor','a-notice-tutor'],['a_notice_medium','a-notice-medium'],['a_status','a-status']].forEach(([key,id])=>collectMounted(d,key,id,getChoice));
    [['riskFlags','a-risk'],['a_evidence','a-evidence'],['a_actions','a-actions'],['a_channel','a-channel']].forEach(([key,name])=>collectMountedChecks(d,key,name));
    bitacoraDraft.studentIds=[d.a_victim,d.a_aggressor].filter(Boolean);
  }
  if(bitacoraDraft.type==='B'){
    [['b_student','b-student'],['b_conduct','b-conduct'],['b_rule','b-rule'],['b_prior','b-prior'],['b_effect','b-effect'],['b_response','b-response'],['b_intervention','b-intervention'],['b_support','b-support'],['b_repair','b-repair'],['b_commitment','b-commitment'],['b_family','b-family'],['b_followup_date','b-followup-date'],['b_followup_responsible','b-followup-responsible']].forEach(([key,id])=>collectMounted(d,key,id));
    [['b_place','b-place'],['b_subtype','b-subtype'],['b_repeat','b-repeat'],['b_measure','b-measure'],['b_notice_tutor','b-notice-tutor'],['b_status','b-status']].forEach(([key,id])=>collectMounted(d,key,id,getChoice));
    collectMountedChecks(d,'b_escalate','b-escalate'); bitacoraDraft.studentIds=[d.b_student].filter(Boolean);
  }
  if(bitacoraDraft.type==='C'){
    [['c_student','c-student'],['c_start','c-start'],['c_end','c-end'],['c_justified','c-justified'],['c_manual','c-manual'],['c_tutor','c-tutor'],['c_contact_date','c-contact-date'],['c_contact_response','c-contact-response'],['c_pending_work','c-pending-work'],['c_agreement','c-agreement'],['c_followup_date','c-followup-date'],['c_followup_responsible','c-followup-responsible']].forEach(([key,id])=>collectMounted(d,key,id));
    [['c_consecutive','c-consecutive'],['c_contact_medium','c-contact-medium'],['c_requires_cit','c-requires-cit'],['c_risk','c-risk'],['c_channel','c-channel'],['c_status','c-status']].forEach(([key,id])=>collectMounted(d,key,id,getChoice));
    d.c_absences_auto=d.c_student&&d.c_start&&d.c_end ? calculateAbsences(d.c_student,d.c_start,d.c_end) : [];
    d.c_timeline=buildTimelineC(d); bitacoraDraft.studentIds=[d.c_student].filter(Boolean);
  }
  if(bitacoraDraft.type==='CIT'){
    [['cit_student','cit-student'],['cit_related','cit-related'],['cit_tutor','cit-tutor'],['cit_date','cit-date'],['cit_time','cit-time'],['cit_place','cit-place'],['cit_detail','cit-detail'],['cit_delivered_by','cit-delivered-by'],['cit_ack','cit-ack']].forEach(([key,id])=>collectMounted(d,key,id));
    [['cit_relation','cit-relation'],['cit_reason','cit-reason'],['cit_medium','cit-medium']].forEach(([key,id])=>collectMounted(d,key,id,getChoice));
    bitacoraDraft.studentIds=[d.cit_student].filter(Boolean); bitacoraDraft.date=d.cit_date||bitacoraDraft.date; bitacoraDraft.time=d.cit_time||bitacoraDraft.time;
  }
  bitacoraDraft.data=d; return true;
}
function validateBitStep(){
  const d=bitacoraDraft.data||{}, t=bitacoraDraft.type, s=bitacoraStep;
  if(t==='A'){ if(s===0&&!d.a_victim) return toast('Selecciona el alumno principal'),false; if(s===1&&(!d.a_subtype||!d.a_severity)) return toast('Selecciona tipo y gravedad'),false; if(s===3&&!d.a_place) return toast('Selecciona el lugar'),false; if(s===4&&!(d.a_observed||d.a_referred)) return toast('Captura hechos observados o referidos'),false; if(s===6&&!d.a_protection) return toast('Captura medida de protección'),false; if(s===7&&!d.a_notice_tutor) return toast('Registra notificación o intento de notificación'),false; }
  if(t==='B'){ if(s===0&&!d.b_student) return toast('Selecciona alumno'),false; if(s===1&&(!d.b_subtype||!d.b_conduct||!d.b_rule)) return toast('Captura tipo, conducta y norma incumplida'),false; if(s===3&&!d.b_intervention) return toast('Captura intervención docente'),false; if(s===4&&!d.b_measure) return toast('Selecciona medida formativa'),false; if(s===5&&(!d.b_commitment||!d.b_followup_date)) return toast('Captura compromiso y fecha de seguimiento'),false; }
  if(t==='C'){ if(s===0&&!d.c_student) return toast('Selecciona alumno'),false; if(s===1&&(!d.c_start||!d.c_end)) return toast('Selecciona periodo'),false; if(s===1&&d.c_start>d.c_end) return toast('El inicio del periodo no puede ser posterior al fin'),false; if(s===3&&!d.c_contact_response) return toast('Captura contacto o intento de contacto'),false; if(s===4&&(!d.c_risk||!d.c_agreement)) return toast('Captura riesgo y acuerdos'),false; if(s===5&&!d.c_followup_date) return toast('Captura fecha de seguimiento'),false; }
  if(t==='CIT'){ if(s===0&&!d.cit_student) return toast('Selecciona alumno'),false; if(s===1&&!d.cit_tutor) return toast('Captura tutor'),false; if(s===2&&(!d.cit_date||!d.cit_time||!d.cit_place)) return toast('Completa fecha, hora y lugar'),false; if(s===3&&(!d.cit_reason||!d.cit_detail)) return toast('Captura motivo y detalle'),false; if(s===4&&!d.cit_medium) return toast('Selecciona medio de entrega'),false; }
  return true;
}
function prepareBitPreview(){ collectBitStep(); if(buildReportStatus(bitacoraDraft)!=='cerrado') setBitacoraOperationalStatus(bitacoraDraft,bitacoraOperationalStatus(bitacoraDraft)); refreshBitacoraComputedFields(bitacoraDraft); bitacoraDraft.documentText=buildBitacoraDocument(bitacoraDraft); currentScreen='bitacoraPreview'; renderCurrentScreen(); }
function valOf(id){ return (document.getElementById(id)?.value||'').trim(); }
function instHeader(report=null){ const i=report?.institutional||buildBitacoraInstitutionalSnapshot(); return `Escuela: ${i.school||''}\nCCT: ${i.cct||''} · Grupo: ${i.group||''} · Turno: ${i.shift||''} · Ciclo: ${i.cycle||''}\nDocente que registra: ${i.teacher||''}\nDirector(a) o responsable: ${i.director||''}\nZona: ${i.zone||''} · Sector/Jefatura: ${i.sector||''}\nMunicipio: ${i.municipality||''}\nDomicilio: ${i.address||''}`; }
function bitNA(v, fallback='No se registró al momento de elaboración.'){
  if(Array.isArray(v)) return v.length ? v.join('; ') : fallback;
  const s = String(v ?? '').trim();
  return s ? s : fallback;
}
function bitYesNo(v){
  if(v===true || String(v).toLowerCase()==='sí' || String(v).toLowerCase()==='si') return 'Sí';
  if(v===false || String(v).toLowerCase()==='no') return 'No';
  return bitNA(v, 'No especificado');
}
function bitStudentBlock(ids=[]){
  const clean = Array.isArray(ids) ? ids.filter(Boolean) : [];
  return clean.length ? clean.map(id=>`- ${getStudentLabel(id)}`).join('\n') : '- No se registró alumno ligado por studentId.';
}
function bitSection(title, content){
  return `\n${title}\n${'-'.repeat(Math.min(title.length, 72))}\n${content}\n`;
}
function buildInstitutionalHeader(r){
  const i = r.institutional || buildBitacoraInstitutionalSnapshot();
  return [
    `Escuela: ${bitNA(i.school,'')}`,
    `CCT: ${bitNA(i.cct,'')} · Zona escolar: ${bitNA(i.zone,'')} · Sector/Jefatura: ${bitNA(i.sector,'No especificado')}`,
    `Turno: ${bitNA(i.shift,'')} · Nivel: ${bitNA(i.level,'')} · Grupo: ${bitNA(i.group,'')}`,
    `Municipio: ${bitNA(i.municipality,'')} · Domicilio: ${bitNA(i.address,'No especificado')}`,
    `Ciclo escolar: ${bitNA(i.cycle,'')} · Director(a)/responsable: ${bitNA(i.director,'No especificado')}`,
    `Docente responsable: ${bitNA(i.teacher,'')}`
  ].join('\n');
}
function buildBitacoraTitle(type){
  if(type==='A') return 'ACTA DE HECHOS Y ATENCIÓN ESCOLAR, RUTA A';
  if(type==='B') return 'REGISTRO DE INCIDENCIA DISCIPLINARIA FORMATIVA, RUTA B';
  if(type==='C') return 'ACTA DE SEGUIMIENTO DE INASISTENCIAS, RUTA C';
  if(type==='CIT') return 'CITATORIO ESCOLAR';
  return 'DOCUMENTO DE BITÁCORA ESCOLAR';
}
function buildCommonIdentification(r){
  const rep = r.reporter || {};
  return [
    `Folio: ${bitNA(r.folio,'')}`,
    `Ruta aplicada: ${bitTypeName(r.type)}`,
    `Estatus: ${bitNA(r.status,'abierto')} · Semáforo: ${bitNA(r.trafficLight,'sin clasificar')}`,
    `Fecha y hora de elaboración: ${bitNA(r.date,'')} ${bitNA(r.time,'')}`,
    `Fecha y hora aproximada del hecho/situación: ${bitNA(r.eventDate||r.date,'')} ${bitNA(r.eventTime||r.time,'')}`,
    `Persona que reporta: ${bitNA(rep.name,'No especificada')}`,
    `Carácter de quien reporta: ${bitNA(rep.role,'No especificado')}`,
    `Fuente de información: ${bitNA(rep.source,'No especificada')}`,
    `Alumnos ligados al reporte:\n${bitStudentBlock(r.studentIds)}`
  ].join('\n');
}
function buildPrivacyAndScope(){
  return [
    'La información contenida en este documento debe tratarse conforme a la protección de datos personales y con resguardo de la identidad de niñas, niños y adolescentes.',
    'Este documento registra hechos observados directamente, hechos referidos por terceros y actuaciones escolares realizadas. No constituye diagnóstico médico, psicológico o jurídico, ni resolución de autoridad competente.',
    'La información deberá utilizarse únicamente para fines de atención, seguimiento escolar, protección de derechos y cumplimiento de las responsabilidades institucionales correspondientes.'
  ].join('\n');
}
function buildSignatureBlock(type){
  const studentLine = type==='CIT' ? 'Alumno(a), en caso de acuse' : 'Alumno(a), cuando proceda y sin presión';
  return [
    '______________________________\nDocente que registra',
    '______________________________\nDirector(a) o responsable escolar',
    '______________________________\nMadre, padre o tutor',
    `______________________________\n${studentLine}`,
    '______________________________\nTestigo o personal de apoyo, si aplica'
  ].join('\n\n');
}
function buildRiskNoticeA(d){
  const risks = Array.isArray(d.riskFlags) ? d.riskFlags : [];
  const severe = risks.filter(x=>/abuso sexual|adulto involucrado|lesión visible|atención médica|arma|amenaza vigente|posible delito|riesgo de represalia|no se siente seguro/i.test(x));
  if(!severe.length) return 'No se activaron alertas rojas automáticas con la información capturada.';
  return `ALERTA ROJA ACTIVADA: ${severe.join('; ')}. Este caso requiere informar a dirección y valorar activación de protocolo, medidas de protección y canalización inmediata. Registrar hechos sin interrogar, presionar ni revictimizar. No emitir diagnósticos ni conclusiones.`;
}
function buildAntiRevictimizationNotice(d){
  const risks = Array.isArray(d.riskFlags) ? d.riskFlags.join(' ') : '';
  if(!/abuso sexual|adulto involucrado|maltrato/i.test(risks + ' ' + (d.a_subtype||''))) return 'No se activó alerta especial de anti-revictimización con la información capturada.';
  return 'Aviso de anti-revictimización: evitar entrevistas repetidas, interrogatorios o presión al menor. Registrar únicamente manifestaciones espontáneas, palabras textuales si fueron expresadas, conducta observada y acciones de protección realizadas.';
}
