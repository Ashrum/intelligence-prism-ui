import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { sampleTask, parsingReducer } from '../examples/teacher-use-cases/parsing-model.ts';
import { agentProgressLabels } from '../lib/prism-next/agent-progress.ts';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';

const root = fileURLToPath(new URL('../', import.meta.url));
const file = new URL('../.sites-runtime/agent-semantics-test.mjs', import.meta.url);
await mkdir(new URL('../.sites-runtime/', import.meta.url), { recursive: true });
const bundle = await build({ stdin: { contents: `export * from './components/prism-next/agent-semantic-components';export {AgentTaskProgress,AgentChangeReview} from './components/prism-next/agent-components';`, resolveDir: root, loader: 'tsx' }, bundle: true, platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, write: false });
await writeFile(file, bundle.outputFiles[0].text);
const { AgentArtifactPreview, AgentExecutionConfirmation, AgentExecutionProgress, AgentExecutionResult, AgentTaskProgress, AgentChangeReview } = await import(file);
await rm(file);
const h = React.createElement;

test('an arbitrary artifact without an open capability never invents an action or execution result', () => {
  const html = render(h(AgentArtifactPreview, { title: '采购清单', version: '修订 B', status: '待核对', summary: '外部提供的三项采购需求。', facts: [{ label: '归属', value: '设备组' }] }));
  assert.match(html, /采购清单/); assert.match(html, /修订 B/); assert.match(html, /设备组/);
  assert.doesNotMatch(html, /<button|函数|已完成|已发布/);
});

test('only a ready confirmation exposes submission; submitting prevents duplicate submission and other states preserve their facts', () => {
  const base = { title: '生成采购草稿', target: '清单 A', version: '修订 B', effects: ['保留旧清单'] };
  let invoked = 0;
  const action = { label: '提交采购请求', onAction() { invoked++; } };
  assert.match(render(h(AgentExecutionConfirmation, { ...base, confirmation: { state: 'ready', confirm: action } })), /提交采购请求/);
  for (const state of ['submitting', 'received', 'recorded', 'blocked', 'unknown']) {
    const html = render(h(AgentExecutionConfirmation, { ...base, confirmation: { state, description: '宿主提供的事实', confirm: action } }));
    assert.doesNotMatch(html, /提交采购请求/); assert.match(html, /宿主提供的事实/); assert.match(html, /修订 B/);
    if (state === 'submitting') {
      assert.match(html, /正在提交/); assert.match(html, /本次确认范围/);
      assert.doesNotMatch(html, /<button\b/);
    }
  }
  assert.equal(invoked, 0);
});

test('unknown receipt shows only a query while a partial receipt preserves both completed and missing scope', () => {
  const next = { label: '重试全部', onAction() {} };
  const unknown = render(h(AgentExecutionResult, { title: '结果未确认', description: '等待原执行回执', receipt: { status: 'unknown', query: { label: '查询原执行', onAction() {} }, next } }));
  assert.match(unknown, /查询原执行/); assert.doesNotMatch(unknown, /重试全部|已完成|明确失败/);
  const partial = render(h(AgentExecutionResult, { title: '保留可用部分', description: '外部回执', receipt: { status: 'partial', completed: ['区域 A 已整理'], remaining: ['区域 B 缺材料'] } }));
  assert.match(partial, /区域 A 已整理/); assert.match(partial, /区域 B 缺材料/); assert.doesNotMatch(partial, /重试|已发布/);
});

test('last-known running steps stay visible without a live spinner or current-step claim', () => {
  const steps = [{ id: 'external', label: '外部处理步骤', state: 'running', detail: '上次回执位置' }];
  const live = render(h(AgentTaskProgress, { steps }));
  assert.match(live, /aria-current="step"/); assert.match(live, /animate-spin/);
  const historical = render(h(AgentTaskProgress, { steps, activity: 'snapshot' }));
  assert.match(historical, /上次进行到/); assert.match(historical, /上次回执位置/);
  assert.doesNotMatch(historical, /animate-spin|aria-current="step"/);
});

test('adopt then verify keeps adoption independent from the host question verification', () => {
  let task = parsingReducer(sampleTask('images'), { type: 'start' });
  while (task.stage === 'processing') task = parsingReducer(task, { type: 'advance' });
  const before = task.questions[0].stem, after = before.replace('。求', '。\n求');
  task = parsingReducer(task, { type: 'apply-change', id: 'q1', before, after });
  assert.equal(task.questions[0].checked, false);
  const props = { title: '排版建议', before, after, reason: '保留内容', decision: 'accepted', onDecision() {} };
  for (const verified of [false, true]) {
    if (verified) task = parsingReducer(task, { type: 'check', id: 'q1' });
    assert.equal(task.questions[0].checked, verified);
    assert.equal(task.questions[0].stem, after);
    const html = render(h(AgentChangeReview, props));
    assert.match(html, />已采用</);
    assert.doesNotMatch(html, /尚需核对|待核对|已核对/);
  }
  task = parsingReducer(task, { type: 'edit', id: 'q1', stem: `${after}\n人工修订` });
  assert.equal(task.questions[0].checked, false);
});

test('every non-running progress state freezes running steps; running respects reduced motion', () => {
  const base = { title: '执行过程', description: '宿主回执', expanded: true, steps: [{ id: 'step', label: '整理', state: 'running' }] };
  for (const [state, label] of Object.entries(agentProgressLabels)) {
    const html = render(h(AgentExecutionProgress, { ...base, state }));
    assert.ok(html.includes(label), state);
    if (state === 'running') {
      assert.match(html, /aria-current="step"/);
      assert.match(html, /motion-reduce:animate-none/);
    } else {
      assert.match(html, /上次进行到/);
      assert.doesNotMatch(html, /animate-spin|aria-current="step"/);
    }
  }
});
