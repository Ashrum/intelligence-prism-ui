import test from 'node:test';
import assert from 'node:assert/strict';
import { api, capture, defaults, optionJSON, h } from './p58-chart-harness.mjs';

const data = [
 { id: 'bounds', label: '长中文与公式 x² − 3x + 2 = 0 的完整解题过程', first: 0, second: 100, meta: '36 / 51 人', tag: h('strong', null, '继续巩固') },
 { id: 'missing-first', label: '缺第一项', first: null, second: 25 },
 { id: 'missing-second', label: '缺第二项', first: 71.234, second: null },
 { id: 'missing-both', label: '双缺测', first: null, second: null },
 { id: 'equal', label: '同值', first: 50, second: 50 },
 { id: 'invalid', label: '无效与域外', first: NaN, second: 101 },
];
const props = { ...defaults.PairedDotChart, rowLayout: 'inline', unit: '%', data };

for (const theme of ['light', 'paper', 'dark', 'blueprint']) {
 test(`P66 ${theme}: omitted/stacked layouts retain existing HTML and options in both densities`, () => {
  for (const density of ['default', 'compact']) {
   const base = { ...defaults.PairedDotChart, density };
   const original = capture('PairedDotChart', base, theme);
   const explicit = capture('PairedDotChart', { ...base, rowLayout: 'stacked', labelWidth: 200 }, theme);
   assert.equal(original.html, explicit.html);
   assert.deepEqual(original.charts.map(c => optionJSON(c.option)), explicit.charts.map(c => optionJSON(c.option)));
  }
 });

 test(`P66 ${theme}: inline common scale, missing data, colors, labels, tooltip and selection`, () => {
  const calls = [], out = capture('PairedDotChart', { ...props, onSelect: (...args) => calls.push(args), selectedId: 'bounds' }, theme);
  assert.equal(out.charts.length, data.length, 'one chart per row, no duplicate responsive branch');
  assert.match(out.html, /data-slot="tooltip-trigger"[^>]*>长中文与公式 x² − 3x \+ 2 = 0 的完整解题过程/);
  assert.match(out.html, /--paired-label-width:9em/);
  assert.match(out.html, /36 \/ 51 人/); assert.match(out.html, /继续巩固/);
  assert.equal((out.html.match(/aria-hidden="true">—<\/span>/g) || []).length, 5);
  assert.match(out.html, /text-ui-body text-foreground/);
  for (const c of out.charts) {
   assert.equal(c.height, 36);
   assert.deepEqual([c.option.xAxis.min, c.option.xAxis.max], [0, 100]);
   assert.equal(c.option.xAxis.show, false); assert.equal(c.option.yAxis.show, false);
   const [first, second, track] = c.option.series;
   assert.deepEqual(track.data, [[0, 0], [100, 0]]); assert.equal(track.silent, true);
   assert.equal(first.symbol, 'circle'); assert.equal(second.symbol, 'diamond');
   for (const [i, series] of [first, second].entries()) {
    assert.equal(series.label.show, false); assert.equal(series.emphasis.label.show, false);
    for (const point of series.data) assert.equal(point.itemStyle.color, out.theme.colors[i ? 3 : 1]);
   }
  }
  assert.deepEqual(out.charts.map(c => c.option.series.slice(0, 2).map(s => s.data.length)), [[1,1],[0,1],[1,0],[0,0],[1,1],[0,0]]);
  assert.deepEqual(out.charts.map(c => c.option.series[0].markLine.data.length), [1,0,0,0,1,0]);
  const first = out.charts[0].option.series[0].data[0];
  assert.equal(first.itemStyle.borderWidth, 2);
  assert.equal(out.charts[0].option.tooltip.formatter({ data: first, seriesName: '出错' }), `${data[0].label}\n出错：0%`);
  out.charts[2].onSelect('missing-second', 'first'); assert.deepEqual(calls, [['missing-second', 'first']]);
  assert.equal(out.charts[2].option.series[0].data[0].raw, 71.234);
  assert.match(out.html, />71%<\/span>/);
 });

 test(`P66 ${theme}: real 36px SVG keeps endpoint geometry without on-point numbers at small and wide track sizes`, () => {
  const out = capture('PairedDotChart', props, theme);
  const chart = api.init(null, undefined, { renderer: 'svg', ssr: true, width: 48, height: 36 });
  try {
   for (const width of [48, 120, 320, 420]) {
    chart.resize({ width, height: 36 });
    for (const c of out.charts) {
     chart.setOption({ animation: false, ...c.option }, true);
     const svg = chart.renderToSVGString();
     assert.doesNotMatch(svg, /NaN|Infinity|<text/);
     for (let i = 0; i < 2; i++) {
      const series = chart.getModel().getSeriesByIndex(i).getData();
      for (let j = 0; j < series.count(); j++) {
       const [x, y] = series.getItemLayout(j);
       assert.ok(x >= 8 && x <= width - 8);
       assert.equal(y, 18);
      }
     }
    }
   }
  } finally { chart.dispose(); }
 });
}

