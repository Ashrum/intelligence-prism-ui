import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import postcss from 'postcss';
import { transform } from 'lightningcss';
import { createElement as h } from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { createTestRuntime } from './helpers/test-runtime.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = path => readFileSync(root + path, 'utf8');
const bundle = new URL('bundle.mjs', await createTestRuntime('p101'));
writeFileSync(bundle, (await build({ stdin: { contents: `export * from './components/prism-next/blueprint/blueprint'; export * from './components/prism-next/demos/blueprint'; export * from './components/prism-next/demos/table-particle'; export * from './components/coss/button'; export * from './components/coss/table';`, loader: 'tsx', resolveDir: root }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false })).outputFiles[0].text);
const api = await import(bundle);
const baseline = JSON.parse(read('tests/fixtures/p101-defaults-before.json'));
const css = postcss.parse(read('app/(next)/next/blueprint.css'));
const declarations = rule => Object.fromEntries(rule.nodes.filter(n => n.type === 'decl').map(d => [d.prop, d.value]));

// Parse production selectors against synthetic ancestry. This checks scope and
// declarations, not browser computed style, geometry or native keyboard handling.
function parse(selector) {
  let ast;
  transform({ code: Buffer.from(`${selector}{color:red}`), visitor: { Selector(value) { ast = value; } } });
  return ast;
}
function matches(selector, node) {
  if (!node) return false;
  const split = selector.findLastIndex(s => s.type === 'combinator');
  if (split >= 0) {
    if (!matches(selector.slice(split + 1), node)) return false;
    assert.equal(selector[split].value, 'descendant');
    for (let p = node.parent; p; p = p.parent) if (matches(selector.slice(0, split), p)) return true;
    return false;
  }
  return selector.every(s => {
    if (s.type === 'universal') return true;
    if (s.type === 'type') return node.tag === s.name;
    if (s.type === 'attribute') return s.operation ? node.attrs[s.name] === s.operation.value : Object.hasOwn(node.attrs, s.name);
    if (s.type === 'pseudo-class' && ['is', 'where', 'not'].includes(s.kind)) {
      const any = s.selectors.some(child => matches(child, node));
      return s.kind === 'not' ? !any : any;
    }
    assert.fail(JSON.stringify(s));
  });
}
const sortRules = css.nodes.filter(rule => rule.type === 'rule' && rule.selector.includes('[data-slot="table-head"][aria-sort]'));
assert.equal(sortRules.length, 2);
const parsed = sortRules.map(rule => ({ ast: parse(rule.selector), declarations: declarations(rule) }));
const style = node => Object.assign({}, ...parsed.filter(rule => matches(rule.ast, node)).map(rule => rule.declarations));
const element = (attrs, parent, tag = 'div') => ({ attrs, parent, tag });
const controls = (parent, sorted = true) => {
  const head = element({ 'data-slot': 'table-head', ...(sorted ? { 'aria-sort': 'none' } : {}) }, parent, 'th');
  const button = element({ 'data-slot': 'button' }, head, 'button');
  return { head, button, icon: element({}, button, 'svg') };
};
// CSS font:inherit includes font-family, font-size and font-weight (plus line-height).
const typography = { font: 'inherit', 'letter-spacing': 'inherit', 'text-transform': 'inherit' };

test('P101 E1: sort selectors outrank the actual global button typography selector', () => {
  // Lightning CSS parses selectors; calculate CSS specificity from its AST.
  const compare = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
  function specificity(selector) {
    return selector.reduce((total, part) => {
      let value = [0, 0, 0];
      if (part.type === 'id') value = [1, 0, 0];
      else if (['class', 'attribute'].includes(part.type)) value = [0, 1, 0];
      else if (['type', 'pseudo-element'].includes(part.type)) value = [0, 0, 1];
      else if (part.type === 'pseudo-class') {
        if (['is', 'not', 'has'].includes(part.kind)) {
          value = part.selectors.map(specificity).sort(compare).at(-1);
        } else if (part.kind !== 'where') {
          assert.fail(`Unsupported specificity pseudo-class: ${part.kind}`);
        }
      } else assert.ok(['combinator', 'universal'].includes(part.type), part.type);
      return total.map((count, index) => count + value[index]);
    }, [0, 0, 0]);
  }
  const globalCss = postcss.parse(read('app/(next)/next/typography.css'));
  const globalRule = globalCss.nodes.find(rule => rule.type === 'rule'
    && rule.selector.includes('[data-slot="button"]')
    && declarations(rule)['font-weight'] === '500');
  assert.ok(globalRule, 'find the production unlayered button typography rule');
  const globalSelector = globalRule.selectors.find(selector => selector.includes('[data-slot="button"]'));
  const globalSpecificity = specificity(parse(globalSelector));
  assert.deepEqual(globalSpecificity, [0, 1, 0]);
  assert.equal(declarations(globalRule)['letter-spacing'], '0');
  for (const [index, rule] of parsed.entries()) {
    const actual = specificity(rule.ast);
    assert.deepEqual(actual, [0, 3, index]);
    assert.ok(compare(actual, globalSpecificity) > 0, 'sort override wins regardless of source order');
  }
});

