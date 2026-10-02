import test from 'node:test';
import assert from 'node:assert/strict';
import { api, h, render, capture } from './review-components-harness.mjs';

const pages = [
  { id: 'full', dimensions: { width: 600, height: 820 }, imageUrl: '/scan.svg', alt: '完整扫描', regions: [{ id: 'answer', label: '作答', rect: [10,20,80,25] }] },
  { id: 'crop', dimensions: { width: 600, height: 260 }, regions: [{ id: 'other', label: '裁切作答', rect: [0,0,100,100] }] },
];
const props = { viewportRef: { current: null }, pages, zoom: 100, rotations: {}, onZoom() {} };
const sheets = out => out.nodes.filter(node => node.props['data-review-page'] !== undefined);

test('continuous preview preserves independent sheet sizes, rotations and fit modes', () => {
  const out = capture(api.PaperPreviewContinuous, { ...props, rotations: { crop: 90 }, gap: 24 });
  assert.deepEqual(sheets(out).map(node => node.props.style), [{ width: 600, height: 820 }, { width: 260, height: 600 }]);
  assert.match(out.html, /rotate\(90deg\)/);
  assert.equal(out.nodes.find(node => node.props.className === 'd1-paper-column').props.style.gap, 24);
  const width = sheets(capture(api.PaperPreviewContinuous, { ...props, zoom: 'width' }));
  assert.ok(width.every(node => Math.abs(node.props.style.width - 740) < 1e-8));
  const fit = sheets(capture(api.PaperPreviewContinuous, { ...props, zoom: 'page' }));
  assert.ok(fit.every(node => node.props.style.width <= 740 && node.props.style.height <= 828));
  const empty = capture(api.PaperPreviewContinuous, { ...props, pages: [] });
  assert.equal(sheets(empty).length, 0); assert.doesNotMatch(empty.html, /NaN|Infinity/);
});

test('continuous opt-in maps public callbacks, slots, missing images and spotlight facts', () => {
  const calls = [];
  const outer = capture(api.PaperPreview, { layout: 'continuous', pages, zoom: 'width', rotation: { crop: 270 }, selectedRegionId: 'answer', onRegionSelect: (...args) => calls.push(args), onZoomChange: value => calls.push(value), continuous: { viewportRef: props.viewportRef } });
  const canvas = outer.nodes.find(node => node.type === api.PaperPreviewContinuous);
  assert.equal(canvas.props.zoom, 'width'); assert.deepEqual(canvas.props.rotations, { crop: 270 });
  canvas.props.onSelect('answer', 'full'); canvas.props.onZoom(150);
  assert.deepEqual(calls, [['full', 'answer'], 150]);
  const out = capture(api.PaperPreviewContinuous, { ...props, spotlight: true, selected: 'answer', emptyImageText: '该生扫描尚未提供', beforeContent: h('article', {}, '完整题面'), renderPageHeader: page => h('header', {}, `身份 ${page.id}`) });
  assert.ok(out.html.indexOf('完整题面') < out.html.indexOf('身份 full'));
  assert.match(out.html, /该生扫描尚未提供/);
  const viewers = out.nodes.filter(node => node.type?.name === 'DocumentRegionViewer');
  assert.match(render(viewers[0].props.regions[0].content), /opacity-0/);
  assert.match(render(viewers[1].props.regions[0].content), /opacity-100/);
  const original = capture(api.PaperPreviewContinuous, { ...props, spotlight: true, original: true });
  assert.ok(original.nodes.filter(node => node.type?.name === 'DocumentRegionViewer').every(node => /opacity-0/.test(render(node.props.regions[0].content))));
});

test('continuous visible-page callback selects actual largest overlap without changing selection', () => {
  const calls = [], rect = (left, top, right, bottom) => ({ left, top, right, bottom });
  let boxes = [rect(0, -100, 600, 400), rect(0, 420, 600, 680)];
  const node = { getBoundingClientRect: () => rect(0, 0, 800, 700), querySelectorAll: () => boxes.map(box => ({ getBoundingClientRect: () => box })) };
  const out = capture(api.PaperPreviewContinuous, { ...props, viewportRef: { current: node }, selected: 'answer', onVisiblePage: index => calls.push(index), onSelect() { throw Error('scroll must not select a region'); } });
  out.nodes[0].props.onScroll(); boxes = [rect(0, -650, 600, 170), rect(0, 190, 600, 450)]; out.nodes[0].props.onScroll();
  assert.deepEqual(calls, [0, 1]);
});

