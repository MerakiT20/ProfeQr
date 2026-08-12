// RC Core 1: punto único de inicialización.
// Debe cargarse después de todos los módulos funcionales.
let appBootstrapped = false;
function bootstrapProfeQr(){
  if(appBootstrapped) return;
  appBootstrapped = true;
  hydrateDb();
  initApp();
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', bootstrapProfeQr, {once:true});
} else {
  bootstrapProfeQr();
}
