import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import postcss from 'postcss';
import { transform } from 'lightningcss';
import { createTestRuntime } from './helpers/test-runtime.mjs';

const root = fileURLToPath(new URL('../', import.meta.url)), h = React.createElement;
const baseline = '0ff4e90dedad167d9e883fd71073e8cb2f7da82e';
const source = 'components/prism-next/agent-prompt-bar.tsx';
const read = path => readFileSync(root + path, 'utf8');
const before = path => execFileSync('git', ['show', `${baseline}:${path}`], { cwd: root, encoding: 'utf8' });
const runtime = await createTestRuntime('p123');
let active;
const hooks = {
  useId: () => 'p123-input',
  useRef(value) { const i = active.cursor++; return active.slots[i] ??= { current: value }; },
  useState(value) { const state = active, i = state.cursor++; if (!(i in state.slots)) state.slots[i] = value; return [state.slots[i], next => { state.slots[i] = typeof next === 'function' ? next(state.slots[i]) : next; }]; },
  useEffect(fn, deps) { const i = active.cursor++; if (!active.slots[i] || deps.some((d, n) => !Object.is(d, active.slots[i][n]))) { active.slots[i] = deps; active.effects.push(fn); } },
  useLayoutEffect(fn, deps) { hooks.useEffect(fn, deps); },
};
globalThis.__p123Hooks = hooks;
async function bundle(mode) {
  const file = new URL(`${mode}.mjs`, runtime);
  const result = await build({ stdin: { contents: `export * from './${source}'; ${mode === 'old' ? '' : "export * from './components/prism-next/agent-prompt-attachments'; export * from './components/prism-next/demos/agent-prompt-attachments-demo';"}`, loader: 'tsx', resolveDir: root }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false, plugins: mode === 'old' ? [{ name: 'baseline', setup(b) { b.onLoad({ filter: /agent-prompt-bar\.tsx$/ }, () => ({ contents: before(source), loader: 'tsx' })); } }] : mode === 'probe' ? [{ name: 'hooks', setup(b) { b.onLoad({ filter: /(?:agent-prompt-bar|agent-prompt-attachments-demo)\.tsx$/ }, ({ path }) => ({ loader: 'tsx', contents: readFileSync(path, 'utf8').replace(/import \{ useEffect, useLayoutEffect, useId, useRef, useState, type ReactNode \} from "react"/, 'import type { ReactNode } from "react"; const { useEffect, useLayoutEffect, useId, useRef, useState } = (globalThis as any).__p123Hooks;').replace(/import \{ useRef, useState \} from "react"/, 'const { useRef, useState } = (globalThis as any).__p123Hooks;') })); } }] : [] });
  writeFileSync(file, result.outputFiles[0].text); return import(file);
}
const old = await bundle('old'), api = await bundle('current'), probe = await bundle('probe');
const base = { value: '', onValueChange() {}, onIntent() {}, sources: [], commands: [], models: [], dictation: { state: 'idle' }, voice: { state: 'idle' } };
const themes = ['light', 'paper', 'dark', 'blueprint', 'blueprint-night'];
const cases = [
  {}, { value: '中文 x²\n第二行' }, { attachments: [{ id: 'a', label: '高一作答.pdf' }] },
  { attachments: [{ id: 'a', label: '中文材料一.pdf' }, { id: 'b', label: '板书.png' }], disabled: true },
  { value: '@', sources: [{ id: 'a', label: '题库' }] }, { value: '/', commands: [{ id: 'a', label: '/备课' }] },
  { dictation: { state: 'recognizing', interim: '正在识别的中文' } }, { voice: { state: 'answering' } },
  { sendDisabledReason: '服务未连接' }, { sendDisabledReason: '', showModelSelector: false },
  { density: 'compact', expandable: true, primaryAction: 'send' }, { primaryAction: 'stop' }, { primaryAction: 'stopping' },
  { statusHint: { message: '错误详情', tone: 'error', details: '网络不可用' } },
];
for (const theme of themes) test(`P123 ${theme}: ${cases.length * 2} old calls retain exact baseline SSR bytes`, () => {
  for (const variant of ['Rounded', 'Pill']) for (const props of cases) {
    const expected = render(h('div', { 'data-prism-theme': theme }, h(old.AgentPromptBar, { ...base, variant, ...props })));
    for (const extra of [{}, { richAttachments: undefined, onDropFiles: undefined, onOpenAttachment: undefined, onRemoveAttachment: undefined }]) {
      assert.equal(render(h('div', { 'data-prism-theme': theme }, h(api.AgentPromptBar, { ...base, variant, ...props, ...extra }))), expected);
    }
  }
});

