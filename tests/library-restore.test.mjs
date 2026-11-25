import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const html=readFileSync(new URL('../__gallery/index.html',import.meta.url),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'Gallery inline JS must exist');
const begin=script.indexOf('function renderRecents(){');
const mid=script.indexOf('async function rememberLibrary(',begin);
const restore=script.indexOf('async function openRemembered(',mid);
const finish=script.indexOf('async function chooseFolder(',restore);
assert.ok(begin>=0&&mid>begin&&restore>mid&&finish>restore,'Restoration handlers must be present');

const source=script.slice(begin,mid)+'\n'+script.slice(restore,finish);
class MockSelect {
  constructor(){this.value='';this.options=[];this.hidden=true;}
  replaceChildren(...children){this.options=[...children];this.value=children[0]?.value??'';}
  add(option){this.options.push(option);}
}
function setup({startup='prompt',request=['granted'],active=false,hint='',saved=true}={}){
  const history=[],status=[],notices=[],selection=new MockSelect(),forget={hidden:true},statusNode={title:''};
  const handle={
    name:'My Photos',
    queryPermission(){history.push('query');return Promise.resolve(startup);},
    requestPermission(){history.push('request');const item=request.shift();return item instanceof Error?Promise.reject(item):Promise.resolve(item??'denied');}
  };
  const record={id:'lib-1',name:handle.name,handle,lastUsed:200};
  const nodes={recentFolders:selection,forget,status:statusNode};
  const env={
    el:id=>nodes[id],
    Option:class {constructor(label,value){this.label=label;this.value=value;}},
    window:{showDirectoryPicker:()=>{}},
    toast:msg=>notices.push(msg),
    setStatus:value=>{status.push(value);statusNode.title=value;},
    getRecentLibraries:async()=>saved?[record]:[],
    confirmLibrarySelection:async()=>true,
    activateLibrary:async value=>{history.push('activate');env.setActive(value,record.id);},
    rememberLibrary:async()=>{history.push('remember');env.setActive(handle,record.id);env.api.renderRecents();},
    chooseFolder:async()=>{history.push('picker');},
    console:{warn:()=>{}},
    recents:saved?[record]:[],hint,
    root:active?handle:null,
    selectedLibraryId:active?record.id:null
  };
  const factory=new Function('env',
    'const {el,Option,window,toast,setStatus,getRecentLibraries,confirmLibrarySelection,activateLibrary,rememberLibrary,chooseFolder,console}=env;'+
    'let recentLibraries=env.recents,selectedLibraryId=env.selectedLibraryId,root=env.root,prefsAvailable=true,lastLibraryHint=env.hint;'+
    source+
    ';return {renderRecents,openRemembered,restoreRecents,selectRememberedLibrary,'+
    'setActive:(handle,id)=>{root=handle;selectedLibraryId=id},getActive:()=>root,getSelectedId:()=>selectedLibraryId};'
  );
  const api=factory(env);
  env.setActive=api.setActive;env.api=api;
  return {api,env,record,handle,history,status,notices,selection,forget,statusNode};
}

test('restores last used library automatically when browser already grants access',async()=>{
  const x=setup({startup:'granted'});
  await x.api.restoreRecents();
  assert.deepEqual(x.history,['query','activate','remember']);
  assert.equal(x.api.getActive(),x.handle);
  assert.equal(x.selection.value,'lib-1');
  assert.equal(x.forget.hidden,false);
  assert.deepEqual(x.status,[]);
});

test('startup never requests permission without gesture, but offers a retry',async()=>{
  const x=setup({startup:'prompt'});
  await x.api.restoreRecents();
  assert.deepEqual(x.history,['query']);
  assert.equal(x.api.getActive(),null);
  assert.equal(x.selection.value,'');
  assert.equal(x.forget.hidden,true);
  assert.equal(x.status.at(-1),'Permission needed');
  assert.match(x.statusNode.title,/My Photos/);
  const opening=x.api.selectRememberedLibrary('lib-1');
  assert.equal(x.history.at(-1),'request','requestPermission must begin synchronously during selection');
  assert.equal(await opening,true);
  assert.deepEqual(x.history,['query','request','activate','remember']);
  assert.equal(x.selection.value,'lib-1');
});

test('denying access leaves the same remembered folder retryable',async()=>{
  const x=setup({request:['denied','granted']});
  x.api.renderRecents();
  assert.equal(await x.api.selectRememberedLibrary('lib-1'),false);
  assert.equal(x.selection.value,'');
  assert.equal(x.api.getActive(),null);
  assert.match(x.notices.at(-1),/Open library/);
  assert.equal(await x.api.selectRememberedLibrary('lib-1'),true);
  assert.deepEqual(x.history,['request','request','activate','remember']);
  assert.equal(x.selection.value,'lib-1');
});

test('permission rejection is handled and previous active library stays selected',async()=>{
  const x=setup({request:[new Error('SecurityError')],active:true});
  x.api.renderRecents();
  assert.equal(await x.api.selectRememberedLibrary('lib-1'),false);
  assert.equal(x.selection.value,'lib-1');
  assert.equal(x.api.getActive(),x.handle);
  assert.match(x.notices.at(-1),/Open library/);
});

