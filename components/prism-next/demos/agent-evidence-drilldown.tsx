"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { Button } from "@/components/coss/button"
import { Badge } from "../badge"
import { DocumentRegionViewer } from "../document-region-viewer"
import { DiagnosisEvidenceTable } from "../learning-components"
import { AgentEvidenceDrilldown, type AgentEvidenceConclusion, type AgentEvidenceNode, type AgentEvidencePath } from "../agent-evidence-drilldown"

const sourceFormula = <math className="prism-math" aria-label="y 等于二分之一 x 的平方减二 x 加三"><mi>y</mi><mo>=</mo><mfrac><mn>1</mn><mn>2</mn></mfrac><msup><mi>x</mi><mn>2</mn></msup><mo>−</mo><mn>2</mn><mi>x</mi><mo>+</mo><mn>3</mn></math>

function ScanPreview() {
  const [region, setRegion] = useState("q2")
  return <figure className="min-w-0 space-y-2">
    <DocumentRegionViewer label="原稿第 1 页区域 · 示例" selectedId={region} onSelect={setRegion}
      header={<><p>二次函数练习 · 示例原稿</p><span>第 1 页 · 原稿 v1</span></>}
      regions={[{ id: "q2", label: "第 2 题", rect: [8, 22, 84, 38], content: <div className="space-y-3 text-read-body"><p>2. 将下式配方，并求对称轴。</p><div className="overflow-x-auto">{sourceFormula}</div></div> }]} />
    <figcaption className="text-ui-hint text-muted-foreground">人工示例区域与文字，用于核对定位。</figcaption>
  </figure>
}

/** Fixed, permitted fixtures. No click promotes them to real read/citation records. */
export const evidenceExamples: Record<"scan" | "diagnosis", { label: string; conclusion: AgentEvidenceConclusion; nodes: readonly AgentEvidenceNode[]; firstEvidence: AgentEvidencePath }> = {
  scan: {
    label: "扫描校对", firstEvidence: ["question-2", "original"],
    conclusion: { id: "scan-conclusion", statement: "第 2 题识别可能有误", version: "校对稿 r2（示例）", summary: "请对照原稿中的二次项系数与识别文本。", evidenceCount: 2, coverage: { state: "incomplete", description: "尚缺这次识别的读取与引用记录。" } },
    nodes: [{ kind: "object", id: "question-2", title: "第 2 题", type: "题目", version: "校对稿 r2", location: "第 1 页 · 第 2 题", openable: true,
      children: [
        { kind: "evidence", id: "original", title: "原稿第 1 页区域", type: "材料页区域", source: { objectId: "scan-v1", label: "二次函数练习原稿", version: "原稿 v1", location: "第 1 页 · 区域 q2" }, relation: "pending", summary: "原稿中二次项系数为 1/2，仍待逐项核对。", facts: [{ state: "preview-only", description: "示例记录仅说明预览过第 2 题区域。" }, { state: "unknown", description: "读取与成果引用均未确认。" }], preview: <ScanPreview />, openable: true },
        { kind: "evidence", id: "recognized", title: "第 2 题识别文本", type: "识别文本", source: { objectId: "recognized-v1", label: "首次识别稿", version: "识别稿 v1", location: "第 2 题 · 题干第 1 段", snapshot: "首次识别时的版本" }, relation: "supports", summary: "识别文本写为 y = x² − 2x + 3，二次项系数与原稿不同。", facts: [{ state: "incomplete", description: "未提供本次识别的完整记录。" }], preview: <p className="text-read-body">已知 y = x² − 2x + 3，求对称轴。</p>, openable: true },
      ] }],
  },
  diagnosis: {
    label: "学情诊断", firstEvidence: ["student-a", "question-4", "attempt-a"],
    conclusion: { id: "diagnosis-conclusion", statement: "二次函数配方掌握不足", version: "诊断稿 v2（示例）", summary: "已有作答出现配方遗漏，同时保留正确作答的反例；结论仍需结合范围核对。", coverage: { state: "incomplete", description: "仅有部分作答记录，不能代表全班。" } },
    nodes: [
      { kind: "object", id: "student-a", title: "学生甲（示例）", type: "学生", version: "本次练习 v1", openable: true, children: [
        { kind: "object", id: "question-4", title: "第 4 题 · 配方与顶点坐标", type: "题目", version: "试题 v3", location: "本次练习 · 第 4 题", children: [
          { kind: "evidence", id: "attempt-a", title: "学生甲的配方步骤", type: "作答片段", source: { objectId: "attempt-a-v1", label: "学生甲 · 第 4 题作答", version: "作答 v1", location: "作答第 2 段" }, relation: "supports", summary: "补入平方项后没有减去对应常数，需核对这一步的理解。", facts: [{ state: "read", description: "示例本机读取记录，仅覆盖作答第 2 段。", version: "作答 v1", location: "第 2 段" }, { state: "cited", description: "示例诊断稿引用此作答片段。", version: "诊断稿 v2", location: "依据第 1 条" }], preview: <div className="space-y-2 text-read-body"><p>原式：x² − 4x + 1</p><math className="prism-math" aria-label="学生写为 x 减二的平方加一"><msup><mrow><mo>(</mo><mi>x</mi><mo>−</mo><mn>2</mn><mo>)</mo></mrow><mn>2</mn></msup><mo>+</mo><mn>1</mn></math></div>, openable: true },
        ] },
      ] },
      { kind: "object", id: "student-b", title: "学生乙（示例）", type: "学生", version: "本次练习 v1", children: [
        { kind: "evidence", id: "attempt-b", title: "学生乙的正确配方步骤", type: "作答片段", source: { objectId: "attempt-b-v1", label: "学生乙 · 第 4 题作答", version: "作答 v1", location: "作答第 1 段" }, relation: "counterexample", summary: "写出了 (x − 2)² − 3；该片段与掌握不足的概括不一致。", facts: [{ state: "read", description: "示例本机读取了作答第 1 段。" }], preview: <p className="text-read-body">x² − 4x + 1 = (x − 2)² − 3</p>, openable: true },
      ] },
      { kind: "object", id: "older-attempts", title: "较早练习的候选依据", type: "练习记录", version: "练习 v1", children: [
        { kind: "evidence", id: "retrieved", title: "较早作答的检索片段", type: "检索片段", source: { objectId: "old-attempt", label: "较早练习 · 配方题", version: "作答 v1", location: "题号与作答段落待补充", snapshot: "2026-09-18 练习记录" }, relation: "pending", facts: [{ state: "retrieval-only" }, { state: "incomplete", description: "未提供完整定位。" }], previewUnavailableReason: "尚未提供可预览的原作答。" },
        { kind: "evidence", id: "unavailable-record", title: "补充作答的使用记录", type: "作答记录", source: { objectId: "extra-attempt", label: "本次练习补充作答", version: "作答 v1", location: "第 4 题" }, relation: "pending", facts: [{ state: "unavailable", description: "记录来源暂不可访问，不能据此判断是否读取或引用。" }] },
      ] },
      { kind: "object", id: "restricted", access: "restricted", disclosure: { label: "受限作答（示例）", reason: "当前仅允许查看汇总，不能查看该作答明细。" } },
    ],
  },
}

