/* --- RC Core 9: local document manager (IndexedDB) --- */
const PROFEQR_FILES_DB='profeqr-files-db';
const PROFEQR_FILES_STORE='documents';
const PROFEQR_FILES_VERSION=1;
const DOC_MAX_FILE_BYTES=20*1024*1024;
const DOC_WARN_TOTAL_BYTES=80*1024*1024;
const DOC_CATEGORIES={
  horario:{label:'Horario',single:true},
  calendario:{label:'Calendario escolar',single:true},
  guardias:{label:'Rol de guardias',single:true},
  propios:{label:'Documentos propios',single:false}
};
let documentsCategory='todos';
let documentsObjectUrl='';

function openDocumentsDb(){
  return new Promise((resolve,reject)=>{
    if(!('indexedDB' in window)) return reject(new Error('IndexedDB no disponible'));
    const req=indexedDB.open(PROFEQR_FILES_DB,PROFEQR_FILES_VERSION);
    req.onupgradeneeded=()=>{
      const idb=req.result;
      if(!idb.objectStoreNames.contains(PROFEQR_FILES_STORE)){
        const store=idb.createObjectStore(PROFEQR_FILES_STORE,{keyPath:'id'});
        store.createIndex('category','category',{unique:false});
      }
    };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error||new Error('No se pudo abrir Documentos'));
  });
}
function documentsTx(mode='readonly'){
  return openDocumentsDb().then(idb=>({idb,tx:idb.transaction(PROFEQR_FILES_STORE,mode)}));
}
async function documentsList(){
  const {idb,tx}=await documentsTx();
  return new Promise((resolve,reject)=>{
    const req=tx.objectStore(PROFEQR_FILES_STORE).getAll();
    req.onsuccess=()=>{ idb.close(); resolve((req.result||[]).sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')))); };
    req.onerror=()=>{ idb.close(); reject(req.error); };
  });
}
async function documentsGet(id){
  const {idb,tx}=await documentsTx();
  return new Promise((resolve,reject)=>{
    const req=tx.objectStore(PROFEQR_FILES_STORE).get(id);
    req.onsuccess=()=>{ idb.close(); resolve(req.result||null); };
    req.onerror=()=>{ idb.close(); reject(req.error); };
  });
}
async function documentsPut(record){
  const {idb,tx}=await documentsTx('readwrite');
  return new Promise((resolve,reject)=>{
    tx.objectStore(PROFEQR_FILES_STORE).put(record);
    tx.oncomplete=()=>{ idb.close(); resolve(record); };
    tx.onerror=()=>{ idb.close(); reject(tx.error); };
  });
}
async function documentsDelete(id){
  const {idb,tx}=await documentsTx('readwrite');
  return new Promise((resolve,reject)=>{
    tx.objectStore(PROFEQR_FILES_STORE).delete(id);
    tx.oncomplete=()=>{ idb.close(); resolve(true); };
    tx.onerror=()=>{ idb.close(); reject(tx.error); };
  });
}
async function documentsClear(){
  const {idb,tx}=await documentsTx('readwrite');
  return new Promise((resolve,reject)=>{
    tx.objectStore(PROFEQR_FILES_STORE).clear();
    tx.oncomplete=()=>{ idb.close(); resolve(true); };
    tx.onerror=()=>{ idb.close(); reject(tx.error); };
  });
}
function documentsHumanSize(n){
  const v=Number(n)||0; if(v<1024) return `${v} B`; if(v<1024*1024) return `${(v/1024).toFixed(1)} KB`; return `${(v/1024/1024).toFixed(1)} MB`;
}
async function documentsStorageSummary(){
  const docs=await documentsList();
  const used=docs.reduce((s,d)=>s+(Number(d.size)||d.blob?.size||0),0);
  let quota=0,usage=0;
  try{ const e=await navigator.storage?.estimate?.(); quota=Number(e?.quota)||0; usage=Number(e?.usage)||0; }catch(e){}
  return {count:docs.length,used,quota,usage};
}
function renderDocuments(){
  return `<div class="card"><div class="section-title">Documentos escolares</div><div class="help">Archivos locales para consulta rápida. PDF e imágenes quedan guardados en este dispositivo y funcionan sin conexión.</div><div class="tabs" style="margin-top:10px">${[['todos','Todos'],...Object.entries(DOC_CATEGORIES).map(([k,v])=>[k,v.label])].map(([k,l])=>`<button class="tab ${documentsCategory===k?'active':''}" data-doc-category="${k}">${esc(l)}</button>`).join('')}</div><div class="row row2" style="margin-top:10px"><label class="btn primary" style="display:grid;place-items:center"><input id="documents-file-input" type="file" accept="application/pdf,image/*" style="display:none" ${isExpired()?'disabled':''}>+ Agregar archivo</label><select id="documents-upload-category" ${isExpired()?'disabled':''}>${Object.entries(DOC_CATEGORIES).map(([k,v])=>`<option value="${k}" ${documentsCategory===k?'selected':''}>${esc(v.label)}</option>`).join('')}</select></div><div id="documents-storage" class="help" style="margin-top:8px">Calculando almacenamiento...</div></div><div id="documents-list"><div class="card"><div class="small">Cargando documentos...</div></div></div>`;
}
async function renderDocumentsList(){
  const host=document.getElementById('documents-list'); if(!host) return;
  try{
    const docs=await documentsList();
    const filtered=documentsCategory==='todos'?docs:docs.filter(d=>d.category===documentsCategory);
    host.innerHTML=filtered.length?filtered.map(d=>`<div class="card"><div class="item"><div><div class="item-title">${esc(d.name||'Documento')}</div><div class="item-sub">${esc(DOC_CATEGORIES[d.category]?.label||d.category||'Documento')} · ${documentsHumanSize(d.size||d.blob?.size||0)} · ${esc((d.updatedAt||'').slice(0,10))}</div></div><div class="agenda-actions"><button class="mini" data-doc-open="${esc(d.id)}">Abrir</button><button class="mini" data-doc-download="${esc(d.id)}">Exportar</button>${isExpired()?'':`<button class="mini" data-doc-delete="${esc(d.id)}">Eliminar</button>`}</div></div></div>`).join(''):'<div class="card"><div class="small">No hay documentos en esta categoría.</div></div>';
    document.querySelectorAll('[data-doc-open]').forEach(b=>b.onclick=()=>openStoredDocument(b.dataset.docOpen));
    document.querySelectorAll('[data-doc-download]').forEach(b=>b.onclick=()=>downloadStoredDocument(b.dataset.docDownload));
    document.querySelectorAll('[data-doc-delete]').forEach(b=>b.onclick=()=>deleteStoredDocument(b.dataset.docDelete));
    const s=await documentsStorageSummary();
    const el=document.getElementById('documents-storage');
    if(el) el.textContent=`${s.count} archivo(s) · ${documentsHumanSize(s.used)} en Documentos${s.quota?` · almacenamiento del navegador ${Math.round((s.usage/s.quota)*100)}% utilizado`:''}`;
  }catch(err){ console.error(err); host.innerHTML='<div class="card"><div class="small">No se pudo acceder al almacenamiento de documentos.</div></div>'; }
}
function bindDocuments(){
  document.querySelectorAll('[data-doc-category]').forEach(btn=>btn.onclick=()=>{ documentsCategory=btn.dataset.docCategory; renderCurrentScreen(); });
  const input=document.getElementById('documents-file-input');
  if(input) input.onchange=async e=>{
    if(!canWrite()) return writeBlockedMessage();
    const file=e.target.files?.[0]; e.target.value=''; if(!file) return;
    const category=document.getElementById('documents-upload-category')?.value||'propios';
    await storeDocumentFile(file,category);
  };
  renderDocumentsList();
}
async function storeDocumentFile(file,category){
  if(!canWrite()) return writeBlockedMessage();
  if(!file || !DOC_CATEGORIES[category]) return;
  if(!(file.type==='application/pdf'||String(file.type||'').startsWith('image/'))){ toast('Solo se admiten PDF e imágenes'); return; }
  if(file.size>DOC_MAX_FILE_BYTES){ toast('El archivo supera el límite de 20 MB'); return; }
  try{
    const docs=await documentsList();
    const total=docs.reduce((s,d)=>s+(Number(d.size)||d.blob?.size||0),0);
    if(total+file.size>DOC_WARN_TOTAL_BYTES && !confirm('Documentos superará 80 MB. ¿Deseas continuar?')) return;
    const cfg=DOC_CATEGORIES[category];
    let id=cfg.single?`primary:${category}`:uid();
    const previous=cfg.single?await documentsGet(id):null;
    if(previous && !confirm(`Ya existe ${cfg.label}. Se reemplazará el archivo actual. ¿Continuar?`)) return;
    const now=new Date().toISOString();
    await documentsPut({id,category,name:file.name,type:file.type||'application/octet-stream',size:file.size,createdAt:previous?.createdAt||now,updatedAt:now,blob:file});
    toast(previous?'Documento reemplazado':'Documento guardado');
    renderDocumentsList();
  }catch(err){ console.error(err); toast('No se pudo guardar el documento'); }
}
async function openStoredDocument(id){
  try{
    const d=await documentsGet(id); if(!d?.blob) return toast('Documento no encontrado');
    if(documentsObjectUrl) URL.revokeObjectURL(documentsObjectUrl);
    documentsObjectUrl=URL.createObjectURL(d.blob);
    const overlay=document.createElement('div'); overlay.className='doc-modal'; overlay.id='document-modal';
    const viewer=String(d.type||'').startsWith('image/')?`<img src="${documentsObjectUrl}" alt="${esc(d.name)}" style="max-width:100%;max-height:78vh;object-fit:contain">`:`<iframe src="${documentsObjectUrl}" title="${esc(d.name)}" style="width:100%;height:78vh;border:0;background:#fff"></iframe>`;
    overlay.innerHTML=`<div class="doc-modal-card"><div class="item"><div><div class="item-title">${esc(d.name)}</div><div class="item-sub">${documentsHumanSize(d.size)}</div></div><button class="mini" id="document-modal-close">Cerrar</button></div><div style="margin-top:10px;text-align:center">${viewer}</div></div>`;
    document.body.appendChild(overlay);
    document.getElementById('document-modal-close').onclick=closeStoredDocumentViewer;
    overlay.addEventListener('click',e=>{ if(e.target===overlay) closeStoredDocumentViewer(); });
  }catch(err){ console.error(err); toast('No se pudo abrir el documento'); }
}
function closeStoredDocumentViewer(){ document.getElementById('document-modal')?.remove(); if(documentsObjectUrl){URL.revokeObjectURL(documentsObjectUrl);documentsObjectUrl='';} }
async function downloadStoredDocument(id){
  const d=await documentsGet(id); if(!d?.blob) return;
  const u=URL.createObjectURL(d.blob),a=document.createElement('a'); a.href=u;a.download=d.name||'documento';a.click();setTimeout(()=>URL.revokeObjectURL(u),1500);
}
async function deleteStoredDocument(id){
  if(!canWrite()) return writeBlockedMessage();
  const d=await documentsGet(id); if(!d) return;
  if(!confirm(`Eliminar “${d.name}” del dispositivo?`)) return;
  await documentsDelete(id); toast('Documento eliminado'); renderDocumentsList();
}
function openDocumentsCategory(category='todos'){ documentsCategory=DOC_CATEGORIES[category]?category:'todos'; currentScreen='documents'; renderCurrentScreen(); }
