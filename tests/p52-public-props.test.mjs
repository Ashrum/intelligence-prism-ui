import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { api, h, render, capture } from './review-components-harness.mjs';

const noop = () => {};
const rail = { ...api.reviewRailFixture, panelId: 'p52-rail', selected: '2', filter: 'all', onFilterChange: noop, onSelect: noop, onLocate: noop, onPage: noop };
const plain = { ...rail, filters: undefined, filter: undefined, onFilterChange: undefined, overview: undefined };
const mixed = { viewportRef: { current: null }, pages: [{ id: 'digital', width: 794, height: 1, content: h('article', {}, '数字题面') }, { id: 'scan', width: 600, height: 820, alt: '扫描作答' }], zoom: 'width', rotations: {}, selected: '', scale: 1, activePage: 'scan', topInset: 0, headers: { scan: h('p', {}, '扫描页身份') }, answerLabel: '学生作答', onSelect: noop, onZoom: noop, onVisiblePage: noop, onViewport: noop };
const preview = props => render(h(api.PaperPreview, { layout: 'mixed', mixed: props }));

test('P52 preserves seven pre-change QuestionRail and mixed SSR hashes', async () => {
  const baseline = JSON.parse(await readFile(new URL('./fixtures/p52-default-before.json', import.meta.url), 'utf8'));
  const hash = html => createHash('sha256').update(html).digest('hex');
  assert.deepEqual([rail, { ...rail, sections: [] }, { ...rail, filter: 'attention' }].map(p => hash(render(h(api.QuestionRail, p)))), baseline.rail);
  assert.deepEqual([mixed, { ...mixed, pages: [] }, { ...mixed, pages: [mixed.pages[0]] }, { ...mixed, renderSectionHeading: (page, index) => page.content ? null : h('h2', {}, `扫描分节 ${index}`) }].map(p => hash(preview(p))), baseline.mixed);
  assert.equal(preview({ ...mixed, label: undefined }), preview(mixed));
  assert.equal(preview({ ...mixed, label: '题目与学生作答连续画布' }), preview(mixed));
  assert.equal(preview({ ...mixed, pages: [mixed.pages[0]], headers: undefined }), preview({ ...mixed, pages: [mixed.pages[0]], headers: {} }));
});

test('P52 omitted rail regions retain named title/list/sections without tabs or an overview row', () => {
  const html = render(h(api.QuestionRail, { ...plain, title: '试卷题目', label: '数字卷题目栏', listLabel: '选择试卷题目' }));
  assert.match(html, /<h2 class="text-ui-body">试卷题目<\/h2>/);
  assert.match(html, /aria-label="数字卷题目栏"/);
  assert.match(html, /id="p52-rail" role="region" aria-label="选择试卷题目"/);
  assert.match(html, /role="listbox" aria-label="选择试卷题目"/);
  assert.match(html, /grid-template-rows:56px minmax\(0,1fr\)/);
  assert.match(html, /role="group" aria-label="选择题"/);
  assert.match(html, /aria-label="第 2 题，正确率 60%，请核对原始证据"/);
  assert.doesNotMatch(html, /role="(?:tablist|tab|tabpanel)"|d1-rail-overview|data-overview-count/);
  assert.match(render(h(api.QuestionRail, { ...plain, sections: [], empty: '尚无试卷题目' })), /尚无试卷题目/);
});

test('P52 partial optional rail props are independent and preserve external filter intent', () => {
  for (const extra of [{ filter: 'all' }, { onFilterChange: noop }]) {
    assert.equal(render(h(api.QuestionRail, { ...plain, ...extra })), render(h(api.QuestionRail, plain)));
  }
  const overview = render(h(api.QuestionRail, { ...plain, overview: rail.overview }));
  assert.match(overview, /d1-rail-overview/); assert.doesNotMatch(overview, /role="tablist"|grid-template-rows/);
  const calls = [], filters = capture(api.QuestionRail, { ...plain, filters: rail.filters, onFilterChange: value => calls.push(value) });
  assert.match(filters.html, /role="tablist"/); assert.match(filters.html, /role="tabpanel"/);
  assert.match(filters.html, /data-question-id="2"/); assert.doesNotMatch(filters.html, /d1-rail-overview/);
  const tabs = filters.nodes.find(node => node.type?.name === 'Tabs');
  assert.equal(tabs.props.value, 'all'); tabs.props.onValueChange('attention'); assert.deepEqual(calls, ['attention']);
  assert.match(filters.html, /aria-controls="p52-rail"/);
  assert.match(render(h(api.QuestionRail, { ...plain, filters: [] })), /role="tablist"/);
});

