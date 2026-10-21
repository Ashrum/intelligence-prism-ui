import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import postcss from 'postcss';
import React, { act } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { hydrationDOM, domNodes } from './helpers/ssr-hydration-dom.mjs';
import { renderToString, renderToStaticMarkup } from 'react-dom/server';
import { createTestRuntime } from './helpers/test-runtime.mjs';
import { relativeLuminance } from '../lib/prism-next/chart-color.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = path => readFileSync(root + path, 'utf8');
const file = new URL('bundle.mjs', await createTestRuntime('p102-grading'));
writeFileSync(file, (await build({ stdin: { contents: `export * from './components/prism-next/blueprint/blueprint'; export * from './components/prism-next/demos/blueprint-grading';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, write: false })).outputFiles[0].text);
const api = await import(file);
const h = React.createElement;
const render = (name, props) => renderToStaticMarkup(h(api[name], props));
const css = read('app/(next)/next/blueprint.css');
const p102 = postcss.parse(css.split('/* P102 ·')[1].split('/* P97 · Status badges')[0].split('*/').slice(1).join('*/'));
const theme = postcss.parse(read('app/(next)/next/theme.css'));
const cases = JSON.parse(read('tests/fixtures/p102-steps-before.json'));
const slotProps = { name: '陈一诺', code: '01', detail: '已接收 · 等待批阅' };
const declarations = rule => Object.fromEntries(rule.nodes.filter(n => n.type === 'decl').map(n => [n.prop, n.value]));
const rule = selector => p102.nodes.find(n => n.type === 'rule' && n.selector === selector);

for (const [index, fixture] of cases.entries()) test(`P102 BpSteps legacy SSR fixture ${index}: omitted and chips are byte-identical`, () => {
  assert.equal(render('BpSteps', fixture.props), fixture.html);
  assert.equal(render('BpSteps', { ...fixture.props, variant: 'chips' }), fixture.html);
});

test('P102 bars exposes ordered stages, current, text equivalents, tone and readable zero meta', () => {
  const out = render('BpSteps', { variant: 'bars', current: 1, steps: [
    { id: 'setup', label: '设置' }, { id: 'receive', label: '收卷', tone: 'receive', meta: 0 },
    { id: 'ai', label: 'AI 批阅', tone: 'ai', meta: '未开始' }, { id: 'review', label: '教师复核', tone: 'review' },
  ] });
  assert.match(out, /data-slot="bp-steps" data-variant="bars"/);
  assert.match(out, /<li data-state="done" data-tone="ink">/);
  assert.match(out, /<li data-state="current" data-tone="receive" aria-current="step">/);
  assert.equal((out.match(/aria-current="step"/g) ?? []).length, 1);
  assert.match(out, /bp-phase-meta text-ui-hint">0<\/span>/);
  for (const text of ['（已完成）', '（当前）', '（未开始）', '01', '04']) assert.ok(out.includes(text));
  assert.equal((out.match(/class="bp-phase-bar" aria-hidden="true"/g) ?? []).length, 4);
});

for (const kind of ['beam', 'line']) test(`P102 ${kind}: inactive has no markup; active is pointer-independent decoration`, () => {
  assert.equal(render('BpScanTrace', { kind, tone: 'receive', active: false }), '');
  for (const tone of ['receive', 'ai']) assert.match(render('BpScanTrace', { kind, tone, active: true }), new RegExp(`aria-hidden="true" data-slot="bp-scan-trace" data-kind="${kind}" data-tone="${tone}" data-active="true"`));
  assert.equal(declarations(rule('.bp-scan-trace'))['pointer-events'], 'none');
});

for (const state of ['waiting', 'received', 'grading', 'graded', 'review']) test(`P102 paper ${state}: external detail, correct trace/mark and one-shot eligibility`, () => {
  const out = render('BpPaperSlot', { ...slotProps, state, fresh: true, focused: true });
  assert.match(out, new RegExp(`data-slot="bp-paper-slot" data-state="${state}"`));
  assert.match(out, /aria-label="陈一诺 已接收 · 等待批阅"/);
  assert.match(out, /role="group"/);
  assert.match(out, /data-focused="true"/);
  assert.equal(out.includes('data-slot="bp-scan-trace"'), state === 'grading');
  assert.equal(out.includes('✓'), state === 'graded');
  if (state === 'received') assert.match(out, /data-fresh="arrival"/);
  else if (state === 'graded' || state === 'review') assert.match(out, /data-fresh="completion"/);
  else assert.doesNotMatch(out, /data-fresh=/);
  assert.doesNotMatch(render('BpPaperSlot', { ...slotProps, state }), /data-fresh=|data-focused=/);
});

test('P102 paper uses native link/button or noninteractive group, with link precedence', () => {
  let selected = 0;
  const props = { ...slotProps, state: 'received', onSelect: () => selected++ };
  assert.match(render('BpPaperSlot', props), /^<button[^>]*type="button"/);
  assert.match(render('BpPaperSlot', { ...props, href: '/review' }), /^<a[^>]*href="\/review"/);
  assert.doesNotMatch(render('BpPaperSlot', { ...slotProps, state: 'waiting' }), /tabindex|<button|<a /);
  const element = api.BpPaperSlot(props);
  element.props.onClick();
  assert.equal(selected, 1);
  assert.equal(element.props['data-state'], 'received', 'selection cannot advance a supplied state');
  assert.equal(api.BpPaperSlot({ ...props, href: '/review' }).props.onClick, undefined);
});

const extensionNames = ['--bp-phase-receive', '--bp-phase-ai', '--bp-phase-review', '--bp-paper-waiting'];
const baseRule = theme.nodes.find(n => n.type === 'rule' && n.selector.includes(':where([data-agent-preview][data-prism-theme])'));
const boundary = name => theme.nodes.find(n => n.type === 'rule' && n.selector.includes(`:where([data-agent-preview])[data-prism-theme="${name}"]`));
const baseTokens = declarations(baseRule);
const ownTokens = name => name === 'light' ? {} : declarations(boundary(name));
const resolve = (tokens, name) => tokens[name].startsWith('var(') ? resolve(tokens, tokens[name].slice(4,-1)) : tokens[name];

test('P102 new tokens reset at root AND local preview; nested core roots and descendants resolve neutrally', () => {
  assert.match(baseRule.selector, /:root:where\(\[data-ui-version="coss-v1"\]\)/);
  for (const themeName of ['blueprint', 'blueprint-night']) {
    assert.match(boundary(themeName).selector, /:root:where\(\[data-ui-version="coss-v1"\]\)/);
    const outer = { ...baseTokens, ...ownTokens(themeName) };
    for (const inner of ['light', 'paper', 'dark']) {
      // CSS custom properties are reset ON the preview root, so descendants and
      // pseudo-elements inherit the same neutral values, not resolved outer phases.
      const preview = { ...outer, ...baseTokens, ...ownTokens(inner) };
      for (const name of extensionNames) {
        assert.equal(baseTokens[name], name === '--bp-paper-waiting' ? 'var(--border)' : 'var(--line)');
        assert.equal(resolve(preview, name), resolve(preview, '--border'));
      }
    }
  }
  for (const n of p102.nodes.filter(n => n.type === 'rule')) for (const selector of n.selectors) assert.ok(selector.startsWith('.bp-'), selector);
  for (const n of p102.nodes.filter(n => n.type === 'rule')) for (const d of n.nodes.filter(n => n.type === 'decl')) assert.doesNotMatch(d.value, /#[\da-f]{3,8}\b/i, 'all new colors come from local tokens');
});

test('P102 existing theme declarations are identical to d960312, only four scoped tokens added', () => {
  const old = postcss.parse(execFileSync('git', ['show', 'd960312:app/(next)/next/theme.css'], { cwd: root, encoding: 'utf8' }));
  const strip = tree => { const result = []; tree.walkDecls(d => { if (!extensionNames.includes(d.prop)) result.push([d.parent.selector ?? d.parent.name, d.prop, d.value]); }); return result; };
  assert.deepEqual(strip(theme), strip(old));
  const added = []; theme.walkDecls(d => { if (extensionNames.includes(d.prop)) added.push(d); });
  assert.equal(added.length, 12);
  for (const d of added) assert.ok([baseRule, boundary('blueprint'), boundary('blueprint-night')].includes(d.parent));
});

test('P102 night phase decoration exceeds 3:1; semantic warning and success stay readable', () => {
  const ratio = (a,b) => (Math.max(relativeLuminance(a),relativeLuminance(b))+.05)/(Math.min(relativeLuminance(a),relativeLuminance(b))+.05);
  for (const name of ['blueprint', 'blueprint-night']) {
    const tokens = ownTokens(name);
    for (const t of ['--warning-foreground','--success-foreground']) assert.ok(ratio(tokens[t],tokens['--card']) >= 4.5);
    if (name === 'blueprint-night') for (const t of extensionNames) assert.ok(ratio(tokens[t],tokens['--card']) >= 3);
    assert.equal(tokens['--bp-phase-receive'], '#C2F25B');
    assert.equal(tokens['--bp-phase-ai'], '#339FF2');
    assert.equal(tokens['--bp-phase-review'], '#E0438F');
  }
  assert.equal(declarations(rule('.bp-paper-slot[data-state="review"] .bp-paper-slot-detail')).color,'var(--warning-foreground)');
  assert.equal(declarations(rule('.bp-paper-slot-check')).color,'var(--success-foreground)');
});

test('P102 animation contracts include transform-only stage growth and full reduced-motion cancellation', () => {
  const grow = p102.nodes.find(n => n.type === 'atrule' && n.name === 'keyframes' && n.params === 'bp-phase-grow');
  const props = []; grow.walkDecls(d => props.push(d.prop));
  assert.deepEqual(props, ['transform', 'transform']);
  assert.equal(declarations(rule('.bp-phase-bar')).height, '4px');
  assert.match(declarations(rule('.bp-scan-trace[data-kind="beam"]')).animation, /1\.6s linear infinite alternate/);
  assert.match(declarations(rule('.bp-scan-trace[data-kind="line"]')).animation, /2\.4s linear infinite/);
  assert.match(declarations(rule('.bp-paper-slot[data-fresh]::before')).animation, /600ms ease-out forwards/);
  assert.match(declarations(rule('.bp-paper-slot[data-fresh="arrival"]'))['--bp-arrival-animation'], /320ms cubic-bezier/);
  assert.match(declarations(rule('.bp-paper-slot[data-focused="true"]'))['--bp-focus-animation'], /180ms ease-out/);
  const reduced = p102.nodes.find(n => n.type === 'atrule' && n.name === 'media' && n.params === '(prefers-reduced-motion:reduce)');
  const animations = reduced.nodes.find(n => declarations(n).animation === 'none');
  for (const selector of ['.bp-phase-bar','.bp-scan-trace','.bp-paper-slot','.bp-paper-slot::before']) assert.ok(animations.selectors.includes(selector));
  const hidden = reduced.nodes.find(n => declarations(n).display === 'none');
  assert.deepEqual(hidden.selectors, ['.bp-scan-trace','.bp-paper-slot::before']);
});

test('P102 sample has twelve slots, five states, literal demo boundary, manual events and no timers', () => {
  const out = render('BlueprintGradingDemo');
  assert.equal((out.match(/data-slot="bp-paper-slot"/g) ?? []).length, 12);
  for (const state of ['waiting','received','grading','graded','review']) assert.match(out, new RegExp(`data-state="${state}"`));
  for (const label of ['演示事件，产品中由真实状态驱动','模拟到达 1 份','模拟开始 AI 批阅','模拟批完 1 份','模拟待处理回执','模拟进入复核','减少动态效果对照']) assert.ok(out.includes(label));
  for (const path of ['components/prism-next/blueprint/grading.tsx','components/prism-next/blueprint/blueprint.tsx','components/prism-next/demos/blueprint-grading.tsx']) assert.doesNotMatch(read(path), /setTimeout|setInterval|requestAnimationFrame/);
  assert.equal(declarations(rule('.bp-grading-grid'))['grid-template-columns'], 'repeat(2,minmax(0,1fr))');
});

// Real React hydration and state updates in the repository DOM adapter. Calling
// React handlers is not browser dispatch, keyboard, CSS or visual acceptance.
test('P102 demo manual events update supplied facts, stop traces, focus and reset without remounting slots', async () => {
  const element = h(api.BlueprintGradingDemo);
  const dom = hydrationDOM(), host = dom.parse(renderToString(element), dom.document.createElement('div'));
  const keys = ['window','document','IS_REACT_ACT_ENVIRONMENT'];
  const previous = Object.fromEntries(keys.map(key => [key,globalThis[key]]));
  Object.assign(globalThis,{window:dom.window,document:dom.document,IS_REACT_ACT_ENVIRONMENT:true});
  let mounted;
  const errors = [], original = console.error;
  console.error = (...args) => errors.push(args.join(' '));
  const nodes = (key,value) => domNodes(host,n=>n.getAttribute?.(key)===value);
  const slots = () => nodes('data-slot','bp-paper-slot');
  const click = async label => {
    const button = domNodes(host,n=>n.tagName==='BUTTON' && domNodes(n,child=>child.nodeType===3).map(child=>child.nodeValue).join('')===label)[0];
    assert.ok(button,label);
    const props = button[Object.keys(button).find(key=>key.startsWith('__reactProps$'))];
    assert.ok(!props.disabled,label);
    await act(()=>props.onClick());
  };
  try {
    await act(()=>{ mounted=hydrateRoot(host,element,{onRecoverableError:e=>errors.push(e.message)}); });
    const originalSlots = slots();
    await click('模拟到达 1 份');
    assert.equal(slots()[4].getAttribute('data-state'),'received');
    assert.equal(slots()[4].getAttribute('data-fresh'),'arrival');
    await click('模拟开始 AI 批阅');
    assert.equal(slots()[3].getAttribute('data-state'),'grading');
    assert.equal(nodes('data-kind','beam').length,0);
    await click('模拟批完 1 份');
    assert.equal(slots()[2].getAttribute('data-state'),'graded');
    assert.equal(slots()[2].getAttribute('data-fresh'),'completion');
    await click('模拟待处理回执');
    assert.equal(slots()[3].getAttribute('data-state'),'review');
    assert.equal(nodes('data-kind','line').length,0);
    await click('模拟进入复核');
    assert.equal(slots()[1].getAttribute('data-focused'),'true');
    assert.equal(nodes('aria-current','step')[0].getAttribute('data-tone'),'review');
    await click('减少动态效果对照：关');
    assert.equal(nodes('data-reduced-motion','true').length,1);
    await click('重置演示');
    assert.equal(slots()[4].getAttribute('data-state'),'waiting');
    assert.equal(nodes('data-focused','true').length,0);
    assert.equal(nodes('data-fresh','completion').length,0);
    assert.equal(nodes('data-kind','beam').length,1);
    assert.equal(slots()[0],originalSlots[0],'events retain native node identity and keyboard focus');
    assert.deepEqual(errors,[]);
  } finally {
    if(mounted) await act(()=>mounted.unmount());
    console.error=original;
    for(const key of keys) if(previous[key]===undefined) delete globalThis[key]; else globalThis[key]=previous[key];
  }
});
