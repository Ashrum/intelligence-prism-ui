import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { probe, ssr, filterFixture, textOf } from './filter-area-harness.mjs';
import { fittingOptions } from '../components/prism-next/explorations/resource-filter-types.ts';

const click = (p, text) => { const node = p.find(node => node.type.name === 'Button' && textOf(node) === text); assert.ok(node, text); node.props.onClick(); p.render(); };
const choose = (p, label, values) => { const node = p.find(node => node.type.name === 'ToggleGroup' && node.props['aria-label'] === label); assert.ok(node, label); node.props.onValueChange(values); p.render(); };
const check = (p, label, value) => { const node = p.find(node => node.type.name === 'Checkbox' && node.props['aria-label'] === label); assert.ok(node, label); assert.ok(!node.props.disabled); node.props.onCheckedChange(value); p.render(); };
const multi = (p, variant) => { if (variant === 'B') p.openDimension('type'); else { p.find(node => node.props['aria-label'] === '题型多选' && node.type.name === 'Button').props.onClick(); p.render(); } };

test('shared fixture has exact scale dimensions, host modes, explanation, long labels, absent and zero counts', () => {
  const current = filterFixture('current'), future = filterFixture('future');
  assert.deepEqual(current.map(d => d.options.length), [4, 3, 2]);
  assert.deepEqual(Object.fromEntries(future.map(d => [d.id, d.options.length])), { type: 12, difficulty: 3, scenario: 8, source: 10, year: 6, region: 8 });
  assert.ok(future.find(d => d.id === 'difficulty').description.includes('综合推理'));
  assert.ok(future.flatMap(d => d.options).some(o => o.label.length >= 16));
  assert.ok(current.flatMap(d => d.options).some(o => o.count === undefined));
  assert.ok(current.flatMap(d => d.options).some(o => o.count === 0));
  assert.ok(filterFixture('future', false).every(d => d.options.every(o => o.count === undefined)));
});

test('facet fit uses actual option widths, reserves unlimited, and expands capacity with container width', () => {
  assert.equal(fittingOptions(240, [60, 82, 82, 82]), 2);
  assert.equal(fittingOptions(400, [60, 82, 82, 82]), 3);
  assert.equal(fittingOptions(240, [60, 170, 82]), 1);
  assert.equal(fittingOptions(40, [60, 400]), 1);
});

for (const variant of ['A', 'B', 'C']) for (const scale of ['current', 'future']) for (const width of [520, 720, 960]) test(`${variant}/${scale}/${width}: SSR controlled facts and result controls`, () => {
  const html = ssr(variant, scale, width);
  assert.match(html, new RegExp(`data-filter-variant="${variant}"`));
  assert.match(html, /我的收藏（23）/); assert.match(html, /128 题/);
  assert.match(html, /在结果中搜索/); assert.match(html, /综合/); assert.match(html, /最新/); assert.match(html, /热门/);
  assert.match(html, /重置/); assert.doesNotMatch(html, /示例|演示/);
  if (variant !== 'B') { assert.match(html, /<fieldset/); assert.match(html, /<legend[^>]*>题型/); assert.match(html, /基础：直接运用概念/); }
});

test('actual A/B/C handlers emit the same sequence and host states for single, multi confirm/cancel, sort, favorites, search and reset', () => {
  const results = [];
  for (const variant of ['A', 'B', 'C']) {
    const p = probe(variant); p.render();
    if (variant === 'B') p.openDimension('difficulty');
    choose(p, '难度', ['difficulty-1']);
    assert.deepEqual(p.state.value.filters.difficulty, ['difficulty-1']);
    multi(p, variant); check(p, '题型：单选题', true); check(p, '题型：多选题', true);
    const before = structuredClone(p.state.value), count = p.state.intents.length;
    click(p, '取消'); assert.deepEqual(p.state.value, before); assert.equal(p.state.intents.length, count);
    multi(p, variant); check(p, '题型：多选题', true); check(p, '题型：单选题', true);
    click(p, '确认'); assert.deepEqual(p.state.value.filters.type, ['type-0', 'type-1']);
    p.find(node => node.type.name === 'ToggleGroup' && node.props['aria-labelledby']).props.onValueChange(['latest']); p.render();
    p.find(node => node.type.name === 'Toggle' && textOf(node).includes('我的收藏')).props.onPressedChange(true); p.render();
    p.find(node => node.type.name === 'Input').props.onChange({ target: { value: '二次函数 x²' } }); p.render();
    assert.equal(p.state.value.sort, 'latest'); assert.equal(p.state.value.favoritesOnly, true); assert.equal(p.state.value.search, '二次函数 x²');
    const selected = structuredClone(p.state.value);
    // Reset during an unconfirmed multi edit must also discard local drafts.
    multi(p, variant); check(p, '题型：填空题', true);
    click(p, '重置');
    assert.deepEqual(p.state.value, { filters: {}, sort: 'relevance', favoritesOnly: false, search: '' });
    multi(p, variant);
    assert.equal(p.find(node => node.type.name === 'Checkbox' && node.props['aria-label'] === '题型：单选题').props.checked, false);
    click(p, '取消');
    results.push({ selected, intents: p.state.intents, value: p.state.value });
  }
  assert.deepEqual(results[0], results[1]); assert.deepEqual(results[1], results[2]);
  assert.equal(results[0].intents.length, 6, 'one event per applied operation; drafts and cancellation are silent');
});

