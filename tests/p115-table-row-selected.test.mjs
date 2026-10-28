import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import postcss from 'postcss';
import { transform } from 'lightningcss';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const path = 'app/(next)/next/blueprint.css';
const css = read(path).replace(/\n\/\* P118 ·[\s\S]*$/, ''), marker = '\n/* P115 ·', index = css.indexOf(marker);
const block = css.slice(index), ast = postcss.parse(block);
const themes = ['light', 'paper', 'dark', 'blueprint', 'blueprint-night'];
const before = path => execFileSync('git', ['show', `c0e5da5:${path}`], { encoding: 'utf8' });

test('P115 preserves every previous CSS byte, theme tokens, coss and existing demos', () => {
  assert.ok(index > 0);
  assert.equal(css.slice(0, index), before(path));
  for (const file of ['app/(next)/next/theme.css', 'components/coss/table.tsx', 'components/prism-next/demos/table-particle.tsx', 'components/prism-next/data-display.tsx']) {
    if (file.startsWith('components/prism-next/')) {
      // P121 intentionally migrates these fields. Pin the complete new sources rather than dropping the old freeze.
      const expected = JSON.parse(read('tests/fixtures/p121-field-ssr.json')).sourceSha256[file];
      assert.equal(createHash('sha256').update(read(file)).digest('hex'), expected, file);
    } else assert.equal(read(file), before(file));
  }
});

test('P115 exact paint-only whitelist; unlayered selection overrides layered coss hover', () => {
  assert.deepEqual(ast.nodes.map(n => n.type), ['comment', 'rule', 'rule']);
  const rules = ast.nodes.filter(n => n.type === 'rule');
  const scope = ':is([data-prism-theme="blueprint"],[data-prism-theme="blueprint-night"])';
  const guard = `:not(:where([data-agent-preview][data-prism-theme]:not(${scope}), [data-agent-preview][data-prism-theme]:not(${scope}) *))`;
  assert.deepEqual(rules.map(r => r.selector), [
    `${scope} [data-slot="table-row"][data-state="selected"]:not(:where([data-variant="card"] *))${guard}`,
    `${scope} [data-variant="card"] [data-slot="table-body"] > [data-slot="table-row"][data-state="selected"] > td${guard}`,
  ]);
  for (const rule of rules) assert.deepEqual(rule.nodes.map(d => [d.type, d.prop, d.value, !!d.important]), [['decl', 'background-color', 'var(--accent)', false]]);
  assert.doesNotThrow(() => transform({ code: Buffer.from(block), minify: true }));
});

// Selector AST evaluation is static evidence, not computed browser paint.
function node(attrs = {}, parent, tag = 'div') { return { attrs, parent, tag }; }
function parse(selector) { let value; transform({ code: Buffer.from(`${selector}{color:red}`), visitor: { Selector(s) { value = s; } } }); return value; }
function matches(s, n) {
  if (!n) return false;
  const split = s.findLastIndex(p => p.type === 'combinator');
  if (split >= 0) {
    if (!matches(s.slice(split + 1), n)) return false;
    if (s[split].value === 'child') return matches(s.slice(0, split), n.parent);
    assert.equal(s[split].value, 'descendant');
    for (let p = n.parent; p; p = p.parent) if (matches(s.slice(0, split), p)) return true;
    return false;
  }
  return s.every(p => {
    if (p.type === 'universal') return true;
    if (p.type === 'type') return p.name === n.tag;
    if (p.type === 'attribute') return p.operation ? n.attrs[p.name] === p.operation.value : Object.hasOwn(n.attrs, p.name);
    if (p.type === 'pseudo-class' && ['is', 'where', 'not'].includes(p.kind)) {
      const any = p.selectors.some(s => matches(s, n)); return p.kind === 'not' ? !any : any;
    }
    assert.fail(`Unsupported selector ${JSON.stringify(p)}`);
  });
}
const selectors = ast.nodes.filter(n => n.type === 'rule').map(r => parse(r.selector));
const paints = n => selectors.some(s => matches(s, n));
for (const theme of themes) test(`P115 ${theme}: default/card selected and nested preview isolation`, () => {
  for (const outer of [undefined, ...themes]) {
    const root = node({ 'data-prism-theme': theme, 'data-agent-preview': '' }, outer ? node({ 'data-prism-theme': outer }) : undefined);
    for (const variant of ['default', 'card']) for (const selected of [false, true]) {
      const table = node({ 'data-variant': variant }, root);
      const body = node({ 'data-slot': 'table-body' }, table, 'tbody');
      const row = node({ 'data-slot': 'table-row', ...(selected ? { 'data-state': 'selected' } : {}) }, body, 'tr');
      const expected = theme.startsWith('blueprint') && selected;
      assert.equal(paints(row), expected && variant === 'default', `${outer}/${theme}/${variant}/row`);
      assert.equal(paints(node({}, row, 'td')), expected && variant === 'card', `${outer}/${theme}/${variant}/cell`);
      assert.equal(paints(node({}, row, 'th')), false, 'card applies only to original coss td targets');
      for (const core of themes.slice(0, 3)) {
        const boundary = { 'data-agent-preview': '', 'data-prism-theme': core };
        assert.equal(paints(node({ ...row.attrs, ...boundary }, body, 'tr')), false, 'preview root');
        assert.equal(paints(node(boundary, row, 'td')), false, 'cell preview root');
        assert.equal(paints(node(row.attrs, node(boundary, body), 'tr')), false, 'preview descendant');
      }
    }
  }
});

test('P115 existing blueprints resolve accent locally and table demo has controlled selection', () => {
  const accents = {};
  postcss.parse(read('app/(next)/next/theme.css')).walkRules(rule => {
    for (const theme of themes.slice(3)) if (rule.selector.includes(`[data-prism-theme="${theme}"]`)) {
      const decl = rule.nodes.find(d => d.prop === '--accent'); if (decl) accents[theme] = decl.value;
    }
  });
  assert.deepEqual(accents, { blueprint: '#E4ECF8', 'blueprint-night': '#16305A' });
  const demo = read('components/prism-next/demos/table-particle.tsx');
  assert.match(demo, /data-state=\{row.getIsSelected\(\) \? "selected" : undefined\}/);
  assert.match(demo, /row\.toggleSelected\(!!value\)/);
  assert.match(demo, /variant="card"/);
});
