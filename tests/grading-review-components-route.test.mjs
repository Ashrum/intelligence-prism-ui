import test from 'node:test';
import assert from 'node:assert/strict';
import { components, componentGroups, searchComponents } from '../lib/prism-next/catalog.ts';
import { coreAgentSpecs } from '../lib/prism-next/agent-specs.ts';

test('P16 registers exactly two new review patterns in the existing content category', () => {
  assert.equal(components.length, 101);
  for (const id of ['error-cause-review', 'student-paper-report']) {
    const entries = componentGroups.find(group => group.id === 'content').items.filter(item => item.id === id);
    assert.equal(entries.length, 1); assert.equal(entries[0].kind, 'pattern');
    assert.ok(coreAgentSpecs[id]); assert.equal(searchComponents(entries[0].title)[0].item.id, id);
  }
  assert.equal(components.filter(item => item.id === 'score-review').length, 1);
  assert.ok(!components.some(item => item.id === 'score-review-extensions'));
});

for (const [path, marker, texts] of [
  ['error-cause-review', 'data-error-cause-review', ['错因分类', '选择其他时，请填写错因说明。', '保存失败', '因重新批阅失效']],
  ['student-paper-report', 'data-student-paper-report', ['全对', '部分对', '未作答', '仅统计已提供的 3 题', '定位第一道待办题', 'AI 分析']],
  ['score-review/extensions', 'data-score-review-points', ['评分点合计', '保存并看下一份', '预置修改理由', '其他', '保存中', '未作答']],
]) test(`P16 built route ${path} exposes all fixtures and three themes`, async () => {
  const { default: worker } = await import('../dist/server/index.js');
  const response = await worker.fetch(new Request(`http://localhost/next/components/${path}`, { headers: { accept: 'text/html' } }), { ASSETS: { fetch: async () => new Response('Not found', { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
  assert.equal(response.status, 200);
  const html = await response.text(); assert.ok(html.includes(marker));
  const text = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, '');
  assert.doesNotMatch(text, /示例|演示/);
  for (const label of texts) assert.ok(text.includes(label), label);
  for (const theme of ['light', 'paper', 'dark']) assert.ok(html.includes(`data-prism-theme="${theme}"`));
  assert.match(html, /data-ui-version="coss-v1"/);
  assert.ok(text.includes('Agent Spec'));
});
