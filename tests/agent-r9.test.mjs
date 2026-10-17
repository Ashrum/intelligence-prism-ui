import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { createTestRuntime } from './helpers/test-runtime.mjs';
import { r9Baseline, r9Sources, legacyCases, fileItem, fileProps, fileStates, request, confirmationStates, confirmationProps, confirmationFor, basketProps } from './helpers/agent-r9-fixtures.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = await createTestRuntime('p84');
const sources = Object.fromEntries(r9Sources.map(path => [path, readFileSync(root + path, 'utf8')]));
let serial = 0;
async function load(overrides = {}) {
  const result = await build({ stdin: { contents: r9Sources.map(path => `export * from './${path}';`).join('\n'), resolveDir: root, loader: 'tsx' },
    bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, write: false,
    plugins: [{ name: 'in-memory-rollback', setup(build) {
      build.onLoad({ filter: /\.tsx$/ }, args => {
        const contents = overrides[args.path.slice(root.length)];
        if (contents !== undefined) return { contents, loader: 'tsx' };
      });
    } }],
  });
  const file = new URL(`bundle-${serial++}.mjs`, runtime);
  writeFileSync(file, result.outputFiles[0].text);
  return import(file);
}
const api = await load(), h = React.createElement;
const htmlFor = (api, name, props) => render(h(api[name], props));
const text = html => html.replace(/<[^>]*>/g, '');
const modes = ['inline', 'workspace'].flatMap(view => ['default', 'compact'].map(density => ({ view, density })));
const readableItem = { ...fileItem, name: 'internal-file-name', displayName: '九年级二班周测原卷.pdf', versionLabel: 'V12', requestName: '周测材料上传' };

// Event/prop probes are not browser, focus or visual acceptance.
function capture(api, name, props) {
  const nodes = [];
  const owned = new Set(['AgentFileInput', 'FileRow', 'FileActionButton', 'FileBatchButton', 'AgentCollectionBasket', 'BasketRow', 'BasketActionButton', 'AgentExecutionConfirmation', 'Action']);
  function inspect(node) {
    if (Array.isArray(node)) return node.map(inspect);
    if (!React.isValidElement(node)) return node;
    if (typeof node.type === 'function' && owned.has(node.type.name)) return h(function Probe() { return inspect(node.type(node.props)); });
    nodes.push(node);
    return React.cloneElement(node, {}, React.Children.map(node.props.children, inspect));
  }
  render(inspect(h(api[name], props)));
  return nodes;
}

function readableContract(api) {
  for (const mode of modes) for (const status of fileStates) {
    const props = { ...fileProps, ...mode, items: [{ ...readableItem, status }] };
    const html = htmlFor(api, 'AgentFileInput', props);
    assert.ok(text(html).includes(readableItem.displayName));
    assert.match(text(html), /版本：V12/);
    assert.doesNotMatch(text(html), /file-internal|request-internal|material-internal|internal-file-name/);
    assert.doesNotMatch(html, /aria-label="[^"]*(?:internal-file-name|material-internal|request-internal)/);
    if ('request' in status) assert.match(text(html), /原请求：周测材料上传/);
    // Inspect the actual default detail subtree even when its disclosure is closed.
    const details = capture(api, 'AgentFileInput', props).filter(n => n.type === 'p').map(n => text(render(n))).join('\n');
    assert.doesNotMatch(details, /file-internal|request-internal|material-internal|internal-file-name/);
  }
  const missing = htmlFor(api, 'AgentFileInput', { ...fileProps, items: [{ ...fileItem, displayName: '原卷', status: fileStates[5] }] });
  assert.match(text(missing), /版本：未确认/);
  assert.doesNotMatch(text(missing), /material-internal/);
}
test('P84: readable file identities cover nine states, four modes and collapsed details without exposing technical IDs', () => readableContract(api));

