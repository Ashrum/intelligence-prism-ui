import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
const root = fileURLToPath(new URL('../', import.meta.url));
const dir = new URL('../.sites-runtime/paper-preview-test/', import.meta.url);
await mkdir(dir, { recursive: true });
const options = { stdin: { contents: `export * from './components/prism-next/paper-preview'; export * from './components/prism-next/demos/paper-preview'; export * from './components/prism-next/document-region-viewer';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false };
const file = new URL('bundle.mjs', dir);
await writeFile(file, (await build(options)).outputFiles[0].text);
const api = await import(file);
await rm(file);
const h = React.createElement;
test('region composition preserves geometry and legacy viewer without pageLayout', () => {
  const regions = [{ id: 'r', label: '第 3 题', rect: [8, 42, 84, 24] }];
  const modern = render(h(api.DocumentRegionViewer, { regions, selectedId: 'r', onSelect() {}, pageLayout: { width: 100, height: 200 } }));
  assert.match(modern, /left:8%;top:42%;width:84%;height:24%/); assert.match(modern, /aria-pressed="true"/); assert.doesNotMatch(modern, /review-sheet/);
  assert.match(render(h(api.DocumentRegionViewer, { regions, onSelect() {} })), /review-sheet-viewport/);
});

test('region hit layers cover full height with visible normal/selected borders and transparent hover', () => {
  const markup = render(h(api.DocumentRegionViewer, { regions: [{ id: 'r', label: '第 3 题', rect: [8, 70, 84, 20] }], selectedId: 'r', onSelect() {}, pageLayout: { width: 794, height: 1123 } }));
  const classes = markup.match(/<button[^>]*class="([^"]*)"/)[1].split(' ');
  for (const name of ['h-full', 'sm:h-full', 'border-border', 'aria-pressed:border-2', 'aria-pressed:border-primary', 'hover:bg-transparent', 'data-pressed:bg-transparent']) assert.ok(classes.includes(name), name);
  for (const name of ['sm:h-8', 'border-transparent', 'hover:bg-accent', 'data-pressed:bg-accent']) assert.ok(!classes.includes(name), name);
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


test('R1 defaults to the continuous canvas and removes legacy public exports', () => {
  const props = { pages: [{ id: 'one' }, { id: 'two' }] };
  const html = render(h(api.PaperPreview, props));
  assert.equal(html, render(h(api.PaperPreview, { ...props, layout: 'continuous' })));
  assert.match(html, /data-review-continuous/);
  assert.equal((html.match(/data-review-page=/g) || []).length, 2);
  assert.doesNotMatch(html, /data-paper-preview|上一页|下一页|扫描版本|试卷信息/);
  for (const name of ['PaperPreviewDialog', 'clampPaperPage', 'stepPaperZoom', 'paperZoomAnchor']) assert.equal(name in api, false, name);
});

test('R1 mixed entry renders exactly the existing mixed engine with its own props', () => {
  const mixed = { pages: [{ id: 'digital', width: 600, height: 1, content: h('article', {}, '数字题面') }], viewportRef: { current: null }, zoom: 'width', rotations: {}, scale: 1, topInset: 0, onZoom() {}, onVisiblePage() {}, onViewport() {} };
  assert.equal(render(h(api.PaperPreview, { layout: 'mixed', mixed })), render(h(api.PaperPreviewMixed, mixed)));
});

test('shared paper geometry and passive Attachment thumbnail survive retirement', () => {
  const paper = api.paperDimensions('A3', 'landscape');
  for (const rotation of [0, 90, 180, 270]) {
    const size = api.rotatedPaperDimensions(paper, rotation), swap = rotation === 90 || rotation === 270;
    assert.equal(size.width, swap ? paper.height : paper.width);
    assert.equal(size.height, swap ? paper.width : paper.height);
    assert.equal(api.paperZoomPercent('width', { width: size.width / 2, height: 1 }, size), 50);
    assert.equal(api.paperZoomPercent('page', { width: size.width, height: size.height / 4 }, size), 25);
  }
  assert.equal(api.clampPaperZoom(-1), 5); assert.equal(api.clampPaperZoom(301), 300);
  const thumbnail = page => render(h(api.PaperThumbnail, { page, label: '原卷缩略图' }));
  assert.match(thumbnail({ id: 'p', paperSize: 'A3' }), /扫描图像未接入/);
  assert.match(thumbnail({ id: 'p', imageUrl: '/full.svg', thumbnailUrl: '/thumb.svg' }), /src="\/thumb.svg"/);
});

test('retired demos leave continuous and mixed fixtures with three themes and formulas', () => {
  const html = render(h(api.PaperPreviewDemo));
  assert.match(html, /data-review-continuous/); assert.match(html, /数字题目|数字题面|数字内容/);
  for (const theme of ['light', 'paper', 'dark']) assert.ok(html.includes(`data-prism-theme="${theme}"`));
  assert.match(html, /<math/); assert.match(html, /320px/);
  assert.doesNotMatch(html, /全屏查看学生试卷|扫描版本|信息栏下移/);
});
