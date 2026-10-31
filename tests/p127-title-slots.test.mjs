import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import postcss from 'postcss';
import { transform } from 'lightningcss';
import { restoreP127, p127SourceFiles } from './helpers/p127-source-compat.mjs';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { createTestRuntime } from './helpers/test-runtime.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = await createTestRuntime('p127');
const baseline = '08d467b2fa0dec5b03d72723488e71d93a9ff3b4';
const read = p => readFileSync(root + p, 'utf8');
const oldSource = p => execFileSync('git', ['show', `${baseline}:${p}`], { cwd: root, encoding: 'utf8' });
const changed = ['record-list', 'textbook-directory', 'textbook-directory-embedded', 'facet-filter', 'question-analysis-panel-compact'].map(p => `components/prism-next/${p}.tsx`);
let states = [], cursor = 0;
globalThis.__p127State = initial => {
  const index = cursor++;
  if (!(index in states)) states[index] = typeof initial === 'function' ? initial() : initial;
  return [states[index], next => { states[index] = typeof next === 'function' ? next(states[index]) : next; }];
};
async function load(mode) {
  const result = await build({ stdin: { contents: `export * from './components/prism-next/record-list';
export * from './components/prism-next/textbook-directory';
export * from './components/prism-next/facet-filter';
export * from './components/prism-next/question-analysis-panel';
export * from './components/prism-next/blueprint/blueprint';
export * from './components/prism-next/demos/blueprint-title-slots';
export * from './components/prism-next/demos/fixtures/facet-filter';
export {textbooks} from './lib/prism-next/textbook-directory';`, resolveDir: root, loader: 'tsx' },
    bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false,
    plugins: [{ name: 'pinned-baseline-and-demo-host-state', setup(b) {
      b.onLoad({ filter: /\.tsx$/ }, ({ path }) => {
        const p = path.slice(root.length);
        if (mode === 'old' && changed.includes(p)) return { contents: oldSource(p), loader: 'tsx' };
        if (mode === 'probe' && p === 'components/prism-next/demos/blueprint-title-slots.tsx') return {
          contents: read(p).replace('useEffect, useState', 'useEffect') + '\nconst useState: typeof import("react").useState = (globalThis as any).__p127State;', loader: 'tsx',
        };
      });
    } }],
  });
  const file = new URL(`${mode}.mjs`, runtime);
  writeFileSync(file, result.outputFiles[0].text);
  return import(file);
}
const old = await load('old'), api = await load('new'), probe = await load('probe');
const h = React.createElement, noop = () => {};
const filterProps = { value: api.initialFilterValue(), sortItems: api.filterSortItems, resultCount: 4, favoriteCount: 0, onIntent: noop };
const directoryProps = { textbooks: api.textbooks, selections: {}, onSelectionsChange: noop };
const cases = [
  ['RecordList', { rows: [{ id: 'r1', type: '练习', name: '一次函数', metadata: '合成数据', action: { id: 'open', label: '查看' } }], tabs: [{ id: 'all', label: '全部', count: 1 }] }],
  ['RecordList', { rows: [], state: { kind: 'empty' }, showPrimary: false }],
  ['RecordList', { rows: [], showHeader: false }],
  ...['split', 'embedded', 'header'].map(layout => ['TextbookDirectory', { ...directoryProps, layout }]),
  ['TextbookDirectory', { ...directoryProps, layout: 'embedded', multiSelect: 'dialog' }],
  ['TextbookDirectory', { ...directoryProps, layout: 'embedded', allOption: { label: '全部' }, counts: {} }],
  ['TextbookDirectory', { ...directoryProps, textbooks: [], layout: 'header' }],
  ['FilterResults', filterProps],
  ['FilterResults', { ...filterProps, sortItems: [], endSlot: h('button', null, '原操作'), showFavorites: false }],
  ['FacetFilter', { ...filterProps, dimensions: api.filterFixture('current') }],
  ['QuestionAnalysisPanel', { layout: 'compact', keyMetrics: [{ id: 'mean', label: '平均分', value: 6.5 }], notes: { sections: [{ id: 'n', heading: '说明', content: '合成数据' }] } }],
];
for (const theme of ['light', 'paper', 'dark', 'blueprint', 'blueprint-night']) test(`P127 ${theme}: ${cases.length} real component cases preserve baseline SSR bytes including IDs`, t => {
  const evidence = [];
  for (const [name, props] of cases) {
    const wrap = (module, extra = {}) => h('div', { 'data-prism-theme': theme }, h(module[name], { ...props, ...extra }));
    const before = render(wrap(old)), after = render(wrap(api));
    assert.equal(after, before, `${name}/${JSON.stringify(props.layout ?? props.state ?? 'default')}`);
    for (const empty of [undefined, null]) assert.equal(render(wrap(api, { titleLeading: empty, headingLeading: empty, leading: empty, trailing: empty })), before);
    evidence.push({ name, bytes: Buffer.byteLength(after), sha256: createHash('sha256').update(after).digest('hex') });
  }
  t.diagnostic(JSON.stringify(evidence));
});
function code(letter) { return h(api.BlueprintInlineCode, { active: true, code: letter }); }
const folio = h(api.BlueprintInlineFolio, { active: true, folio: { kind: 'sheet', value: '1/4' } });
test('P127 slots decorate the original title and tools without adding heading semantics or changing labels', () => {
  const record = render(h(api.RecordList, { ...cases[0][1], titleLeading: code('A') }));
  assert.match(record, /<h3[^>]*><span aria-hidden="true"[^>]*>A<\/span>批阅记录<\/h3>/);
  assert.match(record, /aria-label="批阅记录列表"/);
  assert.doesNotMatch(render(h(api.RecordList, { ...cases[2][1], titleLeading: code('A') })), /bp-inline-code/);
  for (const props of [cases[4][1], cases[5][1], cases[6][1], cases[7][1]]) {
    const html = render(h(api.TextbookDirectory, { ...props, headingLeading: code('A') }));
    assert.match(html, /<p[^>]*text-block-title[^>]*><span aria-hidden="true"[^>]*>A<\/span>/);
    assert.equal((html.match(/bp-inline-code/g) ?? []).length, 1);
  }
  const compact = render(h(api.QuestionAnalysisPanel, { ...cases.at(-1)[1], titleLeading: code('B') }));
  assert.match(compact, /<h2[^>]*><span aria-hidden="true"[^>]*>B<\/span>本题分析<\/h2>/);
  for (const slots of [{ leading: code('B') }, { trailing: folio }, { leading: code('B'), trailing: folio }]) {
    const html = render(h(api.FilterResults, { ...filterProps, ...slots, endSlot: h('button', null, '原操作') }));
    assert.doesNotMatch(html, /<h[1-6]/);
    assert.match(html, /共 4 题/); assert.match(html, /原操作/);
    if (slots.leading) assert.ok(html.indexOf('bp-inline-code') < html.indexOf('综合'));
    if (slots.trailing) assert.ok(html.indexOf('SHEET 01 / 04') > html.indexOf('原操作'));
  }
});
function nodesOf(tree) {
  const nodes = [];
  function visit(n) { if (!React.isValidElement(n)) return; nodes.push(n); React.Children.forEach(n.props.children, visit); }
  visit(tree); return nodes;
}
function capture(active) {
  cursor = 0;
  const tree = probe.BlueprintTitleSlotsContent({ active });
  return { nodes: nodesOf(tree), html: render(tree) };
}
test('P127 actual component-page example: A/一次函数, B/综合/共4题, compact B, sorting/search/favorites and theme switch preserve host state', () => {
  states = []; let out = capture(true);
  assert.match(out.html, /AI 批阅<span aria-hidden="true"[^>]*>SHEET 03 \/ 04/);
  assert.match(out.html, /A<\/span>一次函数/); assert.match(out.html, /SHEET 01 \/ 04/);
  assert.match(out.html, /B<\/span>本题分析/);
  const tools = () => probe.FilterResults(capture(true).nodes.find(n => n.type === probe.FilterResults).props);
  nodesOf(tools()).find(n => n.props.onValueChange).props.onValueChange('latest');
  nodesOf(tools()).find(n => n.props.onPressedChange).props.onPressedChange(true);
  nodesOf(tools()).find(n => n.props.onChange).props.onChange({ target: { value: '一次函数' } });
  for (const active of [true, false, true]) {
    out = capture(active);
    const props = out.nodes.find(n => n.type === probe.FilterResults).props;
    assert.deepEqual(props.value, { filters: {}, sort: 'latest', favoritesOnly: true, search: '一次函数' });
    assert.match(out.html, /共 4 题/); assert.match(out.html, /value="一次函数"/);
    if (!active) { assert.doesNotMatch(out.html, /bp-inline-code|bp-inline-folio/); assert.equal(props.leading, undefined); assert.equal(props.trailing, undefined); }
  }
});
for (const theme of ['light', 'paper', 'dark']) test(`P127 component-page host gates ornaments to undefined in ${theme}; old/new core SSR identical`, () => {
  const wrap = module => h('div', { 'data-prism-theme': theme }, h(module.BlueprintTitleSlotsContent, { active: false }));
  assert.equal(render(wrap(api)), render(wrap(old)));
});
test('P127 spacing is a scoped additive CSS block; all baseline styles, tokens and frozen coss remain unchanged', () => {
  const path = 'app/(next)/next/blueprint.css', css = read(path), base = oldSource(path);
  assert.equal(css.slice(0, base.length), base);
  const ast = postcss.parse(css.slice(base.length)), rules = ast.nodes.filter(n => n.type === 'rule');
  assert.equal(rules.length, 2);
  for (const [i, rule] of rules.entries()) {
    assert.match(rule.selector, /^:is\(\[data-prism-theme="blueprint"\],\[data-prism-theme="blueprint-night"\]\) /);
    assert.match(rule.selector, /:not\(:where\(\[data-agent-preview\]/);
    assert.match(rule.selector, /\*\)\)$/);
    assert.deepEqual(rule.nodes.map(n => [n.prop, n.value]), [[i ? 'margin-inline-end' : 'margin-inline-start', '12px']]);
  }
  for (const p of ['app/(next)/next/theme.css', ...execFileSync('git', ['ls-files', 'components/coss'], { cwd: root, encoding: 'utf8' }).trim().split('\n')]) assert.equal(read(p), oldSource(p));
});

