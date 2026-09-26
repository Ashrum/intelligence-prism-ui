import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = new URL('../.sites-runtime/distribution-matrix/', import.meta.url);
await mkdir(runtime, { recursive: true });
const bundle = await build({ stdin: { contents: `export * from './components/prism-next/agent-distribution-matrix'; export * from './components/prism-next/demos/agent-distribution-matrix';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false });
const file = new URL('test-bundle.mjs', runtime);
await writeFile(file, bundle.outputFiles[0].text);
const { AgentDistributionMatrix, AgentDistributionMatrixDemo, DistributionMatrixExample, distributionMatrixExamples } = await import(file);
await rm(file);
const h = React.createElement;
const fixture = distributionMatrixExamples.students;
const modes = [{}, { view: 'workspace' }, { density: 'compact' }, { view: 'workspace', density: 'compact' }];
const props = {
  title: '一次标题', record: { id: 'opaque-record', version: '结果 v7', dataTime: '2026-09-26 09:30' },
  scope: { state: 'available', summary: '允许的本次范围' },
  rowDimension: { id: 'opaque-row-dimension', label: '学生', items: [{ id: 'opaque-row-a', label: '甲同学' }, { id: 'opaque-row-b', label: '乙同学' }], options: [{ id: 'opaque-row-dimension', label: '学生' }, { id: 'opaque-knowledge', label: '知识点' }] },
  columnDimension: { id: 'opaque-column-dimension', label: '题目', items: [{ id: 'opaque-column-a', label: '第一题' }, { id: 'opaque-column-b', label: '第二题' }], options: [{ id: 'opaque-column-dimension', label: '题目' }, { id: 'opaque-capability', label: '能力' }] },
  cells: [
    { rowId: 'opaque-row-a', columnId: 'opaque-column-a', reading: { state: 'available', value: '07.2500', unit: '%' }, bandId: 'opaque-band', selectable: true },
    { rowId: 'opaque-row-a', columnId: 'opaque-column-b', reading: { state: 'available', value: 0, unit: '%' }, selectable: true },
    { rowId: 'opaque-row-b', columnId: 'opaque-column-a', reading: { state: 'insufficient', reason: '有效样本不足两份。' }, sampleSize: '1 份', denominator: '', disabledReason: '有效样本不足两份。' },
    { rowId: 'opaque-row-b', columnId: 'opaque-column-b', reading: { state: 'missing', reason: '缺交，未收到作答。' }, sampleSize: '0 份', disabledReason: '缺交，未收到作答。' },
  ],
  method: '页面提供的原样口径。', sample: { size: '2 名学生', denominator: '按对应满分' }, cellSample: { size: '1 份作答', denominator: '5 分' },
  keyRegions: [{ id: 'opaque-region', label: '教师指定区域', summary: '这一处需要查看过程。', basis: '教师批注', cells: [{ rowId: 'opaque-row-a', columnId: 'opaque-column-a' }] }],
  bands: [{ id: 'opaque-band', label: '页面分级', interval: '7% 至 8%（两端包含）', tone: 'info' }],
  filters: [{ id: 'opaque-filter', label: '显示范围', value: 'opaque-all', options: [{ id: 'opaque-all', label: '全部行' }, { id: 'opaque-one', label: '甲同学' }] }],
  sort: { value: 'opaque-order', options: [{ id: 'opaque-order', label: '记录顺序' }, { id: 'opaque-name', label: '名称升序' }], basis: '按原记录顺序' },
  comparison: { axis: 'column', memberIds: [] }, notice: '唯一边界提示。',
};
const htmlFor = extra => render(h(AgentDistributionMatrix, { ...props, onExpand() {}, ...extra }));
const textOf = html => html.replace(/<[^>]*>/g, '');
const times = (html, text) => html.split(text).length - 1;
const target = { recordId: props.record.id, version: props.record.version, rowDimensionId: props.rowDimension.id, columnDimensionId: props.columnDimension.id };
const cellRef = { rowId: props.rowDimension.items[0].id, columnId: props.columnDimension.items[0].id };
const freeze = value => { if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.freeze(value); Object.values(value).forEach(freeze); } return value; };

// Probe handlers created by the real component. DOM, focus and visual results still need browser review.
function capture(extra) {
  const nodes = [], owned = new Set(['AgentDistributionMatrix', 'MatrixSelect', 'CellReading']);
  function inspect(node) {
    if (Array.isArray(node)) return node.map(inspect);
    if (!React.isValidElement(node)) return node;
    nodes.push(node);
    if (typeof node.type === 'function' && owned.has(node.type.name)) return h(function Probe() { return inspect(node.type(node.props)); });
    return React.cloneElement(node, {}, React.Children.map(node.props.children, inspect));
  }
  render(inspect(h(AgentDistributionMatrix, { ...props, onExpand() {}, ...extra })));
  return nodes;
}
const cellButtons = nodes => nodes.filter(node => node.props['data-matrix-cell'] !== undefined);
const select = (nodes, label) => {
  const control = nodes.find(node => node.props.onValueChange && React.Children.toArray(node.props.children).some(child => child.props?.['aria-label'] === label));
  assert.ok(control, label);
  return { props: { onChange: control.props.onValueChange } };
};
const button = (nodes, label) => nodes.find(node => node.props.onClick && React.Children.toArray(node.props.children).filter(child => typeof child === 'string').join('') === label);

test('SSR defaults to inline and distinguishes a supplied key-region summary from the complete workspace table', () => {
  assert.equal(htmlFor(), htmlFor({ view: 'inline', density: 'default' }));
  const inline = htmlFor(), workspace = htmlFor({ view: 'workspace', onIntent() {} });
  for (const text of ['教师指定区域', '这一处需要查看过程。', '摘要依据：教师批注', '07.2500', '样本量：2 名学生', '分母：按对应满分', '统计口径：页面提供的原样口径', '数据版本：结果 v7']) assert.ok(inline.includes(text), text);
  assert.doesNotMatch(inline, /<table|行维度|对照一/);
  assert.match(workspace, /<table/); assert.match(workspace, /行维度/); assert.match(workspace, /列维度/);
  assert.doesNotMatch(workspace, /教师指定区域|查看完整分布/);
  assert.match(htmlFor({ keyRegions: [] }), /暂未提供关键区域摘要/);
  assert.doesNotMatch(htmlFor({ keyRegions: [] }), /07\.2500/);
});

test('host values, precision, zero and explicit band memberships remain unchanged with no ranking or interpolation', () => {
  const cells = freeze(props.cells.map((cell, i) => i === 0 ? { ...cell, reading: { state: 'available', value: '-0.0010', unit: '%' } } : cell));
  const html = htmlFor({ view: 'workspace', cells, onIntent() {} });
  assert.match(html, /-0\.0010.*?页面分级/); assert.match(html, />0%/);
  assert.doesNotMatch(html, /平均|最低|排名|进步|退步|已读取|已引用/);
  assert.ok(html.indexOf('甲同学') < html.indexOf('乙同学'));
  const withoutBands = htmlFor({ view: 'workspace', bands: [] });
  assert.match(withoutBands, /颜色分级未知/); assert.doesNotMatch(withoutBands, /页面分级/);
});

test('missing, insufficient, unknown and not-applicable ignore accidentally attached values and remain explicit in both states', () => {
  const secret = 'DO_NOT_RENDER_STALE_VALUE';
  for (const [state, label] of [['missing', '缺测'], ['insufficient', '样本不足'], ['unknown', '未知'], ['not-applicable', '不适用']]) {
    const cells = [{ ...props.cells[0], reading: { state, reason: '独立的记录限制。', value: secret, unit: secret }, bandId: 'opaque-band', selectable: false, disabledReason: '独立的记录限制。' }, ...props.cells.slice(1)];
    for (const mode of modes) {
      const html = htmlFor({ ...mode, cells });
      assert.match(html, new RegExp(label)); assert.match(html, /独立的记录限制/); assert.ok(!html.includes(secret));
      assert.equal(times(textOf(html), '独立的记录限制。'), 1);
    }
  }
  const omitted = htmlFor({ view: 'workspace', cells: props.cells.slice(1), onIntent() {} });
  assert.match(omitted, /此位置未提供记录/); assert.doesNotMatch(omitted, /07\.2500/);
  const duplicate = htmlFor({ view: 'workspace', cells: [...props.cells, props.cells[0]] });
  assert.match(duplicate, /同一位置有多份记录/); assert.doesNotMatch(duplicate, /07\.2500/);
});

test('native table is the text equivalent: row/column headers, exact values, state text and sample descriptions are always available', () => {
  const html = htmlFor({ view: 'workspace', onIntent() {} });
  assert.equal(times(html, 'scope="col"'), 3); assert.equal(times(html, 'scope="row"'), 2);
  assert.equal(times(html, 'data-matrix-cell=""'), 4);
  assert.match(html, /aria-label="学生 × 题目分布数据表"/);
  assert.match(html, /role="region"[^>]*aria-label="分布矩阵滚动区域"[^>]*tabindex="0"/);
  for (const text of ['样本不足', '缺测', '缺交', '分母：5 分', '未知：分母', '方向键逐格移动']) assert.ok(html.includes(text), text);
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
  for (const match of html.matchAll(/aria-(?:labelledby|describedby)="([^"]+)"/g)) for (const id of match[1].split(' ')) assert.ok(ids.has(id), id);
  assert.doesNotMatch(html, /<canvas|role="img"/);
});

test('cell selection emits exact row/column/dimension/record/version and original trigger; props and display stay unchanged', () => {
  const calls = [], trigger = { fixture: 'cell-button' }, cells = freeze(structuredClone(props.cells));
  const input = { view: 'workspace', cells, onIntent: (...args) => calls.push(args) };
  const before = htmlFor(input), buttons = cellButtons(capture(input));
  buttons[0].props.onClick({ currentTarget: trigger });
  assert.deepEqual(calls, [[{ ...target, type: 'select-cell', ...cellRef }, trigger]]);
  assert.equal(htmlFor(input), before); assert.equal(buttons[0].props['aria-pressed'], false);
  const selected = cellButtons(capture({ ...input, selectedCell: cellRef }));
  assert.equal(selected[0].props['aria-pressed'], true);
  assert.equal(selected[0].props.tabIndex, 0);
});

test('summary cell drilldown uses the same version-bound payload and has no independent evidence state', () => {
  const calls = [], trigger = { fixture: 'summary-button' };
  const nodes = capture({ onIntent: (...args) => calls.push(args) });
  button(nodes, '查看依据').props.onClick({ currentTarget: trigger });
  assert.deepEqual(calls, [[{ ...target, type: 'select-cell', ...cellRef }, trigger]]);
});

test('unavailable or invalid actions are guarded even if their handlers are called directly', () => {
  for (const extra of [{ record: { ...props.record, version: '' } }, { record: { ...props.record, id: '' } }, { rowDimension: { ...props.rowDimension, id: '' } }, { cells: props.cells.map(cell => ({ ...cell, selectable: false })) }]) {
    const calls = [], nodes = capture({ view: 'workspace', ...extra, onIntent: event => calls.push(event) });
    for (const node of cellButtons(nodes)) { assert.equal(node.props['aria-disabled'], true); node.props.onClick({ currentTarget: {} }); }
    assert.deepEqual(calls, []);
  }
  const calls = [], nodes = capture({ view: 'workspace', onIntent: event => calls.push(event) });
  cellButtons(nodes)[2].props.onClick({ currentTarget: {} }); cellButtons(nodes)[3].props.onClick({ currentTarget: {} });
  assert.deepEqual(calls, []);
  assert.equal(times(htmlFor({ view: 'workspace' }), '当前未开放视图调整与单元格下钻。'), 1);
});

test('dimension, filter, sort and comparison requests do not mutate supplied dimensions, order, selection or values', () => {
  const calls = [], input = { view: 'workspace', onIntent: event => calls.push(event) }, before = htmlFor(input), nodes = capture(input);
  select(nodes, '行维度').props.onChange('1'); select(nodes, '列维度').props.onChange('1');
  select(nodes, '显示范围').props.onChange('1'); select(nodes, '排序').props.onChange('1');
  select(nodes, '对照一').props.onChange('0'); select(nodes, '对照维度').props.onChange('0');
  select(nodes, '行维度').props.onChange('none'); select(nodes, '行维度').props.onChange('99');
  assert.deepEqual(calls, [
    { ...target, type: 'change-dimension', axis: 'row', dimensionId: 'opaque-knowledge' },
    { ...target, type: 'change-dimension', axis: 'column', dimensionId: 'opaque-capability' },
    { ...target, type: 'filter', filterId: 'opaque-filter', value: 'opaque-one' },
    { ...target, type: 'sort', sortId: 'opaque-name' },
    { ...target, type: 'compare', axis: 'column', memberIds: ['opaque-column-a', ''] },
    { ...target, type: 'compare', axis: 'row', memberIds: [] },
  ]);
  assert.equal(htmlFor(input), before);
});

test('two-member comparison reuses original cells in supplied order, supports rows and columns and rejects stale pairs', () => {
  const columns = { axis: 'column', memberIds: ['opaque-column-b', 'opaque-column-a'] };
  const nodes = cellButtons(capture({ view: 'workspace', comparison: columns, onIntent() {} }));
  assert.equal(nodes[0].props.children[0].props.entry.reading.value, 0);
  const rows = { axis: 'row', memberIds: ['opaque-row-b', 'opaque-row-a'] };
  const rowNodes = cellButtons(capture({ view: 'workspace', comparison: rows, onIntent() {} }));
  assert.equal(rowNodes[0].props.children[0].props.entry.reading.state, 'insufficient');
  for (const memberIds of [['opaque-column-a'], ['opaque-column-a', 'opaque-column-a'], ['gone', 'opaque-column-a']]) {
    const html = htmlFor({ view: 'workspace', comparison: { axis: 'column', memberIds }, onIntent() {} });
    assert.match(html, /当前仍显示完整矩阵/); assert.equal(times(html, 'data-matrix-cell=""'), 4);
  }
  const calls = [], input = { view: 'workspace', comparison: columns, onIntent: event => calls.push(event) };
  button(capture(input), '取消比较').props.onClick();
  assert.deepEqual(calls, [{ ...target, type: 'compare', axis: 'column', memberIds: [] }]);
});

test('keyboard handlers move focus across all cells including unavailable cells, with row and whole-table Home/End; navigation emits no selection', () => {
  const calls = [], focus = [], buttons = cellButtons(capture({ view: 'workspace', onIntent: event => calls.push(event) }));
  buttons.forEach((button, index) => button.props.ref({ focus: () => focus.push(index) }));
  let prevented = 0;
  const key = (index, key, ctrlKey = false) => buttons[index].props.onKeyDown({ key, ctrlKey, preventDefault: () => prevented++ });
  key(0, 'ArrowRight'); key(1, 'ArrowDown'); key(3, 'ArrowLeft'); key(2, 'ArrowUp');
  key(1, 'ArrowRight'); key(2, 'Home'); key(2, 'End'); key(3, 'Home', true); key(0, 'End', true);
  key(0, 'Tab'); key(0, 'Enter'); key(0, ' ');
  assert.deepEqual(focus, [1, 3, 2, 0, 1, 2, 3, 0, 3]); assert.equal(prevented, 9); assert.deepEqual(calls, []);
  assert.deepEqual(buttons.map(button => button.props.tabIndex), [0, -1, -1, -1]);
});

test('compact changes spacing only and preserves key facts, reasons, values and available controls', () => {
  for (const view of ['inline', 'workspace']) {
    const input = { view, onIntent() {} };
    assert.equal(textOf(htmlFor(input)), textOf(htmlFor({ ...input, density: 'compact' })));
    const nodes = capture({ ...input, density: 'compact' });
    for (const node of nodes.filter(node => node.props['data-agent-distribution-view'] || node.props['data-matrix-cell'] !== undefined)) assert.doesNotMatch(node.props.className, /truncate|line-clamp|text-xs|text-sm/);
  }
});

test('title, notice, shared sample facts, disabled reasons and identical uncertainty notes are merged once', () => {
  for (const mode of modes) {
    const input = { ...mode, onIntent() {}, rowDimension: { ...props.rowDimension, disabledReason: '当前结果不支持调整。' }, columnDimension: { ...props.columnDimension, disabledReason: '当前结果不支持调整。' },
      sort: { ...props.sort, disabledReason: '当前结果不支持调整。' } };
    const html = htmlFor(input);
    for (const text of ['一次标题', '唯一边界提示。', '有效样本不足两份。', '缺交，未收到作答。', '当前结果不支持调整。', '单元格共用口径：样本量：1 份作答']) assert.equal(times(textOf(html), text), 1, text);
    const unknown = htmlFor({ ...mode, record: { id: 'opaque-record', version: '' }, sample: undefined, method: '' });
    assert.match(unknown, /未知：数据版本、数据时间、样本量、分母、统计口径。/);
    const whitespace = htmlFor({ ...mode, record: { id: 'opaque-record', version: ' ', dataTime: ' ' }, sample: { size: ' ', denominator: ' ' }, method: ' ' });
    assert.match(whitespace, /未知：数据版本、数据时间、样本量、分母、统计口径。/);
    assert.doesNotMatch(whitespace, /数据版本：|数据时间：|统计口径：/);
  }
});

test('shared cell facts inherit only explicit defaults; empty overrides remain unknown and differing facts stay visible', () => {
  const html = htmlFor({ view: 'workspace', onIntent() {}, cells: props.cells.map((cell, i) => i === 0 ? { ...cell, sampleSize: '3 份作答', denominator: '15 分' } : cell) });
  for (const text of ['样本量：3 份作答。', '分母：15 分。', '未知：分母。', '单元格共用口径：样本量：1 份作答']) assert.ok(html.includes(text), text);
  const unknown = htmlFor({ view: 'workspace', cellSample: undefined, cells: props.cells.map(cell => ({ ...cell, sampleSize: undefined, denominator: undefined })), onIntent() {} });
  assert.equal(times(unknown, '未知：样本量、分母。'), 1); assert.match(unknown, /全部单元格/);
});

test('details start closed, one boundary hint stays visible, and every decision restriction remains outside details', () => {
  const nodes = capture({ details: '补充实现说明', onIntent() {} });
  const detail = nodes.find(node => node.type.name === 'RecordDetails');
  const html = htmlFor({ details: '补充实现说明', onIntent() {} });
  assert.doesNotMatch(html, /补充实现说明/); assert.match(html, /缺交/); assert.match(html, /有效样本不足/); assert.match(html, /唯一边界提示/);
  assert.equal(detail.props.children, '补充实现说明');
});

test('missing expansion retains the full table and expansion/back emit navigation only', () => {
  const without = htmlFor({ onExpand: undefined }); assert.match(without, /<table/); assert.doesNotMatch(without, /查看完整分布/);
  const calls = [], trigger = { fixture: 'expand' }, input = { onExpand: value => calls.push(value), onBack: () => calls.push('back') };
  const before = htmlFor(input);
  button(capture(input), '查看完整分布').props.onClick({ currentTarget: trigger });
  button(capture({ ...input, view: 'workspace' }), '返回原位置').props.onClick();
  assert.deepEqual(calls, [trigger, 'back']); assert.equal(htmlFor(input), before);
});

test('scope restriction hides all private facts and slots; history uses its own record and requests', () => {
  function Forbidden() { assert.fail('restricted slot mounted'); }
  for (const mode of modes) {
    const secret = 'PRIVATE_SECRET';
    const html = htmlFor({ ...mode, title: secret, record: { id: secret, version: secret }, scope: { state: 'restricted', disclosure: { reason: '当前无权查看。' } }, details: h(Forbidden),
      keyRegions: [{ id: secret, label: secret, summary: h(Forbidden), basis: secret }], notice: secret });
    assert.match(html, /当前无权查看/); assert.ok(!html.includes(secret)); assert.doesNotMatch(html, /<table|查看完整分布|样本量|数据时间|当前状态/);
  }
  const calls = [], record = { ...props.record, version: '历史 v1', snapshot: true }, input = { record, view: 'workspace', onIntent: event => calls.push(event) };
  assert.match(htmlFor(input), /当时数据/); assert.doesNotMatch(htmlFor(input), /当前状态|结果 v7/);
  cellButtons(capture(input))[0].props.onClick({ currentTarget: {} });
  assert.equal(calls[0].version, '历史 v1');
});

test('opaque IDs and implementation vocabulary never appear in DOM, including option values and read-only fallbacks', () => {
  for (const mode of modes) {
    const html = htmlFor({ ...mode, onIntent() {} });
    assert.doesNotMatch(html, /opaque-|条目\s*\d|宿主|回调|受控|localStorage|onIntent/);
  }
});

test('empty axes, absent cells and invalid numeric values do not manufacture zeros or summaries', () => {
  const empty = htmlFor({ view: 'workspace', rowDimension: { ...props.rowDimension, items: [] }, keyRegions: [] });
  assert.match(empty, /当前范围暂无矩阵数据/); assert.doesNotMatch(empty, /<table/);
  for (const value of [NaN, Infinity, '']) {
    const html = htmlFor({ view: 'workspace', cells: [{ ...props.cells[0], reading: { state: 'available', value, unit: '%' } }, ...props.cells.slice(1)] });
    assert.match(html, /未提供有效数值/); assert.doesNotMatch(html, /NaN|Infinity|07\.2500/);
  }
});

test('two labelled fixtures cover 6x4, insufficient/missing/not-applicable, narrow layouts, long Chinese/math and all themes without new catalog entries', async () => {
  assert.equal(fixture.rowDimension.items.length, 6); assert.equal(fixture.columnDimension.items.length, 4); assert.equal(fixture.cells.length, 24);
  for (const purpose of ['students', 'knowledge']) {
    const example = distributionMatrixExamples[purpose];
    for (const view of ['inline', 'workspace']) {
      const html = render(h(DistributionMatrixExample, { purpose, initialView: view, narrow: true }));
      assert.match(html, /固定示例/); assert.ok(html.includes('max-w-[320px]')); assert.match(html, /<math/);
      assert.match(html, purpose === 'students' ? /样本不足/ : /不适用/);
      assert.doesNotMatch(textOf(html), /宿主|回调|受控|意图/);
      await writeFile(new URL(`example-${purpose}-${view}.html`, runtime), html);
      for (const density of ['default', 'compact']) for (const theme of ['light', 'paper', 'dark']) {
        const snapshot = render(h('div', { 'data-ui-version': 'coss-v1', 'data-prism-theme': theme }, h(AgentDistributionMatrix, { ...example, view, density, onExpand() {}, onIntent() {} })));
        await writeFile(new URL(`${purpose}-${view}-${density}-${theme}.html`, runtime), snapshot);
      }
    }
  }
  assert.match(render(h(AgentDistributionMatrixDemo)), /id="distribution-matrix"/);
  assert.match(await readFile(new URL('../components/prism-next/demos/learning-components.tsx', import.meta.url), 'utf8'), /<AgentDistributionMatrixDemo\/>/);
});
