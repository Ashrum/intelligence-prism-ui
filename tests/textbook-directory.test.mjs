import test from 'node:test';
import assert from 'node:assert/strict';
import { createTree, syncDataLoaderFeature, checkboxesFeature } from '@headless-tree/core';
import { textbooks, projectDirectory, createDirectory, directoryLeaves, summarizeDirectory } from '../lib/prism-next/textbook-directory.ts';
import { directoryDepthExamples } from '../lib/prism-next/fixtures/directory-depth.ts';

const data = textbooks[0].directories.course;
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
