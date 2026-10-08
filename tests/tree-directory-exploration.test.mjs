import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { directoryLeaves } from '../lib/prism-next/textbook-directory.ts';
import { probe, explorationBooks, initialDirectoryPath, event } from './tree-directory-exploration-harness.mjs';

const kinds = ['course', 'knowledge'];
function row(p, id) { return p.rows().find(node => node.props.item.getId() === id); }
function openTo(p, id) {
  const data = p.books[0].directories[p.state.kind];
  for (const parent of data.paths[id].slice(0, -1)) {
    if (p.find(node => node.props['data-exploration-view'] === 'B') && row(p, parent)) {
      row(p, parent).props.onKeyDown(event('ArrowRight')); p.render();
    }
  }
}
function activate(p, id, key = 'Enter') { openTo(p, id); assert.ok(row(p, id), id); row(p, id).props.onKeyDown(event(key)); p.render(); }
function multiple(p, value) { p.find(node => node.type.name === 'TooltipTrigger').props.render.props.onPressedChange(value); p.render(); }
function search(p, query) { p.find(node => node.type.name === 'InputGroupInput').props.onChange({ target: { value: query } }); p.state.ui = {}; p.render(); }

test('exploration fixture reuses each 2–5 level sample and supplies long formula titles, absent and zero counts', () => {
  for (const depth of ['2', '3', '4', '5']) {
    const { books, counts } = explorationBooks(depth);
    assert.equal(books.length, 6);
    for (const book of books) for (const kind of kinds) {
      const data = book.directories[kind];
      assert.equal(Math.max(...Object.values(data.paths).map(path => path.length)), Number(depth));
      assert.equal(data.nodes[data.rootId].children.length, 8);
      assert.ok(Object.values(data.nodes).some(node => node.title.includes('x²')));
      assert.ok(Object.keys(data.paths).some(id => counts[id] === 0));
      assert.ok(Object.keys(data.paths).some(id => counts[id] === undefined));
    }
  }
});

test('A/B/C actual handlers produce identical controlled selections through select, cancel, multi, search writeback and clear', async () => {
  const results = [];
  for (const variant of ['A', 'B', 'C']) {
    const p = probe(variant); p.render();
    const data = p.books[0].directories.course, scope = `${p.books[0].id}:course`;
    const leaf = data.leafIds[0], other = data.leafIds[2], chapter = data.paths[leaf][0];
    const sequence = [];
    p.state.selections = { 'unrelated:course': ['keep'] }; p.render();
    activate(p, leaf); assert.deepEqual(p.state.selections[scope], [leaf]); sequence.push(structuredClone(p.state.selections));
    assert.match(p.state.html, /已选：/);
    activate(p, leaf, ' '); assert.deepEqual(p.state.selections[scope], []); sequence.push(structuredClone(p.state.selections));
    multiple(p, true);
    activate(p, leaf, ' ');
    // Return to the root before choosing a different branch in the drill view.
    p.state.ui.parent = data.rootId; p.render();
    activate(p, other);
    assert.deepEqual(new Set(p.state.selections[scope]), new Set([leaf, other]));
    assert.match(p.state.html, /已选 2 项/); sequence.push(structuredClone(p.state.selections));
    search(p, '从图像');
    activate(p, chapter);
    await new Promise(setImmediate); p.render();
    assert.ok(directoryLeaves(data, chapter).every(id => p.state.selections[scope].includes(id)), `${variant}: searched parent still selects its complete unfiltered subtree: ${JSON.stringify(p.state.selections)}`);
    sequence.push(structuredClone(p.state.selections));
    const before = structuredClone(p.state.selections); search(p, '没有任何匹配'); assert.deepEqual(p.state.selections, before);
    assert.match(p.state.html, /没有匹配的目录项/);
    search(p, ''); assert.deepEqual(p.state.selections, before);
    p.find(node => node.props['aria-label'] === '清空所有教材的已选范围').props.onClick(); p.render();
    assert.deepEqual(p.state.selections['unrelated:course'], ['keep']);
    assert.ok(Object.entries(p.state.selections).filter(([key]) => key !== 'unrelated:course').every(([, ids]) => !ids.length));
    assert.doesNotMatch(p.state.html, /已选：|已选 \d+ 项/); sequence.push(structuredClone(p.state.selections));
    results.push(sequence);
  }
  assert.deepEqual(results[0], results[1]); assert.deepEqual(results[1], results[2]);
});

