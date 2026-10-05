import test from 'node:test';
import assert from 'node:assert/strict';
import { buildApi, capture } from './inspector-p18-compatibility-harness.mjs';

const api = await buildApi();
const base = { categories: api.errorCauseReviewCategories, value: api.errorCauseReviewValue };
const button = (out, label) => out.buttons.find(node => node.props.children === label || node.props.children?.includes?.(label));

test('P18 custom error-cause edit label emits one intent and keeps standard action gate', () => {
  let edits = 0;
  const props = { ...base, editLabel: '修改错因', onEdit: () => edits++ };
  const out = capture(api, props);
  assert.equal(out.buttons.length, 1); assert.match(out.html, />修改错因<\/button>/);
  button(out, '修改错因').props.onClick(); assert.equal(edits, 1);
  assert.equal(capture(api, props).html, out.html, 'click does not enter editing or invent saved state');
  const blocked = capture(api, { ...props, disabledReason: '本次修改已关闭' });
  assert.equal(button(blocked, '修改错因').props.disabled, true);
  button(blocked, '修改错因').props.onClick(); assert.equal(edits, 1);
  assert.match(blocked.html, /本次修改已关闭/);
});

test('P18 external edit entry hides only local action and its blocked explanation', () => {
  const out = capture(api, { ...base, hideEditAction: true, history: api.errorCauseReviewHistory });
  assert.equal(out.buttons.length, 0);
  assert.doesNotMatch(out.html, /修改操作未提供|错因分类 · 必选|data-slot="button"/);
  for (const text of ['步骤不完整', '修改记录', '因重新批阅失效']) assert.ok(out.html.includes(text), text);
  const disabled = capture(api, { ...base, hideEditAction: true, disabledReason: '入口不可用' });
  assert.doesNotMatch(disabled.html, /入口不可用|aria-describedby/);
});

test('P18 host-controlled error-cause editing works without onEdit and preserves external fact/draft separation', () => {
  const calls = [];
  const draft = { category: 'other', explanation: '宿主控制的错因草稿' };
  const props = { ...base, hideEditAction: true, editing: true, draft, onChange: value => calls.push(['change', value]), onSave: value => calls.push(['save', value]), onCancel: () => calls.push(['cancel']) };
  const out = capture(api, props);
  assert.equal(out.group.props.disabled, false); assert.equal(out.input.props.disabled, false);
  assert.equal(button(out, '保存错因').props.disabled, false);
  out.input.props.onChange({ target: { value: '新草稿' } });
  button(out, '保存错因').props.onClick(); button(out, '取消').props.onClick();
  assert.deepEqual(calls, [['change', { ...draft, explanation: '新草稿' }], ['save', draft], ['cancel']]);
  assert.equal(capture(api, props).html, out.html);
  assert.doesNotMatch(out.html, /修改操作未提供/);
});

test('P18 hiding edit entry cannot bypass missing draft, callbacks, required explanation or busy/external gates', () => {
  for (const overrides of [
    { draft: undefined }, { onChange: undefined }, { onSave: undefined },
    { draft: { category: 'other', explanation: ' ' } },
    { draft: { category: 'unknown', explanation: '有效说明' } },
    { disabledReason: '版本已变' }, { saveDisabledReason: '尚未修改' }, { state: { kind: 'saving' } },
  ]) {
    let saves = 0;
    const out = capture(api, { ...base, hideEditAction: true, editing: true, draft: api.errorCauseReviewValue, onChange() {}, onSave: () => saves++, onCancel() {}, ...overrides });
    assert.equal(button(out, '保存错因').props.disabled, true, JSON.stringify(overrides));
    button(out, '保存错因').props.onClick(); assert.equal(saves, 0);
    if (overrides.onChange === undefined && Object.hasOwn(overrides, 'onChange')) assert.match(out.html, /修改操作未提供/);
    if (overrides.state) {
      assert.equal(out.group.props.disabled, true); assert.equal(out.input.props.disabled, true);
      assert.equal(button(out, '取消').props.disabled, true); assert.match(out.html, /正在保存错因/);
    }
  }
});
