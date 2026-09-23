import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';

const root = fileURLToPath(new URL('../', import.meta.url));
const file = new URL('../.sites-runtime/agent-semantics-test.mjs', import.meta.url);
await mkdir(new URL('../.sites-runtime/', import.meta.url), { recursive: true });
const bundle = await build({ stdin: { contents: `export * from './components/prism-next/agent-semantic-components';export {AgentTaskProgress} from './components/prism-next/agent-components';`, resolveDir: root, loader: 'tsx' }, bundle: true, platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, write: false });
await writeFile(file, bundle.outputFiles[0].text);
const { AgentArtifactPreview, AgentExecutionConfirmation, AgentExecutionResult, AgentTaskProgress } = await import(file);
await rm(file);
const h = React.createElement;

test('an arbitrary artifact without an open capability never invents an action or execution result', () => {
  const html = render(h(AgentArtifactPreview, { title: '采购清单', version: '修订 B', status: '待核对', summary: '外部提供的三项采购需求。', facts: [{ label: '归属', value: '设备组' }] }));
  assert.match(html, /采购清单/); assert.match(html, /修订 B/); assert.match(html, /设备组/);
  assert.doesNotMatch(html, /<button|函数|已完成|已发布/);
});

test('only a ready confirmation exposes submission; blocked and unresolved inputs preserve their facts', () => {
  const base = { title: '生成采购草稿', target: '清单 A', version: '修订 B', effects: ['保留旧清单'] };
  let invoked = 0;
  const action = { label: '提交采购请求', onAction() { invoked++; } };
  assert.match(render(h(AgentExecutionConfirmation, { ...base, confirmation: { state: 'ready', confirm: action } })), /提交采购请求/);
  for (const state of ['submitting', 'received', 'recorded', 'blocked', 'unknown']) {
    const html = render(h(AgentExecutionConfirmation, { ...base, confirmation: { state, description: '宿主提供的事实', confirm: action } }));
    assert.doesNotMatch(html, /提交采购请求/); assert.match(html, /宿主提供的事实/); assert.match(html, /修订 B/);
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
