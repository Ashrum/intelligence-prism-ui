import test from 'node:test';
import assert from 'node:assert/strict';
import { api, capture, defaults, h, render } from './p58-chart-harness.mjs';

const lines = out => out.nodes.filter(n => n.type?.displayName === 'Line' || n.type?.name === 'Line');
for (const theme of ['light', 'paper', 'dark', 'blueprint', 'blueprint-night']) {
  const blueprint = theme === 'blueprint' || theme === 'blueprint-night';
  test(`P72 ${theme}: showPoints defaults true for solid/dashed, including custom symbols`, () => {
    for (const lineStyle of ['solid', 'dashed']) for (const symbol of [undefined, 'circle', 'hollow-circle', 'diamond']) {
      const series = [{ ...defaults.TrendChart.series[0], lineStyle, data: defaults.TrendChart.series[0].data.map(p => ({ ...p, symbol })) }];
      const omitted = capture('TrendChart', { ...defaults.TrendChart, series }, theme);
      const explicit = capture('TrendChart', { ...defaults.TrendChart, series: series.map(s => ({ ...s, showPoints: true })) }, theme);
      assert.equal(explicit.html, omitted.html);
      for (const key of ['dot', 'activeDot']) {
        const a = lines(omitted)[0].props[key], b = lines(explicit)[0].props[key];
        if (symbol || blueprint) {
          const svg = render(a({ cx: 10, cy: 20, payload: { id: 'zero' } }));
          assert.equal(svg, render(b({ cx: 10, cy: 20, payload: { id: 'zero' } })));
          if (blueprint && (!symbol || symbol === 'circle')) assert.match(svg, new RegExp(`<rect[^>]*width="${key === 'dot' ? 12 : 16}"`));
        }
        else assert.equal(a.r, key === 'dot' ? 6.5 : 8);
        assert.notEqual(a, false);
      }
    }
  });

  test(`P72 ${theme}: hiding points retains geometry, null/zero, tooltip, table and line legend`, () => {
    for (const lineStyle of ['solid', 'dashed']) for (const connect of [undefined, false]) for (const connectGaps of [false, true]) {
      const series = [{ ...defaults.TrendChart.series[0], lineStyle, connect, connectGaps, showPoints: false, color: '#123456', data: defaults.TrendChart.series[0].data.map(p => ({ ...p, symbol: 'diamond', annotation: '原始说明 x² + y² = 1' })) }];
      const out = capture('TrendChart', { ...defaults.TrendChart, series, legendPosition: 'top-left' }, theme);
      const line = lines(out)[0].props;
      assert.equal(line.dot, false);
      assert.equal(line.activeDot, false);
      assert.equal(line.stroke, '#123456');
      assert.equal(line.strokeWidth, blueprint && lineStyle === 'dashed' ? 1.5 : 2.5);
      assert.equal(line.strokeOpacity, connect === false ? 0 : undefined);
      assert.equal(line.connectNulls, connect !== false && connectGaps);
      assert.equal(line.strokeDasharray, lineStyle === 'dashed' ? '5 4' : undefined);
      assert.equal(api.trendLegendItems(series, theme)[0].marker, lineStyle === 'dashed' ? 'dashed-line' : 'line');
      const chart = out.nodes.find(n => n.props.data?.[0]?.id === 'zero');
      assert.deepEqual(chart.props.data.map(row => row.a), [0, null, 80]);
      const tooltip = out.nodes.find(n => n.props.formatter && n.props.contentStyle);
      for (const [value, id, expected] of [[0, 'zero', '0%'], [80, 'b', '80%']]) {
        const [content, name] = tooltip.props.formatter(value, '实际', { dataKey: 'a', payload: { id } });
        assert.equal(name, '实际');
        assert.ok(render(content).includes(expected));
        assert.match(render(content), /原始说明/);
      }
      for (const text of ['0%', '80%', '—', '实际', '原始说明', '不画点']) assert.ok(out.html.includes(text), text);
      assert.equal(lines(capture('TrendChart', { ...defaults.TrendChart, series: [{ ...series[0], data: [series[0].data[0]] }] }, theme))[0].props.dot, false);
    }
  });
}

test('P72 demo explicitly hides only expected points; observed point selection remains available', () => {
  const calls = [], out = capture('TrendChart', { label: '学情', series: api.learningTrendSeries, onSelect: (...args) => calls.push(args) });
  assert.deepEqual(api.learningTrendSeries.map(s => s.showPoints), [undefined, false, undefined, undefined]);
  assert.equal(lines(out)[1].props.dot, false);
  assert.equal(lines(out)[1].props.activeDot, false);
  lines(out)[0].props.activeDot.onClick(null, { payload: { id: 'week-2' } });
  lines(out)[2].props.activeDot({ cx: 10, cy: 20, payload: { id: 'week-3' } }).props.onSelect();
  assert.deepEqual(calls, [['week-2', 'actual'], ['week-3', 'incomparable']]);
  assert.match(render(h(api.ChartLegend, { items: api.trendLegendItems([api.learningTrendSeries[1]]) })), /data-legend-marker="dashed-line"/);
});
