import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import React from 'react';
import temml from 'temml';
import {renderToStaticMarkup as render} from 'react-dom/server';
import {reviewQuestions,answersForQuestion,questionAnalyses} from '../examples/question-review/fixture.ts';
const root=fileURLToPath(new URL('../',import.meta.url)),file=new URL('../.sites-runtime/q6-test/test.mjs',import.meta.url);
await mkdir(new URL('.',file),{recursive:true});
const result=await build({stdin:{contents:`export * from './components/prism-next/question-content'; export * from './components/prism-next/question-details'; export * from './examples/question-review/question-digital-card'; export * from './examples/question-review/question-paper-canvas'; export * from './examples/question-review/parts';`,resolveDir:root,loader:'tsx'},bundle:true,jsx:'automatic',platform:'node',format:'esm',packages:'external',alias:{'@':root},loader:{'.css':'empty'},write:false});
await writeFile(file,result.outputFiles[0].text);const c=await import(file);await rm(file);
const h=React.createElement,noop=()=>{};
const cardProps=q=>({question:q,answers:answersForQuestion(q),selected:null,onSelect:noop,missing:false,annotations:true,onIncludeCorrect:noop,filter:'loss',markedPoints:[],onKnowledge:noop});
const hash=s=>createHash('sha256').update(s).digest('hex');
test('Q6 optional optionExtra preserves exact pre-change DOM for all 20 QuestionRecords',async()=>{
 const expected=JSON.parse(await readFile(new URL('./fixtures/question-content-pre-option-extra.json',import.meta.url),'utf8'));
 for(const q of reviewQuestions){const html=render(h(c.QuestionContent,{question:q.record}));assert.equal(hash(html),expected[q.id],q.id);assert.equal(render(h(c.QuestionContent,{question:q.record,optionExtra:undefined})),html)}
 const calls=[];const html=render(h(c.QuestionContent,{question:reviewQuestions[0].record,optionExtra:id=>{calls.push(id);return h('span',{'data-extra':id},`附加 ${id}`)}}));
 assert.deepEqual(calls,['A','B','C','D']);for(const id of calls)assert.match(html,new RegExp(`data-extra="${id}"`));
});
test('Q6 every question is digital, with MathML and full content; Q12/Q17 have themed vector figures and parts',async()=>{
 for(const q of reviewQuestions){const html=render(h(c.QuestionDigitalCard,cardProps(q)));assert.match(html,/data-digital-question/);assert.match(html,/data-question-level="L2"/);assert.match(html,/prism-question-copy/);assert.match(html,/text-read-body/);assert.match(html,/<math class="prism-math"/);assert.match(html,/参考答案/);assert.doesNotMatch(html,/未提供参考答案|未提供解析|shadow-2xl|data-prism-theme="light"/);if(q.type==='选择题')assert.equal(q.record.options.length,4);if([12,17].includes(q.number)){assert.match(html,/<ellipse/);assert.match(html,/stroke="currentColor"/);assert.equal((html.match(/data-part-id=/g)||[]).length,2);assert.match(html,/<mfrac>/);assert.match(html,/<msqrt>/)}}
 const artwork=await readFile(new URL('../examples/question-review/artwork.ts',import.meta.url),'utf8');assert.doesNotMatch(artwork,/questionImage|questionLayout|questionPointRect|<ellipse/);
});
test('Q6 option statistics share each question option row, correct list collapsed and every wrong list expanded',()=>{
 const q=reviewQuestions[0],html=render(h(c.QuestionDigitalCard,cardProps(q)));
 assert.match(html,/prism-question-options-1/);for(const o of questionAnalyses[q.id].options){assert.match(html,new RegExp(`${o.count} 人 · ${Math.round(o.count/36*100)}%`));assert.match(html,new RegExp(`高分组 ${o.high} · 低分组 ${o.low}`));const group=html.slice(html.indexOf(`data-option-group="${o.label}"`));assert.match(group.slice(0,group.indexOf('</button>')),new RegExp(`aria-expanded="${!o.correct}"`))}
 assert.match(html,/✓ 正确/);assert.match(html,/主要干扰项/);
 const wrong=answersForQuestion(q).filter(a=>a.score<q.max);for(const a of wrong)assert.ok(html.includes(a.student.name));
 for(const a of answersForQuestion(q).filter(a=>a.score===q.max))assert.ok(!html.includes(a.student.name));
 const fill=render(h(c.QuestionDigitalCard,cardProps(reviewQuestions[5])));assert.match(fill,/作答情况/);assert.match(fill,/答对 · 26 人/);assert.match(fill,/代表性作答裁切/);
});
test('Q6 QuestionDetails tab order, archive facts, teaching fallback and scoring evidence',()=>{
 const q=reviewQuestions[16],html=render(h(c.QuestionDigitalCard,{...cardProps(q),markedPoints:['p2']}));
 assert.ok(html.indexOf('aria-label="答案与解析"')<html.indexOf('aria-label="教学定位"'));assert.ok(html.indexOf('aria-label="教学定位"')<html.indexOf('aria-label="题目档案"'));
 assert.match(html,/data-scoring-point="p2" class="[^"]*ring-2 ring-info/);assert.equal((html.match(/全班得分率 \d+%/g)||[]).length,3);
 const props={question:q.record,metadata:{knowledge:['椭圆焦距关系'],method:'',demand:'',family:'',source:'未提供',version:'未提供'},links:{},onLinksChange:noop,onTabChange:noop,archive:[{label:'分值',value:'12 分'}]};
 const teaching=render(h(c.QuestionDetails,{...props,tab:'teaching'}));assert.match(teaching,/尚未关联教材章节/);
 const archive=render(h(c.QuestionDetails,{...props,tab:'archive'}));for(const text of ['q17','解答题','12 分','未提供'])assert.ok(archive.includes(text));
 for(const question of [reviewQuestions[0],q]){const inspector=render(h(c.QuestionInspector,{question,answer:null,knowledge:null,onKnowledge:noop,onEvidence:noop,onIntent:noop}));assert.doesNotMatch(inspector,/aria-label="选项分布"|data-class-scoring-points/);assert.match(inspector,question.number===1?/主要干扰项 B：2 人/:/本题得分分布/)}
});
test('Q6 digital card width and markup are invariant under scan zoom/rotation; scan layout changes',()=>{
 const q=reviewQuestions[16];const props={pages:[{id:'question',width:794,height:1,content:h(c.QuestionDigitalCard,cardProps(q))},{id:'student',width:794,height:273,imageUrl:'scan.svg'}],viewportRef:{current:null},zoom:'width',rotations:{},selected:'student',scale:1,onSelect:noop,onZoom:noop,onVisiblePage:noop,onViewport:noop,headers:{},activePage:'student',topInset:68,answerLabel:'学生作答 · 失分 30'};
 const normal=render(h(c.QuestionPaperCanvas,props)),changed=render(h(c.QuestionPaperCanvas,{...props,zoom:175,rotations:{question:90,student:90}}));
 const card=html=>html.slice(html.indexOf('<section'),html.indexOf('<section',html.indexOf('<section')+1));
 assert.equal(card(normal),card(changed));assert.doesNotMatch(card(normal),/transform:|shadow-2xl/);assert.notEqual(normal,changed);assert.match(normal,/学生作答 · 失分 30/);assert.match(normal,/data-scan-paper/);
});

