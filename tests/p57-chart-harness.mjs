import { build } from 'esbuild';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createTestRuntime } from './helpers/test-runtime.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const dir = await createTestRuntime('p57-charts');
const file = new URL('bundle.mjs', dir);
await writeFile(file, (await build({
  stdin: { contents: `export {PrismScopeProvider} from './components/prism-next/prism-scope'; export * from './components/prism-next/charts/donut-chart'; export * from './components/prism-next/charts/radar-chart'; export * from './components/prism-next/charts/advanced-charts'; export * from './lib/prism-next/polar-chart-options'; export * from './components/prism-next/charts/echart-engine'; export * from './lib/prism-next/config'; export {useChartTheme} from './components/prism-next/charts/chart-theme';`, resolveDir: root, loader: 'tsx' },
  bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, write: false,
  plugins: [{ name: 'p57-chart-probe', setup(build) {
    build.onResolve({ filter: /^next-themes$/ }, () => ({ path: 'theme', namespace: 'p57' }));
    build.onLoad({ filter: /.*/, namespace: 'p57' }, () => ({ contents: 'export const useTheme=()=>({theme:globalThis.__p57Theme??"light"})' }));
    build.onLoad({ filter: /\/charts\/echart\.tsx$/ }, () => ({ loader: 'tsx', contents: `export function EChart(props){(globalThis.__p57Charts??=[]).push(props);return <div role="img" aria-label={props.label} style={{height:props.height,width:"100%"}} data-chart-engine="echarts"/>}` }));
  } }],
})).outputFiles[0].text);
export const api = await import(file);
export const h = React.createElement, render = renderToStaticMarkup;
export function capture(name, props, theme = 'light') {
  globalThis.__p57Theme = theme; globalThis.__p57Charts = [];
  const nodes = [];
  function walk(node) {
    if (Array.isArray(node)) return node.map(walk);
    if (!React.isValidElement(node)) return node;
    nodes.push(node);
    return React.cloneElement(node, {}, React.Children.map(node.props.children, walk));
  }
  try {
    let chartTheme;
    const html = render(h(api.PrismScopeProvider, {theme}, h(function Probe() { chartTheme = api.useChartTheme(); return walk(api[name](props)); })));
    return { html, nodes, charts: globalThis.__p57Charts, theme: chartTheme };
  } finally { delete globalThis.__p57Theme; delete globalThis.__p57Charts; }
}
export const heatmapProps = { label: '原热力矩阵', rows: [{ id: 'r', label: '长中文行' }], columns: [{ id: 'c', label: '列一' }, { id: 'd', label: '列二' }], cells: [{ id: 'zero', row: 'r', column: 'c', value: 0 }, { id: 'missing', row: 'r', column: 'd', value: null }] };
export const optionJSON = option => JSON.stringify(option, (_, value) => typeof value === 'function' ? '[formatter]' : value);
