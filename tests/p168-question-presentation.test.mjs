import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createTestRuntime } from './helpers/test-runtime.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const baseline = 'cfce18d486f96636a2befd1c80ccd0f665128e3d';
const runtime = await createTestRuntime('p168');
const sources = ['score-review', 'student-control-bar'];

async function bundle(useBaseline) {
  const output = new URL(useBaseline ? 'before.mjs' : 'after.mjs', runtime);
  const result = await build({
    stdin: {
      contents: sources.map(name => `export * from './components/prism-next/${name}.tsx';`).join('\n'),
      loader: 'tsx', resolveDir: root,
    },
    bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external',
    alias: { '@': root }, loader: { '.css': 'empty' }, write: false,
    plugins: useBaseline ? [{
      name: 'p168-baseline',
      setup(builder) {
        builder.onLoad({ filter: /components\/prism-next\/(score-review|student-control-bar)\.tsx$/ }, args => ({
          contents: execFileSync('git', ['show', `${baseline}:${args.path.slice(root.length)}`], { cwd: root, encoding: 'utf8' }),
          loader: 'tsx',
        }));
      },
    }] : [],
  });
  writeFileSync(output, result.outputFiles[0].text);
  return import(output);
}

const old = await bundle(true);
const current = await bundle(false);
const noop = () => {};
const points = [
  { id: 'expression', label: '正确写出配方表达式', score: 4, maxScore: 4 },
  { id: 'condition', label: '核对取等条件与结论', score: 2, maxScore: 6, uncertain: true },
];
const reviewProps = {
  studentName: '李华', questionLabel: '第 3 题', maxScore: 10, defaultScore: 6,
  aiSuggestion: { score: 6, reason: '推导正确，取等条件需要核对。', basis: ['评分规则 R3'] },
  answer: '配方得 \\(f(x)=(x-1)^2-4\\)。', standardAnswer: '最小值为 −4。',
  history: [{ id: 'previous', score: 5, reason: '待复核', time: '2026-11-13' }],
  onSave: noop, onRetry: noop, onEdit: noop, onCancel: noop, onAcceptAi: noop,
};
const renderReview = (api, extra = {}) => renderToStaticMarkup(React.createElement(api.ScoreReview, { ...reviewProps, ...extra }));

for (const mode of [undefined, 'review', 'confirm', 'edit', 'manual']) {
  test(`P168 ScoreReview ${mode ?? 'omitted'} mode default presentation SSR matches cfce18d byte for byte`, () => {
    for (const density of [undefined, 'compact']) {
      for (const extra of [
        {}, { points, onPointsChange: noop }, { points: [] }, { scoreReadOnly: true },
        { sectionsPlacement: 'bottom', disclosureVariant: 'link', shortcuts: true },
        { state: { kind: 'saving' }, showIdentity: false },
        { state: { kind: 'failed', reason: '等待重试' } },
        { state: { kind: 'saved', score: 6, auditUpdated: true } },
        { aiSuggestion: undefined, history: [], unanswered: true },
        { questionFooter: React.createElement('span', {}, 'question-only footer') },
      ]) {
        const actual = renderReview(current, { ...extra, mode, density });
        const expected = renderReview(old, { ...extra, mode, density });
        const mismatch = [...actual].findIndex((character, index) => character !== expected[index]);
        assert.ok(actual === expected, JSON.stringify({ mode, density, extra, mismatch,
          actual: actual.slice(Math.max(0, mismatch - 60), mismatch + 120),
          expected: expected.slice(Math.max(0, mismatch - 60), mismatch + 120),
        }));
      }
    }
  });
}