test('P123 rich SSR: all media, metadata, accessible names, sibling remove actions and progress', () => {
  const html = render(h(api.AgentPromptBar, { ...base, richAttachments: api.promptAttachmentExamples, onOpenAttachment() {} }));
  assert.ok(html.indexOf('aria-label="附件条"') < html.indexOf('<textarea'));
  for (const item of api.promptAttachmentExamples) assert.ok(html.includes(`data-prompt-attachment="${item.id}"`));
  assert.match(html, /图片：抛物线课堂板书.png；就绪/);
  assert.match(html, /视频：抛物线课堂片段.mp4；就绪/);
  assert.match(html, /01:24/); assert.match(html, /Word · 6 页/); assert.match(html, /PDF · 45 页/);
  assert.match(html, /aria-label="取消上传：课堂补充材料.zip"/);
  assert.match(html, /aria-valuenow="42"/); assert.match(html, /aria-valuemin="0"/); assert.match(html, /aria-valuemax="100"/);
  assert.match(html, /超过示例大小限制 20 MB/); assert.match(html, /附件上传中，请等待完成或取消上传/);
  assert.equal((html.match(/data-prompt-attachment=/g) ?? []).length, 6);
  assert.doesNotMatch(html, /<button[^>]*>(?:(?!<\/button>)[\s\S])*<button/);
});

test('P123 no invented facts: absent state, preview or invalid progress stay unknown', () => {
  for (const progress of [undefined, NaN, Infinity, -1, 101]) {
    const html = render(h(api.AgentPromptBar, { ...base, richAttachments: [{ id: 'a', name: '数据.zip', status: 'uploading', progress }] }));
    assert.match(html, /进度未提供/); assert.doesNotMatch(html, /aria-valuenow=/);
  }
  for (const progress of [0, 100]) assert.match(render(h(api.AgentPromptBar, { ...base, richAttachments: [{ id: 'a', name: '数据.zip', status: 'uploading', progress }] })), new RegExp(`aria-valuenow="${progress}"`));
  const html = render(h(api.AgentPromptBar, { ...base, richAttachments: [{ id: 'a', name: 'e\u0301数学👨‍👩‍👧‍👦.pdf' }] }));
  assert.match(html, /文件：é数学👨‍👩‍👧‍👦.pdf；状态未提供/);
  assert.match(html, /role="group" tabindex="0"/);
  assert.doesNotMatch(html, /；就绪/);
  const selected = render(h(api.AgentPromptBar, { ...base, richAttachments: [{ id: 'a', name: '图.png', kind: 'image', status: 'ready', selected: true }] }));
  assert.match(selected, /data-selected="true" aria-current="true"/);
});

const nodes = (tree, out = []) => { if (Array.isArray(tree)) tree.forEach(n => nodes(n, out)); else if (React.isValidElement(tree)) { out.push(tree); nodes(tree.props.children, out); } return out; };
const state = () => ({ slots: [], cursor: 0, effects: [] });
function capture(component, props, store) { active = store; store.cursor = 0; store.effects = []; return nodes(component(props)); }
const text = n => typeof n === 'string' ? n : Array.isArray(n) ? n.map(text).join('') : n?.props ? text(n.props.children) : '';
const surface = ui => ui.find(n => n.props.className?.includes('agent-prompt-surface'));
const input = ui => ui.find(n => n.props.role === 'combobox');
const enter = () => ({ key: 'Enter', nativeEvent: {}, preventDefault() {} });
function transfer(files, types = ['Files']) { return { dataTransfer: { files, types }, clipboardData: { files }, prevented: false, preventDefault() { this.prevented = true; } }; }

