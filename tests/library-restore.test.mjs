import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const html=readFileSync(new URL('../__gallery/index.html',import.meta.url),'utf8');
const js=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(js,'The gallery inline JavaScript is required');
const slice=(start,end)=>{
  const from=js.indexOf(start),to=js.indexOf(end,from);
  assert.ok(from>=0&&to>from,'Expected original gallery functions: '+start);
  return js.slice(from,to);
};
// Run the real production handlers, with only storage and actual disk I/O faked.
const handlers=slice('function renderRecents(){','async function forgetLibraries(){')
  +slice('async function openRemembered(entry,allowPrompt=true){','function navButtonActive(){');

class Select {
  constructor(){this.value='';this.options=[];this.hidden=true;this.title='';}
  replaceChildren(...args){this.options=[...args];this.value=args[0]?.value??'';}
  add(option){this.options.push(option);}
}

function harness({records=[],prompt='granted',permission='granted',error=null,failSave=false,nameHint='',lastRoot=null}={}){
  const status={title:''},retry={hidden:true,disabled:true,title:''},forget={hidden:true},dropdown=new Select();
  const nodes={recentFolders:dropdown,reconnectLibrary:retry,forget,status};
  const events=[],notices=[],saved=new Map(records.map(x=>[x.id,x]));
  let permissionResult=permission;
  let permissionError=error;
  function makeHandle(name='Pictures-special'){
    const h={kind:'directory',name,isSameEntry:async other=>h===other,
      queryPermission:()=>{events.push('query');return Promise.resolve(prompt);},
      requestPermission:()=>{events.push('request');if(permissionError)return Promise.reject(permissionError);return Promise.resolve(permissionResult);}
    };
    return h;
  }
  const picked=makeHandle();
  const env={
    el:id=>nodes[id],
    Option:class {constructor(text,value){this.text=text;this.value=value;}},
    window:{showDirectoryPicker:async()=>{events.push('picker');return picked;}},
    prefsOp:async(mode,fn)=>{
      if(mode==='readwrite'&&failSave)throw Error('IndexedDB write blocked');
      const store={
        put(item){saved.set(item.id,item);return {result:item};},
        delete(id){saved.delete(id);return {result:undefined};}
      };
      return fn(store)?.result;
    },
    getRecentLibraries:async()=>[...saved.values()].sort((a,b)=>b.lastUsed-a.lastUsed),
    rememberLibraryName:n=>{env.nameHint=n;},
    toast:message=>notices.push(message),
    setStatus:value=>{events.push('status:'+value);status.title=value;},
    confirmLibrarySelection:async()=>true,
    console:{warn:()=>{}},
    makeHandle,
    picked,
    nameHint,
    initialRecords:[...saved.values()],
    initialRoot:lastRoot,
    events,
    notices
  };
  const factory=new Function('env',
    'const {el,Option,window,prefsOp,getRecentLibraries,rememberLibraryName,toast,setStatus,confirmLibrarySelection,console}=env;'+
    "const MAX_RECENTS=5,PICKER_ID='test-picker';"+
    'let root=env.initialRoot,recentLibraries=env.initialRecords,selectedLibraryId=null,pendingLibraryId=null,libraryOpenToken=0,lastLibraryHint=env.nameHint;'+
    'let prefsAvailable=true;'+
    'let thumbResetting=false,deletingMedia=false;'+
    'async function activateLibrary(handle){env.events.push("activate:"+handle.name);root=handle;selectedLibraryId=null;pendingLibraryId=null;rememberLibraryName(handle.name);renderRecents();env.events.push("loaded:16 files");}'+
    handlers+
    ';return {renderRecents,rememberLibrary,openRemembered,restoreRecents,selectRememberedLibrary,chooseFolder,'+
    'getState:()=>({root,selectedLibraryId,pendingLibraryId,recentLibraries,lastLibraryHint,libraryOpenToken}),'+
    'setPermission:v=>env.setPermission(v),setHandleRoot:v=>{root=v},setNameHint:v=>{lastLibraryHint=v}}'
  );
  env.setPermission=value=>{permissionResult=value;permissionError=null;};
  const app=factory(env);
  return {app,env,picked,dropdown,retry,status,forget,events,notices,saved};
}

test('automatic startup actually activates most recent granted folder and selects its name',async()=>{
  const x=harness();
  const recent={id:'last',name:x.picked.name,handle:x.picked,lastUsed:123};
  x.saved.set(recent.id,recent);
  await x.app.restoreRecents();
  assert.ok(x.events.includes('query'),'startup must query browser permission');
  assert.ok(x.events.some(x=>x==='activate:Pictures-special'),'the real load path was invoked');
  assert.ok(x.events.includes('loaded:16 files'));
  assert.equal(x.dropdown.value,'last');
  assert.equal(x.dropdown.options.find(v=>v.value==='last')?.text,'Pictures-special');
  assert.equal(x.retry.hidden,true);
  assert.equal(x.app.getState().root,x.picked);
});

