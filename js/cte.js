/* --- Acuerdos CTE --- */
function normalizeCteAgreement(a={}){
  const x = a && typeof a === 'object' ? {...a} : {};
  x.id = x.id || uid();
  x.type = CTE_TYPES.includes(x.type) ? x.type : 'CTE';
  x.responsibleType = CTE_RESPONSIBLE_TYPES.includes(x.responsibleType) ? x.responsibleType : 'Docente';
  x.responsibleName = x.responsibleName || '';
  x.description = x.description || '';
  x.dueDate = x.dueDate || today();
  x.priority = AGENDA_PRIORITIES.includes(x.priority) ? x.priority : 'media';
  x.status = CTE_STATUSES.includes(x.status) ? x.status : 'pendiente';
  x.evidence = x.evidence || '';
  x.autoAgenda = x.autoAgenda !== false;
  x.agendaEventId = x.agendaEventId || '';
  x.createdAt = x.createdAt || new Date().toISOString();
  x.updatedAt = x.updatedAt || x.createdAt;
  return x;
}
function ensureCte(){ db.group.cteAgreements = Array.isArray(db.group.cteAgreements) ? db.group.cteAgreements.map(normalizeCteAgreement) : [];
  db.group.guardCommissions = Array.isArray(db.group.guardCommissions) ? db.group.guardCommissions.map(normalizeGuardCommission) : []; ensureAgenda(); }
