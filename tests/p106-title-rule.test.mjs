import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import postcss from 'postcss';
import { transform } from 'lightningcss';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createTestRuntime } from './helpers/test-runtime.mjs';
import { relativeLuminance } from '../lib/prism-next/chart-color.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = path => readFileSync(root + path, 'utf8');
const fixture = JSON.parse(read('tests/fixtures/p106-title-rule-before.json'));
const file = new URL('bundle.mjs', await createTestRuntime('p106-title-rule'));
writeFileSync(file, (await build({ stdin: { contents: `export { BpSectionCard, BpMinor } from './components/prism-next/blueprint/blueprint'; export { BlueprintTitleRuleDemo } from './components/prism-next/demos/blueprint';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false })).outputFiles[0].text);
const api = await import(file);
const render = (name, props) => renderToStaticMarkup(h(api[name], props));
for (const [index, entry] of fixture.cases.entries()) test(`P106 default SSR bytes equal 0965f49: ${entry.component}/${index}`, () => {
  assert.equal(fixture.baseline, '0965f49268a60d7e23882a4b8139e453c606a011');
  assert.equal(render(entry.component, entry.props), entry.html);
  const off = entry.component === 'BpMinor' ? { rule: 'border' } : { titleRule: false };
  assert.equal(render(entry.component, { ...entry.props, ...off }), entry.html);
});

test('P106 opt-in changes only the intended attribute, preserving heading names, levels and action order', () => {
  for (const { component, props, html } of fixture.cases) {
    const minor = component === 'BpMinor';
    const out = render(component, { ...props, ...(minor ? { rule: 'ink' } : { titleRule: true }) });
    assert.match(out, minor ? /^<h[2-6][^>]* data-rule="ink">/ : /^<section[^>]* data-title-rule="">/);
    assert.equal(out.replace(minor ? ' data-rule="ink"' : ' data-title-rule=""', ''), html);
    assert.doesNotMatch(out, /titleRule=| rule=|aria-hidden=|tabindex=/);
  }
  const props = { title: h('em', null, '范围'), letter: 'A', meta: h('span', null, '第 1 页'), action: h('button', { 'aria-label': '查看说明' }, '说明') };
  assert.equal(render('BpSectionCard', { ...props, titleRule: true }).replace(' data-title-rule=""', ''), render('BpSectionCard', props));
});

const path = 'app/(next)/next/blueprint.css';
const text = read(path);
const block = text.match(/\/\* P106 ·[\s\S]*?\/\* End P106 title rules\. \*\/\n\n/)[0];
const css = postcss.parse(block);
const decls = rule => Object.fromEntries(rule.nodes.filter(n => n.type === 'decl').map(n => [n.prop, n.value]));
const title = '.bp-section-card[data-title-rule] > .bp-section-card-head > .bp-section-card-title';
const minor = '.bp-minor[data-rule="ink"]';
const topRule = selector => css.nodes.find(n => n.type === 'rule' && n.selector === selector);

test('P106 structural rules are empty, centered flex decorations with narrow-screen space yielding', () => {
  assert.deepEqual(decls(topRule(`${title}::after`)), { content: '""', flex: '1 0 24px', 'min-width': '24px', height: 'var(--line-width)', 'align-self': 'center', background: 'var(--line)' });
  assert.deepEqual(decls(topRule(`${minor}::after`)), { height: 'var(--line-width)', background: 'var(--line)' });
  const oldMinor = postcss.parse(text).nodes.find(n => n.selector === '.bp-minor::after');
  assert.equal(decls(oldMinor).content, '""');
  assert.equal(decls(oldMinor).height, '1px');
  assert.equal(decls(oldMinor).background, 'var(--border)');
  const media = css.nodes.find(n => n.type === 'atrule');
  assert.equal(media.params, '(max-width:760px)');
  assert.deepEqual(decls(media.nodes.find(n => n.selector === title)), { 'flex-basis': '100%' });
  assert.deepEqual(decls(media.nodes.at(-1)), { flex: '1 1 0', 'min-width': '0' });
  css.walkDecls(d => {
    assert.doesNotMatch(d.prop, /font|overflow|white-space|text-overflow/);
    assert.doesNotMatch(d.value, /#[\da-f]{3,8}\b/i);
  });
  assert.equal(text.replace(block, ''), execFileSync('git', ['show', `${fixture.baseline}:${path}`], { cwd: root, encoding: 'utf8' }), 'no pre-existing CSS changed');
  assert.equal(read('app/(next)/next/theme.css'), execFileSync('git', ['show', `${fixture.baseline}:app/(next)/next/theme.css`], { cwd: root, encoding: 'utf8' }), 'no tokens changed');
});

// Selector/variable evaluation over SSR ancestry: engineering evidence, not visual QA.
function parse(selector) {
  let ast;
  transform({ code: Buffer.from(`${selector}{color:red}`), visitor: { Selector(value) { ast = value; } } });
  return ast;
}
function matches(s, node, pseudo) {
  if (!node) return false;
  const split = s.findLastIndex(p => p.type === 'combinator');
  if (split >= 0) {
    if (!matches(s.slice(split + 1), node, pseudo)) return false;
    if (s[split].value === 'child') return matches(s.slice(0, split), node.parent);
    assert.equal(s[split].value, 'descendant');
    for (let p = node.parent; p; p = p.parent) if (matches(s.slice(0, split), p)) return true;
    return false;
  }
  return s.every(p => {
    if (p.type === 'universal') return true;
    if (p.type === 'class') return (node.attrs.class ?? '').split(' ').includes(p.name);
    if (p.type === 'type') return node.tag === p.name;
    if (p.type === 'attribute') return p.operation ? node.attrs[p.name] === p.operation.value : Object.hasOwn(node.attrs, p.name);
    if (p.type === 'pseudo-element') return p.kind === pseudo;
    if (p.type === 'pseudo-class' && p.kind === 'root') return !node.parent;
    if (p.type === 'pseudo-class' && ['where', 'is', 'not'].includes(p.kind)) {
      const any = p.selectors.some(child => matches(child, node, pseudo));
      return p.kind === 'not' ? !any : any;
    }
    assert.fail(JSON.stringify(p));
  });
}
const themeRules = postcss.parse(read('app/(next)/next/theme.css')).nodes.filter(n => n.type === 'rule' && /data-(prism-theme|ui-version)/.test(n.selector)).map(rule => ({ selectors: rule.selectors.map(parse), decls: decls(rule) }));
const rules = css.nodes.filter(n => n.type === 'rule').flatMap(rule => rule.selectors.map(selector => ({ ast: parse(selector), decls: decls(rule), pseudo: selector.endsWith('::after') ? 'after' : undefined })));
const style = (node, pseudo) => Object.assign({}, ...rules.filter(r => r.pseudo === pseudo && matches(r.ast, node, pseudo)).map(r => r.decls));
function tokens(node) { return { ...(node.parent ? tokens(node.parent) : {}), ...Object.assign({}, ...themeRules.filter(r => r.selectors.some(s => matches(s, node))).map(r => r.decls)) }; }
function resolve(node, value) { return value.replace(/var\((--[\w-]+)\)/g, (_, key) => resolve(node, tokens(node)[key])); }
function tree(html, parent) {
  const nodes = [], stack = [parent];
  for (const match of html.matchAll(/<\/?[a-zA-Z][^>]*>/g)) {
    const tag = match[0];
    if (tag.startsWith('</')) { stack.pop(); continue; }
    const node = { tag: tag.match(/^<([\w-]+)/)[1], attrs: Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(m => [m[1], m[2]])), parent: stack.at(-1) };
    nodes.push(node);
    if (!['img', 'link', 'br', 'hr', 'input', 'meta'].includes(node.tag)) stack.push(node);
  }
  return nodes;
}
const themes = ['light', 'paper', 'dark', 'blueprint', 'blueprint-night'];
const themeRoot = (name, parent) => ({ tag: 'div', attrs: { 'data-prism-theme': name, ...(parent ? { 'data-agent-preview': '' } : { 'data-ui-version': 'coss-v1' }) }, parent });
for (const name of themes) test(`P106 ${name}: local root/descendant/pseudo tokens exclude outer Blueprint ink`, () => {
  const expected = tokens(themeRoot(name));
  for (const outer of [undefined, 'blueprint', 'blueprint-night']) for (const density of ['default', 'compact']) for (const ownRoot of [false, true]) {
    const boundary = themeRoot(name, outer ? themeRoot(outer) : undefined);
    const attrs = ownRoot ? boundary.attrs : {};
    const parent = ownRoot ? boundary.parent : boundary;
    const nodes = tree(render('BpSectionCard', { ...attrs, density, titleRule: true, title: '分节', letter: 'A', meta: '第 1 页' }) + render('BpMinor', { ...attrs, rule: 'ink', label: '分组' }), parent);
    const targets = nodes.filter(n => /bp-section-card-title|bp-minor text/.test(n.attrs.class ?? ''));
    assert.equal(targets.length, 2);
    for (const node of targets) {
      const ink = style(node, 'after');
      assert.equal(resolve(node, ink.background), resolve(themeRoot(name), expected['--line']));
      assert.equal(resolve(node, ink.height), name.startsWith('blueprint') ? '1.5px' : '1px');
      if (!name.startsWith('blueprint')) assert.equal(resolve(node, ink.background), expected['--border']);
      assert.deepEqual(style(node, 'before'), {});
    }
    // The caller's opt-in must not decorate a nested default card or ordinary core headings.
    const inner = tree(render('BpSectionCard', { title: '未选择墨线' }), nodes[0]).find(n => /bp-section-card-title/.test(n.attrs.class ?? ''));
    assert.deepEqual(style(inner, 'after'), {});
    assert.deepEqual(style({ tag: 'h3', attrs: {}, parent: boundary }, 'after'), {});
  }
});

test('P106 night line contrast exceeds 3:1 on both paper and page; guide numbers match tokens', () => {
  const node = themeRoot('blueprint-night'), values = tokens(node);
  const luminance = relativeLuminance(values['--line']);
  for (const key of ['--card', '--background']) {
    const bg = relativeLuminance(values[key]);
    const ratio = (Math.max(luminance, bg) + .05) / (Math.min(luminance, bg) + .05);
    assert.ok(ratio >= 3);
    assert.ok(read('docs/blueprint-theme.md').includes(`${ratio.toFixed(2)}:1`));
  }
});

test('P106 demo includes default/compact, accessible action, border comparison, long content and core previews', () => {
  const out = render('BlueprintTitleRuleDemo');
  assert.match(out, /id="title-rules"/);
  assert.match(out, /class="bp-section-card"[^>]+data-title-rule=""/);
  assert.match(out, /bp-section-card-compact[^>]+data-title-rule=""/);
  assert.match(out, /aria-label="查看任务范围说明" aria-expanded="false" aria-controls="bp-title-rule-note"/);
  assert.match(out, /id="bp-title-rule-note" hidden=""/);
  assert.match(out, /<h4 class="bp-minor text-block-title"><span class="bp-minor-label">评分说明/);
  assert.match(out, /长中文分节标题/);
  assert.match(out, /<math/);
  for (const name of ['light', 'paper', 'dark']) assert.match(out, new RegExp(`data-agent-preview="true" data-prism-theme="${name}"`));
});
