import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import postcss from 'postcss';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createTestRuntime } from './helpers/test-runtime.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = 'components/prism-next/blueprint/blueprint.tsx';
const runtime = await createTestRuntime('p182');
const h = React.createElement;
const render = (Component, props) => renderToStaticMarkup(h(Component, props));
async function bundle(name, plugins = [], extra = '') {
  const result = await build({ stdin: { contents: `export * from './${source}'; export * from './components/prism-next/blank-slot'; ${extra}`, loader: 'tsx', resolveDir: root }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, write: false, plugins });
  const file = new URL(`${name}.mjs`, runtime);
  writeFileSync(file, result.outputFiles[0].text);
  return import(file);
}
const before = await bundle('before', [{ name: 'baseline-aa86cfe', setup(b) {
  b.onLoad({ filter: /blueprint\/blueprint\.tsx$/ }, () => ({ contents: execFileSync('git', ['show', `aa86cfe:${source}`], { cwd: root, encoding: 'utf8' }), loader: 'tsx' }));
} }]);
const after = await bundle('after');

// Execute actual pill effects with deterministic timers, without a browser renderer.
const host = `
let slots=[], cursor=0, effects=[];
export function useRef(initial) { const i=cursor++; return slots[i]??(slots[i]={current:initial}); }
export function useEffect(fn,deps) { const i=cursor++; const old=slots[i]; if (!old || deps.some((v,j)=>!Object.is(v,old.deps[j]))) effects.push(()=>{old?.cleanup?.(); slots[i]={deps,cleanup:fn()};}); }
export function run(fn,props) { cursor=0; const value=fn(props); const pending=effects; effects=[]; pending.forEach(fn=>fn()); return value; }
export function reset() { slots.forEach(slot=>slot.cleanup?.()); slots=[]; effects=[]; }
`;
const hooks = await bundle('hooks', [{ name: 'pill-hook-host', setup(b) {
  b.onResolve({ filter: /^p182-hook-host$/ }, () => ({ path: 'host', namespace: 'p182' }));
  b.onLoad({ filter: /.*/, namespace: 'p182' }, () => ({ contents: host, loader: 'js' }));
  b.onLoad({ filter: /blueprint\/toast-timer\.ts$/ }, () => ({ contents: readFileSync(new URL('../components/prism-next/blueprint/toast-timer.ts', import.meta.url), 'utf8').replace('from "react"', 'from "p182-hook-host"'), loader: 'ts' }));
} }], 'export { run, reset } from "p182-hook-host";');
const pill = props => { const element = hooks.BpToast({ variant: 'pill', ...props }); return hooks.run(element.type, element.props); };

test('P182 default and explicit bar preserve aa86cfe SSR bytes across five themes', () => {
  for (const theme of ['light', 'paper', 'dark', 'blueprint', 'blueprint-night']) {
    for (const props of [{ children: '已保存' }, { children: h('b', null, '长中文通知'), id: 'toast', className: 'relative', style: { marginTop: 4 }, 'aria-live': 'assertive', role: 'alert' }]) {
      const baseline = renderToStaticMarkup(h('div', { 'data-prism-theme': theme }, h(before.BpToast, props)));
      for (const variant of [undefined, 'bar']) assert.equal(renderToStaticMarkup(h('div', { 'data-prism-theme': theme }, h(after.BpToast, { ...props, variant }))), baseline);
    }
  }
});

test('P182 pill renders optional icon, native action and decorative countdown with polite status', () => {
  const html = render(after.BpToast, { variant: 'pill', icon: '↺', duration: 8000, action: h('button', { type: 'button' }, '撤销'), children: '已改为判断题' });
  assert.match(html, /role="status" aria-live="polite" class="bp-toast bp-toast-pill"/);
  assert.match(html, /aria-hidden="true" class="bp-toast-pill-icon">↺/);
  assert.match(html, /<button type="button">撤销<\/button>/);
  assert.match(html, /aria-hidden="true" class="bp-toast-pill-countdown" style="animation-duration:8000ms"/);
  for (const duration of [undefined, 0, -1, NaN, Infinity]) assert.doesNotMatch(render(after.BpToast, { variant: 'pill', duration, children: '提示' }), /bp-toast-pill-(countdown|action|icon)/);
});

