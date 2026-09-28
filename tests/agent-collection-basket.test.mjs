import test from 'node:test';
import assert from 'node:assert/strict';
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
    if (purpose === 'questions') { assert.match(html, /data-question-id=/); assert.match(html, /<mfrac>/); assert.match(html, /总分（含失效题）/); }
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
