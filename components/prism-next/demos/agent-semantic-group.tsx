"use client"

import { useId, useRef, useState } from "react"
import { ArrowUpRight, ChevronDown } from "lucide-react"
import { Button } from "@/components/coss/button"
import { Card } from "@/components/coss/card"
import { Field, FieldLabel } from "@/components/coss/field"
import { Tabs, TabsList, TabsTab, TabsPanel } from "@/components/coss/tabs"
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "@/components/coss/collapsible"
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription, DialogPanel } from "@/components/coss/dialog"
import { Badge } from "../badge"
import { QuestionSelect } from "../question-controls"
import { AgentChangeReview, type AgentChangeDecision, type AgentStep } from "../agent-components"
import { AgentContextSummary, type AgentContextFact, type AgentContextSource } from "../agent-context-summary"
import { AgentArtifactPreview, AgentExecutionConfirmation, AgentExecutionProgress, AgentExecutionResult, type AgentConfirmationState, type AgentExecutionReceipt, type AgentProgressState } from "../agent-semantic-components"

const sections = [
  { value: "preview", label: "摘要预览" }, { value: "context", label: "上下文摘要" },
  { value: "comparison", label: "对比查看" }, { value: "confirmation", label: "执行确认" },
  { value: "progress", label: "任务进度" }, { value: "result", label: "执行结果" },
  { value: "composition", label: "组合示例" },
]
type RecordState = "partial" | "complete" | "absent" | "unavailable" | "historical" | "empty"
const recordItems = [
  { value: "partial", label: "部分记录待确认" }, { value: "complete", label: "有对应记录" },
  { value: "absent", label: "完整记录中无事件" }, { value: "unavailable", label: "记录暂不可用" },
  { value: "historical", label: "历史版本" }, { value: "empty", label: "无来源条目" },
]
type FlowState = "ready" | "submitting" | "received" | "queued" | "running" | "paused" | "waiting-human" | "degraded" | "retrying" | "stale" | "readonly" | "unknown" | "complete" | "partial" | "failed"
const flowItems: { value: FlowState; label: string }[] = [
  { value: "ready", label: "条件齐备 · 待确认" }, { value: "submitting", label: "提交中" }, { value: "received", label: "请求已接收" },
  { value: "queued", label: "排队中" }, { value: "running", label: "执行中" }, { value: "paused", label: "已暂停" },
  { value: "waiting-human", label: "待人工处理" }, { value: "degraded", label: "已降级" }, { value: "retrying", label: "重试中" },
  { value: "stale", label: "确认依据已过期" },
  { value: "readonly", label: "当前只读" }, { value: "unknown", label: "回执未确认" },
  { value: "complete", label: "已完成" }, { value: "partial", label: "部分完成" }, { value: "failed", label: "明确失败" },
]

function sourcesFor(preparation: boolean, state: RecordState): AgentContextSource[] {
  if (state === "empty") return []
  const absent: AgentContextFact = { state: "absent" }
  const unresolved: AgentContextFact = { state: state === "unavailable" ? "unavailable" : state === "absent" ? "absent" : "unknown" }
  const known = state === "complete" || state === "historical"
  return [
    { id: "main", title: preparation ? "函数教学参考 · 单调性" : "函数单元练习.pdf", location: "原稿 v2 · 第 1–3 页", selection: "selected",
      read: state === "unavailable" || state === "absent" ? unresolved : { state: "confirmed", description: "服务已读取 · 第 1–3 页" },
      context: known ? { state: "confirmed", description: "本轮使用 · 第 1–3 页" } : unresolved,
      citation: known ? { state: "confirmed", description: preparation ? "提纲 v1 · 第 2 节" : "校对稿 v1 · 第 1–6 题" } : unresolved,
      details: [{ label: "来源版本", value: "原稿 v2；仅覆盖第 1–3 页" }, { label: "对应执行", value: "示例任务 · 第 1 轮" }] },
    { id: "extra", title: preparation ? "往年教学活动记录" : "教师补充说明.txt", location: "材料 v1 · 个人提供", selection: "not-selected",
      read: state === "unavailable" ? unresolved : absent, context: state === "unavailable" ? unresolved : absent, citation: state === "unavailable" ? unresolved : absent,
      details: [{ label: "记录范围", value: "示例假设此材料记录覆盖完整，没有对应事件" }] },
  ]
}

