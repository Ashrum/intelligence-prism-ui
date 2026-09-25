"use client"

import { useRef, useState } from "react"
import { Button } from "../button"
import { AgentObjectViewer, type AgentObjectIdentity, type AgentObjectSection, type AgentObjectViewerProps } from "../agent-object-viewer"
import { QuestionCard } from "../question-card"
import { QuestionDetails, type QuestionDetailTab } from "../question-details"
import { QuestionMath } from "../question-content"
import { DocumentRegionViewer } from "../document-region-viewer"
import { questionSamples } from "../fixtures/question-samples"
import { questionMetadata } from "../fixtures/question-metadata"
import type { DirectorySelections } from "../textbook-directory"

export const objectViewerExamples: Record<"question" | "response", { object: AgentObjectIdentity; source: string; difference: string }> = {
  question: {
    object: { id: "object-7c29e16b-3ae1-45c9-a980-99138a03f4de", type: "题目", name: "二次根式化简：从共轭式理解分式的等值变形（示例）", displayId: "练习第 1 题" },
    source: "数学单元练习（固定示例）",
    difference: "示例 v2 补充了评分说明；示例 v1 只记录选项得分。",
  },
  response: {
    object: { id: "response-327882ac-607b-4faf-a6f8-19b5effd3a84", type: "学生作答", name: "学生甲 · 第 1 题的作答与原稿区域（示例）" },
    source: "课堂练习作答页（人工绘制示例）",
    difference: "示例 v2 补录第二行计算过程；示例 v1 仅有第一行。",
  },
}

