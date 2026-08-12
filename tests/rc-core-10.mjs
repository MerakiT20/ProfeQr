import { chromium } from 'playwright';

const BASE = process.env.PROFEQR_TEST_URL || 'http://127.0.0.1:4173';
const results = [];
function ok(name, detail='') { results.push({name,ok:true,detail}); console.log(`PASS  ${name}${detail?` — ${detail}`:''}`); }
function fail(name, err) { results.push({name,ok:false,detail:String(err?.message||err)}); console.error(`FAIL  ${name} — ${err?.stack||err}`); }
async function test(name, fn){ try{ await fn(); ok(name); }catch(e){ fail(name,e); } }
function assert(cond,msg='Assertion failed'){ if(!cond) throw new Error(msg); }

const browser = await chromium.launch({headless:true});
const context = await browser.newContext({viewport:{width:412,height:915}});
const page = await context.newPage();
const pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e?.stack||e)));
page.on('console',m=>{ if(m.type()==='error') console.error('BROWSER:',m.text()); });

await test('App shell boots without fatal error', async()=>{
  const r=await page.goto(BASE,{waitUntil:'networkidle'});
  assert(r && r.ok(),`HTTP ${r?.status()}`);
  await page.waitForSelector('#root');
  const text=(await page.locator('#root').innerText()).trim();
  assert(text.length>0,'Root rendered empty');
  assert(pageErrors.length===0,`Page errors: ${pageErrors.join('\n')}`);
});

await test('Critical local assets are available', async()=>{
  const assets=[
    '/manifest.json','/styles.css','/js/core.js','/js/bootstrap.js','/js/documents.js','/js/backup.js',
    '/vendor/html5-qrcode.min.js','/vendor/qrcode.min.js','/vendor/chart.umd.min.js','/vendor/xlsx.bundle.min.js','/vendor/jspdf.umd.min.js',
    '/vendor/pdfjs/pdf.mjs','/vendor/pdfjs/pdf.worker.mjs'
  ];
  const bad=[];
  for(const p of assets){ const r=await page.request.get(BASE+p); if(!r.ok()) bad.push(`${p}:${r.status()}`); }
  assert(!bad.length,`Missing assets: ${bad.join(', ')}`);
});

await test('Service worker installs and app reloads offline', async()=>{
  await page.evaluate(async()=>{ if(!('serviceWorker' in navigator)) throw new Error('Service worker unavailable'); await navigator.serviceWorker.ready; });
  await context.setOffline(true);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForSelector('#root');
  assert((await page.locator('#root').innerText()).trim().length>0,'Offline root empty');
  await context.setOffline(false);
});

await test('Local date helper returns local calendar date', async()=>{
  const out=await page.evaluate(()=>({today:today(),expected:(()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;})()}));
  assert(out.today===out.expected,`${out.today} != ${out.expected}`);
});

await test('Student re-import preserves stable IDs and history links', async()=>{
  const out=await page.evaluate(()=>{
    db=emptyDb();
    db.config={school:'RC Test',cct:'11TEST0001X',teacher:'QA',director:'',zone:'',sector:'',municipality:'León',address:'',cycle:'2026-2027',level:'Telesecundaria',grade:'1°',shift:'Vespertino',section:'G',group:'1°G',theme:'professional',licenseLegacyGrandfathered:true};
    db.group.students=[{id:'student-stable',listNo:1,name:'Ana López',active:true,qr:'1G01'},{id:'student-old',listNo:2,name:'Alumno Baja',active:true,qr:'1G02'}];
    db.group.attendance={'2026-08-11':[{studentId:'student-stable',date:'2026-08-11'}]};
    const m=mergeImportedStudents([{listNo:5,name:'Ana López'},{listNo:6,name:'Alumno Nuevo'}]);
    const ana=m.students.find(s=>s.name==='Ana López');
    const old=m.students.find(s=>s.id==='student-old');
    return {anaId:ana?.id,anaList:ana?.listNo,oldActive:old?.active,newCount:m.stats.created,historyId:db.group.attendance['2026-08-11'][0].studentId};
  });
  assert(out.anaId==='student-stable','Existing ID changed');
  assert(out.anaList===5,'List number did not update');
  assert(out.oldActive===false,'Missing student was not suspended');
  assert(out.newCount===1,'New student was not detected');
  assert(out.historyId==='student-stable','Historical link changed');
});

await test('PIN is hashed and verification works', async()=>{
  const out=await page.evaluate(async()=>{
    db=emptyDb();
    db.config={school:'RC Test',cct:'11TEST0001X',teacher:'QA',cycle:'2026-2027',level:'Telesecundaria',grade:'1°',shift:'Vespertino',section:'G',group:'1°G',theme:'professional',licenseLegacyGrandfathered:true};
    await setPinCredential('4321');
    return {right:await verifyPinCredential('4321'),wrong:await verifyPinCredential('1234'),plain:db.config.pin||'',hash:db.config.pinHash||'',salt:db.config.pinSalt||'',iterations:db.config.pinIterations||0};
  });
  assert(out.right===true,'Correct PIN rejected');
  assert(out.wrong===false,'Wrong PIN accepted');
  assert(out.plain==='','Plain PIN remains stored');
  assert(out.hash.length>20 && out.salt.length>10,'Hash/salt missing');
  assert(out.iterations>=120000,'PBKDF2 iteration count too low');
});

