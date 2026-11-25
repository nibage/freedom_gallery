// Optional offline launcher: serve only index.html to the local machine.
// It never serves photos, metadata, indexes, or directories. Media access still
// goes through the browser's explicit File System Access folder picker.
'use strict';
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {spawn}=require('node:child_process');

const HOST='127.0.0.1';
const APP_DIR=path.resolve(__dirname);
const ID=crypto.createHash('sha256').update(APP_DIR.toLocaleLowerCase('en-US')).digest('hex').slice(0,16);
const PORT=22000+(parseInt(ID.slice(0,8),16)%30000);
const APP_URL='http://'+HOST+':'+PORT+'/';
const INDEX=path.join(APP_DIR,'index.html');

function openBrowser(){
  if(process.argv.includes('--no-open')||process.env.FREEDOM_GALLERY_NO_OPEN==='1')return;
  const platform=process.platform;
  const cmd=platform==='win32'?'explorer.exe':platform==='darwin'?'open':'xdg-open';
  try{
    const child=spawn(cmd,[APP_URL],{detached:true,stdio:'ignore',windowsHide:true});
    child.on('error',e=>console.warn('Could not open browser automatically:',e.message,'Open',APP_URL));
    child.unref();
  }catch(e){console.warn('Open the browser at',APP_URL,'('+e.message+')')}
}
const server=http.createServer((req,res)=>{
  res.setHeader('X-Freedom-Gallery-Instance',ID);
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('Cache-Control','no-store');
  if(req.headers.host!==HOST+':'+PORT){res.writeHead(403);res.end('Forbidden');return;}
  let route;
  try{route=new URL(req.url,APP_URL).pathname}catch(_){res.writeHead(400);res.end('Bad request');return;}
  if(req.method!=='GET'||!(route==='/'||route==='/index.html')){
    res.writeHead(404);res.end('Not found');return;
  }
  const stream=fs.createReadStream(INDEX);
  stream.once('open',()=>{
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
    stream.pipe(res);
  });
  stream.once('error',error=>{
    console.error('Could not read index.html:',error.message);
    if(!res.headersSent)res.writeHead(500);
    res.end('Cannot read gallery');
  });
});
server.on('error',async error=>{
  if(error.code==='EADDRINUSE'){
    // Reuse an existing launcher only when its unique directory ID matches.
    try{
      const answer=await fetch(APP_URL,{signal:AbortSignal.timeout(2000)});
      if(answer.headers.get('X-Freedom-Gallery-Instance')===ID){
        console.log('Freedom Gallery is already running:',APP_URL);
        openBrowser();
        process.exitCode=0;
        return;
      }
    }catch(_){}
    console.error('Port '+PORT+' is busy with a different application. Close it and retry.');
  }else console.error('Cannot start local gallery:',error.message);
  process.exitCode=1;
});
server.listen(PORT,HOST,()=>{
  console.log('Freedom Gallery offline launcher is ready:',APP_URL);
  console.log('Local-only: this server exposes index.html, not your photo library.');
  console.log('Close this window / press Ctrl+C when you are finished.');
  openBrowser();
});
