"use client"

import { useState } from "react"
import { AgentContextSummary } from "../agent-context-summary"
import { AgentArtifactPreview, AgentExecutionConfirmation, AgentExecutionProgress, AgentExecutionResult, type AgentConfirmationState } from "../agent-semantic-components"
import { AgentComposer } from "../agent-components"
import { recordViewExamples } from "./agent-record-views"
import { useAgentDemoPresentation } from "./agent-demo-presentation"

/** Reuses the original record fixture. The two inline-only semantics never acquire a workspace view. */
export function AgentCorePreview({ kind }: { kind: "context" | "preview" | "confirmation" | "progress" | "result" | "input" }) {
  const { onExpand, view = "inline", density = "default" } = useAgentDemoPresentation()
  const sample = recordViewExamples.p04
  const [confirmation, setConfirmation] = useState<AgentConfirmationState>({ state: "ready", confirm: { label: "确认整理（示例）", onAction: () => setConfirmation({ state: "submitting", description: "已提出整理请求，尚无执行回执。" }) } })
  const [value, setValue] = useState("")
  if (kind === "context") return <AgentContextSummary {...sample.context} view={view} density={density} expanded={false} onExpand={onExpand} />
  if (kind === "progress") return <AgentExecutionProgress {...sample.progress} view={view} density={density} expanded={false} onExpand={onExpand} />
  if (kind === "result") return <AgentExecutionResult {...sample.result} view={view} density={density} onExpand={onExpand} />
  if (kind === "preview") return <AgentArtifactPreview title="函数单元练习校对稿（示例）" version="草稿 v1" status="待人工核对" summary="保留原题条件与来源，答案仍需人工复核。" />
  if (kind === "confirmation") return <AgentExecutionConfirmation title="确认整理范围（示例）" target="函数单元练习 · 第 1–3 页" version="原稿 v2" effects={["形成校对草稿，保留原材料。", "不会入库或发布。"]} confirmation={confirmation} />
  return <AgentComposer value={value} onChange={setValue} onSubmit={() => {}} sendDisabledReason="示例输入区尚未连接任务服务。" />
}
