import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { restoreP128 } from './p128-source-compat.mjs';
const patch = JSON.parse(readFileSync(new URL('../fixtures/p126-source-hunks.json', import.meta.url), 'utf8'));
assert.equal(patch.baseline, '15f43c35ca09ece73ba9c2f6d33c384b18f86bf7');
export const p126SourceFiles = Object.keys(patch.files);
/** Only reviewed P126 source hunks may be removed for earlier source freezes. */
export function restoreP126(path, source) {
  source = restoreP128(path, source);
  for (const [i, hunk] of (patch.files[path] ?? []).entries()) {
    assert.notEqual(hunk.before, hunk.after, `${path}/${i}: real change`);
    assert.equal(source.split(hunk.after).length, 2, `${path}/${i}: exact candidate hunk occurs once`);
    source = source.replace(hunk.after, hunk.before);
  }
  return source;
}
