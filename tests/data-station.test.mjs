import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { components, componentGroups } from '../lib/prism-next/catalog.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const dir = new URL('../.sites-runtime/data-station-test/', import.meta.url);
await mkdir(dir, { recursive: true });
const file = new URL('bundle.mjs', dir);
await writeFile(file, (await build({ stdin: { contents: `export * from './components/prism-next/data-station'; export * from './components/prism-next/demos/data-station'; export * from './components/prism-next/material-intake'; export {materialIntakeBase} from './components/prism-next/demos/material-intake';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false })).outputFiles[0].text);
const { DataStation, DataStationBadge, DataStationDemo, dataStationBase: base, dataStationFixtures: fixtures, MaterialIntake, materialIntakeBase } = await import(file);
await rm(file);
const h = React.createElement;
function capture(props = {}, Component = DataStation) {
  const nodes = [], owned = new Set(['DataStation', 'DataStationPanel', 'DataStationBadge']);
  function walk(n) {
    if (Array.isArray(n)) return n.map(walk);
    if (!React.isValidElement(n)) return n;
    if (typeof n.type === 'function' && owned.has(n.type.name)) return h(function Probe() { return walk(n.type(n.props)); });
    nodes.push(n);
    return React.cloneElement(n, {}, React.Children.map(n.props.children, walk));
  }
  const html = render(walk(h(Component, Component === DataStation ? { ...base, ...props } : props)));
  return { html, nodes, action: name => nodes.find(n => n.props['data-station-action'] === name), group: nodes.find(n => n.type?.name === 'RadioGroup') };
}
const alternate = { ...base.devices[0], id: '03', name: '高中部教学数据站 03' };

test('controlled radio selection guards unavailable devices and emits IDs without connecting', () => {
  const calls = [], props = { devices: [...base.devices, alternate, { ...alternate, id: 'unknown', availability: { kind: 'unknown' } }], onSelect: id => calls.push(id) };
  const out = capture(props);
  assert.equal(out.group.props.value, '02');
  for (const id of ['02', '03', '01', 'ms-01', 'unknown', 'missing']) out.group.props.onValueChange(id);
  assert.deepEqual(calls, ['02', '03']); assert.equal(capture(props).group.props.value, '02');
  assert.match(out.html, /高一（5）班 · 预计 6 分钟；暂不可选/); assert.match(out.html, /12 分钟前失联/);
  assert.match(out.html, /可用状态未提供；暂不可选/);
  const radios = out.nodes.filter(n => n.type?.name === 'Radio');
  assert.equal(radios.filter(n => n.props.disabled).length, 3);
  for (const radio of radios) assert.ok(out.nodes.some(n => n.props.id === radio.props['aria-describedby']));
  assert.equal((out.html.match(/aria-checked="true"/g) || []).length, 1);
  assert.equal((capture({ ...props, selectedId: '03' }).html.match(/aria-checked="true"/g) || []).length, 1);
});

test('connect wording follows explicit selection and callback does not advance connection', () => {
  const calls = [], props = { devices: [...base.devices, alternate], onConnect: id => calls.push(id) };
  const recommended = capture(props); assert.match(recommended.html, /连接推荐数据站/); recommended.action('connect').props.onClick();
  const selected = capture({ ...props, selectedId: '03' }); assert.match(selected.html, /连接所选数据站/); selected.action('connect').props.onClick();
  assert.deepEqual(calls, ['02', '03']); assert.equal(capture(props).html, recommended.html);
  for (const selectedId of [null, 'missing', '01', 'ms-01']) {
    const out = capture({ ...props, selectedId }); assert.equal(out.action('connect').props.disabled, true); out.action('connect').props.onClick();
  }
  assert.equal(calls.length, 2);
  const stale = capture({ ...props, devices: [{ ...base.devices[0], availability: { kind: 'offline', lostMinutesAgo: -1 } }] });
  assert.equal(stale.action('connect').props.disabled, true); assert.match(stale.html, /失联时间未提供/);
  assert.doesNotMatch(stale.html, /-1 分钟/);
});

test('connecting locks selection and connect; connected only emits target disconnect', () => {
  const calls = [], props = { onSelect: () => assert.fail(), onConnect: () => assert.fail(), connection: { kind: 'connecting', stationId: '02' } };
  const busy = capture(props); assert.equal(busy.action('connect').props.disabled, true); assert.equal(busy.group.props.disabled, true);
  busy.group.props.onValueChange('02'); busy.action('connect').props.onClick(); assert.match(busy.html, /连接中/);
  const connected = capture({ connection: { kind: 'connected', stationId: '02' }, selectedId: '03', onDisconnect: id => calls.push(id) });
  assert.equal(connected.action('connect'), undefined); assert.equal(connected.group.props.disabled, true);
  connected.action('disconnect').props.onClick(); assert.deepEqual(calls, ['02']);
});

test('retry preserves the failed target, guards stale availability and loading retry is distinct', () => {
  const calls = [], props = { connection: { kind: 'failed', stationId: '02', reason: '设备未响应' }, onRetry: intent => calls.push(intent) };
  const failed = capture({ ...props, selectedId: '03' }); assert.match(failed.html, /设备未响应/);
  failed.action('retry').props.onClick(); assert.deepEqual(calls, [{ kind: 'connect', stationId: '02' }]);
  for (const stationId of ['missing', 'ms-01', '01']) { const out = capture({ ...props, connection: { ...props.connection, stationId } }); assert.equal(out.action('retry').props.disabled, true); out.action('retry').props.onClick(); }
  const error = capture({ state: { kind: 'error', reason: '网络失败' }, onRetry: props.onRetry }); error.action('load').props.onClick();
  assert.deepEqual(calls, [{ kind: 'connect', stationId: '02' }, { kind: 'load' }]); assert.match(error.html, /网络失败/);
});

test('missing handlers have linked visible reasons and all panel actions retain 44px targets', () => {
  let closed = 0; capture({ onClose: () => closed++ }).action('close').props.onClick(); assert.equal(closed, 1);
  for (const connection of [{ kind: 'idle' }, { kind: 'connected', stationId: '02' }, { kind: 'failed', stationId: '02', reason: '失败原因' }]) {
    const out = capture({ connection }); out.group.props.onValueChange('02');
    for (const action of out.nodes.filter(n => n.props['data-station-action'])) {
      assert.equal(action.props.disabled, true); assert.ok(out.nodes.some(n => n.props.id === action.props['aria-describedby']));
      assert.match(action.props.className, /min-h-11/); action.props.onClick();
    }
  }
});

test('loading, empty and error replace device facts; refresh, task and unknown facts stay explicit', () => {
  for (const kind of ['loading', 'empty', 'error']) {
    const props = fixtures.find(item => item.props.state.kind === kind).props, out = capture(props);
    assert.equal(out.group, undefined); assert.equal(out.action('connect'), undefined); assert.doesNotMatch(out.html, /ST-HS-02/);
    if (kind === 'loading') { assert.match(out.html, /data-slot="skeleton"/); assert.match(out.html, /aria-busy="true"/); }
    if (kind === 'empty') { assert.match(out.html, /本校未配置数据站/); assert.match(out.html, /请联系学校管理员/); }
  }
  assert.match(capture().html, /高二（3）班 · 数学 · 答题卡批阅/); assert.match(capture().html, /状态每 10 秒刷新/);
  assert.doesNotMatch(capture({ refreshDescription: undefined }).html, /10 秒/);
  const unknown = capture({ recommendedId: 'missing', devices: [{ id: '02', name: '资料接收站', availability: { kind: 'unknown' } }] });
  assert.match(unknown.html, /推荐设备未提供/); assert.match(unknown.html, /纸张能力未提供/); assert.doesNotMatch(unknown.html, /两端在线|0 分钟/);
});

test('badge renders three states, count zero is real, invalid count unknown and opening is intent only', () => {
  let opened = 0;
  for (const [state, label] of [[{ kind: 'connected', name: '02' }, '02 · 已连接'], [{ kind: 'available', count: 1 }, '1 台可用'], [{ kind: 'disconnected' }, '未连接'], [{ kind: 'available', count: 0 }, '0 台可用'], [{ kind: 'available', count: NaN }, '可用数量未提供']]) {
    const out = capture({ state, onOpen: () => opened++ }, DataStationBadge); assert.ok(out.html.includes(label));
    const button = out.nodes.find(n => n.props['data-station-badge'] !== undefined); button.props.onClick(); assert.match(button.props.className, /min-h-11/);
  }
  assert.equal(opened, 5); assert.match(capture({ state: { kind: 'disconnected' } }, DataStationBadge).html, /disabled|数据站入口暂不可用/);
});

test('default presentation is a controlled Sheet; close intent does not mutate open', () => {
  let closed = 0; const out = capture({ presentation: undefined, open: false, onClose: () => closed++ });
  const sheet = out.nodes.find(n => typeof n.props.onOpenChange === 'function'); assert.ok(sheet); assert.equal(sheet.props.open, false);
  sheet.props.onOpenChange(false); sheet.props.onOpenChange(true); assert.equal(closed, 1); assert.equal(sheet.props.open, false);
  const popup = out.nodes.find(n => n.type?.name === 'SheetPopup'); assert.equal(popup.props.side, 'right'); assert.match(popup.props.closeProps.className, /min-h-11 min-w-11/);
});

test('catalog, fixtures and MaterialIntake keep shared connection semantics without old API changes', async () => {
  assert.equal(components.filter(item => item.id === 'data-station').length, 1);
  assert.ok(componentGroups.find(group => group.id === 'content').items.some(item => item.id === 'data-station'));
  const html = render(h(DataStationDemo)); assert.doesNotMatch(html, /示例|演示/);
  for (const theme of ['light', 'paper', 'dark']) assert.ok(html.includes(`data-prism-theme="${theme}"`));
  assert.match(html, /320px/); assert.match(html, /<math>/);
  for (const [connection, label] of Object.entries({ connected: '已连接', available: '可用', disconnected: '未连接', offline: '离线', unknown: '连接状态未提供' })) {
    assert.ok(render(h(MaterialIntake, { ...materialIntakeBase, station: { connection } })).includes(label));
  }
  const source = await readFile(new URL('../components/prism-next/data-station.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /setInterval|setTimeout|fetch\(|localStorage/);
});
