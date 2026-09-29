import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = new URL('../.sites-runtime/typography-merge/', import.meta.url);
await mkdir(runtime, { recursive: true });
const file = new URL('test-bundle.mjs', runtime);
const bundle = await build({
  stdin: {
    contents: `export { cn } from './lib/utils';
      export * from './lib/prism-next/typography';
      export { Badge } from './components/prism-next/badge';`,
    resolveDir: root, loader: 'tsx',
  },
  bundle: true, jsx: 'automatic', platform: 'node', format: 'esm',
  packages: 'external', alias: { '@': root }, write: false,
});
await writeFile(file, bundle.outputFiles[0].text);
let runtimeExports;
try { runtimeExports = await import(file); } finally { await rm(file); }
const { cn, typographyRoles, typographyBrandClasses, typographyFontSizeClasses, Badge } = runtimeExports;

for (const size of typographyFontSizeClasses) {
  test(`${size} preserves semantic text colour in both merge orders`, () => {
    for (const colour of ['text-muted-foreground', 'text-primary-foreground', 'text-destructive-foreground']) {
      assert.equal(cn(size, colour), `${size} ${colour}`);
      assert.equal(cn(colour, size), `${colour} ${size}`);
      assert.equal(cn(`hover:${size}`, `hover:${colour}`), `hover:${size} hover:${colour}`);
      assert.equal(cn(`hover:${colour}`, `hover:${size}`), `hover:${colour} hover:${size}`);
    }
    assert.equal(cn('text-sm', size), size);
    assert.equal(cn(size, 'text-sm'), 'text-sm');
    // Exercise the real coss merge via Prism, including internal foreground classes.
    const html = renderToStaticMarkup(React.createElement(Badge, { className: size }, '示例'));
    const classes = html.match(/class="([^"]*)"/)[1].split(' ');
    assert.ok(classes.includes(size));
    assert.ok(classes.includes('text-primary-foreground'));
  });
}

test('font-size registry exactly matches typography.css base --text-* tokens', async () => {
  const css = await readFile(new URL('../app/(next)/next/typography.css', import.meta.url), 'utf8');
  // Exclude Tailwind sub-properties such as --text-ui-body--line-height.
  const cssClasses = [...css.matchAll(/--text-([a-z0-9]+(?:-[a-z0-9]+)*)\s*:/g)]
    .map(match => `text-${match[1]}`);
  const unique = values => [...new Set(values)].sort();
  assert.equal(typographyFontSizeClasses.length, unique(typographyFontSizeClasses).length);
  assert.equal(cssClasses.length, unique(cssClasses).length);
  assert.deepEqual(unique(typographyFontSizeClasses), unique(cssClasses));
  assert.deepEqual(
    unique(typographyRoles.map(role => role.className)),
    unique(cssClasses.filter(name => !typographyBrandClasses.includes(name))),
  );
  for (const role of typographyRoles) assert.equal(role.className, `text-${role.id}`);
});

test('semantic sizes conflict with sizes while colours still conflict with colours', () => {
  for (const previous of typographyFontSizeClasses) {
    for (const next of typographyFontSizeClasses) {
      assert.equal(cn(previous, 'text-muted-foreground', next), `text-muted-foreground ${next}`);
    }
  }
  assert.equal(cn('text-ui-body', 'text-muted-foreground', 'text-primary-foreground'),
    'text-ui-body text-primary-foreground');
});
