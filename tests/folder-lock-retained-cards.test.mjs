import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const html=readFileSync(new URL('../__gallery/index.html',import.meta.url),'utf8');
test('folder lock keeps existing cards and loaded images, even when results change',()=>{
  const js=html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const body=js.slice(js.lastIndexOf('function renderCards(){'),js.indexOf('  if(!observer)observer=new IntersectionObserver',js.lastIndexOf('function renderCards(){')));
  const nodes=['a','b','c'].map(path=>({dataset:{path},querySelector:()=>path,remove(){host.children.splice(host.children.indexOf(this),1)}}));
  const host={children:nodes.slice(),replaceChildren(){throw Error('unexpected full redraw')},insertBefore(card,before){const i=this.children.indexOf(card);if(i>=0)this.children.splice(i,1);const j=this.children.indexOf(before);this.children.splice(j<0?this.children.length:j,0,card)}};
  const removed=[];const env={host,nodes,removed};
  const api=new Function('env',"const {host,nodes,removed}=env;const el=()=>host,filtered=[{path:'c'},{path:'a'},{path:'d'}],visibleCount=80,observer={unobserve:p=>removed.push(p)},musicCardsByPath=new Map();"+body+"for(const item of slice){placeCard(existing.get(item.path)||{dataset:{path:item.path}})} } return ()=>renderCards(true)")(env);
  api();assert.equal(host.children[0],nodes[2]);assert.equal(host.children[1],nodes[0]);assert.deepEqual(host.children.map(x=>x.dataset.path),['c','a','d']);assert.deepEqual(removed,['b']);
  assert.match(js,/el\('folderLock'\)\.onchange=[\s\S]*?filterAndRender\((?:false,)?'filter',true\);/);
});