test('Q6 fixed MathML matches all 152 expressions rendered by pinned temml',async()=>{
 const entries=JSON.parse(await readFile(new URL('../examples/question-review/question-math.json',import.meta.url),'utf8'));
 assert.equal(Object.keys(entries).length,152);
 for(const [source,markup] of Object.entries(entries))assert.equal(markup,temml.renderToString(source,{throwOnError:true}).replace('<math','<math class="prism-math"'),source);
});
test('Q6 summary visibility uses the whole card boundary and remains stable when control height grows',()=>{
 let scroll,hidden,visible,cardBottom=69,controlHeight=68;
 const card={getBoundingClientRect:()=>({top:-800,bottom:cardBottom,left:8,right:748})},scan={getBoundingClientRect:()=>({top:cardBottom+20,bottom:cardBottom+293,left:8,right:748})};
 const viewport={getBoundingClientRect:()=>({top:0,bottom:800,left:0,right:820}),querySelector:selector=>selector.includes('page-id')?card:{dataset:{percent:'95'}},querySelectorAll:()=>[card,scan]};
 const props={pages:[],viewportRef:{current:viewport},zoom:'width',rotations:{},selected:'',scale:1,onSelect:noop,onZoom:noop,onVisiblePage:n=>{visible=n},onViewport:noop,headers:{},activePage:'question',onQuestionHidden:value=>{hidden=value}};
 function Probe(){const element=c.QuestionPaperCanvas({...props,topInset:controlHeight});scroll=element.props.onScroll;return element}
 render(h(Probe));scroll();assert.equal(hidden,false);
 cardBottom=67;scroll();assert.equal(hidden,true);assert.equal(visible,1);
 cardBottom+=40;controlHeight+=40;render(h(Probe));scroll();assert.equal(hidden,true);
 cardBottom=controlHeight+1;scroll();assert.equal(hidden,false);
});
