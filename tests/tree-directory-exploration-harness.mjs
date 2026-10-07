import { readFile, mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = new URL('../.sites-runtime/p33-tests/', import.meta.url);
await mkdir(runtime, { recursive: true });
const bundle = await build({
  stdin: { contents: `export { TextbookDirectory } from './components/prism-next/textbook-directory';
export { DirectoryPresentation } from './components/prism-next/directory-presentation';
export * from './components/prism-next/explorations/directory-views';
export { explorationBooks } from './components/prism-next/explorations/directory-fixture';
export { initialDirectoryPath } from './components/prism-next/explorations/tree-directory';`, resolveDir: root, loader: 'tsx' },
  bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, write: false, loader: { '.css': 'empty' },
  plugins: [{ name: 'owned-hook-probe', setup(builder) {
    builder.onLoad({ filter: /(?:textbook-directory|directory-views)\.tsx$/ }, async ({ path }) => {
      let source = await readFile(path, 'utf8');
      source = source.replace('import { useTree } from "@headless-tree/react"', `import { useTree as useUnmountedTree } from "@headless-tree/react"
function useTree(...args) { const tree = useUnmountedTree(...args); if (!tree.getItems().length) { tree.setMounted(true); tree.rebuildTree() } return tree }`);
      if (path.endsWith('directory-views.tsx')) {
        source = source.replace('const [parentId, setParentId] = useState(initialParent)', 'const [parentId, setParentId] = [testUI.parent ?? initialParent, value => { testUI.parent = value }]')
          .replace('const [topId, setTopId] = useState("")', 'const [topId, setTopId] = [testUI.topId ?? "", value => { testUI.topId = value }]');
        source = source.replace('const pendingFocus = useRef<string | null>(null)', 'const pendingFocus = testUI.pendingFocus ??= { current: null }');
        source += '\nlet testUI = {}; export function setTestUI(value) { testUI = value }';
      }
      return { contents: source, loader: 'tsx' };
    });
  } }],
});
const file = new URL('bundle.mjs', runtime);
await writeFile(file, bundle.outputFiles[0].text);
const module = await import(file);
await rm(file);
export const { explorationBooks, initialDirectoryPath } = module;
const owned = new Set(['TextbookDirectory', 'DirectorySession', 'OutlineView', 'DrillView', 'AncestorView', 'ExplorationTree']);
export function probe(variant, depth = '5', hostDefaults = false) {
  const { books, counts } = explorationBooks(depth);
  const sessions = Object.fromEntries(books.flatMap(book => ['course', 'knowledge'].map(kind => [`${book.id}:${kind}`, { query: '', currentId: '', expandedIds: hostDefaults ? undefined : book.directories[kind].folderIds }])));
  const state = { selections: {}, sessions, kind: 'course', ui: {}, nodes: [], html: '', showCounts: true };
  const view = { A: module.OutlineView, B: module.DrillView, C: module.AncestorView }[variant];
  function render() {
    module.setTestUI(state.ui);
    state.nodes = [];
    function inspect(node) {
      if (Array.isArray(node)) return node.map(inspect);
      if (!React.isValidElement(node)) return node;
      if (node.type.name === 'DirectorySession') node = React.cloneElement(node, {
        session: state.sessions[node.props.scope] ?? { query: '', currentId: '', expandedIds: books[0].directories[state.kind].folderIds },
        setSessions(update) { state.sessions = typeof update === 'function' ? update(state.sessions) : update; },
      });
      state.nodes.push(node);
      if (typeof node.type === 'function' && owned.has(node.type.name)) return React.createElement(function Probe() { return inspect(node.type(node.props)); });
      return React.cloneElement(node, {}, React.Children.map(node.props.children, inspect));
    }
    const element = React.createElement(module.ExplorationFacts.Provider, { value: { counts, showCounts: state.showCounts, initialPath: hostDefaults ? initialDirectoryPath : undefined } },
      React.createElement(module.DirectoryPresentation.Provider, { value: { View: view, initialExpanded: hostDefaults ? initialDirectoryPath : undefined, kind: state.kind, onKindChange(value) { state.kind = value; state.ui = {}; } } },
        React.createElement(module.TextbookDirectory, { textbooks: books, selections: state.selections,
          onSelectionsChange(update) { state.selections = typeof update === 'function' ? update(state.selections) : update; },
          layout: 'embedded', titleAction: 'select', multiSelect: 'toggle',
        })));
    state.html = renderToStaticMarkup(inspect(element));
    return state.nodes;
  }
  return { state, books, counts, render,
    rows: () => [...new Map(state.nodes.filter(node => node.type.name === 'TreeItem').map(node => [node.props.item.getId(), node])).values()],
    tree: () => state.nodes.findLast(node => node.type.name === 'Tree')?.props.tree,
    find: predicate => state.nodes.findLast(predicate),
  };
}
export const event = key => { const target = {}; return { key, target, currentTarget: target, preventDefault() {}, stopPropagation() {} }; };
