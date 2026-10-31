import { restoreP127 } from './helpers/p127-source-compat.mjs';
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
const before = path => execFileSync('git', ['show', `f8ec7c7:${path}`], { cwd: root, encoding: 'utf8' });
const path = 'app/(next)/next/blueprint.css';
const text = read(path);
const blockPattern = /\/\* P105 ·[\s\S]*?\/\* End P105 blueprint polish\. \*\/\n\n/;
const block = text.match(blockPattern)?.[0];
assert.ok(block, 'P105 adaptation is an independently scoped CSS block');
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
const slots = ['button', 'combobox-trigger', 'collapsible-trigger', 'select-trigger', 'popover-trigger', 'popover-close', 'menu-trigger', 'tooltip-trigger', 'dialog-trigger', 'dialog-close', 'alert-dialog-trigger', 'alert-dialog-close', 'sheet-trigger', 'sheet-close', 'toast-action', 'toolbar-button', 'toolbar-link'];
function targets(parent) {
  const cover = el({ 'data-slot': 'textbook-cover', class: 'rounded-sm' }, parent, 'span');
  const row = el({ 'data-question-layout': 'row', class: 'd1-question' }, parent, 'button');
  const track = el({ class: 'h-1 rounded-full bg-muted' }, row, 'span');
  const summary = el({ class: 'h-1 rounded-full' }, el({ class: 'd1-rail-overview' }, parent));
  return [
    ...slots.map(slot => el({ 'data-slot': slot, class: 'border border-input bg-popover shadow-xs/5' }, parent, 'button')),
    cover, el({ class: 'bottom-2' }, cover, 'span'), el({ class: 'inset-y-0' }, cover, 'span'),
    track, el({ class: 'h-full bg-foreground' }, track, 'span'), summary, el({ class: 'bg-success' }, summary, 'span'),
    el({ 'data-slot': 'card' }, parent), el({ 'data-slot': 'card-frame' }, parent),
  ];
}

for (const name of ['blueprint', 'blueprint-night']) {
  test(`P105 ${name}: outline trigger families remove soft shadows and preserve focus`, () => {
    for (const node of targets(theme(name)).slice(0, slots.length)) {
      assert.equal(style(node)['box-shadow'], 'none');
      assert.equal(style(node)['border-radius'], '0');
      for (const pseudo of ['before', 'after']) assert.deepEqual(style(node, pseudo), { 'border-radius': '0', 'box-shadow': 'none' });
      for (const states of [['focus-visible'], ['focus-within'], ['hover'], ['disabled']]) {
        const focused = states[0].startsWith('focus');
        const result = style({ ...node, states });
        assert.equal(result['--tw-shadow'], '0 0 #0000');
        assert.equal(result['box-shadow'], focused ? undefined : 'none', 'do not replace Tailwind focus-ring composition');
        assert.equal(result.outline, undefined);
      }
      assert.deepEqual(style({ ...node, attrs: { ...node.attrs, class: 'border border-primary bg-primary' } }), {}, 'primary actions are outside outline adaptation');
    }
  });
  test(`P105 ${name}: cover paper/ink, square score tracks/fills and shadowless frames`, () => {
    const nodes = targets(theme(name)).slice(slots.length);
    assert.deepEqual(style(nodes[0]), { background: 'var(--card)', border: '1px solid var(--line)', 'border-radius': '0' });
    for (const node of nodes.slice(1, 3)) assert.deepEqual(style(node), { background: 'var(--line)' });
    for (const node of nodes.slice(3, 7)) assert.deepEqual(style(node), { 'border-radius': '0' }, 'score colors and proportions are untouched');
    for (const node of nodes.slice(7)) {
      for (const states of [[], ['focus-within']]) assert.equal(style({ ...node, states })['box-shadow'], 'none');
      assert.equal(style({ ...node, states: ['focus-visible'] })['box-shadow'], undefined);
      for (const pseudo of ['before', 'after']) assert.equal(style(node, pseudo)['box-shadow'], 'none');
    }
    assert.deepEqual(style(el({ class: 'h-1 rounded-full bg-muted' }, theme(name))), {}, 'unrelated progress bars are not targeted');
    assert.deepEqual(style(el({ class: 'rounded-full bg-info' }, nodes[3].parent)), {}, 'semantic markers keep their shape');
  });
}

