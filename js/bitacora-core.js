/* --- Bitácora de IncidenciasVersion v4 - Fase 4: acta final robusta --- */
let bitacoraDraft = null;
let bitacoraTab = 'new';
let bitacoraFilters = {student:'', route:'', status:'', light:'', due:''};
let bitacoraStep = 0;
let bitMicRecognition = null;
let bitMicTarget = null;

const BIT_STEPS = {
  A:['Personas','Clasificación','Riesgo','Lugar y momento','Relatoría','Testigos y evidencias','Protección','Notificación','Canalización','Compromisos','Previa'],
  B:['Alumno','Conducta','Contexto','Intervención','Medida formativa','Compromisos','Previa'],
  C:['Alumno','Periodo','Faltas detectadas','Contacto familiar','Riesgo y acuerdos','Seguimiento','Previa'],
  CIT:['Alumno','Tutor','Cita','Motivo','Entrega','Previa']
};
const BIT_OPTS = {
  lugares:['Aula','Patio','Cancha','Baños','Dirección','Pasillo','Entrada/Salida','Cooperativa','Trayecto escolar','Otro'],
  rolesA:['presunto receptor','presunto generador','testigo','otro'],
  tiposA:['física','psicoemocional','verbal/lenguaje','cibernética','exclusión','sexual','suplantación de identidad','amenaza','daño a propiedad','otra'],
  gravedadA:['leve','moderada','grave'],
  riesgosA:['Hay lesión visible','Requiere atención médica','Hay amenaza vigente','Hay posible abuso sexual','Hay adulto involucrado','Hay posible delito','Hay arma u objeto peligroso','Hay droga, alcohol o sustancia','Hay evidencia digital','Hay publicación en redes','Hay suplantación de identidad','Hay reiteración o antecedentes','Hay discapacidad, trastorno, barrera para el aprendizaje o condición vulnerable','Hay riesgo de represalia','La familia no respondió','El alumno no se siente seguro'],
  evidencias:['Fotografía','Captura de pantalla','Mensaje digital','Objeto dañado','Registro previo','Testimonio','Lesión visible','Reporte de asistencia','Citatorio','Otra'],
  accionesA:['Separación preventiva','Contención del grupo','Acompañamiento del alumno afectado','Aviso a dirección','Llamada a familia','Atención médica','Resguardo de evidencia','Supervisión reforzada','Otra'],
  canales:['Dirección escolar','Supervisión','Aprender a Convivir','DIF Municipal','Salud','Fiscalía','911 / emergencia','USAER / DUSAER','Trabajo Social','Otro'],
  tiposB:['desobediencia','interrupción reiterada','lenguaje inapropiado','incumplimiento de actividad','uso indebido de celular','salida del aula sin autorización','daño menor a material','falta de respeto','conflicto menor sin lesión','otra'],
  reincidencia:['primera vez','segunda vez','recurrente'],
  medidasB:['diálogo formativo','llamado de atención','cambio temporal de lugar','reparación del daño','carta compromiso','actividad de reflexión','notificación a tutor','seguimiento semanal','otra'],
  escalamientoB:['lesión','amenaza','acoso reiterado','humillación','ciberacoso','violencia sexual','discriminación grave','arma','riesgo físico o emocional'],
  motivosC:['enfermedad','situación familiar','traslado','falta de recursos','trabajo o apoyo familiar','desinterés','seguridad','no se logró contactar','otro'],
  mediosContacto:['llamada','WhatsApp/mensaje','citatorio','entrevista presencial','visita o canal institucional','no se logró contacto','otro'],
  riesgoC:['bajo','medio','alto'],
  estatus:['abierto','en seguimiento','cerrado','canalizado']
};
function bitacoraFolio(){
  db.group.bitacoraMeta = db.group.bitacoraMeta || {schemaVersion:1, folioSeq:0};
  db.group.bitacoraMeta.folioSeq = (Number(db.group.bitacoraMeta.folioSeq)||0) + 1;
  return `BPF-${new Date().getFullYear()}-${String(db.group.bitacoraMeta.folioSeq).padStart(4,'0')}`;
}
function bitTypeName(t){ return ({A:'Ruta A: violencia e incidencias',B:'Ruta B: indisciplina e incumplimiento',C:'Ruta C: inasistencias',CIT:'Citatorio'})[t]||t; }
function activeStudentOptions(selected=''){
  return `<option value="">— Seleccionar alumno —</option>` + getActiveStudents().map(s=>`<option value="${s.id}" ${selected===s.id?'selected':''}>${esc(s.listNo)} · ${esc(s.name)}</option>`).join('');
}
function bitInput(id,label,value='',placeholder='',type='text',required=false){ return `<div><div class="small">${label}${required?' *':''}</div><input id="${id}" type="${type}" value="${esc(value||'')}" placeholder="${esc(placeholder)}"></div>`; }
function bitText(id,label,value='',placeholder='',required=false,rows=4,dictate=false){ return `<div class="field"><div class="small">${label}${required?' *':''}</div><textarea id="${id}" rows="${rows}" placeholder="${esc(placeholder)}">${esc(value||'')}</textarea>${dictate?micBtn(id):''}</div>`; }
function bitSelect(id,label,options,value='',required=false){ return `<div><div class="small">${label}${required?' *':''}</div><select id="${id}">${options.map(o=>`<option value="${esc(o)}" ${String(value)===String(o)?'selected':''}>${esc(o)}</option>`).join('')}</select></div>`; }
function bitChoice(id,label,options,value='',required=false){
  const otherValue = (value && !options.includes(value)) ? value : '';
  const selected = otherValue ? 'Otro' : value;
  return `<div class="field"><div class="small">${label}${required?' *':''}</div><div class="choice-row" data-choice-group="${id}">${options.map(o=>`<button type="button" class="choice ${selected===o?'sel':''}" data-choice="${esc(o)}">${esc(o)}</button>`).join('')}</div><input type="hidden" id="${id}" value="${esc(selected||'')}"><input class="${selected==='Otro'||selected==='otra'?'':'hidden'}" id="${id}_other" style="margin-top:8px" value="${esc(otherValue)}" placeholder="Especifica"></div>`;
}
function bitChecks(id,label,options,selected=[]){
  const set=new Set(selected||[]);
  return `<div class="field"><div class="small">${label}</div><div class="check-grid">${options.map(o=>`<label class="check-card ${set.has(o)?'checked':''}"><input type="checkbox" name="${id}" value="${esc(o)}" ${set.has(o)?'checked':''}> <span>${esc(o)}</span></label>`).join('')}</div></div>`;
}
function micBtn(targetId){ return `<div class="mic-row"><button type="button" class="mic-btn" data-mic-target="${targetId}">🎤 Dictar</button><button type="button" class="mini" data-review-text="${targetId}">Revisar</button><button type="button" class="mini" data-undo-text="${targetId}">↩ Deshacer</button><button type="button" class="mini" data-clear-text="${targetId}">🗑 Borrar</button><span class="small" id="${targetId}-mic-status"></span></div><div class="mic-preview" id="${targetId}-mic-preview"></div><div class="mic-hint">Habla cerca del teléfono. Pausa breve para confirmar cada frase.</div>`; }
function bindChoiceButtons(){
  document.querySelectorAll('[data-choice-group]').forEach(group=>{
    const id=group.dataset.choiceGroup;
    group.querySelectorAll('[data-choice]').forEach(btn=>btn.onclick=()=>{
      group.querySelectorAll('.choice').forEach(b=>b.classList.remove('sel'));
      btn.classList.add('sel');
      const value=btn.dataset.choice;
      const hidden=document.getElementById(id); if(hidden) hidden.value=value;
      const other=document.getElementById(id+'_other'); if(other) other.classList.toggle('hidden', !(value==='Otro'||value==='otra'));
    });
  });
  document.querySelectorAll('[data-clear-text]').forEach(btn=>btn.onclick=()=>{ const el=document.getElementById(btn.dataset.clearText); if(el && confirm('¿Borrar este texto para volver a dictar o escribir?')) el.value=''; });
}
function bindMicButtons(){
  document.querySelectorAll('[data-mic-target]').forEach(btn=>btn.onclick=()=>toggleBitDictation(btn.dataset.micTarget, btn));
  document.querySelectorAll('[data-clear-text]').forEach(btn=>btn.onclick=()=>{ const id=btn.dataset.clearText; const el=document.getElementById(id); if(el && confirm('¿Borrar este texto para volver a grabar?')){ el.dataset.beforeClear=el.value||''; el.value=''; el.dataset.dictated=''; }});
  document.querySelectorAll('[data-review-text]').forEach(btn=>btn.onclick=()=>reviewBitText(btn.dataset.reviewText));
  document.querySelectorAll('[data-undo-text]').forEach(btn=>btn.onclick=()=>undoBitText(btn.dataset.undoText));
}
function cleanRepeatedDictation(text=''){
  let s=String(text||'').replace(/\s+/g,' ').trim();
  // Quita repeticiones consecutivas de palabras/frases cortas comunes del dictado.
  s=s.replace(/\b(\w+)(\s+\1\b)+/gi,'$1');
  s=s.replace(/\b((?:\w+\s+){1,4}\w+)(?:\s+\1\b)+/gi,'$1');
  s=s.replace(/\s+([,.;:])/g,'$1').trim();
  if(s && !/[.!?]$/.test(s)) s+='.';
  return s.charAt(0).toUpperCase()+s.slice(1);
}
function reviewBitText(targetId){
  const el=document.getElementById(targetId); if(!el) return;
  el.dataset.beforeReview=el.value||'';
  el.value=cleanRepeatedDictation(el.value||'');
  toast('Texto revisado. Confirma que no cambió el sentido.');
}
function undoBitText(targetId){
  const el=document.getElementById(targetId); if(!el) return;
  if(el.dataset.beforeReview!==undefined){ el.value=el.dataset.beforeReview; delete el.dataset.beforeReview; toast('Revisión deshecha'); return; }
  if(el.dataset.beforeClear!==undefined){ el.value=el.dataset.beforeClear; delete el.dataset.beforeClear; toast('Borrado deshecho'); return; }
  // FIX v4: deshacer última frase dictada
  if(el.dataset.lastPhrase!==undefined){
    const was=String(el.value||'');
    if(was.endsWith(el.dataset.lastPhrase)){ el.value=was.slice(0,-(el.dataset.lastPhrase.length)).trimEnd(); }
    delete el.dataset.lastPhrase; toast('Última frase deshecha'); return;
  }
  toast('No hay cambio para deshacer');
}
function toggleBitDictation(targetId, btn){
  // FIX v4: continuo + preview en tiempo real + deduplicación
  const field=document.getElementById(targetId);
  const status=document.getElementById(targetId+'-mic-status');
  const preview=document.getElementById(targetId+'-mic-preview');
  if(!field) return;
  // Si ya está dictando este campo, detener
  if(bitMicRecognition && bitMicTarget===targetId){
    try{ bitMicRecognition.stop(); }catch(e){}
    bitMicRecognition=null; bitMicTarget=null;
    if(preview) preview.textContent='';
    if(status) status.textContent='';
    if(btn){ btn.textContent='🎤 Dictar'; btn.classList.remove('recording','grabando'); }
    return;
  }
  if(bitMicRecognition){ try{ bitMicRecognition.stop(); }catch(e){} }
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SpeechRecognition){ toast('El dictado no está disponible en este navegador'); return; }
  const rec = new SpeechRecognition();
  bitMicRecognition = rec; bitMicTarget = targetId;
  rec.lang='es-MX';
  rec.interimResults=true;   // FIX: preview en tiempo real
  rec.continuous=true;       // FIX: no se detiene solo
  rec.maxAlternatives=1;
  rec.onresult = ev => {
    let interim='';
    for(let i=ev.resultIndex; i<ev.results.length; i++){
      const r=ev.results[i];
      if(r.isFinal){
        const spoken=String(r[0].transcript||'').trim();
        if(spoken){
          const current=field.value||'';
          const eWords=current.trim().split(/\s+/);
          const nWords=spoken.split(/\s+/);
          let toAdd=spoken;
          for(let ov=Math.min(5,eWords.length,nWords.length); ov>=1; ov--){
            const tail=eWords.slice(-ov).join(' ').toLowerCase();
            const head=nWords.slice(0,ov).join(' ').toLowerCase();
            if(tail===head){ toAdd=nWords.slice(ov).join(' '); break; }
          }
          if(toAdd.trim()){
            field.value=(field.value?field.value.trimEnd()+' ':'')+toAdd.trim();
            field.dataset.lastPhrase=toAdd.trim();
          }
        }
        if(preview) preview.textContent='';
      } else { interim+=r[0].transcript; }
    }
    if(preview && interim) preview.textContent=interim;
  };
  rec.onerror = e => {
    if(e.error==='no-speech') return;
    if(e.error==='network'){ toast('Sin conexión — el dictado requiere internet'); return; }
    if(e.error==='not-allowed'){ toast('Permiso de micrófono denegado'); return; }
    toast('No se pudo usar el micrófono');
  };
  rec.onend = () => {
    if(preview) preview.textContent='';
    if(bitMicRecognition===rec && bitMicTarget===targetId){
      try{ rec.start(); }catch(e){
        bitMicRecognition=null; bitMicTarget=null;
        if(btn){ btn.textContent='🎤 Dictar'; btn.classList.remove('recording','grabando'); }
        if(status) status.textContent='';
      }
    } else {
      if(btn){ btn.textContent='🎤 Dictar'; btn.classList.remove('recording','grabando'); }
      if(status) status.textContent='';
    }
  };
  if(status) status.textContent=' 🎤 Escuchando...';
  if(btn){ btn.textContent='⏹ Detener'; btn.classList.add('recording','grabando'); }
  try{ rec.start(); }catch(e){ toast('No se pudo iniciar el dictado'); bitMicRecognition=null; bitMicTarget=null; }
}
function getChoice(id){ const v=valOf(id); const other=valOf(id+'_other'); return (v==='Otro'||v==='otra') ? other : v; }
function getChecks(id){ return [...document.querySelectorAll(`input[name="${id}"]:checked`)].map(x=>x.value); }
function bitRiskAlert(flags=[]){
  const critical=['Hay posible abuso sexual','Hay adulto involucrado','Requiere atención médica','Hay arma u objeto peligroso','Hay amenaza vigente','Hay posible delito','El alumno no se siente seguro'];
  const anti=['Hay posible abuso sexual','Hay adulto involucrado'];
  const isRed=flags.some(f=>critical.includes(f)); const isAnti=flags.some(f=>anti.includes(f));
  if(!isRed && !isAnti) return '';
  return `<div class="alert-legal ${isRed?'red':'amber'}"><b>${isRed?'⚠️ Alerta roja de protocolo':'⚠️ Alerta preventiva'}</b><p>Este caso requiere activar protocolo, informar a dirección y valorar canalización inmediata. Registra hechos sin interrogar ni revictimizar. No emitas diagnósticos ni conclusiones.</p>${isAnti?'<p><b>Anti-revictimización:</b> No interrogar ni presionar al menor. Registra únicamente manifestaciones espontáneas, palabras textuales, conducta observada y acciones de protección.</p>':''}</div>`;
}
function shouldEscalateB(flags=[]){ return (flags||[]).length>0; }
function getAbsenceRiskC(data={}){
  const total=(data.c_absences_auto||[]).length; const noResp=!!data.c_no_response || data.c_contact_medium==='no se logró contacto';
  if(total>=5 || noResp || data.c_risk==='alto') return 'rojo';
  if(total>=3 || data.c_risk==='medio') return 'amarillo';
  return 'verde';
}
function buildTimelineC(data={}){
  const dates=data.c_absences_auto||[];
  return dates.map(date=>({fecha:date, accion:data.c_contact_medium||'pendiente', respuesta:data.c_contact_response||'', acuerdo:data.c_agreement||'', seguimiento:data.c_followup_date||'', resultado:data.c_status||'en seguimiento'}));
}
