import test from 'node:test';
import assert from 'node:assert/strict';
import { createVisualLearningState, dailyWorkload, goalMilestones, scanRegions, scanDecisionError } from '../lib/prism-next/visual-analysis-model.ts';
import { learningReducer as run, createLearningState, goalStatus } from '../lib/prism-next/learning-workflow.ts';
import { sampleRecords, drillRecords } from '../lib/prism-next/analytics-model.ts';

test('prefilled visual examples are isolated from the shared blank workflow and from each other',()=>{
 const a=createVisualLearningState(),b=createVisualLearningState();
 assert.equal(createLearningState().reviews.length,0);
 assert.equal(goalStatus(a,a.goals[0]),'待验证');
 a.tasks[0].title='changed';a.verifications[0].results.domain='retry';
 assert.notEqual(b.tasks[0].title,'changed');assert.equal(b.verifications[0].results.domain,'pass');
});
test('daily load excludes done/skipped and suspended tasks, and rescheduling conserves remaining minutes',()=>{
 let s=createVisualLearningState();
 assert.equal(dailyWorkload(s,'2026-09-16').remaining,55);
 assert.equal(dailyWorkload(s,'2026-09-14').remaining,0);
 assert.equal(dailyWorkload(s,'2026-09-14').done,1);
 assert.equal(dailyWorkload(s,'2026-09-20').skipped,1);
 s=run(s,{type:'save-task',task:{...s.tasks[2],date:'2026-09-17'}});
 assert.equal(dailyWorkload(s,'2026-09-16').remaining,30);
 assert.equal(dailyWorkload(s,'2026-09-17').remaining,25);
 s=run(s,{type:'goal-mode',id:'G-1',mode:'paused'});
 assert.equal(dailyWorkload(s,'2026-09-16').remaining,0);
 assert.equal(dailyWorkload(s,'2026-09-16').blocked,1);
 assert.equal(dailyWorkload(s,'2026-09-16').tasks.length,1);
});
test('milestone validity follows source and standard revisions instead of displaying old successes',()=>{
 let s=createVisualLearningState();assert.deepEqual(goalMilestones(s,s.goals[0]).map(x=>x.state),['met','met','met','pending']);
 s=run(s,{type:'save-goal',goal:{...s.goals[0],criteria:s.goals[0].criteria.map(x=>({...x,text:x.text+' 并举例。'}))}});
 assert.equal(goalMilestones(s,s.goals[0])[2].state,'pending');
 s=run(s,{type:'diagnosis',id:'domain',decision:'rejected',note:'证据需要重新检查'});
 assert.equal(goalStatus(s,s.goals[0]),'来源需复核');
 assert.ok(goalMilestones(s,s.goals[0]).every(x=>x.state==='blocked'));
});
test('matrix single-cell drill preserves the exact missing, pending or zero record',()=>{
 for(const row of [sampleRecords[1],sampleRecords[6],sampleRecords[16]]) {
  const result=drillRecords(sampleRecords,{kind:'record',value:row.id,label:''});
  assert.equal(result.length,1);assert.equal(result[0],row);
 }
 assert.equal(drillRecords(sampleRecords.slice(0,3),{kind:'record',value:'SYN-A-6-2',label:''}).length,0);
});
test('reviewing a region requires a reason, and confirmed recognition requires corrected text',()=>{
 const region=scanRegions[0];
 assert.ok(scanDecisionError(region,{text:'B',note:'',outcome:'checked'}));
 assert.ok(scanDecisionError(region,{text:'',note:'核对原文',outcome:'checked'}));
 assert.equal(scanDecisionError(region,{text:'B',note:'字母 B 与数字 8 的录入差异',outcome:'checked'}),'');
 assert.equal(scanDecisionError(region,{text:'',note:'需要补扫清晰图像',outcome:'rescan'}),'');
});
