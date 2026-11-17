import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { createTestRuntime } from './helpers/test-runtime.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const runtime=await createTestRuntime('p184-question-details');
const bundle=await build({stdin:{contents:"export * from './components/prism-next/question-details'",resolveDir:root,loader:'tsx'},bundle:true,jsx:'automatic',platform:'node',format:'esm',packages:'external',loader:{'.css':'empty'},alias:{'@':root},write:false});
const file=new URL('fixture.mjs',runtime); writeFileSync(file,bundle.outputFiles[0].text);
const {QuestionArchiveSummary,QuestionDetails}=await import(file);
const h=React.createElement;
const source=readFileSync(new URL('../components/prism-next/question-details.tsx',import.meta.url),'utf8');
const props={question:{id:'Q-184',title:'题目',kind:'单选题',options:[{id:'A',content:'1'},{id:'B',content:'2'}],answer:0,explanation:'解析内容'},metadata:{knowledge:[],source:'',version:'v2',note:''},links:{},tab:'archive',onTabChange(){},onLinksChange(){},status:'可用'};
test('P184 container threshold and observer lifecycle wire real Tabs orientation (static contract)',()=>{
  assert.match(source,/entry\.contentRect\.width >= 560/);
  assert.match(source,/observer\.observe\(node\)/);
  assert.match(source,/observer\.disconnect\(\)/);
  assert.match(source,/orientation=\{vertical \? "vertical" : "horizontal"\}/);
  assert.match(source,/@min-\[400px\]\/question-details/);
  assert.match(render(h(QuestionDetails,props)),/data-orientation="horizontal"/);
});
test('P184 archive heading preserves identifier/version/status and ordered populated rows',()=>{
  const html=render(h(QuestionDetails,{...props,archive:[{label:'纠错记录',value:'无'},{label:'入库',value:'2026-11-17'}]}));
  assert.match(html,/Q-184/); assert.match(html,/v2/); assert.match(html,/可用状态：可用/);
  assert.match(html,/bg-success/); assert.match(html,/2 个选项/);
  assert.ok(html.indexOf('入库</dt>')<html.indexOf('纠错记录</dt>'));
  assert.doesNotMatch(html,/>来源<|>维护说明<|未关联|未提供/);
});
test('P184 empty rows are omitted while zero survives',()=>{
  const html=render(h(QuestionArchiveSummary,{id:'Q',status:'不可用',rows:[{label:'零',value:0},...['',null,undefined,false,'  '].map((value,i)=>({label:`空${i}`,value}))]}));
  assert.match(html,/>零<\/dt><dd[^>]*>0<\/dd>/); assert.doesNotMatch(html,/空\d/);
});
test('P184 copy uses coss button, tooltip, awaited clipboard and readable feedback',()=>{
  const html=render(h(QuestionArchiveSummary,{id:'Q',status:'可用',rows:[]}));
  assert.match(html,/<button[^>]*aria-label="复制题目编号"/);
  assert.match(html,/role="status"/);
  assert.match(source,/await navigator\.clipboard\.writeText\(id\)/);
  assert.match(source,/编号已复制/); assert.match(source,/复制失败，请手动复制编号/); assert.match(source,/<TooltipPopup>复制编号/);
});
test('P184 draft summary has placeholders and warning status without copy',()=>{
  const html=render(h(QuestionArchiveSummary,{status:'未入库',rows:[]}));
  assert.match(html,/添加后生成编号/); assert.match(html,/草稿/); assert.match(html,/未入库/); assert.match(html,/bg-warning/);
  assert.doesNotMatch(html,/复制题目编号/);
});