test('P123 callbacks receive exact IDs, missing remove callback preserves intent and disabled is inert', () => {
  for (const disabled of [false, true]) {
    const calls = [], props = { ...base, richAttachments: api.promptAttachmentExamples, disabled, onIntent: i => calls.push(i), onOpenAttachment: id => calls.push(['open', id]) };
    const ui = capture(probe.AgentPromptBar, props, state());
    const strip = ui.find(n => n.type === probe.AgentPromptAttachmentStrip);
    const children = nodes(probe.AgentPromptAttachmentStrip(strip.props));
    children.find(n => n.props['aria-label']?.startsWith('视频：')).props.onClick();
    children.find(n => n.props['aria-label'] === '取消上传：课堂补充材料.zip').props.onClick();
    assert.deepEqual(calls, disabled ? [] : [['open', 'video'], { type: 'remove-attachment', id: 'upload' }]);
  }
});

test('P123 send gates apply to click and Enter in both layouts; rich + legacy IDs deduplicate only opt-in', () => {
  for (const density of [undefined, 'compact']) for (const status of ['uploading', 'error', 'ready']) {
    const calls = [], ui = capture(probe.AgentPromptBar, { ...base, density, attachments: [{ id: 'old', label: '旧附件' }], richAttachments: [{ id: 'new', name: '新附件', status }, { id: 'old', name: '旧附件详情', status: 'ready' }], onIntent: i => calls.push(i) }, state());
    const send = ui.find(n => n.props['aria-label'] === '发送消息');
    assert.equal(Boolean(send.props.disabled), status !== 'ready');
    send.props.onClick(); input(ui).props.onKeyDown(enter());
    assert.deepEqual(calls, status === 'ready' ? Array(2).fill({ type: 'submit', text: '', attachmentIds: ['old', 'new'] }) : []);
  }
});

test('P123 optional file drop/paste: nested drag, text preservation, disabled and empty files', () => {
  const calls = [], store = state(), props = { ...base, onDropFiles: files => calls.push(files) };
  let ui = capture(probe.AgentPromptBar, props, store), s = surface(ui);
  const file = new File(['x'], '板书.png', { type: 'image/png' }), e = transfer([file]);
  s.props.onDragEnter(e); s.props.onDragEnter(e); s.props.onDragLeave(e);
  ui = capture(probe.AgentPromptBar, props, store);
  assert.ok(ui.some(n => text(n) === '松开以添加附件'));
  s.props.onDragOver(e); assert.equal(e.dataTransfer.dropEffect, 'copy');
  s.props.onDrop(e); assert.equal(e.prevented, true); assert.deepEqual(calls, [[file]]);
  assert.ok(!capture(probe.AgentPromptBar, props, store).some(n => n.props.role === 'status' && text(n) === '松开以添加附件'));
  const plain = transfer([], ['text/plain']); s.props.onPaste(plain); s.props.onDragEnter(plain); s.props.onDrop(plain); assert.equal(plain.prevented, false);
  s.props.onPaste(transfer([file])); assert.deepEqual(calls, [[file], [file]]);
  for (const extra of [{ onDropFiles: undefined }, { disabled: true }]) {
    const p = surface(capture(probe.AgentPromptBar, { ...props, ...extra }, store)).props;
    for (const name of ['onDragEnter', 'onDragOver', 'onDragLeave', 'onDrop', 'onPaste']) assert.equal(p[name], undefined);
  }
});

