import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';
import { transform } from 'lightningcss';
import { build } from 'esbuild';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createTestRuntime } from './helpers/test-runtime.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = path => readFileSync(root + path, 'utf8');
const baseline = '1486441b727bbae4e488e16b79e67a8ef2a7b716';
const before = path => execFileSync('git', ['show', `${baseline}:${path}`], { cwd: root, encoding: 'utf8' });
const path = 'app/(next)/next/blueprint.css';
const text = read(path);
const blockPattern = /\/\* P107 ·[\s\S]*?\/\* End P107 reskin gaps\. \*\/\n\n/;
const detailPattern = /\/\* P75 question detail:[\s\S]*?\/\* End P75 question detail\. \*\//;
const block = text.match(blockPattern)?.[0];
assert.ok(block);
const css = postcss.parse(block);
const decls = rule => Object.fromEntries(rule.nodes.filter(n => n.type === 'decl').map(n => [n.prop, n.value]));
function parse(selector) {
  let ast;
  transform({ code: Buffer.from(`${selector}{color:red}`), visitor: { Selector(value) { ast = value; } } });
  return ast;
}
// Match production selector AST against synthetic ancestry. This verifies
// isolation and cascade contracts, not browser computed layout or visual QA.
function matches(selector, node, pseudo) {
  if (!node) return false;
  const split = selector.findLastIndex(s => s.type === 'combinator');
  if (split >= 0) {
    if (!matches(selector.slice(split + 1), node, pseudo)) return false;
    if (selector[split].value === 'child') return matches(selector.slice(0, split), node.parent);
    assert.equal(selector[split].value, 'descendant');
    for (let p = node.parent; p; p = p.parent) if (matches(selector.slice(0, split), p)) return true;
    return false;
  }
  return selector.every(s => {
    if (s.type === 'universal') return true;
    if (s.type === 'type') return s.name === (node.tag ?? 'div');
    if (s.type === 'class') return (node.attrs.class ?? '').split(' ').includes(s.name);
    if (s.type === 'attribute') return s.operation ? node.attrs[s.name] === s.operation.value : Object.hasOwn(node.attrs, s.name);
    if (s.type === 'pseudo-element') return s.kind === pseudo;
    if (s.type === 'pseudo-class') {
      if (['is', 'where', 'not'].includes(s.kind)) {
        const any = s.selectors.some(child => matches(child, node, pseudo));
        return s.kind === 'not' ? !any : any;
      }
      if (['focus-visible', 'focus-within', 'hover', 'disabled', 'active'].includes(s.kind)) return node.states?.includes(s.kind) ?? false;
    }
    assert.fail(JSON.stringify(s));
  });
}
function specificity(ast) {
  return ast.reduce((total, s) => total + (s.type === 'pseudo-class' && ['is', 'not'].includes(s.kind) ? Math.max(...s.selectors.map(specificity)) : s.type === 'pseudo-class' && s.kind === 'where' ? 0 : ['attribute', 'class', 'pseudo-class'].includes(s.type) ? 100 : ['type', 'pseudo-element'].includes(s.type) ? 1 : 0), 0);
}
function rulesOf(sheet) {
  return sheet.nodes.filter(n => n.type === 'rule').flatMap(rule => rule.selectors.map(selector => ({ ast: parse(selector), rule, pseudo: /::(?:before|after)/.test(selector) })));
}
const rules = rulesOf(css);
function style(node, pseudo, source = rules) {
  return Object.assign({}, ...source.filter(r => r.pseudo === Boolean(pseudo) && matches(r.ast, node, pseudo)).sort((a, b) => specificity(a.ast) - specificity(b.ast)).map(r => decls(r.rule)));
}
const el = (attrs, parent, tag = 'div') => ({ attrs, parent, tag });
const theme = (name, parent) => el({ 'data-prism-theme': name, ...(parent ? { 'data-agent-preview': '' } : {}) }, parent);
const rings = 'var(--tw-ring-offset-shadow,0 0 #0000),var(--tw-ring-shadow,0 0 #0000)';
const family = ':is([data-prism-theme="blueprint"],[data-prism-theme="blueprint-night"])';
const guard = `:not(:where([data-agent-preview][data-prism-theme]:not(${family}), [data-agent-preview][data-prism-theme]:not(${family}) *))`;
function targets(parent) {
  return [
    el({ 'data-slot': 'frame-panel', class: 'rounded-xl shadow-xs/5' }, parent),
    el({ class: 'prism-question rounded-xl ring-1 ring-border shadow-xs/5', 'data-question-level': 'L2' }, parent, 'article'),
    el({ 'data-slot': 'toolbar-button', class: 'bg-primary shadow-xs' }, parent, 'button'),
    el({ 'data-slot': 'toolbar-button', class: 'border-input shadow-xs/5' }, parent, 'button'),
    el({ class: 'block rounded-sm shadow-md' }, el({ 'data-paper-sheet-media': '' }, parent), 'span'),
    el({ class: 'rounded-sm', 'data-paper-stack': '' }, el({ 'data-paper-sheet-media': '' }, parent), 'span'),
    el({ class: 'rounded-sm', 'data-paper-action': 'thumbnail' }, el({ 'data-paper-sheet-media': '' }, parent), 'button'),
  ];
}
for (const name of ['blueprint', 'blueprint-night']) {
  test(`P107 ${name}: V1–V4b square surfaces, zero blur, focus/selection rings and hard primary shadows`, () => {
    const nodes = targets(theme(name));
    for (const states of [[], ['hover'], ['focus-visible'], ['focus-within'], ['active'], ['disabled'], ['hover', 'active'], ['hover', 'disabled'], ['hover', 'focus-visible']]) {
      const actual = nodes.map(node => style({ ...node, states }));
      for (const value of actual) assert.equal(value['border-radius'], '0');
      assert.equal(actual[0]['border-color'], 'var(--line)');
      assert.equal(actual[0]['border-width'], 'var(--line-width)');
      assert.equal(actual[0]['box-shadow'], 'none');
      // A hard spread stroke preserves the ring-only card geometry (no new border box).
      assert.equal(actual[1]['box-shadow'], '0 0 0 var(--line-width) var(--line)');
      assert.equal(actual[2]['box-shadow'], states.includes('active') || states.includes('disabled') ? rings : `${rings},var(${states.includes('hover') ? '--shadow-offset-sm' : '--shadow-offset'})`);
      for (const value of actual.slice(3)) assert.equal(value['box-shadow'], rings);
      for (const node of nodes) for (const pseudo of ['before', 'after']) {
        assert.deepEqual(style({ ...node, states }, pseudo), { 'border-radius': '0', 'box-shadow': 'none' });
      }
    }
    const pressed = { ...nodes[2], attrs: { ...nodes[2].attrs, 'data-pressed': '' } };
    assert.equal(style(pressed)['box-shadow'], rings);
    // Reading and summary content, unrelated span icons and paper status badges stay untouched.
    for (const level of ['L1', 'L3']) assert.deepEqual(style(el({ class: 'prism-question', 'data-question-level': level }, theme(name), 'article')), {});
    assert.deepEqual(style(el({ class: 'rounded-sm shadow-md' }, theme(name), 'span')), {});
    assert.deepEqual(style(el({ class: 'rounded-full', 'data-paper-success': '' }, el({ 'data-paper-sheet-media': '' }, theme(name)), 'span')), {});
  });
}
for (const core of ['light', 'paper', 'dark']) test(`P107 ${core}: no CSS output at global or nested preview roots/children/pseudos`, () => {
  for (const outer of [undefined, 'blueprint', 'blueprint-night']) {
    const parent = outer ? theme(outer) : undefined;
    const local = theme(core, parent);
    const roots = targets(parent).map(node => ({ ...node, attrs: { ...node.attrs, ...local.attrs } }));
    for (const node of [...targets(local), ...roots]) for (const states of [[], ['focus-visible'], ['hover'], ['active']]) {
      assert.deepEqual(style({ ...node, states }), {});
      for (const pseudo of ['before', 'after']) assert.deepEqual(style({ ...node, states }, pseudo), {});
    }
  }
});
const visual = new Set(['border-radius', 'box-shadow', 'background', 'background-image', 'border-color', 'border-style', 'border-width', 'color', 'font-family']);
function visualOnly(source) {
  const ast = postcss.parse(source);
  ast.walkDecls(d => assert.ok(visual.has(d.prop) && !d.important, d.toString()));
  ast.walkRules(r => r.selectors.forEach(s => {
    assert.ok(s.startsWith(`${family} `), s);
    assert.ok(s.includes(guard), s);
  }));
}
test('P107 all added declarations follow visual whitelist and guard both themes including pseudos', () => visualOnly(block));
test('P107 rejects geometry, missing guards and unscoped mutations', () => {
  for (const prop of ['padding','margin','gap','width','height','min-height','display','position','overflow','transform']) {
    assert.throws(() => visualOnly(block.replace('border-radius:0;', `border-radius:0; ${prop}:0;`)), undefined, prop);
  }
  assert.throws(() => visualOnly(block.replaceAll(guard, '')));
  assert.throws(() => visualOnly(block.replaceAll(`${family} `, '')));
});
test('P107 V6 removes exactly the 10 old geometry declarations; visual detail rules stay intact', () => {
  const old = postcss.parse(before(path).match(detailPattern)[0]);
  const current = postcss.parse(text.match(detailPattern)[0]);
  const properties = /^(padding|gap|margin-block-start|margin-block-end|row-gap|margin-top|min-height)$/;
  const removed = [];
  old.walkDecls(d => { if (properties.test(d.prop)) { removed.push(`${d.prop}:${d.value}`); d.remove(); } });
  assert.deepEqual(removed, ['padding:12px','gap:12px','margin-block-start:0','margin-block-end:12px','row-gap:16px','margin-block-start:0','margin-block-end:12px','row-gap:12px','margin-top:12px','min-height:32px']);
  const declarations = ast => {
    const result = [];
    ast.walkRules(r => { const values = decls(r); if (Object.keys(values).length) result.push([r.selector, values]); });
    return result;
  };
  assert.deepEqual(declarations(current), declarations(old));
  current.walkDecls(d => assert.ok(['background', 'border', 'border-radius', 'border-color'].includes(d.prop), d.prop));
});
test('P107 all other CSS, tokens and source TSX stay byte-identical to 1486441', () => {
  const actual = text.replace(blockPattern, '').replace(detailPattern, '');
  const expected = before(path).replace(detailPattern, '');
  assert.equal(actual, expected);
  const compile = source => transform({ code: Buffer.from(source), minify: true }).code.toString();
  assert.equal(compile(actual), compile(expected));
  for (const file of ['app/(next)/next/theme.css', 'components/coss/frame.tsx', 'components/coss/button.tsx', 'components/coss/toolbar.tsx', 'components/prism-next/question-card.tsx', 'components/prism-next/question-analysis-card.tsx', 'components/prism-next/attachment.tsx']) assert.equal(read(file), before(file), file);
  // Existing guide-approved shadow tokens are zero-blur in both themes.
  for (const match of read('app/(next)/next/theme.css').matchAll(/--shadow-offset(?:-sm)?:([^;]+);/g)) {
    assert.match(match[1].trim(), /^(?:none$|\S+ \S+ 0(?:px)? )/);
  }
});

