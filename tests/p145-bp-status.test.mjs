import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const root = fileURLToPath(new URL('../', import.meta.url));
const directory = new URL(`../.sites-runtime/p145-bp-status-${process.pid}/`, import.meta.url);
await mkdir(directory, { recursive: true });
let api;
try {
  const result = await build({
    stdin: {
      contents: `export { BpStatus } from './components/prism-next/blueprint/blueprint';`,
      resolveDir: root,
      loader: 'tsx',
    },
    bundle: true,
    jsx: 'automatic',
    platform: 'node',
    format: 'esm',
    packages: 'external',
    alias: { '@': root },
    write: false,
  });
  const file = new URL('status.mjs', directory);
  await writeFile(file, result.outputFiles[0].text);
  api = await import(file);
} finally {
  await rm(directory, { recursive: true });
}

const tones = [
  ['error', 'text-destructive-foreground', '错误'],
  ['attention', 'text-warning-foreground', '需处理'],
  ['done', 'text-success-foreground', '完成'],
  ['neutral', 'text-muted-foreground', '待定'],
];

for (const [tone, colorClass, label] of tones) {
  test(`P145 ${tone} renders its token class and a decorative solid dot with readable text`, () => {
    const output = renderToStaticMarkup(React.createElement(api.BpStatus, { tone, className: 'text-ui-body' }, label));
    assert.ok(output.startsWith(`<span data-bp-status="${tone}"`));
    assert.ok(output.includes(colorClass));
    assert.ok(output.includes('inline-flex items-center gap-[6px]'));
    assert.ok(output.includes('text-ui-body'));
    assert.match(output, /<span aria-hidden="true" class="size-\[7px\] shrink-0 rounded-full bg-current"><\/span>/);
    assert.ok(output.endsWith(`</span>${label}</span>`));
    assert.doesNotMatch(output, /data-inactive/);
  });
}

test('P145 inactive renders a hollow decorative dot and keeps the readable status', () => {
  const output = renderToStaticMarkup(React.createElement(api.BpStatus, { tone: 'neutral', inactive: true }, '已失效'));
  assert.match(output, /data-inactive="true"/);
  assert.match(output, /<span aria-hidden="true" class="size-\[7px\] shrink-0 rounded-full border-\[1\.5px\] border-solid border-current bg-transparent"><\/span>已失效<\/span>/);
  assert.doesNotMatch(output, /bg-current/);
});
