import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const root = process.cwd();
const source = await readFile('components/prism-next/agent-mark.tsx', 'utf8');
const css = await readFile('components/prism-next/agent-conversation.css', 'utf8');
const blueprint = await readFile('app/(next)/next/blueprint.css', 'utf8');
const temp = await mkdtemp(join(tmpdir(), 'agent-mark-glyph-'));
await symlink(join(root, 'node_modules'), join(temp, 'node_modules'));
let serial = 0;
async function compile(text = source, probe = false) {
  if (probe) text = text.replace('import { useEffect, useState } from "react"', `
const useState = () => [undefined, () => {}];
const useEffect = (fn, deps) => { globalThis.__markDeps = deps; globalThis.__markCleanup = fn(); };
const setInterval = () => { globalThis.__markTimers++; return 1; };
const clearInterval = () => { globalThis.__markTimers--; };
`);
  const result = await build({ stdin: { contents: text, resolveDir: join(root, 'components/prism-next'), loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false });
  const file = join(temp, `bundle-${serial++}.mjs`);
  await writeFile(file, result.outputFiles[0].text);
  return import(pathToFileURL(file));
}
const api = await compile();
const render = (props, module = api) => renderToStaticMarkup(React.createElement(module.AgentMark, props));
function glyphChecks(module) {
  for (const [state, label] of Object.entries(module.agentMarkLabels)) for (const variant of ['Drive', 'Orbit', 'Dots']) {
    const html = render({ size: 'glyph', state, variant, startedAt: 0, endedAt: 65000 }, module);
    assert.match(html, /role="img"/);
    assert.ok(html.includes(`aria-label="${label}"`));
    assert.doesNotMatch(html, /role="status"|aria-live|已用时/);
    assert.equal(html.replace(/<[^>]*>/g, ''), '');
    assert.equal((html.match(/class="agent-mark-pixel /g) ?? []).length, 9);
    assert.equal(html.includes('agent-mark-glyph-pulse'), ['thinking', 'working'].includes(state));
  }
  assert.match(render({ size: 'glyph', label: '自定义状态' }, module), /aria-label="自定义状态"/);
  assert.match(render({ size: 'glyph' }, module), /aria-label="状态未知"/);
}
test('glyph six states and three variants: image name, no text/live region/time, active animation only', () => glyphChecks(api));
test('inline/loading SSR markup remains byte-identical to baseline', async () => {
  const { execFileSync } = await import('node:child_process');
  const original = await compile(execFileSync('git', ['show', 'bb85dd9:components/prism-next/agent-mark.tsx'], { encoding: 'utf8' }));
  for (const size of ['inline', 'loading']) for (const state of Object.keys(api.agentMarkLabels)) for (const variant of ['Drive', 'Orbit', 'Dots']) for (const label of [undefined, '宿主名称']) {
    const props = { size, state, variant, label, startedAt: 0, endedAt: 65000 };
    assert.equal(render(props), render(props, original));
  }
});
async function timerChecks(text = source) {
  const probe = await compile(text, true);
  for (const size of ['glyph', 'inline', 'loading']) {
    globalThis.__markTimers = 0;
    render({ size, state: 'working', startedAt: 0 }, probe);
    assert.equal(globalThis.__markTimers, size === 'glyph' ? 0 : 1);
    assert.ok(globalThis.__markDeps.includes(size), 'size change reruns cleanup');
    globalThis.__markCleanup?.();
    assert.equal(globalThis.__markTimers, 0);
  }
}
test('effect probe: glyph allocates no timer, other sizes retain interval and cleanup; size is dependency', () => timerChecks());
function cssChecks(text = css, bp = blueprint) {
  assert.match(text, /\[data-agent-mark\]\[data-size="glyph"\] \{ width: 16px; height: 16px; \}/);
  assert.match(text, /\[data-agent-mark\]\[data-size="glyph"\] \.agent-mark-grid \{ width: 13px; height: 13px; \}/);
  assert.match(text, /\.agent-mark-glyph-pulse \{ animation: prism-agent-pixel/);
  assert.match(text, /@media \(prefers-reduced-motion: reduce\)\s*\{\s*\[data-agent-mark\] \.agent-mark-pixel \{ animation: none !important; opacity: 1 !important;/);
  const rule = bp.split('\n').find(line => line.includes('[data-size="glyph"]'));
  assert.ok(rule?.startsWith(':is([data-prism-theme="blueprint"],[data-prism-theme="blueprint-night"])'));
  assert.ok(rule.includes('[data-agent-mark][data-size="glyph"] .agent-mark-pixel:not(:where('));
  assert.ok(rule.includes('[data-agent-preview][data-prism-theme]'));
  assert.ok(rule.includes(' *)) { border-radius:0; }'));
}
test('CSS contract: dimensions, reduce initial/live media response, blueprint-only square with nested preview exclusion', () => cssChecks());
test('rollback mutations are rejected by behavioral and CSS checks', async () => {
  for (const [before, after] of [
    ['role="img"', 'role="status"'],
    ['aria-label={text}', 'aria-label="错误名称"'],
    ['<span aria-hidden="true" className="agent-mark-grid', '<span aria-live="polite" className="agent-mark-grid'],
    ['active && delay !== null && "agent-mark-glyph-pulse"', 'true && "agent-mark-glyph-pulse"'],
  ]) {
    assert.ok(source.includes(before));
    const mutated = await compile(source.replace(before, after));
    assert.throws(() => glyphChecks(mutated));
  }
  await assert.rejects(() => timerChecks(source.replace('size === "glyph" || ', '')));
  await assert.rejects(() => timerChecks(source.replace('[size, active, startedAt, endedAt]', '[active, startedAt, endedAt]')));
  for (const [before, after] of [['width: 13px', 'width: 16px'], ['animation: none !important; opacity: 1 !important;', 'animation: none; opacity: .15;']]) {
    assert.throws(() => cssChecks(css.replace(before, after)));
  }
  assert.throws(() => cssChecks(css, blueprint.replace(' *)) { border-radius:0; }\n', ' *)) { border-radius:4px; }\n').replace(/(\[data-size="glyph"\].*)border-radius:0/, '$1border-radius:4px')));
});
