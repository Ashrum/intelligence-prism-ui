import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { createTestRuntime } from './helpers/test-runtime.mjs';
import { components, searchComponents } from '../lib/prism-next/catalog.ts';
import { themeOptions } from '../lib/prism-next/config.ts';

const runtime = await createTestRuntime('p179');
const bundle = await build({
  stdin: { contents: `export * from './components/prism-next/authoring-surface';
export * from './components/prism-next/demos/authoring-surface';
export { Input } from './components/coss/input';
export { Textarea } from './components/coss/textarea';`, resolveDir: process.cwd(), loader: 'tsx' },
  bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': process.cwd() }, loader: { '.css': 'empty' }, write: false,
});
const file = new URL('components.mjs', runtime);
await writeFile(file, bundle.outputFiles[0].text);
const api = await import(file.href);
const h = React.createElement;
const css = await readFile('components/prism-next/authoring-surface.css', 'utf8');

test('surface supports composed header slots, custom header and floating appearance', () => {
  const html = render(h(api.AuthoringSurface, { no: '02', title: '第 2 题', status: h(api.StatusDot, { tone: 'ok' }, '可添加'), actions: h('button', {}, '预览') }, '正文'));
  for (const text of ['data-slot="authoring-surface"', 'data-variant="default"', 'data-slot="authoring-header"', '02', '第 2 题', '可添加', '预览', '正文']) assert.ok(html.includes(text), text);
  assert.match(render(h(api.AuthoringSurface, { variant: 'floating', header: '外部题号卡' })), /data-variant="floating"[\s\S]*外部题号卡/);
  assert.doesNotMatch(render(h(api.AuthoringSurface, {}, '正文')), /data-slot="authoring-header"/);
});

