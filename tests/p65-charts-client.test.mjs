import test from 'node:test';
import assert from 'node:assert/strict';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { api,h } from './p58-chart-harness.mjs';
import { clientDOM } from './helpers/chart-client-dom.mjs';
const nodes=(host,predicate)=>{const all=[];function walk(n){if(predicate(n))all.push(n);n.childNodes?.forEach(walk)}walk(host);return all};
const widthOf=text=>Array.from(text).reduce((sum,c)=>sum+(/^[\x20-\x7e]$/.test(c)?7.8:12),0);
for(const theme of ['light','paper','dark'])test(`P65 ${theme}: real Recharts spark endpoints/gaps survive resize; trend text has card halo`,async()=>{
 const previous={window:globalThis.window,document:globalThis.document,ResizeObserver:globalThis.ResizeObserver,act:globalThis.IS_REACT_ACT_ENVIRONMENT};
 const errors=[],originalError=console.error;console.error=(...args)=>errors.push(args.join(' '));
 try{
  globalThis.IS_REACT_ACT_ENVIRONMENT=true;globalThis.__p58Theme=theme;
  const observers=[];globalThis.ResizeObserver=class{constructor(callback){this.callback=callback;observers.push(this)}observe(){}unobserve(){}disconnect(){}};
  const dom=clientDOM(1440,120);globalThis.window=dom.window;globalThis.document=dom.document;
  const host=dom.document.createElement('div'),root=createRoot(host);
  try{
   const data=Array.from({length:13},(_,i)=>({id:String(i),label:String(i+1),value:i===4?null:i*10}));
   await act(()=>root.render(h(api.ComparisonChart,{label:'13周',data,variant:'spark',dataDisclosure:'hidden'})));
   for(const width of [1440,320,180,120,800,320]){
    dom.resize(width,120);await act(()=>{for(const o of observers)o.callback([{contentRect:{width,height:120}}])});
    const ticks=nodes(host,n=>n.attributes?.['data-spark-tick']!==undefined);
    assert.equal(ticks[0].attributes['data-spark-tick'],'0');assert.equal(ticks.at(-1).attributes['data-spark-tick'],'12');
    if(width<=180)assert.ok(ticks.length<13);
    const boxes=ticks.map(t=>{const text=t.childNodes.filter(n=>n.tagName!=='TITLE').map(n=>n.nodeValue??n.textContent).join('');const size=widthOf(text),x=+t.attributes.x;return {left:x-size/2,right:x+size/2}});
    boxes.forEach((b,i)=>{assert.ok(b.left>=0&&b.right<=width);if(i)assert.ok(b.left-boxes[i-1].right>=8-1e-8)});
    assert.equal(nodes(host,n=>n.tagName==='SUMMARY').length,0);
   }
   dom.resize(1440,320);
   await act(()=>root.render(h(api.TrendChart,{label:'标注',series:api.learningTrendSeries,unit:'%',yDomain:'auto',height:320})));
   await act(()=>{for(const o of observers)o.callback([{contentRect:{width:1440,height:320}}])});
   const labels=nodes(host,n=>n.attributes?.['data-trend-label']);assert.ok(labels.length>0);
   assert.ok(labels.some(n=>n.attributes['data-trend-label']==='valueLabel'));
   assert.ok(labels.some(n=>n.attributes['data-trend-label']==='annotation'));
   for(const label of labels){assert.equal(label.attributes.stroke,'var(--card)');assert.equal(label.attributes['stroke-width'],'4');assert.equal(label.attributes['paint-order'],'stroke');}
  }finally{await act(()=>root.unmount())}
  assert.deepEqual(errors,[]);
 }finally{console.error=originalError;globalThis.window=previous.window;globalThis.document=previous.document;globalThis.ResizeObserver=previous.ResizeObserver;globalThis.IS_REACT_ACT_ENVIRONMENT=previous.act;delete globalThis.__p58Theme}
});
