import test from 'node:test';
import assert from 'node:assert/strict';
import { components } from '../lib/prism-next/catalog.ts';
const workerPromise=import(new URL('../dist/server/index.js',import.meta.url));
async function fetchPage(path){const{default:worker}=await workerPromise;return worker.fetch(new Request('http://localhost'+path,{headers:{accept:'text/html'}}),{ASSETS:{fetch:async()=>new Response('Not found',{status:404})}},{waitUntil(){},passThroughOnException(){}})}
test('all 57 coss component and composition routes render their real demonstrations',async()=>{
  assert.equal(components.length,57);
  for(const c of components){const res=await fetchPage('/next/components/'+c.id);assert.equal(res.status,200,c.id);const html=await res.text();assert.match(html,/prism-demo-section/,c.id);assert.match(html,/data-ui-version="coss-v1"/,c.id);assert.doesNotMatch(html,/legacy-version-notice/,c.id)}
});
test('particle additions render in their existing categories and expose the date composition',async()=>{
  for(const [id,labels] of Object.entries({select:['分组选项','带说明的选项','多选与已选摘要','随内容确定宽度'],combobox:['可搜索多选','按主题分组搜索','选择框内展开搜索'],'date-picker':['单个日期','日期范围','快捷日期'],'input-group':['搜索与清除'],'number-field':['两个数值组成范围'],table:['筛选、选择与批量操作','模拟加载失败'],dialog:['长内容与固定操作区','提交等待、失败保留与关闭确认']})){
    const html=await(await fetchPage('/next/components/'+id)).text();
    for(const label of labels) assert.ok(html.includes(label),id+': '+label);
    assert.match(html,/prism-content/);
  }
});
test('question review renders six readable types without answer-input controls',async()=>{
  const html=await(await fetchPage('/next/components/question')).text();
  for(const id of ['Q-M-001','Q-M-002','Q-M-003','Q-M-004','Q-M-005','Q-M-006']) assert.ok(html.includes(`data-question-id="${id}"`),id);
  for(const label of ['单选题','多选题','填空题','判断题','解答题','复合题','题目选项（只读）','题目小问']) assert.ok(html.includes(label),label);
  for(const n of [1,2,3,4,5,6]) assert.ok(html.includes(`查看第${n}题答案与解析`),`第${n}题答案入口`);
  assert.doesNotMatch(html,/aria-label="第1题参考答案"/);
  assert.match(html,/<mfrac>/);
  assert.match(html,/<msqrt>/);
  assert.match(html,/<mtext>/);
  assert.match(html,/第1空，待填写/);
  assert.match(html,/M 为示意位置/);
  assert.match(html,/<table/);
  assert.match(html,/批量勾选/);
  assert.match(html,/试题篮/);
  assert.doesNotMatch(html,/role="radio"/);
  assert.doesNotMatch(html,/<textarea/);
  const tree=await(await fetchPage('/next/components/tree')).text();
  assert.match(tree,/已通过/);
});
test('new application and foundation routes use the isolated root',async()=>{
  for(const path of ['/next','/next/foundations','/next/reading','/next/agent']){const res=await fetchPage(path);assert.equal(res.status,200,path);const html=await res.text();assert.match(html,/data-ui-version="coss-v1"/);assert.doesNotMatch(html,/legacy-version-notice/)}
  const reading=await(await fetchPage('/next/reading')).text();assert.match(reading,/<math/);assert.match(reading,/<mfrac>/);assert.match(reading,/reading-material-kind/);
  const missing=await fetchPage('/next/components/does-not-exist');assert.equal(missing.status,404);
});
test('legacy review routes remain accessible and carry the deprecation notice',async()=>{
  for(const path of ['/','/components/select','/review/openui','/review/reading-review','/review/typography']){const res=await fetchPage(path);assert.equal(res.status,200,path);const html=await res.text();assert.match(html,/legacy-version-notice/);assert.match(html,/旧版设计 · 已过期/);assert.doesNotMatch(html,/data-ui-version="coss-v1"/)}
});
