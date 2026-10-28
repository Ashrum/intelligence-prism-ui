import { assertP121Migration } from './helpers/p121-freeze-compat.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = new URL('../.sites-runtime/p109/', import.meta.url);
await mkdir(runtime, { recursive: true });
async function bundle(contents, name, resolveDir = root) {
  const result = await build({ stdin: { contents, resolveDir, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false });
  const path = new URL(`${name}.mjs`, runtime);
  await writeFile(path, result.outputFiles[0].text);
  try { return await import(path); } finally { await rm(path); }
}
// Verbatim source from Git 34e114ce162363966c00fb691f93754317ffc1b9.
// Stored independently so shallow checkouts do not need historical Git objects.
const frozen = await readFile(new URL('fixtures/p109/agent-suggestion-set-34e114c.txt', import.meta.url), 'utf8');
const baseline = await bundle(frozen, 'baseline', `${root}components/prism-next`);
const { AgentSuggestionSet, learningAnalysisLabels, LearningAnalysisSuggestionExample } = await bundle(`export * from './components/prism-next/agent-suggestion-set'; export * from './components/prism-next/demos/agent-suggestion-set';`, 'current');
const h = React.createElement;
const item = { id: 's1', title: '核对配方', content: '对照每一步', reason: '保留解释过程', evidence: { summary: '示例依据' }, source: '示例来源', scope: 'scope-value', impact: 'impact-value', certainty: 'certainty-value', task: { state: 'created', description: 'task-description' }, status: { state: 'pending' }, adopt: {}, dismiss: { reason: '' }, adjustment: { open: false, fields: [{ id: 'plan', label: '安排', type: 'text', value: '先解释' }] } };
const base = { title: '建议', suggestionSet: { id: 'set', version: 'v1' }, suggestions: [item], selectedIds: [], receipt: { state: 'idle' }, adopt: {}, comparison: { selectedIds: [], open: false }, onIntent() {}, onExpand() {}, onBack() {} };
const html = extra => render(h(AgentSuggestionSet, { ...base, ...extra }));
const modes = ['inline', 'workspace'].flatMap(view => ['default', 'compact'].map(density => ({ view, density })));

test('frozen reference source fingerprint is unchanged', () => {
  assert.equal(createHash('sha256').update(frozen).digest('hex'), 'a7622e8c202bd99edcf27b632b2b5e8b8c585a84a2c1a94d4d60b3c221d2bee0');
});

test('default SSR is byte-for-byte identical to 34e114c across states, views, densities and guards', () => {
  const states = ['pending', 'adopted', 'adjusted', 'dismissed', 'expired', 'unconfirmed'];
  for (const mode of modes) for (const state of states) for (const open of [false, true]) for (const unknown of [false, true]) {
    const suggestion = { ...item, status: { state, reason: '状态原因' }, adjustment: { ...item.adjustment, open }, ...(unknown ? { reason: null, scope: null, impact: null, certainty: null, evidence: null, source: null, task: undefined } : {}) };
    const props = { ...base, ...mode, suggestions: [suggestion, { ...suggestion, id: 's2' }, { id: 'restricted', status: { state: 'restricted' }, disclosure: { title: '受限', reason: '不可查看' } }], selectedIds: ['s1'], comparison: { selectedIds: ['s1', 's2'], open } };
    assertP121Migration(render(h(AgentSuggestionSet, props)), render(h(baseline.AgentSuggestionSet, props)), `P109/${mode.view}/${mode.density}/${state}/${open}/${unknown}`);
    assertP121Migration(render(h(AgentSuggestionSet, { ...props, labels: {}, visibleFields: {} })), render(h(baseline.AgentSuggestionSet, props)), `P109/${mode.view}/${mode.density}/${state}/${open}/${unknown}`);
  }
  for (const extra of [{ suggestionSet: { ...base.suggestionSet, snapshot: true } }, { onIntent: undefined }, { receipt: { state: 'pending' } }, { receipt: { state: 'unconfirmed' } }, { suggestions: [] }, { disabledReason: '' }]) {
    assert.equal(html(extra), render(h(baseline.AgentSuggestionSet, { ...base, ...extra })));
  }
});

test('all decision text including accessible names, guard messages and expansion can be replaced', () => {
  for (const mode of modes) for (const state of ['pending', 'adopted', 'adjusted', 'dismissed']) for (const open of [false, true]) {
    const output = html({ ...mode, labels: learningAnalysisLabels, selectedIds: ['s1'], suggestions: [{ ...item, status: { state }, adjustment: { ...item.adjustment, open } }] });
    assert.doesNotMatch(output, /驳回|调整/);
    assert.match(output, /aria-label="暂不采纳：核对配方"/);
    assert.match(output, /aria-label="采纳：核对配方"/);
    if (mode.view === 'workspace') {
      assert.match(output, /暂不采纳原因（可选）/);
      assert.match(output, open ? /aria-label="改后采纳建议"/ : /aria-label="改后采纳：核对配方"/);
      if (open) for (const text of ['修改草稿', '提交改后采纳', '收起修改']) assert.ok(output.includes(text));
    }
    if (state === 'adjusted') assert.match(output, /已改后采纳/);
    if (state === 'dismissed') assert.match(output, /此建议暂不采纳。/);
  }
  for (const extra of [{ suggestions: [{ ...item, adjustment: { open: true, fields: [] } }] }, { comparison: { selectedIds: [], open: false, disabledReason: '' } }]) {
    assert.doesNotMatch(html({ view: 'workspace', labels: learningAnalysisLabels, ...extra }), /调整|驳回/);
  }
  // A single override does not erase other defaults; explicit undefined also falls back.
  const partial = html({ labels: { dismiss: '稍后决定', adjusted: undefined }, suggestions: [{ ...item, status: { state: 'adjusted' } }] });
  assert.match(partial, /稍后决定：核对配方/); assert.match(partial, /已调整/);
  assert.equal(html({ labels: { adjust: undefined } }), html({}));
});

test('each hidden field is absent, including values, unknown summaries and task descriptions; reason/evidence stay', () => {
  const names = { scope: ['适用对象／范围', 'scope-value'], impact: ['预期影响／代价', 'impact-value'], certainty: ['确定性', 'certainty-value'], task: ['任务已创建', 'task-description'] };
  for (const mode of modes) for (const key of Object.keys(names)) {
    const output = html({ ...mode, visibleFields: { [key]: false } });
    for (const text of names[key]) assert.ok(!output.includes(text), text);
    for (const other of Object.keys(names).filter(value => value !== key)) for (const text of names[other]) assert.ok(output.includes(text), text);
    assert.match(output, /理由/); assert.match(output, /示例依据/);
  }
  for (const mode of modes) for (const unknown of [false, true]) {
    const output = html({ ...mode, visibleFields: { scope: false, impact: false, certainty: false, task: false }, suggestions: [{ ...item, ...(unknown ? { reason: null, scope: null, impact: null, certainty: null, task: undefined } : {}) }] });
    assert.doesNotMatch(output, /适用对象／范围|预期影响／代价|确定性|任务状态未确认|task-description/);
    assert.match(output, unknown ? /理由：未提供/ : /保留解释过程/); assert.match(output, /示例依据/);
  }
  assert.equal(html({ visibleFields: { scope: true, impact: true, certainty: true, task: true } }), html({}));
});

// Capture actual component handlers; no alternate implementation of intent logic.
function capture(extra) {
  const nodes = [], owned = new Set(['AgentSuggestionSet', 'SuggestionButton', 'SuggestionField', 'SuggestionEvidence', 'RecordDetails']);
  function inspect(node) {
    if (Array.isArray(node)) return node.map(inspect);
    if (!React.isValidElement(node)) return node;
    nodes.push(node);
    if (typeof node.type === 'function' && owned.has(node.type.name)) return h(function Probe() { return inspect(node.type(node.props)); });
    return React.cloneElement(node, {}, React.Children.map(node.props.children, inspect));
  }
  render(inspect(h(AgentSuggestionSet, { ...base, ...extra })));
  return nodes;
}
function click(nodes, text) {
  const node = nodes.find(node => node.props.onClick && (node.props['aria-label'] === text || node.props.children === text));
  assert.ok(node, text); node.props.onClick();
}

test('configured controls emit unchanged version-bound decision payloads and retain receipt guards', () => {
  const calls = [], config = { view: 'workspace', labels: learningAnalysisLabels, visibleFields: { scope: false, impact: false, certainty: false, task: false }, onIntent: event => calls.push(event) };
  const nodes = capture(config);
  click(nodes, '采纳：核对配方'); click(nodes, '改后采纳：核对配方'); click(nodes, '暂不采纳：核对配方');
  const open = capture({ ...config, suggestions: [{ ...item, adjustment: { ...item.adjustment, open: true } }] });
  const field = open.find(node => node.props.value === '先解释' && node.props.onChange);
  field.props.onChange({ currentTarget: { value: '  修改  ' } });
  click(open, '提交改后采纳'); click(open, '收起修改');
  const reason = open.find(node => node.props.value === '' && node.props.onChange);
  reason.props.onChange({ currentTarget: { value: '  暂缓  ' } });
  const envelope = { suggestionSetId: 'set', baseVersion: 'v1' };
  assert.deepEqual(calls, [
    { ...envelope, type: 'adopt', suggestionIds: ['s1'], scope: 'item' },
    { ...envelope, type: 'adjust', suggestionId: 's1', phase: 'start', values: { plan: '先解释' } },
    { ...envelope, type: 'dismiss', suggestionId: 's1', phase: 'submit', reason: '' },
    { ...envelope, type: 'adjust', suggestionId: 's1', phase: 'change', values: { plan: '  修改  ' } },
    { ...envelope, type: 'adjust', suggestionId: 's1', phase: 'submit', values: { plan: '先解释' } },
    { ...envelope, type: 'adjust', suggestionId: 's1', phase: 'cancel', values: { plan: '先解释' } },
    { ...envelope, type: 'dismiss', suggestionId: 's1', phase: 'reason', reason: '  暂缓  ' },
  ]);
  for (const state of ['pending', 'unconfirmed']) {
    const blocked = capture({ ...config, receipt: { state } });
    for (const text of ['采纳：核对配方', '改后采纳：核对配方', '暂不采纳：核对配方']) click(blocked, text);
  }
  assert.equal(calls.length, 7);
});

test('learning analysis demo exposes the host wording and no inapplicable detail fields', () => {
  const output = render(h(LearningAnalysisSuggestionExample));
  assert.match(output, /改后采纳：/); assert.match(output, /暂不采纳：/);
  assert.doesNotMatch(output, /驳回|调整|任务状态未确认|预期影响／代价|适用对象／范围/);
  assert.match(output, /载入决定回执（示例）/);
});


test('independent adoption and status overrides also update batch and accessible labels', () => {
  for (const state of ['adopted', 'adjusted', 'dismissed']) {
    const output = html({ view: 'workspace', selectedIds: ['s1'], labels: { adopt: '确认采用', adoptSelected: '确认采用所选', adopted: '采用完成', adjusted: '修改完成', dismissed: '搁置完成', alreadyAdopted: '已经采用', alreadyDismissed: '已经搁置' }, suggestions: [{ ...item, status: { state } }] });
    assert.match(output, /aria-label="确认采用：核对配方"/);
    assert.match(output, /确认采用所选/);
    assert.ok(output.includes({ adopted: '采用完成', adjusted: '修改完成', dismissed: '搁置完成' }[state]));
    if (state === 'adopted') assert.match(output, /已经采用/);
    if (state === 'dismissed') assert.match(output, /已经搁置/);
  }
});

test('hiding known fields preserves the remaining reason node structure', () => {
  const output = html({ suggestions: [{ ...item, reason: null }], visibleFields: { scope: false, impact: false, certainty: false } });
  assert.match(output, /<dt class="text-ui-action">理由<\/dt><dd class="whitespace-pre-wrap break-words">未提供<\/dd>/);
});
