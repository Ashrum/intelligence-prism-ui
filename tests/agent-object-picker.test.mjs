import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = new URL('../.sites-runtime/object-picker/', import.meta.url);
await mkdir(runtime, { recursive: true });
const file = new URL('test-bundle.mjs', runtime);
const bundle = await build({ stdin: { contents: `export * from './components/prism-next/agent-object-picker'; export * from './components/prism-next/demos/agent-object-picker';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false });
await writeFile(file, bundle.outputFiles[0].text);
const { AgentObjectPicker, AgentObjectPickerDemo, ObjectPickerExample, objectPickerExamples } = await import(file);
await rm(file);
const h = React.createElement;
const first = { id: 'opaque-object-a-0123456789', name: '高二三班', description: '数学', status: 'available', recommendation: { reason: '本次备课安排', source: '教师课表' } };
const second = { id: 'opaque-object-b-0123456789', name: '高二四班', status: 'available', recent: true };
const third = { id: 'opaque-object-c-0123456789', name: '高二五班', status: 'available' };
const props = { title: '对象选择示例', objectType: { id: 'opaque-type', label: '班级' }, selection: { mode: 'single' }, candidates: [first, second, third], selectedIds: [], searchValue: '', result: { state: 'ready' }, onSelectionChange() {} };
const modes = [{}, { view: 'workspace' }, { density: 'compact' }, { view: 'workspace', density: 'compact' }];
const htmlFor = extra => render(h(AgentObjectPicker, { ...props, ...extra }));
const textOf = html => html.replace(/<[^>]*>/g, '');
const freeze = value => { if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.freeze(value); Object.values(value).forEach(freeze); } return value; };

// Render real components, capturing their actual callbacks. These are SSR/handler checks,
// not browser keyboard, popup focus, theme or Workspace acceptance evidence.
function capture(extra) {
  const nodes = [], owned = new Set(['AgentObjectPicker', 'PickerOption', 'PickerFacts', 'DataRecordTable', 'RecordDetails']);
  function inspect(node) {
    if (Array.isArray(node)) return node.map(inspect);
    if (!React.isValidElement(node)) return node;
    nodes.push(node);
    if (typeof node.type === 'function' && owned.has(node.type.name)) return h(function Probe() { return inspect(node.type(node.props)); });
    return React.cloneElement(node, {}, React.Children.map(node.props.children, inspect));
  }
  render(inspect(h(AgentObjectPicker, { ...props, ...extra })));
  return nodes;
}
const button = (nodes, text) => nodes.find(node => node.props.onClick && (node.props['aria-label'] === text || React.Children.toArray(node.props.children).filter(value => typeof value === 'string').join('') === text));
const combo = nodes => nodes.find(node => node.type.name === 'Combobox');
const checkbox = (nodes, name) => {
  const label = nodes.find(node => node.type.name === 'Label' && node.props.children === name);
  return nodes.find(node => node.type.name === 'Checkbox' && node.props.id === label?.props.htmlFor);
};

test('defaults and all presentations preserve frozen host selection without selecting recommendations automatically', () => {
  assert.equal(htmlFor(), htmlFor({ view: 'inline', density: 'default' }));
  const input = { candidates: freeze([first, second]), selectedIds: freeze([]) };
  for (const mode of modes) {
    const html = htmlFor({ ...input, ...mode });
    assert.match(html, /已选 0 项/); assert.match(html, /尚未选择/);
    assert.doesNotMatch(html, /已确认|已发布|已保存|aria-pressed="true"/);
    for (const opaque of [first.id, second.id, props.objectType.id]) assert.ok(!html.includes(opaque));
  }
});

test('single choice replaces the selection by intent only and confirm never changes the supplied value', () => {
  for (const mode of modes) {
    const calls = [], ids = freeze([first.id]), input = { ...mode, selectedIds: ids, onSelectionChange: value => calls.push(['select', value]), onConfirm: value => calls.push(['confirm', value]) };
    const before = htmlFor(input), nodes = capture(input);
    button(nodes, '选择：高二四班').props.onClick();
    button(nodes, '确认选择').props.onClick();
    assert.deepEqual(calls, [['select', [second.id]], ['confirm', [first.id]]]);
    assert.notStrictEqual(calls[1][1], ids); assert.equal(htmlFor(input), before);
    assert.doesNotMatch(htmlFor(input), /已确认|已提交|成功/);
  }
});

test('checkbox changes add/remove only the requested object and enforce a host maximum', () => {
  for (const mode of modes) {
    const calls = [], input = { ...mode, selection: { mode: 'multiple', max: 2 }, selectedIds: freeze([first.id]), onSelectionChange: ids => calls.push(ids) };
    const nodes = capture(input), before = htmlFor(input);
    checkbox(nodes, first.name).props.onCheckedChange(false);
    checkbox(nodes, second.name).props.onCheckedChange(true);
    assert.deepEqual(calls, [[], [first.id, second.id]]); assert.equal(htmlFor(input), before);
    const full = capture({ ...input, selectedIds: freeze([first.id, second.id]) });
    assert.equal(checkbox(full, third.name).props.disabled, true);
    checkbox(full, third.name).props.onCheckedChange(true); assert.equal(calls.length, 2);
    checkbox(full, first.name).props.onCheckedChange(false); assert.deepEqual(calls.at(-1), [second.id]);
    assert.match(htmlFor({ ...input, selectedIds: [first.id, second.id] }), /最多选择 2 项，请先取消其他选择/);
  }
});

test('over-limit, duplicate, missing and unavailable selected objects remain visible until a removal intent is handled', () => {
  for (const input of [
    { selectedIds: [first.id, second.id], selection: { mode: 'single' } },
    { selectedIds: [first.id, second.id], selection: { mode: 'multiple', max: 1 } },
    { selectedIds: [first.id, first.id], selection: { mode: 'multiple' } },
    { selectedIds: ['never-render-this-internal-id'], selection: { mode: 'multiple' } },
  ]) {
    const calls = [], extra = { ...input, selectedIds: freeze(input.selectedIds), onSelectionChange: ids => calls.push(ids), onConfirm: () => assert.fail('invalid confirmation') };
    const before = htmlFor(extra), nodes = capture(extra);
    assert.match(before, new RegExp(`已选 ${input.selectedIds.length} 项`));
    assert.equal(button(nodes, '确认选择').props.disabled, true); button(nodes, '确认选择').props.onClick();
    const remove = nodes.find(node => node.props.onClick && node.props['aria-label']?.startsWith('移除选择'));
    remove.props.onClick(); assert.equal(calls.length, 1); assert.equal(htmlFor(extra), before);
    assert.doesNotMatch(before, /never-render-this-internal-id/);
  }
});

test('zero and invalid maximums block additions and confirmation while removal remains possible', () => {
  for (const max of [0, -1, NaN, Infinity, 1.5]) {
    const calls = [], input = { selection: { mode: 'multiple', max }, selectedIds: [first.id], onSelectionChange: ids => calls.push(ids), onConfirm: () => assert.fail('invalid limit') };
    const nodes = capture(input);
    assert.equal(checkbox(nodes, second.name).props.disabled, true); checkbox(nodes, second.name).props.onCheckedChange(true);
    button(nodes, '确认选择').props.onClick(); assert.equal(calls.length, 0);
    button(nodes, `移除选择：${first.name}`).props.onClick(); assert.deepEqual(calls, [[]]);
  }
});

test('batch selection is atomic, respects remaining slots, and never changes off-page selections', () => {
  const offPage = { id: 'off-page', name: '高一一班', status: 'available' }, calls = [];
  const input = { view: 'workspace', selection: { mode: 'multiple', max: 4 }, selectedIds: freeze([offPage.id, first.id]), selectedCandidates: [offPage], onSelectionChange: ids => calls.push(ids) };
  const before = htmlFor(input), nodes = capture(input);
  button(nodes, '选择本页可选对象').props.onClick();
  button(nodes, '取消本页选择').props.onClick();
  assert.deepEqual(calls, [[offPage.id, first.id, second.id, third.id], [offPage.id]]); assert.equal(htmlFor(input), before);
  const over = { ...input, selection: { mode: 'multiple', max: 3 } };
  assert.match(htmlFor(over), /超过剩余名额，请逐项选择/);
  assert.equal(button(capture(over), '选择本页可选对象').props.disabled, true);
  button(capture(over), '选择本页可选对象').props.onClick(); assert.equal(calls.length, 2);
  assert.doesNotMatch(htmlFor({ selection: { mode: 'multiple' } }), /选择本页可选对象/);
});

test('no-permission, archived and unavailable reasons remain visible and protected in all densities', () => {
  const candidates = freeze([
    { id: 'restricted', status: 'restricted', disclosure: { name: '其他班级', reason: '任教范围之外' } },
    { id: 'archived', name: '旧班级', status: 'archived', reason: '记录已经归档' },
    { id: 'unavailable', name: '待核对班级', status: 'unavailable', reason: '数据暂不可用' },
  ]);
  for (const mode of modes) {
    const extra = { ...mode, candidates, selection: { mode: 'multiple' }, onExpand() {}, inlineLimit: 1, onSelectionChange: () => assert.fail('unselectable') };
    const html = htmlFor(extra), nodes = capture(extra);
    for (const text of ['无权限', '任教范围之外', '已归档', '记录已经归档', '不可用', '数据暂不可用']) assert.ok(html.includes(text), text);
    for (const name of ['其他班级', '旧班级', '待核对班级']) {
      const control = checkbox(nodes, name); assert.equal(control.props.disabled, true); assert.ok(control.props['aria-describedby']); control.props.onCheckedChange(true);
    }
    assert.equal(textOf(htmlFor({ ...extra, density: 'default' })), textOf(htmlFor({ ...extra, density: 'compact' })));
    assert.doesNotMatch(html, /truncate|line-clamp|data-slot="collapsible/);
  }
});

test('restricted candidates suppress injected private fields in list, summary, local matcher and search options', () => {
  const secret = 'PRIVATE_NAME_METADATA_AND_SOURCE', seen = [];
  const restricted = { ...first, id: 'never-render-restricted-id', status: 'restricted', name: secret, description: secret, recent: true, recommendation: { reason: secret, source: secret }, disclosure: { name: '受限对象', reason: '当前不可访问' } };
  for (const mode of modes) {
    const extra = { ...mode, candidates: [restricted], selectedIds: [restricted.id], onConfirm: () => assert.fail('restricted'), filtering: { mode: 'local', matches: item => { seen.push(item); return true } } };
    const html = htmlFor(extra); assert.ok(!html.includes(secret)); assert.ok(!html.includes(restricted.id)); assert.match(html, /受限对象.*当前不可访问/);
    assert.doesNotMatch(html, /推荐|最近使用/);
    button(capture(extra), '确认选择').props.onClick();
  }
  for (const item of seen) assert.deepEqual(Object.keys(item).sort(), ['disclosure', 'id', 'status']);
});

test('fresh candidate restrictions override stale selected summaries; unresolved selections are never silently dropped', () => {
  const restricted = { id: first.id, status: 'restricted', disclosure: { name: '受限对象', reason: '当前权限已变化' } };
  const input = { candidates: [restricted], selectedCandidates: [first], selectedIds: [first.id], onConfirm: () => assert.fail('stale access') };
  assert.doesNotMatch(htmlFor(input), /高二三班|教师课表/); assert.match(htmlFor(input), /已选 1 项.*当前权限已变化/);
  button(capture(input), '确认选择').props.onClick();
  const offPage = { candidates: [], selectedCandidates: [first], selectedIds: [first.id], result: { state: 'empty', message: '没有匹配结果' }, onConfirm() {} };
  assert.match(htmlFor(offPage), /高二三班/); assert.equal(button(capture(offPage), '确认选择').props.disabled, false);
  assert.match(htmlFor({ ...offPage, selectedCandidates: [] }), /对象暂不可确认/);
});

test('recommendations require both a reason and its source, with no inferred or default recommendations', () => {
  for (const mode of modes) {
    assert.match(htmlFor(mode), />推荐<.*依据：本次备课安排；来源：教师课表/);
    for (const recommendation of [{ reason: '不能冒充的推荐理由' }, { reason: '理由', source: '  ' }, { source: '课表', reason: '' }]) {
      const html = htmlFor({ ...mode, candidates: [{ ...first, recommendation }] });
      assert.doesNotMatch(html, />推荐<|不能冒充的推荐理由/); assert.match(html, /推荐依据未提供/);
    }
    assert.doesNotMatch(htmlFor({ ...mode, candidates: [{ ...first, recommendation: undefined }] }), />推荐<|依据：|来源：/);
  }
});

test('inline quick candidates follow host recommendation/recent flags; without expansion every candidate is reachable', () => {
  const input = { onExpand() {}, inlineLimit: 1 };
  assert.match(htmlFor(input), /高二三班/); assert.doesNotMatch(htmlFor(input), /高二四班|高二五班/);
  assert.match(htmlFor({ ...input, selectedIds: [third.id] }), /高二五班/);
  assert.match(htmlFor({ ...input, inlineLimit: 2 }), /高二四班/);
  assert.match(htmlFor({ ...input, onExpand: undefined }), /高二五班/);
  assert.match(htmlFor({ ...input, candidates: [third] }), /暂无快捷候选/);
  assert.match(htmlFor({ ...input, view: 'workspace' }), /高二五班/);
});

test('host search and filtering only call back, preserve values and do not invoke implicit Combobox filtering', () => {
  const calls = [], filters = freeze({ fields: [{ id: 'subject', label: '学科', options: [{ value: 'math', label: '数学' }] }], value: { subject: 'math' }, onChange: value => calls.push(['filters', value]) });
  const input = { view: 'workspace', searchValue: '完全不匹配的外部查询', filters, onSearchChange: value => calls.push(['search', value]) };
  const before = htmlFor(input), nodes = capture(input), search = combo(nodes);
  for (const name of [first.name, second.name, third.name]) assert.ok(before.includes(name));
  assert.equal(search.props.filter, null); assert.equal(search.props.inputValue, input.searchValue);
  search.props.onInputValueChange(' 新查询 ', { reason: 'input-change' });
  for (const reason of ['item-press', 'input-clear', 'none']) search.props.onInputValueChange('不该改写查询', { reason });
  const next = freeze({ subject: 'physics' }); nodes.find(node => node.type.name === 'FilterBar').props.onChange(next);
  assert.deepEqual(calls, [['search', ' 新查询 '], ['filters', next]]); assert.equal(htmlFor(input), before);
});

test('local filtering runs only on an explicit local declaration and never mutates controlled selections', () => {
  const calls = [], selectedIds = freeze([second.id]);
  const matches = (item, query) => { calls.push([item.id, query]); return item.name?.includes(query.search) && query.filters.subject === 'math' };
  const input = { view: 'workspace', selectedIds, searchValue: '三班', filters: { fields: [], value: { subject: 'math' } }, filtering: { mode: 'host', matches } };
  htmlFor(input); assert.equal(calls.length, 0);
  const html = htmlFor({ ...input, filtering: { mode: 'local', matches } });
  assert.equal(calls.length, 3); assert.deepEqual(calls[0][1], { search: '三班', filters: { subject: 'math' } });
  assert.match(html, /高二三班/); assert.doesNotMatch(html, /高二五班/); assert.match(html, /已选 1 项.*高二四班/);
  assert.deepEqual(selectedIds, [second.id]);
});

test('Combobox selection uses the same single/multiple limit and status guards as the visible controls', () => {
  const calls = [], input = { view: 'workspace', selection: { mode: 'multiple', max: 1 }, selectedIds: [], onSelectionChange: ids => calls.push(ids) };
  combo(capture(input)).props.onValueChange('0'); assert.deepEqual(calls, [[first.id]]);
  const full = { ...input, selectedIds: [first.id] }; combo(capture(full)).props.onValueChange('1');
  combo(capture(full)).props.onValueChange('99'); combo(capture(full)).props.onValueChange(null); assert.equal(calls.length, 1);
  const archived = { ...first, status: 'archived', reason: '已归档' };
  combo(capture({ ...input, candidates: [archived] })).props.onValueChange('0'); assert.equal(calls.length, 1);
});

test('loading/empty/error reflect only host facts, suppress stale result controls and retain selected summaries', () => {
  for (const mode of modes) for (const [state, message] of [['loading', '候选正在加载'], ['empty', '没有匹配结果'], ['error', '名单服务暂不可用']]) {
    const extra = { ...mode, result: { state, message }, selectedIds: [first.id], onConfirm() {} };
    const html = htmlFor(extra), nodes = capture(extra);
    assert.match(html, new RegExp(message)); assert.match(html, /已选 1 项.*高二三班/);
    assert.equal(button(nodes, `选择：${second.name}`), undefined); assert.doesNotMatch(html, /高二五班/);
    if (state === 'loading') assert.match(html, /aria-busy="true"/);
    if (state === 'error') assert.match(html, /role="alert"/);
    assert.equal(button(nodes, '确认选择').props.disabled, state !== 'empty');
    assert.equal(htmlFor(extra), html);
  }
});

test('load more and expansion are guarded intents only, and absent capabilities have no entrance', () => {
  const calls = [], trigger = {}, input = { onExpand: value => calls.push(value), onBack: () => calls.push('back'), loadMore: { onLoad: () => calls.push('more') } };
  button(capture(input), '更多选择').props.onClick({ currentTarget: trigger });
  const full = { ...input, view: 'workspace' }, before = htmlFor(full);
  button(capture(full), '返回原位置').props.onClick(); button(capture(full), '加载更多').props.onClick();
  assert.deepEqual(calls, [trigger, 'back', 'more']); assert.equal(htmlFor(full), before);
  assert.doesNotMatch(htmlFor(), /更多选择|返回原位置|加载更多|确认选择/); assert.doesNotMatch(htmlFor(full), /更多选择/);
  for (const state of [{ loading: true }, { disabledReason: '本次查询已结束' }]) {
    const extra = { ...full, loadMore: { ...input.loadMore, ...state } }, node = button(capture(extra), '加载更多');
    assert.equal(node.props.disabled, true); node.props.onClick();
  }
  assert.equal(calls.length, 3);
});

test('global read-only and missing receivers guard direct callbacks, while their reasons remain visible', () => {
  const input = { view: 'workspace', selection: { mode: 'multiple' }, selectedIds: [first.id], disabledReason: '当前对话只读', onSelectionChange: () => assert.fail('disabled'), onConfirm: () => assert.fail('disabled') };
  const nodes = capture(input);
  checkbox(nodes, second.name).props.onCheckedChange(true); combo(nodes).props.onValueChange('1');
  for (const text of ['选择本页可选对象', '取消本页选择', '确认选择', `移除选择：${first.name}`]) {
    const node = button(nodes, text); assert.equal(node.props.disabled, true); assert.ok(node.props['aria-describedby']); node.props.onClick();
  }
  assert.match(htmlFor(input), /当前对话只读/);
  assert.match(htmlFor({ onSelectionChange: undefined }), /当前仅可查看选择/);
  assert.equal(button(capture({ onSelectionChange: undefined }), `选择：${first.name}`).props.disabled, true);
  const noSearch = capture({ view: 'workspace' }).find(node => node.type.name === 'ComboboxInput');
  assert.equal(noSearch.props.readOnly, true); assert.match(htmlFor({ view: 'workspace' }), /搜索暂不可用/);
});

test('invalid or duplicate candidate identity cannot be selected individually, in search, or in a batch', () => {
  const input = { view: 'workspace', selection: { mode: 'multiple' }, candidates: [{ ...first, id: '' }, second, { ...second, name: '重复项' }], onSelectionChange: () => assert.fail('ambiguous target') };
  const nodes = capture(input);
  for (const name of [first.name, second.name, '重复项']) { assert.equal(checkbox(nodes, name).props.disabled, true); checkbox(nodes, name).props.onCheckedChange(true); }
  combo(nodes).props.onValueChange('0'); combo(nodes).props.onValueChange('1');
  button(nodes, '选择本页可选对象').props.onClick();
});

test('native keyboard controls retain labels, focusability and reason relationships without clickable table rows', () => {
  for (const mode of modes) {
    const input = { ...mode, selection: { mode: 'multiple' }, candidates: [first, { ...second, status: 'archived', reason: '归档原因' }] }, html = htmlFor(input);
    assert.match(html, /role="checkbox"/); assert.match(html, /tabindex="0"/);
    // Resolve references within the same render; instrumentation changes React's generated IDs.
    for (const match of html.matchAll(/aria-(?:labelledby|describedby)="([^"]+)"/g)) {
      for (const reference of match[1].split(' ')) assert.ok(html.includes(`id="${reference}"`), reference);
    }
    assert.doesNotMatch(html, /<tr[^>]*(?:tabindex|role="button")/);
    if (mode.view === 'workspace') { assert.match(html, /role="combobox"/); assert.match(html, /搜索班级<\/label>/); }
    for (const node of capture({ ...input, onConfirm() {}, onExpand() {} }).filter(node => node.type.name === 'Button')) assert.equal(node.props.type, 'button');
  }
});

test('at most one boundary notice stays visible and supplementary details are closed', () => {
  const input = { notice: '唯一边界提示', details: h('p', null, '补充说明全文') };
  for (const mode of modes) {
    const html = htmlFor({ ...input, ...mode });
    assert.equal(html.split('唯一边界提示').length - 1, 1); assert.doesNotMatch(html, /补充说明全文/);
    const gate = capture({ ...input, ...mode }).find(node => node.type.name === 'Collapsible');
    assert.equal(gate.props.defaultOpen, false); assert.match(render(React.cloneElement(gate, { open: true })), /补充说明全文/);
  }
});

test('both labelled examples cover three presentations, narrow layout and required restrictions without implementation jargon', async () => {
  for (const purpose of ['classes', 'students']) {
    const html = render(h(ObjectPickerExample, { purpose, narrow: true }));
    for (const text of ['固定示例', 'data-object-picker-view="inline"', 'data-object-picker-view="workspace"', 'data-object-picker-density="compact"', 'max-w-[320px]', '推荐', '来源：']) assert.ok(html.includes(text), text);
    assert.doesNotMatch(textOf(html), /宿主|受控|回调|意图|example-/);
    if (purpose === 'classes') assert.match(html, /单选.*无权限/);
    else { assert.match(html, /最多选择 5 项/); assert.match(html, /已归档/); assert.match(html, /不能加入本次名单/); }
    await writeFile(new URL(`example-${purpose}.html`, runtime), html);
    for (const mode of modes) await writeFile(new URL(`${purpose}-${mode.view ?? 'inline'}-${mode.density ?? 'default'}.html`, runtime), htmlFor({ ...objectPickerExamples[purpose], ...mode, onExpand() {} }));
  }
  const html = render(h(AgentObjectPickerDemo));
  assert.match(html, /id="object-picker"/); assert.match(html, /选择班级示例/); assert.match(html, /选择学生示例/);
});

test('public types require restriction reasons and recommendation sources and exclude restricted private metadata', async () => {
  const fixture = new URL('type-contract.ts', runtime);
  await writeFile(fixture, `import type { AgentObjectCandidate, AgentObjectSelection } from '../../components/prism-next/agent-object-picker';
const ok: AgentObjectCandidate = { id: 'r', status: 'restricted', disclosure: { name: '受限对象', reason: '不可访问' } };
// @ts-expect-error restricted data must not carry private metadata
const privateData: AgentObjectCandidate = { ...ok, name: '私密名称' };
// @ts-expect-error nonselectable states require a reason
const noReason: AgentObjectCandidate = { id: 'a', status: 'archived', name: '已归档' };
// @ts-expect-error recommendation must declare its source
const noSource: AgentObjectCandidate = { id: 'a', status: 'available', name: '班级', recommendation: { reason: '理由' } };
// @ts-expect-error single mode cannot declare a multiple limit
const singleLimit: AgentObjectSelection = { mode: 'single', max: 5 };
void [ok, privateData, noReason, noSource, singleLimit];
`);
  try {
    const config = ts.readConfigFile(`${root}tsconfig.json`, ts.sys.readFile);
    const options = ts.parseJsonConfigFileContent(config.config, ts.sys, root).options;
    const program = ts.createProgram([fileURLToPath(fixture)], { ...options, noEmit: true, incremental: false });
    const diagnostics = ts.getPreEmitDiagnostics(program);
    assert.deepEqual(diagnostics.map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n')), []);
  } finally { await rm(fixture); }
});
