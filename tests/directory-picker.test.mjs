import test from 'node:test';
import assert from 'node:assert/strict';
import { directoryLeaves } from '../lib/prism-next/textbook-directory.ts';
import { probe, event, textOf } from './directory-picker-harness.mjs';
const multiTitle = '选择目录范围', bookTitle = '选择教材';
const choose = (p, label, value) => { p.find(node => ['DialogOptionGrid', 'DialogChoiceList'].includes(node.type.name) && node.props.label === label).props.onValueChange(value); p.render() };
const key = async (p, id, key = ' ') => { assert.ok(p.row(id), id); p.row(id).props.onKeyDown(event(key)); await new Promise(setImmediate); p.render() };
const confirm = p => { p.find(node => node.type.name === 'Button' && textOf(node).startsWith('确认选择（')).props.onClick(); p.render() };
const items = p => p.all(node => node.props['data-directory-selected']);

test('exploration searches stay label-free with accessible names, inline action and linked hidden help', () => {
  const p = probe(); p.render();
  function checkSearch(kind, multiple) {
    const name = `搜索当前${kind === 'course' ? '课程目录' : '知识点目录'}`;
    const input = p.find(node => node.type.name === 'InputGroupInput');
    assert.equal(input.props['aria-label'], name);
    assert.doesNotMatch(p.state.html, /<label\b/);
    const row = p.find(node => node.type === 'div' && Array.isArray(node.props.children)
      && node.props.children[0]?.type?.name === 'InputGroup');
    assert.match(row.props.className, /\bflex\b/);
    assert.doesNotMatch(row.props.className, /flex-col|flex-wrap/);
    assert.equal(row.props.children[1]?.props?.['aria-label'], multiple ? undefined : '多选');
    for (const tree of p.all(node => node.type.name === 'Tree')) {
      const ids = tree.props['aria-describedby'].split(' ');
      assert.equal(ids.length, 2);
      for (const id of ids) {
        const help = p.find(node => node.type === 'p' && node.props.id === id);
        assert.ok(help, `linked help ${id}`);
        assert.equal(help.props.className, 'sr-only');
      }
    }
  }
  checkSearch('course', false); p.tab('knowledge'); checkSearch('knowledge', false);
  p.click('多选', true); checkSearch('knowledge', true);
  p.tab('course'); checkSearch('course', true);
  assert.equal(p.dialog(multiTitle).props.description, '可跨课程与知识点选择，确认后提交所选范围。');
  assert.equal(textOf(p.dialog(multiTitle).props.footerStart), '确认后提交所选目录范围');
  p.click('取消'); p.click('切换教材', true);
  assert.equal(p.dialog(bookTitle).props.description, '选择学科、版本与册次，确认后切换当前教材。');
  assert.match(textOf(p.dialog(bookTitle).props.footerStart), /确认后切换当前教材，保留各目录选择。/);
});

test('A: version/volume drafts, unchanged reason, cancel/Esc discard, apply and callback priority', () => {
  const p = probe(); p.render();
  const first = p.books[0], target = p.books[3];
  const currentBook = () => p.find(node => node.type.name === 'BookHeader').props.book.id;
  p.click('切换教材', true);
  assert.equal(p.dialog(bookTitle).props.open, true);
  let confirmButton = p.find(node => node.type.name === 'Button' && textOf(node) === '确认选择');
  assert.equal(confirmButton.props.disabled, true); assert.ok(confirmButton.props['aria-describedby']);
  assert.match(p.state.html, /尚未改变教材选择/);
  assert.ok(p.dialog(bookTitle).props.initialFocus); assert.ok(p.dialog(bookTitle).props.finalFocus);
  assert.deepEqual(p.all(node => node.type.name === 'DialogChoice').slice(0, 3).map(node => node.props.title), ['人教 A 版（2019）', '人教 B 版（2019）', '北师大版']);
  choose(p, '教材版本', target.edition); assert.match(p.state.html, /请选择册次/);
  choose(p, '教材册次', target.id);
  assert.equal(p.find(node => node.type.name === 'Button' && textOf(node) === '确认选择').props.disabled, false);
  p.click('取消'); assert.equal(currentBook(), first.id);
  p.click('切换教材', true); choose(p, '教材版本', target.edition); choose(p, '教材册次', target.id);
  p.dialog(bookTitle).props.onOpenChange(false, { reason: 'escape-key' }); p.render(); assert.equal(currentBook(), first.id);
  p.click('切换教材', true); assert.equal(p.find(node => node.type.name === 'DialogOptionGrid' && node.props.label === '教材册次').props.value, first.id);
  choose(p, '教材版本', target.edition); choose(p, '教材册次', target.id); p.click('确认选择'); assert.equal(currentBook(), target.id);
  p.state.callback = true; p.render(); p.click('切换教材', true); assert.equal(p.state.requests, 1); assert.equal(p.dialog(bookTitle).props.open, false);
  p.state.books = [first]; p.render(); p.click('切换教材', true); assert.equal(p.state.requests, 2);
  p.state.callback = false; p.render(); assert.equal(p.find(node => node.props['aria-label'] === '切换教材'), undefined);
});

