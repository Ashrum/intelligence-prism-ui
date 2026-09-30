import test from 'node:test';
import assert from 'node:assert/strict';
import { api, probe, capture, button, h, render } from './score-review-harness.mjs';

test('score normalization clamps range and snaps 0.5 steps without floating drift or invented empty values', () => {
  for (const [value, max, step, expected] of [[-4,10,.5,0],[15,10,.5,10],[6.3,10,.5,6.5],[.3,1,.1,.3],[10,9.5,1,9.5],[10,10,.3,10],[null,10,1,null],[NaN,10,1,null],[6,NaN,1,null],[6,10,0,null]]) assert.equal(api.normalizeReviewScore(value,max,step), expected);
  const values = [], out = capture({ onScoreChange: v => values.push(v), step: .5 });
  for (const value of [-3,11,6.3,null]) out.number.props.onValueChange(value);
  assert.deepEqual(values, [0,10,6.5,null]);
});

test('controlled score/reason and accept AI emit exact intents without changing host values or receipts', () => {
  const calls = [], props = { score: 7, reason: '关键推导完整', onScoreChange: v => calls.push(['score',v]), onAcceptAi: v => calls.push(['accept',v]), onSave: v => calls.push(['save',v]), onReasonChange: v => calls.push(['reason',v]) };
  const out = capture(props);
  button(out,'接受 AI 建议').props.onClick(); out.reason.props.onChange({ target: { value: '补充依据' } }); button(out,'保存并处理下一份').props.onClick();
  assert.deepEqual(calls, [['score',6],['accept',6],['reason','补充依据'],['save',{score:7,reason:'关键推导完整'}]]);
  assert.equal(capture(props).number.props.value, 7); assert.equal(capture(props).reason.props.value, '关键推导完整');
  assert.doesNotMatch(out.html, /审计记录已更新|已保存 7 分/);
});

test('uncontrolled score/reason persist draft changes and accepting a suggestion does not save', t => {
  globalThis.__scoreState = { index: 0, values: [] }; t.after(() => delete globalThis.__scoreState);
  let out = capture({ defaultScore: 6, step:.5 }, probe);
  out.number.props.onValueChange(7.5); out.reason.props.onChange({ target: { value: '推导完整' } });
  out = capture({ step:.5 }, probe); assert.equal(out.number.props.value,7.5); assert.equal(out.reason.props.value,'推导完整');
  button(out,'接受 AI 建议').props.onClick(); out = capture({ step:.5 }, probe);
  assert.equal(out.number.props.value,6); assert.doesNotMatch(out.html,/审计记录已更新/);
});

test('reason policy gates both save and failed retry, including whitespace and missing baseline', () => {
  let calls = 0;
  for (const state of [{kind:'ready'},{kind:'failed',reason:'服务不可用'}]) {
    const label = state.kind === 'ready' ? '保存并处理下一份' : '重试保存';
    const props = { state, score:7, reason:'  ', onSave:()=>calls++, onRetry:()=>calls++ };
    let out = capture(props); assert.equal(button(out,label).props.disabled,true); button(out,label).props.onClick();
    assert.match(out.html,/调整分数后，请填写修改理由/);
    out = capture({...props,reason:'核对完成'}); assert.equal(button(out,label).props.disabled,false); button(out,label).props.onClick();
  }
  assert.equal(calls,2);
  assert.equal(button(capture({score:6,reason:''}),'保存并处理下一份').props.disabled,false);
  assert.equal(button(capture({score:7,reason:'',requireReasonOnChange:false}),'保存并处理下一份').props.disabled,false);
  assert.equal(button(capture({score:7,aiSuggestion:undefined}),'保存并处理下一份').props.disabled,true);
  assert.equal(button(capture({score:7,baselineScore:7}),'保存并处理下一份').props.disabled,false);
});

