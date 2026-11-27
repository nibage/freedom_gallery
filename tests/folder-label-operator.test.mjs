import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const html=readFileSync(new URL('../__gallery/index.html',import.meta.url),'utf8');
const js=html.match(/<script>([\s\S]*?)<\/script>/)[1];
test('folder label is painted only once, while full paths remain native options',()=>{
  const nodes={folder:{value:'Music/Artist/Album'},folderLeafText:{},headerRelativePath:{}};
  const source=js.slice(js.indexOf('function updateFolderDisplay(){'),js.indexOf('function filterAndRender(',js.indexOf('function updateFolderDisplay(){')));
  const update=new Function('nodes','const el=id=>nodes[id];'+source+';return updateFolderDisplay')(nodes);
  update();assert.equal(nodes.folderLeafText.textContent,'Album');assert.equal(nodes.headerRelativePath.textContent,'Music/Artist/Album');
  nodes.folder.value='';update();assert.equal(nodes.folderLeafText.textContent,'All folders');
  assert.match(html,/#folderControl #folder\{[^}]*opacity:0/);
  assert.match(html,/#folderControl:focus-within/);
  assert.match(js,/select\.add\(new Option\(folder,folder\)\)/);
});
test('operator transitions keep existing cards and previously loaded thumbnails',()=>{
  const handler=js.slice(js.indexOf("el('collectionOperator').onclick="),js.indexOf("el('folderLock').onchange="));
  assert.match(handler,/filterAndRender\((?:false,)?'filter',true\)/);
  assert.doesNotMatch(handler,/visibleCount=80|renderAlbumList\(\)|renderTagList\(\)/);
  assert.match(js,/if\(preserve&&thumbs.has\(item.path\)\)thumbnail.src=thumbs.get\(item.path\)/);
});
