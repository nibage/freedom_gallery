import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';

const html=readFileSync(new URL('../__gallery/index.html',import.meta.url),'utf8');
const js=html.match(/<script>([\s\S]*?)<\/script>/i)?.[1];
test('inline JS parses',()=>{assert.ok(js);assert.doesNotThrow(()=>new Function(js))});
test('filter controls match compact header buttons without clipping',()=>{
  assert.match(html,/\.top > \.filters > :is\(#query,#folder,#kind,#layoutToggle,\.folder-lock\)/);
  assert.match(html,/height:38px!important;/);
  assert.match(html,/min-height:38px!important;/);
  assert.match(html,/font-size:13px!important;/);
  assert.match(html,/min-width:184px;/);
});
test('viewer membership changes only through the green + or - button',()=>{
  const src=js.slice(js.indexOf('function renderViewerCollections(){'),js.indexOf('async function viewerNewCollection(){'));
  assert.ok(src.includes('mark.onclick='));
  class Node{
    constructor(tag){this.tagName=tag;this.children=[];this.attributes={};this.hidden=false;this.textContent='';}
    setAttribute(k,v){this.attributes[k]=v}
    getAttribute(k){return this.attributes[k]}
    append(...children){this.children.push(...children)}
    replaceChildren(...children){this.children=[...children]}
    get childElementCount(){return this.children.length}
  }
  const nodes=new Map(['viewerCollectionQuery','viewerAlbumList','viewerTagList','viewerCollectionEmpty','viewerRemoveCollection'].map(id=>[id,new Node(id)]));
  nodes.get('viewerCollectionQuery').value='';
  const env={
    document:{createElement:tag=>new Node(tag)},
    el:id=>nodes.get(id),
    albums:new Map([['Sample',new Set()]]),
    tags:new Map(),
    currentPath:'sample.jpg',
    knownTags:()=>[{key:'travel',label:'Travel',count:0}],
    visibleAlbumCount:items=>items.size,
    recordUndo:()=>{env.undos++},
    captureSignature:()=>{},saveAlbum:()=>{env.saves++},saveTags:()=>{env.saves++},
    filterAndRender:()=>{},renderAlbumList:()=>{},renderTagList:()=>{},
    validNewTag:()=>true,tagCatalog:new Set(),toast:msg=>{throw Error(msg)},
    undos:0,saves:0
  };
  const factory=new Function('env',`const {document,el,albums,tags,currentPath,knownTags,visibleAlbumCount,recordUndo,captureSignature,saveAlbum,saveTags,filterAndRender,renderAlbumList,renderTagList,validNewTag,tagCatalog,toast}=env;let viewerCollectionMode='albums';let viewerCollectionSelection='';${src};return {renderViewerCollections,mode:v=>{viewerCollectionMode=v}};`);
  const api=factory(env);
  api.renderViewerCollections();
  let row=nodes.get('viewerAlbumList').children[0];
  assert.equal(row.tagName,'div');
  assert.equal(row.children[2].tagName,'button');
  row.onclick();
  assert.equal(env.albums.get('Sample').size,0,'clicking album text must not assign photo');
  assert.equal(env.saves,0);
  row.children[2].onclick({preventDefault(){},stopPropagation(){}});
  assert.ok(env.albums.get('Sample').has('sample.jpg'));
  api.renderViewerCollections();row=nodes.get('viewerAlbumList').children[0];
  row.children[2].onclick({preventDefault(){},stopPropagation(){}});
  assert.ok(!env.albums.get('Sample').has('sample.jpg'));
  api.mode('tags');api.renderViewerCollections();
  row=nodes.get('viewerTagList').children[0];
  assert.equal(row.children[2].tagName,'button');
  row.onclick();
  assert.equal(env.tags.size,0,'clicking tag text must not assign photo');
  row.children[2].onclick({preventDefault(){},stopPropagation(){}});
  assert.deepEqual(env.tags.get('sample.jpg'),['Travel']);
  api.renderViewerCollections();row=nodes.get('viewerTagList').children[0];
  row.children[2].onclick({preventDefault(){},stopPropagation(){}});
  assert.equal(env.tags.size,0,'minus removes tag');
  assert.equal(env.undos,4);
  assert.equal(env.saves,4);
});
