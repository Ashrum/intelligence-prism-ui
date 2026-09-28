"use client"

import { useId, useRef, useState } from "react"
import { Label } from "@/components/coss/label"
import { Button } from "../button"
import { RootFormula } from "../math-content"
import { QuestionSelect } from "../question-controls"
import { AgentStructureArranger, type AgentArrangementActions, type AgentArrangementAttribute, type AgentArrangementGroup, type AgentArrangementItem, type AgentArrangementSave, type AgentArrangementValidation, type AgentStructureArrangerIntent } from "../agent-structure-arranger"

const actions: AgentArrangementActions = { move: {}, groupCreate: {}, groupRename: {}, groupDelete: {}, setAttribute: {}, batchMove: {}, batchSetAttribute: {}, confirm: {} }
const points = (value: number | null): AgentArrangementAttribute => ({ id: "points", label: "分值", type: "number", value, unit: "分", step: 0.5 })
const category = (value: string): AgentArrangementAttribute => ({ id: "category", label: "编排题型", type: "select", value,
  options: [{ value: "choice", label: "单选" }, { value: "written", label: "解答" }] })
const question = (id: string, title: string, groupId: string, value: number, kind = "单选题"): AgentArrangementItem => ({
  id, title, type: kind, groupId, source: { objectId: `question-source-${id}`, versionId: "question-v1", label: "数学示例题库 · 题目 v1" },
  attributes: [points(value), category(kind === "单选题" ? "choice" : "written")], open: {},
})
export type ArrangementExampleState = { groups: readonly AgentArrangementGroup[]; items: readonly AgentArrangementItem[]; revision: number }
export const arrangementExamples: Record<"paper" | "course", ArrangementExampleState & { title: string }> = {
  paper: {
    title: "函数单元练习 · 试卷编排（示例）", revision: 1,
    groups: [{ id: "choice", title: "一、选择题" }, { id: "written", title: "二、解答题" }, { id: "application", title: "三、综合应用" }],
    items: [question("q1", "判断二次函数的开口方向", "choice", 5), question("q2", "由 f(x) = x² − 4x + 3 求对称轴", "choice", 5),
      question("q3", "结合函数图像解释判别式、交点与取值范围之间的关系，并核对结论成立的前提条件", "choice", 5),
      { ...question("q4", "写出求根公式并说明适用条件", "written", 10, "解答题"), lockedReason: "此题属于已核定部分，位置与分值暂不可调整。" }],
  },
  course: {
    title: "探究课 · 课程任务编排（示例）", revision: 1,
    groups: [{ id: "prepare", title: "课前准备" }, { id: "class", title: "课堂活动" }],
    items: [
      { id: "task1", title: "观察三种图像并记录猜想", type: "观察任务", groupId: "prepare", source: null,
        attributes: [{ id: "duration", label: "安排时长", type: "number", value: 8, unit: "分钟" }] },
      { id: "task2", title: "按小组比较解题依据：先检查已知条件，再解释推理与结论之间的关系", type: "合作任务", groupId: "class",
        source: { objectId: "task-source-2", label: "课程活动示例" }, description: "活动内容在原任务中维护。", open: {},
        attributes: [{ id: "duration", label: "安排时长", type: "number", value: 12, unit: "分钟" }] },
      { id: "task3", title: "交流发现并核对 a² + b² = c²", type: "交流任务", groupId: "class",
        source: { objectId: "task-source-3", label: "课程活动示例" }, description: "活动内容在原任务中维护。", open: {},
        attributes: [{ id: "duration", label: "安排时长", type: "number", value: null, unit: "分钟" }] },
    ],
  },
}