for (const variant of ['A', 'B', 'C']) test(`${variant}: five levels reachable using arrow handlers; Enter/Space select; complete accessible names and level semantics`, async () => {
  const p = probe(variant); p.render();
  const data = p.books[0].directories.course;
  const path = data.paths[data.leafIds[0]];
  if (variant !== 'B') { p.state.sessions[`${p.books[0].id}:course`].expandedIds = []; p.render(); }
  for (const id of path.slice(0, -1)) {
    row(p, id).props.onKeyDown(event('ArrowRight'));
    if (variant !== 'B') p.state.sessions[`${p.books[0].id}:course`].expandedIds = p.tree().getState().expandedItems;
    p.render();
  }
  const leaf = row(p, path.at(-1));
  assert.ok(leaf); assert.equal(leaf.props['aria-level'], 5);
  assert.ok(leaf.props['aria-label'].includes(data.nodes[path.at(-1)].title));
  const tree = p.tree();
  tree.getItemInstance(path.at(-1)).setFocused();
  await tree.getHotkeyPresets().focusNextItem.handler(event('ArrowDown'), tree);
  assert.equal(tree.getState().focusedItem, data.leafIds[1]);
  await tree.getHotkeyPresets().focusPreviousItem.handler(event('ArrowUp'), tree);
  assert.equal(tree.getState().focusedItem, path.at(-1));
  leaf.props.onKeyDown(event('Enter')); p.render();
  assert.equal(row(p, path.at(-1)).props['aria-selected'], true);
  row(p, path.at(-1)).props.onKeyDown(event(' ')); p.render();
  assert.equal(row(p, path.at(-1)).props['aria-selected'], false);
  if (variant === 'B') { row(p, path.at(-1)).props.onKeyDown(event('ArrowLeft')); p.render(); assert.ok(row(p, path.at(-2))); }
});

test('B enter and breadcrumbs only navigate; title chooses; return restores the previous level', () => {
  const p = probe('B'); p.render();
  const data = p.books[0].directories.course, first = data.nodes[data.rootId].children[0];
  row(p, first).props.children.props.children.at(-1).props.onClick(event()); p.render();
  assert.deepEqual(p.state.selections, {}); assert.equal(p.state.ui.parent, first);
  assert.equal(p.rows().length, data.nodes[first].children.length);
  p.find(node => node.props['aria-label'] === '进入目录').props.onClick(); p.render();
  assert.equal(p.state.ui.parent, data.rootId); assert.ok(row(p, first));
});

test('A expands siblings independently without a floating single-open control', () => {
  const p = probe('A'); p.render();
  const data = p.books[0].directories.course, [first, second] = data.nodes[data.rootId].children;
  assert.equal(p.find(node => node.props['aria-label'] === '同级只展开一个'), undefined);
  const tree = p.tree(); tree.getItemInstance(first).collapse();
  row(p, first).props.onKeyDown(event('ArrowRight'));
  assert.ok(tree.getItemInstance(first).isExpanded());
  assert.equal(tree.getItemInstance(second).isExpanded(), true);
});

test('C uses the first visible row in geometric order, preserves capped indentation and ancestor navigation', () => {
  const p = probe('C'); p.render();
  const data = p.books[0].directories.course, leaf = data.leafIds[0], second = data.leafIds[1];
  const scroll = p.find(node => node.props['data-directory-scroll'] !== undefined);
  scroll.props.ref.current = { getBoundingClientRect: () => ({ top: 100 }) };
  // Reverse ref registration order reproduces expanding a branch before rows
  // already mounted below it. Map insertion order must not drive sticky position.
  const secondRow = p.find(node => node.props['data-directory-id'] === second);
  secondRow.props.ref({ getBoundingClientRect: () => ({ top: 170, bottom: 230 }) });
  p.find(node => node.props['data-directory-id'] === leaf).props.ref({ getBoundingClientRect: () => ({ top: 90, bottom: 170 }) });
  scroll.props.onScroll(); assert.equal(p.state.ui.topId, leaf); p.render();
  for (const id of data.paths[leaf].slice(0, -1)) assert.ok(p.find(node => node.props['aria-label'] === `定位${data.nodes[id].title}`));
  assert.equal(row(p, leaf).props.style['--tree-padding'], '24px');
  assert.match(p.state.html, /第 5 级/);
});

