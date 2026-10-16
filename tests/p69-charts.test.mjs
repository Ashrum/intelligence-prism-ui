import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { chartSeriesColors, chartShapeColors, chartSequentialDefault, blueprintChartOverrides } from '../lib/prism-next/chart-palette.ts';
import { themePalette } from '../lib/prism-next/config.ts';
import { sequentialColor, contrastForeground } from '../lib/prism-next/chart-color.ts';
import { contrast, deltaE76, expectedSeries } from './helpers/p69-palette-metrics.mjs';
import { api, capture, defaults, render } from './p58-chart-harness.mjs';
const css = readFileSync(new URL('../app/(next)/next/theme.css', import.meta.url), 'utf8');
const block = theme => theme === 'light' ? css.split(':where([data-agent-preview][data-prism-theme]) {')[1].split('}')[0] : css.split(`:where([data-agent-preview])[data-prism-theme="${theme}"] {`)[1].split('}')[0];
const coreSix = css.split(':where([data-agent-preview]):is([data-prism-theme="light"], [data-prism-theme="paper"]) {')[1].split('}')[0];
const tokens = theme => Object.fromEntries([...(block(theme) + (['light', 'paper'].includes(theme) ? coreSix : '')).matchAll(/(--[\w-]+):([^;]+);/g)].map(m => [m[1], m[2]]));
for (const theme of ['light', 'paper', 'dark']) {
  test(`P69 ${theme}: six approved colours match Recharts bridge and clear 3:1 on actual page/card tokens`, () => {
    const colors = chartSeriesColors(theme), values = { ...tokens('light'), ...tokens(theme) };
    assert.deepEqual(colors, expectedSeries[theme]);
    assert.equal(values['--background'], themePalette[theme].background);
    assert.equal(values['--card'], themePalette[theme].surface);
    colors.forEach((color, i) => {
      assert.equal(values[`--chart-${i + 1}`], color);
      for (const surface of ['--background', '--card']) assert.ok(contrast(color, values[surface]) >= 3, `${color}/${values[surface]}`);
      for (const other of colors.slice(i + 1)) assert.ok(deltaE76(color, other) >= 20, `${color}/${other}`);
    });
    assert.match(css, /--color-chart-6:var\(--chart-6\)/);
    assert.doesNotMatch(block('light'), /--chart-6:/, 'the shared root must not add a new Blueprint chart role');
  });
  test(`P69 ${theme}: shape base/selection share series; area fill and continuous labels remain legible`, () => {
    const shapes = chartShapeColors(theme), ramp = chartSequentialDefault(theme, themePalette[theme].secondary);
    assert.equal(shapes.base, expectedSeries[theme][0]); assert.equal(shapes.selected, expectedSeries[theme][1]);
    assert.equal(shapes.fill, theme === 'dark' ? '#3C719F' : '#99C9F3');
    for (const bg of [themePalette[theme].background, themePalette[theme].surface]) assert.ok(contrast(shapes.fill, bg) >= 1.5);
    assert.deepEqual(ramp, [themePalette[theme].secondary, shapes.fill, shapes.base]);
    for (let value = 0; value <= 1000; value++) {
      const bg = sequentialColor(value, 0, 1000, ramp);
      assert.ok(contrast(bg, contrastForeground(bg)) >= 4.5);
    }
  });
  test(`P69 ${theme}: Trend six-series geometry and legend agree; caller colour and symbols survive`, () => {
    const series = Array.from({ length: 7 }, (_, i) => ({ ...defaults.TrendChart.series[0], id: String(i), label: `序列 ${i + 1}` }));
    const out = capture('TrendChart', { ...defaults.TrendChart, series }, theme);
    const lines = out.nodes.filter(n => n.props.dataKey !== undefined && n.props.strokeWidth !== undefined);
    assert.equal(lines.length, 7);
    assert.deepEqual(lines.map(n => n.props.stroke), series.map((_, i) => `var(--chart-${i % 6 + 1})`));
    assert.deepEqual(api.trendLegendItems(series).map(item => item.color), lines.map(n => n.props.stroke));
    for (const line of lines) { assert.equal(line.props.strokeWidth, 2.5); assert.equal(line.props.dot.r, 6.5); assert.equal(line.props.activeDot.r, 8); }
    const custom = capture('TrendChart', { ...defaults.TrendChart, series: [{ ...series[0], connect: false, color: '#123456', tone: 'chart-2' }] }, theme);
    const line = custom.nodes.find(n => n.props.strokeWidth === 2.5);
    assert.equal(line.props.stroke, '#123456');
    assert.match(render(line.props.dot({ cx: 50, cy: 50, payload: { id: 'zero' } })), /r="6.5"/);
  });
  test(`P69 ${theme}: ECharts uses 13px symbols, 12px paired points and 2.5px main strokes`, () => {
    const scatter = capture('ScatterChart', { ...defaults.ScatterChart, quadrants: { ...defaults.ScatterChart.quadrants, highlight: { quadrant: 'bottom-left', tone: 'info' } } }, theme);
    const option = scatter.charts[0].option;
    assert.equal(option.series[0].data[0].symbolSize, 13);
    assert.deepEqual(option.series[0].markArea.data[2][0].itemStyle, { color: expectedSeries[theme][0], opacity: theme === 'dark' ? .16 : .1 });
    const explicit = capture('ScatterChart', { ...defaults.ScatterChart, groups: [{ id: 'a', label: '组', color: '#123456' }], data: [{ ...defaults.ScatterChart.data[0], group: 'a', size: 22 }] }, theme).charts[0].option.series[0].data[0];
    assert.equal(explicit.symbolSize, 22); assert.equal(explicit.itemStyle.color, '#123456');
    const paired = capture('PairedDotChart', { ...defaults.PairedDotChart, connectPairs: true }, theme).charts[0].option;
    assert.ok(paired.series.every(s => s.symbolSize === 12)); assert.equal(paired.series[0].markLine.lineStyle.width, 2.5);
    const combo = capture('ComboChart', { label: '组合', categories: [{ id: 'a', label: 'A' }], axes: [{ id: 'y', unit: '%' }], series: [{ id: 's', label: 'S', axisId: 'y', type: 'line', data: [{ id: 'a', value: 70 }] }] }, theme).charts[0].option;
    assert.equal(combo.series[0].symbolSize, 13); assert.equal(combo.series[0].lineStyle.width, 2.5);
    const radar = capture('RadarChart', { label: '雷达', axes: ['a', 'b', 'c'].map(id => ({ id, label: id, max: 100 })), series: [{ id: 's', label: 'S', values: [60, 70, 80] }] }, theme).charts[0].option;
    assert.equal(radar.series[0].data[0].symbolSize, 13); assert.equal(radar.series[0].data[0].lineStyle.width, 2.5);
    for (const width of [320, 1280]) for (const opts of [option, paired, combo, radar]) {
      const chart = api.init(null, undefined, { renderer: 'svg', ssr: true, width, height: 320 });
      try { chart.setOption({ animation: false, ...opts }); assert.doesNotMatch(chart.renderToSVGString(), /NaN|Infinity/); } finally { chart.dispose(); }
    }
  });
}
test('P69 dark lightening is exactly 30% white per sRGB channel; contrast reference is 21:1', () => {
  assert.equal(contrast('#000000', '#FFFFFF'), 21);
  assert.deepEqual(chartSeriesColors('dark'), chartSeriesColors('light').map(hex => '#' + [1, 3, 5].map(i => Math.round(parseInt(hex.slice(i, i + 2), 16) * .7 + 255 * .3).toString(16).padStart(2, '0')).join('').toUpperCase()));
});
test('P69 preserves Blueprint palettes, ramps, shapes and tooltip/decal overrides', () => {
  assert.deepEqual(chartSeriesColors('blueprint'), ['#1D5FBF', '#16181D', '#B8266E', '#2B8050', '#A57013', '#6B7280']);
  assert.deepEqual(chartShapeColors('blueprint'), { base: '#16181D', selected: '#1D5FBF', fill: '#E4ECF8' });
  assert.deepEqual(chartSequentialDefault('blueprint', '#unused'), ['#F3F5F8', '#88AADD', '#1D5FBF']);
  for (const theme of ['blueprint']) {
    const values = tokens(theme), colors = chartSeriesColors(theme);
    colors.slice(0, 5).forEach((color, i) => assert.equal(values[`--chart-${i + 1}`], color));
    const overrides = blueprintChartOverrides(theme);
    assert.equal(overrides.tooltip.borderColor, '#1D2026');
    assert.equal(overrides.aria.decal.decals.length, 6);
  }
});
