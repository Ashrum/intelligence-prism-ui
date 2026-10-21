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
import { relativeLuminance } from '../lib/prism-next/chart-color.ts';
import { components } from '../lib/prism-next/catalog.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const source = read('components/prism-next/blueprint/blueprint.tsx');
const css = read('app/(next)/next/blueprint.css').match(/\/\* P79 cards:[\s\S]*?\/\* End P79 cards\. \*\//)[0];
const theme = read('app/(next)/next/theme.css');
const themes = ['light', 'paper', 'dark', 'blueprint', 'blueprint-night'];
const runtime = await createTestRuntime('p79-cards');
let serial = 0;
async function load(contents = source) {
  const result = await build({ stdin: { contents, resolveDir: root + 'components/prism-next/blueprint', loader: 'tsx' }, bundle: true,
    jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false });
  const file = new URL(`cards-${serial++}.mjs`, runtime);
  writeFileSync(file, result.outputFiles[0].text); return import(file);
}
const api = await load();
const demo = await load('export { BlueprintCardsDemo } from "../demos/blueprint"');
const h = React.createElement;
const render = (name, props = {}, a = api) => renderToStaticMarkup(h(a[name], { title: '长中文原件文件名与有序成果分节', children: h('p', null, '原件内容'), ...props }));
const button = label => h(api.BpTool, { iconOnly: true, 'aria-label': label }, h('svg', { 'aria-hidden': true }));
function node(name, attrs = {}, parent) { return { name, attrs, classes: (attrs.class ?? '').split(/\s+/), parent }; }
function tree(html, parent) {
  const nodes = [], stack = [parent];
  for (const match of html.matchAll(/<\/?[a-zA-Z][^>]*>/g)) {
    const tag = match[0];
    if (tag.startsWith('</')) { stack.pop(); continue; }
    const n = node(tag.match(/^<([\w-]+)/)[1], Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(m => [m[1], m[2]])), stack.at(-1));
    nodes.push(n);
    if (!['img', 'link', 'br', 'hr', 'input', 'meta'].includes(n.name) && !tag.endsWith('/>')) stack.push(n);
  }
  return nodes;
}
const cls = (nodes, name) => nodes.find(n => n.classes.includes(name));
function headingContract(a = api) {
  for (const name of ['BpFrameCard', 'BpSectionCard']) for (const level of [undefined, 2, 3, 4, 5, 6]) {
    const nodes = tree(render(name, { headingLevel: level }, a));
    const section = nodes[0], heading = nodes.find(n => n.name === `h${level ?? 3}`);
    assert.equal(section.name, 'section'); assert.ok(heading);
    assert.equal(section.attrs['aria-labelledby'], heading.attrs.id);
    assert.equal(heading.parent.name, 'header');
    assert.doesNotMatch(render(name, {}, a), /bp-ruler|SHEET|headingLevel=/);
  }
  const both = tree(renderToStaticMarkup(h('div', null, h(a.BpFrameCard, { title: '文件' }), h(a.BpSectionCard, { title: '分节' }))));
  const ids = both.filter(n => /^h\d$/.test(n.name)).map(n => n.attrs.id);
  assert.equal(new Set(ids).size, 2);
  assert.match(render('BpFrameCard', { 'aria-labelledby': 'external-heading', id: 'object', className: 'host-layout' }, a), /aria-labelledby="external-heading" id="object" class="bp-frame-card host-layout"/);
}
function statusContract(a = api) {
  for (const tone of ['success', 'warning', 'danger', 'info', 'neutral']) {
    const html = render('BpFrameCard', { status: { tone, label: h('strong', null, '第 3 / 3 页') }, actions: button('查看原件') }, a);
    const nodes = tree(html), status = cls(nodes, 'bp-frame-card-status');
    assert.equal(status.attrs['data-tone'], tone);
    assert.equal(cls(nodes, 'bp-frame-card-dot').attrs['aria-hidden'], 'true');
    assert.equal(status.attrs['aria-hidden'], undefined);
    assert.match(html, /<strong>第 3 \/ 3 页<\/strong>/);
    assert.equal(nodes.find(n => n.name === 'button').attrs['aria-label'], '查看原件');
    assert.equal(nodes.find(n => n.name === 'button').attrs.type, 'button');
  }
  assert.doesNotMatch(render('BpFrameCard', {}, a), /bp-frame-card-status|bp-frame-card-dot|bp-card-actions/);
}
function sectionContract(a = api) {
  const html = render('BpSectionCard', { letter: 'A', meta: 'src/cache.ts', action: button('查看评论'), children: h(a.BpCodebox, { file: 'src/cache.ts' }, 'const count = 2;') }, a);
  const nodes = tree(html), letter = cls(nodes, 'bp-section-card-letter');
  assert.equal(letter.parent.name, 'h3'); assert.equal(letter.attrs['aria-hidden'], undefined);
  assert.match(html, />A<\/span>/); assert.match(html, />src\/cache.ts<\/div>/);
  assert.equal(nodes.find(n => n.name === 'button').attrs['aria-label'], '查看评论');
  assert.equal(nodes.filter(n => n.name === 'pre').length, 1); assert.ok(cls(nodes, 'bp-codebox'));
  for (const letter of [undefined, '', '  ']) assert.doesNotMatch(render('BpSectionCard', { letter }, a), /bp-section-card-letter|bp-section-card-meta|bp-card-actions/);
  assert.match(render('BpSectionCard', { meta: 0 }, a), /bp-section-card-meta[^>]*>0<\/div>/);
}

