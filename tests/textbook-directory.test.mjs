import test from 'node:test';
import assert from 'node:assert/strict';
import { createTree, syncDataLoaderFeature, checkboxesFeature } from '@headless-tree/core';
import { textbooks, projectDirectory, createDirectory, directoryLeaves, summarizeDirectory } from '../lib/prism-next/textbook-directory.ts';
import { directoryDepthExamples } from '../lib/prism-next/fixtures/directory-depth.ts';
import { readFileSync } from 'node:fs';
import { baselineCases, htmlFor, mountedHtmlFor, hash, capture, mixedSelections } from './textbook-directory-harness.mjs';

const data = textbooks[0].directories.course;
test('default and explicit split preserve complete pre-P24 SSR output', () => {
  const baseline = JSON.parse(readFileSync(new URL('./fixtures/textbook-directory-before.json', import.meta.url)));
  for (const [name, props] of Object.entries(baselineCases)) {
    assert.equal(hash(htmlFor(props)), baseline.hashes[name], name);
    assert.equal(htmlFor(props), htmlFor({ ...props, layout: 'split', emptySelectionLabel: '不应显示' }), name);
  }
});
test('embedded is single-column without selected details and retains tree and directory controls', () => {
  const html = htmlFor({ layout: 'embedded', selections: mixedSelections });
  assert.match(html, /class="grid min-w-0 grid-cols-1"/);
  assert.doesNotMatch(html, /<aside|xl:grid-cols|17rem|已选范围<|已选项|清空当前目录|移除高中/);
  for (const text of ['教材', '课程目录', '知识点目录', '搜索当前课程目录', '已选 3 项', '清空所有教材的已选范围']) assert.ok(html.includes(text), text);
  assert.match(html, /role="tree"/);
  assert.match(mountedHtmlFor({ layout: 'embedded', selections: mixedSelections }), /aria-checked="mixed"/);
  // Both layouts mount the same owned implementation, with the same public selection model.
  for (const layout of ['split', 'embedded']) {
    const nodes = capture({ layout, selections: mixedSelections });
    assert.equal(nodes.filter(node => node.type.name === 'DirectoryTreeView').length, 1);
    assert.equal(nodes.filter(node => node.type.name === 'DirectorySession').length, 1);
    assert.ok(nodes.some(node => node.props['aria-label'] === '目录类型'));
  }
});
test('embedded instructions stay screen-reader accessible without visible paragraph space', () => {
  const html = htmlFor({ layout: 'embedded' });
  const descriptions = html.match(/role="tree"[^>]*aria-describedby="([^"]+)"/)[1].split(' ');
  assert.equal(descriptions.length, 2);
  const instructions = [
    '箭头展开，标题定位，复选框选择。勾选父级包含全部下级，搜索不会缩小勾选范围。',
    '方向键浏览和展开，Enter 定位，空格勾选或取消。',
  ];
  assert.ok(html.includes(`<div class="sr-only"><p id="${descriptions[0]}">${instructions[0]}</p><p id="${descriptions[1]}">${instructions[1]}</p></div>`));
  for (const text of instructions) assert.equal(html.split(text).length - 1, 1);
  assert.doesNotMatch(html, /mb-3 text-ui-hint text-muted-foreground|mt-3 min-h-10/);
  assert.match(html, /<p class="sr-only" role="status"><\/p>/);
  assert.doesNotMatch(htmlFor({ layout: 'split' }), /目录操作说明/);
});
test('embedded book header keeps title-only fallback and full-width tabs', () => {
  const single = htmlFor({ layout: 'embedded', textbooks: textbooks.slice(0, 1) });
  assert.ok(single.includes(textbooks[0].title));
  assert.doesNotMatch(single, /role="combobox"|切换教材|>教材<|目录操作说明/);
  const nodes = capture({ layout: 'embedded', textbooks: textbooks.slice(0, 1) });
  const cover = nodes.find(node => node.props['data-slot'] === 'textbook-cover');
  assert.equal(cover.props['aria-hidden'], 'true');
  assert.equal(cover.props.children[1].props.children, '');
  const title = nodes.find(node => node.type === 'p' && node.props.title === textbooks[0].title);
  assert.match(title.props.className, /truncate text-block-title/);
  assert.equal(nodes.filter(node => node.type === 'p' && node.props.title).length, 1);
  const tabs = nodes.find(node => node.props['aria-label'] === '目录类型');
  assert.equal(tabs.props.className, 'w-full min-w-0');
  assert.ok(tabs.props.children.every(tab => tab.props.className.includes('flex-1 basis-0')));
});
test('embedded book metadata renders full accessible names and two Unicode cover characters', () => {
  for (const metadata of [
    { volume: '九年级上册', subject: '数学', edition: '人教版' },
    { volume: '长册名'.repeat(30), subject: '𠮷语文', edition: '长版本'.repeat(30) },
    { subject: '数学' }, { edition: '人教版' }, { volume: '册名' },
    { volume: '', subject: '', edition: '' },
  ]) {
    const book = { ...textbooks[0], ...metadata };
    const nodes = capture({ layout: 'embedded', textbooks: [book] });
    const volume = metadata.volume || book.title;
    const details = [metadata.subject, metadata.edition].filter(Boolean).join(' · ');
    const name = [volume, details].filter(Boolean).join(' · ');
    assert.ok(nodes.some(node => node.props.role === 'group' && node.props['aria-label'] === name));
    const title = nodes.find(node => node.type === 'p' && node.props.title === volume);
    assert.equal(title.props.children, volume);
    assert.match(title.props.className, /truncate/);
    const second = nodes.find(node => node.type === 'p' && node.props.title === details);
    if (details) {
      assert.equal(second.props.children, details);
      assert.match(second.props.className, /truncate text-ui-hint text-muted-foreground/);
    } else assert.equal(second, undefined);
    const cover = nodes.find(node => node.props['data-slot'] === 'textbook-cover');
    assert.equal(cover.props.children[1].props.children, Array.from(metadata.subject ?? '').slice(0, 2).join(''));
  }
});
test('embedded multi-book menu uses standard switch button, full option labels and existing book selection', () => {
  const books = textbooks.map((book, index) => ({ ...book, volume: `第 ${index + 1} 册`, subject: '数学', edition: '人教版' }));
  let selectedId = books[0].id;
  const selections = structuredClone(mixedSelections);
  const nodes = capture({ layout: 'embedded', textbooks: books, selections }, { mounted: true, bookId: selectedId, onBookChange: value => { selectedId = value; } });
  const trigger = nodes.find(node => node.type.name === 'MenuTrigger');
  assert.equal(trigger.props['aria-label'], '切换教材');
  assert.equal(trigger.props.render.type.name, 'Button');
  assert.equal(trigger.props.render.props.variant, 'outline');
  assert.equal(trigger.props.render.props.size, 'sm');
  const group = nodes.find(node => node.type.name === 'MenuRadioGroup');
  assert.equal(group.props.value, books[0].id);
  const options = nodes.filter(node => node.type.name === 'MenuRadioItem');
  assert.deepEqual(options.map(node => node.props['aria-label']), books.map(book => `${book.volume} · 数学 · 人教版`));
  assert.deepEqual(options.map(node => node.props.value), books.map(book => book.id));
  for (const node of options) assert.equal(node.props.children.props.title, node.props['aria-label']);
  group.props.onValueChange(books[1].id);
  assert.equal(selectedId, books[1].id);
  const after = capture({ layout: 'embedded', textbooks: books, selections }, { mounted: true, bookId: selectedId });
  assert.equal(after.find(node => node.type.name === 'MenuRadioGroup').props.value, books[1].id);
  assert.equal(after.find(node => node.type.name === 'DirectorySession').props.scope, `${books[1].id}:course`);
  assert.deepEqual(selections, mixedSelections);
  const fallback = capture({ layout: 'embedded' }).filter(node => node.type.name === 'MenuRadioItem');
  assert.deepEqual(fallback.map(node => node.props['aria-label']), textbooks.map(book => book.title));
  const buttonTag = htmlFor({ layout: 'embedded' }).match(/<button[^>]*aria-label="切换教材"[^>]*>/)[0];
  assert.match(buttonTag, /aria-haspopup="menu"/);
});
test('host callback wins for single or multiple books and never mounts the internal menu', () => {
  for (const books of [textbooks.slice(0, 1), textbooks]) {
    let calls = 0;
    let bookWrites = 0;
    const onTextbookSwitch = () => { calls++; };
    const nodes = capture({ layout: 'embedded', textbooks: books, onTextbookSwitch }, { mounted: true, onBookChange: () => { bookWrites++; } });
    assert.equal(nodes.some(node => ['MenuTrigger', 'MenuRadioGroup', 'MenuRadioItem', 'SelectItem'].includes(node.type.name)), false);
    const button = nodes.find(node => node.props['aria-label'] === '切换教材');
    assert.equal(button.type.name, 'Button');
    assert.equal(button.props.variant, 'outline');
    assert.equal(button.props.size, 'sm');
    button.props.onClick();
    assert.equal(calls, 1);
    assert.equal(bookWrites, 0);
    const html = htmlFor({ layout: 'embedded', textbooks: books, onTextbookSwitch });
    assert.match(html, /aria-label="切换教材"/);
    assert.doesNotMatch(html, /aria-haspopup="menu"/);
  }
});
test('split ignores embedded header metadata and switch callback byte for byte', () => {
  let calls = 0;
  for (const [name, props] of Object.entries(baselineCases)) {
    const books = (props.textbooks ?? textbooks).map(book => ({ ...book, volume: '册名', subject: '数学', edition: '版本' }));
    for (const titleAction of ['locate', 'select']) assert.equal(
      htmlFor({ ...props, textbooks: books, layout: 'split', titleAction, onTextbookSwitch: () => { calls++; } }),
      htmlFor({ ...props, titleAction }), name,
    );
  }
  assert.equal(calls, 0);
});
test('embedded empty summary is absent by default and optional text has no clear button', () => {
  const empty = htmlFor({ layout: 'embedded' });
  assert.doesNotMatch(empty, /未选择|已选 \d+ 项|清空所有教材|my-1 flex min-w-0/);
  assert.doesNotMatch(empty, /目录操作说明/);
  const label = '未选择（显示全部）'.repeat(12);
  const nodes = capture({ layout: 'embedded', emptySelectionLabel: label });
  const status = nodes.find(node => node.type === 'p' && node.props.children === label);
  assert.equal(status.props.role, 'status');
  assert.equal(status.props.title, label);
  assert.match(status.props.className, /min-w-0 truncate/);
  assert.equal(nodes.some(node => node.props['aria-label'] === '清空所有教材的已选范围'), false);
  assert.ok(htmlFor({ layout: 'embedded', emptySelectionLabel: label }).includes(label));
  assert.equal(htmlFor({ layout: 'embedded', textbooks: [] }), htmlFor({ textbooks: [] }));
});
test('embedded selected summary is one row between search and tree without separator or help', () => {
  const input = { layout: 'embedded', selections: mixedSelections, emptySelectionLabel: '空选择提示' };
  const html = htmlFor(input);
  assert.doesNotMatch(html, /空选择提示/);
  assert.ok(html.indexOf('搜索当前课程目录') < html.indexOf('已选 3 项'));
  assert.ok(html.indexOf('已选 3 项') < html.indexOf('role="tree"'));
  const row = capture(input).find(node => node.type === 'div' && node.props.className === 'flex min-w-0 items-center gap-2 text-ui-hint');
  assert.equal(row.props.children.length, 2);
  assert.equal(row.props.children[0].props.children, '已选 3 项');
  assert.equal(row.props.children[1].props.children, '清空');
});
test('embedded clear uses a functional controlled update across supplied books and keeps unrelated scopes', () => {
  let update;
  const before = structuredClone(mixedSelections);
  const input = { layout: 'embedded', selections: mixedSelections, onSelectionsChange: value => { update = value; } };
  const nodes = capture(input);
  const clear = nodes.find(node => node.props['aria-label'] === '清空所有教材的已选范围');
  assert.ok(!clear.props.disabled);
  assert.equal(clear.props.size, 'sm');
  assert.equal(clear.props.variant, 'ghost');
  clear.props.onClick();
  assert.equal(typeof update, 'function');
  const latest = { ...mixedSelections, 'arrived-later': ['external'] };
  const result = update(latest);
  for (const book of textbooks) for (const kind of ['course', 'knowledge']) assert.deepEqual(result[`${book.id}:${kind}`], []);
  assert.deepEqual(result['unrelated:course'], ['keep']);
  assert.deepEqual(result['arrived-later'], ['external']);
  assert.deepEqual(mixedSelections, before);
  assert.match(htmlFor(input), /已选 3 项/); // The event alone cannot change external facts.
  assert.doesNotMatch(htmlFor({ ...input, selections: result }), /未选择|已选 \d+ 项|清空所有教材|my-1 flex min-w-0/);
});
test('both layouts keep the same leaf-normalizing selection callback and split current-directory clear', () => {
  for (const layout of ['split', 'embedded']) {
    let update;
    const nodes = capture({ layout, selections: mixedSelections, onSelectionsChange: value => { update = value; } });
    const session = nodes.find(node => node.type.name === 'DirectorySession');
    session.props.onCheckedChange(previous => [...previous, 'math-1:course:c112', 'math-1:course:c112', 'invalid']);
    const result = update(mixedSelections);
    assert.deepEqual(result['math-1:course'], ['math-1:course:c111', 'math-1:course:c112']);
    assert.deepEqual(result['math-2:course'], mixedSelections['math-2:course']);
    assert.deepEqual(result['math-1:knowledge'], mixedSelections['math-1:knowledge']);
    if (layout === 'split') {
      nodes.find(node => node.props.children === '清空当前目录').props.onClick();
      assert.deepEqual(update(mixedSelections), { ...mixedSelections, 'math-1:course': [] });
    }
  }
});
test('embedded long node titles keep full checkbox names and wrapping through five levels', () => {
  const title = '从图像与代数表达式两种角度理解函数性质及其实际应用（含 f(x) = x²）';
  const directory = createDirectory('long:course', [{ id: 'long', title }]);
  const book = { id: 'long', title: '长教材名称'.repeat(15), directories: { course: directory, knowledge: directory } };
  const html = mountedHtmlFor({ layout: 'embedded', textbooks: [book] });
  assert.ok(html.includes(`aria-label="选择${title}"`));
  assert.match(html, /whitespace-normal break-words/);
  for (const depth of [2, 3, 4, 5]) assert.match(htmlFor({ layout: 'embedded', textbooks: directoryDepthExamples[String(depth)] }), /role="tree"/);
});

