import test from 'node:test';
import assert from 'node:assert/strict';
import { components } from '../lib/prism-next/catalog.ts';
const workerPromise=import(new URL('../dist/server/index.js',import.meta.url));
async function fetchPage(path){const{default:worker}=await workerPromise;return worker.fetch(new Request('http://localhost'+path,{headers:{accept:'text/html'}}),{ASSETS:{fetch:async()=>new Response('Not found',{status:404})}},{waitUntil(){},passThroughOnException(){}})}
test('all 56 coss component and composition routes render their real demonstrations',async()=>{
  assert.equal(components.length,56);
  for(const c of components){const res=await fetchPage('/next/components/'+c.id);assert.equal(res.status,200,c.id);const html=await res.text();assert.match(html,/prism-demo-section/,c.id);assert.match(html,/data-ui-version="coss-v1"/,c.id);assert.doesNotMatch(html,/legacy-version-notice/,c.id)}
});
test('particle additions render in their existing categories and expose the date composition',async()=>{
  for(const [id,labels] of Object.entries({select:['分组选项','带说明的选项','多选与已选摘要','随内容确定宽度'],combobox:['可搜索多选','按主题分组搜索','选择框内展开搜索'],'date-picker':['单个日期','日期范围','快捷日期'],'input-group':['搜索与清除'],'number-field':['两个数值组成范围'],table:['筛选、选择与批量操作','模拟加载失败'],dialog:['长内容与固定操作区','提交等待、失败保留与关闭确认']})){
    const html=await(await fetchPage('/next/components/'+id)).text();
    for(const label of labels) assert.ok(html.includes(label),id+': '+label);
    assert.match(html,/prism-content/);
  }
});
test('new application and foundation routes use the isolated root',async()=>{
  for(const path of ['/next','/next/foundations','/next/reading','/next/agent']){const res=await fetchPage(path);assert.equal(res.status,200,path);const html=await res.text();assert.match(html,/data-ui-version="coss-v1"/);assert.doesNotMatch(html,/legacy-version-notice/)}
  const reading=await(await fetchPage('/next/reading')).text();assert.match(reading,/<math/);assert.match(reading,/<mfrac>/);assert.match(reading,/reading-material-kind/);
  const missing=await fetchPage('/next/components/does-not-exist');assert.equal(missing.status,404);
});
test('legacy review routes remain accessible and carry the deprecation notice',async()=>{
  for(const path of ['/','/components/select','/review/openui','/review/reading-review','/review/typography']){const res=await fetchPage(path);assert.equal(res.status,200,path);const html=await res.text();assert.match(html,/legacy-version-notice/);assert.match(html,/旧版设计 · 已过期/);assert.doesNotMatch(html,/data-ui-version="coss-v1"/)}
});
