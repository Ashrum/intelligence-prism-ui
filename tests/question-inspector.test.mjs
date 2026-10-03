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
test('QuestionInspector empty text is opt-in and only shown for the corresponding empty array',()=>{
 const props={...base,points:[],comparison:[],pointsEmptyText:'评分点尚未提供',comparisonEmptyText:'班级数据尚未提供',evidence:'未提供',knowledge:['未提供']};
 const html=render(h(api.QuestionInspector,props));
 assert.match(html,/评分点<\/h3><p class="text-ui-hint text-muted-foreground">评分点尚未提供<\/p>/);
 assert.match(html,/班级对比<\/h3><p class="text-ui-hint text-muted-foreground">班级数据尚未提供<\/p>/);
 assert.match(html,/置信度：未提供/);assert.match(html,/<p class="text-ui-body">未提供<\/p>/);assert.match(html,/data-slot="badge">未提供<\/span>/);
 const populated=render(h(api.QuestionInspector,{...base,pointsEmptyText:props.pointsEmptyText,comparisonEmptyText:props.comparisonEmptyText}));assert.doesNotMatch(populated,/评分点尚未提供|班级数据尚未提供/);
 const omitted=render(h(api.QuestionInspector,{...base,points:[],comparison:[]}));assert.match(omitted,/评分点<\/h3><ul/);assert.match(omitted,/班级对比<\/h3><div/);
});
test('QuestionInspector disabled reasons describe only disabled actions with unique IDs across instances',()=>{
 const actions=[{id:'correct',label:'更正评分',disabled:true,disabledReason:'缺少评分标准'},{id:'review',label:'教师批阅',disabled:true,disabledReason:'尚未开放'},{id:'enabled',label:'可操作',disabledReason:'启用时隐藏原因'},{id:'silent',label:'无原因',disabled:true}];
 const html=render(h('div',null,h(api.QuestionInspector,{...base,actions}),h(api.QuestionInspector,{...base,actions})));
 const descriptions=[...html.matchAll(/aria-describedby="([^"]+)"/g)].map(m=>m[1]);assert.equal(descriptions.length,4);assert.equal(new Set(descriptions).size,4);
 for(const id of descriptions)assert.ok(html.includes(`id="${id}" class="text-ui-hint text-muted-foreground wrap-anywhere"`));
 for(const label of ['更正评分：缺少评分标准','教师批阅：尚未开放'])assert.ok(html.includes(label));assert.doesNotMatch(html,/启用时隐藏原因/);
 for(const label of ['更正评分','教师批阅']){const buttons=[...html.matchAll(new RegExp(`<button([^>]+)>${label}</button>`,'g'))];assert.equal(buttons.length,2);for(const [,attrs] of buttons){assert.match(attrs,/disabled=""/);assert.match(attrs,/aria-describedby=/);assert.match(attrs,/h-9/);assert.match(attrs,/sm:h-8/);}}
 const absent=render(h(api.QuestionInspector,{...base,onIntent:undefined,actions:[{id:'no-handler',label:'教师批阅',disabledReason:'未连接处理器'}]}));assert.match(absent,/教师批阅：未连接处理器/);assert.match(absent,/aria-describedby=/);
 const empty=render(h(api.QuestionInspector,{...base,actions:[{id:'empty',label:'更正',disabled:true,disabledReason:''}]}));assert.doesNotMatch(empty,/aria-describedby=/);assert.match(empty,/<footer class="flex gap-3 border-t p-4">/);
});
test('QuestionInspector incomplete demo supplies empty facts and two disabled explanations in three themes',()=>{
 const html=render(h(api.QuestionInspectorDemo));assert.match(html,/数据不全/);assert.equal((html.match(/更正评分：未提供评分标准/g)||[]).length,3);assert.equal((html.match(/教师批阅：当前作答尚未开放教师批阅/g)||[]).length,3);
});
