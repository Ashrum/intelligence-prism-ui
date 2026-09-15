import test from 'node:test';
import assert from 'node:assert/strict';
import {addToPaper,moveInPaper,replaceInPaper,entryPoints,reviewError} from '../lib/prism-next/question-workspace.ts';

test('whole composite selections deduplicate without sharing score overrides with the question definition',()=>{
  const source={id:'composite',points:16,partPoints:{'1':4,'2':4,'3':8}};
  const result=addToPaper([], [source,source]);
  assert.equal(result.length,1);result[0].partPoints['3']=10;
  assert.equal(entryPoints(result[0]),18);assert.equal(source.partPoints['3'],8);
  assert.equal(addToPaper(result,[source]).length,1);
});
test('paper moves preserve score and replacements preserve position while avoiding duplicates',()=>{
  const entries=[{id:'a',points:5},{id:'b',points:8},{id:'c',points:6}];
  assert.deepEqual(moveInPaper(entries,'b',-1).map(item=>item.id),['b','a','c']);
  assert.deepEqual(moveInPaper(entries,'a',-1),entries);
  assert.deepEqual(replaceInPaper(entries,'b',{id:'d',points:16}),[entries[0],{id:'d',points:16},entries[2]]);
  assert.deepEqual(replaceInPaper(entries,'b',{id:'a',points:5}),entries);
});
test('review permits unchanged confirmation and requires a reason for score changes',()=>{
  const original={choice:4,domain:0,maximum:2},limits={choice:4,domain:2,maximum:2};
  assert.equal(reviewError(original,limits,original,''),'');
  assert.match(reviewError({...original,domain:1},limits,original,''),/理由/);
  assert.equal(reviewError({...original,domain:1},limits,original,'补充过程有部分依据'),'');
  for(const value of [null,-1,3,NaN,0.2]) assert.match(reviewError({...original,domain:value},limits,original,'理由'),/范围/);
  assert.equal(original.maximum,2);
});