/** Page-only sample adapter. It never persists, publishes, or claims a save receipt. */
export function applyArrangementExample(state: ArrangementExampleState, intent: AgentStructureArrangerIntent): ArrangementExampleState {
  if (intent.type === "confirm" || intent.type === "open-item") return state
  let groups = [...state.groups], items = [...state.items]
  if (intent.type === "group-create") groups.push({ id: `example-group-${state.revision + 1}`, title: `新增分组 ${state.revision + 1}` })
  if (intent.type === "group-rename") groups = groups.map(group => group.id === intent.groupId ? { ...group, title: intent.title } : group)
  if (intent.type === "group-delete") {
    // This destination policy belongs to the example page, never to the component.
    groups = groups.filter(group => group.id !== intent.groupId)
    items = items.map(item => item.groupId === intent.groupId ? { ...item, groupId: null } : item)
  }
  if (intent.type === "set-attribute" || intent.type === "batch-set-attribute") {
    const ids = intent.type === "set-attribute" ? [intent.itemId] : intent.itemIds
    items = items.map(item => ids.includes(item.id) ? { ...item, attributes: item.attributes.map(attribute => {
      if (attribute.id !== intent.attributeId) return attribute
      if (attribute.type === "number" && (typeof intent.value === "number" || intent.value === null)) return { ...attribute, value: intent.value }
      if (attribute.type === "select" && (typeof intent.value === "string" || intent.value === null)) return { ...attribute, value: intent.value }
      return attribute
    }) } : item)
  }
  if (intent.type === "move" || intent.type === "batch-move") {
    const ids = intent.type === "move" ? [intent.itemId] : intent.itemIds
    const moving = items.filter(item => ids.includes(item.id)).map(item => ({ ...item, groupId: intent.target.groupId }))
    const remaining = items.filter(item => !ids.includes(item.id))
    const target = remaining.filter(item => item.groupId === intent.target.groupId)
    target.splice(intent.target.index, 0, ...moving)
    items = [...groups.map(group => group.id), null].flatMap(groupId => groupId === intent.target.groupId ? target : remaining.filter(item => item.groupId === groupId))
  }
  return { items, groups, revision: state.revision + 1 }
}

/** Common-value projection belongs to this page; each keystroke is reflected back. */
export function arrangementExampleBatchAttribute(state: ArrangementExampleState, selectedIds: readonly string[], purpose: "paper" | "course"): AgentArrangementAttribute {
  const attributeId = purpose === "paper" ? "points" : "duration"
  const values = state.items.filter(item => selectedIds.includes(item.id)).map(item => item.attributes.find(attribute => attribute.id === attributeId)?.value)
  const first = values[0]
  const value = values.length && (typeof first === "number" || first === null) && values.every(candidate => candidate === first) ? first : null
  return purpose === "paper" ? points(value) : { id: "duration", label: "统一安排时长", type: "number", value, unit: "分钟" }
}

