// ── PIN ──
function initApp(){
  if(!db.config){ document.getElementById('root').innerHTML=renderSetup(); bindSetup(); return; }
  if(hasPinCredential()){ showPinScreen(); } else { applyTheme(db.config.theme||'professional'); renderApp(); }
}
function showPinScreen(){
  pinBuffer=''; pinFailCount=pinSecurityState().failCount; applyTheme(db.config.theme||'professional');
  const hasDraft=wizDraftExists();
  document.getElementById('root').innerHTML=`
  <div class="pin-wrap">
    <img class="pin-logo" src="${db.config.logo||'./icons/icon-192.png'}" alt="logo"/>
    <div class="pin-title">ProfeQr</div>
    <div class="pin-sub">${esc(db.config.teacher||'')} &middot; ${esc(db.config.school||'')}</div>
    ${hasDraft?'<div class="pin-draft">\u{1F4DD} Tienes un reporte en progreso. Al entrar continuarás donde lo dejaste.</div>':''}
    <div class="pin-dots">
      <div class="pin-dot" id="pd0"></div><div class="pin-dot" id="pd1"></div>
      <div class="pin-dot" id="pd2"></div><div class="pin-dot" id="pd3"></div>
    </div>
    <div class="pin-error" id="pin-err"></div>
    <div class="pin-pad">
      ${[1,2,3,4,5,6,7,8,9].map(k=>`<button class="pin-btn" onclick="pinKey(${k})">${k}</button>`).join('')}
      <button class="pin-btn" style="opacity:0;pointer-events:none"></button>
      <button class="pin-btn" onclick="pinKey(0)">0</button>
      <button class="pin-btn" onclick="pinDel()">&#9003;</button>
    </div>
  </div>`;
}
function pinKey(k){
  if(pinBuffer.length>=4) return;
  const remain=pinLockRemainingMs();
  if(remain>0){ const e=document.getElementById('pin-err'); if(e) e.textContent=`Acceso bloqueado. Intenta en ${Math.ceil(remain/60000)} min.`; return; }
  pinBuffer+=String(k); updatePinDots(); if(pinBuffer.length===4) setTimeout(()=>checkPin(),160);
}
function pinDel(){ if(pinBuffer.length>0){ pinBuffer=pinBuffer.slice(0,-1); updatePinDots(); } }
function updatePinDots(){ for(let i=0;i<4;i++){ const el=document.getElementById('pd'+i); if(el) el.classList.toggle('filled',i<pinBuffer.length); } }
async function checkPin(){
  const remain=pinLockRemainingMs();
  if(remain>0){ const e=document.getElementById('pin-err'); if(e) e.textContent=`Acceso bloqueado. Intenta en ${Math.ceil(remain/60000)} min.`; pinBuffer=''; updatePinDots(); return; }
  let ok=false;
  try{ ok=await verifyPinCredential(pinBuffer); }catch(err){ console.error(err); }
  if(ok){
    pinBuffer=''; pinFailCount=0; clearPinFailures();
    if(wizDraftLoad()){ currentScreen='bitacoraForm'; } else { currentScreen='home'; }
    renderApp();
  } else {
    const state=recordPinFailure(); pinFailCount=state.failCount; const e=document.getElementById('pin-err');
    if(e) e.textContent=state.lockedUntil>Date.now()?'Demasiados intentos. Acceso bloqueado 5 minutos.':'PIN incorrecto. Intentos: '+state.failCount+'/5';
    pinBuffer=''; updatePinDots();
  }
}
function renderHeader(title, subtitle, home=false){
  const logo = db.config?.logo || './icons/icon-192.png';
  return `
  <div class="header">
    <div class="header-row">
      <div style="display:flex;align-items:center;gap:10px">
        ${home ? '' : '<button class="icon-btn" id="back-btn">←</button>'}
        <div class="brand">
          <img src="${logo}" alt="logo"/>
          <div>
            <div class="name">${esc(title)}</div>
            <div class="sub">${esc(subtitle || '')}</div>
          </div>
        </div>
      </div>
      <button class="icon-btn" id="menu-btn">☰</button>
    </div>
  </div>`;
}

function navBtn(id,label){ const active=currentScreen===id||(id==='bitacora'&&(currentScreen==='bitacoraForm'||currentScreen==='bitacoraPreview'))||(id==='students'&&currentScreen==='studentProfile'); return `<button data-nav="${id}" class="${active?'active':''}">${label}</button>`; }