export function AgentEvidenceDrilldownDemo() {
  const [purpose, setPurpose] = useState<keyof typeof evidenceExamples>("scan")
  const [path, setPath] = useState<AgentEvidencePath>([])
  const [narrow, setNarrow] = useState(false)
  const [feedback, setFeedback] = useState("")
  const origin = useRef<HTMLButtonElement | null>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const inlineHeading = useRef<HTMLHeadingElement>(null)
  const pendingFocus = useRef(false)
  const example = evidenceExamples[purpose]
  useLayoutEffect(() => {
    if (pendingFocus.current) { pendingFocus.current = false; heading.current?.focus(); heading.current?.scrollIntoView({ block: "nearest" }) }
  }, [path])
  const navigate = (next: AgentEvidencePath) => { pendingFocus.current = true; setPath([...next]) }
  return <section id="evidence-drilldown" className="mb-12 space-y-5">
    <h2 className="text-section-title">下钻与证据浏览 v0.1 · 设计候选</h2>
    <p className="text-ui-hint text-muted-foreground">固定示例：选择对象、查看证据与返回，三种用法共享同一组记录。</p>
    <div className="flex flex-wrap gap-2" aria-label="证据示例用途">{Object.entries(evidenceExamples).map(([key, item]) => <Button key={key} variant="outline" aria-pressed={purpose === key} onClick={() => { setPurpose(key as typeof purpose); setPath([]); setFeedback(""); origin.current = null }}>{item.label}</Button>)}<Button variant="ghost" aria-pressed={narrow} onClick={() => setNarrow(!narrow)}>320px 窄容器</Button></div>
    {purpose === "diagnosis" && <DiagnosisEvidenceTable items={[{ id: example.conclusion.id, title: example.conclusion.statement, observation: example.conclusion.summary, source: "本次练习（示例）", location: "学生 → 题目 → 作答片段", status: <Badge variant="outline">待核对</Badge>, actions: <Button variant="outline" onClick={event => { origin.current = event.currentTarget; navigate([]) }}>查看诊断依据</Button> }]} />}
    <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={event => { origin.current = event.currentTarget; navigate(example.firstEvidence) }}>定位首条证据示例</Button></div>
    <p role="status" className="text-ui-hint">{feedback || "查看与返回不会改变证据记录。"}</p>
    <div className={narrow ? "grid max-w-80 gap-6" : "grid min-w-0 gap-6 xl:grid-cols-3"}>
      {([['inline', 'default', '对话摘要'], ['workspace', 'default', '完整证据链'], ['inline', 'compact', '紧凑列表']] as const).map(([view, density, label], index) => <section key={label} aria-label={label} className="min-w-0 space-y-3">
        <h3 ref={index === 1 ? heading : index === 0 ? inlineHeading : undefined} tabIndex={-1} className="text-block-title">{label}</h3>
        <AgentEvidenceDrilldown conclusion={example.conclusion} nodes={example.nodes} path={path} view={view} density={density}
          notice="查看证据不改变读取、引用或教师对照记录。"
          details={<p>固定示例，尚未连接真实证据服务。已引用只说明存在引用记录，仍需核对结论与证据是否一致。历史证据保留当时版本。</p>}
          onNavigate={navigate}
          onExpand={button => { origin.current = button; navigate(path) }}
          onOpen={intent => setFeedback(`示例：已请求打开${intent.kind === "object" ? "对象" : "证据"}，证据记录保持原样。`)}
          onBack={() => { const target = origin.current?.isConnected ? origin.current : inlineHeading.current; target?.focus(); target?.scrollIntoView({ block: "nearest" }) }} />
      </section>)}
    </div>
  </section>
}
