import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = new URL('../.sites-runtime/suggestion-set/', import.meta.url);
await mkdir(runtime, { recursive: true });
const file = new URL('test-bundle.mjs', runtime);
const bundle = await build({ stdin: { contents: `export * from './components/prism-next/agent-suggestion-set'; export * from './components/prism-next/demos/agent-suggestion-set'; export { Button as SuggestionControlButton } from './components/prism-next/button';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false });
await writeFile(file, bundle.outputFiles[0].text);
const { AgentSuggestionSet, AgentSuggestionSetDemo, SuggestionSetExample, SuggestionControlButton } = await import(file);
await rm(file);
const h = React.createElement;
const first = { id: 'opaque-suggestion-a', title: '对照配方过程', content: '逐步核对等式变形。', reason: '先理解再应用', scope: '本次讲评参与者', impact: '预计 5 分钟，效果需核对', certainty: '有限', evidence: { summary: '两处摘录遗漏补偿项', target: { conclusionId: 'opaque-conclusion', version: 'opaque-evidence-version' } }, source: '教师摘录 v1', status: { state: 'pending' }, task: { state: 'not-created' }, adopt: {}, dismiss: { reason: '' } };
const second = { ...first, id: 'opaque-suggestion-b', title: '补充一次追问' };
const restricted = { id: 'opaque-restricted', status: { state: 'restricted' }, disclosure: { title: '受限建议', reason: '超出当前可见范围。' } };
const base = { title: '建议示例', suggestionSet: { id: 'opaque-set', version: 'opaque-version' }, suggestions: [first, second], selectedIds: [], receipt: { state: 'idle' }, comparison: { selectedIds: [], open: false }, adopt: {}, confirm: {}, onIntent() {} };
const envelope = { suggestionSetId: base.suggestionSet.id, baseVersion: base.suggestionSet.version };
const modes = [{}, { view: 'workspace' }, { density: 'compact' }, { view: 'workspace', density: 'compact' }];
const htmlFor = extra => render(h(AgentSuggestionSet, { ...base, ...extra }));
const textOf = html => html.replace(/<[^>]*>/g, '');
const articlesOf = html => [...html.matchAll(/<article\b[^>]*>[\s\S]*?<\/article>/g)].map(match => match[0]);
// Preserve nested button wrappers when locating each complete SSR action row.
function actionRowsOf(html) {
  const stack = [], rows = [];
  for (const match of html.matchAll(/<\/?div\b[^>]*>/g)) {
    if (!match[0].startsWith('</')) stack.push({ start: match.index, action: match[0].includes('data-suggestion-actions=""') });
    else {
      const entry = stack.pop();
      if (entry?.action) rows.push(html.slice(entry.start, match.index + match[0].length));
    }
  }
  return rows;
}
const freeze = value => { if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.freeze(value); Object.values(value).forEach(freeze); } return value; };

// Inspect the real rendered control handlers, not a parallel intent implementation.
function capture(extra) {
  const nodes = [], owned = new Set(['AgentSuggestionSet', 'SuggestionButton', 'SuggestionField', 'SuggestionEvidence', 'RecordDetails']);
  function inspect(node) {
    if (Array.isArray(node)) return node.map(inspect);
    if (!React.isValidElement(node)) return node;
    nodes.push(node);
    if (typeof node.type === 'function' && owned.has(node.type.name)) return h(function Probe() { return inspect(node.type(node.props)); });
    return React.cloneElement(node, {}, React.Children.map(node.props.children, inspect));
  }
  render(inspect(h(AgentSuggestionSet, { ...base, ...extra })));
  return nodes;
}
const button = (nodes, text) => {
  const node = nodes.find(node => node.type === SuggestionControlButton && node.props.onClick && (node.props['aria-label'] === text || React.Children.toArray(node.props.children).includes(text)));
  assert.ok(node, `button: ${text}`); return node;
};
const check = (nodes, title, compare = false) => {
  const node = nodes.find(node => node.props.onCheckedChange && node.props['aria-label'] === `${compare ? '加入比较' : '选择'}：${title}`);
  assert.ok(node, `checkbox: ${title}`); return node;
};

test('SSR inline/workspace and compact preserve independent states and unknown facts without opaque IDs', () => {
  assert.equal(htmlFor(), htmlFor({ view: 'inline', density: 'default' }));
  const states = ['pending', 'adopted', 'adjusted', 'dismissed', 'expired', 'unconfirmed'].map((state, index) => ({ ...first, id: `opaque-state-${index}`, title: `状态样本${index}`, status: { state, reason: `状态原因${index}` } }));
  for (const mode of modes) {
    const html = htmlFor({ ...mode, suggestions: [first, ...states, restricted, { ...second, reason: null, evidence: null, source: null, impact: null, scope: null, certainty: null, task: undefined }], selectedIds: [first.id] });
    for (const label of ['待定', '已选', '已采纳', '已调整', '已驳回', '已过期', '受限', '未确认', '任务未创建', '任务状态未确认', '确定性', '未知', '依据未提供', '超出当前可见范围。']) assert.ok(textOf(html).includes(label), label);
    assert.doesNotMatch(html, /opaque-|已保存|已发布/);
    assert.equal((textOf(html).match(/选择、采纳与创建任务是三件事/g) ?? []).length, 1);
    assert.match(html, new RegExp(`data-suggestion-set-density="${mode.density ?? 'default'}"`));
  }
});

test('identical evidence and sources merge independently, partial references use readable titles and each heading appears once', () => {
  for (const mode of modes) {
    const third = { ...second, id: 'opaque-third', title: '另一种依据', evidence: { summary: '另一个证据摘要' } };
    const html = htmlFor({ ...mode, suggestions: [first, second, third], selectedIds: [first.id], comparison: { selectedIds: [first.id, second.id], open: true } });
    const text = textOf(html);
    assert.equal(text.split(first.evidence.summary).length - 1, 1);
    assert.equal(text.split(first.source).length - 1, 1);
    const headings = [...html.matchAll(/<h4\b[^>]*>(.*?)<\/h4>/g)].map(match => textOf(match[1]));
    for (const title of [first.title, second.title, third.title]) assert.equal(headings.filter(heading => heading.endsWith(title)).length, 1, title);
    assert.match(html, /来源 · 适用全部建议/);
    const articles = articlesOf(html);
    for (const article of articles.slice(0, 2)) {
      assert.ok(article.includes(`共用说明：依据（${first.title}、${second.title}）`));
      assert.doesNotMatch(article, /共用说明：[^<]*来源/);
    }
    assert.doesNotMatch(articles[2], /共用说明/);
    assert.doesNotMatch(html, /依据 1|来源 1|opaque-/);
  }
});

test('all-suggestion facts omit row copies but preserve accessible shared fact associations across themes and modes', () => {
  for (const theme of ['light', 'paper', 'dark']) for (const mode of modes) for (const unknown of [false, true]) {
    const suggestions = unknown ? [first, second].map(item => ({ ...item, evidence: null, source: null })) : [first, second];
    const html = render(h('div', { 'data-ui-version': 'coss-v1', 'data-prism-theme': theme }, h(AgentSuggestionSet, { ...base, ...mode, suggestions })));
    assert.doesNotMatch(html, /共用说明/);
    assert.match(html, /依据 · 适用全部建议/); assert.match(html, /来源 · 适用全部建议/);
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
    for (const article of articlesOf(html)) {
      const refs = article.match(/aria-describedby="([^"]+)"/)[1].split(' ');
      assert.ok(refs.some(ref => ref.endsWith('-evidence-0')));
      assert.ok(refs.some(ref => ref.endsWith('-source-0')));
      for (const ref of refs) assert.ok(ids.includes(ref));
    }
    assert.equal(textOf(html).split(unknown ? '依据未提供' : first.evidence.summary).length - 1, 1);
  }
});

test('partial source groups use readable names and never assume shared facts apply to restricted entries', () => {
  for (const mode of modes) {
    const third = { ...second, id: 'opaque-third', title: '不同来源建议', source: '另一次记录' };
    const html = htmlFor({ ...mode, suggestions: [first, second, third] });
    const articles = articlesOf(html);
    for (const article of articles.slice(0, 2)) {
      assert.ok(article.includes(`共用说明：来源（${first.title}、${second.title}）`));
      assert.doesNotMatch(article, /共用说明：[^<]*依据/);
    }
    assert.doesNotMatch(articles[2], /共用说明/);
    const withRestricted = htmlFor({ ...mode, suggestions: [first, second, restricted] });
    assert.doesNotMatch(withRestricted, /适用全部建议/);
    assert.doesNotMatch(articlesOf(withRestricted)[2], /共用说明|data-suggestion-actions/);
  }
});

test('SSR item action row contains adoption, dismissal, workspace adjustment and appended slot; fields remain outside', () => {
  for (const mode of modes) for (const open of [false, true]) for (const comparing of [false, true]) {
    const item = { ...first, adjustment: { open, fields: [{ id: 'opaque-field', label: '安排', type: 'text', value: '先核对' }] } };
    const seen = [], extra = { ...mode, suggestions: [item, second, restricted], comparison: { selectedIds: [item.id, second.id], open: comparing },
      itemActions: suggestion => { seen.push(suggestion); return h('button', { type: 'button' }, `打开已建立的教学行动：${suggestion.title}`); } };
    const html = htmlFor(extra), articles = articlesOf(html), rows = actionRowsOf(html);
    assert.deepEqual(seen, [item, second]); assert.equal(rows.length, 2);
    for (const [index, row] of rows.entries()) {
      assert.match(row, /class="flex min-w-0 flex-wrap items-start gap-2"/);
      assert.match(row, />采纳<.*>驳回</s);
      assert.ok(row.includes(`打开已建立的教学行动：${seen[index].title}`));
      assert.ok(row.indexOf('>驳回<') < row.indexOf('>打开已建立的教学行动'));
      assert.ok(articles[index].includes(row));
      assert.doesNotMatch(row, /<input|<label|提交调整|收起调整/);
    }
    if (mode.view === 'workspace') {
      assert.ok(articles[0].indexOf('驳回原因（可选）') < articles[0].indexOf('data-suggestion-actions'));
      assert.equal(rows[0].includes('>调整<'), !open);
      if (open) assert.match(articles[0], /调整建议[\s\S]*提交调整[\s\S]*收起调整/);
    } else assert.doesNotMatch(rows[0], />调整</);
    assert.doesNotMatch(articles[2], /打开已建立的教学行动|data-suggestion-actions/);
    assert.equal(htmlFor({ ...extra, itemActions: undefined }), htmlFor({ ...extra, itemActions: () => null }));
  }
});

test('same summary with a different target, version or availability remains separate evidence', () => {
  for (const evidence of [
    { ...first.evidence, target: { ...first.evidence.target, version: 'other-version' } },
    { ...first.evidence, target: { ...first.evidence.target, conclusionId: 'other-conclusion' } },
    { ...first.evidence, unavailableReason: '无法读取记录。' },
  ]) {
    const html = htmlFor({ suggestions: [first, { ...second, evidence }] });
    assert.equal(textOf(html).split(first.evidence.summary).length - 1, 2);
    assert.equal(textOf(html).split(first.source).length - 1, 1);
  }
});

test('selection, adoption and confirmation handlers emit separate version-bound snapshots, without changing facts', () => {
  for (const mode of modes) {
    const calls = [], selectedIds = freeze([first.id]), extra = { ...mode, suggestions: freeze([first, second]), selectedIds, onIntent: value => calls.push(value) };
    const before = htmlFor(extra), nodes = capture(extra);
    check(nodes, second.title).props.onCheckedChange(true);
    check(nodes, first.title).props.onCheckedChange(false);
    button(nodes, `采纳：${second.title}`).props.onClick(); // Adoption does not require or add a selection.
    button(nodes, '确认本次选择').props.onClick();
    assert.deepEqual(calls, [
      { ...envelope, type: 'select', suggestionIds: [second.id], scope: 'item' },
      { ...envelope, type: 'deselect', suggestionIds: [first.id], scope: 'item' },
      { ...envelope, type: 'adopt', suggestionIds: [second.id], scope: 'item' },
      { ...envelope, type: 'confirm', suggestionIds: [first.id] },
    ]);
    assert.notStrictEqual(calls[3].suggestionIds, selectedIds);
    assert.equal(htmlFor(extra), before); assert.doesNotMatch(before, /已采纳|任务已创建/);
  }
});

test('batch select/deselect target the visible list and preserve missing selections until explicitly cleared', () => {
  const calls = [], extra = { view: 'workspace', suggestions: [first, second, restricted, { ...first, id: 'expired', status: { state: 'expired', reason: '过期' } }], selectedIds: freeze([first.id, 'opaque-outside']), onIntent: value => calls.push(value) };
  const nodes = capture(extra);
  button(nodes, '选择当前可选项').props.onClick(); button(nodes, '取消当前列表选择').props.onClick(); button(nodes, '取消全部选择').props.onClick();
  assert.deepEqual(calls, [
    { ...envelope, type: 'select', suggestionIds: [second.id], scope: 'visible' },
    { ...envelope, type: 'deselect', suggestionIds: [first.id], scope: 'visible' },
    { ...envelope, type: 'deselect', suggestionIds: [first.id, 'opaque-outside'], scope: 'selection' },
  ]);
  assert.doesNotMatch(htmlFor(extra), /opaque-outside/);
});

test('batch adoption includes every selected item or blocks the entire batch; no silent filtering', () => {
  const calls = [], selectedIds = freeze([first.id, second.id]);
  button(capture({ view: 'workspace', selectedIds, onIntent: value => calls.push(value) }), '采纳已选建议').props.onClick();
  assert.deepEqual(calls, [{ ...envelope, type: 'adopt', suggestionIds: [first.id, second.id], scope: 'selection' }]);
  assert.notStrictEqual(calls[0].suggestionIds, selectedIds);
  for (const item of [restricted, { ...second, adopt: undefined }, { ...second, adopt: { disabledReason: '' } }, { ...second, status: { state: 'adopted' } }, { ...second, status: { state: 'expired', reason: '范围过期' } }, { ...second, status: { state: 'dismissed' } }, { ...second, status: { state: 'unconfirmed', reason: '原请求未知' } }]) {
    const nodes = capture({ view: 'workspace', suggestions: [first, item], selectedIds: [first.id, item.id], onIntent: value => calls.push(value) });
    const control = button(nodes, '采纳已选建议'); assert.equal(control.props.disabled, true); control.props.onClick();
  }
  assert.equal(calls.length, 1);
});

const fields = freeze([
  { id: 'opaque-text', label: '短提示', type: 'text', value: '先解释' },
  { id: 'opaque-plan', label: '安排', type: 'textarea', value: '先核对再交流' },
  { id: 'opaque-time', label: '时长', type: 'number', value: 5, unit: '分钟' },
  { id: 'opaque-mode', label: '形式', type: 'select', value: 'opaque-pair', options: [{ value: 'opaque-pair', label: '同桌' }, { value: 'opaque-class', label: '全班' }, { value: 'opaque-disabled', label: '线上', disabledReason: '' }] },
]);
const values = Object.fromEntries(fields.map(field => [field.id, field.value]));
const adjustable = { ...first, adjustment: { open: true, fields } };

test('adjust fields return exact changed values and original version, retaining other fields and status until page update', () => {
  const calls = [], extra = { view: 'workspace', suggestions: freeze([adjustable]), onIntent: value => calls.push(value) }, before = htmlFor(extra), nodes = capture(extra);
  nodes.find(node => node.type.name === 'Input' && node.props.value === fields[0].value).props.onChange({ currentTarget: { value: '  不裁剪空白  ' } });
  nodes.find(node => node.type.name === 'Textarea').props.onChange({ currentTarget: { value: '' } });
  const number = nodes.find(node => node.type.name === 'NumberField'); number.props.onValueChange(0); number.props.onValueChange(null); number.props.onValueChange(Infinity);
  const select = nodes.find(node => node.props.items && node.props.onValueChange); select.props.onValueChange('1'); select.props.onValueChange('2'); select.props.onValueChange('999');
  button(nodes, '提交调整').props.onClick(); button(nodes, '收起调整').props.onClick();
  const adjustedValues = [{ ...values, 'opaque-text': '  不裁剪空白  ' }, { ...values, 'opaque-plan': '' }, { ...values, 'opaque-time': 0 }, { ...values, 'opaque-time': null }, { ...values, 'opaque-mode': 'opaque-class' }];
  assert.deepEqual(calls, [
    ...adjustedValues.map(value => ({ ...envelope, type: 'adjust', suggestionId: first.id, phase: 'change', values: value })),
    { ...envelope, type: 'adjust', suggestionId: first.id, phase: 'submit', values },
    { ...envelope, type: 'adjust', suggestionId: first.id, phase: 'cancel', values },
  ]);
  assert.equal(htmlFor(extra), before); assert.doesNotMatch(before, /已调整|opaque-/);
});

test('adjust start is explicit and does not mount editors or discard values until page changes open', () => {
  const calls = [], extra = { view: 'workspace', suggestions: [{ ...adjustable, adjustment: { open: false, fields } }], onIntent: value => calls.push(value) };
  button(capture(extra), `调整：${first.title}`).props.onClick();
  assert.deepEqual(calls, [{ ...envelope, type: 'adjust', suggestionId: first.id, phase: 'start', values }]);
  assert.doesNotMatch(htmlFor(extra), /调整草稿|data-slot="textarea"/);
});

test('field errors block submit but permit correction; disabled fields and missing/duplicate field identities stay read-only', () => {
  const calls = [], error = { ...fields[0], error: '请补充说明。' };
  let nodes = capture({ view: 'workspace', suggestions: [{ ...adjustable, adjustment: { open: true, fields: [error] } }], onIntent: value => calls.push(value) });
  button(nodes, '提交调整').props.onClick(); assert.equal(calls.length, 0);
  nodes.find(node => node.type.name === 'Input' && node.props.value === error.value).props.onChange({ currentTarget: { value: '补充' } }); assert.equal(calls.length, 1);
  for (const fieldList of [[], [fields[0], fields[0]], [{ ...fields[0], id: '' }]]) {
    const extra = { view: 'workspace', suggestions: [{ ...adjustable, adjustment: { open: true, fields: fieldList } }], onIntent: value => calls.push(value) };
    button(capture(extra), '提交调整').props.onClick(); assert.match(htmlFor(extra), /可调整字段未确认/);
  }
  const disabled = capture({ view: 'workspace', suggestions: [{ ...adjustable, adjustment: { open: true, fields: [{ ...fields[0], disabledReason: '' }] } }], onIntent: value => calls.push(value) });
  assert.equal(disabled.filter(node => node.type.name === 'Input' && node.props.value === fields[0].value).length, 0);
  assert.equal(calls.length, 1);
});

test('dismiss reason editing and submission are separate, untrimmed intents and never infer task cancellation', () => {
  const calls = [], item = { ...first, dismiss: { reason: '  负担过重  ' }, task: { state: 'created', description: '原任务仍然存在。' } }, extra = { view: 'workspace', suggestions: [item], onIntent: value => calls.push(value) };
  const nodes = capture(extra);
  nodes.find(node => node.type.name === 'Input' && node.props.value === item.dismiss.reason).props.onChange({ currentTarget: { value: '' } });
  button(nodes, `驳回：${first.title}`).props.onClick();
  assert.deepEqual(calls, [
    { ...envelope, type: 'dismiss', suggestionId: first.id, phase: 'reason', reason: '' },
    { ...envelope, type: 'dismiss', suggestionId: first.id, phase: 'submit', reason: '  负担过重  ' },
  ]);
  assert.match(htmlFor(extra), /任务已创建/); assert.doesNotMatch(htmlFor(extra), /已驳回|已取消/);
  const optional = [];
  button(capture({ suggestions: [{ ...first, dismiss: {} }], onIntent: value => optional.push(value) }), `驳回：${first.title}`).props.onClick();
  assert.deepEqual(optional, [{ ...envelope, type: 'dismiss', suggestionId: first.id, phase: 'submit' }]);
});

test('comparison has its own controlled selection and open/close intents, independent of adoption selection', () => {
  const calls = [], extra = { view: 'workspace', comparison: { selectedIds: [first.id, second.id], open: true }, selectedIds: [], onIntent: value => calls.push(value) }, nodes = capture(extra), before = htmlFor(extra);
  check(nodes, second.title, true).props.onCheckedChange(false); button(nodes, '比较选中建议').props.onClick(); button(nodes, '返回建议列表').props.onClick();
  assert.deepEqual(calls, [
    { ...envelope, type: 'compare', phase: 'select', suggestionIds: [first.id] },
    { ...envelope, type: 'compare', phase: 'show', suggestionIds: [first.id, second.id] },
    { ...envelope, type: 'compare', phase: 'close', suggestionIds: [first.id, second.id] },
  ]);
  assert.equal(htmlFor(extra), before); assert.match(before, /本次已选 0 项/); assert.match(before, /aria-label="建议比较"/);
  for (const ids of [[first.id], [first.id, 'missing'], [first.id, first.id], [first.id, restricted.id]]) {
    const control = button(capture({ view: 'workspace', suggestions: [first, restricted], comparison: { selectedIds: ids, open: true }, onIntent: value => calls.push(value) }), '比较选中建议'); assert.equal(control.props.disabled, true); control.props.onClick();
  }
  assert.equal(calls.length, 3);
});

test('opening merged evidence returns all related suggestion IDs and exact evidence version without creating usage facts', () => {
  const calls = [], extra = { suggestions: freeze([first, second]), onIntent: value => calls.push(value) }, before = htmlFor(extra);
  button(capture(extra), '查看依据').props.onClick();
  assert.deepEqual(calls, [{ ...envelope, type: 'open-evidence', suggestionIds: [first.id, second.id], target: first.evidence.target }]);
  assert.notStrictEqual(calls[0].target, first.evidence.target); assert.equal(htmlFor(extra), before); assert.doesNotMatch(before, /已读取|已引用/);
  for (const evidence of [null, { summary: '缺目标' }, { ...first.evidence, unavailableReason: '' }, { ...first.evidence, target: { conclusionId: '', version: 'v1' } }, { ...first.evidence, target: { conclusionId: 'c', version: '' } }]) assert.doesNotMatch(htmlFor({ suggestions: [{ ...first, evidence }] }), />查看依据</);
});

test('unconfirmed/pending receipts block every write handler while evidence, comparison and navigation remain viewing actions', () => {
  for (const state of ['pending', 'unconfirmed']) {
    const calls = [], extra = { view: 'workspace', suggestions: [adjustable, second], selectedIds: [first.id], receipt: { state }, comparison: { selectedIds: [first.id, second.id], open: false }, onIntent: value => calls.push(value) }, nodes = capture(extra);
    for (const title of ['选择当前可选项', '取消当前列表选择', '采纳已选建议', '确认本次选择', '取消全部选择', '提交调整', `采纳：${first.title}`, `驳回：${first.title}`]) {
      const control = button(nodes, title); assert.equal(control.props.disabled, true, title); control.props.onClick();
    }
    check(nodes, second.title).props.onCheckedChange(true); check(nodes, first.title).props.onCheckedChange(false);
    assert.deepEqual(calls, []); assert.match(htmlFor(extra), state === 'unconfirmed' ? /回执未确认/ : /等待回执/);
    button(nodes, '查看依据').props.onClick(); button(nodes, '比较选中建议').props.onClick(); assert.deepEqual(calls.map(call => call.type), ['open-evidence', 'compare']);
  }
});

test('received and failed receipts never imply adoption, adjustment, or task creation', () => {
  for (const state of ['received', 'failed']) {
    const html = htmlFor({ receipt: { state, message: '独立操作记录' } });
    assert.match(html, /独立操作记录/); assert.match(html, /待定/); assert.match(html, /任务未创建/); assert.doesNotMatch(html, /已采纳|已调整|任务已创建/);
  }
  for (const mode of modes) assert.match(htmlFor({ ...mode, suggestions: [{ ...first, status: { state: 'adopted' }, task: undefined }] }), /已采纳[\s\S]*任务状态未确认/);
});

test('restricted entries never render supplied private content, fields, provenance, tasks, or evidence targets', () => {
  function Secret() { throw new Error('restricted content mounted'); }
  const secret = { ...first, ...restricted, title: 'SECRET_TITLE', content: h(Secret), reason: 'SECRET_REASON', source: 'SECRET_SOURCE', evidence: { summary: 'SECRET_BASIS', target: first.evidence.target }, task: { state: 'created', description: 'SECRET_TASK' }, adjustment: { open: true, fields }, dismiss: { reason: 'SECRET_DISMISS' } };
  for (const mode of modes) {
    const html = htmlFor({ ...mode, suggestions: [secret], selectedIds: [restricted.id], comparison: { selectedIds: [restricted.id, 'missing'], open: true } });
    assert.doesNotMatch(html, /SECRET_|opaque-|调整草稿|任务已创建/); assert.match(html, /超出当前可见范围/);
  }
});

test('missing identities, receiver, explicit empty disabled reasons and history guard real write handlers', () => {
  for (const extra of [{ onIntent: undefined }, { suggestionSet: { id: '', version: 'v1' } }, { suggestionSet: { id: 'set', version: '' } }, { suggestions: [first, first] }, { suggestions: [{ ...first, id: '' }] }, { disabledReason: '' }, { suggestionSet: { ...base.suggestionSet, snapshot: true } }]) {
    const calls = [], nodes = capture({ view: 'workspace', selectedIds: [first.id], onIntent: value => calls.push(value), ...extra });
    for (const title of ['选择当前可选项', '采纳已选建议', '确认本次选择', '取消全部选择']) { const control = button(nodes, title); assert.equal(control.props.disabled, true); control.props.onClick(); }
    assert.deepEqual(calls, []);
  }
  const calls = [], nodes = capture({ view: 'workspace', suggestions: [{ ...adjustable, disabledReason: '' }], selectedIds: [], onIntent: value => calls.push(value) });
  check(nodes, first.title).props.onCheckedChange(true); button(nodes, `采纳：${first.title}`).props.onClick(); button(nodes, '提交调整').props.onClick(); button(nodes, `驳回：${first.title}`).props.onClick(); assert.deepEqual(calls, []);
});

test('missing/duplicate/expired/restricted selections cannot be confirmed but can be explicitly deselected', () => {
  for (const extra of [{ selectedIds: ['missing'] }, { selectedIds: [first.id, first.id] }, { suggestions: [restricted], selectedIds: [restricted.id] }, { suggestions: [{ ...first, status: { state: 'expired', reason: '已过期' } }], selectedIds: [first.id] }]) {
    const calls = [], nodes = capture({ ...extra, onIntent: value => calls.push(value) });
    button(nodes, '确认本次选择').props.onClick(); assert.equal(calls.length, 0);
    button(nodes, '取消全部选择').props.onClick(); assert.equal(calls[0].type, 'deselect');
  }
});

test('compact preserves fixed labels, accessible description targets and collapsed supplementary details', () => {
  for (const extra of [{ suggestions: [adjustable, restricted] }, { suggestions: [{ ...first, disabledReason: '' }] }, { disabledReason: '' }, { suggestions: [{ ...first, status: { state: 'unconfirmed', reason: '等待原请求核对' } }] }]) {
    const html = htmlFor({ view: 'workspace', density: 'compact', details: 'SUPPLEMENTARY_ONLY', ...extra });
    assert.doesNotMatch(html, /SUPPLEMENTARY_ONLY/); assert.match(html, /aria-expanded="false"/); assert.match(html, /pointer-coarse:min-h-11/);
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]); assert.equal(new Set(ids).size, ids.length);
    for (const attr of ['aria-describedby', 'aria-labelledby']) for (const match of html.matchAll(new RegExp(`${attr}="([^"]+)"`, 'g'))) for (const id of match[1].split(' ')) assert.ok(ids.includes(id), `${attr}: ${id}`);
  }
});

