import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { api, capture, defaults, h, render } from './p58-chart-harness.mjs';
import { expectedSeries } from './helpers/p69-palette-metrics.mjs';

const surfaces = { light: '#FFFFFF', paper: '#FFFEFB', dark: '#17191C' };
const css = readFileSync(new URL('../app/(next)/next/theme.css', import.meta.url), 'utf8');
const attributes = markup => Object.fromEntries([...markup.matchAll(/([\w-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
const lines = out => out.nodes.filter(n => n.type?.displayName === 'Line' || n.type?.name === 'Line');
const shapeStyle = markup => {
  const { fill, stroke, 'stroke-width': width } = attributes(markup);
  return { fill, stroke, width };
};

for (const [theme, surface] of Object.entries(surfaces)) {
  test(`P70 ${theme}: actual card token and ECharts surface agree`, () => {
    const block = theme === 'light' ? css.split(':where([data-agent-preview][data-prism-theme]) {')[1] : css.split(`:where([data-agent-preview])[data-prism-theme="${theme}"] {`)[1];
    assert.equal(block.split('}')[0].match(/--card:([^;]+);/)[1], surface);
    assert.equal(capture('TrendChart', defaults.TrendChart, theme).theme.palette.surface, surface);
  });

  test(`P70 ${theme}: default and active Trend dots explicitly override Recharts white fill/stroke`, () => {
    for (const color of [undefined, '#123456']) {
      const out = capture('TrendChart', { ...defaults.TrendChart, series: defaults.TrendChart.series.map(s => ({ ...s, color })) }, theme);
      const line = lines(out)[0];
      for (const [key, radius] of [['dot', 6.5], ['activeDot', 8]]) {
        assert.equal(line.props[key].r, radius);
        assert.equal(line.props[key].fill, color ?? 'var(--chart-1)');
        assert.equal(line.props[key].stroke, 'var(--card)');
        assert.equal(line.props[key].strokeWidth, 2);
      }
    }
  });

  test(`P70 ${theme}: custom Trend/legend solid and hollow symbols remain distinct, including active dots`, () => {
    const symbols = ['circle', 'hollow-circle', 'diamond'];
    const series = symbols.map((symbol, i) => ({ id: symbol, label: symbol, connect: false, color: expectedSeries[theme][i], data: [{ id: 'a', label: '可比 / 不可比', value: 0, symbol }] }));
    const calls = [], out = capture('TrendChart', { label: '点形', series, onSelect: (...args) => calls.push(args) }, theme);
    for (const [i, line] of lines(out).entries()) {
      const hollow = symbols[i] === 'hollow-circle', color = expectedSeries[theme][i];
      const expected = { fill: hollow ? 'var(--card)' : color, stroke: hollow ? color : 'var(--card)', width: '2' };
      for (const key of ['dot', 'activeDot']) {
        const point = line.props[key]({ cx: 12, cy: 8, payload: { id: 'a' } });
        assert.deepEqual(shapeStyle(render(point)), expected);
        point.props.onSelect();
      }
      const marker = hollow ? 'hollow-dot' : symbols[i] === 'diamond' ? 'diamond' : 'dot';
      assert.deepEqual(shapeStyle(render(h(api.ChartMarker, { marker, color }))), expected);
    }
    assert.deepEqual(calls, symbols.flatMap(symbol => [['a', symbol], ['a', symbol]]));
    for (const marker of ['dot', 'diamond', 'triangle', 'square', 'bar']) {
      const html = capture('ChartLegend', { items: [{ id: marker, label: marker, marker, tone: 'chart-1' }] }, theme).html;
      assert.deepEqual(shapeStyle(html), { fill: expectedSeries[theme][0], stroke: 'var(--card)', width: '2' });
    }
    for (const marker of ['line', 'dashed-line']) {
      assert.deepEqual(shapeStyle(render(h(api.ChartMarker, { marker, color: '#123456' }))), { fill: undefined, stroke: '#123456', width: '2.5' });
    }
  });

  test(`P70 ${theme}: Combo, Scatter/Quadrant, Paired in all layouts and Radar use 2px card outlines`, () => {
    const combo = { label: '组合', categories: [{ id: 'a', label: 'A' }], axes: [{ id: 'y', label: '率', unit: '%' }], series: ['line', 'bar'].map(type => ({ id: type, label: type, type, axisId: 'y', color: '#123456', data: [{ id: 'a', value: 70 }] })) };
    const radar = { label: '雷达', axes: ['a', 'b', 'c'].map(id => ({ id, label: id, max: 100 })), series: [{ id: 'a', label: '实际', values: [0, 70, 80] }, { id: 'b', label: '参考', tone: 'chart-4', values: [20, 40, 60] }] };
    const cases = [
      ['ComboChart', combo, ['#123456']],
      ...['ScatterChart', 'QuadrantScatterChart'].map(name => [name, { ...defaults.ScatterChart, groups: [{ id: 'g', label: '组', color: '#123456' }], data: [{ ...defaults.ScatterChart.data[0], group: 'g' }] }, ['#123456']]),
      ...[{}, { density: 'compact' }, { density: 'compact', rowLayout: 'inline' }].map(layout => ['PairedDotChart', { ...defaults.PairedDotChart, ...layout }, [expectedSeries[theme][1], expectedSeries[theme][3]]]),
      ['RadarChart', radar, [expectedSeries[theme][0], expectedSeries[theme][3]]],
    ];
    for (const [name, props, colors] of cases) for (const selectedId of [undefined, 'a']) {
      const out = capture(name, { ...props, selectedId }, theme);
      for (const { option, height } of out.charts) {
        const series = option.series.filter(s => ['line', 'scatter', 'radar'].includes(s.type) && s.id !== 'paired-track');
        const styles = name === 'RadarChart' ? series[0].data.map(d => d.itemStyle) : series.flatMap((s, i) => s.data.map(d => ({ ...s.itemStyle, ...d.itemStyle, color: d.itemStyle?.color ?? s.itemStyle?.color ?? s.color, expected: colors[i] })));
        styles.forEach((style, i) => assert.deepEqual({ color: style.color, borderColor: style.borderColor, borderWidth: style.borderWidth }, { color: style.expected ?? colors[i], borderColor: surface, borderWidth: 2 }, name));
        if (name === 'ComboChart') assert.deepEqual(option.series[1].data[0].itemStyle, { borderColor: out.theme.palette.foreground, borderWidth: selectedId ? 2 : 0 }, 'bar selection remains unchanged');
        for (const width of [320, 1280]) {
          const chart = api.init(null, undefined, { renderer: 'svg', ssr: true, width, height });
          try {
            chart.setOption({ animation: false, ...option });
            const svg = chart.renderToSVGString();
            assert.doesNotMatch(svg, /NaN|Infinity/);
            for (const color of new Set(styles.map(s => s.color))) {
              assert.ok([...svg.matchAll(/<(?:path|circle)\b[^>]*>/g)].some(([tag]) => {
                const attrs = attributes(tag);
                // ECharts scales unit symbols and compensates their local stroke width.
                const matrix = attrs.transform?.match(/matrix\(([^)]+)\)/)?.[1].split(',').map(Number);
                const scale = matrix ? Math.sqrt(Math.abs(matrix[0] * matrix[3] - matrix[1] * matrix[2])) : 1;
                return attrs.fill === color && attrs.stroke === surface && Math.abs(Number(attrs['stroke-width']) * scale - 2) < 1e-8;
              }), `${name} ${width}: SVG must contain ${color} solid symbol with ${surface} outline`);
            }
          } finally { chart.dispose(); }
        }
      }
    }
  });
}
