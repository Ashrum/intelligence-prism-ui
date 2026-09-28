"use client"

import { useId, type ReactNode } from "react"
import { Card } from "@/components/coss/card"
import { Input } from "@/components/coss/input"
import { Label } from "@/components/coss/label"
import { Textarea } from "@/components/coss/textarea"
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from "@/components/coss/select"
import { Badge } from "./badge"
import { Button } from "./button"
import { RecordDetails, type AgentRecordViewProps } from "./agent-record-parts"
import { LearningTaskList, MilestoneList, type MilestoneItem } from "./learning-components"

export type AgentPlanReference = { id: string; label: string }
export type AgentPlanChoice = AgentPlanReference & { disabledReason?: string }
export type AgentPlanSource = { suggestionId: string; versionId: string; label: string }
export type AgentPlanVersion = { id: string; label: string }
export type AgentPlan = {
  id: string; title: string; kind: "teaching" | "learning" | "revision" | "task"
  version: AgentPlanVersion; baseVersion?: AgentPlanVersion; snapshot?: string
  goal: string | null; audience: readonly AgentPlanReference[] | null
  startDate: string | null; endDate: string | null; sources: readonly AgentPlanSource[] | null
  core: "draft" | "confirmed" | "pending" | "unconfirmed" | "unknown"
  tasks: "not-created" | "partial" | "created" | "pending" | "unconfirmed" | "unknown"
  execution: "not-started" | "running" | "completed" | "blocked" | "unknown"
}
export type AgentPlanStepFields = { title: string; description: string; startDate: string; endDate: string; timeWindow: string }
export type AgentPlanStepStatus = { state: "draft" | "confirmed" | "task-created" | "running" | "completed" | "unknown" }
  | { state: "blocked"; reason: string }
export type AgentPlanStep = {
  id: string; title: string; description: string | null; content?: ReactNode
  owner: AgentPlanReference | null; audience: readonly AgentPlanReference[] | null
  startDate: string | null; endDate: string | null; timeWindow?: string | null
  resources: readonly AgentPlanReference[] | null; dependencies: readonly AgentPlanReference[] | null
  source?: AgentPlanSource | null; status: AgentPlanStepStatus; disabledReason?: string
}
export type AgentPlanValidation = {
  kind: "date-conflict" | "overload" | "resource-unavailable" | "other"
  level: "error" | "warning" | "hint"; message: string; stepIds?: readonly string[]
}
export type AgentPlanSave = { state: "unsaved" | "saving" | "saved-draft" | "submitted" | "conflict" | "error" | "unconfirmed" | "unknown"; description?: string }
type PlanAction = "step-add" | "step-edit" | "step-remove" | "step-move" | "assign" | "attach-resource" | "confirm-core" | "request-create-tasks" | "open-source"
export type AgentPlanActions = Partial<Record<PlanAction, { disabledReason?: string }>>
type PlanContext = { planId: string; versionId: string; baseVersionId: string }
type EditorPhase = "start" | "change" | "submit" | "cancel"
export type AgentPlanIntent = PlanContext & (
  | { type: "step-add"; phase: EditorPhase; values: AgentPlanStepFields }
  | { type: "step-edit"; stepId: string; phase: EditorPhase; values: AgentPlanStepFields }
  | { type: "step-remove"; stepId: string }
  | { type: "step-move"; stepId: string; toIndex: number; via: "up" | "down" }
  | { type: "assign"; stepId: string; role: "owner" | "audience"; references: AgentPlanReference[] }
  | { type: "attach-resource"; stepId: string; resource: AgentPlanReference }
  | { type: "confirm-core"; stepIds: string[] }
  | { type: "request-create-tasks"; stepIds: string[] }
  | { type: "open-source"; source: AgentPlanSource }
)
/** Optional page-owned calendar content; calendar data/rendering now live in the page. */
export type AgentPlanCalendar = ReactNode
export type AgentPlanBuilderProps = AgentRecordViewProps & {
  plan: AgentPlan; steps: readonly AgentPlanStep[]; validation: readonly AgentPlanValidation[]
  pendingItems: readonly string[] | null; save?: AgentPlanSave; actions?: AgentPlanActions
  /** The page owns this buffer and preserves it across views and version changes. */
  editor?: { stepId: string | null; values: AgentPlanStepFields; open?: boolean; readOnlyFields?: Partial<Record<keyof AgentPlanStepFields, string>> }
  people?: readonly AgentPlanChoice[]; audiences?: readonly AgentPlanChoice[]; resources?: readonly AgentPlanChoice[]
  /** Exact target set for semantic 25; never guessed from the displayed rows. */
  createTaskStepIds?: readonly string[]
  milestones?: readonly MilestoneItem[]; calendar?: ReactNode
  readOnlyReason?: string; onIntent?: (intent: AgentPlanIntent) => void; onBack?: () => void; notice?: string
}

