"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/coss/button"
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription, DialogPanel } from "@/components/coss/dialog"
import { AgentContextSummary, type AgentContextSummaryProps } from "../agent-context-summary"
import { AgentExecutionProgress, AgentExecutionResult, type AgentExecutionProgressProps, type AgentExecutionResultProps } from "../agent-semantic-components"
import { DraftMathPreview } from "../draft-math-preview"

/** Fixed demonstration facts only. No Workspace adapter, execution or evidence verification. */
export const recordViewExamples: Record<"p04" | "preparation", {
  label: string; progress: AgentExecutionProgressProps; result: AgentExecutionResultProps; context: AgentContextSummaryProps
}> = {
  p04: {
    label: "P04 扫描整理",
    progress: {
      title: "二次函数扫描材料整理 · 示例", state: "waiting-human", description: "第 3 页文字模糊，等待核对；第 1、2、4 页记录保留。",
      run: { id: "demo-p04-r2", label: "第 2 轮", version: "示例包 v2" }, updatedAt: "更新于 2026-09-24 09:20", expanded: true,
      steps: [{ id: "read", label: "读取第 1、2、4 页", state: "done", time: "09:18", detail: "示例读取记录，仅覆盖标明页码。" }, { id: "proof", label: "核对第 3 页", state: "running", time: "09:19", detail: "上次进行到此处，当前等待教师处理。" }],
      stages: [{ id: "organize", title: "内容整理", state: "partial", time: "09:19", description: "三个清晰页面已整理。", steps: [{ id: "draft", label: "形成待校对稿", state: "done", time: "09:19" }] }],
      exceptions: [{ id: "blur", title: "第 3 页文字模糊", description: "无法核对二次函数的条件。", time: "09:19", resolution: "教师已要求补充清晰原稿；尚无后续回执。" }],
      history: [{ id: "demo-p04-r1", label: "第 1 轮", version: "示例包 v1", state: "running", description: "保留当时记录，后续状态未确认。", updatedAt: "当时更新于 2026-09-23 16:40", steps: [{ id: "old", label: "整理原稿 v1", state: "running", time: "16:40", detail: "只代表当时位置。" }], exceptions: [] }],
    },
    result: {
      title: "扫描整理回执 · 示例", description: "保留可用部分，第 3 页尚未整理。", receipt: { status: "partial", completed: ["第 1、2、4 页形成校对稿 v2"], remaining: ["第 3 页待补充清晰原稿"], record: { request: "扫描整理请求 02 · 示例", run: "第 2 轮", version: "回执 v1", receivedAt: "2026-09-24 09:20" } },
      outputs: [{ id: "demo-p04-output", title: "二次函数练习校对稿：保留原题条件、分式与长中文说明", version: "校对稿 v2", status: "待人工核对" }, { id: "demo-p04-note", title: "原稿问题清单", version: "清单 v1", status: "记录暂不可用" }],
      failures: [{ id: "page3", title: "第 3 页整理失败", description: "示例回执记录：图像文字无法辨认。", resolution: "待补充材料。" }],
    },
    context: {
      title: "扫描整理依据 · 示例", scope: [{ label: "任务范围", value: "二次函数原稿第 1–4 页" }], expanded: true,
      notice: { text: "固定示例记录，非真实扫描识别证据。", tone: "info" },
      sources: [{ id: "demo-p04-source", title: "二次函数扫描原稿", version: "原稿 v2", location: "第 1–4 页", selection: "selected", selectionDetail: { version: "原稿 v2", location: "第 1–4 页" },
        read: { state: "confirmed", description: "本机已读取指定页面", version: "原稿 v2", location: "第 1、2、4 页" }, context: { state: "unknown", description: "本轮参考记录不完整。" }, citation: { state: "unavailable", description: "引用记录暂不可查询。" }, details: [{ label: "对应执行", value: "第 2 轮 · 示例" }] },
      { id: "demo-p04-extra", title: "补充参考答案", version: "答案 v1", location: "第 2 页", selection: "unknown", read: { state: "unknown" }, context: { state: "unknown" }, citation: { state: "unknown" }, inspectable: false }],
    },
  },
  preparation: {
    label: "备课资料整理",
    progress: {
      title: "函数复习课资料整理 · 示例", state: "running", description: "正在整理教学环节；导出结果仍未确认。", run: { id: "demo-prep-r3", label: "第 3 轮", version: "材料 v3" }, updatedAt: "更新于 2026-09-24 10:05", expanded: true,
      steps: [{ id: "scope", label: "确定本节复习范围", state: "done", time: "10:00" }, { id: "outline", label: "整理学习目标与教学环节", state: "running", time: "10:05", detail: "保留已有手工批注。" }],
      stages: [{ id: "references", title: "参考材料核验", state: "unknown", description: "部分执行记录暂未返回。", steps: [] }], exceptions: [],
      history: [{ id: "demo-prep-r2", label: "第 2 轮", version: "材料 v2", state: "partial", description: "当时仅完成学习目标。", updatedAt: "当时更新于 2026-09-23 15:00", steps: [{ id: "goal", label: "学习目标", state: "done" }], exceptions: [{ id: "record", title: "缺少环节记录", description: "记录覆盖范围未确认。" }] }],
    },
    result: {
      title: "备课资料导出回执 · 示例", description: "尚未取得原导出请求的完整回执。", receipt: { status: "unknown", record: { request: "资料导出请求 03 · 示例", run: "第 3 轮" } },
      outputs: [{ id: "demo-prep-output", title: "函数复习课教学提纲", version: "提纲 v2", status: "已有草稿记录；导出状态未确认" }], failures: [],
    },
    context: {
      title: "备课资料依据 · 示例", scope: [{ label: "教学范围", value: "函数单调性 · 40 分钟复习课" }], expanded: true,
      notice: { text: "固定示例记录，非真实教学或引用证据。", tone: "info" },
      sources: [{ id: "demo-prep-source", title: "函数单调性教学参考与往年课堂记录", version: "参考 v3", location: "第 2 节", selection: "not-selected",
        read: { state: "confirmed", description: "本机读取了节选", version: "参考 v3", location: "第 2 节第 1 段" }, context: { state: "absent", description: "本轮参考记录完整，无对应事件。" }, citation: { state: "confirmed", description: "教学提纲保留了引用关系", version: "提纲 v2", location: "第 1 环节脚注 1" }, details: [{ label: "引用来源版本", value: "参考 v3" }], inspectable: false },
      { id: "demo-prep-extra", title: "教学活动补充材料", version: "补充 v1", location: "第 1 页", selection: "unavailable", read: { state: "unavailable" }, context: { state: "unknown" }, citation: { state: "absent" }, inspectable: false }],
    },
  },
}

