import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import postcss from 'postcss';
import { transform } from 'lightningcss';
import { compile } from 'tailwindcss';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createTestRuntime } from './helpers/test-runtime.mjs';
import { relativeLuminance } from '../lib/prism-next/chart-color.ts';

const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const root = fileURLToPath(new URL('../', import.meta.url));
const css = read('app/(next)/next/blueprint.css');
const appCss = read('components/prism-next/app-bar.css');
const themeCss = read('app/(next)/next/theme.css');
const block = css.match(/\/\* P76 shell navigation:[\s\S]*?\/\* End P76 shell navigation\. \*\//)[0];
const family = ':is([data-prism-theme="blueprint"],[data-prism-theme="blueprint-night"])';
const guard = `:not(:where([data-agent-preview][data-prism-theme]:not(${family}), [data-agent-preview][data-prism-theme]:not(${family}) *))`;
const themes = ['blueprint', 'blueprint-night'];
const core = ['light', 'paper', 'dark'];
const runtime = await createTestRuntime('p76-shell-nav');
const bundle = await build({ stdin: { contents: `export * from './components/prism-next/app-bar'; export * from './components/coss/sidebar'; export { ShellNavFixture } from './docs/blueprint/evidence/shell-nav-20261016/fixture';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', loader: { '.css': 'empty' }, alias: { '@': root }, write: false });
const file = new URL('fixture.mjs', runtime);
writeFileSync(file, bundle.outputFiles[0].text);
const api = await import(file);
const h = React.createElement;
const utilityCompiler = await compile('@theme {--spacing:0.25rem;} @layer utilities { @tailwind utilities; }');
const upstream = transform({ code: Buffer.from(utilityCompiler.build(['group-data-[collapsible=icon]:size-8!'])), targets: { chrome: 90 << 16 } }).code.toString();
const markup = collapsed => renderToStaticMarkup(h('div', null,
  h(api.AppBar, { identity: h(api.AppBarIdentity, { institution: '长中文实验学校', href: '/agent' }), navigation: h(api.AppBarNavigation, { compact: h(api.AppBarSpaceMenu, { currentId: 'agent', items: [{ id: 'agent', label: 'Agent' }] }) }, h(api.AppBarNavLink, { href: '/agent', 'aria-current': 'page' }, 'Agent'), h(api.AppBarNavLink, { href: '/papers' }, '组卷')), tools: h(api.BarIconButton, { label: '通知', count: 6 }, h('svg')) }),
  h(api.SpaceBar, { side: { title: '对话目录', collapsed, onToggle() {} }, tools: h(api.BarIconButton, { label: '更多', size: 'space' }, h('svg')) }, '当前对话'),
  h(api.SidebarProvider, { defaultOpen: !collapsed }, h(api.Sidebar, { collapsible: 'icon' }, h(api.SidebarGroup, null, h(api.SidebarGroupLabel, null, '最近对话'), h(api.SidebarMenu, null, ...[true, false].map((active, i) => h(api.SidebarMenuItem, { key: i }, h(api.SidebarMenuButton, { isActive: active }, h('svg'), h('span', null, active ? '函数复习' : '待复核'))))))))));

// Actual SSR + parsed selectors / specificity / layer probes. These do not run
// layout, render pseudo-elements, emulate a browser, or claim computedStyle.
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
function fixture(t, collapsed = false, outer) {
  const parent = node(outer ? node(null, { 'data-prism-theme': outer }) : null, { 'data-prism-theme': t, ...(outer ? { 'data-agent-preview': '' } : {}) });
  const nodes = tree(markup(collapsed), parent);
  const cls = c => nodes.find(n => n.classes.includes(c));
  const slot = s => nodes.find(n => n.attrs['data-slot'] === s);
  return { parent, nodes, cls, slot, nav: nodes.filter(n => n.classes.includes('prism-app-bar-nav-link')), items: nodes.filter(n => n.attrs['data-slot'] === 'sidebar-menu-button') };
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
      if (p.kind === 'nth-child') return false; // brand colours are preserved, not evaluated by this probe.
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
function top(source = block) {
  for (const t of themes) for (const width of [1280, 320]) {
    const f = fixture(t);
    // Test both import orders: AppBar's component stylesheet can be loaded later.
    for (const combined of [appCss + source, source + appCss]) {
      for (const name of ['prism-app-bar','prism-space-bar']) {
        const s = style(f.cls(name), combined, undefined, width);
        assert.equal(s.background, 'var(--card)'); assert.equal(s['border-bottom'], 'var(--line-width) solid var(--line)');
        assert.equal(s.height, name === 'prism-app-bar' ? '56px' : '48px');
      }
      for (const [i, n] of f.nav.entries()) {
        assert.equal(style(n, combined).color, i === 0 ? 'var(--foreground)' : 'var(--muted-foreground)');
        n.states = ['hover'];
        assert.equal(style(n, combined, 'before')['border-radius'], '0');
        assert.equal(style(n, combined, 'before').background, 'var(--accent)');
      }
      assert.equal(style(f.nav[0], combined)['box-shadow'], 'inset 0 -2px 0 var(--foreground)');
      for (const c of ['prism-app-bar-identity','prism-bar-icon-button','prism-app-bar-space-trigger']) assert.equal(style(f.cls(c), combined, undefined, width)['border-radius'], '0');
      const trigger = style(f.cls('prism-app-bar-space-trigger'), combined);
      assert.equal(trigger.background, 'var(--card)'); assert.equal(trigger.border, '1px solid var(--border)');
    }
  }
}
function sidebar(source = block) {
  for (const t of themes) for (const collapsed of [false, true]) {
    const f = fixture(t, collapsed);
    for (const s of ['sidebar', 'sidebar-inner']) assert.equal(style(f.slot(s), source).background, 'var(--card)');
    assert.equal(style(f.slot('sidebar-container'), source)['border-right'], 'var(--line-width) solid var(--line)');
    assert.equal(style(f.slot('sidebar-group-label'), source).color, 'var(--muted-foreground)');
    for (const hover of [false,true]) {
      f.items.forEach(n => n.states = hover ? ['hover'] : []);
      const active = style(f.items[0], source);
      assert.equal(active.background, 'var(--accent)'); assert.equal(active.color, 'var(--foreground)');
      assert.equal(active['box-shadow'], 'inset 2px 0 0 var(--foreground)');
      if (hover) assert.equal(style(f.items[1], source).background, 'var(--secondary)');
    }
  }
}
function rail(source = block) {
  for (const t of themes) {
    const f = fixture(t, true);
    for (const slot of ['sidebar-gap','sidebar-container']) assert.equal(style(f.slot(slot), source).width, '56px');
    assert.ok(f.items[0].classes.includes('group-data-[collapsible=icon]:size-8!'));
    // Compile the exact frozen coss class with the installed Tailwind version.
    for (const combined of [upstream + source, source + upstream]) for (const item of f.items) {
      assert.equal(style(item, combined).width, '40px'); assert.equal(style(item, combined).height, '40px');
      assert.equal(style(item, source)['border-radius'] ?? '0', '0');
    }
    assert.equal(style(fixture(t).items[0], source).width, undefined);
  }
}
function isolation(source = block) {
  for (const t of core) for (const outer of [undefined, ...themes]) {
    const f = fixture(t, true, outer);
    for (const n of f.nodes) for (const states of [[], ['hover'], ['focus-visible'], ['hover','focus-visible']]) {
      n.states = states;
      for (const pseudo of [undefined, 'before', 'after']) assert.deepEqual(style(n, source, pseudo), {}, `${outer}/${t}/${n.attrs.class}/${pseudo}`);
      // The preview root itself must also be excluded, even with target hooks.
      const targetRoot = { ...n, attrs: { ...n.attrs, ...f.parent.attrs }, parent: f.parent.parent };
      for (const pseudo of [undefined, 'before', 'after']) assert.deepEqual(style(targetRoot, source, pseudo), {});
    }
  }
}
function focus(source = block) {
  for (const t of themes) {
    const f = fixture(t);
    for (const n of [...f.nav,...f.items,f.cls('prism-bar-icon-button'),f.cls('prism-app-bar-space-trigger')]) {
      n.states = ['hover','focus-visible'];
      const s = style(n, appCss + source);
      assert.equal(s.outline, '2px solid var(--ring)');
      assert.equal(s['box-shadow'], n === f.nav[0] ? 'inset 0 -2px 0 var(--foreground)' : n === f.items[0] ? 'inset 2px 0 0 var(--foreground)' : 'none');
    }
    assert.equal(style(f.nav[0], appCss + source, 'before').outline, 'none');
    assert.equal(style(f.nav[0], appCss + source)['outline-offset'], '-4px');
  }
}

test('P76: both Blueprint AppBar/SpaceBar surfaces, selected underline, hover and square controls survive stylesheet order', () => top());
test('P76: actual coss Sidebar surfaces, active accent/ink and weaker hover resolve in both themes', () => sidebar());
test('P76: collapsed 56px rail has 40px buttons despite frozen important utility; expanded geometry is untouched', () => rail());
test('P76: one focus outline keeps independent active indicators and suppresses the old nav pseudo outline', () => focus());
test('P76: core themes and nested core preview roots/descendants/pseudo-elements receive zero added declarations', () => isolation());
test('P76: portaled personal/space menu hooks are square and current rows use accent', () => {
  for (const t of themes) for (const kind of ['space','personal']) {
    const parent = node(null, { 'data-prism-theme': t });
    const popup = node(parent, { class: `prism-app-bar-${kind}-popup` });
    const item = node(popup, { class: kind === 'space' ? 'prism-app-bar-space-item' : '', 'data-slot': 'menu-link-item', 'aria-current': 'page' });
    assert.equal(style(popup)['border-radius'], '0');
    assert.equal(style(item)['border-radius'], '0'); assert.equal(style(item).background, 'var(--accent)');
  }
});
test('P76: all new selectors guard their final target; badges, Tabs, Toggle, tokens and typography are untouched', () => {
  postcss.parse(block).walkRules(r => {
    for (const s of r.selectors) assert.ok(s.endsWith(guard) || s.endsWith(guard + '::before'), s);
    for (const d of r.nodes.filter(d => d.type === 'decl')) assert.ok(!/^(font|line-height)/.test(d.prop), d.prop);
  });
  for (const t of themes) {
    const f = fixture(t);
    assert.deepEqual(style(f.cls('prism-icon-count-badge')), {});
    for (const slot of ['tabs-tab','toggle']) assert.deepEqual(style(node(f.parent, { 'data-slot': slot, 'data-active': '', 'data-pressed': '' })), {});
  }
  assert.ok(!css.includes('[data-slot="sidebar-menu-button"][data-active="true"],[data-slot="tabs-tab"]'));
  assert.match(css, /:is\(\[data-slot="tabs-tab"\]\[data-active\],\[data-slot="toggle"\]\[data-pressed\]\)[^{]*\{ background:var\(--primary\); color:var\(--primary-foreground\); \}/);
  assert.match(read('components/coss/sidebar.tsx'), /group-data-\[collapsible=icon\]:size-8!/);
});
test('P76: actual foreground/accent tokens meet selected text 4.5 and indicator 3 in both themes', t => {
  for (const name of themes) {
    const tokens = Object.fromEntries([...themeCss.split(`:where([data-agent-preview])[data-prism-theme="${name}"] {`)[1].split('}')[0].matchAll(/(--[\w-]+):([^;]+);/g)].map(m => [m[1],m[2]]));
    const a = relativeLuminance(tokens['--foreground']), b = relativeLuminance(tokens['--accent']);
    const ratio = (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
    assert.ok(ratio >= 4.5); assert.ok(ratio >= 3);
    t.diagnostic(`${name} selected text and left ink / accent: ${ratio.toFixed(6)}:1`);
  }
});
test('P76: rollback, wrong tokens, focus duplication, rail-important and isolation mutations are detected', () => {
  const cases = [
    ['whole rollback', () => '', top],
    ['card rollback', s => s.replace('background:var(--card); border-bottom', 'background:var(--background); border-bottom'), top],
    ['border rollback', s => s.replace('border-bottom:var(--line-width) solid var(--line)', 'border-bottom:1px solid var(--border)'), top],
    ['nav primary rollback', s => s.replaceAll('inset 0 -2px 0 var(--foreground)', 'inset 0 -2px 0 var(--primary)'), top],
    ['hover rollback', s => s.replaceAll('background:var(--accent); }', 'background:var(--secondary); }'), top],
    ['square rollback', s => s.replaceAll('border-radius:0;', 'border-radius:8px;'), top],
    ['ink background rollback', s => s.replaceAll('background:var(--accent); color:var(--foreground); border-radius', 'background:var(--primary); color:var(--primary-foreground); border-radius'), sidebar],
    ['left line rollback', s => s.replaceAll('inset 2px 0 0 var(--foreground)', 'none'), sidebar],
    ['rail width rollback', s => s.replace('width:56px;', 'width:48px;'), rail],
    ['rail 32 rollback', s => s.replaceAll('40px !important', '32px !important'), rail],
    ['rail important removed', s => s.replaceAll(' !important', ''), rail],
    ['rail layer removed', s => s.replace('@layer utilities {', '@layerless {'), rail],
    ['focus double ring', s => s.replace('outline:none; box-shadow:none;', 'outline:2px solid var(--ring); box-shadow:none;'), focus],
    ['guard removal', s => s.replaceAll(guard, ''), isolation],
    ['family removal', s => s.replaceAll(family + ' ', ''), isolation],
  ];
  for (const [name, mutate, check] of cases) {
    const changed = mutate(block); assert.notEqual(changed, block, name);
    assert.throws(() => check(changed), undefined, name);
  }
});

test('P76: review fixture bundles and SSR retains real shell, menu triggers and current conversation', () => {
  const html = renderToStaticMarkup(h(api.ShellNavFixture));
  for (const text of ['data-agent-preview', 'prism-app-bar', 'prism-space-bar', 'sidebar-menu-button', 'data-active="true"', '通知，6', '更多：']) assert.ok(html.includes(text), text);
});
