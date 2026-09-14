import test from 'node:test';
import assert from 'node:assert/strict';
import { components } from '../lib/prism-next/catalog.ts';
const workerPromise=import(new URL('../dist/server/index.js',import.meta.url));
async function fetchPage(path){const{default:worker}=await workerPromise;return worker.fetch(new Request('http://localhost'+path,{headers:{accept:'text/html'}}),{ASSETS:{fetch:async()=>new Response('Not found',{status:404})}},{waitUntil(){},passThroughOnException(){}})}
test('all 54 coss component routes render their real demonstrations',async()=>{
  assert.equal(components.length,54);
  for(const c of components){const res=await fetchPage('/next/components/'+c.id);assert.equal(res.status,200,c.id);const html=await res.text();assert.match(html,/prism-demo-section/,c.id);assert.match(html,/data-ui-version="coss-v1"/,c.id);assert.doesNotMatch(html,/legacy-version-notice/,c.id)}
});
test('new application and foundation routes use the isolated root',async()=>{
  for(const path of ['/next','/next/foundations','/next/reading','/next/agent']){const res=await fetchPage(path);assert.equal(res.status,200,path);const html=await res.text();assert.match(html,/data-ui-version="coss-v1"/);assert.doesNotMatch(html,/legacy-version-notice/)}
  const reading=await(await fetchPage('/next/reading')).text();assert.match(reading,/<math/);assert.match(reading,/<mfrac>/);assert.match(reading,/reading-material-kind/);
  const missing=await fetchPage('/next/components/does-not-exist');assert.equal(missing.status,404);
});
test('legacy review routes remain accessible and carry the deprecation notice',async()=>{
  for(const path of ['/','/components/select','/review/openui','/review/reading-review','/review/typography']){const res=await fetchPage(path);assert.equal(res.status,200,path);const html=await res.text();assert.match(html,/legacy-version-notice/);assert.match(html,/旧版设计 · 已过期/);assert.doesNotMatch(html,/data-ui-version="coss-v1"/)}
});
