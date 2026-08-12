from pathlib import Path

def replace(path, old, new, label):
    p=Path(path); s=p.read_text(encoding='utf-8')
    if old not in s: raise SystemExit(f'{label}: target not found')
    p.write_text(s.replace(old,new,1),encoding='utf-8')

# index: load license module after security
replace('index.html', '<script src="./js/security.js"></script>\n<script src="./js/shell.js"></script>', '<script src="./js/security.js"></script>\n<script src="./js/license.js"></script>\n<script src="./js/shell.js"></script>', 'index license module')

# bootstrap: grandfather existing installs, then validate signed/legacy state before rendering
replace('js/bootstrap.js', "  try{ await migrateLegacyPinSecurity(); }catch(e){ console.error('PIN migration error:',e); }\n  initApp();", "  try{ await migrateLegacyPinSecurity(); }catch(e){ console.error('PIN migration error:',e); }\n  try{ await migrateCore6Licensing(); }catch(e){ console.error('License migration error:',e); }\n  try{ await refreshLicenseRuntime(); }catch(e){ console.error('License validation error:',e); licenseRuntime={checked:true,valid:false,mode:'none',reason:'error',payload:null,message:'No se pudo validar la licencia.'}; }\n  initApp();", 'bootstrap license')

# remove Core 5 provisional license helpers; license.js now owns them
replace('js/core.js', "function licenseExpiryDate(){ return db?.config?.license?.expiresAt || LICENSE_END; }\nfunction isExpired(){ return !!db?.config && today() > licenseExpiryDate(); }\nfunction canWrite(){ return !db?.config || !isExpired(); }\nfunction writeBlockedMessage(){ toast(`Licencia vencida (${licenseExpiryDate()}). Puedes consultar y exportar, pero no modificar datos.`); }", "// RC Core 6: licenseExpiryDate(), isExpired(), canWrite() y writeBlockedMessage() viven en license.js.", 'core provisional license')

# fresh installs are not grandfathered; setup is a system write, then refresh license state and send user to activation
replace('js/shell.js', "      theme: 'professional'\n    };", "      theme: 'professional',\n      licenseLegacyGrandfathered: false\n    };", 'setup license flag')
replace('js/shell.js', "    if(!saveDb()) return;\n    currentScreen = 'home'; // FIX v4\n    renderApp();", "    if(!saveDb({system:true})) return;\n    await refreshLicenseRuntime();\n    currentScreen = canWrite() ? 'home' : 'settings';\n    renderApp();", 'setup system save')

# settings: activation card
anchor = "  <div class=\"card\">\n    <div class=\"section-title\">Paleta de colores</div>"
card = """  <div class=\"card\">\n    <div class=\"section-title\">🔐 Licencia ProfeQr</div>\n    <div class=\"help\">Estado: <b>${esc(licenseStatusLabel())}</b>. La licencia se vincula a esta instalación, al CCT y al ciclo escolar.</div>\n    <div class=\"row row2\" style=\"margin-top:10px\">\n      <div><div class=\"small\">ID de instalación</div><input id=\"license-installation-id\" value=\"${esc(getInstallationId())}\" readonly></div>\n      <div><div class=\"small\">CCT / ciclo</div><input value=\"${esc((db.config.cct||'')+' · '+(db.config.cycle||''))}\" readonly></div>\n    </div>\n    <div class=\"small\" style=\"margin-top:10px\">Código de licencia firmado</div>\n    <textarea id=\"license-token\" placeholder=\"PQ1...\" style=\"min-height:110px\"></textarea>\n    <div class=\"row row2\" style=\"margin-top:10px\"><button class=\"btn primary\" id=\"activate-license-btn\">Activar licencia</button><button class=\"btn secondary\" id=\"copy-installation-id-btn\">Copiar ID de instalación</button></div>\n  </div>\n""" + anchor
replace('js/settings.js', anchor, card, 'settings license card')

bind_anchor = "  document.querySelectorAll('[data-theme]').forEach(btn=>btn.onclick = ()=>{"
bind = """  document.getElementById('copy-installation-id-btn')?.addEventListener('click',async()=>{\n    try{ await navigator.clipboard.writeText(getInstallationId()); toast('ID de instalación copiado'); }catch(e){ toast('No se pudo copiar; selecciónalo manualmente'); }\n  });\n  document.getElementById('activate-license-btn')?.addEventListener('click',async()=>{\n    const token=document.getElementById('license-token')?.value.trim()||'';\n    if(!token){ toast('Pega el código de licencia'); return; }\n    const btn=document.getElementById('activate-license-btn'); if(btn) btn.disabled=true;\n    const result=await activateLicenseToken(token);\n    if(btn) btn.disabled=false;\n    if(!result.valid){ toast(result.message||'Licencia inválida'); return; }\n    toast('Licencia activada correctamente');\n    renderApp();\n  });\n\n""" + bind_anchor
replace('js/settings.js', bind_anchor, bind, 'settings license binding')

# settings identity changes are allowed even when activation is missing, since token validation depends on CCT/cycle
replace('js/settings.js', "    if(!saveDb()) return;\n    toast('Ajustes guardados');\n    renderApp();", "    if(!saveDb({system:true})) return;\n    refreshLicenseRuntime().then(()=>{ toast('Ajustes guardados'); renderApp(); });", 'settings system identity save')

# banner should use dynamic license status instead of hard-coded expiry copy
replace('js/profiles.js', "    html += `<div class=\"expired-banner\">La licencia de este ciclo venció el 30 de julio de 2027. Puedes consultar y exportar información, pero ya no capturar nuevos datos.</div>`;", "    html += `<div class=\"expired-banner\">${esc(licenseRuntime?.message || 'Activación requerida. Puedes consultar y exportar, pero no modificar datos.')}</div>`;", 'dynamic license banner')

# service worker
p=Path('sw.js'); s=p.read_text(encoding='utf-8')
s=s.replace("const CACHE_VERSION = 'profeqr-v8-7-rc-core-4-5';", "const CACHE_VERSION = 'profeqr-v8-7-rc-core-6';")
if '"./js/license.js"' not in s:
    s=s.replace('"./js/security.js",', '"./js/security.js",\n  "./js/license.js",')
p.write_text(s,encoding='utf-8')

print('Core 6 integration applied')
