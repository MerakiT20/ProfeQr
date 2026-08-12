from pathlib import Path
import re

# Core 7: local vendor assets and no runtime CDN dependency.
idx=Path('index.html')
s=idx.read_text(encoding='utf-8')
s=re.sub(r'<link rel="preconnect" href="https://fonts.googleapis.com">\n<link href="https://fonts.googleapis.com/css2\?family=Nunito:[^\n]+\n','',s)
s=s.replace('<script src="https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js"></script>','<script src="./vendor/html5-qrcode.min.js"></script>')
s=s.replace('<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>','<script src="./vendor/qrcode.min.js"></script>')
s=s.replace('<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>','<script src="./vendor/chart.umd.min.js"></script>')
s=s.replace('<script src="https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.bundle.min.js"></script>','<script src="./vendor/xlsx.bundle.min.js"></script>')
s=s.replace('<script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>','<script src="./vendor/jspdf.umd.min.js"></script>')
# backup module before settings
s=s.replace('<script src="./js/reports.js"></script>\n<script src="./js/settings.js"></script>','<script src="./js/reports.js"></script>\n<script src="./js/backup.js"></script>\n<script src="./js/settings.js"></script>')
idx.write_text(s,encoding='utf-8')

# Core 8 backup bundle.
backup=Path('js/backup.js')
backup.write_text(r'''/* --- RC Core 8: complete versioned backups --- */
const PROFEQR_BACKUP_FORMAT='profeqr-backup';
const PROFEQR_BACKUP_VERSION=1;

function backupSafeDb(){
  const copy=JSON.parse(JSON.stringify(db));
  if(copy.config){
    delete copy.config.pin;
    // Device-bound commercial activation must not clone to another installation.
    delete copy.config.license;
  }
  return copy;
}
function buildProfeQrBackup(){
  let draft=null;
  try{ const raw=localStorage.getItem(DRAFT_KEY); if(raw) draft=JSON.parse(raw); }catch(e){}
  return {
    format:PROFEQR_BACKUP_FORMAT,
    version:PROFEQR_BACKUP_VERSION,
    exportedAt:new Date().toISOString(),
    app:'ProfeQr',
    data:{db:backupSafeDb(),bitacoraDraft:draft},
    excluded:{installationId:true,license:true,pinFailureState:true},
    notes:'Licencia e identidad del dispositivo no se transfieren. El PIN protegido sí permanece como credencial local del respaldo.'
  };
}
async function sha256TextHex(text){
  if(!crypto?.subtle) return '';
  const bytes=new TextEncoder().encode(text);
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
}
async function exportProfeQrBackup(){
  const payload=buildProfeQrBackup();
  const canonical=JSON.stringify(payload);
  const envelope={...payload,integrity:{algorithm:'SHA-256',digest:await sha256TextHex(canonical)}};
  downloadTextFile(`ProfeQr_${today()}.profeqr`,JSON.stringify(envelope,null,2),'application/json;charset=utf-8');
  toast('Respaldo integral exportado');
}
function isLegacyBackupObject(obj){ return !!(obj && typeof obj==='object' && obj.group && Object.prototype.hasOwnProperty.call(obj,'config')); }
async function validateProfeQrBackup(obj){
  if(!obj || obj.format!==PROFEQR_BACKUP_FORMAT || Number(obj.version)!==PROFEQR_BACKUP_VERSION) return {ok:false,error:'Formato de respaldo no reconocido'};
  if(!obj.data?.db) return {ok:false,error:'El respaldo no contiene base de datos'};
  if(obj.integrity?.digest){
    const copy=JSON.parse(JSON.stringify(obj)); delete copy.integrity;
    const digest=await sha256TextHex(JSON.stringify(copy));
    if(digest && digest!==obj.integrity.digest) return {ok:false,error:'El respaldo no supera la verificación de integridad'};
  }
  return {ok:true};
}
async function restoreProfeQrBackupObject(obj){
  let restoredDb, draft=null, legacy=false;
  if(isLegacyBackupObject(obj)){
    restoredDb=obj; legacy=true;
  }else{
    const valid=await validateProfeQrBackup(obj); if(!valid.ok) throw new Error(valid.error);
    restoredDb=obj.data.db; draft=obj.data.bitacoraDraft||null;
  }
  // Preserve this device's activation and installation context.
  const currentLicense=db?.config?.license ? JSON.parse(JSON.stringify(db.config.license)) : null;
  db=safeDb(restoredDb);
  if(db.config){ delete db.config.pin; if(currentLicense) db.config.license=currentLicense; else delete db.config.license; }
  if(!saveDb({system:true})) throw new Error('No se pudo guardar el respaldo restaurado');
  try{
    if(draft) localStorage.setItem(DRAFT_KEY,JSON.stringify(draft));
    else if(!legacy) localStorage.removeItem(DRAFT_KEY);
  }catch(e){}
  return {legacy};
}
async function importProfeQrBackupFile(file){
  const text=await file.text();
  let obj; try{ obj=JSON.parse(text); }catch(e){ throw new Error('Archivo JSON inválido o corrupto'); }
  return restoreProfeQrBackupObject(obj);
}
''',encoding='utf-8')

