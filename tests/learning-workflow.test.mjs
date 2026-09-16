import test from 'node:test';
import assert from 'node:assert/strict';
import { createLearningState, learningReducer as run, latestReview, diagnosisValid, goalSourceValid, goalStatus, goalPasses, currentVerifications } from '../lib/prism-next/learning-workflow.ts';
import { initialReviewScores as scores } from '../lib/prism-next/fixtures/review.ts';
function reviewed() { return run(createLearningState(), {type:'review',scores,reason:''}); }
function goalReady() {
  let state=reviewed();
  for(const id of ['quantity','domain']) state=run(state,{type:'diagnosis',id,decision:'confirmed',note:'对照原作答，确认本次遗漏。'});
  state=run(state,{type:'create-goal',due:'2026-09-22'});
  return run(state,{type:'goal-mode',id:'G-1',mode:'active'});
}
function planReady() { return run(goalReady(),{type:'create-plan',id:'G-1',dates:['2026-09-15','2026-09-17','2026-09-20']}); }
function verify(state,attemptId,results={quantity:'pass',domain:'pass'}) { return run(state,{type:'verify',check:{goalId:'G-1',goalVersion:state.goals[0].version,attemptId,results,note:'对照作答中的变量解释及范围取交集步骤。'}}); }

test('unconfirmed evaluation cannot produce confirmed diagnoses, goals or plans',()=>{
  let state=createLearningState();
  state=run(state,{type:'diagnosis',id:'domain',decision:'confirmed',note:'观察'});
  assert.equal(state.diagnoses[1].decision,'pending');
  state=run(state,{type:'create-goal',due:'2026-09-22'});assert.equal(state.goals.length,0);
  state=run(state,{type:'create-plan',id:'G-1',dates:[]});assert.equal(state.tasks.length,0);
});
test('confirmed review snapshots do not share score objects and identical confirmation is idempotent',()=>{
  const draft={...scores};let state=run(createLearningState(),{type:'review',scores:draft,reason:''});
  draft.domain=2;assert.equal(latestReview(state).scores.domain,0);
  state=run(state,{type:'review',scores,reason:''});assert.equal(state.reviews.length,1);
  for(const bad of [{...scores,fill:null},{...scores,domain:3},{...scores,domain:0.25}]) assert.equal(run(state,{type:'review',scores:bad,reason:'调整'}).reviews.length,1);
  assert.equal(run(state,{type:'review',scores:{...scores,domain:2},reason:''}).reviews.length,1);
});
test('a new confirmed evaluation invalidates references without deleting human goals, tasks or history',()=>{
  let state=planReady();state=verify(verify(state,'DEMO-B'),'DEMO-C');
  assert.equal(goalStatus(state,state.goals[0]),'已达成');
  state=run(state,{type:'review',scores:{...scores,domain:2},reason:'依据调整评分'});
  assert.equal(state.reviews.length,2);assert.equal(state.reviews[0].scores.domain,0);
  assert.equal(state.tasks.length,3);assert.equal(state.verifications.length,2);
  assert.equal(goalStatus(state,state.goals[0]),'来源需复核');
  assert.equal(diagnosisValid(state,state.diagnoses[1]),false);
  const before=state.goals[0];state=run(state,{type:'reconfirm-goal',id:'G-1'});assert.deepEqual(state.goals[0],before);
  for(const id of ['quantity','domain'])state=run(state,{type:'diagnosis',id,decision:'confirmed',note:'按新评价重新核对'});
  state=run(state,{type:'reconfirm-goal',id:'G-1'});
  assert.equal(goalSourceValid(state,state.goals[0]),true);assert.equal(goalPasses(state,state.goals[0]),0);
  assert.equal(state.tasks.length,3);assert.equal(state.verifications.length,2);
});
test('excluded diagnoses do not seed new goals, and excluding an existing source keeps its downstream work',()=>{
  let state=reviewed();state=run(state,{type:'diagnosis',id:'domain',decision:'rejected',note:'证据不够'});
  state=run(state,{type:'diagnosis',id:'quantity',decision:'confirmed',note:'本次作答支持'});
  state=run(state,{type:'create-goal',due:'2026-09-22'});assert.deepEqual(state.goals[0].sourceIds,['quantity']);
  state=planReady();state=run(state,{type:'diagnosis',id:'domain',decision:'rejected',note:'重新判断排除'});
  assert.equal(goalStatus(state,state.goals[0]),'来源需复核');assert.equal(state.tasks.length,3);
});
test('repeat goal and plan generation preserves manual edits',()=>{
  let state=planReady();state=run(state,{type:'save-goal',goal:{...state.goals[0],title:'教师自己修改的目标'}});
  state=run(state,{type:'save-task',task:{...state.tasks[0],date:'2026-09-18'}});
  state=run(state,{type:'create-goal',due:'2026-09-30'});state=run(state,{type:'create-plan',id:'G-1',dates:['x','y','z']});
  assert.equal(state.goals.length,1);assert.equal(state.goals[0].title,'教师自己修改的目标');
  assert.equal(state.tasks.length,3);assert.equal(state.tasks[0].date,'2026-09-18');
});
test('completion and skipping never imply goal attainment; skipping requires a reason',()=>{
  let state=planReady();
  assert.equal(run(state,{type:'save-task',task:{...state.tasks[0],status:'skipped',note:''}}).tasks[0].status,'pending');
  for(const task of state.tasks)state=run(state,{type:'save-task',task:{...task,status:'done'}});
  assert.equal(state.tasks.filter(t=>t.status==='done').length,3);assert.equal(goalStatus(state,state.goals[0]),'待验证');
});
test('attainment needs two distinct current-standard attempts; corrections revoke attainment but keep history',()=>{
  let state=goalReady();state=verify(state,'DEMO-A');assert.equal(state.verifications.length,0);
  state=verify(verify(state,'DEMO-B'),'DEMO-B');assert.equal(goalPasses(state,state.goals[0]),1);
  assert.equal(currentVerifications(state,state.goals[0]).length,1);assert.equal(goalStatus(state,state.goals[0]),'待验证');
  state=verify(state,'DEMO-C',{quantity:'pass',domain:'retry'});assert.equal(goalPasses(state,state.goals[0]),1);
  state=verify(state,'DEMO-C');assert.equal(goalStatus(state,state.goals[0]),'已达成');assert.equal(state.audit.length,1);
  state=verify(state,'DEMO-C',{quantity:'pass',domain:'retry'});assert.equal(goalStatus(state,state.goals[0]),'需重新验证');assert.equal(state.verifications.length,5);assert.equal(state.audit.length,1);
});
test('changing criteria invalidates earlier checks while title and date changes preserve them',()=>{
  let state=verify(verify(goalReady(),'DEMO-B'),'DEMO-C');
  state=run(state,{type:'save-goal',goal:{...state.goals[0],title:'新名称',due:'2026-09-30'}});assert.equal(goalStatus(state,state.goals[0]),'已达成');
  state=run(state,{type:'save-goal',goal:{...state.goals[0],criteria:state.goals[0].criteria.map(c=>({...c,text:c.text+' 口头解释。'}))}});
  assert.equal(goalStatus(state,state.goals[0]),'需重新验证');assert.equal(state.verifications.length,2);assert.equal(goalPasses(state,state.goals[0]),0);
});
test('task ordering is bounded, pause preserves records and reset clears all stages',()=>{
  let state=planReady();const first=state.tasks[0].id;
  assert.deepEqual(run(state,{type:'move-task',id:first,offset:-1}).tasks,state.tasks);
  state=run(state,{type:'move-task',id:first,offset:1});assert.equal(state.tasks[1].id,first);
  state=run(state,{type:'goal-mode',id:'G-1',mode:'paused'});assert.equal(goalStatus(state,state.goals[0]),'已暂停');assert.equal(state.tasks.length,3);
  assert.equal(verify(state,'DEMO-B').verifications.length,0);
  assert.deepEqual(run(state,{type:'reset'}),createLearningState());
});
test('reconfirming an excluded diagnosis cannot silently restore an achieved goal',()=>{
  let state=verify(verify(goalReady(),'DEMO-B'),'DEMO-C');
  state=run(state,{type:'diagnosis',id:'domain',decision:'rejected',note:'需要复查'});
  state=run(state,{type:'diagnosis',id:'domain',decision:'confirmed',note:'复查后确认'});
  assert.equal(goalStatus(state,state.goals[0]),'来源需复核');
  state=run(state,{type:'reconfirm-goal',id:'G-1'});
  assert.equal(goalStatus(state,state.goals[0]),'需重新验证');assert.equal(goalPasses(state,state.goals[0]),0);
  const version=state.goals[0].version;
  state=run(state,{type:'diagnosis',id:'domain',decision:'confirmed',note:'复查后确认'});
  assert.equal(goalSourceValid(state,state.goals[0]),true);assert.equal(state.goals[0].version,version);
});
test('task editor cannot bypass paused-goal status restrictions but can reschedule',()=>{
  let state=planReady();state=run(state,{type:'goal-mode',id:'G-1',mode:'paused'});
  let next=run(state,{type:'save-task',task:{...state.tasks[0],status:'done'}});
  assert.equal(next.tasks[0].status,'pending');
  next=run(state,{type:'save-task',task:{...state.tasks[0],date:'2026-09-19',note:'重新安排'}});
  assert.equal(next.tasks[0].date,'2026-09-19');assert.equal(next.tasks[0].note,'重新安排');
});
