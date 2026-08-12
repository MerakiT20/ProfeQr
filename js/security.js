/* --- RC Core 4: local security --- */
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
