import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = new URL('../.sites-runtime/scope-builder/', import.meta.url);
await mkdir(runtime, { recursive: true });
const file = new URL('test-bundle.mjs', runtime);
const bundle = await build({ stdin: { contents: `export * from './components/prism-next/agent-scope-builder'; export * from './components/prism-next/demos/agent-scope-builder';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false });
await writeFile(file, bundle.outputFiles[0].text);
const { AgentScopeBuilder, ScopeBuilderExample, AgentScopeBuilderDemo } = await import(file);
await rm(file);
const h = React.createElement;
const target = { scopeId: 'opaque-task-scope-reference', version: 'opaque-draft-revision' };
const secret = 'NEVER_DISCLOSE_PRIVATE_CLASS';
const baseDimension = { id: 'opaque-dimension-ref', access: 'available', label: '班级', required: true, core: true,
  source: { label: '当前可用班级', options: [{ id: 'class-3', label: '高二三班' }] }, value: ['class-3'], summary: '高二三班', validation: { state: 'valid', reason: '班级可用。' } };
const props = { title: '学情分析范围', scope: target, summary: '高二三班 · 第二章 二次函数 · 近两周作业', dimensions: [baseDimension], confirmation: { state: 'unconfirmed' } };
const modes = [{}, { view: 'workspace' }, { density: 'compact' }, { view: 'workspace', density: 'compact' }];
const htmlFor = extra => render(h(AgentScopeBuilder, { ...props, ...extra }));
const textOf = html => html.replace(/<[^>]*>/g, '');
function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.freeze(value); Object.values(value).forEach(freeze); }
  return value;
}
// Exercise component-created handlers and SSR, not browser interaction/focus or authorization services.
function capture(extra) {
  const nodes = [], owned = new Set(['AgentScopeBuilder', 'ScopeDimension']);
  function inspect(node) {
    if (Array.isArray(node)) return node.map(inspect);
    if (!React.isValidElement(node)) return node;
    if (typeof node.type === 'function' && owned.has(node.type.name)) return h(function Probe() { return inspect(node.type(node.props)); });
    nodes.push(node);
    return React.cloneElement(node, {}, React.Children.map(node.props.children, inspect));
  }
  render(inspect(h(AgentScopeBuilder, { ...props, ...extra })));
  return nodes;
}
const button = (nodes, text) => nodes.find(node => node.props.onClick && React.Children.toArray(node.props.children).includes(text));
const conflict = { ...baseDimension, id: 'conflicting-dimension', label: '时间范围', core: false, summary: '9 月 25 日至 9 月 1 日', validation: { state: 'conflict', reason: '结束日期早于开始日期。' } };
const restricted = { id: 'private-class-reference', access: 'restricted', label: '额外班级', required: false, validation: { state: 'out-of-scope', reason: '当前任教范围不包含所请求的班级。', count: 1 } };
const unavailable = { ...baseDimension, id: 'unavailable-dimension', label: '资源类型', core: false, summary: '文章', validation: { state: 'unavailable', reason: '资料目录暂不可用。' } };

test('scope defaults to inline/default and shows only supplied summary, validation and confirmation facts', () => {
  assert.equal(htmlFor(), htmlFor({ view: 'inline', density: 'default' }));
  const html = htmlFor();
  for (const text of [props.summary, '范围待确认', '班级（必填）', '有效', '班级可用。']) assert.ok(html.includes(text), text);
  assert.doesNotMatch(html, /data-scope-impact|范围已确认|已执行|调整完整范围|确认范围<|全部授权数据/);
  for (const value of [target.scopeId, target.version, baseDimension.id, 'class-3']) assert.ok(!html.includes(value), value);
});

test('inline selects host core dimensions plus every issue; missing expansion retains all summaries', () => {
  const extra = { ...baseDimension, id: 'extra', label: '来源', summary: '校内作业', core: false };
  const input = { dimensions: [baseDimension, extra, conflict, restricted, unavailable], onExpand() {} };
  for (const density of ['default', 'compact']) {
    const html = htmlFor({ ...input, density });
    assert.doesNotMatch(html, /校内作业/);
    for (const text of [baseDimension.summary, conflict.validation.reason, restricted.validation.reason, unavailable.validation.reason]) assert.ok(html.includes(text));
  }
  assert.match(htmlFor({ ...input, onExpand: undefined }), /校内作业/);
  assert.match(htmlFor({ ...input, view: 'workspace' }), /校内作业/);
  assert.doesNotMatch(htmlFor({ ...input, onExpand: undefined }), /调整完整范围/);
});

test('all four host validation values and reasons remain outside collapsed details in both views and densities', () => {
  for (const mode of modes) {
    const html = htmlFor({ ...mode, dimensions: [baseDimension, conflict, restricted, unavailable], onExpand() {}, details: 'supplementary-hidden-text' });
    for (const text of ['有效', '范围冲突', '超出授权范围', '数据不可用', '结束日期早于开始日期。', '当前任教范围不包含所请求的班级。', '资料目录暂不可用。', '（1 项）']) assert.ok(html.includes(text), text);
    assert.doesNotMatch(html, /supplementary-hidden-text/);
  }
});

test('restricted dimensions ignore private values, options, summaries and both renderer slots at runtime', () => {
  function forbidden() { assert.fail('restricted renderer called'); }
  const injected = { ...restricted, value: secret, summary: secret, source: { label: secret, options: [secret] }, renderEditor: forbidden, renderInlineEditor: forbidden };
  for (const mode of modes) {
    const html = htmlFor({ ...mode, dimensions: [injected], onValueChange: forbidden, onExpand() {} });
    assert.match(html, /当前任教范围不包含所请求的班级/);
    for (const value of [secret, restricted.id]) assert.ok(!html.includes(value));
    // Untyped contradictory access still cannot disclose an explicitly out-of-scope validation.
    assert.ok(!htmlFor({ ...mode, dimensions: [{ ...injected, access: 'available' }] }).includes(secret));
  }
});

test('impact and exclusion counts are optional host facts, never inferred from dimensions or option counts', () => {
  for (const mode of modes) {
    assert.doesNotMatch(htmlFor(mode), /data-scope-impact|涉及 .*学生/);
    assert.match(htmlFor({ ...mode, impact: '涉及 43 名学生、6 份作业' }), /涉及 43 名学生、6 份作业/);
    assert.match(htmlFor({ ...mode, impact: '涉及 0 名学生' }), /涉及 0 名学生/);
    const html = htmlFor({ ...mode, exclusions: [{ reason: '部分资料暂不可用。', details: secret, name: secret }, { reason: '已排除不可用材料。', count: 0, objects: [secret] }] });
    assert.match(html, /部分资料暂不可用。/); assert.match(html, /已排除不可用材料。（0 项）/); assert.ok(!html.includes(secret));
  }
});

test('editor receives the exact frozen controlled value/options and returns a revision-bound change without normalization', () => {
  const value = freeze({ ids: ['a', 'b'], from: '  保留空格  ' }), options = freeze([{ id: 'a' }, { id: 'b' }]);
  let editor; const changes = [];
  const dimension = freeze({ ...baseDimension, source: { label: '获权选项', options }, value, renderEditor: context => { editor = context; return h('p', null, '领域选择控件'); } });
  const extra = { view: 'workspace', dimensions: freeze([dimension]), onValueChange: change => changes.push(change) };
  const before = htmlFor(extra);
  assert.equal(editor.value, value); assert.equal(editor.options, options);
  assert.ok(before.includes(`id="${editor.labelledBy}"`)); assert.ok(before.includes(`id="${editor.describedBy}"`));
  const next = freeze({ ids: ['b'], from: '' }); editor.onChange(next); editor.onChange(undefined);
  assert.deepEqual(changes, [{ ...target, dimensionId: dimension.id, value: next }, { ...target, dimensionId: dimension.id, value: undefined }]);
  assert.equal(htmlFor(extra), before); assert.deepEqual(value, { ids: ['a', 'b'], from: '  保留空格  ' });
  assert.doesNotMatch(before, /范围已变化|范围已确认/);
});

test('inline uses only the explicit small editor; workspace uses full editor; unavailable/disabled/missing callbacks mount neither', () => {
  let small = 0, full = 0;
  const dimension = { ...baseDimension, renderEditor: () => { full++; return h('p', null, '完整选择'); }, renderInlineEditor: () => { small++; return h('p', null, '快捷选择'); } };
  const extra = { dimensions: [dimension], onValueChange() {} };
  assert.match(htmlFor(extra), /快捷选择/); assert.equal(full, 0); assert.equal(small, 1);
  assert.match(htmlFor({ ...extra, view: 'workspace' }), /完整选择/); assert.equal(full, 1);
  for (const mode of modes) {
    for (const restriction of [{ onValueChange: undefined }, { disabledReason: '当前仅可查看。' }, { dimensions: [{ ...dimension, disabledReason: '来源正在更新。' }] }, { dimensions: [{ ...dimension, validation: unavailable.validation }] }, { scope: { ...target, version: '' } }]) {
      const html = htmlFor({ ...extra, ...mode, ...restriction });
      assert.doesNotMatch(html, /快捷选择|完整选择/);
    }
  }
  assert.equal(full, 1); assert.equal(small, 1);
  assert.match(htmlFor({ ...extra, dimensions: [{ ...dimension, validation: conflict.validation }] }), /快捷选择/);
});

test('confirmation emits only the exact current target and never promotes clicks or callback results to confirmed state', () => {
  const calls = [], extra = { onConfirm: value => { calls.push(value); return { state: 'confirmed' }; } };
  const before = htmlFor(extra), confirm = button(capture(extra), '确认范围');
  confirm.props.onClick(); confirm.props.onClick();
  assert.deepEqual(calls, [target, target]); assert.equal(htmlFor(extra), before); assert.doesNotMatch(before, /范围已确认/);
  const confirmed = { ...extra, confirmation: { state: 'confirmed', version: target.version } };
  assert.match(htmlFor(confirmed), /范围已确认/); assert.equal(button(capture(confirmed), '确认范围'), undefined);
});

test('host-declared changes and a confirmed older revision require fresh confirmation without resetting the values', () => {
  const calls = [], next = { ...target, version: 'next-revision' };
  for (const mode of modes) for (const confirmation of [{ state: 'changed', reason: '时间已调整。' }, { state: 'confirmed', version: target.version }]) {
    const extra = { ...mode, scope: next, confirmation, onConfirm: value => calls.push(value) };
    const before = htmlFor(extra);
    assert.match(before, /范围已变化，需重新确认/); assert.match(before, /高二三班/); assert.doesNotMatch(before, /范围已确认/);
    button(capture(extra), '重新确认范围').props.onClick(); assert.deepEqual(calls.at(-1), next); assert.equal(htmlFor(extra), before);
  }
});

test('empty scope, host issues, missing identity and disabled reasons visibly block confirmation and protect handlers', () => {
  for (const extra of [{ summary: null, dimensions: [] }, { summary: '  ' }, { dimensions: [conflict] }, { dimensions: [restricted] }, { dimensions: [unavailable] }, { scope: { ...target, scopeId: '' } }, { disabledReason: '历史范围只读。' }, { confirmDisabledReason: '正在核对范围。' }]) {
    const state = { ...extra, onConfirm() { assert.fail('blocked confirmation'); } };
    const node = button(capture(state), '确认范围');
    assert.equal(node.props.disabled, true); assert.ok(node.props['aria-describedby']);
    assert.ok(htmlFor(state).includes(`id="${node.props['aria-describedby']}"`)); node.props.onClick();
  }
  const html = htmlFor({ summary: null, dimensions: [] });
  assert.match(html, /尚未指定范围/); assert.match(html, /暂未提供可选范围/); assert.doesNotMatch(html, /全部授权/);
  assert.doesNotMatch(htmlFor({ dimensions: [conflict], confirmation: { state: 'confirmed', version: target.version } }), /范围已确认/);
});

test('reset/defaults are workspace-only intents and preserve input until new props; disabled actions are guarded', () => {
  const calls = [], extra = { onReset: value => calls.push(['reset', value]), onRestoreDefaults: value => calls.push(['defaults', value]) };
  assert.doesNotMatch(htmlFor(extra), /重置范围|恢复默认/);
  const state = { ...extra, view: 'workspace', dimensions: freeze([baseDimension]) }, before = htmlFor(state);
  button(capture(state), '重置范围').props.onClick(); button(capture(state), '恢复默认').props.onClick();
  assert.deepEqual(calls, [['reset', target], ['defaults', target]]); assert.equal(htmlFor(state), before);
  for (const name of ['重置范围', '恢复默认']) {
    const action = button(capture({ ...state, disabledReason: '历史范围只读。' }), name);
    assert.equal(action.props.disabled, true); action.props.onClick();
  }
  assert.equal(calls.length, 2); assert.doesNotMatch(htmlFor({ view: 'workspace' }), /重置范围|恢复默认/);
});

test('expansion/return preserve the trigger and do not confirm, edit or create another scope', () => {
  const calls = [], trigger = {}, extra = { onExpand: source => calls.push(['expand', source]), onBack: () => calls.push(['back']), onConfirm() { assert.fail('not confirmation'); }, onValueChange() { assert.fail('not editing'); } };
  const before = htmlFor(extra);
  button(capture(extra), '调整完整范围').props.onClick({ currentTarget: trigger });
  button(capture({ ...extra, view: 'workspace' }), '返回原位置').props.onClick();
  assert.deepEqual(calls, [['expand', trigger], ['back']]); assert.equal(htmlFor(extra), before);
  assert.doesNotMatch(htmlFor({ ...extra, view: 'workspace' }), /调整完整范围/);
  assert.doesNotMatch(htmlFor({ ...extra, onExpand: undefined }), /调整完整范围/);
});

test('compact keeps non-core edit restrictions visible and text content is escaped without a hidden data payload', () => {
  const html = htmlFor({ density: 'compact', onExpand() {}, dimensions: [{ ...baseDimension, core: false, disabledReason: '当前选择正在核对。', summary: '<script>private code</script>' }], notice: '一条范围边界说明。', details: '补充解释不常驻。' });
  assert.match(html, /当前选择正在核对/); assert.match(html, /&lt;script&gt;/); assert.doesNotMatch(html, /<script>|补充解释不常驻/);
  assert.equal((html.match(/一条范围边界说明。/g) ?? []).length, 1);
});

test('two labelled fixtures each compose three presentations and actual range/tree/filter/date controls with long Chinese and math', () => {
  for (const purpose of ['analysis', 'preparation']) {
    const html = render(h(ScopeBuilderExample, { purpose, narrow: true }));
    assert.equal((html.match(/data-agent-scope-view=/g) ?? []).length, 3);
    for (const text of ['固定示例', '对话范围与微调', '完整范围构建', '紧凑范围确认', '载入示例确认记录']) assert.ok(html.includes(text), text);
    assert.match(html, /<math.*<mfrac>/); assert.match(html, /max-w-\[320px\]/); assert.doesNotMatch(textOf(html), /意图|宿主|回调|受控/);
    if (purpose === 'analysis') {
      for (const text of ['学情分析范围', '高二三班', '第二章 二次函数', '近两周作业', '超出授权范围', '涉及 43 名学生、6 份作业', 'data-range-picker', '起止日期']) assert.ok(html.includes(text), text);
    } else {
      for (const text of ['备课资料范围', '教材版本', '资源类型', '资料目录暂不可用', 'data-slot="tree"', '结合图像与实际情境']) assert.ok(html.includes(text), text);
      assert.doesNotMatch(html, /data-scope-impact/);
    }
  }
  assert.match(render(h(AgentScopeBuilderDemo)), /320px 窄容器/);
});

test('scope public types require controlled values, host validation and confirmation revision; restricted data is prohibited', async () => {
  const typeFile = new URL('type-contract.tsx', runtime), path = fileURLToPath(typeFile);
  await writeFile(typeFile, `import type { AgentScopeDimension as D, AgentScopeConfirmation as C, AgentScopeBuilderProps as P } from '../../components/prism-next/agent-scope-builder';
const base = { id: 'd', label: '班级', required: true };
const valid: D = { ...base, access: 'available', source: {label:'当前可用班级', options:[]}, value: [], summary: null, validation: {state:'valid', reason:'允许选择'} };
const restricted: D = { ...base, access: 'restricted', validation: {state:'out-of-scope', reason:'不可访问'} };
// @ts-expect-error restricted values cannot be supplied
const leak: D = { ...restricted, value: ['private'] };
// @ts-expect-error restricted options cannot be supplied
const options: D = { ...restricted, source: {label:'private', options:[]} };
// @ts-expect-error restricted renderers cannot be supplied
const renderer: D = { ...restricted, renderEditor: () => 'private' };
// @ts-expect-error a reason is required for every validation fact
const noReason: D = { ...valid, validation: {state:'conflict'} };
// @ts-expect-error values are controlled, no uncontrolled/defaultValue alternative
const uncontrolled: D = { ...base, access: 'available', source: {label:'可用', options:[]}, defaultValue: [], summary:null, validation:{state:'valid',reason:'可用'} };
// @ts-expect-error confirmation must identify its revision
const confirmation: C = {state:'confirmed'};
const props: P = {title:'本次范围',scope:{scopeId:'s',version:'r1'},dimensions:[valid,restricted],summary:null,confirmation:{state:'unconfirmed'}};
// @ts-expect-error required dimension list cannot be omitted
const empty: P = {title:'本次范围',scope:{scopeId:'s',version:'r1'},summary:null,confirmation:{state:'unconfirmed'}};
void [leak,options,renderer,noReason,uncontrolled,confirmation,props,empty];
`);
  try {
    const config = ts.readConfigFile(`${root}tsconfig.json`, ts.sys.readFile);
    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
    const program = ts.createProgram([path], { ...parsed.options, incremental: false, noEmit: true });
    const diagnostics = ts.getPreEmitDiagnostics(program);
    assert.equal(diagnostics.length, 0, diagnostics.map(value => ts.flattenDiagnosticMessageText(value.messageText, '\n')).join('\n'));
  } finally { await rm(typeFile); }
});