test('P182 timeout fires once at the deadline, uses latest callback and does not remove content', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let oldCalls = 0, calls = 0, actions = 0;
  try {
    const action = h('button', { onClick: () => actions++ }, '撤销');
    const tree = pill({ duration: 8000, onTimeout: () => oldCalls++, children: '提示', action });
    tree.props.children[2].props.children.props.onClick();
    assert.equal(actions, 1);
    t.mock.timers.tick(4000);
    pill({ duration: 8000, onTimeout: () => calls++, children: '提示', action });
    t.mock.timers.tick(3999);
    assert.equal(calls, 0);
    t.mock.timers.tick(1);
    assert.equal(calls, 1);
    assert.equal(oldCalls, 0);
    t.mock.timers.tick(8000);
    assert.equal(calls, 1);
    assert.equal(tree.props.children[1].props.children, '提示');
  } finally { hooks.reset(); }
});

test('P182 duration changes restart timer and progress; unmount and disabled duration cancel timers', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let calls = 0;
  const props = { onTimeout: () => calls++ };
  try {
    pill({ ...props, duration: 8000 });
    t.mock.timers.tick(1000);
    const tree = pill({ ...props, duration: 2000 });
    assert.equal(tree.props.children[3].key, '2000');
    t.mock.timers.tick(1999);
    assert.equal(calls, 0);
    t.mock.timers.tick(1);
    assert.equal(calls, 1);
    pill({ ...props, duration: 4000 });
    hooks.reset();
    t.mock.timers.tick(10000);
    assert.equal(calls, 1);
    pill({ ...props, duration: 2000 });
    pill(props);
    t.mock.timers.tick(4000);
    assert.equal(calls, 1);
  } finally { hooks.reset(); }
});

test('P182 reduced motion disables countdown in CSS at initial load and preference changes; timer is independent', () => {
  const css = postcss.parse(readFileSync(new URL('../app/(next)/next/blueprint.css', import.meta.url), 'utf8'));
  const rules = [];
  css.walkRules('.bp-toast-pill-countdown', rule => rules.push(rule));
  const reduced = rules.find(rule => rule.parent.type === 'atrule' && rule.parent.params === '(prefers-reduced-motion:reduce)');
  assert.ok(reduced);
  assert.ok(reduced.nodes.some(node => node.prop === 'animation' && node.value === 'none'));
  assert.ok(reduced.nodes.some(node => node.prop === 'display' && node.value === 'none'));
  assert.ok(rules.some(rule => rule.nodes.some(node => node.prop === 'height' && node.value === '2px')));
  const component = readFileSync(new URL(`../${source}`, import.meta.url), 'utf8').split('function BpToastPill')[1];
  assert.doesNotMatch(component, /matchMedia|onAnimationEnd/);
});

test('P182 BlankSlot has all circled numbers through 20, numeric overflow, accessible name and atomic editing', () => {
  for (let index = 1; index <= 21; index++) {
    const html = render(after.BlankSlot, { index });
    assert.match(html, new RegExp(`role="img" aria-label="第 ${index} 空" contentEditable="false"`, 'i'));
    assert.ok(html.includes(index <= 20 ? String.fromCodePoint(0x2460 + index - 1) : '>21<'));
    assert.match(html, /style="width:84px"/);
    assert.doesNotMatch(html, /data-selected|tabindex|<input/);
  }
  assert.match(render(after.BlankSlot, { index: 2, selected: true, width: '8em' }), /data-selected="true"[^>]*style="width:8em"/);
  assert.match(render(after.BlankSlot, { index: 21, width: 120 }), /width:120px/);
});

test('P182 pill and blank visuals are opt-in and use existing semantic colors', () => {
  const css = postcss.parse(readFileSync(new URL('../app/(next)/next/blueprint.css', import.meta.url), 'utf8'));
  for (const selector of ['.bp-toast-pill', '.bp-blank-slot', '.bp-blank-slot[data-selected]']) {
    let found = false;
    css.walkRules(selector, rule => {
      found = true;
      for (const decl of rule.nodes) assert.doesNotMatch(decl.value ?? '', /#[\da-f]{3,8}\b|rgba?\(/i);
    });
    assert.ok(found, selector);
  }
});
