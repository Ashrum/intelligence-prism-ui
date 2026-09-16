import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleRecords, initialFilter, filterRecords, summarize, trendSeries, distributionSeries, statusSeries, inBin, goalProgress, drillRecords } from '../lib/prism-next/analytics-model.ts';
const row=(score,max=2,status='reviewed')=>({id:'fixture',learner:'A',date:'2026-09-01',topic:'model',score,max,status,note:''});
test('analytics excludes missing/pending scores but preserves reviewed zero and a weighted denominator',()=>{
  const result=summarize([row(0),row(4,4),row(null,2,'missing'),row(null,2,'pending')]);
  assert.equal(result.rate,4/6*100);assert.equal(result.scored,2);assert.equal(result.missing,1);assert.equal(result.pending,1);
  assert.equal(summarize([]).rate,null);assert.equal(summarize([row(null)]).rate,null);
  assert.equal(summarize([row(-1),row(3),row(NaN),row(1,Infinity),row(1,0)]).scored,0);
});
test('trend sorting retains an entirely missing measurement as null instead of zero',()=>{
  const data=trendSeries([...sampleRecords].reverse());
  assert.equal(data.length,6);assert.equal(data[2].date,'2026-09-07');assert.equal(data[2].rate,null);
  assert.equal(data[0].rate,2/6*100);assert.equal(data[5].pending,1);
});
test('distribution bins form a disjoint complete partition including the maximum',()=>{
  const rows=[row(0,100),row(49,100),row(50,100),row(99,100),row(100,100),row(null,100,'missing'),row(101,100)];
  assert.deepEqual(distributionSeries(rows).map(item=>item.count),[2,2,1]);
  assert.equal(inBin(rows,'unknown').length,0);
});
test('status totals and evidence drill-down reconcile after scope changes',()=>{
  const filtered=filterRecords(sampleRecords,{...initialFilter,range:'recent',topic:'domain'});
  assert.equal(filtered.length,3);assert.equal(summarize(filtered).scored,2);
  assert.equal(statusSeries(filtered).reduce((n,item)=>n+item.count,0),filtered.length);
  assert.equal(drillRecords(filtered,{kind:'status',value:'pending',label:''}).length,1);
  assert.equal(drillRecords(filtered,{kind:'bin',value:'full',label:''}).length,1);
  assert.equal(filterRecords(sampleRecords,{...initialFilter,learner:'SYN-EMPTY'}).length,0);
  assert.ok(sampleRecords.every(row=>row.id.startsWith('SYN-')));
});
test('goal progress clamps the drawing without inventing a valid baseline or target',()=>{
  assert.equal(goalProgress(40,20,80),0);assert.equal(goalProgress(40,100,80),100);
  assert.equal(goalProgress(40,60,80),50);assert.equal(goalProgress(80,80,80),null);
  assert.equal(goalProgress(null,60,80),null);assert.equal(goalProgress(0,Infinity,80),null);
});