function renderSetup(){
  return `
  <div class="app">
    ${renderHeader('ProfeQr','Configuración inicial',true)}
    <div class="container">
      <div class="card">
        <div class="section-title">Registro inicial</div>
        <div style="display:flex;justify-content:center;margin-bottom:12px">
          <img id="setup-logo-preview" src="./icons/icon-192.png" style="width:86px;height:86px;border-radius:22px;object-fit:contain;background:#fff"/>
        </div>
        <div class="row">
          <div><div class="small">Escuela</div><input id="setup-school" value="Telesecundaria Federal No. 20"></div>
          <div><div class="small">CCT</div><input id="setup-cct" value="11DTV0020P"></div>
          <div><div class="small">Nombre del maestro</div><input id="setup-teacher"></div>
          <div><div class="small">Director(a)</div><input id="setup-director"></div>
          <div><div class="small">Zona escolar</div><input id="setup-zone"></div>
          <div><div class="small">Jefatura / Sector</div><input id="setup-sector"></div>
          <div><div class="small">Municipio</div><input id="setup-municipality" value="León, Guanajuato"></div>
          <div><div class="small">Domicilio escolar</div><input id="setup-address"></div>
          <div><div class="small">Ciclo escolar</div><input id="setup-cycle" placeholder="2026-2027"></div>
          <div><div class="small">Nivel educativo</div><select id="setup-level"><option>Preescolar</option><option>Primaria</option><option selected>Telesecundaria</option></select></div>
          <div><div class="small">Grado</div><select id="setup-grade"></select></div>
          <div><div class="small">Turno</div><select id="setup-shift"><option>Matutino</option><option selected>Vespertino</option></select></div>
          <div><div class="small">Grupo / Sección</div><select id="setup-section"></select></div>
          <div><div class="small">Grupo generado</div><input id="setup-group" readonly></div>
          <div><div class="small">Logo de la escuela</div><input id="setup-logo" type="file" accept="image/*"></div>
          <div><div class="small">PIN de acceso (4 digitos) *</div><div class="help">Candado de pantalla. No compartir datos sensibles por este medio.</div><input id="setup-pin" type="password" inputmode="numeric" maxlength="4" placeholder="...."></div>
          <div><div class="small">Confirmar PIN *</div><input id="setup-pin2" type="password" inputmode="numeric" maxlength="4" placeholder="...."></div>
          <button class="btn primary" id="setup-save">Guardar y entrar</button>
        </div>
      </div>
    </div>
  </div>`;
}

function bindSetup(){
  const levelEl = document.getElementById('setup-level');
  const gradeEl = document.getElementById('setup-grade');
  const shiftEl = document.getElementById('setup-shift');
  const sectionEl = document.getElementById('setup-section');
  const groupEl = document.getElementById('setup-group');
  const logoInput = document.getElementById('setup-logo');
  const logoPreview = document.getElementById('setup-logo-preview');
  let logoData = '';

  function refreshGrades(){
    const grades = GRADES_BY_LEVEL[levelEl.value];
    gradeEl.innerHTML = grades.map((g,i)=>`<option ${i===0?'selected':''}>${g}</option>`).join('');
    refreshGroup();
  }
  function refreshSections(){
    const sections = SECTIONS_BY_SHIFT[shiftEl.value];
    sectionEl.innerHTML = sections.map((s,i)=>`<option ${i===0?'selected':''}>${s}</option>`).join('');
    refreshGroup();
  }
  function refreshGroup(){ groupEl.value = `${gradeEl.value}${sectionEl.value}`; }

  levelEl.onchange = refreshGrades;
  shiftEl.onchange = refreshSections;
  gradeEl.onchange = refreshGroup;
  sectionEl.onchange = refreshGroup;
  logoInput.onchange = e => {
    const file = e.target.files[0];
    if(!file) return;
    const r = new FileReader();
    r.onload = ()=>{ logoData = r.result; logoPreview.src = logoData; };
    r.readAsDataURL(file);
  };

  refreshGrades();
  refreshSections();
  refreshGroup();

  document.getElementById('setup-save').onclick = async () => {
    const teacher = document.getElementById('setup-teacher').value.trim();
    const school = document.getElementById('setup-school').value.trim();
    const cct = document.getElementById('setup-cct').value.trim();
    if(!teacher || !school){ toast('Captura docente y escuela'); return; }
    const pin = document.getElementById('setup-pin')?.value||'';
    const pin2 = document.getElementById('setup-pin2')?.value||'';
    if(!/^\d{4}$/.test(pin)){ toast('El PIN debe ser exactamente 4 digitos numericos'); return; }
    if(pin!==pin2){ toast('Los PINes no coinciden'); return; }

    db.config = {
      teacher, school, cct,
      director: document.getElementById('setup-director').value.trim(),
      zone: document.getElementById('setup-zone').value.trim(),
      sector: document.getElementById('setup-sector').value.trim(),
      municipality: document.getElementById('setup-municipality').value.trim(),
      address: document.getElementById('setup-address').value.trim(),
      cycle: document.getElementById('setup-cycle').value.trim(),
      level: levelEl.value,
      grade: gradeEl.value,
      shift: shiftEl.value,
      section: sectionEl.value,
      group: groupEl.value,
      logo: logoData,
      theme: 'professional',
      licenseLegacyGrandfathered: false
    };
    try{ await setPinCredential(pin); }catch(e){ console.error(e); toast('No se pudo proteger el PIN en este dispositivo'); return; }
    db.group.name = db.config.group;
    db.group.level = db.config.level;
    db.group.grade = db.config.grade;
    db.group.shift = db.config.shift;
    db.group.section = db.config.section;
    if(!saveDb({system:true})) return;
    await refreshLicenseRuntime();
    currentScreen = canWrite() ? 'home' : 'settings';
    renderApp();
  };
}

