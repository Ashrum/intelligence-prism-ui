export type Stage = "evaluation" | "diagnosis" | "goals" | "learning-plan"
export const stageLabels: Record<Stage, string> = { evaluation: "评价", diagnosis: "诊断", goals: "目标规划", "learning-plan": "学习计划" }
export type DiagnosisId = "quantity" | "domain"
export const evidenceDefinitions = [
  { id: "quantity" as const, title: "总量与增量的辨析", partId: "2", criterionId: "fill", observed: "题目问总水量，作答计算了 V(3) − V(0)，填写 27 L。", hypothesis: "本次作答可能混淆了总量与增量，需要通过变量解释再次确认。", criterion: "说明变量代表总量还是增量，列式并解释初始量的作用。", baseline: "第 2 问总水量评分点初评 0 / 4。", curriculum: "函数应用 · 数量含义（任务描述）" },
  { id: "domain" as const, title: "解集与实际定义域", partId: "3", criterionId: "domain", observed: "不等式解得 4 ≤ t ≤ 8，未与题设 0 ≤ t ≤ 6 取交集。", hypothesis: "本次作答遗漏情境范围检查，需要通过新情境验证。", criterion: "写出实际定义域，将代数解集与定义域取交集并解释结果。", baseline: "第 3 问定义域评分点初评 0 / 2。", curriculum: "函数 → 定义域", knowledgeId: "math-1:knowledge:k211" },
]
export type ReviewSnapshot = { version: number; learnerId: string; questionId: string; questionVersion: string; attemptId: string; rubricVersion: string; scores: Record<string, number>; reason: string }
export type Diagnosis = { id: DiagnosisId; decision: "pending" | "confirmed" | "rejected"; sourceVersion: number | null; revision: number; note: string }
export type Goal = { id: string; sourceIds: DiagnosisId[]; sourceVersion: number; sourceRevisions: Partial<Record<DiagnosisId, number>>; title: string; criteria: { id: DiagnosisId; text: string }[]; due: string; mode: "draft" | "active" | "paused"; version: number }
export type Task = { id: string; goalId: string; title: string; minutes: number; date: string; status: "pending" | "running" | "done" | "skipped"; note: string; resource: "review" | "practice" | "verification"; condition: string }
export type Verification = { id: string; goalId: string; goalVersion: number; attemptId: string; results: Partial<Record<DiagnosisId, "pass" | "retry">>; note: string }
export type LearningState = { reviews: ReviewSnapshot[]; diagnoses: Diagnosis[]; goals: Goal[]; tasks: Task[]; verifications: Verification[]; audit: { goalId: string; message: string }[]; message: string }
export function createLearningState(): LearningState {
  return { reviews: [], diagnoses: evidenceDefinitions.map(item => ({ id: item.id, decision: "pending", sourceVersion: null, revision: 0, note: item.hypothesis })), goals: [], tasks: [], verifications: [], audit: [], message: "请先检查初评分并确认评价，再处理诊断候选。" }
}
export function latestReview(state: LearningState) { return state.reviews.at(-1) }
export function diagnosisValid(state: LearningState, item: Diagnosis) { return item.decision === "confirmed" && !!latestReview(state) && item.sourceVersion === latestReview(state)!.version }
export function goalSourceValid(state: LearningState, goal: Goal) { return goal.sourceVersion === latestReview(state)?.version && goal.sourceIds.every(id => state.diagnoses.some(item => item.id === id && item.revision === goal.sourceRevisions[id] && diagnosisValid(state, item))) }
export function currentVerifications(state: LearningState, goal: Goal) {
  const latest = new Map<string, Verification>()
  for (const check of state.verifications.filter(item => item.goalId === goal.id)) latest.set(check.attemptId, check)
  return [...latest.values()].filter(item => item.goalVersion === goal.version)
}
export function goalPasses(state: LearningState, goal: Goal) { return currentVerifications(state, goal).filter(item => goal.criteria.every(criterion => item.results[criterion.id] === "pass")).length }
export function goalStatus(state: LearningState, goal: Goal) {
  if (!goalSourceValid(state, goal)) return "来源需复核"
  if (goal.mode === "draft") return "草稿"
  if (goal.mode === "paused") return "已暂停"
  if (goalPasses(state, goal) >= 2) return "已达成"
  return state.audit.some(item => item.goalId === goal.id) ? "需重新验证" : "待验证"
}
export type LearningAction =
  | { type: "review"; scores: Record<string, number>; reason: string }
  | { type: "diagnosis"; id: DiagnosisId; decision: Diagnosis["decision"]; note: string }
  | { type: "create-goal"; due: string }
  | { type: "save-goal"; goal: Goal }
  | { type: "goal-mode"; id: string; mode: Goal["mode"] }
  | { type: "reconfirm-goal"; id: string }
  | { type: "create-plan"; id: string; dates: string[] }
  | { type: "save-task"; task: Task }
  | { type: "add-task"; id: string; date: string }
  | { type: "move-task"; id: string; offset: number }
  | { type: "verify"; check: Omit<Verification, "id"> }
  | { type: "reset" }