test('two to five level samples preserve deep paths and parent checkbox propagation', async () => {
  const scopes=new Set();
  for (const depth of [2,3,4,5]) for (const kind of ['course','knowledge']) {
    const directory=directoryDepthExamples[String(depth)][0].directories[kind];
    assert.equal(Math.max(...Object.values(directory.paths).map(path=>path.length)),depth);
    for (const id of Object.keys(directory.nodes)) { assert.ok(!scopes.has(id)); scopes.add(id); }
    const leaf=directory.leafIds[0], path=directory.paths[leaf], leaves=directoryLeaves(directory,path[0]);
    const result=projectDirectory(directory,directory.nodes[leaf].title);
    assert.ok(path.every(id=>result.visibleIds.has(id)));
    const tree=createTree({rootItemId:directory.rootId,dataLoader:{getItem:id=>directory.nodes[id],getChildren:id=>directory.nodes[id].children},getItemName:item=>item.getItemData().title,isItemFolder:item=>item.getItemData().children.length>0,propagateCheckedState:true,canCheckFolders:false,features:[syncDataLoaderFeature,checkboxesFeature]});
    tree.setMounted(true); tree.rebuildTree();
    await tree.getItemInstance(path[0]).toggleCheckedState();
    assert.deepEqual(new Set(tree.getState().checkedItems),new Set(leaves));
    await tree.getItemInstance(leaf).setUnchecked();
    assert.ok(path.slice(0,-1).every(id=>tree.getItemInstance(id).getCheckedState()==='indeterminate'));
    const summary=summarizeDirectory(directory,tree.getState().checkedItems);
    assert.deepEqual(new Set(summary.flatMap(item=>item.leafIds)),new Set(leaves.filter(id=>id!==leaf)));
  }
});
test('search finds collapsed descendants and retains paths without unrelated branches', () => {
  const projected = projectDirectory(data, '  单调性  ');
  assert.deepEqual([...projected.matchingIds], ['math-1:course:c221']);
  assert.deepEqual(projected.nodes[data.rootId].children, ['math-1:course:c2']);
  assert.deepEqual(projected.nodes['math-1:course:c22'].children, ['math-1:course:c221']);
  assert.equal(projected.visibleIds.has('math-1:course:c222'), false);
  const folder = projectDirectory(data, '函数的基本性质');
  assert.equal(folder.visibleIds.has('math-1:course:c223'), true);
  assert.equal(projectDirectory(data, '不存在的内容').nodes[data.rootId].children.length, 0);
  assert.equal(projectDirectory(data, '').visibleIds.size, Object.keys(data.nodes).length);
});
test('upstream checkbox propagation retains complete subtree semantics during filtering', async () => {
  const tree = createTree({ rootItemId:data.rootId, dataLoader:{getItem:id=>data.nodes[id],getChildren:id=>data.nodes[id].children}, getItemName:item=>item.getItemData().title, isItemFolder:item=>item.getItemData().children.length>0, propagateCheckedState:true, canCheckFolders:false, features:[syncDataLoaderFeature,checkboxesFeature] });
  tree.setMounted(true);
  tree.rebuildTree();
  const parent = tree.getItemInstance('math-1:course:c22');
  const query = projectDirectory(data, '单调性');
  assert.equal(query.nodes[parent.getId()].children.length, 1);
  await parent.toggleCheckedState();
  assert.deepEqual(new Set(tree.getState().checkedItems), new Set(['math-1:course:c221','math-1:course:c222','math-1:course:c223']));
  assert.equal(parent.getCheckedState(), 'checked');
  await tree.getItemInstance('math-1:course:c222').setUnchecked();
  assert.equal(parent.getCheckedState(), 'indeterminate');
  assert.equal(tree.getState().checkedItems.includes(parent.getId()), false);
  await parent.setUnchecked();
  assert.equal(tree.getState().checkedItems.length, 0);
});
test('book and directory namespaces prevent identical local IDs from leaking across scopes', () => {
  const ids = textbooks.flatMap(book=>Object.values(book.directories).flatMap(directory=>Object.keys(directory.nodes)));
  assert.equal(new Set(ids).size, ids.length);
  for (const book of textbooks) for (const directory of Object.values(book.directories)) for(const id of directory.leafIds) {
    assert.equal(directory.nodes[id].children.length, 0);
    assert.equal(directory.paths[id].at(-1), id);
  }
});
test('four-level summaries cover exactly the selected leaves and expand partial subtrees', () => {
  const directory = createDirectory('four:course', [{id:'chapter',title:'章',children:[{id:'section',title:'节',children:[{id:'group',title:'组',children:[{id:'a',title:'同名项'},{id:'b',title:'其他项'}]}]}]}]);
  const leaves = directoryLeaves(directory, 'four:course:chapter');
  assert.equal(directory.paths[leaves[0]].length, 4);
  const all = summarizeDirectory(directory, [...leaves, leaves[0], 'unknown']);
  assert.deepEqual(all, [{id:'four:course:chapter',leafIds:leaves}]);
  const partial = summarizeDirectory(directory, [leaves[0]]);
  assert.deepEqual(partial, [{id:leaves[0],leafIds:[leaves[0]]}]);
  assert.deepEqual(summarizeDirectory(directory, []), []);
  for (const kind of ['course','knowledge']) assert.equal(Math.max(...Object.values(textbooks[0].directories[kind].paths).map(path=>path.length)), 4);
});
test('search bulk selection excludes descendants of matching folders and keeps outside selections', () => {
  const directory = createDirectory('search', [{id:'folder',title:'函数',children:[{id:'a',title:'单调性'},{id:'b',title:'奇偶性'}]},{id:'c',title:'函数的应用'},{id:'d',title:'概率'}]);
  const result = projectDirectory(directory, '函数');
  const candidates = directory.leafIds.filter(id=>result.matchingIds.has(id));
  assert.deepEqual(candidates, ['search:c']);
  assert.equal(result.visibleIds.has('search:a'), true);
  const applied = {search:['search:d']};
  const draft = structuredClone(applied);
  draft.search = [...new Set([...draft.search, ...candidates])];
  assert.deepEqual(applied.search, ['search:d']);
  assert.deepEqual(draft.search, ['search:d','search:c']);
});

