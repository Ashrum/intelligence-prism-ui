import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createTestRuntime } from './helpers/test-runtime.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = await createTestRuntime('p159');
const h = React.createElement;
const render = (component, props) => renderToStaticMarkup(h(component, props));
async function bundle(name, plugins = [], extra = '') {
  const result = await build({
    stdin: { contents: `export * from './components/prism-next/blueprint/blueprint'; ${extra}`, loader: 'tsx', resolveDir: root },
    bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, write: false, plugins,
  });
  const url = new URL(`${name}.mjs`, runtime);
  writeFileSync(url, result.outputFiles[0].text);
  return import(url);
}
const before = await bundle('before', [{ name: 'baseline-0af76ed', setup(builder) {
  builder.onLoad({ filter: /prism-next\/blueprint\/.*\.tsx$/ }, args => ({ contents: execFileSync('git', ['show', `0af76ed:${args.path.slice(root.length)}`], { cwd: root, encoding: 'utf8' }), loader: 'tsx' }));
} }]);
const after = await bundle('after');

// Execute the production hooks with deterministic state, effects, frames and timers.
const hookHost = `
let slots = [], cursor = 0, effects = new Map(), dirty = false, hook, args, value;
export function useState(initial) {
  const index = cursor++;
  if (!slots[index]) slots[index] = { value: typeof initial === 'function' ? initial() : initial };
  return [slots[index].value, next => {
    const value = typeof next === 'function' ? next(slots[index].value) : next;
    if (!Object.is(value, slots[index].value)) { slots[index].value = value; dirty = true; }
  }];
}
export function useRef(initial) { const index = cursor++; return slots[index] ?? (slots[index] = { current: initial }); }
export function useId() { return useRef('p159-' + cursor).current; }
export function useCallback(fn, deps) {
  const index = cursor++, old = slots[index];
  if (!old || deps.some((value, i) => !Object.is(value, old.deps[i]))) slots[index] = { value: fn, deps };
  return slots[index].value;
}
export function useEffect(fn, deps) {
  const index = cursor++, old = slots[index];
  if (!old || deps.some((value, i) => !Object.is(value, old.deps[i]))) effects.set(index, () => {
    old?.cleanup?.(); slots[index] = { deps, cleanup: fn() };
  });
}
export function run(fn, ...input) { hook = fn; args = input; return flush(); }
export function flush() {
  let renders = 0;
  do {
    if (++renders > 30) throw new Error('hook render loop');
    dirty = false; cursor = 0; value = hook(...args);
    if (dirty) continue;
    const pending = [...effects.values()]; effects.clear(); pending.forEach(fn => fn());
  } while (dirty);
  return value;
}
export function reset() { slots.forEach(slot => slot.cleanup?.()); slots = []; effects.clear(); dirty = false; }
`;
const hooks = await bundle('hooks', [{ name: 'p159-hooks', setup(builder) {
  builder.onResolve({ filter: /^p159-hook-host$/ }, () => ({ path: 'hooks', namespace: 'p159' }));
  builder.onLoad({ filter: /.*/, namespace: 'p159' }, () => ({ contents: hookHost, loader: 'js' }));
  builder.onLoad({ filter: /blueprint\/(progress|decision)\.tsx$/ }, args => {
    const contents = readFileSync(args.path, 'utf8').replace(/import \{([^}]+)\} from "react"/, (_, imports) => {
      const names = imports.split(',').map(name => name.trim());
      const fake = names.filter(name => /^(useState|useRef|useEffect|useId|useCallback)$/.test(name));
      const real = names.filter(name => !fake.includes(name));
      return `import { ${fake.join(', ')} } from "p159-hook-host"; import { ${real.join(', ')} } from "react"`;
    });
    return { contents, loader: 'tsx' };
  });
} }], 'export { run, flush, reset } from "p159-hook-host";');

