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
const source = 'components/prism-next/blueprint/blueprint.tsx';
const runtime = await createTestRuntime('p148');
const h = React.createElement;
async function bundle(baseline) {
  const file = new URL(baseline ? 'before.mjs' : 'after.mjs', runtime);
  const result = await build({
    stdin: { contents: `export { BpStat } from './${source}';`, loader: 'tsx', resolveDir: root },
    bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, write: false,
    plugins: baseline ? [{ name: 'baseline-51d2fe1', setup(b) {
      b.onLoad({ filter: /blueprint\/blueprint\.tsx$/ }, () => ({ contents: execFileSync('git', ['show', `51d2fe1:${source}`], { cwd: root, encoding: 'utf8' }), loader: 'tsx' }));
    } }] : [],
  });
  writeFileSync(file, result.outputFiles[0].text);
  return import(file);
}
const before = await bundle(true), after = await bundle(false);
const themes = ['light', 'paper', 'dark', 'blueprint', 'blueprint-night'];
const render = (api, theme, props) => renderToStaticMarkup(h('div', { 'data-prism-theme': theme }, h(api.BpStat, props)));
const facts = { label: '得分率', code: 'M01', value: '76.0', unit: '%', readout: { text: '+1 pp', tone: 'warn' }, delta: { text: '上次 75%', tone: 'accent' }, caption: '本校 74.2% · 有效 45 人', children: h('i', { 'data-chart': 'mini' }, '构成条'), help: h('button', { 'aria-label': '指标说明' }, '?') };
for (const theme of themes) {
  test(`P148 ${theme}: omitted and explicit default preserve 51d2fe1 SSR bytes`, () => {
    for (const layout of [undefined, 'stack', 'inline']) for (const state of ['available', 'unknown', 'insufficient']) for (const value of [0, '76.0', '', '等待记录']) {
      const props = { ...facts, layout, state, value };
      const expected = render(before, theme, props);
      for (const extra of [{}, { size: undefined }, { size: 'default' }]) assert.equal(render(after, theme, { ...props, ...extra }), expected);
    }
  });
  test(`P148 ${theme}: metric sizes, chart order, caption title and unavailable facts`, () => {
    for (const layout of ['stack', 'inline']) {
      const props = { ...facts, size: 'metric', layout };
      const html = render(after, theme, props);
      assert.match(html, /bp-stat-label text-ui-meta/);
      assert.match(html, /bp-stat-value text-stat-display tabular-nums/);
      assert.match(html, /bp-stat-unit text-ui-body/);
      assert.match(html, /class="bp-stat-caption min-w-0 truncate text-ui-meta" title="本校 74.2% · 有效 45 人"/);
      assert.ok(html.indexOf('bp-stat-value') < html.indexOf('data-chart'));
      assert.ok(html.indexOf('data-chart') < html.indexOf('bp-stat-caption'));
      for (const [state, text] of [['unknown', '未知'], ['insufficient', '数据不足']]) {
        const unavailable = render(after, theme, { ...props, state, value: 0 });
        assert.match(unavailable, new RegExp(`text-stat-display tabular-nums">${text}</span>`));
        assert.doesNotMatch(unavailable, /data-chart|bp-stat-unit|bp-stat-readout|bp-stat-delta|>0</);
        assert.match(unavailable, /title="本校 74.2% · 有效 45 人"/);
      }
      assert.doesNotMatch(render(after, theme, { ...props, children: undefined, caption: undefined }), /data-chart|bp-stat-caption/);
      assert.match(render(after, theme, { ...props, caption: h(React.Fragment, null, '有效 ', h('b', null, 45), ' 人') }), /title="有效 45 人"/);
    }
  });
}
