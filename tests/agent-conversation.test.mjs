import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, symlink, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';

const root = fileURLToPath(new URL('../', import.meta.url));
const temp = await mkdtemp(join(tmpdir(), 'prism-conversation-test-'));
await symlink(join(root, 'node_modules'), join(temp, 'node_modules'), 'dir');
const file = join(temp, 'bundle.mjs');
await writeFile(file, (await build({ stdin: { contents: `export * from './components/prism-next/agent-prompt-bar'; export * from './components/prism-next/agent-prompt-sweep'; export * from './components/prism-next/agent-mark'; export * from './components/prism-next/agent-message'; export * from './components/prism-next/agent-voice';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false })).outputFiles[0].text);
const api = await import(pathToFileURL(file));
const h = React.createElement;
const base = { value: '', onValueChange() {}, onIntent() {}, sources: [], commands: [], models: [], dictation: { state: 'not-connected' }, voice: { state: 'not-connected' } };

test('SSR: Rounded/Pill retain visually hidden accessible label, controlled draft, disabled empty send and accessible voice controls', () => {
  for (const variant of ['Rounded', 'Pill']) {
    const html = render(h(api.AgentPromptBar, { ...base, variant }));
    assert.match(html, new RegExp(`data-variant="${variant}"`));
    assert.match(html, /<label(?=[^>]*class="[^"]*sr-only)(?=[^>]*for=")[^>]*>消息<\/label>/);
    for (const label of ["开始听写", "开始语音对话"]) {
      assert.match(html, new RegExp(`<button(?=[^>]*aria-label="${label}")(?=[^>]*aria-describedby=")[^>]*>`));
      assert.doesNotMatch(html, new RegExp(`<button(?=[^>]*aria-label="${label}")(?=[^>]* disabled="")[^>]*>`));
    }
    assert.doesNotMatch(html, /<p[^>]*>(听写|语音对话)服务未接入/);
    assert.match(html, /<button(?=[^>]*aria-label="发送消息")(?=[^>]* disabled="")[^>]*>/);
    assert.match(html, /听写服务未接入/);
    assert.match(html, /语音对话服务未接入/);
    assert.match(html, /aria-pressed="false"/);
  }
  assert.match(render(h(api.AgentPromptBar, { ...base, value: '数学草稿' })), /数学草稿/);
});
test('token parser supports Chinese source/command queries, boundaries and escaped menu dismissal inputs', () => {
  assert.deepEqual(api.parsePromptToken('比较 @任教'), { kind: 'source', query: '任教', start: 3 });
  assert.deepEqual(api.parsePromptToken('/组卷'), { kind: 'command', query: '组卷', start: 0 });
  for (const value of ['user@example.com', 'https://school.example/a', '完成 ', '@班级 ']) assert.equal(api.parsePromptToken(value), null);
});
test('all nine dictation facts and six conversation facts render verbatim without guessing state', () => {
  for (const [state, label] of Object.entries(api.dictationLabels)) {
    const html = render(h(api.AgentVoiceStatus, { dictation: { state, reason: state === 'error' ? '连接中断' : undefined }, voice: { state: 'idle' }, onIntent() {} }));
    assert.ok(html.includes(label), state);
    if (state === 'error') assert.match(html, /连接中断/);
    if (state === 'listening') { assert.doesNotMatch(html, /电平/); assert.doesNotMatch(html, /<meter/); }
  }
  for (const [state, label] of Object.entries(api.voiceModeLabels)) {
    const html = render(h(api.AgentVoiceStatus, { dictation: { state: 'idle' }, voice: { state }, onIntent() {} }));
    assert.ok(html.includes(label), state);
    assert.equal(html.includes('结束语音对话'), ['connecting', 'listening', 'answering'].includes(state));
  }
});
test('host transcripts and level are displayed, bounded, never inserted into the controlled draft', () => {
  const html = render(h(api.AgentPromptBar, { ...base, value: '保留草稿', dictation: { state: 'listening', interim: '中间结果', final: '最终结果', level: 2 } }));
  assert.match(html, />保留草稿<\/textarea>/);
  assert.match(html, /data-dictation-transcript="interim"[^>]*text-muted-foreground[^>]*>中间结果/);
  assert.doesNotMatch(html, /最终结果/);
  assert.match(html, /data-level-known="true"/);
  assert.match(html, /height:100%/);
  assert.doesNotMatch(html, /<meter|麦克风电平/);
});
test('active dictation uses accented equalizer, coss ring and listening placeholder in all active phases', () => {
  for (const state of Object.keys(api.dictationLabels)) {
    const html = render(h(api.AgentPromptBar, { ...base, dictation: { state } }));
    const active = ['requesting', 'listening', 'recognizing'].includes(state);
    assert.equal(html.includes('placeholder="正在听…"'), active);
    assert.equal(html.includes('bg-info/10 text-info-foreground'), active);
    assert.equal(html.includes('border-ring ring-ring/24 ring-[3px]'), active);
    assert.equal((html.match(/class="agent-dictation-bar /g) ?? []).length, active ? 3 : 0);
    if (active) assert.match(html, /aria-label="停止听写"[^>]*aria-pressed="true"/);
  }
});
test('elapsed uses finite host timestamps only; level bars clamp and invalid levels use activity animation', () => {
  for (const start of [undefined, NaN, Infinity]) assert.equal(api.dictationElapsed(start, 5000), undefined);
  assert.equal(api.dictationElapsed(1000, undefined), undefined);
  assert.equal(api.dictationElapsed(1000, 6000), '0:05');
  assert.equal(api.dictationElapsed(1000, 66000), '1:05');
  assert.equal(api.dictationElapsed(9000, 6000), '0:00');
  for (const [level, height] of [[-1, 20], [0.5, 60], [2, 100]]) {
    const html = render(h(api.AgentVoiceButtons, { ...base, dictation: { state: 'listening', level } }));
    assert.match(html, /data-level-known="true"/); assert.match(html, new RegExp(`height:${height}%`));
  }
  assert.match(render(h(api.AgentVoiceButtons, { ...base, dictation: { state: 'listening', level: NaN } })), /data-level-known="false"/);
});
test('host final replaces interim preview with normal editable draft without component insertion', () => {
  const html = render(h(api.AgentPromptBar, { ...base, value: '最终结果', dictation: { state: 'inserted', interim: '过期临时文字', final: '最终结果' } }));
  assert.match(html, />最终结果<\/textarea>/); assert.doesNotMatch(html, /过期临时文字|data-dictation-transcript|agent-dictation-placeholder/);
});
test('equalizer and shimmer stop under reduced motion, with medium bars even when host level exists', async () => {
  const css = await readFile(join(root, 'components/prism-next/agent-conversation.css'), 'utf8');
  assert.match(css, /prism-dictation-eq-bounce 900ms/);
  const reduced = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
  assert.match(reduced, /\.agent-dictation-bar \{ animation: none !important; transform: none !important; height: 60% !important/);
  assert.match(reduced, /\.agent-dictation-placeholder \{ animation: none; background: none; color: var\(--muted-foreground\)/);
});
test('voice intents remain requests; privacy blocks start and exposes confirm/cancel', () => {
  const intents = [];
  const controls = api.AgentVoiceButtons({ dictation: { state: 'idle' }, voice: { state: 'idle' }, onIntent: x => intents.push(x) });
  for (const control of controls.props.children) control.props.onClick();
  assert.deepEqual(intents, [{ type: 'dictation-start' }, { type: 'voice-mode-start' }]);
  const stopping = api.AgentVoiceButtons({ dictation: { state: 'recognizing' }, voice: { state: 'answering' }, onIntent: x => intents.push(x) });
  for (const control of stopping.props.children) assert.equal(control.props['aria-pressed'], true);
  const html = render(h(api.AgentPromptBar, { ...base, dictation: { state: 'idle' }, voice: { state: 'idle' }, privacy: { open: true, description: '录音用途说明' } }));
  assert.match(html, /录音用途说明/); assert.match(html, /确认使用语音/); assert.match(html, /取消/);
  assert.match(html, /<button(?=[^>]*aria-label="开始听写")(?=[^>]* disabled="")[^>]*>/);
});
test('AgentMark states, three patterns, host elapsed snapshots and unknown default', () => {
  for (const state of Object.keys(api.agentMarkLabels)) for (const variant of ['Orbit', 'Drive', 'Dots']) {
    const html = render(h(api.AgentMark, { state, variant, size: 'loading' }));
    assert.equal((html.match(/agent-mark-pixel/g) ?? []).length, 9);
    assert.ok(html.includes(api.agentMarkLabels[state]));
    assert.equal(html.includes('animation:prism-agent-pixel'), ['thinking', 'working'].includes(state));
    assert.doesNotMatch(html, /已用时/);
  }
  assert.match(render(h(api.AgentMark)), /状态未知/);
  assert.match(render(h(api.AgentMark, { state: "thinking" })), /data-variant="Drive"/);
  assert.match(render(h(api.AgentMark, { state: 'idle', startedAt: 1000, endedAt: 66000 })), /已用时 1 分 5 秒/);
});
test('user and agent messages preserve rich content slots and inverse tokens without a visible user label', () => {
  const user = render(h(api.AgentMessage, { speaker: 'user', attachments: h(api.AgentMessageAttachment, {}, '数学.pdf') }, h('math', {}, h('mi', {}, 'x')), h('pre', {}, h('code', {}, 'x = 1'))));
  assert.match(user, /aria-label="你说"/); assert.doesNotMatch(user, />你</);
  assert.match(user, /bg-foreground/); assert.match(user, /text-background/); assert.match(user, /<math/); assert.match(user, /数学.pdf/);
  const agent = render(h(api.AgentMessage, { speaker: 'agent', details: '详情一行' }, '回复'));
  assert.match(agent, /data-agent-mark/); assert.match(agent, /详情一行/); assert.doesNotMatch(agent, /bg-foreground/);
});
function media(matches = false) { const listeners = new Set(); return { matches, addEventListener(_type, fn) { listeners.add(fn) }, removeEventListener(_type, fn) { listeners.delete(fn) }, change(value) { this.matches = value; listeners.forEach(fn => fn()) }, listeners }; }
test('sweep: no autoplay, reduced motion prevents WebGL and dynamic reduction disposes a running sweep', async () => {
  const m = media(true); let created = 0, destroyed = 0, cancelled = 0, resolve;
  const ctrl = { setAlpha() {}, destroy() { destroyed++ } };
  const controller = api.createPromptSweep({}, m, { createShader() { created++; return ctrl }, playSweep() { return { cancel() { cancelled++ }, done: new Promise(r => { resolve = r }) } } });
  assert.equal(created, 0); controller.play(); assert.equal(created, 0);
  m.change(false); controller.play(); controller.play(); assert.equal(created, 1);
  m.change(true); assert.equal(destroyed, 1); assert.equal(cancelled, 1);
  resolve(); await Promise.resolve(); assert.equal(destroyed, 1);
  controller.destroy(); assert.equal(m.listeners.size, 0); controller.play(); assert.equal(created, 1);
});
test('sweep: null and throwing WebGL are silent; completion and unmount release resources', async () => {
  for (const createShader of [() => null, () => { throw Error('no WebGL') }]) {
    const c = api.createPromptSweep({}, media(), { createShader, playSweep() { assert.fail('must not play') } });
    assert.doesNotThrow(() => c.play()); c.destroy();
  }
  let destroyed = 0;
  const c = api.createPromptSweep({}, media(), { createShader() { return { setAlpha() {}, destroy() { destroyed++ } } }, playSweep() { return { cancel() {}, done: Promise.resolve() } } });
  c.play(); await Promise.resolve(); assert.equal(destroyed, 1); c.destroy(); assert.equal(destroyed, 1);
});
test('reduced motion freezes mark and label, inverse rich text and 88% narrow bubble rules exist', async () => {
  const css = await readFile(join(root, 'components/prism-next/agent-conversation.css'), 'utf8');
  assert.match(css, /prefers-reduced-motion: reduce/); assert.match(css, /animation: none !important/);
  assert.match(css, /max-width: 88%/); assert.match(css, /color: inherit; background-color: transparent/);
});

// Event-handler probes execute the actual component handlers with deterministic UI hooks.
// They do not claim DOM focus, browser keyboard delivery, or screen-reader validation.
const probeFile = join(temp, 'probe.mjs');
await writeFile(probeFile, (await build({ stdin: { contents: `export { AgentPromptBar } from './components/prism-next/agent-prompt-bar';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false, plugins: [{ name: 'prompt-hooks', setup(b) {
  b.onLoad({ filter: /agent-prompt-bar\.tsx$/ }, async args => ({ loader: 'tsx', contents: (await readFile(args.path, 'utf8')).replace('import { useEffect, useId, useRef, useState, type ReactNode } from "react"', `import type { ReactNode } from "react";
const useId = () => 'prompt-test';
const useEffect = () => {};
const useRef = () => ({ current: { focus() { (globalThis as any).__promptProbe.focused++ }, play() {} } });
const useState = (initial: any) => { const p = (globalThis as any).__promptProbe, i = p.cursor++; if (!(i in p.values)) p.values[i] = initial; return [p.values[i], (next: any) => { p.values[i] = typeof next === 'function' ? next(p.values[i]) : next }]; };`) }));
} }] })).outputFiles[0].text);
const { AgentPromptBar: Probe } = await import(pathToFileURL(probeFile));
const voiceProbeFile = join(temp, 'voice-probe.mjs');
await writeFile(voiceProbeFile, (await build({ stdin: { contents: `export * from './components/prism-next/agent-voice';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false, plugins: [{ name: 'voice-hooks', setup(b) {
  b.onLoad({ filter: /agent-voice\.tsx$/ }, async args => ({ loader: 'tsx', contents: (await readFile(args.path, 'utf8')).replace('import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from "react"', `import type { ReactNode, RefObject } from "react";
const useId = () => 'voice-test';
const useRef = (initial: any) => { const p = (globalThis as any).__voiceProbe, i = p.cursor++; return p.values[i] ??= { current: initial }; };
const useState = (initial: any) => { const p = (globalThis as any).__voiceProbe, i = p.cursor++; if (!(i in p.values)) p.values[i] = initial; return [p.values[i], (next: any) => { p.values[i] = next; p.updates.push(next); }]; };
const useEffect = (fn: any, deps: any[]) => { const p = (globalThis as any).__voiceProbe, i = p.cursor++; if (!p.effects[i] || deps.some((d, j) => !Object.is(d, p.effects[i].deps[j]))) { p.effects[i]?.cleanup?.(); p.effects[i] = { deps, cleanup: fn() }; } };
const setInterval = (fn: any) => { const p = (globalThis as any).__voiceProbe; p.timers.set(++p.timerId, fn); return p.timerId; };
const clearInterval = (id: number) => (globalThis as any).__voiceProbe.timers.delete(id);`) }));
} }] })).outputFiles[0].text);
const voiceProbe = await import(pathToFileURL(voiceProbeFile));
function voiceHarness(component) {
  const state = globalThis.__voiceProbe = { cursor: 0, values: [], effects: [], updates: [], timers: new Map(), timerId: 0 };
  return { state, render(props) { state.cursor = 0; return component(props) }, unmount() { state.effects.forEach(e => e?.cleanup?.()) } };
}
test('dictation live region announces entry and exit exactly once across phase, transcript and level changes', () => {
  const p = voiceHarness(voiceProbe.AgentDictationAnnouncement);
  for (const state of ['idle', 'requesting', 'requesting', 'listening', 'recognizing', 'recognizing', 'inserted', 'idle']) p.render({ state });
  assert.deepEqual(p.state.updates, ['听写已开始', '听写已结束']);
  p.render({ state: 'listening' }); p.render({ state: 'error' });
  assert.deepEqual(p.state.updates, ['听写已开始', '听写已结束', '听写已开始', '听写已结束']);
  p.unmount();
});
test('dictation indicator timer needs a host start, stops on exit/unmount, and never enters live output', () => {
  const p = voiceHarness(voiceProbe.AgentDictationIndicator), intents = [];
  const props = { dictation: { state: 'listening' }, onIntent: i => intents.push(i) };
  p.render(props); assert.equal(p.state.timers.size, 0);
  props.dictation.startedAt = Date.now() - 5000;
  p.render(props); const button = p.render(props);
  assert.equal(p.state.timers.size, 1);
  assert.match(render(button), /aria-hidden="true"[^>]*>0:05/);
  assert.doesNotMatch(render(button), /role="status"|aria-live/);
  button.props.onClick(); assert.deepEqual(intents, [{ type: 'dictation-stop' }]);
  assert.equal(props.dictation.state, 'listening');
  props.dictation.state = 'recognizing'; p.render(props); assert.equal(p.state.timers.size, 1);
  props.dictation.state = 'inserted'; assert.equal(p.render(props), null); assert.equal(p.state.timers.size, 0);
  props.dictation.state = 'listening'; p.render(props); p.unmount(); assert.equal(p.state.timers.size, 0);
});
function promptHarness(extra = {}) {
  globalThis.__promptProbe = { cursor: 0, values: [], focused: 0 };
  let value = extra.value ?? ''; const intents = [];
  const props = { ...base, sources: [{ id: 'a', label: '题库' }, { id: 'off', label: '不可选', disabled: true }, { id: 'b', label: '任教班级' }], commands: [{ id: 'paper', label: '/组卷' }], models: [{ id: 'm', label: '教学助手' }], ...extra,
    onValueChange(v) { value = v }, onIntent(i) { intents.push(i) } };
  function nodes() { globalThis.__promptProbe.cursor = 0; const found = []; const visit = node => { if (Array.isArray(node)) return node.forEach(visit); if (!React.isValidElement(node)) return; found.push(node); visit(node.props.children); }; visit(Probe({ ...props, value })); return found; }
  const input = () => nodes().find(n => n.props.role === 'combobox');
  const button = label => nodes().find(n => n.props['aria-label'] === label || n.props.render?.props['aria-label'] === label);
  const key = (key, native = {}, more = {}) => { let prevented = false; input().props.onKeyDown({ key, nativeEvent: native, shiftKey: false, preventDefault() { prevented = true }, ...more }); return prevented };
  const change = text => input().props.onChange({ target: { value: text } });
  return { nodes, input, button, key, change, intents, props, value: () => value };
}
test('keyboard handlers: arrows skip disabled options, Enter selects once, Esc suppresses reopening until edit', () => {
  const p = promptHarness({ value: '@' });
  assert.equal(p.key('ArrowDown'), true); p.key('Enter');
  assert.deepEqual(p.intents, [{ type: 'select-source', id: 'b' }]); assert.equal(p.value(), '@任教班级 ');
  p.change('@'); p.key('ArrowUp'); p.key('Enter'); assert.equal(p.intents.at(-1).id, 'b');
  p.change('/'); p.key('Escape'); assert.equal(p.input().props['aria-expanded'], false);
  p.change('/组'); p.key('Enter'); assert.equal(p.value(), '/组卷 '); assert.equal(p.intents.at(-1).type, 'run-command');
});
test('Escape capture stops active dictation once from any prompt child; respects IME and disabled', () => {
  for (const state of ['requesting', 'listening', 'recognizing', 'idle']) {
    const p = promptHarness({ dictation: { state } });
    let prevented = 0, stopped = 0;
    p.nodes()[0].props.onKeyDownCapture({ key: 'Escape', nativeEvent: {}, preventDefault() { prevented++ }, stopPropagation() { stopped++ } });
    const active = state !== 'idle';
    assert.deepEqual(p.intents, active ? [{ type: 'dictation-stop' }] : []);
    assert.equal(prevented, Number(active)); assert.equal(stopped, Number(active));
    assert.equal(p.props.dictation.state, state);
  }
  for (const [disabled, nativeEvent] of [[true, {}], [false, { isComposing: true }], [false, { keyCode: 229 }]]) {
    const p = promptHarness({ disabled, dictation: { state: 'listening' } });
    p.nodes()[0].props.onKeyDownCapture({ key: 'Escape', nativeEvent, preventDefault() { assert.fail() }, stopPropagation() { assert.fail() } });
    assert.equal(p.intents.length, 0);
  }
});
test('keyboard handlers: IME confirm cannot pick/send, empty matches cannot send, Shift+Enter remains newline', () => {
  const p = promptHarness({ value: '/' });
  assert.equal(p.key('Enter', { isComposing: true }), false); assert.equal(p.key('Enter', { keyCode: 229 }), false); assert.equal(p.intents.length, 0);
  p.change('/不存在'); p.key('Enter'); assert.equal(p.intents.length, 0);
  p.change('草稿'); assert.equal(p.key('Enter', {}, { shiftKey: true }), false); assert.equal(p.intents.length, 0);
  p.key('Enter'); assert.deepEqual(p.intents, [{ type: 'submit', text: '草稿', attachmentIds: [] }]); assert.equal(p.value(), '草稿');
});
test('attachment/source/model handlers emit typed intents; attachment-only submit works; blocked submit does not', () => {
  const p = promptHarness({ value: '@', attachments: [{ id: 'f', label: '材料.pdf' }] });
  const plus = p.nodes().find(n => n.props.onOpenChange && n.props.children?.[0]?.props?.render?.props?.['aria-label'] === '添加附件与来源');
  plus.props.onOpenChange(true);
  p.nodes().find(n => n.props.onClick && n.props.children === '题库').props.onClick(); assert.equal(p.value(), '@题库 ');
  p.nodes().find(n => n.props.onClick && Array.isArray(n.props.children) && n.props.children.includes('添加附件')).props.onClick();
  p.button('移除附件：材料.pdf').props.onClick();
  p.nodes().find(n => n.props.onValueChange && n.props.value === '').props.onValueChange('m');
  p.change(''); p.button('发送消息').props.onClick();
  assert.deepEqual(p.intents, [{ type: 'select-source', id: 'a' }, { type: 'attach' }, { type: 'remove-attachment', id: 'f' }, { type: 'select-model', id: 'm' }, { type: 'submit', text: '', attachmentIds: ['f'] }]);
  const blocked = promptHarness({ value: '草稿', sendDisabledReason: '服务未接入' }); blocked.key('Enter'); assert.equal(blocked.intents.length, 0);
});
test('privacy confirm/cancel and active voice stop handlers do not manufacture next states', () => {
  const intents = [], nodes = [];
  function Inspect() { const tree = api.AgentVoiceStatus({ dictation: { state: 'listening' }, voice: { state: 'answering' }, privacy: { open: true, description: '说明' }, onIntent: i => intents.push(i) });
    const walk = n => { if (Array.isArray(n)) return n.forEach(walk); if (!React.isValidElement(n)) return; nodes.push(n); walk(n.props.children) }; walk(tree); return tree;
  }
  render(h(Inspect)); nodes.filter(n => n.props.onClick).forEach(n => n.props.onClick());
  assert.deepEqual(intents, [{ type: 'voice-mode-stop' }, { type: 'privacy-confirm' }, { type: 'privacy-cancel' }]);
  const controls = api.AgentVoiceButtons({ dictation: { state: 'listening' }, voice: { state: 'answering' }, privacy: { open: true, description: '说明' }, onIntent: i => intents.push(i) });
  for (const button of controls.props.children) { assert.equal(button.props.disabled, false); button.props.onClick() }
  assert.deepEqual(intents.slice(-2), [{ type: 'dictation-stop' }, { type: 'voice-mode-stop' }]);
});

test('all three composition routes render from the built site without altering the semantic registry', async () => {
  const { default: worker } = await import(new URL('../dist/server/index.js', import.meta.url));
  for (const slug of ['prompt-bar', 'agent-mark', 'agent-message']) {
    const response = await worker.fetch(new Request(`http://localhost/next/components/agent-components/${slug}`, { headers: { accept: 'text/html' } }), { ASSETS: { fetch: async () => new Response('Not found', { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
    assert.equal(response.status, 200); const html = await response.text();
    assert.ok(html.includes(`data-agent-conversation-demo="${slug}"`));
    assert.match(html, /返回 Agent 组件总览/);
  }
});
test('three theme inverse token pairs exceed 4.5:1 numerically (not a browser contrast measurement)', async () => {
  const css = await readFile(join(root, 'app/(next)/next/theme.css'), 'utf8');
  const pairs = [...css.matchAll(/--background:(#[0-9A-Fa-f]{6});\s*--foreground:(#[0-9A-Fa-f]{6});/g)].slice(0, 3);
  assert.equal(pairs.length, 3);
  const luminance = hex => { const c = [1,3,5].map(i => parseInt(hex.slice(i, i+2), 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4); return c[0]*.2126+c[1]*.7152+c[2]*.0722 };
  const results = pairs.map((p, i) => { const a=luminance(p[1]), b=luminance(p[2]); return { theme: ['light','paper','dark'][i], text:p[1], background:p[2], contrast:(Math.max(a,b)+.05)/(Math.min(a,b)+.05) } });
  for (const result of results) assert.ok(result.contrast >= 4.5, JSON.stringify(result));
  await writeFile(join(temp, 'token-contrast.json'), JSON.stringify(results, null, 2));
});

test('prompt status hides unavailable facts but retains host errors, denied permissions and results', () => {
  for (const state of ['not-connected', 'unsupported', 'error', 'denied', 'recognizing', 'inserted']) {
    const html = render(h(api.AgentVoiceStatus, { hideUnavailable: true, dictation: { state, reason: '宿主原因' }, voice: { state: 'not-connected' }, onIntent() {} }));
    assert.equal(html.includes(api.dictationLabels[state]), !['not-connected', 'unsupported'].includes(state));
    assert.doesNotMatch(html, /语音对话服务未接入/);
  }
});
test('unavailable voice explanations never emit start intents or play the sweep', () => {
  const fail = () => assert.fail('unavailable control must only explain');
  for (const state of ['not-connected', 'unsupported']) {
    const controls = api.AgentVoiceButtons({ dictation: { state, reason: '宿主原因' }, voice: { state: 'not-connected', description: '宿主说明' }, onIntent: fail, onStart: fail });
    for (const control of controls.props.children) {
      assert.equal(control.props.onClick, undefined);
      assert.equal(control.props.disabled, false);
      const html = render(control);
      assert.match(html, /aria-describedby=/);
      assert.match(html, /sr-only/);
      assert.match(html, /宿主(原因|说明)/);
    }
  }
});
test('component fixture uses local rule label and documents Drive as the default', async () => {
  const demo = await readFile(join(root, 'components/prism-next/demos/agent-conversation-demo.tsx'), 'utf8');
  assert.match(demo, /label: "本机规则"/);
  assert.match(demo, /Drive 为默认动画/);
  assert.doesNotMatch(demo, /GPT-6 Astra|Orbit 为默认动画/);
});

test('dictation level never renders visible text; unknown is only the active microphone description', () => {
  for (const state of ['idle', 'requesting', 'listening', 'recognizing', 'inserted']) {
    for (const level of [undefined, NaN, Infinity, 0, 0.5, 1]) {
      const dictation = { state, level };
      const html = render(h(api.AgentPromptBar, { ...base, dictation }));
      const unknown = ['requesting', 'listening', 'recognizing'].includes(state) && !Number.isFinite(level);
      const description = /<button(?=[^>]*aria-label="停止听写")(?=[^>]*aria-description="麦克风电平未知")[^>]*>/;
      assert.equal(description.test(html), unknown);
      assert.doesNotMatch(html.replace(/aria-description="麦克风电平未知"/g, ''), /麦克风电平|<meter/);
      for (const promptStatus of [false, true]) {
        const status = render(h(api.AgentVoiceStatus, { ...base, dictation, promptStatus }));
        assert.doesNotMatch(status, /麦克风电平|<meter/);
      }
    }
  }
});
