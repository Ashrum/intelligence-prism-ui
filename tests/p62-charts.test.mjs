import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { api, capture, defaults, optionJSON, h } from './p58-chart-harness.mjs';

// Captured from clean P61 2abc127 before P62 implementation; never regenerated to fit changes.
const baseline = JSON.parse(await readFile(new URL('./fixtures/p62-defaults-before.json', import.meta.url), 'utf8'));
// Apply only the BPv6-authorized heatmap marker and tooltip trigger to frozen expectations.
function expectedAfterBPv6(entry) {
  if (entry.name !== 'HeatmapChart') return entry;
  return {
    ...entry,
    html: entry.html.replace('<div class="space-y-3">', '<div class="space-y-3" data-heatmap-cell-labels="shown">'),
    options: entry.options.map(raw => {
      const option = JSON.parse(raw);
      option.tooltip = { triggerOn: 'mousemove|click', ...option.tooltip };
      return JSON.stringify(option);
    }),
  };
}
for (const entry of baseline.map(expectedAfterBPv6)) test(`P62 ${entry.theme} ${entry.name}: omitted props preserve P61 SSR and chart options`, () => {
  const out = capture(entry.name, entry.props, entry.theme);
  assert.equal(out.html, entry.html);
  assert.deepEqual(out.charts.map(c => optionJSON(c.option)), entry.options);
});

for (const entry of baseline.map(expectedAfterBPv6).filter(e => e.name !== 'MetricSummary')) test(`P62 ${entry.theme} ${entry.name}: hidden table is accessible outside details with no invisible selection controls`, () => {
  const out = capture(entry.name, { ...entry.props, dataDisclosure: 'hidden', onSelect() {} }, entry.theme);
  assert.doesNotMatch(out.html, /<details|<summary|查看数据|display:\s*none/);
  const hidden = out.html.slice(out.html.indexOf('<div class="sr-only" role="region"'));
  assert.match(hidden, /<table/); assert.match(hidden, /<th/); assert.match(hidden, /<td/);
  assert.doesNotMatch(hidden, /<button|aria-hidden="true"|hidden=""/);
  assert.deepEqual(out.charts.map(c => optionJSON(c.option)), capture(entry.name, entry.props, entry.theme).charts.map(c => optionJSON(c.option)));
  assert.equal(capture(entry.name, { ...entry.props, dataDisclosure: 'visible' }, entry.theme).html, entry.html);
});

test('P62 disclosure compatibility: explicit Trend hidden wins over showData=false; Comparison legacy aliases agree', () => {
  assert.doesNotMatch(capture('TrendChart', { ...defaults.TrendChart, showData: false }).html, /<table|<details/);
  assert.match(capture('TrendChart', { ...defaults.TrendChart, showData: false, dataDisclosure: 'hidden' }).html, /<table/);
  const props = baseline.find(e => e.name === 'ComparisonChart').props;
  for (const [old, next] of [['none', 'hidden'], ['details', 'visible']]) assert.equal(capture('ComparisonChart', { ...props, dataDisclosure: old }).html, capture('ComparisonChart', { ...props, dataDisclosure: next }).html);
  const radar = capture('RadarChart', { label: '无效雷达', axes: [{ id: 'a', label: '唯一维度' }], series: [], dataDisclosure: 'hidden' }).html;
  assert.match(radar, /暂无有效雷达数据/); assert.match(radar, /class="sr-only" role="region"/); assert.match(radar, /唯一维度/);
  const segmented = { label: '进展', segments: [{ id: 'a', label: '原始无效值', value: -2 }, { id: 'b', label: '零值', value: 0 }] };
  assert.doesNotMatch(capture('SegmentedBar', segmented).html, /<details|<table/);
  assert.match(capture('SegmentedBar', { ...segmented, dataDisclosure: 'hidden' }).html, /<td[^>]*>-2<\/td>/);
});

for (const theme of ['light', 'paper', 'dark']) test(`P62 ${theme}: compact paired rows use a common 0–100 track without axes, with real SVG at 320/800/1440`, () => {
  const data = [
    { id: 'bounds', label: '边界 x² + y² = 1', first: 0, second: 100, tag: h('strong', null, '继续观察') },
    { id: 'missing', label: '单边缺测', first: null, second: 40 },
    { id: 'equal', label: '同值', first: 50, second: 50 },
    { id: 'invalid', label: '无效与域外', first: NaN, second: 101 },
  ];
  const calls = [], out = capture('PairedDotChart', { label: '错题', metrics: defaults.PairedDotChart.metrics, unit: '%', density: 'compact', data, onSelect: (...args) => calls.push(args) }, theme);
  assert.match(out.html, /<strong>继续观察<\/strong>/);
  assert.ok(out.charts.every(c => c.height === 48));
  for (const c of out.charts) {
    const option = c.option;
    assert.deepEqual([option.xAxis.min, option.xAxis.max], [0, 100]);
    assert.equal(option.xAxis.show, false); assert.equal(option.yAxis.show, false);
    assert.ok(option.series.slice(0, 2).every(s => s.label.position === 'top'));
    assert.deepEqual(option.series[2].data, [[0, 0], [100, 0]]); assert.equal(option.series[2].silent, true);
    for (const width of [320, 800, 1440]) {
      const chart = api.init(null, undefined, { renderer: 'svg', ssr: true, width, height: c.height });
      try {
        chart.setOption({ animation: false, ...option });
        const svg = chart.renderToSVGString(); assert.doesNotMatch(svg, /NaN|Infinity/);
        if (c.label.includes('边界')) { assert.match(svg, />0%<\/text>/); assert.match(svg, />100%<\/text>/); assert.doesNotMatch(svg, />50%<\/text>/); }
        assert.equal(chart.getModel().getSeriesByIndex(2).getData().count(), 2);
        const point = chart.getModel().getSeriesByIndex(1).getData().getItemLayout(0);
        if (point) assert.ok(point[1] > 0 && point[1] < 48);
      } finally { chart.dispose(); }
    }
  }
  assert.deepEqual(out.charts[1].option.series[0].markLine.data, []);
  assert.equal(out.charts[1].option.series[0].data.length, 0);
  out.charts[1].onSelect('missing', 'second'); assert.deepEqual(calls, [['missing', 'second']]);
  const disabled = capture('PairedDotChart', { ...defaults.PairedDotChart, density: 'compact', connectPairs: false });
  assert.equal(disabled.charts[0].option.series[0].markLine, undefined);
});

