import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';

const root = fileURLToPath(new URL('../', import.meta.url));
const dir = new URL('../.sites-runtime/agent-visual-batch1/', import.meta.url);
await mkdir(dir, { recursive: true });
const file = new URL('test-bundle.mjs', dir);
const result = await build({ stdin: { contents: `
export * from './components/prism-next/agent-visual-parts';
export * from './components/prism-next/agent-text-diff';
export * from './components/prism-next/agent-semantic-components';
export * from './components/prism-next/agent-candidate-picker';
export * from './components/prism-next/agent-review-queue';
export * from './components/prism-next/agent-item-reviewer';
export * from './components/prism-next/agent-metric-summary';
export * from './components/prism-next/demos/agent-core-previews';
export * from './components/prism-next/demos/agent-component-page';
`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root, 'next/link': 'next/link.js', 'next/navigation': 'next/navigation.js' }, loader: { '.css': 'empty' }, write: false });
await writeFile(file, result.outputFiles[0].text);
const c = await import(file);
await rm(file);
const h = React.createElement;
const text = html => html.replace(/<[^>]*>/g, '');
const candidate = { title: '候选', candidateSet: { id: 'set', version: 'v1' }, candidates: [], selectedIds: [], result: { state: 'ready' }, page: { total: null }, submission: { state: 'idle' } };
const progress = { title: '过程', description: '最后记录；此后状态尚未确认。', state: 'unknown', steps: [{ id: 's', label: '整理', state: 'running' }], expanded: true, updatedAt: '14:10' };

test('12px statuses always carry an aria-hidden icon; unknown is neutral and static', () => {
  for (const tone of ['neutral', 'info', 'success', 'warning', 'error']) {
    const html = render(h(c.AgentStatus, { tone }, '状态事实'));
    assert.match(html, /text-component-label/);
    assert.match(html, /<svg[^>]*aria-hidden="true"/);
    assert.match(html, /状态事实/);
  }
  const html = render(h(c.AgentStatus, { tone: 'warning', unknown: true, running: true }, '回执未确认'));
  assert.match(html, /circle-question-mark/); assert.match(html, /未知/);
  assert.match(html, /bg-secondary text-muted-foreground/);
  assert.doesNotMatch(html, /bg-warning|text-warning|animate-spin/);
});

test('decision and ordinary surfaces use the approved existing coss shadow and ring', () => {
  const ordinary = render(h(c.AgentArtifactPreview, { title: '成果', version: 'v1', status: '待核对', summary: '摘要' }));
  const choosing = render(h(c.AgentCandidatePicker, candidate));
  const confirming = render(h(c.AgentExecutionConfirmation, { title: '确认', target: '材料', version: 'v1', effects: ['形成草稿', '不会发布'], confirmation: { state: 'ready', confirm: { label: '确认', onAction() {} } } }));
  for (const html of [choosing, confirming]) { assert.match(html, /shadow-lg\/5/); assert.doesNotMatch(html, /shadow-xs\/5/); }
  assert.match(ordinary, /shadow-xs\/5/); assert.doesNotMatch(ordinary, /shadow-lg\/5/);
  for (const html of [ordinary, choosing, confirming]) { assert.match(html, /ring-1 ring-border/); assert.match(html, /rounded-xl/); }
  assert.match(render(h(c.AgentCandidatePicker, { ...candidate, submission: { state: 'submitted' } })), /shadow-xs\/5/);
});

test('source chip is a native keyboard-reachable dialog trigger; coss owns Escape and return focus', () => {
  const html = render(h(c.AgentSourceChip, { label: '来源 A' }, '完整来源与说明'));
  assert.match(html, /<button[^>]*type="button"/);
  assert.match(html, /aria-haspopup="dialog"/);
  assert.match(html, /aria-expanded="false"/);
  assert.doesNotMatch(html, /tabindex="-1"|完整来源与说明/);
  const nodes = [];
  function Probe() {
    const tree = c.AgentSourceChip({ label: '来源 A', children: '完整来源与说明' });
    function walk(node) { if (!React.isValidElement(node)) return; nodes.push(node); React.Children.forEach(node.props.children, walk); }
    walk(tree); return tree;
  }
  render(h(Probe));
  const trigger = nodes.find(n => n.type.name === 'PopoverTrigger');
  const popup = nodes.find(n => n.type.name === 'PopoverPopup');
  assert.strictEqual(popup.props.finalFocus, trigger.props.ref);
  assert.equal(trigger.props.onKeyDown, undefined);
  assert.ok(nodes.some(n => n.type.name === 'PopoverClose'));
});