test('expand forwards original trigger; back and missing capabilities never create an action or state', () => {
  const calls = [], trigger = {};
  button(capture({ onExpand: value => calls.push(value) }), '展开比较与调整').props.onClick({ currentTarget: trigger });
  button(capture({ view: 'workspace', onBack: () => calls.push('back') }), '返回原位置').props.onClick();
  assert.deepEqual(calls, [trigger, 'back']);
  const html = htmlFor({ suggestions: [{ ...first, adopt: undefined, dismiss: undefined }], confirm: undefined });
  assert.doesNotMatch(html, /展开比较与调整|返回原位置|确认本次选择|>采纳<|>驳回</);
  assert.match(htmlFor({ suggestions: [] }), /当前没有建议/);
});

test('two labelled demo groups provide comparison, adjustment, narrow layout, math and separate receipts', async () => {
  for (const purpose of ['teaching', 'learning']) {
    const html = render(h(SuggestionSetExample, { purpose, narrow: true }));
    for (const text of ['固定示例', 'max-w-[320px]', 'data-suggestion-set-view="inline"', 'data-suggestion-set-view="workspace"', 'data-suggestion-set-density="compact"', '建议比较', '调整草稿', '载入操作回执', '载入任务记录']) assert.ok(html.includes(text), `${purpose}: ${text}`);
    // Keep node boundaries: adjacent “驳回” and “调整草稿” are not the term “回调”.
    assert.doesNotMatch(html.replace(/<[^>]*>/g, ' '), /意图|宿主|回调|适配器|opaque-/);
    if (purpose === 'teaching') {
      for (const text of ['已采纳', '已驳回', '已过期', '受限', '未确认', '<mfrac>', '附加操作示例', '尚未接入创建服务']) assert.ok(html.includes(text), text);
      assert.equal(html.split('>据此建立教学行动（示例）<').length - 1, 1);
      assert.match(actionRowsOf(html)[0], /<button[^>]*disabled[^>]*>据此建立教学行动（示例）<\/button>/);
    }
    else { assert.match(html, /未使用个人学情/); assert.match(html, /已调整/); assert.match(html, /依据未提供/); }
    await writeFile(new URL(`ssr-${purpose}.html`, runtime), html);
  }
  assert.match(render(h(AgentSuggestionSetDemo)), /id="suggestion-set"/);
  assert.match(await readFile(new URL('../components/prism-next/demos/learning-components.tsx', import.meta.url), 'utf8'), /<AgentSuggestionSetDemo\/>/);
});

