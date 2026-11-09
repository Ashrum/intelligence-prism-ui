import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createTestRuntime } from './helpers/test-runtime.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = await createTestRuntime('p158');
const h = React.createElement;
const modules = ['work', 'blueprint', 'drafting', 'motion'];
async function bundle(name, baseline = false, revision = '7ec7ffc') {
  const output = await build({
    stdin: { contents: modules.map(name => `export * from './components/prism-next/blueprint/${name}';`).join('\n'), loader: 'tsx', resolveDir: root },
    bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, write: false,
    plugins: baseline ? [{ name: 'baseline-7ec7ffc', setup(builder) {
      builder.onLoad({ filter: /prism-next\/blueprint\/.*\.tsx$/ }, args => ({ contents: execFileSync('git', ['show', `${revision}:${args.path.slice(root.length)}`], { cwd: root, encoding: 'utf8' }), loader: 'tsx' }));
    } }] : [],
  });
  const url = new URL(`${name}.mjs`, runtime);
  writeFileSync(url, output.outputFiles[0].text);
  return import(url);
}

const before = await bundle('before', true);
const after = await bundle('after');
const paneProps = {
  refCode: 'R1', title: '批阅 · 数学 · 间隔复查（九年级（1）班）',
  meta: '结果 v1', tabs: '页签', footer: '主操作', children: '正文', grid: true,
  onExpand() {}, onClose() {}, position: { current: 1, total: 3, onNext() {} },
};
function composed(props) {
  const { refCode, title, meta, nav, position, onExpand, onClose, expanded, expandLabel, restoreLabel, closeLabel, tabs, bodyProps, grid, footer, children, ...shellProps } = props;
  return h(after.BpObjectPaneShell, { ...shellProps, onEscape: onClose },
    h(after.BpObjectPaneHead, { refCode, title, meta, nav, position, onExpand, onClose, expanded, expandLabel, restoreLabel, closeLabel }),
    tabs != null && h(after.BpObjectPaneTabs, null, tabs),
    h(after.BpObjectPaneBody, { ...bodyProps, grid }, children),
    footer != null && h(after.BpObjectPaneFooter, null, footer));
}
for (const theme of ['light', 'paper', 'dark', 'blueprint', 'blueprint-night']) {
  test(`P158 ${theme}: pane and manual parts equal 7ec7ffc bytes`, () => {
    const fixtures = [{ title: '任务', children: '正文' }, paneProps, { ...paneProps, expanded: true }];
    for (const props of fixtures) for (const nav of [undefined, null, h(after.BpButton, { size: 'sm' }, '层级 ▾')]) {
      for (const extra of [{}, {
        className: 'host-pane', 'aria-label': '任务右栏', 'data-host': 'pane',
        bodyProps: { className: 'host-body', 'data-workspace-scroll': 'true', tabIndex: -1, 'aria-label': '任务正文', children: '不得覆盖正文' },
      }]) {
        const fullProps = { ...props, nav, ...extra };
        const themed = element => renderToStaticMarkup(h('div', { 'data-prism-theme': theme }, element));
        const expected = themed(h(before.BpObjectPane, fullProps));
        assert.equal(themed(h(after.BpObjectPane, fullProps)), expected);
        assert.equal(themed(composed(fullProps)), expected);
      }
    }
  });
}
test('P158 shell Escape preserves host ordering and exclusions', () => {
  const calls = [];
  const props = { onEscape: () => calls.push('escape'), onKeyDown: () => calls.push('host') };
  const event = { key: 'Escape', defaultPrevented: false, nativeEvent: { isComposing: false }, target: { closest: () => null }, stopPropagation: () => calls.push('stop') };
  const handle = after.BpObjectPaneShell(props).props.onKeyDown;
  handle(event);
  assert.deepEqual(calls, ['host', 'stop', 'escape']);
  const excluded = [
    { key: 'Enter' }, { key: 'Tab' }, { defaultPrevented: true }, { nativeEvent: { isComposing: true } },
    ...['input', 'textarea', 'select', '[contenteditable]:not([contenteditable="false"])', '[role="textbox"]'].map(selector => ({
      target: { closest(query) { assert.ok(query.includes(selector)); return {}; } },
    })),
  ];
  for (const override of excluded) {
    calls.length = 0;
    handle({ ...event, ...override });
    assert.deepEqual(calls, ['host']);
  }
  calls.length = 0;
  after.BpObjectPaneShell({ ...props, onEscape: undefined }).props.onKeyDown(event);
  assert.deepEqual(calls, ['host']);
  calls.length = 0;
  after.BpObjectPaneShell({ ...props, onKeyDown(event) { calls.push('host'); event.defaultPrevented = true; } }).props.onKeyDown({ ...event });
  assert.deepEqual(calls, ['host']);
});
test('P158 legacy content can omit tabs, body and footer', () => {
  const html = renderToStaticMarkup(h(after.BpObjectPaneShell, null,
    h(after.BpObjectPaneHead, { title: '旧类型' }),
    h('div', { className: 'min-h-0 flex-1', 'data-legacy': true }, '自带滚动内容')));
  assert.match(html, /<header/);
  assert.match(html, /data-legacy="true"/);
  assert.doesNotMatch(html, /bp-object-pane-body|overflow-x-auto|<footer|对象正文/);
});
test('P158 parts forward native attributes and merge classes', () => {
  for (const [name, tag] of [['Head', 'header'], ['Tabs', 'div'], ['Body', 'div'], ['Footer', 'footer']]) {
    const html = renderToStaticMarkup(h(after[`BpObjectPane${name}`], {
      ...(name === 'Head' ? { title: h('span', { 'data-workspace-heading': true, tabIndex: -1 }, '标题') } : {}),
      className: 'host-part', 'data-host': name,
    }));
    assert.ok(html.startsWith(`<${tag} `));
    assert.match(html, /class="[^"]*host-part/);
    assert.ok(html.includes(`data-host="${name}"`));
    if (name === 'Head') assert.match(html, /data-workspace-heading="true" tabindex="-1"/);
  }
});
