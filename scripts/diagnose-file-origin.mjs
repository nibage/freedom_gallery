import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { mkdtemp, readFile, mkdir, copyFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const sourceRoot=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const testDir=await mkdtemp(join(tmpdir(),'freedom-gallery-file-scheme-'));
const libraryDir=join(testDir,'Pictures-special');
const appDir=join(libraryDir,'__gallery');
await mkdir(appDir,{recursive:true});
await copyFile(join(sourceRoot,'__gallery','index.html'),join(appDir,'index.html'));
const browserUrl=pathToFileURL(join(appDir,'index.html')).href;
const profile=join(testDir,'profile');
let context;
try {
  context=await chromium.launchPersistentContext(profile,{headless:true,args:['--disable-dev-shm-usage'],viewport:{width:1440,height:900}});
  const page=context.pages()[0]||await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',msg=>{if(msg.type()==='error') errors.push('console: '+msg.text())});
  await page.addInitScript(()=>{
    window.__pickerCount=0;
    Object.defineProperty(window,'showDirectoryPicker',{configurable:true,value:async()=>{
      window.__pickerCount++;
      const opfs=await navigator.storage.getDirectory();
      return opfs.getDirectoryHandle('Pictures-special',{create:true});
    }});
  });
  const print=async(label,fn)=>{
    try {console.log(label,JSON.stringify(await page.evaluate(fn)));}
    catch(e) {console.log(label,'ERROR',String(e).slice(0,1100))}
  };
  await page.goto(browserUrl,{waitUntil:'domcontentloaded',timeout:20000});
  console.log('FILE URL',browserUrl);
  await print('ORIGIN',()=>({href:location.href,origin:location.origin,protocol:location.protocol,
    secure:isSecureContext,indexedDB:!!window.indexedDB,showDirectoryPicker:typeof showDirectoryPicker,
    storageApi:typeof navigator.storage?.getDirectory,ls:(()=>{try{localStorage.setItem('gallery-probe','test');return localStorage.getItem('gallery-probe')}catch(e){return e.name+': '+e.message}})()}));
  await print('OPEN PREFS',async()=>{
    try{const db=await openPrefsDB();const stores=[...db.objectStoreNames];db.close();return {ok:true,dbName:PREFS_DB,stores}}
    catch(e){return {ok:false,name:e.name,message:e.message}}
  });
  await print('OPFS',async()=>{
    try{
      const root=await navigator.storage.getDirectory();
      const gallery=await root.getDirectoryHandle('Pictures-special',{create:true});
      for(let i=0;i<12;i++){
        const f=await gallery.getFileHandle('test-'+i+'.svg',{create:true});
        const writer=await f.createWritable();
        await writer.write('<svg xmlns="http://www.w3.org/2000/svg" width="25" height="25"><rect width="25" height="25" fill="#bbaa88"/></svg>');
        await writer.close();
      }
      const permission=await gallery.queryPermission({mode:'readwrite'});
      return {name:gallery.name,kind:gallery.kind,permission};
    }catch(e){return {error:e.name,message:e.message}}
  });
  await print('MANUAL OPEN',async()=>{
    try{
      await chooseFolder();
      return {root:root?.name,opened:!!root,recentLibraries:recentLibraries.map(e=>({id:e.id,name:e.name,kind:e.handle?.kind})),
        status:document.getElementById('status')?.textContent,
        selected:document.getElementById('recentFolders')?.value,
        optionNames:[...document.getElementById('recentFolders').options].map(x=>x.text),
        pickerCount:window.__pickerCount};
    }catch(e){return {error:e.name,message:e.message}}
  });
  await page.waitForTimeout(800);
  await print('AFTER PICK',async()=>({
    root:root?.name,images:images.length,status:document.getElementById('status')?.textContent,
    recents:recentLibraries.map(e=>({name:e.name,id:e.id,kind:e.handle?.kind})),
    dbRecents:await getRecentLibraries().then(rs=>rs.map(e=>({name:e.name,id:e.id,kind:e.handle?.kind}))).catch(e=>e.name+': '+e.message),
    selection:document.getElementById('recentFolders')?.value
  }));
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForTimeout(900);
  await print('AFTER RELOAD',async()=>({
    root:root?.name,images:images.length,status:document.getElementById('status')?.textContent,
    recents:recentLibraries.map(e=>({name:e.name,id:e.id,kind:e.handle?.kind})),
    dbRecents:await getRecentLibraries().then(rs=>rs.map(e=>({name:e.name,id:e.id,kind:e.handle?.kind}))).catch(e=>e.name+': '+e.message),
    selection:document.getElementById('recentFolders')?.value,
    query:await Promise.all(recentLibraries.map(async r=>r.handle?.queryPermission?
      await r.handle.queryPermission({mode:'readwrite'}).catch(e=>e.name+':'+e.message):'no method'))
  }));
  console.log('SCRIPT ERRORS',JSON.stringify(errors.slice(0,12)));

  // Compare a stable trustworthy HTTP localhost origin against file://, using
  // the exact same gallery HTML, browser context, native OPFS and IndexedDB.
  const source=await readFile(join(appDir,'index.html'));
  const httpServer=createServer((req,res)=>{
    res.writeHead(200,{'content-type':'text/html; charset=utf-8'});
    res.end(source);
  });
  await new Promise(resolve=>httpServer.listen(0,'127.0.0.1',resolve));
  try{
    const url='http://127.0.0.1:'+httpServer.address().port+'/';
    await page.goto(url,{waitUntil:'domcontentloaded'});
    await print('HTTP ORIGIN',()=>({origin:location.origin,protocol:location.protocol,secure:isSecureContext,idb:!!window.indexedDB}));
    await print('HTTP OPFS',async()=>{
      try{
        const opfs=await navigator.storage.getDirectory();
        const gallery=await opfs.getDirectoryHandle('Pictures-special',{create:true});
        for(let i=0;i<12;i++){
          const handle=await gallery.getFileHandle('photo-'+i+'.svg',{create:true});
          const writer=await handle.createWritable();
          await writer.write('<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30"><rect width="30" height="30"/></svg>');
          await writer.close();
        }
        return {kind:gallery.kind,name:gallery.name,write:await gallery.queryPermission({mode:'readwrite'})};
      }catch(e){return {error:e.name,message:e.message}}
    });
    await print('HTTP PICK',async()=>{
      try{
        await chooseFolder();
        return {root:root?.name,images:images.length,
          saved:await getRecentLibraries().then(rs=>rs.map(e=>({name:e.name,kind:e.handle?.kind})))};
      }catch(e){return {error:e.name,message:e.message}}
    });
    await page.waitForTimeout(900);
    await print('HTTP AFTER PICK',()=>({root:root?.name,images:images.length,status:document.getElementById('status')?.textContent,
      selected:document.getElementById('recentFolders')?.value}));
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForTimeout(900);
    await print('HTTP AFTER RELOAD',async()=>({root:root?.name,images:images.length,
      selected:document.getElementById('recentFolders')?.value,
      saved:await getRecentLibraries().then(rs=>rs.map(e=>({name:e.name,kind:e.handle?.kind}))).catch(e=>e.message),
      status:document.getElementById('status')?.textContent}));
  } finally {
    await new Promise(resolve=>httpServer.close(resolve));
  }
} finally {
 if(context)await context.close();
 await rm(testDir,{recursive:true,force:true});
}