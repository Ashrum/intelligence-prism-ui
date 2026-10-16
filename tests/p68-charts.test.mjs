import test from 'node:test';
import assert from 'node:assert/strict';
import { api, capture, defaults } from './p58-chart-harness.mjs';

// Independent expected grids exercise each requested span and every candidate step.
const cases = [
  { values: [60, 65], ticks: [55, 60, 65, 70], step: 5 },
  { values: [64, 72], ticks: [60, 65, 70, 75], step: 5 },
  { values: [55, 75], ticks: [50, 60, 70, 80], step: 10 },
  { values: [30, 70], ticks: [20, 40, 60, 80], step: 20 },
  { values: [15, 85], ticks: [0, 25, 50, 75, 100], step: 25 },
];

test('P68 preserves the percentage boundary and gives empty/constant data 3–5 ticks', () => {
  for (const values of [[], [null, NaN, Infinity], [0, 100]]) {
    assert.deepEqual(api.chartAutoScale(values, '%'), { domain: [0, 100], interval: 25, ticks: [0, 25, 50, 75, 100] });
  }
  for (const [values, ticks] of [[[0], [0, 5, 10]], [[100], [90, 95, 100]], [[65, 65], [60, 65, 70]], [[20, 90], [0, 25, 50, 75, 100]]]) {
    assert.deepEqual(api.chartAutoScale(values, '%').ticks, ticks);
  }
});

test('P68 all integer percentage extents retain data, equal steps, 3–5 ticks and maximal boundary-limited padding', () => {
  for (let min = 0; min <= 100; min++) for (let max = min; max <= 100; max++) {
    const { domain: [lower, upper], interval, ticks } = api.chartAutoScale([min, max], '%');
    assert.ok(ticks.length >= 3 && ticks.length <= 5, `${min}–${max}`);
    assert.ok([5, 10, 20, 25].includes(interval));
    assert.ok(lower >= 0 && upper <= 100 && lower <= min && upper >= max);
    assert.ok(lower === 0 || min - lower >= interval / 2);
    assert.ok(upper === 100 || upper - max >= interval / 2);
    assert.ok(ticks.every((tick, i) => tick === lower + i * interval));
    assert.equal(ticks.at(-1), upper);
    // Any smaller candidate cannot cover the required padded extent with four intervals.
    for (const smaller of [5, 10, 20, 25].filter(value => value < interval)) {
      const needed = Math.min(100, Math.ceil((max + smaller / 2) / smaller) * smaller)
        - Math.max(0, Math.floor((min - smaller / 2) / smaller) * smaller);
      assert.ok(needed > 4 * smaller);
    }
  }
});

test('P68 preserves non-percentage scaling and untruncated out-of-range facts', () => {
  assert.deepEqual(api.chartAutoScale([48, 83], '分'), { domain: [30, 100], interval: 10, ticks: [30, 40, 50, 60, 70, 80, 90, 100] });
  assert.deepEqual(api.chartAutoScale([null, Infinity], ''), { domain: [0, 1], interval: .2, ticks: [0, .2, .4, .6, .8, 1] });
  const scale = api.chartAutoScale([-100, 200], '%');
  assert.deepEqual(scale, { domain: [-200, 300], interval: 100, ticks: [-200, -100, 0, 100, 200, 300] });
  assert.deepEqual(api.trendAutoScale([-100, 200], '%'), scale);
});

for (const unit of ['%', '％']) for (const { values, ticks, step } of cases) {
  test(`P68 ${unit}: span ${values[1] - values[0]} uses the smallest fitting step and half-step margins`, () => {
    const expected = { domain: [ticks[0], ticks.at(-1)], interval: step, ticks };
    for (const scale of [api.chartAutoScale, api.trendAutoScale]) {
      const actual = scale([...values, null, NaN, Infinity, -Infinity], unit);
      assert.deepEqual(actual, expected);
      assert.ok(actual.ticks.length >= 3 && actual.ticks.length <= 5);
      assert.ok(values[0] - actual.domain[0] >= step / 2);
      assert.ok(actual.domain[1] - values[1] >= step / 2);
      assert.ok(actual.ticks.every(Number.isInteger));
    }
    assert.deepEqual(api.trendAutoDomain(values, unit), expected.domain);
  });
}

for (const theme of ['light', 'paper', 'dark']) test(`P68 ${theme}: Trend and Quadrant use the same bounded grid without rounding data`, () => {
  for (const { values, ticks, step } of cases) {
    const trend = capture('TrendChart', {
      ...defaults.TrendChart, yDomain: 'auto',
      series: [{ id: 'actual', label: '实际', data: values.map((value, i) => ({ id: String(i), label: `第 ${i + 1} 次`, value })) }],
    }, theme);
    const axis = trend.nodes.find(node => node.props.ticks).props;
    assert.deepEqual(axis.ticks, ticks);
    assert.deepEqual(axis.domain, [ticks[0], ticks.at(-1)]);
    assert.equal(axis.interval, 0);
    const data = values.map((value, i) => ({ id: String(i), label: `章 ${i + 1}`, x: value, y: value }));
    const scatter = capture('QuadrantScatterChart', { ...defaults.ScatterChart, data, xUnit: '%', unit: '%', xDomain: 'auto', yDomain: 'auto' }, theme);
    const option = scatter.charts[0].option;
    for (const key of ['xAxis', 'yAxis']) {
      assert.deepEqual([option[key].min, option[key].max], [ticks[0], ticks.at(-1)]);
      assert.equal(option[key].interval, step);
    }
    assert.deepEqual(option.series[0].data.map(point => point.value), values.map(value => [value, value]));
    for (const width of [320, 1280, 1440]) {
      const chart = api.init(null, undefined, { renderer: 'svg', ssr: true, width, height: 340 });
      try {
        chart.setOption({ animation: false, ...option });
        for (const key of ['xAxis', 'yAxis']) assert.deepEqual(chart.getModel().getComponent(key).axis.scale.getTicks().map(tick => tick.value), ticks);
        assert.doesNotMatch(chart.renderToSVGString(), /NaN|Infinity/);
      } finally { chart.dispose(); }
    }
  }
});
