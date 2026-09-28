"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/coss/button"
import { AgentChangeSet, type AgentChangeSetItem, type AgentChangeSetProps } from "../agent-components"
import { DraftMathPreview } from "../draft-math-preview"

/** Hand-written examples only; no P04 store or application logic. */
const exampleItems: readonly AgentChangeSetItem[] = [
  { id: "q1-stem", title: "第 1 题 · 条件分段", before: "已知 x² − 3x + 2 = 0。求实数根。", after: "已知 x² − 3x + 2 = 0。\n求实数根。", reason: "分开条件与问题，便于核对。", scope: "题干 · 第 1 页", decision: "pending" },
  { id: "q3-number", title: "第 3 题 · 小问编号", before: "①写出结论。", after: "（1）写出结论。", reason: "对齐原稿编号。", decision: "kept" },
  { id: "q2-axis", title: "第 2 题 · 对称轴", before: "当前人工草稿：y = x² − 4x + 3，对称轴 x = 2。", after: "候选：y = x² − 2x + 3，对称轴 x = 1。", reason: "对照当前草稿，选择采用或保留。", decision: "pending", conflict: { baseLabel: "r2", currentLabel: "r3", description: "题干已修改，应用前需核对版本。" } },
  { id: "q4-source", title: "第 4 题 · 长中文说明与原稿证据核对", before: "依据图形求线段长度，并说明推理过程。", after: "依据图形求线段长度。\n请说明推理过程及所用条件。", reason: "证据不足：原稿右侧缺失，请先回看材料。", decision: "pending", critical: true },
]

export function AgentChangeSetDemo() {
  const [items, setItems] = useState(exampleItems)
  const [feedback, setFeedback] = useState("")
  const [narrow, setNarrow] = useState(false)
  const [hasTrigger, setHasTrigger] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const trigger = useRef<HTMLButtonElement | null>(null)
  const shared: Omit<AgentChangeSetProps, "view"> = {
    title: "试卷校对候选 · 示例",
    basis: "固定示例：扫描材料 A · 第 1 页 · 候选依据 r2；当前草稿 r3",
    notice: "示例：采用不代表已应用或已保存。",
    details: <p>候选依据 r2，当前草稿为 r3；请逐项比较后选择采用或保留。</p>,
    items: items.map(item => ({ ...item, beforePreview: <DraftMathPreview value={item.before} label="修改前预览"/>, afterPreview: <DraftMathPreview value={item.after} label="建议内容预览"/> })),
    inlineLimit: 1,
    onDecision: (id, decision) => setItems(current => current.map(item => item.id === id ? { ...item, decision } : item)),
    onRewrite: (id, after) => setItems(current => current.map(item => item.id === id ? { ...item, after, decision: "pending" } : item)),
    apply: {
      label: "应用已采用的修改",
      disabledReason: items.some(item => item.decision === "accepted") ? undefined : "请先采用至少一项修改。",
      onApply: () => setFeedback("示例：已点击应用；未修改试卷草稿，未保存。"),
    },
  }
  return <section id="change-set-two-state" className="mb-12 space-y-5">
    <h2 className="text-section-title">对比查看器两态 · 设计候选示例</h2>
    <p className="text-ui-hint text-muted-foreground">两栏共享同一组示例选择与改写内容。真实 P04 接入验证在 Workspace /teacher/agent/workspace 进行；本页仅展示组件。</p>
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" aria-pressed={narrow} onClick={() => setNarrow(value => !value)}>384px 窄容器</Button>
      <Button variant="outline" onClick={() => { setItems(exampleItems); setFeedback("") }}>重置示例</Button>
    </div>
    <div className={narrow ? "grid max-w-96 gap-8" : "grid min-w-0 gap-8 xl:grid-cols-2"}>
      <div className="min-w-0 space-y-4"><h3 className="text-block-title">Inline · 关键差异</h3><AgentChangeSet {...shared} view="inline" onExpand={button => { trigger.current = button; setHasTrigger(true); heading.current?.focus() }}/></div>
      <div className="min-w-0 space-y-4"><h3 ref={heading} tabIndex={-1} className="text-block-title">Workspace · 完整比较</h3><Button variant="outline" onClick={() => trigger.current?.focus()} disabled={!hasTrigger}>返回展开入口</Button><AgentChangeSet {...shared} view="workspace"/></div>
    </div>
    <p role="status" className="text-ui-hint">{feedback}</p>
  </section>
}
