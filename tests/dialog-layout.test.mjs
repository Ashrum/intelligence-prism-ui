import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { components, searchComponents } from '../lib/prism-next/catalog.ts';
import { coreAgentSpecs } from '../lib/prism-next/agent-specs.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const dir = new URL(`../.sites-runtime/dialog-layout-${process.pid}/`, import.meta.url);
await mkdir(dir, { recursive: true });
async function compile(inlinePortal) {
  const out = await build({ stdin: { contents: `export * from './components/prism-next/dialog-layout'; export * from './components/prism-next/demos/dialog-layout';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', external: [`${root}node_modules/@base-ui/react/dialog/portal/DialogPortalContext.mjs`], alias: { '@': root }, loader: { '.css': 'empty' }, write: false,
    plugins: inlinePortal ? [{ name: 'inline-portal-for-ssr', setup(b) {
      // Only replace the transport boundary in memory; coss files and all modal/radio primitives remain real.
      b.onLoad({ filter: /components\/coss\/dialog\.tsx$/ }, async args => {
        const source = await readFile(args.path, 'utf8');
        const boundary = 'export const DialogPortal: typeof DialogPrimitive.Portal =\n  DialogPrimitive.Portal;';
        assert.ok(source.includes(boundary));
        return { loader: 'tsx', contents: `import { DialogPortalContext } from '${root}node_modules/@base-ui/react/dialog/portal/DialogPortalContext.mjs';\n` + source.replace(boundary, 'export function DialogPortal({children}: {children: React.ReactNode}) { return <DialogPortalContext.Provider value={true}>{children}</DialogPortalContext.Provider> }') };
      });
    } }] : [],
  });
  const file = new URL(inlinePortal ? 'inline.mjs' : 'real.mjs', dir);
  await writeFile(file, out.outputFiles[0].text);
  const api = await import(file);
  await rm(file);
  return api;
}
const api = await compile(true), real = await compile(false);
const h = React.createElement, html = (Component, props) => renderToStaticMarkup(h(Component, props));
const base = { open: true, onOpenChange() {}, title: '核对材料甲', closeLabel: '关闭核对' };
function capture(Component, props) {
  const nodes = [];
  function walk(node) {
    if (!React.isValidElement(node)) return;
    nodes.push(node); React.Children.forEach(node.props.children, walk);
  }
  const output = html(function Probe() { const node = Component(props); walk(node); return node; });
  return { nodes, html: output };
}

test('DialogLayout has a coss dialog with a required accessible title and named close', () => {
  const out = html(api.DialogLayout, { ...base, description: '需要完整核对', children: '正文材料' });
  assert.match(out, /role="dialog"/);
  const labelledBy = out.match(/aria-labelledby="([^"]+)"/)[1];
  assert.ok(out.includes(`id="${labelledBy}"`));
  assert.match(out, /核对材料甲<\/h2>/);
  assert.match(out, /aria-label="关闭核对"/);
  const describedBy = out.match(/aria-describedby="([^"]+)"/)[1];
  assert.ok(out.includes(`id="${describedBy}"`));
  assert.match(out, /正文材料/);
  for (const title of [undefined, '', '  ']) assert.throws(() => html(api.DialogLayout, { ...base, title }), /non-empty title/);
  assert.throws(() => html(api.DialogLayout, { ...base, closeLabel: ' ' }), /non-empty closeLabel/);
});

test('coss keeps controlled dismissal details, completion and explicit focus targets', () => {
  assert.equal(html(real.DialogLayout, { ...base, open: false, children: '不可见正文' }), '');
  const initialFocus = { current: null }, finalFocus = { current: null }, changes = [], completions = [];
  const props = { ...base, initialFocus, finalFocus, disablePointerDismissal: true, closeDisabled: true,
    onOpenChange: (open, details) => { changes.push([open, details]); details.cancel(); }, onOpenChangeComplete: open => completions.push(open) };
  const out = capture(api.DialogLayout, props);
  const popup = out.nodes.find(n => n.props['data-dialog-layout'] !== undefined);
  assert.equal(popup.props.initialFocus, initialFocus);
  assert.equal(popup.props.finalFocus, finalFocus);
  assert.equal(popup.props.showCloseButton, false);
  assert.equal(popup.props.bottomStickOnMobile, false);
  assert.equal(out.nodes[0].props.open, true);
  assert.equal(out.nodes[0].props.disablePointerDismissal, true);
  assert.equal(out.nodes.find(n => n.props['aria-label'] === base.closeLabel).props.disabled, true);
  let canceled = 0;
  const details = { reason: 'escape-key', cancel() { canceled++; } };
  out.nodes[0].props.onOpenChange(false, details);
  assert.deepEqual(changes, [[false, details]]);
  assert.equal(canceled, 1);
  assert.equal(props.open, true);
  out.nodes[0].props.onOpenChangeComplete(false);
  assert.deepEqual(completions, [false]);
});

test('reading regions opt into a named keyboard scroll entry without describing all body text', () => {
  const out = html(api.DialogLayout, { ...base, bodyLabel: '完整核对说明', children: '多段说明与公式' });
  assert.match(out, /role="region" aria-label="完整核对说明" tabindex="0"/);
  assert.doesNotMatch(out, /aria-describedby=/);
  assert.doesNotMatch(html(api.DialogLayout, base), /role="region"/);
  for (const bodyLabel of ['', '  ']) assert.throws(() => html(api.DialogLayout, { ...base, bodyLabel }), /non-empty bodyLabel/);
});

test('all optional slots are omitted and accent defaults on; sizes and split/equal are explicit', () => {
  const bare = html(api.DialogLayout, base);
  assert.match(bare, /data-dialog-accent/);
  assert.match(bare, /data-size="md"/);
  assert.doesNotMatch(bare, /data-dialog-media|data-dialog-eyebrow|data-dialog-footer|data-slot="dialog-description"/);
  for (const size of ['sm', 'md', 'lg', 'xl']) for (const footerLayout of ['split', 'equal']) {
    const out = html(api.DialogLayout, { ...base, size, footerLayout, accent: false, eyebrow: '核对', media: '媒体', footerStart: '弱操作', footerEnd: '主操作' });
    assert.match(out, new RegExp(`data-size="${size}"`));
    assert.match(out, new RegExp(`data-layout="${footerLayout}"`));
    for (const text of ['媒体', '弱操作', '主操作', 'data-dialog-eyebrow']) assert.ok(out.includes(text));
    assert.doesNotMatch(out, /data-dialog-accent/);
  }
  const custom = html(api.DialogLayout, { ...base, footer: '自定义底栏', footerStart: '不应出现', footerEnd: '也不出现' });
  assert.match(custom, /自定义底栏/); assert.doesNotMatch(custom, /不应出现|也不出现|data-dialog-footer-start/);
});

test('Evidence only exposes zoom as a button when the host provides onView', () => {
  const props = { title: '材料甲', thumbnail: h('span', {}, '缩略图') };
  const passive = html(api.DialogEvidence, props);
  assert.doesNotMatch(passive, /<button|data-dialog-zoom|data-dialog-facts|data-slot="badge"/);
  let views = 0;
  const out = capture(api.DialogEvidence, { ...props, onView: () => views++, facts: ['2 页', '编号甲'], status: { label: '待确认', tone: 'warning' } });
  const button = out.nodes.find(n => n.type === 'button');
  assert.equal(button.props['aria-label'], '查看大图：材料甲'); button.props.onClick(); assert.equal(views, 1);
  assert.match(out.html, /data-dialog-zoom/); assert.match(out.html, /待确认/); assert.match(out.html, /2 页/);
});

test('option tiles are native buttons with descriptive disabled reasons and external intent', () => {
  let calls = 0;
  const props = { title: '上传材料', description: '选择文件', onClick: () => calls++ };
  const out = capture(api.DialogOptionTile, props);
  assert.equal(out.nodes[0].type, 'button'); assert.equal(out.nodes[0].props.type, 'button');
  out.nodes[0].props.onClick(); assert.equal(calls, 1);
  const blocked = html(api.DialogOptionTile, { ...props, emphasis: 'primary', disabledReason: '设备离线' });
  assert.match(blocked, /disabled=""/); assert.match(blocked, /设备离线/); assert.match(blocked, /data-emphasis="primary"/);
  assert.match(blocked, /aria-describedby="[^"]+-reason"/);
  const quiet = html(api.DialogQuietActions, { children: h(api.DialogQuietAction, props) });
  assert.match(quiet, /data-dialog-quiet-actions/); assert.match(quiet, /<button/); assert.match(quiet, /lucide-arrow-right/);
});

test('grouped grid is one controlled radiogroup with selection across named groups and status text', () => {
  const calls = [], props = { label: '选择对象', value: 'b', onValueChange: value => calls.push(value), groups: [
    { id: 'g1', title: '已有材料', description: '追加', children: h(api.DialogOptionGridItem, { value: 'a', title: '成员甲' }) },
    { id: 'g2', title: '等待材料', children: [h(api.DialogOptionGridItem, { key: 'b', value: 'b', title: '成员乙', description: '编号002', status: { label: '待核对', tone: 'warning' } }), h(api.DialogOptionGridItem, { key: 'c', value: 'c', title: '成员丙', disabledReason: '不可用' })] },
  ] };
  const out = capture(api.DialogOptionGrid, props);
  assert.equal((out.html.match(/role="radiogroup"/g) || []).length, 1);
  assert.equal((out.html.match(/role="group"/g) || []).length, 2);
  assert.equal((out.html.match(/role="radio"/g) || []).length, 3);
  assert.equal((out.html.match(/aria-checked="true"/g) || []).length, 1);
  assert.match(out.html, /aria-label="选择对象"/); assert.match(out.html, /data-columns="3"/);
  assert.match(out.html, /待核对/); assert.match(out.html, /aria-disabled="true"/);
  assert.match(out.html, /background-image:linear-gradient/);
  out.nodes[0].props.onValueChange('a'); assert.deepEqual(calls, ['a']); assert.equal(props.value, 'b');
  assert.equal((html(api.DialogOptionGrid, props).match(/aria-checked="true"/g) || []).length, 1);
});

test('empty grid, absent optional nodes, and all column counts are supported', () => {
  const props = { label: '对象', value: null, onValueChange() {} };
  assert.doesNotMatch(html(api.DialogOptionGrid, props), /data-dialog-grid-empty|role="radio"/);
  const empty = html(api.DialogOptionGrid, { ...props, groups: [{ id: 'empty', title: '空组', children: [] }], emptyText: '没有匹配对象' });
  assert.match(empty, /没有匹配对象/); assert.doesNotMatch(empty, /空组|role="group"/);
  for (const columns of [2, 3, 4]) {
    const out = html(api.DialogOptionGrid, { ...props, columns, children: h(api.DialogOptionGridItem, { value: 'a', title: '成员甲' }) });
    assert.match(out, new RegExp(`data-columns="${columns}"`));
    assert.doesNotMatch(out, /aria-checked="true"|待核对|aria-describedby=/);
  }
});

test('ChoiceList has real coss radios and a host-owned other input outside the group', () => {
  const props = { label: '选择理由', value: 'other', onValueChange() {}, children: [h(api.DialogChoice, { key: 'a', value: 'a', title: '内容可辨认' }), h(api.DialogChoice, { key: 'other', value: 'other', title: '其他' })] };
  const out = html(api.DialogChoiceList, { ...props, other: h('label', {}, '其他理由', h('input', { name: 'reason' })) });
  assert.equal((out.match(/role="radiogroup"/g) || []).length, 1);
  assert.equal((out.match(/role="radio"/g) || []).length, 2);
  assert.equal((out.match(/aria-checked="true"/g) || []).length, 1);
  assert.match(out, /data-dialog-choice-other/); assert.match(out, /其他理由/);
  assert.doesNotMatch(html(api.DialogChoiceList, props), /data-dialog-choice-other/);
});

test('record uses dt/dd, sections are labelled, and notice uses all supported host tones', () => {
  const record = html(api.DialogRecord, { rows: [{ label: '结果', value: '未提供' }, { label: '页数', value: 0 }] });
  assert.equal((record.match(/<dt /g) || []).length, 2); assert.equal((record.match(/<dd /g) || []).length, 2); assert.match(record, />0<\/dd>/);
  const section = html(api.DialogSection, { title: '需要完整呈现的较长中文标题', children: record });
  assert.match(section, /<section aria-labelledby=/);
  for (const tone of ['warning', 'info', 'error']) {
    const out = html(api.DialogNotice, { tone, children: '外部事实' });
    assert.match(out, new RegExp(`data-dialog-notice="${tone}"`)); assert.match(out, /外部事实/); assert.doesNotMatch(out, /role="alert"/);
  }
});

test('catalog keeps one pattern and registers editing and reference examples', () => {
  assert.equal(components.length, 103);
  assert.equal(components.filter(item => !item.kind).length, 54);
  assert.equal(components.filter(item => item.kind === 'pattern').length, 39);
  assert.equal(components.filter(item => item.id === 'dialog-layout').length, 1);
  assert.equal(searchComponents('Dialog Layout')[0].href, '/next/components/dialog-layout');
  assert.ok(coreAgentSpecs['dialog-layout'].accessibility.length);
  const demo = html(real.DialogLayoutDemo);
  for (const id of ['dispose', 'assign', 'record', 'reason', 'small', 'long', 'form', 'references']) assert.ok(demo.includes(`id="${id}"`));
  assert.match(demo, /中性示例数据/);
  assert.match(demo, /本页记录：材料甲/);
  for (const domain of ['coss.com', 'base-ui.com', 'radix-ui.com', 'react-aria.adobe.com', 'carbondesignsystem.com']) assert.ok(demo.includes(domain), domain);
});

test('built component route renders its examples and Agent Spec', async () => {
  const { default: worker } = await import('../dist/server/index.js');
  const response = await worker.fetch(new Request('http://localhost/next/components/dialog-layout', { headers: { accept: 'text/html' } }), { ASSETS: { fetch: async () => new Response('Not found', { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
  assert.equal(response.status, 200);
  const out = await response.text();
  for (const text of ['Dialog Layout 对话框版式', '处理异常', '从多人中选择', '查看记录', '选择理由', '长内容滚动', '表单、等待与关闭确认', '参考与取舍', 'Agent Spec']) assert.ok(out.includes(text), text);
});
