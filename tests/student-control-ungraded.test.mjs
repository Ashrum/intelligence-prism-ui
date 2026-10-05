import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {api,h,render,capture} from './question-analysis-c2-harness.mjs';

const noop=()=>{};
const unknown={...api.analysisStudents[0],id:'u',name:'未评分同学',examId:'20260003',score:null,ratio:null,scoreText:'未给分',status:'评分未知',review:'待人工批阅',identityTone:'neutral',tickTone:'neutral'};
const zero={...api.analysisStudents[0],id:'z',score:0,ratio:0,scoreText:'0 分',status:'零分',tickTone:'destructive'};
const mixed=[api.analysisStudents[1],unknown,zero,api.analysisStudents[0]];
const props=(items,current=null,onSelect=noop)=>({items,groups:[{value:'宿主原始顺序',items}],current,max:12,open:false,onOpenChange:noop,onSelect,triggerRef:{current:null}});
const switcher=(items,current=null,onSelect=noop)=>capture(api.StudentControlSwitcher,props(items,current,onSelect));
const row=item=>render(switcher([item]).nodes[0].props.renderItem(item));
const barClass=/block h-1 flex-1 overflow-hidden rounded-full bg-muted/;

for(const [name,score,ratio] of [['both unknown',null,null],['unknown score with supplied ratio',null,50],['unknown ratio with known score',6,null]]){
 test(`P14 SSR ${name}: unknown never renders a numeric bar`,()=>{
  const item={...unknown,score,ratio,scoreText:score===null?'未给分':'6 分'};
  const html=row(item);
  assert.doesNotMatch(html,/null|NaN|Infinity/);
  assert.doesNotMatch(html,barClass);
  assert.match(html,new RegExp(item.scoreText));
  if(score===null)assert.doesNotMatch(html,/\/ 12|width:/);
  else assert.match(html,/6 \/ 12/);
  const identity=render(h(api.StudentIdentity,{item}));
  assert.match(identity,new RegExp(item.scoreText));
  assert.doesNotMatch(identity,/null|NaN/);
 });
}
test('P14 scoreText accepts caller ReactNode and known zero still has an empty numeric track',()=>{
 const html=row({...unknown,scoreText:h('span',{'aria-label':'评分待教师提供'},'尚未评分')});
 assert.match(html,/aria-label="评分待教师提供">尚未评分/);
 assert.doesNotMatch(html,/null|NaN|\/ 12/);
 const numeric=row(zero);assert.match(numeric,/0 \/ 12/);assert.match(numeric,/width:0%/);assert.match(numeric,barClass);
});
test('P14 mixed navigation and selection retain the host order including unknown positions',()=>{
 const calls=[],out=switcher(mixed,unknown,id=>calls.push(id)),core=out.nodes[0];
 assert.equal(core.props.items,mixed);assert.equal(core.props.groups[0].items,mixed);assert.equal(core.props.current,1);
 const controls=[];function walk(n){if(!n||typeof n!=='object')return;if(n.props){controls.push(n);const c=n.props.children;for(const child of Array.isArray(c)?c:[c])walk(child);walk(n.props.render)}}walk(core.props.navigation);
 controls.find(n=>n.props['aria-label']==='上一位学生').props.onClick();
 controls.find(n=>n.props['aria-label']==='下一位学生').props.onClick();
 core.props.onSelect(1);assert.deepEqual(calls,['b','z','u']);
 assert.match(out.html,/当前第 2 \/ 4 位/);assert.doesNotMatch(out.html,/null|NaN/);
 assert.equal(core.props.itemToStringLabel(unknown),'未评分同学 20260003 u');
 assert.equal(core.props.itemToStringValue(unknown),'u');
 assert.match(render(core.props.footer),/↑ ↓.*Enter.*Esc/);
 assert.deepEqual(mixed.map(i=>i.score),[12,null,0,6]);
});
test('P14 externally filtered unknown-only and empty sets keep stable navigation',()=>{
 for(const items of [[unknown],[]]){
  const out=switcher(items,items[0]??null);
  const buttons=[...out.html.matchAll(/<button\b[^>]*>/g)].map(m=>m[0]);
  for(const label of ['上一位学生','下一位学生'])assert.match(buttons.find(tag=>tag.includes(`aria-label="${label}"`)),/disabled=""/);
  assert.equal(out.nodes[0].props.items,items);
  assert.doesNotMatch(out.html,/null|NaN/);
 }
 const calls=[],out=capture(api.StudentControlFilters,{value:'unknown',onValueChange:v=>calls.push(v),items:[{value:'unknown',label:'未给分',count:1},{value:'known',label:'已给分',count:3}]});
 out.nodes[0].props.onValueChange('known');assert.deepEqual(calls,['known']);assert.match(out.html,/未给分/);
});
test('P14 ticks use external order, copy and tones and preserve ungraded selection intents',()=>{
 const calls=[],out=capture(api.StudentControlScale,{items:mixed.map(i=>({id:i.id,tone:i.tickTone,tooltip:`${i.name} · ${i.scoreText}`})),selected:'u',summary:'4 位学生：未给分 1，已给分 3',onSelect:id=>calls.push(id)});
 const ticks=out.nodes.filter(n=>n.props['data-student-tick']);
 assert.deepEqual(ticks.map(n=>n.props['data-student-tick']),['b','u','z','a']);
 assert.match(ticks[1].props.className,/h-2 bg-info/);ticks[1].props.onClick();assert.deepEqual(calls,['u']);
 assert.match(out.html,/未给分 1，已给分 3/);assert.doesNotMatch(out.html,/null|NaN/);
});
test('P14 known-score fixture, original demo, switcher and rows retain main bytes',async()=>{
 const before=JSON.parse(await readFile(new URL('./fixtures/student-control-graded-before.json',import.meta.url),'utf8'));
 const out=switcher(api.analysisStudents,api.analysisStudents[0]);
 const actual={fixture:render(h(api.StudentControlBarFixture)),demo:render(h(api.StudentControlBarGradedDemo)),switcher:out.html,rows:api.analysisStudents.map(i=>render(out.nodes[0].props.renderItem(i)))};
 for(const [name,html] of Object.entries(actual)){
  const digest=value=>createHash('sha256').update(value).digest('hex');
  assert.deepEqual(Array.isArray(html)?html.map(digest):digest(html),before[name],name);
 }
});
test('P14 mixed demo includes unknown copy, all themes, narrow containers and math',()=>{
 const html=render(h(api.StudentControlBarDemo));
 for(const theme of ['light','paper','dark'])assert.equal((html.match(new RegExp(`data-prism-theme="${theme}"`,'g'))||[]).length,2);
 for(const text of ['含未给分学生','未给分','已给分','无匹配','320px','长中文','<math>'])assert.ok(html.includes(text),text);
 assert.doesNotMatch(html,/null|NaN/);
});
