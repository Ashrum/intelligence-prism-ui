import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createTestRuntime } from './helpers/test-runtime.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = 'components/prism-next/blueprint/blueprint.tsx';
const motionSource = 'components/prism-next/blueprint/motion.tsx';
const runtime = await createTestRuntime('p149');
const h = React.createElement;
const render = (component, props) => renderToStaticMarkup(h(component, props));
async function bundle(name, plugins = [], extra = '') {
  const output = await build({ stdin: { contents: `export * from './${source}'; ${extra}`, loader: 'tsx', resolveDir: root }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, write: false, plugins });
  const url = new URL(`${name}.mjs`, runtime);
  writeFileSync(url, output.outputFiles[0].text);
  return import(url);
}
const before = await bundle('before', [{ name: 'baseline-72aad43', setup(b) {
  b.onLoad({ filter: /prism-next\/blueprint\/.*\.tsx$/ }, args => ({ contents: execFileSync('git', ['show', `72aad43:${args.path.slice(root.length)}`], { cwd: root, encoding: 'utf8' }), loader: 'tsx' }));
} }]);
const after = await bundle('after');
const cases = [
  // BpButton 样式在 P150 迁入组件，由 tests/p150-button-states.test.mjs 覆盖。
  ['BpToast', { children: '已保存' }],
  ['BpStat', { label: '得分率', value: '76.0', unit: '%', caption: '有效 45 人' }],
  ['BpStat', { label: '得分率', value: '76.0', size: 'metric', children: h('i', null, '构成条') }],
  ['BpSizeBar', { rows: [{ id: 'a', label: '已处理', total: 45, segments: [{ id: 'done', label: '完成', value: 18, fill: 'ai' }, { id: 'rest', label: '剩余', value: 27, fill: 'hatch-ai' }] }] }],
  ['BpSteps', { steps: [{ id: 'a', label: '接收' }, { id: 'b', label: '识别' }], current: 1 }],
];
// Minimal hook host: execute the actual hook with state/effect cleanup and Node fake timers.
const hookHost = `
let slots=[], cursor=0, effects=[], dirty=false, hook, args, value;
export function useState(initial) { const i=cursor++; if (!slots[i]) slots[i]={value:initial}; return [slots[i].value, next=>{ slots[i].value=typeof next==='function'?next(slots[i].value):next; dirty=true; }]; }
export function useRef(initial) { const i=cursor++; return slots[i]??(slots[i]={current:initial}); }
export function useEffect(fn,deps) { const i=cursor++; const old=slots[i]; if (!old || deps.some((v,j)=>!Object.is(v,old.deps[j]))) effects.push(()=>{old?.cleanup?.(); slots[i]={deps,cleanup:fn()};}); }
export function run(fn,...input) { hook=fn; args=input; return flush(); }
export function flush() { do { dirty=false; cursor=0; value=hook(...args); const pending=effects; effects=[]; pending.forEach(fn=>fn()); } while(dirty); return value; }
export function reset() { slots.forEach(slot=>slot.cleanup?.()); slots=[]; effects=[]; }
`;
const hooks = await bundle('hooks', [{ name: 'hook-host', setup(b) {
  b.onResolve({ filter: /^p149-hook-host$/ }, () => ({ path: 'host', namespace: 'p149' }));
  b.onLoad({ filter: /.*/, namespace: 'p149' }, () => ({ contents: hookHost, loader: 'js' }));
  b.onLoad({ filter: /blueprint\/motion\.tsx$/ }, () => ({ contents: readFileSync(new URL(`../${motionSource}`, import.meta.url), 'utf8').replace('import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"', 'import { useEffect, useRef, useState } from "p149-hook-host"; import type { CSSProperties, ReactNode } from "react"'), loader: 'tsx' }));
} }], 'export { run, flush, reset } from "p149-hook-host";');

