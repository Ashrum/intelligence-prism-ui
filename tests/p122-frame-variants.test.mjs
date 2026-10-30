import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup as render } from 'react-dom/server';
import postcss from 'postcss';
import { transform } from 'lightningcss';
import { createTestRuntime } from './helpers/test-runtime.mjs';
import { clientDOM } from './helpers/chart-client-dom.mjs';

const root = fileURLToPath(new URL('../', import.meta.url)), h = React.createElement;
const baseline = '7e814d22f0ab4efbd98bc2047a50124dd4f89100';
const source = 'components/prism-next/blueprint/blueprint.tsx', cssPath = 'app/(next)/next/blueprint.css';
const read = p => readFileSync(root + p, 'utf8');
const before = p => execFileSync('git', ['show', `${baseline}:${p}`], { cwd: root, encoding: 'utf8' });
const runtime = await createTestRuntime('p122');
async function bundle(old) {
  const file = new URL(old ? 'before.mjs' : 'after.mjs', runtime);
  writeFileSync(file, (await build({ stdin: { contents: `export * from './${source}'; ${old ? '' : "export * from './components/prism-next/demos/blueprint-frame-variants';"}`, loader: 'tsx', resolveDir: root }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, write: false, plugins: old ? [{ name: 'baseline', setup(b) { b.onLoad({ filter: /blueprint\/blueprint\.tsx$/ }, () => ({ contents: before(source), loader: 'tsx' })); } }] : [] })).outputFiles[0].text);
  return import(file);
}
const old = await bundle(true), api = await bundle(false);
const themes = ['light', 'paper', 'dark', 'blueprint', 'blueprint-night'];
const items = Array.from({ length: 5 }, (_, i) => ({ id: String(i), label: `字段 ${i}`, value: `长中文事实 ${i}`, numeric: i === 0, tone: i === 1 ? 'warn' : 'default' }));
const rows = [{ id: 'long', label: '一元二次方程的根与系数关系及其在实际问题中的应用', unit: '人', total: 40, segments: [{ id: 'known', label: '已掌握', value: 28, fill: 'ink' }, { id: 'pending', label: '待复核', value: 0, fill: 'hatch' }] }];
const cases = [
  ...[undefined, 'horizontal', 'vertical'].map(orientation => ['BpSegTabs', { label: '报告分区', items: [{ value: 'a', label: '概览' }, { value: 'b', label: '明细', disabled: true }], value: 'a', orientation, onValueChange() {} }]),
  ...['default', 'compact'].flatMap(density => [0, 1, 2, 3, 4, 5].map(n => ['BpTitleBlock', { density, items: items.slice(0, n), note: '数据截止时间未提供' }])),
  ...['default', 'compact'].flatMap(density => [true, false].map(selected => ['BpSectionCard', { density, selected, titleRule: true, title: '分节 x²', letter: 'B', meta: '40 人', action: h('button', null, '查看'), children: '正文', 'aria-current': 'page' }])),
  ['BpStatStrip', { id: 'stats', 'aria-label': '本次学情', children: h('div', null, h('dt', null, '已提交'), h('dd', null, '40')) }],
  ...['default', 'sm', 'xs'].flatMap(size => [true, false].flatMap(hideRowLabel => [true, false].flatMap(framed => [undefined, '', '28 / 40'].map(display => ['BpSizeBar', { rows: [{ ...rows[0], display }], size, hideRowLabel, framed, marker: { value: 30, label: '目标' } }])))),
  ['BpSizeBar', { rows, onRowActivate() {}, activeRowId: 'long', rowActionLabel: row => `查看：${row.label}` }],
];
for (const theme of themes) test(`P122 ${theme}: ${cases.length} absent / undefined / explicit defaults preserve baseline SSR bytes`, () => {
  for (const [name, props] of cases) {
    const key = name === 'BpSizeBar' ? 'labelWidth' : 'frame';
    const base = render(h('div', { 'data-prism-theme': theme }, h(old[name], props)));
    for (const extra of [{}, { [key]: undefined }, { [key]: 'default' }]) assert.equal(render(h('div', { 'data-prism-theme': theme }, h(api[name], { ...props, ...extra }))), base, `${name}/${JSON.stringify(props)}`);
  }
});
test('P122 frame variants change only the explicit data attribute; slots, density, selection and semantics survive', () => {
  for (const [name, props] of cases.filter(([name]) => name !== 'BpSizeBar')) for (const frame of ['subtle', 'none']) {
    const html = render(h(api[name], { ...props, frame }));
    assert.equal(html.replace(` data-frame="${frame}"`, ''), render(h(old[name], props)));
    assert.doesNotMatch(html, / frame=/);
  }
});
function treeNodes(tree, out = []) {
  if (Array.isArray(tree)) tree.forEach(n => treeNodes(n, out));
  else if (React.isValidElement(tree)) { out.push(tree); treeNodes(tree.props.children, out); }
  return out;
}
test('P122 wide labels preserve full titles, accessible facts, graphemes and exact row activation', () => {
  for (const label of [rows[0].label, '函数 x²', 'A', '', 'e\u0301数学👨‍👩‍👧‍👦综合应用']) for (const interactive of [false, true]) {
    const calls = [], props = { rows: [{ ...rows[0], label }], labelWidth: 'wide', legend: false, onRowActivate: interactive ? id => calls.push(id) : undefined, rowActionLabel: () => '打开详情' };
    const tree = api.BpSizeBar(props), nodes = treeNodes(tree);
    const name = nodes.find(n => n.props.className === 'bp-size-label text-item-title');
    assert.equal(name.props.title, label);
    assert.equal(React.Children.toArray(name.props.children).map(n => n.props.children).join(''), label);
    const segment = [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(label)].map(p => p.segment);
    assert.equal(name.props.children[1].props.children, segment.slice(segment.length - Math.min(4, Math.floor(segment.length / 2))).join(''));
    if (interactive) {
      const button = nodes.find(n => n.type === 'button');
      assert.ok(button.props['aria-label'].includes(label));
      assert.match(button.props['aria-label'], /已掌握 28人，待复核 0人/);
      button.props.onClick(); assert.deepEqual(calls, ['long']);
      assert.equal(button.props['aria-current'], undefined);
      assert.equal(name.props['aria-hidden'], true);
    } else {
      assert.equal(name.props['aria-label'], label);
      assert.equal(name.props.role, 'img');
      assert.ok(nodes.some(n => n.props['aria-label'] === `${label}：已掌握 28人，待复核 0人`));
    }
  }
});
test('P122 hidden labels and xs take precedence; wide does not change fill geometry, formatter or empty rows', () => {
  for (const size of ['default', 'sm', 'xs']) for (const hideRowLabel of [false, true]) {
    const props = { rows, size, hideRowLabel, formatValue: value => ({ text: `${value}%`, ariaText: `百分之${value}` }), marker: { value: 30, label: '目标' } };
    const a = render(h(api.BpSizeBar, props)), b = render(h(api.BpSizeBar, { ...props, labelWidth: 'wide' }));
    const fills = s => [...s.matchAll(/class="bp-fill-[^"]*" style="[^"]*"/g)].map(m => m[0]);
    assert.deepEqual(fills(b), fills(a));
    assert.match(b, /百分之28/);
    if (size === 'xs' || hideRowLabel) { assert.equal(a, b); assert.doesNotMatch(b, /data-label-width|bp-size-label/); }
  }
  assert.doesNotThrow(() => render(h(api.BpSizeBar, { rows: [], labelWidth: 'wide' })));
});

