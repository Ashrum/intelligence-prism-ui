import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {api,h,render,capture} from './question-analysis-c2-harness.mjs';
const draw=props=>render(h(api.QuestionAnalysisPanel,{layout:'compact',...props}));
const compact=props=>capture(api.QuestionAnalysisPanelCompact,{layout:'compact',...props});
function notes(props){const out=compact(props),popup=out.nodes.find(n=>n.type?.name==='PopoverPopup');return popup?render(popup.props.children[1]):'';}
const noop=()=>{};

test('P23 detailed default and explicit detailed preserve six pre-edit SSR snapshots byte for byte',async()=>{
 const base={...api.analysisPanel,onKnowledge:noop,onEvidence:noop};
 const cases=[base,{...base,kind:'选择题'},{...base,kind:'填空题',errorAnswers:[{text:'A',count:2}]},{...base,knowledge:{topic:'专题',rate:42,affected:21,volumeText:'12 分 · 1 道证据题',evidence:api.analysisEvidence}},{...base,supplementaryMetrics:[{label:'错误影响',value:0,hint:'宿主口径'}]},{...base,knowledge:{topic:'专题',rate:null,rateEmptyText:'未提供',affected:'未提供',volumeText:'未提供',evidence:[]}}];
 const before=JSON.parse(await readFile(new URL('./fixtures/question-analysis-detailed.json',import.meta.url),'utf8'));
 for(const [i,props] of cases.entries()){assert.equal(render(h(api.QuestionAnalysisPanel,props)),before[i]);assert.equal(render(h(api.QuestionAnalysisPanel,{...props,layout:'detailed'})),before[i]);}
});
test('P23 absent blocks and notes do not leave placeholder triggers; null metrics display explicitly',()=>{
 const html=draw(api.compactMissing);assert.doesNotMatch(html,/结论|参照|说明|popover-trigger|alert/);assert.equal((html.match(/未提供/g)||[]).length,3);assert.match(html,/0 人/);assert.equal((html.match(/role="meter"/g)||[]).length,1);
 const empty=draw({});assert.doesNotMatch(empty,/data-analysis-metrics|data-analysis-comparison|collapsible|popover/);
});
test('P23 first layer has at most three metrics; overflow and legacy statistics move into notes once',()=>{
 const props={keyMetrics:[{id:'mean',label:'平均分',value:'主平均'},{id:'d',label:'区分度',value:'主区分'},{id:'external',label:'错误率',value:'主错误'},{id:'extra',label:'额外关键数',value:7}],statistics:{mean:'旧平均',sd:'标准差数值',d:'旧区分',discrimination:'良好',fullRate:null,zeroRate:0},max:10,supplementaryMetrics:[{label:'错误率',value:'旧错误'},{label:'补充独有',value:'独有值',hint:'口径'}]};
 const html=draw(props),detail=notes(props);
 assert.equal((html.match(/<dt/g)||[]).length,3);assert.doesNotMatch(html,/标准差数值|额外关键数|独有值|旧平均|旧区分|旧错误/);
 for(const text of ['标准差数值','额外关键数','独有值','口径','未提供','0%'])assert.ok(detail.includes(text));
 assert.doesNotMatch(detail,/主平均|主区分|主错误|旧平均|旧区分|旧错误|良好/);assert.match(html,/满分 10/);assert.match(html,/良好/);
});
test('P23 explicit supplementary id matches renamed key metric and all overflow adopted metrics appear once',()=>{
 const props={keyMetrics:[{id:'a',label:'甲',value:1},{id:'b',label:'乙',value:2},{id:'c',label:'丙',value:3},{id:'evidence',label:'证据',value:'关键事实'}],supplementaryMetrics:[{id:'evidence',label:'证据强度',value:'旧事实',hint:'保留口径'}]};
 assert.equal((notes(props).match(/关键事实/g)||[]).length,1);assert.match(notes(props),/保留口径/);assert.doesNotMatch(notes(props),/旧事实/);
});
test('P23 distribution correct option is text marked and named, with zero and unknown counts distinct',()=>{
 const html=draw(api.compactChoice);assert.match(html,/C<span[^>]+>正确/);assert.match(html,/aria-label="C（正确选项）：4 人"/);assert.match(html,/bg-success/);assert.match(html,/绿色为正确选项/);assert.match(html,/未作答 0 人/);assert.equal((html.match(/role="meter"/g)||[]).length,5);
 const missing=draw({distribution:{kind:'options',title:'选项',options:[{id:'x',label:'未知',count:null},{id:'z',label:'零',count:0}]}});assert.match(missing,/未知/);assert.match(missing,/未提供/);assert.equal((missing.match(/role="meter"/g)||[]).length,1);
 const segments=draw(api.compactWritten);assert.match(segments,/data-segmented-bar/);assert.match(segments,/aria-label="得分分布；满分 0 人/);assert.match(segments,/得分分布：图例/);
});
test('P23 comparison rows preserve supplied order, signs, centered directions, null and zero without fake bars',()=>{
 const props={comparisons:{title:'对比',unit:'百分点',maxVisible:4,items:[{id:'neg',label:'负项',value:-2},{id:'pos',label:'正项',value:4},{id:'zero',label:'零项',value:0},{id:'null',label:'缺项',value:null},{id:'rest',label:'其他',value:3,source:'外部来源',date:'昨日'}]}};
 const html=draw(props);assert.equal((html.match(/data-analysis-comparison=/g)||[]).length,4);assert.equal((html.match(/data-direction=/g)||[]).length,2);
 assert.match(html,/data-direction="negative"[^>]+right:50%;width:25%/);assert.match(html,/data-direction="positive"[^>]+left:50%;width:50%/);assert.match(html,/aria-label="正项：\+4 百分点"/);assert.match(html,/aria-label="缺项：未提供"/);assert.match(html,/另有 1 个参照/);assert.doesNotMatch(html,/外部来源|昨日/);assert.match(notes(props),/其他：\+3 百分点/);
 assert.ok(html.indexOf('data-analysis-comparison="neg"')<html.indexOf('data-analysis-comparison="pos"'));
});
test('P23 defaults to three references, metadata appears only in notes and explicit zero hides every row',()=>{
 const props=api.compactChoice,html=draw(props),detail=notes(props);assert.equal((html.match(/data-analysis-comparison=/g)||[]).length,3);assert.match(html,/另有 3 个参照/);assert.doesNotMatch(html,/2026-09-22|本班第 2 次检测/);assert.match(detail,/本班第 2 次检测/);assert.match(detail,/2026-09-22/);assert.doesNotMatch(detail,/本班上次：/);
 const zero={comparisons:{...props.comparisons,maxVisible:0}};assert.doesNotMatch(draw(zero),/data-analysis-comparison=/);assert.match(draw(zero),/另有 6 个参照/);assert.match(notes(zero),/本班上次：-57.8/);
});
test('P23 causes cap at four, respect a lower host limit and disclose overflow with native button semantics',()=>{
 const items=Array.from({length:6},(_,i)=>({id:`c${i}`,label:`错因${i}`,count:i}));
 for(const [limit,expected] of [[undefined,4],[2,2],[99,4],[0,0],[-1,4]]){
  const html=draw({causes:{title:'错因',items,maxVisible:limit}});assert.equal((html.match(/data-analysis-count=/g)||[]).length,expected);assert.match(html,/aria-expanded="false"/);assert.match(html,/data-slot="collapsible-trigger"/);assert.doesNotMatch(html,new RegExp(`错因${expected}<`));
 }
});
test('P23 disclosure and notes triggers use coss button keyboard semantics, content stays collapsed by default',()=>{
 const html=draw(api.compactWritten);assert.match(html,/<button[^>]*data-slot="popover-trigger"[^>]*aria-haspopup="dialog"/);assert.match(html,/<button[^>]*data-slot="collapsible-trigger"[^>]*aria-expanded="false"/);assert.match(html,/常见错误作答/);assert.match(html,/4 组/);assert.doesNotMatch(html,/组 1 · 18/);
 const out=compact(api.compactWritten),node=out.nodes.find(n=>n.type?.name==='Disclosure'),collapsed=capture(node.type,node.props);
 const root=collapsed.nodes[0];assert.equal(root.props.open,false);assert.equal(typeof root.props.onOpenChange,'function');assert.equal(typeof root.props.onKeyDown,'function');
 const sourcePromise=readFile(new URL('../components/prism-next/question-analysis-panel-compact.tsx',import.meta.url),'utf8');return sourcePromise.then(source=>{assert.match(source,/event.key==='Escape'/);assert.match(source,/trigger.current\?\.focus\(\)/);assert.match(source,/portalProps=\{\{container:root\}\}/);assert.match(source,/motion-reduce:transition-none/);assert.doesNotMatch(source,/finalFocus=\{false\}|initialFocus=\{false\}/);});
});
test('P23 slots are available across question kinds and render after disclosures in documented order',()=>{
 const props={kind:'选择题',distributionSlot:h('p',{},'图表插槽'),disclosures:[{id:'x',label:'可展开',content:'正文'}],errorAnswersSlot:h('p',{},'错误插槽'),related:[{id:'k',name:'关联条目'}],onKnowledge:noop,actions:h('button',{},'动作插槽')};
 const html=draw(props);const order=['图表插槽','可展开','错误插槽','关联条目','动作插槽'].map(text=>html.indexOf(text));assert.ok(order.every((n,i)=>n>=0&&(i===0||n>order[i-1])));
 const out=compact(props),button=out.nodes.find(n=>n.props.onClick);let selected;button.props.onClick();const withHandler=compact({...props,onKnowledge:id=>selected=id});withHandler.nodes.find(n=>n.props.onClick).props.onClick();assert.equal(selected,'k');
 assert.doesNotMatch(draw({errorAnswersSlot:null,errorAnswers:[{text:'旧错误',count:3}]}),/旧错误/);
});
test('P23 compact three fixtures include all themes, narrow containers, long Chinese and math',()=>{
 const html=render(h(api.QuestionAnalysisCompactDemo));for(const theme of ['light','paper','dark'])assert.equal((html.match(new RegExp(`data-prism-theme="${theme}"`,'g'))||[]).length,3);assert.match(html,/320px/);
 const out=compact(api.compactWritten),disclosure=out.nodes.find(n=>n.type?.name==='Disclosure');const expandedContent=render(disclosure.props.children);assert.match(expandedContent,/完整逻辑联系/);assert.match(expandedContent,/<math/);
});

test('P23 disclosure Escape closes expanded content and restores its own trigger; nested consumed keys remain untouched',async()=>{
 const {build}=await import('esbuild');const {mkdir,writeFile,rm}=await import('node:fs/promises');const {fileURLToPath}=await import('node:url');
 const root=fileURLToPath(new URL('../',import.meta.url)),file=new URL(`../.sites-runtime/p23-keyboard-${process.pid}/bundle.mjs`,import.meta.url);
 await mkdir(new URL('.',file),{recursive:true});
 const result=await build({stdin:{contents:"export {Disclosure} from './components/prism-next/question-analysis-panel-compact';",resolveDir:root,loader:'tsx'},plugins:[{name:'p23-disclosure-hooks',setup(builder){builder.onLoad({filter:/question-analysis-panel-compact\.tsx$/},async({path})=>{
  let contents=await readFile(path,'utf8');
  // Exercise the actual event handler/state transition; replace only transient hooks, never handler logic.
  contents=contents.replace("import {useRef, useState, type ReactNode} from 'react'",`import type {ReactNode} from 'react'
const useState=(initial:any):any=>{const s=(globalThis as any).__p23Keys;const i=s.cursor++;if(!(i in s.values))s.values[i]=initial;return [s.values[i],(next:any)=>{s.values[i]=next}]}
const useRef=(initial:any):any=>{const [ref]=useState({current:initial});return ref}`);
  return {contents:contents+'\nexport {Disclosure};',loader:'tsx'};
 })}}],bundle:true,jsx:'automatic',platform:'node',format:'esm',packages:'external',alias:{'@':root},loader:{'.css':'empty'},write:false});
 await writeFile(file,result.outputFiles[0].text);const {Disclosure}=await import(file);await rm(file);
 globalThis.__p23Keys={cursor:0,values:[]};
 const inspect=()=>{globalThis.__p23Keys.cursor=0;return capture(Disclosure,{label:'展开正文',children:'可访问的内容'})};
 let out=inspect(),element=out.nodes[0];assert.equal(element.props.open,false);element.props.onOpenChange(true);
 out=inspect();element=out.nodes[0];assert.equal(element.props.open,true);assert.match(out.html,/可访问的内容/);assert.match(out.html,/aria-expanded="true"/);
 let focused=0,prevented=0,stopped=0;out.nodes.find(n=>n.type?.name==='CollapsibleTrigger').props.ref.current={focus(){focused++}};
 const key=(key,defaultPrevented=false)=>({key,defaultPrevented,preventDefault(){prevented++},stopPropagation(){stopped++}});
 element.props.onKeyDown(key('Enter'));assert.equal(inspect().nodes[0].props.open,true);
 element.props.onKeyDown(key('Escape',true));assert.equal(inspect().nodes[0].props.open,true);assert.equal(focused,0);
 element.props.onKeyDown(key('Escape'));out=inspect();assert.equal(out.nodes[0].props.open,false);assert.equal(focused,1);assert.equal(prevented,1);assert.equal(stopped,1);assert.doesNotMatch(out.html,/可访问的内容/);
 out.nodes[0].props.onKeyDown(key('Escape'));assert.equal(focused,1);delete globalThis.__p23Keys;
});
