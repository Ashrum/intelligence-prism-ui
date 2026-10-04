import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { baselineCommit, mainApi, currentApi, cases, undefinedExtensions, renderCase, renderDemos } from './score-review-p16-compatibility-harness.mjs';

const snapshots = JSON.parse(await readFile(new URL('./fixtures/score-review-p16-main-hashes.json', import.meta.url), 'utf8'));
const hash = value => createHash('sha256').update(value).digest('hex');
assert.equal(snapshots.commit, baselineCommit);
for (const [name, props] of Object.entries(cases)) {
  test(`P16 missing and undefined extension props preserve exact main SSR bytes: ${name}`, () => {
    const baseline = renderCase(mainApi, props);
    assert.equal(hash(baseline), snapshots.score[name], 'executed main matches captured main snapshot');
    assert.equal(renderCase(currentApi, props), baseline, 'new props omitted: raw bytes including React IDs');
    assert.equal(renderCase(currentApi, props, undefinedExtensions), baseline, 'new props explicitly undefined: raw bytes including React IDs');
  });
}
test('P16 existing ScoreReview demos preserve exact main SSR bytes', () => {
  const baseline = renderDemos(mainApi), current = renderDemos(currentApi);
  for (const [name, html] of Object.entries(baseline)) {
    assert.equal(hash(html), snapshots.demos[name], 'executed main demo matches captured main snapshot');
    assert.equal(current[name], html, `${name}: raw bytes including React IDs`);
  }
});
