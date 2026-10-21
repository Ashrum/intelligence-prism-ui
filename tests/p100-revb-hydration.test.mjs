import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React, { act } from 'react';
import { renderToString, renderToStaticMarkup } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import postcss from 'postcss';
import { createTestRuntime } from './helpers/test-runtime.mjs';
import { hydrationDOM, domNodes } from './helpers/ssr-hydration-dom.mjs';
const h=React.createElement, root=fileURLToPath(new URL('../',import.meta.url));
const runtime=await createTestRuntime('p100');
async function bundle(name,revision) {
  const entry=revision==='d25e358'
    ? `export * from './components/prism-next/charts/chart-legend'; export * from './components/prism-next/charts/basic-charts';`
    : `export * from './components/prism-next/blueprint/blueprint'; export * from './components/prism-next/demos/blueprint-overview'; export * from './components/prism-next/demos/blueprint-trend'; export * from './components/prism-next/charts/chart-legend'; export * from './components/prism-next/charts/basic-charts'; export {PrismScopeProvider} from './components/prism-next/prism-scope';`;
  const file=new URL(`${name}.mjs`,runtime);
  writeFileSync(file,(await build({stdin:{contents:entry,loader:'tsx',resolveDir:root},bundle:true,jsx:'automatic',platform:'node',format:'esm',packages:'external',alias:{'@':root},write:false,plugins:[{name:'persisted-theme-and-baseline',setup(b){
    b.onResolve({filter:/^next-themes$/},()=>({path:'theme',namespace:'p100'}));
    // Model the real next-themes contract: no localStorage on SSR, saved theme
    // available on the very first client render. Chart hooks are never mocked.
    b.onLoad({filter:/.*/,namespace:'p100'},()=>({contents:'export const useTheme=()=>({theme:globalThis.__p100Theme})'}));
    if(revision) b.onLoad({filter:/\.[cm]?[jt]sx?$/},args=>{
      if(!args.path.startsWith(root)||args.path.includes('/node_modules/')) return;
      return {contents:execFileSync('git',['show',`${revision}:${args.path.slice(root.length)}`],{cwd:root,encoding:'utf8'}),loader:args.path.endsWith('tsx')?'tsx':'ts'};
    });
  }}]})).outputFiles[0].text);
  return import(file);
}
const api=await bundle('current'), baseline=await bundle('baseline','d25e358');
const render=(name,props,children)=>renderToStaticMarkup(h(api[name],props,children));
const css=readFileSync(root+'app/(next)/next/blueprint.css','utf8');
async function hydrate(element,theme,{mutate,check}={}) {
  const keys=['window','document','ResizeObserver','IS_REACT_ACT_ENVIRONMENT','__p100Theme'];
  const previous=Object.fromEntries(keys.map(k=>[k,globalThis[k]]));
  delete globalThis.window;delete globalThis.document;delete globalThis.__p100Theme;
  const html=renderToString(element), dom=hydrationDOM(), host=dom.parse(html,dom.document.createElement('div'));
  mutate?.(host);
  const errors=[],recoverable=[], original=console.error;
  const observers=[];
  Object.assign(globalThis,{window:dom.window,document:dom.document,__p100Theme:theme,IS_REACT_ACT_ENVIRONMENT:true,
    ResizeObserver:class {constructor(cb){observers.push(cb);}observe(){}unobserve(){}disconnect(){}}});
  console.error=(...args)=>errors.push(args.join(' '));
  let mounted;
  try {
    await act(()=>{mounted=hydrateRoot(host,element,{onRecoverableError:e=>recoverable.push(e.message)});});
    await act(()=>observers.forEach(cb=>cb([{contentRect:{width:1280,height:230}}])));
    await check?.(host);
    return {html,errors,recoverable};
  } finally {if(mounted)await act(()=>mounted.unmount());console.error=original;Object.assign(globalThis,previous);}
}
const legendProps={items:[{id:'a',label:'实际得分率',marker:'dot',tone:'chart-1'}]};
for(const theme of ['blueprint','blueprint-night']) {
  test(`P100 pre-P97 d25e358: persisted ${theme} reproduces colour hydration warning`,async()=>{
    const result=await hydrate(h(baseline.ChartLegend,legendProps),theme);
    assert.ok(result.errors.some(s=>/hydrated|hydration/i.test(s)),JSON.stringify(result));
    assert.ok(result.errors.some(s=>/fill|#[\da-f]{6}/i.test(s)));
    assert.match(result.html,/<circle/);assert.match(result.html,/fill="#1E88E5"/);
    assert.equal(result.recoverable.length,0,'legacy colour-only attribute mismatch');
  });
  test(`P100 ${theme}: actual demo TrendChart + category/hatch legend hydrate and adopt saved theme`,async()=>{
    const result=await hydrate(h(api.BlueprintTrendDemo),theme,{check(host){
      const legends=domNodes(host,n=>n.getAttribute?.('data-legend-marker')==='area');
      assert.equal(legends.length,1);assert.equal(legends[0].firstChild.tagName,'RECT');
      assert.equal(legends[0].firstChild.getAttribute('fill'),theme==='blueprint'?'#1D5FBF':'#86C5FF');
      const points=domNodes(host,n=>n.getAttribute?.('data-trend-symbol')==='circle');
      assert.equal(points.length,5);assert.ok(points.every(n=>n.firstChild.tagName==='RECT'));
      assert.equal(domNodes(host,n=>n.getAttribute?.('data-trend-unit')!==null&&n.getAttribute?.('data-trend-unit')!==undefined).length,1);
      const ticks=domNodes(host,n=>n.getAttribute?.('data-trend-tick')!=null);
      assert.equal(ticks.length,6);assert.ok(ticks.every(n=>n.getAttribute('font-family')==='var(--font-mono)'));
      const yAxis=domNodes(host,n=>n.getAttribute?.('class')?.includes('recharts-yAxis-tick-labels'))[0];
      assert.deepEqual(domNodes(yAxis,n=>n.tagName==='TEXT').map(n=>n.textContent),['65','70','75','80']);
      assert.ok(legends[0].parentNode.parentNode.style.visibility !== 'hidden');
      const chart=domNodes(host,n=>n.getAttribute?.('aria-label')==='C0 班级得分率与预期（合成数据）')[0];
      assert.ok(chart.parentNode.style.visibility !== 'hidden');
    }});
    assert.match(result.html,/visibility:hidden/,'reserve chart/legend space until the saved theme is available');
    assert.deepEqual(result.errors,[]);assert.deepEqual(result.recoverable,[]);
  });
}
for(const mutation of ['attribute','shape','text']) test(`P100 hydration harness detects ${mutation} mismatch`,async()=>{
  const result=await hydrate(h(api.PrismScopeProvider,{theme:'light'},h(api.ChartLegend,legendProps)),'light',{mutate(host){
    const circle=domNodes(host,n=>n.tagName==='CIRCLE')[0];
    if(mutation==='attribute')circle.setAttribute('fill','#abcdef');
    if(mutation==='shape'){circle.tagName='RECT';circle.nodeName='RECT';}
    if(mutation==='text')domNodes(host,n=>n.nodeType===3&&n.nodeValue==='实际得分率')[0].nodeValue='错误文字';
  }});
  assert.ok([...result.errors,...result.recoverable].some(s=>/hydrat/i.test(s)));
});
for(const theme of ['light','paper','dark']) test(`P100 explicit ${theme} scope survives saved outer blueprint theme`,async()=>{
  const result=await hydrate(h(api.PrismScopeProvider,{theme},h(api.BlueprintTrendDemo)),'blueprint');
  assert.doesNotMatch(result.html,/visibility:hidden/);assert.deepEqual(result.errors,[]);assert.deepEqual(result.recoverable,[]);
});

const before=await bundle('p99-defaults','5727627');
const row={id:'score',label:'近期得分率',total:100,unit:'%',segments:[{id:'score',label:'得分率',value:74.8,fill:'accent'}]};
for(const [name,props,child] of [
  ['BpStat',{label:'得分率',code:'MET03',value:75,unit:'%',delta:{text:'+1 pp'},caption:'已确认'},'原有明细'],
  ['BpStat',{label:'未知',value:0,state:'unknown',unit:'%',caption:'等待记录'}],
  ['BpStatStrip',{'aria-label':'原有四格'},h('div',null,'指标')],
  ['BpSizeBar',{rows:[row]}],['BpSizeBar',{rows:[row],size:'sm',framed:false,hideRowLabel:true}],
  ['BpTitleBlock',{items:[{id:'a',label:'学生',value:'45 人',numeric:true}]}],
  ['BpCallout',{title:'原结论',action:h('a',{href:'#evidence'},'看依据')},'原依据'],
  ['BpCallout',{title:'强调',emphasis:true},'依据'],
]) test(`P100 ${name}/${props.state??props.size??props.emphasis??'default'}: P99 default SSR bytes unchanged`,()=>{
  assert.equal(render(name,props,child),renderToStaticMarkup(h(before[name],props,child)));
});
function declarations(selector) {
  const values={};postcss.parse(css).walkRules(rule=>{if(rule.selectors.includes(selector))for(const d of rule.nodes)if(d.type==='decl')values[d.prop]=d.value;});return values;
}
test('P100 inline BpStat: semantic size, baseline row, readout tones, and unavailable state',()=>{
  for(const tone of [undefined,'accent','warn','error','muted']) {
    const html=render('BpStat',{layout:'inline',label:'指标',code:'M',value:75,unit:'%',readout:{text:'+1 pp',tone},help:h('button',{'aria-label':'指标说明'},'?')},'明细');
    assert.match(html,/bp-stat-inline/);assert.match(html,/bp-stat-reading-row/);assert.match(html,/text-page-title/);
    assert.match(html,/bp-stat-readout text-ui-meta/);assert.match(html,/aria-label="指标说明"/);
    if(tone)assert.match(html,new RegExp(`data-tone="${tone}"`));
  }
  const html=render('BpStat',{layout:'inline',label:'指标',value:0,state:'insufficient',unit:'%',readout:{text:'不该显示'}},'不该出现的条');
  assert.match(html,/数据不足/);assert.doesNotMatch(html,/bp-stat-unit|bp-stat-readout|不该出现的条|text-page-title/);
  assert.equal(declarations('.bp-stat-reading-row')['align-items'],'baseline');
  assert.equal(declarations('.bp-stat-reading-row')['justify-content'],'space-between');
});
test('P100 xs: 8px/1px bar, marker position/name, no visible row header/summary, meta legend, zero and single segment',()=>{
  const html=render('BpSizeBar',{size:'xs',framed:false,rows:[row],marker:{value:73.4,label:'预期'}});
  assert.match(html,/bp-size-xs/);assert.doesNotMatch(html,/text-item-title/);
  assert.match(html,/aria-label="近期得分率：得分率 74.8%，预期 73.4%"/);
  assert.match(html,/class="bp-size-marker" style="left:73.4%"/);
  assert.match(html,/<span hidden=""/);assert.match(html,/bp-size-legend[^>]*text-ui-meta/);
  assert.equal(declarations('.bp-size-xs .bp-size-bar').height,'8px');
  assert.equal(declarations('.bp-size-xs .bp-size-bar').border,'1px solid var(--line)');
  assert.equal(declarations('.bp-size-xs .bp-size-legend').margin,'0');
  const noLegend=render('BpSizeBar',{size:'xs',rows:[row],legend:false,marker:{value:0,label:'目标'}});
  assert.doesNotMatch(noLegend,/<ul/);assert.match(noLegend,/目标 0%/);assert.match(noLegend,/left:0%/);
  const ratio=render('BpSizeBar',{size:'xs',rows:[{id:'p',label:'关注人数',total:45,segments:[{id:'p',label:'关注',value:10,fill:'warn'}]}]});
  assert.match(ratio,/width:22\.222/);assert.match(ratio,/bp-fill-warn/);
});
test('P100 compact title: six cells + note, 7px/12px padding, nowrap 14px inherited semantic size, container auto columns',()=>{
  const html=render('BpTitleBlock',{density:'compact',items:Array.from({length:6},(_,i)=>({id:String(i),label:'标签',value:String(i)})),note:h('span',null,'次要说明')});
  assert.match(html,/bp-titleblock-compact/);assert.equal((html.match(/<dt>/g)??[]).length,6);
  assert.match(html,/<\/dl><div class="bp-titleblock-note text-ui-meta text-muted-foreground"><span>次要说明/);
  assert.equal(declarations('.bp-titleblock-compact > div').padding,'7px 12px');
  assert.equal(declarations('.bp-titleblock-compact dd')['white-space'],'nowrap');
  assert.equal(declarations('.bp-titleblock dd')['font-size'],'var(--text-ui-body)');
  assert.equal(declarations('.bp-titleblock.bp-titleblock-compact')['grid-template-columns'],'repeat(auto-fit,minmax(110px,1fr))');
});
test('P100 neutral inline callout: title, evidence and action are siblings in one wrapping flow',()=>{
  const html=render('BpCallout',{title:'结论',tone:'neutral',layout:'inline',action:h('a',{href:'#evidence'},'看依据')},'依据句');
  assert.match(html,/bp-callout-neutral bp-callout-inline/);assert.doesNotMatch(html,/mt-1.5|mb-2.5|class="block/);
  assert.match(html,/<b[^>]*>结论<\/b><div[^>]*>依据句<\/div><a[^>]*>看依据<\/a>/);
  assert.equal(declarations('.bp-callout.bp-callout-neutral').background,'transparent');
  assert.equal(declarations('.bp-callout.bp-callout-neutral').border,'1.5px solid var(--line)');
  assert.equal(declarations('.bp-callout.bp-callout-neutral')['border-left-width'],'6px');
  assert.equal(declarations('.bp-callout.bp-callout-inline')['flex-wrap'],'wrap');
});
test('P100 REV B four equal-height stat structures: shared subgrid rows, label/readout/bar/legend, 4/2/1 container rules',()=>{
  const html=render('BlueprintOverviewDemo'),dom=hydrationDOM(),host=dom.parse(html,dom.document.createElement('div'));
  const stats=domNodes(host,n=>n.getAttribute?.('class')?.split(' ').includes('bp-stat-inline'));
  assert.equal(stats.length,4);
  for(const stat of stats) {
    const cls=name=>domNodes(stat,n=>n.getAttribute?.('class')?.split(' ').includes(name));
    for(const name of ['bp-stat-label','bp-stat-reading-row','bp-stat-detail','bp-size-bar','bp-stat-help'])assert.equal(cls(name).length,1,name);
    assert.equal(domNodes(cls('bp-stat-detail')[0],n=>n.tagName==='UL'||n.tagName==='P').length,1,'one legend/caption row');
  }
  assert.equal(declarations('.bp-stat-inline')['grid-template-rows'],'subgrid');
  assert.equal(declarations('.bp-stat-inline')['grid-row'],'span 3');
  assert.equal(declarations('.bp-stat-inline').padding,'12px 16px');
  assert.equal(declarations('.bp-stat-strip:has(> .bp-stat-inline)')['grid-template-columns'],'repeat(4,minmax(0,1fr))');
  let inlineBreakpoint;postcss.parse(css).walkRules(r=>{if(r.selector==='.bp-stat-strip:has(> .bp-stat-inline)'&&r.parent.type==='atrule')inlineBreakpoint=r.parent.params;});
  assert.equal(inlineBreakpoint,'bp-stat-layout (min-width:800px)');
  assert.equal(declarations('.bp-stat-inline > .bp-stat-content').display,'contents');
  const rules=[];postcss.parse(css).walkRules(r=>{if(r.selector==='.bp-stat-strip')rules.push([r.parent.params??'base',r.nodes.find(d=>d.prop==='grid-template-columns')?.value]);});
  assert.deepEqual(rules,[['base','repeat(4,minmax(0,1fr))'],['bp-stat-layout (width < 960px)','repeat(2,minmax(0,1fr))'],['bp-stat-layout (width < 480px)','minmax(0,1fr)']]);
  for(const text of ['75','65','76','10','+1 pp 高于预期','177 / 272','626 / 823','/ 45 人','1,684 / 2,250','2 个知识点 · 按关注规则筛出','按默认学期推算','截止后结果 1 份未纳入']) assert.ok(html.includes(text),text);
  assert.equal(domNodes(host,n=>n.tagName==='DL'&&n.getAttribute('class').includes('bp-titleblock'))[0].childNodes.length,6);
});

test('P100 no ThemeProvider: standalone chart resolves to visible light fallback after hydration',async()=>{
  const result=await hydrate(h(api.ChartLegend,legendProps),undefined,{check(host){
    assert.equal(host.firstChild.style.visibility,'');
    assert.equal(domNodes(host,n=>n.tagName==='CIRCLE')[0].getAttribute('fill'),'#1E88E5');
  }});
  assert.deepEqual(result.errors,[]);assert.deepEqual(result.recoverable,[]);
});
