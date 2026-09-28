import React from 'react';
const h = React.createElement;
const question = { id: 'external-review', title: '外部试题', kind: '简答', points: 5, stem: '根据材料解释依据。', answer: '参考答案', explanation: '参考解析' };
const base = { question, attempts: { 1: '原始学生作答' }, initialScores: { score: 2 }, learner: '外部学生', description: '外部描述', initialNote: '初评说明' };
const editor = { scores: { score: 3.5 }, saved: { score: 2 }, reason: '  调整依据\n保留原空白  ', record: '', error: '' };
export function legacyQuestionReviewCases() {
  return {
    simple: base,
    missing: { ...base, initialScores: {} },
    'part-points': { ...base, question: { ...question, parts: [{ id: 'a', content: '小问甲', points: 2 }, { id: 'b', content: '小问乙', points: 3 }] }, attempts: { a: '甲作答', b: '乙作答' }, initialScores: { 'a-score': 1 } },
    'whole-fallback': { ...base, question: { ...question, parts: [{ id: 'a', content: '未分配分值的小问' }] }, attempts: { a: '完整过程' } },
    'rubric-zero-formula': { ...base, question: { ...question, title: '长中文试题标题'.repeat(10), parts: [{ id: 'a', points: 5, content: h('math', null, h('mfrac', null, h('mn', null, '1'), h('mn', null, '2'))), answer: '分式参考答案', explanation: '分式参考解析', rubric: [{ id: 'zero', label: '零分值评分点', points: 0 }, { id: 'fraction', label: '推理过程'.repeat(12), points: 5 }] }] }, attempts: { a: '长中文学生作答'.repeat(20) }, initialScores: { zero: 0, fraction: 2.5 } },
    'controlled-draft': { ...base, editor, onEditorChange() {} },
    'legacy-record-unchanged': { ...base, editor: { ...editor, scores: { score: 2 }, reason: '', record: '旧宿主的记录' }, onEditorChange() {} },
    'legacy-record-dirty': { ...base, editor: { ...editor, record: '旧宿主的记录', error: '原校验反馈' }, onEditorChange() {} },
  };
}
export const legacyQuestionReviewViews = {
  review: {}, attempt: { 3: 'attempt' },
  'review-expanded': { 1: true, 2: true },
  'attempt-expanded': { 1: true, 2: true, 3: 'attempt' },
};
// Only the final status text may change. No score, answer, control or attribute is normalized away.
export function withoutReviewStatus(html) {
  return html.replace(/(<p role="status" class="text-ui-body">)[\s\S]*?(<\/p><\/div>)$/, '$1[external review status]$2');
}
