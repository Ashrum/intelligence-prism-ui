export const objectCardSources = ['components/prism-next/agent-structure-arranger.tsx', 'components/prism-next/agent-relation-graph.tsx'];
export const objectCardBase = '21560ebca1e4e8b45fe57125b8fdb619bece113c';
export const arrangerProps = {
  structure: { id: 'arrangement', title: '数学课堂练习与长中文条件核对'.repeat(3), version: { id: 'v2', label: '草稿 v2' }, baseVersion: { id: 'v1', label: '基准 v1' } },
  items: [{ id: 'q1', title: '求 f(x) = x² − 4x + 3 的对称轴', type: '试题', groupId: 'g1', source: null, attributes: [] }],
  groups: [{ id: 'g1', title: '一、函数' }], validation: [], actions: { confirm: {}, groupCreate: {} }, onIntent() {}, onExpand() {}, onBack() {},
};
export const graphProps = {
  graphId: 'graph', version: 'v1', versionLabel: '示例 v1', title: '知识点关系与长中文条件核对'.repeat(3),
  nodes: [{ id: 'n1', label: '函数图像 f(x) = x²', type: '知识点', status: '未覆盖' }], edges: [],
  capabilities: Object.fromEntries(['view', 'filter', 'edit-node', 'edit-edge', 'layout'].map(name => [name, { supported: true }])),
  summary: { statusCounts: [{ label: '未覆盖', count: 1 }], gaps: [] }, onIntent() {}, onExpand() {}, onBack() {},
};
export function objectCardCases() {
  return ['inline', 'workspace'].flatMap(view => ['default', 'compact'].flatMap(density => [
    { name: `arranger-current-${view}-${density}`, component: 'AgentStructureArranger', props: { ...arrangerProps, view, density } },
    { name: `arranger-history-${view}-${density}`, component: 'AgentStructureArranger', props: { ...arrangerProps, view, density, structure: { ...arrangerProps.structure, snapshot: '上次保存的编排记录' }, save: { state: 'saved-draft' } } },
    { name: `graph-${view}-${density}`, component: 'AgentRelationGraph', props: { ...graphProps, view, density } },
    { name: `graph-unavailable-${view}-${density}`, component: 'AgentRelationGraph', props: { ...graphProps, view, density, capabilities: { ...graphProps.capabilities, view: { supported: false, reason: '资料尚未提供' } } } },
  ]));
}
