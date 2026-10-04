import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const root = fileURLToPath(new URL('../', import.meta.url));
const directory = new URL(`../.sites-runtime/student-paper-report-${process.pid}/`, import.meta.url);
const file = new URL('bundle.mjs', directory);
await mkdir(directory, { recursive: true });
const bundle = await build({ stdin: { contents: `export * from './components/prism-next/student-paper-report'; export * from './components/prism-next/demos/student-paper-report'; export { Button } from './components/prism-next/button';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false });
await writeFile(file, bundle.outputFiles[0].text);
const api = await import(file);
await rm(directory, { recursive: true });
const h = React.createElement;
const render = props => renderToStaticMarkup(h(api.StudentPaperReport, props));
function capture(props) {
  const nodes = [];
  function walk(node) {
    if (!React.isValidElement(node)) return;
    nodes.push(node);
    React.Children.forEach(node.props.children, walk);
  }
  function Probe() { const tree = api.StudentPaperReport(props); walk(tree); return tree; }
  return { html: renderToStaticMarkup(h(Probe)), buttons: nodes.filter(node => node.type === api.Button) };
}

test('StudentPaperReport presents external total, four judgments, causes and named meter scale', () => {
  const html = render(api.studentPaperReportFixture);
  for (const value of ['78.5', '/ 100 分', '状态：', '待复核', '全对', '部分对', '错', '未作答', '共失 21.5 分', '3 题 · 失 10.5 分', '1 题错因未提供 · 失 3 分']) assert.ok(html.includes(value), value);
  assert.equal((html.match(/role="meter"/g) ?? []).length, 2);
  assert.match(html, /aria-valuemax="4"/);
  assert.match(html, /aria-valuenow="3"/);
  assert.match(html, /aria-label="条件分析不完整，3 题，失 10.5 分；条形上限 4 题"/);
  assert.doesNotMatch(html, /data-report-coverage/);
});

test('StudentPaperReport unknown facts remain unknown rather than zero or a completion claim', () => {
  const html = render({});
  for (const text of ['学生：未提供', '统计范围：未提供', '待办题数：未提供', '失分总量：未提供']) assert.ok(html.includes(text), text);
  assert.equal((html.match(/<dd[^>]*>未提供<\/dd>/g) ?? []).length, 4);
  assert.doesNotMatch(html, /role="meter"|本卷没有失分|已批完|共失 0 分|定位第一道待办题/);
  assert.match(html, /来源：AI/);
  assert.match(html, /data-ai-source/);
});

test('StudentPaperReport partial coverage and supplied totals are not recomputed from counts or causes', () => {
  const html = render({ ...api.studentPaperReportPartialFixture, provided: 7, totalLost: 19, score: 11, counts: { full: 1, partial: 2, unprovided: 13 } });
  for (const text of ['仅统计已提供的 7 题', '已提供题目共失 19 分', '另有 13 题未提供', '1 题 · 失 2 分', '分布量值未提供']) assert.ok(html.includes(text), text);
  assert.match(html, /class="text-score-display">11<\/span>/);
  assert.equal((html.match(/<dd[^>]*>未提供<\/dd>/g) ?? []).length, 2);
  assert.doesNotMatch(html, /仅统计已提供的 3 题|role="meter"/);
});

test('StudentPaperReport preserves real zero, with absence of causes distinct from a no-loss declaration', () => {
  const props = { score: 0, maxScore: 100, counts: { full: 0, partial: 0, wrong: 0, unanswered: 0 }, complete: false, provided: 0, totalLost: 0, pendingCount: 0 };
  const html = render(props);
  assert.match(html, /class="text-score-display">0<\/span>/);
  assert.equal((html.match(/<dd[^>]*>0<\/dd>/g) ?? []).length, 4);
  for (const text of ['仅统计已提供的 0 题', '已提供题目共失 0 分', '待办 0 题']) assert.ok(html.includes(text), text);
  assert.doesNotMatch(html, /本卷没有失分|定位第一道待办题/);
  assert.match(render({ ...props, complete: true, causesEmptyText: '本卷没有失分' }), /本卷没有失分/);
  const zeroMeter = render({ causes: [{ id: 'zero', category: '宿主提供的零值分类', count: 0, lost: 0, meter: { value: 0, max: 7, label: '零值分类，0 题，量表上限 7 题' } }] });
  assert.match(zeroMeter, /role="meter"/);
  assert.match(zeroMeter, /aria-valuenow="0"/);
  assert.match(zeroMeter, /aria-valuemax="7"/);
});

test('StudentPaperReport invalid or absent numeric facts do not become misleading meters', () => {
  const html = render({ score: NaN, maxScore: Infinity, counts: { full: -1, partial: 1.5, wrong: NaN, unanswered: Infinity }, causes: [
    { id: 'unknown', category: '数量缺失' },
    { id: 'empty', category: '分母为零', count: 3, lost: 8, meter: { value: 0, max: 0, label: '无效量表' } },
    { id: 'over', category: '量值越界', count: 1, lost: 1, meter: { value: 6, max: 5, label: '越界量表' } },
    { id: 'label', category: '名称缺失', count: 1, lost: 1, meter: { value: 1, max: 5, label: ' ' } },
  ] });
  assert.equal((html.match(/<dd[^>]*>未提供<\/dd>/g) ?? []).length, 4);
  assert.equal((html.match(/分布量值未提供/g) ?? []).length, 4);
  assert.doesNotMatch(html, /role="meter"|>NaN|>Infinity/);
  assert.match(html, /未提供 题 · 失 未提供 分/);
});

test('StudentPaperReport locating emits one intent and does not mutate supplied report facts', () => {
  let requests = 0;
  const props = { ...api.studentPaperReportFixture, onFirstPending: () => { requests += 1; } };
  const out = capture(props);
  assert.equal(out.buttons.length, 1);
  assert.equal(out.buttons[0].props.disabled, false);
  assert.equal(out.buttons[0].props.children, '定位第一道待办题');
  out.buttons[0].props.onClick();
  assert.equal(requests, 1);
  assert.equal(capture(props).html, out.html);
  assert.equal(props.pendingCount, 2);
  assert.equal(props.score, 78.5);
});

test('StudentPaperReport disabled and missing callbacks retain visible, associated reasons and emit nothing', () => {
  let requests = 0;
  const props = { pendingCount: 2, onFirstPending: () => { requests += 1; }, firstPendingDisabledReason: '原始作答尚未提供。' };
  const out = capture(props);
  assert.equal(out.buttons[0].props.disabled, true);
  const reasonId = out.buttons[0].props['aria-describedby'];
  assert.ok(reasonId);
  assert.ok(out.html.includes(`id="${reasonId}"`));
  assert.match(out.html, /原始作答尚未提供。/);
  out.buttons[0].props.onClick();
  assert.equal(requests, 0);
  const missing = capture({ pendingCount: 1 });
  assert.equal(missing.buttons[0].props.disabled, true);
  assert.match(missing.html, /定位操作未提供。/);
  missing.buttons[0].props.onClick();
});

test('StudentPaperReport accepts explicit coverage, pending copy, AI source, formula and footer without inventing content', () => {
  const html = render({ coverageText: '仅统计本次提供的第 1 至 3 题', pendingText: '两道题需要核对原始作答', analysisSource: '教师提供的 AI 分析记录', analysis: h('math', {}, h('mi', {}, 'x')), footer: h('a', { href: '#source' }, '查看宿主说明'), causesEmptyText: '尚未收到归因清单' });
  for (const text of ['仅统计本次提供的第 1 至 3 题', '两道题需要核对原始作答', '来源：教师提供的 AI 分析记录', '尚未收到归因清单', 'href="#source"', '查看宿主说明']) assert.ok(html.includes(text), text);
  assert.match(html, /<math><mi>x<\/mi><\/math>/);
  assert.equal((html.match(/data-ai-source/g) ?? []).length, 1);
  assert.match(html, /var\(--brand-ai-gradient\)/);
  assert.doesNotMatch(html, /统计范围：未提供|定位第一道待办题/);
  const blank = render({ studentName: ' ', status: '', analysis: '\n ', analysisSource: '' });
  assert.match(blank, /学生：未提供/);
  assert.match(blank, /来源：未提供/);
});

test('StudentPaperReport demo contains three themes, narrow fixtures, long Chinese, formula and main report states', () => {
  const html = renderToStaticMarkup(h(api.StudentPaperReportDemo));
  for (const theme of ['light', 'paper', 'dark']) assert.equal((html.match(new RegExp(`data-prism-theme="${theme}"`, 'g')) ?? []).length, 3);
  assert.equal((html.match(/data-ui-version="coss-v1"/g) ?? []).length, 9);
  for (const text of ['w-80', '仅统计已提供的 3 题', '本卷没有失分', '统计范围：未提供', '未完整说明参数范围与等价变形成立的前提条件']) assert.ok(html.includes(text), text);
  assert.match(html, /<math>/);
});
