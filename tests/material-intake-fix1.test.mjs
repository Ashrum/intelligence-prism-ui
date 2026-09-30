import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';

const root = fileURLToPath(new URL('../', import.meta.url));
const dir = new URL('../.sites-runtime/material-intake-fix1/', import.meta.url);
await mkdir(dir, { recursive: true });
const file = new URL('bundle.mjs', dir);
// Retain event handlers and host validation; only replace transient hooks for deterministic rerenders.
const plugin = { name: 'intake-interaction-hooks', setup(b) {
  b.onLoad({ filter: /material-intake\.tsx$/ }, async ({ path }) => {
    const demo = path.includes('/demos/'), key = demo ? 'fixture' : 'selection';
    let contents = (await readFile(path, 'utf8'))
      .replace(demo ? 'import { useState } from "react"' : 'import { useId, useRef, useState } from "react"', demo ? '' : 'import { useId, useRef } from "react"');
    contents += demo ? '\nexport { IntakeFixture };' : '';
    contents = `const useState = (initial: any): any => { const p = (globalThis as any).__intakeFix1.${key}; const i = p.cursor++; if (!(i in p.values)) p.values[i] = initial; return [p.values[i], (v: any) => { p.values[i] = typeof v === 'function' ? v(p.values[i]) : v }]; };\n` + contents;
    return { contents, loader: 'tsx' };
  });
} };
await writeFile(file, (await build({ stdin: { contents: `export * from './components/prism-next/material-intake'; export * from './components/prism-next/demos/material-intake';`, resolveDir: root, loader: 'tsx' }, plugins: [plugin], bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false })).outputFiles[0].text);
const { MaterialIntake, IntakeFixture, materialIntakeBase: base, materialIntakeFixtures: fixtures } = await import(file);
await rm(file);
const h = React.createElement;
function reset() { globalThis.__intakeFix1 = { fixture: { cursor: 0, values: [] }, selection: { cursor: 0, values: [] } }; }
function capture(props = {}, fixture = false) {
  for (const p of Object.values(globalThis.__intakeFix1)) p.cursor = 0;
  const nodes = [], owned = new Set(['IntakeFixture', 'MaterialIntake', 'IntakeSelection', 'AgentFileInput', 'Attachment']);
  function walk(n) {
    if (Array.isArray(n)) return n.map(walk);
    if (!React.isValidElement(n)) return n;
    if (typeof n.type === 'function' && owned.has(n.type.name)) return h(function Probe() { return walk(n.type(n.props)); });
    nodes.push(n);
    return React.cloneElement(n, {}, React.Children.map(n.props.children, walk));
  }
  const all = { ...base, onFilesSelected() {}, ...props };
  const html = render(walk(h(fixture ? IntakeFixture : MaterialIntake, fixture ? { props: all } : all)));
  return { html, nodes, input: nodes.find(n => n.props.type === 'file'), drop: nodes.find(n => n.props['data-file-drop']), button: nodes.find(n => n.props['data-intake-select'] !== undefined), confirm: nodes.find(n => n.props['data-intake-action'] === 'confirm') };
}
const event = (files = [], types = ['Files']) => ({ dataTransfer: { files, types }, preventDefault() {}, stopPropagation() {} });

test('reception button exposes accessible picker, platform hint and limits without capability disclosure', () => {
  reset(); const out = capture(); let clicked = 0;
  assert.match(out.html, /<button[^>]*data-intake-select/);
  assert.equal(out.button.props.type, 'button'); assert.equal(out.button.props.disabled, false);
  assert.match(out.button.props.className, /border-dashed/); assert.match(out.button.props.className, /motion-reduce:transition-none/);
  assert.equal(out.input.props.className, 'sr-only'); assert.equal(out.input.props.tabIndex, -1);
  assert.equal(out.input.props.accept, base.limits.accept); assert.equal(out.input.props.multiple, true);
  for (const id of out.button.props['aria-describedby'].split(' ')) assert.ok(out.nodes.some(n => n.props.id === id), id);
  assert.match(out.html, /点击上传文件，或放入数据站扫描/); assert.match(out.html, /单个文件不超过 20 MB · 最多 10 个文件/);
  assert.doesNotMatch(out.html, /aria-expanded|说明<\/button>/);
  out.input.props.ref.current = { click() { clicked++; } }; out.button.props.onClick(); assert.equal(clicked, 1);
  assert.match(capture({ mode: { kind: 'replace-page', targetLabel: '张明第 2 页' } }).html, /放入第 2 页，或点击上传/);
  assert.match(capture({ platform: 'android' }).html, /优先连接数据站扫描/);
});

