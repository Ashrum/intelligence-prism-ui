import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,writeFile,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import React from 'react';
import {renderToStaticMarkup as render} from 'react-dom/server';
import {matrixExtent,validBox} from '../lib/prism-next/chart-data.ts';
const root=fileURLToPath(new URL('../',import.meta.url));
const file=new URL('../.sites-runtime/reuse-test.mjs',import.meta.url);
await mkdir(new URL('../.sites-runtime/',import.meta.url),{recursive:true});
const bundle=await build({stdin:{contents:`export {QuestionCard} from './components/prism-next/question-card';export {QuestionReview} from './components/prism-next/question-review';export {questionTone,responsePresentation} from './components/prism-next/question-labels';export {QuestionPrint,createPrintPreferences} from './components/prism-next/question-print';export {MetricSummary,StatusComposition,FilterBar} from './components/prism-next/data-display';`,resolveDir:root,loader:'tsx'},bundle:true,platform:'node',format:'esm',packages:'external',alias:{'@':root},write:false});
await writeFile(file,bundle.outputFiles[0].text);
const {QuestionCard,QuestionReview,questionTone,responsePresentation,QuestionPrint,createPrintPreferences,MetricSummary,StatusComposition,FilterBar}=await import(file);
await rm(file);
const h=React.createElement;
const question={id:'external-001',title:'外部阅读材料',kind:'简答',points:5,stem:'一个从未出现在题库中的题面。'};

test('a question alone renders without fixture content, a workflow or compulsory actions',()=>{
 const html=render(h(QuestionCard,{question}));
 assert.match(html,/外部阅读材料/);assert.match(html,/5 分/);
 assert.doesNotMatch(html,/SYN-A|Q-M-00|试题篮|详情|教师复核/);
});
test('multiple instances preserve independent values and unique accessible headings',()=>{
 const html=render(h('div',null,h(QuestionCard,{question,displayPoints:3}),h(QuestionCard,{question:{...question,id:'external-002',title:'另一道题'},displayPoints:9})));
 assert.match(html,/3 分/);assert.match(html,/9 分/);
 const headings=[...html.matchAll(/aria-labelledby="([^"]+)"/g)].map(x=>x[1]);
 assert.equal(headings.length,2);assert.equal(new Set(headings).size,2);
});
test('review derives limits from arbitrary questions and handles parts without rubrics',()=>{
 let html=render(h(QuestionReview,{question,attempts:{1:'外部答案'},initialScores:{score:2}}));
 assert.match(html.replace(/<[^>]*>/g,''),/初评得分2 \/ 5/);assert.match(html.replace(/<[^>]*>/g,''),/上限 5 分/);assert.doesNotMatch(html,/\{maximum\}/);assert.match(html,/外部答案/);assert.doesNotMatch(html,/Q-M-006|10 \/ 16/);
 html=render(h(QuestionReview,{question:{...question,parts:[{id:'a',content:'子题',points:2},{id:'b',content:'子题二',points:3}]},attempts:{a:'A',b:'B'},initialScores:{}}));
 assert.match(html,/第 a 问 · 小问得分/);assert.match(html,/第 b 问 · 小问得分/);assert.match(html,/有待评分项/);assert.doesNotMatch(html,/0 \/ 0/);
 html=render(h(QuestionReview,{question:{...question,parts:[{id:'a',content:'未分配分值的小问'}]},attempts:{a:'过程'},initialScores:{score:1}}));
 assert.match(html,/整题得分/);assert.match(html.replace(/<[^>]*>/g,''),/初评得分1 \/ 5/);assert.match(html.replace(/<[^>]*>/g,''),/上限 5 分/);assert.match(html,/过程/);
});
test('zero categories do not shift status colors and generic metric labels remain external',()=>{
 const html=render(h(StatusComposition,{items:[{id:'a',label:'空分类',value:0},{id:'b',label:'实际分类',value:3}]}));
 assert.match(html,/flex:3;background:var\(--chart-2\)/);
 const metric=render(h(MetricSummary,{items:[{id:'jobs',label:'已处理订单',value:42}]}));
 assert.match(metric,/已处理订单/);assert.doesNotMatch(metric,/学生|得分率|SYN-A/);
});
test('filter labels connect to unique selectors across instances',()=>{
 const props={fields:[{id:'group',label:'分组',options:[{value:'a',label:'A'}]}],value:{group:'a'},onChange(){}};
 const html=render(h('div',null,h(FilterBar,props),h(FilterBar,props)));
 const ids=[...html.matchAll(/for="([^"]+)"/g)].map(x=>x[1]);
 assert.equal(ids.length,2);assert.notEqual(ids[0],ids[1]);for(const id of ids)assert.ok(html.includes(`id="${id}"`));
});
test('heatmap preserves zero separately from missing; box summaries reject invalid ordering',()=>{
 const extent=matrixExtent([{id:'zero',row:'r',column:'c',value:0},{id:'missing',row:'r',column:'d',value:null}]);
 assert.equal(extent.min,0);assert.ok(extent.missing<0);
 assert.equal(validBox([0,2,3,4,5]),true);assert.equal(validBox([0,3,2,4,5]),false);assert.equal(validBox([0,1,2,3,NaN]),false);
});

