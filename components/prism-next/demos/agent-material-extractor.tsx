"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { AgentMaterialExtractor, type AgentMaterialCandidate, type AgentMaterialExtractorIntent, type AgentMaterialSource, type MaterialTextRange } from "../agent-material-extractor"
import { materialParagraphRange, materialRangeDescription, materialRangeText, sameMaterialRange } from "@/lib/prism-next/material-extractor"
import { Button } from "../button"
import { DraftMathPreview } from "../draft-math-preview"

const outline: AgentMaterialSource = {
  id: "example-outline", version: "outline-v1", label: "勾股定理复习课提纲", versionLabel: "示例第 1 版", kind: "document",
  extractability: { state: "available" }, license: { name: "课堂使用（示例）", state: "available" }, availability: { state: "available" }, openable: true,
  paragraphs: [
    { id: "goal", label: "第 1 段 · 复习目标", text: "回顾直角三角形三边之间的关系：a² + b² = c²，其中 c 为斜边长。先让学生说明三边所对应的位置，再判断定理是否适用。" },
    { id: "activity", label: "第 2 段 · 课堂活动", text: "用两个边长分别为 a、b 的正方形拼合面积关系。请学生对照图形写出等式，并用自己的语言解释等式两侧分别表示什么。" },
    { id: "reflection", label: "第 3 段 · 变式与反思", text: "当学生仅记住公式而忽略直角条件时，先比较不同三角形的边长，再讨论哪些条件能够支持结论，并保留不同解法的适用范围、推理依据与尚未解释清楚的问题，供下一次复习继续使用。分式形式为 \\(\\frac{a^2+b^2}{c^2}=1\\)。" },
  ],
}
const question: AgentMaterialSource = {
  id: "example-question", version: "question-v2", label: "梯子靠墙问题 · 第 1 题题干", versionLabel: "示例第 2 版", kind: "question",
  extractability: { state: "available" }, license: { name: null, state: "unknown" }, availability: { state: "unknown" }, openable: true,
  paragraphs: [{ id: "stem", label: "题干第 1 段", text: "一架长 5 米的梯子斜靠在竖直墙面上，梯脚离墙 3 米。求梯子顶端距离地面的高度，并说明为什么可以使用 a² + b² = c²。" }],
}
const imageSource: AgentMaterialSource = {
  id: "example-image", version: "image-v1", label: "教材勾股定理插图", versionLabel: "示例第 1 版", kind: "image", paragraphs: [],
  extractability: { state: "unavailable" }, license: { name: null, state: "unknown" }, availability: { state: "unknown" },
}
function candidate(source: AgentMaterialSource, range: MaterialTextRange, id: string, title: string, status: AgentMaterialCandidate["status"]): AgentMaterialCandidate {
  return { id, title, range, sourceLabel: source.label, versionLabel: source.versionLabel, location: materialRangeDescription(source, range),
    excerpt: materialRangeText(source, range)!, note: "", status }
}
export const materialExtractorExamples = [
  { id: "outline", label: "提纲片段与图像来源（固定示例）", sources: [outline, imageSource], candidates: [
    candidate(outline, materialParagraphRange(outline, "goal")!, "example-added", "复习目标", { state: "added", targetLabel: "勾股定理复习素材包（示例）" }),
    candidate(outline, materialParagraphRange(outline, "activity")!, "example-candidate", "拼图活动", { state: "candidate" }),
  ] },
  { id: "question", label: "题目题干片段（固定示例）", sources: [question], candidates: [
    candidate(question, materialParagraphRange(question, "stem", "sentence")!, "example-stem", "梯子问题的已知条件", { state: "candidate" }),
  ] },
] as const
type Example = typeof materialExtractorExamples[number]