for (const mode of ['review', 'confirm', 'edit', 'manual']) {
  test(`P168 ScoreReview question ${mode} renders the opt-in sections and footer`, () => {
    const html = renderReview(current, {
      presentation: 'question', mode, density: 'compact', points, onPointsChange: noop,
      questionFooter: React.createElement('button', {}, '重新 AI 批阅'), shortcuts: true,
    });
    assert.match(html, /data-score-review-body/);
    assert.match(html, /data-score-review-footer/);
    assert.match(html, /data-score-review-sections/);
    assert.match(html, />参考<\/h3>/);
    assert.match(html, /aria-label="重新 AI 批阅"/);
    assert.doesNotMatch(html, /data-slot="card"/);
    if (mode === 'confirm') {
      assert.match(html, /<dl class="min-w-0 divide-y divide-border">/);
      assert.match(html, /<dt[^>]*>核对取等条件与结论/);
      assert.match(html, /<kbd[^>]*data-slot="kbd"[^>]*>⌘ \/ Ctrl<\/kbd> \+ <kbd[^>]*data-slot="kbd"[^>]*>Enter<\/kbd> 采纳并下一份/);
    }
  });
}

test('P168 question presentation displays missing points and external failure facts', () => {
  const missing = renderReview(current, { presentation: 'question', mode: 'confirm' });
  assert.match(missing, /评分点未提供/);
  const failed = renderReview(current, { presentation: 'question', mode: 'confirm', state: { kind: 'failed', reason: '保存服务暂时不可用' } });
  assert.match(failed, /保存失败：保存服务暂时不可用/);
  assert.match(failed, /重试采纳/);
});

const students = [
  { id: 'a', name: '李华', examId: '20260001', score: 6, scoreText: '6 分', status: '部分得分', review: '待复核', ratio: 60, identityTone: 'warning', tickTone: 'warning', group: '待复核' },
  { id: 'b', name: '长中文姓名与身份核对', examId: '20260002', score: null, scoreText: '未给分', status: '评分未知', review: '待复核', ratio: null, identityTone: 'neutral', tickTone: 'neutral', group: '待复核' },
];
const switcherProps = {
  items: students, groups: [{ value: '待复核', items: students }], current: students[0], max: 10,
  open: false, onOpenChange: noop, onSelect: noop, triggerRef: { current: null }, searchId: 'p168-student-search',
};
const renderSwitcher = (api, extra = {}) => renderToStaticMarkup(React.createElement(api.StudentControlSwitcher, { ...switcherProps, ...extra }));

test('P168 StudentControlSwitcher default presentation SSR matches cfce18d byte for byte', () => {
  for (const extra of [{}, { current: students[1] }, { current: null }, { items: [], groups: [], current: null }, { open: true }]) {
    assert.equal(renderSwitcher(current, extra), renderSwitcher(old, extra));
  }
});

test('P168 StudentControlSwitcher question renders quiet navigation with student identity and counts', () => {
  for (const student of students) {
    const html = renderSwitcher(current, { presentation: 'question', current: student });
    assert.match(html, /aria-label="学生导航"/);
    assert.ok(html.includes(`选择学生，${student.name}，当前第 ${students.indexOf(student) + 1} / 2 位`));
    assert.match(html, /aria-label="上一位学生"/);
    assert.match(html, /aria-label="下一位学生"/);
    assert.doesNotMatch(html, /data-slot="group"|data-slot="avatar"/);
    assert.match(renderSwitcher(old, { current: student }), /data-slot="avatar"/);
  }
  assert.match(renderSwitcher(current, { presentation: 'question', current: null, items: [], groups: [] }), /选择学生 · 0/);
});

test('P168 StudentControlBar and companion exports default SSR match cfce18d byte for byte', () => {
  const renderBar = api => renderToStaticMarkup(React.createElement(api.StudentControlBar, {},
    React.createElement(api.StudentControlBarRow, {},
      React.createElement(api.StudentControlHome, { active: false, onHome: noop }),
      React.createElement(api.StudentControlFilters, { value: 'all', onValueChange: noop, items: [{ value: 'all', label: '全部', count: 2 }] }),
      React.createElement(api.StudentControlSwitcher, switcherProps)),
    React.createElement(api.StudentIdentity, { item: students[0] }),
    React.createElement(api.StudentControlScale, { items: [], summary: '刻度未提供', onSelect: noop })));
  assert.equal(renderBar(current), renderBar(old));
});
