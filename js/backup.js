/* --- RC Core 8: complete versioned backups --- */
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
