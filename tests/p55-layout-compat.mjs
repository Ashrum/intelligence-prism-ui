import assert from 'node:assert/strict';

// Retain historical digital-content hashes across the two approved layout changes.
// Only these exact SSR fragments may differ; scan snapshots never use this helper.
export function restoreDigitalLayout(html, spreadWidth = 796) {
  assert.doesNotMatch(html, /data-scan-paper/);
  const marker = ' data-digital-paper="true"';
  const spread = '<div class="d1-paper-spread" style="width:740px">';
  assert.equal(html.split(marker).length - 1, 1);
  assert.equal(html.split(spread).length - 1, 1);
  return html.replace(marker, '').replace(spread, `<div class="d1-paper-spread" style="width:${spreadWidth}px">`);
}
