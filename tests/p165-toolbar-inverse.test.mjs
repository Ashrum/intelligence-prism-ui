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
const runtime = await createTestRuntime('p165');
const source = 'components/prism-next/toolbar.tsx';
const baseline = path => execFileSync('git', ['show', `ee81d92:${path}`], { cwd: root, encoding: 'utf8' });
async function bundle(before) {
  const result = await build({
    stdin: { contents: `export * from './${source}'; export { Button } from './components/prism-next/button';`, loader: 'tsx', resolveDir: root },
    bundle:true, jsx:'automatic', platform:'node', format:'esm', packages:'external', alias:{ '@':root }, write:false,
    loader:{ '.css':'empty' },
    plugins:before ? [{ name:'baseline', setup(builder) {
      builder.onLoad({ filter:/prism-next\/toolbar\.tsx$/ }, () => ({ contents:baseline(source), loader:'tsx' }));
    } }] : [],
  });
  const file = new URL(before ? 'before.mjs' : 'after.mjs', runtime);
  writeFileSync(file, result.outputFiles[0].text);
  return import(file);
}
const before = await bundle(true);
const after = await bundle(false);
const h = React.createElement;
const render = (api, variant, props = {}) => renderToStaticMarkup(h(api.Toolbar, { variant, 'aria-label':'批量操作', ...props },
  h('span', {}, '已选 3 道'),
  h(api.ToolbarButton, { disabled:true, render:h(api.Button, { variant:'outline' }) }, '加入讲评清单'),
  h(api.ToolbarButton, { render:h(api.Button, { variant:'outline' }) }, '加入试题篮'),
  h(api.ToolbarSeparator),
  h(api.ToolbarButton, { render:h(api.Button, { variant:'ghost' }) }, '取消选择 ×')));

test('P165 framed/plain SSR retain ee81d92 bytes', () => {
  for (const variant of [undefined, 'framed', 'plain']) for (const props of [{}, { orientation:'vertical', className:'host-toolbar', loopFocus:false }]) {
    assert.equal(render(after, variant, props), render(before, variant, props));
  }
});
test('P165 inverse reuses the plain Base UI Root and child semantics', () => {
  assert.equal(after.Toolbar({ variant:'inverse' }).type, after.Toolbar({ variant:'plain' }).type);
  const html = render(after, 'inverse');
  assert.match(html, /data-slot="toolbar"/);
  assert.match(html, /data-variant="inverse"/);
  assert.match(html, /role="toolbar"/);
  assert.match(html, /disabled=""/);
  assert.match(html, /data-slot="toolbar-separator"/);
  assert.equal(html.replace('prism-toolbar-inverse text-ui-body', 'relative flex gap-2').replace('data-variant="inverse"', 'data-variant="plain"'), render(after, 'plain'));
});
test('P165 styles are opt-in; existing shared styles remain byte-identical', () => {
  const css = readFileSync(root + 'components/prism-next/toolbar.css', 'utf8');
  assert.match(readFileSync(root + source, 'utf8'), /import "\.\/toolbar\.css"/);
  for (const selector of css.matchAll(/([^{}]+)\{/g)) {
    const value = selector[1].replace(/\/\*[^]*?\*\//g, '').trim();
    if (!value.startsWith('@') && !['from', 'to'].includes(value)) assert.ok(value.includes('[data-variant="inverse"]'), value);
  }
  assert.match(css, /box-shadow:4px 4px 0 var\(--brand-blue\)/);
  assert.match(css, /height:52px/);
  assert.match(css, /height:32px/);
  assert.match(css, /\.border-transparent \{ border:0; \}/);
  assert.match(css, /outline:2px solid var\(--background\)/);
  assert.match(css, /:hover:not\(:disabled\):not\(\[data-disabled\]\)/);
  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b|position:(?:fixed|sticky)|font-size:/i);
  for (const path of ['app/(next)/next/blueprint.css', 'app/(next)/next/motion.css', 'app/(next)/next/theme.css', 'components/coss/toolbar.tsx']) assert.equal(readFileSync(root + path, 'utf8'), baseline(path));
});
test('P165 entry motion stops under reduced motion', () => {
  const css = readFileSync(root + 'components/prism-next/toolbar.css', 'utf8');
  assert.match(css, /animation:prism-toolbar-inverse-enter 180ms/);
  assert.match(css, /from \{ opacity:0; transform:translateY\(8px\); \}/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{[^]*?animation:none/);
});
