import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { capture, defaults, optionJSON, h, render } from './p58-chart-harness.mjs';

// Captured before P63 edits from 6ddecd2, including multi-series and grouped legends.
const baseline = JSON.parse(await readFile(new URL('./fixtures/p63-defaults-before.json', import.meta.url), 'utf8'));
const legendLabels = { ComparisonChart: '参考线标签', ComboChart: '系列与坐标轴', ScatterChart: '点形图例', QuadrantScatterChart: '点形图例', PairedDotChart: '指标图例' };
for (const entry of baseline) {
 test(`P63 ${entry.theme} ${entry.name}: omitted position preserves baseline markup and options`, () => {
  const out = capture(entry.name, entry.props, entry.theme);
  assert.equal(out.html, entry.html);
  assert.deepEqual(out.charts.map(c => optionJSON(c.option)), entry.options);
 });
 test(`P63 ${entry.theme} ${entry.name}: positions affect only legend, data and callbacks survive none`, () => {
  const outputs = Object.fromEntries(['top-left', 'bottom', 'none'].map(legendPosition => [legendPosition, capture(entry.name, { ...entry.props, legendPosition }, entry.theme)]));
  for (const out of Object.values(outputs)) {
   assert.deepEqual(out.charts.map(c => optionJSON(c.option)), entry.options);
   assert.equal(out.html.slice(out.html.indexOf('<details')), entry.html.slice(entry.html.indexOf('<details')));
  }
  if (entry.name === 'TrendChart') {
   const legend = out => out.nodes.find(n => n.props.formatter && !n.props.contentStyle && n.type?.displayName === 'Legend');
   // Recharts Legend is a function with no stable displayName in all builds; its formatter and lack of a data key identify it.
   const findLegend = out => legend(out) ?? out.nodes.find(n => n.props.formatter && !n.props.contentStyle && !n.props.dataKey);
   assert.equal(findLegend(outputs['top-left']).props.verticalAlign, 'top');
   assert.equal(findLegend(outputs['top-left']).props.align, 'left');
   assert.equal(findLegend(outputs.bottom).props.verticalAlign, undefined);
   assert.equal(findLegend(outputs.none), undefined);
   assert.match(render(findLegend(outputs['top-left']).props.formatter('系列')), /text-foreground/);
  } else {
   const marker = `aria-label="${legendLabels[entry.name]}"`;
   for (const position of ['top-left', 'bottom']) {
    const html = outputs[position].html, li = html.indexOf(marker), plot = html.indexOf(entry.name === 'ComparisonChart' ? 'role="group"' : 'role="img"');
    assert.ok(li >= 0 && plot >= 0);
    assert.equal(li < plot, position === 'top-left');
    assert.equal(html.split(marker).length - 1, 1);
    const list = html.slice(html.lastIndexOf('<ul', li), html.indexOf('</ul>', li));
    assert.doesNotMatch(list, /style="color:/);
    assert.match(list, /(?:background|border-color):/);
   }
   assert.ok(!outputs.none.html.includes(marker));
  }
  const calls = [];
  const selected = capture(entry.name, { ...entry.props, legendPosition: 'none', onSelect: (...args) => calls.push(args) }, entry.theme);
  if (selected.charts.length) { selected.charts[0].onSelect('a'); assert.deepEqual(calls, [['a']]); }
  else assert.ok(selected.html.includes('<button'), 'accessible data selection remains available');
 });
}

test('P63 single-series Trend can explicitly opt into a legend; empty groups/series do not invent entries', () => {
 const isLegend = n => n.props.formatter && !n.props.contentStyle && !n.props.dataKey;
 assert.equal(capture('TrendChart', defaults.TrendChart).nodes.filter(isLegend).length, 0);
 assert.equal(capture('TrendChart', { ...defaults.TrendChart, legendPosition: 'top-left' }).nodes.filter(isLegend).length, 1);
 assert.equal(capture('TrendChart', { ...defaults.TrendChart, series: [], legendPosition: 'bottom' }).nodes.filter(isLegend).length, 0);
 assert.doesNotMatch(capture('ScatterChart', { ...defaults.ScatterChart, legendPosition: 'top-left' }).html, /点形图例/);
 const props = baseline.find(e => e.name === 'ComparisonChart').props;
 assert.doesNotMatch(capture('ComparisonChart', { ...props, referenceLines: [], legendPosition: 'top-left' }).html, /参考线标签/);
});

test('P63 Comparison plot labels remain independent; explicit position enables reference legend and none keeps reference disclosure', () => {
 const props = { ...baseline.find(e => e.name === 'ComparisonChart').props, referenceLabelPlacement: 'plot' };
 assert.doesNotMatch(capture('ComparisonChart', props).html, /aria-label="参考线标签"/);
 for (const legendPosition of ['top-left', 'bottom', 'none']) {
  const out = capture('ComparisonChart', { ...props, legendPosition });
  assert.equal(out.html.includes('aria-label="参考线标签"'), legendPosition !== 'none');
  assert.match(out.html, /参考线数据/);
  const layer = out.nodes.find(n => n.props.lines && n.props.band);
  assert.ok(layer.props.band.labels.length > 0);
 }
});

test('P63 PairedDot help follows the legend in both densities; hidden legend removes help triggers, not numeric disclosure', () => {
 const metrics = defaults.PairedDotChart.metrics.map(m => ({ ...m, help: h('p', null, `${m.label}口径`) }));
 for (const density of ['default', 'compact']) for (const legendPosition of ['bottom', 'top-left', 'none']) {
  const out = capture('PairedDotChart', { ...defaults.PairedDotChart, metrics, density, legendPosition });
  assert.equal((out.html.match(/data-slot="popover-trigger"/g) ?? []).length, legendPosition === 'none' ? 0 : 2);
  assert.match(out.html, /<table/); assert.match(out.html, /55/); assert.match(out.html, /缺测/);
 }
});
