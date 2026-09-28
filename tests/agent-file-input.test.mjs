import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = new URL('../.sites-runtime/file-input/', import.meta.url);
await mkdir(runtime, { recursive: true });
const file = new URL('test-bundle.mjs', runtime);
const bundle = await build({ stdin: { contents: `export * from './components/prism-next/agent-file-input'; export { fileInputExamples, checkExampleFiles, FileInputExample, AgentFileInputDemo } from './components/prism-next/demos/agent-file-input';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false });
await writeFile(file, bundle.outputFiles[0].text);
const { AgentFileInput, fileInputExamples, checkExampleFiles, FileInputExample, AgentFileInputDemo } = await import(file);
await rm(file);
const h = React.createElement;
const supported = { status: 'supported' };
const request = { id: 'original-request', label: '原上传请求' };
const actions = { remove: {}, replace: {}, move: {} };
const item = { id: 'file-1', name: '函数复习.docx', type: 'Word', sizeBytes: 1024, source: { kind: 'local' }, actions, status: { state: 'selected' } };
const props = { title: '文件输入', items: [item], limits: { accept: '.pdf,.png,.docx,.xlsx', acceptLabel: 'PDF、图片、Word、Excel', maxFileSize: 1024 * 1024, maxFiles: 3 }, capabilities: { select: supported, upload: supported, drop: supported }, onSelect() {} };
const modes = [{ view: 'inline' }, { view: 'workspace' }, { view: 'inline', density: 'compact' }, { view: 'workspace', density: 'compact' }];
const htmlFor = extra => render(h(AgentFileInput, { ...props, ...extra }));
function capture(extra) {
  const nodes = [];
  const owned = new Set(['AgentFileInput', 'FileRow', 'FileActionButton', 'FileBatchButton']);
  function inspect(node) {
    if (Array.isArray(node)) return node.map(inspect);
    if (!React.isValidElement(node)) return node;
    if (typeof node.type === 'function' && owned.has(node.type.name)) return h(function Probe() { return inspect(node.type(node.props)); });
    nodes.push(node);
    return React.cloneElement(node, {}, React.Children.map(node.props.children, inspect));
  }
  render(inspect(h(AgentFileInput, { ...props, ...extra })));
  return nodes;
}
const actionNodes = extra => capture(extra).filter(node => node.props['data-file-action']);
function freeze(value) { if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.freeze(value); Object.values(value).forEach(freeze); } return value; }
function unreadableFile(name = '本机文件.pdf', size = 1024) {
  const file = { name, size, type: 'application/pdf' };
  for (const property of ['text', 'arrayBuffer', 'stream', 'slice']) Object.defineProperty(file, property, { get() { assert.fail(`must not read ${property}`); } });
  return Object.freeze(file);
}

test('native file selection emits exact files once, clears the picker and never reads or creates queue facts', () => {
  const files = [unreadableFile(), unreadableFile('超过限制.exe', 9000000)], calls = [];
  const extra = { onSelect: selected => calls.push(selected) }, before = htmlFor(extra);
  const input = capture(extra).find(node => node.props.type === 'file');
  assert.equal(input.props.nativeInput, true);
  const currentTarget = { files, value: 'C:\\fakepath\\file.pdf' };
  input.props.onChange({ currentTarget });
  assert.equal(currentTarget.value, ''); assert.equal(calls.length, 1); assert.deepEqual(calls[0], files);
  assert.equal(calls[0][0], files[0]); assert.equal(htmlFor(extra), before);
  input.props.onChange({ currentTarget: { files: [], value: '' } });
  input.props.onChange({ currentTarget: { files: null, value: '' } });
  assert.equal(calls.length, 1);
});

test('drop emits all files without validation/filtering; unsupported and disabled drop never emits or navigates', () => {
  const files = [unreadableFile('未知.bin')], calls = [];
  for (const drop of [supported, { status: 'limited', reason: '只能拖入文件。' }, { status: 'unsupported', reason: '请使用选择入口。' }]) {
    const extra = { onSelect: value => calls.push(value), capabilities: { ...props.capabilities, drop } };
    const region = capture(extra).find(node => node.props['data-file-drop']);
    let prevented = 0, stopped = 0;
    const dataTransfer = { files, types: ['Files'], dropEffect: 'none' };
    region.props.onDragOver({ dataTransfer, preventDefault() { prevented++; } });
    assert.equal(dataTransfer.dropEffect, drop.status === 'unsupported' ? 'none' : 'copy');
    const before = calls.length;
    region.props.onDrop({ dataTransfer, preventDefault() { prevented++; }, stopPropagation() { stopped++; } });
    assert.equal(calls.length - before, drop.status === 'unsupported' ? 0 : 1); assert.equal(prevented, 2); assert.equal(stopped, 1);
  }
  const disabled = capture({ selectionDisabledReason: '当前材料只读。', onSelect() { assert.fail(); } });
  disabled.find(node => node.props.type === 'file').props.onChange({ currentTarget: { files, value: '' } });
  disabled.find(node => node.props['data-file-drop']).props.onDrop({ dataTransfer: { files }, preventDefault() {}, stopPropagation() {} });
});

test('native selection has a persistent label, accepts keyboard focus, and touch retains equivalent selection', () => {
  for (const mode of modes) {
    const extra = { ...mode, capabilities: { ...props.capabilities, drop: { status: 'unsupported', reason: '触屏请使用选择入口。' } } };
    const nodes = capture(extra), input = nodes.find(node => node.props.type === 'file');
    assert.ok(nodes.some(node => node.props.htmlFor === input.props.id));
    assert.notEqual(input.props.tabIndex, -1); assert.equal(input.props.disabled, false); assert.notEqual(input.props.hidden, true);
    assert.equal(input.props.accept, props.limits.accept); assert.equal(input.props.multiple, true);
    assert.match(input.props['aria-describedby'], /limits.*capabilities.*drop/);
    const html = htmlFor(extra); assert.match(html, /<input[^>]*type="file"/); assert.match(html, /触屏请使用选择入口/);
  }
  assert.equal(capture({ limits: { ...props.limits, maxFiles: 1 } }).find(node => node.props.type === 'file').props.multiple, false);
});

test('all nine supplied states render in both views and densities without inferring reading or parsing', () => {
  const statuses = [
    [{ state: 'selected' }, '已选择（仅本机）'], [{ state: 'invalid', validation: 'type', reason: '类型不符' }, '校验未通过'],
    [{ state: 'queued' }, '等待上传'], [{ state: 'received', request }, '已接收'], [{ state: 'uploading', request }, '上传中'],
    [{ state: 'uploaded' }, '已上传'], [{ state: 'failed', reason: '明确失败' }, '上传失败'],
    [{ state: 'unknown', reason: '回执丢失', request }, '状态未确认'], [{ state: 'removed' }, '已移除'],
  ];
  for (const mode of modes) for (const [status, label] of statuses) {
    const html = htmlFor({ ...mode, items: [{ ...item, status }] });
    assert.match(html, new RegExp(`data-file-state="${status.state}"`)); assert.ok(html.includes(label));
    assert.doesNotMatch(html, /已读取|已解析|解析中|后续处理/);
    if (status.state === 'selected' || status.state === 'received') assert.doesNotMatch(html, />已上传</);
    if (status.state === 'uploaded') assert.match(html, /版本：未确认.*上传时间：未确认/);
    if (status.state === 'removed') assert.equal(actionNodes({ ...mode, items: [{ ...item, status }], onAction() {} }).length, 0);
  }
  const explicit = htmlFor({ items: [{ ...item, version: 'v3', status: { state: 'uploaded', uploadedAt: '2026-09-25 09:00' }, processing: { label: '解析中', description: '独立处理记录' } }] });
  assert.match(explicit, /版本：v3.*上传时间：2026-09-25 09:00/); assert.match(explicit, /后续处理：解析中.*独立处理记录/);
});

test('upload progress is shown only for supplied finite values in range; 100 never changes state', () => {
  for (const progress of [undefined, NaN, Infinity, -1, 101]) {
    const html = htmlFor({ items: [{ ...item, status: { state: 'uploading', request, progress } }] });
    assert.match(html, /进度未确认/); assert.doesNotMatch(html.replace(/<[^>]*>/g, ''), /\d+%/); assert.doesNotMatch(html, /aria-valuenow=/);
  }
  for (const progress of [0, 42.5, 100]) {
    const html = htmlFor({ items: [{ ...item, status: { state: 'uploading', request, progress } }] });
    assert.ok(html.includes(`上传进度 ${progress}%`)); assert.match(html, /data-file-state="uploading"/); assert.doesNotMatch(html, />已上传</);
  }
});

test('selecting an existing resource identifies that source and never invents a receipt or local file upload', () => {
  const html = htmlFor({ items: [{ ...item, source: { kind: 'existing', label: 'P04 预置材料' } }] });
  assert.match(html, /已选择（已有资料）/); assert.match(html, /P04 预置材料/);
  assert.doesNotMatch(html, /已选择（仅本机）|已接收|已上传|原请求：|已读取|已解析/);
});

test('unknown is query-only even with injected retry/mutations; query retains original request and version', () => {
  for (const mode of modes) {
    const calls = [], extra = { ...mode, items: [{ ...item, version: 'v1', status: { state: 'unknown', reason: '回执未确认', request, query: {}, retry: {} } }], onAction: value => calls.push(value) };
    const before = htmlFor(extra), nodes = actionNodes(extra);
    assert.deepEqual(nodes.map(node => node.props['data-file-action']), ['query']);
    nodes[0].props.onClick(); assert.deepEqual(calls, [{ kind: 'query', fileId: item.id, version: 'v1', requestId: request.id }]);
    assert.equal(htmlFor(extra), before);
  }
  const malformed = { items: [{ ...item, status: { state: 'unknown', reason: '缺少关联', request: { id: '', label: '' }, query: {} } }], onAction() { assert.fail(); } };
  const button = actionNodes(malformed)[0]; assert.equal(button.props.disabled, true); button.props.onClick();
  assert.match(htmlFor(malformed), /原请求标识未确认/);
  assert.match(htmlFor({ items: [{ ...item, status: { state: 'unknown', request, reason: '未确认' } }] }), /暂未提供原请求查询/);
});

test('retry is explicit, capability-bound, and cannot mutate controlled failure into uploading', () => {
  const calls = [], items = freeze([{ ...item, status: { state: 'failed', reason: '服务已明确返回失败', request, retry: {} } }]);
  for (const upload of [supported, { status: 'limited', reason: '仅部分类型' }, { status: 'unsupported', reason: '未接上传服务' }]) {
    const extra = { items, capabilities: { ...props.capabilities, upload }, onAction: value => calls.push(value) }, before = htmlFor(extra);
    const node = actionNodes(extra).find(node => node.props['data-file-action'] === 'retry');
    const count = calls.length; node.props.onClick();
    assert.equal(calls.length - count, upload.status === 'unsupported' ? 0 : 1); assert.equal(htmlFor(extra), before);
    assert.equal(node.props.disabled, upload.status === 'unsupported');
  }
  assert.deepEqual(calls[0], { kind: 'retry', fileId: item.id, version: undefined, requestId: request.id });
  assert.doesNotMatch(htmlFor({ items: [{ ...item, status: { state: 'failed', reason: '失败' } }] }), /重试上传/);
});

test('remove/replace and touch-equivalent moves only emit intentions; boundary/grouped moves state reasons', () => {
  const calls = [], items = freeze([item, { ...item, id: 'file-2', name: '第二个文件' }, { ...item, id: 'file-3', name: '第三个文件' }]);
  const extra = { view: 'workspace', items, onAction: value => calls.push(value) }, before = htmlFor(extra);
  for (const node of actionNodes(extra)) node.props.onClick();
  assert.equal(calls.filter(value => value.kind === 'move').length, 4);
  assert.ok(calls.some(value => value.kind === 'move' && value.direction === 'down' && value.fileId === 'file-1' && value.adjacentId === 'file-2'));
  assert.equal(calls.filter(value => value.kind === 'remove').length, 3); assert.equal(calls.filter(value => value.kind === 'replace').length, 3);
  assert.equal(htmlFor(extra), before); assert.match(before, /已是第一项/); assert.match(before, /已是最后一项/);
  assert.ok(actionNodes(extra).filter(node => node.props['data-file-action'].startsWith('move')).every(node => node.props.size === 'navigation' && node.props.type === 'button'));
  const grouped = actionNodes({ ...extra, groupBy: 'status' }).filter(node => node.props['data-file-action'].startsWith('move'));
  assert.ok(grouped.every(node => node.props.disabled));
  assert.match(htmlFor({ ...extra, groupBy: 'status' }), /请切回文件顺序后调整/);
});

test('disabled reasons are visible, linked and guarded; moving across unknown cannot silently reorder it', () => {
  const extra = { view: 'workspace', items: [{ ...item, actions: { remove: { disabledReason: '文件正在使用' }, replace: { disabledReason: '版本已变化' } } }], onAction() { assert.fail(); } };
  for (const node of actionNodes(extra)) { assert.equal(node.props.disabled, true); assert.ok(node.props['aria-describedby']); node.props.onClick(); }
  assert.match(htmlFor(extra), /文件正在使用/); assert.match(htmlFor(extra), /版本已变化/);
  const items = [item, { ...item, id: 'unknown', status: { state: 'unknown', request, reason: '未确认' } }];
  const down = actionNodes({ view: 'workspace', items, onAction() { assert.fail(); } }).find(node => node.props['data-file-action'] === 'move-down');
  assert.equal(down.props.disabled, true); down.props.onClick();
});

test('inline count/expansion shares items; missing onExpand retains complete access; critical items never hide', () => {
  const items = Array.from({ length: 5 }, (_, index) => ({ ...item, id: `file-${index}` }));
  items.push({ ...item, id: 'bad', status: { state: 'invalid', validation: 'count', reason: '数量超限' } }, { ...item, id: 'unknown', status: { state: 'unknown', request, reason: '回执未确认' } });
  const noExpand = htmlFor({ items, inlineLimit: 2 });
  assert.equal((noExpand.match(/data-file-id=/g) ?? []).length, 7); assert.doesNotMatch(noExpand, /管理全部/);
  const trigger = {}, calls = [], extra = { items, inlineLimit: 2, onExpand: value => calls.push(value) }, html = htmlFor(extra);
  assert.equal((html.match(/data-file-id=/g) ?? []).length, 4); assert.match(html, /共 7 项.*当前显示 4 项/); assert.match(html, /数量超限/); assert.match(html, /回执未确认/);
  capture(extra).find(node => node.props.onClick && React.Children.toArray(node.props.children).includes('管理全部（')).props.onClick({ currentTarget: trigger });
  assert.deepEqual(calls, [trigger]); assert.equal(htmlFor(extra), html);
  assert.doesNotMatch(htmlFor({ ...extra, view: 'workspace' }), /管理全部/);
});

test('workspace groups full queue and emits view change/return without changing file facts', () => {
  const calls = [], extra = { view: 'workspace', items: [item, { ...item, id: 'done', status: { state: 'uploaded' }, source: { kind: 'existing' } }], groupBy: 'status', onGroupByChange: value => calls.push(value), onBack: () => calls.push('back') };
  const before = htmlFor(extra);
  assert.match(before, /已选择 · 1 项/); assert.match(before, /已上传 · 1 项/); assert.match(before, /已有资料/); assert.match(before, /文件详情/);
  for (const node of capture(extra).filter(node => node.props['aria-pressed'] !== undefined)) node.props.onClick();
  capture(extra).find(node => node.props.onClick && React.Children.toArray(node.props.children).includes('返回原位置')).props.onClick();
  assert.deepEqual(calls, ['none', 'status', 'back']); assert.equal(htmlFor(extra), before);
});

test('host-scoped batch actions emit exact IDs only; absent handlers and ambiguous/invalid targets fail closed', () => {
  const calls = [], batch = { id: 'send-two', label: '上传所选文件', kind: 'upload', fileIds: ['file-1'] };
  const extra = { view: 'workspace', batchActions: [batch], onBatchAction: value => calls.push(value) }, before = htmlFor(extra);
  actionNodes(extra).find(node => node.props['data-file-action'] === 'batch-send-two').props.onClick();
  assert.deepEqual(calls, [{ id: batch.id, kind: batch.kind, fileIds: batch.fileIds }]); assert.notEqual(calls[0].fileIds, batch.fileIds); assert.equal(htmlFor(extra), before);
  for (const state of ['unknown', 'received', 'uploading', 'uploaded', 'invalid', 'removed']) for (const kind of ['upload', 'retry', ...(state === 'unknown' ? ['remove'] : [])]) {
    const status = { state, request, reason: '未确认或不可执行', validation: 'type' };
    const blocked = { ...extra, items: [{ ...item, status }], batchActions: [{ ...batch, kind }], onBatchAction() { assert.fail(); } };
    const node = actionNodes(blocked).find(node => node.props['data-file-action'].startsWith('batch-')); assert.equal(node.props.disabled, true, `${state}/${kind}`); node.props.onClick();
  }
  for (const fileIds of [[], ['missing'], ['file-1', 'file-1']]) {
    const node = actionNodes({ ...extra, batchActions: [{ ...batch, fileIds }], onBatchAction() { assert.fail(); } }).find(node => node.props['data-file-action'].startsWith('batch-'));
    assert.equal(node.props.disabled, true); node.props.onClick();
  }
  assert.equal(actionNodes({ ...extra, onBatchAction: undefined }).find(node => node.props['data-file-action'].startsWith('batch-')).props.disabled, true);
  assert.doesNotMatch(htmlFor({ ...extra, batchActions: [{ ...batch, kind: 'script', label: '任意动作' }] }), /任意动作/);
});

test('batch cannot bypass unavailable upload, explicit item restrictions or missing retry permission', () => {
  const cases = [
    { kind: 'upload', status: { state: 'selected' }, upload: { status: 'unsupported', reason: '未接入' } },
    { kind: 'remove', status: { state: 'selected' }, actions: { remove: { disabledReason: '保留材料' } } },
    { kind: 'retry', status: { state: 'failed', reason: '失败' } },
    { kind: 'retry', status: { state: 'failed', reason: '失败', retry: { disabledReason: '不可重试' } } },
  ];
  for (const entry of cases) {
    const extra = { view: 'workspace', items: [{ ...item, status: entry.status, actions: entry.actions }], capabilities: { ...props.capabilities, upload: entry.upload ?? supported }, batchActions: [{ id: 'batch', kind: entry.kind, label: '批量操作', fileIds: [item.id] }], onBatchAction() { assert.fail(); } };
    const node = actionNodes(extra).find(node => node.props['data-file-action'] === 'batch-batch'); assert.equal(node.props.disabled, true); node.props.onClick();
  }
});

test('demo host validates only metadata and passes all rejected files with type/size/count reasons', () => {
  const files = [unreadableFile('可以.pdf'), unreadableFile('类型.exe'), unreadableFile('过大.pdf', 2 * 1024 * 1024), unreadableFile('超量.pdf')];
  const result = checkExampleFiles(files, props.limits, 0, 'local');
  assert.deepEqual(result.map(item => item.status.state), ['selected', 'invalid', 'invalid', 'invalid']);
  assert.deepEqual(result.slice(1).map(item => item.status.validation), ['type', 'size', 'count']);
  assert.ok(result.every(item => item.source.kind === 'local' && !('file' in item)));
  assert.equal(checkExampleFiles([unreadableFile('empty.pdf', 0)], props.limits, 0, 'empty')[0].status.validation, 'size');
  assert.equal(checkExampleFiles([unreadableFile('README')], props.limits, 0, 'no-extension')[0].type, '类型未确认');
});

test('two labelled examples show inline/workspace/compact, honest limitations and composer slots without nested forms', () => {
  for (const purpose of ['scan', 'preparation']) {
    const html = render(h(FileInputExample, { purpose, narrow: true }));
    assert.equal((html.match(/data-agent-file-view=/g) ?? []).length, 3);
    assert.equal((html.match(/<form/g) ?? []).length, 1);
    for (const text of ['固定示例', '对话中的少量文件', '完整队列与文件管理', '紧凑文件队列与任务输入', '未接入', fileInputExamples[purpose].title]) assert.ok(html.includes(text), text);
    assert.doesNotMatch(html, /意图|宿主|回调|受控/);
    if (purpose === 'scan') assert.match(html, /校验未通过/);
    else { assert.match(html, /上传失败/); assert.match(html, /状态未确认/); assert.match(html, /进度未确认/); assert.match(html, /上传进度 42%/); }
  }
  assert.match(render(h(AgentFileInputDemo)), /320px 窄容器/);
});

test('metadata is escaped and the reusable component has no content reads, network, timers or storage', async () => {
  assert.match(htmlFor({ items: [{ ...item, name: '<script>private</script>' }] }), /&lt;script&gt;private&lt;\/script&gt;/);
  const source = await readFile(new URL('../components/prism-next/agent-file-input.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /FileReader|\.text\(|\.arrayBuffer\(|\.stream\(|createObjectURL|fetch\(|XMLHttpRequest|localStorage|sessionStorage|indexedDB|setTimeout|setInterval|useState/);
});

test('public types require explicit capabilities/limits and unknown request; retry is not an unknown-state action', async () => {
  const typeFile = new URL('type-contract.tsx', runtime), path = fileURLToPath(typeFile);
  await writeFile(typeFile, `import type { AgentFileCapabilities as C, AgentFileStatus as S, AgentFileInputProps as P, AgentFileBatchAction as B } from '../../components/prism-next/agent-file-input';
const valid: C = { select: { status: 'supported' }, upload: { status: 'unsupported', reason: '未接入' }, drop: { status: 'limited', reason: '仅部分设备' } };
// @ts-expect-error upload capability is mandatory
const missing: C = { select: { status: 'supported' }, drop: { status: 'supported' } };
// @ts-expect-error limited requires reason
const noReason: C = { select: { status: 'supported' }, upload: { status: 'limited' }, drop: { status: 'supported' } };
// @ts-expect-error unknown requires original request
const noRequest: S = { state: 'unknown', reason: '回执未确认' };
// @ts-expect-error unknown is query-only
const retry: S = { state: 'unknown', reason: '回执未确认', request: {id: 'r', label: '原请求'}, retry: {} };
// @ts-expect-error invalid requires category and reason
const invalid: S = { state: 'invalid' };
// @ts-expect-error props need explicit constraints
const props: P = { title: '材料', items: [], capabilities: valid, onSelect() {} };
// @ts-expect-error batch actions are registered operations
const arbitrary: B = { id: 'a', kind: 'script', label: '运行脚本', fileIds: [] };
void [valid, missing, noReason, noRequest, retry, invalid, props, arbitrary];
`);
  try {
    const config = ts.readConfigFile(`${root}tsconfig.json`, ts.sys.readFile);
    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
    const program = ts.createProgram([path], { ...parsed.options, incremental: false, noEmit: true });
    const diagnostics = ts.getPreEmitDiagnostics(program);
    assert.equal(diagnostics.length, 0, diagnostics.map(value => ts.flattenDiagnosticMessageText(value.messageText, '\n')).join('\n'));
  } finally { await rm(typeFile); }
});

test('compact files stay in one row with a full-name details trigger, visible badge and named remove icon', () => {
  const name = '九年级数学复习资料_含长中文名称与分式条件的完整材料.docx';
  const extra = { density: 'compact', items: [{ ...item, name }], onAction() {} };
  const html = htmlFor(extra);
  const row = html.match(/<div data-file-compact-row=""[^>]*>(.*?)<\/div>/s)?.[1];
  assert.ok(row);
  assert.match(row, /class="[^"]*truncate/);
  assert.ok(row.includes(`title="${name}"`));
  assert.ok(row.includes(`aria-label="文件详情：${name}"`));
  assert.match(row, /aria-expanded="false"/);
  assert.match(row, /已选择（仅本机）/);
  assert.ok(row.includes(`aria-label="移除：${name}"`));
  assert.doesNotMatch(row, /<h4\b|<p\b|flex-wrap|>移除</);
  assert.doesNotMatch(row, /Word|1 KB|替换/);
  const buttons = actionNodes(extra);
  assert.equal(buttons.filter(node => node.props['data-file-action'] === 'remove').length, 1);
  assert.equal(buttons.find(node => node.props['data-file-action'] === 'remove').props.size, 'icon-sm');
});

test('compact invalid/failed/unknown reasons are named on a keyboard disclosure and readable in its linked panel', () => {
  for (const status of [
    { state: 'invalid', validation: 'size', reason: '超过单个文件大小限制' },
    { state: 'failed', reason: '服务明确拒绝接收', request, retry: {} },
    { state: 'unknown', reason: '请求回执未确认', request, query: {} },
  ]) {
    const extra = { density: 'compact', items: [{ ...item, status }], onAction() {} };
    const html = htmlFor(extra);
    const trigger = html.match(/<button[^>]*aria-label="查看原因与文件详情[^>]*>/)?.[0];
    assert.ok(trigger?.includes(item.name));
    assert.ok(trigger.includes(status.reason));
    assert.match(trigger, /aria-expanded="false"/);
    assert.doesNotMatch(trigger, / disabled=""|aria-disabled="true"|tabindex="-1"/);
    const panelId = trigger.match(/aria-controls="([^"]+)"/)?.[1];
    assert.ok(panelId);
    assert.ok(html.includes(`id="${panelId}"`));
    assert.ok(html.includes(`>${status.reason}</p>`) || html.includes(`：${status.reason}</p>`));
    const row = html.match(/<div data-file-compact-row=""[^>]*>(.*?)<\/div>/s)?.[1];
    assert.ok(row.includes({ invalid: '校验未通过', failed: '上传失败', unknown: '状态未确认' }[status.state]));
    if (status.state === 'unknown') assert.deepEqual(actionNodes(extra).map(node => node.props['data-file-action']), ['query']);
  }
});

test('compact remove stays guarded and reason remains accessible; native picker still emits exact files', () => {
  const calls = [];
  const extra = { density: 'compact', onAction: intent => calls.push(intent) };
  actionNodes(extra).find(node => node.props['data-file-action'] === 'remove').props.onClick();
  assert.deepEqual(calls, [{ fileId: item.id, version: undefined, kind: 'remove' }]);
  const disabled = { ...extra, items: [{ ...item, actions: { remove: { disabledReason: '文件正在使用' } } }] };
  const remove = actionNodes(disabled).find(node => node.props['data-file-action'] === 'remove');
  assert.equal(remove.props.disabled, true);
  remove.props.onClick(); assert.equal(calls.length, 1);
  const html = htmlFor(disabled);
  const removeTag = html.match(/<button[^>]*data-file-action="remove"[^>]*>/)?.[0];
  const reasonId = removeTag?.match(/aria-describedby="([^"]+)"/)?.[1];
  assert.ok(reasonId); assert.ok(html.includes(`id="${reasonId}"`));
  assert.match(html, /aria-label="文件详情：[^"]*不可移除：文件正在使用"/);
  const files = [unreadableFile()], selected = [];
  const input = capture({ density: 'compact', onSelect: value => selected.push(value) }).find(node => node.props.type === 'file');
  const target = { files, value: 'file.pdf' };
  input.props.onChange({ currentTarget: target });
  assert.equal(target.value, ''); assert.deepEqual(selected, [files]);
});

test('compact explanatory copy starts collapsed while native input descriptions remain linked', () => {
  const html = htmlFor({ density: 'compact', capabilities: { ...props.capabilities, upload: { status: 'unsupported', reason: '只检查本机文件' } }, notice: '示例不实际上传', details: '完整补充说明' });
  assert.match(html, />上传未接入<\/p>/);
  assert.equal((html.match(/>说明<\/button>/g) ?? []).length, 1);
  for (const token of ['capabilities', 'limits', 'drop']) assert.match(html, new RegExp(`id="[^"]*-${token}"`));
  for (const copy of ['只检查本机文件', '示例不实际上传', '完整补充说明']) assert.ok(html.includes(copy));
  assert.match(html, /hidden=""[^>]*data-slot="collapsible-panel"/);
});

test('default inline and both workspace densities match main 7bf305b SSR bytes across nine fixtures', async () => {
  const { createHash } = await import('node:crypto');
  const fixture = JSON.parse(await readFile(new URL('./fixtures/agent-file-input-main-7bf305b.json', import.meta.url), 'utf8'));
  const output = new URL('../.sites-runtime/file-input-compact/', import.meta.url);
  await mkdir(output, { recursive: true });
  for (const entry of fixture.cases) {
    const html = render(h(AgentFileInput, { ...fixture.props, ...entry.props, onSelect() {}, onAction() {}, onExpand() {}, onGroupByChange() {}, onBatchAction() {}, onBack() {} }));
    await writeFile(new URL(`current-${entry.name}.html`, output), html);
    assert.equal(createHash('sha256').update(html).digest('hex'), entry.sha256, entry.name);
  }
});
