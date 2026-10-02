import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { api, h, render, capture, assertRoute } from './review-components-harness.mjs';
const base = { label: '框架', open: true, onOpenChange() {}, immersive: false, pane: 'canvas', onPaneChange() {}, rail: h('aside', {}, '题目'), canvas: h('section', {}, '试卷'), inspector: h('aside', {}, '反馈') };
test('ReviewWorkspace renders its own topbar and preserves optional-slot compatibility', () => {
  const topbar = h('header', { className: 'd1-topbar' }, '预览框架顶栏');
  assert.equal((render(h(api.ReviewWorkspace, { ...base, topbar })).match(/<header/g) || []).length, 1);
  // Legacy omission remains renderable; new fullscreen integrations always supply topbar.
  const legacyWithoutTopbar = render(h(api.ReviewWorkspace, base));
  assert.equal((legacyWithoutTopbar.match(/<header/g) || []).length, 0);
  for (const open of [true,false]) for (const immersive of [true,false]) {
    const html = render(h(api.ReviewWorkspace, { ...base, topbar, open, immersive }));
    assert.match(html, new RegExp(`data-rail-collapsed="${!open}"`)); assert.match(html, new RegExp(`data-immersive="${immersive}"`));
    assert.equal(/inert=""/.test(html), !open);
  }
});
test('ReviewWorkspace narrow navigation requests an open rail, never mutates controlled facts', () => {
  const calls = [], props = { ...base, open: false, onOpenChange: value => calls.push(['open',value]), onPaneChange: value => calls.push(['pane',value]) };
  const out = capture(api.ReviewWorkspace, props), nav = out.nodes.find(n => n.type?.name === 'ToggleGroup');
  nav.props.onValueChange(['rail']); nav.props.onValueChange(['inspector']); nav.props.onValueChange([]);
  assert.deepEqual(calls, [['open',true],['pane','inspector']]); assert.equal(capture(api.ReviewWorkspace, props).html, out.html);
});
test('ReviewWorkspace shortcuts emit configured intents with native input, repeat, IME and portal guards', () => {
  const shortcuts = [{ key: 't', intent: 'rail' },{ key: '+', intent: 'zoom', repeat: true },{ key: 'r', intent: 'rotate', disabled: true }];
  const event = extra => ({ key: 't', target: { closest: () => null }, nativeEvent: {}, preventDefault() {}, stopPropagation() {}, ...extra });
  assert.equal(api.reviewWorkspaceShortcut(event(),shortcuts), 'rail');
  assert.equal(api.reviewWorkspaceShortcut(event({ repeat: true }),shortcuts), undefined);
  assert.equal(api.reviewWorkspaceShortcut(event({ key: '+', repeat: true }),shortcuts), 'zoom');
  for (const extra of [{ key: 'r' },{ ctrlKey: true },{ metaKey: true },{ altKey: true },{ defaultPrevented: true },{ nativeEvent: { isComposing: true } },{ target: { closest: selector => selector.includes('input') ? {} : null } }]) assert.equal(api.reviewWorkspaceShortcut(event(extra),shortcuts), undefined);
  assert.equal(api.reviewWorkspaceShortcut(event(),shortcuts,true), undefined);
  let prevented = false;
  const rail = event({ key: 'ArrowDown', target: { closest: selector => selector.includes('data-review-rail') || selector === '[role="listbox"]' ? {} : null }, preventDefault() { prevented = true; } });
  assert.equal(api.reviewWorkspaceShortcut(rail,[{ key: 'arrowdown', intent: 'next' }]), undefined); assert.equal(prevented,false);
});
test('ReviewWorkspace pure defaults read only their supplied preference band; library has no persistence', async () => {
  assert.equal(api.PAPER_REVIEW_BEST_WIDTH,1440);
  assert.deepEqual([1280,1439,1440,1920].map(w => api.railCollapsedForWidth(w,{})),[true,true,false,false]);
  assert.deepEqual([1280,1920].map(w => api.railCollapsedForWidth(w,{best:true,compact:false})),[false,true]);
  for (const name of ['review-workspace','review-workspace-layout','question-rail','review-switcher','question-inspector','paper-preview-continuous','paper-preview-surface']) {
    const ext = name.endsWith('layout') ? 'ts' : 'tsx';
    const source = await readFile(new URL(`../components/prism-next/${name}.${ext}`,import.meta.url),'utf8');
    assert.doesNotMatch(source,/localStorage|sessionStorage|setTimeout|setInterval|examples\/|ole-school-workbench/);
  }
});
test('ReviewWorkspace three-theme fixtures retain long Chinese and MathML', () => {
  const html = render(h(api.ReviewWorkspaceDemo));
  for (const theme of ['light','paper','dark']) assert.ok(html.includes(`data-prism-theme="${theme}"`));
  assert.match(html, /<math>/); assert.match(html,/完整解题过程/);
});
test('ReviewWorkspace catalog route and Agent Spec render', () => assertRoute(assert,'review-workspace','Review Workspace'));