test('missing optional edition/volume fields use honest fallbacks without new required metadata', () => {
  const p = probe(); p.state.books = p.books.slice(0, 2).map(({ edition, volume, ...book }) => book); p.render(); p.click('切换教材', true);
  assert.ok(p.all(node => node.type.name === 'DialogChoice').some(node => node.props.title === '未提供版本'));
  assert.ok(p.all(node => node.type.name === 'DialogOptionGridItem').some(node => node.props.title === p.books[0].title));
});

test('A dialog handlers preserve leaf selections, compressed summaries, marks and single replacement', async () => {

    const p = probe(), data = p.books[0].directories.course, scope = `${p.books[0].id}:course`;
    const [first, second] = data.nodes[data.rootId].children, leaf = data.leafIds[0];
    p.state.selections = { 'unrelated:course': ['keep'] }; p.render();
    assert.equal(p.all(node => node.type.name === 'Checkbox').length, 0);
    p.click('多选', true); assert.equal(p.dialog(multiTitle).props.open, true);
    assert.ok(p.find(node => node.props['data-directory-outline'] !== undefined));
    assert.ok(p.dialog(multiTitle).props.initialFocus); assert.ok(p.dialog(multiTitle).props.finalFocus);
    assert.match(p.state.html, /aria-label="可选目录"/); assert.match(p.state.html, /aria-label="已选范围"/);
    await key(p, leaf); assert.equal(p.row(first).props['aria-checked'], 'mixed'); assert.equal(p.state.selections[scope], undefined);
    await key(p, first, 'Enter'); assert.equal(p.row(first).props['aria-checked'], true);
    assert.equal(items(p).length, 1); assert.equal(items(p)[0].props['data-directory-selected'], first);
    await key(p, second); assert.equal(items(p).length, 2);
    confirm(p);
    assert.equal(p.dialog(multiTitle).props.open, false); assert.equal(p.all(node => node.type.name === 'Checkbox').length, 0);
    assert.match(p.state.html, /已选 2 项/); assert.equal(p.row(first).props['aria-selected'], true); assert.equal(p.row(second).props['aria-selected'], true);
    // Clicking a visible title replaces multi-selection and stays selected.
    await key(p, first, 'Enter'); assert.deepEqual(p.state.selections[scope], directoryLeaves(data, first));
    await key(p, first); assert.deepEqual(p.state.selections[scope], directoryLeaves(data, first));
    p.find(node => node.props['data-directory-all'] !== undefined).props.onClick(); p.render();
    p.click('多选', true); await key(p, leaf); confirm(p);
    assert.equal(p.row(first).props['aria-selected'], false); assert.match(p.row(first).props['aria-label'], /包含已选/);
    assert.ok(p.find(node => node.props['data-directory-contains-selected'] !== undefined));
    assert.equal(p.row(leaf).props['aria-selected'], true);
    p.click('多选', true); await key(p, data.leafIds[2]); confirm(p);
    p.click('清空当前目录的已选范围', true); assert.deepEqual(p.state.selections[scope], []); assert.deepEqual(p.state.selections['unrelated:course'], ['keep']);

});

