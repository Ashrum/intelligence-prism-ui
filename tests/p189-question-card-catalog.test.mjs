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
const runtime = await createTestRuntime('p189');
async function load(baseline) {
  const result = await build({
    stdin: { resolveDir: root, contents: `
      export { QuestionCard } from './components/prism-next/question-card';
      export { QuestionActions } from './components/prism-next/question-actions';
      export { MenuPopup } from './components/prism-next/scoped-overlays';
      export { MenuTrigger, MenuItem, MenuSeparator } from './components/coss/menu';
      export { Toolbar } from './components/coss/toolbar';
    ` },
    bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external',
    alias: { '@': root }, loader: { '.css': 'empty' }, write: false,
    plugins: baseline ? [{ name: 'p189-before', setup(builder) {
      builder.onLoad({ filter: /prism-next\/question-(card|actions)\.tsx$/ }, ({ path: file }) => ({
        contents: execFileSync('git', ['show', `8b9eb2c:${path.relative(root, file)}`], { encoding: 'utf8' }), loader: 'tsx',
      }));
    } }] : [],
  });
  const file = new URL(baseline ? 'before.mjs' : 'after.mjs', runtime);
  await writeFile(file, result.outputFiles[0].text);
  return import(file);
}
const current = await load(false);
const before = await load(true);
const h = React.createElement;
const noop = () => {};
const question = { id: 'Q-189', title: '函数的图象', kind: '单选题', points: 4, difficulty: '巩固', stem: '完整题干', options: [{ id: 'A', content: '选项' }] };
const card = (extra, api = current) => renderToStaticMarkup(h(api.QuestionCard, { question, ...extra }));
const catalog = extra => card({ appearance: 'catalog', ...extra });
const css = await readFile('components/prism-next/question-catalog.css', 'utf8');

