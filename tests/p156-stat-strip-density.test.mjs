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
const source = 'components/prism-next/blueprint/blueprint.tsx';
const runtime = await createTestRuntime('p156');
const h = React.createElement;
async function bundle(baseline) {
  const file = new URL(baseline ? 'before.mjs' : 'after.mjs', runtime);
  const result = await build({
    stdin: { contents: `export { BpStat, BpStatStrip } from './${source}';`, loader: 'tsx', resolveDir: root },
    bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, write: false,
    plugins: baseline ? [{ name: 'baseline-ec18900', setup(b) {
      b.onLoad({ filter: /blueprint\/blueprint\.tsx$/ }, () => ({ contents: execFileSync('git', ['show', `ec18900:${source}`], { cwd: root, encoding: 'utf8' }), loader: 'tsx' }));
    } }] : [],
  });
  writeFileSync(file, result.outputFiles[0].text);
  return import(file);
}
const before = await bundle(true);
const after = await bundle(false);
const themes = ['light', 'paper', 'dark', 'blueprint', 'blueprint-night'];
const render = (api, theme, props, count, layout) => renderToStaticMarkup(h('div', { 'data-prism-theme': theme },
  h(api.BpStatStrip, props, Array.from({ length: count }, (_, index) => h(api.BpStat, { key: index, label: `指标 ${index}`, value: index, size: 'metric', layout })))));
for (const theme of themes) {
  test(`P156 ${theme}: default strip SSR equals ec18900 bytes`, () => {
    for (const frame of [undefined, 'default', 'subtle', 'none']) for (const layout of ['stack', 'inline']) for (const count of [1, 2, 3, 4, 5]) {
      const props = { frame, id: 'facts', className: 'host-strip', 'aria-label': '指标', 'data-host': 'facts' };
      const expected = render(before, theme, props, count, layout);
      for (const density of [undefined, 'default']) {
        const actual = render(after, theme, { ...props, density }, count, layout);
        assert.equal(actual, expected);
        assert.doesNotMatch(actual, /data-density/);
      }
    }
  });
  test(`P156 ${theme}: compact preserves frames and native attributes`, () => {
    for (const frame of ['default', 'subtle', 'none']) {
      const html = render(after, theme, { density: 'compact', frame, id: 'facts', className: 'host-strip', 'aria-label': '指标', 'data-host': 'facts' }, 4, 'stack');
      assert.match(html, /data-density="compact"/);
      assert.match(html, /class="bp-stat-strip host-strip"/);
      assert.match(html, /id="facts"/);
      assert.match(html, /aria-label="指标"/);
      assert.match(html, /data-host="facts"/);
      assert.match(html, /text-stat-display/);
      if (frame === 'default') assert.doesNotMatch(html, /data-frame/);
      else assert.ok(html.includes(`data-frame="${frame}"`));
    }
  });
}