test('sample, excerpt and disconnected markers stay visible outside closed source chips', () => {
  const html = render(h(c.AgentCandidatePicker, { ...candidate, visual: { sample: true, excerpt: true, disconnected: true }, details: '仅展开后出现的说明' }));
  for (const marker of ['示例', '节选', '未连接', '尚未提交', '总数未知']) assert.ok(text(html).includes(marker), marker);
  assert.match(html, /data-agent-sample/); assert.doesNotMatch(html, /仅展开后出现的说明/);
});

test('unknown progress retains last update, freezes stale running steps and never claims current activity', () => {
  const html = render(h(c.AgentExecutionProgress, progress));
  for (const fact of ['未知', '14:10', '上次进行到']) assert.ok(text(html).includes(fact), fact);
  assert.doesNotMatch(html, /animate-spin|aria-current="step"/);
  assert.match(html, /data-agent-well/);
  assert.match(render(h(c.AgentExecutionProgress, { ...progress, updatedAt: undefined })), /更新时间未确认/);
  const live = render(h(c.AgentExecutionProgress, { ...progress, state: 'running' }));
  assert.match(live, /motion-safe:animate-spin/); assert.match(live, /motion-reduce:animate-none/);
});

test('an unknown review keeps its original request and neutral explanation without a warning surface', () => {
  const html = render(h(c.AgentItemReviewer, { item: { id: 'q', title: '复核', version: 'v1' },
    review: { state: 'unknown', description: '保留原请求。', request: { id: 'r', label: '首次复核' } }, summary: '待核对内容', checkpoints: ['核对条件'], visual: { updatedAt: '14:10' } }));
  for (const fact of ['回执未确认', '未知', '首次复核', '14:10', '不要重复提交']) assert.ok(text(html).includes(fact));
  assert.doesNotMatch(html, /bg-warning|text-warning-foreground/);
});

test('uncontrolled trace is collapsed; controlled steps and workspace retain their host contract', () => {
  const html = render(h(c.AgentTraceRows, null, h('p', null, '过程细节')));
  assert.match(html, /aria-expanded="false"/); assert.doesNotMatch(html, /过程细节/);
  assert.match(render(h(c.AgentExecutionProgress, { ...progress, expanded: false, view: 'workspace' })), /上次进行到/);
});

test('text diff reconstructs both complete Unicode inputs, without semantic or formula inference', () => {
  for (const [before, after] of [['函数 y = (x − 2)2 + 3。', '函数 y = (x − 2)² + 3。'], ['中文🙂\n原值', '中文🌟\n草稿'], ['', '新增'], ['删除', ''], ['相同', '相同']]) {
    const segments = c.agentTextDiff(before, after);
    assert.equal(segments.filter(s => s.kind !== 'added').map(s => s.text).join(''), before);
    assert.equal(segments.filter(s => s.kind !== 'removed').map(s => s.text).join(''), after);
  }
  const html = render(h(c.AgentTextDiff, { before: '条件2', after: '条件²' }));
  assert.match(html, /<del/); assert.match(html, /<ins/); assert.match(html, /差异图例/); assert.match(html, /text-read-body/);
});