/** One fixture host owns the version and section selection shared by all three presentations. */
export function ObjectViewerExample({ purpose, narrow }: { purpose: keyof typeof objectViewerExamples; narrow: boolean }) {
  const example = objectViewerExamples[purpose]
  const [versionId, setVersionId] = useState("example-v2")
  const [requestedVersion, setRequestedVersion] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<string | null>(purpose === "question" ? "stem" : "response")
  const [tab, setTab] = useState<QuestionDetailTab>("answer")
  const [links, setLinks] = useState<DirectorySelections>({})
  const [region, setRegion] = useState("first-line")
  const [feedback, setFeedback] = useState("尚未请求操作。")
  const workspace = useRef<HTMLElement>(null), trigger = useRef<HTMLButtonElement | null>(null)
  const historical = versionId === "example-v1"
  const question = questionSamples[0]
  // Only the explicitly confirmed answer section receives answer/explanation content.
  const stemQuestion = { ...question, answer: undefined, explanation: undefined }
  const sections: AgentObjectSection[] = purpose === "question" ? [
    { id: "stem", title: "题干", summary: <QuestionCard question={stemQuestion} compact showPoints={false} />, content: <QuestionCard question={stemQuestion} showPoints={false} /> },
    { id: "answer", title: "答案与解析", sensitive: { reason: "含参考答案，确认后展开，避免提前影响独立作答。" }, content: <QuestionDetails
      question={question} metadata={questionMetadata[question.id]} links={links} onLinksChange={setLinks} tab={tab} onTabChange={setTab} tabs={["answer"]} canEdit={false} /> },
    { id: "rubric", title: "评分标准", summary: "本题 5 分。", content: historical ? "示例 v1：按所选选项记录得分，共 5 分。" : "示例 v2：按所选选项记录得分，共 5 分；课堂讲评补充关注共轭式的选择与等值变形过程。" },
    { id: "source", title: "来源", content: "自编演示题，仅供核对查看器与数学内容的组合。" },
  ] : [
    { id: "response", title: "作答原稿", summary: <>第一行：<QuestionMath label="根号三加一除以根号三减一"><mfrac><mrow><msqrt><mn>3</mn></msqrt><mo>+</mo><mn>1</mn></mrow><mrow><msqrt><mn>3</mn></msqrt><mo>−</mo><mn>1</mn></mrow></mfrac></QuestionMath>，完整过程见原稿区域。</>, content: <DocumentRegionViewer
      label="学生甲作答原稿（人工区域示例）" selectedId={region} onSelect={setRegion}
      header={<><p>学生甲 · 课堂练习（示例）</p><span>{historical ? "当时作答 · 示例 v1" : "当前作答 · 示例 v2"}</span></>}
      regions={[
        { id: "first-line", label: "第一行作答", rect: [8, 22, 84, 20], content: <p>先给分子、分母同乘共轭式。</p> },
        ...(!historical ? [{ id: "second-line", label: "第二行作答", rect: [8, 52, 84, 20] as [number, number, number, number], content: <p>分母化为 2，再约分。</p> }] : []),
      ]} /> },
    { id: "source", title: "来源", summary: "课堂练习 · 第 1 页 · 第 1 题。", content: "人工绘制的作答与区域，不代表已取得真实扫描或识别结果。" },
    { id: "contact", access: "restricted", disclosure: { label: "家长联系方式", reason: "当前任课教师可见范围不含家长联系方式。" } },
  ]
  const common: AgentObjectViewerProps = {
    object: example.object, source: example.source,
    version: { id: versionId, label: historical ? "示例 v1" : "示例 v2", state: historical ? "historical" : "current", currentLabel: "示例 v2", difference: example.difference },
    access: { state: "available", scope: purpose === "question" ? "本题题干、答案、评分标准与来源" : "本份作答及来源" },
    sections, activeSection, onNavigate: setActiveSection,
    versions: [{ id: "example-v2", label: "示例 v2", state: "current" }, { id: "example-v1", label: "示例 v1", state: "historical" }],
    onVersionChange: request => { setRequestedVersion(request.targetVersionId); setFeedback("已请求查看所选版本；载入前保留眼前内容。") },
    actions: purpose === "question" ? [{ id: "add", kind: "add-to-collection", label: "加入集合" }, { id: "evidence", kind: "drilldown", label: "下钻证据" }]
      : [{ id: "review", kind: "review", label: "复核作答" }, { id: "evidence", kind: "drilldown", label: "下钻证据" }],
    onAction: request => setFeedback(`已请求${request.kind === "add-to-collection" ? "加入集合" : request.kind === "review" ? "复核作答" : "查看证据"}；本示例未执行此操作。`),
    relations: [{ id: "example-task", relationship: "所属任务", name: "数学单元练习（示例）", openable: true }, { id: "example-material", relationship: "来源材料", name: "练习原稿（示例）" }],
    onOpenRelation: () => setFeedback("已请求打开所属任务；本示例未连接任务详情。"),
    onExpand: button => { trigger.current = button; workspace.current?.focus({ preventScroll: true }); workspace.current?.scrollIntoView({ block: "nearest", behavior: "instant" }) },
    onBack: () => { trigger.current?.focus(); trigger.current?.scrollIntoView({ block: "nearest", behavior: "instant" }) },
    notice: "固定示例；未连接题库与作答服务。",
    details: <p>查看和定位不会改变读取、引用或复核记录。切换版本后，答案需要重新确认查看；历史内容只读。</p>,
  }
  return <div className="min-w-0 space-y-5">
    <p className="text-ui-hint">固定示例 · 三处呈现同一对象与版本。</p>
    <Button type="button" variant="outline" size="navigation" disabled={!requestedVersion} onClick={() => {
      if (!requestedVersion) return
      setVersionId(requestedVersion); setRequestedVersion(null); setRegion("first-line"); setFeedback("已载入所选示例版本。")
    }}>载入请求的示例版本</Button>
    <p role="status" className="break-words text-ui-hint">{feedback}</p>
    <div className="grid min-w-0 gap-6">{([
      ["inline", "default", "对话快速查看"], ["workspace", "default", "完整对象详情"], ["inline", "compact", "紧凑对象查看"],
    ] as const).map(([view, density, label]) => <section key={label} ref={view === "workspace" ? workspace : undefined}
      tabIndex={view === "workspace" ? -1 : undefined} aria-label={label} className={`min-w-0 space-y-3 ${narrow ? "w-full max-w-[320px]" : ""}`}>
      <h3 className="text-block-title">{label}</h3><AgentObjectViewer {...common} view={view} density={density} />
    </section>)}</div>
  </div>
}

export function AgentObjectViewerDemo() {
  const [purpose, setPurpose] = useState<keyof typeof objectViewerExamples>("question")
  const [narrow, setNarrow] = useState(false)
  return <section id="object-viewer" className="mb-12 min-w-0 space-y-5">
    <h2 className="text-section-title">对象查看器 v0.1 · 设计候选</h2>
    <div className="flex flex-wrap gap-3">{(["question", "response"] as const).map(value => <Button key={value} type="button" size="navigation"
      variant={purpose === value ? "secondary" : "outline"} aria-pressed={purpose === value} onClick={() => setPurpose(value)}>{value === "question" ? "题目对象示例" : "学生作答示例"}</Button>)}
      <Button type="button" variant="outline" size="navigation" aria-pressed={narrow} onClick={() => setNarrow(value => !value)}>320px 窄容器</Button>
    </div>
    <ObjectViewerExample key={purpose} purpose={purpose} narrow={narrow} />
  </section>
}
