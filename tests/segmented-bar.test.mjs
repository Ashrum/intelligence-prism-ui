import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { segmentedBarLayout as layout } from '../lib/prism-next/segmented-bar.ts';
import { components, componentGroups, searchComponents } from '../lib/prism-next/catalog.ts';
import { coreAgentSpecs } from '../lib/prism-next/agent-specs.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const directory = new URL(`../.sites-runtime/segmented-bar-${process.pid}/`, import.meta.url);
await mkdir(directory, { recursive: true });
const bundled = await build({ stdin: { contents: `export * from './components/prism-next/charts/segmented-bar'; export * from './components/prism-next/demos/segmented-bar'; export { Button } from './components/prism-next/button';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false });
const file = new URL('bundle.mjs', directory);
await writeFile(file, bundled.outputFiles[0].text);
const api = await import(file);
await rm(directory, { recursive: true });
const h = React.createElement;
const segments = [
  { id: 'a', label: '甲', value: 60, tone: 'info', description: '完整说明' },
  { id: 'b', label: '乙', value: 39, tone: 'success' },
  { id: 'c', label: '丙', value: 1, tone: 'warning' },
  { id: 'z', label: '零', value: 0 },
];
const props = { label: '分类组成', segments, unit: '项' };
const render = extra => renderToStaticMarkup(h(api.SegmentedBar, { ...props, ...extra }));
function capture(extra) {
  const nodes = [];
  function walk(node) { if (!React.isValidElement(node)) return; nodes.push(node); React.Children.forEach(node.props.children, walk); }
  function Probe() { const tree = api.SegmentedBar({ ...props, ...extra }); walk(tree); return tree; }
  const html = renderToStaticMarkup(h(Probe));
  return { html, nodes, buttons: nodes.filter(node => node.type === 'button' || node.type === api.Button) };
}
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-12, `${a} != ${b}`);

test('SegmentedBar true ratios retain 1% and normal geometry, including explicit remainder', () => {
  const a = layout([60, 39, 1, 0]);
  a.ratios.forEach((v, i) => near(v, [0.6, 0.39, 0.01, 0][i]));
  a.widths.forEach((v, i) => near(v, a.ratios[i]));
  const b = layout([60, 39, 1, 0], 200);
  near(b.remainderRatio, 0.5);
  near(b.ratios[2], 0.005);
  near(b.widths[2], 0.01);
  near(b.widths.reduce((a, b) => a + b, b.remainderWidth), 1);
});

test('SegmentedBar bounds tiny and many positive widths without losing zero or exceeding the track', () => {
  for (const values of [[99.99, 0.01, 0], [1, 99], Array(200).fill(1), [1e-300, 1e300], [Number.MIN_VALUE, Number.MAX_VALUE], [Number.MAX_VALUE, Number.MAX_VALUE]]) {
    for (const total of [undefined, Number.MAX_VALUE]) {
      const result = layout(values, total);
      assert.ok(result.widths.every(Number.isFinite));
      const sum = result.widths.reduce((a, b) => a + b, result.remainderWidth);
      near(sum, 1);
      result.widths.forEach((width, i) => values[i] > 0 ? assert.ok(width >= Math.min(0.01, 1 / (values.filter(v => v > 0).length + (result.remainderRatio > 0 ? 1 : 0))) - 1e-12) : assert.equal(width, 0));
      // Proportional widths at either 320px or 390px do not accumulate fixed gaps.
      for (const width of [320, 390]) assert.ok(sum * width <= width + 1e-9);
    }
  }
});

test('SegmentedBar handles empty, all-zero and invalid values and totals deterministically', () => {
  for (const values of [[], [0, 0], [-1, NaN, Infinity, -Infinity]]) {
    const result = layout(values);
    assert.equal(result.empty, true); assert.ok(result.values.every(v => v === 0));
    assert.ok(result.widths.every(v => v === 0));
  }
  assert.equal(layout([-1, NaN]).invalidValues, true);
  for (const total of [-1, NaN, Infinity, 5]) {
    const result = layout([3, 7], total);
    assert.equal(result.invalidTotal, true); near(result.ratios[0], 0.3); near(result.remainderWidth, 0);
  }
  near(layout([0], 100).remainderWidth, 1);
  assert.equal(layout([0], 0).invalidTotal, false);
});

test('SegmentedBar SSR includes a complete accessible name and ordered semantic legend', () => {
  const html = render();
  assert.match(html, /role="img" aria-label="分类组成；甲 60 项 60%；乙 39 项 39%；丙 1 项 1%；零 0 项 0%"/);
  assert.match(html, /<ul aria-label="分类组成：图例"/);
  assert.equal((html.match(/<li\b/g) ?? []).length, 4);
  assert.equal((html.match(/style="width:/g) ?? []).length, 3);
  assert.match(html, /完整说明/);
  const legend = html.slice(html.indexOf('<ul'));
  assert.ok(legend.indexOf('甲') < legend.indexOf('乙') && legend.indexOf('乙') < legend.indexOf('丙') && legend.indexOf('丙') < legend.indexOf('零'));
  assert.doesNotMatch(html, /<button|tabindex|<a\b|role="meter"|transition|animation/);
  assert.match(html, /absolute inset-y-0 end-0 w-px max-w-\[20%\] bg-background/);
});

test('SegmentedBar legend none retains image name; zero and empty tracks disclose no data', () => {
  assert.doesNotMatch(render({ legend: 'none' }), /<ul|<li/);
  for (const segments of [[], [{ id: 'z', label: '零', value: 0 }], [{ id: 'bad', label: '非法', value: NaN }]]) {
    const html = render({ segments });
    assert.match(html, /data-slot="meter-track"/); assert.match(html, /aria-label="分类组成；.*无数据"/);
    assert.doesNotMatch(html, /style="width:|>NaN|>Infinity/);
  }
  assert.match(render({ total: 200 }), /余量 50%/);
});

test('SegmentedBar formatter receives normalized value and original segment and retains unit', () => {
  const original = { id: 'bad', label: '原始段', value: -3 };
  const calls = [];
  const html = render({ segments: [original], valueFormatter: (value, segment) => { calls.push([value, segment]); return value.toFixed(2); } });
  assert.deepEqual(calls, [[0, original]]);
  assert.match(html, /原始段 0.00 项 0%/);
  assert.match(render({ segments: [{ id: 'tiny', label: '极小', value: 1e-9 }, { id: 'large', label: '其余', value: 100 }] }), /极小 0.000000001 项 &lt;0.1%/);
});

test('SegmentedBar all semantic and chart tones resolve to existing token classes and size is opt-in', () => {
  const tones = ['neutral', 'info', 'success', 'warning', 'destructive', 'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5'];
  const html = render({ segments: tones.map(tone => ({ id: tone, label: tone, value: 1, tone })) });
  for (const tone of tones) assert.ok(html.includes(tone === 'neutral' ? 'bg-muted-foreground' : `bg-${tone}`));
  assert.match(html, /h-2/); assert.match(render({ size: 'sm' }), /h-1.5/);
});

test('SegmentedBar selection uses native keyboard-activatable buttons outside img and emits original objects only', () => {
  const intents = [];
  const out = capture({ onSelect: segment => intents.push(segment) });
  assert.equal(out.buttons.length, 7); // 3 nonzero segments + all 4 legend items.
  assert.match(out.html, /<div role="img"[^>]*><\/div><div[^>]*role="group"/);
  assert.equal((out.html.match(/<button\b/g) ?? []).length, 7);
  assert.equal((out.html.match(/type="button"/g) ?? []).length, 7);
  assert.doesNotMatch(out.html, /tabindex="-1"|aria-hidden="true"[^>]*><button/);
  // Enter / Space on native buttons generate click; exercise that handler path
  // with detail=0. Real Tab, default key activation and focus painting are Supervisor QA.
  for (const button of out.buttons) {
    assert.equal(button.props.onKeyDown, undefined);
    assert.equal(button.props.disabled, undefined);
    button.props.onClick({ detail: 0 });
  }
  assert.deepEqual(intents, [...segments.slice(0, 3), ...segments]);
  intents.forEach((segment, index) => assert.equal(segment, [...segments.slice(0, 3), ...segments][index]));
  assert.equal(capture({ onSelect() {} }).html, out.html);
  assert.equal(capture({ onSelect() {}, legend: 'none' }).buttons.length, 3);
  assert.equal(capture({}).buttons.length, 0);
});

test('SegmentedBar SSR is stable and demo includes themes, narrow width, formula and edge cases', () => {
  assert.equal(render(), render());
  assert.equal(render({ size: 'default', legend: 'below' }), render());
  const html = renderToStaticMarkup(h(api.SegmentedBarDemo));
  for (const theme of ['light', 'paper', 'dark']) assert.match(html, new RegExp(`data-prism-theme="${theme}"`));
  for (const text of ['w-80', 'data-ui-version="coss-v1"', '极小正值', '零值仍在图例', '全部为零', '空数组', '余量 20%', '仅条的键盘选择', '<math>']) assert.ok(html.includes(text), text);
});

test('SegmentedBar adds one searchable analytics pattern and an Agent Spec (101 to 102)', () => {
  assert.equal(components.length, 103);
  const entries = componentGroups.find(group => group.id === 'analytics').items.filter(item => item.id === 'segmented-bar');
  assert.equal(entries.length, 1); assert.equal(entries[0].kind, 'pattern');
  assert.equal(searchComponents('分段条')[0].item.id, 'segmented-bar');
  assert.ok(coreAgentSpecs['segmented-bar'].dont.some(text => text.includes('ComparisonChart')));
});