// A source-level selector/token probe, not browser layout or computedStyle.
const selectorCache = new Map();
function parse(selector) {
  if (!selectorCache.has(selector)) {
    let ast; transform({ code: Buffer.from(`${selector}{color:red}`), visitor: { Selector(value) { ast = value; } } });
    assert.ok(ast); selectorCache.set(selector, ast);
  }
  return selectorCache.get(selector);
}
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
    if (p.type === 'class') return n.classes.includes(p.name);
    if (p.type === 'type') return n.name === p.name;
    if (p.type === 'universal') return true;
    if (p.type === 'attribute') return p.operation ? n.attrs[p.name] === p.operation.value : Object.hasOwn(n.attrs, p.name);
    if (p.type === 'pseudo-class' && p.kind === 'root') return !n.parent;
    if (p.type === 'pseudo-class' && ['is', 'where', 'not'].includes(p.kind)) {
      const any = p.selectors.some(s => matches(s, n)); return p.kind === 'not' ? !any : any;
    }
    assert.fail(`Unsupported probe selector ${JSON.stringify(p)}`);
  });
}
function rules(source) {
  const list = [];
  postcss.parse(source).walkRules(r => {
    const decls = Object.fromEntries(r.nodes.filter(n => n.type === 'decl').map(n => [n.prop, n.value]));
    list.push({ selectors: r.selectors.map(parse), decls });
  });
  return list;
}
const themeRules = [];
postcss.parse(theme).walkRules(r => {
  if (!r.selector.includes('data-prism-theme') && !r.selector.includes('data-ui-version')) return;
  const decls = Object.fromEntries(r.nodes.filter(n => n.type === 'decl' && n.prop.startsWith('--')).map(n => [n.prop, n.value]));
  if (Object.keys(decls).length) themeRules.push({ selectors: r.selectors.map(parse), decls });
});
function declarations(n, parsed) {
  return Object.assign({}, ...parsed.filter(r => r.selectors.some(s => matches(s, n))).map(r => r.decls));
}
function tokens(n) { return { ...(n.parent ? tokens(n.parent) : {}), ...declarations(n, themeRules) }; }
function resolved(n, prop, parsed) {
  const raw = declarations(n, parsed)[prop]; assert.ok(raw, `${n.attrs.class}/${prop}`);
  const values = tokens(n);
  const replace = (value, depth = 0) => {
    assert.ok(depth < 12, 'cyclic/undefined token');
    return value.replace(/var\((--[\w-]+)\)/g, (_, key) => { assert.ok(values[key], key); return replace(values[key], depth + 1); });
  };
  return replace(raw);
}
function fixture(t, outer, tone = 'info') {
  const outerNode = outer ? node('div', { 'data-ui-version': 'coss-v1', 'data-prism-theme': outer }) : undefined;
  const rootNode = node('div', { 'data-ui-version': 'coss-v1', 'data-prism-theme': t, ...(outer ? { 'data-agent-preview': '' } : {}) }, outerNode);
  return tree(render('BpFrameCard', { status: { tone, label: '当前页' }, actions: button('查看原件') }) + render('BpSectionCard', { letter: 'A', meta: '长文件名'.repeat(20), action: button('说明') }), rootNode);
}
function styleContract(source = css) {
  const parsed = rules(source);
  for (const t of themes) {
    const standalone = fixture(t);
    for (const outer of [undefined, ...themes]) {
      const nodes = fixture(t, outer);
      const values = tokens(nodes[0]);
      for (const [name, prop, token] of [['bp-frame-card', 'background', '--card'], ['bp-frame-card', 'color', '--card-foreground'], ['bp-section-card', 'background', '--card'], ['bp-frame-card-head', 'background', '--primary'], ['bp-frame-card-head', 'color', '--primary-foreground'], ['bp-section-card-title', 'color', '--heading'], ['bp-section-card-meta', 'color', '--muted-foreground']]) {
        assert.equal(resolved(cls(nodes, name), prop, parsed), values[token], `${t} semantic role ${name}/${prop}`);
      }
      assert.equal(resolved(cls(nodes, 'bp-section-card'), 'border', parsed), `1.5px solid ${t.startsWith('blueprint') ? values['--line'] : values['--border']}`);
      for (const [name, prop] of [['bp-frame-card', 'background'], ['bp-frame-card', 'color'], ['bp-frame-card', 'border'], ['bp-frame-card-head', 'background'], ['bp-frame-card-head', 'color'], ['bp-frame-card-dot', 'background'], ['bp-section-card', 'border'], ['bp-section-card-title', 'color'], ['bp-section-card-letter', 'background'], ['bp-section-card-letter', 'color'], ['bp-section-card-meta', 'color']]) {
        assert.equal(resolved(cls(nodes, name), prop, parsed), resolved(cls(standalone, name), prop, rules(css)), `${outer}/${t}/${name}/${prop}`);
      }
      for (const name of ['bp-frame-card', 'bp-section-card']) {
        const s = declarations(cls(nodes, name), parsed);
        assert.equal(s['border-radius'], '0'); assert.equal(s['box-shadow'], 'none');
        assert.match(s.border, /^1\.5px solid /);
      }
      const parent = nodes[0].parent;
      for (const plain of [node('div', { 'data-slot': 'card' }, parent), node('header', {}, parent), node('h3', {}, parent), node('button', {}, parent)]) assert.deepEqual(declarations(plain, parsed), {});
    }
  }
  for (const r of parsed) for (const s of r.selectors) {
    // Each target opts in itself; no inherited visual override for an arbitrary child or pseudo-element.
    const target = s.slice(s.findLastIndex(p => p.type === 'combinator') + 1);
    assert.ok(target.some(p => p.type === 'class' && p.name.startsWith('bp-')));
    assert.ok(!s.some(p => p.type === 'pseudo-element'));
  }
}
function wrapContract(source = css) {
  const parsed = rules(source), nodes = fixture('blueprint');
  for (const name of ['bp-frame-card-head', 'bp-section-card-head', 'bp-card-actions']) {
    const s = declarations(cls(nodes, name), parsed); assert.equal(s.display, 'flex'); assert.equal(s['flex-wrap'], 'wrap');
  }
  for (const name of ['bp-frame-card-title', 'bp-frame-card-status-label', 'bp-section-card-label', 'bp-section-card-meta', 'bp-card-body']) {
    const s = declarations(cls(nodes, name), parsed); assert.equal(s['min-width'], '0'); assert.equal(s['overflow-wrap'], 'anywhere');
  }
  for (const name of ['bp-frame-card-title', 'bp-section-card-title']) assert.equal(declarations(cls(nodes, name), parsed).flex, '1 1 12rem');
  const letter = declarations(cls(nodes, 'bp-section-card-letter'), parsed); assert.equal(letter.width, letter.height);
  assert.doesNotMatch(source, /white-space:\s*nowrap|overflow:\s*hidden|text-overflow/);
}
const ratio = (a, b) => (Math.max(relativeLuminance(a), relativeLuminance(b)) + .05) / (Math.min(relativeLuminance(a), relativeLuminance(b)) + .05);
const contrastEvidence = [];
function contrastContract(source = css) {
  const parsed = rules(source);
  for (const t of themes) for (const tone of ['success', 'warning', 'danger', 'info', 'neutral']) {
    const nodes = fixture(t, undefined, tone), head = cls(nodes, 'bp-frame-card-head'), dot = cls(nodes, 'bp-frame-card-dot');
    const bg = resolved(head, 'background', parsed), fg = resolved(head, 'color', parsed);
    const fill = resolved(dot, 'background', parsed), edge = resolved(dot, 'border', parsed).split(' ').at(-1);
    assert.ok(ratio(fg, bg) >= 4.5, `${t} text`);
    assert.ok(ratio(edge, bg) >= 3, `${t} ${tone} dot boundary`);
    const expectedToken = { success: '--success', warning: '--warning', danger: '--destructive', info: '--info', neutral: '--primary-foreground' }[tone];
    assert.equal(fill, tokens(head)[expectedToken]);
    contrastEvidence.push({ theme: t, tone, text: ratio(fg, bg), dotFill: ratio(fill, bg), dotBoundary: ratio(edge, bg) });
  }
}

