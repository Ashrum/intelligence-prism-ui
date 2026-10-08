import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { directoryLeaves } from '../lib/prism-next/textbook-directory.ts';
import { probe, event, textOf } from './directory-picker-harness.mjs';
const multiTitle = '选择多个章节', bookTitle = '选择教材';
const group = (p, label) => p.find(node => node.type.name === 'ToggleGroup' && node.props['aria-label'] === label);
const choose = (p, label, value) => { group(p, label).props.onValueChange([value]); p.render() };
const key = async (p, id, key = ' ') => { assert.ok(p.row(id), id); p.row(id).props.onKeyDown(event(key)); await new Promise(setImmediate); p.render() };
const confirm = p => { p.find(node => node.type.name === 'Button' && textOf(node).startsWith('确认（')).props.onClick(); p.render() };
const items = p => p.all(node => node.props['data-directory-selected']);
const modal = p => p.all((_node, path) => path.includes('/dialog'));
const bookConfirm = p => p.find(node => node.type.name === 'Button' && textOf(node) === '确认选择');

test('P42 sidebar search stays inline and named; both modals have no search or standing instructions', () => {
  const p = probe(); p.render();
  for (const kind of ['course', 'knowledge']) {
    p.tab(kind);
    const input = p.find(node => node.type.name === 'InputGroupInput');
    assert.equal(input.props['aria-label'], `搜索当前${kind === 'course' ? '课程目录' : '知识点目录'}`);
    p.click('多选', true);
    const dialog = p.dialog(kind === 'course' ? multiTitle : '选择多个知识点');
    assert.equal(dialog.props.description, undefined);
    assert.ok(dialog.props.initialFocus); assert.ok(dialog.props.finalFocus);
    assert.equal(modal(p).filter(node => ['InputGroupInput', 'KindTabs', 'Tabs', 'BookHeader', 'BookCover'].includes(node.type.name)).length, 0);
    for (const tree of p.all(node => node.type.name === 'Tree')) for (const id of tree.props['aria-describedby'].split(' ')) {
      assert.equal(p.find(node => node.type === 'p' && node.props.id === id).props.className, 'sr-only');
    }
    assert.match(textOf(dialog.props.footerStart), /^已选 0 项/);
    p.click('取消');
  }
  p.click('切换教材', true);
  assert.equal(p.dialog(bookTitle).props.description, '当前：数学 · 人教 A 版（2019） · 必修第一册');
  assert.equal(modal(p).filter(node => node.type.name === 'InputGroupInput').length, 0);
  assert.equal(textOf(p.dialog(bookTitle).props.footerStart), '尚未改变');
});

test('P42 book draft: unchanged disabled, cancel/Esc discard, explicit confirmation and callback priority', () => {
  const p = probe(); p.render(); const first = p.books[0], target = p.books[3];
  const currentBook = () => p.find(node => node.type.name === 'BookHeader').props.book.id;
  p.click('切换教材', true);
  assert.equal(bookConfirm(p).props.disabled, true); assert.ok(bookConfirm(p).props['aria-describedby']);
  assert.deepEqual(group(p, '教材版本').props.children.map(node => node.props.value), ['人教 A 版（2019）', '人教 B 版（2019）', '北师大版']);
  choose(p, '教材版本', target.edition); assert.match(p.state.html, /请选择册次/);
  choose(p, '教材册次', target.id); assert.equal(bookConfirm(p).props.disabled, false);
  assert.equal(textOf(p.dialog(bookTitle).props.footerStart), `确认后切换到 数学 · ${target.edition} · ${target.volume}`);
  p.click('取消'); assert.equal(currentBook(), first.id);
  p.click('切换教材', true); choose(p, '教材版本', target.edition); choose(p, '教材册次', target.id);
  p.dialog(bookTitle).props.onOpenChange(false, { reason: 'escape-key' }); p.render(); assert.equal(currentBook(), first.id);
  p.click('切换教材', true); assert.deepEqual(group(p, '教材册次').props.value, [first.id]);
  choose(p, '教材版本', target.edition); choose(p, '教材册次', target.id); p.click('确认选择'); assert.equal(currentBook(), target.id);
  p.state.callback = true; p.render(); p.click('切换教材', true); assert.equal(p.state.requests, 1); assert.equal(p.dialog(bookTitle).props.open, false);
  p.state.books = [first]; p.render(); p.click('切换教材', true); assert.equal(p.state.requests, 2);
  p.state.callback = false; p.render(); assert.equal(p.find(node => node.props['aria-label'] === '切换教材'), undefined);
});

