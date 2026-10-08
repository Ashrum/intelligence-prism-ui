import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
const root = fileURLToPath(new URL('../', import.meta.url));
const dir = new URL('../.sites-runtime/p3-test/', import.meta.url);
await mkdir(dir, { recursive: true });
const file = new URL('bundle.mjs', dir);
await writeFile(file, (await build({ stdin: { contents: `export {Select} from './components/coss/select'; export {Sheet} from './components/coss/sheet'; export * from './components/prism-next/stepper'; export * from './components/prism-next/queue-board'; export * from './components/prism-next/record-list'; export * from './components/prism-next/data-station'; export {queueBoardBase} from './components/prism-next/demos/queue-board'; export {recordBase} from './components/prism-next/demos/record-list'; export {dataStationBase} from './components/prism-next/demos/data-station';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false })).outputFiles[0].text);
const api = await import(file); await rm(file);
const h = React.createElement;
function capture(name, props) {
  const nodes = [], owned = new Set([name, 'DataStationPanel']);
  function walk(n) {
    if (Array.isArray(n)) return n.map(walk);
    if (!React.isValidElement(n)) return n;
    if (typeof n.type === 'function' && owned.has(n.type.name)) return h(function Probe() { return walk(n.type(n.props)); });
    nodes.push(n);
    return React.cloneElement(n, {}, React.Children.map(n.props.children, walk));
  }
  const html = render(walk(h(api[name], props)));
  return { html, nodes, find: name => nodes.filter(n => n.type === name || n.type === api[name] || n.type?.name === name) };
}
const steps = [
  { id: 'done', label: '已完成但未授权', state: 'done' },
  { id: 'pending', label: '准备资料', state: 'pending', selectable: true, selectLabel: '返回：准备资料' },
  { id: 'current', label: '扫描', state: 'current', selectable: true },
  { id: 'future', label: '查看结果', state: 'upcoming', selectable: true },
];
test('Stepper selection requires explicit host eligibility, excludes current and never advances position in every layout', () => {
  for (const layout of [{}, { compact: true }, { orientation: 'vertical' }]) {
    const calls = [], props = { steps, ...layout, onStepSelect: id => calls.push(id) };
    const out = capture('Stepper', props), buttons = out.find('button');
    assert.equal(buttons.length, 2);
    assert.deepEqual(buttons.map(n => n.props['aria-label']), ['返回：准备资料', '前往：查看结果']);
    for (const button of buttons) { assert.equal(button.props.type, 'button'); assert.match(button.props.className, layout.compact ? /pointer-coarse:after:min-h-11.*pointer-coarse:after:min-w-11/ : /min-h-11.*min-w-11/); if (layout.compact) assert.doesNotMatch(button.props.className, /(?:^| )min-[hw]-11/); assert.match(button.props.className, /focus-visible/); button.props.onClick(); }
    assert.deepEqual(calls, ['pending', 'future']); assert.equal(capture('Stepper', props).html, out.html);
    assert.equal(capture('Stepper', { steps, ...layout }).find('button').length, 0);
    for (const match of out.html.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/g)) assert.doesNotMatch(match[1], /<(?:div|p)\b/);
  }
});
test('Stepper uses currentStepId for click exclusion, preserving unknown positions and custom labels', () => {
  const out = capture('Stepper', { steps, currentStepId: 'future', onStepSelect() {} });
  assert.deepEqual(out.find('button').map(n => n.props['aria-label']), ['返回：准备资料', '前往：扫描']);
  assert.equal(capture('Stepper', { steps, currentStepId: 'missing', onStepSelect() {} }).find('button').length, 3);
  assert.equal(capture('Stepper', { steps: steps.map(s => ({ ...s, selectable: false })), onStepSelect() {} }).find('button').length, 0);
});
test('QueueBoard sort cycle emits intent only, exposes aria-sort and preserves supplied row order', () => {
  const calls = [], base = { ...api.queueBoardBase, onSortChange: next => calls.push(next) };
  for (const column of ['name', 'status']) {
    for (const [sort, aria, next] of [[null, 'none', { column, direction: 'asc' }], [{ column, direction: 'asc' }, 'ascending', { column, direction: 'desc' }], [{ column, direction: 'desc' }, 'descending', null]]) {
      const props = { ...base, sort }, out = capture('QueueBoard', props), head = out.find('TableHead')[column === 'name' ? 0 : 1];
      assert.equal(head.props['aria-sort'], aria); head.props.children.props.onClick(); assert.deepEqual(calls.at(-1), next);
      assert.equal(capture('QueueBoard', props).html, out.html);
      const names = api.queueBoardBase.rows.map(row => out.html.indexOf(row.name)); assert.deepEqual([...names].sort((a,b) => a-b), names);
    }
  }
  const switchColumn = capture('QueueBoard', { ...base, sort: { column: 'name', direction: 'desc' } });
  switchColumn.find('TableHead')[1].props.children.props.onClick(); assert.deepEqual(calls.at(-1), { column: 'status', direction: 'asc' });
  assert.equal(capture('QueueBoard', api.queueBoardBase).find('TableHead')[0].props.children, '学生 / 试卷');
});
test('QueueBoard sticky header lives inside its bounded viewport; unbounded default has no sticky classes', () => {
  const out = capture('QueueBoard', api.queueBoardBase), table = out.find('Table')[0];
  assert.equal(table.props.render.type.name, 'ScrollArea'); assert.equal(table.props.render.props.style.maxHeight, 360);
  assert.match(out.find('TableHeader')[0].props.className, /sticky top-0 z-10 bg-background/);
  assert.equal(table.props.render.props.scrollFade, undefined); // a top fade would fade the sticky heading
  assert.equal(capture('QueueBoard', { ...api.queueBoardBase, maxHeight: undefined }).find('TableHeader')[0].props.className, undefined);
});
test('RecordList controlled page size emits only an allowed size; it never resets page or slices rows', () => {
  const calls = [], pageCalls = [], props = { ...api.recordBase, filters: [], pagination: { page: 2, pages: [1, 2], pageSize: { value: 5, options: [5, 10, 20], label: '每页记录数' } }, onPageSizeChange: size => calls.push(size), onPageChange: page => pageCalls.push(page) };
  const out = capture('RecordList', props), select = out.find('Select')[0];
  assert.equal(select.props.value, 5); assert.equal(select.props.disabled, false);
  for (const value of [10, null, 0, -1, 7, 1.5]) select.props.onValueChange(value);
  assert.deepEqual(calls, [10]); assert.deepEqual(pageCalls, []); assert.equal(capture('RecordList', props).html, out.html);
  assert.match(out.html, /每页记录数/); assert.match(out.html, /aria-current="page"/);
  assert.equal(capture('RecordList', { ...props, onPageSizeChange: undefined }).find('Select')[0].props.disabled, true);
  assert.equal(capture('RecordList', { ...props, pagination: { page: 2, pages: [1,2] } }).find('Select').length, 0);
});
test('DataStation Drawer is controlled, right positioned and shares panel; closing does not mutate open or connection', () => {
  let calls = 0;
  const props = { ...api.dataStationBase, presentation: 'drawer', open: true, onClose: () => calls++ };
  const out = capture('DataStation', props), drawer = out.find('Drawer')[0];
  assert.equal(drawer.props.position, 'right'); assert.equal(drawer.props.open, true);
  drawer.props.onOpenChange(true); assert.equal(calls, 0);
  drawer.props.onOpenChange(false); assert.equal(calls, 1);
  assert.equal(capture('DataStation', props).find('Drawer')[0].props.open, true);
  assert.equal(out.find('DrawerTitle')[0].props.children, '教学数据站');
  assert.equal(out.find('DrawerClose')[0].props['aria-label'], '关闭教学数据站');
  assert.equal(out.find('DrawerClose')[0].props.render.props.size, "icon"); assert.doesNotMatch(out.find('DrawerClose')[0].props.render.props.className, /min-[hw]-11/);
  assert.match(out.find('DrawerPopup')[0].props.portalProps.className, /motion-reduce.*drawer-backdrop/);
  const inline = capture('DataStation', api.dataStationBase);
  const panel = out.find('DrawerPanel')[0].props.children;
  assert.equal(panel.type.name, 'DataStationPanel'); assert.deepEqual(panel.props.connection, props.connection);
  assert.match(inline.html, /data-data-station/);
  assert.equal(capture('DataStation', { ...props, presentation: undefined }).find('Sheet').length, 1);
  assert.equal(capture('DataStation', { ...props, presentation: 'sheet' }).find('Drawer').length, 0);
});