test('long or poorly aligned comparison falls back to complete parallel text, and slots remain opaque', () => {
  for (const [before, after] of [['甲'.repeat(4010), '乙'], ['甲'.repeat(30), '乙'.repeat(30)]]) {
    assert.equal(c.agentTextDiff(before, after), null);
    const html = render(h(c.AgentTextDiff, { before, after }));
    assert.match(html, /data-agent-text-diff="parallel"/); assert.ok(text(html).includes(before)); assert.ok(text(html).includes(after));
  }
  const base = { item: { id: 'q', title: '复核', version: 'v1' }, review: { state: 'draft', description: '修改未保存。' }, summary: '当前值', checkpoints: ['核对条件'], textComparison: { before: '原稿', after: '草稿' }, view: 'workspace' };
  const html = render(h(c.AgentItemReviewer, { ...base, comparison: h('p', null, '宿主领域对照') }));
  assert.match(html, /宿主领域对照/); assert.doesNotMatch(html, /data-agent-text-diff/);
});

test('three themes and 390/320 review frames retain markers, formula-size roles and actions (SSR only)', () => {
  for (const theme of ['light', 'paper', 'dark']) for (const width of ['390', '320']) {
    const html = render(h(c.AgentPreviewFrame, { theme, width }, h(c.AgentCorePreview, { kind: 'confirmation' })));
    assert.match(html, new RegExp(`data-prism-theme="${theme}"`)); assert.match(html, new RegExp(`width:${width}px`));
    for (const fact of ['示例', '未连接', '确认整理', '将会', '不会入库或发布']) assert.ok(text(html).includes(fact));
  }
});

function assertMetaLine(html, facts) {
  const lines = [...html.matchAll(/<p\b[^>]*data-agent-meta=""[^>]*>[\s\S]*?<\/p>/g)].map(match => match[0]);
  const line = lines.find(line => facts.every(fact => text(line).includes(fact)));
  assert.ok(line, `one meta line must contain every fact: ${facts.join(' / ')}`);
  assert.match(line, /text-ui-meta text-muted-foreground/);
  assert.match(text(line), / · /);
  assert.doesNotMatch(line, /<br|<div|<p\b.*<p\b|truncate|line-clamp/);
  for (const fact of facts) assert.ok(text(html).includes(fact), `DOM retains ${fact}`);
  return line;
}

test('16 merges all short item facts into one meta line while reasons remain standing hint text', () => {
  const item = { id: 'item', title: '题目', displayNumber: '第 16 题', typeLabel: '试题', version: '题稿 v2',
    review: { state: 'unknown', description: '保留原请求，回执未确认。', request: { id: 'request', label: '原复核' } },
    priority: { label: '优先', reason: '优先核对回执，避免重复确认。' }, assignee: '陈老师',
    versionChange: { currentVersion: '题稿 v3', description: '条件已更新，请重新复核。' },
    processingByOther: { name: '李老师', description: '正在核对原稿。' },
    exceptions: [{ id: 'exception', label: '条件差异', description: '分式分母需要核对。' }], disabledReason: '当前仅可查看。' };
  for (const view of ['inline', 'workspace']) for (const density of ['default', 'compact']) {
    const html = render(h(c.AgentReviewQueue, { title: '队列', queue: { id: 'queue', version: 'v1' }, items: [item], view, density }));
    assertMetaLine(html, ['编号：第 16 题', '试题', '依据版本：题稿 v2', '优先级：优先', '责任人：陈老师', '当前版本：题稿 v3', '正在处理：李老师', '异常：条件差异']);
    for (const fact of [item.priority.reason, item.review.description, item.versionChange.description, item.processingByOther.description, item.exceptions[0].description, item.disabledReason]) {
      assert.ok([...html.matchAll(/<p\b[^>]*text-ui-hint[^>]*>([\s\S]*?)<\/p>/g)].some(match => text(match[1]).includes(fact)), fact);
    }
    assert.match(html, /回执未确认/); assert.match(html, /已过期/);
  }
});

