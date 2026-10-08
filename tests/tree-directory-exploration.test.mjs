import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createDirectory, firstLeafSelection, directoryLeaves } from '../lib/prism-next/textbook-directory.ts';
import { probe, explorationBooks, event, defaultDirectorySelections, restoreDirectorySelections, saveDirectorySelections, clearDirectoryMemory, directoryMemoryKey, restoreDirectoryCurrentNodes } from './directory-picker-harness.mjs';

const allRow = p => p.find(node => node.props['data-directory-all'] !== undefined);
const activate = (p, id, key = 'Enter') => { p.row(id).props.onKeyDown(event(key)); p.render(); };
const descendants = node => !node || typeof node !== 'object' ? [] : Array.isArray(node) ? node.flatMap(descendants) : [node, ...descendants(node.props?.children)];
function memory() {
  const entries = new Map();
  return { entries, get length() { return entries.size }, key: index => [...entries.keys()][index] ?? null, getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value), removeItem: key => entries.delete(key) };
}

test('first lesson follows first-child order at 2–5 levels, one level and empty directories', () => {
  for (const depth of ['2', '3', '4', '5']) {
    const { books, counts } = explorationBooks(depth);
    for (const book of books) for (const kind of ['course', 'knowledge']) {
      const data = book.directories[kind];
      let first = data.nodes[data.rootId].children[0];
      while (data.nodes[first].children.length) first = data.nodes[first].children[0];
      assert.deepEqual(firstLeafSelection(data), [first]);
      assert.equal(data.paths[first].length, Number(depth));
      assert.ok(Object.values(data.nodes).some(node => node.title.includes('x²')));
      assert.ok(Object.keys(data.paths).some(id => counts[id] === 0));
      assert.ok(Object.keys(data.paths).some(id => counts[id] === undefined));
    }
  }
  assert.deepEqual(firstLeafSelection(createDirectory('empty', [])), []);
  const flat = createDirectory('one', [{ id: 'z', title: '第一项' }, { id: 'a', title: '第二项' }]);
  assert.deepEqual(firstLeafSelection(flat), ['one:z']);
  const uneven = createDirectory('mixed', [{ id: 'first', title: '第一课' }, { id: 'deep', title: '章', children: [{ id: 'late', title: '后面的课' }] }]);
  assert.deepEqual(firstLeafSelection(uneven), ['mixed:first']);
});

test('host default expands to the exact first leaf and keeps one current item; knowledge defaults to all', () => {
  for (const depth of ['2', '3', '4', '5']) {
    const p = probe(depth, true); p.render();
    const data = p.books[0].directories.course, leaf = firstLeafSelection(data)[0];
    assert.deepEqual(p.tree().getState().expandedItems, data.paths[leaf].slice(0, -1));
    assert.equal(p.row(leaf).props['aria-selected'], true);
    assert.equal(p.rows().filter(node => node.props.current).length, 1);
    assert.equal(allRow(p).props['aria-pressed'], false);
    assert.doesNotMatch(p.state.html, /已选：/);
    activate(p, leaf, ' '); assert.equal(p.row(leaf).props.current, true);
    p.tab('knowledge'); assert.equal(allRow(p).props['aria-label'], '全部知识点'); assert.equal(allRow(p).props['aria-pressed'], true);
  }
});

test('all is independent, exclusive, stays above search results, and retains supplied total including zero', () => {
  const p = probe(); p.render();
  const data = p.books[0].directories.course, leaf = data.leafIds[0], scope = `${p.books[0].id}:course`;
  assert.equal(allRow(p).props['aria-label'], '全部，整本教材');
  assert.equal(allRow(p).props['aria-pressed'], true);
  assert.equal(allRow(p).type, 'button'); assert.equal(allRow(p).props.role, undefined);
  assert.ok(!descendants(allRow(p)).some(node => node.props?.['aria-expanded'] !== undefined));
  assert.equal(descendants(allRow(p)).find(node => node.props?.['data-directory-count'] !== undefined).props.children, 328);
  activate(p, leaf); assert.equal(allRow(p).props['aria-pressed'], false);
  activate(p, leaf); assert.deepEqual(p.state.selections[scope], [leaf]);
  allRow(p).props.onClick(); p.render(); assert.deepEqual(p.state.selections[scope], []);
  assert.ok(p.rows().every(node => !node.props.current)); assert.equal(allRow(p).props['aria-pressed'], true);
  p.search('没有任何匹配'); assert.match(p.state.html, /没有匹配的目录项/); assert.ok(allRow(p));
  assert.ok(p.state.html.indexOf('data-directory-all') < p.state.html.indexOf('没有匹配的目录项'));
  p.counts[data.rootId] = 0; p.render(); assert.equal(descendants(allRow(p)).find(node => node.props?.['data-directory-count'] !== undefined).props.children, 0);
  delete p.counts[data.rootId]; p.render(); assert.ok(!descendants(allRow(p)).some(node => node.props?.['data-directory-count'] !== undefined));
});

