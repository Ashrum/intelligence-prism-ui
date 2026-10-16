import test from 'node:test';
import assert from 'node:assert/strict';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { api, h } from './p58-chart-harness.mjs';
import { clientDOM } from './helpers/chart-client-dom.mjs';

const nodes = (host, predicate) => { const all = []; function walk(n) { if (predicate(n)) all.push(n); n.childNodes?.forEach(walk); } walk(host); return all; };
for (const theme of ['light', 'paper', 'dark']) test(`P61 ${theme}: real Recharts keeps every auto Y tick and both endpoints through resize`, async () => {
  const previous = { window: globalThis.window, document: globalThis.document, ResizeObserver: globalThis.ResizeObserver, act: globalThis.IS_REACT_ACT_ENVIRONMENT };
  const errors = [], originalError = console.error; console.error = (...args) => errors.push(args.join(' '));
  try {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true; globalThis.__p58Theme = theme;
    const observers = [];
    globalThis.ResizeObserver = class { constructor(callback) { this.callback = callback; observers.push(this); } observe() {} unobserve() {} disconnect() {} };
    const dom = clientDOM(800, 320); globalThis.window = dom.window; globalThis.document = dom.document;
    const host = dom.document.createElement('div'), client = createRoot(host);
    try {
      await act(() => client.render(h(api.TrendChart, { label: '等距自动刻度', height: 320, unit: '%', yDomain: 'auto', series: [{ id: 'a', label: '实际', data: [48, 83].map((value, i) => ({ id: String(i), label: `第 ${i + 1} 次`, value })) }] })));
      for (const width of [800, 320, 1440, 800]) {
        dom.resize(width, 320); await act(() => { for (const o of observers) o.callback([{ contentRect: { width, height: 320 } }]); });
        const axis = nodes(host, n => n.attributes?.class?.split(' ').includes('recharts-yAxis-tick-labels'))[0];
        assert.ok(axis);
        const ticks = nodes(axis, n => n.tagName === 'TEXT');
        assert.deepEqual(ticks.map(n => n.textContent), ['20%', '40%', '60%', '80%', '100%']);
        const positions = ticks.map(n => +n.attributes.y);
        for (let i = 2; i < positions.length; i++) assert.ok(Math.abs((positions[i] - positions[i - 1]) - (positions[1] - positions[0])) < 1e-6);
        const points = nodes(host, n => n.tagName === 'CIRCLE' && n.attributes?.class?.includes('recharts-line-dot'));
        assert.equal(points.length, 2);
        for (const point of points) assert.ok(+point.attributes.cy >= Math.min(...positions) && +point.attributes.cy <= Math.max(...positions));
      }
    } finally { await act(() => client.unmount()); }
    assert.deepEqual(errors, []);
  } finally {
    console.error = originalError; globalThis.window = previous.window; globalThis.document = previous.document; globalThis.ResizeObserver = previous.ResizeObserver; globalThis.IS_REACT_ACT_ENVIRONMENT = previous.act; delete globalThis.__p58Theme;
  }
});
