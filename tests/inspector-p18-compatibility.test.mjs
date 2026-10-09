import { assertControlSizingOnly } from './prism-control-sizing-compat.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { baselineCommit, buildApi, cases, demos, frozenPages, mainMarkup, undefinedProps, defaultProps, h, render, hash } from './inspector-p18-compatibility-harness.mjs';

const snapshot = JSON.parse(await readFile(new URL('./fixtures/inspector-p18-main-hashes.json', import.meta.url), 'utf8'));
assert.equal(snapshot.commit, baselineCommit);
const [main, current] = await Promise.all([buildApi(true), buildApi(false)]);
for (const [component, variants] of Object.entries(cases(main))) {
  for (const [name, props] of Object.entries(variants)) {
    test(`P18 original ${component} ${name}: omitted/undefined/default props keep main SSR apart from P31 control sizing`, () => {
      const original = render(h(main[component], props));
      assert.equal(hash(original), snapshot.components[component][name], 'executed pinned source matches captured baseline');
      assertControlSizingOnly(render(h(current[component], props)), original, 'new props omitted');
      assertControlSizingOnly(render(h(current[component], { ...props, ...undefinedProps[component] })), original, 'new props undefined');
      assertControlSizingOnly(render(h(current[component], { ...props, ...defaultProps[component] })), original, 'new props explicit defaults');
    });
  }
}
for (const name of demos) {
  test(`P18 existing ${name} keeps main SSR apart from P31 control sizing`, () => {
    const original = render(h(main[name]));
    assert.equal(hash(original), snapshot.demos[name]);
    assertControlSizingOnly(render(h(current[name])), original);
  });
}
for (const [slug, name] of Object.entries(frozenPages)) {
  test(`P18 frozen ${slug} <main> keeps raw main SSR bytes including React IDs`, () => {
    const original = mainMarkup(render(h(main[name])));
    assert.equal(hash(original), snapshot.frozen[slug].sha256);
    assert.equal(Buffer.byteLength(original), snapshot.frozen[slug].bytes);
    assert.equal(mainMarkup(render(h(current[name]))), original);
  });
}
