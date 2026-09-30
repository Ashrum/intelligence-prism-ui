import test from 'node:test';
import assert from 'node:assert/strict';
import { componentGroups } from '../lib/prism-next/catalog.ts';

test('built Score Review route includes all fixtures, neutral copy and three themes', async () => {
  assert.equal(componentGroups.find(g=>g.id==='content').items.filter(i=>i.id==='score-review').length,1);
  const { default: worker } = await import('../dist/server/index.js');
  const response = await worker.fetch(new Request('http://localhost/next/components/score-review',{headers:{accept:'text/html'}}),{ASSETS:{fetch:async()=>new Response('Not found',{status:404})}},{waitUntil(){},passThroughOnException(){}});
  assert.equal(response.status,200); const html = await response.text();
  const text = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,'');
  assert.doesNotMatch(text,/示例|演示/);
  for (const label of ['Score Review 人工评分','低置信度 62%','调整为 7 分','0.5 分步长','保存中','保存失败','重试保存','已保存 6 分，审计记录已更新','置信度 未提供','三主题','OCR 文本','Agent Spec','视觉呈现','320px']) assert.ok(text.includes(label),label);
  for (const theme of ['light','paper','dark']) assert.ok(html.includes(`data-prism-theme="${theme}"`));
  assert.match(html,/data-ui-version="coss-v1"/); assert.match(html,/data-paper-preview/); assert.match(html,/data-score-review-panel/);
});