for (const theme of ['light', 'paper', 'dark', 'blueprint', 'blueprint-night']) test(`P149 ${theme}: existing SSR bytes equal 72aad43`, () => {
  for (const [name, props] of cases) assert.equal(renderToStaticMarkup(h('div', { 'data-prism-theme': theme }, h(after[name], props))), renderToStaticMarkup(h('div', { 'data-prism-theme': theme }, h(before[name], props))), name);
});
test('P149 motion tokens and frozen stylesheet boundaries', () => {
  const css = readFileSync(new URL('../app/(next)/next/motion.css', import.meta.url), 'utf8');
  for (const [name, value] of [['fast', '120'], ['base', '200'], ['slow', '320']]) assert.match(css, new RegExp(`--motion-${name}: ${value}ms`));
  for (const name of ['work-line', 'countdown', 'caret']) assert.match(css, new RegExp(`--animate-bp-${name}:`));
  assert.match(css, /--ease-bp: cubic-bezier\(0.2, 0, 0, 1\)/);
  const baseTheme = execFileSync('git', ['show', '72aad43:app/(next)/next/theme.css'], { encoding: 'utf8' });
  assert.equal(readFileSync(new URL('../app/(next)/next/theme.css', import.meta.url), 'utf8'), baseTheme.replace('@import "./typography.css";', '@import "./typography.css";\n@import "./motion.css";'));
  // 覆盖层不承载动效令牌（P150 起按钮规则迁入组件，覆盖层不再与 72aad43 全文相等）。
  const overlay = readFileSync(new URL('../app/(next)/next/blueprint.css', import.meta.url), 'utf8');
  assert.doesNotMatch(overlay, /--motion-(fast|base|slow)\s*:|--ease-bp\s*:|@keyframes bp-(work-line|countdown|caret)/);
});
test('P149 static skeletons and three working tiers expose only supplied facts', () => {
  for (const shape of ['line', 'block', 'stat', 'row']) {
    const html = render(after.BpSkeleton, { shape });
    assert.match(html, /aria-hidden="true"/); assert.doesNotMatch(html, /animate-|rounded|(?<![-\w])border(?!\/)/); assert.match(html, /bg-border\/50/);
  }
  for (const tier of ['short', 'mid', 'long']) {
    const html = render(after.BpWorking, { tier, step: '正在批阅', done: 18, total: 45 });
    assert.match(html, /role="status" aria-live="polite"/); assert.match(html, /bp-work-line/);
    if (tier === 'short') assert.doesNotMatch(html, /class="bp-working[^"<>]*\bborder\b|bp-working-progress/);
    else { assert.match(html, /border/); assert.match(html, /bp-working-progress/); assert.match(html, /hatch-blue/); }
    if (tier === 'long') assert.match(html, /可以离开这一页/);
  }
  assert.doesNotMatch(render(after.BpWorking, { tier: 'mid', step: '正在批阅' }), /bp-working-progress|NaN|undefined/);
  assert.match(render(after.BpWorking, { tier: 'mid', step: '正在批阅', eta: '宿主估计' }), /宿主估计/);
});
test('P149 undo toast and caret SSR accessibility and reduced motion', () => {
  const html = render(after.BpUndoToast, { children: '已删除', duration: 1234, action: h('button', null, '撤销') });
  assert.match(html, /role="status"/); assert.match(html, /animate-bp-countdown/); assert.match(html, /animation-duration:1234ms/); assert.match(html, /motion-reduce:hidden/);
  assert.match(render(after.BpCaret), /aria-hidden="true"/); assert.match(render(after.BpCaret), /motion-reduce:animate-none/);
  function PendingSSR() { return String(after.useBpPending(true)); }
  assert.equal(render(PendingSSR), 'false');
});