test('already opened folder is visible even without any IndexedDB record',()=>{
  const x=setup({active:true,saved:false});
  x.api.renderRecents();
  assert.equal(x.selection.hidden,false);
  assert.equal(x.selection.value,'__current__');
  assert.ok(x.selection.options.some(o=>o.label.includes('My Photos')));
  assert.equal(x.forget.hidden,true);
});

test('failed IndexedDB save does not hide the currently loaded folder',()=>{
  const x=setup({active:true});
  x.api.setActive(x.handle,null);
  x.api.renderRecents();
  assert.equal(x.selection.value,'__current__');
  assert.match(x.selection.title,/could not remember/i);
});

test('last-known library name remains available as a reconnect option',async()=>{
  const x=setup({saved:false,hint:'My Photos'});
  await x.api.restoreRecents();
  assert.equal(x.selection.hidden,false);
  assert.equal(x.selection.options.at(-1).value,'__reconnect__');
  assert.match(x.selection.options.at(-1).label,/My Photos/);
  assert.equal(x.selection.value,'');
  assert.equal(x.status.at(-1),'Reconnect library');
  await x.api.selectRememberedLibrary('__reconnect__');
  assert.ok(x.history.includes('picker'));
});

test('saving a library is attempted even after a previous startup storage failure',()=>{
  assert.doesNotMatch(script,/async function rememberLibrary\(handle\)\{\s*if\(!prefsAvailable\)return/);
  assert.match(script,/async function rememberLibrary\(handle\)[\s\S]*?catch\(e\)\{[\s\S]*?renderRecents\(\)/);
  assert.match(script,/root=picked;selectedLibraryId=null;rememberLibraryName\(picked.name\)/);
  assert.match(script,/renderRecents\(\); \/\/ Current folder is visible immediately/);
});

test('reopen dropdown retains direct user activation chain and picker fallback',()=>{
  assert.match(script,/el\('recentFolders'\)\.onchange=e=>\{void selectRememberedLibrary\(e\.target\.value\)\}/);
  assert.match(source,/select\.value='';[\s\S]*?const ok=await openRemembered\(entry,true\)/);
  assert.match(source,/if\(!entry\)\{[\s\S]*?await chooseFolder\(\)/);
  assert.match(source,/entry\.handle\.queryPermission\(\{mode:'readwrite'\}\)/);
  assert.match(source,/entry\.handle\.requestPermission\(\{mode:'readwrite'\}\)/);
});

test('actual rememberLibrary reports an IndexedDB failure without losing current view',async()=>{
  const from=script.indexOf('async function rememberLibrary(handle){');
  const to=script.indexOf('async function forgetLibraries(){',from);
  assert.ok(from>=0&&to>from,'actual persistence function must exist');
  const written=[],messages=[],paint=[],notices=[];
  const handle={name:'My Photos'};
  const env={
    rememberLibraryName:n=>messages.push(n),
    prefsOp:async()=>{throw new Error('IndexedDB blocked')},
    getRecentLibraries:async()=>[],
    renderRecents:()=>paint.push('render'),
    console:{warn:()=>{}},
    toast:s=>notices.push(s)
  };
  const factory=new Function('env',
    'const {rememberLibraryName,prefsOp,getRecentLibraries,renderRecents,console,toast}=env;'+
    'const MAX_RECENTS=5;let recentLibraries=[],selectedLibraryId=null;'+script.slice(from,to)+
    ';return {rememberLibrary,getSelectedId:()=>selectedLibraryId};'
  );
  const api=factory(env);
  assert.equal(await api.rememberLibrary(handle),false);
  assert.deepEqual(messages,['My Photos']);
  assert.deepEqual(paint,['render']);
  assert.equal(api.getSelectedId(),null);
  assert.match(notices[0],/IndexedDB blocked/);
});

test('actual rememberLibrary persists native handle and selects its entry',async()=>{
  const from=script.indexOf('async function rememberLibrary(handle){');
  const to=script.indexOf('async function forgetLibraries(){',from);
  const handle={name:'My Photos',isSameEntry:async()=>true};
  let record,draws=0;
  const env={
    rememberLibraryName:()=>{},
    prefsOp:async(_mode,operation)=>{
      const store={put(item){record=item;return {result:item}} , delete(){}};
      return operation(store).result;
    },
    getRecentLibraries:async()=>record?[record]:[],
    renderRecents:()=>draws++,
    console:{warn:()=>{}},
    toast:()=>{throw Error('Unexpected warning')}
  };
  const api=new Function('env',
    'const {rememberLibraryName,prefsOp,getRecentLibraries,renderRecents,console,toast}=env;'+
    'const MAX_RECENTS=5;let recentLibraries=[],selectedLibraryId=null;'+script.slice(from,to)+
    ';return {rememberLibrary,getSelectedId:()=>selectedLibraryId};'
  )(env);
  assert.equal(await api.rememberLibrary(handle),true);
  assert.equal(record.name,'My Photos');
  assert.equal(record.handle,handle);
  assert.equal(api.getSelectedId(),record.id);
  assert.equal(draws,1);
});
