import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, relative } from 'node:path';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import postcss from 'postcss';
import { createTestRuntime } from './helpers/test-runtime.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const baseline = '4df58ae231a3ab63d2eccd5e4e706fb488e2832d';
const files = ['components/prism-next/blueprint/work.tsx', 'components/prism-next/record-list.tsx'];
const before = new Map(files.map(path => [path, execFileSync('git', ['show', `${baseline}:${path}`], { cwd: root, encoding: 'utf8' })]));
const directory = await createTestRuntime('p141');
async function bundle(name, plugins = []) {
  const output = await build({
    stdin: { contents: `export { BpWorkHeader } from './components/prism-next/blueprint/work'; export { RecordList } from './components/prism-next/record-list';`, resolveDir: root, loader: 'tsx' },
    bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, write: false, plugins,
  });
  const url = new URL(name, directory);
  await writeFile(url, output.outputFiles[0].text);
  return import(url);
}
const original = await bundle('before.mjs', [{ name: 'p141-preimage', setup(build) {
  build.onLoad({ filter: /prism-next\/(?:blueprint\/work|record-list)\.tsx$/ }, args => ({
    contents: before.get(relative(root, args.path)), loader: 'tsx', resolveDir: dirname(args.path),
  }));
} }]);
const current = await bundle('after.mjs');
const h = React.createElement;
const render = (component, props) => renderToStaticMarkup(h(component, props));
const header = {
  back: { label: '批阅记录', href: '/grading' }, title: '数学 · 间隔复查：长中文对象名称',
  meta: '九年级（1）班', status: h('span', null, '批阅完成'),
  position: { index: 5, total: 20, onPrev() {}, onNext() {} },
  notice: h('span', null, '只读历史版本'),
  secondary: [h('button', { key: 'target' }, '设置目标线'), h('button', { key: 'export' }, '导出成绩单')],
  primary: { children: '主操作', onClick() {} }, more: h('button', { 'aria-label': '更多操作' }, '⋯'),
};
const row = { id: 'one', type: '试卷', name: '数学 · 间隔复查', metadata: '九年级（1）班 · 45 份', status: { label: '批阅完成', tone: 'success' }, action: { id: 'open', label: '查看结果' } };
const rows = [row, { ...row, id: 'two', name: '另一条记录' }];
const record = { rows, onRowAction() {} };

test('P141 default and explicit stack SSR equal the immutable 4df58ae preimage byte for byte', () => {
  for (const back of [header.back, { label: '批阅记录', onClick() {} }]) {
    for (const slots of [{ back, title: header.title }, { ...header, back }]) {
      for (const theme of ['light', 'paper', 'dark', 'blueprint', 'blueprint-night']) {
        const props = { ...slots, 'data-prism-theme': theme };
        const expected = render(original.BpWorkHeader, props);
        assert.equal(render(current.BpWorkHeader, props), expected);
        assert.equal(render(current.BpWorkHeader, { ...props, narrow: 'stack' }), expected);
      }
    }
  }
});

test('P141 compact adds an opt-in attribute and separately hideable notice/secondary slots while retaining primary and more', () => {
  const output = render(current.BpWorkHeader, { ...header, narrow: 'compact' });
  assert.match(output, /<header[^>]*data-narrow="compact"/);
  assert.equal((output.match(/<h1 /g) || []).length, 1);
  assert.match(output, /class="bp-work-notice"><span>只读历史版本<\/span><\/div>/);
  assert.match(output, /class="bp-work-secondary"><button>设置目标线<\/button><button>导出成绩单<\/button><\/div>/);
  assert.match(output, /data-variant="primary"[^]*?主操作/);
  assert.match(output, /class="bp-work-more"><button aria-label="更多操作">⋯<\/button>/);
  assert.ok(output.indexOf('bp-work-position') < output.indexOf('data-variant="primary"'));
  assert.ok(output.indexOf('data-variant="primary"') < output.indexOf('bp-work-more'));
  const minimal = render(current.BpWorkHeader, { back: header.back, title: header.title, narrow: 'compact' });
  assert.doesNotMatch(minimal, /bp-work-notice|bp-work-secondary|bp-work-more|bp-work-position/);
});

