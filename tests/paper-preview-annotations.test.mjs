import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { api, h, render } from './review-components-harness.mjs';

// Captured on P45 before implementation, never regenerated from P46 output.
const hashes = JSON.parse(await readFile(new URL('./fixtures/paper-preview-annotations-before.json', import.meta.url)));
const pages = [{ id: 'scan', imageUrl: '/original.png', dimensions: { width: 800, height: 1131 }, regions: [{ id: 'q', label: '原题', rect: [10, 20, 60, 20] }] }];
const props = { pages, zoom: 100 };
const mixed = { pages: pages.map(p => ({ ...p, width: 800, height: 1131 })), zoom: 100, rotations: {}, viewportRef: { current: null }, headers: {}, activePage: 'scan', scale: 1, selected: 'q', topInset: 0, onSelect() {}, onZoom() {}, onVisiblePage() {}, onViewport() {} };
const cases = { empty: { pages: [] }, default: { pages }, continuous: props, mixed: { layout: 'mixed', mixed }, editing: { ...props, regionEditing: { pageId: 'scan', regionId: 'q', label: '原题', onChange() {} } } };
for (const r of [90, 180, 270]) cases['rotation-' + r] = { ...props, rotation: { scan: r } };
const annotation = { id: 'q1', page: 1, rect: { x: .1, y: .2, width: .6, height: .2 }, mark: 'wrong', score: { earned: 2, full: 5 }, note: '移项时符号错误。' };
const annotations = [annotation];
const pageSize = { width: 210, height: 297 };
const layer = extra => render(h(api.PaperAnnotationLayer, { annotations, page: 1, pageSize, ...extra }));
const visual = html => html.match(/<svg data-paper-annotation-layer[\s\S]*?<\/svg>/)?.[0];
const hash = html => createHash('sha256').update(html).digest('hex');
for (const [name, base] of Object.entries(cases)) {
  test(`P46 omitted / empty / hidden annotations preserve P45 SHA-256: ${name}`, () => {
    assert.equal(hash(render(h(api.PaperPreview, base))), hashes[name]);
    for (const options of [{ annotations: undefined }, { annotations: [] }, { annotations, annotationsVisible: false, paperTotal: { earned: 86, full: 100, page: 1 } }]) {
      const configured = base.layout === 'mixed' ? { ...base, mixed: { ...base.mixed, ...options } } : { ...base, ...options };
      assert.equal(hash(render(h(api.PaperPreview, configured))), hashes[name]);
    }
  });
}

test('all four clean stroke marks, no invented outcome or sum, supplied score formatting', () => {
  const facts = ['correct', 'partial', 'wrong', 'blank'].map((mark, i) => ({ ...annotation, id: String(i), mark, score: { earned: mark === 'correct' ? 5 : 4, full: 5 } }));
  const html = layer({ annotations: facts });
  for (const mark of ['correct', 'partial', 'wrong', 'blank']) assert.match(html, new RegExp(`data-annotation-mark="${mark}"`));
  assert.match(html, /d="M14 9 L21 16"/);
  assert.match(html, /<circle cx="13" cy="13" r="10"/);
  assert.match(html, />5<\/text>/);
  assert.equal((html.match(/>4 \/ 5<\/text>/g) ?? []).length, 3);
  assert.doesNotMatch(html, /data-paper-total/);
  const unknown = layer({ annotations: [{ ...annotation, mark: undefined, score: undefined }] });
  assert.doesNotMatch(unknown, /data-annotation-mark=/);
  assert.match(unknown, /判定未提供；得分未提供/);
  assert.match(layer({ annotations: [{ ...annotation, mark: 'wrong', score: { earned: 5, full: 5 } }] }), />5 \/ 5<\/text>/);
});

test('zero and fractional supplied scores are literal; mark alone does not create a score', () => {
  assert.match(layer({ annotations: [{ ...annotation, score: { earned: 0, full: 5 } }] }), />0 \/ 5<\/text>/);
  assert.match(layer({ annotations: [{ ...annotation, score: { earned: 2.5, full: 5 } }] }), />2.5 \/ 5<\/text>/);
  assert.doesNotMatch(visual(layer({ annotations: [{ ...annotation, score: undefined }] })), /tabular-nums/);
});

test('three-line truncation retains full note for focus/hover and sr-only access outside aria-hidden', () => {
  const note = '需要补充完整参数范围与等价变形依据。'.repeat(12) + 'x² + y² = 1';
  const html = layer({ annotations: [{ ...annotation, note }] });
  const svg = visual(html);
  assert.equal((svg.match(/<tspan /g) ?? []).length, 3);
  assert.match(svg, /…<\/tspan>/);
  assert.match(svg, /aria-hidden="true" focusable="false"/);
  assert.ok(html.includes(`错因：${note}`));
  assert.match(html, /<ul class="sr-only print:hidden" aria-label="第 1 页批阅结果"/);
  assert.match(html, /<button[^>]+data-annotation-note-trigger="q1"/);
  assert.ok(html.indexOf('data-annotation-note-trigger') > html.indexOf('</svg>'));
  assert.doesNotMatch(layer({ annotations: [{ ...annotation, note: undefined }] }), /data-annotation-note[= -]/);
});

