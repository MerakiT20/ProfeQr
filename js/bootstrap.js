// RC Core 1: punto único de inicialización.
// Debe cargarse después de todos los módulos funcionales.
let appBootstrapped = false;
async function bootstrapProfeQr(){
  if(appBootstrapped) return;
  appBootstrapped = true;
  hydrateDb();
  try{ await migrateLegacyPinSecurity(); }catch(e){ console.error('PIN migration error:',e); }
  try{ await migrateCore6Licensing(); }catch(e){ console.error('License migration error:',e); }
  try{ await refreshLicenseRuntime(); }catch(e){ console.error('License validation error:',e); licenseRuntime={checked:true,valid:false,mode:'none',reason:'error',payload:null,message:'No se pudo validar la licencia.'}; }
  initApp();
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', bootstrapProfeQr, {once:true});
} else {
  bootstrapProfeQr();
}