const stepLabels = { draft: "草稿", confirmed: "已确认", "task-created": "已创建任务", running: "进行中", completed: "已完成", blocked: "受阻", unknown: "未知" }
const coreLabels = { draft: "计划草稿", confirmed: "核心步骤已确认", pending: "核心确认待回执", unconfirmed: "核心确认未确认", unknown: "核心确认未知" }
const taskLabels = { "not-created": "任务未创建", partial: "部分任务已创建", created: "任务已创建", pending: "任务创建待回执", unconfirmed: "任务创建未确认", unknown: "任务创建未知" }
const executionLabels = { "not-started": "尚未执行", running: "执行中", completed: "执行已完成", blocked: "执行受阻", unknown: "执行状态未知" }
const saveLabels = { unsaved: "未保存", saving: "保存中", "saved-draft": "已保存草稿", submitted: "已提交", conflict: "版本冲突", error: "保存失败", unconfirmed: "保存回执未确认", unknown: "保存状态未知" }
const kindLabels = { teaching: "教学计划", learning: "学习计划", revision: "复习计划", task: "任务计划" }
const validationLabels = { "date-conflict": "日期冲突", overload: "工作量过载", "resource-unavailable": "资源不可用", other: "校验" }
const hasId = (value: string) => !!value.trim()
const unique = (values: readonly string[]) => values.every(hasId) && new Set(values).size === values.length
const reason = (value: string | undefined, fallback: string) => value === undefined ? undefined : value || fallback
const blankFields = (): AgentPlanStepFields => ({ title: "", description: "", startDate: "", endDate: "", timeWindow: "" })
const fieldsFor = (step: AgentPlanStep): AgentPlanStepFields => ({ title: step.title, description: step.description ?? "", startDate: step.startDate ?? "", endDate: step.endDate ?? "", timeWindow: step.timeWindow ?? "" })
const copyRef = ({ id, label }: AgentPlanReference): AgentPlanReference => ({ id, label })
const listText = (refs: readonly AgentPlanReference[]) => refs.map(item => item.label || "名称未提供").join("、") || "未指定"

