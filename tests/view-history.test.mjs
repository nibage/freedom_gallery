import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';

const html=readFileSync(new URL('../__gallery/index.html',import.meta.url),'utf8');
const js=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const slice=(a,b)=>{const start=js.indexOf(a),end=js.indexOf(b,start);assert.ok(start>=0&&end>start);return js.slice(start,end)};
const history=slice('const VIEW_HISTORY_LIMIT=50;','function typeOf(path){');
const filters='function updateFolderDisplay(){}\n'+slice('function filterAndRender(navigation=','function renderCards(){');
const collections=slice('function currentAlbum(){','function visibleAlbumCount(paths){');
function harness(){
  const nodes=Object.fromEntries(['query','folder','kind','viewBack'].map(id=>[id,{value:'',disabled:false,selectedIndex:0}]));
  const images=[{path:'Nature/lake.jpg',kind:'image'},{path:'Nature/forest.mp4',kind:'video'},{path:'Trips/lake.jpg',kind:'image'},{path:'Trips/trash.jpg',kind:'image'}];
  const albums=new Map([['Travel',new Set(['Trips/lake.jpg'])]]);
  const tags=new Map([['Nature/lake.jpg',['Water']],['Trips/lake.jpg',['Water']]]);
  const favorites=new Set(['Nature/lake.jpg']);
  const trash=new Set(['Trips/trash.jpg']);
  const env={nodes,images,albums,tags,favorites,trash,el:id=>nodes[id],localStorage:{setItem(){}},
    renderAlbumList(){},renderTagList(){},navButtonActive(){},renderCards(){},clearSelection(){},syncFilterControls(){},knownTags:()=>[{key:'water'}]};
  const api=new Function('env',
    'const {el,images,albums,tags,favorites,trash,localStorage,renderAlbumList,renderTagList,navButtonActive,renderCards,clearSelection,syncFilterControls,knownTags}=env;'+
    "let root={},librarySwitching=false,browserResetting=false,selectedLibraryId=null,selectedAlbumNames=new Set(),selectedTagKeys=new Set(),selectedSpecialViews=new Set(),collectionOperator='OFF',folderLocked=true,activeView={type:'all'},filtered=[],visibleCount=80;const FOLDER_LOCK_KEY='lock',COLLECTION_OPERATOR_KEY='operator';"+
    collections+history+filters+
    ";return {filterAndRender,goBackView,resetViewHistory,scheduleSearchNavigation,chooseCollection,chooseSpecialView,state:()=>({view:captureViewState(),results:filtered.map(x=>x.path),history:viewHistory.length,backDisabled:el('viewBack').disabled}),mode:(operator,locked)=>{collectionOperator=operator;folderLocked=locked;filterAndRender('filter')},newRoot:()=>{resetViewHistory();root={};el('query').value=el('folder').value=el('kind').value='';resetCollections();filterAndRender()}}"
  )(env);
  api.filterAndRender();
  return {api,nodes,albums,tags};
}
test('Back restores previous query, folder, media type and matching results',()=>{
  const {api,nodes}=harness();
  const initial=api.state();
  assert.equal(initial.backDisabled,true);
  nodes.query.value='lake';api.filterAndRender('search');
  const search=api.state();
  nodes.folder.value='Nature';api.filterAndRender('filter');
  const folder=api.state();
  nodes.kind.value='video';api.filterAndRender('filter');
  assert.deepEqual(api.state().results,[]);
  api.goBackView();assert.deepEqual(api.state().view,folder.view);assert.deepEqual(api.state().results,folder.results);
  api.goBackView();assert.deepEqual(api.state().view,search.view);assert.deepEqual(api.state().results,search.results);
  api.goBackView();assert.deepEqual(api.state().view,initial.view);assert.deepEqual(api.state().results,initial.results);
  assert.equal(api.state().backDisabled,true);
});
test('Back restores combined album, tag, favorite and folder lock settings',()=>{
  const {api,nodes}=harness();
  nodes.folder.value='Nature';api.filterAndRender('filter');
  api.mode('OR',false);
  api.chooseCollection('album','Travel');api.chooseCollection('tag','water');api.chooseSpecialView('favorites');
  const before=api.state();
  api.mode('AND',true);
  api.goBackView();
  assert.deepEqual(api.state().view,before.view);assert.deepEqual(api.state().results,before.results);
});
test('rapid typing is coalesced and pending search can be undone immediately',()=>{
  const {api,nodes}=harness();
  nodes.query.value='l';api.filterAndRender('search');
  nodes.query.value='lake';api.filterAndRender('search');
  assert.equal(api.state().history,1);
  api.goBackView();assert.equal(nodes.query.value,'');
  nodes.query.value='forest';api.scheduleSearchNavigation();
  assert.equal(api.state().backDisabled,false);
  api.goBackView();assert.equal(nodes.query.value,'');assert.equal(api.state().history,0);
});
test('ordinary rerenders and no-op filters do not create navigation history',()=>{
  const {api,nodes}=harness();
  api.filterAndRender();api.filterAndRender('filter');
  assert.equal(api.state().history,0);
  nodes.folder.value='Nature';api.filterAndRender('filter');
  api.filterAndRender();api.filterAndRender('filter');
  assert.equal(api.state().history,1);
});
test('history resets for a new library and cannot reopen another library',()=>{
  const {api,nodes}=harness();
  nodes.folder.value='Nature';api.filterAndRender('filter');
  api.newRoot();api.goBackView();
  assert.equal(api.state().history,0);assert.equal(api.state().view.folder,'');assert.equal(api.state().backDisabled,true);
});
test('history is bounded at 50 steps and removed albums are not restored',()=>{
  const {api,nodes,albums}=harness();
  for(let i=0;i<60;i++){nodes.folder.value=i%2?'Nature':'Trips';api.filterAndRender('filter')}
  assert.equal(api.state().history,50);
  api.chooseCollection('album','Travel');nodes.kind.value='video';api.filterAndRender('filter');
  albums.delete('Travel');api.goBackView();
  assert.deepEqual(api.state().view.albums,[]);
});
test('the button and navigation events are wired to production history',()=>{
  assert.match(html,/id="viewBack" type="button" disabled/);
  assert.match(js,/el\('viewBack'\)\.onclick=goBackView/);
  assert.match(js,/el\('query'\)\.addEventListener\('input',scheduleSearchNavigation\)/);
  assert.match(js,/el\('folder'\)\.onchange=el\('kind'\)\.onchange=.*filterAndRender\('filter'\)/);
  assert.match(js,/async function activateLibrary\(picked\)[\s\S]*?resetViewHistory\(\)/);
  assert.doesNotThrow(()=>new Function(js));
});
