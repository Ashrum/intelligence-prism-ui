import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createTestRuntime } from './helpers/test-runtime.mjs';

const root = process.cwd();
const runtime = await createTestRuntime('p170-resources');
const sources = ['facet-filter.tsx', 'facet-filter-types.ts', 'textbook-directory.tsx', 'textbook-directory-embedded.tsx', 'page-tabs.tsx'];
async function load(baseline = false) {
  const result = await build({
    stdin: { contents: `export * from './components/prism-next/facet-filter';
export * from './components/prism-next/textbook-directory';
export * from './components/prism-next/page-tabs';
export * from './components/prism-next/difficulty-mix';
export { textbooks } from './lib/prism-next/textbook-directory';`, resolveDir: root, loader: 'tsx' },
    bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, write: false, loader: { '.css': 'empty' },
    plugins: baseline ? [{ name: 'p170-baseline', setup(builder) {
      builder.onLoad({ filter: /prism-next\/[^/]+\.(tsx|ts)$/ }, ({ path: file }) => {
        if (!sources.includes(path.basename(file))) return;
        return { contents: execFileSync('git', ['show', `7155a08:${path.relative(root, file)}`], { encoding: 'utf8' }), loader: file.endsWith('.tsx') ? 'tsx' : 'ts' };
      });
    } }] : [],
  });
  const file = new URL(baseline ? 'baseline.mjs' : 'current.mjs', runtime);
  await writeFile(file, result.outputFiles[0].text);
  const module = await import(file.href);
  await rm(file);
  return module;
}
const current = await load();
const baseline = await load(true);
const render = (component, props) => renderToStaticMarkup(React.createElement(component, props));
const value = { filters: {}, sort: 'all', favoritesOnly: false, search: '' };
const dimensions = Array.from({ length: 6 }, (_, index) => ({ id: `d${index}`, label: `维度${index}`, common: index < 2, mode: 'single', options: [{ id: 'a', label: '基础', count: 5, swatch: 'var(--brand-green)' }, { id: 'b', label: '提升', count: 0 }] }));
const filterProps = { dimensions, value, sortItems: [], onIntent() {} };
const tabsProps = { 'aria-label': '资源栏目', items: [{ id: 'papers', label: '试卷库', href: '#papers', count: 39 }], currentId: 'papers' };
const book = { ...current.textbooks[0], edition: '人教版', subject: '数学', volume: '九年级上册' };
const directoryProps = { textbooks: [book], selections: {}, onSelectionsChange() {} };

for (const [name, propsList] of [
  ['FacetFilter', [
    { ...filterProps, dimensions: dimensions.map(({ options, ...dimension }) => ({ ...dimension, options: options.map(({ swatch, ...option }) => option) })) },
    { ...filterProps, dimensions: [], results: false, collapsible: false },
    { ...filterProps, value: { ...value, filters: { d0: ['a'] }, search: '二次函数', favoritesOnly: true }, dimensions: dimensions.map(dimension => ({ ...dimension, mode: 'multiple', options: [{ id: 'a', label: '已选', count: 3 }] })), sortItems: [{ id: 'all', label: '综合' }], countUnit: '份试卷', resultCount: 39 },
  ]],
  ['TextbookDirectory', [
    { ...directoryProps, layout: 'embedded' }, { ...directoryProps, layout: 'embedded', allOption: {}, multiSelect: 'dialog' },
    { ...directoryProps, layout: 'header' }, { ...directoryProps, layout: 'split' },
    { ...directoryProps, textbooks: current.textbooks, layout: 'embedded', counts: {}, headingLeading: 'A' },
    { ...directoryProps, textbooks: [], layout: 'split' },
  ]],
  ['PageTabs', [tabsProps, { ...tabsProps, leading: '资源', actions: React.createElement('button', {}, '添加'), className: 'host-tabs' }, { ...tabsProps, items: [], currentId: undefined }]],
]) {
  propsList.forEach((props, index) => test(`7155a08 byte parity ${name} case ${index + 1}`, () => {
    assert.equal(render(current[name], props), render(baseline[name], props));
  }));
}

test('panel renders all six dimensions, header, single options and swatches without row tools or popup', () => {
  const html = render(current.FacetFilter, { ...filterProps, appearance: 'panel', results: false });
  assert.match(html, /class="facet-filter-panel-head"/);
  assert.equal((html.match(/data-dimension=/g) ?? []).length, 6);
  assert.doesNotMatch(html, /facet-filter-tools|全部筛选|多选|更多/);
  assert.match(html, /<button[^>]*disabled=""[^>]*>重置<\/button>/);
  assert.match(html, /class="facet-filter-swatch"[^>]*aria-hidden="true"/);
  assert.match(html, /aria-pressed="true"[^>]*aria-label="维度0：全部"/);
  assert.match(html, /disabled=""[^>]*aria-label="维度0：提升，0 题"/);
});

test('panel reset includes all filters, search and favorites; selected option is pressed', () => {
  for (const change of [{ filters: { d0: ['a'] } }, { search: '圆' }, { favoritesOnly: true }]) {
    const html = render(current.FacetFilter, { ...filterProps, appearance: 'panel', value: { ...value, ...change } });
    const reset = html.match(/<button[^>]*>重置<\/button>/)[0];
    assert.doesNotMatch(reset, /disabled/);
    if (change.filters) assert.match(html, /aria-pressed="true"[^>]*aria-label="维度0：基础，5 题"/);
  }
});

