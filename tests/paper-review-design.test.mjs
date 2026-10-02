import test from 'node:test';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { questions, paperImage, studentRecords, questionsForStudent, filterStudents } from '../examples/paper-review/fixture.ts';

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
  assert.match(body, /aria-label="更多视图操作"/);
  for (const label of ['翻页', '视图', '图层']) assert.match(body, new RegExp(`aria-label="${label}"`));
  assert.equal([...body.matchAll(/data-ai-source/g)].length, 1);
  assert.equal([...body.matchAll(/class="text-score-display"/g)].length, 2);
  assert.match(body, /aria-label="选择学生，当前第 1 \/ 6 位"/);
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
const compiled = await build({ stdin: { contents: "export { PaperReviewDesign, StudentPanel } from './examples/paper-review/paper-review'", resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false, plugins: [{ name: 'review-host-events', setup(build) {
  build.onLoad({ filter: /examples\/paper-review\/paper-review\.tsx$/ }, async args => ({ loader: 'tsx', contents: (await readFile(args.path, 'utf8'))
    .replace('import { ReviewTools } from "@/examples/review-tools/review-tools"', 'const ReviewTools = () => null')
    .replace('useEffect, useLayoutEffect, useMemo, useRef, useState,', 'useMemo,')
    .replace('const shortcuts =', `const useState = (initial: any): any => { const p = (globalThis as any).__reviewHost; const i = p.cursor++; if (!(i in p.values)) p.values[i] = initial; return [p.values[i], (v: any) => { p.values[i] = typeof v === 'function' ? v(p.values[i]) : v }]; };
const useRef = (initial: any): any => ({current:initial});
const useEffect = () => {}; const useLayoutEffect = () => {};
const shortcuts =`) }));
} }] });
await writeFile(probeFile, compiled.outputFiles[0].text);
const { PaperReviewDesign, StudentPanel } = await import(probeFile);
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
  toggle().props.onClick();
  assert.equal(frame().props['data-immersive'], true);
  pressHost('Escape'); assert.equal(frame().props['data-immersive'], false);
  pressHost('f'); assert.equal(frame().props['data-immersive'], true);
  pressHost('f'); assert.equal(frame().props['data-immersive'], false);
  assert.equal(captureHost().find(n => n.props['aria-label'] === '试卷悬浮工具条').props.orientation, 'vertical');
});
test('D2 canvas reserves a right tool column with no bottom toolbar row and compact headers', async () => {
  const css = await readFile(new URL('../examples/paper-review/paper-review.css', import.meta.url), 'utf8');
  const canvas = css.match(/\.d1-canvas \{([^}]+)\}/)[1];
  assert.match(canvas, /grid-template-columns:minmax\(0,1fr\) 120px/);
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


test('D2 student records filter by name and exam ID, group by external status and preserve scoring consistency', () => {
  assert.equal(studentRecords.length, 6);
  assert.equal(new Set(studentRecords.map(s => s.score)).size, 6);
  assert.deepEqual(filterStudents('语安').map(s => s.name), ['陈语安']);
  assert.deepEqual(filterStudents('ole-st-0021').map(s => s.index), [3]);
  assert.equal(filterStudents('不存在').length, 0);
  assert.deepEqual(filterStudents('  ').map(s => s.status), ['待复核','待复核','待复核','已确认','已确认','已确认']);
  studentRecords.forEach((student, index) => {
    const paper = questionsForStudent(index);
    assert.equal(paper.reduce((sum, q) => sum + q.score, 0), student.score);
    for (const q of paper) assert.equal(q.points.reduce((sum, p) => sum + p.score, 0), q.score);
  });
  assert.deepEqual(questionsForStudent(0), questions);
});

function panelNodes(props) {
  const nodes = [];
  function walk(node) {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!React.isValidElement(node)) return;
    nodes.push(node); React.Children.forEach(node.props.children, walk);
  }
  walk(StudentPanel(props)); return nodes;
}
test('D2 student panel exposes filtering, current selection, empty result and keyboard selection', () => {
  let chosen, active = 0, query = '';
  const props = () => ({ current: 0, query, active, onSelect: index => { chosen = index; }, onActive: index => { active = index; }, onQuery: value => { query = value; } });
  const nodes = () => panelNodes(props());
  assert.equal(nodes().filter(n => n.props.role === 'option').length, 6);
  assert.equal(nodes().find(n => n.props['aria-selected']).props.id, 'student-option-0');
  nodes().find(n => n.props.id === 'student-search').props.onChange({ target: { value: '0020' } });
  assert.deepEqual(nodes().filter(n => n.props.role === 'option').map(n => n.props.id), ['student-option-2']);
  const event = key => ({ key, nativeEvent: {}, preventDefault() {}, stopPropagation() {} });
  nodes()[0].props.onKeyDown(event('Enter')); assert.equal(chosen, 2);
  query = 'not-found';
  assert.equal(nodes().find(n => n.props.role === 'status').props.children, '没有匹配的学生');
  chosen = undefined; nodes()[0].props.onKeyDown(event('Enter')); assert.equal(chosen, undefined);
  query = ''; active = 1;
  const before = globalThis.document; globalThis.document = { getElementById: () => null };
  try { nodes()[0].props.onKeyDown(event('ArrowDown')); assert.equal(active, 3); nodes()[0].props.onKeyDown(event('ArrowUp')); assert.equal(active, 1); }
  finally { globalThis.document = before; }
});

test('D2 G opens the student panel; bracket keys and panel selection share navigation behavior and retain viewing state', () => {
  globalThis.__reviewHost = { cursor: 0, values: [] };
  const panel = () => captureHost().find(n => n.type === StudentPanel);
  const canvas = () => captureHost().find(n => n.props.viewportRef);
  pressHost('0');
  pressHost(']'); assert.equal(panel().props.current, 1); assert.equal(canvas().props.zoom, 'page');
  pressHost('['); assert.equal(panel().props.current, 0);
  pressHost('['); assert.equal(panel().props.current, 0);
  pressHost('f'); assert.equal(captureHost().find(n => n.props['data-immersive'] !== undefined).props['data-immersive'], true);
  pressHost('g'); assert.equal(captureHost().find(n => n.props['data-immersive'] !== undefined).props['data-immersive'], false); assert.ok(captureHost().some(n => n.props.open === true && n.props.onOpenChange));
  panel().props.onSelect(5); assert.equal(panel().props.current, 5); assert.equal(canvas().props.zoom, 'page');
  pressHost(']'); assert.equal(panel().props.current, 5);
  pressHost('n'); // A full-score paper has no wrong question and must remain navigable.
  captureHost().find(n => n.props['aria-label'] === '上一位学生').props.onClick();
  assert.equal(panel().props.current, 4);
  const source = readFileSync(new URL('../examples/paper-review/paper-review.tsx', import.meta.url), 'utf8');
  assert.match(source, /\["G", "选择学生"\]/);
  assert.match(source, /\["\[ \/ \]", "上一位 \/ 下一位学生"\]/);
  assert.match(source, /finalFocus=\{studentTrigger\}/);
});
