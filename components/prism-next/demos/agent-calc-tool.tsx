"use client"

import { AgentDemoPreview, useAgentDemoPresentation } from "./agent-demo-presentation"

import { useLayoutEffect, useRef, useState } from "react"
import { AgentCalcTool, type AgentCalcCapabilities, type AgentCalcIntent, type AgentCalcMode, type AgentCalcResult } from "../agent-calc-tool"
import { Button } from "../button"

export const calcCapabilities: AgentCalcCapabilities = {
  evaluate: { supported: true }, simplify: { supported: true }, solve: { supported: true }, stats: { supported: true },
  plot: { supported: false, reason: "绘图工具尚未接入。" },
}
export const calcExamples: readonly AgentCalcResult[] = [
  { toolSessionId: "demo-vertex", version: "v1", expression: "y=x^2-4x+3", mode: "evaluate",
    text: "顶点为（2，−1）；当 x 等于 2 时，函数取得最小值 −1。", formula: "y=(x-2)^2-1", unit: "无量纲",
    source: { kind: "simulation", label: "预置二次函数示例" },
    comparison: { state: "consistent", answer: "顶点（2，−1），最小值 −1。" },
    steps: [{ text: "将二次函数配方。", formula: "x^2-4x+3=(x-2)^2-1" }, { text: "平方项非负，在 x 等于 2 时为零，读取顶点和最小值。" }],
    plot: { label: "二次函数的五个模拟采样点", xLabel: "x", yLabel: "y", data: [
      { id: "p0", label: "点一", x: 0, y: 3 }, { id: "p1", label: "点二", x: 1, y: 0 },
      { id: "p2", label: "顶点", x: 2, y: -1 }, { id: "p3", label: "点四", x: 3, y: 0 }, { id: "p4", label: "点五", x: 4, y: 3 },
    ] },
  },
  { toolSessionId: "demo-axis", version: "v1", expression: "y=x^2-4x+3", mode: "evaluate",
    text: "对称轴为直线 x 等于 2。", formula: "x=2", unit: "无量纲", source: { kind: "simulation", label: "预置对称轴示例" },
    comparison: { state: "inconsistent", answer: "对称轴为 x 等于 −2。", reason: "请核对题目答案中对称轴的符号。" },
    steps: [{ text: "从配方后的平方项读取对称轴。", formula: "y=(x-2)^2-1" }],
  },
]

export function CalcToolExample({ index, narrow = false }: { index: number; narrow?: boolean }) {
  const presentation = useAgentDemoPresentation()
  const sample = calcExamples[index], toolSessionId = sample?.toolSessionId ?? "demo-unknown", version = "v1"
  const [expression, setExpression] = useState(sample?.expression ?? "1, 3, 5, 7")
  const [mode, setMode] = useState<AgentCalcMode>(sample?.mode ?? "stats")
  const [result, setResult] = useState<AgentCalcResult | undefined>(sample)
  const [history, setHistory] = useState<readonly AgentCalcResult[]>(sample ? [sample] : [])
  const [view, setView] = useState<"inline" | "workspace">(index === 1 ? "workspace" : "inline")
  const [feedback, setFeedback] = useState("")
  const entry = useRef<HTMLButtonElement | null>(null), panel = useRef<HTMLDivElement>(null)
  const focus = useRef(false)
  useLayoutEffect(() => {
    if (!focus.current) return
    focus.current = false
    if (view === "workspace") panel.current?.focus()
    else if (entry.current?.isConnected) entry.current.focus()
    else panel.current?.querySelector<HTMLButtonElement>('button[data-calc-expand]')?.focus()
  }, [view])
  function receive(intent: AgentCalcIntent) {
    if (intent.toolSessionId !== toolSessionId || intent.version !== version) return
    if (intent.type === "change-input") {
      setExpression(intent.expression); setMode(intent.mode); setResult(undefined); setFeedback("")
    } else if (intent.type === "evaluate") {
      // Exact fixed mapping in the demo host. Arbitrary expressions never get computed.
      const known = sample?.expression === intent.expression && sample.mode === intent.mode ? sample : undefined
      setResult(known)
      if (known) setHistory(items => [...items, known])
      setFeedback(known ? "已显示预置模拟结果。" : "没有对应的预置示例，结果未知。")
    } else if (intent.type === "clear-history") { setHistory([]); setFeedback("已清空本页模拟历史。") }
    else if (intent.type === "compare-with-answer") setFeedback("已显示预置的模拟对比结论。")
    else setFeedback(`已收到插入到题目${intent.target === "answer" ? "答案" : "解析"}的请求；本示例不修改题目。`)
  }
  if (presentation.previewOnly) return <AgentDemoPreview feedback={feedback}><AgentCalcTool title={index === 0 ? "顶点与最小值（模拟）" : index === 1 ? "对称轴核对（模拟）" : "统计结果未知（模拟）"}
      toolSessionId={toolSessionId} version={version} expression={expression} mode={mode} capabilities={calcCapabilities}
      result={result} history={history}   onIntent={receive}
      details="所有结果、过程、对比和数据点都是预置模拟；采样点之间不代表已经计算过的函数曲线。可修改输入并点击计算，未匹配的表达式保持结果未知。" view="inline" density="default" onExpand={presentation.onExpand} /></AgentDemoPreview>
  return <div ref={panel} tabIndex={-1} className={`min-w-0 space-y-2 ${narrow ? "max-w-[320px]" : ""}`}>
    <AgentCalcTool title={index === 0 ? "顶点与最小值（模拟）" : index === 1 ? "对称轴核对（模拟）" : "统计结果未知（模拟）"}
      toolSessionId={toolSessionId} version={version} expression={expression} mode={mode} capabilities={calcCapabilities}
      result={result} history={history} view={view} density={index === 2 ? "compact" : "default"} onIntent={receive}
      onExpand={trigger => { entry.current = trigger; focus.current = true; setView("workspace") }}
      onBack={() => { focus.current = true; setView("inline") }}
      details="所有结果、过程、对比和数据点都是预置模拟；采样点之间不代表已经计算过的函数曲线。可修改输入并点击计算，未匹配的表达式保持结果未知。" />
    {feedback && <p role="status" className="text-ui-hint break-words">{feedback}</p>}
  </div>
}
export function AgentCalcToolDemo() {
  const presentation = useAgentDemoPresentation()
  const [narrow, setNarrow] = useState(false)
  if (presentation.previewOnly) return <CalcToolExample index={0} narrow={narrow} />
  return <section id={presentation.embedded ? undefined : "calc-tool"} className="min-w-0 space-y-5 py-6">
    {!presentation.embedded && <h2 className="text-section-title">计算与分析工具</h2>}
    <p className="text-ui-body">模拟组卷核算：顶点与最小值一致、对称轴不一致、统计结果未知。可展开查看过程与本次会话历史。</p>
    <Button type="button" variant="outline" aria-pressed={narrow} onClick={() => setNarrow(value => !value)}>320px 窄容器</Button>
    <div className="grid min-w-0 gap-6">{[0, 1, 2].map(index => <CalcToolExample key={index} index={index} narrow={narrow} />)}</div>
  </section>
}
