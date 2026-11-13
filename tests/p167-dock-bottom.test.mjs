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
const source = 'components/prism-next/paper-preview-surface.tsx';
const cssPath = 'components/prism-next/review-workspace.css';
const baseline = '86ce19a7af32f86422b7f8bd465a2202ee4604f4';
const before = path => execFileSync('git', ['show', `${baseline}:${path}`], { cwd: root, encoding: 'utf8' });
const runtime = await createTestRuntime('p167');

async function bundle(useBaseline) {
  const output = new URL(useBaseline ? 'before.mjs' : 'after.mjs', runtime);
  const result = await build({
    stdin: { contents: `export { PaperPreviewSurface } from './${source}';`, loader: 'tsx', resolveDir: root },
    bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external',
    alias: { '@': root }, loader: { '.css': 'empty' }, write: false,
    plugins: useBaseline ? [{
      name: 'p167-baseline',
      setup(builder) {
        builder.onLoad({ filter: /paper-preview-surface\.tsx$/ }, () => ({ contents: before(source), loader: 'tsx' }));
      },
    }] : [],
  });
  writeFileSync(output, result.outputFiles[0].text);
  return import(output);
}

const old = await bundle(true);
const current = await bundle(false);
const props = {
  viewportRef: { current: null }, toolbarRef: { current: null },
  children: React.createElement('div', { 'data-review-page': 0 }, '扫描内容'),
  toolbar: React.createElement('nav', {}, '宿主工具'),
};
const render = (api, extra = {}) => renderToStaticMarkup(React.createElement(api.PaperPreviewSurface, { ...props, ...extra }));

for (const dock of [undefined, 'side']) {
  test(`P167 ${dock ?? 'omitted'} SSR matches 86ce19a byte for byte`, () => {
    for (const extra of [
      {},
      { missing: true, emptyImageText: '尚未提供', emptyImageDetail: '宿主说明' },
      { toolbar: null },
      { scale: 0.5, bottomInset: 88, topInset: 40, scanOnly: true },
      { className: 'host-canvas', id: 'paper', overlay: React.createElement('output', {}, '浮层'), decoration: React.createElement('aside', {}, '装饰') },
    ]) {
      const actual = render(current, { ...extra, dock });
      assert.equal(actual, render(old, extra));
      assert.doesNotMatch(actual, /data-dock|dock="side"/);
    }
  });
}

test('P167 bottom SSR has two opt-in markers and only bottom positioning', () => {
  for (const extra of [{}, { scale: 0.5, bottomInset: 88 }, { scale: 0, bottomInset: 12 }, { missing: true }]) {
    const html = render(current, { ...extra, dock: 'bottom' });
    assert.equal(html.match(/data-dock="bottom"/g)?.length, 2);
    assert.match(html, /class="d1-tool-dock rounded-\[10px\] shadow-lg"/);
    assert.doesNotMatch(html, /rounded-r-xl|top:|max-height:/);
    assert.ok(html.includes(`style="left:50%;bottom:${20 + (extra.bottomInset ?? 0) / (extra.scale || 1)}px"`));
  }
});

const css = readFileSync(root + cssPath, 'utf8');
const marker = '/* P167 · GR3 REV 0.2b bottom toolbar. The host applies scroll clearance. */\n';
const start = css.indexOf(marker);
const end = css.indexOf('@container (min-width:1800px)', start);
const bottomCss = css.slice(start + marker.length, end);

test('P167 CSS scopes bottom geometry, scrolling, controls and host clearance', () => {
  assert.ok(start >= 0 && end > start);
  const rules = [...bottomCss.matchAll(/([^{}]+)\{([^{}]+)\}/g)];
  assert.ok(rules.length >= 9);
  for (const [, selectors] of rules) {
    for (const selector of selectors.split(',')) assert.match(selector, /\[data-dock="bottom"\]/);
  }
  assert.match(bottomCss, /\.d1-canvas\[data-dock="bottom"\] \{ --d1-dock-clearance:64px; \}/);
  assert.match(bottomCss, /transform:translateX\(-50%\); width:max-content; max-width:calc\(100% - 16px\); height:34px; clip-path:none; border-radius:10px/);
  assert.match(bottomCss, /overflow-x:auto; overflow-y:hidden; scrollbar-width:none/);
  assert.match(bottomCss, /\[data-slot="toolbar"\] \{ flex-direction:row; align-items:center; gap:2px; padding:2px 6px; width:max-content/);
  assert.match(bottomCss, /\[data-slot="toggle-group"\] \{ flex-direction:row; width:auto; gap:0; align-items:center/);
  assert.match(bottomCss, /\[data-slot="toolbar-separator"\] \{ width:1px; height:16px; margin:0 4px/);
  assert.match(bottomCss, /button \{ width:28px; height:28px; min-width:28px; min-height:28px; padding:0/);
  assert.match(bottomCss, /button svg \{ width:15px; height:15px; \}/);
  assert.match(bottomCss, /output \{ min-width:40px; text-align:center; font-size:var\(--text-ui-meta\); line-height:28px/);
  assert.doesNotMatch(bottomCss, /!important|padding-bottom/);
});

test('P167 CSS retains every side rule apart from excluding bottom from the 72px reservation', () => {
  const selector = '.d1-canvas:not([data-dock="bottom"]):has(> .d1-tool-dock > .d1-tool-scroll:not(:empty))';
  assert.ok(css.includes(selector + ' > .d1-paper-host .d1-continuous[data-digital-paper] { width:calc(100% - 72px); }'));
  assert.equal((css.slice(0, start) + css.slice(end)).replace(selector, '.d1-canvas:has(> .d1-tool-dock > .d1-tool-scroll:not(:empty))'), before(cssPath));
  assert.equal(readFileSync(root + 'components/prism-next/paper-preview-layout.ts', 'utf8'), before('components/prism-next/paper-preview-layout.ts'));
});
