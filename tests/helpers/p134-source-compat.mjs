import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const patch = JSON.parse(readFileSync(new URL('../fixtures/p134-source-hunks.json', import.meta.url), 'utf8'));
assert.equal(patch.baseline, 'fea14b751f510a088fb213435cf0289744028176');

export const p134SourceFiles = Object.keys(patch.files);

/** Remove only exact P134 hidden-sheet hunks before applying historical byte locks. */
export function restoreP134(path, source) {
  for (const [index, hunk] of (patch.files[path] ?? []).entries()) {
    assert.notEqual(hunk.before, hunk.after);
    assert.equal(source.split(hunk.after).length, 2, `${path}/${index}: exact P134 source hunk occurs once`);
    source = source.replace(hunk.after, hunk.before);
  }
  return source;
}
