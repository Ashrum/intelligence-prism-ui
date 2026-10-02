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
    .replace('useId, useRef, useState, useLayoutEffect,', 'useId,')
    .replace('export type PaperPreviewZoom', `const useState = (initial: any): any => { const p = (globalThis as any).__paper; const i = p.cursor++; if (!(i in p.values)) p.values[i] = initial; return [p.values[i], (v: any) => { p.values[i] = typeof v === 'function' ? v(p.values[i]) : v }]; };
const useRef = <T,>(initial: T): {current:T} => { const p = (globalThis as any).__paper; return p.refs[p.refCursor++] ??= {current:initial}; };
const useLayoutEffect = (effect: any) => { (globalThis as any).__paper.effects.push(effect) };
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
  globalThis.__paper.effects = [];
  const nodes = [];
  function walk(n) {
    if (Array.isArray(n)) return n.map(walk);
    if (!React.isValidElement(n)) return n;
    if (n.type === Component) return h(function Visit() { return walk(Component(n.props)); });
    nodes.push(n); return React.cloneElement(n, {}, React.Children.map(n.props.children, walk));
  }
  const result = { html: render(walk(h(Component, { ...base, ...extra }))), nodes };
  globalThis.__paper.effects.forEach(effect => effect());
  return result;
}
function button(extra, label) { const found = capture(extra).nodes.find(n => n.props.onClick && (n.props['aria-label'] === label || textOf(n) === label)); assert.ok(found, label); return found; }
function click(extra, label) { const node = button(extra, label); assert.ok(!node.props.disabled, label); node.props.onClick(); }

test('canvas variant omits document chrome while default and explicit default retain it', () => {
  const props = { subtitle: '原卷副标题', status: { label: '待复核' }, information: [{ label: '学生', value: '张明' }], informationSlot: h('p', {}, '原始笔迹信息'), actions: [{ id: 'scan', label: '重新扫描' }], onClose() {} };
  const legacy = html(props);
  assert.equal(html({ ...props, variant: 'default' }), legacy);
  for (const label of ['原卷副标题','待复核','原始笔迹信息','试卷信息','扫描页面','扫描版本','重新扫描','上一份','下一份','关闭预览']) assert.ok(legacy.includes(label), label);
  const canvas = html({ ...props, variant: 'canvas' });
  assert.match(canvas, /aria-label="张明的试卷"/);
  assert.doesNotMatch(canvas, /<header|<aside|paper-preview-layout|aria-labelledby/);
  for (const label of ['原卷副标题','待复核','原始笔迹信息','试卷信息','扫描页面','扫描版本','重新扫描','上一份','下一份','关闭预览']) assert.ok(!canvas.includes(label), label);
  for (const label of ['上一页','下一页','缩小','放大','适合页面','适合宽度','data-paper-size']) assert.ok(canvas.includes(label), label);
  assert.match(html({ variant: 'canvas', title: undefined }), /aria-label="试卷预览"/);
});

test('canvas variant retains paging, zoom, keyboard and repeated region location intents', () => {
  reset();
  const regions = [{ id: 'r', label: '页底区域', rect: [8,80,84,15] }];
  const requests = [], zooms = [], props = { variant: 'canvas', pages: [{ id:'p1', regions }, { id:'p2', regions }], selectedRegionId:'r', onRegionSelect: (...args) => requests.push(args), onZoomChange: zoom => zooms.push(zoom) };
  const viewer = () => capture(props).nodes.find(n => n.props.locateRequest !== undefined);
  assert.equal(button(props,'上一页').props.disabled,true);
  click(props,'页底区域'); click(props,'页底区域');
  assert.equal(viewer().props.locateRequest,2);
  click(props,'下一页'); assert.equal(viewer().key,'p2');
  assert.equal(button(props,'下一页').props.disabled,true);
  const handler = capture(props).nodes.find(n => n.props.onKeyDown).props.onKeyDown;
  handler({ key:'ArrowLeft', target:{closest:()=>null}, preventDefault() {} });
  assert.equal(viewer().key,'p1');
  click(props,'适合宽度'); click(props,'适合页面'); click(props,'放大');
  assert.deepEqual(zooms.slice(0,2),['width','page']); assert.ok(zooms[2] > 0);
  assert.deepEqual(requests,[['p1','r'],['p1','r']]);
  assert.match(capture(props).html,/left:8%;top:80%;width:84%;height:15%/);
});

test('canvas variant retains loading, empty, errors and retry without document sidebar', () => {
  reset();
  for (const [state, expected] of [['loading',/正在加载试卷/],['empty',/无页面/],['error',/加载失败/]]) {
    const markup = html({ variant:'canvas', state });
    assert.match(markup,expected); assert.doesNotMatch(markup,/<aside|扫描版本/);
    assert.equal(button({ variant:'canvas', state },'下一页').props.disabled,true);
  }
  let retries = 0;
  click({ variant:'canvas', state:'error', onRetry:()=>retries++ },'重试');
  assert.equal(retries,1);
});

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

test('P1 rotation geometry swaps A3 landscape extents; fit calculations and regions rotate together',()=>{
  const paper=api.paperDimensions('A3','landscape');
  for(const rotation of [0,90,180,270]) {
    const size=api.rotatedPaperDimensions(paper,rotation),swap=rotation===90||rotation===270;
    assert.equal(size.width,swap?paper.height:paper.width);assert.equal(size.height,swap?paper.width:paper.height);
    assert.equal(api.paperZoomPercent('width',{width:size.width/2,height:1},size),50);
    assert.equal(api.paperZoomPercent('page',{width:size.width,height:size.height/4},size),25);
    const markup=html({pages:[{id:'a3',paperSize:'A3',orientation:'landscape',regions:[{id:'r',label:'区域',rect:[8,20,30,40]}]}],rotation:{a3:rotation}});
    assert.match(markup,/left:8%;top:20%;width:30%;height:40%/);
    if(rotation)assert.match(markup,new RegExp(`rotate\\(${rotation}deg\\)`));else assert.doesNotMatch(markup,/rotate\(/);
  }
  assert.deepEqual(api.paperZoomAnchor({x:200,y:150},{x:.5,y:.25},{x:16,y:16},{width:800,height:1200}),{left:216,top:166});
  assert.deepEqual(api.paperZoomAnchor({x:200,y:150},{x:0,y:0},{x:16,y:16},{width:800,height:1200}),{left:0,top:0});
});
const keyEvent=(key,extra={})=>({key,target:{closest:()=>null},nativeEvent:{isComposing:false},preventDefault(){},...extra});
test('P1 per-page rotation, controlled callbacks and canvas keyboard keep host/local state separate',()=>{
  reset(); const calls=[],zooms=[],props={pages:[{id:'a'},{id:'b'}],defaultRotation:{a:270},onRotationChange:(...v)=>calls.push(v),onZoomChange:v=>zooms.push(v)};
  click(props,'向右旋转');assert.doesNotMatch(capture(props).html,/rotate\(/);click(props,'向右旋转');assert.match(capture(props).html,/rotate\(90deg\)/);
  click(props,'下一页');assert.doesNotMatch(capture(props).html,/rotate\(/);click(props,'向左旋转');click(props,'上一页');assert.match(capture(props).html,/rotate\(90deg\)/);
  assert.deepEqual(calls,[['a',0],['a',90],['b',270]]);
  const controlled={...props,variant:'canvas',rotation:{a:180}};
  const keyboard=()=>capture(controlled).nodes.find(n=>n.props.onKeyDown).props.onKeyDown;
  keyboard()(keyEvent('R',{shiftKey:true}));assert.deepEqual(calls.at(-1),['a',90]);assert.match(capture(controlled).html,/rotate\(180deg\)/);
  for(const key of ['+','=','-','0'])keyboard()(keyEvent(key));assert.equal(zooms.length,4);assert.equal(zooms.at(-1),'page');
  keyboard()(keyEvent('r',{nativeEvent:{isComposing:true}}));assert.equal(calls.length,4);
  keyboard()(keyEvent('r',{target:{closest:()=>({})}}));assert.equal(calls.length,4);
  assert.ok(button(controlled,'向右旋转'));assert.match(button(controlled,'向右旋转').props.className,/min-h-11 min-w-11/);
});
function gestureFixture(t,extra={}) {
  reset();const old=globalThis.ResizeObserver;globalThis.ResizeObserver=class{observe(){}disconnect(){}};
  let wheel,cleanup,width=api.paperDimensions().width,height=api.paperDimensions().height;
  const node={clientWidth:400,clientHeight:600,clientLeft:0,clientTop:0,scrollWidth:2400,scrollHeight:3400,scrollLeft:100,scrollTop:100,
    getBoundingClientRect:()=>({left:10,top:20}),addEventListener:(name,cb,options)=>{assert.equal(options.passive,false);wheel=cb},removeEventListener(){}};
  const paper={getBoundingClientRect:()=>({left:26-node.scrollLeft,top:36-node.scrollTop,width,height})};
  const props={pages:[{id:'a',regions:[{id:'r',label:'区域',rect:[0,0,50,50]}]}],defaultZoom:100,...extra};
  const draw=()=>capture(props), view=()=>draw().nodes.find(n=>n.props.className==='paper-preview-viewport');
  let out=draw();out.nodes.find(n=>n.props['data-paper-size']).props.ref.current=paper;cleanup=view().props.ref(node);
  t.after(()=>{cleanup?.();globalThis.ResizeObserver=old});
  const target={setPointerCapture(){},hasPointerCapture:()=>false};
  const event=(pointerId,x,y,timeStamp=0,pointerType='touch')=>({pointerId,clientX:x,clientY:y,timeStamp,pointerType,button:0,target,preventDefault(){}});
  return {props,draw,view,node,event,wheel:e=>wheel(e),size:(w,h)=>{width=w;height=h}};
}
test('P1 wheel is local/nonpassive, ordinary scrolling untouched; controlled anchor waits for host',t=>{
  const requests=[],f=gestureFixture(t,{zoom:100,onZoomChange:v=>requests.push(v)}),old=f.node.scrollLeft;
  const factor=Math.exp(.2),wheel={deltaY:-20,deltaMode:0,clientX:210,clientY:220,preventDefault(){this.prevented=true}};
  f.wheel(wheel);assert.equal(wheel.prevented,undefined);assert.deepEqual(requests,[]);
  f.wheel({...wheel,ctrlKey:true});assert.equal(requests[0],100*factor);
  f.draw();assert.equal(f.node.scrollLeft,old);
  f.size(api.paperDimensions().width*factor,api.paperDimensions().height*factor);f.props.zoom=100*factor;f.draw();
  assert.ok(Math.abs(f.node.scrollLeft-(284*factor-184))<1e-8);assert.ok(Math.abs(f.node.scrollTop-(284*factor-184))<1e-8);
  f.wheel({...wheel,metaKey:true,deltaY:-10000});assert.equal(requests.at(-1),100*factor*Math.exp(.25));
});
test('F1 wheel bounds each normalized event to 25 while preserving small pinch deltas and zoom limits',t=>{
  const requests=[],f=gestureFixture(t,{zoom:20,onZoomChange:v=>requests.push(v)});
  for(const modifier of ['ctrlKey','metaKey']) for(const [deltaY,deltaMode,effective] of [
    [-120,0,-25],[120,0,25],[-10000,0,-25],[10000,0,25],
    [-25,0,-25],[25,0,25],[-2,0,-2],[.5,0,.5],[0,0,0],
    [-1,1,-16],[1,1,16],[-120,1,-25],[120,1,25],[-1,2,-25],[1,2,25],
  ]) {
    let prevented=0;
    f.wheel({deltaY,deltaMode,[modifier]:true,clientX:210,clientY:220,preventDefault(){prevented++}});
    assert.equal(requests.at(-1),20*Math.exp(-effective*.01),`${modifier}: delta=${deltaY}, mode=${deltaMode}`);
    assert.equal(prevented,1);
  }
  assert.ok(Math.abs(20*Math.exp(.25)-25.68050833375483)<1e-10);
  for(const [zoom,deltaY,expected] of [[299,-120,300],[5,120,5]]) {
    f.props.zoom=zoom;f.draw();
    f.wheel({deltaY,deltaMode:0,ctrlKey:true,clientX:210,clientY:220,preventDefault(){}});
    assert.equal(requests.at(-1),expected);
  }
});
test('F2 touch viewport allows native pan and scroll chaining',async()=>{
  const css=await readFile(new URL('../components/prism-next/paper-preview.css',import.meta.url),'utf8');
  const viewport=css.match(/\.paper-preview-viewport\s*\{([^}]+)\}/)?.[1];
  assert.ok(viewport);
  assert.match(viewport,/touch-action:\s*pan-x pan-y\s*;/);
  assert.doesNotMatch(viewport,/overscroll-behavior/);
});
test('F2 single touch does not prevent native scroll or pan; cancellation releases capture and resets the next gesture',t=>{
  const zooms=[],f=gestureFixture(t,{onZoomChange:v=>zooms.push(v)}),e=f.event;
  let prevented=0,released=0;
  const target={setPointerCapture(){},hasPointerCapture:()=>true,releasePointerCapture(){released++}};
  f.view().props.onPointerDown({...e(1,100,100),target});
  f.view().props.onPointerMove({...e(1,140,170,20),target,preventDefault(){prevented++}});
  assert.equal(prevented,0);assert.equal(f.node.scrollLeft,100);assert.equal(f.node.scrollTop,100);
  f.view().props.onPointerCancel({...e(1,140,170,30),target});
  assert.equal(released,1);
  f.view().props.onPointerMove(e(1,200,200,40));assert.deepEqual(zooms,[]);
  f.view().props.onPointerDown(e(2,100,100,50));f.view().props.onPointerDown(e(3,200,100,60));
  f.view().props.onPointerMove(e(3,300,100,70));assert.deepEqual(zooms,[200]);
  f.view().props.onPointerCancel(e(2,100,100,80));f.view().props.onLostPointerCapture(e(3,300,100,90));
  f.view().props.onPointerMove(e(3,400,100,100));assert.deepEqual(zooms,[200]);
  f.view().props.onPointerDown(e(4,100,100,110));f.view().props.onPointerDown(e(5,200,100,120));
  f.view().props.onPointerUp(e(4,100,100,130));f.view().props.onPointerUp(e(5,200,100,140));
  assert.deepEqual(zooms,[200,100]);
  f.view().props.onPointerDown(e(6,100,100,150,'pen'));
  const left=f.node.scrollLeft,top=f.node.scrollTop;
  f.view().props.onPointerMove({...e(6,120,110,170,'pen'),preventDefault(){prevented++}});
  assert.equal(prevented,1);assert.equal(f.node.scrollLeft,left-20);assert.equal(f.node.scrollTop,top-10);
  f.view().props.onPointerUp(e(6,120,110,180,'pen'));
});
test('P1 pointer pan uses threshold, suppresses region clicks, and keeps keyboard clicks usable',t=>{
  const f=gestureFixture(t),event=f.event;
  f.view().props.onPointerDown(event(1,100,100,0,'mouse'));f.view().props.onPointerMove(event(1,103,103,10,'mouse'));assert.equal(f.node.scrollLeft,100);
  f.view().props.onPointerMove(event(1,120,110,20,'mouse'));assert.equal(f.node.scrollLeft,80);assert.equal(f.node.scrollTop,90);
  f.view().props.onPointerUp(event(1,120,110,30,'mouse'));
  let stopped=0;f.view().props.onClickCapture({detail:1,preventDefault(){},stopPropagation(){stopped++}});assert.equal(stopped,1);
  f.view().props.onClickCapture({detail:0,preventDefault(){},stopPropagation(){stopped++}});assert.equal(stopped,1);
  f.view().props.onPointerDown(event(2,100,100));f.view().props.onPointerUp(event(2,100,100,40));f.view().props.onClickCapture({detail:1,preventDefault(){},stopPropagation(){stopped++}});assert.equal(stopped,1);
});
test('P1 pinch zoom, two-finger tap, double click and cancellation only update view intent',t=>{
  const zooms=[],f=gestureFixture(t,{variant:'canvas',onZoomChange:v=>zooms.push(v)}),e=f.event;
  f.view().props.onPointerDown(e(1,100,100));f.view().props.onPointerDown(e(2,200,100,10));f.view().props.onPointerMove(e(2,300,100,40));assert.equal(zooms.at(-1),200);
  f.view().props.onPointerUp(e(2,300,100,50));f.view().props.onPointerUp(e(1,100,100,60));assert.equal(zooms.length,1);
  f.view().props.onPointerDown(e(3,100,100,100));f.view().props.onPointerDown(e(4,200,100,110));f.view().props.onPointerUp(e(3,100,100,140));assert.equal(zooms.length,1);f.view().props.onPointerUp(e(4,200,100,150));assert.equal(zooms.at(-1),100);
  f.view().props.onPointerDown(e(5,100,100,200));f.view().props.onPointerUp(e(5,100,100,210));f.view().props.onDoubleClick({clientX:100,clientY:100,preventDefault(){}});assert.equal(zooms.at(-1),'page');
  const before=zooms.length;f.view().props.onPointerDown(e(6,100,100,300));f.view().props.onPointerDown(e(7,200,100,310));f.view().props.onPointerCancel(e(6,100,100,320));f.view().props.onPointerUp(e(7,200,100,330));assert.equal(zooms.length,before);
  f.view().props.onPointerDown(e(8,100,100,400));f.view().props.onPointerDown(e(9,200,100,410));f.view().props.onPointerUp(e(8,100,100,440));f.view().props.onPointerUp(e(9,200,100,800));assert.equal(zooms.length,before);
});

test('P1 pinch keeps the starting paper point under the moving two-finger center',t=>{
  const requests=[],f=gestureFixture(t,{zoom:100,onZoomChange:v=>requests.push(v)}),e=f.event;
  f.view().props.onPointerDown(e(1,100,100));f.view().props.onPointerDown(e(2,200,100,10));f.view().props.onPointerMove(e(2,300,100,30));
  assert.deepEqual(requests,[200]);assert.equal(f.node.scrollLeft,100);
  f.size(api.paperDimensions().width*2,api.paperDimensions().height*2);f.props.zoom=200;f.draw();
  assert.ok(Math.abs(f.node.scrollLeft-274)<1e-8);assert.ok(Math.abs(f.node.scrollTop-264)<1e-8);
});