test('section has a uniquely labelled heading; rows preserve label, content, trailing and note', () => {
  const section = () => h(api.AuthoringSection, { no: '01', title: '答案与解析', hint: '选填' }, h(api.AuthoringRow, { label: '解析', htmlFor: 'analysis', trailing: 'AI 建议', note: '外部说明' }, h('textarea', { id: 'analysis' })));
  const html = render(h('div', {}, section(), section()));
  const ids = [...html.matchAll(/<h3 id="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, 2);
  for (const id of ids) assert.ok(html.includes(`aria-labelledby="${id}"`));
  assert.match(html, /<label for="analysis"/);
  for (const slot of ['authoring-section', 'authoring-row', 'authoring-content', 'authoring-trailing']) assert.ok(html.includes(`data-slot="${slot}"`));
  for (const value of ['01', '答案与解析', '选填', '外部说明']) assert.ok(html.includes(value));
});

test('QuietField marks the child root, preserves input props and toolbar, and accepts an editor root', () => {
  for (const Control of [api.Input, api.Textarea]) {
    const html = render(h(api.QuietField, { toolbar: h('button', {}, '公式') }, h(Control, { id: 'field', className: 'host-control text-read-body', defaultValue: '原内容', 'aria-label': '题干' })));
    assert.match(html, /data-slot="quiet-field"/);
    assert.match(html, /host-control[^"<]*prism-quiet-field-control/);
    assert.match(html, /id="field"/);
    assert.match(html, /aria-label="题干"/);
    assert.match(html, /data-slot="quiet-field-toolbar"/);
    assert.match(html, /原内容/);
  }
  const editor = render(h(api.QuietField, {}, h('div', { contentEditable: true, className: 'formula-root', role: 'textbox', 'aria-label': '公式' })));
  assert.match(editor, /class="formula-root prism-quiet-field-control"/);
  assert.match(editor, /contentEditable="true"/i);
  assert.match(css, /\.prism-quiet-field:focus-within > \.prism-quiet-field-toolbar\s*\{ display: flex;/);
  assert.match(css, /\.prism-quiet-field-toolbar\s*\{ display: none;/);
});

test('ChoiceKey uses native non-submit buttons, exposes selected state and keeps disabled', () => {
  for (const selected of [false, true]) {
    const html = render(h(api.ChoiceKey, { selected, 'aria-label': '正确答案 B' }, 'B'));
    assert.match(html, /^<button/);
    assert.match(html, /type="button"/);
    assert.ok(html.includes(`aria-pressed="${selected}"`));
    assert.match(html, /data-slot="choice-key"/);
    assert.match(html, />B<\/button>/);
  }
  assert.match(render(h(api.ChoiceKey, { disabled: true }, 'A')), /disabled=""/);
});

test('StatusDot exposes all five tones with hidden decorative dot and external text', () => {
  for (const tone of ['ok', 'miss', 'ai', 'check', 'neutral']) {
    const html = render(h(api.StatusDot, { tone }, '外部状态'));
    assert.ok(html.includes(`data-tone="${tone}"`));
    assert.match(html, /<i aria-hidden="true"><\/i>外部状态/);
  }
});

test('AI button states retain text, busy semantics and a reachable separate stop button', () => {
  for (const [state, text] of [['idle', 'AI 建议'], ['loading', '生成中'], ['done', '换一个']]) {
    const html = render(h(api.AiSuggestButton, { state, onSuggest() {}, onStop() {} }));
    assert.ok(html.includes(`data-state="${state}"`));
    assert.ok(html.includes(`aria-busy="${state === 'loading'}"`));
    assert.ok(html.includes(text));
    assert.equal((html.match(/<button\b/g) ?? []).length, 1);
    assert.doesNotMatch(html, /disabled=""|tabindex="-1"/);
    if (state === 'loading') assert.match(html, /<button[^>]+type="button"[^>]*>停止<\/button>/);
  }
  assert.match(render(h(api.AiSuggestButton, { label: '按题干建议', onSuggest() {} })), /按题干建议/);
  assert.match(render(h(api.AiSuggestButton, { state: 'loading' })), /disabled=""/);
});

test('AI field decorates only the supplied state, keeps content editable and only skeletons empty loading', () => {
  for (const state of ['idle', 'loading', 'done']) {
    for (const empty of [false, true]) {
      const html = render(h(api.AiSuggestField, { state, empty }, h('textarea', { 'aria-label': '解析', defaultValue: empty ? '' : '保留原文' })));
      assert.ok(html.includes(`data-state="${state}"`));
      assert.ok(html.includes(`aria-busy="${state === 'loading'}"`));
      assert.equal(html.includes('data-slot="ai-placeholder"'), state === 'loading' && empty);
      assert.equal(html.includes('prism-ai-flow'), state === 'loading');
      assert.equal(html.includes('AI 建议 · 待确认'), state === 'done');
      assert.doesNotMatch(html, /disabled|readonly/);
      if (!empty) assert.match(html, /保留原文/);
      if (state === 'loading' && empty) assert.match(html, /data-slot="ai-placeholder" aria-hidden="true"><i><\/i><i><\/i>/);
    }
  }
});

test('CSS contains reduced-motion static fallbacks and component-width row reflow', () => {
  const reduced = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
  assert.match(reduced, /\.prism-ai-spinner\s*\{ animation: none;/);
  assert.match(reduced, /\.prism-ai-flow\s*\{ animation: none; background: var\(--brand-magenta-text\);/);
  assert.match(css, /@container authoring-surface \(width < 720px\)/);
  assert.match(css, /grid-template-areas: 'label trailing' 'content content'/);
  assert.match(css, /grid-template-columns: 96px minmax\(0, 1fr\) 132px/);
  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b|--[\w-]+\s*:/i);
});

test('demo catalog entry resolves once, registers its lazy demo and renders the requested single-choice fixture', async () => {
  assert.equal(components.filter(item => item.id === 'authoring-surface').length, 1);
  assert.equal(searchComponents('题目编辑表面')[0].href, '/next/components/authoring-surface');
  const renderer = await readFile('components/prism-next/demo-renderer.tsx', 'utf8');
  assert.match(renderer, /"authoring-surface":lazy\(\(\)=>import\("\.\/demos\/authoring-surface"\)/);
  const html = render(h(api.AuthoringSurfaceDemo));
  for (const theme of themeOptions) assert.ok(html.includes(theme.label));
  for (const text of ['01', '02', '03', '答案与解析', '教学定位', '题目档案', '核心知识点', '分值']) assert.ok(html.includes(text));
  const choices = [...html.matchAll(/<button[^>]*data-slot="choice-key"[^>]*>[A-D]<\/button>/g)].map(match => match[0]);
  assert.equal(choices.length, 4);
  assert.equal(choices.filter(button => button.includes('aria-pressed="true"')).length, 1);
  assert.match(choices[1], /aria-pressed="true"/);
  assert.match(html, /data-slot="ai-suggest-field" data-state="loading"/);
  assert.match(html, /data-slot="ai-suggest-field" data-state="done"/);
});

test('nested coss roots share the QuietField reset, including both decorative pseudo-elements', () => {
  const selector = '.prism-quiet-field[data-slot="quiet-field"] > .prism-quiet-field-control :is([data-slot="textarea-control"], [data-slot="input-control"]):not(';
  assert.ok(css.includes(selector));
  const reset = css.slice(css.indexOf(selector), css.indexOf('.prism-quiet-field > .prism-quiet-field-control {'));
  assert.match(reset, /&, &::before, &::after\s*\{/);
  for (const declaration of ['border: 0;', 'border-radius: 0;', 'background: transparent;', 'box-shadow: none;', 'outline: none;']) assert.ok(reset.includes(declaration), declaration);
  assert.match(reset, /> :is\(\[data-slot="input"\], \[data-slot="textarea"\]\) \{ padding-inline: 0; background: transparent;/);
  for (const Control of [api.Input, api.Textarea]) {
    const html = render(h(api.QuietField, {}, h('div', {}, h('div', {}, h(Control, { 'aria-label': '嵌套输入', defaultValue: '保留内容' })))));
    assert.match(html, /class="prism-quiet-field-control"><div><span[^>]*data-slot="(?:input|textarea)-control"/);
    assert.match(html, /保留内容/);
  }
  assert.match(render(h(api.AuthoringSurfaceDemo)), /data-demo="nested-quiet-field" class="prism-quiet-field-control"><div><span[^>]*data-slot="textarea-control"/);
});

test('first coss surface excludes subsequent sibling controls and controls in subsequent branches', () => {
  const preceding = '.prism-quiet-field-control :is([data-slot="textarea-control"], [data-slot="input-control"], :has([data-slot="textarea-control"], [data-slot="input-control"]))';
  assert.ok(css.includes(`${preceding} ~ *,`));
  assert.ok(css.includes(`${preceding} ~ * *`));
  const html = render(h(api.QuietField, { toolbar: h(api.Input, { 'aria-label': '槽内工具输入' }) }, h('div', {},
    h('div', {}, h(api.Textarea, { 'aria-label': '主输入' })),
    h('div', {}, h(api.Input, { 'aria-label': '编辑器工具输入' }), h('button', {}, '公式')),
  )));
  assert.equal((html.match(/data-slot="(?:input|textarea)-control"/g) ?? []).length, 3);
  assert.match(html, /公式<\/button><\/div><\/div><div data-slot="quiet-field-toolbar"/);
  assert.match(css, /\.prism-quiet-field:focus-within > \.prism-quiet-field-toolbar\s*\{ display: flex;/);
});

test('all descendant textareas disable resize and the outer field owns the focus border and halo', () => {
  assert.match(css, /\.prism-quiet-field textarea\s*\{ resize: none; \}/);
  assert.match(css, /\.prism-quiet-field \{[^}]*border: 1px solid transparent; border-bottom-color: var\(--border\)/);
  assert.match(css, /\.prism-quiet-field:focus-within \{ border-color: var\(--foreground\); border-radius: 8px; box-shadow: 0 0 0 3px/);
  const innerRules = css.slice(css.indexOf('/* Reset the supplied root'), css.indexOf('.prism-quiet-field-toolbar {'));
  assert.doesNotMatch(innerRules, /border: (?!0)|box-shadow: (?!none)|:focus/);
});