test('P156 compact CSS scopes geometry and thresholds to opt-in strips', () => {
  const css = readFileSync(new URL('../app/(next)/next/blueprint.css', import.meta.url), 'utf8');
  const compact = css.slice(css.indexOf('/* P156'), css.indexOf('.bp-stat-reading-row'));
  assert.match(compact, /\.bp-stat-strip\[data-density="compact"\] \{ grid-template-columns:repeat\(4,minmax\(0,1fr\)\); \}/);
  for (const [threshold, columns] of [[400, 'repeat(2,minmax(0,1fr))'], [240, 'minmax(0,1fr)']]) {
    const query = `@container bp-stat-layout (width < ${threshold}px) {\n  .bp-stat-strip[data-density="compact"] { grid-template-columns:${columns}; }\n}`;
    assert.ok(compact.includes(query));
  }
  for (const match of compact.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    for (const selector of match[1].trim().split(',')) assert.ok(selector.trim().startsWith('.bp-stat-strip[data-density="compact"]'), selector);
  }
  assert.match(compact, /last-child:nth-child\(n\)/);
  assert.match(compact, /nth-last-child\(2\):nth-child\(n\)/);
  assert.match(compact, /grid-column:auto; padding:10px 12px; row-gap:4px/);
  assert.match(compact, /margin-bottom:4px/);
  assert.doesNotMatch(compact, /font-size|box-shadow|border:/);
  const baseline = execFileSync('git', ['show', 'ec18900:app/(next)/next/blueprint.css'], { cwd: root, encoding: 'utf8' });
  const unitSelect = css.slice(css.indexOf('/* P160'), css.indexOf('.bp-draft-root {'));
  assert.ok(unitSelect.startsWith('/* P160'));
  // P161 moved the vertical column rules (rail right, inspector left) from L1 to L2; compare against the pre-P161 text.
  const columnRules = (text) => text.split('\n').map((line) =>
    /^:is\(\[data-prism-theme="blueprint"\],\[data-prism-theme="blueprint-night"\]\) \.d1-rail:not\(/.test(line) ? line.replace('{ border-right:1px solid var(--border); }', '{ border-right:1.5px solid var(--line); }')
    : /^:is\(\[data-prism-theme="blueprint"\],\[data-prism-theme="blueprint-night"\]\) \.d1-inspector:not\(/.test(line) ? line.replace('{ border-left:1px solid var(--border); }', '{ border-left:1.5px solid var(--line); }')
    : line).join('\n');
  // P164 adds exactly one opt-in muted-track rule.
  const mutedTrack = '.bp-size-track-muted .bp-size-bar { background:var(--muted); border:0; }\n';
  // P166 adds this exact joined block, including its reduced-motion rule.
  const joined = `/* Joined choices share a hairline frame. Layouts may set --bp-seg-cell for longer labels. */
.bp-seg-tabs[data-frame="joined"][data-orientation="horizontal"] {
  position:relative; display:inline-grid; grid-auto-flow:column; grid-auto-columns:1fr;
  gap:0; padding:0; border:0; border-radius:3px; background:var(--card);
}
.bp-seg-tabs[data-frame="joined"][data-orientation="horizontal"]::before {
  content:""; position:absolute; inset:0; border:1px solid light-dark(#d2dce5,var(--border));
  border-radius:inherit; pointer-events:none;
}
.bp-seg-tabs[data-frame="joined"][data-orientation="horizontal"] > button {
  position:relative; box-sizing:border-box; min-width:var(--bp-seg-cell,52px); min-height:30px; padding:0 8px;
  border:1px solid transparent; border-radius:2px; background:transparent;
  color:light-dark(#415163,var(--muted-foreground)); font-weight:400; line-height:1.25;
}
.bp-seg-tabs[data-frame="joined"][data-orientation="horizontal"] > button:first-child { border-start-start-radius:3px; border-end-start-radius:3px; }
.bp-seg-tabs[data-frame="joined"][data-orientation="horizontal"] > button:last-child { border-start-end-radius:3px; border-end-end-radius:3px; }
.bp-seg-tabs[data-frame="joined"][data-orientation="horizontal"] > button:is([aria-checked="false"],[aria-pressed="false"]):enabled:hover {
  background:light-dark(#f6faff,var(--accent)); color:var(--brand-blue-text);
}
.bp-seg-tabs[data-frame="joined"][data-orientation="horizontal"] > button:is([aria-checked="true"],[aria-pressed="true"]) {
  border-color:var(--brand-blue-text); background:light-dark(#f0f7ff,var(--brand-blue-tint));
  color:var(--brand-blue-text); font-weight:var(--text-item-title--font-weight);
}
.bp-seg-tabs[data-frame="joined"][data-orientation="horizontal"] > button:is([aria-checked="false"],[aria-pressed="false"]):disabled { color:var(--disabled-foreground); }
.bp-seg-tabs[data-frame="joined"][data-orientation="horizontal"] > button:focus-visible { outline-offset:-3px; }
@media (prefers-reduced-motion:no-preference) {
  .bp-seg-tabs[data-frame="joined"] > button { transition:background-color 110ms ease-out,color 110ms ease-out; }
}

`;
  assert.equal(css.split(joined).length, 2, 'P166 joined CSS block must occur exactly once');
  assert.equal(columnRules(css.replace(joined, '').replace(mutedTrack, '').replace('\n' + compact, '').replace(unitSelect, '')), baseline);
});
