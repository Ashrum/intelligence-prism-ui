// Shared inputs for SSR snapshots captured from main 0a19ff7 and regression tests.
export const stepStatesBaseline = '0a19ff700d47ae4250ae79a8b04758ea9cdbe7aa';

export function legacyStepCases() {
  const states = ['done', 'running', 'pending', 'error'];
  const steps = states.map((state, index) => ({ id: state, label: `原步骤 ${index + 1}`, state, detail: `原说明 ${index + 1}`, time: `09:0${index}` }));
  const cases = {};
  for (const state of states) for (const snapshot of [false, true]) {
    cases[`status-${state}-${snapshot}`] = { component: 'AgentStepStatus', props: { state, snapshot } };
  }
  cases['task-default'] = { component: 'AgentTaskProgress', props: { steps } };
  for (const density of ['default', 'compact']) for (const activity of ['live', 'snapshot']) {
    cases[`task-${density}-${activity}`] = { component: 'AgentTaskProgress', props: { steps, density, activity } };
  }
  const stages = ['running', 'unknown'].map(state => ({ id: `stage-${state}`, title: `阶段 ${state}`, state, time: '09:10', description: '阶段记录', steps }));
  for (const view of ['inline', 'workspace']) for (const density of ['default', 'compact']) {
    for (const condition of ['live', 'unknown', 'snapshot']) {
      cases[`execution-${view}-${density}-${condition}`] = { component: 'AgentExecutionProgress', props: {
        title: '原任务记录', description: '保留原请求事实', state: condition === 'unknown' ? 'unknown' : 'running',
        steps, stages, view, density, expanded: true, onExpandedChange() {},
        run: { id: 'current', label: '当前轮', version: 'v2' }, updatedAt: '09:10',
        snapshot: condition === 'snapshot' ? '2026-09-23' : undefined,
        history: [{ id: 'previous', label: '前一轮', version: 'v1', state: 'running', description: '保留当时事实', steps, stages }],
      } };
    }
  }
  return cases;
}
