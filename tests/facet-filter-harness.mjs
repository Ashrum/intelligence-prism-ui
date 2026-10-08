import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = new URL('../.sites-runtime/p34-tests/', import.meta.url);
await mkdir(runtime, { recursive: true });
const bundle = await build({
  stdin: { contents: `export * from './components/prism-next/facet-filter';
export * from './components/prism-next/demos/fixtures/facet-filter';
export * from './components/prism-next/demos/facet-filter';`, resolveDir: root, loader: 'tsx' },
  bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, write: false, loader: { '.css': 'empty' },
  plugins: [{ name: 'owned-hook-probe', setup(builder) {
    builder.onLoad({ filter: /prism-next\/facet-filter\.tsx$/ }, async ({ path }) => ({ loader: 'tsx', contents: (await readFile(path, 'utf8'))
      .replace('useRef, useState', 'useRef, useState as nativeUseState')
      .replace('useState(520)', 'useState(testWidth ?? 520)') + `
let testContext = null; let testWidth;
export function setTestContext(context, width) { testContext = context; testWidth = width; }
function useState(initial) {
  if (!testContext) return nativeUseState(initial);
  const context = testContext, key = context.path + ':' + context.index++;
  context.visited.add(key);
  if (!context.store.has(key)) context.store.set(key, typeof initial === 'function' ? initial() : initial);
  return [context.store.get(key), value => context.store.set(key, typeof value === 'function' ? value(context.store.get(key)) : value)];
}
` }));
  } }],
});
const file = new URL('bundle.mjs', runtime);
await writeFile(file, bundle.outputFiles[0].text);
const module = await import(file);
await rm(file);
export const { filterFixture, filterSortItems, initialFilterValue, previewFilterValue, applyFilterIntent } = module;
const owned = new Set(['FacetFilter', 'FacetRow', 'OptionChoices', 'OptionLabel', 'DimensionLabel', 'MultiChoices', 'DraftActions', 'FilterPanel', 'FilterResults']);
export function ssr(variant, scale, width, extra = {}) {
  module.setTestContext(null);
  return renderToStaticMarkup(React.createElement('div', { style: { width }, 'data-prism-theme': extra.theme ?? 'light', 'data-ui-version': 'coss-v1' },
    React.createElement(module.FacetFilter, { dimensions: filterFixture(scale), value: initialFilterValue(), sortItems: filterSortItems, resultCount: 128, favoriteCount: 23, onIntent() {}, ...extra })));
}

// This probe invokes production handlers and persists only owned local hooks.
// Popup content is rendered in place; it does not claim browser focus/keyboard acceptance.
export function probe(variant, scale = 'future', width = 720) {
  const state = { value: initialFilterValue(), dimensions: filterFixture(scale), intents: [], apply: true, nodes: [], html: '', store: new Map(), width };
  const onIntent = intent => { state.intents.push(intent); if (state.apply) state.value = applyFilterIntent(state.value, intent); };
  function render() {
    const visited = new Set(); state.nodes = [];
    function inspect(node, path = 'root') {
      if (Array.isArray(node)) return node.map((item, index) => inspect(item, path + '/' + (item?.key ?? index)));
      if (!React.isValidElement(node)) return node;
      state.nodes.push({ node, path });
      if (typeof node.type === 'function' && owned.has(node.type.name)) return React.createElement(function Probe() {
        module.setTestContext({ path, store: state.store, visited, index: 0 }, state.width);
        return inspect(node.type(node.props), path + '/' + node.type.name);
      }, { key: node.key ?? path });
      const children = React.Children.toArray(node.props.children).map((child, index) => inspect(child, path + '/' + (child?.key ?? index)));
      if (node.type.name === 'PopoverPopup') return React.createElement('div', { key: node.key ?? path, 'data-probe-popup': '' }, children);
      return React.cloneElement(node, {}, children.length ? children : node.props.children);
    }
    state.html = renderToStaticMarkup(inspect(React.createElement(module.FacetFilter, {
      dimensions: state.dimensions, value: state.value, onIntent, sortItems: filterSortItems, resultCount: 128, favoriteCount: 23,
    })));
    for (const key of state.store.keys()) if (!visited.has(key)) state.store.delete(key);
    module.setTestContext(null);
  }
  const find = predicate => state.nodes.findLast(({ node, path }) => predicate(node, path))?.node;
  const openPanel = () => {
    const parent = state.nodes.find(({ node }) => node.type.name === 'FilterPanel');
    find((node, path) => path.startsWith(parent.path + '/') && typeof node.props.onOpenChange === 'function').props.onOpenChange(true); render();
  };
  return { state, render, find, openPanel };
}
export function textOf(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  return textOf(node.props?.children);
}

export function demoSSR() {
  module.setTestContext(null);
  return renderToStaticMarkup(React.createElement(module.FacetFilterDemo));
}
