"use client"

import { AgentDemoPreview, useAgentDemoPresentation } from "./agent-demo-presentation"

import { useRef, useState } from "react"
import { AgentTemplatePicker, type AgentTemplate, type AgentTemplatePickerIntent, type AgentTemplatePickerProps } from "../agent-template-picker"
import { Button } from "../button"

const formula = <math className="prism-math" aria-label="y 等于二分之一 x 的平方"><mi>y</mi><mo>=</mo><mfrac><mn>1</mn><mn>2</mn></mfrac><msup><mi>x</mi><mn>2</mn></msup></math>
const paperBase = { objectType: "试卷", scope: "高二数学 · 函数单元", source: "教研组模拟模板库", version: { id: "paper-v1", label: "示例第一版" }, availability: { state: "available" } as const }
export const templateExamples: Record<"paper" | "lesson", readonly AgentTemplate[]> = {
  paper: [
    { ...paperBase, id: "midterm", name: "期中卷三大题", categoryId: "exam", recommended: true,
      summary: "三大题：选择 / 填空 / 解答，满分 100", recommendationReason: "适合分题型检查函数单元的理解与运用。",
      selectionImpact: { requiresConfirmation: true, description: "将按新模板重新分组，已设分值保留。" },
      structure: [{ key: "sections", label: "题型结构", value: "选择 / 填空 / 解答" }, { key: "score", label: "满分", value: "100 分" }],
      preview: <div className="space-y-3"><p className="text-read-body">一、选择题　　二、填空题　　三、解答题</p><p className="text-read-body">示例：观察 {formula} 的图像，说明其变化规律。</p></div> },
    { ...paperBase, id: "practice", name: "随堂练习两部分", categoryId: "practice", recommended: true,
      summary: "两部分：基础巩固 / 拓展运用，不设总分", recommendationReason: null,
      selectionImpact: { requiresConfirmation: true, description: "将按练习环节重新分组，已设分值丢失。" },
      structure: [{ key: "sections", label: "题型结构", value: "基础巩固 / 拓展运用" }, { key: "score", label: "满分", value: "不设总分" }],
      preview: <div className="space-y-3"><p className="text-read-body">第一部分：基础巩固</p><p className="text-read-body">根据 {formula} 完成列表，并解释函数图像与代数表达式之间的联系。</p><p className="text-read-body">第二部分：拓展运用</p></div> },
    { ...paperBase, id: "unit", name: "单元测验：兼顾概念辨析、图像阅读与完整推理过程的分层评价模板", categoryId: "exam",
      summary: "三部分：概念辨析 / 图像阅读 / 推理表达，满分 80", recommendationReason: "用于单元结束后的分层诊断。",
      availability: { state: "unavailable", reason: "示例版面正在修订，暂不可选。" },
      structure: [{ key: "sections", label: "题型结构", value: "概念辨析 / 图像阅读 / 推理表达" }, { key: "score", label: "满分", value: "80 分" }] },
  ],
  lesson: [
    { id: "inquiry", name: "探究式教学方案", objectType: "教学方案", summary: "四环节：情境导入 / 自主探究 / 交流归纳 / 迁移练习", scope: "高中数学 · 函数", source: "备课组模拟模板库", version: { id: "lesson-v1", label: "示例第一版" }, categoryId: "lesson", recommended: true,
      recommendationReason: "适合从图像观察过渡到性质归纳。", availability: { state: "available" },
      selectionImpact: { requiresConfirmation: false, description: "仅记录本次模板选择，不调整教学内容。" },
      structure: [{ key: "stages", label: "教学环节", value: "情境导入 / 自主探究 / 交流归纳 / 迁移练习" }, { key: "duration", label: "建议时长", value: "40 分钟" }],
      preview: <p className="text-read-body">情境导入：从 {formula} 的图像出发，提出关于对称性与变化趋势的问题。</p> },
    { id: "review", name: "复习讲评方案", objectType: "教学方案", summary: "三环节：回顾 / 讲评 / 再练", scope: "高中数学 · 函数", source: "备课组模拟模板库", version: { id: "review-v1", label: "示例第一版" }, categoryId: "lesson", recommended: true,
      availability: { state: "available" }, selectionImpact: { requiresConfirmation: false, description: "仅记录本次模板选择，不调整教学内容。" }, structure: [{ key: "stages", label: "教学环节", value: "回顾 / 讲评 / 再练" }, { key: "duration", label: "建议时长", value: null }],
      preview: <p className="text-read-body">回顾常见错误，按理解情况安排讲评与再练。</p> },
  ],
}