# Settings UI/use new backup while accepting legacy JSON.
p=Path('js/settings.js'); s=p.read_text(encoding='utf-8')
s=s.replace('<div class="section-title">Respaldo JSON</div>','<div class="section-title">Respaldo integral</div>')
s=s.replace('El respaldo JSON guarda una copia completa de la información de la app para restaurarla después en este u otro dispositivo.','El archivo .profeqr guarda la base de datos y borradores con verificación de integridad. La licencia y la identidad del dispositivo no se clonan.')
s=s.replace('Exportar respaldo JSON','Exportar respaldo .profeqr')
s=s.replace('accept=".json,application/json"','accept=".profeqr,.json,application/json"')
s=s.replace('Importar respaldo JSON','Importar respaldo')
old="""  document.getElementById('export-json-btn').onclick = ()=>{\n    const blob = new Blob([JSON.stringify(sanitizedBackupDb(),null,2)],{type:'application/json'});\n    const a = document.createElement('a');\n    a.href = URL.createObjectURL(blob);\n    a.download = `respaldo_profeqr_${today()}.json`;\n    a.click();\n    toast('Respaldo exportado');\n  };"""
if old not in s:
    # tolerate previous function shape
    s=re.sub(r"  document\.getElementById\('export-json-btn'\)\.onclick = \(\)=>\{.*?\n  \};", "  document.getElementById('export-json-btn').onclick = ()=>exportProfeQrBackup();", s, count=1, flags=re.S)
else: s=s.replace(old,"  document.getElementById('export-json-btn').onclick = ()=>exportProfeQrBackup();")
# replace import handler block by locating const importInput through end bindSettings
start=s.find("  const importInput = document.getElementById('import-json-input');")
if start<0: raise SystemExit('settings import handler not found')
end=s.find("\n}\n",start)
if end<0: raise SystemExit('settings function end not found')
new=r'''  const importInput = document.getElementById('import-json-input');
  importInput.onchange = async e => {
    const file=e.target.files?.[0]; if(!file) return;
    const ok=confirm('⚠️ Esto reemplazará los datos actuales. La licencia de este dispositivo se conservará. ¿Continuar?');
    if(!ok){ importInput.value=''; return; }
    try{
      const result=await importProfeQrBackupFile(file);
      toast(result.legacy?'Respaldo JSON antiguo restaurado':'Respaldo integral restaurado');
      renderApp();
    }catch(err){ console.error(err); toast(err?.message||'No se pudo restaurar el respaldo'); }
    finally{ importInput.value=''; }
  };'''
s=s[:start]+new+s[end:]
p.write_text(s,encoding='utf-8')

# Service worker cache local vendor and backup module, no external URLs.
p=Path('sw.js'); s=p.read_text(encoding='utf-8')
s=re.sub(r"const CACHE_VERSION = '[^']+';","const CACHE_VERSION = 'profeqr-v8-7-rc-core-8';",s,1)
# Strip http(s) entries from CORE literals, add required local resources if absent.
s=re.sub(r'\s*"https?://[^\n]+\n','\n',s)
insert=['  "./vendor/html5-qrcode.min.js",','  "./vendor/qrcode.min.js",','  "./vendor/chart.umd.min.js",','  "./vendor/xlsx.bundle.min.js",','  "./vendor/jspdf.umd.min.js",','  "./js/backup.js",']
needle='  "./js/reports.js",'
pos=s.find(needle)
if pos<0: raise SystemExit('sw reports entry not found')
pos=pos+len(needle)
s=s[:pos]+'\n'+'\n'.join(insert)+s[pos:]
p.write_text(s,encoding='utf-8')