function renderShell(){
  const subtitle = currentScreen==='home'
    ? 'Centro de mando docente'
    : `${db.config.school} · ${db.config.teacher}`;
  return `
  <div class="app">
    ${renderHeader('ProfeQr', subtitle, currentScreen==='home'||currentScreen==='attendance')}
    <div id="drawer-bg" class="drawer-bg hidden"></div>
    <div id="drawer" class="drawer hidden">
      <h3>ProfeQr</h3>
      ${navBtn('home','🏠 Inicio')}
      <div class="drawer-sep"></div>
      <div class="drawer-group">Registro diario</div>
      ${navBtn('attendance','📷 Asistencia')}
      ${navBtn('works','📝 Trabajos')}
      <div class="drawer-sep"></div>
      <div class="drawer-group">Gestión docente</div>
      ${navBtn('agenda','📅 Agenda')}
      ${navBtn('cte','✅ Acuerdos CTE')}
      ${navBtn('guardias','🛡️ Guardias')}
      <div class="drawer-sep"></div>
      <div class="drawer-group">Recursos</div>
      ${navBtn('biblioteca','📚 Biblioteca')}
      ${navBtn('bitacora','📋 Bitácora')}
      <div class="drawer-sep"></div>
      <div class="drawer-group">Grupo</div>
      ${navBtn('students','👥 Alumnos')}
      ${navBtn('cards','🪪 Tarjetas QR')}
      ${navBtn('reports','📊 Reportes')}
      ${navBtn('settings','⚙️ Ajustes')}
    </div>
    <div class="container" id="screen-host"></div>
    <div class="install-banner hidden" id="install-banner">
      <h4 style="margin:0 0 4px;font-size:16px">Instalar ProfeQr</h4>
      <p style="margin:0;font-size:13px;opacity:.92">Agrega esta app a tu pantalla de inicio y úsala como una app real.</p>
      <div class="install-actions">
        <button class="btn secondary" id="install-later">Ahora no</button>
        <button class="btn primary" id="install-now">Instalar</button>
      </div>
    </div>
  </div>`;
}

function bindGlobal(){
  const back = document.getElementById('back-btn');
  if(back) back.onclick = async () => {
    // FIX v4: navegación contextual según pantalla activa
    if(currentScreen === 'bitacoraForm' || currentScreen === 'bitacoraPreview'){
      if(confirm('¿Salir del reporte? El borrador se guardará automáticamente.')){
        wizDraftSave(); // FIX: borrador local, no guardar a DB
        currentScreen = 'bitacora';
        renderApp();
      }
    } else if(currentScreen === 'studentProfile'){
      currentScreen = 'students';
      renderApp();
    } else if(currentScreen === 'docViewer'){
      currentScreen = 'biblioteca';
      renderApp();
    } else {
      await stopDynamicModules();
      currentScreen = 'home'; // FIX v4: volver a home
      renderApp();
    }
  };

  document.getElementById('menu-btn').onclick = () => {
    document.getElementById('drawer-bg').classList.toggle('hidden');
    document.getElementById('drawer').classList.toggle('hidden');
  };
  document.getElementById('drawer-bg').onclick = closeDrawer;

  document.querySelectorAll('[data-nav]').forEach(btn => btn.onclick = async () => {
    await stopDynamicModules();
    currentScreen = btn.dataset.nav;
    closeDrawer();
    renderCurrentScreen();
  });

  const installBanner = document.getElementById('install-banner');
  if(deferredPrompt && installBanner) installBanner.classList.remove('hidden');
  const installNow = document.getElementById('install-now');
  const installLater = document.getElementById('install-later');
  if(installNow) installNow.onclick = async () => {
    if(!deferredPrompt) return;
    deferredPrompt.prompt();
    try{ await deferredPrompt.userChoice; }catch(e){}
    installBanner.classList.add('hidden');
    deferredPrompt = null;
  };
  if(installLater) installLater.onclick = () => installBanner.classList.add('hidden');
}

function closeDrawer(){
  document.getElementById('drawer-bg')?.classList.add('hidden');
  document.getElementById('drawer')?.classList.add('hidden');
}

function renderApp(){
  applyTheme(db.config?.theme || 'professional');
  const root = document.getElementById('root');
  if(!db.config){
    root.innerHTML = renderSetup();
    bindSetup();
    return;
  }
  root.innerHTML = renderShell();
  bindGlobal();
  renderCurrentScreen();
}


