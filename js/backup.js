/* --- RC Core 8/9: complete versioned backups, including documents --- */
const PROFEQR_BACKUP_FORMAT='profeqr-backup';
const PROFEQR_BACKUP_VERSION=2;

function backupSafeDb(){
  const copy=JSON.parse(JSON.stringify(db));
  if(copy.config){
    delete copy.config.pin;
    // Device-bound commercial activation must not clone to another installation.
    delete copy.config.license;
  }
  return copy;
}
function blobToDataUrl(blob){
  return new Promise((resolve,reject)=>{ const r=new FileReader(); r.onload=()=>resolve(String(r.result||'')); r.onerror=()=>reject(r.error); r.readAsDataURL(blob); });
}
function dataUrlToBlob(dataUrl){
  const m=String(dataUrl||'').match(/^data:([^;,]*)(?:;charset=[^;,]*)?;base64,(.*)$/s);
  if(!m) throw new Error('Documento codificado inválido');
  const bin=atob(m[2]); const bytes=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
  return new Blob([bytes],{type:m[1]||'application/octet-stream'});
}
async function backupDocuments(){
  if(typeof documentsList!=='function') return [];
  const docs=await documentsList();
  const out=[];
  for(const d of docs){
    if(!d?.blob) continue;
    out.push({id:d.id,category:d.category,name:d.name,type:d.type,size:d.size,createdAt:d.createdAt,updatedAt:d.updatedAt,dataUrl:await blobToDataUrl(d.blob)});
  }
  return out;
}
async function buildProfeQrBackup(){
  let draft=null;
  try{ const raw=localStorage.getItem(DRAFT_KEY); if(raw) draft=JSON.parse(raw); }catch(e){}
  const documents=await backupDocuments();
  return {
    format:PROFEQR_BACKUP_FORMAT,
    version:PROFEQR_BACKUP_VERSION,
    exportedAt:new Date().toISOString(),
    app:'ProfeQr',
    data:{db:backupSafeDb(),bitacoraDraft:draft,documents},
    excluded:{installationId:true,license:true,pinFailureState:true},
    notes:'Incluye documentos locales. Licencia e identidad del dispositivo no se transfieren.'
  };
}
async function sha256TextHex(text){
  if(!crypto?.subtle) return '';
  const bytes=new TextEncoder().encode(text);
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
}
async function exportProfeQrBackup(){
  try{
    toast('Preparando respaldo integral...');
    const payload=await buildProfeQrBackup();
    const canonical=JSON.stringify(payload);
    const envelope={...payload,integrity:{algorithm:'SHA-256',digest:await sha256TextHex(canonical)}};
    downloadTextFile(`ProfeQr_${today()}.profeqr`,JSON.stringify(envelope,null,2),'application/json;charset=utf-8');
    toast(`Respaldo exportado · ${payload.data.documents.length} documento(s)`);
  }catch(err){ console.error(err); toast('No se pudo crear el respaldo integral'); }
}
function isLegacyBackupObject(obj){ return !!(obj && typeof obj==='object' && obj.group && Object.prototype.hasOwnProperty.call(obj,'config')); }
async function validateProfeQrBackup(obj){
  if(!obj || obj.format!==PROFEQR_BACKUP_FORMAT || ![1,2].includes(Number(obj.version))) return {ok:false,error:'Formato de respaldo no reconocido'};
  if(!obj.data?.db) return {ok:false,error:'El respaldo no contiene base de datos'};
  if(obj.integrity?.digest){
    const copy=JSON.parse(JSON.stringify(obj)); delete copy.integrity;
    const digest=await sha256TextHex(JSON.stringify(copy));
    if(digest && digest!==obj.integrity.digest) return {ok:false,error:'El respaldo no supera la verificación de integridad'};
  }
  if(Number(obj.version)>=2 && !Array.isArray(obj.data.documents)) return {ok:false,error:'El respaldo no contiene el índice de documentos'};
  return {ok:true};
}
async function restoreBackupDocuments(records){
  if(!Array.isArray(records) || typeof documentsClear!=='function') return 0;
  await documentsClear();
  let restored=0;
  for(const d of records){
    if(!d?.id || !d?.dataUrl) continue;
    const blob=dataUrlToBlob(d.dataUrl);
    await documentsPut({id:d.id,category:d.category||'propios',name:d.name||'Documento',type:d.type||blob.type||'application/octet-stream',size:blob.size,createdAt:d.createdAt||new Date().toISOString(),updatedAt:d.updatedAt||new Date().toISOString(),blob});
    restored++;
  }
  return restored;
}
async function restoreProfeQrBackupObject(obj){
  let restoredDb,draft=null,legacy=false,documents=null;
  if(isLegacyBackupObject(obj)){
    restoredDb=obj; legacy=true;
  }else{
    const valid=await validateProfeQrBackup(obj); if(!valid.ok) throw new Error(valid.error);
    restoredDb=obj.data.db; draft=obj.data.bitacoraDraft||null;
    if(Number(obj.version)>=2) documents=obj.data.documents||[];
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
  let documentCount=0;
  if(documents!==null) documentCount=await restoreBackupDocuments(documents);
  return {legacy,documentCount};
}
async function importProfeQrBackupFile(file){
  const text=await file.text();
  let obj; try{ obj=JSON.parse(text); }catch(e){ throw new Error('Archivo JSON inválido o corrupto'); }
  return restoreProfeQrBackupObject(obj);
}
