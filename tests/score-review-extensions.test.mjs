import test from 'node:test';
import assert from 'node:assert/strict';
import { api, capture, button } from './score-review-harness.mjs';

const points = [
  { id: 'p1', label: '配方步骤', maxScore: 4, score: 4 },
  { id: 'p2', label: '取等条件', maxScore: 6, score: 2.5, uncertain: true },
];
const options = [{ id: 'missed', label: '作答步骤正确，AI 漏判' }, { id: 'other', label: '其他', isOther: true }];
const base = { points, pointStep: .5, requireReasonOnChange: false };
const save = out => button(out, '保存并处理下一份');
const shortcut = out => out.nodes.find(n => n.props['data-score-review'] !== undefined).props.onKeyDown({ key: 'Enter', ctrlKey: true, nativeEvent: {}, preventDefault() {} });

test('P16 points derive an exact total, emit a controlled replacement and never edit total or save on change', () => {
  const calls = [], out = capture({ ...base, score: 99, quickScores: [0, 10], onPointsChange: v => calls.push(v), onSave: v => calls.push(v) });
  assert.match(out.html, /评分点合计/); assert.match(out.html, /6.5 \/ 10 分/);
  assert.doesNotMatch(out.html, /快捷给分|id="[^"]*-score"/);
  const inputs = out.nodes.filter(n => n.type === api.NumberField);
  assert.equal(inputs.length, 2); assert.equal(inputs[1].props.step, .5);
  const numericInputs = [...out.html.matchAll(/<input\b[^>]*data-slot="number-field-input"[^>]*>/g)].map(match => match[0]);
  assert.equal(numericInputs.length, 2);
  for (const input of numericInputs) {
    const labelId = input.match(/aria-labelledby="([^"]+)"/)[1];
    const inputId = input.match(/\bid="([^"]+)"/)[1];
    assert.ok(out.html.includes(`id="${labelId}"`)); assert.ok(out.html.includes(`for="${inputId}"`));
  }
  inputs[1].props.onValueChange(3.2);
  assert.deepEqual(calls, [[points[0], { ...points[1], score: 3 }]]);
  assert.match(capture({ ...base }).html, /6.5 \/ 10 分/);
  save(out).props.onClick();
  assert.deepEqual(calls[1], { score: 6.5, reason: '', points });
});

test('P16 missing, invalid and overflowing point values do not become zero or permit save', () => {
  for (const bad of [[], [{ ...points[0], score: null }], [{ ...points[0], score: NaN }], [{ ...points[0], score: 7 }], [{ ...points[0], score: 1.3 }], [{ ...points[0], maxScore: -1 }], [points[0], points[0]]]) {
    let calls = 0;
    const out = capture({ ...base, points: bad, onSave: () => calls++ });
    assert.equal(save(out).props.disabled, true); save(out).props.onClick(); assert.equal(calls, 0);
  }
  assert.equal(save(capture({ ...base, maxScore: 5 })).props.disabled, true);
  const decimal = capture({ ...base, maxScore: 1, pointStep: .1, points: [{ id: 'a', label: '甲', maxScore: .5, score: .1 }, { id: 'b', label: '乙', maxScore: .5, score: .2 }] });
  assert.match(decimal.html, /0.3 \/ 1 分/); assert.equal(save(decimal).props.disabled, false);
});

test('P16 read-only points expose check, uncertainty and dot with readable scores', () => {
  const out = capture({ ...base, pointsReadOnly: true, points: [...points, { id: 'p3', label: '结论', maxScore: 1, score: 0 }], maxScore: 11 });
  assert.equal(out.nodes.filter(n => n.type === api.NumberField).length, 0);
  for (const label of ['满分', '存疑', '未得满分', '4 / 4 分', '2.5 / 6 分', '0 / 1 分']) assert.ok(out.html.includes(label), label);
  assert.match(capture({ ...base, points: [{ ...points[0], score: null }] }).html, /aria-label="评分未提供"/);
});

test('P16 preset reason selection fills the one existing textarea; other requires nonblank text', () => {
  const calls = [], props = { requireReasonOnChange: false, reasonOptions: options, requireReasonSelection: true, selectedReasonId: null, reason: '', onReasonSelect: v => calls.push(['select', v]), onReasonChange: v => calls.push(['reason', v]) };
  let out = capture(props);
  assert.equal((out.html.match(/<textarea\b/g) || []).length, 1);
  assert.equal(save(out).props.disabled, true); assert.match(out.html, /请选择修改理由/);
  const group = out.nodes.find(n => n.props['aria-label'] === '预置修改理由');
  group.props.onValueChange('missed'); assert.deepEqual(calls, [['select', 'missed'], ['reason', options[0].label]]);
  out = capture({ ...props, selectedReasonId: 'missed' });
  assert.equal(out.reason.props.value, options[0].label); assert.equal(out.reason.props.readOnly, true); assert.equal(save(out).props.disabled, false);
  out = capture({ ...props, selectedReasonId: 'other', reason: '  ' });
  assert.equal(out.reason.props.required, true); assert.equal(save(out).props.disabled, true);
  out = capture({ ...props, selectedReasonId: 'other', reason: '  补充核对依据  ', onSave: d => calls.push(d) });
  save(out).props.onClick(); assert.deepEqual(calls.at(-1), { score: 6, reason: '补充核对依据', reasonOptionId: 'other' });
  assert.equal(save(capture({ ...props, selectedReasonId: 'obsolete' })).props.disabled, true);
});

