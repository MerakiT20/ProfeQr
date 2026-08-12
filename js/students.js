/* --- Students --- */
function downloadStudentTemplate(){
  const wb = XLSX.utils.book_new();
  const captura = Array.from({length:50},(_,i)=>({'No. Lista':i+1,'Nombre completo':''}));
  const instrucciones = [
    {'Instrucciones':'1. Escribe solo el número de lista y el nombre completo del estudiante.'},
    {'Instrucciones':'2. No cambies los encabezados.'},
    {'Instrucciones':'3. Guarda el archivo y súbelo en ProfeQr.'},
    {'Instrucciones':'4. El QR se genera automáticamente con base en el grupo y el número de lista.'}
  ];
  const ws1 = XLSX.utils.json_to_sheet(captura);
  const ws2 = XLSX.utils.json_to_sheet(instrucciones);
  styleSheet(ws1); styleSheet(ws2);
  XLSX.utils.book_append_sheet(wb, ws1, 'CAPTURA_ALUMNOS');
  XLSX.utils.book_append_sheet(wb, ws2, 'INSTRUCCIONES');
  XLSX.writeFile(wb, 'Plantilla_ProfeQr_Alumnos.xlsx');
}

function renderStudents(){
  const students = [...db.group.students].sort((a,b)=>(a.listNo||999)-(b.listNo||999));
  const activeCount = students.filter(s=>s.active!==false).length;
  const inactiveCount = students.length - activeCount;
  return `
  <div class="card">
    <div class="section-title">Carga rápida del grupo</div>
    <div class="row row2">
      <button class="btn secondary" id="download-template-btn">Descargar plantilla Excel</button>
      <button class="btn primary" id="upload-template-btn" ${isExpired()?'disabled':''}>Subir plantilla</button>
      <input id="upload-template-input" type="file" accept=".xlsx,.xls,.csv" class="hidden">
    </div>
    <div class="help">La plantilla te pide solo el número de lista y el nombre completo. Eso facilita la captura y evita errores al importar.</div>
  </div>
  <div class="card">
    <div class="section-title">Agregar alumno manualmente</div>
    <div class="row">
      <div><div class="small">No. de lista</div><input id="student-listno" inputmode="numeric"></div>
      <div><div class="small">Nombre completo</div><input id="student-name"></div>
      <button class="btn primary" id="student-add-btn" ${isExpired()?'disabled':''}>Agregar alumno</button>
    </div>
  </div>
  <div class="card">
    <div class="section-title">Lista de alumnos</div>
    <div class="help">Activos: ${activeCount} · Inactivos: ${inactiveCount}. Para no perder historial, los alumnos se suspenden en vez de eliminarse.</div>
    <div class="small">Buscar</div>
    <input id="student-search" placeholder="Nombre, número de lista o QR">
    <div id="students-list" style="margin-top:10px">
      ${students.map(s=>`
        <div class="item student-row" data-filter="${esc(`${s.name} ${s.listNo} ${s.qr}`)}">
          <div><div class="item-title">${esc(s.name)}</div><div class="item-sub">Lista ${s.listNo} · ${esc(s.qr)} · ${s.active===false?'Inactivo':'Activo'}</div></div>
          <button class="mini" data-toggle-student-status="${s.id}" ${isExpired()?'disabled':''}>${s.active===false?'Reactivar':'Suspender'}</button>
        </div>`).join('')}
      ${students.length===0 ? '<div class="small">Todavía no hay alumnos.</div>' : ''}
    </div>
  </div>`;
}
function bindStudents(){
  document.getElementById('download-template-btn').onclick = downloadStudentTemplate;
  document.getElementById('upload-template-btn').onclick = () => {
    if(!canWrite()) return writeBlockedMessage();
    document.getElementById('upload-template-input').click();
  };
  document.getElementById('upload-template-input').onchange = e => {
    if(!canWrite()) return writeBlockedMessage();
    const file = e.target.files[0];
    if(!file) return;
    const r = new FileReader();
    r.onload = ev => {
      const data = new Uint8Array(ev.target.result);
      const wb = XLSX.read(data,{type:'array'});
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws,{defval:''});
      const imported = rows.map(row=>{
        const keys = Object.keys(row);
        const lk = keys.find(k=>slug(k).includes('lista'));
        const nk = keys.find(k=>slug(k).includes('nombre'));
        const listNo = Number(row[lk]||0);
        const name = String(row[nk]||'').trim();
        if(!listNo || !name) return null;
        return {id:uid(), listNo, name, active:true, qr:qrCodeFor(db.config.group, listNo)};
      }).filter(Boolean).sort((a,b)=>a.listNo-b.listNo);
      if(!imported.length){ toast('La plantilla no tiene datos válidos'); return; }
      db.group.students = imported;
      if(!saveDb()) return;
      toast(`Grupo cargado: ${imported.length} alumnos`);
      renderCurrentScreen();
    };
    r.readAsArrayBuffer(file);
  };

  document.getElementById('student-add-btn').onclick = () => {
    if(!canWrite()) return writeBlockedMessage();
    const listNo = Number(document.getElementById('student-listno').value || 0);
    const name = document.getElementById('student-name').value.trim();
    if(!listNo || !name){ toast('Captura lista y nombre'); return; }
    if(db.group.students.some(s=>Number(s.listNo)===listNo)){ toast('Ese número de lista ya existe'); return; }
    db.group.students.push({id:uid(), listNo, name, active:true, qr:qrCodeFor(db.config.group, listNo)});
    db.group.students.sort((a,b)=>a.listNo-b.listNo);
    if(!saveDb()) return;
    toast('Alumno agregado');
    renderCurrentScreen();
  };

  document.querySelectorAll('[data-toggle-student-status]').forEach(btn=>btn.onclick = () => {
    if(!canWrite()) return writeBlockedMessage();
    const st = findStudent(btn.dataset.toggleStudentStatus);
    if(!st) return;
    if(st.active !== false){
      if(!confirm('Se suspenderá al alumno para que no aparezca en capturas nuevas, pero conservará su historial. ¿Continuar?')) return;
      st.active = false;
      toast('Alumno suspendido; historial conservado');
    } else {
      st.active = true;
      toast('Alumno reactivado');
    }
    if(!saveDb()) return;
    renderCurrentScreen();
  });

  document.getElementById('student-search').oninput = e => {
    const q = slug(e.target.value);
    document.querySelectorAll('.student-row').forEach(row=>{
      row.classList.toggle('hidden', q && !slug(row.dataset.filter).includes(q));
    });
  };
}

