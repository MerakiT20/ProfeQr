import { chromium } from 'playwright';

const BASE=process.env.PROFEQR_TEST_URL||'http://127.0.0.1:4173';
const results=[];
function assert(condition,message='Assertion failed'){ if(!condition) throw new Error(message); }
async function test(name,fn){
  try{ await fn(); results.push({name,ok:true}); console.log(`PASS  ${name}`); }
  catch(error){ results.push({name,ok:false,error}); console.error(`FAIL  ${name} — ${error?.stack||error}`); }
}

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:412,height:915},timezoneId:'Pacific/Kiritimati'});
const page=await context.newPage();
const pageErrors=[];
page.on('pageerror',error=>pageErrors.push(String(error?.stack||error)));
await page.goto(BASE,{waitUntil:'networkidle'});

async function resetState(){
  await page.evaluate(()=>{
    db=emptyDb();
    db.config={school:'Auditoría QA',cct:'11TEST0001X',teacher:'Docente QA',director:'Dirección QA',zone:'1',sector:'1',municipality:'León',address:'',cycle:'2026-2027',level:'Telesecundaria',grade:'1°',shift:'Vespertino',section:'G',group:'1°G',theme:'professional',licenseLegacyGrandfathered:true};
    db.group.name='1°G';
    db.group.students=[{id:'s1',listNo:1,name:'Ana López',active:true,qr:'1G01'},{id:'s2',listNo:2,name:'Beto Ruiz',active:true,qr:'1G02'}];
    licenseRuntime={checked:true,valid:true,mode:'legacy',reason:'legacy',payload:{expiresAt:'2027-07-30'},message:'Licencia válida'};
    bitacoraDraft=null; bitacoraStep=0; currentScreen='home';
    localStorage.removeItem(DRAFT_KEY);
    if(!saveDb({system:true})) throw new Error('No se pudo preparar el estado de prueba');
    renderApp();
  });
}

await test('Reimportar números intercambiados conserva la identidad histórica',async()=>{
  await resetState();
  const out=await page.evaluate(()=>{
    db.group.students=[{id:'ana-history',listNo:1,name:'Ana López',active:true,qr:'1G01'},{id:'beto-history',listNo:2,name:'Beto Ruiz',active:true,qr:'1G02'}];
    const merged=mergeImportedStudents([{listNo:1,name:'Beto Ruiz'},{listNo:2,name:'Ana López'}]);
    return Object.fromEntries(merged.students.filter(s=>s.active!==false).map(s=>[s.name,{id:s.id,listNo:s.listNo}]));
  });
  assert(out['Ana López'].id==='ana-history'&&out['Ana López'].listNo===2,'El historial de Ana cambió de identidad');
  assert(out['Beto Ruiz'].id==='beto-history'&&out['Beto Ruiz'].listNo===1,'El historial de Beto cambió de identidad');
});

await test('Agenda conserva fechas calendario aun en husos UTC positivos',async()=>{
  await resetState();
  const out=await page.evaluate(()=>({next:dateAdd('2026-01-31',1),month:monthAdd('2026-01-31',1),week:startOfWeek('2026-02-01')}));
  assert(out.next==='2026-02-01'&&out.month==='2026-02-28'&&out.week==='2026-01-26',`La agenda desplazó fechas por zona horaria: ${JSON.stringify(out)}`);
});

