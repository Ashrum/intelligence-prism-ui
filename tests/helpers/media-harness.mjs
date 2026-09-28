import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';

// Handler/state probes only, not a DOM, keyboard browser or playback emulator.
export async function mediaHarness(name, exported, base) {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const runtime = new URL('../../.sites-runtime/media-workspaces/', import.meta.url);
  await mkdir(runtime, { recursive: true });
  const options = { stdin: { contents: `export * from './components/prism-next/${name}'; export * from './components/prism-next/demos/agent-media-workspaces'; export * from './components/prism-next/agent-media-parts';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false };
  const file = new URL(`${name}-test.mjs`, runtime), probe = new URL(`${name}-probe.mjs`, runtime);
  await writeFile(file, (await build(options)).outputFiles[0].text);
  const exports = await import(file);
  await writeFile(probe, (await build({ ...options, plugins: [{ name: 'media-state-probe', setup(builder) {
    builder.onLoad({ filter: new RegExp(`${name}\\.tsx$`) }, async args => ({ loader: 'tsx', contents: (await readFile(args.path, 'utf8')).replace('useId, useState, type Ref', 'useId, type Ref').replace('type Draft =', `const useState = <T,>(initial: T): [T, (value: T) => void] => { const p = (globalThis as any).__mediaUI; const index = p.cursor++; if (!(index in p.values)) p.values[index] = initial; return [p.values[index], (value: T) => { p.values[index] = value }]; };\ntype Draft =`) }));
  } }] })).outputFiles[0].text);
  const { [exported]: Probe } = await import(probe);
  await rm(file); await rm(probe);
  const h = React.createElement;
  const textOf = node => typeof node === 'string' || typeof node === 'number' ? String(node) : Array.isArray(node) ? node.map(textOf).join('') : React.isValidElement(node) ? textOf(node.props.children) : '';
  const reset = () => { globalThis.__mediaUI = { cursor: 0, values: [] }; };
  function capture(extra = {}) {
    globalThis.__mediaUI.cursor = 0;
    const nodes = [];
    function inspect(node) {
      if (Array.isArray(node)) return node.map(inspect);
      if (!React.isValidElement(node)) return node;
      if (node.type === Probe || ['MediaFrame', 'MediaRangeFields', 'MediaDraftActions', 'NativeMedia'].includes(node.type?.name)) return h(function Visit() { return inspect(node.type(node.props)); }, { key: node.key });
      nodes.push(node);
      return React.cloneElement(node, {}, React.Children.map(node.props.children, inspect));
    }
    return { html: render(inspect(h(Probe, { ...base, view: 'workspace', ...extra }))), nodes };
  }
  const click = (extra, label) => { const node = capture(extra).nodes.find(node => node.props.onClick && textOf(node.props.children) === label); assert.ok(node, label); node.props.onClick({ currentTarget: { closest() { return null; } } }); return node; };
  const input = (extra, suffix, value) => { const node = capture(extra).nodes.find(node => node.props.id?.endsWith(suffix) && node.props.onChange); assert.ok(node, suffix); node.props.onChange({ target: { value } }); };
  const html = extra => render(h(exports[exported], { ...base, ...extra }));
  return { exports, reset, capture, click, input, html, render, h };
}
