"use client"

import { useId, useRef, useState } from "react"
import { ArrowRight, Check, CircleAlert } from "lucide-react"
import { Button } from "@/components/coss/button"
import { Card } from "@/components/coss/card"
import { Field, FieldLabel } from "@/components/coss/field"
import { Alert, AlertTitle, AlertDescription } from "@/components/coss/alert"
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription, DialogPanel } from "@/components/coss/dialog"
import { Badge } from "../badge"
import { QuestionSelect } from "../question-controls"
import { AgentTaskProgress } from "../agent-components"
import { AgentContextSummary, type AgentContextFact, type AgentContextSource } from "../agent-context-summary"

type ExampleState = "partial" | "complete" | "absent" | "unavailable" | "historical" | "empty"
const exampleStates = [
  { value: "partial", label: "部分记录待确认" }, { value: "complete", label: "有对应记录" },
  { value: "absent", label: "完整记录中无事件" }, { value: "unavailable", label: "记录暂不可用" },
  { value: "historical", label: "历史版本" }, { value: "empty", label: "无来源条目" },
]
const unknown: AgentContextFact = { state: "unknown" }
const absent: AgentContextFact = { state: "absent" }
const unavailable: AgentContextFact = { state: "unavailable" }

function sourcesFor(preparation: boolean, state: ExampleState): AgentContextSource[] {
  if (state === "empty") return []
  const unverified = state === "unavailable" ? unavailable : state === "absent" ? absent : unknown
  const known = state === "complete" || state === "historical"
  const sourceTitle = preparation ? "函数教学参考 · 单调性" : "函数单元练习.pdf"
  return [
    {
      id: "source-main", title: sourceTitle, location: "原稿 v2 · 第 1–3 页", selection: "selected", inspectable: true,
      read: state === "unavailable" || state === "absent" ? unverified : { state: "confirmed", description: "服务已读取 · 第 1–3 页" },
      context: known ? { state: "confirmed", description: "本轮使用 · 第 1–3 页" } : unverified,
      citation: known ? { state: "confirmed", description: preparation ? "提纲 v1 · 第 2 节" : "校对稿 v1 · 第 1–6 题" } : unverified,
      details: [
        { label: "来源版本", value: "原稿 v2；只说明第 1–3 页" },
        { label: "任务与执行", value: preparation ? "备课示例 · 第 1 轮" : "解析示例 · 第 1 轮" },
        { label: "记录性质", value: "人工构造的展示数据，不是执行证据" },
      ],
    },
    {
      id: "source-extra", title: preparation ? "往年教学活动记录" : "教师补充说明.txt", location: "材料 v1 · 个人提供", selection: "not-selected", inspectable: true,
      read: state === "unavailable" ? unavailable : absent,
      context: state === "unavailable" ? unavailable : absent,
      citation: state === "unavailable" ? unavailable : absent,
      details: [{ label: "记录范围", value: "此示例假设记录覆盖完整，且没有对应读取、上下文或引用事件" }],
    },
  ]
}

