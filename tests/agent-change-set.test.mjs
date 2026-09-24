import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';

const root = fileURLToPath(new URL('../', import.meta.url));
await mkdir(new URL('../.sites-runtime/change-set/', import.meta.url), { recursive: true });
async function bundle(contents, name, resolveDir = root) {
 const result = await build({ stdin: { contents, resolveDir, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false });
 const file = new URL(`../.sites-runtime/change-set/${name}.mjs`, import.meta.url);
 await writeFile(file, result.outputFiles[0].text);
 const module = await import(file);
 await rm(file);
 return module;
}
const { AgentChangeSet } = await bundle(`export {AgentChangeSet} from './components/prism-next/agent-components';`, 'components');
const h = React.createElement;
const items = [
 { id: 'one', title: '第 1 题 · 条件分段', before: '原文一', after: '建议一', reason: '分段', decision: 'pending' },
 { id: 'two', title: '第 2 题 · 对称轴', before: 'x = 2', after: 'x = 1', reason: '核对', decision: 'kept' },
 { id: 'three', title: '第 3 题：小问编号', before: '①', after: '（1）', reason: '编号', decision: 'pending' },
 { id: 'four', title: '第 4 题 · 原稿核对', before: '原文四', after: '建议四', reason: '证据不足', decision: 'pending', critical: true },
];
const props = { title: '修改集', basis: '来源 A / v2', items: items, onDecision() {}, onRewrite() {} };
test('inline summarizes decisions and retains critical evidence beyond its limit; workspace renders every item', () => {
 const inline = render(h(AgentChangeSet, { ...props, view: 'inline', onExpand() {} }));
 assert.match(inline, /共 4 处修改 · 已采用 0 · 保留原文 1 · 待决定 3/);
 assert.match(inline, /查看全部 4 处修改/); assert.match(inline, /证据不足/);
 assert.match(inline, /另有 1 处修改，展开查看全部/);
 assert.doesNotMatch(inline, /意图|宿主|回调|受控|含全部关键项|本卡不提供整组采纳/);
 assert.doesNotMatch(inline, /第 3 题：小问编号/);
 const full = render(h(AgentChangeSet, { ...props, view: 'workspace', notice: '基准已过期，核对冲突', onExpand() {} }));
 for (const item of props.items) assert.ok(full.includes(item.title));
 assert.match(full, /基准已过期，核对冲突/); assert.doesNotMatch(full, /查看全部/);
});
test('missing expand capability has no fake entry and keeps remaining changes reachable', () => {
 const html = render(h(AgentChangeSet, { ...props, view: 'inline' }));
 assert.doesNotMatch(html, /查看全部/);
 for (const item of props.items) assert.ok(html.includes(item.title));
});
test('controlled decision and rewritten text render identically in both views without invoking callbacks', () => {
 let calls = 0;
 for (const decision of ['pending', 'accepted', 'kept']) for (const view of ['inline', 'workspace']) {
  const html = render(h(AgentChangeSet, { ...props, view, items: [{ ...props.items[0], after: '人工改写 x² + 2', decision }], onDecision() { calls++; }, onRewrite() { calls++; } }));
  assert.match(html, /人工改写 x² \+ 2<\/textarea>/);
  assert.doesNotMatch(html.match(/<textarea\b[^>]*>/)[0], /aria-describedby/);
  assert.doesNotMatch(html, /rewrite-hint/);
  assert.ok(html.includes({ pending: '待决定', accepted: '已采用', kept: '已保留原文' }[decision]));
  assert.doesNotMatch(html, /已保存|已提交/);
 }
 assert.equal(calls, 0);
});
test('preview slots and explicit host restrictions survive both views; missing edit capability has no input', () => {
 for (const view of ['inline', 'workspace']) {
  const html = render(h(AgentChangeSet, { ...props, view, onRewrite: undefined, disabledReason: '外部版本冲突', items: [{ ...props.items[0], beforePreview: h('math', null, h('mi', null, 'x')), afterPreview: h('p', null, '当前草稿预览') }] }));
  assert.match(html, /<math>/); assert.match(html, /当前草稿预览/); assert.match(html, /外部版本冲突/);
  assert.match(html, /disabled=""/); assert.doesNotMatch(html, /<textarea/);
 }
 assert.match(render(h(AgentChangeSet, { ...props, view: 'workspace', items: [] })), /当前没有修改/);
});

test('conflict facts beyond inlineLimit stay visible and do not disable adopt/keep or change the controlled decision', () => {
 for (const view of ['inline', 'workspace']) {
  const conflicting = { ...items[2], conflict: { baseLabel: 'r2', currentLabel: 'r3', description: '教师已修改' } };
  const html = render(h(AgentChangeSet, { ...props, view, inlineLimit: 1, onExpand() {}, items: [items[0], items[1], conflicting, items[3]] }));
  assert.match(html, /候选基于 r2，当前为 r3 · 教师已修改/);
  assert.ok(html.includes(conflicting.title)); assert.match(html, /证据不足/);
  assert.doesNotMatch(html, /disabled=""/);
  assert.match(html, /已采用 0 · 保留原文 1 · 待决定 3/);
  assert.ok(html.includes(`aria-label="采用：${conflicting.title}"`));
  assert.ok(html.includes(`aria-label="保留：${conflicting.title}"`));
 }
});

test('each decision and reset button includes its own title in its accessible name', () => {
 for (const decision of ['pending', 'accepted', 'kept']) {
  const html = render(h(AgentChangeSet, { ...props, view: 'workspace', items: items.map(item => ({ ...item, decision })) }));
  for (const item of items) for (const label of decision === 'pending' ? ['采用', '保留'] : ['重新选择']) {
   assert.ok(html.includes(`aria-label="${label}：${item.title}"`));
  }
 }
});

test('apply is a host capability: absent hides it, provided stays independent of counts, reasons block it', () => {
 let calls = 0;
 const apply = { label: '应用已采用的修改', onApply() { calls++; } };
 const applyButton = html => html.match(/<button\b[^>]*>应用已采用的修改<\/button>/)?.[0];
 for (const view of ['inline', 'workspace']) {
  assert.equal(applyButton(render(h(AgentChangeSet, { ...props, view }))), undefined);
  for (const decision of ['pending', 'accepted', 'kept']) {
   const html = render(h(AgentChangeSet, { ...props, view, apply, items: [{ ...items[0], decision }] }));
   assert.ok(applyButton(html)); assert.doesNotMatch(applyButton(html), /disabled=""/);
   assert.doesNotMatch(html, /已应用|已保存|已提交/);
  }
  for (const restriction of [
   { apply: { ...apply, disabledReason: '宿主正在核验' } },
   { apply, disabledReason: '宿主只读' },
   { apply: { ...apply, disabledReason: '宿主正在核验' }, disabledReason: '宿主只读' },
  ]) {
   const html = render(h(AgentChangeSet, { ...props, view, ...restriction }));
   const tag = applyButton(html);
   assert.match(tag, /disabled=""/);
   const ids = tag.match(/aria-describedby="([^"]+)"/)[1].split(' ');
   for (const id of ids) assert.ok(html.includes(`id="${id}" role="status"`));
  }
 }
 assert.equal(calls, 0);
});

