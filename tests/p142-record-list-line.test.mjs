import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { api, capture } from './record-list-harness.mjs';
const snapshots = JSON.parse(await readFile(new URL('./fixtures/p142-record-card-ssr.json', import.meta.url), 'utf8'));
const line = props => capture({ layout: 'line', tabs: [], filters: [], summary: undefined, pagination: undefined, showHeader: false, showSearch: false, rows: api.lineRecordRows, ...props });

test('P142 default and explicit card preserve pre-change ab67320 SSR bytes in eight states', () => {
  for (const { props, sha256 } of snapshots) for (const layout of [undefined, 'card']) {
    const html = capture({ ...props, layout, groups: [{ id: 'ignored', label: 'ignored' }] }).html;
    assert.equal(createHash('sha256').update(html).digest('hex'), sha256);
  }
  const rows = api.recordBase.rows;
  assert.equal(capture({ rows }).html, capture({ layout: 'card', rows: rows.map(row => ({ ...row, attention: true, time: 'today', groupId: 'ignored' })) }).html);
});

test('P142 grouping follows supplied order, counts visible membership, skips empty groups and appends orphans', () => {
  const out = line({ rows: [...api.lineRecordRows, { ...api.lineRecordRows[0], id: 'orphan', groupId: 'missing' }, { ...api.lineRecordRows[0], id: 'hidden', tabIds: ['other'] }], tab: 'selected',
    groups: [{ id: 'rest', label: '其余', note: '按创建时间' }, { id: 'empty', label: '空组' }, { id: 'todo', label: '等你处理', attention: true }] });
  const groups = out.nodes.filter(n => n.props['data-record-group']);
  assert.deepEqual(groups.map(n => n.props['data-record-group']), ['rest', 'todo']);
  assert.deepEqual(out.nodes.filter(n => n.props.className === 'bp-rl-line-count').map(n => n.props.children), [4, 4]);
  assert.deepEqual(out.nodes.filter(n => n.props['data-record-row']).map(n => n.props['data-record-row']), ['l1-5','l1-6','l1-7','l1-8','l1-1','l1-2','l1-3','l1-4','orphan']);
  assert.doesNotMatch(out.html, /空组|data-record-row="hidden"/);
  assert.match(out.html, /按创建时间/);
  assert.doesNotMatch(line().html, /data-record-group/);
});

test('P142 line facts, tones, current marker and omitted card-only features', () => {
  const tones = ['warning','success','error','info','neutral',undefined];
  const rows = tones.map((tone, i) => ({ ...api.lineRecordRows[0], id: `r${i}`, status: { label: '状态', tone }, menu: [{ id: 'more', label: '不画菜单' }], toggle: { id: 'star', label: '不画开关', pressed: true }, badges: ['不画徽章'], tag: '不画标签', progress: 42, description: '不画说明' }));
  const out = line({ rows, currentRowId: 'r0' });
  for (const tone of tones) assert.match(out.html, new RegExp(`bp-rl-line-tone-${tone ?? 'neutral'}`));
  const current = out.nodes.find(n => n.props['data-record-row'] === 'r0');
  assert.equal(current.props['data-attention'], true);
  assert.equal(current.props['data-current'], '');
  assert.equal(current.props['aria-current'], 'true');
  assert.match(out.html, /刚才查看/);
  assert.match(out.html, /bp-rl-line-time[^>]*>9\/16/);
  assert.doesNotMatch(out.html, /不画|data-agent-status|data-slot="frame|space-y-3/);
  assert.doesNotMatch(line({ rows: [{ ...rows[0], time: undefined }] }).html, /class="bp-rl-line-time/);
  const hidden = line({ showType: false, showStatus: false });
  assert.doesNotMatch(hidden.html, /class="bp-rl-line-type|bp-rl-line-status /);
});

test('P142 native button keyboard activation shares click intent and disabled guard', () => {
  const calls = [];
  const out = line({ onRowAction: (...args) => calls.push(args) });
  const row = out.nodes.find(n => n.props['data-record-row'] === 'l1-1');
  // Native button supplies Enter/Space -> click semantics; no synthetic key handler can double-dispatch.
  assert.equal(row.type, 'button');
  assert.equal(row.props.type, 'button');
  assert.equal(row.props.tabIndex, undefined);
  assert.equal(row.props.onKeyDown, undefined);
  assert.equal(row.props['aria-label'], '二班 · 二次函数巩固练习 · 九年级（2）班 · 待你处理 · 继续处理');
  row.props.onClick();
  assert.deepEqual(calls, [['l1-1', 'open']]);
  for (const props of [{ onRowAction: undefined }, { rows: [{ ...api.lineRecordRows[0], action: { id: 'open', label: '继续处理', disabledReason: '等待资料' } }], onRowAction: (...args) => calls.push(args) }]) {
    const disabled = line(props), button = disabled.nodes.find(n => n.props['data-record-row']);
    assert.equal(button.props['aria-disabled'], true);
    assert.ok(button.props['aria-describedby']);
    button.props.onClick();
  }
  assert.equal(calls.length, 1);
});

test('P142 line leaves loading, empty, error, search-empty contents and pagination available', () => {
  for (const [state, text] of [[{ kind: 'loading' }, '正在加载记录'], [{ kind: 'empty' }, '暂无记录'], [{ kind: 'error', reason: '失败原因' }, '失败原因'], [{ kind: 'search-empty' }, '没有找到匹配的记录']]) {
    const out = line({ state }); assert.ok(out.html.includes(text)); assert.doesNotMatch(out.html, /data-record-row/);
  }
  assert.match(line({ pagination: { page: 1, pages: [1, 2], label: '第 1 页' } }).html, /第 2 页/);
});
