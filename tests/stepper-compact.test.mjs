import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
const root = fileURLToPath(new URL('../', import.meta.url));
const dir = new URL('../.sites-runtime/stepper-compact-test/', import.meta.url);
await mkdir(dir, { recursive: true });
const file = new URL('probe.mjs', dir);
await writeFile(file, (await build({
  stdin: { contents: `export * from './components/prism-next/stepper'`, resolveDir: root, loader: 'tsx' },
  bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false,
  plugins: [{ name: 'capture-compact-effect', setup(build) {
    build.onLoad({ filter: /prism-next\/stepper\.tsx$/ }, async args => ({ loader: 'tsx', contents: (await readFile(args.path, 'utf8'))
      .replace('import { useEffect, useRef } from "react"', `const useRef = () => ({ current: (globalThis as any).__compact?.refs.shift() ?? null });
const useEffect = (effect: () => void) => { if ((globalThis as any).__compact) (globalThis as any).__compact.effect = effect; };`) }));
  } }],
})).outputFiles[0].text);
const { Stepper } = await import(file); await rm(file);
const steps = ['done', 'pending', 'current', 'upcoming', 'blocked', 'error'].map((state, i) => ({ id: String(i), label: `阶段 ${i + 1}`, state, description: `说明 ${i + 1}`, selectable: true }));
const html = props => render(React.createElement(Stepper, { steps, ...props }));
const hash = text => createHash('sha256').update(text).digest('hex');
// Captured from main 9673dc3, before S1 changes: full SSR DOM including classes.
const baseline = {
  "horizontal:undefined": "bb7f7e3d23f0612ee285da3d3a62dc20c90932ea0687368e0593d6864354ce12",
  "horizontal:4": "acaf08e28e1e6b1328cd2ca2b7e935261a4c619962331820a6e0343d84eaade1",
  "horizontal:missing": "8cec8c9a416e152e0f5f2d4917695b335e6299207c40f979c0ef0215504fac58",
  "vertical:undefined": "5881bdb34ff975c54a5184bb03af05e1d58970e37743b91e0dcbfa46635e1d5b",
  "vertical:4": "c6034e4df2ab6dc0705837ddf1ba47a1da9b8524728d1d86d49c264b6ba68ce1",
  "vertical:missing": "5838f60a1437e7e957e47eac7fe56a7cc0ca78042e75af78ddc5f821829ff131"
};
test('noncompact horizontal, vertical and vertical+compact preserve main DOM exactly', () => {
  for (const orientation of ['horizontal', 'vertical']) {
    for (const currentStepId of [undefined, '4', 'missing']) {
      const props = { orientation, currentStepId, onStepSelect() {} };
      assert.equal(hash(html(props)), baseline[`${orientation}:${currentStepId}`]);
      assert.equal(html({ ...props, compact: false }), html(props));
      if (orientation === 'vertical') assert.equal(html({ ...props, compact: true }), html(props));
    }
  }
});
test('compact retains six status facts, names, reasons, native selection and no scroll tab stop', () => {
  const out = html({ compact: true, currentStepId: '4', onStepSelect() {} });
  assert.equal((out.match(/<li /g) || []).length, 6);
  assert.equal((out.match(/<button /g) || []).length, 5);
  assert.doesNotMatch(out, /tabindex=|可横向滚动|class="[^"]*(?<!:)\bmin-h-11 /);
  for (const label of ['已完成', '待完成', '当前阶段 · 受阻', '后续阶段']) assert.ok(out.includes(label));
  assert.match(out, /aria-label="前往：阶段 2" aria-description="第 2 步，待完成。说明 2"/);
  assert.match(out, /title="阶段 5 · 第 5 步，当前阶段 · 受阻。说明 5"/);
  assert.match(out, /size-6/); assert.doesNotMatch(out, /size-8/);
  assert.equal((out.match(/prism-stepper-connector/g) || []).length, 5);
  assert.match(out, /bg-info-foreground" aria-hidden="true" data-complete="true"/);
});
test('compact measures full labels on resize, collapses and restores without scrolling or losing focus', t => {
  let available = 320, fullWidth = 670, callback, disconnected = false;
  const observed = [];
  const viewport = { dataset: {}, get clientWidth() { return available + 8; }, scrollTo() { assert.fail('compact must not scroll'); } };
  const list = { get clientWidth() { return available; }, get scrollWidth() { assert.equal(viewport.dataset.collapsed, undefined, 'measure expanded content each time'); return fullWidth; } };
  const original = globalThis.ResizeObserver;
  globalThis.ResizeObserver = class { constructor(fn) { callback = fn; } observe(node) { observed.push(node); } disconnect() { disconnected = true; } };
  t.after(() => { if (original === undefined) delete globalThis.ResizeObserver; else globalThis.ResizeObserver = original; delete globalThis.__compact; });
  globalThis.__compact = { refs: [viewport, list] };
  html({ compact: true });
  const cleanup = globalThis.__compact.effect();
  assert.equal(viewport.dataset.collapsed, 'true');
  assert.deepEqual(observed, [viewport, list]);
  available = 1172; callback(); assert.equal(viewport.dataset.collapsed, 'false');
  fullWidth = 1500; callback(); assert.equal(viewport.dataset.collapsed, 'true');
  available = 1496; callback(); assert.equal(viewport.dataset.collapsed, 'true', 'viewport padding is not usable label space');
  available = 1500; callback(); assert.equal(viewport.dataset.collapsed, 'false');
  available = 280; callback(); assert.equal(viewport.dataset.collapsed, 'true');
  cleanup(); assert.equal(disconnected, true);
});
test('compact CSS is scoped; fixed short connectors, centering, intrinsic group and narrow fallback are explicit', async () => {
  const css = await readFile(new URL('../components/prism-next/stepper.css', import.meta.url), 'utf8');
  assert.equal(hash(css.split('/* Optional horizontal toolbar')[0]), "a2dd8ab3eed77b950d57cc98b86a4239b130d0be6a9f892a9b746127e0dca897");
  assert.match(css, /data-compact="true"\] \{ width: max-content/);
  assert.match(css, /\.prism-stepper-item \{ display: flex; align-items: center; flex: 0 0 auto/);
  assert.match(css, /\.prism-stepper-connector \{ position: static; flex: 0 0 1\.5rem/);
  assert.match(css, /data-collapsed="true".*flex-wrap: wrap/);
  assert.match(css, /:not\(\[aria-current="step"\]\) \.prism-stepper-details.*clip-path: inset\(50%\)/);
  assert.doesNotMatch(css.split('/* Optional horizontal toolbar')[1], /display: none|overflow-x: auto/);
});
