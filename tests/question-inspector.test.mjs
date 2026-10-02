import test from 'node:test';
import assert from 'node:assert/strict';
import { api,h,render,capture,assertRoute } from './review-components-harness.mjs';
const base={...api.reviewInspectorFixture,onStep(){},onWrong(){},onIntent(){}};
test('QuestionInspector renders supplied score, judgments, points and unknown confidence',()=>{
 const html=render(h(api.QuestionInspector,base));for(const text of ['置信度：未提供','需核对','4/4','2/8','47%','2 / 36'])assert.ok(html.includes(text),text);
 assert.equal((html.match(/data-ai-source/g)||[]).length,1);assert.equal((html.match(/class="text-score-display"/g)||[]).length,1);assert.match(html,/<math>/);
 const unknown=render(h(api.QuestionInspector,{...base,score:{...base.score,value:null,text:'未提供',judgement:'待核对'},comparison:[]}));assert.doesNotMatch(unknown,/role="meter"/);assert.match(unknown,/未提供/);
});
test('QuestionInspector actions emit IDs without changing facts; disabled and missing handlers stay disabled',()=>{
 const calls=[],props={...base,onIntent:id=>calls.push(id)};const out=capture(api.QuestionInspector,props);
 const actions=out.nodes.filter(n=>n.props.className==='flex-1');actions.forEach(n=>n.props.onClick());assert.deepEqual(calls,['correct','review']);assert.equal(capture(api.QuestionInspector,props).html,out.html);
 const disabled=capture(api.QuestionInspector,{...props,actions:[{id:'locked',label:'锁定',primary:true,disabled:true}]}).nodes.find(n=>n.props.className==='flex-1');assert.equal(disabled.props.disabled,true);disabled.props.onClick();assert.equal(calls.length,2);
 const absent=capture(api.QuestionInspector,{...base,onIntent:undefined});assert.ok(absent.nodes.filter(n=>n.props.className==='flex-1').every(n=>n.props.disabled));
});
test('QuestionInspector supports external navigation boundaries, extra links and three themes',()=>{
 const calls=[],out=capture(api.QuestionInspector,{...base,onStep:delta=>calls.push(delta),onWrong:()=>calls.push('wrong'),extraLink:h('a',{href:'/class'},'查看全班')});
 assert.equal(out.nodes.find(n=>n.props['aria-label']==='下一题').props.disabled,true);out.nodes.find(n=>n.props['aria-label']==='上一题').props.onClick();out.nodes.find(n=>n.props['aria-label']==='下一道错题').props.onClick();assert.deepEqual(calls,[-1,'wrong']);assert.match(out.html,/href="\/class"/);
 const html=render(h(api.QuestionInspectorDemo));for(const theme of ['light','paper','dark'])assert.ok(html.includes(`data-prism-theme="${theme}"`));
});
test('QuestionInspector route and Agent Spec render',()=>assertRoute(assert,'question-inspector','Question Inspector'));