const legacyCases = [
  ['BpToast', { children: '已保存' }],
  ['BpStat', { label: '得分率', value: '76.0', unit: '%', caption: '有效 45 人' }],
  ['BpStat', { label: '得分率', value: '76.0', size: 'metric', children: h('i', null, '构成条') }],
  ['BpSizeBar', { rows: [{ id: 'a', label: '已处理', total: 45, segments: [{ id: 'done', label: '完成', value: 18, fill: 'ai' }, { id: 'rest', label: '剩余', value: 27, fill: 'hatch-ai' }] }] }],
  ['BpSteps', { steps: [{ id: 'a', label: '接收' }, { id: 'b', label: '识别' }], current: 1 }],
  ...['line', 'block', 'stat', 'row'].map(shape => ['BpSkeleton', { shape }]),
  ...['short', 'mid', 'long'].map(tier => ['BpWorking', { tier, step: '正在批阅', done: 18, total: 45 }]),
  ['BpUndoToast', { children: '已删除', duration: 1234, action: h('button', null, '撤销') }],
  ['BpCaret', {}],
];
const paneProps = { refCode: 'R1', title: '批阅 · 数学 · 间隔复查（九年级（1）班）', meta: '结果 v1', tabs: '页签', footer: '主操作', children: '正文', grid: true, onExpand() {}, onClose() {}, position: { current: 1, total: 3, onNext() {} } };
for (const theme of ['light', 'paper', 'dark', 'blueprint', 'blueprint-night']) test(`P159 ${theme}: p149 cases and p158 pane bytes equal 0af76ed`, () => {
  const themed = (api, name, props) => renderToStaticMarkup(h('div', { 'data-prism-theme': theme }, h(api[name], props)));
  for (const [name, props] of legacyCases) assert.equal(themed(after, name, props), themed(before, name, props), name);
  for (const props of [{ title: '任务', children: '正文' }, paneProps, { ...paneProps, expanded: true }]) {
    for (const nav of [undefined, null, h(after.BpButton, { size: 'sm' }, '层级 ▾')]) {
      for (const extra of [{}, { className: 'host-pane', 'aria-label': '任务右栏', 'data-host': 'pane', bodyProps: { className: 'host-body', 'data-workspace-scroll': 'true', tabIndex: -1, 'aria-label': '任务正文', children: '不得覆盖正文' } }]) {
        const full = { ...props, nav, ...extra };
        assert.equal(themed(after, 'BpObjectPane', full), themed(before, 'BpObjectPane', full));
      }
    }
  }
});

test('P159 elapsed formatting handles second/minute boundaries and invalid values', () => {
  for (const [ms, expected] of [[0, '0 s'], [9999, '9 s'], [10000, '10 s'], [59999, '59 s'], [60000, '1 分 00 s'], [65000, '1 分 05 s'], [-1, ''], [NaN, ''], [Infinity, '']]) assert.equal(after.formatBpElapsed(ms), expected);
});
test('P159 elapsed threshold, completed facts without intervals, changed origin and cleanup', t => {
  t.mock.timers.enable({ apis: ['setInterval', 'Date'], now: 0 });
  const interval = t.mock.method(globalThis, 'setInterval');
  try {
    assert.equal(hooks.run(hooks.BpElapsed, { startedAt: 0 }), null);
    t.mock.timers.tick(9999); assert.equal(hooks.flush(), null);
    t.mock.timers.tick(1); assert.equal(hooks.flush().props.children, '10 s');
    assert.equal(interval.mock.callCount(), 1);
    hooks.reset(); interval.mock.resetCalls();
    assert.equal(hooks.run(hooks.BpElapsed, { startedAt: 0, endedAt: 7000 }).props.children, '7 s');
    assert.equal(interval.mock.callCount(), 0);
    assert.equal(hooks.run(hooks.BpElapsed, { startedAt: 10000, threshold: 1000 }), null);
    t.mock.timers.tick(1000); assert.equal(hooks.flush().props.children, '1 s');
    assert.equal(render(after.BpElapsed, { startedAt: 0 }), '');
    assert.match(render(after.BpElapsed, { startedAt: 0, endedAt: 0 }), /aria-hidden="true"[^>]*>0 s/);
  } finally { hooks.reset(); }
});
test('P159 auto expand A success, B failure, C manual priority and reset', () => {
  try {
    assert.equal(hooks.run(hooks.useBpAutoExpand, false, 'a').open, false);
    hooks.flush().toggle(); assert.equal(hooks.flush().open, true);
    hooks.flush().toggle(); assert.equal(hooks.flush().open, false);
    hooks.reset();
    assert.equal(hooks.run(hooks.useBpAutoExpand, false, 'b').open, false);
    assert.equal(hooks.run(hooks.useBpAutoExpand, true, 'b').open, true);
    hooks.flush().toggle(); assert.equal(hooks.flush().open, false);
    hooks.run(hooks.useBpAutoExpand, false, 'b');
    assert.equal(hooks.run(hooks.useBpAutoExpand, true, 'b').open, false);
    assert.equal(hooks.run(hooks.useBpAutoExpand, true, 'new').open, false);
    hooks.run(hooks.useBpAutoExpand, false, 'new');
    assert.equal(hooks.run(hooks.useBpAutoExpand, true, 'new').open, true);
    hooks.reset();
    assert.equal(hooks.run(hooks.useBpAutoExpand, true).open, true);
  } finally { hooks.reset(); }
});
const steps = [
  { id: 'a', label: '识别意图', state: 'done', durationMs: 1000 },
  { id: 'b', label: '组织答复', state: 'running', durationMs: 6000 },
  { id: 'c', label: '检查公式 x² + y²', state: 'pending' },
];
test('P159 collapse keeps hidden descendants inert and links disclosures', () => {
  const html = render(after.BpCollapse, { open: false, id: 'details', children: h('button', null, '重试') });
  assert.match(html, /grid-rows-\[0fr\]/); assert.match(html, /inert="" aria-hidden="true"/);
  assert.doesNotMatch(render(after.BpCollapse, { open: true, children: '正文' }), /inert=|aria-hidden=/);
});
test('P159 five step statuses SSR and host labels, facts and actions', () => {
  const expected = { preparing: '正在组织答复', answering: '用了 1 步 · 正在组织答复', done: '用了 3 步 ·', error: '1 步失败 · 用了 7 s', stopped: '已停止 · 用了 7 s' };
  for (const status of Object.keys(expected)) {
    const entries = status === 'error' ? [steps[0], { ...steps[1], state: 'error', detail: '读取超时', action: h('button', null, '重试这一步') }, steps[2]] : steps;
    const html = render(after.BpStepGroup, { status, steps: entries, startedAt: 0, endedAt: 7000, onStop() {} });
    assert.ok(html.replace(/<[^>]*>/g, '').includes(expected[status]), status); assert.match(html, /<ol/);
    assert.doesNotMatch(html, /role="status"|aria-live=/);
    if (status !== 'preparing') assert.match(html, /aria-controls="[^"]+"/);
    if (status === 'error') { assert.match(html, /aria-expanded="true"/); assert.match(html, /读取超时/); assert.match(html, /重试这一步/); }
    if (status === 'done') assert.match(html, /aria-expanded="false"/);
  }
  assert.match(render(after.BpStepGroup, { status: 'preparing', steps: [], startedAt: 0 }), /正在处理/);
  assert.match(render(after.BpStepGroup, { status: 'done', steps, startedAt: 0 }), /用时未知/);
  assert.match(render(after.BpStepGroup, { status: 'done', steps, startedAt: 0, summaryLabel: '宿主摘要', expandLabel: '查看步骤' }), /宿主摘要.*查看步骤/s);
});

