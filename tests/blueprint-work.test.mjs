import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const root = fileURLToPath(new URL('../', import.meta.url));
const directory = new URL(`../.sites-runtime/blueprint-work-${process.pid}/`, import.meta.url);
await mkdir(directory, { recursive: true });
const bundle = await build({
  stdin: { contents: "export * from './components/prism-next/blueprint/blueprint';", resolveDir: root, loader: 'tsx' },
  bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, write: false,
});
const file = new URL('bundle.mjs', directory);
await writeFile(file, bundle.outputFiles[0].text);
const api = await import(file);
await rm(directory, { recursive: true });
const h = React.createElement;
const html = element => renderToStaticMarkup(element);

test('work header has one return destination, one object heading and named boundary controls', () => {
  for (const back of [{ label: '智能批阅', href: '/grading' }, { label: '智能批阅', onClick() {} }]) {
    const output = html(h(api.BpWorkHeader, {
      back, title: '数学 · 间隔复查', meta: '九年级（1）班',
      position: { index: 1, total: 20, onPrev() {}, onNext() {} },
      primary: { children: '导出成绩单' },
    }));
    assert.equal((output.match(/← 返回/g) || []).length, 1);
    assert.equal((output.match(/<h1 /g) || []).length, 1);
    assert.match(output, /aria-label="上一项"[^>]*disabled=""/);
    assert.match(output, /aria-label="下一项"/);
    assert.match(output, /data-variant="primary"/);
    assert.doesNotMatch(output, /关闭|沉浸阅读/);
  }
});

test('work tabs retain coss tablist, tab and panel relationships', () => {
  const output = html(h(api.BpWorkTabs, { label: '这次批阅的部分', defaultValue: 'overview', items: [
    { value: 'overview', label: '概览', content: '当前结论' },
    { value: 'questions', label: '题目与知识点', count: 12, content: '题目证据' },
  ] }));
  assert.match(output, /role="tablist"/);
  assert.equal((output.match(/role="tab"/g) || []).length, 2);
  assert.match(output, /role="tabpanel"/);
  assert.match(output, /aria-selected="true"/);
  assert.match(output, /当前结论/);
  assert.match(output, /bp-work-signature" aria-hidden="true"/);
});

test('work content renders semantic references, provenance and no end row', () => {
  const output = html(h(api.BpWorkBody, { grid: true },
    h(api.BpConclusion, {}, '得分率 ', h(api.BpMark, {}, '76.0%'), h(api.BpRef, { href: '#evidence' }, '①')),
    h(api.BpProvenance, { id: 'evidence', items: [{ label: '依据', value: '45 份答卷' }] }),
  ));
  assert.match(output, /data-grid="true"/);
  assert.match(output, /<mark /);
  assert.match(output, /<sup [\s\S]*href="#evidence"/);
  assert.match(output, /<dt>依据<\/dt><dd>45 份答卷<\/dd>/);
  assert.doesNotMatch(output, /bp-work-end|bp-work-next/);
});

test('side peek composes named Sheet controls and work styles contain no color literals or new tokens', async () => {
  const source = await readFile(new URL('../components/prism-next/blueprint/work.tsx', import.meta.url), 'utf8');
  assert.match(source, /<SheetTrigger render=\{trigger\}/);
  assert.match(source, /<SheetClose[^>]*render=\{<BpButton[^]*?aria-label="关闭"/);
  assert.match(source, /usePrismPortalProps\(portalProps\)/);
  const output = html(h(api.BpSidePeek, { title: '第 4 题', trigger: h(api.BpButton, {}, '查看题目') }, '公式法'));
  assert.match(output, /查看题目/);
  const css = (await readFile(new URL('../app/(next)/next/blueprint.css', import.meta.url), 'utf8')).split('/* P136 ·')[1];
  assert.doesNotMatch(css, /#[\da-f]{3,8}\b|rgba?\(|oklch\(|--[\w-]+\s*:/i);
  assert.match(css, /data-agent-preview.*not\(\[data-prism-theme="blueprint"\]\)/);
});
