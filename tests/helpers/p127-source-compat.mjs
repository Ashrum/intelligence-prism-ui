import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const patch = JSON.parse(readFileSync(new URL('../fixtures/p127-source-hunks.json', import.meta.url), 'utf8'));
assert.equal(patch.baseline, '08d467b2fa0dec5b03d72723488e71d93a9ff3b4');
export const p127SourceFiles = Object.keys(patch.files);
/** Restore only exact P127 slot/demo hunks before applying older source freezes. */
export function restoreP127(path, source) {
  for (const hunk of patch.files[path] ?? []) {
    assert.notEqual(hunk.before, hunk.after);
    assert.equal(source.split(hunk.after).length, 2, 'exact authorized P127 hunk occurs once');
    source = source.replace(hunk.after, hunk.before);
  }
  return source;
}
