import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { createTestRuntime } from './helpers/test-runtime.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = await createTestRuntime('p94');
const bundle = new URL('components.mjs', runtime);
await writeFile(bundle, (await build({ stdin: { contents: "export * from './components/prism-next/agent-message'; export * from './lib/prism-next/format-message-time';", resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false })).outputFiles[0].text);
const { AgentMessage, formatMessageTime: format } = await import(bundle);
const h = React.createElement;
const message = props => render(h(AgentMessage, { speaker: 'agent', ...props }, h('p', {}, '正文与公式 x²')));
const snapshots = JSON.parse(await readFile(new URL('./fixtures/p94/main-d68e635.json', import.meta.url), 'utf8'));
for (const [i, item] of snapshots.cases.entries()) test(`P94 absent timestamp matches d68e635 bytes ${i}`, () => assert.equal(message(item.props), item.html));
const now = '2026-10-20T16:00:00+08:00';
test('P94 seven relative bands and minute/hour/week boundaries', () => {
  for (const [iso, label] of [
    ['2026-10-20T15:59:01+08:00', '刚刚'], ['2026-10-20T15:59:00+08:00', '1 分钟前'],
    ['2026-10-20T15:00:01+08:00', '59 分钟前'], ['2026-10-20T15:00:00+08:00', '1 小时前'],
    ['2026-10-19T23:59:59+08:00', '昨天'], ['2026-10-18T16:00:00+08:00', '2 天前'],
    ['2026-10-14T16:00:00+08:00', '6 天前'], ['2026-10-13T16:00:00+08:00', '10月13日'],
    ['2025-10-19T14:32:09+08:00', '2025年10月19日'],
  ]) assert.equal(format(iso, now).label, label);
});
test('P94 timezone calendar boundaries and full 12-hour time', () => {
  assert.equal(format('2026-10-19T16:32:09Z', now).label, '15 小时前');
  assert.equal(format('2026-10-19T15:59:59Z', now).label, '昨天');
  assert.equal(format('2025-12-31T15:59:00Z', '2026-01-01T00:01:00+08:00').label, '2 分钟前');
  assert.equal(format('2026-10-19T15:59:40Z', '2026-10-20T00:00:00+08:00').label, '刚刚');
  assert.equal(format('2026-10-19T16:32:09Z', now, { timeZone: 'UTC' }).label, '昨天');
  assert.equal(format('2026-10-20T17:25:00+08:00', now).title, '2026年10月20日 下午5:25');
  assert.equal(format('2026-10-20T00:05:00+08:00', now).title, '2026年10月20日 上午12:05');
  assert.equal(format('2026-10-20T12:05:00+08:00', now).title, '2026年10月20日 下午12:05');
  assert.equal(format(now, new Date(now)).label, '刚刚');
  assert.equal(format(now, Date.parse(now)).label, '刚刚');
  assert.equal(format('2026-10-21T16:00:00+08:00', now).label, '刚刚');
});
test('P94 invalid timestamps, reference and timezone are omitted', () => {
  for (const iso of ['', 'invalid', '2026-10-20', '2026-10-20T14:32:00', '2026-02-30T14:32:00Z', '2026-10-20T24:00:00Z', '2026-13-20T14:32:00Z']) {
    assert.equal(format(iso, now), undefined);
    assert.equal(message({ timestamp: { dateTime: iso } }), message({}));
  }
  assert.equal(format(now, 'bad'), undefined);
  assert.equal(format(now, NaN), undefined);
  assert.equal(format(now, now, { timeZone: 'invalid' }), undefined);
  assert.equal(message({ timestamp: { dateTime: now, timeZone: 'invalid' } }), message({}));
});
test('P94 time is a focusable Tooltip trigger before final more button, inside the hidden row', () => {
  for (const speaker of ['user', 'agent']) {
    const html = message({ speaker, timestamp: { dateTime: now, now }, copyAction: { onCopy() {} }, moreActions: '查看原文' });
    assert.match(html, /<time[^>]*dateTime="2026-10-20T16:00:00\+08:00"[^>]*tabindex="0"[^>]*aria-label="2026年10月20日 下午4:00"/);
    assert.match(html, /<time[^>]*data-base-ui-tooltip-trigger=""[^>]*>刚刚<\/time>/);
    assert.ok(html.indexOf('agent-message-secondary-actions') < html.indexOf('<time'));
    assert.ok(html.indexOf('aria-label="复制"') < html.indexOf('aria-label="更多消息操作"'));
    assert.ok(html.indexOf('<time') < html.indexOf('aria-label="更多消息操作"'));
    assert.match(html, /agent-message-footer-button/);
    assert.match(html, /data-actions-visible="false"/);
    assert.match(message({ speaker, isLast: true, timestamp: { dateTime: now } }), /data-actions-visible="true"/);
  }
});
test('P94 P92 CSS reserves space and reveals timestamp subtree on hover, focus and touch', async () => {
  const css = await readFile(new URL('../components/prism-next/agent-conversation.css', import.meta.url), 'utf8');
  assert.match(css, /data-actions-visible="false"[^{}]+secondary-actions \{ opacity: 0; pointer-events: none;/);
  assert.match(css, /:hover[^{}]+secondary-actions/);
  assert.match(css, /:focus-within[^{}]+secondary-actions \{ opacity: 1/);
  assert.match(css, /@media \(pointer: coarse\)[\s\S]+secondary-actions \{ opacity: 1/);
  assert.doesNotMatch(css, /secondary-actions[^{}]*\{[^{}]*(display: none|visibility: hidden)/);
  const src = await readFile(new URL('../components/prism-next/agent-message.tsx', import.meta.url), 'utf8');
  assert.match(src, /TooltipPopup[^>]+data-agent-preview data-prism-theme="dark"/);
});
test('P94 one shared minute timer, hidden pause, resume and final unsubscribe cleanup', async () => {
  const clockBundle = new URL('clock.mjs', runtime);
  await writeFile(clockBundle, (await build({ entryPoints: [root + 'lib/prism-next/message-time-clock.ts'], bundle: true, platform: 'node', format: 'esm', packages: 'external', write: false })).outputFiles[0].text);
  const { subscribeMessageTime } = await import(clockBundle);
  const original = { document: globalThis.document, setInterval: globalThis.setInterval, clearInterval: globalThis.clearInterval };
  let visibility, active = new Map(), created = 0, calls = 0;
  globalThis.document = { hidden: false, addEventListener(type, fn) { assert.equal(type, 'visibilitychange'); visibility = fn; }, removeEventListener(type, fn) { assert.equal(fn, visibility); visibility = undefined; } };
  globalThis.setInterval = (fn, delay) => { assert.equal(delay, 60000); active.set(++created, fn); return created; };
  globalThis.clearInterval = id => active.delete(id);
  try {
    const off1 = subscribeMessageTime(() => calls++);
    const off2 = subscribeMessageTime(() => calls++);
    assert.equal(created, 1); assert.equal(active.size, 1);
    const before = calls; [...active.values()][0](); assert.equal(calls, before + 2);
    document.hidden = true; visibility(); assert.equal(active.size, 0);
    document.hidden = false; visibility(); assert.equal(active.size, 1); assert.equal(calls, before + 4);
    off1(); assert.equal(active.size, 1);
    off2(); assert.equal(active.size, 0); assert.equal(visibility, undefined);
    document.hidden = true;
    const off3 = subscribeMessageTime(() => calls++); assert.equal(active.size, 0); off3();
  } finally { Object.assign(globalThis, original); }
});
