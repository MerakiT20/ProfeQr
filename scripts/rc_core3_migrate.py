from pathlib import Path


def replace(path, old, new, label):
    p = Path(path)
    s = p.read_text(encoding='utf-8')
    if old not in s:
        raise SystemExit(f'{label} target not found')
    p.write_text(s.replace(old, new, 1), encoding='utf-8')


replace(
    'js/core.js',
    "function normalizeBitacoraReport(report){\n  const r=report&&typeof report==='object'?{...report}:{};",
    """function cloneBitacoraValue(value){ try{ return JSON.parse(JSON.stringify(value)); }catch(e){ return value; } }
function bitacoraOperationalStatus(report){
  const r=report||{}, d=r.data||{};
  const candidate=r.type==='A'?d.a_status:r.type==='B'?d.b_status:r.type==='C'?d.c_status:'';
  return ['abierto','en seguimiento','canalizado','cerrado'].includes(candidate) ? candidate : 'abierto';
}
function bitacoraVersionSnapshot(report, reason='versión'){
  const r=report||{};
  return {revision:Number(r.revision)||1,reason,capturedAt:new Date().toISOString(),status:buildReportStatus(r),closedAt:r.closedAt||'',updatedAt:r.updatedAt||'',date:r.date||'',time:r.time||'',eventDate:r.eventDate||'',eventTime:r.eventTime||'',studentIds:cloneBitacoraValue(r.studentIds||[]),institutional:cloneBitacoraValue(r.institutional||{}),reporter:cloneBitacoraValue(r.reporter||{}),data:cloneBitacoraValue(r.data||{}),followUp:cloneBitacoraValue(r.followUp||{}),documentText:String(r.documentText||'')};
}
function appendBitacoraVersion(report, reason='versión'){ if(!report) return report; report.versions=Array.isArray(report.versions)?report.versions:[]; report.versions.push(bitacoraVersionSnapshot(report,reason)); return report; }
function appendBitacoraAudit(report, action, detail=''){ if(!report) return report; report.auditTrail=Array.isArray(report.auditTrail)?report.auditTrail:[]; report.auditTrail.push({at:new Date().toISOString(),action,detail,revision:Number(report.revision)||1}); return report; }
function normalizeBitacoraReport(report){
  const r=report&&typeof report==='object'?{...report}:{};""",
    'core helper',
)

replace(
    'js/core.js',
    "r.id=r.id||uid(); r.schemaVersion=Number(r.schemaVersion)||1; r.type=r.type||r.route||'A'; r.route=r.route||r.type;",
    "r.id=r.id||uid(); r.schemaVersion=Math.max(Number(r.schemaVersion)||1,3); r.type=r.type||r.route||'A'; r.route=r.route||r.type;",
    'schema',
)

replace(
    'js/core.js',
    "r.studentIds=Array.isArray(r.studentIds)?r.studentIds.filter(Boolean):[]; r.data=(r.data&&typeof r.data==='object')?r.data:{};\n  r.status=buildReportStatus(r); r.trafficLight=buildReportTrafficLight(r);",
    "r.studentIds=Array.isArray(r.studentIds)?r.studentIds.filter(Boolean):[]; r.data=(r.data&&typeof r.data==='object')?r.data:{};\n  r.revision=Math.max(Number(r.revision)||1,1); r.versions=Array.isArray(r.versions)?r.versions:[]; r.auditTrail=Array.isArray(r.auditTrail)?r.auditTrail:[]; r.closedAt=r.closedAt||''; r.reopenedAt=r.reopenedAt||'';\n  r.status=buildReportStatus(r); r.trafficLight=buildReportTrafficLight(r);",
    'metadata',
)

replace(
    'js/core.js',
    "report.updatedAt=new Date().toISOString(); report.institutional=report.institutional||buildBitacoraInstitutionalSnapshot();",
    "if(buildReportStatus(report)!=='cerrado') report.updatedAt=new Date().toISOString(); report.institutional=report.institutional||buildBitacoraInstitutionalSnapshot();",
    'closed timestamp',
)