test('multi draft removes whole compressed entries, preserves kinds/search, clears, cancels, and confirms empty', async () => {
  const p = probe(), book = p.books[0], course = book.directories.course, knowledge = book.directories.knowledge;
  const chapter = course.nodes[course.rootId].children[0], courseKey = `${book.id}:course`, knowledgeKey = `${book.id}:knowledge`;
  p.state.selections = { [courseKey]: directoryLeaves(course, chapter), 'unrelated:knowledge': ['keep'] }; p.render();
  p.click('多选', true); assert.equal(items(p).length, 1);
  p.click(`移除${course.nodes[chapter].title}`, true); assert.equal(items(p).length, 0);
  p.search('x ≠ 1'); await key(p, chapter);
  assert.deepEqual(p.find(node => node.type.name === 'PickerSession' && node.props.multiple).props.checkedIds.sort(), directoryLeaves(course, chapter).sort());
  p.tab('knowledge'); await key(p, knowledge.leafIds[0]); assert.equal(items(p).length, 2);
  p.tab('course'); assert.equal(p.find(node => node.type.name === 'InputGroupInput').props.value, 'x ≠ 1');
  p.click('清空已选'); assert.equal(items(p).length, 0);
  p.click('取消'); assert.deepEqual(p.state.selections[courseKey], directoryLeaves(course, chapter)); assert.equal(p.state.kind, 'course');
  p.click('多选', true); p.tab('knowledge'); await key(p, knowledge.leafIds[0]);
  p.dialog(multiTitle).props.onOpenChange(false, { reason: 'escape-key' }); p.render();
  assert.equal(p.state.selections[knowledgeKey], undefined); assert.equal(p.state.kind, 'course');
  p.click('多选', true); assert.equal(items(p).length, 1); p.tab('knowledge'); await key(p, knowledge.leafIds[0]); confirm(p);
  assert.equal(p.state.kind, 'knowledge'); assert.deepEqual(p.state.selections[knowledgeKey], [knowledge.leafIds[0]]);
  assert.deepEqual(p.state.selections[courseKey], directoryLeaves(course, chapter));
  p.click('多选', true); p.click('清空已选'); confirm(p);
  assert.deepEqual(p.state.selections[courseKey], []); assert.deepEqual(p.state.selections[knowledgeKey], []);
  assert.deepEqual(p.state.selections['unrelated:knowledge'], ['keep']);
});

test('textbook switching retains per-book selections; dialog lists and removes other-book entries with source', () => {
  const p = probe(), first = p.books[0], second = p.books[1], leaf = first.directories.course.leafIds[0];
  p.state.selections = { [`${first.id}:course`]: [leaf] }; p.render();
  p.click('切换教材', true); choose(p, '教材册次', second.id); p.click('确认选择');
  p.click('多选', true); assert.equal(items(p).length, 1); assert.match(textOf(items(p)[0]), /必修第一册.*人教 A 版/);
  p.click(`移除${first.directories.course.nodes[leaf].title}`, true); confirm(p);
  assert.deepEqual(p.state.selections[`${first.id}:course`], []);
});

test('checkbox click uses the same full-tree propagation and hidden search selections survive', async () => {
  const p = probe(), book = p.books[0], data = book.directories.course, chapter = data.nodes[data.rootId].children[0];
  p.render(); p.click('多选', true); p.search('x ≠ 1');
  const checkbox = p.row(chapter).props.children.props.children.find(node => node?.type?.name === "Checkbox");
  checkbox.props.onCheckedChange(true); await new Promise(setImmediate); p.render();
  assert.equal(items(p).length, 1); assert.equal(items(p)[0].props['data-directory-selected'], chapter);
  p.search('没有任何匹配'); assert.match(p.state.html, /没有匹配的目录项/); assert.equal(items(p).length, 1);
  confirm(p); assert.deepEqual(p.state.selections[`${book.id}:course`], directoryLeaves(data, chapter));
});

test('multi clear returns only the active directory to all; unchanged modal confirmation retains exact current node', async () => {
  const p = probe(), first = p.books[0], data = first.directories.course, scope = `${first.id}:course`;
  const leaf = data.leafIds[0], parent = data.paths[leaf].at(-2), knowledge = `${first.id}:knowledge`, other = `${p.books[1].id}:course`;
  p.state.selections = { [knowledge]: [first.directories.knowledge.leafIds[0]], [other]: [p.books[1].directories.course.leafIds[0]] }; p.render();
  await key(p, parent); p.click('多选', true); confirm(p);
  assert.equal(p.row(parent).props.current, true);
  p.click('多选', true); await key(p, data.leafIds[2]); confirm(p);
  assert.equal(p.find(node => node.props['data-directory-all'] !== undefined).props['aria-pressed'], false);
  assert.match(p.state.html, /已选 2 项/);
  p.click('清空当前目录的已选范围', true);
  assert.deepEqual(p.state.selections[scope], []);
  assert.equal(p.find(node => node.props['data-directory-all'] !== undefined).props['aria-pressed'], true);
  assert.equal(p.state.selections[knowledge].length, 1); assert.equal(p.state.selections[other].length, 1);
  assert.ok(p.rows().every(row => !row.props.current)); assert.doesNotMatch(p.state.html, /已选：|已选 \d+ 项/);
});


