import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { chartSeriesColors, chartShapeColors, chartSequentialDefault, blueprintChartOverrides, BLUEPRINT_SERIES, BLUEPRINT_SEQUENTIAL } from '../lib/prism-next/chart-palette.ts';
import { sequentialColor, relativeLuminance, contrastForeground } from '../lib/prism-next/chart-color.ts';
import { themeAxes } from '../lib/prism-next/chart-options.ts';
const ratio = (a, b) => { const x = relativeLuminance(a), y = relativeLuminance(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05) };

test('core theme chart colours are unchanged', () => {
  assert.deepEqual([...chartSeriesColors('light')], ['#1769AA', '#B8266E', '#2B8050', '#A57013', '#7159A7', '#6B7280']);
  assert.deepEqual([...chartSeriesColors('paper')], [...chartSeriesColors('light')]);
  assert.deepEqual([...chartSeriesColors(undefined)], [...chartSeriesColors('light')]);
  assert.deepEqual([...chartSeriesColors('dark')], ['#86C5FF', '#F296C2', '#99DFB4', '#F4CC86', '#BDACED', '#B6BEC9']);
  assert.deepEqual(chartShapeColors('light'), { base: '#1769AA', selected: '#B8266E', fill: '#76A9D2' });
  assert.deepEqual(chartShapeColors('dark'), { base: '#86C5FF', selected: '#F296C2', fill: '#365B7B' });
  assert.deepEqual([...chartSequentialDefault('paper', '#EAE6DF')], ['#EAE6DF', '#76A9D2', '#1769AA']);
  for (const t of ['light', 'paper', 'dark', undefined]) assert.deepEqual(blueprintChartOverrides(t), {});
});

test('blueprint series lead with accent then ink; every series ≥ 3:1 on card and ground', () => {
  assert.equal(BLUEPRINT_SERIES[0], '#1D5FBF'); assert.equal(BLUEPRINT_SERIES[1], '#16181D');
  assert.equal(new Set(BLUEPRINT_SERIES).size, 6);
  for (const c of BLUEPRINT_SERIES) for (const bg of ['#FFFFFF', '#F6F6F3']) assert.ok(ratio(c, bg) >= 3, `${c}/${bg}`);
});

test('blueprint sequential ramp keeps labels ≥ 4.5:1 and luminance monotonic', () => {
  let previous = Infinity;
  for (let v = 0; v <= 1000; v++) {
    const bg = sequentialColor(v, 0, 1000, BLUEPRINT_SEQUENTIAL);
    assert.ok(ratio(bg, contrastForeground(bg)) >= 4.5, bg);
    const l = relativeLuminance(bg); assert.ok(l <= previous + 1e-12); previous = l;
  }
});

test('blueprint overrides: first series solid, the rest patterned; square ink tooltip', () => {
  const o = blueprintChartOverrides('blueprint');
  assert.equal(o.aria.decal.show, true);
  assert.equal(o.aria.decal.decals[0].symbol, 'none');
  assert.ok(o.aria.decal.decals.slice(1).every(d => d.symbol !== 'none'));
  assert.equal(o.tooltip.borderRadius, 0); assert.equal(o.tooltip.shadowBlur, 0); assert.equal(o.tooltip.borderColor, '#1D2026');
});

test('axis line uses palette.line when present, border otherwise', () => {
  assert.equal(themeAxes({}, { muted: '#bbb', border: '#444' }).axisLine.lineStyle.color, '#444');
  assert.equal(themeAxes({}, { muted: '#bbb', border: '#444', line: '#1D2026' }).axisLine.lineStyle.color, '#1D2026');
  assert.equal(themeAxes({}, { muted: '#bbb', border: '#444', line: '#1D2026' }).splitLine.lineStyle.color, '#444');
});

test('theme.css blueprint chart tokens follow the series order; Recharts tooltip squared only in blueprint', () => {
  const theme = readFileSync(new URL('../app/(next)/next/theme.css', import.meta.url), 'utf8');
  const block = theme.split(':where([data-agent-preview])[data-prism-theme="blueprint"] {')[1].split('}')[0];
  BLUEPRINT_SERIES.slice(0, 5).forEach((c, i) => assert.match(block, new RegExp(`--chart-${i + 1}:${c}`)));
  const css = readFileSync(new URL('../app/(next)/next/blueprint.css', import.meta.url), 'utf8');
  assert.match(css, /\[data-prism-theme="blueprint"\] \.recharts-default-tooltip[^{]*\{[^}]*border-radius:0 !important/);
  assert.match(readFileSync(new URL('../lib/prism-next/config.ts', import.meta.url), 'utf8'), /blueprint: \{[^}]*line: "#1D2026"/);
});
