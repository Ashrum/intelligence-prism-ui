import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { directoryLeaves } from '../lib/prism-next/textbook-directory.ts';
import { probe, explorationBooks, event } from './tree-directory-exploration-harness.mjs';

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
    assert.equal(books.length, 2);
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
  row(p, first).props.children.props.children[1].props.children.at(-1).props.onClick(event()); p.render();
  assert.deepEqual(p.state.selections, {}); assert.equal(p.state.ui.parent, first);
  assert.equal(p.rows().length, data.nodes[first].children.length);
  p.find(node => node.props['aria-label'] === '进入目录').props.onClick(); p.render();
  assert.equal(p.state.ui.parent, data.rootId); assert.ok(row(p, first));
});

test('A same-level expansion collapses siblings while preserving other levels', () => {
  const p = probe('A'); p.render();
  const data = p.books[0].directories.course, [first, second] = data.nodes[data.rootId].children;
  p.find(node => node.props['aria-label'] === '同级只展开一个').props.onPressedChange(true); p.render();
  const tree = p.tree(); tree.getItemInstance(first).collapse();
  row(p, first).props.onKeyDown(event('ArrowRight'));
  assert.ok(tree.getItemInstance(first).isExpanded());
  assert.equal(tree.getItemInstance(second).isExpanded(), false);
  assert.ok(tree.getItemInstance(data.nodes[first].children[0]).isExpanded());
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
  assert.equal(row(p, leaf).props.style['--tree-padding'], '16px');
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

test('exploration route SSR renders three versions, shared switches and link without adding catalog entries', async () => {
  const { default: worker } = await import('../dist/server/index.js');
  for (const path of ['/next/explorations/tree-directory', '/next/components/tree']) {
    const response = await worker.fetch(new Request(`http://localhost${path}`, { headers: { accept: 'text/html' } }), { ASSETS: { fetch: async () => new Response('', { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
    assert.equal(response.status, 200);
    const html = await response.text();
    if (path.includes('explorations')) {
      for (const text of ['大纲树', '逐级钻取', '吸顶祖先树', '数据层级', '显示题数', '宿主选择回显']) assert.ok(html.includes(text), text);
      for (const variant of ['A', 'B', 'C']) assert.ok(html.includes(`data-exploration-view="${variant}"`));
    } else assert.ok(html.includes('/next/explorations/tree-directory'));
  }
  const css = await readFile(new URL('../components/prism-next/explorations/tree-directory.css', import.meta.url), 'utf8');
  assert.ok(css.includes('[data-slot="tabs-content"]'));
  assert.doesNotMatch(css, /font-size|color:|box-shadow/);
});
