import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const html=readFileSync(new URL('../__gallery/index.html',import.meta.url),'utf8');
const js=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const source=js.slice(js.indexOf('function readLibraryViews(){'),js.indexOf('function applySavedView('));
test('last view is isolated by native remembered-library ID; pending edits are saved and clearing works',async()=>{
  const keys=new Map(),storage={getItem:k=>keys.get(k),setItem:(k,v)=>keys.set(k,v)};
  const a={},b={},env={storage,a,b};
  const api=new Function('env',"const localStorage=env.storage,PREFS_DB='test',recentLibraries=[{id:'a',handle:{isSameEntry:async h=>h===env.a}},{id:'b',handle:{isSameEntry:async h=>h===env.b}}];let root=env.a,selectedLibraryId='a',librarySwitching=false,browserResetting=false,collectionMode='tags',query='first';const el=()=>({value:'side'}),captureViewState=()=>({query,folder:'A',tags:['rock']});"+source+";return {persistLibraryView,findRememberedView,forgetLibraryView,switchTo:()=>{root=env.b;selectedLibraryId='b';query='second'},resetting:()=>{browserResetting=true;query='invalid'}}")(env);
  api.persistLibraryView();api.switchTo();api.persistLibraryView();
  assert.equal((await api.findRememberedView(a)).query,'first');
  assert.equal((await api.findRememberedView(b)).query,'second');
  assert.equal((await api.findRememberedView(a)).sidebar,'tags');
  api.resetting();api.persistLibraryView();assert.equal((await api.findRememberedView(b)).query,'second');
  api.forgetLibraryView('a');assert.equal(await api.findRememberedView(a),null);
  assert.equal(await api.findRememberedView({}),null);
});
test('global search is independent of unlocked folder, but locked folder still constrains it',()=>{
  const expression=js.match(/const globalScope=([^;]+);/)[1];
  const global=new Function('anyCriteria','q','folderLocked','return '+expression);
  for(const lock of [true,false]){
    assert.equal(global(false,'lake',lock),!lock);
    assert.equal(global(true,'',lock),!lock);
    assert.equal(global(false,'',lock),false);
  }
  assert.match(js,/if\(!globalScope&&folder&&!path.startsWith\(folder\+'\/'\)\)return false/);
});
test('view restore follows index load and cache reset clears saved views',()=>{
  assert.match(js,/if\(!await loadIndex\(\)\)await scan\(\);[\s\S]*?restoreLibraryView\(savedView\)/);
  assert.match(js,/const keys=\[PREFS_DB\+':views'/);
  assert.match(js,/searchNavigationTimer=setTimeout\(applySearchNavigation,150\);\s*syncViewBack\(\);persistLibraryView\(\)/);
  assert.match(js,/function restoreLibraryView\(previous\)[\s\S]*?applySavedView\(previous\)/);
  assert.match(js,/if\(el\('viewer'\)\.open&&e\.code==='Space'/);
  assert.doesNotThrow(()=>new Function(js));
});