await test('Asistencia ignora días vacíos y borra la fecha al limpiar',async()=>{
  await resetState();
  const out=await page.evaluate(()=>{
    db.group.attendance={
      '2026-09-01':[{id:'a1',date:'2026-09-01',studentId:'s1',studentName:'Ana López',time:'08:00'}],
      '2026-09-02':[]
    };
    const report=attendanceReportData({start:'2026-09-01',end:'2026-09-30'});
    const absences=calculateAbsences('s2','2026-09-01','2026-09-30');
    attendanceDate='2026-09-01'; currentScreen='attendance'; attendanceTab='manual';
    window.confirm=()=>true; renderCurrentScreen(); document.getElementById('att-clear-all').click();
    return {days:report.base.length,betoAbsences:absences,hasClearedDate:Object.hasOwn(db.group.attendance,'2026-09-01'),hasEmptyDate:Object.hasOwn(safeDb(db).group.attendance,'2026-09-02')};
  });
  assert(out.days===1,'Un día vacío fue contado como pase de lista');
  assert(out.betoAbsences.length===1&&out.betoAbsences[0]==='2026-09-01','El cálculo de faltas no coincide con el reporte');
  assert(!out.hasClearedDate&&!out.hasEmptyDate,'Quedó una fecha vacía en asistencia');
});

await test('Captura QR y manual evita duplicados y persiste cambios',async()=>{
  await resetState();
  const out=await page.evaluate(()=>{
    attendanceDate='2026-09-03';
    const first=handleAttendanceScan('1G01');
    const duplicate=handleAttendanceScan('1G01');
    attendanceTab='manual'; currentScreen='attendance'; renderCurrentScreen();
    document.querySelector('[data-toggle-att="s2"]').click();
    const afterAdd=(db.group.attendance[attendanceDate]||[]).length;
    document.querySelector('[data-toggle-att="s2"]').click();
    const afterRemove=(db.group.attendance[attendanceDate]||[]).length;
    return {first:first.status,duplicate:duplicate.status,afterAdd,afterRemove,persisted:JSON.parse(localStorage.getItem(KEY)).group.attendance[attendanceDate].length};
  });
  assert(out.first==='Registrado'&&out.duplicate==='Duplicado','La captura QR no distingue duplicados');
  assert(out.afterAdd===2&&out.afterRemove===1&&out.persisted===1,'La captura manual no quedó consistente');
});

await test('Trabajos normaliza puntajes y agrupa por studentId y trabajo real',async()=>{
  await resetState();
  const out=await page.evaluate(()=>{
    db.group.students[0].name='Ana Actualizada';
    db.group.works=[
      {id:'w1',date:'2026-09-01',campo:'Lenguajes',asignatura:'Español',title:'Ensayo',score:'9',studentId:'s1',studentName:'Ana Anterior',listNo:9,time:'08:00'},
      {id:'w2',date:'2026-09-02',campo:'Lenguajes',asignatura:'Español',title:'Ensayo',score:2,studentId:'s1',studentName:'Ana Actualizada',listNo:1,time:'08:10'}
    ];
    db=safeDb(db);
    const report=worksReportData({start:'2026-09-01',end:'2026-09-30'});
    workDate='2026-09-03'; workCampo='Lenguajes'; workAsignatura='Español'; workTitle='Lectura';
    const created=saveOrUpdateWork('s2',2,'MANUAL');
    const updated=saveOrUpdateWork('s2',3,'MANUAL');
    const current=currentWorkRows();
    return {scores:db.group.works.filter(w=>w.id==='w1').map(w=>w.score),students:report.resumenAlumnos,assignments:report.resumenTrabajos.length,created,updated,currentCount:current.length,currentScore:current[0]?.score,achievement:workAchievement(99).label};
  });
  assert(out.scores[0]===3,'Un puntaje heredado quedó fuera del rango 0–3');
  assert(out.students.length===1&&out.students[0].ALUMNO==='Ana Actualizada'&&out.students[0].REGISTROS===2,'El historial se dividió por nombre o número anterior');
  assert(out.assignments===2,'Trabajos homónimos de fechas distintas se fusionaron');
  assert(out.created==='created'&&out.updated==='updated'&&out.currentCount===1&&out.currentScore===3,'Alta/actualización de trabajo dejó duplicados');
  assert(out.achievement==='Excelente','La presentación de puntajes dañados no es segura');
});

