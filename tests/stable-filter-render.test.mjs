import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const html=readFileSync(new URL('../__gallery/index.html',import.meta.url),'utf8');
const js=html.match(/<script>([\s\S]*?)<\/script>/)[1];
test('normal filter navigation retains cards; cached thumbnails never wait for the observer',()=>{
  assert.match(js,/function filterAndRender\([^)]*preserveCards=(?:metadataRefresh\|\|)?!!navigation/);
  assert.match(js,/else if\(thumbs.has\(item.path\)\)thumbnail.src=thumbs.get\(item.path\);else observer.observe/);
  assert.match(html,/html\{scrollbar-gutter:stable\}/);
  assert.match(js,/if\(node.textContent!==message\)node.textContent=message/);
});
test('wheel zoom is cursor anchored, bounded and resets to fit',()=>{
  const source=js.slice(js.indexOf('function constrainViewerZoom('),js.indexOf('function paintViewerZoom('));
  const api=new Function(source+';return {zoomViewerAt,constrainViewerZoom}')();
  const fit={scale:1,x:0,y:0};
  assert.deepEqual(api.zoomViewerAt(fit,2,100,50,400,300,400,300),{scale:2,x:-100,y:-50});
  assert.deepEqual(api.zoomViewerAt({scale:2,x:-100,y:-50},.5,100,50,400,300,400,300),fit);
  assert.equal(api.zoomViewerAt(fit,20,0,0,400,300,400,300).scale,8);
  assert.deepEqual(api.constrainViewerZoom({scale:2,x:900,y:-900},400,300,400,300),{scale:2,x:200,y:-150});
});
test('clicking inside preview does not dismiss it and each image resets zoom',()=>{
  assert.match(js,/dismissPointerStartedOnBackground=hitViewerBackdrop\(e\)/);
  assert.match(js,/const backgroundClick=hitViewerBackdrop\(e\)/);
  assert.doesNotMatch(js,/e.target===mediaStage\|\|hitViewerBackdrop/);
  assert.match(js,/resetViewerZoom\(\);img.removeAttribute\('src'\)/);
  assert.match(js,/image.addEventListener\('wheel',[\s\S]*?\},\{passive:false\}\)/);
});
