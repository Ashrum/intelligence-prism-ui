import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = new URL('../.sites-runtime/slide-workspace/', import.meta.url);
await mkdir(runtime, { recursive: true });
const options = { stdin: { contents: `export * from './components/prism-next/agent-slide-workspace'; export * from './components/prism-next/demos/agent-slide-workspace';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false };
const file = new URL('test-bundle.mjs', runtime), probe = new URL('probe-bundle.mjs', runtime);
await writeFile(file, (await build(options)).outputFiles[0].text);
const { AgentSlideWorkspace, AgentSlideWorkspaceDemo, SlideWorkspaceExample, slideWorkspaceExample } = await import(file);
// Event-handler and UI-draft harness only. This does not simulate DOM focus or browser layout.
await writeFile(probe, (await build({ ...options, plugins: [{ name: 'slide-ui-state', setup(build) {
  build.onLoad({ filter: /components\/prism-next\/agent-slide-workspace\.tsx$/ }, async args => ({ loader: 'tsx', contents: (await readFile(args.path, 'utf8'))
    .replace('useId, useState, type KeyboardEvent', 'useId, type KeyboardEvent')
    .replace('type TextDraft =', `const useState = <T,>(initial: T): [T, (value: T) => void] => { const p = (globalThis as any).__slideUI; const index = p.cursor++; if (!(index in p.values)) p.values[index] = initial; return [p.values[index], (value: T) => { p.values[index] = value }]; };\ntype TextDraft =`) }));
} }] })).outputFiles[0].text);
const { AgentSlideWorkspace: Probe } = await import(probe);
await rm(file); await rm(probe);
const h = React.createElement;
const all = Object.fromEntries(['view', 'reorder', 'edit-text', 'add', 'delete', 'generate', 'export'].map(key => [key, { supported: true }]));
const slides = [
  { id: 'opaque-first', number: 1, title: '学习目标', points: '辨认直角与斜边。', notes: '请学生说明理由。', status: '已完成' },
  { id: 'opaque-second', number: 2, title: '公式页', points: 'a² + b² = c²', notes: '先确认直角。', status: '待补充' },
  { id: 'opaque-third', number: 3, title: '巩固', points: '独立完成练习。' },
  { id: 'opaque-fourth', number: 4, title: '总结', points: '回顾条件。' },
];
const base = { deckId: 'opaque-deck', version: 'opaque-version', versionLabel: '课件 v1', title: '勾股定理复习课', source: { label: '备课提纲（模拟）', openable: true }, save: { state: 'unsaved' }, slides, selectedSlideId: slides[1].id, capabilities: all, onIntent() {} };
const context = { deckId: base.deckId, version: base.version };
const modes = [{}, { view: 'workspace' }, { density: 'compact' }, { view: 'workspace', density: 'compact' }];
const htmlFor = extra => render(h(AgentSlideWorkspace, { ...base, ...extra }));
const textOf = node => typeof node === 'string' || typeof node === 'number' ? String(node) : Array.isArray(node) ? node.map(textOf).join('') : React.isValidElement(node) ? textOf(node.props.children) : '';
const button = (nodes, label) => nodes.find(node => node.props.onClick && textOf(node.props.children) === label);
const reset = () => { globalThis.__slideUI = { cursor: 0, values: [] }; };
function capture(extra = {}) {
  globalThis.__slideUI.cursor = 0;
  const nodes = [];
  function inspect(node) {
    if (Array.isArray(node)) return node.map(inspect);
    if (!React.isValidElement(node)) return node;
    if (node.type === Probe) return h(function Visit() { return inspect(Probe(node.props)); });
    nodes.push(node);
    return React.cloneElement(node, {}, React.Children.map(node.props.children, inspect));
  }
  return { html: render(inspect(h(Probe, { ...base, view: 'workspace', ...extra }))), nodes };
}
const click = (extra, label) => { const node = button(capture(extra).nodes, label); assert.ok(node, label); node.props.onClick({ currentTarget: {} }); return node; };
const input = (extra, suffix, value) => { const node = capture(extra).nodes.find(node => node.props.id?.endsWith(suffix) && node.props.onChange); assert.ok(node, suffix); node.props.onChange({ target: { value } }); };
function keyboard(extra, key, from, options = {}) {
  let focus = -1, prevented = false;
  const targets = slides.map((_, index) => ({ focus() { focus = index; } }));
  capture(extra).nodes.find(node => node.type === 'nav').props.onKeyDown({ key, currentTarget: { querySelectorAll: () => targets }, target: targets[from], nativeEvent: {}, preventDefault() { prevented = true; }, ...options });
  return { focus, prevented };
}

test('slide SSR inline/workspace and compact preserve version, source, saving and boundary', () => {
  for (const mode of modes) {
    const html = htmlFor(mode);
    for (const text of ['勾股定理复习课', '课件 v1', '4 页', '未保存', '备课提纲（模拟）', '不代表已保存或已有可下载文件']) assert.ok(html.includes(text), text);
    assert.match(html, new RegExp(`data-density="${mode.density ?? 'default'}"`));
    assert.doesNotMatch(html, /opaque-|宿主|意图|回调|<textarea/);
    assert.equal(html.includes('a² + b² = c²'), mode.view === 'workspace');
    assert.equal(html.includes('讲者备注'), mode.view === 'workspace');
    if (!mode.view) { assert.match(html, /展示前 3 页，共 4 页/); assert.doesNotMatch(html, /总结/); }
  }
});
test('selection requests exact reference and remains controlled until new props arrive', () => {
  reset(); const calls = [], extra = { onIntent: value => calls.push(value) };
  const node = capture(extra).nodes.filter(node => 'data-slide-select' in node.props)[0];
  node.props.onClick();
  assert.deepEqual(calls, [{ ...context, type: 'select-slide', slideId: slides[0].id }]);
  assert.match(capture(extra).html, /a² \+ b² = c²/);
  assert.doesNotMatch(capture({ ...extra, selectedSlideId: slides[0].id }).html, /a² \+ b² = c²/);
});
test('directory arrows/Home/End move focus only; activation uses the same native button as click', () => {
  reset(); const extra = { onIntent() { assert.fail('focus is not selection'); } };
  for (const [key, from, expected] of [['ArrowDown', 0, 1], ['ArrowUp', 2, 1], ['Home', 2, 0], ['End', 0, 3]]) assert.deepEqual(keyboard(extra, key, from), { focus: expected, prevented: true });
  const node = capture(extra).nodes.filter(node => 'data-slide-select' in node.props)[0];
  assert.equal(node.props.type, 'button');
  assert.equal(node.props.onKeyDown, undefined); // native Enter/Space are not intercepted
});
test('up/down buttons and Alt+arrow requests are equivalent; bounds never emit', () => {
  reset(); const calls = [], extra = { onIntent: value => calls.push(value) };
  click(extra, '上移'); keyboard(extra, 'ArrowUp', 1, { altKey: true });
  click(extra, '下移'); keyboard(extra, 'ArrowDown', 1, { altKey: true });
  assert.deepEqual(calls, [0, 0, 2, 2].map(toIndex => ({ ...context, type: 'reorder', slideId: slides[1].id, toIndex })));
  keyboard(extra, 'ArrowUp', 0, { altKey: true });
  click({ ...extra, selectedSlideId: slides[0].id }, '上移');
  assert.equal(calls.length, 4);
  for (const options of [{ repeat: true }, { nativeEvent: { isComposing: true } }, { ctrlKey: true }, { metaKey: true }, { shiftKey: true }]) keyboard(extra, 'ArrowDown', 1, { altKey: true, ...options });
  assert.equal(calls.length, 4);
  assert.equal(slides[0].title, '学习目标');
});
test('editing is a UI draft until confirmation, preserves raw text, and never changes saving facts', () => {
  reset(); const calls = [], extra = { onIntent: value => calls.push(value) };
  click(extra, '编辑标题与要点'); input(extra, '-draft-title', '  新标题  '); input(extra, '-draft-points', '第一条\n\n  a² + b² = c²  ');
  assert.equal(calls.length, 0); assert.match(capture(extra).html, /未确认的文字草稿/);
  click(extra, '确认修改');
  assert.deepEqual(calls, [{ ...context, type: 'edit-text', slideId: slides[1].id, title: '  新标题  ', points: '第一条\n\n  a² + b² = c²  ' }]);
  assert.match(capture(extra).html, /结果待确认/); assert.match(capture(extra).html, /未保存/); assert.doesNotMatch(capture(extra).html, /<textarea/);
  assert.equal(slides[1].title, '公式页');
});
test('pending draft blocks navigation, reorder, generation, export, source and deletion until explicit discard', () => {
  reset(); const calls = [], extra = { onIntent: value => calls.push(value), onBack() { calls.push('back'); } };
  click(extra, '编辑标题与要点'); input(extra, '-draft-title', '临时标题');
  for (const label of ['上移', '下移', '新增一页', '删除当前页', '生成课件', '导出课件', '查看来源', '返回原位置']) assert.equal(click(extra, label).props.disabled, true);
  keyboard(extra, 'ArrowUp', 1, { altKey: true });
  capture(extra).nodes.find(node => 'data-slide-select' in node.props).props.onClick();
  assert.deepEqual(calls, []);
  click(extra, '放弃草稿'); assert.doesNotMatch(capture(extra).html, /临时标题|<textarea/);
  click(extra, '返回原位置'); assert.deepEqual(calls, ['back']);
});
test('changed deck/version/content/selection/capability retains draft and blocks stale confirmation', () => {
  const changes = [ { version: 'new-version' }, { deckId: 'new-deck' }, { selectedSlideId: slides[0].id }, { slides: slides.map(slide => ({ ...slide, points: '外部新文字' })) }, { capabilities: { ...all, 'edit-text': { supported: false, reason: '编辑已关闭' } } }, { readOnlyReason: '' }, { save: { state: 'conflict' } } ];
  for (const change of changes) {
    reset(); const extra = { onIntent() { assert.fail('stale request'); } };
    click(extra, '编辑标题与要点'); input(extra, '-draft-title', '保留我的草稿');
    assert.equal(click({ ...extra, ...change }, '确认修改').props.disabled, true);
    assert.match(capture({ ...extra, ...change }).html, /草稿保留但不可提交/);
    // Identity/access changes do not disclose the old input to the new view.
    if (change.deckId || 'readOnlyReason' in change) assert.doesNotMatch(capture({ ...extra, ...change }).html, /保留我的草稿/);
    else assert.match(capture({ ...extra, ...change }).html, /保留我的草稿/);
  }
});
test('same mounted instance preserves unfinished draft when switching presentation', () => {
  reset(); click({}, '编辑标题与要点'); input({}, '-draft-points', '两态同一草稿');
  assert.match(capture({ view: 'inline' }).html, /两态同一草稿/);
  assert.match(capture({ view: 'workspace' }).html, /两态同一草稿/);
});
test('unsupported editing tools are absent and identical explanations are merged once', () => {
  const reason = '此格式仅能阅读。';
  const capabilities = { ...all, ...Object.fromEntries(['reorder', 'edit-text', 'add', 'delete'].map(key => [key, { supported: false, reason }])) };
  for (const mode of modes) {
    const html = htmlFor({ ...mode, capabilities });
    assert.equal(html.split(reason).length - 1, 1);
    assert.doesNotMatch(html, /编辑标题与要点|删除当前页|新增一页|<textarea|>上移<|>下移</);
  }
  reset(); keyboard({ capabilities, onIntent() { assert.fail(); } }, 'ArrowUp', 1, { altKey: true });
});
test('export and generation emit only deck/version request, with no fake download or completion', () => {
  reset(); const calls = [], extra = { onIntent: value => calls.push(value) };
  click(extra, '生成课件'); click(extra, '导出课件'); click(extra, '查看来源');
  assert.deepEqual(calls, ['request-generate', 'request-export', 'open-source'].map(type => ({ ...context, type })));
  assert.doesNotMatch(capture(extra).html, /download=|href=|生成成功|已导出/);
  assert.doesNotMatch(htmlFor({ capabilities: { ...all, export: { supported: false, reason: '无文件服务。' } } }), />导出课件</);
});
test('add/delete requests retain selection and original slides; empty decks can request add', () => {
  reset(); const calls = [], extra = { onIntent: value => calls.push(value) };
  click(extra, '新增一页'); click(extra, '删除当前页');
  click({ ...extra, slides: [], selectedSlideId: null }, '新增一页');
  assert.deepEqual(calls, [{ ...context, type: 'add-slide', afterSlideId: slides[1].id }, { ...context, type: 'delete-slide', slideId: slides[1].id }, { ...context, type: 'add-slide', afterSlideId: null }]);
  assert.equal(slides.length, 4);
});
test('read-only including blank reason prevents mutation while allowing navigation and supported export', () => {
  for (const readOnlyReason of ['', '固定历史版本。']) {
    reset(); const calls = [], extra = { readOnlyReason, onIntent: value => calls.push(value) };
    const html = capture(extra).html;
    assert.match(html, /只读版本/); assert.doesNotMatch(html, /<textarea|编辑标题与要点|新增一页|删除当前页|>生成课件<|>上移</);
    keyboard(extra, 'ArrowUp', 1, { altKey: true });
    click(extra, '导出课件');
    capture(extra).nodes.find(node => 'data-slide-select' in node.props).props.onClick();
    assert.deepEqual(calls.map(value => value.type), ['request-export', 'select-slide']);
  }
});
test('unsupported view never mounts content, thumbnail, notes, slots or actionable requests', () => {
  for (const mode of modes) {
    const html = htmlFor({ ...mode, capabilities: { ...all, view: { supported: false, reason: '没有查看权限。' } }, details: '不可披露详情', onExpand() {} });
    assert.match(html, /没有查看权限/); assert.doesNotMatch(html, /学习目标|a²|<img|先确认直角|不可披露详情|打开课件|>导出课件</);
  }
});
test('unknown identity and invalid/duplicate slide references block requests; stale selection never falls back', () => {
  for (const extra of [{ deckId: '' }, { version: '' }, { slides: [slides[0], slides[0]] }, { slides: [{ ...slides[0], number: NaN }] }]) {
    const html = htmlFor({ ...extra, view: 'workspace', onExpand() {} });
    assert.match(html, /暂不可操作/); assert.doesNotMatch(html, /data-slide-select|>导出课件<|打开课件/);
  }
  assert.match(htmlFor({ view: 'workspace', selectedSlideId: 'missing' }), /当前页面未列出/);
  assert.doesNotMatch(htmlFor({ view: 'workspace', selectedSlideId: 'missing' }), /a²|编辑标题与要点/);
});
test('missing callback is explicitly browse-only and cannot produce mutation controls', () => {
  const html = htmlFor({ view: 'workspace', onIntent: undefined });
  assert.match(html, /当前仅供浏览/); assert.doesNotMatch(html, /编辑标题与要点|>生成课件<|>导出课件</);
});
test('expand/back include original context and trigger; no saved state inferred', () => {
  reset(); const calls = [], trigger = {};
  const extra = { onExpand: (...args) => calls.push(args), onBack: value => calls.push(value) };
  button(capture({ ...extra, view: 'inline' }).nodes, '打开课件').props.onClick({ currentTarget: trigger });
  click(extra, '返回原位置');
  assert.deepEqual(calls, [[trigger, context], context]);
  assert.match(capture(extra).html, /未保存/);
});
test('unknown metadata is honest; plain text escaped; source/version/notice not repeated per page', () => {
  for (const mode of modes) {
    const html = htmlFor({ ...mode, notice: '唯一边界。', slides: slides.map(slide => ({ ...slide, points: '<script>text</script>\n  原样' })) });
    for (const text of ['唯一边界。', '备课提纲（模拟）', '课件 v1']) assert.equal(html.split(text).length - 1, 1);
    assert.doesNotMatch(html, /<script/);
    if (mode.view === 'workspace') assert.match(html, /&lt;script&gt;/);
  }
  const html = htmlFor({ source: undefined, versionLabel: undefined, save: undefined });
  assert.match(html, /来源：未确认/); assert.match(html, /版本未确认/); assert.match(html, /状态未确认/);
});
test('six-page simulated demo includes formula, pending page, notes, read-only and compact fixtures', () => {
  assert.equal(slideWorkspaceExample.length, 6);
  assert.ok(slideWorkspaceExample.some(slide => slide.points.includes('a² + b² = c²')));
  assert.ok(slideWorkspaceExample.some(slide => slide.status === '待补充'));
  assert.ok(slideWorkspaceExample.every(slide => slide.thumbnail.src.startsWith('data:image/svg+xml,')));
  const html = render(h(AgentSlideWorkspaceDemo));
  for (const text of ['id="slide-workspace"', '320px 窄容器', '只读版本示例', '勾股定理复习课', '由备课提纲生成（模拟）', '尚未提供可下载的演示文件']) assert.ok(html.includes(text), text);
  assert.equal((html.match(/data-agent-slide-view=/g) ?? []).length, 6);
  assert.doesNotMatch(html, /意图|宿主|回调|受控|opaque-/);
  assert.doesNotMatch(render(h(SlideWorkspaceExample, { readOnly: true })), /编辑标题与要点|新增一页|删除当前页|<textarea/);
});

test('page status unknown is stated once for the full deck, mixed pages only show known status', () => {
  for (const mode of modes) {
    const unknown = slides.map(slide => ({ ...slide, status: '  ' }));
    const allUnknown = htmlFor({ ...mode, slides: unknown });
    assert.equal(allUnknown.split('页面状态未确认').length - 1, 1);
    const mixed = htmlFor({ ...mode, slides: [slides[0], ...unknown.slice(1)] });
    assert.match(mixed, /已完成/); assert.doesNotMatch(mixed, /页面状态未确认/);
    assert.doesNotMatch(htmlFor({ ...mode, slides: [...unknown.slice(0, 3), { ...unknown[3], status: "已完成" }] }), /页面状态未确认/);
    assert.doesNotMatch(htmlFor({ ...mode, slides: [] }), /页面状态未确认/);
    assert.doesNotMatch(htmlFor({ ...mode, slides: unknown, capabilities: { ...all, view: { supported: false, reason: '无权查看。' } } }), /页面状态未确认/);
  }
});
