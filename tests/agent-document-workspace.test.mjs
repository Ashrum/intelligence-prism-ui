import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = new URL('../.sites-runtime/document-workspace/', import.meta.url);
await mkdir(runtime, { recursive: true });
const file = new URL('test-bundle.mjs', runtime);
const bundle = await build({ stdin: { contents: `export * from './components/prism-next/agent-document-workspace'; export { documentExamples, DocumentWorkspaceExample, AgentDocumentWorkspaceDemo } from './components/prism-next/demos/agent-document-workspace';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false });
await writeFile(file, bundle.outputFiles[0].text);
const { AgentDocumentWorkspace, documentExamples, DocumentWorkspaceExample, AgentDocumentWorkspaceDemo } = await import(file);
await rm(file);
const h = React.createElement;
const none = { state: 'none' };
const supported = { status: 'supported', conversion: none };
const unsupported = { status: 'unsupported', reason: '此格式不支持此操作。', conversion: none };
const limited = { status: 'limited', reason: '仅限指定章节。', conversion: { state: 'lossy', description: '原始版式将丢失。' } };
const kinds = ['view', 'edit', 'annotate', 'export'];
const modes = [{ view: 'inline' }, { view: 'workspace' }, { view: 'inline', density: 'compact' }, { view: 'workspace', density: 'compact' }];
const props = {
  document: { id: 'lesson-1', title: '教学提纲', version: 'v2', format: '纯文本', contentScope: '全文 · 两章与一个子节' },
  capabilities: Object.fromEntries(kinds.map(kind => [kind, supported])),
  sections: [{ id: 'first', title: '教学目标', content: '完整正文一', children: [{ id: 'nested', title: '嵌套目标', content: '子节正文' }] }, { id: 'second', title: '列式练习', content: '完整正文二' }],
  activeSection: 'first',
  preview: { kind: 'excerpt', range: '第 1 章 · 第 1 段', content: '有限节选' },
};
const quickActions = kinds.map(capability => ({ id: capability, label: `测试${capability}`, capability }));
const htmlFor = extra => render(h(AgentDocumentWorkspace, { ...props, ...extra }));
function capture(extra) {
  const nodes = [];
  const owned = new Set(['AgentDocumentWorkspace', 'DocumentQuickAction', 'DocumentDirectory', 'DocumentSections', 'DocumentContent', 'DocumentCapabilities']);
  function inspect(node) {
    if (Array.isArray(node)) return node.map(inspect);
    if (!React.isValidElement(node)) return node;
    if (typeof node.type === 'function' && owned.has(node.type.name)) return h(function Probe() { return inspect(node.type(node.props)); });
    nodes.push(node);
    return React.cloneElement(node, {}, React.Children.map(node.props.children, inspect));
  }
  render(inspect(h(AgentDocumentWorkspace, { ...props, ...extra })));
  return nodes;
}
function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.freeze(value); Object.values(value).forEach(freeze); }
  return value;
}
const edits = extra => capture({ view: 'workspace', ...extra }).filter(node => node.props.id?.endsWith('-editor'));

test('default inline shows bounded excerpt, identity, version and format without implying full reading', () => {
  const html = htmlFor();
  for (const text of ['data-agent-document-view="inline"', '当前状态', '当前版本：v2', '纯文本', '节选范围：第 1 章 · 第 1 段', '有限节选', '状态未确认']) assert.ok(html.includes(text), text);
  assert.doesNotMatch(html, /完整正文|子节正文|已读取|已引用|打开文档/);
  assert.match(htmlFor({ preview: undefined }), /暂未提供摘要或节选/);
  assert.match(htmlFor({ preview: { ...props.preview, kind: 'summary' } }), /摘要范围/);
});

test('every capability controls quick actions in both views and densities; unsupported never becomes executable', () => {
  for (const mode of modes) for (const kind of kinds) for (const capability of [supported, limited, unsupported]) {
    const html = htmlFor({ ...mode, capabilities: { ...props.capabilities, [kind]: capability }, quickActions, onAction() {} });
    assert.equal(html.includes(`data-document-action="${kind}"`), capability.status !== 'unsupported');
    if (kind === 'view' && capability.status === 'unsupported') assert.doesNotMatch(html, /data-document-action=|完整正文|有限节选|子节正文/);
    if (capability.status === 'limited') for (const text of [limited.reason, limited.conversion.description]) assert.ok(html.includes(text));
  }
  assert.doesNotMatch(htmlFor({ quickActions }), /data-document-action=/);
  assert.doesNotMatch(htmlFor({ quickActions: [{ id: 'bad', label: '任意命令', capability: 'script' }], onAction() {} }), /任意命令/);
});

test('limited and supported callbacks emit version-bound requests without modifying inputs or save state', () => {
  const calls = [], document = freeze({ ...props.document }), capabilities = freeze({ ...props.capabilities, export: limited });
  const extra = { document, capabilities, save: { state: 'unknown' }, quickActions: freeze(quickActions), onAction: intent => calls.push(intent) };
  const before = htmlFor(extra);
  capture(extra).filter(node => node.props['data-document-action']).forEach(node => node.props.onClick());
  assert.deepEqual(calls, kinds.map(capability => ({ documentId: 'lesson-1', version: 'v2', actionId: capability, capability })));
  assert.equal(htmlFor(extra), before);
});

test('disabled action preserves its reason and guards even direct handler calls', () => {
  let calls = 0;
  const extra = { quickActions: [{ id: 'save', label: '保存草稿', capability: 'edit', disabledReason: '请先核对冲突版本。' }], onAction() { calls++; } };
  const node = capture(extra).find(item => item.props['data-document-action']);
  assert.equal(node.props.disabled, true); assert.ok(node.props['aria-describedby'].includes('-reason'));
  node.props.onClick(); assert.equal(calls, 0); assert.match(htmlFor(extra), /请先核对冲突版本/);
});

test('controlled chapter editing preserves exact input; only host replacement changes rendering', () => {
  const values = freeze({ first: '  原稿\n第二行  ', second: '不改此节' }), calls = [];
  const draft = { baseVersion: 'v1', values, onChange: change => calls.push(change) };
  const extra = { draft, save: { state: 'saved-draft' } };
  const before = htmlFor({ ...extra, view: 'workspace' }), node = edits(extra)[0];
  assert.equal(node.props.value, values.first); assert.equal(node.props.readOnly, false);
  node.props.onChange({ target: { value: '  新稿\n不裁剪  ' } });
  assert.deepEqual(calls, [{ documentId: 'lesson-1', version: 'v2', baseVersion: 'v1', sectionId: 'first', value: '  新稿\n不裁剪  ' }]);
  assert.equal(htmlFor({ ...extra, view: 'workspace' }), before); assert.equal(values.first, '  原稿\n第二行  ');
  for (const mode of modes) htmlFor({ ...extra, ...mode });
  assert.equal(calls.length, 1);
  assert.equal(edits({ ...extra, activeSection: 'second' })[0].props.value, values.second);
  assert.equal(edits({ ...extra, draft: { ...draft, values: { ...values, first: '' } } })[0].props.value, '');
  const nested = { ...extra, activeSection: 'nested', draft: { ...draft, values: { nested: '子节草稿' } } };
  assert.equal(edits(nested).length, 1); assert.equal(edits(nested)[0].props.value, '子节草稿');
});

test('editing capability, absent values, identity, baseline and host read-only reason do not invent writable drafts', () => {
  let calls = 0;
  const draft = { baseVersion: 'v1', values: { first: '保留' }, onChange() { calls++; } };
  for (const extra of [
    { capabilities: { ...props.capabilities, edit: unsupported } },
    { document: { ...props.document, version: '' } },
    { document: { ...props.document, snapshot: '' } },
    { activeSection: 'missing' },
  ]) assert.equal(edits({ draft, ...extra }).length, 0);
  for (const change of [{ baseVersion: '' }, { readOnlyReason: '另一位教师正在处理此章节。' }]) {
    const node = edits({ draft: { ...draft, ...change } })[0];
    assert.equal(node.props.readOnly, true); node.props.onChange({ target: { value: '不可写' } });
  }
  assert.equal(calls, 0);
  assert.equal(edits({ draft: { ...draft, values: {} } }).length, 0);
  assert.match(htmlFor({ view: 'workspace', draft: { ...draft, values: {} } }), /本章节暂未提供可编辑文本/);
  assert.equal(edits({ draft, capabilities: { ...props.capabilities, edit: limited } })[0].props.readOnly, false);
});

test('all five save labels are only host facts; current and historical defaults remain unknown', () => {
  const labels = { unsaved: '未保存', 'saved-draft': '已保存草稿', submitted: '已提交', conflict: '冲突', unknown: '状态未确认' };
  for (const mode of modes) for (const [state, label] of Object.entries(labels)) {
    const html = htmlFor({ ...mode, save: { state, description: '外部记录描述' } });
    assert.ok(html.includes(`>${label}</span>`), state); assert.match(html, /外部记录描述/);
  }
  assert.match(htmlFor({ document: { ...props.document, snapshot: '昨天' } }), /当时保存状态.*状态未确认/);
  assert.doesNotMatch(htmlFor(), /已保存草稿|已提交/);
});

test('annotations retain anchor, author, time and own status; add only emits chapter-bound intent', () => {
  const annotations = freeze([{ id: 'a1', version: 'v2', anchor: { sectionId: 'first', paragraph: '第 2 段' }, author: '教师甲', time: '2026-09-25 09:00', state: 'open', content: '请核对条件。' }]);
  const calls = [], extra = { view: 'workspace', annotations, onAddAnnotation: intent => calls.push(intent) };
  const before = htmlFor(extra);
  for (const text of ['教师甲', '2026-09-25 09:00', '待处理', '章节：教学目标', '段落：第 2 段', '批注版本：v2']) assert.ok(before.includes(text));
  capture(extra).find(node => node.props['aria-label'] === '新增批注：教学目标').props.onClick();
  assert.deepEqual(calls, [{ documentId: 'lesson-1', version: 'v2', sectionId: 'first' }]); assert.equal(htmlFor(extra), before);
  const missing = htmlFor({ view: 'workspace', annotations: [{ ...annotations[0], time: undefined, state: 'unknown' }] });
  assert.match(missing, /时间未确认/); assert.match(missing, /状态未确认/);
});

test('annotation limitations govern add actions without deleting existing permitted records', () => {
  const annotations = [{ id: 'a', version: 'v2', anchor: { sectionId: 'first' }, author: '甲', state: 'resolved', content: '原批注' }];
  for (const capability of [limited, supported, unsupported]) {
    const html = htmlFor({ view: 'workspace', capabilities: { ...props.capabilities, annotate: capability }, annotations, onAddAnnotation() {} });
    assert.match(html, /原批注/); assert.equal(html.includes('新增批注：教学目标'), capability.status !== 'unsupported');
  }
  assert.doesNotMatch(htmlFor({ view: 'workspace', annotations }), /新增批注/);
});

test('historical versions remain read-only even with writable props and injected actions', () => {
  for (const snapshot of ['昨天的版本', '']) for (const mode of modes) {
    const extra = { ...mode, document: { ...props.document, version: 'v1', snapshot, currentVersion: 'v3' },
      draft: { baseVersion: 'v2', values: { first: '不能泄漏当前草稿' }, onChange() { assert.fail(); } }, quickActions, onAction() {}, onAddAnnotation() { assert.fail(); } };
    const html = htmlFor(extra);
    for (const text of ['历史版本（只读）', '当时版本：v1', '当前版本：v3', '当时保存状态']) assert.ok(html.includes(text));
    assert.doesNotMatch(html, /textarea|不能泄漏当前草稿|新增批注|data-document-action="(?:edit|annotate)"/);
    assert.match(html, /data-document-action="view"/); assert.match(html, /data-document-action="export"/);
  }
});

test('historical annotation version is not filled from current document or used to navigate wrong content', () => {
  const html = htmlFor({ view: 'workspace', onNavigate() {}, annotations: [{ id: 'old', version: 'v1', anchor: { sectionId: 'first', paragraph: '旧第 1 段' }, author: '乙', state: 'open', content: '旧批注' }] });
  assert.match(html, /批注版本：v1/); assert.match(html, /章节：first/); assert.doesNotMatch(html, /定位批注/);
});

test('hierarchical structure is fully readable and navigation remains externally controlled', () => {
  const sections = freeze(structuredClone(props.sections)), calls = [], trigger = {};
  const extra = { view: 'workspace', sections, onNavigate: (...args) => calls.push(args) };
  const before = htmlFor(extra);
  for (const text of ['完整正文一', '完整正文二', '子节正文', '章节目录', '<h5']) assert.ok(before.includes(text));
  const target = capture(extra).find(node => node.props['data-section-target'] === 'nested');
  target.props.onClick({ currentTarget: trigger });
  assert.deepEqual(calls, [['nested', trigger]]); assert.equal(htmlFor(extra), before);
  const updated = capture({ ...extra, activeSection: 'nested' }).find(node => node.props['data-section-target'] === 'nested');
  assert.equal(updated.props['aria-current'], 'location');
  assert.match(htmlFor({ ...extra, activeSection: 'missing' }), /当前章节暂不可定位/);
  assert.match(htmlFor({ ...extra, activeSection: null }), /尚未选择章节/);
  assert.doesNotMatch(htmlFor({ view: 'workspace' }), /data-section-target=/);
});

test('directory arrow, Home and End keys move focus without changing selection or emitting navigation', () => {
  let navigations = 0, focus = -1, prevented = 0;
  const buttons = [0, 1, 2].map(index => ({ focus() { focus = index; } }));
  const nav = capture({ view: 'workspace', onNavigate() { navigations++; } }).find(node => node.type === 'nav');
  for (const [key, from, to] of [['ArrowDown', 0, 1], ['ArrowUp', 2, 1], ['Home', 2, 0], ['End', 0, 2], ['ArrowUp', 0, 0]]) {
    nav.props.onKeyDown({ key, currentTarget: { querySelectorAll: () => buttons }, target: buttons[from], preventDefault() { prevented++; } });
    assert.equal(focus, to);
  }
  assert.equal(prevented, 5); assert.equal(navigations, 0);
});

test('expand and return are view requests only; missing expand or view support leaves no entry', () => {
  const calls = [], trigger = {}, extra = { onExpand: value => calls.push(value), onBack: () => calls.push('back') };
  const before = htmlFor(extra);
  capture(extra).find(node => node.props.onClick && React.Children.toArray(node.props.children).includes('打开文档')).props.onClick({ currentTarget: trigger });
  capture({ ...extra, view: 'workspace' }).find(node => node.props.onClick && React.Children.toArray(node.props.children).includes('返回原位置')).props.onClick();
  assert.deepEqual(calls, [trigger, 'back']); assert.equal(htmlFor(extra), before);
  assert.doesNotMatch(htmlFor(), /打开文档/);
  assert.doesNotMatch(htmlFor({ ...extra, view: 'workspace' }), /打开文档/);
  assert.doesNotMatch(htmlFor({ ...extra, capabilities: { ...props.capabilities, view: unsupported } }), /打开文档/);
});

test('compact keeps restrictions, conversion risks, scope and conflict visible outside details', () => {
  for (const view of ['inline', 'workspace']) {
    const html = htmlFor({ view, density: 'compact', capabilities: { ...props.capabilities, view: limited, edit: unsupported }, save: { state: 'conflict', description: '基准 v1 与当前 v2 冲突，草稿保留。' }, details: '补充说明' });
    const constant = html.slice(0, html.indexOf('data-slot="collapsible"'));
    for (const text of [limited.reason, limited.conversion.description, unsupported.reason, '内容范围', '基准 v1 与当前 v2 冲突']) assert.ok(constant.includes(text), text);
  }
});

test('plain text is escaped, multiline text remains exact, and host formulas are preserved', () => {
  const content = '<script>alert(1)</script>\n  **不是 Markdown**  ';
  const html = htmlFor({ view: 'workspace', sections: [{ id: 'first', title: '正文', content }, { id: 'math', title: '公式', content: h('math', { className: 'prism-math' }, h('mfrac', null, h('mn', null, '1'), h('mn', null, '2'))) }] });
  assert.doesNotMatch(html, /<script>/); assert.match(html, /&lt;script&gt;/); assert.ok(html.includes('\n  **不是 Markdown**  '));
  assert.match(html, /<math.*<mfrac>/); assert.match(html, /text-read-body/);
});

test('two labelled examples cover three presentations, five editable teaching stages and honest PDF limitations', () => {
  assert.equal(documentExamples.outline.sections.length, 5);
  for (const purpose of ['outline', 'pdf']) {
    const html = render(h(DocumentWorkspaceExample, { purpose, narrow: true }));
    assert.equal((html.match(/data-agent-document-view=/g) ?? []).length, 3);
    for (const text of ['固定示例', '对话摘要', '完整阅读与章节编辑', '紧凑摘要', documentExamples[purpose].title]) assert.ok(html.includes(text));
    assert.doesNotMatch(html, /意图|宿主|回调|受控/);
    if (purpose === 'outline') assert.match(html, /textarea/);
    else { assert.doesNotMatch(html, /textarea|请求保存草稿/); assert.match(html, /PDF 仅可阅读，不可编辑/); assert.match(html, /<math.*<mfrac>/); assert.match(html, /不能写回 PDF 页面/); }
  }
  assert.match(render(h(AgentDocumentWorkspaceDemo)), /320px 窄容器/);
});

test('public types require all capabilities, explicit conversion risk, limitation reasons and controlled drafts', async () => {
  const typeFile = new URL('type-contract.tsx', runtime), path = fileURLToPath(typeFile);
  await writeFile(typeFile, `import type { AgentDocumentCapabilities as C, AgentDocumentCapability as A, AgentDocumentDraft as D, AgentDocumentWorkspaceProps as P, AgentDocumentAction as Q } from '../../components/prism-next/agent-document-workspace';
const valid: A = { status: 'limited', reason: '部分内容', conversion: { state: 'lossy', description: '版式丢失' } };
const all: C = { view: valid, edit: valid, annotate: valid, export: valid };
// @ts-expect-error all four capabilities are mandatory
const missing: C = { view: valid, edit: valid, annotate: valid };
// @ts-expect-error limitations need a reason
const noReason: A = { status: 'unsupported', conversion: { state: 'none' } };
// @ts-expect-error every capability explicitly declares conversion risk
const noConversion: A = { status: 'supported' };
// @ts-expect-error lossy conversion requires explanation
const noRisk: A = { status: 'supported', conversion: { state: 'lossy' } };
const draft: D = { baseVersion: 'v1', values: { first: '' }, onChange(change) { change.value.toUpperCase(); } };
// @ts-expect-error cannot create an uncontrolled initial draft
const initial: D = { baseVersion: 'v1', initialValue: 'text', onChange() {} };
// @ts-expect-error edit values need a change receiver
const noChange: D = { baseVersion: 'v1', values: {} };
// @ts-expect-error draft requires a base version
const noBase: D = { values: {}, onChange() {} };
// @ts-expect-error quick actions are capability-bound, not arbitrary script instructions
const arbitrary: Q = { id: 'x', label: 'x', capability: 'script' };
// @ts-expect-error document props require capabilities
const props: P = { document: { id: 'x', title: 'x', version: 'v1', format: 'text', contentScope: '全文' }, sections: [], activeSection: null };
void [all, missing, noReason, noConversion, noRisk, draft, initial, noChange, noBase, arbitrary, props];
`);
  try {
    const config = ts.readConfigFile(`${root}tsconfig.json`, ts.sys.readFile);
    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
    const program = ts.createProgram([path], { ...parsed.options, incremental: false, noEmit: true });
    const diagnostics = ts.getPreEmitDiagnostics(program);
    assert.equal(diagnostics.length, 0, diagnostics.map(value => ts.flattenDiagnosticMessageText(value.messageText, '\n')).join('\n'));
  } finally { await rm(typeFile); }
});