export function ArrangementExample({ purpose, narrow }: { purpose: "paper" | "course"; narrow: boolean }) {
  const example = arrangementExamples[purpose], id = useId()
  const [state, setState] = useState<ArrangementExampleState>(example)
  const [selected, setSelected] = useState<string[]>([])
  const [save, setSave] = useState<AgentArrangementSave["state"]>("unsaved")
  const [unknown, setUnknown] = useState(false)
  const [readonly, setReadonly] = useState(false)
  const [changes, setChanges] = useState<string[]>(purpose === "paper" ? ["增加综合应用分组，尚未放入题目。"] : [])
  const [feedback, setFeedback] = useState("尚未操作。")
  const workspace = useRef<HTMLElement>(null), trigger = useRef<HTMLButtonElement | null>(null)
  const structure = { id: `arrangement-example-${purpose}`, title: example.title, version: { id: `sample-r${state.revision}`, label: `示例草稿 ${state.revision}` }, baseVersion: { id: "sample-base-1", label: "示例基准 1" } }
  const scores = state.items.map(item => item.attributes.find(attribute => attribute.id === "points")?.value)
  const totalScore = purpose === "paper" && scores.every(value => typeof value === "number" && Number.isFinite(value)) ? scores.reduce<number>((sum, value) => sum + (value as number), 0) : null
  const validation: AgentArrangementValidation[] = state.groups.filter(group => !state.items.some(item => item.groupId === group.id)).map(group => ({ level: "warning", message: "分组为空，请核对是否需要保留。", target: { groupId: group.id } }))
  if (purpose === "paper" && totalScore !== 30) validation.push({ level: "error", message: "当前总分与目标 30 分不符，请调整分值后核对。" })
  for (const item of state.items) for (const attribute of item.attributes) if (attribute.type === "number" && (attribute.value === null || attribute.value <= 0)) {
    validation.push({ level: "error", message: `${attribute.label}须为正数。`, target: { itemId: item.id, attributeId: attribute.id } })
  }
  function receive(intent: AgentStructureArrangerIntent) {
    if (intent.structureId !== structure.id || intent.versionId !== structure.version.id || intent.baseVersionId !== structure.baseVersion.id) return
    if (intent.type === "open-item") { setFeedback("已收到示例查看请求；实际接入时由对象查看器打开原条目。"); return }
    if (intent.type === "confirm") { setFeedback("已收到示例确认请求；保存状态未改变。"); return }
    setState(current => applyArrangementExample(current, intent)); setSave("unsaved")
    const label = ({ move: "条目位置已调整", "group-create": "已增加分组", "group-rename": "分组名称已调整", "group-delete": "分组已移除，条目转为未分组", "set-attribute": "编排属性已调整", "batch-move": "所选条目位置已调整", "batch-set-attribute": "所选条目属性已调整" })[intent.type]
    setChanges([label]); setFeedback(`${label}，仅在本页保留，尚未保存。`)
  }
  const batchAttributes = [arrangementExampleBatchAttribute(state, selected, purpose)]
  return <div className="min-w-0 space-y-5">
    <div className="flex flex-wrap items-end gap-3">
      <div className="min-w-0 space-y-2"><Label htmlFor={`${id}-save`}>独立保存状态示例</Label><QuestionSelect id={`${id}-save`} label="独立保存状态示例" value={save} onChange={value => setSave(value as AgentArrangementSave["state"])}
        items={[{ value: "unsaved", label: "未保存" }, { value: "saved-draft", label: "已保存草稿（示例记录）" }, { value: "saving", label: "保存中" }, { value: "conflict", label: "版本冲突" }, { value: "unconfirmed", label: "回执未确认" }, { value: "error", label: "保存失败" }, { value: "unknown", label: "未知" }]} /></div>
      <Button type="button" variant="outline" aria-pressed={unknown} onClick={() => setUnknown(value => !value)}>合计未知示例</Button>
      <Button type="button" variant="outline" aria-pressed={readonly} onClick={() => setReadonly(value => !value)}>整体只读示例</Button>
    </div>
    <p className="text-ui-hint">固定示例；上方保存记录独立切换，未连接保存服务。</p>
    {purpose === "paper" && <div className="min-w-0 space-y-2"><p className="text-ui-hint">题目公式参考；正文在原题中查看。</p><div className="overflow-x-auto"><RootFormula /></div></div>}
    <p role="status" className="break-words text-ui-hint">{feedback}</p>
    {([ ["inline", "default", "对话编排摘要"], ["workspace", "default", "完整编排"], ["inline", "compact", "紧凑编排摘要"] ] as const).map(([view, density, label]) => <section key={`${view}-${density}`}
      ref={view === "workspace" ? workspace : undefined} tabIndex={view === "workspace" ? -1 : undefined} aria-label={label} className={`min-w-0 space-y-3 ${narrow ? "w-full max-w-[320px]" : ""}`}>
      <h3 className="text-block-title">{label}</h3>
      <AgentStructureArranger structure={structure} items={state.items} groups={state.groups}
        summary={unknown ? {} : { groupCount: state.groups.length, itemCount: state.items.length, itemCountLabel: purpose === "paper" ? "题数" : "任务数", totalScore, ...(purpose === "paper" ? { targetScore: 30 } : {}) }}
        validation={validation} actions={actions} changes={changes} save={{ state: save, description: save === "error" ? "示例写入失败，当前编排仍保留。" : undefined }}
        readOnlyReason={readonly ? "此版本仅供核对，请在可编辑草稿中调整。" : undefined}
        selectedIds={selected} onSelectionChange={setSelected} batchAttributes={batchAttributes} onIntent={receive} view={view} density={density}
        onExpand={button => { trigger.current = button; workspace.current?.focus({ preventScroll: true }); workspace.current?.scrollIntoView({ block: "nearest" }) }}
        onBack={() => { trigger.current?.focus(); trigger.current?.scrollIntoView({ block: "nearest" }) }}
        details={<p>上移、下移或移到分组可用键盘和触屏操作。拖拽可放到条目前或分组末尾。分组最多一层，条目内容请打开原对象查看。此示例删除分组后将条目留在“未分组”。</p>} />
    </section>)}
  </div>
}

export function AgentStructureArrangerDemo() {
  const [purpose, setPurpose] = useState<"paper" | "course">("paper"), [narrow, setNarrow] = useState(false)
  return <section id="structure-arranger" className="mb-12 min-w-0 space-y-5">
    <h2 className="text-section-title">结构编排器 v0.1 · 设计候选</h2>
    <div className="flex flex-wrap gap-3">{(["paper", "course"] as const).map(value => <Button key={value} type="button" variant={purpose === value ? "secondary" : "outline"} aria-pressed={purpose === value} onClick={() => setPurpose(value)}>{value === "paper" ? "试卷编排示例" : "课程任务编排示例"}</Button>)}
      <Button type="button" variant="outline" aria-pressed={narrow} onClick={() => setNarrow(value => !value)}>320px 窄容器</Button></div>
    <ArrangementExample key={purpose} purpose={purpose} narrow={narrow} />
  </section>
}
