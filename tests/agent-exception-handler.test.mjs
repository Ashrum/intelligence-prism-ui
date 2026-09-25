import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = new URL('../.sites-runtime/exception-handler/', import.meta.url);
await mkdir(runtime, { recursive: true });
const file = new URL('test-bundle.mjs', runtime);
const bundle = await build({ stdin: { contents: `export * from './components/prism-next/agent-exception-handler'; export { exceptionExamples, AgentExceptionHandlerDemo } from './components/prism-next/demos/agent-exception-handler';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false });
await writeFile(file, bundle.outputFiles[0].text);
const { AgentExceptionHandler, exceptionExamples, AgentExceptionHandlerDemo } = await import(file);
await rm(file);
const h = React.createElement;
const modes = [{ view: 'inline' }, { view: 'workspace' }, { view: 'inline', density: 'compact' }, { view: 'workspace', density: 'compact' }];
const handle = { id: 'replace', label: '替换本页', impact: '只影响第 3 页。' };
const query = { id: 'query', label: '查询原请求', impact: '核对原请求，不创建新请求。' };
const request = { id: 'request-1', label: '首次处置请求' };
const states = {
  'waiting-human': { state: 'waiting-human', description: '等待教师选择。', actions: [handle] },
  waiting: { state: 'waiting', description: '已提交，等待处理。', request, query },
  unknown: { state: 'unknown', description: '原请求保留。', request, query },
  resolved: { state: 'resolved', description: '已取得处置记录。', resolution: { method: '替换清晰页', time: '2026-09-25 09:20' }, actions: [{ id: 'resume', label: '继续校对', impact: '打开原校对稿。' }] },
  failed: { state: 'failed', description: '替换失败，原文保留。', actions: [handle] },
  ignored: { state: 'ignored', description: '按教师记录忽略。', resolution: { method: '忽略本项' } },
  skipped: { state: 'skipped', description: '跳过本区域，保留待核对标记。', resolution: { method: '跳过本区域' } },
};
const baseItem = { id: 'page-3', title: '第 3 页模糊', kind: 'low-confidence', scope: '第 3 页右下角。', retained: '第 1、2 页与教师批注。', basis: '页面质量记录 v1。', disposition: states['waiting-human'] };
const props = { title: '材料异常', items: [baseItem], onAction() {} };
const htmlFor = extra => render(h(AgentExceptionHandler, { ...props, ...extra }));
const itemWith = (state, extra = {}) => ({ ...baseItem, disposition: states[state], ...extra });
const visibleIds = html => [...html.matchAll(/data-exception-id="([^"]+)"/g)].map(match => match[1]);

// Inspect real component-created handlers during SSR. This is not a browser click test.
function capture(extra) {
  const nodes = [];
  const owned = new Set(['AgentExceptionHandler', 'ExceptionItem', 'ExceptionAction']);
  function inspect(node) {
    if (!React.isValidElement(node)) return node;
    if (typeof node.type === 'function' && owned.has(node.type.name)) {
      return h(function Probe() { return inspect(node.type(node.props)); });
    }
    nodes.push(node);
    return React.cloneElement(node, {}, React.Children.map(node.props.children, inspect));
  }
  render(inspect(h(AgentExceptionHandler, { ...props, ...extra })));
  return nodes;
}
function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.freeze(value); Object.values(value).forEach(deepFreeze); }
  return value;
}

test('all seven dispositions render external facts in both views and densities without inferring completion', () => {
  const labels = { 'waiting-human': '待人工处理', waiting: '处置提交中。', unknown: '处置回执未确认。', resolved: '已处置', failed: '处置失败。', ignored: '已忽略', skipped: '已跳过' };
  let calls = 0;
  for (const mode of modes) for (const [state, disposition] of Object.entries(states)) {
    const html = htmlFor({ ...mode, items: [itemWith(state)], onAction() { calls++; } });
    for (const text of [labels[state], disposition.description, baseItem.scope, baseItem.retained]) assert.ok(html.includes(text));
    assert.doesNotMatch(html, /animate-spin|aria-current|意图|宿主|回调|受控/);
    if (state !== 'resolved') assert.doesNotMatch(html, /已处置|已保存|已完成/);
    if (['ignored', 'skipped'].includes(state)) assert.match(html, /处置时间：时间未确认/);
  }
  assert.equal(calls, 0);
  assert.match(htmlFor({ items: [itemWith('resolved')] }), /替换清晰页.*2026-09-25 09:20/);
  assert.equal(htmlFor({}), htmlFor({ view: 'inline', density: 'default' }));
});

test('unknown accepts only the original-request query, including untyped injected actions and expansion', () => {
  for (const mode of modes) {
    const disposition = { ...states.unknown, actions: [handle], next: handle, resolution: { method: '伪造成功' } };
    const html = htmlFor({ ...mode, items: [{ ...baseItem, disposition }], onExpand() {} });
    assert.match(html, /查询原请求/); assert.match(html, /首次处置请求/); assert.match(html, /data-request-id="request-1"/);
    assert.doesNotMatch(html, /替换本页|伪造成功|查看全部|继续校对/);
    assert.equal((html.match(/<button\b/g) ?? []).length, 1);
  }
});

test('unknown without query has no fabricated action; an untyped query without request cannot fire', () => {
  for (const mode of modes) {
    const html = htmlFor({ ...mode, items: [{ ...baseItem, disposition: { ...states.unknown, query: undefined } }] });
    assert.doesNotMatch(html, /<button\b/); assert.match(html, /暂未提供原请求查询入口/);
  }
  let calls = 0;
  const extra = { items: [{ ...baseItem, disposition: { ...states.unknown, request: undefined } }], onAction() { calls++; } };
  assert.match(htmlFor(extra), /原请求未确认，暂不可查询/);
  const button = capture(extra).find(node => node.props['aria-label'] === '查询原请求：第 3 页模糊');
  assert.equal(button.props.disabled, true); button.props.onClick(); assert.equal(calls, 0);
});

test('waiting preserves submitted facts and suppresses a second disposition even from untyped input', () => {
  for (const mode of modes) {
    const html = htmlFor({ ...mode, items: [{ ...baseItem, disposition: { ...states.waiting, actions: [handle] } }] });
    assert.match(html, /处置提交中/); assert.match(html, /等待处理/); assert.match(html, /查询原请求/);
    assert.doesNotMatch(html, /替换本页|已处置/);
  }
});

test('inline keeps the limit, host critical items, failures and pending submissions in original order', () => {
  const items = [itemWith('waiting-human', { id: 'first' }), itemWith('resolved', { id: 'hidden' }), itemWith('waiting-human', { id: 'critical', critical: true }), itemWith('failed', { id: 'failed' }), itemWith('waiting', { id: 'submitted' })];
  const html = htmlFor({ items, inlineLimit: 1, onExpand() {} });
  assert.deepEqual(visibleIds(html), ['first', 'critical', 'failed', 'submitted']);
  assert.match(html, /共 5 项异常/); assert.match(html, /当前显示 4 项/); assert.match(html, /另有 1 项异常/); assert.match(html, /查看全部 5 项异常/);
  for (const [inlineLimit, count] of [[0, 1], [-2, 1], [1.8, 1], [NaN, 2], [Infinity, 2], [99, 3]]) {
    assert.equal(visibleIds(htmlFor({ items: ['a', 'b', 'c'].map(id => itemWith('resolved', { id })), inlineLimit, onExpand() {} })).length, count);
  }
});

test('no expansion capability keeps all items reachable; workspace and empty input have no fake expand entry', () => {
  const items = ['a', 'b', 'c'].map(id => itemWith('waiting-human', { id }));
  for (const mode of modes) {
    assert.deepEqual(visibleIds(htmlFor({ ...mode, items, inlineLimit: 1 })), ['a', 'b', 'c']);
    assert.doesNotMatch(htmlFor({ ...mode, items }), /查看全部/);
    const empty = htmlFor({ ...mode, items: [], onExpand() {} });
    assert.match(empty, /暂无异常记录/); assert.doesNotMatch(empty, /查看全部/);
  }
  const full = htmlFor({ view: 'workspace', items, inlineLimit: 1, onExpand() {} });
  assert.deepEqual(visibleIds(full), ['a', 'b', 'c']); assert.doesNotMatch(full, /查看全部/);
});

test('compact never hides unknown or failure beyond the inline limit, including disabled and retained facts', () => {
  const items = [itemWith('resolved', { id: 'first' }), itemWith('unknown', { id: 'unknown' }), itemWith('failed', { id: 'failed', disabledReason: '当前仅可查看。' })];
  for (const view of ['inline', 'workspace']) {
    const html = htmlFor({ view, density: 'compact', items, inlineLimit: 1, onExpand() {}, details: h('p', null, '补充说明') });
    assert.deepEqual(visibleIds(html), ['first', 'unknown', 'failed']);
    for (const fact of ['处置回执未确认', '处置失败', '当前仅可查看。', baseItem.retained]) assert.ok(html.includes(fact));
    assert.doesNotMatch(html, /补充说明|查看全部/);
  }
});

test('workspace exposes evidence slots, versions, rules and missing facts without manufacturing evidence', () => {
  const item = { ...baseItem, evidence: [{ id: 'source', label: '原稿', location: '第 3 页', preview: h('math', null, h('mi', null, 'x')) }, { id: 'blocked', label: '失效材料', location: '附页', version: 'v2', unavailableReason: '当前材料暂不可用。', preview: h('p', null, '不应出现的预览') }] };
  for (const density of ['default', 'compact']) {
    const html = htmlFor({ view: 'workspace', density, items: [item] });
    for (const text of ['原始材料与证据', '来源版本未确认', '第 3 页', 'v2', '<math>', item.basis, '当前材料暂不可用。']) assert.ok(html.includes(text));
    assert.doesNotMatch(html, /不应出现的预览|已读取|已引用|已参考/);
  }
  assert.doesNotMatch(htmlFor({ items: [item] }), /<math>|页面质量记录 v1/);
  assert.match(htmlFor({ view: 'workspace' }), /暂无可核对的材料记录/);
});

test('history retains then-status, scope, basis, method and time after current facts change; records have no actions', () => {
  const history = deepFreeze(Object.entries(states).map(([state], index) => ({ id: `history-${index}`, state, description: `当时的 ${state} 记录`, scope: '当时第 1 页', basis: '当时版本 r1', ...(index % 2 ? {} : { method: '保留原文', time: '2026-09-24 18:30', request }) })));
  const before = JSON.stringify(history);
  function historyMarkup(disposition, density) {
    const html = htmlFor({ view: 'workspace', density, items: [{ ...baseItem, scope: '当前第 3 页', basis: '当前版本 r9', disposition, history }] });
    return html.slice(html.indexOf('<section class="min-w-0 space-y-3" aria-label="处置记录"'));
  }
  for (const density of ['default', 'compact']) {
    const old = historyMarkup(states['waiting-human'], density), current = historyMarkup(states.resolved, density);
    assert.equal(old, current);
    for (const fact of ['当时状态', '当时第 1 页', '当时版本 r1', '保留原文', '时间未确认', '当时请求', '2026-09-24 18:30']) assert.ok(current.includes(fact));
    assert.doesNotMatch(current, /当前第 3 页|当前版本 r9|<button\b|animate-spin/);
  }
  assert.equal(JSON.stringify(history), before);
});

test('handling, recovery and query emit only typed identifiers, do not change frozen input or append history', () => {
  const events = [];
  for (const state of ['waiting-human', 'resolved', 'unknown', 'waiting']) {
    const items = deepFreeze([structuredClone({ ...itemWith(state), history: [{ id: 'old', state: 'waiting-human', description: '当时待处理', scope: '第 3 页', basis: 'v1' }] })]);
    const before = JSON.stringify(items), extra = { items, onAction: intent => events.push(intent) };
    const rendered = htmlFor(extra);
    const buttons = capture(extra).filter(node => node.props.onClick && node.props['aria-label']);
    assert.equal(buttons.length, 1); buttons[0].props.onClick();
    assert.equal(JSON.stringify(items), before); assert.equal(htmlFor(extra), rendered);
  }
  assert.deepEqual(events, [
    { kind: 'handle', exceptionId: 'page-3', actionId: 'replace' },
    { kind: 'handle', exceptionId: 'page-3', actionId: 'resume' },
    { kind: 'query', exceptionId: 'page-3', actionId: 'query', requestId: 'request-1' },
    { kind: 'query', exceptionId: 'page-3', actionId: 'query', requestId: 'request-1' },
  ]);
});

test('disabled reasons and impacts are visible, associated, and enforced by the actual event guard', () => {
  let calls = 0;
  const variants = [
    { disabledReason: '整组只读。' },
    { items: [{ ...baseItem, disabledReason: '本页只读。' }] },
    { items: [{ ...baseItem, disposition: { ...states['waiting-human'], actions: [{ ...handle, disabledReason: '没有替代材料。' }] } }] },
    { onAction: undefined },
  ];
  for (const variant of variants) {
    const extra = { onAction() { calls++; }, ...variant }, html = htmlFor(extra);
    const tag = html.match(/<button\b[^>]*aria-label="替换本页：第 3 页模糊"[^>]*>/)[0];
    assert.match(tag, /disabled=""/);
    for (const id of tag.match(/aria-describedby="([^"]+)"/)[1].split(' ')) assert.ok(html.includes(`id="${id}"`));
    assert.ok(html.includes(handle.impact));
    capture(extra).find(node => node.props['aria-label'] === '替换本页：第 3 页模糊').props.onClick();
  }
  assert.equal(calls, 0);
  const empty = htmlFor({ items: [itemWith('ignored', { disabledReason: '本页只读。' })] });
  assert.match(empty, /本页只读。/); assert.doesNotMatch(empty, /<button\b/);
});

test('expand forwards its trigger and return is pure view navigation, including an unknown workspace', () => {
  const events = [], trigger = { id: 'origin' };
  const common = { onAction: value => events.push(value), onExpand: value => events.push(['expand', value]), onBack: () => events.push(['back']) };
  const expand = capture(common).find(node => node.props.onClick && !node.props['aria-label']);
  expand.props.onClick({ currentTarget: trigger });
  const back = capture({ ...common, view: 'workspace', items: [itemWith('unknown')] }).find(node => node.props.onClick && !node.props['aria-label']);
  back.props.onClick();
  assert.deepEqual(events, [['expand', trigger], ['back']]);
  assert.doesNotMatch(htmlFor({ view: 'workspace' }), /返回<\/button>/);
});

test('one optional notice and collapsed details never hide status, limits or disabled facts', () => {
  for (const mode of modes) {
    const extra = { ...mode, notice: '示例边界', disabledReason: '当前只读', items: [itemWith('failed')] };
    assert.doesNotMatch(htmlFor(extra), /data-slot="collapsible-trigger"/);
    const html = htmlFor({ ...extra, details: h('p', null, '补充处置说明') });
    assert.match(html, /aria-expanded="false"/); assert.match(html, /说明<\/button>/);
    assert.doesNotMatch(html, /补充处置说明/);
    for (const fact of ['示例边界', '当前只读', '处置失败', baseItem.scope, baseItem.retained]) assert.ok(html.includes(fact));
    assert.equal((html.match(/示例边界/g) ?? []).length, 1);
  }
});

test('two labelled example purposes cover all four kinds and three presentations with long Chinese and math', () => {
  const kinds = new Set();
  for (const example of Object.values(exceptionExamples)) {
    assert.match(example.title, /示例/);
    example.items.forEach(item => kinds.add(item.kind));
    const html = htmlFor({ title: example.title, items: example.items, view: 'workspace' });
    example.items.forEach(item => assert.ok(html.includes(item.title)));
    assert.doesNotMatch(html, /意图|宿主|回调|受控/);
  }
  assert.deepEqual([...kinds].sort(), ['conflict', 'low-confidence', 'missing', 'unparseable']);
  assert.match(htmlFor({ items: exceptionExamples.questions.items, view: 'workspace' }), /<math.*<mfrac>/);
  const demo = render(h(AgentExceptionHandlerDemo));
  for (const text of ['固定示例', '对话摘要', '完整处置', '紧凑列表', '320px 窄容器']) assert.ok(demo.includes(text));
  assert.equal((demo.match(/data-agent-exception-view=/g) ?? []).length, 3);
});

test('public types prohibit submit actions on unknown/waiting and require the original query request', async () => {
  const typeFile = new URL('type-contract.tsx', runtime), path = fileURLToPath(typeFile);
  await writeFile(typeFile, `import type { AgentExceptionDisposition as D, AgentExceptionIntent as I } from '../../components/prism-next/agent-exception-handler';
const action = { id: 'x', label: '处理', impact: '第 3 页' };
const request = { id: 'old', label: '原请求' };
const valid: D = { state: 'unknown', description: '未确认', request, query: action };
// @ts-expect-error unknown never admits a new disposition
const unknown: D = { state: 'unknown', description: '未确认', request, actions: [action] };
// @ts-expect-error waiting never admits another submission
const waiting: D = { state: 'waiting', description: '提交中', request, actions: [action] };
// @ts-expect-error original request is mandatory
const missing: D = { state: 'unknown', description: '未确认', query: action };
// @ts-expect-error resolved needs an explicit disposition record
const resolved: D = { state: 'resolved', description: '已处理' };
// @ts-expect-error query event must identify the original request
const intent: I = { kind: 'query', exceptionId: 'x', actionId: 'query' };
void [valid, unknown, waiting, missing, resolved, intent];
`);
  try {
    const config = ts.readConfigFile(`${root}tsconfig.json`, ts.sys.readFile);
    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
    const program = ts.createProgram([path], { ...parsed.options, incremental: false, noEmit: true });
    const diagnostics = ts.getPreEmitDiagnostics(program);
    assert.equal(diagnostics.length, 0, diagnostics.map(value => ts.flattenDiagnosticMessageText(value.messageText, '\n')).join('\n'));
  } finally { await rm(typeFile); }
});
