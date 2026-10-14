import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { api, capture, heatmapProps, optionJSON } from './p57-chart-harness.mjs';
import { heatmapGrid } from '../lib/prism-next/heatmap-layout.ts';

const themes = ['light', 'paper', 'dark'];
const segments = [{ id: 'a', label: '单选', value: 40 }, { id: 'zero', label: '零值项目', value: 0 }, { id: 'b', label: '综合应用的长中文分类', value: 80 }];
const axes = Array.from({ length: 5 }, (_, i) => ({ id: `axis-${i}`, label: `需要保留全文的第 ${i + 1} 个维度`, max: 100 }));
const series = [{ id: 'a', label: '本次', values: [0, 20, 40, 60, 100] }, { id: 'b', label: '参考', values: [10, 25, 35, 65, 95] }];
const context = theme => capture('DonutChart', { label: '色板', segments: [] }, theme).theme;

for (const theme of themes) test(`P57 ${theme}: donut/radar use the existing six-colour palette and monochrome text`, () => {
  const colors = context(theme);
  const data = Array.from({ length: 6 }, (_, i) => ({ id: String(i), label: `第 ${i} 类`, value: i + 1 }));
  const model = api.donutModel(data, colors), option = api.donutChartOption(model, colors);
  assert.deepEqual(option.series[0].data.map(row => row.itemStyle.color), [...colors.colors]);
  assert.equal(new Set(option.series[0].data.map(row => row.itemStyle.color)).size, 6);
  assert.equal(option.series[0].label.color, colors.palette.foreground);
  assert.equal(option.series[0].emphasis.label.show, false);
  assert.equal(option.animation, false);
  const radar = api.radarChartOption(axes, series, colors);
  assert.equal(radar.radar.axisName.color, colors.palette.foreground);
  assert.equal(radar.radar.axisLine.lineStyle.color, colors.palette.border);
  assert.deepEqual(radar.series[0].data.map(row => row.lineStyle.color), [...colors.colors.slice(0, 2)]);
  assert.equal(radar.animation, false);
  for (const candidate of [option, radar]) { assert.deepEqual(candidate.xAxis, []); assert.deepEqual(candidate.yAxis, []); }
  for (const [tone, index] of [['info', 0], ['destructive', 1], ['success', 2], ['warning', 3], ['chart-5', 4], ['neutral', 5], ['chart-6', 5]]) assert.equal(api.chartToneColor(colors, 0, tone), colors.colors[index]);
});

test('P57 donut configuration preserves IDs and zero legends, formats original inputs and has no selection state', () => {
  const seen = [], color = context('light');
  const model = api.donutModel(segments, color, (value, segment) => { seen.push(segment); return `${value} 分`; });
  assert.deepEqual(seen, segments); assert.equal(seen[1], segments[1]);
  assert.equal(model.rows[1].text, '0 分');
  const option = api.donutChartOption(model, color), data = option.series[0].data;
  assert.deepEqual(data.map(item => item.id), ['a', 'b']);
  assert.deepEqual(data.map(item => item.value), [40, 80]);
  assert.equal(option.tooltip.formatter({ data: data[1] }), '综合应用的长中文分类：80 分');
  assert.equal(option.series[0].selectedMode, false); assert.equal(option.series[0].stillShowZeroSum, false);
  assert.equal(option.series[0].emphasis.scale, false); assert.equal(option.series[0].label.show, false);
  assert.deepEqual(segments.map(item => item.value), [40, 0, 80]);
});

test('P57 donut empty, all-zero, invalid and excessive categories retain accessible alternatives', () => {
  for (const data of [[], segments.map(item => ({ ...item, value: 0 })), [{ id: 'bad', label: '非法', value: -1 }, { id: 'nan', label: '非数', value: NaN }]]) {
    const out = capture('DonutChart', { label: '组成', segments: data });
    assert.equal(out.charts.length, 0); assert.match(out.html, /暂无可绘制的环形数据/); assert.match(out.html, /aria-label="组成：数据"/); assert.match(out.html, /<table/);
  }
  const tooMany = Array.from({ length: 7 }, (_, i) => ({ id: String(i), label: `项目${i}`, value: 1 }));
  const out = capture('DonutChart', { label: '分类上限', segments: tooMany });
  assert.equal(out.charts.length, 0); assert.match(out.html, /请先合并“其他”/);
  for (const item of tooMany) assert.ok(out.html.includes(item.label));
  const allowed = api.donutModel([...tooMany.slice(0, 6), { ...tooMany[6], value: 0 }], context('light'));
  assert.equal(allowed.ready, true); assert.equal(allowed.positive.length, 6);
});

