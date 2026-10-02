import { build } from 'esbuild';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const root = fileURLToPath(new URL('../', import.meta.url));
const file = new URL(`../.sites-runtime/review-components-${process.pid}/bundle.mjs`, import.meta.url);
await mkdir(new URL('.', file), { recursive: true });
const compiled = await build({ stdin: { contents: `export * from './components/prism-next/review-workspace'; export * from './components/prism-next/question-rail'; export * from './components/prism-next/review-switcher'; export * from './components/prism-next/question-inspector'; export * from './components/prism-next/paper-preview'; export * from './components/prism-next/demos/review-workspace'; export * from './components/prism-next/demos/question-rail'; export * from './components/prism-next/demos/review-switcher'; export * from './components/prism-next/demos/question-inspector'; export * from './components/prism-next/demos/paper-preview-continuous'; export * from './components/prism-next/demos/review-workspace-fixtures';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false });
await writeFile(file, compiled.outputFiles[0].text);
export const api = await import(file);
await rm(file);
export const h = React.createElement;
export const render = node => renderToStaticMarkup(node);
export function capture(Component, props) {
  const nodes = [];
  function walk(node) {
    if (!React.isValidElement(node)) return;
    nodes.push(node); React.Children.forEach(node.props.children, walk);
    if (React.isValidElement(node.props.render)) walk(node.props.render);
  }
  function Probe() { const tree = Component(props); walk(tree); return tree; }
  return { html: render(h(Probe)), nodes };
}
export async function assertRoute(assert, slug, title) {
  const { default: worker } = await import('../dist/server/index.js');
  const response = await worker.fetch(new Request(`http://localhost/next/components/${slug}`, { headers: { accept: 'text/html' } }), { ASSETS: { fetch: async () => new Response('Not found', { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
  assert.equal(response.status, 200); const html = await response.text(); assert.ok(html.includes(title)); assert.match(html, /Agent Spec/);
}