test('drop highlight follows allowed file drag, clears on leave/drop, and selection remains capability guarded', () => {
  reset(); const calls = [], props = { onFilesSelected: files => calls.push(files) }, files = [{ name: '页面.pdf' }];
  let out = capture(props); const over = event(files); out.drop.props.onDragOver(over);
  assert.equal(over.dataTransfer.dropEffect, 'copy'); out = capture(props); assert.equal(out.button.props['data-pressed'], '');
  out.drop.props.onDragLeave({ currentTarget: { contains: () => true }, relatedTarget: {} }); assert.equal(capture(props).button.props['data-pressed'], '');
  out.drop.props.onDragLeave({ currentTarget: { contains: () => false }, relatedTarget: null }); assert.equal(capture(props).button.props['data-pressed'], undefined);
  out.drop.props.onDragOver(event(files)); out = capture(props); out.drop.props.onDrop(event(files));
  assert.equal(calls[0][0], files[0]); assert.equal(capture(props).button.props['data-pressed'], undefined);
  const noDrop = { ...props, capabilities: { ...base.capabilities, drop: { status: 'unsupported', reason: '请点击选择' } } };
  out = capture(noDrop); const denied = event(files); out.drop.props.onDragOver(denied); out.drop.props.onDrop(denied);
  assert.equal(denied.dataTransfer.dropEffect, 'none'); assert.equal(calls.length, 1); assert.equal(capture(noDrop).button.props['data-pressed'], undefined);
  out = capture({ ...props, selectionDisabledReason: '请先核对' }); assert.equal(out.button.props.disabled, true);
  out.input.props.ref.current = { click() { assert.fail('disabled picker'); } }; out.button.props.onClick();
  out.input.props.onChange({ currentTarget: { files, value: 'fake' } }); out.drop.props.onDrop(event(files)); assert.equal(calls.length, 1);
});

test('neutral upload explanation reflects each supplied capability, without claiming scanner availability', () => {
  for (const [status, label] of [['supported', '上传服务已连接'], ['limited', '上传服务有限支持'], ['unsupported', '上传服务未连接']]) {
    reset(); const out = capture({ station: { connection: 'offline' }, capabilities: { ...base.capabilities, upload: { status, reason: '调用方能力事实' } } });
    assert.ok(out.html.includes(`${label}：调用方能力事实`)); assert.doesNotMatch(out.html, /可使用数据站扫描|aria-expanded/);
  }
});

test('attachment metadata uses readable PDF, PNG and Word names without mutating original MIME facts', () => {
  for (const [type, label] of [['application/pdf', 'PDF'], ['image/png', 'PNG 图片'], ['application/msword', 'Word'], ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Word']]) {
    reset(); const item = { ...fixtures[1].props.files[0], name: '资料', type }, before = structuredClone(item), out = capture({ files: [item] });
    assert.ok(out.html.includes(`${label} · 420 KB`)); assert.ok(!out.html.includes(type)); assert.deepEqual(item, before);
    if (type === 'image/png') assert.match(out.html, /aria-label="图片文件"/);
  }
});

test('review fixture blocks save after valid selection or invalid drop, preserving the host reception state', () => {
  for (const [method, file, state] of [
    ['select', { name: '新增.pdf', type: 'application/pdf', size: 1024 }, 'selected'],
    ['drop', { name: '不支持.exe', type: 'application/octet-stream', size: 1024 }, 'invalid'],
  ]) {
    reset(); let out = capture(fixtures[1].props, true); assert.equal(out.confirm.props.disabled, false);
    if (method === 'select') out.input.props.onChange({ currentTarget: { files: [file], value: 'fake' } });
    else out.drop.props.onDrop(event([file]));
    out = capture(fixtures[1].props, true);
    assert.match(out.html, /data-state="review"/); assert.ok(out.html.includes(`data-file-state="${state}"`));
    assert.equal(out.confirm.props.disabled, true); assert.match(out.html, /有文件未上传或校验失败/);
    assert.ok(out.nodes.some(n => n.props.id === out.confirm.props['aria-describedby']));
    out.confirm.props.onClick(); assert.doesNotMatch(capture(fixtures[1].props, true).html, /已发出完成并保存请求/);
  }
});

test('receiving page announcements have no busy ancestor and busy marks remain outside live regions', () => {
  for (const pages of [1, 2]) {
    reset(); const out = capture({ state: { kind: 'receiving' }, station: { ...base.station, receivedPages: pages } });
    assert.match(out.html, new RegExp(`已接收 ${pages} 页`));
    const status = out.nodes.find(n => n.props.role === 'status' && n.props['aria-live'] === 'polite');
    assert.equal(status.props['aria-busy'], undefined);
    const busy = out.nodes.filter(n => n.props['aria-busy'] === true); assert.equal(busy.length, 1); assert.equal(busy[0].props['aria-label'], '数据站状态');
    assert.equal(out.nodes.find(n => n.props['data-material-intake'] !== undefined).props['aria-busy'], undefined);
  }
});