export function TemplatePickerExample({ purpose, narrow = false }: { purpose: keyof typeof templateExamples; narrow?: boolean }) {
  const presentation = useAgentDemoPresentation()
  const templates = templateExamples[purpose]
  const [selectedId, setSelectedId] = useState<string | null>(templates[0].id)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [comparison, setComparison] = useState<readonly [string, string] | null>(null)
  const [feedback, setFeedback] = useState("仅演示模板选择；没有应用到试卷或教学内容。")
  const workspace = useRef<HTMLElement>(null), trigger = useRef<HTMLButtonElement | null>(null)
  const onIntent = (intent: AgentTemplatePickerIntent) => {
    if (intent.templateSetId !== purpose || intent.version !== "example-v1") return
    if (intent.type === "select") { setSelectedId(intent.templateId); setFeedback("已记录本次选择（模拟），内容尚未调整。") }
    if (intent.type === "clear") { setSelectedId(null); setFeedback("已清除本次选择（模拟），内容保持原样。") }
    if (intent.type === "preview") setPreviewId(intent.templateId)
    if (intent.type === "compare") setComparison(intent.templateIds)
    if (intent.type === "request-manage") setFeedback("已请求打开管理与配置；此示例未连接模板管理。")
  }
  const common: AgentTemplatePickerProps = { title: purpose === "paper" ? "试卷模板（模拟）" : "教学方案模板（模拟）",
    templateSet: { id: purpose, version: "example-v1" }, templates, selectedId, previewId, comparison, onIntent, manage: {},
    notice: purpose === "lesson" ? "仅记录本次模板选择，不调整教学内容。" : undefined,
    categories: purpose === "paper" ? [{ id: "exam", label: "测验与考试" }, { id: "practice", label: "课堂练习" }] : [{ id: "lesson", label: "教学方案" }],
    onExpand: button => { trigger.current = button; workspace.current?.focus({ preventScroll: true }); workspace.current?.scrollIntoView({ block: "nearest" }) },
    onBack: () => { trigger.current?.focus(); trigger.current?.scrollIntoView({ block: "nearest" }) },
    details: <p>全部为模拟模板。三个示例视图共享本次选择；分类只过滤显示，刷新后还原。</p>,
  }
  if (presentation.previewOnly) return <AgentDemoPreview feedback={feedback}><AgentTemplatePicker {...common}   view={presentation.view ?? "inline"} density={presentation.density ?? "default"} onExpand={presentation.onExpand} onBack={presentation.onBack} /></AgentDemoPreview>
  return <div className="min-w-0 space-y-5">
    <p role="status" className="text-ui-hint">{feedback}</p>
    {([ ["inline", "default", "推荐与快速切换"], ["workspace", "default", "模板库、预览与对比"], ["inline", "compact", "紧凑选择"] ] as const).map(([view, density, label]) =>
      <section key={label} aria-label={label} ref={view === "workspace" ? workspace : undefined} tabIndex={view === "workspace" ? -1 : undefined} className={`min-w-0 space-y-3 ${narrow ? "w-full max-w-[320px]" : ""}`}>
        <h3 className="text-block-title">{label}</h3><AgentTemplatePicker {...common} view={view} density={density} />
      </section>)}
  </div>
}

export function AgentTemplatePickerDemo() {
  const presentation = useAgentDemoPresentation()
  const [narrow, setNarrow] = useState(false)
  if (presentation.previewOnly) return <TemplatePickerExample purpose="paper" narrow={narrow} />
  return <section id={presentation.embedded ? undefined : "template-picker"} className="min-w-0 space-y-6 py-6">
    {!presentation.embedded && <h2 className="text-section-title">模板选择器</h2>}
    <p className="text-ui-body">试卷与教学方案的模拟模板选择，预览结构与版面后再决定。</p>
    <Button type="button" variant="outline" aria-pressed={narrow} onClick={() => setNarrow(value => !value)}>切换 320px 窄容器</Button>
    <TemplatePickerExample purpose="paper" narrow={narrow} /><TemplatePickerExample purpose="lesson" narrow={narrow} />
  </section>
}
