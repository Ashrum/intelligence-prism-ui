export type Material = { title: string; kind: string; minutes: number | null; notes: string }
export const initialMaterial: Material = { title: '二次方程的实数根', kind: 'example', minutes: 8, notes: '补充判别式与实数根数量的对应关系。' }
export function validateMaterial(value: Material) {
  return {
    title: !value.title.trim() ? '请输入材料标题。' : value.title.length > 80 ? '标题不能超过 80 个字符。' : '',
    minutes: value.minutes === null || !Number.isInteger(value.minutes) || value.minutes < 1 || value.minutes > 120 ? '时长须为 1–120 的整数。' : '',
    notes: value.notes.length > 500 ? '备注不能超过 500 个字符。' : '',
  }
}
export function isMaterial(value: unknown): value is Material {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return typeof v.title === 'string' && typeof v.notes === 'string' && ['example','concept','practice'].includes(String(v.kind)) && typeof v.minutes === 'number' && !Object.values(validateMaterial(v as Material)).some(Boolean)
}
export type TaskStatus = 'idle' | 'running' | 'confirm' | 'completed' | 'stopped' | 'error'
export type TaskState = { status: TaskStatus; step: number; request: string; failure: boolean }
export type TaskAction = { type: 'start'; request: string; failure: boolean } | { type: 'advance' | 'stop' | 'apply' | 'reset' }
export const initialTask: TaskState = { status: 'idle', step: 0, request: '', failure: false }
export const taskSteps = ['读取当前材料', '计算判别式与实数根', '整理复核建议']
export function taskReducer(state: TaskState, action: TaskAction): TaskState {
  switch(action.type) {
    case 'start': return state.status === 'running' || !action.request.trim() ? state : { status:'running', step:0, request:action.request.trim(), failure:action.failure }
    case 'advance':
      if(state.status !== 'running') return state
      if(state.failure && state.step === 1) return {...state,status:'error'}
      return state.step === taskSteps.length - 1 ? {...state,status:'confirm',step:taskSteps.length} : {...state,step:state.step+1}
    case 'stop': return state.status === 'running' ? {...state,status:'stopped'} : state
    case 'apply': return state.status === 'confirm' ? {...state,status:'completed'} : state
    case 'reset': return {...initialTask}
  }
}
export const reviewSuggestion = '已复核：判别式 Δ = 1，两个实数根为 1 与 2。建议明确区分 Δ > 0、Δ = 0 与 Δ < 0 三种情况。'

export function appendReviewNotes(current: string, suggestion: string) {
  const notes = current.includes(suggestion) ? current : current.trim() ? current + '\n\n' + suggestion : suggestion
  return notes.length > 500 ? {notes:current, error:'追加后将超过 500 字。请先精简现有备注，再返回助手采用建议。'} : {notes, error:''}
}
