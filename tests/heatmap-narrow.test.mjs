import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { heatmapShowsCellLabels, HEATMAP_LABEL_MIN_WIDTH } from '../lib/prism-next/heatmap-labels.ts';
import { capture, heatmapProps } from './p57-chart-harness.mjs';

for (const theme of ['light', 'paper', 'dark', 'blueprint']) {
  for (const width of [320, 399, 400, undefined]) {
    test(`${theme} at ${width}: only narrow blueprint hides visible-disclosure labels`, () => {
      assert.equal(heatmapShowsCellLabels(width, 'visible', theme), theme !== 'blueprint' || width === undefined || width >= 400);
      assert.equal(heatmapShowsCellLabels(width, 'hidden', theme), true);
    });
  }
  test(`${theme}: SSR keeps unknown-width labels, table values and tap tooltip`, () => {
    for (const dataDisclosure of ['visible', 'hidden']) {
      const out = capture('HeatmapChart', { ...heatmapProps, dataDisclosure }, theme);
      const chart = out.charts[0];
      assert.equal(chart.option.series[0].label.show, true);
      assert.equal(chart.option.tooltip.triggerOn, 'mousemove|click');
      assert.equal(chart.preserveItemTooltip, true);
      assert.equal(chart.label, heatmapProps.label);
      assert.ok(out.html.includes('data-heatmap-cell-labels="shown"'));
      assert.ok(!out.html.includes('窄屏下格内数值已隐藏'));
      assert.equal(chart.option.tooltip.formatter({ data: chart.option.series[0].data[0] }), '长中文行 · 列一\n0');
      assert.equal(chart.option.tooltip.formatter({ data: chart.option.series[0].data[1] }), '长中文行 · 列二\n缺测');
      assert.ok(out.html.includes('缺测'));
    }
  });
}

test('strict 400px boundary uses fractional container width; unknown themes retain labels', () => {
  assert.equal(HEATMAP_LABEL_MIN_WIDTH, 400);
  for (const width of [0, 300, 399.5, 399.99]) assert.equal(heatmapShowsCellLabels(width, 'visible', 'blueprint'), false);
  for (const width of [400, 420, 1280]) assert.equal(heatmapShowsCellLabels(width, 'visible', 'blueprint'), true);
  for (const theme of [undefined, 'system', 'unknown']) assert.equal(heatmapShowsCellLabels(320, 'visible', theme), true);
});

test('supplemental wiring: provider theme, raw observer width, label state and conditional description', () => {
  const src = readFileSync(new URL('../components/prism-next/charts/advanced-charts.tsx', import.meta.url), 'utf8');
  assert.ok(src.includes('heatmapShowsCellLabels(width,dataDisclosure,theme)'));
  assert.ok(src.includes('setWidth(entry.contentRect.width)'));
  assert.ok(src.includes('label:{show:showCellLabels,'));
  assert.ok(src.includes('data-heatmap-cell-labels={showCellLabels?"shown":"hidden"}'));
  assert.ok(src.includes('label={heatmapDescription(label,showCellLabels)}'));
});