test('P123 shipped demo integration: five themes → 390px → preview → cancel/remove → drop/paste → send', () => {
  // Actual demo state and fixture + actual PromptBar/strip handlers. No browser DOM/layout claims.
  const demoState = state(), promptState = state();
  let demo, ui;
  const refresh = () => { demo = capture(probe.AgentPromptAttachmentsDemo, {}, demoState); const prompt = demo.find(n => n.type === probe.AgentPromptBar); ui = capture(probe.AgentPromptBar, prompt.props, promptState); };
  const clickDemo = label => { const n = demo.find(n => n.props.onClick && text(n) === label); assert.ok(n, label); n.props.onClick(); refresh(); };
  const clickAttachment = label => { const strip = ui.find(n => n.type === probe.AgentPromptAttachmentStrip); const n = nodes(probe.AgentPromptAttachmentStrip(strip.props)).find(n => n.props['aria-label'] === label); assert.ok(n, label); n.props.onClick(); refresh(); };
  refresh();
  const group = demo.find(n => n.props['aria-label'] === '附件条主题');
  for (const button of nodes(group).filter(n => n.props.onClick)) { button.props.onClick(); refresh(); assert.equal(demo.find(n => n.props['data-agent-preview'] === true).props['data-prism-theme'], button.key); }
  clickDemo('390px 容器'); assert.equal(demo.find(n => n.props['data-agent-preview'] === true).props.style.width, 390);
  clickAttachment('视频：抛物线课堂片段.mp4；就绪'); assert.match(text(demo.find(n => n.props.role === 'status')), /预览请求：video/);
  input(ui).props.onKeyDown(enter()); refresh(); assert.match(text(demo.find(n => n.props.role === 'status')), /预览请求：video/);
  clickAttachment('取消上传：课堂补充材料.zip'); assert.match(text(demo.find(n => n.props.role === 'status')), /取消上传：upload/);
  assert.equal(ui.find(n => n.props['aria-label'] === '发送消息').props.disabled, true);
  clickAttachment('移除附件：超出限制的材料.zip');
  const file = new File(['pdf'], '重新添加.pdf', { type: 'application/pdf' });
  surface(ui).props.onDrop(transfer([file])); refresh();
  clickAttachment('移除附件：重新添加.pdf');
  surface(ui).props.onPaste(transfer([file])); refresh();
  assert.equal(ui.find(n => n.props['aria-label'] === '发送消息').props.disabled, true);
  clickAttachment('移除附件：重新添加.pdf');
  input(ui).props.onKeyDown(enter()); refresh();
  const output = text(demo.find(n => n.props.role === 'status'));
  assert.match(output, /"type":"submit"/); assert.match(output, /"attachmentIds":\["image","video","pdf","word"\]/);
  assert.match(output, /抛物线 y = x²/);
  clickDemo('重置附件样例'); assert.equal(ui.find(n => n.type === probe.AgentPromptAttachmentStrip).props.items.length, 6);
});