// Exercise the component's actual handlers against real mounted Headless Tree
// models. Renders deliberately wait for the host to apply the controlled update.
function selectionController(extra = {}, initialSession = {}, kind = "course") {
  let selections = extra.selections ?? {}, pending;
  const scope = `${(extra.textbooks ?? textbooks)[0].id}:${kind}`;
  let sessions = { [scope]: { query: "", currentId: "", ...initialSession } };
  return {
    get selections() { return selections; },
    set selections(value) { selections = value; },
    render() {
      return capture({ titleAction: 'select', layout: 'embedded', ...extra, selections, onSelectionsChange: update => { pending = update; } }, {
        mounted: true, kind,
        session: { session: { query: '', currentId: '', ...initialSession, ...sessions[scope] }, setSessions: update => { sessions = update(sessions); } },
      });
    },
    apply(latest = selections) { assert.equal(typeof pending, 'function'); selections = pending(latest); pending = undefined; },
  };
}
const rowFor = (nodes, id) => nodes.find(node => node.type.name === 'TreeItem' && node.props.item.getId() === id);
const currentRows = nodes => nodes.filter(node => node.type.name === 'TreeItem' && node.props.current);
const checkboxFor = (nodes, title) => nodes.find(node => node.props['aria-label'] === `选择${title}`);
function keyOn(row, key, child = false) {
  const target = {};
  let prevented = false, stopped = false;
  row.props.onKeyDown({ key, target, currentTarget: child ? {} : target, preventDefault() { prevented = true; }, stopPropagation() { stopped = true; } });
  return { prevented, stopped };
}
const flushCheckbox = () => new Promise(resolve => setImmediate(resolve));

