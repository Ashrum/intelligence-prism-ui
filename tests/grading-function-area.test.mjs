import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const root = fileURLToPath(new URL('../', import.meta.url));
const directory = new URL(`../.sites-runtime/grading-function-area-${process.pid}/`, import.meta.url);
await mkdir(directory, { recursive: true });
const options = {
  stdin: { contents: `export * from './components/prism-next/demos/grading-function-area'; export { QuestionInspector } from './components/prism-next/question-inspector'; export { ScoreReview } from './components/prism-next/score-review'; export { ErrorCauseReview } from './components/prism-next/error-cause-review'; export { Button } from './components/prism-next/button';`, resolveDir: root, loader: 'tsx' },
  bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false,
};
const urlAsset = { name: 'url-asset', setup(build) {
  build.onResolve({ filter: /temml\.mjs\?url$/ }, () => ({ path: 'temml-url', namespace: 'url' }));
  build.onLoad({ filter: /.*/, namespace: 'url' }, () => ({ contents: 'export default "temml.mjs"' }));
} };
async function bundle(name, plugins = []) {
  const file = new URL(name, directory);
  await writeFile(file, (await build({ ...options, plugins: [urlAsset, ...plugins] })).outputFiles[0].text);
  return import(file);
}
const api = await bundle('ssr.mjs');
const probe = await bundle('probe.mjs', [{ name: 'host-state', setup(build) {
  build.onLoad({ filter: /demos\/grading-function-area\.tsx$/ }, async args => ({ loader: 'tsx', contents: (await readFile(args.path, 'utf8'))
    .replace('useState, useEffect, useRef, type ReactNode', 'type ReactNode')
    .replace('export const gradingFunctionAreaStates', `
const useState = <T,>(initial: T) => { const state = (globalThis as any).__functionAreaState; const index = state.index++; if (!(index in state.values)) state.values[index] = initial; return [state.values[index], (value: T) => { state.values[index] = value }] as const };
const useRef = <T,>(initial: T) => { const state = (globalThis as any).__functionAreaState; const index = state.index++; state.refs ??= []; return state.refs[index] ??= { current: initial } };
const useEffect = (effect: () => void, deps: unknown[]) => { const state = (globalThis as any).__functionAreaState; const index = state.index++; state.deps ??= []; if (!state.deps[index] || deps.some((value, position) => !Object.is(value, state.deps[index][position]))) state.effects.push(effect); state.deps[index] = deps };
export const gradingFunctionAreaStates`) }));
} }]);
await rm(directory, { recursive: true });
const h = React.createElement;
const markup = initialState => renderToStaticMarkup(h(api.GradingFunctionAreaBoard, { initialState }));
const visibleText = html => html.replace(/<[^>]*>/g, '');

test('P18 reference renders exactly eight bounded boards per theme using the four existing components', () => {
  const html = renderToStaticMarkup(h(api.GradingFunctionAreaDemo));
  assert.equal((html.match(/data-function-area-board=/g) ?? []).length, 24);
  assert.equal((html.match(/h-\[844px\] w-\[380px\] max-w-full/g) ?? []).length, 24);
  for (const theme of ['light', 'paper', 'dark']) assert.match(html, new RegExp(`data-prism-theme="${theme}" data-ui-version="coss-v1"`));
  for (const state of api.gradingFunctionAreaStates) assert.equal((html.match(new RegExp(`data-function-area-board="${state.id}"`, 'g')) ?? []).length, 3);
  assert.equal((html.match(/data-score-review-panel/g) ?? []).length, 9);
  assert.equal((html.match(/data-error-cause-review/g) ?? []).length, 6);
  assert.equal((html.match(/data-student-paper-report/g) ?? []).length, 3);
  assert.match(html, /不产生服务回执/);
});

