
const KEY = 'profeqr_v3_comercial';
const DRAFT_KEY = 'profeqr_v4_draft';
// ── WIZARD DRAFT (localStorage) ────────────────────────────────
// NOTA: saveBitacoraDraft() ya existe en el original (guarda a DB).
// Estas funciones usan nombres distintos (wizDraft*) para el borrador local.
function wizDraftSave(){
  if(!bitacoraDraft) return;
  try{ localStorage.setItem(DRAFT_KEY, JSON.stringify({step:bitacoraStep,draft:bitacoraDraft})); }catch(e){}
}
function wizDraftLoad(){
  try{
    const raw=localStorage.getItem(DRAFT_KEY);
    if(!raw) return false;
    const d=JSON.parse(raw);
    const draft=d?.draft;
    if(!draft || typeof draft!=='object' || !['A','B','C','CIT'].includes(draft.type)){
      wizDraftClear();
      return false;
    }
    const steps=(typeof BIT_STEPS!=='undefined' && BIT_STEPS[draft.type]) || [];
    const requestedStep=Math.max(0,Number(d.step)||0);
    bitacoraStep=steps.length ? Math.min(requestedStep,steps.length-1) : requestedStep;
    bitacoraDraft=normalizeBitacoraReport(draft);
    return true;
  }catch(e){
    wizDraftClear();
    return false;
  }
}
function wizDraftClear(){ try{ localStorage.removeItem(DRAFT_KEY); }catch(e){} }
function hasBitacoraDraft(){ return wizDraftExists(); } // alias
function wizDraftExists(){ try{ return !!localStorage.getItem(DRAFT_KEY); }catch(e){ return false; } }
// Aliases para compatibilidad con llamadas previas inyectadas
function loadBitacoraDraft(){ return wizDraftLoad(); }
function clearBitacoraDraft(){ wizDraftClear(); }
// hasBitacoraDraft → alias de wizDraftExists (ver definicion arriba)


const LICENSE_END = '2027-07-30';
const LOGO_MAX_FILE_BYTES = 2*1024*1024;

const CAMPOS = [
  {campo:'Lenguajes',asignaturas:['Español','Inglés','Artes']},
  {campo:'Saberes y Pensamiento Científico',asignaturas:['Matemáticas','Ciencias: Biología','Ciencias: Física','Ciencias: Química','Tecnología']},
  {campo:'Ética, Naturaleza y Sociedades',asignaturas:['Geografía de México y del Mundo','Historia','Formación Cívica y Ética']},
  {campo:'De lo Humano y lo Comunitario',asignaturas:['Educación Física','Educación Socioemocional','Vida Saludable']}
];

const LOGROS = {
  3:{label:'Excelente',color:'#059669'},
  2:{label:'Completo',color:'#2563EB'},
  1:{label:'Incompleto',color:'#D97706'},
  0:{label:'No entregado',color:'#DC2626'}
};

const THEMES = {
  professional:{name:'Profesional',bg:'#F8FAFC',bg2:'#EEF2F7',card:'#FFFFFF',primary:'#1E3A8A',primary2:'#2563EB',primary3:'#2563EB',text:'#1F2937',muted:'#64748B',line:'#E5E7EB',soft:'#EEF2FF',chip:'#E5E7EB'},
  premium:{name:'Premium',bg:'#F8FAFC',bg2:'#EAEFFF',card:'#FFFFFF',primary:'#0F172A',primary2:'#4F46E5',primary3:'#2563EB',text:'#111827',muted:'#6B7280',line:'#E5E7EB',soft:'#EEF2FF',chip:'#E5E7EB'},
  green:{name:'Verde académico',bg:'#F7FBF8',bg2:'#E8F5EC',card:'#FFFFFF',primary:'#166534',primary2:'#15803D',primary3:'#16A34A',text:'#1F2937',muted:'#64748B',line:'#DDE7DF',soft:'#ECFDF5',chip:'#E6F4EA'},
  dark:{name:'Oscura elegante',bg:'#111827',bg2:'#1F2937',card:'#263148',primary:'#1E3A8A',primary2:'#3B82F6',primary3:'#818CF8',text:'#F1F5F9',muted:'#94A3B8',line:'#374151',soft:'#1E3358',chip:'#374151'},
  bw:{name:'Blanco y negro',bg:'#FFFFFF',bg2:'#F5F5F5',card:'#FFFFFF',primary:'#000000',primary2:'#222222',primary3:'#444444',text:'#000000',muted:'#555555',line:'#CCCCCC',soft:'#F0F0F0',chip:'#E0E0E0'},
  bwinv:{name:'Invertido (negro)',bg:'#000000',bg2:'#111111',card:'#1A1A1A',primary:'#FFFFFF',primary2:'#DDDDDD',primary3:'#BBBBBB',text:'#FFFFFF',muted:'#AAAAAA',line:'#333333',soft:'#222222',chip:'#2A2A2A'},
  orangeblue:{name:'Naranja + azul',bg:'#FFF3E0',bg2:'#FCE7CF',card:'#FFFFFF',primary:'#3B5BA9',primary2:'#6FA8DC',primary3:'#F4A261',text:'#1F2937',muted:'#6B7280',line:'#F0D7BA',soft:'#EAF2FF',chip:'#F8DFC5'},
  rosenavy:{name:'Rosa + marino',bg:'#FFF1F2',bg2:'#FCE7EA',card:'#FFFFFF',primary:'#1E3A8A',primary2:'#3B82F6',primary3:'#E9A8A8',text:'#1F2937',muted:'#6B7280',line:'#F1D3D9',soft:'#FDECEC',chip:'#F4D7DD'},
  purplewhite:{name:'Blanco + morado',bg:'#FFFFFF',bg2:'#F8FAFC',card:'#FFFFFF',primary:'#6D28D9',primary2:'#7C3AED',primary3:'#A78BFA',text:'#111827',muted:'#6B7280',line:'#E5E7EB',soft:'#F3E8FF',chip:'#EDE9FE'}
};

