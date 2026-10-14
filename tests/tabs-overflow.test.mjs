import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const root = fileURLToPath(new URL('../', import.meta.url));
const dir = new URL(`../.sites-runtime/tabs-overflow-${process.pid}/`, import.meta.url);
await mkdir(dir, { recursive: true });
const bundle = await build({ stdin: { contents: `
  export { TabsDemo } from './components/prism-next/demos/navigation';
  export { AgentSemanticGroupDemo } from './components/prism-next/demos/agent-semantic-group';
  export { AgentComponentPage } from './components/prism-next/demos/agent-component-page';
  export { agentComponentRegistry } from './lib/prism-next/agent-component-registry';
  export { BpSegTabs } from './components/prism-next/blueprint/blueprint';
  export { revealHorizontalChoice } from './components/prism-next/use-horizontal-choice-scroll';
`, resolveDir: root, loader: 'tsx' }, bundle: true, platform: 'node', format: 'esm', packages: 'external', alias: { '@': root, 'next/link': 'next/link.js', 'next/navigation': 'next/navigation.js' }, loader: { '.css': 'empty' }, write: false });
const file = new URL('bundle.mjs', dir);
await writeFile(file, bundle.outputFiles[0].text);
const api = await import(file);
await rm(dir, { recursive: true });
const render = (Component, props) => renderToStaticMarkup(React.createElement(Component, props));

test('Tabs demo SSR bounds both single-line lists, leaving panels outside the scrollers', () => {
  const html = render(api.TabsDemo);
  const scrollers = [...html.matchAll(/<div class="min-w-0 max-w-full overflow-x-auto py-1 -my-1">([\s\S]*?)<\/div><div[^>]*role="tabpanel"/g)];
  assert.equal(scrollers.length, 2);
  assert.deepEqual(scrollers.map(([, list]) => (list.match(/role="tab"/g) || []).length), [4, 3]);
  for (const [, list] of scrollers) {
    assert.match(list, /role="tablist"/);
    assert.match(list, /w-fit/);
    assert.match(list, /shrink-0 grow[^"<>]*whitespace-nowrap/);
    assert.equal((list.match(/aria-selected="true"/g) || []).length, 1);
    assert.doesNotMatch(list, /flex-wrap|role="tabpanel"/);
  }
  assert.match(html, /aria-disabled="true"[^>]*>已锁定/);
  assert.match(html, /以判别式判断实数根/);
  assert.match(html, /4 份材料/);
});

test('Agent group SSR already bounds its seven tabs in a local scroll container', () => {
  const html = render(api.AgentSemanticGroupDemo);
  const list = html.match(/<div class="max-w-full overflow-x-auto pb-1">([\s\S]*?)<\/div><div class="flex flex-wrap items-end/);
  assert.ok(list);
  assert.equal((list[1].match(/role="tab"/g) || []).length, 7);
  assert.match(list[1], /aria-label="Agent 语义组件"/);
});

test('Agent component page SSR keeps its navigation scroller and preview boundary', () => {
  const entry = api.agentComponentRegistry.find(item => item.componentName === 'AgentArtifactPreview');
  assert.ok(entry);
  const html = render(api.AgentComponentPage, { entry, contract: [] });
  assert.match(html, /<div class="min-w-0 max-w-full overflow-x-auto"><div[^>]*role="tablist"/);
  assert.match(html, /data-agent-preview-scroll/);
  assert.match(html, /data-preview-width="auto"/);
});

test('Blueprint SSR retains radio selection, disabled choice and the vertical variant', async () => {
  const props = { label: '答卷状态', value: 'last', onValueChange() {}, items: [
    { value: 'first', label: '首项' }, { value: 'locked', label: '已锁定', disabled: true },
    { value: 'last', label: '长中文与公式 f(x) = x² − 2x + 1' },
  ] };
  for (const orientation of ['horizontal', 'vertical']) {
    const html = render(api.BpSegTabs, { ...props, orientation });
    assert.match(html, new RegExp(`role="radiogroup"[^>]*data-orientation="${orientation}" class="bp-seg-tabs"`));
    assert.equal((html.match(/role="radio"/g) || []).length, 3);
    assert.equal((html.match(/tabindex="0"/g) || []).length, 1);
    assert.match(html, /aria-checked="true" tabindex="0"/);
    assert.match(html, /disabled=""/);
  }
  const css = await readFile(new URL('../app/(next)/next/blueprint.css', import.meta.url), 'utf8');
  assert.match(css, /\.bp-seg-tabs \{[^}]*flex-wrap:nowrap[^}]*max-width:100%/);
  assert.match(css, /\.bp-seg-tabs\[data-orientation="horizontal"\] \{ overflow-x:auto; \}/);
  assert.match(css, /\.bp-seg-tabs\[data-orientation="horizontal"\] > button \{ flex-shrink:0; \}/);
});

test('revealing a clipped choice scrolls only the owning viewport in either direction', () => {
  const container = { scrollWidth: 400, clientWidth: 200, clientLeft: 1, scrollLeft: 0, getBoundingClientRect: () => ({ left: 40 }) };
  api.revealHorizontalChoice(container, { getBoundingClientRect: () => ({ left: 230, right: 300 }) });
  assert.equal(container.scrollLeft, 59);
  api.revealHorizontalChoice(container, { getBoundingClientRect: () => ({ left: 20, right: 90 }) });
  assert.equal(container.scrollLeft, 38);
  api.revealHorizontalChoice(container, { getBoundingClientRect: () => ({ left: 60, right: 180 }) });
  assert.equal(container.scrollLeft, 38);
  // A label wider than the viewport keeps its beginning readable; no wrapping or shrinking.
  api.revealHorizontalChoice(container, { getBoundingClientRect: () => ({ left: 100, right: 500 }) });
  assert.equal(container.scrollLeft, 97);
});

test('wide lists do not scroll or measure choices', () => {
  const container = { scrollWidth: 200, clientWidth: 500, scrollLeft: 0 };
  api.revealHorizontalChoice(container, {});
  assert.equal(container.scrollLeft, 0);
});

test('built /next/components/tabs serves the repaired demo inside the real shell', async () => {
  const { default: worker } = await import('../dist/server/index.js');
  const response = await worker.fetch(new Request('http://localhost/next/components/tabs', { headers: { accept: 'text/html' } }), { ASSETS: { fetch: async () => new Response('Not found', { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
  assert.equal(response.status, 200);
  const html = (await response.text()).replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '');
  assert.match(html, /data-ui-version="coss-v1"/);
  assert.match(html, /分段式标签页/);
  assert.equal((html.match(/class="min-w-0 max-w-full overflow-x-auto py-1 -my-1"/g) || []).length, 2);
  assert.equal((html.match(/data-slot="tabs-tab"/g) || []).length, 7);
  assert.doesNotMatch(html, /bp-seg-tabs/);
});