for (const theme of ['blueprint', 'blueprint-night']) test(`P101 E1 ${theme}: sort typography inherits all five header properties; icons use em`, () => {
  const outer = element({ 'data-prism-theme': theme });
  const { head, button, icon } = controls(outer);
  assert.deepEqual(style(button), typography);
  assert.deepEqual(style(icon), { width: '1em', height: '1em' });
  assert.deepEqual(style(head), {});
  assert.deepEqual(style(controls(outer, false).button), {}, 'unrelated header buttons stay unchanged');
  assert.deepEqual(style(element({ 'data-slot': 'button' }, outer)), {}, 'body buttons stay unchanged');
  for (const core of ['light', 'paper', 'dark']) {
    const preview = element({ 'data-agent-preview': '', 'data-prism-theme': core }, outer);
    const local = controls(preview);
    assert.deepEqual(style(local.button), {});
    assert.deepEqual(style(local.icon), {});
    const rootControl = { ...button, attrs: { ...button.attrs, 'data-agent-preview': '', 'data-prism-theme': core } };
    assert.deepEqual(style(rootControl), {}, 'preview root itself is excluded');
  }
});
for (const theme of ['light', 'paper', 'dark']) test(`P101 E1 global ${theme}: no added sort styles; existing demo markup stays byte-identical`, () => {
  const { button, icon } = controls(element({ 'data-prism-theme': theme }));
  assert.deepEqual(style(button), {}); assert.deepEqual(style(icon), {});
  const html = render(h(api.MaterialTableParticle));
  assert.equal(createHash('sha256').update(html).digest('hex'), baseline.tableSha256);
  assert.match(html, /aria-sort="descending"/);
  assert.match(html, /lucide-arrow-down/);
  assert.match(html, /aria-sort="none"/);
  assert.match(html, /lucide-arrow-up-down/);
  assert.match(html, /<button[^>]*type="button"/);
});
test('P101 E1: native disabled button and existing sorting handler remain intact', () => {
  assert.match(render(h(api.Button, { variant: 'ghost', size: 'sm', disabled: true }, '评分')), /disabled=""/);
  const demo = read('components/prism-next/demos/table-particle.tsx');
  assert.match(demo, /onClick=\{header.column.getToggleSortingHandler\(\)\}/);
  assert.match(demo, /disabled=\{loadState === "loading"\}/);
  assert.match(demo, /<ArrowUp \/>/);
  for (const rule of sortRules) assert.doesNotMatch(rule.toString(), /pointer-events|outline|box-shadow|border-radius|opacity|background/);
});
for (const { props, html } of baseline.sheets) test(`P101 E2 ${props.title}: default and explicit edge preserve pre-P101 SSR bytes`, () => {
  assert.equal(render(h(api.BlueprintSheet, props, '正文')), html);
  assert.equal(render(h(api.BlueprintSheet, { ...props, narrowFrame: 'edge' }, '正文')), html);
  const keep = render(h(api.BlueprintSheet, { ...props, narrowFrame: 'keep' }, '正文'));
  assert.match(keep, /data-narrow-frame="keep"/);
  assert.equal(keep.replace(' data-narrow-frame="keep"', ''), html);
  assert.doesNotMatch(keep, /narrowFrame=/);
});
for (const [name, params, padding] of [['media', '(max-width:760px)', '36px 16px 28px'], ['container', 'blueprint-demo (max-width:760px)', '28px 16px']]) test(`P101 E2 ${name}: keep restores both borders without altering default padding or ruler hiding`, () => {
  const query = css.nodes.find(rule => rule.type === 'atrule' && rule.name === name && rule.params === params && rule.nodes.some(n => n.selector === '.bp-sheet'));
  assert.ok(query);
  const rules = query.nodes.filter(rule => rule.type === 'rule');
  assert.deepEqual(declarations(rules.find(rule => rule.selector === '.bp-sheet')), { 'border-left': '0', 'border-right': '0', padding });
  const keep = rules.find(rule => rule.selector === '.bp-sheet[data-narrow-frame="keep"]');
  assert.ok(keep);
  assert.deepEqual(declarations(keep), { 'border-left': 'var(--line-width) solid var(--line)', 'border-right': 'var(--line-width) solid var(--line)' });
  assert.deepEqual(declarations(rules.find(rule => rule.selector === '.bp-sheet::before,.bp-ruler')), { display: 'none' });
});
test('P101 E2: foundation demo exposes a reachable keep sheet and retains default sheets', () => {
  const html = render(h(api.BlueprintComponentsDemo));
  assert.match(html, /href="#narrow-frame"/);
  assert.match(html, /<section[^>]*id="narrow-frame"[^>]*data-narrow-frame="keep"/);
  assert.match(html, /窄屏保留图纸外框/);
  assert.ok((html.match(/data-slot="bp-sheet"/g) ?? []).length > 1);
  assert.equal((html.match(/data-narrow-frame="keep"/g) ?? []).length, 1);
});