test('P52 plain rail keeps keyboard, page, collapse and sort intents', () => {
  const calls = [], out = capture(api.QuestionRail, { ...plain, onSelect: id => calls.push(['select', id]), onLocate: () => calls.push(['locate']), onPage: id => calls.push(['page', id]), collapse: h('button', {}, '收起题目'), sort: h('button', {}, '宿主排序') });
  assert.match(out.html, /收起题目/); assert.match(out.html, /宿主排序/);
  const key = out.nodes.find(node => node.props.role === 'listbox').props.onKeyDown;
  const event = name => ({ key: name, target: { closest: selector => selector === '[data-question-id]' ? { dataset: { questionId: '2' } } : null }, preventDefault() {}, stopPropagation() {} });
  key(event('ArrowDown')); key(event('Enter'));
  out.nodes.find(node => node.props['aria-label'] === '定位第 1 页').props.onClick();
  assert.deepEqual(calls, [['select', '3'], ['locate'], ['page', 'a']]);
});

test('P52 mixed digital and scan headings receive original pages/index and precede headers/content', () => {
  const pages = [mixed.pages[0], mixed.pages[1], { ...mixed.pages[0], id: 'last', content: h('article', {}, '末节数字正文') }], calls = [];
  const html = preview({ ...mixed, pages, beforeContent: h('p', {}, '卷头'), headers: { digital: h('p', {}, '数字页身份'), scan: h('p', {}, '扫描页身份'), last: h('p', {}, '末节身份') }, renderSectionHeading: (page, index) => { calls.push([page, index]); return h('h2', {}, `分节 ${index}`); } });
  assert.deepEqual(calls, pages.map((page, index) => [page, index]));
  calls.forEach(([page], index) => assert.equal(page, pages[index]));
  const order = ['卷头', '分节 0', '数字页身份', '数字题面', '分节 1', '扫描页身份', 'data-page-id="scan"', '分节 2', '末节身份', '末节数字正文'].map(text => html.indexOf(text));
  assert.ok(order.every((position, index) => position >= 0 && (!index || position > order[index - 1])));
  assert.doesNotMatch(html, /data-answer-section/);
  assert.match(preview(mixed), /data-answer-section/);
  const digitalOnly = preview({ ...mixed, pages: [pages[0]], headers: { digital: h('p', {}, '独立页眉') } });
  assert.ok(digitalOnly.indexOf('独立页眉') < digitalOnly.indexOf('数字题面'));
  assert.doesNotMatch(digitalOnly, /data-answer-section/);
});

test('P52 public and low-level mixed label applies without changing digital geometry or scan behavior', () => {
  const props = { ...mixed, label: '试卷连续画布', zoom: 200, rotations: { digital: 90, scan: 90 }, headers: {} };
  const html = preview(props);
  assert.match(html, /aria-label="试卷连续画布"/); assert.doesNotMatch(html, /题目与学生作答连续画布/);
  assert.equal(html, render(h(api.PaperPreviewMixed, props)));
  const nodes = capture(api.PaperPreviewMixed, props).nodes;
  assert.equal(nodes.find(node => node.props['data-page-id'] === 'digital').props['data-percent'], 100);
  assert.deepEqual(nodes.find(node => node.type === 'section' && node.key === 'digital').props.style, { width: 740 });
  assert.deepEqual(nodes.find(node => node.props['data-page-id'] === 'scan').props.style, { width: 1640, height: 1200 });
  assert.match(html, /rotate\(90deg\)/);
  assert.match(preview({ ...props, pages: [] }), /aria-label="试卷连续画布"/);
});

test('P52 digital sample route exposes three themes, narrow fixtures, long Chinese, formula and both Agent Specs', async () => {
  const { default: worker } = await import('../dist/server/index.js');
  const response = await worker.fetch(new Request('http://localhost/next/components/paper-preview/digital', { headers: { accept: 'text/html' } }), { ASSETS: { fetch: async () => new Response('Not found', { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
  assert.equal(response.status, 200);
  const html = await response.text();
  for (const theme of ['light', 'paper', 'dark']) assert.ok(html.includes(`data-prism-theme="${theme}"`));
  for (const text of ['320px', '试卷题目', '一、选择题', '二、解答题', '显示筛选', '显示概览', '显示分节标题与页眉', '试卷连续画布', '等价变形依据', 'P52:', 'Agent Spec', '<math>']) assert.ok(html.includes(text), text);
});
