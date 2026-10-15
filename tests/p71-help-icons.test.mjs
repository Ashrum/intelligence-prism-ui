import test from 'node:test';
import assert from 'node:assert/strict';
import { capture, defaults } from './p58-chart-harness.mjs';

function helpButtons(html, labels) {
  const buttons = [...html.matchAll(/<button\b[^>]*data-slot="popover-trigger"[^>]*>[\s\S]*?<\/button>/g)].map(m => m[0]);
  assert.equal(buttons.length, labels.length);
  for (const [index, button] of buttons.entries()) {
    assert.ok(button.includes(`aria-label="${labels[index]}：指标说明"`));
    assert.match(button, /aria-haspopup="dialog"/);
    assert.match(button, /aria-expanded="false"/);
    assert.match(button, /text-muted-foreground hover:text-foreground/);
    assert.match(button, /<svg[^>]*width="14"[^>]*height="14"/);
    assert.match(button, /<svg[^>]*class="[^"]*lucide-circle-question-mark[^\"]*size-3\.5[^\"]*"[^>]*aria-hidden="true"/);
    assert.equal(button.replace(/<[^>]*>/g, ''), '', 'icon trigger has no visible question-mark text');
  }
}

for (const theme of ['light', 'paper', 'dark']) {
  test(`P71 ${theme}: MetricSummary help survives every layout and optional visual`, () => {
    for (const layout of ['grid', 'strip', 'row']) for (const density of ['default', 'compact']) {
      const items = [
        { id: 'score', label: '近期得分率', value: '72%', help: '有效作答的得分率' },
        { id: 'long', label: '长中文公式 x² + y² = 1 的统计范围', value: '0%', help: '缺测不补零', visual: { kind: 'ring', value: 0, max: 100 } },
        { id: 'absent', label: '无说明', value: '—' },
      ];
      helpButtons(capture('MetricSummary', { items, layout, density }, theme).html, items.slice(0, 2).map(i => i.label));
      helpButtons(capture('MetricSummary', { items: items.map(i => ({ ...i, help: null })), layout, density }, theme).html, []);
    }
  });

  test(`P71 ${theme}: standalone and paired legends retain named icons and omit absent help`, () => {
    const metrics = defaults.PairedDotChart.metrics.map(m => ({ ...m, help: '分母口径' }));
    helpButtons(capture('ChartLegend', { items: metrics.map(m => ({ ...m, marker: 'dot' })) }, theme).html, metrics.map(m => m.label));
    for (const rowLayout of ['stacked', 'inline']) for (const density of ['default', 'compact']) {
      const props = { ...defaults.PairedDotChart, metrics, rowLayout, density };
      helpButtons(capture('PairedDotChart', props, theme).html, rowLayout === 'inline' ? [] : metrics.map(m => m.label));
      helpButtons(capture('PairedDotChart', { ...props, legendPosition: 'none' }, theme).html, []);
    }
  });
}
