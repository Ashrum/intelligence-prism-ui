"use client"

import { useRef, useState } from "react"
import { Button } from "../button"
import { AgentArtifactOutput, type AgentArtifactOutputProps, type AgentArtifactOutputRecord, type AgentArtifactOutputStatus } from "../agent-artifact-output"
import { QuestionPrint, createPrintPreferences } from "../question-print"
import { questionSamples } from "../fixtures/question-samples"

type Example = Pick<AgentArtifactOutputProps, "artifact" | "formats" | "layouts" | "ranges" | "versions" | "value" | "recommendedFormatId" | "output" | "queue" | "history">
const paperVersion = { id: "paper-revision-2", label: "v2 · 校对后" }
const reportVersion = { id: "report-revision-3", label: "v3 · 本周记录" }
const oldPaperVersion = { id: "paper-revision-1", label: "v1 · 首次校对" }
const paperRecord: AgentArtifactOutputRecord = {
  id: "paper-output-current", artifactId: "example-paper", title: "函数单元练习 PDF（示例）", version: paperVersion,
  format: "PDF", layout: "A4 纵向", range: "完整试卷",
  status: { state: "ready", file: { id: "paper-example-file", name: "函数单元练习-v2.pdf", version: paperVersion, sizeBytes: 245760, generatedAt: "2026-09-26 09:20", download: { label: "下载动作示例" } } },
}
const reportRecord: AgentArtifactOutputRecord = {
  id: "report-output-current", artifactId: "example-report", title: "班级学情报告 PDF（示例）", version: reportVersion,
  format: "PDF", layout: "A4 报告", range: "班级汇总",
  status: { state: "generating", request: { id: "example-report-request", runId: "example-report-run" } },
}
export const artifactOutputExamples: Record<"paper" | "report", Example> = {
  paper: {
    artifact: { id: "example-paper", title: "函数单元练习导出（示例）", version: paperVersion },
    formats: [{ id: "pdf", label: "PDF", support: "supported" }, { id: "word", label: "Word", support: "lossy", risk: "公式可能转为图片，分页和作答留白可能变化。" }],
    layouts: [{ id: "a4", label: "A4 纵向" }, { id: "a4-wide", label: "A4 纵向 · 宽页边距" }],
    ranges: [{ id: "all", label: "完整试卷" }, { id: "first", label: "第 1 题 · 保留题干、选项及完整数学公式" }],
    versions: [paperVersion, oldPaperVersion],
    value: { formatId: "pdf", layoutId: "a4", rangeId: "all", versionId: paperVersion.id }, recommendedFormatId: "pdf", output: paperRecord,
    queue: [{ ...paperRecord, id: "paper-answer-output", title: "教师答案 PDF（示例）", range: "教师答案", status: { state: "failed", reason: "答案页生成失败，未取得文件。" } }],
    history: [{ ...paperRecord, id: "paper-output-history", title: "首次校对的历史文件（示例）", version: oldPaperVersion,
      status: { state: "ready", file: { id: "paper-history-file", name: "函数单元练习-v1.pdf", version: oldPaperVersion, sizeBytes: 225280, generatedAt: "2026-09-25 16:40" } } }],
  },
  report: {
    artifact: { id: "example-report", title: "高二年级函数单元学习情况与后续教学建议报告导出（示例）", version: reportVersion },
    formats: [{ id: "pdf", label: "PDF", support: "supported" }, { id: "excel", label: "Excel", support: "unsupported", reason: "当前只提供报告正文，尚未提供可导出的明细表。" }],
    layouts: [{ id: "report", label: "A4 报告" }], ranges: [{ id: "class", label: "班级汇总" }, { id: "student", label: "单个学生", disabledReason: "当前未提供个人报告的访问权限。" }],
    versions: [reportVersion], value: { formatId: "pdf", layoutId: "report", rangeId: "class", versionId: reportVersion.id }, recommendedFormatId: "pdf", output: reportRecord,
    queue: [{ ...reportRecord, id: "report-supplement-output", title: "教学建议附页（示例）", range: "教学建议", status: { state: "unknown", reason: "原请求尚未取得明确结果，请先查询。", request: { id: "example-supplement-request", runId: "example-supplement-run" }, query: { label: "查询原请求（示例）" } } }],
    history: [],
  },
}

/** Deliberately supplied sample facts. Export/query/download clicks never call this function. */
export function artifactOutputSampleStatus(state: AgentArtifactOutputStatus["state"], record: AgentArtifactOutputRecord): AgentArtifactOutputStatus {
  switch (state) {
    case "idle": return { state: "idle" }
    case "generating": return { state: "generating", request: { id: "example-current-request", runId: "example-current-run" } }
    case "ready": return { state: "ready", file: { id: "example-current-file", name: `${record.title.replace("（示例）", "")}.pdf`, version: record.version, sizeBytes: 245760, generatedAt: "2026-09-26 09:20", download: { label: "下载动作示例" } } }
    case "failed": return { state: "failed", reason: "文件生成失败，尚未取得可下载文件。" }
    case "unknown": return { state: "unknown", reason: "生成结果尚未确认，请先查询原请求。", request: { id: "example-current-request", runId: "example-current-run" }, query: { label: "查询原请求（示例）" } }
    case "expired": return { state: "expired", reason: "文件已过期，当前无法下载。" }
    case "forbidden": return { state: "forbidden", reason: "当前无权下载此文件。" }
  }
}