function cteStatusLabel(s){ return ({'pendiente':'Pendiente','en proceso':'En proceso','cumplido':'Cumplido','vencido':'Vencido'})[s] || s; }
function cteEffectiveStatus(a){ const x=normalizeCteAgreement(a); if(x.status!=='cumplido' && x.dueDate < today()) return 'vencido'; return x.status; }
function cteAgreementSummary(){ ensureCte(); const arr=db.group.cteAgreements.map(normalizeCteAgreement); return {total:arr.length, pendiente:arr.filter(a=>cteEffectiveStatus(a)==='pendiente').length, proceso:arr.filter(a=>cteEffectiveStatus(a)==='en proceso').length, cumplido:arr.filter(a=>cteEffectiveStatus(a)==='cumplido').length, vencido:arr.filter(a=>cteEffectiveStatus(a)==='vencido').length}; }
function cteAgendaTitle(a){ const text=String(a.description||'').trim().slice(0,70); return 'Acuerdo CTE: ' + (text || a.type); }
function syncCteAgendaEvent(a){
  ensureCte(); ensureAgenda();
  const idx=db.group.cteAgreements.findIndex(x=>x.id===a.id);
  if(idx<0) return a;
  let ag = normalizeCteAgreement(a);
  if(!ag.autoAgenda || !ag.dueDate){
    if(ag.agendaEventId) db.group.agenda = db.group.agenda.filter(e=>e.id!==ag.agendaEventId);
    ag.agendaEventId=''; db.group.cteAgreements[idx]=ag; return ag;
  }
  const ev = normalizeAgendaEvent({
    id: ag.agendaEventId || uid(), title: cteAgendaTitle(ag), type: 'CTE', date: ag.dueDate,
    priority: ag.priority, repeat: 'ninguna', studentId: '',
    description: 'Tipo: '+ag.type+'\nResponsable: '+ag.responsibleType+(ag.responsibleName?' - '+ag.responsibleName:'')+'\nAcuerdo: '+ag.description+'\nEvidencia/avance: '+(ag.evidence||'Sin evidencia registrada.'),
    status: ag.status==='cumplido' ? 'hecho' : 'pendiente', createdAt: ag.createdAt, updatedAt: new Date().toISOString()
  });
  const evIdx=db.group.agenda.findIndex(e=>e.id===ev.id);
  if(evIdx>=0) db.group.agenda[evIdx]=ev; else db.group.agenda.push(ev);
  ag.agendaEventId=ev.id; db.group.cteAgreements[idx]=ag; return ag;
}
function renderCteAgreements(){
  ensureCte();
  const sum=cteAgreementSummary();
  const editing = cteEditingId ? normalizeCteAgreement(db.group.cteAgreements.find(a=>a.id===cteEditingId)||{}) : null;
  const list=db.group.cteAgreements.map(normalizeCteAgreement).sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
  const filtered=cteFilterStatus ? list.filter(a=>cteEffectiveStatus(a)===cteFilterStatus) : list;
  const quickBar='<div class="cte-quick-bar"><span style="font-size:13px;font-weight:800;white-space:nowrap">&#9889; Rapido:</span><input id="cte-quick-desc" placeholder="Acuerdo del CTE..."/><input id="cte-quick-date" type="date" value="'+today()+'"/><button class="mini" id="cte-quick-save" style="background:var(--primary);color:#fff">+ Guardar</button></div>';
  return quickBar+'<div class="card"><div class="section-title">Acuerdos CTE</div><div class="help">Usa la captura rapida durante la reunion. Completa el formulario despues.</div><div class="help">Registra acuerdos, responsables, fecha compromiso, evidencia y seguimiento. Cada acuerdo puede crear un recordatorio automático en Agenda.</div></div>'+
  '<div class="dash-kpis cte-kpis">'+
    '<button class="dash-kpi" data-cte-filter=""><b>'+sum.total+'</b><span>Total</span></button>'+
    '<button class="dash-kpi" data-cte-filter="pendiente"><b>'+sum.pendiente+'</b><span>Pendientes</span></button>'+
    '<button class="dash-kpi" data-cte-filter="en proceso"><b>'+sum.proceso+'</b><span>En proceso</span></button>'+
    '<button class="dash-kpi danger" data-cte-filter="vencido"><b>'+sum.vencido+'</b><span>Vencidos</span></button>'+
  '</div>'+renderCteForm(editing)+
  '<div class="card"><div class="section-title">Lista de acuerdos</div><div class="row row2" style="margin-bottom:10px"><button class="btn secondary" id="cte-export-xlsx">Exportar Excel</button><button class="btn secondary" id="cte-export-json">Exportar JSON</button></div>'+
    (filtered.length?filtered.map(renderCteItem).join(''):'<div class="small">No hay acuerdos con este filtro.</div>')+'</div>';
}
function renderCteForm(a){
  const ag=a||normalizeCteAgreement({});
  return '<div class="card"><div class="section-title">'+(a?'Editar acuerdo':'Nuevo acuerdo CTE')+'</div><div class="row">'+
    '<div class="row row2"><div><div class="small">Tipo de acuerdo</div><select id="cte-type">'+CTE_TYPES.map(t=>'<option '+(ag.type===t?'selected':'')+'>'+t+'</option>').join('')+'</select></div><div><div class="small">Prioridad</div><select id="cte-priority">'+AGENDA_PRIORITIES.map(p=>'<option value="'+p+'" '+(ag.priority===p?'selected':'')+'>'+agendaPriorityLabel(p)+'</option>').join('')+'</select></div></div>'+
    '<div class="row row2"><div><div class="small">Responsable</div><select id="cte-responsible-type">'+CTE_RESPONSIBLE_TYPES.map(t=>'<option '+(ag.responsibleType===t?'selected':'')+'>'+t+'</option>').join('')+'</select></div><div><div class="small">Nombre / área responsable</div><input id="cte-responsible-name" value="'+esc(ag.responsibleName)+'" placeholder="Ej. Dirección, Comité de lectura"></div></div>'+
    '<div class="row row2"><div><div class="small">Fecha compromiso *</div><input id="cte-due" type="date" value="'+esc(ag.dueDate)+'"></div><div><div class="small">Estatus</div><select id="cte-status">'+CTE_STATUSES.map(st=>'<option value="'+st+'" '+(ag.status===st?'selected':'')+'>'+cteStatusLabel(st)+'</option>').join('')+'</select></div></div>'+
    '<div class="field"><div class="small">Descripción del acuerdo *</div><textarea id="cte-description" rows="4" placeholder="Describe el acuerdo con claridad: qué se hará, para qué y cómo se dará seguimiento.">'+esc(ag.description)+'</textarea>'+micBtn('cte-description')+'</div>'+
    '<div class="field"><div class="small">Evidencia o avance</div><textarea id="cte-evidence" rows="3" placeholder="Describe evidencia, avance o producto esperado. No se adjuntan archivos en esta etapa.">'+esc(ag.evidence)+'</textarea>'+micBtn('cte-evidence')+'</div>'+
    '<label class="check-line"><input id="cte-auto-agenda" type="checkbox" '+(ag.autoAgenda?'checked':'')+'> Crear/actualizar recordatorio automático en Agenda</label>'+ 
    '<div class="row row2"><button class="btn secondary" id="cte-cancel">'+(a?'Cancelar edición':'Limpiar')+'</button><button class="btn primary" id="cte-save">'+(a?'Guardar cambios':'Guardar acuerdo')+'</button></div></div></div>';
}
function renderCteItem(a){ const st=cteEffectiveStatus(a); return '<div class="cte-item '+agendaPriorityClass(a.priority)+' '+(st==='vencido'?'overdue':'')+'"><div class="agenda-icon">✅</div><div class="agenda-main"><b>'+esc(a.description||'(Sin descripción)')+'</b><div class="small">'+esc(a.type)+' · '+esc(cteStatusLabel(st))+' · vence '+esc(a.dueDate)+' · '+esc(agendaPriorityLabel(a.priority))+'</div><div class="help">Responsable: '+esc(a.responsibleType)+(a.responsibleName?' · '+esc(a.responsibleName):'')+(a.evidence?' · Evidencia/avance: '+esc(a.evidence):'')+'</div></div><div class="agenda-actions"><button class="mini" data-cte-edit="'+a.id+'">Editar</button>'+(st!=='cumplido'?'<button class="mini" data-cte-done="'+a.id+'">Cumplido</button>':'')+'<button class="mini" data-cte-delete="'+a.id+'">Eliminar</button></div></div>'; }
function bindCteAgreements(){
  bindMicButtons();
  document.getElementById('cte-quick-save')?.addEventListener('click',()=>{
    const desc=document.getElementById('cte-quick-desc')?.value.trim();
    const date=document.getElementById('cte-quick-date')?.value;
    if(!desc){ toast('Escribe una descripcion rapida'); return; }
    ensureCte();
    const ag=normalizeCteAgreement({description:desc,dueDate:date||today(),priority:'media',autoAgenda:true});
    db.group.cteAgreements.push(ag); syncCteAgendaEvent(ag);
    if(!saveDb()) return; toast('Acuerdo CTE guardado');
    const el=document.getElementById('cte-quick-desc'); if(el) el.value='';
    renderCurrentScreen();
  });
  document.querySelectorAll('[data-cte-filter]').forEach(btn=>btn.onclick=()=>{ cteFilterStatus=btn.dataset.cteFilter; renderCurrentScreen(); });
  document.getElementById('cte-cancel')?.addEventListener('click',()=>{ cteEditingId=''; renderCurrentScreen(); });
  document.getElementById('cte-save')?.addEventListener('click',()=>{
    const description=valOf('cte-description').trim(); const dueDate=valOf('cte-due'); if(!description||!dueDate){ toast('Descripción y fecha compromiso son obligatorias'); return; }
    ensureCte(); const previous=cteEditingId ? db.group.cteAgreements.find(x=>x.id===cteEditingId) : null;
    const ag=normalizeCteAgreement({ id: cteEditingId || uid(), type: valOf('cte-type'), responsibleType: valOf('cte-responsible-type'), responsibleName: valOf('cte-responsible-name').trim(), description, dueDate, priority: valOf('cte-priority'), status: valOf('cte-status'), evidence: valOf('cte-evidence').trim(), autoAgenda: document.getElementById('cte-auto-agenda')?.checked !== false, createdAt: previous?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString(), agendaEventId: previous?.agendaEventId || '' });
    const idx=db.group.cteAgreements.findIndex(x=>x.id===ag.id); if(idx>=0) db.group.cteAgreements[idx]=ag; else db.group.cteAgreements.push(ag); syncCteAgendaEvent(ag); if(!saveDb()) return; cteEditingId=''; toast('Acuerdo CTE guardado'); renderCurrentScreen();
  });
  document.querySelectorAll('[data-cte-edit]').forEach(btn=>btn.onclick=()=>{ cteEditingId=btn.dataset.cteEdit; renderCurrentScreen(); });
  document.querySelectorAll('[data-cte-done]').forEach(btn=>btn.onclick=()=>{ const a=db.group.cteAgreements.find(x=>x.id===btn.dataset.cteDone); if(a){ a.status='cumplido'; a.updatedAt=new Date().toISOString(); syncCteAgendaEvent(a); saveDb(); toast('Acuerdo marcado como cumplido'); renderCurrentScreen(); }});
  document.querySelectorAll('[data-cte-delete]').forEach(btn=>btn.onclick=()=>{ if(!confirm('¿Eliminar este acuerdo CTE?')) return; const a=db.group.cteAgreements.find(x=>x.id===btn.dataset.cteDelete); if(a?.agendaEventId) db.group.agenda=db.group.agenda.filter(e=>e.id!==a.agendaEventId); db.group.cteAgreements=db.group.cteAgreements.filter(x=>x.id!==btn.dataset.cteDelete); saveDb(); toast('Acuerdo eliminado'); renderCurrentScreen(); });
  document.getElementById('cte-export-xlsx')?.addEventListener('click',exportCteExcel); document.getElementById('cte-export-json')?.addEventListener('click',exportCteJson);
}
function exportCteExcel(){ ensureCte(); const rows=db.group.cteAgreements.map(a=>({tipo:a.type,responsable_tipo:a.responsibleType,responsable:a.responsibleName,descripcion:a.description,fecha_compromiso:a.dueDate,prioridad:a.priority,estatus:cteEffectiveStatus(a),evidencia_avance:a.evidence,recordatorio_agenda:a.autoAgenda?'sí':'no',fecha_creacion:a.createdAt,fecha_actualizacion:a.updatedAt})); const wb=XLSX.utils.book_new(); const ws=XLSX.utils.json_to_sheet(rows); styleSheet(ws); XLSX.utils.book_append_sheet(wb,ws,'ACUERDOS_CTE'); XLSX.writeFile(wb,'ProfeQr_Acuerdos_CTE_'+today()+'.xlsx'); }
function exportCteJson(){ ensureCte(); downloadTextFile('ProfeQr_Acuerdos_CTE_'+today()+'.json', JSON.stringify({cteAgreements:db.group.cteAgreements,exportedAt:new Date().toISOString()},null,2), 'application/json;charset=utf-8'); }