for (const variant of ['A', 'B', 'C']) test(`${variant}: zero is disabled for new selection, retained zero can be removed; no count is not zero`, () => {
  const p = probe(variant); p.render(); multi(p, variant);
  const zero = () => p.find(node => node.type.name === 'Checkbox' && node.props['aria-label'] === '题型：判断题');
  assert.equal(zero().props.disabled, true); assert.match(p.state.html, /判断题（0）/);
  assert.equal(p.find(node => node.type.name === 'Checkbox' && node.props['aria-label'] === '题型：多选题').props.disabled, false);
  click(p, '取消'); p.state.value.filters = { type: ['type-2'] }; p.render(); multi(p, variant);
  assert.equal(zero().props.disabled, false); check(p, '题型：判断题', false); click(p, '确认');
  assert.deepEqual(p.state.value.filters.type, []);
});

test('B option search preserves hidden selections; dismissing a popup discards draft and reopening uses host values', () => {
  const p = probe('B'); p.render(); p.openDimension('type');
  check(p, '题型：单选题', true);
  const editor = () => p.state.nodes.find(({ node }) => node.type.name === 'DimensionEditor');
  p.find((node, path) => path.startsWith(editor().path + '/') && node.type.name === 'Input').props.onChange({ target: { value: '填空' } }); p.render();
  check(p, '题型：填空题', true); click(p, '确认');
  assert.deepEqual(p.state.value.filters.type, ['type-0', 'type-3']);
  p.openDimension('type'); check(p, '题型：多选题', true);
  const parent = p.state.nodes.find(({ node }) => node.type.name === 'DimensionPopover' && node.props.dimension.id === 'type');
  p.find((node, path) => path.startsWith(parent.path + '/') && typeof node.props.onOpenChange === 'function').props.onOpenChange(false); p.render();
  p.openDimension('type');
  assert.equal(p.find(node => node.type.name === 'Checkbox' && node.props['aria-label'] === '题型：多选题').props.checked, false);
  assert.equal(p.state.intents.length, 1);
});

test('B overflow and C all-filter panels expose every remaining dimension and share controlled state', () => {
  for (const variant of ['B', 'C']) {
    const p = probe(variant, 'future', 520); p.render(); p.openPanel();
    assert.match(p.state.html, /跨区域联合教研与课题研究资源库/);
    assert.match(p.state.html, /年份/); assert.match(p.state.html, /地区/);
    choose(p, '年份', ['year-1']); assert.deepEqual(p.state.value.filters.year, ['year-1']);
    assert.match(p.state.html, variant === 'B' ? /已启用 1/ : /其余已启用 1/);
    if (variant === 'B') assert.match(p.state.html, /搜索地区选项/);
    else { choose(p, '难度', ['difficulty-2']); assert.deepEqual(p.state.value.filters.difficulty, ['difficulty-2']); }
  }
});

test('A collapse is a summary only; reset restores facts, and selected state is also textual/iconic', () => {
  const p = probe('A'); p.render(); choose(p, '题型', ['type-0']);
  assert.match(p.state.html, /aria-pressed="true"/); assert.match(p.state.html, /lucide-check/);
  click(p, '筛选 · 1 个维度已启用'); assert.match(p.state.html, /hidden=""/);
  assert.deepEqual(p.state.value.filters.type, ['type-0']);
  click(p, '重置'); assert.match(p.state.html, /筛选 · 0 个维度已启用/);
});

test('A/C selected tail options remain in the original row when unselected options are folded', () => {
  for (const variant of ['A', 'C']) {
    const p = probe(variant, 'future', 520);
    p.state.value.filters.type = ['type-10', 'type-11']; p.render();
    for (const value of ['type-10', 'type-11']) {
      assert.ok(p.find(node => node.type.name === 'ToggleGroupItem' && node.props.value === value));
    }
    assert.ok(!p.find(node => node.type.name === 'ToggleGroupItem' && node.props.value === 'type-8'));
  }
});

test('unknown result facts remain unknown, optional slot renders, reduced sorts and three theme shells SSR', () => {
  for (const theme of ['light', 'paper', 'dark']) {
    const html = ssr('A', 'current', 520, { theme, resultCount: undefined, favoriteCount: undefined, sortItems: [{ id: 'relevance', label: '综合' }], endSlot: '宿主预留操作' });
    assert.match(html, /题数未提供/); assert.match(html, /数量未知/); assert.match(html, /宿主预留操作/);
    assert.doesNotMatch(html, />热门</); assert.match(html, new RegExp(`data-prism-theme="${theme}"`));
  }
});

test('exploration has catalog and directory links without a new registry entry', async () => {
  const [catalog, directory, page, registry] = await Promise.all([
    readFile(new URL('../components/prism-next/catalog-overview.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/(next)/next/explorations/tree-directory/page.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/(next)/next/explorations/filter-area/page.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../lib/prism-next/catalog.ts', import.meta.url), 'utf8'),
  ]);
  assert.match(catalog, /\/next\/explorations\/filter-area/); assert.match(directory, /\/next\/explorations\/filter-area/);
  assert.match(page, /\/next\/explorations\/tree-directory/); assert.doesNotMatch(registry, /ResourceFilterArea|id: "filter-area"/);
});
