import type { TaskState as ShellTaskState } from '../../components/prism-next/skeletons/workbench-model'
import type { TaskStatus as ReviewTaskStatus } from './review'

export type AgentProgressState = 'pending' | 'running' | 'waiting' | 'unknown' | 'completed' | 'partial' | 'failed' | 'queued' | 'paused' | 'waiting-human' | 'degraded' | 'retrying'

export const agentProgressLabels: Record<AgentProgressState, string> = {
  pending: '待开始', running: '进行中', waiting: '等待处理', unknown: '状态未确认',
  completed: '已完成', partial: '部分完成', failed: '执行失败',
  queued: '排队中', paused: '已暂停', 'waiting-human': '待人工处理',
  degraded: '已降级', retrying: '重试中',
}

// Only repository-owned contracts are adapted at runtime. No current contract
// produces paused, degraded or retrying; these are display-only until a host
// provides an execution-state source. See docs/agent-context-summary-review.md.
export type AgentProgressSource =
  | { source: 'shell'; state: ShellTaskState }
  | { source: 'review'; state: ReviewTaskStatus }

const shellStates: Record<ShellTaskState, AgentProgressState | null> = {
  idle: null, queued: 'queued', running: 'running', attention: 'waiting', failed: 'failed', completed: 'completed',
}
const reviewStates: Record<ReviewTaskStatus, AgentProgressState | null> = {
  idle: null, running: 'running', confirm: 'waiting-human', completed: 'completed', stopped: null, error: 'failed',
}

/** Pure vocabulary adapter. null requires host handling; it never means an unknown receipt. */
export function mapAgentProgressState(input: AgentProgressSource): AgentProgressState | null {
  switch (input.source) {
    case 'shell': return shellStates[input.state]
    case 'review': return reviewStates[input.state]
  }
}
