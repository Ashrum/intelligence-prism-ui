// Inputs shared by the pinned main snapshot and the compatibility assertion.
export function legacyRecordCases() {
  const action = { label: '查询原请求', onAction() {} };
  const progress = { title: '整理材料', description: '第 2 页等待核对', steps: [{ id: 'one', label: '读取材料', state: 'done' }, { id: 'two', label: '整理内容', state: 'running', detail: '仅第 1 页' }], expanded: true, updatedAt: '2026-09-24 09:20', onExpandedChange() {} };
  const cases = Object.fromEntries(['pending', 'running', 'waiting', 'unknown', 'completed', 'partial', 'failed', 'queued', 'paused', 'waiting-human', 'degraded', 'retrying'].map(state => [`progress-${state}`, { component: 'AgentExecutionProgress', props: { ...progress, state, action } }]));
  cases['progress-collapsed-inline'] = { component: 'AgentExecutionProgress', props: { ...progress, state: 'unknown', expanded: false, presentation: 'inline' } };
  cases['progress-empty'] = { component: 'AgentExecutionProgress', props: { ...progress, state: 'pending', steps: [], onExpandedChange: undefined } };
  for (const status of ['succeeded', 'partial', 'failed', 'unknown']) cases[`result-${status}`] = { component: 'AgentExecutionResult', props: { title: '整理结果', description: '按原请求保留记录', facts: [{ label: '原稿', value: 'v2' }], receipt: status === 'unknown' ? { status, query: action } : { status, completed: ['第 1 页'], remaining: ['第 2 页'], next: { ...action, label: '查看结果' }, secondary: { ...action, disabledReason: '材料暂不可用' } } } };
  cases['result-empty-inline'] = { component: 'AgentExecutionResult', props: { title: '整理结果', description: '尚无完整回执', presentation: 'inline', receipt: { status: 'failed', completed: [], remaining: [] } } };
  for (const state of ['confirmed', 'absent', 'unknown', 'unavailable']) for (const expanded of [false, true]) cases[`context-${state}-${expanded}`] = { component: 'AgentContextSummary', props: {
    title: '任务依据', scope: [{ label: '材料范围', value: '第 1–3 页' }], expanded, onExpandedChange() {}, onInspect() {}, snapshot: expanded ? '2026-09-23' : undefined,
    notice: { text: '示例记录', tone: 'info' }, sources: [{ id: 'source', title: '练习原稿', location: 'v2 · 第 1 页', selection: 'selected', read: { state, description: '读取记录范围' }, context: { state: 'unknown' }, citation: { state: 'unavailable' }, details: [{ label: '对应执行', value: '第 1 轮' }] }, { id: 'other', title: '补充材料', location: 'v1', selection: 'not-selected', read: { state: 'absent' }, context: { state: 'absent' }, citation: { state: 'absent' }, inspectable: false }],
  } };
  cases['context-empty'] = { component: 'AgentContextSummary', props: { title: '任务依据', scope: [], sources: [], expanded: false } };
  return cases;
}

// React useId tree addresses may shift when optional JSX children are added.
// Normalize addresses only, retaining all ID/reference relationships and markup.
export function normalizeRecordMarkup(html) {
  const ids = new Map();
  return html.replace(/_R_[\w]+_/g, id => {
    if (!ids.has(id)) ids.set(id, `REACT_ID_${ids.size}`);
    return ids.get(id);
  });
}
