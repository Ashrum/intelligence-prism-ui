"use client"

import { useRef, useState } from "react"
import { AgentReviewQueue, type AgentReviewQueueItem, type AgentReviewQueueProps, type AgentReviewQueueBatchIntent } from "../agent-review-queue"
import { agentItemReviewLabels, type AgentItemReviewState } from "../agent-item-reviewer"
import { Button } from "../button"

type QueuePurpose = "p04" | "grading"
export const reviewQueueExamples: Record<QueuePurpose, { title: string; items: readonly AgentReviewQueueItem[] }> = {
  p04: {
    title: "P04 逐题校对队列 · 示例",
    items: [
      { id: "example-internal-question-one", title: "第 1 题 · 核对函数表达式", displayNumber: "第 1 题", typeLabel: "试题", version: "r1",
        review: { state: "waiting-human", description: "对照原稿，核对函数表达式与题目条件。" }, priority: { label: "优先", reason: "表达式会影响后续两题的解答。" }, assignee: "林老师", openable: true },
      { id: "example-internal-question-two", title: "第 2 题 · 核对对称轴与分式中的系数", displayNumber: "第 2 题", typeLabel: "试题", version: "r2",
        review: { state: "unknown", description: "提交后尚未确认回执，请查询原复核请求。", request: { id: "example-request-question-two", label: "第 2 题复核请求" } },
        priority: { label: "优先", reason: "先核对回执，避免重复确认。" }, assignee: "林老师", openable: true },
      { id: "example-internal-question-three", title: "第 3 题 · 核对人工修订后较长的中文题干与已更新的答案条件", displayNumber: "第 3 题", typeLabel: "试题", version: "r1",
        review: { state: "expired", description: "题目已修订，先前的复核结论已过期。" }, versionChange: { currentVersion: "r2", description: "保留已有修改，重新核对当前版本。" },
        priority: { label: "常规", reason: "前两题核对后继续。" }, assignee: "林老师", exceptions: [{ id: "example-conflict-three", label: "答案版本冲突", description: "原复核依据与当前题目版本不同。" }], openable: true },
    ],
  },
  grading: {
    title: "学生作答批阅复核队列 · 示例",
    items: [
      { id: "example-internal-answer-lin", title: "林同学 · 第 2 题作答", displayNumber: "作答 01", typeLabel: "学生作答", version: "v1",
        review: { state: "waiting-human", description: "已备齐原始作答，等待核对评分依据。" }, priority: { label: "优先", reason: "本轮先核对评分点一致性。" }, assignee: "林老师", openable: true, batchActionIds: ["confirm"] },
      { id: "example-internal-answer-chen", title: "陈同学 · 第 2 题作答", displayNumber: "作答 02", typeLabel: "学生作答", version: "v1",
        review: { state: "waiting-human", description: "请核对解题过程中的依据与得分。" }, priority: { label: "常规", reason: "按本轮作答顺序继续。" }, assignee: "林老师", openable: true, batchActionIds: ["confirm"] },
      { id: "example-internal-answer-wen", title: "温同学 · 第 2 题作答", displayNumber: "作答 03", typeLabel: "学生作答", version: "v2",
        review: { state: "draft", description: "评分理由正在修订，尚未提交。" }, priority: { label: "常规", reason: "等待负责教师完成当前修订。" }, assignee: "张老师",
        processingByOther: { name: "张老师", description: "正在核对原始作答，请稍后继续。" }, openable: true, batchActionIds: ["confirm"] },
    ],
  },
}

/** Explicit fixture inputs only. Requesting a batch cannot create a completed record. */
export function requestQueueExampleBatch(items: readonly AgentReviewQueueItem[], intent: AgentReviewQueueBatchIntent): AgentReviewQueueItem[] {
  return items.map(item => intent.actionId === "confirm" && intent.items.some(target => target.itemId === item.id && target.version === item.version)
    && item.review.state === "waiting-human" && !item.processingByOther && !item.versionChange
    ? { ...item, review: { state: "waiting", description: "示例确认请求已发出，等待本项回执。", request: { id: `example-request-${item.id}`, label: `${item.displayNumber}复核请求` } } } : item)
}

/** Separate manual receipt input, never called by the batch handler or a timer. */
export function receiveQueueExampleReceipt(items: readonly AgentReviewQueueItem[], itemId: string, version: string, outcome: "resolved" | "unknown"): AgentReviewQueueItem[] {
  return items.map(item => item.id === itemId && item.version === version && item.review.state === "waiting" && !item.versionChange
    ? { ...item, review: outcome === "resolved"
      ? { state: "resolved", description: "本项示例回执已确认。", resolution: { reviewer: "林老师", version, time: "2026-09-25 10:30（示例）" } }
      : { state: "unknown", description: "本项示例回执未确认，请逐项查询原请求。", request: item.review.request } } : item)
}

