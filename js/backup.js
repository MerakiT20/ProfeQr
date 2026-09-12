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
  const encoded=m[2].replace(/\s/g,'');
  if(!/^[a-z0-9+/]*={0,2}$/i.test(encoded) || encoded.length%4===1) throw new Error('Documento codificado inválido');
  const padding=(encoded.match(/=*$/)||[''])[0].length;
  const estimatedBytes=Math.floor(encoded.length*3/4)-padding;
  if(estimatedBytes>DOC_MAX_FILE_BYTES) throw new Error('El documento supera el límite de 20 MB');
  const bin=atob(encoded); const bytes=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
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
function isLegacyBackupObject(obj){ return !!(isRecordObject(obj) && isRecordObject(obj.group) && Object.prototype.hasOwnProperty.call(obj,'config') && (obj.config===null||isRecordObject(obj.config))); }
async function validateProfeQrBackup(obj){
  if(!obj || obj.format!==PROFEQR_BACKUP_FORMAT || ![1,2].includes(Number(obj.version))) return {ok:false,error:'Formato de respaldo no reconocido'};
  if(!isRecordObject(obj.data?.db) || !isRecordObject(obj.data.db.group) || !(obj.data.db.config===null||isRecordObject(obj.data.db.config))) return {ok:false,error:'El respaldo no contiene una base de datos válida'};
  if(obj.integrity?.digest){
    const copy=JSON.parse(JSON.stringify(obj)); delete copy.integrity;
    const digest=await sha256TextHex(JSON.stringify(copy));
    if(digest && digest!==obj.integrity.digest) return {ok:false,error:'El respaldo no supera la verificación de integridad'};
  }
  if(Number(obj.version)>=2 && !Array.isArray(obj.data.documents)) return {ok:false,error:'El respaldo no contiene el índice de documentos'};
  return {ok:true};
}
function validPinHashConfig(config={}){
  const iterations=Number(config.pinIterations);
  return /^[a-f0-9]{64}$/i.test(String(config.pinHash||'')) && /^[a-f0-9]{32,128}$/i.test(String(config.pinSalt||'')) && Number.isInteger(iterations) && iterations>=100000 && iterations<=1000000;
}
function copyPinHash(target={},source={}){
  delete target.pin; delete target.pinHash; delete target.pinSalt; delete target.pinIterations;
  if(validPinHashConfig(source)){
    target.pinHash=source.pinHash;
    target.pinSalt=source.pinSalt;
    target.pinIterations=Number(source.pinIterations);
  }
}
function validBackupDraft(value){
  return !!(value && typeof value==='object' && value.draft && typeof value.draft==='object' && ['A','B','C','CIT'].includes(value.draft.type));
}
function prepareBackupDocuments(records){
  if(!Array.isArray(records)) throw new Error('El índice de documentos es inválido');
  const ids=new Set();
  return records.map(d=>{
    if(!d || typeof d!=='object' || d.id===undefined || d.id===null || !d.dataUrl) throw new Error('El respaldo contiene un documento incompleto');
    const id=String(d.id);
    if(ids.has(id)) throw new Error(`El documento ${id} está repetido en el respaldo`);
    ids.add(id);
    const blob=dataUrlToBlob(d.dataUrl);
    if(blob.size>DOC_MAX_FILE_BYTES) throw new Error(`El documento ${d.name||id} supera el límite de 20 MB`);
    const now=new Date().toISOString();
    return {id,category:DOC_CATEGORIES[d.category]?d.category:'propios',name:String(d.name||'Documento'),type:String(d.type||blob.type||'application/octet-stream'),size:blob.size,createdAt:d.createdAt||now,updatedAt:d.updatedAt||now,blob};
  });
}
async function restoreBackupDocuments(records){
  if(!Array.isArray(records) || typeof documentsReplaceAll!=='function') return 0;
  const prepared=records.length && records[0]?.blob ? records : prepareBackupDocuments(records);
  return documentsReplaceAll(prepared);
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
  // Valida y decodifica todo antes de reemplazar datos. Un documento corrupto
  // no debe borrar la biblioteca actual ni dejar una restauración parcial.
  const preparedDocuments=documents===null?null:prepareBackupDocuments(documents);
  const previousDb=JSON.parse(JSON.stringify(db));
  let previousDraft=null;
  try{ previousDraft=localStorage.getItem(DRAFT_KEY); }catch(e){}
  const currentConfig=db?.config||{};
  const currentLicense=currentConfig.license ? JSON.parse(JSON.stringify(currentConfig.license)) : null;
  const currentLegacy=currentConfig.licenseLegacyGrandfathered===true;
  const incomingConfig=restoredDb?.config||{};
  const incomingLegacyPin=String(incomingConfig.pin||'');

  try{
    db=safeDb(JSON.parse(JSON.stringify(restoredDb)));
    if(db.config){
      delete db.config.license;
      if(currentLicense) db.config.license=currentLicense;
      db.config.licenseLegacyGrandfathered=currentLegacy;
      if(validPinHashConfig(db.config)) delete db.config.pin;
      else if(/^\d{4}$/.test(incomingLegacyPin)){
        copyPinHash(db.config,{});
        await setPinCredential(incomingLegacyPin);
      }else copyPinHash(db.config,currentConfig);
    }
    if(!saveDb({system:true})) throw new Error('No se pudo guardar el respaldo restaurado');
    if(!legacy){
      if(validBackupDraft(draft)) localStorage.setItem(DRAFT_KEY,JSON.stringify(draft));
      else localStorage.removeItem(DRAFT_KEY);
    }
    await refreshLicenseRuntime();
    const documentCount=preparedDocuments===null?0:await restoreBackupDocuments(preparedDocuments);
    return {legacy,documentCount};
  }catch(err){
    db=safeDb(previousDb);
    saveDb({system:true});
    try{ if(previousDraft===null) localStorage.removeItem(DRAFT_KEY); else localStorage.setItem(DRAFT_KEY,previousDraft); }catch(e){}
    try{ await refreshLicenseRuntime(); }catch(e){}
    throw err;
  }
}
async function importProfeQrBackupFile(file){
  const text=await file.text();
  let obj; try{ obj=JSON.parse(text); }catch(e){ throw new Error('Archivo JSON inválido o corrupto'); }
  return restoreProfeQrBackupObject(obj);
}
