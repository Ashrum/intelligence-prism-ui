export type SubjectFormulaMode = "inline" | "block"
export type SubjectSelection = { start: number; end: number }
export type SubjectEdit = { value: string; selection: SubjectSelection }
export type SubjectTool = {
  id: string
  label: string
  before: string
  placeholder: string
  after: string
}
export type SubjectEditorTarget = { formulaId: string; baseVersion: string; formulaMode: SubjectFormulaMode }
export type AgentSubjectEditorIntent = SubjectEditorTarget & (
  | { type: "change" | "apply"; value: string }
  | { type: "cancel" }
)

const tool = (id: string, label: string, before: string, placeholder = "", after = ""): SubjectTool => ({ id, label, before, placeholder, after })
export const subjectToolGroups: readonly { label: string; tools: readonly SubjectTool[] }[] = [
  { label: "结构", tools: [
    tool("fraction", "分式", "\\frac{", "a", "}{b}"),
    tool("root", "根式", "\\sqrt{", "x", "}"),
    tool("superscript", "上标", "^{", "2", "}"),
    tool("subscript", "下标", "_{", "n", "}"),
    tool("parentheses", "括号", "\\left(", "x", "\\right)"),
    tool("absolute", "绝对值", "\\left|", "x", "\\right|"),
  ] },
  { label: "关系", tools: [tool("equals", "等于", "="), tool("le", "小于等于", "\\leq "), tool("ge", "大于等于", "\\geq "), tool("ne", "不等于", "\\neq "), tool("approx", "约等于", "\\approx ")] },
  { label: "运算", tools: [tool("pm", "正负号", "\\pm "), tool("times", "乘号", "\\times "), tool("divide", "除号", "\\div "), tool("sum", "求和", "\\sum_{", "i=1", "}^{n} "), tool("integral", "积分", "\\int_{", "a", "}^{b} ")] },
  { label: "希腊字母", tools: [tool("alpha", "α", "\\alpha "), tool("beta", "β", "\\beta "), tool("theta", "θ", "\\theta "), tool("pi", "π", "\\pi "), tool("delta", "Δ", "\\Delta ")] },
  { label: "集合", tools: [tool("in", "属于", "\\in "), tool("notin", "不属于", "\\notin "), tool("subset", "子集", "\\subseteq "), tool("union", "并集", "\\cup "), tool("intersection", "交集", "\\cap "), tool("empty", "空集", "\\emptyset ")] },
]
const quickIds = new Set(["fraction", "root", "superscript", "subscript", "parentheses", "le", "pm", "times"])
export const subjectQuickTools = subjectToolGroups.flatMap(group => group.tools).filter(item => quickIds.has(item.id))

export function subjectSelection(value: string, selection?: SubjectSelection): SubjectSelection {
  const clamp = (offset?: number) => offset !== undefined && Number.isFinite(offset) ? Math.max(0, Math.min(value.length, Math.trunc(offset))) : value.length
  const start = clamp(selection?.start), end = clamp(selection?.end)
  return { start: Math.min(start, end), end: Math.max(start, end) }
}

/** Insert at the remembered caret (or append); structural tools wrap a selection. */
export function insertSubjectTool(value: string, item: SubjectTool, selection?: SubjectSelection): SubjectEdit {
  const { start, end } = subjectSelection(value, selection)
  const content = item.placeholder ? value.slice(start, end) || item.placeholder : ""
  const inserted = item.before + content + item.after
  const contentStart = start + item.before.length
  return {
    value: value.slice(0, start) + inserted + value.slice(end),
    selection: content ? { start: contentStart, end: contentStart + content.length } : { start: start + inserted.length, end: start + inserted.length },
  }
}

export function subjectChangeIntent(target: SubjectEditorTarget, edit: SubjectEdit): AgentSubjectEditorIntent {
  return { ...target, type: "change", value: edit.value }
}

export type SubjectHistory = { past: readonly SubjectEdit[]; present: SubjectEdit; future: readonly SubjectEdit[] }
export function createSubjectHistory(value: string): SubjectHistory {
  return { past: [], present: { value, selection: subjectSelection(value) }, future: [] }
}
export function recordSubjectEdit(history: SubjectHistory, next: SubjectEdit, selection?: SubjectSelection): SubjectHistory {
  if (next.value === history.present.value) return history
  return {
    past: [...history.past, { value: history.present.value, selection: subjectSelection(history.present.value, selection ?? history.present.selection) }],
    present: { value: next.value, selection: subjectSelection(next.value, next.selection) }, future: [],
  }
}
export function stepSubjectHistory(history: SubjectHistory, direction: "undo" | "redo"): SubjectHistory {
  if (direction === "undo") {
    const previous = history.past.at(-1)
    return previous ? { past: history.past.slice(0, -1), present: previous, future: [history.present, ...history.future] } : history
  }
  const next = history.future[0]
  return next ? { past: [...history.past, history.present], present: next, future: history.future.slice(1) } : history
}

export type SubjectHistorySession = { scope: string; history: SubjectHistory; pending?: SubjectHistory }
/** A request is not an accepted edit. Adopt it only when the controlled value matches. */
export function reconcileSubjectHistory(session: SubjectHistorySession, scope: string, value: string): SubjectHistorySession {
  if (scope !== session.scope) return { scope, history: createSubjectHistory(value) }
  if (session.pending?.present.value === value) return { scope, history: session.pending }
  if (session.history.present.value === value) return session
  return { scope, history: createSubjectHistory(value) }
}
