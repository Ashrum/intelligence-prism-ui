import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createTestRuntime } from './helpers/test-runtime.mjs';

const root = process.cwd();
const runtime = await createTestRuntime('p171');
async function load(baseline = false) {
  const result = await build({
    stdin: { contents: `export * from './components/prism-next/question-card'; export * from './components/prism-next/question-content'; export * from './components/prism-next/question-presentation'; export * from './components/prism-next/difficulty-mix';`, resolveDir: root, loader: 'tsx' },
    bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, write: false, loader: { '.css': 'empty' },
    plugins: baseline ? [{ name: 'p171-baseline', setup(builder) {
      builder.onLoad({ filter: /prism-next\/question-(card|content|presentation)\.tsx$/ }, ({ path: file }) => ({ contents: execFileSync('git', ['show', `42d77fb:${path.relative(root, file)}`], { encoding: 'utf8' }), loader: 'tsx' }));
    } }] : [],
  });
  const file = new URL(baseline ? 'baseline.mjs' : 'current.mjs', runtime);
  await writeFile(file, result.outputFiles[0].text);
  return import(file.href);
}
const current = await load();
const baseline = await load(true);
const render = (component, props) => renderToStaticMarkup(React.createElement(component, props));
const question = { id: 'Q-171', title: '函数与长中文题目', kind: '单选题', points: 5, difficulty: '基础', stem: React.createElement('math', { 'aria-label': 'x平方' }, React.createElement('msup', {}, React.createElement('mi', {}, 'x'), React.createElement('mn', {}, '2'))), options: [{ id: 'A', content: '选项一' }, { id: 'B', content: '选项二' }] };
const long = { ...question, kind: '解答题', options: undefined, parts: [{ id: '1', content: '第一问', points: 3, options: question.options }] };
const noop = () => {};
for (const [index, extra] of [{}, { checked: false, onCheckedChange: noop }, { number: 7, headingLevel: 2, status: '已使用', header: '示例' }, { reading: true }, { compact: true }, { compact: true, onOpen: noop }, { showPoints: false }, { displayPoints: 8, displayPartPoints: { '1': 6 } }, { details: '详情', detailsOpen: true, actions: React.createElement('button', {}, '加入'), secondaryActions: '收藏' }, { appearance: 'default', index: 12 }].entries()) {
  test(`42d77fb default unchecked byte parity case ${index + 1}`, () => {
    for (const record of [question, long]) assert.equal(render(current.QuestionCard, { question: record, ...extra }), render(baseline.QuestionCard, { question: record, ...extra }));
  });
}
test('selected cards and summaries retain background and use a 2px ring', () => {
  for (const extra of [{}, { appearance: 'catalog' }, { compact: true, onOpen: noop }]) {
    const html = render(current.QuestionCard, { question, checked: true, ...extra });
    assert.doesNotMatch(html, /bg-info\/10/);
    assert.match(html, /prism-question-selected ring-2 ring-primary\/60/);
  }
});
test('catalog index is visual only, tags have no separators, options have badges, actions retain details', () => {
  for (const index of [1, 12]) {
    const props = { question, onCheckedChange: noop, details: '答案详情', detailsOpen: true };
    const html = render(current.QuestionCard, { ...props, appearance: 'catalog', index });
    assert.match(html, new RegExp(`aria-hidden="true" class="prism-question-index text-component-label">${String(index).padStart(2, '0')}<`));
    assert.doesNotMatch(html, / · /);
    assert.match(html, /prism-question-kind whitespace-nowrap">单选题/);
    assert.match(html, /prism-question-points whitespace-nowrap">5 分/);
    assert.match(html, /prism-question-option-key text-component-label">A<\/span>/);
    assert.doesNotMatch(html, />A\./);
    assert.match(html, /prism-question-catalog-actions/);
    assert.match(html, /答案详情/);
    const plain = render(current.QuestionCard, props);
    assert.equal(html.match(/<h3[^>]*>.*?<\/h3>/)[0], plain.match(/<h3[^>]*>.*?<\/h3>/)[0]);
    assert.deepEqual(html.match(/aria-(?:label|labelledby|controls|expanded)="[^"]*"/g), plain.match(/aria-(?:label|labelledby|controls|expanded)="[^"]*"/g));
  }
});
test('difficulty tags reuse all P170 palette values and do not infer unknown difficulty', () => {
  for (const [label, key] of [['基础', 'basic'], ['巩固', 'consolidate'], ['提升', 'advance']]) {
    const html = render(current.QuestionHeading, { question: { ...question, difficulty: label }, id: 'heading', attributeStyle: 'tags' });
    assert.ok(html.includes(`style="background:${current.difficultySwatches[key]}"`));
  }
  const html = render(current.QuestionHeading, { question: { ...long, difficulty: '未知' }, id: 'heading', attributeStyle: 'tags', showPoints: false });
  assert.doesNotMatch(html, /prism-question-difficulty-swatch|prism-question-points/);
  assert.match(html, /整题/); assert.match(html, /含 1 个小问/);
});
test('badge affects top-level letters only; reading and summary keep existing presentations', () => {
  const html = render(current.QuestionContent, { question: { ...long, options: question.options }, optionStyle: 'badge' });
  assert.match(html, /prism-question-option-key text-component-label">A<\/span>/);
  assert.match(html, /class="shrink-0">A\.<\/span>/);
  for (const extra of [{ reading: true }, { compact: true, onOpen: noop }]) assert.equal(render(current.QuestionCard, { question, ...extra, appearance: 'catalog', index: 1 }), render(current.QuestionCard, { question, ...extra }));
});
test('catalog styles use mono, dashed divider, precise layout and border-only selection with fallback', async () => {
  const css = await readFile('components/prism-next/question-catalog.css', 'utf8');
  assert.match(css, /var\(--brand-blue, var\(--primary\)\) 60%, transparent/);
  assert.match(css, /padding: 18px 20px 12px 56px/);
  assert.match(css, /border-top: 1px dashed/);
  assert.match(css, /\.prism-question-points\s*\{\s*font-family: var\(--font-mono\)/);
  for (const rule of css.matchAll(/\.prism-question[^{}]*selected[^{}]*\{([^}]+)\}/g)) assert.doesNotMatch(rule[1], /background/);
});
