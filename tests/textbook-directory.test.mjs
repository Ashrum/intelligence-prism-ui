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
test('embedded empty text is caller-owned, remains accessible, and clear is disabled at zero', () => {
  assert.match(htmlFor({ layout: 'embedded' }), />未选择<\/p>/);
  const label = '未选择（显示全部）'.repeat(12);
  const nodes = capture({ layout: 'embedded', emptySelectionLabel: label });
  const status = nodes.find(node => node.type === 'p' && node.props.children === label);
  assert.equal(status.props.role, 'status');
  assert.equal(status.props.title, label);
  assert.match(status.props.className, /min-w-0 truncate/);
  assert.equal(nodes.find(node => node.props['aria-label'] === '清空所有教材的已选范围').props.disabled, true);
  assert.equal(htmlFor({ layout: 'embedded', textbooks: [] }), htmlFor({ textbooks: [] }));
});
test('embedded clear uses a functional controlled update across supplied books and keeps unrelated scopes', () => {
  let update;
  const before = structuredClone(mixedSelections);
  const input = { layout: 'embedded', selections: mixedSelections, onSelectionsChange: value => { update = value; } };
  const nodes = capture(input);
  const clear = nodes.find(node => node.props['aria-label'] === '清空所有教材的已选范围');
  assert.equal(clear.props.disabled, false);
  clear.props.onClick();
  assert.equal(typeof update, 'function');
  const latest = { ...mixedSelections, 'arrived-later': ['external'] };
  const result = update(latest);
  for (const book of textbooks) for (const kind of ['course', 'knowledge']) assert.deepEqual(result[`${book.id}:${kind}`], []);
  assert.deepEqual(result['unrelated:course'], ['keep']);
  assert.deepEqual(result['arrived-later'], ['external']);
  assert.deepEqual(mixedSelections, before);
  assert.match(htmlFor(input), /已选 3 项/); // The event alone cannot change external facts.
  assert.match(htmlFor({ ...input, selections: result }), />未选择<\/p>/);
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
