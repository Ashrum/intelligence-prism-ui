import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = new URL('../.sites-runtime/evidence-drilldown/', import.meta.url);
await mkdir(runtime, { recursive: true });
const file = new URL('test-bundle.mjs', runtime);
const bundle = await build({ stdin: { contents: `export * from './components/prism-next/agent-evidence-drilldown'; export { evidenceExamples, AgentEvidenceDrilldownDemo } from './components/prism-next/demos/agent-evidence-drilldown';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false });
await writeFile(file, bundle.outputFiles[0].text);
const { AgentEvidenceDrilldown, evidenceExamples, AgentEvidenceDrilldownDemo } = await import(file);
await rm(file);
const h = React.createElement;
const conclusion = { id: 'conclusion', statement: '结论仍待核对', version: '诊断 v2' };
const evidence = { kind: 'evidence', id: 'evidence', title: '原作答片段', type: '作答', source: { objectId: 'source', label: '学生甲的作答', version: '作答 v1', location: '第 4 题 · 第 2 段' }, facts: [{ state: 'unknown' }], relation: 'pending', preview: h('p', null, '原始预览内容'), openable: true };
const object = { kind: 'object', id: 'student', title: '学生甲', type: '学生', version: '档案 v4', openable: true, children: [evidence] };
const props = { conclusion, nodes: [object] };
const modes = [{ view: 'inline' }, { view: 'workspace', path: ['student', 'evidence'] }, { view: 'inline', density: 'compact' }, { view: 'workspace', density: 'compact', path: ['student', 'evidence'] }];
const htmlFor = extra => render(h(AgentEvidenceDrilldown, { ...props, ...extra }));
const withEvidence = extra => [{ ...object, children: [{ ...evidence, ...extra }] }];
function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.freeze(value); Object.values(value).forEach(freeze); }
  return value;
}
// Exercise actual component-created handlers. These assertions are not browser clicks.
function capture(extra) {
  const nodes = [], owned = new Set(['AgentEvidenceDrilldown', 'EvidenceRows', 'EvidenceRow', 'EvidenceContent', 'EvidenceFacts', 'AgentContextList']);
  function inspect(node) {
    if (!React.isValidElement(node)) return node;
    if (typeof node.type === 'function' && owned.has(node.type.name)) return h(function Probe() { return inspect(node.type(node.props)); });
    nodes.push(node);
    return React.cloneElement(node, {}, React.Children.map(node.props.children, inspect));
  }
  render(inspect(h(AgentEvidenceDrilldown, { ...props, ...extra })));
  return nodes;
}
const button = (nodes, label) => nodes.find(node => node.props.onClick && (node.props['aria-label'] === label || node.props.children === label));
const factStates = html => [...html.matchAll(/data-evidence-fact="([^"]+)"/g)].map(match => match[1]);

test('all nine evidence facts render independently in both views and densities', () => {
  const labels = { read: '已读取', cited: '已引用', 'not-read': '未读取', 'not-cited': '未引用', 'retrieval-only': '仅检索命中', 'preview-only': '仅预览', incomplete: '记录不完整', unavailable: '记录暂不可用', unknown: '状态未确认' };
  for (const mode of modes) for (const [state, label] of Object.entries(labels)) {
    const fact = { state, description: '仅限本段', ...(state === 'cited' ? { version: '成果 v6', location: '结论第 2 条' } : {}) };
    const html = htmlFor({ ...mode, nodes: withEvidence({ facts: [fact] }) });
    assert.deepEqual(factStates(html), [state]);
    for (const text of [label, '仅限本段', '学生甲的作答', '作答 v1', '第 4 题 · 第 2 段', '待核']) assert.ok(html.includes(text));
    for (const [other, text] of Object.entries(labels)) if (other !== state) assert.ok(!html.includes(text), `${state} must not imply ${other}`);
    assert.doesNotMatch(html, /已加入上下文|已参考|结论正确|证据充分|已完成/);
  }
  assert.equal(htmlFor({}), htmlFor({ view: 'inline', density: 'default', path: [] }));
});

test('read, citation and absence may coexist only as separate supplied facts with their own locations', () => {
  const facts = [{ state: 'not-read', description: '本机记录覆盖完整且无读取事件。' }, { state: 'cited', description: '成果存在引用记录。', version: '成果 v9', location: '段落 8' }];
  const html = htmlFor({ nodes: withEvidence({ facts }) });
  assert.deepEqual(factStates(html), ['not-read', 'cited']);
  assert.match(html, /引用位置：成果 v9 · 段落 8/); assert.match(html, /来源版本：作答 v1/);
  assert.doesNotMatch(html, /已读取|结论正确|已参考/);
});

test('count and coverage appear only when supplied, including zero and independently supplied incomplete coverage', () => {
  assert.doesNotMatch(htmlFor({ nodes: [] }), /证据数量|记录覆盖完整|记录不完整|未读取|未引用/);
  const labels = { complete: '记录覆盖完整', incomplete: '记录不完整', unavailable: '记录暂不可用', unknown: '覆盖状态未确认' };
  for (const [state, label] of Object.entries(labels)) {
    const html = htmlFor({ conclusion: { ...conclusion, evidenceCount: 0, coverage: { state, description: '本段记录覆盖说明' } }, nodes: [] });
    assert.match(html, /证据数量：0/); assert.ok(html.includes(label)); assert.match(html, /本段记录覆盖说明/);
    assert.doesNotMatch(html, /已读取|未读取|已引用|未引用/);
  }
});

test('inline shows the first two supplied evidence entries; without onExpand all stay reachable with no fake entry', () => {
  const nodes = withEvidence({ facts: [{ state: 'read', description: '本机片段' }] });
  nodes[0].children = ['一', '二', '三'].map(id => ({ ...nodes[0].children[0], id, title: `证据${id}` }));
  const short = htmlFor({ nodes, onExpand() {} });
  assert.match(short, /证据一/); assert.match(short, /证据二/); assert.doesNotMatch(short, /证据三|原始预览内容|证据数量/); assert.match(short, /查看证据链/);
  for (const density of ['default', 'compact']) {
    const full = htmlFor({ nodes, density });
    assert.match(full, /证据三/); assert.doesNotMatch(full, /查看证据链/);
    assert.doesNotMatch(htmlFor({ nodes, view: 'workspace', onExpand() {}, density }), /查看证据链/);
  }
});

test('controlled multi-level navigation emits exact paths and triggers, never changes path before host updates', () => {
  const nodes = freeze([{ ...object, children: [{ kind: 'object', id: 'question', title: '第 4 题', type: '题目', children: [evidence] }] }]);
  const path = freeze(['student']), events = [], trigger = { id: 'navigation' };
  const extra = { nodes, path, view: 'workspace', onNavigate: (...event) => events.push(event) };
  const before = htmlFor(extra), initial = capture(extra);
  button(initial, '查看对象证据：第 4 题').props.onClick({ currentTarget: trigger });
  assert.deepEqual(events, [[['student', 'question'], trigger]]);
  assert.deepEqual(path, ['student']); assert.equal(htmlFor(extra), before);
  const next = { ...extra, path: ['student', 'question'] };
  button(capture(next), '查看证据详情：原作答片段').props.onClick({ currentTarget: trigger });
  const leaf = { ...extra, path: ['student', 'question', 'evidence'] }, leafNodes = capture(leaf);
  button(leafNodes, '返回：学生甲').props.onClick({ currentTarget: trigger });
  const previous = leafNodes.find(node => node.props.onClick && React.Children.toArray(node.props.children).includes('返回上一层'));
  previous.props.onClick({ currentTarget: trigger });
  assert.deepEqual(events.slice(1), [[['student', 'question', 'evidence'], trigger], [['student'], trigger], [['student', 'question'], trigger]]);
  assert.match(htmlFor(leaf), /原始预览内容/); assert.match(htmlFor(leaf), /aria-current="page"/);
  assert.doesNotMatch(htmlFor(extra), /原始预览内容/);
});

test('opening object/evidence and expanding/returning emit only intentions and preserve frozen facts', () => {
  const events = [], trigger = { id: 'origin' };
  const nodes = freeze(withEvidence({ facts: [{ state: 'cited', description: '已记录范围', version: '成果 v1', location: '段落 2' }] }));
  const extra = { nodes, onOpen: (...value) => events.push(value), onExpand: value => events.push(['expand', value]), onBack: () => events.push(['back']) };
  const before = htmlFor(extra);
  button(capture(extra), '打开证据：原作答片段').props.onClick({ currentTarget: trigger });
  button(capture({ ...extra, view: 'workspace' }), '打开对象：学生甲').props.onClick({ currentTarget: trigger });
  capture(extra).find(node => node.props.onClick && React.Children.toArray(node.props.children).includes('查看证据链')).props.onClick({ currentTarget: trigger });
  button(capture({ ...extra, view: 'workspace' }), '返回原位置').props.onClick();
  assert.deepEqual(events, [[{ kind: 'evidence', conclusionId: 'conclusion', nodeId: 'evidence', path: ['student', 'evidence'] }, trigger], [{ kind: 'object', conclusionId: 'conclusion', nodeId: 'student', path: ['student'] }, trigger], ['expand', trigger], ['back']]);
  assert.equal(htmlFor(extra), before); assert.deepEqual(factStates(before), ['cited']);
});

test('missing capabilities have no opening, navigation, return or expansion buttons', () => {
  for (const mode of modes) assert.doesNotMatch(htmlFor(mode), /<button\b/);
  const unavailable = htmlFor({ nodes: withEvidence({ openable: false }), onOpen() {} });
  assert.doesNotMatch(unavailable, /打开证据/);
  const readOnly = htmlFor({ view: 'workspace', path: ['student'], onOpen() {}, nodes: [{ ...object, openable: false, children: [{ ...evidence, openable: false }] }] });
  assert.doesNotMatch(readOnly, /<button\b/);
});

test('restricted objects and evidence expose only disclosure and reason, ignoring injected private descendants and previews', () => {
  const secret = { ...object, access: 'restricted', title: 'PRIVATE-NAME', version: 'PRIVATE-VERSION', source: { ...evidence.source, label: 'PRIVATE-SOURCE' }, facts: [{ state: 'read', description: 'PRIVATE-FACT' }], preview: h('p', null, 'PRIVATE-PREVIEW'), children: [{ ...evidence, title: 'PRIVATE-CHILD' }], disclosure: { label: '受限材料', reason: '当前没有明细查看权限。' } };
  for (const kind of ['object', 'evidence']) for (const mode of [{}, { density: 'compact' }, { view: 'workspace' }, { view: 'workspace', path: ['student'] }]) {
    const html = htmlFor({ ...mode, nodes: [{ ...secret, kind }], onOpen() { assert.fail('must not open'); }, onNavigate() {}, onExpand() {} });
    assert.match(html, /受限材料/); assert.match(html, /当前没有明细查看权限/);
    assert.doesNotMatch(html, /PRIVATE-|已读取|打开对象|打开证据|查看对象证据|查看证据详情/);
  }
  const descendants = htmlFor({ nodes: [secret], view: 'workspace', path: ['student', 'evidence'] });
  assert.match(descendants, /当前位置未提供/); assert.doesNotMatch(descendants, /PRIVATE-|原始预览内容/);
});

test('historical evidence keeps its own then-version and location after the current object/conclusion updates', () => {
  const historical = freeze({ ...evidence, source: { ...evidence.source, version: '历史作答 v1', snapshot: '2026-09-18 当时记录' }, facts: [{ state: 'preview-only' }] });
  for (const mode of modes) {
    const original = htmlFor({ ...mode, nodes: [{ ...object, children: [historical] }] });
    const updated = htmlFor({ ...mode, conclusion: { ...conclusion, version: '当前诊断 v99' }, nodes: [{ ...object, version: '当前档案 v99', children: [historical] }] });
    for (const html of [original, updated]) {
      assert.match(html, /历史证据 · 2026-09-18 当时记录/); assert.match(html, /当时版本：历史作答 v1/); assert.match(html, /第 4 题 · 第 2 段/);
      assert.doesNotMatch(html, /当时版本：当前/);
    }
  }
  assert.match(htmlFor({ conclusion: { ...conclusion, snapshot: '昨日结论' } }), /历史结论 · 昨日结论/);
});

test('compact preserves incomplete, unavailable, unknown and restricted facts beyond the two-entry summary and below workspace levels', () => {
  const nodes = [{ ...object, children: [1, 2].map(id => ({ ...evidence, id: String(id), facts: [{ state: 'preview-only' }] })).concat(['incomplete', 'unavailable', 'unknown'].map(state => ({ ...evidence, id: state, title: `${state}条目`, facts: [{ state, description: `${state}原因` }] }))) }];
  for (const view of ['inline', 'workspace']) {
    const html = htmlFor({ nodes, view, density: 'compact', onExpand() {}, onNavigate() {}, details: h('p', null, '隐藏补充解释') });
    for (const state of ['incomplete', 'unavailable', 'unknown']) { assert.ok(factStates(html).includes(state)); assert.ok(html.includes(`${state}原因`)); }
    assert.match(html, /记录不完整/); assert.match(html, /记录暂不可用/); assert.doesNotMatch(html, /隐藏补充解释/);
  }
});

test('invalid controlled paths never fall back to another object or preview and can return to the nearest supplied ancestor', () => {
  const events = [], trigger = { id: 'back' };
  for (const path of [['student', 'missing'], ['missing'], ['student', 'evidence', 'extra']]) {
    const extra = { view: 'workspace', path, onNavigate: next => events.push(next) };
    const html = htmlFor(extra);
    assert.match(html, /位置未找到/); assert.doesNotMatch(html, /原始预览内容|访问受限|记录暂不可用/);
    capture(extra).find(node => node.props.onClick && React.Children.toArray(node.props.children).includes('返回上一层')).props.onClick({ currentTarget: trigger });
  }
  assert.deepEqual(events, [['student'], [], ['student', 'evidence']]);
});

test('preview availability is independent of usage facts; unavailable preview is not mounted and cannot imply unread', () => {
  const base = { view: 'workspace', path: ['student', 'evidence'] };
  const html = htmlFor({ ...base, nodes: withEvidence({ facts: [{ state: 'read', description: '历史读取事实' }], previewUnavailableReason: '此版本预览暂不可用。' }) });
  assert.match(html, /已读取/); assert.match(html, /此版本预览暂不可用/); assert.doesNotMatch(html, /原始预览内容|未读取/);
  const independent = htmlFor({ ...base, nodes: withEvidence({ facts: [{ state: 'unavailable' }] }) });
  assert.match(independent, /记录暂不可用/); assert.match(independent, /原始预览内容/);
  assert.match(htmlFor({ ...base, nodes: withEvidence({ preview: undefined, facts: [] }) }), /暂无证据事实记录/);
  assert.match(htmlFor({ ...base, nodes: withEvidence({ preview: undefined }) }), /暂未提供证据预览/);
});

test('relationships are supplied, citation never changes a counterexample to support or a pending check to correct', () => {
  for (const [relation, label] of Object.entries({ supports: '支持', counterexample: '反例', pending: '待核' })) {
    const html = htmlFor({ nodes: withEvidence({ relation, facts: [{ state: 'cited', description: '引用记录', version: '报告 v1', location: '第 2 条' }] }) });
    assert.ok(html.includes(label)); assert.match(html, /已引用/); assert.doesNotMatch(html, /结论正确|证据充分|核对通过/);
  }
});

test('one standing notice and collapsed details preserve all necessary evidence facts', () => {
  for (const mode of modes) {
    const html = htmlFor({ ...mode, notice: '固定示例边界', details: h('p', null, '补充解释正文'), nodes: withEvidence({ facts: [{ state: 'incomplete', description: '缺少后半段记录' }] }) });
    assert.equal((html.match(/固定示例边界/g) ?? []).length, 1);
    assert.match(html, /aria-expanded="false"/); assert.doesNotMatch(html, /补充解释正文|意图|宿主|回调|受控/);
    assert.match(html, /记录不完整/); assert.match(html, /缺少后半段记录/);
  }
});

test('two labelled purposes supply source-region and student/question/answer chains with three demo presentations', () => {
  assert.equal(evidenceExamples.scan.conclusion.statement, '第 2 题识别可能有误');
  assert.equal(evidenceExamples.diagnosis.conclusion.statement, '二次函数配方掌握不足');
  for (const example of Object.values(evidenceExamples)) {
    assert.match(example.conclusion.version, /示例/);
    const html = htmlFor({ conclusion: example.conclusion, nodes: example.nodes, path: example.firstEvidence, view: 'workspace' });
    assert.match(html, /<math/); assert.doesNotMatch(html, /意图|宿主|回调|受控/);
  }
  const scan = htmlFor({ ...evidenceExamples.scan, path: evidenceExamples.scan.firstEvidence, view: 'workspace' });
  assert.match(scan, /原稿第 1 页区域/); assert.match(scan, /data-region="q2"/); assert.match(scan, /<mfrac>/);
  const demo = render(h(AgentEvidenceDrilldownDemo));
  for (const text of ['固定示例', '对话摘要', '完整证据链', '紧凑列表', '320px 窄容器']) assert.ok(demo.includes(text));
  assert.equal((demo.match(/data-agent-evidence-view=/g) ?? []).length, 3);
});

test('public types require scoped positive facts and citation version/location, and exclude private fields from restricted nodes', async () => {
  const typeFile = new URL('type-contract.tsx', runtime), path = fileURLToPath(typeFile);
  await writeFile(typeFile, `import type { AgentEvidenceFact as F, AgentEvidenceRestrictedNode as R, AgentEvidencePath as P, AgentEvidenceOpenIntent as I } from '../../components/prism-next/agent-evidence-drilldown';
const valid: F = { state: 'cited', description: '片段引用', version: '成果 v1', location: '第 2 条' };
// @ts-expect-error a read needs scope
const read: F = { state: 'read' };
// @ts-expect-error a citation needs its result version and location
const cited: F = { state: 'cited', description: '引用' };
// @ts-expect-error restricted nodes must not carry private source data
const restricted: R = { id: 'x', kind: 'evidence', access: 'restricted', disclosure: { label: '受限', reason: '权限' }, source: { objectId: 'private' } };
const p: P = ['object', 'evidence'];
// @ts-expect-error paths remain host controlled and readonly
p.push('another');
// @ts-expect-error open intent needs its originating conclusion and path
const intent: I = { kind: 'evidence', nodeId: 'x' };
void [valid, read, cited, restricted, p, intent];
`);
  try {
    const config = ts.readConfigFile(`${root}tsconfig.json`, ts.sys.readFile);
    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
    const program = ts.createProgram([path], { ...parsed.options, incremental: false, noEmit: true });
    const diagnostics = ts.getPreEmitDiagnostics(program);
    assert.equal(diagnostics.length, 0, diagnostics.map(value => ts.flattenDiagnosticMessageText(value.messageText, '\n')).join('\n'));
  } finally { await rm(typeFile); }
});
