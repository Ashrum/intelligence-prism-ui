import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';

const root = fileURLToPath(new URL('../', import.meta.url));
const dir = new URL('../.sites-runtime/stepper-current-test/', import.meta.url);
await mkdir(dir, { recursive: true });
const file = new URL('probe.mjs', dir);
const result = await build({ stdin: { contents: `export * from './components/prism-next/stepper'; export * from './components/prism-next/demos/stepper';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false, plugins: [{ name: 'capture-effect', setup(build) {
  build.onLoad({ filter: /prism-next\/stepper\.tsx$/ }, async args => ({ loader: 'tsx', contents: (await readFile(args.path, 'utf8')).replace('import { useEffect, useRef } from "react"', `const useRef = () => ({ current: (globalThis as any).__stepperFix?.refs.shift() ?? null });
const useEffect = (effect: () => void, deps: unknown[]) => { if ((globalThis as any).__stepperFix) Object.assign((globalThis as any).__stepperFix, { effect, deps }); };`) }));
} }] });
await writeFile(file, result.outputFiles[0].text);
const api = await import(file);
await rm(file);
const html = props => render(React.createElement(api.Stepper, props));
const items = markup => [...markup.matchAll(/<li\b[^>]*>[\s\S]*?<\/li>/g)].map(match => match[0]);
const currentItems = markup => items(markup).filter(item => item.includes('aria-current="step"'));

test('S46 is fifth and blocked in both the fixture and rendered demo; error composes too', () => {
  for (const state of ['blocked', 'error']) {
    const steps = api.stepperFixtures.blocked.map(step => step.id === 'stage-5' ? { ...step, state } : step);
    const markup = html({ steps, currentStepId: 'stage-5' });
    assert.match(markup, /第 5 \/ 6 步 · AI 批阅/);
    assert.equal(currentItems(markup).length, 1);
    assert.match(currentItems(markup)[0], /当前阶段 · 受阻/);
    assert.match(currentItems(markup)[0], /lucide-circle-alert/);
    assert.match(currentItems(markup)[0], /sr-only">第 5 步，当前阶段 · 受阻/);
    assert.match(currentItems(markup)[0], /text-item-title">AI 批阅/);
  }
  assert.match(render(React.createElement(api.StepperDemo)), /第 5 \/ 6 步 · AI 批阅/);
  assert.equal(api.stepperFixtures.blocked[3].state, 'done');
});

test('explicit position overrides legacy current; unmatched and empty IDs remain unknown', () => {
  const steps = api.stepperFixtures.pending;
  const markup = html({ steps, currentStepId: 'stage-2' });
  assert.match(markup, /第 2 \/ 6 步 · 准备资料/);
  assert.match(currentItems(markup)[0], /当前阶段 · 待完成/);
  assert.doesNotMatch(items(markup)[2], /aria-current|当前阶段|text-item-title/);
  assert.match(items(markup)[2], /后续阶段/);
  assert.equal(currentItems(markup).length, 1);
  assert.match(html({ steps }), /第 3 \/ 6 步/);
  for (const currentStepId of ['missing', '']) {
    const unknown = html({ steps, currentStepId });
    assert.match(unknown, /未提供当前阶段/);
    assert.equal(currentItems(unknown).length, 0);
    assert.doesNotMatch(unknown, /第 3 步，当前阶段/);
  }
});

test('ordinary status is SR-only; completed mark has only a check; full descriptions survive clamping', () => {
  const rendered = items(html({ steps: api.stepperFixtures.blocked, currentStepId: 'stage-5' }));
  for (const index of [0, 1, 2, 3, 5]) assert.doesNotMatch(rendered[index], /<p aria-hidden="true"/);
  const doneMark = rendered[0].match(/<span data-step-marker[\s\S]*?<\/span>/)[0];
  assert.match(doneMark, /lucide-check/);
  assert.doesNotMatch(doneMark.replace(/<[^>]*>/g, ''), /\d/);
  assert.match(rendered[4], /title="答题区域无法匹配，请检查试卷模板" class="line-clamp-2/);
  assert.match(rendered[4], /class="sr-only">答题区域无法匹配，请检查试卷模板/);
});

test('changing only currentStepId changes the actual reveal target and effect dependencies', t => {
  const original = globalThis.ResizeObserver;
  delete globalThis.ResizeObserver;
  t.after(() => { delete globalThis.__stepperFix; if (original !== undefined) globalThis.ResizeObserver = original; });
  const steps = api.stepperFixtures.blocked;
  let previousDeps;
  for (const [currentStepId, ordinal] of [['stage-5', 5], ['stage-6', 6], ['missing', null]]) {
    let markup;
    const requests = [];
    const content = { querySelector(selector) {
      assert.equal(selector, '[aria-current="step"] [data-step-content]');
      const active = currentItems(markup);
      if (!active.length) return null;
      assert.match(active[0], new RegExp(`第 ${ordinal} 步，`));
      return { getBoundingClientRect: () => ({ left: ordinal * 100, right: ordinal * 100 + 144 }) };
    } };
    const viewport = { scrollLeft: 0, getBoundingClientRect: () => ({ left: 0, right: 320 }), scrollTo: request => requests.push(request) };
    globalThis.__stepperFix = { refs: [viewport, content] };
    markup = html({ steps, currentStepId });
    const { effect, deps } = globalThis.__stepperFix;
    effect();
    assert.deepEqual(requests, ordinal ? [{ left: ordinal * 100 + 144 - 320, behavior: 'instant' }] : []);
    if (previousDeps) assert.notDeepEqual(deps, previousDeps);
    previousDeps = deps;
  }
});