test('P123 layout and blueprint CSS retain core files/tokens and isolate nested preview roots/descendants', () => {
  for (const path of ['app/(next)/next/theme.css', 'app/(next)/next/blueprint.css', 'components/prism-next/agent-conversation.css', 'package.json', 'package-lock.json']) assert.equal(read(path), before(path));
  assert.equal(execFileSync('git', ['diff', baseline, '--', 'components/coss'], { cwd: root, encoding: 'utf8' }), '');
  const css = read('components/prism-next/blueprint/prompt-attachments.css');
  assert.doesNotThrow(() => transform({ code: Buffer.from(css), minify: true }));
  postcss.parse(css).walkRules(rule => {
    assert.match(rule.selector, /data-prism-theme="blueprint"/); assert.match(rule.selector, /data-prism-theme="blueprint-night"/);
    assert.match(rule.selector, /:not\(:where\(\[data-agent-preview\]/);
    assert.match(rule.selector, /\[data-agent-preview\].* \*\)\)/);
    rule.walkDecls(d => { assert.ok(!d.prop.startsWith('--')); assert.doesNotMatch(d.value, /#[a-f\d]{3,8}|rgba?\(|oklch\(/i); });
  });
  assert.match(css, /outline:1.5px solid var\(--ring\)/);
  assert.match(css, /font-family:var\(--font-mono\)/);
  const layout = read('components/prism-next/agent-prompt-attachments.css');
  assert.match(layout, /width: 64px/); assert.match(layout, /width: 52px/); assert.match(layout, /@container/);
  postcss.parse(layout).walkDecls(d => assert.doesNotMatch(d.prop, /color|font|shadow|radius/));
  assert.match(css, /border-width:1.5px; background:var\(--popover\)/);
});

test('P123-r1 actual demo strip: 18px paint, 32px transparent target and no adjacent-item overlap', () => {
  // Inspect the shipped demo and actual strip, then calculate CSS border-box geometry.
  // This catches the old 32px painted Button/8px gap without claiming browser layout acceptance.
  const demo = capture(probe.AgentPromptAttachmentsDemo, {}, state());
  const prompt = demo.find(n => n.type === probe.AgentPromptBar);
  const strip = capture(probe.AgentPromptBar, prompt.props, state()).find(n => n.type === probe.AgentPromptAttachmentStrip);
  const tree = nodes(probe.AgentPromptAttachmentStrip(strip.props));
  const addon = tree.find(n => n.props.align === 'block-start');
  assert.match(addon.props.className, /agent-prompt-attachment-container/);
  const list = tree.find(n => n.type === 'ul');
  assert.doesNotMatch(list.props.className, /\bgap-|\bp-\d/);
  const removes = tree.filter(n => n.props.className?.includes('bp-prompt-attachment-remove'));
  assert.equal(removes.length, 6);
  for (const button of removes) {
    assert.equal(button.props.size, null, 'no responsive coss icon size');
    assert.match(button.props.className, /border-\[1\.5px\]/);
    assert.doesNotMatch(button.props.className, /(?:size|min-h|min-w)-8/);
    assert.match(button.props.children.props.className, /size-\[11px\]/);
    const html = render(button);
    assert.doesNotMatch(html, /(?:sm:)?size-[78](?:\s|\")/);
    assert.match(html, /aria-label="(?:移除附件|取消上传)：/);
  }
  const css = postcss.parse(read('components/prism-next/agent-prompt-attachments.css'));
  const declarations = (selector, narrow = false) => {
    const result = {};
    css.walkRules(rule => {
      if (rule.selector.split(',').map(s => s.trim()).includes(selector) &&
          (rule.parent.type !== 'atrule' || narrow)) {
        if (rule.parent.type === 'atrule') assert.equal(rule.parent.params, '(max-width: 480px)');
        rule.walkDecls(d => { result[d.prop] = d.value; });
      }
    });
    return result;
  };
  assert.equal(declarations('.agent-prompt-attachment-container')['container-type'], 'inline-size');
  const selector = '.agent-prompt-attachments .bp-prompt-attachment-remove';
  const visible = declarations(selector), hit = declarations(`${selector}::after`);
  assert.deepEqual(visible, { top: '-8px', right: '-8px', width: '18px', height: '18px' });
  for (const dimension of ['width', 'height', 'min-width', 'min-height']) assert.equal(hit[dimension], '32px');
  assert.equal(hit.content, '""'); assert.equal(hit.position, 'absolute');
  assert.equal(hit.top, '50%'); assert.equal(hit.transform, 'translateY(-50%)');
  assert.equal(hit.right, '-1.5px'); assert.equal(hit.left, 'auto'); assert.equal(hit.bottom, 'auto');
  assert.ok(!Object.keys(hit).some(p => /background|border|shadow/.test(p)), 'extension paints nothing');
  for (const narrow of [false, true]) {
    const row = declarations('.agent-prompt-attachments', narrow);
    assert.equal(row.gap, narrow ? '10px' : '14px');
    assert.equal(row.padding, '16px 12px');
    for (const kind of ['media', 'file']) {
      const width = parseFloat(declarations(`.agent-prompt-attachment-${kind}-item`, narrow).width);
      const height = parseFloat(declarations(`.agent-prompt-attachment-${kind}`, narrow).height);
      const border = 1.5, size = parseFloat(visible.width);
      const right = width - parseFloat(visible.right);
      const top = parseFloat(visible.top);
      const hitRight = right - border - parseFloat(hit.right);
      const hitLeft = hitRight - parseFloat(hit.width);
      const hitTop = top + size / 2 - parseFloat(hit.height) / 2;
      const hitBottom = hitTop + parseFloat(hit.height);
      assert.equal(hitRight, width + 8);
      assert.equal(width + parseFloat(row.gap) - hitRight, narrow ? 2 : 6);
      assert.ok(hitLeft >= 0 && hitTop + 16 >= 0 && hitBottom <= height);
      assert.ok(!(width / 2 >= hitLeft && height / 2 <= hitBottom), 'preview center stays free');
      assert.ok(right + 2.5 <= width + 12, 'focus outline fits trailing padding');
      assert.ok(top - 2.5 + 16 >= 0, 'focus outline fits top padding');
    }
  }
});
