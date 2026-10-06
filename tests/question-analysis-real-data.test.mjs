import test from 'node:test';
import assert from 'node:assert/strict';
import {api,h,render,capture} from './question-analysis-c2-harness.mjs';
import {api as review} from './review-components-harness.mjs';
const noop=()=>{};
const handlers={selected:null,onSelect:noop,onIncludeCorrect:noop,filter:'loss'};
const question={...api.analysisQuestion,points:[],type:'选择题',category:'objective',record:{...api.analysisQuestion.record,optionColumns:2,options:[{id:'A',content:'有作答'},{id:'B',content:'没有作答'}]}};
const card={question,related:[],markedPoints:[],onKnowledge:noop,...handlers};
const option={label:'A',count:1,percent:100,ratio:100,correct:false,students:[{id:'a',name:'张同学'}]};
test('G2 option statistics force one column without mutating the host record; plain options retain host layout',()=>{
 const html=render(h(api.QuestionAnalysisCard,{...card,options:[option]}));
 assert.match(html,/prism-question-options-1 /);assert.doesNotMatch(html,/prism-question-options-2 /);assert.equal(question.record.optionColumns,2);
 assert.match(render(h(api.QuestionAnalysisCard,card)),/prism-question-options-2 /);
});
test('G2 zero-count options expose count text but no empty roster, trigger or high/low row',()=>{
 const html=render(h(api.QuestionAnalysisCard,{...card,options:[{...option,count:0,percent:0,ratio:0,high:0,low:0,students:[]}]}));
 assert.match(html,/0 人 · 0%/);assert.doesNotMatch(html,/0 人，|data-option-group=|高分组|低分组|data-slot="collapsible"/);
});
test('G2 high and low groups may each be absent; known zero stays zero',()=>{
 const draw=extra=>render(h(api.QuestionAnalysisCard,{...card,options:[{...option,...extra}]}));
 assert.doesNotMatch(draw({}),/高分组|低分组/);
 assert.match(draw({highLow:{high:0}}),/高分组 0/);assert.doesNotMatch(draw({highLow:{high:0}}),/低分组/);
 assert.match(draw({highLow:{low:2}}),/低分组 2/);assert.doesNotMatch(draw({highLow:{low:2}}),/高分组/);
 assert.match(draw({high:1,low:0}),/高分组 1 · 低分组 0/);
});
test('G2 missing option responses use existing wrong-first and collapsed-correct groups with description',()=>{
 const props={...handlers,description:'选项作答未提供',groups:{errors:[{label:'答错',students:[{id:'a',name:'张同学'}]}],correct:[{id:'b',name:'李同学'}],correctLabel:'答对'}};
 const out=capture(api.QuestionAnalysisGroups,props);assert.match(out.html,/作答情况<\/h2><p[^>]+>选项作答未提供/);
 assert.ok(out.html.indexOf('答错')<out.html.indexOf('答对'));assert.match(out.html,/aria-expanded="false"/);assert.doesNotMatch(out.html,/李同学/);
 const html=render(h(api.QuestionAnalysisCard,{...card,groups:props,pointsEmptyText:'评分点未提供'}));assert.match(html,/评分点<\/h4><p[^>]+>评分点未提供/);
});
test('G2 details show external fields, per-field empty text, and preserve zero values',()=>{
 const details={question,related:[],onTabChange:noop,onKnowledge:noop,pointsEmptyText:'评分点待补',teaching:[{label:'教材章节',value:'函数第一章'},{label:'知识点',emptyText:'尚未关联'}],archive:[{label:'编号',value:'host-001'},{label:'来源',value:'真实宿主来源'},{label:'版本',value:'v9'},{label:'可用状态',value:'停用'},{label:'分值',value:0,emptyText:'未提供'}]};
 const answer=render(h(api.QuestionAnalysisDetails,{...details,tab:'answer'}));assert.match(answer,/评分点<\/h4><p[^>]+>评分点待补/);
 const overridden=render(h(api.QuestionAnalysisDetails,{...details,tab:'answer',scoring:null}));assert.doesNotMatch(overridden,/data-class-scoring-points|评分点待补/);
 const teaching=render(h(api.QuestionAnalysisDetails,{...details,tab:'teaching'}));for(const t of ['函数第一章','尚未关联'])assert.ok(teaching.includes(t));assert.doesNotMatch(teaching,/尚未关联教材章节|课程标准/);
 const archive=render(h(api.QuestionAnalysisDetails,{...details,tab:'archive'}));for(const t of ['host-001','真实宿主来源','v9','停用'])assert.ok(archive.includes(t));assert.match(archive,/>分值<\/dt><dd[^>]+>0<\/dd>/);
 const omitted=render(h(api.QuestionAnalysisDetails,{question,related:[],tab:'archive',onTabChange:noop,onKnowledge:noop}));assert.doesNotMatch(omitted,/未提供|来源|版本|可用状态/);
 const populated=render(h(api.QuestionAnalysisCard,{...card,question:api.analysisQuestion,pointsEmptyText:'不应出现'}));assert.doesNotMatch(populated,/不应出现/);
});
test('G2 panel displays each empty state at its own heading and preserves formatted unknown statistics',()=>{
 const props={...api.incompleteAnalysisPanel,onKnowledge:noop,onEvidence:noop};const html=render(h(api.QuestionAnalysisPanel,props));
 assert.match(html,/AI 归纳<\/span><\/h3><p[^>]+>失分原因未提供/);assert.match(html,/关联知识点<\/p><p[^>]+>本题尚未关联知识点/);assert.doesNotMatch(html,/未提供%/);
 const filled=render(h(api.QuestionAnalysisPanel,{...props,...api.analysisPanel}));assert.doesNotMatch(filled,/失分原因未提供|本题尚未关联知识点/);assert.match(filled,/16.7% · 30.6%/);
 const formatted=render(h(api.QuestionAnalysisPanel,{...props,statistics:{...props.statistics,fullRate:'12.5%',zeroRate:'未知'}}));assert.match(formatted,/12.5% · 未知/);assert.doesNotMatch(formatted,/%%|未知%/);
});
test('G2 unknown knowledge rate omits Meter, evidence text has no fabricated unit or count',()=>{
 const props={...api.analysisPanel,onKnowledge:noop,onEvidence:noop,evidenceEmptyText:'证据未提供',knowledge:{topic:'专题',rate:null,rateEmptyText:'得分率未提供',affected:'未提供',volumeText:'证据量待核对',evidence:[]}};
 const html=render(h(api.QuestionAnalysisPanel,props));assert.match(html,/得分率未提供/);assert.doesNotMatch(html,/role="meter"|0%|证据量待核对 分|0 道证据题/);assert.match(html,/证据清单<\/h3><p[^>]+>证据未提供/);
 const zero=render(h(api.QuestionAnalysisPanel,{...props,knowledge:{...props.knowledge,rate:0,evidence:api.analysisEvidence}}));assert.match(zero,/role="meter"/);assert.match(zero,/0%/);assert.doesNotMatch(zero,/得分率未提供|证据未提供/);
});
test('G2 knowledge rail omits unknown bars, keeps zero bars, and renders host empty text in both forms',()=>{
 const props={sections:[{id:'s',label:'专题',items:[{id:'k',name:'知识点',rate:null,rateEmptyText:'未提供',secondary:'证据待补',evidence:[]}]}],onSelect:noop,onEvidence:noop};
 const html=render(h(api.KnowledgeRail,props));assert.match(html,/未提供/);assert.doesNotMatch(html,/bg-foreground|0%/);
 const zero=render(h(api.KnowledgeRail,{...props,sections:[{...props.sections[0],items:[{...props.sections[0].items[0],rate:0}]}]}));assert.match(zero,/0%/);assert.match(zero,/width:0%/);assert.doesNotMatch(zero,/未提供/);
 for(const bodyOnly of [true,false]){const empty=render(h(api.KnowledgeRail,{...props,sections:[{id:'empty',label:'专题',items:[]}],bodyOnly,emptyText:'本卷题目尚未关联知识点'}));assert.match(empty,/本卷题目尚未关联知识点/);assert.doesNotMatch(empty,/没有符合筛选的条目/);}
});
test('G2 QuestionRailClass accepts arbitrary second-line text without computing ratio',()=>{
 const html=render(h(api.QuestionRailClass,{sections:[{id:'s',label:'选择题',layout:'cell',items:[{id:'q',number:1,value:'未提供',tone:'neutral',ariaLabel:'统计未提供',tooltip:'统计未提供'}]}],selected:'q',onSelect:noop,overview:{segments:[],text:'统计待补'}}));assert.match(html,/未提供/);assert.doesNotMatch(html,/未提供%|width:0%/);
});
test('G2 bodyOnly Inspector shares one host scroll region and emits no navigation or action footer',()=>{
 const props={...review.reviewInspectorFixture,bodyOnly:true,onStep(){throw Error('unexpected')},onWrong(){throw Error('unexpected')},points:[],pointsEmptyText:'未提供'};
 const html=render(h(review.QuestionInspector,props));assert.match(html,/本题得分/);assert.match(html,/评分点<\/h3><p[^>]+>未提供/);assert.match(html,/AI 判定依据/);assert.match(html,/班级对比/);assert.doesNotMatch(html,/data-review-inspector|scroll-area|data-slot="frame"|上一题|下一题|更正评分|教师批阅/);
 const combined=render(h(review.QuestionInspectorBodyFixture));assert.equal((combined.match(/data-slot="scroll-area-viewport"/g)||[]).length,1);assert.ok(combined.indexOf('本题分析')<combined.indexOf('当前作答'));assert.doesNotMatch(combined,/更正评分|教师批阅/);
});
for(const name of ['QuestionAnalysisCardDemo','QuestionAnalysisPanelDemo','KnowledgeRailDemo'])test(`G2 ${name} includes incomplete examples in all three narrow themes`,()=>{
 const html=render(h(api[name]));assert.match(html,/数据不全/);for(const theme of ['light','paper','dark'])assert.equal((html.match(new RegExp(`data-prism-theme="${theme}"`,'g'))||[]).length,name==='QuestionAnalysisPanelDemo'?6:2);
 if(name==='QuestionAnalysisPanelDemo')assert.match(html,/自定义影响标签与补充统计/);
});

test('G2 groups correct expansion emits the host include intent; missing text stays opt-in',()=>{
 const calls=[],out=capture(api.QuestionAnalysisGroups,{...handlers,onIncludeCorrect:()=>calls.push('include'),groups:{errors:[],correct:[{id:'b',name:'李同学'}],correctLabel:'答对'}});
 out.nodes.find(n=>n.props['data-correct-group']).props.onOpenChange(true);assert.deepEqual(calls,['include']);
 const props={...api.analysisPanel,reasons:[],related:[],onKnowledge:noop,onEvidence:noop};
 const plain=render(h(api.QuestionAnalysisPanel,props));assert.match(plain,/AI 归纳<\/span><\/h3><ul/);assert.match(plain,/关联知识点<\/p><div/);
 const missing=render(h(api.QuestionAnalysisPanel,{...props,knowledge:{topic:'专题',rateEmptyText:'得分率未提供',affected:'未提供',volumeText:'证据量未提供',evidence:[]}}));assert.doesNotMatch(missing,/role="meter"|0%|0 道证据题/);assert.match(missing,/得分率未提供/);
});
