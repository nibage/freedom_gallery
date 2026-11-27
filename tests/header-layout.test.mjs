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
  for(const id of ['query','folder','folderLock','kind','viewBack','layoutToggle']){
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

test('search is compact and right-aligned, results stay visible and details appear on hover',()=>{
  assert.match(html,/\.top > \.filters > #query\{[\s\S]*?max-width:220px;[\s\S]*?margin-left:auto;/);
  const header=html.slice(html.indexOf('<header class="top">'),html.indexOf('</header>'));
  assert.match(header,/id="query"[^>]*>\s*<select id="folder"[\s\S]*?id="folderLock"[\s\S]*?id="kind"[\s\S]*?id="viewBack"[\s\S]*?id="layoutToggle"/);
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
  assert.match(html,/\.top > \.filters > :is\(#query,#folder,#kind,#layoutToggle,#viewBack,\.folder-lock\)[\s\S]*?height:38px!important;/);
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

test('wide-screen header uses one grid row, protects full counts, and keeps search compact',()=>{
  assert.match(html,/@media \(min-width:1800px\)\{/);
  assert.match(html,/grid-template-columns:max-content minmax\(0,1fr\) max-content;/);
  assert.match(html,/grid-template-areas:"brand filters actions";/);
  assert.match(html,/\.top-left #results\{[\s\S]*?min-width:max-content;[\s\S]*?overflow:visible;/);
  assert.match(html,/\.top > \.filters > #query\{[\s\S]*?flex:0 1 220px;[\s\S]*?min-width:105px;[\s\S]*?max-width:220px;/);
  assert.match(html,/\.top-right\{[\s\S]*?flex-wrap:nowrap;/);
  assert.match(html,/@media \(min-width:1751px\) and \(max-width:1799px\)/);
});

test('header status reserves a fixed width and preserves full text on hover',()=>{
  const rules=[...html.matchAll(/\.top-right #status\{([^}]+)\}/g)];
  assert.equal(rules.length,1);
  assert.match(rules[0][1],/flex:0 0 160px;width:160px;min-width:160px;max-width:160px;/);
  assert.match(rules[0][1],/text-overflow:ellipsis;white-space:nowrap;text-align:right;/);
  const source=html.match(/function setStatus\(s\)\{[^}]+\}/)[0];
  const status={};
  const setStatus=new Function('el',source+';return setStatus')(id=>status);
  for(const message of ['loaded from index','Loading metadata…','Scanning all subfolders…']){
    setStatus(message);
    assert.equal(status.textContent,message);
    assert.equal(status.title,message);
  }
});
