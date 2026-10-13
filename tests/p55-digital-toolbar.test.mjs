import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { api, h, render, capture, mixed, digital } from './p54-harness.mjs';
import { renderer, states } from './question-review-c2-freeze-harness.mjs';

const css = await readFile(new URL('../components/prism-next/review-workspace.css', import.meta.url), 'utf8');
const before = JSON.parse(await readFile(new URL('./fixtures/p55-scan-before.json', import.meta.url), 'utf8'));
const surface = (props, toolbar, scanOnly = true) => h(api.PaperPreviewSurface, { viewportRef: props.viewportRef, toolbarRef: { current: null }, toolbar, scanOnly }, h(api.PaperPreview, { layout: 'mixed', mixed: props }));

test('P55 digital Surface reserves a tool lane only for rendered toolbar content, including immersion', () => {
  assert.match(css, /\.d1-canvas:has\(> \.d1-tool-dock > \.d1-tool-scroll:not\(:empty\)\) > \.d1-paper-host \.d1-continuous\[data-digital-paper\] \{ width:calc\(100% - 72px\); \}/);
  assert.match(css, /\.d1-tool-dock \{[^}]*width:56px;/);
  for (const immersive of [false, true]) for (const tools of [h('nav', {}, '阅读工具'), '阅读工具', null, false, h('span', {}, '上一题')]) {
    const html = render(h('div', { 'data-immersive': immersive }, surface(digital, tools)));
    assert.match(html, /class="d1-paper-host[^]*data-digital-paper="true"/);
    assert.equal(html.includes('<div class="d1-tool-scroll"></div>'), tools === null || tools === false);
    assert.match(html, /class="d1-paper-spread" style="width:740px"/);
  }
  // No Surface means no selector match, and no old 56px spread reserve, even uncapped.
  const standalone = render(h(api.PaperPreview, { layout: 'mixed', mixed: { ...digital, contentMaxWidth: 'none' } }));
  assert.doesNotMatch(standalone, /d1-canvas|d1-tool-dock|width:796px/);
  assert.match(standalone, /data-digital-paper="true"/);
});

test('P55 shrinking constrains spread, column and section before measurement without changing scan CSS', () => {
  assert.match(css, /\.d1-continuous\[data-digital-paper\] > \.d1-paper-spread,\s*\.d1-continuous\[data-digital-paper\] > \.d1-paper-spread > \.d1-paper-column,\s*\.d1-continuous\[data-digital-paper\] > \.d1-paper-spread > \.d1-paper-column > section \{ max-width:100%; \}/);
  for (const canvasWidth of [160, 248, 320, 390, 828, 1440, 1920]) for (const cap of [794, 640, Infinity]) {
    const viewportWidth = canvasWidth - 72;
    const columnWidth = Math.min(viewportWidth - 16, cap);
    const left = 8 + (viewportWidth - 16 - columnWidth) / 2;
    const right = left + columnWidth;
    assert.equal(left + columnWidth / 2, viewportWidth / 2, 'center in remaining area');
    for (const scanOnly of [false, true]) {
      const dock = api.dockPaperToolbar({ canvasWidth, paperRight: scanOnly ? canvasWidth - 64 : right });
      assert.ok(right <= dock.left, `${canvasWidth}/${cap}/${scanOnly}: no overlap`);
      assert.ok(dock.left + 56 <= canvasWidth - 8);
    }
  }
});

// Invoke the actual measuring effect with a fake ResizeObserver; no browser or server.
const root = fileURLToPath(new URL('../', import.meta.url));
const file = new URL(`../.sites-runtime/p55-probe-${process.pid}/probe.mjs`, import.meta.url);
await mkdir(new URL('.', file), { recursive: true });
await writeFile(file, (await build({ stdin: { contents: "export {PaperPreviewMixed} from './components/prism-next/paper-preview-mixed';", resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false,
  plugins: [{ name: 'capture-effects', setup(b) { b.onLoad({ filter: /paper-preview-mixed\.tsx$/ }, async args => ({ loader: 'tsx', contents: (await readFile(args.path, 'utf8')).replaceAll('useLayoutEffect(() => {', ';(globalThis as any).__p55Effects.push(() => {') })); } }],
})).outputFiles[0].text);
const probe = await import(file); await rm(file);

test('P55 resize measurement deducts no phantom tool width from digital viewports', () => {
  const previous = globalThis.ResizeObserver;
  let resize, observed, disconnected;
  globalThis.ResizeObserver = class { constructor(fn) { resize = fn; } observe(node) { observed = node; } disconnect() { disconnected = true; } };
  try {
    for (const props of [digital, { ...digital, contentMaxWidth: 'none' }, mixed, { ...mixed, pages: [] }]) {
      const sizes = [], events = [], node = { clientWidth: 756, clientHeight: 828, addEventListener: name => events.push(name), removeEventListener: name => events.push(`remove-${name}`) };
      globalThis.__p55Effects = [];
      capture(probe.PaperPreviewMixed, { ...props, viewportRef: { current: node }, onViewport: size => sizes.push(size) });
      const measure = globalThis.__p55Effects.find(fn => fn.toString().includes('new ResizeObserver'));
      assert.ok(measure);
      const cleanup = measure(); assert.equal(observed, node);
      for (const width of [248, 756, 1368, 1848, 828]) { node.clientWidth = width; resize(); }
      const reserve = props.pages.length && props.pages.every(page => page.content) ? 0 : 56;
      assert.deepEqual(sizes.map(size => size.width), [756, 248, 756, 1368, 1848, 828].map(width => width - 16 - reserve));
      cleanup(); assert.ok(disconnected); assert.deepEqual(events, ['wheel', 'remove-wheel']);
    }
  } finally { globalThis.ResizeObserver = previous; delete globalThis.__p55Effects; }
});

test('P55 all 24 scan-containing Surface and review states retain pre-change bytes', async () => {
  const cases = {};
  for (const [name, props] of Object.entries({ mixed, rotated: { ...mixed, zoom: 175, rotations: { scan: 90 } }, scan: { ...mixed, pages: [mixed.pages[1]] }, missing: { ...mixed, pages: [...mixed.pages, { id: 'missing', width: 794, height: 1123 }] } })) for (const toolbar of [true, false]) for (const scanOnly of [true, false]) {
    cases[`${name}-${toolbar}-${scanOnly}`] = render(surface(props, toolbar ? h('nav', {}, '阅读工具') : null, scanOnly));
  }
  const question = await renderer();
  for (const [name, state] of Object.entries(states)) if (!['choice', 'fill'].includes(name)) cases[`question-${name}`] = question(state);
  assert.equal(Object.keys(cases).length, 24);
  assert.deepEqual(Object.keys(cases), Object.keys(before.sha256));
  for (const [name, html] of Object.entries(cases)) {
    assert.doesNotMatch(html, /data-digital-paper/);
    assert.equal(createHash('sha256').update(html).digest('hex'), before.sha256[name], name);
  }
});
