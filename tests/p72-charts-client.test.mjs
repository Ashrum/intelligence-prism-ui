import test from 'node:test';
import assert from 'node:assert/strict';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { api, h } from './p58-chart-harness.mjs';
import { clientDOM } from './helpers/chart-client-dom.mjs';

const find = (host, predicate) => {
  const found = [];
  function visit(node) { if (predicate(node)) found.push(node); node.childNodes?.forEach(visit); }
  visit(host);
  return found;
};
test('P72 mounted Recharts: reference line persists without dots; toggling restores defaults at 320/1280', async () => {
  const previous = { window: globalThis.window, document: globalThis.document, observer: globalThis.ResizeObserver, act: globalThis.IS_REACT_ACT_ENVIRONMENT };
  const errors = [], originalError = console.error;
  console.error = (...args) => errors.push(args.join(' '));
  try {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    const observers = [];
    globalThis.ResizeObserver = class { constructor(callback) { this.callback = callback; observers.push(this); } observe() {} unobserve() {} disconnect() {} };
    const dom = clientDOM(1280, 320);
    globalThis.window = dom.window; globalThis.document = dom.document;
    const host = dom.document.createElement('div'), root = createRoot(host);
    try {
      for (const width of [320, 1280]) for (const theme of ['light', 'paper', 'dark', 'blueprint', 'blueprint-night']) for (const showPoints of [false, undefined, true, false]) {
        globalThis.__p58Theme = theme;
        dom.resize(width, 320);
        const series = api.learningTrendSeries.map(s => s.id === 'expected' ? { ...s, showPoints } : s);
        await act(() => root.render(h(api.TrendChart, { label: '班级得分率与预期', height: 320, unit: '%', series })));
        await act(() => { for (const observer of observers) observer.callback([{ contentRect: { width, height: 320 } }]); });
        const paths = find(host, node => node.tagName === 'PATH' && node.attributes.class?.includes('recharts-line-curve') && node.attributes['stroke-dasharray'] === '5 4');
        assert.equal(paths.length, 1);
        assert.ok(paths[0].attributes.d.length > 0);
        assert.doesNotMatch(paths[0].attributes.d, /NaN|Infinity/);
        const dots = find(host, node => node.tagName === 'CIRCLE' && node.attributes.class?.includes('recharts-line-dot'));
        assert.equal(dots.length, showPoints === false ? 4 : 8, 'actual four dots remain; expected four dots obey the explicit flag');
        assert.equal(find(host, node => node.attributes?.['data-trend-symbol']).length, 2, 'isolated hollow/diamond observations remain');
        const legend = find(host, node => node.attributes?.['data-legend-id'] === 'expected')[0];
        assert.equal(find(legend, node => node.attributes?.['data-legend-marker'] === 'dashed-line').length, 1);
        const table = find(host, node => node.tagName === 'TABLE')[0];
        for (const value of ['64%', '66%', '67%', '69%']) assert.ok(table.textContent.includes(value));
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
