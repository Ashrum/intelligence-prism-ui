import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import postcss from 'postcss';
import { transform } from 'lightningcss';

const full = readFileSync(new URL('../app/(next)/next/blueprint.css', import.meta.url), 'utf8');
const block = full.slice(full.indexOf('/* P130:'), full.indexOf('/* P131 ·'));
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
      if (s.kind === 'has') return node.hasPaperHost ?? false;
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

function previewNodes(parent) {
  const canvas = el({ class: 'd1-canvas bp-frame bp-frame--canvas bg-border' }, parent);
  canvas.hasPaperHost = true;
  return { canvas, host: el({ class: 'd1-paper-host' }, canvas), decoration: el({ class: 'bp-frame-decoration' }, canvas) };
}
for (const name of ['blueprint', 'blueprint-night']) test(`P130 ${name}: page grid, one ruler layer, flush scroll viewport, card faces and ink dividers`, () => {
  const parent = theme(name), { canvas, host, decoration } = previewNodes(parent);
  assert.equal(style(canvas).background, decls(postcss.parse(full).nodes.find(n => n.type === 'rule')).background);
  assert.equal(style(canvas).padding, '0');
  assert.equal(style(canvas)['box-shadow'], 'none');
  assert.deepEqual(style(host), { margin: '0' });
  // Neither the host nor its scroller gets replacement outer spacing.
  // Existing scroll-content padding (including host-specific inline padding) wins.
  assert.deepEqual(style(el({ class: 'd1-continuous' }, host)), {});
  assert.equal(style(decoration).display, 'none');
  // No viewport/container gate can make this outer decoration visible again.
  assert.equal(css.nodes.filter(n => n.type === 'atrule' && n.name !== 'media').length, 0);
  assert.deepEqual(css.nodes.filter(n => n.type === 'atrule').map(n => n.params), ['print']);
  assert.deepEqual(style(el({ class: 'bp-ruler' }, el({ class: 'bp-sheet' }, host))), {});
  assert.deepEqual(style(el({ class: 'bp-frame-decoration' }, el({ class: 'bp-frame' }, parent))), {});
  for (const [target, side] of [['d1-topbar','bottom'], ['d1-mobile-nav','bottom'], ['d1-rail','right'], ['d1-inspector','left']]) {
    const face = el({ class: target }, parent);
    assert.equal(style(face).background, 'var(--card)');
    assert.equal(style(face)[`border-${side}`], side === 'bottom' ? '1.5px solid var(--line)' : '1px solid var(--border)');
    assert.deepEqual(style(el({ class: 'selected bg-accent' }, face)), {});
  }
  assert.equal(style(el({ class: 'd1-canvas' }, parent)).padding, '24px 28px');
  const printRules = rulesOf(css.nodes.find(n => n.type === 'atrule'));
  assert.equal(style(canvas, undefined, printRules)['background-image'], 'none');
});

test('P130 core themes and nested core previews receive no overrides; CSS parses without new tokens', () => {
  assert.doesNotThrow(() => transform({ code: Buffer.from(block), minify: true }));
  css.walkDecls(d => assert.ok(!d.prop.startsWith('--')));
  assert.doesNotMatch(block, /#[0-9a-f]{3,8}\b|(?:oklch|rgba?)\(/i);
  const allRules = [...rules, ...rulesOf(css.nodes.find(n => n.type === 'atrule'))];
  for (const core of ['light', 'paper', 'dark']) for (const parent of [theme(core), theme(core, theme('blueprint')), theme(core, theme('blueprint-night'))]) {
    const nodes = previewNodes(parent);
    for (const node of [...Object.values(nodes), ...['d1-topbar','d1-mobile-nav','d1-rail','d1-inspector'].map(c => el({ class: c }, parent))]) {
      assert.deepEqual(style(node, undefined, allRules), {});
    }
  }
});
