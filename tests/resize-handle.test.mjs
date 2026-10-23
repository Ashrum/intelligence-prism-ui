import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
const root = fileURLToPath(new URL('../', import.meta.url));
const dir = new URL('../.sites-runtime/resize-handle-test/', import.meta.url);
await mkdir(dir, { recursive: true });
const file = new URL('bundle.mjs', dir);
await writeFile(file, (await build({ stdin: { contents: `export * from './components/prism-next/resize-handle'; export * from './components/prism-next/demos/resize-handle'; export * from './components/coss/separator';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, write: false })).outputFiles[0].text);
const api = await import(file); await rm(file);
const html = props => render(React.createElement(api.ResizeHandle, props));
test('decorative default has persistent 4 by 20 grip, 1px line and no interactive semantics', () => {
  const out = html({});
  assert.match(out, /aria-hidden="true"/); assert.match(out, /h-5 w-1/); assert.match(out, /h-full w-px/);
  assert.match(out, /data-slot="resize-handle-line"[^>]*class="[^"]* bg-border /);
  assert.match(out, /data-slot="resize-handle-grip"[^>]*class="[^"]* bg-muted-foreground /);
  assert.match(out, /data-orientation="vertical"/); assert.match(out, /data-align="center"/);
  assert.doesNotMatch(out, /tabindex|role=|aria-label|<button/);
});
test('both orientations and all edge positions keep line and grip on the same axis', () => {
  for (const orientation of ['vertical', 'horizontal']) for (const [align, offset] of [['start','0%'],['center','50%'],['end','100%']]) {
    const out = html({ orientation, align });
    assert.equal(out.split(`${orientation === 'vertical' ? 'left' : 'top'}:${offset}`).length - 1, 2);
    assert.match(out, orientation === 'vertical' ? /cursor-col-resize/ : /cursor-row-resize/);
    assert.match(out, orientation === 'vertical' ? /h-5 w-1/ : /h-1 w-5/);
  }
});
test('host hover, drag and keyboard focus have distinct styling and reduced motion', () => {
  for (const orientation of ['vertical', 'horizontal']) {
    const normal = html({ orientation }), active = html({ orientation, dragging: true });
    assert.match(normal, /group-hover\/resize-handle:bg-ring/);
    assert.match(normal, /group-focus-visible\/resize-handle:outline-2/);
    assert.match(normal, /outline-offset-2/);
    assert.match(normal, /motion-reduce:transition-none/);
    assert.match(active, /data-dragging="true"/);
    assert.match(active, orientation === 'vertical' ? /h-full w-0.5/ : /h-0.5 w-full/);
    assert.doesNotMatch(active, /bg-foreground|bg-border|bg-muted-foreground/);
    assert.equal((active.match(/bg-ring/g) || []).length, 2);
  }
});
test('ordinary coss Separator retains its default border and has no grip', () => {
  const out = render(React.createElement(api.Separator));
  assert.match(out, /bg-border/); assert.match(out, /data-orientation="horizontal"/);
  assert.doesNotMatch(out, /resize-handle|bg-ring/);
});
test('five theme fixtures render both directions, all alignments and supplied drag state', () => {
  const out = render(React.createElement(api.ResizeHandleDemo));
  for (const theme of ['light','paper','dark','blueprint','blueprint-night']) assert.ok(out.includes(`data-prism-theme="${theme}"`));
  assert.equal((out.match(/role="separator"/g) || []).length, 30);
  assert.equal((out.match(/data-dragging="true"/g) || []).length, 5);
});
test('existing muted-foreground and ring tokens meet 3:1 on standard panel surfaces in all five themes', async () => {
  const css = await readFile(new URL('../app/(next)/next/theme.css', import.meta.url), 'utf8');
  const luminance = hex => hex.match(/\w\w/g).map(c => parseInt(c,16)/255).map(c => c <= .04045 ? c/12.92 : ((c+.055)/1.055)**2.4).reduce((sum,c,i) => sum+c*[.2126,.7152,.0722][i],0);
  for (const theme of ['light','paper','dark','blueprint','blueprint-night']) {
    const block = theme === 'light' ? css.slice(css.indexOf('--background:')) : css.slice(css.indexOf(`:where([data-agent-preview])[data-prism-theme="${theme}"]`));
    const token = name => block.match(new RegExp(`--${name}:#([a-fA-F0-9]{6});`))[1];
    for (const color of ['muted-foreground','ring']) for (const surface of ['background','card','muted']) {
      const a = luminance(token(color)), b = luminance(token(surface));
      const ratio = (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
      assert.ok(ratio >= 3, `${theme} ${color}/${surface}: ${ratio}`);
    }
  }
});
