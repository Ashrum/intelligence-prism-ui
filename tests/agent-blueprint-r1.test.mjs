import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import postcss from 'postcss';
import { transform } from 'lightningcss';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { createTestRuntime } from './helpers/test-runtime.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const runtime = await createTestRuntime('agent-blueprint-r1');
const exports = `
export { AgentPromptBar } from './components/prism-next/agent-prompt-bar';
export { AgentQuestionCard } from './components/prism-next/agent-components';
export { AgentMessage, AgentMessageAttachment } from './components/prism-next/agent-message';
export { AgentExecutionConfirmation } from './components/prism-next/agent-semantic-components';
export { MenuPopup } from './components/coss/menu';
export { PopoverPopup } from './components/coss/popover';
export { SelectPopup } from './components/coss/select';
export { DialogPopup } from './components/coss/dialog';
export { TooltipPopup } from './components/coss/tooltip';`;
async function bundle(name, plugins = []) {
  const result = await build({ stdin: { contents: exports, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false, plugins });
  const file = new URL(`${name}.mjs`, runtime);
  writeFileSync(file, result.outputFiles[0].text);
  return import(file);
}
const api = await bundle('actual');
const h = React.createElement;
const base = { value: '', onValueChange() {}, onIntent() {}, sources: [], commands: [], models: [], dictation: { state: 'not-connected' }, voice: { state: 'not-connected' } };

// Execute the actual component and callbacks with deterministic hook scheduling.
// This tests state transitions and container plumbing, not DOM focus or portals.
const probe = await bundle('hooks', [{ name: 'prompt-hooks', setup(b) {
  b.onLoad({ filter: /agent-prompt-bar\.tsx$/ }, args => ({ loader: 'tsx', contents: readFileSync(args.path, 'utf8').replace(
    'import { useEffect, useId, useRef, useState, type ReactNode } from "react"',
    `import type { ReactNode } from "react";
const useId = () => 'p73-prompt';
const useRef = (initial: any) => { const p = (globalThis as any).__p73Hooks, i = p.cursor++; return p.values[i] ??= { current: initial }; };
const useState = (initial: any) => { const p = (globalThis as any).__p73Hooks, i = p.cursor++; if (!(i in p.values)) p.values[i] = initial; return [p.values[i], (next: any) => { const v = typeof next === 'function' ? next(p.values[i]) : next; if (!Object.is(v, p.values[i])) { p.values[i] = v; p.dirty = true; } }]; };
const useEffect = (effect: any, deps: any[]) => { const p = (globalThis as any).__p73Hooks, i = p.cursor++; if (!p.effects[i] || deps.some((d, j) => !Object.is(d, p.effects[i].deps[j]))) { p.pending.push(() => { p.effects[i]?.cleanup?.(); p.effects[i] = { deps, cleanup: effect() }; }); } };`
  ) }));
} }]);

test('CI-01: omitted/true retain the old model entry, including a disabled empty menu', () => {
  for (const variant of ['Rounded', 'Pill']) for (const models of [[], [{ id: 'm', label: '教学助手' }]]) {
    const props = { ...base, variant, models, modelId: 'm' };
    const normalize = html => html.replace(/_R_[^"\s<>]*/g, 'ID');
    const legacy = render(h(api.AgentPromptBar, props));
    assert.equal(normalize(legacy), normalize(render(h(api.AgentPromptBar, { ...props, showModelSelector: true }))));
    assert.match(legacy, /<button[^>]*aria-label="选择模型：/);
    const trigger = legacy.match(/<button[^>]*aria-label="选择模型：[^"]*"[^>]*>/)[0];
    assert.equal(trigger.includes('disabled=""'), models.length === 0);
  }
});

test('CI-01: false removes the complete model entry with empty or populated models in both variants', () => {
  for (const variant of ['Rounded', 'Pill']) for (const models of [[], [{ id: 'm', label: '不应泄漏的模型名称' }]]) {
    const html = render(h(api.AgentPromptBar, { ...base, variant, models, modelId: 'm', showModelSelector: false, value: '保留草稿' }));
    assert.equal(/选择模型|不应泄漏的模型名称/.test(html), false, 'hidden models must not appear in SSR');
    assert.match(html, /添加附件与来源/);
    assert.match(html, /发送消息/);
    assert.match(html, />保留草稿<\/textarea>/);
  }
});

function prompt(extra = {}) {
  const state = { cursor: 0, values: [], effects: [], pending: [], dirty: false }, intents = [];
  const props = { ...base, models: [{ id: 'm', label: '教学助手' }], sources: [{ id: 's', label: '材料' }], ...extra, onIntent: i => intents.push(i), onValueChange: value => { props.value = value; } };
  function nodes() {
    globalThis.__p73Hooks = state;
    let tree, retries = 0;
    do {
      assert.ok(++retries < 10, 'render must converge');
      state.cursor = 0; state.dirty = false; state.pending = [];
      tree = probe.AgentPromptBar(props);
      state.pending.forEach(effect => effect());
    } while (state.dirty);
    const result = [];
    const visit = node => { if (Array.isArray(node)) return node.forEach(visit); if (!React.isValidElement(node)) return; result.push(node); visit(node.props.children); };
    visit(tree); return result;
  }
  const menu = () => nodes().find(n => n.props.onOpenChange && n.props.children?.[0]?.props.render?.props['aria-label']?.startsWith('选择模型：'));
  return { props, nodes, menu, intents };
}

test('CI-01: closing availability while the model menu is open restores source suggestions and does not reopen later', () => {
  const p = prompt({ value: '@' });
  p.menu().props.onOpenChange(true);
  assert.equal(p.menu().props.open, true);
  p.props.showModelSelector = false;
  assert.equal(p.menu(), undefined);
  p.props.showModelSelector = true;
  assert.equal(p.menu().props.open, false, 'reopening availability must not revive an old popup');
  p.menu().props.onOpenChange(true);
  p.props.showModelSelector = false;
  assert.equal(p.menu(), undefined);
  // Editing after dismissal must still open the source list; hiding an open menu cannot block it.
  p.nodes().find(n => n.props.role === 'combobox').props.onChange({ target: { value: '@材' } });
  assert.equal(p.nodes().find(n => n.props.role === 'combobox').props['aria-expanded'], true);
  p.props.showModelSelector = true;
  assert.equal(p.menu().props.open, false);
  assert.deepEqual(p.intents, []);
});

test('CI-07: clarification has a neutral prompt and retains controlled choices, description and supplemental content', () => {
  const changes = [];
  const html = render(h(api.AgentQuestionCard, { question: '需要哪些材料？', description: '选择仅暂存。', options: [{ value: 'a', label: '题目' }, { value: 'b', label: '题目与解答' }], value: 'a', onValueChange: v => changes.push(v) }, h('p', null, '可以补充要求。')));
  assert.match(html, /补充一个信息/);
  assert.doesNotMatch(html, /需要你确认|批准|授权/);
  for (const text of ['需要哪些材料？', '选择仅暂存。', '题目与解答', '可以补充要求。']) assert.ok(html.includes(text));
  assert.match(html, /role="radiogroup"/);
  assert.match(html, /role="radio"[^>]*aria-checked="true"/);
  assert.deepEqual(changes, []);
});

test('CI-08: message attachment exposes a stable styling hook without removing the legacy radius class', () => {
  const html = render(h(api.AgentMessage, { speaker: 'user', attachments: h(api.AgentMessageAttachment, null, '长中文材料.pdf') }, '原消息'));
  assert.match(html, /data-agent-message="user"[^>]*rounded-xl/);
  assert.match(html, /data-slot="agent-message-attachment"[^>]*rounded-md/);
  assert.match(html, /长中文材料.pdf/);
});

// Parse production selectors, then evaluate their supported subset on synthetic
// theme trees. This is isolation evidence, not browser cascade/layout evidence.
function parseSelector(selector) {
  let ast;
  transform({ code: Buffer.from(`${selector}{color:red}`), visitor: { Selector(s) { ast = s; } } });
  assert.ok(ast); return ast;
}
function matches(selector, node) {
  const split = selector.findLastIndex(s => s.type === 'combinator');
  if (split >= 0) {
    assert.equal(selector[split].value, 'descendant');
    if (!matches(selector.slice(split + 1), node)) return false;
    for (let p = node.parent; p; p = p.parent) if (matches(selector.slice(0, split), p)) return true;
    return false;
  }
  return selector.every(s => {
    if (s.type === 'universal') return true;
    if (s.type === 'type') return node.tag === s.name;
    if (s.type === 'class') return node.classes?.includes(s.name) ?? false;
    if (s.type === 'attribute') {
      if (!s.operation) return Object.hasOwn(node.attrs, s.name);
      assert.equal(s.operation.operator, 'equal'); return node.attrs[s.name] === s.operation.value;
    }
    if (s.type === 'pseudo-class') {
      if (s.kind === 'focus-visible') return node.focused ?? false;
      assert.ok(['is', 'where', 'not'].includes(s.kind), s.kind);
      const any = s.selectors.some(child => matches(child, node)); return s.kind === 'not' ? !any : any;
    }
    assert.fail(`unsupported selector: ${JSON.stringify(s)}`);
  });
}
const css = postcss.parse(read('app/(next)/next/blueprint.css'));
const rules = css.nodes.filter(n => n.type === 'rule' && /data-agent-(?:message|prompt-bar|surface)|agent-message-attachment/.test(n.selector)).map(rule => ({ rule, selectors: rule.selectors.map(parseSelector) }));
function style(node) {
  const result = {};
  for (const { rule, selectors } of rules) if (selectors.some(selector => matches(selector, node))) for (const d of rule.nodes) if (d.type === 'decl') result[d.prop] = d.value;
  return result;
}
const node = (attrs = {}, parent, extra = {}) => ({ attrs, parent, ...extra });
const themes = ['light', 'paper', 'dark', 'blueprint', 'blueprint-night'];
const boundary = (outer, inner) => inner ? node({ 'data-prism-theme': inner, 'data-agent-preview': '' }, node({ 'data-prism-theme': outer })) : node({ 'data-prism-theme': outer });

test('CI-08: square bubbles/attachments apply only to both blueprints, excluding core preview roots and descendants', () => {
  for (const outer of themes) for (const inner of [undefined, ...themes]) {
    const root = boundary(outer, inner), active = ['blueprint', 'blueprint-night'].includes(inner ?? outer);
    for (const attrs of [{ 'data-agent-message': 'user' }, { 'data-slot': 'agent-message-attachment' }]) {
      const expected = active ? '0' : undefined;
      assert.equal(style(node(attrs, root))['border-radius'], expected, `${outer}/${inner}`);
      // The preview root itself must also be excluded if it is a styled target.
      if (inner && !active) assert.equal(style({ ...root, attrs: { ...root.attrs, ...attrs } })['border-radius'], undefined);
    }
    assert.equal(style(node({ 'data-agent-message': 'agent' }, root))['border-radius'], undefined);
  }
});

test('CI-09: actual send and confirmation buttons keep a single blue 2px outline on adjacent paper', () => {
  const send = render(h(api.AgentPromptBar, { ...base, value: '草稿' })).match(/<button[^>]*aria-label="发送消息"[^>]*>/)[0];
  const confirmation = render(h(api.AgentExecutionConfirmation, { title: '范围', target: '材料', version: 'v1', effects: ['保留原文'], confirmation: { state: 'ready', confirm: { label: '提交', onAction() {} } } }));
  assert.match(send, /bg-primary/); assert.match(confirmation, /bg-primary/);
  assert.match(send, /focus-visible:ring-2/); // The pinned coss ring needs a Blueprint-only reset.
  for (const marker of ['data-agent-prompt-bar', 'data-agent-surface']) {
    const button = node({ 'data-slot': 'button' }, node({ [marker]: '' }, boundary('blueprint')), { tag: 'button', focused: true });
    assert.deepEqual(style(button), { outline: '2px solid var(--ring)', 'outline-offset': '2px', 'box-shadow': 'none' });
    assert.deepEqual(style({ ...button, focused: false }), {});
  }
});

test('CI-09: a link surrounded by the actual user-message ink uses a white single outline, not a white outline on a paper button', () => {
  const bubble = node({ 'data-agent-message': 'user' }, boundary('blueprint'));
  const link = node({}, node({}, bubble, { classes: ['agent-message-content'] }), { tag: 'a', focused: true });
  assert.deepEqual(style(link), { outline: '2px solid var(--primary-foreground)', 'outline-offset': '2px', 'box-shadow': 'none' });
  assert.deepEqual(style({ ...link, focused: false }), {});
  assert.deepEqual(style(node({}, node({ 'data-agent-message': 'agent' }, boundary('blueprint')), { tag: 'a', focused: true })), {});
});

test('CI-09: core themes and night retain their focus behavior, including preview roots and descendants', () => {
  for (const outer of themes) for (const inner of [undefined, ...themes]) {
    const root = boundary(outer, inner);
    const active = (inner ?? outer) === 'blueprint';
    const button = node({ 'data-slot': 'button' }, node({ 'data-agent-surface': '' }, root), { tag: 'button', focused: true });
    assert.equal(style(button).outline, active ? '2px solid var(--ring)' : undefined, `${outer}/${inner}`);
    if (inner && inner !== 'blueprint') {
      const previewButton = { ...root, parent: node({ 'data-agent-surface': '' }, root.parent), tag: 'button', focused: true };
      assert.deepEqual(style(previewButton), {});
    }
  }
});

test('CI-11: existing Menu/Popover/Select/Dialog/Tooltip forward the exact host container and portal attributes', () => {
  for (const name of ['MenuPopup', 'PopoverPopup', 'SelectPopup', 'DialogPopup', 'TooltipPopup']) {
    const container = { current: { fixture: 'scoped-theme-root' } };
    const tree = api[name]({ portalProps: { container, 'data-prism-theme': 'blueprint', 'data-agent-preview': '' }, children: '内容' });
    assert.equal(tree.props.container, container, name);
    assert.equal(tree.props['data-prism-theme'], 'blueprint', name);
    assert.equal(tree.props['data-agent-preview'], '', name);
    assert.equal(api[name]({ children: '内容' }).props.container, undefined, `${name} keeps its default`);
  }
});

test('CI-11: PromptBar menus, suggestions and voice explanations share its root outside the clipped input surface', () => {
  const p = prompt({ value: '@' }), nodes = p.nodes(), root = nodes[0].props.ref;
  const popups = nodes.filter(n => n.props.portalProps);
  assert.equal(popups.length, 3);
  for (const popup of popups) assert.equal(popup.props.portalProps.container, root);
  assert.equal(nodes.find(n => n.props.portalContainer).props.portalContainer, root);
  assert.notEqual(nodes.find(n => n.props.className?.includes('agent-prompt-surface')).props.ref, root);
});