test('title selection replaces only the active scope, waits for controlled facts, then toggles off in both layouts', () => {
  for (const layout of ['split', 'embedded']) for (const firstBook of textbooks) {
    const books = [firstBook, ...textbooks.filter(book => book !== firstBook)];
    const scope = `${firstBook.id}:course`, id = `${scope}:c11`;
    const control = selectionController({ layout, textbooks: books, selections: mixedSelections });
    const before = structuredClone(control.selections);
    rowFor(control.render(), id).props.onClick();
    assert.deepEqual(control.selections, before);
    assert.equal(currentRows(control.render()).some(row => row.props.item.getId() === id), false);
    control.apply({ ...before, 'later:knowledge': ['external'] });
    assert.deepEqual(control.selections[scope], directoryLeaves(firstBook.directories.course, id));
    for (const otherScope of Object.keys(before).filter(key => key !== scope)) assert.deepEqual(control.selections[otherScope], before[otherScope]);
    assert.deepEqual(control.selections['later:knowledge'], ['external']);
    const rows = control.render();
    assert.equal(rowFor(rows, id).props.current, true);
    assert.equal(rowFor(rows, id).props['aria-current'], 'location');
    assert.equal(rowFor(rows, `${scope}:c1`).props['aria-checked'], 'mixed');
    rowFor(rows, id).props.onClick();
    control.apply();
    assert.deepEqual(control.selections[scope], []);
    assert.equal(currentRows(control.render()).length, 0);
  }
});
test('single title selection followed by checkbox addition/removal becomes multiselect without a current row', async () => {
  const control = selectionController();
  rowFor(control.render(), 'math-1:course:c11').props.onClick(); control.apply();
  checkboxFor(control.render(), '指数函数与对数函数').props.onCheckedChange();
  await flushCheckbox(); control.apply();
  assert.deepEqual(new Set(control.selections['math-1:course']), new Set([...directoryLeaves(data, 'math-1:course:c11'), ...directoryLeaves(data, 'math-1:course:c3')]));
  assert.equal(currentRows(control.render()).length, 0);
  checkboxFor(control.render(), '指数函数与对数函数').props.onCheckedChange();
  await flushCheckbox(); control.apply();
  assert.equal(currentRows(control.render())[0].props.item.getId(), 'math-1:course:c11');
});
test('Enter selects or cancels; Space toggles additional leaves; nested control events are not handled twice', async () => {
  const control = selectionController();
  assert.deepEqual(keyOn(rowFor(control.render(), 'math-1:course:c31'), 'Enter'), { prevented: true, stopped: true });
  control.apply();
  assert.deepEqual(control.selections['math-1:course'], ['math-1:course:c31']);
  assert.deepEqual(keyOn(rowFor(control.render(), 'math-1:course:c32'), ' '), { prevented: true, stopped: true });
  await flushCheckbox(); control.apply();
  assert.deepEqual(new Set(control.selections['math-1:course']), new Set(['math-1:course:c31', 'math-1:course:c32']));
  assert.equal(currentRows(control.render()).length, 0);
  keyOn(rowFor(control.render(), 'math-1:course:c31'), 'Enter'); control.apply();
  keyOn(rowFor(control.render(), 'math-1:course:c31'), 'Enter'); control.apply();
  assert.deepEqual(control.selections['math-1:course'], []);
  assert.deepEqual(keyOn(rowFor(control.render(), 'math-1:course:c31'), 'Enter', true), { prevented: false, stopped: false });
});
test('title activation opens collapsed parents but never closes them; arrow only expands/collapses', async () => {
  const control = selectionController();
  const rows = control.render(), row = rowFor(rows, 'math-1:course:c11');
  const item = row.props.item;
  assert.equal(item.isExpanded(), false);
  row.props.onClick(); control.apply(); await flushCheckbox();
  assert.equal(item.isExpanded(), true);
  row.props.onClick(); control.apply(); await flushCheckbox();
  assert.equal(item.isExpanded(), true);
  const arrow = rows.find(node => node.props['aria-label'] === '展开集合的概念与运算');
  const before = structuredClone(control.selections);
  let stopped = false;
  arrow.props.onClick({ stopPropagation() { stopped = true; } });
  await flushCheckbox();
  assert.equal(stopped, true);
  assert.equal(item.isExpanded(), false);
  assert.deepEqual(control.selections, before);
});
test('search title selection covers hidden descendants and current state derives from complete external leaf sets', () => {
  const control = selectionController({}, { query: '单调性' });
  rowFor(control.render(), 'math-1:course:c22').props.onClick(); control.apply();
  assert.deepEqual(control.selections['math-1:course'], directoryLeaves(data, 'math-1:course:c22'));
  assert.equal(currentRows(control.render())[0].props.item.getId(), 'math-1:course:c22');
  control.selections = { 'math-1:course': ['math-1:course:c221', 'math-1:course:c31'] };
  assert.equal(currentRows(control.render()).length, 0);
  control.selections = {};
  assert.equal(currentRows(control.render()).length, 0);
});
test('current rows follow complete subtree equivalence, ignore invalid IDs, and preserve clicked nodes on unary chains', () => {
  for (const id of ['math-1:course:c1', 'math-1:course:c11', 'math-1:course:c31']) {
    const html = mountedHtmlFor({ titleAction: 'select', selections: { 'math-1:course': [...directoryLeaves(data, id), 'invalid', id] } });
    assert.equal((html.match(/aria-current="location"/g) ?? []).length, 1);
    assert.match(html, /aria-selected="true"[^>]*data-current="true"/);
  }
  const directory = createDirectory('chain:course', [{ id: 'a', title: '甲', children: [{ id: 'b', title: '乙', children: [{ id: 'c', title: '丙' }] }] }]);
  const books = [{ id: 'chain', title: '教材', directories: { course: directory, knowledge: directory } }];
  const control = selectionController({ textbooks: books }, { expandedIds: ['chain:course:a', 'chain:course:b'] });
  rowFor(control.render(), 'chain:course:c').props.onClick(); control.apply();
  assert.equal(currentRows(control.render())[0].props.item.getId(), 'chain:course:c');
  rowFor(control.render(), 'chain:course:c').props.onClick(); control.apply();
  assert.equal(currentRows(control.render()).length, 0);
});
test('select instructions stay in accessible descriptions in both layouts with no locate feedback', () => {
  const instructions = ['点标题只看这一项，再点一次取消。勾选可以多选，勾选父级包含全部下级。搜索不会改变已选范围。', '方向键浏览和展开，Enter 选中这一项，空格勾选或取消。'];
  for (const layout of ['split', 'embedded']) {
    const html = htmlFor({ layout, titleAction: 'select' });
    for (const text of instructions) assert.ok(html.includes(text));
    assert.equal(html.match(/role="tree"[^>]*aria-describedby="([^"]+)"/)[1].split(' ').length, 2);
    assert.doesNotMatch(html, /当前位置|Enter 定位|mt-3 min-h-10/);
    const nodes = capture({ layout, titleAction: 'select' }, { session: { session: { query: '', currentId: 'math-1:course:c1' } } });
    assert.equal(nodes.some(node => typeof node.props.children === 'string' && node.props.children.startsWith('当前位置')), false);
    if (layout === 'embedded') assert.doesNotMatch(html, /目录操作说明/);
  }
});
test('explicit locate equals omitted mode and title/Enter remain navigation only without auto expansion', () => {
  for (const layout of ['split', 'embedded']) for (const extra of Object.values(baselineCases)) assert.equal(htmlFor({ ...extra, layout }), htmlFor({ ...extra, layout, titleAction: 'locate' }));
  let writes = 0;
  const nodes = capture({ titleAction: 'locate', onSelectionsChange() { writes++; } }, { mounted: true });
  const row = rowFor(nodes, 'math-1:course:c11');
  row.props.onClick(); keyOn(row, 'Enter');
  assert.equal(writes, 0);
  assert.equal(row.props.item.isExpanded(), false);
  assert.equal(row.props['aria-current'], undefined);
});


