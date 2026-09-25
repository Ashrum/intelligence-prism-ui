import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = new URL('../.sites-runtime/artifact-output/', import.meta.url);
await mkdir(runtime, { recursive: true });
const file = new URL('test-bundle.mjs', runtime);
const bundle = await build({ stdin: { contents: `export * from './components/prism-next/agent-artifact-output'; export * from './components/prism-next/demos/agent-artifact-output';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false });
await writeFile(file, bundle.outputFiles[0].text);
const { AgentArtifactOutput, ArtifactOutputExample, AgentArtifactOutputDemo, artifactOutputExamples, artifactOutputSampleStatus } = await import(file);
await rm(file);
const h = React.createElement;
const version = { id: 'opaque-current-version', label: 'v2 · 校对后' };
const oldVersion = { id: 'opaque-old-version', label: 'v1 · 首次校对' };
const artifact = { id: 'opaque-artifact-id', title: '函数单元试卷', version };
const output = { id: 'opaque-output-id', artifactId: artifact.id, title: '试卷 PDF', version, format: 'PDF', layout: 'A4', range: '完整试卷', status: { state: 'idle' } };
const request = { id: 'opaque-original-request', runId: 'opaque-original-run' };
const downloadFile = { id: 'opaque-file-id', name: '函数单元试卷.pdf', version, sizeBytes: 2048, generatedAt: '2026-09-26 10:00', download: { label: '下载文件' } };
const formats = [{ id: 'opaque-pdf', label: 'PDF', support: 'supported' }, { id: 'opaque-word', label: 'Word', support: 'lossy', risk: '公式可能转为图片。' }, { id: 'opaque-excel', label: 'Excel', support: 'unsupported', reason: '没有可导出的明细表。' }];
const base = {
  artifact, output, formats, recommendedFormatId: formats[0].id,
  layouts: [{ id: 'opaque-a4', label: 'A4' }, { id: 'opaque-wide', label: '宽页边距' }],
  ranges: [{ id: 'opaque-all', label: '完整试卷' }, { id: 'opaque-first', label: '第 1 题' }], versions: [version, oldVersion],
  value: { formatId: formats[0].id, layoutId: 'opaque-a4', rangeId: 'opaque-all', versionId: version.id },
};
const modes = [{}, { view: 'workspace' }, { density: 'compact' }, { view: 'workspace', density: 'compact' }];
const htmlFor = extra => render(h(AgentArtifactOutput, { ...base, ...extra }));
const withStatus = status => ({ output: { ...output, status } });
function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.freeze(value); Object.values(value).forEach(freeze); }
  return value;
}
// Execute owned handlers in SSR probes. This does not claim browser/primitive keyboard validation.
function capture(extra, Component = AgentArtifactOutput) {
  const nodes = [], owned = new Set(['AgentArtifactOutput', 'OutputChoice', 'OutputRecord', 'OldVersion', 'ArtifactOutputExample']);
  function inspect(node) {
    if (Array.isArray(node)) return node.map(inspect);
    if (!React.isValidElement(node)) return node;
    if (typeof node.type === 'function' && owned.has(node.type.name)) return h(function Probe() { return inspect(node.type(node.props)); });
    nodes.push(node);
    return React.cloneElement(node, {}, React.Children.map(node.props.children, inspect));
  }
  render(inspect(h(Component, Component === AgentArtifactOutput ? { ...base, ...extra } : extra)));
  return nodes;
}
const buttons = nodes => nodes.filter(node => node.props.onClick);
const nodeText = node => typeof node === 'string' || typeof node === 'number' ? String(node) : Array.isArray(node) ? node.map(nodeText).join('') : React.isValidElement(node) ? nodeText(node.props.children) : '';
const button = (nodes, label) => buttons(nodes).find(node => node.props['aria-label']?.startsWith(`${label}：`) || nodeText(node.props.children) === label);
const choices = nodes => nodes.filter(node => node.props.onValueChange && node.props.items);

test('default inline/default is explicit and filenames, output facts and current versions stay separate', () => {
  assert.equal(htmlFor(), htmlFor({ view: 'inline', density: 'default' }));
  const html = htmlFor({ ...withStatus({ state: 'ready', file: downloadFile }), onDownload() {} });
  for (const text of ['当前成果版本', 'v2 · 校对后', '已生成可下载', '完整试卷', '函数单元试卷.pdf', '2.0 KB', '2026-09-26 10:00']) assert.ok(html.includes(text), text);
  assert.doesNotMatch(html, /已发布|已入库|保存成功|href=/);
});

test('only ready plus a version-matched file, declared download and host handler exposes delivery', () => {
  for (const mode of modes) {
    const extra = { ...mode, ...withStatus({ state: 'ready', file: downloadFile }), onDownload() {} };
    assert.ok(button(capture(extra), '下载文件'));
    for (const override of [{ onDownload: undefined }, withStatus({ state: 'ready', file: { ...downloadFile, download: undefined } }), withStatus({ state: 'ready' }), withStatus({ state: 'ready', file: { ...downloadFile, version: oldVersion } }), withStatus({ state: 'ready', file: { ...downloadFile, id: '' } })]) {
      assert.equal(button(capture({ ...extra, ...override }), '下载文件'), undefined);
    }
    for (const state of ['idle', 'generating', 'unknown', 'failed', 'expired', 'forbidden']) {
      const html = htmlFor({ ...extra, ...withStatus({ state, request, reason: '外部原因', file: downloadFile }) });
      assert.doesNotMatch(html, /下载文件|函数单元试卷.pdf/, state);
    }
  }
});

test('download forwards the exact file and version only and never infers any completion or mutates facts', () => {
  const calls = [], extra = { ...withStatus(freeze({ state: 'ready', file: downloadFile })), onDownload: value => calls.push(value) };
  const before = htmlFor(extra);
  button(capture(extra), '下载文件').props.onClick();
  assert.deepEqual(calls, [{ artifactId: artifact.id, recordId: output.id, versionId: version.id, fileId: downloadFile.id }]);
  assert.equal(htmlFor(extra), before);
});

test('lossy risks and unsupported reasons are always visible outside details; unsupported formats cannot emit requests', () => {
  for (const mode of modes) {
    const html = htmlFor({ ...mode, details: 'SECONDARY_BOUNDARY' });
    for (const text of ['Word · 有损', formats[1].risk, 'Excel · 不支持', formats[2].reason]) assert.ok(html.includes(text), text);
    assert.doesNotMatch(html, /SECONDARY_BOUNDARY/);
    const extra = { ...mode, recommendedFormatId: formats[2].id, value: { ...base.value, formatId: formats[2].id }, onGenerate() { assert.fail('unsupported generation'); } };
    assert.equal(button(capture(extra), '导出 Excel'), undefined);
  }
  assert.equal(button(capture({ formats: [{ id: 'opaque-pdf', label: 'PDF', support: 'lossy', risk: '' }], onGenerate() { assert.fail(); } }), '导出 PDF'), undefined);
});

test('missing, invalid and out-of-range progress never creates a percentage; external valid progress remains a fact', () => {
  for (const mode of modes) for (const progress of [undefined, NaN, Infinity, -1, 101]) {
    const html = htmlFor({ ...mode, ...withStatus({ state: 'generating', request, progress }) });
    assert.match(html, /生成中/); assert.doesNotMatch(html.replace(/<[^>]*>/g, ''), /%|生成失败/); assert.doesNotMatch(html, /progressbar|animate-spin/);
  }
  for (const progress of [0, 38.5, 100]) assert.match(htmlFor(withStatus({ state: 'generating', request, progress })), new RegExp(`生成进度：${progress}%`));
});

test('unknown permits original-request query only, suppressing generation, downloads, expansion and interactive preview in every mode', () => {
  for (const mode of modes) {
    const calls = [], status = freeze({ state: 'unknown', reason: '原请求状态未确认。', request, query: { label: '查询原请求' }, file: downloadFile });
    const extra = { ...mode, ...withStatus(status), onGenerate() { assert.fail(); }, onDownload() { assert.fail(); }, onValueChange() { assert.fail(); }, onExpand() { assert.fail(); }, onQuery: value => calls.push(value), preview: h('button', null, 'PREVIEW_WRITE'), details: 'COLLAPSED_EXTRA' };
    const before = htmlFor(extra), nodes = capture(extra), query = button(nodes, '查询原请求');
    assert.ok(query); query.props.onClick();
    assert.deepEqual(calls, [{ artifactId: artifact.id, recordId: output.id, versionId: version.id, request }]);
    assert.notEqual(calls[0].request, request);
    assert.doesNotMatch(before, /导出 PDF|下载文件|更多输出选项|PREVIEW_WRITE|COLLAPSED_EXTRA/);
    for (const choice of choices(nodes)) { assert.equal(choice.props.disabled, true); choice.props.onValueChange('1'); }
    assert.equal(htmlFor(extra), before);
  }
});

test('unknown with missing association or query capability exposes no replacement action and explains the limit', () => {
  for (const extra of [{ onQuery: undefined }, withStatus({ state: 'unknown', reason: '尚未核实', request }), withStatus({ state: 'unknown', reason: '尚未核实', request: { ...request, runId: '' }, query: { label: '查询原请求' } })]) {
    const props = { ...withStatus({ state: 'unknown', reason: '尚未核实', request, query: { label: '查询原请求' } }), onQuery() {}, onGenerate() { assert.fail(); }, ...extra };
    assert.equal(button(capture(props), '查询原请求'), undefined);
    assert.match(htmlFor(props), /暂不可查询原请求/);
    assert.equal(button(capture(props), '导出 PDF'), undefined);
  }
});

test('an unknown batch item blocks card-wide generation/delivery while preserving all queue facts and querying that item', () => {
  const calls = [], queued = { ...output, id: 'opaque-queued-output', title: '附页', status: { state: 'unknown', reason: '附页结果未确认', request, query: { label: '查询附页' } } };
  for (const mode of modes) {
    const extra = { ...mode, ...withStatus({ state: 'ready', file: downloadFile }), queue: [queued], onQuery: value => calls.push(value), onGenerate() { assert.fail(); }, onDownload() { assert.fail(); }, onExpand() { assert.fail(); } };
    const nodes = capture(extra); button(nodes, '查询附页').props.onClick();
    assert.equal(calls.at(-1).recordId, queued.id); assert.deepEqual(calls.at(-1).request, request);
    assert.equal(button(nodes, '导出 PDF'), undefined); assert.equal(button(nodes, '下载文件'), undefined); assert.equal(button(nodes, '更多输出选项'), undefined);
    assert.match(htmlFor(extra), /附页结果未确认/);
  }
});

test('failed, unknown and old-version facts survive compact, with immutable passive history and no current-version backfill', () => {
  const historical = freeze({ ...output, id: 'opaque-history', title: '旧版文件', version: oldVersion, status: { state: 'ready', file: { ...downloadFile, version: oldVersion } } });
  for (const view of ['inline', 'workspace']) {
    const extra = { view, density: 'compact', ...withStatus({ state: 'failed', reason: '答案页生成失败。' }), history: [historical], onDownload() { assert.fail('historical download'); }, onQuery() { assert.fail(); } };
    const before = htmlFor(extra);
    for (const text of ['生成失败', '答案页生成失败。', '历史输出记录（只读）', '基于旧版本', '当时版本：v1', '当时状态：已生成可下载']) assert.ok(before.includes(text), text);
    assert.equal(button(capture(extra), '下载文件'), undefined);
    const changed = htmlFor({ ...extra, artifact: { ...artifact, version: { id: 'opaque-future-version', label: 'v3' } } });
    assert.match(changed, /当时版本：v1/); assert.equal(historical.version.label, oldVersion.label);
  }
});

test('available old-version current files remain downloadable with a visible warning and exact historical version intent', () => {
  const calls = [], extra = { output: { ...output, version: oldVersion, status: { state: 'ready', file: { ...downloadFile, version: oldVersion } } }, onDownload: value => calls.push(value) };
  assert.match(htmlFor(extra), /基于旧版本/); button(capture(extra), '下载文件').props.onClick();
  assert.equal(calls[0].versionId, oldVersion.id);
});

test('four fixed-label controls return copied version-bound values and await host updates; no implicit first selection', () => {
  const calls = [], extra = { view: 'workspace', value: freeze({ ...base.value }), onValueChange: value => calls.push(value) };
  const before = htmlFor(extra), controls = choices(capture(extra));
  assert.equal(controls.length, 4);
  const keys = ['formatId', 'layoutId', 'rangeId', 'versionId'], nextIds = [formats[1].id, base.layouts[1].id, base.ranges[1].id, oldVersion.id];
  controls.forEach((control, index) => {
    assert.equal(control.props.value, '0'); assert.equal(control.props.defaultValue, undefined);
    control.props.onValueChange('1'); control.props.onValueChange('999'); control.props.onValueChange(null);
    assert.deepEqual(calls[index], { artifactId: artifact.id, currentVersionId: version.id, options: { ...base.value, [keys[index]]: nextIds[index] } });
    assert.notEqual(calls[index].options, base.value);
  });
  assert.equal(calls.length, 4); assert.equal(htmlFor(extra), before);
  controls[0].props.onValueChange('2'); assert.equal(calls.length, 4);
  const missing = htmlFor({ ...extra, value: { formatId: null, layoutId: null, rangeId: null, versionId: null } });
  assert.match(missing, /请选择/); assert.match(missing, /请核对可用格式/);
  for (const label of ['输出格式', '版式', '输出范围', '成果版本']) assert.ok(before.includes(label));
});

test('inline quick export uses only the declared recommendation; workspace uses selected format without modifying either', () => {
  const calls = [], value = freeze({ ...base.value, formatId: formats[1].id }), extra = { value, onGenerate: value => calls.push(value) };
  const before = htmlFor(extra); button(capture(extra), '导出 PDF').props.onClick();
  button(capture({ ...extra, view: 'workspace' }), '导出 Word').props.onClick();
  assert.deepEqual(calls.map(call => call.options.formatId), [formats[0].id, formats[1].id]);
  assert.ok(calls.every(call => call.artifactId === artifact.id && call.currentVersionId === version.id));
  assert.equal(htmlFor(extra), before); assert.equal(value.formatId, formats[1].id);
  assert.equal(button(capture({ ...extra, recommendedFormatId: undefined }), '导出 PDF'), undefined);
  assert.equal(button(capture({ onGenerate: undefined }), '导出 PDF'), undefined);
});

test('invalid/disabled selection, disabled generation, missing identities and duplicate IDs cannot generate or leak opaque values', () => {
  for (const override of [{ value: { ...base.value, rangeId: 'opaque-missing-range' } }, { ranges: [{ ...base.ranges[0], disabledReason: '范围失效。' }] }, { generateDisabledReason: '当前只读。' }, { generateDisabledReason: '' }]) {
    const extra = { ...override, onGenerate() { assert.fail(); } }, action = button(capture(extra), '导出 PDF');
    assert.equal(action.props.disabled, true); action.props.onClick();
    if (override.ranges) for (const mode of modes) assert.match(htmlFor({ ...extra, ...mode }), /范围失效。/);
  }
  for (const override of [{ artifact: { ...artifact, id: '' } }, { layouts: [base.layouts[0], base.layouts[0]] }, { output: { ...output, artifactId: 'other-artifact' } }, { queue: [output] }]) {
    const extra = { ...override, view: 'workspace', onGenerate() { assert.fail(); }, onValueChange() { assert.fail(); } };
    assert.equal(button(capture(extra), '导出 PDF'), undefined);
    for (const choice of choices(capture(extra))) { assert.equal(choice.props.disabled, true); choice.props.onValueChange('1'); }
  }
  for (const mode of modes) assert.doesNotMatch(htmlFor({ ...mode, value: { ...base.value, formatId: 'opaque-invalid-option' }, ...withStatus({ state: 'ready', file: downloadFile }), onDownload() {} }), /opaque-/);
});

test('raw storage paths never render as filenames, and dates/sizes are not synthesized when absent', () => {
  for (const name of ['/private/storage/tenant/report.pdf', 'C:\\private\\report.pdf', 'https://storage.invalid/internal/report.pdf']) {
    const html = htmlFor({ ...withStatus({ state: 'ready', file: { ...downloadFile, name, sizeBytes: undefined, generatedAt: undefined } }), onDownload() {} });
    assert.match(html, /文件名称未确认/); assert.match(html, /大小未确认/); assert.match(html, /生成时间未确认/);
    assert.doesNotMatch(html, /private|storage|tenant|report.pdf|opaque-/);
  }
});

test('disabled download/query reasons remain visible, accessible and guarded in the handler', () => {
  for (const status of [{ state: 'ready', file: { ...downloadFile, download: { label: '下载文件', disabledReason: '文件校验中。' } } }, { state: 'unknown', request, reason: '回执未确认。', query: { label: '查询原请求', disabledReason: '连接暂不可用。' } }]) {
    const extra = { ...withStatus(status), onDownload() { assert.fail(); }, onQuery() { assert.fail(); } }, action = button(capture(extra), status.state === 'ready' ? '下载文件' : '查询原请求');
    assert.equal(action.props.disabled, true); assert.ok(action.props['aria-describedby']); action.props.onClick();
    assert.ok(htmlFor(extra).includes(status.state === 'ready' ? '文件校验中。' : '连接暂不可用。'));
  }
});

test('more options exists only with onExpand; navigation preserves options and status; one notice with separate details', () => {
  const calls = [], trigger = {}, extra = { onExpand: value => calls.push(value), onBack: () => calls.push('back'), notice: '仅输出本次指定范围。', details: 'EXTRA_BOUNDARY' };
  const before = htmlFor(extra); button(capture(extra), '更多输出选项').props.onClick({ currentTarget: trigger });
  button(capture({ ...extra, view: 'workspace' }), '返回原位置').props.onClick();
  assert.deepEqual(calls, [trigger, 'back']); assert.equal(htmlFor(extra), before);
  assert.equal(button(capture({ ...extra, onExpand: undefined }), '更多输出选项'), undefined);
  assert.equal(button(capture({ ...extra, view: 'workspace' }), '更多输出选项'), undefined);
  assert.equal(before.split(extra.notice).length - 1, 1); assert.doesNotMatch(before, /EXTRA_BOUNDARY/);
});

test('workspace hosts supplied preview, retains all queue records, and distinguishes omitted from explicitly empty records', () => {
  assert.doesNotMatch(htmlFor({ view: 'workspace' }), /暂无批量输出任务|暂无历史输出记录|输出预览/);
  const html = htmlFor({ view: 'workspace', queue: [], history: [], preview: h('p', null, 'PRINT_PREVIEW_SLOT') });
  for (const text of ['暂无批量输出任务', '暂无历史输出记录', 'PRINT_PREVIEW_SLOT']) assert.ok(html.includes(text));
  assert.doesNotMatch(htmlFor({ preview: h('p', null, 'PRINT_PREVIEW_SLOT') }), /PRINT_PREVIEW_SLOT/);
});

test('two labelled examples cover all three uses, risks, unsupported formats, progress without percentages, history and real QuestionPrint composition', () => {
  for (const purpose of ['paper', 'report']) {
    const html = render(h(ArtifactOutputExample, { purpose, narrow: true }));
    for (const text of ['示例', 'Inline ·', 'Workspace ·', 'Compact ·', 'max-w-[320px]', 'data-agent-artifact-output-view="inline"', 'data-agent-artifact-output-view="workspace"', 'data-density="compact"']) assert.ok(html.includes(text), text);
    assert.doesNotMatch(html.replace(/<[^>]*>/g, ''), /宿主|意图|回调|受控/);
    assert.doesNotMatch(html, /href=|blob:|data:application|createObjectURL/);
    if (purpose === 'paper') for (const text of ['Word · 有损', '基于旧版本', 'question-print-preview', '函数单元练习-v1.pdf', '下载动作示例']) assert.ok(html.includes(text), text);
    else { for (const text of ['生成中', 'Excel · 不支持', '状态未确认', '查询原请求（示例）']) assert.ok(html.includes(text), text); assert.doesNotMatch(html.replace(/<[^>]*>/g, ''), /%|导出 PDF/); }
  }
  assert.match(render(h(AgentArtifactOutputDemo)), /320px 窄容器/);
  for (const state of ['idle', 'generating', 'ready', 'failed', 'unknown', 'expired', 'forbidden']) assert.equal(artifactOutputSampleStatus(state, artifactOutputExamples.paper.output).state, state);
});

test('generation is exposed only for confirmed idle, ready or failed facts and a supplied handler', () => {
  for (const mode of modes) for (const state of ['idle', 'generating', 'ready', 'failed', 'unknown', 'expired', 'forbidden']) {
    const status = artifactOutputSampleStatus(state, output), calls = [], extra = { ...mode, ...withStatus(status), onGenerate: value => calls.push(value) };
    const action = button(capture(extra), '导出 PDF');
    if (['idle', 'ready', 'failed'].includes(state)) {
      const before = htmlFor(extra); assert.ok(action); action.props.onClick(); assert.equal(calls.length, 1); assert.equal(htmlFor(extra), before);
    } else assert.equal(action, undefined, state);
  }
});

test('public discriminated types require risk, unsupported reason, request association and downloadable file facts', async () => {
  const typeFile = new URL('type-contract.tsx', runtime), path = fileURLToPath(typeFile);
  await writeFile(typeFile, `import type { AgentArtifactFormat as F, AgentArtifactOutputStatus as S, AgentArtifactOutputProps as P, AgentArtifactOutputOptions as O } from '../../components/prism-next/agent-artifact-output';
const pdf:F={id:'pdf',label:'PDF',support:'supported'};
// @ts-expect-error lossy conversion requires risk
const lossy:F={id:'word',label:'Word',support:'lossy'};
// @ts-expect-error unsupported format requires reason
const unsupported:F={id:'excel',label:'Excel',support:'unsupported'};
// @ts-expect-error ready requires a file
const ready:S={state:'ready'};
// @ts-expect-error unknown requires the original request
const unknown:S={state:'unknown',reason:'尚未核实'};
// @ts-expect-error running progress cannot stand in for a request
const generating:S={state:'generating',progress:25};
// @ts-expect-error unknown cannot carry a file or generation action
const bypass:S={state:'unknown',reason:'尚未核实',request:{id:'q',runId:'r'},file:{}};
// @ts-expect-error all four selections are controlled
const choices:O={formatId:'pdf'};
// @ts-expect-error props cannot omit controlled options or current output facts
const props:P={artifact:{id:'a',title:'试卷',version:{id:'v',label:'v1'}},formats:[pdf],layouts:[],ranges:[],versions:[]};
void [pdf,lossy,unsupported,ready,unknown,generating,bypass,choices,props];
`);
  try {
    const config = ts.readConfigFile(`${root}tsconfig.json`, ts.sys.readFile), parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
    const diagnostics = ts.getPreEmitDiagnostics(ts.createProgram([path], { ...parsed.options, incremental: false, noEmit: true }));
    assert.equal(diagnostics.length, 0, diagnostics.map(value => ts.flattenDiagnosticMessageText(value.messageText, '\n')).join('\n'));
  } finally { await rm(typeFile); }
});
