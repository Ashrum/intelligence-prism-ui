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
const { Attachment, PaperCard, PaperCardGrid, AttachmentDemo, attachmentFixtures, paperCardFixtures, sheetPaperFixtures, denseSheetPaperFixtures, anonymousSheetPaperFixtures } = await import(file);
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
  assert.equal(region.props.style.maxHeight, 420); assert.equal(region.type.name, 'ScrollArea');
  assert.equal(region.props.overscrollContain, true); assert.equal(region.props.scrollFade, true);
  assert.match(region.props.className, /max-h-\[inherit\]/);
  assert.match(out.html, /data-slot="scroll-area-viewport"/);
  assert.doesNotMatch(html(PaperCardGrid, { children: h(PaperCard, paperCardFixtures[0]) }), /scroll-area-viewport/);
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

test('compact paper keeps a proportional thumbnail and emits the same view intent independently of resolution', () => {
  const events = [], props = { ...paperCardFixtures[3], compact: true, paperSize: 'A3', orientation: 'landscape', thumbnailUrl: '/scan.png', onView: id => events.push(['view', id]), onResolve: id => events.push(['resolve', id]), resolveLabel: '核对扫描' };
  const before = capture(PaperCard, props);
  const action = kind => before.nodes.find(n => n.props['data-paper-action'] === kind);
  for (const kind of ['thumbnail', 'view', 'resolve']) {
    assert.equal(action(kind).props.type, 'button'); assert.equal(action(kind).props.disabled, false);
    action(kind).props.onClick();
  }
  assert.deepEqual(events, [['view', props.id], ['view', props.id], ['resolve', props.id]]);
  assert.equal(capture(PaperCard, props).html, before.html);
  assert.equal(before.nodes.find(n => n.props['data-paper-card']).props.onClick, undefined);
  const thumbnail = action('thumbnail');
  assert.match(thumbnail.props.className, /w-20/); assert.match(thumbnail.props.className, /sm:h-auto/);
  const ratio = thumbnail.props.style.aspectRatio.split(' / ').map(Number);
  assert.ok(Math.abs(ratio[0] / ratio[1] - 420 / 297) < .001);
  assert.match(before.html, /src="\/scan.png"/);
  assert.match(before.html, /查看\/放大/);
  const reason = before.nodes.find(n => n.props.title === props.reason);
  assert.equal(reason.props.children, props.reason); assert.match(reason.props.className, /line-clamp-2/);
});

test('compact missing facts preserve image placeholder and explicit card variant without invented copy', () => {
  const props = { id: 'p', studentName: '学生', compact: true, status: { label: '未交' } };
  for (const pageCount of [undefined, NaN, 0, -1, 1.5]) {
    const out = html(PaperCard, { ...props, pageCount, examNumber: '  ' });
    assert.match(out, /aria-label="扫描图像未接入"/);
    assert.doesNotMatch(out, /考号|页数未提供|0 页|等待提交|处置未交|未交 · 学生|data-placeholder/);
  }
  assert.match(html(PaperCard, { ...props, pageCount: 3 }), /title="3 页"/);
  assert.match(html(PaperCard, { ...props, examNumber: '123', pageCount: 3 }), /考号 123 · 3 页/);
  const placeholder = html(PaperCard, { ...props, placeholder: true, viewLabel: '查看提交记录' });
  assert.match(placeholder, /data-placeholder="true"/); assert.match(placeholder, /border-dashed bg-muted/);
  assert.match(placeholder, /查看提交记录/); assert.doesNotMatch(placeholder, /data-paper-action="resolve"/);
});

test('paper intents reject empty IDs and absent callbacks; compact grid keeps independent layout ownership', () => {
  const fail = () => assert.fail('disabled intent fired');
  for (const props of [{ id: ' ', onView: fail, onResolve: fail }, { id: 'valid' }]) {
    const out = capture(PaperCard, { studentName: '学生', compact: true, status: { label: '未知' }, ...props });
    for (const action of out.nodes.filter(n => n.props['data-paper-action'])) {
      assert.equal(action.props.disabled, true); action.props.onClick();
    }
  }
  const grid = capture(PaperCardGrid, { compact: true, className: 'max-w-xl', maxHeight: 300, children: h(PaperCard, paperCardFixtures[0]) });
  assert.match(grid.html, /min\(172px, 100%\)/); assert.match(grid.html, /max-w-xl/);
  assert.doesNotMatch(grid.html, /data-compact="true"/);
});