export function ReviewQueueExample({ purpose, narrow = false }: { purpose: QueuePurpose; narrow?: boolean }) {
  const fixture = reviewQueueExamples[purpose]
  const [items, setItems] = useState(fixture.items)
  const [selectedIds, setSelectedIds] = useState<readonly string[]>([])
  const [filters, setFilters] = useState<Record<string, string>>({ review: "all" })
  const [sort, setSort] = useState("priority")
  const [message, setMessage] = useState("")
  const workspace = useRef<HTMLElement>(null), trigger = useRef<HTMLButtonElement>(null)
  // Counts, filtering and order belong to this labelled demo host, never the queue component.
  const counts: Partial<Record<AgentItemReviewState, number>> = {}
  for (const item of items) counts[item.review.state] = (counts[item.review.state] ?? 0) + 1
  const rows = items.filter(item => filters.review === "all" || item.review.state === filters.review)
  if (sort === "reverse") rows.reverse()
  const reportOpen: NonNullable<AgentReviewQueueProps["onOpen"]> = target => {
    const item = items.find(item => item.id === target.itemId)
    setMessage(`已请求打开${item?.title || "所选对象"}，进入单项复核。此处仅展示示例操作记录。`)
  }
  const common: AgentReviewQueueProps = {
    title: fixture.title, queue: { id: `example-queue-${purpose}`, version: "v1" }, items: rows, counts,
    progress: { reviewed: counts.resolved ?? 0, total: items.length }, selectedIds, onSelectionChange: purpose === "grading" ? setSelectedIds : undefined,
    batchActions: purpose === "grading" ? [{ id: "confirm", label: "批量确认", impact: "仅确认所选作答的当前依据版本；结果逐项记录。" }] : undefined,
    onBatchAction: intent => { setItems(previous => requestQueueExampleBatch(previous, intent)); setMessage("已发出示例批量确认，等待逐项回执。"); },
    nextItemId: rows.find(item => !item.processingByOther && item.review.state !== "resolved")?.id, onNext: reportOpen, onOpen: reportOpen,
    onInspectException: target => setMessage(`已请求查看${items.find(item => item.id === target.itemId)?.title}的异常记录。`),
    filters: { fields: [{ id: "review", label: "复核状态", options: [{ value: "all", label: "全部状态" }, ...Object.entries(agentItemReviewLabels).map(([value, label]) => ({ value, label }))] }], value: filters, onChange: setFilters },
    sort: { field: { id: "order", label: "排列方式", options: [{ value: "priority", label: "示例优先顺序" }, { value: "reverse", label: "示例倒序" }] }, value: sort, onChange: setSort },
    onExpand: element => { trigger.current = element; workspace.current?.focus({ preventScroll: true }); workspace.current?.scrollIntoView({ block: "nearest", behavior: "instant" }) },
    onBack: () => { trigger.current?.focus(); trigger.current?.scrollIntoView({ block: "nearest", behavior: "instant" }) },
    notice: "固定示例，未连接真实复核服务。",
    details: <p>队列负责查看全部、选择下一项与批量处理。单题的原稿、修订和查询在单项复核中完成；例如对称轴 <math className="prism-math" aria-label="x 等于负 b 除以二 a"><mi>x</mi><mo>=</mo><mo>−</mo><mfrac><mi>b</mi><mrow><mn>2</mn><mi>a</mi></mrow></mfrac></math>。展开和返回保留当前选择。</p>,
  }
  return <div className="min-w-0 space-y-5">
    {purpose === "grading" && <section aria-label="逐项示例回执" className="space-y-3">
      <p className="text-ui-hint">在完整队列中选择前两份作答并批量确认，再分别载入回执。</p>
      <div className="flex flex-wrap gap-3">{items.filter(item => !item.processingByOther).map((item, index) => <Button key={item.id} type="button" variant="outline"
        disabled={item.review.state !== "waiting"} className="max-w-full whitespace-normal"
        onClick={() => setItems(previous => receiveQueueExampleReceipt(previous, item.id, item.version, index === 0 ? "resolved" : "unknown"))}>
        载入{item.displayNumber}示例回执（{index === 0 ? "已复核" : "未确认"}）
      </Button>)}</div>
    </section>}
    {message && <p role="status" className="text-ui-hint">{message}</p>}
    <div className="grid min-w-0 gap-6">{([
      ["inline", "default", "待办摘要"], ["workspace", "default", "批量审核工作区"], ["inline", "compact", "紧凑待办摘要"],
    ] as const).map(([view, density, label]) => <section key={label} aria-label={label} ref={view === "workspace" ? workspace : undefined}
      tabIndex={view === "workspace" ? -1 : undefined} className={`min-w-0 space-y-3 ${narrow ? "w-full max-w-[320px]" : ""}`}>
      <h3 className="text-block-title">{label}</h3><AgentReviewQueue {...common} view={view} density={density} />
    </section>)}</div>
  </div>
}

export function AgentReviewQueueDemo() {
  const [purpose, setPurpose] = useState<QueuePurpose>("p04"), [narrow, setNarrow] = useState(false)
  return <section id="review-queue" className="mb-12 min-w-0 space-y-5">
    <h2 className="text-section-title">审核队列 v0.1 · 设计候选</h2>
    <div className="flex flex-wrap gap-3">{(["p04", "grading"] as const).map(value => <Button key={value} type="button" size="navigation" variant={purpose === value ? "secondary" : "outline"}
      aria-pressed={purpose === value} onClick={() => setPurpose(value)}>{value === "p04" ? "P04 逐题校对示例" : "批阅复核示例"}</Button>)}
      <Button type="button" size="navigation" variant="outline" aria-pressed={narrow} onClick={() => setNarrow(value => !value)}>320px 窄容器</Button>
    </div>
    <ReviewQueueExample key={purpose} purpose={purpose} narrow={narrow} />
  </section>
}
