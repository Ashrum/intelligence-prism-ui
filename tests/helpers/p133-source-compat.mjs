import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const patch = JSON.parse(readFileSync(new URL('../fixtures/p133-source-hunks.json', import.meta.url), 'utf8'));
assert.equal(patch.baseline, '9c56f1cb6e7fb123a7d4e9072e601027eaa6dad7');

export const p133SourceFiles = Object.keys(patch.files);

/** Remove only exact P133 navigation hunks before applying historical byte locks. */
export function restoreP133(path, source) {
  for (const [index, hunk] of (patch.files[path] ?? []).entries()) {
    assert.notEqual(hunk.before, hunk.after);
    assert.equal(source.split(hunk.after).length, 2, `${path}/${index}: exact P133 source hunk occurs once`);
    source = source.replace(hunk.after, hunk.before);
  }
  return source;
}