test('explicit card variant retains default and compact output; density cannot alter card grids', () => {
  for (const compact of [false, true]) {
    for (const item of paperCardFixtures) {
      assert.equal(html(PaperCard, { ...item, compact }), html(PaperCard, { ...item, compact, variant: 'card' }));
    }
    const props = { compact, children: h(PaperCard, paperCardFixtures[0]) };
    assert.equal(html(PaperCardGrid, props), html(PaperCardGrid, { ...props, variant: 'card', density: 'dense' }));
  }
});

test('sheet paper is one native view button; controlled selection and status survive invocation', () => {
  const events = [], props = { ...sheetPaperFixtures[1], variant: 'sheet', selected: true, onView: id => events.push(id) };
  const out = capture(PaperCard, props);
  const buttons = out.nodes.filter(n => n.type === 'button');
  assert.equal(buttons.length, 1);
  const button = buttons[0];
  assert.equal(button.props.type, 'button'); assert.equal(button.props.disabled, false);
  assert.equal(button.props['aria-label'], '查看/放大：李明泽的试卷');
  assert.equal(button.props['aria-current'], 'true');
  assert.ok(out.nodes.some(n => n.props.id === button.props['aria-describedby'] && n.props.children === '已接收'));
  button.props.onClick(); assert.deepEqual(events, [props.id]);
  assert.equal(capture(PaperCard, props).html, out.html);
  assert.match(out.html, /data-paper-stack/); assert.match(out.html, /data-paper-success/); assert.match(out.html, /ring-2 ring-ring/);
  assert.match(out.html, /考号 20260119 · 6 页/);
  assert.doesNotMatch(out.html, /data-paper-action="view"|当前预览/);
  assert.equal(out.nodes.find(n => n.type === 'article').props.onClick, undefined);
});

test('sheet known facts and paper proportions are preserved without fabricated counts or status', () => {
  const props = { id: 'sheet', variant: 'sheet', studentName: '', status: { label: '已接收' } };
  for (const pageCount of [undefined, NaN, 0, -1, 1.5, 1]) {
    const out = html(PaperCard, { ...props, pageCount });
    assert.match(out, /姓名未提供/); assert.match(out, /扫描图像未接入/);
    assert.doesNotMatch(out, /data-paper-stack|data-paper-success|data-slot="badge"|考号|页数未提供/);
    if (pageCount !== 1) assert.doesNotMatch(out, /<p /);
  }
  assert.match(html(PaperCard, { ...props, examNumber: ' 123 ' }), /考号 123/);
  assert.match(html(PaperCard, { ...props, pageCount: 2 }), /2 页/);
  for (const paperSize of ['A4', 'A3']) for (const orientation of ['portrait', 'landscape']) {
    const out = capture(PaperCard, { ...props, paperSize, orientation });
    const ratio = out.nodes.find(n => n.props['data-paper-sheet-media'] !== undefined).props.style.aspectRatio.split(' / ').map(Number);
    const expected = paperSize === 'A4' ? 210 / 297 : 297 / 420;
    assert.ok(Math.abs(ratio[0] / ratio[1] - (orientation === 'portrait' ? expected : 1 / expected)) < .001);
  }
});

test('waiting sheet only resolves through a native button; absent resolver produces a static paper slot', () => {
  const events = [], props = { ...sheetPaperFixtures[3], variant: 'sheet', pageCount: 6, thumbnailUrl: '/ignored.png', status: { label: '等待接收', tone: 'success' }, onView: () => assert.fail('waiting cannot view'), onResolve: id => events.push(id) };
  const out = capture(PaperCard, props), actions = out.nodes.filter(n => n.props['data-paper-action']);
  assert.equal(actions.length, 1); assert.equal(actions[0].type, 'button');
  assert.equal(actions[0].props['data-paper-action'], 'resolve');
  assert.equal(actions[0].props['aria-label'], '处置未交：陈思远');
  actions[0].props.onClick(); assert.deepEqual(events, [props.id]);
  assert.match(out.html, /border-dashed/); assert.match(out.html, /text-item-title text-muted-foreground/);
  assert.doesNotMatch(out.html, /<img|data-paper-success|data-paper-stack|<svg|animate-/);
  const passive = capture(PaperCard, { ...props, onResolve: undefined, status: { label: '等待接收', tone: 'error' } });
  assert.doesNotMatch(passive.html, /<button|tabindex|data-slot="badge"|data-paper-action|border-destructive/);
  assert.match(passive.html, /role="img" aria-label="陈思远：等待接收"/);
  assert.equal(passive.nodes.some(n => n.props.onClick), false);
});

