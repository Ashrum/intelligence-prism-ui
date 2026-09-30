import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
const root = fileURLToPath(new URL('../', import.meta.url));
const dir = new URL('../.sites-runtime/record-list-test/', import.meta.url);
await mkdir(dir, { recursive: true });
const options = { stdin: { contents: `export * from './components/prism-next/record-list'; export * from './components/prism-next/demos/record-list'; export {Button} from './components/coss/button'; export {Tabs} from './components/coss/tabs'; export {Input} from './components/coss/input'; export {Select} from './components/coss/select'; export {MenuItem} from './components/coss/menu'; export {Card} from './components/coss/card'; export {PaginationLink} from './components/coss/pagination';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, write: false };
async function bundle(name, plugins = []) {
  const file = new URL(name, dir);
  await writeFile(file, (await build({ ...options, plugins })).outputFiles[0].text);
  const api = await import(file); await rm(file); return api;
}
export const api = await bundle('bundle.mjs');
export const probe = await bundle('probe.mjs', [{ name: 'state-probe', setup(build) {
  build.onLoad({ filter: /prism-next\/record-list\.tsx$/ }, async args => ({ loader: 'tsx', contents: (await readFile(args.path, 'utf8')).replace('useId, useState,', 'useId,').replace('export type RecordListTab', `const useState = <T,>(initial: T) => { const c = (globalThis as any).__recordState; const i = c.index++; if (!(i in c.values)) c.values[i] = initial; return [c.values[i], (v: T) => { c.values[i] = v }] as const };\nexport type RecordListTab`) }));
} }]);
const h = React.createElement;
export function capture(props = {}, lib = api) {
  if (globalThis.__recordState) globalThis.__recordState.index = 0;
  const nodes = [];
  function walk(node) {
    if (Array.isArray(node)) return node.map(walk);
    if (!React.isValidElement(node)) return node;
    if (node.type === lib.RecordList) return h(function Probe() { return walk(node.type(node.props)); });
    nodes.push(node);
    return React.cloneElement(node, {}, React.Children.map(node.props.children, walk));
  }
  const html = render(walk(h(lib.RecordList, { ...api.recordBase, onPrimary() {}, onRowAction() {}, onRowMenu() {}, ...props })));
  return { html, nodes, find: type => nodes.filter(node => node.type === lib[type]) };
}
export const button = (out, label) => out.find('Button').find(node => React.Children.toArray(node.props.children).includes(label));
export const click = () => ({ stopped: false, stopPropagation() { this.stopped = true; } });
