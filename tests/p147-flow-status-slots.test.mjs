import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createTestRuntime } from './helpers/test-runtime.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const directory = await createTestRuntime('p147');
const names = ['attachment', 'score-review', 'student-paper-report'];
const originals = new Map(names.map(name => {
  const path = `components/prism-next/${name}.tsx`;
  return [fileURLToPath(new URL(path, `file://${root}`)), execFileSync('git', ['show', `1625ba4:${path}`], { cwd: root, encoding: 'utf8' })];
}));
async function bundle(original) {
  const result = await build({
    stdin: { contents: names.map(name => `export * from './components/prism-next/${name}';`).join('\n'), resolveDir: root, loader: 'tsx' },
    bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false,
    plugins: [{ name: 'baseline-and-assets', setup(builder) {
      builder.onResolve({ filter: /temml\.mjs\?url$/ }, () => ({ path: 'temml-url', namespace: 'url' }));
      builder.onLoad({ filter: /.*/, namespace: 'url' }, () => ({ contents: 'export default "temml.mjs"' }));
      if (original) builder.onLoad({ filter: /prism-next\/[^/]+\.tsx$/ }, args => originals.has(args.path) ? { contents: originals.get(args.path), loader: 'tsx' } : undefined);
    } }],
  });
  const path = new URL(original ? 'baseline.mjs' : 'current.mjs', directory);
  await writeFile(path, result.outputFiles[0].text);
  return import(path.href);
}
const baseline = await bundle(true);
const current = await bundle(false);
const h = React.createElement;
const noop = () => {};
const paper = { id: 'student', studentName: '李华', examNumber: '1001', pageCount: 2, status: { label: '已批阅', tone: 'success' }, onView: noop };
const score = { studentName: '李华', questionLabel: '第1题', maxScore: 10, standardAnswer: 'x = 1', answer: 'x = 1', history: [] };
const cases = [
  ['PaperCard', paper],
  ...['success', 'warning', 'error', 'neutral'].map(tone => ['PaperCard', { ...paper, variant: 'sheet', status: { label: '状态', tone }, reason: '待核对', onResolve: noop }]),
  ['PaperCard', { ...paper, variant: 'sheet', placeholder: true }],
  ['PaperCard', { ...paper, variant: 'sheet', placeholder: true, studentName: '', slotLabel: '4' }],
  ...['review', 'confirm', 'edit', 'manual'].flatMap(mode => ['default', 'compact'].map(density => ['ScoreReview', { ...score, mode, density }])),
  ['StudentPaperReport', {}],
  ['StudentPaperReport', { status: '已批阅', density: 'compact', pendingEmphasis: 'strong', pendingCount: 2 }],
];
function render(api, name, props, theme = 'blueprint') {
  return renderToStaticMarkup(h('div', { 'data-prism-theme': theme, 'data-ui-version': 'coss-v1' }, h(api[name], props)));
}
for (const theme of ['light', 'paper', 'dark', 'blueprint', 'blueprint-night']) {
  test(`P147 omitted and undefined props preserve every SSR byte in ${theme}`, () => {
    for (const [name, props] of cases) {
      const expected = render(baseline, name, props, theme);
      assert.equal(render(current, name, props, theme), expected);
      assert.equal(render(current, name, { ...props, statusSlot: undefined, disclosureVariant: undefined }, theme), expected);
    }
  });
}
const slot = h('span', { 'data-host-status': true }, '宿主状态');
test('P147 sheet slot replaces information and badges/check while preserving accessible status and actions', () => {
  for (const tone of ['success', 'warning', 'error', 'neutral']) {
    const html = render(current, 'PaperCard', { ...paper, variant: 'sheet', status: { label: '原状态', tone }, reason: '待核对', onResolve: noop, statusSlot: slot });
    assert.match(html, /data-host-status/);
    assert.doesNotMatch(html, /data-paper-success|data-paper-pending|data-slot="badge"|data-paper-exam-prefix/);
    assert.match(html, /class="sr-only">原状态/);
    assert.match(html, /aria-describedby="[^"]+-status/);
    assert.match(html, /data-paper-action="resolve"/);
    const described = [...html.matchAll(/aria-describedby="([^"]+)"/g)].flatMap(match => match[1].split(' '));
    for (const id of described) assert.ok(html.includes(`id="${id}"`));
  }
  assert.equal(render(current, 'PaperCard', { ...paper, statusSlot: slot }), render(baseline, 'PaperCard', paper));
  const anonymous = { ...paper, variant: 'sheet', placeholder: true, studentName: '', slotLabel: '4' };
  assert.equal(render(current, 'PaperCard', { ...anonymous, statusSlot: slot }), render(baseline, 'PaperCard', anonymous));
});
test('P147 report slot replaces confirmation and retains judgement badges', () => {
  const old = render(current, 'StudentPaperReport', { status: '旧状态' });
  const html = render(current, 'StudentPaperReport', { status: '旧状态', statusSlot: slot });
  assert.match(html, /状态：<\/span><span data-host-status/);
  assert.doesNotMatch(html, /旧状态|size-1\.5 rounded-full bg-current/);
  assert.equal((html.match(/data-slot="badge"/g) || []).length, 4);
  assert.ok(old.includes('旧状态'));
  assert.equal((old.match(/data-slot="badge"/g) || []).length, 5);
});
test('P147 link disclosures retain labels, counts and expanded state without outline styling', () => {
  for (const open of [false, true]) {
    const props = { ...score, density: 'compact', sectionsDefaultOpen: { answer: open, standardAnswer: open, history: open } };
    const html = render(current, 'ScoreReview', { ...props, disclosureVariant: 'link' });
    const triggers = [...html.matchAll(/<button\b[^>]*aria-expanded="(?:true|false)"[^>]*>[\s\S]*?<\/button>/g)].map(match => match[0]);
    assert.equal(triggers.length, 3);
    for (const trigger of triggers) {
      assert.match(trigger, new RegExp(`aria-expanded="${open}"`));
      assert.match(trigger, /hover:underline/);
      assert.match(trigger, /text-\[var\(--link\)\]/);
      assert.doesNotMatch(trigger, /border-input|bg-popover/);
    }
    for (const label of ['学生原始作答', '标准答案', '历史记录（0）']) assert.ok(triggers.some(trigger => trigger.includes(label)));
    assert.equal(render(current, 'ScoreReview', { ...props, disclosureVariant: 'button' }), render(baseline, 'ScoreReview', props));
  }
});