test('error sheet retains view intent, exposes full reason and renders a standard sm resolve button', () => {
  const events = [], props = { ...sheetPaperFixtures[4], variant: 'sheet', onView: id => events.push(['view', id]), onResolve: id => events.push(['resolve', id]) };
  const out = capture(PaperCard, props);
  const view = out.nodes.find(n => n.props['data-paper-action'] === 'thumbnail');
  const resolve = out.nodes.find(n => n.props['data-paper-action'] === 'resolve');
  view.props.onClick(); resolve.props.onClick();
  assert.deepEqual(events, [['view', props.id], ['resolve', props.id]]);
  assert.equal(resolve.props.size, 'sm'); assert.equal(resolve.props.variant, 'outline');
  assert.doesNotMatch(resolve.props.className, /min-h|h-auto/);
  assert.match(out.html, /border-destructive-foreground bg-card/);
  assert.match(out.html, /bg-destructive-foreground text-background/); assert.doesNotMatch(out.html, /data-paper-success/);
  const reason = out.nodes.find(n => n.props.title === props.reason);
  assert.equal(reason.props.children, props.reason); assert.match(reason.props.className, /truncate text-ui-hint text-destructive-foreground/);
  assert.ok(view.props['aria-describedby'].split(' ').includes(reason.props.id));
  assert.doesNotMatch(html(PaperCard, { ...props, onResolve: undefined }), /data-paper-action="resolve"/);
  assert.doesNotMatch(html(PaperCard, { ...props, reason: undefined }), /<p /);
});

test('sheet status badges depend on explicit tone, never label matching', () => {
  for (const tone of ['neutral', 'info', 'warning']) {
    const out = html(PaperCard, { ...sheetPaperFixtures[0], variant: 'sheet', status: { label: '已排除', tone }, onResolve: tone === 'warning' ? undefined : () => {} });
    assert.match(out, /data-slot="badge"/); assert.match(out, /已排除/);
    assert.doesNotMatch(out, /data-paper-success|data-paper-action="resolve"/);
  }
  const out = html(PaperCard, { ...sheetPaperFixtures[0], variant: 'sheet', status: { label: '扫描异常' } });
  assert.doesNotMatch(out, /data-slot="badge"|border-destructive|data-paper-success/);
});

test('warning with resolution presents a pending sheet and keeps view and resolution intents separate', () => {
  const events = [], props = { ...sheetPaperFixtures[5], variant: 'sheet', examNumber: '20260118', pageCount: 2, selected: true,
    reason: '姓名与考号未识别，请核对这份含有跨页作答的试卷后指定学生。',
    onView: id => events.push(['view', id]), onResolve: id => events.push(['resolve', id]) };
  const out = capture(PaperCard, props);
  const article = out.nodes.find(n => n.type === 'article');
  const view = out.nodes.find(n => n.props['data-paper-action'] === 'thumbnail');
  const resolve = out.nodes.find(n => n.props['data-paper-action'] === 'resolve');
  const marker = out.nodes.find(n => n.props['data-paper-pending']);
  const badge = out.nodes.find(n => n.props.title === props.status.label);
  const reason = out.nodes.find(n => n.type === 'p');
  assert.match(article.props.className, /border-dashed border-warning-foreground bg-card/);
  assert.ok(out.nodes.some(n => n.type === 'span' && /shadow-md border-dashed border-warning-foreground/.test(n.props.className)));
  assert.match(badge.props.className, /bg-warning-foreground text-background dark:bg-warning-foreground/);
  assert.equal(marker.props['aria-hidden'], 'true'); assert.equal(marker.props.children, '?');
  assert.match(marker.props.className, /rounded-full bg-warning-foreground/);
  assert.equal(reason.props.children, props.reason); assert.equal(reason.props.title, props.reason);
  assert.match(reason.props.className, /truncate text-ui-hint text-warning-foreground/);
  for (const action of [view, resolve]) {
    const descriptions = action.props['aria-describedby'].split(' ').map(id => out.nodes.find(n => n.props.id === id)?.props.children);
    assert.deepEqual(descriptions, [props.status.label, props.reason]);
  }
  assert.equal(view.type, 'button'); assert.equal(view.props['aria-label'], '查看/放大：未知学生的试卷');
  assert.equal(view.props['aria-current'], 'true');
  assert.equal(resolve.props.size, 'sm'); assert.equal(resolve.props.variant, 'outline');
  assert.equal(resolve.props['aria-label'], '指定学生：未知学生');
  assert.doesNotMatch(resolve.props.className, /min-h|h-auto/);
  assert.doesNotMatch(out.html, /data-paper-success|border-destructive|data-paper-exam-prefix/);
  view.props.onClick(); resolve.props.onClick();
  assert.deepEqual(events, [['view', props.id], ['resolve', props.id]]);
  assert.equal(capture(PaperCard, props).html, out.html);
});

