import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const additions = Object.fromEntries(['theme', 'blueprint'].map(name => [
  `app/(next)/next/${name}.css`,
  readFileSync(new URL(`../fixtures/p131-${name}-addition.txt`, import.meta.url), 'utf8'),
]));
/** Historical byte locks exclude only exact P131 additions; mutations still fail. */
export function restoreP131(path, source) {
  const addition = additions[path];
  if (!addition) return source;
  assert.equal(source.split(addition).length, 2, `${path}: exact P131 addition occurs once`);
  return source.replace(addition, '');
}
