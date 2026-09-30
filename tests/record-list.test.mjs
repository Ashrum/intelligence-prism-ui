import test from 'node:test';
import assert from 'node:assert/strict';
import { api, probe, capture, button, click } from './record-list-harness.mjs';

test('record tabs display caller counts including zero and unknown, without deriving from rows', () => {
  const out = capture({ tabs: [...api.recordTabs, { id: 'zero', label: '零记录', count: 0 }, { id: 'unknown', label: '待核验', count: null }] });
  for (const label of ['需要我处理','系统处理中','已完成','全部记录','7','3','18','28','未提供']) assert.ok(out.html.includes(label), label);
  assert.match(out.html, /零记录[\s\S]*?>0<\/span>/);
  assert.match(out.html, /role="tablist"/); assert.match(out.html, /role="tabpanel"/);
  assert.match(out.html, /aria-selected="true"/);
});

test('controlled tab emits intent but waits for props, explicit membership controls visible rows', () => {
  const intents = [];
  const props = { rows: api.recordRows, tab: 'mine', onTabChange: next => intents.push(next) };
  const out = capture(props);
  out.find('Tabs')[0].props.onValueChange('processing');
  assert.deepEqual(intents, ['processing']);
  assert.match(capture(props).html, /data-record-row="linear"/);
  assert.doesNotMatch(capture(props).html, /data-record-row="quadratic"/);
  const changed = capture({ ...props, tab: 'processing' });
  assert.match(changed.html, /data-record-row="quadratic"/);
  assert.doesNotMatch(changed.html, /data-record-row="linear"/);
});

test('uncontrolled tab defaults and changes locally; omitted membership accepts a host-projected page', () => {
  globalThis.__recordState = { values: [], index: 0 };
  try {
    const props = { rows: api.recordRows, defaultTab: 'processing' };
    let out = capture(props, probe); assert.match(out.html, /data-record-row="quadratic"/);
    out.find('Tabs')[0].props.onValueChange('completed');
    out = capture(props, probe); assert.match(out.html, /data-record-row="completed-1"/); assert.doesNotMatch(out.html, /data-record-row="quadratic"/);
  } finally { delete globalThis.__recordState; }
  assert.match(capture({ tab: 'processing', rows: [{ ...api.recordRows[0], tabIds: undefined }] }).html, /data-record-row="linear"/);
});

test('search, filter and clear controls emit typed intents and keep controlled values', () => {
  const events = [];
  const props = { search: '九年级', activeFilters: ['班级：九年级'], onSearch: q => events.push(['search',q]), onFilterChange: (id,v) => events.push(['filter',id,v]), onClearFilters: () => events.push(['clear']) };
  const out = capture(props);
  out.find('Input')[0].props.onChange({ target: { value: '方程' } });
  out.find('Select')[0].props.onValueChange('作业');
  out.find('Select')[0].props.onValueChange(null);
  button(out, '清除筛选').props.onClick();
  assert.deepEqual(events, [['search','方程'],['filter','type','作业'],['clear']]);
  assert.match(capture(props).html, /value="九年级"/);
  assert.match(out.html, /当前筛选：班级：九年级/);
});

test('row primary action emits exactly once, background shares intent, internal controls are excluded', () => {
  const events = [], out = capture({ onRowAction: (...args) => events.push(args) });
  const action = out.find('Button').find(n => n.props['aria-label'] === '继续处理：一元二次方程复习作业');
  const event = click(); action.props.onClick(event);
  assert.equal(event.stopped, true); assert.deepEqual(events, [['linear','open']]);
  const card = out.find('Card')[0];
  card.props.onClick({ target: { closest: () => null } });
  assert.equal(events.length, 2);
  for (const tag of ['button','a','input','select','textarea','[role=menuitem]','[data-record-menu]']) {
    card.props.onClick({ target: { closest: selector => { assert.ok(selector.includes(tag)); return {}; } } });
  }
  assert.equal(events.length, 2);
});

test('menu emits separate intent with propagation stopped and never advances record status', () => {
  const events = [], out = capture({ onRowMenu: (...args) => events.push(args), onRowAction: () => events.push(['unexpected']) });
  const event = click(); out.find('MenuItem')[0].props.onClick(event);
  assert.equal(event.stopped, true); assert.deepEqual(events, [['linear','details']]);
  const boundary = out.nodes.find(node => node.props['data-record-menu'] !== undefined);
  const bubbled = click(); boundary.props.onClick(bubbled); assert.equal(bubbled.stopped, true);
  assert.match(out.html, /待复核/); assert.doesNotMatch(out.html, /批阅已完成/);
});