/** All state below is a manual fixture. Reusable components do not run tasks. */
export function AgentContextSummaryDemo() {
  const id = useId()
  const [purpose, setPurpose] = useState("parsing")
  const [state, setState] = useState<ExampleState>("partial")
  const [expanded, setExpanded] = useState(false)
  const [narrow, setNarrow] = useState(false)
  const [inspected, setInspected] = useState<string | null>(null)
  const sources = sourcesFor(purpose === "preparation", state)
  const selected = sources.find(source => source.id === inspected)
  const notices = {
    partial: { tone: "warning" as const, text: "主材料有读取记录；本轮上下文使用与成果引用仍待确认。" },
    complete: { tone: "info" as const, text: "三类记录分别对应此来源版本和本轮任务；确认引用关系不等于确认结论正确。" },
    absent: { tone: "info" as const, text: "示例设定：记录覆盖完整，未发现对应事件，因此显示“未读取／未进入／未引用”。" },
    unavailable: { tone: "warning" as const, text: "记录来源暂不可用。材料仍可查看，但不能据此判断是否被读取或引用。" },
    historical: { tone: "info" as const, text: "这里只展示当时任务的记录，不代表当前模型上下文。查看仍须经过宿主授权。" },
    empty: undefined,
  }
  return <section id="context-summary-review" aria-labelledby={`${id}-heading`} className="scroll-mt-24 space-y-6">
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3"><h2 id={`${id}-heading`} className="text-section-title">上下文摘要</h2><Badge variant="outline">v0.1 设计候选</Badge></div>
      <p className="max-w-3xl text-ui-hint text-muted-foreground">先看清对象、范围和材料使用情况，再展开版本与定位。以下为交互示例，未读取文件、调用模型或执行业务。</p>
    </div>
    <div className="flex flex-wrap items-end gap-4">
      <Field><FieldLabel htmlFor={`${id}-purpose`}>示例用途</FieldLabel><QuestionSelect id={`${id}-purpose`} label="示例用途" value={purpose} onChange={value => { setPurpose(value); setInspected(null) }} items={[{ value: "parsing", label: "试卷解析" }, { value: "preparation", label: "备课资源" }]} /></Field>
      <Field><FieldLabel htmlFor={`${id}-state`}>记录情况</FieldLabel><QuestionSelect id={`${id}-state`} label="记录情况" value={state} onChange={value => { setState(value as ExampleState); setInspected(null) }} items={exampleStates} /></Field>
      <Button variant="outline" aria-pressed={narrow} onClick={() => setNarrow(!narrow)}>{narrow ? "恢复可用宽度" : "检查窄容器"}</Button>
    </div>
    <div className={narrow ? "w-full max-w-sm" : "w-full max-w-4xl"} data-context-summary-fixture>
      <AgentContextSummary title={purpose === "parsing" ? "整理函数单元练习" : "准备一节函数复习课"}
        scope={[{ label: "任务对象", value: "高二（3）班 · 数学" }, { label: "内容范围", value: "函数单调性与奇偶性" }, { label: "要求", value: purpose === "parsing" ? "仅整理原有题目与答案，不补造缺失内容" : "40 分钟；保留材料来源，班级学情尚未接入" }]}
        sources={sources} expanded={expanded} onExpandedChange={setExpanded} onInspect={setInspected}
        notice={notices[state]} snapshot={state === "historical" ? "快照 · 2026-09-21" : undefined} />
    </div>
    <Dialog open={!!selected} onOpenChange={open => !open && setInspected(null)}>
      <DialogPopup><DialogHeader><DialogTitle>{selected?.title}</DialogTitle><DialogDescription>示例定位 · {selected?.location}。本操作不会产生读取、上下文或引用记录。</DialogDescription></DialogHeader><DialogPanel><p className="text-read-body">这是宿主提供的来源查看占位内容。真实接入时，由宿主按当前权限打开对应原稿版本；这里没有真实文件。</p></DialogPanel></DialogPopup>
    </Dialog>
    <ManualExecutionReference />
  </section>
}

type FlowState = "confirm" | "accepted" | "running" | "human" | "stale" | "unknown" | "complete" | "partial" | "failed"
const flowItems = [
  { value: "confirm", label: "待确认" }, { value: "accepted", label: "已接收" }, { value: "running", label: "运行中" },
  { value: "human", label: "待人工处理" }, { value: "stale", label: "确认已过期" }, { value: "unknown", label: "回执未确认" },
  { value: "complete", label: "已完成" }, { value: "partial", label: "部分完成" }, { value: "failed", label: "明确失败" },
]

