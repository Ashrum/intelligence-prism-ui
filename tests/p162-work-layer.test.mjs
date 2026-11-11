import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createTestRuntime } from './helpers/test-runtime.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = await createTestRuntime('p162');
const h = React.createElement;
const render = (Component, props) => renderToStaticMarkup(h(Component, props));
async function bundle(name, plugins = [], extra = '') {
  const result = await build({
    stdin: { contents: `export * from './components/prism-next/blueprint/work-layer'; ${extra}`, loader: 'tsx', resolveDir: root },
    bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, write: false, plugins,
  });
  const url = new URL(`${name}.mjs`, runtime);
  writeFileSync(url, result.outputFiles[0].text);
  return import(url);
}
const api = await bundle('actual');
// Inline primitives expose the component's pending subtree. This is NOT real Portal SSR.
const inline = await bundle('inline', [{ name: 'inline-dialog', setup(builder) {
  builder.onLoad({ filter: /components\/coss\/dialog\.tsx$/ }, () => ({ loader: 'tsx', contents: `
    const Pass = ({children}) => children;
    export const DialogPrimitive = {
      Root: Pass, Portal: Pass,
      Backdrop: props => <div data-test-backdrop {...props} />,
      Popup: ({initialFocus, finalFocus, ...props}) => <div role="dialog" {...props} />,
    };
  ` }));
} }]);
// Run the real work-layer hook with deterministic effect/state slots to exercise reopening and cleanup.
const hookHost = `
let slots = [], cursor = 0, effects = new Map(), dirty = false, component, input;
export function useState(initial) {
  const index = cursor++;
  slots[index] ??= { value: initial };
  return [slots[index].value, next => { if (!Object.is(next, slots[index].value)) { slots[index].value = next; dirty = true; } }];
}
export function useRef(initial) {
  const index = cursor++;
  slots[index] ??= { current: initial };
  return slots[index];
}
export function useEffect(fn, deps) {
  const index = cursor++, old = slots[index];
  if (!old || deps.some((value, i) => !Object.is(value, old.deps[i]))) effects.set(index, () => {
    old?.cleanup?.(); slots[index] = { deps, cleanup: fn() };
  });
}
export function run(fn, props) {
  component = fn; input = props; let value, count = 0;
  do {
    if (++count > 20) throw new Error('render loop');
    dirty = false; cursor = 0; value = component(input);
    const pending = [...effects.values()]; effects.clear(); pending.forEach(fn => fn());
  } while (dirty);
  return value;
}
export function reset() { slots.forEach(slot => slot.cleanup?.()); slots = []; effects.clear(); }
`;
const hooks = await bundle('hooks', [{ name: 'work-layer-hooks', setup(builder) {
  builder.onResolve({ filter: /^p162-hook-host$/ }, () => ({ path: 'hooks', namespace: 'p162' }));
  builder.onLoad({ filter: /.*/, namespace: 'p162' }, () => ({ contents: hookHost, loader: 'js' }));
  builder.onLoad({ filter: /blueprint\/work-layer\.tsx$/ }, args => ({ loader: 'tsx', contents: readFileSync(args.path, 'utf8').replace('import { useEffect, useRef, useState,', 'import { useEffect, useRef, useState } from "p162-hook-host"\nimport {') }));
} }], 'export { run, reset } from "p162-hook-host";');

const props = { open: true, onOpenChange() {}, label: '学生详情', children: h('p', null, 'HEAVY CHILD') };