const scoreLimits: Record<string, number> = { choice: 4, fill: 4, inequality: 2, solve: 2, domain: 2, maximum: 2 }
export function taskSaveError(state: LearningState, task: Task) {
  const old = state.tasks.find(item => item.id === task.id)
  const goal = state.goals.find(item => item.id === task.goalId)
  if (!old || !goal || old.goalId !== task.goalId) return "任务来源不存在，请重新打开任务。"
  if (old.status !== task.status && (goal.mode !== "active" || !goalSourceValid(state, goal))) return "目标暂停或来源需复核，暂不能改变任务状态。草稿已保留，请处理目标后继续保存。"
  if (!task.title.trim() || !task.condition.trim() || !task.date || !Number.isInteger(task.minutes) || task.minutes < 1 || task.minutes > 240 || (task.status === "skipped" && !task.note.trim())) return "请完善任务与日期；时长为 1–240 分钟，跳过任务需要说明理由。"
  return ""
}
export function learningReducer(state: LearningState, action: LearningAction): LearningState {
  const fail = (message: string) => ({ ...state, message })
  switch (action.type) {
    case "reset": return createLearningState()
    case "review": {
      const previous = latestReview(state)
      if (Object.keys(scoreLimits).some(id => !Number.isFinite(action.scores[id]) || action.scores[id] < 0 || action.scores[id] > scoreLimits[id] || !Number.isInteger(action.scores[id] * 2))) return fail("评分不完整或超出评分点范围。")
      const same = previous && Object.keys(scoreLimits).every(id => previous.scores[id] === action.scores[id])
      if (previous && !same && !action.reason.trim()) return fail("调整评分后，请填写复核理由。")
      if (same && (!action.reason.trim() || action.reason.trim() === previous.reason)) return fail("评价没有改变，继续使用当前确认版本。")
      const version = (previous?.version ?? 0) + 1
      return { ...state, reviews: [...state.reviews, { version, learnerId: "DEMO-001", questionId: "Q-M-006", questionVersion: "1", attemptId: "DEMO-A", rubricVersion: "1", scores: { ...action.scores }, reason: action.reason.trim() || "逐项复核，维持初评分。" }], message: `评价 v${version} 已确认。${previous ? "既有诊断与目标保留，请复核其来源变化。" : "可以开始复核两个诊断候选。"}` }
    }
    case "diagnosis": {
      const review = latestReview(state)
      if (!review) return fail("请先确认评价，诊断需要明确的作答与评分来源。")
      if (!action.note.trim()) return fail("请填写诊断判断依据。")
      return { ...state, diagnoses: state.diagnoses.map(item => item.id === action.id ? { ...item, decision: action.decision, sourceVersion: review.version, note: action.note.trim(), revision: item.revision + (item.decision !== action.decision || item.sourceVersion !== review.version || item.note !== action.note.trim() ? 1 : 0) } : item), message: action.decision === "confirmed" ? "已确认本次作答的诊断判断。" : action.decision === "rejected" ? "已排除此候选；关联目标和任务保留，来源标记为需复核。" : "已恢复为待复核候选。" }
    }
    case "create-goal": {
      const sourceIds = state.diagnoses.filter(item => diagnosisValid(state, item)).map(item => item.id)
      if (!sourceIds.length) return fail("至少确认一个当前评价的诊断后，才能创建目标草稿。")
      if (state.goals.some(goal => goal.sourceIds.join() === sourceIds.join())) return fail("这些诊断已有目标，保留人工修改，不重复创建。")
      const goal: Goal = { id: `G-${state.goals.length + 1}`, sourceIds, sourceVersion: latestReview(state)!.version, sourceRevisions: Object.fromEntries(state.diagnoses.filter(d => sourceIds.includes(d.id)).map(d => [d.id, d.revision])), title: sourceIds.length === 2 ? "在函数情境中解释数量，并核对实际取值范围" : sourceIds[0] === "domain" ? "在函数应用中正确处理实际定义域" : "在函数应用中区分总量与增量", criteria: evidenceDefinitions.filter(item => sourceIds.includes(item.id)).map(item => ({ id: item.id, text: item.criterion })), due: action.due, mode: "draft", version: 1 }
      return { ...state, goals: [...state.goals, goal], message: `已创建 ${goal.id} 草稿，请检查标准和截止日期后启用。` }
    }
    case "save-goal": {
      if (!action.goal.title.trim() || !action.goal.due || action.goal.criteria.some(item => !item.text.trim())) return fail("请填写目标、达成标准和截止日期。")
      const old = state.goals.find(item => item.id === action.goal.id)
      if (!old) return state
      const changed = JSON.stringify(old.criteria) !== JSON.stringify(action.goal.criteria)
      return { ...state, goals: state.goals.map(item => item.id === old.id ? { ...item, title: action.goal.title.trim(), due: action.goal.due, criteria: action.goal.criteria.map(c => ({ ...c, text: c.text.trim() })), version: item.version + (changed ? 1 : 0) } : item), message: changed ? "目标标准已更新，旧验证记录保留，需要按新标准重新验证。" : "目标修改已保存。" }
    }
    case "goal-mode": {
      const goal = state.goals.find(item => item.id === action.id)
      if (!goal || (action.mode === "active" && !goalSourceValid(state, goal))) return fail("请先复核目标来源。")
      return { ...state, goals: state.goals.map(item => item.id === action.id ? { ...item, mode: action.mode } : item), message: action.mode === "active" ? "目标已启用，可以安排学习任务。" : "目标已暂停，任务与验证记录保留。" }
    }
    case "reconfirm-goal": {
      const goal = state.goals.find(item => item.id === action.id)
      if (!goal || !goal.sourceIds.every(id => state.diagnoses.some(item => item.id === id && diagnosisValid(state, item)))) return fail("目标引用的诊断尚未全部按当前评价确认；请先处理诊断。")
      if (goalSourceValid(state, goal)) return fail("目标来源已经是当前版本。")
      return { ...state, goals: state.goals.map(item => item.id === goal.id ? { ...item, sourceVersion: latestReview(state)!.version, sourceRevisions: Object.fromEntries(state.diagnoses.filter(d => item.sourceIds.includes(d.id)).map(d => [d.id, d.revision])), version: item.version + 1 } : item), message: "已人工确认目标仍适用；学习任务保留，达成情况需要重新验证。" }
    }
    case "create-plan": {
      const goal = state.goals.find(item => item.id === action.id)
      if (!goal || goal.mode !== "active" || !goalSourceValid(state, goal)) return fail("启用目标并确认来源后，才能创建计划。")
      if (state.tasks.some(item => item.goalId === goal.id)) return fail("该目标已有学习计划，保留现有任务，不重复生成。")
      const tasks: Task[] = [
        { id: `${goal.id}-T1`, goalId: goal.id, title: "回看作答，解释错误发生在哪里", minutes: 10, date: action.dates[0], status: "pending", note: "", resource: "review", condition: "逐条说明目标对应的作答证据，并完成订正。" },
        { id: `${goal.id}-T2`, goalId: goal.id, title: "完成函数情境迁移练习", minutes: 15, date: action.dates[1], status: "pending", note: "", resource: "practice", condition: "独立完成新情境题，保留列式、变量解释与取值范围。" },
        { id: `${goal.id}-T3`, goalId: goal.id, title: "用两份新作答核验目标", minutes: 20, date: action.dates[2], status: "pending", note: "", resource: "verification", condition: "按目标标准逐项复核两次独立作答并记录依据。" },
      ]
      return { ...state, tasks: [...state.tasks, ...tasks], message: "已生成 3 项可调整的学习任务，共 45 分钟。完成任务后仍需验证目标。" }
    }
    case "save-task": {
      const task = action.task
      const error = taskSaveError(state, task)
      if (error) return fail(error)
      return { ...state, tasks: state.tasks.map(item => item.id === task.id ? { ...task } : item), message: task.status === "done" ? "任务已完成；目标是否达成由新作答的核验结果决定。" : "任务修改已保存。" }
    }
    case "add-task": {
      const goal = state.goals.find(item => item.id === action.id)
      if (!goal || goal.mode !== "active" || !goalSourceValid(state, goal)) return fail("请先启用目标并复核来源。")
      const task: Task = { id: `${goal.id}-T${state.tasks.filter(item => item.goalId === goal.id).length + 1}`, goalId: goal.id, title: "补充巩固与订正", minutes: 15, date: action.date, status: "pending", note: "", resource: "review", condition: "回看目标对应证据，说明订正理由。" }
      return { ...state, tasks: [...state.tasks, task], message: "已添加任务，可继续编辑内容、时长和日期。" }
    }
    case "move-task": {
      const from = state.tasks.findIndex(item => item.id === action.id), to = from + action.offset
      if (from < 0 || to < 0 || to >= state.tasks.length || state.tasks[from].goalId !== state.tasks[to].goalId) return state
      const tasks = [...state.tasks]; const [task] = tasks.splice(from, 1); tasks.splice(to, 0, task)
      return { ...state, tasks, message: "任务顺序已调整。" }
    }
    case "verify": {
      const goal = state.goals.find(item => item.id === action.check.goalId)
      if (!goal || goal.mode !== "active" || !goalSourceValid(state, goal)) return fail("目标来源需复核或尚未启用，不能确认达成。")
      if (!["DEMO-B", "DEMO-C"].includes(action.check.attemptId) || !action.check.note.trim() || action.check.goalVersion !== goal.version || goal.criteria.some(item => !["pass", "retry"].includes(action.check.results[item.id] ?? ""))) return fail("请选择新作答，完成每项标准的判断并填写核验依据。")
      const next: LearningState = { ...state, verifications: [...state.verifications, { ...action.check, results: { ...action.check.results }, id: `V-${state.verifications.length + 1}` }], message: "核验记录已保存；同一次作答只采用最新记录，不重复计数。" }
      if (goalStatus(next, goal) === "已达成" && goalStatus(state, goal) !== "已达成") next.audit = [...state.audit, { goalId: goal.id, message: `${goal.id} · 标准 v${goal.version} 曾达到两份新作答均通过（记录 V-${next.verifications.length}）。` }]
      return next
    }
  }
}
