import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const html=readFileSync(new URL('../__gallery/index.html',import.meta.url),'utf8');
test('theme remains accessible without visible Theme label and library chooser is wider',()=>{
  assert.match(html,/<label class="theme-label" for="themeSelect">\s*<select id="themeSelect"[^>]*aria-label="Color theme"/);
  assert.match(html,/\.top-right \.recent-chooser\{\s*flex:0 0 180px;\s*width:180px;\s*min-width:180px;\s*max-width:180px;/);
  assert.match(html,/@media\(max-width:1799px\)\{\s*\.top-right \.recent-chooser\{width:180px/);
});