await test('Expired license blocks persistence and rolls memory back', async()=>{
  const out=await page.evaluate(()=>{
    db=emptyDb();
    db.config={school:'RC Test',cct:'11TEST0001X',teacher:'QA',cycle:'2026-2027',level:'Telesecundaria',grade:'1°',shift:'Vespertino',section:'G',group:'1°G',theme:'professional'};
    db.group.students=[{id:'keep',listNo:1,name:'Persistido',active:true,qr:'1G01'}];
    licenseRuntime={checked:true,valid:true,mode:'legacy',reason:'legacy',payload:{expiresAt:'2027-07-30'}};
    saveDb({system:true});
    licenseRuntime={checked:true,valid:false,mode:'signed',reason:'expired',payload:{expiresAt:'2020-01-01'},message:'Vencida'};
    db.group.students.push({id:'illegal',listNo:2,name:'No debe quedar',active:true,qr:'1G02'});
    const saved=saveDb();
    return {saved,ids:db.group.students.map(s=>s.id)};
  });
  assert(out.saved===false,'Expired license allowed save');
  assert(!out.ids.includes('illegal'),'Blocked mutation remained in memory');
  assert(out.ids.includes('keep'),'Persisted state was lost');
});

await test('Backup v2 contains documents and restores them', async()=>{
  const out=await page.evaluate(async()=>{
    licenseRuntime={checked:true,valid:true,mode:'legacy',reason:'legacy',payload:{expiresAt:'2027-07-30'}};
    await documentsClear();
    const blob=new Blob(['documento de prueba'],{type:'text/plain'});
    await documentsPut({id:'qa-doc',category:'propios',name:'qa.txt',type:'text/plain',size:blob.size,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),blob});
    const backup=await buildProfeQrBackup();
    const countBefore=(await documentsList()).length;
    await documentsClear();
    const countEmpty=(await documentsList()).length;
    const restored=await restoreProfeQrBackupObject(backup);
    const docs=await documentsList();
    return {version:backup.version,backupDocs:backup.data.documents.length,countBefore,countEmpty,restored:restored.documentCount,docName:docs[0]?.name||'',licenseInBackup:!!backup.data.db?.config?.license};
  });
  assert(out.version===2,'Backup version is not 2');
  assert(out.backupDocs===1 && out.countBefore===1 && out.countEmpty===0,'Document backup cycle failed');
  assert(out.restored===1 && out.docName==='qa.txt','Document restore failed');
  assert(out.licenseInBackup===false,'License leaked into backup');
});

await test('PDF is rendered inside ProfeQr with PDF.js canvas', async()=>{
  await page.evaluate(async()=>{
    licenseRuntime={checked:true,valid:true,mode:'legacy',reason:'legacy',payload:{expiresAt:'2027-07-30'}};
    const {jsPDF}=window.jspdf;
    const pdf=new jsPDF();
    pdf.text('ProfeQr RC Core 10',20,20);
    pdf.addPage();
    pdf.text('Pagina 2',20,20);
    const bytes=pdf.output('arraybuffer');
    const blob=new Blob([bytes],{type:'application/pdf'});
    await documentsPut({id:'qa-pdf',category:'propios',name:'qa.pdf',type:'application/pdf',size:blob.size,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),blob});
    await openStoredDocument('qa-pdf');
  });
  await page.waitForSelector('#document-modal canvas',{timeout:20000});
  await page.waitForFunction(()=>document.querySelectorAll('#document-modal canvas').length>=2,null,{timeout:20000});
  const info=await page.evaluate(()=>({canvases:document.querySelectorAll('#document-modal canvas').length,iframe:!!document.querySelector('#document-modal iframe'),text:document.querySelector('#document-modal')?.innerText||''}));
  assert(info.canvases>=2,`Rendered ${info.canvases} PDF pages`);
  assert(info.iframe===false,'PDF fell back to iframe');
  await page.evaluate(()=>closeStoredDocumentViewer());
});

await test('Bitacora closed-report protection primitives are present', async()=>{
  const out=await page.evaluate(()=>({normalize:typeof normalizeBitacoraReport==='function',status:typeof buildReportStatus==='function',snapshot:typeof appendBitacoraVersion==='function'&&typeof appendBitacoraAudit==='function',save:typeof saveBitacoraDraft==='function'}));
  assert(out.normalize && out.status && out.save,'Bitacora core functions missing');
  assert(out.snapshot,'Bitacora version snapshot function missing');
});

await test('No fatal browser errors after test flows', async()=>{
  assert(pageErrors.length===0,`Page errors: ${pageErrors.join('\n')}`);
});

await browser.close();
const failed=results.filter(r=>!r.ok);
console.log(`\nRC Core 10: ${results.length-failed.length}/${results.length} tests passed.`);
if(failed.length){
  console.error('\nFailures:');
  for(const f of failed) console.error(`- ${f.name}: ${f.detail}`);
  process.exit(1);
}