await test('Deshacer una limpieza conserva asistencias registradas después',async()=>{
  await resetState();
  const out=await page.evaluate(()=>{
    attendanceDate='2026-09-04'; attendanceTab='manual'; currentScreen='attendance';
    db.group.attendance[attendanceDate]=[{id:'old',date:attendanceDate,time:'08:00',studentId:'s1',studentName:'Ana López',listNo:1}];
    window.confirm=()=>true; renderCurrentScreen(); document.getElementById('att-clear-all').click();
    db.group.attendance[attendanceDate]=[{id:'new',date:attendanceDate,time:'08:05',studentId:'s2',studentName:'Beto Ruiz',listNo:2}];
    saveDb({system:true}); document.getElementById('undo-clear').click();
    const ids=(db.group.attendance[attendanceDate]||[]).map(row=>String(row.studentId)).sort();
    const persisted=(JSON.parse(localStorage.getItem(KEY)).group.attendance[attendanceDate]||[]).map(row=>String(row.studentId)).sort();
    return {ids,persisted};
  });
  assert(out.ids.join(',')==='s1,s2'&&out.persisted.join(',')==='s1,s2','Deshacer reemplazó una asistencia más reciente');
});

await test('Ruta C interpreta “no” como ausencia de canalización',async()=>{
  await resetState();
  const out=await page.evaluate(()=>{
    const report={id:'c1',type:'C',route:'C',status:'',date:'2026-09-01',studentIds:['s1'],data:{c_student:'s1',c_risk:'bajo',c_channel:'no',c_contact_medium:'no se logró contacto',c_no_response:'no',c_followup_date:'2099-01-01'}};
    db.group.bitacoraReports=[report];
    const row=bitacoraRowsForExport()[0];
    const migrated=normalizeBitacoraReport({...report,status:'canalizado',data:{...report.data,c_contact_medium:'llamada',c_status:'en seguimiento'}});
    return {channel:hasBitacoraChannel(report),status:buildReportStatus(report),migratedStatus:migrated.status,light:buildReportTrafficLight({...report,data:{...report.data,c_contact_medium:'llamada'}}),exportChannel:row.CANALIZACION,instance:row.INSTANCIA,tutor:row.TUTOR_NOTIFICADO,emptyA:hasBitacoraChannel({type:'A',data:{a_channel:[]}})};
  });
  assert(out.channel===false&&out.emptyA===false,'Una opción negativa o lista vacía se interpretó como canalización');
  assert(out.status==='en seguimiento'&&out.migratedStatus==='en seguimiento'&&out.light==='amarillo','La Ruta C quedó roja/canalizada sin causa');
  assert(out.exportChannel==='no'&&out.instance===''&&out.tutor==='no localizado',`La exportación contradice los datos capturados: ${JSON.stringify(out)}`);
});

await test('Bitácora sincroniza seguimiento y booleanos heredados sin datos obsoletos',async()=>{
  await resetState();
  const out=await page.evaluate(()=>{
    const report=normalizeBitacoraReport({id:7,type:'B',status:'',studentIds:[1,1],data:{b_student:1,b_followup_date:'',b_followup_responsible:''},followUp:{date:'2099-12-31',responsible:'Responsable anterior',notes:'Conservar nota'}});
    const incoming=emptyDb(); incoming.config={school:'Escuela entrante',teacher:'Docente entrante',group:'2°A'};
    incoming.group.bitacoraReports=[{id:'legacy-context',type:'B',studentIds:[1],data:{b_student:1}}];
    const contextual=safeDb(incoming).group.bitacoraReports[0];
    return {
      id:report.id,studentIds:report.studentIds,followUp:report.followUp,status:report.status,
      contextual:{school:contextual.institutional.school,reporter:contextual.reporter.name,responsible:contextual.followUp.responsible},
      riskNo:getAbsenceRiskC({c_absences_auto:[],c_no_response:'no',c_contact_medium:'llamada',c_risk:'bajo'}),
      riskYes:getAbsenceRiskC({c_absences_auto:[],c_no_response:'sí',c_contact_medium:'llamada',c_risk:'bajo'}),
      strayChannel:hasBitacoraChannel({type:'B',data:{a_channel:['Dirección escolar'],c_channel:'dirección'}})
    };
  });
  assert(out.id==='7'&&out.studentIds.join(',')==='1','Los IDs heredados no se normalizaron');
  assert(out.followUp.date===''&&out.followUp.responsible===''&&out.followUp.notes==='Conservar nota'&&out.status==='abierto','Reapareció un seguimiento ya borrado');
  assert(out.contextual.school==='Escuela entrante'&&out.contextual.reporter==='Docente entrante'&&out.contextual.responsible==='Docente entrante','Un reporte heredó la identidad de otra instalación durante la restauración');
  assert(out.riskNo==='verde'&&out.riskYes==='rojo'&&!out.strayChannel,'Los valores sí/no o campos de otra ruta contaminaron el semáforo');
});

