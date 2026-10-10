import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { probe, ssr, filterFixture, textOf, demoSSR, previewFilterValue } from './facet-filter-harness.mjs';
import { fittingOptions } from '../components/prism-next/facet-filter-types.ts';

const click = (p, text) => { const node = p.find(node => node.type.name === 'Button' && textOf(node) === text); assert.ok(node, text); node.props.onClick(); p.render(); };
const choose = (p, label, values) => { const node = p.find(node => node.type.name === 'ToggleGroup' && node.props['aria-label'] === label); assert.ok(node, label); const allValue = p.find(item => item.type.name === 'ToggleGroupItem' && item.props['aria-label'] === `${label}：全部`).props.value;
  node.props.onValueChange(values.map(value => value ? `option-${value}` : allValue)); p.render(); };
const check = (p, label, value) => {
  const node = p.find(node => node.type.name === 'ToggleGroupItem' && node.props['aria-label']?.startsWith(label));
  assert.ok(node, label); assert.ok(!node.props.disabled);
  const group = p.find(node => node.type.name === 'ToggleGroup' && node.props['aria-label'] === label.split('：')[0]);
  group.props.onValueChange(value ? [...group.props.value.filter(Boolean).filter(id => id !== node.props.value), node.props.value] : group.props.value.filter(id => id !== node.props.value)); p.render();
};
const multi = p => { p.find(node => node.props['aria-label'] === '题型多选' && node.type.name === 'Button').props.onClick(); p.render(); };

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

for (const variant of ['C']) for (const scale of ['current', 'future']) for (const width of [520, 720, 960]) test(`${variant}/${scale}/${width}: SSR controlled facts and result controls`, () => {
  const html = ssr(variant, scale, width);
  assert.match(html, /data-facet-filter/);
  assert.match(html, /我的收藏<span[^>]*>23<\/span>/); assert.match(html, /128 题/);
  assert.match(html, /在结果中搜索/); assert.match(html, /综合/); assert.match(html, /最新/); assert.match(html, /热门/);
  assert.match(html, /重置/); assert.doesNotMatch(html, /示例|演示/);
  assert.match(html, /<fieldset/); assert.match(html, /<legend[^>]*>题型/); assert.match(html, /基础：直接运用概念/);
});

test('C handlers emit expected intents and host states for single, multi confirm/cancel, sort, favorites, search and reset', () => {
  const results = [];
  for (const variant of ['C']) {
    const p = probe(variant); p.render();
    choose(p, '难度', ['difficulty-1']);
    assert.deepEqual(p.state.value.filters.difficulty, ['difficulty-1']);
    multi(p, variant); check(p, '题型：单选题', true); check(p, '题型：多选题', true);
    const before = structuredClone(p.state.value), count = p.state.intents.length;
    click(p, '取消'); assert.deepEqual(p.state.value, before); assert.equal(p.state.intents.length, count);
    multi(p, variant); check(p, '题型：多选题', true); check(p, '题型：单选题', true);
    click(p, '确定'); assert.deepEqual(p.state.value.filters.type, ['type-0', 'type-1']);
    p.find(node => node.type.name === 'Tabs').props.onValueChange('latest'); p.render();
    p.find(node => node.type.name === 'Toggle' && textOf(node).includes('我的收藏')).props.onPressedChange(true); p.render();
    p.find(node => node.type.name === 'InputGroupInput').props.onChange({ target: { value: '二次函数 x²' } }); p.render();
    assert.equal(p.state.value.sort, 'latest'); assert.equal(p.state.value.favoritesOnly, true); assert.equal(p.state.value.search, '二次函数 x²');
    const selected = structuredClone(p.state.value);
    // Reset during an unconfirmed multi edit must also discard local drafts.
    multi(p, variant); check(p, '题型：填空题', true);
    click(p, '重置');
    assert.deepEqual(p.state.value, { filters: {}, sort: 'relevance', favoritesOnly: false, search: '' });
    multi(p, variant);
    assert.ok(!p.find(node => node.type.name === 'ToggleGroup' && node.props['aria-label'] === '题型').props.value.includes('option-type-0'));
    click(p, '取消');
    results.push({ selected, intents: p.state.intents, value: p.state.value });
  }
  assert.equal(results[0].intents.length, 6, 'one event per applied operation; drafts and cancellation are silent');
  assert.deepEqual(results[0].intents, [
    { type: 'filter', dimensionId: 'difficulty', values: ['difficulty-1'] },
    { type: 'filter', dimensionId: 'type', values: ['type-0', 'type-1'] },
    { type: 'sort', value: 'latest' },
    { type: 'favorites', value: true },
    { type: 'search', value: '二次函数 x²' },
    { type: 'reset' },
  ], 'single selection and confirmed multi draft emit exact ordered payloads; cancellation stays silent');
});

