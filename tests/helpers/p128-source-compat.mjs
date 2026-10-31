import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const patch = JSON.parse(readFileSync(new URL('../fixtures/p128-source-hunks.json', import.meta.url), 'utf8'));
assert.equal(patch.baseline, '0656aaa60854d6b50085d6110cec96a869deb829');
export const p128SourceFiles = Object.keys(patch.files);
/** Remove only exact P128 additions, preserving unrelated source-freeze failures. */
export function restoreP128(path, source) {
  for (const hunk of patch.files[path] ?? []) {
    assert.notEqual(hunk.before, hunk.after);
    assert.equal(source.split(hunk.after).length, 2, `${path}: exact P128 hunk occurs once`);
    source = source.replace(hunk.after, hunk.before);
  }
  return source;
}