test('P57 donut chart and keyboard legend emit one ID without changing props or SSR output', () => {
  const intents = [], props = { label: '组成选择', segments, centerText: '120', centerSubtext: '总分', legend: 'right', valueFormatter: value => `${value} 分`, onSelect: id => intents.push(id) };
  const out = capture('DonutChart', props);
  assert.match(out.html, /role="img" aria-label="组成选择"/);
  assert.match(out.html, /title="120"/); assert.match(out.html, /text-stat-display/); assert.match(out.html, /text-ui-hint/);
  assert.match(out.html, /@min-\[480px\]:grid-cols/); assert.match(out.html, /height:180px/);
  const legends = out.nodes.filter(node => node.props['aria-label'] === '零值项目：0 分');
  assert.equal(legends.length, 1); legends[0].props.onClick(); out.charts[0].onSelect('b');
  assert.deepEqual(intents, ['zero', 'b']);
  assert.equal(capture('DonutChart', props).html, out.html);
  assert.doesNotMatch(capture('DonutChart', { ...props, onSelect: undefined }).html, /<button/);
});

test('P57 radar maxima, original order, gaps, invalid and out-of-range series are explicit', () => {
  const copy = structuredClone({ axes, series });
  const option = api.radarChartOption(axes, series, context('light'));
  assert.deepEqual(option.radar.indicator.map(axis => axis.max), [100, 100, 100, 100, 100]);
  assert.deepEqual(option.series[0].data.map(row => row.value), series.map(row => row.values));
  assert.deepEqual(option.series[0].data.map(row => row.symbol), ['circle', 'diamond']);
  assert.deepEqual(option.series[0].data.map(row => row.lineStyle.type), ['solid', 'dashed']);
  assert.deepEqual({ axes, series }, copy);
  const auto = api.radarModel(axes.map(({ max, ...axis }) => axis), series);
  assert.deepEqual(auto.maxima, [10, 25, 40, 65, 100]);
  assert.deepEqual(api.radarModel(axes.map(({ max, ...axis }) => axis), [{ ...series[0], values: [0, 0, 0, 0, 0] }]).maxima, [1, 1, 1, 1, 1]);
  for (const values of [[1, 2], [1, 2, 3, 4, 101], [1, 2, NaN, 4, 5], [1, -1, 3, 4, 5], [1, 2, Infinity, 4, 5]]) {
    const model = api.radarModel(axes, [{ ...series[0], values }, series[1]]);
    assert.equal(model.ready, true); assert.equal(model.invalid, 1); assert.deepEqual(model.valid, [series[1]]);
  }
  const radarData = option.series[0].data[0];
  assert.match(option.tooltip.formatter({ data: radarData }), /本次\n需要保留全文的第 1 个维度：0 \/ 100/);
});

test('P57 radar fewer than three axes, excess series, empty and invalid bounds use the visible data table', () => {
  for (const count of [0, 1, 2, 9]) {
    const input = Array.from({ length: count }, (_, i) => ({ id: String(i), label: `维度${i}` }));
    const out = capture('RadarChart', { label: '不绘制', axes: input, series: [{ id: 'a', label: '当前', values: input.map(() => 10) }] });
    assert.equal(out.charts.length, 0); assert.match(out.html, /雷达图需要 3–8 个轴/);
    assert.doesNotMatch(out.html, /<details/); assert.match(out.html, /aria-label="不绘制：数据"/); assert.match(out.html, /<table/);
  }
  for (const data of [[], [...series, { id: 'extra', label: '第三组', values: [0, 0, 0, 0, 0] }]]) assert.equal(capture('RadarChart', { label: '边界', axes, series: data }).charts.length, 0);
  for (const max of [0, -1, NaN, Infinity]) {
    const out = capture('RadarChart', { label: '轴上限', axes: [{ ...axes[0], max }, ...axes.slice(1)], series });
    assert.equal(out.charts.length, 0); assert.match(out.html, /轴上限必须是正的有限数值/);
  }
  const out = capture('RadarChart', { label: '有效雷达', axes, series });
  assert.match(out.html, /role="img" aria-label="有效雷达"/); assert.match(out.html, /查看数据/); assert.ok(out.html.includes(axes[0].label));
  assert.equal(capture('RadarChart', { label: '全零', axes, series: [{ ...series[0], values: axes.map(() => 0) }] }).charts.length, 1);
});

const before = JSON.parse(await readFile(new URL('./fixtures/p57-heatmap-before.json', import.meta.url), 'utf8'));
for (const snapshot of before) test(`P57 ${snapshot.theme}: default heatmap preserves pre-change output except P59 disclosure placement`, () => {
  for (const props of [heatmapProps, { ...heatmapProps, compact: false }]) {
    const out = capture('HeatmapChart', props, snapshot.theme);
    const start=snapshot.html.indexOf('<p class="text-ui-hint'),end=snapshot.html.indexOf('<details>');
    const notes=snapshot.html.slice(start,end),expected=(snapshot.html.slice(0,start)+snapshot.html.slice(end)).replace('</summary>','</summary>'+notes);
    assert.equal(out.html, expected); assert.equal(optionJSON(out.charts[0].option), snapshot.option);
  }
});

