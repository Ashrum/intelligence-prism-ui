import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { createTestRuntime } from './helpers/test-runtime.mjs';

// Handler/state probe with injected measurements. This is not browser, IME,
// focus, CSS layout or native selection verification.
let slots, cursor, effects;
const hooks = {
  useId: () => 'p92-input',
  useRef(value) { const i = cursor++; return slots[i] ??= { current: value }; },
  useState(value) { const i = cursor++; if (!(i in slots)) slots[i] = value; return [slots[i], next => { slots[i] = typeof next === 'function' ? next(slots[i]) : next; }]; },
  useEffect(fn, deps) { const i = cursor++; if (!slots[i] || deps.some((d, n) => !Object.is(d, slots[i][n]))) { slots[i] = deps; effects.push(fn); } },
  useLayoutEffect(fn, deps) { return hooks.useEffect(fn, deps); },
};
globalThis.__p92Hooks = hooks;
const runtime = await createTestRuntime('p92-events');
const root = fileURLToPath(new URL('../', import.meta.url));
const result = await build({ stdin: { contents: "export * from './components/prism-next/agent-prompt-bar';", resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false, plugins: [{ name: 'p92-hook-probe', setup(b) { b.onLoad({ filter: /agent-prompt-bar\.tsx$/ }, async ({path}) => ({ loader: 'tsx', contents: (await readFile(path, 'utf8')).replace(/import \{ useEffect, useLayoutEffect, useId, useRef, useState, type ReactNode \} from "react"/, 'import type { ReactNode } from "react"; const { useEffect, useLayoutEffect, useId, useRef, useState } = (globalThis as any).__p92Hooks;') })); } }] });
const file = new URL('probe.mjs', runtime);
await writeFile(file, result.outputFiles[0].text);
const { AgentPromptBar } = await import(file);
const base = { value: '第一段中文与 f(x) = x²\n第二段保留草稿', onValueChange() {}, onIntent() {}, sources: [], commands: [], models: [], dictation: { state: 'idle' }, voice: { state: 'idle' } };
const reset = () => { slots = []; cursor = 0; effects = []; };
function capture(extra = {}) {
  cursor = 0; effects = [];
  const nodes = [];
  function visit(node) { if (Array.isArray(node)) node.forEach(visit); else if (React.isValidElement(node)) { nodes.push(node); visit(node.props.children); } }
  visit(AgentPromptBar({ ...base, ...extra }));
  return { nodes, textarea: nodes.find(n => n.props.role === 'combobox'), flush: () => effects.forEach(fn => fn()) };
}
const label = n => n.props['aria-label'];
const text = n => typeof n === 'string' ? n : Array.isArray(n) ? n.map(text).join('') : n?.props ? text(n.props.children) : '';
const key = (name, nativeEvent = {}, shiftKey = false) => ({ key: name, nativeEvent, shiftKey, prevented: false, preventDefault() { this.prevented = true; } });

test('P92 Enter and button share send gate; Shift+Enter and composition never submit', () => {
  reset(); const intents = []; const props = { density: 'compact', onIntent: i => intents.push(i) };
  const ui = capture(props); ui.flush();
  for (const e of [key('Enter', {isComposing:true}), key('Enter', {keyCode:229}), key('Enter', {}, true)]) { ui.textarea.props.onKeyDown(e); assert.equal(e.prevented, false); }
  assert.deepEqual(intents, []);
  ui.textarea.props.onKeyDown(key('Enter'));
  ui.nodes.find(n => label(n) === '发送消息').props.onClick();
  assert.equal(intents.length, 2);
  for (const intent of intents) assert.deepEqual(intent, {type:'submit', text:base.value, attachmentIds:[]});
  for (const extra of [{sendDisabledReason:'下一条草稿'}, {disabled:true}, {primaryAction:'stop'}, {primaryAction:'stopping'}]) {
    capture({...props,...extra}).textarea.props.onKeyDown(key('Enter'));
  }
  assert.equal(intents.length, 2);
});
test('P92 stop emits once before host render, stopping is inert, host transitions rearm it', () => {
  reset(); const intents = []; const props = {primaryAction:'stop',onIntent:i=>intents.push(i)};
  let ui = capture(props); ui.flush();
  const stop = ui.nodes.find(n => label(n) === '停止当前回答');
  stop.props.onClick(); stop.props.onClick();
  capture(props).nodes.find(n => label(n) === '停止当前回答').props.onClick();
  assert.deepEqual(intents, [{type:'stop'}]);
  ui = capture({...props,primaryAction:'stopping'}); ui.flush();
  const waiting = ui.nodes.find(n => label(n) === '正在请求停止');
  assert.equal(waiting.props.disabled, true); waiting.props.onClick();
  ui.textarea.props.onKeyDown(key('Enter'));
  assert.equal(intents.length, 1);
  capture({...props,primaryAction:'send'}).flush();
  ui = capture(props); ui.flush(); ui.nodes.find(n => label(n) === '停止当前回答').props.onClick();
  assert.equal(intents.length, 2);
  capture({...props,disabled:true}).nodes.find(n => label(n) === '停止当前回答').props.onClick();
  assert.equal(intents.length, 2);
});
test('P92 expand threshold, collapse and Escape retain draft, selection direction and textarea ref', () => {
  reset();
  const beforeWindow = globalThis.window;
  globalThis.window = { getComputedStyle: () => ({maxHeight:'208px'}), addEventListener(){}, removeEventListener(){} };
  try {
    let focusCount = 0; const selections = []; const changes = []; const intents = [];
    const input = {scrollHeight:207,selectionStart:2,selectionEnd:15,selectionDirection:'backward',scrollTop:84,focus(){focusCount++},setSelectionRange(...v){selections.push(v)}};
    const props = {expandable:true,density:'compact',onValueChange:v=>changes.push(v),onIntent:i=>intents.push(i)};
    let ui = capture(props); const ref = ui.textarea.props.ref; ref.current = input; ui.flush();
    assert.ok(!capture(props).nodes.find(n => text(n) === '展开编辑' && n.props.onClick));
    input.scrollHeight=900;
    ui = capture({...props,value:base.value+'\n第三段'}); ui.flush();
    const longProps = {...props,value:base.value+'\n第三段'};
    ui = capture(longProps);
    ui.nodes.find(n => text(n) === '展开编辑' && n.props.onClick).props.onClick();
    ui = capture(longProps); ui.flush();
    assert.equal(ui.textarea.props.ref, ref); assert.equal(ui.textarea.props.value, longProps.value);
    assert.match(ui.textarea.props.className, /min\(24rem,50dvh\)/);
    assert.deepEqual(selections.at(-1), [2,15,'backward']);
    ui.nodes.find(n => text(n) === '收起' && n.props.onClick).props.onClick();
    ui = capture(longProps); ui.flush();
    assert.match(ui.textarea.props.className, /max-h-52/); assert.equal(input.scrollTop,84);
    ui.nodes.find(n => text(n) === '展开编辑' && n.props.onClick).props.onClick();
    ui = capture(longProps); ui.flush(); ui.textarea.props.onKeyDown(key('Escape'));
    ui = capture(longProps); ui.flush();
    assert.equal(ui.nodes[0].props['data-expanded'],false);
    assert.equal(ui.textarea.props.value,longProps.value);
    assert.equal(focusCount,4); assert.deepEqual(changes,[]); assert.deepEqual(intents,[]);
  } finally { globalThis.window = beforeWindow; }
});
test('P92 candidate Escape takes priority over collapsing editor and never submits', () => {
  reset(); const intents=[]; const props={value:'@',expandable:true,onIntent:i=>intents.push(i)};
  const ui=capture(props); ui.textarea.props.onKeyDown(key('Escape'));
  assert.equal(capture(props).textarea.props['aria-expanded'],false);
  assert.deepEqual(intents,[]);
});
