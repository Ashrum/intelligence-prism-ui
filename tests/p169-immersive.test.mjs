import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { createTestRuntime } from './helpers/test-runtime.mjs';
import { clientDOM } from './helpers/chart-client-dom.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = 'components/prism-next/review-workspace.tsx';
const baseline = 'c73824deb31087558ab840584a07d658bb561e9e';
const runtime = await createTestRuntime('p169');
const h = React.createElement;
async function bundle(old) {
  const output = new URL(old ? 'before.mjs' : 'after.mjs', runtime);
  const result = await build({
    stdin: { contents: `export * from './${source}';`, resolveDir: root, loader: 'tsx' },
    bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external',
    alias: { '@': root }, loader: { '.css': 'empty' }, write: false,
    plugins: old ? [{ name: 'baseline', setup(b) {
      b.onLoad({ filter: /review-workspace\.tsx$/ }, () => ({
        contents: execFileSync('git', ['show', `${baseline}:${source}`], { cwd: root, encoding: 'utf8' }), loader: 'tsx',
      }));
    } }] : [],
  });
  writeFileSync(output, result.outputFiles[0].text);
  return import(output);
}
const old = await bundle(true), api = await bundle(false);
const base = {
  label: '通用预览框架', immersive: false, pane: 'canvas', onPaneChange() {}, open: true,
  topbar: h('header', { className: 'bp-work-header' }, '宿主任意顶栏'),
  rail: h('aside', {}, '题目栏'), inspector: h('aside', { className: 'custom-inspector' }, '任意右栏'),
  canvas: h('section', { 'data-review-canvas': '', className: 'd1-canvas' }, h('button', {}, '工具条沉浸按钮')),
};
const render = (module, extra) => renderToStaticMarkup(h(module.ReviewWorkspace, { ...base, ...extra }));
for (const [index, extra] of [
  {}, { open: false, pane: 'rail' }, { rail: null, pane: 'rail' },
  { topbar: null, rail: false, children: h('output', {}, '外部事实') },
  { ready: false, animate: true, device: '1440', style: { width: 1440, height: 900 } },
  { blueprintFrame: true, blueprintFolio: { kind: 'sheet', value: '1 / 2' } },
  { panes: [{ value: 'canvas', label: '试卷' }, { value: 'inspector', label: '反馈' }] },
  { fullscreen: false, immersiveLabel: '不显示', onImmersiveChange() {} },
].entries()) test(`P169 non-immersive SSR case ${index} matches c73824d byte for byte`, () => {
  assert.equal(render(api, extra), render(old, extra));
});

