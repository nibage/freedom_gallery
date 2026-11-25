// Browser integration check: real gallery UI + real activation/index/scan code.
// Only the filesystem picker and its disposable demo folder are mocked.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootPath=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const demoDir=join(rootPath,'demo-gallery');
const html=await readFile(join(rootPath,'__gallery','index.html'));
const files={};
async function collect(dir){
  for(const entry of await readdir(dir,{withFileTypes:true})){
    const full=join(dir,entry.name);
    if(entry.isDirectory())await collect(full);
    else if(entry.isFile())files[relative(demoDir,full).replaceAll('\\','/')]=await readFile(full,'utf8');
  }
}
await collect(demoDir);
const images=Object.keys(files).filter(p=>/\.svg$/i.test(p));
if(images.length<12)throw Error('Demo gallery must have at least 12 SVGs');

const server=createServer((req,res)=>{
  if(req.url!=='/'&&req.url!=='/index.html'){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
  res.end(html);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});

async function setup(permission,withSecond=false){
  const context=await browser.newContext({viewport:{width:2048,height:1080}});
  const page=await context.newPage();
  await page.addInitScript(({contents,permission,withSecond})=>{
    class MockFile{
      kind='file';
      constructor(name,text){this.name=name;this.text=text;this.lastModified=1731000000000;}
      async getFile(){return new File([this.text],this.name,{type:/\.svg$/i.test(this.name)?'image/svg+xml':'text/plain',lastModified:this.lastModified});}
      async createWritable(){const self=this;return {async write(s){self.text=String(s)},async close(){}};}
    }
    class MockDir{
      kind='directory';
      constructor(name){this.name=name;this.nodes=new Map();}
      async getDirectoryHandle(name,opts={}){
        let node=this.nodes.get(name);
        if(!node&&opts.create){node=new MockDir(name);this.nodes.set(name,node);}
        if(!node||node.kind!=='directory')throw new DOMException('Directory not found','NotFoundError');
        return node;
      }
      async getFileHandle(name,opts={}){
        let node=this.nodes.get(name);
        if(!node&&opts.create){node=new MockFile(name,'');this.nodes.set(name,node);}
        if(!node||node.kind!=='file')throw new DOMException('File not found','NotFoundError');
        return node;
      }
      async removeEntry(name){this.nodes.delete(name);}
      async *entries(){yield* this.nodes.entries();}
      async isSameEntry(other){return this===other;}
      async resolve(other){return this===other?[]:null;}
      async queryPermission(){return window.__permission;}
      async requestPermission(){window.__requests++;return 'granted';}
    }
    const makeDemo=()=>{
      const root=new MockDir('demo-gallery');
      for(const [path,text] of Object.entries(contents)){
        const parts=path.split('/'),name=parts.pop();let dir=root;
        for(const segment of parts){
          let next=dir.nodes.get(segment);
          if(!next){next=new MockDir(segment);dir.nodes.set(segment,next);}
          dir=next;
        }
        dir.nodes.set(name,new MockFile(name,text));
      }
      return root;
    };
    window.__root=makeDemo();
    window.__second=makeDemo();
    window.__permission=permission;
    window.__requests=0;
    window.__hasSecond=withSecond;
    Object.defineProperty(window,'showDirectoryPicker',{configurable:true,value:async()=>window.__root});
  },{contents:files,permission,withSecond});
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(250);
  await page.evaluate(async()=>{
    const records=[{id:'last',name:window.__root.name,handle:window.__root,lastUsed:100}];
    if(window.__hasSecond)records.push({id:'other',name:'Other demo',handle:window.__second,lastUsed:50});
    window.getRecentLibraries=async()=>records;
    await restoreRecents();
  });
  return {context,page};
}
async function waitForMedia(page){
  await page.waitForFunction(()=>document.querySelectorAll('#gallery .photo').length>=12,null,{timeout:25000});
  assert.ok(await page.locator('#gallery .photo').count()>=12,'Real gallery scan must render photo cards');
  assert.equal(await page.locator('#libraryName').textContent(),'demo-gallery');
}
try{
  // 1: Permission already granted: auto-loads and selects the library.
  {
    const {context,page}=await setup('granted');
    await waitForMedia(page);
    assert.equal(await page.locator('#recentFolders').inputValue(),'last');
    assert.equal(await page.locator('#reconnectLibrary').isHidden(),true);
    console.log('PASS browser: granted remembered folder auto-opens and renders media');
    await context.close();
  }

  // 2: Expired permission: library is displayed and ↻ reopens real media.
  {
    const {context,page}=await setup('prompt');
    assert.equal(await page.locator('#recentFolders').inputValue(),'last');
    assert.equal(await page.locator('#reconnectLibrary').isVisible(),true);
    assert.match(await page.locator('#status').textContent(),/Permission needed/);
    assert.equal(await page.locator('#gallery .photo').count(),0);
    await page.locator('#reconnectLibrary').click();
    await waitForMedia(page);
    assert.ok(await page.evaluate(()=>window.__requests)>=1);
    console.log('PASS browser: pending folder reconnect loads real gallery via user click');
    await context.close();
  }

  // 3: Selecting another saved folder in the native dropdown triggers loading.
  {
    const {context,page}=await setup('prompt',true);
    assert.equal(await page.locator('#recentFolders').inputValue(),'last');
    await page.locator('#recentFolders').selectOption('other');
    await waitForMedia(page);
    assert.ok(await page.evaluate(()=>window.__requests)>=1);
    console.log('PASS browser: dropdown change invokes real gallery activation');
    await context.close();
  }
}finally{
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
