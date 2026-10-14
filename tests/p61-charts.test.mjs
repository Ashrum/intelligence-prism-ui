import test from 'node:test';
import assert from 'node:assert/strict';
import { api, capture, defaults, h, render, optionJSON } from './p58-chart-harness.mjs';

const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
const even = values => {
  assert.ok(values.length >= 2);
  for (let i = 2; i < values.length; i++) close(values[i] - values[i - 1], values[1] - values[0]);
};

test('P61 auto scale has nice equal steps, covers values and makes both bounds ticks', () => {
  assert.deepEqual(api.chartAutoScale([48, 83], '%'), { domain: [30, 100], interval: 10, ticks: [30, 40, 50, 60, 70, 80, 90, 100] });
  for (const unit of ['%', '％', '分', '']) for (const values of [[], [null, NaN, Infinity], [65], [0], [100], [0, 100], [-20, -10], [-5, 7], [.2, .3], [31, 78], [62.25, 88.1]]) {
    const scale = api.chartAutoScale(values, unit);
    even(scale.ticks);
    assert.deepEqual(scale.domain, [scale.ticks[0], scale.ticks.at(-1)]);
    close(scale.ticks[1] - scale.ticks[0], scale.interval);
    assert.ok(values.filter(Number.isFinite).every(v => v >= scale.domain[0] && v <= scale.domain[1]));
    if (['%', '％'].includes(unit)) {
      assert.ok(scale.ticks.every(Number.isInteger));
      if (values.filter(Number.isFinite).every(v => v >= 0 && v <= 100)) assert.ok(scale.domain[0] >= 0 && scale.domain[1] <= 100);
    }
  }
});

for (const theme of ['light', 'paper', 'dark']) test(`P61 ${theme}: real ECharts ticks remain evenly spaced at 320/800/1440`, () => {
  const data = [{ id: 'a', label: '章一', x: 48, y: 62.25 }, { id: 'b', label: '章二', x: 83, y: 88.1 }];
  const out = capture('ScatterChart', { ...defaults.ScatterChart, data, xDomain: 'auto', yDomain: 'auto', xUnit: '%', unit: '%' }, theme);
  for (const width of [320, 800, 1440]) {
    const chart = api.init(null, undefined, { renderer: 'svg', ssr: true, width, height: 340 });
    try {
      chart.setOption({ animation: false, ...out.charts[0].option });
      for (const key of ['xAxis', 'yAxis']) {
        const axis = chart.getModel().getComponent(key).axis;
        const ticks = axis.scale.getTicks().map(t => t.value);
        assert.deepEqual(ticks, api.chartAutoScale(data.map(d => key === 'xAxis' ? d.x : d.y), '%').ticks);
        even(ticks); even(ticks.map(v => axis.dataToCoord(v)));
        assert.deepEqual(axis.scale.getExtent(), [ticks[0], ticks.at(-1)]);
      }
      assert.doesNotMatch(chart.renderToSVGString(), /NaN|Infinity/);
    } finally { chart.dispose(); }
  }
  const explicit = capture('ScatterChart', { ...defaults.ScatterChart, xDomain: [31, 98], yDomain: [22, 91] }).charts[0].option;
  assert.equal(explicit.xAxis.interval, undefined); assert.deepEqual([explicit.xAxis.min, explicit.xAxis.max], [31, 98]);
});

for (const theme of ['light', 'paper', 'dark']) test(`P61 ${theme}: paired legend help is optional, named and separate from chart selection`, () => {
  const original = capture('PairedDotChart', defaults.PairedDotChart, theme);
  const absent = capture('PairedDotChart', { ...defaults.PairedDotChart, metrics: defaults.PairedDotChart.metrics.map(m => ({ ...m, help: null })) }, theme);
  assert.equal(original.html, absent.html);
  let selections = 0;
  const props = { ...defaults.PairedDotChart, onSelect: () => selections++, metrics: [{ ...defaults.PairedDotChart.metrics[0], help: h('strong', null, '原失分学生的可比再考') }, defaults.PairedDotChart.metrics[1]] };
  for (const density of ['default', 'compact']) {
    const out = capture('PairedDotChart', { ...props, density }, theme);
    assert.equal((out.html.match(/data-slot="popover-trigger"/g) || []).length, 1);
    assert.match(out.html, /aria-label="出错：指标说明"/); assert.match(out.html, /aria-haspopup="dialog"/); assert.match(out.html, /aria-expanded="false"/);
    assert.doesNotMatch(out.html, /再错：指标说明/);
    const legend = out.nodes.find(n => n.type === api.ChartLegend);
    assert.match(render(legend.props.items[0].help), /<strong>原失分学生的可比再考<\/strong>/);
    assert.equal(selections, 0);
  }
  assert.equal(optionJSON(original.charts[0].option), optionJSON(capture('PairedDotChart', props, theme).charts[0].option));
});

test('P61 auto Trend axis shares exact tick values; legacy and explicit domains stay engine-managed', () => {
  const props = { ...defaults.TrendChart, series: [{ id: 'a', label: '实际', data: [48, 83].map((value, i) => ({ id: String(i), label: String(i), value })) }] };
  const axis = out => out.nodes.find(n => n.props.tickFormatter && n.props.domain);
  const auto = axis(capture('TrendChart', { ...props, yDomain: 'auto' })).props;
  assert.deepEqual(auto.domain, [30, 100]); assert.deepEqual(auto.ticks, [30, 40, 50, 60, 70, 80, 90, 100]); assert.equal(auto.interval, 0);
  for (const yDomain of [undefined, [31, 98]]) {
    const p = axis(capture('TrendChart', { ...props, yDomain })).props;
    assert.deepEqual(p.domain, yDomain ?? [0, 100]); assert.equal(p.ticks, undefined);
  }
});

for (const theme of ['light', 'paper', 'dark']) test(`P61 ${theme}: public table/list composition discloses all four mastery labels, 0 and missing`, () => {
  const html = capture('LearningRecordProperties', {}, theme).html;
  for (const text of ['已掌握', '基本掌握', '待巩固', '数据不足', '得分率', '补回率', '保持率', '暂无间隔至少 14 日的可比再考']) assert.ok(html.includes(text), text);
  assert.match(html, /role="meter"/); assert.match(html, /aria-valuenow="0"/); assert.match(html, /0%/);
  assert.doesNotMatch(html, /状态未知|处理进度|display:none|display: none/);
  const missing = render(h(api.LearningRateCell, { value: null, label: '补回率', reason: '无可比再考' }));
  assert.match(missing, /数据不足：无可比再考/); assert.doesNotMatch(missing, /role="meter"|0%/);
});
