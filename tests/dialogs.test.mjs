import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';

const html = readFileSync(new URL('../__gallery/index.html', import.meta.url), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/i)?.[1];
test('gallery inline JavaScript parses', () => {
  assert.ok(script, 'inline gallery JavaScript must exist');
  assert.doesNotThrow(() => new Function(script));
});
test('gallery does not call native alert/confirm/prompt', () => {
  assert.ok(script, 'inline gallery JavaScript must exist');
  const calls = [...script.matchAll(/\b(?:window\.)?(?:alert|confirm|prompt)\s*\(/g)];
  assert.equal(calls.length, 0, 'All user-facing dialogs must use in-app modals');
});
