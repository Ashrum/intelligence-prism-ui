import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

// Only named, reviewed P121 visible-field states get new exact fingerprints.
// Historical expectations remain checked; no DOM/ID/text normalization is added.
const entries = JSON.parse(readFileSync(new URL('../fixtures/p121-freeze-r1.json', import.meta.url), 'utf8')).entries;
const hash = value => createHash('sha256').update(value).digest('hex');
export function assertP121Hash(actual, originalSha256, key) {
  const entry = entries[key];
  if (!entry) return assert.equal(hash(actual), originalSha256, key);
  assert.equal(originalSha256, entry.beforeSha256, `${key}: historical fingerprint`);
  assert.equal(Buffer.byteLength(actual), entry.afterBytes, `${key}: migrated byte count`);
  assert.equal(hash(actual), entry.afterSha256, `${key}: exact P121 field migration`);
}
export function assertP121Migration(actual, original, key) {
  if (!entries[key]) return assert.equal(actual, original, key);
  assert.equal(Buffer.byteLength(original), entries[key].beforeBytes, `${key}: historical byte count`);
  assertP121Hash(actual, hash(original), key);
}
