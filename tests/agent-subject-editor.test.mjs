import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import temml from 'temml';
import { previewFormula, draftMathErrorLocation } from '../lib/prism-next/draft-math.ts';
import {
  createSubjectHistory, insertSubjectTool, reconcileSubjectHistory, recordSubjectEdit, stepSubjectHistory,
  subjectChangeIntent, subjectQuickTools, subjectSelection, subjectToolGroups,
} from '../lib/prism-next/subject-editor.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = new URL('../.sites-runtime/subject-editor/', import.meta.url);
await mkdir(runtime, { recursive: true });
const file = new URL('test-bundle.mjs', runtime);
const bundle = await build({ stdin: { contents: `export * from './components/prism-next/agent-subject-editor'; export * from './components/prism-next/demos/agent-subject-editor'; export { DraftMathFeedback } from './components/prism-next/draft-math-preview';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false });
await writeFile(file, bundle.outputFiles[0].text);
const { AgentSubjectEditor, AgentSubjectEditorDemo, SubjectEditorExample, subjectEditorExamples, DraftMathFeedback } = await import(file);
await rm(file);
const h = React.createElement;
const target = { formulaId: 'opaque-formula-id', baseVersion: 'opaque-base-token', formulaMode: 'inline' };
const props = { ...target, location: '第 1 题题干 · 第 2 个公式', baseVersionLabel: '原稿 v1', value: 'a² + b² = c²', onIntent() {} };
const modes = [{}, { view: 'workspace' }, { density: 'compact' }, { view: 'workspace', density: 'compact' }];
const tools = subjectToolGroups.flatMap(group => group.tools);
const tool = id => tools.find(item => item.id === id);
const htmlFor = extra => render(h(AgentSubjectEditor, { ...props, ...extra }));
const textOf = html => html.replace(/<[^>]*>/g, '');
const freeze = value => { if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.freeze(value); Object.values(value).forEach(freeze); } return value; };

// Inspect real handler closures. This is not a browser or screen-reader test.
function capture(extra) {
  const nodes = [], owned = new Set(['AgentSubjectEditor', 'SubjectToolbar', 'RecordDetails']);
  function inspect(node) {
    if (Array.isArray(node)) return node.map(inspect);
    if (!React.isValidElement(node)) return node;
    nodes.push(node);
    if (typeof node.type === 'function' && owned.has(node.type.name)) return h(function Probe() { return inspect(node.type(node.props)); });
    return React.cloneElement(node, {}, React.Children.map(node.props.children, inspect));
  }
  render(inspect(h(AgentSubjectEditor, { ...props, ...extra })));
  return nodes;
}
const editor = nodes => nodes.find(node => node.type.name === 'Textarea');
const button = (nodes, label) => nodes.find(node => node.props.onClick && (node.props.children === label || node.props['aria-label'] === label));

test('SSR: inline has quick editing; workspace adds all five tool groups and local history', () => {
  assert.equal(htmlFor(), htmlFor({ view: 'inline', density: 'default' }));
  for (const mode of modes) {
    const html = htmlFor(mode), nodes = capture(mode);
    assert.match(html, /公式原文|当前公式预览/);
    assert.match(html, /第 1 题题干 · 第 2 个公式/); assert.match(html, /基准版本：原稿 v1/);
    assert.equal(editor(nodes).props.value, props.value);
    assert.doesNotMatch(html, /opaque-formula-id|opaque-base-token/);
    for (const label of ['插入分式', '插入根式', '插入上标', '插入下标', '插入括号']) assert.ok(html.includes(label));
    assert.equal(html.includes('希腊字母'), mode.view === 'workspace');
    assert.equal(html.includes('本次公式编辑历史'), mode.view === 'workspace');
    assert.equal(html.includes('常用插入'), mode.view !== 'workspace');
    if (mode.view === 'workspace') for (const label of ['结构', '关系', '运算', '希腊字母', '集合', '撤销', '重做']) assert.ok(html.includes(label));
  }
});

test('insertion pure function preserves prefix/suffix, supports selected parameters, clamps offsets and defaults to append', () => {
  const source = 'a+b';
  assert.deepEqual(insertSubjectTool(source, tool('fraction'), { start: 1, end: 1 }), { value: 'a\\frac{a}{b}+b', selection: { start: 7, end: 8 } });
  assert.deepEqual(insertSubjectTool(source, tool('root'), { start: 0, end: 3 }), { value: '\\sqrt{a+b}', selection: { start: 6, end: 9 } });
  const end = insertSubjectTool(source, tool('times'));
  assert.equal(end.value, 'a+b\\times '); assert.deepEqual(end.selection, { start: end.value.length, end: end.value.length });
  assert.equal(insertSubjectTool(source, tool('pm'), { start: 0, end: 3 }).value, '\\pm ');
  assert.deepEqual(subjectSelection(source, { start: 99, end: -1 }), { start: 0, end: 3 });
  assert.deepEqual(subjectSelection(source, { start: NaN, end: Infinity }), { start: 3, end: 3 });
  assert.equal(insertSubjectTool('α🙂b', tool('root'), { start: 1, end: 3 }).value, 'α\\sqrt{🙂}b');
  const snapshot = freeze({ value: source, selection: { start: 1, end: 1 } });
  insertSubjectTool(snapshot.value, freeze({ ...tool('root') }), snapshot.selection);
  assert.equal(snapshot.value, source);
});

test('every offered structure/symbol produces renderable MathML with the pinned renderer', () => {
  assert.equal(subjectQuickTools.length, 8);
  for (const item of tools) {
    const edit = insertSubjectTool('x', item);
    const parts = previewFormula(edit.value, temml.renderToString);
    assert.equal(parts[0].kind, 'math', `${item.label}: ${edit.value}`);
    assert.match(parts[0].html, /<math/);
    assert.match(parts[0].html, /<annotation encoding="application\/x-tex">/);
  }
});

test('actual insertion and text handlers emit exact version-bound changes at the caret and at the end', () => {
  for (const mode of modes) for (const atCaret of [false, true]) {
    const calls = [], nodes = capture({ ...mode, value: 'a+b', onIntent: intent => calls.push(intent) });
    if (atCaret) editor(nodes).props.onSelect({ currentTarget: { value: 'a+b', selectionStart: 1, selectionEnd: 2 } });
    button(nodes, '插入分式').props.onClick();
    const edit = insertSubjectTool('a+b', tool('fraction'), atCaret ? { start: 1, end: 2 } : undefined);
    assert.deepEqual(calls, [subjectChangeIntent(target, edit)]);
    assert.equal(editor(nodes).props.value, 'a+b');
    editor(nodes).props.onChange({ target: { value: '  x\n + y  ', selectionStart: 4, selectionEnd: 4 } });
    assert.deepEqual(calls[1], { ...target, type: 'change', value: '  x\n + y  ' });
  }
});

test('history pure functions round-trip values and carets without mutating old snapshots; new edits clear redo', () => {
  const initial = freeze(createSubjectHistory('a+b'));
  const edit = insertSubjectTool(initial.present.value, tool('root'), { start: 0, end: 3 });
  const first = freeze(recordSubjectEdit(initial, edit, { start: 0, end: 3 }));
  const second = freeze(recordSubjectEdit(first, insertSubjectTool(edit.value, tool('pm'))));
  const undo = stepSubjectHistory(second, 'undo');
  assert.equal(undo.present.value, edit.value);
  assert.deepEqual(stepSubjectHistory(undo, 'redo'), second);
  const original = stepSubjectHistory(undo, 'undo');
  assert.equal(original.present.value, 'a+b'); assert.deepEqual(original.present.selection, { start: 0, end: 3 });
  assert.equal(stepSubjectHistory(original, 'undo'), original);
  assert.equal(stepSubjectHistory(second, 'redo'), second);
  const branch = recordSubjectEdit(undo, { value: 'y', selection: { start: 1, end: 1 } });
  assert.equal(branch.future.length, 0); assert.equal(initial.past.length, 0);
  assert.equal(recordSubjectEdit(first, { value: first.present.value, selection: { start: 0, end: 0 } }), first);
});

test('controlled history only accepts matching page values; rejected requests and external identities/versions cannot undo stale content', () => {
  const scope = JSON.stringify(['q1-formula2', 'v1', 'inline']);
  const initial = createSubjectHistory('x'), next = recordSubjectEdit(initial, insertSubjectTool('x', tool('root')));
  const pending = freeze({ scope, history: initial, pending: next });
  assert.equal(reconcileSubjectHistory(pending, scope, 'x'), pending);
  assert.equal(reconcileSubjectHistory(pending, scope, 'x').history.past.length, 0);
  const accepted = reconcileSubjectHistory(pending, scope, next.present.value);
  assert.equal(accepted.history, next); assert.equal(accepted.pending, undefined);
  // view and density are deliberately absent from the scope.
  assert.equal(reconcileSubjectHistory(accepted, scope, next.present.value), accepted);
  for (const newScope of [JSON.stringify(['q2-formula1', 'v1', 'inline']), JSON.stringify(['q1-formula2', 'v2', 'inline']), JSON.stringify(['q1-formula2', 'v1', 'block'])]) {
    const reset = reconcileSubjectHistory(accepted, newScope, next.present.value);
    assert.equal(reset.history.past.length, 0); assert.equal(reset.history.future.length, 0);
  }
  const external = reconcileSubjectHistory(accepted, scope, '外部新原文');
  assert.equal(external.history.present.value, '外部新原文'); assert.equal(external.history.past.length, 0);
});

test('apply/cancel/expand/back remain distinct: exact formula snapshot, no save or implicit replacement', () => {
  for (const mode of modes) {
    const calls = [], input = { ...mode, onIntent: intent => calls.push(intent), onExpand: trigger => calls.push(trigger), onBack: () => calls.push('back') };
    const before = htmlFor(input), nodes = capture(input);
    button(nodes, '确认替换').props.onClick(); button(nodes, '取消编辑').props.onClick();
    assert.deepEqual(calls.slice(0, 2), [{ ...target, type: 'apply', value: props.value }, { ...target, type: 'cancel' }]);
    if (mode.view === 'workspace') button(nodes, '返回原位置').props.onClick();
    else button(nodes, '展开公式编辑').props.onClick({ currentTarget: 'trigger' });
    assert.equal(calls.at(-1), mode.view === 'workspace' ? 'back' : 'trigger');
    assert.equal(htmlFor(input), before); assert.doesNotMatch(before, /已保存|已替换|已提交/);
  }
  assert.doesNotMatch(htmlFor(), /展开公式编辑|返回原位置/);
});

test('readonly, missing identity and apply-disabled reasons protect handler calls as well as disabled controls', () => {
  for (const mode of modes) for (const extra of [{ readOnlyReason: '历史原文只读' }, { formulaId: '' }, { baseVersion: '' }, { location: '' }, { onIntent: undefined }]) {
    const calls = [], input = { ...mode, onIntent: intent => calls.push(intent), ...extra }, nodes = capture(input);
    assert.equal(editor(nodes).props.readOnly, true);
    editor(nodes).props.onChange({ target: { value: 'blocked', selectionStart: 0, selectionEnd: 0 } });
    button(nodes, '插入分式').props.onClick(); button(nodes, '确认替换')?.props.onClick();
    if (mode.view === 'workspace') for (const label of ['撤销', '重做']) button(nodes, label).props.onClick();
    assert.equal(calls.length, 0); assert.match(htmlFor(input), /只读|未确认，暂不可编辑/);
  }
  const calls = [], nodes = capture({ applyDisabledReason: '原内容已有新版本，请重新核对。', onIntent: intent => calls.push(intent) });
  button(nodes, '确认替换').props.onClick(); assert.equal(calls.length, 0);
  button(nodes, '插入分式').props.onClick(); assert.equal(calls[0].type, 'change');
  assert.match(htmlFor({ density: 'compact', applyDisabledReason: '原内容已有新版本，请重新核对。' }), /原内容已有新版本/);
});

test('single-formula preview shares safe parsing, includes annotated MathML, and never modifies the controlled source', () => {
  for (const block of [false, true]) {
    const value = String.raw`\frac{1}{\sqrt{x^2+1}}`, part = previewFormula(value, temml.renderToString, block)[0];
    assert.equal(part.source, value); assert.equal(part.block, block);
    assert.match(part.html, /<mfrac>/); assert.match(part.html, /<msqrt>/); assert.match(part.html, /application\/x-tex/);
  }
  for (const value of ['', String.raw`\frac{1}{x`, String.raw`\href{javascript:alert(1)}{x}`, String.raw`\textcolor{red}{x}`, String.raw`\def\a{\a}\a`, 'x'.repeat(1001)]) {
    const part = previewFormula(value, temml.renderToString)[0];
    assert.equal(part.kind, 'error'); assert.equal(part.source, value); assert.equal(part.html, undefined);
  }
});

test('parse failures show actual Temml line/column and a locate action, with honest unknown positions', () => {
  const value = 'x+\n\\unknown{x}', parts = previewFormula(value, temml.renderToString);
  assert.equal(parts[0].kind, 'error'); assert.equal(parts[0].position, 3);
  const location = draftMathErrorLocation(value, parts[0].position);
  assert.deepEqual(location, { start: 3, end: 4, line: 2, column: 1 });
  const html = render(h(DraftMathFeedback, { value, parts, onLocateError() {} }));
  assert.match(html, /公式未能排版/); assert.match(html, /输入已保留/); assert.match(html, /第 2 行，第 1 列/); assert.match(html, /定位到原文/);
  const eofValue = String.raw`\frac{1}{x`, eof = previewFormula(eofValue, temml.renderToString);
  assert.equal(eof[0].position, eofValue.length);
  assert.match(render(h(DraftMathFeedback, { value: eofValue, parts: eof })), /原文末尾/);
  const unknown = previewFormula('x', () => { throw new Error('no location'); });
  assert.equal(unknown[0].position, undefined);
  assert.match(render(h(DraftMathFeedback, { value: 'x', parts: unknown })), /暂无法确定具体位置/);
  assert.deepEqual(draftMathErrorLocation('🙂\nx', 3), { start: 3, end: 4, line: 2, column: 1 });
  assert.equal(draftMathErrorLocation('x', -1), undefined); assert.equal(draftMathErrorLocation('x', NaN), undefined);
});

test('fixed labels, raw source, one boundary and collapsed details remain in both densities; no internal terms', () => {
  for (const view of ['inline', 'workspace']) {
    assert.equal(textOf(htmlFor({ view })), textOf(htmlFor({ view, density: 'compact' })));
    const input = { view, details: h('p', null, '额外说明'), value: '<script>原文</script>' }, html = htmlFor(input);
    assert.equal(html.split('仅排版，不校验数学结论。').length - 1, 1);
    assert.doesNotMatch(html, /额外说明|复杂公式怎么输入|<script>/); assert.match(html, /&lt;script&gt;/);
    const label = html.match(/<label[^>]*for="([^"]+)"[^>]*>公式原文<\/label>/); assert.ok(label);
    assert.ok(html.includes(`id="${label[1]}"`));
    for (const match of html.matchAll(/aria-(?:describedby|labelledby)="([^"]+)"/g)) for (const ref of match[1].split(' ')) assert.ok(html.includes(`id="${ref}"`), ref);
    assert.doesNotMatch(textOf(html), /宿主|回调|意图|受控|opaque-/);
    const gate = capture(input).find(node => node.type.name === 'Collapsible'); assert.equal(gate.props.defaultOpen, false);
    assert.match(render(React.cloneElement(gate, { open: true })), /额外说明/);
  }
});

test('keyboard toolbar groups expose a single tab stop, named buttons and arrow/Home/End navigation handlers', () => {
  for (const mode of modes) {
    const nodes = capture(mode);
    const groups = nodes.filter(node => node.props.role === 'toolbar');
    for (const group of groups) {
      const children = React.Children.toArray(group.props.children);
      assert.equal(children.filter(node => node.props.tabIndex === 0).length, 1);
      for (const child of children) { assert.match(child.props['aria-label'], /^插入/); assert.equal(child.props.type, 'button'); }
      const focused = [], buttons = [0, 1, 2].map(index => ({ focus: () => focused.push(index) }));
      for (const [key, expected] of [['ArrowRight', 1], ['ArrowLeft', 2], ['End', 2], ['Home', 0]]) {
        let prevented = false;
        group.props.onKeyDown({ key, currentTarget: { querySelectorAll: () => buttons }, target: buttons[0], preventDefault: () => { prevented = true; } });
        assert.equal(prevented, true); assert.equal(focused.at(-1), expected);
      }
    }
    const control = editor(nodes);
    let prevented = false;
    control.props.onKeyDown({ key: 'z', ctrlKey: true, nativeEvent: { isComposing: true }, preventDefault: () => { prevented = true; } });
    assert.equal(prevented, false);
    control.props.onKeyDown({ key: 'z', ctrlKey: true, nativeEvent: {}, preventDefault: () => { prevented = true; } });
    assert.equal(prevented, true);
  }
});

test('fixtures provide Pythagoras, fraction/root and failure examples with real view switching and 320px containers', async () => {
  const demo = render(h(AgentSubjectEditorDemo));
  for (const text of ['id="subject-editor"', '勾股定理', '分式与根式', '解析失败', '320px 窄容器', 'a² + b² = c²']) assert.ok(demo.includes(text), text);
  for (const sample of subjectEditorExamples) {
    const html = render(h(SubjectEditorExample, { sample, narrow: true }));
    assert.match(html, /max-w-\[320px\]/); assert.match(html, /固定示例/); assert.doesNotMatch(textOf(html), /宿主|意图|回调|受控/);
    for (const theme of ['light', 'paper', 'dark']) for (const mode of modes) {
      const content = `<div data-ui-version="coss-v1" data-prism-theme="${theme}" style="max-width:320px">${htmlFor({ ...mode, value: sample.value, formulaMode: sample.mode })}</div>`;
      await writeFile(new URL(`${sample.id}-${theme}-${mode.view ?? 'inline'}-${mode.density ?? 'default'}.html`, runtime), content);
    }
  }
});

test('42 owns neither persistence nor execution; 06 remains free of the math/editor dependency graph', async () => {
  const standalone = await build({ entryPoints: [`${root}components/prism-next/agent-content-input.tsx`], bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, write: false, metafile: true });
  assert.doesNotMatch(Object.keys(standalone.metafile.inputs).join('\n'), /subject-editor|draft-math|temml/);
  const source = await readFile(new URL('../components/prism-next/agent-subject-editor.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /localStorage|sessionStorage|fetch\(|setTimeout\(|setInterval\(|ole-school-workbench/);
});
