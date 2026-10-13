import test from 'node:test';
import assert from 'node:assert/strict';
import { components, componentGroups, searchComponents } from '../lib/prism-next/catalog.ts';

test('P57 two authorised chart entries are searchable and included once in analytics', () => {
  assert.equal(components.length, 105);
  for (const [id, query] of [['donut-chart', '环形'], ['radar-chart', '雷达']]) {
    assert.equal(componentGroups.find(group => group.id === 'analytics').items.filter(item => item.id === id).length, 1);
    assert.ok(searchComponents(query).some(result => result.item.id === id));
  }
});

test('P57 built chart and row action pages expose demos, data alternatives and Agent Specs', async () => {
  const { default: worker } = await import('../dist/server/index.js');
  for (const [id, expected] of [
    ['donut-chart', ['Donut 环形图', 'Agent Spec', 'donut-main', 'donut-boundaries', '300px 环形图', '右侧图例', '120', '总分', '六类组成', '零值项目', '查看数据']],
    ['radar-chart', ['Radar 雷达图', 'Agent Spec', 'radar-main', 'radar-fallback', '300px 雷达图', '3–8 个轴', '两维数据替代', '查看数据']],
    ['evidence-matrix', ['compact-heatmap', '300px 紧凑矩阵', '切到 5 × 3', 'compact?: boolean = false', '缺测']],
    ['record-list', ['record-actions', '行主操作样式与对齐', '操作区垂直居中', '320px 操作列表', 'actionVariant?: ghost | outline | primary = ghost', 'actionAlign?: start | center = start']],
  ]) {
    const response = await worker.fetch(new Request(`http://localhost/next/components/${id}`, { headers: { accept: 'text/html' } }), { ASSETS: { fetch: async () => new Response('Not found', { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
    assert.equal(response.status, 200);
    const html = await response.text();
    for (const label of expected) assert.ok(html.includes(label === '零值项目' ? '本卷未安排的拓展探究题' : label), `${id}: ${label}`);
    assert.doesNotMatch(html, /图形未能加载|ReferenceError/);
  }
});