test('P18 viewing fixtures remove irrelevant facts, place source by score, and retain literal current scores', () => {
  for (const state of ['loss', 'full', 'edited']) {
    const html = markup(state);
    assert.doesNotMatch(html, /AI 判定依据|置信度|班级对比|知识点|data-score-review-panel/);
    assert.match(html, /修改评分/); assert.match(html, /重新 AI 批阅/);
    assert.match(html, /标准答案与解析/); assert.match(html, /修改记录/);
  }
  assert.match(markup('loss'), /计算错误/);
  assert.match(markup('full'), /学生作答：B/);
  assert.doesNotMatch(markup('full'), /data-error-cause-review|修改错因/);
  assert.match(markup('edited'), /原 AI 批阅 6 分 · 作答步骤正确，AI 漏判/);
  assert.match(markup('edited'), /表达不规范/);
});

test('P18 confirm, edit and manual fixtures expose their intended actions and preserved unknown point drafts', () => {
  const confirm = markup('confirm'), edit = markup('edit'), manual = markup('manual');
  for (const html of [confirm, edit, manual]) {
    assert.doesNotMatch(html, /置信度|接受 AI 建议|恢复 AI 建议|接受建议或改分保存/);
    assert.match(html, /data-score-review-body/);
    assert.match(html, /标准答案与解析/);
  }
  assert.match(confirm, /AI 建议评分/); assert.match(confirm, /采纳 6 分 · 下一题/); assert.match(confirm, />改分</);
  assert.doesNotMatch(confirm, /教师最终评分|type="number"/);
  assert.doesNotMatch(edit, /AI 建议评分/); assert.match(edit, /原 6 分/); assert.match(edit, />取消</); assert.match(edit, /保存 8 分/);
  assert.doesNotMatch(manual, /AI 建议评分|>取消</); assert.match(manual, /AI 没能批阅这份作答/); assert.match(manual, /请给全评分点/);
  assert.match(manual, /保存 · 下一题/);
});

test('P18 paused and report fixtures preserve external states without exposing grading editors', () => {
  const paused = markup('paused'), report = markup('report');
  assert.match(paused, /本题暂停批阅/); assert.match(paused, /正在重新 AI 批阅/); assert.match(paused, /另一种外部状态/); assert.match(paused, /核对解析/);
  assert.doesNotMatch(paused, /data-score-review-panel|data-error-cause-review|修改评分/);
  assert.match(report, /data-student-paper-report/); assert.match(report, /已批 20 题 · 另有 2 题待处理/);
  assert.match(report, /定位第一道待办题/); assert.match(report, /重新 AI 批阅整卷/);
  assert.doesNotMatch(report, /data-score-review-panel|data-error-cause-review/);
});

function capture(initialState) {
  globalThis.__functionAreaState.index = 0;
  globalThis.__functionAreaState.effects = [];
  const nodes = [];
  function walk(node) {
    if (!React.isValidElement(node)) return;
    nodes.push(node); React.Children.forEach(node.props.children, walk);
    if (node.props.ref) node.props.ref.current = { focus() { globalThis.__functionAreaState.focuses?.push(node.props.role === 'region' ? `region:${node.props['data-function-area-mode']}` : `cause-entry:${node.props.disabled}`); } };
    for (const slot of ['footer', 'afterPoints']) if (node.props[slot]) walk(node.props[slot]);
  }
  function Probe() { const tree = probe.GradingFunctionAreaBoard({ initialState }); walk(tree); return tree; }
  const html = renderToStaticMarkup(h(Probe));
  globalThis.__functionAreaState.effects.forEach(effect => effect());
  return { html, nodes };
}
function button(out, label) { return out.nodes.find(node => node.type === probe.Button && node.props.children === label); }

