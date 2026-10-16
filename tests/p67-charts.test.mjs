import test from 'node:test';
import assert from 'node:assert/strict';
import { api, capture, defaults, h, render, optionJSON } from './p58-chart-harness.mjs';

const metrics = [{ id: 'error', label: '出错的学生占比', help: '未得满分 / 有效作答' }, { id: 'repeat', label: '再考时仍然出错', help: '再错 / 可比再考' }];
const data = [
 { id: 'a', label: '第 21 题', first: 67, second: 20, meta: h('strong', null, '30 / 45 人'), tag: h('span', null, '继续观察') },
 { id: 'b', label: '长中文公式 x² + y² = 1', first: 9.5, second: 100 },
 { id: 'c', label: '双缺测', first: null, second: null, meta: h('span', null, '尚无可比数据') },
];
const props = { ...defaults.PairedDotChart, rowLayout: 'inline', unit: '%', metrics, data };
const valueNodes = out => out.nodes.filter(n => n.props['data-paired-values']);
const visibleValues = node => render(node).replace(/<span class="sr-only">.*?<\/span>/g, '').replace(/<svg\b[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, '');

for (const theme of ['light', 'paper', 'dark', 'blueprint']) {
 test(`P67 ${theme}: inline has two aligned numeric columns without visible labels, separators, metadata or internal legend`, () => {
  for (const density of ['default', 'compact']) for (const legendPosition of [undefined, 'top-left', 'bottom', 'none']) {
   const out = capture('PairedDotChart', { ...props, density, legendPosition }, theme);
   assert.doesNotMatch(out.html, /data-chart-legend|data-slot="popover-trigger"/);
   const grid = out.nodes.find(n => n.props['data-paired-layout'] === 'inline');
   assert.match(grid.props.className, /minmax\(0,max-content\)/);
   assert.ok(out.nodes.filter(n => n.props['data-paired-row']).every(n => n.props.className.includes('grid-cols-subgrid')));
   const values = valueNodes(out);
   assert.equal(values.length, 3);
   assert.deepEqual(values.map(visibleValues), ['67%20%', '10%100%', '——']);
   for (const node of values) {
    assert.match(node.props.className, /grid-cols-2/);
    assert.match(node.props.className, /text-right tabular-nums/);
    const cells = node.props.children.filter(Boolean);
    assert.deepEqual(cells.map(n => n.props['data-paired-metric']), ['error', 'repeat']);
    assert.ok(cells.every(n => n.props.className.includes('justify-end')));
    assert.match(render(node), /class="sr-only">出错的学生占比：/);
    assert.match(render(node), /class="sr-only">再考时仍然出错：/);
   }
   const markers = out.nodes.filter(n => n.type === api.ChartMarker);
   assert.deepEqual(markers.map(n => n.props.marker), ['dot', 'diamond', 'dot', 'diamond', 'dot', 'diamond']);
   const legendItems = api.pairedDotLegendItems(metrics);
   assert.deepEqual(markers.slice(0, 2).map(n => n.props.color), legendItems.map((item, i) => api.chartLegendColor(item, i, out.theme)));
   const table = out.html.slice(out.html.indexOf('<details'));
   assert.doesNotMatch(table, /30 \/ 45 人|补充信息|尚无可比数据/);
  }
 });
}

test('P67 rich metadata stays in name tooltip and screen-reader text, including a row with no plotted points; tag follows name only', () => {
 for (const dataDisclosure of ['visible', 'hidden']) {
  const calls = [], out = capture('PairedDotChart', { ...props, dataDisclosure, onSelect: (...args) => calls.push(args) });
  const meta = out.nodes.filter(n => n.props['data-paired-meta']);
  assert.equal(meta.length, 2);
  assert.ok(meta.every(n => n.props.className === 'sr-only'));
  assert.match(render(meta[0]), /<strong>30 \/ 45 人<\/strong>/);
  const popups = out.nodes.filter(n => n.type?.name === 'TooltipPopup');
  assert.equal(popups.length, 2);
  assert.match(render(popups[0].props.children), /第 21 题.*<strong>30 \/ 45 人<\/strong>/);
  assert.match(render(popups[1].props.children), /双缺测.*尚无可比数据/);
  assert.equal((out.html.match(/tabindex="0"/g) || []).length, 2, 'only metadata-bearing names add a focus target');
  const names = out.nodes.filter(n => n.props['data-paired-name']);
  assert.equal(names.flatMap(n => n.props.children).filter(n => n?.props?.['data-paired-tag']).length, 1);
  assert.match(render(names[0]), /第 21 题[\s\S]*data-paired-tag="true"[^>]*><span>继续观察/);
  assert.ok(valueNodes(out).every(n => !render(n).includes('继续观察')));
  assert.equal(out.charts[2].option.series[0].data.length, 0);
  assert.equal(out.charts[2].option.series[1].data.length, 0);
  assert.deepEqual(calls, []);
  out.charts[0].onSelect('a', 'repeat');
  assert.deepEqual(calls, [['a', 'repeat']]);
 }
});

test('P67 inline precision and explicit marker colours preserve chart coordinates and selection geometry', () => {
 const base = capture('PairedDotChart', props);
 const out = capture('PairedDotChart', { ...props, decimals: 1, legendPosition: 'none', metrics: metrics.map(m => ({ ...m, color: '#123456' })) });
 assert.deepEqual(valueNodes(out).map(visibleValues), ['67%20%', '9.5%100%', '——']);
 assert.ok(out.nodes.filter(n => n.type === api.ChartMarker).every(n => n.props.color === '#123456'));
 assert.deepEqual(out.charts.map(c => c.option.series.slice(0, 2).map(s => s.data.map(p => p.value))), base.charts.map(c => c.option.series.slice(0, 2).map(s => s.data.map(p => p.value))));
 for (const legendPosition of [undefined, 'none', 'bottom', 'top-left']) assert.deepEqual(capture('PairedDotChart', { ...props, legendPosition }).charts.map(c => optionJSON(c.option)), base.charts.map(c => optionJSON(c.option)));
});

test('P67 both learning examples place exactly one paired legend in the host title and disable internal legend', () => {
 for (const [name, input] of [['LearningChartProperties', { kind: 'paired-dot-chart' }], ['LearningOverviewCards', {}]]) {
  const out = capture(name, input), chart = out.nodes.find(n => n.type === api.PairedDotChart);
  assert.equal(chart.props.legendPosition, 'none');
  assert.equal(chart.props.rowLayout, 'inline');
  const hostLegend = out.nodes.find(n => n.type === api.ChartLegend && n.props.items[0].id === 'error');
  assert.deepEqual(hostLegend.props.items, api.pairedDotLegendItems(chart.props.metrics));
  assert.equal(hostLegend.props.align, 'right');
  const title = out.html.indexOf('<h3 class="text-block-title">错题：出错与再错</h3>');
  const plot = out.html.indexOf('data-paired-layout="inline"', title);
  assert.ok(title >= 0 && plot > title);
  assert.equal((out.html.slice(title, plot).match(/data-chart-legend/g) || []).length, 1);
  assert.equal((out.html.slice(title).match(/data-legend-id="error"/g) || []).length, 1);
 }
});
