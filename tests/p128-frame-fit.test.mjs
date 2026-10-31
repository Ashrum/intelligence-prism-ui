import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import postcss from 'postcss';
import { transform } from 'lightningcss';
import React, { act } from 'react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { createTestRuntime } from './helpers/test-runtime.mjs';
import { reviewHydrationDOM } from './helpers/p126-hydration-dom.mjs';
import { domNodes } from './helpers/ssr-hydration-dom.mjs';
import { restoreP128, p128SourceFiles } from './helpers/p128-source-compat.mjs';

const root = fileURLToPath(new URL('../', import.meta.url)), h = React.createElement;
const baseline = '0656aaa60854d6b50085d6110cec96a869deb829';
const read = p => readFileSync(root + p, 'utf8');
const css = read('app/(next)/next/blueprint.css');
const block = css.slice(css.indexOf('/* P128:'));
const ast = postcss.parse(block);
const query = ast.nodes.find(n => n.type === 'atrule');
const minWidth = Number(query.params.match(/min-width:(\d+)px/)[1]);
const declarations = rule => Object.fromEntries(rule.nodes.map(d => [d.prop, d.value]));
// Evaluate only P128's simple declarations/query, not browser layout or visual acceptance.
function canvasStyles(width) {
  const styles = {};
  for (const rule of [...ast.nodes.filter(n => n.type === 'rule'), ...(width >= minWidth ? query.nodes : [])]) {
    styles[rule.selector] = { ...styles[rule.selector], ...declarations(rule) };
  }
  return { root: styles['.bp-frame.bp-frame--canvas'], host: styles['.bp-frame--canvas > .d1-paper-host'], decoration: styles['.bp-frame--canvas > .bp-frame-decoration'] };
}
const marginAt = width => parseFloat(canvasStyles(width).host.margin);
const runtime = await createTestRuntime('p128');
async function compile(name) {
  const file = new URL(`${name}.mjs`, runtime);
  const result = await build({ stdin: { contents: `export * from './examples/question-review/question-review';export * from './examples/paper-review/paper-review';export * from './components/prism-next/blueprint/blueprint';export {paperDimensions,paperZoomPercent} from './components/prism-next/paper-preview';export {PAPER_WIDTH} from './examples/question-review/artwork';export {ThemeProvider} from 'next-themes';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root, 'next/link': 'next/link.js', 'next/navigation': 'next/navigation.js' }, loader: { '.css': 'empty' }, write: false, plugins: [{ name: 'real-provider-per-environment', setup(b) {
    b.onResolve({ filter: /^next-themes$/ }, () => ({ path: fileURLToPath(import.meta.resolve('next-themes')) }));
    b.onResolve({ filter: /temml\.mjs\?url$/ }, () => ({ path: 'temml', namespace: 'url' }));
    b.onLoad({ filter: /.*/, namespace: 'url' }, () => ({ contents: 'export default "temml.mjs"' }));
  } }] });
  writeFileSync(file, result.outputFiles[0].text); return file;
}
const server = await import(await compile('server')), clientFile = await compile('client');
const element = (api, name) => h(api.ThemeProvider, { storageKey: 'prism-v1-theme', attribute: 'data-prism-theme', enableSystem: false, defaultTheme: 'light' }, h(api[name]));
const find = (host, attr) => domNodes(host, n => n.hasAttribute?.(attr))[0];
const props = node => node[Object.keys(node).find(k => k.startsWith('__reactProps$'))];

test('P128 exact constant derives from real A4 / question artwork and fit-width algorithm on both sides', () => {
  const paper = server.paperDimensions();
  assert.equal(server.PAPER_WIDTH, Math.ceil(paper.width));
  assert.equal(server.BLUEPRINT_CANVAS_FRAME_MIN_WIDTH, Math.ceil(paper.width + 60 + 16 + 56));
  assert.equal(minWidth, server.BLUEPRINT_CANVAS_FRAME_MIN_WIDTH);
  for (const width of [paper.width, server.PAPER_WIDTH]) {
    for (const height of [1, 900, 1080]) {
      const framed = w => server.paperZoomPercent('width', { width: w - 60 - 16 - 56, height }, { width, height: paper.height });
      assert.ok(framed(925) < 100);
      assert.ok(framed(926) >= 100);
      for (const canvasWidth of [390, 828, 925, 926, 1236]) {
        const available = canvasWidth - 2 * marginAt(canvasWidth) - 16 - 56;
        const actual = server.paperZoomPercent('width', { width: available, height }, { width, height: paper.height });
        if (canvasWidth < 926) assert.equal(actual, server.paperZoomPercent('width', { width: canvasWidth - 72, height }, { width, height: paper.height }));
        else assert.ok(actual >= 100);
      }
    }
  }
});

test('P128 query only styles explicit canvas children; full-page frame / inline title ornaments and old CSS remain intact', () => {
  assert.equal(query.name, 'container'); assert.equal(query.params, 'bp-preview-canvas (min-width:926px)');
  assert.doesNotThrow(() => transform({ code: Buffer.from(block), minify: true }));
  assert.doesNotMatch(block, /@media|height:|\.bp-inline|data-narrow-frame/);
  ast.walkDecls(d => assert.ok(!d.prop.startsWith('--'), 'no new tokens'));
  assert.equal(canvasStyles(925).root.container, 'bp-preview-canvas / inline-size');
  for (const width of [390, 760, 828, 925, 926, 1236]) {
    const style = canvasStyles(width);
    assert.equal(style.root.padding, '0'); assert.equal(style.root['box-shadow'], 'none');
    assert.equal(style.host.margin, width < 926 ? '0' : '30px');
    assert.equal(style.decoration.display, width < 926 ? 'none' : 'block');
  }
  ast.walkRules(rule => assert.ok(rule.selector.startsWith('.bp-frame--canvas > .') || rule.selector === '.bp-frame.bp-frame--canvas'));
  for (const path of p128SourceFiles) {
    const original = execFileSync('git', ['show', `${baseline}:${path}`], { cwd: root, encoding: 'utf8' });
    assert.equal(restoreP128(path, read(path)), original);
    assert.notEqual(restoreP128(path, read(path) + '\n// unrelated\n'), original);
    assert.throws(() => restoreP128(path, read(path).replace('926', '925')));
  }
});

for (const name of ['PaperReviewDesign', 'QuestionReviewDesign']) for (const theme of ['blueprint', 'blueprint-night']) test(`P128 ${name}/${theme}: real host resize, rail T and immersive F retain nodes, scroll and custom zoom`, async () => {
  const dom = reviewHydrationDOM(), host = dom.parse(renderToString(element(server, name)), dom.document.createElement('div'));
  dom.document.body.appendChild(host); dom.window.localStorage.setItem('prism-v1-theme', theme);
  const observers = new Set();
  class Observer {
    constructor(callback) { this.callback = callback; this.nodes = new Set(); observers.add(this); }
    observe(node) { this.nodes.add(node); }
    unobserve(node) { this.nodes.delete(node); }
    disconnect() { observers.delete(this); }
  }
  dom.globals.ResizeObserver = Observer;
  const previous = Object.fromEntries(Object.keys(dom.globals).map(k => [k, globalThis[k]])); Object.assign(globalThis, dom.globals);
  const errors = [], originalError = console.error; console.error = (...args) => errors.push(args.join(' '));
  const canvas = find(host, 'data-review-canvas'), viewport = find(host, 'data-zoom-mode');
  const paper = domNodes(host, n => n.hasAttribute?.('data-paper-size'))[0];
  const frame = find(host, 'data-rail-collapsed');
  let mounted;
  try {
    const api = await import(clientFile);
    await act(() => { mounted = hydrateRoot(host, element(api, name), { onRecoverableError: e => errors.push(e.message) }); });
    assert.ok(canvas.classList.contains('bp-frame--canvas'));
    assert.ok(canvas.children.some(n => n.classList.contains('d1-paper-host')));
    const decoration = canvas.children.find(n => n.classList.contains('bp-frame-decoration'));
    assert.ok(decoration); assert.equal(decoration.getAttribute('aria-hidden'), 'true');
    assert.equal(decoration.querySelectorAll('.bp-ruler').length, 4);
    if (name === 'PaperReviewDesign') assert.match(decoration.textContent, /SHEET 17 \/ 20/);
    else {
      assert.ok(domNodes(canvas, n => n.classList?.contains('bp-inline-folio') && !decoration.contains(n)).length);
      assert.ok(domNodes(host, n => n.classList?.contains('bp-inline-code') && n.textContent === 'B' && !canvas.contains(n)).length);
    }
    // Inject only CSS-derived geometry, then fire the actual viewport observer.
    // No host/zoom hooks are mocked; CSS rendering remains Supervisor's check.
    async function resize(width, height = 900) {
      canvas.offsetWidth = width;
      viewport.offsetWidth = width - 2 * marginAt(width); viewport.offsetHeight = height - 2 * marginAt(width);
      const listeners = [...observers].filter(o => o.nodes.has(viewport)); assert.ok(listeners.length);
      await act(() => { for (const o of listeners) o.callback([{ target: viewport }]); });
      assert.equal(find(host, 'data-review-canvas'), canvas); assert.equal(find(host, 'data-zoom-mode'), viewport);
      assert.equal(domNodes(host, n => n.hasAttribute?.('data-paper-size'))[0], paper);
    }
    for (const [width, height] of [[828, 900], [925, 900], [926, 900], [926, 200], [1236, 1080]]) {
      await resize(width, height);
      const paperWidth = name === 'PaperReviewDesign' ? api.paperDimensions().width : api.PAPER_WIDTH;
      assert.equal(Number(paper.getAttribute('data-percent')), api.paperZoomPercent('width', { width: width - 2 * marginAt(width) - 72, height }, { width: paperWidth, height: 1123 }));
    }
    async function key(key) {
      await act(() => props(frame).onKeyDownCapture({ key, target: viewport, currentTarget: frame, nativeEvent: {}, preventDefault() {}, stopPropagation() {} }));
    }
    await key('+'); const zoom = paper.getAttribute('data-percent');
    assert.equal(viewport.getAttribute('data-zoom-mode'), 'custom');
    viewport.scrollTop = 137; viewport.scrollLeft = 19;
    await resize(828);
    const wasCollapsed = frame.getAttribute('data-rail-collapsed'); await key('t');
    assert.notEqual(frame.getAttribute('data-rail-collapsed'), wasCollapsed); await resize(1060);
    await key('f'); assert.equal(frame.getAttribute('data-immersive'), 'true'); await resize(1440);
    await key('f'); assert.equal(frame.getAttribute('data-immersive'), 'false'); await resize(925);
    assert.equal(paper.getAttribute('data-percent'), zoom);
    assert.equal(viewport.getAttribute('data-zoom-mode'), 'custom');
    assert.equal(viewport.scrollTop, 137); assert.equal(viewport.scrollLeft, 19);
    assert.deepEqual(errors, []);
  } finally {
    if (mounted) await act(() => mounted.unmount()); console.error = originalError;
    for (const [key, value] of Object.entries(previous)) if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
  }
});
