import test from 'node:test';
import assert from 'node:assert/strict';
import { api,h,render,capture,assertRoute } from './review-components-harness.mjs';
const base={...api.reviewRailFixture,panelId:'rail-test',selected:'2',filter:'all',onFilterChange(){},onSelect(){},onLocate(){},onPage(){}};
test('QuestionRail renders external percentages, counts and classifications without student-score inference',()=>{
 const html=render(h(api.QuestionRail,base));assert.match(html,/正确率 70%/);assert.match(html,/稳定 2 · 待核对 2/);assert.doesNotMatch(html,/满分|学生得分|零分/);
 assert.equal((html.match(/role="listbox"/g)||[]).length,1);assert.equal((html.match(/data-question-layout="cell"/g)||[]).length,3);assert.equal((html.match(/data-question-layout="row"/g)||[]).length,1);
 const empty=render(h(api.QuestionRail,{...base,sections:[]}));assert.match(empty,/当前筛选没有题目/);assert.match(empty,/全部题目，共 4 题/);
});
test('QuestionRail keyboard follows supplied reordered rows and Enter separates selection from locate',()=>{
 const calls=[];const items=base.sections.flatMap(s=>s.pages.flatMap(p=>p.items)).reverse();
 const props={...base,sections:[{id:'sorted',label:'正确率排序',layout:'row',pages:[{id:'one',items}]}],onSelect:id=>calls.push(['select',id]),onLocate:()=>calls.push(['locate'])};
 const out=capture(api.QuestionRail,props),keydown=out.nodes.find(n=>n.props.role==='listbox').props.onKeyDown;
 const event=(key,target)=>({key,target:target??{closest:()=>null},preventDefault(){},stopPropagation(){}});
 keydown(event('ArrowDown'));assert.deepEqual(calls,[['select','1']]);
 keydown(event('Enter',{closest:selector=>selector==='[data-question-id]'?{dataset:{questionId:'3'}}:null}));assert.deepEqual(calls.slice(-2),[['select','3'],['locate']]);
 keydown({...event('Enter',{closest:selector=>selector==='[data-page-marker]'?{}:null}),preventDefault(){throw Error('page Enter stays native')}});
 assert.equal(capture(api.QuestionRail,props).html,out.html);
});
test('QuestionRail page and filter controls emit exact host identifiers; three-theme fixtures include formula',()=>{
 const calls=[],out=capture(api.QuestionRail,{...base,onPage:id=>calls.push(id),onFilterChange:id=>calls.push(id)});
 out.nodes.find(n=>n.props['aria-label']==='定位第 1 页').props.onClick();out.nodes.find(n=>n.type?.name==='Tabs').props.onValueChange('attention');assert.deepEqual(calls,['a','attention']);
 const html=render(h(api.QuestionRailDemo));for(const theme of ['light','paper','dark'])assert.ok(html.includes(`data-prism-theme="${theme}"`));
 // Tooltip content includes MathML and long Chinese even before its portal opens.
 const row=base.sections[1].pages[0].items[0];assert.match(render(row.tooltip),/<math>/);assert.match(render(row.tooltip),/长中文/);
});
test('QuestionRail catalog route and Agent Spec render',()=>assertRoute(assert,'question-rail','Question Rail'));
