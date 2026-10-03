import test from 'node:test';
import assert from 'node:assert/strict';
import { toValidatedNumber } from '../node_modules/@base-ui/react/number-field/utils/validate.js';
import { api, probe, focusProbe, capture, button, h, render } from './score-review-harness.mjs';

test('score normalization clamps range and snaps 0.5 steps without floating drift or invented empty values', () => {
  for (const [value, max, step, expected] of [[-4,10,.5,0],[15,10,.5,10],[6.3,10,.5,6.5],[.3,1,.1,.3],[10,9.5,1,9.5],[10,10,.3,10],[null,10,1,null],[NaN,10,1,null],[6,NaN,1,null],[6,10,0,null]]) assert.equal(api.normalizeReviewScore(value,max,step), expected);
  const values = [], out = capture({ onScoreChange: v => values.push(v), step: .5 });
  for (const value of [-3,11,6.3,null]) out.number.props.onValueChange(value);
  assert.deepEqual(values, [0,10,6.5,null]);
});

test('NumberField directional stepping reaches adjacent legal scores and both endpoints', () => {
  // Exercise the pinned NumberField validator with the actual component props,
  // then its onValueChange handler; this is not a browser keyboard/pointer test.
  for (const [maxScore, step, start, direction, expected] of [
    [10,.3,10,-1,9.9], [10,.3,9.9,-1,9.6], [10,.3,9.9,1,10],
    [9.2,1,9.2,-1,9], [9.2,1,9,1,9.2],
    [10,.5,10,-1,9.5], [10,.3,0,1,.3], [10,.3,.3,-1,0],
    [10,.3,0,-1,0], [10,.3,10,1,10],
  ]) {
    const values = [], out = capture({ maxScore, step, score: start, onScoreChange: value => values.push(value) });
    const p = out.number.props;
    const next = toValidatedNumber(p.value + direction * p.step, direction * p.step, p.min, p.max, p.min, undefined, p.snapOnStep, false, true);
    p.onValueChange(next);
    assert.deepEqual(values, [expected], `${start} ${direction > 0 ? '+' : '-'} ${step}, max ${maxScore}`);
    assert.equal(capture({ maxScore, step, score: start }).number.props.value, start);
  }
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

test('standalone panel preserves shared reviewer/queue APIs; multiline heights override desktop', () => {
  const out = capture();
  assert.doesNotMatch(out.html, /data-paper-preview|data-score-review-paper|data-review-continuous/);
  for (const b of out.buttons) { assert.match(b.props.className,/h-auto sm:h-auto/); assert.doesNotMatch(render(b),/sm:h-8(?:\s|")/); }
  assert.match(render(h(api.AgentItemReviewer,{item:{id:'i',title:'旧复核器',version:'v1'},review:{state:'waiting-human',description:'待确认'},checkpoints:[],summary:'摘要'})),/旧复核器/);
  assert.match(render(h(api.AgentReviewQueue,{title:'旧复核队列',queue:{id:'q',version:'v1'},items:[]})),/旧复核队列/);
});

test('all review actions including history and retry retain 44px minimum and multiline sizing', () => {
  for (const state of [{kind:'ready'}, {kind:'failed',reason:'连接中断'}]) {
    const out = capture({ state, history: [], onPrev() {}, onSkip() {}, onRetry() {} });
    const actions = [...out.html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)]
      .filter(([, , content]) => /接受 AI 建议|保存并处理下一份|重试保存|上一题|跳过|历史记录/.test(content));
    assert.equal(actions.length, 5);
    for (const [, attrs] of actions) {
      const classes = attrs.match(/class="([^"]*)"/)[1].split(' ');
      for (const name of ['min-h-11','h-auto','sm:h-auto','whitespace-normal']) assert.ok(classes.includes(name), name);
      assert.ok(!classes.includes('sm:h-8'));
    }
    const primary = button(out, state.kind === 'ready' ? '保存并处理下一份' : '重试保存');
    assert.match(render(primary), /bg-primary /);
    for (const action of out.buttons) assert.equal(action.props.size ?? 'default', 'default');
  }
});

test('requireReason gates unchanged scores, save and retry, shows the field and links the blocking reason', () => {
  for (const state of [{kind:'ready'}, {kind:'failed',reason:'离线'}]) {
    const calls = [], label = state.kind === 'ready' ? '保存并处理下一份' : '重试保存';
    const props = { state, score:6, baselineScore:6, showReason:false, requireReasonOnChange:false, requireReason:true, onSave:d=>calls.push(d), onRetry:d=>calls.push(d) };
    for (const reason of ['', ' \n\t ']) {
      const out = capture({...props,reason}), save = button(out,label);
      assert.equal(out.reason.props.required,true);
      assert.equal(save.props.disabled,true); save.props.onClick();
      const gate = out.nodes.find(n=>n.props.id===save.props['aria-describedby']);
      assert.equal(gate.props.children,'请填写修改理由。');
      assert.equal(out.reason.props['aria-describedby'],gate.props.id);
    }
    assert.equal(calls.length,0);
    const out = capture({...props,reason:'  维持原评分  '});
    assert.equal(button(out,label).props.disabled,false); button(out,label).props.onClick();
    assert.deepEqual(calls,[{score:6,reason:'维持原评分'}]);
  }
  for (const requireReason of [undefined,false]) {
    const out = capture({requireReason,requireReasonOnChange:false,showReason:false,reason:''});
    assert.equal(out.reason,undefined);
    assert.equal(button(out,'保存并处理下一份').props.disabled,false);
  }
});

test('lastSaved is a host-controlled polite receipt independent of draft score and editing state', () => {
  const props = { score:8, reason:'复核完成', lastSaved:{score:7,label:'上一题'} };
  const out = capture(props), receipt = out.nodes.find(n=>n.props['data-score-review-receipt'] !== undefined);
  const receiptHtml = render(receipt);
  assert.match(receiptHtml,/role="status" aria-live="polite" aria-atomic="true"/);
  assert.match(receiptHtml,/上一题：已保存 7 分，审计记录已更新/);
  assert.doesNotMatch(receiptHtml,/role="alert"|已保存 8 分/);
  assert.equal(out.number.props.disabled,false); assert.equal(button(out,'保存并处理下一份').props.disabled,false);
  button(out,'保存并处理下一份').props.onClick();
  assert.equal(capture(props).html,out.html);
  assert.doesNotMatch(capture({...props,lastSaved:undefined}).html,/已保存 7 分|审计记录已更新/);
  assert.match(capture({...props,lastSaved:{score:0}}).html,/已保存 0 分，审计记录已更新/);
  const both = capture({...props,state:{kind:'saved',score:7,auditUpdated:true}});
  assert.equal((both.html.match(/已保存 7 分/g)||[]).length,1);
  assert.equal(both.number.props.disabled,true);
});

test('question identity transitions focus only when enabled, never on initial mount, edits or enabling alone', t => {
  let calls = 0;
  globalThis.__scoreFocus = { index:0, refs:[], effects:[], focus:()=>calls++ };
  t.after(()=>delete globalThis.__scoreFocus);
  const show = p => capture(p,focusProbe);
  let out = show({questionId:'a',focusOnQuestionChange:true});
  assert.equal(calls,0); assert.equal(out.nodes.find(n=>n.type==='h2').props.tabIndex,-1);
  show({questionId:'a',focusOnQuestionChange:true,score:8,questionLabel:'更正标签'}); assert.equal(calls,0);
  show({questionId:'b',focusOnQuestionChange:true}); assert.equal(calls,1);
  show({questionId:'b',focusOnQuestionChange:true,lastSaved:{score:6}}); assert.equal(calls,1);
  out = show({questionId:'c'}); assert.equal(calls,1); assert.equal(out.nodes.find(n=>n.type==='h2').props.tabIndex,undefined);
  show({questionId:'c',focusOnQuestionChange:true}); assert.equal(calls,1);
  show({questionId:undefined,focusOnQuestionChange:true}); assert.equal(calls,1);
  show({questionId:'d',focusOnQuestionChange:true}); assert.equal(calls,2);
});

test('numeric input itself keeps 44px sizing at base and sm, and required receipt example is present', () => {
  const input = capture().html.match(/<input\b[^>]*data-slot="number-field-input"[^>]*>/)?.[0];
  assert.ok(input);
  const classes = input.match(/class="([^"]*)"/)[1].split(' ');
  for (const cls of ['min-h-11','h-11','sm:h-11']) assert.ok(classes.includes(cls),cls);
  assert.ok(!classes.includes('h-8.5')); assert.ok(!classes.includes('sm:h-7.5'));
  const html = render(h(api.ScoreReviewReasonReceiptDemo));
  assert.match(html,/score-required-receipt/); assert.match(html,/请填写修改理由。/);
  assert.match(html,/载入预设回执/); assert.match(html,/切换题项（焦点交接）/);
  assert.doesNotMatch(html,/已保存 \d+ 分/);
});

test('P1 quick scores filter invalid steps and duplicates; controlled/local drafts never save', t => {
  assert.deepEqual(api.filterQuickScores([0,0,5,10,-1,11,NaN,1.3],10,.5),[0,5,10]);
  assert.deepEqual(api.filterQuickScores([0,9.5],9.5,1),[0]);
  assert.deepEqual(api.filterQuickScores([.3,.6],1,.1),[.3,.6]);
  assert.deepEqual(api.filterQuickScores([0],10,0),[]);
  globalThis.__scoreState={index:0,values:[]}; t.after(()=>delete globalThis.__scoreState);
  const calls=[], props={quickScores:[0,5,10],onScoreChange:v=>calls.push(v),onSave:()=>assert.fail('quick score saved')};
  let out=capture(props,probe); assert.match(out.html,/role="group" aria-label="快捷给分"/);
  button(out,'满分 10').props.onClick(); out=capture(props,probe);
  assert.equal(out.number.props.value,10); assert.equal(button(out,'满分 10').props['aria-pressed'],true);
  assert.match(button(out,'0 分').props.className,/min-h-12/);
  button(capture({...props,score:6}),'0 分').props.onClick(); assert.equal(capture({...props,score:6}).number.props.value,6);
  button(capture({...props,state:{kind:'saving'}}),'5 分').props.onClick(); assert.deepEqual(calls,[10,0]);
});
const shortcut=(out,key,mods={})=>out.nodes.find(n=>n.props['data-score-review']!==undefined).props.onKeyDown({key,ctrlKey:false,metaKey:false,altKey:false,shiftKey:false,nativeEvent:{isComposing:false},preventDefault(){},...mods});
test('P1 shortcuts use component scope, exact click gates, retries and composition guard',()=>{
  let calls=[]; const props={shortcuts:true,onSave:v=>calls.push(['save',v]),onRetry:v=>calls.push(['retry',v]),onAcceptAi:v=>calls.push(['ai',v]),onPrev:()=>calls.push('prev'),onSkip:()=>calls.push('skip')};
  for(const extra of [{requireReason:true},{score:7,reason:' '},{state:{kind:'saving'}},{state:{kind:'saved',score:6}},{disabledReason:'锁定'},{maxScore:NaN},{score:null}]) shortcut(capture({...props,...extra}),'Enter',{ctrlKey:true});
  assert.deepEqual(calls,[]);
  const out=capture(props); shortcut(out,'Enter',{ctrlKey:true}); shortcut(out,'Enter',{metaKey:true}); shortcut(out,'a',{altKey:true});shortcut(out,'ArrowLeft',{altKey:true});shortcut(out,'ArrowRight',{altKey:true});
  assert.deepEqual(calls.map(v=>Array.isArray(v)?v[0]:v),['save','save','ai','prev','skip']);
  calls=[];
  for(const extra of [{state:{kind:'saving'}},{disabledReason:'锁定'}]) for(const key of ['a','ArrowLeft','ArrowRight'])shortcut(capture({...props,...extra}),key,{altKey:true});
  shortcut(out,'Enter',{ctrlKey:true,nativeEvent:{isComposing:true}});shortcut(out,'a',{altKey:true,nativeEvent:{isComposing:true}});shortcut(out,'Enter',{ctrlKey:true,repeat:true});
  assert.deepEqual(calls,[]);
  shortcut(capture({...props,state:{kind:'failed',reason:'服务不可用'}}),'Enter',{metaKey:true});assert.equal(calls[0][0],'retry');
  calls=[]; shortcut(capture({...props,onAcceptAi:undefined,onSave:undefined,onPrev:undefined,onSkip:undefined}),'a',{altKey:true}); assert.deepEqual(calls,[]);
  assert.match(out.html,/<kbd/);assert.doesNotMatch(capture().html,/<kbd|快捷给分/);
  assert.equal(capture().nodes.find(n=>n.props['data-score-review']!==undefined).props.onKeyDown,undefined);
});