function removalContract(api) {
  for (const mode of modes) for (const disabled of [false, true]) {
    const calls = [], description = '不会取消上传或删除原件';
    const props = { ...fileProps, ...mode, onAction: intent => calls.push(intent), items: [{ ...readableItem, actions: { remove: { label: '移除此引用', description, disabledReason: disabled ? '归档记录只读' : undefined } } }] };
    const nodes = capture(api, 'AgentFileInput', props);
    const action = nodes.find(n => n.props['data-file-action'] === 'remove');
    assert.equal(action.props['aria-label'], `移除此引用：${readableItem.displayName}`);
    const described = action.props['aria-describedby'].split(' ').map(id => nodes.find(n => n.props.id === id));
    assert.ok(described.every(Boolean));
    assert.ok(described.some(n => text(render(n)) === description));
    action.props.onClick();
    assert.deepEqual(calls, disabled ? [] : [{ kind: 'remove', fileId: fileItem.id, version: fileItem.version }]);
  }
}
test('P84: remove copy and associated description preserve the original intent and disabled gate in all modes', () => removalContract(api));
test('P84: readable unknown files remain query-only and retain exact request identity', () => {
  for (const mode of modes) {
    const calls = [], props = { ...fileProps, ...mode, onAction: v => calls.push(v), items: [{ ...readableItem, status: fileStates[7] }] };
    const nodes = capture(api, 'AgentFileInput', props).filter(n => n.props['data-file-action']);
    assert.deepEqual(nodes.map(n => n.props['data-file-action']), ['query']);
    nodes[0].props.onClick();
    assert.deepEqual(calls, [{ kind: 'query', fileId: fileItem.id, version: fileItem.version, requestId: request.id }]);
    assert.match(htmlFor(api, 'AgentFileInput', props), /data-file-state="unknown"/);
  }
});

function detailsContract(api) {
  for (const mode of modes) {
    const html = htmlFor(api, 'AgentFileInput', { ...fileProps, ...mode,
      items: [{ ...readableItem, detailsPlacement: 'inline', details: h('p', null, '安全检查尚未核验') }] });
    assert.equal((html.match(/安全检查尚未核验/g) ?? []).length, 1);
    assert.match(html, /data-file-inline-details/);
    assert.match(html, /<div[^>]*data-file-inline-details[^>]*><p>安全检查尚未核验<\/p><\/div>/);
    assert.doesNotMatch(html.match(/<div[^>]*data-file-inline-details[^>]*>/)[0], /hidden|display:none/);
  }
}
test('P84: host policy facts can remain visible once outside the collapsed file details in all four modes', () => detailsContract(api));

function limitsContract(api) {
  for (const mode of modes) {
    const props = { ...fileProps, ...mode, limits: { selection: { accept: '.png', acceptLabel: 'PNG', maxFileSize: 1024, maxFiles: 1 } } };
    const html = htmlFor(api, 'AgentFileInput', props);
    for (const label of ['服务上传类型', '服务单文件大小', '服务文件数量', '服务页数上限']) assert.ok(text(html).includes(`${label}：尚未核验`));
    assert.match(text(html), /本机选择：PNG · 单文件大小：1 KB · 文件数量：1 个/);
    const input = capture(api, 'AgentFileInput', props).find(n => n.props.type === 'file');
    assert.equal(input.props.accept, '.png'); assert.equal(input.props.multiple, false);
    const known = text(htmlFor(api, 'AgentFileInput', { ...props, limits: { ...props.limits, upload: { acceptLabel: 'PDF', maxFileSize: 2097152, maxPages: 20 } } }));
    assert.match(known, /服务上传类型：PDF · 服务单文件大小：2 MB · 服务文件数量：尚未核验 · 服务页数上限：20 页/);
    const absent = text(htmlFor(api, 'AgentFileInput', { ...props, limits: { selection: {}, upload: { maxFileSize: NaN, maxFiles: -1, maxPages: 1.5 } } }));
    assert.match(absent, /本机选择：类型约束未提供 · 单文件大小：未提供 · 文件数量：未提供/);
    assert.equal((absent.match(/尚未核验/g) ?? []).length, 4);
  }
}
test('P84: scoped limits never copy local constraints into missing service policy and accept partial service facts', () => limitsContract(api));

