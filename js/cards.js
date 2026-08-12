/* --- Cards --- */
function renderCards(){
  const students = [...getActiveStudents()].sort((a,b)=>(a.listNo||999)-(b.listNo||999)); // FIX v4: solo activos
  const activeCount = students.filter(s=>s.active!==false).length;
  const inactiveCount = students.length - activeCount;
  return `
  <div class="card no-print">
    <button class="btn primary" id="print-cards-btn">Imprimir tarjetas</button>
    <div class="help">Las tarjetas se acomodan 4 por hoja carta. El QR mide 6 x 6 cm para una lectura más confiable.</div>
  </div>
  <div id="print-area" class="print-grid">
    ${students.map(s=>`
      <div class="cred">
        <div class="cred-toptext">${esc(db.config.school)}</div>
        <div class="cred-toptext">Maestro: ${esc(db.config.teacher)}</div>
        <div class="cred-toptext">Grupo: ${esc(db.config.group)}</div>
        <div class="cred-name">${esc(s.name)}</div>
        <div class="qr-wrap"><div class="qr-box" id="qr-${s.id}"></div></div>
        <div class="cred-meta">${esc(s.qr)}</div>
      </div>`).join('')}
  </div>`;
}
function bindCards(){
  document.getElementById('print-cards-btn').onclick = () => window.print();
  db.group.students.forEach(s=>{
    const el = document.getElementById(`qr-${s.id}`);
    if(el){
      el.innerHTML = '';
      if(typeof QRCode === 'undefined'){ el.innerHTML = '<div class="small" style="color:var(--bad)">QRCode no disponible</div>'; return; }
      new QRCode(el, {text:s.qr,width:226,height:226,colorDark:'#000000',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.H});
    }
  });
}

