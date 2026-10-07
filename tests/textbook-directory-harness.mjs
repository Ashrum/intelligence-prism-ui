import { mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createHash } from 'node:crypto';
import { textbooks } from '../lib/prism-next/textbook-directory.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = new URL('../.sites-runtime/textbook-directory/', import.meta.url);
await mkdir(runtime, { recursive: true });
const file = new URL('test-bundle.mjs', runtime);
const bundle = await build({ entryPoints: [root + 'components/prism-next/textbook-directory.tsx'], bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, write: false });
await writeFile(file, bundle.outputFiles[0].text);
export const { TextbookDirectory } = await import(file);
await rm(file);
// Headless Tree defers rows until mount. Initialize its real model in a separate
// test-only bundle so row markup is testable without claiming browser coverage.
const source = await readFile(root + 'components/prism-next/textbook-directory.tsx', 'utf8');
const mountedBundle = await build({ stdin: { contents: source.replace('import { useTree } from "@headless-tree/react"', `import { useTree as useUnmountedTree } from "@headless-tree/react"
function useTree(...args) {
  const tree = useUnmountedTree(...args)
  if (!tree.getItems().length) { tree.setMounted(true); tree.rebuildTree() }
  return tree
}`), resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, write: false });
const mountedFile = new URL('mounted-test-bundle.mjs', runtime);
await writeFile(mountedFile, mountedBundle.outputFiles[0].text);
const { TextbookDirectory: MountedDirectory } = await import(mountedFile);
await rm(mountedFile);
export const mixedSelections = {
  'math-1:course': ['math-1:course:c111', 'math-1:course:c111', 'unknown', 'math-1:course:c1'],
  'math-1:knowledge': ['math-1:knowledge:k111'],
  'math-2:course': ['math-2:course:c111'],
  'unrelated:course': ['keep'],
};
export const baselineCases = {
  empty: {},
  selected: { selections: mixedSelections },
  singleBook: { textbooks: textbooks.slice(0, 1), selections: mixedSelections },
  noBooks: { textbooks: [] },
};
export const props = { textbooks, selections: {}, onSelectionsChange() {} };
export const htmlFor = extra => renderToStaticMarkup(React.createElement(TextbookDirectory, { ...props, ...extra }));
export const mountedHtmlFor = extra => renderToStaticMarkup(React.createElement(MountedDirectory, { ...props, ...extra }));
export const hash = html => createHash('sha256').update(html).digest('hex');

// Capture actual owned handlers under React's SSR dispatcher; no browser simulation.
export function capture(extra) {
  const nodes = [];
  const owned = new Set(['TextbookDirectory', 'DirectorySession', 'DirectoryTreeView']);
  function inspect(node) {
    if (Array.isArray(node)) return node.map(inspect);
    if (!React.isValidElement(node)) return node;
    nodes.push(node);
    if (typeof node.type === 'function' && owned.has(node.type.name)) return React.createElement(function Probe() { return inspect(node.type(node.props)); });
    return React.cloneElement(node, {}, React.Children.map(node.props.children, inspect));
  }
  renderToStaticMarkup(inspect(React.createElement(TextbookDirectory, { ...props, ...extra })));
  return nodes;
}
