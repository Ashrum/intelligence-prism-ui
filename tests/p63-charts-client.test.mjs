import test from 'node:test';
import assert from 'node:assert/strict';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { api, h } from './p58-chart-harness.mjs';
import { clientDOM } from './helpers/chart-client-dom.mjs';
const nodes = (host, predicate) => { const result = []; function walk(n) { if (predicate(n)) result.push(n); n.childNodes?.forEach(walk); } walk(host); return result; };
const hasClass = (n, cls) => n.attributes?.class?.split(' ').includes(cls);
for (const theme of ['light', 'paper', 'dark']) test(`P63 ${theme}: real Recharts legend moves, reserves plot space and unmounts on live changes`, async () => {
 const previous = { window: globalThis.window, document: globalThis.document, ResizeObserver: globalThis.ResizeObserver, act: globalThis.IS_REACT_ACT_ENVIRONMENT };
 const errors = [], originalError = console.error; console.error = (...args) => errors.push(args.join(' '));
 try {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true; globalThis.__p58Theme = theme;
  const observers = []; globalThis.ResizeObserver = class { constructor(callback) { this.callback = callback; observers.push(this); } observe() {} unobserve() {} disconnect() {} };
  const dom = clientDOM(800, 260); globalThis.window = dom.window; globalThis.document = dom.document;
  const host = dom.document.createElement('div'), root = createRoot(host);
  const series = [{ id: 'actual', label: '实际得分率与公式 x² + y² = 1', color: '#123456', data: [{ id: 'a', label: '第一次', value: 60 }, { id: 'b', label: '第二次', value: 80 }] }, { id: 'expected', label: '预期', color: '#654321', data: [{ id: 'a', label: '第一次', value: 70 }, { id: 'b', label: '第二次', value: 70 }] }];
  try {
   for (const width of [320, 1280]) {
    dom.resize(width, 260);
    for (const legendPosition of ['top-left', 'bottom', 'none', 'top-left']) {
     await act(() => root.render(h(api.TrendChart, { label: '趋势', series, legendPosition })));
     await act(() => { for (const o of observers) o.callback([{ contentRect: { width, height: 260 } }]); });
     const wrappers = nodes(host, n => n.attributes?.['data-chart-legend'] !== undefined);
     assert.equal(wrappers.length, legendPosition === 'none' ? 0 : 1);
     if (wrappers.length) {
      const list = wrappers[0];
      assert.ok(hasClass(list, legendPosition === 'top-left' ? 'justify-start' : 'justify-center'));
      const plot = nodes(host, n => n.attributes?.role === 'group')[0];
      assert.equal(list.parentNode, plot.parentNode, 'normal-flow sibling cannot overlay the plot');
      const siblings = list.parentNode.childNodes;
      assert.equal(siblings.indexOf(list) < siblings.indexOf(plot), legendPosition === 'top-left');
      const labels = nodes(list, n => hasClass(n, 'text-foreground'));
      assert.equal(labels.length, 2); assert.ok(labels.every(n => hasClass(n, 'text-ui-hint')));
      const icons = nodes(list, n => n.tagName === 'LINE');
      assert.deepEqual(icons.map(n => n.attributes.stroke).sort(), ['#123456', '#654321']);
      assert.equal(nodes(host, n => hasClass(n, 'recharts-legend-wrapper')).length, 0);

     }
     assert.equal(nodes(host, n => hasClass(n, 'recharts-line-curve')).length, 2);
     assert.equal(nodes(host, n => n.tagName === 'TABLE').length, 1);
    }
   }
  } finally { await act(() => root.unmount()); }
  assert.deepEqual(errors, []);
 } finally {
  console.error = originalError; globalThis.window = previous.window; globalThis.document = previous.document; globalThis.ResizeObserver = previous.ResizeObserver; globalThis.IS_REACT_ACT_ENVIRONMENT = previous.act; delete globalThis.__p58Theme;
 }
});
