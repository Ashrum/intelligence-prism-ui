import { createLearningState, learningReducer, goalSourceValid, currentVerifications, type LearningState, type Goal } from "./learning-workflow.ts"
import { initialReviewScores } from "./fixtures/review.ts"

/** Isolated, explicitly prefilled demonstration. Never replaces the shared workflow. */
export function createVisualLearningState(): LearningState {
  let state = learningReducer(createLearningState(), { type: "review", scores: initialReviewScores, reason: "独立预置示例：维持初评分。" })
  for (const id of ["quantity", "domain"] as const) state = learningReducer(state, { type: "diagnosis", id, decision: "confirmed", note: "独立预置示例：对照本次作答确认遗漏，后续仍需新情境验证。" })
  state = learningReducer(state, { type: "create-goal", due: "2026-09-20" })
  state = learningReducer(state, { type: "goal-mode", id: "G-1", mode: "active" })
  state = learningReducer(state, { type: "create-plan", id: "G-1", dates: ["2026-09-14", "2026-09-16", "2026-09-16"] })
  state = learningReducer(state, { type: "save-task", task: { ...state.tasks[0], status: "done" } })
  state = learningReducer(state, { type: "save-task", task: { ...state.tasks[1], minutes: 30, status: "running" } })
  state = learningReducer(state, { type: "save-task", task: { ...state.tasks[2], minutes: 25 } })
  state = learningReducer(state, { type: "add-task", id: "G-1", date: "2026-09-18" })
  state = learningReducer(state, { type: "add-task", id: "G-1", date: "2026-09-20" })
  state = learningReducer(state, { type: "save-task", task: { ...state.tasks[4], status: "skipped", note: "预置示例：与前一项订正重复，已跳过。" } })
  state = learningReducer(state, { type: "verify", check: { goalId: "G-1", goalVersion: 1, attemptId: "DEMO-B", results: { quantity: "pass", domain: "pass" }, note: "预置核验示例：区分总量 54 与增量 24，并将时间范围限定为 4–5 小时。" } })
  return { ...state, message: "" }
}

export function dailyWorkload(state: LearningState, date: string) {
  const tasks = state.tasks.filter(task => task.date === date)
  const open = tasks.filter(task => task.status === "pending" || task.status === "running")
  const ready = open.filter(task => { const goal = state.goals.find(goal => goal.id === task.goalId); return goal && goal.mode === "active" && goalSourceValid(state, goal) })
  return { tasks, planned: tasks.filter(task => task.status !== "skipped").reduce((n, task) => n + task.minutes, 0), remaining: ready.reduce((n, task) => n + task.minutes, 0), blocked: open.length - ready.length, done: tasks.filter(task => task.status === "done").length, skipped: tasks.filter(task => task.status === "skipped").length }
}
export function goalMilestones(state: LearningState, goal: Goal) {
  const valid = goalSourceValid(state, goal)
  const checks = currentVerifications(state, goal)
  return [
    { id: "source", title: "来源与标准", state: valid ? "met" : "blocked", detail: valid ? `评价 v${goal.sourceVersion} · 标准 v${goal.version}` : "评价或诊断有变化，请重新复核" },
    { id: "active", title: "启用目标", state: !valid ? "blocked" : goal.mode === "active" ? "met" : "pending", detail: goal.mode === "active" ? "目标已启用" : goal.mode === "paused" ? "已暂停，保留原核验记录" : "草稿尚未启用" },
    ...["DEMO-B", "DEMO-C"].map(id => {
      const check = checks.find(check => check.attemptId === id)
      const pass = check && goal.criteria.every(item => check.results[item.id] === "pass")
      return { id, title: id === "DEMO-B" ? "独立作答一" : "独立作答二", state: !valid ? "blocked" : pass ? "met" : check ? "retry" : "pending", detail: !valid ? "来源变化，原记录不计入当前达成" : pass ? `${id} · 全部标准满足` : check ? `${id} · 有标准尚未满足` : `${id} · 等待人工核验` }
    }),
  ]
}

export type ScanRegion = { id: string; page: number; question: string; kind: "recognition" | "scoring" | "blank"; title: string; text: string; expected: string; rect: [number, number, number, number] }
export const scanRegions: ScanRegion[] = [
  { id: "SYN-SCAN-1", page: 1, question: "1", kind: "recognition", title: "识别文本待确认", text: "选择 B（示例识别结果为 8）", expected: "核对字母 B 与数字 8，修正录入文本。", rect: [8, 23, 84, 17] },
  { id: "SYN-SCAN-2", page: 1, question: "2", kind: "scoring", title: "评分依据待复核", text: "V(3) − V(0) = 27 L", expected: "题目要求总水量，需区分总量与增量；定位确认不改变评分。", rect: [8, 48, 84, 25] },
  { id: "SYN-SCAN-3", page: 2, question: "3（1）", kind: "scoring", title: "实际定义域待核对", text: "4 ≤ t ≤ 8", expected: "核对是否与题设 0 ≤ t ≤ 6 取交集；定位确认不代表得分。", rect: [8, 23, 84, 22] },
  { id: "SYN-SCAN-4", page: 2, question: "3（2）", kind: "blank", title: "作答区域为空", text: "", expected: "先核对是否另页作答或漏扫；空白不能直接视为零分。", rect: [8, 54, 84, 25] },
]
export type ScanDecision = { text: string; note: string; outcome: "checked" | "rescan" }
export function scanDecisionError(region: ScanRegion, decision: ScanDecision) {
  if (!decision.note.trim()) return "请记录核对依据。"
  if (region.kind === "recognition" && decision.outcome === "checked" && !decision.text.trim()) return "请填写核对后的识别文本。"
  return ""
}