test('saving locks all editing and navigation handlers; saved feedback uses receipt not current input', () => {
  let calls = 0; const callback = () => calls++;
  const out = capture({state:{kind:'saving'},onScoreChange:callback,onReasonChange:callback,onAcceptAi:callback,onSave:callback,onPrev:callback,onSkip:callback});
  assert.equal(out.number.props.disabled,true); assert.equal(out.reason.props.disabled,true);
  for (const b of out.buttons) { assert.equal(b.props.disabled,true); b.props.onClick(); }
  out.number.props.onValueChange(8); out.reason.props.onChange({target:{value:'x'}}); assert.equal(calls,0);
  assert.match(out.html,/aria-busy="true"/);
  const saved = capture({score:8,state:{kind:'saved',score:6,auditUpdated:true}});
  assert.match(saved.html,/已保存 6 分，审计记录已更新/); assert.doesNotMatch(saved.html,/已保存 8 分/);
  assert.match(capture({state:{kind:'saved',score:6}}).html,/审计记录状态未提供/);
});

test('failure retry and navigation are intents, missing handlers and invalid suggestions cannot execute', () => {
  const calls = [], props = { state:{kind:'failed',reason:'连接已中断'}, onRetry:d=>calls.push(d), onPrev:()=>calls.push('prev'),onSkip:()=>calls.push('skip') };
  const out = capture(props); assert.match(out.html,/保存失败：连接已中断/);
  for (const label of ['重试保存','上一题','跳过']) button(out,label).props.onClick();
  assert.deepEqual(calls,[{score:6,reason:''},'prev','skip']); assert.equal(capture(props).html,out.html);
  assert.equal(button(capture({state:props.state}),'重试保存').props.disabled,true);
  assert.equal(button(capture({onSave:undefined}),'保存并处理下一份').props.disabled,true);
  for (const score of [-1,11,6.5,NaN]) { const bad = capture({aiSuggestion:{score},onAcceptAi:()=>assert.fail('invalid AI accepted')}); assert.equal(button(bad,'接受 AI 建议').props.disabled,true); button(bad,'接受 AI 建议').props.onClick(); }
});

test('unknown confidence is explicit and no low-confidence label is computed', () => {
  for (const confidencePercent of [undefined,null,NaN,-1,101]) assert.match(capture({confidencePercent}).html,/置信度 未提供/);
  assert.match(capture({confidencePercent:0,confidenceLabel:undefined}).html,/置信度 0%/);
  assert.match(capture({confidencePercent:62,confidenceLabel:undefined}).html,/置信度 62%/);
  assert.doesNotMatch(capture({confidencePercent:62,confidenceLabel:undefined}).html,/低置信度/);
});

test('empty score, invalid scale and host disabled reason prevent submission and disclose why', () => {
  for (const props of [{score:null},{maxScore:-1},{step:0},{disabledReason:'评分依据版本已变化'}]) {
    let saves=0; const out=capture({...props,onSave:()=>saves++});
    const save=button(out,'保存并处理下一份'); assert.equal(save.props.disabled,true); save.props.onClick(); assert.equal(saves,0);
    assert.ok(out.nodes.some(n=>n.props.id===save.props['aria-describedby']));
    if (props.disabledReason) { assert.match(out.html,/评分依据版本已变化/); assert.equal(out.number.props.disabled,true); }
  }
});

test('composition preserves PaperPreview region props and shared reviewer/queue APIs; multiline heights override desktop', () => {
  const paper = {title:'原卷',pages:[{id:'p',regions:[{id:'a',label:'第3题',rect:[8,42,84,24]}]}],selectedRegionId:'a'};
  const out = capture({paper}); assert.deepEqual(out.nodes.find(n=>n.type===api.PaperPreview).props,paper); assert.match(out.html,/data-paper-preview/);
  for (const b of out.buttons) { assert.match(b.props.className,/h-auto sm:h-auto/); assert.doesNotMatch(render(b),/sm:h-8(?:\s|")/); }
  assert.match(render(h(api.AgentItemReviewer,{item:{id:'i',title:'旧复核器',version:'v1'},review:{state:'waiting-human',description:'待确认'},checkpoints:[],summary:'摘要'})),/旧复核器/);
  assert.match(render(h(api.AgentReviewQueue,{title:'旧复核队列',queue:{id:'q',version:'v1'},items:[]})),/旧复核队列/);
});