test('P162 real Base UI Portal SSR emits no markup (task SSR requirement needs clarification)', () => {
  assert.equal(render(api.BpWorkLayer, props), '');
});
test('P162 pending subtree SSR with inline dialog shows skeleton and busy, never evaluates heavy child', () => {
  function Heavy() { throw new Error('Heavy child mounted before ready'); }
  const html = render(inline.BpWorkLayer, { ...props, children: h(Heavy) });
  assert.match(html, /role="dialog"[^>]*aria-label="学生详情"[^>]*aria-busy="true"/);
  assert.match(html, /role="status" aria-label="正在打开"/);
  assert.doesNotMatch(html, /data-bp-work-layer-content/);
  assert.doesNotMatch(render(inline.BpWorkLayer, { ...props, open: false }), /aria-busy|role="status"|HEAVY CHILD/);
  const custom = render(inline.BpWorkLayer, { ...props, skeleton: h('span', null, 'CUSTOM SKELETON') });
  assert.match(custom, /CUSTOM SKELETON/);
  assert.doesNotMatch(custom, /HEAVY CHILD|bp-work-skeleton/);
});
test('P162 skeleton keeps known header, optional sidebars and responsive center shapes', () => {
  const html = render(api.BpWorkSkeleton, {});
  assert.match(html, /role="status" aria-label="正在打开"/);
  for (const token of ['data-bp-work-skeleton-header', 'h-14', 'border-b-[1.5px]', 'w-[232px]', 'w-[380px]', 'md:block', 'border-r border-border', 'border-l border-border', 'min-w-0 flex-1']) assert.ok(html.includes(token), token);
  assert.equal((html.match(/data-shape="stat"/g) || []).length, 3);
  assert.match(html, /height:180px/);
  for (const rail of [true, false]) for (const inspector of [true, false]) {
    const custom = render(api.BpWorkSkeleton, { rail, inspector, header: h('header', null, '真实顶栏'), label: '正在打开李思远' });
    assert.match(custom, /<header>真实顶栏<\/header>/);
    assert.match(custom, /aria-label="正在打开李思远"/);
    assert.doesNotMatch(custom, /data-bp-work-skeleton-header/);
    assert.equal(custom.includes('data-bp-work-skeleton-rail'), rail);
    assert.equal(custom.includes('data-bp-work-skeleton-inspector'), inspector);
  }
});
test('P162 popup merges host data and class; frozen motion uses existing tokens and reduced variants', () => {
  const html = render(inline.BpWorkLayer, { ...props, popupProps: { className: 'host-layer flex flex-col', 'data-agent-preview': true, 'data-prism-theme': 'paper' } });
  const popup = html.match(/<div role="dialog"[^>]+>/)[0];
  for (const token of ['data-agent-preview="true"', 'data-prism-theme="paper"', 'host-layer', 'flex flex-col', 'data-ui-version="coss-v1"', 'origin-[50%_40%]', 'transition-[opacity,transform,scale]', 'duration-(--motion-slow)', 'data-starting-style:scale-[0.985]', 'data-ending-style:duration-(--motion-base)', 'motion-reduce:transition-opacity', 'motion-reduce:data-starting-style:scale-100', 'motion-reduce:data-ending-style:scale-100', 'motion-reduce:data-ending-style:duration-(--motion-fast)']) assert.ok(popup.includes(token), token);
  const backdrop = html.match(/<div data-test-backdrop[^>]+>/)[0];
  for (const token of ['bg-black/8', 'transition-opacity', 'data-ending-style:opacity-0', 'motion-reduce:hidden']) assert.ok(backdrop.includes(token), token);
});
function fakeScheduler(t) {
  const events = [], frames = new Map(), timers = new Map();
  t.mock.method(globalThis, 'setTimeout', (callback, delay) => { events.push(`timeout:${delay}`); timers.set(2, callback); return 2; });
  t.mock.method(globalThis, 'clearTimeout', id => timers.delete(id));
  Object.defineProperty(globalThis, 'requestAnimationFrame', { configurable: true, value: callback => { events.push('frame'); frames.set(1, callback); return 1; } });
  Object.defineProperty(globalThis, 'cancelAnimationFrame', { configurable: true, value: id => frames.delete(id) });
  t.after(() => { delete globalThis.requestAnimationFrame; delete globalThis.cancelAnimationFrame; });
  return { events, frames, timers, frame() { const callback = frames.get(1); frames.delete(1); callback?.(); }, tick() { const callback = timers.get(2); timers.delete(2); callback?.(); } };
}
test('P162 ready ordering is rAF, then timeout zero, then callback', t => {
  const clock = fakeScheduler(t);
  const cancel = api.scheduleBpWorkLayerReady(() => clock.events.push('ready'));
  assert.deepEqual(clock.events, ['frame']);
  clock.frame(); assert.deepEqual(clock.events, ['frame', 'timeout:0']);
  clock.tick(); assert.deepEqual(clock.events, ['frame', 'timeout:0', 'ready']);
  cancel();
});
for (const phase of ['before frame', 'after frame']) test(`P162 cleanup ${phase} cancels pending ready work`, t => {
  const clock = fakeScheduler(t);
  const cancel = api.scheduleBpWorkLayerReady(() => assert.fail('cancelled ready callback ran'));
  if (phase === 'after frame') clock.frame();
  cancel(); clock.frame(); clock.tick();
  assert.equal(clock.frames.size + clock.timers.size, 0);
});