export function MaterialExtractorExample({ sample, narrow = false, initialView = "inline", density = "default" }: {
  sample: Example; narrow?: boolean; initialView?: "inline" | "workspace"; density?: "default" | "compact"
}) {
  const [view, setView] = useState(initialView), [revision, setRevision] = useState(0)
  const [selection, setSelection] = useState<MaterialTextRange | null>(null)
  const [items, setItems] = useState<readonly AgentMaterialCandidate[]>(sample.candidates)
  const [feedback, setFeedback] = useState("固定示例；候选与标注仅在本页保留，刷新后还原。")
  const root = useRef<HTMLDivElement>(null), restore = useRef(false), serial = useRef(0)
  useLayoutEffect(() => {
    if (!restore.current) return
    restore.current = false
    if (view === "workspace") root.current?.querySelector<HTMLElement>("h3")?.focus()
    else root.current?.querySelector<HTMLButtonElement>("footer button:last-child")?.focus()
  }, [view])
  function receive(intent: AgentMaterialExtractorIntent) {
    if (intent.extractorId !== sample.id || intent.baseRevision !== String(revision)) return
    if (intent.type === "select-range") {
      setSelection(intent.range)
      const source = sample.sources.find(source => source.id === intent.range.sourceId)
      if (!source || materialRangeText(source, intent.range) === null) return
      if (intent.purpose === "candidate" && !items.some(item => sameMaterialRange(item.range, intent.range))) {
        setItems([...items, candidate(source, intent.range, `example-selected-${++serial.current}`, `自选片段 ${serial.current}`, { state: "candidate" })])
        setFeedback("已列为本页候选片段，尚未确认加入素材包。")
      }
    } else if (intent.type === "annotate") setItems(items.map(item => item.id === intent.candidateId ? { ...item, [intent.field]: intent.value } : item))
    else if (intent.type === "remove") setItems(items.filter(item => item.id !== intent.candidateId))
    else if (intent.type === "reorder") setItems(intent.orderedCandidateIds.flatMap(id => items.filter(item => item.id === id)))
    else if (intent.type === "confirm") setFeedback(`已收到将 ${intent.candidates.length} 段加入“${intent.target.label}”的请求；未连接素材包，结果未确认。`)
    else {
      const source = sample.sources.find(source => source.id === intent.sourceId)
      setFeedback(`已请求定位“${source?.label ?? "原来源"}”${intent.range && source ? `：${materialRangeDescription(source, intent.range)}` : ""}；本页没有打开真实来源。`)
    }
    setRevision(revision + 1)
  }
  return <div className={`min-w-0 space-y-3 ${narrow ? "w-full max-w-[320px]" : ""}`}>
    <h3 className="text-block-title">{sample.label}</h3>
    <div className="flex flex-wrap gap-2" aria-label="切换固定状态示例">
      {(["candidate", "confirmed", "invalid", "unconfirmed"] as const).map(state => <Button key={state} type="button" variant="outline" size="navigation"
        onClick={() => {
          setItems(items.map((item, index) => index === items.length - 1 ? { ...item, status: state === "invalid" ? { state, reason: "原文已有新版本，请重新核对片段。" } : state === "unconfirmed" ? { state, reason: "上次加入结果尚未确认。" } : { state } } : item))
          setRevision(revision + 1); setFeedback("已切换固定状态示例，不代表实际执行。")
        }}>{({ candidate: "候选示例", confirmed: "已确认示例", invalid: "失效示例", unconfirmed: "未确认示例" })[state]}</Button>)}
    </div>
    <div ref={root}><AgentMaterialExtractor context={{ extractorId: sample.id, baseRevision: String(revision) }} sources={sample.sources} candidates={items}
      selection={selection} target={{ packId: "example-target", versionId: "pack-v1", baseVersionId: "pack-base", label: "勾股定理复习素材包（示例）" }} view={view} density={density}
      onIntent={receive} onExpand={() => { restore.current = true; setView("workspace") }} onBack={() => { restore.current = true; setView("inline") }}
      renderExcerpt={item => item.excerpt.includes("\\(") ? <DraftMathPreview value={item.excerpt} label="片段内容" notice={null} showHelp={false} /> : <p className="text-read-body whitespace-pre-wrap break-words">{item.excerpt}</p>}
      details={<p>在正文中选择整段或首句，再按句、按段扩展，也可输入字符位置。双下划线和括号标出已选文字；选择后可列为候选、添加标注并调整顺序。</p>} /></div>
    <p className="text-ui-hint break-words" role="status">{feedback}</p>
  </div>
}

export function AgentMaterialExtractorDemo() {
  const [narrow, setNarrow] = useState(false), [compact, setCompact] = useState(false)
  return <section id="material-extractor" className="mb-12 min-w-0 space-y-5">
    <h2 className="text-section-title">素材提取器 v0.1 · 设计候选</h2>
    <p className="text-ui-hint">文本片段的选择、出处与标注。已加入的片段来自固定示例记录；操作不会改写该记录。</p>
    <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" aria-pressed={narrow} onClick={() => setNarrow(value => !value)}>320px 窄容器</Button>
      <Button type="button" variant="outline" aria-pressed={compact} onClick={() => setCompact(value => !value)}>紧凑密度</Button></div>
    {materialExtractorExamples.map((sample, index) => <MaterialExtractorExample key={sample.id} sample={sample} narrow={narrow} density={compact ? "compact" : "default"} initialView={index ? "workspace" : "inline"} />)}
  </section>
}
