import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createTestRuntime } from './helpers/test-runtime.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = await createTestRuntime('p164');
const source = 'components/prism-next/blueprint/blueprint.tsx';
async function bundle(baseline) {
  const result = await build({
    stdin: { contents: `export { BpSizeBar } from './${source}';`, loader: 'tsx', resolveDir: root },
    bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, write: false,
    plugins: baseline ? [{ name: 'p164-baseline', setup(builder) {
      builder.onLoad({ filter: /blueprint\/blueprint\.tsx$/ }, () => ({
        contents: execFileSync('git', ['show', `a5d3a6d:${source}`], { cwd: root, encoding: 'utf8' }), loader: 'tsx',
      }));
    } }] : [],
  });
  const file = new URL(baseline ? 'before.mjs' : 'after.mjs', runtime);
  writeFileSync(file, result.outputFiles[0].text);
  return import(file);
}
const before = await bundle(true);
const after = await bundle(false);
const rows = [{ id: 'loss', label: '开口与图像变换', total: 17, display: '', segments: [{ id: 'lost', label: '失分', value: 12, fill: 'ai' }] }];
const render = (api, theme, props) => renderToStaticMarkup(React.createElement('div', { 'data-prism-theme': theme }, React.createElement(api.BpSizeBar, props)));
for (const theme of ['light', 'paper', 'dark', 'blueprint']) test(`P164 ${theme}: omitted/default track retains baseline bytes`, () => {
  for (const size of ['default', 'sm', 'xs']) {
    const props = { rows, size };
    const expected = render(before, theme, props);
    for (const track of [undefined, 'default']) {
      const actual = render(after, theme, { ...props, track });
      assert.equal(actual, expected);
      assert.doesNotMatch(actual, /bp-size-track-muted/);
    }
  }
});
test('P164 muted track adds only its root class for every size', () => {
  for (const size of ['default', 'sm', 'xs']) {
    const props = { rows, size };
    const html = renderToStaticMarkup(React.createElement(after.BpSizeBar, { ...props, track: 'muted' }));
    assert.match(html, /^<div class="[^"]*\bbp-size-track-muted\b/);
    assert.equal(html.replace(' bp-size-track-muted', ''), renderToStaticMarkup(React.createElement(after.BpSizeBar, props)));
  }
});
test('P164 muted track CSS is the sole added rule and follows xs geometry', () => {
  const path = 'app/(next)/next/blueprint.css';
  const css = readFileSync(root + path, 'utf8');
  const rule = '.bp-size-track-muted .bp-size-bar { background:var(--muted); border:0; }';
  assert.ok(css.includes(rule));
  assert.ok(css.indexOf(rule) > css.indexOf('.bp-size-xs .bp-size-bar {'));
  assert.ok(css.indexOf(rule) < css.indexOf('.bp-size-bar:has(> .bp-size-marker)'));
  assert.equal(css.replace(rule + '\n', ''), execFileSync('git', ['show', `a5d3a6d:${path}`], { cwd: root, encoding: 'utf8' }));
});
