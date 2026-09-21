export type TaskState = 'idle' | 'running' | 'attention' | 'failed' | 'completed'
export type ShellTask = { id: string; title: string; state: Exclude<TaskState, 'idle'>; detail: string; progress?: number; result?: string }
export type UsageAccount = { kind: 'points' | 'tokens'; scope: 'personal' | 'organization' | 'undetermined'; state: 'enabled' | 'disabled' | 'unavailable'; value?: number; unit: string; detail: string }
export const taskLabels: Record<TaskState, string> = { idle: '空闲', running: '运行中', attention: '需关注', failed: '失败', completed: '完成' }
export function monitorState(tasks: readonly ShellTask[]): TaskState {
  for (const state of ['failed', 'attention', 'running', 'completed'] as const) if (tasks.some(task => task.state === state)) return state
  return 'idle'
}
export function usageText(account: UsageAccount): string {
  if (account.state === 'disabled') return '未启用'
  if (account.state === 'unavailable') return '暂不可用'
  if (account.scope === 'undetermined') return '归属待确认'
  if (account.value === undefined || !Number.isFinite(account.value) || account.value < 0) return '数据暂不可用'
  return `${account.value.toLocaleString('zh-CN')} ${account.unit}`
}