test('P79 headings: labelled sections, configurable levels, unique ids and host attributes', () => headingContract());
test('P79 status: all five tones retain fact text; no status means no status subtree', () => statusContract());
test('P79 section: meaningful letter belongs to heading; named action and existing BpCodebox compose; absent options disappear', () => sectionContract());
test('P79 style: five themes, 25 nested theme pairs, neutral core fallback and ordinary-component isolation', () => styleContract());
test('P79 narrow contract: intrinsic wrapping, shrinkable long text, square letter and no clipping (browser 320 check separate)', () => wrapContract());
test('P79 contrast: five themes x five tones; text >=4.5 and visible square outline >=3', () => contrastContract());
test('P79 demo: original preview and genuine A/B sections use fixture facts, semantic formula and named actions', () => {
  const html = renderToStaticMarkup(h(demo.BlueprintCardsDemo));
  assert.match(html, /第 1 \/ 2 份作答/); assert.match(html, /完整扫描纸 · 固定扫描夹具/);
  assert.match(html, />A<\/span>/); assert.match(html, />B<\/span>/);
  assert.match(html, /第 1 题 · 共 1 题/); assert.match(html, /第 2 题 · 共 1 题/);
  assert.match(html, /aria-label="查看选择题作答说明" aria-expanded="false" aria-controls="bp-choice-note"/);
  assert.match(html, /id="bp-choice-note" hidden=""/); assert.match(html, /<math/);
  assert.doesNotMatch(html, /bp-sheet|bp-ruler|live|\d+\s*ms/);
  assert.ok(!components.some(c => /bp-frame-card|bp-section-card|BpFrameCard|BpSectionCard/.test(JSON.stringify(c))));
});
test('P79 rollback mutations fail rendered/accessibility and theme/wrapping contracts', async () => {
  const sourceMutations = [
    ['frame heading becomes div', s => s.replace('className="bp-frame-card-title text-ui-action">{title}</Heading>', 'className="bp-frame-card-title text-ui-action">{title}</div>').replace('<Heading id={id} className="bp-frame-card-title', '<div id={id} className="bp-frame-card-title'), headingContract],
    ['unlabelled frame', s => s.replace('<section aria-labelledby={id} {...props} className={cn("bp-frame-card"', '<section {...props} className={cn("bp-frame-card"'), headingContract],
    ['status fact lost', s => s.replace('{status.label}', '在线'), statusContract],
    ['decorative letter', s => s.replace('className={cn("bp-section-card-letter font-mono",', 'aria-hidden="true" className={cn("bp-section-card-letter font-mono",'), sectionContract],
    ['action dropped', s => s.replace('<div className="bp-card-actions">{action}</div>', '<div className="bp-card-actions" />'), sectionContract],
  ];
  for (const [label, mutate, check] of sourceMutations) {
    const changed = mutate(source); assert.notEqual(changed, source, label);
    const mutant = await load(changed); assert.throws(() => check(mutant), undefined, label);
  }
  for (const [label, mutate, check] of [
    ['hardcoded ink breaks night/core fallback', s => s.replace('background:var(--primary);', 'background:#16181D;'), styleContract],
    ['coloured card replaces neutral surface', s => s.replace('background:var(--card);', 'background:var(--info);'), styleContract],
    ['global header leaks', s => s + '\nheader {background:red}', styleContract],
    ['nowrap header', s => s.replaceAll('flex-wrap:wrap', 'flex-wrap:nowrap'), wrapContract],
    ['intrinsic text minimum', s => s.replaceAll('min-width:0', 'min-width:auto'), wrapContract],
    ['long metadata cannot wrap', s => s.replaceAll('overflow-wrap:anywhere', 'overflow-wrap:normal'), wrapContract],
    ['square edge loses contrast', s => s.replace('border:1px solid var(--primary-foreground)', 'border:1px solid var(--primary)'), contrastContract],
    ['warning incorrectly uses success', s => s.replace('background:var(--warning)', 'background:var(--success)'), contrastContract],
  ]) { const changed = mutate(css); assert.notEqual(changed, css, label); assert.throws(() => check(changed), undefined, label); }
});

if (process.env.P79_EVIDENCE) {
  headingContract(); statusContract(); sectionContract(); styleContract(); wrapContract(); contrastContract();
  writeFileSync(process.env.P79_EVIDENCE + '/contrast.json', JSON.stringify(contrastEvidence, null, 2) + '\n');
  writeFileSync(process.env.P79_EVIDENCE + '/demo-ssr.html', renderToStaticMarkup(h(demo.BlueprintCardsDemo)) + '\n');
}
