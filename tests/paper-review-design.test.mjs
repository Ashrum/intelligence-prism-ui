import test from 'node:test';
import assert from 'node:assert/strict';
import { questions, paperImage } from '../examples/paper-review/fixture.ts';

test('D1 paper, rail, rubric and total share consistent question facts', () => {
  assert.equal(questions.length, 20);
  assert.equal(questions.filter(q => q.score < q.max).length, 4);
  assert.equal(questions.reduce((sum, q) => sum + q.score, 0), 118);
  assert.equal(questions.reduce((sum, q) => sum + q.max, 0), 150);
  for (const q of questions) {
    assert.equal(q.points.reduce((sum, p) => sum + p.score, 0), q.score);
    assert.equal(q.points.reduce((sum, p) => sum + p.max, 0), q.max);
    assert.doesNotMatch(JSON.stringify(q), /示例|演示|Demo|样本/i);
  }
  const raw = decodeURIComponent(paperImage(1, '张雨桐', false));
  const marked = decodeURIComponent(paperImage(1, '张雨桐', true));
  assert.doesNotMatch(raw, /焦距关系未联立|× 6\/12/);
  assert.match(marked, /焦距关系未联立/);
  assert.match(marked, /× 6\/12/);
});

test('D1 built review route renders three panes and a single primary action without presentation labels', async () => {
  const { default: worker } = await import('../dist/server/index.js');
  const response = await worker.fetch(new Request('http://localhost/next/reviews/paper-review', { headers: { accept: 'text/html' } }), { ASSETS: { fetch: async () => new Response('Not found', { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
  assert.equal(response.status, 200);
  const html = await response.text();
  const body = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
  const text = body.replace(/<[^>]+>/g, '');
  for (const name of ['rail', 'canvas', 'inspector']) assert.match(body, new RegExp(`data-review-${name}`));
  assert.doesNotMatch(text, /示例|演示|Demo|样本/i);
  const primary = [...body.matchAll(/<button\b[^>]*class="([^"]*)"[^>]*>/g)].filter(match => /\bbg-primary\s/.test(match[1]));
  assert.equal(primary.length, 1);
  for (const label of ['试卷预览框架 · 设计稿', '张雨桐', '全部 20', '错题 4', '最终确认', '更正评分', '教师批阅', '椭圆焦距关系', '置信度', '未提供']) assert.ok(text.includes(label), label);
  assert.doesNotMatch(body, /d1-controls|返回设计评审导航|<h1[^>]*>试卷预览框架/);
  assert.match(body, /<button\b[^>]*aria-label="评审工具"/);
  assert.match(body, /<title>试卷预览框架 · 设计稿/);
  assert.match(body, /aria-label="全部题目，共 20 题"/);
  assert.match(body, /aria-label="仅看错题，共 4 题"/);
  assert.doesNotMatch(text, /20 题 · 错 4/);
  assert.match(body, /data-review-continuous/);
  assert.match(body, /data-zoom-mode="width"/);
  assert.deepEqual([...body.matchAll(/data-review-page="(\d)"/g)].map(match => match[1]), ['0', '1']);
  assert.match(body, /aria-label="试卷悬浮工具条"[^>]*aria-orientation="vertical"|aria-orientation="vertical"[^>]*aria-label="试卷悬浮工具条"/);
  assert.match(body, /data-immersive="false"/);
  assert.match(body, /aria-label="沉浸"[^>]*aria-pressed="false"|aria-pressed="false"[^>]*aria-label="沉浸"/);
  assert.match(body, /data-ui-version="coss-v1"/);
});

// Event probe follows paper-preview.test.mjs; it executes host handlers, not a browser.
// SSR above separately exercises the unmodified built route.
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const root = fileURLToPath(new URL('../', import.meta.url));
const probeFile = new URL('../.sites-runtime/paper-review-test/probe.mjs', import.meta.url);
await mkdir(new URL('.', probeFile), { recursive: true });
const compiled = await build({ stdin: { contents: "export { PaperReviewDesign } from './examples/paper-review/paper-review'", resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false, plugins: [{ name: 'review-host-events', setup(build) {
  build.onLoad({ filter: /examples\/paper-review\/paper-review\.tsx$/ }, async args => ({ loader: 'tsx', contents: (await readFile(args.path, 'utf8'))
    .replace('import { ReviewTools } from "@/examples/review-tools/review-tools"', 'const ReviewTools = () => null')
    .replace('useEffect, useLayoutEffect, useMemo, useRef, useState,', 'useMemo,')
    .replace('const shortcuts =', `const useState = (initial: any): any => { const p = (globalThis as any).__reviewHost; const i = p.cursor++; if (!(i in p.values)) p.values[i] = initial; return [p.values[i], (v: any) => { p.values[i] = typeof v === 'function' ? v(p.values[i]) : v }]; };
const useRef = (initial: any): any => ({current:initial});
const useEffect = () => {}; const useLayoutEffect = () => {};
const shortcuts =`) }));
} }] });
await writeFile(probeFile, compiled.outputFiles[0].text);
const { PaperReviewDesign } = await import(probeFile);
await rm(probeFile);
function captureHost() {
  globalThis.__reviewHost.cursor = 0;
  const nodes = [];
  function walk(node) {
    if (Array.isArray(node)) return node.map(walk);
    if (!React.isValidElement(node)) return node;
    nodes.push(node);
    React.Children.forEach(node.props.children, walk);
    return node;
  }
  function Probe() { return walk(PaperReviewDesign()); }
  renderToStaticMarkup(React.createElement(Probe));
  return nodes;
}
function pressHost(key) {
  captureHost().find(n => n.props.onKeyDownCapture).props.onKeyDownCapture({ key, target: { closest: () => null }, nativeEvent: {}, preventDefault() {}, stopPropagation() {} });
}
test('D2 host defaults to width fit and toggles fit modes with 0', () => {
  globalThis.__reviewHost = { cursor: 0, values: [] };
  const canvas = () => captureHost().find(n => n.props.viewportRef);
  assert.equal(canvas().props.zoom, 'width');
  pressHost('0'); assert.equal(canvas().props.zoom, 'page');
  pressHost('0'); assert.equal(canvas().props.zoom, 'width');
  const fit = captureHost().find(n => n.props['aria-label'] === '适合页面');
  fit.props.onClick(); assert.equal(canvas().props.zoom, 'page');
});
test('D2 immersion works with button, F and Escape and retains the vertical toolbar', () => {
  globalThis.__reviewHost = { cursor: 0, values: [] };
  const frame = () => captureHost().find(n => n.props['data-immersive'] !== undefined);
  const toggle = () => captureHost().find(n => n.props['aria-label'] === '沉浸');
  assert.equal(frame().props['data-immersive'], false);
  toggle().props.onPressedChange(true);
  assert.equal(frame().props['data-immersive'], true); assert.equal(toggle().props.pressed, true);
  pressHost('Escape'); assert.equal(frame().props['data-immersive'], false);
  pressHost('f'); assert.equal(frame().props['data-immersive'], true);
  pressHost('f'); assert.equal(frame().props['data-immersive'], false);
  assert.equal(captureHost().find(n => n.props['aria-label'] === '试卷悬浮工具条').props.orientation, 'vertical');
});
test('D2 canvas reserves a right tool column with no bottom toolbar row and compact headers', async () => {
  const css = await readFile(new URL('../examples/paper-review/paper-review.css', import.meta.url), 'utf8');
  const canvas = css.match(/\.d1-canvas \{([^}]+)\}/)[1];
  assert.match(canvas, /grid-template-columns:minmax\(0,1fr\) 72px/);
  assert.doesNotMatch(canvas, /grid-template-rows/);
  assert.match(css, /\.d1-continuous \{[^}]*padding:8px;[^}]*gap:16px/);
  assert.match(css, /\.d1-rail-header,\.d1-inspector-header \{ height:56px; min-height:56px;/);
  assert.match(css, /data-immersive="true"[^}]*\.d1-inspector \{ display:none;/);
});


test('D3 review accent stays in the review utility and the adaptive frame fills its viewport', async () => {
  const css = await readFile(new URL('../examples/review-tools/review-tools.css', import.meta.url), 'utf8');
  const theme = await readFile(new URL('../app/(next)/next/theme.css', import.meta.url), 'utf8');
  const page = await readFile(new URL('../examples/paper-review/paper-review.css', import.meta.url), 'utf8');
  assert.match(css, /\.review-tools-trigger\s*\{\s*--review-accent: #F04A1A;/);
  assert.doesNotMatch(theme + page, /--review-accent|#f04a1a/i);
  assert.match(page, /\.d1-review \{[^}]*height:100dvh;[^}]*grid-template-rows:minmax\(0,1fr\)/);
  assert.match(page, /\.d1-frame \{[^}]*height:100%;/);
  assert.doesNotMatch(page, /d1-controls/);
});