function ManualExecutionReference() {
  const id = useId()
  const heading = useRef<HTMLHeadingElement>(null)
  const [state, setState] = useState<FlowState>("confirm")
  const [feedback, setFeedback] = useState("")
  const completed = state === "complete" || state === "partial"
  const lastKnownSteps = [
    { id: "scope", label: "核对任务范围", state: "done" as const },
    { id: "prepare", label: "生成校对稿", state: completed ? "done" as const : state === "failed" ? "error" as const : state === "accepted" ? "pending" as const : "running" as const },
  ]
  const notify = (text: string) => setFeedback(text)
  return <section aria-labelledby={`${id}-heading`} className="space-y-5 border-t pt-8">
    <div className="space-y-2"><h3 id={`${id}-heading`} className="text-section-title">确认、进度与结果如何组合</h3><p className="max-w-3xl text-ui-hint text-muted-foreground">最小呈现参照，不是三个已完成的组件。下拉框手动提供示例回执，不自动推进。</p></div>
    <Field><FieldLabel htmlFor={`${id}-state`}>外部回执示例</FieldLabel><QuestionSelect id={`${id}-state`} label="外部回执示例" value={state} items={flowItems} onChange={value => { setState(value as FlowState); setFeedback("") }} /></Field>
    <Card className="max-w-4xl gap-5 p-5 sm:p-6">
      <div className="space-y-2"><div className="flex flex-wrap items-start justify-between gap-3"><h4 ref={heading} tabIndex={-1} className="text-block-title">生成函数练习校对稿</h4><Badge variant="outline">手动示例</Badge></div><p className="text-ui-hint text-muted-foreground">高二（3）班 · 原稿 v2 · 第 1–3 页 · 仅生成待复核草稿</p></div>
      {state === "confirm" && <div className="space-y-4"><p className="text-read-body">按当前范围生成校对稿，保留来源版本。生成后仍需人工核对。</p><Button onClick={() => { setState("accepted"); notify("预演已进入接收状态，没有提交真实请求。"); heading.current?.focus({ preventScroll: true }) }}>确认生成<ArrowRight aria-hidden="true" /></Button></div>}
      {state === "stale" && <Alert variant="warning"><CircleAlert aria-hidden="true" /><AlertTitle>原稿已更新，本次确认已过期</AlertTitle><AlertDescription>原确认针对 v2，当前对象为 v3。核对变化后重新确认。</AlertDescription><div className="col-start-2 mt-3"><Button variant="outline" onClick={() => notify("示例：已向宿主发出查看当前版本的意图；尚未重新确认。")}>查看当前版本</Button></div></Alert>}
      {state === "unknown" && <Alert variant="warning"><CircleAlert aria-hidden="true" /><AlertTitle>执行状态未确认</AlertTitle><AlertDescription>本次请求可能仍在执行。先查询原执行结果，再决定是否恢复。</AlertDescription><div className="col-start-2 mt-3"><Button variant="outline" onClick={() => notify("示例查询已发出；没有收到新回执，状态继续保持未确认。")}>查询原执行结果</Button></div></Alert>}
      {state === "human" && <Alert variant="warning"><CircleAlert aria-hidden="true" /><AlertTitle>第 2 页有一处内容需要核对</AlertTitle><AlertDescription>原任务等待人工处理，已完成的工作保持不变。</AlertDescription><div className="col-start-2 mt-3"><Button variant="outline" onClick={() => notify("示例：请求打开原任务中的待核对位置；没有创建新任务。")}>查看待核对项</Button></div></Alert>}
      {state === "failed" && <Alert variant="error"><CircleAlert aria-hidden="true" /><AlertTitle>校对稿生成失败</AlertTitle><AlertDescription>示例回执明确失败，并允许对失败阶段请求重试；实际接入仍由服务核验。</AlertDescription><div className="col-start-2 mt-3"><Button variant="outline" onClick={() => notify("仅发出示例重试意图；未取得新回执，不改变失败事实。")}>请求重试失败阶段</Button></div></Alert>}
      {(state === "accepted" || state === "running") && <div className="space-y-3"><p className="text-ui-hint text-muted-foreground">已确认范围：原稿 v2 · 第 1–3 页。{state === "accepted" ? "示例请求已接收，等待处理。" : "示例任务正在生成校对稿。"}</p><AgentTaskProgress steps={lastKnownSteps} /></div>}
      {completed && <div className="space-y-4"><div className="flex items-start gap-3">{state === "complete" ? <Check className="mt-1 size-5 shrink-0 text-success-foreground" aria-hidden="true" /> : <CircleAlert className="mt-1 size-5 shrink-0 text-warning-foreground" aria-hidden="true" />}<div className="space-y-2"><p className="text-block-title">{state === "complete" ? "校对稿 v1 已生成" : "已生成可用部分，仍有 1 页待处理"}</p><p className="text-ui-body">{state === "complete" ? "第 1–3 页已整理为待复核草稿。" : "第 1、3 页已整理；第 2 页未能处理，成功部分保留。"}尚未入库或发布。</p></div></div><Button variant="outline" onClick={() => notify("示例：向宿主请求打开校对稿 v1；没有下载文件或发布结果。")}>查看校对稿</Button><details><summary className="cursor-pointer text-ui-action">查看过程摘要</summary><p className="mt-3 text-ui-hint text-muted-foreground">原稿 v2 → 示例执行第 1 轮 → 校对稿 v1。过程与结果保留各自版本；收起不改变事实。</p></details></div>}
      <p role="status" className="text-ui-hint text-muted-foreground">{feedback || "所有操作只作用于本页示例，刷新恢复初始状态。"}</p>
    </Card>
  </section>
}