for (const theme of ['light', 'paper', 'dark']) test(`P62 ${theme}: quadrant label whitelist survives resize and excludes emphasis without removing points`, () => {
  const data = [{ id: 'a', label: '保留标签', x: 60, y: 40 }, { id: 'b', label: '只在提示框', x: 80, y: 70 }, { id: 'c', label: '重叠标签', x: 60, y: 40 }];
  const props = { ...defaults.ScatterChart, data, labelIds: ['a', 'c'], dataDisclosure: 'hidden' };
  const out = capture('ScatterChart', props, theme), option = out.charts[0].option;
  assert.equal(option.series[0].data.length, 3);
  assert.equal(option.series[0].data[1].label.show, false); assert.equal(option.series[0].data[1].emphasis.label.show, false);
  assert.match(option.tooltip.formatter({ name: data[1].label, value: [80, 70] }), /只在提示框/); assert.match(out.html, /只在提示框/);
  const chart = api.init(null, undefined, { renderer: 'svg', ssr: true, width: 800, height: 340 });
  try {
    chart.setOption({ animation: false, ...option });
    for (const width of [800, 320, 1440, 800]) {
      chart.resize({ width, height: 340 });
      const svg = chart.renderToSVGString(); assert.doesNotMatch(svg, />只在提示框<\/text>/);
      if (width === 320) assert.doesNotMatch(svg, />保留标签<\/text>/);
      else assert.match(svg, />保留标签<\/text>/);
      // Coincident selected labels must not both be displayed.
      assert.ok((svg.match(/>(?:保留标签|重叠标签)<\/text>/g) || []).length <= 1);
    }
  } finally { chart.dispose(); }
  for (const extra of [{ labelIds: [] }, { labelMode: 'none' }]) {
    const series = capture('ScatterChart', { ...props, ...extra }).charts[0].option.series;
    assert.ok(series[0].data.every(p => !p.label.show && !p.emphasis.label.show));
  }
});

test('P62 Metric grid has two divided columns, semantic numbers/units, exact visual boxes and no line for a single observation', () => {
  const out = capture('MetricSummary', { layout: 'grid', items: api.overviewMetrics });
  assert.match(out.html, /data-metric-layout="grid" class="@container grid min-w-0 grid-cols-2"/);
  assert.equal((out.html.match(/border-l border-border/g) || []).length, 2); assert.equal((out.html.match(/border-t border-border/g) || []).length, 2);
  assert.equal((out.html.match(/data-slot="popover-trigger"/g) || []).length, 4);
  assert.match(out.html, /text-stat-display tabular-nums/); assert.match(out.html, /text-ui-body">人 · 2 个知识点/);
  assert.match(out.html, /class="size-14 shrink-0"/); assert.match(out.html, /class="h-10 w-18 shrink-0"/);
  for (const values of [[], [null], [null, 0, null], [NaN, 5]]) {
    const html = capture('MetricSummary', { layout: 'grid', items: [{ id: 'a', label: '单点', value: '外部值', visual: { kind: 'sparkline', values } }] }).html;
    assert.doesNotMatch(html, /<polyline|NaN|Infinity/);
    assert.equal((html.match(/<circle/g) || []).length, values.filter(Number.isFinite).length);
  }
  assert.equal(capture('MetricSummary', { ...defaults.MetricSummary, layout: 'row' }).html, capture('MetricSummary', { ...defaults.MetricSummary, layout: 'strip' }).html);
});

test('P62 short annotation remains exact in disclosure and tooltip, and overview contains the approved canvas facts', () => {
  const out = capture('TrendChart', { label: '趋势', series: api.learningTrendSeries, dataDisclosure: 'hidden' });
  assert.match(out.html, /高于预期 2/);
  const tooltip = out.nodes.find(n => n.props.formatter && n.props.contentStyle).props.formatter;
  const tip = tooltip(68, '实际得分率', { dataKey: 'actual', payload: { id: 'week-4' } });
  // The actual second comparable detection is week-4 in the established opaque IDs.
  assert.ok(JSON.stringify(tip).includes('高于预期 2'));
  const html = capture('LearningOverviewCards', {}).html;
  for (const text of ['近期得分率', '补回率', '保持率', '需要优先处理', '班级得分率与预期', '课程与知识点聚焦', '学生学习进展', '错题：出错与再错', '批阅数据积累', '第 21 题 矩形面积最大值', '1,128 / 1,248 次']) assert.ok(html.includes(text), text);
  assert.doesNotMatch(html, /<details|<summary/);
});
