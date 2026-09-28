import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = new URL('../.sites-runtime/constraint-builder/', import.meta.url);
await mkdir(runtime, { recursive: true });
const file = new URL('test-bundle.mjs', runtime);
const bundle = await build({ stdin: { contents: `export * from './components/prism-next/agent-constraint-builder'; export * from './components/prism-next/demos/agent-constraint-builder'; export {AgentExecutionConfirmation} from './components/prism-next/agent-semantic-components';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false });
await writeFile(file, bundle.outputFiles[0].text);
const { AgentConstraintBuilder, AgentExecutionConfirmation, ConstraintBuilderExample, AgentConstraintBuilderDemo, constraintExampleConfirmation } = await import(file);
await rm(file);
const h = React.createElement;
const basis = { objectId: 'opaque-task-reference', version: 'opaque-condition-revision' };
const toggle = { id: 'deduplicate', label: '排除重复页', type: 'toggle', value: true, defaultValue: false, critical: true, impact: '排除第 4 页重复页。', validation: { state: 'valid' } };
const ratio = { id: 'ratio', label: '难度比例', type: 'ratio', value: 110, defaultValue: 50, critical: true, validation: { state: 'valid' } };
const bounds = { id: 'bounds', label: '题量范围', type: 'bounds', value: { min: 20, max: 10 }, defaultValue: { min: 10, max: 15 }, unit: '题', critical: true, validation: { state: 'valid' } };
const rule = { id: 'rule', label: '答案要求', type: 'rule', value: 'steps', defaultValue: 'result', critical: false, options: [{ value: 'steps', label: '完整过程' }, { value: 'result', label: '仅结果' }], validation: { state: 'valid' } };
const location = { objectId: 'opaque-conflict-object', version: 'opaque-location-revision', label: '函数单元', location: '难度比例 · 较难题', anchor: 'opaque-anchor' };
const conflict = { ...ratio, critical: false, validation: { state: 'conflict', reason: '难度比例合计不为 100%', targets: [location] } };
const unavailable = { ...rule, validation: { state: 'unavailable', reason: '能力标签尚未提供。' } };
const group = items => [{ id: 'settings', label: '出题条件', items }];
const base = { title: '处理条件', basis, groups: group([toggle]), reconfirmation: { required: false } };
const modes = [{}, { view: 'workspace' }, { density: 'compact' }, { view: 'workspace', density: 'compact' }];
const htmlFor = extra => render(h(AgentConstraintBuilder, { ...base, ...extra }));
function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.freeze(value); Object.values(value).forEach(freeze); }
  return value;
}
// SSR plus source-created handlers only; no browser/primitive keyboard or service claims.
function capture(extra, Component = AgentConstraintBuilder) {
  const nodes = [], owned = new Set(['AgentConstraintBuilder', 'ConstraintItem', 'ConstraintNumber', 'AgentExecutionConfirmation', 'Surface', 'Action']);
  function inspect(node) {
    if (Array.isArray(node)) return node.map(inspect);
    if (!React.isValidElement(node)) return node;
    if (typeof node.type === 'function' && owned.has(node.type.name)) return h(function Probe() { return inspect(node.type(node.props)); });
    nodes.push(node);
    return React.cloneElement(node, {}, React.Children.map(node.props.children, inspect));
  }
  render(inspect(h(Component, Component === AgentConstraintBuilder ? { ...base, ...extra } : extra)));
  return nodes;
}
const button = (nodes, text) => nodes.find(node => node.props.onClick && React.Children.toArray(node.props.children).includes(text));
const checkbox = nodes => nodes.find(node => node.props.onCheckedChange);
const number = (nodes, suffix = '-control') => nodes.find(node => node.props.onValueChange && node.props.id?.endsWith(suffix));
const choice = nodes => nodes.find(node => node.props.onValueChange && (node.props.items || node.props['aria-labelledby']));

test('defaults are inline/default; controlled value, impact and validation are facts, with opaque references kept out of DOM', () => {
  assert.equal(htmlFor(), htmlFor({ view: 'inline', density: 'default' }));
  const html = htmlFor({ groups: group([toggle, conflict]), onExpand() {} });
  for (const text of ['排除重复页', '排除第 4 页重复页。', '关键条件', '有效', conflict.validation.reason, location.label, location.location]) assert.ok(html.includes(text), text);
  for (const ref of [basis.objectId, basis.version, location.objectId, location.version, location.anchor, toggle.id]) assert.ok(!html.includes(ref), ref);
  assert.doesNotMatch(html, /已执行|确认条件<|条件已变化|已确认/);
});

test('all six kinds use fixed labels and the existing fieldset, checkbox, number, select and radio controls', () => {
  const items = [toggle, { ...toggle, id: 'required', type: 'required', label: '必须保留来源' }, { ...toggle, id: 'forbidden', type: 'forbidden', label: '禁止重复知识点' }, ratio, bounds, rule, { ...rule, id: 'radio', label: '解答方式', control: 'radio' }];
  const html = htmlFor({ view: 'workspace', groups: group(items), onValueChange() {} });
  for (const slot of ['fieldset', 'checkbox', 'number-field', 'radio-group', 'select-trigger']) assert.ok(html.includes(`data-slot="${slot}"`), slot);
  for (const item of items) assert.ok(html.includes(item.label));
  for (const label of ['下限（题）', '上限（题）', '单位：%', '默认：关闭', '默认：50%', '默认：仅结果']) assert.ok(html.includes(label), label);
  assert.doesNotMatch(html, /required=""/);
});

test('editing emits typed revision-bound changes without changing frozen props, defaults, validation or reconfirmation', () => {
  const calls = [], groups = freeze(group([toggle]));
  const extra = { groups, onValueChange: value => { calls.push(value); return { required: true }; } };
  const before = htmlFor(extra), control = checkbox(capture(extra));
  assert.equal(control.props.checked, true); assert.equal(control.props.defaultChecked, undefined);
  control.props.onCheckedChange(false);
  assert.deepEqual(calls, [{ ...basis, constraintId: toggle.id, type: 'toggle', value: false }]);
  assert.equal(htmlFor(extra), before); assert.equal(groups[0].items[0].value, true); assert.equal(groups[0].items[0].defaultValue, false);
  assert.doesNotMatch(before, /需重新确认/);
});

test('numeric values including null pass through unchanged; bounds preserve the other endpoint and never swap or normalize', () => {
  const calls = [], items = freeze(group([ratio, bounds]));
  const extra = { view: 'workspace', groups: items, onValueChange: value => calls.push(value) };
  const before = htmlFor(extra), nodes = capture(extra);
  const ratioControl = number(nodes), lower = number(nodes, '-min'), upper = number(nodes, '-max');
  assert.equal(ratioControl.props.value, 110); assert.equal(ratioControl.props.min, undefined); assert.equal(ratioControl.props.max, undefined); assert.equal(ratioControl.props.defaultValue, undefined);
  ratioControl.props.onValueChange(133.333); ratioControl.props.onValueChange(null);
  lower.props.onValueChange(-2); upper.props.onValueChange(null);
  assert.deepEqual(calls.map(call => [call.type, call.value]), [['ratio', 133.333], ['ratio', null], ['bounds', { min: -2, max: 10 }], ['bounds', { min: 20, max: null }]]);
  assert.ok(calls.every(call => call.objectId === basis.objectId && call.version === basis.version));
  assert.equal(htmlFor(extra), before); assert.deepEqual(items[0].items[1].value, { min: 20, max: 10 });
  assert.equal(number(capture({ groups: group([{ ...ratio, value: null }]) })).props.value, null);
});

test('select and radio return legal supplied choices and null, preserve controlled values and guard disabled options', () => {
  for (const control of ['select', 'radio']) {
    const calls = [], item = freeze({ ...rule, control, options: [...rule.options, { value: 'blocked', label: '详细解析', disabledReason: '解析暂不可用。' }] });
    const extra = { groups: group([item]), onValueChange: value => calls.push(value) };
    const before = htmlFor(extra), input = choice(capture(extra));
    assert.equal(input.props.value, 'steps');
    input.props.onValueChange('result'); input.props.onValueChange(null); input.props.onValueChange('blocked'); input.props.onValueChange('not-provided');
    assert.deepEqual(calls.map(call => call.value), ['result', null]); assert.ok(calls.every(call => call.type === 'rule'));
    assert.equal(htmlFor(extra), before); assert.match(before, /解析暂不可用/);
    const missing = htmlFor({ groups: group([{ ...item, value: 'opaque-unlisted-value' }]) });
    // Native coss inputs retain the controlled code; it must not become a readable label.
    assert.doesNotMatch(missing.replace(/<[^>]*>/g, ''), /opaque-unlisted-value/);
  }
});

test('validation never computes a conflict from values or clears supplied conflicts after a value change', () => {
  const valid = htmlFor({ groups: group([ratio, bounds]), onValueChange() {} });
  assert.doesNotMatch(valid, /data-constraint-issues|条件冲突|合计|需重新确认/);
  const extra = { groups: group([{ ...conflict, value: 100 }]), onValueChange() {} };
  const before = htmlFor(extra); number(capture(extra)).props.onValueChange(50);
  assert.equal(htmlFor(extra), before); assert.match(before, /难度比例合计不为 100%/);
  assert.doesNotMatch(htmlFor({ groups: group([{ ...ratio, value: 110, validation: { state: 'valid' } }]) }), /合计不为/);
});

test('inline chooses host critical items plus all restrictions; no onExpand means all fields and no expansion entry', () => {
  const extra = { groups: group([toggle, { ...rule, label: '可选附加规则' }, conflict, { ...unavailable, id: 'offline' }]), onExpand() {} };
  const html = htmlFor(extra);
  assert.doesNotMatch(html, /默认：|可选附加规则/); assert.match(html, /排除重复页/); assert.match(html, /能力标签尚未提供/);
  assert.match(htmlFor({ ...extra, onExpand: undefined }), /可选附加规则/);
  assert.doesNotMatch(htmlFor({ ...extra, onExpand: undefined }), /调整全部条件/);
  assert.match(htmlFor({ ...extra, view: 'workspace' }), /出题条件|完整过程/);
});

test('both views and densities retain all conflict/unavailable reasons and targets outside collapsed details', () => {
  for (const mode of modes) {
    const html = htmlFor({ ...mode, groups: group([conflict, unavailable]), onExpand() {}, details: 'SECONDARY_COLLAPSED_TEXT' });
    assert.equal((html.match(/data-constraint-issues=""/g) ?? []).length, 1);
    for (const text of [conflict.validation.reason, unavailable.validation.reason, location.label, location.location, '条件冲突', '不可用']) assert.ok(html.includes(text), text);
    assert.doesNotMatch(html, /SECONDARY_COLLAPSED_TEXT|hidden=""/);
    const nodes = capture({ ...mode, groups: group([conflict, unavailable]), onValueChange() {} });
    assert.equal(number(nodes).props.disabled, false); assert.equal(choice(nodes).props.disabled, true);
  }
});

test('host re-confirmation is persistent in every mode; critical edits alone never manufacture the fact', () => {
  for (const mode of modes) {
    const extra = { ...mode, reconfirmation: { required: true, reason: '模糊页改为跳过。' }, onValueChange() {} };
    const before = htmlFor(extra); checkbox(capture(extra)).props.onCheckedChange(false);
    assert.match(before, /条件已变化，需重新确认/); assert.match(before, /模糊页改为跳过/); assert.equal(htmlFor(extra), before);
    assert.doesNotMatch(htmlFor({ ...extra, reconfirmation: { required: false }, basis: { ...basis, version: 'new-revision' } }), /需重新确认|已确认/);
  }
});

test('disabled, unavailable, missing identity and duplicate item identity guard every change handler', () => {
  for (const item of [toggle, ratio, bounds, rule, { ...rule, control: 'radio' }]) {
    for (const restriction of [{ disabledReason: '历史条件只读。' }, { basis: { ...basis, version: '' } }, { groups: group([{ ...item, validation: { state: 'unavailable', reason: '检查暂不可用。' } }]) }, { groups: group([{ ...item, disabledReason: '条件冻结。' }]) }, { groups: group([item, { ...item }]) }, { onValueChange: undefined }]) {
      const extra = { groups: group([item]), onValueChange() { assert.fail('blocked change'); }, ...restriction };
      const nodes = capture(extra), input = checkbox(nodes) ?? number(nodes, item.type === 'bounds' ? '-min' : '-control') ?? choice(nodes);
      assert.equal(input.props.disabled, true);
      if (input.props.onCheckedChange) input.props.onCheckedChange(false); else input.props.onValueChange(item.type === 'rule' ? 'result' : 8);
    }
  }
});

test('restore defaults is workspace-only and emits current reference without copying defaults or clearing host facts', () => {
  const calls = [], extra = { groups: freeze(group([toggle, conflict])), onRestoreDefaults: value => calls.push(value), reconfirmation: { required: true, reason: '关键条件已变化。' } };
  assert.doesNotMatch(htmlFor(extra), /恢复默认/);
  for (const density of ['default', 'compact']) {
    const state = { ...extra, view: 'workspace', density }, before = htmlFor(state);
    button(capture(state), '恢复默认').props.onClick(); assert.deepEqual(calls.at(-1), basis); assert.equal(htmlFor(state), before);
    const blocked = button(capture({ ...state, disabledReason: '确认后冻结。' }), '恢复默认');
    assert.equal(blocked.props.disabled, true); blocked.props.onClick();
  }
  assert.equal(calls.length, 2); assert.doesNotMatch(htmlFor({ view: 'workspace' }), /恢复默认/);
});

test('conflict location emits exact host references only and does not require editing permission', () => {
  const calls = [], extra = { groups: freeze(group([conflict])), onLocateConflict: value => calls.push(value), disabledReason: '当前只读。' };
  assert.equal(button(capture(extra), '定位'), undefined);
  const state = { ...extra, view: 'workspace' }, before = htmlFor(state);
  button(capture(state), '定位').props.onClick();
  assert.deepEqual(calls, [{ ...basis, constraintId: conflict.id, target: location }]); assert.equal(htmlFor(state), before);
  assert.equal(button(capture({ ...state, onLocateConflict: undefined }), '定位'), undefined);
});

test('workspace changes are independent host summaries, including distinct missing and explicitly empty records', () => {
  assert.match(htmlFor({ view: 'workspace' }), /暂未提供变化记录/);
  assert.match(htmlFor({ view: 'workspace', changes: [] }), /没有条件变化/);
  const extra = { changes: [{ id: 'delta', label: '题量', description: '上次 12 题，本次 15 题。' }] };
  assert.match(htmlFor({ ...extra, view: 'workspace' }), /上次 12 题，本次 15 题/);
  assert.doesNotMatch(htmlFor(extra), /上次 12 题/);
  assert.doesNotMatch(htmlFor({ ...extra, view: 'workspace' }), /需重新确认/);
});

test('expansion passes trigger and return only navigates; a single notice is separate from collapsed supplementary copy', () => {
  const calls = [], trigger = {}, extra = { onExpand: value => calls.push(value), onBack: () => calls.push('back'), onValueChange() { assert.fail('navigation changed values'); }, notice: '本次仅处理已选材料。', details: 'EXTRA_BOUNDARY_TEXT' };
  const before = htmlFor(extra);
  button(capture(extra), '调整全部条件').props.onClick({ currentTarget: trigger });
  button(capture({ ...extra, view: 'workspace' }), '返回原位置').props.onClick();
  assert.deepEqual(calls, [trigger, 'back']); assert.equal(htmlFor(extra), before);
  for (const mode of modes) {
    const html = htmlFor({ ...extra, ...mode });
    assert.equal((html.match(/本次仅处理已选材料。/g) ?? []).length, 1); assert.doesNotMatch(html, /EXTRA_BOUNDARY_TEXT/);
  }
});

test('fields link persistent labels, host problems and disabled reasons with real accessible description targets', () => {
  const extra = { view: 'workspace', groups: group([toggle, conflict, bounds, rule]), disabledReason: '当前只读。' }, html = htmlFor(extra);
  for (const node of capture(extra)) for (const attribute of ['aria-describedby', 'aria-labelledby']) {
    for (const id of (node.props[attribute] ?? '').split(' ').filter(Boolean)) assert.ok(html.includes(`id="${id}"`), `${attribute}: ${id}`);
  }
  assert.match(html, /aria-invalid="true"/);
  assert.match(htmlFor({ groups: [] }), /暂未提供处理条件/);
  assert.doesNotMatch(htmlFor({ groups: group([{ ...toggle, label: '<script>alert(1)</script>' }]) }), /<script>/);
});

test('08 composes inside 25 conditions; only host confirmation state permits a confirmation action', () => {
  const calls = [], conditions = h(AgentConstraintBuilder, { ...base, presentation: 'inline', reconfirmation: { required: true, reason: '排重条件已改变。' } });
  const props = { title: '确认处理', target: '扫描材料', version: '条件 v2', effects: ['整理扫描材料'], conditions, confirmation: { state: 'blocked', description: '上次确认已失效。' } };
  const html = render(h(AgentExecutionConfirmation, props));
  assert.equal((html.match(/data-slot="card"/g) ?? []).length, 1); assert.match(html, /data-execution-conditions/); assert.match(html, /排重条件已改变/); assert.match(html, /上次确认已失效/);
  assert.equal(button(capture(props, AgentExecutionConfirmation), '确认处理条件'), undefined);
  const ready = { ...props, confirmation: { state: 'ready', confirm: { label: '确认处理条件', onAction: () => calls.push('confirm') } } };
  const before = render(h(AgentExecutionConfirmation, ready)), oldFrame = globalThis.requestAnimationFrame;
  globalThis.requestAnimationFrame = () => 0;
  try { button(capture(ready, AgentExecutionConfirmation), '确认处理条件').props.onClick(); } finally { if (oldFrame) globalThis.requestAnimationFrame = oldFrame; else delete globalThis.requestAnimationFrame; }
  assert.deepEqual(calls, ['confirm']); assert.equal(render(h(AgentExecutionConfirmation, ready)), before);
  assert.equal(render(h(AgentExecutionConfirmation, { ...props, conditions: undefined })), render(h(AgentExecutionConfirmation, { title: props.title, target: props.target, version: props.version, effects: props.effects, confirmation: props.confirmation })));
});

test('example host invalidates old confirmations by version and never treats confirm callbacks as receipts', () => {
  const calls = [], props = { version: 'v2', confirmedVersion: 'v1', preparedVersion: 'v1', hasIssues: false, onPrepare() {}, onConfirm: () => calls.push('confirm') };
  assert.equal(constraintExampleConfirmation(props).state, 'blocked');
  const ready = constraintExampleConfirmation({ ...props, preparedVersion: 'v2' });
  assert.equal(ready.state, 'ready'); ready.confirm.onAction();
  assert.deepEqual(calls, ['confirm']); assert.equal(constraintExampleConfirmation({ ...props, preparedVersion: 'v2' }).state, 'ready');
  assert.equal(constraintExampleConfirmation({ ...props, confirmedVersion: 'v2' }).state, 'recorded');
  assert.equal(constraintExampleConfirmation({ ...props, confirmedVersion: 'v2', hasIssues: true }).state, 'blocked');
});

test('two labelled example uses each render inline/workspace/compact with the 25 composition and shared-value fixtures', () => {
  for (const purpose of ['p04', 'paper']) {
    const html = render(h(ConstraintBuilderExample, { purpose, narrow: true }));
    assert.equal((html.match(/data-agent-constraint-view=/g) ?? []).length, 3);
    for (const text of ['固定示例', '主要条件与执行确认', '全部条件与冲突定位', '紧凑条件', '载入示例确认记录', '载入默认条件示例', 'max-w-[320px]', 'data-execution-conditions']) assert.ok(html.includes(text), text);
    if (purpose === 'p04') for (const text of ['排除重复页', '模糊页先询问', '条件已变化，需重新确认', '上次确认不再适用于当前条件']) assert.ok(html.includes(text), text);
    else for (const text of ['题量范围', '禁止重复知识点', '难度比例合计不为 100%', '能力标签尚未提供', '完整推理过程']) assert.ok(html.includes(text), text);
    assert.doesNotMatch(html.replace(/<[^>]*>/g, ''), /宿主|意图|回调|受控/);
  }
  assert.match(render(h(AgentConstraintBuilderDemo)), /320px 窄容器/);
});

test('public types require controlled/default values, host validation and re-confirmation, and correlate change values', async () => {
  const typeFile = new URL('type-contract.tsx', runtime), path = fileURLToPath(typeFile);
  await writeFile(typeFile, `import type {AgentConstraintItem as I,AgentConstraintChange as C,AgentConstraintBuilderProps as P} from '../../components/prism-next/agent-constraint-builder';
const base = {id:'a',label:'排重',critical:true,validation:{state:'valid' as const}};
const item:I = {...base,type:'toggle',value:true,defaultValue:false};
// @ts-expect-error controlled value is required
const noValue:I = {...base,type:'toggle',defaultValue:true};
// @ts-expect-error defaults are explicit host values
const noDefault:I = {...base,type:'ratio',value:null};
// @ts-expect-error a conflict needs a reason and target list
const conflict:I = {...item,validation:{state:'conflict'}};
// @ts-expect-error numeric bounds cannot be an untyped array
const bounds:I = {...base,type:'bounds',value:[1,2],defaultValue:{min:1,max:2}};
// @ts-expect-error enum needs explicit choices
const rule:I = {...base,type:'rule',value:null,defaultValue:null};
const change:C={objectId:'o',version:'r',constraintId:'a',type:'bounds',value:{min:null,max:2}};
// @ts-expect-error type/value must agree
const badChange:C={objectId:'o',version:'r',constraintId:'a',type:'toggle',value:'true'};
// @ts-expect-error reconfirmation is a mandatory independent host fact
const props:P={title:'条件',basis:{objectId:'o',version:'r'},groups:[]};
// @ts-expect-error required re-confirmation needs a readable reason
const noReason:P={title:'条件',basis:{objectId:'o',version:'r'},groups:[],reconfirmation:{required:true}};
void [noValue,noDefault,conflict,bounds,rule,change,badChange,props,noReason];
`);
  try {
    const config = ts.readConfigFile(`${root}tsconfig.json`, ts.sys.readFile);
    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
    const diagnostics = ts.getPreEmitDiagnostics(ts.createProgram([path], { ...parsed.options, incremental: false, noEmit: true }));
    assert.equal(diagnostics.length, 0, diagnostics.map(value => ts.flattenDiagnosticMessageText(value.messageText, '\n')).join('\n'));
  } finally { await rm(typeFile); }
});