const items = [
  { id: 'a', question: '要查哪一次测评？', options: [{ value: 'latest', label: '查最近一次', recommended: true }, { value: 'new', label: '不查了，作为新诉求' }] },
  { id: 'b', question: '第 4 题讲评放在哪一节？', options: [{ value: 'second', label: '明天第 2 节' }, { value: 'fifth', label: '明天第 5 节' }] },
];
const dockProps = { items, index: 0, folded: false, onIndexChange() {}, onFoldedChange() {}, onAnswer() {} };
function nodes(tree) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children)];
}
const find = (tree, predicate) => nodes(tree).find(predicate);
const optionNodes = tree => nodes(tree).filter(node => node.props?.['data-slot'] === 'decision-option');
function assertSelected(tree) {
  const selected = optionNodes(tree).find(node => node.props.className.includes('bg-accent font-semibold'));
  assert.ok(selected);
  assert.match(renderToStaticMarkup(selected), /✓/);
  assert.match(renderToStaticMarkup(selected), /已选，继续处理/);
}
const keyEvent = (key, overrides = {}) => ({ key, target: { closest: () => null }, nativeEvent: { isComposing: false }, preventDefault() {}, stopPropagation() {}, ...overrides });
function timers(t) {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 0 });
  const originalFrame = globalThis.requestAnimationFrame, originalCancel = globalThis.cancelAnimationFrame;
  globalThis.requestAnimationFrame = fn => setTimeout(fn, 16);
  globalThis.cancelAnimationFrame = clearTimeout;
  t.after(() => { hooks.reset(); globalThis.requestAnimationFrame = originalFrame; globalThis.cancelAnimationFrame = originalCancel; });
}
test('P159 dock SSR exposes numbered options, recommendation, navigation and controlled fold', () => {
  const html = render(after.BpDecisionDock, dockProps);
  assert.match(html, /1 \/ 2/); assert.match(html, /推荐/); assert.match(html, /稍后/);
  assert.match(html, /<span class="min-w-0">查最近一次<\/span><span class="shrink-0[^"]*">推荐<\/span>/);
  assert.equal((html.match(/data-slot="decision-option"/g) || []).length, 3);
  assert.match(html, /aria-label="上一件" disabled=""/);
  assert.match(html, /tabindex="-1" aria-label="待你决定"/);
  const folded = render(after.BpDecisionDock, { ...dockProps, folded: true });
  assert.match(folded, /2 件待你决定/); assert.match(folded, /truncate/); assert.match(folded, /aria-expanded="false"/);
  assert.doesNotMatch(html, /aria-live=|role="status"/);
  assert.equal((render(after.BpDecisionDock, { ...dockProps, items: [{ ...items[0], other: false }] }).match(/data-slot="decision-option"/g) || []).length, 2);
  assert.doesNotMatch(render(after.BpDecisionDock, { ...dockProps, items: [] }), /NaN|undefined|decision-option/);
});
test('P159 local keyboard choices, editing exclusions, Escape and single answer', t => {
  timers(t);
  const calls = [], folds = [];
  let tree = hooks.run(hooks.BpDecisionDock, { ...dockProps, onAnswer: (...args) => calls.push(args), onFoldedChange: value => folds.push(value) });
  for (const override of [{ target: { closest: () => ({}) } }, { nativeEvent: { isComposing: true } }, { ctrlKey: true }, { repeat: true }, { defaultPrevented: true }]) tree.props.onKeyDown(keyEvent('2', override));
  assert.equal(calls.length, 0);
  tree.props.onKeyDown(keyEvent('Escape')); assert.deepEqual(folds, [true]);
  tree.props.onKeyDown(keyEvent('2'));
  tree.props.onKeyDown(keyEvent('2'));
  assert.deepEqual(calls, [['a', { value: 'new' }]]);
  tree = hooks.flush();
  assert.equal(optionNodes(tree).filter(node => node.props.disabled).length, 3);
  assert.match(renderToStaticMarkup(tree), /已选，继续处理/);
});
test('P159 confirmation snapshot survives host removal, dwell then fade and next host item', t => {
  timers(t);
  let tree = hooks.run(hooks.BpDecisionDock, dockProps);
  t.mock.timers.tick(16); tree = hooks.flush();
  optionNodes(tree)[0].props.onClick(); tree = hooks.flush();
  tree = hooks.run(hooks.BpDecisionDock, { ...dockProps, items: [items[1]] });
  assert.match(renderToStaticMarkup(tree), /要查哪一次测评/);
  assert.match(renderToStaticMarkup(tree), /1 \/ 2/);
  assertSelected(tree);
  t.mock.timers.tick(799); tree = hooks.flush();
  assertSelected(tree);
  assert.match(renderToStaticMarkup(tree), /已选，继续处理/);
  const body = find(tree, node => node.props?.onTransitionEnd);
  body.props.ref.current = {};
  const style = globalThis.getComputedStyle;
  globalThis.getComputedStyle = () => ({ transitionDuration: '0.2s' });
  t.after(() => { globalThis.getComputedStyle = style; });
  t.mock.timers.tick(1); tree = hooks.flush();
  assert.match(find(tree, node => node.props?.onTransitionEnd).props.className, /opacity-0/);
  assertSelected(tree);
  assert.doesNotMatch(renderToStaticMarkup(tree), /第 4 题讲评放在哪一节/);
  t.mock.timers.tick(199); tree = hooks.flush();
  assertSelected(tree);
  assert.doesNotMatch(renderToStaticMarkup(tree), /第 4 题讲评放在哪一节/);
  t.mock.timers.tick(1); tree = hooks.flush();
  assert.match(renderToStaticMarkup(tree), /第 4 题讲评放在哪一节/);
  assert.match(renderToStaticMarkup(tree), /1 \/ 1/);
  assert.doesNotMatch(renderToStaticMarkup(tree), /已选，继续处理/);
  tree.props.ref.current = { firstElementChild: {} };
  optionNodes(tree)[1].props.onClick(); hooks.flush();
  tree = hooks.run(hooks.BpDecisionDock, { ...dockProps, items: [] });
  assertSelected(tree);
  t.mock.timers.tick(799); tree = hooks.flush();
  assertSelected(tree);
  assert.equal(tree.props.children.props.open, true);
  t.mock.timers.tick(1); tree = hooks.flush();
  assert.equal(tree.props.children.props.open, false);
  assertSelected(tree);
  t.mock.timers.tick(199); tree = hooks.flush();
  assertSelected(tree);
  t.mock.timers.tick(1); tree = hooks.flush();
  assert.equal(tree.props.children.props.open, false);
  assert.equal(optionNodes(tree).length, 0);
});

