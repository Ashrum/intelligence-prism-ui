import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { build } from 'esbuild';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { clientDOM } from './helpers/chart-client-dom.mjs';
import { createTestRuntime } from './helpers/test-runtime.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const chartPath = 'components/prism-next/charts/basic-charts.tsx';
const originalChart = execFileSync('git', ['show', `30e79e6:${chartPath}`], { cwd: root, encoding: 'utf8' });
const bundle = await build({
  stdin: {
    contents: `
      export { HatchMeter } from './components/prism-next/hatch-meter';
      export { TextureStack } from './components/prism-next/texture-stack';
      export { TrendChart } from './${chartPath}';
      export { TrendChart as OriginalTrendChart } from 'original-trend';
      export { PrismScopeProvider } from './components/prism-next/prism-scope';
    `,
    resolveDir: root,
    loader: 'tsx',
  },
  bundle: true,
  jsx: 'automatic',
  platform: 'node',
  format: 'esm',
  packages: 'external',
  alias: { '@': root },
  loader: { '.css': 'empty' },
  write: false,
  plugins: [{
    name: 'p192-baseline',
    setup(builder) {
      builder.onResolve({ filter: /^original-trend$/ }, () => ({ path: 'original-trend', namespace: 'p192' }));
      builder.onLoad({ filter: /^original-trend$/, namespace: 'p192' }, () => ({
        contents: originalChart,
        loader: 'tsx',
        resolveDir: dirname(fileURLToPath(new URL('../' + chartPath, import.meta.url))),
      }));
    },
  }],
});
const bundleFile = new URL('bundle.mjs', await createTestRuntime('p192'));
await writeFile(bundleFile, bundle.outputFiles[0].text);
const { HatchMeter, TextureStack, TrendChart, OriginalTrendChart, PrismScopeProvider } = await import(bundleFile);
const h = React.createElement;
const render = (component, props) => renderToStaticMarkup(h(component, props));

