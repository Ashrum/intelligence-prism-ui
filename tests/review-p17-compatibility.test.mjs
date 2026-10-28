import { assertP121Migration } from './helpers/p121-freeze-compat.mjs';
import { assertControlSizingOnly, normalizeControlSizing } from './prism-control-sizing-compat.mjs';
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
for (const [index,[name,props]] of cases.entries()) test(`P17 main bytes except P31 control sizing, omitted and explicit defaults: ${name} ${index}`,()=>{
  const baseline=render(h(main[name],props));
  // Only the two visible explanation-field states changed in P121 (#84).
  const compare = name === 'ErrorCauseReview' && [14, 15].includes(index)
    ? (actual, original) => assertP121Migration(normalizeControlSizing(actual), normalizeControlSizing(original), `P17/${name}/${index}`)
    : assertControlSizingOnly;
  (name.startsWith('QuestionRail') ? assert.equal : compare)(render(h(api[name],props)),baseline);
  if (!name.startsWith('Question')) {
    compare(render(h(api[name],{...props,density:undefined})),baseline);
    compare(render(h(api[name],{...props,density:'default',...(name==='ScoreReview'?{showIdentity:true,sectionsDefaultOpen:undefined,standardAnswer:undefined}:{})})),baseline);
  }
});
for(const name of ['QuestionRailDemo','ScoreReviewDemo','ScoreReviewReasonReceiptDemo','ErrorCauseReviewDemo','StudentPaperReportDemo']) test(`P17 existing demo main bytes except P31 control sizing: ${name}`,()=>{
  if (name === 'ErrorCauseReviewDemo') assertP121Migration(normalizeControlSizing(render(h(api[name]))), normalizeControlSizing(render(h(main[name]))), `P17/demo/${name}`);
  else (name==='QuestionRailDemo' ? assert.equal : assertControlSizingOnly)(render(h(api[name])),render(h(main[name])));
});