const popupOf = tree => tree.props.children.props.children[1];
test('P162 lifecycle gates children, keys content only, forwards focus and clears on close/unmount', t => {
  const clock = fakeScheduler(t);
  t.after(() => hooks.reset());
  const initialFocus = { current: null }, finalFocus = () => null;
  const completions = [];
  const input = { ...props, onOpenChangeComplete: open => completions.push(open), contentKey: 1, initialFocus, finalFocus, portalProps: { keepMounted: true } };
  let tree = hooks.run(hooks.BpWorkLayer, input), popup = popupOf(tree);
  assert.equal(tree.props.children.props.keepMounted, true);
  assert.equal(popup.props.initialFocus, initialFocus);
  assert.equal(popup.props.finalFocus, finalFocus);
  assert.equal(popup.props['aria-busy'], true);
  clock.frame(); clock.tick();
  assert.deepEqual(clock.events, []);
  assert.equal(popupOf(hooks.run(hooks.BpWorkLayer, input)).props['aria-busy'], true);
  tree.props.onOpenChangeComplete(true);
  assert.deepEqual(completions, [true]);
  assert.deepEqual(clock.events, ['frame']);
  clock.frame(); clock.tick();
  popup = popupOf(hooks.run(hooks.BpWorkLayer, input));
  assert.equal(popup.props['aria-busy'], undefined);
  assert.equal(popup.props.children.props.children, props.children);
  assert.equal(popup.props.children.key, '1');
  for (const token of ['h-full', 'min-h-0', 'animate-in', 'fade-in', 'duration-(--motion-fast)']) assert.ok(popup.props.children.props.className.includes(token));
  tree = hooks.run(hooks.BpWorkLayer, { ...input, contentKey: 2 });
  assert.equal(tree.key, null);
  assert.equal(popupOf(tree).props.children.key, '2');
  assert.equal(clock.frames.size + clock.timers.size, 0);
  popup = popupOf(hooks.run(hooks.BpWorkLayer, { ...input, open: false }));
  assert.equal(popup.props.children, false);
  tree = hooks.run(hooks.BpWorkLayer, { ...input, open: false });
  tree.props.onOpenChangeComplete(false);
  assert.deepEqual(completions, [true, false]);
  tree = hooks.run(hooks.BpWorkLayer, input);
  popup = popupOf(tree);
  assert.equal(popup.props['aria-busy'], true);
  assert.equal(clock.frames.size + clock.timers.size, 0);
  tree.props.onOpenChangeComplete(true);
  clock.frame();
  hooks.run(hooks.BpWorkLayer, { ...input, open: false });
  assert.equal(clock.frames.size + clock.timers.size, 0);
  tree = hooks.run(hooks.BpWorkLayer, input);
  tree.props.onOpenChangeComplete(true);
  hooks.reset();
  assert.equal(clock.frames.size + clock.timers.size, 0);
});
