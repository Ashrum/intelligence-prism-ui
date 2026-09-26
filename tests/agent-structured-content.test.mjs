import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = new URL('../.sites-runtime/structured-content/', import.meta.url);
await mkdir(runtime, { recursive: true });
const bundleFile = new URL('test-bundle.mjs', runtime);
const bundle = await build({ stdin: { contents: `export * from './components/prism-next/agent-structured-content'; export * from './lib/prism-next/agent-structured-content'; export * from './components/prism-next/demos/agent-structured-content';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false });
await writeFile(bundleFile, bundle.outputFiles[0].text);
const { AgentStructuredContent, indexStructure, structureMoveBlock, structureMoveTarget, applyStructureExample, StructuredContentExample, structuredContentExamples, AgentStructuredContentDemo } = await import(bundleFile);
await rm(bundleFile);
const h = React.createElement;
const supported = { status: 'supported' };
const limited = { status: 'limited', reason: '仅可调整提供的教学活动。' };
const unsupported = { status: 'unsupported', reason: '教材出版版次固定，不能修改。' };
const capabilities = Object.fromEntries(['view', 'rename', 'add', 'delete', 'move', 'nest'].map(kind => [kind, supported]));
const node = (id, level = 1, children = []) => ({ id: `opaque-${id}-bc691bddb60a44`, title: `标题 ${id}`, type: '章节', level, status: { state: 'normal' }, children });
const deep = node('deep', 3);
const a = node('a'), b1 = node('b1', 2), b2 = node('b2', 2, [deep]), b3 = node('b3', 2), b = node('b', 1, [b1, b2, b3]), c = node('c');
const props = {
  structure: { id: 'opaque-structure-90828899', title: '教学内容结构', version: { id: 'opaque-version-a3', label: '草稿 v2' }, baseVersion: { id: 'opaque-base-d6', label: '基准 v1' } },
  nodes: [a, b, c], capabilities, selectedNodeId: b2.id,
};
const modes = [{ view: 'inline' }, { view: 'workspace' }, { view: 'inline', density: 'compact' }, { view: 'workspace', density: 'compact' }];
const htmlFor = extra => render(h(AgentStructuredContent, { ...props, ...extra }));
const context = { structureId: props.structure.id, versionId: props.structure.version.id, baseVersionId: props.structure.baseVersion.id };
function capture(extra = {}) {
  const nodes = [], owned = new Set(['AgentStructuredContent', 'StructureTree']);
  function inspect(node) {
    if (Array.isArray(node)) return node.map(inspect);
    if (!React.isValidElement(node)) return node;
    if (typeof node.type === 'function' && owned.has(node.type.name)) return h(function Probe() { return inspect(node.type(node.props)); });
    nodes.push(node);
    return React.cloneElement(node, {}, React.Children.map(node.props.children, inspect));
  }
  render(inspect(h(AgentStructuredContent, { ...props, view: 'workspace', ...extra })));
  return nodes;
}
const action = (nodes, name) => nodes.find(item => item.props['data-structure-action'] === name);
const treeOf = nodes => nodes.find(item => item.type.name === 'Tree')?.props.tree;
const inputOf = nodes => nodes.find(item => item.type.name === 'Input');
function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.freeze(value); Object.values(value).forEach(freeze); }
  return value;
}

test('inline is a two-level summary with complete node count and host-only changes/save facts', () => {
  const html = htmlFor({ changes: { baseVersion: props.structure.baseVersion, summary: ['新增 2 节、移动 1 节'] } });
  for (const text of ['data-agent-structured-view="inline"', '当前状态', '草稿 v2', '基准 v1', '前两层', '7 个节点', '3 层', a.title, b1.title, '新增 2 节、移动 1 节', '状态未确认']) assert.ok(html.includes(text), text);
  assert.doesNotMatch(html, /标题 deep|<input|编辑结构|已保存草稿|opaque-/);
  assert.match(htmlFor(), /变更情况未确认/);
  assert.match(htmlFor({ changes: { baseVersion: props.structure.baseVersion, summary: [] } }), /未记录结构变化/);
});

test('workspace uses Tree and preserves complete topology, levels and externally selected node', () => {
  const extra = { expandedIds: [b.id, b2.id], onExpandedChange() {} };
  const html = htmlFor({ ...extra, view: 'workspace' });
  assert.match(html, /role="tree"/); assert.match(html, /aria-level="3"/); assert.match(html, /标题 deep/);
  const items = treeOf(capture(extra)).getItems();
  assert.deepEqual(items.map(item => item.getId()), [a.id, b.id, b1.id, b2.id, deep.id, b3.id, c.id]);
  const selected = capture(extra).filter(item => item.type.name === 'TreeItem' && item.props.current);
  assert.equal(selected.length, 1); assert.equal(selected[0].props.item.getId(), b2.id);
  assert.match(htmlFor({ view: 'workspace', selectedNodeId: 'missing-internal-id' }), /所选节点暂不可定位/);
  assert.doesNotMatch(htmlFor({ view: 'workspace', selectedNodeId: 'missing-internal-id' }), /missing-internal-id/);
  assert.match(htmlFor({ view: 'workspace', selectedNodeId: null }), /请选择节点/);
});

test('rename, insertion and deletion emit exact version-bound intents without changing data or save facts', () => {
  const calls = [], nodes = freeze(structuredClone(props.nodes));
  const extra = { nodes, onIntent: value => calls.push(value), save: { state: 'saved-draft' } };
  const before = htmlFor({ ...extra, view: 'workspace' }), controls = capture(extra);
  inputOf(controls).props.onChange({ target: { value: '  新名称  ' } });
  inputOf(controls).props.onChange({ target: { value: '' } });
  for (const kind of ['add-child', 'add-after', 'delete']) action(controls, kind).props.onClick();
  assert.deepEqual(calls, [
    { ...context, type: 'rename', nodeId: b2.id, title: '  新名称  ' }, { ...context, type: 'rename', nodeId: b2.id, title: '' },
    { ...context, type: 'add', nodeId: b2.id, placement: 'child', target: { parentId: b2.id, index: 1 } },
    { ...context, type: 'add', nodeId: b2.id, placement: 'after', target: { parentId: b.id, index: 2 } },
    { ...context, type: 'delete', nodeId: b2.id },
  ]);
  assert.equal(htmlFor({ ...extra, view: 'workspace' }), before);
  assert.equal(nodes[1].children[1].title, b2.title);
});

test('four touch and keyboard buttons emit final zero-based target positions and keep focusable native semantics', () => {
  const calls = [], extra = { onIntent: value => calls.push(value) }, controls = capture(extra);
  const expected = { up: { parentId: b.id, index: 0 }, down: { parentId: b.id, index: 2 }, outdent: { parentId: null, index: 2 }, indent: { parentId: b1.id, index: 0 } };
  for (const [via, target] of Object.entries(expected)) {
    const button = action(controls, via);
    assert.equal(button.props.disabled, false); assert.equal(button.props.size, 'navigation'); assert.equal(button.props.type, 'button');
    button.props.onClick();
    assert.deepEqual(calls.at(-1), { ...context, type: 'move', nodeId: b2.id, target, via });
    assert.match(htmlFor({ ...extra, view: 'workspace' }), new RegExp(`<button[^>]*data-structure-action="${via}"`));
  }
  const index = indexStructure(props.nodes);
  assert.equal(structureMoveTarget(index, a.id, 'up'), undefined);
  assert.equal(structureMoveTarget(index, c.id, 'down'), undefined);
  assert.equal(structureMoveTarget(index, a.id, 'outdent'), undefined);
});

test('drag uses the same guards and callback contract, disallows foreign drops, cycles, no-op and invalid indexes', () => {
  const calls = [], tree = treeOf(capture({ onIntent: intent => calls.push(intent) }));
  const config = tree.getConfig(), moving = [tree.getItemInstance(b2.id)];
  const target = { item: tree.getItemInstance(b.id), insertionIndex: 0, childIndex: 0 };
  assert.equal(config.canDrop(moving, target), true); config.onDrop(moving, target);
  assert.deepEqual(calls, [{ ...context, type: 'move', nodeId: b2.id, target: { parentId: b.id, index: 0 }, via: 'drag' }]);
  const invalid = [
    { item: tree.getItemInstance(b2.id) }, { item: tree.getItemInstance(deep.id) },
    { ...target, insertionIndex: 1 }, { ...target, insertionIndex: -1 }, { ...target, insertionIndex: 99 },
  ];
  for (const drop of invalid) { assert.equal(config.canDrop(moving, drop), false); config.onDrop(moving, drop); }
  config.onDrop([], target); config.onDrop([tree.getItemInstance(b1.id), ...moving], target);
  assert.equal(calls.length, 1);
  assert.equal(config.canDropForeignDragObject(), false); assert.equal(config.canDragForeignDragObjectOver(), false);
  assert.equal(config.openOnDropDelay, 0);
});

test('every capability gates its controls; limited reasons stay visible and node grants never override global unsupported', () => {
  const entryNames = { rename: [], add: ['add-child', 'add-after'], delete: ['delete'], move: ['up', 'down'], nest: ['indent', 'outdent'] };
  for (const [kind, names] of Object.entries(entryNames)) for (const cap of [supported, limited, unsupported]) {
    const extra = { capabilities: { ...capabilities, [kind]: cap }, onIntent() {} };
    const controls = capture(extra), enabled = cap.status !== 'unsupported';
    if (kind === 'rename') assert.equal(!!inputOf(controls), enabled);
    for (const name of names) assert.equal(!!action(controls, name), enabled);
    if (cap.reason) assert.ok(htmlFor(extra).includes(cap.reason));
  }
  for (const mode of modes) {
    const html = htmlFor({ ...mode, capabilities: { ...capabilities, view: unsupported }, onIntent() {}, onExpand() {} });
    assert.doesNotMatch(html, /标题 [abc]|7 个节点|data-structure-action|<input|编辑结构|查看完整结构/);
    assert.ok(html.includes(unsupported.reason));
  }
  const granted = { ...b2, capabilities: { move: supported } };
  const nodes = [a, { ...b, children: [b1, granted, b3] }, c];
  assert.equal(action(capture({ nodes, capabilities: { ...capabilities, move: unsupported }, onIntent() {} }), 'up'), undefined);
});

test('node conflicts, read-only and pending-deletion block writes, subtree moves/deletion and forbidden destinations', () => {
  for (const state of ['conflict', 'readonly', 'deleted']) {
    const changed = { ...b2, status: state === 'deleted' ? { state } : { state, reason: '此节点需要先核对。' } };
    const nodes = [a, { ...b, children: [b1, changed, b3] }, c];
    let calls = 0;
    const controls = capture({ nodes, onIntent() { calls++; } });
    assert.equal(inputOf(controls).props.readOnly, true);
    inputOf(controls).props.onChange({ target: { value: '不可写' } });
    for (const kind of ['add-child', 'add-after', 'delete', 'up', 'down', 'outdent', 'indent']) { assert.equal(action(controls, kind).props.disabled, true); action(controls, kind).props.onClick(); }
    assert.equal(calls, 0);
    const parent = capture({ nodes, selectedNodeId: b.id, onIntent() { calls++; } });
    assert.equal(action(parent, 'delete').props.disabled, true); assert.equal(action(parent, 'up').props.disabled, true);
    const index = indexStructure(nodes);
    assert.ok(structureMoveBlock(index, capabilities, a.id, { parentId: b2.id, index: 0 }));
    assert.ok(structureMoveBlock(index, capabilities, deep.id, { parentId: null, index: 0 }));
  }
});

test('node-limited capabilities reject a sibling addition into a restricted parent and independent nesting remains possible', () => {
  let calls = 0;
  const nodes = [a, { ...b, capabilities: { add: unsupported }, children: [b1, b2, b3] }, c];
  const controls = capture({ nodes, onIntent() { calls++; } });
  assert.equal(action(controls, 'add-child').props.disabled, false);
  assert.equal(action(controls, 'add-after').props.disabled, true);
  action(controls, 'add-after').props.onClick(); assert.equal(calls, 0);
  assert.ok(htmlFor({ nodes, view: 'workspace' }).includes(unsupported.reason));
  const tree = treeOf(capture({ selectedNodeId: a.id, capabilities: { ...capabilities, move: unsupported }, onIntent() {} }));
  const source = [tree.getItemInstance(a.id)];
  assert.equal(tree.getConfig().canDrag(source), true);
  assert.equal(tree.getConfig().canDrop(source, { item: tree.getItemInstance(c.id) }), true);
  assert.equal(tree.getConfig().canDrop(source, { item: tree.getRootItem(), insertionIndex: 2, childIndex: 3 }), false);
});

test('all save states are supplied facts across both densities, with no inferred completion', () => {
  const labels = { unsaved: '未保存', 'saved-draft': '已保存草稿', submitted: '已提交', conflict: '冲突', unknown: '状态未确认' };
  for (const mode of modes) for (const [state, label] of Object.entries(labels)) {
    const html = htmlFor({ ...mode, save: { state, description: '来自版本记录。' } });
    assert.ok(html.includes(`>${label}</span>`)); assert.match(html, /来自版本记录/);
  }
});

test('global read-only, save conflict and missing baseline or receiver guard direct handlers without clearing input', () => {
  for (const restriction of [
    { readOnlyReason: '已归档，请恢复后修改。' }, { readOnlyReason: '' },
    { save: { state: 'conflict', description: '当前版本已变化，保留待核对。' } },
    { structure: { ...props.structure, baseVersion: undefined } },
  ]) {
    let calls = 0;
    const controls = capture({ ...restriction, onIntent() { calls++; } });
    const input = inputOf(controls); assert.equal(input.props.value, b2.title); assert.equal(input.props.readOnly, true);
    input.props.onChange({ target: { value: '禁止修改' } });
    for (const name of ['add-child', 'delete', 'down']) action(controls, name).props.onClick();
    assert.equal(calls, 0); assert.equal(treeOf(controls).getConfig().canDrag([treeOf(controls).getItemInstance(b2.id)]), false);
  }
  assert.equal(inputOf(capture()).props.readOnly, true);
});

test('historical snapshots remain read-only even with mutation capabilities and callbacks', () => {
  for (const snapshot of ['', '昨日版本']) for (const mode of modes) {
    const extra = { ...mode, structure: { ...props.structure, snapshot, currentVersion: { id: 'opaque-current-id', label: '新版 v3' } }, onIntent() { assert.fail(); }, onExpand() {} };
    const html = htmlFor(extra);
    for (const text of ['历史版本（只读）', '当时版本', '当时保存状态', '新版 v3']) assert.ok(html.includes(text));
    assert.doesNotMatch(html, /<input|data-structure-action|编辑结构|opaque-/);
    if (mode.view === 'workspace') assert.equal(treeOf(capture(extra)).getConfig().canDrag([treeOf(capture(extra)).getItemInstance(b2.id)]), false);
  }
});

test('selection, expansion and return are separate view requests and never edit content', () => {
  const selections = [], expansions = [], edits = [], returns = [], trigger = {};
  const expandedIds = freeze([b.id]);
  const extra = { expandedIds, onExpandedChange: ids => expansions.push(ids), onSelect: selection => selections.push(selection), onIntent: value => edits.push(value), onExpand: target => returns.push(target), onBack: () => returns.push('back') };
  const controls = capture(extra), tree = treeOf(controls), selected = controls.find(item => item.type.name === 'TreeItem' && item.props.item.getId() === c.id);
  const target = {};
  for (const key of ['Enter', ' ']) selected.props.onKeyDown({ key, target, currentTarget: target, preventDefault() {} });
  assert.deepEqual(selections, [1, 2].map(() => ({ structureId: props.structure.id, versionId: props.structure.version.id, nodeId: c.id })));
  tree.getConfig().setExpandedItems(ids => [...ids, b2.id]);
  assert.deepEqual(expansions, [[b.id, b2.id]]); assert.deepEqual(expandedIds, [b.id]); assert.equal(edits.length, 0);
  assert.ok(tree.getHotkeyPresets().focusNextItem); assert.ok(tree.getHotkeyPresets().collapseOrUp);
  const inline = capture({ ...extra, view: 'inline' });
  inline.find(item => item.props.onClick && React.Children.toArray(item.props.children).includes('编辑结构')).props.onClick({ currentTarget: trigger });
  controls.find(item => item.props.onClick && React.Children.toArray(item.props.children).includes('返回原位置')).props.onClick();
  assert.deepEqual(returns, [trigger, 'back']);
  assert.doesNotMatch(htmlFor({ onExpand: undefined }), /编辑结构|查看完整结构/);
});

test('empty trees allow only an explicitly supported root insertion; malformed identities or topology fail closed', () => {
  const calls = [], controls = capture({ nodes: [], selectedNodeId: null, onIntent: intent => calls.push(intent) });
  action(controls, 'add-root').props.onClick();
  assert.deepEqual(calls, [{ ...context, type: 'add', nodeId: null, placement: 'root', target: { parentId: null, index: 0 } }]);
  const cyclic = node('cycle'); cyclic.children = [cyclic];
  for (const extra of [{ nodes: [a, a] }, { nodes: [cyclic] }, { nodes: [node('bad', 3)] }, { structure: { ...props.structure, id: '' } }]) {
    const html = htmlFor({ ...extra, view: 'workspace', onIntent() {}, onExpand() {} });
    assert.match(html, /暂不可用|未确认/); assert.doesNotMatch(html, /data-structure-action|role="tree"|<input/);
  }
});

test('compact and collapsed trees keep deep conflict and read-only reasons outside supplemental details', () => {
  const conflict = { ...deep, status: { state: 'conflict', reason: '深层节点的归属发生冲突。' } };
  const nodes = [{ ...a, status: { state: 'readonly', reason: '教材已定稿。' } }, { ...b, children: [{ ...b2, children: [conflict] }] }, c];
  for (const view of ['inline', 'workspace']) {
    const html = htmlFor({ nodes, view, density: 'compact', expandedIds: [], save: { state: 'conflict', description: '新版本待核对。' }, notice: '一条边界提示', details: '补充说明' });
    const visible = html.slice(0, html.indexOf('data-slot="collapsible"'));
    for (const text of ['深层节点的归属发生冲突', '教材已定稿', '新版本待核对', '一条边界提示']) assert.ok(visible.includes(text), text);
    assert.doesNotMatch(visible, /opaque-/);
  }
});

test('host replacement updates structure and statuses while the fixture adapter preserves descendants and levels', () => {
  const before = freeze(structuredClone(props.nodes));
  const moved = applyStructureExample(before, { ...context, type: 'move', nodeId: b2.id, via: 'outdent', target: { parentId: null, index: 2 } });
  assert.deepEqual(moved.map(item => item.id), [a.id, b.id, b2.id, c.id]);
  assert.equal(moved[2].level, 1); assert.equal(moved[2].children[0].level, 2); assert.equal(before[1].children[1].level, 2);
  assert.equal(indexStructure(moved).error, undefined);
  assert.deepEqual(treeOf(capture({ nodes: moved, expandedIds: [b.id, b2.id] })).getItems().map(item => item.getId()), [a.id, b.id, b1.id, b3.id, b2.id, deep.id, c.id]);
  const renamed = applyStructureExample(moved, { ...context, type: 'rename', nodeId: b2.id, title: '<script>改名</script>' });
  assert.match(htmlFor({ nodes: renamed }), /&lt;script&gt;改名&lt;\/script&gt;/); assert.doesNotMatch(htmlFor({ nodes: renamed }), /<script>/);
});

test('both labelled fixtures show three uses; lesson has five stages, child activities and movement, textbook is limited', () => {
  assert.equal(structuredContentExamples.lesson.nodes.length, 5);
  for (const purpose of ['lesson', 'textbook']) {
    const html = render(h(StructuredContentExample, { purpose, narrow: true }));
    assert.equal((html.match(/data-agent-structured-view=/g) ?? []).length, 3);
    for (const text of ['示例', '对话摘要', '完整层级编辑', '紧凑摘要', 'max-w-[320px]']) assert.ok(html.includes(text));
    assert.doesNotMatch(html, /意图|宿主|回调|受控|internal-/);
    if (purpose === 'lesson') { assert.match(html, /新增 2 个教学活动/); assert.match(html, /a² \+ b² = c²/); assert.match(html, /data-structure-action="indent"/); }
    else { assert.match(html, /教材章节由出版版本确定/); assert.doesNotMatch(html, /data-structure-action|节点名称/); assert.match(html, /<math.*<mfrac>/); }
  }
  assert.match(render(h(AgentStructuredContentDemo)), /320px 窄容器/);
});

test('public types require reasoned capabilities, node status/level, controlled selection and typed positional intents', async () => {
  const file = new URL('type-contract.tsx', runtime);
  await writeFile(file, `import type { AgentStructureCapability as C, AgentStructureCapabilities as CS, AgentStructureNode as N, AgentStructuredContentProps as P, AgentStructuredContentIntent as I } from '../../components/prism-next/agent-structured-content';
const limited: C = { status: 'limited', reason: '仅部分' };
// @ts-expect-error limited must explain why
const noReason: C = { status: 'limited' };
// @ts-expect-error all capabilities required
const incomplete: CS = { view: limited };
// @ts-expect-error conflict requires a reason
const badNode: N = { id: 'n', title: 'n', type: '章', level: 1, status: { state: 'conflict' } };
// @ts-expect-error explicit level is required
const noLevel: N = { id: 'n', title: 'n', type: '章', status: { state: 'normal' } };
// @ts-expect-error no uncontrolled business selection
const noSelection: P = { structure: { id: 's', title: 's', version: { id: 'v1', label: 'v1' } }, nodes: [], capabilities: {} as CS };
// @ts-expect-error moving must specify parent and final index
const noPosition: I = { structureId: 's', versionId: 'v', baseVersionId: 'b', type: 'move', nodeId: 'n', via: 'up' };
// @ts-expect-error arbitrary commands cannot execute
const script: I = { structureId: 's', versionId: 'v', baseVersionId: 'b', type: 'execute', script: 'x' };
void [limited, noReason, incomplete, badNode, noLevel, noSelection, noPosition, script];
`);
  try {
    const config = ts.readConfigFile(`${root}tsconfig.json`, ts.sys.readFile);
    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
    const diagnostics = ts.getPreEmitDiagnostics(ts.createProgram([fileURLToPath(file)], { ...parsed.options, incremental: false, noEmit: true }));
    assert.equal(diagnostics.length, 0, diagnostics.map(value => ts.flattenDiagnosticMessageText(value.messageText, '\n')).join('\n'));
  } finally { await rm(file); }
});

test('copy polish: historical and whole-readonly capability lines never claim supported editing', () => {
  for (const mode of modes) {
    for (const extra of [{ structure: { ...props.structure, snapshot: '历史记录' } }, { structure: { ...props.structure, snapshot: '' } }, { readOnlyReason: '已冻结' }, { readOnlyReason: '' }, { onIntent: undefined }]) {
      const html = htmlFor({ ...mode, onIntent() {}, ...extra });
      const section = html.match(/<section aria-label="结构能力"[\s\S]*?<\/section>/)[0];
      assert.match(section, /只读，结构编辑能力不适用/);
      assert.doesNotMatch(section, /：支持/);
      if (extra.structure) assert.match(section, /历史版本只读/);
    }
    const html = htmlFor({ ...mode, onIntent() {} });
    assert.match(html, /重命名：支持/);
    const limitedHtml = htmlFor({ ...mode, readOnlyReason: '只读示例', capabilities: { ...capabilities, move: limited } });
    assert.match(limitedHtml, /仅可调整提供的教学活动/);
  }
});
