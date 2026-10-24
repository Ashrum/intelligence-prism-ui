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
const baseline = 'be43477ea5286cd8f20d37f2423a6af0ba60e58b';
const before = path => execFileSync('git', ['show', `${baseline}:${path}`], { cwd: root, encoding: 'utf8' });
const path = 'app/(next)/next/blueprint.css';
const text = read(path);
const block = text.match(/\/\* P104 ·[\s\S]*?\/\* End P104 floating surfaces\. \*\/\n\n/)[0];
const css = postcss.parse(block);
const declarations = rule => Object.fromEntries(rule.nodes.filter(n => n.type === 'decl').map(n => [n.prop, n.value]));
function parse(selector) {
  let ast;
  transform({ code: Buffer.from(`${selector}{color:red}`), visitor: { Selector(value) { ast = value; } } });
  return ast;
}
// Production selector AST against synthetic ancestry, not browser computed CSS.
function matches(selector, node, pseudo) {
  if (!node) return false;
  const split = selector.findLastIndex(s => s.type === 'combinator');
  if (split >= 0) {
    assert.equal(selector[split].value, 'descendant');
    if (!matches(selector.slice(split + 1), node, pseudo)) return false;
    for (let p = node.parent; p; p = p.parent) if (matches(selector.slice(0, split), p)) return true;
    return false;
  }
  return selector.every(s => {
    if (s.type === 'universal') return true;
    if (s.type === 'class') return (node.attrs.class ?? '').split(' ').includes(s.name);
    if (s.type === 'attribute') return s.operation ? node.attrs[s.name] === s.operation.value : Object.hasOwn(node.attrs, s.name);
    if (s.type === 'pseudo-element') return s.kind === pseudo;
    if (s.type === 'pseudo-class' && ['is', 'where', 'not'].includes(s.kind)) {
      const any = s.selectors.some(child => matches(child, node, pseudo));
      return s.kind === 'not' ? !any : any;
    }
    assert.fail(JSON.stringify(s));
  });
}
const rules = css.nodes.filter(n => n.type === 'rule').map(rule => ({ rule, asts: rule.selectors.map(parse) }));
const style = (node, pseudo) => Object.assign({}, ...rules.filter(({ rule, asts }) => Boolean(pseudo) === /::(?:before|after)/.test(rule.selector) && asts.some(ast => matches(ast, node, pseudo))).map(({ rule }) => declarations(rule)));
const el = (attrs, parent) => ({ attrs, parent });
const theme = (name, parent) => el({ 'data-prism-theme': name, ...(parent ? { 'data-agent-preview': '' } : {}) }, parent);
function surfaces(parent) {
  const canvas = el({ class: 'd1-canvas' }, parent);
  const bar = el({ class: 'q1-student-controls surface-floating rounded-xl shadow-lg' }, parent);
  const dock = el({ class: 'd1-tool-dock rounded-r-xl shadow-lg' }, canvas);
  return [bar, dock, el({ 'data-slot': 'toolbar' }, canvas), el({ 'data-slot': 'combobox-trigger' }, canvas), el({ 'data-slot': 'collapsible-trigger' }, canvas), el({ 'data-slot': 'combobox-trigger' }, bar), ...['combobox-wrapper', 'tooltip-popup', 'dialog-popup', 'foundation-sample'].map(slot => el({ class: 'surface-floating', 'data-slot': slot }, parent))];
}

for (const name of ['blueprint', 'blueprint-night']) test(`P104 ${name}: all floating family anchors are square opaque ink surfaces with a zero-blur shadow`, () => {
  for (const node of surfaces(theme(name))) {
    const actual = style(node);
    assert.equal(actual['border-radius'], '0');
    assert.equal(actual.border, '1px solid var(--line)');
    assert.equal(actual['--surface-floating-background'], 'var(--popover)');
    assert.equal(actual['--surface-floating-blur'], '0px');
    assert.equal(actual.background, 'var(--surface-floating-background)');
    assert.equal(actual['backdrop-filter'], 'none');
    assert.equal(actual['-webkit-backdrop-filter'], 'none');
    assert.equal(actual['box-shadow'], name === 'blueprint' ? '6px 6px 0 rgb(22 24 29 / 6%)' : '6px 6px 0 rgba(0,0,0,.3)');
    for (const pseudo of ['before', 'after']) assert.deepEqual(style(node, pseudo), { 'border-radius': '0', 'box-shadow': 'none' });
  }
});

