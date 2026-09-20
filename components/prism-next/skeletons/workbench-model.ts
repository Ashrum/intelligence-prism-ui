export type TaskState = 'idle' | 'queued' | 'running' | 'attention' | 'failed' | 'completed'
export type ShellTask = {
 id: string; kind: 'grading' | 'parsing'; title: string; context: string
 state: Exclude<TaskState, 'idle'>; stage: string; detail: string; updatedAt: string
 processed?: number; total?: number; unit: string
 followUp?: string; result?: string
 steps: readonly { label: string; time?: string; state: 'done' | 'current' | 'waiting' | 'failed' }[]
}
export type UsageAccount = { kind: 'points' | 'tokens'; scope: 'personal' | 'organization' | 'undetermined'; state: 'enabled' | 'disabled' | 'unavailable'; value?: number; unit: string; detail: string }
export const taskLabels: Record<TaskState, string> = { idle: '空闲', queued: '排队中', running: '运行中', attention: '需关注', failed: '失败', completed: 'AI 处理完成' }
export const taskKindLabels = { grading: '批阅', parsing: '解析' } as const
export const needsAttention = (task: ShellTask) => task.state === 'attention' || task.state === 'failed' || !!task.followUp
export function monitorState(tasks: readonly ShellTask[]): TaskState {
  if (tasks.some(task => task.state === 'failed')) return 'failed'
  if (tasks.some(needsAttention)) return 'attention'
  for (const state of ['running', 'queued', 'completed'] as const) if (tasks.some(task => task.state === state)) return state
  return 'idle'
}
export function monitorCounts(tasks: readonly ShellTask[]) {
 return { running: tasks.filter(t => t.state === 'running').length, queued: tasks.filter(t => t.state === 'queued').length, attention: tasks.filter(needsAttention).length, completed: tasks.filter(t => t.state === 'completed').length }
}
export function taskCountText(task: ShellTask): string | undefined {
 const { processed, total } = task
 if (processed === undefined || total === undefined || !Number.isInteger(processed) || !Number.isInteger(total) || total <= 0 || processed < 0 || processed > total) return undefined
 return `${processed} / ${total} ${task.unit}`
}
export function usageText(account: UsageAccount): string {
  if (account.state === 'disabled') return '未启用'
  if (account.state === 'unavailable') return '暂不可用'
  if (account.scope === 'undetermined') return '归属待确认'
  if (account.value === undefined || !Number.isFinite(account.value) || account.value < 0) return '数据暂不可用'
  return `${account.value.toLocaleString('zh-CN')} ${account.unit}`
}
