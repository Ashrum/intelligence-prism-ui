import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = new URL('../.sites-runtime/image-canvas/', import.meta.url);
await mkdir(runtime, { recursive: true });
const options = { stdin: { contents: `export * from './components/prism-next/agent-image-canvas'; export * from './components/prism-next/demos/agent-image-canvas';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false };
const file = new URL('test-bundle.mjs', runtime), probeFile = new URL('probe-bundle.mjs', runtime);
await writeFile(file, (await build(options)).outputFiles[0].text);
const { AgentImageCanvas, AgentImageCanvasDemo, imageCanvasExamples, isAgentImageRect, agentImageRectFromPoints, agentImagePanDelta } = await import(file);
// Deterministic state/refs for component event handlers, not a DOM/browser simulation.
await writeFile(probeFile, (await build({ ...options, plugins: [{ name: 'image-ui-state', setup(build) {
  build.onLoad({ filter: /components\/prism-next\/agent-image-canvas\.tsx$/ }, async args => ({ loader: 'tsx', contents: (await readFile(args.path, 'utf8'))
    .replace('useId, useRef, useState, type PointerEvent', 'useId, type PointerEvent')
    .replace('const hasText =', `const useState = (initial: any): any => { const p = (globalThis as any).__imageUI; const index = p.cursor++; if (!(index in p.values)) p.values[index] = initial; return [p.values[index], (value: any) => { p.values[index] = typeof value === "function" ? value(p.values[index]) : value }]; };
const useRef = (initial: any): any => { const p = (globalThis as any).__imageUI; const index = p.refCursor++; return p.refs[index] ??= {current:initial}; };
const hasText =`) }));
} }] })).outputFiles[0].text);
const { AgentImageCanvas: Probe } = await import(probeFile);
await rm(file); await rm(probeFile);
const h = React.createElement;
const first = { id: 'opaque-image-a', name: '扫描第一页', src: 'data:image/svg+xml,%3Csvg%2F%3E', alt: '模拟原稿，有两道题', source: { label: '模拟原稿', openable: true }, version: { id: 'opaque-iv1', label: '示例第一版' }, availability: { state: 'available' }, regions: [{ id: 'opaque-region', label: '第 1 题作答区', source: 'example', rect: [10, 20, 50, 30] }] };
const second = { ...first, id: 'opaque-image-b', name: '第二页', regions: [] };
const all = { view: { supported: true }, zoom: { supported: true }, annotate: { supported: true }, crop: { supported: true }, compose: { supported: true } };
const base = { title: '扫描材料', imageSet: { id: 'opaque-set', version: 'opaque-version' }, images: [first, second], selectedImageId: first.id, capabilities: all, onIntent() {} };
const context = { imageSetId: base.imageSet.id, version: base.imageSet.version, imageId: first.id, imageVersion: first.version.id };
const modes = [{}, { view: 'workspace' }, { density: 'compact' }, { view: 'workspace', density: 'compact' }];
const htmlFor = extra => render(h(AgentImageCanvas, { ...base, ...extra }));
const textOf = node => typeof node === 'string' || typeof node === 'number' ? String(node) : Array.isArray(node) ? node.map(textOf).join('') : React.isValidElement(node) ? textOf(node.props.children) : '';
const button = (nodes, label) => nodes.find(node => node.props.onClick && (node.props['aria-label'] === label || textOf(node.props.children) === label));
const reset = () => { globalThis.__imageUI = { cursor: 0, values: [], refCursor: 0, refs: [] }; };
function capture(extra = {}) {
  globalThis.__imageUI.cursor = 0; globalThis.__imageUI.refCursor = 0;
  const nodes = [];
  function inspect(node) {
    if (Array.isArray(node)) return node.map(inspect);
    if (!React.isValidElement(node)) return node;
    if (node.type === Probe) return h(function Visit() { return inspect(Probe(node.props)); });
    nodes.push(node);
    return React.cloneElement(node, {}, React.Children.map(node.props.children, inspect));
  }
  return { html: render(inspect(h(Probe, { ...base, view: 'workspace', ...extra }))), nodes };
}
const click = (extra, label) => { const node = button(capture(extra).nodes, label); assert.ok(node, label); node.props.onClick({ currentTarget: {} }); return node; };
const input = (extra, suffix, value) => { const node = capture(extra).nodes.find(node => node.props.id?.endsWith(suffix) && node.props.onChange); assert.ok(node, suffix); node.props.onChange({ target: { value } }); };

test('image SSR inline/workspace and compact retain identity, region summary and notice', () => {
  for (const mode of modes) {
    const html = htmlFor(mode);
    for (const text of ['扫描第一页', '模拟原稿', '示例第一版', '尺寸未知', '1 个区域标注', '标注与裁切仅提交请求，不修改原图。']) assert.ok(html.includes(text), text);
    assert.doesNotMatch(html, /opaque-|宿主|回调|意图/);
    assert.match(html, new RegExp(`data-density="${mode.density ?? 'default'}"`));
    assert.equal(html.includes('图片画布，方向键平移'), mode.view === 'workspace');
  }
});
test('missing alt has visible explanation and nonempty accessible replacement', () => {
  for (const mode of modes) {
    const html = htmlFor({ ...mode, images: [{ ...first, alt: ' ' }] });
    assert.match(html, /alt="缺少图片说明"/); assert.match(html, />缺少图片说明<\/p>/);
  }
});
test('unavailable and unsupported view never mount image source; every capability reason survives compact', () => {
  const restricted = { ...first, availability: { state: 'unavailable', reason: '原稿已失效。' } };
  for (const mode of modes) {
    assert.doesNotMatch(htmlFor({ ...mode, images: [restricted] }), /<img/);
    const html = htmlFor({ ...mode, capabilities: Object.fromEntries(Object.keys(all).map(key => [key, { supported: false, reason: `${key}的限制` }])) });
    assert.doesNotMatch(html, /<img/);
    for (const key of Object.keys(all)) assert.ok(html.includes(`${key}的限制`));
  }
  reset(); const extra = { capabilities: { ...all, annotate: { supported: false, reason: '不可标注。' }, crop: { supported: false, reason: '未连接裁切。' } }, onIntent() { assert.fail('unsupported intent'); } };
  for (const label of ['绘制标注', '选择裁切范围', '编辑第 1 题作答区', '删除第 1 题作答区']) assert.equal(click(extra, label).props.disabled, true);
  assert.doesNotMatch(capture(extra).html, /aria-label="范围选择"/);
});
test('selection/source intents preserve exact image-set and source-image versions without internal mutation', () => {
  reset(); const calls = [], extra = { onIntent: value => calls.push(value) };
  click(extra, '第二页'); click(extra, '查看来源');
  assert.deepEqual(calls, [{ ...context, type: 'select-image', imageId: second.id }, { ...context, type: 'open-source' }]);
  assert.match(capture(extra).html, /alt="模拟原稿，有两道题"/);
});
test('numeric equivalent creates exact percentage annotation; component does not add a region', () => {
  reset(); const calls = [], extra = { onIntent: value => calls.push(value) };
  click(extra, '绘制标注'); input(extra, '-label', '教师标注');
  [12.5, 15, 70, 30].forEach((value, index) => input(extra, `-rect-${index}`, String(value)));
  click(extra, '请求添加标注');
  assert.deepEqual(calls, [{ ...context, type: 'annotate-create', region: { label: '教师标注', rect: [12.5, 15, 70, 30], source: 'teacher' } }]);
  assert.match(capture(extra).html, /1 个区域标注/); assert.doesNotMatch(capture(extra).html, /教师标注/);
});
test('annotation update/delete retain target ID; original rect and labels unchanged', () => {
  reset(); const calls = [], extra = { onIntent: value => calls.push(value) };
  click(extra, '编辑第 1 题作答区'); input(extra, '-rect-0', '15'); click(extra, '请求更新标注'); click(extra, '删除第 1 题作答区');
  assert.deepEqual(calls, [{ ...context, type: 'annotate-update', regionId: first.regions[0].id, label: first.regions[0].label, rect: [15, 20, 50, 30] }, { ...context, type: 'annotate-delete', regionId: first.regions[0].id }]);
  assert.deepEqual(first.regions[0].rect, [10, 20, 50, 30]);
});
test('crop emits requested range only; invalid and blank numeric ranges cannot submit', () => {
  reset(); const calls = [], extra = { onIntent: value => calls.push(value) };
  click(extra, '选择裁切范围');
  for (const value of ['', '-1', '101', '90', 'NaN']) { input(extra, '-rect-0', value); assert.equal(click(extra, '请求裁切').props.disabled, true); }
  assert.equal(calls.length, 0); input(extra, '-rect-0', '0'); click(extra, '请求裁切');
  assert.deepEqual(calls, [{ ...context, type: 'crop-request', rect: [0, 10, 40, 30] }]);
});
test('stale draft survives version/availability/region/capability changes but cannot be submitted', () => {
  const changes = [{ imageSet: { ...base.imageSet, version: 'new' } }, { images: [{ ...first, src: 'new-src' }] }, { images: [{ ...first, regions: [] }] }, { capabilities: { ...all, crop: { supported: false, reason: '工具不可用' } } }];
  for (const change of changes) {
    reset(); const extra = { onIntent() { assert.fail('stale crop'); } };
    click(extra, '选择裁切范围'); input(extra, '-rect-0', '17');
    const next = { ...extra, ...change };
    assert.match(capture(next).html, /图片或标注已变化/); assert.match(capture(next).html, /value="17"/);
    assert.equal(click(next, '请求裁切').props.disabled, true); click(next, '取消选区');
    assert.doesNotMatch(capture(next).html, /aria-label="范围选择"/);
  }
});
test('compare requests two or more available images; comparison remains controlled and never combines pixels', () => {
  reset(); const calls = [], extra = { onIntent: value => calls.push(value) };
  click(extra, '并列比较（0）'); assert.equal(calls.length, 0);
  for (const name of ['扫描第一页', '第二页']) capture(extra).nodes.find(node => node.props['aria-label'] === `对比${name}`).props.onCheckedChange(true);
  click(extra, '并列比较（2）');
  assert.deepEqual(calls, [{ imageSetId: context.imageSetId, version: context.version, type: 'compare', images: [first, second].map(item => ({ imageId: item.id, imageVersion: item.version.id })) }]);
  assert.doesNotMatch(capture(extra).html, /aria-label="图片并列比较"/);
  assert.match(htmlFor({ view: 'workspace', comparisonIds: [first.id, second.id] }), /aria-label="图片并列比较"/);
  assert.doesNotMatch(htmlFor({ view: 'workspace', comparisonIds: [first.id, first.id] }), /aria-label="图片并列比较"/);
});
test('keyboard arrows pan same viewport, do not consume input/list keys; zoom uses existing 50-300 range', () => {
  reset(); const calls = [], scrolls = [], extra = { onIntent: value => calls.push(value) };
  let state = capture(extra);
  globalThis.__imageUI.refs[0].current = { querySelector() { return { scrollBy: value => scrolls.push(value), scrollTo: value => scrolls.push(value) }; } };
  const handle = state.nodes.find(node => node.props.onKeyDown).props.onKeyDown;
  let prevented = 0;
  handle({ key: 'ArrowRight', target: { classList: { contains: () => true } }, preventDefault() { prevented++; } });
  handle({ key: 'ArrowLeft', target: { classList: { contains: () => false } }, preventDefault() { assert.fail('input key consumed'); } });
  assert.equal(prevented, 1); assert.deepEqual(scrolls[0], { left: 40, top: 0 });
  assert.deepEqual(agentImagePanDelta('ArrowUp'), [0, -40]); assert.equal(agentImagePanDelta('a'), null);
  click(extra, '放大'); click(extra, '适应宽度');
  assert.deepEqual(calls, [{ ...context, type: 'zoom', percent: 125 }, { ...context, type: 'zoom', percent: 100 }]);
  assert.deepEqual(scrolls[1], { left: 0, top: 0 });
});
test('pointer selection maps rendered image bounds to percentages and supports reversed drags', () => {
  assert.deepEqual(agentImageRectFromPoints([80, 70], [10, 20]), [10, 20, 70, 50]);
  assert.deepEqual(agentImageRectFromPoints([-10, 0], [110, 100]), [0, 0, 100, 100]);
  assert.equal(agentImageRectFromPoints([10, 10], [10, 30]), null);
  for (const rect of [[NaN, 0, 1, 1], [0, 0, 0, 1], [90, 0, 20, 1], [0, -1, 2, 2]]) assert.equal(isAgentImageRect(rect), false);
  reset(); const calls = [], extra = { onIntent: value => calls.push(value) };
  click(extra, '选择裁切范围');
  globalThis.__imageUI.refs[0].current = { querySelector() { return { getBoundingClientRect: () => ({ left: 100, top: 100, width: 400, height: 800 }) }; } };
  const event = (clientX, clientY) => ({ clientX, clientY, button: 0, isPrimary: true, pointerId: 1, target: { closest: () => null }, currentTarget: { setPointerCapture() {}, hasPointerCapture: () => true, releasePointerCapture() {} } });
  capture(extra).nodes.find(node => node.props.onPointerDown).props.onPointerDown(event(140, 180));
  capture(extra).nodes.find(node => node.props.onPointerMove).props.onPointerMove(event(300, 500));
  // Let pointer end before submit, using the most recent render's closures.
  capture(extra).nodes.find(node => node.props.onPointerUp).props.onPointerUp(event(300, 500));
  globalThis.__imageUI.refs[0].current = null;
  click(extra, '请求裁切'); assert.deepEqual(calls[0], { ...context, type: 'crop-request', rect: [10, 10, 40, 40] });
});
test('region list forwards stable local index to existing viewer, and all coordinate controls have fixed labels', () => {
  reset(); click({}, '定位第 1 题作答区');
  const viewer = capture().nodes.find(node => node.props.label === '图片画布，方向键平移');
  assert.equal(viewer.props.selectedId, '0'); assert.equal(viewer.props.regions[0].id, '0');
  click({}, '绘制标注'); const state = capture();
  for (const label of ['区域名称', '左侧（%）', '顶部（%）', '宽度（%）', '高度（%）']) assert.ok(state.html.includes(label));
  assert.equal(state.nodes.filter(node => node.props.type === 'number' && node.props.step === '0.1').length, 4);
});
test('copy shares capability reasons, keeps a single notice, collapses details, and avoids internal IDs', () => {
  for (const mode of modes) {
    const html = htmlFor({ ...mode, capabilities: { ...all, annotate: { supported: false, reason: '当前工具仅供查看。' }, crop: { supported: false, reason: '当前工具仅供查看。' } }, details: 'COLLAPSED_DETAILS' });
    assert.equal(html.split('当前工具仅供查看。').length - 1, 1);
    assert.equal(html.split('data-image-notice=').length - 1, 1);
    assert.doesNotMatch(html, /COLLAPSED_DETAILS|opaque-/);
  }
  const unavailableImages = [first, second].map(item => ({ ...item, availability: { state: 'unavailable', reason: '同一来源暂不可用。' } }));
  const html = htmlFor({ view: 'workspace', images: unavailableImages, comparisonIds: [first.id, second.id] });
  assert.equal(html.split('同一来源暂不可用。').length - 1, 1);
  assert.match(html, /全部图片/); assert.match(html, /aria-describedby=/);
});
test('empty, missing selection, duplicate IDs, no receiver and failed image do not manufacture operations', () => {
  assert.match(htmlFor({ images: [], selectedImageId: null }), /暂无图片/);
  assert.match(htmlFor({ selectedImageId: 'missing' }), /当前图片未列出/);
  for (const change of [{ imageSet: { id: '', version: 'v1' } }, { images: [first, first] }, { onIntent: undefined }]) {
    reset(); const extra = { ...change, onIntent: change.onIntent === undefined && 'onIntent' in change ? undefined : () => assert.fail('invalid operation') };
    assert.equal(click(extra, '绘制标注').props.disabled, true);
  }
  reset(); const extra = { onIntent() { assert.fail('failed image edit'); } };
  const imageNode = capture(extra).nodes.find(node => node.type === 'img');
  // background is a slot, inspect its React element directly.
  const viewer = capture(extra).nodes.find(node => node.props.label === '图片画布，方向键平移');
  (imageNode ?? viewer.props.background.props.children[0]).props.onError();
  assert.match(capture(extra).html, /图片加载失败/); assert.doesNotMatch(capture(extra).html, /<img/);
});
test('inline/workspace navigation only calls provided callbacks and blocks leaving an unsubmitted range', () => {
  reset(); let expand = 0, back = 0; const extra = { onExpand: () => expand++, onBack: () => back++ };
  click({ ...extra, view: 'inline' }, '查看大图'); click(extra, '返回原位置');
  click(extra, '选择裁切范围'); assert.equal(click(extra, '返回原位置').props.disabled, true);
  assert.equal(click(extra, '第二页').props.disabled, true); assert.equal(expand, 1); assert.equal(back, 1);
});
test('demo supplies four scans, blur/skew, answer region, missing alt, unavailable and no external assets', () => {
  assert.equal(imageCanvasExamples.length, 7);
  assert.equal(imageCanvasExamples[0].regions.length, 2);
  assert.equal(imageCanvasExamples[4].regions[0].label, '第 1 题作答区');
  for (const item of imageCanvasExamples.filter(item => item.src)) assert.ok(item.src.startsWith('data:image/svg+xml;'));
  const html = render(h(AgentImageCanvasDemo));
  for (const text of ['image-canvas', '倾斜', '模糊', '原图片暂不可用', '当前未连接裁切工具', '320px']) assert.ok(html.includes(text), text);
});


test('region source labels default on and can be hidden without changing facts or intents', () => {
  const images = [{ ...first, regions: ['example', 'teacher', 'system'].map((source, index) =>
    Object.freeze({ ...first.regions[0], id: `region-${index}`, source })) }];
  const before = JSON.stringify(images);
  for (const density of ['default', 'compact']) {
    const extra = { view: 'workspace', density, images };
    for (const label of ['示例', '教师', '系统']) assert.ok(htmlFor(extra).includes(`来源：${label}`));
    assert.equal(htmlFor(extra), htmlFor({ ...extra, showRegionSourceLabels: true }));
    const hidden = htmlFor({ ...extra, showRegionSourceLabels: false });
    for (const label of ['示例', '教师', '系统']) assert.ok(!hidden.includes(`来源：${label}`));
    assert.match(hidden, /来源：模拟原稿/);
    assert.match(hidden, /3 个区域标注/);
  }
  reset(); const calls = [], extra = { images, showRegionSourceLabels: false, onIntent: intent => calls.push(intent) };
  click(extra, '删除第 1 题作答区');
  assert.deepEqual(calls, [{ ...context, type: 'annotate-delete', regionId: 'region-0' }]);
  assert.equal(JSON.stringify(images), before);
});
