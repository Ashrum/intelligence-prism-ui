import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { components } from '../lib/prism-next/catalog.ts';
const root = fileURLToPath(new URL('../', import.meta.url));
const dir = new URL('../.sites-runtime/paper-preview-test/', import.meta.url);
await mkdir(dir, { recursive: true });
const options = { stdin: { contents: `export * from './components/prism-next/paper-preview'; export * from './components/prism-next/demos/paper-preview'; export * from './components/prism-next/document-region-viewer';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false };
const file = new URL('bundle.mjs', dir), probe = new URL('probe.mjs', dir);
await writeFile(file, (await build(options)).outputFiles[0].text);
const api = await import(file);
await writeFile(probe, (await build({ ...options, plugins: [{ name: 'paper-events', setup(build) {
  build.onLoad({ filter: /prism-next\/paper-preview\.tsx$/ }, async args => ({ loader: 'tsx', contents: (await readFile(args.path, 'utf8'))
    .replace('useEffect, useId, useRef, useState,', 'useEffect, useId,')
    .replace('export type PaperPreviewZoom', `const useState = (initial: any): any => { const p = (globalThis as any).__paper; const i = p.cursor++; if (!(i in p.values)) p.values[i] = initial; return [p.values[i], (v: any) => { p.values[i] = typeof v === 'function' ? v(p.values[i]) : v }]; };
const useRef = <T,>(initial: T): {current:T} => { const p = (globalThis as any).__paper; return p.refs[p.refCursor++] ?? {current:initial}; };
export type PaperPreviewZoom`) }));
} }] })).outputFiles[0].text);
const probeApi = await import(probe);
await rm(file); await rm(probe);
const h = React.createElement, pages = api.studentPaperPages;
const base = { title: '张明的试卷', pages, versions: [{ id: 'v2', label: 'V2', current: true }, { id: 'v1', label: 'V1', validated: true, restorable: true }] };
const html = extra => render(h(api.PaperPreview, { ...base, ...extra }));
const textOf = n => Array.isArray(n) ? n.map(textOf).join('') : React.isValidElement(n) ? textOf(n.props.children) : typeof n === 'string' || typeof n === 'number' ? String(n) : '';
function reset() { globalThis.__paper = { values: [], refs: [], cursor: 0, refCursor: 0 }; }
function capture(extra = {}, Component = probeApi.PaperPreview) {
  globalThis.__paper.cursor = globalThis.__paper.refCursor = 0;
  const nodes = [];
  function walk(n) {
    if (Array.isArray(n)) return n.map(walk);
    if (!React.isValidElement(n)) return n;
    if (n.type === Component) return h(function Visit() { return walk(Component(n.props)); });
    nodes.push(n); return React.cloneElement(n, {}, React.Children.map(n.props.children, walk));
  }
  return { html: render(walk(h(Component, { ...base, ...extra }))), nodes };
}
function button(extra, label) { const found = capture(extra).nodes.find(n => n.props.onClick && (n.props['aria-label'] === label || textOf(n) === label)); assert.ok(found, label); return found; }
function click(extra, label) { const node = button(extra, label); assert.ok(!node.props.disabled, label); node.props.onClick(); }

test('catalog has exactly 81 and student/material fixtures have 6/12 explicit page slots', () => {
  assert.equal(components.length, 81); assert.equal(components.filter(c => c.id === 'paper-preview').length, 1);
  assert.equal(pages.length, 6); assert.equal(api.markingMaterialPages.length, 12);
  const content = render(h(api.PaperPreviewDemo));
  for (const theme of ['light', 'paper', 'dark']) assert.ok(content.includes(`data-prism-theme="${theme}"`));
  assert.match(content, /<math/); assert.match(content, /320px/); assert.doesNotMatch(content, /示例|演示/);
});
test('default page-fit, page boundary clamps and controlled page changes do not mutate facts', () => {
  reset(); assert.equal(button({}, '上一页').props.disabled, true);
  assert.equal(button({}, '适合页面').props['aria-pressed'], true);
  click({}, '下一页'); assert.match(capture().html, /第 2 \/ 6 页/);
  const requests = [], props = { page: 5, onPageChange: n => requests.push(n) };
  assert.equal(button(props, '下一页').props.disabled, true); click(props, '上一页');
  assert.deepEqual(requests, [4]); assert.match(capture(props).html, /第 6 \/ 6 页/);
  assert.match(html({ page: 999 }), /第 6 \/ 6 页/); assert.match(html({ page: -10 }), /第 1 \/ 6 页/);
  assert.equal(api.clampPaperPage(NaN, 0), 0);
});
test('zoom measures rendered paper when leaving fit and remains continuous and bounded', () => {
  reset(); const natural = api.paperDimensions();
  globalThis.__paper.refs[1] = { current: { getBoundingClientRect: () => ({ width: natural.width * .25 }) } };
  const requests = [], props = { onZoomChange: n => requests.push(n) };
  click(props, '放大'); assert.equal(requests[0], 31.25);
  globalThis.__paper.refs[1].current.getBoundingClientRect = () => ({ width: natural.width * .3125 });
  click(props, '缩小'); assert.equal(requests[1], 25);
  click(props, '适合宽度'); assert.equal(requests[2], 'width');
  click(props, '适合页面'); assert.equal(requests[3], 'page');
  assert.equal(api.stepPaperZoom(299, 1.25), 300); assert.equal(api.stepPaperZoom(5, .8), 5);
  assert.equal(button({ zoom: 5 }, '缩小').props.disabled, true); assert.equal(button({ zoom: 300 }, '放大').props.disabled, true);
  const paper = api.paperDimensions('A3'); assert.equal(paper.width / paper.height, 297 / 420);
  assert.equal(api.paperZoomPercent('width', { width: paper.width / 2, height: 50 }, paper), 50);
  assert.equal(api.paperZoomPercent('page', { width: paper.width, height: paper.height / 4 }, paper), 25);
  assert.equal(api.paperDimensions('A4', 'landscape').width, natural.height);
});
test('controlled zoom retains host value until updated', () => {
  reset(); const requests = []; click({ zoom: 80, onZoomChange: v => requests.push(v) }, '放大');
  assert.deepEqual(requests, [100]); assert.match(capture({ zoom: 80 }).html, />80%<\/output>/);
});
test('anomalies and unknown values are textual; version restoration emits intent only', () => {
  reset(); const before = structuredClone(base), versions = [];
  assert.match(html({ page: 1 }), /异常页 · 缺页，等待补扫/);
  assert.match(html({ information: [{ label: '接收时间' }] }), /未提供/);
  assert.match(html({ pages: [{ id: 'unknown' }] }), /第 1 页 · 未提供/);
  const props = { onSetCurrentVersion: id => versions.push(id) }; click(props, '设为当前扫描件');
  assert.deepEqual(versions, ['v1']); assert.match(capture(props).html, /V2 · 当前扫描件/); assert.deepEqual(base, before);
  assert.equal(button({ versions: [{ id: 'bad', label: 'V0', restorable: true }], ...props }, '设为当前扫描件').props.disabled, true);
});
test('document boundaries and action disabled states guard all intent handlers', () => {
  reset(); let calls = 0; const props = { hasPrev: false, hasNext: false, onPrev: () => calls++, onNext: () => calls++, actions: [{ id: 'scan', label: '重新扫描', disabled: true }], onAction: () => calls++ };
  for (const label of ['上一份', '下一份', '重新扫描']) { const n = button(props, label); assert.equal(n.props.disabled, true); n.props.onClick(); }
  assert.equal(calls, 0); click({ ...props, hasNext: true }, '下一份'); assert.equal(calls, 1);
});
test('keyboard arrows are scoped and input/modifier shortcuts do not turn pages', () => {
  reset(); const requests = [], props = { page: 0, onPageChange: n => requests.push(n) };
  const handler = capture(props).nodes.find(n => n.props.onKeyDown).props.onKeyDown;
  const event = { key: 'ArrowRight', target: { closest: () => null }, preventDefault() {} };
  handler(event); handler({ ...event, ctrlKey: true }); handler({ ...event, target: { closest: () => ({}) } }); handler({ ...event, key: 'ArrowLeft' });
  assert.deepEqual(requests, [1]);
});
test('loading, empty, failure and retry preserve external states', () => {
  reset(); assert.match(html({ state: 'loading' }), /aria-busy="true"/); assert.match(html({ state: 'loading' }), /data-slot="skeleton"/);
  assert.match(html({ state: 'empty' }), /无页面/); assert.match(html({ pages: [] }), /第 0 \/ 0 页/);
  assert.match(html({ state: 'error' }), /加载失败/);
  let calls = 0; click({ state: 'error', onRetry: () => calls++ }, '重试'); assert.equal(calls, 1);
  assert.match(capture({ state: 'error' }).html, /加载失败/);
  assert.match(html({ pages: [{ id: 'image', imageUrl: 'https://school.invalid/p1.png', alt: '李华原卷' }] }), /alt="李华原卷"/);
});
test('region composition preserves geometry and legacy viewer without pageLayout', () => {
  const regions = [{ id: 'r', label: '第 3 题', rect: [8, 42, 84, 24] }];
  const modern = render(h(api.DocumentRegionViewer, { regions, selectedId: 'r', onSelect() {}, pageLayout: { width: 100, height: 200 } }));
  assert.match(modern, /left:8%;top:42%;width:84%;height:24%/); assert.match(modern, /aria-pressed="true"/); assert.doesNotMatch(modern, /review-sheet/);
  assert.match(render(h(api.DocumentRegionViewer, { regions, onSelect() {} })), /review-sheet-viewport/);
});
test('dialog delegates Escape/focus to pinned Sheet and forwards close intent (SSR wiring only)', () => {
  reset(); const events = [], ref = { current: null };
  const result = capture({ onClose: () => events.push('close'), onOpenChange: value => events.push(value), returnFocus: ref }, probeApi.PaperPreviewDialog);
  assert.match(result.html, /打开试卷预览/);
  const root = result.nodes.find(n => n.props.onOpenChange); root.props.onOpenChange(false);
  assert.deepEqual(events, [false, 'close']); assert.ok(result.nodes.some(n => n.props.finalFocus === ref));
  assert.ok(result.nodes.some(n => n.props.closeProps?.['aria-label'] === '关闭预览'));
});
