import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { blueprintChartOverrides } from '../lib/prism-next/chart-palette.ts';

const textures = [
  { symbol: 'rect', symbolSize: 1, dashArrayX: [1, 0], dashArrayY: [2, 4], rotation: -Math.PI / 4, color: 'rgba(255,255,255,.8)' },
  { symbol: 'rect', symbolSize: 1, dashArrayX: [1, 0], dashArrayY: [2, 4], rotation: Math.PI / 4, color: 'rgba(255,255,255,.8)' },
  { symbol: 'circle', symbolSize: 0.6, dashArrayX: [4, 4], dashArrayY: [4, 4], color: 'rgba(255,255,255,.8)' },
  { symbol: 'rect', symbolSize: 1, dashArrayX: [1, 0], dashArrayY: [3, 3], rotation: 0, color: 'rgba(255,255,255,.8)' },
  { symbol: 'rect', symbolSize: 1, dashArrayX: [1, 0], dashArrayY: [3, 3], rotation: Math.PI / 2, color: 'rgba(255,255,255,.8)' },
];

for (const theme of ['blueprint', 'blueprint-night']) {
  test(`P175 ${theme}: four solid entries followed by the five original textures`, () => {
    const decals = blueprintChartOverrides(theme).aria.decal.decals;
    assert.equal(decals.length, 9);
    assert.deepEqual(decals.slice(0, 4), Array.from({ length: 4 }, () => ({ symbol: 'none' })));
    assert.deepEqual(decals.slice(4), textures);
  });
}

test('P175 core themes receive no chart overrides', () => {
  for (const theme of [undefined, 'global', 'light', 'paper', 'dark']) {
    assert.deepEqual(blueprintChartOverrides(theme), {});
  }
});

test('P175 subject current item keeps its check without a current background rule', () => {
  const css = readFileSync('components/prism-next/page-navigation.css', 'utf8');
  assert.doesNotMatch(css, /[^{}]*\[data-current\][^{}]*\{[^}]*background(?:-color)?\s*:/);
  const source = readFileSync('components/prism-next/page-tabs.tsx', 'utf8');
  assert.match(source, /item\.current && <Check className="bp-page-tabs-subject-check"/);
});
