import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = new URL('../.sites-runtime/resource-retriever/', import.meta.url);
await mkdir(runtime, { recursive: true });
const file = new URL('test-bundle.mjs', runtime);
const bundle = await build({ stdin: { contents: `export * from './components/prism-next/agent-resource-retriever'; export * from './components/prism-next/demos/agent-resource-retriever';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false });
await writeFile(file, bundle.outputFiles[0].text);
const { AgentResourceRetriever, ResourceRetrieverExample, AgentResourceRetrieverDemo } = await import(file);
await rm(file);
const h = React.createElement;
const unknown = { state: 'unknown' }, absent = { state: 'absent' };
const first = {
  id: 'opaque-resource-a-0123456789', version: 'opaque-version-a', title: '勾股定理面积图', kind: 'image', summary: '观察面积关系。',
  source: { id: 'opaque-source-a', label: '校本资源库', location: '几何单元' }, license: { state: 'available', name: '教学使用范围' },
  versionLabel: '素材 v1', date: '2026-09-26', applicability: '八年级数学', format: 'SVG', duration: '不适用', size: '12 KB',
  facts: { hit: { state: 'confirmed', description: '本次库内检索' }, preview: absent, read: unknown, context: absent, citation: unknown },
  actions: { preview: {}, read: {}, unread: {}, 'open-source': {} },
};
const second = { ...first, id: 'opaque-resource-b-0123456789', title: '勾股定理文章', kind: 'article' };
const base = { title: '教学资源', resourceSet: { id: 'opaque-set', version: 'opaque-query-v1' }, resources: [first], query: { value: '勾股定理' }, scope: '八年级 / 勾股定理', result: { state: 'ready' }, page: { total: null }, onIntent() {} };
const envelope = { resourceSetId: base.resourceSet.id, baseVersion: base.resourceSet.version };
const modes = [{}, { view: 'workspace' }, { density: 'compact' }, { view: 'workspace', density: 'compact' }];
const htmlFor = extra => render(h(AgentResourceRetriever, { ...base, ...extra }));
const textOf = html => html.replace(/<[^>]*>/g, '');
const occurrences = (text, phrase) => text.split(phrase).length - 1;
const freeze = value => { if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.freeze(value); Object.values(value).forEach(freeze); } return value; };
const activated = (resource = first, state = 'ready') => ({ resourceId: resource.id, resourceVersion: resource.version, requestedBy: 'user', state });

// Actual component-created handlers, including their disabled guards. No browser claim.
function capture(extra) {
  const nodes = [], owned = new Set(['AgentResourceRetriever', 'ResourceFacts', 'ResourceLicense', 'ResourceActions', 'ResourceFilters', 'RecordDetails']);
  function inspect(node) {
    if (Array.isArray(node)) return node.map(inspect);
    if (!React.isValidElement(node)) return node;
    nodes.push(node);
    if (typeof node.type === 'function' && owned.has(node.type.name)) return h(function Probe() { return inspect(node.type(node.props)); });
    return React.cloneElement(node, {}, React.Children.map(node.props.children, inspect));
  }
  render(inspect(h(AgentResourceRetriever, { ...base, ...extra })));
  return nodes;
}
const buttons = (nodes, label) => nodes.filter(node => node.props.onClick && React.Children.toArray(node.props.children).includes(label));
const button = (nodes, label) => { const node = buttons(nodes, label)[0]; assert.ok(node, label); return node; };
const filterBars = nodes => nodes.filter(node => node.type?.name === 'FilterBar');

test('resource SSR supports both views and both densities with the same independent facts and supplied order', () => {
  assert.equal(htmlFor(), htmlFor({ view: 'inline', density: 'default' }));
  for (const mode of modes) {
    const html = htmlFor({ ...mode, resources: freeze([second, first]) }), text = textOf(html);
    for (const phrase of ['命中：已命中', '预览：未预览', '读取：状态未确认', 'Agent 本次参考：未参考', '成果引用：状态未确认', '校本资源库', '教学使用范围', '总数未知']) assert.ok(text.includes(phrase), phrase);
    assert.ok(text.indexOf(second.title) < text.indexOf(first.title));
    assert.equal(occurrences(text, first.title), 1);
    assert.match(html, new RegExp(`data-resource-retriever-view="${mode.view ?? 'inline'}"`));
    assert.match(html, new RegExp(`data-resource-retriever-density="${mode.density ?? 'default'}"`));
    assert.doesNotMatch(html, /opaque-|意图|宿主|回调|适配器/);
    assert.equal(occurrences(text, '命中、预览、读取、Agent 本次参考与成果引用分别记录。'), 1);
  }
});

test('hit, preview, read, current context and output citation do not imply one another', () => {
  for (const mode of modes) {
    for (const key of ['hit', 'preview', 'read', 'context', 'citation']) {
      const resource = { ...first, facts: { hit: unknown, preview: unknown, read: unknown, context: unknown, citation: unknown, [key]: { state: 'confirmed', description: `独立${key}记录`, version: '对应记录版本', location: '对应记录位置' } } };
      const text = textOf(htmlFor({ ...mode, resources: [resource] }));
      assert.equal(occurrences(text, '状态未确认'), 4);
      assert.equal(occurrences(text, '对应记录版本'), 1);
      assert.equal(occurrences(text, '对应记录位置'), 1);
    }
  }
});

test('absent, unknown and unavailable evidence remain distinct in compact and full presentations', () => {
  for (const mode of modes) {
    const text = textOf(htmlFor({ ...mode, resources: [{ ...first, facts: { hit: absent, preview: unknown, read: { state: 'unavailable', description: '记录库离线' }, context: absent, citation: absent } }] }));
    for (const phrase of ['命中：未命中', '预览：状态未确认', '读取：记录暂不可用', '记录库离线', 'Agent 本次参考：未参考', '成果引用：未引用']) assert.ok(text.includes(phrase), phrase);
  }
});

test('all resource actions bind retrieval and resource versions and never change input evidence', () => {
  for (const mode of modes) {
    const resource = freeze({ ...first, actions: { ...first.actions, 'request-permission': {} } }), calls = [];
    const extra = { ...mode, resources: freeze([resource]), onIntent: intent => calls.push(intent) }, before = htmlFor(extra), nodes = capture(extra);
    for (const label of ['预览', '读取并引用到上下文', '移出本次上下文', '打开来源', '申请许可']) button(nodes, label).props.onClick();
    assert.deepEqual(calls, ['preview', 'read', 'unread', 'open-source', 'request-permission'].map(type => ({ ...envelope, type, resourceId: first.id, resourceVersion: first.version, sourceId: first.source.id })));
    assert.equal(htmlFor(extra), before);
    assert.equal(resource.facts.read.state, 'unknown'); assert.equal(resource.facts.context.state, 'absent');
  }
});

test('license display never grants or denies a capability and permission requests require an explicit declaration', () => {
  for (const license of [{ state: 'available', name: null }, { state: 'restricted', name: '限用', reason: '仅准课堂查看' }, { state: 'confirmation-required', name: null, reason: '请核对范围' }, { state: 'unknown', name: null }]) {
    const calls = [], resource = { ...first, license, actions: { read: {} }, version: null };
    const nodes = capture({ resources: [resource], onIntent: intent => calls.push(intent) });
    assert.equal(buttons(nodes, '申请许可').length, 0);
    assert.equal(buttons(nodes, '预览').length, 0);
    button(nodes, '读取并引用到上下文').props.onClick();
    assert.equal(calls.length, 1); assert.equal(calls[0].resourceVersion, null);
  }
  const text = textOf(htmlFor({ resources: [{ ...first, license: { state: 'unknown', name: null }, actions: {} }] }));
  assert.ok(text.includes('许可：未知'));
});

test('shared source and license prose appears once; exact identity and differing license reasons do not merge', () => {
  const reason = '只能在当前学校的课堂中使用。';
  const resource = { ...first, license: { state: 'restricted', name: '课堂许可', reason }, actions: { read: { disabledReason: reason }, unread: { disabledReason: reason } } };
  for (const mode of modes) {
    const html = htmlFor({ ...mode, resources: [resource, { ...resource, id: second.id, title: second.title }] }), text = textOf(html);
    assert.equal(occurrences(text, '校本资源库'), 1); assert.equal(occurrences(text, reason), 1);
    assert.equal(occurrences(text, first.title), 1); assert.equal(occurrences(text, second.title), 1);
    assert.ok(text.includes('资源 1、2')); assert.match(html, /aria-describedby="[^"]+-license-0"/);
  }
  const text = textOf(htmlFor({ resources: [resource, { ...resource, id: second.id, title: second.title, source: { ...first.source, id: 'another-source' }, license: { ...resource.license, reason: '仅限个人备课' }, actions: {} }] }));
  assert.equal(occurrences(text, '校本资源库'), 2); assert.ok(text.includes('仅限个人备课'));
});

test('a shared disabled reason is adjacent once and protects every affected handler including empty reasons', () => {
  for (const reason of ['正在核对原读取请求。', '']) {
    const calls = [], resource = { ...first, actions: { read: { disabledReason: reason }, unread: { disabledReason: reason }, 'request-permission': { disabledReason: reason } } };
    const nodes = capture({ resources: [resource], onIntent: intent => calls.push(intent) });
    for (const label of ['读取并引用到上下文', '移出本次上下文', '申请许可']) { const node = button(nodes, label); assert.equal(node.props.disabled, true); node.props.onClick(); }
    assert.equal(calls.length, 0);
    assert.equal(occurrences(textOf(htmlFor({ resources: [resource] })), reason || '当前不可操作。'), 1);
  }
});

test('partial source failures retain successful results and never substitute loaded length for unknown total', () => {
  for (const mode of modes) {
    const html = htmlFor({ ...mode, resources: [first, second], sourceFailures: [{ source: { id: 'opaque-failure', label: '外部教材库' }, message: '暂时不可连接' }] }), text = textOf(html);
    for (const phrase of [first.title, second.title, '当前显示 2 项', '总数未知', '部分来源失败', '外部教材库：暂时不可连接']) assert.ok(text.includes(phrase), phrase);
    assert.doesNotMatch(html, /总数 2 项|opaque-failure/);
  }
});

test('total zero and explicit totals render as supplied; invalid totals remain unknown', () => {
  for (const total of [null, -1, NaN, Infinity, 1.5]) assert.ok(htmlFor({ page: { total } }).includes('总数未知'));
  for (const total of [0, 17]) assert.ok(textOf(htmlFor({ page: { total, label: '第二批' } })).includes(`总数 ${total} 项 · 第二批`));
});

test('loading, empty and error never render stale resource content or mount preview media', () => {
  for (const state of ['loading', 'empty', 'error']) for (const mode of modes) {
    let mounts = 0;
    const html = htmlFor({ ...mode, result: { state, message: '当前检索状态说明' }, preview: activated(), renderPreview: () => { mounts++; return h('img', { src: 'https://invalid.example/media.png' }); } });
    assert.equal(mounts, 0); assert.doesNotMatch(html, /勾股定理面积图|media.png|读取并引用到上下文/);
    assert.ok(textOf(html).includes('当前显示 0 项')); assert.ok(html.includes('当前检索状态说明'));
  }
});

test('preview slot only mounts for an explicit user activation, current unique identity, matching version and allowed capability', () => {
  const scenarios = [null, { ...activated(), requestedBy: undefined }, { ...activated(), resourceVersion: 'old' }, { ...activated(), resourceId: 'missing' }, activated(first, 'loading'), activated(first, 'error')];
  for (const preview of scenarios) {
    let mounts = 0; htmlFor({ preview, renderPreview: () => { mounts++; return h('p', null, '预览正文'); } }); assert.equal(mounts, 0);
  }
  for (const extra of [{ resources: [first, first] }, { resources: [{ ...first, actions: {} }] }, { resources: [{ ...first, actions: { preview: { disabledReason: '许可已变化' } } }] }, { disabledReason: '当前内容不可用' }]) {
    let mounts = 0; const html = htmlFor({ ...extra, preview: activated(), renderPreview: () => { mounts++; return h('p', null, '预览正文'); } });
    assert.equal(mounts, 0); assert.ok(html.includes('预览对应的资源、版本或可用能力已变化'));
  }
});

test('ready preview mounts once without marking any evidence confirmed or duplicating the resource title', () => {
  for (const mode of modes) {
    const calls = [];
    const html = htmlFor({ ...mode, preview: activated(), renderPreview: (resource, context) => { calls.push({ resource, context }); return h('p', null, '被动预览内容'); } });
    assert.equal(calls.length, 1); assert.equal(calls[0].resource, first);
    assert.deepEqual(calls[0].context, { view: mode.view ?? 'inline', density: mode.density ?? 'default' });
    const text = textOf(html); assert.equal(occurrences(text, first.title), 1);
    for (const phrase of ['预览：未预览', '读取：状态未确认', 'Agent 本次参考：未参考', '成果引用：状态未确认']) assert.ok(text.includes(phrase), phrase);
  }
});

test('preview loading/error messages do not alter resource facts', () => {
  for (const [state, phrase] of [['loading', '正在加载预览'], ['error', '预览失败']]) {
    const text = textOf(htmlFor({ preview: activated(first, state) })); assert.ok(text.includes(phrase)); assert.ok(text.includes('预览：未预览'));
  }
});

test('workspace query/filter/sort emit raw values and copied selections without running retrieval', () => {
  const calls = [], filters = freeze({ fields: [{ id: 'opaque-filter', label: '资源类型', options: [{ value: 'opaque-all', label: '全部' }, { value: 'opaque-video', label: '视频' }] }], value: { 'opaque-filter': 'opaque-all', unchanged: 'keep' } });
  const sort = freeze({ label: '排列方式', options: [{ value: 'opaque-date', label: '日期' }, { value: 'opaque-title', label: '名称' }], value: 'opaque-date' });
  const extra = { view: 'workspace', filters, sort, onIntent: intent => calls.push(intent) }, before = htmlFor(extra), nodes = capture(extra);
  const input = nodes.find(node => node.props.onChange && node.props.value === base.query.value);
  input.props.onChange({ currentTarget: { value: '  新查询  ' } });
  const bars = filterBars(nodes); assert.equal(bars.length, 2);
  bars[0].props.onChange({ 0: '1' }); bars[1].props.onChange({ 0: '1' });
  assert.deepEqual(calls, [{ ...envelope, type: 'query', value: '  新查询  ' }, { ...envelope, type: 'filter', value: { 'opaque-filter': 'opaque-video', unchanged: 'keep' } }, { ...envelope, type: 'sort', value: 'opaque-title' }]);
  assert.notStrictEqual(calls[1].value, filters.value); assert.equal(htmlFor(extra), before); assert.doesNotMatch(before, /opaque-/);
  assert.equal(filterBars(capture({ filters, sort })).length, 0);
});

test('filter guards reject unknown fields/options and ambiguous metadata without replacing unknown current values', () => {
  const calls = [], filters = { fields: [{ id: 'type', label: '类型', options: [{ value: 'all', label: '全部' }] }], value: { type: 'not-provided' } };
  const nodes = capture({ view: 'workspace', filters, onIntent: value => calls.push(value) }), bar = filterBars(nodes)[0];
  bar.props.onChange({ 0: '999' }); bar.props.onChange({ 5: '0' }); bar.props.onChange({ 0: '' });
  assert.equal(calls.length, 0); assert.ok(htmlFor({ view: 'workspace', filters }).includes('当前选项未列出'));
  for (const fields of [[filters.fields[0], filters.fields[0]], [{ ...filters.fields[0], options: [{ value: 'all', label: '一' }, { value: 'all', label: '二' }] }]]) {
    const html = htmlFor({ view: 'workspace', filters: { ...filters, fields } }); assert.ok(html.includes('筛选选项信息未确认。'));
  }
});

test('load-more retains the provided cursor, supports retry and respects loading/error-query and empty disabled reasons', () => {
  for (const cursor of ['opaque-next', null]) for (const state of ['ready', 'error']) {
    const calls = [], page = freeze({ total: null, more: { cursor, state, message: '保留原结果' } });
    const extra = { page, onIntent: intent => calls.push(intent) }, before = htmlFor(extra);
    button(capture(extra), state === 'error' ? '重试加载更多' : '加载更多').props.onClick();
    assert.deepEqual(calls, [{ ...envelope, type: 'load-more', cursor }]); assert.equal(htmlFor(extra), before);
  }
  for (const extra of [{ page: { total: null, more: { cursor: null, state: 'loading' } } }, { page: { total: null, more: { cursor: null, state: 'ready', disabledReason: '' } } }, { result: { state: 'error', message: '检索失败' } }]) {
    const calls = [], nodes = capture({ page: { total: null, more: { cursor: null, state: 'ready' } }, ...extra, onIntent: value => calls.push(value) });
    button(nodes, '加载更多').props.onClick(); assert.equal(calls.length, 0);
  }
});

test('missing receiver/context, duplicate or blank identities protect resource actions without exposing opaque IDs', () => {
  for (const extra of [{ onIntent: undefined }, { resourceSet: { id: '', version: 'v1' } }, { resourceSet: { id: 'set', version: '' } }, { resources: [first, first] }, { resources: [{ ...first, id: '' }] }, { disabledReason: '' }]) {
    const calls = [], props = { onIntent: value => calls.push(value), ...extra }, nodes = capture(props);
    for (const label of ['预览', '读取并引用到上下文', '移出本次上下文', '打开来源']) { const node = button(nodes, label); assert.equal(node.props.disabled, true); node.props.onClick(); }
    assert.equal(calls.length, 0); assert.doesNotMatch(htmlFor(props), /opaque-/);
  }
});

test('query, filters and sort honor independent disabled reasons and global reason appears only once', () => {
  const calls = [], filters = { fields: [{ id: 'type', label: '类型', options: [] }], value: {}, disabledReason: '' };
  const nodes = capture({ view: 'workspace', query: { value: '只读查询', disabledReason: '' }, filters, sort: { label: '排序', options: [], value: '', disabledReason: '' }, onIntent: value => calls.push(value) });
  nodes.find(node => node.props.value === '只读查询' && node.props.onChange).props.onChange({ currentTarget: { value: '新值' } });
  assert.equal(calls.length, 0); assert.equal(filterBars(nodes).length, 0);
  const text = textOf(htmlFor({ view: 'workspace', disabledReason: '当前会话仅可查看。', resources: [first, second], filters, sort: { label: '排序', options: [], value: '' }, page: { total: null, more: { state: 'ready', cursor: null } } }));
  assert.equal(occurrences(text, '当前会话仅可查看。'), 1);
});

test('expand/back only navigate and optional capabilities do not create empty entries', () => {
  const calls = [], trigger = {};
  button(capture({ onExpand: value => calls.push(value) }), '展开检索与来源').props.onClick({ currentTarget: trigger });
  button(capture({ view: 'workspace', onBack: () => calls.push('back') }), '返回原位置').props.onClick();
  assert.deepEqual(calls, [trigger, 'back']);
  assert.doesNotMatch(htmlFor(), /展开检索与来源|返回原位置|加载更多|申请许可/);
});

test('unknown metadata remains explicit and necessary limitations are not hidden in details', () => {
  const resource = { ...first, versionLabel: null, date: null, source: { id: null, label: null }, license: { state: 'confirmation-required', name: null, reason: '核对本次授权范围' }, applicability: null, format: null, duration: null, size: null };
  for (const mode of modes) {
    const text = textOf(htmlFor({ ...mode, resources: [resource], details: h('p', null, '补充说明正文') }));
    for (const phrase of ['来源：未知', '许可：需确认', '核对本次授权范围', '版本：未知', '日期：未知', '适用范围：未知', '格式：未知', '时长：未知', '大小：未知', '说明']) assert.ok(text.includes(phrase), phrase);
    assert.ok(!text.includes('补充说明正文'));
  }
});

test('resource fixtures are explicitly examples with long Chinese/math/narrow container and no eager media', () => {
  const demo = render(h(AgentResourceRetrieverDemo)); assert.match(demo, /id="resource-retriever"/);
  for (const purpose of ['teaching', 'textbook']) {
    const html = render(h(ResourceRetrieverExample, { purpose, narrow: true }));
    assert.match(html, /固定示例/); assert.match(html, /max-w-\[320px\]/); assert.doesNotMatch(html, /<img|<video|<audio|autoplay|autoPlay|三块正方形面积分别为九、十六和二十五/);
    assert.match(html, /data-resource-retriever-view="inline"/); assert.match(html, /data-resource-retriever-view="workspace"/); assert.match(html, /data-resource-retriever-density="compact"/);
    if (purpose === 'teaching') for (const phrase of ['图片', '视频', '文章', '课例', '已读取', '许可：受限', '许可：未知', '部分来源失败', '总数未知', '<math']) assert.ok(html.includes(phrase), phrase);
    else assert.match(html, /教材章节页检索|教材页/);
  }
});
