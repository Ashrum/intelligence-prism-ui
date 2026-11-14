import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createTestRuntime } from './helpers/test-runtime.mjs';

const root = process.cwd();
const runtime = await createTestRuntime('p174');
async function load(baseline = false) {
  const result = await build({
    stdin: { contents: `export * from './components/prism-next/question-rail'; export * from './components/prism-next/data-display'; export * from './components/prism-next/charts/segmented-bar'; export * from './components/prism-next/scale-meter'; export * from './components/prism-next/prism-scope'; export { QuestionRailDemo, QuestionRailOutlineDemo } from './components/prism-next/demos/question-rail';`, resolveDir: root, loader: 'tsx' },
    bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, write: false, loader: { '.css': 'empty' },
    plugins: baseline ? [{ name: 'baseline', setup(builder) {
      builder.onLoad({ filter: /prism-next\/(question-rail|data-display|charts\/segmented-bar)\.tsx$/ }, ({ path: file }) => ({ contents: execFileSync('git', ['show', `3733107:${path.relative(root, file)}`], { encoding: 'utf8' }), loader: 'tsx' }));
    } }] : [],
  });
  const file = new URL(baseline ? 'baseline.mjs' : 'current.mjs', runtime);
  await writeFile(file, result.outputFiles[0].text);
  return import(file.href);
}
const current = await load(), baseline = await load(true);
const render = (api, name, props, theme = 'light') => renderToStaticMarkup(React.createElement(api.PrismScopeProvider, { theme }, React.createElement(api[name], props)));
const noop = () => {};
const tones = ['neutral', 'success', 'warning', 'destructive'];
const questions = tones.map((tone, index) => ({ id: String(index), number: index + 1, tone, value: '50%', ratio: 50, ariaLabel: `第 ${index + 1} 题`, tooltip: '题目说明' }));
const rail = { sections: ['cell', 'row'].map(layout => ({ id: layout, label: layout, layout, pages: [{ id: layout, items: questions }] })), selected: '2', panelId: 'preview', onSelect: noop, onLocate: noop, onPage: noop };
const items = [{ id: 'count', label: '题数', value: 12 }, { id: 'score', label: '总分', value: 100 }, { id: 'duration', label: '建议时长', value: 45, unit: '分钟' }];
const segments = [{ id: 'a', label: '基础', value: 8, tone: 'success', fill: 'done' }, { id: 'b', label: '提升', value: 4, tone: 'warning', fill: 'hatch' }];

for (const theme of ['light', 'paper', 'dark', 'blueprint', 'blueprint-night']) {
  test(`P174 omitted props preserve 3733107 SSR bytes in ${theme}`, () => {
    for (const extra of [{}, { sections: [] }, { filters: [{value:'all',label:'全部',ariaLabel:'全部题目'}], filter:'all',onFilterChange:noop }]) {
      const props = { ...rail, ...extra };
      assert.equal(render(current, 'QuestionRail', props, theme), render(baseline, 'QuestionRail', props, theme));
      assert.equal(render(current, 'QuestionRail', { ...props, cellAppearance: 'default' }, theme), render(baseline, 'QuestionRail', props, theme));
    }
    for (const layout of [undefined, 'row', 'strip', 'grid']) for (const density of ['default', 'compact']) for (const visual of [undefined, {kind:'ring',value:50,min:0,max:100}]) {
      const props = { layout, density, items: items.map(item => ({ ...item, detail:'说明',help:'口径',visual })), onSelect:noop };
      assert.equal(render(current, 'MetricSummary', props, theme), render(baseline, 'MetricSummary', props, theme));
    }
    for (const dataDisclosure of [undefined, 'visible', 'hidden']) for (const onSelect of [undefined, noop]) for (const data of [[], segments]) {
      const props = { label:'难度结构', segments:data, dataDisclosure, onSelect };
      assert.equal(render(current, 'SegmentedBar', props, theme), render(baseline, 'SegmentedBar', props, theme));
    }
  });
}