await test('Bitácora permite limpiar campos, casillas y borrador cancelado',async()=>{
  await resetState();
  const out=await page.evaluate(()=>{
    bitacoraDraft={id:'draft-b',folio:'BPF-2026-0001',type:'B',route:'B',status:'borrador',reporter:{name:'QA',role:'docente',source:'observación directa'},eventDate:'2026-09-01',eventTime:'08:00',studentIds:['s1'],data:{b_student:'s1',b_repeat:'recurrente',b_prior:'Texto anterior',b_escalate:['lesión']}};
    bitacoraStep=2; currentScreen='bitacoraForm'; renderCurrentScreen();
    document.getElementById('b-prior').value='';
    collectBitStep();
    const text=bitacoraDraft.data.b_prior;
    bitacoraStep=1; renderCurrentScreen();
    document.querySelectorAll('input[name="b-escalate"]').forEach(el=>{el.checked=false;});
    collectBitStep();
    const cleared={text,checks:bitacoraDraft.data.b_escalate};
    wizDraftSave(); window.confirm=()=>true; document.getElementById('bit-cancel').click();
    return {...cleared,draftExists:localStorage.getItem(DRAFT_KEY)!==null};
  });
  assert(out.text===''&&Array.isArray(out.checks)&&out.checks.length===0,`Los valores borrados reaparecieron: ${JSON.stringify(out)}`);
  assert(out.draftExists===false,'Cancelar dejó un borrador capaz de resucitar');
});

await test('Bitácora valida periodos, exige alumno también en citatorio y conserva folios únicos',async()=>{
  await resetState();
  const out=await page.evaluate(()=>{
    bitacoraDraft={type:'C',data:{c_start:'2026-09-10',c_end:'2026-09-01'}}; bitacoraStep=1;
    const invalidPeriod=validateBitStep();
    db.group.students=[]; bitacoraDraft=null; currentScreen='bitacora'; startBitacora('CIT');
    const citBlocked=currentScreen==='students'&&bitacoraDraft===null;
    db.group.students=[{id:'s1',listNo:1,name:'Ana López',active:true,qr:'1G01'}];
    db.group.bitacoraMeta={schemaVersion:1,folioSeq:0}; db.group.bitacoraReports=[];
    bitacoraDraft={id:'folio-test',schemaVersion:3,folio:'BPF-2026-0001',type:'B',route:'B',status:'borrador',trafficLight:'gris',revision:1,versions:[],auditTrail:[],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),date:'2026-09-01',time:'08:00',eventDate:'2026-09-01',eventTime:'08:00',institutional:buildBitacoraInstitutionalSnapshot(),reporter:{name:'QA',role:'docente',source:'observación directa'},studentIds:['s1'],data:{b_student:'s1',b_status:'en seguimiento',b_followup_date:'2099-01-01'},followUp:{date:'2099-01-01',responsible:'QA',notes:''},documentText:'Prueba'};
    saveBitacoraDraft('none');
    const persisted=JSON.parse(localStorage.getItem(KEY));
    const storedSeq=persisted.group.bitacoraMeta.folioSeq;
    db=safeDb(persisted);
    const next=bitacoraFolio();
    return {invalidPeriod,citBlocked,storedSeq,next};
  });
  assert(out.invalidPeriod===false,'Se aceptó un periodo invertido');
  assert(out.citBlocked,'Se inició un citatorio imposible sin alumnos');
  assert(out.storedSeq===1&&out.next.endsWith('0002'),`El consecutivo de folio se perdió al recargar: ${JSON.stringify(out)}`);
});