test('26 keeps run metadata, status icons and following times in stage/history rows without losing facts', () => {
  const input = { ...progress, run: { id: 'now', label: '第 2 轮', version: '材料 v2' },
    stages: [{ id: 'stage', title: '核对材料', state: 'completed', time: '13:50', description: '已保留原稿条件。', steps: [] }],
    exceptions: [{ id: 'issue', title: '图像模糊', time: '13:55', description: '第 3 页文字无法辨认。', resolution: '等待清晰原稿。' }],
    history: [{ id: 'old', label: '第 1 轮', version: '材料 v1', state: 'partial', updatedAt: '12:00', description: '当时只完成第 1 页。', steps: [] }] };
  for (const view of ['inline', 'workspace']) for (const density of ['default', 'compact']) {
    const html = render(h(c.AgentExecutionProgress, { ...input, view, density }));
    assertMetaLine(html, ['当前状态', '第 2 轮', '材料 v2', '最近更新：14:10']);
    const stageTime = [...html.matchAll(/<p[^>]*data-agent-meta=""[^>]*>[\s\S]*?<\/p>/g)].map(match => match[0]).find(line => text(line) === '阶段时间：13:50');
    assert.ok(stageTime, 'exact stage time stays in its own metadata line');
    assert.match(stageTime, /text-ui-meta text-muted-foreground/);
    assertMetaLine(html, ['当时版本 · 材料 v1', '12:00']);
    const statuses = [...html.matchAll(/<span[^>]*data-agent-status=[^>]*>([\s\S]*?)<\/span><\/span>/g)].map(match => match[1]);
    for (const fact of ['阶段状态：已完成', '当时状态 · 部分完成']) assert.ok(statuses.some(status => text(status).includes(fact) && /<svg[^>]*aria-hidden="true"/.test(status)), fact);
    for (const title of ['阶段记录', '异常与处置记录', '历次执行']) assert.ok(html.includes(`<h4 class="text-ui-meta text-muted-foreground">${title}</h4>`));
    const rows = [...html.matchAll(/<div data-agent-trace-row=""[^>]*>([\s\S]*?)<\/div>/g)].map(match => match[1]);
    for (const title of ['核对材料', '图像模糊', '第 1 轮']) assert.ok(rows.some(row => /<svg[^>]*aria-hidden="true"/.test(row) && text(row).includes(title) && /data-agent-meta/.test(row)), title);
    for (const fact of ['已保留原稿条件。', '第 3 页文字无法辨认。', '处置记录：等待清晰原稿。', '当时只完成第 1 页。', '13:55']) assert.ok(text(html).includes(fact));
    assert.doesNotMatch(html, /animate-spin|aria-current="step"/);
  }
});

test('10 merges header facts into one meta line and keeps full source triggers inline with both bases', () => {
  const main = { id: 'main', title: '候选题', type: '试题', status: 'available', summary: '核对完整条件。', rationale: '覆盖二次函数顶点。', source: '本校二次函数完整题库', alternatives: [{ candidateId: 'alt', reason: '更适合当前课时。' }] };
  const alt = { id: 'alt', title: '替代题', type: '试题', status: 'available', rationale: '覆盖函数单调性。', source: '区级函数复习资料完整版' };
  for (const view of ['inline', 'workspace']) for (const density of ['default', 'compact']) {
    const html = render(h(c.AgentCandidatePicker, { ...candidate, candidates: [main, alt], selectedIds: ['main'], page: { total: null, label: '示例检索结果' }, visual: { updatedAt: '14:20' }, view, density }));
    assertMetaLine(html, ['总数未知', '示例检索结果', '本次已选 1 项', '当前显示 2 项', '最近更新：14:20']);
    const bases = [...html.matchAll(/<p data-agent-candidate-(?:alternative-)?basis=""[^>]*>([\s\S]*?)<\/p>/g)].map(match => match[1]);
    for (const [basis, source] of [['选择依据：覆盖二次函数顶点。', '来源：本校二次函数完整题库'], ['替代依据：更适合当前课时。', '来源：区级函数复习资料完整版']]) {
      const row = bases.find(row => text(row).includes(basis) && text(row).includes(source));
      assert.ok(row, `${basis} and complete source share a paragraph`);
      assert.match(row, /<button[^>]*data-agent-source=""/);
    }
    for (const fact of ['候选题', '核对完整条件。', '替代项：替代题', '选择依据：覆盖函数单调性。']) assert.ok(text(html).includes(fact));
  }
});