test('group and per-item restrictions preserve reasons for decisions, reset and rewrite; notices are informational', () => {
 for (const decision of ['pending', 'accepted']) {
  const html = render(h(AgentChangeSet, { ...props, view: 'workspace', disabledReason: '整组只读', items: [{ ...items[0], decision, disabledReason: '原稿不可用' }] }));
  assert.match(html, /整组只读；原稿不可用/);
  for (const tag of html.matchAll(/<(?:button|textarea)\b[^>]*>/g)) assert.match(tag[0], /disabled=""/);
  const textarea = html.match(/<textarea\b[^>]*>/)[0];
  const ids = textarea.match(/aria-describedby="([^"]+)"/)[1].split(' ');
  for (const id of ids) assert.ok(html.includes(`id="${id}"`));
 }
 const html = render(h(AgentChangeSet, { ...props, view: 'workspace', notice: '基准过期，仅提示', items: [items[0], { ...items[2], disabledReason: '单项只读' }] }));
 assert.match(html, /基准过期，仅提示/);
 const adopt = [...html.matchAll(/<button\b[^>]*aria-label="采用：[^>]*>/g)].map(match => match[0]);
 assert.doesNotMatch(adopt[0], /disabled=""/); assert.match(adopt[1], /disabled=""/);
});

test('inlineLimit is normalized and optional descriptions and empty groups remain valid', () => {
 for (const [inlineLimit, count] of [[0, 1], [-2, 1], [1.8, 1], [NaN, 2], [Infinity, 2], [99, 3]]) {
  const html = render(h(AgentChangeSet, { ...props, view: 'inline', inlineLimit, items: items.slice(0, 3), onExpand() {} }));
  assert.equal((html.match(/<li\b/g) || []).length, count);
 }
 const html = render(h(AgentChangeSet, { ...props, view: 'inline', items: [{ ...items[0], conflict: { baseLabel: 'r1', currentLabel: 'r2' } }] }));
 assert.match(html, /候选基于 r1，当前为 r2<\/p>/); assert.match(html, /来源 A \/ v2/);
});

test('callback wiring preserves item identity and controlled input; expansion/application do not emit decisions or mutate items', () => {
 const events = [];
 const input = structuredClone(items);
 let tree;
 const host = {
  ...props, view: 'inline', items: input,
  onDecision: (...args) => events.push(['decision', ...args]),
  onRewrite: (...args) => events.push(['rewrite', ...args]),
  onExpand: trigger => events.push(['expand', trigger]),
  apply: { label: '应用', onApply: () => events.push(['apply']) },
 };
 // Capture real React element props during server render; no browser interaction is claimed.
 function Capture() { tree = AgentChangeSet(host); return tree; }
 render(h(Capture));
 function elements(node) {
  if (!React.isValidElement(node)) return [];
  return [node, ...React.Children.toArray(node.props.children).flatMap(elements)];
 }
 const nodes = elements(tree);
 const review = nodes.find(node => node.props.title === items[0].title && node.props.onResetDecision);
 review.props.onDecision('accepted');
 review.props.onDecision('kept');
 review.props.onResetDecision();
 nodes.find(node => node.props.value === items[0].after && node.props.onChange).props.onChange({ target: { value: '手动候选' } });
 const trigger = { id: 'host-trigger' };
 nodes.find(node => node.props.onClick && React.Children.toArray(node.props.children).includes('查看全部 ')).props.onClick({ currentTarget: trigger });
 nodes.find(node => node.props.children === '应用').props.onClick();
 assert.deepEqual(events, [
  ['decision', items[0].id, 'accepted'], ['decision', items[0].id, 'kept'], ['decision', items[0].id, 'pending'],
  ['rewrite', items[0].id, '手动候选'], ['expand', trigger], ['apply'],
 ]);
 assert.deepEqual(input, items);
 for (const disabled of ['group', 'apply']) {
  if (disabled === 'group') host.disabledReason = '只读';
  else { delete host.disabledReason; host.apply.disabledReason = '等待核验'; }
  render(h(Capture));
  elements(tree).find(node => node.props.children === '应用').props.onClick();
 }
 assert.equal(events.length, 6);
});


test('supplementary details default to collapsed while conflict and disabled facts remain visible in both views', () => {
 for (const view of ['inline', 'workspace']) {
  const base = { ...props, view, items: [{ ...items[0], conflict: { baseLabel: 'r2', currentLabel: 'r3' } }], notice: '候选已过期', disabledReason: '请先核对原稿' };
  const plain = render(h(AgentChangeSet, base));
  assert.doesNotMatch(plain, /data-slot="collapsible-trigger"/);
  const html = render(h(AgentChangeSet, { ...base, details: h('p', null, '补充的逐项比较说明') }));
  const trigger = html.match(/<button\b[^>]*data-slot="collapsible-trigger"[^>]*>/)?.[0];
  assert.ok(trigger);
  assert.match(trigger, /aria-expanded="false"/);
  assert.doesNotMatch(trigger, /disabled=""/);
  assert.match(html, /说明<\/button>/);
  assert.doesNotMatch(html, /补充的逐项比较说明/);
  for (const fact of ['候选基于 r2，当前为 r3', '候选已过期', '请先核对原稿']) assert.ok(html.includes(fact));
 }
});
