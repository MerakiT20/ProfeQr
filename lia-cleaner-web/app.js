const apps=[
{name:'Facebook Lite',icon:'f',size:1.2,days:143,candidate:true},
{name:'Booking',icon:'B',size:.486,days:197,candidate:true},
{name:'Google Maps',icon:'⌖',size:1.8,days:1,candidate:false},
{name:'Pinterest',icon:'P',size:.32,days:90,candidate:true},
{name:'Música Player',icon:'♫',size:.265,days:120,candidate:true},
{name:'Noticias',icon:'N',size:.214,days:60,candidate:false},
{name:'Clima',icon:'☀',size:.135,days:30,candidate:false}
];

const recommendations=[
{icon:'▦',title:'Eliminar apps sin usar',text:'Revisa aplicaciones que llevan meses sin abrirse.',space:3.2},
{icon:'▣',title:'Borrar archivos grandes',text:'Encuentra videos, descargas y archivos pesados.',space:6.8},
{icon:'⇩',title:'Revisar descargas',text:'Detecta descargas antiguas que ya no necesitas.',space:1.1}
];

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];

function showView(name){
  $$('.view').forEach(v=>v.classList.toggle('active',v.id===`view-${name}`));
  $$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
  window.scrollTo({top:0,behavior:'smooth'});
}

function toast(message){
  const el=$('#toast');
  el.textContent=message;
  el.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer=setTimeout(()=>el.classList.remove('show'),2500);
}

function renderApps(sort='days'){
  const list=[...apps].sort((a,b)=>sort==='size'?b.size-a.size:b.days-a.days);
  $('#appList').innerHTML=list.map(app=>`<article class="app-row">
    <div class="app-icon">${app.icon}</div>
    <div><h3>${app.name}</h3><p>${app.days<=1?'Usada ayer':`Hace ${app.days} días`}</p>${app.candidate?'<span class="badge">Candidata a eliminar</span>':''}</div>
    <div class="app-size"><strong>${app.size>=1?app.size.toFixed(1)+' GB':Math.round(app.size*1000)+' MB'}</strong></div>
  </article>`).join('');
}

function renderRecommendations(){
  $('#recommendations').innerHTML=recommendations.map(r=>`<article class="recommendation-card">
    <div class="rec-icon">${r.icon}</div>
    <div><h3>${r.title}</h3><p>${r.text}</p></div>
    <strong>Hasta ${r.space.toFixed(1)} GB</strong>
  </article>`).join('');
}

$$('.nav-item').forEach(btn=>btn.addEventListener('click',()=>showView(btn.dataset.view)));
$$('[data-target]').forEach(btn=>btn.addEventListener('click',()=>showView(btn.dataset.target)));
$('#sortApps').addEventListener('change',e=>renderApps(e.target.value));

$('#scanButton').addEventListener('click',()=>{
  const btn=$('#scanButton');
  const original=btn.textContent;
  btn.disabled=true;
  btn.textContent='Analizando…';
  setTimeout(()=>{
    btn.disabled=false;
    btn.textContent=original;
    toast('Análisis completado: 14.7 GB potencialmente recuperables');
    showView('clean');
  },900);
});

$('#cleanButton').addEventListener('click',()=>{
  toast('Demo: aquí se solicitaría tu confirmación antes de eliminar contenido');
});

renderApps();
renderRecommendations();

if('serviceWorker' in navigator){
  navigator.serviceWorker.register('./sw.js').catch(()=>{});
}
