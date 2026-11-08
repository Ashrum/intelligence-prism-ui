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
const runtime = await createTestRuntime('p154');
const h = React.createElement;
const modules = ['work', 'blueprint', 'drafting', 'motion'];
async function bundle(name, baseline = false, revision = '8a45524') {
  const output = await build({
    stdin: { contents: modules.map(name => `export * from './components/prism-next/blueprint/${name}';`).join('\n'), loader: 'tsx', resolveDir: root },
    bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, write: false,
    plugins: baseline ? [{ name: 'baseline-8a45524', setup(builder) {
      builder.onLoad({ filter: /prism-next\/blueprint\/.*\.tsx$/ }, args => ({ contents: execFileSync('git', ['show', `${revision}:${args.path.slice(root.length)}`], { cwd: root, encoding: 'utf8' }), loader: 'tsx' }));
    } }] : [],
  });
  const url = new URL(`${name}.mjs`, runtime);
  writeFileSync(url, output.outputFiles[0].text);
  return import(url);
}
const before = await bundle('before', true);
const after = await bundle('after');
const p155Before = await bundle('p155-before', true, 'fdfed77');
const render = (component, props = {}) => renderToStaticMarkup(h(component, props));

test('P154 reference span, button and link expose names and supplied current state', () => {
  for (const [tag, props] of [['span', {}], ['button', { onOpen() {} }], ['a', { href: '#object' }]]) {
    for (const current of [false, true]) {
      const html = render(after.BpObjectRef, { code: 'R1', label: '批阅结果', current, ...props });
      assert.ok(html.startsWith(`<${tag} `));
      assert.ok(html.includes(`aria-label="${tag === 'span' ? '' : '在右栏打开 '}R1 批阅结果"`));
      assert.equal(html.includes('aria-current="true"'), current);
      assert.match(html, /font-mono text-ui-meta font-semibold/);
      if (tag === 'button') assert.match(html, /type="button"/);
      if (tag === 'a') assert.match(html, /href="#object"/);
    }
  }
  let opened = 0;
  after.BpObjectRef({ code: 'R1', label: '结果', onOpen: () => opened++ }).props.onClick();
  assert.equal(opened, 1);
});

test('P154 result and focus contain named container rules and supplied slots', () => {
  const row = render(after.BpResultRow, { title: '结果', refCode: 'R1', meta: '已发布', action: h('button', null, '打开'), current: true, children: '题号' });
  assert.match(row, /@container\/bp-result/);
  assert.ok(row.includes('[@container_bp-result_(max-width:480px)]:col-span-full'));
  assert.ok(row.includes('[@container_bp-result_(max-width:480px)]:[&amp;&gt;*]:w-full'));
  assert.match(row, /outline-2 outline-\(--link\)/);
  assert.match(row, /结果/); assert.match(row, /已发布/); assert.match(row, /题号/);
  assert.doesNotMatch(render(after.BpResultRow, { title: '结果' }), /outline-2/);
  const focus = render(after.BpFocusBlock, { title: '先看', actions: h('button', null, '查看'), children: '说明' });
  assert.match(focus, /^<section/); assert.match(focus, /<h3 /);
  assert.match(focus, /border-l-warning-foreground/);
  assert.ok(focus.includes('[@container_bp-focus_(max-width:640px)]:flex-col'));
  assert.ok(focus.includes('[@container_bp-focus_(max-width:640px)]:[&amp;&gt;:first-child]:w-full'));
  assert.match(render(after.BpFocusBlock, { title: '先看', tone: 'neutral' }), /border-l-border/);
});

test('P154 docked pane keeps semantic slots, labelled controls and scroll body', () => {
  const html = render(after.BpObjectPane, { title: '批阅', meta: '结果 v1', children: '正文', tabs: '页签', footer: '主操作', grid: true, onClose() {}, onExpand() {}, position: { current: 1, total: 3, onPrev() {}, onNext() {} } });
  assert.match(html, /^<aside/); assert.match(html, /<h2 /); assert.match(html, /<footer /);
  for (const label of ['上一项', '下一项', '专注查看', '关闭右栏', '对象正文']) assert.ok(html.includes(`aria-label="${label}"`));
  assert.match(html, /aria-label="上一项" disabled=""/);
  assert.match(html, /min-h-0 min-w-0 flex-1 overflow-auto/);
  assert.match(html, /linear-gradient/);
  assert.doesNotMatch(html, /role="dialog"|aria-modal/);
  assert.ok(html.indexOf('结果 v1') < html.indexOf('页签'));
  assert.ok(html.indexOf('页签') < html.indexOf('>正文<'));
  assert.ok(html.indexOf('>正文<') < html.indexOf('主操作'));
});