replace(
    'js/bitacora-ui.js',
    """function changeBitacoraStatus(id,status){
  const r=(db.group.bitacoraReports||[]).find(x=>x.id===id); if(!r) return;
  r.status=status; refreshBitacoraComputedFields(r); saveDb(); toast(status==='cerrado'?'Reporte cerrado':'Reporte reabierto'); renderCurrentScreen();
}""",
    """function changeBitacoraStatus(id,status){
  if(!canWrite()) return writeBlockedMessage();
  const r=(db.group.bitacoraReports||[]).find(x=>x.id===id); if(!r) return;
  const now=new Date().toISOString();
  if(status==='cerrado'){
    if(buildReportStatus(r)==='cerrado') return toast('El reporte ya está cerrado');
    if(!confirm('Al cerrar se conservará una versión inmutable. Para modificar después tendrás que reabrir y quedará registro. ¿Cerrar?')) return;
    if(!r.documentText) r.documentText=buildBitacoraDocument(r);
    r.status='cerrado'; r.closedAt=now; r.updatedAt=now; r.trafficLight='verde';
    appendBitacoraVersion(r,'cierre'); appendBitacoraAudit(r,'cerrado','Versión final preservada');
    if(!saveDb()) return; toast('Reporte cerrado y versión preservada'); renderCurrentScreen(); return;
  }
  if(status==='en seguimiento'){
    if(buildReportStatus(r)!=='cerrado') return toast('El reporte no está cerrado');
    if(!confirm('Reabrir iniciará una nueva revisión y conservará intacta la versión cerrada. ¿Reabrir?')) return;
    r.revision=(Number(r.revision)||1)+1; r.status='en seguimiento'; r.reopenedAt=now; r.closedAt=''; r.updatedAt=now; r.trafficLight=buildReportTrafficLight(r);
    appendBitacoraAudit(r,'reabierto','Nueva revisión iniciada');
    if(!saveDb()) return; toast('Reporte reabierto como nueva revisión'); renderCurrentScreen();
  }
}""",
    'status lifecycle',
)

replace(
    'js/bitacora-ui.js',
    "bitacoraDraft={id:uid(),schemaVersion:2,folio:bitacoraFolio(),type,route:type,status:'abierto',trafficLight:'amarillo',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),date:today(),time:nowTime().slice(0,5),eventDate:today(),eventTime:nowTime().slice(0,5),institutional:buildBitacoraInstitutionalSnapshot(),reporter:{name:db.config?.teacher||'',role:'docente',source:'observación directa'},studentIds:[],data:{},followUp:{date:'',responsible:db.config?.teacher||'',notes:''},documentText:''};",
    "const createdAt=new Date().toISOString();\n  bitacoraDraft={id:uid(),schemaVersion:3,folio:bitacoraFolio(),type,route:type,status:'borrador',trafficLight:'gris',revision:1,versions:[],auditTrail:[{at:createdAt,action:'creado',detail:'Borrador iniciado',revision:1}],closedAt:'',reopenedAt:'',createdAt,updatedAt:createdAt,date:today(),time:nowTime().slice(0,5),eventDate:today(),eventTime:nowTime().slice(0,5),institutional:buildBitacoraInstitutionalSnapshot(),reporter:{name:db.config?.teacher||'',role:'docente',source:'observación directa'},studentIds:[],data:{},followUp:{date:'',responsible:db.config?.teacher||'',notes:''},documentText:''};",
    'new draft lifecycle',
)

replace(
    'js/bitacora-form.js',
    "function prepareBitPreview(){ collectBitStep(); refreshBitacoraComputedFields(bitacoraDraft); bitacoraDraft.documentText=buildBitacoraDocument(bitacoraDraft); currentScreen='bitacoraPreview'; renderCurrentScreen(); }",
    "function prepareBitPreview(){ collectBitStep(); if(bitacoraDraft.status==='borrador') bitacoraDraft.status=bitacoraOperationalStatus(bitacoraDraft); refreshBitacoraComputedFields(bitacoraDraft); bitacoraDraft.documentText=buildBitacoraDocument(bitacoraDraft); currentScreen='bitacoraPreview'; renderCurrentScreen(); }",
    'preview finalization',
)

