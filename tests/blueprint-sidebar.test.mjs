import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import postcss from 'postcss';
import { transform } from 'lightningcss';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createTestRuntime } from './helpers/test-runtime.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const fullCss = read('app/(next)/next/blueprint.css');
const block = fullCss.match(/\/\* P80 sidebar directory:[\s\S]*?\/\* End P80 sidebar directory\. \*\//)[0];
const previous = fullCss.match(/\/\* P76 shell navigation:[\s\S]*?\/\* End P76 shell navigation\. \*\//)[0];
const family = ':is([data-prism-theme="blueprint"],[data-prism-theme="blueprint-night"])';
const guard = `:not(:where([data-agent-preview][data-prism-theme]:not(${family}), [data-agent-preview][data-prism-theme]:not(${family}) *))`;
const themes = ['blueprint', 'blueprint-night'], core = ['light', 'paper', 'dark'];
const runtime = await createTestRuntime('p80-sidebar');
let serial = 0;
async function load(contents, resolveDir = root) {
  const bundle = await build({ stdin: { contents, resolveDir, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false });
  const file = new URL(`fixture-${serial++}.mjs`, runtime); writeFileSync(file, bundle.outputFiles[0].text); return import(file);
}
const api = await load("export { BlueprintSidebarDemo } from './components/prism-next/demos/blueprint-sidebar'; export { BpSegTabs } from './components/prism-next/blueprint/blueprint'");
const h = React.createElement;
const markup = collapsed => renderToStaticMarkup(h(api.BlueprintSidebarDemo, { initiallyCollapsed: collapsed }));
// SSR + parsed CSS specificity probes only: not a browser or computedStyle.
const node = (parent, attrs = {}, name = 'div') => {
  const n = { name, attrs, classes: (attrs.class ?? '').split(/\s+/), states: [], parent, children: [] };
  parent?.children.push(n); return n;
};
function tree(html, parent) {
  const nodes = [], stack = [parent];
  for (const tag of html.matchAll(/<\/?[a-zA-Z][^>]*>/g)) {
    if (tag[0].startsWith('</')) { stack.pop(); continue; }
    const name = tag[0].match(/^<([\w-]+)/)[1];
    const attrs = Object.fromEntries([...tag[0].matchAll(/([\w:-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
    const n = node(stack.at(-1), attrs, name); nodes.push(n);
    if (!['input', 'img', 'br', 'hr', 'link', 'meta', 'source', 'wbr'].includes(name) && !tag[0].endsWith('/>')) stack.push(n);
  }
  return nodes;
}
const cache = new Map();
function parse(s) {
  if (cache.has(s)) return cache.get(s);
  let result;
  transform({ code: Buffer.from(`${s}{color:red}`), visitor: { Selector(ast) { result = ast; } } });
  assert.ok(result); cache.set(s, result); return result;
}
function matches(s, n, pseudo) {
  if (!n) return false;
  const split = s.findLastIndex(p => p.type === 'combinator');
  if (split >= 0) {
    if (!matches(s.slice(split + 1), n, pseudo)) return false;
    if (s[split].value === 'child') return matches(s.slice(0, split), n.parent);
    if (s[split].value === 'next-sibling') return matches(s.slice(0, split), n.parent?.children[n.parent.children.indexOf(n) - 1]);
    assert.equal(s[split].value, 'descendant');
    for (let p = n.parent; p; p = p.parent) if (matches(s.slice(0, split), p)) return true;
    return false;
  }
  if (pseudo && !s.some(p => p.type === 'pseudo-element')) return false;
  return s.every(p => {
    if (p.type === 'universal') return true;
    if (p.type === 'type') return p.name === n.name;
    if (p.type === 'class') return n.classes.includes(p.name);
    if (p.type === 'attribute') {
      if (!p.operation) return Object.hasOwn(n.attrs, p.name);
      assert.equal(p.operation.operator, 'equal'); return n.attrs[p.name] === p.operation.value;
    }
    if (p.type === 'pseudo-element') return p.kind === pseudo;
    if (p.type === 'pseudo-class') {
      if (['hover', 'focus-visible', 'focus-within', 'active'].includes(p.kind)) return n.states.includes(p.kind);
      if (p.kind === 'last-child') return n.parent?.children.at(-1) === n;
      if (p.kind === 'disabled') return Object.hasOwn(n.attrs, 'disabled');
      assert.ok(['is', 'where', 'not'].includes(p.kind), p.kind);
      const any = p.selectors.some(c => matches(c, n)); return p.kind === 'not' ? !any : any;
    }
    assert.fail(JSON.stringify(p));
  });
}
function specificity(s) {
  return s.reduce((sum, p) => sum + (p.type === 'id' ? 10000 : ['class','attribute'].includes(p.type) ? 100 : ['type','pseudo-element'].includes(p.type) ? 1 : p.type === 'pseudo-class' ? p.kind === 'where' ? 0 : p.selectors ? Math.max(...p.selectors.map(specificity)) : 100 : 0), 0);
}
function rules(source) {
  const result = [];
  postcss.parse(source).walkRules(r => {
    // Exclude the unrelated page-head and reduced-motion subtree selectors.
    if (r.selector.includes(':root') || r.selector.includes('prism-page-head') || r.parent.params === '(prefers-reduced-motion:reduce)') return;
    result.push({ selectors: r.selectors.map(parse), declarations: r.nodes.filter(d => d.type === 'decl'), layer: r.parent.name === 'layer', condition: r.parent.name === 'container' ? r.parent.params : undefined });
  });
  return result;
}
function style(n, source = block, pseudo, width = 1280) {
  const result = {}, ranks = {};
  for (const r of rules(source)) {
    if (r.condition && width >= Number(r.condition.match(/< (\d+)/)[1])) continue;
    const matching = r.selectors.filter(s => matches(s, n, pseudo));
    if (!matching.length) continue;
    const score = Math.max(...matching.map(specificity));
    for (const d of r.declarations) {
      const rank = (d.important ? 1e8 + (r.layer ? 1e7 : 0) : r.layer ? 0 : 1e6) + score;
      if (ranks[d.prop] === undefined || rank >= ranks[d.prop]) { result[d.prop] = d.value; ranks[d.prop] = rank; }
    }
  }
  return result;
}
function fixture(theme, collapsed = false, outer) {
  const parent = node(outer ? node(null, { 'data-prism-theme': outer }) : null, { 'data-prism-theme': theme, ...(outer ? { 'data-agent-preview': '' } : {}) });
  const nodes = tree(markup(collapsed), parent);
  return { parent, nodes, cls: c => nodes.find(n => n.classes.includes(c)), slot: s => nodes.find(n => n.attrs['data-slot'] === s), items: nodes.filter(n => n.attrs['data-slot'] === 'sidebar-menu-button') };
}
function visuals(source = block) {
  for (const theme of themes) {
    const f = fixture(theme), css = previous + source;
    assert.equal(style(f.cls('bp-sidebar-header'), css)['border-bottom'], 'var(--line-width) solid var(--line)');
    const meta = style(f.cls('bp-sidebar-meta'), css);
    assert.equal(meta['font-family'], '"Geist Mono Blueprint",var(--font-mono)');
    assert.equal(meta['font-size'], 'var(--text-ui-meta)'); assert.equal(meta.color, 'var(--muted-foreground)');
    assert.equal(style(f.cls('bp-sidebar-segments'), css).width, '100%');
    const radio = f.nodes.find(n => n.attrs['aria-checked'] === 'true');
    for (const states of [[], ['hover']]) { radio.states = states; const s = style(radio, css); assert.equal(s.background, 'var(--primary)'); assert.equal(s.color, 'var(--primary-foreground)'); assert.equal(s.flex, '1 1 0'); }
    const label = style(f.slot('sidebar-group-label'), css);
    assert.equal(label.color, 'var(--link)'); assert.equal(label['font-size'], 'var(--text-ui-meta)'); assert.equal(label['letter-spacing'], '0'); assert.equal(label['text-transform'], 'none');
    const primary = f.items[0];
    for (const states of [[], ['hover'], ['focus-visible']]) { primary.states = states; const s = style(primary, css); assert.equal(s.width, '100%'); assert.equal(s.background, 'var(--primary)'); assert.equal(s.color, 'var(--primary-foreground)'); assert.equal(s['box-shadow'], '2px 2px 0 var(--link)'); }
    primary.states = ['active']; assert.equal(style(primary, css)['box-shadow'], 'none'); assert.equal(style(primary, css).transform, 'translate(2px,2px)');
    primary.attrs.disabled = ''; assert.equal(style(primary, css)['box-shadow'], 'none'); assert.equal(style(primary, css).transform, undefined); assert.equal(style(primary, css).color, 'var(--disabled-foreground)');
    for (const row of f.items.slice(1)) {
      assert.equal(style(row, css)['border-radius'], '0'); assert.equal(style(row, css).height, undefined);
      const separator = style(row.parent, css)['border-bottom'];
      assert.equal(separator, row.parent.parent.children.at(-1) === row.parent ? undefined : '1px solid var(--border)');
      row.states = ['hover', 'focus-visible'];
      assert.equal(style(row, css).background, row.attrs['data-active'] === 'true' ? 'var(--accent)' : 'var(--secondary)');
      if (row.attrs['data-active'] === 'true') assert.equal(style(row, css)['box-shadow'], 'inset 2px 0 0 var(--foreground)');
    }
    assert.equal(style(f.slot('sidebar-menu-action'), source).opacity, undefined);
    const rail = fixture(theme, true);
    assert.equal(style(rail.slot('sidebar-group'), css)['padding-inline'], '0');
    assert.equal(style(rail.slot('sidebar-menu'), css).width, '40px');
    assert.equal(style(rail.slot('sidebar-menu'), css)['margin-inline'], 'auto');
    for (const row of rail.items) {
      const s = style(row, css); assert.equal(s.width, '40px'); assert.equal(s.height, '40px'); assert.equal(s['border-radius'], '0'); assert.equal(s.border, '1px solid var(--border)'); assert.equal(style(row.parent, css)['border-bottom'], '0');
    }
    for (const states of [[], ['hover'], ['active'], ['focus-visible'], ['active', 'focus-visible']]) { rail.items[0].states = states; const s = style(rail.items[0], css); assert.equal(s['box-shadow'], 'none'); assert.equal(s.transform, 'none'); assert.equal(s.background, 'var(--primary)'); }
  }
}
function isolation(source = block) {
  for (const theme of core) for (const outer of [undefined, ...themes]) for (const collapsed of [true, false]) {
    const f = fixture(theme, collapsed, outer);
    for (const n of f.nodes) for (const states of [[], ['hover'], ['active'], ['focus-visible']]) {
      n.states = states;
      for (const pseudo of [undefined, 'before', 'after']) assert.deepEqual(style(n, source, pseudo), {});
      const rootTarget = { ...n, attrs: { ...n.attrs, ...f.parent.attrs }, parent: f.parent.parent };
      for (const pseudo of [undefined, 'before', 'after']) assert.deepEqual(style(rootTarget, source, pseudo), {});
    }
  }
}
function radioContract(a = api) {
  let value = 'recent', focus = -1, prevented = 0, captured;
  const items = [{ value: 'recent', label: '近期' }, { value: 'archived', label: '已归档' }];
  function capture() {
    function Capture() { captured = a.BpSegTabs({ items, value, label: '对话范围', onValueChange: v => { value = v; }, className: 'bp-sidebar-segments' }); return captured; }
    const html = renderToStaticMarkup(h(Capture));
    assert.match(html, /role="radiogroup"/); assert.doesNotMatch(html, /role="tab(?:list|panel)?"/);
    assert.equal((html.match(/role="radio"/g) ?? []).length, 2);
    assert.equal((html.match(/aria-checked="true"/g) ?? []).length, 1);
    assert.equal((html.match(/tabindex="0"/g) ?? []).length, 1);
    const buttons = captured.props.children;
    buttons.forEach((b, i) => b.props.ref({ focus() { focus = i; } }));
    return buttons;
  }
  let buttons = capture();
  for (const [key, expected] of [['ArrowRight',1],['ArrowRight',0],['ArrowLeft',1],['Home',0],['End',1],['ArrowUp',0],['ArrowDown',1]]) {
    const index = items.findIndex(item => item.value === value);
    buttons[index].props.onKeyDown({ key, preventDefault() { prevented++; } });
    assert.equal(value, items[expected].value); assert.equal(focus, expected);
    buttons = capture(); assert.equal(buttons[expected].props.tabIndex, 0);
  }
  assert.equal(prevented, 7);
  buttons[0].props.onClick(); assert.equal(value, 'recent'); capture();
}

test('P80: actual coss directory SSR has count, named controls, real radio semantics and rail', () => {
  const html = markup(false), rail = markup(true);
  assert.match(html, />3 条<\/span>/); assert.match(html, />置顶</); assert.match(html, />近期</);
  assert.equal((html.match(/class="[^"]*bp-sidebar-primary/g) ?? []).length, 1);
  assert.match(html, /aria-label="更多：/); assert.match(html, /aria-expanded="true"/);
  assert.match(rail, /data-collapsible="icon"/); assert.match(rail, /aria-label="展开对话目录"/);
  assert.doesNotMatch(rail, /role="radio|更多：|bp-sidebar-meta/);
  assert.doesNotMatch(html, /bp-ruler|SHEET|bp-section-code/);
});
test('P80: two Blueprint themes resolve header, primary/pressed/disabled, radio, ledger and rail', () => visuals());
test('P80: core themes and nested preview roots, descendants and pseudo-elements receive zero delta', () => isolation());
test('P80: actual BpSegTabs handlers move focus, wrap, select and keep one tab stop', () => radioContract());
test('P80: stylesheet rollback mutations are rejected by independent expectations', () => {
  const mutations = [
    ['header line', s => s.replace('border-bottom:var(--line-width) solid var(--line)', 'border-bottom:0')],
    ['meta font', s => s.replace('"Geist Mono Blueprint",var(--font-mono)', 'var(--font-sans)')],
    ['meta size', s => s.replace('font-size:var(--text-ui-meta)', 'font-size:var(--text-ui-body)')],
    ['group blue', s => s.replace('color:var(--link)', 'color:var(--muted-foreground)')],
    ['separator', s => s.replace('border-bottom:1px solid var(--border)', 'border-bottom:0')],
    ['last row', s => s.replace(':not(:last-child)', '')],
    ['segment width', s => s.replace('.bp-sidebar-segments' + guard + ' { width:100%', '.bp-sidebar-segments' + guard + ' { width:fit-content')],
    ['selected segment', s => s.replace('background:var(--primary); color:var(--primary-foreground)', 'background:var(--secondary); color:var(--foreground)')],
    ['primary shadow', s => s.replace('box-shadow:2px 2px 0 var(--link)', 'box-shadow:none')],
    ['pressed return', s => s.replace('transform:translate(2px,2px); box-shadow:none', 'transform:none; box-shadow:2px 2px 0 var(--link)')],
    ['rail outline', s => s.replace('border:1px solid var(--border); border-radius:0', 'border:0; border-radius:8px')],
    ['rail shadow', s => s.replaceAll('box-shadow:none; transform:none', 'box-shadow:2px 2px 0 var(--link); transform:none')],
  ];
  for (const [name, change] of mutations) { const mutated = change(block); assert.notEqual(mutated, block, name); assert.throws(() => visuals(mutated), undefined, name); }
  for (const [name, change] of [['unscoped', s => s.replaceAll(family + ' ', '')], ['nested guard', s => s.replaceAll(guard, '')]]) assert.throws(() => isolation(change(block)), undefined, name);
  if (process.env.P80_WRITE_EVIDENCE) writeFileSync(new URL('../docs/blueprint/evidence/sidebar-20261016/mutations.json', import.meta.url), JSON.stringify({ cssDetected: [...mutations.map(([name]) => name), 'unscoped', 'nested guard'] }, null, 2) + '\n');
});
test('P80: semantic and arrow-handler rollback mutations are rejected', async () => {
  const source = read('components/prism-next/blueprint/blueprint.tsx');
  for (const [before, after] of [['role="radiogroup"','role="tablist"'], ['refs.current[next]?.focus()', 'void 0'], ['onValueChange(items[next].value)', 'onValueChange(items[index].value)']]) {
    assert.ok(source.includes(before)); const mutant = await load(source.replace(before, after), root + 'components/prism-next/blueprint');
    assert.throws(() => radioContract(mutant));
  }
});