test('P149 useBpPending: 400ms delay, 300ms minimum, quick completion, restart and cleanup', t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 0 });
  try {
    assert.equal(hooks.run(hooks.useBpPending, true), false);
    t.mock.timers.tick(399); assert.equal(hooks.flush(), false);
    t.mock.timers.tick(1); assert.equal(hooks.flush(), true);
    assert.equal(hooks.run(hooks.useBpPending, false), true);
    t.mock.timers.tick(299); assert.equal(hooks.flush(), true);
    t.mock.timers.tick(1); assert.equal(hooks.flush(), false);
    hooks.reset();
    hooks.run(hooks.useBpPending, true); t.mock.timers.tick(200);
    hooks.run(hooks.useBpPending, false); t.mock.timers.tick(500); assert.equal(hooks.flush(), false);
    hooks.reset();
    hooks.run(hooks.useBpPending, true); t.mock.timers.tick(400); hooks.flush();
    hooks.run(hooks.useBpPending, false); t.mock.timers.tick(100);
    hooks.run(hooks.useBpPending, true); t.mock.timers.tick(500); assert.equal(hooks.flush(), true);
    hooks.run(hooks.useBpPending, false); t.mock.timers.tick(0); assert.equal(hooks.flush(), false);
  } finally { hooks.reset(); }
});

test('P149 reduced-motion undo expiry pauses across hover + focus and cleans up', t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 0 });
  let listener, calls = 0;
  const previous = globalThis.window;
  globalThis.window = { matchMedia: () => ({ matches: true, addEventListener(_, fn) { listener = fn; }, removeEventListener() { listener = undefined; } }) };
  try {
    let toast = hooks.run(hooks.BpUndoToast, { children: '已删除', onExpire: () => calls++ });
    t.mock.timers.tick(2000);
    toast.props.onMouseEnter(); toast = hooks.flush();
    toast.props.onFocusCapture(); toast = hooks.flush();
    t.mock.timers.tick(9000); assert.equal(calls, 0);
    toast.props.onMouseLeave(); toast = hooks.flush();
    t.mock.timers.tick(9000); assert.equal(calls, 0);
    toast.props.onBlurCapture({ currentTarget: { contains: () => false }, relatedTarget: null }); hooks.flush();
    t.mock.timers.tick(3999); assert.equal(calls, 0);
    t.mock.timers.tick(1); assert.equal(calls, 1);
    t.mock.timers.tick(6000); assert.equal(calls, 1);
    hooks.reset(); assert.equal(listener, undefined);
  } finally { hooks.reset(); globalThis.window = previous; }
});

test('P149 preference changes preserve remaining undo time; normal mode expires only on animationend', t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 0 });
  let listener, calls = 0;
  const media = { matches: false, addEventListener(_, fn) { listener = fn; }, removeEventListener() {} };
  const previous = globalThis.window;
  globalThis.window = { matchMedia: () => media };
  try {
    let toast = hooks.run(hooks.BpUndoToast, { children: '已删除', onExpire: () => calls++ });
    t.mock.timers.tick(1000); assert.equal(calls, 0);
    media.matches = true; listener(); hooks.flush();
    t.mock.timers.tick(2000); assert.equal(calls, 0);
    media.matches = false; listener(); toast = hooks.flush();
    t.mock.timers.tick(1000); assert.equal(calls, 0);
    media.matches = true; listener(); hooks.flush();
    t.mock.timers.tick(1999); assert.equal(calls, 0);
    t.mock.timers.tick(1); assert.equal(calls, 1);
    hooks.reset(); media.matches = false;
    toast = hooks.run(hooks.BpUndoToast, { children: '已删除', onExpire: () => calls++ });
    t.mock.timers.tick(6000); assert.equal(calls, 1);
    const bar = toast.props.children[1].props.children;
    const node = {};
    bar.props.onAnimationEnd({ target: node, currentTarget: node, animationName: 'bp-countdown' });
    bar.props.onAnimationEnd({ target: node, currentTarget: node, animationName: 'bp-countdown' });
    assert.equal(calls, 2);
  } finally { hooks.reset(); globalThis.window = previous; }
});
