import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = new URL('../.sites-runtime/plan-builder/', import.meta.url);
await mkdir(runtime, { recursive: true });
const file = new URL('test-bundle.mjs', runtime);
const bundle = await build({ stdin: { contents: `export * from './components/prism-next/agent-plan-builder'; export * from './components/prism-next/workload-calendar'; export * from './components/prism-next/learning-components'; export * from './components/prism-next/demos/agent-plan-builder';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false });
await writeFile(file, bundle.outputFiles[0].text);
const { AgentPlanBuilder, WorkloadCalendar, LearningTaskList, PlanBuilderExample, AgentPlanBuilderDemo, planExamples, applyPlanExample } = await import(file);
await rm(file);
const h = React.createElement;
const reference = (id, label) => ({ id: `opaque-${id}`, label });
const source = { suggestionId: 'opaque-suggestion', versionId: 'opaque-source-version', label: '采纳后的建议来源' };
const plan = { id: 'opaque-plan', title: '可读计划标题', kind: 'teaching', version: { id: 'opaque-current', label: '草稿二版' }, baseVersion: { id: 'opaque-base', label: '基准一版' },
  goal: '核对条件后安排两周订正', audience: [reference('class', '高二三班')], startDate: '2026-09-28', endDate: '2026-10-11', sources: [source], core: 'draft', tasks: 'not-created', execution: 'not-started' };
const step = (id, state = 'draft') => ({ id: `opaque-step-${id}`, title: `步骤标题${id}`, description: '相同的步骤说明。', owner: null, audience: [reference('class', '高二三班')], startDate: '2026-09-28', endDate: '2026-09-30', resources: [], dependencies: [], source, status: state === 'blocked' ? { state, reason: '缺少再练资料。' } : { state } });
const steps = [step('a'), step('b', 'confirmed'), step('c', 'task-created'), step('d', 'running'), step('e', 'completed'), step('f', 'blocked'), step('g', 'unknown')];
const actions = Object.fromEntries(['step-add', 'step-edit', 'step-remove', 'step-move', 'assign', 'attach-resource', 'confirm-core', 'request-create-tasks', 'open-source'].map(key => [key, {}]));
const props = { plan, steps, actions, validation: [], pendingItems: ['核对负责人'], save: { state: 'unsaved' }, createTaskStepIds: steps.slice(0, 2).map(step => step.id), onIntent() {} };
const context = { planId: plan.id, versionId: plan.version.id, baseVersionId: plan.baseVersion.id };
const modes = [{ view: 'inline' }, { view: 'workspace' }, { view: 'inline', density: 'compact' }, { view: 'workspace', density: 'compact' }];
const htmlFor = extra => render(h(AgentPlanBuilder, { ...props, ...extra }));
function capture(extra = {}) {
  const nodes = [], owned = new Set(['AgentPlanBuilder', 'LearningTaskList', 'PlanCalendar']);
  function inspect(node) {
    if (Array.isArray(node)) return node.map(inspect);
    if (!React.isValidElement(node)) return node;
    if (typeof node.type === 'function' && owned.has(node.type.name)) return h(function Probe() { return inspect(node.type(node.props)); });
    nodes.push(node);
    return React.cloneElement(node, {}, React.Children.map(node.props.children, inspect));
  }
  render(inspect(h(AgentPlanBuilder, { ...props, view: 'workspace', ...extra })));
  return nodes;
}
const buttons = (nodes, type) => nodes.filter(node => node.props['data-plan-action'] === type);
const withText = (nodes, text) => nodes.find(node => node.props.onClick && React.Children.toArray(node.props.children).includes(text));
const fields = nodes => nodes.filter(node => node.props['data-plan-field']);
const event = value => ({ currentTarget: { value } });
const occurrences = (html, text) => html.split(text).length - 1;
function freeze(value) { if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.freeze(value); Object.values(value).forEach(freeze); } return value; }

test('SSR Inline/Workspace and both densities retain identity, core facts, seven step states and boundaries in all themes', () => {
  for (const theme of ['light', 'paper', 'dark']) for (const mode of modes) {
    const html = render(h('div', { 'data-ui-version': 'coss-v1', 'data-prism-theme': theme }, h(AgentPlanBuilder, { ...props, ...mode })));
    for (const text of [plan.title, plan.goal, '高二三班', '草稿二版', '基准一版', '2026-09-28', '2026-10-11', '核对负责人', '计划草稿', '任务未创建', '尚未执行', '已确认', '已创建任务', '进行中', '已完成', '受阻', '步骤 7状态', '缺少再练资料。']) assert.ok(html.includes(text), text);
    assert.equal(occurrences(html, '未知：'), 1);
    assert.equal(occurrences(html, '计划草稿、已创建任务和实际执行分别记录；调整日期不会自动排程。'), 1);
    assert.doesNotMatch(html, /opaque-|宿主|意图|回调|受控/);
    assert.ok(html.indexOf(steps[0].title) < html.indexOf(steps[1].title));
    if (mode.view === 'inline') assert.doesNotMatch(html, /新增步骤|编辑步骤|data-slot="input"|工作量日历/);
  }
});

test('unknown facts stay in a single standing line without guessing current values or treating absent lists as empty', () => {
  const html = htmlFor({ plan: { ...plan, goal: null, audience: null, startDate: null, endDate: null, sources: null, version: { id: 'opaque-v', label: '' }, baseVersion: undefined, core: 'unknown', tasks: 'unknown', execution: 'unknown' }, save: undefined, pendingItems: null,
    steps: [{ ...steps[0], description: null, audience: null, resources: null, dependencies: null, source: null, startDate: null, endDate: null, status: { state: 'unknown' } }] });
  assert.equal(occurrences(html, '未知：'), 1);
  for (const label of ['计划目标', '适用对象', '开始日期', '结束日期', '保存状态', '任务创建', '执行状态', '基准版本', '建议来源', '步骤 1负责人', '步骤 1资源', '步骤 1依赖']) assert.ok(html.includes(label), label);
  assert.doesNotMatch(html, /任务未创建|尚未执行|已保存草稿|依赖：无|所需资源：无/);
});

test('supplied conflict and overload facts stay visible, deduplicate reasons and permit corrections but block confirmation', () => {
  const validation = [{ kind: 'date-conflict', level: 'error', message: '日期冲突需核对。', stepIds: [steps[0].id] }, { kind: 'overload', level: 'warning', message: '工作量超过参考容量。' }, { kind: 'resource-unavailable', level: 'error', message: '缺少再练资料。', stepIds: [steps[5].id] }];
  for (const mode of modes) {
    const calls = [], extra = { ...mode, validation, onIntent: intent => calls.push(intent) }, html = htmlFor(extra), nodes = capture(extra);
    for (const item of validation) assert.equal(occurrences(html, item.message), 1);
    assert.match(html, /日期冲突|工作量过载|资源不可用/); assert.match(html, /role="alert"/);
    const confirm = buttons(nodes, 'confirm-core')[0]; assert.equal(confirm.props.disabled, true); confirm.props.onClick(); assert.equal(calls.length, 0);
    if (mode.view === 'workspace') { buttons(nodes, 'step-edit')[0].props.onClick(); assert.equal(calls[0].type, 'step-edit'); }
  }
  // Identical dates are not a component-generated conflict, and edits cannot clear supplied checks.
  assert.doesNotMatch(htmlFor(), /日期冲突|工作量过载|资源不可用/);
  const editing = capture({ validation, editor: { stepId: steps[0].id, values: { title: '', description: '', startDate: '', endDate: '', timeWindow: '' } } });
  assert.ok(fields(editing).every(node => node.props['aria-invalid']));
  assert.ok(fields(editing).every(node => node.props['aria-describedby']));
});

test('draft confirmation, task creation and execution never advance from clicks or a returned promise', () => {
  const calls = [], extra = { onIntent: intent => { calls.push(intent); return Promise.resolve('success'); } };
  const before = htmlFor(extra), nodes = capture(extra); buttons(nodes, 'confirm-core')[0].props.onClick();
  assert.deepEqual(calls, [{ ...context, type: 'confirm-core', stepIds: steps.map(step => step.id) }]);
  assert.equal(htmlFor(extra), before); assert.match(before, /未保存/); assert.doesNotMatch(before, /核心步骤已确认/);
  const confirmed = { ...extra, plan: { ...plan, core: 'confirmed', tasks: 'partial', execution: 'not-started' } };
  const next = capture(confirmed); buttons(next, 'request-create-tasks')[0].props.onClick();
  assert.deepEqual(calls.at(-1), { ...context, type: 'request-create-tasks', stepIds: props.createTaskStepIds });
  assert.notEqual(calls.at(-1).stepIds, props.createTaskStepIds);
  assert.match(htmlFor(confirmed), /核心步骤已确认/); assert.match(htmlFor(confirmed), /部分任务已创建/); assert.match(htmlFor(confirmed), /尚未执行/);
});

test('creation requests require an explicit full target set, known task facts and no already-created or restricted target', () => {
  for (const extra of [ { createTaskStepIds: [] }, { createTaskStepIds: [steps[0].id, steps[0].id] }, { createTaskStepIds: ['missing'] },
    ...steps.slice(2).map(step => ({ createTaskStepIds: [step.id] })),
    { steps: steps.map((step, i) => i ? step : { ...step, disabledReason: '' }) },
    ...['created', 'pending', 'unconfirmed', 'unknown'].map(tasks => ({ plan: { ...plan, core: 'confirmed', tasks } })) ]) {
    const calls = [], nodes = capture({ plan: { ...plan, core: 'confirmed' }, ...extra, onIntent: intent => calls.push(intent) });
    const button = buttons(nodes, 'request-create-tasks')[0]; assert.equal(button.props.disabled, true); button.props.onClick(); assert.equal(calls.length, 0);
  }
});

test('add and edit buffers are controlled; exact whitespace, empty strings and UI date values retain the version context', () => {
  const values = freeze({ title: '  长标题  ', description: '\n说明  ', startDate: '2026-10-11', endDate: '2026-09-28', timeWindow: '  下周课后  ' });
  for (const stepId of [null, steps[0].id]) {
    const calls = [], extra = { editor: { stepId, values }, onIntent: intent => calls.push(intent) }, nodes = capture(extra);
    const type = stepId === null ? 'step-add' : 'step-edit';
    for (const field of fields(nodes)) {
      const key = field.props['data-plan-field'], value = key === 'startDate' ? '2026-10-02' : key === 'endDate' ? '' : '  原样\n ';
      field.props.onChange(event(value));
      assert.deepEqual(calls.at(-1), { ...context, type, ...(stepId ? { stepId } : {}), phase: 'change', values: { ...values, [key]: value } });
      assert.notEqual(calls.at(-1).values, values);
    }
    withText(nodes, stepId ? '提交步骤调整' : '加入计划草稿').props.onClick();
    assert.deepEqual(calls.at(-1).values, values); assert.equal(calls.at(-1).phase, 'submit');
    withText(nodes, '收起编辑').props.onClick(); assert.equal(calls.at(-1).phase, 'cancel');
    assert.deepEqual(values.startDate, '2026-10-11'); // No date reordering, clamping, timezone or scheduling.
  }
  const calls = [], nodes = capture({ onIntent: intent => calls.push(intent) });
  withText(nodes, '新增步骤').props.onClick(); assert.equal(calls[0].phase, 'start'); assert.equal(calls[0].type, 'step-add');
  buttons(nodes, 'step-edit')[0].props.onClick(); assert.equal(calls[1].stepId, steps[0].id); assert.equal(calls[1].phase, 'start');
});

test('step removal and up/down moves carry final indexes without mutating steps or dependency facts', () => {
  for (const view of ['inline', 'workspace']) {
    const calls = [], original = freeze(structuredClone(steps)), extra = { view, steps: original, onIntent: intent => calls.push(intent) }, before = htmlFor(extra), nodes = capture(extra);
    const moves = buttons(nodes, 'step-move'); moves[2].props.onClick(); moves[3].props.onClick();
    assert.deepEqual(calls, [{ ...context, type: 'step-move', stepId: steps[1].id, toIndex: 0, via: 'up' }, { ...context, type: 'step-move', stepId: steps[1].id, toIndex: 2, via: 'down' }]);
    moves[0].props.onClick(); moves.at(-1).props.onClick(); assert.equal(calls.length, 2);
    if (view === 'workspace') { buttons(nodes, 'step-remove')[0].props.onClick(); assert.deepEqual(calls.at(-1), { ...context, type: 'step-remove', stepId: steps[0].id }); }
    assert.equal(htmlFor(extra), before);
  }
  const locked = capture({ steps: steps.map((step, index) => index === 1 ? { ...step, disabledReason: '' } : step) });
  for (const index of [1, 2, 3, 4]) assert.equal(buttons(locked, 'step-move')[index].props.disabled, true);
});

test('assignments and resource references use ordinal controls, copy exact permitted references and refuse unavailable choices', () => {
  const calls = [], people = [reference('teacher', '王老师'), { ...reference('other', '另一位老师'), disabledReason: '暂不可分派。' }], audiences = [reference('group', '复习小组')], resources = [reference('material', '讲评资料')];
  const extra = { people, audiences, resources, onIntent: intent => calls.push(intent) }, nodes = capture(extra);
  const selects = nodes.filter(node => Array.isArray(node.props.items) && node.props.onValueChange);
  for (const select of selects.slice(0, 3)) select.props.onValueChange('0');
  assert.deepEqual(calls, [{ ...context, type: 'assign', stepId: steps[0].id, role: 'owner', references: [people[0]] }, { ...context, type: 'assign', stepId: steps[0].id, role: 'audience', references: [...steps[0].audience, audiences[0]] }, { ...context, type: 'attach-resource', stepId: steps[0].id, resource: resources[0] }]);
  assert.notEqual(calls[0].references[0], people[0]); assert.notEqual(calls[2].resource, resources[0]);
  selects[0].props.onValueChange('1'); selects[0].props.onValueChange('opaque-teacher'); selects[0].props.onValueChange('999'); assert.equal(calls.length, 3);
  assert.doesNotMatch(htmlFor(extra), /opaque-/);
  const unknown = capture({ ...extra, steps: [{ ...steps[0], audience: null }] }).filter(node => Array.isArray(node.props.items) && node.props.onValueChange)[1];
  assert.equal(unknown.props.disabled, true); unknown.props.onValueChange('0'); assert.equal(calls.length, 3);
});

test('identical explanations, source facts, disabled reasons and boundary copy appear once; each title has one owner', () => {
  const disabledReason = '此计划暂不可编辑。';
  for (const mode of modes) {
    const extra = { ...mode, readOnlyReason: disabledReason, actions: Object.fromEntries(Object.keys(actions).map(key => [key, { disabledReason }])) }, html = htmlFor(extra);
    for (const text of [disabledReason, '相同的步骤说明。', source.label, plan.title, ...steps.map(step => step.title)]) assert.equal(occurrences(html, text), 1, text);
    const nodes = capture(extra), disabled = buttons(nodes, 'step-move').map(node => node.props['aria-describedby']);
    assert.equal(new Set(disabled).size, 1); assert.ok(html.includes(`id="${disabled[0]}"`));
  }
  const nodes = capture(); assert.equal(buttons(nodes, 'open-source').length, 1);
  const calls = [], src = buttons(capture({ onIntent: intent => calls.push(intent) }), 'open-source')[0]; src.props.onClick();
  assert.deepEqual(calls[0], { ...context, type: 'open-source', source }); assert.notEqual(calls[0].source, source);
});

test('history, empty disabled reasons, missing identities, duplicate references and uncertain receipts guard handlers', () => {
  const cases = [{ readOnlyReason: '' }, { plan: { ...plan, snapshot: '' } }, { plan: { ...plan, baseVersion: undefined } }, { plan: { ...plan, id: '' } }, { steps: [steps[0], steps[0]] }, { people: [reference('p', '人'), reference('p', '人')] }, { onIntent: undefined },
    ...['saving', 'conflict', 'unconfirmed'].map(state => ({ save: { state } })), { plan: { ...plan, core: 'pending' } }, { plan: { ...plan, tasks: 'unconfirmed' } }];
  for (const extra of cases) {
    const calls = [], nodes = capture({ onIntent: intent => calls.push(intent), ...extra });
    for (const type of ['step-add', 'step-edit', 'step-remove', 'step-move', 'confirm-core', 'request-create-tasks']) for (const button of buttons(nodes, type)) { assert.equal(button.props.disabled, true); button.props.onClick(); }
    assert.equal(calls.length, 0);
  }
  assert.doesNotMatch(htmlFor({ steps: [steps[0], steps[0]] }), /步骤标题/);
  assert.equal(buttons(capture({ save: { state: 'error' } }), 'step-edit')[0].props.disabled, false);
  const calls = [], history = capture({ plan: { ...plan, snapshot: '昨天' }, onIntent: intent => calls.push(intent) }); buttons(history, 'open-source')[0].props.onClick(); assert.equal(calls[0].type, 'open-source');
});

test('readonly controlled editors cannot emit even when a change handler is invoked directly', () => {
  const calls = [], nodes = capture({ readOnlyReason: '', editor: { stepId: steps[0].id, values: { title: '', description: '', startDate: '', endDate: '', timeWindow: '' } }, onIntent: intent => calls.push(intent) });
  for (const field of fields(nodes)) { assert.equal(field.props.readOnly, true); field.props.onChange(event('不可写')); }
  assert.equal(calls.length, 0);
});

test('WorkloadCalendar external mode honors supplied assessments even when capacity arithmetic disagrees', () => {
  const common = { month: new Date(2026, 8, 1), selected: new Date(2026, 8, 28), onSelect() {}, onMonthChange() {}, capacity: 30, days: { '2026-09-28': { value: 90, overCapacity: false }, '2026-09-29': { value: 5, overCapacity: true }, '2026-09-30': { value: 120 } } };
  const external = render(h(WorkloadCalendar, { ...common, assessment: 'external', emptyLabel: '工作量未知' }));
  assert.match(external, /2026-09-28，90 分钟"/); assert.match(external, /2026-09-29，5 分钟，超出容量/); assert.match(external, /2026-09-30，120 分钟，负荷判断未知/);
  assert.doesNotMatch(external, /2026-09-28，90 分钟，超出容量/); assert.match(external, /工作量未知/);
  const legacy = render(h(WorkloadCalendar, common)); assert.match(legacy, /2026-09-28，90 分钟，超出容量/); assert.match(legacy, /2026-09-29，5 分钟"/);
  const list = render(h(LearningTaskList, { items: [{ id: 'id', title: '默认表格', schedule: '', status: '' }] })); assert.match(list, /<table/);
});

test('field-specific readonly capability supports text-only plans without pretending unsupported dates can be saved', () => {
  const calls = [], values = { title: '跟进安排', description: '原始计划', startDate: '', endDate: '', timeWindow: '' };
  const readOnlyReason = '当前行动仅支持修改步骤说明。';
  const extra = { editor: { stepId: steps[0].id, values, readOnlyFields: { title: readOnlyReason, startDate: readOnlyReason, endDate: readOnlyReason, timeWindow: readOnlyReason } }, onIntent: intent => calls.push(intent) };
  const nodes = capture(extra);
  for (const field of fields(nodes)) field.props.onChange(event('  新输入  '));
  assert.equal(calls.length, 1); assert.equal(calls[0].values.description, '  新输入  '); assert.equal(calls[0].values.startDate, '');
  assert.equal(occurrences(htmlFor({ ...extra, view: 'workspace' }), readOnlyReason), 1);
});

test('Workspace composes external milestones and calendar; compact retains facts and navigation only changes the view', () => {
  const calls = [], trigger = {}, inline = capture({ view: 'inline', onExpand: target => calls.push(target) }); withText(inline, '展开计划').props.onClick({ currentTarget: trigger });
  const nodes = capture({ onBack: () => calls.push('back') }); withText(nodes, '返回原位置').props.onClick(); assert.deepEqual(calls, [trigger, 'back']);
  assert.doesNotMatch(htmlFor(), /展开计划|返回原位置/);
  const calendar = h("section", null, h("h3", null, "工作量日历"), h("p", null, "容量未知"));
  const html = htmlFor({ view: 'workspace', density: 'compact', calendar, milestones: [{ id: 'opaque-milestone', title: '第一周回看', state: 'pending', detail: '阶段尚未完成' }], details: h('p', null, '补充说明') });
  assert.match(html, /第一周回看/); assert.match(html, /阶段尚未完成/); assert.match(html, /工作量日历/); assert.match(html, /容量未知/); assert.match(html, /gap-3 p-3/); assert.match(html, /aria-expanded="false"/);
  assert.doesNotMatch(html, /opaque-/); // Pinned coss classes are adapted by the shared typography layer.
});

test('two plan examples expose three uses, narrow containers, long Chinese, formula and independent records', () => {
  for (const purpose of ['teaching', 'revision']) {
    const html = render(h(PlanBuilderExample, { purpose, narrow: true }));
    assert.equal(occurrences(html, 'data-agent-plan-view='), 3); assert.match(html, /max-w-\[320px\]/); assert.match(html, /<math/); assert.match(html, /固定示例/); assert.match(html, /独立保存记录/);
    if (purpose === 'teaching') { assert.match(html, /日期冲突/); assert.match(html, /已创建任务/); assert.match(html, /受阻/); }
    else assert.match(html, /学生函数复习计划/);
  }
  assert.match(render(h(AgentPlanBuilderDemo)), /id="plan-builder"/);
});

test('example adapter preserves closed editing buffers, rejects stale versions and never invents task/execution receipts', () => {
  const state = planExamples.teaching, context = { planId: state.plan.id, versionId: state.plan.version.id, baseVersionId: state.plan.baseVersion.id };
  const values = { title: '  新步骤  ', description: '', startDate: '2026-10-10', endDate: '', timeWindow: '' };
  let draft = applyPlanExample(state, { ...context, type: 'step-add', phase: 'change', values });
  draft = applyPlanExample(draft, { ...context, type: 'step-add', phase: 'cancel', values });
  assert.equal(draft.editor.open, false); assert.deepEqual(draft.editor.values, values); assert.equal(draft.steps, state.steps);
  const closed = capture({ editor: draft.editor }); assert.equal(fields(closed).length, 0);
  const calls = []; withText(capture({ editor: draft.editor, onIntent: intent => calls.push(intent) }), '新增步骤').props.onClick(); assert.deepEqual(calls[0].values, values);
  const added = applyPlanExample(draft, { ...context, type: 'step-add', phase: 'submit', values }); assert.equal(added.steps.at(-1).title, values.title); assert.equal(added.plan.tasks, state.plan.tasks); assert.equal(added.plan.execution, state.plan.execution);
  for (const type of ['confirm-core', 'request-create-tasks']) assert.equal(applyPlanExample(state, { ...context, type, stepIds: ['correction'] }), state);
  assert.equal(applyPlanExample(added, { ...context, type: 'step-remove', stepId: 'correction' }), added);
});

test('runtime has no business store, scheduling, timers, persistence, private models or local typography', async () => {
  const source = await readFile(new URL('../components/prism-next/agent-plan-builder.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /localStorage|sessionStorage|setTimeout|setInterval|ole-school-workbench|Date\.now|text-xs|text-sm|text-\[/);
  assert.match(source, /<LearningTaskList/); assert.match(source, /<MilestoneList/);
  const page = await readFile(new URL('../components/prism-next/demos/learning-components.tsx', import.meta.url), 'utf8'); assert.match(page, /<AgentPlanBuilderDemo\/>/);
});

test('plan module dependency graph excludes calendar implementations even before tree shaking', async () => {
  const graph = await build({ entryPoints: ['components/prism-next/agent-plan-builder.tsx'], absWorkingDir: root,
    bundle: true, metafile: true, write: false, jsx: 'automatic', platform: 'node', format: 'esm',
    packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' } });
  const dependencies = Object.entries(graph.metafile.inputs).flatMap(([path, input]) => [path, ...input.imports.map(entry => entry.path)]);
  assert.doesNotMatch(dependencies.join('\n'), /workload-calendar|react-day-picker|date-fns|coss\/calendar/);
});

test('omitting the calendar slot keeps milestones and steps without calendar placeholders', () => {
  for (const calendar of [undefined, null, false]) for (const density of ['default', 'compact']) {
    const html = htmlFor({ view: 'workspace', density, calendar,
      milestones: [{ id: 'opaque-phase', title: '阶段时间线', state: 'pending', detail: '阶段尚未完成' }] });
    assert.match(html, /阶段时间线/); assert.match(html, /阶段尚未完成/);
    for (const step of steps) assert.ok(html.includes(step.title));
    assert.doesNotMatch(html, /工作量日历|日历不可用|容量未知/);
  }
  const calendar = h('div', { 'data-calendar-slot': '' }, '页面提供的日历');
  assert.equal(occurrences(htmlFor({ view: 'workspace', calendar }), '页面提供的日历'), 1);
  assert.doesNotMatch(htmlFor({ view: 'inline', calendar }), /data-calendar-slot/);
});
