import test from 'node:test';
import assert from 'node:assert/strict';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { api, h } from './p58-chart-harness.mjs';
import { clientDOM } from './helpers/chart-client-dom.mjs';

const nodes=(host,predicate)=>{const all=[];function walk(n){if(predicate(n))all.push(n);n.childNodes?.forEach(walk)}walk(host);return all};
test('P58 real Recharts commits shape/dash/gap geometry and responsive labels without CSS/browser claims',async()=>{
 const previous={window:globalThis.window,document:globalThis.document,ResizeObserver:globalThis.ResizeObserver,act:globalThis.IS_REACT_ACT_ENVIRONMENT};
 const errors=[],originalError=console.error;console.error=(...args)=>errors.push(args.join(' '));
 try{
  globalThis.IS_REACT_ACT_ENVIRONMENT=true;
  let observers=[];
  globalThis.ResizeObserver=class{constructor(callback){this.callback=callback;observers.push(this)}observe(node){this.node=node}unobserve(){}disconnect(){}};
  const dom=clientDOM(960,320);globalThis.window=dom.window;globalThis.document=dom.document;
  const host=dom.document.createElement('div'),client=createRoot(host);
  try{
   const props={label:'班级得分率与预期',series:api.learningTrendSeries,domain:[50,80],height:320,unit:'%'};
   await act(()=>client.render(h(api.TrendChart,props)));
   const shapes=nodes(host,n=>n.attributes?.['data-trend-symbol']);
   assert.equal(shapes.filter(n=>n.attributes['data-trend-symbol']==='hollow-circle').length,1);
   assert.equal(shapes.filter(n=>n.attributes['data-trend-symbol']==='diamond').length,1);
   const curves=nodes(host,n=>n.tagName==='PATH'&&n.attributes?.class?.includes('recharts-line-curve'));
   assert.ok(curves.some(n=>n.attributes['stroke-dasharray']==='5 4'));
   const visibleCurves=curves.filter(n=>n.attributes['stroke-opacity']!=='0');
   assert.equal(visibleCurves.length,2);assert.ok(visibleCurves.every(n=>(n.attributes.d.match(/M/g)||[]).length===1),'P59 comparable actual/expected each has one continuous path across nulls');
   await act(()=>client.render(h(api.TrendChart,{...props,series:props.series.map(s=>({...s,connectGaps:false}))})));
   const broken=nodes(host,n=>n.tagName==='PATH'&&n.attributes?.class?.includes('recharts-line-curve')&&n.attributes['stroke-opacity']!=='0');
   assert.ok(broken.every(n=>(n.attributes.d.match(/M/g)||[]).length>1),'opt-out retains original gaps');
   await act(()=>client.render(h(api.TrendChart,props)));
   const labels=nodes(host,n=>n.attributes?.['data-trend-label']);assert.ok(labels.length>=8,`visible labels: ${labels.length}`);
   for(const label of labels){assert.equal(label.attributes.fill,'var(--foreground)');assert.equal(label.attributes['font-size'],'12');}
   const texts=labels.map(n=>n.textContent);assert.ok(texts.includes('高于预期 3'));assert.ok(texts.includes('65%'));
   dom.resize(320,320);
   await act(()=>{for(const observer of observers)observer.callback([{contentRect:{width:320,height:320}}])});
   assert.equal(nodes(host,n=>n.attributes?.['data-trend-label']).length,0);
   assert.ok(nodes(host,n=>n.textContent==='不可比：口径不同').length);assert.ok(nodes(host,n=>n.textContent==='高于预期 3').length);
   dom.resize(960,320);
   await act(()=>{for(const observer of observers)observer.callback([{contentRect:{width:960,height:320}}])});
   assert.ok(nodes(host,n=>n.attributes?.['data-trend-label']).length>=8);
   // Two non-null points in a point-only series must not acquire a visible line.
   const disconnected=[{id:'solo',label:'独立点',connect:false,data:[{id:'one',label:'同名',value:65,symbol:'hollow-circle',valueLabel:'65%'},{id:'two',label:'同名',value:72,symbol:'diamond',annotation:'独立观察'}]}];
   await act(()=>client.render(h(api.TrendChart,{...props,series:disconnected})));
   const paths=nodes(host,n=>n.tagName==='PATH'&&n.attributes?.class?.includes('recharts-line-curve'));
   assert.ok(paths.length);assert.ok(paths.every(n=>n.attributes['stroke-opacity']==='0'));
   const dots=nodes(host,n=>n.attributes?.['data-trend-symbol']);assert.equal(dots.length,2);
   const labels2=nodes(host,n=>n.attributes?.['data-trend-label']);assert.equal(labels2.length,2);
   assert.ok(+labels2[0].attributes.x<+labels2[1].attributes.x,'duplicate labels keep distinct category coordinates');
  }finally{await act(()=>client.unmount())}
  assert.deepEqual(errors,[]);
 }finally{console.error=originalError;globalThis.window=previous.window;globalThis.document=previous.document;globalThis.ResizeObserver=previous.ResizeObserver;globalThis.IS_REACT_ACT_ENVIRONMENT=previous.act}
});
