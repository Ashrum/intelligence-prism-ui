import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = new URL('../.sites-runtime/material-pack/', import.meta.url);
await mkdir(runtime, { recursive: true });
const file = new URL('test-bundle.mjs', runtime);
const bundle = await build({ stdin: { contents: `export * from './components/prism-next/agent-material-pack'; export * from './components/prism-next/demos/agent-material-pack';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false });
await writeFile(file, bundle.outputFiles[0].text);
const { AgentMaterialPack, AgentMaterialPackDemo, MaterialPackExample, materialPackExamples, applyMaterialPackExample } = await import(file);
await rm(file);
const h = React.createElement;
const context = { packId: 'opaque-pack', versionId: 'opaque-draft', baseVersionId: 'opaque-base' };
const pack = { id: context.packId, title: '勾股定理教学材料', version: { id: context.versionId, label: '整理稿' }, baseVersion: { id: context.baseVersionId, label: '初稿' } };
const category = (id, title, count) => ({ id, title, count });
const categories = [category('opaque-images', '图示', 2), category('opaque-videos', '视频', 1), category('opaque-empty', '备用材料', 0)];
const item = (id, title, categoryId = categories[0].id) => ({ resource: { resourceId: `opaque-${id}`, versionId: `opaque-${id}-v1`, source: { id: 'opaque-original-source', label: '共同教学来源', location: '勾股定理章节' } }, title, type: '图片', categoryId, versionLabel: '第一版', note: '', license: { state: 'available', name: '校内使用' }, availability: { state: 'available' }, actions: { remove: {}, move: {}, 'edit-note': {}, preview: {}, 'open-source': {} } });
const items = [item('area', '面积图示'), item('proof', '拼图证明'), item('movie', '课堂短片', categories[1].id)];
const props = { pack, items, categories, summary: { count: 9, sourceComposition: '校内教学来源提供。', license: '许可按原资源记录。', availability: '请核对当前可用性。' }, save: { state: 'unsaved' }, changes: ['新增课堂短片。'], reuseRecords: [{ id: 'opaque-reuse', resourceIds: [items[0].resource.resourceId], target: { objectId: 'opaque-outline', versionId: 'opaque-outline-v2', label: '勾股定理复习提纲', versionLabel: '第二版', location: '面积回顾环节' } }], actions: { 'add-request': {}, 'category-create': {}, 'category-rename': {}, 'category-delete': {}, 'rename-pack': {}, 'reuse-request': {}, confirm: {} }, onIntent() {}, renderPreview: () => h('p', {}, 'PREVIEW_CONTENT') };
const modes = [{ view: 'inline' }, { view: 'workspace' }, { view: 'inline', density: 'compact' }, { view: 'workspace', density: 'compact' }];
const htmlFor = extra => render(h(AgentMaterialPack, { ...props, ...extra }));
const textOf = html => html.replace(/<[^>]*>/g, '');
const count = (text, term) => text.split(term).length - 1;
// Exercise the actual handlers created by the component; not browser interaction acceptance.
function capture(extra = {}) {
  const nodes = [];
  function inspect(node) {
    if (Array.isArray(node)) return node.map(inspect);
    if (!React.isValidElement(node)) return node;
    if (node.type === AgentMaterialPack) return h(function Probe() { return inspect(node.type(node.props)); });
    nodes.push(node);
    return React.cloneElement(node, {}, React.Children.map(node.props.children, inspect));
  }
  render(inspect(h(AgentMaterialPack, { ...props, view: 'workspace', ...extra })));
  return nodes;
}
const buttons = (nodes, action) => nodes.filter(node => node.props['data-material-action'] === action);
const button = (nodes, action, ordinal = 0) => buttons(nodes, action)[ordinal];
const fields = (nodes, type) => nodes.filter(node => node.props['data-material-field'] === type);
const pickers = nodes => nodes.filter(node => node.props['data-material-category'] !== undefined);
const event = () => ({ preventDefault() {}, stopPropagation() {}, dataTransfer: { values: [], setData(type, value) { this.values.push([type, value]); } } });
const activation = extra => ({ ...context, resourceId: items[0].resource.resourceId, resourceVersionId: items[0].resource.versionId, requestedBy: 'user', state: 'ready', ...extra });
function freeze(value) { if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.freeze(value); Object.values(value).forEach(freeze); } return value; }

test('SSR: both views, compact and three theme wrappers retain supplied identity, totals, categories, changes and reuse', () => {
  for (const theme of ['light', 'paper', 'dark']) for (const mode of modes) {
    const html = render(h('div', { 'data-ui-version': 'coss-v1', 'data-prism-theme': theme }, h(AgentMaterialPack, { ...props, ...mode })));
    for (const text of ['素材总数：9 项', '整理稿', '初稿', '未保存', '新增课堂短片。', '勾股定理复习提纲', '面积回顾环节']) assert.ok(html.includes(text), text);
    assert.equal(count(html, 'data-material-boundary'), 1);
    assert.equal(count(html, 'data-material-item='), 3);
    assert.equal(count(html, '<h5 '), 3);
    assert.doesNotMatch(html, /opaque-|宿主|意图|回调|受控|条目 \d|。；| ·  · |PREVIEW_CONTENT/);
    assert.equal(count(html, 'data-material-category='), 0); // React component-only marker never exposes identity.
    if (mode.view === 'inline') assert.doesNotMatch(html, /data-material-field|移出素材包|移到分类末尾|data-material-drag/);
    else assert.match(html, /素材包名称|分类名称|移出素材包|移到分类末尾/);
  }
});

test('external zero/unknown totals are never replaced with loaded length or category sums', () => {
  assert.match(htmlFor({ summary: { ...props.summary, count: 0 } }), /素材总数：0 项/);
  for (const value of [null, NaN, Infinity, -1, 1.5]) {
    const html = htmlFor({ summary: { ...props.summary, count: value }, categories: categories.map(category => ({ ...category, count: value })) });
    assert.match(html, /未知：素材总数。/); assert.match(html, /未知：分类数量。/);
    assert.doesNotMatch(html, /素材总数：3 项|NaN|Infinity/);
  }
});

test('unknown metadata merges into one line per object; null reuse never claims no reuse', () => {
  for (const mode of modes) {
    const html = htmlFor({ ...mode, pack: { ...pack, version: { ...pack.version, label: '' }, baseVersion: { ...pack.baseVersion, label: '' } }, save: { state: 'unknown' }, changes: undefined,
      summary: { count: null, sourceComposition: null, license: null, availability: null }, reuseRecords: null,
      items: [{ ...items[0], versionLabel: null, resource: { ...items[0].resource, versionId: null, source: { id: null, label: null } }, license: { state: 'unknown', name: null }, availability: { state: 'unknown' } }] });
    assert.equal(count(html, 'data-material-unknown="pack"'), 1); assert.equal(count(html, 'data-material-unknown="resource"'), 1);
    assert.match(html, /未知：许可、来源、资源版本、可用性。/); assert.match(html, /保存状态、关键变化、复用记录/);
    assert.doesNotMatch(html, /暂无复用记录|已引用|已保存草稿/);
  }
  assert.match(htmlFor({ reuseRecords: [] }), /暂无复用记录/);
});

test('license restriction and invalid-source reason stay visible once in every mode; actions follow supplied capability', () => {
  const reason = '原始文件已下架，请核对其他来源。', restricted = '仅允许校内课堂使用。';
  const rows = [{ ...items[0], license: { state: 'restricted', name: '课堂许可', reason: restricted } },
    { ...items[1], availability: { state: 'invalid', reason }, actions: { ...items[1].actions, preview: { disabledReason: reason }, 'open-source': { disabledReason: reason } } }, items[2]];
  for (const mode of modes) {
    const html = htmlFor({ ...mode, items: rows });
    assert.match(html, /许可受限|来源失效/); assert.equal(count(textOf(html), reason), 1); assert.equal(count(textOf(html), restricted), 1);
  }
  const calls = [], nodes = capture({ items: rows, onIntent: intent => calls.push(intent) });
  button(nodes, 'preview').props.onClick(); button(nodes, 'preview', 1).props.onClick(); button(nodes, 'open-source', 1).props.onClick();
  assert.deepEqual(calls, [{ ...context, type: 'preview', resource: rows[0].resource }]);
  assert.equal(button(nodes, 'preview', 1).props.disabled, true);
});

test('resource identity including original version and source reference is retained for all resource requests', () => {
  const calls = [], frozen = freeze(structuredClone(items)), nodes = capture({ items: frozen, onIntent: intent => calls.push(intent) });
  for (const action of ['preview', 'open-source', 'remove']) button(nodes, action).props.onClick();
  fields(nodes, 'edit-note')[0].props.onChange({ target: { value: '  新备注\n第二行  ' } });
  assert.deepEqual(calls, ['preview', 'open-source', 'remove'].map(type => ({ ...context, type, resource: frozen[0].resource })).concat({ ...context, type: 'edit-note', resource: frozen[0].resource, note: '  新备注\n第二行  ' }));
  for (const call of calls) assert.equal(call.resource, frozen[0].resource);
  assert.deepEqual(frozen, items);
  const original = { ...items[0].resource, versionId: null, source: { id: null, label: null } }, unknownCalls = [];
  button(capture({ items: [{ ...items[0], resource: original }], onIntent: intent => unknownCalls.push(intent) }), 'open-source').props.onClick();
  assert.deepEqual(unknownCalls[0].resource, original);
});

test('up/down requests use final within-category indices and protect boundaries', () => {
  const calls = [], nodes = capture({ onIntent: intent => calls.push(intent) });
  button(nodes, 'up').props.onClick(); button(nodes, 'down', 1).props.onClick(); // boundaries
  button(nodes, 'down').props.onClick(); button(nodes, 'up', 1).props.onClick();
  assert.deepEqual(calls, [{ ...context, type: 'move', resource: items[0].resource, target: { categoryId: categories[0].id, index: 1 }, via: 'down' },
    { ...context, type: 'move', resource: items[1].resource, target: { categoryId: categories[0].id, index: 0 }, via: 'up' }]);
  const text = textOf(htmlFor({ view: 'workspace' }));
  assert.match(text, /面积图示、课堂短片 · 上移：已在分类最前，不能上移。/);
  assert.match(text, /拼图证明、课堂短片 · 下移：已在分类最后，不能下移。/);
});

test('category picker appends after removing the source, supports empty/uncategorized targets, rejects foreign values', () => {
  const calls = [], nodes = capture({ onIntent: intent => calls.push(intent) }), picker = pickers(nodes)[0];
  picker.props.onValueChange('0'); picker.props.onValueChange('1'); picker.props.onValueChange('2');
  picker.props.onValueChange('opaque-videos'); picker.props.onValueChange('99'); picker.props.onValueChange(null);
  assert.deepEqual(calls.map(call => [call.target, call.via]), [[{ categoryId: categories[1].id, index: 1 }, 'to-category'], [{ categoryId: categories[2].id, index: 0 }, 'to-category'], [{ categoryId: null, index: 0 }, 'to-category']]);
  assert.ok(calls.every(call => call.resource === items[0].resource));
});

test('drag is local, carries no identities and matches equivalent category/end position', () => {
  const calls = [], nodes = capture({ onIntent: intent => calls.push(intent) }), foreign = capture({ onIntent: intent => calls.push(intent) });
  const handle = nodes.find(node => node.props['data-material-drag'] === 0), end = nodes.find(node => node.props['data-material-drop-category'] === 1);
  end.props.onDrop(event()); assert.equal(calls.length, 0);
  const start = event(); handle.props.onDragStart(start);
  foreign.find(node => node.props['data-material-drop-category'] === 1).props.onDrop(event()); assert.equal(calls.length, 0);
  assert.deepEqual(start.dataTransfer.values, [['text/plain', 'material-resource']]);
  end.props.onDrop(event()); end.props.onDrop(event());
  assert.deepEqual(calls, [{ ...context, type: 'move', resource: items[0].resource, target: { categoryId: categories[1].id, index: 1 }, via: 'drag' }]);
  handle.props.onDragStart(event()); handle.props.onDragEnd(); end.props.onDrop(event()); assert.equal(calls.length, 1);
});

test('locked items or unavailable movement cannot be displaced indirectly; locked categories reject incoming moves', () => {
  for (const lock of [{ lockedReason: '顺序已冻结。' }, { actions: { ...items[1].actions, move: { disabledReason: '顺序已冻结。' } } }, { actions: { preview: {} } }]) {
    const calls = [], nodes = capture({ items: [items[0], { ...items[1], ...lock }, items[2]], onIntent: intent => calls.push(intent) });
    button(nodes, 'down').props.onClick(); pickers(nodes)[0].props.onValueChange('0');
    assert.equal(calls.length, 0);
  }
  const calls = [], nodes = capture({ categories: categories.map((category, i) => i === 1 ? { ...category, lockedReason: '此分类暂不接收素材。' } : category), onIntent: intent => calls.push(intent) });
  pickers(nodes)[0].props.onValueChange('0'); assert.equal(calls.length, 0);
});

test('category create/rename/delete and pack name edits only request raw changes; deletion keeps resource destinations undecided', () => {
  const calls = [], nodes = capture({ onIntent: intent => calls.push(intent) });
  button(nodes, 'category-create').props.onClick(); fields(nodes, 'category-rename')[0].props.onChange({ target: { value: '  证明图  ' } });
  button(nodes, 'category-delete-0').props.onClick(); fields(nodes, 'rename-pack')[0].props.onChange({ target: { value: '' } });
  assert.deepEqual(calls, [{ ...context, type: 'category-create' }, { ...context, type: 'category-rename', categoryId: categories[0].id, title: '  证明图  ' },
    { ...context, type: 'category-delete', categoryId: categories[0].id, resources: items.slice(0, 2).map(item => item.resource) }, { ...context, type: 'rename-pack', title: '' }]);
  assert.equal(items.length, 3); assert.equal(categories.length, 3); assert.equal(calls[2].resources[0], items[0].resource);
});

test('add/reuse/confirm preserve all original references and never invent saving or usage', () => {
  const calls = [], nodes = capture({ onIntent: intent => calls.push(intent) });
  for (const action of ['add-request', 'reuse-request', 'confirm']) button(nodes, action).props.onClick();
  assert.deepEqual(calls, [{ ...context, type: 'add-request' }, ...['reuse-request', 'confirm'].map(type => ({ ...context, type, resources: items.map(item => item.resource) }))]);
  for (const call of calls.slice(1)) call.resources.forEach((resource, i) => assert.equal(resource, items[i].resource));
  assert.match(htmlFor(), /未保存/); assert.equal(props.reuseRecords.length, 1);
});

test('category deletion is distinct from removing resources, but cannot bypass explicit category or item locks', () => {
  const calls = [], rows = items.map(item => ({ ...item, actions: { move: {}, preview: {} } }));
  const nodes = capture({ items: rows, onIntent: intent => calls.push(intent) });
  button(nodes, 'category-delete-0').props.onClick();
  assert.deepEqual(calls, [{ ...context, type: 'category-delete', categoryId: categories[0].id, resources: rows.slice(0, 2).map(item => item.resource) }]);
  for (const extra of [{ items: [{ ...items[0], lockedReason: '该素材归属已冻结。' }, ...items.slice(1)] }, { categories: [{ ...categories[0], lockedReason: '该分类只读。' }, ...categories.slice(1)] }]) {
    const control = button(capture({ ...extra, onIntent: intent => calls.push(intent) }), 'category-delete-0');
    assert.equal(control.props.disabled, true); control.props.onClick();
  }
  assert.equal(calls.length, 1);
});

test('history, save conflicts and pending receipts block edits/reuse while preserving preview/source and navigation', () => {
  for (const extra of [{ pack: { ...pack, snapshot: '' } }, { readOnlyReason: '' }, { save: { state: 'saving' } }, { save: { state: 'conflict', description: '另一位教师已更新素材包。' } }, { save: { state: 'unconfirmed' } }]) {
    const calls = [], nodes = capture({ ...extra, onIntent: intent => calls.push(intent) });
    for (const action of ['add-request', 'category-create', 'category-delete-0', 'remove', 'up', 'down', 'reuse-request', 'confirm']) {
      for (const control of buttons(nodes, action)) { assert.equal(control.props.disabled, true, action); control.props.onClick(); }
    }
    for (const picker of pickers(nodes)) picker.props.onValueChange('0');
    assert.equal(calls.length, 0); assert.equal(fields(nodes, 'edit-note').length, 0); assert.equal(fields(nodes, 'rename-pack').length, 0);
    button(nodes, 'preview').props.onClick(); button(nodes, 'open-source').props.onClick(); assert.equal(calls.length, 2);
  }
});

test('empty disabled reasons still disable and duplicate/missing identities never send ambiguous requests', () => {
  for (const extra of [{ onIntent: undefined }, { pack: { ...pack, baseVersion: { id: '', label: '初稿' } } }, { items: [...items, items[0]] }, { categories: [categories[0], categories[0]] }, { items: [{ ...items[0], categoryId: 'missing' }] }]) {
    const calls = [], nodes = capture({ onIntent: intent => calls.push(intent), ...extra });
    for (const action of ['add-request', 'confirm', 'preview', 'remove', 'down']) for (const control of buttons(nodes, action)) { assert.equal(control.props.disabled, true); control.props.onClick(); }
    assert.equal(calls.length, 0);
  }
  const calls = [], nodes = capture({ actions: { ...props.actions, 'reuse-request': { disabledReason: '' } }, onIntent: intent => calls.push(intent) });
  assert.equal(button(nodes, 'reuse-request').props.disabled, true); button(nodes, 'reuse-request').props.onClick(); assert.equal(calls.length, 0);
});

test('repeated copy is consolidated once with readable partial scopes and valid accessible links', () => {
  const reason = '请先核对原始教学材料。';
  const rows = items.map(item => ({ ...item, availability: { state: 'restricted', reason }, actions: { ...item.actions, preview: { disabledReason: reason }, 'open-source': { disabledReason: reason } } }));
  const html = htmlFor({ view: 'workspace', items: rows }), text = textOf(html);
  assert.equal(count(text, reason), 1); assert.equal(count(text, '共同教学来源'), 1);
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]));
  for (const match of html.matchAll(/aria-(?:describedby|labelledby)="([^"]+)"/g)) for (const target of match[1].split(' ')) assert.ok(ids.has(target), target);
  const partial = textOf(htmlFor({ items: [rows[0], rows[1], items[2]] }));
  assert.match(partial, /面积图示、拼图证明 · 可用性原因：请先核对原始教学材料。/); assert.doesNotMatch(partial, /条目 \d/);
});

test('previews mount only on a user request matching pack/current/base/resource versions and explicit capability', () => {
  let mounts = 0; const renderPreview = () => { mounts++; return h('p', {}, 'PRIVATE_PREVIEW'); };
  for (const preview of [null, activation({ requestedBy: 'agent' }), activation({ packId: 'other' }), activation({ versionId: 'old' }), activation({ baseVersionId: 'old' }), activation({ resourceId: 'missing' }), activation({ resourceVersionId: 'old' }), activation({ state: 'loading' }), activation({ state: 'error', message: '原文件无法打开。' })]) {
    assert.doesNotMatch(htmlFor({ preview, renderPreview }), /PRIVATE_PREVIEW/);
  }
  assert.equal(mounts, 0);
  assert.match(htmlFor({ preview: activation(), renderPreview }), /PRIVATE_PREVIEW/); assert.equal(mounts, 1);
  for (const extra of [{ items: [] }, { items: [{ ...items[0], actions: { preview: { disabledReason: '权限已收回。' } } }] }, { items: [{ ...items[0], actions: {} }] }]) assert.doesNotMatch(htmlFor({ ...extra, preview: activation(), renderPreview }), /PRIVATE_PREVIEW/);
  assert.equal(mounts, 1);
});

test('compact changes spacing only, keeps license/source/unknown/reuse and domain controls', () => {
  const normal = htmlFor({ view: 'workspace' }), compact = htmlFor({ view: 'workspace', density: 'compact' });
  assert.equal(textOf(normal), textOf(compact));
  assert.match(compact, /gap-3 p-4/); assert.match(normal, /gap-5 p-5 sm:p-6/);
});

test('navigation does not confirm, save or alter resources; missing capabilities create no fake controls', () => {
  const calls = [], trigger = {}, nav = [];
  const inline = capture({ view: 'inline', onIntent: intent => calls.push(intent), onExpand: button => nav.push(button) });
  inline.find(node => 'data-material-expand' in node.props).props.onClick({ currentTarget: trigger });
  const workspace = capture({ onIntent: intent => calls.push(intent), onBack: () => nav.push('back') });
  workspace.find(node => node.props.children === '返回原位置').props.onClick();
  assert.deepEqual(nav, [trigger, 'back']); assert.equal(calls.length, 0);
  const html = htmlFor({ view: 'workspace', actions: {}, items: items.map(item => ({ ...item, actions: {} })) });
  assert.doesNotMatch(html, /data-material-action|data-material-field|data-material-expand|data-material-drag/);
});

test('both demonstration datasets render and edits keep original assets and pre-existing reuse records', () => {
  assert.match(render(h(AgentMaterialPackDemo)), /id="material-pack"/);
  for (const purpose of Object.keys(materialPackExamples)) assert.match(render(h(MaterialPackExample, { purpose, narrow: true })), /max-w-\[320px\]|固定示例/);
  const state = materialPackExamples.pythagoras, base = { packId: state.pack.id, versionId: state.pack.version.id, baseVersionId: state.pack.baseVersion.id };
  const moved = applyMaterialPackExample(state, { ...base, type: 'move', resource: state.items[0].resource, target: { categoryId: state.categories[1].id, index: 1 }, via: 'to-category' });
  assert.equal(moved.items.find(item => item.resource.resourceId === state.items[0].resource.resourceId).resource, state.items[0].resource);
  assert.equal(moved.reuseRecords, state.reuseRecords);
  assert.equal(applyMaterialPackExample(state, { ...base, type: 'category-delete', categoryId: state.categories[0].id, resources: state.items.slice(0, 2).map(item => item.resource) }), state);
  for (const type of ['add-request', 'reuse-request', 'confirm']) assert.equal(applyMaterialPackExample(state, { ...base, type, resources: state.items.map(item => item.resource) }), state);
  assert.equal(applyMaterialPackExample(state, { ...base, baseVersionId: 'stale', type: 'rename-pack', title: '不应覆盖' }), state);
});

test('component stays free of content copying, storage, execution services, timers and Workspace business types', async () => {
  const source = await readFile(new URL('../components/prism-next/agent-material-pack.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /localStorage|sessionStorage|setTimeout|setInterval|fetch\(|Date\(|useState|ole-school-workbench|useTeacherStore|dangerouslySetInnerHTML/);
  assert.doesNotMatch(source, /text-xs|text-sm|font-size/);
  assert.match(source, /arrangementMoveBlock|arrangementDropTarget/);
  const demo = await readFile(new URL('../components/prism-next/demos/agent-material-pack.tsx', import.meta.url), 'utf8');
  assert.match(demo, /AgentObjectViewer|<math>/); assert.doesNotMatch(demo, /setTimeout|setInterval|fetch\(|localStorage/);
});

test('copy polish 3: organizing delegates the trigger and category creation delegates naming', () => {
  const trigger = { focus() { assert.fail('component must not move host focus'); } }, expansions = [], calls = [];
  const nodes = capture({ view: 'inline', onExpand: value => expansions.push(value) });
  nodes.find(node => node.props['data-material-expand'] !== undefined).props.onClick({ currentTarget: trigger });
  assert.deepEqual(expansions, [trigger]);
  const before = htmlFor({ view: 'workspace' });
  button(capture({ onIntent: value => calls.push(value) }), 'category-create').props.onClick();
  assert.deepEqual(calls, [{ ...context, type: 'category-create' }]);
  assert.equal(htmlFor({ view: 'workspace' }), before);
  assert.doesNotMatch(before, /新分类 \d/);
});
