import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createTestRuntime } from './helpers/test-runtime.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = readFileSync(new URL('../components/prism-next/blueprint/blueprint.tsx', import.meta.url), 'utf8');
const runtime = await createTestRuntime('p77-folio');
let serial = 0;
async function load(contents = source) {
  const result = await build({ stdin: { contents, resolveDir: root + 'components/prism-next/blueprint', loader: 'tsx' },
    bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, write: false });
  const file = new URL(`folio-${serial++}.mjs`, runtime);
  writeFileSync(file, result.outputFiles[0].text);
  return import(file);
}
const api = await load();
const render = (api, component, props) => renderToStaticMarkup(React.createElement(api[component], { title: '成果标题', ...props }));
const folios = html => [...html.matchAll(/<p class="bp-section-folio"([^>]*)>([^<]*)<\/p>/g)];
const components = ['BlueprintSectionHeader', 'BlueprintSheet'];

function kinds(api) {
  for (const component of components) for (const [kind, value, expected] of [
    ['sheet', '3/3', 'SHEET 03 / 03'], ['section', '2 / 12', 'SECTION 02 / 12'],
    ['rev', 'v1', 'REV 01'], ['rev', '2', 'REV 02'], ['rev', '123', 'REV 123'],
    ['sheet', '01 / 05', 'SHEET 01 / 05'], ['section', 'A-02', 'SECTION A-02'],
  ]) {
    const out = render(api, component, { folio: { kind, value } });
    assert.equal(folios(out).length, 1);
    assert.equal(folios(out)[0][2], expected);
    assert.doesNotMatch(out, /folio=|folioAriaHidden=/);
  }
}
function empty(api) {
  for (const component of components) for (const folio of [undefined, ...['sheet','section','rev'].flatMap(kind => ['', '  '].map(value => ({ kind, value })))]) {
    assert.equal(folios(render(api, component, { folio })).length, 0);
  }
}
function compatibility(api) {
  assert.equal(folios(render(api, 'BlueprintSheet', { sheetNo: '1/5' }))[0][2], 'SHEET 01 / 05');
  assert.equal(folios(render(api, 'BlueprintSheet', { sheetNo: '原件 A' }))[0][2], 'SHEET 原件 A');
  for (const kind of ['rev', 'section', 'sheet']) {
    assert.equal(folios(render(api, 'BlueprintSheet', { sheetNo: '9/9', folio: { kind, value: '2' } }))[0][2], `${kind.toUpperCase()} 02`);
    assert.equal(folios(render(api, 'BlueprintSheet', { sheetNo: '9/9', folio: { kind, value: ' ' } })).length, 0);
  }
}
function accessibility(api) {
  for (const component of components) for (const kind of ['sheet', 'section', 'rev']) {
    for (const hidden of [undefined, false, true]) {
      const out = render(api, component, { folio: { kind, value: '1' }, folioAriaHidden: hidden });
      assert.equal(folios(out)[0][1].includes('aria-hidden="true"'), hidden === true);
      assert.doesNotMatch(out, /<(?:header|section|h2)[^>]*aria-hidden/);
    }
  }
  assert.match(folios(render(api, 'BlueprintSheet', { sheetNo: '1', folioAriaHidden: true }))[0][1], /aria-hidden="true"/);
}

test('P77 folio: three kinds format supplied numeric facts, preserve legacy labels and do not truncate large values', () => kinds(api));
test('P77 folio: absent, empty and whitespace values render no folio element or prefix', () => empty(api));
test('P77 folio: sheetNo remains compatible; explicit folio wins including explicit empty value', () => compatibility(api));
test('P77 folio: readable by default; only host-confirmed equivalent information hides the folio, never the title', () => accessibility(api));
test('P77 folio: rollback mutations are rejected by rendered output contracts', async () => {
  const mutations = [
    ['REV lost', s => s.replaceAll('folio.kind.toUpperCase()', 'folio.kind === "sheet" ? "SHEET" : "SECTION"'), kinds],
    ['zero padding lost', s => s.replaceAll('.padStart(2, "0")', ''), kinds],
    ['v prefix kept', s => s.replace('/^v?(\\d+)$/i', '/^(\\d+)$/i'), kinds],
    ['empty element', s => s.replace('folio && value &&', 'folio &&'), empty],
    ['legacy ignored', s => s.replace('folio ?? (sheetNo ? { kind: "sheet", value: sheetNo } : undefined)', 'folio'), compatibility],
    ['legacy wins', s => s.replace('folio ?? (sheetNo ? { kind: "sheet", value: sheetNo } : undefined)', '(sheetNo ? { kind: "sheet", value: sheetNo } : folio)'), compatibility],
    ['always hidden', s => s.replace('folioAriaHidden || undefined', 'true'), accessibility],
    ['never hidden', s => s.replace('folioAriaHidden || undefined', 'undefined'), accessibility],
    ['sheet drops aria', s => s.replace('folioAriaHidden={folioAriaHidden}', ''), accessibility],
  ];
  for (const [name, mutate, check] of mutations) {
    const changed = mutate(source);
    assert.notEqual(changed, source, name);
    const mutant = await load(changed);
    assert.throws(() => check(mutant), undefined, name);
  }
});