test('P16 unanswered displays zero without destroying point drafts and can be revoked', () => {
  const calls = [], props = { ...base, unanswered: true, onUnansweredChange: v => calls.push(v), onSave: v => calls.push(v), onAcceptAi: () => assert.fail('unanswered accepted AI') };
  const out = capture(props);
  assert.match(out.html, /0 \/ 10 分/); assert.match(out.html, /未作答/);
  for (const n of out.nodes.filter(n => n.type === api.NumberField)) assert.equal(n.props.disabled, true);
  button(out, '撤销未作答').props.onClick(); button(out, '接受 AI 建议').props.onClick(); save(out).props.onClick();
  assert.deepEqual(calls, [false, { score: 0, reason: '', points, unanswered: true }]);
  assert.match(capture({ ...props, unanswered: false }).html, /6.5 \/ 10 分/);
  const disabled = capture({ ...props, unansweredDisabledReason: '作答证据正在核对' });
  const undo = button(disabled, '撤销未作答'); assert.equal(undo.props.disabled, true); assert.match(disabled.html, /作答证据正在核对/); undo.props.onClick(); assert.equal(calls.length, 2);
});

test('P16 action labels preserve callbacks and saveDisabledReason gates clicks, retries and shortcuts only', () => {
  for (const state of [{ kind: 'ready' }, { kind: 'failed', reason: '离线' }]) {
    const calls = [], props = { state, score: 6, shortcuts: true, actionLabels: { save: '保存并看下一份', retry: '重新提交', accept: '采纳 6 分 · 下一题', previous: '上一份', skip: '稍后处理' }, saveDisabledReason: '已保存；调整后可再次保存并留痕。', onSave: v => calls.push(v), onRetry: v => calls.push(v), onSkip: () => calls.push('skip'), onPrev: () => calls.push('prev') };
    const out = capture(props), primary = button(out, state.kind === 'ready' ? props.actionLabels.save : props.actionLabels.retry);
    assert.equal(primary.props.disabled, true); primary.props.onClick(); shortcut(out); assert.deepEqual(calls, []);
    assert.match(out.html, /已保存；调整后可再次保存并留痕/); assert.doesNotMatch(out.html, /保存操作未提供/);
    assert.equal(out.number.props.disabled, false); button(out, '稍后处理').props.onClick(); assert.deepEqual(calls, ['skip']);
  }
});

test('P16 scoreReadOnly removes editable total and quick scores while preserving reasons and save', () => {
  const calls = [], out = capture({ scoreReadOnly: true, score: 7, reason: '复核依据', quickScores: [0, 10], onSave: d => calls.push(d), onScoreChange: () => assert.fail('readonly total changed') });
  assert.equal(out.number, undefined); assert.doesNotMatch(out.html, /快捷给分/); assert.match(out.html, /7 \/ 10 分/);
  assert.equal(out.reason.props.disabled, false); save(out).props.onClick();
  assert.deepEqual(calls, [{ score: 7, reason: '复核依据' }]);
  const half = capture({ scoreReadOnly: true, score: 6.5, step: 1, requireReasonOnChange: false, onSave: d => calls.push(d) });
  assert.match(half.html, /6.5 \/ 10 分/); save(half).props.onClick(); assert.equal(calls.at(-1).score, 6.5);
  for (const score of [-1, 11, NaN, Infinity]) {
    const invalid = capture({ scoreReadOnly: true, score, onSave: () => assert.fail('invalid readonly score saved') });
    assert.equal(save(invalid).props.disabled, true); save(invalid).props.onClick();
  }
});

test('P16 saving, saved and external locks suppress all new draft handlers including direct probes', () => {
  for (const extra of [{ state: { kind: 'saving' } }, { state: { kind: 'saved', score: 6 } }, { disabledReason: '依据已变化' }]) {
    const fail = () => assert.fail('locked intent');
    const out = capture({ ...base, ...extra, unanswered: false, onUnansweredChange: fail, reasonOptions: options, selectedReasonId: 'other', reason: '保留输入', onReasonSelect: fail, onReasonChange: fail, onPointsChange: fail });
    for (const n of out.nodes.filter(n => n.type === api.NumberField)) n.props.onValueChange(1);
    out.nodes.find(n => n.props['aria-label'] === '预置修改理由').props.onValueChange('missed');
    button(out, '标记为未作答').props.onClick(); out.reason.props.onChange({ target: { value: '改变' } });
  }
});
