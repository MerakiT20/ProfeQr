import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=dirname(dirname(fileURLToPath(import.meta.url)));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://127.0.0.1');
    if(!url.pathname.startsWith('/ProfeQr/')){ res.writeHead(404); res.end('Not found'); return; }
    let relative=decodeURIComponent(url.pathname.slice('/ProfeQr/'.length))||'index.html';
    relative=normalize(relative).replace(/^(\.\.[/\\])+/, '');
    let file=join(root,relative);
    if((await stat(file)).isDirectory()) file=join(file,'index.html');
    const body=await readFile(file);
    res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
    res.end(body);
  }catch(error){ res.writeHead(error?.code==='ENOENT'?404:500); res.end('Not found'); }
});

await new Promise((resolve,reject)=>{ server.once('error',reject); server.listen(0,'127.0.0.1',resolve); });
const address=server.address();
const origin=`http://127.0.0.1:${address.port}`;
const appUrl=`${origin}/ProfeQr/index.html`;
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:412,height:915}});
const page=await context.newPage();
const pageErrors=[];
const external=[];
page.on('pageerror',error=>pageErrors.push(String(error?.stack||error)));
page.on('request',request=>{
  const url=new URL(request.url());
  if(/^https?:$/.test(url.protocol)&&url.origin!==origin) external.push(request.url());
});

let failure=null;
try{
  const response=await page.goto(appUrl,{waitUntil:'networkidle'});
  if(!response?.ok()) throw new Error(`HTTP ${response?.status()}`);
  const serviceWorker=await page.evaluate(async()=>{
    const registration=await navigator.serviceWorker.ready;
    return {scope:registration.scope,cacheNames:await caches.keys()};
  });
  if(!serviceWorker.scope.endsWith('/ProfeQr/')) throw new Error(`Scope incorrecto: ${serviceWorker.scope}`);
  if(!serviceWorker.cacheNames.includes('profeqr-v8-8-stable')) throw new Error(`Caché estable ausente: ${serviceWorker.cacheNames.join(', ')}`);
  if(external.length) throw new Error(`La instalación solicitó recursos externos: ${external.join(', ')}`);

  await page.evaluate(async()=>{
    const {jsPDF}=window.jspdf;
    const pdf=new jsPDF(); pdf.text('ProfeQr subpath offline',20,20);
    const blob=new Blob([pdf.output('arraybuffer')],{type:'application/pdf'});
    await documentsPut({id:'subpath-pdf',category:'propios',name:'subpath.pdf',type:'application/pdf',size:blob.size,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),blob});
  });

  await context.setOffline(true);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForSelector('#root');
  if(!(await page.locator('#root').innerText()).trim()) throw new Error('La app quedó vacía sin conexión');
  await page.evaluate(()=>openStoredDocument('subpath-pdf'));
  await page.waitForSelector('#document-modal canvas',{timeout:20000});
  if(pageErrors.length) throw new Error(pageErrors.join('\n'));
  console.log('PASS  PWA funciona offline bajo /ProfeQr/ y PDF.js encuentra su worker local');
}catch(error){
  failure=error;
  console.error(`FAIL  PWA bajo subruta — ${error?.stack||error}`);
}finally{
  await context.setOffline(false).catch(()=>{});
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
}

if(failure) process.exit(1);
