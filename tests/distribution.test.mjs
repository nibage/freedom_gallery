import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const html = readFileSync(new URL('../__gallery/index.html',import.meta.url),'utf8');
const readme = readFileSync(new URL('../README.md',import.meta.url),'utf8');
const workflow = readFileSync(new URL('../.github/workflows/build.yml',import.meta.url),'utf8');
const app = html.match(/<script>([\s\S]*?)<\/script>/i)?.[1];

test('concise header counts and status contain no duplicate total',()=>{
  assert.ok(app);
  assert.doesNotThrow(()=>new Function(app));
  assert.match(app,/node\.textContent=filtered\.length\.toLocaleString\('cs-CZ'\)\+' results · showing '\+slice\.toLocaleString/);
  assert.match(app,/node\.title=prefix\+filtered\.length/);
  assert.match(app,/renderAlbumList\(\);renderTagList\(\);filterAndRender\(\);setStatus\(origin\)/);
  assert.doesNotMatch(app,/setStatus\(images\.length\.toLocaleString\('cs-CZ'\)\+' files/);
});

test('search is wider while remaining responsive',()=>{
  assert.match(html,/max-width:440px/);
  assert.match(html,/max-width:540px/);
  assert.match(html,/@media \(max-width:680px\)/);
  assert.equal((html.match(/class="filters"/g)||[]).length,1);
});

test('README references current app version and exactly two screenshots',()=>{
  const version=html.match(/<title>Local Media Gallery v([0-9.]+)<\/title>/)?.[1];
  assert.ok(version,'app version should exist in title');
  assert.ok(readme.includes('Current version: v'+version));
  const images=[...readme.matchAll(/docs\/screenshots\/[a-z0-9-]+\.png/g)].map(x=>x[0]);
  assert.deepEqual(images,['docs/screenshots/classic-dark.png','docs/screenshots/classic-light.png']);
  assert.ok(!readme.includes('instagram-dark.png'));
  assert.ok(!readme.includes('viewer-dark.png'));
  for(const section of ['# Technical documentation','## Install and download','## Files and metadata','## GitHub builds and release ZIPs'])
    assert.ok(readme.includes(section));
});

test('GitHub build archives only allowlisted distribution files',()=>{
  assert.match(workflow,/name: Build downloadable Freedom Gallery ZIPs/);
  assert.match(workflow,/cp __gallery\/index\.html \.release-stage\/__gallery\/index\.html/);
  assert.match(workflow,/zip -q -r .*freedom-gallery-/);
  assert.match(workflow,/uses: actions\/upload-artifact@v4/);
  assert.match(workflow,/gh release create/);
  assert.match(workflow,/node scripts\/capture-screenshots\.mjs/);
});
