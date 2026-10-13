import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { renderToStaticMarkup } from 'react-dom/server';
import { capture, api, click } from './record-list-harness.mjs';
import { htmlFor } from './textbook-directory-harness.mjs';
import { probe, textOf } from './directory-picker-harness.mjs';

const metadata = books => books.map(({ directories, ...book }) => book);
const header = p => p.find(node => node.type.name === 'BookHeader');
const choose = (p, label, value) => { p.find(node => node.type.name === 'ToggleGroup' && node.props['aria-label'] === label).props.onValueChange([value]); p.render(); };
function headerProbe(extra = {}) {
  const p = probe(); p.state.books = metadata(p.books); p.state.extra = { layout: 'header', ...extra }; p.render(); return p;
}

test('P51 preserves 13 pre-change default SSR outputs and treats blank marks as absent', async () => {
  const baseline = JSON.parse(await readFile(new URL('./fixtures/p51-default-before.json', import.meta.url), 'utf8'));
  const hash = html => createHash('sha256').update(html).digest('hex');
  const record = [];
  for (const state of [{kind:'ready'}, {kind:'empty'}, {kind:'loading'}, {kind:'search-empty'}, {kind:'error',reason:'加载失败'}]) {
    for (const tabs of [undefined, api.recordTabs]) record.push(hash(capture({state,tabs}).html));
  }
  assert.deepEqual(record, baseline.record);
  assert.deepEqual([{}, {layout:'embedded'}, {layout:'embedded',allOption:{},multiSelect:'dialog'}].map(p => hash(htmlFor(p))), baseline.directory);
  const rows = api.recordRows;
  const original = capture({ rows }).html;
  assert.equal(capture({ rows: rows.map(row => ({ ...row, tag: '', badges: [] })) }).html, original);
  assert.equal(capture({ rows: rows.map(row => ({ ...row, tag: '  ', badges: ['', '  '] })) }).html, original);
});

test('P51 header renders metadata without directory data or selection props and never reads directories', () => {
  const book = { id: 'one', title: '高中数学长中文教材与 x² 函数', volume: '必修第一册', subject: '数学', edition: '人教 A 版' };
  Object.defineProperty(book, 'directories', { get() { throw new Error('header must not read directories'); } });
  const html = htmlFor({ layout: 'header', textbooks: [book], selections: undefined, onSelectionsChange: undefined, onTextbookSwitch() {} });
  assert.match(html, /data-textbook-directory="header"/);
  assert.match(html, /data-slot="textbook-cover"/);
  assert.match(html, /role="group" aria-label="必修第一册 · 数学 · 人教 A 版"/);
  assert.match(html, /aria-label="切换教材"/);
  assert.doesNotMatch(html, /role="(?:tree|tablist|tab|tabpanel)"|搜索|多选|data-picker-session|目录类型/);
  assert.match(htmlFor({ layout: 'header', textbooks: [{ id: 'only', title: book.title }], selections: undefined, onSelectionsChange: undefined }), /aria-label="高中数学长中文教材与 x² 函数"/);
  assert.match(htmlFor({ layout: 'header', textbooks: [], selections: undefined, onSelectionsChange: undefined }), /暂无可用教材。/);
});

test('P51 header reuses byte-identical embedded header markup and excludes all directory components', () => {
  const embedded = probe(); embedded.render();
  const p = headerProbe();
  assert.equal(renderToStaticMarkup(header(p)), renderToStaticMarkup(header(embedded)));
  for (const name of ['KindTabs', 'PickerSession', 'Tree', 'OutlineView']) assert.equal(p.find(node => node.type.name === name), undefined);
  assert.equal(p.all(node => node.type.name === 'DialogLayout').length, 1);
  assert.equal(p.dialog('选择多个章节'), undefined);
});

test('P51 header book dialog keeps draft/cancel/close/confirm and controlled navigation contracts', () => {
  const intents = [], p = headerProbe({ onBookChange: id => intents.push(id) });
  const first = p.state.books[0], target = p.state.books[3];
  const selectTarget = () => { p.click('切换教材', true); choose(p, '教材版本', target.edition); choose(p, '教材册次', target.id); };
  p.click('切换教材', true);
  assert.equal(p.find(node => node.type.name === 'Button' && textOf(node) === '确认选择').props.disabled, true);
  assert.match(p.state.html, /尚未改变/);
  p.click('取消'); selectTarget(); p.click('取消');
  assert.equal(header(p).props.book.id, first.id); assert.deepEqual(intents, []);
  selectTarget(); p.dialog('选择教材').props.onOpenChange(false); p.render();
  assert.equal(header(p).props.book.id, first.id); assert.deepEqual(intents, []);
  selectTarget(); p.click('确认选择');
  assert.equal(header(p).props.book.id, target.id); assert.deepEqual(intents, [target.id]);
  assert.deepEqual(p.state.requestsSelection, []); assert.deepEqual(p.state.requestsNodes, []);
  p.state.extra.bookId = first.id; p.render(); selectTarget(); p.click('确认选择');
  assert.equal(header(p).props.book.id, first.id); assert.deepEqual(intents, [target.id, target.id]);
  p.state.extra.bookId = target.id; p.render(); assert.equal(header(p).props.book.id, target.id);
});

