import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = new URL('../.sites-runtime/review-queue/', import.meta.url);
await mkdir(runtime, { recursive: true });
const file = new URL('test-bundle.mjs', runtime);
const bundle = await build({ stdin: { contents: `export * from './components/prism-next/agent-review-queue'; export { AgentItemReviewer, agentItemReviewLabels } from './components/prism-next/agent-item-reviewer'; export * from './components/prism-next/demos/agent-review-queue';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false });
await writeFile(file, bundle.outputFiles[0].text);
const { AgentReviewQueue, AgentItemReviewer, agentItemReviewLabels, AgentReviewQueueDemo, ReviewQueueExample, reviewQueueExamples, requestQueueExampleBatch, receiveQueueExampleReceipt } = await import(file);
await rm(file);
const h = React.createElement;
const modes = [{ view: 'inline' }, { view: 'workspace' }, { view: 'inline', density: 'compact' }, { view: 'workspace', density: 'compact' }];
const action = { id: 'confirm', label: '批量确认', impact: '仅确认所选对象的当前依据版本。' };
const first = { id: 'never-render-internal-long-id-first', title: '第 1 题', displayNumber: '题号 01', typeLabel: '试题', version: 'r1', review: { state: 'waiting-human', description: '请核对原稿。' }, priority: { label: '常规', reason: '按课程安排继续。' }, assignee: '教师甲', openable: true, batchActionIds: ['confirm'] };
const second = { ...first, id: 'never-render-internal-long-id-second', title: '第 2 题', displayNumber: '题号 02', version: 'r2', priority: { label: '优先', reason: '存在需要先处理的差异。' } };
const props = { title: '审核队列', queue: { id: 'never-render-internal-queue-id', version: 'qv3' }, items: [first, second] };
const htmlFor = extra => render(h(AgentReviewQueue, { ...props, ...extra }));
const textOf = html => html.replace(/<[^>]*>/g, '').replace(/<!--.*?-->/g, '');
function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.freeze(value); Object.values(value).forEach(freeze); }
  return value;
}
// Real presentation handlers and SSR semantics, not simulated browser or service acceptance.
function capture(extra) {
  const nodes = [];
  const owned = new Set(['AgentReviewQueue', 'QueueSelection', 'QueueButton', 'QueueFilters', 'DataRecordTable']);
  function inspect(node) {
    if (!React.isValidElement(node)) return node;
    if (typeof node.type === 'function' && owned.has(node.type.name)) return h(function Probe() { return inspect(node.type(node.props)); });
    nodes.push(node);
    return React.cloneElement(node, {}, React.Children.map(node.props.children, inspect));
  }
  render(inspect(h(AgentReviewQueue, { ...props, ...extra })));
  return nodes;
}
const button = (nodes, label) => nodes.find(node => node.props.onClick && node.props['aria-label'] === label);
const checkbox = (nodes, title) => nodes.find(node => node.props.onCheckedChange && node.props['aria-label'] === `选择：${title}`);
const reviewFor = state => ({ state, description: `外部记录：${state}`, ...(['waiting', 'unknown'].includes(state) ? { request: { id: 'private-request-id', label: '原复核请求' } } : state === 'resolved' ? { resolution: { reviewer: '教师甲', version: 'r1' } } : {}) });
const batchInput = extra => ({ view: 'workspace', batchActions: [action], selectedIds: [first.id, second.id], onSelectionChange() {}, onBatchAction() {}, ...extra });

test('all seven states use the exact ItemReviewer vocabulary across both views and densities', () => {
  assert.deepEqual(agentItemReviewLabels, { 'waiting-human': '待复核', draft: '已编辑未提交', waiting: '复核提交中', unknown: '回执未确认', resolved: '已复核', failed: '已退回 / 失败', expired: '已过期' });
  for (const mode of modes) for (const [state, label] of Object.entries(agentItemReviewLabels)) {
    const review = reviewFor(state), html = htmlFor({ ...mode, items: [{ ...first, review }] });
    assert.ok(html.includes(label)); assert.ok(html.includes(review.description));
    assert.match(html, new RegExp(`data-review-state="${state}"`));
    const single = render(h(AgentItemReviewer, { item: first, review, checkpoints: [], summary: '原稿摘要' }));
    assert.ok(single.includes(label));
    assert.doesNotMatch(textOf(html), /宿主|意图|回调|受控|private-request-id/);
    if (state !== 'resolved') assert.doesNotMatch(html, /已复核/);
  }
  assert.equal(htmlFor({}), htmlFor({ view: 'inline', density: 'default' }));
});

test('counts and progress preserve explicit host values, zero and missing values without deriving from rows', () => {
  for (const mode of modes) {
    const html = htmlFor({ ...mode, counts: { resolved: 12, unknown: 0 }, progress: { reviewed: 12, total: 40 } });
    assert.match(html, /已复核 12\/40/);
    assert.match(html, /<dt>回执未确认<\/dt><dd[^>]*>0<\/dd>/);
    assert.match(html, /<dt>已复核<\/dt><dd[^>]*>12<\/dd>/);
    assert.doesNotMatch(html, /<dt>待复核/);
    assert.doesNotMatch(htmlFor(mode), /已复核 \d+\/\d+|<dl/);
    assert.match(htmlFor({ ...mode, items: [], counts: {}, progress: { reviewed: 0, total: 0 } }), /已复核 0\/0/);
    assert.match(htmlFor({ ...mode, items: [] }), /状态计数未提供/);
    assert.doesNotMatch(htmlFor({ ...mode, items: [] }), /全部完成|已复核|100%/);
  }
  assert.match(htmlFor({ counts: { resolved: -1 }, progress: { reviewed: NaN, total: Infinity } }), /已复核 未确认\/未确认/);
});

test('host order and priority reasons are preserved; query changes only emit callbacks', () => {
  const events = [], fields = [{ id: 'state', label: '复核状态', options: [{ value: 'all', label: '全部' }, { value: 'unknown', label: '回执未确认' }] }];
  const input = freeze({ view: 'workspace', items: [first, second], filters: { fields, value: { state: 'all' }, onChange: value => events.push(['filter', value]) },
    sort: { field: { id: 'sort', label: '排列方式', options: [{ value: 'host', label: '当前顺序' }, { value: 'priority', label: '优先级' }] }, value: 'host', onChange: value => events.push(['sort', value]) } });
  const before = htmlFor(input), nodes = capture(input);
  assert.ok(before.indexOf(first.title) < before.indexOf(second.title));
  for (const item of input.items) assert.ok(before.includes(item.priority.reason));
  const bars = nodes.filter(node => node.type.name === 'FilterBar');
  bars[0].props.onChange({ state: 'unknown' }); bars[1].props.onChange({ sort: 'priority' });
  assert.deepEqual(events, [['filter', { state: 'unknown' }], ['sort', 'priority']]); assert.equal(htmlFor(input), before);
  const readOnly = htmlFor({ ...input, filters: { ...input.filters, onChange: undefined }, sort: { ...input.sort, onChange: undefined } });
  assert.match(readOnly, /复核状态.*全部.*排列方式.*当前顺序/); assert.doesNotMatch(readOnly, /role="combobox"/);
});

test('batch confirmation emits object and queue versions only; no completion or selection mutation, even with a returned receipt', () => {
  const events = [], input = freeze(batchInput({ onBatchAction: intent => { events.push(intent); return { state: 'resolved' }; } }));
  const before = htmlFor(input), dataBefore = JSON.stringify(input);
  button(capture(input), '批量确认').props.onClick({});
  assert.deepEqual(events, [{ queueId: props.queue.id, queueVersion: 'qv3', actionId: 'confirm', items: [{ itemId: first.id, version: 'r1' }, { itemId: second.id, version: 'r2' }] }]);
  assert.equal(htmlFor(input), before); assert.equal(JSON.stringify(input), dataBefore);
  assert.doesNotMatch(before, /已复核|已保存|提交成功/);
});

test('the grading fixture accepts separate item receipts after a batch, leaving the other item unresolved', () => {
  const original = freeze(reviewQueueExamples.grading.items), originalText = JSON.stringify(original);
  const targets = original.slice(0, 2).map(item => ({ itemId: item.id, version: item.version }));
  const waiting = requestQueueExampleBatch(original, { queueId: 'example', queueVersion: 'v1', actionId: 'confirm', items: targets });
  assert.deepEqual(waiting.map(item => item.review.state), ['waiting', 'waiting', 'draft']);
  assert.equal(waiting[2], original[2]);
  const partial = receiveQueueExampleReceipt(waiting, targets[0].itemId, targets[0].version, 'resolved');
  assert.deepEqual(partial.map(item => item.review.state), ['resolved', 'waiting', 'draft']);
  const received = receiveQueueExampleReceipt(partial, targets[1].itemId, targets[1].version, 'unknown');
  assert.deepEqual(received.map(item => item.review.state), ['resolved', 'unknown', 'draft']);
  assert.equal(received[1].review.request.id, waiting[1].review.request.id);
  assert.equal(JSON.stringify(original), originalText);
  assert.deepEqual(receiveQueueExampleReceipt(waiting, targets[0].itemId, 'old-version', 'resolved'), waiting);
});

test('another person handling an item removes open, next and exception actions and blocks any mixed batch atomically', () => {
  const busy = { ...second, processingByOther: { name: '张老师', description: '正在核对作答。' }, exceptions: [{ id: 'never-render-exception-id', label: '版本冲突' }] };
  let calls = 0;
  for (const mode of modes) {
    const input = { ...batchInput(), ...mode, items: [first, busy], nextItemId: busy.id, onNext() { calls++; }, onOpen() { calls++; }, onInspectException() { calls++; }, onBatchAction() { calls++; }, onSelectionChange() { calls++; } };
    const nodes = capture(input), html = htmlFor(input);
    for (const fact of ['他人处理中', '张老师', '正在核对作答']) assert.ok(html.includes(fact));
    assert.equal(button(nodes, `下一项：${busy.title}`), undefined); assert.equal(button(nodes, `打开复核：${busy.title}`), undefined);
    assert.equal(button(nodes, `查看异常：${busy.title} · 版本冲突`), undefined);
    if (mode.view === 'workspace') {
      const control = checkbox(nodes, busy.title); assert.equal(control.props.disabled, true); control.props.onCheckedChange(true);
      const batch = button(nodes, '批量确认'); assert.equal(batch.props.disabled, true); batch.props.onClick({});
    }
  }
  assert.equal(calls, 0);
});

test('waiting, unknown, resolved and expired entries cannot be batch-confirmed even if the host injects eligible action IDs', () => {
  for (const state of ['waiting', 'unknown', 'resolved', 'expired']) {
    const item = { ...first, review: reviewFor(state) }, input = batchInput({ items: [item], selectedIds: [item.id], onBatchAction: () => assert.fail(state), onSelectionChange: () => assert.fail(state) });
    const nodes = capture(input); assert.equal(button(nodes, '批量确认').props.disabled, true);
    button(nodes, '批量确认').props.onClick({}); checkbox(nodes, item.title).props.onCheckedChange(true);
    if (state === 'unknown') assert.match(htmlFor(input), /先逐项查询原请求/);
  }
});

test('independent host version changes retain in-flight uncertainty, block batch and preserve the original basis', () => {
  for (const state of ['unknown', 'waiting', 'resolved']) for (const mode of modes) {
    const item = { ...first, review: reviewFor(state), versionChange: { currentVersion: 'r9', description: '题面条件已更新。' } };
    const input = { ...batchInput(), ...mode, items: [item], selectedIds: [item.id], onBatchAction: () => assert.fail('expired') };
    const html = htmlFor(input); assert.match(html, /已过期/); assert.match(html, /r1/); assert.match(html, /r9/); assert.match(html, /题面条件已更新/);
    if (state !== 'resolved') assert.ok(html.includes(agentItemReviewLabels[state]));
    else assert.doesNotMatch(html, />已复核</);
    if (mode.view === 'workspace') button(capture(input), '批量确认').props.onClick({});
  }
});

test('selection is controlled and never silently drops missing or duplicated selections', () => {
  const events = [], input = freeze(batchInput({ selectedIds: [first.id], onSelectionChange: ids => events.push(ids) }));
  const before = htmlFor(input), nodes = capture(input);
  checkbox(nodes, second.title).props.onCheckedChange(true); checkbox(nodes, first.title).props.onCheckedChange(false);
  assert.deepEqual(events, [[first.id, second.id], []]); assert.equal(htmlFor(input), before);
  for (const selectedIds of [[first.id, 'secret-off-page-id'], [first.id, first.id]]) {
    const current = batchInput({ selectedIds, onSelectionChange: ids => events.push(ids), onBatchAction: () => assert.fail('ambiguous selection') });
    assert.match(htmlFor(current), /已选 2 项/); assert.doesNotMatch(htmlFor(current), /secret-off-page-id/);
    const controls = capture(current); assert.equal(button(controls, '批量确认').props.disabled, true); button(controls, '批量确认').props.onClick({});
    checkbox(controls, second.title).props.onCheckedChange(true); assert.deepEqual(events.at(-1), [...selectedIds, second.id]);
    button(controls, '清空选择').props.onClick({}); assert.deepEqual(events.at(-1), []);
  }
});

test('an unsupported batch action blocks the whole selection rather than confirming a hidden subset', () => {
  const input = batchInput({ items: [first, { ...second, batchActionIds: [] }], onBatchAction: () => assert.fail('subset batch') });
  const nodes = capture(input); assert.equal(button(nodes, '批量确认').props.disabled, true);
  button(nodes, '批量确认').props.onClick({}); assert.match(htmlFor(input), /所选对象包含不可执行/);
});

test('open, next and exception navigation only emit version-bound targets, without inferring the next item', () => {
  const events = [], trigger = { focus() {} }, item = { ...second, exceptions: [{ id: 'exception-2', label: '答案待核对' }] };
  const input = { items: [first, item], nextItemId: item.id, onNext: (...args) => events.push(['next', ...args]), onOpen: (...args) => events.push(['open', ...args]), onInspectException: (...args) => events.push(['exception', ...args]) };
  const before = htmlFor(input), nodes = capture(input);
  button(nodes, `下一项：${item.title}`).props.onClick({ currentTarget: trigger });
  button(nodes, `打开复核：${item.title}`).props.onClick({ currentTarget: trigger });
  button(nodes, `查看异常：${item.title} · 答案待核对`).props.onClick({ currentTarget: trigger });
  const target = { queueId: props.queue.id, queueVersion: 'qv3', itemId: item.id, version: 'r2' };
  assert.deepEqual(events, [['next', target, trigger], ['open', target, trigger], ['exception', { ...target, exceptionId: 'exception-2' }, trigger]]);
  assert.equal(htmlFor(input), before);
  assert.doesNotMatch(htmlFor({ onNext() {} }), /下一项/);
  assert.doesNotMatch(htmlFor({ nextItemId: item.id }), /下一项/);
  const absent = { ...input, nextItemId: 'missing-private-id' };
  button(capture(absent), '下一项').props.onClick({ currentTarget: trigger }); assert.equal(events.length, 3);
  assert.match(htmlFor(absent), /下一项暂不可用/); assert.doesNotMatch(htmlFor(absent), /missing-private-id/);
});

test('without onExpand all supplied items remain visible and there is no fake queue entry; expansion and back only navigate', () => {
  const events = [], trigger = {}, extra = { items: [first, second], inlineLimit: 1, onExpand: element => events.push(['expand', element]), onBack: () => events.push(['back']) };
  const collapsed = htmlFor(extra); assert.ok(collapsed.includes(first.title)); assert.ok(!collapsed.includes(second.title));
  const noExpand = htmlFor({ ...extra, onExpand: undefined }); assert.ok(noExpand.includes(second.title)); assert.doesNotMatch(noExpand, /进入审核队列/);
  const nodes = capture(extra), expand = nodes.find(node => node.props.onClick && node.props.children?.[0] === '进入审核队列');
  expand.props.onClick({ currentTarget: trigger });
  const full = { ...extra, view: 'workspace' }; assert.doesNotMatch(htmlFor(full), /进入审核队列/);
  capture(full).find(node => node.props.onClick === extra.onBack).props.onClick();
  assert.deepEqual(events, [['expand', trigger], ['back']]);
});

test('compact and inline limits retain every uncertain, expired, busy, unsaved, failed, disabled and exception item', () => {
  const items = [first, ...['unknown', 'expired', 'waiting', 'draft', 'failed'].map((state, index) => ({ ...first, id: `state-${state}`, title: `重要对象${index}`, review: reviewFor(state) })),
    { ...second, processingByOther: { name: '教师乙' } }, { ...first, id: 'disabled', title: '受限对象', disabledReason: '当前不可修改。' },
    { ...first, id: 'exception', title: '异常对象', exceptions: [{ id: 'e1', label: '依据缺失' }] }];
  for (const view of ['inline', 'workspace']) {
    const input = { view, items, inlineLimit: 1, onExpand() {}, notice: '唯一常驻边界提示', details: h('p', null, '可折叠补充解释') };
    const compact = htmlFor({ ...input, density: 'compact' });
    for (const fact of ['回执未确认', '已过期', '他人处理中', '复核提交中', '已编辑未提交', '已退回 / 失败', '当前不可修改', '依据缺失', '修改未保存']) assert.ok(compact.includes(fact), fact);
    assert.equal(textOf(compact), textOf(htmlFor({ ...input, density: 'default' })));
    assert.equal((compact.match(/唯一常驻边界提示/g) ?? []).length, 1); assert.doesNotMatch(compact, /可折叠补充解释|line-clamp|truncate/);
    assert.match(compact, /aria-expanded="false"/);
  }
});

test('opaque IDs are never rendered, including accessible labels, data attributes and missing-name fallbacks', () => {
  for (const mode of modes) {
    const item = { ...first, title: '', displayNumber: undefined, exceptions: [{ id: 'never-render-internal-exception', label: '依据不足' }] };
    const html = htmlFor({ ...batchInput(), ...mode, items: [item], selectedIds: [item.id], nextItemId: item.id, onNext() {}, onOpen() {}, onInspectException() {} });
    assert.match(html, /未命名对象/); assert.doesNotMatch(html, /never-render-internal/);
  }
});

test('disabled capabilities visibly explain why and guard handlers, including missing identities and duplicate objects', () => {
  for (const change of [{ disabledReason: '当前仅可查看。' }, { queue: { id: '', version: '' } }, { items: [{ ...first, version: '' }, second] }, { items: [first, first] }, { batchActions: [{ ...action, disabledReason: '请先核对评分依据。' }] }, { onBatchAction: undefined }]) {
    const input = batchInput({ onBatchAction: () => assert.fail('disabled batch'), ...change });
    const node = button(capture(input), '批量确认'); assert.equal(node.props.disabled, true); node.props.onClick({});
    const html = htmlFor(input), tag = html.match(/<button\b[^>]*aria-label="批量确认"[^>]*>/)[0];
    const description = tag.match(/aria-describedby="([^"]+)"/)[1]; assert.ok(html.includes(`id="${description}"`));
    assert.ok(html.includes(action.impact));
  }
});

test('snapshot keeps its own counts, order and versions and removes current write/navigation actions', () => {
  for (const mode of modes) {
    const input = { ...batchInput(), ...mode, queue: { ...props.queue, snapshot: true }, counts: { resolved: 8 }, progress: { reviewed: 8, total: 20 }, nextItemId: first.id,
      onNext: () => assert.fail('history next'), onOpen: () => assert.fail('history open'), onBatchAction: () => assert.fail('history batch'), onSelectionChange: () => assert.fail('history selection') };
    const html = htmlFor(input); assert.match(html, /当时状态/); assert.match(html, /已复核 8\/20/); assert.match(html, /qv3/);
    assert.doesNotMatch(html, /aria-label="(?:打开复核|下一项|批量确认|选择：|清空选择)/);
    assert.equal(capture(input).filter(node => node.props.onCheckedChange).length, 0);
  }
});

test('workspace reuses a table with readable labels; default inline omits bulk controls', () => {
  const html = htmlFor(batchInput());
  assert.match(html, /data-slot="table"/); assert.match(html, /aria-label="审核对象列表" tabindex="0"/);
  assert.match(html, /aria-label="选择：第 1 题"/); assert.doesNotMatch(html, /查看 never-render/);
  assert.doesNotMatch(htmlFor({ batchActions: [action], onSelectionChange() {} }), /data-slot="table"|role="checkbox"|批量确认/);
});

test('two labelled examples expose all three presentations and the narrow fixture without private IDs', () => {
  const demo = render(h(AgentReviewQueueDemo)); assert.match(demo, /P04 逐题校对示例/); assert.match(demo, /批阅复核示例/);
  assert.match(demo, /id="review-queue"/); assert.match(demo, /320px 窄容器/);
  for (const purpose of ['p04', 'grading']) {
    const html = render(h(ReviewQueueExample, { purpose, narrow: true }));
    for (const fact of ['示例', 'data-agent-review-queue-view="inline"', 'data-agent-review-queue-view="workspace"', 'data-density="compact"', 'max-w-[320px]']) assert.ok(html.includes(fact));
    assert.doesNotMatch(html, /example-internal|example-request|example-queue/);
    if (purpose === 'p04') { assert.match(html, /回执未确认/); assert.match(html, /已过期/); assert.equal(reviewQueueExamples.p04.items.length, 3); }
    else { assert.match(html, /他人处理中/); assert.match(html, /逐项示例回执/); assert.match(html, /批量确认/); }
  }
});
