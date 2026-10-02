import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {reviewQuestions,knowledgePoints,classStudents,answersForQuestion,questionFilters,knowledgeFilters,filterQuestions,filterKnowledge,filterAnswers,reviewSelection} from '../examples/question-review/fixture.ts';
import {questionImage,answerImage} from '../examples/question-review/artwork.ts';
import {linkedPaperRecords,linkedPaperQuestions,questionReviewStudentId} from '../examples/question-review/paper-link.ts';
const root=fileURLToPath(new URL('../',import.meta.url));
const out=new URL('../.sites-runtime/q1-test/probe.mjs',import.meta.url);await mkdir(new URL('.',out),{recursive:true});
const built=await build({stdin:{contents:"export { QuestionReviewDesign, shortcuts } from './examples/question-review/question-review'; export { QuestionKnowledgeRail, QuestionInspector, StudentScale, StudentJump } from './examples/question-review/parts'; export { PaperReviewDesign } from './examples/paper-review/paper-review'",resolveDir:root,loader:'tsx'},bundle:true,jsx:'automatic',platform:'node',format:'esm',packages:'external',alias:{'@':root},loader:{'.css':'empty'},write:false,plugins:[{name:'review-only-snapshot',setup(b){b.onLoad({filter:/examples\/(?:paper-review\/paper-review|question-review\/question-review)\.tsx$/},async args=>({loader:'tsx',contents:(await readFile(args.path,'utf8')).replace('import { ReviewTools } from "@/examples/review-tools/review-tools"','const ReviewTools = () => null')}))}}]});await writeFile(out,built.outputFiles[0].text);const {QuestionReviewDesign,QuestionKnowledgeRail,QuestionInspector,StudentScale,StudentJump,PaperReviewDesign,shortcuts}=await import(out);await rm(out);
const render=node=>renderToStaticMarkup(node),q17=reviewQuestions[16];
const normalize=html=>html.replace(/«[^»]*»|_R_[^\s"<>]*_/g,'REACT_ID');
test('Q1 fixture: 36 students, 20 questions, 18 knowledge records and exact filter counts',()=>{
 assert.equal(classStudents.length,36);assert.equal(new Set(classStudents.map(s=>s.id)).size,36);assert.equal(reviewQuestions.length,20);assert.equal(knowledgePoints.length,18);
 for(const f of questionFilters)assert.equal(filterQuestions(f.value).length,f.count,f.label);
 for(const f of knowledgeFilters)assert.equal(filterKnowledge(f.value).length,f.count,f.label);
 for(const q of reviewQuestions){const answers=answersForQuestion(q);assert.equal(q.distribution.reduce((s,n)=>s+n,0),36);assert.deepEqual(['满分','部分得分','零分'].map(s=>answers.filter(a=>a.status===s).length),q.distribution);assert.equal(filterAnswers(answers,'pending').length,q.pending);assert.equal(filterAnswers(answers,'loss').length,q.affected);assert.equal(Math.round(answers.reduce((s,a)=>s+a.score,0)/36/q.max*100),q.rate);assert.equal(q.points.reduce((s,p)=>s+p.max,0),q.max);assert.equal(q.highLoss,q.rate<65);assert.equal(q.tone,q.rate<45?'destructive':q.rate<65?'warning':'neutral');for(const a of answers){assert.equal(a.points.reduce((s,p)=>s+p.score,0),a.score);a.points.forEach((p,i)=>assert.ok(p.score>=0&&p.score<=q.points[i].max))}}
 assert.deepEqual(q17.distribution,[6,19,11]);assert.equal(answersForQuestion(q17)[0].score,6);assert.equal(q17.rate,47);assert.equal(q17.affected,30);
 assert.deepEqual(reviewQuestions[0].options.map(o=>o.count),[31,2,1,2]);assert.equal(reviewQuestions[0].options.find(o=>o.correct).label,'A');
 const a1=answersForQuestion(reviewQuestions[0]);for(const option of reviewQuestions[0].options)assert.equal(a1.filter(a=>a.option===option.label).length,option.count);
});
test('Q1 evidence references real scoring points, exact volume and source facts',()=>{for(const k of knowledgePoints){let volume=0;const unique=new Set();for(const e of k.evidence){const q=reviewQuestions.find(q=>q.id===e.question);assert.ok(q);for(const id of e.points){const p=q.points.find(p=>p.id===id);assert.ok(p);assert.ok(p.knowledge.includes(k.id));assert.ok(!unique.has(`${q.id}:${id}`));unique.add(`${q.id}:${id}`);volume+=p.max}}assert.equal(k.volume,volume);assert.equal(k.sufficient,volume>=12)}assert.equal(knowledgePoints[0].volume,18);assert.equal(knowledgePoints[0].evidence.length,3);assert.equal(knowledgePoints[1].volume,20);assert.equal(knowledgePoints[5].volume,10)});
test('Q1 SVG uses corrected ellipse, deterministic varied handwriting and annotation layers',()=>{assert.match(decodeURIComponent(questionImage(q17)),/x²\/8\+y²\/2=1/);assert.match(decodeURIComponent(questionImage(q17)),/<ellipse/);const answers=answersForQuestion(q17);for(const status of ['满分','部分得分','零分']){const a=answers.find(a=>a.status===status);const marked=answerImage(q17,a,true,false);assert.equal(marked,answerImage(q17,a,true,false));assert.notEqual(marked,answerImage(q17,a,false,false));assert.match(decodeURIComponent(marked),/#1769AA/);assert.match(decodeURIComponent(marked),/#B4233D/)}assert.match(decodeURIComponent(answerImage(q17,answers[0],true,true)),/扫描图像未提供/)});
test('Q1 SSR: three panes, continuous 37 papers, only two hero numbers and one primary action',()=>{const html=render(React.createElement(QuestionReviewDesign));for(const pane of ['rail','canvas','inspector'])assert.match(html,new RegExp(`data-review-${pane}`));assert.equal((html.match(/data-review-page=/g)||[]).length,37);assert.equal((html.match(/class="text-score-display"/g)||[]).length,2);const primary=[...html.matchAll(/<button\b[^>]*class="([^"]*)"[^>]*>/g)].filter(m=>/\bbg-primary\s/.test(m[1]));assert.equal(primary.length,1);assert.doesNotMatch(html.replace(/<[^>]+>/g,''),/示例|演示|Demo|样本/i);for(const text of ['47%','当前作答 · 张雨桐','教师批阅','更正评分','查看整卷','全部','失分','待复核'])assert.ok(html.includes(text),text)});
test('Q1 SSR: knowledge view expands evidence and replaces class inspector only',()=>{const noop=()=>{};const html=render(React.createElement(QuestionKnowledgeRail,{view:'knowledge',onView:noop,question:q17,knowledge:knowledgePoints[0],filter:'all',onFilter:noop,onQuestion:noop,onKnowledge:noop,onEvidence:noop,onLocate:noop,onCollapse:noop,closeRef:{current:null}}));assert.match(html,/证据清单/);assert.match(html,/第 12 题/);assert.match(html,/第 17 题/);assert.match(html,/继续观察/);assert.equal((html.match(/role="option"/g)||[]).length,18);const inspector=render(React.createElement(QuestionInspector,{question:q17,answer:answersForQuestion(q17)[0],knowledge:knowledgePoints[0],onKnowledge:noop,onEvidence:noop,onIntent:noop}));assert.match(inspector,/知识点 · 椭圆焦距关系/);assert.match(inspector,/18 分 · 3 道证据题/);assert.match(inspector,/单次试卷不表达长期掌握度/);assert.match(inspector,/当前作答 · 张雨桐/)});
test('Q1 frozen default SSR equals v1 snapshot after removing the sole authorized link',async()=>{const html=render(React.createElement(PaperReviewDesign));const links=html.match(/<a\b[^>]*data-question-review-link[^>]*>[\s\S]*?<\/a>/g)||[];assert.equal(links.length,1);assert.match(links[0],/question=q17&amp;student=OLE-ST-0018/);const normalized=normalize(html.replace(links[0],''));assert.equal(createHash('sha256').update(normalized).digest('hex'),(await readFile(new URL('./fixtures/paper-review-v1.sha256',import.meta.url),'utf8')).trim())});
test('Q1 parameter bridge preserves student identity and per-question scores for all 36 students',()=>{classStudents.forEach((student,index)=>{assert.equal(linkedPaperRecords[index].examId,student.id);assert.equal(linkedPaperRecords[index].name,student.name);const paper=linkedPaperQuestions(index);assert.equal(linkedPaperRecords[index].score,paper.reduce((s,q)=>s+q.score,0));paper.forEach((q,j)=>assert.equal(q.score,answersForQuestion(reviewQuestions[j])[index].score));assert.deepEqual(reviewSelection(new URLSearchParams({question:'q01',student:student.id})),{question:'q1',student:student.id})});assert.equal(reviewSelection(new URLSearchParams({question:'<script>',student:'invalid'})).question,'q17')});
test('Q1 shortcuts include both jumps and view/page navigation',()=>{for(const key of ['← / →','↑ / ↓','Enter','N','[ / ]','G','S','K','H','+ / −','0','R','L','O（按住）','F / Esc','T','?'])assert.ok(shortcuts.some(([k])=>k===key),key)});
test('Q1 coss controls have no host height/width overrides except multiline and question cells',async()=>{for(const name of ['question-review.tsx','parts.tsx']){const source=await readFile(new URL(`../examples/question-review/${name}`,import.meta.url),'utf8');for(const tag of source.matchAll(/<(?:Button|Toggle|ToggleGroupItem|TabsTab|SelectTrigger|ComboboxTrigger|ComboboxInput|ComboboxItem)\b[\s\S]*?(?=>)/g)){const cls=tag[0].match(/className=("[^"]*"|\{`[^`]*`\})/);if(!cls)continue;const without=cls[1].replace(/h-auto|sm:h-auto|min-h-11/g,'');assert.doesNotMatch(without,/(?:^|[\s"`])(?:sm:)?(?:h-|w-|min-h-|min-w-|max-h-|max-w-|size-)\w/,tag[0])}}});
test('Q1 built route is full screen and discoverable',async()=>{const {default:worker}=await import('../dist/server/index.js');const response=await worker.fetch(new Request('http://localhost/next/reviews/question-review',{headers:{accept:'text/html'}}),{ASSETS:{fetch:async()=>new Response('Not found',{status:404})}},{waitUntil(){},passThroughOnException(){}});assert.equal(response.status,200);const html=await response.text();assert.match(html,/<title>题目与知识点预览框架 · 设计稿(?:｜智能曜彩 v1)?<\/title>/);assert.match(html,/data-ui-version="coss-v1"/);assert.doesNotMatch(html,/<aside[^>]+data-slot="sidebar"/);assert.match(html,/评审工具/);const shell=await readFile(new URL('../components/prism-next/shell.tsx',import.meta.url),'utf8');assert.match(shell,/link\("\/next\/reviews\/question-review","题目与知识点预览框架 · 设计稿"\)/)});

// Exercise host intents with controlled hook storage. Browser geometry and Base UI
// focus/selection are deliberately not represented by this probe.
const eventOut=new URL('../.sites-runtime/q1-test/events.mjs',import.meta.url);
const eventsBuilt=await build({stdin:{contents:"export { QuestionReviewDesign } from './examples/question-review/question-review'",resolveDir:root,loader:'tsx'},bundle:true,jsx:'automatic',platform:'node',format:'esm',packages:'external',alias:{'@':root},loader:{'.css':'empty'},write:false,plugins:[{name:'q1-host-events',setup(b){b.onLoad({filter:/examples\/question-review\/question-review\.tsx$/},async args=>({loader:'tsx',contents:(await readFile(args.path,'utf8')).replace('import { ReviewTools } from "@/examples/review-tools/review-tools"','const ReviewTools = () => null').replace('useEffect, useLayoutEffect, useMemo, useRef, useState,','useMemo,').replace('export const shortcuts =',`const useState=(initial:any):any=>{const host=(globalThis as any).__q1Host;const i=host.cursor++;if(!(i in host.values))host.values[i]=initial;return [host.values[i],(v:any)=>{host.values[i]=typeof v==='function'?v(host.values[i]):v}]};
const useRef=(initial:any):any=>({current:initial});const useEffect=()=>{};const useLayoutEffect=()=>{};
export const shortcuts =`)}))}}]});await writeFile(eventOut,eventsBuilt.outputFiles[0].text);const {QuestionReviewDesign:EventHost}=await import(eventOut);await rm(eventOut);
function hostNodes(){globalThis.__q1Host.cursor=0;const nodes=[];function walk(node){if(!React.isValidElement(node))return;nodes.push(node);React.Children.forEach(node.props.children,walk)}function Probe(){const root=EventHost();walk(root);return root}render(React.createElement(Probe));return nodes}
const node=predicate=>hostNodes().find(predicate);
const canvasNode=()=>node(n=>n.props.viewportRef);
const inspectorNode=()=>node(n=>n.props.onIntent&&n.props.answer);
const railNode=()=>node(n=>n.props.onKnowledge&&n.props.closeRef);
function press(key,closest=()=>null){let prevented=false;node(n=>n.props.onKeyDownCapture).props.onKeyDownCapture({key,target:{closest},nativeEvent:{},preventDefault(){prevented=true},stopPropagation(){}});return prevented}
function resetHost(){globalThis.__q1Host={cursor:0,values:[]}}
test('Q1 host: K/evidence/rubric maintain knowledge context and precise point highlights',()=>{resetHost();press('k');assert.equal(railNode().props.view,'knowledge');railNode().props.onEvidence('q12',['p1','p2']);assert.equal(inspectorNode().props.question.id,'q12');assert.equal(inspectorNode().props.knowledge.id,'ellipse-focus');const points=canvasNode().props.pages[0].regions.filter(r=>r.content.props.className.includes('ring-info'));assert.deepEqual(points.map(p=>p.id),['p1','p2']);press('k');assert.equal(inspectorNode().props.knowledge,null)});
test('Q1 host: answer filtering keeps question sheet, rubric and student synchronized',()=>{resetHost();node(n=>n.props.value==='all'&&n.props.onValueChange).props.onValueChange('pending');assert.equal(canvasNode().props.pages.length,3);assert.equal(canvasNode().props.pages[0].id,'question');assert.equal(inspectorNode().props.answer.review,'待复核');press('ArrowRight');const first=inspectorNode().props.answer.student.id;press('ArrowRight');assert.notEqual(inspectorNode().props.answer.student.id,first);assert.equal(inspectorNode().props.answer.review,'待复核');press(']');assert.equal(inspectorNode().props.question.id,'q18');assert.equal(canvasNode().props.pages.length,3)});
test('Q1 host: actions emit receipts, native Enter survives, shortcuts control viewing only',()=>{resetHost();const score=inspectorNode().props.answer.score;inspectorNode().props.onIntent('教师批阅');assert.match(node(n=>n.props.role==='status').props.children,/已请求：教师批阅/);assert.equal(inspectorNode().props.answer.score,score);assert.equal(press('Enter',selector=>selector==='button,a,[role=tab]'?{}:null),false);press('0');assert.equal(canvasNode().props.zoom,'page');press('f');assert.equal(node(n=>n.props['data-immersive']!==undefined).props['data-immersive'],true);press('Escape');assert.equal(node(n=>n.props['data-immersive']!==undefined).props['data-immersive'],false);press('g');assert.equal(node(n=>n.props.current?.number).props.open,true)});
import {railPreferenceKeys,railCollapsedForWidth} from '../examples/question-review/rail-preferences.ts';
test('Q1 independently namespaces preferences and follows the frozen width bands',()=>{assert.equal(railCollapsedForWidth(1439,{}),true);assert.equal(railCollapsedForWidth(1440,{}),false);assert.equal(railCollapsedForWidth(1920,{best:true}),true);assert.ok(Object.values(railPreferenceKeys).every(key=>key.startsWith('prism-question-review-')))});

test("Q1 frozen roster links resolve names without collisions in the 5174 roster",()=>{for(const name of ["张雨桐","李思远","陈语安","周子墨","林书宁","王予辰"]){const id=questionReviewStudentId(name,"unresolved");assert.equal(classStudents.find(s=>s.id===id)?.name,name)}});

const jumpNode=()=>node(n=>n.props.triggerRef&&n.props.answers);
const scaleNode=()=>node(n=>n.props.answers&&n.props.max&&!n.props.triggerRef);
test('Q2 SSR: one student control bar holds filter and navigation; side dock is view-only',()=>{
 const html=render(React.createElement(QuestionReviewDesign));
 assert.equal((html.match(/data-student-controls=/g)||[]).length,1);
 const start=html.indexOf('data-student-controls='),end=html.indexOf('class="d1-paper-host',start),bar=html.slice(start,end);
 for(const text of ['题目页','学生作答筛选','学生导航','选择学生 · 36','data-student-scale','36 位学生：满分 6、部分 19、零分 11'])assert.ok(bar.includes(text),text);
 assert.match(bar,/aria-pressed="true"/);
 const dock=html.slice(html.indexOf('aria-label="作答侧签工具条"'),html.indexOf('data-review-inspector'));
 assert.doesNotMatch(dock,/学生|题目页|data-student-scale/);
 for(const text of ['视图','图层','沉浸'])assert.ok(dock.includes(text));
 const rail=html.slice(html.indexOf('data-review-rail'),html.indexOf('data-review-canvas'));
 assert.doesNotMatch(rail,/第 [12] 页/);for(const type of ['选择题','填空题','解答题'])assert.ok(rail.includes(type));
});
test('Q2 scale: each filter has exactly one tick per visible student and one active info tick',()=>{
 for(const [filter,count] of [['all',36],['loss',30],['pending',2]]){
 const answers=filterAnswers(answersForQuestion(q17),filter);
 const html=render(React.createElement(StudentScale,{answers,current:answers[1],max:q17.max,onSelect(){}}));
 assert.equal((html.match(/data-student-tick=/g)||[]).length,count);
 assert.equal((html.match(/h-2 bg-info/g)||[]).length,1);
 assert.match(html,new RegExp(`${count} 位学生：`));assert.match(html,/aria-hidden="true"/);
 }
});
test('Q2 inspector: deduplicated related knowledge, thin scoring bars, Meter only in knowledge overview',()=>{
 const props={question:q17,answer:answersForQuestion(q17)[0],knowledge:null,onKnowledge(){},onEvidence(){},onIntent(){}};
 const html=render(React.createElement(QuestionInspector,props));
 assert.equal((html.match(/椭圆焦距关系/g)||[]).length,1);assert.match(html,/关联知识点/);assert.doesNotMatch(html,/role="meter"/);
 const scoring=html.split('data-class-scoring-points')[1].split('</ul>')[0];assert.equal((scoring.match(/block h-1 flex-1/g)||[]).length,3);
 const multiple={...q17,points:q17.points.map((p,i)=>({...p,knowledge:i===0?['ellipse-focus',knowledgePoints[1].id]:p.knowledge}))};
 const multi=render(React.createElement(QuestionInspector,{...props,question:multiple}));
 assert.ok((multi.match(/椭圆焦距关系/g)||[]).length>1);
 const knowledge=render(React.createElement(QuestionInspector,{...props,knowledge:knowledgePoints[0]}));assert.equal((knowledge.match(/role="meter"/g)||[]).length,1);
});
test('Q2 host: initial selection, S/H, paper clicks and scale clicks share navigation state',()=>{
 resetHost();assert.equal(jumpNode().props.current,null);press('s');assert.equal(jumpNode().props.open,true);
 press('Escape');jumpNode().props.onOpenChange(false);press('ArrowRight');
 assert.equal(jumpNode().props.current.student.id,canvasNode().props.pages[1].id);
 const target=canvasNode().props.pages[5].id;canvasNode().props.onSelect(target);
 assert.equal(jumpNode().props.current.student.id,target);assert.equal(inspectorNode().props.answer.student.id,target);assert.equal(canvasNode().props.activePage,target);
 scaleNode().props.onSelect(canvasNode().props.pages[3].id);assert.equal(jumpNode().props.current.student.id,canvasNode().props.activePage);
 press('h');assert.deepEqual(globalThis.__q1Host.values.find(v=>v?.id==='question'&&v?.request>0)?.id,'question');
 canvasNode().props.onVisiblePage(0);assert.equal(node(n=>n.props['aria-pressed']!==undefined).props['aria-pressed'],true);
 canvasNode().props.onVisiblePage(2);assert.equal(jumpNode().props.current.student.id,canvasNode().props.pages[2].id);
 press('f');assert.ok(node(n=>n.props['data-student-controls']!==undefined));
});
test('Q2 host: filtered jump, scale, paper ring and inspector use identical roster and selection',()=>{
 resetHost();press('ArrowRight');node(n=>n.props.value==='all'&&n.props.onValueChange).props.onValueChange('pending');
 assert.equal(jumpNode().props.answers.length,2);assert.equal(scaleNode().props.answers.length,2);assert.equal(canvasNode().props.pages.length,3);
 jumpNode().props.onSelect(jumpNode().props.answers[1].student.id);
 const id=jumpNode().props.current.student.id;
 assert.equal(scaleNode().props.current.student.id,id);assert.equal(inspectorNode().props.answer.student.id,id);assert.equal(canvasNode().props.activePage,id);
 const html=render(React.createElement(StudentJump,jumpNode().props));assert.match(html,/2 \/ 2/);
});