test('P189 card header keeps a named heading and presents checkbox, index, plain attributes, meta and status in order', () => {
  const html = catalog({ index: 7, number: 3, headingLevel: 2, onCheckedChange: noop, meta: h('em', {}, '二次函数'), status: '本班用过' });
  const header = html.match(/<header[^>]*>[\s\S]*?<\/header>/)[0];
  const id = html.match(/aria-labelledby="([^"]+)"/)[1];
  assert.ok(header.includes(`<h2 id="${id}" class="sr-only">第 3 题 · 函数的图象</h2>`));
  assert.match(header, /flex min-w-0 items-center gap-3 text-ui-meta text-muted-foreground/);
  const fields = ['role="checkbox"', '>07<', '>单选题<', '>4 分<', 'background:var(--brand-blue)', '巩固', '<em>二次函数</em>', '>本班用过<'];
  let previous = -1;
  for (const field of fields) {
    const at = header.indexOf(field);
    assert.ok(at > previous, field);
    previous = at;
  }
  assert.equal((header.match(/text-muted-foreground\/50">·<\/span>/g) ?? []).length, 3);
  assert.match(header, /truncate"><em>二次函数/);
  assert.doesNotMatch(header, /prism-question-kind|>整题</);
  assert.ok(html.indexOf('完整题干') > html.indexOf('</header>'));
});

test('P189 absent fields leave no separators, zero points survive, unknown difficulty has no swatch', () => {
  const html = catalog({ question: { ...question, kind: '', difficulty: undefined }, showPoints: false, meta: '知识点' });
  assert.doesNotMatch(html, />·<|prism-question-difficulty-swatch|prism-question-index/);
  assert.doesNotMatch(catalog({ meta: false }), /prism-question-catalog-extra|prism-question-meta-separator/);
  const unknown = catalog({ question: { ...question, difficulty: '待定' }, displayPoints: 0 });
  assert.match(unknown, />0 分</);
  assert.match(unknown, /待定<\/span>/);
  assert.doesNotMatch(unknown, /prism-question-difficulty-swatch|prism-question-meta-separator/);
});

test('P189 catalog details and actions have spacing, one top rule and no inner frame', () => {
  const html = catalog({ details: '展开内容', detailsOpen: true });
  const region = html.match(/class="([^"]+)">展开内容</)[1];
  assert.match(region, /prism-question-catalog-details mt-3 min-w-0 border-t pt-3/);
  assert.doesNotMatch(region, /bg-|rounded|question-detail-region|\bp-4/);
  assert.match(css, /prism-question-catalog-details\s*\{\s*margin-inline-start: 52px/);
  assert.match(css, /catalog-actions\s*\{\s*margin-top: 12px;\s*padding-inline-start: 44px;/);
  assert.doesNotMatch(css, /dashed|position: absolute/);
});

test('P189 card width controls the second header row and narrow indents independently of viewport', () => {
  const narrow = css.split('@container question-catalog (width < calc(600px - 42px))')[1];
  assert.ok(narrow);
  assert.match(narrow, /catalog-header\s*\{\s*flex-wrap: wrap;/);
  assert.match(narrow, /catalog-extra\s*\{\s*flex: 0 0 100%;\s*padding-inline-start: 52px;\s*column-gap: 1rem;/);
  assert.match(narrow, /meta-separator\s*\{\s*display: none/);
  assert.match(narrow, /catalog-status\s*\{\s*margin-inline-start: 0/);
  assert.match(narrow, /prism-question-copy,\s*\.prism-question-catalog-body,\s*\.prism-question-catalog-details\s*\{\s*margin-inline-start: 0/);
  assert.match(narrow, /catalog-actions\s*\{\s*padding-inline-start: 0/);
});

test('P189 selected and hover declarations match P189 base, including the combined ring and shadow', () => {
  const baseCss = execFileSync('git', ['show', '8b9eb2c:components/prism-next/question-catalog.css'], { encoding: 'utf8' });
  const rules = source => source.match(/\.prism-question[^{}]*?(?:selected|:hover)\s*\{[^}]*\}/g);
  assert.equal(rules(css).length, 3);
  assert.deepEqual(rules(css), rules(baseCss));
  assert.match(catalog({ checked: true }), /prism-question-selected ring-2 ring-primary\/60/);
});

test('P189 only vertical details use 30px growing fields with relaxed multiline text', async () => {
  const source = await readFile('components/prism-next/question-details.tsx', 'utf8');
  assert.match(source, /vertical \? "w-24 shrink-0/);
  assert.match(source, /vertical \? "h-\[30px\]/);
  assert.match(source, /vertical \? "[^"]*\[&_dl>div\]:min-h-\[30px\][^"]*\[&_dd\]:leading-relaxed" : "min-w-0 gap-5"/);
  assert.match(source, /vertical\s*\? "[^"]*section\]:min-h-\[30px\][^"]*section\]:leading-relaxed[^"]*"\s*: "[^"]*min-h-\[22px\]/);
});

test('P189 default, reading and summary output matches pre-task markup with or without catalog metadata', () => {
  for (const extra of [{}, { appearance: 'default' }, { appearance: 'catalog', reading: true }, { appearance: 'catalog', compact: true, onOpen: noop }]) {
    const props = { headingLevel: 2, number: 3, index: 7, details: '答案', detailsOpen: true, onCheckedChange: noop, ...extra };
    assert.equal(card({ ...props, meta: '二次函数' }), card(props, before));
  }
});

// The popup is portalled and closed in SSR. Inspect the actual children passed to coss as well as the rendered toolbar.
function nodes(tree) {
  const result = [];
  React.Children.forEach(tree, node => {
    if (!React.isValidElement(node)) return;
    result.push(node, ...nodes(node.props.children));
  });
  return result;
}
function menu(api, props) {
  const tree = api.QuestionActions({ title: '函数', ...props });
  const popup = nodes(tree).find(node => node.type === api.MenuPopup);
  return { tree, align: popup?.props.align, items: nodes(popup?.props.children).filter(node => node.type === api.MenuItem || node.type === api.MenuSeparator)
    .map(node => ({ label: node.type === api.MenuSeparator ? '|' : React.Children.toArray(node.props.children).filter(x => typeof x === 'string').join(''),
      hidden: node.props.className, disabled: node.props.disabled, click: node.props.onClick })) };
}
const callbacks = { onRead: noop, onRelated: noop, onFavorite: noop, onMove: noop, onMoveGroup: noop, onReport: noop, onEdit: noop, onCopy: noop, onRemove: noop, removeLabel: '移出组' };

test('P189 QuestionActions without new props preserves pre-task button markup, popup alignment, items and visibility', () => {
  for (const props of [{}, { onRelated: noop }, { onFavorite: noop, favorite: true }, { onReport: noop }, callbacks]) {
    const capture = api => {
      const result = menu(api, props);
      return { html: renderToStaticMarkup(h(api.Toolbar, {}, result.tree)), align: result.align,
        items: result.items.map(({ click, ...item }) => item) };
    };
    assert.deepEqual(capture(current), capture(before));
  }
});

test('P189 collapse moves actions into an end-aligned menu, keeps callbacks, disabled state and group order', () => {
  const moves = [];
  const result = menu(current, { ...callbacks, onRead: undefined, onMove: offset => moves.push(offset), first: true, collapse: true,
    favorite: true, leadingItems: h(current.MenuItem, { onClick: noop }, '变式') });
  assert.equal(result.align, 'end');
  assert.deepEqual(result.items.map(item => item.label), ['变式', '相似题', '取消收藏', '|', '复制为新题', '纠错', '上移', '下移', '移至其他题组…', '编辑题目资料', '|', '移出组']);
  assert.ok(result.items.every(item => !item.hidden));
  assert.equal(result.items[6].disabled, true);
  result.items[6].click(); result.items[7].click();
  assert.deepEqual(moves, [-1, 1]);
  const html = renderToStaticMarkup(h(current.Toolbar, {}, result.tree));
  assert.doesNotMatch(html, /sm:hidden|sm:inline-flex|相似题|取消收藏/);
  assert.deepEqual(menu(current, { collapse: true, onFavorite: noop }).items.map(item => item.label), ['收藏']);
});

test('P189 host-only menu is operable and icon-only trigger retains visible-to-screen-reader text', () => {
  const result = menu(current, { leadingItems: h(current.MenuItem, {}, '变式'), triggerLabelHidden: true });
  const html = renderToStaticMarkup(h(current.Toolbar, {}, result.tree));
  assert.equal(result.align, 'end');
  assert.deepEqual(result.items.map(item => item.label), ['变式']);
  assert.match(html, /aria-label="函数更多操作"/);
  assert.match(html, /<span class="sr-only">更多<\/span>/);
  assert.doesNotMatch(html, /sm:hidden/);
});
