import test from 'node:test';
import assert from 'node:assert/strict';
import { main, api, h, render, noop, rail, classRail } from './review-p17-harness.mjs';
const cases = [
  ['QuestionRail', rail], ['QuestionRail', {...rail, sections: []}],
  ['QuestionRailClass', classRail], ['QuestionRailClass', {...classRail, bodyOnly: true}],
  ['QuestionRailClass', {...classRail, sections: classRail.sections.map(s => ({...s, items: s.items.map(item => ({...item, marker: true}))}))}],
  ...[{}, ...api.scoreReviewFixtures.map(f => f.props), {points:[{id:'p1',label:'推导',score:2,maxScore:4}], reasonOptions:[{id:'other',label:'其他',isOther:true}], selectedReasonId:'other', unanswered:false, reason:'已核对'}].map(props => ['ScoreReview', {...api.scoreReviewBase, ...props, onSave:noop}]),
  ...[{}, {editing:true,draft:{category:'other',explanation:''}}, {editing:true,draft:{category:'other',explanation:'理由'},state:{kind:'failed',reason:'失败'}}, {state:{kind:'saving'}}, {value:null}].map(props => ['ErrorCauseReview', {categories:api.errorCauseReviewCategories,value:api.errorCauseReviewValue,history:api.errorCauseReviewHistory,onSave:noop,onEdit:noop,onChange:noop,...props}]),
  ...[{},api.studentPaperReportFixture,api.studentPaperReportPartialFixture].map(props => ['StudentPaperReport',props]),
];
for (const [index,[name,props]] of cases.entries()) test(`P17 exact main bytes, omitted and explicit defaults: ${name} ${index}`,()=>{
  const baseline=render(h(main[name],props));
  assert.equal(render(h(api[name],props)),baseline);
  if (!name.startsWith('Question')) {
    assert.equal(render(h(api[name],{...props,density:undefined})),baseline);
    assert.equal(render(h(api[name],{...props,density:'default',...(name==='ScoreReview'?{showIdentity:true,sectionsDefaultOpen:undefined,standardAnswer:undefined}:{})})),baseline);
  }
});
for(const name of ['QuestionRailDemo','ScoreReviewDemo','ScoreReviewReasonReceiptDemo','ErrorCauseReviewDemo','StudentPaperReportDemo']) test(`P17 existing demo exact main bytes: ${name}`,()=>assert.equal(render(h(api[name])),render(h(main[name]))));
