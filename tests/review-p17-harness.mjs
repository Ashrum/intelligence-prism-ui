import { mkdir, writeFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
export const baselineCommit = 'a30c077289311c88d59eb49c49bbeeba4c082805';
const root = fileURLToPath(new URL('../', import.meta.url));
const dir = new URL('../.sites-runtime/review-p17/', import.meta.url);
await mkdir(dir, { recursive: true });
const names = ['question-rail', 'score-review', 'error-cause-review', 'student-paper-report'];
const sources = new Map(names.map(name => {
  const path = `components/prism-next/${name}.tsx`;
  return [fileURLToPath(new URL(path, `file://${root}`)), execFileSync('git', ['show', `${baselineCommit}:${path}`], { cwd: root, encoding: 'utf8' })];
}));
async function bundle(original) {
  const path = new URL(`${process.pid}-${original ? 'main' : 'current'}.mjs`, dir);
  const result = await build({
    stdin: { contents: names.map(name => `export * from './components/prism-next/${name}'; export * from './components/prism-next/demos/${name}';`).join('\n') + `
      export * from './components/prism-next/demos/review-workspace-fixtures';
      export {Collapsible,CollapsibleTrigger,CollapsiblePanel} from './components/coss/collapsible';
      export {TooltipPopup,TooltipTrigger} from './components/coss/tooltip';
      export {Button} from './components/coss/button';
    `, resolveDir: root, loader: 'tsx' },
    bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false,
    plugins: [{ name: 'url-asset', setup(b) {
      b.onResolve({ filter: /temml\.mjs\?url$/ }, () => ({ path: 'temml-url', namespace: 'url' }));
      b.onLoad({ filter: /.*/, namespace: 'url' }, () => ({ contents: 'export default "temml.mjs"' }));
      if (original) b.onLoad({ filter: /prism-next\/[^/]+\.tsx$/ }, args => sources.has(args.path) ? { contents: sources.get(args.path), loader: 'tsx' } : undefined);
    } }],
  });
  await writeFile(path, result.outputFiles[0].text);
  try { return await import(path); } finally { await rm(path); }
}
export const [main, api] = await Promise.all([bundle(true), bundle(false)]);
export const h = React.createElement;
export const render = renderToStaticMarkup;
export const noop = () => {};
export const rail = { ...api.reviewRailFixture, panelId: 'p17-rail', selected: '2', filter: 'all', onFilterChange: noop, onSelect: noop, onLocate: noop, onPage: noop };
export const classRail = { selected: '2', onSelect: noop, overview: rail.overview, sections: rail.sections.map(section => ({ ...section, items: section.pages.flatMap(page => page.items) })) };
export function capture(Component, props) {
  const nodes = [];
  function walk(node) {
    if (Array.isArray(node)) return node.map(walk);
    if (!React.isValidElement(node)) return node;
    if (node.type === Component) return h(function Probe() { return walk(node.type(node.props)); });
    nodes.push(node);
    // render props are passed intact; their DOM appears in the returned SSR.
    return React.cloneElement(node, {}, React.Children.map(node.props.children, walk));
  }
  return { html: render(walk(h(Component, props))), nodes };
}
