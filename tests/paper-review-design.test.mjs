import test from 'node:test';
import assert from 'node:assert/strict';
import { questions, paperImage } from '../examples/paper-review/fixture.ts';

test('D1 paper, rail, rubric and total share consistent question facts', () => {
  assert.equal(questions.length, 20);
  assert.equal(questions.filter(q => q.score < q.max).length, 4);
  assert.equal(questions.reduce((sum, q) => sum + q.score, 0), 118);
  assert.equal(questions.reduce((sum, q) => sum + q.max, 0), 150);
  for (const q of questions) {
    assert.equal(q.points.reduce((sum, p) => sum + p.score, 0), q.score);
    assert.equal(q.points.reduce((sum, p) => sum + p.max, 0), q.max);
    assert.doesNotMatch(JSON.stringify(q), /示例|演示|Demo|样本/i);
  }
  const raw = decodeURIComponent(paperImage(1, '张雨桐', false));
  const marked = decodeURIComponent(paperImage(1, '张雨桐', true));
  assert.doesNotMatch(raw, /焦距关系未联立|× 6\/12/);
  assert.match(marked, /焦距关系未联立/);
  assert.match(marked, /× 6\/12/);
});

test('D1 built review route renders three panes and a single primary action without presentation labels', async () => {
  const { default: worker } = await import('../dist/server/index.js');
  const response = await worker.fetch(new Request('http://localhost/next/reviews/paper-review', { headers: { accept: 'text/html' } }), { ASSETS: { fetch: async () => new Response('Not found', { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
  assert.equal(response.status, 200);
  const html = await response.text();
  const body = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
  const text = body.replace(/<[^>]+>/g, '');
  for (const name of ['rail', 'canvas', 'inspector']) assert.match(body, new RegExp(`data-review-${name}`));
  assert.doesNotMatch(text, /示例|演示|Demo|样本/i);
  const primary = [...body.matchAll(/<button\b[^>]*class="([^"]*)"[^>]*>/g)].filter(match => /\bbg-primary\s/.test(match[1]));
  assert.equal(primary.length, 1);
  for (const label of ['试卷预览框架 · 设计稿', '张雨桐', '20 题', '最终确认', '更正评分', '教师批阅', '椭圆焦距关系', '置信度', '未提供']) assert.ok(text.includes(label), label);
  assert.match(body, /data-paper-preview/);
  assert.match(body, /data-ui-version="coss-v1"/);
});