test('P141 compact layout rules are structural, opt-in and share the viewport/demo-container breakpoint', async () => {
  const css = postcss.parse(await readFile(new URL('../app/(next)/next/blueprint.css', import.meta.url), 'utf8'));
  const blocks = [];
  css.walkAtRules(rule => {
    if (['media', 'container'].includes(rule.name) && /max-width:700px/.test(rule.params) && rule.nodes.some(n => n.selector?.includes('data-narrow="compact"'))) blocks.push(rule);
  });
  assert.deepEqual(blocks.map(b => b.name), ['media', 'container']);
  for (const block of blocks) {
    const rules = block.nodes.filter(n => n.selector?.includes('data-narrow="compact"'));
    const declarations = selector => Object.fromEntries(rules.find(r => r.selector.endsWith(selector)).nodes.map(d => [d.prop, d.value]));
    assert.equal(declarations('[data-narrow="compact"]')['grid-template-columns'], 'minmax(0,1fr) auto');
    assert.equal(declarations('.bp-work-identity').display, 'contents');
    for (const slot of ['back', 'status']) assert.equal(declarations(`.bp-work-${slot}`)['grid-row'], '1');
    for (const slot of ['title', 'actions']) assert.equal(declarations(`.bp-work-${slot}`)['grid-row'], '2');
    assert.equal(declarations('.bp-work-actions')['flex-wrap'], 'nowrap');
    const hidden = rules.filter(r => r.nodes.some(d => d.prop === 'display' && d.value === 'none'));
    assert.equal(hidden.length, 1);
    assert.match(hidden[0].selector, /bp-work-meta,\.bp-work-notice,\.bp-work-secondary/);
    assert.doesNotMatch(hidden[0].selector, /primary|more|position/);
    for (const rule of rules) {
      assert.doesNotMatch(rule.selector, /data-prism-theme/);
      assert.ok(rule.nodes.every(d => !/color|background|border|shadow|font/.test(d.prop)));
    }
  }
});

test('P141 RecordList without currentRowId matches 4df58ae SSR in ready and non-record states', () => {
  for (const state of [{ kind: 'ready' }, { kind: 'loading' }, { kind: 'empty' }, { kind: 'search-empty' }, { kind: 'error', reason: '加载失败' }]) {
    for (const extra of [{}, { showHeader: false, showSearch: false, showStatus: false }, { tabs: [{ id: 'all', label: '全部', count: 2 }], defaultTab: 'all' }]) {
      const props = { ...record, state, ...extra };
      const expected = render(original.RecordList, props);
      assert.equal(render(current.RecordList, props), expected);
      assert.equal(render(current.RecordList, { ...props, currentRowId: undefined, currentRowLabel: '其他标记' }), expected);
    }
  }
});

test('P141 only the host-designated row receives current semantics, existing color tokens and readable 12px-role text', () => {
  const output = render(current.RecordList, { ...record, currentRowId: 'two' });
  assert.equal((output.match(/aria-current="true"/g) || []).length, 1);
  assert.equal((output.match(/data-current=""/g) || []).length, 1);
  assert.match(output, /data-record-row="two" aria-current="true" data-current="" style="border-left:3px solid var\(--line\);background-color:var\(--accent\)"/);
  assert.match(output, /<span class="text-ui-meta text-muted-foreground">刚才查看<\/span>/);
  assert.doesNotMatch(output, /data-record-row="one"[^>]*aria-current/);
  const custom = render(current.RecordList, { ...record, currentRowId: 'one', currentRowLabel: '返回位置', showStatus: false });
  assert.match(custom, />返回位置<\/span>/);
  assert.doesNotMatch(custom, /刚才查看|批阅完成/);
});

test('P141 missing, filtered or non-record current IDs add no markup', () => {
  assert.equal(render(current.RecordList, { ...record, currentRowId: 'absent' }), render(original.RecordList, record));
  const filtered = { ...record, rows: [{ ...row, tabIds: ['hidden'] }], tabs: [{ id: 'all', label: '全部', count: 0 }], defaultTab: 'all' };
  assert.equal(render(current.RecordList, { ...filtered, currentRowId: 'one' }), render(original.RecordList, filtered));
  for (const kind of ['empty', 'loading', 'search-empty', 'error']) {
    const props = { ...record, state: { kind, reason: '加载失败' } };
    assert.equal(render(current.RecordList, { ...props, currentRowId: 'one' }), render(original.RecordList, props));
  }
});

test('P141 current marker follows supplied props and introduces no focus, scrolling or persistence effects', async () => {
  for (const id of ['one', 'two', undefined]) {
    const output = render(current.RecordList, { ...record, currentRowId: id });
    if (id) assert.match(output, new RegExp(`data-record-row="${id}" aria-current="true"`));
    else assert.equal(output, render(original.RecordList, record));
  }
  const source = await readFile(new URL('../components/prism-next/record-list.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /useEffect|scrollIntoView|\.focus\(|autoFocus|localStorage|sessionStorage/);
});
