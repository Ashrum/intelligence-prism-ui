import { mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
const root = fileURLToPath(new URL('../', import.meta.url));
export async function loadSubjectDemos(name) {
  const runtime = new URL('../.sites-runtime/subject-demos/', import.meta.url);
  await mkdir(runtime, { recursive: true });
  const file = new URL(`${name}-test-bundle.mjs`, runtime);
  await writeFile(file, (await build({ stdin: { contents: `export * from './components/prism-next/agent-interactive-demo'; export * from './components/prism-next/agent-simulation-lab'; export * from './components/prism-next/agent-subject-demo-parts'; export * from './components/prism-next/demos/agent-subject-demos';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false })).outputFiles[0].text);
  const result = await import(file); await rm(file); return result;
}
export const h = React.createElement;
export { render };
export const textOf = node => typeof node === 'string' ? node : Array.isArray(node) ? node.map(textOf).join('') : React.isValidElement(node) ? textOf(node.props.children) : '';
export const button = (nodes, label) => nodes.find(node => node.props.onClick && textOf(node.props.children) === label);
export function capture(Component, props, extraComponents = []) {
  const nodes = [];
  function inspect(node) {
    if (Array.isArray(node)) return node.map(inspect);
    if (!React.isValidElement(node)) return node;
    if ([Component, ...extraComponents].includes(node.type)) return h(function Probe() { return inspect(node.type(node.props)); });
    nodes.push(node);
    return React.cloneElement(node, {}, React.Children.map(node.props.children, inspect));
  }
  const html = render(inspect(h(Component, props)));
  return { nodes, html };
}
export const layouts = [{}, { view: 'workspace' }, { density: 'compact' }, { view: 'workspace', density: 'compact' }];
