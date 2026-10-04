import { mkdir, writeFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Immutable main at the start of P16. Read-only git show does not need a second
// checkout and executes the original component, not a reimplementation.
export const baselineCommit = '429726be6c8e78f938b1dd431371c097cc588a9d';
const root = fileURLToPath(new URL('../', import.meta.url));
const dir = new URL('../.sites-runtime/score-review-p16-compatibility/', import.meta.url);
await mkdir(dir, { recursive: true });
const originalFiles = ['components/prism-next/score-review.tsx', 'components/prism-next/demos/score-review.tsx'];
const originalSources = new Map(originalFiles.map(path => [fileURLToPath(new URL(path, `file://${root}`)), execFileSync('git', ['show', `${baselineCommit}:${path}`], { cwd: root, encoding: 'utf8' })]));
const urlPlugin = { name: 'temml-url', setup(b) {
  b.onResolve({ filter: /temml\.mjs\?url$/ }, () => ({ path: 'temml-url', namespace: 'url' }));
  b.onLoad({ filter: /.*/, namespace: 'url' }, () => ({ contents: 'export default "temml.mjs"' }));
} };
async function bundle(original) {
  const path = new URL(`${original ? 'main' : 'current'}.mjs`, dir);
  const baselinePlugin = { name: 'p16-main-source', setup(b) {
    b.onLoad({ filter: /prism-next\/(?:demos\/)?score-review\.tsx$/ }, args => {
      const contents = originalSources.get(args.path);
      return contents === undefined ? undefined : { contents, loader: 'tsx' };
    });
  } };
  const output = await build({
    stdin: { contents: "export * from './components/prism-next/score-review'; export * from './components/prism-next/demos/score-review';", resolveDir: root, loader: 'tsx' },
    bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' },
    write: false, plugins: [urlPlugin, ...(original ? [baselinePlugin] : [])],
  });
  await writeFile(path, output.outputFiles[0].text);
  try { return await import(path); } finally { await rm(path); }
}
export const [mainApi, currentApi] = await Promise.all([bundle(true), bundle(false)]);

const noop = () => {};
const base = mainApi.scoreReviewBase;
export const cases = {
  minimal: { studentName: '学生', questionLabel: '第1题', maxScore: 10 },
  controlled: { ...base, score: 6, reason: '', onScoreChange: noop, onReasonChange: noop, onSave: noop, onAcceptAi: noop },
  changed: { ...base, score: 7, reason: '完整推导', onSave: noop },
  'changed-no-reason': { ...base, score: 7, reason: '', onSave: noop },
  'required-same-score': { ...base, score: 6, requireReason: true, requireReasonOnChange: false, showReason: false, onSave: noop },
  'required-valid': { ...base, score: 6, requireReason: true, reason: '  重新核对  ', onSave: noop },
  'empty-score': { ...base, score: null, onSave: noop },
  'invalid-scale': { ...base, step: 0, onSave: noop },
  'invalid-ai': { ...base, aiSuggestion: { score: 10.5 }, onAcceptAi: noop },
  locked: { ...base, disabledReason: '评分依据版本已经变化', onSave: noop, onPrev: noop, onSkip: noop },
  'quick-shortcuts': { ...base, quickScores: [0, 5, 10], shortcuts: true, onSave: noop, onAcceptAi: noop, onPrev: noop, onSkip: noop },
  'last-saved': { ...base, lastSaved: { score: 7, label: '主观题 2' }, questionId: 'student-1-question-3', focusOnQuestionChange: true, onSave: noop },
  ...Object.fromEntries(mainApi.scoreReviewFixtures.map(fixture => [fixture.id, { ...base, ...fixture.props, onSave: noop, onRetry: noop }])),
};

// P16 additions explicitly set to undefined must take the exact legacy path.
export const undefinedExtensions = {
  points: undefined, pointStep: undefined, pointsReadOnly: undefined, onPointsChange: undefined,
  reasonOptions: undefined, selectedReasonId: undefined, onReasonSelect: undefined, requireReasonSelection: undefined,
  unanswered: undefined, onUnansweredChange: undefined, unansweredDisabledReason: undefined,
  actionLabels: undefined, scoreReadOnly: undefined, saveDisabledReason: undefined,
};
export function renderCase(api, props, extensions = {}) {
  return renderToStaticMarkup(React.createElement(api.ScoreReview, { ...props, ...extensions }));
}
export function renderDemos(api) {
  return {
    demo: renderToStaticMarkup(React.createElement(api.ScoreReviewDemo)),
    reasonReceipt: renderToStaticMarkup(React.createElement(api.ScoreReviewReasonReceiptDemo)),
  };
}