test('knowledge title selection replaces knowledge only and leaves course and other books intact', () => {
  for (const book of textbooks) {
    const books = [book, ...textbooks.filter(other => other !== book)];
    const scope = `${book.id}:knowledge`, id = `${scope}:k1`;
    const before = { ...mixedSelections, [scope]: [`${scope}:k31`] };
    const control = selectionController({ textbooks: books, selections: before }, {}, 'knowledge');
    rowFor(control.render(), id).props.onClick(); control.apply();
    assert.deepEqual(control.selections[scope], directoryLeaves(book.directories.knowledge, id));
    for (const otherScope of Object.keys(before).filter(key => key !== scope)) assert.deepEqual(control.selections[otherScope], before[otherScope]);
    rowFor(control.render(), id).props.onClick(); control.apply();
    assert.deepEqual(control.selections[scope], []);
  }
});

test('embedded summarizes a selected eight-leaf chapter, partial choices and multiple scopes', () => {
  const chapterTitle = '第二十四章 圆';
  const makeBook = id => ({ id, title: id, directories: Object.fromEntries(['course', 'knowledge'].map(kind => [kind, createDirectory(`${id}:${kind}`, [
    { id: 'chapter', title: chapterTitle, children: Array.from({ length: 8 }, (_, i) => ({ id: `leaf-${i}`, title: `圆的性质 ${i + 1}` })) },
    { id: 'other', title: '其他节点' },
  ])])) });
  const books = [makeBook('a'), makeBook('b')];
  const leaves = directoryLeaves(books[0].directories.course, 'a:course:chapter');
  const summary = selections => capture({ layout: 'embedded', textbooks: books, selections }).find(node => node.props.className === 'flex min-w-0 items-center gap-2 text-ui-hint')?.props.children[0];
  const single = summary({ 'a:course': [...leaves, leaves[0], 'unknown', 'a:course:chapter'], 'unrelated:course': ['external'] });
  assert.equal(single.props.children, `已选：${chapterTitle}`);
  assert.equal(single.props.title, `已选：${chapterTitle}`);
  assert.equal(single.props['aria-label'], `已选：${chapterTitle}`);
  assert.match(single.props.className, /min-w-0 truncate/);
  assert.equal(summary({ 'a:course': [leaves[0]] }).props.children, '已选：圆的性质 1');
  assert.equal(summary({ 'a:course': leaves.slice(0, 2) }).props.children, '已选 2 项');
  assert.equal(summary({ 'a:course': [...leaves, 'a:course:other'] }).props.children, '已选 2 项');
  assert.equal(summary({ 'a:course': leaves, 'a:knowledge': directoryLeaves(books[0].directories.knowledge, 'a:knowledge:chapter'), 'b:course': directoryLeaves(books[1].directories.course, 'b:course:chapter') }).props.children, '已选 3 项');
  assert.equal(summary({ 'a:course': ['unknown', 'a:course:chapter'] }), undefined);
});

