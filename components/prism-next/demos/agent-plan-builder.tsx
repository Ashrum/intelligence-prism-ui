"use client"

import { useId, useRef, useState } from "react"
import { Label } from "@/components/coss/label"
import { Button } from "../button"
import { QuestionSelect } from "../question-controls"
import { RootFormula } from "../math-content"
import { AgentPlanBuilder, type AgentPlan, type AgentPlanActions, type AgentPlanBuilderProps, type AgentPlanIntent, type AgentPlanSave, type AgentPlanStep, type AgentPlanValidation } from "../agent-plan-builder"

const classGroup = { id: "class-2-3", label: "高二三班" }
const revisionGroup = { id: "revision-group", label: "函数复习小组" }
const teacher = { id: "teacher-lin", label: "林老师" }
const resource = { id: "worked-examples", label: "二次函数讲评资料" }
const source = { suggestionId: "accepted-correction", versionId: "suggestion-v1", label: "已采纳建议：先订正，再收集再练证据（固定示例）" }
const actions: AgentPlanActions = { "step-add": {}, "step-edit": {}, "step-remove": {}, "step-move": {}, assign: {}, "attach-resource": {}, "confirm-core": {}, "request-create-tasks": {}, "open-source": {} }
const baseStep = (id: string, title: string, startDate: string, endDate = startDate): AgentPlanStep => ({
  id, title, description: "先核对具体作答，再调整后续安排。", owner: teacher, audience: [classGroup], startDate, endDate,
  timeWindow: "课后 15 分钟", resources: [resource], dependencies: [], source, status: { state: "draft" },
})
export type PlanExampleState = { plan: AgentPlan; steps: readonly AgentPlanStep[]; editor?: AgentPlanBuilderProps["editor"]; revision: number }
export const planExamples: Record<"teaching" | "revision", PlanExampleState> = {
  teaching: {
    revision: 1,
    plan: { id: "teaching-example", title: "讲评后两周教学行动计划（示例）", kind: "teaching", version: { id: "plan-v1", label: "示例草稿 1" }, baseVersion: { id: "baseline-v1", label: "建议采纳时版本" },
      goal: "围绕二次函数的对称轴、零点与判别式，先核对不同解法的依据，再安排分组订正与再练，并在两周后回看新的作答证据。",
      audience: [classGroup], startDate: "2026-09-28", endDate: "2026-10-11", sources: [source], core: "draft", tasks: "partial", execution: "not-started" },
    steps: [
      { ...baseStep("correction", "整理典型错因并核对求根公式的适用条件", "2026-09-28"), status: { state: "confirmed" }, content: <RootFormula /> },
      { ...baseStep("group-practice", "组织分组订正：结合图像与代数表达，说明解题依据并保留需要再次核对的问题", "2026-09-28"), owner: null, dependencies: [{ id: "correction", label: "步骤 1 · 错因核对" }] },
      { ...baseStep("new-practice", "准备后续纸质再练", "2026-10-02"), status: { state: "task-created" }, disabledReason: "此步骤已有任务记录，请在原任务中调整。", dependencies: [{ id: "group-practice", label: "步骤 2 · 分组订正" }] },
      { ...baseStep("review", "回看两周证据并形成下一轮教学安排", "2026-10-09", "2026-10-11"), status: { state: "blocked", reason: "再练资料暂不可用，需先补齐资料。" }, resources: [{ id: "missing-material", label: "待补齐的再练资料" }], dependencies: [{ id: "new-practice", label: "步骤 3 · 后续再练" }] },
    ],
  },
  revision: {
    revision: 1,
    plan: { id: "revision-example", title: "学生函数复习计划（示例）", kind: "revision", version: { id: "plan-v1", label: "示例草稿 1" }, baseVersion: { id: "baseline-v1", label: "目标确认时版本" }, goal: "区分配方法与求根公式的适用条件，每次复习保留一道待讨论的问题。", audience: [revisionGroup], startDate: "2026-09-28", endDate: "2026-10-04", sources: null, core: "draft", tasks: "not-created", execution: "not-started" },
    steps: [
      { ...baseStep("recall", "回顾概念与公式", "2026-09-28"), owner: { id: "student", label: "小组成员自行负责" }, audience: [revisionGroup], source: null, resources: [], description: "核对 a ≠ 0 与判别式条件，再完成练习。", content: <RootFormula /> },
      { ...baseStep("practice", "比较两种解法并解释中间步骤", "2026-09-30"), owner: null, audience: [revisionGroup], source: null, status: { state: "unknown" }, dependencies: [{ id: "recall", label: "步骤 1 · 概念回顾" }] },
      { ...baseStep("reflect", "记录本周复习中已解决与尚未解决的问题", "2026-10-04"), owner: teacher, audience: [revisionGroup], source: null, status: { state: "completed" }, description: "此完成状态为独立载入的固定记录，不由列表操作产生。" },
    ],
  },
}

