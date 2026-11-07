import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createTestRuntime } from './helpers/test-runtime.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = await createTestRuntime('p144');
const baseline = '4e5302a71a1096dc1dc80834556e05c60c10fd03';
async function load(baselineSource) {
  const bundle = await build({
    stdin: {
      contents: `export * from './components/prism-next/facet-filter';
export * from './components/prism-next/demos/fixtures/facet-filter';`,
      resolveDir: root, loader: 'tsx',
    },
    bundle: true, jsx: 'automatic', platform: 'node', format: 'esm',
    packages: 'external', alias: { '@': root }, write: false, loader: { '.css': 'empty' },
    plugins: baselineSource ? [{ name: 'p144-baseline', setup(builder) {
      builder.onLoad({ filter: /prism-next\/facet-filter(?:-types)?\.tsx?$/ }, ({ path }) => ({
        loader: 'tsx',
        contents: execFileSync('git', ['show', `${baseline}:${path.slice(root.length)}`], { cwd: root, encoding: 'utf8' }),
      }));
    } }] : [],
  });
  const file = new URL(baselineSource ? 'before.mjs' : 'after.mjs', runtime);
  await writeFile(file, bundle.outputFiles[0].text);
  return import(file);
}
const before = await load(true);
const after = await load(false);
function render(module, extra = {}, scale = 'future', theme = 'light') {
  return renderToStaticMarkup(React.createElement('div', { 'data-prism-theme': theme },
    React.createElement(module.FacetFilter, {
      dimensions: after.filterFixture(scale), value: after.previewFilterValue(scale),
      sortItems: after.filterSortItems, resultCount: 128, favoriteCount: 23, onIntent() {}, ...extra,
    })));
}

for (const theme of ['light', 'paper', 'dark']) {
  test(`P144 ${theme}: omitted and explicit true props preserve pinned baseline SSR bytes including IDs`, () => {
    for (const scale of ['current', 'future']) {
      const expected = render(before, {}, scale, theme);
      assert.equal(render(after, {}, scale, theme), expected);
      assert.equal(render(after, { results: true, collapsible: true }, scale, theme), expected);
    }
  });
}
test('P144 results=false hides sorting, result count, favorites and search while retaining collapse', () => {
  const html = render(after, { results: false });
  assert.doesNotMatch(html, /筛选结果工具栏|aria-label="排序"|共 128 题|在结果中搜索|我的收藏/);
  assert.match(html, />收起<\/button>/);
  assert.match(html, />重置<\/button>/);
});
test('P144 collapsible=false keeps facets expanded and reset available, retaining results', () => {
  for (const dimensions of [after.filterFixture('future'), after.filterFixture('future').map(d => ({ ...d, common: false })), []]) {
    const html = render(after, { collapsible: false, dimensions });
    assert.doesNotMatch(html, />收起<\/button>|>展开<\/button>|<div[^>]*id="[^"]*-facets"[^>]*hidden/);
    assert.match(html, />重置<\/button>/);
    assert.match(html, /筛选结果工具栏/);
  }
});
test('P144 both false retain common rows and all-filter entry', () => {
  const html = render(after, { results: false, collapsible: false });
  assert.match(html, /<legend[^>]*>题型<\/legend>/);
  assert.match(html, /<legend[^>]*>难度<\/legend>/);
  assert.match(html, /全部筛选/);
  assert.match(html, />重置<\/button>/);
  assert.doesNotMatch(html, /筛选结果工具栏|>收起<\/button>|>展开<\/button>|<div[^>]*id="[^"]*-facets"[^>]*hidden/);
});
