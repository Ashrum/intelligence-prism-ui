import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createTestRuntime } from './helpers/test-runtime.mjs';

const root = process.cwd();
// P177 task baseline: main before the hold API. Never compare against a moving HEAD.
const baselineSha = '172c8e5be5708a27a9d56111633184068c9e7a1e';
const runtime = await createTestRuntime('p177');
async function load(baseline = false) {
  const result = await build({
    stdin: { contents: `
      export { QuestionCard } from './components/prism-next/question-card';
      export { QuestionMath } from './components/prism-next/question-content';
      export { questionSamples } from './components/prism-next/fixtures/question-samples';
      export { questionPresentationSample } from './components/prism-next/fixtures/question-presentation-samples';
      export { QuestionHoldDemo } from './components/prism-next/demos/question-component';
    `, resolveDir: root, loader: 'tsx' },
    bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external',
    alias: { '@': root, 'next/link': 'next/link.js' }, write: false, loader: { '.css': 'empty' },
    plugins: baseline ? [{ name: 'p177-main-baseline', setup(builder) {
      builder.onLoad({ filter: /prism-next\/question-(card|presentation)\.tsx$/ }, ({ path: file }) => ({
        contents: execFileSync('git', ['show', `${baselineSha}:${path.relative(root, file)}`], { encoding: 'utf8' }), loader: 'tsx',
      }));
    } }] : [],
  });
  const file = new URL(baseline ? 'baseline.mjs' : 'current.mjs', runtime);
  await writeFile(file, result.outputFiles[0].text);
  return import(file.href);
}
const current = await load();
const baseline = await load(true);
const h = React.createElement;
const render = (component, props) => renderToStaticMarkup(h(component, props));
const question = { id: 'hold-question-2', title: '待正式版本', kind: '单选题', points: 4 };
const formula = h(current.QuestionMath, { label: 'x 平方' }, h('msup', null, h('mi', null, 'x'), h('mn', null, '2')));
const hold = { title: h('span', null, '第 2 题 · 待正式版本'), meta: '来源：示例原件', status: '题稿 r1 · 答案待补', body: h('p', null, '题干摘要：', formula), note: '补齐后由宿主读取正式版本。' };
const actions = h('button', null, '在作者页补齐 →');
const secondaryActions = h('button', null, '答案与解析 ▾');
const noop = () => {};

for (const appearance of ['default', 'catalog']) {
  test(`hold ${appearance}: heading, metadata, summary, note and existing actions stay ordered without QuestionContent`, () => {
    function ForbiddenContent() { throw new Error('hold must not mount question content'); }
    const html = render(current.QuestionCard, {
      question: { ...question, stem: h(ForbiddenContent), options: [{ id: 'A', content: h(ForbiddenContent) }], parts: [{ id: 'p', content: h(ForbiddenContent) }] },
      hold, appearance, number: 2, index: 2, headingLevel: 4, actions, secondaryActions,
    });
    assert.match(html, /data-question-id="hold-question-2"/);
    assert.match(html, /data-question-hold=""/);
    assert.doesNotMatch(html, /prism-question-copy|prism-question-options|data-part-id/);
    const id = html.match(/aria-labelledby="([^"]+)"/)[1];
    assert.ok(html.includes(`<h4 id="${id}"`));
    assert.ok(html.includes('text-ui-meta text-[color:var(--brand-magenta-text)]'));
    assert.doesNotMatch(html, /text-destructive/);
    assert.match(html, /data-question-hold-body="" class="min-w-0 text-read-body text-muted-foreground"/);
    assert.match(html, /data-question-hold-note="" class="min-w-0 text-ui-meta"/);
    assert.match(html, /<msup><mi>x<\/mi><mn>2<\/mn><\/msup>/);
    const ordered = ['第 2 题 · 待正式版本', '题稿 r1 · 答案待补', '单选题', '4 分', '来源：示例原件', '题干摘要：', '补齐后由宿主读取正式版本。', '答案与解析 ▾', '在作者页补齐 →'];
    for (let i = 1; i < ordered.length; i++) assert.ok(html.indexOf(ordered[i - 1]) < html.indexOf(ordered[i]), ordered[i]);
    const regular = render(current.QuestionCard, { question: { ...question, stem: '完整题面' }, appearance });
    assert.equal(html.match(/<article[^>]*class="([^"]+)"/)[1], regular.match(/<article[^>]*class="([^"]+)"/)[1]);
  });
}

test('hold without body needs no stem and never falls back to a supplied stem', () => {
  for (const record of [question, { ...question, stem: '不能回退的题干' }]) {
    const html = render(current.QuestionCard, { question: record, hold: { title: '第 3 题 · 待正式版本', note: '读不到题干摘要。' } });
    assert.match(html, /第 3 题 · 待正式版本/);
    assert.match(html, /读不到题干摘要。/);
    assert.doesNotMatch(html, /data-question-hold-body|不能回退的题干|prism-question-copy|role="toolbar"/);
  }
});

test('hold takes priority over compact opening, preserves score controls, and reading omits actions', () => {
  const html = render(current.QuestionCard, { question, hold, compact: true, onOpen: noop, displayPoints: 0, actions });
  assert.match(html, /data-question-level="L2"/);
  assert.match(html, /0 分/);
  assert.doesNotMatch(html, /data-question-summary|prism-question-copy|查看详情/);
  const reading = render(current.QuestionCard, { question, hold, reading: true, showPoints: false, actions });
  assert.match(reading, /data-question-level="L3"/);
  assert.match(reading, /data-question-hold-body/);
  assert.doesNotMatch(reading, /4 分|题稿 r1|在作者页补齐|role="toolbar"/);
});

test('five theme narrow-container fixtures preserve both hold examples and formula nodes (SSR only)', () => {
  for (const theme of ['light', 'paper', 'dark', 'blueprint', 'blueprint-night']) {
    const html = renderToStaticMarkup(h('div', { 'data-prism-theme': theme, style: { maxWidth: 390 } }, h(current.QuestionHoldDemo)));
    assert.equal((html.match(/data-question-hold=""/g) ?? []).length, 2);
    assert.equal((html.match(/data-question-hold-body=""/g) ?? []).length, 1);
    assert.equal((html.match(/data-question-hold-note=""/g) ?? []).length, 2);
    assert.match(html, /读不到题干摘要/);
    assert.match(html, /<msup><mi>x<\/mi><mn>2<\/mn><\/msup>/);
  }
});

const variants = [
  {}, { number: 7, headingLevel: 2, header: '示例', status: '已使用' },
  { checked: true, onCheckedChange: noop }, { reading: true }, { compact: true }, { compact: true, onOpen: noop },
  { showPoints: false }, { displayPoints: 8, displayPartPoints: { '1': 6 } },
  { details: '答案详情', detailsOpen: true, actions, secondaryActions },
];
for (const appearance of ['default', 'catalog']) {
  test(`no hold ${appearance}: all existing sample cards are byte-identical to main ${baselineSha.slice(0, 7)}`, () => {
    for (const record of [...current.questionSamples, current.questionPresentationSample]) {
      for (const extra of variants) {
        const props = { question: record, appearance, index: 2, ...extra };
        const expected = render(baseline.QuestionCard, props);
        assert.equal(render(current.QuestionCard, props), expected, `${record.id}: ${JSON.stringify(extra)}`);
        assert.equal(render(current.QuestionCard, { ...props, hold: undefined }), expected);
      }
    }
  });
}
