import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { api, h, render } from './review-components-harness.mjs';

// Raw SSR captured before P15 from main 17c5557f8290aa2f96c104b21fb931282a23df21.
// Compare the complete strings: no markup normalization or regenerated baseline.
const before = JSON.parse(await readFile(new URL('./fixtures/paper-preview-region-editing-before.json', import.meta.url), 'utf8'));
const noop = () => {};
const pages = [
  { id: 'full', dimensions: { width: 600, height: 820 }, imageUrl: '/scan.svg', alt: '完整扫描', regions: [{ id: 'answer', label: '作答区域', rect: [10, 20, 80, 25] }] },
  { id: 'crop', dimensions: { width: 600, height: 260 }, regions: [{ id: 'other', label: '裁切作答', rect: [0, 0, 100, 100] }] },
];
const baseMixed = {
  pages: [{ id: 'digital', width: 600, height: 1, content: h('article', {}, '数字题面') }, ...pages.map(page => ({ ...page, ...page.dimensions }))],
  viewportRef: { current: null }, zoom: 'width', rotations: {}, selected: 'answer', scale: 1, topInset: 0,
  headers: { full: h('header', {}, '完整扫描标题') }, activePage: 'full', answerLabel: '学生作答',
  onSelect: noop, onZoom: noop, onVisiblePage: noop, onViewport: noop,
};
const cases = {
  empty: { pages: [] },
  default: { pages },
  continuous: { pages, layout: 'continuous', zoom: 'width', selectedRegionId: 'answer', onRegionSelect: noop, continuous: { spotlight: true, gap: 24, toolbarWidth: 44, beforeContent: h('article', {}, '完整题面'), renderPageHeader: page => h('header', {}, page.id), emptyImageText: '未提供该页扫描' } },
  original: { pages, zoom: 'page', continuous: { spotlight: true, original: true } },
  mixed: { layout: 'mixed', mixed: baseMixed },
};
for (const rotation of [0, 90, 180, 270]) {
  cases[`continuous-rotation-${rotation}`] = { pages, zoom: 175, rotation: { full: rotation, crop: rotation }, continuous: { scale: .5 }, selectedRegionId: 'answer' };
  cases[`mixed-rotation-${rotation}`] = { layout: 'mixed', mixed: { ...baseMixed, zoom: 175, scale: .5, rotations: { full: rotation, crop: rotation } } };
}
assert.deepEqual(Object.keys(cases), Object.keys(before), 'every captured baseline must remain covered');

for (const [name, props] of Object.entries(cases)) {
  test(`region editing disabled preserves main raw SSR: ${name}`, () => {
    const isMixed = props.layout === 'mixed';
    const explicit = isMixed ? { ...props, mixed: { ...props.mixed, regionEditing: undefined } } : { ...props, regionEditing: undefined };
    assert.equal(render(h(api.PaperPreview, props)), before[name], 'PaperPreview with regionEditing omitted');
    assert.equal(render(h(api.PaperPreview, explicit)), before[name], 'PaperPreview with explicit undefined');

    const Component = isMixed ? api.PaperPreviewMixed : api.PaperPreviewContinuous;
    const direct = isMixed ? props.mixed : {
      ...props.continuous,
      viewportRef: { current: null }, pages: props.pages, zoom: props.zoom ?? 'page',
      rotations: props.rotation ?? {}, selected: props.selectedRegionId,
      onZoom: noop, onSelect: props.onRegionSelect ? noop : undefined,
    };
    assert.equal(render(h(Component, direct)), before[name], 'direct engine with regionEditing omitted');
    assert.equal(render(h(Component, { ...direct, regionEditing: undefined })), before[name], 'direct engine with explicit undefined');
  });
}
