import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import postcss from 'postcss';
import { transform } from 'lightningcss';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { createTestRuntime } from './helpers/test-runtime.mjs';
import { objectCardSources, objectCardBase, objectCardCases, arrangerProps, graphProps } from './helpers/blueprint-object-card-fixtures.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = p => readFileSync(root + p, 'utf8');
const fullCSS = read('app/(next)/next/blueprint.css');
const css = fullCSS.match(/\/\* P85 object cards:[\s\S]*?\/\* End P85 object cards\. \*\//)[0];
const p79 = fullCSS.match(/\/\* P79 cards:[\s\S]*?\/\* End P79 cards\. \*\//)[0];
const themes = ['light', 'paper', 'dark', 'blueprint', 'blueprint-night'];
const runtime = await createTestRuntime('p85-object-cards');
let serial = 0;
async function load(overrides = {}, demo = false) {
  const result = await build({ stdin: { contents: objectCardSources.map(p => `export * from './${p}'`).join(';') + (demo ? ';export * from "./components/prism-next/demos/blueprint-object-cards"' : ''), resolveDir: root, loader: 'tsx' },
    bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false,
    plugins: [{ name: 'rollback', setup(b) { b.onLoad({ filter: /\.tsx$/ }, args => { const contents = overrides[args.path.slice(root.length)]; if (contents !== undefined) return { contents, loader: 'tsx' }; }); } }],
  });
  const file = new URL(`bundle-${serial++}.mjs`, runtime); writeFileSync(file, result.outputFiles[0].text); return import(file);
}
const api = await load({}, true), h = React.createElement;
const htmlFor = (entry, a = api) => render(h(a[entry.component], entry.props));
const digest = html => ({ bytes: Buffer.byteLength(html), sha256: createHash('sha256').update(html).digest('hex') });
const fixturePath = 'tests/fixtures/blueprint-object-cards-legacy.json';
// Explicit one-time capture from the named Git baseline, never from the candidate implementation.
if (process.env.P85_CAPTURE_BASELINE === '1') {
  const originals = Object.fromEntries(objectCardSources.map(p => [p, execFileSync('git', ['show', `${objectCardBase}:${p}`], { cwd: root, encoding: 'utf8' })]));
  const before = await load(originals);
  writeFileSync(root + fixturePath, JSON.stringify({ base: objectCardBase, sources: Object.fromEntries(objectCardSources.map(p => [p, execFileSync('git', ['rev-parse', `${objectCardBase}:${p}`], { cwd: root, encoding: 'utf8' }).trim()])), snapshots: Object.fromEntries(objectCardCases().map(c => [c.name, digest(htmlFor(c, before))])) }, null, 2) + '\n');
}

function node(name, attrs = {}, parent) { const n = { name, attrs, classes: (attrs.class ?? '').split(/\s+/), parent, children: [] }; parent?.children.push(n); return n; }
function tree(html, parent) {
  const nodes = [], stack = [parent];
  for (const match of html.matchAll(/<\/?[a-zA-Z][^>]*>/g)) {
    const tag = match[0];
    if (tag.startsWith('</')) { stack.pop(); continue; }
    const n = node(tag.match(/^<([\w-]+)/)[1], Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(m => [m[1], m[2]])), stack.at(-1)); nodes.push(n);
    if (!['img', 'link', 'br', 'hr', 'input', 'meta'].includes(n.name) && !tag.endsWith('/>')) stack.push(n);
  }
  return nodes;
}
// Production selector AST probe only; no claim about browser cascade, layout or focus.
const cache = new Map();
function parse(selector) { if (!cache.has(selector)) { let ast; transform({ code: Buffer.from(`${selector}{color:red}`), visitor: { Selector(v) { ast = v; } } }); cache.set(selector, ast); } return cache.get(selector); }
function matches(s, n) {
  if (!n) return false;
  const split = s.findLastIndex(p => p.type === 'combinator');
  if (split >= 0) {
    if (!matches(s.slice(split + 1), n)) return false;
    if (s[split].value === 'next-sibling') return matches(s.slice(0, split), n.parent?.children[n.parent.children.indexOf(n) - 1]);
    if (s[split].value === 'child') return matches(s.slice(0, split), n.parent);
    assert.equal(s[split].value, 'descendant');
    for (let p = n.parent; p; p = p.parent) if (matches(s.slice(0, split), p)) return true;
    return false;
  }
  return s.every(p => {
    if (p.type === 'pseudo-class' && p.kind === 'empty') return n.children.length === 0; // SSR abilities contain li elements or no content.
    if (p.type === 'class') return n.classes.includes(p.name);
    if (p.type === 'type') return n.name === p.name;
    if (p.type === 'universal') return true;
    if (p.type === 'attribute') return p.operation ? n.attrs[p.name] === p.operation.value : Object.hasOwn(n.attrs, p.name);
    if (p.type === 'pseudo-class' && ['is', 'where', 'not'].includes(p.kind)) { const any = p.selectors.some(s => matches(s, n)); return p.kind === 'not' ? !any : any; }
    if (p.type === 'pseudo-class' && p.kind === 'has') return p.selectors.some(s => { assert.deepEqual(s[0], { type: 'pseudo-class', kind: 'scope' }); assert.deepEqual(s[1], { type: 'combinator', value: 'child' }); return n.children.some(c => matches(s.slice(2), c)); });
    assert.fail(`Unsupported selector ${JSON.stringify(p)}`);
  });
}
function rules(source) { const list = []; postcss.parse(source).walkRules(r => list.push({ selectors: r.selectors.map(parse), decls: Object.fromEntries(r.nodes.filter(n => n.type === 'decl').map(n => [n.prop, n.value])) })); return list; }
function declarations(n, parsed, pseudo) {
  return Object.assign({}, ...parsed.filter(r => r.selectors.some(s => { const pe = s.at(-1)?.type === 'pseudo-element' ? s.at(-1).kind : undefined; return pe === pseudo && matches(pe ? s.slice(0, -1) : s, n); })).map(r => r.decls));
}
function fixture(entry, theme, outer) { const p = outer ? node('div', { 'data-prism-theme': outer }) : undefined; return tree(htmlFor(entry), node('div', { 'data-prism-theme': theme, ...(outer ? { 'data-agent-preview': '' } : {}) }, p)); }
const blueprint = t => t === 'blueprint' || t === 'blueprint-night';
function styleContract(source = css) {
  const parsed = rules(source), reference = rules(p79);
  const ref = name => declarations(node('div', { class: name }), reference);
  for (const entry of objectCardCases()) for (const theme of themes) for (const outer of [undefined, ...themes]) {
    const nodes = fixture(entry, theme, outer), card = nodes[0];
    if (!blueprint(theme)) {
      for (const n of nodes) for (const pseudo of [undefined, 'before', 'after']) assert.deepEqual(declarations(n, parsed, pseudo), {}, `core isolated: ${outer}/${theme}/${entry.name}`);
      // The preview root itself is excluded too, even when it has an object-card slot.
      const rootCard = node('div', { 'data-slot': 'card', 'data-agent-arranger-view': 'inline', 'data-agent-preview': '', 'data-prism-theme': theme }, card.parent.parent);
      assert.deepEqual(declarations(rootCard, parsed), {}); continue;
    }
    const style = n => declarations(n, parsed);
    const c = style(card);
    for (const key of ['border', 'border-radius', 'box-shadow', 'background', 'color']) assert.equal(c[key], ref('bp-frame-card')[key], `frame ${key}`);
    assert.equal(c.width, '100%'); assert.equal(c['margin-inline'], '0'); assert.equal(c.padding, undefined); assert.equal(c['box-sizing'], 'border-box');
    assert.equal(declarations(card, parsed, 'before').display, 'none');
    const isArranger = entry.component === 'AgentStructureArranger';
    const head = isArranger ? card.children.find(n => n.name === 'header').children[0] : card.children.find(n => n.name === 'h3');
    for (const key of ['display', 'flex-wrap', 'align-items', 'gap', 'padding', 'background', 'color']) assert.equal(style(head)[key], ref('bp-frame-card-head')[key], `head ${key}`);
    assert.equal(style(head).margin, '0');
    const inset = entry.props.density === 'compact' ? 12 : isArranger ? 20 : 16;
    assert.equal(style(head)['margin-inline'], `-${inset}px`); assert.equal(style(head)['margin-top'], `-${inset}px`);
    if (isArranger) {
      const status = head.children.find(n => n.attrs['data-agent-status']); assert.ok(status);
      for (const key of ['display', 'align-items', 'gap', 'min-width', 'max-width', 'margin-inline-start']) assert.equal(style(status)[key], ref('bp-frame-card-status')[key], `status ${key}`);
      assert.equal(style(status).color, 'inherit');
      const dot = status.children.find(n => n.name === 'svg'); assert.equal(dot.attrs['aria-hidden'], 'true');
      for (const key of ['flex', 'width', 'height', 'border', 'background']) assert.equal(style(dot)[key], ref('bp-frame-card-dot')[key]);
      for (const child of dot.children) assert.equal(style(child).display, 'none');
      assert.equal(style(status.children.find(n => n.name === 'span'))['overflow-wrap'], 'anywhere');
      assert.equal(style(head.children.find(n => n.name === 'h3')).flex, '1 1 12rem');
    } else assert.equal(head.children.length, 0, 'no invented graph status');
    const actions = card.children.filter(n => n.name === 'div' && n.children.some(c => c.attrs['data-slot'] === 'button'));
    if (!entry.name.startsWith('graph-unavailable-inline')) assert.ok(actions.length);
    for (const action of actions) for (const [key, value] of Object.entries(ref('bp-card-actions'))) assert.equal(style(action)[key], value, `actions ${key}`);
    // Inner question Cards and ordinary cards do not acquire object frames/headers.
    for (const inner of nodes.filter(n => n !== card && n.attrs['data-slot'] === 'card')) assert.equal(style(inner).border, undefined);
    assert.deepEqual(style(node('div', { 'data-slot': 'card' }, card.parent)), {});
  }
}
// Rule arithmetic over real SSR hierarchy, not a browser pixel measurement.
function spacingContract(source = css) {
  const parsed = rules(source);
  const bodyPadding = Number(fullCSS.match(/\.bp-card-body \{[^}]*padding:(\d+)px/)[1]);
  assert.equal(bodyPadding, 20);
  for (const theme of themes.filter(blueprint)) for (const entry of objectCardCases()) {
    const card = fixture(entry, theme)[0];
    const arranger = entry.component === 'AgentStructureArranger';
    const container = arranger ? card.children.find(n => n.name === 'header') : card;
    const title = container.children[0];
    assert.equal(container.children[1].name, arranger ? 'p' : 'ul');
    const compact = entry.props.density === 'compact';
    const expected = bodyPadding * (compact ? 3 / 5 : 1);
    const margin = declarations(title, parsed)['margin-block-end'];
    if (arranger) {
      assert.ok(container.classes.includes('space-y-2'));
      assert.equal(margin, `${expected}px`, `${theme}/${entry.name}: override title space-y margin`);
    } else {
      const gap = Number(container.classes.find(c => /^gap-\d+$/.test(c)).slice(4));
      const expression = margin?.match(/^calc\((\d+)px - var\(--spacing\) \* (\d+)\)$/);
      assert.ok(expression, `${entry.name}: title compensates existing flex gap`);
      // Independent class-derived gap; works with the inherited spacing scale.
      for (const spacing of [4, 6]) assert.equal(gap * spacing + Number(expression[1]) - Number(expression[2]) * spacing, expected, `${theme}/${entry.name}`);
    }
  }
}

// Walk the actual SSR siblings to the first visible text container, counting every flex gap.
function emptyListContract(source = css) {
  const parsed = rules(source), rows = [];
  for (const theme of themes) for (const outer of [undefined, 'blueprint', 'blueprint-night'])
    for (const density of ['default', 'compact']) for (const mode of ['empty', 'unsupported', 'supported-reason']) {
      const capabilities = mode === 'empty' ? graphProps.capabilities : { ...graphProps.capabilities,
        view: { supported: mode === 'supported-reason', reason: '资料说明' } };
      const card = fixture({ component: 'AgentRelationGraph', props: { ...graphProps, density, capabilities } }, theme, outer)[0];
      const [title, abilities] = card.children;
      assert.equal(title.name, 'h3'); assert.equal(abilities.name, 'ul');
      assert.ok(abilities.attrs.id.endsWith('-abilities'));
      assert.equal(abilities.children.length, mode === 'empty' ? 0 : 1);
      assert.equal(declarations(abilities, parsed).display, blueprint(theme) && mode === 'empty' ? 'none' : undefined);
      // A different, empty body list must remain untouched.
      const unrelated = node('ul', {}, card);
      assert.equal(declarations(unrelated, parsed).display, undefined);
      if (!blueprint(theme)) continue;
      const firstText = card.children.findIndex((n, i) => i > 0 && (n.name === 'p' || n.children.length > 0));
      const visibleSiblings = card.children.slice(1, firstText + 1).filter(n => declarations(n, parsed).display !== 'none');
      const gap = Number(card.classes.find(c => /^gap-\d+$/.test(c)).slice(4)) * 4;
      const margin = declarations(title, parsed)['margin-block-end'].match(/^calc\((\d+)px - var\(--spacing\) \* (\d+)\)$/);
      const graphDistance = visibleSiblings.length * gap + Number(margin[1]) - Number(margin[2]) * 4;
      const arranger = fixture({ component: 'AgentStructureArranger', props: { ...arrangerProps, density } }, theme, outer)[0];
      const header = arranger.children.find(n => n.name === 'header');
      assert.equal(header.children[1].name, 'p');
      const arrangerDistance = parseFloat(declarations(header.children[0], parsed)['margin-block-end']);
      assert.equal(graphDistance, density === 'compact' ? 12 : 20);
      assert.ok(Math.abs(graphDistance - arrangerDistance) <= 4);
      rows.push({ theme, outer: outer ?? null, density, mode, graphLineBoxGap: graphDistance, arrangerLineBoxGap: arrangerDistance, difference: graphDistance - arrangerDistance });
    }
  return rows;
}
test('P85c: empty abilities remove the extra gap; populated lists and core previews stay unchanged', () => {
  const rows = emptyListContract();
  if (process.env.P85_EVIDENCE_DIR) writeFileSync(`${process.env.P85_EVIDENCE_DIR}/p85c-spacing.json`, JSON.stringify({ method: 'SSR sibling traversal + CSS declarations; line-box distances, not browser glyph measurements', rows }, null, 2) + '\n');
});
function statusContract(a = api) {
  for (const snapshot of [undefined, '', '历史记录']) for (const state of ['unknown', 'saving', 'saved-draft', 'submitted', 'error']) {
    const html = render(h(a.AgentStructureArranger, { ...arrangerProps, structure: { ...arrangerProps.structure, snapshot }, save: { state } }));
    const heading = html.match(/<header[\s\S]*?<\/header>/)[0], titleRow = heading.slice(0, heading.indexOf('</div>'));
    assert.ok(titleRow.includes(snapshot === undefined ? '当前编排' : '历史编排'));
    assert.doesNotMatch(titleRow, /保存中|已保存草稿|已提交|已完成|运行中/);
    if (state === 'unknown') assert.ok(heading.includes('保存状态'));
  }
  const graph = render(h(a.AgentRelationGraph, graphProps));
  assert.match(graph, /未覆盖 1/); assert.doesNotMatch(graph.match(/<h3[\s\S]*?<\/h3>/)[0], /当前|完成|保存|已覆盖/);
}

test('P85: frozen core SSR snapshot digests match baseline raw bytes for 16 legacy calls in all three core themes', () => {
  const baseline = JSON.parse(read(fixturePath)); assert.equal(baseline.base, objectCardBase);
  for (const theme of themes.filter(t => !blueprint(t))) for (const entry of objectCardCases()) {
    const html = htmlFor(entry); assert.deepEqual(digest(html), baseline.snapshots[entry.name], `${theme}/${entry.name}`);
    // CSS theme roots cannot alter the component SSR bytes.
    assert.equal(render(h('div', { 'data-prism-theme': theme }, h(api[entry.component], entry.props))), `<div data-prism-theme="${theme}">${html}</div>`);
  }
});
test('P85: frame/head/status/action aliases match P79, full width and nested core previews stay isolated', () => styleContract());
test('P85b: both object titles use 20px body spacing, compact uses the same 3/5 ratio', () => spacingContract());
test('P85: states stay supplied facts; graph summary never becomes a whole-object status', () => statusContract());
test('P85: example renders both objects in an existing sheet, with no invented save receipt', () => {
  const html = render(h(api.BlueprintObjectCardsDemo));
  for (const value of ['sheet-object-cards', 'data-agent-arranger-view', 'data-agent-relation-view', '当前编排', '保存状态']) assert.ok(html.includes(value));
  assert.doesNotMatch(html, /已保存草稿|保存成功/);
  const demo = read('components/prism-next/demos/blueprint.tsx');
  assert.match(demo, /<BlueprintSheet id="cards"[\s\S]*?<BlueprintObjectCardsDemo \/>[\s\S]*?<\/BlueprintSheet>/);
});
test('P85: rollback mutations detect missing ink, inset, isolation, state and action rules', async () => {
  const mutations = [
    ['missing adaptation', ''],
    ['lost night scope', css.replaceAll('[data-prism-theme="blueprint-night"]', '[data-prism-theme="unused"]')],
    ['core preview exclusion removed', css.replaceAll(/:not\(:where\(\[data-agent-preview\][\s\S]*?\*\)\)/g, '')],
    ['frame rollback', css.replace('border:1.5px solid var(--line)', 'border:1px solid var(--border)')],
    ['ink rollback', css.replace('background:var(--primary); color:var(--primary-foreground)', 'background:var(--card); color:var(--foreground)')],
    ['title gutter returns', css.replace('margin-inline:-20px', 'margin-inline:0')],
    ['card width shrinks', css.replace('width:100%; min-width:0', 'width:90%; min-width:0')],
    ['status loses right alignment', css.replace('margin-inline-start:auto', 'margin-inline-start:0')],
    ['status low contrast', css.replace('margin-inline-start:auto; color:inherit', 'margin-inline-start:auto; color:var(--muted-foreground)')],
    ['dot rollback', css.replace('width:10px; height:10px', 'width:14px; height:14px')],
    ['actions no wrap', css.replace(/(\/\* bp-card-actions alias:[\s\S]*)flex-wrap:wrap/, '$1flex-wrap:nowrap')],
    ['pseudo shadow returns', css.replace('::before { display:none; }', '::before { display:block; }')],
  ];
  for (const [name, mutation] of mutations) assert.throws(() => styleContract(mutation), name);
  const spacingMutations = [
    ['arranger default spacing rollback', css.replace('margin-block-end:20px;', '')],
    ['arranger compact spacing rollback', css.replace('margin-block-end:12px;', '')],
    ['graph default spacing rollback', css.replace('margin-block-end:calc(20px - var(--spacing) * 4);', '')],
    ['graph compact spacing rollback', css.replace('margin-block-end:calc(12px - var(--spacing) * 3);', '')],
  ];
  for (const [name, mutation] of spacingMutations) { assert.notEqual(mutation, css); assert.throws(() => spacingContract(mutation), name); }
  const emptyMutations = [
    ['empty list rollback', css.replace(/\/\* P85c:[\s\S]*?(?=\/\* End P85)/, '')],
    ['populated lists hidden', css.replace('ul:empty', 'ul')],
  ];
  for (const [name, mutation] of emptyMutations) { assert.notEqual(mutation, css); assert.throws(() => emptyListContract(mutation), name); }
  const source = read(objectCardSources[0]);
  const changed = source.replace('historical ? "历史编排" : "当前编排"', 'historical ? "历史编排" : "已保存草稿"'); assert.notEqual(changed, source);
  const mutant = await load({ [objectCardSources[0]]: changed }); assert.throws(() => statusContract(mutant));
  if (process.env.P85_EVIDENCE_DIR) writeFileSync(`${process.env.P85_EVIDENCE_DIR}/mutations.json`, JSON.stringify({ baseline: objectCardBase, total: mutations.length + spacingMutations.length + emptyMutations.length + 1, detected: [...mutations.map(([name]) => name), ...spacingMutations.map(([name]) => name), ...emptyMutations.map(([name]) => name), 'fabricated saved identity'], method: 'in-memory CSS/source rollback; every mutation fails its behavioral contract; no working-tree rollback' }, null, 2) + '\n');
});
