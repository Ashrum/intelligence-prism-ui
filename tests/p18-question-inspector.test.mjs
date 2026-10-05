import test from 'node:test';
import assert from 'node:assert/strict';
import { api, h, render, capture } from './review-components-harness.mjs';

const base = { ...api.reviewInspectorFixture, onStep() {}, onWrong() {}, onIntent() {} };
const html = props => render(h(api.QuestionInspector, { ...base, ...props }));

test('P18 QuestionInspector explicit defaults retain legacy output in full and body-only modes', () => {
  for (const bodyOnly of [false, true]) {
    assert.equal(html({ bodyOnly, density: 'default', showEvidence: true, showConfidence: true, showKnowledge: true, showComparison: true }), html({ bodyOnly }));
    for (const footer of [undefined, null, false]) assert.equal(html({ bodyOnly, footer }), html({ bodyOnly }));
  }
});

test('P18 QuestionInspector visibility removes complete sections and comparison navigation', () => {
  const evidence = html({ showEvidence: false });
  assert.doesNotMatch(evidence, /AI 判定依据|data-ai-source|置信度/);
  assert.match(evidence, /知识点|班级对比/);
  const confidence = html({ showConfidence: false });
  assert.match(confidence, /AI 判定依据/);
  assert.doesNotMatch(confidence, /置信度|未提供/);
  assert.doesNotMatch(html({ showKnowledge: false }), /知识点|圆锥曲线定义/);
  const comparison = html({ showComparison: false, comparison: [], comparisonEmptyText: '班级事实尚未提供', extraLink: h('a', { href: '/cohort' }, '班级导航') });
  assert.doesNotMatch(comparison, /班级对比|班级事实尚未提供|班级导航|href="\/cohort"/);
  const compact = html({ bodyOnly: true, density: 'compact', showEvidence: false, showConfidence: false, showKnowledge: false, showComparison: false });
  assert.doesNotMatch(compact, /AI 判定依据|置信度|知识点|班级对比|scroll-area-viewport/);
  assert.match(compact, /aria-label="本题得分"/);
  assert.match(compact, /aria-label="评分点"/);
});

test('P18 QuestionInspector slots preserve facts and appear in result, basis, action order', () => {
  const out = capture(api.QuestionInspector, {
    ...base, scoreSource: h('span', null, '你已修改'), afterScore: '原 AI 批阅 6 分 · 按评分点重新核算',
    afterPoints: h('section', { 'aria-label': '错因复核' }, '错因事实'), footer: h('button', { type: 'button' }, '修改评分'),
  });
  const source = out.nodes.find(n => n.props['data-slot'] === 'question-inspector-score-source');
  const sourceGroup = out.nodes.find(n => n.props.className === 'ml-auto flex min-w-0 flex-wrap items-center justify-end gap-2');
  assert.ok(sourceGroup.props.children.includes(source));
  assert.match(out.html, /需核对/);
  const position = text => out.html.indexOf(text);
  assert.ok(position('你已修改') < position('原 AI 批阅 6 分'));
  assert.ok(position('原 AI 批阅 6 分') < position('aria-label="评分点"'));
  assert.ok(position('aria-label="评分点"') < position('错因事实'));
  assert.ok(position('错因事实') < position('AI 判定依据'));
  assert.ok(position('班级对比') < position('修改评分'));
  assert.doesNotMatch(out.html, /更正评分|教师批阅/);
});

test('P18 QuestionInspector custom footer stays outside the only scroll area for both shells', () => {
  for (const bodyOnly of [false, true]) {
    const out = capture(api.QuestionInspector, { ...base, bodyOnly, density: 'compact', footer: h('button', { type: 'button' }, '固定动作') });
    assert.equal((out.html.match(/data-slot="scroll-area-viewport"/g) || []).length, 1);
    assert.equal((out.html.match(/data-slot="question-inspector-footer"/g) || []).length, 1);
    const root = out.nodes[0];
    const footer = out.nodes.find(n => n.props['data-slot'] === 'question-inspector-footer');
    assert.ok(root.props.children.includes(footer));
    assert.match(footer.props.className, /shrink-0/);
    const scroll = out.nodes.find(n => n.type.name === 'ScrollArea');
    assert.ok(scroll);
    assert.ok(!out.nodes.filter(n => n === scroll).some(n => n.props.children === footer));
    assert.doesNotMatch(render(scroll), /固定动作|question-inspector-footer/);
    if (bodyOnly) {
      assert.match(out.html, /data-question-inspector-body/);
      assert.doesNotMatch(out.html, /<aside|上一题|下一题|下一道错题/);
    }
  }
});

test('P18 QuestionInspector compact changes spacing while keeping standard controls and score roles', () => {
  const regular = html({});
  const compact = html({ density: 'compact' });
  assert.match(compact, /space-y-4 px-4 py-3/);
  assert.match(compact, /space-y-2 text-ui-body/);
  const buttons = markup => [...markup.matchAll(/<button([^>]+)>/g)].map(([, attrs]) => attrs);
  assert.deepEqual(buttons(compact), buttons(regular));
  assert.equal((compact.match(/class="text-score-display"/g) || []).length, 1);
  const unknown = html({ density: 'compact', score: { ...base.score, value: null, text: '未提供' }, comparison: [], showComparison: false });
  assert.doesNotMatch(unknown, /role="meter"/);
  assert.match(unknown, /未提供/);
});
