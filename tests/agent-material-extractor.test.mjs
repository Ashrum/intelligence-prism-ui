import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import {
  materialParagraphRange, materialRangeParts, materialRangeText, materialRangeDescription,
  materialRangeFromCharacters, materialSentenceRanges, extendMaterialRange, sameMaterialRange,
} from '../lib/prism-next/material-extractor.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = new URL('../.sites-runtime/material-extractor/', import.meta.url);
await mkdir(runtime, { recursive: true });
const file = new URL('test-bundle.mjs', runtime);
const bundle = await build({ stdin: { contents: `export * from './components/prism-next/agent-material-extractor'; export * from './components/prism-next/demos/agent-material-extractor';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false });
await writeFile(file, bundle.outputFiles[0].text);
const { AgentMaterialExtractor, AgentMaterialExtractorDemo, MaterialExtractorExample, materialExtractorExamples } = await import(file);
await rm(file);
const h = React.createElement;
const context = { extractorId: 'opaque-extractor', baseRevision: 'opaque-revision' };
const target = { packId: 'opaque-pack', versionId: 'opaque-pack-version', baseVersionId: 'opaque-pack-base', label: '复习素材包' };
const source = { id: 'opaque-source', version: 'opaque-source-version', label: '勾股定理复习课提纲', versionLabel: '第一版', kind: 'document',
  extractability: { state: 'available' }, license: { name: null, state: 'unknown' }, availability: { state: 'unknown' }, openable: true,
  paragraphs: [
    { id: 'opaque-p1', label: '第 1 段', text: '  已知 a² + b² = c²。解释直角条件！' },
    { id: 'opaque-p2', label: '第 2 段', text: '先看图🙂。再比较面积。' },
    { id: 'opaque-p3', label: '第 3 段', text: '请保留不同解法。' },
  ] };
const ranges = source.paragraphs.map(p => materialParagraphRange(source, p.id));
const candidate = (index, status = { state: 'candidate' }) => ({ id: `opaque-candidate-${index}`, range: ranges[index], title: `片段标题${index + 1}`,
  sourceLabel: source.label, versionLabel: source.versionLabel, location: materialRangeDescription(source, ranges[index]), excerpt: materialRangeText(source, ranges[index]), note: '', status });
const candidates = [candidate(0), candidate(1), candidate(2, { state: 'added', targetLabel: '复习素材包' })];
const props = { context, target, sources: [source], candidates, selection: null, onIntent() {} };
const modes = [{}, { view: 'workspace' }, { density: 'compact' }, { view: 'workspace', density: 'compact' }];
const htmlFor = extra => render(h(AgentMaterialExtractor, { ...props, ...extra }));
const textOf = html => html.replace(/<[^>]*>/g, '');
const count = (text, part) => text.split(part).length - 1;
function freeze(value) { if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.freeze(value); Object.values(value).forEach(freeze); } return value; }
// Real component closures, with hooks under React SSR. This is not a browser test.
function capture(extra) {
  const nodes = [], owned = new Set(['AgentMaterialExtractor', 'MaterialRangeFields', 'RecordDetails']);
  function inspect(node) {
    if (Array.isArray(node)) return node.map(inspect);
    if (!React.isValidElement(node)) return node;
    nodes.push(node);
    if (typeof node.type === 'function' && owned.has(node.type.name)) return h(function Probe() { return inspect(node.type(node.props)); });
    return React.cloneElement(node, {}, React.Children.map(node.props.children, inspect));
  }
  render(inspect(h(AgentMaterialExtractor, { ...props, ...extra })));
  return nodes;
}
const button = (nodes, label, index = 0) => nodes.filter(node => node.props.onClick && (node.props['aria-label'] === label || React.Children.toArray(node.props.children).join('') === label))[index];
const reference = item => ({ candidateId: item.id, range: item.range });

test('SSR: both views and compact preserve source, provenance, candidate states and explicit target', () => {
  assert.equal(htmlFor(), htmlFor({ view: 'inline', density: 'default' }));
  for (const mode of modes) {
    const html = htmlFor(mode);
    for (const value of ['勾股定理复习课提纲', '第一版', '第 1 段', '个字符', '目标素材包：复习素材包', '候选', '已加入素材包', '确认加入 2 段']) assert.ok(html.includes(value), value);
    assert.equal(html.includes('来源阅读'), mode.view === 'workspace');
    assert.equal(html.includes('片段标注'), mode.view === 'workspace');
    assert.equal(html.includes('选择整段'), mode.view === 'workspace');
    assert.doesNotMatch(html, /opaque-|宿主|回调|意图|受控|data-source-id/);
    assert.equal(count(html, 'data-material-extractor-boundary'), 1);
  }
});

test('paragraph and cross-paragraph ranges preserve exact whitespace, math and UTF-16 source positions', () => {
  const frozen = freeze(structuredClone(source));
  const all = { ...ranges[0], end: ranges[1].end };
  assert.equal(materialRangeText(frozen, all), `${source.paragraphs[0].text}\n${source.paragraphs[1].text}`);
  assert.equal(materialRangeParts(frozen, all).length, 2);
  assert.match(materialRangeDescription(frozen, all), /第 1 段第 1 个字符起，至第 2 段.*含 2 段/);
  const emoji = materialRangeFromCharacters(source, 'opaque-p2', 'opaque-p2', 4, 4);
  assert.equal(materialRangeText(source, emoji), '🙂');
  assert.equal(emoji.end.offset - emoji.start.offset, 2);
  assert.match(materialRangeDescription(source, emoji), /第 4–4 个字符/);
  assert.equal(materialRangeText(source, ranges[0]), source.paragraphs[0].text);
});

test('invalid, empty, reversed, ambiguous, stale and surrogate-splitting ranges are rejected without clamping', () => {
  const range = ranges[1], bad = [
    { ...range, sourceId: 'missing' }, { ...range, sourceVersion: 'old' }, { ...range, sourceVersion: null },
    ...[-1, Infinity, NaN, 1.5, 4].map(offset => ({ ...range, start: { ...range.start, offset } })), // 4 splits the emoji.
    { ...range, end: { ...range.end, offset: 0 } }, { ...range, end: { ...range.end, offset: 10000 } },
    { ...range, end: { paragraphId: 'opaque-p1', offset: 1 } }, { ...range, start: { paragraphId: 'missing', offset: 0 } },
  ];
  for (const value of bad) { assert.equal(materialRangeParts(source, value), null); assert.equal(materialRangeText(source, value), null); }
  assert.equal(materialRangeParts({ ...source, version: null }, range), null);
  assert.equal(materialRangeParts({ ...source, paragraphs: [...source.paragraphs, source.paragraphs[0]] }, range), null);
  assert.equal(materialParagraphRange({ ...source, paragraphs: [{ id: 'empty', label: '空段', text: '' }] }, 'empty'), null);
  for (const [first, last] of [[0, 1], [2, 1], [1.5, 2], [1, 100], [NaN, 1]]) assert.equal(materialRangeFromCharacters(source, 'opaque-p2', 'opaque-p2', first, last), null);
});

test('keyboard sentence/paragraph expansion advances exact bounds in both directions and stops at source edges', () => {
  assert.deepEqual(materialSentenceRanges('数值 3.14。不变！尾句'), [{ start: 0, end: 8 }, { start: 8, end: 11 }, { start: 11, end: 13 }]);
  const first = materialParagraphRange(source, 'opaque-p2', 'sentence');
  assert.equal(materialRangeText(source, first), '先看图🙂。');
  assert.deepEqual(extendMaterialRange(source, first, 'sentence', 'after'), ranges[1]);
  assert.equal(extendMaterialRange(source, ranges[0], 'sentence', 'before'), null);
  assert.equal(extendMaterialRange(source, ranges[2], 'paragraph', 'after'), null);
  const back = extendMaterialRange(source, first, 'sentence', 'before');
  assert.equal(materialRangeText(source, back), '解释直角条件！\n先看图🙂。');
  const next = extendMaterialRange(source, ranges[0], 'paragraph', 'after');
  assert.deepEqual(next, { ...ranges[0], end: ranges[1].end });
  assert.deepEqual(extendMaterialRange(source, ranges[1], 'paragraph', 'before'), next);
  assert.equal(extendMaterialRange(source, { ...first, sourceVersion: 'old' }, 'paragraph', 'after'), null);
});

test('range handlers emit only versioned provenance; selection is controlled, with explicit candidate creation', () => {
  const calls = [], input = { view: 'workspace', candidates: [], selection: ranges[1], onIntent: intent => calls.push(intent) };
  const nodes = capture(input), before = htmlFor(input);
  button(nodes, '选择整段：第 1 段').props.onClick();
  button(nodes, '选择首句：第 2 段').props.onClick();
  button(nodes, '向后扩展一段').props.onClick();
  button(nodes, '列为候选片段').props.onClick();
  assert.deepEqual(calls[0], { ...context, type: 'select-range', range: ranges[0], purpose: 'preview' });
  assert.deepEqual(calls.at(-1), { ...context, type: 'select-range', range: ranges[1], purpose: 'candidate' });
  for (const call of calls) { assert.equal(call.range.sourceVersion, source.version); assert.doesNotMatch(JSON.stringify(call), /paragraphs|text|先看图/); }
  assert.equal(htmlFor(input), before);
  assert.notEqual(calls[0].range.start, ranges[0].start);
  const duplicate = capture({ ...input, candidates: [candidates[1]] });
  button(duplicate, '此片段已在列表中').props.onClick(); assert.equal(calls.length, 4);
});

test('selected range has a live text description, bracket/underline highlight and fixed character labels', () => {
  const html = htmlFor({ view: 'workspace', selection: ranges[1] });
  for (const value of ['已选范围：第 2 段', '所选文字开始', '所选文字结束', 'decoration-double', '〔', '〕', '起始字符（从 1 计）', '结束字符（含）', '向前扩展一句', '向后扩展一段']) assert.ok(html.includes(value), value);
  assert.match(html, /role="status"/);
  const nodes = capture({ view: 'workspace', selection: materialRangeFromCharacters(source, 'opaque-p2', 'opaque-p2', 4, 4) });
  assert.deepEqual(nodes.filter(node => node.type.name === 'Input' && node.props.type === 'number').map(node => node.props.value), ['4', '4']);
  for (const match of html.matchAll(/<label[^>]*for="([^"]+)"/g)) assert.ok(html.includes(`id="${match[1]}"`));
});

test('annotate, remove, reorder, confirm and source-open payloads keep provenance and never include source text', () => {
  const calls = [], input = { view: 'workspace', candidates: freeze(structuredClone(candidates)), onIntent: intent => calls.push(intent) };
  const before = htmlFor(input), nodes = capture(input);
  nodes.find(node => node.type.name === 'Input' && node.props.value === candidates[0].title).props.onChange({ target: { value: '  新标题  ' } });
  nodes.find(node => node.type.name === 'Textarea').props.onChange({ target: { value: '  标注\n保持换行  ' } });
  button(nodes, '移出候选列表：片段标题1').props.onClick();
  button(nodes, '下移：片段标题1').props.onClick();
  button(nodes, '确认加入 2 段').props.onClick();
  button(nodes, '定位出处').props.onClick();
  assert.deepEqual(calls[0], { ...context, ...reference(candidates[0]), type: 'annotate', field: 'title', value: '  新标题  ' });
  assert.equal(calls[1].value, '  标注\n保持换行  ');
  assert.deepEqual(calls[2], { ...context, ...reference(candidates[0]), type: 'remove' });
  assert.deepEqual(calls[3], { ...context, ...reference(candidates[0]), type: 'reorder', beforeCandidateId: candidates[2].id, orderedCandidateIds: [candidates[1].id, candidates[0].id, candidates[2].id] });
  assert.deepEqual(calls[4], { ...context, type: 'confirm', target, candidates: candidates.slice(0, 2).map(item => ({ ...reference(item), title: item.title, note: item.note })) });
  assert.deepEqual(calls[5], { ...context, type: 'open-source', sourceId: source.id, sourceVersion: source.version, range: ranges[0] });
  assert.equal(htmlFor(input), before);
  for (const call of calls) assert.doesNotMatch(JSON.stringify(call), /paragraphs|excerpt|解释直角条件/);
});

test('batch confirmation names its actual scope, excludes added/invalid/unconfirmed, and includes confirmed candidates', () => {
  const calls = [], items = [candidate(0, { state: 'confirmed' }), candidate(1, { state: 'invalid', reason: '来源已更新。' }), candidates[2]];
  for (const mode of modes) {
    const nodes = capture({ ...mode, candidates: items, onIntent: intent => calls.push(intent) });
    button(nodes, '确认加入 1 段').props.onClick();
    assert.deepEqual(calls.at(-1).candidates, [{ ...reference(items[0]), title: items[0].title, note: '' }]);
    for (const text of ['已确认', '失效', '来源已更新。', '已加入素材包']) assert.ok(htmlFor({ ...mode, candidates: items }).includes(text));
    const unknown = capture({ ...mode, candidates: [candidate(0, { state: 'unconfirmed' })], onIntent: intent => calls.push(intent) });
    button(unknown, '确认加入 0 段').props.onClick();
    assert.equal(button(unknown, '移出候选列表：片段标题1').props.disabled, true);
    assert.match(htmlFor({ ...mode, candidates: [candidate(0, { state: 'unconfirmed' })] }), /请先核对上次确认结果/);
  }
  assert.equal(calls.length, modes.length);
});

test('unsupported image/video/audio and unknown extraction capabilities remain honest in both views', () => {
  for (const mode of modes) for (const kind of ['image', 'video', 'audio', 'other']) {
    const calls = [], input = { ...mode, sources: [{ ...source, kind }], onIntent: intent => calls.push(intent) };
    const html = htmlFor(input), nodes = capture(input);
    assert.match(html, /暂不支持提取/); assert.doesNotMatch(html, /选择整段/);
    button(nodes, '确认加入 0 段').props.onClick(); assert.equal(calls.length, 0);
    button(nodes, '查看来源').props.onClick(); assert.equal(calls[0].type, 'open-source');
  }
  assert.match(htmlFor({ sources: [{ ...source, extractability: { state: 'unknown' } }] }), /可提取性未知/);
});

test('unknown license and availability are visible facts; explicit extractability alone controls the selection capability', () => {
  const calls = [], nodes = capture({ view: 'workspace', onIntent: intent => calls.push(intent) });
  button(nodes, '选择整段：第 1 段').props.onClick(); assert.equal(calls.length, 1);
  assert.match(htmlFor(), /许可、可用性：未知/);
  assert.match(htmlFor({ sources: [{ ...source, license: { state: 'restricted', name: '仅课堂', reason: '不得公开分发。' } }] }), /许可：仅课堂 · 受限/);
  const missingReasons = htmlFor({ sources: [{ ...source, license: { state: 'restricted', name: null, reason: '' }, availability: { state: 'invalid', reason: '' } }] });
  assert.match(missingReasons, /许可受限，具体原因未提供。/); assert.match(missingReasons, /来源暂不可用，具体原因未提供。/);
});

test('readonly, missing identity, stale references and blocked targets protect actual handlers and keep navigation separate', () => {
  for (const extra of [{ readOnlyReason: '' }, { readOnlyReason: '历史材料只读。' }, { context: { ...context, baseRevision: '' } },
    { sources: [{ ...source, version: 'new-version' }] }, { sources: [{ ...source, version: null }] }, { candidates: [candidates[0], candidates[0]] }]) {
    const calls = [], input = { view: 'workspace', selection: ranges[0], ...extra, onIntent: intent => calls.push(intent) }, nodes = capture(input);
    for (const node of nodes) if (node.props.onClick && (node.props.children === '列为候选片段' || React.Children.toArray(node.props.children).join('').startsWith('确认加入'))) node.props.onClick();
    for (const node of nodes) if ((node.type.name === 'Input' && node.props.type !== 'number') || node.type.name === 'Textarea') node.props.onChange({ target: { value: '不应应用' } });
    assert.equal(calls.length, 0);
  }
  for (const extra of [{ target: null }, { target: { ...target, versionId: '' } }, { confirmDisabledReason: '' }, { confirmDisabledReason: '请核对目标素材包的新版本。' }]) {
    const calls = [], nodes = capture({ ...extra, onIntent: intent => calls.push(intent) });
    button(nodes, '确认加入 2 段').props.onClick(); assert.equal(calls.length, 0);
  }
  for (const mode of modes) {
    const calls = [], nodes = capture({ ...mode, readOnlyReason: '只读。', onExpand: trigger => calls.push(trigger), onBack: () => calls.push('back') });
    if (mode.view === 'workspace') button(nodes, '返回原位置').props.onClick();
    else button(nodes, '展开提取与整理').props.onClick({ currentTarget: 'trigger' });
    assert.deepEqual(calls, [mode.view === 'workspace' ? 'back' : 'trigger']);
  }
  assert.doesNotMatch(htmlFor({ onIntent: undefined }), /确认加入|移出候选列表|查看来源/);
});

test('stale candidate source-open preserves its old or unknown source version instead of substituting the current version', () => {
  for (const version of ['old', null]) {
    const calls = [], old = { ...candidates[0], range: { ...ranges[0], sourceVersion: version }, versionLabel: '旧版' };
    button(capture({ candidates: [old], onIntent: intent => calls.push(intent) }), '定位出处').props.onClick();
    assert.equal(calls[0].sourceVersion, version); assert.deepEqual(calls[0].range, old.range);
  }
});

test('reordering cannot indirectly move added, invalid or unconfirmed neighbors', () => {
  for (const status of [{ state: 'added', targetLabel: '旧素材包' }, { state: 'invalid', reason: '失效原因。' }, { state: 'unconfirmed' }]) {
    const calls = [], nodes = capture({ view: 'workspace', candidates: [candidate(0), candidate(1, status)], onIntent: intent => calls.push(intent) });
    button(nodes, '下移：片段标题1').props.onClick(); button(nodes, '上移：片段标题2').props.onClick();
    assert.equal(calls.length, 0);
  }
});

test('exact repeated reasons appear once, extra details collapse and accessible descriptions resolve', () => {
  const reason = '原文已更新，请重新核对。';
  for (const mode of modes) {
    const input = { ...mode, sources: [{ ...source, extractability: { state: 'unavailable', reason }, license: { state: 'restricted', name: '课堂', reason }, openDisabledReason: reason }], candidates: [candidate(0, { state: 'invalid', reason }), candidate(1, { state: 'invalid', reason })], details: h('p', null, '补充说明内容') };
    const html = htmlFor(input);
    assert.equal(count(textOf(html), reason), 1); assert.equal(count(html, 'data-material-extractor-boundary'), 1);
    assert.doesNotMatch(html, /补充说明内容/);
    for (const match of html.matchAll(/aria-(?:describedby|labelledby)="([^"]+)"/g)) for (const ref of match[1].split(' ')) assert.ok(html.includes(`id="${ref}"`), ref);
    const gate = capture(input).find(node => node.type.name === 'Collapsible');
    assert.equal(gate.props.defaultOpen, false); assert.match(render(React.cloneElement(gate, { open: true })), /补充说明内容/);
  }
});

test('compact preserves every word and capability; source text is safely escaped', () => {
  for (const view of ['inline', 'workspace']) assert.equal(textOf(htmlFor({ view })), textOf(htmlFor({ view, density: 'compact' })));
  assert.match(htmlFor({ candidates: [{ ...candidates[0], excerpt: '<script>原文</script>' }] }), /&lt;script&gt;/);
  assert.doesNotMatch(htmlFor({ candidates: [{ ...candidates[0], excerpt: '<script>原文</script>' }] }), /<script>/);
});

test('fixed examples expose the anchor, required outline/question/image fixtures, formula text and narrow containers', async () => {
  const html = render(h(AgentMaterialExtractorDemo));
  for (const value of ['id="material-extractor"', '勾股定理复习课提纲', '已加入素材包', '拼图活动', '梯子靠墙问题', '图像来源暂不支持提取', '320px 窄容器', 'a² + b² = c²']) assert.ok(html.includes(value), value);
  for (const sample of materialExtractorExamples) {
    assert.match(render(h(MaterialExtractorExample, { sample, narrow: true })), /max-w-\[320px\]/);
    for (const theme of ['light', 'paper', 'dark']) for (const mode of modes) {
      const content = render(h('div', { 'data-ui-version': 'coss-v1', 'data-prism-theme': theme }, h(AgentMaterialExtractor, { ...props, ...mode, sources: sample.sources, candidates: sample.candidates })));
      await writeFile(new URL(`${sample.id}-${theme}-${mode.view ?? 'inline'}-${mode.density ?? 'default'}.html`, runtime), content);
    }
  }
});

test('the semantic component owns neither persistence, service calls nor source copying', async () => {
  const code = await readFile(new URL('../components/prism-next/agent-material-extractor.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(code, /localStorage|sessionStorage|fetch\(|setTimeout\(|setInterval\(|ole-school-workbench|dangerouslySetInnerHTML/);
});