test('startup with prompt does not open media, but selects last name and exposes retry',async()=>{
  const x=harness({prompt:'prompt'});
  x.saved.set('last',{id:'last',name:x.picked.name,handle:x.picked,lastUsed:123});
  await x.app.restoreRecents();
  assert.ok(!x.events.some(v=>v.startsWith('activate:')));
  assert.equal(x.dropdown.value,'last');
  assert.equal(x.retry.hidden,false);
  assert.ok(x.retry.title.includes('Pictures-special'));
  assert.ok(x.events.includes('status:Permission needed'));
  assert.ok(!x.events.includes('request'));
});

test('choosing library invokes requestPermission synchronously and actually activates media',async()=>{
  const x=harness({prompt:'prompt'});
  x.saved.set('last',{id:'last',name:x.picked.name,handle:x.picked,lastUsed:123});
  await x.app.restoreRecents();
  const opening=x.app.selectRememberedLibrary('last');
  assert.equal(x.events.at(-1),'request','prompt must be within real click handler activation');
  assert.equal(await opening,true);
  assert.ok(x.events.includes('activate:Pictures-special'));
  assert.ok(x.events.includes('loaded:16 files'));
  assert.equal(x.dropdown.value,'last');
  assert.equal(x.retry.hidden,true);
});

test('denied permission can be retried from ↻ with same selected option',async()=>{
  const x=harness({prompt:'prompt',permission:'denied'});
  x.saved.set('last',{id:'last',name:x.picked.name,handle:x.picked,lastUsed:123});
  await x.app.restoreRecents();
  assert.equal(await x.app.selectRememberedLibrary('last'),false);
  assert.equal(x.dropdown.value,'last');
  assert.equal(x.retry.hidden,false);
  x.app.setPermission('granted');
  assert.equal(await x.app.selectRememberedLibrary(x.dropdown.value),true);
  assert.deepEqual(x.events.filter(z=>z==='request'),['request','request']);
  assert.ok(x.events.includes('loaded:16 files'));
});

test('manual picker selection always shows the active library, even if browser storage fails',async()=>{
  const x=harness({failSave:true});
  await x.app.chooseFolder();
  assert.ok(x.events.includes('picker'));
  assert.ok(x.events.includes('activate:Pictures-special'));
  assert.equal(x.dropdown.value,'__current__');
  assert.ok(x.dropdown.options.some(o=>o.text.includes('Pictures-special (current session)')));
  assert.equal(x.retry.hidden,true);
  assert.ok(x.notices.some(v=>v.includes('IndexedDB write blocked')));
});

test('remembering a manual library persists the actual native handle when storage works',async()=>{
  const x=harness();
  await x.app.chooseFolder();
  const state=x.app.getState(),saved=[...x.saved.values()][0];
  assert.equal(state.selectedLibraryId,saved.id);
  assert.equal(saved.handle,x.picked);
  assert.equal(x.dropdown.value,saved.id);
  assert.equal(x.dropdown.options.find(o=>o.value===saved.id)?.text,'Pictures-special');
});

test('name-only fallback is accurately labeled and opens picker, not silent media access',async()=>{
  const x=harness({nameHint:'Pictures-special'});
  await x.app.restoreRecents();
  assert.equal(x.dropdown.value,'__reselect__');
  assert.equal(x.retry.hidden,false);
  assert.ok(x.dropdown.options.some(o=>o.text==='Pictures-special (reselect folder)'));
  assert.ok(!x.events.some(v=>v.startsWith('activate:')));
  await x.app.selectRememberedLibrary('__reselect__');
  assert.ok(x.events.includes('picker'));
  assert.ok(x.events.includes('loaded:16 files'));
});

test('stale stored handle falls back to a real picker instead of doing nothing',async()=>{
  const x=harness();
  x.saved.set('bad',{id:'bad',name:'Pictures-special',handle:{name:'Pictures-special'},lastUsed:2});
  await x.app.restoreRecents();
  assert.equal(await x.app.selectRememberedLibrary('bad'),true);
  assert.ok(x.events.includes('picker'));
  assert.ok(x.events.includes('loaded:16 files'));
});

test('manual choice is never overwritten by a delayed automatic restore',async()=>{
  const x=harness();
  let unblock;
  const slowHandle={kind:'directory',name:'Old library',
    queryPermission:()=>new Promise(resolve=>{unblock=resolve}),
    requestPermission:()=>Promise.resolve('granted'),
    isSameEntry:async()=>false};
  x.saved.set('old',{id:'old',name:'Old library',handle:slowHandle,lastUsed:100});
  const restoring=x.app.restoreRecents();
  await Promise.resolve();await Promise.resolve();
  const manual=x.app.chooseFolder();
  await manual;
  if(unblock)unblock('granted');
  await restoring;
  assert.equal(x.app.getState().root,x.picked);
  assert.ok(!x.events.includes('activate:Old library'));
});

test('header handlers remain connected directly to dropdown and retry button',()=>{
  assert.match(html,/id="reconnectLibrary"/);
  assert.match(js,/el\('recentFolders'\)\.onchange=e=>\{void selectRememberedLibrary\(e\.target\.value\)\}/);
  assert.match(js,/el\('reconnectLibrary'\)\.onclick=\(\)=>\{void selectRememberedLibrary\(el\('recentFolders'\)\.value\)\}/);
  assert.match(js,/if\(!await loadIndex\(\)\)await scan\(\)/);
  assert.doesNotThrow(()=>new Function(js));
});
