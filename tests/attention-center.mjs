import { chromium } from 'playwright';
const BASE=process.env.PROFEQR_TEST_URL||'http://127.0.0.1:4173';
function assert(cond,msg){ if(!cond) throw new Error(msg); }
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:412,height:915}});
const page=await context.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
await page.goto(BASE,{waitUntil:'networkidle'});
const out=await page.evaluate(()=>{
  db=emptyDb();
  db.config={school:'RC Atención',cct:'11TEST0001X',teacher:'QA',cycle:'2026-2027',level:'Telesecundaria',grade:'1°',shift:'Vespertino',section:'G',group:'1°G',theme:'professional',licenseLegacyGrandfathered:true};
  db.group.students=[
    {id:'ana',listNo:1,name:'Ana Prioridad',active:true,qr:'1G01'},
    {id:'bea',listNo:2,name:'Beatriz Regular',active:true,qr:'1G02'},
    {id:'car',listNo:3,name:'Carlos Atención',active:true,qr:'1G03'}
  ];
  const mk=attentionMonthKey();
  const dates=[1,2,3,4,5,6].map(n=>`${mk}-${String(n).padStart(2,'0')}`);
  db.group.attendance={};
  dates.forEach((d,i)=>{
    db.group.attendance[d]=[
      {studentId:'bea',date:d},
      ...(i<3?[{studentId:'car',date:d}]:[])
    ];
  });
  db.group.works=[];
  for(let i=1;i<=5;i++){
    const key=`${mk}-0${i}__Lenguajes__Español__t${i}`;
    db.group.works.push({id:`b${i}`,key,date:`${mk}-0${i}`,score:3,studentId:'bea',studentName:'Beatriz Regular'});
    if(i<=3) db.group.works.push({id:`c${i}`,key,date:`${mk}-0${i}`,score:3,studentId:'car',studentName:'Carlos Atención'});
  }
  const overdue=`${mk}-01`;
  db.group.bitacoraReports=[
    normalizeBitacoraReport({id:'r1',folio:'BPF-T1',type:'B',status:'en seguimiento',date:`${mk}-02`,createdAt:`${mk}-02T10:00:00`,studentIds:['ana'],data:{b_commitment:'Entregar actividades',b_followup_date:overdue}}),
    normalizeBitacoraReport({id:'r2',folio:'BPF-T2',type:'B',status:'en seguimiento',date:`${mk}-03`,createdAt:`${mk}-03T10:00:00`,studentIds:['ana'],data:{b_followup_date:overdue}})
  ];
  const data=buildAttentionCenterData(mk);
  const html=renderAttentionCenter();
  return {data,html};
});
const ana=out.data.attention.find(x=>x.studentId==='ana');
const car=out.data.attention.find(x=>x.studentId==='car');
assert(out.data.registeredDays===6,`Días registrados: ${out.data.registeredDays}`);
assert(ana && ana.level==='red','Ana no fue clasificada como prioridad');
assert(ana.absences===6,'Faltas de Ana incorrectas');
assert(ana.pendingWorks===5,'Pendientes de Ana incorrectos');
assert(ana.incidents===2,'Incidencias de Ana incorrectas');
assert(ana.overdueAgreements===1,'Acuerdo vencido de Ana no detectado');
assert(car && car.level==='yellow','Carlos no fue clasificado en atención');
assert(car.absences===3,'Faltas de Carlos incorrectas');
assert(out.data.attention.every(x=>x.studentId!=='bea'),'Alumno regular apareció en atención');
assert(out.data.overdueAgreementCount===1,'Conteo global de acuerdos vencidos incorrecto');
assert(out.html.includes('Centro de Atención del Grupo'),'Centro no renderiza título');
assert(out.html.includes('Ana Prioridad'),'Centro no muestra alumno prioritario');
assert(out.html.includes('Días con asistencia registrada'),'Etiqueta de precisión ausente');
assert(errors.length===0,`Errores de navegador: ${errors.join('; ')}`);
console.log('PASS  Centro de Atención: reglas, prioridades, acuerdos y renderizado');
await browser.close();
