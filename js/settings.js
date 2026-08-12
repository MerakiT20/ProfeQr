/* --- Settings --- */
function renderSettings(){
  const form = db.config;
  return `
  <div class="card">
    <div class="section-title">Editar datos</div>
    <div class="row">
      <div><div class="small">Escuela</div><input id="set-school" value="${esc(form.school)}"></div>
      <div><div class="small">CCT</div><input id="set-cct" value="${esc(form.cct||'')}"></div>
      <div><div class="small">Nombre del maestro</div><input id="set-teacher" value="${esc(form.teacher)}"></div>
      <div><div class="small">Director(a)</div><input id="set-director" value="${esc(form.director||'')}"></div>
      <div><div class="small">Zona escolar</div><input id="set-zone" value="${esc(form.zone||'')}"></div>
      <div><div class="small">Jefatura / Sector</div><input id="set-sector" value="${esc(form.sector||'')}"></div>
      <div><div class="small">Municipio</div><input id="set-municipality" value="${esc(form.municipality||'')}"></div>
      <div><div class="small">Domicilio escolar</div><input id="set-address" value="${esc(form.address||'')}"></div>
      <div><div class="small">Ciclo escolar</div><input id="set-cycle" value="${esc(form.cycle||'')}"></div>
      <div><div class="small">Nivel educativo</div><select id="set-level">${Object.keys(GRADES_BY_LEVEL).map(l=>`<option ${l===form.level?'selected':''}>${l}</option>`).join('')}</select></div>
      <div><div class="small">Grado</div><select id="set-grade"></select></div>
      <div><div class="small">Turno</div><select id="set-shift"><option ${form.shift==='Matutino'?'selected':''}>Matutino</option><option ${form.shift==='Vespertino'?'selected':''}>Vespertino</option></select></div>
      <div><div class="small">Grupo / Sección</div><select id="set-section"></select></div>
      <div><div class="small">Grupo generado</div><input id="set-group" readonly></div>
      <div><div class="small">Logo</div><input id="set-logo" type="file" accept="image/*"></div>
      <div id="set-logo-wrap">${form.logo?`<img src="${form.logo}" style="width:86px;height:86px;object-fit:contain;border-radius:18px">`:''}</div>
      <button class="btn primary" id="save-settings-btn">Guardar cambios</button>
    </div>
  </div>
  <div class="card">
    <div class="section-title">&#128274; Cambiar PIN</div>
    <div class="row">
      <div><div class="small">PIN actual</div><input id="set-pin-actual" type="password" inputmode="numeric" maxlength="4" placeholder="...."></div>
      <div class="row row2">
        <div><div class="small">PIN nuevo</div><input id="set-pin-nuevo" type="password" inputmode="numeric" maxlength="4" placeholder="...."></div>
        <div><div class="small">Confirmar</div><input id="set-pin-confirm" type="password" inputmode="numeric" maxlength="4" placeholder="...."></div>
      </div>
      <button class="btn secondary" id="change-pin-btn">Actualizar PIN</button>
    </div>
  </div>
  <div class="card">
    <div class="section-title">🔐 Licencia ProfeQr</div>
    <div class="help">Estado: <b>${esc(licenseStatusLabel())}</b>. La licencia se vincula a esta instalación, al CCT y al ciclo escolar.</div>
    <div class="row row2" style="margin-top:10px">
      <div><div class="small">ID de instalación</div><input id="license-installation-id" value="${esc(getInstallationId())}" readonly></div>
      <div><div class="small">CCT / ciclo</div><input value="${esc((db.config.cct||'')+' · '+(db.config.cycle||''))}" readonly></div>
    </div>
    <div class="small" style="margin-top:10px">Código de licencia firmado</div>
    <textarea id="license-token" placeholder="PQ1..." style="min-height:110px"></textarea>
    <div class="row row2" style="margin-top:10px"><button class="btn primary" id="activate-license-btn">Activar licencia</button><button class="btn secondary" id="copy-installation-id-btn">Copiar ID de instalación</button></div>
  </div>
  <div class="card">
    <div class="section-title">Paleta de colores</div>
    <div class="theme-grid">
      ${Object.entries(THEMES).map(([key,t])=>`
        <div class="theme-card ${form.theme===key?'active':''}" data-theme="${key}">
          <div class="theme-preview">
            <div class="theme-dot" style="background:${t.primary}"></div>
            <div class="theme-dot" style="background:${t.primary2}"></div>
            <div class="theme-dot" style="background:${t.primary3}"></div>
            <div class="theme-dot" style="background:${t.bg2}"></div>
          </div>
          <div class="item-title" style="font-size:14px">${t.name}</div>
        </div>`).join('')}
    </div>
  </div>
  <div class="card">
    <div class="section-title">Respaldo JSON</div>
    <div class="help">El respaldo JSON guarda una copia completa de la información de la app para restaurarla después en este u otro dispositivo.</div>
    <div class="row row2" style="margin-top:10px">
      <button class="btn secondary" id="export-json-btn">Exportar respaldo JSON</button>
      <label class="btn primary" style="display:grid;place-items:center">
        <input style="display:none" type="file" id="import-json-input" accept=".json,application/json">
        Importar respaldo JSON
      </label>
    </div>
  </div>`;
}
function bindSettings(){
  const levelEl = document.getElementById('set-level');
  const gradeEl = document.getElementById('set-grade');
  const shiftEl = document.getElementById('set-shift');
  const sectionEl = document.getElementById('set-section');
  const groupEl = document.getElementById('set-group');
  let logoData = db.config.logo || '';

  function refreshGrades(){
    const grades = GRADES_BY_LEVEL[levelEl.value];
    gradeEl.innerHTML = grades.map(g=>`<option ${g===db.config.grade?'selected':''}>${g}</option>`).join('');
    if(!grades.includes(gradeEl.value)) gradeEl.value = grades[0];
    refreshGroup();
  }
  function refreshSections(){
    const sections = SECTIONS_BY_SHIFT[shiftEl.value];
    sectionEl.innerHTML = sections.map(s=>`<option ${s===db.config.section?'selected':''}>${s}</option>`).join('');
    if(!sections.includes(sectionEl.value)) sectionEl.value = sections[0];
    refreshGroup();
  }
  function refreshGroup(){ groupEl.value = `${gradeEl.value}${sectionEl.value}`; }

  levelEl.onchange = refreshGrades;
  shiftEl.onchange = refreshSections;
  gradeEl.onchange = refreshGroup;
  sectionEl.onchange = refreshGroup;
  refreshGrades();
  refreshSections();

  document.getElementById('set-logo').onchange = e => {
    const file = e.target.files[0];
    if(!file) return;
    const r = new FileReader();
    r.onload = ()=>{ logoData = r.result; document.getElementById('set-logo-wrap').innerHTML = `<img src="${logoData}" style="width:86px;height:86px;object-fit:contain;border-radius:18px">`; };
    r.readAsDataURL(file);
  };

  document.getElementById('change-pin-btn')?.addEventListener('click',async ()=>{
    const actual=document.getElementById('set-pin-actual').value;
    const nuevo=document.getElementById('set-pin-nuevo').value;
    const conf=document.getElementById('set-pin-confirm').value;
    if(!(await verifyPinCredential(actual))){ toast('PIN actual incorrecto'); return; }
    if(!/^\d{4}$/.test(nuevo)){ toast('Nuevo PIN debe ser 4 digitos'); return; }
    if(nuevo!==conf){ toast('PINes no coinciden'); return; }
    try{ await setPinCredential(nuevo); }catch(e){ toast('No se pudo proteger el PIN'); return; }
    if(!saveDb()) return; toast('PIN actualizado');
    ['set-pin-actual','set-pin-nuevo','set-pin-confirm'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  });
    document.getElementById('copy-installation-id-btn')?.addEventListener('click',async()=>{
    try{ await navigator.clipboard.writeText(getInstallationId()); toast('ID de instalación copiado'); }catch(e){ toast('No se pudo copiar; selecciónalo manualmente'); }
  });
  document.getElementById('activate-license-btn')?.addEventListener('click',async()=>{
    const token=document.getElementById('license-token')?.value.trim()||'';
    if(!token){ toast('Pega el código de licencia'); return; }
    const btn=document.getElementById('activate-license-btn'); if(btn) btn.disabled=true;
    const result=await activateLicenseToken(token);
    if(btn) btn.disabled=false;
    if(!result.valid){ toast(result.message||'Licencia inválida'); return; }
    toast('Licencia activada correctamente');
    renderApp();
  });

  document.querySelectorAll('[data-theme]').forEach(btn=>btn.onclick = ()=>{
    db.config.theme = btn.dataset.theme;
    if(!saveDb()) return;
    applyTheme(db.config.theme);
    document.querySelectorAll('[data-theme]').forEach(x=>x.classList.remove('active'));
    btn.classList.add('active');
  });

  document.getElementById('save-settings-btn').onclick = () => {
    const newGroup = groupEl.value;
    const newCct = document.getElementById('set-cct').value.trim();
    const qrWillChange = db.config.group !== newGroup || (db.config.cct || '') !== newCct;
    if(qrWillChange){
      const ok = confirm('Cambiar el grupo o el CCT regenerará los QR de todos los alumnos. Las tarjetas impresas dejarán de funcionar. ¿Deseas continuar?');
      if(!ok) return;
    }
    db.config.school = document.getElementById('set-school').value.trim();
    db.config.cct = newCct;
    db.config.teacher = document.getElementById('set-teacher').value.trim();
    db.config.director = document.getElementById('set-director').value.trim();
    db.config.zone = document.getElementById('set-zone').value.trim();
    db.config.sector = document.getElementById('set-sector').value.trim();
    db.config.municipality = document.getElementById('set-municipality').value.trim();
    db.config.address = document.getElementById('set-address').value.trim();
    db.config.cycle = document.getElementById('set-cycle').value.trim();
    db.config.level = levelEl.value;
    db.config.grade = gradeEl.value;
    db.config.shift = shiftEl.value;
    db.config.section = sectionEl.value;
    db.config.group = newGroup;
    db.config.logo = logoData;
    db.group.name = db.config.group;
    db.group.level = db.config.level;
    db.group.grade = db.config.grade;
    db.group.shift = db.config.shift;
    db.group.section = db.config.section;
    db.group.students = db.group.students.map(s=>({...s, qr:qrCodeFor(db.config.group, s.listNo)}));
    const identityBootstrap=canEditUnlicensedIdentity();
    if(!saveDb({system:identityBootstrap})) return;
    refreshLicenseRuntime().then(()=>{ toast('Ajustes guardados'); renderApp(); });
  };

  document.getElementById('export-json-btn').onclick = ()=>{
    const blob = new Blob([JSON.stringify(sanitizedBackupDb(),null,2)],{type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `respaldo_profeqr_${today()}.json`;
    a.click();
    toast('Respaldo exportado');
  };

  const importInput = document.getElementById('import-json-input');
  importInput.onchange = e => {
    const file = e.target.files[0];
    if(!file) return;
    const ok = confirm('⚠️ Esto reemplazará TODOS los datos actuales con el respaldo. Esta acción no se puede deshacer. ¿Continuar?');
    if(!ok){ importInput.value = ''; return; }
    const r = new FileReader();
    r.onload = async ()=> {
      try{
        if(!canWrite()) return writeBlockedMessage();
        db = safeDb(JSON.parse(r.result));
        try{ await migrateLegacyPinSecurity(); }catch(e){ console.error('PIN import migration error:',e); }
        if(!saveDb()) return;
        toast('Respaldo importado');
        renderApp();
      }catch(err){
        console.error(err);
        toast('JSON inválido o corrupto');
      }
    };
    r.readAsText(file);
  };
}



