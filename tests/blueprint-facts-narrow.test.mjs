import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createTestRuntime } from './helpers/test-runtime.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = readFileSync(root + 'components/prism-next/blueprint/blueprint.tsx', 'utf8');
const css = readFileSync(root + 'app/(next)/next/blueprint.css', 'utf8');
const runtime = await createTestRuntime('p82-facts');
const bundle = await build({ stdin: { contents: source, resolveDir: root + 'components/prism-next/blueprint', loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, write: false });
const file = new URL('facts.mjs', runtime);
writeFileSync(file, bundle.outputFiles[0].text);
const api = await import(file);
const names = ['BpFacts', 'BpTitleBlock'];
const classes = ['bp-facts', 'bp-titleblock'];
const widths = [280, 360, 480, 481, 640, 1000];

// Parsed declaration/track arithmetic contract, NOT a browser layout engine.
// Exact selectors keep theme-specific or viewport-specific regressions visible.
function declarations(text, selector, width) {
  const result = {};
  postcss.parse(text).walkRules(rule => {
    if (rule.selector !== selector) return;
    if (rule.parent.type !== 'root') {
      assert.equal(rule.parent.name, 'container');
      const query = rule.parent.params.match(/^bp-fact-layout \(max-width:(\d+)px\)$/);
      assert.ok(query, rule.parent.params);
      if (width > Number(query[1])) return;
    }
    for (const d of rule.nodes) if (d.type === 'decl') result[d.prop] = d.value;
  });
  return result;
}
function contract(text = css) {
  assert.equal(declarations(text, '.bp-fact-container', 280).container, 'bp-fact-layout / inline-size');
  assert.equal(declarations(text, '.bp-fact-container', 280)['min-width'], '0');
  for (const width of widths) for (const count of [2, 3, 4, 5]) for (const cls of classes) {
    const grid = { ...declarations(text, '.' + cls, width), ...declarations(text, '.bp-facts,.bp-titleblock', width) };
    const cell = declarations(text, '.bp-facts > div,.bp-titleblock > div', width);
    const tail = declarations(text, '.bp-facts > div:last-child:nth-child(odd),.bp-titleblock > div:last-child:nth-child(odd)', width);
    assert.equal(cell['min-width'], '0');
    assert.equal(cell['overflow-wrap'], 'anywhere');
    assert.equal(grid['grid-auto-columns'], 'minmax(0,1fr)');
    const narrow = width <= 480;
    assert.equal(grid['grid-auto-flow'], narrow ? 'row' : 'column');
    assert.equal(grid['grid-template-columns'], narrow ? 'repeat(2,minmax(0,1fr))' : undefined);
    assert.equal(tail['grid-column'], narrow ? '1 / -1' : undefined);
    const columns = grid['grid-auto-flow'] === 'row' ? 2 : count;
    // Track arithmetic excludes intrinsic text measurement, which needs a browser.
    const trackWidth = width / columns;
    for (let i = 0; i < count; i++) {
      const col = i % columns;
      const span = narrow && count % 2 && i === count - 1 ? 2 : 1;
      assert.ok((col + span) * trackWidth <= width + 0.001, 'declared tracks must not overflow horizontally');
      assert.ok(trackWidth > (cls === 'bp-facts' ? 32 : 28), 'padding leaves positive content width');
    }
  }
  assert.equal(declarations(text, '.bp-facts > div:not(:last-child)', 1000)['border-right'], '1px solid var(--border)');
  assert.equal(declarations(text, '.bp-facts > div:nth-child(even)', 280)['border-right'], '0');
  assert.equal(declarations(text, '.bp-facts > div:nth-child(odd)', 280)['padding-left'], '0');
  assert.equal(declarations(text, '.bp-titleblock > div', 280)['box-shadow'], '1px 0 0 var(--line), 0 1px 0 var(--line)');
  assert.equal(declarations(text, '.bp-facts dt', 280)['font-variant-numeric'], 'tabular-nums');
  assert.equal(declarations(text, '.bp-facts dt', 280)['font-size'], 'var(--text-stat-display)');
}
for (const name of names) test(`${name}: SSR keeps definition pairs, caller class and independent container for 2/3/4/5 items`, () => {
  for (const count of [2, 3, 4, 5]) {
    const items = Array.from({ length: count }, (_, i) => ({ id: String(i), label: '长中文标签需要完整呈现'.repeat(6), value: `12345678901234567890-${i}` }));
    const html = renderToStaticMarkup(React.createElement(api[name], { items, className: 'mt-5' }));
    assert.match(html, /^<div class="bp-fact-container"><dl class="bp-(?:facts|titleblock) mt-5">/);
    assert.equal((html.match(/<div><dt>/g) ?? []).length, count);
    assert.equal((html.match(/<dd>/g) ?? []).length, count);
    assert.ok(html.includes(items.at(-1).value));
    assert.ok(html.includes(items.at(-1).label));
    assert.match(html, /<\/dl><\/div>$/);
  }
});
test('both layouts: container boundary, 2/3/4/5 items, track overflow guards and single separators', () => contract());
test('layout contracts detect independent rollback mutations in memory', () => {
  const mutations = [
    ['container removed', 'container:bp-fact-layout / inline-size;', ''],
    ['viewport regression', '@container bp-fact-layout (max-width:480px)', '@media (max-width:480px)'],
    ['threshold shifted', 'max-width:480px', 'max-width:640px'],
    ['single column', 'repeat(2,minmax(0,1fr))', 'repeat(1,minmax(0,1fr))'],
    ['intrinsic tracks', 'grid-auto-columns:minmax(0,1fr)', 'grid-auto-columns:1fr'],
    ['tail half-cell', 'grid-column:1 / -1;', 'grid-column:auto;'],
    ['unbreakable value', '.bp-facts > div,.bp-titleblock > div { min-width:0; overflow-wrap:anywhere;', '.bp-facts > div,.bp-titleblock > div { min-width:0; overflow-wrap:normal;'],
    ['cell intrinsic minimum', '.bp-facts > div,.bp-titleblock > div { min-width:0;', '.bp-facts > div,.bp-titleblock > div { min-width:auto;'],
    ['double separator', '.bp-facts > div:nth-child(even) { border-right:0;', '.bp-facts > div:nth-child(even) { border-right:1px solid var(--border);'],
  ];
  for (const [name, from, to] of mutations) {
    assert.ok(css.includes(from), name);
    assert.throws(() => contract(css.replace(from, to)), undefined, name);
  }
});