test('P42 missing metadata remains optional; single subject has no subject segment', () => {
  const p = probe(); p.state.books = p.books.slice(0, 2).map(({ edition, volume, ...book }) => book); p.render(); p.click('切换教材', true);
  assert.equal(group(p, '教材学科'), undefined);
  assert.equal(group(p, '教材版本').props.children[0].props.value, '未提供版本');
  const cards = group(p, '教材册次').props.children;
  assert.match(cards[0].props['aria-label'], /未提供版本.*高中数学.*必修第一册.*当前/);
  assert.ok(modal(p).some(node => node.type.name === 'BookCover' && node.props.large));
});

test('P42 large catalog uses teaching/recent host order, separator, compact editions and linked book cards', () => {
  const p = probe('5', false, 'large'); p.render();
  p.state.subjects = [...p.state.subjects].reverse();
  const physics = p.state.subjects.find(item => item.name === '物理');
  physics.editions = [{ title: '沪科版' }, { title: '人教版', recent: true }, { title: '教科版' }];
  p.click('切换教材', true);
  const subjectOptions = group(p, '教材学科').props.children;
  assert.deepEqual(subjectOptions.map(node => node.key), ['物理', '数学', '英语', '语文']);
  assert.equal(modal(p).filter(node => node.type.name === 'Separator').length, 1);
  assert.equal(group(p, '教材版本').props.children.length, 12);
  assert.equal(group(p, '教材版本').props.size, 'sm');
  assert.match(textOf(group(p, '教材学科')), /我的任教/);
  const currentCard = group(p, '教材册次').props.children[0];
  assert.match(currentCard.props['aria-label'], /数学.*人教 A 版.*必修第一册.*高一 · 上学期.*当前/);
  assert.ok(modal(p).some(node => node.type.name === 'BookCover' && node.props.current));
  choose(p, '教材版本', '北师大版'); assert.equal(group(p, '教材册次').props.children.length, 6);
  choose(p, '教材册次', group(p, '教材册次').props.children[0].props.value);
  choose(p, '教材学科', '物理');
  assert.deepEqual(group(p, '教材版本').props.value, ['人教版']);
  assert.deepEqual(group(p, '教材版本').props.children.map(node => node.props.value), ['人教版', '沪科版', '教科版']);
  assert.equal(group(p, '教材版本').props.children[0].props.children[1].props['aria-label'], '最近使用');
  assert.deepEqual(group(p, '教材册次').props.value, []); assert.equal(bookConfirm(p).props.disabled, true);
  const target = group(p, '教材册次').props.children[0].props.value;
  choose(p, '教材学科', '语文'); assert.deepEqual(group(p, '教材版本').props.value, ['统编版']);
  choose(p, '教材学科', '物理'); choose(p, '教材册次', target); p.click('确认选择');
  assert.equal(p.find(node => node.type.name === 'BookHeader').props.book.id, target);
});

test('P42 volume scroll is enabled only above twelve books; old dialog column layout is removed', async () => {
  const p = probe(); const book = p.books[0];
  p.state.books = Array.from({ length: 12 }, (_, index) => ({ ...book, id: `volume-${index}` })); p.render(); p.click('切换教材', true);
  assert.equal(group(p, '教材册次').props['data-scroll'], false);
  p.state.books.push({ ...book, id: 'volume-12' }); p.render(); assert.equal(group(p, '教材册次').props['data-scroll'], true);
  const css = await readFile(new URL('../components/prism-next/textbook-directory.css', import.meta.url), 'utf8');
  assert.match(css, /max-height: 85dvh/); assert.match(css, /max-height: 80dvh/); assert.match(css, /3fr\) minmax\(0, 2fr/);
  assert.match(css, /dialog-layout-body:has\(\.directory-picker-columns\).*overflow: hidden/);
  assert.doesNotMatch(css, /textbook-picker-columns|textbook-picker-list/);
});

test('P42 partial chapters expose selected leaves, groups compress whole chapters and remove them', async () => {
  const p = probe(), data = p.books[0].directories.course, scope = `${p.books[0].id}:course`;
  const [first, second] = data.nodes[data.rootId].children, leaf = data.leafIds[0];
  p.render(); p.click('多选', true);
  assert.equal(items(p).length, 0); assert.match(p.state.html, /在左侧勾选后，这里列出已选内容/);
  await key(p, leaf);
  assert.equal(p.row(first).props['aria-checked'], 'mixed');
  assert.match(p.row(first).props['aria-label'], new RegExp(`已选 1/${directoryLeaves(data, first).length}`));
  assert.equal(p.state.selections[scope], undefined);
  await key(p, first, 'Enter'); assert.equal(p.row(first).props['aria-checked'], true);
  assert.equal(items(p).length, 1); assert.equal(items(p)[0].props['data-directory-selected'], first); assert.match(textOf(items(p)[0]), /整章/);
  await key(p, second); assert.equal(items(p).length, 2);
  assert.equal(modal(p).filter(node => node.props['data-directory-selected-group']).length, 2);
  p.click(`移除${data.nodes[first].title}`, true); assert.equal(items(p).length, 1); assert.equal(p.row(first).props['aria-checked'], false);
  confirm(p); assert.deepEqual(p.state.selections[scope], directoryLeaves(data, second));
  assert.equal(p.all(node => node.type.name === 'Checkbox').length, 0);
  await key(p, first, 'Enter'); assert.deepEqual(p.state.selections[scope], directoryLeaves(data, first));
  await key(p, first); assert.deepEqual(p.state.selections[scope], directoryLeaves(data, first));
});

