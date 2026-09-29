import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = new URL('../.sites-runtime/template-picker/', import.meta.url);
await mkdir(runtime, { recursive: true });
const options = { stdin: { contents: `export * from './components/prism-next/agent-template-picker'; export * from './components/prism-next/demos/agent-template-picker';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false };
const file = new URL('test-bundle.mjs', runtime);
await writeFile(file, (await build(options)).outputFiles[0].text);
const { AgentTemplatePicker, TemplatePickerExample, templateExamples } = await import(file);
// Replace only this component's transient useState for deterministic handler rerenders.
// Primitive keyboard/focus/browser behavior is explicitly outside this harness.
const probeFile = new URL('probe-bundle.mjs', runtime);
await writeFile(probeFile, (await build({ ...options, plugins: [{ name: 'template-ui-state', setup(build) {
  build.onLoad({ filter: /components\/prism-next\/agent-template-picker\.tsx$/ }, async args => ({ loader: 'tsx', contents: (await readFile(args.path, 'utf8'))
    .replace('useId, useState, type ReactNode', 'useId, type ReactNode')
    .replace('const hasText =', 'const useState = (initial: any): any => { const p = (globalThis as any).__templateUI; const index = p.cursor++; if (!(index in p.values)) p.values[index] = initial; return [p.values[index], (value: any) => { p.values[index] = typeof value === "function" ? value(p.values[index]) : value }]; };\nconst hasText =') }));
} }] })).outputFiles[0].text);
const { AgentTemplatePicker: Probe } = await import(probeFile);
await rm(file); await rm(probeFile);
const h = React.createElement;
const first = { id: 'opaque-first', name: '期中卷', objectType: '试卷', summary: '三大题，满分 100', scope: '函数单元', source: '模拟模板库', version: { id: 'opaque-tv1', label: '示例第一版' }, recommended: true, recommendationReason: '用于单元复习。', categoryId: 'opaque-exam', availability: { state: 'available' }, structure: [{ key: 'opaque-score', label: '满分', value: '100 分' }], preview: h('p', {}, '示例题面'), selectionImpact: { requiresConfirmation: false, description: '仅记录选择，不改变内容。' } };
const second = { ...first, id: 'opaque-second', name: '随堂练习', summary: '两部分，不设总分', recommendationReason: null, categoryId: 'opaque-practice', selectionImpact: { requiresConfirmation: true, description: '重新分组，已设分值丢失。' }, structure: [{ key: 'opaque-score', label: '满分', value: '不设总分' }] };
const unavailable = { ...first, id: 'opaque-third', name: '单元测验', recommended: false, availability: { state: 'unavailable', reason: '版面正在修订。' }, selectionImpact: undefined };
const base = { title: '模板选择', templateSet: { id: 'opaque-set', version: 'opaque-v1' }, templates: [first, second, unavailable], selectedId: first.id, onIntent() {} };
const context = { templateSetId: 'opaque-set', version: 'opaque-v1' };
const modes = [{}, { view: 'workspace' }, { density: 'compact' }, { view: 'workspace', density: 'compact' }];
const htmlFor = extra => render(h(AgentTemplatePicker, { ...base, ...extra }));
const textOf = node => typeof node === 'string' ? node : Array.isArray(node) ? node.map(textOf).join('') : React.isValidElement(node) ? textOf(node.props.children) : '';
const button = (nodes, label) => nodes.find(node => node.props.onClick && (node.props['aria-label'] === label || textOf(node.props.children) === label));
const reset = () => { globalThis.__templateUI = { cursor: 0, values: [] }; };
function capture(extra = {}) {
  globalThis.__templateUI.cursor = 0;
  const nodes = [];
  function inspect(node) {
    if (Array.isArray(node)) return node.map(inspect);
    if (!React.isValidElement(node)) return node;
    if (node.type === Probe) return h(function Visit() { return inspect(Probe(node.props)); });
    nodes.push(node);
    return React.cloneElement(node, {}, React.Children.map(node.props.children, inspect));
  }
  const html = render(inspect(h(Probe, { ...base, ...extra })));
  return { nodes, html };
}
const click = (nodes, label) => { const node = button(nodes, label); assert.ok(node, label); node.props.onClick({ currentTarget: { closest() { return null; } } }); return node; };
function freeze(value) { if (value && typeof value === 'object') { Object.freeze(value); Object.values(value).forEach(freeze); } return value; }

test('SSR two views and compact keep controlled selection, recommendation, summary and limits', () => {
  for (const mode of modes) {
    const html = htmlFor(mode);
    for (const copy of ['当前选择', '三大题，满分 100', '推荐理由未知', '版面正在修订。', '影响未知', '选择模板不代表已应用到内容。']) assert.ok(html.includes(copy), copy);
    assert.doesNotMatch(html, /opaque-|宿主|回调|意图|localStorage/);
    assert.match(html, new RegExp(`data-density="${mode.density ?? 'default'}"`));
  }
  assert.doesNotMatch(htmlFor({ onExpand() {} }), /单元测验/);
  assert.match(htmlFor({ onExpand() {}, view: 'workspace' }), /单元测验/);
  assert.match(htmlFor({ templates: [], selectedId: null }), /尚未选择模板/);
});

test('select emits exact identity/version without applying or mutating input', () => {
  reset(); const calls = [], templates = freeze([ { ...first, preview: undefined } ]);
  const extra = { templates, selectedId: null, onIntent: value => calls.push(value) };
  const before = htmlFor(extra); click(capture(extra).nodes, '选择期中卷');
  assert.deepEqual(calls, [{ ...context, type: 'select', templateId: first.id, templateVersion: first.version.id, previousTemplateId: null, confirmed: false, impact: first.selectionImpact.description }]);
  assert.equal(htmlFor(extra), before);
});

test('impactful and unknown selections require explicit confirm; cancel sends nothing', () => {
  for (const impact of [second.selectionImpact, undefined, { requiresConfirmation: false, description: '' }]) {
    reset(); const calls = [], item = { ...second, selectionImpact: impact }, extra = { templates: [first, item], onIntent: value => calls.push(value) };
    click(capture(extra).nodes, '选择随堂练习'); assert.equal(calls.length, 0);
    let state = capture(extra); assert.match(state.html, /确认切换/);
    assert.ok(state.html.includes(impact?.description || '影响未知'));
    click(state.nodes, '取消切换'); assert.equal(calls.length, 0); assert.doesNotMatch(capture(extra).html, /确认切换/);
    click(capture(extra).nodes, '选择随堂练习'); click(capture(extra).nodes, '确认切换');
    assert.deepEqual(calls, [{ ...context, type: 'select', templateId: second.id, templateVersion: second.version.id, previousTemplateId: first.id, confirmed: true, impact: impact?.description || null }]);
    assert.doesNotMatch(capture(extra).html, /确认切换/);
  }
});

test('changed version, selection, impact or availability invalidates pending confirmation', () => {
  for (const update of [ { templateSet: { id: 'opaque-set', version: 'new' } }, { selectedId: null }, { templates: [first, { ...second, selectionImpact: { ...second.selectionImpact, description: '新影响' } }] }, { templates: [first, { ...second, availability: { state: 'unavailable', reason: '已失效' } }] } ]) {
    reset(); const extra = { onIntent() { assert.fail('stale confirmation'); } };
    click(capture(extra).nodes, '选择随堂练习'); assert.match(capture(extra).html, /确认切换/);
    assert.doesNotMatch(capture({ ...extra, ...update }).html, /确认切换/);
  }
});

test('unavailable/unknown, global restrictions and invalid identities guard handlers', () => {
  for (const restriction of [{ disabledReason: '' }, { disabledReason: '正在核对。' }, { onIntent: undefined }, { templateSet: { id: '', version: '' } }, { templates: [first, first, second] }]) {
    reset(); const extra = { onIntent() { assert.fail('blocked'); }, ...restriction };
    const nodes = capture(extra).nodes, select = button(nodes, '选择随堂练习');
    assert.equal(select.props.disabled, true); click(nodes, '选择随堂练习'); assert.doesNotMatch(capture(extra).html, /确认切换/);
  }
  for (const state of ['unavailable', 'unknown']) {
    reset(); const extra = { templates: [{ ...unavailable, availability: { state, reason: '不能使用。' } }], selectedId: null, onIntent() { assert.fail('unavailable'); } };
    const nodes = capture(extra).nodes; assert.equal(button(nodes, '选择单元测验').props.disabled, true); click(nodes, '选择单元测验');
    assert.match(capture(extra).html, /不能使用/);
  }
});

test('preview, clear and management emit exact payloads; preview is externally controlled', () => {
  reset(); const calls = [], extra = { view: 'workspace', manage: {}, onIntent: value => calls.push(value) };
  const before = htmlFor(extra); const nodes = capture(extra).nodes;
  click(nodes, '预览期中卷'); click(nodes, '清除选择'); click(nodes, '管理与配置');
  assert.deepEqual(calls, [{ ...context, type: 'preview', templateId: first.id, templateVersion: first.version.id }, { ...context, type: 'clear', previousTemplateId: first.id }, { ...context, type: 'request-manage' }]);
  assert.equal(htmlFor(extra), before); assert.doesNotMatch(before, /示例题面/);
  assert.match(htmlFor({ ...extra, previewId: first.id }), /示例题面/);
  for (const disabledReason of ['', '无管理权限。']) {
    reset(); const extra = { view: 'workspace', manage: { disabledReason }, onIntent() { assert.fail('blocked management'); } };
    const nodes = capture(extra).nodes; assert.equal(button(nodes, '管理与配置').props.disabled, true); click(nodes, '管理与配置');
  }
});

test('comparison needs exactly two UI choices; emits host structure identities, no inferred differences', () => {
  reset(); const calls = [], extra = { view: 'workspace', onIntent: value => calls.push(value) };
  let state = capture(extra); assert.equal(button(state.nodes, '对比结构').props.disabled, true); click(state.nodes, '对比结构');
  for (const name of ['期中卷', '随堂练习']) capture(extra).nodes.find(node => node.props['aria-label'] === `对比${name}`).props.onCheckedChange(true);
  state = capture(extra); assert.equal(state.nodes.find(node => node.props['aria-label'] === '对比单元测验').props.disabled, true);
  state.nodes.find(node => node.props['aria-label'] === '对比单元测验').props.onCheckedChange(true);
  click(capture(extra).nodes, '对比结构');
  assert.deepEqual(calls, [{ ...context, type: 'compare', templateIds: [first.id, second.id], templateVersions: [first.version.id, second.version.id] }]);
  assert.doesNotMatch(capture(extra).html, /结构对比 ·/);
  const html = htmlFor({ ...extra, comparison: [first.id, second.id] }); assert.match(html, /100 分/); assert.match(html, /不设总分/); assert.doesNotMatch(html, /减少|增加|优于/);
  assert.doesNotMatch(htmlFor({ ...extra, comparison: [first.id, first.id] }), /结构对比 ·/);
});

test('category filtering only changes visible list and preserves current choice plus all templates after reset', () => {
  reset(); const extra = { view: 'workspace', categories: [{ id: 'opaque-exam', label: '考试' }, { id: 'opaque-practice', label: '练习' }] };
  const filter = () => capture(extra).nodes.find(node => node.props.onValueChange);
  filter().props.onValueChange('1'); const filtered = capture(extra).html;
  assert.equal((filtered.match(/data-template-item=/g) ?? []).length, 2); assert.match(filtered, /当前选择不属于此分类/); assert.match(filtered, /三大题，满分 100/);
  filter().props.onValueChange('all'); assert.equal((capture(extra).html.match(/data-template-item=/g) ?? []).length, 3);
  assert.doesNotMatch(filtered, /opaque-/);
});

test('exact common copy appears once; titles once; unknowns stay in one line, details collapsed', () => {
  for (const mode of modes) {
    const html = htmlFor({ ...mode, details: 'HIDDEN_DETAIL', templates: [first, { ...second, availability: { state: 'unavailable', reason: '共同原因。' } }, { ...unavailable, availability: { state: 'unavailable', reason: '共同原因。' } }] });
    for (const copy of ['来源：模拟模板库', '版本：示例第一版', '不可选原因：共同原因。', '选择模板不代表已应用到内容。']) assert.equal(html.split(copy).length - 1, 1, copy);
    assert.equal((html.match(/>模板 1 · 期中卷</g) ?? []).length, 1);
    assert.equal((html.match(/id="[^"]*-unknown"/g) ?? []).length, 1);
    assert.doesNotMatch(html, /HIDDEN_DETAIL/);
  }
});

test('ARIA references exist; navigation carries trigger without selecting, compact preserves notices', () => {
  reset(); const calls = [], trigger = {}, extra = { view: 'workspace', disabledReason: '暂不能调整。', manage: { disabledReason: '暂不能调整。' }, onBack: () => calls.push('back') };
  const { nodes, html } = capture(extra);
  for (const node of nodes) for (const attr of ['aria-labelledby', 'aria-describedby']) for (const id of (node.props[attr] ?? '').split(' ').filter(Boolean)) assert.ok(html.includes(`id="${id}"`), `${attr} ${id}`);
  click(nodes, '返回原位置');
  const inline = capture({ onExpand: value => calls.push(value) }).nodes; button(inline, '查看全部模板').props.onClick({ currentTarget: trigger });
  assert.deepEqual(calls, ['back', trigger]);
  assert.doesNotMatch(htmlFor({ notice: null, presentation: 'inline' }), /data-template-notice|data-slot="card"/);
});

test('demo has two domains, three layouts, narrow long Chinese and formula preview fixtures', () => {
  for (const purpose of ['paper', 'lesson']) {
    const html = render(h(TemplatePickerExample, { purpose, narrow: true }));
    assert.equal((html.match(/data-agent-template-view=/g) ?? []).length, 3); assert.match(html, /max-w-\[320px\]/); assert.match(html, /模拟/);
  }
  const preview = htmlFor({ view: 'workspace', templates: templateExamples.paper, selectedId: null, previewId: 'midterm' });
  assert.match(preview, /<math/); assert.match(preview, /兼顾概念辨析/);
});


test('filtering cannot conceal selected template unavailability or unknown impact', () => {
  reset(); const extra = { view: 'workspace', templates: [first, second, unavailable], selectedId: unavailable.id,
    categories: [{ id: 'opaque-practice', label: '练习' }] };
  capture(extra).nodes.find(node => node.props.onValueChange).props.onValueChange('0');
  const html = capture(extra).html;
  for (const copy of ['当前选择不属于此分类', '版面正在修订。', '影响未知', '单元测验', '随堂练习']) assert.ok(html.includes(copy), copy);
  assert.doesNotMatch(html, />模板 1 · 期中卷</);
});

test('notice identical to every impact appears once while partial matches and unknowns remain', () => {
  const notice = first.selectionImpact.description;
  const templates = [first, { ...second, selectionImpact: { ...first.selectionImpact, requiresConfirmation: true } }];
  for (const mode of modes) {
    const out = htmlFor({ ...mode, templates, notice });
    assert.equal(out.split(notice).length - 1, 1);
    assert.doesNotMatch(out, /data-template-notice/);
    assert.match(htmlFor({ ...mode, templates: [first, second], notice }), /data-template-notice/);
    assert.match(htmlFor({ ...mode, templates: [first, unavailable], notice }), /影响未知/);
    assert.match(htmlFor({ ...mode, templates: [], notice }), /data-template-notice/);
  }
  reset(); const calls = [], extra = { templates, notice, onIntent: value => calls.push(value) };
  click(capture(extra).nodes, '选择随堂练习');
  const pending = capture(extra); assert.equal(pending.html.split(notice).length - 1, 1);
  for (const node of pending.nodes) for (const id of (node.props['aria-describedby'] ?? '').split(' ').filter(Boolean)) assert.ok(pending.html.includes(`id="${id}"`));
  click(pending.nodes, '确认切换'); assert.equal(calls[0].impact, notice); assert.equal(calls[0].confirmed, true);
  reset();
  const hidden = { ...extra, view: 'workspace', selectedId: null, categories: [{ id: 'empty', label: '空分类' }] };
  capture(hidden).nodes.find(node => node.props.onValueChange).props.onValueChange('0');
  assert.equal(capture(hidden).html.split(notice).length - 1, 1);
});


test('expanded preview uses layout preview heading and accessible name by default', () => {
  for (const density of ['default', 'compact']) {
    const html = htmlFor({ view: 'workspace', density, previewId: first.id });
    assert.match(html, /aria-label="模板版面预览"/);
    assert.match(html, /<h5[^>]*>版面预览<\/h5>/);
    assert.match(html, /示例题面/);
    assert.doesNotMatch(html, /模板示例版面|>示例版面</);
  }
});