test('pending sheet without a reason falls back to known metadata and guards unavailable actions', () => {
  const props = { ...sheetPaperFixtures[5], variant: 'sheet', reason: undefined, onResolve: () => {} };
  for (const [metadata, title] of [[{ examNumber: ' 20260118 ', pageCount: 2 }, '考号 20260118 · 2 页'], [{ examNumber: '123' }, '考号 123'], [{ pageCount: 2 }, '2 页'], [{ pageCount: 0 }, undefined]]) {
    const out = capture(PaperCard, { ...props, ...metadata });
    const information = out.nodes.find(n => n.type === 'p');
    assert.equal(information?.props.title, title);
    assert.equal(out.nodes.find(n => n.props['data-paper-action'] === 'thumbnail').props['aria-describedby'].split(' ').length, 1);
  }
  const disabled = capture(PaperCard, { ...props, id: ' ', onView: () => assert.fail('view fired'), onResolve: () => assert.fail('resolve fired') });
  for (const action of disabled.nodes.filter(n => n.props['data-paper-action'])) {
    assert.equal(action.props.disabled, true); action.props.onClick();
  }
  const noView = capture(PaperCard, props);
  assert.equal(noView.nodes.find(n => n.props['data-paper-action'] === 'thumbnail').props.disabled, true);
  assert.equal(noView.nodes.find(n => n.props['data-paper-action'] === 'resolve').props.disabled, false);
});

test('pending presentation requires warning and resolution and never overrides placeholders', () => {
  const props = { ...sheetPaperFixtures[5], variant: 'sheet', pageCount: 2 };
  const passive = html(PaperCard, props);
  assert.match(passive, /data-slot="badge"/); assert.match(passive, /title="2 页"/);
  assert.doesNotMatch(passive, /data-paper-pending|data-paper-action="resolve"|border-dashed|bg-warning-foreground|姓名与考号未识别/);
  const waiting = capture(PaperCard, { ...props, placeholder: true, onResolve: () => {} });
  assert.doesNotMatch(waiting.html, /data-paper-pending|data-slot="badge"|border-warning-foreground|<img/);
  assert.equal(waiting.nodes.filter(n => n.props['data-paper-action']).length, 1);
  const renamed = html(PaperCard, { ...props, status: { tone: 'warning', label: '需要教师核对' }, onResolve: () => {} });
  assert.match(renamed, /data-paper-pending/); assert.match(renamed, /需要教师核对/);
});

test('sheet prevents all intents on empty IDs and disables viewing without a callback', () => {
  const fail = () => assert.fail('ineligible sheet intent fired');
  for (const placeholder of [false, true]) {
    const out = capture(PaperCard, { ...sheetPaperFixtures[4], variant: 'sheet', id: ' ', placeholder, onView: fail, onResolve: fail });
    for (const node of out.nodes.filter(n => n.props['data-paper-action'])) {
      assert.equal(node.props.disabled, true); node.props.onClick();
    }
  }
  const out = capture(PaperCard, { ...sheetPaperFixtures[0], variant: 'sheet' });
  const view = out.nodes.find(n => n.props['data-paper-action'] === 'thumbnail');
  assert.equal(view.props.disabled, true); view.props.onClick();
});

test('sheet grid density sets column and paper layout without assigning child variants or changing scroll behavior', () => {
  for (const [density, width, gap] of [['comfortable', 160, 'gap-x-3 gap-y-2'], ['dense', 112, 'gap-x-2 gap-y-1']]) {
    const props = { variant: 'sheet', density, maxHeight: 300, children: h(PaperCard, paperCardFixtures[0]) };
    const out = html(PaperCardGrid, props);
    assert.ok(out.includes(`min(${width}px, 100%)`)); assert.ok(out.includes(gap));
    assert.match(out, /scroll-area-viewport/); assert.match(out, /max-height:300px/);
    assert.doesNotMatch(out, /data-paper-variant="sheet"/);
    const sheet = html(PaperCardGrid, { ...props, children: h(PaperCard, { ...sheetPaperFixtures[0], variant: 'sheet', compact: true }) });
    assert.match(sheet, /data-paper-variant="sheet"/); assert.doesNotMatch(sheet, /data-compact/);
    if (density === 'dense') {
      assert.match(sheet, /w-\[84px\]/);
      assert.ok(sheet.includes('[&amp;&gt;[data-paper-variant=sheet]]:px-0.5'));
    }
  }
  assert.match(html(PaperCardGrid, { variant: 'sheet', children: h(PaperCard, paperCardFixtures[0]) }), /min\(160px, 100%\)/);
});

