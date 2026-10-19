// Synthetic DOM/time inputs only. No browser, Playwright, service, source or test modifications.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {screenshotName,contrastPolicy,waitForStableElements} from './measurement-utils.mjs';
let checks=0;
async function check(name,fn){await fn();checks++;console.log('ok '+name);}
async function simulate({animationUntil=0,infinite=false,opacityUntil=0,movingUntil=0,empty=false}={}) {
 let time=0,id=0;const tasks=new Map();
 const schedule=(fn,delay)=>{const key=++id;tasks.set(key,{fn,at:time+delay});return key;};
 const pixel={isConnected:true,parentElement:null,getBoundingClientRect:()=>({left:time<movingUntil?time:0,top:0,right:16,bottom:16}),getAnimations:()=>time<animationUntil?[{pending:false,playState:'running',effect:{getComputedTiming:()=>({iterations:infinite?Infinity:1,endTime:infinite?Infinity:animationUntil})}}]:[],querySelectorAll:()=>[]};
 const node={...pixel,querySelectorAll:()=>[pixel]};
 const run=vm.runInNewContext(`(${waitForStableElements.toString()})`,{
  performance:{now:()=>time},setTimeout:(f,ms)=>schedule(f,ms),clearTimeout:id=>tasks.delete(id),
  requestAnimationFrame:f=>schedule(f,16),cancelAnimationFrame:id=>tasks.delete(id),
  getComputedStyle:()=>({opacity:time<opacityUntil?String(time/opacityUntil):'1'}),
 });
 return {run:async options=>{
  const promise=run(empty?[]:[node],options);
  while(tasks.size) {const [key,task]=[...tasks].sort((a,b)=>a[1].at-b[1].at)[0];tasks.delete(key);time=task.at;task.fn();}
  return promise;
 }};
}
await check('finite entry animation must finish even when rect is already stable',async()=>{
 const r=await (await simulate({animationUntil:1500})).run({timeoutMs:2000});assert.ok(r.stable);assert.ok(r.elapsedMs>=1500);
});
await check('moving rect must settle across consecutive frames',async()=>{
 const r=await (await simulate({movingUntil:160})).run({timeoutMs:500});assert.ok(r.stable);assert.ok(r.elapsedMs>=192);
});
await check('opacity transition must settle before reduced-motion sample',async()=>{
 const r=await (await simulate({opacityUntil:200})).run({timeoutMs:500,pixels:true});assert.ok(r.stable);assert.ok(r.elapsedMs>=232);assert.equal(r.last.samples[1].opacity,'1');
});
await check('timeout is explicitly unstable and preserves last sample',async()=>{
 const r=await (await simulate({animationUntil:10000})).run({timeoutMs:80});assert.equal(r.stable,false);assert.equal(r.status,'未稳定');assert.equal(r.elapsedMs,80);assert.ok(r.last.activeAnimations.length);
});
await check('normal motion permits infinite decoration, reduce does not',async()=>{
 const normal=await (await simulate({animationUntil:10000,infinite:true,opacityUntil:10000})).run({timeoutMs:100,pixels:true,allowInfinite:true});assert.ok(normal.stable);
 const reduce=await (await simulate({animationUntil:10000,infinite:true})).run({timeoutMs:100,pixels:true});assert.equal(reduce.stable,false);
});
await check('missing elements cannot pass stabilization',async()=>{
 const r=await (await simulate({empty:true})).run({timeoutMs:50});assert.equal(r.stable,false);
});
await check('contrast thresholds distinguish core, blueprint and known border limitation',()=>{
 for(const theme of ['light','paper','dark']) {const p=contrastPolicy(theme,{fg:'line',contrast:1.2});assert.equal(p.threshold,null);assert.equal(p.status,'observed');}
 for(const theme of ['blueprint','blueprint-night']) {assert.equal(contrastPolicy(theme,{fg:'line',contrast:2.9}).status,'fail');assert.equal(contrastPolicy(theme,{fg:'line',contrast:3}).status,'pass');}
 for(const theme of ['light','paper','dark','blueprint','blueprint-night']) assert.equal(contrastPolicy(theme,{fg:'foreground',contrast:4.49}).status,'fail');
 assert.equal(contrastPolicy('blueprint-night',{fg:'border',contrast:1.58}).status,'known-limitation');
});
await check('route names are readable and unique across all 645 layout screenshots',async()=>{
 const dir=path.dirname(fileURLToPath(import.meta.url)),m=JSON.parse(await readFile(path.join(dir,'manifest.json'),'utf8'));
 const names=[];for(const theme of m.themes)for(const width of m.widths)for(const route of m.routes)names.push(screenshotName({theme,viewport:{width},route:route.route,id:'layout-fixture'}));
 assert.equal(names.length,645);assert.equal(new Set(names).size,645);assert.ok(names.includes('blueprint-320-agent-message.png'));assert.ok(names.includes('blueprint-320-foundations-blueprint.png'));assert.ok(names.includes('blueprint-320-experiments-blueprint.png'));
});
console.log(JSON.stringify({offlineChecks:checks,browserExecuted:false}));
