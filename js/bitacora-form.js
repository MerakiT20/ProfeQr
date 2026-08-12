function bindBitacoraForm(){
  bindChoiceButtons(); bindMicButtons();
  document.getElementById('bit-cancel').onclick=()=>{ if(confirm('¿Cancelar este reporte?')){ bitacoraDraft=null; currentScreen='bitacora'; renderCurrentScreen(); } };
  document.getElementById('bit-prev').onclick=()=>{ collectBitStep(); wizDraftSave(); if(bitacoraStep>0) bitacoraStep--; renderCurrentScreen(); };
  document.getElementById('bit-next').onclick=()=>{ collectBitStep(); if(!validateBitStep()) return; wizDraftSave(); const steps=BIT_STEPS[bitacoraDraft.type]||[]; if(bitacoraStep>=steps.length-1) return prepareBitPreview(); bitacoraStep++; renderCurrentScreen(); };
}
function collectCommon(){
  const rep=valOf('bit-reporter'); if(rep) bitacoraDraft.reporter.name=rep;
  const rr=getChoice('bit-reporter-role'); if(rr) bitacoraDraft.reporter.role=rr;
  const src=getChoice('bit-reporter-source'); if(src) bitacoraDraft.reporter.source=src;
  const bd=valOf('bit-date'); if(bd) bitacoraDraft.date=bd;
  const bt=valOf('bit-time'); if(bt) bitacoraDraft.time=bt;
  const ed=valOf('bit-event-date'); if(ed) bitacoraDraft.eventDate=ed;
  const et=valOf('bit-event-time'); if(et) bitacoraDraft.eventTime=et;
}
function collectBitStep(){
  if(!bitacoraDraft) return false; const d=bitacoraDraft.data||{}; collectCommon();
  if(bitacoraDraft.type==='A'){
    Object.assign(d,{a_victim:valOf('a-victim')||d.a_victim,a_victim_role:getChoice('a-victim-role')||d.a_victim_role,a_aggressor:valOf('a-aggressor')||d.a_aggressor,a_aggressor_role:getChoice('a-aggressor-role')||d.a_aggressor_role,a_others:valOf('a-others')||d.a_others,a_subtype:getChoice('a-subtype')||d.a_subtype,a_severity:getChoice('a-severity')||d.a_severity,a_place:getChoice('a-place')||d.a_place,a_place_detail:valOf('a-place-detail')||d.a_place_detail,a_observed:valOf('a-observed')||d.a_observed,a_referred:valOf('a-referred')||d.a_referred,a_spontaneous:valOf('a-spontaneous')||d.a_spontaneous,a_witnesses:valOf('a-witnesses')||d.a_witnesses,a_evidence_detail:valOf('a-evidence-detail')||d.a_evidence_detail,a_protection:valOf('a-protection')||d.a_protection,a_notice_director:getChoice('a-notice-director')||d.a_notice_director,a_notice_tutor:getChoice('a-notice-tutor')||d.a_notice_tutor,a_notice_medium:getChoice('a-notice-medium')||d.a_notice_medium,a_notice_time:valOf('a-notice-time')||d.a_notice_time,a_tutor:valOf('a-tutor')||d.a_tutor,a_notice_notes:valOf('a-notice-notes')||d.a_notice_notes,a_channel_detail:valOf('a-channel-detail')||d.a_channel_detail,a_followup_date:valOf('a-followup-date')||d.a_followup_date,a_followup_responsible:valOf('a-followup-responsible')||d.a_followup_responsible,a_commitments:valOf('a-commitments')||d.a_commitments,a_notes:valOf('a-notes')||d.a_notes,a_status:getChoice('a-status')||d.a_status});
    const risks=getChecks('a-risk'); if(risks.length) d.riskFlags=risks; const ev=getChecks('a-evidence'); if(ev.length) d.a_evidence=ev; const acts=getChecks('a-actions'); if(acts.length) d.a_actions=acts; const ch=getChecks('a-channel'); if(ch.length) d.a_channel=ch; bitacoraDraft.studentIds=[d.a_victim,d.a_aggressor].filter(Boolean);
  }
  if(bitacoraDraft.type==='B'){
    Object.assign(d,{b_student:valOf('b-student')||d.b_student,b_place:getChoice('b-place')||d.b_place,b_subtype:getChoice('b-subtype')||d.b_subtype,b_conduct:valOf('b-conduct')||d.b_conduct,b_rule:valOf('b-rule')||d.b_rule,b_repeat:getChoice('b-repeat')||d.b_repeat,b_prior:valOf('b-prior')||d.b_prior,b_effect:valOf('b-effect')||d.b_effect,b_response:valOf('b-response')||d.b_response,b_intervention:valOf('b-intervention')||d.b_intervention,b_support:valOf('b-support')||d.b_support,b_measure:getChoice('b-measure')||d.b_measure,b_repair:valOf('b-repair')||d.b_repair,b_notice_tutor:getChoice('b-notice-tutor')||d.b_notice_tutor,b_commitment:valOf('b-commitment')||d.b_commitment,b_family:valOf('b-family')||d.b_family,b_followup_date:valOf('b-followup-date')||d.b_followup_date,b_followup_responsible:valOf('b-followup-responsible')||d.b_followup_responsible,b_status:getChoice('b-status')||d.b_status});
    const escs=getChecks('b-escalate'); if(escs.length) d.b_escalate=escs; bitacoraDraft.studentIds=[d.b_student].filter(Boolean);
  }
  if(bitacoraDraft.type==='C'){
    Object.assign(d,{c_student:valOf('c-student')||d.c_student,c_start:valOf('c-start')||d.c_start,c_end:valOf('c-end')||d.c_end,c_consecutive:getChoice('c-consecutive')||d.c_consecutive,c_justified:valOf('c-justified')||d.c_justified,c_manual:valOf('c-manual')||d.c_manual,c_contact_medium:getChoice('c-contact-medium')||d.c_contact_medium,c_tutor:valOf('c-tutor')||d.c_tutor,c_contact_date:valOf('c-contact-date')||d.c_contact_date,c_contact_response:valOf('c-contact-response')||d.c_contact_response,c_requires_cit:getChoice('c-requires-cit')||d.c_requires_cit,c_risk:getChoice('c-risk')||d.c_risk,c_pending_work:valOf('c-pending-work')||d.c_pending_work,c_agreement:valOf('c-agreement')||d.c_agreement,c_followup_date:valOf('c-followup-date')||d.c_followup_date,c_followup_responsible:valOf('c-followup-responsible')||d.c_followup_responsible,c_channel:getChoice('c-channel')||d.c_channel,c_status:getChoice('c-status')||d.c_status});
    if(d.c_student&&d.c_start&&d.c_end) d.c_absences_auto=calculateAbsences(d.c_student,d.c_start,d.c_end); d.c_timeline=buildTimelineC(d); bitacoraDraft.studentIds=[d.c_student].filter(Boolean);
  }
  if(bitacoraDraft.type==='CIT'){
    Object.assign(d,{cit_student:valOf('cit-student')||d.cit_student,cit_related:valOf('cit-related')||d.cit_related,cit_tutor:valOf('cit-tutor')||d.cit_tutor,cit_relation:getChoice('cit-relation')||d.cit_relation,cit_date:valOf('cit-date')||d.cit_date,cit_time:valOf('cit-time')||d.cit_time,cit_place:valOf('cit-place')||d.cit_place,cit_reason:getChoice('cit-reason')||d.cit_reason,cit_detail:valOf('cit-detail')||d.cit_detail,cit_medium:getChoice('cit-medium')||d.cit_medium,cit_delivered_by:valOf('cit-delivered-by')||d.cit_delivered_by,cit_ack:valOf('cit-ack')||d.cit_ack});
    bitacoraDraft.studentIds=[d.cit_student].filter(Boolean); bitacoraDraft.date=d.cit_date||bitacoraDraft.date; bitacoraDraft.time=d.cit_time||bitacoraDraft.time;
  }
  bitacoraDraft.data=d; return true;
}
function validateBitStep(){
  const d=bitacoraDraft.data||{}, t=bitacoraDraft.type, s=bitacoraStep;
  if(t==='A'){ if(s===0&&!d.a_victim) return toast('Selecciona el alumno principal'),false; if(s===1&&(!d.a_subtype||!d.a_severity)) return toast('Selecciona tipo y gravedad'),false; if(s===3&&!d.a_place) return toast('Selecciona el lugar'),false; if(s===4&&!(d.a_observed||d.a_referred)) return toast('Captura hechos observados o referidos'),false; if(s===6&&!d.a_protection) return toast('Captura medida de protección'),false; if(s===7&&!d.a_notice_tutor) return toast('Registra notificación o intento de notificación'),false; }
  if(t==='B'){ if(s===0&&!d.b_student) return toast('Selecciona alumno'),false; if(s===1&&(!d.b_subtype||!d.b_conduct||!d.b_rule)) return toast('Captura tipo, conducta y norma incumplida'),false; if(s===3&&!d.b_intervention) return toast('Captura intervención docente'),false; if(s===4&&!d.b_measure) return toast('Selecciona medida formativa'),false; if(s===5&&(!d.b_commitment||!d.b_followup_date)) return toast('Captura compromiso y fecha de seguimiento'),false; }
  if(t==='C'){ if(s===0&&!d.c_student) return toast('Selecciona alumno'),false; if(s===1&&(!d.c_start||!d.c_end)) return toast('Selecciona periodo'),false; if(s===3&&!d.c_contact_response) return toast('Captura contacto o intento de contacto'),false; if(s===4&&(!d.c_risk||!d.c_agreement)) return toast('Captura riesgo y acuerdos'),false; if(s===5&&!d.c_followup_date) return toast('Captura fecha de seguimiento'),false; }
  if(t==='CIT'){ if(s===0&&!d.cit_student) return toast('Selecciona alumno'),false; if(s===1&&!d.cit_tutor) return toast('Captura tutor'),false; if(s===2&&(!d.cit_date||!d.cit_time||!d.cit_place)) return toast('Completa fecha, hora y lugar'),false; if(s===3&&(!d.cit_reason||!d.cit_detail)) return toast('Captura motivo y detalle'),false; if(s===4&&!d.cit_medium) return toast('Selecciona medio de entrega'),false; }
  return true;
}
function prepareBitPreview(){ collectBitStep(); if(bitacoraDraft.status==='borrador') bitacoraDraft.status=bitacoraOperationalStatus(bitacoraDraft); refreshBitacoraComputedFields(bitacoraDraft); bitacoraDraft.documentText=buildBitacoraDocument(bitacoraDraft); currentScreen='bitacoraPreview'; renderCurrentScreen(); }
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
