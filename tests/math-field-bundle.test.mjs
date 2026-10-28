import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, realpathSync } from 'node:fs'
import { relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { components, searchComponents } from '../lib/prism-next/catalog.ts'
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8')
const manifest=JSON.parse(read('dist/client/.vite/manifest.json'))
// Vite records the resolved package path when node_modules is a worktree symlink.
const mathliveKey=relative(fileURLToPath(new URL('../',import.meta.url)),realpathSync(new URL('../node_modules/mathlive/mathlive.min.mjs',import.meta.url))).split(sep).join('/')
function closure(start){const seen=new Set();function visit(key){if(seen.has(key))return;seen.add(key);for(const dep of manifest[key]?.imports??[])visit(dep)}start.forEach(visit);return seen}
test('P119 adds exactly the approved formula component to the independent pre-task catalog; no old id lost or duplicated',()=>{
 const baseline=JSON.parse(read('tests/fixtures/catalog-p119-baseline.json'))
 assert.equal(baseline.baseline,'78db38386897271869c985dfd17a64a79d471819')
 assert.deepEqual(components.map(c=>c.id).sort(),[...baseline.ids,'math-field'].sort())
 assert.equal(searchComponents('MathField')[0].href,'/next/components/math-field')
 assert.equal(components.find(c=>c.id==='math-field').kind,'extension')
})
test('production manifest: MathLive is dynamic, absent from browser entry and demo static closures',()=>{
 const key=mathliveKey,demo='components/prism-next/demos/math-field.tsx'
 assert.equal(manifest[key].isDynamicEntry,true)
 for(const entries of [Object.keys(manifest).filter(k=>manifest[k].isEntry),[demo]]){
  const graph=closure(entries);assert.equal(graph.has(key),false)
  for(const file of [...graph].map(k=>manifest[k]?.file).filter(Boolean))assert.doesNotMatch(read('dist/client/'+file),/class MathfieldElement|mathlive@0\.111|MathLive 0\.111/u)
 }
 assert.ok([...closure([demo])].some(entry=>manifest[entry]?.dynamicImports?.includes(key)), 'shared static chunk retains the dynamic MathLive boundary')
})
test('built component route renders all requested examples without emitting an eager MathLive preload',async()=>{
 const {default:worker}=await import('../dist/server/index.js')
 const response=await worker.fetch(new Request('http://localhost/next/components/math-field',{headers:{accept:'text/html'}}),{ASSETS:{fetch:async()=>new Response('Not found',{status:404})}},{waitUntil(){},passThroughOnException(){}})
 assert.equal(response.status,200)
 const html=await response.text()
 for(const text of ['prism-demo-section','SHEET 08','单独一行','原文出错','只读','触屏数学键盘','化学式','物理单位','高级','打开公式框','挂载即打开 · 新建空公式'])assert.ok(html.includes(text),text)
 const runtime=manifest[mathliveKey].file
 assert.ok(!html.includes(runtime),'no script/modulepreload/prefetch of the MathLive chunk')
})