test('P51 header callback takes priority; single-book and empty-book behavior stays explicit', () => {
  const p = headerProbe(); p.state.callback = true; p.render(); p.click('切换教材', true);
  assert.equal(p.state.requests, 1); assert.equal(p.dialog('选择教材').props.open, false);
  p.state.books = [p.state.books[0]]; p.render(); p.click('切换教材', true); assert.equal(p.state.requests, 2);
  p.state.callback = false; p.render(); assert.equal(p.find(node => node.props['aria-label'] === '切换教材'), undefined);
  p.state.books = []; p.render(); assert.match(p.state.html, /暂无可用教材。/);
});

test('P51 tag and badges render in order, independent of status/type, with full accessible names', () => {
  const base = { ...api.recordRows[0], tabIds: undefined, name: '单元复习 x²', tag: '专题复习', badges: ['已收藏', '本班用过'], description: undefined };
  for (const showStatus of [true, false]) for (const showType of [true, false]) {
    const out = capture({ rows: [base], tabs: undefined, showStatus, showType });
    assert.match(out.html, /<li[^>]*aria-label="专题复习 · 单元复习 x² · 已收藏 · 本班用过"/);
    assert.match(out.html, /aria-label="继续处理：专题复习 · 单元复习 x² · 已收藏 · 本班用过"/);
    assert.match(out.html, /aria-label="更多操作：专题复习 · 单元复习 x² · 已收藏 · 本班用过"/);
    const badges = out.nodes.filter(node => node.type.name === 'Badge');
    assert.deepEqual(badges.map(node => [node.props.variant, node.props.children]), [['outline','专题复习'], ['secondary','已收藏'], ['secondary','本班用过']]);
    const markup = out.html.slice(out.html.indexOf('data-record-row='));
    assert.ok(markup.indexOf('>专题复习</span>') < markup.indexOf('<h4'));
    assert.ok(markup.indexOf('>已收藏</span>') < markup.indexOf('>本班用过</span>'));
    assert.ok(markup.indexOf('>本班用过</span>') < markup.indexOf('aria-label="继续处理：'));
    if (!showStatus) assert.doesNotMatch(markup, /data-agent-status=/);
    if (!showType) assert.doesNotMatch(markup, /text-ui-meta/);
  }
});

test('P51 tag-only and badges-only names, long marks and original action intents remain usable', () => {
  for (const marks of [{tag:'类别'}, {badges:['已收藏']}, {tag:'长中文'.repeat(30),badges:['使用记录'.repeat(30),'已收藏']}]) {
    const calls = [];
    const out = capture({ tabs: undefined, rows: [{ ...api.recordRows[0], tabIds: undefined, description: undefined, ...marks }], onRowAction: (...args) => calls.push(args) });
    const action = out.find('Button').find(node => node.props['aria-label']?.startsWith('继续处理：'));
    assert.match(action.props.className, /shrink-0/);
    for (const mark of [marks.tag, ...(marks.badges ?? [])].filter(Boolean)) assert.ok(action.props['aria-label'].includes(mark));
    for (const badge of out.nodes.filter(node => node.type.name === 'Badge')) assert.match(badge.props.className, /max-w-full whitespace-normal break-words/);
    action.props.onClick(click());
    out.find('FramePanel')[0].props.onClick({target:{closest:()=>null}});
    assert.deepEqual(calls, [['linear','open'],['linear','open']]);
  }
});

test('P51 built component pages expose header-only and marked-row examples and Agent Specs', async () => {
  const { default: worker } = await import('../dist/server/index.js');
  for (const [page, labels] of [['tree', ['textbook-header-only', 'data-textbook-directory="header"', '头部切换由宿主接管', 'layout=header renders']], ['record-list', ['record-tags', '320px 标记列表', '显示行状态', 'RecordListRow.tag?: string', '本班用过']]]) {
    const response = await worker.fetch(new Request(`http://localhost/next/components/${page}`, {headers:{accept:'text/html'}}), {ASSETS:{fetch:async()=>new Response('',{status:404})}}, {waitUntil(){},passThroughOnException(){}});
    assert.equal(response.status, 200);
    const html = await response.text(); for (const label of labels) assert.ok(html.includes(label), label);
  }
});
