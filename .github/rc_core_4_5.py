from pathlib import Path


def replace(path, old, new, label):
    p=Path(path); s=p.read_text(encoding='utf-8')
    if old not in s: raise SystemExit(f'{label}: target not found in {path}')
    p.write_text(s.replace(old,new,1),encoding='utf-8')

security = r'''/* --- RC Core 4: local security --- */
const PIN_SECURITY_KEY = 'profeqr_pin_security_v1';

function hasPinCredential(){
  return !!(db?.config && (db.config.pinHash || db.config.pin));
}
function pinSecurityState(){
  try{
    const raw=JSON.parse(localStorage.getItem(PIN_SECURITY_KEY)||'{}');
    return {failCount:Number(raw.failCount)||0,lockedUntil:Number(raw.lockedUntil)||0};
  }catch(e){ return {failCount:0,lockedUntil:0}; }
}
function savePinSecurityState(state){
  try{ localStorage.setItem(PIN_SECURITY_KEY,JSON.stringify(state)); }catch(e){}
}
function clearPinFailures(){ savePinSecurityState({failCount:0,lockedUntil:0}); }
function pinLockRemainingMs(){ return Math.max(0,pinSecurityState().lockedUntil-Date.now()); }
function recordPinFailure(){
  const state=pinSecurityState();
  if(state.lockedUntil>Date.now()) return state;
  state.failCount=(Number(state.failCount)||0)+1;
  if(state.failCount>=5) state.lockedUntil=Date.now()+5*60*1000;
  savePinSecurityState(state);
  return state;
}
function bytesToHex(bytes){ return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join(''); }
function randomHex(bytes=16){ const a=new Uint8Array(bytes); crypto.getRandomValues(a); return bytesToHex(a); }
async function sha256Hex(text){
  if(!crypto?.subtle) throw new Error('Web Crypto no disponible');
  const data=new TextEncoder().encode(String(text));
  const digest=await crypto.subtle.digest('SHA-256',data);
  return bytesToHex(new Uint8Array(digest));
}
async function setPinCredential(pin){
  if(!/^\d{4}$/.test(String(pin||''))) throw new Error('PIN inválido');
  db.config=db.config||{};
  const salt=randomHex(16);
  db.config.pinSalt=salt;
  db.config.pinHash=await sha256Hex(`${salt}:${pin}`);
  delete db.config.pin;
  clearPinFailures();
  return true;
}
async function verifyPinCredential(pin){
  if(!db?.config) return false;
  if(db.config.pinHash && db.config.pinSalt){
    const hash=await sha256Hex(`${db.config.pinSalt}:${pin}`);
    return hash===db.config.pinHash;
  }
  // Compatibilidad solo durante migración de instalaciones antiguas.
  return !!db.config.pin && String(pin)===String(db.config.pin);
}
async function migrateLegacyPinSecurity(){
  if(!db?.config || !db.config.pin || db.config.pinHash) return false;
  const legacy=String(db.config.pin);
  await setPinCredential(legacy);
  return saveDb({system:true});
}
function sanitizedBackupDb(){
  const copy=JSON.parse(JSON.stringify(db));
  if(copy.config) delete copy.config.pin;
  return copy;
}
'''
Path('js/security.js').write_text(security,encoding='utf-8')

replace('index.html','<script src="./js/core.js"></script>','<script src="./js/core.js"></script>\n<script src="./js/security.js"></script>','load security')

replace('js/bootstrap.js',
'''function bootstrapProfeQr(){
  if(appBootstrapped) return;
  appBootstrapped = true;
  hydrateDb();
  initApp();
}''',
'''async function bootstrapProfeQr(){
  if(appBootstrapped) return;
  appBootstrapped = true;
  hydrateDb();
  try{ await migrateLegacyPinSecurity(); }catch(e){ console.error('PIN migration error:',e); }
  initApp();
}''','bootstrap migration')

replace('js/core.js',
'''function saveDb(){
  try{
    localStorage.setItem(KEY, JSON.stringify(db));
    return true;
  }catch(e){''',
'''function restorePersistedDb(){
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
  }catch(e){''','central write gate')

replace('js/core.js',
'''function isExpired(){ return today() > LICENSE_END; }
function canWrite(){ return !isExpired(); }
function writeBlockedMessage(){ toast('La licencia de este ciclo venció el 30 de julio de 2027. Puedes consultar y exportar, pero no capturar nuevos datos.'); }''',
'''function licenseExpiryDate(){ return db?.config?.license?.expiresAt || LICENSE_END; }
function isExpired(){ return !!db?.config && today() > licenseExpiryDate(); }
function canWrite(){ return !db?.config || !isExpired(); }
function writeBlockedMessage(){ toast(`Licencia vencida (${licenseExpiryDate()}). Puedes consultar y exportar, pero no modificar datos.`); }''','license helpers')

replace('js/shell.js',
'''  if(db.config.pin){ showPinScreen(); } else { applyTheme(db.config.theme||'professional'); renderApp(); }''',
'''  if(hasPinCredential()){ showPinScreen(); } else { applyTheme(db.config.theme||'professional'); renderApp(); }''','pin credential init')

replace('js/shell.js',
'''function showPinScreen(){
  pinBuffer=''; pinFailCount=0; applyTheme(db.config.theme||'professional');''',
'''function showPinScreen(){
  pinBuffer=''; pinFailCount=pinSecurityState().failCount; applyTheme(db.config.theme||'professional');''','persistent attempts')

