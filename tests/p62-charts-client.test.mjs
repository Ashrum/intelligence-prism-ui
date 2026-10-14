import test from 'node:test';
import assert from 'node:assert/strict';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { api, h } from './p58-chart-harness.mjs';
import { clientDOM } from './helpers/chart-client-dom.mjs';

const nodes = (host, predicate) => { const result = []; function walk(node) { if (predicate(node)) result.push(node); node.childNodes?.forEach(walk); } walk(host); return result; };
const hasClass = (node, cls) => node.attributes?.class?.split(' ').includes(cls);
for (const theme of ['light', 'paper', 'dark']) test(`P62 ${theme}: real Recharts spark keeps eight slots, no grid/y-axis, null markers and caller height across resize`, async () => {
  const previous = { window: globalThis.window, document: globalThis.document, ResizeObserver: globalThis.ResizeObserver, act: globalThis.IS_REACT_ACT_ENVIRONMENT };
  const errors = [], originalError = console.error; console.error = (...args) => errors.push(args.join(' '));
  try {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true; globalThis.__p58Theme = theme;
    const observers = []; globalThis.ResizeObserver = class { constructor(callback) { this.callback = callback; observers.push(this); } observe() {} unobserve() {} disconnect() {} };
    const dom = clientDOM(800, 120); globalThis.window = dom.window; globalThis.document = dom.document;
    const host = dom.document.createElement('div'), root = createRoot(host);
    const data = [0, 168, null, 248, 212, null, 284, 336].map((value, i) => ({ id: `w${i}`, label: String(i + 1), value }));
    const props = { label: '每周新增有效作答', variant: 'spark', data, dataDisclosure: 'hidden', onSelect() {} };
    try {
      await act(() => root.render(h(api.ComparisonChart, props)));
      for (const [width, height] of [[800, 120], [320, 120], [1440, 180], [800, 120]]) {
        await act(() => root.render(h(api.ComparisonChart, { ...props, height })));
        dom.resize(width, height); await act(() => { for (const o of observers) o.callback([{ contentRect: { width, height } }]); });
        assert.equal(nodes(host, n => hasClass(n, 'recharts-cartesian-grid')).length, 0);
        assert.equal(nodes(host, n => hasClass(n, 'yAxis')).length, 0);
        const xaxis = nodes(host, n => hasClass(n, 'xAxis'))[0]; assert.ok(xaxis);
        // P65 now renders sparsified ticks in the plot layer; these eight short names still all fit.
        assert.equal(nodes(host, n => n.attributes?.['data-spark-tick'] !== undefined).length, 8);
        assert.equal(nodes(xaxis, n => hasClass(n, 'recharts-cartesian-axis-line')).length, 1);
        const markers = nodes(host, n => n.attributes?.['data-spark-empty']);
        assert.deepEqual(markers.map(n => n.attributes['data-spark-empty']), ['w0', 'w2', 'w5']);
        const firstX = (width - 16) / 8 / 2;
        assert.ok(Math.abs((+markers[0].attributes.x1 + +markers[0].attributes.x2) / 2 - firstX) < .01);
        assert.match(markers[1].textContent, /缺测/); assert.match(markers[0].textContent, /0/);
        for (const marker of markers) { assert.equal(marker.attributes.stroke, 'var(--muted-foreground)'); assert.ok(+marker.attributes.x1 >= 0 && +marker.attributes.x2 <= width); assert.ok(+marker.attributes.y1 <= height); }
        const bars = nodes(host, n => n.tagName === 'PATH' && hasClass(n, 'recharts-rectangle'));
        assert.equal(bars.length, 5); assert.ok(bars.every(n => +n.attributes.width <= 24));
        assert.equal(nodes(host, n => n.tagName === 'SUMMARY').length, 0);
        assert.equal(nodes(host, n => n.tagName === 'BUTTON').length, 0);
        assert.ok(nodes(host, n => n.tagName === 'TABLE').length > 0);
      }
      // All-missing and known-zero series keep category positions and never manufacture bars.
      await act(() => root.render(h(api.ComparisonChart, { ...props, data: data.map(p => ({ ...p, value: null })) })));
      assert.equal(nodes(host, n => n.attributes?.['data-spark-empty']).length, 8);
      assert.equal(nodes(host, n => n.tagName === 'PATH' && hasClass(n, 'recharts-rectangle')).length, 0);
      // Explicit default restores the existing axes/grid, and disclosure can be restored live.
      await act(() => root.render(h(api.ComparisonChart, { ...props, variant: 'default', horizontal: false, dataDisclosure: 'visible' })));
      assert.equal(nodes(host, n => hasClass(n, 'recharts-cartesian-grid')).length, 1);
      assert.equal(nodes(host, n => n.tagName === 'SUMMARY').length, 1);
      assert.equal(nodes(host, n => n.attributes?.['data-spark-empty']).length, 0);
    } finally { await act(() => root.unmount()); }
    assert.deepEqual(errors, []);
  } finally {
    console.error = originalError; globalThis.window = previous.window; globalThis.document = previous.document; globalThis.ResizeObserver = previous.ResizeObserver; globalThis.IS_REACT_ACT_ENVIRONMENT = previous.act; delete globalThis.__p58Theme;
  }
});
