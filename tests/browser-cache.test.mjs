import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const html=readFileSync(new URL('../__gallery/index.html',import.meta.url),'utf8');
const js=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const source=js.slice(js.indexOf('async function clearBrowserData(){'),js.indexOf('async function activateLibrary(picked){'));
function harness({confirm=true,fail=false,busy=false}={}){
  const events=[],keys=new Map(['gallery-db:views','theme','last','lock','operator','other-app'].map(k=>[k,'saved']));
  const button={disabled:false},body={inert:false};
  const env={events,keys,button,body,indexedDB:{deleteDatabase(name){events.push('delete:'+name);const req={error:Error('blocked storage')};Promise.resolve().then(()=>fail?req.onerror():req.onsuccess());return req}},
    localStorage:{removeItem(k){keys.delete(k)},getItem(k){return keys.get(k)??null}},document:{body},location:{reload(){events.push('reload')}},
    el:()=>button,toast:s=>events.push(s),setStatus:s=>events.push(s),galleryCollectionDialog:async()=>confirm,busy};
  const run=new Function('env','const {indexedDB,localStorage,document,location,el,toast,setStatus,galleryCollectionDialog}=env;'+
    "let browserResetting=false,librarySwitching=env.busy,scanInProgress=false,thumbResetting=false,deletingMedia=false,pendingSaves=0,libraryOpenToken=0;const PREFS_DB='gallery-db',THEME_KEY='theme',LEGACY_LIBRARY_NAME_KEY='last',FOLDER_LOCK_KEY='lock',COLLECTION_OPERATOR_KEY='operator';"+source+';return clearBrowserCache')(env);
  return {...env,run};
}
test('confirmed cache reset deletes only app database and preferences and reloads',async()=>{
  const x=harness();await x.run();assert.deepEqual([...x.keys.keys()],['other-app']);assert.ok(x.events.includes('delete:gallery-db'));assert.equal(x.events.at(-1),'reload');
});
test('cancel and busy state leave data untouched',async()=>{
  for(const config of [{confirm:false},{busy:true}]){const x=harness(config);await x.run();assert.equal(x.keys.size,6);assert.ok(!x.events.includes('reload'));assert.ok(!x.events.includes('delete:gallery-db'));}
});
test('failed database deletion leaves local data intact and restores controls',async()=>{
  const x=harness({fail:true});await x.run();assert.equal(x.keys.size,6);assert.equal(x.button.disabled,false);assert.equal(x.body.inert,false);assert.ok(!x.events.includes('reload'));
});
test('clear cache is the third maintenance control and reload button is absent',()=>{
  assert.match(html,/id="rescan"[\s\S]*?id="rebuildThumbs"[\s\S]*?id="clearCache"/);
  assert.doesNotMatch(html,/id="reconnectLibrary"/);
  assert.match(js,/el\('clearCache'\)\.onclick=\(\)=>void clearBrowserCache\(\)/);
  assert.doesNotThrow(()=>new Function(js));
});