test('P40 large catalog subject/edition/volume linkage, host recency, search and cancellation', () => {
  const p = probe('5', false, 'large'); p.render();
  assert.equal(new Set(p.books.map(book => book.subject)).size, 4);
  const maths = p.books.filter(book => book.subject === '数学');
  assert.equal(new Set(maths.map(book => book.edition)).size, 12);
  for (const subject of p.state.subjects) for (const edition of subject.editions) {
    const count = p.books.filter(book => book.subject === subject.name && book.edition === edition.title).length;
    assert.ok(count >= 4 && count <= 8);
  }
  // Input order differs from metadata order: the host supplies the ranking.
  p.state.subjects = [...p.state.subjects].reverse();
  const physics = p.state.subjects.find(item => item.name === '物理');
  physics.editions = [{ title: '沪科版' }, { title: '人教版', recent: true }, { title: '教科版' }];
  p.click('切换教材', true);
  assert.equal(p.all(node => node.type.name === 'BookHeader').length, 1, 'book art remains only in sidebar');
  const choices = label => p.find(node => node.type.name === 'DialogChoiceList' && node.props.label === label);
  const subjectItems = () => choices('教材学科').props.children;
  assert.deepEqual(subjectItems().map(node => node.props.title), ['物理', '数学', '英语', '语文']);
  assert.equal(subjectItems().filter(node => node.props.description === '我的任教学科').length, 2);
  const search = (label, value) => { p.find(node => node.type.name === 'InputGroupInput' && node.props['aria-label'] === label).props.onChange({ target: { value } }); p.render() };
  search('搜索学科', '物'); assert.deepEqual(subjectItems().map(node => node.props.title), ['物理']);
  search('搜索学科', '');
  search('搜索版本', '北师大'); assert.deepEqual(choices('教材版本').props.children.map(node => node.props.title), ['北师大版']);
  choose(p, '教材版本', '北师大版');
  const volumes = () => p.find(node => node.type.name === 'DialogOptionGrid' && node.props.label === '教材册次');
  assert.equal(volumes().props.children.length, 6);
  choose(p, '教材册次', volumes().props.children[0].props.value);
  choose(p, '教材学科', '物理');
  assert.equal(choices('教材版本').props.value, '人教版');
  assert.deepEqual(choices('教材版本').props.children.map(node => node.props.title), ['人教版', '沪科版', '教科版']);
  assert.equal(choices('教材版本').props.children[0].props.description, '最近使用');
  assert.equal(volumes().props.value, null);
  assert.equal(p.find(node => node.type.name === 'Button' && textOf(node) === '确认选择').props.disabled, true);
  const target = volumes().props.children[0].props.value;
  choose(p, '教材册次', target); p.click('取消');
  assert.equal(p.find(node => node.type.name === 'BookHeader').props.book.id, p.books[0].id);
  p.click('切换教材', true);
  assert.equal(volumes().props.children[0].props.status.label, '当前');
  search('搜索版本', '不存在'); assert.match(p.state.html, /没有匹配的版本/);
  choose(p, '教材学科', '语文'); assert.equal(choices('教材版本').props.value, '统编版');
  choose(p, '教材学科', '物理'); choose(p, '教材册次', target); p.click('确认选择');
  assert.equal(p.find(node => node.type.name === 'BookHeader').props.book.id, target);
});

test('P40 small catalog hides subject section; multi modal removes book header and has independent scroll layout', async () => {
  const p = probe(); p.render(); p.click('切换教材', true);
  assert.equal(p.find(node => node.type.name === 'DialogChoiceList' && node.props.label === '教材学科'), undefined);
  assert.equal(p.find(node => node.props['aria-label'] === '搜索学科'), undefined);
  assert.equal(p.find(node => node.type.name === 'DialogChoiceList' && node.props.label === '教材版本').props.children.length, 3);
  p.click('取消'); p.click('多选', true);
  assert.equal(p.all(node => node.type.name === 'BookHeader').length, 1);
  assert.equal(p.dialog(multiTitle).props.size, 'xl');
  assert.ok(p.find(node => node.type === 'section' && node.props.className?.includes('directory-picker-tree')));
  assert.ok(p.find(node => node.type === 'section' && node.props.className?.includes('directory-picker-selected')));
  const { readFile } = await import('node:fs/promises');
  const css = await readFile(new URL('../components/prism-next/textbook-directory.css', import.meta.url), 'utf8');
  assert.match(css, /max-height: 80dvh/); assert.match(css, /3fr\) minmax\(0, 2fr/);
  assert.match(css, /dialog-layout-body:has\(\.directory-picker-columns\).*overflow: hidden/);
  assert.doesNotMatch(css, /data-directory-scroll.*overflow: visible/);
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
  p.find(node=>node.type.name==='DialogOptionGrid').props.onValueChange(second.id); p.render(); p.click('确认选择');
  assert.deepEqual(requests,[second.id]); assert.equal(p.find(node=>node.type.name==='BookHeader').props.book.id,first.id);
  p.state.extra.bookId=second.id; p.render(); assert.equal(p.find(node=>node.type.name==='BookHeader').props.book.id,second.id);
});
