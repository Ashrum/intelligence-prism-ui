import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { components } from '../lib/prism-next/catalog.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const dir = new URL('../.sites-runtime/attachment-test/', import.meta.url);
await mkdir(dir, { recursive: true });
const file = new URL('bundle.mjs', dir);
await writeFile(file, (await build({ stdin: { contents: `export * from './components/prism-next/attachment'; export * from './components/prism-next/demos/attachment';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false })).outputFiles[0].text);
const { Attachment, PaperCard, PaperCardGrid, AttachmentDemo, attachmentFixtures, paperCardFixtures } = await import(file);
await rm(file);
const h = React.createElement;
const html = (component, props) => render(h(component, props));
function capture(component, props) {
  const nodes = [];
  function walk(n) {
    if (Array.isArray(n)) return n.map(walk);
    if (!React.isValidElement(n)) return n;
    nodes.push(n);
    return React.cloneElement(n, {}, React.Children.map(n.props.children, walk));
  }
  return { nodes, html: render(h(function Probe() { return walk(component(props)); })) };
}
const base = attachmentFixtures[0];
const request = { id: 'r1', label: '原上传请求' };
const attach = item => html(Attachment, { item });

test('all shared lifecycle states are visible; processing never follows upload implicitly', () => {
  const statuses = [
    [{ state: 'selected' }, '已选择'], [{ state: 'queued' }, '等待上传'], [{ state: 'received', request }, '已接收'],
    [{ state: 'uploading', request }, '上传中'], [{ state: 'uploaded' }, '已上传'],
    [{ state: 'invalid', validation: 'type', reason: '类型不支持' }, '校验未通过'],
    [{ state: 'failed', reason: '连接中断' }, '上传失败'], [{ state: 'unknown', request, reason: '等待回执' }, '状态未确认'], [{ state: 'removed' }, '已移除'],
  ];
  for (const [status, label] of statuses) assert.ok(attach({ ...base, status }).includes(label));
  assert.doesNotMatch(attach({ ...base, status: { state: 'uploaded' } }), /正在处理/);
  assert.match(attach(attachmentFixtures[3]), /正在处理 · 识别题目与评分依据/);
  assert.match(attach({ ...base, status: { state: 'failed', reason: '连接中断' } }), /连接中断/);
});

test('processing uses one verbatim host status with explicit tone for running completed and failed facts', () => {
  for (const processing of [
    { label: '正在处理 · 识别题目与评分依据', tone: 'info' },
    { label: '解析已完成', tone: 'success' },
    { label: '解析失败', tone: 'error', description: '评分依据不完整' },
    { label: '解析已完成' },
  ]) {
    const out = attach({ ...base, status: { state: 'uploaded' }, processing });
    assert.equal((out.match(/data-agent-status=/g) || []).length, 1);
    assert.ok(out.includes(`data-agent-status="${processing.tone ?? 'neutral'}"`));
    assert.ok(out.includes(processing.label));
    assert.doesNotMatch(out, /已上传|正在处理：/);
    if (processing.description) assert.ok(out.includes(processing.description));
  }
});

test('processing retry is explicit, versioned and controlled, with its own request and disabled reasons', () => {
  const item = { ...base, version: 'v3', status: { state: 'uploaded' }, processing: { label: '解析失败', tone: 'error', retry: { requestId: 'parse-1' } } };
  const before = structuredClone(item), calls = [];
  const out = capture(Attachment, { item, onAction: intent => calls.push(intent) });
  out.nodes.find(n => n.props['data-attachment-action'] === 'retry').props.onClick();
  assert.deepEqual(calls, [{ fileId: item.id, version: 'v3', kind: 'retry', requestId: 'parse-1' }]);
  assert.deepEqual(item, before);
  assert.equal(attach(item), attach(before));
  assert.doesNotMatch(attach({ ...item, processing: { label: '解析失败', tone: 'error' } }), /data-attachment-action="retry"/);
  for (const overrides of [
    { processing: { ...item.processing, retry: { disabledReason: '正在核对文件' } } },
    { id: '' },
  ]) {
    const disabled = capture(Attachment, { item: { ...item, ...overrides }, onAction: () => assert.fail() });
    const button = disabled.nodes.find(n => n.props['data-attachment-action'] === 'retry');
    assert.equal(button.props.disabled, true); button.props.onClick();
    assert.ok(disabled.nodes.some(n => n.props.id === button.props['aria-describedby']));
  }
  for (const state of ['unknown', 'removed']) assert.doesNotMatch(attach({ ...item, status: { state, reason: '等待回执', request } }), /data-attachment-action="(?:retry|remove)"/);
  const noRequest = capture(Attachment, { item: { ...item, status: { state: 'failed', request, retry: {} }, processing: { ...item.processing, retry: {} } }, onAction: intent => calls.push(intent) });
  noRequest.nodes.find(n => n.props['data-attachment-action'] === 'retry').props.onClick();
  assert.equal(calls.at(-1).requestId, undefined);
});

test('known progress uses exact percentage; unknown and invalid values never masquerade as zero', () => {
  for (const progress of [0, 42, 100]) {
    const out = attach({ ...base, status: { state: 'uploading', request, progress } });
    assert.match(out, new RegExp(`上传进度 ${progress}%`));
    assert.match(out, new RegExp(`aria-valuenow="${progress}"`));
  }
  for (const progress of [undefined, NaN, Infinity, -1, 101]) {
    const out = attach({ ...base, status: { state: 'uploading', request, progress } });
    assert.match(out, /进度未确认/); assert.match(out, /role="progressbar"/);
    assert.doesNotMatch(out, /aria-valuenow=|上传进度 [\d.]+%/);
  }
});

test('remove retry view emit exact versioned intents without mutating facts', () => {
  const item = { ...base, version: 'v2', status: { state: 'failed', reason: '连接中断', request, retry: {} } };
  const before = structuredClone(item), calls = [];
  const out = capture(Attachment, { item, view: {}, onAction: intent => calls.push(intent) });
  for (const kind of ['remove', 'retry', 'view']) out.nodes.find(n => n.props['data-attachment-action'] === kind).props.onClick();
  assert.deepEqual(calls, [{ fileId: item.id, version: 'v2', kind: 'remove' }, { fileId: item.id, version: 'v2', kind: 'retry', requestId: 'r1' }, { fileId: item.id, version: 'v2', kind: 'view' }]);
  assert.deepEqual(item, before); assert.match(attach(item), /上传失败/);
});

test('disabled intents explain reasons; unknown cannot retry or remove; no implicit actions', () => {
  const out = capture(Attachment, { item: { ...base, actions: { remove: { disabledReason: '资料已锁定' } } }, view: { disabledReason: '尚无预览' }, onAction: () => assert.fail() });
  for (const n of out.nodes.filter(n => n.props['data-attachment-action'])) {
    assert.equal(n.props.disabled, true); n.props.onClick();
    assert.ok(out.nodes.some(reason => reason.props.id === n.props['aria-describedby']));
  }
  assert.match(out.html, /资料已锁定/); assert.match(out.html, /尚无预览/);
  assert.match(attach(base), /操作暂不可用/);
  for (const status of [{ state: 'unknown', reason: '等待回执', request }, { state: 'removed' }]) {
    assert.doesNotMatch(attach({ ...base, status }), /data-attachment-action="(?:retry|remove)"/);
  }
  assert.doesNotMatch(attach({ ...base, actions: undefined }), /data-attachment-action/);
});

test('long filenames retain prefix tail and accessible full name; size formatting and media fallbacks', () => {
  const out = capture(Attachment, { item: base });
  const title = out.nodes.find(n => n.props.title === base.name);
  assert.equal(title.props['aria-label'], base.name);
  assert.ok(out.html.includes(base.name.slice(-12))); assert.match(out.html, /truncate/); assert.match(out.html, /8.4 MB/);
  assert.match(attach({ ...base, name: '短名.pdf', sizeBytes: undefined }), /大小未确认/);
  assert.match(attach({ ...base, sizeBytes: 0 }), /0 B/);
  assert.match(attach({ ...base, sizeBytes: 1024 }), /1 KB/);
  assert.match(attach({ ...base, name: '照片.png', type: 'image/png' }), /aria-label="图片文件"/);
  assert.match(attach({ ...base, name: '依据.docx', type: 'Word' }), /aria-label="文档文件"/);
  assert.match(html(Attachment, { item: base, thumbnailUrl: '/sample.png' }), /src="\/sample.png"/);
  for (const size of ['sm', 'md', 'lg']) assert.match(html(Attachment, { item: base, size }), new RegExp(`data-size="${size}"`));
});

test('paper missing facts appear once, preserve partial metadata, and never invent zero pages', () => {
  const basePaper = { id: 'p1', studentName: '学生', status: { label: '未交' } };
  const out = html(PaperCard, basePaper);
  assert.equal((out.match(/>考号、页数未提供</g) || []).length, 1);
  assert.match(out, /role="img"[^>]*aria-label="扫描图像未接入"/); assert.doesNotMatch(out, />0 页</);
  for (const pageCount of [0, -1, NaN, 1.5]) assert.match(html(PaperCard, { ...basePaper, pageCount }), /考号、页数未提供/);
  assert.match(html(PaperCard, { ...basePaper, examNumber: '123' }), /考号 123 · 页数未提供/);
  assert.match(html(PaperCard, { ...basePaper, pageCount: 6 }), /考号未提供 · 6 页/);
});

test('paper status selection reason and view are controlled, A3 landscape has correct ratio', () => {
  const calls = [], props = { ...paperCardFixtures[3], selected: true, paperSize: 'A3', orientation: 'landscape', onView: id => calls.push(id) };
  const out = capture(PaperCard, props);
  assert.match(out.html, /aria-current="true"/); assert.match(out.html, /当前预览/); assert.match(out.html, /异常/);
  const reason = out.nodes.find(n => n.props.title === props.reason);
  assert.match(reason.props.className, /line-clamp-2/); assert.equal(reason.props.children, props.reason);
  out.nodes.find(n => n.props.onClick).props.onClick(); assert.deepEqual(calls, [props.id]);
  assert.equal(capture(PaperCard, props).html, out.html);
  const ratio = out.nodes.find(n => n.props.style?.aspectRatio).props.style.aspectRatio.split(' / ').map(Number);
  assert.ok(Math.abs(ratio[0] / ratio[1] - 420 / 297) < 0.001);
  assert.doesNotMatch(html(PaperCard, { ...props, selected: false }), /aria-current=|当前预览/);
  assert.equal(capture(PaperCard, { ...props, onView: undefined }).nodes.find(n => n.props.onClick).props.disabled, true);
});

test('grid alone owns maxHeight, keyboard scrolling and responsive minimum columns', () => {
  const out = capture(PaperCardGrid, { maxHeight: 420, children: h(PaperCard, paperCardFixtures[0]) });
  const region = out.nodes.find(n => 'data-paper-card-grid' in n.props);
  assert.equal(region.props.style.maxHeight, 420); assert.equal(region.props.tabIndex, 0);
  assert.match(region.props.className, /overflow-y-auto/); assert.match(region.props.className, /overscroll-contain/);
  assert.equal(out.nodes.find(n => n.props.style?.gridTemplateColumns).props.style.gridTemplateColumns, 'repeat(auto-fill, minmax(min(168px, 100%), 1fr))');
});

test('grid loading empty error replace stale facts; retry emits intent; ready empty list has empty state', () => {
  for (const state of ['loading', 'empty', 'error']) {
    let count = 0;
    const out = capture(PaperCardGrid, { state, children: h(PaperCard, paperCardFixtures[0]), emptyMessage: '没有接收记录', errorMessage: '连接失败', onRetry: () => count++ });
    assert.doesNotMatch(out.html, /data-paper-card=/);
    if (state === 'loading') assert.match(out.html, /aria-busy="true"/);
    if (state === 'empty') assert.match(out.html, /没有接收记录/);
    if (state === 'error') { assert.match(out.html, /role="alert"/); out.nodes.find(n => n.props.onClick).props.onClick(); assert.equal(count, 1); }
  }
  for (const children of [undefined, null, false, true, '', [], [null, false], [undefined, true, ''], [[null], [false, []]]]) {
    const out = html(PaperCardGrid, { children });
    assert.match(out, /尚未接收学生试卷/);
    assert.doesNotMatch(out, /grid-template-columns/);
  }
  const mixed = html(PaperCardGrid, { children: [null, false, h(PaperCard, { ...paperCardFixtures[0], key: 'paper' })] });
  assert.match(mixed, /data-paper-card=/);
  assert.doesNotMatch(mixed, /尚未接收学生试卷/);
});

test('single catalog entry and full demo cover lifecycle sizes eight students themes narrow and formulas', () => {
  assert.equal(components.filter(c => c.id === 'attachment').length, 1);
  assert.equal(components.filter(c => c.id === 'paper-card').length, 0);
  assert.equal(attachmentFixtures.length, 8); assert.equal(paperCardFixtures.length, 8);
  const out = html(AttachmentDemo, {});
  for (const theme of ['light', 'paper', 'dark']) assert.match(out, new RegExp(`data-prism-theme="${theme}"`));
  for (const size of ['sm', 'md', 'lg']) assert.match(out, new RegExp(`data-size="${size}"`));
  assert.doesNotMatch(out, /示例|演示/);
  assert.match(out, /320px/); assert.match(out, /<math/); assert.match(out, /未交/); assert.match(out, /扫描中/);
});


test('built attachment page uses neutral copy throughout navigation content and expanded spec', async () => {
  const { default: worker } = await import(new URL('../dist/server/index.js', import.meta.url));
  const response = await worker.fetch(new Request('http://localhost/next/components/attachment', { headers: { accept: 'text/html' } }), { ASSETS: { fetch: async () => new Response('Not found', { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
  assert.equal(response.status, 200);
  const markup = await response.text();
  const visible = markup.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, '');
  assert.doesNotMatch(visible, /示例|演示/);
  for (const label of ['应用页面', 'Agent 工作区', '视觉呈现', '解析已完成', '解析失败', '正在处理 · 识别题目与评分依据']) assert.ok(visible.includes(label), label);
});
