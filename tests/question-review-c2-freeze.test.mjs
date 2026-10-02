import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {renderer,states} from './question-review-c2-freeze-harness.mjs';
const render=await renderer(),before=JSON.parse(await readFile(new URL('./fixtures/question-review-c2-before.json',import.meta.url),'utf8'));
for(const [name,state] of Object.entries(states))test(`C2 frozen question review: ${name}`,()=>{
 const html=render(state);
 if(name==='choice')assert.match(html,/data-question-id="q1"/);
 if(name==='fill')assert.match(html,/data-question-id="q6"/);
 if(name==='evidence'){assert.match(html,/知识点概况/);assert.match(html,/data-scoring-point="p2" class="[^"]*ring-2 ring-info/)}
 if(name==='student')assert.match(html,/当前作答 ·/);
 if(name==='full')assert.match(html,/满分作答已展开/);
 if(name==='collapsed')assert.match(html,/data-rail-collapsed="true"/);
 if(name==='immersive')assert.match(html,/data-immersive="true"/);
 if(name==='missing')assert.match(html,/扫描图像未提供/);
 if(name==='sorted')assert.match(html,/排序结果/);
 assert.equal(createHash('sha256').update(html).digest('hex'),before[name]);
});
