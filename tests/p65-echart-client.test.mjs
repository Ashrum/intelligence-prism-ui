import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createElement as h,act } from 'react';
import { createRoot } from 'react-dom/client';
import { clientDOM } from './helpers/chart-client-dom.mjs';
import { createTestRuntime } from './helpers/test-runtime.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),file=new URL('bundle.mjs',await createTestRuntime('p65-engine'));
await writeFile(file,(await build({stdin:{contents:"export {EChart} from './components/prism-next/charts/echart'",resolveDir:root,loader:'tsx'},bundle:true,jsx:'automatic',platform:'node',format:'esm',packages:'external',alias:{'@':root},write:false,plugins:[{name:'engine-probe',setup(b){
 b.onResolve({filter:/^next-themes$/},()=>({path:'theme',namespace:'p65'}));b.onLoad({filter:/.*/,namespace:'p65'},()=>({contents:'export const useTheme=()=>({theme:"light"})'}));
 b.onLoad({filter:/\/charts\/echart-engine\.tsx?$/},()=>({contents:'export const init=()=>globalThis.__p65Engine'}));
}}]})).outputFiles[0].text);
const {EChart}=await import(file);
test('P65 real EChart wrapper resolves measured layout after mount, resize and option updates; legacy does not reapply on resize',async()=>{
 const prev={window:globalThis.window,document:globalThis.document,ResizeObserver:globalThis.ResizeObserver,act:globalThis.IS_REACT_ACT_ENVIRONMENT};
 try{
  globalThis.IS_REACT_ACT_ENVIRONMENT=true;
  const dom=clientDOM(800,340);globalThis.window=dom.window;globalThis.document=dom.document;
  const observers=[],calls=[];let width=800,height=340,resizes=0;
  globalThis.ResizeObserver=class{constructor(callback){observers.push(callback)}observe(){}disconnect(){}};
  globalThis.__p65Engine={on(){},getZr:()=>({on(){}}),getWidth:()=>width,getHeight:()=>height,resize(){resizes++},setOption(option){calls.push(option)},dispose(){}};
  const host=dom.document.createElement('div'),reactRoot=createRoot(host);
  const layout=(option,w,h)=>({...option,title:{text:`${w}:${h}:${option.title.text}`}});
  try{
   await act(async()=>{reactRoot.render(h(EChart,{label:'布局',option:{title:{text:'A'}},resolveLayout:layout}));});
   assert.equal(calls.at(-1).title.text,'800:340:A');
   width=320;height=260;await act(()=>observers.forEach(cb=>cb()));assert.equal(calls.at(-1).title.text,'320:260:A');
   await act(()=>reactRoot.render(h(EChart,{label:'布局',option:{title:{text:'B'}},resolveLayout:layout})));
   assert.equal(calls.at(-1).title.text,'320:260:B');
   await act(()=>reactRoot.render(h(EChart,{label:'旧分支',option:{title:{text:'C'}}})));
   const count=calls.length;await act(()=>observers.forEach(cb=>cb()));assert.equal(calls.length,count);assert.equal(resizes,2);
  }finally{await act(()=>reactRoot.unmount())}
 }finally{globalThis.window=prev.window;globalThis.document=prev.document;globalThis.ResizeObserver=prev.ResizeObserver;globalThis.IS_REACT_ACT_ENVIRONMENT=prev.act;delete globalThis.__p65Engine}
});