export function ArtifactOutputExample({ purpose, narrow }: { purpose: keyof typeof artifactOutputExamples; narrow: boolean }) {
  const example = artifactOutputExamples[purpose]
  const [value, setValue] = useState(example.value), [status, setStatus] = useState(example.output.status)
  const [feedback, setFeedback] = useState("尚未操作示例。")
  const [preferences, setPreferences] = useState(createPrintPreferences), [settingsOpen, setSettingsOpen] = useState(false)
  const workspace = useRef<HTMLElement>(null), trigger = useRef<HTMLButtonElement | null>(null)
  const version = example.versions.find(item => item.id === value.versionId)
  const questions = questionSamples.slice(0, value.rangeId === "first" ? 1 : 2)
  const common: AgentArtifactOutputProps = {
    ...example, value, output: { ...example.output, status },
    onValueChange: intent => {
      setValue(intent.options)
      if (intent.options.layoutId !== value.layoutId) setPreferences(previous => ({ ...previous, margin: intent.options.layoutId === "a4-wide" ? 20 : 16 }))
      setFeedback("输出选项已调整，已有文件和请求记录保持原样。")
    },
    onGenerate: intent => setFeedback(`已演示请求导出 ${example.formats.find(item => item.id === intent.options.formatId)?.label ?? "文件"}，未生成文件。`),
    onDownload: () => setFeedback("已演示下载动作，此示例未提供实际文件。"),
    onQuery: () => setFeedback("已演示查询原请求，状态仍未确认。"),
    onExpand: button => { trigger.current = button; workspace.current?.focus({ preventScroll: true }); workspace.current?.scrollIntoView({ block: "nearest" }) },
    onBack: () => { trigger.current?.focus(); trigger.current?.scrollIntoView({ block: "nearest" }) },
    notice: purpose === "paper" ? "导出与下载为示例动作，打印由浏览器处理。" : "固定示例，未连接报告导出服务。",
    details: "文件状态由上方示例选择独立载入。切换选项、展开或返回不会生成文件，也不会改变历史版本。",
    preview: purpose === "paper" ? <QuestionPrint showQuestionIds={false} title={`函数单元练习（示例）· ${version?.label ?? "版本未选择"}`} description="题卷打印预览 · 示例材料"
      entries={questions.map(question => ({ id: question.id, points: question.points ?? 0 }))} questions={questions}
      versions={Object.fromEntries(questions.map(question => [question.id, version?.label ?? "未选择"]))} blocked={!version} minutes={20}
      preferences={preferences} onPreferencesChange={update => {
        const next = update(preferences)
        setPreferences(next)
        if (next.margin !== preferences.margin) setValue(previous => ({ ...previous, layoutId: next.margin === 20 ? "a4-wide" : "a4" }))
      }} settingsOpen={settingsOpen} onSettingsChange={setSettingsOpen} /> : undefined,
  }
  const samples = { idle: "未开始", generating: "生成中（无进度）", ready: "可下载", failed: "生成失败", unknown: "状态未确认", expired: "已过期", forbidden: "无权下载" } as const
  return <div className="min-w-0 space-y-5">
    <p className="text-ui-hint">三个视图共享输出选项。以下按钮只切换固定示例状态，刷新后还原。</p>
    <div className="flex flex-wrap gap-2">{(Object.keys(samples) as (keyof typeof samples)[]).map(state => <Button key={state} type="button" variant="outline" aria-pressed={status.state === state}
      onClick={() => { setStatus(artifactOutputSampleStatus(state, example.output)); setFeedback(`已载入“${samples[state]}”示例。`) }}>{samples[state]}（示例）</Button>)}</div>
    <p role="status" className="break-words text-ui-hint">{feedback}</p>
    <div className="grid min-w-0 gap-6">{([
      ["inline", "default", "Inline · 快速导出"], ["workspace", "default", "Workspace · 输出选项与预览"], ["inline", "compact", "Compact · 紧凑输出记录"],
    ] as const).map(([view, density, label]) => <section key={`${view}-${density}`} aria-label={label} ref={view === "workspace" ? workspace : undefined} tabIndex={view === "workspace" ? -1 : undefined}
      className={`min-w-0 space-y-3 ${narrow ? "w-full max-w-[320px]" : ""}`}>
      <h3 className="text-block-title">{label}</h3><AgentArtifactOutput {...common} view={view} density={density} />
    </section>)}</div>
  </div>
}

export function AgentArtifactOutputDemo() {
  const [purpose, setPurpose] = useState<keyof typeof artifactOutputExamples>("paper"), [narrow, setNarrow] = useState(false)
  return <section id="artifact-output" className="mb-12 min-w-0 space-y-5">
    <h2 className="text-section-title">成果物输出 v0.1 · 设计候选</h2>
    <div className="flex flex-wrap gap-3">{(["paper", "report"] as const).map(value => <Button key={value} type="button" variant={purpose === value ? "secondary" : "outline"} aria-pressed={purpose === value} onClick={() => setPurpose(value)}>{value === "paper" ? "试卷导出示例" : "学情报告导出示例"}</Button>)}
      <Button type="button" variant="outline" aria-pressed={narrow} onClick={() => setNarrow(value => !value)}>320px 窄容器</Button>
    </div>
    <ArtifactOutputExample key={purpose} purpose={purpose} narrow={narrow} />
  </section>
}
