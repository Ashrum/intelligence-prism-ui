import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { agentComponentRegistry as registry, agentComponentCategories as categories, filterAgentComponents } from '../lib/prism-next/agent-component-registry.ts';
import { components } from '../lib/prism-next/catalog.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = new URL('../.sites-runtime/agent-page-nav/', import.meta.url);
await mkdir(runtime, { recursive: true });
const bundled = await build({ stdin: { contents: `export * from './components/prism-next/demos/agent-components-page'; export * from './components/prism-next/demos/agent-component-examples'; export * from './components/prism-next/demos/agent-demo-presentation';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root, 'next/link': 'next/link.js' }, loader: { '.css': 'empty' }, write: false });
const file = new URL('registry-test-bundle.mjs', runtime);
await writeFile(file, bundled.outputFiles[0].text);
const { AgentComponentsPage, AgentExampleSection, AgentDemoPresentation, agentComponentExamples, agentSupplementalExamples, resolveAgentPageAnchor } = await import(file);
const h = React.createElement;
const html = render(h(AgentComponentsPage));
await writeFile(new URL('initial-page.html', runtime), html);
const progress = await readFile(new URL('../docs/Agent组件进度清单.md', import.meta.url), 'utf8');
const planning = await readFile(new URL('../docs/智能曜彩_Agent语义组件复用与设计规划_v0.1.3.md', import.meta.url), 'utf8');

test('registry has the 42 unique numbered semantics and all twelve authoritative categories', () => {
  assert.equal(registry.length, 42);
  assert.equal(new Set(registry.map(entry => entry.slug)).size, 42);
  assert.deepEqual(registry.map(entry => entry.number), Array.from({ length: 42 }, (_, i) => String(i + 1).padStart(2, '0')));
  assert.equal(categories.length, 12);
  for (const category of categories) assert.ok(planning.includes(`| ${category.id} ${category.name} |`));
  const rows = progress.split('\n').filter(line => /^\| \d{2} \|/.test(line)).map(line => line.split('|').slice(1, -1).map(cell => cell.trim()));
  for (const entry of registry) {
    const row = rows.find(row => row[0] === entry.number);
    assert.equal(row[1], entry.category.name);
    assert.equal(row[2].split('（v0.1')[0], entry.name);
    assert.ok(row[3].includes(entry.componentName));
    assert.equal(row[4], entry.twoState);
    assert.ok(entry.carriers.label && entry.unverified.length);
    for (const url of entry.carriers.prs) assert.ok(row[7].includes(url), `${entry.number} ${url}`);
  }
  assert.equal(new Set(components.map(entry => entry.id)).size, components.length);
});

test('mutually exclusive status counts match the current progress summary (42/0/0)', () => {
  const summary = progress.split('## 汇总与下一批')[1];
  for (const [status, label, count] of [['workspace-validated', 'Workspace 已验证', 42], ['candidate', '组件候选', 0], ['not-started', '未开始', 0]]) {
    assert.equal(registry.filter(entry => entry.status === status).length, count);
    assert.match(summary, new RegExp(`\\| ${label} \\| ${count} \\|`));
  }
});

test('SSR contains every semantic anchor exactly once, in category/number order, plus historical combinations', () => {
  let previous = -1;
  for (const entry of registry) {
    assert.equal(html.split(`id="${entry.slug}"`).length - 1, 1, entry.slug);
    const position = html.indexOf(`id="${entry.slug}"`);
    assert.ok(position > previous, entry.slug); previous = position;
    assert.ok(html.includes(`${entry.number} ${entry.name}</a></h2>`));
  }
  assert.equal((html.match(/data-agent-page-section=/g) ?? []).length, registry.length + agentSupplementalExamples.length);
  assert.equal((html.match(/data-agent-page-preview=/g) ?? []).length, registry.length + agentSupplementalExamples.length);
  for (const entry of agentSupplementalExamples) assert.ok(html.includes(`id="${entry.slug}"`));
  assert.doesNotMatch(html, /<h2[^>]*>[^<]*(?:设计候选|v0\.1)/);
  assert.doesNotMatch(html, /完整搜索与选择|不可播放录音（模拟）|超出图示上限（模拟）/);
});

test('search supports name, number and exported name, including empty status results', () => {
  assert.deepEqual(filterAgentComponents('34').map(entry => entry.slug), ['relation-graph']);
  assert.deepEqual(filterAgentComponents('图形关系').map(entry => entry.slug), ['relation-graph']);
  assert.deepEqual(filterAgentComponents('  agentrelationGRAPH  ').map(entry => entry.slug), ['relation-graph']);
  assert.equal(filterAgentComponents('', 'workspace-validated').length, 42);
  assert.equal(filterAgentComponents('', 'candidate').length, 0);
  assert.equal(filterAgentComponents('', 'not-started').length, 0);
  assert.equal(filterAgentComponents('没有这个组件').length, 0);
});

test('anchor entry resolves new and historical locations, rejects malformed or unrelated hashes', () => {
  for (const entry of [...registry, ...agentSupplementalExamples]) assert.deepEqual(resolveAgentPageAnchor(`#${entry.slug}`), { section: entry.slug, target: entry.slug });
  assert.deepEqual(resolveAgentPageAnchor('#composer-adaptations'), { section: 'existing-agent-inputs', target: 'composer-adaptations' });
  assert.equal(resolveAgentPageAnchor('#%E0%A4%A'), undefined);
  assert.equal(resolveAgentPageAnchor('#unrelated'), undefined);
});

test('collapsed sections never mount extra fixtures; expanded sections mount them and unmount again', () => {
  let mounts = 0;
  function Extra() { mounts++; return h('p', {}, '额外状态示例'); }
  const props = { slug: 'probe', name: '检查用示例', description: '检查按需挂载。', preview: h('p', {}, '对话示例'), examples: h(Extra), onExpandedChange() {} };
  assert.doesNotMatch(render(h(AgentExampleSection, { ...props, expanded: false })), /额外状态示例/);
  assert.equal(mounts, 0);
  assert.match(render(h(AgentExampleSection, { ...props, expanded: true })), /额外状态示例/);
  assert.equal(mounts, 1);
  render(h(AgentExampleSection, { ...props, expanded: false })); assert.equal(mounts, 1);
});

test('every semantic full fixture still renders after disclosure without duplicating its page anchor', () => {
  for (const entry of registry) {
    const result = render(h(AgentExampleSection, { slug: entry.slug, name: entry.name, entry, ...agentComponentExamples[entry.slug], expanded: true, onExpandedChange() {} }));
    assert.equal(result.split(`id="${entry.slug}"`).length - 1, 1, entry.slug);
    assert.match(result, /未验证范围/);
  }
  for (const entry of agentSupplementalExamples) {
    const result = render(h(AgentExampleSection, { ...entry, expanded: true, onExpandedChange() {} }));
    assert.equal(result.split(`id="${entry.slug}"`).length - 1, 1, entry.slug);
  }
});
