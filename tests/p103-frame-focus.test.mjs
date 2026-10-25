import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import postcss from 'postcss';
import React, { act } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString, renderToStaticMarkup } from 'react-dom/server';
import { hydrationDOM, domNodes } from './helpers/ssr-hydration-dom.mjs';
import { createTestRuntime } from './helpers/test-runtime.mjs';
import { relativeLuminance } from '../lib/prism-next/chart-color.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = path => readFileSync(root + path, 'utf8');
const file = new URL('bundle.mjs', await createTestRuntime('p103-frame-focus'));
writeFileSync(file, (await build({ stdin: { contents: `export { BpFrameCard } from './components/prism-next/blueprint/blueprint'; export { BlueprintGradingDemo } from './components/prism-next/demos/blueprint-grading';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, plugins: [{ name: 'p118-temml-url', setup(b) { b.onResolve({ filter: /temml\.mjs\?url$/ }, () => ({ path: 'temml', namespace: 'url' })); b.onLoad({ filter: /.*/, namespace: 'url' }, () => ({ contents: 'export default "temml.mjs"' })); } }], write: false })).outputFiles[0].text);
const { BpFrameCard, BlueprintGradingDemo } = await import(file);
const h = React.createElement;
const render = props => renderToStaticMarkup(h(BpFrameCard, props));
const fixture = JSON.parse(read('tests/fixtures/p103-frame-before.json'));
const cssText = read('app/(next)/next/blueprint.css');
const css = postcss.parse(cssText);
const p103 = postcss.parse(cssText.match(/\/\* P103 ·[\s\S]*?\/\* End P103 frame focus\. \*\//)[0]);
const themeText = read('app/(next)/next/theme.css');
const theme = postcss.parse(themeText);
const declarations = node => Object.fromEntries(node.nodes.filter(n => n.type === 'decl').map(n => [n.prop, n.value]));
const rule = selector => p103.nodes.find(n => n.type === 'rule' && n.selector === selector);
const focusSelector = '.bp-frame-card[data-focus="review"]';
const bodySelector = '.bp-frame-card > .bp-card-body[data-swap="answer"]';

for (const [i, entry] of fixture.cases.entries()) test(`P103 omitted API preserves 1384f8c frame SSR bytes: ${i}`, () => {
  assert.equal(fixture.baseline, '1384f8c21880bc7e45def9a5febcfa436ef0c7ae');
  assert.equal(render(entry.props), entry.html);
  assert.equal(render({ ...entry.props, focus: undefined, swapKey: undefined }), entry.html);
});

test('P103 focus is an opt-in section fact; SSR never marks the initial answer as a swap', () => {
  for (const swapKey of [undefined, 0, '', 'submission-1:question-1']) {
    const props = { title: '当前作答原件', children: '合成作答', swapKey };
    const out = render({ ...props, focus: 'review' });
    assert.match(out, /^<section[^>]+data-focus="review">/);
    assert.equal(out.replace(' data-focus="review"', ''), render(props));
    assert.doesNotMatch(out, /data-swap=|swapKey=|aria-current=|aria-live=|tabindex=|sr-only/);
    assert.match(render({ ...props, focus: 'review', 'aria-current': 'true', 'aria-labelledby': 'host-title' }), /aria-labelledby="host-title" aria-current="true"/);
  }
});

test('P103 focus reuses P102 token, geometry and easing; the body moves only when explicitly marked', () => {
  assert.deepEqual(declarations(rule(focusSelector)), { outline: '2px solid var(--bp-phase-review)', 'outline-offset': '3px', animation: 'bp-paper-focus 180ms ease-out' });
  const paper = css.nodes.find(n => n.selector === '.bp-paper-slot[data-focused="true"]');
  assert.equal(declarations(paper)['--bp-focus-animation'], declarations(rule(focusSelector)).animation);
  assert.deepEqual(declarations(rule(bodySelector)), { animation: 'bp-frame-swap 180ms ease-out' });
  const frames = p103.nodes.find(n => n.name === 'keyframes' && n.params === 'bp-frame-swap');
  assert.deepEqual(frames.nodes.map(n => [n.selector, declarations(n)]), [['from', { transform: 'translateX(8px)', opacity: '0' }], ['to', { transform: 'translateX(0)', opacity: '1' }]]);
  for (const n of p103.nodes.filter(n => n.type === 'rule')) for (const selector of n.selectors) assert.ok(selector.startsWith('.bp-'), selector);
  p103.walkDecls(d => assert.doesNotMatch(d.value, /#[\da-f]{3,8}\b/i));
});

const baseRule = theme.nodes.find(n => n.type === 'rule' && n.selector.includes(':where([data-agent-preview][data-prism-theme])'));
const boundary = name => theme.nodes.find(n => n.type === 'rule' && n.selector.includes(`:where([data-agent-preview])[data-prism-theme="${name}"]`));
const base = declarations(baseRule);
const own = name => name === 'light' ? {} : declarations(boundary(name));
const resolve = (tokens, name) => tokens[name].startsWith('var(') ? resolve(tokens, tokens[name].slice(4, -1)) : tokens[name];
const ratio = (a, b) => (Math.max(relativeLuminance(a), relativeLuminance(b)) + .05) / (Math.min(relativeLuminance(a), relativeLuminance(b)) + .05);

test('P103 local theme boundaries exclude outer brand focus from core roots, descendants and pseudos', () => {
  assert.match(baseRule.selector, /:root:where\(\[data-ui-version="coss-v1"\]\)/);
  assert.equal(base['--bp-phase-review'], 'var(--line)');
  for (const outerName of ['blueprint', 'blueprint-night']) {
    const outer = { ...base, ...own(outerName) };
    assert.equal(resolve(outer, '--bp-phase-review'), '#E0438F');
    for (const innerName of ['light', 'paper', 'dark']) {
      // Tokens reset on the preview root, so its own frame, descendants and
      // pseudo-elements resolve the local neutral line instead of the outer phase.
      const inner = { ...outer, ...base, ...own(innerName) };
      assert.equal(resolve(inner, '--bp-phase-review'), resolve(inner, '--line'));
      assert.notEqual(resolve(inner, '--bp-phase-review'), '#E0438F');
    }
  }
  assert.equal(themeText, execFileSync('git', ['show', `${fixture.baseline}:app/(next)/next/theme.css`], { cwd: root, encoding: 'utf8' }));
  const night = own('blueprint-night');
  assert.ok(ratio(night['--bp-phase-review'], night['--card']) >= 3);
  assert.ok(ratio(night['--bp-phase-review'], night['--background']) >= 3);
});

test('P103 reduced motion cancels both animations via live CSS media and the demo override', () => {
  const media = p103.nodes.find(n => n.name === 'media' && n.params === '(prefers-reduced-motion:reduce)');
  assert.deepEqual(media.nodes[0].selectors, [focusSelector, bodySelector]);
  assert.deepEqual(declarations(media.nodes[0]), { animation: 'none' });
  const override = rule(`.bp-grading-demo[data-reduced-motion="true"] ${focusSelector},\n.bp-grading-demo[data-reduced-motion="true"] ${bodySelector}`);
  assert.deepEqual(declarations(override), { animation: 'none' });
  for (const path of ['components/prism-next/blueprint/blueprint.tsx', 'components/prism-next/demos/blueprint-grading.tsx']) assert.doesNotMatch(read(path), /setTimeout|setInterval|requestAnimationFrame|onAnimationEnd/);
});

// Real React hydration/updates in the local DOM adapter, not browser/CSS acceptance.
async function hydrated(element, run) {
  const dom = hydrationDOM(), host = dom.parse(renderToString(element), dom.document.createElement('div'));
  const keys = ['window', 'document', 'IS_REACT_ACT_ENVIRONMENT'];
  const previous = Object.fromEntries(keys.map(key => [key, globalThis[key]]));
  Object.assign(globalThis, { window: dom.window, document: dom.document, IS_REACT_ACT_ENVIRONMENT: true });
  const errors = [], original = console.error;
  console.error = (...args) => errors.push(args.join(' '));
  let mounted;
  try {
    await act(() => { mounted = hydrateRoot(host, element, { onRecoverableError: e => errors.push(e.message) }); });
    await run(host, async next => { await act(() => mounted.render(next)); });
    assert.deepEqual(errors, []);
  } finally {
    if (mounted) await act(() => mounted.unmount());
    console.error = original;
    for (const key of keys) if (previous[key] === undefined) delete globalThis[key]; else globalThis[key] = previous[key];
  }
}
const byClass = (host, name) => domNodes(host, n => n.getAttribute?.('class')?.split(' ').includes(name))[0];

test('P103 strict hydration is static; each identity change remounts only body, same identity and focus changes retain it', async () => {
  const element = (swapKey, focus = 'review', text = '合成作答') => h(React.StrictMode, null, h(BpFrameCard, { title: '当前原件', swapKey, focus, actions: h('button', null, '查看'), children: h('p', null, text) }));
  await hydrated(element('A'), async (host, update) => {
    const section = byClass(host, 'bp-frame-card'), header = byClass(host, 'bp-frame-card-head');
    const action = domNodes(host, n => n.tagName === 'BUTTON')[0];
    let body = byClass(host, 'bp-card-body');
    assert.equal(body.getAttribute('data-swap'), null);
    await update(element('A', 'review', '同身份更新'));
    assert.equal(byClass(host, 'bp-card-body'), body);
    assert.equal(body.getAttribute('data-swap'), null);
    for (const key of ['B', 'A', 1, '1', '', 0]) {
      await update(element(key));
      const next = byClass(host, 'bp-card-body');
      assert.notEqual(next, body);
      assert.equal(next.getAttribute('data-swap'), 'answer');
      assert.equal(byClass(host, 'bp-frame-card'), section);
      assert.equal(byClass(host, 'bp-frame-card-head'), header);
      assert.equal(domNodes(host, n => n.tagName === 'BUTTON')[0], action);
      body = next;
      await update(element(key));
      assert.equal(byClass(host, 'bp-card-body'), body, 'same identity does not restart the CSS entrance');
    }
    await update(h(React.StrictMode, null, h(BpFrameCard, { ...element(0).props.children.props, focus: undefined })));
    assert.equal(section.getAttribute('data-focus'), null);
    assert.equal(byClass(host, 'bp-card-body'), body);
    await update(element(undefined));
    assert.equal(byClass(host, 'bp-card-body').getAttribute('data-swap'), null);
    await update(element('after-omission'));
    assert.equal(byClass(host, 'bp-card-body').getAttribute('data-swap'), 'answer');
  });
});

test('P103 demo next-answer event changes supplied identity and text, retaining the event button', async () => {
  const element = h(BlueprintGradingDemo);
  assert.match(renderToStaticMarkup(element), /演示事件，产品中由真实选中驱动/);
  await hydrated(element, async host => {
    const button = domNodes(host, n => n.tagName === 'BUTTON' && domNodes(n, c => c.nodeType === 3).map(c => c.nodeValue).join('') === '下一份')[0];
    const initial = byClass(host, 'bp-card-body');
    assert.equal(initial.getAttribute('data-swap'), null);
    const props = button[Object.keys(button).find(key => key.startsWith('__reactProps$'))];
    await act(() => props.onClick());
    assert.notEqual(byClass(host, 'bp-card-body'), initial);
    assert.equal(byClass(host, 'bp-card-body').getAttribute('data-swap'), 'answer');
    assert.equal(byClass(host, 'bp-frame-card').getAttribute('aria-current'), 'true');
    const text = byClass(host, 'bp-frame-card').textContent;
    assert.match(text, /林子涵/);
    assert.match(text, /第 2 \/ 12 份/);
    assert.ok(domNodes(host, n => n === button).length);
  });
});