test('P174 outline cells retain selected ring and leave row buttons byte-identical', () => {
  const html = render(current, 'QuestionRail', { ...rail, cellAppearance:'outline' });
  const old = render(baseline, 'QuestionRail', rail);
  const buttons = source => [...source.matchAll(/<button\b[^>]*data-question-layout="(cell|row)"[^>]*>[\s\S]*?<\/button>/g)];
  const cells = buttons(html).filter(match => match[1] === 'cell');
  assert.equal(cells.length, 4);
  for (const [button] of cells) {
    for (const value of ['min-h-11', 'border-border', 'rounded-[6px]!', 'bg-card!', 'hover:bg-accent!', 'shadow-none!']) assert.ok(button.includes(value), value);
    assert.doesNotMatch(button, /bg-(warning|destructive)\/10/);
  }
  assert.match(cells[2][0], /color-mix\(in srgb, var\(--warning\) 40%, var\(--border\)\)/);
  assert.match(cells[3][0], /color-mix\(in srgb, var\(--destructive\) 40%, var\(--border\)\)/);
  assert.match(cells[2][0], /ring-2 ring-info/);
  assert.deepEqual(buttons(html).filter(match => match[1] === 'row').map(match => match[0]), buttons(old).filter(match => match[1] === 'row').map(match => match[0]));
});

test('P174 readout uses fixed equal columns, semantic typography and read-only values', () => {
  for (const count of [0, 1, 2, 3, 4]) {
    const data = Array.from({length:count}, (_, i) => ({...items[i % 3],id:String(i),detail:'省略明细',help:'省略帮助',visual:{kind:'ring',value:50,min:0,max:100}}));
    const html = render(current, 'MetricSummary', {items:data,layout:'readout',onSelect:noop});
    assert.ok(html.includes(`grid-template-columns:repeat(${Math.max(1,count)}, minmax(0, 1fr))`));
    assert.equal((html.match(/<dt\b/g) || []).length, count);
    assert.equal((html.match(/border-l border-border/g) || []).length, Math.max(0,count-1));
    assert.doesNotMatch(html, /省略明细|省略帮助|<button|<svg|@min-/);
    if (count) assert.match(html, /px-3 pl-0/);
  }
  const html = render(current, 'MetricSummary', {items,layout:'readout'});
  assert.match(html, /text-page-title leading-\[1\.1\] tabular-nums/);
  assert.match(html, /font-family:var\(--font-mono\)/);
  assert.match(html, /ml-\[3px\] text-ui-action text-muted-foreground">分钟/);
});

test('P174 ScaleMeter composes native range semantics, endpoints and scoped visual values', async () => {
  const html = render(current, 'ScaleMeter', {value:2,min:1,max:3,'aria-label':'整卷难度','aria-valuetext':'适中',label:{start:'偏易',end:'偏难'}});
  for (const value of ['role="meter"','aria-valuenow="2"','aria-valuemin="1"','aria-valuemax="3"','aria-valuetext="适中"','偏易','偏难','prism-scale-meter-track','prism-scale-meter-indicator']) assert.ok(html.includes(value), value);
  assert.doesNotMatch(render(current, 'ScaleMeter', {value:50,min:0,max:100,'aria-label':'读数'}), /偏易|偏难/);
  const css = await readFile('components/prism-next/scale-meter.css','utf8');
  for (const value of ['height:6px','border-radius:9999px','color-mix(in srgb, var(--brand-blue) 12%, var(--muted))','background:var(--brand-blue)','border:0','box-shadow:none','prefers-reduced-motion: reduce','transition:none']) assert.ok(css.includes(value), value);
});

for (const theme of ['light','blueprint','blueprint-night']) test(`P174 custom color overrides tone/fill on bar, legend and table in ${theme}`, () => {
  for (const onSelect of [undefined, noop]) {
    const html = render(current, 'SegmentedBar', {label:'结构',dataDisclosure:'visible',onSelect,segments:segments.map(segment => ({...segment,color:'var(--brand-blue-text)'}))}, theme);
    assert.equal((html.match(/background:var\(--brand-blue-text\)/g) || []).length, 6);
    assert.doesNotMatch(html, /bp-fill-/);
    assert.match(html, /<table/);
  }
});

test('P174 QuestionRailOutlineDemo renders outline cells separately from the unchanged demo', () => {
  const html = render(current, 'QuestionRailOutlineDemo');
  assert.match(html, /细线题号格/);
  assert.match(html, /rounded-\[6px\]!/);
  assert.match(html, /bg-card!/);
  assert.doesNotMatch(render(current, 'QuestionRailDemo'), /细线题号格/);
});
