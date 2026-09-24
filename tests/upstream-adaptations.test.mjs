import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';

const root = fileURLToPath(new URL('../', import.meta.url));
const file = new URL('../.sites-runtime/upstream-adaptations-test.mjs', import.meta.url);
await mkdir(new URL('../.sites-runtime/', import.meta.url), { recursive: true });
const built = await build({ stdin: { contents: `
export {AgentComposer} from './components/prism-next/agent-components';
export {MetricSummary,StatusComposition} from './components/prism-next/data-display';
export {QuestionPrint} from './components/prism-next/question-print';
export {Badge} from './components/prism-next/badge';
export {Button} from './components/prism-next/button';
export {Toolbar,ToolbarButton,ToolbarLink} from './components/prism-next/toolbar';
export {Button as CossButton} from './components/coss/button';
export {Toolbar as CossToolbar} from './components/coss/toolbar';
`, resolveDir: root, loader: 'tsx' }, bundle: true, platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, write: false });
await writeFile(file, built.outputFiles[0].text);
const { AgentComposer, MetricSummary, StatusComposition, QuestionPrint, Badge, Button, Toolbar, ToolbarButton, ToolbarLink, CossButton, CossToolbar } = await import(file);
await rm(file);
const h = React.createElement;
const composer = { value: '外部草稿 x² − 3x + 2 = 0', onChange() {}, onSubmit() {} };
const items = [{ id: 'a', label: '分类甲', value: 3 }, { id: 'b', label: '分类乙', value: 1 }];
const inputTag = html => html.match(/<textarea\b[^>]*>/)?.[0];
const sendTag = html => html.match(/<button\b[^>]*type="submit"[^>]*>/)?.[0];

test('Composer defaults preserve editable draft, empty guard, running stop and explicit false compatibility in every variant', () => {
  for (const variant of ['default', 'compact', 'conversation']) {
    const props = { ...composer, variant };
    const html = render(h(AgentComposer, props));
    assert.equal(html, render(h(AgentComposer, { ...props, readOnly: false, sendDisabled: false })));
    assert.doesNotMatch(inputTag(html), / readonly=| readOnly=| disabled=| aria-describedby=/);
    assert.doesNotMatch(sendTag(html), / disabled=""/);
    assert.match(sendTag(render(h(AgentComposer, { ...props, value: '  ' }))), / disabled=""/);
    const running = render(h(AgentComposer, { ...props, running: true, onStop() {}, readOnly: true, sendDisabled: true }));
    assert.match(inputTag(running), / disabled=""/);
    assert.match(running, /停止/);
    assert.doesNotMatch(running, /type="submit"/);
    assert.doesNotMatch(running.match(/<button\b[^>]*>/)?.[0], / disabled=""/);
  }
});

test('Composer readOnly, sendDisabled and reason independently block sending; reason names both controls with unique instance IDs', () => {
  for (const variant of ['default', 'compact', 'conversation']) {
    for (const extra of [{ readOnly: true }, { sendDisabled: true }, { sendDisabledReason: '等待外部材料确认' }]) {
      const html = render(h(AgentComposer, { ...composer, variant, ...extra, scope: h('span', null, '外部范围') }));
      assert.match(sendTag(html), / disabled=""/);
      assert.match(html, /外部范围/);
      assert.doesNotMatch(inputTag(html), / disabled=""/);
      if (extra.readOnly) assert.match(inputTag(html), /readOnly=""/i);
      else assert.doesNotMatch(inputTag(html), /readonly/i);
      if (extra.sendDisabledReason) {
        const id = html.match(/<p id="([^"]+)" role="status"/)[1];
        assert.ok(inputTag(html).includes(`aria-describedby="${id}"`));
        assert.ok(sendTag(html).includes(`aria-describedby="${id}"`));
        assert.match(html, /等待外部材料确认<\/p>/);
      }
    }
  }
  const html = render(h('div', null, ...[1, 2].map(key => h(AgentComposer, { ...composer, key, sendDisabledReason: '待确认' }))));
  const ids = [...html.matchAll(/<p id="([^"]+)" role="status"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, 2);
});

test('compact metric preserves external detail, numeric typography, and inspect capability', () => {
  const props = { items: [{ id: 'a', label: '外部指标', value: 42, detail: '样本与分母由外部提供' }], onSelect() {} };
  assert.equal(render(h(MetricSummary, props)), render(h(MetricSummary, { ...props, density: 'default' })));
  const html = render(h(MetricSummary, { ...props, density: 'compact' }));
  assert.match(html, /grid-cols-2/); assert.match(html, /analytics-value/);
  assert.match(html, /样本与分母由外部提供/); assert.match(html, /查看外部指标明细/);
});

test('compact composition preserves accessible percentages, missing/invalid/zero facts and interactive target height', () => {
  assert.equal(render(h(StatusComposition, { items })), render(h(StatusComposition, { items, density: 'default' })));
  const html = render(h(StatusComposition, { items, density: 'compact', unit: '项' }));
  assert.match(html, /flex h-2 /); assert.match(html, /aria-label="分类甲：3项 · 75%"/);
  assert.match(html, /role="group" aria-label="分类乙：1项 · 25%"/);
  const interactive = render(h(StatusComposition, { items, density: 'compact', onSelect() {}, selectedId: 'b' }));
  assert.match(interactive, /flex h-8 /); assert.doesNotMatch(interactive, /flex h-2 /);
  assert.match(interactive, /aria-pressed="true"/); assert.match(interactive, /25%/);
  const invalid = render(h(StatusComposition, { density: 'compact', items: [...items, { id: 'zero', label: '零值', value: 0 }, { id: 'missing', label: '未知', value: null }, { id: 'invalid', label: '非法', value: -1 }] }));
  assert.match(invalid, /零值：0 · 0%/); assert.match(invalid, /未知：缺测/);
  assert.match(invalid, /1 项数量无效/); assert.match(invalid, /缺测 1 项/);
});

