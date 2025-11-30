// TS20 Asistencia & QR V3.2 (rango de fechas y resumen por alumno)
document.addEventListener("DOMContentLoaded", function () {
  // ====== CLAVES DE STORAGE ======
  const CFG_KEY = "ts20_config";
  const LS_ALUMNOS = "ts20_alumnos";
  const LS_ASIS = "ts20_asistencias";
  const LS_TRAB = "ts20_trabajos";

  // ====== ESTADO ======
  let config = null;
  let alumnos = [];
  let asistencias = {}; // { "fecha|grupo": [ {idAlumno,estado,hora} ] }
  let trabajos = {};    // { "fecha|grupo": [ {idAlumno,estado,hora} ] }

  let qrAsis = null;
  let qrTrab = null;

  // ====== UTILS ======
  function hoyISO() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dia}`;
  }

  function loadJSON(key, def) {
    try {
      const d = localStorage.getItem(key);
      if (!d) return def;
      return JSON.parse(d);
    } catch {
      return def;
    }
  }

  function saveJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function claveRegistro(fecha, grupo) {
    return `${fecha}|${grupo}`;
  }

  function compararFechasISO(a, b) {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  }

  function buscarAlumnoPorId(id) {
    return alumnos.find((a) => a.id === id) || null;
  }

  // ====== CARGA INICIAL ======
  function cargarEstado() {
    config = loadJSON(CFG_KEY, null);
    alumnos = loadJSON(LS_ALUMNOS, []);
    asistencias = loadJSON(LS_ASIS, {});
    trabajos = loadJSON(LS_TRAB, {});
  }

  function guardarConfigNueva(escuela, docente, gruposStr) {
    const grupos = gruposStr
      .split(",")
      .map((g) => g.trim())
      .filter((g) => g.length > 0);

    config = { escuela, docente, grupos };
    saveJSON(CFG_KEY, config);
  }

  // ====== UI CONFIG / HEADER ======
  const overlay = document.getElementById("configOverlay");
  const inpCfgEscuela = document.getElementById("cfgEscuela");
  const inpCfgDocente = document.getElementById("cfgDocente");
  const inpCfgGrupos = document.getElementById("cfgGrupos");
  const btnConfigGuardar = document.getElementById("btnConfigGuardar");

  const tituloEscuela = document.getElementById("tituloEscuela");
  const subtituloEscuela = document.getElementById("subtituloEscuela");
  const subinfoSistema = document.getElementById("subinfoSistema");
  const avatarIniciales = document.getElementById("avatarIniciales");

  const fechaAsis = document.getElementById("fechaAsis");
  const fechaTrab = document.getElementById("fechaTrab");
  const fechaAsisIni = document.getElementById("fechaAsisIni");
  const fechaAsisFin = document.getElementById("fechaAsisFin");
  const fechaResIni = document.getElementById("fechaResIni");
  const fechaResFin = document.getElementById("fechaResFin");

  function inicialesNombre(nombre) {
    if (!nombre) return "TS";
    const partes = nombre.trim().split(/\s+/);
    const ini =
      partes[0].charAt(0).toUpperCase() +
      (partes[1] ? partes[1].charAt(0).toUpperCase() : "");
    return ini || "TS";
  }

  function aplicarConfigAUI() {
    const hoy = hoyISO();
    if (fechaAsis) fechaAsis.value = hoy;
    if (fechaTrab) fechaTrab.value = hoy;
    if (fechaAsisIni) fechaAsisIni.value = hoy;
    if (fechaAsisFin) fechaAsisFin.value = hoy;
    if (fechaResIni) fechaResIni.value = hoy;
    if (fechaResFin) fechaResFin.value = hoy;

    if (!config) {
      overlay.style.display = "flex";
      return;
    }

    overlay.style.display = "none";
    tituloEscuela.textContent = config.escuela || "TS20 Asistencia & QR";
    subtituloEscuela.textContent = `Docente: ${
      config.docente || "no configurado"
    }`;
    subinfoSistema.textContent =
      "Zona 01 · Sistema local con QR, trabajos y reportes";
    avatarIniciales.textContent = inicialesNombre(config.docente);

    inpCfgEscuela.value = config.escuela || "";
    inpCfgDocente.value = config.docente || "";
    inpCfgGrupos.value = (config.grupos || []).join(", ");
  }

  btnConfigGuardar.addEventListener("click", () => {
    const e = inpCfgEscuela.value.trim() || "TS20 Asistencia & QR";
    const d = inpCfgDocente.value.trim() || "Docente";
    const g = inpCfgGrupos.value.trim() || "";
    guardarConfigNueva(e, d, g);
    aplicarConfigAUI();
    poblarSelectsGrupos();
  });

  // ====== DASHBOARD ======
  const dashDiaNumero = document.getElementById("dashDiaNumero");
  const dashDiaNombre = document.getElementById("dashDiaNombre");
  const dashSubtitulo = document.getElementById("dashSubtitulo");
  const dashResumen = document.getElementById("dashResumen");

  function actualizarDashboard() {
    const hoy = hoyISO();
    const d = new Date(hoy);
    dashDiaNumero.textContent = String(d.getDate());
    dashDiaNombre.textContent = d.toLocaleDateString("es-MX", {
      weekday: "long",
    });

    dashSubtitulo.textContent = "Sistema local con QR";

    const grupo = document.getElementById("selGrupoAsis").value || "sin seleccionar";

    const claveAsis = claveRegistro(hoy, grupo);
    const listaAsis = asistencias[claveAsis] || [];
    const presentes = listaAsis.filter((r) => r.estado === "PRESENTE").length;

    const claveTrab = claveRegistro(hoy, grupo);
    const listaTrab = trabajos[claveTrab] || [];
    const entregados = listaTrab.filter((r) => r.estado === "ENTREGADO").length;

    dashResumen.textContent = `Grupo actual: ${grupo || "sin seleccionar"} · ${
      presentes || 0
    } presentes · ${entregados || 0} trabajos entregados`;
  }

  // ====== TABS Y NAV INFERIOR ======
  const secciones = {
    listas: document.getElementById("tab-listas"),
    qr: document.getElementById("tab-qr"),
    asis: document.getElementById("tab-asis"),
    trab: document.getElementById("tab-trab"),
  };

  const tabButtons = document.querySelectorAll(".tab-btn");
  const bottomButtons = document.querySelectorAll(".bottom-btn");
  const indicatorBar = document.getElementById("tabsIndicatorBar");
  const ordenTabs = ["listas", "qr", "asis", "trab"];

  function setActiveTab(tab) {
    Object.entries(secciones).forEach(([k, el]) => {
      el.classList.toggle("tab-activa", k === tab);
    });

    tabButtons.forEach((btn) => {
      const t = btn.dataset.tab;
      btn.classList.toggle("activo", t === tab);
    });

    const pos = ordenTabs.indexOf(tab);
    if (pos >= 0) {
      indicatorBar.style.transform = `translateX(${pos * 100}%)`;
    }

    bottomButtons.forEach((btn) => {
      const t = btn.dataset.tab;
      if (t === "home") {
        btn.classList.toggle("activo", tab === "listas");
      } else {
        btn.classList.toggle("activo", t === tab);
      }
    });

    actualizarDashboard();
  }

  tabButtons.forEach((btn) =>
    btn.addEventListener("click", () => setActiveTab(btn.dataset.tab))
  );

  bottomButtons.forEach((btn) =>
    btn.addEventListener("click", () => {
      const t = btn.dataset.tab;
      if (t === "home") setActiveTab("listas");
      else setActiveTab(t);
    })
  );

  document
    .getElementById("btnIrAsistencia")
    .addEventListener("click", () => setActiveTab("asis"));
  document
    .getElementById("btnIrTrabajos")
    .addEventListener("click", () => setActiveTab("trab"));
  document
    .getElementById("btnIrListas")
    .addEventListener("click", () => setActiveTab("listas"));

  // ====== ALUMNOS ======
  const fileLista = document.getElementById("fileLista");
  const txtLista = document.getElementById("txtLista");
  const btnImportarAlumnos = document.getElementById("btnImportarAlumnos");
  const btnVerAlumnos = document.getElementById("btnVerAlumnos");
  const btnBorrarAlumnos = document.getElementById("btnBorrarAlumnos");
  const msgListas = document.getElementById("msgListas");
  const panelAlumnos = document.getElementById("panelAlumnos");
  const tbodyAlumnos = document.getElementById("tbodyAlumnos");

  function mostrarMensaje(el, texto, esError = false) {
    el.textContent = texto;
    el.classList.toggle("error", esError);
  }

  function parseLineaAlumno(linea) {
    if (!linea) return null;
    const partes = linea.split(",").map((p) => p.trim());
    if (partes.length < 3) return null;
    const grupo = partes[0];
    const num = parseInt(partes[1], 10);
    const nombre = partes.slice(2).join(" ");
    if (!grupo || isNaN(num) || !nombre) return null;
    return { id: `${grupo}-${num}`, grupo, numero: num, nombre };
  }

  function importarDesdeTexto(texto) {
    const lineas = texto
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const nuevos = [];
    for (const linea of lineas) {
      const al = parseLineaAlumno(linea);
      if (al) nuevos.push(al);
    }
    if (!nuevos.length) return 0;

    const mapa = {};
    for (const al of alumnos) mapa[al.id] = al;
    for (const al of nuevos) mapa[al.id] = al;

    alumnos = Object.values(mapa).sort((a, b) => {
      if (a.grupo === b.grupo) return a.numero - b.numero;
      return a.grupo.localeCompare(b.grupo);
    });

    saveJSON(LS_ALUMNOS, alumnos);
    poblarSelectsGrupos();
    return nuevos.length;
  }

  function leerArchivoLista(file) {
    return new Promise((resolve, reject) => {
      const ext = file.name.split(".").pop().toLowerCase();
      const reader = new FileReader();

      if (ext === "csv" || ext === "txt") {
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject("Error al leer archivo de texto");
        reader.readAsText(file, "utf-8");
      } else if (ext === "xlsx" || ext === "xls") {
        reader.onload = () => {
          try {
            if (!window.XLSX) {
              reject("No se pudo cargar librería de Excel");
              return;
            }
            const data = new Uint8Array(reader.result);
            const workbook = XLSX.read(data, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const csv = XLSX.utils.sheet_to_csv(sheet);
            resolve(csv);
          } catch {
            reject("Error al procesar archivo de Excel");
          }
        };
        reader.onerror = () => reject("Error al leer archivo de Excel");
        reader.readAsArrayBuffer(file);
      } else {
        reject("Formato de archivo no soportado");
      }
    });
  }

  btnImportarAlumnos.addEventListener("click", async () => {
    mostrarMensaje(msgListas, "");
    let texto = txtLista.value.trim();
    try {
      if (!texto && fileLista.files.length === 0) {
        mostrarMensaje(
          msgListas,
          "Selecciona un archivo o pega la lista.",
          true
        );
        return;
      }
      if (!texto && fileLista.files.length > 0) {
        const file = fileLista.files[0];
        texto = await leerArchivoLista(file);
      }

      const n = importarDesdeTexto(texto);
      if (!n) {
        mostrarMensaje(
          msgListas,
          "No se pudieron importar alumnos. Revisa el formato.",
          true
        );
        return;
      }
      mostrarMensaje(
        msgListas,
        `Se importaron ${n} alumnos. Puedes consultar la lista.`,
        false
      );
      poblarTablaAlumnos();
      panelAlumnos.classList.remove("oculto");
    } catch (err) {
      mostrarMensaje(msgListas, String(err), true);
    }
  });

  btnVerAlumnos.addEventListener("click", () => {
    if (!alumnos.length) {
      mostrarMensaje(msgListas, "No hay alumnos guardados.", true);
      panelAlumnos.classList.add("oculto");
      return;
    }
    poblarTablaAlumnos();
    panelAlumnos.classList.toggle("oculto");
  });

  btnBorrarAlumnos.addEventListener("click", () => {
    if (!confirm("¿Seguro que quieres borrar TODOS los alumnos?")) return;
    alumnos = [];
    saveJSON(LS_ALUMNOS, alumnos);
    tbodyAlumnos.innerHTML = "";
    panelAlumnos.classList.add("oculto");
    mostrarMensaje(msgListas, "Alumnos borrados.");
    poblarSelectsGrupos();
  });

  function poblarTablaAlumnos() {
    tbodyAlumnos.innerHTML = "";
    for (const al of alumnos) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${al.grupo}</td><td>${al.numero}</td><td>${al.nombre}</td>`;
      tbodyAlumnos.appendChild(tr);
    }
  }

  function gruposDeAlumnos() {
    const set = new Set();
    for (const al of alumnos) set.add(al.grupo);
    return Array.from(set).sort();
  }

  function alumnosDeGrupo(grupo) {
    return alumnos.filter((a) => a.grupo === grupo);
  }

  // ====== SELECTS DE GRUPOS/ALUMNOS ======
  const selGrupoTarjetas = document.getElementById("selGrupoTarjetas");
  const selGrupoAsis = document.getElementById("selGrupoAsis");
  const selGrupoTrab = document.getElementById("selGrupoTrab");
  const selAlumnoAsis = document.getElementById("selAlumnoAsis");
  const selAlumnoTrab = document.getElementById("selAlumnoTrab");
  const selGrupoResumen = document.getElementById("selGrupoResumen");
  const selAlumnoResumen = document.getElementById("selAlumnoResumen");

  function poblarSelectsGrupos() {
    const grupos = gruposDeAlumnos();
    const selects = [selGrupoTarjetas, selGrupoAsis, selGrupoTrab, selGrupoResumen];
    for (const sel of selects) {
      if (!sel) continue;
      const valorPrevio = sel.value;
      sel.innerHTML = `<option value="">Selecciona grupo…</option>`;
      for (const g of grupos) {
        const opt = document.createElement("option");
        opt.value = g;
        opt.textContent = g;
        sel.appendChild(opt);
      }
      if (grupos.includes(valorPrevio)) sel.value = valorPrevio;
    }
    actualizarDashboard();
  }

  function poblarSelectAlumnos(sel, grupo) {
    if (!sel) return;
    sel.innerHTML = `<option value="">Selecciona alumno…</option>`;
    if (!grupo) return;
    const lista = alumnosDeGrupo(grupo);
    for (const al of lista) {
      const opt = document.createElement("option");
      opt.value = al.id;
      opt.textContent = `${al.numero}. ${al.nombre}`;
      sel.appendChild(opt);
    }
  }

  selGrupoAsis.addEventListener("change", () => {
    poblarSelectAlumnos(selAlumnoAsis, selGrupoAsis.value);
    refrescarTablaAsis();
    actualizarDashboard();
  });

  selGrupoTrab.addEventListener("change", () => {
    poblarSelectAlumnos(selAlumnoTrab, selGrupoTrab.value);
    refrescarTablaTrab();
    actualizarDashboard();
  });

  if (selGrupoResumen) {
    selGrupoResumen.addEventListener("change", () => {
      poblarSelectAlumnos(selAlumnoResumen, selGrupoResumen.value);
    });
  }

  if (fechaAsis) {
    fechaAsis.addEventListener("change", () => refrescarTablaAsis());
  }
  if (fechaTrab) {
    fechaTrab.addEventListener("change", () => refrescarTablaTrab());
  }

  // ====== TARJETAS QR ======
  const btnGenerarTarjetas = document.getElementById("btnGenerarTarjetas");
  const btnDescargarWord = document.getElementById("btnDescargarWord");
  const msgTarjetas = document.getElementById("msgTarjetas");

  function payloadQR(al) {
    return `TS20|${al.grupo}|${al.numero}|${al.id}`;
  }

  btnGenerarTarjetas.addEventListener("click", () => {
    const grupo = selGrupoTarjetas.value;
    if (!grupo) {
      mostrarMensaje(msgTarjetas, "Selecciona un grupo.", true);
      return;
    }
    const lista = alumnosDeGrupo(grupo);
    if (!lista.length) {
      mostrarMensaje(
        msgTarjetas,
        "No hay alumnos para ese grupo. Importa la lista primero.",
        true
      );
      return;
    }

    const w = window.open("", "_blank");
    if (!w) {
      mostrarMensaje(
        msgTarjetas,
        "El navegador bloqueó la ventana emergente.",
        true
      );
      return;
    }

    w.document.write(`<!DOCTYPE html><html><head>
      <meta charset="UTF-8">
      <title>Tarjetas ${grupo}</title>
      <style>
        body{font-family:Arial,sans-serif;}
        .card{width:45%;display:inline-block;border:1px solid #ccc;margin:8px;padding:8px;text-align:center;}
        .qr{margin-top:4px;}
      </style>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
      </head><body>`);

    lista.forEach((al, idx) => {
      const idDiv = `qr-${idx}`;
      w.document.write(`<div class="card">
        <strong>${al.grupo} · ${al.numero}</strong><br>${al.nombre}
        <div id="${idDiv}" class="qr"></div>
      </div>`);
      w.document.write(`<script>
        new QRCode("${idDiv}", { text: "${payloadQR(al)}", width: 160, height: 160 });
      </script>`);
    });

    w.document.write(
      `<script>setTimeout(function(){window.print();},1000);</script></body></html>`
    );
    w.document.close();
    mostrarMensaje(msgTarjetas, "Se abrió la vista de impresión.", false);
  });

  btnDescargarWord.addEventListener("click", () => {
    const grupo = selGrupoTarjetas.value;
    if (!grupo) {
      mostrarMensaje(msgTarjetas, "Selecciona un grupo.", true);
      return;
    }
    const lista = alumnosDeGrupo(grupo);
    if (!lista.length) {
      mostrarMensaje(
        msgTarjetas,
        "No hay alumnos para ese grupo. Importa la lista primero.",
        true
      );
      return;
    }

    const tmpContainer = document.createElement("div");
    tmpContainer.style.position = "fixed";
    tmpContainer.style.left = "-9999px";
    document.body.appendChild(tmpContainer);

    const imagenes = [];
    lista.forEach((al) => {
      const d = document.createElement("div");
      tmpContainer.appendChild(d);
      new QRCode(d, { text: payloadQR(al), width: 200, height: 200 });
      const img = d.querySelector("img") || d.querySelector("canvas");
      if (img && img.src) imagenes.push({ al, src: img.src });
    });

    document.body.removeChild(tmpContainer);

    let html =
      '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Tarjetas</title></head><body>';
    imagenes.forEach(({ al, src }) => {
      html += `<div style="width:45%;display:inline-block;margin:8px;border:1px solid #ccc;padding:6px;text-align:center;">
        <div><strong>${al.grupo} · ${al.numero}</strong></div>
        <div>${al.nombre}</div>
        <img src="${src}" style="width:160px;height:160px;margin-top:4px;" />
      </div>`;
    });
    html += "</body></html>";

    const blob = new Blob(["\ufeff", html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tarjetas_${grupo}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    mostrarMensaje(msgTarjetas, "Archivo Word generado.", false);
  });

  // ====== ASISTENCIA ======
  const modoAsis = document.getElementById("modoAsis"); // (a futuro)
  const msgAsis = document.getElementById("msgAsis");
  const tablaAsis = document.getElementById("tablaAsis").querySelector("tbody");
  const btnIniciarCamAsis = document.getElementById("btnIniciarCamAsis");
  const btnDetenerCamAsis = document.getElementById("btnDetenerCamAsis");
  const btnRegistrarManualAsis = document.getElementById("btnRegistrarManualAsis");
  const estadoManualAsis = document.getElementById("estadoManualAsis");
  const btnExportarAsis = document.getElementById("btnExportarAsis");
  const btnExportarAsisRango = document.getElementById("btnExportarAsisRango");

  function registrosDeAsistencia(fecha, grupo) {
    const clave = claveRegistro(fecha, grupo);
    if (!asistencias[clave]) asistencias[clave] = [];
    return asistencias[clave];
  }

  function guardarAsistencias() {
    saveJSON(LS_ASIS, asistencias);
  }

  function upsertAsistencia(fecha, grupo, idAlumno, estado) {
    const lista = registrosDeAsistencia(fecha, grupo);
    const ahora = new Date();
    const hora = ahora.toTimeString().slice(0, 5);
    const idx = lista.findIndex((r) => r.idAlumno === idAlumno);
    if (idx >= 0) {
      lista[idx].estado = estado;
      lista[idx].hora = hora;
    } else {
      lista.push({ idAlumno, estado, hora });
    }
    guardarAsistencias();
    refrescarTablaAsis();
    actualizarDashboard();
  }

  function refrescarTablaAsis() {
    const grupo = selGrupoAsis.value;
    const fecha = fechaAsis ? fechaAsis.value || hoyISO() : hoyISO();
    tablaAsis.innerHTML = "";
    if (!grupo) return;

    const lista = registrosDeAsistencia(fecha, grupo);
    const mapa = {};
    for (const r of lista) mapa[r.idAlumno] = r;

    const listaAlumnos = alumnosDeGrupo(grupo);
    for (const al of listaAlumnos) {
      const r = mapa[al.id] || { estado: "SIN REGISTRO", hora: "" };
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${al.numero}</td><td>${al.nombre}</td><td>${r.estado}</td><td>${r.hora}</td>`;
      tablaAsis.appendChild(tr);
    }
  }

  function manejarScanAsis(texto) {
    try {
      const parts = texto.split("|");
      if (parts.length < 4 || parts[0] !== "TS20") return;
      const grupo = selGrupoAsis.value;
      const fecha = fechaAsis ? fechaAsis.value || hoyISO() : hoyISO();
      const grupoQR = parts[1];
      const num = parseInt(parts[2], 10);

      if (!grupo || grupo !== grupoQR) {
        mostrarMensaje(
          msgAsis,
          `El QR es del grupo ${grupoQR}, selecciona ese grupo.`,
          true
        );
        return;
      }

      const idAlumno = `${grupoQR}-${num}`;
      upsertAsistencia(fecha, grupoQR, idAlumno, "PRESENTE");
      mostrarMensaje(
        msgAsis,
        `Asistencia registrada: ${grupoQR} · ${num}`,
        false
      );
    } catch {
      mostrarMensaje(msgAsis, "QR no reconocido.", true);
    }
  }

  btnRegistrarManualAsis.addEventListener("click", () => {
    const grupo = selGrupoAsis.value;
    const fecha = fechaAsis ? fechaAsis.value || hoyISO() : hoyISO();
    const idAl = selAlumnoAsis.value;
    const estado = estadoManualAsis.value;
    if (!grupo || !idAl) {
      mostrarMensaje(
        msgAsis,
        "Selecciona grupo y alumno para registrar manualmente.",
        true
      );
      return;
    }
    upsertAsistencia(fecha, grupo, idAl, estado);
    mostrarMensaje(msgAsis, "Asistencia registrada manualmente.", false);
  });

  function iniciarCamaraAsis() {
    const cont = document.getElementById("lectorAsis");
    cont.innerHTML = "";
    if (!window.Html5Qrcode) {
      mostrarMensaje(msgAsis, "No se pudo cargar lector de QR.", true);
      return;
    }
    qrAsis = new Html5Qrcode("lectorAsis");
    qrAsis
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (decodedText) => manejarScanAsis(decodedText)
      )
      .catch(() => {
        mostrarMensaje(msgAsis, "Error al iniciar la cámara.", true);
      });
  }

  function detenerCamaraAsis() {
    if (qrAsis) {
      qrAsis
        .stop()
        .then(() => {
          document.getElementById("lectorAsis").innerHTML = "";
          qrAsis = null;
        })
        .catch(() => {});
    }
  }

  btnIniciarCamAsis.addEventListener("click", iniciarCamaraAsis);
  btnDetenerCamAsis.addEventListener("click", detenerCamaraAsis);

  // Exportar asistencia día
  btnExportarAsis.addEventListener("click", () => {
    const grupo = selGrupoAsis.value;
    const fecha = fechaAsis ? fechaAsis.value || hoyISO() : hoyISO();
    if (!grupo) {
      mostrarMensaje(
        msgAsis,
        "Selecciona un grupo para exportar la asistencia.",
        true
      );
      return;
    }
    if (!window.XLSX) {
      mostrarMensaje(msgAsis, "No se pudo cargar la librería de Excel.", true);
      return;
    }

    const listaReg = registrosDeAsistencia(fecha, grupo);
    const listaAl = alumnosDeGrupo(grupo);

    const datos = [["Grupo", "Fecha", "Número", "Nombre", "Estado", "Hora"]];
    for (const al of listaAl) {
      const r = listaReg.find((x) => x.idAlumno === al.id);
      const estado = r ? r.estado : "SIN REGISTRO";
      const hora = r ? r.hora : "";
      datos.push([al.grupo, fecha, al.numero, al.nombre, estado, hora]);
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(datos);
    XLSX.utils.book_append_sheet(wb, ws, "Asistencia");
    XLSX.writeFile(wb, `asistencia_${grupo}_${fecha}.xlsx`);
    mostrarMensaje(msgAsis, "Archivo de asistencia exportado.", false);
  });

  // Exportar asistencia rango
  btnExportarAsisRango.addEventListener("click", () => {
    const grupo = selGrupoAsis.value;
    const desde = fechaAsisIni ? fechaAsisIni.value : "";
    const hasta = fechaAsisFin ? fechaAsisFin.value : "";
    if (!grupo) {
      mostrarMensaje(
        msgAsis,
        "Selecciona un grupo para exportar el rango.",
        true
      );
      return;
    }
    if (!desde || !hasta) {
      mostrarMensaje(msgAsis, "Selecciona fecha inicial y final.", true);
      return;
    }
    if (!window.XLSX) {
      mostrarMensaje(msgAsis, "No se pudo cargar la librería de Excel.", true);
      return;
    }

    let ini = desde;
    let fin = hasta;
    if (compararFechasISO(ini, fin) > 0) {
      const tmp = ini;
      ini = fin;
      fin = tmp;
    }

    const datos = [["Grupo", "Fecha", "Número", "Nombre", "Estado", "Hora"]];
    const claves = Object.keys(asistencias)
      .filter((k) => {
        const [f, g] = k.split("|");
        return (
          g === grupo &&
          compararFechasISO(f, ini) >= 0 &&
          compararFechasISO(f, fin) <= 0
        );
      })
      .sort((a, b) => {
        const fa = a.split("|")[0];
        const fb = b.split("|")[0];
        return compararFechasISO(fa, fb);
      });

    const listaAl = alumnosDeGrupo(grupo);

    for (const clave of claves) {
      const [fechaK] = clave.split("|");
      const listaReg = asistencias[clave] || [];
      for (const al of listaAl) {
        const r = listaReg.find((x) => x.idAlumno === al.id);
        const estado = r ? r.estado : "SIN REGISTRO";
        const hora = r ? r.hora : "";
        datos.push([al.grupo, fechaK, al.numero, al.nombre, estado, hora]);
      }
    }

    if (datos.length === 1) {
      mostrarMensaje(
        msgAsis,
        "No hay registros de asistencia en ese rango.",
        true
      );
      return;
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(datos);
    XLSX.utils.book_append_sheet(wb, ws, "AsistenciaRango");
    XLSX.writeFile(wb, `asistencia_${grupo}_${ini}_a_${fin}.xlsx`);
    mostrarMensaje(msgAsis, "Archivo de asistencia (rango) exportado.", false);
  });

  // ====== TRABAJOS ======
  const msgTrab = document.getElementById("msgTrab");
  const tablaTrab = document.getElementById("tablaTrab").querySelector("tbody");
  const btnIniciarCamTrab = document.getElementById("btnIniciarCamTrab");
  const btnDetenerCamTrab = document.getElementById("btnDetenerCamTrab");
  const btnRegistrarManualTrab = document.getElementById("btnRegistrarManualTrab");
  const estadoManualTrab = document.getElementById("estadoManualTrab");
  const btnExportarTrab = document.getElementById("btnExportarTrab");

  function registrosDeTrabajos(fecha, grupo) {
    const clave = claveRegistro(fecha, grupo);
    if (!trabajos[clave]) trabajos[clave] = [];
    return trabajos[clave];
  }

  function guardarTrabajos() {
    saveJSON(LS_TRAB, trabajos);
  }

  function upsertTrabajo(fecha, grupo, idAlumno, estado) {
    const lista = registrosDeTrabajos(fecha, grupo);
    const ahora = new Date();
    const hora = ahora.toTimeString().slice(0, 5);
    const idx = lista.findIndex((r) => r.idAlumno === idAlumno);
    if (idx >= 0) {
      lista[idx].estado = estado;
      lista[idx].hora = hora;
    } else {
      lista.push({ idAlumno, estado, hora });
    }
    guardarTrabajos();
    refrescarTablaTrab();
    actualizarDashboard();
  }

  function refrescarTablaTrab() {
    const grupo = selGrupoTrab.value;
    const fecha = fechaTrab ? fechaTrab.value || hoyISO() : hoyISO();
    tablaTrab.innerHTML = "";
    if (!grupo) return;

    const lista = registrosDeTrabajos(fecha, grupo);
    const mapa = {};
    for (const r of lista) mapa[r.idAlumno] = r;

    const listaAlumnos = alumnosDeGrupo(grupo);
    for (const al of listaAlumnos) {
      const r = mapa[al.id] || { estado: "NO_ENTREGADO", hora: "" };
      const txtEstado = r.estado === "ENTREGADO" ? "Entregado" : "No entregó";
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${al.numero}</td><td>${al.nombre}</td><td>${txtEstado}</td><td>${r.hora}</td>`;
      tablaTrab.appendChild(tr);
    }
  }

  function manejarScanTrab(texto) {
    try {
      const parts = texto.split("|");
      if (parts.length < 4 || parts[0] !== "TS20") return;
      const grupo = selGrupoTrab.value;
      const fecha = fechaTrab ? fechaTrab.value || hoyISO() : hoyISO();
      const grupoQR = parts[1];
      const num = parseInt(parts[2], 10);

      if (!grupo || grupo !== grupoQR) {
        mostrarMensaje(
          msgTrab,
          `El QR es del grupo ${grupoQR}, selecciona ese grupo.`,
          true
        );
        return;
      }

      const idAlumno = `${grupoQR}-${num}`;
      upsertTrabajo(fecha, grupoQR, idAlumno, "ENTREGADO");
      mostrarMensaje(
        msgTrab,
        `Trabajo registrado: ${grupoQR} · ${num}`,
        false
      );
    } catch {
      mostrarMensaje(msgTrab, "QR no reconocido.", true);
    }
  }

  btnRegistrarManualTrab.addEventListener("click", () => {
    const grupo = selGrupoTrab.value;
    const fecha = fechaTrab ? fechaTrab.value || hoyISO() : hoyISO();
    const idAl = selAlumnoTrab.value;
    const estado = estadoManualTrab.value;
    if (!grupo || !idAl) {
      mostrarMensaje(
        msgTrab,
        "Selecciona grupo y alumno para registrar manualmente.",
        true
      );
      return;
    }
    upsertTrabajo(fecha, grupo, idAl, estado);
    mostrarMensaje(msgTrab, "Trabajo registrado manualmente.", false);
  });

  function iniciarCamaraTrab() {
    const cont = document.getElementById("lectorTrab");
    cont.innerHTML = "";
    if (!window.Html5Qrcode) {
      mostrarMensaje(msgTrab, "No se pudo cargar lector de QR.", true);
      return;
    }
    qrTrab = new Html5Qrcode("lectorTrab");
    qrTrab
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (decodedText) => manejarScanTrab(decodedText)
      )
      .catch(() => {
        mostrarMensaje(msgTrab, "Error al iniciar la cámara.", true);
      });
  }

  function detenerCamaraTrab() {
    if (qrTrab) {
      qrTrab
        .stop()
        .then(() => {
          document.getElementById("lectorTrab").innerHTML = "";
          qrTrab = null;
        })
        .catch(() => {});
    }
  }

  btnIniciarCamTrab.addEventListener("click", iniciarCamaraTrab);
  btnDetenerCamTrab.addEventListener("click", detenerCamaraTrab);

  btnExportarTrab.addEventListener("click", () => {
    const grupo = selGrupoTrab.value;
    const fecha = fechaTrab ? fechaTrab.value || hoyISO() : hoyISO();
    if (!grupo) {
      mostrarMensaje(
        msgTrab,
        "Selecciona un grupo para exportar los trabajos.",
        true
      );
      return;
    }
    if (!window.XLSX) {
      mostrarMensaje(msgTrab, "No se pudo cargar la librería de Excel.", true);
      return;
    }

    const listaReg = registrosDeTrabajos(fecha, grupo);
    const listaAl = alumnosDeGrupo(grupo);

    const datos = [["Grupo", "Fecha", "Número", "Nombre", "Estado", "Hora"]];
    for (const al of listaAl) {
      const r = listaReg.find((x) => x.idAlumno === al.id);
      const estado = r ? r.estado : "NO_ENTREGADO";
      const txtEstado = estado === "ENTREGADO" ? "Entregado" : "No entregó";
      const hora = r ? r.hora : "";
      datos.push([al.grupo, fecha, al.numero, al.nombre, txtEstado, hora]);
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(datos);
    XLSX.utils.book_append_sheet(wb, ws, "Trabajos");
    XLSX.writeFile(wb, `trabajos_${grupo}_${fecha}.xlsx`);
    mostrarMensaje(msgTrab, "Archivo de trabajos exportado.", false);
  });

  // ====== RESUMEN POR ALUMNO ======
  const btnExportarResumenAlumno = document.getElementById(
    "btnExportarResumenAlumno"
  );

  if (btnExportarResumenAlumno) {
    btnExportarResumenAlumno.addEventListener("click", () => {
      const grupo = selGrupoResumen.value;
      const idAlumno = selAlumnoResumen.value;
      const desde = fechaResIni ? fechaResIni.value : "";
      const hasta = fechaResFin ? fechaResFin.value : "";

      if (!grupo || !idAlumno) {
        mostrarMensaje(
          msgAsis,
          "Selecciona grupo y alumno para el resumen.",
          true
        );
        return;
      }
      if (!desde || !hasta) {
        mostrarMensaje(
          msgAsis,
          "Selecciona fecha inicial y final para el resumen.",
          true
        );
        return;
      }
      if (!window.XLSX) {
        mostrarMensaje(
          msgAsis,
          "No se pudo cargar la librería de Excel.",
          true
        );
        return;
      }

      let ini = desde;
      let fin = hasta;
      if (compararFechasISO(ini, fin) > 0) {
        const tmp = ini;
        ini = fin;
        fin = tmp;
      }

      const datosAsis = [["Fecha", "Estado", "Hora"]];
      const datosTrab = [["Fecha", "Estado", "Hora"]];

      // Asistencia
      Object.keys(asistencias)
        .filter((k) => {
          const [f, g] = k.split("|");
          return (
            g === grupo &&
            compararFechasISO(f, ini) >= 0 &&
            compararFechasISO(f, fin) <= 0
          );
        })
        .sort((a, b) => {
          const fa = a.split("|")[0];
          const fb = b.split("|")[0];
          return compararFechasISO(fa, fb);
        })
        .forEach((clave) => {
          const [f] = clave.split("|");
          const listaReg = asistencias[clave] || [];
          const r = listaReg.find((x) => x.idAlumno === idAlumno);
          if (r) datosAsis.push([f, r.estado, r.hora]);
        });

      // Trabajos
      Object.keys(trabajos)
        .filter((k) => {
          const [f, g] = k.split("|");
          return (
            g === grupo &&
            compararFechasISO(f, ini) >= 0 &&
            compararFechasISO(f, fin) <= 0
          );
        })
        .sort((a, b) => {
          const fa = a.split("|")[0];
          const fb = b.split("|")[0];
          return compararFechasISO(fa, fb);
        })
        .forEach((clave) => {
          const [f] = clave.split("|");
          const listaReg = trabajos[clave] || [];
          const r = listaReg.find((x) => x.idAlumno === idAlumno);
          if (r) {
            const estadoTxt =
              r.estado === "ENTREGADO" ? "Entregado" : "No entregó";
            datosTrab.push([f, estadoTxt, r.hora]);
          }
        });

      if (datosAsis.length === 1 && datosTrab.length === 1) {
        mostrarMensaje(
          msgAsis,
          "No hay registros para ese alumno en el rango seleccionado.",
          true
        );
        return;
      }

      const wb = XLSX.utils.book_new();
      const wsA = XLSX.utils.aoa_to_sheet(datosAsis);
      XLSX.utils.book_append_sheet(wb, wsA, "Asistencia");

      const wsT = XLSX.utils.aoa_to_sheet(datosTrab);
      XLSX.utils.book_append_sheet(wb, wsT, "Trabajos");

      const al = buscarAlumnoPorId(idAlumno);
      const nombreLimpio = al
        ? al.nombre.replace(/[^a-zA-Z0-9ÁÉÍÓÚáéíóúÑñ ]/g, "")
        : "alumno";
      const archivo = `resumen_${grupo}_${nombreLimpio}_${ini}_a_${fin}.xlsx`;

      XLSX.writeFile(wb, archivo);
      mostrarMensaje(
        msgAsis,
        "Resumen por alumno exportado (asistencia + trabajos).",
        false
      );
    });
  }

  // ====== INICIO ======
  cargarEstado();
  aplicarConfigAUI();
  poblarSelectsGrupos();
  refrescarTablaAsis();
  refrescarTablaTrab();
  setActiveTab("listas");
});