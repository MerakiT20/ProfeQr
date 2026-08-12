/* --- Guardias y comisiones --- */
const GC_TYPES = ['Guardia','Honores','Comisión','Otro'];
const GC_GUARD_TYPES = ['Entrada','Receso','Salida','Evento especial','Diaria','Otro'];
const GC_ZONES = ['Entrada','Patio','Cancha','Baños','Pasillos','Cooperativa','Escaleras','Aula','Salida','Otro'];
const GC_COMMISSION_TYPES = ['Lectura','Higiene','Seguridad','Periódico mural','Convivencia','Deportes','Cuidado del agua','Materiales','Otro'];
const GC_RESPONSIBLES = ['Maestro','Directivo','Comité','Grupo','Otro'];
const GC_STATUS = ['pendiente','en proceso','cumplido','cancelado'];
let gcEditingId = '';
let gcFilterType = '';
let gcFilterSpecial = '';

function normalizeGuardCommission(g={}){
  const x = g && typeof g === 'object' ? {...g} : {};
  x.id = x.id || uid();
  x.kind = GC_TYPES.includes(x.kind) ? x.kind : 'Guardia';
  x.title = x.title || (x.kind === 'Guardia' ? 'Guardia escolar' : x.kind === 'Honores' ? 'Honores a la bandera' : 'Comisión escolar');
  x.guardType = x.guardType || '';
  x.zone = x.zone || '';
  x.commissionType = x.commissionType || '';
  x.responsibleType = GC_RESPONSIBLES.includes(x.responsibleType) ? x.responsibleType : 'Maestro';
  x.responsibleName = x.responsibleName || '';
  x.groupName = x.groupName || '';
  x.date = x.date || today();
  x.startTime = x.startTime || '';
  x.endTime = x.endTime || '';
  x.repeat = AGENDA_REPEAT.includes(x.repeat) ? x.repeat : 'ninguna';
  x.priority = AGENDA_PRIORITIES.includes(x.priority) ? x.priority : 'media';
  x.description = x.description || '';
  x.expectedProduct = x.expectedProduct || '';
  x.observations = x.observations || '';
  x.status = GC_STATUS.includes(x.status) ? x.status : 'pendiente';
  x.autoAgenda = x.autoAgenda !== false;
  x.agendaEventId = x.agendaEventId || '';
  x.createdAt = x.createdAt || new Date().toISOString();
  x.updatedAt = x.updatedAt || x.createdAt;
  return x;
}
function ensureGuardCommissions(){ db.group.guardCommissions = Array.isArray(db.group.guardCommissions) ? db.group.guardCommissions.map(normalizeGuardCommission) : []; ensureAgenda(); }
function guardStatusLabel(st){ return ({pendiente:'Pendiente','en proceso':'En proceso',cumplido:'Cumplido',cancelado:'Cancelado'})[st] || st; }
function guardTypeIcon(kind){ return ({Guardia:'🛡️',Honores:'🇲🇽','Comisión':'📌',Otro:'🧭'})[kind] || '🧭'; }
function guardEffectiveStatus(g){ const x=normalizeGuardCommission(g); if(x.status==='cumplido'||x.status==='cancelado') return x.status; if(x.date < today()) return 'vencido'; return x.status; }
function guardSummary(){ ensureGuardCommissions(); const arr=db.group.guardCommissions.map(normalizeGuardCommission); return {total:arr.length, guardias:arr.filter(x=>x.kind==='Guardia').length, honores:arr.filter(x=>x.kind==='Honores').length, comisiones:arr.filter(x=>x.kind==='Comisión').length, vencidos:arr.filter(x=>guardEffectiveStatus(x)==='vencido').length}; }
function guardAgendaTitle(g){ const x=normalizeGuardCommission(g); return `${guardTypeIcon(x.kind)} ${x.title || x.kind}`; }
function syncGuardAgendaEvent(gc){ ensureGuardCommissions(); ensureAgenda(); const idx=db.group.guardCommissions.findIndex(x=>x.id===gc.id); if(idx<0) return gc; const g=normalizeGuardCommission(gc); if(!g.autoAgenda){ if(g.agendaEventId) db.group.agenda=db.group.agenda.filter(e=>e.id!==g.agendaEventId); g.agendaEventId=''; db.group.guardCommissions[idx]=g; return g; }
  const detail=[];
  if(g.guardType) detail.push('Tipo de guardia: '+g.guardType);
  if(g.zone) detail.push('Zona/área: '+g.zone);
  if(g.commissionType) detail.push('Comisión: '+g.commissionType);
  if(g.groupName) detail.push('Grupo: '+g.groupName);
  detail.push('Responsable: '+g.responsibleType+(g.responsibleName?' - '+g.responsibleName:''));
  if(g.description) detail.push('Indicaciones: '+g.description);
  if(g.expectedProduct) detail.push('Producto esperado: '+g.expectedProduct);
  if(g.observations) detail.push('Observaciones: '+g.observations);
  const ev=normalizeAgendaEvent({id:g.agendaEventId||uid(), title:guardAgendaTitle(g), type:g.kind==='Honores'?'Honores':g.kind==='Comisión'?'Comisión':'Guardia', date:g.date, startTime:g.startTime, endTime:g.endTime, priority:g.priority, repeat:g.repeat, description:detail.join('\n'), status:g.status==='cumplido'||g.status==='cancelado'?'hecho':'pendiente', createdAt:g.createdAt, updatedAt:new Date().toISOString()});
  const evIdx=db.group.agenda.findIndex(e=>e.id===ev.id); if(evIdx>=0) db.group.agenda[evIdx]=ev; else db.group.agenda.push(ev); g.agendaEventId=ev.id; db.group.guardCommissions[idx]=g; return g;
}
function renderGuardCommissions(){
  ensureGuardCommissions(); const sum=guardSummary(); const editing=gcEditingId?normalizeGuardCommission(db.group.guardCommissions.find(x=>x.id===gcEditingId)||{}):null; const list=db.group.guardCommissions.map(normalizeGuardCommission).sort((a,b)=>(a.date+a.startTime).localeCompare(b.date+b.startTime)); const filtered=gcFilterSpecial==='vencidos' ? list.filter(x=>guardEffectiveStatus(x)==='vencido') : (gcFilterType?list.filter(x=>x.kind===gcFilterType):list);
  return '<div class="card"><div class="section-title">Guardias y comisiones</div><div class="help">Organiza guardias de patio, honores a la bandera y comisiones escolares. Cada registro puede crear un evento automático en Agenda.</div></div>'+ 
  '<div class="dash-kpis cte-kpis">'+
    '<button class="dash-kpi" data-gc-filter=""><b>'+sum.total+'</b><span>Total</span></button>'+ 
    '<button class="dash-kpi" data-gc-filter="Guardia"><b>'+sum.guardias+'</b><span>Guardias</span></button>'+ 
    '<button class="dash-kpi" data-gc-filter="Honores"><b>'+sum.honores+'</b><span>Honores</span></button>'+ 
    '<button class="dash-kpi" data-gc-filter="Comisión"><b>'+sum.comisiones+'</b><span>Comisiones</span></button>'+ 
    '<button class="dash-kpi danger" data-gc-filter="vencidos"><b>'+sum.vencidos+'</b><span>Vencidos</span></button>'+ 
  '</div>'+renderGuardForm(editing)+
  '<div class="card"><div class="section-title">Lista de guardias y comisiones</div><div class="row row2" style="margin-bottom:10px"><button class="btn secondary" id="gc-export-xlsx">Exportar Excel</button><button class="btn secondary" id="gc-export-json">Exportar JSON</button></div>'+ (filtered.length?filtered.map(renderGuardItem).join(''):'<div class="small">No hay registros con este filtro.</div>')+'</div>';
}
function renderGuardForm(g){ const x=g||normalizeGuardCommission({}); return '<div class="card"><div class="section-title">'+(g?'Editar registro':'Nuevo registro')+'</div><div class="row">'+
  '<div class="row row2"><div><div class="small">Tipo *</div><select id="gc-kind">'+GC_TYPES.map(t=>'<option '+(x.kind===t?'selected':'')+'>'+t+'</option>').join('')+'</select></div><div><div class="small">Prioridad</div><select id="gc-priority">'+AGENDA_PRIORITIES.map(p=>'<option value="'+p+'" '+(x.priority===p?'selected':'')+'>'+agendaPriorityLabel(p)+'</option>').join('')+'</select></div></div>'+ 
  '<div><div class="small">Título *</div><input id="gc-title" value="'+esc(x.title)+'" placeholder="Ej. Guardia patio norte / Honores 2°G / Comisión de lectura"></div>'+ 
  '<div class="row row3"><div><div class="small">Fecha *</div><input id="gc-date" type="date" value="'+esc(x.date)+'"></div><div><div class="small">Hora inicio</div><input id="gc-start" type="time" value="'+esc(x.startTime)+'"></div><div><div class="small">Hora fin</div><input id="gc-end" type="time" value="'+esc(x.endTime)+'"></div></div>'+ 
  '<div class="row row2"><div><div class="small">Repetición</div><select id="gc-repeat">'+AGENDA_REPEAT.map(r=>'<option value="'+r+'" '+(x.repeat===r?'selected':'')+'>'+r+'</option>').join('')+'</select></div><div><div class="small">Estatus</div><select id="gc-status">'+GC_STATUS.map(st=>'<option value="'+st+'" '+(x.status===st?'selected':'')+'>'+guardStatusLabel(st)+'</option>').join('')+'</select></div></div>'+ 
  '<div class="row row2"><div><div class="small">Tipo de guardia</div><select id="gc-guard-type"><option value="">No aplica</option>'+GC_GUARD_TYPES.map(t=>'<option '+(x.guardType===t?'selected':'')+'>'+t+'</option>').join('')+'</select></div><div><div class="small">Zona / área</div><select id="gc-zone"><option value="">No aplica</option>'+GC_ZONES.map(t=>'<option '+(x.zone===t?'selected':'')+'>'+t+'</option>').join('')+'</select></div></div>'+ 
  '<div class="row row2"><div><div class="small">Tipo de comisión</div><select id="gc-commission-type"><option value="">No aplica</option>'+GC_COMMISSION_TYPES.map(t=>'<option '+(x.commissionType===t?'selected':'')+'>'+t+'</option>').join('')+'</select></div><div><div class="small">Grupo, si aplica</div><input id="gc-group-name" value="'+esc(x.groupName)+'" placeholder="Ej. 2°G"></div></div>'+ 
  '<div class="row row2"><div><div class="small">Responsable</div><select id="gc-responsible-type">'+GC_RESPONSIBLES.map(t=>'<option '+(x.responsibleType===t?'selected':'')+'>'+t+'</option>').join('')+'</select></div><div><div class="small">Nombre / área responsable</div><input id="gc-responsible-name" value="'+esc(x.responsibleName)+'" placeholder="Ej. Mtro. López / Comité de lectura"></div></div>'+ 
  '<div class="field"><div class="small">Descripción / indicaciones</div><textarea id="gc-description" rows="3" placeholder="Indicaciones, zona exacta, actividad o propósito.">'+esc(x.description)+'</textarea>'+micBtn('gc-description')+'</div>'+ 
  '<div class="field"><div class="small">Producto esperado, si aplica</div><textarea id="gc-product" rows="2" placeholder="Ej. Evidencia de lectura, periódico mural, lista de asistencia en honores.">'+esc(x.expectedProduct)+'</textarea>'+micBtn('gc-product')+'</div>'+ 
  '<div class="field"><div class="small">Observaciones</div><textarea id="gc-observations" rows="3" placeholder="Notas de seguimiento. Si se detecta una situación escolar, genera incidencia aparte.">'+esc(x.observations)+'</textarea>'+micBtn('gc-observations')+'</div>'+ 
  '<label class="check-line"><input id="gc-auto-agenda" type="checkbox" '+(x.autoAgenda?'checked':'')+'> Crear/actualizar evento automático en Agenda</label>'+ 
  '<div class="row row2"><button class="btn secondary" id="gc-cancel">'+(g?'Cancelar edición':'Limpiar')+'</button><button class="btn primary" id="gc-save">'+(g?'Guardar cambios':'Guardar registro')+'</button></div></div></div>'; }