const GRADES_BY_LEVEL = {
  'Preescolar':['1°','2°','3°'],
  'Primaria':['1°','2°','3°','4°','5°','6°'],
  'Telesecundaria':['1°','2°','3°']
};

const SECTIONS_BY_SHIFT = {
  'Matutino':['A','B','C'],
  'Vespertino':['G','H','I']
};


const LIBRARY_SECTIONS = ['NEM','Planeación','CTE','Normativa y protocolos','Recursos rápidos','Mi biblioteca'];
const LIBRARY_DEFAULT_RESOURCES = [
  {id:'nem-principios',section:'NEM',title:'Principios de la Nueva Escuela Mexicana',type:'Guía rápida',tags:'NEM, principios, humanismo, comunidad',summary:'Consulta rápida para recordar el enfoque humanista, comunitario, inclusivo e integral de la Nueva Escuela Mexicana. Úsalo como referencia para planeación, acuerdos y lenguaje institucional.',content:'La Nueva Escuela Mexicana coloca al centro la formación integral, la vida comunitaria, la inclusión, la interculturalidad, el pensamiento crítico, la igualdad sustantiva y la participación democrática. Este recurso sirve como recordatorio de trabajo docente y no sustituye documentos oficiales.',favorite:false,custom:false,createdAt:'oficial-base'},
  {id:'nem-campos',section:'NEM',title:'Campos formativos y ejes articuladores',type:'Guía rápida',tags:'campos formativos, ejes articuladores, PDA, proyectos',summary:'Resumen operativo para ubicar campos formativos y ejes articuladores.',content:'Campos formativos: Lenguajes; Saberes y Pensamiento Científico; Ética, Naturaleza y Sociedades; De lo Humano y lo Comunitario. Ejes articuladores: inclusión, pensamiento crítico, interculturalidad crítica, igualdad de género, vida saludable, apropiación de las culturas a través de la lectura y escritura, artes y experiencias estéticas.',favorite:false,custom:false,createdAt:'oficial-base'},
  {id:'planeacion-proyectos',section:'Planeación',title:'Planeación por proyectos',type:'Formato guía',tags:'planeación, proyectos, evaluación formativa, PDA',summary:'Checklist para diseñar proyectos sin perder propósito, producto, proceso y evaluación.',content:'Estructura sugerida: problema o situación contextualizada; propósito; campos formativos; contenidos/PDA; actividades por momentos; recursos; evidencias; criterios de evaluación; instrumentos; ajustes razonables; cierre y socialización.',favorite:false,custom:false,createdAt:'oficial-base'},
  {id:'cte-seguimiento',section:'CTE',title:'Seguimiento de acuerdos CTE',type:'Plantilla',tags:'CTE, acuerdos, responsable, seguimiento',summary:'Guía para convertir acuerdos del CTE en compromisos con responsable, fecha y evidencia.',content:'Todo acuerdo debe quedar como acción verificable: qué se hará, quién es responsable, fecha compromiso, evidencia o producto esperado, estatus y fecha de revisión. En ProfeQr estos acuerdos deben conectarse con Agenda.',favorite:false,custom:false,createdAt:'oficial-base'},
  {id:'convivencia-ley',section:'Normativa y protocolos',title:'Ley de Convivencia Escolar Guanajuato',type:'Normativa',tags:'convivencia, violencia escolar, Guanajuato, protección de datos',summary:'Referencia para reportes de convivencia, protección de datos, deber de denunciar y medidas de protección.',content:'Puntos útiles: la ley busca prevenir, atender y erradicar la violencia en el entorno escolar; establece principios como interés superior del menor, no discriminación, cultura de paz y debida diligencia; contempla protección de datos personales y deber de denunciar violencia escolar a la autoridad educativa correspondiente.',favorite:true,custom:false,createdAt:'oficial-base'},
  {id:'protocolos-asi-acoso-maltrato',section:'Normativa y protocolos',title:'Protocolos SEG: ASI, acoso escolar y maltrato',type:'Protocolo',tags:'abuso sexual infantil, acoso escolar, maltrato, Guanajuato, Aprender a Convivir',summary:'Referencia para casos delicados que requieren detección, actuación, canalización, seguimiento y cuidado de no revictimizar.',content:'Los protocolos orientan la detección, prevención y actuación en situaciones de abuso sexual infantil, acoso escolar y maltrato. En casos delicados conviene registrar hechos observados y manifestaciones espontáneas, evitar interrogatorios repetidos, avisar a dirección y valorar canalización conforme al protocolo.',favorite:true,custom:false,createdAt:'oficial-base'},
  {id:'frases-institucionales',section:'Recursos rápidos',title:'Frases institucionales útiles',type:'Banco de frases',tags:'actas, reportes, redacción, acuerdos',summary:'Frases de apoyo para documentos escolares sin lenguaje acusatorio.',content:'Ejemplos: “Se registra únicamente lo observado y/o referido al momento”; “No constituye diagnóstico ni determinación de autoridad competente”; “Se acuerda dar seguimiento en fecha…”; “Se informa a la madre, padre o tutor para conocimiento y corresponsabilidad”.',favorite:false,custom:false,createdAt:'oficial-base'}
];

