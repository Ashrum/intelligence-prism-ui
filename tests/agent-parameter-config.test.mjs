import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = new URL('../.sites-runtime/parameter-config/', import.meta.url);
await mkdir(runtime, { recursive: true });
const file = new URL('test-bundle.mjs', runtime);
const bundle = await build({ stdin: { contents: `export * from './components/prism-next/agent-parameter-config'; export * from './components/prism-next/demos/agent-parameter-config'; export {AgentConstraintBuilder} from './components/prism-next/agent-constraint-builder'; export {AgentExecutionConfirmation} from './components/prism-next/agent-semantic-components';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false });
await writeFile(file, bundle.outputFiles[0].text);
const { AgentParameterConfig, AgentConstraintBuilder, AgentExecutionConfirmation, ParameterConfigExample, AgentParameterConfigDemo, availableParameterExample } = await import(file);
await rm(file);
const h = React.createElement;
const provided = { state: 'provided' };
const number = { id: 'opaque-count', label: '题量', type: 'number', key: true, value: 24, unit: '题', min: 1, max: 20, step: 2, default: { value: 12, source: '练习模板' }, status: provided, validation: [] };
const select = { id: 'opaque-difficulty', label: '难度', type: 'select', key: true, value: 'opaque-balanced', options: [{ value: 'opaque-basic', label: '基础巩固' }, { value: 'opaque-balanced', label: '综合运用' }, { value: 'opaque-locked', label: '自定义难度', disabledReason: '暂不支持自定义。' }], status: provided, validation: [] };
const radio = { ...select, id: 'opaque-scoring', label: '分值方式', type: 'radio' };
const toggle = { id: 'opaque-answers', label: '附参考答案', type: 'switch', key: true, value: true, default: { value: false, source: '学生版模板' }, status: provided, validation: [] };
const short = { id: 'opaque-title', label: '卷名', type: 'text-short', key: false, value: '函数练习', status: provided, validation: [] };
const base = { title: '组卷参数', baseVersion: 'opaque-revision', parameters: [number], onIntent() {} };
const modes = [{}, { view: 'workspace' }, { density: 'compact' }, { view: 'workspace', density: 'compact' }];
const htmlFor = extra => render(h(AgentParameterConfig, { ...base, ...extra }));
function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.freeze(value); Object.values(value).forEach(freeze); }
  return value;
}
// Exercise the actual component-created handlers, without claiming primitive/browser interaction.
function capture(extra) {
  const nodes = [], owned = new Set(['AgentParameterConfig', 'ParameterField', 'ParameterFacts']);
  function inspect(node) {
    if (Array.isArray(node)) return node.map(inspect);
    if (!React.isValidElement(node)) return node;
    if (typeof node.type === 'function' && owned.has(node.type.name)) return h(function Probe() { return inspect(node.type(node.props)); });
    nodes.push(node);
    return React.cloneElement(node, {}, React.Children.map(node.props.children, inspect));
  }
  render(inspect(h(AgentParameterConfig, { ...base, ...extra })));
  return nodes;
}
const button = (nodes, text) => nodes.find(node => node.props.onClick && React.Children.toArray(node.props.children).includes(text));
const numeric = nodes => nodes.find(node => node.props.onValueChange && node.props.id && !node.props['aria-labelledby']);
const choice = nodes => nodes.find(node => node.props.onValueChange && (node.props.items || node.props['aria-labelledby']));
const change = (parameter, value, extra = {}) => ({ type: 'change', parameterId: parameter.id, value, baseVersion: base.baseVersion, ...extra });
const countFields = html => (html.match(/data-parameter-field=""/g) ?? []).length;

test('SSR defaults to inline/default and uses the same definition list, strictly filtered by host key flags', () => {
  const parameters = freeze([number, short]);
  assert.equal(htmlFor({ parameters }), htmlFor({ parameters, view: 'inline', density: 'default' }));
  for (const density of ['default', 'compact']) {
    const inline = htmlFor({ parameters, density }), full = htmlFor({ parameters, density, view: 'workspace' });
    assert.equal(countFields(inline), 1); assert.equal(countFields(full), 2);
    assert.doesNotMatch(inline, /卷名|函数练习|练习模板/); assert.match(full, /函数练习|练习模板/);
    assert.equal(countFields(htmlFor({ parameters, density, onExpand() {} })), 1);
  }
  assert.deepEqual(parameters.map(item => item.value), [24, '函数练习']);
});

test('all five input kinds use coss controls with persistent labels, units, ranges, step and explicit default sources', () => {
  const html = htmlFor({ view: 'workspace', parameters: [number, select, radio, toggle, short] });
  for (const slot of ['number-field', 'input', 'switch', 'radio-group', 'select-trigger']) assert.ok(html.includes(`data-slot="${slot}"`), slot);
  for (const text of ['题量（题）', '难度', '分值方式', '附参考答案', '卷名', '下限 1题', '上限 20题', '步长：2题', '默认：12 题；来源：练习模板', '默认：关闭；来源：学生版模板', '未提供默认值']) assert.ok(html.includes(text), text);
  assert.doesNotMatch(html, /opaque-/);
});

test('finite number changes and null emit exact version-bound payloads, without clamping, resetting or applying', () => {
  const calls = [], parameters = freeze([number]), extra = { parameters, onIntent: intent => { calls.push(intent); return 'saved'; } };
  const before = htmlFor(extra), field = numeric(capture(extra));
  assert.equal(field.props.value, 24); assert.equal(field.props.defaultValue, undefined);
  assert.equal(field.props.min, undefined); assert.equal(field.props.max, undefined); assert.equal(field.props.step, 2);
  for (const value of [0, -1, 123.456, null, NaN, Infinity, 'abc']) field.props.onValueChange(value);
  assert.deepEqual(calls, [0, -1, 123.456, null].map(value => change(number, value)));
  assert.equal(htmlFor(extra), before); assert.equal(parameters[0].value, 24);
});

test('select and radio map local option tokens to host values; disabled and unlisted options cannot emit', () => {
  for (const parameter of [select, radio]) {
    const calls = [], extra = { parameters: freeze([parameter]), onIntent: intent => calls.push(intent) };
    const before = htmlFor(extra), field = choice(capture(extra));
    assert.equal(field.props.value, '1');
    for (const value of ['0', null, '2', '9', 'opaque-basic', '']) field.props.onValueChange(value);
    assert.deepEqual(calls, [change(parameter, 'opaque-basic'), change(parameter, null)]);
    assert.equal(htmlFor(extra), before);
    const missing = htmlFor({ parameters: [{ ...parameter, value: 'opaque-missing' }] });
    assert.match(missing, /当前选项未列出/); assert.doesNotMatch(missing, /opaque-/);
  }
});

test('switch and short-text changes preserve false, empty text and whitespace and never write props', () => {
  const calls = [], parameters = freeze([toggle, { ...short, key: true }]), extra = { parameters, onIntent: intent => calls.push(intent) };
  const before = htmlFor(extra), nodes = capture(extra);
  const switchField = nodes.find(node => node.props.onCheckedChange), textField = nodes.find(node => node.props.onChange);
  switchField.props.onCheckedChange(false);
  for (const value of ['', '  新卷名  ']) textField.props.onChange({ currentTarget: { value } });
  assert.deepEqual(calls, [change(toggle, false), change(short, ''), change(short, '  新卷名  ')]);
  assert.equal(htmlFor(extra), before);
});

test('validation errors, warnings and hints stay external; changed numbers neither create nor clear results', () => {
  const parameter = { ...number, validation: [{ level: 'error', message: '题量超过本次上限。' }, { level: 'warning', message: '请预留讲评时间。' }, { level: 'hint', message: '可以参考上一份练习。' }], impact: '本次题量影响作答时长。' };
  for (const mode of modes) {
    const extra = { ...mode, parameters: freeze([parameter]), details: 'COLLAPSED_ONLY' }, before = htmlFor(extra);
    for (const fact of ['错误', '警告', '提示', ...parameter.validation.map(result => result.message), parameter.impact]) assert.ok(before.includes(fact), fact);
    assert.match(before, /aria-invalid="true"/); assert.doesNotMatch(before, /COLLAPSED_ONLY/);
    numeric(capture(extra)).props.onValueChange(10); assert.equal(htmlFor(extra), before);
  }
  assert.doesNotMatch(htmlFor({ parameters: [number] }), /aria-invalid="true"|题量超过|校验通过/);
});

test('non-key facts remain visible without mounting extra editors or exposing their values', () => {
  const hidden = { ...short, value: 'HIDDEN_VALUE', status: { state: 'unconfirmed', reason: '请核对名称。' }, lockedReason: '名称已锁定。', validation: [{ level: 'error', message: '名称需要核对。' }], impact: '名称会出现在卷首。' };
  for (const density of ['default', 'compact']) {
    const html = htmlFor({ density, parameters: [number, hidden], details: 'COLLAPSED_ONLY' });
    assert.equal(countFields(html), 1); assert.match(html, /data-parameter-other-facts/);
    for (const text of ['名称需要核对', '名称已锁定', '请核对名称', '名称会出现在卷首']) assert.ok(html.includes(text), text);
    assert.doesNotMatch(html, /HIDDEN_VALUE|COLLAPSED_ONLY/);
  }
});

test('unconfirmed is an explicit editable fact; unknown has no guessed value or editor', () => {
  const unconfirmed = { ...number, value: null, status: { state: 'unconfirmed', reason: '最新名单尚未核对。' } };
  assert.equal(numeric(capture({ parameters: [unconfirmed] })).props.value, null);
  assert.match(htmlFor({ parameters: [unconfirmed] }), /未确认：最新名单尚未核对/);
  for (const parameter of [number, select, radio, toggle, { ...short, key: true }]) {
    const html = htmlFor({ parameters: [{ ...parameter, status: { state: 'unknown', reason: '暂未取得当前值。' } }] });
    assert.match(html, /当前值未知|未知：暂未取得当前值/);
    assert.doesNotMatch(html, /<input|role="switch"|role="radio"|role="combobox"/);
  }
});

test('readonly and frozen records render values without any editable input, in both views and densities', () => {
  const parameters = freeze([number, select, radio, toggle, { ...short, key: true }]);
  for (const mode of modes) for (const restriction of [{ readOnlyReason: '当前仅供核对。' }, { frozen: { versionLabel: '确认版一', reason: '显示确认时的值。' } }, { onIntent: undefined }]) {
    const extra = { ...mode, parameters, reset: {}, ...restriction }, html = htmlFor(extra);
    assert.doesNotMatch(html, /<input|role="switch"|role="radio"|role="combobox"|恢复默认/);
    for (const text of ['24 题', '综合运用', '开启', '函数练习']) assert.ok(html.includes(text), text);
    const nodes = capture(extra);
    assert.equal(nodes.some(node => node.props.onValueChange || node.props.onCheckedChange || node.props.onChange), false);
    if (restriction.frozen) assert.match(html, /已冻结|确认时的参数 · 确认版一|显示确认时的值/);
  }
});

test('frozen then-values are supplied as a separate host record; viewing does not overwrite the current draft', () => {
  const current = freeze([{ ...number, value: 19 }]), snapshot = freeze([{ ...number, value: 12 }]);
  const before = htmlFor({ parameters: current, readOnlyReason: '查看草稿。' });
  const history = htmlFor({ parameters: snapshot, baseVersion: 'opaque-old-version', frozen: { versionLabel: '确认版', reason: '已冻结。' } });
  assert.match(before, /19 题/); assert.match(history, /12 题/); assert.doesNotMatch(history, /19 题|opaque-old-version/);
  assert.equal(htmlFor({ parameters: current, readOnlyReason: '查看草稿。' }), before);
});

test('single-field locks and readonly reasons remove only that editor and also block whole-list reset', () => {
  for (const restriction of [{ lockedReason: '已印制。' }, { readOnlyReason: '仅供查看。' }, { lockedReason: '' }, { readOnlyReason: '' }]) {
    const extra = { parameters: [{ ...number, ...restriction }, toggle], view: 'workspace', reset: {}, onIntent() { assert.fail('locked reset'); } };
    const nodes = capture(extra), reset = button(nodes, '恢复默认');
    assert.equal(numeric(nodes), undefined); assert.ok(nodes.some(node => node.props.onCheckedChange));
    assert.equal(reset.props.disabled, true); reset.props.onClick();
    assert.match(htmlFor(extra), /暂不能整体重置/);
  }
});

test('missing version, empty/duplicate parameter IDs and global readonly presence guard mutations', () => {
  for (const extra of [{ baseVersion: '' }, { parameters: [{ ...number, id: '' }] }, { parameters: [number, { ...number }] }, { readOnlyReason: '' }]) {
    const nodes = capture({ ...extra, view: 'workspace', reset: {}, onIntent() { assert.fail('invalid identity mutation'); } });
    assert.equal(nodes.some(node => node.props.onValueChange || node.props.onChange || node.props.onCheckedChange), false);
    assert.equal(button(nodes, '恢复默认'), undefined);
  }
});

test('reset is an optional workspace capability and emits only the current baseline, without copying defaults', () => {
  const calls = [], extra = { parameters: freeze([number]), reset: {}, onIntent: intent => calls.push(intent) };
  assert.equal(button(capture(extra), '恢复默认'), undefined);
  for (const density of ['default', 'compact']) {
    const state = { ...extra, view: 'workspace', density }, before = htmlFor(state);
    button(capture(state), '恢复默认').props.onClick();
    assert.deepEqual(calls.at(-1), { type: 'reset', baseVersion: base.baseVersion }); assert.equal(htmlFor(state), before);
    const disabled = button(capture({ ...state, reset: { disabledReason: '默认参数尚未取得。' } }), '恢复默认');
    assert.equal(disabled.props.disabled, true); disabled.props.onClick();
  }
  assert.equal(calls.length, 2); assert.equal(button(capture({ view: 'workspace' }), '恢复默认'), undefined);
});

test('expand passes the actual trigger; back does not apply, reset or confirm anything', () => {
  const calls = [], trigger = {}, extra = { onExpand: value => calls.push(value), onBack: () => calls.push('back'), onIntent() { assert.fail('navigation mutation'); } };
  const before = htmlFor(extra);
  button(capture(extra), '调整全部参数').props.onClick({ currentTarget: trigger });
  button(capture({ ...extra, view: 'workspace' }), '返回原位置').props.onClick();
  assert.deepEqual(calls, [trigger, 'back']); assert.equal(htmlFor(extra), before);
  assert.equal(button(capture({ onExpand: undefined }), '调整全部参数'), undefined);
  assert.ok(button(capture({ ...extra, frozen: { versionLabel: '确认版', reason: '已冻结。' } }), '查看全部参数'));
});

test('one persistent notice and collapsed details preserve boundaries in all four layouts', () => {
  for (const mode of modes) {
    const html = htmlFor({ ...mode, notice: '仅处理本次练习。', details: 'SECONDARY_EXPLANATION' });
    assert.equal((html.match(/仅处理本次练习。/g) ?? []).length, 1);
    assert.doesNotMatch(html, /SECONDARY_EXPLANATION/); assert.match(html, /说明/);
    assert.doesNotMatch(htmlFor({ ...mode, notice: null }), /data-parameter-notice/);
    assert.match(htmlFor(mode), /参数修改不代表已确认或执行/);
  }
});

test('labels and descriptions reference real DOM IDs; copy is escaped and internal IDs stay out of HTML', () => {
  const extra = { view: 'workspace', parameters: [number, select, radio, toggle, short] }, html = htmlFor(extra);
  for (const node of capture(extra)) for (const attribute of ['aria-labelledby', 'aria-describedby']) {
    for (const id of (node.props[attribute] ?? '').split(' ').filter(Boolean)) assert.ok(html.includes(`id="${id}"`), `${attribute}: ${id}`);
  }
  assert.doesNotMatch(html, /opaque-|意图|宿主|回调|适配器/);
  assert.doesNotMatch(htmlFor({ parameters: [{ ...number, label: '<script>alert(1)</script>' }] }), /<script>/);
  assert.match(htmlFor({ parameters: [] }), /暂未提供参数/);
  assert.match(htmlFor({ parameters: [short] }), /尚未指定关键参数/);
});

test('compact changes spacing, keeping fixed labels, controls, unknown, errors and locks visible', () => {
  const parameters = [number, { ...short, key: true, lockedReason: '卷名已锁定。', validation: [{ level: 'error', message: '名称需要核对。' }] }];
  for (const view of ['inline', 'workspace']) {
    const full = htmlFor({ parameters, view }), compact = htmlFor({ parameters, view, density: 'compact' });
    assert.match(compact, /data-density="compact"/); assert.match(compact, /min-w-0 gap-3 p-4/);
    assert.equal(countFields(compact), countFields(full));
    for (const text of ['题量（题）', '卷名', '名称需要核对', '卷名已锁定', 'number-field-input']) assert.ok(compact.includes(text), text);
  }
});

test('07 and 08 compose as compact sections in one 25 card, with a single shared boundary and unchanged confirmation rules', () => {
  const boundary = '参数与约束共同确认。';
  const conditions = h('div', {}, h(AgentParameterConfig, { ...base, presentation: 'inline', density: 'compact', notice: null }), h(AgentConstraintBuilder, {
    title: '处理约束', basis: { objectId: 'opaque-task', version: 'opaque-revision' }, groups: [], reconfirmation: { required: false }, presentation: 'inline', density: 'compact',
  }), h('p', {}, boundary));
  const html = render(h(AgentExecutionConfirmation, { title: '确认出卷要求', target: '函数练习', version: '参数一版', effects: ['准备候选'], conditions,
    confirmation: { state: 'blocked', description: '本次要求尚未核对。' } }));
  assert.equal((html.match(/data-slot="card"/g) ?? []).length, 1);
  assert.equal((html.match(/参数与约束共同确认。/g) ?? []).length, 1);
  assert.match(html, /data-execution-conditions/); assert.match(html, /本次要求尚未核对/);
  assert.doesNotMatch(html, /参数修改不代表|确认本次要求<|opaque-/);
});

test('two labelled demos expose inline/workspace/compact, long Chinese, math, errors, unknown and frozen fixtures', () => {
  for (const purpose of ['paper', 'grading']) {
    const html = render(h(ParameterConfigExample, { purpose, narrow: true }));
    assert.equal((html.match(/data-agent-parameter-view=/g) ?? []).length, 3);
    for (const text of ['固定示例', '关键参数', '完整参数集', '参数与约束共同确认', '查看固定冻结示例', '载入示例确认记录', 'max-w-[320px]', 'data-execution-conditions', '<math']) assert.ok(html.includes(text), text);
    if (purpose === 'paper') for (const text of ['题量', '时长', '难度', '分值方式', '本次练习最多安排', '保留必要的推理过程与单位']) assert.ok(html.includes(text), text);
    else for (const text of ['纸张', '身份方式', '预期人数', '未确认', '未知', '学号印制']) assert.ok(html.includes(text), text);
    assert.doesNotMatch(html.replace(/<[^>]*>/g, ''), /意图|宿主|回调|适配器/);
    assert.ok(availableParameterExample(purpose).every(parameter => parameter.status.state === 'provided' && !parameter.validation.length));
  }
  assert.match(render(h(AgentParameterConfigDemo)), /id="parameter-config"/);
});

test('public types require current values, key selection, explicit status and validation; defaults require a source', async () => {
  const typeFile = new URL('type-contract.tsx', runtime), path = fileURLToPath(typeFile);
  await writeFile(typeFile, `import type {AgentParameterDefinition as P,AgentParameterIntent as I,AgentParameterConfigProps as C} from '../../components/prism-next/agent-parameter-config';
const common={id:'count',label:'题量',key:true,status:{state:'provided' as const},validation:[]};
const number:P={...common,type:'number',value:null,default:{value:12,source:'练习模板'}};
// @ts-expect-error current value is mandatory
const missing:P={...common,type:'number'};
// @ts-expect-error numeric defaults cannot be strings
const wrong:P={...number,default:{value:'12',source:'模板'}};
// @ts-expect-error defaults require a source
const source:P={...number,default:{value:12}};
// @ts-expect-error unknown must have a host reason
const unknown:P={...number,status:{state:'unknown'}};
// @ts-expect-error host validation is required
const validation:P={id:'x',label:'题量',key:true,type:'number',value:1,status:{state:'provided'}};
// @ts-expect-error scalar choice must declare options
const choices:P={...common,type:'select',value:null};
const event:I={type:'change',parameterId:'count',value:1,baseVersion:'r1'};
// @ts-expect-error events require a baseline
const version:I={type:'reset'};
// @ts-expect-error config requires baseline and a single parameter definition list
const config:C={title:'参数'};
// @ts-expect-error frozen fact requires version label and reason
const frozen:C={title:'参数',baseVersion:'r1',parameters:[],frozen:{}};
void [missing,wrong,source,unknown,validation,choices,event,version,config,frozen];
`);
  try {
    const config = ts.readConfigFile(`${root}tsconfig.json`, ts.sys.readFile);
    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
    const diagnostics = ts.getPreEmitDiagnostics(ts.createProgram([path], { ...parsed.options, incremental: false, noEmit: true }));
    assert.equal(diagnostics.length, 0, diagnostics.map(value => ts.flattenDiagnosticMessageText(value.messageText, '\n')).join('\n'));
  } finally { await rm(typeFile); }
});
