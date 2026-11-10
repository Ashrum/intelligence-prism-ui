import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BLUEPRINT_SERIES, chartSeriesColors } from '../lib/prism-next/chart-palette.ts';
import { relativeLuminance } from '../lib/prism-next/chart-color.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const directory = new URL(`../.sites-runtime/blueprint-drafting-${process.pid}/`, import.meta.url);
await mkdir(directory, { recursive: true });
async function bundle(contents, resolveDir, name) {
  const result = await build({ stdin: { contents, resolveDir, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, write: false });
  const file = new URL(`${name}.mjs`, directory);
  await writeFile(file, result.outputFiles[0].text);
  return import(file);
}
const api = await bundle(`export * from './components/prism-next/blueprint/blueprint';
export * from './components/prism-next/prism-scope';
export * from './lib/prism-next/polar-chart-options';
export * from './lib/prism-next/chart-palette';
export * from './components/prism-next/demos/blueprint-drafting';`, root, 'current');
const original = execFileSync('git', ['show', '3f90d476:components/prism-next/blueprint/blueprint.tsx'], { cwd: root, encoding: 'utf8' });
const baseline = await bundle(original, `${root}components/prism-next/blueprint`, 'baseline');
await rm(directory, { recursive: true });
const h = React.createElement;
const html = renderToStaticMarkup;
const scoped = (theme, child) => h(api.PrismScopeProvider, { theme }, child);
const ratio = (a, b) => {
  const x = relativeLuminance(a), y = relativeLuminance(b);
  return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
};

test('P139 dimension renders vertical and horizontal SVG groups with leaders and semantic labels', () => {
  for (const orientation of ['vertical', 'horizontal']) {
    const output = html(h('svg', { 'aria-label': '实际 76%，预期 72.1%，+3.9 ①' }, h(api.BpDimension, {
      orientation, at: 80, from: 20, to: 40, leaderFrom: 50, label: '+3.9', refNo: '①', tone: 'up',
    })));
    assert.match(output, /<g class="bp-dim-root" data-tone="up" aria-hidden="true">/);
    assert.equal((output.match(/<line /g) || []).length, 5);
    assert.equal((output.match(/stroke-dasharray="2 2"/g) || []).length, 2);
    assert.match(output, /\+3.9<tspan class="bp-dim-ref" dx="4">①/);
    assert.match(output, orientation === 'vertical' ? /x1="80" y1="20" x2="80" y2="40"/ : /x1="20" y1="80" x2="40" y2="80"/);
  }
});

test('P139 unit grid renders one cell per person and names each group and total', () => {
  const groups = [{ id: 'a', label: '稳定保持', count: 10, fill: 'done' }, { id: 'b', label: '需要支持', count: 2, fill: 'todo' }, { id: 'c', label: '数据不足', count: 0, fill: 'hatch' }];
  const output = html(h(api.BpUnitGrid, { groups, label: '学习进展' }));
  assert.match(output, /role="img" aria-label="学习进展；稳定保持 10人；需要支持 2人；数据不足 0人；总计 12人"/);
  assert.equal((output.match(/class="bp-unit-cell /g) || []).length, 12);
  assert.match(output, /<li data-tone="todo">/);
  assert.doesNotMatch(html(h(api.BpUnitGrid, { groups, label: '进展', legend: false })), /<ul/);
  assert.equal((html(h(api.BpUnitGrid, { groups: [{ ...groups[0], count: 61 }], label: '大班' })).match(/class="bp-unit-cell /g) || []).length, 61);
});

test('P139 draft and confirmed structures use inherited state for inferred spans', () => {
  const make = state => scoped('blueprint', h(api.BpDraft, { state, title: '讲评稿', provenance: [{ label: '确认', value: '王老师' }] }, h('p', {}, h(api.BpInferred, {}, '推断句'))));
  const draft = html(make('draft'));
  const confirmed = html(make('confirmed'));
  assert.match(draft, /bp-draft-band/);
  assert.match(draft, /AI 草稿 · 待你确认/);
  assert.match(draft, /data-blueprint="true" class="bp-draft-inferred"/);
  assert.doesNotMatch(draft, /bp-provenance/);
  assert.match(confirmed, /已确认/);
  assert.match(confirmed, /bp-provenance/);
  assert.doesNotMatch(confirmed, /bp-draft-band|bp-draft-inferred|data-blueprint/);
  assert.doesNotMatch(html(h(api.BpInferred, {}, '外部文字')), /bp-draft-inferred/);
});

test('P139 default size bar and explicit row retain baseline SSR bytes', () => {
  for (const props of [
    { rows: [{ id: 'r', label: '班级', unit: '人', segments: [{ id: 'a', label: '完成', value: 4, fill: 'done' }, { id: 'b', label: '待定', value: 3, fill: 'hatch-todo' }] }] },
    { rows: [{ id: 'r', label: '长中文知识点名称', total: 100, display: '37.5%', segments: [{ id: 'a', label: '出错', value: 64.4, fill: 'ai' }] }], size: 'xs', marker: { value: 72, label: '预期' }, onRowActivate() {}, activeRowId: 'r' },
  ]) {
    assert.equal(html(h(api.BpSizeBar, props)), html(h(baseline.BpSizeBar, props)));
    assert.equal(html(h(api.BpSizeBar, { ...props, layout: 'row' })), html(h(baseline.BpSizeBar, props)));
  }
});

test('P139 stacked bars retain accessible segment facts and total-scaled widths', () => {
  const output = html(h(api.BpSizeBar, { layout: 'stacked', rows: [{ id: 'r', label: '面积', total: 100, unit: '%', display: '37.5%', displayTone: 'todo', segments: [{ id: 'a', label: '已补回', value: 26.9, fill: 'ai' }, { id: 'b', label: '仍错', value: 37.5, fill: 'hatch-todo' }] }] }));
  assert.match(output, /bp-dim-size-stacked/);
  assert.match(output, /data-display-tone="todo"/);
  assert.match(output, /aria-label="面积：已补回 26.9%，仍错 37.5%"/);
  assert.match(output, /width:37.5%/);
});

test('P139 status and four chart colors exceed 4.5 on white and paper', async () => {
  const css = await readFile(new URL('../app/(next)/next/theme.css', import.meta.url), 'utf8');
  const block = css.split(':where([data-agent-preview])[data-prism-theme="blueprint"] {')[1].split('}')[0];
  const statuses = ['destructive-foreground', 'warning-foreground', 'success-foreground', 'muted-foreground'].map(name => block.match(new RegExp(`--${name}:(#[0-9A-F]+)`))[1]);
  assert.deepEqual(statuses, ['#C62828', '#A8245C', '#3F6309', '#4B5260']);
  for (const foreground of [...statuses, ...BLUEPRINT_SERIES]) for (const background of ['#FFFFFF', '#F6F6F3']) assert.ok(ratio(foreground, background) >= 4.5, `${foreground}/${background}`);
});

test('P139 blueprint tone mapping is isolated from core and night palettes', () => {
  const tones = ['info', 'warning', 'destructive', 'success', 'neutral', 'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5', 'chart-6'];
  const indices = [0, 1, 1, 2, 3, 0, 1, 2, 3, 0, 3];
  const legacy = [0, 3, 1, 2, 5, 0, 1, 2, 3, 4, 5];
  for (const theme of ['blueprint', 'light', 'paper', 'dark', 'blueprint-night']) {
    const colors = api.chartSeriesColors(theme);
    tones.forEach((tone, index) => assert.equal(api.chartToneColor({ colors }, 0, tone), colors[(theme === 'blueprint' ? indices : legacy)[index]]));
  }
  assert.deepEqual(chartSeriesColors('blueprint-night'), api.chartSeriesColors('blueprint-night'));
});

test('P139 core-theme new components use token fallbacks without inline blueprint colors', () => {
  for (const theme of ['light', 'paper', 'dark']) {
    const output = html(scoped(theme, h(api.BlueprintDraftingDemo)));
    assert.doesNotMatch(output, /#(?:0F5FA8|A8245C|3F6309|5A6B80|339FF2|C2F25B|E0438F)/i);
    assert.doesNotMatch(output, /data-blueprint="true"/);
    assert.equal((output.match(/class="bp-unit-cell /g) || []).length, 135);
  }
});
