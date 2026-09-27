import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = new URL('../.sites-runtime/relation-graph/', import.meta.url);
await mkdir(runtime, { recursive: true });
async function bundle(name, contents) {
  const file = new URL(name, runtime);
  await writeFile(file, (await build({ stdin: { contents, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, write: false })).outputFiles[0].text);
  const module = await import(file); await rm(file); return module;
}
const { AgentRelationGraph, relationProjection, relationPositions, AgentRelationGraphDemo, RelationGraphExample, coverageNodes, coverageEdges, relationCapabilities } = await bundle('test-bundle.mjs', `export * from './components/prism-next/agent-relation-graph'; export * from './components/prism-next/demos/agent-relation-graph';`);
const h = React.createElement;
const context = { graphId: 'opaque-graph', version: 'opaque-version' };
const base = { ...context, title: '关系测试', versionLabel: '资料第一版', nodes: coverageNodes, edges: coverageEdges, capabilities: relationCapabilities,
  summary: { statusCounts: [{ label: '未覆盖', count: 2 }, { label: '薄弱', count: 1 }], gaps: ['未覆盖知识点 2 个'] }, onIntent() {} };
const layouts = [{}, { view: 'workspace' }, { density: 'compact' }, { view: 'workspace', density: 'compact' }];
const htmlFor = props => render(h(AgentRelationGraph, { ...base, ...props }));
const textOf = node => typeof node === 'string' ? node : Array.isArray(node) ? node.map(textOf).join('') : React.isValidElement(node) ? textOf(node.props.children) : '';
function capture(props = {}, Component = AgentRelationGraph, defaults = base) {
  const nodes = [];
  function inspect(node) {
    if (Array.isArray(node)) return node.map(inspect);
    if (!React.isValidElement(node)) return node;
    if (node.type === Component) return h(function Probe() { return inspect(Component(node.props)); });
    nodes.push(node);
    return React.cloneElement(node, {}, React.Children.map(node.props.children, inspect));
  }
  return { html: render(inspect(h(Component, { ...defaults, ...props }))), nodes };
}
const button = (nodes, label) => nodes.find(node => node.props.onClick && textOf(node) === label);
const click = (nodes, label) => { const item = button(nodes, label); assert.ok(item, label); item.props.onClick({ currentTarget: {} }); return item; };

test('SSR inline/workspace and independent compact keep external summary and version, no internal IDs', () => {
  for (const layout of layouts) {
    const html = htmlFor(layout);
    for (const text of ['16 个节点', '14 条关系', '未覆盖知识点 2 个', '薄弱 1', '资料第一版']) assert.ok(html.includes(text), text);
    assert.match(html, new RegExp(`data-density="${layout.density ?? 'default'}"`));
    assert.equal(html.includes('选择节点可查看'), layout.view === 'workspace');
    assert.doesNotMatch(html, /opaque-|knowledge-\d|question-\d|宿主|回调|意图|AST/);
  }
});
test('complete equivalent node and edge list includes types, status, groups, levels, direction, weights and descriptions', () => {
  for (const layout of layouts) {
    const html = htmlFor(layout);
    assert.match(html, /aria-label="节点与关系列表"/);
    for (const node of coverageNodes) assert.ok(html.includes(node.label), node.label);
    for (const edge of coverageEdges) {
      const from = coverageNodes.find(node => node.id === edge.from), to = coverageNodes.find(node => node.id === edge.to);
      assert.ok(html.includes(`${from.label} → ${to.label} · ${edge.type}`));
    }
    assert.match(html, /权重 1 · 模拟关联/); assert.match(html, /层级 1/); assert.match(html, /示例标记/);
  }
  const inline = htmlFor({ onExpand() {} }); assert.match(inline, /<details><summary[^>]*>查看节点与关系列表/);
});
test('filter is controlled, induces same node/edge subset and does not rewrite overall counts or host status', () => {
  const calls = [], { nodes, html } = capture({ view: 'workspace', onIntent: value => calls.push(value) });
  click(nodes, '知识点'); click(nodes, '未覆盖');
  assert.deepEqual(calls, [{ ...context, type: 'filter', filter: { type: '知识点' } }, { ...context, type: 'filter', filter: { status: '未覆盖' } }]);
  assert.ok(html.includes('第 8 题'));
  const projection = relationProjection(coverageNodes, coverageEdges, { status: '未覆盖' });
  assert.equal(projection.nodes.length, 2); assert.equal(projection.edges.length, 0);
  const filtered = htmlFor({ view: 'workspace', filter: { status: '未覆盖' } });
  assert.match(filtered, /节点（2）/); assert.match(filtered, /关系（0）/); assert.match(filtered, /16 个节点/); assert.doesNotMatch(filtered, /第 8 题/);
  assert.match(htmlFor({ filter: { type: '不存在' } }), /没有符合条件/);
});
test('selection and adjacency include incoming/outgoing links across filter, never fall back to first node', () => {
  const calls = [], { nodes } = capture({ view: 'workspace', onIntent: value => calls.push(value) });
  click(nodes, '顶点与对称轴'); assert.deepEqual(calls, [{ ...context, type: 'select-node', nodeId: 'knowledge-0' }]);
  const html = htmlFor({ view: 'workspace', selectedNodeId: 'knowledge-0', filter: { type: '知识点' } });
  assert.match(html, /已选：顶点与对称轴/); assert.match(html, /包含筛选范围外/); assert.match(html, /二次函数 → 顶点与对称轴/); assert.match(html, /顶点与对称轴 → 第 5 题/);
  assert.match(htmlFor({ view: 'workspace', selectedNodeId: 'gone' }), /所选节点不在当前范围/);
});
test('node create/update/delete, edge create/delete, open source and layout requests carry exact graph/version; inputs remain unchanged', () => {
  const calls = [], props = { view: 'workspace', selectedNodeId: 'knowledge-0', onIntent: value => calls.push(value) };
  const before = htmlFor(props), { nodes } = capture(props);
  click(nodes, '新增节点');
  nodes.find(node => node.props.id?.endsWith('-label')).props.onChange({ target: { value: '  新名称  ' } });
  click(nodes, '删除节点'); click(nodes, '删除关系'); click(nodes, '查看来源'); click(nodes, '切换布局');
  const form = nodes.find(node => typeof node.props.onCreate === 'function');
  form.props.onCreate('question-2', '考查');
  form.props.onCreate('missing', '考查'); form.props.onCreate('question-2', ' ');
  assert.deepEqual(calls, [
    { ...context, type: 'node-create' }, { ...context, type: 'node-update', nodeId: 'knowledge-0', label: '  新名称  ' },
    { ...context, type: 'node-delete', nodeId: 'knowledge-0' }, { ...context, type: 'edge-delete', edgeId: 'chapter-edge-0' },
    { ...context, type: 'open-source', nodeId: 'knowledge-0', source: coverageNodes[0].source }, { ...context, type: 'request-layout', layout: 'layered' },
    { ...context, type: 'edge-create', from: 'knowledge-0', to: 'question-2', relationType: '考查' },
  ]);
  assert.equal(htmlFor(props), before);
});
test('unsupported abilities and missing identity/callback protect direct handlers; read-only still permits select/filter/source', () => {
  for (const extra of [{ graphId: '' }, { version: ' ' }, { onIntent: undefined }, { capabilities: Object.fromEntries(Object.keys(relationCapabilities).map(key => [key, { supported: key === 'view', reason: key === 'view' ? undefined : '共同限制。' }])) }]) {
    const { nodes } = capture({ view: 'workspace', selectedNodeId: 'knowledge-0', onIntent() { assert.fail('blocked'); }, ...extra });
    for (const label of ['新增节点', '删除节点', '删除关系', '切换布局', '未覆盖']) {
      if (extra.capabilities && ['新增节点', '删除节点', '删除关系'].includes(label)) assert.equal(button(nodes, label), undefined);
      else assert.equal(click(nodes, label).props.disabled, true);
    }
  }
  const calls = [], { nodes } = capture({ view: 'workspace', selectedNodeId: 'knowledge-0', readOnlyReason: '', onIntent: value => calls.push(value) });
  for (const label of ['新增节点', '删除节点', '删除关系', '切换布局']) assert.equal(click(nodes, label).props.disabled, true);
  nodes.find(node => node.props.onCreate).props.onCreate('question-0', '考查');
  click(nodes, '查看来源'); click(nodes, '未覆盖'); assert.deepEqual(calls.map(item => item.type), ['open-source', 'filter']);
});
test('unsupported view mounts no data, details, summary, SVG or expand; invalid identities and dangling edges fail closed', () => {
  const html = htmlFor({ capabilities: { ...relationCapabilities, view: { supported: false, reason: '暂不能查看。' } }, details: 'PRIVATE', onExpand() {} });
  assert.match(html, /暂不能查看/); assert.doesNotMatch(html, /16 个节点|未覆盖知识点|第 1 题|<svg|PRIVATE|查看关系图/);
  for (const extra of [{ nodes: [...coverageNodes, coverageNodes[0]] }, { nodes: [{ ...coverageNodes[0], id: '' }] }, { edges: [{ id: 'bad', from: 'missing', to: 'knowledge-0', type: '考查' }] }, { edges: [{ ...coverageEdges[0], weight: NaN }] }]) {
    const value = htmlFor(extra); assert.match(value, /关系资料不完整或重复/); assert.doesNotMatch(value, /<svg|节点与关系列表/);
  }
});
test('large graph defaults to list, cannot force SVG by filtering, and boundary threshold is strict greater than', () => {
  for (const layout of layouts) {
    const html = htmlFor({ ...layout, graphThreshold: 10 }); assert.match(html, /节点超过图示上限（10）/); assert.doesNotMatch(html, /<svg/); assert.match(html, /节点与关系列表/);
  }
  assert.doesNotMatch(htmlFor({ graphThreshold: 10, filter: { status: '未覆盖' } }), /<svg/);
  assert.match(htmlFor({ graphThreshold: 16 }), /<svg/);
  assert.match(htmlFor({ graphThreshold: NaN }), /<svg/);
  const { nodes } = capture({ view: 'workspace', graphThreshold: 10 }); assert.equal(click(nodes, '图与列表').props.disabled, true);
});
test('one standing notice, collapsed details, merged identical limitations, compact keeps all gaps', () => {
  for (const layout of layouts) {
    const html = htmlFor({ ...layout, details: 'HIDDEN_DETAIL', capabilities: { ...relationCapabilities, 'edit-node': { supported: false, reason: '共同限制。' }, 'edit-edge': { supported: false, reason: '共同限制。' } } });
    assert.equal(html.split('共同限制。').length - 1, 1); assert.equal(html.split('关系与覆盖状态仅反映').length - 1, 1);
    assert.doesNotMatch(html, /HIDDEN_DETAIL/); assert.match(html, /未覆盖知识点 2 个/);
  }
  assert.match(htmlFor({ summary: undefined, versionLabel: undefined }), /版本未知/);
  assert.match(htmlFor({ summary: undefined }), /按状态计数：未知/);
});
test('navigation retains graph/version and trigger; ARIA references resolve', () => {
  const calls = [], trigger = {};
  const inline = capture({ onExpand: (...args) => calls.push(args) }); button(inline.nodes, '查看关系图').props.onClick({ currentTarget: trigger });
  click(capture({ view: 'workspace', onBack: value => calls.push(value) }).nodes, '返回原位置');
  assert.deepEqual(calls, [[trigger, context], context]);
  for (const layout of layouts) {
    const { nodes, html } = capture({ ...layout, selectedNodeId: 'knowledge-0' });
    for (const node of nodes) for (const attr of ['aria-describedby', 'aria-labelledby']) for (const id of (node.props[attr] ?? '').split(' ').filter(Boolean)) assert.ok(html.includes(`id="${id}"`), id);
  }
});
test('deterministic grid and layered positions preserve supplied order and do not mutate input; loops supported', () => {
  const before = JSON.stringify(coverageNodes);
  assert.deepEqual(relationPositions(coverageNodes, 'grid'), relationPositions(coverageNodes, 'grid'));
  const positions = relationPositions(coverageNodes, 'layered'); assert.equal(positions[0].x, positions[1].x); assert.notEqual(positions[0].x, positions[6].x);
  assert.equal(JSON.stringify(coverageNodes), before);
  assert.match(htmlFor({ nodes: [coverageNodes[0]], edges: [{ id: 'loop', from: 'knowledge-0', to: 'knowledge-0', type: '复习' }] }), /复习/);
});
test('demo provides 6/8/2 simulation, unsupported concept, threshold fixture and 320px compact', () => {
  const html = render(h(AgentRelationGraphDemo));
  for (const term of ['id="relation-graph"', '6 个知识点、8 道题、2 个章节', '概念推演（模拟）', '此概念图仅供阅读', '节点超过图示上限（10）']) assert.ok(html.includes(term), term);
  assert.match(render(h(RelationGraphExample, { kind: 'large', narrow: true })), /max-w-\[320px\]/);
});

// Isolate only local presentation/form hooks to exercise re-rendered event paths without a DOM/service.
// The SSR tests above use the unmodified production module and real React hooks.
const source = (await readFile(new URL('../components/prism-next/agent-relation-graph.tsx', import.meta.url), 'utf8'))
  .replace('useId, useRef, useState,', 'useId, useRef,')
  .replace('"./button"', '"@/components/prism-next/button"').replace('"./agent-record-parts"', '"@/components/prism-next/agent-record-parts"');
const harness = await bundle('interaction-bundle.mjs', `${source}
let slots = [], cursor = 0;
function useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], next => { slots[i] = typeof next === 'function' ? next(slots[i]) : next; }]; }
export function resetHarness() { slots = []; cursor = 0; }
export function rerenderHarness() { cursor = 0; }
export { RelationCanvas, RelationEdgeForm };
`);
test('edge form keeps fixed label, explicit endpoint and original relation text; disabled handlers cannot request', () => {
  harness.resetHarness(); const calls = [], props = { nodes: coverageNodes, from: coverageNodes[0], disabled: false, onCreate: (...args) => calls.push(args) };
  let form = capture(props, harness.RelationEdgeForm, {});
  assert.equal(click(form.nodes, '新增关系').props.disabled, true);
  click(form.nodes, '第 3 题'); form.nodes.find(node => node.props.id?.endsWith('-relation')).props.onChange({ target: { value: '  考查  ' } });
  harness.rerenderHarness(); form = capture(props, harness.RelationEdgeForm, {}); click(form.nodes, '新增关系');
  assert.deepEqual(calls, [['question-2', '  考查  ']]);
  harness.rerenderHarness(); form = capture({ ...props, disabled: true }, harness.RelationEdgeForm, {}); click(form.nodes, '新增关系'); assert.equal(calls.length, 1);
});
test('canvas keyboard pan/zoom equals buttons; Home resets; thumbnail static and node click emits selection', () => {
  const calls = [], props = { nodes: coverageNodes, edges: coverageEdges, layout: 'grid', onSelect: value => calls.push(value) };
  harness.resetHarness(); let canvas = capture(props, harness.RelationCanvas, {});
  click(canvas.nodes, '放大'); click(canvas.nodes, '右移');
  harness.rerenderHarness(); canvas = capture(props, harness.RelationCanvas, {}); const byButtons = canvas.html;
  harness.resetHarness(); canvas = capture(props, harness.RelationCanvas, {});
  let svg = canvas.nodes.find(node => node.type === 'svg'); const event = key => ({ key, target: 1, currentTarget: 1, preventDefault() {} });
  svg.props.onKeyDown(event('+')); svg.props.onKeyDown(event('ArrowRight'));
  harness.rerenderHarness(); canvas = capture(props, harness.RelationCanvas, {});
  assert.equal(canvas.html, byButtons); assert.match(canvas.html, /translate\(40 0\) scale\(1.25\)/);
  svg = canvas.nodes.find(node => node.type === 'svg'); svg.props.onKeyDown(event('Home'));
  harness.rerenderHarness(); canvas = capture(props, harness.RelationCanvas, {}); assert.match(canvas.html, /translate\(0 0\) scale\(1\)/);
  canvas.nodes.find(node => node.type === 'g' && node.props.onClick).props.onClick(); assert.deepEqual(calls, ['knowledge-0']);
  harness.resetHarness(); canvas = capture({ ...props, thumbnail: true }, harness.RelationCanvas, {}); assert.equal(button(canvas.nodes, '放大'), undefined);
});

test('node and edge unsupported controls are omitted independently, common reason once', () => {
  for (const nodeSupport of [false, true]) for (const edgeSupport of [false, true]) {
    const capabilities = { ...relationCapabilities, 'edit-node': { supported: nodeSupport, reason: nodeSupport ? undefined : '仅供阅读。' }, 'edit-edge': { supported: edgeSupport, reason: edgeSupport ? undefined : '仅供阅读。' } };
    const { html, nodes } = capture({ view: 'workspace', selectedNodeId: 'knowledge-0', capabilities });
    assert.equal(!!button(nodes, '新增节点'), nodeSupport);
    assert.equal(!!button(nodes, '删除节点'), nodeSupport);
    assert.equal(nodes.some(node => node.props.id?.endsWith('-label')), nodeSupport);
    assert.equal(!!button(nodes, '删除关系'), edgeSupport);
    assert.equal(nodes.some(node => node.props.onCreate), edgeSupport);
    assert.equal(html.split('仅供阅读。').length - 1, nodeSupport && edgeSupport ? 0 : 1);
    assert.ok(button(nodes, '查看来源'));
  }
});

// ResizeObserver + local hook lifecycle fixture; no browser layout is claimed.
const responsive = await bundle('responsive-bundle.mjs', `${source.replace('useEffect, useId, useRef,', 'useId,')}
let slots = [], cursor = 0, effects = [], cleanups = [], observers = [];
function useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], next => { slots[i] = typeof next === 'function' ? next(slots[i]) : next; }]; }
function useRef(initial) { const [ref] = useState({ current: initial }); return ref; }
function useEffect(effect) { const [registered, register] = useState(false); if (!registered) { effects.push(effect); register(true); } }
class ResizeObserver {
  constructor(callback) { this.callback = callback; observers.push(this); }
  observe(target) { this.target = target; }
  disconnect() { this.target = null; }
}
export function reset() { slots = []; cursor = 0; effects = []; cleanups = []; observers = []; }
export function rerender() { cursor = 0; }
export function mount() { cleanups = effects.map(effect => effect()); effects = []; }
export function resize(width) { for (const observer of observers) if (observer.target) observer.callback([{ target: observer.target, contentRect: { width } }]); }
export function unmount() { cleanups.forEach(cleanup => cleanup?.()); return observers.every(observer => observer.target === null); }
export { RelationCanvas };
`);
function responsiveFixture(props) {
  responsive.reset();
  let result = capture(props, responsive.AgentRelationGraph);
  result.nodes.find(node => node.props['data-agent-relation-view']).props.ref.current = {};
  responsive.mount();
  return width => {
    if (width !== undefined) responsive.resize(width);
    responsive.rerender();
    return capture(props, responsive.AgentRelationGraph);
  };
}
test('262px content defaults to complete list in both views; graph opt-in and return have one notice and preserve intent payloads', () => {
  for (const view of ['inline', 'workspace']) {
    const calls = [], next = responsiveFixture({ view, onExpand() {}, onIntent: value => calls.push(value) });
    let result = next(262);
    assert.doesNotMatch(result.html, /<svg|<summary[^>]*>查看节点与关系列表/);
    assert.match(result.html, /节点与关系列表/);
    assert.equal(result.html.split('当前区域较窄').length - 1, 1);
    assert.equal(result.html.split('仍查看关系图').length - 1, 1);
    assert.equal(button(result.nodes, '仅列表').props['aria-pressed'], true);
    click(result.nodes, '顶点与对称轴');
    assert.deepEqual(calls, [{ ...context, type: 'select-node', nodeId: 'knowledge-0' }]);
    click(result.nodes, '仍查看关系图'); result = next();
    assert.match(result.html, /<svg/); assert.match(result.html, /可滚动关系图/);
    assert.equal(result.html.split('当前区域较窄').length - 1, 1);
    click(result.nodes, '仅列表'); assert.doesNotMatch(next().html, /<svg/);
    assert.equal(responsive.unmount(), true);
  }
});
test('wide defaults to graph; content resize and threshold prop use strict boundary; large graph cannot opt in', () => {
  for (const minGraphWidth of [undefined, NaN, 0, -1, 600]) {
    const next = responsiveFixture({ view: 'workspace', minGraphWidth });
    const boundary = minGraphWidth === 600 ? 600 : 480;
    assert.match(next(boundary).html, /<svg/);
    assert.doesNotMatch(next(boundary - 1).html, /<svg/);
    assert.match(next(1000).html, /<svg/);
    responsive.unmount();
  }
  const next = responsiveFixture({ view: 'workspace', graphThreshold: 10 });
  assert.doesNotMatch(next(262).html, /<svg|仍查看关系图|当前区域较窄/);
  responsive.unmount();
});
test('readable canvas keeps viewBox dimensions at 1:1 and clamps both button and keyboard zoom to 100%', () => {
  harness.resetHarness();
  const props = { nodes: coverageNodes, edges: coverageEdges, layout: 'grid', readable: true };
  let result = capture(props, harness.RelationCanvas, {});
  const svg = result.nodes.find(node => node.type === 'svg');
  const [, , width, height] = svg.props.viewBox.split(' ').map(Number);
  assert.deepEqual(svg.props.style, { width, minWidth: width, height });
  assert.ok(width > 262); assert.match(result.html, /overflow-auto/);
  click(result.nodes, '缩小');
  svg.props.onKeyDown({ key: '-', target: 1, currentTarget: 1, preventDefault() {} });
  harness.rerenderHarness(); result = capture(props, harness.RelationCanvas, {});
  assert.match(result.html, /scale\(1\)/);
  assert.match(result.html, /class="text-ui-body"/);
});
