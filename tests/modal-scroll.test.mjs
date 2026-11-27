import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const html=readFileSync(new URL('../__gallery/index.html',import.meta.url),'utf8');
test('modal scroll lock follows actual modal state and preserves the scrollbar gutter',()=>{
  assert.ok(html.includes('html:has(dialog:modal){overflow:hidden;overscroll-behavior:none}'));
  assert.ok(html.includes('scrollbar-gutter:stable'));
  assert.ok(html.includes('dialog:modal{overscroll-behavior:contain}'));
  assert.ok(html.includes('dialog:modal .collection-scroll'));
  assert.ok(html.includes('dialog:modal .queue-list'));
});
