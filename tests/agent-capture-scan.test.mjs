import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = new URL('../.sites-runtime/capture-scan/', import.meta.url);
await mkdir(runtime, { recursive: true });
const file = new URL('test-bundle.mjs', runtime);
const bundle = await build({ stdin: { contents: `export * from './components/prism-next/agent-capture-scan'; export * from './components/prism-next/demos/agent-capture-scan';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false });
await writeFile(file, bundle.outputFiles[0].text);
const { AgentCaptureScan, AgentCaptureScanDemo, CaptureScanExample, captureScanExamples, applyCaptureExample } = await import(file);
await rm(file);
const h = React.createElement;
const actions = { inspect: {}, recapture: {}, reorder: {}, remove: {} };
const captureSet = { id: 'opaque-set', title: '数学作答页集合', version: { id: 'opaque-version', label: '页集二版' } };
const page = (number, quality = { state: 'clear' }) => ({ id: `opaque-page-${number}`, name: `第 ${number} 页`, source: '课堂作答样本', capturedAt: '2026-09-26 09:30', quality, needsRecapture: false, usage: { state: 'unused' }, actions });
const pages = [page(1), { ...page(2, { state: 'skewed', reason: '左侧题号略有倾斜。' }) },
  { ...page(3, { state: 'blurry', reason: '分式与指数模糊，请重新采集。' }), needsRecapture: true },
  { ...page(4), usage: { state: 'used', label: '数学批阅', removalImpact: '删除将使本次批阅缺少原始作答，请核对受影响记录。' } }];
const props = { captureSet, pages, capturedCount: 4, totalPages: 4, qualitySummary: '清晰两页，其余待检查。', receipt: { state: 'idle' }, save: { state: 'unsaved' }, actions: { capture: {}, confirm: {} }, onIntent() {} };
const context = { setId: captureSet.id, versionId: captureSet.version.id };
const modes = [{ view: 'inline' }, { view: 'workspace' }, { view: 'inline', density: 'compact' }, { view: 'workspace', density: 'compact' }];
const htmlFor = extra => render(h(AgentCaptureScan, { ...props, ...extra }));
const textOf = html => html.replace(/<[^>]*>/g, '');
const count = (text, term) => text.split(term).length - 1;
const childrenText = node => Array.isArray(node) ? node.map(childrenText).join('') : React.isValidElement(node) ? childrenText(node.props.children) : typeof node === 'string' || typeof node === 'number' ? String(node) : '';
// Exercise component-created callbacks. This is not browser/keyboard/drag acceptance.
function capture(extra = {}) {
  const nodes = [];
  function inspect(node) {
    if (Array.isArray(node)) return node.map(inspect);
    if (!React.isValidElement(node)) return node;
    if (node.type === AgentCaptureScan) return h(function Probe() { return inspect(node.type(node.props)); });
    nodes.push(node);
    return React.cloneElement(node, {}, React.Children.map(node.props.children, inspect));
  }
  render(inspect(h(AgentCaptureScan, { ...props, view: 'workspace', ...extra })));
  return nodes;
}
const controls = (nodes, action) => nodes.filter(node => node.props['data-capture-action'] === action);
const button = (nodes, action, index = 0) => controls(nodes, action)[index];
const textButton = (nodes, text, index = 0) => nodes.filter(node => node.props.onClick && childrenText(node) === text)[index];
const positions = nodes => nodes.filter(node => node.props['data-capture-position'] !== undefined);
const event = () => ({ preventDefault() {}, stopPropagation() {}, dataTransfer: { values: [], setData(type, value) { this.values.push([type, value]); } } });
const activated = (extra = {}) => ({ ...context, pageId: pages[0].id, requestedBy: 'user', state: 'ready', ...extra });
function freeze(value) { if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.freeze(value); Object.values(value).forEach(freeze); } return value; }

test('SSR: two views, both densities and theme wrappers preserve supplied facts and readable identity', () => {
  for (const theme of ['light', 'paper', 'dark']) for (const mode of modes) {
    const html = render(h('div', { 'data-ui-version': 'coss-v1', 'data-prism-theme': theme }, h(AgentCaptureScan, { ...props, ...mode })));
    const text = textOf(html);
    for (const phrase of [captureSet.title, '页集二版', '已采集 4 页', '总页数 4 页', '未保存', '清晰', '模糊', '倾斜', '需要补采', '已用于后续处理', pages[3].usage.removalImpact]) assert.ok(text.includes(phrase), phrase);
    assert.equal(count(text, captureSet.title), 1);
    for (const row of pages) assert.equal(count(text, row.name), 1);
    assert.equal(count(html, 'data-capture-boundary'), 1);
    assert.doesNotMatch(html, /opaque-|宿主|意图|回调|受控|条目 \d| ·  · |。；/);
    if (mode.view === 'inline') assert.doesNotMatch(html, /移到位置|申请删除|data-capture-drag/);
    else assert.ok(html.indexOf(pages[0].name) < html.indexOf(pages[3].name));
  }
});

test('all six quality values are external facts; skew, cropped and glare do not infer recapture', () => {
  const values = ['clear', 'blurry', 'skewed', 'cropped', 'glare', 'unknown'];
  const rows = values.map((state, index) => ({ ...page(index + 1, { state, reason: state === 'unknown' ? undefined : `页面检查说明${index}。` }), needsRecapture: state === 'blurry' }));
  for (const mode of modes) {
    const html = htmlFor({ ...mode, pages: rows });
    for (const label of ['清晰', '模糊', '倾斜', '缺角', '反光', '未知：质量。']) assert.ok(textOf(html).includes(label), label);
    assert.equal(count(textOf(html), '需要补采'), 1);
    for (let index = 0; index < 5; index++) assert.ok(html.includes(`页面检查说明${index}。`));
  }
});

test('inline limit never hides quality, recapture, usage or locks; without expand all pages remain', () => {
  const rows = [page(1), page(2), ...pages.slice(2), { ...page(5), lockedReason: '请先核对原稿版本。' }];
  const html = htmlFor({ pages: rows, inlineLimit: 1, onExpand() {} });
  assert.doesNotMatch(html, /第 2 页/);
  for (const row of [rows[0], ...rows.slice(2)]) assert.ok(html.includes(row.name));
  assert.match(html, /管理页集合/);
  assert.match(htmlFor({ pages: rows, inlineLimit: 1 }), /第 2 页/);
  assert.doesNotMatch(htmlFor(), /管理页集合/);
});

test('counts and quality summary come from the page, including zero and unknown total', () => {
  assert.match(textOf(htmlFor({ capturedCount: 9, totalPages: 12 })), /已采集 9 页 · 总页数 12 页/);
  assert.match(htmlFor({ pages: [], capturedCount: 0, totalPages: 0 }), /已采集 0 页 · 总页数 0 页/);
  for (const totalPages of [null, NaN, Infinity, -1, 2.5]) {
    const html = htmlFor({ totalPages });
    assert.match(html, /未知：总页数。/); assert.doesNotMatch(html, /总页数 4 页|NaN|Infinity/);
  }
  const html = htmlFor({ capturedCount: null, totalPages: null, qualitySummary: null, save: { state: 'unknown' }, receipt: { state: 'unknown' } });
  assert.match(html, /未知：已采集页数、总页数、质量摘要、保存状态、采集状态。/);
  assert.equal(count(html, 'data-capture-unknown="set"'), 1);
});

test('unconfirmed receipt blocks every mutation but preserves inspection and navigation', () => {
  const calls = [], receipt = { state: 'unconfirmed', operation: 'capture', request: { id: 'opaque-request', label: '本轮板书采集' }, reason: '本轮结果尚未返回。' };
  const extra = { receipt, onIntent: intent => calls.push(intent) }, nodes = capture(extra), html = htmlFor(extra);
  assert.match(html, /采集回执未确认 · 本轮板书采集/); assert.match(html, /请先核对原采集请求/);
  assert.doesNotMatch(html, /opaque-request|采集失败|重新提交|重试采集/);
  for (const action of ['capture', 'confirm', 'recapture', 'remove', 'reorder']) for (const node of controls(nodes, action)) { assert.equal(node.props.disabled, true); node.props.onClick(); }
  positions(nodes)[0].props.onValueChange('2'); assert.equal(calls.length, 0);
  button(nodes, 'inspect').props.onClick(); assert.deepEqual(calls, [{ ...context, type: 'inspect-page', pageId: pages[0].id }]);
  assert.equal(count(textOf(html), '请先核对原采集请求，确认前暂不改动页集合。'), 1);
});

test('running capture/upload progress never invents percentages or completion, even at 100%', () => {
  for (const operation of ['capture', 'upload']) {
    const receipt = { state: 'running', operation, request: { id: 'opaque-request', label: '本轮采集' } };
    for (const progress of [undefined, NaN, Infinity, -1, 101]) {
      const html = htmlFor({ receipt: { ...receipt, progress } });
      assert.match(html, /未知：进度。/); assert.doesNotMatch(html, /aria-valuenow|NaN|Infinity|已完成/);
    }
    for (const progress of [0, 45, 100]) {
      const html = htmlFor({ receipt: { ...receipt, progress } });
      assert.ok(html.includes(`进度：${progress}%`)); assert.doesNotMatch(html, /采集已完成|上传已完成|>已识别</);
    }
  }
});

test('capture, recapture and confirmation emit exact set/version context without mutating input', () => {
  const frozen = freeze(structuredClone(pages)), calls = [], nodes = capture({ pages: frozen, onIntent: intent => calls.push(intent) });
  button(nodes, 'capture').props.onClick(); button(nodes, 'recapture', 2).props.onClick(); button(nodes, 'confirm').props.onClick();
  assert.deepEqual(calls, [{ ...context, type: 'capture-request' }, { ...context, type: 'recapture-request', pageId: pages[2].id }, { ...context, type: 'confirm-set' }]);
  assert.deepEqual(frozen, pages); assert.match(htmlFor({ pages: frozen }), /未保存/);
});

test('up/down and specified position have equivalent final-index semantics and reject invalid positions', () => {
  const calls = [], frozen = freeze(structuredClone(pages)), nodes = capture({ pages: frozen, onIntent: intent => calls.push(intent) });
  textButton(nodes, '下移').props.onClick(); textButton(nodes, '上移', 1).props.onClick(); positions(nodes)[0].props.onValueChange('3');
  positions(nodes)[0].props.onValueChange('0'); positions(nodes)[0].props.onValueChange('99'); positions(nodes)[0].props.onValueChange('bad');
  assert.deepEqual(calls, [{ ...context, type: 'reorder', pageId: pages[0].id, toIndex: 1, via: 'down' },
    { ...context, type: 'reorder', pageId: pages[1].id, toIndex: 0, via: 'up' }, { ...context, type: 'reorder', pageId: pages[0].id, toIndex: 3, via: 'to-position' }]);
  assert.deepEqual(frozen, pages);
  assert.equal(textButton(nodes, '上移').props.disabled, true); assert.equal(textButton(nodes, '下移', 3).props.disabled, true);
  assert.match(htmlFor({ view: 'workspace' }), /已在首位，不能上移/); assert.match(htmlFor({ view: 'workspace' }), /已在末位，不能下移/);
});

test('drag remains instance-local, clears on end/drop, and transports no business identity', () => {
  const calls = [], nodes = capture({ onIntent: intent => calls.push(intent) }), foreign = capture({ onIntent: intent => calls.push(intent) });
  const handle = nodes.find(node => node.props['data-capture-drag'] === 0), end = nodes.find(node => 'data-capture-drop-end' in node.props);
  const foreignEnd = foreign.find(node => 'data-capture-drop-end' in node.props);
  end.props.onDrop(event()); assert.equal(calls.length, 0);
  const start = event(); handle.props.onDragStart(start); foreignEnd.props.onDrop(event()); assert.equal(calls.length, 0);
  assert.deepEqual(start.dataTransfer.values, [['text/plain', 'capture-page']]);
  end.props.onDrop(event()); end.props.onDrop(event());
  assert.deepEqual(calls, [{ ...context, type: 'reorder', pageId: pages[0].id, toIndex: 3, via: 'drag' }]);
  handle.props.onDragStart(event()); handle.props.onDragEnd(); end.props.onDrop(event()); assert.equal(calls.length, 1);
});

test('locked positions cannot be crossed by buttons, position picker or drag', () => {
  for (const lock of [{ lockedReason: '此页顺序已冻结。' }, { actions: { ...actions, reorder: { disabledReason: '此页顺序已冻结。' } } }, { actions: { inspect: {} } }]) {
    const rows = pages.map((row, index) => index === 1 ? { ...row, ...lock } : row), calls = [];
    const nodes = capture({ pages: rows, onIntent: intent => calls.push(intent) });
    textButton(nodes, '下移').props.onClick(); positions(nodes)[0].props.onValueChange('3');
    nodes.find(node => node.props['data-capture-drag'] === 0).props.onDragStart(event()); nodes.find(node => 'data-capture-drop-end' in node.props).props.onDrop(event());
    assert.equal(calls.length, 0);
  }
});

test('deleting a used page shows its impact and requests host confirmation; unused delete remains reversible host work', () => {
  const calls = [], nodes = capture({ onIntent: intent => calls.push(intent) });
  button(nodes, 'remove', 3).props.onClick(); button(nodes, 'remove', 0).props.onClick();
  assert.deepEqual(calls, [{ ...context, type: 'remove-page', pageId: pages[3].id, requiresConfirmation: true }, { ...context, type: 'remove-page', pageId: pages[0].id, requiresConfirmation: false }]);
  for (const mode of modes) assert.match(htmlFor(mode), /删除影响：删除将使本次批阅缺少原始作答，请核对受影响记录。/);
  assert.ok(button(nodes, 'remove', 3).props['aria-describedby']); assert.equal(pages.length, 4);
  for (const usage of [{ state: 'unknown' }, { state: 'used', label: '数学批阅', removalImpact: '' }]) {
    let attempts = 0; const control = button(capture({ pages: [{ ...pages[0], usage }], onIntent: () => attempts++ }), 'remove');
    assert.equal(control.props.disabled, true); control.props.onClick(); assert.equal(attempts, 0);
  }
});

test('save conflicts, waiting receipts and history protect changes while keeping preview available', () => {
  for (const extra of [{ save: { state: 'saving' } }, { save: { state: 'conflict', description: '页集已由另一位教师更新。' } }, { save: { state: 'unconfirmed' } },
    { captureSet: { ...captureSet, snapshot: '当时记录' } }, { readOnlyReason: '' }, { receipt: { state: 'received', operation: 'upload', request: { id: 'request', label: '本轮上传' } } }, { receipt: { state: 'unknown' } }]) {
    const calls = [], nodes = capture({ ...extra, onIntent: intent => calls.push(intent) });
    for (const action of ['capture', 'confirm', 'recapture', 'remove', 'reorder']) for (const control of controls(nodes, action)) { assert.equal(control.props.disabled, true); control.props.onClick(); }
    assert.equal(calls.length, 0); assert.equal(button(nodes, 'inspect').props.disabled, false);
  }
});

test('shared reasons render once, page titles once, with readable partial scopes and resolvable accessible associations', () => {
  const reason = '请先核对清晰的原始作答。';
  const rows = pages.map(row => ({ ...row, source: reason, quality: { state: 'blurry', reason }, actions: { ...actions, recapture: { disabledReason: reason }, remove: { disabledReason: reason } } }));
  const html = htmlFor({ view: 'workspace', pages: rows, qualitySummary: reason }), text = textOf(html);
  assert.equal(count(text, reason), 1); assert.equal(count(text, '2026-09-26 09:30'), 1);
  for (const row of rows) assert.equal(count(text, row.name), 1);
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]));
  for (const match of html.matchAll(/aria-(?:describedby|labelledby)="([^"]+)"/g)) for (const target of match[1].split(' ')) assert.ok(ids.has(target), target);
  const partial = htmlFor({ view: 'workspace', pages: pages.map((row, index) => index < 2 ? { ...row, quality: { state: 'skewed', reason } } : row) });
  assert.match(textOf(partial), /第 1 页、第 2 页 · 质量原因/); assert.doesNotMatch(partial, /条目 \d|。；|。\./);
});

test('unknown page fields consolidate into one line and never imply clear quality or unused status', () => {
  for (const mode of modes) {
    const html = htmlFor({ ...mode, pages: [{ ...pages[0], source: null, capturedAt: null, quality: { state: 'unknown' }, needsRecapture: null, usage: { state: 'unknown' }, actions: { inspect: {} } }], qualitySummary: null });
    assert.match(html, /未知：来源、采集时间、质量、补采需求、后续使用。/);
    assert.equal(count(html, 'data-capture-unknown="page"'), 1); assert.doesNotMatch(html, />清晰<|未用于后续处理/);
  }
});

test('large URL and preview slot are absent until an explicit matching user activation is ready', () => {
  const rows = [{ ...pages[0], thumbnailUrl: 'https://example.invalid/thumb.png', previewUrl: 'https://example.invalid/large.png' }];
  for (const preview of [undefined, null, activated({ requestedBy: undefined }), activated({ setId: 'other' }), activated({ versionId: 'old' }), activated({ pageId: 'missing' }), activated({ state: 'loading' }), activated({ state: 'error' })]) {
    let mounts = 0;
    const html = htmlFor({ view: 'workspace', pages: rows, preview, renderPreview: () => { mounts++; return h('p', null, '大图内容'); } });
    assert.equal(mounts, 0); assert.doesNotMatch(html, /large.png|大图内容/); assert.match(html, /thumb.png/); assert.match(html, /loading="lazy"/);
  }
  const html = htmlFor({ pages: rows, preview: activated() }); assert.match(html, /large.png/); assert.doesNotMatch(html, /rel="preload"/);
});

test('preview renderer mounts on the selected page only and never changes quality or usage facts', () => {
  for (const mode of modes) {
    const calls = [], html = htmlFor({ ...mode, preview: activated({ pageId: pages[2].id }), renderPreview: (page, context) => { calls.push({ page, context }); return h('p', null, '人工原稿内容'); } });
    assert.equal(calls.length, 1); assert.equal(calls[0].page, pages[2]); assert.deepEqual(calls[0].context, { view: mode.view, density: mode.density ?? 'default' });
    assert.match(html, /人工原稿内容/); assert.match(html, /模糊/); assert.match(html, /需要补采/); assert.equal(count(textOf(html), pages[2].name), 1);
  }
});

test('revoked inspection, duplicate identity and stale versions unmount preview and guard callbacks', () => {
  for (const extra of [{ pages: [pages[0], pages[0]] }, { pages: [{ ...pages[0], actions: {} }] }, { pages: [{ ...pages[0], actions: { inspect: { disabledReason: '当前不可查看原稿。' } } }] }, { captureSet: { ...captureSet, version: { id: 'new-version', label: '页集三版' } } }]) {
    let mounts = 0; const html = htmlFor({ ...extra, preview: activated(), renderPreview: () => { mounts++; return '原稿'; } });
    assert.equal(mounts, 0); assert.match(html, /预览对应的页面、版本或查看能力已变化/);
  }
  for (const extra of [{ captureSet: { ...captureSet, id: '' } }, { pages: [pages[0], pages[0]] }, { onIntent: undefined }]) {
    const nodes = capture(extra);
    for (const action of ['capture', 'confirm', 'inspect', 'recapture', 'remove', 'reorder']) for (const control of controls(nodes, action)) assert.equal(control.props.disabled, true);
  }
});

test('inspect emits a request without loading a large image until the page returns preview props', () => {
  const calls = [], rows = [{ ...pages[0], previewUrl: 'https://example.invalid/large.png' }];
  const extra = { pages: rows, onIntent: intent => calls.push(intent) }, before = htmlFor(extra);
  button(capture(extra), 'inspect').props.onClick();
  assert.deepEqual(calls, [{ ...context, type: 'inspect-page', pageId: pages[0].id }]);
  assert.equal(htmlFor(extra), before); assert.doesNotMatch(before, /large.png/);
});

test('expand/back only navigate, details start collapsed, and empty-set confirmation is blocked', () => {
  const navigation = [], intents = [], trigger = {}, extra = { onExpand: element => navigation.push(element), onBack: () => navigation.push('back'), onIntent: intent => intents.push(intent) };
  textButton(capture({ ...extra, view: 'inline' }), '管理页集合').props.onClick({ currentTarget: trigger });
  textButton(capture(extra), '返回原位置').props.onClick(); assert.deepEqual(navigation, [trigger, 'back']); assert.equal(intents.length, 0);
  const html = htmlFor({ details: h('p', null, '折叠补充文字'), notice: '采集边界提示。' });
  assert.match(html, /说明/); assert.doesNotMatch(html, /折叠补充文字/); assert.equal(count(textOf(html), '采集边界提示。'), 1);
  const empty = button(capture({ pages: [] }), 'confirm'); assert.equal(empty.props.disabled, true); empty.props.onClick();
});

test('demo fixtures expose paper and board cases, three usages, narrow containers and lazy DocumentRegionViewer', () => {
  for (const purpose of ['paper', 'board']) {
    const html = render(h(CaptureScanExample, { purpose, narrow: true }));
    for (const label of ['固定示例', 'max-w-[320px]', '快速采集', '批量页与页序', '紧凑采集摘要']) assert.ok(html.includes(label), label);
    assert.doesNotMatch(html, /review-sheet-viewport/); // Large preview is not mounted on initial render.
    if (purpose === 'paper') { assert.match(html, /已采集 4 页/); assert.match(html, /需要补采/); assert.match(html, /本次数学批阅/); }
    else { assert.match(html, /未知：总页数、质量摘要。/); assert.match(html, /采集回执未确认/); }
  }
  assert.match(render(h(AgentCaptureScanDemo)), /id="capture-scan"/);
});

test('demo host preserves stale/unknown requests and used pages until a separate version-bound confirmation', () => {
  const initial = captureScanExamples.paper, base = { setId: initial.captureSet.id, versionId: initial.captureSet.version.id };
  const intent = { ...base, type: 'remove-page', pageId: initial.pages[3].id, requiresConfirmation: true };
  assert.equal(applyCaptureExample(initial, intent), initial);
  const changed = applyCaptureExample(initial, intent, true); assert.equal(changed.pages.length, 3); assert.notEqual(changed.captureSet.version.id, base.versionId); assert.equal(initial.pages.length, 4);
  assert.equal(applyCaptureExample(changed, intent, true), changed);
  for (const type of ['capture-request', 'confirm-set', 'recapture-request', 'inspect-page']) assert.equal(applyCaptureExample(initial, { ...base, type, pageId: initial.pages[0].id }), initial);
  const board = captureScanExamples.board;
  assert.equal(applyCaptureExample(board, { setId: board.captureSet.id, versionId: board.captureSet.version.id, type: 'remove-page', pageId: board.pages[0].id, requiresConfirmation: false }, true), board);
  const reordered = applyCaptureExample(initial, { ...base, type: 'reorder', pageId: initial.pages[0].id, toIndex: 3, via: 'down' });
  assert.equal(reordered.pages[3], initial.pages[0]); assert.equal(reordered.pages[1].quality.state, 'blurry');
});

test('production component stays free of device, processing, storage, polling and business execution APIs', async () => {
  const source = await readFile(new URL('../components/prism-next/agent-capture-scan.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /getUserMedia|mediaDevices|FileReader|createObjectURL|localStorage|sessionStorage|setTimeout|setInterval|requestAnimationFrame|fetch\(|Date\(|canvas|getImageData|ole-school-workbench|useTeacherStore|dangerouslySetInnerHTML/);
  const demo = await readFile(new URL('../components/prism-next/demos/agent-capture-scan.tsx', import.meta.url), 'utf8');
  assert.match(demo, /DocumentRegionViewer/); assert.doesNotMatch(demo, /setTimeout|setInterval|getUserMedia|FileReader|fetch\(/);
});

test('copy polish 3: repeated unknowns group across the complete collection, mixed times stay with each page', () => {
  for (const mode of modes) {
    const rows = [page(1), page(2), page(3)].map(row => ({ ...row, source: null, capturedAt: null }));
    const html = htmlFor({ ...mode, pages: rows });
    assert.match(textOf(html), /来源、采集时间：全部页未知。/);
    assert.equal(count(html, 'data-capture-unknown="pages"'), 1);
    assert.doesNotMatch(html, /data-capture-unknown="page"/);
    const mixed = htmlFor({ ...mode, pages: [{ ...rows[0], capturedAt: '上午九点' }, { ...rows[1], capturedAt: '上午九点' }, rows[2]] });
    assert.equal(count(textOf(mixed), '采集时间：上午九点'), 2);
    assert.equal(count(textOf(mixed), '未知：采集时间。'), 1);
    assert.match(textOf(mixed), /来源：全部页未知。/);
    assert.doesNotMatch(mixed, /采集时间：全部页未知/);
  }
  const hiddenKnown = htmlFor({ pages: [{ ...page(1), capturedAt: null }, page(2)], inlineLimit: 1, onExpand() {} });
  assert.match(hiddenKnown, /未知：采集时间。/); assert.doesNotMatch(hiddenKnown, /全部页未知/);
  assert.doesNotMatch(htmlFor({ pages: [] }), /全部页未知/);
  assert.match(htmlFor({ pages: [{ ...page(1), capturedAt: null }] }), /未知：采集时间。/);
});

test('copy polish 3: received restrictions disappear only when external facts release them', () => {
  const released = { pages: [page(1)], receipt: { state: 'succeeded', operation: 'capture', request: { id: 'opaque-request', label: '补采请求' } } };
  const before = htmlFor({ ...released, receipt: { ...released.receipt, state: 'received' } });
  assert.match(before, /请等待当前采集请求的结果/);
  assert.doesNotMatch(htmlFor(released), /操作限制/);
  assert.match(htmlFor({ ...released, pages: [{ ...page(1), actions: { recapture: { disabledReason: '进入处理模糊页后才能补采。' } } }] }), /操作限制：进入处理模糊页后才能补采/);
});
