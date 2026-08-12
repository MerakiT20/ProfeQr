
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
    bitacoraStep=Number(d.step)||0; bitacoraDraft=d.draft||null;
    return !!bitacoraDraft;
  }catch(e){ return false; }
}
function wizDraftClear(){ try{ localStorage.removeItem(DRAFT_KEY); }catch(e){} }
function hasBitacoraDraft(){ return wizDraftExists(); } // alias
function wizDraftExists(){ return !!localStorage.getItem(DRAFT_KEY); }
// Aliases para compatibilidad con llamadas previas inyectadas
function loadBitacoraDraft(){ return wizDraftLoad(); }
function clearBitacoraDraft(){ wizDraftClear(); }
// hasBitacoraDraft → alias de wizDraftExists (ver definicion arriba)


const LICENSE_END = '2027-07-30';

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

function safeDb(raw){
  const db = raw || emptyDb();
  db.group = db.group || emptyDb().group;
  db.group.students = Array.isArray(db.group.students) ? db.group.students : [];
  db.group.attendance = db.group.attendance && typeof db.group.attendance === 'object' ? db.group.attendance : {};
  db.group.works = Array.isArray(db.group.works) ? db.group.works : [];
  db.group.agenda = Array.isArray(db.group.agenda) ? db.group.agenda.map(normalizeAgendaEvent) : [];
  db.group.quickNotes = Array.isArray(db.group.quickNotes) ? db.group.quickNotes.map(normalizeQuickNote) : [];
  db.group.cteAgreements = Array.isArray(db.group.cteAgreements) ? db.group.cteAgreements.map(normalizeCteAgreement) : [];
  db.group.guardCommissions = Array.isArray(db.group.guardCommissions) ? db.group.guardCommissions.map(normalizeGuardCommission) : [];
  db.group.libraryResources = Array.isArray(db.group.libraryResources) ? db.group.libraryResources.map(normalizeLibraryResource) : [];
  db.group.bitacoraMeta = (db.group.bitacoraMeta && typeof db.group.bitacoraMeta === 'object') ? db.group.bitacoraMeta : {schemaVersion:1, folioSeq:0};
  db.group.bitacoraMeta.schemaVersion = Number(db.group.bitacoraMeta.schemaVersion) || 1;
  db.group.bitacoraMeta.folioSeq = Number(db.group.bitacoraMeta.folioSeq) || 0;
  const previousBitacora = Array.isArray(db.group.bitacoraReports) ? db.group.bitacoraReports : (Array.isArray(db.group.reportes) ? db.group.reportes : []);
  db.group.bitacoraReports = previousBitacora.map(normalizeBitacoraReport);
  db.group.bitacoraMeta.folioSeq = Math.max(db.group.bitacoraMeta.folioSeq, ...db.group.bitacoraReports.map(extractBitacoraFolioSeq), 0);
  db.group.students = db.group.students.map(st=>({...st, active: st.active !== false}));
  db.config = db.config || null;
  if(db.config){
    db.config.director = db.config.director || '';
    db.config.zone = db.config.zone || '';
    db.config.sector = db.config.sector || '';
    db.config.municipality = db.config.municipality || '';
    db.config.address = db.config.address || '';
    db.config.cycle = db.config.cycle || '';
  }
  return db;
}

let db;
try{
  db = safeDb(JSON.parse(localStorage.getItem(KEY)) || emptyDb());
}catch(e){
  db = emptyDb();
}

