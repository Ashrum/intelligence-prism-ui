import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { componentGroups } from '../lib/prism-next/catalog.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const dir = new URL('../.sites-runtime/queue-board-test/', import.meta.url);
await mkdir(dir, { recursive: true });
const options = { stdin: { contents: `export * from './components/prism-next/queue-board'; export * from './components/prism-next/demos/queue-board'; export {StatusComposition} from './components/prism-next/data-display'; export {AgentReviewQueue} from './components/prism-next/agent-review-queue'; export {Button as SharedButton} from './components/prism-next/button'; export {Badge as SharedBadge} from './components/prism-next/badge';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false };
const file = new URL('bundle.mjs', dir), probeFile = new URL('state-probe.mjs', dir);
await writeFile(file, (await build(options)).outputFiles[0].text);
const api = await import(file);
// Re-execute real handlers with a tiny state cell; this is not DOM or browser validation.
await writeFile(probeFile, (await build({ ...options, plugins: [{ name: 'queue-state-probe', setup(build) {
  build.onLoad({ filter: /prism-next\/queue-board\.tsx$/ }, async args => ({ loader: 'tsx', contents: (await readFile(args.path, 'utf8'))
    .replace('useId, useState,', 'useId,')
    .replace('export type QueueBoardCategory', `const useState = <T,>(initial: T) => { const cell = (globalThis as any).__queueState; if (!('value' in cell)) cell.value = initial; return [cell.value, (next: T) => { cell.value = next }] as const };\nexport type QueueBoardCategory`) }));
} }] })).outputFiles[0].text);
const probe = await import(probeFile);
await rm(file); await rm(probeFile);
const h = React.createElement, base = api.queueBoardBase;
function capture(props = {}, Component = api.QueueBoard) {
  const nodes = [];
  function walk(n) {
    if (Array.isArray(n)) return n.map(walk);
    if (!React.isValidElement(n)) return n;
    if (typeof n.type === 'function' && ['QueueBoard', 'BoardAction'].includes(n.type.name)) return h(function Probe() { return walk(n.type(n.props)); });
    nodes.push(n);
    return React.cloneElement(n, {}, React.Children.map(n.props.children, walk));
  }
  const html = render(walk(h(Component, { ...base, onRowAction() {}, onHeaderAction() {}, ...props })));
  return { html, nodes, group: nodes.find(n => n.type?.name === 'ToggleGroup'), toggles: nodes.filter(n => n.type?.name === 'ToggleGroupItem'), buttons: nodes.filter(n => n.type === api.SharedButton || n.type === probe.SharedButton) };
}
const pressed = out => out.toggles.filter(n => out.group.props.value.includes(n.props.value)).map(n => n.props['aria-label']);
const button = (out, label) => out.buttons.find(n => React.Children.toArray(n.props.children).includes(label));

test('filter cards and multiline actions override desktop height and keep all card content inside the toggle', () => {
  const out = capture();
  for (const control of [...out.toggles, ...out.buttons]) {
    assert.ok(control.props.className.split(/\s+/).includes('sm:h-auto'));
    const html = render(control);
    assert.match(html, /sm:h-auto/); assert.doesNotMatch(html, /sm:h-8(?:\s|")/);
  }
  out.toggles.forEach((toggle, index) => {
    const category = base.categories[index];
    const parts = React.Children.toArray(toggle.props.children.props.children);
    assert.equal(parts.length, 3);
    assert.equal(parts[0].props.children, category.count);
    assert.equal(parts[1].type, api.SharedBadge); assert.equal(parts[1].props.children, category.label);
    assert.equal(parts[2].props.children, category.description);
    assert.equal(parts[2].props.id, toggle.props['aria-describedby']);
  });
  const selected = capture({ filter: 'completed' });
  assert.match(selected.html, /aria-pressed="true"/);
  assert.equal(selected.group.props.multiple, false);
  const status = out.nodes.find(n => n.props.role === 'status');
  assert.equal(status.props.className, 'sr-only'); assert.equal(status.props['aria-live'], 'polite');
});

test('same-label row actions include each student in their accessible name without changing visible labels', () => {
  const completed = api.queueBoardFixtures.find(f => f.id === 'completed').props;
  const out = capture(completed);
  const previews = out.buttons.filter(n => React.Children.toArray(n.props.children).includes('预览试卷'));
  assert.equal(previews.length, completed.rows.length);
  assert.deepEqual(previews.map(n => n.props['aria-label']), completed.rows.map(row => `预览试卷：${row.name}`));
  for (const preview of previews) assert.match(render(preview), />预览试卷<\/button>/);
  const unknown = capture({ rows: [{ ...base.rows[0], name: '  ' }] });
  assert.equal(button(unknown, '预览试卷').props['aria-label'], '预览试卷：姓名未提供');
  assert.equal(button(out, '查看当前批阅结果').props['aria-label'], undefined);
});

test('controlled single filter emits selection/cancel while host remains authoritative', () => {
  const calls = [], props = { filter: 'completed', onFilterChange: id => calls.push(id) };
  const out = capture(props);
  assert.deepEqual(pressed(out), ['已完成：31']); assert.match(out.html, /张雨桐/); assert.doesNotMatch(out.html, /周可欣/);
  out.group.props.onValueChange([]); out.group.props.onValueChange(['waiting']);
  assert.deepEqual(calls, [null, 'waiting']); assert.deepEqual(pressed(capture(props)), ['已完成：31']);
  assert.deepEqual(pressed(capture({ filter: 'waiting' })), ['等待批阅：5']);
  assert.equal(pressed(capture({ filter: null })).length, 0);
});

test('uncontrolled selection changes, switches and cancels without requiring a handler', t => {
  globalThis.__queueState = {}; t.after(() => delete globalThis.__queueState);
  let out = capture({ defaultFilter: 'error' }, probe.QueueBoard);
  assert.deepEqual(pressed(out), ['异常：2']);
  out.group.props.onValueChange(['waiting']); out = capture({}, probe.QueueBoard);
  assert.deepEqual(pressed(out), ['等待批阅：5']); assert.match(out.html, /周可欣/); assert.doesNotMatch(out.html, /张雨桐/);
  out.group.props.onValueChange([]); out = capture({}, probe.QueueBoard);
  assert.equal(pressed(out).length, 0); for (const row of base.rows) assert.ok(out.html.includes(row.name));
});

test('zero counts remain selectable; counts are never derived from four visible rows', () => {
  const completed = api.queueBoardFixtures.find(f => f.id === 'completed').props;
  const out = capture(completed);
  assert.deepEqual(out.toggles.map(n => n.props['aria-label']), ['已完成：38', '等待批阅：0', '异常：0', '需教师处理：0']);
  assert.equal(out.toggles.filter(n => n.props.disabled).length, 0);
  assert.match(capture({ ...completed, filter: 'waiting' }).html, /该队列暂无试卷/);
  assert.match(capture({ categories: base.categories.map((c, i) => ({ ...c, count: [null, -1, NaN, 1.5][i] })) }).html, /数量未提供/);
});

test('2 and 6 category inputs preserve every category; unknown facts are not invented', () => {
  for (const categories of [base.categories.slice(0, 2), [...base.categories, { ...base.categories[0], id: 'fifth' }, { ...base.categories[1], id: 'sixth' }]]) assert.equal(capture({ categories }).toggles.length, categories.length);
  const out = capture({ rows: [{ id: 'unknown', name: '', statusId: 'missing', pages: -2, actions: [] }] });
  for (const text of ['姓名未提供', '考号、页数未提供', '状态未提供', '状态说明未提供', '未提供操作']) assert.ok(out.html.includes(text));
  assert.match(capture({ rows: [{ ...base.rows[0], examNumber: undefined, pages: 3 }] }).html, /考号 未提供 · 3 页/);
  assert.match(capture({ rows: [{ ...base.rows[0], pages: 0 }] }).html, /考号 20260118 · 页数未提供/);
});

test('row and header actions emit exact IDs without changing host facts', () => {
  const calls = [], before = structuredClone(base), props = { onRowAction: (...args) => calls.push(args), onHeaderAction: () => calls.push(['header']) };
  const out = capture(props);
  for (const row of base.rows) button(out, row.actions[0].label).props.onClick();
  button(out, '查看当前批阅结果').props.onClick();
  assert.deepEqual(calls, [...base.rows.map(row => [row.id, row.actions[0].id]), ['header']]);
  assert.deepEqual(base, before); assert.equal(capture(props).html, out.html);
  const blocked = capture(api.queueBoardFixtures.find(f => f.id === 'blocked').props); assert.ok(button(blocked, '调整模板'));
});

test('disabled reasons, absent callbacks and header guards never dispatch', () => {
  let calls = 0;
  for (const action of [{ id: 'a', label: '预览', disabledReason: '资料尚未提供' }, { id: 'a', label: '预览', disabled: true }]) {
    const out = capture({ rows: [{ ...base.rows[0], actions: [action] }], onRowAction: () => calls++ });
    const b = button(out, '预览'); assert.equal(b.props.disabled, true); assert.ok(b.props.title);
    assert.ok(out.nodes.some(n => n.props.id === b.props['aria-describedby'])); b.props.onClick();
  }
  const missing = capture({ onRowAction: undefined, onHeaderAction: undefined });
  for (const b of missing.buttons) { assert.equal(b.props.disabled, true); assert.equal(b.props.title, '操作暂不可用'); b.props.onClick(); }
  const header = capture({ headerAction: { label: '结果', disabledReason: '结果尚未提供' }, onHeaderAction: () => calls++ });
  button(header, '结果').props.onClick(); assert.equal(calls, 0);
});

test('loading/empty/error replace stale data and error retry stays an intent', () => {
  let retries = 0;
  for (const [kind, text] of [['loading', '正在加载试卷队列'], ['empty', '暂无试卷'], ['error', '连接失败']]) {
    const props = { state: { kind, reason: '连接失败' }, onRetry: () => retries++ }, out = capture(props);
    assert.match(out.html, new RegExp(text)); assert.doesNotMatch(out.html, /张雨桐|队列状态筛选|查看当前批阅结果/);
    if (kind === 'loading') assert.match(out.html, /aria-busy="true"/);
    if (kind === 'error') { button(out, '重试').props.onClick(); assert.equal(capture(props).html, out.html); }
  }
  assert.equal(retries, 1);
  const unavailable = button(capture({ state: { kind: 'error', reason: '连接失败' } }), '重试'); assert.equal(unavailable.props.disabled, true);
  assert.match(capture({ rows: [] }).html, /暂无试卷/);
  assert.match(capture({ filter: 'missing' }).html, /分类未提供.*该队列暂无试卷/);
});

test('shared semantic badges, table scope and keyboard-scroll region preserve fact structure', () => {
  const out = capture({ maxHeight: 280 });
  const table = out.nodes.find(n => n.type?.name === 'Table');
  assert.equal(table.props.render.type.name, 'ScrollArea'); assert.equal(table.props.render.props.scrollFade, undefined); assert.equal(table.props.variant, 'card');
  assert.match(out.html, /data-slot="scroll-area-viewport"/);
  assert.equal(capture({ maxHeight: undefined }).nodes.find(n => n.type?.name === 'Table').props.render.props.tabIndex, 0); assert.equal(table.props.render.props.style.maxHeight, 280);
  assert.match(out.html, /role="region"/); assert.match(out.html, /aria-label="试卷队列表，可横向滚动"/);
  assert.equal((out.html.match(/scope="col"/g) || []).length, 4);
  assert.deepEqual(out.nodes.filter(n => n.type === api.SharedBadge).map(n => n.props.variant), ['success', 'info', 'error', 'warning', 'success', 'info', 'error', 'warning']);
});

test('catalog and all requested fixtures render without forbidden page wording', () => {
  const groups = componentGroups.filter(group => group.items.some(item => item.id === 'queue-board'));
  assert.deepEqual(groups.map(g => g.id), ['content']);
  const html = render(h(api.QueueBoardDemo)); assert.doesNotMatch(html, /示例|演示/);
  for (const text of ['批阅进行中', '批阅完成', '批阅受阻', '调整模板', '该队列暂无试卷', '原卷文件尚未提供', '320px', '<math>']) assert.ok(html.includes(text));
  for (const theme of ['light', 'paper', 'dark']) assert.ok(html.includes(`data-prism-theme="${theme}"`));
});

test('existing composition and review queue APIs still retain their original semantics', () => {
  const composition = render(h(api.StatusComposition, { items: [{ id: 'a', label: '甲', value: 3 }, { id: 'b', label: '乙', value: 1 }], onSelect() {}, selectedId: 'a' }));
  assert.match(composition, /75%/); assert.match(composition, /25%/); assert.match(composition, /aria-pressed="true"/);
  const review = render(h(api.AgentReviewQueue, { title: '审核队列', queue: { id: 'queue', version: 'v1' }, items: [], counts: { resolved: 0, 'waiting-human': 2 }, view: 'workspace' }));
  assert.match(review, /队列版本：v1/); assert.match(review, /当前列表没有审核对象/); assert.match(review, /已复核/);
});