test('P57 compact heatmap preserves cell values, selected fact, tooltip and selection intent', () => {
  const ids = [], out = capture('HeatmapChart', { ...heatmapProps, compact: true, selectedId: 'zero', onSelect: id => ids.push(id) });
  const option = out.charts[0].option;
  assert.deepEqual(option.grid, heatmapGrid(true));
  assert.equal(option.series[0].data[0].value[2], 0); assert.ok(option.series[0].data[1].value[2] < 0);
  assert.equal(option.series[0].data[0].itemStyle.borderWidth, 2);
  assert.equal(option.series[0].label.formatter({ data: option.series[0].data[0] }), '0');
  assert.equal(option.series[0].label.formatter({ data: option.series[0].data[1] }), '缺测');
  assert.equal(option.tooltip.formatter({ data: option.series[0].data[1] }), '长中文行 · 列二\n缺测');
  out.charts[0].onSelect('zero'); assert.deepEqual(ids, ['zero']);
  assert.equal(capture('HeatmapChart', { ...heatmapProps, compact: true, cells: [] }).charts.length, 0);
});

const apart = (a, b) => a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y;
function labelBoxes(chart) {
  const boxes = [];
  chart.getZr().storage.traverse(el => {
    if (el.__fullText) { const box = el.getBoundingRect().clone(); box.applyTransform(el.getComputedTransform()); boxes.push({ box, text: el.__fullText }); }
  });
  return boxes;
}

test('P57 actual SVG engine renders 300×180 donut sectors with an empty centre and no exterior labels', () => {
  const chart = api.init(null, undefined, { renderer: 'svg', ssr: true, width: 300, height: 180 });
  try {
    const color = context('paper'), model = api.donutModel(segments, color);
    chart.setOption(api.donutChartOption(model, color));
    const data = chart.getModel().getSeriesByIndex(0).getData();
    assert.equal(data.count(), 2);
    for (let i = 0; i < data.count(); i++) { const shape = data.getItemLayout(i); assert.equal(shape.cx, 150); assert.equal(shape.cy, 90); assert.ok(shape.r < 90); assert.ok(shape.r0 > 55); }
    const svg = chart.renderToSVGString(); assert.match(svg, /<svg[^>]*width="300"[^>]*height="180"/); assert.doesNotMatch(svg, /<text/);
  } finally { chart.dispose(); }
});

test('P57 actual SVG radar labels fit 300px for 3–8 axes, preserve hover text and respond to resizing', () => {
  for (const count of [3, 4, 5, 6, 7, 8]) {
    const input = Array.from({ length: count }, (_, i) => ({ id: String(i), label: `长中文轴名用于说明完整的数学能力与公式 x²+y²=${i}`, max: 100 }));
    const option = api.radarChartOption(input, [{ id: 'current', label: '当前', values: input.map(() => 50) }], context('dark'));
    const chart = api.init(null, undefined, { renderer: 'svg', ssr: true, width: 300, height: 280 });
    try {
      chart.setOption(option);
      const boxes = labelBoxes(chart); assert.equal(boxes.length, count);
      boxes.forEach(({ box, text }, i) => {
        assert.equal(text, input[i].label); assert.ok(box.width <= 64);
        assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.width <= 300 && box.y + box.height <= 280);
        for (const other of boxes.slice(i + 1)) assert.ok(apart(box, other.box));
        assert.equal(option.radar.indicator[i].tooltip.formatter(), text);
      });
      const radius = chart.getModel().getComponent('radar').coordinateSystem.r;
      chart.resize({ width: 640, height: 280 }); assert.ok(chart.getModel().getComponent('radar').coordinateSystem.r > radius);
      chart.resize({ width: 300, height: 280 }); assert.equal(chart.getModel().getComponent('radar').coordinateSystem.r, radius);
      assert.match(chart.renderToSVGString(), /<svg/);
    } finally { chart.dispose(); }
  }
});

test('P57 actual compact heatmap places 3×3 and 5×3 values within 300px cells', () => {
  for (const count of [3, 5]) {
    const rows = Array.from({ length: count }, (_, i) => ({ id: `r${i}`, label: `维度${i}` }));
    const columns = Array.from({ length: 3 }, (_, i) => ({ id: `c${i}`, label: `层级${i}` }));
    const cells = rows.flatMap((row, r) => columns.map((column, c) => ({ id: `${r}-${c}`, row: row.id, column: column.id, value: r * 10 + c })));
    const { option } = capture('HeatmapChart', { label: '紧凑', rows, columns, cells, compact: true }).charts[0];
    const chart = api.init(null, undefined, { renderer: 'svg', ssr: true, width: 300, height: 240 });
    try {
      chart.setOption({ animation: false, ...option });
      const data = chart.getModel().getSeriesByIndex(0).getData(); assert.equal(data.count(), count * 3);
      for (let i = 0; i < data.count(); i++) {
        const el = data.getItemGraphicEl(i), rect = el.getBoundingRect(), label = el.getTextContent().getBoundingRect();
        assert.ok(rect.x >= 0 && rect.x + rect.width <= 300); assert.ok(rect.y >= 0 && rect.y + rect.height <= 240);
        assert.ok(label.width <= rect.width && label.height <= rect.height);
      }
    } finally { chart.dispose(); }
  }
});
