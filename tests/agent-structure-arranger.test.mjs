import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = new URL('../.sites-runtime/structure-arranger/', import.meta.url);
await mkdir(runtime, { recursive: true });
const file = new URL('test-bundle.mjs', runtime);
const bundle = await build({ stdin: { contents: `export * from './components/prism-next/agent-structure-arranger'; export * from './lib/prism-next/agent-structure-arranger'; export * from './lib/prism-next/agent-structured-content'; export * from './components/prism-next/demos/agent-structure-arranger';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false });
await writeFile(file, bundle.outputFiles[0].text);
const { AgentStructureArranger, indexArrangement, arrangementMoveTarget, arrangementMoveBlock, arrangementDropTarget,
  indexStructure, structureMoveTarget, ArrangementExample, AgentStructureArrangerDemo, arrangementExamples, applyArrangementExample, arrangementExampleBatchAttribute } = await import(file);
await rm(file);
const h = React.createElement;
const attribute = (value = 5) => ({ id: 'opaque-points', label: '分值', type: 'number', value, unit: '分' });
const item = (id, groupId = 'opaque-group-a') => ({ id: `opaque-${id}`, title: `条目标题${id}`, type: '试题', groupId, source: { objectId: `opaque-source-${id}`, versionId: 'opaque-source-v1', label: '共同来源' }, attributes: [attribute()], open: {} });
const groups = [{ id: 'opaque-group-a', title: '第一部分' }, { id: 'opaque-group-b', title: '第二部分' }, { id: 'opaque-group-c', title: '第三部分' }];
const items = [item('a'), item('b'), item('c'), item('d', groups[1].id)];
const actions = { move: {}, groupCreate: {}, groupRename: {}, groupDelete: {}, setAttribute: {}, batchMove: {}, batchSetAttribute: {}, confirm: {} };
const props = { structure: { id: 'opaque-structure', title: '可读编排标题', version: { id: 'opaque-version', label: '草稿 v2' }, baseVersion: { id: 'opaque-base', label: '基准 v1' } }, items, groups, actions, validation: [], onIntent() {} };
const context = { structureId: props.structure.id, versionId: props.structure.version.id, baseVersionId: props.structure.baseVersion.id };
const modes = [{ view: 'inline' }, { view: 'workspace' }, { view: 'inline', density: 'compact' }, { view: 'workspace', density: 'compact' }];
const htmlFor = extra => render(h(AgentStructureArranger, { ...props, ...extra }));
function capture(extra = {}) {
  const nodes = [], owned = new Set(['AgentStructureArranger', 'ArrangementAttributeField']);
  function inspect(node) {
    if (Array.isArray(node)) return node.map(inspect);
    if (!React.isValidElement(node)) return node;
    if (typeof node.type === 'function' && owned.has(node.type.name)) return h(function Probe() { return inspect(node.type(node.props)); });
    nodes.push(node);
    return React.cloneElement(node, {}, React.Children.map(node.props.children, inspect));
  }
  render(inspect(h(AgentStructureArranger, { ...props, view: 'workspace', ...extra })));
  return nodes;
}
const controls = (nodes, name) => nodes.filter(node => node.props['data-arranger-action'] === name);
const named = (nodes, name) => nodes.filter(node => node.type.name === name);
const numeric = (nodes, ordinal) => named(nodes, 'NumberField').find(node => node.props.id.includes(`-item-${ordinal}-`));
const selects = nodes => nodes.filter(node => node.props.onValueChange && Array.isArray(node.props.items));
const groupSelects = nodes => selects(nodes).filter(node => node.props.items.some(option => option.label === '第三部分'));
const buttonWithText = (nodes, text) => nodes.find(node => node.props.onClick && React.Children.toArray(node.props.children).includes(text));
const event = value => ({ currentTarget: { value } });
function freeze(value) { if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.freeze(value); Object.values(value).forEach(freeze); } return value; }

test('SSR both views and compact preserve identity, full group/item order and externally supplied totals', () => {
  for (const mode of modes) {
    const html = htmlFor({ ...mode, summary: { groupCount: 9, itemCount: 80, totalScore: 321, targetScore: 400 }, changes: ['已调整一个分组。'], save: { state: 'saved-draft' } });
    for (const text of ['可读编排标题', '草稿 v2', '基准 v1', '分组数：9', '题数：80', '总分：321', '目标总分：400', '已保存草稿', '已调整一个分组。', '暂无条目']) assert.ok(html.includes(text), text);
    assert.match(html, new RegExp(`data-agent-arranger-view="${mode.view}"`));
    assert.ok(html.indexOf(items[0].title) < html.indexOf(items[1].title));
    assert.doesNotMatch(html, /opaque-|意图|宿主|回调|受控|localStorage/);
    if (mode.view === 'inline') assert.doesNotMatch(html, /type="text"|role="spinbutton"|新增分组|删除分组|批量编排/);
  }
});

test('missing totals remain unknown in one line, never summed from points or loaded length; zero is known', () => {
  const html = htmlFor({ structure: { ...props.structure, version: { id: 'opaque-v', label: '' }, baseVersion: undefined }, items: items.map(item => ({ ...item, source: null })) });
  assert.equal((html.match(/未知：/g) ?? []).length, 1);
  for (const label of ['当前版本', '基准版本', '保存状态', '关键变化', '分组数', '题数', '总分', '条目 1来源']) assert.ok(html.includes(label));
  assert.doesNotMatch(html, /总分：20|题数：4|已保存草稿/);
  assert.match(htmlFor({ summary: { groupCount: 0, itemCount: 0, totalScore: 0 } }), /分组数：0 · 题数：0 · 总分：0/);
  assert.match(htmlFor({ summary: { groupCount: -1, itemCount: 1.5, totalScore: NaN } }), /分组数、题数、总分/);
});

test('up/down use semantic 35 final-index convention and emit exact version-bound intents in both views', () => {
  const index = indexArrangement(items, groups);
  const reference = indexStructure([{ id: groups[0].id, title: 'group', type: '组', level: 1, status: { state: 'normal' }, children: items.slice(0, 3).map(item => ({ id: item.id, title: item.title, type: '项', level: 2, status: { state: 'normal' } })) }]);
  for (const view of ['inline', 'workspace']) {
    const calls = [], nodes = capture({ view, onIntent: intent => calls.push(intent) });
    for (const via of ['up', 'down']) {
      const button = controls(nodes, via)[1];
      assert.equal(button.props.disabled, false); assert.equal(button.props.size, 'navigation'); assert.equal(button.props.type, 'button');
      button.props.onClick();
      const target = arrangementMoveTarget(index, items[1].id, via), other = structureMoveTarget(reference, items[1].id, via);
      assert.deepEqual(target, { groupId: other.parentId, index: other.index });
      assert.deepEqual(calls.at(-1), { ...context, type: 'move', itemId: items[1].id, via, target });
    }
    controls(nodes, 'up')[0].props.onClick(); controls(nodes, 'down')[2].props.onClick();
    assert.equal(calls.length, 2);
  }
});

test('to-group appends after removal, empty and ungrouped destinations work without changing the supplied list', () => {
  const calls = [], data = freeze(structuredClone(items)), extra = { items: data, onIntent: intent => calls.push(intent), actions: { move: {} } };
  const before = htmlFor(extra), select = groupSelects(capture(extra))[0];
  for (const label of ['第二部分', '第三部分', '未分组']) {
    const option = select.props.items.find(item => item.label === label); select.props.onValueChange(option.value);
  }
  assert.deepEqual(calls.map(call => call.target), [{ groupId: groups[1].id, index: 1 }, { groupId: groups[2].id, index: 0 }, { groupId: null, index: 0 }]);
  assert.ok(calls.every(call => call.via === 'to-group' && call.itemId === items[0].id && call.baseVersionId === context.baseVersionId));
  select.props.onValueChange('opaque-foreign-group'); assert.equal(calls.length, 3);
  assert.equal(htmlFor(extra), before); assert.deepEqual(data, items);
});

test('group create/rename/delete send requests only; delete has no invented item destination', () => {
  const calls = [], nodes = capture({ onIntent: intent => calls.push(intent) });
  controls(nodes, 'group-create')[0].props.onClick();
  controls(nodes, 'group-rename')[0].props.onChange(event('  调整后的组名  '));
  controls(nodes, 'group-rename')[0].props.onChange(event(''));
  controls(nodes, 'group-delete')[0].props.onClick();
  assert.deepEqual(calls, [{ ...context, type: 'group-create' }, { ...context, type: 'group-rename', groupId: groups[0].id, title: '  调整后的组名  ' },
    { ...context, type: 'group-rename', groupId: groups[0].id, title: '' }, { ...context, type: 'group-delete', groupId: groups[0].id }]);
  assert.equal(groups.length, 3); assert.equal(items[0].groupId, groups[0].id);
});

test('numeric attribute handler keeps zero, negative, fractional and cleared values and never clamps or validates', () => {
  const calls = [], nodes = capture({ onIntent: intent => calls.push(intent) });
  const field = numeric(nodes, 0);
  assert.equal(field.props.min, undefined); assert.equal(field.props.max, undefined); assert.equal(field.props.snapOnStep, undefined);
  for (const value of [0, -5, 2.375, null, NaN, Infinity]) field.props.onValueChange(value);
  assert.deepEqual(calls, [0, -5, 2.375, null].map(value => ({ ...context, type: 'set-attribute', itemId: items[0].id, attributeId: attribute().id, value })));
  assert.equal(items[0].attributes[0].value, 5);
});

test('select attributes map ordinal UI values back to original references and reject unavailable options', () => {
  const calls = [], field = { id: 'opaque-type', type: 'select', label: '题型归类', value: 'opaque-unlisted', options: [{ value: 'opaque-choice', label: '单选' }, { value: 'opaque-written', label: '解答', disabledReason: '' }] };
  const extra = { items: [{ ...items[0], attributes: [field] }], onIntent: intent => calls.push(intent), actions: { setAttribute: {} } };
  const select = selects(capture(extra))[0];
  assert.equal(select.props.value, null); assert.match(htmlFor({ ...extra, view: 'workspace' }), /当前选项未列出/);
  for (const value of ['0', '1', 'opaque-foreign', null]) select.props.onValueChange(value);
  assert.deepEqual(calls, [{ ...context, type: 'set-attribute', itemId: items[0].id, attributeId: field.id, value: 'opaque-choice' }]);
  assert.doesNotMatch(htmlFor(extra), /opaque-/);
});

test('batch move uses original arrangement order and post-removal position; batch attributes keep the exact selection', () => {
  const calls = [], selectedIds = [items[2].id, items[0].id], nodes = capture({ selectedIds, onSelectionChange() {}, batchAttributes: [attribute(null)], onIntent: intent => calls.push(intent) });
  const select = groupSelects(nodes)[0]; select.props.onValueChange(select.props.items.find(item => item.label === '第二部分').value);
  named(nodes, 'NumberField').find(node => node.props.id.includes('-batch-')).props.onValueChange(7.5);
  assert.deepEqual(calls, [
    { ...context, type: 'batch-move', itemIds: [items[0].id, items[2].id], target: { groupId: groups[1].id, index: 1 } },
    { ...context, type: 'batch-set-attribute', itemIds: selectedIds, attributeId: attribute().id, value: 7.5 },
  ]);
  assert.notEqual(calls[1].itemIds, selectedIds);
  assert.deepEqual(arrangementDropTarget(indexArrangement(items, groups), [items[0].id, items[1].id], groups[0].id, null), { groupId: groups[0].id, index: 1 });
});

test('invalid, duplicate, locked or incompatible batch selections block the entire request, never a subset', () => {
  for (const selectedIds of [[], [items[0].id, 'opaque-missing'], [items[0].id, items[0].id], [items[0].id, items[1].id]]) {
    const calls = [], restricted = items.map((item, i) => i === 1 ? { ...item, lockedReason: '此题已锁定。' } : item);
    const nodes = capture({ items: restricted, selectedIds, batchAttributes: [attribute(null)], onIntent: intent => calls.push(intent) });
    const select = groupSelects(nodes)[0];
    for (const option of select.props.items) select.props.onValueChange(option.value);
    const field = named(nodes, 'NumberField').find(node => node.props.id.includes('-batch-'));
    assert.equal(field, undefined); assert.equal(calls.length, 0);
  }
  const nodes = capture({ selectedIds: [items[0].id], batchAttributes: [{ ...attribute(), id: 'missing-attribute' }] });
  assert.equal(named(nodes, 'NumberField').find(node => node.props.id.includes('-batch-')), undefined);
});

test('selection is page-owned view state and clearing does not mutate any arrangement or save fact', () => {
  const selections = [], calls = [], nodes = capture({ selectedIds: [items[0].id], onSelectionChange: ids => selections.push(ids), onIntent: intent => calls.push(intent) });
  named(nodes, 'Checkbox')[1].props.onCheckedChange(true);
  controls(nodes, 'clear-selection')[0].props.onClick();
  assert.deepEqual(selections, [[items[0].id, items[1].id], []]); assert.equal(calls.length, 0);
});

test('batch select visibly disables options unsupported or restricted by any selected item and rejects their handlers', () => {
  const category = { id: 'opaque-category', label: '分类', type: 'select', value: 'x', options: [{ value: 'x', label: '分类甲' }, { value: 'y', label: '分类乙' }] };
  for (const options of [[category.options[0]], [category.options[0], { ...category.options[1], disabledReason: '' }]]) {
    const calls = [], selected = items.slice(0, 2).map((item, i) => ({ ...item, attributes: [{ ...category, options: i ? options : category.options }] }));
    const nodes = capture({ items: selected, selectedIds: selected.map(item => item.id), actions: { batchSetAttribute: {} }, batchAttributes: [category], onIntent: intent => calls.push(intent) });
    const field = selects(nodes)[0];
    const option = nodes.find(node => node.props.value === '1' && node.props.children === '分类乙');
    assert.equal(option.props.disabled, true);
    field.props.onValueChange('1'); assert.equal(calls.length, 0);
    field.props.onValueChange('0'); assert.equal(calls.length, 1);
  }
  const nodes = capture({ selectedIds: [items[0].id], batchAttributes: [attribute(), attribute()] });
  assert.equal(named(nodes, 'NumberField').find(node => node.props.id.includes('-batch-')), undefined);
});

test('undeclared actions have no editing affordance or invented disabled-capability explanation', () => {
  const extra = { actions: {}, items: items.map(item => ({ ...item, open: undefined })) };
  const html = htmlFor({ ...extra, view: 'workspace' });
  assert.doesNotMatch(html, /此操作暂不可用|data-arranger-action|role="spinbutton"|新增分组|批量编排/);
  assert.match(html, /分值/); assert.match(html, /5 分/);
  const flat = htmlFor({ groups: [], items: items.map(item => ({ ...item, groupId: null })), actions: { move: {} }, view: 'workspace' });
  assert.match(flat, /data-arranger-action="up"/); assert.doesNotMatch(flat, /选择目标分组|移到分组末尾/);
});

test('locked items/groups block direct edits, parent deletion, batch and indirect positional shifts; viewing remains available', () => {
  const locked = items.map((item, i) => i === 1 ? { ...item, lockedReason: '已核定位置。' } : item), calls = [];
  const nodes = capture({ items: locked, onIntent: intent => calls.push(intent), onSelectionChange() {} });
  for (const via of ['up', 'down']) for (const button of controls(nodes, via).slice(0, 3)) { assert.equal(button.props.disabled, true); button.props.onClick(); }
  controls(nodes, 'group-delete')[0].props.onClick(); assert.equal(calls.length, 0);
  assert.equal(numeric(nodes, 1), undefined); assert.equal(named(nodes, 'Checkbox')[1].props.disabled, true);
  controls(nodes, 'open-item')[1].props.onClick(); assert.equal(calls.at(-1).type, 'open-item');
  const index = indexArrangement(items, [{ ...groups[0], lockedReason: '' }, ...groups.slice(1)]);
  assert.ok(arrangementMoveBlock(index, [items[3].id], { groupId: groups[0].id, index: 3 }));
  const groupNodes = capture({ groups: index.groups });
  assert.equal(controls(groupNodes, 'group-rename')[0].props.readOnly, true);
});

test('drag before an item and at a group end shares move guards; foreign, self and forbidden drops never emit', () => {
  const calls = [], nodes = capture({ onIntent: intent => calls.push(intent) });
  const drag = ordinal => nodes.find(node => node.props['data-arranger-drag'] === ordinal);
  const row = ordinal => nodes.find(node => node.props['data-arranger-row'] === ordinal);
  const end = ordinal => nodes.find(node => node.props['data-arranger-drop-end'] === ordinal);
  const data = [], event = { preventDefault() {}, stopPropagation() {}, dataTransfer: { setData: (...args) => data.push(args) } };
  end(1).props.onDrop(event); assert.equal(calls.length, 0);
  drag(1).props.onDragStart(event); row(1).props.onDrop(event); assert.equal(calls.length, 0);
  drag(1).props.onDragStart(event); row(0).props.onDragOver(event); row(0).props.onDrop(event);
  assert.deepEqual(calls.at(-1), { ...context, type: 'move', itemId: items[1].id, target: { groupId: groups[0].id, index: 0 }, via: 'drag' });
  drag(0).props.onDragStart(event); end(2).props.onDrop(event);
  assert.deepEqual(calls.at(-1).target, { groupId: groups[2].id, index: 0 });
  drag(0).props.onDragStart(event); drag(0).props.onDragEnd(); end(2).props.onDrop(event); assert.equal(calls.length, 2);
  assert.ok(data.every(args => args.join(' ') === 'text/plain 编排条目'));
  const locked = capture({ items: items.map((item, i) => i ? item : { ...item, lockedReason: '锁定' }), onIntent: intent => calls.push(intent) });
  assert.equal(locked.find(node => node.props['data-arranger-drag'] === 0).props.draggable, false);
});

test('invalid indexes, unknown groups and no-op moves are guarded with unchanged inputs', () => {
  const index = indexArrangement(freeze(structuredClone(items)), freeze(structuredClone(groups)));
  for (const target of [undefined, { groupId: groups[0].id, index: 0 }, { groupId: groups[0].id, index: -1 }, { groupId: groups[0].id, index: 1.5 }, { groupId: groups[0].id, index: 99 }, { groupId: 'missing', index: 0 }]) assert.ok(arrangementMoveBlock(index, [items[0].id], target));
  assert.equal(arrangementMoveBlock(index, [items[0].id], { groupId: groups[0].id, index: 2 }), undefined);
  assert.equal(arrangementDropTarget(index, [items[0].id], groups[1].id, items[2].id), undefined);
});

test('validation stays visible and linked in every mode, permits correction and blocks confirm for errors', () => {
  const validation = [{ level: 'error', message: '分值非法，请核对。', target: { itemId: items[0].id, attributeId: attribute().id } }, { level: 'warning', message: '分组为空。', target: { groupId: groups[2].id } }, { level: 'error', message: '总分与目标不符。' }];
  for (const mode of modes) {
    const calls = [], extra = { ...mode, validation, onIntent: intent => calls.push(intent) }, html = htmlFor(extra), nodes = capture(extra);
    for (const fact of validation) assert.equal((html.match(new RegExp(fact.message, 'g')) ?? []).length, 1);
    assert.match(html, /role="alert"/); assert.equal(controls(nodes, 'confirm')[0].props.disabled, true);
    controls(nodes, 'confirm')[0].props.onClick(); assert.equal(calls.length, 0);
    if (mode.view === 'workspace') { assert.ok(numeric(nodes, 0)); assert.equal(named(nodes, 'NumberFieldInput')[0].props['aria-invalid'], true); }
  }
});

test('equal descriptions, sources and disabled reasons appear once; titles have one visible owner', () => {
  const reason = '本轮编排暂不可修改。';
  const extra = { items: items.map(item => ({ ...item, description: '相同附加说明。' })), actions: Object.fromEntries(Object.keys(actions).map(key => [key, { disabledReason: reason }])), readOnlyReason: reason, onSelectionChange() {} };
  for (const mode of modes) {
    const html = htmlFor({ ...extra, ...mode });
    for (const text of [reason, '共同来源', '相同附加说明。', '编排调整不代表已保存或发布。', props.structure.title, ...items.map(item => item.title)]) assert.equal(html.split(text).length - 1, 1, text);
    const nodes = capture({ ...extra, ...mode }), reasons = controls(nodes, 'up').map(node => node.props['aria-describedby']);
    assert.equal(new Set(reasons).size, 1);
    assert.ok(html.includes(`id="${reasons[0]}"`));
  }
});

test('missing identities, read-only, historical, saving, conflict and unconfirmed states block handler-level mutations', () => {
  const cases = [ { onIntent: undefined }, { readOnlyReason: '' }, { structure: { ...props.structure, snapshot: '' } },
    { structure: { ...props.structure, baseVersion: undefined } }, { structure: { ...props.structure, id: '' } }, ...['saving', 'conflict', 'unconfirmed'].map(state => ({ save: { state } })) ];
  for (const extra of cases) {
    const calls = [], nodes = capture({ onIntent: intent => calls.push(intent), ...extra });
    for (const name of ['up', 'down', 'group-create', 'group-delete', 'confirm']) for (const button of controls(nodes, name)) { assert.equal(button.props.disabled, true); button.props.onClick(); }
    for (const input of controls(nodes, 'group-rename')) { assert.equal(input.props.readOnly, true); input.props.onChange(event('不可写')); }
    assert.equal(named(nodes, 'NumberField').length, 0); assert.equal(calls.length, 0);
  }
  const nodes = capture({ save: { state: 'submitted' } }); assert.equal(controls(nodes, 'confirm')[0].props.disabled, true);
});

test('confirm and open-item carry original object references, with no implicit save or publication', () => {
  const calls = [], extra = { save: { state: 'unsaved' }, changes: [], onIntent: intent => calls.push(intent) }, nodes = capture(extra), before = htmlFor(extra);
  controls(nodes, 'confirm')[0].props.onClick(); controls(nodes, 'open-item')[0].props.onClick();
  assert.deepEqual(calls, [{ ...context, type: 'confirm' }, { ...context, type: 'open-item', itemId: items[0].id, source: items[0].source }]);
  assert.notEqual(calls[1].source, items[0].source); assert.equal(htmlFor(extra), before);
  assert.match(before, /未保存/); assert.doesNotMatch(before, /已保存草稿|已发布/);
});

test('duplicate/blank references and missing group membership stop editing rather than losing or guessing items', () => {
  for (const extra of [ { items: [items[0], items[0]] }, { items: [{ ...items[0], id: '' }] }, { items: [{ ...items[0], groupId: 'missing' }] },
    { groups: [groups[0], groups[0]] }, { items: [{ ...items[0], attributes: [attribute(), attribute()] }] } ]) {
    const html = htmlFor(extra), nodes = capture(extra);
    assert.match(html, /编排暂不可用/); assert.doesNotMatch(html, /条目标题|opaque-|data-arranger-row/);
    assert.equal(controls(nodes, 'confirm')[0].props.disabled, true);
  }
});

test('compact only changes spacing; details collapse and optional navigation does not issue business intents', () => {
  const calls = [], trigger = {}, nodes = capture({ view: 'inline', onExpand: button => calls.push(button), details: h('p', null, '补充说明内容') });
  const button = buttonWithText(nodes, '展开编排');
  button.props.onClick({ currentTarget: trigger }); assert.deepEqual(calls, [trigger]);
  const back = buttonWithText(capture({ onBack: () => calls.push('back') }), '返回原位置');
  back.props.onClick(); assert.deepEqual(calls, [trigger, 'back']);
  assert.doesNotMatch(htmlFor(), /展开编排|返回原位置/);
  const html = htmlFor({ density: 'compact', details: h('p', null, '补充说明内容') });
  assert.match(html, /gap-3 p-3/); assert.match(html, /aria-expanded="false"/); assert.match(html, /text-item-title/);
});

test('paper and course fixtures share real example state, three uses, narrow layout, formula and independent saves', () => {
  for (const purpose of ['paper', 'course']) {
    const html = render(h(ArrangementExample, { purpose, narrow: true }));
    assert.match(html, /max-w-\[320px\]/); assert.equal((html.match(/data-agent-arranger-view=/g) ?? []).length, 3);
    assert.match(html, /独立保存状态示例/); assert.match(html, /固定示例/);
    if (purpose === 'paper') { assert.match(html, /<math/); assert.match(html, /目标 30 分不符/); assert.match(html, /位置与分值暂不可调整/); }
    else assert.match(html, /课程任务编排/);
  }
  assert.match(render(h(AgentStructureArrangerDemo)), /id="structure-arranger"/);
  const state = freeze(structuredClone(arrangementExamples.paper));
  const moved = applyArrangementExample(state, { ...context, type: 'move', itemId: 'q1', target: { groupId: 'application', index: 0 }, via: 'to-group' });
  assert.equal(moved.items.find(item => item.id === 'q1').groupId, 'application'); assert.equal(state.items[0].groupId, 'choice');
  const deleted = applyArrangementExample(state, { ...context, type: 'group-delete', groupId: 'choice' });
  assert.equal(deleted.items.length, state.items.length); assert.equal(deleted.items[0].groupId, null);
  assert.equal(applyArrangementExample(state, { ...context, type: 'confirm' }), state);
  assert.equal(applyArrangementExample(state, { ...context, type: 'open-item', itemId: 'q1', source: state.items[0].source }), state);
});

test('runtime stays independent of workspace models, timers, storage, content editors and sum calculations', async () => {
  const source = await readFile(new URL('../components/prism-next/agent-structure-arranger.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /localStorage|sessionStorage|setTimeout|setInterval|ole-school-workbench|\.reduce\(|contentEditable|Textarea|text-xs|text-sm|text-\[/);
  const page = await readFile(new URL('../components/prism-next/demos/learning-components.tsx', import.meta.url), 'utf8');
  assert.match(page, /<AgentStructureArrangerDemo\/>/);
});

test('example host reflects batch values after each edit, including multi-digit input, clearing and mixed selections', () => {
  const selected = ['q1', 'q2']; let state = arrangementExamples.paper;
  assert.equal(arrangementExampleBatchAttribute(state, selected, 'paper').value, 5);
  for (const value of [2, 25, 25.5, null]) {
    state = applyArrangementExample(state, { ...context, type: 'batch-set-attribute', itemIds: selected, attributeId: 'points', value });
    assert.equal(arrangementExampleBatchAttribute(state, selected, 'paper').value, value);
    assert.ok(state.items.filter(item => selected.includes(item.id)).every(item => item.attributes[0].value === value));
  }
  assert.equal(arrangementExampleBatchAttribute(arrangementExamples.paper, ['q1', 'q4'], 'paper').value, null);
});