function progressFor(state: FlowState, preparation: boolean): { state: AgentProgressState; description: string; steps: AgentStep[] } {
  const initial = ["ready", "stale", "readonly", "submitting", "received", "queued"].includes(state)
  const terminal = state === "complete" || state === "partial"
  const states: Record<FlowState, AgentProgressState> = {
    ready: "pending", stale: "pending", readonly: "pending", submitting: "pending", received: "pending",
    queued: "queued", running: "running", paused: "paused", "waiting-human": "waiting-human",
    degraded: "degraded", retrying: "retrying", unknown: "unknown", complete: "completed", partial: "partial", failed: "failed",
  }
  const descriptions: Record<FlowState, string> = {
    ready: "尚未提交任务。", submitting: "提交请求中，尚未收到接收回执。", received: "服务已接收请求，尚未报告开始执行。",
    queued: "示例状态为排队中，尚未报告执行步骤。",
    running: preparation ? "正在整理第 2 节，保留对应来源。" : "正在整理第 2 页，保留原题与来源。",
    paused: "示例状态为已暂停，保留最后步骤记录。执行状态来源未接入。",
    "waiting-human": preparation ? "第 2 节有一项材料冲突，等待人工核对。" : "第 2 页有一处文字不清，等待人工核对。",
    degraded: "示例状态为已降级，保留最后步骤记录。执行状态来源未接入，不据此判断任务成功或失败。",
    retrying: "示例状态为重试中，保留最后步骤记录。执行状态来源未接入，不由重试按钮推定。",
    stale: "当前原稿为 v3，原确认依据 v2 已过期。", readonly: "宿主提供只读状态，不能提交。",
    unknown: "连接中断，当前执行状态未确认。下方只保留最后收到的步骤。",
    complete: "本轮整理已完成，成果仍需人工复核。", partial: "可用部分已保留，未完成范围单独列出。", failed: "服务回执明确报告整理阶段失败。",
  }
  return {
    state: states[state],
    description: descriptions[state],
    steps: [
      { id: "read", label: "读取指定范围", state: initial ? "pending" : "done", detail: "原稿 v2 · 第 1–3 页" },
      { id: "organize", label: preparation ? "整理教学提纲" : "整理题目与答案", state: initial ? "pending" : state === "failed" || state === "partial" ? "error" : terminal ? "done" : "running", detail: state === "partial" ? "第 2 页未处理，其他部分已保留" : undefined },
      { id: "draft", label: "生成待复核草稿", state: terminal ? "done" : "pending", detail: state === "partial" ? "仅包含已完成部分" : undefined },
    ],
  }
}

