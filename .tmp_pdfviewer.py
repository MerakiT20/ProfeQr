from pathlib import Path

p=Path('js/documents.js')
s=p.read_text(encoding='utf-8')
old="""async function openStoredDocument(id){
  try{
    const d=await documentsGet(id); if(!d?.blob) return toast('Documento no encontrado');
    if(documentsObjectUrl) URL.revokeObjectURL(documentsObjectUrl);
    documentsObjectUrl=URL.createObjectURL(d.blob);
    const overlay=document.createElement('div'); overlay.className='doc-modal'; overlay.id='document-modal';
    const viewer=String(d.type||'').startsWith('image/')?`<img src=\"${documentsObjectUrl}\" alt=\"${esc(d.name)}\" style=\"max-width:100%;max-height:78vh;object-fit:contain\">`:`<iframe src=\"${documentsObjectUrl}\" title=\"${esc(d.name)}\" style=\"width:100%;height:78vh;border:0;background:#fff\"></iframe>`;
    overlay.innerHTML=`<div class=\"doc-modal-card\"><div class=\"item\"><div><div class=\"item-title\">${esc(d.name)}</div><div class=\"item-sub\">${documentsHumanSize(d.size)}</div></div><button class=\"mini\" id=\"document-modal-close\">Cerrar</button></div><div style=\"margin-top:10px;text-align:center\">${viewer}</div></div>`;
    document.body.appendChild(overlay);
    document.getElementById('document-modal-close').onclick=closeStoredDocumentViewer;
    overlay.addEventListener('click',e=>{ if(e.target===overlay) closeStoredDocumentViewer(); });
  }catch(err){ console.error(err); toast('No se pudo abrir el documento'); }
}
"""
new="""async function openStoredDocument(id){
  try{
    const d=await documentsGet(id); if(!d?.blob) return toast('Documento no encontrado');
    closeStoredDocumentViewer();
    const overlay=document.createElement('div'); overlay.className='doc-modal'; overlay.id='document-modal';
    const isImage=String(d.type||'').startsWith('image/');
    overlay.innerHTML=`<div class=\"doc-modal-card\"><div class=\"item\"><div><div class=\"item-title\">${esc(d.name)}</div><div class=\"item-sub\">${documentsHumanSize(d.size)}</div></div><button class=\"mini\" id=\"document-modal-close\">Cerrar</button></div><div id=\"document-viewer-host\" class=\"document-viewer-host\"><div class=\"small\">Abriendo documento...</div></div></div>`;
    document.body.appendChild(overlay);
    document.getElementById('document-modal-close').onclick=closeStoredDocumentViewer;
    overlay.addEventListener('click',e=>{ if(e.target===overlay) closeStoredDocumentViewer(); });
    if(isImage){
      documentsObjectUrl=URL.createObjectURL(d.blob);
      document.getElementById('document-viewer-host').innerHTML=`<img src=\"${documentsObjectUrl}\" alt=\"${esc(d.name)}\" style=\"max-width:100%;max-height:78vh;object-fit:contain\">`;
      return;
    }
    await renderPdfInsideApp(d.blob);
  }catch(err){ console.error(err); toast('No se pudo abrir el documento'); closeStoredDocumentViewer(); }
}
async function renderPdfInsideApp(blob){
  const host=document.getElementById('document-viewer-host'); if(!host) return;
  try{
    const pdfjs=await import('../vendor/pdfjs/pdf.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc='../vendor/pdfjs/pdf.worker.mjs';
    const data=new Uint8Array(await blob.arrayBuffer());
    const task=pdfjs.getDocument({data});
    const pdf=await task.promise;
    host.innerHTML=`<div class=\"document-pdf-toolbar\"><span>${pdf.numPages} página(s)</span><button class=\"mini\" id=\"pdf-zoom-out\">−</button><span id=\"pdf-zoom-label\">100%</span><button class=\"mini\" id=\"pdf-zoom-in\">+</button></div><div id=\"pdf-pages\" class=\"pdf-pages\"></div>`;
    let scale=1.15;
    const pagesHost=document.getElementById('pdf-pages');
    const draw=async()=>{
      pagesHost.innerHTML='';
      for(let n=1;n<=pdf.numPages;n++){
        const page=await pdf.getPage(n);
        const viewport=page.getViewport({scale});
        const wrap=document.createElement('div'); wrap.className='pdf-page-wrap';
        const canvas=document.createElement('canvas');
        const ctx=canvas.getContext('2d',{alpha:false});
        const ratio=Math.min(window.devicePixelRatio||1,2);
        canvas.width=Math.floor(viewport.width*ratio); canvas.height=Math.floor(viewport.height*ratio);
        canvas.style.width=`${Math.floor(viewport.width)}px`; canvas.style.maxWidth='100%'; canvas.style.height='auto';
        wrap.appendChild(canvas); pagesHost.appendChild(wrap);
        await page.render({canvasContext:ctx,viewport,transform:ratio===1?null:[ratio,0,0,ratio,0,0]}).promise;
      }
      const label=document.getElementById('pdf-zoom-label'); if(label) label.textContent=`${Math.round(scale/1.15*100)}%`;
    };
    document.getElementById('pdf-zoom-in').onclick=async()=>{ scale=Math.min(scale+0.2,2.35); await draw(); };
    document.getElementById('pdf-zoom-out').onclick=async()=>{ scale=Math.max(scale-0.2,0.75); await draw(); };
    await draw();
  }catch(err){
    console.error('PDF.js viewer error:',err);
    host.innerHTML='<div class=\"help\">No se pudo representar este PDF dentro de ProfeQR. Puedes usar el botón Exportar desde la lista de documentos.</div>';
  }
}
"""
if old not in s:
    raise SystemExit('openStoredDocument block not found')
p.write_text(s.replace(old,new,1),encoding='utf-8')

p=Path('styles.css'); s=p.read_text(encoding='utf-8')
extra="""
.document-viewer-host{margin-top:10px;text-align:center;max-height:80vh;overflow:auto;background:var(--bg2);border-radius:14px;padding:10px}
.document-pdf-toolbar{position:sticky;top:0;z-index:2;display:flex;gap:8px;align-items:center;justify-content:center;background:var(--card);padding:8px;border-bottom:1px solid var(--line)}
.pdf-pages{display:grid;gap:12px;justify-items:center;padding:10px 0}
.pdf-page-wrap{background:#fff;box-shadow:0 2px 12px rgba(0,0,0,.18);max-width:100%}
.pdf-page-wrap canvas{display:block;max-width:100%}
"""
if '.document-viewer-host{' not in s: s += extra
p.write_text(s,encoding='utf-8')

p=Path('sw.js'); s=p.read_text(encoding='utf-8')
s=s.replace("const CACHE_VERSION = 'profeqr-rc9-documents-v1';","const CACHE_VERSION = 'profeqr-rc9-pdfjs-v1';")
anchor='  "./js/documents.js",'
if anchor not in s:
    anchor="  './js/documents.js',"
if anchor not in s: raise SystemExit('documents sw anchor missing')
insert=anchor+'\n  "./vendor/pdfjs/pdf.mjs",\n  "./vendor/pdfjs/pdf.worker.mjs",'
s=s.replace(anchor,insert,1)
p.write_text(s,encoding='utf-8')
