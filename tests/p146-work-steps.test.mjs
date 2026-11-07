import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, relative } from 'node:path';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createTestRuntime } from './helpers/test-runtime.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const baseline = '226b82d6b2e5f2917e6a4326e5f60e955c04be1f';
const files = ['components/prism-next/blueprint/work.tsx'];
const before = new Map(files.map(path => [path, execFileSync('git', ['show', `${baseline}:${path}`], { cwd: root, encoding: 'utf8' })]));
const directory = await createTestRuntime('p146');
async function bundle(name, plugins = []) {
  const output = await build({
    stdin: { contents: `export { BpWorkHeader } from './components/prism-next/blueprint/work';`, resolveDir: root, loader: 'tsx' },
    bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, write: false, plugins,
  });
  const url = new URL(name, directory);
  await writeFile(url, output.outputFiles[0].text);
  return import(url);
}
const original = await bundle('before.mjs', [{ name: 'p146-preimage', setup(build) {
  build.onLoad({ filter: /prism-next\/blueprint\/work\.tsx$/ }, args => ({
    contents: before.get(relative(root, args.path)), loader: 'tsx', resolveDir: dirname(args.path),
  }));
} }]);
const current = await bundle('after.mjs');
const h = React.createElement;
const render = (component, props) => renderToStaticMarkup(h(component, props));
const header = {
  back: { label: '批阅记录', href: '/grading' }, title: '数学 · 间隔复查：长中文对象名称',
  meta: '九年级（1）班', status: h('span', null, '批阅完成'),
  position: { index: 5, total: 20, onPrev() {}, onNext() {} },
  notice: h('span', null, '只读历史版本'),
  secondary: [h('button', { key: 'target' }, '设置目标线'), h('button', { key: 'export' }, '导出成绩单')],
  primary: { children: '主操作', onClick() {} }, more: h('button', { 'aria-label': '更多操作' }, '⋯'),
};
const steps = { items: [
  { id: 'setup', label: '设置任务' },
  { id: 'scan', label: '扫描学生试卷' },
  { id: 'grading', label: 'AI 批阅' },
  { id: 'analysis', label: '整体分析' },
], current: 2 };

test('P146 omitted steps preserve 226b82d SSR byte for byte across existing slots and narrow modes', () => {
  for (const back of [header.back, { label: '批阅记录', onClick() {} }]) {
    for (const slots of [{ back, title: header.title }, { ...header, back }]) {
      for (const narrow of [undefined, 'stack', 'compact']) {
        for (const theme of ['light', 'paper', 'dark', 'blueprint', 'blueprint-night']) {
          const props = { ...slots, narrow, 'data-prism-theme': theme };
          assert.equal(render(current.BpWorkHeader, props), render(original.BpWorkHeader, props));
          assert.equal(render(current.BpWorkHeader, { ...props, steps: undefined }), render(original.BpWorkHeader, props));
        }
      }
    }
  }
});

test('P146 steps reuse chips with host current position and a named narrow summary', () => {
  for (const position of [0, 1, 2, 3]) {
    for (const label of [undefined, '批阅流程']) {
      const output = render(current.BpWorkHeader, { ...header, steps: { ...steps, current: position, label } });
      assert.match(output, /class="bp-steps"/);
      assert.equal((output.match(/aria-current="step"/g) ?? []).length, 1);
      assert.ok(output.includes(`aria-current="step"><b aria-hidden="true">0${position + 1}</b>${steps.items[position].label}`));
      assert.ok(output.includes(`<ol aria-label="${label ?? '流程步骤'}"`));
      assert.ok(output.includes(`role="group" aria-label="${label ?? '流程步骤'}"`));
      assert.ok(output.includes(`第 ${position + 1} / 4 步 · ${steps.items[position].label}`));
      assert.match(output, /text-ui-meta/);
      assert.match(output, /\[@media\(max-width:700px\)\]:hidden/);
      assert.match(output, /\[@media\(max-width:700px\)\]:block/);
      assert.match(output, /\[@container_bp-work-demo_\(max-width:700px\)\]:hidden/);
      assert.match(output, /\[@container_bp-work-demo_\(max-width:700px\)\]:block/);
    }
  }
});

test('P146 steps keep identity, metadata, status and all action slots in their existing order', () => {
  for (const narrow of ['stack', 'compact']) {
    const output = render(current.BpWorkHeader, { ...header, narrow, steps });
    const slots = ['bp-work-back', 'bp-work-title', 'bp-work-meta', 'bp-work-status', 'class="bp-steps"', 'bp-work-actions', 'bp-work-position', '只读历史版本', '设置目标线', '导出成绩单', '主操作', '更多操作'];
    let previous = -1;
    for (const slot of slots) {
      const index = output.indexOf(slot);
      assert.ok(index > previous, `${narrow}: ${slot} follows previous slot`);
      previous = index;
    }
  }
});
