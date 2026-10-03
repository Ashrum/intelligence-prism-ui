import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { components } from '../lib/prism-next/catalog.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const dir = new URL('../.sites-runtime/material-intake-test/', import.meta.url);
await mkdir(dir, { recursive: true });
const file = new URL('bundle.mjs', dir);
await writeFile(file, (await build({ stdin: { contents: `export * from './components/prism-next/material-intake'; export * from './components/prism-next/demos/material-intake'; export {AgentFileInput} from './components/prism-next/agent-file-input';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false })).outputFiles[0].text);
const { MaterialIntake, MaterialIntakeDemo, materialIntakeBase: base, materialIntakeFixtures: fixtures, AgentFileInput } = await import(file);
await rm(file);
const h = React.createElement;
function capture(overrides = {}, Component = MaterialIntake) {
  const nodes = [], owned = new Set(['MaterialIntake', 'IntakeSelection', 'AgentFileInput', 'Attachment']);
  function walk(n) {
    if (Array.isArray(n)) return n.map(walk);
    if (!React.isValidElement(n)) return n;
    if (typeof n.type === 'function' && owned.has(n.type.name)) return h(function Probe() { return walk(n.type(n.props)); });
    nodes.push(n);
    return React.cloneElement(n, {}, React.Children.map(n.props.children, walk));
  }
  const html = render(walk(h(Component, { ...base, ...overrides })));
  return { nodes, html, action: name => nodes.find(n => n.props['data-intake-action'] === name) };
}

test('all reception states render controlled facts and non-review confirmation is guarded', () => {
  for (const [kind, text] of Object.entries({ waiting: '等待接收', receiving: '接收中', review: '已接收待核对', invalid: '校验失败', loading: '正在加载接收信息', error: '接收信息加载失败', unknown: '接收状态未提供' })) {
    let calls = 0;
    const props = { state: { kind, reason: '页面不匹配' }, onConfirm: () => calls++ };
    const out = capture(props), confirm = out.action('confirm');
    assert.ok(out.html.includes(text)); assert.equal(confirm.props.disabled, kind !== 'review');
    confirm.props.onClick(); assert.equal(calls, kind === 'review' ? 1 : 0);
    if (kind !== 'review') assert.ok(out.nodes.some(n => n.props.id === confirm.props['aria-describedby']));
    assert.equal(capture(props).html, out.html);
    if (kind === 'loading' || kind === 'error') assert.doesNotMatch(out.html, /type="file"|data-attachment/);
  }
  const unavailable = capture({ state: { kind: 'review' } });
  assert.equal(unavailable.action('confirm').props.disabled, true); assert.match(unavailable.html, /保存操作暂不可用/);
  const locked = capture({ state: { kind: 'review' }, confirmDisabledReason: '尚未完成人工核对', onConfirm: () => assert.fail() });
  locked.action('confirm').props.onClick(); assert.match(locked.html, /尚未完成人工核对/);
});

test('station facts preserve zero, unknown counts and all semantic connection labels', () => {
  for (const [connection, label] of Object.entries({ connected: '已连接', available: '可用', disconnected: '未连接', offline: '离线', unknown: '连接状态未提供' })) {
    const out = capture({ station: { connection }, onFilesSelected() {} });
    assert.ok(out.html.includes(label)); assert.match(out.html, />未提供</); assert.doesNotMatch(out.html, />0 页</);
    assert.equal(out.nodes.find(n => n.props.type === 'file').props.disabled, false);
  }
  for (const receivedPages of [undefined, null, -1, NaN, 1.2]) assert.doesNotMatch(capture({ station: { ...base.station, receivedPages } }).html, />[\d.-]+ 页</);
  assert.match(capture().html, />0 页</);
  assert.match(capture({ state: { kind: 'receiving' }, station: { ...base.station, receivedPages: 3 } }).html, /已接收 3 页/);
});

test('replacement and limited modes expose scope, invalid scope blocks selection and save', () => {
  const replacement = capture({ mode: { kind: 'replace-page', targetLabel: '张明第 2 页' } });
  assert.match(replacement.html, /只收 1 页/); assert.match(replacement.html, /仅替换当前缺失页，不新增试卷或覆盖其他正常页面/);
  assert.match(capture({ mode: { kind: 'limited', pageLimit: 2 } }).html, /只收 2 页/);
  for (const mode of [{ kind: 'limited', pageLimit: 0 }, { kind: 'limited', pageLimit: NaN }, { kind: 'limited', pageLimit: 1.5 }, { kind: 'replace-page', targetLabel: ' ' }]) {
    const out = capture({ mode, state: { kind: 'review' }, onConfirm: () => assert.fail(), onFilesSelected: () => assert.fail() });
    assert.equal(out.action('confirm').props.disabled, true); out.action('confirm').props.onClick();
    assert.equal(out.nodes.find(n => n.props.type === 'file').props.disabled, true);
  }
});

test('dual-source copy and platform hints are overridable; steps do not follow reception status', () => {
  assert.match(capture().html, /扫描与上传均可接收：两种方式汇入同一资料清单；接收完成后统一预览、核对并保存/);
  for (const platform of ['android', 'device']) assert.match(capture({ platform }).html, /优先连接数据站扫描/);
  const out = capture({ platformHint: '请放入指定页面', sourceDescription: '统一核对当前资料', state: { kind: 'review' } });
  assert.match(out.html, /请放入指定页面/); assert.match(out.html, /统一核对当前资料/); assert.doesNotMatch(out.html, /扫描与上传均可接收：/);
  assert.match(out.html, /第 1 \/ 3 步 · 扫描 \/ 上传/);
});

test('selector and drop forward unchanged files, respect disabled reasons, and do not infer receipt', () => {
  const calls = [], files = [{ name: '不支持.exe', size: 999999999, type: 'binary' }];
  const props = { onFilesSelected: files => calls.push(files) }, out = capture(props);
  const input = out.nodes.find(n => n.props.type === 'file'), target = { files, value: 'fake' };
  input.props.onChange({ currentTarget: target }); assert.equal(target.value, '');
  out.nodes.find(n => n.props['data-file-drop']).props.onDrop({ preventDefault() {}, stopPropagation() {}, dataTransfer: { files } });
  assert.equal(calls.length, 2); assert.equal(calls[0][0], files[0]); assert.equal(capture(props).html, out.html);
  for (const override of [{ selectionDisabledReason: '已锁定' }, { state: { kind: 'unknown' } }, { onFilesSelected: undefined }]) {
    const disabled = capture({ onFilesSelected: () => assert.fail(), ...override });
    disabled.nodes.find(n => n.props.type === 'file').props.onChange({ currentTarget: { files, value: 'fake' } });
    disabled.nodes.find(n => n.props['data-file-drop']).props.onDrop({ preventDefault() {}, stopPropagation() {}, dataTransfer: { files } });
    assert.equal(disabled.nodes.find(n => n.props.type === 'file').props.disabled, true);
  }
});

test('station/cancel/reception retry/load retry only emit; unknown never retries', () => {
  const calls = [], props = { onCancel: () => calls.push('cancel'), onChangeStation: () => calls.push('station'), onRetry: intent => calls.push(intent) };
  const out = capture({ ...props, state: { kind: 'invalid', reason: '页码不符' } });
  for (const name of ['cancel', 'station', 'retry']) out.action(name).props.onClick();
  capture({ ...props, state: { kind: 'error', reason: '连接错误' } }).action('retry').props.onClick();
  assert.deepEqual(calls, ['cancel', 'station', { kind: 'receive' }, { kind: 'load' }]);
  assert.equal(capture({ ...props, state: { kind: 'unknown' } }).action('retry'), undefined);
  const blocked = capture({ ...props, state: { kind: 'invalid', reason: '页码不符' }, retryDisabledReason: '请先核对' });
  blocked.action('retry').props.onClick(); assert.equal(calls.length, 4); assert.match(blocked.html, /请先核对/);
});

test('attachment intentions retain file version and request ID with independently disabled callbacks', () => {
  const calls = [], item = { ...fixtures[1].props.files[0], status: { state: 'failed', reason: '上传中断', request: { id: 'r1', label: '上传' }, retry: {} } };
  const props = { files: [item], capabilities: { ...base.capabilities, upload: { status: 'supported' } }, onRemove: intent => calls.push(intent), onRetry: intent => calls.push(intent) };
  const before = structuredClone(item), out = capture(props);
  for (const n of out.nodes.filter(n => n.props['data-attachment-action'])) n.props.onClick();
  assert.deepEqual(calls, [{ fileId: item.id, version: 'v1', kind: 'retry', requestId: 'r1' }, { fileId: item.id, version: 'v1', kind: 'remove' }]);
  assert.deepEqual(item, before); assert.equal(capture(props).html, out.html);
  const disabled = capture({ ...props, onRemove: undefined, onRetry: undefined });
  for (const n of disabled.nodes.filter(n => n.props['data-attachment-action'])) { assert.equal(n.props.disabled, true); n.props.onClick(); }
  assert.equal(calls.length, 2);
  const noUpload = capture({ ...props, capabilities: base.capabilities });
  assert.equal(noUpload.nodes.find(n => n.props['data-attachment-action'] === 'retry').props.disabled, true);
});

test('file-input default row remains compatible and renderItem uses exactly one semantic list item', () => {
  const props = { title: '文件', items: fixtures[1].props.files, limits: base.limits, capabilities: base.capabilities, onSelect() {} };
  const old = render(h(AgentFileInput, props)); assert.match(old, /data-file-action="remove"/);
  const custom = render(h(AgentFileInput, { ...props, renderItem: item => h('article', null, item.name) }));
  assert.equal((custom.match(/<li /g) || []).length, 2); assert.equal((custom.match(/<article/g) || []).length, 2);
  assert.doesNotMatch(custom, /data-file-action=/);
});

test('catalog and fixture coverage include themes, narrow width, formula, dialog and neutral copy', () => {
  assert.equal(components.filter(c => c.id === 'material-intake').length, 1);
  assert.equal(fixtures.length, 11);
  const html = render(h(MaterialIntakeDemo));
  for (const theme of ['light', 'paper', 'dark']) assert.ok(html.includes(`data-prism-theme="${theme}"`));
  for (const text of ['w-80', '<math', '打开资料接收', '学生答题卡', '只收 1 页', '上传进度 42%', '校验失败']) assert.ok(html.includes(text));
  assert.doesNotMatch(html, /示例|演示/);
});

test('built route contains the intake page and neutral navigation/spec copy', async () => {
  const { default: worker } = await import('../dist/server/index.js');
  const response = await worker.fetch(new Request('http://localhost/next/components/material-intake', { headers: { accept: 'text/html' } }), { ASSETS: { fetch: async () => new Response('Not found', { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
  assert.equal(response.status, 200);
  const html = await response.text(); assert.match(html, /Material Intake 资料接收/); assert.match(html, /data-material-intake/);
  const visible = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<[^>]*>/g, '');
  assert.doesNotMatch(visible, /示例|演示/);
});
