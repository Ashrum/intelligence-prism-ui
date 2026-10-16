import test from 'node:test';
import assert from 'node:assert/strict';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { api, h, defaults } from './p58-chart-harness.mjs';
import { clientDOM } from './helpers/chart-client-dom.mjs';

const find = (host, predicate) => {
  const found = [];
  function visit(node) { if (predicate(node)) found.push(node); node.childNodes?.forEach(visit); }
  visit(host);
  return found;
};
for (const theme of ['light', 'paper', 'dark']) test(`P70 ${theme}: mounted Recharts SVG renders solid defaults and distinct custom hollow points at 320/1280`, async () => {
  const previous = { window: globalThis.window, document: globalThis.document, observer: globalThis.ResizeObserver, act: globalThis.IS_REACT_ACT_ENVIRONMENT };
  const errors = [], originalError = console.error;
  console.error = (...args) => errors.push(args.join(' '));
  try {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    globalThis.__p58Theme = theme;
    const observers = [];
    globalThis.ResizeObserver = class { constructor(callback) { this.callback = callback; observers.push(this); } observe() {} unobserve() {} disconnect() {} };
    const dom = clientDOM(1280, 320);
    globalThis.window = dom.window; globalThis.document = dom.document;
    const host = dom.document.createElement('div'), root = createRoot(host);
    try {
      for (const width of [320, 1280]) {
        dom.resize(width, 320);
        await act(() => root.render(h(api.TrendChart, { ...defaults.TrendChart, height: 320 })));
        await act(() => { for (const observer of observers) observer.callback([{ contentRect: { width, height: 320 } }]); });
        const dots = find(host, node => node.tagName === 'CIRCLE' && node.attributes.class?.includes('recharts-line-dot'));
        assert.equal(dots.length, 2, 'zero is rendered and missing point stays absent');
        for (const dot of dots) {
          assert.equal(dot.attributes.fill, 'var(--chart-1)');
          assert.equal(dot.attributes.stroke, 'var(--card)');
          assert.equal(dot.attributes['stroke-width'], '2');
        }
        await act(() => root.render(h(api.TrendChart, { label: '实心 / 空心', height: 320, series: [{ id: 's', label: '实际', color: '#123456', data: ['circle', 'hollow-circle', 'diamond'].map((symbol, i) => ({ id: String(i), label: symbol, symbol, value: i * 20 })) }] })));
        const custom = find(host, node => node.attributes?.['data-trend-symbol']);
        assert.equal(custom.length, 3);
        for (const point of custom) {
          const shape = point.childNodes[0].attributes, hollow = point.attributes['data-trend-symbol'] === 'hollow-circle';
          assert.equal(shape.fill, hollow ? 'var(--card)' : '#123456');
          assert.equal(shape.stroke, hollow ? '#123456' : 'var(--card)');
          assert.equal(shape['stroke-width'], '2');
        }
      }
    } finally { await act(() => root.unmount()); }
    assert.deepEqual(errors, []);
  } finally {
    console.error = originalError;
    globalThis.window = previous.window; globalThis.document = previous.document;
    globalThis.ResizeObserver = previous.observer; globalThis.IS_REACT_ACT_ENVIRONMENT = previous.act;
    delete globalThis.__p58Theme;
  }
});
