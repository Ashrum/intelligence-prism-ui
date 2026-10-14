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
     const wrappers = nodes(host, n => hasClass(n, 'recharts-legend-wrapper'));
     assert.equal(wrappers.length, legendPosition === 'none' ? 0 : 1);
     if (wrappers.length) {
      const wrapper = wrappers[0], list = nodes(wrapper, n => n.tagName === 'UL')[0];
      assert.equal(list.style.textAlign, legendPosition === 'top-left' ? 'left' : 'center');
      assert.equal(parseFloat(wrapper.style[legendPosition === 'top-left' ? 'top' : 'bottom']), legendPosition === 'top-left' ? 12 : 6);
      const labels = nodes(wrapper, n => hasClass(n, 'text-foreground'));
      assert.equal(labels.length, 2); assert.ok(labels.every(n => hasClass(n, 'text-ui-hint')));
      const icons = nodes(wrapper, n => hasClass(n, 'recharts-legend-icon'));
      assert.deepEqual(icons.map(n => n.attributes.stroke).sort(), ['#123456', '#654321']);
      if (legendPosition === 'top-left') {
       const horizontalGrid = nodes(host, n => hasClass(n, 'recharts-cartesian-grid-horizontal'))[0];
       const lines = nodes(horizontalGrid, n => n.tagName === 'LINE');
       assert.ok(lines.length > 0 && lines.every(n => +n.attributes.y1 >= 48), 'plot begins below injected 36px legend');
      }
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
