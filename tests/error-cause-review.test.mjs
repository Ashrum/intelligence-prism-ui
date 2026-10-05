import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';

const root = fileURLToPath(new URL('../', import.meta.url));
const dir = new URL('../.sites-runtime/error-cause-review-test/', import.meta.url);
await mkdir(dir, { recursive: true });
const output = new URL('bundle.mjs', dir);
const built = await build({
  stdin: { contents: `export * from './components/prism-next/error-cause-review'; export * from './components/prism-next/demos/error-cause-review'; export {Button} from './components/prism-next/button'; export {Input} from './components/coss/input'; export {RadioGroup,Radio} from './components/coss/radio-group';`, resolveDir: root, loader: 'tsx' },
  bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false,
});
await writeFile(output, built.outputFiles[0].text);
const api = await import(output);
await rm(output);
const h = React.createElement;
const base = {
  categories: api.errorCauseReviewCategories,
  value: api.errorCauseReviewValue,
  draft: { category: 'other', explanation: '推导条件应对照原卷核实。' },
  editing: true,
  onEdit() {}, onChange() {}, onSave() {}, onCancel() {},
};
function capture(props = {}) {
  const nodes = [];
  function walk(node) {
    if (Array.isArray(node)) return node.map(walk);
    if (!React.isValidElement(node)) return node;
    if (node.type === api.ErrorCauseReview) return h(function Probe() { return walk(node.type(node.props)); });
    nodes.push(node);
    return React.cloneElement(node, {}, React.Children.map(node.props.children, walk));
  }
  const html = render(walk(h(api.ErrorCauseReview, { ...base, ...props })));
  return { html, nodes, buttons: nodes.filter(node => node.type === api.Button), group: nodes.find(node => node.type === api.RadioGroup), input: nodes.find(node => node.type === api.Input) };
}
function button(out, label) { return out.buttons.find(node => React.Children.toArray(node.props.children).includes(label)); }

test('ErrorCauseReview separates committed facts, draft, unknown data and historical category labels', () => {
  const out = capture({ editing: false, history: api.errorCauseReviewHistory });
  assert.match(out.html, /步骤不完整/);
  assert.match(out.html, /作答已经列出关系式/);
  assert.doesNotMatch(out.html, /推导条件应对照原卷核实/);
  assert.match(out.html, /因重新批阅失效；此记录仅保留当时的处理依据/);
  assert.match(out.html, /王老师/);
  assert.match(out.html, /<time dateTime="2026-10-05T09:30:00\+08:00">2026-10-05 09:30<\/time>/);
  assert.match(out.html, /<math>/);
  assert.match(capture({ editing: false, value: null }).html, /未提供/);
  assert.match(capture({ editing: false, value: { category: 'removed-category', explanation: '  ' } }).html, /removed-category/);
  assert.match(capture({ editing: false, value: { category: 'removed-category', explanation: '  ' } }).html, /未提供/);
  assert.doesNotMatch(capture({ editing: false }).html, /修改记录/);
});

test('ErrorCauseReview callbacks emit intents without changing draft, committed facts or receipts', () => {
  const calls = [];
  const props = { onEdit: () => calls.push(['edit']), onChange: value => calls.push(['change', value]), onSave: value => calls.push(['save', value]), onCancel: () => calls.push(['cancel']) };
  button(capture({ ...props, editing: false }), '修改').props.onClick();
  const out = capture(props);
  out.group.props.onValueChange('calculation');
  out.group.props.onValueChange('not-a-category');
  out.input.props.onChange({ target: { value: '  保留完整说明  ' } });
  button(out, '保存错因').props.onClick();
  button(out, '取消').props.onClick();
  assert.deepEqual(calls, [
    ['edit'], ['change', { ...base.draft, category: 'calculation' }],
    ['change', { ...base.draft, explanation: '  保留完整说明  ' }], ['save', base.draft], ['cancel'],
  ]);
  assert.equal(capture(props).html, out.html);
  assert.doesNotMatch(out.html, /错因已保存|正在保存/);
});

test('ErrorCauseReview validates the explicit other flag and a category present in the supplied list', () => {
  let calls = 0;
  for (const draft of [{ category: '', explanation: '已填说明' }, { category: 'unknown', explanation: '已填说明' }, { category: 'other', explanation: ' \n ' }]) {
    const out = capture({ draft, onSave: () => calls++ });
    assert.equal(button(out, '保存错因').props.disabled, true);
    button(out, '保存错因').props.onClick();
    assert.match(out.html, /请选择有效的错因分类|选择其他时，请填写错因说明/);
  }
  const required = capture({ draft: { category: 'other', explanation: '' } });
  assert.equal(required.input.props.required, true);
  assert.equal(required.input.props['aria-invalid'], true);
  const description = required.input.props['aria-describedby'];
  assert.match(required.html, /说明 · 必填/);
  assert.ok(required.nodes.some(node => node.props.id === description && node.props.children === '选择其他时，请填写错因说明。'));
  const ordinary = capture({ draft: { category: 'calculation', explanation: '' } });
  assert.equal(ordinary.input.props.required, undefined);
  assert.equal(button(ordinary, '保存错因').props.disabled, false);
  const localized = capture({ categories: [{ id: 'custom', label: 'Additional cause', isOther: true }], draft: { category: 'custom', explanation: ' ' } });
  assert.equal(button(localized, '保存错因').props.disabled, true);
  assert.equal(calls, 0);
});

