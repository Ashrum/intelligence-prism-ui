import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { agentComponentRegistry as registry } from '../lib/prism-next/agent-component-registry.ts';
import { components, searchComponents } from '../lib/prism-next/catalog.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = new URL('../.sites-runtime/agent-subpages/', import.meta.url);
await mkdir(runtime, { recursive: true });
const bundle = await build({ stdin: { contents: `export * from './components/prism-next/demos/agent-component-page'; export * from './lib/prism-next/agent-component-navigation'; export * from './lib/prism-next/agent-component-contracts'; export * from './app/(next)/next/components/agent-components/[semantic]/page';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root, 'next/link': 'next/link.js', 'next/navigation': 'next/navigation.js' }, loader: { '.css': 'empty' }, write: false });
const bundleFile = new URL('subpages-test-bundle.mjs', runtime);
await writeFile(bundleFile, bundle.outputFiles[0].text);
const { generateStaticParams, generateMetadata, AgentComponentPage, AgentPreviewFrame, AgentSemanticExample, agentSemanticTabs, resolveSemanticTab, semanticNeighbors, getSemanticContract } = await import(bundleFile);
const h = React.createElement;
const workerPromise = import(new URL('../dist/server/index.js', import.meta.url));
async function fetchPage(path) {
  const { default: worker } = await workerPromise;
  return worker.fetch(new Request(`http://localhost${path}`, { headers: { accept: 'text/html' } }), { ASSETS: { fetch: async () => new Response('Not found', { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

test('42 semantic static params exactly match registry; parent catalog and search remain at 80', async () => {
  assert.deepEqual(generateStaticParams(), registry.map(entry => ({ semantic: entry.slug })));
  assert.equal(new Set(generateStaticParams().map(item => item.semantic)).size, 42);
  assert.equal(components.length, 80);
  assert.equal(searchComponents('').length, 80);
  assert.equal(components.filter(entry => entry.id === 'agent-components').length, 1);
  for (const entry of registry) {
    assert.equal((await generateMetadata({ params: Promise.resolve({ semantic: entry.slug }) })).title, `${entry.number} ${entry.name} · Agent 语义组件`);
  }
});

test('built worker renders all 42 semantic routes and rejects invalid slugs with existing 404 behavior', async () => {
  const routes = [];
  for (const entry of registry) {
    const response = await fetchPage(`/next/components/agent-components/${entry.slug}`);
    assert.equal(response.status, 200, entry.slug);
    const html = await response.text();
    assert.ok(html.includes(`data-agent-component-page="${entry.slug}"`), entry.slug);
    assert.ok(html.includes(`${entry.number} ${entry.name}`), entry.slug);
    assert.ok(html.includes(`/next/components/agent-components#${entry.slug}`), entry.slug);
    routes.push({ semantic: entry.slug, status: response.status, bytes: Buffer.byteLength(html) });
    if (entry.slug === 'relation-graph') await writeFile(new URL('relation-graph-page.html', runtime), html);
  }
  await writeFile(new URL('static-params-and-routes.json', runtime), JSON.stringify({ staticParams: generateStaticParams(), routes }, null, 2));
  for (const slug of ['does-not-exist', 'Relation-Graph', 'constructor']) {
    const response = await fetchPage(`/next/components/agent-components/${slug}`);
    assert.equal(response.status, 404, slug);
    assert.doesNotMatch(await response.text(), /data-agent-component-page=/);
  }
});

test('six accessible tabs expose stable pure anchors; malformed and unknown hashes are ignored', () => {
  const entry = registry[33];
  const html = render(h(AgentComponentPage, { entry, contract: getSemanticContract(entry.slug) }));
  assert.equal((html.match(/role="tab"/g) ?? []).length, 6);
  assert.equal((html.match(/role="tabpanel"/g) ?? []).length, 6);
  for (const { id, label } of agentSemanticTabs) {
    assert.ok(html.includes(`id="${id}"`), id);
    assert.ok(html.includes(label), label);
    assert.equal(resolveSemanticTab(`#${id}`), id);
  }
  assert.equal(resolveSemanticTab('#%77orkspace'), 'workspace');
  for (const hash of ['#invalid', '#%E0%A4%A', '#theme=dark', '?tab=review']) assert.equal(resolveSemanticTab(hash), undefined);
  assert.match(html, /主题 · 仅预览区/);
  assert.match(html, /data-preview-width="auto"/);
  assert.doesNotMatch(html, /data-prism-theme=/);
});

test('previous and next navigation follows numeric order including both boundaries', () => {
  for (let i = 0; i < registry.length; i++) {
    const entry = registry[i], neighbors = semanticNeighbors(entry.slug);
    assert.equal(neighbors.previous?.slug, registry[i - 1]?.slug);
    assert.equal(neighbors.next?.slug, registry[i + 1]?.slug);
    const html = render(h(AgentComponentPage, { entry, contract: [] }));
    for (const [key, rel] of [['previous', 'prev'], ['next', 'next']]) {
      if (neighbors[key]) assert.ok(html.includes(`rel="${rel}" href="/next/components/agent-components/${neighbors[key].slug}"`));
      else assert.ok(!html.includes(`rel="${rel}"`));
    }
  }
  assert.deepEqual(semanticNeighbors('missing'), {});
});

test('theme belongs only to preview frame; all width choices size a local scrollable container', async () => {
  for (const theme of ['site', 'light', 'paper', 'dark']) for (const width of ['auto', '320', '390', '768', '1280']) {
    const html = render(h(AgentPreviewFrame, { theme, width, siteTheme: 'paper' }, h('p', {}, '主题样本')));
    assert.match(html, /role="region" aria-label="预览 · /);
    assert.match(html, /tabindex="0"/);
    assert.match(html, /overflow-x-auto/);
    assert.ok(html.includes(`style="width:${width === 'auto' ? '100%' : `${width}px`}"`));
    assert.ok(html.includes('class="@container min-w-0'));
    if (theme === 'site') { assert.doesNotMatch(html, /data-prism-theme=/); assert.match(html, /预览 · 暖纸/); }
    else assert.ok(html.includes(`data-agent-preview="true" data-prism-theme="${theme}"`));
  }
  const source = await readFile(new URL('../components/prism-next/demos/agent-component-page.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /documentElement|localStorage|sessionStorage|setAttribute|setInterval|setTimeout/);
  assert.match(source, /window\.history\.pushState\(null, "", `#\$\{value\}`\)/);
  const css = await readFile(new URL('../app/(next)/next/theme.css', import.meta.url), 'utf8');
  assert.match(css, /:where\(\[data-agent-preview\]\[data-prism-theme\]\)/);
  for (const theme of ['paper', 'dark']) assert.ok(css.includes(`:where([data-agent-preview])[data-prism-theme="${theme}"]`));
  assert.match(css, /@custom-variant dark[^\n]+:not\(\[data-agent-preview\]\[data-prism-theme="light"\]/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
});

test('same fixtures render all declared views and compact densities without fabricating unavailable variants', async () => {
  const evidence = [];
  for (const entry of registry) {
    for (const mode of ['inline', 'workspace', 'compact', 'states']) {
      const html = render(h(AgentSemanticExample, { entry, mode, onNavigate() {} }));
      assert.ok(html.length > 20, `${entry.slug} ${mode}`);
      if (mode === 'workspace' && entry.twoState === '仅 Inline') assert.match(html, /没有扩展态/);
      else if (mode === 'compact' && ['13', '15', '25'].includes(entry.number)) assert.match(html, /尚未提供独立紧凑呈现/);
      else if (mode === 'workspace') assert.match(html, /data-[\w-]*view="workspace"/, entry.slug);
      else if (mode === 'compact') assert.match(html, /data-[\w-]*density="compact"/, entry.slug);
      evidence.push({ slug: entry.slug, mode, bytes: Buffer.byteLength(html) });
    }
  }
  await writeFile(new URL('example-renders.json', runtime), JSON.stringify(evidence, null, 2));
});

test('each semantic has focused live contract excerpts and valid registered GitHub PR evidence', () => {
  for (const entry of registry) {
    const paragraphs = getSemanticContract(entry.slug);
    assert.ok(paragraphs.length > 0 && paragraphs.length <= 5, entry.slug);
    assert.ok(paragraphs.some(paragraph => paragraph.includes(entry.componentName)), entry.slug);
    assert.ok(entry.carriers.prs.length, entry.slug);
    for (const url of entry.carriers.prs) assert.match(url, /^https:\/\/github\.com\/Ashrum\/(?:intelligence-prism-ui|ole-school-workbench)\/pull\/[1-9]\d*$/);
  }
  assert.deepEqual(getSemanticContract('missing'), []);
});
