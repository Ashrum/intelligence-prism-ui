import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { components } from '../lib/prism-next/catalog.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const dir = new URL('../.sites-runtime/instrument-test/', import.meta.url);
await mkdir(dir, { recursive: true });
const file = new URL('bundle.mjs', dir);
await writeFile(file, (await build({ stdin: { contents: `export * from './components/prism-next/instrument-panel'; export * from './components/prism-next/demos/instrument-panel';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false })).outputFiles[0].text);
const { InstrumentPanel, InstrumentPanelDemo, instrumentFixtures } = await import(file);
await rm(file);
const h = React.createElement;
const html = props => render(h(InstrumentPanel, props));
const textOf = n => Array.isArray(n) ? n.map(textOf).join('') : React.isValidElement(n) ? textOf(n.props.children) : typeof n === 'string' || typeof n === 'number' ? String(n) : '';
// Execute component under React's renderer and inspect real intent props without simulating business state.
function capture(props) {
  const nodes = [];
  function walk(n) {
    if (Array.isArray(n)) return n.map(walk);
    if (!React.isValidElement(n)) return n;
    nodes.push(n);
    return React.cloneElement(n, {}, React.Children.map(n.props.children, walk));
  }
  return { html: render(h(function Probe() { return walk(InstrumentPanel(props)); })), nodes };
}
const button = (result, label) => result.nodes.find(n => typeof n.props.onClick === 'function' && textOf(n) === label);

test('optional blocks disappear independently and remain in the contracted order', () => {
  const empty = html({});
  assert.match(empty, /<aside/); assert.match(empty, /aria-label="任务状态面板"/);
  assert.doesNotMatch(empty, /data-instrument-(header|metric|current|attention|list|actions|next)/);
  const blocks = {
    title: '当前任务', metric: { value: '未知', label: '外部指标' }, current: { label: '当前处理', title: '未提供' },
    attention: { label: '需关注', title: '需要确认' }, list: { title: '清单', items: [] }, primaryAction: { label: '继续' }, next: { text: '等待' },
  };
  const keys = ['title', 'metric', 'current', 'attention', 'list', 'primaryAction', 'next'];
  const markers = ['header', 'metric', 'current', 'attention', 'list', 'actions', 'next'];
  const full = html(blocks), positions = markers.map(x => full.indexOf(`data-instrument-${x}`));
  assert.ok(positions.every((p, i) => p >= 0 && (i === 0 || p > positions[i - 1])));
  keys.forEach((key, i) => { const partial = { ...blocks }; delete partial[key]; assert.ok(!html(partial).includes(`data-instrument-${markers[i]}`)); });
});

test('primary is unique, disabled reason is visible and ID-linked, IDs are isolated', () => {
  const props = { primaryAction: { label: '开始', disabled: true, disabledReason: '请先确认批阅依据' }, actionNote: '等待确认', onPrimary() {} };
  const out = capture(props), node = button(out, '开始');
  assert.equal(out.nodes.filter(n => 'data-instrument-primary' in n.props).length, 1);
  assert.equal(node.props.disabled, true);
  const note = out.nodes.find(n => n.props.id === node.props['aria-describedby']);
  assert.equal(textOf(note), '请先确认批阅依据等待确认');
  const twins = render(h('div', {}, h(InstrumentPanel, props), h(InstrumentPanel, props)));
  const ids = [...twins.matchAll(/aria-describedby="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, 2);
  assert.match(html({ primaryAction: { label: '开始' } }), /操作暂不可用/);
});

test('all five intent callbacks emit exact IDs without mutating supplied facts', () => {
  const events = [], facts = structuredClone(instrumentFixtures[2]), before = structuredClone(facts);
  const props = { ...facts, headerAction: { label: '配置' }, list: { title: '状态', items: [{ id: 'receive', title: '接收详情', selectable: true }] }, secondaryActions: [{ id: 'export', label: '导出' }],
    onPrimary: () => events.push('primary'), onSecondary: id => events.push(`secondary:${id}`), onHeaderAction: () => events.push('header'), onMetricLink: () => events.push('metric'), onItemSelect: id => events.push(`item:${id}`),
  };
  const out = capture(props);
  for (const label of ['结束扫描并核对', '导出', '配置', '查看名单 →', '接收详情']) { const node = button(out, label); assert.ok(node); assert.ok(!node.props.disabled); node.props.onClick(); }
  assert.deepEqual(events, ['primary', 'secondary:export', 'header', 'metric', 'item:receive']);
  assert.deepEqual(facts, before); assert.equal(capture(props).html, out.html);
});

test('disabled actions guard callbacks and secondary actions never exceed two', () => {
  let count = 0;
  const out = capture({ primaryAction: { label: '开始', disabled: true, disabledReason: '等待' }, onPrimary: () => count++, headerAction: { label: '配置', disabled: true }, onHeaderAction: () => count++, secondaryActions: [{ id: 'a', label: '导出', disabled: true }, { id: 'b', label: '查看' }, { id: 'c', label: '多余操作' }], onSecondary: () => count++ });
  for (const label of ['开始', '配置', '导出']) { assert.equal(button(out, label).props.disabled, true); button(out, label).props.onClick(); }
  assert.equal(count, 0); assert.doesNotMatch(out.html, /多余操作/);
  assert.doesNotMatch(html({ list: { title: '只读', items: [{ id: 'x', title: '只读事项' }] }, onItemSelect: () => count++ }), /<button/);
});

test('status words are always visible and completion marks require explicit facts', () => {
  const out = html({ metric: { value: '2项', label: '资料', status: { label: '需要准备', tone: 'warning' } }, list: { title: '状态', items: [
    { id: 'a', title: '已确认页序', completed: true, status: { label: '正常', tone: 'success' } },
    { id: 'b', title: '补交窗口', status: { label: '有限开放', tone: 'warning' } },
    { id: 'c', title: '未知资料', status: { label: '未提供', tone: 'neutral' } },
  ] }, next: { text: '确认', status: { label: '等待' } } });
  for (const label of ['需要准备', '正常', '有限开放', '未提供', '等待']) assert.ok(out.includes(`>${label}<`));
  const marked = capture({ list: { title: '状态', items: [{ id: 'x', title: '处理记录', status: { label: '已完成' } }] } });
  assert.match(marked.html, />1<\/span>/); // A label alone cannot assert the completed marker.
});

test('only explicit valid progress is rendered; metric text is never parsed', () => {
  const metric = { value: '82%', label: '批阅完成' };
  assert.doesNotMatch(html({ metric }), /role="progressbar"/);
  for (const progress of [{ value: NaN }, { value: Infinity }, { value: -1 }, { value: 101 }, { value: 1, max: 0 }]) assert.doesNotMatch(html({ metric: { ...metric, progress: { ...progress, label: '进度' } } }), /role="progressbar"/);
  for (const value of [0, 82, 100]) assert.match(html({ metric: { ...metric, progress: { value, label: '进度' } } }), new RegExp(`aria-valuenow="${value}"`));
});

test('single metric isolates ancestor queries and keeps one column even in a wide panel', () => {
  const out = capture({ metric: { value: '38/42', label: '已收到 / 预计提交' } });
  const card = out.nodes.find(n => 'data-instrument-metric' in n.props);
  assert.ok(card.props.className.split(' ').includes('@container'));
  // The local, important direct-child override also wins when this container is >= 680px.
  assert.ok(card.props.className.split(' ').includes('[&>dl]:grid-cols-1!'));
  const metric = out.nodes.find(n => n.props.layout === 'strip');
  assert.deepEqual(metric.props.items, [{ id: 'metric', label: '已收到 / 预计提交', value: '38/42' }]);
  // Shared strip behavior remains available to other consumers.
  assert.match(out.html, /@min-\[400px\]:grid-cols-2/);
  assert.match(out.html, /@min-\[680px\]:grid-cols-4/);
});

test('S09 exposes three enabled intents with exact callbacks and preserves background grading facts', () => {
  const facts = structuredClone(instrumentFixtures[3]), before = structuredClone(facts), events = [];
  assert.equal(facts.primaryAction.label, '处理 2 项异常');
  assert.equal(facts.actionNote, 'AI 批阅已在后台进行；完成验收不会重新启动已有批阅');
  assert.deepEqual(facts.secondaryActions, [{ id: 'resume-scan', label: '返回继续扫描' }, { id: 'add', label: '补交学生试卷' }]);
  const props = { ...facts, onPrimary: () => events.push('primary'), onSecondary: id => events.push(`secondary:${id}`) };
  const out = capture(props);
  assert.equal(out.nodes.filter(n => 'data-instrument-primary' in n.props).length, 1);
  for (const label of ['返回继续扫描', '补交学生试卷', '处理 2 项异常']) {
    const node = button(out, label);
    assert.ok(node); assert.equal(node.props.disabled, false); node.props.onClick();
  }
  assert.deepEqual(events, ['secondary:resume-scan', 'secondary:add', 'primary']);
  const note = out.nodes.find(n => n.props.id === button(out, '处理 2 项异常').props['aria-describedby']);
  assert.equal(textOf(note), facts.actionNote);
  assert.deepEqual(facts, before); assert.equal(capture(props).html, out.html);
});

test('loading empty error replace stale facts; retry does not synthesize readiness', () => {
  let retries = 0;
  for (const state of ['loading', 'empty', 'error']) {
    const out = capture({ ...instrumentFixtures[4], state, onRetry: () => retries++, onHeaderAction() {} });
    assert.doesNotMatch(out.html, /82%|查看批阅配置|data-instrument-primary/);
    assert.match(out.html, new RegExp(`data-state="${state}"`));
    if (state === 'loading') { assert.match(out.html, /aria-busy="true"/); assert.match(out.html, /data-slot="skeleton"/); }
    if (state === 'empty') assert.match(out.html, /暂无任务状态/);
    if (state === 'error') { assert.match(out.html, /role="alert"/); button(out, '重试').props.onClick(); }
  }
  assert.equal(retries, 1);
  assert.doesNotMatch(html({ state: 'error' }), /<button/);
});

test('catalog and demo expose six scenarios, three themes, 320px and formula coverage', () => {
  assert.equal(components.filter(c => c.id === 'instrument-panel').length, 1);
  assert.equal(instrumentFixtures.length, 6);
  const out = render(h(InstrumentPanelDemo));
  for (const fixture of instrumentFixtures) assert.ok(out.includes(fixture.title));
  for (const theme of ['light', 'paper', 'dark']) assert.ok(out.includes(`data-prism-theme="${theme}"`));
  assert.match(out, /320px/); assert.match(out, /<math/); assert.match(out, /请先确认批阅依据/);
});

test('compact keeps host facts and intents while moving current after list and using FramePanel sections', () => {
  let calls = 0;
  const props = { compact: true, metric: { value: '未知', label: '已收', linkLabel: '查看名单' }, current: { label: '当前处理', title: '' }, attention: { label: '需关注', title: '等待核对' }, list: { title: '清单', items: [{ id: 'scan', title: '扫描记录', selectable: true }] }, primaryAction: { label: '继续核对跨页作答与完整评分依据' }, onPrimary: () => calls++, onItemSelect: () => calls++, onMetricLink: () => calls++ };
  const out = capture(props);
  const markers = ['metric', 'attention', 'list', 'current', 'actions'].map(key => out.html.indexOf(`data-instrument-${key}`));
  assert.ok(markers.every((value, index) => value >= 0 && (!index || value > markers[index - 1])));
  const metric = out.nodes.find(n => 'data-instrument-metric' in n.props);
  assert.equal(metric.type.name, 'FramePanel'); assert.match(out.html, /data-slot="frame"/); assert.match(metric.props.className, /\[&>dl\]:grid-cols-1!/);
  assert.doesNotMatch(out.html, /role="progressbar"|text-item-title"><\/p>/);
  for (const label of [props.primaryAction.label, '查看名单', '扫描记录']) {
    const node = button(out, label); assert.match(node.props.className, /sm:h-auto/); assert.match(node.props.className, /min-h-1[12]/); node.props.onClick();
  }
  assert.equal(calls, 3); assert.equal(capture(props).html, out.html);
  for (const state of ['loading', 'empty', 'error']) assert.doesNotMatch(html({ ...props, state }), /data-instrument-(metric|current|list|primary)/);
});

 test('meter is opt-in, labeled and bounded; default and explicit progress retain their role', () => {
  const metric = { value: '5/6', label: '已收到', progress: { value: 5, max: 6, label: '已收到试卷量', kind: 'meter' } };
  for (const compact of [false, true]) {
    const out = html({ metric, compact });
    assert.match(out, /role="meter"/); assert.match(out, /aria-valuenow="5"/); assert.match(out, /aria-valuemax="6"/);
    assert.match(out, /已收到试卷量/); assert.match(out, /5 \/ 6/); assert.doesNotMatch(out, /role="progressbar"/);
  }
  for (const kind of [undefined, 'progress']) {
    const out = html({ metric: { ...metric, progress: { ...metric.progress, kind } } });
    assert.match(out, /role="progressbar"/); assert.doesNotMatch(out, /role="meter"/);
  }
  for (const progress of [{ value: -1 }, { value: NaN }, { value: Infinity }, { value: 7 }, { max: 0 }, { max: Infinity }]) {
    assert.doesNotMatch(html({ metric: { ...metric, progress: { ...metric.progress, ...progress } } }), /role="meter"/);
  }
  for (const value of [0, 6]) assert.match(html({ metric: { ...metric, progress: { ...metric.progress, value } } }), new RegExp(`aria-valuenow="${value}"`));
});
