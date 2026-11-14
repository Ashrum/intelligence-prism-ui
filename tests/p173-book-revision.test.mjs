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
const runtime = await createTestRuntime('p173');
async function load(baseline = false) {
  const result = await build({
    stdin: { contents: `export * from './components/prism-next/page-tabs'; export * from './components/prism-next/textbook-directory'; export * from './components/prism-next/facet-filter'; export { EmbeddedTextbookDirectory } from './components/prism-next/textbook-directory-embedded'; export { textbooks } from './lib/prism-next/textbook-directory';`, resolveDir: root, loader: 'tsx' },
    bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, write: false, loader: { '.css': 'empty' },
    plugins: baseline ? [{ name: 'baseline', setup(builder) { builder.onLoad({ filter: /prism-next\/(page-tabs|textbook-directory|textbook-directory-embedded|facet-filter)\.tsx$/ }, ({ path: file }) => ({ contents: execFileSync('git', ['show', `b6749a5:${path.relative(root, file)}`], { encoding: 'utf8' }), loader: 'tsx' })); } }] : [],
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
const options = ['人教版', '北师大版'].flatMap(edition => ['2012', '2024'].flatMap(revision => ['七年级', '八年级', '九年级'].flatMap(grade => ['上册', '下册'].map(term => ({ id: `${edition}-${revision}-${grade}-${term}`, edition, revision, revisionNote: revision === '2024' ? '新教材' : undefined, grade, term, count: grade === '九年级' && term === '上册' ? 12 : 0 })))));
function propsFor(bookOptions = options, bookId = options.find(o => o.revision === '2024' && o.count > 0).id) {
  return { textbooks: bookOptions.map(o => ({ ...current.textbooks[0], id: o.id, edition: o.edition, volume: o.grade + o.term })), bookId, bookOptions, layout: 'embedded', headerStyle: 'card' };
}
function rowsFor(props, module = current) { return capture(module.EmbeddedTextbookDirectory, props).filter(n => n.type === module.FacetRow); }
test('P173 scoped standard surface; shared FacetFilter source and CSS unchanged', async () => {
  const css = await readFile('components/prism-next/textbook-directory-embedded.css', 'utf8');
  assert.match(css, /\.bp-textbook-picker \.bp-textbook-picker-rows > \.facet-filter-panel \{ background:none; border:0; border-radius:0; box-shadow:none; padding:0; \}/);
  assert.ok(capture(current.EmbeddedTextbookDirectory, propsFor()).some(n => n.props.className === 'facet-filter bp-textbook-picker-rows'));
  for (const file of ['components/prism-next/facet-filter.tsx', 'components/prism-next/facet-filter.css']) assert.equal(await readFile(file, 'utf8'), execFileSync('git', ['show', `b6749a5:${file}`], { encoding: 'utf8' }));
  const props = { dimensions: [{ id: 'edition', label: '版本', mode: 'single', options: [{ id: 'a', label: '人教版', count: 5 }] }], value: { filters: {}, sort: '', search: '', favoritesOnly: false }, sortItems: [], resultCount: 5, onIntent() {} };
  for (const appearance of ['panel', 'rows']) assert.equal(render(current.FacetFilter, { ...props, appearance }), render(baseline.FacetFilter, { ...props, appearance }));
});
test('P173 revisions appear only for current edition, distinct descending labels and footer', () => {
  const props = propsFor(); const rows = rowsFor(props);
  assert.deepEqual(rows.map(r => r.props.dimension.label), ['版本', '版次', '年级', '学期']);
  assert.deepEqual(rows[0].props.dimension.options.map(o => o.label), ['人教版', '北师大版']);
  assert.deepEqual(rows[1].props.dimension.options.map(o => o.label), ['2024 新教材', '2012']);
  const footer = capture(current.EmbeddedTextbookDirectory, props).find(n => n.type === 'p' && n.props.className === 'text-ui-meta text-muted-foreground');
  assert.match(renderToStaticMarkup(footer), /人教版（2024） · 九年级上册/);
  const one = options.filter(o => o.edition !== '人教版' || o.revision === '2024');
  assert.deepEqual(rowsFor(propsFor(one)).map(r => r.props.dimension.id), ['edition', 'grade', 'term']);
});
test('P173 exact counts, disabled zero choices, positive switching and revision preservation', () => {
  const changed = []; const rows = rowsFor({ ...propsFor(), onBookChange: id => changed.push(id) });
  for (const row of rows) for (const option of row.props.dimension.options) {
    const expected = row.props.dimension.id === 'grade' && option.id !== '九年级' || row.props.dimension.id === 'term' && option.id !== '上册' ? 0 : 12;
    assert.equal(option.count, expected);
    row.props.onIntent({ type: 'filter', values: [option.id] });
  }
  assert.deepEqual(changed, ['人教版-2024-九年级-上册', '北师大版-2024-九年级-上册', '人教版-2024-九年级-上册', '人教版-2012-九年级-上册', '人教版-2024-九年级-上册', '人教版-2024-九年级-上册']);
  assert.match(render(current.FacetRow, rows[2].props), /disabled=""/);
  const zero = options.map(o => ({ ...o, count: o.revision === '2012' ? 0 : o.count }));
  const revision = rowsFor(propsFor(zero))[1];
  assert.equal(revision.props.dimension.options[1].count, 0);
  assert.match(render(current.FacetRow, revision.props), /disabled=""/);
});
test('P173 edition fallback selects newest revision even when row is hidden; no grade or term fallback', () => {
  const books = [...options.filter(o => o.edition === '人教版' && o.revision === '2024'), ...options.filter(o => o.edition === '北师大版').map(o => ({ ...o, revision: o.revision === '2024' ? '2026' : '2020' }))];
  const changed = []; const props = { ...propsFor(books), onBookChange: id => changed.push(id) };
  const row = rowsFor(props)[0];
  assert.equal(row.props.dimension.options[1].count, 12);
  row.props.onIntent({ type: 'filter', values: ['北师大版'] });
  assert.deepEqual(changed, ['北师大版-2024-九年级-上册']);
  const missing = books.filter(o => !(o.edition === '北师大版' && o.revision === '2026' && o.grade === '九年级' && o.term === '上册'));
  assert.equal(rowsFor(propsFor(missing))[0].props.dimension.options[1].count, 0);
});
test('P173 legacy three rows and footer byte parity with b6749a5', () => {
  const legacy = options.filter(o => o.revision === '2024').map(({ revision, revisionNote, ...o }) => o);
  const props = propsFor(legacy, legacy.find(o => o.count > 0).id);
  assert.equal(render(current.EmbeddedTextbookDirectory, props), render(baseline.EmbeddedTextbookDirectory, props));
  const rows = rowsFor(props), oldRows = rowsFor(props, baseline);
  assert.equal(rows.length, 3);
  rows.forEach((row, index) => assert.equal(render(current.FacetRow, row.props), render(baseline.FacetRow, oldRows[index].props)));
  const footer = module => capture(module.EmbeddedTextbookDirectory, props).find(n => n.type === 'p' && n.props.className === 'text-ui-meta text-muted-foreground');
  assert.equal(renderToStaticMarkup(footer(current)), renderToStaticMarkup(footer(baseline)));
});
for (const layout of ['embedded', 'header', 'split']) for (const headerStyle of ['card', 'default']) test(`P173 no bookOptions b6749a5 bytes ${layout}/${headerStyle}`, () => {
  const props = { textbooks: current.textbooks, layout, headerStyle, selections: {}, onSelectionsChange() {} };
  assert.equal(render(current.TextbookDirectory, props), render(baseline.TextbookDirectory, props));
});
