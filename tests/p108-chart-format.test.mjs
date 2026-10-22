import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { clientDOM } from './helpers/chart-client-dom.mjs';
import { createHarness, baseline, themes, cases, json, textOutputs, h, render, trend, scatter, paired, segments, metric, size } from './helpers/p108-harness.mjs';
const { api, capture } = await createHarness();
const frozen = JSON.parse(readFileSync(new URL('./fixtures/p108-defaults.json', import.meta.url), 'utf8'));
const digest = value => createHash('sha256').update(value).digest('hex');
const nodeName = node => node.type?.displayName ?? node.type?.name;
const structure = html => [...html.matchAll(/<\/?([a-z][\w-]*)\b[^>]*>/g)].map(([tag, name]) => [tag.startsWith('</') ? '/' + name : name, tag.match(/class="([^"]*)"/)?.[1], tag.match(/style="([^"]*)"/)?.[1]]);
const valueText = (value, ctx) => ({ text: value == null ? '—' : `原文[${ctx.dataId}/${ctx.field}/${value}]!`, ariaText: value == null ? `—，${ctx.dataId}尚无再考记录` : `读屏[${ctx.dataId}/${ctx.field}/${value}]!` });
function expected(value, ctx) { return valueText(value, ctx); }
const makeSpy = formatter => { const calls = []; return { calls, format: (value, ctx) => { calls.push([value, ctx]); return formatter(value, ctx); } }; };
const assertMarkupText = (html, value) => assert.ok(html.includes(render(value)), `Missing ${value}`);
function engineGeometry(option, width, height) {
  const chart = api.init(null, undefined, { renderer: 'svg', ssr: true, width, height });
  try {
    chart.setOption({ animation: false, ...option });
    const svg = chart.renderToSVGString();
    return [...svg.matchAll(/<(?:path|circle|rect|polyline)\b[^>]*>/g)].map(([tag]) => [...tag.matchAll(/\b(d|cx|cy|r|x|y|width|height|points|transform)="([^"]*)"/g)].map(m => [m[1], m[2]]));
  } finally { chart.dispose(); }
}

assert.equal(frozen.baseline, baseline);
for (const theme of themes) {
  for (const [id, name, props] of cases) test(`P108 ${theme}/${id}: default output exactly matches 0a2be7b`, () => {
    const out = capture(name, props, theme), old = frozen.fingerprints[`${theme}/${id}`];
    assert.equal(digest(out.html), old.html, 'exact SSR bytes');
    assert.equal(digest(json(out.charts)), old.options, 'engine configuration');
    assert.equal(digest(json(textOutputs(name, out))), old.text, 'executed tooltip, axis and label text');
  });

  test(`P108 ${theme}: Trend table/tooltip/aria preserve callback strings and raw data`, () => {
    for (const enriched of [false, true]) {
      const props = { ...trend, series: trend.series.map(s => ({ ...s, data: s.data.map(p => enriched ? p : { ...p, valueLabel: undefined, annotation: undefined }) })) };
      const spy = makeSpy(valueText), out = capture('TrendChart', { ...props, formatValue: spy.format }, theme), old = capture('TrendChart', props, theme);
      const tooltip = out.nodes.find(n => n.props.contentStyle).props, oldTooltip = old.nodes.find(n => n.props.contentStyle).props;
      for (const point of props.series[0].data) {
        const result = expected(point.value, { dataId: point.id, field: 'value' });
        assertMarkupText(out.html, result.text); assertMarkupText(out.html, result.ariaText);
        const params = { dataKey: 'actual', payload: { id: point.id } }, rendered = tooltip.formatter(point.value, '实际', params);
        assertMarkupText(Array.isArray(rendered) ? render(rendered[0]) : rendered, result.text);
        if (enriched && point.id === 'a') assert.match(render(rendered[0]), /宿主标签.*宿主注释/);
        if (point.value !== null) assert.notEqual(rendered, oldTooltip.formatter(point.value, '实际', params));
      }
      assert.deepEqual(spy.calls, props.series[0].data.map((p, index) => [p.value, { unit: '%', seriesId: 'actual', dataId: p.id, field: 'value', index }]));
      for (const name of ['LineChart', 'YAxis', 'Line']) {
        const a = out.nodes.filter(n => nodeName(n) === name), b = old.nodes.filter(n => nodeName(n) === name);
        assert.deepEqual(a.map(n => json({ ...n.props, children: undefined })), b.map(n => json({ ...n.props, children: undefined })), name);
      }
      assert.deepEqual(structure(out.html), structure(old.html));
    }
  });

  test(`P108 ${theme}: Scatter keeps separate data/threshold formatting, axes and quadrants`, () => {
    const spy = makeSpy(valueText), threshold = makeSpy((v, ctx) => ({ text: `阈值${ctx.field}=${v}`, ariaText: `分界读屏${ctx.field}=${v}` }));
    const out = capture('ScatterChart', { ...scatter, formatValue: spy.format, formatThreshold: threshold.format }, theme), old = capture('ScatterChart', scatter, theme), option = out.charts[0].option;
    for (const p of scatter.data) for (const field of ['x', 'y']) {
      const result = expected(p[field], { dataId: p.id, field }); assertMarkupText(out.html, result.text); assertMarkupText(out.html, result.ariaText);
    }
    assert.deepEqual(threshold.calls, [[65.25, { unit: '%', field: 'x' }], [70.45, { unit: '%', field: 'y' }]]);
    assert.equal(spy.calls.length, scatter.data.length * 2);
    assert.deepEqual(spy.calls[0], [70, { unit: '%', dataId: 'a', field: 'x', seriesId: 'all', index: 0 }]);
    for (const series of option.series) for (const p of series.data) {
      const text = option.tooltip.formatter({ name: p.name, data: p, value: p.value, seriesId: series.id });
      assert.equal(text, `${p.name}\n得分：${expected(p.value[0], { dataId: p.id, field: 'x' }).text}\n补回：${expected(p.value[1], { dataId: p.id, field: 'y' }).text}`);
    }
    assert.equal(json(option), json(old.charts[0].option));
    for (const axis of ['xAxis', 'yAxis']) assert.equal(option[axis].axisLabel.formatter(70.45), old.charts[0].option[axis].axisLabel.formatter(70.45));
    assert.deepEqual(structure(out.html), structure(old.html));
    for (const width of [390, 1280]) assert.deepEqual(engineGeometry(option, width, 340), engineGeometry(old.charts[0].option, width, 340));
    const valuesOnly = capture('ScatterChart', { ...scatter, formatValue: valueText }, theme);
    assert.match(valuesOnly.html, /分界：得分 65%；补回 70%/);
  });

  for (const layout of [{}, { density: 'compact' }, { rowLayout: 'inline' }]) test(`P108 ${theme}: Paired ${JSON.stringify(layout)} labels/table/tooltip/aria and missing reason`, () => {
    const props = { ...paired, ...layout }, spy = makeSpy(valueText), out = capture('PairedDotChart', { ...props, formatValue: spy.format }, theme), old = capture('PairedDotChart', props, theme);
    assert.equal(spy.calls.length, paired.data.length * 2);
    for (const row of paired.data) for (const field of ['first', 'second']) {
      const result = expected(row[field], { dataId: row.id, field }); assertMarkupText(out.html, result.text); assertMarkupText(out.html, result.ariaText);
    }
    out.charts.forEach(({ option, height }, i) => {
      for (const [index, series] of option.series.filter(s => s.type === 'scatter').entries()) for (const p of series.data) {
        const result = expected(p.raw, { dataId: p.id, field: index ? 'second' : 'first' });
        assert.equal(series.label.formatter({ data: p }), result.text);
        assert.equal(option.tooltip.formatter({ data: p, seriesName: series.name, seriesId: series.id }), `${p.rowLabel}\n${series.name}：${result.text}`);
      }
      assert.equal(json(option), json(old.charts[i].option));
      assert.equal(option.xAxis.axisLabel.formatter(57.5), old.charts[i].option.xAxis.axisLabel.formatter(57.5));
      for (const width of [390, 1280]) assert.deepEqual(engineGeometry(option, width, height), engineGeometry(old.charts[i].option, width, height));
    });
    assert.deepEqual(structure(out.html), structure(old.html));
  });

  test(`P108 ${theme}: Segment shares use original numerator/denominator everywhere`, () => {
    const calls = [], shareFormatter = (n, d, s) => { calls.push([n, d, s]); return { text: `份额[${n}/${d}]!`, ariaText: `份额原因[${s?.id ?? 'remainder'}]!` }; };
    for (const onSelect of [undefined, () => {}]) {
      const props = { ...segments, onSelect }, out = capture('SegmentedBar', { ...props, shareFormatter }, theme), old = capture('SegmentedBar', props, theme);
      for (const segment of segments.segments) {
        assertMarkupText(out.html, `份额[${segment.value}/40]!`); assertMarkupText(out.html, `份额原因[${segment.id}]!`);
        const match = calls.find(([, , s]) => s === segment); assert.deepEqual(match, [segment.value, 40, segment]);
      }
      assertMarkupText(out.html, '余量 份额原因[remainder]!');
      assert.ok(calls.some(([n, d, s]) => n === 12 && d === 40 && s === undefined));
      assert.deepEqual(structure(out.html), structure(old.html));
    }
  });

  test(`P108 ${theme}: Metric sparkline aria formatting preserves every raw coordinate`, () => {
    for (const layout of [undefined, 'grid', 'strip']) {
      const spy = makeSpy(valueText), props = { ...metric, layout }, items = metric.items.map(item => item.visual.kind === 'sparkline' ? { ...item, visual: { ...item.visual, unit: '%', formatValue: spy.format } } : item);
      const out = capture('MetricSummary', { ...props, items }, theme), old = capture('MetricSummary', props, theme);
      assert.deepEqual(spy.calls, [70, null, 57.5, 99.975].map((v, index) => [v, { unit: '%', dataId: 'rate', field: 'value', index }]));
      assertMarkupText(out.html, '走势数值：' + spy.calls.map(([v, ctx]) => valueText(v, ctx).ariaText).join('、'));
      assert.deepEqual(out.html.match(/<svg[\s\S]*?<\/svg>/g), old.html.match(/<svg[\s\S]*?<\/svg>/g));
      assert.deepEqual(structure(out.html), structure(old.html));
    }
  });

  test(`P108 ${theme}: BpSizeBar formats segments/marker, preserves row.display and widths`, () => {
    const spy = makeSpy(valueText), out = capture('BpSizeBar', { ...size, formatValue: spy.format }, theme), old = capture('BpSizeBar', size, theme);
    for (const segment of size.rows[0].segments) {
      const result = expected(segment.value, { dataId: 'r', field: 'segment' }); assertMarkupText(out.html, result.text); assertMarkupText(out.html, result.ariaText);
      assert.ok(spy.calls.some(([v, ctx]) => v === segment.value && ctx.unit === '%' && ctx.dataId === 'r' && ctx.seriesId === segment.id));
    }
    const marker = expected(size.marker.value, { dataId: 'r', field: 'marker' }); assertMarkupText(out.html, marker.text); assertMarkupText(out.html, marker.ariaText);
    assert.match(out.html, /宿主读数/); assert.deepEqual(structure(out.html), structure(old.html));
  });
}

test('P108 callback absence, text-only, empty strings and non-finite inputs are distinct', () => {
  const empty = () => ({ text: '', ariaText: '' });
  const out = capture('PairedDotChart', { ...paired, rowLayout: 'inline', formatValue: empty });
  assert.doesNotMatch(out.html.replace(/<[^>]*>/g, ''), /70%|58%|100%/);
  const calls = [], visual = { kind: 'sparkline', values: [null, NaN, Infinity, -Infinity, 0], formatValue: (v, ctx) => { calls.push([v, ctx]); return { text: v === 0 ? '零原文' : '—，宿主原因' }; } };
  const model = api.metricVisualModel(visual, 'edge');
  assert.equal(model.text, '走势数值：—，宿主原因、—，宿主原因、—，宿主原因、—，宿主原因、零原文');
  assert.deepEqual(calls.map(([v]) => v), visual.values);
  assert.deepEqual(model.runs, api.metricVisualModel({ ...visual, formatValue: undefined }).runs);
  const sizeTextOnly = capture('BpSizeBar', { ...size, formatValue: () => ({ text: '只给文字' }) });
  assert.match(sizeTextOnly.html, /<b role="img" aria-label="只给文字"/);
  const shares = [];
  capture('SegmentedBar', { label: '零分母', segments: [{ id: 'zero', label: '零', value: 0 }], total: 0, shareFormatter: (n, d) => { shares.push([n, d]); return { text: '—', ariaText: '—，分母为零' }; } });
  assert.deepEqual(shares, [[0, 0]]);
  const raw = capture('TrendChart', { ...trend, series: [...trend.series, { id: 'other', label: '另组', data: [{ id: 'new', label: '另期', value: 1 }] }], formatValue: (v, ctx) => { if (ctx.seriesId === 'actual' && ctx.dataId === 'new') assert.equal(v, undefined); return { text: '原样' }; } });
  assert.match(raw.html, /原样/);
});

test('P108 demo formatter uses decimal half-up only in demo and renders host-format examples', () => {
  for (const [input, text] of [[70, '70.0%'], [57.5, '57.5%'], [99.975, '100.0%（四舍五入）'], [1.25, '1.3%'], [-1.25, '−1.3%'], [-0.04, '0.0%'], [1e-7, '0.0%']]) assert.equal(api.demoHostValueFormatter(input, { unit: '%' }).text, text);
  assert.deepEqual(api.demoHostValueFormatter(null, { unit: '%' }), { text: '—', ariaText: '—，尚无可比再考记录' });
  assert.equal(api.demoHostShareFormatter(23, 40).text, '57.5%');
  assert.equal(api.demoHostShareFormatter(3999, 4000).text, '100.0%（四舍五入）');
  for (const kind of ['trend-chart', 'quadrant-chart', 'paired-dot-chart', 'metric-summary']) {
    const out = capture('HostChartFormatDemo', { kind });
    for (const text of ['宿主格式回调', '70.0%', '57.5%', '100.0%（四舍五入）', '尚无可比再考记录']) assertMarkupText(out.html, text);
  }
});


test('P108 mounted Recharts keeps paths/points/ticks at 390 and 1280 while formatter updates', async () => {
  const previous = { window: globalThis.window, document: globalThis.document, ResizeObserver: globalThis.ResizeObserver, IS_REACT_ACT_ENVIRONMENT: globalThis.IS_REACT_ACT_ENVIRONMENT };
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const observers = [];
  globalThis.ResizeObserver = class { constructor(callback) { this.callback = callback; observers.push(this); } observe() {} unobserve() {} disconnect() {} };
  const dom = clientDOM(1280, 320);
  globalThis.window = dom.window; globalThis.document = dom.document;
  const host = dom.document.createElement('div'), root = createRoot(host);
  const find = predicate => { const found = []; function visit(node) { if (predicate(node)) found.push(node); node.childNodes?.forEach(visit); } visit(host); return found; };
  try {
    for (const width of [390, 1280]) for (const theme of themes) {
      dom.resize(width, 320);
      const geometries = [], ticks = [];
      for (const formatValue of [undefined, valueText, () => ({ text: 'changed', ariaText: 'changed aria' })]) {
        await act(() => root.render(h(api.PrismScopeProvider, { theme }, h(api.TrendChart, { ...trend, height: 320, formatValue }))));
        await act(() => { for (const observer of observers) observer.callback([{ contentRect: { width, height: 320 } }]); });
        geometries.push(find(node => ['PATH', 'CIRCLE', 'RECT'].includes(node.tagName)).map(node => Object.fromEntries(['d', 'cx', 'cy', 'r', 'x', 'y', 'width', 'height', 'transform'].filter(key => node.attributes[key] !== undefined).map(key => [key, node.attributes[key]]))));
        ticks.push(find(node => node.tagName === 'TEXT').map(node => node.textContent));
      }
      assert.ok(geometries[0].length > 0);
      assert.deepEqual(geometries[1], geometries[0]); assert.deepEqual(geometries[2], geometries[0]);
      assert.deepEqual(ticks[1], ticks[0]); assert.deepEqual(ticks[2], ticks[0]);
      const names = find(node => node.attributes?.['aria-label'] === 'changed aria');
      assert.ok(names.length >= 3, 'updated callback reaches actual table cells');
    }
  } finally { await act(() => root.unmount()); Object.assign(globalThis, previous); }
});
