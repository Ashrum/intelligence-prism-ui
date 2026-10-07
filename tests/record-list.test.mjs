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
  const card = out.find('FramePanel')[0];
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
  out.find('FramePanel')[0].props.onClick({ target: { closest: () => null } });
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

test('omitted or empty tabs render the complete host page without any tab structure', () => {
  for (const tabs of [undefined, []]) {
    const rows = [...api.recordRows, { ...api.recordRows[0], id: 'unclassified', tabIds: undefined }, { ...api.recordRows[0], id: 'no-membership', tabIds: [] }];
    const out = capture({ tabs, rows, defaultTab: 'processing' });
    assert.equal(out.find('Tabs').length, 0);
    assert.doesNotMatch(out.html, /role="(?:tablist|tab|tabpanel)"/);
    assert.equal((out.html.match(/data-record-row=/g) || []).length, rows.length);
    assert.match(out.html, /记录搜索与筛选/);
    assert.match(out.html, /data-slot="pagination"/);
  }
});

test('external controlled tab filters membership without an internal tab UI', () => {
  for (const tabs of [undefined, []]) {
    const rows = [...api.recordRows, { ...api.recordRows[0], id: 'projected', tabIds: undefined }];
    const out = capture({ tabs, rows, tab: 'processing' });
    assert.equal(out.find('Tabs').length, 0);
    assert.equal(out.find('FramePanel').length, 4);
    assert.match(out.html, /data-record-row="quadratic"/);
    assert.match(out.html, /data-record-row="projected"/);
    assert.doesNotMatch(out.html, /data-record-row="linear"/);
    const changed = capture({ tabs, rows, tab: 'completed' });
    assert.equal(changed.find('FramePanel').length, 19);
    assert.doesNotMatch(changed.html, /data-record-row="quadratic"/);
    assert.equal(capture({ tabs, rows, tab: '' }).find('FramePanel').length, 1);
  }
});

test('tabless content preserves action intents and loading, empty and error states', () => {
  const events = [];
  const out = capture({ tabs: undefined, onRowAction: (...args) => events.push(args), onSearch: value => events.push(value) });
  button(out, '继续处理').props.onClick(click());
  out.find('Input')[0].props.onChange({ target: { value: '方程' } });
  assert.deepEqual(events, [['linear', 'open'], '方程']);
  for (const [state, text] of [[{ kind: 'loading' }, '正在加载记录'], [{ kind: 'empty' }, '暂无记录'], [{ kind: 'search-empty' }, '没有找到匹配的记录'], [{ kind: 'error', reason: '请求失败' }, '请求失败']]) {
    const result = capture({ tabs: undefined, state });
    assert.ok(result.html.includes(text));
    assert.doesNotMatch(result.html, /data-record-row=|role="tablist"/);
  }
});


test('record controls retain coss sizes and restrict touch expansion to coarse pointers', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('../components/prism-next/record-list.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /(?:["`\s])(?:sm:)?(?:min-h-11|min-w-11|h-auto)(?=["`\s])/);
  const out = capture({ pagination: { page: 1, pages: [1, 2], pageSize: { value: 5, options: [5, 10] } } });
  assert.match(out.html, /h-8\.5[^"<>]*sm:h-7\.5/); // Input inner 34 / 30 + borders.
  assert.match(out.html, /min-h-9[^"<>]*sm:min-h-8/); // Select 36 / 32.
  assert.match(out.html, /h-9[^"<>]*sm:h-8/); // Button 36 / 32.
  assert.match(out.html, /size-9 sm:size-8/); // More menu uses public icon size.
  assert.match(out.html, /pointer-coarse:after:min-h-11/);
  assert.match(out.html, /pointer-coarse:after:min-w-11/);
  assert.ok(out.find('Input')[0].props.className.includes('pointer-coarse:[&_[data-slot=input]]:min-h-11'));
  assert.match(source, /pointer-coarse:\[&_\[data-slot=input\]\]:min-h-11/);
  for (const item of out.find('MenuItem')) assert.match(item.props.className, /pointer-coarse:min-h-11/);
  assert.match(source, /<SelectItem[^>]*className="pointer-coarse:min-h-11/g);
  assert.match(source, /pointer-coarse:min-h-11 pointer-coarse:min-w-11 motion-reduce/);
  assert.match(out.html, /class="truncate">开始 AI 批阅/);
});