test('ErrorCauseReview saving locks controls and handlers, including cancel and read-only edit', () => {
  let calls = 0;
  const callback = () => calls++;
  const props = { state: { kind: 'saving' }, onEdit: callback, onChange: callback, onSave: callback, onCancel: callback };
  const out = capture(props);
  assert.match(out.html, /aria-busy="true"/);
  assert.match(out.html, /正在保存错因…/);
  assert.equal(out.group.props.disabled, true);
  assert.equal(out.input.props.disabled, true);
  out.group.props.onValueChange('method');
  out.input.props.onChange({ target: { value: 'should not change' } });
  for (const action of out.buttons) { assert.equal(action.props.disabled, true); action.props.onClick(); }
  const readOnly = capture({ ...props, editing: false });
  assert.equal(button(readOnly, '修改').props.disabled, true);
  button(readOnly, '修改').props.onClick();
  assert.equal(calls, 0);
});

test('ErrorCauseReview failure preserves the controlled draft and retries the current valid value', () => {
  const calls = [];
  const props = { state: { kind: 'failed', reason: '服务暂不可用' }, onSave: value => calls.push(value) };
  const before = capture(props);
  assert.match(before.html, /role="alert"[^>]*>保存失败：服务暂不可用/);
  assert.equal(before.input.props.value, base.draft.explanation);
  assert.equal(before.group.props.value, base.draft.category);
  button(before, '重试保存').props.onClick();
  assert.deepEqual(calls, [base.draft]);
  assert.equal(capture(props).html, before.html);
  const invalid = capture({ ...props, draft: { category: 'other', explanation: '' } });
  assert.equal(button(invalid, '重试保存').props.disabled, true);
  button(invalid, '重试保存').props.onClick();
  assert.equal(calls.length, 1);
});

test('ErrorCauseReview external gates block only declared operations and allow cancellation', () => {
  let edits = 0, saves = 0, cancels = 0;
  const callbacks = { onChange: () => edits++, onSave: () => saves++, onCancel: () => cancels++ };
  const blocked = capture({ ...callbacks, disabledReason: '当前记录已被重新批阅，请重新核对。' });
  assert.equal(blocked.group.props.disabled, true);
  assert.equal(blocked.input.props.disabled, true);
  assert.equal(button(blocked, '保存错因').props.disabled, true);
  assert.equal(button(blocked, '取消').props.disabled, false);
  assert.ok(blocked.nodes.some(node => node.props.id === button(blocked, '保存错因').props['aria-describedby']));
  blocked.group.props.onValueChange('method');
  blocked.input.props.onChange({ target: { value: 'blocked' } });
  button(blocked, '保存错因').props.onClick();
  button(blocked, '取消').props.onClick();
  assert.deepEqual([edits, saves, cancels], [0, 0, 1]);
  const saveOnly = capture({ ...callbacks, saveDisabledReason: '当前内容尚未修改。' });
  assert.equal(saveOnly.group.props.disabled, false);
  assert.equal(saveOnly.input.props.disabled, false);
  assert.equal(button(saveOnly, '保存错因').props.disabled, true);
  saveOnly.input.props.onChange({ target: { value: '可以继续修改' } });
  assert.equal(edits, 1);
  assert.match(saveOnly.html, /当前内容尚未修改/);
});

test('ErrorCauseReview missing handlers or draft never present executable actions', () => {
  for (const props of [{ draft: undefined }, { onChange: undefined }, { onSave: undefined }]) {
    const out = capture(props);
    assert.equal(button(out, '保存错因').props.disabled, true);
    assert.match(out.html, /编辑草稿未提供|修改操作未提供|保存操作未提供/);
  }
  assert.equal(capture({ onChange: undefined }).input.props.disabled, true);
  assert.equal(button(capture({ onCancel: undefined }), '取消').props.disabled, true);
  const readOnly = capture({ editing: false, onEdit: undefined });
  assert.equal(button(readOnly, '修改').props.disabled, true);
  assert.match(readOnly.html, /修改操作未提供/);
});

test('ErrorCauseReview saved status is an external receipt and instances have distinct label IDs', () => {
  const html = render(h('div', null, ...[1, 2].map(key => h(api.ErrorCauseReview, { ...base, key, draft: { category: 'other', explanation: '' }, state: { kind: 'saved', message: '宿主回执：旧版本错因已保存。' } }))));
  assert.equal((html.match(/宿主回执：旧版本错因已保存/g) || []).length, 2);
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  const references = [...html.matchAll(/(?:aria-labelledby|aria-describedby|for)="([^"]+)"/g)].flatMap(match => match[1].split(' '));
  for (const id of references) assert.ok(ids.includes(id), `missing referenced ID ${id}`);
});

test('ErrorCauseReview demo covers all states, three themes, narrow layout, long Chinese and MathML', () => {
  const html = render(h(api.ErrorCauseReviewDemo));
  for (const theme of ['light', 'paper', 'dark']) assert.equal((html.match(new RegExp(`data-prism-theme="${theme}"`, 'g')) || []).length, 6);
  for (const text of ['320px', '说明 · 必填', '保存失败', '正在保存错因', '本次批阅已关闭', '因重新批阅失效', '未提供', '错因已保存']) assert.ok(html.includes(text), text);
  assert.match(html, /<math>/);
  assert.match(html, /参数取值约束与最终结论之间的逻辑联系/);
  assert.match(html, /data-ui-version="coss-v1"/);
});
