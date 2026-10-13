import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { capture, click } from './record-list-harness.mjs';

const before = JSON.parse(await readFile(new URL('./fixtures/p57-record-before.json', import.meta.url), 'utf8'));
test('P57 default RecordList and explicit ghost/start preserve five pre-change SSR snapshots', () => {
  for (const { props, sha256 } of before) for (const explicit of [false, true]) {
    const html = capture({ ...props, ...(explicit ? { actionVariant: 'ghost', actionAlign: 'start' } : {}) }).html;
    assert.equal(createHash('sha256').update(html).digest('hex'), sha256);
  }
});

const row = { id: 'paper', name: '长中文试卷记录', type: '试卷', metadata: '九年级 · 120分', description: '包含多行说明', badges: ['已收藏'], action: { id: 'open', label: '打开试卷' }, menu: [{ id: 'download', label: '下载' }] };
for (const actionVariant of ['ghost', 'outline', 'primary']) for (const actionAlign of ['start', 'center']) test(`P57 RecordList ${actionVariant}/${actionAlign} only changes row primary style and action area alignment`, () => {
  const calls = [], out = capture({ rows: [row], actionVariant, actionAlign, onRowAction: (...args) => calls.push(args) });
  const primary = out.find('Button').find(node => node.props['aria-label'] === '打开试卷：长中文试卷记录 · 已收藏');
  assert.equal(primary.props.variant, actionVariant === 'primary' ? 'default' : actionVariant);
  const area = out.nodes.find(node => node.type === 'div' && node.props.className?.includes('@min-[720px]:max-w-80'));
  assert.equal(area.props.className.includes('self-center'), actionAlign === 'center');
  const header = out.find('Button').find(node => node.props.children?.props?.children === '开始 AI 批阅');
  assert.equal(header.props.variant, undefined);
  const menu = out.nodes.find(node => node.props.render?.props?.['aria-label'] === '更多操作：长中文试卷记录 · 已收藏');
  assert.equal(menu.props.render.props.variant, 'ghost');
  const event = click(); primary.props.onClick(event); assert.equal(event.stopped, true); assert.deepEqual(calls, [['paper', 'open']]);
  assert.equal(capture({ rows: [row], actionVariant, actionAlign }).html, out.html);
});

test('P57 RecordList styled actions retain disabled reason and row click isolation', () => {
  const calls = [], out = capture({ rows: [{ ...row, action: { ...row.action, disabledReason: '处理中' } }], actionVariant: 'primary', actionAlign: 'center', onRowAction: (...args) => calls.push(args) });
  const primary = out.find('Button').find(node => node.props['aria-label']?.startsWith('打开试卷：'));
  assert.equal(primary.props.disabled, true); assert.equal(primary.props.title, '处理中'); primary.props.onClick(click());
  out.find('FramePanel')[0].props.onClick({ target: { closest: () => false } }); assert.deepEqual(calls, []);
  const absent = capture({ rows: [row], actionVariant: 'outline', onRowAction: undefined });
  assert.equal(absent.find('Button').find(node => node.props['aria-label']?.startsWith('打开试卷：')).props.disabled, true);
});
