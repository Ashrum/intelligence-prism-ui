import test from 'node:test';
import assert from 'node:assert/strict';
import { api, capture, button, h } from './score-review-harness.mjs';

const points = [{ id: 'a', label: '求出解析式', maxScore: 3, score: 3 }, { id: 'b', label: '配方与结论', maxScore: 7, score: 3, uncertain: true }];
const base = { density: 'compact', showIdentity: false, showConfidence: false, showBasis: false, instruction: false, sectionsPlacement: 'bottom', standardAnswer: '配方后得到顶点坐标。', points, requireReasonOnChange: false };
const key = (out, key, extra = {}) => out.nodes.find(n => n.props['data-score-review'] !== undefined).props.onKeyDown({ key, nativeEvent: {}, preventDefault() {}, ...extra });

test('P18 confirm is a suggestion and read-only points with exactly one adoption action', () => {
  const calls = [];
  const out = capture({ ...base, mode: 'confirm', score: 9, reason: '旧编辑草稿', reasonOptions: [{ id: 'other', label: '其他', isOther: true }], selectedReasonId: 'other', requireReasonSelection: true, requireReason: true, unanswered: true, quickScores: [0, 10], onPointsChange: () => assert.fail('confirm edited points'), onUnansweredChange: () => assert.fail('confirm marked unanswered'), onEdit: () => calls.push('edit'), onAcceptAi: () => assert.fail('confirm invoked draft acceptance'), onSave: draft => calls.push(draft) });
  assert.match(out.html, /AI 建议评分|存疑/);
  assert.doesNotMatch(out.html, /教师最终评分|接受 AI 建议|快捷给分|标记为未作答|撤销未作答|预置修改理由|<textarea|data-slot="number-field/);
  assert.equal(out.buttons.filter(n => [n.props.children].flat().includes('采纳')).length, 1);
  assert.equal(button(out, '采纳').props.disabled, false);
  button(out, '改分').props.onClick(); button(out, '采纳').props.onClick();
  assert.deepEqual(calls, ['edit', { score: 6, reason: api.scoreReviewBase.aiSuggestion.reason, points }]);
  assert.doesNotMatch(out.html, /已保存|审计记录已更新/);
});

test('P18 confirm adoption and both shortcuts share save/retry gates and ignore local drafts', () => {
  for (const state of [{ kind: 'ready' }, { kind: 'failed', reason: '连接中断' }]) {
    const calls = [];
    const props = { ...base, mode: 'confirm', state, shortcuts: true, score: 9, onSave: d => calls.push(d), onRetry: d => calls.push(d) };
    const out = capture(props);
    button(out, state.kind === 'failed' ? '重试采纳' : '采纳').props.onClick();
    key(out, 'Enter', { ctrlKey: true }); key(out, 'a', { altKey: true });
    assert.equal(calls.length, 3); assert.ok(calls.every(d => d.score === 6));
    const blocked = capture({ ...props, saveDisabledReason: '依据已更新，请核对' });
    assert.match(blocked.html, /依据已更新，请核对/);
    button(blocked, state.kind === 'failed' ? '重试采纳' : '采纳').props.onClick();
    key(blocked, 'Enter', { metaKey: true }); key(blocked, 'a', { altKey: true });
    assert.equal(calls.length, 3);
    assert.equal(button(blocked, '改分').props.disabled, true); // absent handler
  }
});

test('P18 confirm refuses absent/invalid AI and cannot edit when saved, saving or externally locked', () => {
  for (const aiSuggestion of [undefined, { score: -1 }, { score: 11 }, { score: NaN }, { score: 6.5 }]) {
    const out = capture({ ...base, mode: 'confirm', aiSuggestion, onSave: () => assert.fail('invalid adopted') });
    assert.equal(button(out, '采纳').props.disabled, true); button(out, '采纳').props.onClick();
  }
  for (const lock of [{ state: { kind: 'saving' } }, { state: { kind: 'saved', score: 6 } }, { disabledReason: '过期资料' }]) {
    const out = capture({ ...base, mode: 'confirm', ...lock, onEdit: () => assert.fail('locked edit'), onSave: () => assert.fail('locked save') });
    for (const label of ['改分', '采纳']) { assert.equal(button(out, label).props.disabled, true); button(out, label).props.onClick(); }
  }
});

test('P18 edit exposes controlled point drafts, total context, reason, unanswered, cancel and save only', () => {
  const calls = [];
  const out = capture({ ...base, mode: 'edit', scoreContext: h('span', null, '原 6 分'), reason: '复核步骤', showReason: true, unanswered: false, onPointsChange: next => calls.push(next), onCancel: () => calls.push('cancel'), onSave: d => calls.push(d), onUnansweredChange: value => calls.push(value), shortcuts: true, onAcceptAi: () => assert.fail('edit accepted hidden AI') });
  assert.doesNotMatch(out.html, /AI 建议评分|接受 AI 建议|恢复 AI|依据.*未提供/);
  assert.match(out.html, /原 6 分|评分点合计|修改理由|标记为未作答/);
  assert.equal(out.nodes.filter(n => n.type === api.NumberField).length, 2);
  assert.equal(button(out, '取消').props.className, undefined); assert.equal(button(out, '保存').props.className, undefined);
  button(out, '取消').props.onClick(); button(out, '标记为未作答').props.onClick();
  button(out, '保存').props.onClick(); key(out, 'a', { altKey: true });
  assert.deepEqual(calls, ['cancel', true, { score: 6, reason: '复核步骤', points, unanswered: false }]);
});

test('P18 total-only edit uses a standard NumberField, shows original score and requires reasons as declared', () => {
  const out = capture({ mode: 'edit', density: 'compact', score: 7, scoreContext: '原 6 分', instruction: false, requireReason: true, reason: '' });
  assert.match(out.html, /原 6 分/); assert.equal(out.reason.props.required, true);
  assert.equal(button(out, '保存').props.disabled, true);
  const input = out.html.match(/<input\b[^>]*data-slot="number-field-input"[^>]*>/)?.[0];
  assert.ok(input); assert.doesNotMatch(input, /min-h-11|sm:h-11|-instructions/);
});

test('P18 manual has no suggestion, basis or AI draft action even when suggestion props are present', () => {
  const calls = [];
  const out = capture({ ...base, mode: 'manual', showBasis: true, scoreContext: undefined, points: points.map(p => ({ ...p, score: null })), onPointsChange() {}, onCancel: () => assert.fail('manual cancelled'), onAcceptAi: () => assert.fail('manual accepted AI'), onSave: d => calls.push(d), shortcuts: true });
  assert.doesNotMatch(out.html, /AI 建议评分|接受 AI 建议|恢复 AI|>依据<|>取消</);
  assert.match(out.html, /请完整填写有效的评分点得分/);
  assert.equal(button(out, '保存').props.disabled, true);
  button(out, '保存').props.onClick(); key(out, 'a', { altKey: true }); assert.deepEqual(calls, []);
  const valid = capture({ ...base, mode: 'manual', onSave: d => calls.push(d) });
  button(valid, '保存').props.onClick(); assert.equal(calls[0].score, 6);
});

test('P18 edit cancellation remains available for failed or blocked drafts and is locked while saving', () => {
  let cancels = 0;
  for (const extra of [{ state: { kind: 'failed', reason: '失败' } }, { disabledReason: '资料过期' }, { saveDisabledReason: '没有改动' }]) {
    const out = capture({ ...base, mode: 'edit', ...extra, onCancel: () => cancels++ });
    assert.equal(button(out, '取消').props.disabled, false); button(out, '取消').props.onClick();
  }
  const saving = capture({ ...base, mode: 'edit', state: { kind: 'saving' }, onCancel: () => cancels++ });
  assert.equal(button(saving, '取消').props.disabled, true); button(saving, '取消').props.onClick(); assert.equal(cancels, 3);
});

test('P18 visibility controls remove the whole basis and confidence, including visually hidden identity', () => {
  for (const mode of ['review', 'confirm', 'edit', 'manual']) {
    const out = capture({ ...base, mode, showConfidence: false, showBasis: false, confidencePercent: 62, confidenceLabel: '不应保留置信度标记' });
    assert.doesNotMatch(out.html, /置信度|不应保留置信度标记|评分规则 R3|>依据</);
    assert.match(out.html, /考号 20260126/);
  }
  assert.match(capture({ showBasis: true, showConfidence: true }).html, /低置信度|评分规则 R3/);
});

test('P18 instruction replacement/hiding is accessible and keeps the validation description', () => {
  assert.match(capture({ instruction: h('span', null, '自定义核对说明') }).html, /自定义核对说明/);
  const out = capture({ instruction: false });
  assert.doesNotMatch(out.html, /接受 AI 建议，或调整|id="[^"]*-instructions"|aria-describedby="[^"]*-instructions/);
  assert.match(out.html, /aria-describedby="[^"]*-gate"/);
});

test('P18 bottom sections are above the sibling footer; compact has exactly one scroll body', () => {
  for (const mode of ['review', 'confirm', 'edit', 'manual']) {
    const out = capture({ ...base, mode, sectionLabels: { answer: '学生作答文字', standardAnswer: '标准答案与解析', history: '修改记录' } });
    const body = out.nodes.find(n => 'data-score-review-body' in n.props);
    const footer = out.nodes.find(n => 'data-score-review-footer' in n.props);
    assert.match(body.props.className, /flex-1.*overflow-y-auto/); assert.match(footer.props.className, /shrink-0/);
    assert.equal(out.nodes.filter(n => String(n.props.className).includes('overflow-y-auto')).length, 1);
    for (const label of ['标准答案与解析', '学生作答文字', '修改记录']) assert.ok(out.html.indexOf(label) < out.html.indexOf('data-score-review-footer'), label);
    assert.ok(out.html.indexOf('data-score-review-points') < out.html.indexOf('data-score-review-sections'));
    assert.ok(!JSON.stringify(body.props.children).includes('data-score-review-footer'));
  }
});

test('P18 top placement and unbounded default density do not create a scroll body', () => {
  const out = capture({ ...base, mode: 'edit', density: 'default', sectionsPlacement: 'top', sectionLabels: { answer: '学生作答文字' } });
  const body = out.nodes.find(n => 'data-score-review-body' in n.props);
  assert.doesNotMatch(body.props.className, /overflow-y-auto/);
  assert.ok(out.html.indexOf('学生作答文字') < out.html.indexOf('data-score-review-points'));
});

test('P18 new modes cannot invoke hidden navigation shortcuts from retained host callbacks', () => {
  for (const mode of ['confirm', 'edit', 'manual']) {
    const out = capture({ ...base, mode, shortcuts: true, onPrev: () => assert.fail('hidden previous'), onSkip: () => assert.fail('hidden skip') });
    key(out, 'ArrowLeft', { altKey: true }); key(out, 'ArrowRight', { altKey: true });
    assert.equal(button(out, '上一题'), undefined); assert.equal(button(out, '跳过'), undefined);
  }
});