test('P169 immersive SSR removes arbitrary topbar and inspector, keeps canvas and renders one label and exit', () => {
  const html = render(api, { immersive: true, immersiveLabel: h('span', {}, '苏景行 · 第 1 / 2 页') });
  assert.doesNotMatch(html, /宿主任意顶栏|任意右栏/);
  assert.match(html, /工具条沉浸按钮/);
  assert.equal(html.match(/苏景行 · 第 1 \/ 2 页/g)?.length, 1);
  assert.equal(html.match(/aria-label="退出沉浸（Esc）"/g)?.length, 1);
  assert.doesNotMatch(render(api, { immersive: true }), /class="d1-immersive-label/);
});

// Real React commits and effects; fullscreen and DOM focus are stubs, not browser acceptance.
async function mount(mode = 'standard') {
  const keys = ['window', 'document', 'IS_REACT_ACT_ENVIRONMENT'];
  const saved = Object.fromEntries(keys.map(k => [k, Object.getOwnPropertyDescriptor(globalThis, k)]));
  const dom = clientDOM(1280, 900), doc = dom.document;
  const proto = dom.window.HTMLElement.prototype;
  const listeners = new Map();
  doc.addEventListener = (name, handler) => { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(handler); };
  doc.removeEventListener = (name, handler) => listeners.get(name)?.delete(handler);
  const emit = (name, extra = {}) => { for (const fn of [...listeners.get(name) ?? []]) fn({ preventDefault() {}, stopPropagation() {}, ...extra }); };
  proto.querySelector = function(selector) {
    const visit = node => { for (const child of node.childNodes ?? []) {
      if (child.nodeType === 1 && (selector === '[data-review-canvas]' ? child.getAttribute('data-review-canvas') !== null : false)) return child;
      const found = visit(child); if (found) return found;
    } return null; }; return visit(this);
  };
  proto.hasAttribute = function(name) { return this.getAttribute(name) !== null; };
  proto.contains = function(child) { for (; child; child = child.parentNode) if (child === this) return true; return false; };
  proto.focus = function() { doc.activeElement = this; };
  Object.defineProperty(proto, 'isConnected', { get() { return doc.body.contains(this); } });
  const initial = doc.createElement('button'); doc.body.appendChild(initial); initial.focus();
  const counts = { request: 0, exit: 0, changes: [] };
  const field = mode === 'webkit' ? 'webkitFullscreenElement' : 'fullscreenElement';
  const eventName = mode === 'webkit' ? 'webkitfullscreenchange' : 'fullscreenchange';
  let resolveRequest;
  if (mode !== 'unsupported') proto[mode === 'webkit' ? 'webkitRequestFullscreen' : 'requestFullscreen'] = function() {
    counts.request++;
    if (mode === 'throw') throw Error('denied');
    if (mode === 'reject') return Promise.reject(Error('denied'));
    if (mode === 'pending') return new Promise(resolve => { resolveRequest = () => { doc[field] = this; emit(eventName); resolve(); }; });
    doc[field] = this; emit(eventName); return Promise.resolve();
  };
  doc[mode === 'webkit' ? 'webkitExitFullscreen' : 'exitFullscreen'] = () => {
    counts.exit++; doc[field] = null; emit(eventName); return Promise.resolve();
  };
  Object.assign(globalThis, { window: dom.window, document: doc, IS_REACT_ACT_ENVIRONMENT: true });
  const host = doc.createElement('div'); doc.body.appendChild(host);
  const mounted = createRoot(host), frameRef = { current: null };
  const props = { ...base, panes: [], frameRef, onImmersiveChange: value => counts.changes.push(value) };
  const update = async extra => { Object.assign(props, extra); await act(() => mounted.render(h(api.ReviewWorkspace, props))); };
  await update({});
  return { doc, counts, initial, frameRef, emit, update, resolve: () => resolveRequest(),
    externalExit: () => { doc[field] = null; emit(eventName); },
    close: async () => { await act(() => mounted.unmount()); for (const k of keys) if (saved[k]) Object.defineProperty(globalThis, k, saved[k]); else delete globalThis[k]; },
    listeners,
  };
}
for (const mode of ['standard', 'webkit']) test(`P169 ${mode}: request, external exit callback, focus and ref restoration`, async () => {
  const env = await mount(mode);
  try {
    const frame = env.frameRef.current;
    await env.update({ immersive: true });
    assert.equal(env.counts.request, 1);
    assert.equal(env.doc.activeElement, frame.querySelector('[data-review-canvas]'));
    assert.equal(env.doc.activeElement.getAttribute('tabindex'), '-1');
    await act(() => env.externalExit());
    assert.deepEqual(env.counts.changes, [false]);
    await env.update({ immersive: false });
    assert.equal(env.doc.activeElement, env.initial);
    assert.equal(frame.querySelector('[data-review-canvas]').getAttribute('tabindex'), null);
    assert.equal(env.frameRef.current, frame);
  } finally { await env.close(); }
  assert.equal(env.frameRef.current, null);
});
for (const mode of ['reject', 'throw', 'unsupported']) test(`P169 ${mode}: page-only fallback without exception or false callback`, async () => {
  const env = await mount(mode);
  try {
    await env.update({ immersive: true });
    assert.equal(env.frameRef.current.getAttribute('data-immersive'), 'true');
    assert.deepEqual(env.counts.changes, []);
    await act(() => env.emit('keydown', { key: 'Escape' }));
    assert.deepEqual(env.counts.changes, [false]);
  } finally { await env.close(); }
});
test('P169 fullscreen=false does not request; activity fades/reveals controls and exit button emits once', async t => {
  const env = await mount();
  t.mock.timers.enable({ apis: ['setTimeout'] });
  try {
    await env.update({ immersive: true, fullscreen: false, immersiveLabel: '苏景行' });
    assert.equal(env.counts.request, 0);
    const controls = env.frameRef.current.childNodes.at(-1);
    assert.equal(controls.getAttribute('data-visible'), 'true');
    await act(() => t.mock.timers.tick(2500));
    assert.equal(controls.getAttribute('data-visible'), 'false');
    await act(() => env.emit('pointermove'));
    assert.equal(controls.getAttribute('data-visible'), 'true');
    await act(() => t.mock.timers.tick(2500));
    await act(() => env.emit('keydown', { key: 'ArrowRight' }));
    assert.equal(controls.getAttribute('data-visible'), 'true');
    const button = controls.childNodes.at(-1);
    const handlers = button[Object.keys(button).find(k => k.startsWith('__reactProps$'))];
    await act(() => handlers.onClick({}));
    assert.deepEqual(env.counts.changes, [false]);
  } finally { await env.close(); t.mock.timers.reset(); }
  for (const name of ['fullscreenchange', 'webkitfullscreenchange', 'pointermove', 'keydown']) assert.equal(env.listeners.get(name)?.size, 0);
});
test('P169 controlled toolbar exit and unmount exit only owned fullscreen', async () => {
  const env = await mount();
  try {
    await env.update({ immersive: true });
    await env.update({ immersive: false });
    assert.equal(env.counts.exit, 1);
    assert.deepEqual(env.counts.changes, []);
    await env.update({ immersive: true });
  } finally { await env.close(); }
  assert.equal(env.counts.exit, 2);
  const other = await mount();
  try {
    await other.update({ immersive: true, fullscreen: false });
    other.doc.fullscreenElement = other.doc.createElement('video');
    await other.update({ immersive: false });
    assert.equal(other.counts.exit, 0);
  } finally { await other.close(); }
});
test('P169 late fullscreen resolution after exit is released without a stale callback', async () => {
  const env = await mount('pending');
  try {
    await env.update({ immersive: true });
    await env.update({ immersive: false });
    await act(() => env.resolve());
    assert.equal(env.counts.exit, 1);
    assert.deepEqual(env.counts.changes, []);
  } finally { await env.close(); }
});
test('P169 all added CSS is immersive-only, includes viewport fallback and reduced motion', () => {
  const css = readFileSync(root + 'components/prism-next/review-workspace.css', 'utf8').split('/* P169 ·')[1];
  for (const [, selector] of css.matchAll(/([^{}]+)\{[^{}]*\}/g)) assert.match(selector, /\[data-immersive="true"\]/);
  assert.match(css, /position:fixed; inset:0; z-index:1000; width:100vw; height:100dvh/);
  assert.match(css, /color-mix\(in srgb, var\(--foreground\) 88%, var\(--background\)\)/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /:focus-within \{ opacity:1; \}/);
});
