import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSubjectDemos, h, render, capture, button, layouts } from './subject-demos-test-utils.mjs';
const { AgentSimulationLab: Component, SubjectNumberControl, initialLabVariables, labSteps, labCapabilities, fixedCoinResult, AgentSimulationLabDemo, SimulationLabExample } = await loadSubjectDemos('lab');
const context = { labId: 'opaque-lab', version: 'opaque-version' };
const result = { ...fixedCoinResult(100), ...context, plot: undefined };
const base = { ...context, title: '课堂实验（模拟）', objective: '观察频率与概率。', steps: labSteps, currentStepId: 'prepare', variables: initialLabVariables,
  capabilities: labCapabilities, mobileSupport: { supported: true, reason: '数值与表格等效。' }, result: null, records: [], conclusionDraft: '', onIntent() {} };
const htmlFor = extra => render(h(Component, { ...base, ...extra }));
const probe = extra => capture(Component, { ...base, ...extra }, [SubjectNumberControl]);
const click = (nodes, label) => { const node = button(nodes, label); assert.ok(node, label); node.props.onClick({ currentTarget: {} }); return node; };

test('41 SSR both views and independent compact show objective/variables and explicit never-run state', () => {
  for (const layout of layouts) {
    const html = htmlFor(layout);
    for (const text of ['课堂实验（模拟）', '观察频率与概率。', '抛掷次数', '尚未运行', '移动端']) assert.ok(html.includes(text), text);
    assert.equal(html.includes('实验步骤'), layout.view === 'workspace'); assert.equal(html.includes('<textarea'), layout.view === 'workspace');
    assert.match(html, new RegExp(`data-density="${layout.density ?? 'default'}"`)); assert.doesNotMatch(html, /opaque-|宿主|意图|适配器/);
  }
});
test('41 run-request contains variable snapshot and version; component never generates result or running state', () => {
  const calls = [], extra = { view: 'workspace', onIntent: value => calls.push(value) }, before = htmlFor(extra), { nodes } = probe(extra);
  click(nodes, '运行实验');
  assert.deepEqual(calls, [{ ...context, type: 'run-request', variables: [{ variableId: 'trials', value: 100 }] }]);
  assert.equal(htmlFor(extra), before); assert.match(htmlFor(extra), /尚未运行/); assert.doesNotMatch(htmlFor(extra), />实验完成<|>运行中</);
});
test('41 numeric input and conclusion remain controlled; empty/invalid input blocks run and keyboard uses native number control', () => {
  const calls = [], { nodes } = probe({ view: 'workspace', onIntent: value => calls.push(value) });
  const input = nodes.find(node => node.props.type === 'number'); assert.equal(input.props.step, 10); assert.equal(input.props.min, 10);
  input.props.onChange({ target: { value: '1000' } }); input.props.onChange({ target: { value: '' } });
  nodes.find(node => node.props.id?.endsWith('-conclusion')).props.onChange({ target: { value: '  我的观察  ' } });
  assert.deepEqual(calls, [{ ...context, type: 'set-variable', variableId: 'trials', value: 1000 }, { ...context, type: 'set-variable', variableId: 'trials', value: null }, { ...context, type: 'record-note', text: '  我的观察  ' }]);
  for (const value of [null, NaN, Infinity, 0, 11, 1001]) {
    const blocked = probe({ view: 'workspace', variables: [{ ...initialLabVariables[0], value }], onIntent() { assert.fail('invalid run'); } });
    assert.equal(click(blocked.nodes, '运行实验').props.disabled, true);
  }
});
test('41 host result includes original inputs/provenance/text table and optional existing chart', () => {
  const html = htmlFor({ view: 'workspace', result, variables: [{ ...initialLabVariables[0], value: 1000 }] });
  assert.match(html, /100 次抛掷，正面 52 次/); assert.match(html, /运行时变量：抛掷次数 100 次/); assert.match(html, /结果来源：模拟/); assert.match(html, /<table/); assert.match(html, /0.52/);
  assert.doesNotMatch(htmlFor({ result }), /<table/);
  const plot = htmlFor({ view: 'workspace', result: { ...result, plot: fixedCoinResult(100).plot } });
  assert.match(plot, /查看数据与选择项目/); assert.match(plot, /本次正面频率（模拟）/);
});
test('41 absent or mismatched results remain unknown, never mislabel never-run or reveal old result', () => {
  for (const item of [undefined, { ...result, labId: 'other' }, { ...result, version: 'old' }, { ...result, summary: '' }]) {
    const html = htmlFor({ result: item }); assert.match(html, /未知：最近结果/); assert.doesNotMatch(html, /尚未运行|52 次/);
  }
  assert.match(htmlFor({ result: { ...result, source: { kind: 'external-tool', label: '测量工具' } } }), /结果来源：外部工具/);
});
test('41 step, note, export and navigation carry identity; export needs a valid supplied result', () => {
  const calls = [], capabilities = { ...labCapabilities, export: { supported: true } };
  const { nodes } = probe({ view: 'workspace', result, capabilities, onIntent: value => calls.push(value), onBack: value => calls.push(value) });
  click(nodes, '查看结果'); click(nodes, '请求导出'); click(nodes, '返回原位置');
  assert.deepEqual(calls, [{ ...context, type: 'step', stepId: 'observe' }, { ...context, type: 'request-export' }, context]);
  const trigger = {}; button(probe({ onExpand: (...args) => calls.push(args) }).nodes, '打开实验').props.onClick({ currentTarget: trigger }); assert.deepEqual(calls.at(-1), [trigger, context]);
  assert.equal(click(probe({ view: 'workspace', capabilities, onIntent() { assert.fail('no result'); } }).nodes, '请求导出').props.disabled, true);
});
test('41 unsupported operations have no action, readonly/identity/leave restrictions guard handlers', () => {
  for (const restriction of [{ labId: '' }, { version: '' }, { readOnlyReason: '' }, { onIntent: undefined }, { steps: [labSteps[0], labSteps[0]] }]) {
    const { nodes } = probe({ view: 'workspace', onIntent() { assert.fail('blocked'); }, ...restriction });
    assert.equal(click(nodes, '运行实验').props.disabled, true); assert.equal(click(nodes, '确定次数').props.disabled, true);
    nodes.find(node => node.props.id?.endsWith('-conclusion')).props.onChange({ target: { value: 'forbidden' } });
  }
  const capabilities = Object.fromEntries(Object.keys(labCapabilities).map(key => [key, { supported: false, reason: '共同限制。' }]));
  const { nodes, html } = probe({ view: 'workspace', capabilities, onIntent() { assert.fail('unsupported'); } });
  for (const label of ['运行实验', '请求导出', '查看结果']) assert.equal(button(nodes, label), undefined);
  nodes.find(node => node.props.id?.endsWith('-conclusion')).props.onChange({ target: { value: 'forbidden' } });
  assert.equal(html.split('共同限制。').length - 1, 1);
  const back = probe({ view: 'workspace', backDisabledReason: '', onBack() { assert.fail('leave blocked'); } }); assert.equal(click(back.nodes, '返回原位置').props.disabled, true);
});
test('41 unknown and capability copy merged once; records externally provided and scope-filtered', () => {
  for (const layout of layouts) {
    const html = htmlFor({ ...layout, result: undefined, records: undefined, currentStepId: null, details: 'HIDDEN_DETAIL' });
    assert.equal(html.split('未知：').length - 1, 1); assert.equal(html.split('本示例未提供导出文件。').length - 1, 1);
    assert.equal(html.split('运行请求不代表实验完成').length - 1, 1); assert.doesNotMatch(html, /HIDDEN_DETAIL/);
  }
  const html = htmlFor({ view: 'workspace', records: [{ ...context, version: 'previous', label: '上次记录', text: '当时结论' }, { ...context, labId: 'other', label: 'SECRET', text: 'SECRET' }] });
  assert.match(html, /当时结论/); assert.doesNotMatch(html, /SECRET/);
});
test('41 ARIA references and fixed labels resolve; fixed host mapping cannot compute arbitrary experiments', () => {
  const { nodes, html } = probe({ view: 'workspace' });
  for (const node of nodes) for (const attr of ['aria-labelledby', 'aria-describedby']) for (const id of (node.props[attr] ?? '').split(' ').filter(Boolean)) assert.ok(html.includes(`id="${id}"`), id);
  for (const node of nodes.filter(node => node.props.type === 'number' || node.props.id?.endsWith('-conclusion'))) assert.ok(html.includes(`for="${node.props.id}"`));
  assert.equal(fixedCoinResult(20), undefined); assert.equal(fixedCoinResult(10).source.kind, 'simulation');
  assert.match(render(h(AgentSimulationLabDemo)), /id="simulation-lab"/); assert.match(render(h(SimulationLabExample, { compact: true, narrow: true })), /max-w-\[320px\]/);
});