await test('Las cuatro rutas generan documento y B/C conservan lenguaje propio',async()=>{
  await resetState();
  const out=await page.evaluate(()=>{
    const base={schemaVersion:3,status:'en seguimiento',date:'2026-09-01',time:'08:00',eventDate:'2026-09-01',eventTime:'08:00',institutional:buildBitacoraInstitutionalSnapshot(),reporter:{name:'QA',role:'docente',source:'observación directa'},studentIds:['s1'],followUp:{date:'2099-01-01',responsible:'QA',notes:''}};
    const reports=[
      {...base,id:'a',folio:'BPF-2026-0101',type:'A',data:{a_victim:'s1',a_subtype:'verbal/lenguaje',a_severity:'leve',a_channel:[]}},
      {...base,id:'b',folio:'BPF-2026-0102',type:'B',data:{b_student:'s1',b_subtype:'desobediencia',b_conduct:'Interrumpió la actividad.',b_escalate:['lesión'],b_followup_date:'2099-01-01'}},
      {...base,id:'c',folio:'BPF-2026-0103',type:'C',data:{c_student:'s1',c_start:'2026-09-01',c_end:'2026-09-02',c_channel:'no',c_followup_date:'2099-01-01'}},
      {...base,id:'cit',folio:'BPF-2026-0104',type:'CIT',data:{cit_student:'s1',cit_tutor:'Tutor',cit_date:'2026-09-20',cit_time:'09:00',cit_place:'Dirección'}}
    ];
    const docs=reports.map(buildBitacoraDocument);
    return {lengths:docs.map(x=>x.length),bForbidden:/violencia|víctima|agresor|receptor|generador/i.test(docs[1]),cForbidden:/violencia|víctima|agresor|receptor|generador/i.test(docs[2]),titles:docs.map(x=>x.split('\n')[0])};
  });
  assert(out.lengths.every(n=>n>500),'Alguna ruta produjo un documento incompleto');
  assert(!out.bForbidden&&!out.cForbidden,'Ruta B o C heredó lenguaje reservado para Ruta A');
  assert(new Set(out.titles).size===4,'Las rutas no conservaron documentos diferenciados');
});

await test('Dictado revisa, limpia y deshace sin perder el texto original',async()=>{
  await resetState();
  const out=await page.evaluate(()=>{
    const host=document.getElementById('screen-host');
    host.innerHTML='<textarea id="dict-test">hola hola mundo</textarea><button data-clear-text="dict-test">Borrar</button>';
    reviewBitText('dict-test');
    const reviewed=document.getElementById('dict-test').value;
    undoBitText('dict-test');
    const undone=document.getElementById('dict-test').value;
    bindMicButtons(); window.confirm=()=>true; document.querySelector('[data-clear-text="dict-test"]').click();
    const cleared=document.getElementById('dict-test').value;
    undoBitText('dict-test');
    return {reviewed,undone,cleared,restored:document.getElementById('dict-test').value};
  });
  assert(out.reviewed==='Hola mundo.'&&out.undone==='hola hola mundo','Revisar/deshacer alteró el sentido original');
  assert(out.cleared===''&&out.restored==='hola hola mundo','Borrar/deshacer perdió el dictado');
});

