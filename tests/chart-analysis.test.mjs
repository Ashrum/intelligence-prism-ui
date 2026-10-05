import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {api,h,render,legacySnapshots,panelProps,chartProps} from './chart-analysis-harness.mjs';
import {comparisonDomain,comparisonReferencePosition as position,comparisonReferenceSegment as segment} from '../lib/prism-next/comparison-reference.ts';
const before=JSON.parse(await readFile(new URL('./fixtures/chart-analysis-before.json',import.meta.url),'utf8'));
const current=legacySnapshots();
for(const [name,html] of Object.entries(before))test(`P20 default SSR matches main bytes: ${name}`,()=>assert.equal(current[name],html));
const bins=Array.from({length:10},(_,i)=>({id:String(i),label:`${i*10}–<${(i+1)*10}`,value:i,range:[i*10,(i+1)*10]}));
test('P20 reference numeric boundaries, negative domains, invalid and out-of-domain values',()=>{
 for(const [value,expected] of [[-20,0],[0,.2],[30,.5],[80,1],[-21,null],[81,null],[NaN,null],[Infinity,null]])assert.equal(position(value,[],[-20,80]),expected);
 assert.equal(position(1,[],[1,1]),null);assert.equal(position(1,[],[2,0]),null);
 assert.deepEqual(comparisonDomain([{value:0},{value:null}]),[0,1]);assert.deepEqual(comparisonDomain([{value:NaN},{value:-5},{value:20}]),[-5,20]);assert.deepEqual(comparisonDomain([]),[0,1]);assert.deepEqual(comparisonDomain([{value:90}],[-20,60]),[-20,60]);assert.deepEqual(comparisonDomain([{value:90}],[NaN,60]),[0,90]);
});
test('P20 score-band boundary and internal interpolation are explicit, final upper bound included',()=>{
 for(const [value,expected] of [[0,0],[60,.6],[65,.65],[85,.85],[90,.9],[100,1],[-1,null],[101,null]])assert.equal(position(value,bins,[0,10]),expected);
 const uneven=[{value:1,range:[0,20]},{value:1,range:[20,100]}];assert.equal(position(20,uneven,[0,1]),.5);assert.equal(position(60,uneven,[0,1]),.75);
});
test('P20 malformed, overlapping, partial and gapped ranges never fall back to the frequency axis',()=>{
 for(const data of [[{value:2,range:[5,1]}],[{value:2,range:[0,NaN]}],[{value:2,range:[0,10]},{value:2}], [{value:2,range:[0,10]},{value:2,range:[9,20]}], [{value:2,range:[20,30]},{value:2,range:[0,10]}]])assert.equal(position(2,data,[0,10]),null);
 const gaps=[{value:2,range:[0,10]},{value:3,range:[20,30]}];assert.equal(position(15,gaps,[0,10]),null);assert.equal(position(10,gaps,[0,10]),null);assert.equal(position(20,gaps,[0,10]),.5);
});
test('P20 plot geometry follows axis orientation, actual plot offset and resize',()=>{
 for(const plot of [{x:45,y:12,width:239,height:212},{x:110,y:12,width:1074,height:400}]){
  assert.deepEqual(segment(.6,plot,true,false),{x1:plot.x+.6*plot.width,x2:plot.x+.6*plot.width,y1:12,y2:12+plot.height});
  assert.deepEqual(segment(.6,plot,false,true),segment(.6,plot,true,false));
  assert.deepEqual(segment(.6,plot,false,false),{x1:plot.x,x2:plot.x+plot.width,y1:12+.4*plot.height,y2:12+.4*plot.height});
  assert.deepEqual(segment(.6,plot,true,true),{x1:plot.x,x2:plot.x+plot.width,y1:12+.6*plot.height,y2:12+.6*plot.height});
 }
});
test('P20 reference labels, description and table preserve same-value lines and omit invalid values',()=>{
 const html=render(h(api.ComparisonChart,{...chartProps,domain:[0,100],referenceLines:[{value:60,label:'及格线',tone:'warning'},{value:60,label:'同值目标线',tone:'info'},{value:101,label:'域外不能出现'},{value:NaN,label:'非法不能出现'}]}));
 assert.match(html,/aria-description="参考线；及格线：60分；同值目标线：60分"/);
 assert.match(html,/aria-label="参考线标签"/);assert.match(html,/overflow-wrap:anywhere/);
 const table=html.slice(html.indexOf('aria-label="参考线数据"'));assert.match(table,/及格线/);assert.match(table,/同值目标线/);assert.equal((table.match(/60分/g)||[]).length,2);assert.doesNotMatch(table,/<button/);
 assert.doesNotMatch(html,/域外不能出现|非法不能出现/);
 assert.equal(render(h(api.ComparisonChart,{...chartProps,referenceLines:[]})),render(h(api.ComparisonChart,chartProps)));
 assert.equal(render(h(api.ComparisonChart,{...chartProps,referenceLines:[{value:900,label:'域外'}]})),render(h(api.ComparisonChart,chartProps)));
});
test('P20 score references use range values, never frequency units or label parsing',()=>{
 const html=render(h(api.ComparisonChart,{label:'人数分布',data:bins,unit:'人',horizontal:false,referenceLines:[{value:60,label:'及格线'},{value:85,label:'优秀线'},{value:90,label:'目标线'}]}));
 assert.match(html,/参考线；及格线：60；优秀线：85；目标线：90/);assert.doesNotMatch(html,/60人|85人|90人/);assert.match(html,/分段轴数值/);
 const unbinned=render(h(api.ComparisonChart,{label:'普通类别',data:[{id:'a',label:'60–<70',value:5}],referenceLines:[{value:60,label:'不猜分数'}]}));assert.doesNotMatch(unbinned,/不猜分数/);
});
test('P20 supplementary statistics append in order with rich values, zero and hint semantics',()=>{
 const metrics=[{label:'处理',value:'待核对'},{label:'错误影响',value:0},{label:'证据强度',value:h('strong',{},'未提供'),hint:h('math',{},h('mi',{},'x'))},{label:'与本校差距',value:'−2.3 个百分点',hint:'长中文口径说明'}];
 const html=render(h(api.QuestionAnalysisPanel,{...panelProps,supplementaryMetrics:metrics}));
 const dl=html.slice(html.indexOf('<dl'),html.indexOf('</dl>'));
 assert.equal((dl.match(/<dt /g)||[]).length,8);assert.ok(dl.indexOf('满分率 · 零分率')<dl.indexOf('处理'));assert.ok(dl.indexOf('处理')<dl.indexOf('错误影响'));assert.match(dl,/错误影响<\/dt><dd>0<\/dd>/);assert.match(dl,/<strong>未提供<\/strong>/);assert.match(dl,/text-ui-hint text-muted-foreground"><math>/);assert.match(dl,/whitespace-normal break-words/);
 assert.equal(render(h(api.QuestionAnalysisPanel,{...panelProps,supplementaryMetrics:[]})),render(h(api.QuestionAnalysisPanel,panelProps)));
});
test('P20 knowledge custom affectedLabel and supplementary metrics follow existing knowledge metrics',()=>{
 const knowledge={topic:'专题',rate:42,affected:21,volumeText:'12 分 · 1 道证据题',status:'继续观察',evidence:[]};
 const html=render(h(api.QuestionAnalysisPanel,{...panelProps,knowledge,affectedLabel:'错误影响',supplementaryMetrics:[{label:'处理',value:'待核对'}]}));
 assert.match(html,/错误影响 21 \/ 36 名学生/);assert.doesNotMatch(html,/受影响/);
 assert.ok(html.indexOf('12 分 · 1 道证据题')<html.indexOf('data-supplementary-statistics'));assert.ok(html.indexOf('data-supplementary-statistics')<html.indexOf('继续观察'));
 assert.equal(render(h(api.QuestionAnalysisPanel,{...panelProps,knowledge,affectedLabel:undefined,supplementaryMetrics:undefined})),render(h(api.QuestionAnalysisPanel,{...panelProps,knowledge})));
});
