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

test('search stays compact and results are readable on hover',()=>{
  assert.match(html,/\.top\s*>\s*\.filters\s*>\s*#query\s*\{[\s\S]*?max-width:240px/);
  assert.match(html,/max-width:260px/);
  assert.match(html,/node\.title=node\.textContent/);
  assert.match(html,/el\('libraryName'\)\.title=picked\.name/);
});

test('inline gallery JavaScript still parses',()=>{
  const script=html.match(/<script>([\s\S]*?)<\/script>/i)?.[1];
  assert.ok(script);
  assert.doesNotThrow(()=>new Function(script));
});