test('embedded long single selection preserves full title in SSR text, title and accessible name', () => {
  const title = '从图像与代数表达式两种角度理解函数性质及其实际应用（含 f(x) = x²）';
  const directory = createDirectory('long:course', [{ id: 'chapter', title, children: [{ id: 'one', title: '一' }, { id: 'two', title: '二' }] }]);
  const html = htmlFor({ layout: 'embedded', textbooks: [{ id: 'long', title: '教材', directories: { course: directory, knowledge: directory } }], selections: { 'long:course': directory.leafIds } });
  assert.ok(html.includes(`title="已选：${title}" aria-label="已选：${title}">已选：${title}</p>`));
  assert.doesNotMatch(html, /已选 1 项|已选 2 项/);
});

const multiToggle = nodes => nodes.find(node => node.props.render?.props['aria-label'] === '多选').props.render;
const toggleController = (extra = {}, session = {}, kind = 'course') => selectionController({ multiSelect: 'toggle', ...extra }, session, kind);

test('pre-P29 split hashes remain unchanged for both title actions and all multiSelect values', () => {
  const before = JSON.parse(readFileSync(new URL('./fixtures/textbook-directory-p29-before.json', import.meta.url)));
  for (const [name, props] of Object.entries(baselineCases)) for (const titleAction of ['locate', 'select']) {
    for (const multiSelect of [undefined, 'always', 'toggle']) assert.equal(hash(htmlFor({ ...props, titleAction, multiSelect })), before[`${name}:${titleAction}`]);
    // embedded's header intentionally changes in P29; omitted vs explicit always
    // must still produce identical complete SSR, including initialized tree rows.
    for (const render of [htmlFor, mountedHtmlFor]) assert.equal(hash(render({ ...props, titleAction, layout: 'embedded' })), hash(render({ ...props, titleAction, layout: 'embedded', multiSelect: 'always' })));
  }
});