let deferredPrompt = null;
let pinBuffer = '', pinFailCount = 0;

let currentScreen = 'home';
let attChart = null;
let worksChart = null;

function emptyDb(){
  return {
    config:null,
    group:{
      name:'1°G',
      level:'Telesecundaria',
      grade:'1°',
      shift:'Vespertino',
      section:'G',
      students:[],
      attendance:{},
      works:[],
      bitacoraReports:[],
      bitacoraMeta:{schemaVersion:1, folioSeq:0},
      agenda:[],
      quickNotes:[],
      cteAgreements:[],
      guardCommissions:[],
      libraryResources:[]
    }
  };
}
function isRecordObject(value){ return !!(value&&typeof value==='object'&&!Array.isArray(value)); }

function normalizeStudentRecord(student={},groupName=''){
  const st=student&&typeof student==='object'&&!Array.isArray(student)?{...student}:{};
  st.id=String(st.id||uid());
  st.listNo=Number(st.listNo ?? st.numero_lista) || 0;
  st.name=String(st.name ?? st.nombre ?? '').trim();
  st.active=isStudentActive(st);
  st.qr=String(st.qr||qrCodeFor(groupName,st.listNo));
  return st;
}
function normalizeAttendanceMap(value){
  const source=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
  const out={};
  Object.entries(source).forEach(([date,valueRows])=>{
    if(!isIsoDate(date) || !Array.isArray(valueRows)) return;
    const seen=new Set();
    const normalized=valueRows.filter(row=>{
      if(!row || typeof row!=='object' || row.studentId===undefined || row.studentId===null || row.studentId==='') return false;
      const key=String(row.studentId);
      if(seen.has(key)) return false;
      seen.add(key);
      return true;
    }).map(row=>({...row,id:String(row.id||uid()),date:String(date),time:String(row.time||''),studentId:String(row.studentId),studentName:String(row.studentName||''),listNo:Number(row.listNo)||0}));
    if(normalized.length) out[date]=normalized;
  });
  return out;
}
function normalizeWorkRecord(work={}){
  const w=work&&typeof work==='object'&&!Array.isArray(work)?{...work}:{};
  w.id=String(w.id||uid());
  w.date=normalizeIsoDate(w.date,'');
  w.campo=String(w.campo||'');
  w.asignatura=String(w.asignatura||'');
  w.title=String(w.title||'').trim();
  w.score=Math.max(0,Math.min(3,Number.isFinite(Number(w.score))?Number(w.score):0));
  w.studentId=String(w.studentId||'');
  w.studentName=String(w.studentName||'');
  w.listNo=Number(w.listNo)||0;
  w.time=String(w.time||'');
  w.key=String(w.key||`${w.date}__${w.campo}__${w.asignatura}__${w.title.toLowerCase()}`);
  return w;
}
function attendanceRegisteredDates(attendance=db?.group?.attendance||{},range={}){
  const start=String(range?.start||''),end=String(range?.end||'');
  return Object.keys(attendance||{}).filter(date=>{
    const rows=attendance[date];
    return Array.isArray(rows) && rows.length>0 && (!start||date>=start) && (!end||date<=end);
  }).sort();
}
function attendancePresentIds(date){
  return new Set((db?.group?.attendance?.[date]||[]).map(row=>String(row.studentId)));
}

