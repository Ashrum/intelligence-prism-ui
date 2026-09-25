import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = new URL('../.sites-runtime/item-reviewer/', import.meta.url);
await mkdir(runtime, { recursive: true });
const file = new URL('test-bundle.mjs', runtime);
const bundle = await build({ stdin: { contents: `export * from './components/prism-next/agent-item-reviewer'; export { itemReviewExamples, itemReviewFixture, AgentItemReviewerDemo, ReviewerExample } from './components/prism-next/demos/agent-item-reviewer';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false });
await writeFile(file, bundle.outputFiles[0].text);
const { AgentItemReviewer, itemReviewExamples, itemReviewFixture, AgentItemReviewerDemo, ReviewerExample } = await import(file);
await rm(file);
const h = React.createElement;
const modes = [{ view: 'inline' }, { view: 'workspace' }, { view: 'inline', density: 'compact' }, { view: 'workspace', density: 'compact' }];
const action = { id: 'confirm', label: '确认无误', impact: '仅确认第 2 题的 r2。' };
const request = { id: 'review-1', label: '首次复核请求' };
const query = { id: 'query', label: '查询原请求', impact: '核对原请求的复核结果。' };
const restart = { id: 'restart', label: '重新复核当前版本', impact: '打开当前版本，保留原草稿。' };
const states = {
  'waiting-human': { state: 'waiting-human', description: '识别存疑，等待核对。', actions: [action] },
  draft: { state: 'draft', description: '已修改题干，等待提交。', actions: [{ ...action, id: 'submit', label: '提交修订' }] },
  waiting: { state: 'waiting', description: '等待原请求回执。', request, query },
  unknown: { state: 'unknown', description: '提交结果尚未确认。', request, query },
  resolved: { state: 'resolved', description: '本题复核记录已确认。', resolution: { reviewer: '教师甲', version: 'r2' } },
  failed: { state: 'failed', description: '依据不足，复核被退回。', actions: [{ ...action, id: 'submit', label: '提交修订' }] },
  expired: { state: 'expired', description: '请核对当前版本。' },
};
const props = { item: { id: 'q2', title: '第 2 题 · 系数核对', version: 'r2' }, review: states['waiting-human'], checkpoints: ['识别存疑：二次项系数'], summary: 'y = x² − 2x + 3', onAction() {} };
const htmlFor = extra => render(h(AgentItemReviewer, { ...props, ...extra }));

// Exercise the component's real event handlers; this is deliberately not a browser claim.
function capture(extra) {
  const nodes = [];
  const owned = new Set(['AgentItemReviewer', 'ReviewAction', 'ReviewHistory']);
  function inspect(node) {
    if (!React.isValidElement(node)) return node;
    if (typeof node.type === 'function' && owned.has(node.type.name)) return h(function Probe() { return inspect(node.type(node.props)); });
    nodes.push(node);
    return React.cloneElement(node, {}, React.Children.map(node.props.children, inspect));
  }
  render(inspect(h(AgentItemReviewer, { ...props, ...extra })));
  return nodes;
}
function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.freeze(value); Object.values(value).forEach(freeze); }
  return value;
}
const actionNodes = extra => capture(extra).filter(node => node.props.onClick && node.props['aria-label']);

test('seven external review states render in both views and densities; default is inline', () => {
  const labels = { 'waiting-human': '待复核', draft: '已编辑未提交', waiting: '复核提交中', unknown: '回执未确认', resolved: '已复核', failed: '已退回 / 失败', expired: '已过期' };
  let calls = 0;
  for (const mode of modes) for (const [state, review] of Object.entries(states)) {
    const html = htmlFor({ ...mode, review, onAction() { calls++; } });
    for (const fact of [labels[state], review.description, props.item.title, props.item.version, ...props.checkpoints]) assert.ok(html.includes(fact), fact);
    assert.match(html, new RegExp(`data-review-state="${state}"`));
    assert.doesNotMatch(html, /意图|宿主|回调|受控|animate-spin|已保存/);
    if (state !== 'resolved') assert.doesNotMatch(html, /已复核/);
  }
  assert.equal(calls, 0);
  assert.equal(htmlFor({}), htmlFor({ view: 'inline', density: 'default' }));
  assert.match(htmlFor({ review: states.draft }), /修改未保存/);
});

test('resolved uses its own reviewer, version and supplied time; missing time stays unconfirmed', () => {
  for (const mode of modes) {
    const html = htmlFor({ ...mode, review: states.resolved });
    for (const fact of ['复核人：教师甲', '复核时间：时间未确认', '复核结果版本：r2']) assert.ok(html.includes(fact));
    const timed = htmlFor({ ...mode, review: { ...states.resolved, resolution: { ...states.resolved.resolution, time: '2026-09-25 09:35' } } });
    assert.match(timed, /2026-09-25 09:35/); assert.doesNotMatch(timed, /时间未确认/);
  }
});

test('confirm and submit emit version-bound intent without generating completion, saving, clearing reason or appending history', () => {
  const events = [];
  const item = freeze({ ...props.item }), history = freeze([{ id: 'old', item: { ...props.item, version: 'r1' }, state: 'waiting-human', description: '当时待复核' }]);
  const value = freeze({ text: '教师手改', score: 1 });
  const extra = { view: 'workspace', item, history, draft: { value, onChange() { assert.fail('confirm changed draft'); }, render: ({ value }) => h('p', null, value.text) }, reason: { value: '  保留理由\n', onChange() { assert.fail('confirm cleared reason'); } }, onAction: intent => events.push(intent) };
  for (const review of [freeze(states['waiting-human']), freeze(states.draft)]) {
    const input = { ...extra, review }, before = htmlFor(input), snapshot = JSON.stringify([item, review, history, value]);
    actionNodes(input)[0].props.onClick();
    assert.equal(htmlFor(input), before); assert.equal(JSON.stringify([item, review, history, value]), snapshot);
    assert.doesNotMatch(htmlFor(input), /data-review-state="resolved"|已复核|已保存/);
  }
  assert.deepEqual(events, [{ kind: 'review', itemId: 'q2', version: 'r2', actionId: 'confirm' }, { kind: 'review', itemId: 'q2', version: 'r2', actionId: 'submit' }]);
});

test('unknown only queries the original request, even with untyped injected submission, resolution and restart', () => {
  for (const mode of modes) {
    const events = [], review = { ...states.unknown, actions: [action], resolution: states.resolved.resolution };
    const extra = { ...mode, review, restart, onExpand() { assert.fail('unknown expanded'); }, onAction: intent => events.push(intent) };
    const before = htmlFor(extra), nodes = actionNodes(extra);
    assert.match(before, /原请求：首次复核请求/); assert.match(before, /不要重复提交/);
    assert.doesNotMatch(before, /确认无误|重新复核当前版本|完整复核|教师甲|已复核/);
    assert.equal(nodes.length, 1); nodes[0].props.onClick();
    assert.deepEqual(events, [{ kind: 'query', itemId: 'q2', version: 'r2', actionId: 'query', requestId: 'review-1' }]);
    assert.equal(htmlFor(extra), before);
  }
});

test('query without original request is disabled and guarded; absent query capability is not invented', () => {
  let calls = 0;
  const extra = { review: { ...states.unknown, request: undefined }, onAction() { calls++; } };
  const node = actionNodes(extra)[0];
  assert.equal(node.props.disabled, true); node.props.onClick(); assert.equal(calls, 0);
  assert.match(htmlFor(extra), /原请求未确认，暂不可查询/);
  for (const mode of modes) {
    const html = htmlFor({ ...mode, review: { ...states.unknown, query: undefined } });
    assert.match(html, /暂未提供原请求查询入口/); assert.doesNotMatch(html, /<button\b/);
  }
});

test('waiting blocks another submission and resolved has no old submit action', () => {
  for (const review of [states.waiting, states.resolved]) for (const mode of modes) {
    const html = htmlFor({ ...mode, review: { ...review, actions: [action] } });
    assert.doesNotMatch(html, /确认无误/);
    if (review.state === 'waiting') assert.match(html, /复核提交中|原请求/);
  }
});

test('host version change expires old confirmation and restart remains an intent, never a fresh confirmation', () => {
  for (const review of [states['waiting-human'], states.draft, states.resolved, states.failed, states.expired]) for (const mode of modes) {
    const events = [], extra = { ...mode, review, versionChange: { currentVersion: 'r3', description: '另一位教师已修订题干。' }, restart, onAction: intent => events.push(intent) };
    const before = htmlFor(extra);
    for (const fact of ['已过期', '复核依据版本：r2', '当前版本：r3', '旧确认不再适用，请重新复核', '另一位教师已修订题干']) assert.ok(before.includes(fact));
    assert.doesNotMatch(before, /确认无误|提交修订|>已复核</);
    if (review.state === 'resolved') assert.match(before, /此前复核记录（不适用于当前版本）/);
    actionNodes(extra)[0].props.onClick();
    assert.deepEqual(events, [{ kind: 'restart', itemId: 'q2', version: 'r2', actionId: 'restart', currentVersion: 'r3' }]);
    assert.equal(htmlFor(extra), before);
  }
  const noVersion = htmlFor({ versionChange: {} });
  assert.match(noVersion, /当前版本：版本未确认/); assert.match(noVersion, /请从当前对象重新发起复核/);
});

test('version conflict combined with unknown or waiting keeps the original query and blocks restart', () => {
  for (const review of [states.unknown, states.waiting]) for (const mode of modes) {
    const extra = { ...mode, review, versionChange: { currentVersion: 'r3' }, restart };
    const html = htmlFor(extra);
    assert.match(html, /已过期/); assert.match(html, /原请求：首次复核请求/); assert.match(html, /查询原请求/);
    assert.doesNotMatch(html, /重新复核当前版本|确认无误/);
    assert.equal(actionNodes(extra).length, 1);
  }
});

test('controlled editor and reason preserve exact values across views and version changes; changes only emit supplied values', () => {
  const value = freeze({ text: '  x²\n教师改稿  ', score: null }), events = [];
  let editor;
  const extra = { draft: { value, onChange: next => events.push(['draft', next]), render: controls => { editor = controls; return h('textarea', { value: controls.value.text, readOnly: controls.readOnly, onChange: event => controls.onChange({ ...controls.value, text: event.target.value }) }); } }, reason: { value: '  原理由\n', onChange: next => events.push(['reason', next]) } };
  for (const mode of modes) htmlFor({ ...extra, ...mode });
  assert.deepEqual(events, []); assert.equal(editor.value, value);
  const nodes = capture({ ...extra, view: 'workspace' });
  const text = '  修改后\n  ', reason = '  新理由\n';
  nodes.find(node => node.type === 'textarea').props.onChange({ target: { value: text } });
  nodes.find(node => node.props.id?.endsWith('-reason')).props.onChange({ target: { value: reason } });
  assert.deepEqual(events, [['draft', { text, score: null }], ['reason', reason]]);
  assert.equal(value.text, '  x²\n教师改稿  ');
  const before = htmlFor({ ...extra, view: 'workspace' });
  assert.ok(before.includes('  原理由\n')); assert.ok(before.includes(value.text));
  htmlFor({ ...extra, view: 'workspace', versionChange: { currentVersion: 'r9' } });
  assert.equal(editor.value, value); assert.equal(editor.readOnly, true);
});

test('blocked states and disabledReason guard editor and reason callbacks even if a custom field tries to emit', () => {
  let calls = 0, editor;
  for (const control of [{ review: states.waiting }, { review: states.unknown }, { review: states.resolved }, { review: states.expired }, { versionChange: {} }, { disabledReason: '当前只读。' }]) {
    const extra = { view: 'workspace', ...control, draft: { value: { text: '原稿' }, onChange() { calls++; }, render: input => { editor = input; return h('p', null, input.value.text); } }, reason: { value: '保留', onChange() { calls++; } } };
    const nodes = capture(extra), field = nodes.find(node => node.props.id?.endsWith('-reason'));
    assert.equal(editor.readOnly, true); assert.equal(field.props.readOnly, true);
    editor.onChange({ text: '越过只读' }); field.props.onChange({ target: { value: '越过只读' } });
  }
  assert.equal(calls, 0);
});

test('action unavailability is visible, accessibly associated and enforced in event guards', () => {
  let calls = 0;
  for (const change of [{ disabledReason: '当前只读。' }, { review: { ...states['waiting-human'], actions: [{ ...action, disabledReason: '缺少核对依据。' }] } }, { onAction: undefined }, { item: { ...props.item, version: '' } }, { item: { ...props.item, id: '' } }]) {
    const extra = { onAction() { calls++; }, ...change }, node = actionNodes(extra)[0], html = htmlFor(extra);
    assert.equal(node.props.disabled, true); node.props.onClick();
    const tag = html.match(/<button\b[^>]*aria-label="确认无误：第 2 题 · 系数核对"[^>]*>/)[0];
    for (const id of tag.match(/aria-describedby="([^"]+)"/)[1].split(' ')) assert.ok(html.includes(`id="${id}"`));
    assert.ok(html.includes(action.impact));
  }
  assert.equal(calls, 0);
});

test('history keeps its own identity, version, reviewer, reason and time without filling from current facts', () => {
  const history = freeze(Object.keys(states).map((state, index) => ({ id: `record-${index}`, item: { id: 'old-id', title: '当时题名', version: 'r1' }, state, description: `当时记录 ${state}`, ...(index % 2 ? {} : { reviewer: '教师乙', time: '2026-09-24 15:00', resultVersion: 'r1', reason: '保留当时理由', request }) })));
  const snapshot = JSON.stringify(history);
  function section(extra) {
    const html = htmlFor({ view: 'workspace', history, ...extra });
    return html.slice(html.indexOf('<section aria-label="复核记录"'));
  }
  for (const density of ['default', 'compact']) {
    const old = section({ density }), next = section({ density, item: { id: 'new-id', title: '当前题名', version: 'r9' }, review: states.resolved, versionChange: { currentVersion: 'r10' } });
    assert.equal(old, next);
    for (const fact of ['当时对象：old-id', '当时题名', '当时依据版本：r1', '教师乙', '复核人未确认', '时间未确认', '版本未确认', '保留当时理由', '当时请求']) assert.ok(next.includes(fact));
    assert.doesNotMatch(next, /当前题名|教师甲|r9|r10|<button\b/);
  }
  assert.equal(JSON.stringify(history), snapshot);
});

test('expansion is optional and passes its trigger; workspace return changes no facts, even for unknown', () => {
  const events = [], trigger = { id: 'original-button' }, onExpand = button => events.push(['expand', button]), onBack = () => events.push(['back']);
  assert.doesNotMatch(htmlFor({}), /完整复核/);
  assert.doesNotMatch(htmlFor({ view: 'workspace', onExpand }), /完整复核/);
  const nodes = capture({ onExpand, onAction: intent => events.push(intent) });
  nodes.find(node => node.props.onClick && !node.props['aria-label']).props.onClick({ currentTarget: trigger });
  capture({ view: 'workspace', review: states.unknown, onBack }).find(node => node.props.onClick && !node.props['aria-label']).props.onClick();
  assert.deepEqual(events, [['expand', trigger], ['back']]);
});

test('compact retains unknown, expiry, unsaved and disabled facts outside collapsed details with one notice', () => {
  for (const view of ['inline', 'workspace']) for (const review of [states.unknown, states.expired, states.draft]) {
    const html = htmlFor({ view, density: 'compact', review, notice: '唯一边界提示', disabledReason: '仅可查看当前记录。', details: h('p', null, '补充说明正文') });
    assert.match(html, /aria-expanded="false"/); assert.doesNotMatch(html, /补充说明正文/);
    assert.ok(html.includes(review.description)); assert.ok(html.includes(props.item.version)); assert.match(html, /仅可查看当前记录/);
    assert.equal((html.match(/唯一边界提示/g) ?? []).length, 1);
    if (review.state === 'unknown') assert.match(html, /回执未确认/);
    if (review.state === 'expired') assert.match(html, /请重新复核/);
    if (review.state === 'draft') assert.match(html, /修改未保存/);
  }
});

test('workspace renders supplied evidence, comparison and generic domain editor; no fields imply a fabricated capability', () => {
  const slots = { evidence: h('p', null, '原稿 v1 区域'), comparison: h('p', null, 'r2 原值与草稿对照'), draft: { value: { conclusion: '单条诊断' }, onChange() {}, render: ({ value }) => h('p', null, value.conclusion) } };
  const full = htmlFor({ view: 'workspace', ...slots });
  for (const fact of ['原稿 v1 区域', 'r2 原值与草稿对照', '单条诊断']) assert.ok(full.includes(fact));
  assert.doesNotMatch(full, /已读取|已引用|已保存|初评|评分点/);
  assert.doesNotMatch(htmlFor(slots), /原稿 v1 区域|r2 原值与草稿对照|单条诊断/);
  const empty = htmlFor({ view: 'workspace', checkpoints: [], review: { ...states['waiting-human'], actions: undefined } });
  for (const text of ['暂未提供复核要点', '暂未提供可核对的证据', '暂未提供编辑内容', '暂未提供修改对比', '暂未提供复核理由', '暂无复核记录']) assert.ok(empty.includes(text));
  assert.doesNotMatch(empty, /<button\b/);
});

test('two distinct labelled fixtures render three presentations, controlled verification fields and optional scoring', () => {
  for (const [key, example] of Object.entries(itemReviewExamples)) {
    const html = render(h(ReviewerExample, { example, grading: key === 'grading', narrow: true }));
    assert.equal((html.match(/data-agent-item-review-view=/g) ?? []).length, 3);
    for (const fact of [example.item.title, '对话摘要', '完整复核', '紧凑列表', '固定示例']) assert.ok(html.includes(fact));
    assert.doesNotMatch(html, /意图|宿主|回调|受控/);
    if (key === 'scan') { assert.match(html, /<math.*<mfrac>/); assert.match(html, /核验依据/); assert.doesNotMatch(html, /本评分点得分/); }
    else assert.match(html, /本评分点得分 · 上限 2 分/);
    for (const state of Object.keys(states)) assert.equal(itemReviewFixture(state, example.item.version).state, state);
  }
  assert.match(render(h(AgentItemReviewerDemo)), /320px 窄容器/);
});

test('public contract rejects submission on unknown, waiting, resolved or expired and keeps generic drafts controlled', async () => {
  const typeFile = new URL('type-contract.tsx', runtime), path = fileURLToPath(typeFile);
  await writeFile(typeFile, `import type { AgentItemReview as R, AgentItemReviewIntent as I, AgentItemReviewDraft as D } from '../../components/prism-next/agent-item-reviewer';
const action = { id: 'confirm', label: '确认无误', impact: '本题 r2' };
const request = { id: 'old', label: '原请求' };
const valid: R = { state: 'unknown', description: '未确认', request, query: action };
// @ts-expect-error unknown cannot submit again
const unknown: R = { state: 'unknown', description: '', request, actions: [action] };
// @ts-expect-error waiting cannot submit again
const waiting: R = { state: 'waiting', description: '', request, actions: [action] };
// @ts-expect-error resolved does not retain confirmation actions
const resolved: R = { state: 'resolved', description: '', resolution: { reviewer: '甲', version: 'r2' }, actions: [action] };
// @ts-expect-error expired does not admit an old-version action
const expired: R = { state: 'expired', description: '', actions: [action] };
// @ts-expect-error unknown requires original request
const noRequest: R = { state: 'unknown', description: '' };
// @ts-expect-error resolved requires reviewer and version facts
const noReceipt: R = { state: 'resolved', description: '' };
// @ts-expect-error query must retain original request identity
const badIntent: I = { kind: 'query', itemId: 'q2', version: 'r2', actionId: 'query' };
const draft: D<{ text: string }> = { value: { text: '原稿' }, onChange(value) { value.text.toUpperCase(); }, render({ value, onChange, readOnly }) { if (!readOnly) onChange(value); return null; } };
// @ts-expect-error a draft cannot omit its controlled value
const noValue: D<string> = { onChange() {}, render() { return null; } };
// @ts-expect-error a draft cannot omit its change receiver
const noChange: D<string> = { value: '', render() { return null; } };
void [valid, unknown, waiting, resolved, expired, noRequest, noReceipt, badIntent, draft, noValue, noChange];
`);
  try {
    const config = ts.readConfigFile(`${root}tsconfig.json`, ts.sys.readFile);
    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
    const program = ts.createProgram([path], { ...parsed.options, incremental: false, noEmit: true });
    const diagnostics = ts.getPreEmitDiagnostics(program);
    assert.equal(diagnostics.length, 0, diagnostics.map(value => ts.flattenDiagnosticMessageText(value.messageText, '\n')).join('\n'));
  } finally { await rm(typeFile); }
});
