import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createTestRuntime } from './helpers/test-runtime.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const file = new URL('charts.mjs', await createTestRuntime('portal-chart-options'));
await writeFile(file, (await build({
  stdin: { contents: `export * from './components/prism-next/prism-scope';
    export { PortalScopeDemo } from './components/prism-next/demos/portal-scope';
    export { HeatmapChart, BoxPlotChart } from './components/prism-next/charts/advanced-charts';
    export { DonutChart } from './components/prism-next/charts/donut-chart';
    export { ComboChart } from './components/prism-next/charts/combo-chart';
    export * from './lib/prism-next/chart-palette';`, resolveDir: root, loader: 'tsx' },
  bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, write: false,
  plugins: [{ name: 'scoped-chart-options', setup(b) {
    b.onResolve({ filter: /^next-themes$/ }, () => ({ path: 'theme', namespace: 'p74-chart' }));
    b.onLoad({ filter: /.*/, namespace: 'p74-chart' }, () => ({ contents: 'export const useTheme=()=>({theme:globalThis.__p74ChartGlobal})' }));
    b.onLoad({ filter: /\/charts\/echart\.tsx$/ }, () => ({ loader: 'tsx', contents: 'export function EChart(props){globalThis.__p74ChartOptions.push(props.option);return null}' }));
  } }],
})).outputFiles[0].text);
const api = await import(file), h = React.createElement;
const heatmap = { label: 'scope matrix', rows: [{ id: 'r', label: '行' }], columns: [{ id: 'c', label: '列' }], cells: [{ id: 'zero', row: 'r', column: 'c', value: 0 }, { id: 'missing', row: 'r', column: 'c', value: null }] };
const box = { label: 'scope box', selectedId: 'b', data: [{ id: 'a', label: 'A', values: [0, 10, 20, 30, 40] }, { id: 'b', label: 'B', values: [1, 11, 21, 31, 41] }] };
const donut = { label: 'scope donut', segments: [{ id: 'a', label: 'A', value: 4 }, { id: 'b', label: 'B', value: 6 }] };
function capture(name, props, globalTheme, localTheme) {
  globalThis.__p74ChartGlobal = globalTheme; globalThis.__p74ChartOptions = [];
  try {
    const element = h(api[name], props);
    renderToStaticMarkup(localTheme ? h(api.PrismScopeProvider, { theme: localTheme }, element) : element);
    return globalThis.__p74ChartOptions[0];
  } finally { delete globalThis.__p74ChartGlobal; delete globalThis.__p74ChartOptions; }
}
const normalize = option => JSON.stringify(option, (_, value) => typeof value === 'function' ? '[function]' : value);

test('P74: full chart option objects retain core defaults under a local scope, including shapes and sequential colors', () => {
  for (const [name, props] of [['HeatmapChart', heatmap], ['BoxPlotChart', box], ['DonutChart', donut]]) {
    for (const core of ['light', 'paper', 'dark']) {
      const original = capture(name, props, core);
      assert.equal(normalize(capture(name, props, 'blueprint', core)), normalize(original), `${name}/${core}`);
    }
  }
});

test('P74: local Blueprint and Blueprint Night use the central series, shape and ramp palettes instead of global colors', () => {
  for (const theme of ['blueprint', 'blueprint-night']) {
    const matrix = capture('HeatmapChart', heatmap, 'light', theme);
    assert.equal(normalize(matrix), normalize(capture('HeatmapChart', heatmap, theme)));
    if (theme === 'blueprint') assert.deepEqual(matrix.visualMap.inRange.color, [...api.BLUEPRINT_SEQUENTIAL]);
    assert.notEqual(matrix.series[0].data[0].value[2], matrix.series[0].data[1].value[2], 'zero and missing remain distinct');
    const shape = capture('BoxPlotChart', box, 'light', theme).series[0].data;
    const colors = api.chartShapeColors(theme);
    assert.equal(shape[0].itemStyle.color, colors.fill); assert.equal(shape[0].itemStyle.borderColor, colors.base); assert.equal(shape[1].itemStyle.borderColor, colors.selected);
    const pie = capture('DonutChart', donut, 'light', theme).series[0].data;
    assert.equal(pie[0].itemStyle.color, api.chartSeriesColors(theme)[0]); assert.equal(pie[1].itemStyle.color, api.chartSeriesColors(theme)[1]);
  }
});

test('P74: explicit caller colors still override a scoped theme', () => {
  const sequentialColors = ['#112233', '#445566', '#778899'];
  assert.deepEqual(capture('HeatmapChart', { ...heatmap, sequentialColors }, 'light', 'blueprint').visualMap.inRange.color, sequentialColors);
  const combo = { label: 'explicit', categories: [{ id: 'a', label: 'A' }], axes: [{ id: 'y', label: '数量', unit: '项' }],
    series: [{ id: 's', label: '材料', type: 'bar', axisId: 'y', color: '#123456', data: [{ id: 'a', value: 3 }] }] };
  assert.equal(capture('ComboChart', combo, 'light', 'blueprint').series[0].itemStyle.color, '#123456');
});

test('P74: the existing Menu page fixture exposes the real Agent Combobox and the requested review actions', () => {
  const html = renderToStaticMarkup(h(api.PortalScopeDemo));
  for (const text of ['查看班级候选', '局部材料类型', '局部材料操作', '局部对话框', '触发局部通知', '触发外层通知', '触发全局通知', '离开局部预览', '局部主题材料数量', '核心主题材料数量']) assert.ok(html.includes(text), text);
  assert.match(html, /role="combobox"/);
  assert.match(html, /data-portal-scope-target="blueprint"/);
  assert.match(html, /data-portal-scope-target="light"/);
});