/** Local, manual fixtures only. No service, store, authorization decision or execution loop. */
export function AgentSemanticGroupDemo() {
  const id = useId(), flowHeading = useRef<HTMLHeadingElement>(null), dialogReturnFocus = useRef<HTMLElement | null>(null)
  const [section, setSection] = useState("preview"), [purpose, setPurpose] = useState("parsing"), [narrow, setNarrow] = useState(false)
  const [record, setRecord] = useState<RecordState>("partial"), [contextExpanded, setContextExpanded] = useState(false)
  const [previewState, setPreviewState] = useState("current"), [comparisonState, setComparisonState] = useState("current")
  const [decision, setDecision] = useState<AgentChangeDecision>("pending")
  const [confirmationState, setConfirmationState] = useState<FlowState>("ready"), [progressState, setProgressState] = useState<FlowState>("running")
  const [resultState, setResultState] = useState<FlowState>("partial"), [flow, setFlow] = useState<FlowState>("ready")
  const [stepsExpanded, setStepsExpanded] = useState(true), [flowStepsExpanded, setFlowStepsExpanded] = useState(false), [confirmationExpanded, setConfirmationExpanded] = useState(false)
  const [feedback, setFeedback] = useState(""), [dialog, setDialog] = useState<{ title: string; description: string; content: string } | null>(null)
  const openDialog = (value: NonNullable<typeof dialog>) => { dialogReturnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; setDialog(value) }
  const preparation = purpose === "preparation"
  const artifact = preparation ? "函数复习课教学提纲" : "函数单元练习校对稿"
  const source = preparation ? "函数教学参考 · 单调性" : "函数单元练习.pdf"
  const task = preparation ? "整理一节函数复习课" : "整理函数单元练习"
  const before = preparation ? "复习函数单调性。讲解例题。练习与总结。" : "已知函数 f(x) = x² − 2x + 1，求函数的最小值，并说明函数的单调区间。"
  const after = preparation ? "一、回顾函数单调性的定义\n二、例题讲解与判断依据\n三、独立练习与课堂总结" : "已知函数 f(x) = x² − 2x + 1。\n（1）求函数的最小值；\n（2）说明函数的单调区间。"
  const sources = sourcesFor(preparation, record)
  const viewArtifact = (partial = false, historical = false) => openDialog({ title: `${artifact} · ${historical ? "历史 v1" : "v1"}`, description: partial ? "示例成果 · 仅第 1、3 页；第 2 页尚未处理。" : "示例成果 · 原稿 v2 · 第 1–3 页；待人工复核。", content: partial ? (preparation ? "第 1 节：学习目标与内容范围。\n第 3 节：课堂练习与总结。\n\n第 2 节尚未整理，不补造缺失内容。" : "第 1 页：函数定义与单调性，共 2 题。\n第 3 页：奇偶性综合练习，共 2 题。\n\n第 2 页尚未整理，不补造题目或答案。") : (preparation ? after : `${after}\n\n参考答案与解题步骤尚待人工复核。`) })
  const notify = (text: string) => setFeedback(text)
  const query = { label: "查询原执行结果", onAction: () => notify("已演示查询原执行的意图；没有新回执，状态继续保持未确认。") }
  const inspectWaiting = { label: "查看待核对项", onAction: () => openDialog({ title: "第 2 页 · 待核对位置", description: "示例定位；返回后保留原任务与已完成部分。", content: preparation ? "两份材料的教学顺序不一致，需要人工确定依据。查看本身不会恢复执行。" : "第 3 题的条件文字不清，需要对照原稿核对。查看本身不会恢复执行。" }) }
  const confirmationFor = (state: FlowState, onConfirm: () => void): AgentConfirmationState => {
    if (state === "ready") return { state: "ready", confirm: { label: "确认生成草稿", onAction: onConfirm } }
    if (state === "submitting") return { state: "submitting", description: "请求正在提交，尚未收到接收回执。" }
    if (state === "received") return { state: "received", description: "请求已接收。该回执不代表已经开始或完成。" }
    if (state === "stale") return { state: "blocked", description: "原稿已从 v2 更新为 v3。核对当前版本后，需要重新确认。", review: { label: "查看当前版本", onAction: () => openDialog({ title: "原稿 v3 · 变更摘要", description: "示例当前版本；原确认仍保持过期。", content: "第 2 页的题目条件发生变化。真实接入时，由宿主重新提供范围、差异与可用操作。" }) } }
    if (state === "readonly") return { state: "blocked", description: "当前仅可查看。操作能力由宿主提供，确认入口暂不可用。" }
    if (state === "unknown") return { state: "unknown", description: "提交结果未确认，先查询原执行，避免重复提交。", query }
    return { state: "recorded", description: "保留当时确认的对象、版本和影响范围。" }
  }
  const renderConfirmation = (state: FlowState, onConfirm: () => void, inline = false) => <AgentExecutionConfirmation title="生成待复核草稿" target={`${artifact} · 第 1–3 页`} version="原稿 v2 · 本轮选用范围" effects={[preparation ? "按现有材料整理提纲，保留来源定位。" : "仅整理原有题目与答案，保留来源定位。", "生成后仍需人工核对；不会入库或发布。"]} confirmation={confirmationFor(state, onConfirm)} presentation={inline ? "inline" : "card"} />
  const renderPreview = (inline = false, partial = false) => <AgentArtifactPreview title={artifact} version={previewState === "historical" && !inline ? "草稿 v1 · 当时版本" : "草稿 v1"} status="待复核" summary={preparation ? "围绕函数单调性与奇偶性，整理目标、例题和课堂练习。" : "按原稿顺序整理题目与参考答案，保留每道题的来源位置。"} facts={[{ label: "内容范围", value: partial ? (preparation ? "第 1、3 页 · 2 个教学环节" : "第 1、3 页 · 4 题") : preparation ? "40 分钟 · 3 个教学环节" : "第 1–3 页 · 6 题" }, { label: "发布情况", value: "尚未发布" }]} snapshot={previewState === "historical" && !inline ? "2026-09-21" : undefined} open={previewState === "unavailable" && !inline ? undefined : { label: partial ? "查看已生成部分" : "打开草稿", onAction: () => viewArtifact(partial, previewState === "historical" && !inline) }} notice={previewState === "unavailable" && !inline ? "当前只能查看摘要，宿主未提供打开原对象的能力。" : undefined} presentation={inline ? "inline" : "card"}>
    {!inline && <div className="space-y-3"><p className="text-ui-action">{preparation ? "提纲节选" : "第 3 题 · 内容节选"}</p><p className="whitespace-pre-wrap text-read-body">{after}</p><p className="text-ui-hint text-muted-foreground">来源：{source} · 原稿 v2 · 第 2 页</p></div>}
  </AgentArtifactPreview>
  const renderResult = (state: FlowState, inline = false) => {
    const partial = state === "partial", failed = state === "failed", unknown = state === "unknown"
    const receipt: AgentExecutionReceipt = unknown ? { status: "unknown", query } : {
      status: failed ? "failed" : partial ? "partial" : "succeeded",
      completed: failed ? ["已读取原稿 v2 的指定范围"] : [partial ? "第 1、3 页已整理为草稿 v1" : "第 1–3 页已整理为草稿 v1", "已保留对应来源定位"],
      remaining: failed ? ["内容整理失败，未生成本轮草稿"] : partial ? ["第 2 页内容无法识别，尚未整理"] : [],
      next: failed ? { label: "请求重试失败阶段", onAction: () => notify("已演示重试意图；未取得新回执，失败事实保持不变。") } : undefined,
      secondary: partial ? { label: "处理未完成部分", onAction: inspectWaiting.onAction } : undefined,
    }
    return <AgentExecutionResult title={unknown ? "尚不能确认本轮结果" : failed ? "本轮未能生成草稿" : partial ? "已保留可用部分" : "草稿已生成"} description={unknown ? "请求可能仍在执行。先查询同一次执行，再决定下一步。" : failed ? "整理阶段返回明确失败。已读取的材料记录仍保留。" : partial ? "成功部分可先查看，第 2 页需要另行处理。" : "整理工作已完成，内容仍待人工复核。"} receipt={receipt} facts={[{ label: "对应执行", value: "示例任务 · 第 1 轮" }, { label: "输入依据", value: "原稿 v2 · 第 1–3 页" }]} presentation={inline ? "inline" : "card"}>{!unknown && !failed && <div className="border-t pt-5">{renderPreview(true, partial)}</div>}</AgentExecutionResult>
  }
  const chooseFlow = (value: string) => { setFlow(value as FlowState); setFeedback(""); setConfirmationExpanded(false); setFlowStepsExpanded(value === "running" || value === "waiting-human") }
  const flowProgress = progressFor(flow, preparation), standaloneProgress = progressFor(progressState, preparation)
  const hasResult = ["unknown", "complete", "partial", "failed"].includes(flow)
  const beforeSubmission = ["ready", "stale", "readonly"].includes(flow)
  const controls = section === "context" ? { label: "记录情况", value: record, items: recordItems, change: (value: string) => setRecord(value as RecordState) }
    : section === "preview" ? { label: "查看状态", value: previewState, items: [{ value: "current", label: "当前成果" }, { value: "unavailable", label: "仅摘要可用" }, { value: "historical", label: "历史版本" }, { value: "empty", label: "尚无成果" }], change: setPreviewState }
    : section === "comparison" ? { label: "建议状态", value: comparisonState, items: [{ value: "current", label: "可决定" }, { value: "stale", label: "依据已变化" }, { value: "readonly", label: "只读查看" }], change: (value: string) => { setComparisonState(value); setDecision("pending") } }
    : section === "confirmation" ? { label: "确认状态", value: confirmationState, items: flowItems.filter(item => ["ready", "submitting", "received", "stale", "readonly", "unknown", "complete"].includes(item.value)), change: (value: string) => setConfirmationState(value as FlowState) }
    : section === "progress" ? { label: "执行状态", value: progressState, items: flowItems.filter(item => ["received", "queued", "running", "paused", "waiting-human", "degraded", "retrying", "unknown", "complete", "partial", "failed"].includes(item.value)), change: (value: string) => setProgressState(value as FlowState) }
    : section === "result" ? { label: "结果回执", value: resultState, items: flowItems.filter(item => ["complete", "partial", "failed", "unknown"].includes(item.value)), change: (value: string) => setResultState(value as FlowState) }
    : { label: "外部状态示例", value: flow, items: flowItems, change: chooseFlow }
  const recordNotices = {
    partial: "主材料有读取记录；本轮上下文使用与成果引用仍待确认。", complete: "三类记录分别对应来源版本和本轮任务；引用关系不证明结论正确。",
    absent: "示例设定：记录覆盖完整，未发现对应读取、上下文或引用事件。", unavailable: "记录来源暂不可用，不能据此判断材料是否被读取或引用。",
    historical: "仅展示当时的任务记录，不代表当前模型上下文。", empty: undefined,
  }

  return <section id="context-summary-review" aria-labelledby={`${id}-heading`} className="scroll-mt-24 space-y-6">
    <div className="space-y-2"><div className="flex flex-wrap items-center gap-3"><h2 id={`${id}-heading`} className="text-section-title">从任务依据到执行结果</h2><Badge variant="outline">第一组 · v0.1 候选</Badge></div><p className="max-w-3xl text-ui-hint text-muted-foreground">六项语义，按需独立使用或组合。以下均为手动示例数据，操作仅影响本页展示。</p></div>
    <Tabs value={section} onValueChange={value => { setSection(String(value)); setFeedback("") }} className="min-w-0 gap-6">
      <div className="max-w-full overflow-x-auto pb-1"><TabsList variant="underline" aria-label="Agent 语义组件">{sections.map(item => <TabsTab key={item.value} value={item.value}>{item.label}</TabsTab>)}</TabsList></div>
      <div className="flex flex-wrap items-end gap-4">
        <Field><FieldLabel htmlFor={`${id}-purpose`}>示例用途</FieldLabel><QuestionSelect id={`${id}-purpose`} label="示例用途" value={purpose} items={[{ value: "parsing", label: "试卷解析" }, { value: "preparation", label: "备课资源" }]} onChange={value => { setPurpose(value); setDecision("pending"); setFlow("ready"); setConfirmationState("ready"); setFeedback(""); setDialog(null) }} /></Field>
        <Field><FieldLabel htmlFor={`${id}-state`}>{controls.label}</FieldLabel><QuestionSelect id={`${id}-state`} label={controls.label} value={controls.value} items={controls.items} onChange={value => { controls.change(value); setFeedback("") }} /></Field>
        <Button variant="outline" aria-pressed={narrow} onClick={() => setNarrow(!narrow)}>{narrow ? "恢复可用宽度" : "检查窄容器"}</Button>
      </div>
      <div className={narrow ? "w-full max-w-sm" : "w-full max-w-4xl"} data-agent-semantic-fixture>
        <TabsPanel value="preview">{previewState === "empty" ? <Card className="gap-3 p-6"><h3 className="text-block-title">尚无成果记录</h3><p className="text-ui-hint text-muted-foreground">当前没有可预览对象。是否正在生成，请查看对应执行的回执。</p></Card> : renderPreview()}</TabsPanel>
        <TabsPanel value="context"><AgentContextSummary title={task} scope={[{ label: "任务对象", value: "高二（3）班 · 数学" }, { label: "内容范围", value: "函数单调性与奇偶性" }, { label: "要求", value: preparation ? "40 分钟；保留材料来源，班级学情尚未接入" : "仅整理已有题目与答案，不补造缺失内容" }]} sources={sources} expanded={contextExpanded} onExpandedChange={setContextExpanded} onInspect={sourceId => { const found = sources.find(item => item.id === sourceId); if (found) openDialog({ title: found.title, description: `示例定位 · ${found.location}`, content: "此处展示宿主提供的来源查看内容。打开来源不会改变选用、读取、本轮上下文或成果引用记录。" }) }} notice={recordNotices[record] ? { text: recordNotices[record], tone: record === "partial" || record === "unavailable" ? "warning" : "info" } : undefined} snapshot={record === "historical" ? "快照 · 2026-09-21" : undefined} /></TabsPanel>
        <TabsPanel value="comparison"><AgentChangeReview title={preparation ? "让教学环节更清楚" : "将条件与两个问题分开"} before={before} after={after} beforeLabel="原稿 v2 · 建议依据" afterLabel="候选 v1 · 排版建议" reason="调整表达和阅读顺序，保留原有内容。采用仅记录本页内容选择，核对状态由宿主提供。" scope="采纳范围：仅当前段落的本页草稿；不会修改原稿、入库或发布。" decision={decision} onDecision={value => { setDecision(value); notify(value === "accepted" ? "已在本页选择候选内容，尚未保存。" : "已在本页选择保留原文。") }} onResetDecision={() => { setDecision("pending"); notify("已撤回本页选择，可重新决定。") }} disabled={comparisonState !== "current"} disabledReason={comparisonState === "stale" ? "当前原稿已更新到 v3，旧候选不能覆盖新内容。" : comparisonState === "readonly" ? "当前只读，宿主未提供采纳能力。" : undefined} /></TabsPanel>
        <TabsPanel value="confirmation">{renderConfirmation(confirmationState, () => notify("已演示提交意图；状态由调用方提供，可用上方选择器查看其他状态。"))}</TabsPanel>
        <TabsPanel value="progress"><AgentExecutionProgress title={task} {...standaloneProgress} expanded={stepsExpanded} onExpandedChange={setStepsExpanded} updatedAt="最后回执 · 2026-09-22 10:24（示例）" action={progressState === "waiting-human" ? inspectWaiting : progressState === "unknown" ? query : undefined} /></TabsPanel>
        <TabsPanel value="result">{renderResult(resultState)}</TabsPanel>
        <TabsPanel value="composition"><Card className="gap-6 p-5 sm:p-6"><div className="space-y-2"><div className="flex flex-wrap items-start justify-between gap-3"><h3 ref={flowHeading} tabIndex={-1} className="text-section-title outline-none">{task}</h3><Badge variant="outline">同一次执行</Badge></div><p className="text-ui-hint text-muted-foreground">高二（3）班 · 数学 · 原稿 v2 · 第 1–3 页</p></div>
          {hasResult && renderResult(flow, true)}
          {beforeSubmission || flow === "submitting" || flow === "received" ? renderConfirmation(flow, () => { notify("已演示提交意图；未收到回执，保留当前状态。可用上方状态选择器继续查看。"); requestAnimationFrame(() => flowHeading.current?.focus({ preventScroll: true })) }, true) : null}
          {!beforeSubmission && <div className={hasResult ? "border-t pt-5" : undefined}><AgentExecutionProgress title="执行过程" {...flowProgress} expanded={flowStepsExpanded} onExpandedChange={setFlowStepsExpanded} updatedAt={flow === "submitting" ? undefined : "最后回执 · 10:24（示例）"} action={flow === "waiting-human" ? inspectWaiting : undefined} presentation="inline" /></div>}
          {!beforeSubmission && flow !== "submitting" && flow !== "received" && <Collapsible open={confirmationExpanded} onOpenChange={setConfirmationExpanded}><CollapsibleTrigger render={<Button variant="ghost" size="sm" />}><ChevronDown aria-hidden="true" className={confirmationExpanded ? "rotate-180" : undefined} />{confirmationExpanded ? "收起当时确认的范围" : "查看当时确认的范围"}</CollapsibleTrigger><CollapsiblePanel className="motion-reduce:transition-none"><div className="pt-5">{renderConfirmation("complete", () => {}, true)}</div></CollapsiblePanel></Collapsible>}
        </Card><p className="mt-4 text-ui-hint text-muted-foreground">确认区先说明影响；收到回执后保留确认范围；结果优先呈现，过程可展开。示例状态由上方选择器提供。</p></TabsPanel>
      </div>
    </Tabs>
    <p role="status" aria-live="polite" className="min-h-6 text-ui-hint text-muted-foreground">{feedback}</p>
    <Collapsible><CollapsibleTrigger render={<Button variant="ghost" size="sm" />}>查看复用与接入边界<ArrowUpRight aria-hidden="true" /></CollapsibleTrigger><CollapsiblePanel className="motion-reduce:transition-none"><p className="max-w-3xl pt-3 text-ui-hint text-muted-foreground">上下文、对比和步骤复用已有候选；预览、确认与结果由外部数据控制。操作只返回意图，Workspace 提供对象、能力与宿主承载；真实执行、存储、权限和回执由接入方负责。当前为组件评审候选，尚未完成业务接入验收。</p></CollapsiblePanel></Collapsible>
    <Dialog open={!!dialog} onOpenChange={open => !open && setDialog(null)}><DialogPopup finalFocus={dialogReturnFocus} closeProps={{ "aria-label": "关闭预览" }}><DialogHeader><DialogTitle>{dialog?.title}</DialogTitle><DialogDescription>{dialog?.description}</DialogDescription></DialogHeader><DialogPanel><p className="whitespace-pre-wrap break-words text-read-body">{dialog?.content}</p></DialogPanel></DialogPopup></Dialog>
  </section>
}
