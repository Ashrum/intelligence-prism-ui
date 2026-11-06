import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const patch = JSON.parse(readFileSync(new URL('../fixtures/p135-source-hunks.json', import.meta.url), 'utf8'));
assert.equal(patch.baseline, '244419fca507ad8b76ba8ef5b7f3897290fef476');

export const p135SourceFiles = Object.keys(patch.files);

/** Remove only exact P135 SegmentedBar fill hunks before applying historical byte locks. */
export function restoreP135(path, source) {
  for (const [index, hunk] of (patch.files[path] ?? []).entries()) {
    assert.notEqual(hunk.before, hunk.after);
    assert.equal(source.split(hunk.after).length, 2, `${path}/${index}: exact P135 source hunk occurs once`);
    source = source.replace(hunk.after, hunk.before);
  }
  return source;
}
