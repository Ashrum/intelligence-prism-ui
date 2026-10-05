import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { freezeRenderer, freezeStates } from './review-freeze-harness.mjs';
const renderer = await freezeRenderer();
const expected = JSON.parse(await readFile(new URL('./fixtures/review-c1-before.json', import.meta.url), 'utf8'));
const hash = html => createHash('sha256').update(html).digest('hex');
for (const [name, state] of Object.entries(freezeStates)) test(`C1 frozen review DOM: ${name}`, () => {
  const html = renderer.review(state);
  if (name === 'studentOpen') { assert.match(html, /data-freeze-popup/); assert.equal((html.match(/data-slot="combobox-item"/g) || []).length, 6); }
  assert.equal(hash(html), expected.review[name]);
});
