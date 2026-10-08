import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = new URL('../.sites-runtime/p38-picker-tests/', import.meta.url);
await mkdir(runtime, { recursive: true });
const bundle = await build({
  stdin: { contents: `export { ExplorationDirectory, setTestContext as setPickerContext } from './components/prism-next/explorations/directory-picker';
export { OutlineView, ExplorationFacts } from './components/prism-next/explorations/directory-views';
export { explorationBooks } from './components/prism-next/explorations/directory-fixture';
export * from './components/prism-next/explorations/directory-memory';`, resolveDir: root, loader: 'tsx' },
  bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, write: false, loader: { '.css': 'empty' },
  plugins: [{ name: 'owned-hook-probe', setup(builder) {
    builder.onLoad({ filter: /(?:textbook-directory|directory-picker|directory-views)\.tsx$/ }, async ({ path }) => {
      let source = await readFile(path, 'utf8');
      source = source.replace('import { useTree } from "@headless-tree/react"', `import { useTree as useUnmountedTree } from "@headless-tree/react"
import { useRef as useMountRef } from "react"
function useTree(...args) { const tree = useUnmountedTree(...args), mounted = useMountRef(false); if (!mounted.current) { mounted.current = true; tree.setMounted(true); tree.rebuildTree() } return tree }`);
      if (path.endsWith('directory-picker.tsx')) source = source.replace('useState,', 'useState as nativeUseState,') + `
let testContext = null;
export function setTestContext(context) { testContext = context }
function useState(initial) {
  if (!testContext) return nativeUseState(initial);
  const context = testContext, key = context.path + ':' + context.index++;
  context.visited.add(key);
  if (!context.store.has(key)) context.store.set(key, typeof initial === 'function' ? initial() : initial);
  return [context.store.get(key), value => context.store.set(key, typeof value === 'function' ? value(context.store.get(key)) : value)];
}
`;
      return { contents: source, loader: 'tsx' };
    });
  } }],
});
const file = new URL('bundle.mjs', runtime);
await writeFile(file, bundle.outputFiles[0].text);
const module = await import(file); await rm(file);
const owned = new Set(['ExplorationDirectory', 'PickerSession', 'BookHeader', 'KindTabs', 'OutlineView', 'ExplorationTree']);
export function textOf(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  return textOf(node.props?.children);
}
// Runs actual owned handlers with retained hook state. Dialog portals are placed
// inline only in the probe; browser focus, trapping and Esc routing need real QA.
export function probe(depth = '5', hostDefaults = false) {
  const { books, counts } = module.explorationBooks(depth);
  const state = { books, selections: hostDefaults ? module.defaultDirectorySelections(books) : {}, currentNodes: {}, showCounts: true, kind: 'course', callback: false, requests: 0, nodes: [], store: new Map(), html: '' };
  const View = module.OutlineView;
  function render() {
    const visited = new Set(); state.nodes = [];
    function inspect(node, path = 'root') {
      if (Array.isArray(node)) return node.map((child, index) => inspect(child, path + '/' + (child?.key ?? index)));
      if (!React.isValidElement(node)) return node;
      state.nodes.push({ node, path });
      if (typeof node.type === 'function' && owned.has(node.type.name)) return React.createElement(function Probe() {
        const context = { path, store: state.store, visited, index: 0 };
        module.setPickerContext(context);
        return inspect(node.type(node.props), path + '/' + node.type.name);
      }, { key: node.key ?? path });
      if (node.type.name === 'DialogLayout') {
        if (!node.props.open) return null;
        return React.createElement('section', { key: node.key ?? path, 'aria-label': node.props.title }, inspect([node.props.children, node.props.footerStart, node.props.footerEnd], path + '/dialog'));
      }
      const children = React.Children.toArray(node.props.children).map((child, index) => inspect(child, path + '/' + (child?.key ?? index)));
      return React.cloneElement(node, { key: node.key ?? path }, children.length ? children : node.props.children);
    }
    state.html = renderToStaticMarkup(inspect(React.createElement(module.ExplorationFacts.Provider, { value: { counts, showCounts: state.showCounts } },
      React.createElement(module.ExplorationDirectory, { textbooks: state.books, selections: state.selections, currentNodes: state.currentNodes,
        onCurrentNodesChange(update) { state.currentNodes = typeof update === 'function' ? update(state.currentNodes) : update },
        onSelectionsChange(update) { state.selections = typeof update === 'function' ? update(state.selections) : update },
        kind: state.kind, onKindChange(value) { state.kind = value }, View, initialExpanded: data => hostDefaults ? [] : data.folderIds,
        onTextbookSwitch: state.callback ? () => { state.requests++ } : undefined,
      }))));
    for (const key of state.store.keys()) if (!visited.has(key)) state.store.delete(key);
    module.setPickerContext(null);
  }
  const find = predicate => state.nodes.findLast(({ node, path }) => predicate(node, path))?.node;
  const all = predicate => state.nodes.filter(({ node, path }) => predicate(node, path)).map(({ node }) => node);
  const dialog = title => find(node => node.type.name === 'DialogLayout' && node.props.title === title);
  const click = (label, aria = false) => { const node = find(node => node.type.name === 'Button' && (aria ? node.props['aria-label'] === label : textOf(node) === label)); if (!node) throw new Error(`Button not found: ${label}`); node.props.onClick(); render() };
  return { state, books, counts, render, find, all, dialog, click,
    tree: () => find(node => node.type.name === 'Tree')?.props.tree,
    rows: () => [...new Map(all(node => node.type.name === 'TreeItem').map(node => [node.props.item.getId(), node])).values()],
    row: id => find(node => node.type.name === 'TreeItem' && node.props.item.getId() === id),
    search(query) { find(node => node.type.name === 'InputGroupInput').props.onChange({ target: { value: query } }); render() },
    tab(kind) { find(node => node.type.name === 'Tabs').props.onValueChange(kind); render() },
  };
}
export const event = key => { const target = {}; return { key, target, currentTarget: target, preventDefault() {}, stopPropagation() {} } };

export const { explorationBooks, defaultDirectorySelections, defaultDirectorySelection, restoreDirectorySelections, saveDirectorySelections, clearDirectoryMemory, directoryMemoryKey, restoreDirectoryCurrentNodes } = module;