function saveDb(){
  try{
    localStorage.setItem(KEY, JSON.stringify(db));
    return true;
  }catch(e){
    if(e && (e.name === 'QuotaExceededError' || e.code === 22)){
      toast('⚠️ Almacenamiento lleno. Exporta un respaldo JSON desde Ajustes.');
    } else {
      console.error('saveDb error:', e);
      toast('No se pudo guardar la información');
    }
    return false;
  }
}
function uid(){ return Math.random().toString(36).slice(2)+Date.now().toString(36); }
function today(){ return new Date().toISOString().slice(0,10); }
function nowTime(){ const d=new Date(); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`; }
function slug(s=''){ return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase(); }
function qrCodeFor(group,listNo){
  // FIX v4: sin CCT para mantener compatibilidad con tarjetas existentes
  const grp = String(group||'').replace(/[°\s]/g,'').toUpperCase();
  return grp + String(listNo).padStart(2,'0');
}
function esc(s=''){ return String(s).replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[m])); }
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
function findStudent(id){ return (db.group.students || []).find(s=>s.id===id); }
function getStudentLabel(id){ const s=findStudent(id); return s ? `${s.listNo || s.numero_lista || ''}. ${s.name || s.nombre || ''}` : 'Alumno no encontrado'; }
function calculateAbsences(studentId, startDate, endDate){
  if(!studentId || !startDate || !endDate) return [];
  const attendance = db.group && db.group.attendance ? db.group.attendance : {};
  const dates = Object.keys(attendance).filter(d => d >= startDate && d <= endDate).sort();
  const absences = [];
  dates.forEach(date => {
    const rows = Array.isArray(attendance[date]) ? attendance[date] : [];
    // Solo contamos ausencia en días donde sí hubo pase de lista capturado.
    if(!rows.length) return;
    const present = rows.some(r => r.studentId === studentId);
    if(!present) absences.push(date);
  });
  return absences;
}
function downloadTextFile(filename, content, type='text/plain;charset=utf-8'){ const blob=new Blob([content],{type}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1200); }

function extractBitacoraFolioSeq(report){
  const m = String(report?.folio || '').match(/(\d+)(?!.*\d)/);
  return m ? Number(m[1]) || 0 : 0;
}
function buildBitacoraInstitutionalSnapshot(){
  const rootDb = (typeof db !== 'undefined' && db) ? db : {};
  const c = rootDb.config || {}, g = rootDb.group || {};
  return {school:c.school||'', cct:c.cct||'', shift:c.shift||g.shift||'', group:c.group||g.name||'', grade:c.grade||g.grade||'', zone:c.zone||'', sector:c.sector||'', municipality:c.municipality||'', address:c.address||'', cycle:c.cycle||'', teacher:c.teacher||'', director:c.director||'', level:c.level||g.level||''};
}
function getBitacoraSpecificType(report){ const d=report?.data||{}; return d.a_subtype||d.b_subtype||d.c_reason||d.cit_reason||''; }
function getBitacoraSeverity(report){ const d=report?.data||{}; if(report?.type==='A') return d.a_severity||''; if(report?.type==='C') return d.c_risk||''; return d.b_repeat||''; }
function getBitacoraFollowUpDate(report){ const d=report?.data||{}; return d.a_followup_date||d.b_followup_date||d.c_followup_date||d.c_next_date||d.cit_date||''; }

function isBitacoraOverdue(report){
  const status=buildReportStatus(report); const f=getBitacoraFollowUpDate(report);
  return !!(f && f < today() && status !== 'cerrado');
}
function bitacoraSameStudentReports(report){
  const ids=new Set(report?.studentIds||[]);
  if(!ids.size) return [];
  // Evita recursión: no normalizar aquí, porque normalizeBitacoraReport calcula semáforo y puede consultar reincidencia.
  return (db.group.bitacoraReports||[]).filter(r=>r && r.id!==report.id && (Array.isArray(r.studentIds)?r.studentIds:[]).some(id=>ids.has(id)));
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
function bitacoraStudentReincidence(studentId){ return (db.group.bitacoraReports||[]).map(normalizeBitacoraReport).filter(r=>(r.studentIds||[]).includes(studentId)).length; }
function buildReportStatus(report){
  const status=report?.status||'';
  if(['borrador','abierto','en seguimiento','cerrado','canalizado'].includes(status)) return status;
  const d=report?.data||{};
  if(d.a_channel||d.c_channel) return 'canalizado';
  if(getBitacoraFollowUpDate(report)) return 'en seguimiento';
  return 'abierto';
}
function buildReportTrafficLight(report){
  const status=buildReportStatus(report); const d=report?.data||{}; const risks=Array.isArray(d.riskFlags)?d.riskFlags:[];
  const severeA=report?.type==='A'&&(String(d.a_severity||'').toLowerCase()==='grave'||risks.length>0||d.a_channel);
  const severeC=report?.type==='C'&&(String(d.c_risk||'').toLowerCase()==='alto'||d.c_no_response||d.c_channel);
  const follow=getBitacoraFollowUpDate(report); const overdue=follow&&follow<today()&&status!=='cerrado';
  const recurrent = (typeof db !== 'undefined' && db?.group?.bitacoraReports) ? isBitacoraRecurrent(report) : false;
  if(status==='borrador') return 'gris';
  if(status==='cerrado') return 'verde';
  if(severeA||severeC||status==='canalizado'||overdue||recurrent) return 'rojo';
  return 'amarillo';
}
function normalizeBitacoraReport(report){
  const r=report&&typeof report==='object'?{...report}:{};
  r.id=r.id||uid(); r.schemaVersion=Number(r.schemaVersion)||1; r.type=r.type||r.route||'A'; r.route=r.route||r.type;
  r.folio=r.folio||`BPF-${new Date().getFullYear()}-${String(extractBitacoraFolioSeq(r)||1).padStart(4,'0')}`;
  r.createdAt=r.createdAt||new Date().toISOString(); r.updatedAt=r.updatedAt||r.createdAt; r.date=r.date||today(); r.time=r.time||nowTime().slice(0,5);
  r.eventDate=r.eventDate||r.date; r.eventTime=r.eventTime||r.time; r.institutional=r.institutional||buildBitacoraInstitutionalSnapshot();
  r.reporter=r.reporter||{name:(((typeof db !== 'undefined' && db) ? db.config : null)?.teacher||''),role:'docente',source:'observación directa'};
  r.studentIds=Array.isArray(r.studentIds)?r.studentIds.filter(Boolean):[]; r.data=(r.data&&typeof r.data==='object')?r.data:{};
  r.status=buildReportStatus(r); r.trafficLight=buildReportTrafficLight(r);
  r.followUp=r.followUp||{date:getBitacoraFollowUpDate(r),responsible:(((typeof db !== 'undefined' && db) ? db.config : null)?.teacher||''),notes:''}; r.documentText=r.documentText||'';
  return r;
}
function refreshBitacoraComputedFields(report){
  if(!report) return report;
  report.updatedAt=new Date().toISOString(); report.institutional=report.institutional||buildBitacoraInstitutionalSnapshot();
  report.reporter=report.reporter||{name:db.config?.teacher||'',role:'docente',source:'observación directa'};
  report.eventDate=report.eventDate||report.date||today(); report.eventTime=report.eventTime||report.time||nowTime().slice(0,5);
  report.status=buildReportStatus(report); report.trafficLight=buildReportTrafficLight(report);
  report.followUp=report.followUp||{date:getBitacoraFollowUpDate(report),responsible:db.config?.teacher||'',notes:''}; return report;
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

function isExpired(){ return today() > LICENSE_END; }
function canWrite(){ return !isExpired(); }
function writeBlockedMessage(){ toast('La licencia de este ciclo venció el 30 de julio de 2027. Puedes consultar y exportar, pero no capturar nuevos datos.'); }

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


// ── PIN ──
function initApp(){
  if(!db.config){ document.getElementById('root').innerHTML=renderSetup(); bindSetup(); return; }
  if(db.config.pin){ showPinScreen(); } else { applyTheme(db.config.theme||'professional'); renderApp(); }
}
function showPinScreen(){
  pinBuffer=''; pinFailCount=0; applyTheme(db.config.theme||'professional');
  const hasDraft=wizDraftExists();
  document.getElementById('root').innerHTML=`
  <div class="pin-wrap">
    <img class="pin-logo" src="${db.config.logo||'./icons/icon-192.png'}" alt="logo"/>
    <div class="pin-title">ProfeQr</div>
    <div class="pin-sub">${esc(db.config.teacher||'')} &middot; ${esc(db.config.school||'')}</div>
    ${hasDraft?'<div class="pin-draft">\u{1F4DD} Tienes un reporte en progreso. Al entrar continuarás donde lo dejaste.</div>':''}
    <div class="pin-dots">
      <div class="pin-dot" id="pd0"></div><div class="pin-dot" id="pd1"></div>
      <div class="pin-dot" id="pd2"></div><div class="pin-dot" id="pd3"></div>
    </div>
    <div class="pin-error" id="pin-err"></div>
    <div class="pin-pad">
      ${[1,2,3,4,5,6,7,8,9].map(k=>`<button class="pin-btn" onclick="pinKey(${k})">${k}</button>`).join('')}
      <button class="pin-btn" style="opacity:0;pointer-events:none"></button>
      <button class="pin-btn" onclick="pinKey(0)">0</button>
      <button class="pin-btn" onclick="pinDel()">&#9003;</button>
    </div>
  </div>`;
}
function pinKey(k){
  if(pinBuffer.length>=4) return;
  if(pinFailCount>=5){ document.getElementById('pin-err').textContent='Demasiados intentos. Recarga la app.'; return; }
  pinBuffer+=String(k); updatePinDots(); if(pinBuffer.length===4) setTimeout(checkPin,160);
}
function pinDel(){ if(pinBuffer.length>0){ pinBuffer=pinBuffer.slice(0,-1); updatePinDots(); } }
function updatePinDots(){ for(let i=0;i<4;i++){ const el=document.getElementById('pd'+i); if(el) el.classList.toggle('filled',i<pinBuffer.length); } }
function checkPin(){
  if(pinBuffer===db.config.pin){
    pinBuffer=''; pinFailCount=0;
    if(wizDraftLoad()){ currentScreen='bitacoraForm'; } else { currentScreen='home'; }
    renderApp();
  } else {
    pinFailCount++; const e=document.getElementById('pin-err');
    if(e) e.textContent='PIN incorrecto. Intentos: '+pinFailCount+'/5';
    pinBuffer=''; updatePinDots();
  }
}
function renderHeader(title, subtitle, home=false){
  const logo = db.config?.logo || './icons/icon-192.png';
  return `
  <div class="header">
    <div class="header-row">
      <div style="display:flex;align-items:center;gap:10px">
        ${home ? '' : '<button class="icon-btn" id="back-btn">←</button>'}
        <div class="brand">
          <img src="${logo}" alt="logo"/>
          <div>
            <div class="name">${esc(title)}</div>
            <div class="sub">${esc(subtitle || '')}</div>
          </div>
        </div>
      </div>
      <button class="icon-btn" id="menu-btn">☰</button>
    </div>
  </div>`;
}

function navBtn(id,label){ const active=currentScreen===id||(id==='bitacora'&&(currentScreen==='bitacoraForm'||currentScreen==='bitacoraPreview'))||(id==='students'&&currentScreen==='studentProfile'); return `<button data-nav="${id}" class="${active?'active':''}">${label}</button>`; }

function renderSetup(){
  return `
  <div class="app">
    ${renderHeader('ProfeQr','Configuración inicial',true)}
    <div class="container">
      <div class="card">
        <div class="section-title">Registro inicial</div>
        <div style="display:flex;justify-content:center;margin-bottom:12px">
          <img id="setup-logo-preview" src="./icons/icon-192.png" style="width:86px;height:86px;border-radius:22px;object-fit:contain;background:#fff"/>
        </div>
        <div class="row">
          <div><div class="small">Escuela</div><input id="setup-school" value="Telesecundaria Federal No. 20"></div>
          <div><div class="small">CCT</div><input id="setup-cct" value="11DTV0020P"></div>
          <div><div class="small">Nombre del maestro</div><input id="setup-teacher"></div>
          <div><div class="small">Director(a)</div><input id="setup-director"></div>
          <div><div class="small">Zona escolar</div><input id="setup-zone"></div>
          <div><div class="small">Jefatura / Sector</div><input id="setup-sector"></div>
          <div><div class="small">Municipio</div><input id="setup-municipality" value="León, Guanajuato"></div>
          <div><div class="small">Domicilio escolar</div><input id="setup-address"></div>
          <div><div class="small">Ciclo escolar</div><input id="setup-cycle" placeholder="2026-2027"></div>
          <div><div class="small">Nivel educativo</div><select id="setup-level"><option>Preescolar</option><option>Primaria</option><option selected>Telesecundaria</option></select></div>
          <div><div class="small">Grado</div><select id="setup-grade"></select></div>
          <div><div class="small">Turno</div><select id="setup-shift"><option>Matutino</option><option selected>Vespertino</option></select></div>
          <div><div class="small">Grupo / Sección</div><select id="setup-section"></select></div>
          <div><div class="small">Grupo generado</div><input id="setup-group" readonly></div>
          <div><div class="small">Logo de la escuela</div><input id="setup-logo" type="file" accept="image/*"></div>
          <div><div class="small">PIN de acceso (4 digitos) *</div><div class="help">Candado de pantalla. No compartir datos sensibles por este medio.</div><input id="setup-pin" type="password" inputmode="numeric" maxlength="4" placeholder="...."></div>
          <div><div class="small">Confirmar PIN *</div><input id="setup-pin2" type="password" inputmode="numeric" maxlength="4" placeholder="...."></div>
          <button class="btn primary" id="setup-save">Guardar y entrar</button>
        </div>
      </div>
    </div>
  </div>`;
}

function bindSetup(){
  const levelEl = document.getElementById('setup-level');
  const gradeEl = document.getElementById('setup-grade');
  const shiftEl = document.getElementById('setup-shift');
  const sectionEl = document.getElementById('setup-section');
  const groupEl = document.getElementById('setup-group');
  const logoInput = document.getElementById('setup-logo');
  const logoPreview = document.getElementById('setup-logo-preview');
  let logoData = '';

  function refreshGrades(){
    const grades = GRADES_BY_LEVEL[levelEl.value];
    gradeEl.innerHTML = grades.map((g,i)=>`<option ${i===0?'selected':''}>${g}</option>`).join('');
    refreshGroup();
  }
  function refreshSections(){
    const sections = SECTIONS_BY_SHIFT[shiftEl.value];
    sectionEl.innerHTML = sections.map((s,i)=>`<option ${i===0?'selected':''}>${s}</option>`).join('');
    refreshGroup();
  }
  function refreshGroup(){ groupEl.value = `${gradeEl.value}${sectionEl.value}`; }

  levelEl.onchange = refreshGrades;
  shiftEl.onchange = refreshSections;
  gradeEl.onchange = refreshGroup;
  sectionEl.onchange = refreshGroup;
  logoInput.onchange = e => {
    const file = e.target.files[0];
    if(!file) return;
    const r = new FileReader();
    r.onload = ()=>{ logoData = r.result; logoPreview.src = logoData; };
    r.readAsDataURL(file);
  };

  refreshGrades();
  refreshSections();
  refreshGroup();

  document.getElementById('setup-save').onclick = () => {
    const teacher = document.getElementById('setup-teacher').value.trim();
    const school = document.getElementById('setup-school').value.trim();
    const cct = document.getElementById('setup-cct').value.trim();
    if(!teacher || !school){ toast('Captura docente y escuela'); return; }
    const pin = document.getElementById('setup-pin')?.value||'';
    const pin2 = document.getElementById('setup-pin2')?.value||'';
    if(!/^\d{4}$/.test(pin)){ toast('El PIN debe ser exactamente 4 digitos numericos'); return; }
    if(pin!==pin2){ toast('Los PINes no coinciden'); return; }

    db.config = {
      teacher, school, cct,
      director: document.getElementById('setup-director').value.trim(),
      zone: document.getElementById('setup-zone').value.trim(),
      sector: document.getElementById('setup-sector').value.trim(),
      municipality: document.getElementById('setup-municipality').value.trim(),
      address: document.getElementById('setup-address').value.trim(),
      cycle: document.getElementById('setup-cycle').value.trim(),
      level: levelEl.value,
      grade: gradeEl.value,
      shift: shiftEl.value,
      section: sectionEl.value,
      group: groupEl.value,
      logo: logoData,
      theme: 'professional',
      pin: pin
    };
    db.group.name = db.config.group;
    db.group.level = db.config.level;
    db.group.grade = db.config.grade;
    db.group.shift = db.config.shift;
    db.group.section = db.config.section;
    if(!saveDb()) return;
    currentScreen = 'home'; // FIX v4
    renderApp();
  };
}

function renderShell(){
  const subtitle = currentScreen==='home'
    ? 'Centro de mando docente'
    : `${db.config.school} · ${db.config.teacher}`;
  return `
  <div class="app">
    ${renderHeader('ProfeQr', subtitle, currentScreen==='home'||currentScreen==='attendance')}
    <div id="drawer-bg" class="drawer-bg hidden"></div>
    <div id="drawer" class="drawer hidden">
      <h3>ProfeQr</h3>
      ${navBtn('home','🏠 Inicio')}
      <div class="drawer-sep"></div>
      <div class="drawer-group">Registro diario</div>
      ${navBtn('attendance','📷 Asistencia')}
      ${navBtn('works','📝 Trabajos')}
      <div class="drawer-sep"></div>
      <div class="drawer-group">Gestión docente</div>
      ${navBtn('agenda','📅 Agenda')}
      ${navBtn('cte','✅ Acuerdos CTE')}
      ${navBtn('guardias','🛡️ Guardias')}
      <div class="drawer-sep"></div>
      <div class="drawer-group">Recursos</div>
      ${navBtn('biblioteca','📚 Biblioteca')}
      ${navBtn('bitacora','📋 Bitácora')}
      <div class="drawer-sep"></div>
      <div class="drawer-group">Grupo</div>
      ${navBtn('students','👥 Alumnos')}
      ${navBtn('cards','🪪 Tarjetas QR')}
      ${navBtn('reports','📊 Reportes')}
      ${navBtn('settings','⚙️ Ajustes')}
    </div>
    <div class="container" id="screen-host"></div>
    <div class="install-banner hidden" id="install-banner">
      <h4 style="margin:0 0 4px;font-size:16px">Instalar ProfeQr</h4>
      <p style="margin:0;font-size:13px;opacity:.92">Agrega esta app a tu pantalla de inicio y úsala como una app real.</p>
      <div class="install-actions">
        <button class="btn secondary" id="install-later">Ahora no</button>
        <button class="btn primary" id="install-now">Instalar</button>
      </div>
    </div>
  </div>`;
}

function bindGlobal(){
  const back = document.getElementById('back-btn');
  if(back) back.onclick = async () => {
    // FIX v4: navegación contextual según pantalla activa
    if(currentScreen === 'bitacoraForm' || currentScreen === 'bitacoraPreview'){
      if(confirm('¿Salir del reporte? El borrador se guardará automáticamente.')){
        wizDraftSave(); // FIX: borrador local, no guardar a DB
        currentScreen = 'bitacora';
        renderApp();
      }
    } else if(currentScreen === 'studentProfile'){
      currentScreen = 'students';
      renderApp();
    } else if(currentScreen === 'docViewer'){
      currentScreen = 'biblioteca';
      renderApp();
    } else {
      await stopDynamicModules();
      currentScreen = 'home'; // FIX v4: volver a home
      renderApp();
    }
  };

  document.getElementById('menu-btn').onclick = () => {
    document.getElementById('drawer-bg').classList.toggle('hidden');
    document.getElementById('drawer').classList.toggle('hidden');
  };
  document.getElementById('drawer-bg').onclick = closeDrawer;

  document.querySelectorAll('[data-nav]').forEach(btn => btn.onclick = async () => {
    await stopDynamicModules();
    currentScreen = btn.dataset.nav;
    closeDrawer();
    renderCurrentScreen();
  });

  const installBanner = document.getElementById('install-banner');
  if(deferredPrompt && installBanner) installBanner.classList.remove('hidden');
  const installNow = document.getElementById('install-now');
  const installLater = document.getElementById('install-later');
  if(installNow) installNow.onclick = async () => {
    if(!deferredPrompt) return;
    deferredPrompt.prompt();
    try{ await deferredPrompt.userChoice; }catch(e){}
    installBanner.classList.add('hidden');
    deferredPrompt = null;
  };
  if(installLater) installLater.onclick = () => installBanner.classList.add('hidden');
}

function closeDrawer(){
  document.getElementById('drawer-bg')?.classList.add('hidden');
  document.getElementById('drawer')?.classList.add('hidden');
}

function renderApp(){
  applyTheme(db.config?.theme || 'professional');
  const root = document.getElementById('root');
  if(!db.config){
    root.innerHTML = renderSetup();
    bindSetup();
    return;
  }
  root.innerHTML = renderShell();
  bindGlobal();
  renderCurrentScreen();
}


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
    html += `<div class="expired-banner">La licencia de este ciclo venció el 30 de julio de 2027. Puedes consultar y exportar información, pero ya no capturar nuevos datos.</div>`;
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


/* --- Agenda docente --- */
let agendaViewDate = today();
let agendaTab = 'week';
let agendaEditingId = '';
let agendaMonthAnchor = today().slice(0,7);
let cteEditingId = '';
let cteFilterStatus = '';
const AGENDA_TYPES = ['CTE','Calificaciones','Asueto','Reunión','Evaluación','Guardia','Honores','Comisión','Incidencia','Administrativo','Cita con tutor','Recordatorio','Otro'];
const AGENDA_PRIORITIES = ['baja','media','alta','crítica'];
const AGENDA_REPEAT = ['ninguna','diaria','semanal','quincenal','mensual'];
const CTE_TYPES = ['CTE','Academia','Reunión docente','Supervisión','Otro'];
const CTE_STATUSES = ['pendiente','en proceso','cumplido','vencido'];
const CTE_RESPONSIBLE_TYPES = ['Docente','Director','Comité','Grupo','Otro'];
function normalizeAgendaEvent(e={}){ const ev=e&&typeof e==='object'?{...e}:{}; ev.id=ev.id||uid(); ev.title=ev.title||''; ev.type=ev.type||'Recordatorio'; ev.date=ev.date||today(); ev.startTime=ev.startTime||''; ev.endTime=ev.endTime||''; ev.priority=AGENDA_PRIORITIES.includes(ev.priority)?ev.priority:'media'; ev.repeat=AGENDA_REPEAT.includes(ev.repeat)?ev.repeat:'ninguna'; ev.studentId=ev.studentId||''; ev.description=ev.description||''; ev.status=ev.status||'pendiente'; ev.createdAt=ev.createdAt||new Date().toISOString(); ev.updatedAt=ev.updatedAt||ev.createdAt; return ev; }
function normalizeQuickNote(n={}){ const note=n&&typeof n==='object'?{...n}:{}; note.id=note.id||uid(); note.text=note.text||''; note.priority=AGENDA_PRIORITIES.includes(note.priority)?note.priority:'media'; note.createdAt=note.createdAt||new Date().toISOString(); note.updatedAt=note.updatedAt||note.createdAt; return note; }
function ensureAgenda(){ db.group.agenda=Array.isArray(db.group.agenda)?db.group.agenda.map(normalizeAgendaEvent):[]; db.group.quickNotes=Array.isArray(db.group.quickNotes)?db.group.quickNotes.map(normalizeQuickNote):[]; }
function dateAdd(dateStr,days){ const d=new Date(dateStr+'T00:00:00'); d.setDate(d.getDate()+days); return d.toISOString().slice(0,10); }
function monthAdd(dateStr,months){ const d=new Date(dateStr+'T00:00:00'); const day=d.getDate(); d.setMonth(d.getMonth()+months); if(d.getDate()!==day)d.setDate(0); return d.toISOString().slice(0,10); }
function startOfWeek(dateStr){ const d=new Date(dateStr+'T00:00:00'); const day=d.getDay(); const diff=(day===0?-6:1-day); d.setDate(d.getDate()+diff); return d.toISOString().slice(0,10); }
function endOfWeek(dateStr){ return dateAdd(startOfWeek(dateStr),6); }
function formatLongDate(dateStr){ try{ return new Date(dateStr+'T00:00:00').toLocaleDateString('es-MX',{weekday:'long',day:'numeric',month:'long',year:'numeric'}); }catch(e){ return dateStr; } }
function agendaTypeIcon(type){ return ({CTE:'🏫',Calificaciones:'📊',Asueto:'🌴','Reunión':'🤝','Evaluación':'🧪','Guardia':'🛡️','Honores':'🇲🇽','Comisión':'📌','Incidencia':'🚨','Administrativo':'📄','Cita con tutor':'👪','Recordatorio':'🔔','Otro':'📌'})[type]||'📌'; }
function agendaPriorityClass(p){ return ({baja:'prio-low',media:'prio-med',alta:'prio-high','crítica':'prio-critical'})[p]||'prio-med'; }
function agendaPriorityLabel(p){ return p==='crítica'?'Crítica':(p||'media').charAt(0).toUpperCase()+(p||'media').slice(1); }
function agendaOccurrenceFor(ev,date){ return {...ev, occurrenceDate:date, occurrenceKey:ev.id+'@'+date}; }
function agendaOccurrences(start,end){ ensureAgenda(); const out=[]; (db.group.agenda||[]).forEach(raw=>{ const ev=normalizeAgendaEvent(raw); if(ev.repeat==='ninguna'){ if(ev.date>=start&&ev.date<=end) out.push(agendaOccurrenceFor(ev,ev.date)); return; } let cur=ev.date, guard=0; while(cur<=end&&guard<370){ if(cur>=start) out.push(agendaOccurrenceFor(ev,cur)); cur=ev.repeat==='diaria'?dateAdd(cur,1):ev.repeat==='semanal'?dateAdd(cur,7):ev.repeat==='quincenal'?dateAdd(cur,14):ev.repeat==='mensual'?monthAdd(cur,1):end; guard++; } }); return out.sort((a,b)=>(a.occurrenceDate+a.startTime).localeCompare(b.occurrenceDate+b.startTime)); }
function agendaHomeData(){ const t=today(); return { today:agendaOccurrences(t,t).filter(e=>e.status!=='hecho'&&e.status!=='cerrado'), next7:agendaOccurrences(dateAdd(t,1),dateAdd(t,7)).filter(e=>e.status!=='hecho'&&e.status!=='cerrado'), overdue:(db.group.agenda||[]).map(normalizeAgendaEvent).filter(e=>e.date<t&&e.status!=='hecho'&&e.status!=='cerrado').sort((a,b)=>a.date.localeCompare(b.date))}; }
function getHomeStats(){ const rows=db.group.attendance?.[today()]||[]; const total=getActiveStudents().length; const openInc=(db.group.bitacoraReports||[]).filter(r=>buildReportStatus(normalizeBitacoraReport(r))!=='cerrado').length; return {present:rows.length, absent:Math.max(total-rows.length,0), openIncidents:openInc}; }
function renderMiniAgendaItem(ev){ const date=ev.occurrenceDate||ev.date; const student=ev.studentId?` · ${esc(getStudentLabel(ev.studentId))}`:''; return `<div class="mini-agenda-item ${agendaPriorityClass(ev.priority)}"><span>${agendaTypeIcon(ev.type)}</span><div><b>${esc(ev.title||ev.type)}</b><small>${esc(date)} ${esc(ev.startTime||'')}${student}</small></div></div>`; }
function agendaStudentOptions(selected=''){ return `<option value="">Sin vincular alumno</option>`+getActiveStudents().map(s=>`<option value="${s.id}" ${selected===s.id?'selected':''}>${esc(s.listNo||'')} · ${esc(s.name||'')}</option>`).join(''); } // FIX v4: solo activos
function renderAgenda(){ ensureAgenda(); if(agendaTab==='form') return renderAgendaForm(); if(agendaTab==='month') return renderAgendaMonth(); if(agendaTab==='notes') return renderAgendaNotes(); if(agendaTab==='tools') return renderAgendaTools(); return renderAgendaWeek(); }
function renderAgendaTabs(active){ return `<div class="card"><div class="tabs"><button class="tab ${active==='week'?'active':''}" data-agenda-tab="week">Semana</button><button class="tab ${active==='month'?'active':''}" data-agenda-tab="month">Mes</button><button class="tab ${active==='notes'?'active':''}" data-agenda-tab="notes">Notas rápidas</button><button class="tab ${active==='tools'?'active':''}" data-agenda-tab="tools">Importar / Exportar</button></div></div>`; }
function renderAgendaWeek(){ const start=startOfWeek(agendaViewDate), end=endOfWeek(agendaViewDate); const items=agendaOccurrences(start,end); const days=Array.from({length:7},(_,i)=>dateAdd(start,i)); return `${renderAgendaTabs('week')}<div class="card"><div class="agenda-head"><button class="btn secondary" id="ag-prev-week">←</button><div><div class="section-title">Agenda semanal</div><div class="small">${esc(start)} al ${esc(end)}</div></div><button class="btn secondary" id="ag-next-week">→</button></div><div class="row row2"><button class="btn primary" id="ag-new-event">+ Evento / recordatorio</button><button class="btn secondary" id="ag-today">Hoy</button></div></div><div class="week-list">${days.map(d=>{ const dayItems=items.filter(x=>x.occurrenceDate===d); return `<div class="card day-card ${d===today()?'today':''}"><div class="day-title"><b>${esc(formatLongDate(d))}</b><span>${dayItems.length}</span></div>${dayItems.length?dayItems.map(renderAgendaItem).join(''):'<div class="small">Sin eventos.</div>'}</div>`; }).join('')}</div>${renderAgendaQuickNotesCard()}`; }
function renderAgendaMonth(){ const [y,m]=agendaMonthAnchor.split('-').map(Number); const first=new Date(y,m-1,1); const firstStr=first.toISOString().slice(0,10); const start=startOfWeek(firstStr); const last=new Date(y,m,0).toISOString().slice(0,10); const end=endOfWeek(last); const items=agendaOccurrences(start,end); const days=[]; for(let cur=start; cur<=end; cur=dateAdd(cur,1)) days.push(cur); return `${renderAgendaTabs('month')}<div class="card"><div class="agenda-head"><button class="btn secondary" id="ag-prev-month">←</button><div><div class="section-title">Vista mensual</div><div class="small">${agendaMonthAnchor}</div></div><button class="btn secondary" id="ag-next-month">→</button></div><button class="btn primary" id="ag-new-event">+ Evento / recordatorio</button></div><div class="month-grid">${days.map(d=>{ const count=items.filter(x=>x.occurrenceDate===d).length; const other=!d.startsWith(agendaMonthAnchor); return `<button class="month-day ${d===today()?'today':''} ${other?'other':''}" data-month-day="${d}"><b>${Number(d.slice(8,10))}</b>${count?`<span>${count}</span>`:''}</button>`; }).join('')}</div><div class="card"><div class="section-title">Eventos del día seleccionado</div><div id="month-day-detail" class="small">Toca un día para ver sus eventos.</div></div>`; }
function renderAgendaItem(ev){ const student=ev.studentId?`<div class="small">Alumno: ${esc(getStudentLabel(ev.studentId))}</div>`:''; return `<div class="agenda-item ${agendaPriorityClass(ev.priority)}"><div class="agenda-icon">${agendaTypeIcon(ev.type)}</div><div class="agenda-main"><b>${esc(ev.title||ev.type)}</b><div class="small">${esc(ev.type)} · ${esc(agendaPriorityLabel(ev.priority))} · ${esc(ev.startTime||'sin hora')}${ev.endTime?' - '+esc(ev.endTime):''}${ev.repeat&&ev.repeat!=='ninguna'?' · Repite '+esc(ev.repeat):''}</div>${student}${ev.description?`<div class="help">${esc(ev.description)}</div>`:''}</div><div class="agenda-actions"><button class="mini" data-ag-edit="${ev.id}">Editar</button><button class="mini" data-ag-done="${ev.id}">Hecho</button><button class="mini" data-ag-del="${ev.id}">Eliminar</button></div></div>`; }
function renderAgendaQuickNotesCard(){ const notes=(db.group.quickNotes||[]).map(normalizeQuickNote).sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||'')); return `<div class="card"><div class="section-title">Notas rápidas</div><div class="field"><div class="small">Nueva nota</div><textarea id="quick-note-text" rows="3" placeholder="Dicta o escribe una idea rápida. Luego puedes convertirla en recordatorio."></textarea>${micBtn('quick-note-text')}</div><div class="row row2"><select id="quick-note-priority">${AGENDA_PRIORITIES.map(p=>`<option value="${p}">${agendaPriorityLabel(p)}</option>`).join('')}</select><button class="btn primary" id="quick-note-save">Guardar nota</button></div><div style="margin-top:12px">${notes.length?notes.slice(0,8).map(n=>`<div class="agenda-item ${agendaPriorityClass(n.priority)}"><div class="agenda-icon">🗒️</div><div class="agenda-main"><b>${esc(n.text)}</b><div class="small">${agendaPriorityLabel(n.priority)} · ${esc((n.createdAt||'').slice(0,16).replace('T',' '))}</div></div><div class="agenda-actions"><button class="mini" data-note-to-reminder="${n.id}">A recordatorio</button><button class="mini" data-note-del="${n.id}">Eliminar</button></div></div>`).join(''):'<div class="small">Sin notas rápidas.</div>'}</div></div>`; }
function renderAgendaNotes(){ return `${renderAgendaTabs('notes')}${renderAgendaQuickNotesCard()}`; }
function renderAgendaTools(){ return `${renderAgendaTabs('tools')}<div class="card"><div class="section-title">Importar / Exportar agenda</div><div class="row row2"><button class="btn secondary" id="ag-export-xlsx">Exportar Excel</button><button class="btn secondary" id="ag-export-json">Exportar JSON</button><label class="btn primary" style="display:grid;place-items:center"><input id="ag-import-json" type="file" accept=".json,application/json" style="display:none">Importar JSON</label><label class="btn primary" style="display:grid;place-items:center"><input id="ag-import-xlsx" type="file" accept=".xlsx,.xls,.csv" style="display:none">Importar Excel/CSV</label></div><div class="help">Columnas sugeridas: titulo, tipo, fecha, hora_inicio, hora_fin, prioridad, repeticion, alumno, descripcion, estatus.</div></div>`; }
function renderAgendaForm(){ const ev=agendaEditingId?normalizeAgendaEvent((db.group.agenda||[]).find(x=>x.id===agendaEditingId)||{}):normalizeAgendaEvent({date:agendaViewDate}); return `${renderAgendaTabs('form')}<div class="card"><div class="section-title">${agendaEditingId?'Editar evento':'Nuevo evento / recordatorio'}</div><div class="row"><div><div class="small">Título *</div><input id="ag-title" value="${esc(ev.title)}" placeholder="Ej. Entrega de calificaciones"></div><div class="row row2"><div><div class="small">Tipo</div><select id="ag-type">${AGENDA_TYPES.map(t=>`<option ${ev.type===t?'selected':''}>${t}</option>`).join('')}</select></div><div><div class="small">Prioridad</div><select id="ag-priority">${AGENDA_PRIORITIES.map(p=>`<option value="${p}" ${ev.priority===p?'selected':''}>${agendaPriorityLabel(p)}</option>`).join('')}</select></div></div><div class="row row3"><div><div class="small">Fecha *</div><input id="ag-date" type="date" value="${esc(ev.date)}"></div><div><div class="small">Hora inicio</div><input id="ag-start" type="time" value="${esc(ev.startTime)}"></div><div><div class="small">Hora fin</div><input id="ag-end" type="time" value="${esc(ev.endTime)}"></div></div><div class="row row2"><div><div class="small">Repetición</div><select id="ag-repeat">${AGENDA_REPEAT.map(r=>`<option value="${r}" ${ev.repeat===r?'selected':''}>${r}</option>`).join('')}</select></div><div><div class="small">Alumno vinculado</div><select id="ag-student">${agendaStudentOptions(ev.studentId)}</select></div></div><div class="field"><div class="small">Descripción / notas</div><textarea id="ag-description" rows="5" placeholder="Puedes dictar indicaciones, acuerdos o detalles.">${esc(ev.description)}</textarea>${micBtn('ag-description')}</div><div class="row row2"><button class="btn secondary" id="ag-cancel">Cancelar</button><button class="btn primary" id="ag-save">Guardar</button></div></div></div>`; }
function bindAgenda(){ bindMicButtons(); document.querySelectorAll('[data-agenda-tab]').forEach(btn=>btn.onclick=()=>{ agendaTab=btn.dataset.agendaTab; renderCurrentScreen(); }); if(agendaTab==='week') bindAgendaWeek(); if(agendaTab==='month') bindAgendaMonth(); if(agendaTab==='form') bindAgendaForm(); if(agendaTab==='notes') bindAgendaNotes(); if(agendaTab==='tools') bindAgendaTools(); }
function bindAgendaWeek(){ document.getElementById('ag-prev-week')?.addEventListener('click',()=>{agendaViewDate=dateAdd(agendaViewDate,-7);renderCurrentScreen();}); document.getElementById('ag-next-week')?.addEventListener('click',()=>{agendaViewDate=dateAdd(agendaViewDate,7);renderCurrentScreen();}); document.getElementById('ag-today')?.addEventListener('click',()=>{agendaViewDate=today();renderCurrentScreen();}); document.getElementById('ag-new-event')?.addEventListener('click',()=>{agendaEditingId='';agendaTab='form';renderCurrentScreen();}); bindAgendaItemActions(); bindAgendaNotes(); }
function bindAgendaMonth(){ document.getElementById('ag-prev-month')?.addEventListener('click',()=>{agendaMonthAnchor=monthAdd(agendaMonthAnchor+'-01',-1).slice(0,7);renderCurrentScreen();}); document.getElementById('ag-next-month')?.addEventListener('click',()=>{agendaMonthAnchor=monthAdd(agendaMonthAnchor+'-01',1).slice(0,7);renderCurrentScreen();}); document.getElementById('ag-new-event')?.addEventListener('click',()=>{agendaEditingId='';agendaTab='form';renderCurrentScreen();}); document.querySelectorAll('[data-month-day]').forEach(btn=>btn.onclick=()=>{ const d=btn.dataset.monthDay; const items=agendaOccurrences(d,d); document.getElementById('month-day-detail').innerHTML=items.length?items.map(renderAgendaItem).join(''):'Sin eventos.'; bindAgendaItemActions(); }); }
function bindAgendaForm(){ document.getElementById('ag-cancel')?.addEventListener('click',()=>{agendaTab='week';agendaEditingId='';renderCurrentScreen();}); document.getElementById('ag-save')?.addEventListener('click',()=>{ const title=valOf('ag-title').trim(), date=valOf('ag-date'); if(!title||!date){toast('Título y fecha son obligatorios');return;} const ev=normalizeAgendaEvent({id:agendaEditingId||uid(),title,type:valOf('ag-type'),date,startTime:valOf('ag-start'),endTime:valOf('ag-end'),priority:valOf('ag-priority'),repeat:valOf('ag-repeat'),studentId:valOf('ag-student'),description:valOf('ag-description'),status:'pendiente',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}); ensureAgenda(); const idx=db.group.agenda.findIndex(x=>x.id===ev.id); if(idx>=0){ ev.createdAt=db.group.agenda[idx].createdAt||ev.createdAt; db.group.agenda[idx]=ev; } else db.group.agenda.push(ev); if(!saveDb())return; toast('Evento guardado'); agendaViewDate=ev.date; agendaTab='week'; agendaEditingId=''; renderCurrentScreen(); }); }
function bindAgendaItemActions(){ document.querySelectorAll('[data-ag-edit]').forEach(btn=>btn.onclick=()=>{agendaEditingId=btn.dataset.agEdit;agendaTab='form';renderCurrentScreen();}); document.querySelectorAll('[data-ag-done]').forEach(btn=>btn.onclick=()=>{const ev=db.group.agenda.find(x=>x.id===btn.dataset.agDone); if(ev){ev.status='hecho';ev.updatedAt=new Date().toISOString();saveDb();toast('Marcado como hecho');renderCurrentScreen();}}); document.querySelectorAll('[data-ag-del]').forEach(btn=>btn.onclick=()=>{if(!confirm('¿Eliminar este evento o recordatorio?'))return; db.group.agenda=db.group.agenda.filter(x=>x.id!==btn.dataset.agDel); saveDb(); toast('Evento eliminado'); renderCurrentScreen();}); }
function bindAgendaNotes(){ document.getElementById('quick-note-save')?.addEventListener('click',()=>{const text=valOf('quick-note-text').trim(); if(!text){toast('Escribe o dicta una nota');return;} ensureAgenda(); db.group.quickNotes.unshift(normalizeQuickNote({text,priority:valOf('quick-note-priority')})); saveDb(); toast('Nota guardada'); renderCurrentScreen();}); document.querySelectorAll('[data-note-del]').forEach(btn=>btn.onclick=()=>{db.group.quickNotes=db.group.quickNotes.filter(n=>n.id!==btn.dataset.noteDel);saveDb();toast('Nota eliminada');renderCurrentScreen();}); document.querySelectorAll('[data-note-to-reminder]').forEach(btn=>btn.onclick=()=>{const note=db.group.quickNotes.find(n=>n.id===btn.dataset.noteToReminder); if(!note)return; db.group.agenda.push(normalizeAgendaEvent({title:note.text.slice(0,70),type:'Recordatorio',date:today(),priority:note.priority,description:note.text})); db.group.quickNotes=db.group.quickNotes.filter(n=>n.id!==note.id); saveDb(); toast('Nota convertida en recordatorio'); agendaTab='week'; renderCurrentScreen();}); }
function bindAgendaTools(){ document.getElementById('ag-export-xlsx')?.addEventListener('click',exportAgendaExcel); document.getElementById('ag-export-json')?.addEventListener('click',exportAgendaJson); document.getElementById('ag-import-json')?.addEventListener('change',importAgendaJson); document.getElementById('ag-import-xlsx')?.addEventListener('change',importAgendaExcel); }
function exportAgendaExcel(){ ensureAgenda(); const rows=db.group.agenda.map(e=>({titulo:e.title,tipo:e.type,fecha:e.date,hora_inicio:e.startTime,hora_fin:e.endTime,prioridad:e.priority,repeticion:e.repeat,alumno:e.studentId?getStudentLabel(e.studentId):'',studentId:e.studentId,descripcion:e.description,estatus:e.status})); const wb=XLSX.utils.book_new(), ws=XLSX.utils.json_to_sheet(rows); styleSheet(ws); XLSX.utils.book_append_sheet(wb,ws,'AGENDA'); XLSX.writeFile(wb,`ProfeQr_Agenda_${db.config.group||'grupo'}.xlsx`); }
function exportAgendaJson(){ ensureAgenda(); downloadTextFile(`ProfeQr_Agenda_${db.config.group||'grupo'}.json`,JSON.stringify({agenda:db.group.agenda,quickNotes:db.group.quickNotes,exportedAt:new Date().toISOString()},null,2),'application/json;charset=utf-8'); }
function importAgendaJson(evt){ const file=evt.target.files?.[0]; if(!file)return; const r=new FileReader(); r.onload=()=>{try{const data=JSON.parse(r.result); if(!confirm('Importar agenda reemplazará eventos y notas actuales. ¿Continuar?'))return; db.group.agenda=(data.agenda||[]).map(normalizeAgendaEvent); db.group.quickNotes=(data.quickNotes||[]).map(normalizeQuickNote); saveDb(); toast('Agenda importada'); renderCurrentScreen();}catch(e){toast('JSON inválido');}}; r.readAsText(file); }
function importAgendaExcel(evt){ const file=evt.target.files?.[0]; if(!file)return; const r=new FileReader(); r.onload=ev=>{try{const data=new Uint8Array(ev.target.result); const wb=XLSX.read(data,{type:'array'}); const ws=wb.Sheets[wb.SheetNames[0]]; const rows=XLSX.utils.sheet_to_json(ws,{defval:''}); const imported=rows.map(row=>normalizeAgendaEvent({title:row.titulo||row.Titulo||row.title||'', type:row.tipo||row.Tipo||'Otro', date:String(row.fecha||row.Fecha||today()).slice(0,10), startTime:row.hora_inicio||row['Hora inicio']||'', endTime:row.hora_fin||row['Hora fin']||'', priority:row.prioridad||row.Prioridad||'media', repeat:row.repeticion||row.Repeticion||row.Repetición||'ninguna', studentId:row.studentId||'', description:row.descripcion||row.Descripcion||row.Descripción||'', status:row.estatus||row.Estatus||'pendiente'})).filter(e=>e.title&&e.date); if(!imported.length){toast('No se encontraron eventos válidos');return;} if(!confirm(`Importar ${imported.length} eventos y agregarlos a la agenda?`))return; db.group.agenda=[...imported,...(db.group.agenda||[])]; saveDb(); toast('Eventos importados'); renderCurrentScreen();}catch(e){console.error(e);toast('No se pudo importar Excel');}}; r.readAsArrayBuffer(file); }

/* --- Biblioteca docente NEM --- */
let librarySectionFilter = 'Todas';
let libraryQuery = '';
let libraryEditingId = '';
function normalizeLibraryResource(r={}){
  const x = r && typeof r === 'object' ? {...r} : {};
  x.id = x.id || uid(); x.section = LIBRARY_SECTIONS.includes(x.section) ? x.section : 'Mi biblioteca'; x.title = x.title || ''; x.type = x.type || 'Nota'; x.tags = x.tags || ''; x.summary = x.summary || ''; x.content = x.content || ''; x.favorite = !!x.favorite; x.custom = x.custom !== false; x.createdAt = x.createdAt || new Date().toISOString(); x.updatedAt = x.updatedAt || x.createdAt; return x;
}
function ensureLibrary(){ db.group.libraryResources = Array.isArray(db.group.libraryResources) ? db.group.libraryResources.map(normalizeLibraryResource) : []; }
function libraryAllResources(){ ensureLibrary(); const customIds = new Set(db.group.libraryResources.map(r=>r.id)); const base = LIBRARY_DEFAULT_RESOURCES.filter(r=>!customIds.has(r.id)).map(r=>normalizeLibraryResource({...r,custom:false})); return [...base, ...db.group.libraryResources.map(normalizeLibraryResource)]; }
function libraryFilteredResources(){ const q = slug(libraryQuery); return libraryAllResources().filter(r=>{ const bySection = librarySectionFilter==='Todas' || r.section===librarySectionFilter; const hay = slug(`${r.title} ${r.section} ${r.type} ${r.tags} ${r.summary} ${r.content}`); return bySection && (!q || hay.includes(q)); }).sort((a,b)=> Number(b.favorite)-Number(a.favorite) || a.section.localeCompare(b.section) || a.title.localeCompare(b.title)); }
function renderLibrary(){
  if(libraryEditingId) return renderLibraryForm();
  const resources = libraryFilteredResources(); const favs = resources.filter(r=>r.favorite); const sections = ['Todas', ...LIBRARY_SECTIONS];
  return `<div class="card"><div class="section-title">Biblioteca docente</div><div class="help">Consulta rápida para NEM, planeación, CTE, normativa, protocolos y recursos de redacción. No sustituye la revisión de documentos oficiales.</div><div class="row" style="margin-top:10px"><input id="lib-search" value="${esc(libraryQuery)}" placeholder="Buscar: evaluación formativa, CTE, acoso, protocolo, acta..."><div class="tabs">${sections.map(sec=>`<button class="tab ${librarySectionFilter===sec?'active':''}" data-lib-sec="${esc(sec)}">${esc(sec)}</button>`).join('')}</div><div class="row row2"><button class="btn primary" id="lib-new">+ Recurso propio</button><button class="btn secondary" id="lib-export-json">Exportar biblioteca JSON</button></div><input id="lib-import-json" type="file" accept=".json" class="hidden"><button class="btn ghost" id="lib-import-trigger">Importar JSON</button></div></div>${favs.length?`<div class="card"><div class="section-title">Favoritos</div>${favs.slice(0,4).map(renderLibraryCard).join('')}</div>`:''}<div class="library-grid">${resources.length?resources.map(renderLibraryCard).join(''):'<div class="card"><div class="small">No hay recursos con ese filtro.</div></div>'}</div>`;
}
function renderLibraryCard(r){ const isCustom = r.custom !== false; return `<div class="library-card card"><div class="library-top"><span class="badge primary">${esc(r.section)}</span><button class="mini" data-lib-fav="${esc(r.id)}">${r.favorite?'★':'☆'}</button></div><div class="item-title" style="font-size:16px;margin-top:8px">${esc(r.title||'Sin título')}</div><div class="item-sub">${esc(r.type)}${r.tags?' · '+esc(r.tags):''}</div>${r.summary?`<div class="help">${esc(r.summary)}</div>`:''}<details class="library-details"><summary>Ver contenido</summary><div class="library-content">${esc(r.content||'Sin contenido.').replace(/\n/g,'<br>')}</div></details><div class="agenda-actions" style="margin-top:10px">${isCustom?`<button class="mini" data-lib-edit="${esc(r.id)}">Editar</button><button class="mini" data-lib-del="${esc(r.id)}">Eliminar</button>`:''}<button class="mini" data-lib-copy="${esc(r.id)}">Copiar texto</button></div></div>`; }
function renderLibraryForm(){ const current = db.group.libraryResources.find(r=>r.id===libraryEditingId) || normalizeLibraryResource({section:'Mi biblioteca',custom:true}); return `<div class="card"><div class="section-title">${libraryEditingId==='new'?'Nuevo recurso':'Editar recurso'}</div><div class="row"><div><div class="small">Sección</div><select id="lib-f-section">${LIBRARY_SECTIONS.map(sec=>`<option value="${esc(sec)}" ${current.section===sec?'selected':''}>${esc(sec)}</option>`).join('')}</select></div><div><div class="small">Título</div><input id="lib-f-title" value="${esc(current.title)}" placeholder="Ej. Evaluación formativa"></div><div><div class="small">Tipo</div><select id="lib-f-type">${['Guía rápida','Normativa','Protocolo','Formato guía','Banco de frases','Nota','Otro'].map(t=>`<option ${current.type===t?'selected':''}>${t}</option>`).join('')}</select></div><div><div class="small">Etiquetas</div><input id="lib-f-tags" value="${esc(current.tags)}" placeholder="palabras clave separadas por coma"></div><div><div class="small">Resumen</div><textarea id="lib-f-summary" rows="3" placeholder="Resumen breve">${esc(current.summary)}</textarea>${micBtn('lib-f-summary')}</div><div><div class="small">Contenido</div><textarea id="lib-f-content" rows="8" placeholder="Texto, formato, recordatorio normativo o recurso propio">${esc(current.content)}</textarea>${micBtn('lib-f-content')}</div><label class="check-line"><input id="lib-f-fav" type="checkbox" ${current.favorite?'checked':''}> Marcar como favorito</label><div class="row row2"><button class="btn secondary" id="lib-cancel">Cancelar</button><button class="btn primary" id="lib-save">Guardar recurso</button></div></div></div>`; }
function bindLibrary(){ bindMicButtons(); document.getElementById('lib-search')?.addEventListener('input',e=>{libraryQuery=e.target.value;renderCurrentScreen();}); document.querySelectorAll('[data-lib-sec]').forEach(btn=>btn.onclick=()=>{librarySectionFilter=btn.dataset.libSec;renderCurrentScreen();}); document.getElementById('lib-new')?.addEventListener('click',()=>{libraryEditingId='new';renderCurrentScreen();}); document.getElementById('lib-export-json')?.addEventListener('click',exportLibraryJson); document.getElementById('lib-import-trigger')?.addEventListener('click',()=>document.getElementById('lib-import-json')?.click()); document.getElementById('lib-import-json')?.addEventListener('change',importLibraryJson); document.querySelectorAll('[data-lib-fav]').forEach(btn=>btn.onclick=()=>toggleLibraryFavorite(btn.dataset.libFav)); document.querySelectorAll('[data-lib-edit]').forEach(btn=>btn.onclick=()=>{libraryEditingId=btn.dataset.libEdit;renderCurrentScreen();}); document.querySelectorAll('[data-lib-del]').forEach(btn=>btn.onclick=()=>deleteLibraryResource(btn.dataset.libDel)); document.querySelectorAll('[data-lib-copy]').forEach(btn=>btn.onclick=()=>copyLibraryResource(btn.dataset.libCopy)); document.getElementById('lib-cancel')?.addEventListener('click',()=>{libraryEditingId='';renderCurrentScreen();}); document.getElementById('lib-save')?.addEventListener('click',saveLibraryResource); }
function saveLibraryResource(){ ensureLibrary(); const id = libraryEditingId && libraryEditingId!=='new' ? libraryEditingId : uid(); const previous = db.group.libraryResources.find(r=>r.id===id); const item = normalizeLibraryResource({id, section:valOf('lib-f-section'), title:valOf('lib-f-title').trim(), type:valOf('lib-f-type'), tags:valOf('lib-f-tags').trim(), summary:valOf('lib-f-summary').trim(), content:valOf('lib-f-content').trim(), favorite:document.getElementById('lib-f-fav')?.checked || false, custom:true, createdAt:previous?.createdAt || new Date().toISOString(), updatedAt:new Date().toISOString()}); if(!item.title){toast('El título es obligatorio');return;} const idx=db.group.libraryResources.findIndex(r=>r.id===id); if(idx>=0) db.group.libraryResources[idx]=item; else db.group.libraryResources.push(item); if(!saveDb()) return; libraryEditingId=''; toast('Recurso guardado'); renderCurrentScreen(); }
function toggleLibraryFavorite(id){ ensureLibrary(); let item=db.group.libraryResources.find(r=>r.id===id); if(!item){ const base=LIBRARY_DEFAULT_RESOURCES.find(r=>r.id===id); if(base){ item=normalizeLibraryResource({...base,custom:false,favorite:!base.favorite}); db.group.libraryResources.push(item); } } else item.favorite=!item.favorite; saveDb(); renderCurrentScreen(); }
function deleteLibraryResource(id){ if(!confirm('¿Eliminar este recurso propio de la biblioteca?')) return; db.group.libraryResources=(db.group.libraryResources||[]).filter(r=>r.id!==id); saveDb(); toast('Recurso eliminado'); renderCurrentScreen(); }
function copyLibraryResource(id){ const r=libraryAllResources().find(x=>x.id===id); if(!r)return; const text=`${r.title}\n\n${r.summary||''}\n\n${r.content||''}`; if(navigator.clipboard?.writeText){ navigator.clipboard.writeText(text).then(()=>toast('Texto copiado')).catch(()=>downloadTextFile('recurso_biblioteca.txt',text,'text/plain;charset=utf-8')); } else downloadTextFile('recurso_biblioteca.txt',text,'text/plain;charset=utf-8'); }
function exportLibraryJson(){ ensureLibrary(); downloadTextFile(`ProfeQr_Biblioteca_${today()}.json`, JSON.stringify({libraryResources:db.group.libraryResources, exportedAt:new Date().toISOString()}, null, 2), 'application/json;charset=utf-8'); }
function importLibraryJson(evt){ const file=evt.target.files?.[0]; if(!file)return; const r=new FileReader(); r.onload=()=>{try{const data=JSON.parse(r.result); const arr=Array.isArray(data.libraryResources)?data.libraryResources:Array.isArray(data)?data:[]; if(!arr.length){toast('No se encontraron recursos');return;} if(!confirm(`Importar ${arr.length} recursos a Mi biblioteca?`))return; ensureLibrary(); db.group.libraryResources=[...arr.map(x=>normalizeLibraryResource({...x,custom:true})), ...db.group.libraryResources]; saveDb(); toast('Biblioteca importada'); renderCurrentScreen();}catch(e){toast('JSON inválido');}}; r.readAsText(file); }

/* --- Acuerdos CTE --- */
function normalizeCteAgreement(a={}){
  const x = a && typeof a === 'object' ? {...a} : {};
  x.id = x.id || uid();
  x.type = CTE_TYPES.includes(x.type) ? x.type : 'CTE';
  x.responsibleType = CTE_RESPONSIBLE_TYPES.includes(x.responsibleType) ? x.responsibleType : 'Docente';
  x.responsibleName = x.responsibleName || '';
  x.description = x.description || '';
  x.dueDate = x.dueDate || today();
  x.priority = AGENDA_PRIORITIES.includes(x.priority) ? x.priority : 'media';
  x.status = CTE_STATUSES.includes(x.status) ? x.status : 'pendiente';
  x.evidence = x.evidence || '';
  x.autoAgenda = x.autoAgenda !== false;
  x.agendaEventId = x.agendaEventId || '';
  x.createdAt = x.createdAt || new Date().toISOString();
  x.updatedAt = x.updatedAt || x.createdAt;
  return x;
}
function ensureCte(){ db.group.cteAgreements = Array.isArray(db.group.cteAgreements) ? db.group.cteAgreements.map(normalizeCteAgreement) : [];
  db.group.guardCommissions = Array.isArray(db.group.guardCommissions) ? db.group.guardCommissions.map(normalizeGuardCommission) : []; ensureAgenda(); }
function cteStatusLabel(s){ return ({'pendiente':'Pendiente','en proceso':'En proceso','cumplido':'Cumplido','vencido':'Vencido'})[s] || s; }
function cteEffectiveStatus(a){ const x=normalizeCteAgreement(a); if(x.status!=='cumplido' && x.dueDate < today()) return 'vencido'; return x.status; }
function cteAgreementSummary(){ ensureCte(); const arr=db.group.cteAgreements.map(normalizeCteAgreement); return {total:arr.length, pendiente:arr.filter(a=>cteEffectiveStatus(a)==='pendiente').length, proceso:arr.filter(a=>cteEffectiveStatus(a)==='en proceso').length, cumplido:arr.filter(a=>cteEffectiveStatus(a)==='cumplido').length, vencido:arr.filter(a=>cteEffectiveStatus(a)==='vencido').length}; }
function cteAgendaTitle(a){ const text=String(a.description||'').trim().slice(0,70); return 'Acuerdo CTE: ' + (text || a.type); }
function syncCteAgendaEvent(a){
  ensureCte(); ensureAgenda();
  const idx=db.group.cteAgreements.findIndex(x=>x.id===a.id);
  if(idx<0) return a;
  let ag = normalizeCteAgreement(a);
  if(!ag.autoAgenda || !ag.dueDate){
    if(ag.agendaEventId) db.group.agenda = db.group.agenda.filter(e=>e.id!==ag.agendaEventId);
    ag.agendaEventId=''; db.group.cteAgreements[idx]=ag; return ag;
  }
  const ev = normalizeAgendaEvent({
    id: ag.agendaEventId || uid(), title: cteAgendaTitle(ag), type: 'CTE', date: ag.dueDate,
    priority: ag.priority, repeat: 'ninguna', studentId: '',
    description: 'Tipo: '+ag.type+'\nResponsable: '+ag.responsibleType+(ag.responsibleName?' - '+ag.responsibleName:'')+'\nAcuerdo: '+ag.description+'\nEvidencia/avance: '+(ag.evidence||'Sin evidencia registrada.'),
    status: ag.status==='cumplido' ? 'hecho' : 'pendiente', createdAt: ag.createdAt, updatedAt: new Date().toISOString()
  });
  const evIdx=db.group.agenda.findIndex(e=>e.id===ev.id);
  if(evIdx>=0) db.group.agenda[evIdx]=ev; else db.group.agenda.push(ev);
  ag.agendaEventId=ev.id; db.group.cteAgreements[idx]=ag; return ag;
}
function renderCteAgreements(){
  ensureCte();
  const sum=cteAgreementSummary();
  const editing = cteEditingId ? normalizeCteAgreement(db.group.cteAgreements.find(a=>a.id===cteEditingId)||{}) : null;
  const list=db.group.cteAgreements.map(normalizeCteAgreement).sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
  const filtered=cteFilterStatus ? list.filter(a=>cteEffectiveStatus(a)===cteFilterStatus) : list;
  const quickBar='<div class="cte-quick-bar"><span style="font-size:13px;font-weight:800;white-space:nowrap">&#9889; Rapido:</span><input id="cte-quick-desc" placeholder="Acuerdo del CTE..."/><input id="cte-quick-date" type="date" value="'+today()+'"/><button class="mini" id="cte-quick-save" style="background:var(--primary);color:#fff">+ Guardar</button></div>';
  return quickBar+'<div class="card"><div class="section-title">Acuerdos CTE</div><div class="help">Usa la captura rapida durante la reunion. Completa el formulario despues.</div><div class="help">Registra acuerdos, responsables, fecha compromiso, evidencia y seguimiento. Cada acuerdo puede crear un recordatorio automático en Agenda.</div></div>'+
  '<div class="dash-kpis cte-kpis">'+
    '<button class="dash-kpi" data-cte-filter=""><b>'+sum.total+'</b><span>Total</span></button>'+
    '<button class="dash-kpi" data-cte-filter="pendiente"><b>'+sum.pendiente+'</b><span>Pendientes</span></button>'+
    '<button class="dash-kpi" data-cte-filter="en proceso"><b>'+sum.proceso+'</b><span>En proceso</span></button>'+
    '<button class="dash-kpi danger" data-cte-filter="vencido"><b>'+sum.vencido+'</b><span>Vencidos</span></button>'+
  '</div>'+renderCteForm(editing)+
  '<div class="card"><div class="section-title">Lista de acuerdos</div><div class="row row2" style="margin-bottom:10px"><button class="btn secondary" id="cte-export-xlsx">Exportar Excel</button><button class="btn secondary" id="cte-export-json">Exportar JSON</button></div>'+
    (filtered.length?filtered.map(renderCteItem).join(''):'<div class="small">No hay acuerdos con este filtro.</div>')+'</div>';
}
function renderCteForm(a){
  const ag=a||normalizeCteAgreement({});
  return '<div class="card"><div class="section-title">'+(a?'Editar acuerdo':'Nuevo acuerdo CTE')+'</div><div class="row">'+
    '<div class="row row2"><div><div class="small">Tipo de acuerdo</div><select id="cte-type">'+CTE_TYPES.map(t=>'<option '+(ag.type===t?'selected':'')+'>'+t+'</option>').join('')+'</select></div><div><div class="small">Prioridad</div><select id="cte-priority">'+AGENDA_PRIORITIES.map(p=>'<option value="'+p+'" '+(ag.priority===p?'selected':'')+'>'+agendaPriorityLabel(p)+'</option>').join('')+'</select></div></div>'+
    '<div class="row row2"><div><div class="small">Responsable</div><select id="cte-responsible-type">'+CTE_RESPONSIBLE_TYPES.map(t=>'<option '+(ag.responsibleType===t?'selected':'')+'>'+t+'</option>').join('')+'</select></div><div><div class="small">Nombre / área responsable</div><input id="cte-responsible-name" value="'+esc(ag.responsibleName)+'" placeholder="Ej. Dirección, Comité de lectura"></div></div>'+
    '<div class="row row2"><div><div class="small">Fecha compromiso *</div><input id="cte-due" type="date" value="'+esc(ag.dueDate)+'"></div><div><div class="small">Estatus</div><select id="cte-status">'+CTE_STATUSES.map(st=>'<option value="'+st+'" '+(ag.status===st?'selected':'')+'>'+cteStatusLabel(st)+'</option>').join('')+'</select></div></div>'+
    '<div class="field"><div class="small">Descripción del acuerdo *</div><textarea id="cte-description" rows="4" placeholder="Describe el acuerdo con claridad: qué se hará, para qué y cómo se dará seguimiento.">'+esc(ag.description)+'</textarea>'+micBtn('cte-description')+'</div>'+
    '<div class="field"><div class="small">Evidencia o avance</div><textarea id="cte-evidence" rows="3" placeholder="Describe evidencia, avance o producto esperado. No se adjuntan archivos en esta etapa.">'+esc(ag.evidence)+'</textarea>'+micBtn('cte-evidence')+'</div>'+
    '<label class="check-line"><input id="cte-auto-agenda" type="checkbox" '+(ag.autoAgenda?'checked':'')+'> Crear/actualizar recordatorio automático en Agenda</label>'+ 
    '<div class="row row2"><button class="btn secondary" id="cte-cancel">'+(a?'Cancelar edición':'Limpiar')+'</button><button class="btn primary" id="cte-save">'+(a?'Guardar cambios':'Guardar acuerdo')+'</button></div></div></div>';
}
function renderCteItem(a){ const st=cteEffectiveStatus(a); return '<div class="cte-item '+agendaPriorityClass(a.priority)+' '+(st==='vencido'?'overdue':'')+'"><div class="agenda-icon">✅</div><div class="agenda-main"><b>'+esc(a.description||'(Sin descripción)')+'</b><div class="small">'+esc(a.type)+' · '+esc(cteStatusLabel(st))+' · vence '+esc(a.dueDate)+' · '+esc(agendaPriorityLabel(a.priority))+'</div><div class="help">Responsable: '+esc(a.responsibleType)+(a.responsibleName?' · '+esc(a.responsibleName):'')+(a.evidence?' · Evidencia/avance: '+esc(a.evidence):'')+'</div></div><div class="agenda-actions"><button class="mini" data-cte-edit="'+a.id+'">Editar</button>'+(st!=='cumplido'?'<button class="mini" data-cte-done="'+a.id+'">Cumplido</button>':'')+'<button class="mini" data-cte-delete="'+a.id+'">Eliminar</button></div></div>'; }
function bindCteAgreements(){
  bindMicButtons();
  document.getElementById('cte-quick-save')?.addEventListener('click',()=>{
    const desc=document.getElementById('cte-quick-desc')?.value.trim();
    const date=document.getElementById('cte-quick-date')?.value;
    if(!desc){ toast('Escribe una descripcion rapida'); return; }
    ensureCte();
    const ag=normalizeCteAgreement({description:desc,dueDate:date||today(),priority:'media',autoAgenda:true});
    db.group.cteAgreements.push(ag); syncCteAgendaEvent(ag);
    if(!saveDb()) return; toast('Acuerdo CTE guardado');
    const el=document.getElementById('cte-quick-desc'); if(el) el.value='';
    renderCurrentScreen();
  });
  document.querySelectorAll('[data-cte-filter]').forEach(btn=>btn.onclick=()=>{ cteFilterStatus=btn.dataset.cteFilter; renderCurrentScreen(); });
  document.getElementById('cte-cancel')?.addEventListener('click',()=>{ cteEditingId=''; renderCurrentScreen(); });
  document.getElementById('cte-save')?.addEventListener('click',()=>{
    const description=valOf('cte-description').trim(); const dueDate=valOf('cte-due'); if(!description||!dueDate){ toast('Descripción y fecha compromiso son obligatorias'); return; }
    ensureCte(); const previous=cteEditingId ? db.group.cteAgreements.find(x=>x.id===cteEditingId) : null;
    const ag=normalizeCteAgreement({ id: cteEditingId || uid(), type: valOf('cte-type'), responsibleType: valOf('cte-responsible-type'), responsibleName: valOf('cte-responsible-name').trim(), description, dueDate, priority: valOf('cte-priority'), status: valOf('cte-status'), evidence: valOf('cte-evidence').trim(), autoAgenda: document.getElementById('cte-auto-agenda')?.checked !== false, createdAt: previous?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString(), agendaEventId: previous?.agendaEventId || '' });
    const idx=db.group.cteAgreements.findIndex(x=>x.id===ag.id); if(idx>=0) db.group.cteAgreements[idx]=ag; else db.group.cteAgreements.push(ag); syncCteAgendaEvent(ag); if(!saveDb()) return; cteEditingId=''; toast('Acuerdo CTE guardado'); renderCurrentScreen();
  });
  document.querySelectorAll('[data-cte-edit]').forEach(btn=>btn.onclick=()=>{ cteEditingId=btn.dataset.cteEdit; renderCurrentScreen(); });
  document.querySelectorAll('[data-cte-done]').forEach(btn=>btn.onclick=()=>{ const a=db.group.cteAgreements.find(x=>x.id===btn.dataset.cteDone); if(a){ a.status='cumplido'; a.updatedAt=new Date().toISOString(); syncCteAgendaEvent(a); saveDb(); toast('Acuerdo marcado como cumplido'); renderCurrentScreen(); }});
  document.querySelectorAll('[data-cte-delete]').forEach(btn=>btn.onclick=()=>{ if(!confirm('¿Eliminar este acuerdo CTE?')) return; const a=db.group.cteAgreements.find(x=>x.id===btn.dataset.cteDelete); if(a?.agendaEventId) db.group.agenda=db.group.agenda.filter(e=>e.id!==a.agendaEventId); db.group.cteAgreements=db.group.cteAgreements.filter(x=>x.id!==btn.dataset.cteDelete); saveDb(); toast('Acuerdo eliminado'); renderCurrentScreen(); });
  document.getElementById('cte-export-xlsx')?.addEventListener('click',exportCteExcel); document.getElementById('cte-export-json')?.addEventListener('click',exportCteJson);
}
function exportCteExcel(){ ensureCte(); const rows=db.group.cteAgreements.map(a=>({tipo:a.type,responsable_tipo:a.responsibleType,responsable:a.responsibleName,descripcion:a.description,fecha_compromiso:a.dueDate,prioridad:a.priority,estatus:cteEffectiveStatus(a),evidencia_avance:a.evidence,recordatorio_agenda:a.autoAgenda?'sí':'no',fecha_creacion:a.createdAt,fecha_actualizacion:a.updatedAt})); const wb=XLSX.utils.book_new(); const ws=XLSX.utils.json_to_sheet(rows); styleSheet(ws); XLSX.utils.book_append_sheet(wb,ws,'ACUERDOS_CTE'); XLSX.writeFile(wb,'ProfeQr_Acuerdos_CTE_'+today()+'.xlsx'); }
function exportCteJson(){ ensureCte(); downloadTextFile('ProfeQr_Acuerdos_CTE_'+today()+'.json', JSON.stringify({cteAgreements:db.group.cteAgreements,exportedAt:new Date().toISOString()},null,2), 'application/json;charset=utf-8'); }


/* --- Guardias y comisiones --- */
const GC_TYPES = ['Guardia','Honores','Comisión','Otro'];
const GC_GUARD_TYPES = ['Entrada','Receso','Salida','Evento especial','Diaria','Otro'];
const GC_ZONES = ['Entrada','Patio','Cancha','Baños','Pasillos','Cooperativa','Escaleras','Aula','Salida','Otro'];
const GC_COMMISSION_TYPES = ['Lectura','Higiene','Seguridad','Periódico mural','Convivencia','Deportes','Cuidado del agua','Materiales','Otro'];
const GC_RESPONSIBLES = ['Maestro','Directivo','Comité','Grupo','Otro'];
const GC_STATUS = ['pendiente','en proceso','cumplido','cancelado'];
let gcEditingId = '';
let gcFilterType = '';
let gcFilterSpecial = '';

function normalizeGuardCommission(g={}){
  const x = g && typeof g === 'object' ? {...g} : {};
  x.id = x.id || uid();
  x.kind = GC_TYPES.includes(x.kind) ? x.kind : 'Guardia';
  x.title = x.title || (x.kind === 'Guardia' ? 'Guardia escolar' : x.kind === 'Honores' ? 'Honores a la bandera' : 'Comisión escolar');
  x.guardType = x.guardType || '';
  x.zone = x.zone || '';
  x.commissionType = x.commissionType || '';
  x.responsibleType = GC_RESPONSIBLES.includes(x.responsibleType) ? x.responsibleType : 'Maestro';
  x.responsibleName = x.responsibleName || '';
  x.groupName = x.groupName || '';
  x.date = x.date || today();
  x.startTime = x.startTime || '';
  x.endTime = x.endTime || '';
  x.repeat = AGENDA_REPEAT.includes(x.repeat) ? x.repeat : 'ninguna';
  x.priority = AGENDA_PRIORITIES.includes(x.priority) ? x.priority : 'media';
  x.description = x.description || '';
  x.expectedProduct = x.expectedProduct || '';
  x.observations = x.observations || '';
  x.status = GC_STATUS.includes(x.status) ? x.status : 'pendiente';
  x.autoAgenda = x.autoAgenda !== false;
  x.agendaEventId = x.agendaEventId || '';
  x.createdAt = x.createdAt || new Date().toISOString();
  x.updatedAt = x.updatedAt || x.createdAt;
  return x;
}
function ensureGuardCommissions(){ db.group.guardCommissions = Array.isArray(db.group.guardCommissions) ? db.group.guardCommissions.map(normalizeGuardCommission) : []; ensureAgenda(); }
function guardStatusLabel(st){ return ({pendiente:'Pendiente','en proceso':'En proceso',cumplido:'Cumplido',cancelado:'Cancelado'})[st] || st; }
function guardTypeIcon(kind){ return ({Guardia:'🛡️',Honores:'🇲🇽','Comisión':'📌',Otro:'🧭'})[kind] || '🧭'; }
function guardEffectiveStatus(g){ const x=normalizeGuardCommission(g); if(x.status==='cumplido'||x.status==='cancelado') return x.status; if(x.date < today()) return 'vencido'; return x.status; }
function guardSummary(){ ensureGuardCommissions(); const arr=db.group.guardCommissions.map(normalizeGuardCommission); return {total:arr.length, guardias:arr.filter(x=>x.kind==='Guardia').length, honores:arr.filter(x=>x.kind==='Honores').length, comisiones:arr.filter(x=>x.kind==='Comisión').length, vencidos:arr.filter(x=>guardEffectiveStatus(x)==='vencido').length}; }
function guardAgendaTitle(g){ const x=normalizeGuardCommission(g); return `${guardTypeIcon(x.kind)} ${x.title || x.kind}`; }
function syncGuardAgendaEvent(gc){ ensureGuardCommissions(); ensureAgenda(); const idx=db.group.guardCommissions.findIndex(x=>x.id===gc.id); if(idx<0) return gc; const g=normalizeGuardCommission(gc); if(!g.autoAgenda){ if(g.agendaEventId) db.group.agenda=db.group.agenda.filter(e=>e.id!==g.agendaEventId); g.agendaEventId=''; db.group.guardCommissions[idx]=g; return g; }
  const detail=[];
  if(g.guardType) detail.push('Tipo de guardia: '+g.guardType);
  if(g.zone) detail.push('Zona/área: '+g.zone);
  if(g.commissionType) detail.push('Comisión: '+g.commissionType);
  if(g.groupName) detail.push('Grupo: '+g.groupName);
  detail.push('Responsable: '+g.responsibleType+(g.responsibleName?' - '+g.responsibleName:''));
  if(g.description) detail.push('Indicaciones: '+g.description);
  if(g.expectedProduct) detail.push('Producto esperado: '+g.expectedProduct);
  if(g.observations) detail.push('Observaciones: '+g.observations);
  const ev=normalizeAgendaEvent({id:g.agendaEventId||uid(), title:guardAgendaTitle(g), type:g.kind==='Honores'?'Honores':g.kind==='Comisión'?'Comisión':'Guardia', date:g.date, startTime:g.startTime, endTime:g.endTime, priority:g.priority, repeat:g.repeat, description:detail.join('\n'), status:g.status==='cumplido'||g.status==='cancelado'?'hecho':'pendiente', createdAt:g.createdAt, updatedAt:new Date().toISOString()});
  const evIdx=db.group.agenda.findIndex(e=>e.id===ev.id); if(evIdx>=0) db.group.agenda[evIdx]=ev; else db.group.agenda.push(ev); g.agendaEventId=ev.id; db.group.guardCommissions[idx]=g; return g;
}
function renderGuardCommissions(){
  ensureGuardCommissions(); const sum=guardSummary(); const editing=gcEditingId?normalizeGuardCommission(db.group.guardCommissions.find(x=>x.id===gcEditingId)||{}):null; const list=db.group.guardCommissions.map(normalizeGuardCommission).sort((a,b)=>(a.date+a.startTime).localeCompare(b.date+b.startTime)); const filtered=gcFilterSpecial==='vencidos' ? list.filter(x=>guardEffectiveStatus(x)==='vencido') : (gcFilterType?list.filter(x=>x.kind===gcFilterType):list);
  return '<div class="card"><div class="section-title">Guardias y comisiones</div><div class="help">Organiza guardias de patio, honores a la bandera y comisiones escolares. Cada registro puede crear un evento automático en Agenda.</div></div>'+ 
  '<div class="dash-kpis cte-kpis">'+
    '<button class="dash-kpi" data-gc-filter=""><b>'+sum.total+'</b><span>Total</span></button>'+ 
    '<button class="dash-kpi" data-gc-filter="Guardia"><b>'+sum.guardias+'</b><span>Guardias</span></button>'+ 
    '<button class="dash-kpi" data-gc-filter="Honores"><b>'+sum.honores+'</b><span>Honores</span></button>'+ 
    '<button class="dash-kpi" data-gc-filter="Comisión"><b>'+sum.comisiones+'</b><span>Comisiones</span></button>'+ 
    '<button class="dash-kpi danger" data-gc-filter="vencidos"><b>'+sum.vencidos+'</b><span>Vencidos</span></button>'+ 
  '</div>'+renderGuardForm(editing)+
  '<div class="card"><div class="section-title">Lista de guardias y comisiones</div><div class="row row2" style="margin-bottom:10px"><button class="btn secondary" id="gc-export-xlsx">Exportar Excel</button><button class="btn secondary" id="gc-export-json">Exportar JSON</button></div>'+ (filtered.length?filtered.map(renderGuardItem).join(''):'<div class="small">No hay registros con este filtro.</div>')+'</div>';
}
function renderGuardForm(g){ const x=g||normalizeGuardCommission({}); return '<div class="card"><div class="section-title">'+(g?'Editar registro':'Nuevo registro')+'</div><div class="row">'+
  '<div class="row row2"><div><div class="small">Tipo *</div><select id="gc-kind">'+GC_TYPES.map(t=>'<option '+(x.kind===t?'selected':'')+'>'+t+'</option>').join('')+'</select></div><div><div class="small">Prioridad</div><select id="gc-priority">'+AGENDA_PRIORITIES.map(p=>'<option value="'+p+'" '+(x.priority===p?'selected':'')+'>'+agendaPriorityLabel(p)+'</option>').join('')+'</select></div></div>'+ 
  '<div><div class="small">Título *</div><input id="gc-title" value="'+esc(x.title)+'" placeholder="Ej. Guardia patio norte / Honores 2°G / Comisión de lectura"></div>'+ 
  '<div class="row row3"><div><div class="small">Fecha *</div><input id="gc-date" type="date" value="'+esc(x.date)+'"></div><div><div class="small">Hora inicio</div><input id="gc-start" type="time" value="'+esc(x.startTime)+'"></div><div><div class="small">Hora fin</div><input id="gc-end" type="time" value="'+esc(x.endTime)+'"></div></div>'+ 
  '<div class="row row2"><div><div class="small">Repetición</div><select id="gc-repeat">'+AGENDA_REPEAT.map(r=>'<option value="'+r+'" '+(x.repeat===r?'selected':'')+'>'+r+'</option>').join('')+'</select></div><div><div class="small">Estatus</div><select id="gc-status">'+GC_STATUS.map(st=>'<option value="'+st+'" '+(x.status===st?'selected':'')+'>'+guardStatusLabel(st)+'</option>').join('')+'</select></div></div>'+ 
  '<div class="row row2"><div><div class="small">Tipo de guardia</div><select id="gc-guard-type"><option value="">No aplica</option>'+GC_GUARD_TYPES.map(t=>'<option '+(x.guardType===t?'selected':'')+'>'+t+'</option>').join('')+'</select></div><div><div class="small">Zona / área</div><select id="gc-zone"><option value="">No aplica</option>'+GC_ZONES.map(t=>'<option '+(x.zone===t?'selected':'')+'>'+t+'</option>').join('')+'</select></div></div>'+ 
  '<div class="row row2"><div><div class="small">Tipo de comisión</div><select id="gc-commission-type"><option value="">No aplica</option>'+GC_COMMISSION_TYPES.map(t=>'<option '+(x.commissionType===t?'selected':'')+'>'+t+'</option>').join('')+'</select></div><div><div class="small">Grupo, si aplica</div><input id="gc-group-name" value="'+esc(x.groupName)+'" placeholder="Ej. 2°G"></div></div>'+ 
  '<div class="row row2"><div><div class="small">Responsable</div><select id="gc-responsible-type">'+GC_RESPONSIBLES.map(t=>'<option '+(x.responsibleType===t?'selected':'')+'>'+t+'</option>').join('')+'</select></div><div><div class="small">Nombre / área responsable</div><input id="gc-responsible-name" value="'+esc(x.responsibleName)+'" placeholder="Ej. Mtro. López / Comité de lectura"></div></div>'+ 
  '<div class="field"><div class="small">Descripción / indicaciones</div><textarea id="gc-description" rows="3" placeholder="Indicaciones, zona exacta, actividad o propósito.">'+esc(x.description)+'</textarea>'+micBtn('gc-description')+'</div>'+ 
  '<div class="field"><div class="small">Producto esperado, si aplica</div><textarea id="gc-product" rows="2" placeholder="Ej. Evidencia de lectura, periódico mural, lista de asistencia en honores.">'+esc(x.expectedProduct)+'</textarea>'+micBtn('gc-product')+'</div>'+ 
  '<div class="field"><div class="small">Observaciones</div><textarea id="gc-observations" rows="3" placeholder="Notas de seguimiento. Si se detecta una situación escolar, genera incidencia aparte.">'+esc(x.observations)+'</textarea>'+micBtn('gc-observations')+'</div>'+ 
  '<label class="check-line"><input id="gc-auto-agenda" type="checkbox" '+(x.autoAgenda?'checked':'')+'> Crear/actualizar evento automático en Agenda</label>'+ 
  '<div class="row row2"><button class="btn secondary" id="gc-cancel">'+(g?'Cancelar edición':'Limpiar')+'</button><button class="btn primary" id="gc-save">'+(g?'Guardar cambios':'Guardar registro')+'</button></div></div></div>'; }
function renderGcList(list){ return list.length ? list.map(renderGuardItem).join('') : '<div class="small">No hay registros.</div>'; }
function renderGuardItem(g){ const st=guardEffectiveStatus(g); return '<div class="cte-item '+agendaPriorityClass(g.priority)+' '+(st==='vencido'?'overdue':'')+'"><div class="agenda-icon">'+guardTypeIcon(g.kind)+'</div><div class="agenda-main"><b>'+esc(g.title||g.kind)+'</b><div class="small">'+esc(g.kind)+' · '+esc(guardStatusLabel(st))+' · '+esc(g.date)+(g.startTime?' '+esc(g.startTime):'')+(g.repeat&&g.repeat!=='ninguna'?' · repite '+esc(g.repeat):'')+' · '+esc(agendaPriorityLabel(g.priority))+'</div><div class="help">Responsable: '+esc(g.responsibleType)+(g.responsibleName?' · '+esc(g.responsibleName):'')+(g.zone?' · Zona: '+esc(g.zone):'')+(g.commissionType?' · Comisión: '+esc(g.commissionType):'')+(g.observations?' · Observaciones: '+esc(g.observations):'')+'</div></div><div class="agenda-actions"><button class="mini" data-gc-edit="'+g.id+'">Editar</button>'+(st!=='cumplido'?'<button class="mini" data-gc-done="'+g.id+'">Cumplido</button>':'')+'<button class="mini" data-gc-inc="'+g.id+'">Incidencia</button><button class="mini" data-gc-delete="'+g.id+'">Eliminar</button></div></div>'; }
function bindGuardCommissions(){ bindMicButtons(); document.querySelectorAll('[data-gc-filter]').forEach(btn=>btn.onclick=()=>{ const f=btn.dataset.gcFilter; gcFilterSpecial = f==='vencidos' ? 'vencidos' : ''; gcFilterType = gcFilterSpecial ? '' : f; renderCurrentScreen(); }); document.getElementById('gc-cancel')?.addEventListener('click',()=>{gcEditingId='';renderCurrentScreen();}); document.getElementById('gc-save')?.addEventListener('click',()=>{ const title=valOf('gc-title').trim(), date=valOf('gc-date'); if(!title||!date){toast('Título y fecha son obligatorios');return;} ensureGuardCommissions(); const previous=gcEditingId?db.group.guardCommissions.find(x=>x.id===gcEditingId):null; const gc=normalizeGuardCommission({id:gcEditingId||uid(),kind:valOf('gc-kind'),title,guardType:valOf('gc-guard-type'),zone:valOf('gc-zone'),commissionType:valOf('gc-commission-type'),responsibleType:valOf('gc-responsible-type'),responsibleName:valOf('gc-responsible-name').trim(),groupName:valOf('gc-group-name').trim(),date,startTime:valOf('gc-start'),endTime:valOf('gc-end'),repeat:valOf('gc-repeat'),priority:valOf('gc-priority'),description:valOf('gc-description').trim(),expectedProduct:valOf('gc-product').trim(),observations:valOf('gc-observations').trim(),status:valOf('gc-status'),autoAgenda:document.getElementById('gc-auto-agenda')?.checked!==false,createdAt:previous?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString(),agendaEventId:previous?.agendaEventId||''}); const idx=db.group.guardCommissions.findIndex(x=>x.id===gc.id); if(idx>=0) db.group.guardCommissions[idx]=gc; else db.group.guardCommissions.push(gc); syncGuardAgendaEvent(gc); if(!saveDb()) return; gcEditingId=''; toast('Guardia/comisión guardada'); renderCurrentScreen(); }); document.querySelectorAll('[data-gc-edit]').forEach(btn=>btn.onclick=()=>{gcEditingId=btn.dataset.gcEdit;renderCurrentScreen();}); document.querySelectorAll('[data-gc-done]').forEach(btn=>btn.onclick=()=>{const g=db.group.guardCommissions.find(x=>x.id===btn.dataset.gcDone); if(g){g.status='cumplido';g.updatedAt=new Date().toISOString();syncGuardAgendaEvent(g);saveDb();toast('Registro marcado como cumplido');renderCurrentScreen();}}); document.querySelectorAll('[data-gc-delete]').forEach(btn=>btn.onclick=()=>{if(!confirm('¿Eliminar este registro de guardia/comisión?'))return; const g=db.group.guardCommissions.find(x=>x.id===btn.dataset.gcDelete); if(g?.agendaEventId) db.group.agenda=db.group.agenda.filter(e=>e.id!==g.agendaEventId); db.group.guardCommissions=db.group.guardCommissions.filter(x=>x.id!==btn.dataset.gcDelete); saveDb(); toast('Registro eliminado'); renderCurrentScreen();}); document.querySelectorAll('[data-gc-inc]').forEach(btn=>btn.onclick=()=>{ const g=db.group.guardCommissions.find(x=>x.id===btn.dataset.gcInc); if(g){ toast('Abriendo Bitácora de Incidencias'); currentScreen='bitacora'; renderCurrentScreen(); }}); document.getElementById('gc-export-xlsx')?.addEventListener('click',exportGuardExcel); document.getElementById('gc-export-json')?.addEventListener('click',exportGuardJson); }
function exportGuardExcel(){ ensureGuardCommissions(); const rows=db.group.guardCommissions.map(g=>({tipo:g.kind,titulo:g.title,tipo_guardia:g.guardType,zona:g.zone,tipo_comision:g.commissionType,responsable_tipo:g.responsibleType,responsable:g.responsibleName,grupo:g.groupName,fecha:g.date,hora_inicio:g.startTime,hora_fin:g.endTime,repeticion:g.repeat,prioridad:g.priority,estatus:guardEffectiveStatus(g),descripcion:g.description,producto_esperado:g.expectedProduct,observaciones:g.observations,recordatorio_agenda:g.autoAgenda?'sí':'no',fecha_creacion:g.createdAt,fecha_actualizacion:g.updatedAt})); const wb=XLSX.utils.book_new(); const ws=XLSX.utils.json_to_sheet(rows); styleSheet(ws); XLSX.utils.book_append_sheet(wb,ws,'GUARDIAS_COMISIONES'); XLSX.writeFile(wb,'ProfeQr_Guardias_Comisiones_'+today()+'.xlsx'); }
function exportGuardJson(){ ensureGuardCommissions(); downloadTextFile('ProfeQr_Guardias_Comisiones_'+today()+'.json', JSON.stringify({guardCommissions:db.group.guardCommissions,exportedAt:new Date().toISOString()},null,2), 'application/json;charset=utf-8'); }



/* --- Students --- */
function downloadStudentTemplate(){
  const wb = XLSX.utils.book_new();
  const captura = Array.from({length:50},(_,i)=>({'No. Lista':i+1,'Nombre completo':''}));
  const instrucciones = [
    {'Instrucciones':'1. Escribe solo el número de lista y el nombre completo del estudiante.'},
    {'Instrucciones':'2. No cambies los encabezados.'},
    {'Instrucciones':'3. Guarda el archivo y súbelo en ProfeQr.'},
    {'Instrucciones':'4. El QR se genera automáticamente con base en el grupo y el número de lista.'}
  ];
  const ws1 = XLSX.utils.json_to_sheet(captura);
  const ws2 = XLSX.utils.json_to_sheet(instrucciones);
  styleSheet(ws1); styleSheet(ws2);
  XLSX.utils.book_append_sheet(wb, ws1, 'CAPTURA_ALUMNOS');
  XLSX.utils.book_append_sheet(wb, ws2, 'INSTRUCCIONES');
  XLSX.writeFile(wb, 'Plantilla_ProfeQr_Alumnos.xlsx');
}

function renderStudents(){
  const students = [...db.group.students].sort((a,b)=>(a.listNo||999)-(b.listNo||999));
  const activeCount = students.filter(s=>s.active!==false).length;
  const inactiveCount = students.length - activeCount;
  return `
  <div class="card">
    <div class="section-title">Carga rápida del grupo</div>
    <div class="row row2">
      <button class="btn secondary" id="download-template-btn">Descargar plantilla Excel</button>
      <button class="btn primary" id="upload-template-btn" ${isExpired()?'disabled':''}>Subir plantilla</button>
      <input id="upload-template-input" type="file" accept=".xlsx,.xls,.csv" class="hidden">
    </div>
    <div class="help">La plantilla te pide solo el número de lista y el nombre completo. Eso facilita la captura y evita errores al importar.</div>
  </div>
  <div class="card">
    <div class="section-title">Agregar alumno manualmente</div>
    <div class="row">
      <div><div class="small">No. de lista</div><input id="student-listno" inputmode="numeric"></div>
      <div><div class="small">Nombre completo</div><input id="student-name"></div>
      <button class="btn primary" id="student-add-btn" ${isExpired()?'disabled':''}>Agregar alumno</button>
    </div>
  </div>
  <div class="card">
    <div class="section-title">Lista de alumnos</div>
    <div class="help">Activos: ${activeCount} · Inactivos: ${inactiveCount}. Para no perder historial, los alumnos se suspenden en vez de eliminarse.</div>
    <div class="small">Buscar</div>
    <input id="student-search" placeholder="Nombre, número de lista o QR">
    <div id="students-list" style="margin-top:10px">
      ${students.map(s=>`
        <div class="item student-row" data-filter="${esc(`${s.name} ${s.listNo} ${s.qr}`)}">
          <div><div class="item-title">${esc(s.name)}</div><div class="item-sub">Lista ${s.listNo} · ${esc(s.qr)} · ${s.active===false?'Inactivo':'Activo'}</div></div>
          <button class="mini" data-toggle-student-status="${s.id}" ${isExpired()?'disabled':''}>${s.active===false?'Reactivar':'Suspender'}</button>
        </div>`).join('')}
      ${students.length===0 ? '<div class="small">Todavía no hay alumnos.</div>' : ''}
    </div>
  </div>`;
}
function bindStudents(){
  document.getElementById('download-template-btn').onclick = downloadStudentTemplate;
  document.getElementById('upload-template-btn').onclick = () => {
    if(!canWrite()) return writeBlockedMessage();
    document.getElementById('upload-template-input').click();
  };
  document.getElementById('upload-template-input').onchange = e => {
    if(!canWrite()) return writeBlockedMessage();
    const file = e.target.files[0];
    if(!file) return;
    const r = new FileReader();
    r.onload = ev => {
      const data = new Uint8Array(ev.target.result);
      const wb = XLSX.read(data,{type:'array'});
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws,{defval:''});
      const imported = rows.map(row=>{
        const keys = Object.keys(row);
        const lk = keys.find(k=>slug(k).includes('lista'));
        const nk = keys.find(k=>slug(k).includes('nombre'));
        const listNo = Number(row[lk]||0);
        const name = String(row[nk]||'').trim();
        if(!listNo || !name) return null;
        return {id:uid(), listNo, name, active:true, qr:qrCodeFor(db.config.group, listNo)};
      }).filter(Boolean).sort((a,b)=>a.listNo-b.listNo);
      if(!imported.length){ toast('La plantilla no tiene datos válidos'); return; }
      db.group.students = imported;
      if(!saveDb()) return;
      toast(`Grupo cargado: ${imported.length} alumnos`);
      renderCurrentScreen();
    };
    r.readAsArrayBuffer(file);
  };

  document.getElementById('student-add-btn').onclick = () => {
    if(!canWrite()) return writeBlockedMessage();
    const listNo = Number(document.getElementById('student-listno').value || 0);
    const name = document.getElementById('student-name').value.trim();
    if(!listNo || !name){ toast('Captura lista y nombre'); return; }
    if(db.group.students.some(s=>Number(s.listNo)===listNo)){ toast('Ese número de lista ya existe'); return; }
    db.group.students.push({id:uid(), listNo, name, active:true, qr:qrCodeFor(db.config.group, listNo)});
    db.group.students.sort((a,b)=>a.listNo-b.listNo);
    if(!saveDb()) return;
    toast('Alumno agregado');
    renderCurrentScreen();
  };

  document.querySelectorAll('[data-toggle-student-status]').forEach(btn=>btn.onclick = () => {
    if(!canWrite()) return writeBlockedMessage();
    const st = findStudent(btn.dataset.toggleStudentStatus);
    if(!st) return;
    if(st.active !== false){
      if(!confirm('Se suspenderá al alumno para que no aparezca en capturas nuevas, pero conservará su historial. ¿Continuar?')) return;
      st.active = false;
      toast('Alumno suspendido; historial conservado');
    } else {
      st.active = true;
      toast('Alumno reactivado');
    }
    if(!saveDb()) return;
    renderCurrentScreen();
  });

  document.getElementById('student-search').oninput = e => {
    const q = slug(e.target.value);
    document.querySelectorAll('.student-row').forEach(row=>{
      row.classList.toggle('hidden', q && !slug(row.dataset.filter).includes(q));
    });
  };
}

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

/* --- Cards --- */
function renderCards(){
  const students = [...getActiveStudents()].sort((a,b)=>(a.listNo||999)-(b.listNo||999)); // FIX v4: solo activos
  const activeCount = students.filter(s=>s.active!==false).length;
  const inactiveCount = students.length - activeCount;
  return `
  <div class="card no-print">
    <button class="btn primary" id="print-cards-btn">Imprimir tarjetas</button>
    <div class="help">Las tarjetas se acomodan 4 por hoja carta. El QR mide 6 x 6 cm para una lectura más confiable.</div>
  </div>
  <div id="print-area" class="print-grid">
    ${students.map(s=>`
      <div class="cred">
        <div class="cred-toptext">${esc(db.config.school)}</div>
        <div class="cred-toptext">Maestro: ${esc(db.config.teacher)}</div>
        <div class="cred-toptext">Grupo: ${esc(db.config.group)}</div>
        <div class="cred-name">${esc(s.name)}</div>
        <div class="qr-wrap"><div class="qr-box" id="qr-${s.id}"></div></div>
        <div class="cred-meta">${esc(s.qr)}</div>
      </div>`).join('')}
  </div>`;
}
function bindCards(){
  document.getElementById('print-cards-btn').onclick = () => window.print();
  db.group.students.forEach(s=>{
    const el = document.getElementById(`qr-${s.id}`);
    if(el){
      el.innerHTML = '';
      if(typeof QRCode === 'undefined'){ el.innerHTML = '<div class="small" style="color:var(--bad)">QRCode no disponible</div>'; return; }
      new QRCode(el, {text:s.qr,width:226,height:226,colorDark:'#000000',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.H});
    }
  });
}

/* --- Reports --- */
function attendanceReportData(range){
  const students = [...getActiveStudents()].sort((a,b)=>(a.listNo||999)-(b.listNo||999));
  const allDates = Object.keys(db.group.attendance).sort();
  const dates = allDates.filter(d=>(!range.start||d>=range.start)&&(!range.end||d<=range.end));
  const general = students.map(s=>{
    const row = {LISTA:s.listNo,NOMBRE:s.name};
    dates.forEach(d=>row[d]=(db.group.attendance[d]||[]).some(r=>r.studentId===s.id)?1:0);
    row.ASISTENCIAS = dates.reduce((acc,d)=>acc+(row[d]||0),0);
    row.FALTAS = dates.length - row.ASISTENCIAS;
    row.PORCENTAJE = dates.length ? `${Math.round((row.ASISTENCIAS/dates.length)*100)}%` : '0%';
    return row;
  });
  const faltas = [...general].map(r=>({LISTA:r.LISTA,NOMBRE:r.NOMBRE,FALTAS:r.FALTAS,ASISTENCIAS:r.ASISTENCIAS,PORCENTAJE:r.PORCENTAJE}));
  const orden = [...faltas].sort((a,b)=>b.FALTAS-a.FALTAS||a.NOMBRE.localeCompare(b.NOMBRE));
  const base = dates.map(d=>{ const pres=(db.group.attendance[d]||[]).length; return {FECHA:d,ASISTENCIAS:pres,FALTAS:Math.max(students.length-pres,0),TOTAL:students.length}; });
  return {general,faltas,orden,base};
}
function worksReportData(range){
  const works = db.group.works.filter(w=>(!range.start||w.date>=range.start)&&(!range.end||w.date<=range.end));
  const detalle = works.map(w=>({FECHA:w.date,LISTA:w.listNo,ALUMNO:w.studentName,CAMPO_FORMATIVO:w.campo,ASIGNATURA:w.asignatura,TRABAJO:w.title,PUNTAJE:w.score,HORA:w.time}));
  const base = [...detalle].sort((a,b)=>a.FECHA.localeCompare(b.FECHA)||a.ASIGNATURA.localeCompare(b.ASIGNATURA)||a.LISTA-b.LISTA);
  const resumenAlumnos = [];
  detalle.forEach(d=>{
    let item = resumenAlumnos.find(x=>x.LISTA===d.LISTA&&x.ALUMNO===d.ALUMNO);
    if(!item){ item = {LISTA:d.LISTA,ALUMNO:d.ALUMNO,TOTAL_PUNTOS:0,REGISTROS:0,PROMEDIO:0}; resumenAlumnos.push(item); }
    item.TOTAL_PUNTOS += Number(d.PUNTAJE||0);
    item.REGISTROS += 1;
    item.PROMEDIO = (item.TOTAL_PUNTOS/item.REGISTROS).toFixed(2);
  });
  const resumenTrabajos = [];
  detalle.forEach(d=>{
    let item = resumenTrabajos.find(x=>x.TRABAJO===d.TRABAJO&&x.ASIGNATURA===d.ASIGNATURA);
    if(!item){ item = {TRABAJO:d.TRABAJO,ASIGNATURA:d.ASIGNATURA,EXCELENTE:0,COMPLETO:0,INCOMPLETO:0,NO_ENTREGADO:0,PROMEDIO:0,_sum:0,_n:0}; resumenTrabajos.push(item); }
    if(d.PUNTAJE===3)item.EXCELENTE++; else if(d.PUNTAJE===2)item.COMPLETO++; else if(d.PUNTAJE===1)item.INCOMPLETO++; else item.NO_ENTREGADO++;
    item._sum += Number(d.PUNTAJE||0);
    item._n += 1;
    item.PROMEDIO = (item._sum/item._n).toFixed(2);
  });
  const limpio = resumenTrabajos.map(({_sum,_n,...r})=>r);
  return {detalle,base,resumenAlumnos,resumenTrabajos:limpio};
}


// CDN GUARD: verificar XLSX antes de exportar
function checkXLSX(){
  if(typeof XLSX === 'undefined'){
    toast('Librería Excel no cargada. Conéctate a internet y recarga.');
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
  const students = [...db.group.students].sort((a,b)=>(a.listNo||999)-(b.listNo||999));
  const attRows = Object.values(db.group.attendance).flat();
  const attDates = [...new Set(attRows.map(r=>r.date))];
  const todayAtt = (db.group.attendance[today()]||[]).length;
  return `
  <div class="card">
    <div class="section-title">Resumen General</div>
    <div class="report-grid">
      <div>
        <div class="small">Selecciona un alumno</div>
        <select id="internal-student-select">
          <option value="">Seleccionar alumno</option>
          ${students.map(s=>`<option value="${s.id}">Lista ${s.listNo} · ${esc(s.name)}</option>`).join('')}
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
      const s = db.group.students.find(x=>x.id===sel.value);
      const card = document.getElementById('internal-student-card');
      if(!s){
        card.className='help';
        card.innerHTML='Aquí podrás ver cuántas faltas y trabajos tiene un alumno en específico.';
        return;
      }
      const attRows = Object.values(db.group.attendance).flat().filter(r=>r.studentId===s.id);
      const uniqueDates = [...new Set(attRows.map(r=>r.date))];
      const totalDays = [...new Set(Object.values(db.group.attendance).flat().map(r=>r.date))].length;
      const works = db.group.works.filter(w=>w.studentId===s.id);
      const bitas = (db.group.bitacoraReports||[]).filter(r=>(r.studentIds||[]).includes(s.id));
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
      const month = document.getElementById('att-r-month').value;
      let start = document.getElementById('att-r-from').value;
      let end = document.getElementById('att-r-to').value;
      if(month){
        const [y,m] = month.split('-').map(Number);
        start = new Date(y,m-1,1).toISOString().slice(0,10);
        end = new Date(y,m,0).toISOString().slice(0,10);
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
      XLSX.writeFile(wb,`ProfeQr_Asistencia_${db.config.group}_${month||'reporte'}.xlsx`);
      toast('Reporte de asistencia exportado');
    };
  }

  if(reportsTab === 'works'){
    document.getElementById('works-export-btn').onclick = () => {
      const month = document.getElementById('works-r-month').value;
      let start = document.getElementById('works-r-from').value;
      let end = document.getElementById('works-r-to').value;
      if(month){
        const [y,m] = month.split('-').map(Number);
        start = new Date(y,m-1,1).toISOString().slice(0,10);
        end = new Date(y,m,0).toISOString().slice(0,10);
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
      XLSX.writeFile(wb,`ProfeQr_Trabajos_${db.config.group}_${month||'reporte'}.xlsx`);
      toast('Reporte de trabajos exportado');
    };
  }
}
function mountCharts(){
  const attCanvas = document.getElementById('att-chart');
  const worksCanvas = document.getElementById('works-chart');
  if(attCanvas){
    const dates = Object.keys(db.group.attendance).sort();
    const values = dates.map(d=>(db.group.attendance[d]||[]).length);
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

/* --- Settings --- */
function renderSettings(){
  const form = db.config;
  return `
  <div class="card">
    <div class="section-title">Editar datos</div>
    <div class="row">
      <div><div class="small">Escuela</div><input id="set-school" value="${esc(form.school)}"></div>
      <div><div class="small">CCT</div><input id="set-cct" value="${esc(form.cct||'')}"></div>
      <div><div class="small">Nombre del maestro</div><input id="set-teacher" value="${esc(form.teacher)}"></div>
      <div><div class="small">Director(a)</div><input id="set-director" value="${esc(form.director||'')}"></div>
      <div><div class="small">Zona escolar</div><input id="set-zone" value="${esc(form.zone||'')}"></div>
      <div><div class="small">Jefatura / Sector</div><input id="set-sector" value="${esc(form.sector||'')}"></div>
      <div><div class="small">Municipio</div><input id="set-municipality" value="${esc(form.municipality||'')}"></div>
      <div><div class="small">Domicilio escolar</div><input id="set-address" value="${esc(form.address||'')}"></div>
      <div><div class="small">Ciclo escolar</div><input id="set-cycle" value="${esc(form.cycle||'')}"></div>
      <div><div class="small">Nivel educativo</div><select id="set-level">${Object.keys(GRADES_BY_LEVEL).map(l=>`<option ${l===form.level?'selected':''}>${l}</option>`).join('')}</select></div>
      <div><div class="small">Grado</div><select id="set-grade"></select></div>
      <div><div class="small">Turno</div><select id="set-shift"><option ${form.shift==='Matutino'?'selected':''}>Matutino</option><option ${form.shift==='Vespertino'?'selected':''}>Vespertino</option></select></div>
      <div><div class="small">Grupo / Sección</div><select id="set-section"></select></div>
      <div><div class="small">Grupo generado</div><input id="set-group" readonly></div>
      <div><div class="small">Logo</div><input id="set-logo" type="file" accept="image/*"></div>
      <div id="set-logo-wrap">${form.logo?`<img src="${form.logo}" style="width:86px;height:86px;object-fit:contain;border-radius:18px">`:''}</div>
      <button class="btn primary" id="save-settings-btn">Guardar cambios</button>
    </div>
  </div>
  <div class="card">
    <div class="section-title">&#128274; Cambiar PIN</div>
    <div class="row">
      <div><div class="small">PIN actual</div><input id="set-pin-actual" type="password" inputmode="numeric" maxlength="4" placeholder="...."></div>
      <div class="row row2">
        <div><div class="small">PIN nuevo</div><input id="set-pin-nuevo" type="password" inputmode="numeric" maxlength="4" placeholder="...."></div>
        <div><div class="small">Confirmar</div><input id="set-pin-confirm" type="password" inputmode="numeric" maxlength="4" placeholder="...."></div>
      </div>
      <button class="btn secondary" id="change-pin-btn">Actualizar PIN</button>
    </div>
  </div>
  <div class="card">
    <div class="section-title">Paleta de colores</div>
    <div class="theme-grid">
      ${Object.entries(THEMES).map(([key,t])=>`
        <div class="theme-card ${form.theme===key?'active':''}" data-theme="${key}">
          <div class="theme-preview">
            <div class="theme-dot" style="background:${t.primary}"></div>
            <div class="theme-dot" style="background:${t.primary2}"></div>
            <div class="theme-dot" style="background:${t.primary3}"></div>
            <div class="theme-dot" style="background:${t.bg2}"></div>
          </div>
          <div class="item-title" style="font-size:14px">${t.name}</div>
        </div>`).join('')}
    </div>
  </div>
  <div class="card">
    <div class="section-title">Respaldo JSON</div>
    <div class="help">El respaldo JSON guarda una copia completa de la información de la app para restaurarla después en este u otro dispositivo.</div>
    <div class="row row2" style="margin-top:10px">
      <button class="btn secondary" id="export-json-btn">Exportar respaldo JSON</button>
      <label class="btn primary" style="display:grid;place-items:center">
        <input style="display:none" type="file" id="import-json-input" accept=".json,application/json">
        Importar respaldo JSON
      </label>
    </div>
  </div>`;
}
function bindSettings(){
  const levelEl = document.getElementById('set-level');
  const gradeEl = document.getElementById('set-grade');
  const shiftEl = document.getElementById('set-shift');
  const sectionEl = document.getElementById('set-section');
  const groupEl = document.getElementById('set-group');
  let logoData = db.config.logo || '';

  function refreshGrades(){
    const grades = GRADES_BY_LEVEL[levelEl.value];
    gradeEl.innerHTML = grades.map(g=>`<option ${g===db.config.grade?'selected':''}>${g}</option>`).join('');
    if(!grades.includes(gradeEl.value)) gradeEl.value = grades[0];
    refreshGroup();
  }
  function refreshSections(){
    const sections = SECTIONS_BY_SHIFT[shiftEl.value];
    sectionEl.innerHTML = sections.map(s=>`<option ${s===db.config.section?'selected':''}>${s}</option>`).join('');
    if(!sections.includes(sectionEl.value)) sectionEl.value = sections[0];
    refreshGroup();
  }
  function refreshGroup(){ groupEl.value = `${gradeEl.value}${sectionEl.value}`; }

  levelEl.onchange = refreshGrades;
  shiftEl.onchange = refreshSections;
  gradeEl.onchange = refreshGroup;
  sectionEl.onchange = refreshGroup;
  refreshGrades();
  refreshSections();

  document.getElementById('set-logo').onchange = e => {
    const file = e.target.files[0];
    if(!file) return;
    const r = new FileReader();
    r.onload = ()=>{ logoData = r.result; document.getElementById('set-logo-wrap').innerHTML = `<img src="${logoData}" style="width:86px;height:86px;object-fit:contain;border-radius:18px">`; };
    r.readAsDataURL(file);
  };

  document.getElementById('change-pin-btn')?.addEventListener('click',()=>{
    const actual=document.getElementById('set-pin-actual').value;
    const nuevo=document.getElementById('set-pin-nuevo').value;
    const conf=document.getElementById('set-pin-confirm').value;
    if(actual!==db.config.pin){ toast('PIN actual incorrecto'); return; }
    if(!/^\d{4}$/.test(nuevo)){ toast('Nuevo PIN debe ser 4 digitos'); return; }
    if(nuevo!==conf){ toast('PINes no coinciden'); return; }
    db.config.pin=nuevo; saveDb(); toast('PIN actualizado');
    ['set-pin-actual','set-pin-nuevo','set-pin-confirm'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  });
    document.querySelectorAll('[data-theme]').forEach(btn=>btn.onclick = ()=>{
    db.config.theme = btn.dataset.theme;
    if(!saveDb()) return;
    applyTheme(db.config.theme);
    document.querySelectorAll('[data-theme]').forEach(x=>x.classList.remove('active'));
    btn.classList.add('active');
  });

  document.getElementById('save-settings-btn').onclick = () => {
    const newGroup = groupEl.value;
    const newCct = document.getElementById('set-cct').value.trim();
    const qrWillChange = db.config.group !== newGroup || (db.config.cct || '') !== newCct;
    if(qrWillChange){
      const ok = confirm('Cambiar el grupo o el CCT regenerará los QR de todos los alumnos. Las tarjetas impresas dejarán de funcionar. ¿Deseas continuar?');
      if(!ok) return;
    }
    db.config.school = document.getElementById('set-school').value.trim();
    db.config.cct = newCct;
    db.config.teacher = document.getElementById('set-teacher').value.trim();
    db.config.director = document.getElementById('set-director').value.trim();
    db.config.zone = document.getElementById('set-zone').value.trim();
    db.config.sector = document.getElementById('set-sector').value.trim();
    db.config.municipality = document.getElementById('set-municipality').value.trim();
    db.config.address = document.getElementById('set-address').value.trim();
    db.config.cycle = document.getElementById('set-cycle').value.trim();
    db.config.level = levelEl.value;
    db.config.grade = gradeEl.value;
    db.config.shift = shiftEl.value;
    db.config.section = sectionEl.value;
    db.config.group = newGroup;
    db.config.logo = logoData;
    db.group.name = db.config.group;
    db.group.level = db.config.level;
    db.group.grade = db.config.grade;
    db.group.shift = db.config.shift;
    db.group.section = db.config.section;
    db.group.students = db.group.students.map(s=>({...s, qr:qrCodeFor(db.config.group, s.listNo)}));
    if(!saveDb()) return;
    toast('Ajustes guardados');
    renderApp();
  };

  document.getElementById('export-json-btn').onclick = ()=>{
    const blob = new Blob([JSON.stringify(db,null,2)],{type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `respaldo_profeqr_${today()}.json`;
    a.click();
    toast('Respaldo exportado');
  };

  const importInput = document.getElementById('import-json-input');
  importInput.onchange = e => {
    const file = e.target.files[0];
    if(!file) return;
    const ok = confirm('⚠️ Esto reemplazará TODOS los datos actuales con el respaldo. Esta acción no se puede deshacer. ¿Continuar?');
    if(!ok){ importInput.value = ''; return; }
    const r = new FileReader();
    r.onload = ()=> {
      try{
        db = safeDb(JSON.parse(r.result));
        if(!saveDb()) return;
        toast('Respaldo importado');
        renderApp();
      }catch(err){
        console.error(err);
        toast('JSON inválido o corrupto');
      }
    };
    r.readAsText(file);
  };
}



/* --- Bitácora de IncidenciasVersion v4 - Fase 4: acta final robusta --- */
let bitacoraDraft = null;
let bitacoraTab = 'new';
let bitacoraFilters = {student:'', route:'', status:'', light:'', due:''};
let bitacoraStep = 0;
let bitMicRecognition = null;
let bitMicTarget = null;

const BIT_STEPS = {
  A:['Personas','Clasificación','Riesgo','Lugar y momento','Relatoría','Testigos y evidencias','Protección','Notificación','Canalización','Compromisos','Previa'],
  B:['Alumno','Conducta','Contexto','Intervención','Medida formativa','Compromisos','Previa'],
  C:['Alumno','Periodo','Faltas detectadas','Contacto familiar','Riesgo y acuerdos','Seguimiento','Previa'],
  CIT:['Alumno','Tutor','Cita','Motivo','Entrega','Previa']
};
const BIT_OPTS = {
  lugares:['Aula','Patio','Cancha','Baños','Dirección','Pasillo','Entrada/Salida','Cooperativa','Trayecto escolar','Otro'],
  rolesA:['presunto receptor','presunto generador','testigo','otro'],
  tiposA:['física','psicoemocional','verbal/lenguaje','cibernética','exclusión','sexual','suplantación de identidad','amenaza','daño a propiedad','otra'],
  gravedadA:['leve','moderada','grave'],
  riesgosA:['Hay lesión visible','Requiere atención médica','Hay amenaza vigente','Hay posible abuso sexual','Hay adulto involucrado','Hay posible delito','Hay arma u objeto peligroso','Hay droga, alcohol o sustancia','Hay evidencia digital','Hay publicación en redes','Hay suplantación de identidad','Hay reiteración o antecedentes','Hay discapacidad, trastorno, barrera para el aprendizaje o condición vulnerable','Hay riesgo de represalia','La familia no respondió','El alumno no se siente seguro'],
  evidencias:['Fotografía','Captura de pantalla','Mensaje digital','Objeto dañado','Registro previo','Testimonio','Lesión visible','Reporte de asistencia','Citatorio','Otra'],
  accionesA:['Separación preventiva','Contención del grupo','Acompañamiento del alumno afectado','Aviso a dirección','Llamada a familia','Atención médica','Resguardo de evidencia','Supervisión reforzada','Otra'],
  canales:['Dirección escolar','Supervisión','Aprender a Convivir','DIF Municipal','Salud','Fiscalía','911 / emergencia','USAER / DUSAER','Trabajo Social','Otro'],
  tiposB:['desobediencia','interrupción reiterada','lenguaje inapropiado','incumplimiento de actividad','uso indebido de celular','salida del aula sin autorización','daño menor a material','falta de respeto','conflicto menor sin lesión','otra'],
  reincidencia:['primera vez','segunda vez','recurrente'],
  medidasB:['diálogo formativo','llamado de atención','cambio temporal de lugar','reparación del daño','carta compromiso','actividad de reflexión','notificación a tutor','seguimiento semanal','otra'],
  escalamientoB:['lesión','amenaza','acoso reiterado','humillación','ciberacoso','violencia sexual','discriminación grave','arma','riesgo físico o emocional'],
  motivosC:['enfermedad','situación familiar','traslado','falta de recursos','trabajo o apoyo familiar','desinterés','seguridad','no se logró contactar','otro'],
  mediosContacto:['llamada','WhatsApp/mensaje','citatorio','entrevista presencial','visita o canal institucional','no se logró contacto','otro'],
  riesgoC:['bajo','medio','alto'],
  estatus:['abierto','en seguimiento','cerrado','canalizado']
};
function bitacoraFolio(){
  db.group.bitacoraMeta = db.group.bitacoraMeta || {schemaVersion:1, folioSeq:0};
  db.group.bitacoraMeta.folioSeq = (Number(db.group.bitacoraMeta.folioSeq)||0) + 1;
  return `BPF-${new Date().getFullYear()}-${String(db.group.bitacoraMeta.folioSeq).padStart(4,'0')}`;
}
function bitTypeName(t){ return ({A:'Ruta A: violencia e incidencias',B:'Ruta B: indisciplina e incumplimiento',C:'Ruta C: inasistencias',CIT:'Citatorio'})[t]||t; }
function activeStudentOptions(selected=''){
  return `<option value="">— Seleccionar alumno —</option>` + getActiveStudents().map(s=>`<option value="${s.id}" ${selected===s.id?'selected':''}>${esc(s.listNo)} · ${esc(s.name)}</option>`).join('');
}
function bitInput(id,label,value='',placeholder='',type='text',required=false){ return `<div><div class="small">${label}${required?' *':''}</div><input id="${id}" type="${type}" value="${esc(value||'')}" placeholder="${esc(placeholder)}"></div>`; }
function bitText(id,label,value='',placeholder='',required=false,rows=4,dictate=false){ return `<div class="field"><div class="small">${label}${required?' *':''}</div><textarea id="${id}" rows="${rows}" placeholder="${esc(placeholder)}">${esc(value||'')}</textarea>${dictate?micBtn(id):''}</div>`; }
function bitSelect(id,label,options,value='',required=false){ return `<div><div class="small">${label}${required?' *':''}</div><select id="${id}">${options.map(o=>`<option value="${esc(o)}" ${String(value)===String(o)?'selected':''}>${esc(o)}</option>`).join('')}</select></div>`; }
function bitChoice(id,label,options,value='',required=false){
  const otherValue = (value && !options.includes(value)) ? value : '';
  const selected = otherValue ? 'Otro' : value;
  return `<div class="field"><div class="small">${label}${required?' *':''}</div><div class="choice-row" data-choice-group="${id}">${options.map(o=>`<button type="button" class="choice ${selected===o?'sel':''}" data-choice="${esc(o)}">${esc(o)}</button>`).join('')}</div><input type="hidden" id="${id}" value="${esc(selected||'')}"><input class="${selected==='Otro'||selected==='otra'?'':'hidden'}" id="${id}_other" style="margin-top:8px" value="${esc(otherValue)}" placeholder="Especifica"></div>`;
}
function bitChecks(id,label,options,selected=[]){
  const set=new Set(selected||[]);
  return `<div class="field"><div class="small">${label}</div><div class="check-grid">${options.map(o=>`<label class="check-card ${set.has(o)?'checked':''}"><input type="checkbox" name="${id}" value="${esc(o)}" ${set.has(o)?'checked':''}> <span>${esc(o)}</span></label>`).join('')}</div></div>`;
}
function micBtn(targetId){ return `<div class="mic-row"><button type="button" class="mic-btn" data-mic-target="${targetId}">🎤 Dictar</button><button type="button" class="mini" data-review-text="${targetId}">Revisar</button><button type="button" class="mini" data-undo-text="${targetId}">↩ Deshacer</button><button type="button" class="mini" data-clear-text="${targetId}">🗑 Borrar</button><span class="small" id="${targetId}-mic-status"></span></div><div class="mic-preview" id="${targetId}-mic-preview"></div><div class="mic-hint">Habla cerca del teléfono. Pausa breve para confirmar cada frase.</div>`; }
function bindChoiceButtons(){
  document.querySelectorAll('[data-choice-group]').forEach(group=>{
    const id=group.dataset.choiceGroup;
    group.querySelectorAll('[data-choice]').forEach(btn=>btn.onclick=()=>{
      group.querySelectorAll('.choice').forEach(b=>b.classList.remove('sel'));
      btn.classList.add('sel');
      const value=btn.dataset.choice;
      const hidden=document.getElementById(id); if(hidden) hidden.value=value;
      const other=document.getElementById(id+'_other'); if(other) other.classList.toggle('hidden', !(value==='Otro'||value==='otra'));
    });
  });
  document.querySelectorAll('[data-clear-text]').forEach(btn=>btn.onclick=()=>{ const el=document.getElementById(btn.dataset.clearText); if(el && confirm('¿Borrar este texto para volver a dictar o escribir?')) el.value=''; });
}
function bindMicButtons(){
  document.querySelectorAll('[data-mic-target]').forEach(btn=>btn.onclick=()=>toggleBitDictation(btn.dataset.micTarget, btn));
  document.querySelectorAll('[data-clear-text]').forEach(btn=>btn.onclick=()=>{ const id=btn.dataset.clearText; const el=document.getElementById(id); if(el && confirm('¿Borrar este texto para volver a grabar?')){ el.dataset.beforeClear=el.value||''; el.value=''; el.dataset.dictated=''; }});
  document.querySelectorAll('[data-review-text]').forEach(btn=>btn.onclick=()=>reviewBitText(btn.dataset.reviewText));
  document.querySelectorAll('[data-undo-text]').forEach(btn=>btn.onclick=()=>undoBitText(btn.dataset.undoText));
}
function cleanRepeatedDictation(text=''){
  let s=String(text||'').replace(/\s+/g,' ').trim();
  // Quita repeticiones consecutivas de palabras/frases cortas comunes del dictado.
  s=s.replace(/\b(\w+)(\s+\1\b)+/gi,'$1');
  s=s.replace(/\b((?:\w+\s+){1,4}\w+)(?:\s+\1\b)+/gi,'$1');
  s=s.replace(/\s+([,.;:])/g,'$1').trim();
  if(s && !/[.!?]$/.test(s)) s+='.';
  return s.charAt(0).toUpperCase()+s.slice(1);
}
function reviewBitText(targetId){
  const el=document.getElementById(targetId); if(!el) return;
  el.dataset.beforeReview=el.value||'';
  el.value=cleanRepeatedDictation(el.value||'');
  toast('Texto revisado. Confirma que no cambió el sentido.');
}
function undoBitText(targetId){
  const el=document.getElementById(targetId); if(!el) return;
  if(el.dataset.beforeReview!==undefined){ el.value=el.dataset.beforeReview; delete el.dataset.beforeReview; toast('Revisión deshecha'); return; }
  if(el.dataset.beforeClear!==undefined){ el.value=el.dataset.beforeClear; delete el.dataset.beforeClear; toast('Borrado deshecho'); return; }
  // FIX v4: deshacer última frase dictada
  if(el.dataset.lastPhrase!==undefined){
    const was=String(el.value||'');
    if(was.endsWith(el.dataset.lastPhrase)){ el.value=was.slice(0,-(el.dataset.lastPhrase.length)).trimEnd(); }
    delete el.dataset.lastPhrase; toast('Última frase deshecha'); return;
  }
  toast('No hay cambio para deshacer');
}
function toggleBitDictation(targetId, btn){
  // FIX v4: continuo + preview en tiempo real + deduplicación
  const field=document.getElementById(targetId);
  const status=document.getElementById(targetId+'-mic-status');
  const preview=document.getElementById(targetId+'-mic-preview');
  if(!field) return;
  // Si ya está dictando este campo, detener
  if(bitMicRecognition && bitMicTarget===targetId){
    try{ bitMicRecognition.stop(); }catch(e){}
    bitMicRecognition=null; bitMicTarget=null;
    if(preview) preview.textContent='';
    if(status) status.textContent='';
    if(btn){ btn.textContent='🎤 Dictar'; btn.classList.remove('recording','grabando'); }
    return;
  }
  if(bitMicRecognition){ try{ bitMicRecognition.stop(); }catch(e){} }
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SpeechRecognition){ toast('El dictado no está disponible en este navegador'); return; }
  const rec = new SpeechRecognition();
  bitMicRecognition = rec; bitMicTarget = targetId;
  rec.lang='es-MX';
  rec.interimResults=true;   // FIX: preview en tiempo real
  rec.continuous=true;       // FIX: no se detiene solo
  rec.maxAlternatives=1;
  rec.onresult = ev => {
    let interim='';
    for(let i=ev.resultIndex; i<ev.results.length; i++){
      const r=ev.results[i];
      if(r.isFinal){
        const spoken=String(r[0].transcript||'').trim();
        if(spoken){
          const current=field.value||'';
          const eWords=current.trim().split(/\s+/);
          const nWords=spoken.split(/\s+/);
          let toAdd=spoken;
          for(let ov=Math.min(5,eWords.length,nWords.length); ov>=1; ov--){
            const tail=eWords.slice(-ov).join(' ').toLowerCase();
            const head=nWords.slice(0,ov).join(' ').toLowerCase();
            if(tail===head){ toAdd=nWords.slice(ov).join(' '); break; }
          }
          if(toAdd.trim()){
            field.value=(field.value?field.value.trimEnd()+' ':'')+toAdd.trim();
            field.dataset.lastPhrase=toAdd.trim();
          }
        }
        if(preview) preview.textContent='';
      } else { interim+=r[0].transcript; }
    }
    if(preview && interim) preview.textContent=interim;
  };
  rec.onerror = e => {
    if(e.error==='no-speech') return;
    if(e.error==='network'){ toast('Sin conexión — el dictado requiere internet'); return; }
    if(e.error==='not-allowed'){ toast('Permiso de micrófono denegado'); return; }
    toast('No se pudo usar el micrófono');
  };
  rec.onend = () => {
    if(preview) preview.textContent='';
    if(bitMicRecognition===rec && bitMicTarget===targetId){
      try{ rec.start(); }catch(e){
        bitMicRecognition=null; bitMicTarget=null;
        if(btn){ btn.textContent='🎤 Dictar'; btn.classList.remove('recording','grabando'); }
        if(status) status.textContent='';
      }
    } else {
      if(btn){ btn.textContent='🎤 Dictar'; btn.classList.remove('recording','grabando'); }
      if(status) status.textContent='';
    }
  };
  if(status) status.textContent=' 🎤 Escuchando...';
  if(btn){ btn.textContent='⏹ Detener'; btn.classList.add('recording','grabando'); }
  try{ rec.start(); }catch(e){ toast('No se pudo iniciar el dictado'); bitMicRecognition=null; bitMicTarget=null; }
}
function getChoice(id){ const v=valOf(id); const other=valOf(id+'_other'); return (v==='Otro'||v==='otra') ? other : v; }
function getChecks(id){ return [...document.querySelectorAll(`input[name="${id}"]:checked`)].map(x=>x.value); }
function bitRiskAlert(flags=[]){
  const critical=['Hay posible abuso sexual','Hay adulto involucrado','Requiere atención médica','Hay arma u objeto peligroso','Hay amenaza vigente','Hay posible delito','El alumno no se siente seguro'];
  const anti=['Hay posible abuso sexual','Hay adulto involucrado'];
  const isRed=flags.some(f=>critical.includes(f)); const isAnti=flags.some(f=>anti.includes(f));
  if(!isRed && !isAnti) return '';
  return `<div class="alert-legal ${isRed?'red':'amber'}"><b>${isRed?'⚠️ Alerta roja de protocolo':'⚠️ Alerta preventiva'}</b><p>Este caso requiere activar protocolo, informar a dirección y valorar canalización inmediata. Registra hechos sin interrogar ni revictimizar. No emitas diagnósticos ni conclusiones.</p>${isAnti?'<p><b>Anti-revictimización:</b> No interrogar ni presionar al menor. Registra únicamente manifestaciones espontáneas, palabras textuales, conducta observada y acciones de protección.</p>':''}</div>`;
}
function shouldEscalateB(flags=[]){ return (flags||[]).length>0; }
function getAbsenceRiskC(data={}){
  const total=(data.c_absences_auto||[]).length; const noResp=!!data.c_no_response || data.c_contact_medium==='no se logró contacto';
  if(total>=5 || noResp || data.c_risk==='alto') return 'rojo';
  if(total>=3 || data.c_risk==='medio') return 'amarillo';
  return 'verde';
}
function buildTimelineC(data={}){
  const dates=data.c_absences_auto||[];
  return dates.map(date=>({fecha:date, accion:data.c_contact_medium||'pendiente', respuesta:data.c_contact_response||'', acuerdo:data.c_agreement||'', seguimiento:data.c_followup_date||'', resultado:data.c_status||'en seguimiento'}));
}
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
function prepareBitPreview(){ collectBitStep(); refreshBitacoraComputedFields(bitacoraDraft); bitacoraDraft.documentText=buildBitacoraDocument(bitacoraDraft); currentScreen='bitacoraPreview'; renderCurrentScreen(); }
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

document.addEventListener('DOMContentLoaded', initApp); // v4: con PIN