test('P42 select all/clear/cancel/Esc only affect the opening scope; other scopes and identities survive', async () => {
  const p = probe(), book = p.books[0], course = book.directories.course, knowledge = book.directories.knowledge;
  const chapter = course.nodes[course.rootId].children[0], courseKey = `${book.id}:course`, knowledgeKey = `${book.id}:knowledge`, otherKey = `${p.books[1].id}:course`;
  const others = { [knowledgeKey]: [knowledge.leafIds[0]], [otherKey]: [p.books[1].directories.course.leafIds[0]], 'unrelated:knowledge': ['keep'] };
  p.state.selections = { ...others, [courseKey]: directoryLeaves(course, chapter) };
  p.state.currentNodes = { [courseKey]: chapter, [knowledgeKey]: knowledge.leafIds[0], [otherKey]: p.books[1].directories.course.leafIds[0] };
  p.render(); p.search('x ≠ 1'); p.click('多选', true);
  assert.equal(items(p).length, 1);
  assert.equal(modal(p).filter(node => ['Tabs', 'InputGroupInput'].includes(node.type.name)).length, 0);
  assert.doesNotMatch(modal(p).filter(node => typeof node.type === 'string').map(textOf).join(''), /人教|必修第|数学/);
  p.click('全选'); assert.equal(items(p).length, course.nodes[course.rootId].children.length);
  p.click('取消'); assert.deepEqual(p.state.selections[courseKey], directoryLeaves(course, chapter));
  p.click('多选', true); p.click('清空'); p.dialog(multiTitle).props.onOpenChange(false, { reason: 'escape-key' }); p.render();
  assert.deepEqual(p.state.selections[courseKey], directoryLeaves(course, chapter));
  p.click('多选', true); confirm(p); assert.equal(p.state.currentNodes[courseKey], chapter);
  p.click('多选', true); p.click('清空'); confirm(p);
  assert.deepEqual(p.state.selections, { ...others, [courseKey]: [] }); assert.equal(p.state.currentNodes[courseKey], undefined);
  assert.equal(p.state.currentNodes[knowledgeKey], knowledge.leafIds[0]);
  assert.equal(p.state.currentNodes[otherKey], p.books[1].directories.course.leafIds[0]);
  assert.equal(p.find(node => node.type.name === 'InputGroupInput').props.value, 'x ≠ 1');
  p.tab('knowledge'); p.click('多选', true); assert.equal(p.dialog('选择多个知识点').props.open, true);
  p.click('全选'); confirm(p); assert.deepEqual(p.state.selections[knowledgeKey], knowledge.leafIds);
  assert.deepEqual(p.state.selections[courseKey], []); assert.equal(p.state.kind, 'knowledge');
});

test('P42 book switch preserves other-book selections and never lists them in the current multi dialog', () => {
  const p = probe(), first = p.books[0], second = p.books[1], scope = `${first.id}:course`;
  p.state.selections = { [scope]: [first.directories.course.leafIds[0]] }; p.render();
  p.click('切换教材', true); choose(p, '教材册次', second.id); p.click('确认选择');
  p.click('多选', true); assert.equal(items(p).length, 0); p.click('全选'); confirm(p);
  assert.deepEqual(p.state.selections[scope], [first.directories.course.leafIds[0]]);
  assert.deepEqual(p.state.selections[`${second.id}:course`], second.directories.course.leafIds);
});

test('P42 summary uses only complete host entry counts, preserves zero and omits incomplete totals', async () => {
  const p = probe(), data = p.books[0].directories.course, [chapter] = data.nodes[data.rootId].children;
  p.render(); p.click('多选', true); await key(p, chapter);
  assert.equal(textOf(p.dialog(multiTitle).props.footerStart), `已选 1 项 · 共 ${p.counts[chapter]} 题`);
  assert.equal(p.counts[chapter], 0);
  p.click('清空'); const missing = data.leafIds.find(id => p.counts[id] === undefined);
  await key(p, missing); assert.equal(textOf(p.dialog(multiTitle).props.footerStart), '已选 1 项');
  p.state.showCounts = false; p.render(); assert.equal(textOf(p.dialog(multiTitle).props.footerStart), '已选 1 项');
});