for (const variant of ['C']) test(`${variant}: zero is disabled for new selection, retained zero can be removed; no count is not zero`, () => {
  const p = probe(variant); p.render(); multi(p, variant);
  const zero = () => p.find(node => node.type.name === 'ToggleGroupItem' && node.props.value === 'option-type-2');
  assert.equal(zero().props.disabled, true); assert.match(p.state.html, /判断题<\/span><span[^>]*>0<\/span>/);
  assert.equal(p.find(node => node.type.name === 'ToggleGroupItem' && node.props.value === 'option-type-1').props.disabled, false);
  click(p, '取消'); p.state.value.filters = { type: ['type-2'] }; p.render(); multi(p, variant);
  assert.equal(zero().props.disabled, false); check(p, '题型：判断题', false); click(p, '确定');
  assert.deepEqual(p.state.value.filters.type, []);
});

test('C all-filter panels expose every remaining dimension and share controlled state', () => {
  for (const variant of ['C']) {
    const p = probe(variant, 'future', 520); p.render(); p.openPanel();
    assert.match(p.state.html, /跨区域联合教研与课题研究资源库/);
    assert.match(p.state.html, /年份/); assert.match(p.state.html, /地区/);
    choose(p, '年份', ['year-1']); assert.deepEqual(p.state.value.filters.year, ['year-1']);
    assert.equal(p.find(node => node.type.name === 'FilterPanel').props.count, 1);
    choose(p, '难度', ['difficulty-2']); assert.deepEqual(p.state.value.filters.difficulty, ['difficulty-2']);
  }
});

test('C collapse keeps dimension/value summary; reset clears facts without losing collapsed state', () => {
  const p = probe('C'); p.render(); choose(p, '题型', ['type-0']);
  assert.match(p.state.html, /aria-pressed="true"/); assert.doesNotMatch(p.state.html, /lucide-check/);
  click(p, '收起'); assert.match(p.state.html, /题型 单选题/); assert.match(p.state.html, /hidden=""/);
  assert.deepEqual(p.state.value.filters.type, ['type-0']);
  click(p, '重置'); assert.match(p.state.html, /未筛选/); click(p, '展开'); assert.equal(p.find(node => node.type === "div" && node.props.id?.endsWith("-facets")).props.hidden, false);
});

test('C selected tail options remain in the original row when unselected options are folded', () => {
  for (const variant of ['C']) {
    const p = probe(variant, 'future', 520);
    p.state.value.filters.type = ['type-10', 'type-11']; p.render();
    for (const value of ['type-10', 'type-11']) {
      assert.ok(p.find(node => node.type.name === 'ToggleGroupItem' && node.props.value === `option-${value}`));
    }
    assert.ok(!p.find(node => node.type.name === 'ToggleGroupItem' && node.props.value === 'option-type-8'));
  }
});

test('unknown result facts remain unknown, optional slot renders, reduced sorts and three theme shells SSR', () => {
  for (const theme of ['light', 'paper', 'dark']) {
    const html = ssr('C', 'current', 520, { theme, resultCount: undefined, favoriteCount: undefined, sortItems: [{ id: 'relevance', label: '综合' }], endSlot: '宿主预留操作' });
    assert.match(html, /题数未提供/); assert.match(html, /数量未知/); assert.match(html, /宿主预留操作/);
    assert.doesNotMatch(html, />热门</); assert.match(html, new RegExp(`data-prism-theme="${theme}"`));
  }
});

test('FacetFilter has one formal catalog entry, spec and links; retired sources/routes are absent', async () => {
  const { components } = await import('../lib/prism-next/catalog.ts');
  const { coreAgentSpecs } = await import('../lib/prism-next/agent-specs.ts');
  assert.equal(components.length, 103);
  assert.equal(components.filter(item => item.id === 'facet-filter').length, 1);
  assert.ok(coreAgentSpecs['facet-filter']);
  const catalog = await readFile(new URL('../components/prism-next/catalog-overview.tsx', import.meta.url), 'utf8');
  assert.match(catalog, /\/next\/components\/facet-filter/); assert.match(catalog, /\/next\/components\/tree/);
  for (const path of ['components/prism-next/explorations/filter-area.tsx', 'app/(next)/next/explorations/filter-area/page.tsx', 'app/(next)/next/explorations/tree-directory/page.tsx']) await assert.rejects(readFile(new URL('../' + path, import.meta.url)), { code: 'ENOENT' });
});

