import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { relative } from 'node:path';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import postcss from 'postcss';
import { createTestRuntime } from './helpers/test-runtime.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = await createTestRuntime('p176');
const baseline = 'ad763a2eaeb9db99ee4083e55723ffb2c6487b8b';
const paths = ['components/prism-next/document-region-viewer.tsx', 'components/prism-next/paper-preview-mixed.tsx'];
async function compile(old) {
  const file = new URL(old ? 'baseline.mjs' : 'current.mjs', runtime);
  const compiled = await build({
    stdin: { contents: `export * from './components/prism-next/document-region-viewer'; export * from './components/prism-next/paper-preview';`, resolveDir: root, loader: 'tsx' },
    bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false,
    plugins: old ? [{ name: 'p176-frozen-source', setup(builder) {
      builder.onLoad({ filter: /(?:document-region-viewer|paper-preview-mixed)\.tsx$/ }, args => {
        const path = relative(root, args.path);
        assert.ok(paths.includes(path));
        return { contents: execFileSync('git', ['show', `${baseline}:${path}`], { cwd: root, encoding: 'utf8' }), loader: 'tsx' };
      });
    } }] : [],
  });
  await writeFile(file, compiled.outputFiles[0].text);
  return import(file.href);
}
const api = await compile(false), before = await compile(true);
const h = React.createElement, noop = () => {};
function IdContent() { const id = React.useId(); return h('label', { htmlFor: id }, '正文', h('input', { id })); }
const plain = [{ id: 'r', label: '长中文区域', rect: [6, 20, 88, 30], checked: true, content: h(IdContent) }];
const mixed = { viewportRef: { current: null }, zoom: 'width', rotations: {}, selected: 'r', scale: 1, activePage: 'scan', topInset: 0, headers: {}, onSelect: noop, onZoom: noop, onVisiblePage: noop, onViewport: noop };
const digital = { id: 'digital', width: 794, height: 600, content: h(IdContent) };
const scan = { id: 'scan', width: 600, height: 820, imageUrl: '/synthetic.svg', alt: '合成扫描', regions: plain };
function capture(Component, props) {
  const nodes = [];
  function walk(node) { if (!React.isValidElement(node)) return; nodes.push(node); React.Children.forEach(node.props.children, walk); }
  function Probe() { const tree = Component(props); walk(tree); return tree; }
  return { nodes, html: render(h(Probe)) };
}
function frameNodes(props) {
  const tree = capture(api.DocumentRegionViewer, props);
  const overlay = tree.nodes.find(node => node.type === api.DocumentRegionOverlay);
  return capture(api.DocumentRegionOverlay, overlay.props);
}

test('P176 default viewer branches match ad763a2 byte-for-byte, including generated React IDs', () => {
  for (const pageLayout of [undefined, { width: 600, height: 820 }]) {
    for (const selectedId of [undefined, 'r']) {
      for (const regions of [plain, []]) {
        const props = { regions, selectedId, pageLayout, onSelect: noop, background: h(IdContent), header: h(IdContent), footer: h(IdContent) };
        assert.equal(render(h(api.DocumentRegionViewer, props)), render(h(before.DocumentRegionViewer, props)));
      }
    }
  }
});

test('P176 mixed defaults match ad763a2 exactly for absent/empty digital regions and legacy image selection', () => {
  for (const regions of [undefined, []]) {
    for (const pages of [[{ ...digital, regions }], [scan], [{ ...digital, regions }, scan]]) {
      for (const headers of [{}, { digital: h(IdContent), scan: h(IdContent) }]) {
        const props = { ...mixed, pages, headers };
        assert.equal(render(h(api.PaperPreviewMixed, props)), render(h(before.PaperPreviewMixed, props)));
      }
    }
  }
});

