import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { createTestRuntime } from './helpers/test-runtime.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = await createTestRuntime('p95');
const bundle = new URL('components.mjs', runtime);
await writeFile(bundle, (await build({ stdin: { contents: "export * from './components/prism-next/agent-message'; export * from './lib/prism-next/format-message-time'; export * from './lib/prism-next/message-time-clock';", resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false })).outputFiles[0].text);
const { AgentMessage, formatMessageTime: format, subscribeMessageTime } = await import(bundle);
const now = Date.parse('2026-10-20T08:00:00Z');
const message = props => render(React.createElement(AgentMessage, { speaker: 'agent', ...props }, React.createElement('p', {}, '正文与公式 x²')));
test('P95 future 5 seconds / 5 minutes show just now, preserving full time', () => {
  for (const seconds of [5, 300]) {
    const iso = new Date(now + seconds * 1000).toISOString();
    assert.equal(format(iso, now).label, '刚刚');
    assert.equal(format(iso, now).title, format(iso, iso).title);
  }
});
test('P95 final DOM child is more, after actions, copy and time', () => {
  for (const speaker of ['agent', 'user']) {
    const html = message({ speaker, actions: React.createElement('button', {}, '外部操作'), copyAction: { onCopy() {} }, timestamp: { dateTime: new Date(now).toISOString(), now }, moreActions: '查看详情' });
    assert.ok(html.indexOf('外部操作') < html.indexOf('aria-label="复制"'));
    assert.ok(html.indexOf('aria-label="复制"') < html.indexOf('<time'));
    assert.ok(html.indexOf('<time') < html.indexOf('aria-label="更多消息操作"'));
    assert.match(html, /aria-label="更多消息操作"[^]*?<\/button><\/div><\/div><\/div>$/);
    assert.match(html, /class="mt-2 flex/);
  }
});
test('P95 fine 28px / 4px buttons, 8px time gaps; coarse 44px target reservation', async () => {
  const css = await readFile(root + 'components/prism-next/agent-conversation.css', 'utf8');
  assert.match(css, /\.agent-message-timed-footer \{ gap: 4px; \}/);
  assert.match(css, /> time \{ margin-inline: 4px; \}/);
  assert.match(css, /footer-button \{ width: 28px; height: 28px; min-width: 28px; min-height: 28px; margin: 8px; \}/);
  assert.match(css, /@media \(pointer: fine\) \{\s*\.agent-message-timed-footer \{ min-height: 28px; \}\s*\.agent-message-timed-footer \.agent-message-footer-button \{ margin: 0; \}/);
  assert.match(css, /@media \(pointer: coarse\) \{\s*\.agent-message-timed-footer \.agent-message-footer-button::after \{ position: absolute; inset: -8px; width: 44px; height: 44px; min-width: 44px; min-height: 44px;/);
});
test('P95 render reads current time even between ticks; callback reads current Date.now', () => {
  const original = { document: globalThis.document, setInterval: globalThis.setInterval, clearInterval: globalThis.clearInterval };
  const originalNow = Date.now;
  let current = now, reads = 0, tick;
  Date.now = () => { reads++; return current; };
  globalThis.document = { hidden: false, addEventListener() {}, removeEventListener() {} };
  globalThis.setInterval = fn => { tick = fn; return 1; };
  globalThis.clearInterval = () => {};
  let off;
  try {
    off = subscribeMessageTime(() => {});
    const props = { timestamp: { dateTime: new Date(now - 59000).toISOString() } };
    assert.match(message(props), />刚刚<\/time>/);
    current += 2000; // No tick: a parent render must not reuse the old clock snapshot.
    assert.match(message(props), />1 分钟前<\/time>/);
    const before = reads; current += 60000; tick(); assert.equal(reads, before + 1);
    assert.match(message(props), />2 分钟前<\/time>/);
    assert.match(message({ timestamp: { ...props.timestamp, now } }), />刚刚<\/time>/);
  } finally { off?.(); Date.now = originalNow; Object.assign(globalThis, original); }
});
test('P95 absent timestamp preserves all P94 frozen SSR cases', async () => {
  const snapshots = JSON.parse(await readFile(root + 'tests/fixtures/p94/main-d68e635.json', 'utf8'));
  for (const item of snapshots.cases) assert.equal(message(item.props), item.html);
});