test('P154 Escape closes only unconsumed non-editing pane events', () => {
  let closed = 0;
  let stopped = 0;
  const pane = after.BpObjectPane({ title: '批阅', children: '正文', onClose: () => closed++ });
  const event = { key: 'Escape', defaultPrevented: false, nativeEvent: { isComposing: false }, target: { closest: () => null }, stopPropagation: () => stopped++ };
  pane.props.onKeyDown(event);
  assert.equal(closed, 1); assert.equal(stopped, 1);
  for (const key of ['Enter', 'Tab']) pane.props.onKeyDown({ ...event, key });
  pane.props.onKeyDown({ ...event, defaultPrevented: true });
  pane.props.onKeyDown({ ...event, nativeEvent: { isComposing: true } });
  for (const selector of ['input', 'textarea', 'select', '[contenteditable]:not([contenteditable="false"])', '[role="textbox"]']) {
    pane.props.onKeyDown({ ...event, target: { closest(query) { assert.ok(query.includes(selector)); return {}; } } });
  }
  assert.equal(closed, 1); assert.equal(stopped, 1);
});

const fixtures = {
  BlueprintInlineCode: { active: true, code: 'A' },
  BlueprintInlineFolio: { active: true, folio: { kind: 'sheet', value: '1' } },
  BlueprintFrame: { active: true, children: h('div', null, '内容') },
  BlueprintSectionHeader: { title: '标题' }, BlueprintSheet: { title: '标题', children: '正文' },
  BpMinor: { children: '小节' }, BpFigCap: { label: '图', children: '说明' },
  BpButton: { children: '操作' }, BpTool: { children: '操作' },
  BpSegTabs: { label: '页签', value: 'a', onValueChange() {}, items: [{ value: 'a', label: '概览' }] },
  BpSteps: { steps: [{ id: 'a', label: '开始' }], current: 0 },
  BpCard: { name: '卡片', description: '描述', href: '#card' }, BpCardNote: { children: '备注' },
  BpPaneHead: { title: '栏头' }, BpFrameCard: { title: '标题', children: '内容' }, BpSectionCard: { title: '标题', children: '内容' },
  BpSizeBar: { rows: [{ id: 'a', label: '得分', total: 100, segments: [{ id: 'a', label: '得分', value: 76, fill: 'accent' }] }] },
  BpStat: { label: '得分率', value: '76', unit: '%' }, BpStatStrip: { children: '指标' },
  BpMetric: { name: '得分', max: 100, baseline: { label: '之前', value: 60 }, current: { label: '现在', value: 76 }, gain: 16 },
  BpMetricLegend: { baseline: '之前', current: '现在' },
  BpFacts: { items: [{ id: 'a', label: '有效', value: 45 }] }, BpTitleBlock: { items: [{ id: 'a', label: '有效', value: 45 }] },
  BpCallout: { title: '提示', children: '说明' }, BpError: { location: '题目', message: '错误' },
  BpAnnotatedText: { parts: ['文本', { text: '标注', n: 1 }] }, BpAnnotationList: { items: [{ n: 1, rule: '规则', message: '说明' }] },
  BpCodebox: { file: 'demo.ts', children: '代码' }, BpToast: { children: '完成' },
  BpWorkHeader: { back: { label: '列表', href: '#list' }, title: '批阅' }, BpWorkBody: { children: '正文' },
  BpWorkTabs: { label: '部分', defaultValue: 'a', items: [{ value: 'a', label: '概览', content: '正文' }] },
  BpConclusion: { children: '结论' }, BpMark: { children: '重点' }, BpRef: { href: '#ref', children: '①' },
  BpProvenance: { items: [{ label: '依据', value: '作答' }] }, BpAnswerLabel: { kind: 'observe' },
  BpProvenanceLine: { items: [{ value: '作答' }] }, BpSidePeek: { title: '题目', trigger: h('button', null, '查看'), children: '正文' },
  BpStatus: { tone: 'done', children: '完成' }, BpDimension: { orientation: 'horizontal', at: 10, from: 0, to: 30, label: '尺寸', tone: 'up' },
  BpUnitGrid: { label: '学生', groups: [{ id: 'a', label: '完成', count: 3, fill: 'done' }] },
  BpDraft: { state: 'draft', title: '草稿', children: '内容' }, BpInferred: { children: '推测' },
  BpSkeleton: {}, BpWorkLine: {}, BpWorking: { tier: 'short', step: '正在组织答复' }, BpUndoToast: { children: '已移除' }, BpCaret: {},
};
const baselineNames = modules.flatMap(module => {
  const source = execFileSync('git', ['show', `8a45524:components/prism-next/blueprint/${module}.tsx`], { cwd: root, encoding: 'utf8' });
  return [...source.matchAll(/export function ((?:Bp|Blueprint)\w+)\(/g)].map(match => match[1]);
});
test('P154 SSR fixtures cover every component declared in the four baseline modules', () => {
  assert.deepEqual(Object.keys(fixtures).sort(), baselineNames.sort());
});
for (const theme of ['light', 'paper', 'dark', 'blueprint', 'blueprint-night']) test(`P154 ${theme}: all existing component exports SSR equal 8a45524 bytes`, () => {
  for (const [name, props] of Object.entries(fixtures)) {
    const themed = api => renderToStaticMarkup(h('div', { 'data-prism-theme': theme }, h(api[name], props)));
    assert.equal(themed(after), themed(before), name);
  }
});


test('P155 optional close leaves Escape and other callbacks untouched', () => {
  let expanded = 0;
  const props = { title: '任务', children: '正文', onExpand: () => expanded++ };
  assert.doesNotMatch(render(after.BpObjectPane, props), /aria-label="关闭右栏"|>×</);
  after.BpObjectPane(props).props.onKeyDown({ key: 'Escape', stopPropagation() { assert.fail('must not consume Escape'); } });
  assert.equal(expanded, 0);
});

test('P155 expanded state switches labels and glyphs with host-owned intent', () => {
  let count = 0;
  for (const custom of [false, true]) for (const expanded of [false, true]) {
    const props = { title: '任务', children: '正文', expanded, onExpand: () => count++, onClose() {}, ...(custom ? { expandLabel: '展开详情', restoreLabel: '恢复侧栏', closeLabel: '收起详情' } : {}) };
    const html = render(after.BpObjectPane, props);
    assert.ok(html.includes(`aria-label="${expanded ? (custom ? '恢复侧栏' : '还原') : (custom ? '展开详情' : '专注查看')}"`));
    assert.ok(html.includes(`>${expanded ? '⤡' : '⤢'}</button>`));
    assert.ok(!html.includes(`>${expanded ? '⤢' : '⤡'}</button>`));
    assert.ok(html.includes(`aria-label="${custom ? '收起详情' : '关闭右栏'}"`));
    const pane = after.BpObjectPane(props);
    const buttons = React.Children.toArray(pane.props.children[0].props.children[0].props.children);
    buttons.find(child => child.props.onClick === props.onExpand).props.onClick();
  }
  assert.equal(count, 4);
});

test('P155 root and scroll body merge props and chain keyboard handlers', () => {
  const calls = [];
  const props = { title: '任务', children: '正文', className: 'host-pane', 'data-host': 'pane', 'aria-label': '任务右栏', onKeyDown: () => calls.push('host'), onClose: () => calls.push('close'), bodyProps: { className: 'host-body', 'data-workspace-scroll': 'true', tabIndex: -1, 'aria-label': '任务正文' } };
  const html = render(after.BpObjectPane, props);
  assert.match(html, /^<aside[^>]*aria-label="任务右栏"[^>]*data-host="pane"[^>]*class="bp-object-pane [^"]*host-pane"/);
  assert.match(html, /<div tabindex="-1" aria-label="任务正文" class="bp-object-pane-body [^"]*overflow-auto [^"]*host-body" data-workspace-scroll="true">正文<\/div>/);
  const event = { key: 'Escape', defaultPrevented: false, nativeEvent: { isComposing: false }, target: { closest: () => null }, stopPropagation: () => calls.push('stop') };
  after.BpObjectPane(props).props.onKeyDown(event);
  assert.deepEqual(calls, ['host', 'stop', 'close']);
  calls.length = 0;
  after.BpObjectPane({ ...props, onKeyDown(event) { calls.push('host'); event.defaultPrevented = true; } }).props.onKeyDown({ ...event });
  assert.deepEqual(calls, ['host']);
  calls.length = 0;
  after.BpObjectPane({ ...props, onClose: undefined }).props.onKeyDown({ ...event });
  assert.deepEqual(calls, ['host']);
  assert.match(render(after.BpObjectPane, { title: '任务', children: '正文' }), /tabindex="0" aria-label="对象正文"/);
});

const p155Fixtures = { ...fixtures,
  BpObjectRef: { code: 'R1', label: '结果' },
  BpResultRow: { title: '结果', children: '正文' },
  BpFocusBlock: { title: '先看', children: '正文' },
  BpObjectPane: { title: '结果', children: '正文', onClose() {}, onExpand() {} },
};
for (const theme of ['light', 'paper', 'dark', 'blueprint', 'blueprint-night']) test(`P155 ${theme}: existing components and default pane SSR equal fdfed77 bytes`, () => {
  for (const [name, props] of Object.entries(p155Fixtures)) {
    const themed = api => renderToStaticMarkup(h('div', { 'data-prism-theme': theme }, h(api[name], props)));
    assert.equal(themed(after), themed(p155Before), name);
  }
});