for (const core of ['light', 'paper', 'dark']) test(`P104 ${core}: no CSS delta globally or at nested preview roots, descendants and pseudos`, () => {
  for (const outer of [undefined, 'blueprint', 'blueprint-night']) {
    const local = theme(core, outer ? theme(outer) : undefined);
    const nodes = surfaces(local);
    // A floating surface can itself be a local preview root.
    for (const node of [...nodes, ...surfaces(outer ? theme(outer) : undefined).map(node => ({ ...node, attrs: { ...node.attrs, ...local.attrs } }))]) {
      assert.deepEqual(style(node), {});
      for (const pseudo of ['before', 'after']) assert.deepEqual(style(node, pseudo), {});
    }
  }
  assert.equal(read('app/(next)/next/theme.css'), before('app/(next)/next/theme.css'));
  // All previous rules/at-rules remain byte-identical; the only CSS delta cannot
  // match core nodes. Compile both untouched portions as an additional check.
  // P105 independently proves its additive block cannot affect core themes.
  // P106 opt-in styles are independently checked against 0965f49.
  // P107 checks its visual-only delta and the remaining CSS against 1486441.
  const untouched = text.replace(/\n\/\* P113 ·[\s\S]*$/, '').replace(/\/\* P107 ·[\s\S]*?\/\* End P107 reskin gaps\. \*\/\n\n/, '').replace(/\/\* P75 question detail:[\s\S]*?\/\* End P75 question detail\. \*\//, '').replace(/\/\* P106 ·[\s\S]*?\/\* End P106 title rules\. \*\/\n\n/, '').replace(block, '').replace(/\/\* P105 ·[\s\S]*?\/\* End P105 blueprint polish\. \*\/\n\n/, '');
  assert.equal(untouched, before(path).replace(/\/\* P75 question detail:[\s\S]*?\/\* End P75 question detail\. \*\//, ''));
  const compile = input => transform({ code: Buffer.from(input), minify: true }).code.toString();
  assert.equal(compile(untouched), compile(before(path).replace(/\/\* P75 question detail:[\s\S]*?\/\* End P75 question detail\. \*\//, '')));
});

test('P104 limits trigger adaptation to preview controls and avoids a second dock shadow', () => {
  for (const name of ['blueprint', 'blueprint-night']) {
    const parent = theme(name);
    for (const slot of ['toolbar', 'combobox-trigger', 'collapsible-trigger']) assert.deepEqual(style(el({ 'data-slot': slot }, parent)), {});
    const dock = el({ class: 'd1-tool-dock' }, parent), scroll = el({ class: 'd1-tool-scroll' }, dock);
    assert.deepEqual(style(scroll), { 'min-width': '0', flex: '1' });
    const inner = style(el({ 'data-slot': 'toolbar', class: 'surface-floating' }, scroll));
    assert.equal(inner['box-shadow'], 'none'); assert.equal(inner.border, '0'); assert.equal(inner.width, '100%');
    assert.equal(inner['border-radius'], '0');
    for (const core of ['light', 'paper', 'dark']) {
      const nested = theme(core, dock);
      assert.deepEqual(style(el({ class: 'd1-tool-scroll' }, nested)), {});
    }
  }
  const print = css.nodes.find(n => n.type === 'atrule' && n.name === 'media');
  assert.equal(print.params, 'print');
  assert.equal(declarations(print.nodes[0])['box-shadow'], 'none');
  assert.equal(print.nodes[0].nodes[0].important, true);
  css.walkDecls(d => assert.ok(!/outline|animation|transition|font|color$/.test(d.prop), `preserve focus, motion and typography: ${d.prop}`));
});

test('P104 nested white/night previews select their own existing Popover shadow', () => {
  for (const [outer, inner] of [['blueprint-night', 'blueprint'], ['blueprint', 'blueprint-night']]) {
    const node = surfaces(theme(inner, theme(outer)))[0];
    assert.equal(style(node)['box-shadow'], inner === 'blueprint' ? '6px 6px 0 rgb(22 24 29 / 6%)' : '6px 6px 0 rgba(0,0,0,.3)');
  }
});

test('P104 leaves reusable component TSX and core surface/layout CSS byte-identical', () => {
  for (const file of ['student-control-bar.tsx', 'paper-preview-surface.tsx', 'review-workspace.tsx', 'review-switcher.tsx', 'paper-preview-group.tsx', 'student-control-bar.css', 'review-workspace.css']) {
    const path = `components/prism-next/${file}`;
    assert.equal(read(path), before(path), path);
  }
});

test('P104 component page renders real existing fixtures in both Blueprints and light', async () => {
  const bundle = new URL('bundle.mjs', await createTestRuntime('p104'));
  writeFileSync(bundle, (await build({ stdin: { contents: `export { BlueprintFloatingPreviewDemo } from './components/prism-next/demos/blueprint-floating-preview';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false })).outputFiles[0].text);
  const { BlueprintFloatingPreviewDemo } = await import(bundle);
  const html = renderToStaticMarkup(createElement(BlueprintFloatingPreviewDemo));
  assert.match(read('components/prism-next/demos/paper-preview.tsx'), /<BlueprintFloatingPreviewDemo\s*\/>/);
  for (const name of ['blueprint', 'blueprint-night', 'light']) assert.ok(html.includes(`data-prism-theme="${name}"`));
  // render={<Button />} keeps data-slot=button in the pinned coss version;
  // raw trigger slots used by other hosts are covered by the selector probes.
  for (const marker of ['id="p104-floating"', 'data-student-controls', 'd1-tool-dock', 'data-slot="toolbar"', '选择学生', 'data-full-score-group', '满分', '适合页面', '旋转当前纸', '快捷键', '<math>']) assert.ok(html.includes(marker), marker);
});