test('P66 inline composes with density, legend/help, hidden disclosure and optional metadata', () => {
 for (const density of ['default', 'compact']) for (const legendPosition of [undefined, 'top-left', 'bottom', 'none']) for (const dataDisclosure of ['visible', 'hidden']) {
  const out = capture('PairedDotChart', { ...props, density, legendPosition, dataDisclosure, metrics: props.metrics.map(m => ({ ...m, help: `${m.label}的分母口径` })), onSelect() {} });
  assert.ok(out.charts.every(c => c.height === 36));
  // P67 moves inline legends to the host title and metadata to tooltip / screen readers.
  assert.equal((out.html.match(/data-slot="popover-trigger"/g) || []).length, 0);
  assert.doesNotMatch(out.html, /data-chart-legend/);
  assert.doesNotMatch(out.html, /<th[^>]*>补充信息<\/th>/);
  assert.match(out.html, /data-paired-meta="true" class="sr-only">36 \/ 51 人/);
  if (dataDisclosure === 'hidden') {
   assert.doesNotMatch(out.html, /<details|<summary/);
   const table = out.html.slice(out.html.indexOf('<div class="sr-only" role="region"'));
   assert.doesNotMatch(table, /<button|aria-hidden="true"/);
   assert.match(table, /完整解题过程/);
  } else assert.match(out.html, /<details/);
 }
});

test('P66 width validation, explicit colors, disabled connector, precision, empty data and non-percent domains', () => {
 for (const labelWidth of [undefined, 0, -1, NaN, Infinity]) assert.match(capture('PairedDotChart', { ...props, labelWidth }).html, /--paired-label-width:9em/);
 const out = capture('PairedDotChart', { ...props, labelWidth: 180, maxTrackWidth: 420, decimals: 1, connectPairs: false, metrics: props.metrics.map(m => ({ ...m, color: '#123456' })) });
 assert.match(out.html, /--paired-label-width:180px/); assert.match(out.html, /max-width:420px/); assert.match(out.html, />71\.2%<\/span>/);
 assert.match(out.html, /fill="#123456"/);
 assert.ok(out.charts.every(c => c.option.series[0].markLine === undefined));
 assert.equal(out.charts[0].option.series[0].data[0].itemStyle.color, '#123456');
 const empty = capture('PairedDotChart', { ...props, data: [] });
 assert.equal(empty.charts.length, 0); assert.match(empty.html, /暂无对比数据/);
 const ordinary = capture('PairedDotChart', { ...props, domain: undefined, unit: '分', data: [{ id: 'x', label: '原始分值', first: 250, second: 400 }] });
 assert.ok(ordinary.charts[0].option.xAxis.max >= 400);
 const percent = capture('PairedDotChart', { ...props, domain: undefined });
 assert.deepEqual([percent.charts[0].option.xAxis.min, percent.charts[0].option.xAxis.max], [0, 100]);
});