// Real component SSR supplies the target classes/slots; AST probes above are not browser QA.
const runtime = await createTestRuntime('p107');
const bundle = await build({ stdin: { contents: `
import { Frame, FramePanel } from './components/coss/frame';
import { QuestionCard } from './components/prism-next/question-card';
import { questionSamples } from './components/prism-next/fixtures/question-samples';
import { ToolbarButton } from './components/coss/toolbar';
import { Button } from './components/coss/button';
import { PaperCard } from './components/prism-next/attachment';
export function Probe() { return <><Frame><FramePanel>资源</FramePanel></Frame><QuestionCard question={questionSamples[0]} actions={<ToolbarButton render={<Button/>}>加入试题篮</ToolbarButton>}/><PaperCard id="p107" studentName="长中文姓名" pageCount={2} variant="sheet" status={{label:'已接收',tone:'success'}} selected onView={()=>{}}/></> }
`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false });
const entry = new URL('fixture.mjs', runtime);
writeFileSync(entry, bundle.outputFiles[0].text);
const { Probe } = await import(entry);
test('P107 real SSR confirms frame, L2 question, primary toolbar, sheet face and selection hooks', () => {
  const html = renderToStaticMarkup(createElement(Probe));
  const parent = theme('blueprint');
  const stack = [parent], nodes = [];
  for (const match of html.matchAll(/<\/?[a-zA-Z][^>]*>/g)) {
    if (match[0].startsWith('</')) { stack.pop(); continue; }
    const tag = match[0].match(/^<([\w-]+)/)[1];
    const attrs = Object.fromEntries([...match[0].matchAll(/([\w:-]+)="([^"]*)"/g)].map(m => [m[1],m[2]]));
    const node = el(attrs, stack.at(-1), tag); nodes.push(node);
    if (!['input','img','br','hr','link','meta','source','wbr'].includes(tag)) stack.push(node);
  }
  const frame = nodes.find(n => n.attrs['data-slot'] === 'frame-panel');
  const question = nodes.find(n => n.tag === 'article' && n.attrs['data-question-level'] === 'L2');
  const primary = nodes.find(n => n.attrs['data-slot'] === 'toolbar-button' && n.attrs.class.includes('bg-primary'));
  const face = nodes.find(n => n.tag === 'span' && n.attrs.class?.includes('shadow-md'));
  assert.ok(face.attrs.class.includes('ring-2'));
  for (const node of [frame,question,primary,face]) { assert.ok(node); assert.equal(style(node)['border-radius'], '0'); }
  assert.equal(style(face)['box-shadow'], rings);
  assert.equal(style(primary)['box-shadow'], `${rings},var(--shadow-offset)`);
});
