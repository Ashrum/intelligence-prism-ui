import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { createTestRuntime } from './helpers/test-runtime.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const old = path => execFileSync('git', ['show', `2eb5c01:${path}`], { cwd: root, encoding: 'utf8' });
const paths = ['components/prism-next/agent-components.tsx', 'components/prism-next/knowledge-rail.tsx', 'components/prism-next/textbook-directory.tsx'];
async function api(baseline) {
  const file = new URL(`${baseline ? 'before' : 'after'}.mjs`, await createTestRuntime('p121-hidden'));
  const compiled = await build({ stdin: { contents: `export { AgentComposer } from './components/prism-next/agent-components'; export { ReviewRailFilter } from './components/prism-next/knowledge-rail'; export { TextbookDirectory } from './components/prism-next/textbook-directory'; export { DirectoryPresentation } from './components/prism-next/directory-presentation'; export { textbooks } from './lib/prism-next/textbook-directory';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false, plugins: baseline ? [{ name: 'p121-hidden-baseline', setup(b) { b.onLoad({ filter: /\.tsx$/ }, args => { const path = args.path.slice(root.length); if (paths.includes(path)) return { contents: old(path), loader: 'tsx' }; }); } }] : [] });
  writeFileSync(file, compiled.outputFiles[0].text);
  return import(file);
}
const before = await api(true), after = await api(false), h = React.createElement;
test('P121 hidden PromptBar label stays exact; ReviewRailFilter source stays byte for byte', () => {
  const path = 'components/prism-next/agent-prompt-bar.tsx';
  // P123 adds an opt-in rich strip; its 280 full SSR comparisons guard old calls.
  // Keep this migration's fixed hidden label contract independently pinned.
  const labels = source => source.match(/<Label\b[^>]*>[\s\S]*?<\/Label>/g);
  const current = labels(readFileSync(root + path, 'utf8'));
  assert.equal(current?.length, 1);
  assert.deepEqual(current, labels(old(path)));
  const rail = 'components/prism-next/knowledge-rail.tsx';
  assert.equal(readFileSync(root + rail, 'utf8'), old(rail), rail);
});
for (const variant of ['compact', 'conversation']) test(`P121 hidden Composer ${variant} keeps original raw SSR across blockers and slots`, () => {
  for (const extra of [{}, { readOnly: true }, { sendDisabledReason: '等待确认' }, { running: true, onStop() {} }, { scope: h('span', null, '外部范围'), context: h('span', null, '外部上下文'), suggestions: h('span', null, '建议') }]) {
    const props = { variant, value: '原始草稿', onChange() {}, onSubmit() {}, ...extra };
    assert.equal(render(h(after.AgentComposer, props)), render(h(before.AgentComposer, props)));
  }
});
for (const multiSelect of ['always', 'toggle']) for (const titleAction of ['locate', 'select']) test(`P121 aria-label-only directory ${multiSelect}/${titleAction} keeps original raw SSR`, () => {
  const tree = api => h(api.DirectoryPresentation.Provider, { value: { kind: 'course', onKindChange() {} } }, h(api.TextbookDirectory, { textbooks: api.textbooks, selections: {}, onSelectionsChange() {}, layout: 'embedded', multiSelect, titleAction }));
  assert.equal(render(tree(after)), render(tree(before)));
});
