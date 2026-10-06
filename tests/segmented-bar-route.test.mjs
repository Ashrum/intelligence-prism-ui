import test from 'node:test';
import assert from 'node:assert/strict';

test('SegmentedBar built route resolves catalog navigation, fixtures and Agent Spec', async () => {
  const { default: worker } = await import('../dist/server/index.js');
  const response = await worker.fetch(new Request('http://localhost/next/components/segmented-bar', { headers: { accept: 'text/html' } }), { ASSETS: { fetch: async () => new Response('Not found', { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
  assert.equal(response.status, 200);
  const html = await response.text();
  for (const text of ['Segmented Bar 分段条', 'data-segmented-bar', 'Agent Spec', '无图例与紧凑轨道', '总量中的余量', '可选择', 'ComparisonChart', '/next/components/segmented-bar']) assert.ok(html.includes(text), text);
  for (const theme of ['light', 'paper', 'dark']) assert.ok(html.includes(`data-prism-theme="${theme}"`));
});
