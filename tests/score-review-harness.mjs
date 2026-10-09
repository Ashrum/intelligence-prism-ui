import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
const root = fileURLToPath(new URL('../', import.meta.url));
const dir = new URL('../.sites-runtime/score-review-test/', import.meta.url);
await mkdir(dir, { recursive: true });
const options = { stdin: { contents: `export * from './components/prism-next/score-review'; export * from './components/prism-next/demos/score-review'; export {Button} from './components/coss/button'; export {NumberField} from './components/coss/number-field'; export {Textarea} from './components/coss/textarea'; export {AgentItemReviewer} from './components/prism-next/agent-item-reviewer'; export {AgentReviewQueue} from './components/prism-next/agent-review-queue';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false };
// SSR has no effects. The built-route test uses the real Vite URL/Temml asset.
const urlPlugin = { name: 'url-asset', setup(build) { build.onResolve({ filter: /temml\.mjs\?url$/ }, () => ({ path: 'temml-url', namespace: 'url' })); build.onLoad({ filter: /.*/, namespace: 'url' }, () => ({ contents: 'export default "temml.mjs"' })); } };
async function bundle(name, plugins) {
  const file = new URL(`${process.pid}-${name}`, dir);
  await writeFile(file, (await build({ ...options, plugins: [urlPlugin, ...plugins] })).outputFiles[0].text);
  const api = await import(file); await rm(file); return api;
}
export const api = await bundle('bundle.mjs', []);
export const probe = await bundle('probe.mjs', [{ name: 'state-probe', setup(build) {
  build.onLoad({ filter: /prism-next\/score-review\.tsx$/ }, async args => ({ loader: 'tsx', contents: (await readFile(args.path, 'utf8')).replace('useId, useState', 'useId').replace('export type ScoreReviewDraft', `const useState = <T,>(initial: T) => { const c = (globalThis as any).__scoreState; const i = c.index++; if (!(i in c.values)) c.values[i] = initial; return [c.values[i], (v: T) => { c.values[i] = v }] as const };\nexport type ScoreReviewDraft`) }));
} }]);
// Persist refs and schedule effects across SSR captures to test the transition policy.
// The focus spy is not a browser DOM/focus or screen-reader test.
export const focusProbe = await bundle('focus-probe.mjs', [{ name: 'focus-probe', setup(build) {
  build.onLoad({ filter: /prism-next\/score-review\.tsx$/ }, async args => ({ loader: 'tsx', contents: (await readFile(args.path, 'utf8'))
    .replace('useEffect, useRef', '')
    .replace('export type ScoreReviewDraft', `
const useRef = <T,>(initial: T) => { const c = (globalThis as any).__scoreFocus; const i = c.index++; return c.refs[i] ??= { current: initial } };
const useEffect = (effect: () => void, deps: unknown[]) => { const c = (globalThis as any).__scoreFocus; const i = c.index++; if (!c.refs[i] || deps.some((v, j) => !Object.is(v, c.refs[i][j]))) c.effects.push(effect); c.refs[i] = deps };
export type ScoreReviewDraft`) }));
} }]);
const h = React.createElement;
export function capture(props = {}, lib = api) {
  if (globalThis.__scoreState) globalThis.__scoreState.index = 0;
  if (globalThis.__scoreFocus) { globalThis.__scoreFocus.index = 0; globalThis.__scoreFocus.effects = []; }
  const nodes = [];
  function walk(node) {
    if (Array.isArray(node)) return node.map(walk);
    if (!React.isValidElement(node)) return node;
    if (node.type === lib.ScoreReview) return h(function Probe() { return walk(node.type(node.props)); });
    nodes.push(node);
    if (lib === focusProbe && node.type === 'h2' && node.props.ref) node.props.ref.current = { focus: globalThis.__scoreFocus.focus };
    return React.cloneElement(node, {}, React.Children.map(node.props.children, walk));
  }
  const html = render(walk(h(lib.ScoreReview, { ...api.scoreReviewBase, onAcceptAi() {}, onSave() {}, ...props })));
  if (lib === focusProbe) globalThis.__scoreFocus.effects.forEach(effect => effect());
  return { html, nodes, buttons: nodes.filter(n => n.type === lib.Button), number: nodes.find(n => n.type === lib.NumberField), reason: nodes.find(n => n.type === lib.Textarea) };
}
export const button = (out, label) => out.buttons.find(n => render(n.props.children).replace(/<[^>]*>/g, '').includes(label));
export { h, render };