test('P42 checkbox handler selects complete subtree; external changes in other scopes are not overwritten', async () => {
  const p = probe(), book = p.books[0], data = book.directories.course, chapter = data.nodes[data.rootId].children[0];
  p.render(); p.click('多选', true);
  const checkbox = p.row(chapter).props.children.props.children.find(node => node?.type?.name === 'Checkbox');
  checkbox.props.onCheckedChange(true); await new Promise(setImmediate); p.render();
  assert.equal(items(p).length, 1);
  p.state.selections['external:new'] = ['live']; p.render(); confirm(p);
  assert.deepEqual(p.state.selections[`${book.id}:course`], directoryLeaves(data, chapter));
  assert.deepEqual(p.state.selections['external:new'], ['live']);
});

test('P41 public all labels/counts and controlled identity wait for host feedback; stale identities are ignored', () => {
  const p = probe(); const data = p.books[0].directories.course, scope = `${p.books[0].id}:course`, id = data.paths[data.leafIds[0]].at(-2);
  p.state.extra = {allOption:{label:'整册',ariaLabel:'查看整册题目'}}; p.state.apply = false; p.render();
  const before = structuredClone(p.state.selections);
  p.row(id).props.onKeyDown(event('Enter')); p.render();
  assert.deepEqual(p.state.selections, before); assert.equal(p.row(id).props.current, false);
  assert.equal(p.state.requestsSelection.length, 1); assert.equal(p.state.requestsNodes.length, 1);
  p.state.selections = p.state.requestsSelection[0](before); p.state.currentNodes = p.state.requestsNodes[0]({}); p.render();
  assert.equal(p.row(id).props.current, true);
  const all = p.find(node => node.props['data-directory-all'] !== undefined);
  assert.equal(all.props['aria-label'], '查看整册题目'); assert.match(textOf(all), /整册/);
  p.state.currentNodes = {[scope]:'removed'}; assert.doesNotThrow(()=>p.render());
  p.state.selections = {[scope]:['removed']}; p.render(); assert.equal(p.find(node => node.props['data-directory-all'] !== undefined).props['aria-pressed'], true);
  assert.equal(p.state.requestsSelection.length, 1, 'no automatic default/cleanup event');
});

test('P41 embedded locate and inline toggle/always coexist with all option without losing prior behavior', () => {
  const p = probe(); p.state.extra = {titleAction:'locate'}; p.render();
  const data=p.books[0].directories.course, leaf=data.leafIds[0], scope=`${p.books[0].id}:course`;
  p.row(leaf).props.onKeyDown(event('Enter')); p.render(); assert.deepEqual(p.state.selections, {}); assert.equal(p.row(leaf).props['aria-current'], 'location');
  p.state.extra = {multiSelect:'always'}; p.render();
  assert.ok(p.find(node=>node.type.name==='Checkbox')); assert.ok(p.find(node=>node.props['data-directory-all']!==undefined));
  p.row(leaf).props.onKeyDown(event('Enter')); p.render(); p.row(leaf).props.onKeyDown(event('Enter')); p.render();
  assert.deepEqual(p.state.selections[scope],[leaf]);
  p.row(leaf).props.onKeyDown(event(' ')); p.render(); assert.deepEqual(p.state.selections[scope],[]);
  p.state.extra = {multiSelect:'toggle'}; p.render(); assert.equal(p.find(node=>node.type.name==='Checkbox'),undefined);
  p.click('多选'); assert.ok(p.find(node=>node.type.name==='Checkbox'));
  p.row(leaf).props.onKeyDown(event('Enter')); p.render(); assert.deepEqual(p.state.selections[scope],[leaf]);
  p.click('多选'); assert.equal(p.find(node=>node.type.name==='Checkbox'),undefined); assert.deepEqual(p.state.selections[scope],[leaf]);
});

test('P41 controlled book selection emits id without assuming host applied it', () => {
  const p=probe(); const first=p.books[0], second=p.books[1]; const requests=[];
  p.state.extra={bookId:first.id,onBookChange:id=>requests.push(id)}; p.render(); p.click('切换教材',true);
  choose(p, '教材册次', second.id); p.click('确认选择');
  assert.deepEqual(requests,[second.id]); assert.equal(p.find(node=>node.type.name==='BookHeader').props.book.id,first.id);
  p.state.extra.bookId=second.id; p.render(); assert.equal(p.find(node=>node.type.name==='BookHeader').props.book.id,second.id);
});