export function AgentRecordViewsDemo() {
  const [purpose, setPurpose] = useState<keyof typeof recordViewExamples>("p04")
  const [kind, setKind] = useState<"progress" | "result" | "context">("progress")
  const [narrow, setNarrow] = useState(false), [expanded, setExpanded] = useState(true)
  const [feedback, setFeedback] = useState(""), [object, setObject] = useState<string | null>(null)
  const workspaceHeading = useRef<HTMLHeadingElement>(null)
  const sample = recordViewExamples[purpose]
  const result: AgentExecutionResultProps = {
    ...sample.result,
    receipt: sample.result.receipt.status === "unknown" ? { ...sample.result.receipt, query: { label: "查询原请求", onAction: () => setFeedback("示例查询已发出；没有新回执，状态仍未确认。") } } : sample.result.receipt,
    outputs: sample.result.outputs?.map((output, index) => ({ ...output, open: index === 0 ? { label: `查看${output.version}`, onAction: () => setObject(`${output.title} · ${output.version}`) } : undefined })),
  }
  return <section id="record-views" className="mt-10 space-y-5">
    <div className="space-y-2"><h2 className="text-section-title">任务记录三件套两态 v0.1 · 设计候选</h2><p className="text-ui-hint text-muted-foreground">示例：三种用法共享同一组记录。切换仅改变呈现，任务与来源事实保持原样。</p></div>
    <div className="flex flex-wrap gap-2" aria-label="示例用途">{Object.entries(recordViewExamples).map(([key, value]) => <Button key={key} variant="outline" aria-pressed={purpose === key} onClick={() => { setPurpose(key as keyof typeof recordViewExamples); setFeedback("") }}>{value.label}</Button>)}</div>
    <div className="flex flex-wrap gap-2" aria-label="记录类型">{([['progress', '任务进度'], ['result', '执行结果'], ['context', '上下文摘要']] as const).map(([key, label]) => <Button key={key} variant="outline" aria-pressed={kind === key} onClick={() => setKind(key)}>{label}</Button>)}<Button variant="ghost" aria-pressed={narrow} onClick={() => setNarrow(!narrow)}>320px 窄容器</Button></div>
    <div className={narrow ? "grid max-w-80 gap-6" : "grid gap-6 xl:grid-cols-3"}>
      {([['inline', 'default', '对话摘要'], ['workspace', 'default', '完整记录'], ['inline', 'compact', '紧凑列表']] as const).map(([view, density, label], index) => {
        const shared = { view, density, onExpand: () => { workspaceHeading.current?.focus(); workspaceHeading.current?.scrollIntoView({ block: "nearest" }) }, details: <p>各项记录分别保留版本和范围，查看不会改变记录。</p> }
        return <section key={label} className="min-w-0 space-y-3" aria-label={label}>
          <h3 ref={index === 1 ? workspaceHeading : undefined} tabIndex={-1} className="text-block-title">{label}</h3>
          {kind === "progress" && <AgentExecutionProgress {...sample.progress} {...shared} expanded={expanded} onExpandedChange={setExpanded} presentation={density === "compact" ? "inline" : "card"} />}
          {kind === "result" && <AgentExecutionResult {...result} {...shared} presentation={density === "compact" ? "inline" : "card"} />}
          {kind === "context" && <AgentContextSummary {...sample.context} {...shared} expanded={expanded} onExpandedChange={setExpanded} onInspect={id => setObject(sample.context.sources.find(source => source.id === id)?.title ?? null)} />}
        </section>
      })}
    </div>
    {feedback && <p role="status" className="text-ui-hint">{feedback}</p>}
    <Dialog open={object !== null} onOpenChange={open => { if (!open) setObject(null) }}><DialogPopup><DialogHeader><DialogTitle>{object}</DialogTitle><DialogDescription>固定示例节选，查看不改变四项来源记录。</DialogDescription></DialogHeader><DialogPanel><DraftMathPreview value="已知函数 f(x) = x² − 2x + 1，请核对其最小值及单调区间。分式示例：\\(\\frac{x+1}{x-1}\\)。" /></DialogPanel></DialogPopup></Dialog>
  </section>
}
