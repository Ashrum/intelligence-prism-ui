import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {api,h,render,capture} from './question-analysis-c2-harness.mjs';
import {computeQuestionAnalysis} from '../lib/prism-next/question-analysis.ts';
const noop=()=>{};
test('KnowledgeRail preserves external bands, rates, evidence and ordered keyboard intents',()=>{
 const calls=[],items=api.analysisKnowledge;
 const out=capture(api.KnowledgeRail,{sections:[{id:'conic',label:'圆锥曲线',items}],selected:'ellipse',onSelect:id=>calls.push(id),onEvidence:(...args)=>calls.push(args)});
 assert.match(out.html,/42%/);assert.match(out.html,/继续观察/);assert.match(out.html,/data-evidence/);assert.match(out.html,/<math>/);
 const evidence=capture(api.KnowledgeEvidenceList,{items:api.analysisEvidence,onEvidence:(...args)=>calls.push(args)});
 evidence.nodes.find(n=>n.props.onClick).props.onClick();assert.deepEqual(calls,[['q17',['p2']]]);
 const list=capture(api.ReviewRailList,{items:[{id:'b'},{id:'a'}],selected:'b',onSelect:id=>calls.push(id),onLocate:id=>calls.push(['locate',id]),label:'选择知识点',children:null});
 const event=key=>({key,target:{closest:()=>null},preventDefault(){},stopPropagation(){}});
 list.nodes[0].props.onKeyDown(event('ArrowDown'));list.nodes[0].props.onKeyDown(event('Enter'));assert.deepEqual(calls.slice(-2),['a',['locate','b']]);
 const native={...event('Enter'),target:{closest:()=>({})},preventDefault(){throw Error('evidence Enter stays native')}};list.nodes[0].props.onKeyDown(native);
});
test('KnowledgeRail empty filter retains standard Select and fixed label identity',()=>{
 const calls=[],props={id:'knowledge-filter',label:'知识点筛选',value:'all',items:[{value:'all',label:'全部',count:0}],onChange:id=>calls.push(id)};
 const out=capture(api.ReviewRailFilter,props);out.nodes.find(n=>n.props.onValueChange).props.onValueChange('all');assert.deepEqual(calls,['all']);assert.match(out.html,/for="knowledge-filter"/);
 assert.match(render(h(api.KnowledgeRail,{sections:[],selected:null,onSelect:noop,onEvidence:noop})),/没有符合筛选的条目/);
});
test('StudentControlScale renders supplied tones and summary without computing outcome',()=>{
 const calls=[],props={items:[{id:'a',tone:'destructive',tooltip:'外部文字'},{id:'b',tone:'neutral',tooltip:'第二位'}],selected:'b',summary:'宿主人数口径待核对',onSelect:id=>calls.push(id)};
 const out=capture(api.StudentControlScale,props);assert.match(out.html,/宿主人数口径待核对/);assert.match(out.html,/h-1 bg-destructive/);assert.match(out.html,/h-2 bg-info/);assert.equal((out.html.match(/data-student-tick=/g)||[]).length,2);
 out.nodes.find(n=>n.props['data-student-tick']==='a').props.onClick();assert.deepEqual(calls,['a']);assert.equal(capture(api.StudentControlScale,props).html,out.html);
});
test('StudentControlSwitcher delegates all records and native search to ReviewSwitcher',()=>{
 const calls=[],items=api.analysisStudents,out=capture(api.StudentControlSwitcher,{items,groups:[{value:'全部',items}],current:null,max:12,open:false,onOpenChange:noop,onSelect:id=>calls.push(id),triggerRef:{current:null},searchId:'student-search'});
 const core=out.nodes[0];assert.equal(core.type.name,'ReviewSwitcher');core.props.onSelect(1);assert.deepEqual(calls,['b']);assert.equal(core.props.current,-1);assert.equal(core.props.searchId,'student-search');assert.match(out.html,/选择学生 · 2/);
});
test('QuestionAnalysisCard uses supplied option facts and preserves one question renderer',()=>{
 const q={...api.analysisQuestion,type:'选择题',category:'objective',record:{...api.analysisQuestion.record,options:[{id:'A',content:'条件成立'},{id:'B',content:'条件缺失'}]}};
 const options=[{label:'A',count:7,percent:70,ratio:70,high:4,low:3,correct:true,students:[api.analysisStudents[1]]},{label:'B',count:3,percent:30,ratio:30,high:1,low:2,correct:false,distractor:true,students:[api.analysisStudents[0]]}];
 const html=render(h(api.QuestionAnalysisCard,{question:q,options,related:api.analysisKnowledge,selected:null,onSelect:noop,onIncludeCorrect:noop,filter:'loss',markedPoints:['p2'],onKnowledge:noop}));
 assert.match(html,/7 人 · 70%/);assert.match(html,/高分组 4 · 低分组 3/);assert.match(html,/主要干扰项/);assert.match(html,/prism-question-copy min-w-0 text-ui-body/);assert.match(html,/data-scoring-point="p2" class="[^"]*ring-2 ring-info/);assert.doesNotMatch(html,/text-read-body/);
 assert.match(html,/aria-label="答案与解析"/);assert.match(html,/aria-label="教学定位"/);assert.match(html,/aria-label="题目档案"/);
});
test('QuestionAnalysisGroups emits exact student ids and renders host-provided math and image',()=>{
 const calls=[],groups={errors:[{label:'外部答案',students:[api.analysisStudents[0]],image:{src:'/crop.svg',alt:'原始裁切'}}],correct:[],correctLabel:'答对'};
 const out=capture(api.QuestionAnalysisGroups,{groups,selected:null,filter:'all',onSelect:id=>calls.push(id),onIncludeCorrect:noop});out.nodes.find(n=>n.props.onClick).props.onClick();assert.deepEqual(calls,['a']);assert.match(out.html,/原始裁切/);assert.match(out.html,/作答情况/);
});
test('QuestionAnalysisPanel only presents provided statistics and knowledge evidence',()=>{
 const calls=[],props={...api.analysisPanel,onKnowledge:id=>calls.push(id),onEvidence:noop};
 const out=capture(api.QuestionAnalysisPanel,props);assert.match(out.html,/0.32/);assert.match(out.html,/AI 归纳/);assert.match(out.html,/grid-cols-2/);out.nodes.find(n=>n.props.onClick).props.onClick();assert.deepEqual(calls,['ellipse']);assert.equal(capture(api.QuestionAnalysisPanel,props).html,out.html);
 const knowledge=render(h(api.QuestionAnalysisPanel,{...props,knowledge:{topic:'专题',rate:42,affected:21,volume:12,evidence:api.analysisEvidence}}));assert.match(knowledge,/role="meter"/);assert.match(knowledge,/单次试卷不表达长期掌握度/);assert.doesNotMatch(knowledge,/data-question-statistics/);
});
test('QuestionRailClass renders second line, external marker and sorted row vocabulary',()=>{
 const items=[{id:'x',number:1,value:'42%',tone:'warning',ratio:42,detail:'区分度 -0.10',marker:true,ariaLabel:'外部统计',tooltip:'外部统计'}],props={sections:[{id:'s',label:'题型',layout:'cell',items}],selected:'x',onSelect:noop,overview:{segments:[],text:'外部概览'}};
 assert.match(render(h(api.QuestionRailClass,props)),/42%/);assert.match(render(h(api.QuestionRailClass,props)),/size-1.5 rounded-full bg-info/);
 const rows=render(h(api.QuestionRailClass,{...props,sections:[{...props.sections[0],layout:'row'}]}));assert.match(rows,/区分度 -0.10/);assert.doesNotMatch(rows,/grid-cols-4/);
});
test('PaperPreviewMixed separates digital transforms, headers and controlled full groups',()=>{
 const pages=[{id:'question',width:794,height:1,content:h('article',{},'数字题目')},{id:'student',width:794,height:273,imageUrl:'/scan.svg'}],props={pages,viewportRef:{current:null},zoom:100,rotations:{student:90,question:90},selected:'student',scale:1,onSelect:noop,onZoom:noop,onVisiblePage:noop,onViewport:noop,headers:{student:h('header',{},'纸外身份')},activePage:'student',topInset:68,answerLabel:'学生作答',beforeContent:h('p',{},'前置内容')};
 const out=capture(api.PaperPreviewMixed,props);assert.match(out.html,/padding-top:68px/);assert.ok(out.html.indexOf('前置内容')<out.html.indexOf('数字题目'));assert.ok(out.html.indexOf('纸外身份')<out.html.indexOf('data-scan-paper'));
 const sheets=out.nodes.filter(n=>n.props['data-review-page']!==undefined);assert.equal(sheets[0].props.style,undefined);assert.deepEqual(sheets[1].props.style,{width:273,height:794});
 const calls=[],group=capture(api.PaperPreviewGroup,{count:6,open:false,onOpenChange:v=>calls.push(v)});group.nodes[0].props.onOpenChange(true);assert.deepEqual(calls,[true]);assert.match(group.html,/aria-expanded="false"/);
});
test('statistics have no UI dependency and reject incomplete population instead of emitting NaN',async()=>{
 assert.throws(()=>computeQuestionAnalysis({id:'q',number:1,max:1,category:'objective',type:'选择题',points:[]},[],{}),RangeError);
 const q={id:'q',number:1,max:2,category:'subjective',type:'解答题',points:[{id:'p',max:2}]},answers=[{student:{id:'a'},score:2,review:'已确认',status:'满分',points:[{id:'p',score:2}]},{student:{id:'b'},score:0,review:'待复核',status:'零分',points:[{id:'p',score:0}]}];
 const result=computeQuestionAnalysis(q,answers,{a:10,b:5});assert.equal(result.mean,1);assert.equal(result.sd,1);assert.equal(result.d,1);assert.deepEqual(result.distribution,[1,0,1]);
 const source=await readFile(new URL('../lib/prism-next/question-analysis.ts',import.meta.url),'utf8');assert.doesNotMatch(source,/examples\/|from ['"]react/);
});
for(const [slug,name,title] of [['knowledge-rail','KnowledgeRailDemo','Knowledge Rail'],['student-control-bar','StudentControlBarDemo','Student Control Bar'],['question-analysis-card','QuestionAnalysisCardDemo','Question Analysis Card'],['question-analysis-panel','QuestionAnalysisPanelDemo','Question Analysis Panel']]){
 test(`${name} includes themes, narrow container and catalog Agent Spec`,async()=>{
  const html=render(h(api[name]));for(const theme of ['light','paper','dark'])assert.ok(html.includes(`data-prism-theme="${theme}"`));assert.match(html,/320px/);
  const {default:worker}=await import('../dist/server/index.js');const response=await worker.fetch(new Request(`http://localhost/next/components/${slug}`,{headers:{accept:'text/html'}}),{ASSETS:{fetch:async()=>new Response('Not found',{status:404})}},{waitUntil(){},passThroughOnException(){}});assert.equal(response.status,200);const page=await response.text();assert.ok(page.includes(title));assert.match(page,/Agent Spec/);
 });
}
