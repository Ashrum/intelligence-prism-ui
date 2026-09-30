import test from 'node:test';
import assert from 'node:assert/strict';

// In-process SSR route check. No browser, HTTP listener or network access.
test('built Queue Board page integrates catalog, fixtures and neutral navigation/spec copy', async () => {
  const { default: worker } = await import('../dist/server/index.js');
  const response = await worker.fetch(new Request('http://localhost/next/components/queue-board', { headers: { accept: 'text/html' } }), { ASSETS: { fetch: async () => new Response('Not found', { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
  assert.equal(response.status, 200);
  const html = await response.text();
  const text = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, '');
  assert.doesNotMatch(text, /示例|演示/);
  for (const label of ['Queue Board 队列看板', '批阅进行中', '批阅完成', '批阅受阻', '调整模板', '该队列暂无试卷', 'Agent Spec', '视觉呈现']) assert.ok(text.includes(label), label);
  assert.match(html, /data-queue-board/);
  for (const theme of ['light', 'paper', 'dark']) assert.ok(html.includes(`data-prism-theme="${theme}"`));
  assert.match(html, /data-ui-version="coss-v1"/);
});