function renderGcList(list){ return list.length ? list.map(renderGuardItem).join('') : '<div class="small">No hay registros.</div>'; }
function renderGuardItem(g){ const st=guardEffectiveStatus(g); return '<div class="cte-item '+agendaPriorityClass(g.priority)+' '+(st==='vencido'?'overdue':'')+'"><div class="agenda-icon">'+guardTypeIcon(g.kind)+'</div><div class="agenda-main"><b>'+esc(g.title||g.kind)+'</b><div class="small">'+esc(g.kind)+' · '+esc(guardStatusLabel(st))+' · '+esc(g.date)+(g.startTime?' '+esc(g.startTime):'')+(g.repeat&&g.repeat!=='ninguna'?' · repite '+esc(g.repeat):'')+' · '+esc(agendaPriorityLabel(g.priority))+'</div><div class="help">Responsable: '+esc(g.responsibleType)+(g.responsibleName?' · '+esc(g.responsibleName):'')+(g.zone?' · Zona: '+esc(g.zone):'')+(g.commissionType?' · Comisión: '+esc(g.commissionType):'')+(g.observations?' · Observaciones: '+esc(g.observations):'')+'</div></div><div class="agenda-actions"><button class="mini" data-gc-edit="'+g.id+'">Editar</button>'+(st!=='cumplido'?'<button class="mini" data-gc-done="'+g.id+'">Cumplido</button>':'')+'<button class="mini" data-gc-inc="'+g.id+'">Incidencia</button><button class="mini" data-gc-delete="'+g.id+'">Eliminar</button></div></div>'; }
function bindGuardCommissions(){ bindMicButtons(); document.querySelectorAll('[data-gc-filter]').forEach(btn=>btn.onclick=()=>{ const f=btn.dataset.gcFilter; gcFilterSpecial = f==='vencidos' ? 'vencidos' : ''; gcFilterType = gcFilterSpecial ? '' : f; renderCurrentScreen(); }); document.getElementById('gc-cancel')?.addEventListener('click',()=>{gcEditingId='';renderCurrentScreen();}); document.getElementById('gc-save')?.addEventListener('click',()=>{ const title=valOf('gc-title').trim(), date=valOf('gc-date'); if(!title||!date){toast('Título y fecha son obligatorios');return;} ensureGuardCommissions(); const previous=gcEditingId?db.group.guardCommissions.find(x=>x.id===gcEditingId):null; const gc=normalizeGuardCommission({id:gcEditingId||uid(),kind:valOf('gc-kind'),title,guardType:valOf('gc-guard-type'),zone:valOf('gc-zone'),commissionType:valOf('gc-commission-type'),responsibleType:valOf('gc-responsible-type'),responsibleName:valOf('gc-responsible-name').trim(),groupName:valOf('gc-group-name').trim(),date,startTime:valOf('gc-start'),endTime:valOf('gc-end'),repeat:valOf('gc-repeat'),priority:valOf('gc-priority'),description:valOf('gc-description').trim(),expectedProduct:valOf('gc-product').trim(),observations:valOf('gc-observations').trim(),status:valOf('gc-status'),autoAgenda:document.getElementById('gc-auto-agenda')?.checked!==false,createdAt:previous?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString(),agendaEventId:previous?.agendaEventId||''}); const idx=db.group.guardCommissions.findIndex(x=>x.id===gc.id); if(idx>=0) db.group.guardCommissions[idx]=gc; else db.group.guardCommissions.push(gc); syncGuardAgendaEvent(gc); if(!saveDb()) return; gcEditingId=''; toast('Guardia/comisión guardada'); renderCurrentScreen(); }); document.querySelectorAll('[data-gc-edit]').forEach(btn=>btn.onclick=()=>{gcEditingId=btn.dataset.gcEdit;renderCurrentScreen();}); document.querySelectorAll('[data-gc-done]').forEach(btn=>btn.onclick=()=>{const g=db.group.guardCommissions.find(x=>x.id===btn.dataset.gcDone); if(g){g.status='cumplido';g.updatedAt=new Date().toISOString();syncGuardAgendaEvent(g);saveDb();toast('Registro marcado como cumplido');renderCurrentScreen();}}); document.querySelectorAll('[data-gc-delete]').forEach(btn=>btn.onclick=()=>{if(!confirm('¿Eliminar este registro de guardia/comisión?'))return; const g=db.group.guardCommissions.find(x=>x.id===btn.dataset.gcDelete); if(g?.agendaEventId) db.group.agenda=db.group.agenda.filter(e=>e.id!==g.agendaEventId); db.group.guardCommissions=db.group.guardCommissions.filter(x=>x.id!==btn.dataset.gcDelete); saveDb(); toast('Registro eliminado'); renderCurrentScreen();}); document.querySelectorAll('[data-gc-inc]').forEach(btn=>btn.onclick=()=>{ const g=db.group.guardCommissions.find(x=>x.id===btn.dataset.gcInc); if(g){ toast('Abriendo Bitácora de Incidencias'); currentScreen='bitacora'; renderCurrentScreen(); }}); document.getElementById('gc-export-xlsx')?.addEventListener('click',exportGuardExcel); document.getElementById('gc-export-json')?.addEventListener('click',exportGuardJson); }
function exportGuardExcel(){ ensureGuardCommissions(); const rows=db.group.guardCommissions.map(g=>({tipo:g.kind,titulo:g.title,tipo_guardia:g.guardType,zona:g.zone,tipo_comision:g.commissionType,responsable_tipo:g.responsibleType,responsable:g.responsibleName,grupo:g.groupName,fecha:g.date,hora_inicio:g.startTime,hora_fin:g.endTime,repeticion:g.repeat,prioridad:g.priority,estatus:guardEffectiveStatus(g),descripcion:g.description,producto_esperado:g.expectedProduct,observaciones:g.observations,recordatorio_agenda:g.autoAgenda?'sí':'no',fecha_creacion:g.createdAt,fecha_actualizacion:g.updatedAt})); const wb=XLSX.utils.book_new(); const ws=XLSX.utils.json_to_sheet(rows); styleSheet(ws); XLSX.utils.book_append_sheet(wb,ws,'GUARDIAS_COMISIONES'); XLSX.writeFile(wb,'ProfeQr_Guardias_Comisiones_'+today()+'.xlsx'); }
function exportGuardJson(){ ensureGuardCommissions(); downloadTextFile('ProfeQr_Guardias_Comisiones_'+today()+'.json', JSON.stringify({guardCommissions:db.group.guardCommissions,exportedAt:new Date().toISOString()},null,2), 'application/json;charset=utf-8'); }