test('explicit page/region positioning honors scale, reduced motion and focus requests', t => {
  const prior = globalThis.window, calls = []; let reduced = true;
  globalThis.window = { matchMedia: () => ({ matches: reduced }) }; t.after(() => { globalThis.window = prior; });
  const node = { scrollLeft: 20, scrollTop: 50, getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 300 }), querySelectorAll: selector => [{ dataset: selector === '[data-region]' ? { region: 'answer' } : { pageId: 'full' }, getBoundingClientRect: () => ({ left: 100, top: 400, width: 100, height: 80 }) }], scrollTo: value => calls.push(value), focus: value => calls.push(value) };
  api.locatePaperTarget(node, { pageId: 'full' }, .5);
  assert.deepEqual(calls.pop(), { top: 842, behavior: 'instant' });
  reduced = false; api.locatePaperTarget(node, { regionId: 'answer', focus: true }, .5);
  assert.deepEqual(calls, [{ left: -80, top: 630, behavior: 'smooth' }, { preventScroll: true }]);
  api.locatePaperTarget(node, { pageId: 'missing' }); api.locatePaperTarget(null, { pageId: 'full' });
  assert.equal(calls.length, 2);
});

test('continuous pan/pinch emits zoom intent and cancellation preserves keyboard activation', () => {
  const zooms = [], node = { scrollLeft: 100, scrollTop: 100, getBoundingClientRect: () => ({ left: 0, top: 0 }), querySelectorAll: () => [{ dataset: { pageId: 'full', percent: '100' }, getBoundingClientRect: () => ({ left: 0, top: 0, right: 600, bottom: 820, width: 600, height: 820 }) }] };
  const out = capture(api.PaperPreviewContinuous, { ...props, viewportRef: { current: node }, scale: .5, onZoom: value => zooms.push(value) });
  const view = out.nodes[0].props, target = { setPointerCapture() {}, hasPointerCapture: () => false };
  const event = (pointerId, clientX, clientY) => ({ pointerId, clientX, clientY, pointerType: 'touch', button: 0, target, preventDefault() {} });
  view.onPointerDown(event(1, 100, 100)); view.onPointerMove(event(1, 103, 102)); assert.equal(node.scrollLeft, 100);
  view.onPointerMove(event(1, 120, 110)); assert.equal(node.scrollLeft, 60); assert.equal(node.scrollTop, 80);
  view.onPointerUp(event(1, 120, 110));
  let stopped = 0;
  view.onClickCapture({ detail: 1, preventDefault() {}, stopPropagation() { stopped++; } });
  view.onClickCapture({ detail: 0, preventDefault() {}, stopPropagation() { stopped++; } }); assert.equal(stopped, 1);
  view.onPointerDown(event(2, 100, 100)); view.onPointerDown(event(3, 200, 100)); view.onPointerMove(event(3, 300, 100));
  assert.deepEqual(zooms, [200]);
  view.onPointerCancel(event(2, 100, 100)); view.onLostPointerCapture(event(3, 300, 100)); view.onPointerMove(event(3, 400, 100));
  assert.deepEqual(zooms, [200]);
});

test('paper-edge surface preserves host tools/overlay and handles missing-image facts', () => {
  const surface = { viewportRef: props.viewportRef, toolbarRef: { current: null }, toolbar: h('nav', {}, '标准工具'), overlay: h('output', {}, '宿主信息'), children: h('div', {}, '扫描内容') };
  const html = render(h(api.PaperPreviewSurface, surface));
  for (const text of ['标准工具', '宿主信息', '扫描内容']) assert.ok(html.includes(text));
  const missing = render(h(api.PaperPreviewSurface, { ...surface, missing: true, emptyImageText: '未提供扫描', emptyImageDetail: '外部缺图说明' }));
  assert.match(missing, /未提供扫描/); assert.match(missing, /外部缺图说明/); assert.doesNotMatch(missing, /扫描内容/);
  assert.deepEqual(api.dockPaperToolbar({ canvasWidth: 828, paperRight: 764 }), { left: 764 });
  assert.deepEqual(api.dockPaperToolbar({ canvasWidth: 828, paperRight: 1200 }), { left: 764 });
});

test('continuous page fixtures retain three themes, narrow containers, long Chinese and formulas', () => {
  const html = render(h(api.ContinuousPaperPreviewDemo));
  for (const theme of ['light', 'paper', 'dark']) assert.ok(html.includes(`data-prism-theme="${theme}"`));
  assert.match(html, /320px/); assert.match(html, /<math>/); assert.match(html, /请完整核对参数条件、推导过程与最终结论/);
});