test('toggle starts off with no checkbox, selects a complete subtree and cancels by title or keyboard', () => {
  const control = toggleController();
  const id = 'math-1:course:c11';
  let nodes = control.render();
  assert.equal(multiToggle(nodes).props.pressed, false);
  assert.equal(nodes.some(node => node.type.name === 'Checkbox'), false);
  assert.equal(rowFor(nodes, id).props['aria-checked'], undefined);
  rowFor(nodes, id).props.onClick(); control.apply();
  assert.deepEqual(control.selections['math-1:course'], directoryLeaves(data, id));
  nodes = control.render();
  assert.equal(multiToggle(nodes).props.pressed, false); // Several leaves, one merged node.
  assert.equal(currentRows(nodes)[0].props.item.getId(), id);
  rowFor(nodes, id).props.onClick(); control.apply();
  assert.deepEqual(control.selections['math-1:course'], []);
  keyOn(rowFor(control.render(), id), ' '); control.apply();
  assert.deepEqual(control.selections['math-1:course'], directoryLeaves(data, id));
  keyOn(rowFor(control.render(), id), 'Enter'); control.apply();
  assert.deepEqual(control.selections['math-1:course'], []);
});

test('opening toggle shows checkboxes; titles, Space and checkboxes share full-tree propagation without current rows', async () => {
  const control = toggleController({}, { query: '单调性' });
  multiToggle(control.render()).props.onPressedChange(true);
  let nodes = control.render();
  assert.equal(multiToggle(nodes).props.pressed, true);
  assert.ok(checkboxFor(nodes, '函数的基本性质'));
  rowFor(nodes, 'math-1:course:c22').props.onClick(); await flushCheckbox(); control.apply();
  assert.deepEqual(new Set(control.selections['math-1:course']), new Set(directoryLeaves(data, 'math-1:course:c22')));
  nodes = control.render();
  assert.equal(currentRows(nodes).length, 0);
  assert.equal(rowFor(nodes, 'math-1:course:c22').props['aria-checked'], true);
  checkboxFor(nodes, data.nodes['math-1:course:c221'].title).props.onCheckedChange(); await flushCheckbox(); control.apply();
  assert.equal(rowFor(control.render(), 'math-1:course:c22').props['aria-checked'], 'mixed');
  keyOn(rowFor(control.render(), 'math-1:course:c221'), ' '); await flushCheckbox(); control.apply();
  assert.equal(rowFor(control.render(), 'math-1:course:c22').props['aria-checked'], true);
  keyOn(rowFor(control.render(), 'math-1:course:c22'), 'Enter'); await flushCheckbox(); control.apply();
  assert.deepEqual(control.selections['math-1:course'], []);
  assert.equal(multiToggle(control.render()).props.pressed, true);
});

