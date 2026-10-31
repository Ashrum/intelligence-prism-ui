import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import React,{act} from 'react';
import {renderToString} from 'react-dom/server';
import {hydrateRoot} from 'react-dom/client';
import {createTestRuntime} from './helpers/test-runtime.mjs';
import {domNodes} from './helpers/ssr-hydration-dom.mjs';
import {reviewHydrationDOM} from './helpers/p126-hydration-dom.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),runtime=await createTestRuntime('p126-hydration'),h=React.createElement;
async function compile(name,{unmounted=false,wrapper=false}={}) {
 const file=new URL(`${name}.mjs`,runtime);
 const result=await build({stdin:{contents:`export * from './examples/question-review/question-review';export * from './examples/paper-review/paper-review';export * from './components/prism-next/blueprint/blueprint';export {BlueprintFrameDemo} from './components/prism-next/demos/blueprint';export {ThemeProvider,useTheme} from 'next-themes';`,resolveDir:root,loader:'tsx'},bundle:true,jsx:'automatic',platform:'node',format:'esm',packages:'external',alias:{'@':root,'next/link':'next/link.js','next/navigation':'next/navigation.js'},loader:{'.css':'empty'},write:false,plugins:[{name:'real-next-themes-and-negative-control',setup(b){
 // Bundle next-themes separately for SSR/client so its module-level isServer
 // check sees the proper environment. No theme, host, hook or UI component mocks.
 b.onResolve({filter:/temml\.mjs\?url$/},()=>({path:'temml',namespace:'url'}));b.onLoad({filter:/.*/,namespace:'url'},()=>({contents:'export default "temml.mjs"'}));
 b.onResolve({filter:/^next-themes$/},()=>({path:fileURLToPath(import.meta.resolve('next-themes'))}));
 if(wrapper)b.onLoad({filter:/blueprint\/blueprint\.tsx$/},({path})=>({contents:readFileSync(path,'utf8').replace('  const attributes = {','  return <div className="bp-frame">{children}{decoration}</div>\n  const attributes = {'),loader:'tsx'}));
 if(unmounted)b.onLoad({filter:/examples\/(question-review|paper-review)\/.*\.tsx$/},({path})=>({contents:readFileSync(path,'utf8').replace('mounted && (resolvedTheme','(resolvedTheme'),loader:'tsx'}));
 }}]});writeFileSync(file,result.outputFiles[0].text);return file;
}
const server=await import(await compile('server'));
const clientFile=await compile('client'),brokenFile=await compile('without-mount-gate',{unmounted:true});
const wrapperFile=await compile('reintroduced-wrapper',{wrapper:true});
const themeProps={storageKey:'prism-v1-theme',attribute:'data-prism-theme',enableSystem:false,defaultTheme:'light',themes:['light','paper','dark','blueprint','blueprint-night']};
let setTheme;
function ThemeControl({api}) { setTheme=api.useTheme().setTheme;return null; }
const element=(api,name)=>h(api.ThemeProvider,themeProps,h(api[name]),h(ThemeControl,{api}));
const byAttr=(host,attr)=>domNodes(host,n=>n.hasAttribute?.(attr))[0];
async function hydrate(name,theme,{broken=false,wrapper=false}={}) {
 const html=renderToString(element(server,name));
 const dom=reviewHydrationDOM(),host=dom.parse(html,dom.document.createElement('div'));
 dom.document.body.appendChild(host);
 dom.window.localStorage.setItem('prism-v1-theme',theme);
 const before=byAttr(host,'data-review-canvas'),paper=byAttr(host,'data-page-id');
 assert.ok(before);assert.ok(paper);before.scrollTop=137;paper.scrollTop=23;
 const previous=Object.fromEntries(Object.keys(dom.globals).map(k=>[k,globalThis[k]]));Object.assign(globalThis,dom.globals);
 const errors=[],recoverable=[],original=console.error;console.error=(...args)=>errors.push(args.join(' '));
 let mounted;
 try {
  const api=await import(broken?brokenFile:wrapper?wrapperFile:clientFile);
  await act(()=>{mounted=hydrateRoot(host,element(api,name),{onRecoverableError:e=>recoverable.push(e.message)});});
  const after=byAttr(host,'data-review-canvas');
  if(!broken){
   assert.ok(after===before,'mounting theme decoration must preserve the canvas DOM');
   assert.equal(byAttr(host,'data-page-id'),paper,'paper node must survive');
   assert.equal(before.scrollTop,137);assert.equal(paper.scrollTop,23);
   assert.equal(domNodes(host,n=>n.getAttribute?.('data-slot')==='bp-frame').length,theme.startsWith('blueprint')?1:0);
   // Use the actual rendered zoom control, then switch the real provider twice.
   const zoom=domNodes(host,n=>n.getAttribute?.('aria-label')==='放大')[0];
   assert.ok(zoom,'real canvas zoom button');
   const props=zoom[Object.keys(zoom).find(k=>k.startsWith('__reactProps$'))];
   await act(()=>props.onClick({currentTarget:zoom,target:zoom,nativeEvent:{},preventDefault(){},stopPropagation(){}}));
   const viewport=byAttr(host,'data-zoom-mode');
   const zoomMode=viewport.getAttribute('data-zoom-mode');
   assert.notEqual(zoomMode,'width','zoom control changed actual host state');
   for(const next of ['light','blueprint-night']) {
    await act(()=>setTheme(next));
    assert.equal(byAttr(host,'data-review-canvas'),before);
    assert.equal(byAttr(host,'data-page-id'),paper);
    assert.equal(byAttr(host,'data-zoom-mode'),viewport);
    assert.equal(viewport.getAttribute('data-zoom-mode'),zoomMode);
    assert.equal(before.scrollTop,137);assert.equal(paper.scrollTop,23);
   }
   assert.deepEqual(recoverable,[]);assert.deepEqual(errors,[]);
  }
  return {html,recoverable,errors};
 } finally { if(mounted)await act(()=>mounted.unmount());console.error=original;for(const [k,v] of Object.entries(previous))if(v===undefined)delete globalThis[k];else globalThis[k]=v; }
}
for(const name of ['QuestionReviewDesign','PaperReviewDesign'])for(const theme of ['blueprint','blueprint-night','light'])test(`P126-r1 ${name}: real ThemeProvider saved ${theme} hydrates without replacing canvas/paper`,async()=>{await hydrate(name,theme);});
for(const name of ['QuestionReviewDesign','PaperReviewDesign'])test(`P126-r1 negative control ${name}: removing mounted gate causes real recoverable hydration error`,async()=>{const result=await hydrate(name,'blueprint',{broken:true});assert.ok(result.recoverable.some(e=>/Hydration failed/i.test(e)),JSON.stringify(result));});

