import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { createTestRuntime } from './helpers/test-runtime.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = await createTestRuntime('p178');
const baseline = '38e4b6e669b19314855670e9c17c15b54e2a0735';
async function load(old) {
  const result = await build({
    entryPoints: [root + 'components/prism-next/blueprint/blueprint.tsx'],
    bundle: true, jsx: 'automatic', platform: 'node', format: 'esm',
    packages: 'external', alias: { '@': root }, write: false,
    plugins: old ? [{ name: 'main-baseline', setup(b) {
      b.onLoad({ filter: /blueprint\/blueprint\.tsx$/ }, () => ({
        contents: execFileSync('git', ['show', `${baseline}:components/prism-next/blueprint/blueprint.tsx`], { cwd: root, encoding: 'utf8' }), loader: 'tsx',
      }));
    } }] : [],
  });
  const file = new URL(old ? 'main.mjs' : 'current.mjs', runtime);
  writeFileSync(file, result.outputFiles[0].text);
  return import(file);
}
const current = await load(false), main = await load(true), h = React.createElement;
test('P178 page frame omits rulers and inner frame while preserving root and folio', () => {
  const html = render(h(current.BlueprintFrame, { active: true, narrowFrame: 'keep', folio: { kind: 'sheet', value: '17 / 20' } }, h('main', { id: 'page' }, '正文')));
  assert.doesNotMatch(html, /bp-frame-decoration|bp-ruler/);
  assert.match(html, /^<main id="page" class="bp-frame"/);
  assert.match(html, /data-narrow-frame="keep"/);
  assert.match(html, /SHEET 17 \/ 20/);
});
test('P178 canvas frame retains decoration and exact main SSR', () => {
  const props = { active: true, className: 'example bp-frame--canvas', folio: { kind: 'sheet', value: '17 / 20' } };
  const draw = api => render(h(api.BlueprintFrame, props, h('div', null, '画布')));
  assert.match(draw(current), /bp-frame-decoration/);
  assert.equal(draw(current), draw(main));
});
test('P178 BlueprintSheet rulers SSR remains byte-identical to main', () => {
  const props = { title: '图纸', rulers: true, letter: 'A', sheetNo: '01 / 05' };
  const draw = api => render(h(api.BlueprintSheet, props, h('p', null, '正文')));
  assert.match(draw(current), /bp-ruler/);
  assert.equal(draw(current), draw(main));
});
