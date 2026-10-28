import { assertP121Hash } from './helpers/p121-freeze-compat.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { restoreDigitalLayout } from './p55-layout-compat.mjs';
import { api, h, render, capture, records, captureRecord, click, mixed, digital, preview, baselineCases } from './p54-harness.mjs';
const hash = text => createHash('sha256').update(text).digest('hex');
const before = JSON.parse(await readFile(new URL('./fixtures/p54-default-before.json', import.meta.url), 'utf8'));
const root = fileURLToPath(new URL('../', import.meta.url));
const dir = new URL(`../.sites-runtime/p54-width-${process.pid}/`, import.meta.url);
await mkdir(dir, { recursive: true });
const file = new URL('probe.mjs', dir);
await writeFile(file, (await build({ stdin: { contents: "export {PaperPreviewMixed} from './components/prism-next/paper-preview-mixed';", resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false,
  plugins: [{ name: 'measured-viewport', setup(build) {
    build.onLoad({ filter: /paper-preview-mixed\.tsx$/ }, async args => ({ loader: 'tsx', contents: (await readFile(args.path, 'utf8')).replace('useState({ width: 740, height: 828 })', 'useState((globalThis as any).__p54Viewport as { width: number; height: number })') }));
  } }],
})).outputFiles[0].text);
const probe = await import(file); await rm(file);
function atWidth(width, props = digital) {
  globalThis.__p54Viewport = { width, height: 828 };
  try { return capture(probe.PaperPreviewMixed, props); } finally { delete globalThis.__p54Viewport; }
}
const style = (out, className) => out.nodes.find(node => node.props.className === className).props.style;

test('P54 scan-containing, continuous, empty and no-toggle outputs preserve pre-change bytes', () => {
  const cases = baselineCases();
  for (const [name, html] of Object.entries(cases)) {
    if (name === 'digital') continue;
    assertP121Hash(html, before.sha256[name], `P54/${name}`);
  }
  assert.notEqual(hash(cases.digital), before.sha256.digital, 'authorized default digital layout change');
  assert.equal(hash(restoreDigitalLayout(preview({ ...digital, contentMaxWidth: 'none' }))), before.sha256.digital, 'P55 only removes the legacy digital tool reserve and adds its layout marker');
});

test('P54 reading column caps at rounded A4 100%, centers and retains narrow available width', () => {
  assert.equal(Math.round(api.paperDimensions().width), 794);
  for (const width of [248, 318, 740, 794, 1208, 1848]) {
    const out = atWidth(width);
    const expected = Math.min(width, 794);
    assert.deepEqual(style(out, 'd1-paper-spread'), { width: expected });
    assert.deepEqual(style(out, 'd1-paper-column'), { width: expected });
    assert.deepEqual(out.nodes.find(node => node.type === 'section').props.style, { width: expected });
    assert.equal(out.nodes.find(node => node.props['data-page-id'] === 'digital').props['data-percent'], 100);
  }
});

test('P54 public max-width override, opt-out and invalid values respect geometry and scan compatibility', async () => {
  for (const limit of [480, 640, 1100]) {
    assert.equal(style(atWidth(1600, { ...digital, contentMaxWidth: limit }), 'd1-paper-column').width, limit);
    assert.equal(style(atWidth(248, { ...digital, contentMaxWidth: limit }), 'd1-paper-column').width, 248);
  }
  for (const invalid of [0, -10, NaN, Infinity, -Infinity, undefined]) {
    assert.equal(style(atWidth(1600, { ...digital, contentMaxWidth: invalid }), 'd1-paper-column').width, 794);
  }
  const uncapped = atWidth(1600, { ...digital, contentMaxWidth: 'none' });
  assert.equal(style(uncapped, 'd1-paper-column').width, 1600);
  assert.equal(style(uncapped, 'd1-paper-spread').width, 1600);
  const props = { ...digital, contentMaxWidth: 640 };
  assert.equal(preview(props), render(h(api.PaperPreviewMixed, props)));
  for (const pages of [mixed.pages, [mixed.pages[1]], [...mixed.pages, { id: 'missing', width: 794, height: 1123 }]]) {
    const original = atWidth(1600, { ...mixed, pages }).html;
    for (const contentMaxWidth of [480, 'none', undefined]) assert.equal(atWidth(1600, { ...mixed, pages, contentMaxWidth }).html, original);
  }
  const css = await readFile(new URL('../components/prism-next/review-workspace.css', import.meta.url), 'utf8');
  assert.match(css, /\.d1-paper-spread\s*\{\s*margin-inline:auto;/, 'same established centering rule');
});

test('P54 digital headings, headers and content share capped width without scan zoom or rotation', () => {
  const calls = [], pages = [digital.pages[0], { ...digital.pages[0], id: 'second', content: h('p', {}, '第二节正文') }];
  const out = atWidth(1600, { ...digital, pages, zoom: 200, rotations: { digital: 90, second: 270 }, headers: { digital: h('p', {}, '页眉') }, renderSectionHeading: (page, index) => { calls.push([page, index]); return h('h2', {}, `标题${index}`); } });
  assert.deepEqual(calls, pages.map((page, index) => [page, index]));
  const sections = out.nodes.filter(node => node.type === 'section');
  assert.equal(sections.length, 2); sections.forEach(node => assert.equal(node.props.style.width, 794));
  assert.ok(out.html.indexOf('标题0') < out.html.indexOf('页眉'));
  assert.ok(out.html.indexOf('页眉') < out.html.indexOf('长中文数字题面'));
  assert.doesNotMatch(out.html, /rotate\(|data-scan-paper/);
});

const toggleRow = (extra = {}) => ({ ...records.markedRecordRows[0], menu: undefined, toggle: { id: 'favorite', label: '收藏', pressedLabel: '取消收藏', pressed: false }, ...extra });
const toggleNode = out => out.nodes.find(node => node.type?.name === 'Toggle');
test('P54 row toggle exposes host pressed/name/icon and precedes the main action at standard size', () => {
  for (const pressed of [false, true]) for (const icon of [undefined, 'star', 'bookmark']) {
    const row = toggleRow({ toggle: { id: 'favorite', label: '收藏', pressedLabel: '取消收藏', pressed, icon } });
    const out = captureRecord({ rows: [row], tabs: [], showStatus: false, showType: false });
    const node = toggleNode(out);
    assert.equal(node.props.pressed, pressed); assert.equal(node.props.size, 'default');
    assert.equal(node.props['aria-label'], `${pressed ? '取消收藏' : '收藏'}：${row.tag} · ${row.name} · ${row.badges.join(' · ')}`);
    assert.match(out.html, new RegExp(`aria-pressed="${pressed}"`));
    assert.match(out.html, new RegExp(`lucide-${icon === 'bookmark' ? 'bookmark' : 'star'}`));
    assert.ok(out.html.indexOf('data-slot="toggle"') < out.html.indexOf(`aria-label="${row.action.label}：`));
    assert.doesNotMatch(out.html, /更多操作：|data-record-menu/);
  }
  const fallback = captureRecord({ rows: [toggleRow({ toggle: { id: 'favorite', label: '收藏开关', pressed: true } })], tabs: [] });
  assert.match(toggleNode(fallback).props['aria-label'], /^收藏开关：/);
});

test('P54 activation emits only toggle intent, isolates row click, and waits for external facts', () => {
  const calls = [], row = toggleRow(); Object.freeze(row.toggle);
  const props = { rows: [row], tabs: [], onRowAction: (...args) => calls.push(args) };
  const out = captureRecord(props), toggle = toggleNode(out), event = click();
  toggle.props.onClick(event); assert.equal(event.stopped, true); assert.deepEqual(calls, []);
  toggle.props.onPressedChange(true); toggle.props.onPressedChange(true);
  assert.deepEqual(calls, [[row.id, 'favorite'], [row.id, 'favorite']]);
  assert.equal(row.toggle.pressed, false);
  assert.equal(toggleNode(captureRecord(props)).props.pressed, false);
  assert.equal(toggleNode(captureRecord({ ...props, rows: [{ ...row, toggle: { ...row.toggle, pressed: true } }] })).props.pressed, true);
  const panel = out.find('FramePanel')[0];
  panel.props.onClick({ target: { closest: () => ({ tagName: 'BUTTON' }) } }); assert.equal(calls.length, 2);
  panel.props.onClick({ target: { closest: () => null } }); assert.deepEqual(calls.at(-1), [row.id, row.action.id]);
  const disabled = captureRecord({ rows: [row], tabs: [], onRowAction: undefined });
  assert.equal(toggleNode(disabled).props.disabled, true);
  toggleNode(disabled).props.onPressedChange(true);
  const separate = captureRecord({ ...props, rows: [{ ...row, action: { ...row.action, disabledReason: '未就绪' } }] });
  assert.equal(toggleNode(separate).props.disabled, false, 'main action restriction does not disable independent toggle');
});

test('P54 omitted/empty menus have no trigger and existing menu stays present with toggle', () => {
  for (const menu of [undefined, []]) {
    const out = captureRecord({ rows: [toggleRow({ menu })], tabs: [] });
    assert.doesNotMatch(out.html, /更多操作：|data-record-menu/);
    assert.ok(toggleNode(out));
  }
  const out = captureRecord({ rows: [toggleRow({ menu: [{ id: 'download', label: '下载' }] })], tabs: [] });
  assert.match(out.html, /更多操作：/); assert.match(out.html, /data-record-menu/);
  assert.ok(toggleNode(out));
});

test('P54 built routes include width controls, controlled-toggle fixture and Agent Specs', async () => {
  const { default: worker } = await import('../dist/server/index.js');
  for (const [slug, texts] of [['paper-preview/digital', ['宽屏数字阅读', '默认 794px', '自定义 640px', '不限宽', '<math>', 'P55:', '72px']], ['record-list', ['record-toggle', '宿主回填收藏事实', '320px 开关列表', '取消收藏试卷', 'data-slot="toggle"']]]) {
    const response = await worker.fetch(new Request(`http://localhost/next/components/${slug}`, { headers: { accept: 'text/html' } }), { ASSETS: { fetch: async () => new Response('Not found', { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
    assert.equal(response.status, 200); const html = await response.text();
    for (const text of [...texts, 'P54:', 'Agent Spec', 'data-prism-theme="light"', 'data-prism-theme="paper"', 'data-prism-theme="dark"']) assert.ok(html.includes(text), `${slug}: ${text}`);
  }
});
