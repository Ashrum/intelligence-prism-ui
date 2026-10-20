// Synthetic harness for the actual evidence probes. No browser, port, product or test changes.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {roundProbes} from './round-probes.mjs';
let checks=0;
async function check(name,fn){await fn();checks++;console.log('ok '+name);}
function isolationPage(mismatch=false){
 let appended=0,removed=0,finiteFinished=0;
 const clone=cls=>{
  const finite={playState:'running',pending:false,effect:{getComputedTiming:()=>({iterations:1})},get finished(){return Promise.resolve().then(()=>{this.playState='finished';finiteFinished++;});}};
  const infinite={playState:'running',pending:false,animationName:'synthetic-spin',effect:{getComputedTiming:()=>({iterations:Infinity}),getKeyframes:()=>[{offset:0,transform:'none'},{offset:1,transform:'rotate(360deg)'}]},pause(){this.playState='paused';},ready:Promise.resolve()};
  return {dataset:{},cls,querySelectorAll:()=>[],removeAttribute(){},getAttribute:()=>cls,getBoundingClientRect:()=>({width:600}),getAnimations:()=>[finite,infinite],matches(){return this.parentElement.dataset.prismTheme==='blueprint';}};
 };
 const originals=Array.from({length:9},(_,i)=>({getAttribute:()=>`node-${i}`,cloneNode:()=>clone(`node-${i}`)}));
 const source={getAttribute:()=> 'bp-sheet',cloneNode:()=>clone('bp-sheet'),querySelectorAll:()=>originals};
 const document={createElement:()=>({dataset:{},style:{},append(el){el.parentElement=this;},remove(){removed++;}}),body:{append(){appended++;}}};
 const globals={document,setTimeout,clearTimeout,requestAnimationFrame:fn=>queueMicrotask(fn),matchMedia:()=>({matches:true}),getComputedStyle:(n,p)=>new Proxy({getPropertyValue:k=>k==='--link'?'blue':'black'},{get:(target,k)=>k in target?target[k]:mismatch&&n.cls==='node-0'&&p==='::after'&&k==='borderRadius'?(n.matches()?'0px':'8px'):'same'})};
 const sheet={locator:()=>({first:()=>({hover:async()=>{}})}),evaluate:async(fn,args)=>JSON.parse(JSON.stringify(await vm.runInNewContext(`(${fn.toString()})`,globals)(source,args)))};
 return {page:{emulateMedia:async()=>{},locator:()=>sheet},counts:()=>({appended,removed,finiteFinished})};
}
await check('isolation waits finite animations, freezes loops at same time, removes all temporary roots',async()=>{
 const harness=isolationPage(),row={theme:'light',innerTheme:'blueprint'};
 const result=await roundProbes['entry-isolation'](harness.page,row);
 assert.equal(result.results.length,10);assert.equal(harness.counts().removed,10);assert.equal(harness.counts().appended,10);assert.ok(harness.counts().finiteFinished>=20);
 for(const r of result.results){assert.equal(r.equal,true);assert.equal(r.motion.expected.paused[0].time,0);assert.deepEqual(Array.from(r.motion.actual.paused[0].properties),['transform']);}
 assert.deepEqual(Array.from(result.excludedProperties),[]);assert.ok(result.properties.includes('opacity')&&result.properties.includes('transform'));
});
await check('post-stabilization pseudo-element mutation fails and preserves named values and source',async()=>{
 const harness=isolationPage(true),row={theme:'light',innerTheme:'blueprint'};
 await assert.rejects(()=>roundProbes['entry-isolation'](harness.page,row),{code:'ERR_ASSERTION'});
 const differences=row.measured.results.flatMap(r=>r.differences);assert.equal(differences.length,1);
 const d=differences[0];assert.equal(d.property,'borderRadius');assert.equal(d.pseudo,'::after');assert.equal(d.expected,'0px');assert.equal(d.actual,'8px');assert.equal(d.selector,':scope');assert.equal(row.measured.source.accentLine,514);assert.match(row.measured.judgment,/疑似缺陷/);assert.equal(harness.counts().removed,10);
});
function zoomPage(width,shadow='none'){
 const root={style:{},clientWidth:width,scrollWidth:width*2};
 const globals={document:{documentElement:root,querySelectorAll:()=>[]},innerWidth:width,devicePixelRatio:1,getComputedStyle:()=>({zoom:root.style.zoom})};
 const locator={first(){return this;},evaluateAll:async fn=>fn.name==='waitForStableElements'?{stable:true}:[{boxShadow:shadow}]};
 return {root,page:{emulateMedia:async()=>{},locator:()=>locator,evaluate:(fn,args)=>vm.runInNewContext(`(${fn.toString()})`,globals)(args)}};
}
await check('320 CSS zoom is observed with raw overflow retained and zoom restored',async()=>{
 const h=zoomPage(320),row={theme:'blueprint',viewport:{width:320},pass:null};await roundProbes['print-zoom'](h.page,row,{capture:async()=>{}});
 assert.equal(row.status,'observed');assert.equal(row.pass,null);assert.equal(row.measured[1].cssZoom.scroll,640);assert.equal(row.measured[1].originalAcceptance.width,1280);assert.equal(h.root.style.zoom,'');
});
await check('768 and 1280 overflow remain failures; 320 print-shadow regression cannot become observed',async()=>{
 for(const [width,shadow]of [[768,'none'],[1280,'none'],[320,'bad-shadow']]){
  const h=zoomPage(width,shadow),row={theme:'blueprint',viewport:{width}};await assert.rejects(()=>roundProbes['print-zoom'](h.page,row,{capture:async()=>{}}),{code:'ERR_ASSERTION'});assert.notEqual(row.status,'observed');assert.equal(h.root.style.zoom,'');assert.ok(row.measured.length);
 }
});
function narrowPage({visible=false,residual=false}={}){
 let active=0;
 const ruler={className:'bp-ruler',getClientRects:()=>visible?[{}]:[]};
 const element={scrollIntoView(){},querySelectorAll:selector=>selector==='.bp-ruler'?Array(4).fill(ruler):Array(active).fill(ruler)};
 const globals={document:{querySelector:()=>element},matchMedia:()=>({matches:true}),getComputedStyle:()=>({display:visible?'flex':'none'})};
 const evaluate=(fn,arg)=>vm.runInNewContext(`(${fn.toString()})`,globals)(arg);
 const sheet={scrollIntoViewIfNeeded:async()=>{},boundingBox:async()=>({x:0,y:0,width:320,height:600}),elementHandle:async()=>element,evaluate:async fn=>evaluate(fn,element)};
 return {locator:()=>sheet,evaluate,mouse:{move:async x=>{active=x===0?(residual?1:0):4;}},waitForFunction:async(fn,arg)=>{assert.equal(evaluate(fn,arg),true,'residual active ruler must fail');}};
}
await check('320 asserts four hidden rulers and clears active marks instead of waiting for tracking',async()=>{
 const row={viewport:{width:320}};await roundProbes['entry-pointer'](narrowPage(),row,{capture:async()=>{}});assert.equal(row.measured.trackingApplicable,false);assert.equal(row.measured.during.visibleActive,0);assert.equal(row.measured.after.active,0);
});
await check('320 visible ruler or stale mark remains a failure',async()=>{
 for(const state of [{visible:true},{residual:true}])await assert.rejects(()=>roundProbes['entry-pointer'](narrowPage(state),{viewport:{width:320}},{capture:async()=>{}}),{code:'ERR_ASSERTION'});
});
console.log(JSON.stringify({offlineChecks:checks,browserExecuted:false}));
