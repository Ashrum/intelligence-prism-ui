import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = new URL('../.sites-runtime/collection-basket/', import.meta.url);
await mkdir(runtime, { recursive: true });
const file = new URL('test-bundle.mjs', runtime);
const bundle = await build({ stdin: { contents: `export * from './components/prism-next/agent-collection-basket'; export { collectionBasketExamples, CollectionBasketExample, AgentCollectionBasketDemo } from './components/prism-next/demos/agent-collection-basket';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false });
await writeFile(file, bundle.outputFiles[0].text);
const { AgentCollectionBasket, collectionBasketExamples, CollectionBasketExample, AgentCollectionBasketDemo } = await import(file);
await rm(file);
const h = React.createElement;
const collection = { id: 'basket', title: '练习题集合', type: '题目', version: '集合 v4', source: '现有题篮' };
const actions = { remove: {}, move: { up: {}, down: {} }, group: { options: [{ id: null, label: '未分组' }, { id: 'g1', label: '基础' }, { id: 'g2', label: '拓展' }] } };
const entry = { id: 'q1', title: '第一题', type: '题目', source: '题库', version: '题目 v2', groupId: 'g1', selectable: {}, fields: [{ label: '分值', value: '5 分' }], actions };
const props = { collection, items: [entry, { ...entry, id: 'q2', title: '第二题', groupId: 'g2', version: '题目 v3' }], summary: { count: 9, fields: [{ label: '总分', value: '147 分' }] }, groups: [{ id: 'g1', label: '基础', count: 8 }, { id: 'g2', label: '拓展', count: 1 }] };
const modes = [{}, { view: 'workspace' }, { density: 'compact' }, { view: 'workspace', density: 'compact' }];
const htmlFor = extra => render(h(AgentCollectionBasket, { ...props, ...extra }));
const textOf = html => html.replace(/<[^>]*>/g, '');
function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.freeze(value); Object.values(value).forEach(freeze); }
  return value;
}
// Actual component-created callbacks under SSR; these are not browser interactions.
function capture(extra) {
  const nodes = [], owned = new Set(['AgentCollectionBasket', 'BasketRow', 'BasketActionButton', 'BasketFields']);
  function inspect(node) {
    if (!React.isValidElement(node)) return node;
    if (typeof node.type === 'function' && owned.has(node.type.name)) return h(function Probe() { return inspect(node.type(node.props)); });
    nodes.push(node);
    return React.cloneElement(node, {}, React.Children.map(node.props.children, inspect));
  }
  render(inspect(h(AgentCollectionBasket, { ...props, ...extra })));
  return nodes;
}
const button = (nodes, label) => nodes.find(node => node.props.onClick && (node.props['aria-label'] === label || node.props.children === label));
const containingButton = (nodes, text) => nodes.find(node => node.props.onClick && React.Children.toArray(node.props.children).includes(text));

test('default inline and all densities display only supplied totals and group counts, including zero and unknown', () => {
  assert.equal(htmlFor({}), htmlFor({ view: 'inline', density: 'default' }));
  for (const mode of modes) {
    const html = textOf(htmlFor(mode));
    for (const text of ['数量：9项', '总分：147 分', '基础：8', '拓展：1']) assert.ok(html.includes(text));
    assert.doesNotMatch(html, /数量：2项|总分：10 分/);
    assert.match(textOf(htmlFor({ ...mode, summary: { count: 0 } })), /数量：0项/);
    assert.match(textOf(htmlFor({ ...mode, summary: { count: null }, groups: [{ id: 'g1', label: '基础', count: null }] })), /数量：未确认.*基础：未确认/);
    assert.doesNotMatch(htmlFor({ ...mode, summary: { count: null } }), /总分/);
  }
});

test('sync states and added/removed facts are host inputs; callbacks never create saving or change records', () => {
  for (const mode of modes) for (const [state, label] of Object.entries({ local: '本页暂存', synced: '已同步', failed: '同步失败', unknown: '状态未确认' })) {
    const events = [], extra = { ...mode, sync: { state, description: '原保存记录', action: { id: 'check', label: '检查同步' } }, onAction: value => events.push(value) };
    const before = htmlFor(extra);
    button(capture(extra), '检查同步：练习题集合').props.onClick({ currentTarget: {} });
    assert.match(before, new RegExp(label)); assert.match(before, /原保存记录/);
    assert.deepEqual(events, [{ collectionId: 'basket', collectionVersion: '集合 v4', kind: 'sync', actionId: 'check' }]);
    assert.equal(htmlFor(extra), before); assert.doesNotMatch(before, /最近变化|data-collection-change/);
  }
  assert.match(htmlFor({}), /状态未确认/);
  const changes = freeze([{ id: 'add', kind: 'added', description: '当时加入记录' }, { id: 'remove', kind: 'removed', description: '当时移除记录' }]);
  const before = htmlFor({ changes });
  assert.match(before, /已加入.*当时加入记录/); assert.match(before, /已移除.*当时移除记录/);
  assert.equal(htmlFor({ changes }), before);
});

test('remove, destination, clear and resolution emit scoped intents, preserving frozen list, issue and summary', () => {
  const events = [], trigger = { id: 'source' }, items = freeze([{ ...entry, issue: { state: 'invalid', reason: '已经下架' }, actions: { ...actions, resolve: [{ id: 'replace', label: '查看替代题' }] } }]);
  const extra = { items, onAction: (...args) => events.push(args), clear: { id: 'clear', label: '清空集合' }, destinations: [{ id: 'paper', label: '用于组卷' }] };
  const before = htmlFor(extra), nodes = capture(extra);
  button(nodes, '移除：第一题').props.onClick({ currentTarget: trigger });
  button(nodes, '查看替代题：第一题').props.onClick({ currentTarget: trigger });
  button(nodes, '用于组卷：练习题集合').props.onClick({ currentTarget: trigger });
  button(capture({ ...extra, view: 'workspace' }), '清空集合：练习题集合').props.onClick({ currentTarget: trigger });
  const common = { collectionId: 'basket', collectionVersion: '集合 v4' }, target = { itemId: 'q1', version: '题目 v2' };
  assert.deepEqual(events, [
    [{ ...common, ...target, kind: 'remove' }, trigger], [{ ...common, ...target, kind: 'resolve', actionId: 'replace' }, trigger],
    [{ ...common, kind: 'destination', actionId: 'paper', targets: [target] }, trigger], [{ ...common, kind: 'clear', actionId: 'clear', targets: [target] }, trigger],
  ]);
  assert.equal(htmlFor(extra), before); assert.doesNotMatch(before, /已创建|已完成|已同步|已移除/);
});

test('inline limit retains all invalid, conflicting and restricted entries beyond the first N; no expand means complete list', () => {
  const items = [entry, { ...entry, id: 'hidden', title: '普通第三项' }, { ...entry, id: 'invalid', title: '失效项', issue: { state: 'invalid', reason: '题目已下架' } }, { ...entry, id: 'conflict', title: '冲突项', issue: { state: 'conflict', reason: '已从 v1 更新至 v2' } }, { id: 'restricted', access: 'restricted', disclosure: { label: '受限项', reason: '当前无权访问' } }];
  for (const density of ['default', 'compact']) {
    const short = htmlFor({ items, density, inlineLimit: 1, onExpand() {}, sync: { state: 'failed', description: '保存未成功，仍保留本页集合' } });
    for (const text of ['第一题', '失效项', '题目已下架', '版本冲突', '已从 v1 更新至 v2', '受限项', '当前无权访问', '同步失败', '保存未成功，仍保留本页集合']) assert.ok(short.includes(text));
    assert.doesNotMatch(short, /普通第三项/); assert.match(short, /管理全部/);
    const full = htmlFor({ items, density, inlineLimit: 1 });
    assert.match(full, /普通第三项/); assert.doesNotMatch(full, /管理全部/);
    assert.match(htmlFor({ items, density, view: 'workspace', inlineLimit: 1, onExpand() {} }), /普通第三项/);
  }
  for (const inlineLimit of [NaN, Infinity, -4, 0, 1.8]) assert.match(htmlFor({ items, inlineLimit, onExpand() {} }), /第一题/);
});

test('expansion and return preserve identity, selection and facts and never send collection actions', () => {
  const events = [], trigger = { id: 'expand' }, extra = { selectedIds: freeze(['q1']), onExpand: value => events.push(['expand', value]), onBack: () => events.push(['back']), onAction: () => assert.fail('view must not mutate') };
  const before = htmlFor(extra);
  containingButton(capture(extra), '管理全部').props.onClick({ currentTarget: trigger });
  button(capture({ ...extra, view: 'workspace' }), '返回原位置').props.onClick();
  assert.deepEqual(events, [['expand', trigger], ['back']]); assert.equal(htmlFor(extra), before);
  assert.doesNotMatch(htmlFor({ ...extra, view: 'workspace' }), /管理全部/);
  assert.doesNotMatch(htmlFor({}), /管理全部|返回原位置/);
});

test('touch-equivalent up/down controls emit direction and actual adjacent identity; endpoints and grouped order are guarded', () => {
  for (const density of ['default', 'compact']) {
    const events = [], extra = { density, view: 'workspace', onAction: value => events.push(value) }, nodes = capture(extra), before = htmlFor(extra);
    button(nodes, '上移：第一题').props.onClick({ currentTarget: {} });
    button(nodes, '下移：第二题').props.onClick({ currentTarget: {} });
    assert.equal(events.length, 0); assert.equal(button(nodes, '上移：第一题').props.disabled, true);
    button(nodes, '下移：第一题').props.onClick({ currentTarget: {} });
    button(nodes, '上移：第二题').props.onClick({ currentTarget: {} });
    assert.deepEqual(events.map(event => [event.itemId, event.direction, event.adjacentId, event.version]), [['q1', 'down', 'q2', '题目 v2'], ['q2', 'up', 'q1', '题目 v3']]);
    assert.equal(htmlFor(extra), before);
    const grouped = capture({ ...extra, groupBy: 'group' });
    button(grouped, '下移：第一题').props.onClick({ currentTarget: {} });
    assert.equal(events.length, 2); assert.match(htmlFor({ ...extra, groupBy: 'group' }), /请切回集合顺序后调整/);
    assert.equal(button(nodes, '下移：第一题').props.type, 'button');
    assert.equal(button(nodes, '下移：第一题').props.size, 'navigation');
  }
  assert.doesNotMatch(htmlFor({ onAction() {} }), /上移|下移/);
});

test('direction capabilities come from host and do not appear merely because an item has neighbors', () => {
  const items = [{ ...entry, actions: { move: { down: { disabledReason: '次序已锁定' } } } }, { ...entry, id: 'q2', title: '第二题', actions: {} }];
  const nodes = capture({ items, view: 'workspace', onAction: () => assert.fail('disabled') });
  assert.equal(button(nodes, '下移：第一题').props.disabled, true);
  button(nodes, '下移：第一题').props.onClick({ currentTarget: {} });
  assert.equal(button(nodes, '上移：第一题'), undefined); assert.equal(button(nodes, '上移：第二题'), undefined);
  assert.match(htmlFor({ items, view: 'workspace' }), /当前无法操作/);
});

test('group changes use only offered targets, stay controlled and retain every ungrouped or unresolved item in grouped view', () => {
  const events = [], extra = { view: 'workspace', onAction: value => events.push(value) }, before = htmlFor(extra);
  const select = capture(extra).find(node => node.props.onValueChange && Array.isArray(node.props.items));
  select.props.onValueChange('2'); select.props.onValueChange('forged'); select.props.onValueChange('1');
  assert.deepEqual(events, [{ collectionId: 'basket', collectionVersion: '集合 v4', itemId: 'q1', version: '题目 v2', kind: 'group', groupId: 'g2' }]);
  assert.equal(htmlFor(extra), before);
  const items = [...props.items, { ...entry, id: 'unknown', title: '未知组条目', groupId: 'absent' }, { ...entry, id: 'ungrouped', title: '未分组条目', groupId: null }];
  const html = htmlFor({ items, view: 'workspace', groupBy: 'group' });
  for (const title of ['第一题', '第二题', '未知组条目', '未分组条目', '分组未确认']) assert.ok(html.includes(title));
  assert.equal((html.match(/data-collection-item=/g) ?? []).length, 4);
});

test('group layout changes only notify the view callback', () => {
  const events = [], extra = { view: 'workspace', onGroupByChange: value => events.push(value), onAction: () => assert.fail('view only') };
  button(capture(extra), '按分组查看').props.onClick();
  assert.deepEqual(events, ['group']); assert.match(htmlFor(extra), /aria-label="全部条目"/);
});

test('selection and select-all are controlled, exclude nonselectable items and offer recovery from stale selected IDs', () => {
  const events = [], selectedIds = freeze(['stale']), items = freeze([...props.items, { ...entry, id: 'locked', selectable: { disabledReason: '此项不可选择' } }]);
  const extra = { view: 'workspace', items, selectedIds, onSelectionChange: value => events.push(value) }, before = htmlFor(extra), nodes = capture(extra);
  nodes.find(node => node.props.onCheckedChange && node.props['aria-label'] === '选择：第一题').props.onCheckedChange(true);
  nodes.find(node => node.props.onCheckedChange && node.props.disabled).props.onCheckedChange(true);
  button(nodes, '全选可选条目：练习题集合').props.onClick({ currentTarget: {} });
  button(nodes, '清除选择：练习题集合').props.onClick({ currentTarget: {} });
  assert.deepEqual(events, [['stale', 'q1'], ['stale', 'q1', 'q2'], []]); assert.deepEqual(selectedIds, ['stale']); assert.equal(htmlFor(extra), before);
  assert.match(before, /部分已选条目已不可选/);
});

test('batch action preserves exact host scope and version order; invalid scopes are blocked as a whole', () => {
  const selectedIds = freeze(['q1', 'q2']), events = [], extra = { view: 'workspace', selectedIds, onAction: value => events.push(value), batchActions: [{ id: 'batch', label: '批量处理', itemIds: ['q2', 'q1'] }] };
  button(capture(extra), '批量处理：练习题集合').props.onClick({ currentTarget: {} });
  assert.deepEqual(events, [{ collectionId: 'basket', collectionVersion: '集合 v4', kind: 'batch', actionId: 'batch', targets: [{ itemId: 'q2', version: '题目 v3' }, { itemId: 'q1', version: '题目 v2' }] }]);
  for (const [selection, targets] of [[[], []], [['q1'], ['q1', 'q2']], [['q1', 'stale'], ['q1', 'stale']], [['q1'], ['q1', 'q1']], [['q1', 'q1'], ['q1', 'q1']]]) {
    const invalid = { ...extra, selectedIds: selection, batchActions: [{ id: 'batch', label: '批量处理', itemIds: targets }] };
    const control = button(capture(invalid), '批量处理：练习题集合');
    assert.equal(control.props.disabled, true); control.props.onClick({ currentTarget: {} });
    assert.match(htmlFor(invalid), /请核对已选条目与操作范围/);
  }
  assert.equal(events.length, 1);
});

test('restricted entries never render private metadata or call content slots; only supplied remove and resolution capabilities remain', () => {
  const secret = { ...entry, access: 'restricted', disclosure: { label: '受限条目', reason: '当前无权查看内容' }, title: 'PRIVATE-TITLE', source: 'PRIVATE-SOURCE', version: 'PRIVATE-VERSION', summary: 'PRIVATE-SUMMARY', fields: [{ label: 'PRIVATE-SCORE', value: 99 }], groupId: 'g1', issue: { state: 'invalid', reason: 'PRIVATE-ISSUE' }, actions: { ...actions, resolve: [{ id: 'access', label: '申请查看' }] } };
  for (const mode of modes) {
    const events = [], extra = { ...mode, items: [secret], selectedIds: ['q1'], onAction: value => events.push(value), onSelectionChange() {}, renderItem: () => assert.fail('restricted slot'), onExpand() {} };
    const html = htmlFor(extra);
    assert.match(html, /访问受限.*当前无权查看内容/); assert.doesNotMatch(html, /PRIVATE-|上移|下移|选择：受限条目|分组 · 受限条目/);
    button(capture(extra), '移除：受限条目').props.onClick({ currentTarget: {} });
    button(capture(extra), '申请查看：受限条目').props.onClick({ currentTarget: {} });
    assert.deepEqual(events.map(event => [event.kind, event.itemId, event.version]), [['remove', 'q1', undefined], ['resolve', 'q1', undefined]]);
  }
});

test('passive domain renderer only receives permitted workspace entries; inline remains generic', () => {
  const seen = [], renderItem = (item, context) => { seen.push([item.id, context.density]); return h('p', null, '题卡正文插槽'); };
  assert.doesNotMatch(htmlFor({ renderItem }), /题卡正文插槽/); assert.equal(seen.length, 0);
  assert.match(htmlFor({ view: 'workspace', density: 'compact', renderItem }), /题卡正文插槽/);
  assert.deepEqual(seen, [['q1', 'compact'], ['q2', 'compact']]);
});

test('empty list has a genuine empty state and preserves supplied count, sync failure and declared destinations', () => {
  for (const mode of modes) {
    const html = htmlFor({ ...mode, items: [], summary: { count: 0 }, sync: { state: 'failed', description: '保存失败原因' }, destinations: [{ id: 'prepare', label: '用于练习', disabledReason: '请先选题' }], onAction() {} });
    assert.match(html, /集合中还没有条目/); assert.match(textOf(html), /数量：0项/); assert.match(html, /保存失败原因|请先选题/);
    assert.doesNotMatch(html, /data-collection-item=/);
  }
  assert.match(htmlFor({ items: [], emptyText: '暂未提供条目记录' }), /暂未提供条目记录/);
});

test('history uses then-version and rejects mutation, selection and group callbacks without inferring new facts', () => {
  for (const snapshot of ['', '昨日记录']) {
    const extra = { collection: { ...collection, snapshot, version: '历史 v1' }, view: 'workspace', onAction: () => assert.fail('history action'), onSelectionChange: () => assert.fail('history selection'), destinations: [{ id: 'prepare', label: '用于练习' }], clear: { id: 'clear', label: '清空集合' } };
    const html = htmlFor(extra), nodes = capture(extra);
    assert.match(html, /历史集合/); assert.match(textOf(html), /当时版本：历史 v1/); assert.doesNotMatch(html, /集合 v4/);
    for (const node of nodes.filter(node => node.props.onClick && node.props.disabled)) node.props.onClick({ currentTarget: {} });
    for (const node of nodes.filter(node => node.props.onCheckedChange)) node.props.onCheckedChange(true);
    for (const node of nodes.filter(node => node.props.onValueChange)) node.props.onValueChange('2');
    assert.equal(htmlFor(extra), html);
  }
});

test('missing receivers and explicit disabled reasons remain visible and guard direct callback invocation', () => {
  const extra = { view: 'workspace', onAction: () => assert.fail('disabled'), items: [{ ...entry, actions: { remove: { disabledReason: '不能移除此项' }, group: { ...actions.group, disabledReason: '分组已锁定' } } }], destinations: [{ id: 'paper', label: '用于组卷', disabledReason: '请先核对失效题' }] };
  const nodes = capture(extra), html = htmlFor(extra);
  for (const label of ['移除：第一题', '用于组卷：练习题集合']) {
    const node = button(nodes, label); assert.equal(node.props.disabled, true); assert.ok(node.props['aria-describedby']); node.props.onClick({ currentTarget: {} });
  }
  nodes.find(node => node.props.onValueChange).props.onValueChange('2');
  for (const text of ['不能移除此项', '分组已锁定', '请先核对失效题']) assert.ok(html.includes(text));
  assert.match(htmlFor({}), /当前无法操作/);
});

test('one standing boundary notice, collapsed details and native non-submit buttons do not hide necessary facts', () => {
  for (const mode of modes) {
    const extra = { ...mode, notice: '本页固定示例', details: h('p', null, '额外解释正文'), sync: { state: 'failed', description: '失败事实必须可见' } }, html = htmlFor(extra);
    assert.equal((html.match(/本页固定示例/g) ?? []).length, 1); assert.match(html, /aria-expanded="false"/);
    assert.doesNotMatch(html, /额外解释正文|意图|宿主|回调|受控/); assert.match(html, /失败事实必须可见/);
    for (const tag of html.match(/<button\b[^>]*>/g) ?? []) assert.match(tag, /type="button"/);
  }
});

test('two purposes reuse three presentations, question summary slot and provided material groups', () => {
  const questions = collectionBasketExamples.questions, preparation = collectionBasketExamples.preparation;
  assert.equal(questions.items.filter(item => item.issue?.state === 'invalid').length, 1);
  assert.deepEqual(preparation.items.map(item => item.type), ['图片', '视频', '文章']); assert.equal(preparation.groups.length, 2);
  for (const purpose of ['questions', 'preparation']) {
    const html = render(h(CollectionBasketExample, { purpose, narrow: true }));
    for (const text of ['固定示例', '对话摘要', '完整集合管理', '紧凑集合摘要', 'max-w-[320px]']) assert.ok(html.includes(text));
    assert.equal((html.match(/data-agent-collection-view=/g) ?? []).length, 3);
    if (purpose === 'questions') { assert.match(html, /data-collection-summary-row=/); assert.doesNotMatch(html, /data-question-summary=|<mfrac>|data-collection-content=/); assert.match(html, /总分（含失效题）/); }
    else for (const text of ['课堂导入', '拓展阅读', '图片', '视频', '文章']) assert.ok(html.includes(text));
  }
  assert.match(render(h(AgentCollectionBasketDemo)), /320px 窄容器/);
});

test('public types require complete host facts and bound intents and exclude private fields on restricted entries', async () => {
  const typeFile = new URL('type-contract.tsx', runtime), path = fileURLToPath(typeFile);
  await writeFile(typeFile, `import type { AgentCollectionRestrictedEntry as R, AgentCollectionSync as S, AgentCollectionIntent as I, AgentCollectionBasketProps as P } from '../../components/prism-next/agent-collection-basket';
const r: R = { id: 'x', access: 'restricted', disclosure: { label: '受限项', reason: '无权查看' } };
// @ts-expect-error restricted entry may not carry private metadata
const secret: R = { ...r, source: 'private' };
// @ts-expect-error failure requires a description
const sync: S = { state: 'failed' };
// @ts-expect-error move needs adjacent item identity
const intent: I = { collectionId: 'c', kind: 'move', itemId: 'x', direction: 'up' };
// @ts-expect-error summary count must be supplied even when unknown
const summary: P['summary'] = { fields: [] };
const props: P = { collection: { id: 'c', title: '素材', type: '资源' }, items: [r], summary: { count: null } };
// @ts-expect-error external list is readonly
props.items.push(r);
void [secret, sync, intent, summary, props];
`);
  try {
    const config = ts.readConfigFile(`${root}tsconfig.json`, ts.sys.readFile);
    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
    const program = ts.createProgram([path], { ...parsed.options, incremental: false, noEmit: true });
    const diagnostics = ts.getPreEmitDiagnostics(program);
    assert.equal(diagnostics.length, 0, diagnostics.map(value => ts.flattenDiagnosticMessageText(value.messageText, '\n')).join('\n'));
  } finally { await rm(typeFile); }
});


// Captured from the unmodified component before B1: inline/workspace × default/compact.
// Normalize only opaque React-generated IDs; markup, text and classes remain exact.
test('default presentation retains its pre-B1 rendered snapshots', () => {
  const snapshots = [
    'c4045557d8f630a3f0e8fed89840583e3d9132c09abcde6760de15420c2f259d',
    '8e259d74eedaafcd12e4162023c07b7caa5940fc3ed1e3ec19f882bec1ecd7fa',
    'eeb1281ab142f5edda4e404a4457dabb06d5c277cc0c83b3b924f4d47381b8d9',
    'e97eb6fd972afa294a4dfd245f127930218ca761c77f87ace5e3ca37332ec128',
  ];
  modes.forEach((mode, index) => assert.equal(createHash('sha256').update(htmlFor(mode).replace(/_R_[^"\s<>]+_/g, 'REACT_ID')).digest('hex'), snapshots[index]));
});

const summaryProps = {
  itemPresentation: 'summary', onAction() {},
  renderItem: () => assert.fail('summary must never invoke content renderer'),
};
function descendants(node, predicate) {
  const found = [];
  function visit(value) {
    if (!React.isValidElement(value)) return;
    if (predicate(value)) found.push(value);
    React.Children.forEach(value.props.children, visit);
  }
  visit(node); return found;
}

test('summary renders compact numbered title and one facts line without invoking body renderer in either view', () => {
  for (const mode of modes) {
    const extra = { ...mode, ...summaryProps, onSelectionChange() {} };
    const nodes = capture(extra), rows = nodes.filter(node => node.props['data-collection-summary-row'] === '');
    assert.equal(rows.length, 2);
    rows.forEach((row, index) => {
      const remove = React.Children.toArray(row.props.children).at(-1);
      assert.equal(remove.props['aria-label'], `移出试题篮：${props.items[index].title}`);
      assert.equal(remove.props.size, 'icon-sm'); assert.equal(remove.props.variant, 'ghost');
      assert.match(remove.props.className, /pointer-coarse:min-h-11 pointer-coarse:min-w-11/);
    });
    const html = htmlFor(extra), rowsHtml = html.match(/<li data-collection-item[\s\S]*?<\/li>/g).join('');
    assert.match(textOf(rowsHtml), /第 1 题 · 第一题.*题目 · 分值：5 分/);
    assert.doesNotMatch(rowsHtml, /data-collection-content=|data-host-summary|版本：|data-slot="card"/);
    assert.equal((rowsHtml.match(/data-agent-meta=/g) || []).length, 2);
    assert.match(rowsHtml, /data-slot="separator"/);
    if (mode.view === 'workspace') {
      assert.match(html, /aria-label="选择第 1 题 · 第一题"/);
      for (const label of rowsHtml.match(/<label[^>]*for="[^"]*-select"[\s\S]*?<\/label>/g) || []) assert.equal(textOf(label), '');
    }
  }
});

test('summary title opens the exact authorized entry with a scoped label and trigger, including history', () => {
  const calls = [], trigger = { id: 'open' };
  const extra = { ...summaryProps, openLabel: '核对题目', onOpenItem: (...args) => calls.push(args) };
  for (const snapshot of [undefined, '历史快照']) {
    button(capture({ ...extra, collection: { ...collection, snapshot } }), '核对题目：第 1 题 · 第一题').props.onClick({ currentTarget: trigger });
  }
  assert.deepEqual(calls, [[entry, trigger], [entry, trigger]]);
  const restricted = { id: 'secret', access: 'restricted', disclosure: { label: '受限题', reason: '无权查看' } };
  assert.doesNotMatch(htmlFor({ ...extra, items: [restricted] }), /核对题目|第 1 题/);
  assert.doesNotMatch(htmlFor(summaryProps), /aria-label="查看题目/);
  const html = htmlFor({ ...extra, inlineLimit: 1, onExpand() {}, items: [entry, { ...entry, id: 'skip' }, { ...entry, id: 'invalid', issue: { state: 'invalid', reason: '失效' } }] });
  assert.match(html, /核对题目：第 3 题/);
});

test('summary move icons retain scoped version intents, boundaries and grouped-order guards', () => {
  const events = [], trigger = {}, extra = { ...summaryProps, view: 'workspace', onAction: (...args) => events.push(args) };
  const nodes = capture(extra);
  const down = button(nodes, '下移：第 1 题 · 第一题');
  assert.equal(down.props.size, 'icon-sm'); assert.equal(down.props.variant, 'ghost');
  down.props.onClick({ currentTarget: trigger });
  assert.deepEqual(events, [[{ collectionId: 'basket', collectionVersion: '集合 v4', itemId: 'q1', version: '题目 v2', kind: 'move', direction: 'down', adjacentId: 'q2' }, trigger]]);
  for (const [state, label, reason] of [
    [{}, '上移：第 1 题 · 第一题', '已经是第一项。'],
    [{}, '下移：第 2 题 · 第二题', '已经是最后一项。'],
    [{ groupBy: 'group' }, '下移：第 1 题 · 第一题', '请切回集合顺序后调整。'],
    [{ collection: { ...collection, snapshot: '' } }, '下移：第 1 题 · 第一题', '历史集合仅供查看。'],
    [{ onAction: undefined }, '下移：第 1 题 · 第一题', '当前无法操作。'],
    [{ items: [{ ...entry, actions: { move: { down: { disabledReason: '顺序锁定' } } } }, props.items[1]] }, '下移：第 1 题 · 第一题', '顺序锁定'],
  ]) {
    const control = button(capture({ ...extra, ...state }), label);
    assert.equal(control.props.disabled, true); assert.ok(control.props['aria-describedby']);
    const html = htmlFor({ ...extra, ...state }); assert.ok(html.includes(reason));
    control.props.onClick({ currentTarget: trigger });
  }
  assert.equal(events.length, 1);
  assert.doesNotMatch(htmlFor({ ...extra, view: 'inline' }), /aria-label="上移|aria-label="下移/);
});

test('summary removal preserves the exact version-bound intent, trigger and disabled guards', () => {
  const events = [], trigger = { id: 'remove' }, extra = { ...summaryProps, onAction: (...args) => events.push(args) };
  const before = htmlFor(extra);
  button(capture(extra), '移出试题篮：第一题').props.onClick({ currentTarget: trigger });
  assert.deepEqual(events, [[{ collectionId: 'basket', collectionVersion: '集合 v4', itemId: 'q1', version: '题目 v2', kind: 'remove' }, trigger]]);
  assert.equal(htmlFor(extra), before);
  for (const blocked of [
    { onAction: undefined },
    { collection: { ...collection, snapshot: '' } },
    { items: [{ ...entry, actions: { remove: { disabledReason: '本题不可移出' } } }] },
  ]) {
    const state = { ...extra, ...blocked }, control = button(capture(state), '移出试题篮：第一题');
    assert.equal(control.props.disabled, true); assert.ok(control.props['aria-describedby']);
    const html = htmlFor(state), tag = html.match(/<button[^>]*aria-label="移出试题篮：第一题"[^>]*>/)[0];
    const describedBy = tag.match(/aria-describedby="([^"]+)"/)[1];
    assert.ok(html.includes(`id="${describedBy}"`));
    control.props.onClick({ currentTarget: trigger });
  }
  assert.equal(events.length, 1);
});

test('summary sources deduplicate only explicit matches; absent source and different source stay visible', () => {
  const items = [{ ...entry, source: collection.source }, { ...entry, id: 'other', source: '其他题库' }, { ...entry, id: 'unknown', source: undefined }];
  const html = htmlFor({ ...summaryProps, items });
  assert.equal((html.match(/data-agent-source=""/g) || []).length, 1);
  assert.equal((html.match(/来源：现有题篮/g) || []).length, 1);
  assert.match(html, /来源：其他题库/); assert.match(html, /来源：未确认/);
  const same = htmlFor({ ...summaryProps, items: [items[0], { ...items[0], id: 'same' }] });
  assert.equal((same.match(/data-agent-source=""/g) || []).length, 1);
});

test('summary header has one short-fact line and one main status; supplementary prose lives in source disclosure', () => {
  const extra = { ...summaryProps, summary: { count: 9, unit: '题' }, sync: { state: 'local', description: '本机浏览器存储说明' }, notice: '当前全局选题说明', details: h('p', null, 'P04 入篮说明'), visual: { updatedAt: '10:30' } };
  const html = htmlFor(extra), header = html.match(/<header[\s\S]*?<\/header>/)[0];
  assert.match(textOf(header), /练习题集合 · 9题/);
  assert.equal((header.match(/data-agent-status=/g) || []).length, 1);
  assert.equal((header.match(/data-agent-meta=/g) || []).length, 1);
  assert.match(header, /data-collection-header-facts/);
  assert.match(textOf(header), /集合版本：集合 v4.*来源：现有题篮.*最近更新：10:30/);
  assert.doesNotMatch(html, /本机浏览器存储说明|当前全局选题说明|P04 入篮说明/);
  const source = capture(extra).find(node => node.type.name === 'AgentSourceChip' && node.props.label === '来源：现有题篮');
  const disclosed = render(h('div', null, source.props.children));
  for (const text of ['本机浏览器存储说明', '当前全局选题说明', 'P04 入篮说明']) assert.ok(disclosed.includes(text));
  assert.match(textOf(htmlFor({ ...extra, summary: { count: 0, unit: '题' } })), /练习题集合 · 0题/);
  assert.match(textOf(htmlFor({ ...extra, summary: { count: null }, collection: { ...collection, source: undefined, version: undefined } })), /练习题集合 · 未确认.*来源：未确认.*同步信息不完整（集合版本未提供）/);
});

test('summary preserves required failure, unknown, issue, restriction, history and change facts outside disclosures', () => {
  const secret = { ...entry, access: 'restricted', title: 'PRIVATE', source: 'PRIVATE', disclosure: { label: '受限题目', reason: '权限不足' } };
  for (const state of ['failed', 'unknown']) {
    const html = htmlFor({ ...summaryProps, density: 'compact', collection: { ...collection, snapshot: '历史快照' },
      sync: { state, description: '同步原因必须可见' }, changes: [{ id: 'c', kind: 'added', description: '新增事实' }],
      items: [{ ...entry, issue: { state: 'invalid', reason: '题目已下架' } }, { ...entry, id: 'conflict', issue: { state: 'conflict', reason: '版本已更改' } }, secret],
      renderItem: item => { assert.notEqual(item.access, 'restricted'); return summaryProps.renderItem(item); },
    });
    for (const text of ['同步原因必须可见', '新增事实', '题目已下架', '版本已更改', '权限不足', '当时版本', '历史集合仅供查看']) assert.ok(html.includes(text));
    assert.doesNotMatch(html, /PRIVATE/);
  }
});


test('summary hides ungrouped placeholders and secondary facts but retains real grouping and issue reasons in every mode', () => {
  for (const mode of modes) for (const groupBy of ['none', 'group']) {
    const items = [
      { ...entry, groupId: undefined, source: collection.source, summary: '次要摘要', fields: [{ label: '版本备注', value: '次要字段' }], actions: { remove: {} } },
      { ...entry, id: 'conflict', groupId: 'g1', issue: { state: 'conflict', reason: '引用 v1 与当前 v2 不一致，请核对' }, actions: { remove: {} } },
      { ...entry, id: 'invalid', groupId: 'missing', issue: { state: 'invalid', reason: '资源失效，请移除' }, actions: { remove: { disabledReason: '移出暂不可用' } } },
    ];
    const html = htmlFor({ ...mode, ...summaryProps, groupBy, items });
    const rows = html.match(/<li data-collection-item[\s\S]*?<\/li>/g).join('');
    assert.doesNotMatch(html, /未分组|次要摘要|次要字段/);
    assert.doesNotMatch(rows, /版本：题目|版本：未确认/);
    for (const reason of ['版本冲突', '引用 v1 与当前 v2 不一致，请核对', '资源失效，请移除', '移出暂不可用']) assert.ok(rows.includes(reason));
    assert.match(textOf(rows), /分组：基础.*分组：分组未确认/);
    const normal = rows.match(/<li data-collection-item="q1"[\s\S]*?<\/li>/)[0];
    assert.doesNotMatch(normal, /data-agent-source|data-host-summary|次要摘要/);
    assert.match(normal, /data-agent-meta/);
  }
});

test('summary header consolidates missing sync metadata without inventing or changing sync status', () => {
  for (const state of ['unknown', 'local', 'synced', 'failed']) {
    for (const version of [undefined, '集合 v4']) for (const updatedAt of [undefined, '10:30']) {
      const html = htmlFor({ ...summaryProps, collection: { ...collection, version }, visual: { updatedAt }, sync: { state, description: '宿主同步说明' } });
      const header = html.match(/<header[\s\S]*?<\/header>/)[0];
      assert.doesNotMatch(header, /集合版本：未确认|最近更新：未提供/);
      assert.equal((header.match(/同步信息不完整/g) || []).length, !version || !updatedAt ? 1 : 0);
      if (version) assert.match(textOf(header), /集合版本：集合 v4/);
      if (updatedAt) assert.match(textOf(header), /最近更新：10:30/);
      if (!version && !updatedAt) assert.match(textOf(header), /同步信息不完整（集合版本、更新时间未提供）/);
      assert.ok(textOf(header).includes({ unknown: '状态未确认', local: '本页暂存', synced: '已同步', failed: '同步失败' }[state]));
      if (state === 'unknown' || state === 'failed') assert.match(html, /宿主同步说明/);
    }
  }
});

test('overview is workspace-only, follows header, precedes selection/list and ends with a separator', () => {
  const overview = h('p', { 'data-host-overview': '' }, '宿主统计 999');
  for (const itemPresentation of ['default', 'summary']) for (const density of ['default', 'compact']) {
    const extra = { itemPresentation, density, overview, onSelectionChange() {} };
    assert.doesNotMatch(htmlFor(extra), /data-host-overview|data-collection-overview/);
    const html = htmlFor({ ...extra, view: 'workspace' });
    const start = html.indexOf('data-collection-overview'), end = html.indexOf('已选择');
    assert.ok(start > html.indexOf('</header>'));
    assert.ok(start < end && end < html.indexOf('data-collection-item='));
    assert.match(html.slice(start, end), /宿主统计 999[\s\S]*data-slot="separator"/);
  }
});

test('overview replaces all header statistic fields/group counts while preserving status and identity', () => {
  for (const itemPresentation of ['default', 'summary']) for (const state of ['unknown', 'failed']) {
    const extra = { view: 'workspace', itemPresentation, overview: h('p', null, '统计由宿主提供'),
      collection: { ...collection, title: '试题篮', snapshot: '昨日' }, summary: { count: 9, unit: '题', fields: [{ label: '总分（含失效题）', value: 147 }, { label: '其他统计', value: 99 }] },
      sync: { state, description: '同步记录暂不可核对' } };
    const html = htmlFor(extra), header = textOf(html.match(/<header[\s\S]*?<\/header>/)[0]);
    assert.match(header, /试题篮 · 9题/);
    assert.match(header, /历史集合 · 昨日.*当时版本：集合 v4.*来源：现有题篮.*同步信息不完整/);
    assert.ok(header.includes(state === 'unknown' ? '状态未确认' : '同步失败'));
    assert.match(html, /同步记录暂不可核对/);
    assert.doesNotMatch(header, /总分|其他统计|基础：8|拓展：1|数量：/);
    for (const overview of [undefined, null, false, true]) {
      const fallback = htmlFor({ ...extra, overview });
      assert.doesNotMatch(fallback, /data-collection-overview/);
      assert.match(textOf(fallback), /总分（含失效题）：147.*其他统计：99.*基础：8/);
    }
    assert.match(textOf(htmlFor({ ...extra, view: 'inline' })), /总分（含失效题）：147/);
  }
});

test('question fixture provides passive count, total and score composition once in workspace', () => {
  const html = render(h(CollectionBasketExample, { purpose: 'questions', narrow: true }));
  assert.equal((html.match(/data-collection-overview/g) || []).length, 1);
  const overview = html.slice(html.indexOf('data-collection-overview'), html.indexOf('role="separator"', html.indexOf('data-collection-overview')));
  assert.match(textOf(overview), /已选题目3当前总分17/);
  for (const value of ['题型分值构成', '单选：5分', '多选：6分', '填空：6分']) assert.ok(overview.includes(value));
  assert.doesNotMatch(overview, /<button/);
  assert.doesNotMatch(render(h(CollectionBasketExample, { purpose: 'preparation', narrow: true })), /data-collection-overview/);
});


test('host selection toolbar opt-out preserves controlled row checkboxes and default toolbar behavior', () => {
  const extra = { view: 'workspace', itemPresentation: 'summary', selectedIds: ['q1'], onSelectionChange() {} };
  assert.match(htmlFor(extra), /已选择 1 项/);
  const hidden = htmlFor({ ...extra, selectionToolbar: false });
  assert.doesNotMatch(hidden, /已选择|全选可选条目|清除选择/);
  assert.equal((hidden.match(/role="checkbox"/g) ?? []).length, 2);
  assert.match(hidden, /aria-label="选择第 1 题 · 第一题"/);
  const changes = [];
  const nodes = capture({ ...extra, selectionToolbar: false, onSelectionChange: ids => changes.push(ids) });
  nodes.find(n => n.props['aria-label'] === '选择第 2 题 · 第二题').props.onCheckedChange(true);
  assert.deepEqual(changes, [['q1', 'q2']]);
  const historical = capture({ ...extra, selectionToolbar: false, collection: { ...collection, snapshot: '历史版本' }, onSelectionChange() { assert.fail('history cannot select'); } });
  const checkbox = historical.find(n => n.props['aria-label'] === '选择第 1 题 · 第一题');
  assert.equal(checkbox.props.disabled, true);
  checkbox.props.onCheckedChange(false);
});

test('headerActions stays beside title and compact status stays visible in existing facts line', () => {
  for (const mode of modes) for (const itemPresentation of ['default', 'summary']) {
    const action = h('button', { 'aria-label': '集合更多操作', onClick() {} }, '…');
    const nodes = capture({ ...mode, itemPresentation, headerActions: action });
    const row = nodes.find(node => node.type === 'div' && React.Children.toArray(node.props.children).some(child => child.type === 'h3'));
    assert.ok(row);
    assert.doesNotMatch(row.props.className, /flex-wrap/);
    assert.equal(descendants(row, node => node.props['data-collection-header-actions'] !== undefined).length, 1);
    const html = htmlFor({ ...mode, itemPresentation, headerActions: action });
    const header = html.match(/<header[\s\S]*?<\/header>/)[0];
    assert.equal((header.match(/aria-label="集合更多操作"/g) || []).length, 1);
    assert.equal((header.match(/data-agent-status=/g) || []).length, 1);
    assert.match(textOf(header), /状态未确认/);
    if (itemPresentation === 'summary') assert.ok(header.indexOf('data-agent-status=') > header.indexOf('data-collection-header-facts'));
  }
  assert.match(render(h(CollectionBasketExample, { purpose: 'questions', narrow: true })), /data-collection-header-actions/);
});
