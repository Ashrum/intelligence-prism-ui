import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = new URL('../.sites-runtime/metric-summary/', import.meta.url);
await mkdir(runtime, { recursive: true });
const file = new URL('test-bundle.mjs', runtime);
const bundle = await build({ stdin: { contents: `export * from './components/prism-next/agent-metric-summary'; export * from './components/prism-next/demos/agent-metric-summary';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false });
await writeFile(file, bundle.outputFiles[0].text);
const { AgentMetricSummary, AgentMetricSummaryDemo, MetricSummaryExample, metricSummaryExamples } = await import(file);
await rm(file);
const h = React.createElement;
const record = { id: 'opaque-record', version: '记录 v7', dataTime: '2026-09-25 10:00' };
const item = { id: 'opaque-metric', access: 'available', key: true, label: '正确率', reading: { state: 'available', value: '07.2500', unit: '%' },
  sampleSize: '3 名学生', denominator: '7 项作答', method: '原样口径说明', baseline: '原样基准 99.9%' };
const group = items => [{ id: 'opaque-group', label: '学习表现', items }];
const props = { title: '指标示例', record, scope: { state: 'available', summary: '高二三班 · 本次作业' }, groups: group([item]) };
const modes = [{}, { view: 'workspace' }, { density: 'compact' }, { view: 'workspace', density: 'compact' }];
const htmlFor = extra => render(h(AgentMetricSummary, { ...props, ...extra }));
const textOf = html => html.replace(/<[^>]*>/g, '');
const basis = { state: 'available', id: 'opaque-basis', label: '原始比较记录' };
const change = { text: '原样差值 −0.0001 个百分点', direction: 'increase', significance: 'not-significant', basis };
const anomaly = { id: 'opaque-anomaly', access: 'available', text: '评分记录冲突', basis };
const secret = 'NEVER_DISCLOSE_PRIVATE_VALUE';
function Forbidden() { assert.fail('restricted content must not mount'); }
function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.freeze(value); Object.values(value).forEach(freeze); }
  return value;
}

// SSR and the actual component-created handlers; this does not replace browser interaction tests.
function capture(extra) {
  const nodes = [], owned = new Set(['AgentMetricSummary', 'MetricSummary', 'MetricFacts', 'MetricMethod', 'MetricBasis', 'MetricRestriction', 'MetricStatements']);
  function inspect(node) {
    if (Array.isArray(node)) return node.map(inspect);
    if (!React.isValidElement(node)) return node;
    nodes.push(node);
    if (typeof node.type === 'function' && owned.has(node.type.name)) return h(function Probe() { return inspect(node.type(node.props)); });
    return React.cloneElement(node, {}, React.Children.map(node.props.children, inspect));
  }
  render(inspect(h(AgentMetricSummary, { ...props, ...extra })));
  return nodes;
}
const button = (nodes, text) => nodes.find(node => node.props.onClick && React.Children.toArray(node.props.children).filter(value => typeof value === 'string').join('') === text);
const allButtons = nodes => nodes.filter(node => node.props.onClick);

test('defaults to inline/default and preserves supplied values, zero, precision, denominator and sample without statistics', () => {
  assert.equal(htmlFor(), htmlFor({ view: 'inline', density: 'default' }));
  const groups = freeze(group([item, { ...item, id: 'zero', label: '异常数', reading: { state: 'available', value: 0, unit: '份' } }]));
  for (const mode of modes) {
    const html = htmlFor({ ...mode, groups });
    for (const value of ['07.2500%', '3 名学生', '7 项作答', '原样基准 99.9%', '当前状态', '数据版本：记录 v7']) assert.ok(html.includes(value), value);
    assert.match(html, />0<\/span>/); assert.doesNotMatch(html, /42\.85|−92\.65|下降|显著变化|结论|已读取|已引用/);
  }
});

test('reuses compact MetricSummary and the existing TrendChart with the exact host series', () => {
  const trend = freeze({ label: '正确率趋势', unit: '%', domain: [0, 100], series: [{ id: 'series', label: '正确率', data: [{ id: 'a', label: '一', value: 7.25 }, { id: 'b', label: '二', value: null }, { id: 'c', label: '三', value: 0 }] }] });
  const groups = group([{ ...item, trend }]);
  for (const mode of modes) {
    const nodes = capture({ ...mode, groups });
    assert.ok(nodes.some(node => node.type.name === 'MetricSummary' && node.props.density === 'compact'));
    const chart = nodes.find(node => node.type.name === 'TrendChart');
    if (mode.view === 'workspace') { assert.strictEqual(chart.props.series, trend.series); assert.strictEqual(chart.props.domain, trend.domain); assert.equal(chart.props.unit, '%'); assert.equal(chart.props.showData, undefined); }
    else assert.equal(chart, undefined);
  }
  const html = htmlFor({ view: 'workspace', groups });
  assert.match(html, /查看数据/); assert.match(html, /7\.25%/); assert.match(html, /0%/); assert.match(html, />—</);
});

test('missing/insufficient/unknown are always visible and reject stale value, unit, change and trend payloads', () => {
  for (const [state, label] of [['missing', '缺测'], ['insufficient', '样本不足'], ['unknown', '状态未确认']]) {
    const uncertain = { ...item, key: false, reading: { state, reason: '本次依据不足', value: secret, unit: secret }, change: { ...change, text: secret }, trend: { label: secret, series: [] } };
    for (const mode of modes) {
      const html = htmlFor({ ...mode, groups: group([uncertain]), onExpand() {} });
      for (const value of [label, '本次依据不足', '3 名学生', '7 项作答']) assert.ok(html.includes(value), value);
      assert.ok(!html.includes(secret)); assert.match(html, />—</);
    }
  }
});

test('direction and significance follow only host judgments even if the numeric wording disagrees', () => {
  const html = htmlFor({ groups: group([{ ...item, change }]) });
  for (const value of [change.text, '上升', '未达显著', '原始比较记录']) assert.ok(html.includes(value));
  assert.doesNotMatch(html, /下降|显著变化/);
  const unspecified = htmlFor({ groups: group([{ ...item, change: { text: '差值待核对', basis } }]) });
  assert.doesNotMatch(unspecified, /上升|下降|持平|显著性未确认|显著变化/);
  const unknown = htmlFor({ groups: group([{ ...item, change: { ...change, direction: 'unknown', significance: 'unknown' } }]) });
  assert.match(unknown, /方向未确认/); assert.match(unknown, /显著性未确认/);
  assert.match(htmlFor({ groups: group([{ ...item, change: { ...change, direction: 'unchanged' } }]) }), /持平/);
});

test('inline includes all host-key, significant, uncertain and restricted items; absent expansion retains the full set', () => {
  const extra = { ...item, id: 'extra', label: '其他指标', key: false };
  const significant = { ...item, id: 'significant', label: '需要核对的下降', key: false, change: { ...change, direction: 'decrease', significance: 'significant' } };
  const groups = group([item, extra, significant]);
  for (const density of ['default', 'compact']) {
    const html = htmlFor({ groups, density, onExpand() {} });
    assert.match(html, /正确率/); assert.match(html, /需要核对的下降/); assert.match(html, /显著变化/); assert.doesNotMatch(html, /其他指标/);
    assert.match(htmlFor({ groups, density }), /其他指标/);
  }
  assert.match(htmlFor({ groups, view: 'workspace', onExpand() {} }), /其他指标/);
  for (const pendingChange of [{ ...change, direction: 'unknown' }, { ...change, significance: 'unknown' }, { ...change, basis: { state: 'unavailable', reason: '依据未取得' } }]) {
    assert.match(htmlFor({ groups: group([{ ...extra, change: pendingChange }]), onExpand() {}, density: 'compact' }), /其他指标/);
  }
});

test('anomalies and each available/unavailable basis remain visible in both densities without manufactured actions', () => {
  const unavailable = { ...anomaly, id: 'missing-basis', text: '回执未确认', basis: { state: 'unavailable', reason: '原始记录暂不可用', id: secret, label: secret } };
  for (const mode of modes) {
    const html = htmlFor({ ...mode, anomalies: [anomaly, unavailable], onExpand() {} });
    for (const value of ['异常提示', '评分记录冲突', '原始比较记录', '回执未确认', '依据暂不可查看：原始记录暂不可用']) assert.ok(html.includes(value));
    assert.ok(!html.includes(secret)); assert.doesNotMatch(html, /<button[^>]*aria-label="查看.*的依据/);
  }
});

test('restricted metric/anomaly branches expose only approved counts/reasons and never mount injected private content', () => {
  const restricted = { ...item, id: 'private-metric', access: 'restricted', disclosure: { count: '0 项', reason: '允许披露的原因' }, label: secret, reading: { state: 'available', value: secret }, method: secret,
    version: secret, dataTime: secret, statements: [{ kind: 'conclusion', text: h(Forbidden), source: secret }], trend: { label: secret, series: [] } };
  for (const mode of modes) {
    const html = htmlFor({ ...mode, groups: group([restricted]), anomalies: [{ ...restricted, text: secret, basis }], onDrilldown() {}, onExpand() {} });
    assert.match(html, /访问受限/); assert.match(html, /受限数量：0 项/); assert.match(html, /允许披露的原因/);
    assert.ok(!html.includes(secret)); assert.ok(!html.includes('private-metric')); assert.doesNotMatch(html, /查看.*明细|的依据/);
    const noCount = htmlFor({ ...mode, groups: group([{ ...restricted, disclosure: { reason: '原因' } }]) });
    assert.doesNotMatch(noCount, /受限数量/);
  }
});

test('whole-scope restriction suppresses private title, record, groups, anomalies, details and expansion even in history', () => {
  for (const mode of modes) {
    const html = htmlFor({ ...mode, title: secret, record: { id: secret, version: secret, dataTime: secret, snapshot: true },
      scope: { state: 'restricted', disclosure: { count: '2 项', reason: '当前范围不可访问' }, summary: secret },
      groups: group([{ ...item, statements: [{ kind: 'conclusion', text: h(Forbidden), source: secret }] }]),
      anomalies: [{ ...anomaly, text: secret }], details: h(Forbidden), notice: secret, onExpand() {}, onDrilldown() {} });
    for (const value of ['指标摘要', '2 项', '当前范围不可访问']) assert.ok(html.includes(value));
    assert.ok(!html.includes(secret)); assert.doesNotMatch(html, /正确率|查看指标详情|当前状态|当时数据|data-snapshot|说明/);
  }
});

test('partial scope restriction does not imply more authorized objects and optional missing scope stays unspecified', () => {
  const html = htmlFor({ scope: { state: 'available', summary: '', restricted: { reason: '仅可查看本次计数' } } });
  assert.match(html, /数据范围：未指定/); assert.match(html, /仅可查看本次计数/); assert.doesNotMatch(html, /全部|受限数量/);
});

test('metric/change/anomaly drilldown handlers emit version-bound intent and original trigger only, with no local mutation', () => {
  const calls = [], trigger = { fixture: 'button' };
  const groups = freeze(group([{ ...item, version: '指标 v2', change }]));
  const input = { groups, anomalies: freeze([anomaly]), onDrilldown: (...args) => calls.push(args) };
  const before = htmlFor(input), nodes = capture(input);
  button(nodes, '查看正确率明细').props.onClick({ currentTarget: trigger });
  const basisButtons = allButtons(nodes).filter(node => node.props['aria-label']);
  basisButtons.find(node => node.props['aria-label'] === '查看正确率变化的依据').props.onClick({ currentTarget: trigger });
  basisButtons.find(node => node.props['aria-label'] === '查看评分记录冲突的依据').props.onClick({ currentTarget: trigger });
  assert.deepEqual(calls, [
    [{ recordId: record.id, version: record.version, metricVersion: '指标 v2', kind: 'metric', metricId: item.id }, trigger],
    [{ recordId: record.id, version: record.version, metricVersion: '指标 v2', kind: 'change', metricId: item.id, basisId: basis.id }, trigger],
    [{ recordId: record.id, version: record.version, kind: 'anomaly', anomalyId: anomaly.id, basisId: basis.id }, trigger],
  ]);
  assert.equal(htmlFor(input), before);
  for (const value of [record.id, item.id, basis.id, anomaly.id, 'opaque-group']) assert.ok(!before.includes(value), value);
});

test('missing callback, identity or basis target never produces a fake drilldown entry', () => {
  for (const extra of [{}, { record: { ...record, id: '' }, onDrilldown() {} }, { record: { ...record, version: '' }, onDrilldown() {} }]) {
    const html = htmlFor({ groups: group([{ ...item, change }]), anomalies: [anomaly], ...extra });
    assert.doesNotMatch(html, /查看正确率明细|aria-label="查看.*的依据/);
    assert.match(html, /依据暂不可查看/);
  }
  const html = htmlFor({ groups: group([{ ...item, change: { ...change, basis: { ...basis, id: '' } } }]), onDrilldown() {} });
  assert.doesNotMatch(html, /aria-label="查看正确率变化的依据/);
});

test('expand/back are navigation only, missing onExpand has no entry and workspace never exposes it', () => {
  const calls = [], trigger = { fixture: 'expand' }, input = { onExpand: value => calls.push(value), onBack: () => calls.push('back') };
  assert.doesNotMatch(htmlFor(), /查看指标详情/);
  assert.doesNotMatch(htmlFor({ ...input, view: 'workspace' }), /查看指标详情/);
  const before = htmlFor(input);
  button(capture(input), '查看指标详情').props.onClick({ currentTarget: trigger });
  button(capture({ ...input, view: 'workspace' }), '返回原位置').props.onClick();
  assert.deepEqual(calls, [trigger, 'back']); assert.equal(htmlFor(input), before);
});

test('history explicitly shows then-data and its own values, with missing time/version remaining unknown', () => {
  for (const mode of modes) {
    const html = htmlFor({ ...mode, record: { id: record.id, version: '旧 v1', snapshot: true } });
    assert.match(html, /当时数据/); assert.match(html, /数据版本：旧 v1/); assert.match(html, /数据时间：未确认/); assert.match(html, /07\.2500%/);
    assert.doesNotMatch(html, /当前状态|2026-09-25|记录 v7/);
    assert.match(htmlFor({ ...mode, record: { id: record.id, version: '' } }), /数据版本：未确认/);
  }
});

test('workspace keeps group labels, host method and sourced explanations/conclusions/recommendations without inference', () => {
  const statements = [{ kind: 'explanation', text: '原样解释', source: '教师甲' }, { kind: 'conclusion', text: '原样结论', source: '报告 v2' }, { kind: 'recommendation', text: '原样建议', source: '教师乙' }];
  const html = htmlFor({ view: 'workspace', groups: group([{ ...item, statements }]) });
  for (const value of ['学习表现', '统计口径：原样口径说明', '原样解释', '来源：教师甲', '原样结论', '来源：报告 v2', '原样建议', '来源：教师乙']) assert.ok(html.includes(value));
  assert.doesNotMatch(htmlFor({ view: 'workspace' }), /来源：|原样解释|原样结论|原样建议/);
  const noSource = htmlFor({ view: 'workspace', groups: group([{ ...item, statements: [{ kind: 'conclusion', text: h(Forbidden), source: ' ' }] }]) });
  assert.match(noSource, /来源未提供，暂不展示/);
});

test('compact preserves all decision facts and exceptions instead of moving them to collapsed prose', () => {
  const input = { groups: group([{ ...item, reading: { state: 'insufficient', reason: '样本不足原因' } }, { ...item, id: 'missing', reading: { state: 'missing', reason: '缺测原因' } }]), anomalies: [anomaly], onExpand() {} };
  for (const view of ['inline', 'workspace']) {
    assert.equal(textOf(htmlFor({ ...input, view })), textOf(htmlFor({ ...input, view, density: 'compact' })));
    const html = htmlFor({ ...input, view, density: 'compact' });
    for (const value of ['样本不足原因', '缺测原因', '评分记录冲突']) assert.ok(html.includes(value));
    assert.doesNotMatch(html, /truncate|line-clamp/);
  }
});

test('one notice stays visible; extra details and inline methods are closed and independently readable', () => {
  const input = { notice: '唯一边界提示', details: '补充说明文本' };
  const html = htmlFor(input);
  assert.equal(html.split('唯一边界提示').length - 1, 1); assert.doesNotMatch(html, /补充说明文本|原样口径说明/);
  const gate = capture(input).find(node => node.type.name === 'Collapsible');
  assert.equal(gate.props.defaultOpen, false);
  assert.match(render(React.cloneElement(gate, { open: true })), /统计口径：原样口径说明/);
});

test('empty input and unselected keys are explicit without a fabricated zero or arbitrary default KPI', () => {
  assert.match(htmlFor({ groups: [] }), /暂未提供指标/);
  const html = htmlFor({ groups: group([{ ...item, key: false }]), onExpand() {} });
  assert.match(html, /暂未指定关键指标/); assert.doesNotMatch(html, /07\.2500%/);
});

test('two labelled demo purposes render inline/workspace/compact, narrow layout, math and honest examples', async () => {
  for (const purpose of ['learning', 'grading']) {
    const html = render(h(MetricSummaryExample, { purpose, narrow: true }));
    for (const value of ['固定示例', 'data-agent-metric-view="inline"', 'data-agent-metric-view="workspace"', 'data-density="compact"', 'max-w-[320px]', '查看指标详情']) assert.ok(html.includes(value), value);
    assert.doesNotMatch(textOf(html), /宿主|回调|受控|意图/);
    if (purpose === 'learning') { for (const value of ['正确率', '完成率', '样本不足', '缺测', '显著变化', '下降', '<math', '<mfrac>']) assert.ok(html.includes(value), value); }
    else for (const value of ['已复核', '待复核', '异常数', '状态未确认', '访问受限']) assert.ok(html.includes(value), value);
    await writeFile(new URL(`example-${purpose}.html`, runtime), html);
    for (const mode of modes) {
      const snapshot = render(h(AgentMetricSummary, { ...metricSummaryExamples[purpose], ...mode, onExpand() {}, onDrilldown() {} }));
      await writeFile(new URL(`${purpose}-${mode.view ?? 'inline'}-${mode.density ?? 'default'}.html`, runtime), snapshot);
    }
  }
  const demo = render(h(AgentMetricSummaryDemo));
  assert.match(demo, /id="metric-summary"/); assert.match(demo, /班级学情示例/); assert.match(demo, /批阅进度示例/);
});

test('explicit group facts render once, item overrides stay visible, and omitted item fields inherit only declared facts', () => {
  for (const mode of modes) {
    const shared = { id: 'shared', label: '共享记录指标', sample: { size: '36 名学生', denominator: '40 份答卷' }, record: { dataTime: '组级时间', version: '组 v2' }, items: [
      { ...item, sampleSize: undefined, denominator: undefined },
      { ...item, id: 'same', sampleSize: '36 名学生', denominator: '40 份答卷', dataTime: '组级时间', version: '组 v2' },
      { ...item, id: 'different', label: '不同口径', sampleSize: '3 名学生', denominator: '7 项作答', dataTime: '独立时间', version: '指标 v9' },
    ] };
    const html = htmlFor({ ...mode, groups: [shared], onExpand() {} });
    for (const text of ['样本量：36 名学生', '分母：40 份答卷', '数据时间：组级时间', '数据版本：组 v2']) assert.equal(html.split(text).length - 1, 1, text);
    for (const text of ['样本量：3 名学生', '分母：7 项作答', '数据时间：独立时间', '数据版本：指标 v9']) assert.ok(html.includes(text), text);
    assert.match(html, /共享记录指标/);
  }
});

test('sample-only group leaves per-item denominators and record fallbacks untouched; no implicit merging of equal items', () => {
  for (const mode of modes) {
    const items = [item, { ...item, id: 'second' }];
    const legacy = htmlFor({ ...mode, groups: group(items) });
    assert.equal(legacy.split('样本量：3 名学生').length - 1, 2);
    const shared = htmlFor({ ...mode, groups: [{ ...group(items)[0], sample: { size: '3 名学生' } }] });
    assert.equal(shared.split('样本量：3 名学生').length - 1, 1);
    assert.equal(shared.split('分母：7 项作答').length - 1, 2);
    assert.equal(shared.split('数据时间：2026-09-25 10:00').length - 1, 2);
    const partial = htmlFor({ ...mode, groups: [{ ...group(items)[0], record: { dataTime: '组级时间' } }] });
    assert.equal(partial.split('数据时间：组级时间').length - 1, 1);
    assert.equal(partial.split('数据版本：记录 v7').length - 1, 3); // card header + each metric
  }
});

test('group inheritance binds drilldown to effective metric version, preserves card record and never treats empty version as confirmed', () => {
  const events = [];
  const make = version => [{ ...group([{ ...item, change }])[0], record: { version } }];
  const input = { groups: make('组 v2'), onDrilldown: (...args) => events.push(args) };
  const before = htmlFor(input), nodes = capture(input), trigger = { fixture: 'group-button' };
  button(nodes, '查看正确率明细').props.onClick({ currentTarget: trigger });
  allButtons(nodes).find(node => node.props['aria-label'] === '查看正确率变化的依据').props.onClick({ currentTarget: trigger });
  assert.deepEqual(events, [
    [{ recordId: record.id, version: record.version, metricVersion: '组 v2', kind: 'metric', metricId: item.id }, trigger],
    [{ recordId: record.id, version: record.version, metricVersion: '组 v2', kind: 'change', metricId: item.id, basisId: basis.id }, trigger],
  ]);
  assert.equal(htmlFor(input), before);
  const blank = htmlFor({ ...input, groups: make('') });
  assert.match(blank, /数据版本：未确认/); assert.doesNotMatch(blank, /查看正确率明细|aria-label="查看正确率变化的依据/);
});

test('shared metadata does not hide uncertainty, zero or differing unknown fields and is not disclosed for restricted-only or hidden groups', () => {
  for (const mode of modes) {
    const base = { id: 'shared', label: '共享组', sample: { size: '0 名学生' }, record: { dataTime: '组时间', version: '组 v1' } };
    const html = htmlFor({ ...mode, groups: [{ ...base, items: [{ ...item, sampleSize: undefined, denominator: undefined, reading: { state: 'unknown', reason: '记录状态待核验' } }] }] });
    for (const fact of ['样本量：0 名学生', '分母：未提供', '状态未确认', '记录状态待核验']) assert.ok(html.includes(fact));
    const restricted = htmlFor({ ...mode, groups: [{ ...base, sample: { size: secret }, record: { dataTime: secret, version: secret }, items: [{ id: 'restricted', access: 'restricted', disclosure: { reason: '限制原因' } }] }] });
    assert.ok(!restricted.includes(secret)); assert.match(restricted, /限制原因/);
    const denied = htmlFor({ ...mode, scope: { state: 'restricted', disclosure: { reason: '范围受限' } }, groups: [{ ...base, sample: { size: secret }, items: [item] }] });
    assert.ok(!denied.includes(secret));
    if (mode.view !== 'workspace') {
      const hidden = htmlFor({ ...mode, onExpand() {}, groups: [{ ...base, sample: { size: secret }, items: [{ ...item, key: false }] }] });
      assert.ok(!hidden.includes(secret)); assert.match(hidden, /暂未指定关键指标/);
    }
  }
});
