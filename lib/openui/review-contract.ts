// Version 1 is deliberately a closed, display-only subset of OpenUI Lang.
// This gate runs before the parser/renderer: prompt settings are not a security boundary.
export const evidence = [
  { id: "E1", title: "方程建模", value: "18 / 22", unit: "次正确", source: "近三周课堂作答 · 示例数据", detail: "当前样本中有 18 次正确作答；缺少可比的前期样本，不能据此确认能力持续提升。" },
  { id: "E2", title: "几何证明", value: "8", unit: "份作答", source: "本周作业 · 示例数据", detail: "其中 2 份存在 OCR 边界异常，需核对原始作答；当前样本不足以推断整体能力变化。" },
] as const

export const limitations = "样本范围有限，且有 2 份作答需要核对。以下内容只用于交互试点，不形成正式教学结论。"
export const tasks = [
  { value: "explain", label: "解释结论", order: ["summary", "evidence", "limits"], text: "方程建模在当前样本中有较多正确作答。几何证明样本较少，且存在识别异常，建议先核对原始作答，再判断表现。" },
  { value: "evidence", label: "核对依据", order: ["evidence", "limits", "summary"], text: "先核对方程建模的作答记录，再检查几何证明中的识别异常。当前证据可说明本次表现，不能直接说明整体能力变化。" },
  { value: "limits", label: "查看局限", order: ["limits", "evidence", "summary"], text: "当前结论受到样本范围与识别异常的限制。补充可比样本、核对原始作答后，再决定是否调整教学判断。" },
] as const
export type Task = typeof tasks[number]["value"]
export type Block = "summary" | "evidence" | "limits"
export type CheckedReview = { response: string; text: string; order: Block[] }

export function fixedResponse(task: Task): string {
  const sample = tasks.find(item => item.value === task)!
  return `root = ReviewLayout([${sample.order.join(", ")}])\nsummary = Candidate(${JSON.stringify(sample.text)}, ["E1", "E2"])\nevidence = Evidence(["E1", "E2"])\nlimits = Limits()`
}

export function validateReview(input: unknown): CheckedReview {
  if (typeof input !== "string" || input.length > 6000) throw new Error("Invalid response size")
  const lines = input.trim().split(/\r?\n/).map(line => line.trim())
  if (lines.length !== 4) throw new Error("Expected exactly four statements")
  const layout = /^root\s*=\s*ReviewLayout\(\[\s*(summary|evidence|limits)\s*,\s*(summary|evidence|limits)\s*,\s*(summary|evidence|limits)\s*\]\)$/.exec(lines[0])
  if (!layout || new Set(layout.slice(1)).size !== 3) throw new Error("Required blocks missing or duplicated")
  // Only a JSON string is accepted, never a Lang expression, action, binding or URL.
  const candidate = /^summary\s*=\s*Candidate\(("(?:[^"\\\x00-\x1f]|\\(?:["\\/bfnrt]|u[0-9a-fA-F]{4}))*")\s*,\s*\[\s*"E1"\s*,\s*"E2"\s*\]\)$/.exec(lines[1])
  if (!candidate) throw new Error("Invalid candidate or missing citations")
  const text = JSON.parse(candidate[1]) as string
  if (!text.trim() || text.length > 800 || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(text)) throw new Error("Invalid candidate text")
  if (!/^evidence\s*=\s*Evidence\(\[\s*"E1"\s*,\s*"E2"\s*\]\)$/.test(lines[2]) || !/^limits\s*=\s*Limits\(\)$/.test(lines[3])) throw new Error("Authoritative evidence changed")
  return { response: lines.join("\n"), text, order: layout.slice(1) as Block[] }
}

export type ReviewRecord = { text: string; reviewed: boolean; source: "sample" | "model"; edited: boolean }
export type ReviewState = { record: ReviewRecord; draft: string; draftSource: "sample" | "model"; draftEdited: boolean; previous: ReviewRecord | null }
export type ReviewAction = { type: "edit"; text: string } | { type: "apply" } | { type: "review" } | { type: "undo" } | { type: "discard" } | { type: "candidate"; text: string; source: "sample" | "model" }
export function initialReview(): ReviewState {
  return { record: { text: tasks[0].text, reviewed: false, source: "sample", edited: false }, draft: tasks[0].text, draftSource: "sample", draftEdited: false, previous: null }
}
export function reviewReducer(state: ReviewState, action: ReviewAction): ReviewState {
  switch (action.type) {
    case "edit": return { ...state, draft: action.text, draftEdited: true }
    case "candidate": return state.draft !== state.record.text ? state : { ...state, draft: action.text, draftSource: action.source, draftEdited: false }
    case "discard": return { ...state, draft: state.record.text, draftSource: state.record.source, draftEdited: state.record.edited }
    case "apply": {
      const text = state.draft.trim()
      if (!text || text === state.record.text) return { ...state, draft: text || state.draft }
      return { ...state, record: { text, reviewed: false, source: state.draftSource, edited: state.draftEdited }, draft: text, previous: state.record }
    }
    case "review": return state.draft !== state.record.text ? state : { ...state, record: { ...state.record, reviewed: !state.record.reviewed } }
    case "undo": return !state.previous || state.draft !== state.record.text ? state : { record: state.previous, draft: state.previous.text, draftSource: state.previous.source, draftEdited: state.previous.edited, previous: null }
  }
}
