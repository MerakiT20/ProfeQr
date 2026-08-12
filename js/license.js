/* --- RC Core 6: signed offline licensing --- */
const LICENSE_PUBLIC_JWK = {"kty":"EC","crv":"P-256","x":"tVGYk5GVfqn4YTvw11NBBKIG0C2KXfx0nhvbHKsTUiY","y":"rETyxvIaGKms9B46XFLc5l4bug_o0PsT0Ji2g72zB2o","ext":true,"key_ops":["verify"]};
const INSTALLATION_ID_KEY = 'profeqr_installation_id_v1';
let licenseRuntime = {checked:false,valid:false,mode:'none',reason:'pending',payload:null};

function normalizeLicenseCct(v=''){ return String(v||'').toUpperCase().replace(/\s+/g,'').trim(); }
function getInstallationId(){
  let id='';
  try{ id=localStorage.getItem(INSTALLATION_ID_KEY)||''; }catch(e){}
  if(id) return id;
  const bytes=new Uint8Array(16); crypto.getRandomValues(bytes);
  id='PQI-'+Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('').toUpperCase();
  try{ localStorage.setItem(INSTALLATION_ID_KEY,id); }catch(e){}
  return id;
}
function base64UrlToBytes(text){
  const s=String(text||'').replace(/-/g,'+').replace(/_/g,'/');
  const padded=s+'='.repeat((4-s.length%4)%4);
  const raw=atob(padded); return Uint8Array.from(raw,c=>c.charCodeAt(0));
}
function bytesToUtf8(bytes){ return new TextDecoder().decode(bytes); }
async function importLicensePublicKey(){
  if(!crypto?.subtle) throw new Error('Web Crypto no disponible');
  return crypto.subtle.importKey('jwk',LICENSE_PUBLIC_JWK,{name:'ECDSA',namedCurve:'P-256'},false,['verify']);
}
function parseLicenseToken(token){
  const parts=String(token||'').trim().split('.');
  if(parts.length!==3 || parts[0]!=='PQ1') throw new Error('Formato de licencia inválido');
  const payloadBytes=base64UrlToBytes(parts[1]);
  const payload=JSON.parse(bytesToUtf8(payloadBytes));
  return {payload,payloadBytes,signature:base64UrlToBytes(parts[2]),token:String(token||'').trim()};
}
async function verifyLicenseToken(token){
  try{
    const parsed=parseLicenseToken(token);
    const key=await importLicensePublicKey();
    const ok=await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},key,parsed.signature,parsed.payloadBytes);
    if(!ok) return {valid:false,reason:'signature',message:'La firma de la licencia no es válida.'};
    const p=parsed.payload||{};
    if(p.v!==1 || p.product!=='profeqr') return {valid:false,reason:'product',message:'La licencia no corresponde a ProfeQr.'};
    if(String(p.installationId||'')!==getInstallationId()) return {valid:false,reason:'device',message:'La licencia pertenece a otra instalación.'};
    if(normalizeLicenseCct(p.cct)!==normalizeLicenseCct(db?.config?.cct||'')) return {valid:false,reason:'cct',message:'La licencia no corresponde al CCT configurado.'};
    if(String(p.cycle||'').trim()!==String(db?.config?.cycle||'').trim()) return {valid:false,reason:'cycle',message:'La licencia no corresponde al ciclo escolar configurado.'};
    if(!/^\d{4}-\d{2}-\d{2}$/.test(String(p.expiresAt||''))) return {valid:false,reason:'expiry',message:'La licencia no contiene una fecha de vencimiento válida.'};
    if(today()>p.expiresAt) return {valid:false,reason:'expired',message:`La licencia venció el ${p.expiresAt}.`,payload:p};
    return {valid:true,reason:'ok',message:'Licencia válida',payload:p,token:parsed.token};
  }catch(err){
    console.error('verifyLicenseToken:',err);
    return {valid:false,reason:'invalid',message:'Licencia inválida o corrupta.'};
  }
}
async function refreshLicenseRuntime(){
  if(!db?.config){ licenseRuntime={checked:true,valid:true,mode:'setup',reason:'setup',payload:null}; return licenseRuntime; }
  const token=db.config?.license?.token||'';
  if(token){
    const result=await verifyLicenseToken(token);
    licenseRuntime={checked:true,valid:!!result.valid,mode:'signed',reason:result.reason,payload:result.payload||null,message:result.message};
    return licenseRuntime;
  }
  if(db.config.licenseLegacyGrandfathered===true){
    const valid=today()<=LICENSE_END;
    licenseRuntime={checked:true,valid,mode:'legacy',reason:valid?'legacy':'expired',payload:{expiresAt:LICENSE_END},message:valid?'Licencia heredada temporal':'Licencia heredada vencida'};
    return licenseRuntime;
  }
  licenseRuntime={checked:true,valid:false,mode:'none',reason:'missing',payload:null,message:'Esta instalación requiere activación.'};
  return licenseRuntime;
}
async function migrateCore6Licensing(){
  if(!db?.config) return false;
  if(typeof db.config.licenseLegacyGrandfathered==='undefined' && !db.config?.license?.token){
    db.config.licenseLegacyGrandfathered=true;
    return saveDb({system:true});
  }
  return false;
}
async function activateLicenseToken(token){
  const result=await verifyLicenseToken(token);
  if(!result.valid) return result;
  db.config.license={
    token:result.token,
    licenseId:String(result.payload.licenseId||''),
    issuedAt:String(result.payload.issuedAt||''),
    expiresAt:String(result.payload.expiresAt||''),
    cct:String(result.payload.cct||''),
    cycle:String(result.payload.cycle||''),
    installationId:String(result.payload.installationId||'')
  };
  db.config.licenseLegacyGrandfathered=false;
  if(!saveDb({system:true})) return {valid:false,reason:'save',message:'No se pudo guardar la licencia.'};
  await refreshLicenseRuntime();
  return {valid:true,reason:'ok',message:'Licencia activada',payload:result.payload};
}
function licenseExpiryDate(){
  return licenseRuntime?.payload?.expiresAt || db?.config?.license?.expiresAt || (db?.config?.licenseLegacyGrandfathered ? LICENSE_END : '');
}
function licenseStatusLabel(){
  if(!db?.config) return 'Configuración inicial';
  if(licenseRuntime.mode==='signed' && licenseRuntime.valid) return `Activa hasta ${licenseExpiryDate()}`;
  if(licenseRuntime.mode==='legacy' && licenseRuntime.valid) return `Licencia heredada hasta ${LICENSE_END}`;
  if(licenseRuntime.reason==='expired') return `Vencida ${licenseExpiryDate()||''}`.trim();
  return 'Activación requerida';
}
function isExpired(){ return !!db?.config && licenseRuntime.checked && !licenseRuntime.valid; }
function canWrite(){ return !db?.config || (licenseRuntime.checked && licenseRuntime.valid); }
function writeBlockedMessage(){ toast(licenseRuntime?.message || 'La licencia no permite modificar datos.'); }