const question = { id: 'external-q', title: '外部题目', kind: '简答', response: 'long', points: 5, stem: '外部题干', answer: '外部答案' };
const printProps = { entries: [{ id: question.id, points: 5 }], questions: [question], versions: { [question.id]: '2.1' }, blocked: false, title: '外部试卷', minutes: 30, preferences: { mode: 'paper', margin: 16, fontSize: 12, spaces: {}, breaks: [] }, onPreferencesChange() {}, settingsOpen: false, onSettingsChange() {} };
test('print metadata is shown by default and can be hidden in every mode without changing question numbering or edition', () => {
  for (const mode of ['paper', 'compact', 'response', 'answers']) {
    const props = { ...printProps, preferences: { ...printProps.preferences, mode } };
    const original = render(h(QuestionPrint, props));
    assert.equal(original, render(h(QuestionPrint, { ...props, showQuestionIds: true })));
    assert.match(original, /external-q.*v2\.1/);
    const hidden = render(h(QuestionPrint, { ...props, showQuestionIds: false }));
    assert.doesNotMatch(hidden, /<p>external-q/);
    assert.match(hidden, /1\. 外部题目/);
    assert.equal(hidden.match(/D-[A-F0-9]{8}/)?.[0], original.match(/D-[A-F0-9]{8}/)?.[0]);
  }
});

test('attention is only an existing Badge appearance alias and preserves Prism lg default', () => {
  assert.equal(render(h(Badge, { variant: 'attention' }, '待人工处理')), render(h(Badge, { variant: 'error' }, '待人工处理')));
  assert.equal(render(h(Badge, {}, '提示')), render(h(Badge, { size: 'lg' }, '提示')));
});

test('Prism navigation Button keeps coss default output and disabled/loading/render semantics', () => {
  for (const props of [{}, { size: 'sm', variant: 'outline' }, { loading: true }, { disabled: true }, { render: h('a', { href: '#target' }) }]) {
    assert.equal(render(h(Button, props, '操作')), render(h(CossButton, props, '操作')));
  }
  const navigation = render(h(Button, { size: 'navigation', variant: 'outline' }, '长中文导航'));
  assert.match(navigation, /min-h-10 h-auto/); assert.match(navigation, /pointer-coarse:min-h-11/);
  assert.doesNotMatch(navigation, /sm:h-8/);
  const icon = render(h(Button, { size: 'navigation-icon', disabled: true, 'aria-label': '导航' }));
  assert.match(icon, /size-10 pointer-coarse:size-11/); assert.match(icon, / disabled=""/);
});

test('Prism Toolbar defaults to coss; plain retains the same root and child semantics without the frame', () => {
  const children = [h(ToolbarButton, { key: 'button' }, '操作'), h(ToolbarLink, { key: 'link', href: '#target' }, '导航')];
  const props = { 'aria-label': '外部工具栏' };
  assert.equal(render(h(Toolbar, props, children)), render(h(CossToolbar, props, children)));
  const html = render(h(Toolbar, { ...props, variant: 'plain' }, children));
  assert.match(html, /role="toolbar"/); assert.match(html, /aria-label="外部工具栏"/);
  assert.match(html, /data-slot="toolbar-button"/); assert.match(html, /href="#target"/);
  assert.doesNotMatch(html, /bg-card|rounded-xl/);
});

test('Composer form and keyboard entry points share all external blockers and preserve IME protection', () => {
  const find = (node, predicate) => {
    if (!React.isValidElement(node)) return undefined;
    if (predicate(node)) return node;
    for (const child of React.Children.toArray(node.props.children)) {
      const found = find(child, predicate);
      if (found) return found;
    }
  };
  for (const variant of ['default', 'compact', 'conversation']) {
    for (const blocker of [{}, { readOnly: true }, { sendDisabled: true }, { sendDisabledReason: '材料待确认' }, { running: true }, { value: ' ' }]) {
      let tree, submits = 0, prevented = 0;
      function Probe() {
        tree = AgentComposer({ ...composer, variant, ...blocker, onSubmit() { submits++; } });
        return tree;
      }
      render(h(Probe));
      const input = find(tree, node => typeof node.props.onKeyDown === 'function');
      const preventDefault = () => { prevented++; };
      tree.props.onSubmit({ preventDefault });
      input.props.onKeyDown({ key: 'Enter', ctrlKey: true, nativeEvent: { isComposing: false }, preventDefault });
      input.props.onKeyDown({ key: 'Enter', metaKey: true, nativeEvent: { isComposing: false }, preventDefault });
      assert.equal(submits, Object.keys(blocker).length ? 0 : 3, `${variant} ${JSON.stringify(blocker)}`);
      assert.equal(prevented, 3);
      input.props.onKeyDown({ key: 'Enter', ctrlKey: true, nativeEvent: { isComposing: true }, preventDefault });
      assert.equal(submits, Object.keys(blocker).length ? 0 : 3);
    }
  }
});
