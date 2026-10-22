import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { gunzipSync } from 'node:zlib';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createTestRuntime } from './helpers/test-runtime.mjs';
import { withoutPromptOpticalAlignment } from './helpers/p110-spacing.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = await createTestRuntime('p110');
const result = await build({ stdin: { contents: "export { AgentPromptBar } from './components/prism-next/agent-prompt-bar';", resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false });
const bundle = new URL('prompt.mjs', runtime);
await writeFile(bundle, result.outputFiles[0].text);
const { AgentPromptBar } = await import(bundle);
const base = { value: '保留长中文草稿与公式 f(x) = x²', onValueChange() {}, onIntent() {}, sources: [], commands: [], models: [], dictation: { state: 'idle' }, voice: { state: 'idle' } };
const render = props => renderToStaticMarkup(React.createElement(AgentPromptBar, { ...base, ...props }));
const wrapper = '<span class="flex size-11 shrink-0 items-center justify-center p-1">';
const fixtureUrl = new URL('./fixtures/p110/main-34e114c.json', import.meta.url);
const snapshots = JSON.parse(await readFile(fixtureUrl, 'utf8'));
for (const [index, snapshot] of snapshots.cases.entries()) test(`P110 geometry and exact baseline SSR ${index}`, () => {
  const html = render(snapshot.props);
  const before = gunzipSync(Buffer.from(snapshot.htmlGzipBase64, 'base64')).toString('utf8');
  assert.doesNotMatch(before, /-ml-1\.75/);
  const first = html.match(/<button\b[^>]*aria-label="添加附件与来源"[^>]*>/)?.[0];
  assert.ok(first);
  assert.match(first, /-ml-1\.75 sm:-ml-1\.5/);
  assert.match(first, /size-8 sm:size-7/);
  assert.doesNotMatch(html, /<span class="flex size-11 shrink-0 items-center justify-center p-1">/);
  let expected = before;
  if (before.includes(wrapper)) {
    assert.equal(before.split(wrapper).length, 2);
    expected = before.replace(new RegExp(wrapper + '(<button\\b[\\s\\S]*?</button>)</span>'), '$1');
    const primary = html.match(/<button\b[^>]*class="[^"]*size-9 sm:size-9[^>]*>/)?.[0];
    assert.ok(primary);
    for (const token of ['after:size-11', 'pointer-coarse:after:size-11', 'after:absolute', 'after:inset-1/2', 'after:-translate-x-1/2', 'after:-translate-y-1/2']) assert.ok(primary.includes(token), token);
  }
  assert.equal(withoutPromptOpticalAlignment(html), expected);
});
