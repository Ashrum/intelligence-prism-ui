import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = new URL('../.sites-runtime/calc-tool/', import.meta.url);
await mkdir(runtime, { recursive: true });
const file = new URL('test-bundle.mjs', runtime);
await writeFile(file, (await build({ stdin: { contents: `export * from './components/prism-next/agent-calc-tool'; export * from './components/prism-next/demos/agent-calc-tool';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false })).outputFiles[0].text);
const { AgentCalcTool, AgentCalcToolDemo, CalcToolExample, calcExamples, calcCapabilities } = await import(file);
await rm(file);
const h = React.createElement;
const context = { toolSessionId: 'opaque-session', version: 'opaque-version' };
const result = { ...calcExamples[0], ...context, plot: undefined };
const base = { ...context, expression: result.expression, mode: result.mode, capabilities: calcCapabilities, result, history: [result], onIntent() {} };
const layouts = [{}, { view: 'workspace' }, { density: 'compact' }, { view: 'workspace', density: 'compact' }];
const htmlFor = extra => render(h(AgentCalcTool, { ...base, ...extra }));
const textOf = node => typeof node === 'string' ? node : Array.isArray(node) ? node.map(textOf).join('') : React.isValidElement(node) ? textOf(node.props.children) : '';
function capture(extra = {}) {
  const nodes = [];
  function inspect(node) {
    if (Array.isArray(node)) return node.map(inspect);
    if (!React.isValidElement(node)) return node;
    if (node.type === AgentCalcTool) return h(function Probe() { return inspect(AgentCalcTool(node.props)); });
    nodes.push(node);
    return React.cloneElement(node, {}, React.Children.map(node.props.children, inspect));
  }
  const html = render(inspect(h(AgentCalcTool, { ...base, ...extra })));
  return { nodes, html };
}
const button = (nodes, label) => nodes.find(node => node.props.onClick && textOf(node.props.children) === label);
const input = nodes => nodes.find(node => node.props.id?.endsWith('-expression'));
const click = (nodes, label) => { const b = button(nodes, label); assert.ok(b, label); b.props.onClick({ currentTarget: {} }); return b; };
const expectedInput = { ...context, expression: base.expression, mode: base.mode };

test('SSR both views and independent compact preserve results, sources, restrictions and text equivalents', () => {
  for (const layout of layouts) {
    const html = htmlFor(layout);
    for (const text of ['结果摘要', result.text, '模拟结果', '单位：无量纲', '与题目答案对比：一致', '绘图工具尚未接入。']) assert.ok(html.includes(text), text);
    assert.match(html, new RegExp(`data-density="${layout.density ?? 'default'}"`));
    assert.equal(html.includes('本次会话历史'), layout.view === 'workspace');
    assert.equal(html.includes('<textarea'), layout.view === 'workspace');
    assert.doesNotMatch(html, /opaque-|宿主|回调|意图/);
  }
});
test('missing, empty and mismatched result identities/input/mode/version never expose old facts or insertion', () => {
  const stale = [undefined, { ...result, text: '' }, ...Object.entries({ toolSessionId: 'old', version: 'old', expression: 'other', mode: 'solve' }).map(([key, value]) => ({ ...result, [key]: value }))];
  for (const item of stale) {
    const extra = { view: 'workspace', result: item, history: [], onIntent() { assert.fail('unknown result action'); } };
    const { nodes, html } = capture(extra);
    assert.match(html, /结果未知/); assert.match(html, /与题目答案对比：无法判断/); assert.doesNotMatch(html, /顶点为|函数采样图/);
    assert.equal(click(nodes, '插入到题目答案').props.disabled, true);
    assert.equal(click(nodes, '与题目答案对比').props.disabled, true);
  }
});
test('comparison three states are supplied, never inferred from equal-looking strings', () => {
  for (const [state, label] of [['consistent', '一致'], ['inconsistent', '不一致'], ['unknown', '无法判断']]) {
    assert.ok(htmlFor({ result: { ...result, comparison: { state, answer: result.text } } }).includes(`与题目答案对比：${label}`));
  }
  assert.match(htmlFor({ result: { ...result, comparison: undefined } }), /与题目答案对比：无法判断/);
});
test('unsupported mode blocks evaluate and mode change handlers in both views', () => {
  for (const view of ['inline', 'workspace']) {
    const { nodes, html } = capture({ view, mode: 'plot', onIntent() { assert.fail('unsupported'); } });
    assert.match(html, /绘图工具尚未接入/);
    assert.equal(click(nodes, '函数绘图').props.disabled, true);
    assert.equal(click(nodes, '计算').props.disabled, true);
  }
});
test('evaluate, insert, compare and clear carry exact session/version and do not mutate supplied facts', () => {
  const calls = [], extra = { view: 'workspace', onIntent: value => calls.push(value) };
  const before = htmlFor(extra), { nodes } = capture(extra);
  for (const label of ['计算', '插入到题目答案', '插入到题目解析', '与题目答案对比', '清空历史']) click(nodes, label);
  assert.deepEqual(calls, [{ ...expectedInput, type: 'evaluate' }, { ...expectedInput, type: 'insert-result', target: 'answer' },
    { ...expectedInput, type: 'insert-result', target: 'explanation' }, { ...expectedInput, type: 'compare-with-answer' }, { ...context, type: 'clear-history' }]);
  assert.equal(htmlFor(extra), before);
});
test('Enter inline and Ctrl/Cmd+Enter in workspace equal button; IME, repeat and ordinary multiline Enter do not submit', () => {
  for (const view of ['inline', 'workspace']) {
    const calls = [], { nodes } = capture({ view, onIntent: intent => calls.push(intent) }), editor = input(nodes);
    const key = extra => editor.props.onKeyDown({ key: 'Enter', nativeEvent: {}, preventDefault() {}, ...extra });
    click(nodes, '计算'); const wanted = calls[0]; calls.length = 0;
    key({ ctrlKey: true }); key({ metaKey: true }); if (view === 'inline') key({});
    assert.deepEqual(calls, Array(view === 'inline' ? 3 : 2).fill(wanted)); calls.length = 0;
    for (const extra of [{ nativeEvent: { isComposing: true }, ctrlKey: true }, { nativeEvent: { keyCode: 229 }, ctrlKey: true }, { repeat: true }, { altKey: true }, { shiftKey: true }, { key: 'Escape' }]) key(extra);
    if (view === 'workspace') key({});
    assert.deepEqual(calls, []);
  }
});
test('controlled input and mode changes use one intent path; old result becomes unknown after host accepts change', () => {
  const calls = [], { nodes } = capture({ onIntent: intent => calls.push(intent) });
  input(nodes).props.onChange({ target: { value: '  x + 1  ' } }); click(nodes, '化简');
  assert.deepEqual(calls, [{ ...context, type: 'change-input', expression: '  x + 1  ', mode: 'evaluate' }, { ...expectedInput, type: 'change-input', mode: 'simplify' }]);
  assert.match(htmlFor({ expression: '  x + 1  ' }), /结果未知/);
});
test('missing callback/context, read-only, whitespace and operation restrictions guard direct handlers', () => {
  for (const restriction of [{ onIntent: undefined }, { toolSessionId: '' }, { version: '' }, { disabledReason: '' }, { disabledReason: '版本已变化。' }]) {
    const { nodes } = capture({ view: 'workspace', onIntent() { assert.fail('blocked'); }, ...restriction });
    for (const label of ['计算', '插入到题目答案', '与题目答案对比', '清空历史']) assert.equal(click(nodes, label).props.disabled, true);
  }
  const { nodes } = capture({ expression: ' ', onIntent() { assert.fail('empty'); } }); assert.equal(click(nodes, '计算').props.disabled, true);
  const limited = capture({ view: 'workspace', insertDisabledReason: '', compareDisabledReason: '', onIntent() { assert.fail('restricted'); } });
  assert.equal(click(limited.nodes, '插入到题目解析').props.disabled, true); assert.equal(click(limited.nodes, '与题目答案对比').props.disabled, true);
});
test('history remains host-owned, ignores other sessions and distinguishes absent from empty', () => {
  assert.match(htmlFor({ view: 'workspace', history: undefined }), /历史未提供/);
  assert.match(htmlFor({ view: 'workspace', history: [] }), /暂无本次会话记录/);
  assert.doesNotMatch(htmlFor({ view: 'workspace', history: [{ ...result, toolSessionId: 'other', text: 'SECRET' }] }), /SECRET/);
  assert.match(htmlFor({ view: 'workspace', history: [{ ...result, version: 'previous', text: '当时结果' }] }), /当时结果/);
});
test('source/units remain unknown when absent; local, external and simulated provenance distinguished', () => {
  assert.match(htmlFor({ result: { ...result, unit: undefined, source: undefined } }), /单位：未知/);
  assert.match(htmlFor({ result: { ...result, source: undefined } }), /是否模拟：未知/);
  for (const [kind, label] of [['local-rule', '本机规则'], ['external-tool', '外部工具'], ['simulation', '模拟']])
    assert.ok(htmlFor({ result: { ...result, source: { kind } } }).includes(`计算结果来自${label}，请核对后使用。`));
});
test('one boundary and identical capability reasons merged; details collapsed and critical facts retained in compact', () => {
  for (const layout of layouts) {
    const html = htmlFor({ ...layout, details: 'HIDDEN_DETAIL', capabilities: { ...calcCapabilities, solve: { supported: false, reason: '共同限制。' }, plot: { supported: false, reason: '共同限制。' } } });
    assert.equal(html.split('请核对后使用。').length - 1, 1); assert.equal(html.split('共同限制。').length - 1, 1);
    assert.doesNotMatch(html, /HIDDEN_DETAIL|仅预览排版/);
  }
});
test('supplied numeric sample points only render in workspace and text table is present; no points means no chart', () => {
  const withPlot = { ...result, plot: calcExamples[0].plot };
  assert.doesNotMatch(htmlFor({ result: withPlot }), /函数采样图/);
  const html = htmlFor({ view: 'workspace', result: withPlot }); assert.match(html, /函数采样图/); assert.match(html, /查看数据与选择项目/); assert.match(html, /点一/);
  assert.doesNotMatch(htmlFor({ view: 'workspace', result }), /函数采样图/);
  assert.match(htmlFor({ view: 'workspace', result: { ...withPlot, plot: { ...withPlot.plot, data: [] } } }), /尚无数据点/);
});
test('MathContent-compatible preview requires exact expression binding; navigation retains context and trigger', () => {
  assert.match(htmlFor({ inputPreview: { expression: base.expression, content: h('math', { 'aria-label': '二次函数' }, h('mi', {}, 'x')) } }), /<math/);
  assert.doesNotMatch(htmlFor({ inputPreview: { expression: 'old', content: 'STALE_PREVIEW' } }), /STALE_PREVIEW/);
  const calls = [], trigger = {};
  button(capture({ onExpand: (...args) => calls.push(args) }).nodes, '查看计算过程').props.onClick({ currentTarget: trigger });
  click(capture({ view: 'workspace', onBack: value => calls.push(value) }).nodes, '返回原位置');
  assert.deepEqual(calls, [[trigger, context], context]);
});
test('ARIA input labels and references resolve; demo supplies all three comparisons and narrow/compact fixtures', () => {
  for (const layout of layouts) {
    const { nodes, html } = capture(layout);
    for (const node of nodes) for (const attr of ['aria-labelledby', 'aria-describedby']) for (const id of (node.props[attr] ?? '').split(' ').filter(Boolean)) assert.ok(html.includes(`id="${id}"`), id);
    assert.ok(html.includes(`for="${input(nodes).props.id}"`));
  }
  const demo = render(h(AgentCalcToolDemo)); assert.match(demo, /id="calc-tool"/);
  for (const label of ['与题目答案对比：一致', '与题目答案对比：不一致', '与题目答案对比：无法判断']) assert.ok(demo.includes(label));
  assert.match(render(h(CalcToolExample, { index: 2, narrow: true })), /max-w-\[320px\]/);
});