for (const core of ['light', 'paper', 'dark']) test(`P105 ${core}: zero CSS delta globally and in nested preview roots/children/pseudos`, () => {
  for (const outer of [undefined, 'blueprint', 'blueprint-night']) {
    const parent = outer ? theme(outer) : undefined;
    const local = theme(core, parent);
    const nodes = targets(local);
    const roots = targets(parent).map(node => ({ ...node, attrs: { ...node.attrs, ...local.attrs } }));
    for (const node of [...nodes, ...roots]) for (const states of [[], ['focus-visible'], ['focus-within'], ['hover']]) {
      assert.deepEqual(style({ ...node, states }), {});
      for (const pseudo of ['before', 'after']) assert.deepEqual(style({ ...node, states }, pseudo), {});
    }
  }
  // P106 opt-in styles are independently checked against 0965f49.
  // P107 independently guards the removed P75 geometry and its isolated additions.
  assert.equal(text.replace(/\n\/\* P113 ·[\s\S]*$/, '').replace(/\/\* P107 ·[\s\S]*?\/\* End P107 reskin gaps\. \*\/\n\n/, '').replace(/\/\* P75 question detail:[\s\S]*?\/\* End P75 question detail\. \*\//, '').replace(/\/\* P106 ·[\s\S]*?\/\* End P106 title rules\. \*\/\n\n/, '').replace(block, ''), before(path).replace(/\/\* P75 question detail:[\s\S]*?\/\* End P75 question detail\. \*\//, ''), 'all other pre-existing CSS stays byte-identical');
  assert.equal(read('app/(next)/next/theme.css'), before('app/(next)/next/theme.css'));
});

test('P105 every added selector is confined to both Blueprints and excludes core roots/descendants', () => {
  css.walkRules(rule => {
    for (const selector of rule.selectors) {
      assert.ok(selector.startsWith(':where(:is([data-prism-theme="blueprint"],[data-prism-theme="blueprint-night"])) '), selector);
      assert.ok(selector.includes(':not(:where([data-agent-preview][data-prism-theme]:not(:is([data-prism-theme="blueprint"],[data-prism-theme="blueprint-night"])), [data-agent-preview][data-prism-theme]:not(:is([data-prism-theme="blueprint"],[data-prism-theme="blueprint-night"])) *))'), selector);
    }
  });
  for (const [outer, inner] of [['blueprint', 'blueprint-night'], ['blueprint-night', 'blueprint']]) {
    const single = targets(theme(inner)), nested = targets(theme(inner, theme(outer)));
    nested.forEach((node, i) => {
      assert.deepEqual(style(node), style(single[i]));
      for (const pseudo of ['before', 'after']) assert.deepEqual(style(node, pseudo), style(single[i], pseudo));
    });
  }
});

test('P105 preserves primary, hover-card and P104 floating hard shadows by cascade', () => {
  const floating = postcss.parse(text.match(/\/\* P104 ·[\s\S]*?\/\* End P104 floating surfaces\. \*\//)[0]);
  const hard = postcss.parse('');
  postcss.parse(text).nodes.filter(n => n.type === 'rule' && (/^\.bp-btn/.test(n.selector) || /^\.bp-card:is\(a,button\):hover$/.test(n.selector))).forEach(n => hard.append(n.clone()));
  const cascade = [...rules, ...rulesOf(hard), ...rulesOf(floating)];
  for (const name of ['blueprint', 'blueprint-night']) {
    const parent = theme(name);
    for (const slot of ['combobox-trigger', 'collapsible-trigger']) {
      const node = el({ 'data-slot': slot, class: 'border-input' }, el({ class: 'd1-canvas' }, parent));
      assert.equal(style(node, undefined, cascade)['box-shadow'], name === 'blueprint' ? '6px 6px 0 rgb(22 24 29 / 6%)' : '6px 6px 0 rgba(0,0,0,.3)');
    }
    const primary = el({ class: 'bp-btn', 'data-variant': 'primary' }, parent, 'button');
    assert.equal(style(primary, undefined, cascade)['box-shadow'], 'var(--shadow-offset)');
    assert.equal(style({ ...primary, states: ['hover'] }, undefined, cascade)['box-shadow'], 'var(--shadow-offset-sm)');
    const card = { ...el({ class: 'bp-card', 'data-slot': 'card' }, parent, 'a'), states: ['hover'] };
    assert.equal(style(card, undefined, cascade)['box-shadow'], '4px 4px 0 var(--foreground)');
  }
  css.walkDecls(d => assert.ok(!d.important && !/outline|font|animation|transition/.test(d.prop)));
});

const componentPaths = ['components/prism-next/textbook-directory.tsx', 'components/prism-next/question-rail.tsx', 'components/coss/button.tsx', 'components/coss/card.tsx', 'components/coss/select.tsx', 'components/coss/collapsible.tsx'];
test('P105 reusable markup remains byte-identical to P104', () => {
  for (const path of componentPaths) {
    let actual = read(path);
    if (path === 'components/prism-next/textbook-directory.tsx') {
      actual = restoreP127(path, actual);
      // P121: exact import and visible-field hunks only; all remaining bytes frozen.
      for (const hunk of JSON.parse(read('tests/fixtures/p121-textbook-source-hunks.json'))) {
        assert.ok(hunk.after.length > 0);
        assert.equal(actual.split(hunk.after).length, 2, 'authorized hunk occurs exactly once');
        actual = actual.replace(hunk.after, hunk.before);
      }
    }
    assert.equal(actual, before(path), path);
  }
});

const probe = `
import { TextbookDirectory } from './components/prism-next/textbook-directory';
import { textbooks } from './lib/prism-next/textbook-directory';
import { QuestionRail } from './components/prism-next/question-rail';
import { reviewRailFixture } from './components/prism-next/demos/review-workspace-fixtures';
import { Button, buttonVariants } from './components/coss/button';
import { Card, CardFrame } from './components/coss/card';
import { Collapsible, CollapsibleTrigger } from './components/coss/collapsible';
import { Select, SelectTrigger, SelectValue } from './components/coss/select';
export function Probe({theme}) { return <div data-prism-theme={theme}>
<TextbookDirectory layout="header" textbooks={textbooks} />
<QuestionRail {...reviewRailFixture} panelId="p105-core" selected="4" onSelect={()=>{}} onLocate={()=>{}} onPage={()=>{}} />
<CardFrame><Card><Button variant="outline">查看材料</Button></Card></CardFrame>
<Collapsible><CollapsibleTrigger className={buttonVariants({variant:'outline'})}>原始触发器</CollapsibleTrigger></Collapsible>
<Collapsible><CollapsibleTrigger render={<Button variant="outline"/>}>render 触发器</CollapsibleTrigger></Collapsible>
<Select defaultValue="a"><SelectTrigger><SelectValue/></SelectTrigger></Select>
</div> }
`;
async function bundle(contents, name, baseline = false) {
  const target = new URL(`${name}.mjs`, await createTestRuntime('p105'));
  const plugins = baseline ? [{ name: 'p104-source', setup(b) {
    b.onLoad({ filter: /\.[jt]sx$/ }, args => {
      const relative = args.path.slice(root.length);
      if (componentPaths.includes(relative)) return { contents: before(relative), loader: 'tsx' };
    });
  } }] : [];
  const result = await build({ stdin: { contents, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, plugins, write: false });
  writeFileSync(target, result.outputFiles[0].text);
  return import(target);
}
test('P105 core-theme actual component SSR matches P104 for all four affected families', async () => {
  const current = await bundle(probe, 'current'), baseline = await bundle(probe, 'baseline', true);
  for (const theme of ['light', 'paper', 'dark']) {
    const actual = renderToStaticMarkup(createElement(current.Probe, { theme }));
    assert.equal(actual, renderToStaticMarkup(createElement(baseline.Probe, { theme })), theme);
    for (const marker of ['textbook-cover', 'linear-gradient', 'var(--brand-ai-gradient)', 'data-question-layout="row"', 'rounded-full', 'width:80%', 'data-slot="card-frame"', 'shadow-xs/5', 'data-slot="collapsible-trigger"', 'data-slot="select-trigger"']) assert.ok(actual.includes(marker), marker);
  }
});
test('P105 component-site fixtures expose both Blueprints and actual affected markup', async () => {
  const { BlueprintPolishDemo } = await bundle(`export { BlueprintPolishDemo } from './components/prism-next/demos/blueprint-polish';`, 'demo');
  for (const [kind, markers] of Object.entries({ cover: ['textbook-cover'], rail: ['data-question-layout="row"', 'width:80%'], triggers: ['collapsible-trigger', 'select-trigger', '展开推导说明', '展开阅读提示'], cards: ['card-frame', '查看材料'] })) {
    const html = renderToStaticMarkup(createElement(BlueprintPolishDemo, { kind }));
    for (const name of ['blueprint', 'blueprint-night']) assert.ok(html.includes(`data-prism-theme="${name}"`));
    for (const marker of [`id="p105-${kind}"`, ...markers]) assert.ok(html.includes(marker), marker);
  }
  for (const [file, kind] of [['tree-directory', 'cover'], ['question-rail', 'rail'], ['forms', 'triggers'], ['content', 'cards'], ['content', 'triggers']]) assert.ok(read(`components/prism-next/demos/${file}.tsx`).includes(`<BlueprintPolishDemo kind="${kind}" />`));
});
