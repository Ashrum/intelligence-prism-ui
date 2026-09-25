import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = new URL('../.sites-runtime/candidate-picker/', import.meta.url);
await mkdir(runtime, { recursive: true });
const file = new URL('test-bundle.mjs', runtime);
const bundle = await build({ stdin: { contents: `export * from './components/prism-next/agent-candidate-picker'; export * from './components/prism-next/demos/agent-candidate-picker';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false });
await writeFile(file, bundle.outputFiles[0].text);
const { AgentCandidatePicker, AgentCandidatePickerDemo, CandidatePickerExample } = await import(file);
await rm(file);
const h = React.createElement;
const first = { id: 'opaque-candidate-a-0123456789', title: '根式计算题', type: '题目', summary: '含分式与根式', rationale: '讲评后巩固计算', source: '教师题单', status: 'available' };
const second = { ...first, id: 'opaque-candidate-b-0123456789', title: '函数性质题', rationale: '补充函数性质辨析', source: '校本练习' };
const third = { ...first, id: 'opaque-candidate-c-0123456789', title: '补充题' };
const invalid = { ...first, id: 'opaque-invalid', title: '已下架题', status: 'invalid', reason: '题目已下架。' };
const inCollection = { ...first, id: 'opaque-collected', title: '题篮中的题', status: 'in-collection' };
const unknown = { ...first, id: 'opaque-unknown', title: '待核对题', status: 'unknown', reason: '当前可用状态尚未核对。', source: null, rationale: null };
const restricted = { id: 'opaque-restricted', status: 'restricted', disclosure: { title: '受限题目', reason: '许可不包含当前范围。' } };
const base = { title: '候选示例', candidateSet: { id: 'opaque-set', version: 'opaque-version' }, candidates: [first, second], selectedIds: [], result: { state: 'ready' }, page: { total: null }, submission: { state: 'idle' }, confirm: {}, onIntent() {} };
const envelope = { candidateSetId: base.candidateSet.id, baseVersion: base.candidateSet.version };
const modes = [{}, { view: 'workspace' }, { density: 'compact' }, { view: 'workspace', density: 'compact' }];
const htmlFor = extra => render(h(AgentCandidatePicker, { ...base, ...extra }));
const textOf = html => html.replace(/<[^>]*>/g, '');
const freeze = value => { if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.freeze(value); Object.values(value).forEach(freeze); } return value; };

// Exercise actual component-created handlers. This does not establish browser focus/touch behavior.
function capture(extra) {
  const nodes = [], owned = new Set(['AgentCandidatePicker', 'CandidateRow', 'CandidateFacts', 'CandidateReplacement', 'CandidateFilters', 'DataRecordTable', 'RecordDetails']);
  function inspect(node) {
    if (Array.isArray(node)) return node.map(inspect);
    if (!React.isValidElement(node)) return node;
    nodes.push(node);
    if (typeof node.type === 'function' && owned.has(node.type.name)) return h(function Probe() { return inspect(node.type(node.props)); });
    return React.cloneElement(node, {}, React.Children.map(node.props.children, inspect));
  }
  render(inspect(h(AgentCandidatePicker, { ...base, ...extra })));
  return nodes;
}
const button = (nodes, text) => {
  const node = nodes.find(node => node.props.onClick && (node.props['aria-label'] === text || React.Children.toArray(node.props.children).includes(text)));
  assert.ok(node, `button: ${text}`); return node;
};
const checkbox = (nodes, title) => nodes.find(node => node.props.onCheckedChange && node.props['aria-label'] === `选择：${title}`);

test('SSR defaults and four presentations preserve supplied order, facts, totals and selected state', () => {
  assert.equal(htmlFor(), htmlFor({ view: 'inline', density: 'default' }));
  for (const mode of modes) {
    const html = htmlFor({ ...mode, candidates: freeze([second, first, invalid, restricted, inCollection, unknown]), selectedIds: freeze([first.id]) });
    for (const text of ['候选示例', '可选', '已选', '已在集合中', '失效', '受限', '状态未知', '选择依据：', '来源：', '题目已下架。', '许可不包含当前范围。', '当前可用状态尚未核对。', '来源：未确认', '选择依据：未提供', '总数未知']) assert.ok(textOf(html).includes(text), text);
    assert.ok(html.indexOf('aria-label="选择：函数性质题"') < html.indexOf('aria-label="选择：根式计算题"'));
    assert.doesNotMatch(html, /opaque-|已保存|已发布/);
    assert.equal((textOf(html).match(/选择或提交不代表已加入集合。/g) ?? []).length, 1);
    assert.match(html, new RegExp(`data-candidate-picker-density="${mode.density ?? 'default'}"`));
  }
});

test('item select/deselect emit only targets and never mutate controlled input or invent submission/membership', () => {
  for (const mode of modes) {
    const calls = [], ids = freeze([first.id]), extra = { ...mode, selectedIds: ids, onIntent: intent => calls.push(intent) };
    const before = htmlFor(extra), nodes = capture(extra);
    checkbox(nodes, second.title).props.onCheckedChange(true);
    checkbox(nodes, first.title).props.onCheckedChange(false);
    button(nodes, '提交本次选择').props.onClick();
    assert.deepEqual(calls, [
      { ...envelope, type: 'select', candidateIds: [second.id], scope: 'item' },
      { ...envelope, type: 'deselect', candidateIds: [first.id], scope: 'item' },
      { ...envelope, type: 'confirm', candidateIds: [first.id] },
    ]);
    assert.notStrictEqual(calls[2].candidateIds, ids);
    assert.equal(htmlFor(extra), before); assert.match(before, /尚未提交/); assert.doesNotMatch(before, /已在集合中|已提交/);
  }
});

test('batch actions target current eligible results; cancel-visible preserves off-page selection', () => {
  const calls = [], selectedIds = freeze([third.id, first.id]);
  const nodes = capture({ view: 'workspace', candidates: [first, invalid, second, inCollection, unknown, restricted], relatedCandidates: [third], selectedIds, onIntent: value => calls.push(value) });
  button(nodes, '选择当前可选项').props.onClick();
  button(nodes, '取消当前结果选择').props.onClick();
  button(nodes, '取消全部选择').props.onClick();
  assert.deepEqual(calls, [
    { ...envelope, type: 'select', candidateIds: [second.id], scope: 'visible' },
    { ...envelope, type: 'deselect', candidateIds: [first.id], scope: 'visible' },
    { ...envelope, type: 'deselect', candidateIds: [third.id, first.id], scope: 'selection' },
  ]);
  assert.deepEqual(selectedIds, [third.id, first.id]);
});

test('replacement binds original and alternative IDs plus candidate version; source/reason remain visible', () => {
  for (const mode of modes) {
    const calls = [], item = { ...invalid, alternatives: [{ candidateId: second.id, reason: '改用当前版本的练习。' }] };
    const extra = { ...mode, candidates: freeze([item]), relatedCandidates: freeze([second]), selectedIds: freeze([item.id]), onIntent: value => calls.push(value) };
    const before = htmlFor(extra);
    button(capture(extra), `用${second.title}替换${item.title}`).props.onClick();
    assert.deepEqual(calls, [{ ...envelope, type: 'replace', candidateId: item.id, replacementId: second.id }]);
    for (const text of ['替代项', '改用当前版本的练习。', '校本练习']) assert.ok(before.includes(text));
    assert.equal(htmlFor(extra), before);
  }
});

test('replacement rejects unknown/restricted/collected/selected targets, missing basis and unselected originals', () => {
  const calls = [];
  for (const target of [undefined, invalid, inCollection, restricted, unknown, first]) {
    const item = { ...first, alternatives: [{ candidateId: target?.id ?? 'missing', reason: '替代示例' }] };
    const nodes = capture({ candidates: [item], relatedCandidates: target ? [target] : [], selectedIds: [first.id], onIntent: value => calls.push(value) });
    const control = button(nodes, '替换本次选择'); assert.equal(control.props.disabled, true); control.props.onClick();
  }
  for (const extra of [{ selectedIds: [] }, { selectedIds: [first.id, second.id] }, { selectedIds: [first.id], disabledReason: '' }]) {
    const nodes = capture({ candidates: [{ ...first, alternatives: [{ candidateId: second.id, reason: '替代示例' }] }, second], ...extra, onIntent: value => calls.push(value) });
    const control = button(nodes, '替换本次选择'); assert.equal(control.props.disabled, true); control.props.onClick();
  }
  const noBasis = capture({ candidates: [{ ...first, alternatives: [{ candidateId: second.id, reason: '' }] }, second], selectedIds: [first.id], onIntent: value => calls.push(value) });
  button(noBasis, '替换本次选择').props.onClick();
  assert.deepEqual(calls, []);
});

test('query/filter/sort forward exact values without local matching, ordering, pagination or selection reset', () => {
  const calls = [], extra = { view: 'workspace', selectedIds: freeze([first.id]), candidates: freeze([second, first]), query: { value: '不存在的词' },
    filters: { fields: [{ id: 'opaque-filter', label: '题型', options: [{ value: 'opaque-a', label: '计算' }, { value: 'opaque-b', label: '辨析' }] }], value: { 'opaque-filter': 'opaque-a', untouched: 'preserved' } },
    sort: { label: '排列方式', options: [{ value: 'opaque-sort-a', label: '给定顺序' }, { value: 'opaque-sort-b', label: '倒序' }], value: 'opaque-sort-a', description: '按教师给定顺序' }, onIntent: value => calls.push(value) };
  const html = htmlFor(extra), nodes = capture(extra), bars = nodes.filter(node => node.type.name === 'FilterBar');
  nodes.find(node => node.type.name === 'Input').props.onChange({ currentTarget: { value: '  分式  ' } });
  bars[0].props.onChange({ 0: '1' }); bars[1].props.onChange({ 0: '1' }); bars[0].props.onChange({ 0: '999' });
  assert.deepEqual(calls, [
    { ...envelope, type: 'query', value: '  分式  ' },
    { ...envelope, type: 'filter', value: { 'opaque-filter': 'opaque-b', untouched: 'preserved' } },
    { ...envelope, type: 'sort', value: 'opaque-sort-b' },
  ]);
  assert.ok(html.indexOf('aria-label="选择：函数性质题"') < html.indexOf('aria-label="选择：根式计算题"'));
  assert.doesNotMatch(html, /opaque-/); assert.equal(htmlFor(extra), html);
});

test('load-more forwards the supplied opaque cursor without changing result count; loading guards and failure retry work', () => {
  for (const mode of modes) {
    const calls = [], extra = { ...mode, page: { total: null, more: { cursor: 'opaque-cursor', state: 'ready' } }, onIntent: value => calls.push(value) };
    const before = htmlFor(extra); button(capture(extra), '加载更多').props.onClick();
    assert.deepEqual(calls, [{ ...envelope, type: 'load-more', cursor: 'opaque-cursor' }]); assert.equal(htmlFor(extra), before);
    for (const more of [{ state: 'loading' }, { state: 'ready', disabledReason: '' }]) {
      button(capture({ ...extra, page: { total: null, more: { cursor: null, ...more } } }), '加载更多').props.onClick();
    }
    assert.equal(calls.length, 1);
    const failed = { ...extra, page: { total: null, more: { cursor: null, state: 'error', message: '追加候选失败，原结果保留。' } } };
    assert.match(htmlFor(failed), /role="alert"/); button(capture(failed), '重试加载更多').props.onClick();
    assert.deepEqual(calls.at(-1), { ...envelope, type: 'load-more', cursor: null });
  }
});

test('unknown/invalid totals never use the loaded length; zero and an explicit total remain distinct', () => {
  for (const total of [null, undefined, NaN, Infinity, -1, 2.5]) { const html = htmlFor({ page: { total } }); assert.match(html, /总数未知/); assert.doesNotMatch(html, /总数 2 项/); }
  for (const total of [0, 100]) assert.match(htmlFor({ page: { total } }), new RegExp(`总数 ${total} 项`));
});

test('loading/error/empty do not mount stale results or slots and preserve recoverable selected references', () => {
  for (const state of ['loading', 'error', 'empty']) {
    let slots = 0;
    const extra = { result: { state, message: '外部结果说明' }, selectedIds: [first.id], renderItem: () => { slots++; return '题面'; } };
    const html = htmlFor(extra); assert.equal(slots, 0); assert.match(html, /根式计算题|本次已选 1 项/);
    assert.doesNotMatch(html, /role="checkbox"|当前显示/);
    const calls = [], nodes = capture({ ...extra, onIntent: value => calls.push(value) });
    button(nodes, '提交本次选择').props.onClick();
    assert.equal(calls.length, state === 'empty' ? 1 : 0);
    button(nodes, `取消选择：${first.title}`).props.onClick(); assert.equal(calls.at(-1).type, 'deselect');
  }
});

test('submission facts never imply membership; pending/unknown block edits and duplicate submission', () => {
  for (const [state, label] of [['idle', '尚未提交'], ['submitting', '提交中'], ['unconfirmed', '回执未确认'], ['submitted', '已提交'], ['error', '提交失败']]) {
    const calls = [], extra = { view: 'workspace', selectedIds: [first.id], submission: { state, message: '外部提交记录' }, onIntent: value => calls.push(value) };
    const html = htmlFor(extra), nodes = capture(extra); assert.ok(html.includes(label)); assert.doesNotMatch(html, /已在集合中/);
    button(nodes, '提交本次选择').props.onClick();
    assert.equal(calls.length, ['idle', 'error'].includes(state) ? 1 : 0);
    if (['submitting', 'unconfirmed'].includes(state)) {
      checkbox(nodes, second.title).props.onCheckedChange(true); button(nodes, '取消全部选择').props.onClick(); button(nodes, '选择当前可选项').props.onClick(); assert.equal(calls.length, 0);
    }
  }
});

test('restricted disclosure wins over retained facts, suppresses slots, relations and all private fields', () => {
  const secret = { ...restricted, title: 'SECRET_TITLE', summary: 'SECRET_SUMMARY', source: 'SECRET_SOURCE', rationale: 'SECRET_RATIONALE', alternatives: [{ candidateId: second.id, reason: 'SECRET_ALTERNATIVE' }] };
  for (const mode of modes) {
    const rendered = [], extra = { ...mode, candidates: [secret], relatedCandidates: [{ ...first, id: secret.id, title: 'STALE_PRIVATE' }], selectedIds: [secret.id], renderItem: item => { rendered.push(item.id); return 'SECRET_SLOT'; } };
    const html = htmlFor(extra); assert.doesNotMatch(html, /SECRET_|STALE_PRIVATE|opaque-/); assert.match(html, /许可不包含当前范围。/); assert.deepEqual(rendered, []);
    const nodes = capture(extra); assert.equal(button(nodes, '提交本次选择').props.disabled, true);
  }
});

test('restricted replacement targets suppress relation explanations and content from stale facts', () => {
  const html = htmlFor({ candidates: [{ ...first, alternatives: [{ candidateId: restricted.id, reason: 'PRIVATE_RELATION' }] }, restricted], relatedCandidates: [{ ...second, id: restricted.id, title: 'PRIVATE_TITLE' }], selectedIds: [first.id] });
  assert.doesNotMatch(html, /PRIVATE_/); assert.match(html, /替代项：受限题目/);
});

test('stale/missing/duplicate selections block confirm but can be cancelled, including facts retained across pages', () => {
  for (const extra of [{ selectedIds: ['missing'] }, { selectedIds: [first.id, first.id] }, { selectedIds: [invalid.id], relatedCandidates: [invalid] }, { candidates: [first, { ...first, title: '重复对象' }], selectedIds: [first.id] }, { candidates: [], relatedCandidates: [first, first], selectedIds: [first.id] }]) {
    const calls = [], nodes = capture({ ...extra, onIntent: value => calls.push(value) });
    button(nodes, '提交本次选择').props.onClick(); assert.equal(calls.length, 0);
    button(nodes, '取消全部选择').props.onClick(); assert.deepEqual(calls[0], { ...envelope, type: 'deselect', candidateIds: extra.selectedIds, scope: 'selection' });
    assert.doesNotMatch(htmlFor(extra), /missing|opaque-/);
  }
  const calls = [], nodes = capture({ candidates: [second], relatedCandidates: [first], selectedIds: [first.id], onIntent: value => calls.push(value) });
  button(nodes, '提交本次选择').props.onClick(); assert.equal(calls[0].type, 'confirm');
});

test('missing receiver/version and explicitly empty disabled reasons guard actual handlers', () => {
  for (const extra of [{ onIntent: undefined }, { candidateSet: { id: '', version: 'v1' } }, { candidateSet: { id: 'set', version: '' } }, { disabledReason: '' }]) {
    const calls = [], nodes = capture({ view: 'workspace', selectedIds: [first.id], onIntent: value => calls.push(value), ...extra });
    checkbox(nodes, second.title).props.onCheckedChange(true); button(nodes, '选择当前可选项').props.onClick(); button(nodes, '取消全部选择').props.onClick(); button(nodes, '提交本次选择').props.onClick();
    assert.deepEqual(calls, []);
  }
  const calls = [], nodes = capture({ selectedIds: [first.id], confirm: { disabledReason: '' }, onIntent: value => calls.push(value) });
  button(nodes, '提交本次选择').props.onClick(); assert.deepEqual(calls, []);
});

test('slots receive domain-neutral items and view/density while facts and reasons remain outside the slot', () => {
  for (const mode of modes) {
    const calls = [], html = htmlFor({ ...mode, candidates: [first], renderItem: (item, context) => { calls.push([item, context]); return h('p', {}, '领域内容插槽'); } });
    assert.deepEqual(calls, [[first, { view: mode.view ?? 'inline', density: mode.density ?? 'default' }]]);
    for (const text of ['领域内容插槽', '选择依据：', '教师题单']) assert.ok(html.includes(text));
  }
});

test('controls retain labels/ARIA associations and keyboard/touch primitives in compact; supplementary details collapse', () => {
  const html = htmlFor({ view: 'workspace', density: 'compact', candidates: [first, invalid], details: 'SUPPLEMENTARY_DETAILS', query: { value: '' } });
  assert.match(html, /data-slot="checkbox"/); assert.match(html, /data-slot="label"/); assert.match(html, /pointer-coarse:min-h-11/); assert.match(html, /type="button"/);
  assert.doesNotMatch(html, /SUPPLEMENTARY_DETAILS/); assert.match(html, /aria-expanded="false"/);
  assert.equal((textOf(html).match(/题目已下架。/g) ?? []).length, 1, 'a visible reason is not repeated in hidden accessible text');
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]); assert.equal(new Set(ids).size, ids.length);
  for (const match of html.matchAll(/aria-describedby="([^"]+)"/g)) for (const id of match[1].split(' ')) assert.ok(ids.includes(id), `association ${id}`);
});

test('navigation forwards the original trigger, has no implicit submit and absent capabilities show no entries', () => {
  const calls = [], trigger = {};
  button(capture({ onExpand: value => calls.push(value) }), '展开筛选与选择').props.onClick({ currentTarget: trigger });
  button(capture({ view: 'workspace', onBack: () => calls.push('back') }), '返回原位置').props.onClick();
  assert.deepEqual(calls, [trigger, 'back']); assert.doesNotMatch(htmlFor({ confirm: undefined }), /展开筛选与选择|返回原位置|提交本次选择/);
});

test('two labelled demo groups cover QuestionCard math, generic entries, unknown totals, states and narrow layouts', async () => {
  for (const purpose of ['questions', 'learners']) {
    const html = render(h(CandidatePickerExample, { purpose, narrow: true }));
    for (const text of ['示例', '总数未知', '加载更多', 'max-w-[320px]', '结果状态示例', '载入提交回执', '载入加入记录', 'data-candidate-picker-view="inline"', 'data-candidate-picker-view="workspace"', 'data-candidate-picker-density="compact"']) assert.ok(html.includes(text), `${purpose}: ${text}`);
    assert.doesNotMatch(textOf(html), /意图|宿主|回调|适配器|opaque-/);
    if (purpose === 'questions') { assert.match(html, /prism-question/); assert.match(html, /<mfrac>/); assert.match(html, /替代依据/); assert.match(html, /失效/); assert.match(html, /受限/); assert.match(html, /已在集合中/); }
    else { assert.match(html, /林同学/); assert.match(html, /跨知识点辨析/); assert.match(html, /状态未知/); }
    await writeFile(new URL(`ssr-${purpose}.html`, runtime), html);
  }
  assert.match(render(h(AgentCandidatePickerDemo)), /id="candidate-picker"/);
  assert.match(await readFile(new URL('../components/prism-next/demos/learning-components.tsx', import.meta.url), 'utf8'), /<AgentCandidatePickerDemo\/>/);
});