function safeDb(raw){
  const db = raw && typeof raw==='object' && !Array.isArray(raw) ? raw : emptyDb();
  db.config = db.config && typeof db.config==='object' && !Array.isArray(db.config) ? db.config : null;
  db.group = db.group && typeof db.group==='object' && !Array.isArray(db.group) ? db.group : emptyDb().group;
  const groupName=db.config?.group||db.group.name||'1°G';
  db.group.students = Array.isArray(db.group.students) ? db.group.students.filter(isRecordObject).map(st=>normalizeStudentRecord(st,groupName)) : [];
  db.group.attendance = normalizeAttendanceMap(db.group.attendance);
  db.group.works = Array.isArray(db.group.works) ? db.group.works.filter(isRecordObject).map(normalizeWorkRecord) : [];
  db.group.agenda = Array.isArray(db.group.agenda) ? db.group.agenda.filter(isRecordObject).map(normalizeAgendaEvent) : [];
  db.group.quickNotes = Array.isArray(db.group.quickNotes) ? db.group.quickNotes.filter(isRecordObject).map(normalizeQuickNote) : [];
  db.group.cteAgreements = Array.isArray(db.group.cteAgreements) ? db.group.cteAgreements.filter(isRecordObject).map(normalizeCteAgreement) : [];
  db.group.guardCommissions = Array.isArray(db.group.guardCommissions) ? db.group.guardCommissions.filter(isRecordObject).map(normalizeGuardCommission) : [];
  db.group.libraryResources = Array.isArray(db.group.libraryResources) ? db.group.libraryResources.filter(isRecordObject).map(normalizeLibraryResource) : [];
  db.group.bitacoraMeta = isRecordObject(db.group.bitacoraMeta) ? db.group.bitacoraMeta : {schemaVersion:1, folioSeq:0};
  db.group.bitacoraMeta.schemaVersion = Number(db.group.bitacoraMeta.schemaVersion) || 1;
  db.group.bitacoraMeta.folioSeq = Number(db.group.bitacoraMeta.folioSeq) || 0;
  const currentBitacora=Array.isArray(db.group.bitacoraReports)?db.group.bitacoraReports:[];
  const legacyBitacora=Array.isArray(db.group.reportes)?db.group.reportes:[];
  const previousBitacora=(currentBitacora.length?currentBitacora:legacyBitacora).filter(isRecordObject);
  let folioSeq=Math.max(db.group.bitacoraMeta.folioSeq,...previousBitacora.map(extractBitacoraFolioSeq),0);
  const seenFolios=new Set();
  db.group.bitacoraReports = previousBitacora.map(source=>{
    const report=normalizeBitacoraReport(source,db);
    if(!source?.folio || seenFolios.has(String(report.folio))){
      folioSeq++;
      const year=/^\d{4}$/.test(String(report.date||'').slice(0,4))?String(report.date).slice(0,4):String(new Date().getFullYear());
      report.folio=`BPF-${year}-${String(folioSeq).padStart(4,'0')}`;
    }
    seenFolios.add(String(report.folio));
    folioSeq=Math.max(folioSeq,extractBitacoraFolioSeq(report));
    return report;
  });
  db.group.bitacoraMeta.folioSeq = folioSeq;
  if(db.config){
    db.config.logo = safeImageSrc(db.config.logo,'');
    db.config.director = db.config.director || '';
    db.config.zone = db.config.zone || '';
    db.config.sector = db.config.sector || '';
    db.config.municipality = db.config.municipality || '';
    db.config.address = db.config.address || '';
    db.config.cycle = db.config.cycle || '';
  }
  return db;
}

// La base se hidrata al final del arranque, cuando todos los normalizadores
// de los módulos ya fueron definidos. Esto evita dependencias de orden de carga.
let db = emptyDb();
let dbHydrated = false;
function hydrateDb(){
  if(dbHydrated) return db;
  try{
    db = safeDb(JSON.parse(localStorage.getItem(KEY)) || emptyDb());
  }catch(e){
    console.error('hydrateDb error:', e);
    db = emptyDb();
  }
  dbHydrated = true;
  return db;
}

