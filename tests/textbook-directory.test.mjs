import test from 'node:test';
import assert from 'node:assert/strict';
import { createTree, syncDataLoaderFeature, checkboxesFeature } from '@headless-tree/core';
import { textbooks, projectDirectory } from '../lib/prism-next/textbook-directory.ts';

const data = textbooks[0].directories.course;
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
