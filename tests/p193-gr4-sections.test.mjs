import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { build } from 'esbuild';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { clientDOM } from './helpers/chart-client-dom.mjs';
import { createTestRuntime } from './helpers/test-runtime.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const bundle = await build({
  stdin: {
    contents: `
      export { CockpitCell, CockpitTag } from './components/prism-next/cockpit-strip';
      export { QueueList } from './components/prism-next/queue-list';
    `,
    resolveDir: root,
    loader: 'tsx',
  },
  bundle: true,
  jsx: 'automatic',
  platform: 'node',
  format: 'esm',
  packages: 'external',
  alias: { '@': root },
  loader: { '.css': 'empty' },
  write: false,
});
const bundleFile = new URL('bundle.mjs', await createTestRuntime('p193'));
await writeFile(bundleFile, bundle.outputFiles[0].text);
const { CockpitCell, CockpitTag, QueueList } = await import(bundleFile);
const h = React.createElement;

const task = {
  id: 'p-1',
  title: '二模·二次函数巩固练习',
  tag: { label: '待复核', tone: 'pink' },
  meta: { className: '九年级(2)班', detail: '待复核 13 处' },
  date: '2026-09-16',
  waitDays: 64,
  overdue: true,
  actionLabel: '进入复核',
};
const emptyText = '当前筛选条件下暂无待我处理任务';

test('CockpitCell renders its reading with the metric-display size', () => {
  const html = renderToStaticMarkup(h(CockpitCell, { label: '待我处理', value: 4, unit: '份' }));
  assert.match(html, /<div class="prism-cockpit-value text-metric-display tabular-nums">4<\/div>/);
});

test('CockpitTag renders a static span with a decorative icon and count', () => {
  for (const icon of ['alert', 'plus', 'check', 'clock']) {
    const html = renderToStaticMarkup(h(CockpitTag, { icon, label: '待复核', count: 1 }));
    assert.match(html, /^<span\b.*<\/span>$/);
    assert.match(html, /aria-hidden="true".*待复核 <strong>1<\/strong>/);
    assert.doesNotMatch(html, /<button\b|\brole=|\btabindex=/i);
  }
});

test('QueueList renders the overdue class from the supplied flag', () => {
  const html = renderToStaticMarkup(h(QueueList, {
    items: [{ ...task, href: '/review' }, { ...task, id: 'p-2', waitDays: 22, overdue: false, onAction() {} }],
    emptyText,
  }));
  assert.match(html, /class="prism-queue-overdue">已等待 64 天/);
  assert.match(html, /<div>已等待 22 天<\/div>/);
  assert.match(html, /<a [^>]*href="\/review"/);
});

test('QueueList shows the supplied empty text without any actions', () => {
  const html = renderToStaticMarkup(h(QueueList, { items: [], emptyText }));
  assert.ok(html.includes(emptyText));
  assert.doesNotMatch(html, /<li\b|<button\b|<a\b/);
});

test('QueueList calls the callback once from the action button and once from the row', async () => {
  const dom = clientDOM(390, 74);
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    IS_REACT_ACT_ENVIRONMENT: globalThis.IS_REACT_ACT_ENVIRONMENT,
  };
  Object.assign(globalThis, { window: dom.window, document: dom.document, IS_REACT_ACT_ENVIRONMENT: true });

  const host = dom.document.createElement('div');
  const clickListeners = [];
  host.addEventListener = (type, handler, capture) => {
    if (type === 'click' && !capture) clickListeners.push(handler);
  };
  const client = createRoot(host);
  const click = target => {
    const event = {
      type: 'click', target, button: 0,
      stopPropagation() { this.cancelBubble = true; },
    };
    clickListeners.forEach(listener => listener(event));
    return event;
  };
  let calls = 0;
  try {
    await act(() => client.render(h(QueueList, {
      items: [{ ...task, onAction: () => { calls++; } }],
      emptyText,
    })));
    const row = host.firstChild.firstChild.firstChild;
    const button = row.childNodes[1].childNodes[1];
    assert.equal(row.tagName, 'LI');
    assert.equal(button.tagName, 'BUTTON');
    assert.equal(click(button).cancelBubble, true);
    assert.equal(calls, 1);
    click(row.childNodes[0]);
    assert.equal(calls, 2);
  } finally {
    await act(() => client.unmount());
    Object.assign(globalThis, previous);
  }
});
