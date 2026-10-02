import test from 'node:test';
import assert from 'node:assert/strict';
import { api, h, render, capture, assertRoute } from './review-components-harness.mjs';
import React from 'react';
const items = api.switcherItems, ref = { current: null };
const base = { items, groups: ['待核对','已确认'].map(value => ({ value, items: items.filter(item => item.group === value) })), current: 0, open: false, onOpenChange() {}, onSelect() {}, triggerRef: ref, searchId: 'test-jump', itemKey: item => item.id, itemToStringLabel: item => `${item.id} ${item.name}`, renderItem: item => h('span',{},item.name), labels: { navigation:'导航', previous:'上一题',next:'下一题',previousAria:'上一题',nextAria:'下一题',trigger:'跳转',panel:'选择题目',search:'题号',empty:'无匹配结果' } };
test('ReviewSwitcher grouped search and identity selection use the supplied data and real coss primitives', () => {
  const calls = [], out = api.ReviewSwitcher({ ...base, open: true, onSelect: value => calls.push(value) });
  const inline = React.cloneElement(out,{},React.Children.map(out.props.children,child => child.props['data-student-panel'] !== undefined ? h('div',{},child.props.children) : child));
  assert.equal((render(inline).match(/data-slot="combobox-item"/g)||[]).length,2);
  const filtered = render(React.cloneElement(inline,{inputValue:'q2'})); assert.equal((filtered.match(/data-slot="combobox-item"/g)||[]).length,1); assert.match(filtered,/椭圆焦距/);
  assert.match(render(React.cloneElement(inline,{inputValue:'找不到'})),/无匹配结果/);
  out.props.onValueChange({ ...items[1] }); out.props.onValueChange(null); assert.deepEqual(calls,[1]);
  assert.equal(out.props.value,items[0]);
  const popup = capture(api.ReviewSwitcher,base).nodes.find(n => n.props['data-student-panel'] !== undefined); assert.equal(popup.props.finalFocus,ref);
});
test('ReviewSwitcher neighboring navigation honors boundaries, empty items and external current index', () => {
  const calls = [];
  for (const current of [0,1]) {
    const out = capture(api.ReviewSwitcher,{...base,current,onSelect:value=>calls.push(value)});
    const prev = out.nodes.find(n=>n.props['aria-label']==='上一题'), next = out.nodes.find(n=>n.props['aria-label']==='下一题');
    assert.equal(prev.props.disabled,current===0); assert.equal(next.props.disabled,current===1); prev.props.onClick();next.props.onClick();
  }
  assert.deepEqual(calls,[1,0]);
  const empty = capture(api.ReviewSwitcher,{...base,items:[],groups:[],current:0});
  assert.equal(empty.nodes.filter(n=>['上一题','下一题'].includes(n.props['aria-label'])).every(n=>n.props.disabled),true);
});
test('ReviewSwitcher supports three themes and no student-specific labels are forced', () => {
  const html=render(h(api.ReviewSwitcherDemo));assert.doesNotMatch(html,/aria-label="(?:学生导航|上一位学生)"/);assert.match(html,/aria-label="题目导航"/);for(const theme of ['light','paper','dark'])assert.ok(html.includes(`data-prism-theme="${theme}"`));
});
test('ReviewSwitcher route and Agent Spec render',()=>assertRoute(assert,'review-switcher','Review Switcher'));