test('disabled row and menu actions cannot emit intent; absent callbacks disable controls', () => {
  const events = [], out = capture({ rows: [{ ...api.recordRows[0], action: { id: 'open', label: '继续处理', disabledReason: '等待更新回执' }, menu: [{ id: 'history', label: '历史', disabledReason: '暂不可用' }] }], onRowAction: () => events.push('row'), onRowMenu: () => events.push('menu') });
  button(out,'继续处理').props.onClick(click()); out.find('MenuItem')[0].props.onClick(click());
  out.find('Card')[0].props.onClick({ target: { closest: () => null } });
  assert.deepEqual(events, []); assert.match(out.html, /等待更新回执/);
  const absent = capture({ onPrimary: undefined, onRowAction: undefined, onRowMenu: undefined });
  assert.equal(button(absent,'开始 AI 批阅').props.disabled, true);
  assert.equal(button(absent,'继续处理').props.disabled, true);
  assert.equal(absent.find('Input')[0].props.readOnly, true);
});

test('all status semantics remain visible as text and progress only renders supplied valid facts', () => {
  const out = capture({ tab: 'all', rows: api.recordRows });
  for (const label of ['待复核','匹配待确认','待抽样','规则待补充','更正中','系统处理中','未发布','已发布']) assert.ok(out.html.includes(label), label);
  assert.match(out.html, /aria-valuenow="60"/);
  for (const progress of [undefined, null, NaN, Infinity, -1, 101]) {
    const unknown = capture({ rows: [{ ...api.recordRows[0], progress, status: undefined }] });
    assert.match(unknown.html, /状态未知/); assert.doesNotMatch(unknown.html, /role="progressbar"/);
  }
  assert.match(capture({ rows: [{ ...api.recordRows[0], progress: 0 }] }).html, /aria-valuenow="0"/);
});

test('caller pagination emits requested page and retains current-page semantics', () => {
  const events = [], out = capture({ pagination: { page: 2, pages: [1,2,5], label: '第 2 页' }, onPageChange: page => events.push(page) });
  out.find('PaginationLink')[2].props.onClick();
  assert.deepEqual(events, [5]); assert.match(out.html, /aria-current="page"/); assert.match(out.html, /第 2 页/);
});

test('filtered, search-empty, first-empty, error and loading have distinct actions and truthful results', () => {
  const events = [];
  assert.match(capture({ activeFilters: ['类型：作业'], onClearFilters() {} }).html, /清除筛选/);
  const search = capture({ state: { kind: 'search-empty' }, search: '不存在', onSearch: query => events.push(query) });
  assert.match(search.html,/没有找到匹配的记录/); button(search,'清除搜索').props.onClick(); assert.deepEqual(events,['']);
  const empty = capture({ state: { kind: 'empty' }, onPrimary: () => events.push('primary') });
  assert.match(empty.html,/暂无记录/); button(empty,'开始 AI 批阅').props.onClick(); assert.deepEqual(events,['','primary']);
  assert.equal(empty.find('Input').length,0);
  const error = capture({ state: { kind: 'error', reason: '批阅记录加载失败' }, onRetry: () => events.push('retry') });
  assert.match(error.html,/role="alert"/); button(error,'重试').props.onClick(); assert.deepEqual(events,['','primary','retry']);
  const loading = capture({ state: { kind: 'loading' } }); assert.match(loading.html,/aria-busy="true"/); assert.match(loading.html,/data-slot="skeleton"/);
  for (const out of [search,empty,error,loading]) { assert.doesNotMatch(out.html,/data-record-row=/); assert.doesNotMatch(out.html,/data-slot="pagination"/); }
});

test('fixture totals and processing/completed summaries agree with their host facts', () => {
  assert.equal(api.recordRows.length,28);
  for (const tab of api.recordTabs) assert.equal(api.recordRows.filter(row => row.tabIds.includes(tab.id)).length,tab.count);
  assert.equal(api.recordRows.filter(row => row.status?.label === '已发布').length,12);
  assert.equal(api.recordRows.filter(row => row.status?.label === '未发布').length,6);
});
