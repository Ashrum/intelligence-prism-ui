import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createTestRuntime } from './helpers/test-runtime.mjs';
const root = process.cwd();
const runtime = await createTestRuntime('p172');
async function load(baseline = false) {
  const result = await build({
    stdin: { contents: `export * from './components/prism-next/page-tabs'; export * from './components/prism-next/textbook-directory'; export * from './components/prism-next/facet-filter'; export { EmbeddedTextbookDirectory } from './components/prism-next/textbook-directory-embedded'; export { textbooks } from './lib/prism-next/textbook-directory';`, resolveDir: root, loader: 'tsx' },
    bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, write: false, loader: { '.css': 'empty' },
    plugins: baseline ? [{ name: 'baseline', setup(builder) { builder.onLoad({ filter: /prism-next\/(page-tabs|textbook-directory|textbook-directory-embedded|facet-filter)\.tsx$/ }, ({ path: file }) => ({ contents: execFileSync('git', ['show', `cee6e0e:${path.relative(root, file)}`], { encoding: 'utf8' }), loader: 'tsx' })); } }] : [],
  });
  const file = new URL(baseline ? 'baseline.mjs' : 'current.mjs', runtime);
  await writeFile(file, result.outputFiles[0].text);
  return import(file.href);
}
const current = await load(), baseline = await load(true);
const render = (component, props) => renderToStaticMarkup(React.createElement(component, props));
const subject = { label: '初中数学', ariaLabel: '切换学科' };
const tabs = { 'aria-label': '资源栏目', items: [{ id: 'papers', label: '试卷库', href: '#papers' }] };
function capture(component, props) {
  const nodes = [];
  function inspect(node) {
    if (Array.isArray(node)) return node.map(inspect);
    if (!React.isValidElement(node)) return node;
    nodes.push(node);
    if (typeof node.type === 'function' && ['PageTabs', 'SubjectMenu', 'EmbeddedTextbookDirectory', 'BookPicker', 'BookCard'].includes(node.type.name)) return React.createElement(function Probe() { return inspect(node.type(node.props)); });
    return React.cloneElement(node, {}, React.Children.map(node.props.children, inspect));
  }
  renderToStaticMarkup(inspect(React.createElement(component, props)));
  return nodes;
}
test('P172 subject v3 mark, switch glyph, divider only with tabs', () => {
  for (const items of [tabs.items, []]) {
    const html = render(current.PageTabs, { ...tabs, items, subject });
    assert.match(html, /bp-page-tabs-subject-mark/);
    assert.match(html, /lucide-chevrons-up-down/);
    assert.doesNotMatch(html, /arrow-right-left/);
    assert.equal(html.includes('bp-page-tabs-subject-divider'), items.length > 0);
  }
});
test('P172 no menu preserves button callback and static span', () => {
  let calls = 0;
  const props = { ...tabs, subject: { ...subject, onClick: () => calls++ } };
  const button = capture(current.PageTabs, props).find(node => node.type === 'button');
  button.props.onClick(); assert.equal(calls, 1);
  assert.match(render(current.PageTabs, { ...tabs, subject }), /<span class="bp-page-tabs-subject /);
});
test('P172 menu groups, radio values, tag, current check and muted marker are host supplied', async () => {
  let selected;
  const menu = { groups: [{ label: '任教学科', items: [{ id: 'math', label: '数学', current: true, tag: '默认' }] }, { label: '其他学科', items: [{ id: 'chinese', label: '语文', muted: true }] }], onSelect: id => { selected = id; } };
  const props = { ...tabs, subject: { ...subject, menu } };
  assert.match(render(current.PageTabs, props), /aria-haspopup="menu"/);
  const nodes = capture(current.PageTabs, props);
  const radio = nodes.find(node => node.props.value === 'math' && node.props.onValueChange);
  radio.props.onValueChange('chinese'); assert.equal(selected, 'chinese');
  assert.equal(nodes.filter(node => node.props.closeOnClick).length, 2);
  assert.equal(nodes.filter(node => node.props.className?.includes('subject-group')).length, 2);
  assert.ok(nodes.some(node => node.props.children === '默认'));
  assert.ok(nodes.some(node => node.props.className === 'bp-page-tabs-subject-check' && node.props.size === 16));
  assert.ok(nodes.some(node => node.props['data-muted'] === true && node.props['aria-hidden'] === 'true'));
  const source = await readFile('components/prism-next/page-tabs.tsx', 'utf8');
  assert.match(source, /MenuPrimitive.RadioItem/);
  assert.match(source, /menu.onSelect\(id\); setOpen\(false\)/);
});
test('P172 subject CSS retains ring, tab stretch and semantic font sizes', async () => {
  const css = await readFile('components/prism-next/page-navigation.css', 'utf8');
  assert.match(css, /\.bp-page-tabs--subject \{ align-items:center;/);
  assert.match(css, /a\.bp-page-tab \{ align-self:stretch;/);
  assert.match(css, /subject-divider \{ width:1px; height:20px;/);
  assert.match(css, /subject:focus-visible \{ outline:2px solid var\(--ring\)/);
  assert.doesNotMatch(css, /font-size:\s*\d/);
});
for (const props of [tabs, { ...tabs, items: [], sticky: true }, { ...tabs, leading: '资源', actions: '添加' }]) {
  test(`P172 no subject byte parity ${JSON.stringify(props)}`, () => assert.equal(render(current.PageTabs, props), render(baseline.PageTabs, props)));
}
for (const layout of ['embedded', 'header', 'split']) for (const callback of [false, true]) {
  test(`P172 no bookOptions cee6e0e byte parity ${layout} callback=${callback}`, () => {
    const props = { textbooks: current.textbooks, layout, headerStyle: 'card', selections: {}, onSelectionsChange() {}, onTextbookSwitch: callback ? () => {} : undefined };
    assert.equal(render(current.TextbookDirectory, props), render(baseline.TextbookDirectory, props));
  });
}

const dimensions = [
  { id: 'edition', label: '版本', common: true, mode: 'single', options: [{ id: 'a', label: '人教版', count: 18 }, { id: 'b', label: '北师大版', count: 0 }] },
  { id: 'grade', label: '年级', mode: 'multiple', options: [{ id: '9', label: '九年级', count: 8 }, { id: '8', label: '八年级', count: 3 }] },
];
for (const full of [false, true]) for (const selected of [[], ['a']]) {
  test(`P172 FacetRow default cee6e0e bytes full=${full} selected=${selected}`, () => {
    const props = { dimension: dimensions[0], full, selected, onIntent() {} };
    assert.equal(render(current.FacetRow, props), render(baseline.FacetRow, props));
    assert.equal(render(current.FacetRow, { ...props, allOption: true }), render(baseline.FacetRow, props));
    const without = render(current.FacetRow, { ...props, allOption: false });
    assert.doesNotMatch(without, /全部/);
    assert.match(without, /北师大版/);
  });
}
for (const appearance of ['rows', 'panel']) for (const active of [false, true]) {
  test(`P172 FacetFilter cee6e0e bytes ${appearance} active=${active}`, () => {
    const props = { dimensions, appearance, value: { filters: active ? { edition: ['a'] } : {}, sort: 'recent', search: '', favoritesOnly: false }, sortItems: [{ id: 'recent', label: '最近' }], resultCount: 18, onIntent() {} };
    assert.equal(render(current.FacetFilter, props), render(baseline.FacetFilter, props));
  });
}
const options = ['人教版', '北师大版'].flatMap(edition => ['九年级', '七年级', '八年级'].flatMap(grade => ['下册', '上册'].map(term => ({ id: `${edition}-${grade}-${term}`, edition, grade, term, publisher: '人民教育出版社', count: edition === '人教版' && grade === '九年级' && term === '上册' ? 128 : 0 }))));
const selectedId = '人教版-九年级-上册';
function panelNodes(bookOptions = options, extra = {}) {
  return capture(current.EmbeddedTextbookDirectory, { textbooks: bookOptions.map(option => ({ ...current.textbooks[0], id: option.id, edition: option.edition, volume: option.grade + option.term })), bookId: selectedId, bookOptions, headerStyle: 'card', defaultBookId: selectedId, ...extra });
}
test('P172 textbook card is a Popover trigger; three single facets omit all, count and disable unavailable combinations', () => {
  const props = { textbooks: [{ ...current.textbooks[0], id: selectedId }], bookId: selectedId, headerStyle: 'card', bookOptions: options };
  const html = render(current.EmbeddedTextbookDirectory, props);
  assert.match(html, /data-slot="popover-trigger"/);
  assert.match(html, /aria-haspopup="dialog"/);
  assert.match(html, /aria-expanded="false"/);
  const nodes = panelNodes(options, { countUnit: '份试卷' });
  const popup = nodes.find(node => node.props.className === 'bp-textbook-picker');
  assert.equal(popup.props.side, 'bottom'); assert.equal(popup.props.align, 'start'); assert.equal(popup.props.sideOffset, 6);
  const rows = nodes.filter(node => node.type === current.FacetRow);
  assert.deepEqual(rows.map(row => row.props.dimension.label), ['版本', '年级', '学期']);
  assert.deepEqual(rows[1].props.dimension.options.map(option => option.label), ['七年级', '八年级', '九年级']);
  assert.deepEqual(rows[2].props.dimension.options.map(option => option.label), ['上册', '下册']);
  for (const row of rows) {
    assert.equal(row.props.panel, true); assert.equal(row.props.allOption, false); assert.equal(row.props.dimension.mode, 'single');
    for (const option of row.props.dimension.options) assert.equal(option.count, row.props.selected.includes(option.id) ? 128 : 0);
    const html = render(current.FacetRow, row.props);
    assert.doesNotMatch(html, /全部|多选|更多/);
    assert.match(html, /disabled=""/); assert.match(html, /128 份试卷/);
  }
});
test('P172 textbook facet selects the exact positive-count combination and ignores zero or absent combinations', () => {
  const available = [...options.filter(option => option.id !== '北师大版-七年级-上册'), { id: 'new-edition', edition: '新版本', grade: '九年级', term: '上册', count: 9 }];
  const changed = []; let legacy = 0;
  const rows = panelNodes(available, { onBookChange: id => changed.push(id), onTextbookSwitch: () => legacy++ }).filter(node => node.type === current.FacetRow);
  rows[0].props.onIntent({ type: 'filter', values: ['新版本'] });
  rows[0].props.onIntent({ type: 'filter', values: ['北师大版'] });
  rows[0].props.onIntent({ type: 'filter', values: ['不存在'] });
  rows[0].props.onIntent({ type: 'filter', values: [] });
  assert.deepEqual(changed, ['new-edition']); assert.equal(legacy, 0);
});
for (const publisher of [true, false]) for (const isDefault of [true, false]) {
  test(`P172 textbook footer publisher=${publisher} default=${isDefault}`, () => {
    const nodes = panelNodes(options.map(option => ({ ...option, publisher: publisher ? option.publisher : undefined })), { defaultBookId: isDefault ? selectedId : 'another', countUnit: '份试卷' });
    const footer = nodes.find(node => node.type === 'p' && node.props.className === 'text-ui-meta text-muted-foreground');
    const html = renderToStaticMarkup(footer);
    assert.match(html, /人教版 · 九年级上册/); assert.match(html, /128 份试卷/);
    assert.equal(html.includes('人民教育出版社'), publisher); assert.equal(html.includes('任教默认'), isDefault);
  });
}

for (const layout of ['header', 'split']) {
  test(`P172 bookOptions ignored outside card embedded: ${layout}`, () => {
    const props = { textbooks: current.textbooks, layout, headerStyle: 'card', selections: {}, onSelectionsChange() {} };
    assert.equal(render(current.TextbookDirectory, { ...props, bookOptions: options, defaultBookId: selectedId }), render(baseline.TextbookDirectory, props));
  });
}
test('P172 missing book combination counts as zero while other dimensions retain values', () => {
  const incomplete = options.filter(option => option.id !== '北师大版-九年级-上册');
  const row = panelNodes(incomplete).find(node => node.type === current.FacetRow && node.props.dimension.id === 'edition');
  assert.equal(row.props.dimension.options.find(option => option.id === '北师大版').count, 0);
});