function restorePersistedDb(){
  try{ db=safeDb(JSON.parse(localStorage.getItem(KEY))||emptyDb()); return true; }
  catch(e){ console.error('restorePersistedDb error:',e); return false; }
}
function saveDb(options={}){
  const system=!!(options&&options.system===true);
  if(!system && typeof canWrite==='function' && !canWrite()){
    restorePersistedDb();
    writeBlockedMessage();
    return false;
  }
  try{
    localStorage.setItem(KEY, JSON.stringify(db));
    return true;
  }catch(e){
    restorePersistedDb();
    if(e && (e.name === 'QuotaExceededError' || e.code === 22)){
      toast('⚠️ Almacenamiento lleno. Exporta un respaldo desde Ajustes.');
    } else {
      console.error('saveDb error:', e);
      toast('No se pudo guardar la información');
    }
    return false;
  }
}
function uid(){ return Math.random().toString(36).slice(2)+Date.now().toString(36); }
function today(){ const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function isIsoDate(value){
  const s=String(value||'');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const parsed=new Date(s+'T00:00:00Z');
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0,10)===s;
}
function normalizeIsoDate(value,fallback=today()){ return isIsoDate(value)?String(value):fallback; }
function nowTime(){ const d=new Date(); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`; }
function slug(s=''){ return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase(); }
function qrCodeFor(group,listNo){
  // FIX v4: sin CCT para mantener compatibilidad con tarjetas existentes
  const grp = String(group||'').replace(/[°\s]/g,'').toUpperCase();
  return grp + String(listNo).padStart(2,'0');
}
function esc(s=''){ return String(s).replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[m])); }
function safeImageSrc(value='',fallback='./icons/icon-192.png'){
  const src=String(value||'').trim();
  if(!src) return fallback;
  if(src.length>Math.ceil(LOGO_MAX_FILE_BYTES*4/3)+256) return fallback;
  if(/^\.\/icons\/[a-z0-9._/-]+$/i.test(src) && !src.includes('..')) return src;
  if(/^data:image\/(?:png|jpe?g|gif|webp|bmp|x-icon);base64,[a-z0-9+/=\s]+$/i.test(src)) return src;
  return fallback;
}
function safeFileName(value='archivo'){
  const clean=String(value||'archivo').replace(/[<>:"/\\|?*\u0000-\u001F]/g,'_').replace(/\s+/g,' ').trim();
  return clean||'archivo';
}
function isStudentActive(s){
  if(!s) return false;
  return s.active !== false && s.activo !== false && s.status !== 'inactive';
}
function getActiveStudents(){
  return (db.group.students || [])
    .filter(isStudentActive)
    .sort((a,b)=>(Number(a.listNo || a.numero_lista || 999))-(Number(b.listNo || b.numero_lista || 999)) || String(a.name || a.nombre || '').localeCompare(String(b.name || b.nombre || '')));
}
// Alias de compatibilidad: varias pantallas de Bitácora usan activeStudents().
// No modifica la lógica de ProfeQr; solo evita ReferenceError en el módulo de Bitácora.
function activeStudents(){ return getActiveStudents(); }
function getAllStudents(){ return db.group.students || []; }
function findStudent(id){ return (db.group.students || []).find(s=>String(s.id)===String(id)); }
function getStudentLabel(id){ const s=findStudent(id); return s ? `${s.listNo || s.numero_lista || ''}. ${s.name || s.nombre || ''}` : 'Alumno no encontrado'; }
function calculateAbsences(studentId, startDate, endDate){
  if(!studentId || !startDate || !endDate) return [];
  const attendance = db.group && db.group.attendance ? db.group.attendance : {};
  const dates = attendanceRegisteredDates(attendance,{start:startDate,end:endDate});
  const absences = [];
  dates.forEach(date => {
    const rows = Array.isArray(attendance[date]) ? attendance[date] : [];
    const present = rows.some(r => String(r.studentId) === String(studentId));
    if(!present) absences.push(date);
  });
  return absences;
}
function downloadTextFile(filename, content, type='text/plain;charset=utf-8'){ const blob=new Blob([content],{type}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=safeFileName(filename); a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1200); }

function extractBitacoraFolioSeq(report){
  const m = String(report?.folio || '').match(/(\d+)(?!.*\d)/);
  return m ? Number(m[1]) || 0 : 0;
}
function buildBitacoraInstitutionalSnapshot(sourceDb=null){
  const rootDb = sourceDb && typeof sourceDb==='object' && !Array.isArray(sourceDb) ? sourceDb : ((typeof db !== 'undefined' && db) ? db : {});
  const c = rootDb.config || {}, g = rootDb.group || {};
  return {school:c.school||'', cct:c.cct||'', shift:c.shift||g.shift||'', group:c.group||g.name||'', grade:c.grade||g.grade||'', zone:c.zone||'', sector:c.sector||'', municipality:c.municipality||'', address:c.address||'', cycle:c.cycle||'', teacher:c.teacher||'', director:c.director||'', level:c.level||g.level||''};
}
function getBitacoraSpecificType(report){ const d=report?.data||{}; return d.a_subtype||d.b_subtype||d.c_reason||d.cit_reason||''; }
function getBitacoraSeverity(report){ const d=report?.data||{}; if(report?.type==='A') return d.a_severity||''; if(report?.type==='C') return d.c_risk||''; return d.b_repeat||''; }
function getBitacoraFollowUpDate(report){
  const d=report?.data||{};
  const keys=report?.type==='A'?['a_followup_date']:report?.type==='B'?['b_followup_date']:report?.type==='C'?['c_followup_date','c_next_date']:report?.type==='CIT'?['cit_date']:['a_followup_date','b_followup_date','c_followup_date','c_next_date','cit_date'];
  for(const key of keys){
    if(Object.prototype.hasOwnProperty.call(d,key)) return String(d[key]||'');
  }
  return String(report?.followUp?.date||'');
}
function getBitacoraFollowUpResponsible(report){
  const d=report?.data||{};
  const key=report?.type==='A'?'a_followup_responsible':report?.type==='B'?'b_followup_responsible':report?.type==='C'?'c_followup_responsible':'';
  if(key && Object.prototype.hasOwnProperty.call(d,key)) return String(d[key]||'');
  return String(report?.followUp?.responsible||'');
}
function syncBitacoraFollowUp(report){
  if(!report) return {};
  const previous=report.followUp&&typeof report.followUp==='object'&&!Array.isArray(report.followUp)?report.followUp:{};
  report.followUp={...previous,date:getBitacoraFollowUpDate(report),responsible:getBitacoraFollowUpResponsible(report),notes:String(previous.notes||'')};
  return report.followUp;
}
function isNegativeChoice(value){
  return ['','no','no aplica','ninguna','ninguno','no localizado','no se logro contacto'].includes(slug(value));
}
function isAffirmativeChoice(value){
  return value===true || ['si','true','1'].includes(slug(value));
}
function isNoContactChoice(value){
  return ['no','no localizado','no se logro contacto'].includes(slug(value));
}
function hasBitacoraChannel(report){
  const d=report?.data||report||{};
  if(report?.type==='A') return Array.isArray(d.a_channel) ? d.a_channel.some(value=>!isNegativeChoice(value)) : !isNegativeChoice(d.a_channel);
  if(report?.type==='C') return !isNegativeChoice(d.c_channel);
  return false;
}
function bitacoraTutorNotificationStatus(report){
  const d=report?.data||{};
  const direct=report?.type==='A' ? d.a_notice_tutor : report?.type==='B' ? d.b_notice_tutor : '';
  if(direct!==undefined && direct!==null && String(direct).trim()) return String(direct).trim().toLowerCase();
  if(report?.type==='C'){
    const medium=String(d.c_contact_medium||'').trim();
    if(!medium && !isAffirmativeChoice(d.c_no_response)) return '';
    return isNoContactChoice(medium)||isAffirmativeChoice(d.c_no_response) ? 'no localizado' : 'sí';
  }
  return '';
}

function isBitacoraOverdue(report){
  const status=buildReportStatus(report); const f=getBitacoraFollowUpDate(report);
  return !!(f && f < today() && status !== 'cerrado');
}
function bitacoraSameStudentReports(report){
  const ids=new Set((report?.studentIds||[]).map(String));
  if(!ids.size) return [];
  // Evita recursión: no normalizar aquí, porque normalizeBitacoraReport calcula semáforo y puede consultar reincidencia.
  return (db.group.bitacoraReports||[]).filter(r=>r && String(r.id)!==String(report.id) && (Array.isArray(r.studentIds)?r.studentIds:[]).some(id=>ids.has(String(id))));
}
function isBitacoraRecurrent(report){ return bitacoraSameStudentReports(report).length >= 2; }
function bitacoraNextStep(report){
  const status=buildReportStatus(report);
  if(status==='cerrado') return 'Caso cerrado. Verificar cumplimiento de acuerdos cuando corresponda.';
  if(isBitacoraOverdue(report)) return 'Seguimiento vencido: actualizar acuerdos o cerrar con evidencia.';
  if(report?.type==='A' && buildReportTrafficLight(report)==='rojo') return 'Revisar medidas de protección, notificación y canalización.';
  if(report?.type==='C' && buildReportTrafficLight(report)==='rojo') return 'Priorizar contacto familiar, citatorio o seguimiento directivo.';
  const f=getBitacoraFollowUpDate(report); if(f) return `Dar seguimiento el ${f}.`;
  return 'Programar fecha de seguimiento.';
}
function bitacoraSummary(reports){
  const arr=(reports||[]).map(normalizeBitacoraReport);
  return {
    total:arr.length,
    abiertos:arr.filter(r=>buildReportStatus(r)!=='cerrado').length,
    cerrados:arr.filter(r=>buildReportStatus(r)==='cerrado').length,
    rojos:arr.filter(r=>buildReportTrafficLight(r)==='rojo').length,
    amarillos:arr.filter(r=>buildReportTrafficLight(r)==='amarillo').length,
    vencidos:arr.filter(isBitacoraOverdue).length,
    proximos:arr.filter(r=>{const f=getBitacoraFollowUpDate(r); return f && f>=today() && buildReportStatus(r)!=='cerrado';}).length,
    reincidentes:new Set(arr.filter(isBitacoraRecurrent).flatMap(r=>r.studentIds||[])).size
  };
}
function bitacoraStudentReincidence(studentId){ return (db.group.bitacoraReports||[]).map(normalizeBitacoraReport).filter(r=>(r.studentIds||[]).some(id=>String(id)===String(studentId))).length; }
function buildReportStatus(report){
  const status=report?.status||'';
  if(['borrador','abierto','en seguimiento','cerrado','canalizado'].includes(status)) return status;
  const d=report?.data||{};
  if(hasBitacoraChannel(report)) return 'canalizado';
  if(getBitacoraFollowUpDate(report)) return 'en seguimiento';
  return 'abierto';
}
function buildReportTrafficLight(report){
  const status=buildReportStatus(report); const d=report?.data||{}; const risks=Array.isArray(d.riskFlags)?d.riskFlags:[];
  const severeA=report?.type==='A'&&(String(d.a_severity||'').toLowerCase()==='grave'||risks.length>0||hasBitacoraChannel(report));
  const noContact=isNoContactChoice(d.c_contact_medium);
  const severeC=report?.type==='C'&&(String(d.c_risk||'').toLowerCase()==='alto'||isAffirmativeChoice(d.c_no_response)||noContact||hasBitacoraChannel(report));
  const follow=getBitacoraFollowUpDate(report); const overdue=follow&&follow<today()&&status!=='cerrado';
  const recurrent = (typeof db !== 'undefined' && db?.group?.bitacoraReports) ? isBitacoraRecurrent(report) : false;
  if(status==='borrador') return 'gris';
  if(status==='cerrado') return 'verde';
  if(severeA||severeC||status==='canalizado'||overdue||recurrent) return 'rojo';
  return 'amarillo';
}
function cloneBitacoraValue(value){ try{ return JSON.parse(JSON.stringify(value)); }catch(e){ return value; } }
function bitacoraOperationalStatus(report){
  return bitacoraDataStatus(report)||'abierto';
}
function bitacoraDataStatus(report){
  const r=report||{}, d=r.data||{};
  const candidate=r.type==='A'?d.a_status:r.type==='B'?d.b_status:r.type==='C'?d.c_status:'';
  return ['abierto','en seguimiento','canalizado','cerrado'].includes(candidate) ? candidate : '';
}
function setBitacoraOperationalStatus(report,status){
  if(!report) return report;
  const allowed=['abierto','en seguimiento','canalizado','cerrado'];
  const next=allowed.includes(status)?status:'abierto';
  report.data=report.data&&typeof report.data==='object'&&!Array.isArray(report.data)?report.data:{};
  if(report.type==='A') report.data.a_status=next;
  if(report.type==='B') report.data.b_status=next;
  if(report.type==='C') report.data.c_status=next;
  report.status=next;
  return report;
}
function bitacoraVersionSnapshot(report, reason='versión'){
  const r=report||{};
  return {revision:Number(r.revision)||1,reason,capturedAt:new Date().toISOString(),status:buildReportStatus(r),closedAt:r.closedAt||'',updatedAt:r.updatedAt||'',date:r.date||'',time:r.time||'',eventDate:r.eventDate||'',eventTime:r.eventTime||'',studentIds:cloneBitacoraValue(r.studentIds||[]),institutional:cloneBitacoraValue(r.institutional||{}),reporter:cloneBitacoraValue(r.reporter||{}),data:cloneBitacoraValue(r.data||{}),followUp:cloneBitacoraValue(r.followUp||{}),documentText:String(r.documentText||'')};
}
function appendBitacoraVersion(report, reason='versión'){ if(!report) return report; report.versions=Array.isArray(report.versions)?report.versions:[]; report.versions.push(bitacoraVersionSnapshot(report,reason)); return report; }
function appendBitacoraAudit(report, action, detail=''){ if(!report) return report; report.auditTrail=Array.isArray(report.auditTrail)?report.auditTrail:[]; report.auditTrail.push({at:new Date().toISOString(),action,detail,revision:Number(report.revision)||1}); return report; }
function normalizeBitacoraReport(report,sourceDb=null){
  const r=report&&typeof report==='object'&&!Array.isArray(report)?{...report}:{};
  const contextDb=sourceDb&&typeof sourceDb==='object'&&!Array.isArray(sourceDb)?sourceDb:((typeof db !== 'undefined'&&db)?db:{});
  const contextConfig=contextDb.config||{};
  r.id=String(r.id||uid()); r.schemaVersion=Math.max(Number(r.schemaVersion)||1,3); r.type=['A','B','C','CIT'].includes(r.type||r.route)?(r.type||r.route):'A'; r.route=r.type;
  r.folio=String(r.folio||`BPF-${new Date().getFullYear()}-${String(extractBitacoraFolioSeq(r)||1).padStart(4,'0')}`);
  r.createdAt=String(r.createdAt||new Date().toISOString()); r.updatedAt=String(r.updatedAt||r.createdAt); r.date=normalizeIsoDate(r.date,today()); r.time=String(r.time||nowTime().slice(0,5));
  r.eventDate=normalizeIsoDate(r.eventDate,r.date); r.eventTime=String(r.eventTime||r.time); r.institutional=(r.institutional&&typeof r.institutional==='object'&&!Array.isArray(r.institutional))?r.institutional:buildBitacoraInstitutionalSnapshot(contextDb);
  r.reporter=(r.reporter&&typeof r.reporter==='object'&&!Array.isArray(r.reporter))?r.reporter:{name:contextConfig.teacher||'',role:'docente',source:'observación directa'};
  r.studentIds=Array.isArray(r.studentIds)?[...new Set(r.studentIds.filter(id=>id!==undefined&&id!==null&&id!=='').map(String))]:[]; r.data=(r.data&&typeof r.data==='object'&&!Array.isArray(r.data))?r.data:{};
  r.revision=Math.max(Number(r.revision)||1,1); r.versions=Array.isArray(r.versions)?r.versions:[]; r.auditTrail=Array.isArray(r.auditTrail)?r.auditTrail:[]; r.closedAt=String(r.closedAt||''); r.reopenedAt=String(r.reopenedAt||'');
  r.followUp=(r.followUp&&typeof r.followUp==='object'&&!Array.isArray(r.followUp))?r.followUp:{date:'',responsible:contextConfig.teacher||'',notes:''};
  syncBitacoraFollowUp(r);
  const dataStatus=bitacoraDataStatus(r);
  if(!['borrador','cerrado'].includes(r.status) && dataStatus) r.status=dataStatus;
  r.status=buildReportStatus(r); r.trafficLight=buildReportTrafficLight(r); r.documentText=String(r.documentText||'');
  return r;
}
function refreshBitacoraComputedFields(report){
  if(!report) return report;
  if(buildReportStatus(report)!=='cerrado') report.updatedAt=new Date().toISOString(); report.institutional=report.institutional||buildBitacoraInstitutionalSnapshot();
  report.reporter=report.reporter||{name:db.config?.teacher||'',role:'docente',source:'observación directa'};
  report.eventDate=report.eventDate||report.date||today(); report.eventTime=report.eventTime||report.time||nowTime().slice(0,5);
  report.followUp=(report.followUp&&typeof report.followUp==='object'&&!Array.isArray(report.followUp))?report.followUp:{date:'',responsible:db.config?.teacher||'',notes:''};
  syncBitacoraFollowUp(report); report.status=buildReportStatus(report); report.trafficLight=buildReportTrafficLight(report); return report;
}

function applyTheme(themeName){
  const t = THEMES[themeName] || THEMES.professional;
  const root = document.documentElement;
  // FIX v4: body class para CSS específico de tema (dark, bw, bwinv)
  document.body.className = '';
  if(themeName === 'dark') document.body.classList.add('dark');
  if(themeName === 'bw') document.body.classList.add('bw');
  if(themeName === 'bwinv') document.body.classList.add('bwinv');
  Object.entries({bg:t.bg,bg2:t.bg2,card:t.card,primary:t.primary,primary2:t.primary2,primary3:t.primary3,text:t.text,muted:t.muted,line:t.line,soft:t.soft,chip:t.chip}).forEach(([k,v])=>root.style.setProperty(`--${k}`,v));
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t.primary);
}

function toast(msg){
  const el = document.getElementById('toast');
  if(!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(()=>el.classList.add('hidden'),2200);
}

// RC Core 6: licenseExpiryDate(), isExpired(), canWrite() y writeBlockedMessage() viven en license.js.

window.addEventListener('error', e => {
  console.error(e);
  toast('Ocurrió un error en la app');
});

class ContinuousQRScanner {
  constructor(){
    this.scanner = null;
    this.scanning = false;
    this.busy = false;
    this.lastScan = '';
    this.lastTime = 0;
    this.statusEl = null;
    this.lastNameEl = null;
    this.historyEl = null;
    this.onDecoded = null;
  }
  setStatus(msg, type='primary'){
    if(!this.statusEl) return;
    this.statusEl.className = `badge ${type}`;
    this.statusEl.textContent = msg;
  }
  setLastName(name){
    if(!this.lastNameEl) return;
    this.lastNameEl.textContent = name || 'Esperando lectura...';
  }
  updateHistory(items){
    if(!this.historyEl) return;
    this.historyEl.innerHTML = items.length
      ? items.slice(0,8).map(h=>`<div class="item"><div><div class="item-title">${esc(h.label)}</div><div class="item-sub">${esc(h.meta)}</div></div></div>`).join('')
      : '<div class="small">Sin registros todavía.</div>';
  }
  updateCounters(values){
    Object.entries(values || {}).forEach(([id,val])=>{
      const el = document.getElementById(id);
      if(el) el.textContent = String(val);
    });
  }
  async start({containerId,statusEl,lastNameEl,historyEl,onDecoded}){
    if(this.scanning) return;
    this.statusEl = statusEl;
    this.lastNameEl = lastNameEl;
    this.historyEl = historyEl;
    this.onDecoded = onDecoded;

    const container = document.getElementById(containerId);
    if(container) container.innerHTML = '';

    try{
      if(typeof Html5Qrcode === 'undefined'){
        this.setStatus('Librería QR no disponible — conecta a internet','bad');
        toast('Escaneo QR no disponible. Recarga con conexión a internet.');
        this.scanning = false; return;
      }
      this.scanner = new Html5Qrcode(containerId, {verbose:false});
      await this.scanner.start(
        {facingMode:'environment'},
        {
          fps:18,
          qrbox:(w,h)=>{ const s=Math.min(w,h)*0.72; return {width:s,height:s}; },
          aspectRatio:1.0,
          disableFlip:false
        },
        async decodedText => {
          const code = (decodedText || '').trim();
          const now = Date.now();
          if(!code) return;
          if(this.busy) return;
          if(code === this.lastScan && (now - this.lastTime) < 2000) return;

          this.busy = true;
          this.lastScan = code;
          this.lastTime = now;
          this.setStatus('Procesando...', 'primary');

          try{
            const result = await Promise.resolve(this.onDecoded(code));
            if(!result || result.valid === false){
              this.setStatus(result?.status || 'QR inválido', 'bad');
              this.setLastName(result?.name || 'Código no reconocido');
            }else{
              this.setStatus(result.status || 'Registrado', result.statusType || 'ok');
              this.setLastName(result.name || 'Registro actualizado');
              if(result.history) this.updateHistory(result.history);
              if(result.counters) this.updateCounters(result.counters);

              if(this.scanner && typeof this.scanner.pause === 'function'){
                try{
                  this.scanner.pause(true);
                  setTimeout(()=>{ try{ this.scanner && this.scanner.resume(); }catch(e){} }, 900);
                }catch(e){}
              }
            }
          }catch(err){
            console.error(err);
            this.setStatus('Error al registrar', 'bad');
          }finally{
            setTimeout(()=>{ this.busy = false; if(this.scanning) this.setStatus('Cámara activa', 'ok'); }, 350);
          }
        },
        ()=>{}
      );
      this.scanning = true;
      this.setStatus('Cámara activa', 'ok');
      this.setLastName('Esperando lectura...');
    }catch(err){
      console.error(err);
      this.setStatus('No se pudo acceder a la cámara', 'bad');
      toast('No se pudo acceder a la cámara');
      this.scanning = false;
    }
  }
  async stop(){
    if(this.scanner){
      try{ await this.scanner.stop(); }catch(e){}
      try{ await this.scanner.clear(); }catch(e){}
    }
    this.scanner = null;
    this.scanning = false;
    this.busy = false;
    this.lastScan = '';
    this.lastTime = 0;
    this.setStatus('Cámara apagada', 'primary');
    this.setLastName('Esperando lectura...');
  }
}

const attendanceScanner = new ContinuousQRScanner();
const worksScanner = new ContinuousQRScanner();

function destroyCharts(){
  if(attChart){ attChart.destroy(); attChart = null; }
  if(worksChart){ worksChart.destroy(); worksChart = null; }
}

async function stopDynamicModules(){
  await attendanceScanner.stop();
  await worksScanner.stop();
  destroyCharts();
}
