import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createHarness } from './helpers/p108-harness.mjs';

const { capture } = await createHarness();
const root = fileURLToPath(new URL('../', import.meta.url));
const cssPath = 'app/(next)/next/blueprint.css';
const css = readFileSync(root + cssPath, 'utf8');
const quiet = '.bp-seg-tabs[data-frame="quiet"][data-orientation="horizontal"]';

test('P191 quiet preserves radio semantics and keyboard navigation across disabled items', () => {
  const changes = [];
  const { html, nodes } = capture('BpSegTabs', {
    frame: 'quiet', label: '列表筛选', value: 'all', onValueChange: value => changes.push(value),
    items: [{ value: 'all', label: '全部' }, { value: 'pending', label: '待观察', disabled: true }, { value: 'stable', label: '好转与稳定' }],
  });
  assert.match(html, /data-frame="quiet"/);
  assert.match(html, /role="radiogroup" aria-label="列表筛选" aria-orientation="horizontal"/);
  const radios = nodes.filter(node => node.props.role === 'radio');
  assert.deepEqual(radios.map(node => node.props.tabIndex), [0, -1, -1]);
  assert.deepEqual(radios.map(node => node.props['aria-checked']), [true, false, false]);
  const focused = [];
  radios.forEach((node, index) => node.props.ref({ focus: () => focused.push(index) }));
  for (const [index, key] of [[0, 'ArrowRight'], [2, 'ArrowLeft'], [0, 'End'], [2, 'Home']]) {
    radios[index].props.onKeyDown({ key, preventDefault() {} });
  }
  assert.deepEqual(changes, ['stable', 'all', 'stable', 'all']);
  assert.deepEqual(focused, [2, 0, 2, 0]);
});

test('P191 horizontal quiet selection uses the card surface and inset outline', () => {
  const selected = quiet + ' > button:is([aria-selected="true"],[aria-checked="true"])';
  const body = css.split(selected + ' {')[1]?.split('}')[0];
  assert.ok(body);
  assert.match(body, /background:var\(--card\)/);
  assert.match(body, /box-shadow:inset 0 0 0 1\.5px var\(--foreground\)/);
  assert.doesNotMatch(body, /background:\s*var\(--foreground\)/);
});

test('P191 preserves all pre-existing segment selectors and declarations byte for byte', () => {
  const baseline = execFileSync('git', ['show', '2e2f7d8:' + cssPath], { cwd: root, encoding: 'utf8' });
  const segmentRules = sheet => [...sheet.matchAll(/[^{}]*\.bp-seg-tabs[^{}]*\{[^{}]*\}/g)]
    .map(match => match[0].trimStart());
  const legacy = segmentRules(css).filter(rule => !rule.startsWith(quiet));
  assert.deepEqual(legacy, segmentRules(baseline));
});