await test('Un documento corrupto no causa restauración parcial ni pérdida local',async()=>{
  await resetState();
  const out=await page.evaluate(async()=>{
    await documentsClear();
    const originalBlob=new Blob(['original'],{type:'text/plain'});
    await documentsPut({id:'original-doc',category:'propios',name:'original.txt',type:'text/plain',size:originalBlob.size,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),blob:originalBlob});
    const incoming=emptyDb(); incoming.config={school:'Escuela ajena',cct:'OTRA',teacher:'Otro',cycle:'2026-2027',group:'2°A'};
    const backup={format:PROFEQR_BACKUP_FORMAT,version:2,data:{db:incoming,bitacoraDraft:null,documents:[{id:'valid',name:'valid.txt',dataUrl:'data:text/plain;base64,dmFsaWQ='},{id:'broken',name:'broken.txt',dataUrl:'contenido-invalido'}]}};
    let error=''; try{ await restoreProfeQrBackupObject(backup); }catch(e){ error=e.message; }
    const docs=await documentsList();
    let atomicError='';
    try{ await documentsReplaceAll([{id:'bad-doc',category:'propios',name:'bad.txt',blob:new Blob(['bad']),notCloneable:()=>true}]); }catch(e){ atomicError=e.name||e.message; }
    const afterAtomic=await documentsList();
    let shapeError=''; try{ await restoreProfeQrBackupObject({format:PROFEQR_BACKUP_FORMAT,version:1,data:{db:[]}}); }catch(e){ shapeError=e.message; }
    return {error,atomicError,shapeError,school:db.config.school,persistedSchool:JSON.parse(localStorage.getItem(KEY)).config.school,docIds:docs.map(d=>d.id),afterAtomicIds:afterAtomic.map(d=>d.id)};
  });
  assert(out.error&&out.school==='Auditoría QA'&&out.persistedSchool==='Auditoría QA','La base quedó parcialmente restaurada');
  assert(out.docIds.length===1&&out.docIds[0]==='original-doc','La biblioteca local se borró antes de validar');
  assert(out.atomicError&&out.afterAtomicIds.length===1&&out.afterAtomicIds[0]==='original-doc','Una escritura inválida confirmó el borrado parcial de documentos');
  assert(out.shapeError&&out.school==='Auditoría QA','Un respaldo sin estructura válida pudo reemplazar los datos');
});

await test('Restauración migra PIN antiguo y vuelve a validar la licencia local',async()=>{
  await resetState();
  const pin=await page.evaluate(async()=>{
    const incoming=emptyDb();
    incoming.config={school:'Restaurada',cct:'11TEST0001X',teacher:'QA',cycle:'2026-2027',group:'1°G',pin:'2468'};
    await restoreProfeQrBackupObject(incoming);
    return {verified:await verifyPinCredential('2468'),plain:db.config.pin||'',hashed:!!db.config.pinHash};
  });
  assert(pin.verified&&pin.plain===''&&pin.hashed,'El PIN legado quedó en claro o dejó de funcionar');

  await resetState();
  const license=await page.evaluate(async()=>{
    db.config.license={token:'PQ1.token-invalido.firma-invalida'};
    db.config.licenseLegacyGrandfathered=false;
    licenseRuntime={checked:true,valid:true,mode:'signed',reason:'stale',payload:{expiresAt:'2099-01-01'}};
    saveDb({system:true});
    const incoming=emptyDb(); incoming.config={school:'Restaurada',cct:'OTRA',teacher:'QA',cycle:'2026-2027',group:'1°G'};
    await restoreProfeQrBackupObject({format:PROFEQR_BACKUP_FORMAT,version:1,data:{db:incoming,bitacoraDraft:null}});
    return {valid:licenseRuntime.valid,checked:licenseRuntime.checked,mode:licenseRuntime.mode,tokenPreserved:!!db.config.license?.token};
  });
  assert(license.checked&&!license.valid&&license.mode==='signed'&&license.tokenPreserved,'La restauración dejó una licencia obsoleta marcada como válida');
});