/** Example page only: no Store, save service, schedule engine or task creation. */
export function applyPlanExample(state: PlanExampleState, intent: AgentPlanIntent): PlanExampleState {
  if (intent.planId !== state.plan.id || intent.versionId !== state.plan.version.id || intent.baseVersionId !== state.plan.baseVersion?.id) return state
  if (intent.type === "open-source" || intent.type === "confirm-core" || intent.type === "request-create-tasks") return state
  if (intent.type === "step-add" || intent.type === "step-edit") {
    const stepId = intent.type === "step-edit" ? intent.stepId : null
    if (intent.phase === "start" || intent.phase === "change") return { ...state, editor: { stepId, values: { ...intent.values } } }
    if (intent.phase === "cancel") return { ...state, editor: { stepId, values: { ...intent.values }, open: false } }
  }
  let steps = [...state.steps]
  if (intent.type === "step-add") steps.push({ ...baseStep(`example-step-${state.revision + 1}`, intent.values.title, intent.values.startDate, intent.values.endDate), ...intent.values, owner: null, audience: [], resources: [], source: null })
  if (intent.type === "step-edit") steps = steps.map(step => step.id === intent.stepId ? { ...step, ...intent.values } : step)
  if (intent.type === "step-remove") steps = steps.filter(step => step.id !== intent.stepId)
  if (intent.type === "step-move") { const step = steps.find(item => item.id === intent.stepId); if (!step) return state; steps = steps.filter(item => item.id !== intent.stepId); steps.splice(intent.toIndex, 0, step) }
  if (intent.type === "assign") steps = steps.map(step => step.id === intent.stepId ? { ...step, ...(intent.role === "owner" ? { owner: intent.references[0] ?? null } : { audience: intent.references }) } : step)
  if (intent.type === "attach-resource") steps = steps.map(step => step.id === intent.stepId ? { ...step, resources: [...(step.resources ?? []), intent.resource] } : step)
  const revision = state.revision + 1
  return { ...state, steps, editor: intent.type === "step-add" || intent.type === "step-edit" ? undefined : state.editor, revision,
    plan: { ...state.plan, core: "draft", version: { id: `plan-v${revision}`, label: `示例草稿 ${revision}` } } }
}