docs = Path('js/bitacora-docs.js')
s = docs.read_text(encoding='utf-8')
a = s.index('function renderBitacoraPreview(){')
b = s.index('function downloadBitacoraPdf(r){')
block = r'''function renderBitacoraPreview(){
  if(!bitacoraDraft) return '<div class="card"><div class="section-title">Sin borrador</div></div>';
  const d=bitacoraDraft.data||{}, isClosed=buildReportStatus(bitacoraDraft)==='cerrado';
  const checks=['Encabezado institucional completo','Datos de identificación y folio','Alumno(s) ligados por studentId','Hechos observados y/o referidos separados','Evidencias y anexos descritos','Acciones, notificaciones y seguimiento','Nota de privacidad y alcance','Firmas requeridas'];
  const routeAlert=bitacoraDraft.type==='A'&&Array.isArray(d.riskFlags)&&d.riskFlags.length?`<div class="alert-danger"><b>Revisión especial Ruta A</b><p>Hay indicadores de riesgo marcados. Verifica medidas de protección, notificación y canalización antes de guardar.</p></div>`:'';
  const integrity=`<div class="help"><b>Revisión ${Number(bitacoraDraft.revision)||1}</b> · Versiones preservadas: ${(bitacoraDraft.versions||[]).length} · Creado: ${esc((bitacoraDraft.createdAt||'').slice(0,16).replace('T',' '))}${isClosed?` · Cerrado: ${esc((bitacoraDraft.closedAt||'').slice(0,16).replace('T',' '))}`:''}</div>`;
  return `<div class="card"><div class="section-title">${isClosed?'Acta cerrada · solo lectura':'Vista previa obligatoria'}</div><div class="help">${isClosed?'Este cierre está protegido. Reabre el reporte desde el historial para iniciar una nueva revisión sin alterar esta versión.':'Revisa y edita el acta final antes de guardar.'}</div>${integrity}${routeAlert}<div class="preview-checklist">${checks.map(c=>`<label><input type="checkbox" checked disabled> ${esc(c)}</label>`).join('')}</div><textarea id="bit-preview-text" ${isClosed?'readonly':''} style="min-height:520px;margin-top:12px;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:13px;line-height:1.5">${esc(bitacoraDraft.documentText||'')}</textarea>${isClosed?'<div class="row row2" style="margin-top:12px"><button class="btn secondary" id="bit-closed-back">Volver al historial</button></div>':`<label style="display:flex;gap:8px;margin-top:12px"><input type="checkbox" id="bit-validate"> Confirmo que revisé el documento y que corresponde a la información capturada.</label><div class="row row3" style="margin-top:12px"><button class="btn secondary" id="bit-edit">Regresar a editar</button><button class="btn ghost" id="bit-refresh-doc">Reconstruir acta</button><button class="btn primary" id="bit-save">Guardar</button><button class="btn ok" id="bit-save-pdf">Guardar + PDF</button><button class="btn warn" id="bit-save-word">Guardar + Word</button></div>`}</div>`;
}
function bindBitacoraPreview(){
  if(!bitacoraDraft) return;
  if(buildReportStatus(bitacoraDraft)==='cerrado'){
    const back=document.getElementById('bit-closed-back'); if(back) back.onclick=()=>{ bitacoraDraft=null; currentScreen='bitacora'; renderCurrentScreen(); }; return;
  }
  document.getElementById('bit-edit').onclick=()=>{ currentScreen='bitacoraForm'; renderCurrentScreen(); };
  const refresh=document.getElementById('bit-refresh-doc'); if(refresh) refresh.onclick=()=>{ if(!confirm('Esto reconstruirá el acta y reemplazará las ediciones manuales. ¿Continuar?')) return; bitacoraDraft.documentText=buildBitacoraDocument(bitacoraDraft); document.getElementById('bit-preview-text').value=bitacoraDraft.documentText; toast('Acta reconstruida'); };
  const doSave=(format)=>{ if(!canWrite()) return writeBlockedMessage(); if(!document.getElementById('bit-validate').checked) return toast('Marca la validación final'); bitacoraDraft.documentText=document.getElementById('bit-preview-text').value; saveBitacoraDraft(format); };
  document.getElementById('bit-save').onclick=()=>doSave('none'); document.getElementById('bit-save-pdf').onclick=()=>doSave('pdf'); document.getElementById('bit-save-word').onclick=()=>doSave('word');
}
function saveBitacoraDraft(format='none'){
  if(!canWrite()) return writeBlockedMessage();
  db.group.bitacoraReports=db.group.bitacoraReports||[]; const idx=db.group.bitacoraReports.findIndex(r=>r.id===bitacoraDraft.id);
  if(idx>=0){
    const existing=normalizeBitacoraReport(db.group.bitacoraReports[idx]);
    if(buildReportStatus(existing)==='cerrado') return toast('El acta está cerrada. Reábrela antes de modificarla.');
    appendBitacoraVersion(existing,'antes de edición'); bitacoraDraft.versions=existing.versions; bitacoraDraft.auditTrail=existing.auditTrail;
  }
  if(bitacoraDraft.status==='borrador') bitacoraDraft.status=bitacoraOperationalStatus(bitacoraDraft);
  refreshBitacoraComputedFields(bitacoraDraft); appendBitacoraAudit(bitacoraDraft,idx>=0?'actualizado':'guardado',idx>=0?'Cambios guardados en la revisión actual':'Primer guardado final');
  if(idx>=0) db.group.bitacoraReports[idx]=cloneBitacoraValue(bitacoraDraft); else db.group.bitacoraReports.unshift(cloneBitacoraValue(bitacoraDraft));
  if(!saveDb()) return; const saved=cloneBitacoraValue(bitacoraDraft); wizDraftClear(); bitacoraDraft=null; toast('Bitácora guardada'); if(format==='pdf') downloadBitacoraPdf(saved); if(format==='word') downloadBitacoraWord(saved); currentScreen='bitacora'; renderCurrentScreen();
}
function openBitacoraReport(id){ const r=(db.group.bitacoraReports||[]).find(x=>x.id===id); if(!r) return; bitacoraDraft=cloneBitacoraValue(normalizeBitacoraReport(r)); bitacoraStep=(BIT_STEPS[r.type]||[]).length-1; currentScreen='bitacoraPreview'; renderCurrentScreen(); }
'''
docs.write_text(s[:a] + block + s[b:], encoding='utf-8')

sw = Path('sw.js')
s = sw.read_text(encoding='utf-8')
s = s.replace("const CACHE_VERSION = 'profeqr-v8-7-rc-core-1';", "const CACHE_VERSION = 'profeqr-v8-7-rc-core-3';")
sw.write_text(s, encoding='utf-8')