const framed = [
  { id: 'a', label: '普通题区域', rect: [6, 10, 88, 20], tag: '3' },
  { id: 'b', label: '当前题区域', rect: [6, 40, 88, 20], tone: 'current', tag: '7 续' },
  { id: 'c', label: '待处理区域', rect: [6, 70, 88, 20], tone: 'pending', tag: '材料 13–14' },
  { id: 'd', label: '没有角标的区域', rect: [6, 92, 88, 5] },
];
test('P176 page-level opt-in keeps aria labels, hides label text and displays exact tags in both viewer branches', () => {
  for (const pageLayout of [undefined, { width: 600, height: 820 }]) {
    const props = { regions: framed, pageLayout, onSelect: noop, selectedId: 'c' };
    const { html, nodes } = frameNodes(props);
    assert.deepEqual(nodes.filter(n => n.props['data-region']).map(n => [n.props['data-region-tone'], n.props['data-region-current']]), [['default', false], ['current', true], ['pending', true], ['default', false]]);
    for (const item of framed) {
      assert.ok(html.includes(`aria-label="定位${item.label}"`));
      assert.ok(!html.includes(`>${item.label}<`));
      if (item.tag) assert.ok(html.includes(`>${item.tag}</span>`));
    }
    assert.equal((html.match(/class="prism-document-region-tag /g) ?? []).length, 3);
    assert.equal((html.match(/aria-pressed="true"/g) ?? []).length, 1);
    assert.equal((html.match(/<button\b/g) ?? []).length, framed.length);
    assert.ok(nodes.filter(n => n.props['aria-label']).every(n => typeof n.props.onClick === 'function'));
  }
  for (const extra of [{ tone: 'default' }, { tag: '' }]) {
    assert.match(render(h(api.DocumentRegionViewer, { regions: [{ ...plain[0], ...extra }], onSelect: noop })), /data-region-tone="default"/);
  }
  assert.match(render(h(api.DocumentRegionViewer, { regions: [framed[2]], onSelect: noop })), /data-region-current="false"/);
});

test('P176 digital overlay and image hit emit the same exact region id without page inference or editing', () => {
  const calls = [];
  const props = { ...mixed, pages: [{ ...digital, regions: framed }, { ...scan, regions: framed }], onSelect: (...args) => calls.push(args), regionEditing: { pageId: 'digital', regionId: null, label: '补框', onCreate: noop, onChange: noop } };
  const out = capture(api.PaperPreviewMixed, props);
  assert.match(out.html, /data-digital-region-layer/);
  assert.doesNotMatch(out.html, /data-paper-region-editor/);
  const layer = out.nodes.find(n => n.props['data-digital-region-layer']);
  assert.equal(layer.props.className, 'prism-document-region-overlay');
  const overlay = out.nodes.find(n => n.type === api.DocumentRegionOverlay);
  const digitalNodes = capture(api.DocumentRegionOverlay, overlay.props).nodes;
  const viewer = out.nodes.find(n => n.type === api.DocumentRegionViewer);
  const imageNodes = frameNodes(viewer.props).nodes;
  for (const nodes of [digitalNodes, imageNodes]) {
    const region = nodes.find(n => n.props['data-region'] === 'c');
    assert.deepEqual(region.props.style, { left: '6%', top: '70%', width: '88%', height: '20%' });
    nodes.find(n => n.props['aria-label'] === '定位待处理区域').props.onClick();
  }
  assert.deepEqual(calls, [['c'], ['c']]);
  const empty = render(h(api.PaperPreviewMixed, { ...mixed, pages: [{ ...digital, regions: [] }] }));
  assert.doesNotMatch(empty, /data-digital-region-layer/);
});

test('P176 multiple segments highlight together across digital/image pages and keep pending styling', () => {
  const pages = [{ ...digital, regions: [framed[0], framed[2]] }, { ...scan, regions: [{ ...framed[0], id: 'a-cont', tag: '3 续' }] }];
  const selectedRegionIds = ['a', 'a-cont', 'c'];
  const props = { ...mixed, pages, selectedRegionIds };
  const html = render(h(api.PaperPreviewMixed, props));
  assert.equal((html.match(/aria-pressed="true"/g) ?? []).length, 3);
  assert.equal((html.match(/data-region-current="true"/g) ?? []).length, 3);
  assert.match(html, /data-region="c" data-region-tone="pending" data-region-current="true"/);
  assert.equal(render(h(api.PaperPreview, { layout: 'mixed', mixed: props })), html);
  const cleared = render(h(api.PaperPreviewMixed, { ...props, selectedRegionIds: [] }));
  assert.doesNotMatch(cleared, /aria-pressed="true"|data-region-current="true"/);
  const omitted = render(h(api.PaperPreviewMixed, { ...props, selectedRegionIds: undefined }));
  assert.equal(omitted, cleared);
  assert.deepEqual(selectedRegionIds, ['a', 'a-cont', 'c']);
});

test('P176 frame paint uses existing tokens, remains scoped and provides current/pending/focus rules', async () => {
  const css = await readFile(new URL('../components/prism-next/review-workspace.css', import.meta.url), 'utf8');
  const rules = postcss.parse(css.slice(css.indexOf('/* P176:')));
  rules.walkRules(rule => assert.ok(rule.selector.startsWith('.prism-document-region'), rule.selector));
  rules.walkDecls(decl => {
    assert.ok(!decl.prop.startsWith('--'), 'no new tokens');
    assert.doesNotMatch(decl.value, /#[\da-f]{3,8}\b|(?:rgb|hsl|oklch)\(/i);
    if (/^(?:color|background|border(?:-color)?|outline|font-family)$/.test(decl.prop)) assert.ok(decl.value === 'transparent' || decl.value.includes('var(--'), decl.toString());
  });
  const declaration = (suffix, prop) => rules.nodes.find(rule => rule.selector === `.prism-document-region${suffix}`)?.nodes.find(decl => decl.prop === prop)?.value;
  assert.equal(declaration(' > .prism-document-region-hit', 'border'), '1px solid color-mix(in srgb, var(--brand-blue) 55%, transparent)');
  assert.equal(declaration('[data-region-current="true"] > .prism-document-region-hit', 'border-width'), '2px');
  assert.equal(declaration('[data-region-tone="pending"] > .prism-document-region-hit', 'border-style'), 'dashed');
  assert.equal(declaration('[data-region-tone="pending"] > .prism-document-region-hit', 'border-color'), 'var(--brand-magenta-text)');
  assert.equal(declaration(' > .prism-document-region-hit:focus-visible', 'outline'), '2px solid var(--ring)');
  assert.equal(declaration(' > .prism-document-region-tag', 'font-family'), 'var(--font-mono)');
});