test('exact selected folder survives one-child ancestor chains and re-click never cancels', () => {
  const p = probe(); p.render();
  const data = p.books[0].directories.course, id = data.paths[data.leafIds[0]].at(-2);
  activate(p, id); assert.equal(p.row(id).props.current, true);
  assert.equal(p.rows().filter(node => node.props.current).length, 1);
  activate(p, id, ' '); assert.equal(p.row(id).props.current, true);
  assert.doesNotMatch(p.state.html, /已选：|已选 \d+ 项/);
});

test('all ArrowDown/Right enter the first tree row; ArrowUp/Home return without changing selection', () => {
  const p = probe(); p.render();
  const first = p.rows()[0], tree = p.tree(), before = structuredClone(p.state.selections);
  for (const key of ['ArrowDown', 'ArrowRight']) { allRow(p).props.onKeyDown(event(key)); assert.equal(tree.getState().focusedItem, first.props.item.getId()); }
  let focuses = 0; allRow(p).props.ref.current = { focus() { focuses++ } };
  first.props.onKeyDown(event('ArrowUp')); first.props.onKeyDown(event('Home')); assert.equal(focuses, 2);
  assert.deepEqual(p.state.selections, before);
  for (const id of p.books[0].directories.course.paths[p.books[0].directories.course.leafIds[0]].slice(0, -1)) {
    p.row(id).props.item.collapse(); p.row(id).props.onKeyDown(event('ArrowRight')); assert.equal(p.row(id).props.item.isExpanded(), true);
  }
});

test('A keeps capped indentation, one branch guide, compact count columns, full names and removes deep numeric markers', () => {
  const p = probe(); p.render(); const data = p.books[0].directories.course;
  for (const node of p.rows()) {
    const id = node.props.item.getId(), depth = data.paths[id].length, children = descendants(node);
    assert.equal(node.props.style['--tree-padding'], `${Math.min(depth - 1, 2) * 12}px`);
    assert.equal(node.props['aria-level'], depth); assert.ok(node.props['aria-label'].includes(data.nodes[id].title));
    assert.equal(children.filter(child => child.props?.['data-directory-guide'] !== undefined).length, depth > 1 ? 1 : 0);
    assert.ok(!children.some(child => child.props?.title === `第 ${depth} 级`));
    const arrow = children.find(child => child.props?.['data-directory-arrow'] !== undefined); assert.match(arrow.props.className, /w-5/);
    if (!data.nodes[id].children.length) assert.equal(arrow.props.children, false);
    if (depth > 3) assert.match(children.find(child => child.props?.['data-directory-title'] !== undefined).props.className, /text-ui-body text-muted-foreground/);
    const count = children.find(child => child.props?.['data-directory-count'] !== undefined);
    if (count) assert.match(count.props.className, /w-7.*text-right.*text-ui-hint.*text-muted-foreground.*tabular-nums/);
  }
  activate(p, data.leafIds[0]); assert.match(descendants(p.row(data.leafIds[0])).find(node => node.props?.['data-directory-title'] !== undefined).props.className, /text-ui-body text-muted-foreground/);
});

