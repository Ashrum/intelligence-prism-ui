import test from 'node:test';
import assert from 'node:assert/strict';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { api,h } from './p58-chart-harness.mjs';
import { clientDOM } from './helpers/chart-client-dom.mjs';

const nodes=(host,predicate)=>{const all=[];function walk(n){if(predicate(n))all.push(n);n.childNodes?.forEach(walk)}walk(host);return all};
// Width approximation matches the fixed chart font; CSS/font rasterization stays with Supervisor.
const widthOf=text=>Array.from(text).reduce((sum,c)=>sum+(/[\u0000-\u00ff]/.test(c)?7.44:12),0);
for(const theme of ['light','paper','dark'])test(`P60 ${theme}: real Recharts keeps two-line endpoint ticks inside 800/320/1440 SVG and restores full labels`,async()=>{
 const previous={window:globalThis.window,document:globalThis.document,ResizeObserver:globalThis.ResizeObserver,act:globalThis.IS_REACT_ACT_ENVIRONMENT};
 const errors=[],originalError=console.error;console.error=(...args)=>errors.push(args.join(' '));
 try{
  globalThis.IS_REACT_ACT_ENVIRONMENT=true;globalThis.__p58Theme=theme;
  const observers=[];
  globalThis.ResizeObserver=class{constructor(callback){this.callback=callback;observers.push(this)}observe(){}unobserve(){}disconnect(){}};
  const dom=clientDOM(800,320);globalThis.window=dom.window;globalThis.document=dom.document;
  const host=dom.document.createElement('div'),client=createRoot(host);
  try{
   const props={label:'班级得分率与预期',series:api.learningTrendSeries,height:320,unit:'%',xTickMode:'all',yDomain:'auto'};
   await act(()=>client.render(h(api.TrendChart,props)));
   for(const width of [800,320,1440,800]){
    dom.resize(width,320);await act(()=>{for(const o of observers)o.callback([{contentRect:{width,height:320}}])});
    const ticks=nodes(host,n=>n.attributes?.['data-trend-tick']);assert.equal(ticks.length,6);
    const right=ticks.find(n=>n.attributes['data-trend-tick']==='week-7');
    for(const tick of ticks){
     const rows=nodes(tick,n=>n.tagName==='TSPAN');assert.equal(rows.length,2);
     for(const row of rows){const x=+row.attributes.x,half=widthOf(row.textContent)/2;assert.ok(x-half>=0&&x+half<=width,`${width}: ${row.textContent} extends outside ${x}`);}
     assert.equal(tick.attributes['font-size'],'12');
    }
    assert.equal(nodes(right,n=>n.tagName==='TITLE')[0].textContent,'第 8 周 · 数学检测');
    const lastRows=nodes(right,n=>n.tagName==='TSPAN').map(n=>n.textContent);
    if(width>=800)assert.deepEqual(lastRows,['第 8 周','数学检测']);else assert.ok(lastRows.some(text=>text.includes('…')));
    const legendText=nodes(host,n=>n.attributes?.class==='text-ui-hint text-foreground');assert.ok(legendText.some(n=>n.textContent==='实际得分率'));assert.ok(legendText.some(n=>n.textContent==='新情境检测'));
   }
   // Same display labels remain separate categories; extremely long rows cannot become a third line.
   const series=[{id:'a',label:'重复标签',data:[{id:'one',label:'同名',tickLabel:['长中文与公式 x² + y² = 1'.repeat(4),'起点检测'],value:60},{id:'two',label:'同名',tickLabel:['第 8 周','完整的期末数学检测名称'.repeat(4)],value:70}]}];
   await act(()=>client.render(h(api.TrendChart,{...props,series})));
   const ticks=nodes(host,n=>n.attributes?.['data-trend-tick']);assert.equal(ticks.length,2);assert.ok(+ticks[0].attributes.x<+ticks[1].attributes.x);
   assert.ok(ticks.every(t=>nodes(t,n=>n.tagName==='TSPAN').length===2));
   for(const tick of ticks)for(const row of nodes(tick,n=>n.tagName==='TSPAN')){const x=+row.attributes.x,half=widthOf(row.textContent)/2;assert.ok(x-half>=0&&x+half<=800,'long rows at both endpoints must fit');}
   assert.ok(nodes(ticks[1],n=>n.tagName==='TITLE')[0].textContent.includes('完整的期末数学检测名称'));
   // all without tickLabel keeps every single-row category; default auto remains Recharts-managed.
   await act(()=>client.render(h(api.TrendChart,{...props,series:[{...series[0],data:series[0].data.map(({tickLabel,...p})=>p)}]})));
   assert.equal(nodes(host,n=>n.attributes?.['data-trend-tick']).length,2);
   assert.ok(nodes(host,n=>n.attributes?.['data-trend-tick']).every(t=>nodes(t,n=>n.tagName==='TSPAN').length===1));
  }finally{await act(()=>client.unmount())}
  assert.deepEqual(errors,[]);
 }finally{console.error=originalError;globalThis.window=previous.window;globalThis.document=previous.document;globalThis.ResizeObserver=previous.ResizeObserver;globalThis.IS_REACT_ACT_ENVIRONMENT=previous.act;delete globalThis.__p58Theme}
});