test('closing multiSelect keeps zero or one merged node but clears multiple nodes only in the active scope', () => {
  for (const kind of ['course', 'knowledge']) {
    const scope = `math-1:${kind}`, directory = textbooks[0].directories[kind];
    const parent = directory.nodes[directory.rootId].children[0];
    const other = directory.nodes[directory.rootId].children[1];
    for (const leaves of [[], directoryLeaves(directory, parent), [...directoryLeaves(directory, parent), ...directoryLeaves(directory, other)]]) {
      const before = { ...mixedSelections, [scope]: leaves };
      const control = toggleController({ selections: before }, { multiSelect: true }, kind);
      multiToggle(control.render()).props.onPressedChange(false);
      assert.deepEqual(control.selections, before); // Host has not applied the intent.
      control.apply();
      assert.deepEqual(control.selections[scope], summarizeDirectory(directory, leaves).length > 1 ? [] : leaves);
      for (const key of Object.keys(before).filter(key => key !== scope)) assert.deepEqual(control.selections[key], before[key]);
      assert.equal(multiToggle(control.render()).props.pressed, false);
      assert.equal(control.render().some(node => node.type.name === 'Checkbox'), false);
    }
  }
});

test('closing evaluates the latest controlled selection, preserving newly arrived scopes', () => {
  const control = toggleController({ selections: { 'math-1:course': ['math-1:course:c31'] } }, { multiSelect: true });
  multiToggle(control.render()).props.onPressedChange(false);
  control.apply({ 'math-1:course': ['math-1:course:c31', 'math-1:course:c221'], 'later:knowledge': ['keep'] });
  assert.deepEqual(control.selections, { 'math-1:course': [], 'later:knowledge': ['keep'] });
});

test('external multiple merged nodes initialize the toggle on, while unrelated scopes and one complete parent do not', () => {
  const extra = { layout: 'embedded', multiSelect: 'toggle', titleAction: 'select' };
  const multiple = { 'math-1:course': ['math-1:course:c31', 'math-1:course:c221'] };
  const html = mountedHtmlFor({ ...extra, selections: multiple });
  assert.match(html, /aria-pressed="true"/);
  assert.match(html, /role="checkbox"/);
  assert.doesNotMatch(html, /data-current="true"|aria-current="location"/);
  for (const selections of [{}, { 'math-1:course': directoryLeaves(data, 'math-1:course:c1') }, { 'math-2:course': textbooks[1].directories.course.leafIds }]) {
    const single = mountedHtmlFor({ ...extra, selections });
    assert.match(single, /aria-pressed="false"/);
    assert.doesNotMatch(single, /role="checkbox"|aria-checked=/);
  }
  const control = toggleController();
  control.selections = multiple;
  assert.equal(multiToggle(control.render()).props.pressed, true);
});

test('toggle locate mode only locates when off and toggles checked state when on', async () => {
  const control = toggleController({ titleAction: 'locate' });
  const id = 'math-1:course:c11';
  rowFor(control.render(), id).props.onClick();
  keyOn(rowFor(control.render(), id), ' ');
  assert.deepEqual(control.selections, {});
  assert.equal(currentRows(control.render())[0].props.item.getId(), id);
  multiToggle(control.render()).props.onPressedChange(true);
  assert.equal(currentRows(control.render()).length, 0);
  rowFor(control.render(), id).props.onClick(); await flushCheckbox(); control.apply();
  assert.deepEqual(new Set(control.selections['math-1:course']), new Set(directoryLeaves(data, id)));
});

test('toggle has a standard named control and tooltip; both instructions remain sr-only and described by the tree', () => {
  for (const selections of [{}, { 'math-1:course': ['math-1:course:c31', 'math-1:course:c221'] }]) {
    const extra = { layout: 'embedded', titleAction: 'select', multiSelect: 'toggle', selections };
    const html = htmlFor(extra);
    const descriptions = html.match(/role="tree"[^>]*aria-describedby="([^"]+)"/)[1].split(' ');
    assert.equal(descriptions.length, 2);
    assert.ok(html.includes(`<div class="sr-only"><p id="${descriptions[0]}">`));
    for (const id of descriptions) assert.ok(html.includes(`id="${id}"`));
    assert.doesNotMatch(html, /目录操作说明/);
    const nodes = capture(extra), toggle = multiToggle(nodes);
    assert.equal(toggle.props.size, undefined);
    assert.equal(toggle.props['aria-label'], '多选');
    assert.ok(nodes.some(node => node.props.children === '打开后可以勾选多个章节或知识点'));
    assert.ok(html.includes(Object.keys(selections).length ? '点标题或复选框勾选，勾选父级包含全部下级。' : '点标题只看这一项，再点一次取消。'));
  }
});

test('P33 internal presentation seam preserves baseline split and embedded SSR hashes in all 16 mode/selection combinations', () => {
  const before = JSON.parse(readFileSync(new URL('./fixtures/textbook-directory-p33-before.json', import.meta.url)));
  for (const layout of ['split', 'embedded']) for (const titleAction of ['locate', 'select']) for (const multiSelect of ['always', 'toggle']) for (const selected of [false, true]) {
    const selections = selected ? { 'math-1:course': ['math-1:course:c111'], 'math-2:knowledge': ['math-2:knowledge:k11'] } : {};
    assert.equal(hash(htmlFor({ layout, titleAction, multiSelect, selections })), before.hashes[`${layout}:${titleAction}:${multiSelect}:${selected}`]);
  }
});

test('P41 split ignores embedded formal props, including dialog, byte for byte', () => {
  for (const titleAction of ['locate','select']) {
    const base={layout:'split',titleAction,selections:mixedSelections};
    assert.equal(hash(htmlFor({...base,multiSelect:'dialog',allOption:{},counts:{},subjects:[],currentNodes:{}})),hash(htmlFor(base)));
  }
});