test('panel multiple input renders single selection; rows support optional swatches', () => {
  const html = render(current.FacetFilter, { ...filterProps, appearance: 'panel', results: false, dimensions: [{ ...dimensions[0], mode: 'multiple' }], value: { ...value, filters: { d0: ['a', 'b'] } } });
  assert.doesNotMatch(html, /多选/);
  assert.equal((html.match(/aria-pressed="true"/g) ?? []).length, 1);
  assert.match(render(current.FacetFilter, filterProps), /facet-filter-swatch/);
});

test('difficulty composition segments, zero state, accessible summary and palette', () => {
  assert.deepEqual(current.difficultySwatches, { basic: 'color-mix(in srgb, var(--brand-green) 75%, var(--brand-green-text))', consolidate: 'var(--brand-blue)', advance: 'var(--brand-blue-text)' });
  for (const [basic, consolidate, advance, segments] of [[5, 5, 2, 3], [0, 10, 2, 2]]) {
    const html = render(current.DifficultyMix, { basic, consolidate, advance });
    assert.ok(html.includes(`aria-label="难度构成：基础 ${basic} 题，巩固 ${consolidate} 题，提升 ${advance} 题"`));
    assert.equal((html.match(/<i /g) ?? []).length, segments);
    assert.equal((html.match(/aria-hidden="true"/g) ?? []).length, 2);
  }
  assert.match(render(current.DifficultyMix, { basic: 0, consolidate: 0, advance: 0 }), /难度未标注/);
});

// Capture the real owned component handlers under React SSR, as existing repository probes do.
// This does not simulate browser mounting, focus, pointer or keyboard dispatch.
function capture(component, props) {
  const nodes = [];
  const owned = new Set(['TextbookDirectory', 'EmbeddedTextbookDirectory', 'BookCard', 'KindTabs', 'PageTabs']);
  function inspect(node) {
    if (Array.isArray(node)) return node.map(inspect);
    if (!React.isValidElement(node)) return node;
    nodes.push(node);
    if (typeof node.type === 'function' && owned.has(node.type.name)) return React.createElement(function Probe() { return inspect(node.type(node.props)); });
    return React.cloneElement(node, {}, React.Children.map(node.props.children, inspect));
  }
  renderToStaticMarkup(inspect(React.createElement(component, props)));
  return nodes;
}

test('textbook card has accessible switch, short label, two tabs, and invokes host switch', () => {
  let calls = 0;
  const props = { ...directoryProps, layout: 'embedded', headerStyle: 'card', onTextbookSwitch: () => calls++ };
  const html = render(current.TextbookDirectory, props);
  assert.match(html, /<button[^>]*class="textbook-card"[^>]*aria-label="教材：人教版 九年级上册，切换教材"/);
  assert.match(html, /九上/);
  assert.doesNotMatch(html, />切换<\/button>/);
  assert.equal((html.match(/role="tab"/g) ?? []).length, 2);
  const button = capture(current.TextbookDirectory, props).find(node => node.type === 'button' && node.props.className === 'textbook-card');
  button.props.onClick();
  assert.equal(calls, 1);
  const staticHtml = render(current.TextbookDirectory, { ...directoryProps, layout: 'embedded', headerStyle: 'card' });
  assert.match(staticHtml, /<div class="textbook-card">/);
  assert.doesNotMatch(staticHtml, /textbook-card-switch/);
  for (const layout of ['header', 'split']) assert.equal(render(current.TextbookDirectory, { ...directoryProps, layout, headerStyle: 'card' }), render(current.TextbookDirectory, { ...directoryProps, layout }));
});

test('subject uses a button only for an action and sticky is opt-in', () => {
  let calls = 0;
  const subject = { label: '初中数学', ariaLabel: '切换学科', onClick: () => calls++ };
  const html = render(current.PageTabs, { ...tabsProps, subject, sticky: true });
  assert.match(html, /<button[^>]*aria-label="切换学科"/);
  assert.match(html, /bp-page-tabs--sticky/);
  assert.match(html, /bp-page-tabs-sentinel/);
  assert.doesNotMatch(html, /data-stuck/);
  const button = capture(current.PageTabs, { ...tabsProps, subject }).find(node => node.type === 'button');
  button.props.onClick();
  assert.equal(calls, 1);
  assert.match(render(current.PageTabs, { ...tabsProps, subject: { ...subject, onClick: undefined } }), /<span[^>]*class="bp-page-tabs-subject[^>]*aria-label="切换学科"/);
});

test('sticky observer checks the upper boundary, supports missing observer, and disconnects', async () => {
  const source = await readFile(path.join(root, 'components/prism-next/page-tabs.tsx'), 'utf8');
  assert.match(source, /typeof IntersectionObserver === "undefined"/);
  assert.match(source, /entry\.boundingClientRect\.bottom <=/);
  assert.match(source, /observer\.disconnect\(\)/);
});


test('card segmented TabsList removes the border and shadow only in card mode', async () => {
  const css = await readFile(path.join(root, 'components/prism-next/textbook-directory-embedded.css'), 'utf8');
  const rule = css.match(/\.textbook-card-tabs\[data-slot="tabs-list"\]\s*\{([^}]+)\}/);
  assert.ok(rule, 'card-only TabsList rule exists');
  assert.match(rule[1], /(?:^|;)\s*border:\s*0\s*;/);
  assert.match(rule[1], /(?:^|;)\s*box-shadow:\s*none\s*;/);
  assert.doesNotMatch(rule[1], /(?:^|;)\s*outline(?:-[\w-]+)?:/);
  const card = render(current.TextbookDirectory, { ...directoryProps, layout: 'embedded', headerStyle: 'card' });
  const standard = render(current.TextbookDirectory, { ...directoryProps, layout: 'embedded' });
  assert.match(card, /<[^>]*data-slot="tabs-list"[^>]*class="[^"]*textbook-card-tabs/);
  assert.doesNotMatch(standard, /textbook-card-tabs/);
});
