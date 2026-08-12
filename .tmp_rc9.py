from pathlib import Path

def repl(path, old, new, label):
    p=Path(path); s=p.read_text(encoding='utf-8')
    if old not in s: raise SystemExit(f'{label}: target not found')
    p.write_text(s.replace(old,new,1),encoding='utf-8')

# Replace old document stub with compatibility bridge.
repl('js/profiles.js', """// ── DOC VIEWER & STUDENT PROFILE — stubs conectados ────────────
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
""", """// ── DOCUMENTOS — puente de compatibilidad ─────────────────────
let docViewerCategory = '';
function openDocViewer(category){
  docViewerCategory = category||'';
  openDocumentsCategory(category||'todos');
}
function renderDocViewer(){ return renderDocuments(); }
function bindDocViewer(){ bindDocuments(); }
""", 'profiles document stub')

repl('js/profiles.js', """  if(currentScreen==='settings')      html += renderSettings();
  if(currentScreen==='docViewer')      html += renderDocViewer();
  if(currentScreen==='studentProfile') html += renderStudentProfile();""", """  if(currentScreen==='settings')      html += renderSettings();
  if(currentScreen==='documents')     html += renderDocuments();
  if(currentScreen==='docViewer')      html += renderDocViewer();
  if(currentScreen==='studentProfile') html += renderStudentProfile();""", 'profiles render documents')
repl('js/profiles.js', """  if(currentScreen==='settings')      bindSettings();
  if(currentScreen==='docViewer')      bindDocViewer();
  if(currentScreen==='studentProfile') bindStudentProfile();""", """  if(currentScreen==='settings')      bindSettings();
  if(currentScreen==='documents')     bindDocuments();
  if(currentScreen==='docViewer')      bindDocViewer();
  if(currentScreen==='studentProfile') bindStudentProfile();""", 'profiles bind documents')

# Home tile and drawer route.
repl('js/profiles.js', "{id:'biblioteca',icon:'folder',       label:'Documentos',     sub:'Recursos y formatos'},", "{id:'documents', icon:'folder',       label:'Documentos',     sub:'Horario, calendario y archivos'},", 'home documents tile')
repl('js/shell.js', "${navBtn('biblioteca','📚 Biblioteca')}\n      ${navBtn('bitacora','📋 Bitácora')}", "${navBtn('biblioteca','📚 Biblioteca')}\n      ${navBtn('documents','📁 Documentos')}\n      ${navBtn('bitacora','📋 Bitácora')}", 'drawer documents')
repl('js/shell.js', "} else if(currentScreen === 'docViewer'){\n      currentScreen = 'biblioteca';", "} else if(currentScreen === 'docViewer' || currentScreen === 'documents'){\n      currentScreen = 'home';", 'documents back')

# Backup copy and UI wording.
repl('js/settings.js', "El archivo .profeqr guarda la base de datos y borradores con verificación de integridad. La licencia y la identidad del dispositivo no se clonan.", "El archivo .profeqr guarda datos, borradores y Documentos (PDF/imágenes) con verificación de integridad. La licencia y la identidad del dispositivo no se clonan.", 'settings backup help')
repl('js/settings.js', "toast(result.legacy?'Respaldo JSON antiguo restaurado':'Respaldo integral restaurado');", "toast(result.legacy?'Respaldo JSON antiguo restaurado':`Respaldo integral restaurado · ${result.documentCount||0} documento(s)`);", 'settings restore toast')

# Service worker: cache module and bump version.
p=Path('sw.js'); s=p.read_text(encoding='utf-8')
import re
s=re.sub(r"const CACHE = '([^']+)'", lambda m: "const CACHE = 'profeqr-rc9-documents-v1'", s, count=1)
if "'./js/documents.js'" not in s:
    anchor="'./js/security.js',"
    if anchor not in s: raise SystemExit('sw anchor missing')
    s=s.replace(anchor, anchor+"\n  './js/documents.js',",1)
p.write_text(s,encoding='utf-8')

# Minimal modal styling.
p=Path('styles.css'); s=p.read_text(encoding='utf-8')
style="""
/* RC Core 9 · visor de documentos */
.doc-modal{position:fixed;inset:0;background:rgba(15,23,42,.72);z-index:9999;display:flex;align-items:center;justify-content:center;padding:12px}
.doc-modal-card{width:min(980px,100%);max-height:94vh;overflow:auto;background:var(--card);border-radius:18px;padding:14px;box-shadow:0 24px 80px rgba(0,0,0,.35)}
"""
if '.doc-modal{' not in s: s += style
p.write_text(s,encoding='utf-8')
