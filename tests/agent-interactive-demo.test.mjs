import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSubjectDemos, h, render, capture, button, layouts } from './subject-demos-test-utils.mjs';
const { AgentInteractiveDemo: Component, SubjectNumberControl, initialDemoParameters, demoCapabilities, AgentInteractiveDemoDemo, InteractiveDemoExample } = await loadSubjectDemos('interactive');
const context = { demoId: 'opaque-demo', version: 'opaque-version' };
const base = { ...context, title: '课堂演示（模拟）', subject: '数学', grade: '九年级', parameters: initialDemoParameters, capabilities: demoCapabilities,
  description: 'y = a(x − h)² + k；顶点 (h, k)。', teachingTips: ['先预测，再观察。'], mobileSupport: { supported: true, reason: '数值输入等效。' }, preview: h('span', {}, 'PREVIEW'), content: h('span', {}, 'CANVAS'), source: { label: '模拟来源', openable: true }, onIntent() {} };
const htmlFor = extra => render(h(Component, { ...base, ...extra }));
const probe = extra => capture(Component, { ...base, ...extra }, [SubjectNumberControl]);
const click = (nodes, label) => { const node = button(nodes, label); assert.ok(node, label); node.props.onClick({ currentTarget: {} }); return node; };

test('39 SSR inline/workspace and compact preserve values, text equivalent, boundary and mobile scope', () => {
  for (const layout of layouts) {
    const html = htmlFor(layout);
    for (const text of ['课堂演示（模拟）', '九年级', '顶点 (h, k)', '开口系数 a', '移动端', '数值输入等效。']) assert.ok(html.includes(text), text);
    assert.equal(html.includes('CANVAS'), layout.view === 'workspace'); assert.equal(html.includes('PREVIEW'), layout.view !== 'workspace');
    assert.equal(html.includes('教学提示'), layout.view === 'workspace');
    assert.match(html, new RegExp(`data-density="${layout.density ?? 'default'}"`));
    assert.doesNotMatch(html, /opaque-|宿主|适配器|意图/);
  }
});
test('39 slider and numeric keyboard equivalent emit identical controlled versioned intent, no value mutation', () => {
  const calls = [], extra = { view: 'workspace', onIntent: intent => calls.push(intent) };
  const before = htmlFor(extra), { nodes } = probe(extra);
  const input = nodes.find(node => node.props.type === 'number');
  assert.equal(input.props.step, .5); assert.equal(input.props.min, -3); assert.equal(input.props.max, 3);
  input.props.onChange({ target: { value: '2' } });
  const slider = nodes.find(node => node.props.onValueChange);
  slider.props.onValueChange([2]);
  assert.deepEqual(calls, Array(2).fill({ ...context, type: 'param-change', parameterId: 'coefficient', value: 2 }));
  assert.equal(htmlFor(extra), before);
  input.props.onChange({ target: { value: '' } }); input.props.onChange({ target: { value: 'Infinity' } });
  assert.equal(calls.length, 3); assert.equal(calls[2].value, null);
  const updated = probe({ ...extra, parameters: initialDemoParameters.map((item, i) => i ? item : { ...item, value: 2 }) });
  assert.equal(updated.nodes.find(node => node.props.type === 'number').props.value, 2);
});
test('39 number input retains finite out-of-range drafts without clamping, invalid definition blocks handlers', () => {
  const calls = [], { nodes } = probe({ view: 'workspace', onIntent: value => calls.push(value) });
  nodes.find(node => node.props.type === 'number').props.onChange({ target: { value: '20' } }); assert.equal(calls[0].value, 20);
  const invalid = probe({ view: 'workspace', parameters: [{ ...initialDemoParameters[0], step: 0 }], onIntent() { assert.fail('invalid definition'); } });
  const input = invalid.nodes.find(node => node.props.type === 'number'); assert.equal(input.props.disabled, true); input.props.onChange({ target: { value: '1' } });
});
test('39 reset/fullscreen/source/navigation preserve identity and do not infer completion', () => {
  const calls = [], capabilities = { ...demoCapabilities, fullscreen: { supported: true } };
  const { nodes } = probe({ view: 'workspace', capabilities, onIntent: value => calls.push(value), onBack: value => calls.push(value) });
  for (const label of ['重置参数', '请求全屏', '查看来源', '返回原位置']) click(nodes, label);
  assert.deepEqual(calls, [{ ...context, type: 'reset' }, { ...context, type: 'request-fullscreen' }, { ...context, type: 'open-source' }, context]);
  const trigger = {}, inline = probe({ onExpand: (...args) => calls.push(args) });
  button(inline.nodes, '打开演示').props.onClick({ currentTarget: trigger }); assert.deepEqual(calls.at(-1), [trigger, context]);
});
test('39 unsupported/read-only/missing callback or identity hide editing and guard remaining requests', () => {
  for (const restriction of [{ onIntent: undefined }, { demoId: '' }, { version: '' }, { readOnlyReason: '' }, { parameters: [initialDemoParameters[0], initialDemoParameters[0]] }]) {
    const { nodes, html } = probe({ view: 'workspace', capabilities: { ...demoCapabilities, fullscreen: { supported: true } }, onIntent() { assert.fail('blocked'); }, ...restriction });
    assert.doesNotMatch(html, /type="number"/); assert.equal(click(nodes, '请求全屏').props.disabled, true); assert.equal(click(nodes, '查看来源').props.disabled, true);
  }
  const { nodes, html } = probe({ view: 'workspace', capabilities: { ...demoCapabilities, interact: { supported: false, reason: '暂不可调整。' } } });
  assert.doesNotMatch(html, /type="number"/); assert.equal(button(nodes, '重置参数'), undefined); assert.equal(button(nodes, '请求全屏'), undefined);
});
test('39 capability reasons and boundary appear once, unknown merged, details collapsed in all layouts', () => {
  for (const layout of layouts) {
    const html = htmlFor({ ...layout, subject: undefined, grade: undefined, source: undefined, details: 'HIDDEN_DETAIL', parameters: initialDemoParameters.map(item => ({ ...item, value: null })) });
    assert.equal(html.split('本示例不保存或分享演示。').length - 1, 1); assert.equal(html.split('本示例未提供全屏演示。').length - 1, 1);
    assert.equal(html.split('未知：').length - 1, 1); assert.equal(html.split('演示用于课堂观察').length - 1, 1); assert.doesNotMatch(html, /HIDDEN_DETAIL/);
  }
});
test('39 permanent labels and ARIA references resolve, example exposes anchor and narrow fixture', () => {
  const { nodes, html } = probe({ view: 'workspace' });
  for (const node of nodes) for (const attr of ['aria-labelledby', 'aria-describedby']) for (const id of (node.props[attr] ?? '').split(' ').filter(Boolean)) assert.ok(html.includes(`id="${id}"`), id);
  for (const node of nodes.filter(node => node.props.type === 'number')) assert.ok(html.includes(`for="${node.props.id}"`));
  assert.match(render(h(AgentInteractiveDemoDemo)), /id="interactive-demo"/);
  assert.match(render(h(InteractiveDemoExample, { compact: true, narrow: true })), /max-w-\[320px\]/);
});