test('host memory round-trips all, multi and exact single target independently by book/kind; invalid and failed storage fall back', () => {
  const { books } = explorationBooks('5'), storage = memory(), get = () => storage;
  const defaults = defaultDirectorySelections(books), first = books[0], data = first.directories.course;
  const course = `${first.id}:course`, knowledge = `${first.id}:knowledge`, other = `${books[1].id}:course`;
  assert.deepEqual(restoreDirectorySelections(books, get), defaults);
  const chosen = { ...defaults, [course]: [], [knowledge]: first.directories.knowledge.leafIds.slice(0, 3), [other]: books[1].directories.course.leafIds.slice(-1) };
  assert.deepEqual(saveDirectorySelections(books, chosen, get), chosen);
  assert.deepEqual(restoreDirectorySelections(books, get), chosen);
  const parent = data.paths[data.leafIds[0]].at(-2), single = { ...chosen, [course]: directoryLeaves(data, parent) };
  saveDirectorySelections(books, single, get, { [course]: parent });
  assert.deepEqual(restoreDirectoryCurrentNodes(books, restoreDirectorySelections(books, get), get), { [course]: parent });
  const p = probe('5', true); p.state.selections = restoreDirectorySelections(books, get); p.state.currentNodes = restoreDirectoryCurrentNodes(books, p.state.selections, get); p.render();
  assert.equal(p.row(parent).props.current, true); assert.equal(p.rows().filter(row => row.props.current).length, 1);
  for (const invalid of ['{', 'null', '{"ids":"bad"}', JSON.stringify({ ids: [data.leafIds[0], 'removed'] }), JSON.stringify({ ids: [data.rootId] }), JSON.stringify({ ids: data.leafIds.slice(-1), currentId: 'removed-folder' })]) {
    storage.setItem(directoryMemoryKey(course), invalid);
    const result = restoreDirectorySelections(books, get); assert.deepEqual(result[course], defaults[course]); assert.deepEqual(result[knowledge], chosen[knowledge]);
  }
  const inaccessible = () => { throw new Error('SecurityError') };
  assert.deepEqual(restoreDirectorySelections(books, inaccessible), defaults);
  assert.deepEqual(saveDirectorySelections(books, chosen, inaccessible), defaults);
  assert.deepEqual(saveDirectorySelections(books, chosen, () => ({ ...storage, setItem() { throw new Error('QuotaExceededError') } })), defaults);
  assert.deepEqual(restoreDirectorySelections(books, () => ({ ...storage, getItem() { throw new Error('SecurityError') } })), defaults);
  storage.setItem('unrelated', 'keep'); clearDirectoryMemory(get); assert.deepEqual([...storage.entries], [['unrelated', 'keep']]);
  assert.doesNotThrow(() => clearDirectoryMemory(inaccessible));
  assert.deepEqual(restoreDirectorySelections(books, get), defaults);
});

test('restored late selection expands its ancestors, while empty and flat directories retain the all control', () => {
  const p = probe('5', true), book = p.books[0], data = book.directories.course, leaf = data.leafIds.at(-1);
  p.state.selections[`${book.id}:course`] = [leaf]; p.render();
  assert.ok(data.paths[leaf].slice(0, -1).every(id => p.tree().getState().expandedItems.includes(id)));
  assert.equal(p.row(leaf).props.current, true);
  for (const branches of [[], [{ id: 'first', title: '第一课' }]]) {
    const q = probe('2', true), old = q.books[0], flat = createDirectory('flat:course', branches);
    q.state.books = [{ ...old, directories: { ...old.directories, course: flat } }];
    q.state.selections[`${old.id}:course`] = firstLeafSelection(flat); q.render();
    assert.ok(allRow(q)); assert.equal(allRow(q).props['aria-pressed'], !branches.length);
    if (branches.length) assert.equal(q.row('flat:course:first').props.current, true);
  }
});

test('exploration route SSR presents only A and links; CSS stays layout-only', async () => {
  const { default: worker } = await import('../dist/server/index.js');
  for (const path of ['/next/explorations/tree-directory', '/next/components/tree']) {
    const response = await worker.fetch(new Request(`http://localhost${path}`, { headers: { accept: 'text/html' } }), { ASSETS: { fetch: async () => new Response('', { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
    assert.equal(response.status, 200); const html = await response.text();
    if (path.includes('explorations')) {
      for (const text of ['教材目录 · 定版探索', '大纲树', '数据层级', '显示题数', '清除记忆，回到首次进入状态', '宿主选择回显']) assert.ok(html.includes(text), text);
      assert.doesNotMatch(html, /逐级钻取|吸顶祖先树|三版|directory-B|directory-C/);
      assert.ok(html.includes('id="directory-A"'));
    } else assert.ok(html.includes('/next/explorations/tree-directory'));
  }
  const css = await readFile(new URL('../components/prism-next/explorations/tree-directory.css', import.meta.url), 'utf8');
  assert.ok(css.includes('[data-slot="tabs-content"]')); assert.doesNotMatch(css, /font-size|color:|box-shadow/);
});
