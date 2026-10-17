import React from 'react';

export const r9Baseline = '433969ab29679669c78fde816dfec96c4db31cfb';
export const r9Sources = [
  'components/prism-next/agent-file-input.tsx',
  'components/prism-next/agent-semantic-components.tsx',
  'components/prism-next/agent-collection-basket.tsx',
  'components/prism-next/blueprint/blueprint.tsx',
];
const noop = () => {};
export const request = { id: 'request-internal-91', label: '原上传请求' };
export const fileStates = [
  { state: 'selected' }, { state: 'invalid', validation: 'size', reason: '文件超出本机选择范围' },
  { state: 'queued' }, { state: 'received', request }, { state: 'uploading', request, progress: 42 },
  { state: 'uploaded', uploadedAt: '2026-10-18 10:00' },
  { state: 'failed', reason: '上传明确失败', request, retry: {} },
  { state: 'unknown', reason: '尚未取得回执', request, query: {} }, { state: 'removed' },
];
export const fileItem = {
  id: 'file-internal-81', name: '周测原卷.pdf', type: 'PDF', sizeBytes: 1024,
  version: 'material-internal-v12', source: { kind: 'local', label: '本机材料' },
  actions: { remove: {}, replace: {}, move: {} }, status: fileStates[0],
  details: '材料来源已核对', preview: React.createElement('p', null, '原卷第一页'),
};
export const fileProps = {
  title: '本次材料', items: [fileItem],
  limits: { accept: '.pdf', acceptLabel: 'PDF', maxFileSize: 1048576, maxFiles: 3 },
  capabilities: { select: { status: 'supported' }, upload: { status: 'supported' }, drop: { status: 'supported' } },
  onSelect: noop, onAction: noop,
};
export const confirmationStates = ['ready', 'submitting', 'received', 'recorded', 'blocked', 'unknown'];
export const confirmationProps = {
  title: '确认当前成果', target: '周测作答', version: 'V2', effects: ['保留修订', '不会纳入未完成作答'],
};
export const confirmationFor = state => state === 'ready' ? { state, confirm: { label: '确认成果', onAction: noop } }
  : { state, description: '本次确认范围已记录', ...(state === 'unknown' ? { query: { label: '查询原请求', onAction: noop } } : {}) };
export const basketProps = {
  collection: { id: 'basket-1', title: '试题篮', type: '题目', version: 'v2', source: '题库' },
  summary: { count: 2, unit: '题' }, sync: { state: 'local' },
  items: [
    { id: 'q1', title: '二次函数', type: '解答题', version: 'question-internal-v2', source: '题库', selectable: {}, actions: { remove: {} } },
    { id: 'restricted', access: 'restricted', disclosure: { label: '受限题目', reason: '当前无权读取' } },
  ],
  onAction: noop, onSelectionChange: noop, onOpenItem: noop,
  renderSummary: () => ({ content: React.createElement('span', null, '求函数的最小值。'), excerpt: true }),
};

/** Fixed pre-R9 calls; do not add new props here or regenerate from the candidate. */
export function legacyCases() {
  const cases = [];
  for (const view of ['inline', 'workspace']) for (const density of ['default', 'compact']) {
    for (const status of fileStates) cases.push({ name: `file-${view}-${density}-${status.state}`, component: 'AgentFileInput', props: { ...fileProps, view, density, items: [{ ...fileItem, status }] } });
    cases.push({ name: `file-${view}-${density}-empty`, component: 'AgentFileInput', props: { ...fileProps, view, density, items: [] } });
    for (const itemPresentation of ['default', 'summary']) cases.push({ name: `basket-${view}-${density}-${itemPresentation}`, component: 'AgentCollectionBasket', props: { ...basketProps, view, density, itemPresentation } });
  }
  for (const state of confirmationStates) for (const presentation of ['card', 'inline']) cases.push({ name: `confirmation-${state}-${presentation}`, component: 'AgentExecutionConfirmation', props: { ...confirmationProps, confirmation: confirmationFor(state), presentation } });
  for (const [name, props] of [
    ['none', {}], ['legacy', { sheetNo: '2/4' }], ['sheet', { folio: { kind: 'sheet', value: '2/4' } }],
    ['rev', { folio: { kind: 'rev', value: 'v3' } }], ['empty', { sheetNo: '2/4', folio: { kind: 'rev', value: '' } }],
    ['override', { sheetNo: '2/4', folio: { kind: 'rev', value: 'v3' }, folioAriaHidden: true }],
  ]) cases.push({ name: `sheet-${name}`, component: 'BlueprintSheet', props: { title: '周测成果', description: '本次可复核范围', children: React.createElement('p', null, '正文'), ...props } });
  return cases;
}
