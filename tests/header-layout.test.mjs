import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';

const html = readFileSync(new URL('../__gallery/index.html', import.meta.url),'utf8');

test('one unified header contains all gallery filters',()=>{
  const header=html.slice(html.indexOf('<header class="top">'),html.indexOf('</header>'));
  const body=html.slice(html.indexOf('<main>'),html.indexOf('</main>'));
  assert.equal((html.match(/class="filters"/g)||[]).length,1);
  assert.match(header,/class="top-left"/);
  assert.match(header,/class="filters"/);
  assert.match(header,/class="top-right"/);
  for(const id of ['query','folder','folderLock','kind','layoutToggle']){
    assert.match(header,new RegExp('id="'+id+'"'));
  }
  assert.doesNotMatch(body,/class="filters"/);
});

test('filter toolbar is no longer a separately sticky main element',()=>{
  assert.doesNotMatch(html,/main\s*>\s*\.filters\s*\{/);
  assert.match(html,/\.top\s*>\s*\.filters\s*\{[\s\S]*?position:static!important/);
  assert.match(html,/@media\(max-width:1750px\)/);
  assert.match(html,/@media\(max-width:990px\)/);
  assert.match(html,/@media\(max-width:680px\)/);
});

test('search is wider, results stay visible and details appear on hover',()=>{
  assert.match(html,/max-width:440px/);
  assert.match(html,/max-width:540px/);
  assert.match(html,/node\.textContent=filtered\.length\.toLocaleString/);
  assert.match(html,/node\.title=prefix\+filtered\.length/);
  assert.match(html,/el\('libraryName'\)\.title=picked\.name/);
});

test('inline gallery JavaScript still parses',()=>{
  const script=html.match(/<script>([\s\S]*?)<\/script>/i)?.[1];
  assert.ok(script);
  assert.doesNotThrow(()=>new Function(script));
});

test('media-type selector is wide enough and matches top header buttons',()=>{
  assert.match(html,/\.top > \.filters > #kind\{[\s\S]*?min-width:184px;/);
  assert.match(html,/\.top > \.filters > :is\(#query,#folder,#kind,#layoutToggle,\.folder-lock\)[\s\S]*?height:38px!important;/);
  assert.match(html,/font-size:13px!important;/);
  assert.match(html,/Photos & videos/);
});

test('library name is not duplicated beside the results count',()=>{
  const header=html.slice(html.indexOf('<header class="top">'),html.indexOf('</header>'));
  assert.match(header,/id="results"/);
  assert.match(header,/id="libraryName" hidden aria-hidden="true"/);
  assert.match(html,/\.top-left #libraryName\{\s*display:none!important;/);
  assert.match(header,/id="recentFolders"/);
});

test('wide-screen header uses one grid row, protects full counts, and lets search fill leftovers',()=>{
  assert.match(html,/@media \(min-width:1800px\)\{/);
  assert.match(html,/grid-template-columns:max-content minmax\(0,1fr\) max-content;/);
  assert.match(html,/grid-template-areas:"brand filters actions";/);
  assert.match(html,/\.top-left #results\{[\s\S]*?min-width:max-content;[\s\S]*?overflow:visible;/);
  assert.match(html,/\.top > \.filters > #query\{[\s\S]*?flex:1 1 0%;[\s\S]*?min-width:105px;[\s\S]*?max-width:none;/);
  assert.match(html,/\.top-right\{[\s\S]*?flex-wrap:nowrap;/);
  assert.match(html,/\.top-right #status\{[\s\S]*?min-width:0;/);
  assert.match(html,/@media \(min-width:1751px\) and \(max-width:1799px\)/);
});