await test('Todas las pantallas principales renderizan y Documentos abre el módulo correcto',async()=>{
  await resetState();
  const out=await page.evaluate(async()=>{
    const screens=['home','agenda','cte','guardias','biblioteca','students','attendance','works','bitacora','cards','reports','settings','documents'];
    const rendered=[];
    for(const screen of screens){ currentScreen=screen; renderCurrentScreen(); rendered.push({screen,text:(document.getElementById('screen-host').innerText||'').trim().length}); }
    currentScreen='home'; renderCurrentScreen();
    const docs=[...document.querySelectorAll('.dash11-chip')].find(btn=>btn.textContent.includes('Documentos'));
    const route=docs?.dataset.go||'';
    await new Promise(resolve=>setTimeout(resolve,100));
    return {rendered,route};
  });
  assert(out.rendered.every(x=>x.text>0),`Pantalla vacía: ${out.rendered.filter(x=>!x.text).map(x=>x.screen).join(', ')}`);
  assert(out.route==='documents','El acceso rápido Documentos todavía apunta a Biblioteca');
});

await test('Respaldos con IDs numéricos o manipulados conservan controles operables',async()=>{
  await resetState();
  const out=await page.evaluate(()=>{
    const hostileId='s\" data-injected=\"yes';
    db.config.logo='x\" onerror=\"window.__logoInjected=1';
    db.group.students=[{id:hostileId,listNo:1,name:'Alumno QA',active:true,qr:'QA01'}];
    db.group.agenda=[{id:101,title:'Evento legado',date:today(),status:'pendiente'}];
    db.group.cteAgreements=[{id:202,description:'Acuerdo legado',dueDate:today(),status:'pendiente',autoAgenda:false}];
    db.group.guardCommissions=[{id:303,title:'Guardia legada',date:today(),autoAgenda:false}];
    db.group.libraryResources=[{id:404,title:'Recurso legado',section:'Mi biblioteca'}];
    db.group.works=[{id:505,date:today(),title:'Trabajo legado',studentId:hostileId,score:2}];
    db.group.bitacoraReports=[{id:606,type:'B',studentIds:[hostileId],data:{b_student:hostileId}}];
    db=safeDb(db);
    currentScreen='cte'; renderCurrentScreen(); document.querySelector('[data-cte-done="202"]')?.click();
    const cteDone=db.group.cteAgreements[0]?.status;
    agendaViewDate=today(); agendaTab='week'; currentScreen='agenda'; renderCurrentScreen(); document.querySelector('[data-ag-done="101"]')?.click();
    const agendaDone=db.group.agenda.find(event=>event.id==='101')?.status;
    currentScreen='students'; renderCurrentScreen();
    return {
      types:[db.group.agenda[0]?.id,db.group.cteAgreements[0]?.id,db.group.guardCommissions[0]?.id,db.group.libraryResources[0]?.id,db.group.works[0]?.id,db.group.bitacoraReports[0]?.id].map(value=>typeof value),
      cteDone,agendaDone,studentIds:db.group.bitacoraReports[0]?.studentIds,
      injected:!!document.querySelector('[data-injected]'),safeLogo:db.config.logo
    };
  });
  assert(out.types.every(type=>type==='string')&&out.studentIds[0]==='s\" data-injected=\"yes','Los IDs restaurados conservaron tipos incompatibles');
  assert(out.cteDone==='cumplido'&&out.agendaDone==='hecho','Los controles no localizaron registros restaurados');
  assert(!out.injected&&out.safeLogo==='','Un ID o logo restaurado pudo inyectar atributos en la interfaz');
});

await test('No hubo errores JavaScript fatales durante la auditoría',async()=>{
  assert(pageErrors.length===0,pageErrors.join('\n'));
});

await browser.close();
const failed=results.filter(result=>!result.ok);
console.log(`\nStability audit: ${results.length-failed.length}/${results.length} tests passed.`);
if(failed.length) process.exit(1);
