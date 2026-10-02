import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import React from 'react';
import {renderToStaticMarkup as render} from 'react-dom/server';
import {reviewQuestions,knowledgePoints,answersForQuestion} from '../examples/question-review/fixture.ts';
const root=fileURLToPath(new URL('../',import.meta.url)),file=new URL('../.sites-runtime/q7-test/test.mjs',import.meta.url);
await mkdir(new URL('.',file),{recursive:true});
const result=await build({stdin:{contents:`export * from './components/prism-next/question-content'; export * from './examples/question-review/question-digital-card';`,resolveDir:root,loader:'tsx'},bundle:true,jsx:'automatic',platform:'node',format:'esm',packages:'external',alias:{'@':root},loader:{'.css':'empty'},write:false});
await writeFile(file,result.outputFiles[0].text);const c=await import(file);await rm(file);
const h=React.createElement,noop=()=>{},hash=s=>createHash('sha256').update(s).digest('hex');
const missing={id:'missing',title:'缺失',kind:'解答',points:1,stem:'题干',parts:[{id:'1',content:'小问',rubric:[{id:'p1',label:'依据',points:1}]}]};
test('Q7 both typography defaults preserve pre-edit DOM, including missing answers and nested rubrics',async()=>{
 const expected=JSON.parse(await readFile(new URL('./fixtures/question-text-size-default.json',import.meta.url),'utf8'));
 for(const question of [...reviewQuestions.map(q=>q.record),missing])for(const name of ['QuestionContent','QuestionSolution']){
  const html=render(h(c[name],{question}));assert.equal(hash(html),expected[question.id][name],`${question.id} ${name}`);
  for(const textSize of [undefined,'read'])assert.equal(render(h(c[name],{question,textSize})),html);
  const ui=render(h(c[name],{question,textSize:'ui'}));assert.match(ui,/^<div class="[^"]*text-ui-body/);
  // Only typography roles may change; content, option markup and order remain identical.
  assert.equal(ui,html.replace('text-read-body','text-ui-body').replaceAll('text-ui-hint text-muted-foreground','text-ui-meta text-muted-foreground'));
 }
 const calls=[];const html=render(h(c.QuestionContent,{question:reviewQuestions[0].record,textSize:'ui',optionExtra:id=>{calls.push(id);return h('span',{'data-extra':id},id)}}));
 assert.deepEqual(calls,['A','B','C','D']);assert.match(html,/text-ui-body/);assert.match(html,/data-extra="D"/);
});
test('Q9 all digital cards share full card content width across the stem, statistics and details',()=>{
 for(const q of reviewQuestions){const html=render(h(c.QuestionDigitalCard,{question:q,answers:answersForQuestion(q),selected:null,onSelect:noop,missing:false,annotations:true,onIncludeCorrect:noop,filter:'loss',markedPoints:[],onKnowledge:noop}));
  assert.match(html,/q6-question-card[^\"]*px-4 py-5 text-ui-body/);assert.match(html,/q7-question-content min-w-0 w-full space-y-4/);assert.match(html,/question-solution prism-question-copy min-w-0 space-y-5 text-ui-body/);assert.doesNotMatch(html,/text-read-body|text-ui-hint/);
  // Direct block children stretch to the same full-width wrapper; only panel content is inset.
  assert.doesNotMatch(html,/max-w-\[744px\]/);
  assert.match(html,/<div class="q7-question-content min-w-0 w-full space-y-4"><div class="prism-question-heading/);
  assert.match(html,/<div class="prism-question-copy min-w-0 text-ui-body text-foreground">/);
  assert.match(html,/<div class="question-detail-region min-w-0 rounded-xl bg-secondary py-4"><div/);
  assert.match(html,/@container\/question-details min-w-0/);
  assert.match(html,/grid w-full min-w-0 auto-cols-fr grid-flow-col/);
  if(q.type==='选择题'){
   assert.match(html,/prism-question-options-1/);
   assert.equal((html.match(/grid-cols-\[auto_minmax\(0,1fr\)_minmax\(8rem,40%\)\]/g)||[]).length,4);
   assert.equal((html.match(/q6-option-statistics flex min-w-0 items-center/g)||[]).length,4);
  }
  if(q.type==='填空题')assert.match(html,/<section data-objective-groups="true" class="space-y-4">/);
  assert.match(html,/<math class="prism-math"/);assert.doesNotMatch(html,/font-size:|line-height:|scale\(/);
 }
});
test('Q7 local details retain ordered tabs, teaching facts/navigation, archive identity, and scoring',()=>{
 const q=reviewQuestions[16],related=[...new Set(q.points.flatMap(p=>p.knowledge))];
 for(const tab of ['answer','teaching','archive']){const html=render(h(c.ReviewQuestionDetails,{question:q,related,tab,onTabChange:noop,scoring:h('section',{'data-rubric':true},'评分点'),onKnowledge:noop}));
  assert.ok(html.indexOf('aria-label="答案与解析"')<html.indexOf('aria-label="教学定位"'));assert.ok(html.indexOf('aria-label="教学定位"')<html.indexOf('aria-label="题目档案"'));
  assert.match(html,/gap-4/);assert.match(html,/flex-1 outline-none px-4/);assert.doesNotMatch(html,/text-read-body|text-ui-hint/);
  if(tab==='answer'){assert.match(html,/参考答案/);assert.match(html,/data-rubric/)}
  if(tab==='teaching'){for(const text of ['尚未关联教材章节','尚未关联知识点目录','考查方法','认知要求','课程标准','关联知识点导航',...related.map(id=>knowledgePoints.find(k=>k.id===id).name)])assert.ok(html.includes(text),text)}
  if(tab==='archive')for(const text of ['q17','解答题','12 分','来源','版本','可用状态','未提供'])assert.ok(html.includes(text),text);
 }
 // Exercise the local link intent without replacing native coss Tabs semantics.
 let selected;const tree=c.ReviewQuestionDetails({question:q,related,tab:'teaching',onTabChange:noop,scoring:null,onKnowledge:id=>{selected=id}});
 const teaching=tree.props.children.find(node=>node.props.value==='teaching'),links=teaching.props.children[1].props.children;
 links[0].props.onClick();assert.equal(selected,related[0]);
});
test('Q7 layout-only spacing reuses sidebars and preserves formula optics, summary/scan-label roles and scale',async()=>{
 const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
 const css=await read('examples/question-review/question-review.css'),parts=await read('examples/question-review/parts.tsx'),host=await read('examples/question-review/question-review.tsx'),canvas=await read('examples/question-review/question-paper-canvas.tsx');
 assert.match(parts,/space-y-7 px-4 py-5/);assert.match(parts,/space-y-4/);assert.match(parts,/space-y-2 text-ui-body/);
 assert.match(css,/q7-question-content > \.prism-question-copy \{[^}]*gap:16px/);assert.match(css,/prism-question-options \{ row-gap:8px/);assert.match(css,/\.question-solution \{[^}]*gap:16px/);assert.doesNotMatch(css,/font-size|line-height|font-weight/);
 assert.match(host,/<span className="text-ui-body">第 \{q.number\} 题 · \{questionExcerpts/);assert.match(host,/<StudentScale answers=\{visibleAnswers\}/);
 assert.match(canvas,/text-ui-body text-muted-foreground" data-answer-section/);assert.match(parts,/py-2 text-ui-body/);
 const theme=await read('app/(next)/next/theme.css');assert.match(theme,/\.prism-math \{[^}]*font-size:1\.125em/);
});
