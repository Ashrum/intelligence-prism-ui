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

const root = fileURLToPath(new URL('../', import.meta.url));
const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const css = read('app/(next)/next/blueprint.css');
const theme = read('app/(next)/next/theme.css');
const family = ':is([data-prism-theme="blueprint"],[data-prism-theme="blueprint-night"])';
const guard = `:not(:where([data-agent-preview][data-prism-theme]:not(${family}), [data-agent-preview][data-prism-theme]:not(${family}) *))`;
const nightGuard = ':not(:where([data-agent-preview][data-prism-theme]:not([data-prism-theme="blueprint-night"]), [data-agent-preview][data-prism-theme]:not([data-prism-theme="blueprint-night"]) *))';
const core = ['light', 'paper', 'dark'];
const blueprints = ['blueprint', 'blueprint-night'];
const runtime = await createTestRuntime('p75-question-detail');
const bundle = await build({ stdin: { contents: `export { QuestionCard } from './components/prism-next/question-card'; export { QuestionDetails } from './components/prism-next/question-details'; export { questionSamples } from './components/prism-next/fixtures/question-samples'; export { questionMetadata } from './components/prism-next/fixtures/question-metadata';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', loader: { '.css': 'empty' }, alias: { '@': root }, write: false });
const file = new URL('fixture.mjs', runtime);
writeFileSync(file, bundle.outputFiles[0].text);
const { QuestionCard, QuestionDetails, questionSamples, questionMetadata } = await import(file);
const h = React.createElement;
const noop = () => {};
const question = questionSamples[3];
const html = tab => renderToStaticMarkup(h(QuestionCard, { question, detailsOpen: true, details: h(QuestionDetails, { question, metadata: questionMetadata[question.id], links: {}, tab, onTabChange: noop, onLinksChange: noop, canEdit: true }) }));

// Parse actual SSR tags into a selector probe tree. No browser, layout engine, or
// getComputedStyle is used: these are resolved incremental CSS-rule assertions.
function tree(markup, parent) {
  const nodes = [], stack = [parent];
  for (const tag of markup.matchAll(/<\/?[a-zA-Z][^>]*>/g)) {
    if (tag[0].startsWith('</')) { stack.pop(); continue; }
    const name = tag[0].match(/^<([\w-]+)/)[1];
    const attrs = Object.fromEntries([...tag[0].matchAll(/([\w:-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
    const node = { name, attrs, classes: (attrs.class ?? '').split(/\s+/), parent: stack.at(-1), children: [] };
    node.parent.children.push(node); nodes.push(node);
    if (!['input', 'img', 'br', 'hr', 'link', 'meta', 'source', 'wbr', 'area', 'embed'].includes(name) && !tag[0].endsWith('/>')) stack.push(node);
  }
  return nodes;
}
const element = (t, parent, preview = false) => {
  const n = { name: 'div', attrs: { ...(t ? { 'data-prism-theme': t } : {}), ...(preview ? { 'data-agent-preview': '' } : {}) }, classes: [], children: [], parent };
  parent?.children.push(n); return n;
};
function parse(selector) {
  let ast;
  transform({ code: Buffer.from(`${selector}{color:red}`), visitor: { Selector(value) { ast = value; } } });
  assert.ok(ast); return ast;
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
    if (p.type === 'universal') return true;
    if (p.type === 'type') return n.name === p.name;
    if (p.type === 'class') return n.classes.includes(p.name);
    if (p.type === 'attribute') {
      if (!p.operation) return Object.hasOwn(n.attrs, p.name);
      assert.equal(p.operation.operator, 'equal'); return n.attrs[p.name] === p.operation.value;
    }
    if (p.type === 'pseudo-class') {
      if (p.kind === 'last-child') return n.parent?.children.at(-1) === n;
      assert.ok(['is', 'where', 'not'].includes(p.kind), p.kind);
      const any = p.selectors.some(child => matches(child, n)); return p.kind === 'not' ? !any : any;
    }
    assert.fail(`Unsupported selector ${JSON.stringify(p)}`);
  });
}
function rules(source = css) {
  const found = [];
  postcss.parse(source).walkRules(r => {
    if (!r.selector.includes('.question-detail-region')) return;
    const media = r.parent.type === 'atrule' ? r.parent.params : undefined;
    if (media) assert.equal(media, '(pointer: fine)');
    found.push({ selectors: r.selectors.map(parse), declarations: Object.fromEntries(r.nodes.filter(d => d.type === 'decl').map(d => [d.prop, d.value])), media });
  });
  return found;
}
const current = rules();
function style(node, parsed = current, pointer = 'fine') {
  const result = {};
  for (const rule of parsed) if ((!rule.media || pointer === 'fine') && rule.selectors.some(s => matches(s, node))) Object.assign(result, rule.declarations);
  return result;
}
function fixture(t, tab = 'answer', outer) {
  const parent = outer ? element(t, element(outer), true) : element(t);
  const nodes = tree(html(tab), parent);
  return { parent, nodes, region: nodes.find(n => n.classes.includes('question-detail-region')), tabs: nodes.find(n => n.attrs['data-slot'] === 'tabs') };
}
function tokens(t) {
  const body = theme.split(`:where([data-agent-preview])[data-prism-theme="${t}"] {`)[1].split('}')[0];
  return Object.fromEntries([...body.matchAll(/(--[\w-]+):([^;]+);/g)].map(m => [m[1], m[2]]));
}
const ratio = (a, b) => (Math.max(relativeLuminance(a), relativeLuminance(b)) + .05) / (Math.min(relativeLuminance(a), relativeLuminance(b)) + .05);
function surface(parsed = current) {
  for (const t of blueprints) {
    const result = style(fixture(t).region, parsed);
    assert.equal(result.background, 'var(--card)');
    assert.equal(result.border, '1px dashed var(--border)');
    assert.equal(result['border-radius'], '0');
    assert.equal(result.padding, undefined);
    assert.equal(result['border-color'], t === 'blueprint-night' ? 'var(--line)' : undefined);
  }
}
// P107: all detail descendants keep their component-owned geometry.
function spacing(parsed = current) {
  for (const t of blueprints) for (const tab of ['answer', 'teaching', 'archive']) {
    const f = fixture(t, tab);
    assert.ok(f.nodes.some(n => n.attrs['data-slot'] === 'tabs-content' && n.children.length), tab);
    for (const n of f.nodes) for (const prop of Object.keys(style(n, parsed))) {
      assert.ok(!/^(padding|margin|gap|row-gap|column-gap|min-height)/.test(prop), prop);
    }
  }
}
function isolation(parsed = current) {
  for (const t of core) for (const outer of [undefined, ...blueprints]) for (const tab of ['answer', 'teaching', 'archive']) {
    const f = fixture(t, tab, outer);
    // Exercise the preview root itself as a detail region as well as descendants.
    f.parent.classes.push('question-detail-region');
    for (const n of [f.parent, ...f.nodes]) assert.deepEqual(style(n, parsed), {}, `${outer ?? 'root'}/${t}/${tab}/${n.name}`);
  }
  // White inside night must not inherit the night-only line override.
  assert.equal(style(fixture('blueprint', 'answer', 'blueprint-night').region, parsed)['border-color'], undefined);
}

test('P75: actual open card SSR retains three accessible Tabs and content hooks', () => {
  for (const tab of ['answer', 'teaching', 'archive']) {
    const f = fixture('blueprint', tab);
    assert.ok(f.region.classes.includes('bg-secondary') && f.region.classes.includes('p-4'));
    assert.ok(f.tabs.classes.includes('gap-5'));
    assert.deepEqual(f.nodes.filter(n => n.attrs.role === 'tab').map(n => n.attrs['aria-label']), ['答案与解析', '教学定位', '题目档案']);
    assert.equal(f.nodes.filter(n => n.attrs.role === 'tab' && n.attrs['aria-selected'] === 'true').length, 1);
  }
});
test('P75: both Blueprint detail surfaces resolve to card, dashed 1px, square with component padding', () => surface());
test('P75: real answer/teaching/archive SSR retains component spacing (P107)', () => spacing());
test('P75: P107 removes desktop floor; existing coarse 44px utility remains unoverridden', () => {
  for (const t of blueprints) for (const n of fixture(t).nodes.filter(n => n.attrs.role === 'tab')) {
    assert.equal(style(n)['min-height'], undefined);
    assert.equal(style(n, current, 'coarse')['min-height'], undefined);
    assert.ok(n.classes.includes('pointer-coarse:min-h-11'));
  }
});
test('P75: core resolved-rule deltas are empty at roots and nested preview roots/descendants', () => isolation());
test('P75: each added selector guards its final target; no pseudo-element decoration or typography', () => {
  postcss.parse(css).walkRules(r => {
    if (!r.selector.includes('.question-detail-region')) return;
    for (const s of r.selectors) {
      assert.ok(s.endsWith(guard) || s.endsWith(nightGuard), s);
      assert.ok(!s.includes('::'), 'no pseudo-element border/shadow');
    }
    for (const d of r.nodes) assert.ok(!/^(font|line-height|color|box-shadow)/.test(d.prop), d.prop);
  });
});
test('P75: night uses the existing line token because border/card fails 3:1', () => {
  const t = tokens('blueprint-night');
  assert.ok(ratio(t['--border'], t['--card']) < 3);
  assert.ok(ratio(t['--line'], t['--card']) >= 3);
});
test('P75: in-memory rollback, spacing and isolation mutations are detected', () => {
  const cases = [
    ['whole-block rollback', source => source.replace(/\/\* P75 question detail:[\s\S]*?\/\* End P75 question detail\. \*\//, ''), surface],
    ...[['background:var(--card)', 'background:var(--secondary)'], ['border:1px dashed', 'border:1px solid'], ['border:1px dashed', 'border:2px dashed'], ['border-radius:0;', 'border-radius:12px;'], ['border-radius:0;', 'border-radius:0; padding:12px;'], ['border-color:var(--line);', 'border-color:var(--border);']].map(([a,b]) => [a, source => source.replace(a,b), surface]),
    ...['gap:12px', 'margin-block-end:12px', 'row-gap:16px', 'min-height:32px'].map(declaration => [declaration, source => source.replace('border-radius:0;', `border-radius:0; ${declaration};`), spacing]),
    ['preview guard removal', source => source.replaceAll(guard, ''), isolation],
    ['night guard removal', source => source.replaceAll(nightGuard, ''), isolation],
    ['unscoped family', source => source.replaceAll(`${family} .question-detail-region`, '.question-detail-region'), isolation],
  ];
  const block = css.match(/\/\* P75 question detail:[\s\S]*?\/\* End P75 question detail\. \*\//)[0];
  for (const [name, mutate, check] of cases) {
    const changed = mutate(block); assert.notEqual(changed, block, name);
    assert.throws(() => check(rules(changed)), undefined, name);
  }
});
