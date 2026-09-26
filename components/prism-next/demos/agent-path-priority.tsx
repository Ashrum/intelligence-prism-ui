"use client"

import { useId, useRef, useState } from "react"
import { Label } from "@/components/coss/label"
import { Button } from "../button"
import { QuestionSelect } from "../question-controls"
import { RootFormula } from "../math-content"
import { AgentPathPriority, type AgentPath, type AgentPathItem, type AgentPathItemActions, type AgentPathPriorityIntent, type AgentPathSave } from "../agent-path-priority"

const priorityOptions = [{ id: "first", label: "优先处理" }, { id: "later", label: "随后处理" }]
const editable: AgentPathItemActions = { reorder: {}, "set-priority": { options: priorityOptions }, "open-item": {} }
const suggestionActions: AgentPathItemActions = { ...editable, "accept-next": {},
  skip: { options: [{ id: "not-now", label: "本轮先跳过" }, { id: "not-relevant", label: "与当前目标无关" }] },
  snooze: { options: [{ id: "tomorrow", label: "9 月 27 日 08:00", until: "2026-09-27 08:00（台北时间）" }, { id: "next-week", label: "9 月 28 日 08:00", until: "2026-09-28 08:00（台北时间）" }] },
}
const item = (id: string, title: string): AgentPathItem => ({ id, title, type: "学习活动", kind: "suggestion", status: { state: "not-started" },
  priority: { label: "优先处理", reason: "先核对已有作答，再确定后续练习。", evidence: "固定示例，未接个人学情。", certainty: null }, dependencies: [], actions: editable })
export type PathExampleState = { path: AgentPath; items: readonly AgentPathItem[]; nextItemIds: readonly string[]; blockerItemIds: readonly string[]; revision: number }
const path = (id: string, title: string): AgentPath => ({ id, title, version: { id: "example-v1", label: "示例草稿 1" }, baseVersion: { id: "example-base", label: "初始安排" } })
export const pathExamples: Record<"student" | "teacher", PathExampleState> = {
  student: { path: path("student-path", "二次函数补弱路径（示例）"), revision: 1, nextItemIds: ["formula", "explain"], blockerItemIds: ["compare"], items: [
    { ...item("basics", "回顾二次函数的图像与对称轴"), kind: "todo", status: { state: "completed" }, actions: { "open-item": {} } },
    { ...item("formula", "核对求根公式的适用条件，并说明判别式与图像交点之间的联系"), actions: suggestionActions, content: <RootFormula />,
      priority: { label: "优先处理", score: 90, reason: "适用条件未核对会影响后续解题。", evidence: "适用条件未核对会影响后续解题。", certainty: null },
      dependencies: [{ id: "basics", title: "图像与对称轴回顾", state: "met" }] },
    { ...item("compare", "比较配方法与求根公式，记录需要再次核对的推导"), kind: "todo", status: { state: "blocked", reason: "尚未取得订正后的作答记录。" },
      dependencies: [{ id: "formula", title: "公式适用条件核对", state: "unmet", resolve: {} }], actions: { ...editable, reorder: { disabledReason: "尚未取得订正后的作答记录。" } } },
    { ...item("practice", "用一道新题检验条件判断"), status: { state: "snoozed", until: "2026-09-28 08:00（台北时间）" }, priority: { label: "随后处理", reason: "等待订正后再安排。", evidence: null, certainty: null }, actions: { ...editable, restore: {} } },
    { ...item("explain", "向同伴解释正在订正的解题过程"), kind: "todo", status: { state: "in-progress" } },
    { ...item("transfer", "迁移练习的准备情况"), status: { state: "unknown" }, dependencies: null, priority: { label: null, reason: null, evidence: null, certainty: null }, actions: { "open-item": {} } },
  ] },
  teacher: { path: path("teacher-path", "教师待办优先级（示例）"), revision: 1, nextItemIds: ["review", "remind"], blockerItemIds: [], items: [
    { ...item("remind", "查看本周教学行动的复盘入口"), type: "工作建议", actions: suggestionActions, priority: { label: "随后处理", reason: "已有行动需要核对后续证据。", evidence: "本机工作记录（固定示例）。", certainty: null } },
    { ...item("review", "核对高二三班纸质再练结果，保留尚未解决的问题并确定下一轮跟进范围"), type: "教学复盘", kind: "todo", status: { state: "expired" }, actions: { ...editable, restore: {} },
      priority: { label: "优先处理", reason: "约定的复盘日期已到，工作仍需接续。", evidence: "固定到期记录，不根据本机时钟计算。", certainty: "人工安排（示例）" }, content: <RootFormula /> },
    { ...item("guide", "了解新的教研记录整理方法"), type: "教程建议", status: { state: "skipped" }, actions: { ...editable, restore: {} } },
    { ...item("marking", "继续核对正在批阅的作答"), type: "批阅任务", kind: "todo", status: { state: "in-progress" } },
    { ...item("archive", "归档上一轮教学行动复盘"), type: "教学复盘", kind: "todo", status: { state: "completed" }, actions: { "open-item": {} } },
    { ...item("pending", "待核对的后续安排"), type: "工作建议", status: { state: "unknown" }, dependencies: null, priority: { label: null, reason: null, evidence: null, certainty: null }, actions: { "open-item": {} } },
  ] },
}