test('review defaults show future scale, 720px, counts and preselected values with only the C section', () => {
  const html = demoSSR();
  assert.equal((html.match(/data-demo-width="720"/g) ?? []).length, 1);
  assert.match(html, /题型：单选题/);
  assert.match(html, /难度：巩固/);
  for (const variant of ['C']) {
    assert.match(html, new RegExp(`id="filter-${variant}"`));
    assert.doesNotMatch(html, /href="#filter-[AB]"/);
  }
  assert.deepEqual(previewFilterValue('future').filters, { type: ['type-0', 'type-3'], difficulty: ['difficulty-1'], scenario: ['scenario-1'] });
  assert.ok(!previewFilterValue('current').filters.scenario);
});

test('standard panel/toggle/tabs/input-group variants and semantic counts replace checkmarks and parentheses', () => {
  for (const variant of ['C']) {
    const p = probe(variant); p.state.value = previewFilterValue('future'); p.render();
    assert.ok(p.find(node => node.type.name === 'FramePanel'));
    assert.equal(p.find(node => node.type.name === 'TabsList').props.variant, 'underline');
    assert.equal(p.find(node => node.type.name === 'TabsList').props.size, 'sm');
    const search = p.find(node => node.type.name === 'InputGroupInput');
    assert.equal(search.props['aria-label'], '在结果中搜索'); assert.equal(search.props.placeholder, '在结果中搜索');
    assert.match(p.state.html, /共 128 题/); assert.match(p.state.html, /lucide-star/);
    assert.doesNotMatch(p.state.html, /lucide-check|不限|维度已启用|我的收藏（|>排序</);
    {
      assert.ok(p.find(node => node.type.name === 'ToggleGroupItem' && node.props.value === 'option-type-3'));
      assert.match(p.state.html, /sr-only[^>]*>基础：直接运用概念/);
      assert.match(p.state.html, /aria-label="难度说明"/);
      for (const tone of ['success', 'info', 'warning']) assert.match(p.state.html, new RegExp(`text-${tone}`));
      assert.match(p.state.html, /text-ui-hint text-muted-foreground tabular-nums/);
    }
    {
      const panel = p.state.nodes.find(({ node }) => node.type.name === 'FilterPanel');
      assert.ok(panel.path.includes('FacetRow'));
      assert.equal(panel.node.props.count, 1);
    }
  }
});

test('all clears multi draft without applying until confirm', () => {
  const results = [];
  for (const variant of ['C']) {
    const p = probe(variant); p.state.value = previewFilterValue('future'); p.render(); multi(p, variant);
    choose(p, '题型', ['type-0', 'type-3', '']);
    assert.equal(p.state.intents.length, 0);
    click(p, '确定'); assert.deepEqual(p.state.value.filters.type, []);
    results.push(p.state.intents);
  }

});

test('P37 all result sort tabs are relevance/latest/popular, with no difficulty sort', () => {
  for (const variant of ['C']) {
    const p = probe(variant); p.render();
    const tabs = p.state.nodes.filter(({ node }) => node.type.name === 'TabsTab').map(({ node }) => node.props.value);
    assert.deepEqual(tabs, ['relevance', 'latest', 'popular']);
  }
  const html = demoSSR();
  assert.match(html, />综合</); assert.match(html, />最新</); assert.match(html, />热门</);
  assert.doesNotMatch(html, /综合 \/ 最新 \/ 热门 \/ 难度/);
});


test('P40 all uses the standard pressed background and only C remains', async () => {
  const p = probe('C'); p.render();
  const all = p.find(node => node.type.name === 'ToggleGroupItem' && node.props['aria-label'] === '题型：全部');
  assert.ok(all.props.value);
  const button = p.state.html.match(/<button[^>]*aria-label="题型：全部"[^>]*>/)?.[0];
  assert.ok(button); assert.match(button, /aria-pressed="true"/); assert.match(button, /data-pressed=""/);
  assert.match(button, /data-pressed:bg-input\/64/);
  choose(p, '题型', ['type-0']); choose(p, '题型', ['type-0', '']);
  assert.deepEqual(p.state.value.filters.type, []);
  const html = demoSSR(); assert.doesNotMatch(html, /filter-A|filter-B|三版|跳到/);
  const page = await readFile(new URL('../components/prism-next/demos/facet-filter.tsx', import.meta.url), 'utf8');
  assert.match(page, /FacetFilterDemo/);
});