test('sheet dense metadata keeps an accessible exam prefix and full title without changing waiting or error text', () => {
  const props = { ...sheetPaperFixtures[0], variant: 'sheet', examNumber: '20260118', pageCount: 2 };
  const out = capture(PaperCard, props);
  const prefix = out.nodes.find(n => n.props['data-paper-exam-prefix'] !== undefined);
  assert.equal(prefix.props.children, '考号 ');
  assert.equal(prefix.props['aria-hidden'], undefined);
  assert.match(out.html, /title="考号 20260118 · 2 页"/);
  assert.match(out.html, /data-paper-exam-prefix="true">考号 <\/span>20260118 · 2 页/);
  for (const density of ['comfortable', 'dense']) {
    const grid = capture(PaperCardGrid, { variant: 'sheet', density, children: h(PaperCard, props) });
    const layout = grid.nodes.find(n => n.props.style?.gridTemplateColumns);
    assert.equal(layout.props.className.includes('[&>[data-paper-variant=sheet]_[data-paper-exam-prefix]]:sr-only'), density === 'dense');
  }
  for (const overrides of [{ examNumber: undefined }, { placeholder: true }, { status: { label: '未匹配学生', tone: 'error' }, reason: '考号无法识别' }]) {
    assert.doesNotMatch(html(PaperCard, { ...props, ...overrides }), /data-paper-exam-prefix/);
  }
  assert.match(html(PaperCard, { ...props, examNumber: '20260118123456789' }), /title="考号 20260118123456789 · 2 页"/);
});

test('sheet badges reserve the right check position and retain full long status titles', () => {
  for (const label of ['已排除', '未匹配学生', '未匹配学生需要进一步核对']) {
    const out = capture(PaperCard, { ...sheetPaperFixtures[5], variant: 'sheet', status: { label, tone: 'error' } });
    const badge = out.nodes.find(n => n.props.title === label);
    assert.equal(badge.props.children.props.children, label);
    assert.equal(badge.props.children.props.className, 'truncate');
    assert.match(badge.props.className, /-left-1\.5 max-w-\[calc\(100%-0\.5rem\)\] px-0\.5/);
    assert.doesNotMatch(out.html, /data-paper-success/);
  }
});

test('sheet fixtures cover all requested states with 24 dense papers', () => {
  assert.equal(denseSheetPaperFixtures.length, 24);
  assert.equal(new Set(denseSheetPaperFixtures.map(item => item.id)).size, 24);
  for (const label of ['已接收', '等待接收', '扫描异常', '未知学生', '已排除']) assert.ok(sheetPaperFixtures.some(item => item.status.label === label));
  for (const fixtures of [sheetPaperFixtures, denseSheetPaperFixtures]) {
    assert.ok(fixtures.some(item => item.status.tone === 'warning' && item.status.label === '未知学生' && item.reason === '姓名与考号未识别' && item.resolveLabel === '指定学生'));
  }
  const out = html(AttachmentDemo, {});
  assert.match(out, /comfortable/); assert.match(out, /dense · 24 份/);
  assert.doesNotMatch(out, /示例|演示/);
  assert.deepEqual(anonymousSheetPaperFixtures.map(item => item.slotLabel), ['4', '5', '6']);
  assert.ok(anonymousSheetPaperFixtures.every(item => !item.studentName && item.placeholder));
  assert.match(out, /未知学生待处理卡 \+ 无姓名骨架/);
  assert.equal((out.match(/data-paper-variant="sheet"/g) || []).length, (sheetPaperFixtures.length + 24 + 6) * 4 + 4);
  assert.equal((out.match(/data-paper-identity-skeleton="true"/g) || []).length, 27);
  assert.equal((out.match(/data-paper-pending="true"/g) || []).length, 13);
});