function confirmationContract(api) {
  for (const state of confirmationStates) {
    const props = { ...confirmationProps, confirmation: confirmationFor(state), stateLabels: { [state]: `短标签-${state}` } };
    const stateHtml = htmlFor(api, 'AgentExecutionConfirmation', { ...props, effectTense: 'by-state' });
    assert.ok(text(stateHtml).includes(`短标签-${state}`));
    assert.equal(text(stateHtml).includes('将会'), ['ready', 'blocked'].includes(state));
    assert.ok(text(stateHtml).includes('不会纳入未完成作答'));
    const readonly = htmlFor(api, 'AgentExecutionConfirmation', { ...props, effectTense: 'neutral' });
    assert.doesNotMatch(readonly, /将会|确认后的影响/);
    assert.match(readonly, /本次确认范围/);
    assert.equal(readonly.includes('>确认成果<'), state === 'ready', 'presentation cannot grant or revoke a capability');
  }
  assert.match(htmlFor(api, 'AgentExecutionConfirmation', { ...confirmationProps, confirmation: confirmationFor('recorded'), stateLabels: { ready: '确认' } }), /确认记录/);
}
test('P84: six short labels and state-aware/read-only effect tense do not change confirmation capabilities', () => confirmationContract(api));

function basketContract(api) {
  for (const mode of modes) for (const itemPresentation of ['default', 'summary']) for (const canOpen of [false, true]) {
    const props = { ...basketProps, ...mode, itemPresentation, onOpenItem: canOpen ? basketProps.onOpenItem : undefined,
      items: basketProps.items.map(item => ({ ...item, versionSummary: item.access === 'restricted' ? '不得披露的版本' : '题目版本 V2 · 入篮版本未锁定' })) };
    const html = htmlFor(api, 'AgentCollectionBasket', props);
    assert.match(html, /data-collection-version-summary/);
    assert.match(text(html), /题目版本 V2 · 入篮版本未锁定/);
    assert.doesNotMatch(html, /不得披露的版本/);
    assert.equal(html.includes('求函数的最小值'), itemPresentation === 'summary' && canOpen);
    assert.equal((html.match(/data-collection-version-summary/g) ?? []).length, 1);
  }
}
test('P84: version identity stays outside the summary clamp, preserves renderSummary and never discloses restricted entries', () => basketContract(api));

function sheetContract(api) {
  for (const [sheetNo, revision, expected] of [['2/4', 'v3', 'SHEET 02 / 04'], [undefined, 'v3', 'REV 03'], [undefined, undefined, null]]) {
    // Fact selection is a host decision: actual page order > saved revision > absent.
    const folio = sheetNo ? { kind: 'sheet', value: sheetNo } : revision ? { kind: 'rev', value: revision } : undefined;
    const html = htmlFor(api, 'BlueprintSheet', { title: '周测成果', folio, titleActions: h('button', { type: 'button', 'aria-label': '成果标题更多操作' }, '更多'), children: h('p', null, '正文') });
    assert.match(html, /data-slot="bp-section-title-actions"/);
    assert.match(html, /aria-label="成果标题更多操作"/);
    assert.match(html, /<h2[^>]*>周测成果<\/h2>/);
    assert.doesNotMatch(html, /<section[^>]*titleActions/);
    assert.doesNotMatch(html.match(/<h2[^>]*>(.*?)<\/h2>/)[1], /<button/);
    assert.equal((html.match(/class="bp-section-folio"/g) ?? []).length, expected ? 1 : 0);
    if (expected) assert.ok(text(html).includes(expected));
  }
  const explicit = htmlFor(api, 'BlueprintSheet', { title: '成果', sheetNo: '4/9', folio: { kind: 'rev', value: '' }, titleActions: h('button', null, '更多') });
  assert.doesNotMatch(explicit, /bp-section-folio|SHEET|REV/);
}
test('P84: Sheet title actions stay outside the heading, preserve host SHEET > REV > absent selection and explicit-empty compatibility', () => sheetContract(api));