test('GR4 tokens are declared only in the explicit light/paper token block', async () => {
  const css = await readFile(new URL('../app/(next)/next/theme.css', import.meta.url), 'utf8');
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(([, , declarations]) => /--chromatic-[\w-]+\s*:/.test(declarations));
  for (const [, selector] of rules) {
    assert.match(selector, /\[data-prism-theme="light"\]/);
    assert.doesNotMatch(selector, /dark|blueprint/);
  }
  const skyRules = rules.filter(([, , declarations]) => /--chromatic-sky\s*:/.test(declarations));
  assert.equal(skyRules.length, 1);
  const [, , declarations] = skyRules[0];
  assert.deepEqual(Object.fromEntries([...declarations.matchAll(/--chromatic-([\w-]+):\s*(#[0-9A-Fa-f]{6});/g)].map(([, name, value]) => [name, value])), {
    sky: '#4EB1D9', 'sky-ink': '#0369A1', pink: '#E0438F', 'pink-ink': '#BE185D', 'pink-badge': '#C81E6F',
    lime: '#C2F25B', 'lime-anchor': '#65A30D', 'class-1': '#4EB1D9', 'class-2': '#A3D94E', 'class-3': '#F29BC4',
  });
});

test('HatchMeter gives the fill the requested width and clamps both ends', () => {
  for (const [value, width, spoken] of [[76, 76, '76.0'], [-5, 0, '0.0'], [130, 100, '100.0']]) {
    const html = render(HatchMeter, { value, tone: 'sky', size: 'sm' });
    assert.ok(html.includes(`style="width:${width}%"`));
    assert.ok(html.includes(`role="img" aria-label="得分率 ${spoken}%"`));
  }
  assert.match(render(HatchMeter, { value: 20, tone: 'pink', size: 'md', label: '录入进度' }), /aria-label="录入进度"/);
});

test('TextureStack keeps segment colors separate from the stripe layer', async () => {
  const css = await readFile(new URL('../components/prism-next/texture-stack.css', import.meta.url), 'utf8');
  assert.match(css, /\.prism-texture-stack-segment,\s*\.prism-texture-stack-swatch\s*\{\s*background-image: repeating-linear-gradient\(135deg, rgb\(255 255 255 \/ \.75\) 0 2px, transparent 2px 6px\)/);
  const html = render(TextureStack, {
    segments: [
      { id: 'first', label: '九年级(1)班', shortLabel: '九(1)班', value: 6, color: '#4EB1D9' },
      { id: 'second', label: '九年级(2)班', value: 6, color: '#A3D94E' },
      { id: 'third', label: '八年级(7)班', value: 4, color: '#F29BC4' },
    ],
    selectedId: 'first',
    onSelect() {},
  });
  assert.match(html, /background-color:#4EB1D9;flex-grow:37\.5/);
  assert.match(html, /background-color:#A3D94E;flex-grow:37\.5;opacity:0\.28/);
  assert.match(html, /background-color:#F29BC4;flex-grow:25;opacity:0\.28/);
  assert.doesNotMatch(html, /style="[^"]*\bbackground:/);
  assert.match(html, /九年级\(1\)班：已完成 6 份（占比 38%）/);
  assert.match(html, /九\(1\)班 <strong/);
});

test('TrendChart without a variant renders the same SSR bytes as 30e79e6', () => {
  const props = {
    label: '批阅得分率',
    unit: '%',
    yDomain: 'auto',
    legendPosition: 'top-left',
    series: [
      { id: 'a', label: '一班', data: [
        { id: 'first', label: '开学测试', value: 80, tickLabel: ['开学', '测试'], symbol: 'diamond' },
        { id: 'mid', label: '期中', value: null },
        { id: 'last', label: '间隔复查', value: 76, annotation: 'x² + y² = 1' },
      ] },
      { id: 'b', label: '二班', data: [{ id: 'last', label: '间隔复查', value: 70 }], lineStyle: 'dashed' },
    ],
  };
  for (const theme of ['light', 'paper', 'dark', 'blueprint', 'blueprint-night']) {
    const ssr = chart => render(PrismScopeProvider, { theme, children: h(chart, props) });
    assert.equal(ssr(TrendChart), ssr(OriginalTrendChart), theme);
  }
  const spark = render(TrendChart, { ...props, variant: 'spark' });
  assert.match(spark, /data-trend-variant="spark" style="height:48px"/);
  assert.doesNotMatch(spark, /<table|<details|系列图例|recharts-(?:cartesian-axis|cartesian-grid)/);
});

test('TrendChart spark renders its 144×48 plot and colors only the low endpoint pink', async () => {
  const dom = clientDOM(144, 48);
  const previous = { window: globalThis.window, document: globalThis.document, IS_REACT_ACT_ENVIRONMENT: globalThis.IS_REACT_ACT_ENVIRONMENT };
  Object.assign(globalThis, { window: dom.window, document: dom.document, IS_REACT_ACT_ENVIRONMENT: true });
  const host = dom.document.createElement('div');
  const client = createRoot(host);
  const children = (node, tag) => (node.childNodes ?? []).flatMap(child => [
    ...(child.tagName === tag ? [child.attributes] : []), ...children(child, tag),
  ]);
  const props = { label: '最近得分率', variant: 'spark', series: [{ id: 'class', label: '一班', data: [
    { id: 'first', label: '第一次', value: 55 },
    { id: 'last', label: '第二次', value: 59 },
  ] }] };
  try {
    await act(() => client.render(h(TrendChart, props)));
    const [svg] = children(host, 'SVG');
    assert.equal(svg.viewBox, '0 0 144 48');
    const dots = children(host, 'CIRCLE');
    assert.deepEqual(dots.map(({ r, fill, stroke }) => [r, fill, stroke]), [
      ['2.5', '#fff', 'var(--chromatic-sky)'],
      ['4', 'var(--chromatic-pink)', 'var(--chromatic-pink)'],
    ]);
    assert.deepEqual(children(host, 'STOP').map(stop => stop['stop-opacity']), ['0.22', '0']);
  } finally {
    await act(() => client.unmount());
    Object.assign(globalThis, previous);
  }
});