test('anonymous sheet placeholders expose a named static slot, description and two hidden skeleton bars', () => {
  for (const studentName of ['', '  ']) for (const slotLabel of [undefined, '', '4']) {
    const props = { id: 'slot', studentName, variant: 'sheet', placeholder: true, slotLabel, status: { label: '等待扫描回执', tone: 'error' }, onView: () => assert.fail('cannot view') };
    const out = capture(PaperCard, props), card = out.nodes.find(n => n.type === 'article');
    assert.equal(card.props['aria-label'], `等待接收的试卷位${slotLabel ? ` ${slotLabel}` : ''}`);
    assert.equal(card.props['aria-labelledby'], undefined);
    assert.ok(out.nodes.some(n => n.props.id === card.props['aria-describedby'] && n.props.children === props.status.label));
    const skeleton = out.nodes.find(n => n.props['data-paper-identity-skeleton'] !== undefined);
    assert.equal(skeleton.props['aria-hidden'], 'true');
    const bars = React.Children.toArray(skeleton.props.children);
    assert.equal(bars.length, 2);
    assert.match(bars[0].props.className, /h-2\.5 w-14.*rounded-full bg-border/);
    assert.match(bars[1].props.className, /h-2 w-9.*rounded-full bg-muted/);
    const glyph = out.nodes.find(n => n.props['data-paper-slot-label'] !== undefined);
    assert.equal(!!glyph, !!slotLabel);
    if (glyph) { assert.equal(glyph.props['aria-hidden'], 'true'); assert.equal(glyph.props.focusable, 'false'); assert.equal(glyph.props.children.props.children, slotLabel); }
    assert.equal(out.nodes.some(n => n.props.onClick || n.props.tabIndex !== undefined), false);
    assert.match(out.html, /border-dashed/);
    assert.doesNotMatch(out.html, /姓名未提供|<h3|<p |<button|tabindex|data-paper-action|animate-|animation|data-paper-success|data-paper-stack|data-slot="badge"/);
  }
});

test('anonymous sheet resolution is explicit, native and controlled, with the slot accessible name', () => {
  const calls = [], props = { id: 'slot-6', studentName: '', variant: 'sheet', placeholder: true, slotLabel: '6', status: { label: '等待接收' }, onResolve: id => calls.push(id), onView: () => assert.fail('cannot view') };
  const out = capture(PaperCard, props), buttons = out.nodes.filter(n => n.type === 'button');
  assert.equal(buttons.length, 1);
  const button = buttons[0];
  assert.equal(button.props.type, 'button'); assert.equal(button.props.disabled, false);
  assert.equal(button.props['aria-label'], '等待接收的试卷位 6');
  assert.ok(out.nodes.some(n => n.props.id === button.props['aria-describedby'] && n.props.children === '等待接收'));
  button.props.onClick(); assert.deepEqual(calls, ['slot-6']);
  assert.equal(capture(PaperCard, props).html, out.html);
  const disabled = capture(PaperCard, { ...props, id: ' ' }).nodes.find(n => n.type === 'button');
  assert.equal(disabled.props.disabled, true); disabled.props.onClick(); assert.deepEqual(calls, ['slot-6']);
});

test('anonymous sheet retains A4/A3 portrait/landscape paper proportions', () => {
  for (const paperSize of ['A4', 'A3']) for (const orientation of ['portrait', 'landscape']) {
    const out = capture(PaperCard, { ...anonymousSheetPaperFixtures[0], variant: 'sheet', paperSize, orientation });
    const media = out.nodes.find(n => n.props['data-paper-sheet-media'] !== undefined);
    const [w, h] = media.props.style.aspectRatio.split(' / ').map(Number);
    const ratio = paperSize === 'A4' ? 210 / 297 : 297 / 420;
    assert.ok(Math.abs(w / h - (orientation === 'portrait' ? ratio : 1 / ratio)) < .001);
  }
});

test('slotLabel does not alter named waiting sheets, received sheets, default cards or compact cards', () => {
  for (const props of [
    ...[false, true].flatMap(compact => [false, true].map(placeholder => ({ ...paperCardFixtures[0], studentName: '', compact, placeholder }))),
    ...[undefined, () => {}].map(onResolve => ({ ...sheetPaperFixtures[3], variant: 'sheet', onResolve })),
    { ...sheetPaperFixtures[0], variant: 'sheet', studentName: '' },
  ]) {
    assert.equal(html(PaperCard, props), html(PaperCard, { ...props, slotLabel: '4' }));
    assert.doesNotMatch(html(PaperCard, { ...props, slotLabel: '4' }), /data-paper-identity-skeleton|data-paper-slot-label/);
  }
});