export function PlanBuilderExample({ purpose, narrow = false }: { purpose: keyof typeof planExamples; narrow?: boolean }) {
  const [state, setState] = useState(planExamples[purpose]), [save, setSave] = useState<AgentPlanSave["state"]>("unsaved")
  const [readOnly, setReadOnly] = useState(false), [checksLoaded, setChecksLoaded] = useState(true)
  const [feedback, setFeedback] = useState("固定示例；编辑只保留在本页，未连接保存或任务服务。")
  const id = useId(), workspace = useRef<HTMLElement>(null), trigger = useRef<HTMLButtonElement | null>(null)
  const validation: AgentPlanValidation[] = purpose === "teaching" && checksLoaded ? [
    { kind: "date-conflict", level: "error", message: "错因核对与分组订正安排在同一课后时段。", stepIds: ["correction", "group-practice"] },
    { kind: "overload", level: "warning", message: "9 月 28 日安排 45 分钟，超过本次参考容量 30 分钟。" },
    { kind: "resource-unavailable", level: "error", message: "再练资料暂不可用，需先补齐资料。", stepIds: ["review"] },
  ] : []
  function receive(intent: AgentPlanIntent) {
    if (intent.planId !== state.plan.id || intent.versionId !== state.plan.version.id || intent.baseVersionId !== state.plan.baseVersion?.id) return
    if (intent.type === "open-source") { setFeedback("已收到查看建议来源请求；此处没有真实建议记录。"); return }
    if (intent.type === "confirm-core") { setFeedback("已收到核心确认请求，等待独立确认记录；当前状态未改变。"); return }
    if (intent.type === "request-create-tasks") { setFeedback("已收到创建任务确认请求；实际接入交给执行确认，此处未创建任务。"); return }
    setState(current => applyPlanExample(current, intent)); setSave("unsaved")
    setFeedback(intent.type === "step-add" || intent.type === "step-edit" ? "步骤输入仅在本页保留；提交调整不代表已保存。" : "本页草稿已调整，尚未保存；校验与任务记录未改变。")
  }
  const common: AgentPlanBuilderProps = {
    plan: state.plan, steps: state.steps, validation, editor: state.editor, actions, onIntent: receive,
    pendingItems: purpose === "teaching" ? ["分组订正负责人", "日期冲突与资料可用性"] : ["复习进度和负责人"],
    save: { state: save }, readOnlyReason: readOnly ? "此计划仅供核对。" : undefined,
    people: [teacher, { id: "student", label: "小组成员自行负责" }], audiences: [classGroup, revisionGroup],
    resources: [resource, { id: "formula", label: "公式条件核对单" }, { id: "missing-material", label: "待补齐的再练资料", disabledReason: "再练资料暂不可用，需先补齐资料。" }],
    createTaskStepIds: state.steps.filter(step => ["draft", "confirmed"].includes(step.status.state)).map(step => step.id),
    milestones: [{ id: "first-week", title: "第一周回看", state: "pending", detail: "10 月 4 日 · 核对本周订正记录；阶段尚未完成。" }, { id: "second-week", title: "第二周接续", state: "blocked", detail: "10 月 11 日 · 需补齐再练证据；阶段受阻。" }],
    calendar: { month: new Date(2026, 8, 1), selected: new Date(2026, 8, 28), unit: "分钟", capacity: 30,
      days: { "2026-09-28": { value: 45, overCapacity: true, label: "45 分钟（固定示例）" }, "2026-09-30": { value: 15, overCapacity: false }, "2026-10-04": { value: 15 } } },
    onExpand: button => { trigger.current = button; workspace.current?.focus({ preventScroll: true }); workspace.current?.scrollIntoView({ block: "nearest" }) },
    onBack: () => { trigger.current?.focus(); trigger.current?.scrollIntoView({ block: "nearest" }) },
    details: <p>时间线、工作量与校验是固定示例记录。修改步骤不会重算它们。步骤顺序可用上移、下移调整，依赖关系在路径与优先级中处理；收起编辑保留当前输入，再次编辑同一步骤可继续。</p>,
  }
  return <div className="min-w-0 space-y-5">
    <div className="flex flex-wrap items-end gap-3"><div className="space-y-2"><Label htmlFor={`${id}-save`}>独立保存记录示例</Label><QuestionSelect id={`${id}-save`} label="独立保存记录示例" value={save} onChange={value => setSave(value as AgentPlanSave["state"])} items={[
      { value: "unsaved", label: "未保存" }, { value: "saved-draft", label: "已保存草稿（示例）" }, { value: "saving", label: "保存中" }, { value: "conflict", label: "版本冲突" }, { value: "error", label: "保存失败" }, { value: "unconfirmed", label: "回执未确认" }, { value: "unknown", label: "未知" },
    ]} /></div><Button type="button" variant="outline" aria-pressed={readOnly} onClick={() => setReadOnly(value => !value)}>只读示例</Button>
      {purpose === "teaching" && <Button type="button" variant="outline" onClick={() => setChecksLoaded(value => !value)}>切换独立校验记录</Button>}
      <Button type="button" variant="outline" onClick={() => setState(current => ({ ...current, plan: { ...current.plan, core: "confirmed" } }))}>载入核心已确认示例</Button>
    </div>
    <p className="text-ui-hint">固定示例；以上按钮独立载入记录，不代表提交成功。任务和执行状态由各自记录决定。</p>
    <p role="status" className="text-ui-hint">{feedback}</p>
    {([["inline", "default", "对话中的核心步骤"], ["workspace", "default", "完整计划编排"], ["inline", "compact", "紧凑核心步骤"]] as const).map(([view, density, label]) => <section key={`${view}-${density}`} aria-label={label} tabIndex={view === "workspace" ? -1 : undefined} ref={view === "workspace" ? workspace : undefined} className={`min-w-0 space-y-3 ${narrow ? "w-full max-w-[320px]" : ""}`}>
      <h3 className="text-block-title">{label}</h3><AgentPlanBuilder {...common} view={view} density={density} />
    </section>)}
  </div>
}

export function AgentPlanBuilderDemo() {
  const [purpose, setPurpose] = useState<keyof typeof planExamples>("teaching"), [narrow, setNarrow] = useState(false)
  return <section id="plan-builder" className="mb-12 min-w-0 space-y-5"><h2 className="text-section-title">计划构建器 v0.1 · 设计候选</h2>
    <div className="flex flex-wrap gap-3">{(["teaching", "revision"] as const).map(value => <Button key={value} type="button" variant={purpose === value ? "secondary" : "outline"} aria-pressed={purpose === value} onClick={() => setPurpose(value)}>{value === "teaching" ? "两周教学行动示例" : "学生复习示例"}</Button>)}<Button type="button" variant="outline" aria-pressed={narrow} onClick={() => setNarrow(value => !value)}>320px 窄容器</Button></div>
    <PlanBuilderExample key={purpose} purpose={purpose} narrow={narrow} />
  </section>
}
