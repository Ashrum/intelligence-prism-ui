import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { legacyRecordCases, normalizeRecordMarkup } from './fixtures/agent-record-views-legacy.mjs';
import { agentProgressLabels } from '../lib/prism-next/agent-progress.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = new URL('../.sites-runtime/record-views/', import.meta.url);
await mkdir(runtime, { recursive: true });
const file = new URL('test-bundle.mjs', runtime);
const bundle = await build({ stdin: { contents: `export * from './components/prism-next/agent-semantic-components'; export * from './components/prism-next/agent-context-summary'; export {recordViewExamples,AgentRecordViewsDemo} from './components/prism-next/demos/agent-record-views';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false });
await writeFile(file, bundle.outputFiles[0].text);
const components = await import(file);
await rm(file);
const { AgentExecutionProgress, AgentExecutionResult, AgentContextSummary, recordViewExamples, AgentRecordViewsDemo } = components;
const h = React.createElement;
const modes = [{ view: 'inline' }, { view: 'workspace' }, { view: 'inline', density: 'compact' }, { view: 'workspace', density: 'compact' }];
const p04 = recordViewExamples.p04;

test('28 legacy SSR snapshots match pinned main e99813a, including explicit default view and density', async () => {
  const snapshot = JSON.parse(await readFile(new URL('./fixtures/agent-record-views-main.json', import.meta.url), 'utf8'));
  assert.equal(snapshot.baseline, 'e99813ac4d4ce64c74b910933edf268ca8cc3250');
  const cases = legacyRecordCases();
  assert.equal(Object.keys(cases).length, 28);
  for (const [name, { component, props }] of Object.entries(cases)) for (const defaults of [{}, { view: 'inline', density: 'default' }]) {
    const actual = normalizeRecordMarkup(render(h(components[component], { ...props, ...defaults })));
    assert.equal(actual, snapshot.cases[name], name);
  }
});

test('both example purposes render the same supplied facts in inline, workspace and compact; presentation still controls only the frame', () => {
  for (const sample of Object.values(recordViewExamples)) for (const mode of modes) {
    const progress = render(h(AgentExecutionProgress, { ...sample.progress, ...mode }));
    const result = render(h(AgentExecutionResult, { ...sample.result, ...mode }));
    const context = render(h(AgentContextSummary, { ...sample.context, ...mode }));
    for (const fact of [sample.progress.title, sample.progress.description, sample.progress.updatedAt, ...sample.progress.steps.flatMap(step => [step.label, step.time].filter(Boolean)), ...sample.progress.history.flatMap(run => [run.label, run.version, run.description])]) assert.ok(progress.includes(fact), fact);
    for (const output of sample.result.outputs) for (const fact of [output.title, output.version, output.status]) assert.ok(result.includes(fact), fact);
    for (const source of sample.context.sources) for (const fact of [source.title, source.version, source.location]) assert.ok(context.includes(fact), fact);
    for (const [Component, props] of [[AgentExecutionProgress, sample.progress], [AgentExecutionResult, sample.result]]) {
      assert.match(render(h(Component, { ...props, ...mode, presentation: 'card' })), /data-slot="card"/);
      assert.doesNotMatch(render(h(Component, { ...props, ...mode, presentation: 'inline' })), /data-slot="card"/);
    }
  }
});

test('workspace ignores local collapsed state and keeps every stage, step, timestamp, issue and historical round available', () => {
  const html = render(h(AgentExecutionProgress, { ...p04.progress, view: 'workspace', expanded: false }));
  for (const fact of ['读取第 1、2、4 页', '09:18', '核对第 3 页', '内容整理', '形成待校对稿', '三个清晰页面已整理。', '第 3 页文字模糊', '教师已要求补充清晰原稿', '第 1 轮', '当时状态', '当时版本', '整理原稿 v1']) assert.ok(html.includes(fact), fact);
  const context = render(h(AgentContextSummary, { ...p04.context, view: 'workspace', expanded: false }));
  assert.match(context, /对应执行/); assert.match(context, /第 2 轮 · 示例/);
  assert.doesNotMatch(context, /展开版本与定位/);
});

test('historical running rounds and stages never get live markers, animation or a current-step claim', () => {
  for (const mode of modes) {
    const html = render(h(AgentExecutionProgress, { ...p04.progress, ...mode, state: 'running', steps: [], stages: [], history: [{ ...p04.progress.history[0], stages: [{ id: 'old-stage', title: '当时整理阶段', state: 'running', steps: [{ id: 'old-step', label: '历史运行位置', state: 'running' }] }] }] }));
    const history = html.slice(html.indexOf('aria-label="历次执行"'));
    assert.match(history, /data-run-id="demo-p04-r1" data-activity="snapshot"/);
    assert.match(history, /当时状态 · 进行中/); assert.match(history, /上次进行到/);
    assert.doesNotMatch(history, /animate-spin|aria-current="step"|data-activity="live"/);
  }
});

test('only the current running round and running stage may animate; snapshot and all non-running states freeze stale steps', () => {
  for (const mode of modes) for (const [state, label] of Object.entries(agentProgressLabels)) {
    const props = { ...p04.progress, ...mode, state, stages: [{ id: 'stage', title: '阶段', state: 'running', steps: [{ id: 'step', label: '旧运行步骤', state: 'running' }] }] };
    const html = render(h(AgentExecutionProgress, props));
    assert.ok(html.includes(label));
    if (state === 'running') { assert.match(html, /animate-spin/); assert.match(html, /motion-reduce:animate-none/); }
    else assert.doesNotMatch(html, /animate-spin|aria-current="step"|data-activity="live"/);
    const snapshot = render(h(AgentExecutionProgress, { ...props, snapshot: '2026-09-23' }));
    assert.match(snapshot, /当时状态 · 2026-09-23/);
    assert.doesNotMatch(snapshot, /animate-spin|aria-current="step"|data-activity="live"/);
  }
});

test('all four receipt states preserve scope and output status without deriving success from output presence', () => {
  for (const mode of modes) for (const status of ['succeeded', 'partial', 'failed', 'unknown']) {
    const receipt = status === 'unknown' ? { status } : { status, completed: ['第一部分已处理'], remaining: ['第二部分未完成'] };
    const html = render(h(AgentExecutionResult, { ...p04.result, ...mode, receipt }));
    assert.ok(html.includes({ succeeded: '已完成', partial: '部分完成', failed: '明确失败', unknown: '状态未确认' }[status]));
    assert.match(html, /校对稿 v2/); assert.match(html, /待人工核对/); assert.match(html, /记录暂不可用/);
    if (status !== 'unknown') { assert.match(html, /第一部分已处理/); assert.match(html, /第二部分未完成/); }
    else assert.doesNotMatch(html, /第一部分已处理|第二部分未完成|>已完成<|>明确失败</);
  }
});

test('unknown receipt suppresses output opening, next, secondary and more actions even when an untyped caller supplies them', () => {
  let calls = 0;
  const action = { label: '重新执行全部', onAction() { calls++; } };
  for (const mode of modes) {
    const html = render(h(AgentExecutionResult, { ...p04.result, ...mode, onExpand() { calls++; }, receipt: { status: 'unknown', query: { ...action, label: '查询原请求' }, next: action, secondary: action }, outputs: [{ ...p04.result.outputs[0], open: { ...action, label: '打开产出' } }] }));
    assert.match(html, /查询原请求/); assert.match(html, /状态未确认/); assert.match(html, /暂不可打开/);
    assert.doesNotMatch(html, /重新执行全部|打开产出|更多/);
    assert.equal((html.match(/<button\b/g) || []).length, 1);
  }
  assert.equal(calls, 0);
});

test('missing open capability has no fake entry; blocked capability preserves its reason and available capability exposes its action', () => {
  for (const mode of modes) {
    const base = { ...p04.result, ...mode, outputs: [p04.result.outputs[0]] };
    const missing = render(h(AgentExecutionResult, base));
    assert.match(missing, /暂不可打开/); assert.doesNotMatch(missing, /<button\b/);
    for (const disabledReason of [undefined, '当前版本暂不可访问']) {
      const html = render(h(AgentExecutionResult, { ...base, outputs: [{ ...base.outputs[0], open: { label: '打开校对稿 v2', onAction() {}, disabledReason } }] }));
      assert.match(html, /打开校对稿 v2/);
      if (disabledReason) { assert.match(html, /disabled=""/); assert.match(html, /aria-describedby/); assert.match(html, /当前版本暂不可访问/); }
      else { assert.match(html, />可打开</); assert.doesNotMatch(html, /disabled=""/); }
    }
  }
});

test('four context facts are independent across all 256 state combinations in all layouts', () => {
  const states = ['confirmed', 'absent', 'unknown', 'unavailable'];
  for (const mode of modes) for (const selection of states) for (const read of states) for (const context of states) for (const citation of states) {
    const fact = (state, key) => state === 'confirmed' ? { state, description: `${key}已确认`, version: `${key}版本`, location: `${key}定位` } : { state };
    const source = { id: 'source', title: '四项事实', version: '原稿 v7', location: '第 5 页', selection: { confirmed: 'selected', absent: 'not-selected', unknown: 'unknown', unavailable: 'unavailable' }[selection], read: fact(read, '读取'), context: fact(context, '参考'), citation: fact(citation, '引用') };
    const html = render(h(AgentContextSummary, { title: '任务依据', scope: [], expanded: false, sources: [source], ...mode }));
    for (const [key, state, absent] of [['读取', read, '未读取'], ['参考', context, '未参考'], ['引用', citation, '未引用']]) {
      if (state === 'confirmed') for (const suffix of ['已确认', '版本', '定位']) assert.ok(html.includes(`${key}${suffix}`));
      else assert.ok(!html.includes(`${key}已确认`));
      assert.equal(html.includes(absent), state === 'absent');
    }
    assert.equal(html.includes('本次选用'), selection === 'confirmed');
    assert.equal(html.includes('未选用'), selection === 'absent');
    assert.equal(html.includes('记录暂不可用'), [selection, read, context, citation].includes('unavailable'));
    assert.equal(html.includes('状态未确认'), [selection, read, context, citation].includes('unknown'));
  }
});

test('workspace and compact retain unavailable/unknown warnings, per-fact version and location, and missing inspect capability', () => {
  for (const mode of modes) {
    const source = { ...p04.context.sources[0], inspectable: false };
    const html = render(h(AgentContextSummary, { ...p04.context, ...mode, sources: [source], onInspect() {} }));
    for (const text of ['本次选用', '本机已读取指定页面', '原稿 v2', '第 1、2、4 页', 'Agent 本次参考', '成果引用', '状态未确认', '记录暂不可用']) assert.ok(html.includes(text), text);
    assert.doesNotMatch(html, /查看来源|未读取|未参考|未引用/);
  }
});

test('missing times and record metadata remain unknown and empty collections never claim completed work', () => {
  const progress = render(h(AgentExecutionProgress, { title: '记录', description: '状态待查询', state: 'unknown', steps: [], expanded: false, view: 'workspace' }));
  for (const text of ['更新时间未确认', '当前轮次未确认', '暂无步骤记录', '暂无较早执行记录']) assert.ok(progress.includes(text));
  assert.doesNotMatch(progress, />已完成<|执行失败|animate-spin/);
  const result = render(h(AgentExecutionResult, { title: '回执', description: '等待查询', receipt: { status: 'unknown', record: { request: '原请求', run: '第 1 轮' } }, view: 'workspace', outputs: [] }));
  assert.match(result, /版本未确认/); assert.match(result, /时间未确认/); assert.match(result, /暂无产出记录/);
});

test('supplementary explanation starts collapsed; uncertainty, scope and failure facts stay outside it', () => {
  for (const mode of modes) for (const [Component, props] of [[AgentExecutionProgress, p04.progress], [AgentExecutionResult, p04.result], [AgentContextSummary, p04.context]]) {
    const html = render(h(Component, { ...props, ...mode, details: h('p', null, '补充实现之外的解释') }));
    assert.match(html, /aria-expanded="false"/); assert.match(html, /说明<\/button>/);
    assert.doesNotMatch(html, /补充实现之外的解释/);
    assert.ok(html.includes(props.title));
    assert.match(html, /未确认|暂不可用|尚未|模糊/);
  }
});

test('view and density changes do not mutate input or invoke capabilities; more forwards the actual trigger only', () => {
  const before = JSON.stringify(recordViewExamples);
  let calls = 0, tree;
  const trigger = { id: 'origin-button' };
  let received;
  const props = { ...p04.progress, onExpand: value => { received = value; }, action: { label: '查询记录', onAction() { calls++; } } };
  for (const mode of modes) render(h(AgentExecutionProgress, { ...props, ...mode }));
  assert.equal(calls, 0); assert.equal(received, undefined); assert.equal(JSON.stringify(recordViewExamples), before);
  function Capture() { tree = AgentExecutionProgress(props); return tree; }
  render(h(Capture));
  const nodes = React.Children.toArray(tree.props.children);
  const expand = nodes.find(node => React.isValidElement(node) && node.props.onExpand);
  const button = expand.type(expand.props);
  button.props.onClick({ currentTarget: trigger });
  assert.equal(received, trigger); assert.equal(calls, 0);
});

test('demo exposes all three uses and both purposes with explicit sample labels and no teacher-facing implementation jargon', () => {
  const html = render(h(AgentRecordViewsDemo));
  for (const text of ['record-views', '对话摘要', '完整记录', '紧凑列表', 'P04 扫描整理', '备课资料整理', '示例', '320px 窄容器']) assert.ok(html.includes(text));
  assert.doesNotMatch(html, /意图|宿主|回调|受控/);
});
