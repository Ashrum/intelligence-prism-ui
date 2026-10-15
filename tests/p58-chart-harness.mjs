import { build } from 'esbuild';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createTestRuntime } from './helpers/test-runtime.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const file = new URL('bundle.mjs', await createTestRuntime('p58-charts'));
await writeFile(file, (await build({
  stdin: { contents: `export * from './components/prism-next/charts/chart-legend'; export * from './components/prism-next/charts/basic-charts'; export {HeatmapChart,BoxPlotChart} from './components/prism-next/charts/advanced-charts'; export * from './components/prism-next/charts/combo-chart'; export * from './components/prism-next/charts/donut-chart'; export * from './components/prism-next/charts/radar-chart'; export * from './components/prism-next/charts/segmented-bar'; export * from './components/prism-next/demos/learning-overview-cards'; export * from './lib/prism-next/chart-options'; export * from './components/prism-next/charts/scatter-chart'; export * from './components/prism-next/charts/paired-dot-chart'; export * from './components/prism-next/data-display'; export * from './components/prism-next/charts/echart-engine'; export * from './components/prism-next/demos/learning-chart-properties'; export * from './components/prism-next/demos/learning-record-properties'; export * from './lib/prism-next/trend-label-layout'; export * from './lib/prism-next/metric-visual'; export {useChartTheme} from './components/prism-next/charts/chart-theme';`, resolveDir: root, loader: 'tsx' },
  bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, write: false,
  plugins: [{ name: 'p58-probe', setup(build) {
    build.onResolve({ filter: /^next-themes$/ }, () => ({ path: 'theme', namespace: 'p58' }));
    build.onLoad({ filter: /.*/, namespace: 'p58' }, () => ({ contents: 'export const useTheme=()=>({theme:globalThis.__p58Theme??"light"})' }));
    build.onLoad({ filter: /\/charts\/echart\.tsx$/ }, () => ({ loader: 'tsx', contents: `export function EChart(props){globalThis.__p58Charts.push(props);return <div role="img" aria-label={props.label} style={{height:props.height,width:"100%"}} data-chart-engine="echarts"/>}` }));
  } }],
})).outputFiles[0].text);
export const api = await import(file), h = React.createElement, render = renderToStaticMarkup;
export const optionJSON = option => JSON.stringify(option, (_, value) => typeof value === 'function' ? '[function]' : value);
export function capture(name, props, theme = 'light') {
  globalThis.__p58Theme = theme; globalThis.__p58Charts = [];
  const nodes = [];
  function walk(node) {
    if (Array.isArray(node)) return node.map(walk);
    if (!React.isValidElement(node)) return node;
    nodes.push(node);
    return React.cloneElement(node, {}, React.Children.map(node.props.children, walk));
  }
  try {
    const html = render(h(function Probe() { return walk(api[name](props)); }));
    return { html, nodes, charts: globalThis.__p58Charts, theme: api.useChartTheme() };
  } finally { delete globalThis.__p58Theme; delete globalThis.__p58Charts; }
}
export const defaults = {
  TrendChart: { label: '原趋势', series: [{ id: 'a', label: '实际', data: [{ id: 'zero', label: '零值', value: 0 }, { id: 'missing', label: '缺测', value: null }, { id: 'b', label: '第三次', value: 80 }] }], unit: '%', domain: [0, 100] },
  ScatterChart: { label: '原四象限', data: [{ id: 'a', label: '章', x: 60, y: 40 }], xLabel: '得分率', yLabel: '补回率', xDomain: [0, 100], yDomain: [0, 100], quadrants: { x: 70, y: 60, labels: ['左上', '右上', '左下', '右下'] } },
  PairedDotChart: { label: '原双点', data: [{ id: 'a', label: '题一', first: 0, second: 55 }, { id: 'b', label: '题二', first: null, second: 20 }], metrics: [{ id: 'first', label: '出错' }, { id: 'second', label: '再错' }], domain: [0, 100] },
  MetricSummary: { items: [{ id: 'a', label: '指标', value: '72%', detail: '口径' }] },
};
