import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const html=readFileSync(new URL('../__gallery/index.html',import.meta.url),'utf8');
const js=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const source=js.slice(js.indexOf('async function newAlbum('),js.indexOf('function toggleAlbumMembership(){'));
const valid=js.match(/function validAlbum\(name\)\{[^\n]+\}/)[0];
const viewer=js.slice(js.indexOf('async function viewerNewCollection(){'),js.indexOf('async function viewerRemoveCollection(){'));
function harness({selection=[],answer='New set',existing=[],current='c',changeRoot=false,removeDuringDialog=false}={}){
  const albums=new Map(existing.map(([name,members])=>[name,new Set(members)]));
  const byPath=new Map(['a','b','c','trashed'].map(p=>[p,{}]));
  const trash=new Set(['trashed']),selectedPaths=new Set(selection),saves=[],signatures=[],undos=[],dialogs=[],notices=[];
  const env={albums,byPath,trash,selectedPaths,saves,signatures,undos,dialogs,notices,answer,current,changeRoot,removeDuringDialog,
    renderAlbumList(){},renderViewerCollections(){},toast:m=>notices.push(m),recordUndo:label=>undos.push({label,albums:[...albums.keys()]}),
    captureSignature:p=>signatures.push(p),saveAlbum:async name=>saves.push([name,[...albums.get(name)]])};
  const api=new Function('env',
    'const {albums,byPath,trash,selectedPaths,renderAlbumList,renderViewerCollections,toast,recordUndo,captureSignature,saveAlbum}=env;'+
    "let root={},currentPath=env.current,viewerCollectionMode='albums',viewerCollectionSelection='';"+
    "async function galleryCollectionDialog(o){env.dialogs.push(o);if(env.changeRoot)root={};if(env.removeDuringDialog)byPath.delete('b');return env.answer;}"+
    valid+source+viewer+";return {newAlbum,viewerNewCollection};"
  )(env);
  return {...env,api};
}
test('new album or collection contains selected files and saves in selection order',async()=>{
  const x=harness({selection:['b','a','trashed','missing']});
  assert.equal(await x.api.newAlbum(),'New set');
  assert.deepEqual([...x.albums.get('New set')],['b','a']);
  assert.deepEqual(x.saves,[['New set',['b','a']]]);
  assert.deepEqual(x.signatures,['b','a']);
  assert.deepEqual(x.undos,[{label:'create album',albums:[]}]);
  assert.match(x.dialogs[0].message,/2 selected/);
});
test('no selection creates an empty album even if another file is open',async()=>{
  const x=harness();await x.api.newAlbum();
  assert.deepEqual(x.saves,[['New set',[]]]);
  assert.match(x.dialogs[0].message,/will be empty/);
});
test('viewer creation assigns only the open file, not unrelated grid selection',async()=>{
  const x=harness({selection:['a','b'],current:'c'});await x.api.viewerNewCollection();
  assert.deepEqual(x.saves,[['New set',['c']]]);
});
test('cancel, existing name, and library switch cannot create or modify albums',async()=>{
  for(const opts of [{answer:null},{existing:[['New set',['c']]]},{changeRoot:true}]){
    const x=harness({selection:['a'],...opts});await x.api.newAlbum();
    assert.equal(x.saves.length,0);assert.equal(x.undos.length,0);
    if(opts.existing)assert.deepEqual([...x.albums.get('New set')],['c']);
    else assert.equal(x.albums.size,0);
  }
});
test('files removed while naming a collection are excluded',async()=>{
  const x=harness({selection:['a','b'],removeDuringDialog:true});await x.api.newAlbum();
  assert.deepEqual(x.saves,[['New set',['a']]]);
});
test('inline JavaScript parses and sidebar creation uses current selection',()=>{
  assert.match(js,/if\(collectionMode==='albums'\)\{await newAlbum\(\);return\}/);
  assert.match(js,/async function newAlbum\(paths=selectedPaths\)/);
  assert.doesNotThrow(()=>new Function(js));
});