export function AgentPlanBuilder({ plan, steps, validation, pendingItems, save = { state: "unknown" }, actions = {}, editor: suppliedEditor,
  people = [], audiences = [], resources = [], createTaskStepIds = [], milestones, calendar, readOnlyReason, onIntent,
  view = "inline", density = "default", onExpand, onBack, details,
  notice = "计划草稿、已创建任务和实际执行分别记录；调整日期不会自动排程。",
}: AgentPlanBuilderProps) {
  const id = useId(), workspace = view === "workspace"
  const editor = suppliedEditor?.open === false ? undefined : suppliedEditor
  const context: PlanContext = { planId: plan.id, versionId: plan.version.id, baseVersionId: plan.baseVersion?.id ?? "" }
  const invalidRows = !unique(steps.map(step => step.id))
  const invalidChoices = [people, audiences, resources].some(options => !unique(options.map(option => option.id)))
  const identityBlock = !Object.values(context).every(hasId) ? "计划身份或版本未确认，暂不能操作。" : undefined
  const shapeBlock = invalidRows || invalidChoices ? "计划记录暂不可用，请重新核对。" : undefined
  const waiting = ["pending", "unconfirmed"].includes(plan.core) || ["pending", "unconfirmed"].includes(plan.tasks)
  const globalBlock = shapeBlock || identityBlock || (plan.snapshot !== undefined ? "历史计划只读。" : undefined)
    || reason(readOnlyReason, "当前计划只读。")
    || (["saving", "conflict", "unconfirmed"].includes(save.state) ? save.description || `${saveLabels[save.state]}，请先核对。` : undefined)
    || (waiting ? "请先核对原请求结果。" : undefined) || (!onIntent ? "当前仅可查看计划。" : undefined)
  const actionBlock = (type: PlanAction, step?: AgentPlanStep) => (type === "open-source" ? shapeBlock || identityBlock || (!onIntent ? "当前无法打开来源。" : undefined) : globalBlock)
    || (!actions[type] ? "此操作暂不可用。" : reason(actions[type]?.disabledReason, "此操作暂不可用。"))
    || (step && type !== "open-source" ? reason(step.disabledReason, "此步骤暂不可调整。") : undefined)

  // Exact copy shares a standing explanation and accessible associations, not repeated per button.
  const notes = new Map<string, { id: string; scopes: Set<string>; labels: Set<string>; alert: boolean }>()
  function note(text: string | undefined, scope: string, label?: string, alert = false) {
    if (!text) return undefined
    let entry = notes.get(text)
    if (!entry) { entry = { id: `${id}-note-${notes.size}`, scopes: new Set(), labels: new Set(), alert: false }; notes.set(text, entry) }
    entry.scopes.add(scope); if (label) entry.labels.add(label); entry.alert ||= alert
    return entry.id
  }
  const globalNote = note(globalBlock, "计划")
  note(save.description, "保存")
  const validationNotes = validation.map(item => note(item.message, item.stepIds?.length ? item.stepIds.map(stepId => {
    const index = steps.findIndex(step => step.id === stepId); return index < 0 ? "关联步骤待核对" : `步骤 ${index + 1}`
  }).join("、") : "计划", validationLabels[item.kind], item.level === "error"))
  const errorNote = validationNotes[validation.findIndex(item => item.level === "error")]
  const unknown: string[] = []
  if (!plan.goal) unknown.push("计划目标")
  if (plan.audience === null) unknown.push("适用对象")
  if (!plan.startDate) unknown.push("开始日期")
  if (!plan.endDate) unknown.push("结束日期")
  if (!plan.version.label) unknown.push("当前版本")
  if (!plan.baseVersion?.label) unknown.push("基准版本")
  if (save.state === "unknown") unknown.push("保存状态")
  if (plan.core === "unknown") unknown.push("核心确认")
  if (plan.tasks === "unknown") unknown.push("任务创建")
  if (plan.execution === "unknown") unknown.push("执行状态")
  if (pendingItems === null) unknown.push("待确认项")
  if (plan.sources === null) unknown.push("建议来源")
  if (editor && !workspace) note("有步骤正在编辑，展开计划可继续。", "计划")
  const editorStep = editor?.stepId == null ? undefined : steps.find(step => step.id === editor.stepId)
  const invalidEditor = !!editor && editor.stepId !== null && !editorStep
  if (invalidEditor) note("正在编辑的步骤已变化，输入仍需核对。", "编辑")

  function button(type: PlanAction, label: string, emit: () => void, step?: AgentPlanStep, extraBlock?: string, existingNote?: string) {
    if (!actions[type]) return null
    const block = actionBlock(type, step) || extraBlock
    const describedBy = block ? (block === globalBlock ? globalNote : (block === extraBlock ? existingNote : undefined) || note(block, step ? `步骤 ${steps.indexOf(step) + 1}` : "计划")) : undefined
    return <Button type="button" size="navigation" variant={type === "confirm-core" ? "default" : "outline"}
      data-plan-action={type} disabled={!!block} aria-describedby={describedBy}
      onClick={() => { if (!block) emit() }}>{label}</Button>
  }
  const send = (intent: AgentPlanIntent) => onIntent?.(intent)
  function editRequest(step: AgentPlanStep | undefined, phase: EditorPhase, values: AgentPlanStepFields) {
    const type = step ? "step-edit" : "step-add"
    if (actionBlock(type, step) || invalidEditor) return
    if (phase !== "start" && (!editor || editor.stepId !== (step?.id ?? null))) return
    send(step ? { ...context, type: "step-edit", stepId: step.id, phase, values: { ...values } }
      : { ...context, type: "step-add", phase, values: { ...values } })
  }
  function field(key: keyof AgentPlanStepFields, label: string, values: AgentPlanStepFields, step?: AgentPlanStep) {
    const block = actionBlock(step ? "step-edit" : "step-add", step) || reason(editor?.readOnlyFields?.[key], "此字段仅供查看。")
    const anchor = `${id}-editor-${step ? steps.indexOf(step) : "new"}-${key}`
    const describedBy = block === globalBlock ? globalNote : note(block, "编辑")
    const related = validation.flatMap((item, index) => !item.stepIds?.length || (step && item.stepIds.includes(step.id)) ? [validationNotes[index]] : []).filter(Boolean).join(" ")
    const props = { id: anchor, value: values[key], readOnly: !!block, "aria-describedby": [describedBy, related].filter(Boolean).join(" ") || undefined,
      "aria-invalid": validation.some(item => item.level === "error" && (!item.stepIds?.length || (step && item.stepIds.includes(step.id)))) || undefined,
      "data-plan-field": key, onChange: (event: { currentTarget: { value: string } }) => { if (!block) editRequest(step, "change", { ...values, [key]: event.currentTarget.value }) } }
    return <div className="min-w-0 space-y-2"><Label htmlFor={anchor}>{label}</Label>{key === "description" ? <Textarea {...props} /> : <Input {...props} type={key === "startDate" || key === "endDate" ? "date" : "text"} />}</div>
  }
  function editorBody(values: AgentPlanStepFields, step?: AgentPlanStep) {
    return <div className="min-w-0 space-y-3">
      {field("description", "步骤说明", values, step)}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,12rem),1fr))] gap-3">{field("startDate", "开始日期", values, step)}{field("endDate", "结束日期", values, step)}</div>
      {field("timeWindow", "时间窗", values, step)}
      <div className="flex flex-wrap gap-2">
        {button(step ? "step-edit" : "step-add", step ? "提交步骤调整" : "加入计划草稿", () => editRequest(step, "submit", values), step, errorNote ? "请先处理校验错误。" : undefined, errorNote)}
        {button(step ? "step-edit" : "step-add", "收起编辑", () => editRequest(step, "cancel", values), step)}
      </div>
    </div>
  }
  function choice(step: AgentPlanStep, role: "owner" | "audience" | "resource", options: readonly AgentPlanChoice[]) {
    const type = role === "resource" ? "attach-resource" : "assign"
    if (!actions[type] || !options.length) return null
    const label = role === "owner" ? "负责人" : role === "audience" ? "添加适用对象" : "添加资源"
    const block = actionBlock(type, step) || (role === "audience" && step.audience === null ? "请先核对当前适用对象。" : undefined), anchor = `${id}-choice-${steps.indexOf(step)}-${role}`
    const describedBy = block === globalBlock ? globalNote : note(block, `步骤 ${steps.indexOf(step) + 1}`)
    const selectedIndex = role === "owner" ? options.findIndex(option => option.id === step.owner?.id) : -1
    const optionNotes = options.map(option => note(reason(option.disabledReason, "此选项暂不可用。"), option.label))
    return <div className="min-w-0 space-y-2"><Label id={`${anchor}-label`} htmlFor={anchor}>{label}</Label>
      <Select items={options.map((option, index) => ({ value: String(index), label: option.label }))} value={selectedIndex < 0 ? null : String(selectedIndex)} disabled={!!block}
        onValueChange={value => {
          if (block) return
          const option = options.find((_, index) => String(index) === value)
          if (!option || option.disabledReason !== undefined) return
          if (role === "resource") {
            if (!step.resources?.some(ref => ref.id === option.id)) send({ ...context, type: "attach-resource", stepId: step.id, resource: copyRef(option) })
          } else {
            if (role === "audience" && step.audience?.some(ref => ref.id === option.id)) return
            send({ ...context, type: "assign", stepId: step.id, role, references: role === "owner" ? [copyRef(option)] : [...(step.audience ?? []).map(copyRef), copyRef(option)] })
          }
        }}>
        <SelectTrigger id={anchor} className="w-full min-w-0" aria-labelledby={`${anchor}-label`} aria-describedby={[describedBy, ...optionNotes].filter(Boolean).join(" ") || undefined}><SelectValue placeholder={role === "owner" ? step.owner?.label || "未指定" : "请选择"} /></SelectTrigger>
        <SelectPopup>{options.map((option, index) => <SelectItem key={index} value={String(index)} disabled={option.disabledReason !== undefined || (role === "audience" && !!step.audience?.some(ref => ref.id === option.id)) || (role === "resource" && !!step.resources?.some(ref => ref.id === option.id))}>{option.label}</SelectItem>)}</SelectPopup>
      </Select></div>
  }

  const sources = new Map<string, { source: AgentPlanSource; scopes: string[] }>()
  function sourceEntry(source: AgentPlanSource, scope: string) {
    const key = JSON.stringify([source.suggestionId, source.versionId, source.label])
    const entry = sources.get(key)
    if (entry) entry.scopes.push(scope); else sources.set(key, { source, scopes: [scope] })
  }
  plan.sources?.forEach(source => sourceEntry(source, "计划"))
  const descriptionCounts = new Map<string, number>()
  for (const step of steps) if (step.description && !(workspace && editor?.stepId === step.id)) {
    descriptionCounts.set(step.description, (descriptionCounts.get(step.description) ?? 0) + 1)
  }
  const rows = invalidRows ? [] : steps.map((step, index) => {
    const scope = `步骤 ${index + 1}`, editing = workspace && editor?.stepId === step.id
    const linked: (string | undefined)[] = []
    const sharedDescription = !!step.description && (descriptionCounts.get(step.description) ?? 0) > 1
    if (!editing && sharedDescription) linked.push(note(step.description || undefined, scope))
    const stepUnknown: string[] = []
    if (step.description === null) stepUnknown.push("说明")
    linked.push(note(reason(step.disabledReason, "此步骤暂不可调整。"), scope))
    if (step.status.state === "blocked") linked.push(note(step.status.reason || "受阻原因未知。", scope, "受阻", true))
    if (step.status.state === "unknown") stepUnknown.push("状态")
    if (!step.owner) stepUnknown.push("负责人")
    if (step.audience === null) stepUnknown.push("对象")
    if (!step.startDate) stepUnknown.push("开始日期")
    if (!step.endDate) stepUnknown.push("结束日期")
    if (step.resources === null) stepUnknown.push("资源")
    if (step.dependencies === null) stepUnknown.push("依赖")
    if (step.source === null) stepUnknown.push("建议来源")
    else if (step.source) sourceEntry(step.source, scope)
    const controls = <div className="min-w-0 space-y-3">
      <div className="flex flex-wrap gap-2">
        {workspace && !editing && button("step-edit", "编辑步骤", () => editRequest(step, "start", suppliedEditor?.stepId === step.id ? suppliedEditor.values : fieldsFor(step)), step, editor ? "请先收起当前编辑。" : undefined)}
        {workspace && button("step-remove", "移除步骤", () => send({ ...context, type: "step-remove", stepId: step.id }), step, editor ? "请先收起当前编辑。" : undefined)}
        {(["up", "down"] as const).map(via => {
          const next = index + (via === "up" ? -1 : 1), adjacent = steps[next]
          const block = !adjacent ? (via === "up" ? "已是第一步。" : "已是最后一步。") : reason(adjacent.disabledReason, "相邻步骤暂不可调整。")
          return <span key={via}>{button("step-move", via === "up" ? "上移" : "下移", () => send({ ...context, type: "step-move", stepId: step.id, toIndex: next, via }), step, block)}</span>
        })}
      </div>
      {workspace && <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,12rem),1fr))] gap-3">{choice(step, "owner", people)}{choice(step, "audience", audiences)}{choice(step, "resource", resources)}</div>}
      {workspace && actions.assign && <div className="flex flex-wrap gap-2">{step.owner && button("assign", "清除负责人", () => send({ ...context, type: "assign", stepId: step.id, role: "owner", references: [] }), step)}{step.audience?.map((ref, refIndex) => <span key={refIndex}>{button("assign", `移出对象：${ref.label}`, () => send({ ...context, type: "assign", stepId: step.id, role: "audience", references: step.audience!.filter(item => item.id !== ref.id).map(copyRef) }), step)}</span>)}</div>}
    </div>
    return {
      id: step.id,
      title: editing ? field("title", "步骤标题", editor.values, step) : step.title || "未命名步骤",
      condition: <div className="min-w-0 space-y-2" aria-describedby={linked.filter(Boolean).join(" ") || undefined}>
        {linked.some(Boolean) && <p className="text-ui-hint">见计划说明 · {scope}</p>}
        {!editing && !sharedDescription && step.description && <p className="whitespace-pre-wrap break-words text-ui-hint">{step.description}</p>}
        {stepUnknown.length > 0 && <p className="break-words text-ui-hint" data-plan-step-unknown="">{scope}：{stepUnknown.join("、")}未知。</p>}
        {step.content && <div className="max-w-full overflow-x-auto text-read-body">{step.content}</div>}
        {step.owner && <p>负责人：{step.owner.label || "名称未提供"}</p>}
        {step.audience && <p>适用对象：{listText(step.audience)}</p>}
        {step.resources && <p>所需资源：{step.resources.length ? listText(step.resources) : "无"}</p>}
        {step.dependencies && <p>依赖：{step.dependencies.length ? listText(step.dependencies) : "无"}</p>}
        {editing && editorBody(editor.values, step)}
      </div>,
      schedule: editing ? null : (step.startDate || step.endDate || step.timeWindow) ? <p className="text-ui-hint">{step.startDate && `开始：${step.startDate}`}{step.startDate && step.endDate ? " · " : ""}{step.endDate && `结束：${step.endDate}`}{step.timeWindow && ` · ${step.timeWindow}`}</p> : null,
      status: step.status.state === "unknown" ? null : <Badge variant={step.status.state === "blocked" ? "warning" : step.status.state === "completed" ? "success" : "outline"}>{stepLabels[step.status.state]}</Badge>,
      actions: controls,
    }
  })
  const sourceRows = [...sources.values()].map(({ source, scopes }, index) => <li key={index} className="min-w-0 space-y-2">
    <p className="break-words text-ui-hint">{scopes.join("、")} · 来源：{source.label || "名称未提供"}</p>
    {button("open-source", "查看建议来源", () => send({ ...context, type: "open-source", source: { ...source } }), undefined,
      !hasId(source.suggestionId) || !hasId(source.versionId) ? "建议来源版本未确认。" : undefined)}
  </li>)
  const confirmBlock = editor ? "请先收起当前编辑。" : !steps.length ? "尚无可确认的步骤。" : errorNote ? "请先处理校验错误。" : plan.core === "confirmed" ? "核心步骤已确认。" : undefined
  const confirmButton = button("confirm-core", "确认核心步骤", () => send({ ...context, type: "confirm-core", stepIds: steps.map(step => step.id) }), undefined, confirmBlock, errorNote)
  const createBlock = editor ? "请先收起当前编辑。" : errorNote ? "请先处理校验错误。" : plan.core !== "confirmed" ? "请先确认核心步骤。"
    : !["not-created", "partial"].includes(plan.tasks) ? "请先核对已有任务记录。"
      : !createTaskStepIds.length || !unique(createTaskStepIds) || createTaskStepIds.some(stepId => {
        const step = steps.find(item => item.id === stepId)
        return !step || step.disabledReason !== undefined || !["draft", "confirmed"].includes(step.status.state)
      }) ? "待创建的步骤范围需重新核对。" : undefined
  const createButton = button("request-create-tasks", "前往创建任务确认", () => send({ ...context, type: "request-create-tasks", stepIds: [...createTaskStepIds] }), undefined, createBlock, errorNote)
  const addButton = workspace && button("step-add", "新增步骤", () => editRequest(undefined, "start", suppliedEditor?.stepId === null ? suppliedEditor.values : blankFields()), undefined, editor ? "请先收起当前编辑。" : undefined)
  const addEditor = workspace && editor?.stepId === null ? <section className="min-w-0 space-y-3" aria-label="新增计划步骤">{field("title", "步骤标题", editor.values)}{editorBody(editor.values)}</section> : null

  return <Card data-agent-plan-view={view} data-density={density} className={`min-w-0 ${density === "compact" ? "gap-3 p-3" : "gap-5 p-5"}`} aria-labelledby={`${id}-title`}>
    <header className="min-w-0 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 flex-1 space-y-2">
        <p className="text-ui-hint">{kindLabels[plan.kind]}{plan.snapshot !== undefined ? ` · 历史计划${plan.snapshot ? ` · ${plan.snapshot}` : ""}` : " · 当前计划"}</p>
        <h2 id={`${id}-title`} className="break-words text-block-title">{plan.title}</h2>
      </div>{workspace && onBack && <Button type="button" variant="outline" size="navigation" onClick={onBack}>返回原位置</Button>}</div>
      <div className="flex flex-wrap gap-2">{plan.core !== "unknown" && <Badge variant="outline">{coreLabels[plan.core]}</Badge>}{plan.tasks !== "unknown" && <Badge variant="outline">{taskLabels[plan.tasks]}</Badge>}{plan.execution !== "unknown" && <Badge variant="outline">{executionLabels[plan.execution]}</Badge>}{save.state !== "unknown" && <Badge variant={save.state === "error" || save.state === "conflict" ? "warning" : "outline"}>{saveLabels[save.state]}</Badge>}</div>
      {(plan.version.label || plan.baseVersion?.label) && <p className="text-ui-hint">{[plan.version.label && `版本：${plan.version.label}`, plan.baseVersion?.label && `基于：${plan.baseVersion.label}`].filter(Boolean).join(" · ")}</p>}
    </header>
    <div className="min-w-0 space-y-2 text-ui-body">
      {plan.goal && <p className="break-words">目标：{plan.goal}</p>}{plan.audience && <p>适用对象：{listText(plan.audience)}</p>}
      {(plan.startDate || plan.endDate) && <p>{[plan.startDate && `开始：${plan.startDate}`, plan.endDate && `结束：${plan.endDate}`].filter(Boolean).join(" · ")}</p>}
      {pendingItems && <p className="break-words">待确认：{pendingItems.length ? [...new Set(pendingItems)].join("；") : "无"}</p>}
    </div>
    {unknown.length > 0 && <p className="break-words text-ui-hint" data-plan-unknown="">未知：{unknown.join("、")}。</p>}
    {notes.size > 0 && <ul className="min-w-0 space-y-2" aria-label="计划说明">{[...notes].map(([text, entry]) => <li key={entry.id} id={entry.id} role={entry.alert ? "alert" : undefined} className="break-words text-ui-hint"><span>{[...entry.scopes].join("、")}{entry.labels.size ? ` · ${[...entry.labels].join("、")}` : ""}：</span>{text}</li>)}</ul>}
    {sourceRows.length > 0 && <ul className="min-w-0 space-y-3" aria-label="建议来源">{sourceRows}</ul>}
    {invalidRows ? null : <LearningTaskList items={rows} layout="list" density={density} />}
    {!steps.length && <p className="text-ui-hint">尚无计划步骤。</p>}
    {addEditor}{addButton}
    {workspace && milestones && <section className="min-w-0 space-y-3"><h3 className="text-block-title">阶段时间线</h3><MilestoneList items={[...milestones]} /></section>}
    {workspace && calendar}
    <div className="flex flex-wrap gap-2">{confirmButton}{createButton}{!workspace && onExpand && <Button type="button" size="navigation" variant="outline" onClick={event => onExpand(event.currentTarget)}>展开计划</Button>}</div>
    <p className="text-ui-hint">{notice}</p>
    <RecordDetails>{details}</RecordDetails>
  </Card>
}
