import { mkdir, writeFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Execute pinned main source via read-only git show; no second worktree/build.
export const baselineCommit = '4669a62a4dcf58d75667811db2c614489a077d10';
const root = fileURLToPath(new URL('../', import.meta.url));
const directory = new URL(`../.sites-runtime/inspector-p18-${process.pid}/`, import.meta.url);
const tracked = new Set(execFileSync('git', ['ls-tree', '-r', '--name-only', baselineCommit], { cwd: root, encoding: 'utf8' }).trim().split('\n'));
export const baselineSources = {};
export const hash = value => createHash('sha256').update(value).digest('hex');
export const h = React.createElement;
export const render = node => renderToStaticMarkup(node);

export async function buildApi(baseline = false) {
  await mkdir(directory, { recursive: true });
  const file = new URL(`${baseline ? 'main' : 'current'}-${Math.random().toString(36).slice(2)}.mjs`, directory);
  const contents = ['question-inspector', 'score-review', 'error-cause-review', 'student-paper-report']
    .flatMap(name => [`export * from './components/prism-next/${name}';`, `export * from './components/prism-next/demos/${name}';`]).join('\n') + `
    export * from './components/prism-next/demos/review-workspace-fixtures';
    export * from './components/prism-next/demos/review-compact';
    export { QuestionReviewDesign } from './examples/question-review/question-review';
    export { PaperReviewDesign } from './examples/paper-review/paper-review';
    export { Button } from './components/prism-next/button';
    export { RadioGroup } from './components/coss/radio-group';
    export { Input } from './components/coss/input';`;
  const compiled = await build({
    stdin: { contents, resolveDir: root, loader: 'tsx' },
    bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root },
    loader: { '.css': 'empty' }, write: false,
    plugins: [{ name: 'temml-url', setup(b) {
      b.onResolve({ filter: /^next\/(?:link|navigation)$/ }, args => ({ path: `${args.path}.js`, external: true }));
      b.onResolve({ filter: /temml\.mjs\?url$/ }, () => ({ path: 'temml-url', namespace: 'url' }));
      b.onLoad({ filter: /.*/, namespace: 'url' }, () => ({ contents: 'export default "temml.mjs"' }));
    } }, ...(baseline ? [{ name: 'p18-pinned-main', setup(b) {
      b.onLoad({ filter: /\.[cm]?[jt]sx?$/ }, args => {
        const path = relative(root, args.path);
        if (!tracked.has(path)) return;
        const source = execFileSync('git', ['show', `${baselineCommit}:${path}`], { cwd: root, encoding: 'utf8' });
        baselineSources[path] = hash(source);
        return { contents: source, loader: /\.tsx$/.test(path) ? 'tsx' : /\.ts$/.test(path) ? 'ts' : /\.jsx$/.test(path) ? 'jsx' : 'js' };
      });
    } }] : [])],
  });
  await writeFile(file, compiled.outputFiles[0].text);
  try { return await import(file); } finally { await rm(file); }
}

const noop = () => {};
export function cases(api) {
  const inspector = { ...api.reviewInspectorFixture, onStep: noop, onWrong: noop, onIntent: noop };
  const cause = { categories: api.errorCauseReviewCategories, value: api.errorCauseReviewValue, onEdit: noop };
  const review = { ...api.scoreReviewBase, onSave: noop, onAcceptAi: noop };
  return {
    QuestionInspector: {
      default: inspector, bodyOnly: { ...inspector, bodyOnly: true },
      missing: { ...inspector, points: [], comparison: [], confidence: undefined, pointsEmptyText: '未提供', comparisonEmptyText: '未提供' },
      disabled: { ...inspector, actions: [{ id: 'disabled', label: '更正评分', disabled: true, disabledReason: '当前版本不可修改' }] },
    },
    ScoreReview: {
      default: review, minimal: { studentName: '学生', questionLabel: '第 1 题', maxScore: 10 },
      compact: { ...review, density: 'compact', showIdentity: false, sectionsDefaultOpen: { answer: false, standardAnswer: false, history: false } },
      points: { ...review, points: [{ id: 'a', label: '推导过程', maxScore: 4, score: 2 }], score: 2, reason: '补充推导', onPointsChange: noop },
      ...Object.fromEntries(api.scoreReviewFixtures.map(item => [item.id, { ...review, ...item.props, onRetry: noop }])),
    },
    ErrorCauseReview: {
      default: cause, compact: { ...cause, density: 'compact' }, missing: { categories: cause.categories, value: null },
      editing: { ...cause, editing: true, draft: api.errorCauseReviewValue, history: api.errorCauseReviewHistory, onChange: noop, onSave: noop, onCancel: noop },
      saving: { ...cause, editing: true, draft: api.errorCauseReviewValue, onChange: noop, onSave: noop, onCancel: noop, state: { kind: 'saving' } },
      failed: { ...cause, editing: true, draft: { category: 'other', explanation: '' }, state: { kind: 'failed', reason: '连接中断' } },
    },
    StudentPaperReport: {
      default: api.studentPaperReportFixture, partial: api.studentPaperReportPartialFixture,
      compact: { ...api.studentPaperReportFixture, density: 'compact' }, missing: {},
    },
  };
}
export const undefinedProps = {
  QuestionInspector: { showEvidence: undefined, showConfidence: undefined, showKnowledge: undefined, showComparison: undefined, density: undefined, scoreSource: undefined, afterScore: undefined, afterPoints: undefined, footer: undefined },
  ScoreReview: { mode: undefined, onEdit: undefined, onCancel: undefined, showBasis: undefined, showConfidence: undefined, instruction: undefined, sectionsPlacement: undefined, sectionLabels: undefined, scoreContext: undefined },
  ErrorCauseReview: { editLabel: undefined, hideEditAction: undefined }, StudentPaperReport: {},
};
export const defaultProps = {
  QuestionInspector: { showEvidence: true, showConfidence: true, showKnowledge: true, showComparison: true, density: 'default' },
  ScoreReview: { mode: 'review', showBasis: true, showConfidence: true, sectionsPlacement: 'top' },
  ErrorCauseReview: { editLabel: '修改', hideEditAction: false }, StudentPaperReport: {},
};
export const demos = ['QuestionInspectorDemo', 'ScoreReviewDemo', 'ScoreReviewReasonReceiptDemo', 'ErrorCauseReviewDemo', 'StudentPaperReportDemo', 'ScoreReviewCompactDemo', 'ErrorCauseReviewCompactDemo', 'StudentPaperReportCompactDemo'];
export const frozenPages = { 'question-review': 'QuestionReviewDesign', 'paper-review': 'PaperReviewDesign' };
export function mainMarkup(html) {
  const start = html.indexOf('<main');
  const end = html.lastIndexOf('</main>');
  if (start === -1 || end === -1) throw new Error('Expected frozen page <main>');
  return html.slice(start, end + 7);
}
export function capture(api, props) {
  const nodes = [];
  function walk(node) {
    if (!React.isValidElement(node)) return;
    nodes.push(node); React.Children.forEach(node.props.children, walk);
  }
  function Probe() { const tree = api.ErrorCauseReview(props); walk(tree); return tree; }
  return { html: render(h(Probe)), nodes, buttons: nodes.filter(node => node.type === api.Button), group: nodes.find(node => node.type === api.RadioGroup), input: nodes.find(node => node.type === api.Input) };
}