test('P44 no common dimensions exposes all filters only for nonempty input, retaining reset', () => {
  for (const empty of [false, true]) {
    const p = probe('C'); p.state.dimensions = empty ? [] : p.state.dimensions.map(d => ({ ...d, common: false })); p.render();
    assert.equal(Boolean(p.find(node => node.type.name === 'FilterPanel')), !empty);
    if (!empty) p.openPanel();
    assert.equal(p.state.nodes.filter(({node}) => node.type.name === 'FacetRow').length, p.state.dimensions.length);
    click(p, '重置'); assert.deepEqual(p.state.intents, [{type:'reset'}]);
  }
});

test('P41 intents remain controlled until host applies; invalidated drafts cannot overwrite refreshed dimensions/values', () => {
  const p = probe('C'); p.state.apply = false; p.render();
  choose(p, '难度', ['difficulty-1']);
  assert.deepEqual(p.state.value.filters, {}); assert.equal(p.state.intents.length, 1);
  for (const update of ['options', 'selection']) {
    multi(p, 'C'); choose(p, '题型', ['type-0']);
    if (update === 'options') p.state.dimensions = p.state.dimensions.map(d => d.id === 'type' ? {...d, options:d.options.map(o=>({...o, count:0}))}:d);
    else p.state.value = {...p.state.value, filters:{type:['type-3']}};
    p.render();
    assert.equal(p.find(node => node.type.name === 'Button' && textOf(node) === '确定'), undefined);
    assert.equal(p.state.intents.length, 1);
  }
});

test('P41 counts zero are display facts and no-op host reset does not leave a pending draft', () => {
  const html = ssr('C', 'current', 520, {resultCount:0, favoriteCount:0});
  assert.match(html, /共 0 题/); assert.doesNotMatch(html, /数量未知/);
  const p = probe('C'); p.state.apply = false; p.render(); multi(p,'C'); choose(p,'题型',['type-0']);
  click(p,'重置'); assert.equal(p.find(node=>node.type.name==='Button' && textOf(node)==='确定'), undefined);
  assert.deepEqual(p.state.intents,[{type:'reset'}]);
});

for (const theme of ['light','paper','dark']) for (const width of [520,720,960]) for (const scale of ['current','future']) test(`P41 formal SSR matrix ${theme}/${width}/${scale}`, () => {
  const html = ssr('C',scale,width,{theme}); assert.match(html,/data-facet-filter/); assert.match(html,new RegExp(`data-prism-theme="${theme}"`)); assert.match(html,new RegExp(`width:${width}px`)); assert.match(html,/全部筛选/);
});


test('P44 favorites visibility defaults on and hiding preserves controlled facts and other actions', () => {
  const normalize = html => html.replace(/_R_[^" ]*/g, '_ID_');
  assert.equal(normalize(ssr('C', 'current', 520)), normalize(ssr('C', 'current', 520, { showFavorites: true })));
  const p = probe('C'); p.state.value.favoritesOnly = true; p.state.showFavorites = false; p.render();
  assert.doesNotMatch(p.state.html, /我的收藏/);
  assert.match(p.state.html, /共 128 题/);
  assert.equal(p.state.value.favoritesOnly, true); assert.deepEqual(p.state.intents, []);
  p.find(node => node.type.name === 'Tabs').props.onValueChange('latest');
  p.find(node => node.type.name === 'InputGroupInput').props.onChange({ target: { value: '函数' } }); p.render();
  assert.deepEqual(p.state.intents, [{ type: 'sort', value: 'latest' }, { type: 'search', value: '函数' }]);
  p.state.showFavorites = true; p.render();
  assert.equal(p.find(node => node.type.name === 'Toggle' && textOf(node).includes('我的收藏')).props.pressed, true);
  assert.match(ssr('C', 'current', 520, { showFavorites: false, endSlot: '宿主操作' }), /宿主操作/);
});

test('P44 all common hides empty panel, keeps reset/collapse, and retains overflow after three rows', () => {
  for (const scale of ['current', 'future']) {
    const p = probe('C', scale); p.state.dimensions = p.state.dimensions.map(d => ({ ...d, common: true })); p.render();
    assert.equal(Boolean(p.find(node => node.type.name === 'FilterPanel')), scale === 'future');
    if (scale === 'current') assert.doesNotMatch(p.state.html, /全部筛选/);
    else { p.openPanel(); assert.match(p.state.html, /年份/); }
    click(p, '收起'); click(p, '展开'); click(p, '重置');
    assert.deepEqual(p.state.intents, [{ type: 'reset' }]);
  }
});