test('copy polish: per-suggestion repeated disabled reasons have one accessible explanation, including open adjustment', () => {
  const reason = '未确认前不能重复操作。';
  for (const mode of modes) for (const open of [false, true]) {
    const item = { ...first, status: { state: 'unconfirmed', reason }, adjustment: { open, fields: [{ id: 'field', label: '次数', type: 'number', value: 1 }] } };
    const html = htmlFor({ ...mode, suggestions: [item] });
    assert.equal(textOf(html).split(reason).length - 1, 1);
    for (const [, refs] of html.matchAll(/aria-describedby="([^"]+)"/g)) for (const ref of refs.split(' ')) assert.ok(html.includes(`id="${ref}"`), ref);
    const explicit = htmlFor({ ...mode, suggestions: [{ ...item, status: { state: 'pending' }, adopt: { disabledReason: reason }, adjustment: { ...item.adjustment, disabledReason: reason }, dismiss: { disabledReason: reason } }] });
    assert.equal(textOf(explicit).split(reason).length - 1, 1);
    const distinct = htmlFor({ ...mode, suggestions: [{ ...first, adopt: { disabledReason: '采纳能力暂不可用' }, dismiss: { disabledReason: '驳回能力暂不可用' } }] });
    for (const phrase of ['采纳能力暂不可用', '驳回能力暂不可用']) assert.equal(textOf(distinct).split(phrase).length - 1, 1);
    const global = htmlFor({ ...mode, suggestions: [item, second], selectedIds: [first.id], receipt: { state: 'unconfirmed' } });
    assert.equal(textOf(global).split('请先核对原请求，结果未确认前不能重复操作。').length - 1, 1);
  }
});

test('copy polish: wholly missing suggestion details form one line, while supplied facts retain individual fields', () => {
  for (const mode of modes) {
    const missing = { ...first, reason: null, scope: null, impact: null, certainty: null };
    const html = htmlFor({ ...mode, suggestions: [missing] });
    assert.match(html, /<p[^>]*>理由：未提供；适用对象／范围：未指定；预期影响／代价、确定性：未知<\/p>/);
    assert.doesNotMatch(html, /<dt[^>]*>理由<\/dt>/);
    const known = htmlFor({ ...mode, suggestions: [{ ...missing, reason: first.reason }] });
    assert.match(known, /<dt[^>]*>理由<\/dt>/); assert.ok(known.includes(first.reason));
    assert.match(known, /<dt[^>]*>确定性<\/dt>/); assert.match(known, />未知<\/dd>/);
    const explicit = htmlFor({ ...mode, suggestions: [{ ...missing, reason: '未提供', scope: '未知', certainty: '未知' }] });
    assert.match(explicit, /适用对象／范围、预期影响／代价、确定性：未知/);
  }
});
