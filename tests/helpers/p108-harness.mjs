import { build } from 'esbuild';
import { writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { relative, dirname } from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createTestRuntime } from './test-runtime.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
export const baseline = '0a2be7b5dc9d2c474b344902181a61c8592fca05';
export const h = React.createElement, render = renderToStaticMarkup;
export const json = value => JSON.stringify(value, (_, v) => typeof v === 'function' ? '[function]' : v);
// Frozen sources are used only by the one-time baseline capture; normal tests use the checked-in fingerprints.
export async function createHarness(frozen = false) {
  const file = new URL('bundle.mjs', await createTestRuntime('p108'));
  const result = await build({
    stdin: { contents: `export * from './components/prism-next/charts/basic-charts'; export * from './components/prism-next/charts/scatter-chart'; export * from './components/prism-next/charts/paired-dot-chart'; export * from './components/prism-next/charts/segmented-bar'; export * from './components/prism-next/data-display'; export * from './components/prism-next/blueprint/blueprint'; export * from './components/prism-next/demos/learning-chart-properties'; export * from './lib/prism-next/metric-visual'; export * from './lib/prism-next/chart-options'; export * from './components/prism-next/charts/echart-engine'; export {PrismScopeProvider} from './components/prism-next/prism-scope';`, resolveDir: root, loader: 'tsx' },
    bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false,
    plugins: [{ name: 'p108-probe', setup(builder) {
      builder.onResolve({ filter: /^next-themes$/ }, () => ({ path: 'theme', namespace: 'p108' }));
      builder.onLoad({ filter: /.*/, namespace: 'p108' }, () => ({ contents: 'export const useTheme=()=>({theme:globalThis.__p108Theme??"light"})' }));
      builder.onLoad({ filter: /\/charts\/echart\.tsx$/ }, () => ({ loader: 'tsx', contents: `export function EChart(props){globalThis.__p108Charts.push(props);return <div role="img" aria-label={props.label} style={{height:props.height,width:"100%"}} data-chart-engine="echarts"/>}` }));
      if (frozen) builder.onLoad({ filter: /\.(tsx?|css)$/ }, args => {
        const path = relative(root, args.path);
        if (!/^(components|lib)\//.test(path)) return;
        return { contents: execFileSync('git', ['show', `${baseline}:${path}`], { cwd: root, encoding: 'utf8' }), loader: path.endsWith('.css') ? 'empty' : path.endsWith('.tsx') ? 'tsx' : 'ts', resolveDir: dirname(args.path) };
      });
    } }],
  });
  await writeFile(file, result.outputFiles[0].text);
  const api = await import(file);
  function capture(name, props, theme = 'light') {
    globalThis.__p108Theme = theme; globalThis.__p108Charts = [];
    const nodes = [];
    function walk(node) {
      if (Array.isArray(node)) return node.map(walk);
      if (!React.isValidElement(node)) return node;
      nodes.push(node);
      return React.cloneElement(node, {}, React.Children.map(node.props.children, walk));
    }
    try {
      const html = render(h(api.PrismScopeProvider, { theme }, h(function Probe() { return walk(api[name](props)); })));
      return { html, nodes, charts: globalThis.__p108Charts };
    } finally { delete globalThis.__p108Theme; delete globalThis.__p108Charts; }
  }
  return { api, capture };
}

export const themes = ['light', 'paper', 'dark', 'blueprint', 'blueprint-night'];
export const trend = { label: '趋势 x²', unit: '%', yDomain: 'auto', series: [{ id: 'actual', label: '实际', data: [{ id: 'a', label: '第一次', value: 70, valueLabel: '宿主标签', annotation: '宿主注释' }, { id: 'b', label: '第二次', value: 57.5 }, { id: 'c', label: '第三次', value: 99.975 }, { id: 'missing', label: '缺测期', value: null }] }] };
export const scatter = { label: '象限 x²', unit: '%', xUnit: '%', xLabel: '得分', yLabel: '补回', xDomain: 'auto', yDomain: 'auto', quadrants: { x: 65.25, y: 70.45, labels: ['左上', '右上', '左下', '右下'] }, data: [{ id: 'a', label: '一元二次方程', x: 70, y: 57.5 }, { id: 'b', label: '端点', x: 99.975, y: 82.225 }, { id: 'missing', label: '缺测', x: null, y: 70 }] };
export const paired = { label: '两次率', unit: '%', domain: [0, 100], metrics: [{ id: 'first-rate', label: '首次' }, { id: 'second-rate', label: '再次' }], data: [{ id: 'a', label: '方程 x²', first: 70, second: 57.5 }, { id: 'missing', label: '未复查', first: 99.975, second: null }, { id: 'zero', label: '零', first: 0, second: 0 }] };
export const segments = { label: '覆盖', unit: '人', total: 40, dataDisclosure: 'visible', segments: [{ id: 'done', label: '已有', value: 23 }, { id: 'pending', label: '待核对', value: 5, tone: 'info' }, { id: 'zero', label: '零', value: 0 }] };
export const metric = { items: [{ id: 'rate', label: '得分率', value: '70.0%', visual: { kind: 'sparkline', values: [70, null, 57.5, 99.975] } }, { id: 'ring', label: '环', value: '23/40', visual: { kind: 'ring', value: 23, max: 40 } }] };
export const size = { rows: [{ id: 'r', label: '近期', unit: '%', total: 100, display: '宿主读数', segments: [{ id: 'done', label: '实际', value: 70.123456789, fill: 'ink' }, { id: 'other', label: '其他', value: 20, fill: 'hatch' }] }], marker: { value: 99.975, label: '预期' } };
export const cases = [
  ['trend', 'TrendChart', trend], ['trend-hidden', 'TrendChart', { ...trend, dataDisclosure: 'hidden', decimals: 1 }],
  ['scatter', 'ScatterChart', scatter], ['quadrant', 'QuadrantScatterChart', { ...scatter, decimals: 1 }],
  ...[{}, { density: 'compact' }, { rowLayout: 'inline' }].map((layout, i) => [`paired-${i}`, 'PairedDotChart', { ...paired, ...layout }]),
  ['segments', 'SegmentedBar', segments], ['segments-select', 'SegmentedBar', { ...segments, onSelect() {} }],
  ['segments-default', 'SegmentedBar', { ...segments, dataDisclosure: undefined, percentDecimals: 0 }],
  ...[undefined, 'grid', 'strip'].map((layout, i) => [`metric-${i}`, 'MetricSummary', { ...metric, layout }]),
  ['size', 'BpSizeBar', size], ['size-xs', 'BpSizeBar', { ...size, size: 'xs' }],
  ['size-multi', 'BpSizeBar', { ...size, rows: [...size.rows, { ...size.rows[0], id: 'r2', display: undefined }], legendValues: true }],
];

export function textOutputs(name, out) {
  if (name === 'TrendChart') {
    const tooltip = out.nodes.find(n => n.props.contentStyle)?.props;
    const line = out.nodes.find(n => n.type?.name === 'Line' || n.type?.displayName === 'Line');
    const axis = out.nodes.find(n => n.type?.name === 'YAxis' || n.type?.displayName === 'YAxis');
    const chart = out.nodes.find(n => Array.isArray(n.props.data) && n.props.data[0]?.actual !== undefined);
    return { axis: [0, 57.5, 99.975].map(v => axis.props.tickFormatter(v)), tooltip: chart.props.data.filter(row => row.actual !== null).map(row => {
      const result = tooltip.formatter(row.actual, line.props.name, { dataKey: 'actual', payload: row });
      return Array.isArray(result) ? [render(result[0]), result[1]] : result;
    }) };
  }
  return out.charts.map(({ option }) => ({
    axes: [option.xAxis, option.yAxis].map(axis => typeof axis.axisLabel?.formatter === 'function' ? [0, 57.5, 99.975].map(axis.axisLabel.formatter) : []),
    series: option.series.filter(s => s.type === 'scatter').map(s => s.data.map(d => {
      const params = { name: d.name, data: d, value: d.value, seriesName: s.name, seriesId: s.id };
      return { tooltip: option.tooltip.formatter(params), label: s.label.formatter(params) };
    })),
  }));
}
