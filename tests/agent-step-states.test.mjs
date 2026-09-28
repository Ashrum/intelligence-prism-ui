import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { CircleAlert, CircleHelp, Clock3 } from 'lucide-react';
import { agentProgressLabels } from '../lib/prism-next/agent-progress.ts';
import { legacyStepCases, stepStatesBaseline } from './fixtures/agent-step-states-legacy.mjs';
import { normalizeRecordMarkup } from './fixtures/agent-record-views-legacy.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = new URL('../.sites-runtime/step-states/', import.meta.url);
await mkdir(runtime, { recursive: true });
const file = new URL('test-bundle.mjs', runtime);
const bundle = await build({ stdin: { contents: `export { AgentStepStatus, AgentTaskProgress } from './components/prism-next/agent-components'; export { AgentExecutionProgress } from './components/prism-next/agent-semantic-components'; export { Badge } from './components/prism-next/badge'; export { AgentRecordViewsDemo, recordViewExamples } from './components/prism-next/demos/agent-record-views';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false });
await writeFile(file, bundle.outputFiles[0].text);
const components = await import(file);
await rm(file);
const { AgentStepStatus, AgentTaskProgress, AgentExecutionProgress, Badge, AgentRecordViewsDemo, recordViewExamples } = components;
const h = React.createElement;
const newStates = {
  unknown: { label: '状态未确认', glyph: CircleHelp },
  'waiting-human': { label: '待人工处理', glyph: CircleAlert },
  waiting: { label: '等待处理', glyph: Clock3 },
  partial: { label: '部分完成', glyph: CircleAlert },
};
const steps = Object.keys(newStates).map(state => ({ id: state, label: `记录 ${state}`, state, time: '09:20', detail: `范围 ${state}` }));
const modes = [{ view: 'inline', density: 'default' }, { view: 'workspace', density: 'default' }, { view: 'inline', density: 'compact' }, { view: 'workspace', density: 'compact' }];
const noActivity = /animate-(?:spin|pulse|ping)|aria-current=|data-activity="live"/;

function assertStepList(html) {
  const badges = [...html.matchAll(/<span[^>]*data-slot="badge"[^>]*>(.*?)<\/span>/g)].map(match => match[1]);
  assert.deepEqual(badges, Object.values(newStates).map(({ label }) => label));
  for (const { glyph } of Object.values(newStates)) assert.ok(html.includes(render(h(glyph, { className: 'size-4 text-warning-foreground' }))));
  for (const step of steps) for (const fact of [step.label, step.time, step.detail]) assert.ok(html.includes(fact), fact);
  assert.match(html, /<span aria-hidden="true" class="mt-1 shrink-0"><svg/);
  assert.doesNotMatch(html, noActivity);
}

test('25 old four-state SSR snapshots match pinned main 0a19ff7 across statuses, lists, stages, history, views and densities', async () => {
  const snapshot = JSON.parse(await readFile(new URL('./fixtures/agent-step-states-main.json', import.meta.url), 'utf8'));
  assert.equal(snapshot.baseline, stepStatesBaseline);
  const cases = legacyStepCases();
  assert.equal(Object.keys(cases).length, 25);
  assert.deepEqual(Object.keys(cases), Object.keys(snapshot.cases));
  const actual = Object.fromEntries(Object.entries(cases).map(([name, { component, props }]) => [name, normalizeRecordMarkup(render(h(components[component], props)))]));
  await writeFile(new URL('legacy-actual.json', runtime), JSON.stringify({ baseline: stepStatesBaseline, cases: actual }, null, 2) + '\n');
  const comparisons = Object.entries(actual).map(([name, html]) => ({ name, equal: html === snapshot.cases[name], expectedSha256: createHash('sha256').update(snapshot.cases[name]).digest('hex'), actualSha256: createHash('sha256').update(html).digest('hex') }));
  await writeFile(new URL('legacy-comparison.json', runtime), JSON.stringify({ baseline: stepStatesBaseline, total: comparisons.length, matched: comparisons.filter(item => item.equal).length, comparisons }, null, 2) + '\n');
  for (const [name, html] of Object.entries(actual)) assert.equal(html, snapshot.cases[name], name);
});

for (const [state, { label }] of Object.entries(newStates)) test(`${state} uses the shared ${label} label and existing warning Badge in live and snapshot`, () => {
  assert.equal(agentProgressLabels[state], label);
  const expected = render(h(Badge, { variant: 'warning', size: 'lg' }, label));
  for (const snapshot of [false, true]) assert.equal(render(h(AgentStepStatus, { state, snapshot })), expected);
});

test('all new steps have visible text and static graphical cues at both densities, even during live activity', () => {
  for (const density of ['default', 'compact']) for (const activity of ['live', 'snapshot']) {
    assertStepList(render(h(AgentTaskProgress, { steps, density, activity })));
  }
});

test('snapshot preserves every non-running status and only running becomes the static last position', () => {
  for (const state of ['done', 'pending', 'error', ...Object.keys(newStates)]) {
    assert.equal(render(h(AgentStepStatus, { state, snapshot: true })), render(h(AgentStepStatus, { state })));
  }
  for (const density of ['default', 'compact']) {
    const mixed = [...steps, { id: 'run', label: '上次位置', state: 'running' }];
    const snapshot = render(h(AgentTaskProgress, { steps: mixed, density, activity: 'snapshot' }));
    for (const { label } of Object.values(newStates)) assert.ok(snapshot.includes(label));
    assert.match(snapshot, /上次进行到/);
    assert.doesNotMatch(snapshot, noActivity);
    const live = render(h(AgentTaskProgress, { steps: mixed, density }));
    assert.equal([...live.matchAll(/aria-current="step"/g)].length, 1);
    assert.equal([...live.matchAll(/\banimate-spin\b/g)].length, 1);
    assert.match(live, /motion-reduce:animate-none/);
  }
});

test('execution current steps, stages, past rounds and past stages preserve new facts across every view and density', () => {
  let calls = 0;
  const before = JSON.stringify(steps);
  for (const mode of modes) for (const state of ['running', ...Object.keys(newStates)]) {
    const stages = [{ id: 'stage', title: '阶段事实', state, steps }];
    const html = render(h(AgentExecutionProgress, {
      title: '当前任务', state, description: '保留原请求记录', steps, stages, ...mode, expanded: true,
      onExpandedChange() { calls++; }, run: { id: 'current', label: '第 2 轮' },
      history: [{ id: 'previous', label: '第 1 轮', state, description: '当时记录', steps, stages }],
    }));
    const lists = [...html.matchAll(/<ol aria-label="任务(?:执行步骤|步骤记录)"[^>]*>(.*?)<\/ol>/g)];
    assert.equal(lists.length, 4);
    for (const [, list] of lists) assertStepList(list);
    assert.match(html, new RegExp(`当时状态 · ${agentProgressLabels[state]}`));
    assert.doesNotMatch(html, /animate-(?:spin|pulse|ping)|aria-current=/);
    if (state !== 'running') assert.doesNotMatch(html, /data-activity="live"/);
  }
  assert.equal(calls, 0);
  assert.equal(JSON.stringify(steps), before);
});

test('non-running stages and explicit snapshots cannot revive a stale running step alongside new states', () => {
  const mixed = [...steps, { id: 'old-running', label: '最后运行位置', state: 'running' }];
  for (const mode of modes) {
    const base = { title: '执行记录', state: 'running', description: '保留执行事实', expanded: true, ...mode, steps: [] };
    for (const state of Object.keys(newStates)) {
      const html = render(h(AgentExecutionProgress, { ...base, stages: [{ id: 'stage', title: '当前阶段', state, steps: mixed }] }));
      assert.match(html, /上次进行到/);
      assert.doesNotMatch(html, /animate-(?:spin|pulse|ping)|aria-current=/);
    }
    const historical = render(h(AgentExecutionProgress, { ...base, snapshot: '当时记录', steps: mixed, stages: [{ id: 'stage', title: '当时阶段', state: 'running', steps: mixed }] }));
    for (const { label } of Object.values(newStates)) assert.ok(historical.includes(label));
    assert.match(historical, /上次进行到/);
    assert.doesNotMatch(historical, noActivity);
  }
});

test('unreached steps stay pending while occurred requests and current human handling keep their supplied facts', () => {
  for (const state of ['unknown', 'waiting', 'waiting-human']) for (const mode of modes) {
    const html = render(h(AgentExecutionProgress, { title: '处理范围', state, description: '范围确认记录', expanded: true, ...mode, steps: [
      { id: 'scope', label: '确认范围', state }, { id: 'future', label: '后续保存', state: 'pending' },
    ] }));
    const list = html.match(/<ol aria-label="任务步骤记录"[^>]*>(.*?)<\/ol>/)?.[1];
    assert.ok(list);
    assert.ok(list.includes(agentProgressLabels[state]));
    assert.equal([...list.matchAll(/待开始/g)].length, 1);
    assert.doesNotMatch(list, /已完成|失败|上次进行到/);
  }
});

test('component-page P04 example shows all new step facts and retains the historical running position', () => {
  const sample = recordViewExamples.p04.progress;
  const states = [...sample.steps, ...sample.stages.flatMap(stage => stage.steps), ...sample.history.flatMap(run => run.steps)].map(step => step.state);
  for (const state of Object.keys(newStates)) assert.ok(states.includes(state), state);
  const html = render(h(AgentRecordViewsDemo));
  for (const text of ['record-views', '示例', '教师已确认处理范围，原请求回执缺失。', '当前等待教师核对模糊文字。', '补充请求已接收，尚未报告开始处理。', '第 1、2、4 页已形成校对稿，第 3 页尚未整理。', '上次进行到', ...Object.values(newStates).map(({ label }) => label)]) assert.ok(html.includes(text), text);
  assert.doesNotMatch(html, /animate-(?:spin|pulse|ping)|aria-current=/);
});
