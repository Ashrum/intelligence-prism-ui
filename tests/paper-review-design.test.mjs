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
  assert.doesNotMatch(body, /aria-label="更多视图操作"/);
  assert.match(body, /aria-label="沉浸"/);
  for (const label of ['翻页', '视图', '图层', '沉浸视图']) assert.match(body, new RegExp(`aria-label="${label}"`));
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
const compiled = await build({ stdin: { contents: "export { PaperReviewDesign, StudentPanel, QuestionRail } from './examples/paper-review/paper-review'", resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false, plugins: [{ name: 'review-host-events', setup(build) {
  build.onLoad({ filter: /examples\/paper-review\/paper-review\.tsx$/ }, async args => ({ loader: 'tsx', contents: (await readFile(args.path, 'utf8'))
    .replace('import { ReviewTools } from "@/examples/review-tools/review-tools"', 'const ReviewTools = () => null')
    .replace('useEffect, useLayoutEffect, useMemo, useRef, useState,', 'useMemo,')
    .replace('const shortcuts =', `const useState = (initial: any): any => { const p = (globalThis as any).__reviewHost; const i = p.cursor++; if (!(i in p.values)) p.values[i] = initial; return [p.values[i], (v: any) => { p.values[i] = typeof v === 'function' ? v(p.values[i]) : v }]; };
const useRef = (initial: any): any => ({current:initial});
const useEffect = () => {}; const useLayoutEffect = () => {};
const shortcuts =`) }));
} }] });
await writeFile(probeFile, compiled.outputFiles[0].text);
const { PaperReviewDesign, StudentPanel, QuestionRail } = await import(probeFile);
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
  toggle().props.render.props.onPressedChange(true);
  assert.equal(frame().props['data-immersive'], true);
  pressHost('Escape'); assert.equal(frame().props['data-immersive'], false);
  pressHost('f'); assert.equal(frame().props['data-immersive'], true);
  pressHost('f'); assert.equal(frame().props['data-immersive'], false);
  assert.equal(captureHost().find(n => n.props['aria-label'] === '试卷悬浮工具条').props.orientation, 'vertical');
});
test('D7 canvas uses a paper-attached overlay instead of a separate tool column', async () => {
  const css = await readFile(new URL('../examples/paper-review/paper-review.css', import.meta.url), 'utf8');
  const canvas = css.match(/\.d1-canvas \{([^}]+)\}/)[1];
  assert.match(canvas, /grid-template-columns:minmax\(0,1fr\);/);
  assert.match(css, /\.d1-paper-column \{[^}]*gap:16px/);
  assert.match(css, /\.d1-tool-dock \{[^}]*position:absolute/);
  assert.match(css, /\.d1-tools \{[^}]*width:56px/);
  const source = await readFile(new URL('../examples/paper-review/continuous-paper-canvas.tsx', import.meta.url), 'utf8');
  assert.match(source, /node.clientWidth - 16 - 56/);
  assert.match(source, /width: columnWidth \+ 56/);
});