test('all variants retain zero counts, omit missing counts, expose mixed parents and share kind switching', () => {
  for (const variant of ['A', 'B', 'C']) {
    const p = probe(variant); p.render();
    const data = p.books[0].directories.course;
    const rootChild = data.nodes[data.rootId].children[0];
    assert.match(row(p, rootChild).props['aria-label'], /，0 题$/);
    const missingId = Object.keys(data.paths).find(id => p.counts[id] === undefined);
    openTo(p, missingId);
    assert.doesNotMatch(row(p, missingId).props['aria-label'], /，\d+ 题$/);
    p.state.ui.parent = data.rootId; p.render();
    p.state.showCounts = false; p.render(); assert.doesNotMatch(row(p, rootChild).props['aria-label'], /题$/);
    multiple(p, true); activate(p, data.leafIds[0]);
    p.state.ui.parent = data.rootId; p.render(); assert.equal(row(p, rootChild).props['aria-checked'], 'mixed');
    p.find(node => node.type.name === 'Tabs').props.onValueChange('knowledge'); p.render();
    assert.equal(p.state.kind, 'knowledge'); assert.ok(p.tree().getConfig().rootItemId.includes(':knowledge:'));
    assert.equal(p.state.selections[`${p.books[0].id}:course`].length, 1);
  }
});


function descendants(node) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(descendants);
  return [node, ...descendants(node.props?.children)];
}

test('shared compact rows retain full names, stable columns, zero counts and multi-select without current styling', () => {
  for (const variant of ['A', 'B', 'C']) {
    const p = probe(variant); p.render();
    const input = p.find(node => node.type.name === 'InputGroupInput');
    assert.equal(input.props['aria-label'], '搜索当前课程目录');
    assert.equal(p.find(node => node.type.name === 'Label' && node.props.htmlFor === input.props.id), undefined);
    assert.match(p.find(node => node.type.name === 'InputGroup').props.className, /flex-1/);
    const data = p.books[0].directories.course, chapter = data.nodes[data.rootId].children[0];
    const content = descendants(row(p, chapter));
    const code = content.find(node => node.props?.['data-directory-code'] !== undefined);
    const count = content.find(node => node.props?.['data-directory-count'] !== undefined);
    assert.equal(code.props.children, '1'); assert.equal(count.props.children, 0);
    assert.match(code.props.className, /w-4.*text-muted-foreground.*tabular-nums/);
    assert.match(count.props.className, /w-7.*text-right.*text-ui-hint.*text-muted-foreground.*tabular-nums/);
    const missing = Object.keys(data.paths).find(id => p.counts[id] === undefined);
    openTo(p, missing);
    assert.equal(descendants(row(p, missing)).find(node => node.props?.['data-directory-count'] !== undefined), undefined);
    activate(p, data.leafIds[0]);
    const leafRow = row(p, data.leafIds[0]);
    assert.equal(leafRow.props.current, true);
    const title = descendants(leafRow).find(node => node.props?.['data-directory-title'] !== undefined);
    assert.equal(title.props.title, data.nodes[data.leafIds[0]].title);
    assert.match(title.props.className, /text-item-title/);
    assert.match(title.props.children.props.className, /line-clamp-2/);
    multiple(p, true);
    assert.ok(p.rows().every(node => !node.props.current && !node.props['aria-current']));
    const children = row(p, data.leafIds[0]).props.children.props.children.filter(Boolean);
    assert.equal(children.find(node => !node.props['aria-hidden']).type.name, 'Checkbox');
  }
});