for (const duration of ['120ms', '0s']) test(`P159 confirmation handoff follows CSS duration ${duration}`, t => {
  timers(t);
  const style = globalThis.getComputedStyle;
  globalThis.getComputedStyle = () => ({ transitionDuration: duration, transitionDelay: '0s' });
  t.after(() => { globalThis.getComputedStyle = style; });
  let tree = hooks.run(hooks.BpDecisionDock, dockProps);
  find(tree, node => node.props?.onTransitionEnd).props.ref.current = {};
  optionNodes(tree)[0].props.onClick(); hooks.flush();
  tree = hooks.run(hooks.BpDecisionDock, { ...dockProps, items: [items[1]] });
  t.mock.timers.tick(800); tree = hooks.flush();
  assertSelected(tree);
  if (duration === '120ms') {
    t.mock.timers.tick(119); tree = hooks.flush();
    assertSelected(tree);
  }
  t.mock.timers.tick(duration === '120ms' ? 1 : 0); tree = hooks.flush();
  assert.match(renderToStaticMarkup(tree), /第 4 题讲评放在哪一节/);
  assert.doesNotMatch(renderToStaticMarkup(tree), /已选，继续处理/);
});

test('P159 custom answer opens input, rejects whitespace, submits trimmed content and retains it', t => {
  timers(t);
  const calls = [];
  const props = { ...dockProps, onAnswer: (...args) => calls.push(args) };
  let tree = hooks.run(hooks.BpDecisionDock, props);
  tree.props.onKeyDown(keyEvent('3')); tree = hooks.flush();
  assert.ok(find(tree, node => node.type === 'label'));
  let input = find(tree, node => node.props?.nativeInput);
  input.props.onChange({ target: { value: '   ' } }); tree = hooks.flush();
  find(tree, node => node.type === 'form').props.onSubmit({ preventDefault() {} }); assert.equal(calls.length, 0);
  input = find(tree, node => node.props?.nativeInput);
  input.props.onChange({ target: { value: ' 查国庆前那次单元测 ' } }); tree = hooks.flush();
  tree.props.onKeyDown(keyEvent('1', { target: { closest: () => ({}) } })); assert.equal(calls.length, 0);
  find(tree, node => node.type === 'form').props.onSubmit({ preventDefault() {} }); tree = hooks.flush();
  assert.deepEqual(calls, [['a', { other: '查国庆前那次单元测' }]]);
  assert.match(renderToStaticMarkup(tree), /查国庆前那次单元测/);
  assert.match(renderToStaticMarkup(tree), /已选，继续处理/);
});
test('P159 announcer clears repeated text, uses next frame, cleans up and no-ops outside provider', t => {
  timers(t);
  let tree = hooks.run(hooks.BpAnnouncerProvider, { children: '正文' });
  const announce = tree.props.value;
  announce('Agent 正在处理'); tree = hooks.flush();
  assert.equal(tree.props.children[1].props.children, '');
  t.mock.timers.tick(16); tree = hooks.flush();
  assert.equal(tree.props.children[1].props.children, 'Agent 正在处理');
  announce('Agent 正在处理'); tree = hooks.flush();
  assert.equal(tree.props.children[1].props.children, '');
  t.mock.timers.tick(16); tree = hooks.flush();
  assert.equal(tree.props.children[1].props.children, 'Agent 正在处理');
  assert.equal(tree.props.children[1].props['aria-atomic'], 'true');
  announce('已停止'); hooks.reset(); t.mock.timers.tick(16);
  function Outside() { after.useBpAnnounce()('忽略'); return '正文'; }
  assert.equal(render(Outside), '正文');
  const html = render(after.BpAnnouncerProvider, { children: '正文' });
  assert.equal((html.match(/role="status"/g) || []).length, 1);
});
test('P159 receipt pending and answered presentation', () => {
  const pending = render(after.BpDecisionReceipt, { question: '问题' });
  assert.match(pending, /等你决定/); assert.match(pending, /在输入框上方/);
  const done = render(after.BpDecisionReceipt, { question: '问题', answer: '答案' });
  assert.match(done, /✓/); assert.match(done, /→/); assert.match(done, /<strong>答案<\/strong>/);
  assert.doesNotMatch(done, /等你决定|aria-live/);
});
