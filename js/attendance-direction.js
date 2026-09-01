/* ProfeQr -> Direkta attendance reporting layer */
(function(){
  const CFG_KEY='profeqr_school_sync_v1';
  const OUTBOX_KEY='profeqr_attendance_outbox_v1';
  const REPORT_META_KEY='profeqr_attendance_report_meta_v1';

  function readJson(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'')||fallback;}catch(e){return fallback;}}
  function writeJson(key,value){localStorage.setItem(key,JSON.stringify(value));}
  function cfg(){return readJson(CFG_KEY,{supabaseUrl:'',anonKey:'',schoolId:'',teacherId:'',teacherName:'',groupName:''});}
  function reportMeta(){return readJson(REPORT_META_KEY,{});}
  function setReportMeta(date,value){const all=reportMeta();all[date]=value;writeJson(REPORT_META_KEY,all);}
  function getStudents(){try{return [...getActiveStudents()].sort((a,b)=>(a.listNo||999)-(b.listNo||999));}catch(e){return [];}}
  function rowsFor(date){return (db&&db.group&&db.group.attendance&&db.group.attendance[date])||[];}
  function buildPayload(date){
    const students=getStudents();
    const rows=rowsFor(date);
    const presentIds=new Set(rows.map(r=>r.studentId));
    const absences=students.filter(s=>!presentIds.has(s.id)).map(s=>({studentId:s.id,name:s.name,listNo:s.listNo||null}));
    const c=cfg();
    return {
      school_id:c.schoolId||'school-unconfigured',report_date:date,
      group_name:c.groupName||db?.group?.name||db?.group?.groupName||'Grupo',
      teacher_id:c.teacherId||'teacher-unconfigured',teacher_name:c.teacherName||'',
      total_students:students.length,present_count:rows.length,absent_count:absences.length,absences,
      captured_at:new Date().toISOString(),app:'ProfeQr'
    };
  }
  function queue(payload){
    const out=readJson(OUTBOX_KEY,[]).filter(x=>x?.payload?.report_date!==payload.report_date);
    out.push({id:Date.now()+'-'+Math.random().toString(36).slice(2),payload});writeJson(OUTBOX_KEY,out);
  }
  function normalizePayload(payload){
    const c=cfg();
    return {...payload,school_id:c.schoolId||payload.school_id,group_name:c.groupName||payload.group_name,teacher_id:c.teacherId||payload.teacher_id,teacher_name:c.teacherName||payload.teacher_name};
  }
  async function send(payload){
    const c=cfg();
    if(!c.supabaseUrl||!c.anonKey||!c.schoolId||!c.groupName) throw new Error('SYNC_NOT_CONFIGURED');
    const finalPayload=normalizePayload(payload);
    const url=c.supabaseUrl.replace(/\/$/,'')+'/rest/v1/attendance_reports?on_conflict=school_id,report_date,group_name';
    const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','apikey':c.anonKey,'Authorization':'Bearer '+c.anonKey,'Prefer':'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(finalPayload)});
    if(!res.ok) throw new Error('SYNC_HTTP_'+res.status);
  }
  async function flush(){
    if(!navigator.onLine)return;
    const out=readJson(OUTBOX_KEY,[]);if(!out.length)return;
    const keep=[];
    for(const item of out){try{await send(item.payload);setReportMeta(item.payload.report_date,{status:'sent',at:new Date().toISOString()});}catch(e){keep.push(item);}}
    writeJson(OUTBOX_KEY,keep);
  }
  async function submit(date){
    const payload=buildPayload(date);setReportMeta(date,{status:'sending',at:new Date().toISOString()});
    try{await send(payload);setReportMeta(date,{status:'sent',at:new Date().toISOString()});if(typeof toast==='function')toast('Reporte enviado a Dirección ✓');}
    catch(e){queue(payload);setReportMeta(date,{status:'queued',at:new Date().toISOString()});if(typeof toast==='function')toast(e.message==='SYNC_NOT_CONFIGURED'?'Reporte guardado; falta configurar enlace con Dirección':'Sin conexión: reporte guardado para sincronizar');}
    if(typeof renderCurrentScreen==='function')renderCurrentScreen();
  }
  function statusHtml(date){
    const m=reportMeta()[date];if(!m)return '<span class="badge bad">Pendiente de reportar</span>';
    if(m.status==='sent')return '<span class="badge ok">✓ Reportado a Dirección</span>';
    if(m.status==='queued')return '<span class="badge primary">⟳ Pendiente de sincronizar</span>';
    return '<span class="badge primary">Enviando…</span>';
  }
  function reportCard(date){
    const students=getStudents(),rows=rowsFor(date),absent=Math.max(students.length-rows.length,0);
    return `<div class="card no-print" id="att-direction-card"><div class="section-title">Reporte a Dirección</div><div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap"><div>${statusHtml(date)}<div class="small" style="margin-top:6px">${rows.length} presentes · ${absent} ausentes · ${students.length} total</div></div><button class="btn primary" id="att-submit-director" ${isExpired()?'disabled':''}>Enviar reporte</button></div><div class="row row2" style="margin-top:10px"><button class="btn" id="att-fast-start" ${isExpired()?'disabled':''}>Pase rápido: todos presentes</button><button class="btn" id="att-sync-config">Configurar enlace</button></div><div class="small" style="margin-top:8px">Pase rápido registra a todos; después toca únicamente a quienes faltaron.</div></div>`;
  }
  function configure(){
    const c=cfg();const supabaseUrl=prompt('URL de Supabase',c.supabaseUrl||'');if(supabaseUrl===null)return;
    const anonKey=prompt('Anon key de Supabase',c.anonKey||'');if(anonKey===null)return;
    const schoolId=prompt('Clave de escuela (ej. 11DTV0020P)',c.schoolId||'');if(schoolId===null)return;
    const teacherName=prompt('Nombre del docente',c.teacherName||'');if(teacherName===null)return;
    const groupName=prompt('Grupo (ej. 2°G)',c.groupName||'');if(groupName===null)return;
    const teacherId=prompt('ID corto del docente (ej. murillo-2g)',c.teacherId||'');if(teacherId===null)return;
    writeJson(CFG_KEY,{supabaseUrl:supabaseUrl.trim(),anonKey:anonKey.trim(),schoolId:schoolId.trim(),teacherName:teacherName.trim(),groupName:groupName.trim(),teacherId:teacherId.trim()});toast('Enlace guardado en este dispositivo');flush();
  }
  if(typeof renderAttendance==='function'){const originalRender=renderAttendance;renderAttendance=function(){return originalRender()+reportCard(attendanceDate);};}
  if(typeof bindAttendance==='function'){
    const originalBind=bindAttendance;bindAttendance=function(){originalBind();
      const submitBtn=document.getElementById('att-submit-director');if(submitBtn)submitBtn.onclick=()=>submit(attendanceDate);
      const cfgBtn=document.getElementById('att-sync-config');if(cfgBtn)cfgBtn.onclick=configure;
      const fastBtn=document.getElementById('att-fast-start');if(fastBtn)fastBtn.onclick=()=>{if(!canWrite())return writeBlockedMessage();const rows=db.group.attendance[attendanceDate]||[];const ids=new Set(rows.map(r=>r.studentId));const extra=getStudents().filter(s=>!ids.has(s.id)).map(s=>({id:uid(),date:attendanceDate,time:nowTime(),studentId:s.id,studentName:s.name,listNo:s.listNo,source:'PASE_RAPIDO'}));db.group.attendance[attendanceDate]=[...extra,...rows];if(saveDb()){attendanceTab='manual';toast('Todos presentes. Marca únicamente las faltas.');renderCurrentScreen();}};
    };
  }
  window.addEventListener('online',flush);setInterval(flush,60000);setTimeout(flush,2500);
  window.ProfeQrAttendanceSync={submit,flush,configure,buildPayload};
})();