test('A/C cap depth at 24px with only one immediate branch guide and empty leaf arrow columns', () => {
  for (const variant of ['A', 'C']) {
    const p = probe(variant); p.render();
    const data = p.books[0].directories.course;
    for (const node of p.rows()) {
      const id = node.props.item.getId(), depth = data.paths[id].length;
      assert.equal(node.props.style['--tree-padding'], `${Math.min(depth - 1, 2) * 12}px`);
      const children = descendants(node);
      const guides = children.filter(child => child.props?.['data-directory-guide'] !== undefined);
      assert.equal(guides.length, depth > 1 ? 1 : 0);
      const arrow = children.find(child => child.props?.['data-directory-arrow'] !== undefined);
      assert.match(arrow.props.className, /w-5/);
      if (!data.nodes[id].children.length) assert.equal(arrow.props.children, false);
      if (depth > 3) {
        assert.match(children.find(child => child.props?.['data-directory-title'] !== undefined).props.className, /text-ui-body text-muted-foreground/);
        assert.ok(children.find(child => child.props?.title === `第 ${depth} 级`));
      }
    }
  }
});

test('host defaults expose a fifth-level path in all variants without user actions', () => {
  for (const variant of ['A', 'B', 'C']) {
    const p = probe(variant, '5', true); p.render();
    const data = p.books[0].directories.course, path = initialDirectoryPath(data);
    assert.equal(path.length, 4);
    assert.ok(p.rows().some(node => node.props['aria-level'] === 5));
    if (variant === 'B') assert.equal(p.tree().getConfig().rootItemId, path.at(-1));
    else assert.deepEqual(p.tree().getState().expandedItems, path);
    assert.deepEqual(p.state.selections, {});
  }
});

test('B hides return at root, uses separate 28px entry and collapses middle ancestors into a navigable menu', () => {
  const p = probe('B'); p.render();
  assert.equal(p.find(node => node.type.name === 'Button' && Array.isArray(node.props.children) && node.props.children.includes('返回上一级')), undefined);
  const data = p.books[0].directories.course, path = data.paths[data.leafIds[0]];
  const button = row(p, path[0]).props.children.props.children.at(-1);
  assert.match(button.props.className, /size-7.*sm:size-7/);
  button.props.onClick(event()); p.render();
  assert.equal(p.state.ui.pendingFocus.current, path[1]);
  assert.deepEqual(p.state.selections, {});
  openTo(p, path.at(-1));
  assert.match(p.state.html, /展开中间目录路径/);
  const crumbs = [...new Map(p.state.nodes.filter(node => node.type.name === 'BreadcrumbLink').map(node => [node.props['aria-label'], node])).values()];
  assert.equal(crumbs.length, 2);
  assert.equal(crumbs.at(-1).props.children, data.nodes[path.at(-2)].title);
  assert.match(crumbs.at(-1).props.className, /whitespace-nowrap/);
  row(p, path.at(-1)).props.onKeyDown(event('ArrowLeft')); p.render();
  assert.equal(p.state.ui.pendingFocus.current, path.at(-2));
  assert.ok(row(p, path.at(-2)));
  const middle = p.find(node => node.type.name === 'MenuItem' && node.props['aria-label'] === `进入${data.nodes[path[0]].title}`);
  middle.props.onClick(); p.render();
  assert.equal(p.state.ui.parent, path[0]);
  assert.equal(p.state.ui.pendingFocus.current, path[1]);
  assert.deepEqual(p.state.selections, {});
});

test('exploration route SSR renders three versions, shared switches and link without adding catalog entries', async () => {
  const { default: worker } = await import('../dist/server/index.js');
  for (const path of ['/next/explorations/tree-directory', '/next/components/tree']) {
    const response = await worker.fetch(new Request(`http://localhost${path}`, { headers: { accept: 'text/html' } }), { ASSETS: { fetch: async () => new Response('', { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
    assert.equal(response.status, 200);
    const html = await response.text();
    if (path.includes('explorations')) {
      for (const text of ['大纲树', '逐级钻取', '吸顶祖先树', '数据层级', '显示题数', '宿主选择回显']) assert.ok(html.includes(text), text);
      for (const variant of ['A', 'B', 'C']) {
        assert.ok(html.includes(`data-exploration-view="${variant}"`));
        assert.ok(html.includes(`id="directory-${variant}"`));
        assert.equal(html.split(`href="#directory-${variant}"`).length - 1, 3);
      }
    } else assert.ok(html.includes('/next/explorations/tree-directory'));
  }
  const css = await readFile(new URL('../components/prism-next/explorations/tree-directory.css', import.meta.url), 'utf8');
  assert.ok(css.includes('[data-slot="tabs-content"]'));
  assert.doesNotMatch(css, /font-size|color:|box-shadow/);
});