test('chart axes retain independent scales and nested theme overrides',async()=>{
 const {themeAxes}=await import('../lib/prism-next/chart-options.ts');
 const themed=themeAxes([{min:0,max:336,axisLabel:{formatter:'{value}次'}},{min:0,max:6,position:'right',splitLine:{show:false},axisLine:{lineStyle:{type:'dashed'}}}],{muted:'#bbb',border:'#444'});
 assert.equal(Array.isArray(themed),true);assert.equal(themed.length,2);assert.equal(themed[1].max,6);assert.equal(themed[1].position,'right');assert.equal(themed[1].axisLine.lineStyle.color,'#444');assert.equal(themed[1].axisLine.lineStyle.type,'dashed');assert.equal(themed[1].splitLine.show,false);assert.equal(themed[0].axisLabel.formatter,'{value}次');assert.equal(themed[0].axisLabel.color,'#bbb');
});
test('chart alignment excludes unrelated categories while retaining zero and gaps',async()=>{
 const {alignChartValues,chartDomain,validDomain}=await import('../lib/prism-next/chart-options.ts');
 const result=alignChartValues([{id:'a'},{id:'b'},{id:'c'}],[{id:'a',value:0},{id:'c',value:null},{id:'unrelated',value:9999}]);
 assert.deepEqual(result,[{id:'a',value:0},{id:'b',value:null},{id:'c',value:null}]);assert.deepEqual(chartDomain(result.map(d=>d.value)),[0,1]);assert.equal(validDomain([80,20]),false);assert.deepEqual(chartDomain([5,10],[80,20]),[0,10]);
});
test('composition excludes invalid quantities and distinguishes zero from missing',async()=>{
 const {compositionSummary}=await import('../lib/prism-next/chart-options.ts');
 assert.deepEqual(compositionSummary([{value:10},{value:0},{value:null},{value:-1},{value:Infinity}]),{total:10,missing:1,invalid:2});
 const html=render(h(StatusComposition,{unit:'人',items:[{id:'a',label:'零值',value:0},{id:'b',label:'未知',value:null}]}));
 assert.match(html,/有效数量合计为 0/);assert.match(html,/零值/);assert.match(html,/0人/);assert.match(html,/缺测/);assert.doesNotMatch(html,/NaN|Infinity/);
});


test('question identity uses complete response metadata, not business labels or part count',()=>{
 for(const response of ['single','multiple','fill','boolean']) assert.equal(questionTone({response}),'blue');
 assert.equal(questionTone({response:'long'}),'magenta');
 assert.equal(questionTone({response:'long',parts:[{id:'a'},{id:'b'}]}),'magenta');
 assert.equal(questionTone({parts:[{response:'boolean'},{response:'boolean'}]}),'blue');
 assert.equal(questionTone({parts:[{response:'single'},{response:'fill'},{response:'long'}]}),'lime');
 for(const value of [{kind:'解答题'}, {response:'unknown'}, {parts:[{response:'single'},{}]}, {response:'long',parts:[{response:'unknown'}]}]) assert.equal(questionTone(value),'neutral');
 assert.equal(responsePresentation('multiple').label,'多选');
 assert.equal(responsePresentation('unknown'),undefined);
 const html=render(h(QuestionCard,{question:{...question,kind:'本校自定义题型',response:'long'}}));
 assert.match(html,/本校自定义题型/);assert.doesNotMatch(html,/客观题|主观题/);
});

test('part labels survive hidden scores, resolve inheritance and never invent long answers',()=>{
 const source={...question,response:'boolean',parts:[{id:'a',content:'继承父级题型'},{id:'b',response:'multiple',points:0,content:'多选内容'},{id:'c',response:'unknown',points:3,content:'未识别类型'}]};
 const before=JSON.stringify(source);
 let html=render(h(QuestionCard,{question:source,showPoints:false}));
 assert.match(html,/判断/);assert.match(html,/多选/);assert.doesNotMatch(html,/解答|[035] 分/);
 html=render(h(QuestionCard,{question:source,displayPoints:9,displayPartPoints:{b:0,c:7}}));
 assert.match(html,/9 分/);assert.match(html,/0 分/);assert.match(html,/7 分/);assert.doesNotMatch(html,/解答/);
 assert.equal(JSON.stringify(source),before);
 const unknown=render(h(QuestionCard,{question:{...question,parts:[{id:'x',points:0,content:'未知作答方式'}]}}));
 assert.match(unknown,/0 分/);assert.doesNotMatch(unknown,/解答|判断|多选/);
});


test('printed part types remain readable without scores and teacher scoring stays explicit',()=>{
 const source={...question,parts:[{id:'a',response:'multiple',points:2,content:'打印多选题干',answer:'A、B',explanation:'原题说明',rubric:[{id:'one',label:'选择依据',points:2}]},{id:'b',response:'long',points:3,content:'打印解答题干',answer:'解答内容'}]};
 const props={questions:[source],entries:[{id:source.id,points:8,partPoints:{a:4,b:4}}],versions:{},blocked:false,title:'外部试卷',minutes:30,showPoints:false,settingsOpen:false,onSettingsChange(){},onPreferencesChange(){}};
 for(const mode of ['paper','compact','response']){
  const html=render(h(QuestionPrint,{...props,preferences:{...createPrintPreferences(),mode}}));
  assert.match(html,/第 1 题（a） · 多选/);assert.match(html,/第 1 题（b） · 解答/);
  assert.doesNotMatch(html,/[23458] 分|data-question-tone|role="radio"/);
  if(mode==='response')assert.doesNotMatch(html,/打印多选题干|打印解答题干/);
 }
 const answers=render(h(QuestionPrint,{...props,preferences:{...createPrintPreferences(),mode:'answers'}}));
 assert.match(answers,/以下分值为原题评分依据，仅供教师参考/);
 assert.match(answers,/原题 2 分/);assert.match(answers,/原题 3 分/);assert.match(answers,/选择依据（2 分）/);
});
