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
const cssPath = 'app/(next)/next/blueprint.css';
const baseline = '831af66b3995011d516c51506484a2e25ea9d4c9';
const runtime = await createTestRuntime('p166');
const before = path => execFileSync('git', ['show', `${baseline}:${path}`], { cwd: root, encoding: 'utf8' });

async function bundle(useBaseline) {
  const output = new URL(useBaseline ? 'before.mjs' : 'after.mjs', runtime);
  const result = await build({
    stdin: { contents: `export { BpSegTabs } from './${source}';`, loader: 'tsx', resolveDir: root },
    bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external',
    alias: { '@': root }, write: false,
    plugins: useBaseline ? [{
      name: 'p166-baseline',
      setup(builder) {
        builder.onLoad({ filter: /blueprint\/blueprint\.tsx$/ }, () => ({ contents: before(source), loader: 'tsx' }));
      },
    }] : [],
  });
  writeFileSync(output, result.outputFiles[0].text);
  return import(output);
}
const old = await bundle(true);
const current = await bundle(false);
const props = {
  label: '学科', value: 'math', onValueChange() {},
  items: [{ value: 'math', label: '数学' }, { value: 'physics', label: '物理' }, { value: 'english', label: '英语', disabled: true }],
};
const render = (api, extra) => renderToStaticMarkup(React.createElement(api.BpSegTabs, { ...props, ...extra }));

test('P166 joined renders its data-frame and preserves choice semantics', () => {
  const html = render(current, { frame: 'joined' });
  assert.match(html, /data-frame="joined"/);
  assert.match(html, /role="radiogroup"/);
  assert.equal(html.replace(' data-frame="joined"', ''), render(old, {}));
});

for (const frame of [undefined, 'default', 'subtle', 'none']) {
  test(`P166 ${frame ?? 'omitted'} SSR matches 831af66 byte for byte`, () => {
    for (const orientation of ['horizontal', 'vertical']) {
      assert.equal(render(current, { frame, orientation }), render(old, { frame, orientation }));
    }
  });
}

test('P166 joined CSS matches workbench lines 165–192 exactly and preserves existing CSS', () => {
  const workbench = readFileSync('/Users/OLE/HermesWork/ole-school-workbench--feat-grading-po-baseline/src/theme/blueprint.css', 'utf8');
  const expected = workbench.split('\n').slice(164, 192).join('\n') + '\n';
  const css = readFileSync(root + cssPath, 'utf8');
  const start = css.indexOf('/* Joined choices share a hairline frame.');
  const end = css.indexOf('\n.bp-steps {', start);
  assert.ok(start >= 0 && end > start);
  const actual = css.slice(start, end);
  assert.equal(actual, expected);
  assert.match(actual, /@media \(prefers-reduced-motion:no-preference\) \{\n  \.bp-seg-tabs\[data-frame="joined"\] > button \{ transition:background-color 110ms ease-out,color 110ms ease-out; \}\n\}/);
  assert.equal(css.slice(0, start) + css.slice(end + 1), before(cssPath));
});
