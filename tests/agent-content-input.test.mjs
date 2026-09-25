import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import temml from 'temml';
import { previewDraft } from '../lib/prism-next/draft-math.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = new URL('../.sites-runtime/content-input/', import.meta.url);
await mkdir(runtime, { recursive: true });
const file = new URL('test-bundle.mjs', runtime);
const bundle = await build({ stdin: { contents: `export * from './components/prism-next/agent-content-input'; export * from './components/prism-next/demos/agent-content-input';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false });
await writeFile(file, bundle.outputFiles[0].text);
const { AgentContentInput, AgentContentInputDemo, ContentInputExample, contentInputExamples } = await import(file);
await rm(file);
const h = React.createElement;
const field = { id: 'opaque-field-0123456789', label: '题干', type: 'text', value: '  长中文草稿\n第二行 🙂  ', onChange() {} };
const props = { title: '内容输入示例', inputId: 'opaque-material-0123456789', content: field, baseVersion: '材料 v1', draftVersion: '草稿 v2' };
const modes = [{}, { view: 'workspace' }, { density: 'compact' }, { view: 'workspace', density: 'compact' }];
const htmlFor = extra => render(h(AgentContentInput, { ...props, ...extra }));
const textOf = html => html.replace(/<[^>]*>/g, '');
const freeze = value => { if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.freeze(value); Object.values(value).forEach(freeze); } return value; };

// Render the real controls and capture their handlers; no browser/keyboard claim.
function capture(extra) {
  const nodes = [], owned = new Set(['AgentContentInput', 'ContentField', 'ContentSource', 'ContentValidation', 'RecordDetails']);
  function inspect(node) {
    if (Array.isArray(node)) return node.map(inspect);
    if (!React.isValidElement(node)) return node;
    nodes.push(node);
    if (typeof node.type === 'function' && owned.has(node.type.name)) return h(function Probe() { return inspect(node.type(node.props)); });
    return React.cloneElement(node, {}, React.Children.map(node.props.children, inspect));
  }
  render(inspect(h(AgentContentInput, { ...props, ...extra })));
  return nodes;
}
const editors = nodes => nodes.filter(node => node.type.name === 'Textarea');
const button = (nodes, label) => nodes.find(node => node.props.onClick && node.props.children === label);

test('default inline and all densities retain exact controlled values; only host replacement updates content', () => {
  assert.equal(htmlFor(), htmlFor({ view: 'inline', density: 'default' }));
  for (const mode of modes) {
    const calls = [], input = { ...mode, content: freeze({ ...field, onChange: value => calls.push(value) }) };
    const before = htmlFor(input), editor = editors(capture(input))[0];
    const next = '  重新粘贴\n<script>保留文字</script>  ';
    editor.props.onChange({ target: { value: next } });
    assert.deepEqual(calls, [next]); assert.equal(editor.props.value, field.value); assert.equal(htmlFor(input), before);
    assert.equal(editors(capture({ ...input, content: { ...input.content, value: next } }))[0].props.value, next);
    assert.doesNotMatch(before, /opaque-field|opaque-material/);
  }
});

test('length and format limits are hints, never clipping, inferred validation or native input constraints', () => {
  for (const mode of modes) {
    const calls = [], input = { ...mode, content: { ...field, value: '中文🙂', limits: { maxLength: 1, format: '仅使用段落' }, onChange: value => calls.push(value) } };
    const html = htmlFor(input), editor = editors(capture(input))[0];
    assert.match(html, /3 字符.*上限 1 字符/); assert.match(html, /格式要求：仅使用段落/);
    for (const attr of ['maxLength', 'minLength', 'pattern', 'required', 'defaultValue']) assert.equal(editor.props[attr], undefined);
    assert.equal(editor.props['aria-invalid'], undefined); assert.doesNotMatch(html, /校验通过|校验未通过|超出/);
    editor.props.onChange({ target: { value: '远超上限的完整粘贴' } }); assert.deepEqual(calls, ['远超上限的完整粘贴']);
  }
});

test('validation comes only from host, retains failure until replacement and never silently decides submit policy', () => {
  for (const mode of modes) for (const [state, label] of [['invalid', '校验未通过'], ['valid', '校验通过'], ['unknown', '校验状态未确认']]) {
    const result = { state, message: '外部格式检查结果' }, calls = [];
    const input = { ...mode, content: { ...field, value: '<script>仍为文字</script>', validation: result }, validation: { state: 'unknown', message: '整体检查待确认' }, onSubmit: intent => calls.push(intent) };
    const html = htmlFor(input), nodes = capture(input), editor = editors(nodes)[0];
    assert.match(html, new RegExp(label)); assert.match(html, /外部格式检查结果|整体检查待确认/);
    assert.equal(editor.props['aria-invalid'], state === 'invalid' ? true : undefined);
    editor.props.onChange({ target: { value: '已修正文案' } }); assert.equal(htmlFor(input), html);
    button(nodes, '提交内容').props.onClick(); assert.equal(calls.length, 1);
  }
});

test('saving is exclusively external: missing is unknown, clicks and edits do not create a save or autosave fact', () => {
  for (const mode of modes) for (const [state, label] of [[undefined, '状态未确认'], ['unsaved', '未保存'], ['saved-draft', '已保存草稿'], ['submitted', '已提交'], ['conflict', '冲突'], ['unknown', '状态未确认']]) {
    const input = { ...mode, save: state ? { state } : undefined, onSubmit() {} }, before = htmlFor(input), nodes = capture(input);
    assert.match(before, new RegExp(label)); assert.doesNotMatch(before, /自动保存/);
    button(nodes, '提交内容').props.onClick(); editors(nodes)[0].props.onChange({ target: { value: '修改' } });
    assert.equal(htmlFor(input), before);
  }
  assert.match(htmlFor({ save: { state: 'saved-draft', autoSave: '上次保存于 10:30（示例）' } }), /自动保存：上次保存于 10:30/);
});

test('URL/paste provenance never fetches or turns a supplied excerpt into full-text evidence', () => {
  for (const mode of modes) for (const state of [undefined, 'not-fetched', 'fetching', 'excerpt', 'failed', 'unknown', 'full']) {
    const source = { kind: 'url', label: '教师提供的文章', url: 'javascript:alert(1)', fetch: state ? { state, description: '仅显示此条记录' } : undefined };
    const html = htmlFor({ ...mode, content: { ...field, type: 'url-excerpt', source } });
    assert.match(html, /教师提供的文章/); assert.doesNotMatch(html, /<a |href=|已读取|已加入上下文/);
    assert.equal(html.includes('已抓取全文'), state === 'full');
    if (state === undefined || state === 'unknown') assert.match(html, /全文抓取状态未确认/);
    if (state === 'not-fetched' || state === 'excerpt') assert.match(html, /未抓取全文/);
    if (state === 'failed') assert.match(html, /抓取失败/);
  }
  assert.match(htmlFor({ content: { ...field, type: 'url-excerpt', source: undefined } }), /来源：未提供.*全文抓取状态未确认/s);
  assert.match(htmlFor({ content: { ...field, source: { kind: 'paste', label: '练习材料第 2 页' } } }), /粘贴来源：练习材料第 2 页/);
});

test('Markdown and submitted content remain escaped text, without executing HTML, embeds or links', () => {
  const value = '# 标题\n- 列表\n<img src=x onerror=alert(1)>\n[链接](javascript:alert(1))';
  for (const mode of modes) {
    const html = htmlFor({ ...mode, content: { ...field, type: 'markdown', value }, submitted: { version: 'v0', fields: [{ label: '原稿', value }] } });
    assert.doesNotMatch(html, /<img|<script|href=|<iframe/); assert.match(html, /&lt;img/);
    assert.equal(editors(capture({ ...mode, content: { ...field, type: 'markdown', value } }))[0].props.value, value);
  }
});

test('three structured fields emit independent changes without merging or initializing from submitted snapshots', () => {
  const calls = [], fields = freeze(['目标', '活动', '检查'].map((label, index) => ({ ...field, id: String(index), label, value: index ? label : '', onChange: value => calls.push([index, value]) })));
  const input = { content: { type: 'structured', fields }, submitted: freeze({ version: '已提交 v1', fields: [{ label: '目标', value: '独立旧目标' }] }) };
  for (const mode of modes) {
    const before = htmlFor({ ...input, ...mode }), controls = editors(capture({ ...input, ...mode }));
    assert.equal(controls.length, 3); assert.equal(controls[0].props.value, '');
    controls[1].props.onChange({ target: { value: '  新活动  ' } });
    assert.deepEqual(calls.at(-1), [1, '  新活动  ']); assert.equal(htmlFor({ ...input, ...mode }), before);
    assert.match(before, /已提交版本：已提交 v1/);
    assert.equal(before.includes('独立旧目标'), mode.view === 'workspace');
  }
});

test('submit emits an exact version-bound snapshot and cannot mutate host fields via its payload', () => {
  const calls = [], input = { content: freeze(field), onSubmit: intent => calls.push(intent) }, before = htmlFor(input);
  button(capture(input), '提交内容').props.onClick();
  assert.deepEqual(calls, [{ inputId: props.inputId, baseVersion: '材料 v1', draftVersion: '草稿 v2', fields: [{ id: field.id, label: '题干', type: 'text', value: field.value }] }]);
  calls[0].fields[0].value = '不能回写'; assert.equal(htmlFor(input), before); assert.equal(field.value, '  长中文草稿\n第二行 🙂  ');
});

test('absent expand/submit/back have no entry; expansion and return preserve draft and save facts', () => {
  assert.doesNotMatch(htmlFor(), /展开编辑|提交内容|返回原位置/);
  const calls = [], trigger = {}, input = { onExpand: node => calls.push(node), onBack: () => calls.push('back') };
  const before = htmlFor(input); button(capture(input), '展开编辑').props.onClick({ currentTarget: trigger }); assert.equal(htmlFor(input), before);
  button(capture({ ...input, view: 'workspace' }), '返回原位置').props.onClick(); assert.deepEqual(calls, [trigger, 'back']);
  assert.doesNotMatch(htmlFor({ ...input, view: 'workspace' }), /展开编辑/);
});

test('readonly and submission blocks guard direct callbacks and preserve visible reasons in all densities', () => {
  for (const mode of modes) {
    const input = { ...mode, readOnlyReason: '归档材料只读', content: { ...field, onChange: () => assert.fail('readonly edit') }, onSubmit: () => assert.fail('readonly submit') };
    const nodes = capture(input), editor = editors(nodes)[0]; assert.equal(editor.props.readOnly, true);
    editor.props.onChange({ target: { value: '不应回传' } }); button(nodes, '提交内容').props.onClick(); assert.match(htmlFor(input), /归档材料只读/);
    const blocked = { ...mode, submitDisabledReason: '正在核对原请求结果', onSubmit: () => assert.fail('duplicate request') };
    assert.equal(editors(capture(blocked))[0].props.readOnly, false); button(capture(blocked), '提交内容').props.onClick();
    assert.match(htmlFor(blocked), /正在核对原请求结果/);
    const noChange = { ...mode, content: { ...field, onChange: undefined } };
    assert.equal(editors(capture(noChange))[0].props.readOnly, true); assert.match(htmlFor(noChange), /当前内容只读/);
    const fieldOnly = { ...mode, content: { ...field, readOnlyReason: '此字段暂不可编辑', onChange: () => assert.fail('field readonly') } };
    editors(capture(fieldOnly))[0].props.onChange({ target: { value: '不应回传' } }); assert.match(htmlFor(fieldOnly), /此字段暂不可编辑/);
  }
});

test('compact never hides failure/conflict/source facts; conflict preserves input and blocks stale submission', () => {
  const input = { content: { ...field, validation: { state: 'invalid', message: '缺少右花括号' }, source: { kind: 'url', label: '文章片段', url: 'https://example.com', fetch: { state: 'not-fetched' } } },
    save: { state: 'conflict', description: '原版本发生变化' }, conflict: { baseVersion: 'v1', currentVersion: 'v3', description: '当前输入保留，请比较后再提交。' }, onSubmit: () => assert.fail('conflict submit') };
  for (const view of ['inline', 'workspace']) {
    assert.equal(textOf(htmlFor({ ...input, view })), textOf(htmlFor({ ...input, view, density: 'compact' })));
    const html = htmlFor({ ...input, view, density: 'compact' });
    for (const text of ['缺少右花括号', '原版本发生变化', '基准 v1 / 当前 v3', '当前输入保留', '未抓取全文']) assert.ok(html.includes(text));
    assert.doesNotMatch(html, /truncate|line-clamp|collapsible/);
    button(capture({ ...input, view, density: 'compact' }), '提交内容').props.onClick();
  }
  // Either external conflict fact blocks, even if the other is missing/inconsistent.
  button(capture({ ...input, conflict: undefined }), '提交内容').props.onClick();
  button(capture({ ...input, save: { state: 'saved-draft' } }), '提交内容').props.onClick();
});

test('fixed labels and associated errors/counts/saving facts remain available for empty, invalid and readonly fields', () => {
  for (const mode of modes) for (const extra of [{ value: '' }, { validation: { state: 'invalid', message: '格式错误' } }, { readOnlyReason: '只读内容' }]) {
    const html = htmlFor({ ...mode, content: { ...field, ...extra, limits: { maxLength: 20, format: '段落' }, description: '填写题干正文' } });
    const label = html.match(/<label[^>]*for="([^"]+)"[^>]*>题干<\/label>/); assert.ok(label);
    assert.ok(html.includes(`id="${label[1]}"`)); assert.match(html, /data-slot="input-group"/);
    for (const match of html.matchAll(/aria-(?:labelledby|describedby)="([^"]+)"/g)) for (const ref of match[1].split(' ')) assert.ok(html.includes(`id="${ref}"`), ref);
    for (const control of editors(capture({ ...mode, content: { ...field, ...extra }, describedBy: 'outer-review-status' }))) assert.ok(control.props['aria-describedby'].includes('outer-review-status'));
    for (const node of capture({ ...mode, onSubmit() {}, onExpand() {}, onBack() {} }).filter(node => node.props.onClick)) assert.equal(node.props.type, 'button');
  }
});

test('preview receives current draft only; real math parser failures retain original input without validation or save changes', () => {
  const seen = [], bad = String.raw`当前公式 \(\frac{1}{x\)`;
  const input = { view: 'workspace', content: { ...field, value: bad }, renderPreview: current => {
    seen.push(current);
    return h('div', { 'aria-label': '草稿公式预览' }, previewDraft(current.value, temml.renderToString).map((part, index) =>
      part.kind === 'math' ? h('span', { key: index, dangerouslySetInnerHTML: { __html: part.html } }) : h('span', { key: index }, part.source, part.kind === 'error' && h('p', null, part.message))));
  } };
  const html = htmlFor(input); assert.match(html, /输入已保留/); assert.ok(html.includes(bad)); assert.doesNotMatch(html, /校验未通过|已保存草稿/);
  assert.equal(editors(capture(input))[0].props.value, bad); assert.equal(seen[0].value, bad);
  const good = String.raw`新公式 \(\frac{1}{\sqrt{x^2+1}}\)`;
  assert.match(htmlFor({ ...input, content: { ...field, value: good } }), /<mfrac>/);
  assert.doesNotMatch(htmlFor({ ...input, content: { ...field, value: '' } }), /<mfrac>/);
  const count = seen.length; htmlFor({ ...input, view: 'inline' }); assert.equal(seen.length, count);
});

test('extra explanations are closed, with only one caller boundary notice', () => {
  for (const mode of modes) {
    const input = { ...mode, notice: '唯一边界提示', details: h('p', null, '次要补充说明') }, html = htmlFor(input);
    assert.equal(html.split('唯一边界提示').length - 1, 1); assert.doesNotMatch(html, /次要补充说明/);
    const gate = capture(input).find(node => node.type.name === 'Collapsible'); assert.equal(gate.props.defaultOpen, false);
    assert.match(render(React.cloneElement(gate, { open: true })), /次要补充说明/);
  }
});

test('empty groups and missing/ambiguous material identities are explicit and cannot submit to an unknown target', () => {
  assert.match(htmlFor({ content: { type: 'structured', fields: [] } }), /尚未提供输入字段/);
  for (const extra of [{ inputId: '' }, { content: { ...field, id: '' } }, { content: { type: 'structured', fields: [field, field] } }]) {
    const input = { ...extra, onSubmit: () => assert.fail('unknown target') };
    assert.match(htmlFor(input), /内容归属未确认/); button(capture(input), '提交内容').props.onClick();
  }
});

test('two labelled fixtures cover three presentations, shared material input, formulas, URL source and narrow containers', async () => {
  for (const purpose of ['question', 'teaching']) {
    const html = render(h(ContentInputExample, { purpose, narrow: true }));
    for (const text of ['固定示例', 'data-content-input-view="inline"', 'data-content-input-view="workspace"', 'data-content-input-density="compact"', 'max-w-[320px]', '当前草稿', '已提交版本']) assert.ok(html.includes(text), text);
    assert.doesNotMatch(textOf(html), /宿主|回调|意图|受控/);
    if (purpose === 'question') { assert.match(html, /参考答案中的分式缺少右花括号/); assert.match(html, /当前题干与答案预览/); assert.match(html, /prism-draft-preview/); }
    else for (const text of ['目标', '活动', '检查', '未抓取全文', 'https://example.com/teaching/review']) assert.ok(html.includes(text));
    await writeFile(new URL(`example-${purpose}.html`, runtime), html);
    for (const mode of modes) await writeFile(new URL(`${purpose}-${mode.view ?? 'inline'}-${mode.density ?? 'default'}.html`, runtime), htmlFor({ ...mode, title: contentInputExamples[purpose].title, content: { type: 'structured', fields: contentInputExamples[purpose].fields } }));
  }
  assert.match(render(h(AgentContentInputDemo)), /id="content-input"/);
});

test('standalone AgentContentInput bundles without pulling math, business storage or fetching into its dependency graph', async () => {
  const standalone = await build({ entryPoints: [`${root}components/prism-next/agent-content-input.tsx`], bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, write: false, metafile: true });
  const paths = Object.keys(standalone.metafile.inputs).join('\n');
  assert.doesNotMatch(paths, /temml|draft-math|agent-document-workspace|agent-components|ole-school-workbench/);
  assert.doesNotMatch(standalone.outputFiles[0].text, /localStorage|sessionStorage|fetch\(|setTimeout\(|setInterval\(/);
});
