import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const root = fileURLToPath(new URL('../', import.meta.url));
const file = new URL('../.sites-runtime/blueprint-experiment-test.mjs', import.meta.url);
await mkdir(new URL('../.sites-runtime/', import.meta.url), { recursive: true });
const bundle = await build({
  stdin: { contents: `export { BlueprintExperiment } from './app/(next)/next/experiments/blueprint/blueprint-experiment'; export { evidenceItems } from './app/(next)/next/experiments/blueprint/fixtures';`, resolveDir: root, loader: 'tsx' },
  bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external',
  alias: { '@': root, 'next/link': 'next/link.js' },
  loader: { '.css': 'local-css' }, outfile: fileURLToPath(file), write: false,
});
await writeFile(file, bundle.outputFiles.find(output => output.path.endsWith('.mjs')).text);
const { BlueprintExperiment, evidenceItems } = await import(file);
await rm(file);

test('Blueprint evidence rows keep complete title/source and content-driven height at every button breakpoint', () => {
  const html = renderToStaticMarkup(React.createElement(BlueprintExperiment));
  const buttons = [...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)];
  const rows = buttons.filter(([, , body]) => evidenceItems.some(item => body.includes(item.title)));
  assert.equal(rows.length, 3);

  for (const item of evidenceItems) {
    const row = rows.find(([, , body]) => body.includes(item.title));
    assert.ok(row, `${item.id}: evidence title exists`);
    assert.ok(row[2].includes(item.location), `${item.id}: source is preserved`);
    const classes = row[1].match(/\bclass="([^"]*)"/)[1].split(/\s+/);
    assert.ok(classes.includes('h-auto'), `${item.id}: row height follows its content`);
    assert.ok(classes.includes('whitespace-normal'), `${item.id}: long content can wrap`);
    // Ignore child/icon selectors and touch-target pseudo-elements; inspect the button itself.
    // This guards the sm:h-8 regression in SSR output, not browser geometry.
    for (const utility of classes.filter(name => !name.includes('*') && !/(?:^|:)(?:before|after):/.test(name))) {
      assert.doesNotMatch(utility, /(?:^|:)(?:h|size)-(?!auto$)/, `${item.id}: fixed row size ${utility}`);
    }
  }
});
