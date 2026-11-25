import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';

const gallery=resolve(dirname(fileURLToPath(import.meta.url)),'../__gallery');
const id=createHash('sha256').update(gallery.toLocaleLowerCase('en-US')).digest('hex').slice(0,16);
const port=22000+(parseInt(id.slice(0,8),16)%30000);
const url='http://127.0.0.1:'+port+'/';
const serverPath=new URL('../__gallery/gallery-local-server.cjs',import.meta.url);
const html=readFileSync(new URL('../__gallery/index.html',import.meta.url),'utf8');

async function get(path,host){
  return new Promise((resolve,reject)=>{
    http.get({hostname:'127.0.0.1',port,path,headers:host?{Host:host}:{}},res=>{
      const chunks=[];
      res.on('data',x=>chunks.push(x));
      res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body:Buffer.concat(chunks).toString()}));
    }).on('error',reject);
  });
}
async function untilServerStarts(proc){
  for(let i=0;i<100;i++){
    if(proc.exitCode!==null)throw Error('Offline server stopped unexpectedly: '+proc.exitCode);
    try{
      const res=await get('/');
      if(res.status===200)return;
    }catch(_){}
    await new Promise(r=>setTimeout(r,70));
  }
  throw Error('Offline gallery did not begin listening on loopback');
}

test('offline launcher serves exactly index.html from a stable private loopback origin', {timeout:20000},async()=>{
  const proc=spawn(process.execPath,[fileURLToPath(serverPath),'--no-open'],{
    env:{...process.env,FREEDOM_GALLERY_NO_OPEN:'1'},stdio:['ignore','pipe','pipe']
  });
  let stderr='';proc.stderr.on('data',b=>stderr+=b.toString());
  try{
    await untilServerStarts(proc);
    const first=await get('/'),second=await get('/index.html');
    assert.equal(first.status,200,stderr);
    assert.equal(second.status,200);
    assert.equal(first.body,html);
    assert.equal(second.body,html);
    assert.equal(first.headers['x-freedom-gallery-instance'],id);
    assert.equal(first.headers['cache-control'],'no-store');
    assert.equal((await get('/data/favorites.txt')).status,404,'Never serve user metadata');
    assert.equal((await get('/gallery-local-server.cjs')).status,404,'Never serve helper code');
    assert.equal((await get('/photos/2026/personal.jpg')).status,404,'Never serve photos');
    assert.equal((await get('/','malicious.example')).status,403,'Require loopback host header');
    assert.ok(url.includes('127.0.0.1'));
  }finally{
    proc.kill('SIGTERM');
    if(proc.exitCode===null)await new Promise(resolve=>proc.once('exit',resolve));
  }
});

test('launcher URL is deterministic per local gallery folder',()=>{
  assert.equal(port,22000+(parseInt(createHash('sha256').update(gallery.toLocaleLowerCase('en-US')).digest('hex').slice(0,8),16)%30000));
  assert.ok(port>=22000&&port<52000);
});