test('D7 toolbar has four visible groups and moves keyboard help to the top menu', () => {
  globalThis.__reviewHost = { cursor: 0, values: [] };
  const nodes = captureHost();
  const toolbar = nodes.find(n => n.props['aria-label'] === '试卷悬浮工具条');
  const children = React.Children.toArray(toolbar.props.children);
  const groups = children.filter(n => ['翻页', '视图', '图层', '沉浸视图'].includes(n.props['aria-label']));
  assert.deepEqual(groups.map(n => n.props['aria-label']), ['翻页', '视图', '图层', '沉浸视图']);
  for (const group of groups) {
    assert.match(group.props.className, /flex-col/);
    assert.ok(React.Children.toArray(group.props.children).every(n => n.type !== 'div'), 'no horizontal wrapper rows');
  }
  const labels = group => React.Children.toArray(group.props.children).map(n => n.props.label ?? n.props['aria-label']);
  assert.deepEqual(labels(groups[0]), ['上一页', '当前页', '下一页']);
  assert.deepEqual(labels(groups[1]), ['放大', '缩放比例', '缩小', '适合页面', '旋转当前页']);
  const versions = nodes.find(n => n.props['aria-label'] === '查看版本');
  assert.equal(versions.props.orientation, 'vertical');
  assert.match(versions.props.className, /flex-col/);
  assert.match(toolbar.props.className, /surface-floating/);
  assert.equal(nodes.some(n => n.props['aria-label'] === '更多视图操作'), false);
  assert.equal(groups[3].props['aria-label'], '沉浸视图');
  const help = nodes.find(n => n.props.onClick && React.Children.toArray(n.props.children).includes('快捷键表'));
  assert.ok(help); help.props.onClick();
  assert.ok(captureHost().some(n => n.props.open === true && n.props.onOpenChange));
  for (const label of ['上一页', '下一页', '放大', '缩小', '适合页面', '旋转当前页', '标注效果', '扫描原稿', '标注层', '沉浸']) {
    const control = nodes.find(n => n.props['aria-label'] === label);
    assert.match(control.props.render?.props.className ?? control.props.className, /min-h-11 min-w-11/, label);
  }
  const canvas = () => captureHost().find(n => n.props.viewportRef);
  nodes.find(n => n.props['aria-label'] === '旋转当前页').props.onClick();
  assert.equal(canvas().props.rotations.p1, 90);
  pressHost('r'); assert.equal(canvas().props.rotations.p1, 180);
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


import { dockPaperToolbar } from '../examples/paper-review/paper-toolbar-layout.ts';
test('D7 toolbar follows paper edge for width fit, page fit, overwide zoom and panning', () => {
  // 828 canvas - 16 margins - 56 toolbar = 756 paper; seam at x=764.
  assert.deepEqual(dockPaperToolbar({ canvasWidth: 828, paperRight: 8 + 756 }), { left: 764 });
  // Page fit: the 585.45 paper and 56 toolbar are centered as one spread.
  const pageWidth = 585.454545;
  const paperRight = (828 - pageWidth - 56) / 2 + pageWidth;
  assert.deepEqual(dockPaperToolbar({ canvasWidth: 828, paperRight }), { left: paperRight });
  assert.deepEqual(dockPaperToolbar({ canvasWidth: 668, paperRight: 1200 }), { left: 604 });
  assert.deepEqual(dockPaperToolbar({ canvasWidth: 668, paperRight: 580 }), { left: 580 });
  assert.deepEqual(dockPaperToolbar({ canvasWidth: 668, paperRight: -100 }), { left: 8 });
});
function railMarkup(paper, filter = false) {
  return renderToStaticMarkup(React.createElement(QuestionRail, { questions: paper, selected: 'q17', filter, missing: false, closeRef: { current: null }, onCollapse() {}, onFilter() {}, onSelect() {}, onLocate() {}, onPage() {} }));
}
test('D7 answer map renders 12 choice cells, 4 fill cells, 4 rows, and fixture-derived overview/subtotals', () => {
  const html = railMarkup(questions);
  assert.equal([...html.matchAll(/data-question-layout="cell"/g)].length, 16);
  assert.equal([...html.matchAll(/data-question-layout="row"/g)].length, 4);
  for (const q of questions) {
    assert.match(html, new RegExp(`data-question-id="${q.id}" data-question-layout="${q.number <= 16 ? 'cell' : 'row'}"`));
  }
  for (const record of studentRecords) {
    const paper = questionsForStudent(studentRecords.indexOf(record));
    const body = railMarkup(paper), text = body.replace(/<[^>]+>/g, '');
    const totals = [paper.filter(q => q.score === q.max).length, paper.filter(q => q.score > 0 && q.score < q.max).length, paper.filter(q => q.score === 0).length];
    assert.deepEqual([...body.matchAll(/data-overview-count="(\d+)"/g)].map(m => Number(m[1])), totals.filter(n => n > 0));
    assert.ok(text.includes(`满分 ${totals[0]} · 部分 ${totals[1]} · 零分 ${totals[2]}`));
    for (const type of ['选择', '填空', '解答']) {
      const group = paper.filter(q => q.type === type);
      assert.ok(text.includes(`${group.reduce((n, q) => n + q.score, 0)} / ${group.reduce((n, q) => n + q.max, 0)}`));
    }
  }
  const markers = [...html.matchAll(/data-page-marker="true">([\s\S]*?)<\/div>/g)];
  assert.equal(markers.length, 2);
  for (const marker of markers) { assert.doesNotMatch(marker[1].replace(/<[^>]+>/g, ''), /清晰/); assert.match(marker[1], /aria-label="定位第 [12] 页，清晰"/); }
  assert.doesNotMatch(html, /data-paper-thumbnail/);
});
test('D7 filtering packs wrong questions in order and hides empty type sections', () => {
  const html = railMarkup(questions, true);
  assert.deepEqual([...html.matchAll(/data-question-id="(q\d+)"/g)].map(m => m[1]), ['q8', 'q14', 'q17', 'q19']);
  const full = railMarkup(questionsForStudent(5), true);
  assert.match(full, /没有错题/);
  for (const type of ['选择', '填空', '解答']) assert.doesNotMatch(full, new RegExp(`aria-label="${type}题"`));
});
test('D7 T/button collapse persists safely, restores through immersion and exposes the expand button', () => {
  globalThis.__reviewHost = { cursor: 0, values: [] };
  const prior = globalThis.localStorage;
  const values = new Map();
  globalThis.localStorage = { setItem(k, v) { values.set(k, v); } };
  const frame = () => captureHost().find(n => n.props['data-rail-collapsed'] !== undefined);
  try {
    assert.equal(frame().props['data-rail-collapsed'], false);
    pressHost('t'); assert.equal(frame().props['data-rail-collapsed'], true);
    assert.equal(values.get('prism-paper-review-rail-collapsed'), 'true');
    assert.ok(captureHost().some(n => n.props['aria-label'] === '展开题目栏'));
    pressHost('f'); pressHost('t'); pressHost('Escape');
    assert.equal(frame().props['data-rail-collapsed'], true);
    captureHost().find(n => n.props['aria-label'] === '展开题目栏').props.onClick();
    assert.equal(frame().props['data-rail-collapsed'], false);
    globalThis.localStorage = { setItem() { throw Error('storage denied'); } };
    assert.doesNotThrow(() => pressHost('t'));
    assert.equal(frame().props['data-rail-collapsed'], true);
  } finally { globalThis.localStorage = prior; }
  const source = readFileSync(new URL('../examples/paper-review/paper-review.tsx', import.meta.url), 'utf8');
  assert.match(source, /\["T", "显示 \/ 隐藏题目栏"\]/);
});

test('D7 rail keeps numeric arrow order, Enter location, tab order and page intents after filtering', () => {
  let selected = 'q4', located = 0, page;
  const props = { questions, filter: false, missing: false, closeRef: { current: null }, onCollapse() {}, onFilter() {}, onSelect(id) { selected = id; }, onLocate() { located++; }, onPage(value) { page = value; } };
  function nodes() {
    const result = [];
    function walk(node) { if (Array.isArray(node)) return node.forEach(walk); if (!React.isValidElement(node)) return; result.push(node); React.Children.forEach(node.props.children, walk); if (node.props.render) walk(node.props.render); }
    walk(QuestionRail({ ...props, selected })); return result;
  }
  function key(key) { nodes().find(n => n.props.role === 'listbox').props.onKeyDown({ key, preventDefault() {}, stopPropagation() {} }); }
  key('ArrowDown'); assert.equal(selected, 'q5');
  key('ArrowUp'); assert.equal(selected, 'q4');
  key('Enter'); assert.equal(located, 1);
  const railKey = () => nodes().find(n => n.props.role === 'listbox').props.onKeyDown;
  railKey()({ key: 'Enter', target: { closest: selector => selector === '[data-page-marker]' ? {} : null }, preventDefault() { throw Error('page Enter must stay native'); } });
  railKey()({ key: 'Enter', target: { closest: selector => selector === '[data-question-id]' ? { dataset: { questionId: 'q6' } } : null }, preventDefault() {}, stopPropagation() {} });
  assert.equal(selected, 'q6'); assert.equal(located, 2);
  for (const node of nodes().filter(n => n.props.role === 'option')) assert.equal(node.props.tabIndex, 0);
  props.filter = true; selected = 'q8'; key('ArrowDown'); assert.equal(selected, 'q14');
  nodes().find(n => n.props['aria-label'] === '定位第 2 页，清晰').props.onClick(); assert.equal(page, 1);
  // If the first type no longer has errors, the remaining first-page type keeps its page navigation.
  props.questions = questions.map(q => q.type === '选择' ? { ...q, score: q.max } : q);
  assert.ok(nodes().some(n => n.props['aria-label'] === '定位第 1 页，清晰'));
});