/** Only explicit order/priority edits update the page draft. Other requests never manufacture facts. */
export function applyPathExample(current: PathExampleState, intent: AgentPathPriorityIntent): PathExampleState {
  if (intent.pathId !== current.path.id || intent.versionId !== current.path.version.id || intent.baseVersionId !== current.path.baseVersion?.id) return current
  const from = current.items.findIndex(item => item.id === intent.itemId)
  if (from < 0) return current
  let items = [...current.items]
  if (intent.type === "reorder") {
    if (!Number.isInteger(intent.toIndex) || intent.toIndex < 0 || intent.toIndex >= items.length || intent.toIndex === from) return current
    const [moving] = items.splice(from, 1); items.splice(intent.toIndex, 0, moving)
  } else if (intent.type === "set-priority") {
    const option = items[from].actions?.["set-priority"]?.options.find(option => option.id === intent.optionId && option.disabledReason === undefined)
    if (!option) return current
    items = items.map((item, index) => index === from ? { ...item, priority: { label: option.label, reason: "人工调整的本页草稿。", evidence: null, certainty: null } } : item)
  } else return current
  const revision = current.revision + 1
  return { ...current, items, revision, path: { ...current.path, version: { id: `example-v${revision}`, label: `示例草稿 ${revision}` } } }
}

export function PathPriorityExample({ purpose, narrow }: { purpose: keyof typeof pathExamples; narrow: boolean }) {
  const id = useId(), trigger = useRef<HTMLButtonElement | null>(null), workspace = useRef<HTMLElement | null>(null)
  const [state, setState] = useState(pathExamples[purpose]), [save, setSave] = useState<AgentPathSave["state"]>("unsaved"), [readOnly, setReadOnly] = useState(false)
  const [feedback, setFeedback] = useState("尚未发出操作请求。")
  function receive(intent: AgentPathPriorityIntent) {
    if (intent.pathId !== state.path.id || intent.versionId !== state.path.version.id || intent.baseVersionId !== state.path.baseVersion?.id) return
    if (intent.type === "reorder" || intent.type === "set-priority") {
      setState(current => applyPathExample(current, intent)); setSave("unsaved")
      setFeedback("本页顺序或优先级草稿已调整，尚未保存；下一步建议和依赖记录保持原样。")
    } else {
      const labels = { skip: "跳过", snooze: "冷却", restore: "恢复", "open-item": "打开内容", "accept-next": "接受下一步建议", "mark-dependency-resolved": "标记依赖已满足" }
      setFeedback(`已收到${labels[intent.type]}请求；此示例未接处理服务，原状态保持不变。`)
    }
  }
  const common = { ...state, save: { state: save }, readOnlyReason: readOnly ? "此路径当前仅供核对。" : undefined, onIntent: receive,
    onExpand: (button: HTMLButtonElement) => { trigger.current = button; workspace.current?.focus({ preventScroll: true }); workspace.current?.scrollIntoView({ block: "nearest" }) },
    onBack: () => { trigger.current?.focus(); trigger.current?.scrollIntoView({ block: "nearest" }) },
    details: <p>顺序、下一步范围、依赖、完成与到期均为固定示例记录。调整顺序不会重新计算路径；跳过、冷却、恢复及接受建议只显示请求反馈，待办保留。可用上移、下移或指定位置完成排序。</p>,
  }
  return <div className="min-w-0 space-y-5">
    <div className="flex flex-wrap items-end gap-3"><div className="space-y-2"><Label htmlFor={`${id}-save`}>独立保存记录示例</Label><QuestionSelect id={`${id}-save`} label="独立保存记录示例" value={save} onChange={value => setSave(value as AgentPathSave["state"])} items={[
      { value: "unsaved", label: "未保存" }, { value: "saved", label: "已保存（示例）" }, { value: "saving", label: "保存中" }, { value: "conflict", label: "版本冲突" }, { value: "error", label: "保存失败" }, { value: "unconfirmed", label: "保存回执未确认" }, { value: "unknown", label: "未知" },
    ]} /></div><Button type="button" variant="outline" aria-pressed={readOnly} onClick={() => setReadOnly(value => !value)}>只读示例</Button></div>
    <p className="text-ui-hint">固定示例；独立保存记录的切换不代表当前草稿已提交。全部操作仅用于组件评审。</p><p role="status" className="text-ui-hint">{feedback}</p>
    {([["inline", "default", "对话中的下一步建议"], ["workspace", "default", "完整路径与人工调整"], ["inline", "compact", "紧凑下一步建议"]] as const).map(([view, density, label]) => <section key={`${view}-${density}`} aria-label={label} tabIndex={view === "workspace" ? -1 : undefined} ref={view === "workspace" ? workspace : undefined} className={`min-w-0 space-y-3 ${narrow ? "w-full max-w-[320px]" : ""}`}>
      <h3 className="text-block-title">{label}</h3><AgentPathPriority {...common} view={view} density={density} />
    </section>)}
  </div>
}

export function AgentPathPriorityDemo() {
  const [purpose, setPurpose] = useState<keyof typeof pathExamples>("student"), [narrow, setNarrow] = useState(false)
  return <section id="path-priority" className="mb-12 min-w-0 space-y-5"><h2 className="text-section-title">路径与优先级 v0.1 · 设计候选</h2>
    <div className="flex flex-wrap gap-3">{(["student", "teacher"] as const).map(value => <Button key={value} type="button" variant={purpose === value ? "secondary" : "outline"} aria-pressed={purpose === value} onClick={() => setPurpose(value)}>{value === "student" ? "学生补弱路径示例" : "教师待办优先级示例"}</Button>)}<Button type="button" variant="outline" aria-pressed={narrow} onClick={() => setNarrow(value => !value)}>320px 窄容器</Button></div>
    <PathPriorityExample key={purpose} purpose={purpose} narrow={narrow} />
  </section>
}
