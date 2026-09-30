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
    .replace('useId, useRef, useState,', 'useId,')
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

test('catalog IDs are unique and student/material fixtures have 6/12 explicit page slots', () => {
  assert.equal(new Set(components.map(entry => entry.id)).size, components.length); assert.equal(components.filter(c => c.id === 'paper-preview').length, 1);
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
  globalThis.__paper.refs[0] = { current: { getBoundingClientRect: () => ({ width: natural.width * .25 }) } };
  const requests = [], props = { onZoomChange: n => requests.push(n) };
  click(props, '放大'); assert.equal(requests[0], 31.25);
  globalThis.__paper.refs[0].current.getBoundingClientRect = () => ({ width: natural.width * .3125 });
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

// DOM dimensions and ResizeObserver delivery are simulated; this is not visual QA.
function resizeFixture(t, props) {
  reset();
  const observers = [], original = globalThis.ResizeObserver;
  globalThis.ResizeObserver = class {
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe(node) { this.node = node; }
    disconnect() { this.node = null; }
  };
  const cleanups = [];
  t.after(() => {
    cleanups.forEach(cleanup => cleanup?.());
    if (original === undefined) delete globalThis.ResizeObserver;
    else globalThis.ResizeObserver = original;
  });
  const draw = () => capture(props);
  function mount(width, height) {
    const viewport = { clientWidth: width, clientHeight: height };
    const ref = draw().nodes.find(n => n.props.className === 'paper-preview-viewport').props.ref;
    const cleanup = ref(viewport);
    cleanups.push(cleanup);
    assert.equal(observers.at(-1).node, viewport);
    return { viewport, cleanup };
  }
  function resize(viewport, width, height) {
    viewport.clientWidth = width; viewport.clientHeight = height;
    for (const observer of observers) if (observer.node === viewport) observer.callback([{ target: viewport }]);
    return draw();
  }
  return { draw, mount, resize, observers };
}
function paperGeometry(result) {
  return result.nodes.find(n => n.props['data-paper-size']).props.style;
}
function assertZoom(result, percent, mode) {
  assert.equal(textOf(result.nodes.find(n => n.type === 'output')), `${Math.round(percent)}%`);
  for (const [label, value] of [['适合页面', 'page'], ['适合宽度', 'width']]) {
    assert.equal(result.nodes.find(n => n.props.onClick && textOf(n) === label).props['aria-pressed'], mode === value);
  }
}
test('fit modes recalculate on width and height resize and preserve controlled/uncontrolled mode', async t => {
  for (const mode of ['page', 'width']) for (const controlled of [false, true]) await t.test(`${mode}, controlled=${controlled}`, t => {
    const requests = [], props = { [controlled ? 'zoom' : 'defaultZoom']: mode, onZoomChange: value => requests.push(value) };
    const fixture = resizeFixture(t, props), { viewport } = fixture.mount(900, 600);
    const paper = api.paperDimensions();
    for (const [width, height] of [[900, 600], [318, 600], [318, 320], [900, 600]]) {
      const result = fixture.resize(viewport, width, height);
      const scale = mode === 'width' ? (width - 32) / paper.width : Math.min((width - 32) / paper.width, (height - 32) / paper.height);
      assertZoom(result, scale * 100, mode);
      const geometry = paperGeometry(result);
      assert.ok(Math.abs(geometry.width - paper.width * scale) < 1e-8);
      assert.ok(geometry.width <= width - 32 + 1e-8);
      if (mode === 'page') assert.ok(geometry.height <= height - 32 + 1e-8);
    }
    assert.deepEqual(requests, []);
  });
});
test('manual zoom remains unchanged after container resize, including after leaving fit mode', async t => {
  for (const controlled of [false, true]) await t.test(`controlled=${controlled}`, t => {
    const requests = [], props = { ...(controlled ? { zoom: 125 } : {}), onZoomChange: value => requests.push(value) };
    const fixture = resizeFixture(t, props), { viewport } = fixture.mount(900, 600);
    if (!controlled) click(props, '放大');
    const before = fixture.draw(), geometry = paperGeometry(before);
    const percent = controlled ? 125 : requests[0];
    const requestCount = requests.length;
    for (const [width, height] of [[318, 600], [318, 320], [900, 600]]) {
      const result = fixture.resize(viewport, width, height);
      assertZoom(result, percent);
      assert.deepEqual(paperGeometry(result), geometry);
    }
    assert.equal(requests.length, requestCount);
  });
});
test('viewport observation starts on delayed DOM attachment and reconnects after replacement', t => {
  const props = { defaultZoom: 'width' }, fixture = resizeFixture(t, props);
  fixture.draw(); fixture.draw(); // Component rendered before its viewport is attached.
  assert.equal(fixture.observers.length, 0);
  const first = fixture.mount(900, 600);
  assert.ok(Math.abs(paperGeometry(fixture.draw()).width - 868) < 1e-8);
  first.cleanup();
  assert.equal(fixture.observers[0].node, null);
  const second = fixture.mount(318, 600);
  assert.ok(Math.abs(paperGeometry(fixture.draw()).width - 286) < 1e-8);
  fixture.resize(first.viewport, 1200, 800);
  assert.ok(Math.abs(paperGeometry(fixture.draw()).width - 286) < 1e-8);
  second.cleanup();
  assert.ok(fixture.observers.every(observer => observer.node === null));
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


test('thumbnail cards override responsive button height and preserve paper aspect ratios', () => {
  reset();
  const result = capture({ pages: [{ id: 'portrait' }, { id: 'landscape', paperSize: 'A3', orientation: 'landscape', anomaly: '缺页，等待补扫' }] });
  const section = result.html.split('aria-label="扫描页面"')[1].split('</section>')[0];
  const buttons = [...section.matchAll(/<button[^>]*class="([^"]*)"/g)];
  assert.equal(buttons.length, 2);
  for (const [, classes] of buttons) {
    assert.ok(classes.split(' ').includes('h-auto'));
    assert.ok(classes.split(' ').includes('sm:h-auto'));
    assert.ok(!classes.split(' ').includes('sm:h-8'));
  }
  assert.equal((section.match(/aspect-ratio:/g) ?? []).length, 2);
  assert.doesNotMatch(section, />扫描图像未接入</);
  assert.match(section, /lucide-triangle-alert/);
  assert.match(section, /异常页 · 缺页，等待补扫/);
  const ratios = result.nodes.filter(n => n.props.style?.aspectRatio).map(n => n.props.style.aspectRatio.split(' / ').map(Number));
  assert.ok(Math.abs(ratios[0][0] / ratios[0][1] - 210 / 297) < 1e-10);
  assert.ok(Math.abs(ratios[1][0] / ratios[1][1] - 420 / 297) < 1e-10);
});
test('region hit layers cover full height with visible normal/selected borders and transparent hover', () => {
  const markup = render(h(api.DocumentRegionViewer, { regions: [{ id: 'r', label: '第 3 题', rect: [8, 70, 84, 20] }], selectedId: 'r', onSelect() {}, pageLayout: { width: 794, height: 1123 } }));
  const classes = markup.match(/<button[^>]*class="([^"]*)"/)[1].split(' ');
  for (const name of ['h-full', 'sm:h-full', 'border-border', 'aria-pressed:border-2', 'aria-pressed:border-primary', 'hover:bg-transparent', 'data-pressed:bg-transparent']) assert.ok(classes.includes(name), name);
  for (const name of ['sm:h-8', 'border-transparent', 'hover:bg-accent', 'data-pressed:bg-accent']) assert.ok(!classes.includes(name), name);
});
test('anomaly badge is inside the paper canvas and includes an icon plus text', () => {
  const canvas = html({ page: 1 }).split('data-paper-size="A4"')[1].split('</section>')[0];
  assert.match(canvas, /data-paper-anomaly/);
  assert.match(canvas.split('data-paper-anomaly')[1], /lucide-triangle-alert/);
  assert.match(canvas.split('data-paper-anomaly')[1], /异常页 · 缺页，等待补扫/);
});
test('region list repeat requests reach the viewer and page changes remount the selected region', () => {
  reset();
  const regions = [{ id: 'r', label: '页底区域', rect: [8, 80, 84, 15] }];
  const requests = [], props = { pages: [{ id: 'p1', regions }, { id: 'p2', regions }], selectedRegionId: 'r', zoom: 150, onRegionSelect: (...args) => requests.push(args) };
  const viewer = () => capture(props).nodes.find(n => n.props.locateRequest !== undefined);
  assert.equal(viewer().key, 'p1'); assert.equal(viewer().props.locateRequest, 0);
  click(props, '页底区域'); assert.equal(viewer().props.locateRequest, 1);
  click(props, '页底区域'); assert.equal(viewer().props.locateRequest, 2);
  click(props, '下一页'); assert.equal(viewer().key, 'p2'); assert.equal(viewer().props.selectedId, 'r');
  assert.deepEqual(requests, [['p1', 'r'], ['p1', 'r']]);
});
test('viewer effects scroll on initial mount, cross-page mount, selection and repeated requests; legacy remains compatible', async () => {
  const effectsFile = new URL('region-effects.mjs', dir);
  const contents = (await readFile(new URL('../components/prism-next/document-region-viewer.tsx', import.meta.url), 'utf8'))
    .replace('useEffect,useRef,type ReactNode', 'type ReactNode')
    .replace('export type DocumentRegion=', `const useRef = (_initial: any) => ({ current: (globalThis as any).__region.canvas });
const useEffect = (effect: () => void, deps: any[]) => { const p = (globalThis as any).__region; if (!p.deps || deps.some((value, i) => !Object.is(value, p.deps[i]))) { p.effects.push(effect); p.deps = deps; } };
export type DocumentRegion=`);
  await writeFile(effectsFile, (await build({ ...options, stdin: { contents, resolveDir: root + 'components/prism-next', loader: 'tsx' } })).outputFiles[0].text);
  const { DocumentRegionViewer } = await import(effectsFile);
  await rm(effectsFile);
  const calls = [], regions = [{ id: 'r', label: '页底区域', rect: [8, 80, 84, 15] }, { id: 'other', label: '其他区域', rect: [8, 10, 84, 15] }];
  function mount(page) {
    globalThis.__region = { effects: [], canvas: { querySelectorAll: () => regions.map(r => ({ dataset: { region: r.id }, scrollIntoView: options => calls.push({ page, id: r.id, options }) })) } };
  }
  function draw(extra = {}) {
    const tree = DocumentRegionViewer({ regions, selectedId: 'r', onSelect() {}, pageLayout: { width: 794, height: 1123 }, ...extra });
    globalThis.__region.effects.splice(0).forEach(effect => effect());
    return tree;
  }
  mount('p1'); draw(); assert.equal(calls.length, 1);
  draw(); assert.equal(calls.length, 1);
  mount('p2'); draw(); assert.equal(calls.length, 2);
  draw({ locateRequest: 1 }); draw({ locateRequest: 2 }); assert.equal(calls.length, 4);
  draw({ selectedId: 'other', locateRequest: 2 }); assert.equal(calls.at(-1).id, 'other');
  assert.ok(calls.every(call => call.options.block === 'nearest' && call.options.inline === 'nearest'));
  const count = calls.length;
  draw({ selectedId: 'missing', locateRequest: 2 }); assert.equal(calls.length, count);
  mount('legacy');
  const tree = draw({ pageLayout: undefined }); assert.equal(calls.at(-1).page, 'legacy');
  function findClick(n) { if (Array.isArray(n)) return n.map(findClick).find(Boolean); if (!React.isValidElement(n)) return; return n.props.onClick ?? findClick(n.props.children); }
  const handler = findClick(tree); handler(); handler(); assert.equal(calls.length, count + 3);
  mount('modern'); const modernClick = findClick(draw()); modernClick(); modernClick();
  assert.equal(calls.slice(-3).filter(call => call.page === 'modern' && call.id === 'r').length, 3);
});