for(const theme of ['blueprint','blueprint-night','light'])test(`P126-r1 actual #blueprint-frame example: ${theme} mounts decoration after hydration`,async()=>{
 const dom=reviewHydrationDOM(),html=renderToString(element(server,'BlueprintFrameDemo'));
 assert.doesNotMatch(html,/data-slot="bp-frame"|bp-inline-code|bp-inline-folio/);
 const host=dom.parse(html,dom.document.createElement('div'));dom.document.body.appendChild(host);
 const heading=domNodes(host,n=>n.tagName==='H3')[0];
 dom.window.localStorage.setItem('prism-v1-theme',theme);
 const previous=Object.fromEntries(Object.keys(dom.globals).map(k=>[k,globalThis[k]]));Object.assign(globalThis,dom.globals);
 const errors=[],original=console.error;console.error=(...args)=>errors.push(args.join(' '));let mounted;
 try {
  const api=await import(clientFile);
  await act(()=>{mounted=hydrateRoot(host,element(api,'BlueprintFrameDemo'),{onRecoverableError:e=>errors.push(e.message)});});
  assert.equal(domNodes(host,n=>n.tagName==='H3')[0],heading);
  assert.equal(domNodes(host,n=>n.getAttribute?.('data-slot')==='bp-frame').length,theme.startsWith('blueprint')?1:0);
  await act(()=>setTheme('light'));await act(()=>setTheme('blueprint'));
  assert.equal(domNodes(host,n=>n.tagName==='H3')[0],heading);
  assert.deepEqual(errors,[]);
 } finally {if(mounted)await act(()=>mounted.unmount());console.error=original;for(const [k,v] of Object.entries(previous))if(v===undefined)delete globalThis[k];else globalThis[k]=v;}
});

for(const name of ['QuestionReviewDesign','PaperReviewDesign'])test(`P126-r1 negative control ${name}: reintroducing wrapper is detected as canvas remount`,async()=>{
 await assert.rejects(()=>hydrate(name,'blueprint',{wrapper:true}),/must preserve the canvas DOM/);
});
