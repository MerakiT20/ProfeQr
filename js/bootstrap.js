// RC Core 1: punto único de inicialización.
// Debe cargarse después de todos los módulos funcionales.
let appBootstrapped = false;
async function bootstrapProfeQr(){
  if(appBootstrapped) return;
  appBootstrapped = true;
  hydrateDb();
  try{ await migrateLegacyPinSecurity(); }catch(e){ console.error('PIN migration error:',e); }
  initApp();
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', bootstrapProfeQr, {once:true});
} else {
  bootstrapProfeQr();
}
