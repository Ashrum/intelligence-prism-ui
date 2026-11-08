import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createTestRuntime } from './helpers/test-runtime.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = await createTestRuntime('p153');
const h = React.createElement;
const render = (component, props) => renderToStaticMarkup(h(component, props));
async function bundle(name, baseline = false) {
  const output = await build({ stdin: { contents: "export * from './components/prism-next/blueprint/blueprint'; export * from './components/prism-next/agent-mark';", loader: 'tsx', resolveDir: root }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false, plugins: baseline ? [{ name: 'baseline', setup(b) {
    b.onLoad({ filter: /prism-next\/blueprint\/.*\.tsx$/ }, args => ({ contents: execFileSync('git', ['show', `9204927:${args.path.slice(root.length)}`], { cwd: root, encoding: 'utf8' }), loader: 'tsx' }));
  } }] : [] });
  const url = new URL(`${name}.mjs`, runtime);
  writeFileSync(url, output.outputFiles[0].text);
  return import(url);
}
const before = await bundle('before', true);
const after = await bundle('after');
test('P153 all six states × three variants × three sizes are static and fully lit', () => {
  for (const [state, label] of Object.entries(after.agentMarkLabels)) for (const variant of ['Orbit', 'Drive', 'Dots']) for (const size of ['glyph', 'inline', 'loading']) {
    const html = render(after.AgentMark, { state, variant, size, startedAt: 0, endedAt: 65000 });
    assert.doesNotMatch(html, /agent-mark-glyph-pulse|animation|agent-mark-shimmer/);
    assert.equal((html.match(/opacity:1/g) ?? []).length, 9);
    assert.ok(html.includes(label)); assert.ok(html.includes(`data-state="${state}"`));
    if (size !== 'glyph') assert.match(html, /已用时 1 分 5 秒/);
  }
});
test('P153 answer kinds have distinct classes, default labels and child override', () => {
  for (const [kind, label, classes] of [['observe', '观察', 'border-foreground text-foreground'], ['explain', '解释 · 待核对', 'border-dashed border-muted-foreground text-muted-foreground'], ['suggest', '建议', 'border-foreground bg-foreground text-background']]) {
    const html = render(after.BpAnswerLabel, { kind });
    assert.ok(html.startsWith('<span')); assert.ok(html.includes(label)); assert.ok(html.includes(classes));
    assert.match(html, /text-ui-meta font-semibold/);
    assert.match(render(after.BpAnswerLabel, { kind, children: '自定义' }), />自定义<\/span>/);
  }
});
test('P153 provenance preserves item order, separators and trailing action', () => {
  const html = render(after.BpProvenanceLine, { items: [{ label: '依据', value: '作答' }, { value: '待核对' }], action: h('a', { href: '#run' }, '运行详情') });
  assert.equal((html.match(/ ｜ /g) ?? []).length, 2);
  assert.match(html, /依据：作答/);
  assert.ok(html.indexOf('作答') < html.indexOf('待核对'));
  assert.ok(html.indexOf('待核对') < html.indexOf('运行详情'));
  assert.match(html, /border-t border-border/);
  assert.doesNotMatch(render(after.BpProvenanceLine, { items: [], action: '运行详情' }), / ｜ /);
  assert.doesNotMatch(render(after.BpProvenanceLine, { items: [{ value: '单项' }] }), / ｜ /);
});
for (const theme of ['light', 'paper', 'dark', 'blueprint', 'blueprint-night']) test(`P153 ${theme}: existing exports SSR equal 9204927 bytes`, () => {
  for (const [name, props] of [['BpConclusion', { children: '结论' }], ['BpMark', { children: '重点' }], ['BpRef', { href: '#source', children: '①' }], ['BpProvenance', { items: [{ label: '依据', value: '作答' }] }]]) {
    assert.equal(renderToStaticMarkup(h('div', { 'data-prism-theme': theme }, h(after[name], props))), renderToStaticMarkup(h('div', { 'data-prism-theme': theme }, h(before[name], props))), name);
  }
});
