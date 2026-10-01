import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { componentGroups } from '../lib/prism-next/catalog.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const dir = new URL('../.sites-runtime/stepper-test/', import.meta.url);
await mkdir(dir, { recursive: true });
const options = { stdin: { contents: `export * from './components/prism-next/stepper'; export * from './components/prism-next/demos/stepper';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false };
const file = new URL('bundle.mjs', dir), probe = new URL('probe.mjs', dir);
await writeFile(file, (await build(options)).outputFiles[0].text);
const api = await import(file);
// Execute the real resize/reveal effect with simulated DOM geometry; not browser QA.
await writeFile(probe, (await build({ ...options, plugins: [{ name: 'stepper-effects', setup(build) {
  build.onLoad({ filter: /prism-next\/stepper\.tsx$/ }, async args => ({ loader: 'tsx', contents: (await readFile(args.path, 'utf8'))
    .replace('import { useEffect, useRef } from "react"', `const useRef = () => ({ current: (globalThis as any).__stepper.refs.shift() });
const useEffect = (effect: () => void, deps: unknown[]) => { (globalThis as any).__stepper.effect = effect; (globalThis as any).__stepper.deps = deps; };`) }));
} }] })).outputFiles[0].text);
const effects = await import(probe);
await rm(file); await rm(probe);
const h = React.createElement;
const html = (steps, props = {}) => render(h(api.Stepper, { steps, ...props }));

test('navigation catalog registers Stepper once; demo contains 1/3/5, 3/8 steps and three themes', () => {
  const entries = componentGroups.flatMap(group => group.items);
  assert.equal(entries.filter(entry => entry.id === 'stepper').length, 1);
  assert.ok(componentGroups.find(group => group.id === 'navigation').items.some(entry => entry.id === 'stepper'));
  const markup = render(h(api.StepperDemo));
  for (const n of [1, 3, 5]) assert.match(markup, new RegExp(`当前第 ${n} 步`));
  for (const theme of ['light', 'paper', 'dark']) assert.ok(markup.includes(`data-prism-theme="${theme}"`));
  for (const text of ['320px', '准备试卷原卷、标准答案与评分依据', '共 8 步', '第 2 / 3 步']) assert.ok(markup.includes(text));
  assert.match(markup, /<math>/);
});

test('explicit state renders ordinal, SR vocabulary, check/alert icons, and only one current', () => {
  const states = ['done', 'pending', 'current', 'upcoming', 'blocked', 'error'];
  const markup = html(states.map((state, index) => ({ id: `${index}`, label: `步骤 ${index + 1}`, state, description: index === 4 ? '模板不匹配' : undefined })));
  assert.match(markup, /<nav aria-label="流程阶段"/);
  assert.match(markup, /<ol/);
  assert.equal((markup.match(/aria-current="step"/g) || []).length, 1);
  for (const [index, label] of ['已完成', '待完成', '当前阶段', '后续阶段', '受阻', '受阻'].entries()) assert.ok(markup.includes(`第 ${index + 1} 步，${label}`));
  assert.match(markup, /lucide-check/);
  assert.equal((markup.match(/lucide-circle-alert/g) || []).length, 2);
  assert.match(markup, /模板不匹配/);
  assert.doesNotMatch(markup, /<button|<a\s/);
  const pending = markup.match(/<li[^>]*data-step-state="pending"[\s\S]*?<\/li>/)[0];
  assert.doesNotMatch(pending, /aria-current|lucide-check/);
  assert.match(pending, /aria-hidden="true" class="text-ui-hint">待完成/);
  assert.equal((markup.match(/data-complete="true"/g) || []).length, 1);
  assert.equal((markup.match(/data-complete="false"/g) || []).length, 4);
});

test('new host snapshots change position without inferring pending completion; absent current remains unknown', () => {
  for (const [key, n] of [['first', 1], ['third', 3], ['fifth', 5]]) assert.ok(html(api.stepperFixtures[key]).includes(`第 ${n} / 6 步`));
  const pending = html(api.stepperFixtures.pending);
  assert.equal((pending.match(/data-step-state="done"/g) || []).length, 1);
  const blocked = html(api.stepperFixtures.blocked);
  assert.match(blocked, /受阻/); assert.match(blocked, /答题区域无法匹配/);
  const unknown = html([{ id: 'a', label: '阶段', state: 'blocked' }]);
  assert.doesNotMatch(unknown, /aria-current=/);
  assert.match(unknown, /未提供当前阶段/);
  assert.match(html([]), /共 0 步/);
});

test('named horizontal region is focusable; vertical retains list without horizontal tab stop', () => {
  const markup = html(api.stepperFixtures.third, { 'aria-label': '数学批阅阶段' });
  assert.match(markup, /aria-label="数学批阅阶段"/);
  assert.match(markup, /tabindex="0" role="region" aria-label="数学批阅阶段完整步骤，可横向滚动"/);
  const vertical = html(api.stepperFixtures.pending, { orientation: 'vertical' });
  assert.match(vertical, /data-orientation="vertical"/);
  assert.doesNotMatch(vertical, /tabindex=|role="region"/);
  assert.equal((vertical.match(/<li /g) || []).length, 6);
});

function fixture(t, { orientation = 'horizontal', active = true, observer = true } = {}) {
  let left = 650, right = 794, viewportRight = 320, callback;
  const requests = [], observed = [];
  const target = { getBoundingClientRect: () => ({ left, right }) };
  const content = { querySelector: selector => { assert.equal(selector, '[aria-current="step"] [data-step-content]'); return active ? target : null; } };
  const container = { scrollLeft: 0, getBoundingClientRect: () => ({ left: 0, right: viewportRight }), scrollTo: request => requests.push(request) };
  const original = globalThis.ResizeObserver;
  let disconnected = false;
  if (observer) globalThis.ResizeObserver = class {
    constructor(fn) { callback = fn; }
    observe(node) { observed.push(node); }
    disconnect() { disconnected = true; }
  };
  else delete globalThis.ResizeObserver;
  t.after(() => { if (original === undefined) delete globalThis.ResizeObserver; else globalThis.ResizeObserver = original; delete globalThis.__stepper; });
  globalThis.__stepper = { refs: [container, content] };
  render(h(effects.Stepper, { steps: api.stepperFixtures.third, orientation }));
  const cleanup = globalThis.__stepper.effect();
  return { requests, observed, container, content, resize: (l, r, width = 320) => { left = l; right = r; viewportRight = width; callback(); }, cleanup, disconnected: () => disconnected };
}

test('320px reveal scrolls only local viewport instantly, reacts to resize and releases observer', t => {
  const f = fixture(t);
  assert.deepEqual(f.requests, [{ left: 474, behavior: 'instant' }]);
  assert.deepEqual(f.observed, [f.container, f.content]);
  f.resize(50, 194); assert.equal(f.requests.length, 1); // already visible
  f.container.scrollLeft = 474;
  f.resize(-150, -6); assert.deepEqual(f.requests.at(-1), { left: 324, behavior: 'instant' });
  f.resize(190, 334, 240); assert.deepEqual(f.requests.at(-1), { left: 568, behavior: 'instant' });
  f.cleanup(); assert.equal(f.disconnected(), true);
});

test('vertical and missing current never invent a scroll target; no observer still reveals once', async t => {
  await t.test('vertical', t => { const f = fixture(t, { orientation: 'vertical' }); assert.deepEqual(f.requests, []); assert.deepEqual(f.observed, []); });
  await t.test('unknown', t => { const f = fixture(t, { active: false }); assert.deepEqual(f.requests, []); f.cleanup(); });
  await t.test('observer unavailable', t => { const f = fixture(t, { observer: false }); assert.equal(f.requests.length, 1); assert.equal(f.cleanup, undefined); });
});

test('compact retains visible summary, full blocked facts, and horizontal accessibility; vertical stays unchanged', () => {
  const props = { compact: true, currentStepId: 'stage-5' };
  const out = html(api.stepperFixtures.blocked, props);
  assert.match(out, /data-compact="true"/); assert.match(out, /第 5 \/ 6 步/);
  assert.match(out, /<p class="mb-3 break-words text-ui-hint" data-step-summary/);
  assert.equal((out.match(/aria-current="step"/g) || []).length, 1);
  assert.equal((out.match(/<li /g) || []).length, 6);
  assert.match(out, /当前阶段 · 受阻/); assert.match(out, /tabindex="0"/);
  assert.doesNotMatch(out, /<button|<a\s/);
  const unknown = html(api.stepperFixtures.blocked, { compact: true, currentStepId: 'missing' });
  assert.match(unknown, /未提供当前阶段/); assert.doesNotMatch(unknown, /aria-current=/);
  assert.equal(html(api.stepperFixtures.pending, { compact: true, orientation: 'vertical' }), html(api.stepperFixtures.pending, { orientation: 'vertical' }));
});