// Match the production selector AST, including nested preview roots and descendants.
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
      if (['focus-visible', 'focus-within', 'hover', 'disabled', 'active'].includes(s.kind)) return node.states?.includes(s.kind) ?? false;
    }
    assert.fail(JSON.stringify(s));
  });
}

test('P127 12px inline spacing matches only drawing themes, never nested core preview roots, descendants or pseudo-elements', () => {
  const css = read('app/(next)/next/blueprint.css').split('/* P127:')[1];
  const rules = [];
  postcss.parse('/* P127:' + css).walkRules(rule => {
    let ast;
    transform({ code: Buffer.from(`${rule.selector}{color:red}`), visitor: { Selector(value) { ast = value; } } });
    rules.push({ ast, declarations: Object.fromEntries(rule.nodes.map(n => [n.prop, n.value])) });
  });
  const el = (attrs, parent) => ({ attrs, parent });
  const themes = ['light', 'paper', 'dark', 'blueprint', 'blueprint-night'];
  const style = node => Object.assign({}, ...rules.filter(r => matches(r.ast, node)).map(r => r.declarations));
  for (const name of themes) for (const part of ['code', 'folio']) {
    const root = el({ 'data-prism-theme': name }), target = el({ class: `bp-inline-${part}` }, root);
    const expected = name.startsWith('blueprint') ? { [part === 'code' ? 'margin-inline-end' : 'margin-inline-start']: '12px' } : {};
    assert.deepEqual(style(target), expected);
    for (const core of themes.slice(0, 3)) {
      const local = el({ 'data-agent-preview': '', 'data-prism-theme': core, class: `bp-inline-${part}` }, root);
      assert.deepEqual(style(local), {});
      assert.deepEqual(style(el({ class: `bp-inline-${part}` }, local)), {});
    }
  }
});
test('P127 source compatibility removes only exact authorized slot/demo hunks, preserving all older source freezes', () => {
  for (const path of p127SourceFiles) {
    const current = read(path), base = path.endsWith('demos/blueprint-title-slots.tsx') ? '' : oldSource(path);
    assert.equal(restoreP127(path, current), base);
    assert.notEqual(restoreP127(path, current + '\n// unrelated edit\n'), base);
  }
  const path = 'components/prism-next/textbook-directory.tsx';
  assert.throws(() => restoreP127(path, read(path).replace('{props.headingLeading}{volume}', '{volume}{props.headingLeading}')));
});