function isolationContract(api) {
  const themes = ['light', 'paper', 'dark', 'blueprint', 'blueprint-night'];
  const content = h(api.BlueprintSheet, { title: '成果', titleActions: h('button', { type: 'button' }, '更多') },
    h(api.AgentFileInput, { ...fileProps, items: [readableItem] }),
    h(api.AgentExecutionConfirmation, { ...confirmationProps, confirmation: confirmationFor('recorded'), effectTense: 'neutral' }));
  let reference;
  for (const outer of themes) for (const inner of themes) {
    const html = render(h('div', { 'data-ui-version': 'coss-v1', 'data-prism-theme': outer }, h('div', { 'data-agent-preview': '', 'data-prism-theme': inner }, content)));
    assert.equal((html.match(/data-prism-theme=/g) ?? []).length, 2, 'only the host supplies the two theme roots');
    const slot = html.match(/<div data-slot="bp-section-title-actions"[^>]*>/)[0];
    assert.doesNotMatch(slot, /style=|bg-|rounded-|shadow-|text-|font-/);
    assert.match(slot, /min-w-0.*max-w-full.*flex-wrap/);
    const normalized = html.replace(/data-prism-theme="[^"]*"/g, 'data-prism-theme="HOST"');
    reference ??= normalized;
    assert.equal(normalized, reference, `${outer}/${inner}`);
  }
}
test('P84: 25 nested theme roots remain host-owned; the new Sheet action container adds layout only (SSR scope contract)', () => isolationContract(api));

test('P84: 66 legacy calls render byte-identically to the verified original main source, including generated IDs', () => {
  const baseline = JSON.parse(readFileSync(root + 'tests/fixtures/agent-r9-main-433969a.json', 'utf8'));
  assert.equal(baseline.baseline, r9Baseline);
  const entries = legacyCases();
  assert.deepEqual(entries.map(e => e.name).sort(), Object.keys(baseline.cases).sort());
  for (const entry of entries) {
    const html = htmlFor(api, entry.component, entry.props);
    assert.equal(createHash('sha256').update(html).digest('hex'), baseline.cases[entry.name], entry.name);
  }
});

test('P84: independent in-memory rollback mutations are caught by rendered and intent contracts', async t => {
  const [files, confirmations, baskets, sheets] = r9Sources;
  const mutations = [
    ['display name ignored', files, s => s.replaceAll('item.displayName ?? item.name', 'item.name'), readableContract],
    ['raw version exposed', files, s => s.replace('const version = readable ?', 'const version = false ?'), readableContract],
    ['raw request exposed', files, s => s.replaceAll('readable ? requestName', 'false ? requestName'), readableContract],
    ['remove copy dropped', files, s => s.replace('item.actions?.remove?.label ?? "移除"', '"移除"'), removalContract],
    ['remove explanation dropped', files, s => s.replace('const removeDescription = item.actions?.remove?.description', 'const removeDescription = undefined'), removalContract],
    ['inline policy details dropped', files, s => s.replaceAll('item.detailsPlacement === "inline"', 'false'), detailsContract],
    ['service limit invented from local', files, s => s.replace('upload?.maxFileSize', 'selection.maxFileSize'), limitsContract],
    ['state tense lost', confirmations, s => s.replace('const future = effectTense === "future"', 'const future = true || effectTense === "future"'), confirmationContract],
    ['short label lost', confirmations, s => s.replace('stateLabels?.[confirmation.state] ?? labels[confirmation.state]', 'labels[confirmation.state]'), confirmationContract],
    ['version summary dropped', baskets, s => s.replace('entry?.versionSummary != null', 'false'), basketContract],
    ['title actions dropped', sheets, s => s.replace('titleActions={titleActions}', ''), sheetContract],
    ['empty folio leaks', sheets, s => s.replaceAll('folio && value &&', 'folio &&'), sheetContract],
    ['title action visual override', sheets, s => s.replace('data-slot="bp-section-title-actions"', 'data-slot="bp-section-title-actions" style={{ color: "red" }}'), isolationContract],
  ];
  for (const [name, path, mutate, check] of mutations) {
    check(api);
    const changed = mutate(sources[path]);
    assert.notEqual(changed, sources[path], name);
    const mutant = await load({ [path]: changed });
    assert.throws(() => check(mutant), undefined, name);
    t.diagnostic(`${name}: rejected`);
  }
});