test('explicit newlines and long Latin text use the same bounded note layout; edge note remains on page', () => {
  const svg = visual(layer({ annotations: [{ ...annotation, rect: { x: .8, y: .9, width: .2, height: .1 }, note: '第一行\n第二行\n第三行\n第四行' }] }));
  assert.match(svg, />第一行<\/tspan>/);
  assert.match(svg, />第三行…<\/tspan>/);
  const ys = [...svg.matchAll(/<tspan x="[^"]+" y="([^"]+)"/g)].map(m => Number(m[1]));
  assert.ok(ys.every(y => y <= 800 * 297 / 210));
  const latin = visual(layer({ annotations: [{ ...annotation, note: 'W'.repeat(500) }] }));
  assert.equal((latin.match(/<tspan/g) ?? []).length, 3);
});

test('host total only on designated page, defaults right, optional left and underlined', () => {
  for (const [anchor, x, alignment] of [[undefined, 776, 'end'], ['top-left', 24, 'start']]) {
    const svg = visual(layer({ annotations: [], paperTotal: { earned: 86, full: 100, page: 1, anchor } }));
    assert.ok(svg.includes(`translate(${x} 40)`));
    assert.ok(svg.includes(`text-anchor="${alignment}" text-decoration="underline"`));
    assert.match(svg, />86 \/ 100<\/text>/);
  }
  assert.equal(layer({ annotations: [], paperTotal: { earned: 86, full: 100, page: 2 } }), '');
});

test('screen and standalone layer share identical SVG in every viewing rotation and zoom', () => {
  const size = { width: 800 * 25.4 / 96, height: 1131 * 25.4 / 96 };
  const expected = visual(layer({ pageSize: size }));
  for (const rotation of [0, 90, 180, 270]) for (const zoom of [50, 100, 175]) {
    const html = render(h(api.PaperPreview, { ...props, annotations, zoom, rotation: { scan: rotation } }));
    assert.equal(visual(html), expected);
    assert.ok(html.includes(`width:${800 * zoom / 100}px;height:${1131 * zoom / 100}px`));
    if (rotation) assert.ok(html.includes(`rotate(${rotation}deg)`));
    assert.ok(html.indexOf('data-paper-annotation-layer') > html.indexOf('src="/original.png"'));
  }
});

test('mixed uses full one-based page slots, skips digital content and filters each scan', () => {
  const mp = [{ id: 'digital', width: 800, height: 1131, content: h('p', {}, '数字题面') }, ...mixed.pages, { ...mixed.pages[0], id: 'second' }];
  const html = render(h(api.PaperPreview, { layout: 'mixed', mixed: { ...mixed, pages: mp, annotations: [{ ...annotation, id: 'digital', page: 1 }, { ...annotation, id: 'scan-only', page: 2 }] } }));
  assert.doesNotMatch(html, /data-annotation-id="digital"/);
  assert.equal((html.match(/data-annotation-id="scan-only"/g) ?? []).length, 1);
  assert.equal((html.match(/data-paper-annotation-layer/g) ?? []).length, 1);
});

test('physical A4/A3 portrait/landscape sizes and positive/negative mm offsets preserve ratio', () => {
  for (const [width, height] of [[210, 297], [297, 210], [297, 420], [420, 297]]) {
    const html = layer({ pageSize: { width, height }, offset: { x: 2, y: -3 } });
    assert.ok(html.includes(`width:${width}mm;height:${height}mm`));
    assert.ok(html.includes(`viewBox="0 0 800 ${800 * height / width}"`));
    assert.ok(html.includes(`translate(${2 * 800 / width} ${-3 * 800 / width})`));
    assert.ok(html.includes(`left:${(.1 * 800 + 2 * 800 / width) / 800 * 100}%`));
  }
});

test('layer-only output is transparent and monochrome, contains no source image / paper fill', () => {
  const html = layer();
  assert.match(html, /data-prism-theme="light"/);
  assert.match(html, /color:var\(--destructive-foreground\)/);
  assert.doesNotMatch(html, /<img|<image|<rect|background:|bg-white|bg-card/);
  assert.doesNotMatch(visual(html), /fill="(?!none|currentColor)[^"]+"|stroke="(?!currentColor)[^"]+"/);
});

test('calibration has 5 crosses, mm tick counts, shared offsets and no background', () => {
  for (const [width, height] of [[210, 297], [297, 420], [420, 297]]) {
    const html = render(h(api.PaperAnnotationCalibration, { pageSize: { width, height }, offset: { x: -1, y: 2 } }));
    assert.equal((html.match(/data-calibration-cross=/g) ?? []).length, 5);
    assert.equal((html.match(/data-calibration-tick-x=/g) ?? []).length, Math.floor((width - 10) / 10));
    assert.equal((html.match(/data-calibration-tick-y=/g) ?? []).length, Math.floor((height - 10) / 10));
    assert.match(html, /d="M7 10h6 M10 7v6"/);
    assert.ok(html.includes(`translate(${-800 / width} ${1600 / width})`));
    assert.doesNotMatch(html, /<img|<image|<rect|background:/);
  }
});

test('invalid geometry/page or empty hidden facts never produce fabricated annotations', () => {
  for (const rect of [{ x: -.1, y: 0, width: .2, height: .2 }, { x: .9, y: 0, width: .2, height: .2 }, { x: 0, y: 0, width: NaN, height: .2 }, { x: 0, y: 0, width: 0, height: .2 }]) assert.equal(layer({ annotations: [{ ...annotation, rect }] }), '');
  for (const page of [0, NaN, 1.5, 2]) assert.equal(layer({ page }), '');
  assert.equal(layer({ pageSize: { width: 0, height: 297 } }), '');
  assert.equal(layer({ annotationsVisible: false }), '');
  assert.equal(layer({ annotations: [] }), '');
  assert.match(layer({ annotations: [{ ...annotation, score: { earned: NaN, full: 5 } }] }), /得分未提供/);
});
