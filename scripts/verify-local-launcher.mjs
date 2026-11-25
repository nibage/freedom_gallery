// End-to-end: real gallery + real IndexedDB and browser-native directory
// handles. Serves only index.html on loopback, never private media.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir=resolve(dirname(fileURLToPath(import.meta.url)),'../__gallery');
const fingerprint=createHash('sha256').update(dir.toLocaleLowerCase('en-US')).digest('hex').slice(0,16);
const port=22000+(parseInt(fingerprint.slice(0,8),16)%30000);
const url='http://127.0.0.1:'+port+'/';
const server=spawn(process.execPath,[join(dir,'gallery-local-server.cjs'),'--no-open'],{
  env:{...process.env,FREEDOM_GALLERY_NO_OPEN:'1'},stdio:['ignore','pipe','pipe']
});
let serverErr='';
server.stderr.on('data',data=>serverErr+=String(data));
async function ready(){
  for(let i=0;i<120;i++){
    if(server.exitCode!==null)throw Error('Gallery server exited: '+serverErr);
    try{
      const res=await fetch(url);
      if(res.ok&&res.headers.get('X-Freedom-Gallery-Instance')===fingerprint)return;
    }catch(_){}
    await new Promise(r=>setTimeout(r,70));
  }
  throw Error('Gallery server never became ready: '+serverErr);
}
const temp=await mkdtemp(join(tmpdir(),'freedom-gallery-local-profile-'));
let context;
async function openSession(){
  context=await chromium.launchPersistentContext(join(temp,'chromium'),{
    headless:true,args:['--disable-dev-shm-usage'],
    viewport:{width:1440,height:900}
  });
  // A native OPFS directory handle is structured-cloned by IndexedDB. We mock
  // only the operating-system folder picker UI; not the handle or permissions.
  await context.addInitScript(()=>{
    Object.defineProperty(window,'showDirectoryPicker',{configurable:true,value:async()=>{
      const opfs=await navigator.storage.getDirectory();
      return opfs.getDirectoryHandle('Pictures-special',{create:true});
    }});
  });
  const page=context.pages()[0]||await context.newPage();
  await page.goto(url,{waitUntil:'domcontentloaded'});
  return page;
}
try{
  await ready();
  let page=await openSession();
  const seed=await page.evaluate(async()=>{
    const opfs=await navigator.storage.getDirectory();
    const root=await opfs.getDirectoryHandle('Pictures-special',{create:true});
    for(let i=0;i<12;i++){
      const file=await root.getFileHandle('demo-'+i+'.svg',{create:true});
      const writer=await file.createWritable();
      await writer.write('<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50"><rect width="50" height="50"/></svg>');
      await writer.close();
    }
    await chooseFolder();
    const entries=await getRecentLibraries();
    return {loaded:images.length,root:root.name,stored:entries.map(e=>({name:e.name,kind:e.handle?.kind})),
      selected:document.getElementById('recentFolders').value};
  });
  assert.equal(seed.loaded,12,JSON.stringify(seed));
  assert.deepEqual(seed.stored.map(x=>x.kind),['directory']);
  assert.ok(seed.selected.startsWith('lib-'));
  console.log('PASS: native OPFS directory saved and loaded from the offline localhost launcher');
  await context.close();context=null;

  // A new Chromium process/profile session, not merely page.reload().
  page=await openSession();
  await page.waitForFunction(()=>typeof images!=='undefined'&&images.length===12&&root?.name==='Pictures-special',
    null,{timeout:15000});
  // The gallery renders cards *before* the saved library handle is re-verified
  // and the dropdown repainted. Wait for the complete restoration transaction.
  await page.waitForFunction(()=>document.getElementById('recentFolders')?.value?.startsWith('lib-'),
    null,{timeout:10000});
  const restored=await page.evaluate(async()=>({
    name:root?.name,loaded:images.length,
    selected:document.getElementById('recentFolders').value,
    status:document.getElementById('status').textContent,
    stored:(await getRecentLibraries()).map(e=>({name:e.name,kind:e.handle?.kind}))
  }));
  assert.equal(restored.name,'Pictures-special');
  assert.equal(restored.loaded,12);
  assert.ok(restored.selected.startsWith('lib-'));
  assert.equal(restored.stored[0]?.kind,'directory');
  assert.match(restored.status,/loaded from index/);
  console.log('PASS: Chromium restart auto-restores native saved directory handle and 12 photos',JSON.stringify(restored));
}finally{
  if(context)await context.close();
  server.kill('SIGTERM');
  if(server.exitCode===null)await new Promise(resolve=>server.once('exit',resolve));
  await rm(temp,{recursive:true,force:true});
}
