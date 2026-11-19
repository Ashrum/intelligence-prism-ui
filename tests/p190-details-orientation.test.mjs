import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { build } from 'esbuild';
import { createTestRuntime } from './helpers/test-runtime.mjs';

const runtime = await createTestRuntime('p190');
const component = 'components/prism-next/question-details.tsx';
const props = {
  question: { id: 'Q-190', kind: '单选题', title: '测试题', answer: 'A', explanation: '示例解析' },
  metadata: { knowledge: ['函数'], version: '1' }, links: {}, tab: 'teaching',
  onTabChange() {}, onLinksChange() {},
};

// Exercise the component's own resize callback without a browser. Only its three
// layout hooks are substituted. Child components, including coss Tabs, render normally.
async function fixture(baseline) {
  const source = baseline
    ? execFileSync('git', ['show', 'b726dceb:' + component], { encoding: 'utf8' })
    : await readFile(component, 'utf8');
  const hooks = `
    let observed, measured;
    const node = {};
    function fixtureRef() { return { current: node } }
    function fixtureState(initial) { return [measured ?? initial, value => { measured = value }] }
    function fixtureEffect(effect) { effect() }
    class ResizeObserver {
      constructor(callback) { this.callback = callback }
      observe(target) { if (target === node) observed = this.callback }
    }
    export function layout(props, width) {
      measured = undefined;
      observed = undefined;
      const initial = QuestionDetails(props);
      if (!observed) return initial;
      observed([{ contentRect: { width } }]);
      return QuestionDetails(props);
    }
  `;
  const bundle = await build({
    stdin: { contents: source.replace('const containerRef=',
      'const useRef = fixtureRef, useState = fixtureState, useEffect = fixtureEffect; const containerRef=') + hooks,
      resolveDir: path.resolve(path.dirname(component)), loader: 'tsx' },
    bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external',
    alias: { '@': process.cwd() }, loader: { '.css': 'empty' }, write: false,
  });
  const file = new URL(baseline ? 'before.mjs' : 'after.mjs', runtime);
  await writeFile(file, bundle.outputFiles[0].text);
  return import(file);
}
const before = await fixture(true);
const after = await fixture(false);

test('P190 omitted and explicit auto match P189 markup on either side of the 560px threshold', () => {
  for (const width of [320, 480, 559, 560, 800]) {
    for (const tab of ['answer', 'teaching', 'archive']) {
      const input = { ...props, tab };
      const expected = renderToStaticMarkup(before.layout(input, width));
      for (const orientation of [undefined, 'auto']) {
        const html = renderToStaticMarkup(after.layout({ ...input, orientation }, width));
        assert.equal(html, expected);
        assert.ok(html.includes('data-orientation="' + (width >= 560 ? 'vertical' : 'horizontal') + '"'));
      }
    }
  }
});

test('P190 fixed vertical uses coss vertical tabs at 320, 480 and 800px', () => {
  for (const width of [320, 480, 800]) {
    const html = renderToStaticMarkup(after.layout({ ...props, orientation: 'vertical' }, width));
    assert.match(html, /aria-orientation="vertical"/);
    assert.doesNotMatch(html, /data-orientation="horizontal"/);
    assert.match(html, /w-24 shrink-0/);
    assert.match(html, /@max-\[400px\]\/question-details:\[&amp;_\[data-slot=tabs-list\]\]:w-16/);
    assert.match(html, /@max-\[400px\]\/question-details:\[&amp;_dl&gt;div\]:grid-cols-1/);
    for (const [short, full] of [['答案', '答案与解析'], ['定位', '教学定位'], ['档案', '题目档案']]) {
      assert.ok(html.includes('@min-[400px]/question-details:hidden">' + short));
      assert.ok(html.includes('hidden @min-[400px]/question-details:inline">' + full));
      assert.ok(html.includes('aria-label="' + full + '"'));
    }
  }
});

test('P190 keeps the P189 vertical keyboard contract and controlled tab selection', () => {
  let selected = 'answer';
  for (const value of ['teaching', 'archive', 'answer']) {
    const input = { ...props, orientation: 'vertical', tab: selected, onTabChange(tab) { selected = tab } };
    const tabs = after.layout(input, 320).props.children;
    tabs.props.onValueChange(value);
    assert.equal(selected, value);
    const markup = renderToStaticMarkup(after.layout({ ...input, tab: selected }, 320));
    const previous = renderToStaticMarkup(before.layout({ ...props, tab: selected }, 800));
    const controls = html => html.match(/<button\b[^>]*role="tab"[^>]*>|<div\b[^>]*role="tabpanel"[^>]*>/g);
    assert.equal(controls(markup).length, 4);
    assert.deepEqual(controls(markup), controls(previous));
  }
});

test('P190 narrow fixed vertical stacks answer section labels above full-width values', () => {
  const question = { ...props.question, parts: [{ id: '1', answer: 'A', explanation: '分步解析',
    rubric: [{ id: 'step', label: '列式正确', points: 2 }] }] };
  const html = renderToStaticMarkup(after.layout({ ...props, question, tab: 'answer', orientation: 'vertical' }, 390));
  const narrow = '@max-[400px]/question-details:[&amp;_.question-solution';
  for (const rule of [
    ']:space-y-2', '&gt;section:nth-child(-n+2)]:pl-0',
    '&gt;section:nth-child(-n+2)&gt;h4]:static', '&gt;section:nth-child(-n+2)&gt;h4]:w-auto',
    '&gt;section&gt;h4]:text-ui-hint!', '&gt;section&gt;h4]:text-muted-foreground',
  ]) assert.ok(html.includes(narrow + rule), rule);
  assert.match(html, /参考答案<\/h4>A/);
  assert.match(html, /解析<\/h4>示例解析/);
  assert.match(html, /第 1 小问<\/h4>[\s\S]*分步解析[\s\S]*列式正确/);
});
