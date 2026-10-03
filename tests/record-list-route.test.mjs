import test from 'node:test';
import assert from 'node:assert/strict';
import { componentGroups } from '../lib/prism-next/catalog.ts';

test('built Record List route exposes all states, themes, sizes and Agent Spec without forbidden copy', async () => {
  assert.equal(componentGroups.find(group => group.id === 'content').items.filter(item => item.id === 'record-list').length,1);
  const { default: worker } = await import('../dist/server/index.js');
  const response = await worker.fetch(new Request('http://localhost/next/components/record-list',{headers:{accept:'text/html'}}),{ASSETS:{fetch:async()=>new Response('Not found',{status:404})}},{waitUntil(){},passThroughOnException(){}});
  assert.equal(response.status,200); const html = await response.text();
  const text = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,'');
  assert.doesNotMatch(text,/示例|演示/);
  for (const label of ['Record List 记录列表','需要我处理','系统处理中','已完成','全部记录','筛选中','清除筛选','清除搜索','没有找到匹配的记录','暂无记录','加载失败','重试','正在加载记录','三主题','1366px','320px','Agent Spec','视觉呈现','外部导航驱动、无内部 Tab']) assert.ok(text.includes(label),label);
  const external = html.split('id="record-external-navigation"')[1].split('id="record-processing"')[0];
  assert.match(external, /aria-label="外部记录导航"/);
  assert.match(external, /data-record-row="linear"/);
  assert.match(external, /aria-pressed="true"/);
  assert.doesNotMatch(external, /role="(?:tablist|tab|tabpanel)"/);
  for (const theme of ['light','paper','dark']) assert.ok(html.includes(`data-prism-theme="${theme}"`));
  assert.match(html,/data-ui-version="coss-v1"/); assert.match(html,/<math/); assert.match(html,/data-record-list/);
});
