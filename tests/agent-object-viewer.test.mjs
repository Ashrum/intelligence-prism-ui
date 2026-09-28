import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = new URL('../.sites-runtime/object-viewer/', import.meta.url);
await mkdir(runtime, { recursive: true });
const file = new URL('test-bundle.mjs', runtime);
const bundle = await build({ stdin: { contents: `export * from './components/prism-next/agent-object-viewer'; export * from './components/prism-next/demos/agent-object-viewer';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false });
await writeFile(file, bundle.outputFiles[0].text);
const { AgentObjectViewer, ObjectViewerExample, AgentObjectViewerDemo, objectViewerExamples } = await import(file);
await rm(file);
const h = React.createElement;
const object = { id: 'object-37282bb3-2e92-4dcf-801d-a79763fae8ad', name: '课堂练习第 2 题', type: '题目' };
const version = { id: 'version-8c55c1e7-9641-49ad-a3dd-ec3bbace67f8', label: 'v2', state: 'current' };
const secret = 'NEVER_DISCLOSE_THIS_FIELD';
const sections = [
  { id: 'opaque-section-stem', title: '题干', summary: '关键题干摘要', content: h('p', null, '完整题干插槽') },
  { id: 'opaque-section-source', title: '来源', summary: '关键来源摘要', content: h('p', null, '完整来源插槽') },
  { id: 'opaque-section-extra', title: '补充材料', summary: '第三条摘要不常驻', content: '第三条完整插槽' },
];
const props = { object, version, access: { state: 'available', scope: '仅本题内容' }, source: '课堂练习', sections, activeSection: sections[0].id };
const modes = [{}, { view: 'workspace' }, { density: 'compact' }, { view: 'workspace', density: 'compact' }];
const htmlFor = extra => render(h(AgentObjectViewer, { ...props, ...extra }));
const textOf = html => html.replace(/<[^>]*>/g, '');
const actions = [
  { id: 'collect', kind: 'add-to-collection', label: '加入集合' },
  { id: 'review', kind: 'review', label: '复核题目' },
  { id: 'evidence', kind: 'drilldown', label: '下钻证据' },
];
const versions = [{ ...version }, { id: 'old-version-reference', label: 'v1', state: 'historical' }];
function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.freeze(value); Object.values(value).forEach(freeze); }
  return value;
}
// SSR and actual component-created callbacks, not DOM interaction or browser acceptance.
function capture(extra) {
  const nodes = [], owned = new Set(['AgentObjectViewer', 'ObjectSection', 'ObjectContent', 'ObjectAction', 'ObjectVersionChoice']);
  function inspect(node) {
    if (Array.isArray(node)) return node.map(inspect);
    if (!React.isValidElement(node)) return node;
    if (typeof node.type === 'function' && owned.has(node.type.name)) return h(function Probe() { return inspect(node.type(node.props)); });
    nodes.push(node);
    return React.cloneElement(node, {}, React.Children.map(node.props.children, inspect));
  }
  render(inspect(h(AgentObjectViewer, { ...props, ...extra })));
  return nodes;
}
const button = (nodes, label) => nodes.find(node => {
  const children = React.Children.toArray(node.props.children);
  return node.props.onClick && (children.includes(label) || children.filter(value => typeof value === 'string').join('') === label);
});

test('default inline shows at most two supplied key summaries, all local disclosure entries and no invented facts', () => {
  assert.equal(htmlFor(), htmlFor({ view: 'inline', density: 'default' }));
  const html = htmlFor();
  for (const text of ['课堂练习第 2 题', '当前版本：v2', '可见范围：仅本题内容', '关键题干摘要', '关键来源摘要', '展开补充材料']) assert.ok(html.includes(text), text);
  assert.doesNotMatch(html, /第三条摘要不常驻|完整题干插槽|第三条完整插槽|已读取|已引用|已加入上下文|查看完整/);
  assert.doesNotMatch(htmlFor({ inlineLimit: 1 }), /关键来源摘要/);
  assert.match(htmlFor({ sections: [{ ...sections[0], summary: undefined }] }), /展开题干/);
  assert.doesNotMatch(htmlFor({ sections: [{ ...sections[0], summary: undefined }] }), /完整题干插槽/);
});

test('workspace renders full read-only domain slots, math and plain strings without a second content model', () => {
  const html = htmlFor({ view: 'workspace', sections: [...sections, { id: 'math', title: '计算过程', content: h('math', { className: 'prism-math' }, h('mfrac', null, h('mn', null, '1'), h('mn', null, '2'))) }, { id: 'text', title: '文本', content: '<script>not HTML</script>\n  保留换行  ' }] });
  for (const text of ['完整题干插槽', '完整来源插槽', '第三条完整插槽', '对象分区目录', 'text-read-body']) assert.ok(html.includes(text));
  assert.match(html, /<math.*<mfrac>/); assert.match(html, /&lt;script&gt;/); assert.ok(html.includes('\n  保留换行  '));
  assert.doesNotMatch(html, /<script>|关键题干摘要/);
});

test('opaque object, version, section and relation IDs never appear in visible or hidden markup; only explicit displayId appears', () => {
  for (const mode of modes) {
    const extra = { ...mode, versions, onVersionChange() {}, onNavigate() {}, relations: [{ id: 'opaque-related-identifier', relationship: '所属任务', name: '单元练习', openable: true }], onOpenRelation() {} };
    const html = htmlFor(extra);
    for (const value of [object.id, version.id, ...sections.map(section => section.id), 'opaque-related-identifier', versions[1].id]) assert.ok(!html.includes(value), value);
    assert.doesNotMatch(html, /编号：/);
    assert.match(htmlFor({ ...extra, object: { ...object, displayId: '练习第 2 题' } }), /编号：练习第 2 题/);
  }
});

test('restricted sections disclose only the approved label and reason, ignoring injected private slots and summaries', () => {
  function Forbidden() { assert.fail('restricted renderer must not mount'); }
  const restricted = { id: 'private-id', access: 'restricted', disclosure: { label: '家长联系方式', reason: '当前可见范围不含联系方式。' }, title: secret, summary: secret, content: h(Forbidden), sensitive: { reason: secret } };
  for (const mode of modes) {
    const html = htmlFor({ ...mode, sections: [...sections, restricted], onExpand() {} });
    for (const text of ['家长联系方式', '访问受限', '当前可见范围不含联系方式。']) assert.ok(html.includes(text));
    assert.ok(!html.includes(secret)); assert.doesNotMatch(html, /确认查看家长|展开家长/);
  }
});

test('sensitive content and summary stay unmounted until the explicitly labelled local confirmation opens coss', () => {
  let renders = 0;
  function Answer() { renders++; return h('p', null, '获权答案插槽'); }
  const sensitive = { id: 'answer', title: '答案与解析', summary: secret, sensitive: { reason: '避免提前看到答案。' }, content: h(Answer) };
  for (const mode of modes) {
    const extra = { ...mode, sections: [sensitive], onAction() { assert.fail('disclosure is not a business action'); } };
    const before = renders, html = htmlFor(extra);
    assert.equal(renders, before); assert.match(html, /确认查看答案与解析/); assert.match(html, /避免提前看到答案/);
    assert.doesNotMatch(html, /获权答案插槽|NEVER_DISCLOSE_THIS_FIELD/);
    const gate = capture(extra).find(node => node.type.name === 'Collapsible');
    assert.equal(gate.props.defaultOpen, false); assert.equal(gate.props.onOpenChange, undefined);
    // Exercise the real coss open/closed render branches. Click/focus behaviour remains a browser check.
    const opened = render(React.cloneElement(gate, { open: true }));
    assert.match(opened, /获权答案插槽/); assert.match(opened, /收起答案与解析/); assert.ok(!opened.includes(secret));
    assert.doesNotMatch(render(React.cloneElement(gate, { open: false })), /获权答案插槽/);
  }
});

test('ordinary local quick expansion works even without onExpand; expansion does not expose sensitive siblings', () => {
  const extra = { sections: [...sections, { id: 'answer', title: '答案', sensitive: { reason: '需单独确认' }, content: secret }] };
  const gates = capture(extra).filter(node => node.type.name === 'Collapsible');
  const expanded = render(React.cloneElement(gates[2], { open: true }));
  assert.match(expanded, /第三条完整插槽/); assert.doesNotMatch(expanded, /NEVER_DISCLOSE_THIS_FIELD/);
  assert.doesNotMatch(htmlFor(extra), /查看完整|NEVER_DISCLOSE_THIS_FIELD/);
});

test('object/version changes replace the local disclosure boundary; restricted access removes it entirely', () => {
  const boundary = extra => capture(extra).find(node => node.type === 'div' && node.props.ref)?.key;
  assert.notEqual(boundary(), boundary({ object: { ...object, id: 'another-object' } }));
  assert.notEqual(boundary(), boundary({ version: { ...version, id: 'v1' } }));
  assert.notEqual(boundary(), boundary({ version: { ...version, state: 'historical' } }));
  assert.equal(boundary({ access: { state: 'restricted', reason: '授权已撤销' } }), undefined);
});

test('historical versions stay read-only in every view/density and preserve only supplied current-version and diff labels', () => {
  for (const mode of modes) {
    const extra = { ...mode, version: { id: 'v1', label: 'v1', state: 'historical', currentLabel: 'v2', difference: 'v2 补充评分标准。' }, actions, onAction() {} };
    const html = htmlFor(extra);
    for (const text of ['历史版本（只读）', '当时版本：v1', '当前版本：v2', 'v2 补充评分标准。', '下钻证据']) assert.ok(html.includes(text));
    assert.doesNotMatch(html, /加入集合|复核题目/);
    assert.doesNotMatch(htmlFor({ ...extra, version: { ...extra.version, currentLabel: undefined, difference: undefined } }), /当前版本：v2|版本差异/);
  }
  assert.doesNotMatch(htmlFor({ actions, onAction() {}, access: { state: 'available', scope: '本题', readOnlyReason: '当前仅允许阅读。' } }), /加入集合|复核题目/);
  assert.match(htmlFor({ access: { state: 'available', scope: '本题', readOnlyReason: '当前仅允许阅读。' } }), /只读：当前仅允许阅读/);
});

test('version switching only emits a scoped request; selected version, content and read/citation facts do not change', () => {
  const events = [], trigger = {}, extra = { view: 'workspace', version: freeze({ ...version }), versions: freeze(versions), onVersionChange: (...args) => events.push(args) };
  const before = htmlFor(extra);
  button(capture(extra), 'v1').props.onClick({ currentTarget: trigger });
  assert.deepEqual(events, [[{ objectId: object.id, versionId: version.id, targetVersionId: 'old-version-reference' }, trigger]]);
  assert.equal(htmlFor(extra), before); assert.doesNotMatch(before, /历史版本（只读）|已读取|已引用/);
  button(capture(extra), 'v2').props.onClick({ currentTarget: trigger }); assert.equal(events.length, 1);
  const replaced = htmlFor({ ...extra, version: { ...versions[1] }, sections: [{ id: 'old', title: '原题干', content: '当时题干' }] });
  assert.match(replaced, /历史版本（只读）.*当时版本：v1/); assert.match(replaced, /当时题干/); assert.doesNotMatch(replaced, /完整题干插槽/);
});

test('version limitations are associated and guarded; missing callbacks hide unsupported version/actions/expand entries', () => {
  let calls = 0;
  const extra = { view: 'workspace', versions: [{ ...versions[1], disabledReason: '该版本正在核对可见范围。' }], onVersionChange() { calls++; } };
  const choice = button(capture(extra), 'v1');
  assert.equal(choice.props.disabled, true); assert.ok(choice.props['aria-describedby']); choice.props.onClick({ currentTarget: {} });
  assert.equal(calls, 0); assert.match(htmlFor(extra), /该版本正在核对可见范围/);
  for (const mode of modes) assert.doesNotMatch(htmlFor({ ...mode, actions, versions }), /加入集合|复核题目|下钻证据|查看完整|对象版本/);
  assert.doesNotMatch(htmlFor({ view: 'workspace', onExpand() {} }), /查看完整/);
});

test('directory selection is controlled, has stable generated anchors and never opens or confirms a section', () => {
  const events = [], trigger = {}, extra = { view: 'workspace', onNavigate: (...args) => events.push(args) };
  const before = htmlFor(extra), choice = button(capture(extra), '来源');
  assert.ok(before.includes(`id="${choice.props['aria-controls']}"`));
  choice.props.onClick({ currentTarget: trigger });
  assert.deepEqual(events, [[sections[1].id, trigger]]); assert.equal(htmlFor(extra), before);
  const selected = button(capture({ ...extra, activeSection: sections[1].id }), '来源');
  assert.equal(selected.props['aria-current'], 'location');
  assert.match(htmlFor({ ...extra, activeSection: 'missing' }), /当前分区暂不可定位/);
});

test('expand/return/related-object callbacks preserve the same object, version and original trigger', () => {
  const events = [], trigger = {}, extra = { onExpand: value => events.push(['expand', value]), onBack: () => events.push(['back']), relations: [{ id: 'task-ref', relationship: '所属任务', name: '单元练习', openable: true }, { id: 'material-ref', relationship: '来源材料', name: '无打开能力材料' }], onOpenRelation: (...args) => events.push(['relation', ...args]) };
  const before = htmlFor(extra);
  button(capture(extra), '查看完整').props.onClick({ currentTarget: trigger });
  const workspace = capture({ ...extra, view: 'workspace' });
  button(workspace, '返回原位置').props.onClick(); button(workspace, '查看单元练习').props.onClick({ currentTarget: trigger });
  assert.deepEqual(events, [['expand', trigger], ['back'], ['relation', { objectId: object.id, versionId: version.id, relatedObjectId: 'task-ref' }, trigger]]);
  assert.equal(htmlFor(extra), before);
  assert.doesNotMatch(htmlFor({ ...extra, view: 'workspace' }), /查看无打开能力材料/);
  assert.doesNotMatch(htmlFor({ ...extra, view: 'workspace', onOpenRelation: undefined }), /查看单元练习/);
});

test('available actions return typed version-bound intents; disabled and unregistered actions cannot execute', () => {
  const events = [], trigger = {}, extra = { actions: freeze(actions), onAction: (...args) => events.push(args) };
  const before = htmlFor(extra);
  for (const action of actions) button(capture(extra), action.label).props.onClick({ currentTarget: trigger });
  assert.deepEqual(events, actions.map(action => [{ objectId: object.id, versionId: version.id, actionId: action.id, kind: action.kind }, trigger]));
  assert.equal(htmlFor(extra), before); assert.doesNotMatch(before, /已加入|已复核|已读取|已引用/);
  const blocked = { ...actions[0], disabledReason: '目标集合暂不可写。' }, node = button(capture({ ...extra, actions: [blocked] }), blocked.label);
  assert.equal(node.props.disabled, true); assert.ok(node.props['aria-describedby']); node.props.onClick({ currentTarget: trigger }); assert.equal(events.length, 3);
  assert.doesNotMatch(htmlFor({ ...extra, actions: [{ id: 'bad', kind: 'script', label: '任意执行' }] }), /任意执行/);
});

test('whole-object restriction blocks source, diff, slots, relations, actions and expansion, retaining permitted identity and return', () => {
  function Forbidden() { assert.fail('unauthorized payload mounted'); }
  for (const mode of modes) {
    const html = htmlFor({ ...mode, access: { state: 'restricted', reason: '任教授权已撤销。' }, version: { ...version, difference: secret }, source: secret,
      sections: [{ id: 'x', title: secret, content: h(Forbidden) }], details: h(Forbidden), notice: secret,
      relations: [{ id: 'y', name: secret, relationship: secret, openable: true }], onOpenRelation() {}, versions, onVersionChange() {}, actions, onAction() {}, onExpand() {}, onBack() {} });
    assert.match(html, /课堂练习第 2 题/); assert.match(html, /任教授权已撤销/); assert.ok(!html.includes(secret));
    assert.doesNotMatch(html, /查看完整|加入集合|复核题目|下钻证据|对象版本|对象分区目录/);
    if (mode.view === 'workspace') assert.match(html, /返回原位置/);
  }
});

test('compact preserves historical, restricted, sensitive, readonly and version-difference facts beyond key summaries', () => {
  for (const view of ['inline', 'workspace']) {
    const html = htmlFor({ view, density: 'compact', version: { ...version, state: 'historical', difference: '当前版本新增评分说明。' },
      access: { state: 'available', scope: '仅本题', readOnlyReason: '仅允许查看。' },
      sections: [...sections, { id: 'r', access: 'restricted', disclosure: { label: '家长联系方式', reason: '无权访问联系方式。' } }, { id: 's', title: '参考答案', sensitive: { reason: '需教师确认查看。' }, content: secret }],
      notice: '本页固定示例。', details: '折叠的补充说明。' });
    for (const text of ['历史版本（只读）', '无权访问联系方式', '需教师确认查看', '仅允许查看', '当前版本新增评分说明', '本页固定示例']) assert.ok(html.includes(text));
    assert.doesNotMatch(html, /NEVER_DISCLOSE_THIS_FIELD|折叠的补充说明/);
  }
});

test('empty content and unidentified versions are honest and have no executable object actions', () => {
  assert.match(htmlFor({ sections: [], activeSection: null }), /暂未提供对象内容/);
  const html = htmlFor({ object: { ...object, id: '' }, version: { ...version, id: '', label: '' }, source: undefined, actions, onAction() {}, onExpand() {} });
  assert.match(html, /对象或版本尚未确认/); assert.match(html, /版本未确认/); assert.match(html, /来源未确认/);
  assert.doesNotMatch(html, /加入集合|复核题目|下钻证据|查看完整/);
});

test('both labelled examples compose three presentations, readable math and actual domain renderers without implementation jargon', () => {
  for (const purpose of ['question', 'response']) {
    const html = render(h(ObjectViewerExample, { purpose, narrow: true }));
    assert.equal((html.match(/data-agent-object-view=/g) ?? []).length, 3);
    for (const text of ['固定示例', '对话快速查看', '完整对象详情', '紧凑对象查看', objectViewerExamples[purpose].object.name]) assert.ok(html.includes(text));
    assert.doesNotMatch(textOf(html), /意图|宿主|回调|受控/);
    assert.ok(!html.includes(objectViewerExamples[purpose].object.id)); assert.match(html, /<math.*<mfrac>/);
    if (purpose === 'question') { assert.match(html, /data-question-id/); assert.match(html, /确认查看答案与解析/); assert.doesNotMatch(html, /question-solution|分子、分母同时乘以分母的共轭式/); }
    else { assert.match(html, /review-sheet-viewport/); assert.match(html, /家长联系方式/); assert.match(html, /可见范围不含家长联系方式/); }
  }
  assert.match(render(h(AgentObjectViewerDemo)), /320px 窄容器/);
});

test('public types require explicit versions/permissions and prohibit restricted payloads or uncontrolled activeSection', async () => {
  const typeFile = new URL('type-contract.tsx', runtime), path = fileURLToPath(typeFile);
  await writeFile(typeFile, `import type { AgentObjectSection as S, AgentObjectAccess as A, AgentObjectVersion as V, AgentObjectViewerProps as P, AgentObjectAction as Q } from '../../components/prism-next/agent-object-viewer';
const section: S = { id: 'a', title: '答案', sensitive: { reason: '需确认' }, content: '已获权答案' };
const restricted: S = { id: 'r', access: 'restricted', disclosure: { label: '联系方式', reason: '无权访问' } };
// @ts-expect-error restricted content is never accepted
const leak: S = { ...restricted, content: 'private' };
// @ts-expect-error restriction reasons are mandatory
const noReason: S = { id: 'r', access: 'restricted', disclosure: { label: '联系方式' } };
// @ts-expect-error sensitive confirmation requires explanation
const silent: S = { id: 'a', title: '答案', content: 'answer', sensitive: {} };
// @ts-expect-error host must supply visible scope
const noScope: A = { state: 'available' };
// @ts-expect-error current/historical is an explicit fact
const implicit: V = { id: 'v1', label: 'v1' };
// @ts-expect-error arbitrary commands are not registered object actions
const script: Q = { id: 'run', kind: 'script', label: 'run' };
const common = { object: { id: 'x', type: '题目', name: '本题' }, version: { id: 'v1', label: 'v1', state: 'current' as const }, access: { state: 'available' as const, scope: '本题' }, sections: [section], activeSection: null };
const valid: P = common;
// @ts-expect-error navigation does not accept uncontrolled default state
const uncontrolled: P = { ...common, defaultActiveSection: 'a' };
// @ts-expect-error only one or two key summaries
const tooMany: P = { ...common, inlineLimit: 8 };
void [restricted, leak, noReason, silent, noScope, implicit, script, valid, uncontrolled, tooMany];
`);
  try {
    const config = ts.readConfigFile(`${root}tsconfig.json`, ts.sys.readFile);
    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
    const program = ts.createProgram([path], { ...parsed.options, incremental: false, noEmit: true });
    const diagnostics = ts.getPreEmitDiagnostics(program);
    assert.equal(diagnostics.length, 0, diagnostics.map(value => ts.flattenDiagnosticMessageText(value.messageText, '\n')).join('\n'));
  } finally { await rm(typeFile); }
});
