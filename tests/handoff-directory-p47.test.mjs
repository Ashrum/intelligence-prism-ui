import test from 'node:test';
import assert from 'node:assert/strict';
import { probe, event, textOf } from './directory-picker-harness.mjs';

const group = (p, label) => p.find(node => node.type.name === 'ToggleGroup' && node.props['aria-label'] === label);
const choose = (p, label, value) => { group(p, label).props.onValueChange([value]); p.render(); };
const currentBook = p => p.find(node => node.type.name === 'BookHeader').props.book.id;
const confirmation = p => p.find(node => node.type.name === 'Button' && textOf(node) === '确认选择');

test('P47 five-level All-to-leaf keyboard path uses native hotkeys, collapses/returns and emits only activation intents', async t => {
  const p = probe('5'); p.render();
  const data = p.books[0].directories.course, scope = `${p.books[0].id}:course`;
  const leaf = data.leafIds.find(id => data.paths[id].length === 5), path = data.paths[leaf];
  assert.equal(path.length, 5);
  const tree = p.tree(), listeners = new Map(), globals = ['window', 'document', 'HTMLInputElement'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]);
  const port = prefix => ({ addEventListener: (key, fn) => listeners.set(`${prefix}:${key}`, fn), removeEventListener: key => listeners.delete(`${prefix}:${key}`) });
  Object.defineProperty(globalThis, 'window', { configurable: true, value: port('window') });
  Object.defineProperty(globalThis, 'document', { configurable: true, value: port('document') });
  Object.defineProperty(globalThis, 'HTMLInputElement', { configurable: true, value: class Input {} });
  // Mount the actual library listener; bridge only Node's absent DOM element ports.
  tree.registerElement(port('tree'));
  for (const id of Object.keys(data.nodes)) tree.getItemInstance(id).registerElement({ focus() {} });
  t.after(() => { tree.registerElement(null); for (const [key, descriptor] of globals) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; } });
  const press = (id, key) => {
    const e = event(key); e.code = key === ' ' ? 'Space' : key;
    let stopped = false; e.stopPropagation = () => { stopped = true; };
    p.row(id).props.onKeyDown(e);
    if (!stopped) listeners.get('tree:keydown')(e);
    listeners.get('document:keyup')(e);
  };
  p.find(node => node.props['data-directory-all'] !== undefined).props.onKeyDown(event('ArrowDown'));
  assert.equal(tree.getState().focusedItem, path[0]);
  for (let i = 0; i < 4; i++) { press(path[i], 'ArrowDown'); assert.equal(tree.getState().focusedItem, path[i+1]); }
  press(leaf, 'ArrowUp'); assert.equal(tree.getState().focusedItem, path[3]);
  press(path[3], 'ArrowLeft'); assert.equal(tree.getItemInstance(path[3]).isExpanded(), false); assert.equal(tree.getState().focusedItem, path[3]);
  press(path[3], 'ArrowLeft'); assert.equal(tree.getState().focusedItem, path[2]);
  press(path[2], 'ArrowRight'); assert.equal(tree.getState().focusedItem, path[3]);
  press(path[3], 'ArrowRight'); assert.equal(tree.getItemInstance(path[3]).isExpanded(), true);
  press(path[3], 'ArrowRight'); assert.equal(tree.getState().focusedItem, leaf);
  assert.deepEqual(p.state.requestsSelection, []); assert.deepEqual(p.state.requestsNodes, []);
  press(leaf, 'Enter'); assert.deepEqual(p.state.selections[scope], [leaf]); assert.equal(p.state.requestsSelection.length, 1);
  p.render();
  p.row(leaf).props.onKeyDown(event(' ')); p.render();
  assert.deepEqual(p.state.selections[scope], [leaf]); assert.equal(p.state.requestsSelection.length, 2);
  assert.equal(p.row(leaf).props['aria-level'], 5); assert.equal(p.row(leaf).props.current, true);
  await new Promise(setImmediate);
});

test('P47 changing a pending book subject then edition invalidates the old volume before explicit confirmation', () => {
  const p = probe('5', false, 'large'); p.render();
  const original = p.books[0], mathDraft = p.books.find(book => book.subject === '数学' && book.edition !== original.edition);
  const physics = p.books.filter(book => book.subject === '物理');
  const physicsOther = physics.find(book => book.edition !== physics[0].edition);
  p.click('切换教材', true);
  choose(p, '教材版本', mathDraft.edition); choose(p, '教材册次', mathDraft.id);
  assert.equal(confirmation(p).props.disabled, false); assert.equal(currentBook(p), original.id);
  choose(p, '教材学科', '物理');
  assert.deepEqual(group(p, '教材册次').props.value, []); assert.equal(confirmation(p).props.disabled, true);
  choose(p, '教材册次', physics[0].id); assert.equal(confirmation(p).props.disabled, false);
  choose(p, '教材版本', physicsOther.edition);
  assert.deepEqual(group(p, '教材册次').props.value, []); assert.equal(confirmation(p).props.disabled, true);
  assert.ok(group(p, '教材册次').props.children.every(node => physics.some(book => book.id === node.props.value && book.edition === physicsOther.edition)));
  choose(p, '教材册次', physicsOther.id);
  choose(p, '教材学科', '数学');
  assert.deepEqual(group(p, '教材册次').props.value, []); assert.equal(confirmation(p).props.disabled, true); assert.equal(currentBook(p), original.id);
  choose(p, '教材版本', mathDraft.edition); choose(p, '教材册次', mathDraft.id); p.click('确认选择');
  assert.equal(currentBook(p), mathDraft.id);
});
