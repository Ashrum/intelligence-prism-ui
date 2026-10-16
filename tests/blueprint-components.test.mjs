import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { components } from '../lib/prism-next/catalog.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const directory = new URL(`../.sites-runtime/blueprint-components-${process.pid}/`, import.meta.url);
await mkdir(directory, { recursive: true });
const bundled = await build({ stdin: { contents: `export * from './components/prism-next/blueprint/blueprint'; export * from './components/prism-next/demos/blueprint';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false });
const file = new URL('bundle.mjs', directory);
await writeFile(file, bundled.outputFiles[0].text);
const api = await import(file);
await rm(directory, { recursive: true });
const h = React.createElement;
const html = el => renderToStaticMarkup(el);

test('demo page renders all blueprint groups without changing the catalog count', () => {
  const out = html(h(api.BlueprintComponentsDemo));
  for (const text of ['按钮与标签页', '卡片与线条', '进度与数据', '反馈与文本', 'SHEET 01 / 04', 'REV 02', 'SHEET 01 / 02', '没有成果序列或已保存版本，不显示 folio。', 'bp-sheet', 'bp-btn', 'bp-seg-tabs', 'bp-steps', 'bp-card', 'bp-size-bar', 'bp-metric', 'bp-facts', 'bp-titleblock', 'bp-callout', 'bp-error', 'bp-annot', 'bp-codebox', 'bp-toast']) assert.ok(out.includes(text), text);
  assert.equal(components.length, 105);
  assert.ok(!components.some(entry => entry.id.startsWith('blueprint')));
});

test('sheet keeps its labelled region and decorative rulers; its chapter index is meaningful', () => {
  const out = html(h(api.BlueprintSheet, { letter: 'A', sheetNo: '01 / 02', title: '标题' }, 'x'));
  const id = out.match(/aria-labelledby="([^"]+)"/)[1];
  assert.match(out, new RegExp(`<h2 id="${id}"`));
  assert.equal((out.match(/class="bp-ruler/g) || []).length, 4);
  assert.equal((out.match(/aria-hidden="true" class="bp-ruler/g) || []).length, 4);
  assert.match(out, /<span class="bp-section-code">A<\/span>/);
  assert.doesNotMatch(out, /aria-hidden="true"[^>]*bp-section-code/);
  assert.doesNotMatch(html(h(api.BlueprintSheet, { title: 't', rulers: false }, 'x')), /bp-ruler/);
  assert.match(html(h(api.BlueprintSheet, { title: '三级章节', headingLevel: 3, rulers: false }, 'x')), /<h3 id="[^"]+"[^>]*>三级章节<\/h3>/);
});

test('standalone chapter header and semantic subsection preserve caller ids, content and folio meaning', () => {
  const header = html(h(api.BlueprintSectionHeader, { title: '长中文章节标题', code: '02', headingId: 'independent-heading', headingLevel: 3, folio: { kind: 'section', value: '02 / 12' }, description: '完整说明' }));
  assert.match(header, /<h3 id="independent-heading"[^>]*>长中文章节标题<\/h3>/);
  assert.match(header, />SECTION 02 \/ 12<\/p>/);
  assert.doesNotMatch(header, /SHEET|bp-ruler|data-slot="bp-sheet"/);
  const oldMinor = html(h(api.BpMinor, { id: 'old-minor', className: 'mt-6' }, '原有中文标题'));
  assert.match(oldMinor, /^<h3 id="old-minor" class="[^"]*mt-6/);
  assert.match(oldMinor, />原有中文标题<\/span><\/h3>/);
  const minor = html(h(api.BpMinor, { id: 'semantic-minor', code: 'BP-01.1', label: '完整中文小节', headingLevel: 4 }));
  assert.match(minor, /^<h4 id="semantic-minor"/);
  assert.match(minor, /<span class="bp-minor-code">BP-01.1<\/span><span class="bp-minor-label">完整中文小节<\/span>/);
  assert.match(html(h(api.BpFigCap, { label: 'FIG. 1' }, '图注')), /^<p[^>]*><span>FIG. 1<\/span><span>图注<\/span><\/p>$/);
});

test('segmented control is a radiogroup with one tab stop and aria-checked', () => {
  const out = html(h(api.BpSegTabs, { label: '状态', value: 'b', onValueChange() {}, items: [{ value: 'a', label: '甲' }, { value: 'b', label: '乙' }, { value: 'c', label: '丙', disabled: true }] }));
  assert.match(out, /role="radiogroup" aria-label="状态" aria-orientation="horizontal"/);
  assert.equal((out.match(/role="radio"/g) || []).length, 3);
  assert.equal((out.match(/tabindex="0"/g) || []).length, 1);
  assert.match(out, /aria-checked="true" tabindex="0"[^>]*>乙/);
  assert.match(out, /disabled=""[^>]*>丙/);
});

test('segmented control keeps an enabled entry point when the selected item is missing or disabled', () => {
  const items = [{ value: 'disabled', label: '禁用项', disabled: true }, { value: 'first', label: '首个可用项' }, { value: 'last', label: '末项' }];
  for (const value of ['missing', 'disabled']) {
    const out = html(h(api.BpSegTabs, { label: '状态', value, onValueChange() {}, items }));
    assert.equal((out.match(/tabindex="0"/g) || []).length, 1);
    assert.match(out, /tabindex="0"[^>]*>首个可用项/);
    assert.doesNotMatch(out, /tabindex="0"[^>]*disabled/);
  }
  for (const unavailable of [[], items.map(item => ({ ...item, disabled: true }))]) {
    const out = html(h(api.BpSegTabs, { label: '状态', value: 'missing', onValueChange() {}, items: unavailable }));
    assert.doesNotMatch(out, /tabindex="0"/);
  }
});

test('steps expose current step and textual state; bars write values out', () => {
  const steps = html(h(api.BpSteps, { current: 1, steps: [{ id: 'a', label: '一' }, { id: 'b', label: '二' }, { id: 'c', label: '三' }] }));
  assert.match(steps, /data-state="done"/); assert.match(steps, /data-state="current" aria-current="step"/); assert.match(steps, /data-state="todo"/);
  assert.match(steps, /（已完成）/); assert.match(steps, /（当前）/);
  const bar = html(h(api.BpSizeBar, { rows: [{ id: 'r', label: '全班', unit: '人', segments: [{ id: 'x', label: '已批阅', value: 3, fill: 'ink' }, { id: 'z', label: '零', value: 0, fill: 'quiet' }] }] }));
  assert.match(bar, /role="img" aria-label="全班：已批阅 3人，零 0人"/);
  assert.equal((bar.match(/class="bp-fill-ink" style/g) || []).length, 1);
  assert.doesNotMatch(bar, /class="bp-fill-quiet" style/);
});

test('buttons default to type=button; card element follows interaction', () => {
  assert.match(html(h(api.BpButton, { variant: 'primary' }, 'x')), /<button type="button" data-variant="primary" class="bp-btn">/);
  assert.match(html(h(api.BpButton, {}, 'x')), /<button type="button" class="bp-btn">/);
  assert.match(html(h(api.BpCard, { name: 'n', description: 'd', href: '/x' })), /^<a href="\/x" class="bp-card">/);
  assert.match(html(h(api.BpCard, { name: 'n', description: 'd', onSelect() {} })), /^<button type="button" class="bp-card">/);
  assert.match(html(h(api.BpCard, { name: 'n', description: 'd' })), /^<div class="bp-card">/);
  assert.match(html(h(api.BpError, { location: 'L', message: 'm', example: 'e' })), /role="alert"[\s\S]*✓ 正确示例/);
});

test('unavailable blueprint controls preserve native disabled and accessible reason', () => {
  for (const [Component, props] of [[api.BpButton, { variant: 'primary' }], [api.BpButton, { variant: 'danger' }], [api.BpTool, { iconOnly: true, 'aria-label': '查看材料' }]]) {
    const out = html(h(Component, { ...props, disabled: true, 'aria-describedby': 'unavailable' }, '不可用'));
    assert.match(out, /<button[^>]*disabled=""/);
    assert.match(out, /aria-describedby="unavailable"/);
    assert.match(out, /type="button"/);
    assert.doesNotMatch(out, /tabindex="0"/);
  }
});

test('foundation sample distinguishes fixed task facts, real local links and accessible reading panels', () => {
  const out = html(h(api.BlueprintComponentsDemo));
  assert.match(out, /均为固定示例数据/);
  assert.match(out, /aria-label="固定步骤样例"/);
  assert.doesNotMatch(out, />下一步<|>开始批阅/);
  assert.equal((out.match(/<a[^>]*class="bp-card"/g) || []).length, 2);
  assert.equal((out.match(/<div class="bp-card"/g) || []).length, 1);
  const ids = new Set([...out.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]));
  for (const [, id] of out.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.has(id), `missing anchor ${id}`);
  for (const [, refs] of out.matchAll(/aria-(?:labelledby|describedby)="([^"]+)"/g)) for (const id of refs.split(' ')) assert.ok(ids.has(id), `missing accessible reference ${id}`);
  assert.match(out, /role="tablist"[^>]*aria-label="长内容阅读样例"|aria-label="长内容阅读样例"[^>]*role="tablist"/);
  assert.match(out, /aria-disabled="true"[^>]*>未提供的参考材料/);
  assert.match(out, /role="tabpanel"/);
  assert.match(out, /<math[^>]*display="block"[^>]*aria-label="一元二次方程的一般形式，a 不等于零"/);
  assert.match(out, /role="group"[^>]*aria-label="[^"]*超出宽度时可横向滚动[^>]*tabindex="0"/);
});

test('route and navigation exist; blueprint.css draws DemoSection as a sheet only in blueprint', async () => {
  const page = await readFile(new URL('../app/(next)/next/foundations/blueprint/page.tsx', import.meta.url), 'utf8');
  assert.match(page, /BlueprintComponentsDemo/);
  assert.match(await readFile(new URL('../components/prism-next/shell.tsx', import.meta.url), 'utf8'), /\/next\/foundations\/blueprint/);
  const css = await readFile(new URL('../app/(next)/next/blueprint.css', import.meta.url), 'utf8');
  assert.match(css, /:is\(\[data-prism-theme="blueprint"\],\[data-prism-theme="blueprint-night"\]\) \.prism-demo-section[^{]*\{[^}]*counter-increment:bp-sheet/);
  assert.match(css, /content:counter\(bp-sheet, upper-alpha\)/);
  assert.match(css, /:is\(\[data-prism-theme="blueprint"\],\[data-prism-theme="blueprint-night"\]\) :is\(\.prism-demo,\.analytics-panel\)/);
  assert.match(css, /:where\(\[data-slot="sidebar-inset"\]\)[^{]*\{[^}]*linear-gradient\(var\(--grid\)/);
});