replace('js/shell.js',
'''function pinKey(k){
  if(pinBuffer.length>=4) return;
  if(pinFailCount>=5){ document.getElementById('pin-err').textContent='Demasiados intentos. Recarga la app.'; return; }
  pinBuffer+=String(k); updatePinDots(); if(pinBuffer.length===4) setTimeout(checkPin,160);
}''',
'''function pinKey(k){
  if(pinBuffer.length>=4) return;
  const remain=pinLockRemainingMs();
  if(remain>0){ const e=document.getElementById('pin-err'); if(e) e.textContent=`Acceso bloqueado. Intenta en ${Math.ceil(remain/60000)} min.`; return; }
  pinBuffer+=String(k); updatePinDots(); if(pinBuffer.length===4) setTimeout(()=>checkPin(),160);
}''','pin lock')

replace('js/shell.js',
'''function checkPin(){
  if(pinBuffer===db.config.pin){
    pinBuffer=''; pinFailCount=0;
    if(wizDraftLoad()){ currentScreen='bitacoraForm'; } else { currentScreen='home'; }
    renderApp();
  } else {
    pinFailCount++; const e=document.getElementById('pin-err');
    if(e) e.textContent='PIN incorrecto. Intentos: '+pinFailCount+'/5';
    pinBuffer=''; updatePinDots();
  }
}''',
'''async function checkPin(){
  const remain=pinLockRemainingMs();
  if(remain>0){ const e=document.getElementById('pin-err'); if(e) e.textContent=`Acceso bloqueado. Intenta en ${Math.ceil(remain/60000)} min.`; pinBuffer=''; updatePinDots(); return; }
  let ok=false;
  try{ ok=await verifyPinCredential(pinBuffer); }catch(err){ console.error(err); }
  if(ok){
    pinBuffer=''; pinFailCount=0; clearPinFailures();
    if(wizDraftLoad()){ currentScreen='bitacoraForm'; } else { currentScreen='home'; }
    renderApp();
  } else {
    const state=recordPinFailure(); pinFailCount=state.failCount; const e=document.getElementById('pin-err');
    if(e) e.textContent=state.lockedUntil>Date.now()?'Demasiados intentos. Acceso bloqueado 5 minutos.':'PIN incorrecto. Intentos: '+state.failCount+'/5';
    pinBuffer=''; updatePinDots();
  }
}''','async pin verify')

replace('js/shell.js',"document.getElementById('setup-save').onclick = () => {","document.getElementById('setup-save').onclick = async () => {",'async setup')
replace('js/shell.js',
'''      theme: 'professional',
      pin: pin
    };''',
'''      theme: 'professional'
    };
    try{ await setPinCredential(pin); }catch(e){ console.error(e); toast('No se pudo proteger el PIN en este dispositivo'); return; }''','secure setup pin')

replace('js/settings.js',"document.getElementById('change-pin-btn')?.addEventListener('click',()=>{","document.getElementById('change-pin-btn')?.addEventListener('click',async ()=>{",'async pin settings')
replace('js/settings.js',
'''    if(actual!==db.config.pin){ toast('PIN actual incorrecto'); return; }
    if(!/^\\d{4}$/.test(nuevo)){ toast('Nuevo PIN debe ser 4 digitos'); return; }
    if(nuevo!==conf){ toast('PINes no coinciden'); return; }
    db.config.pin=nuevo; saveDb(); toast('PIN actualizado');''',
'''    if(!(await verifyPinCredential(actual))){ toast('PIN actual incorrecto'); return; }
    if(!/^\\d{4}$/.test(nuevo)){ toast('Nuevo PIN debe ser 4 digitos'); return; }
    if(nuevo!==conf){ toast('PINes no coinciden'); return; }
    try{ await setPinCredential(nuevo); }catch(e){ toast('No se pudo proteger el PIN'); return; }
    if(!saveDb()) return; toast('PIN actualizado');''','secure pin change')

replace('js/settings.js',
'''    const blob = new Blob([JSON.stringify(db,null,2)],{type:'application/json'});''',
'''    const blob = new Blob([JSON.stringify(sanitizedBackupDb(),null,2)],{type:'application/json'});''','sanitized backup')

replace('js/settings.js',"    r.onload = ()=> {","    r.onload = async ()=> {",'async import')
replace('js/settings.js',
'''        db = safeDb(JSON.parse(r.result));
        if(!saveDb()) return;''',
'''        if(!canWrite()) return writeBlockedMessage();
        db = safeDb(JSON.parse(r.result));
        try{ await migrateLegacyPinSecurity(); }catch(e){ console.error('PIN import migration error:',e); }
        if(!saveDb()) return;''','import migration')

# Update cache version and add security asset.
replace('sw.js',"const CACHE_VERSION = 'profeqr-v8-7-rc-core-3';","const CACHE_VERSION = 'profeqr-v8-7-rc-core-4-5';",'cache version')
replace('sw.js','  "./js/core.js",','  "./js/core.js",\n  "./js/security.js",','cache security')

# Assertions: no operational plaintext PIN remains except legacy migration compatibility.
shell=Path('js/shell.js').read_text(encoding='utf-8')
settings=Path('js/settings.js').read_text(encoding='utf-8')
core=Path('js/core.js').read_text(encoding='utf-8')
assert 'pin: pin' not in shell
assert 'pinBuffer===db.config.pin' not in shell
assert 'actual!==db.config.pin' not in settings
assert 'restorePersistedDb' in core and 'licenseExpiryDate' in core
