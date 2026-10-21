import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { api, h, capture, defaults, render } from './p58-chart-harness.mjs';
import { clientDOM } from './helpers/chart-client-dom.mjs';
import { createTestRuntime } from './helpers/test-runtime.mjs';

const rootPath = fileURLToPath(new URL('../', import.meta.url));
const demoBundle = new URL('demo.mjs', await createTestRuntime('p98-demo'));
await writeFile(demoBundle, (await build({ entryPoints: ['components/prism-next/demos/blueprint-trend.tsx'], absWorkingDir: rootPath, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': rootPath }, write: false })).outputFiles[0].text);
const demo = await import(demoBundle);
const sample = { label: 'C0', series: demo.blueprintTrendSeries, unit: '%', yDomain: [65, 80], xTickMode: 'all', height: 230, legendPosition: 'none' };

const nodes = (host, predicate) => {
  const result = [];
  function walk(node) { if (predicate(node)) result.push(node); node.childNodes?.forEach(walk); }
  walk(host); return result;
};
const hasClass = name => node => node.attributes?.class?.split(' ').includes(name);
async function mounted(theme, width, props, check) {
  const previous = Object.fromEntries(['window', 'document', 'ResizeObserver', 'IS_REACT_ACT_ENVIRONMENT', '__p58Theme'].map(key => [key, globalThis[key]]));
  const errors = [], originalError = console.error;
  console.error = (...args) => errors.push(args.join(' '));
  const observers = [];
  const height = props.height ?? 260, dom = clientDOM(width, height);
  Object.assign(globalThis, { window: dom.window, document: dom.document, IS_REACT_ACT_ENVIRONMENT: true, __p58Theme: theme,
    ResizeObserver: class { constructor(callback) { observers.push(callback); } observe() {} unobserve() {} disconnect() {} },
  });
  const host = dom.document.createElement('div'), root = createRoot(host);
  try {
    await act(() => root.render(h(api.TrendChart, props)));
    await act(() => observers.forEach(callback => callback([{ contentRect: { width, height } }])));
    await check(host);
    assert.deepEqual(errors, []);
  } finally {
    await act(() => root.unmount());
    console.error = originalError;
    Object.assign(globalThis, previous);
  }
}
// Hash every SVG element's attributes, inline style, text and ordered children.
// Only generated Recharts/React ID counters are normalized; geometry is exact.
function svgRecords(host) {
  const normalize = value => String(value).replace(/recharts\d+/g, 'recharts-ID').replace(/_r_[a-z0-9]+_/g, '_r_ID_');
  function tree(node) {
    if (node.nodeType === 3) return node.nodeValue;
    return [node.tagName, Object.fromEntries(Object.entries(node.attributes).sort().map(([k,v]) => [k,normalize(v)])),
      Object.fromEntries(Object.entries(node.style).filter(([,v]) => typeof v !== 'function').sort()), node.text ?? null, node.childNodes.map(tree)];
  }
  return nodes(host, n => n.tagName === 'SVG').map(svg => ({
    elements: nodes(svg, n => n.nodeType === 1).length,
    sha256: createHash('sha256').update(JSON.stringify(tree(svg))).digest('hex'),
  }));
}
const cases = {
  default: defaults.TrendChart,
  enriched: { label: '完整语义趋势', series: api.learningTrendSeries, height: 320, unit: '%', xTickMode: 'all', yDomain: 'auto', legendPosition: 'top-left' },
  pointOnly: { label: '独立点与单行刻度', unit: '分', xTickMode: 'all', legendPosition: 'none', series: [{ id: 'solo', label: '独立观察', connect: false, data: [{ id: 'a', label: '同名', value: 0 }, { id: 'b', label: '同名', value: 70, symbol: 'circle' }, { id: 'c', label: '缺测', value: null }, { id: 'd', label: '新情境', value: 75, symbol: 'diamond' }] }] },
};
const baselineFile = new URL('./fixtures/p98-core-trend-before.json', import.meta.url);
const baseline = JSON.parse(readFileSync(baselineFile, 'utf8'));
for (const entry of baseline.records) test(`P98 core SVG unchanged: ${entry.theme}/${entry.width}/${entry.name}`, async () => {
  await mounted(entry.theme, entry.width, cases[entry.name], host => assert.deepEqual(svgRecords(host), entry.svg));
});

for (const theme of ['blueprint', 'blueprint-night']) {
  test(`P98 ${theme}: default/explicit circle squares, semantic shapes and active selection`, () => {
    const calls = [], points = [undefined, 'circle', 'hollow-circle', 'diamond'].map((symbol, i) => ({ id: String(i), label: String(i), value: 70 + i, symbol }));
    const out = capture('TrendChart', { label: '形状', legendPosition: 'top-left', series: [{ id: 's', label: '观察', connect: false, color: '#123456', data: [...points, { id: 'null', label: '缺测', value: null }] }], onSelect: (...args) => calls.push(args) }, theme);
    const line = out.nodes.find(n => n.props.dataKey === 's');
    for (const active of [false, true]) for (const [i, point] of points.entries()) {
      const element = line.props[active ? 'activeDot' : 'dot']({ cx: 20, cy: 30, payload: { id: point.id } });
      const svg = render(element);
      assert.match(svg, /stroke-width="2"/);
      if (i < 2) {
        assert.match(svg, new RegExp(`<rect[^>]*width="${active ? 16 : 12}"[^>]*height="${active ? 16 : 12}"`));
        assert.match(svg, /fill="#123456" stroke="var\(--card\)"/);
      } else if (i === 2) assert.match(svg, /<circle[^>]*stroke="#123456"[^>]*fill="var\(--card\)"/);
      else assert.match(svg, /<path d="M/);
      element.props.onSelect();
    }
    assert.deepEqual(calls, [...points, ...points].map(p => [p.id, 's']));
    assert.equal(render(line.props.dot({ cx: 20, cy: 30, payload: { id: 'null' } })), '<g></g>');
    assert.deepEqual(out.nodes.find(n => n.type === api.ChartLegend).props.items.map(i => i.marker), ['square', 'hollow-dot', 'diamond']);
  });

  for (const width of [1280, 390]) test(`P98 ${theme}/${width}: C0 SVG grid, baseline, mono ticks, labels and compact height`, async () => {
    await mounted(theme, width, sample, host => {
      const squares = nodes(host, n => n.attributes?.['data-trend-symbol'] === 'circle');
      assert.equal(squares.length, 5);
      for (const dot of squares) assert.equal(nodes(dot, n => n.tagName === 'RECT')[0].attributes.width, '12');
      assert.equal(nodes(host, n => n.attributes?.['data-trend-symbol'] === 'diamond').length, 1);
      const grid = nodes(host, hasClass('recharts-cartesian-grid-horizontal'))[0];
      const horizontal = nodes(grid, n => n.tagName === 'LINE');
      const yAxis = nodes(host, hasClass('recharts-yAxis-tick-labels'))[0];
      const yTicks = nodes(yAxis, n => n.tagName === 'TEXT');
      assert.ok(yTicks.length >= 4);
      assert.equal(horizontal.length, yTicks.length);
      for (const line of horizontal) {
        assert.equal(line.attributes.stroke, 'var(--border)');
        assert.equal(line.attributes['stroke-width'], '1');
        assert.equal(line.attributes['stroke-dasharray'], undefined);
        assert.equal(line.attributes.y1, line.attributes.y2);
      }
      assert.equal(nodes(host, hasClass('recharts-cartesian-grid-vertical')).length, 0);
      const xAxis = nodes(host, hasClass('recharts-xAxis'))[0];
      const baseline = nodes(xAxis, hasClass('recharts-cartesian-axis-line'))[0];
      assert.equal(baseline.attributes.stroke, 'var(--line)');
      assert.equal(baseline.attributes['stroke-width'], '1.5');
      assert.equal(+baseline.attributes.y1, 230 - 36 - 6, '36px ticks + 6px margin, not legacy 54 + 24');
      const xTicks = nodes(host, n => n.attributes?.['data-trend-tick']);
      assert.equal(xTicks.length, 6);
      assert.deepEqual(xTicks.map(n => nodes(n, x => x.tagName === 'TSPAN')[0].textContent), ['W06', 'W07', 'W07', 'W08', 'W11', 'W12']);
      for (const tick of xTicks) {
        assert.equal(tick.attributes['font-family'], 'var(--font-mono)');
        const rows = nodes(tick, n => n.tagName === 'TSPAN');
        assert.equal(rows.length, 2); assert.equal(rows[1].attributes.dy, '16');
        assert.ok(+tick.attributes.y + 16 + 12 <= 230 - 6, 'both tick rows stay within reserved area');
      }
      for (const text of yTicks) {
        assert.equal(text.attributes['font-family'], 'var(--font-mono)');
        assert.match(text.textContent, /^\d+$/);
        assert.ok(horizontal.some(line => Math.abs(+line.attributes.y1 - +text.attributes.y) < 0.01));
      }
      const units = nodes(host, n => n.attributes?.['data-trend-unit'] !== undefined);
      assert.equal(units.length, 1); assert.equal(units[0].textContent, '%');
      const curves = nodes(host, hasClass('recharts-line-curve'));
      const actual = curves.find(n => n.attributes.name === '实际得分率'), expected = curves.find(n => n.attributes.name === '按难度推算的预期');
      assert.equal(actual.attributes['stroke-width'], '2.5');
      assert.equal(expected.attributes['stroke-width'], '1.5'); assert.equal(expected.attributes['stroke-dasharray'], '5 4');
      assert.equal(actual.attributes.stroke, capture('TrendChart', sample, theme).theme.colors[0]);
      assert.equal(expected.attributes.stroke, capture('TrendChart', sample, theme).theme.colors[5]);
      const labels = nodes(host, n => n.attributes?.['data-trend-label'] === 'valueLabel');
      if (width === 1280) assert.deepEqual(labels.map(n => n.textContent), ['77', '72', '70', '77', '70', '75']);
      else assert.equal(labels.length, 0, 'existing narrow label fallback is preserved');
      for (const label of labels) {
        assert.equal(label.attributes['font-family'], 'var(--font-mono)'); assert.equal(label.attributes['font-weight'], '700'); assert.equal(label.attributes.fill, 'var(--foreground)');
      }
    });
  });

  test(`P98 ${theme}: annotations remain host-owned, auto ticks are mono, units optional`, async () => {
    await mounted(theme, 1280, cases.enriched, host => {
      assert.ok(nodes(host, n => n.attributes?.['data-trend-label'] === 'annotation').some(n => n.textContent === '高于预期 3'));
    });
    await mounted(theme, 1280, { ...defaults.TrendChart, unit: '' }, host => {
      assert.equal(nodes(host, n => n.attributes?.['data-trend-unit'] !== undefined).length, 0);
      const axis = nodes(host, hasClass('recharts-xAxis-tick-labels'))[0];
      const ticks = nodes(axis, n => n.tagName === 'TEXT');
      assert.ok(ticks.length > 0);
      assert.ok(ticks.every(n => n.attributes['font-family'] === 'var(--font-mono)'));
    });
  });
}

test('P98 C0 demo uses frozen data, actual-only value labels, external P97 area/hatch legend and no invented annotations', () => {
  const [actual, expected, context] = demo.blueprintTrendSeries;
  assert.deepEqual(actual.data.map(p => p.value), [77, 72, 70, 77, 70, null]);
  assert.deepEqual(expected.data.map(p => p.value), [74, 67, 70, 75, 72, null]);
  assert.deepEqual(context.data.map(p => p.value), [75]); assert.equal(context.connect, false);
  assert.ok(expected.data.every(p => p.valueLabel === undefined));
  assert.ok(demo.blueprintTrendSeries.every(s => s.data.every(p => p.annotation === undefined)));
  const html = render(h(demo.BlueprintTrendDemo));
  assert.match(html, /id="trend-calibration"/); assert.match(html, /data-legend-marker="area"/); assert.match(html, /data-legend-marker="hatch"/);
  assert.match(html, /<details/);
});
