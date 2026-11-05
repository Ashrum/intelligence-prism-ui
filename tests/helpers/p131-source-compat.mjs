import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const additions = Object.fromEntries(['theme', 'blueprint'].map(name => [
  `app/(next)/next/${name}.css`,
  readFileSync(new URL(`../fixtures/p131-${name}-addition.txt`, import.meta.url), 'utf8'),
]));
const sourceHunks = JSON.parse(readFileSync(new URL('../fixtures/p132-source-hunks.json', import.meta.url), 'utf8'));
/** Historical byte locks exclude only exact P131 additions; mutations still fail. */
export function restoreP131(path, source) {
  // P132: reverse only the exact approved patch before applying historical locks.
  if (path === 'app/(next)/next/blueprint.css') {
    const fillAddition = readFileSync(new URL('../fixtures/p132-blueprint-addition.txt', import.meta.url), 'utf8');
    assert.equal(source.split(fillAddition).length, 2, 'exact P132 CSS occurs once');
    source = source.replace(fillAddition, '');
  }
  if (path === 'app/(next)/next/theme.css') {
    const palette = '  --chart-1:#0F5FA8;\n  --chart-2:#16181D;\n  --chart-3:#A8245C;\n  --chart-4:#3F6309;\n  --chart-5:#A57013;\n  --chart-6:#6B7280;';
    assert.equal(source.split(palette).length, 2, 'exact P132 chart tokens occur once');
    source = source.replace(palette, '  --chart-1:#1D5FBF;\n  --chart-2:#16181D;\n  --chart-3:#B8266E;\n  --chart-4:#2B8050;\n  --chart-5:#A57013;');
  }
  const hunk = sourceHunks[path];
  if (hunk) {
    assert.notEqual(hunk.before, hunk.after);
    assert.equal(source.split(hunk.after).length, 2, `${path}: exact P132 source hunk occurs once`);
    source = source.replace(hunk.after, hunk.before);
  }
  const addition = additions[path];
  if (!addition) return source;
  assert.equal(source.split(addition).length, 2, `${path}: exact P131 addition occurs once`);
  return source.replace(addition, '');
}