test('P18 local edit and cancel preserve facts while save stays an intent without a simulated receipt', () => {
  globalThis.__functionAreaState = { index: 0, values: [] };
  button(capture('loss'), '修改评分').props.onClick();
  let out = capture('loss'), editor = out.nodes.find(node => node.type === probe.ScoreReview);
  assert.equal(editor.props.mode, 'edit'); assert.equal(editor.props.selectedReasonId, null);
  editor.props.onPointsChange(editor.props.points.map(point => ({ ...point, score: point.maxScore })));
  editor.props.onReasonSelect('recalculate');
  editor.props.onSave({ score: 10, reason: '按评分点重新核算' });
  out = capture('loss');
  assert.match(visibleText(out.html), /已请求保存 10 分/);
  assert.match(out.html, /data-function-area-mode="edit"/);
  assert.doesNotMatch(out.html, /已保存 10 分|你已修改/);
  out.nodes.find(node => node.type === probe.ScoreReview).props.onCancel();
  out = capture('loss'); assert.match(out.html, /data-function-area-mode="loss"/);
  assert.equal(out.nodes.find(node => node.type === probe.QuestionInspector).props.score.value, 6);
  assert.match(out.html, /原评分与修改记录保持不变/);
});

test('P18 external cause action opens the independent controlled draft; save never overwrites its fact', () => {
  globalThis.__functionAreaState = { index: 0, values: [] };
  button(capture('loss'), '修改错因').props.onClick();
  let cause = capture('loss').nodes.find(node => node.type === probe.ErrorCauseReview);
  assert.equal(cause.props.editing, true); assert.equal(cause.props.hideEditAction, true);
  cause.props.onChange({ category: 'other', explanation: '补充原因' });
  cause = capture('loss').nodes.find(node => node.type === probe.ErrorCauseReview);
  cause.props.onSave(cause.props.draft);
  cause = capture('loss').nodes.find(node => node.type === probe.ErrorCauseReview);
  assert.equal(cause.props.draft.category, 'other'); assert.equal(cause.props.value.category, 'calculation');
  assert.equal(cause.props.editing, true);
  cause.props.onCancel();
  cause = capture('loss').nodes.find(node => node.type === probe.ErrorCauseReview);
  assert.equal(cause.props.editing, false); assert.equal(cause.props.draft.category, 'calculation');
});

test('P18 focus policy skips mount and draft changes, follows scoring modes, and restores the enabled external cause action', () => {
  // Persisted refs/effects and focus spies exercise host policy, not actual browser focus.
  globalThis.__functionAreaState = { index: 0, values: [], focuses: [] };
  let out = capture('loss');
  const region = out.nodes.find(node => node.props.role === 'region');
  assert.equal(region.props.tabIndex, -1); assert.match(region.props['aria-label'], /批阅功能栏/);
  assert.deepEqual(globalThis.__functionAreaState.focuses, []);
  button(out, '修改评分').props.onClick();
  out = capture('loss'); assert.deepEqual(globalThis.__functionAreaState.focuses, ['region:edit']);
  out.nodes.find(node => node.type === probe.ScoreReview).props.onReasonChange('补充说明');
  out = capture('loss'); assert.deepEqual(globalThis.__functionAreaState.focuses, ['region:edit']);
  out.nodes.find(node => node.type === probe.ScoreReview).props.onCancel();
  out = capture('loss'); assert.deepEqual(globalThis.__functionAreaState.focuses, ['region:edit', 'region:loss']);
  button(out, '修改错因').props.onClick();
  out = capture('loss');
  assert.equal(button(out, '修改错因').props.disabled, true);
  out.nodes.find(node => node.type === probe.ErrorCauseReview).props.onCancel();
  assert.deepEqual(globalThis.__functionAreaState.focuses, ['region:edit', 'region:loss']);
  out = capture('loss');
  assert.equal(button(out, '修改错因').props.disabled, false);
  assert.deepEqual(globalThis.__functionAreaState.focuses, ['region:edit', 'region:loss', 'cause-entry:false']);
  capture('loss'); assert.equal(globalThis.__functionAreaState.focuses.length, 3);
});

test('P18 built reference route has the complete three-theme matrix', async () => {
  const { default: worker } = await import('../dist/server/index.js');
  const response = await worker.fetch(new Request('http://localhost/next/reviews/grading-function-area', { headers: { accept: 'text/html' } }), { ASSETS: { fetch: async () => new Response('Not found', { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
  assert.equal(response.status, 200);
  const html = (await response.text()).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  assert.match(html, /批阅功能栏八种状态/);
  assert.equal((html.match(/data-function-area-board=/g) ?? []).length, 24);
});