const css = read(cssPath), index = css.indexOf('\n/* P122 ·'), block = css.slice(index), ast = postcss.parse(block);
test('P122 append-only CSS, unchanged tokens, frozen coss and no dependency changes', () => {
  assert.ok(index > 0); assert.equal(css.slice(0, index), before(cssPath));
  for (const path of ['app/(next)/next/theme.css', 'package.json', 'package-lock.json']) assert.equal(read(path), before(path));
  assert.equal(execFileSync('git', ['diff', baseline, '--', 'components/coss'], { cwd: root, encoding: 'utf8' }), '');
  assert.doesNotThrow(() => transform({ code: Buffer.from(block), minify: true }));
  ast.walkRules(rule => {
    assert.match(rule.selector, /data-prism-theme="blueprint"/); assert.match(rule.selector, /data-prism-theme="blueprint-night"/);
    assert.match(rule.selector, /:not\(:where\(\[data-agent-preview\]/);
    rule.walkDecls(d => { assert.ok(!d.prop.startsWith('--')); assert.doesNotMatch(d.prop, /font|color$|radius/); });
  });
  assert.deepEqual([...new Set([...block.matchAll(/var\((--[\w-]+)\)/g)].map(m => m[1]))].sort(), ['--border', '--line']);
});
// Static CSS selector/query/declaration evaluation, not a browser computed-style engine.
function node(attrs = {}, parent, tag = 'div') { const n = { attrs, parent, tag, children: [] }; parent?.children.push(n); return n; }
function parse(selector) { let value; transform({ code: Buffer.from(`${selector}{color:red}`), visitor: { Selector(s) { value = s; } } }); return value; }
function matches(s, n) {
  if (!n) return false;
  const split = s.findLastIndex(p => p.type === 'combinator');
  if (split >= 0) {
    if (!matches(s.slice(split + 1), n)) return false;
    const left = s.slice(0, split), kind = s[split].value;
    if (kind === 'child') return matches(left, n.parent);
    if (kind === 'next-sibling') return matches(left, n.parent?.children[n.parent.children.indexOf(n) - 1]);
    assert.equal(kind, 'descendant');
    for (let p = n.parent; p; p = p.parent) if (matches(left, p)) return true;
    return false;
  }
  return s.every(p => {
    if (p.type === 'class') return (n.attrs.class ?? '').split(/\s+/).includes(p.name);
    if (p.type === 'type') return n.tag === p.name;
    if (p.type === 'universal') return true;
    if (p.type === 'attribute') return p.operation ? n.attrs[p.name] === p.operation.value : Object.hasOwn(n.attrs, p.name);
    if (p.type === 'pseudo-class' && ['is', 'where', 'not'].includes(p.kind)) { const any = p.selectors.some(s => matches(s, n)); return p.kind === 'not' ? !any : any; }
    if (p.type === 'pseudo-class' && p.kind === 'nth-child') { const i = n.parent.children.indexOf(n) + 1; return p.a ? (i - p.b) / p.a >= 0 && (i - p.b) % p.a === 0 : i === p.b; }
    assert.fail(`Unsupported selector ${JSON.stringify(p)}`);
  });
}
const rules = []; ast.walkRules(r => rules.push({ selectors: r.selectors.map(parse), declarations: Object.fromEntries(r.nodes.map(d => [d.prop, d.value])), query: r.parent.type === 'atrule' ? r.parent : undefined }));
function declarations(n, { viewport = 1280, container = 1000 } = {}) {
  return Object.assign({}, ...rules.filter(r => (!r.query || (r.query.name === 'media' ? viewport : container) <= Number(r.query.params.match(/max-width:(\d+)px/)[1])) && r.selectors.some(s => matches(s, n))).map(r => r.declarations));
}
for (const theme of themes) test(`P122 ${theme}: isolated frame rules, nested preview roots and descendants`, () => {
  for (const outer of [undefined, ...themes]) for (const self of [false, true]) for (const frame of ['default', 'subtle', 'none']) for (const c of ['bp-stat-strip', 'bp-titleblock', 'bp-seg-tabs', 'bp-section-card']) {
    const parent = outer ? node({ 'data-prism-theme': outer }) : undefined;
    const attrs = { 'data-agent-preview': '', 'data-prism-theme': theme };
    const preview = node(attrs, parent);
    const target = self ? node({ ...attrs, class: c, 'data-frame': frame }, parent) : node({ class: c, 'data-frame': frame }, preview);
    const d = declarations(target), active = theme.startsWith('blueprint') && frame !== 'default';
    if (!active) assert.deepEqual(d, {});
    else if (frame === 'none') assert.equal(d.border, '0');
    else if (c === 'bp-stat-strip') assert.equal(d.border, '1px solid var(--border)');
    else assert.equal(d['border-width'], '1px');
    if (c === 'bp-section-card') assert.deepEqual(declarations(node({ class: 'bp-section-card-head' }, target)), active ? { 'border-bottom-width': '1px' } : {});
  }
});
for (const theme of ['blueprint', 'blueprint-night']) test(`P122 ${theme}: titleblock none uses inner-only separators for 1–5 cells at both container widths`, () => {
  for (const count of [1, 2, 3, 4, 5]) for (const container of [390, 960]) {
    const root = node({ 'data-prism-theme': theme }), title = node({ class: 'bp-titleblock', 'data-frame': 'none' }, root);
    const cells = Array.from({ length: count }, () => node({}, title));
    cells.forEach((cell, i) => {
      const d = declarations(cell, { container });
      assert.equal(d['box-shadow'], 'none');
      assert.equal(d['border-left'], container > 480 ? (i ? '1px solid var(--line)' : undefined) : (i % 2 ? '1px solid var(--line)' : i ? '0' : undefined));
      assert.equal(d['border-top'], container <= 480 && i >= 2 ? '1px solid var(--line)' : undefined);
      assert.equal(d['border-right'], undefined); assert.equal(d['border-bottom'], undefined);
    });
  }
});
for (const theme of themes) test(`P122 ${theme}: wide grid, middle ellipsis and narrow viewport/container declarations`, () => {
  for (const viewport of [390, 1280]) for (const container of [280, 320, 800]) for (const display of [false, true]) {
    const root = node({ 'data-prism-theme': theme }), chart = node({ 'data-size-label-width': 'wide' }, root);
    const row = node({ class: 'bp-size-row', 'data-label-width': 'wide', ...(display ? { 'data-display': '' } : {}) }, chart);
    const label = node({ class: 'bp-size-label' }, row), start = node({ class: 'bp-size-label-start' }, label), end = node({ class: 'bp-size-label-end' }, label), bar = node({ class: 'bp-size-bar' }, row);
    const env = { viewport, container }, narrow = viewport <= 760 || container <= 420;
    if (!theme.startsWith('blueprint')) { for (const n of [chart, row, label, start, end, bar]) assert.deepEqual(declarations(n, env), {}); continue; }
    assert.equal(declarations(row, env)['grid-template-columns'], narrow ? 'minmax(120px,40%) minmax(0,1fr)' : `minmax(120px,40%) minmax(0,1fr) ${display ? 'minmax(84px,1fr)' : '84px'}`);
    assert.equal(declarations(bar, env)['grid-row'], narrow ? '2' : '1');
    assert.equal(declarations(bar, env)['grid-column'], narrow ? '1 / -1' : '2');
    assert.equal(declarations(label, env)['white-space'], 'nowrap');
    assert.equal(declarations(start, env)['text-overflow'], 'ellipsis');
    assert.equal(declarations(end, env)['flex-shrink'], '0');
  }
});

test('P122 real demo integration: theme → none → report section → width → row activation uses the shipped data and controls', async () => {
  const keys = ['window', 'document', 'IS_REACT_ACT_ENVIRONMENT'], saved = Object.fromEntries(keys.map(k => [k, Object.getOwnPropertyDescriptor(globalThis, k)]));
  const dom = clientDOM(390, 240); Object.assign(globalThis, { window: dom.window, document: dom.document, IS_REACT_ACT_ENVIRONMENT: true });
  const host = dom.document.createElement('div'), mounted = createRoot(host);
  const all = (n, result = []) => { if (n.nodeType === 1) result.push(n); n.childNodes?.forEach(c => all(c, result)); return result; };
  // Extend the commit-only DOM with the actual attribute queries used by the existing scroll hook.
  const proto = dom.window.HTMLElement.prototype;
  proto.querySelectorAll = function(selector) { return all(this).slice(1).filter(n => selector.split(',').some(part => [...part.matchAll(/\[([\w-]+)="([^"]*)"\]/g)].every(([, key, value]) => n.getAttribute(key) === value))); };
  proto.querySelector = function(selector) { return this.querySelectorAll(selector)[0] ?? null; };
  Object.defineProperties(proto, { scrollWidth: { get: () => 390 }, clientWidth: { get: () => 390 } });
  const handlers = n => n[Object.keys(n).find(k => k.startsWith('__reactProps$'))];
  const group = label => all(host).find(n => n.getAttribute('role') === 'radiogroup' && n.getAttribute('aria-label') === label);
  const choose = async (label, text) => { const button = all(group(label)).find(n => n.tagName === 'BUTTON' && n.textContent === text); assert.ok(button, `${label}/${text}`); await act(() => handlers(button).onClick()); };
  try {
    await act(() => mounted.render(h(api.BlueprintFrameVariantsDemo)));
    for (const theme of ['夜图', '浅色', '暖纸', '深色', '蓝图']) await choose('框线与名称示例主题', theme);
    await choose('框线层级预览', '无框');
    for (const c of ['bp-stat-strip', 'bp-titleblock', 'bp-section-card']) assert.ok(all(host).some(n => n.getAttribute('class')?.split(' ').includes(c) && n.getAttribute('data-frame') === 'none'));
    await choose('示例报告分区', '知识点表现');
    assert.ok(all(host).some(n => n.tagName === 'H3' && n.textContent === '知识点表现'));
    await choose('名称列宽预览', '默认名称列'); assert.ok(all(host).every(n => n.getAttribute('data-label-width') === null));
    await choose('名称列宽预览', '宽名称列');
    const buttons = all(host).filter(n => n.tagName === 'BUTTON' && n.getAttribute('class')?.includes('bp-size-row-action'));
    assert.equal(buttons.length, 3);
    await act(() => handlers(buttons[1]).onClick());
    assert.equal(buttons[1].getAttribute('aria-current'), 'true');
    assert.equal(buttons[0].getAttribute('aria-current'), null);
    assert.equal(all(host).find(n => n.getAttribute('role') === 'status').textContent, '当前选中：相似三角形的判定与性质（长中文知识点）');
    assert.ok(all(host).some(n => n.getAttribute('title') === rows[0].label));
  } finally {
    await act(() => mounted.unmount());
    for (const k of keys) if (saved[k]) Object.defineProperty(globalThis, k, saved[k]); else delete globalThis[k];
  }
});
