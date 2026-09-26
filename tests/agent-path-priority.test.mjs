import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = new URL('../.sites-runtime/path-priority/', import.meta.url);
await mkdir(runtime, { recursive: true });
const file = new URL('test-bundle.mjs', runtime);
const bundle = await build({ stdin: { contents: `export * from './components/prism-next/agent-path-priority'; export * from './components/prism-next/demos/agent-path-priority';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false });
await writeFile(file, bundle.outputFiles[0].text);
const { AgentPathPriority, AgentPathPriorityDemo, PathPriorityExample, pathExamples, applyPathExample } = await import(file);
await rm(file);
const h = React.createElement;
const option = { id: 'opaque-option', label: '本轮跳过' };
const actions = { reorder: {}, 'set-priority': { options: [{ id: 'opaque-high', label: '优先处理' }, { id: 'opaque-low', label: '稍后处理' }] }, 'open-item': {}, 'accept-next': {}, skip: { options: [option] }, snooze: { options: [{ id: 'opaque-tomorrow', label: '明早八点', until: '2026-09-27 08:00（台北时间）' }] } };
const path = { id: 'opaque-path', title: '可读的补弱路径', version: { id: 'opaque-current', label: '安排二版' }, baseVersion: { id: 'opaque-base', label: '初始一版' } };
const item = (id, status = { state: 'not-started' }) => ({ id: `opaque-${id}`, title: `可读任务${id}`, type: '补弱活动', kind: 'suggestion', status, priority: { label: '优先处理', reason: '先核对作答。', evidence: '固定依据摘要。', certainty: null }, dependencies: [], actions });
const items = [item('a'), item('b'), item('c')];
const props = { path, items, nextItemIds: [items[0].id], blockerItemIds: [], save: { state: 'unsaved' }, onIntent() {} };
const context = { pathId: path.id, versionId: path.version.id, baseVersionId: path.baseVersion.id };
const modes = [{ view: 'inline' }, { view: 'workspace' }, { view: 'inline', density: 'compact' }, { view: 'workspace', density: 'compact' }];
const htmlFor = extra => render(h(AgentPathPriority, { ...props, ...extra }));
const count = (html, text) => html.split(text).length - 1;
function capture(extra = {}) {
  const nodes = [];
  function inspect(node) {
    if (Array.isArray(node)) return node.map(inspect);
    if (!React.isValidElement(node)) return node;
    if (node.type === AgentPathPriority) return h(function Probe() { return inspect(node.type(node.props)); });
    nodes.push(node);
    return React.cloneElement(node, {}, React.Children.map(node.props.children, inspect));
  }
  render(inspect(h(AgentPathPriority, { ...props, view: 'workspace', ...extra })));
  return nodes;
}
const controls = (nodes, type) => nodes.filter(node => node.props['data-path-action'] === type);
const choices = (nodes, type) => nodes.filter(node => node.props['data-path-choice'] === type);
const withText = (nodes, text) => nodes.find(node => node.props.onClick && React.Children.toArray(node.props.children).includes(text));
const event = () => ({ preventDefault() {}, stopPropagation() {}, dataTransfer: { values: [], setData(type, value) { this.values.push([type, value]); } } });
function freeze(value) { if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.freeze(value); Object.values(value).forEach(freeze); } return value; }

test('SSR two views, both densities and theme wrappers preserve supplied facts, one boundary and readable identity', () => {
  for (const theme of ['light', 'paper', 'dark']) for (const mode of modes) {
    const html = render(h('div', { 'data-ui-version': 'coss-v1', 'data-prism-theme': theme }, h(AgentPathPriority, { ...props, ...mode })));
    for (const value of [path.title, '安排二版', '初始一版', '未保存', '待开始', '建议', '先核对作答。', '固定依据摘要。', '确定性']) assert.ok(html.includes(value), value);
    assert.equal(count(html, path.title), 1);
    assert.equal(count(html, items[0].title), 1);
    assert.equal(count(html, '建议与待办分别记录；跳过或冷却不会取消已有工作，接受下一步仅提交请求。'), 1);
    assert.doesNotMatch(html, /opaque-|宿主|意图|回调|受控|条目 \d| ·  · |。；/);
    if (mode.view === 'inline') { assert.match(html, /下一步建议/); assert.doesNotMatch(html, /调整优先级|移到位置|可读任务b/); }
    else assert.ok(html.indexOf(items[0].title) < html.indexOf(items[1].title));
  }
});

test('Inline uses exact page-selected next order, retains every declared blocker once, and never fills from scores', () => {
  const html = htmlFor({ nextItemIds: [items[2].id, items[0].id], blockerItemIds: [items[0].id, items[1].id] });
  assert.ok(html.indexOf(items[2].title) < html.indexOf(items[0].title));
  for (const row of items) assert.equal(count(html, row.title), 1);
  assert.match(html, /下一步中的阻塞项已在上方标明/);
  const empty = htmlFor({ nextItemIds: [], blockerItemIds: [] });
  assert.match(empty, /暂无下一步建议/); assert.doesNotMatch(empty, /可读任务/);
  const unknown = htmlFor({ nextItemIds: null, blockerItemIds: null });
  assert.match(unknown, /未知：下一步建议、阻塞项/); assert.doesNotMatch(unknown, /无阻塞项|暂无下一步建议|可读任务/);
});

test('all eight lifecycle states and suggestion/todo identity survive Workspace; no date-driven expiry or discarded work', () => {
  const states = [{ state: 'not-started' }, { state: 'in-progress' }, { state: 'completed' }, { state: 'blocked', reason: '缺少订正记录。' }, { state: 'skipped' }, { state: 'snoozed', until: '2000-01-01 08:00' }, { state: 'expired' }, { state: 'unknown' }];
  const rows = states.map((status, index) => ({ ...item(String(index), status), kind: index % 2 ? 'todo' : 'suggestion', actions: {} }));
  for (const density of ['default', 'compact']) {
    const html = htmlFor({ view: 'workspace', density, items: rows, nextItemIds: [], blockerItemIds: [] });
    for (const label of ['待开始', '进行中', '已完成', '受阻', '已跳过', '冷却中', '已到期', '未知：状态', '缺少订正记录。', '冷却至：2000-01-01 08:00']) assert.ok(html.includes(label), label);
    for (const row of rows) assert.equal(count(html, row.title), 1);
    assert.equal(count(html, '>建议<'), 4); assert.equal(count(html, '>待办<'), 4);
  }
});

test('dependency names and met/unmet/unknown are external facts, including cycles and completed predecessors', () => {
  const rows = [{ ...items[0], status: { state: 'completed' }, dependencies: [{ id: items[1].id, title: '前置乙', state: 'unknown' }] },
    { ...items[1], dependencies: [{ id: items[0].id, title: '前置甲', state: 'unmet', resolve: {} }, { id: 'opaque-other', title: '人工核对', state: 'met' }] }];
  const html = htmlFor({ view: 'workspace', items: rows });
  assert.match(html, /前置乙 · 满足情况未知/); assert.match(html, /前置甲 · 未满足/); assert.match(html, /人工核对 · 已满足/);
  assert.ok(html.indexOf(items[0].title) < html.indexOf(items[1].title));
  assert.doesNotMatch(html, />受阻</); // An unmet dependency never manufactures a blocked state.
});

test('missing fields consolidate per object in one unknown line, with no guessed priority or cooling time', () => {
  const html = htmlFor({ path: { ...path, version: { ...path.version, label: '' }, baseVersion: { ...path.baseVersion, label: '' } }, save: { state: 'unknown' }, items: [{ ...items[0], type: '', status: { state: 'snoozed', until: null }, priority: { label: null, reason: null, evidence: null, certainty: '未知', score: null }, dependencies: null, actions: {} }] });
  assert.equal(count(html, 'data-path-unknown="path"'), 1); assert.equal(count(html, 'data-path-unknown="item"'), 1);
  assert.equal(count(html, '未知：'), 2);
  assert.match(html, /未知：类型、优先级、优先级理由、依据、确定性、依赖、优先级得分、冷却结束时间。/);
  assert.doesNotMatch(html, /无前置依赖|确定性：未知|冷却至：/);
  assert.match(htmlFor({ items: [{ ...items[0], priority: { ...items[0].priority, score: 0 } }] }), /得分：0/);
});

test('shared descriptions, evidence, blocked and disabled reasons appear once, with resolvable accessible references', () => {
  const reason = '先补齐原始作答。';
  const rows = items.map(row => ({ ...row, description: reason, priority: { ...row.priority, reason, evidence: reason }, status: { state: 'blocked', reason }, actions: { ...actions, reorder: { disabledReason: reason }, skip: { ...actions.skip, disabledReason: reason } } }));
  const html = htmlFor({ view: 'workspace', items: rows });
  assert.equal(count(html, reason), 1);
  assert.match(html, /适用顺序 1、2、3/);
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]));
  for (const match of html.matchAll(/aria-describedby="([^"]+)"/g)) for (const target of match[1].split(' ')) assert.ok(ids.has(target), target);
  for (const row of rows) assert.equal(count(html, row.title), 1);
});

test('up/down and specified position emit exact versions and final index, never mutating frozen input', () => {
  const frozen = freeze(structuredClone(items)), calls = [];
  const nodes = capture({ items: frozen, onIntent: intent => calls.push(intent) });
  withText(nodes, '下移').props.onClick();
  withText(nodes, '上移').props.onClick();
  choices(nodes, 'to-position')[0].props.onValueChange('2');
  choices(nodes, 'to-position')[0].props.onValueChange('bad');
  assert.deepEqual(calls, [
    { ...context, type: 'reorder', itemId: items[0].id, toIndex: 1, via: 'down' },
    { ...context, type: 'reorder', itemId: items[1].id, toIndex: 0, via: 'up' },
    { ...context, type: 'reorder', itemId: items[0].id, toIndex: 2, via: 'to-position' },
  ]);
  assert.deepEqual(frozen, items);
});

test('drag is instance-local and equivalent to final-position request; foreign/ended drags emit nothing', () => {
  const calls = [], nodes = capture({ onIntent: intent => calls.push(intent) });
  const handles = nodes.filter(node => node.props['data-path-drag']);
  const end = nodes.find(node => node.props.onDrop && node.type === 'div');
  end.props.onDrop(event()); assert.equal(calls.length, 0);
  const start = event(); handles[0].props.onDragStart(start);
  assert.deepEqual(start.dataTransfer.values, [['text/plain', 'path-item']]);
  end.props.onDrop(event());
  assert.deepEqual(calls, [{ ...context, type: 'reorder', itemId: items[0].id, toIndex: 2, via: 'drag' }]);
  end.props.onDrop(event()); assert.equal(calls.length, 1);
  handles[0].props.onDragStart(event()); handles[0].props.onDragEnd(); end.props.onDrop(event()); assert.equal(calls.length, 1);
  const other = capture({ onIntent: intent => calls.push(intent) });
  handles[0].props.onDragStart(event()); other.find(node => node.props.onDrop && node.type === 'div').props.onDrop(event()); assert.equal(calls.length, 1);
});

test('priority, skip, snooze, restore, open and accept-next preserve option and version identities without state changes', () => {
  const calls = [], row = freeze(structuredClone(items[0]));
  const nodes = capture({ items: [row], onIntent: intent => calls.push(intent) });
  for (const type of ['set-priority', 'skip', 'snooze']) choices(nodes, type)[0].props.onValueChange('0');
  controls(nodes, 'open-item')[0].props.onClick(); controls(nodes, 'accept-next')[0].props.onClick();
  const restored = capture({ items: [{ ...row, status: { state: 'skipped' }, actions: { restore: {} } }], onIntent: intent => calls.push(intent) });
  controls(restored, 'restore')[0].props.onClick();
  assert.deepEqual(calls, [
    { ...context, type: 'set-priority', itemId: row.id, optionId: 'opaque-high' },
    { ...context, type: 'skip', itemId: row.id, optionId: option.id },
    { ...context, type: 'snooze', itemId: row.id, optionId: 'opaque-tomorrow', until: '2026-09-27 08:00（台北时间）' },
    { ...context, type: 'open-item', itemId: row.id }, { ...context, type: 'accept-next', itemId: row.id }, { ...context, type: 'restore', itemId: row.id },
  ]);
  assert.equal(row.status.state, 'not-started'); assert.equal(row.priority.label, '优先处理');
});

test('dependency resolution requires explicit capability and an unmet fact, and remains only a request', () => {
  const calls = [];
  const dependencies = [{ id: 'opaque-dep', title: '订正核对', state: 'unmet', resolve: {} }];
  const nodes = capture({ items: [{ ...items[0], dependencies }], onIntent: intent => calls.push(intent) });
  controls(nodes, 'mark-dependency-resolved')[0].props.onClick();
  assert.deepEqual(calls, [{ ...context, type: 'mark-dependency-resolved', itemId: items[0].id, dependencyId: dependencies[0].id }]);
  assert.equal(dependencies[0].state, 'unmet');
  for (const dep of [{ ...dependencies[0], state: 'met' }, { ...dependencies[0], state: 'unknown' }, { ...dependencies[0], resolve: { disabledReason: '' } }]) {
    controls(capture({ items: [{ ...items[0], dependencies: [dep] }], onIntent: intent => calls.push(intent) }), 'mark-dependency-resolved')[0].props.onClick();
  }
  assert.equal(calls.length, 1);
  assert.equal(controls(capture({ items: [{ ...items[0], dependencies: [{ ...dependencies[0], resolve: undefined }] }] }), 'mark-dependency-resolved').length, 0);
});

test('history, empty readonly reasons, locks and unresolved saves guard handlers but allow explicitly provided navigation', () => {
  for (const extra of [{ readOnlyReason: '' }, { path: { ...path, snapshot: '' } }, ...['saving', 'conflict', 'unconfirmed'].map(state => ({ save: { state } }))]) {
    const calls = [], nodes = capture({ ...extra, onIntent: intent => calls.push(intent) });
    controls(nodes, 'reorder').forEach(node => node.props.onClick());
    controls(nodes, 'accept-next').forEach(node => node.props.onClick());
    for (const type of ['set-priority', 'skip', 'snooze', 'to-position']) choices(nodes, type).forEach(node => node.props.onValueChange('1'));
    assert.deepEqual(calls, []);
    controls(nodes, 'open-item')[0].props.onClick(); assert.equal(calls[0].type, 'open-item');
  }
  const calls = [], nodes = capture({ items: [items[0], { ...items[1], lockedReason: '此位置须保留。' }, items[2]], onIntent: intent => calls.push(intent) });
  choices(nodes, 'to-position')[0].props.onValueChange('2'); withText(nodes, '下移').props.onClick();
  assert.deepEqual(calls, []);
});

test('unknown/duplicate identity, malformed selections/options, missing receiver and disabled options fail closed', () => {
  for (const extra of [{ path: { ...path, baseVersion: undefined } }, { path: { ...path, id: '' } }, { items: [items[0], items[0]] }, { items: [{ ...items[0], dependencies: [{ id: '', title: '前置', state: 'unmet', resolve: {} }] }] }]) {
    const calls = [], nodes = capture({ ...extra, onIntent: intent => calls.push(intent) });
    nodes.filter(node => node.props['data-path-action']).forEach(node => node.props.onClick());
    nodes.filter(node => node.props['data-path-choice']).forEach(node => node.props.onValueChange('0'));
    assert.deepEqual(calls, []);
  }
  for (const selection of [[items[0].id, items[0].id], ['opaque-absent'], [...items.map(row => row.id), items[0].id]]) assert.match(htmlFor({ nextItemIds: selection }), /范围待核对/);
  const calls = [], row = { ...items[0], actions: { 'set-priority': { options: [{ id: 'opaque-x', label: '禁用', disabledReason: '' }] }, skip: { options: [option, option] }, snooze: { options: [] } } };
  const nodes = capture({ items: [row], onIntent: intent => calls.push(intent) });
  for (const type of ['set-priority', 'skip', 'snooze']) choices(nodes, type)[0].props.onValueChange('0');
  assert.deepEqual(calls, []);
  assert.match(htmlFor({ onIntent: undefined }), /当前仅可查看路径/);
  assert.equal(controls(capture({ items: [{ ...items[0], actions: undefined }] }), 'open-item').length, 0);
});

test('completed/expired/skipped/cooling/unknown recommendations and real todos cannot be accepted as next suggestions', () => {
  for (const status of [{ state: 'completed' }, { state: 'expired' }, { state: 'skipped' }, { state: 'snoozed', until: null }, { state: 'unknown' }, { state: 'blocked', reason: '待核对。' }]) {
    const calls = [], nodes = capture({ items: [{ ...items[0], status }], onIntent: intent => calls.push(intent) });
    controls(nodes, 'accept-next')[0].props.onClick(); assert.deepEqual(calls, []);
  }
  const calls = [], nodes = capture({ items: [{ ...items[0], kind: 'todo' }], onIntent: intent => calls.push(intent) });
  controls(nodes, 'accept-next')[0].props.onClick(); assert.deepEqual(calls, []);
});

test('expand/back remain pure navigation with original trigger; compact preserves important content and labels', () => {
  const calls = [], trigger = {}, next = capture({ view: 'inline', density: 'compact', onIntent: intent => calls.push(intent), onExpand: value => calls.push(value) });
  withText(next, '展开完整路径').props.onClick({ currentTarget: trigger }); assert.deepEqual(calls, [trigger]);
  withText(capture({ onBack: () => calls.push('back') }), '返回原位置').props.onClick(); assert.deepEqual(calls, [trigger, 'back']);
  const html = htmlFor({ view: 'workspace', density: 'compact' });
  assert.match(html, /gap-3 p-3/); assert.match(html, /space-y-4/);
  for (const label of ['移到位置', '调整优先级', '跳过选项', '冷却至']) assert.ok(html.includes(label));
  assert.match(htmlFor({ details: h('p', {}, '补充说明正文') }), /data-slot="collapsible/);
});

test('student/teacher examples cover narrow containers, formula, lifecycle mix and shared controlled views', () => {
  for (const purpose of ['student', 'teacher']) {
    const html = render(h(PathPriorityExample, { purpose, narrow: true }));
    assert.match(html, /max-w-\[320px\]/); assert.match(html, /<math/);
    assert.equal(count(html, 'data-agent-path-view='), 3);
    assert.match(html, /固定示例/); assert.match(html, /独立保存记录示例/);
  }
  assert.match(render(h(AgentPathPriorityDemo)), /id="path-priority"/);
  const current = pathExamples.teacher, ctx = { pathId: current.path.id, versionId: current.path.version.id, baseVersionId: current.path.baseVersion.id };
  const moved = applyPathExample(current, { ...ctx, type: 'reorder', itemId: current.items[0].id, toIndex: 1, via: 'down' });
  assert.equal(moved.items[1].id, current.items[0].id); assert.deepEqual(moved.nextItemIds, current.nextItemIds);
  assert.equal(applyPathExample(moved, { ...ctx, type: 'reorder', itemId: current.items[0].id, toIndex: 0, via: 'up' }), moved);
  for (const type of ['skip', 'snooze', 'restore', 'accept-next', 'mark-dependency-resolved', 'open-item']) assert.equal(applyPathExample(current, { ...ctx, type, itemId: current.items[0].id }), current);
});

test('component owns no clock, persistence, path calculation or business model; original display primitives stay unchanged', async () => {
  const source = await readFile(new URL('../components/prism-next/agent-path-priority.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /localStorage|setTimeout|setInterval|Date\.now|new Date|\.sort\(|useState|Workspace.*from|fetch\(|text-xs|text-sm/);
  assert.match(source, /active\.revision !== revision \|\| active\.items !== items/);
  assert.match(source, /aria-describedby/);
});
