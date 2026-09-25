"use client"

import { useRef, useState } from "react"
import { Button } from "../button"
import { AgentComposer } from "../agent-components"
import { AgentFileInput, type AgentFileCapabilities, type AgentFileInputProps, type AgentFileIntent, type AgentFileItem, type AgentFileLimits } from "../agent-file-input"
import { RootFormula } from "../math-content"

const mb = 1024 * 1024
const actions = { remove: {}, replace: {}, move: {} }
export const fileInputExamples: Record<"scan" | "preparation", { title: string; limits: AgentFileLimits; capabilities: AgentFileCapabilities; items: AgentFileItem[] }> = {
  scan: {
    title: "扫描试卷图片与 PDF（示例）",
    limits: { accept: ".pdf,.png,.jpg,.jpeg", acceptLabel: "PDF、PNG、JPG", maxFileSize: 20 * mb, maxFiles: 12 },
    capabilities: { select: { status: "supported" }, upload: { status: "unsupported", reason: "当前仅做本机类型、大小和数量检查。" }, drop: { status: "supported" } },
    items: [
      { id: "scan-local", name: "九年级数学试卷第1页.png", type: "PNG", sizeBytes: 2 * mb, source: { kind: "local" }, status: { state: "selected" }, actions },
      { id: "scan-invalid", name: "九年级数学试卷第2页_超过大小限制的扫描原图.png", type: "PNG", sizeBytes: 24 * mb, source: { kind: "local" }, status: { state: "invalid", validation: "size", reason: "24 MB 超过单个文件 20 MB 的限制。" }, actions },
      { id: "scan-existing", name: "勾股定理综合练习_含完整题干与分式条件的四页扫描材料.pdf", type: "PDF", sizeBytes: 4 * mb, source: { kind: "existing", label: "示例材料库" }, version: "示例 v1", status: { state: "selected" }, actions,
        details: <p>已选择预置材料引用；没有发生本机文件上传。</p>, preview: <div className="min-w-0 space-y-2"><p>预置内容节选（示例）</p><div className="overflow-x-auto text-read-body"><RootFormula /></div></div> },
      { id: "scan-removed", name: "重复扫描页.jpg", type: "JPG", sizeBytes: mb, source: { kind: "local" }, status: { state: "removed" } },
    ],
  },
  preparation: {
    title: "备课资料 Word 与 Excel（示例）",
    limits: { accept: ".doc,.docx,.xls,.xlsx", acceptLabel: "Word、Excel", maxFileSize: 10 * mb, maxFiles: 12 },
    capabilities: { select: { status: "supported" }, upload: { status: "limited", reason: "仅展示预置记录与操作反馈，真实文件上传未接入。" }, drop: { status: "unsupported", reason: "此设备示例使用文件选择入口。" } },
    items: [
      { id: "prep-failed", name: "二次方程教学设计.docx", type: "Word", sizeBytes: mb, source: { kind: "local" }, status: { state: "failed", reason: "示例记录：上传服务明确返回接收失败。", request: { id: "sample-upload-1", label: "教学设计上传" }, retry: {} }, actions },
      { id: "prep-unknown", name: "跨班教学安排与课时分配表.xlsx", type: "Excel", sizeBytes: 12000, source: { kind: "local" }, status: { state: "unknown", reason: "示例记录：请求已发出，回执未确认。", request: { id: "sample-upload-2", label: "教学安排上传" }, query: {} } },
      { id: "prep-queued", name: "课堂追问清单.docx", type: "Word", sizeBytes: 36000, source: { kind: "local" }, status: { state: "queued" }, actions },
      { id: "prep-uploading", name: "练习分层安排.xlsx", type: "Excel", sizeBytes: 24000, source: { kind: "local" }, status: { state: "uploading", request: { id: "sample-upload-3", label: "练习安排上传" } }, actions: { remove: { disabledReason: "请先核对正在上传的请求。" } } },
      { id: "prep-progress", name: "教学活动记录.docx", type: "Word", sizeBytes: 64000, source: { kind: "local" }, status: { state: "uploading", request: { id: "sample-upload-4", label: "活动记录上传" }, progress: 42 } },
      { id: "prep-uploaded", name: "函数复习教学提纲.docx", type: "Word", sizeBytes: 48000, source: { kind: "existing", label: "预置上传记录" }, version: "示例 v2", status: { state: "uploaded", uploadedAt: "2026-09-25 09:00（示例）" }, processing: { label: "解析中（示例）", description: "来自单独提供的处理记录。" }, actions },
    ],
  },
}

/** Demo host only: metadata checks, never content reading, upload or persistent File storage. */
export function checkExampleFiles(files: readonly File[], limits: AgentFileLimits, existingCount: number, idPrefix: string): AgentFileItem[] {
  const extensions = limits.accept.toLowerCase().split(",")
  return files.map((file, index) => {
    const dot = file.name.lastIndexOf(".")
    const extension = dot < 0 ? "" : file.name.slice(dot).toLowerCase()
    const status: AgentFileItem["status"] = !extensions.includes(extension)
      ? { state: "invalid", validation: "type", reason: `请选择 ${limits.acceptLabel} 文件。` }
      : file.size === 0 || file.size > limits.maxFileSize ? { state: "invalid", validation: "size", reason: file.size === 0 ? "文件为空，请重新选择。" : "文件超过单个文件大小限制。" }
        : existingCount + index >= limits.maxFiles ? { state: "invalid", validation: "count", reason: `最多可保留 ${limits.maxFiles} 个文件，请先移除多余文件。` }
          : { state: "selected" }
    return { id: `${idPrefix}-${index}`, name: file.name, type: extension.replace(".", "").toUpperCase() || "类型未确认", sizeBytes: file.size,
      source: { kind: "local" }, status, actions }
  })
}

export function FileInputExample({ purpose, narrow }: { purpose: keyof typeof fileInputExamples; narrow: boolean }) {
  const example = fileInputExamples[purpose]
  const [items, setItems] = useState(example.items)
  const [groupBy, setGroupBy] = useState<"none" | "status">("none")
  const [feedback, setFeedback] = useState("尚未请求操作。")
  const [prompt, setPrompt] = useState("")
  const sequence = useRef(0)
  const workspace = useRef<HTMLElement>(null)
  const trigger = useRef<HTMLButtonElement | null>(null)
  const select: AgentFileInputProps["onSelect"] = files => {
    const additions = checkExampleFiles(files, example.limits, items.filter(item => item.status.state !== "removed").length, `local-${++sequence.current}`)
    setItems(previous => [...previous, ...additions])
    setFeedback(`已检查 ${files.length} 个本机文件的类型、大小和数量；没有上传或读取内容。`)
  }
  function action(intent: AgentFileIntent) {
    const item = items.find(value => value.id === intent.fileId)
    if (!item) return
    if (intent.kind === "move") {
      setItems(previous => {
        const next = [...previous], from = next.findIndex(value => value.id === intent.fileId), to = next.findIndex(value => value.id === intent.adjacentId)
        if (from >= 0 && to >= 0) [next[from], next[to]] = [next[to], next[from]]
        return next
      })
      setFeedback(`已调整本页示例中「${item.name}」的顺序。`)
    } else if (intent.kind === "remove") {
      setItems(previous => previous.map(value => value.id === intent.fileId ? { ...value, status: { state: "removed" } } : value))
      setFeedback(`已从本页示例队列移除「${item.name}」；没有删除原文件。`)
    } else if (intent.kind === "query") setFeedback(`已请求查询「${intent.requestId}」；没有收到新回执，状态保持未确认。`)
    else if (intent.kind === "retry") setFeedback(`已请求重试「${item.name}」；此示例不实际上传，原记录保留。`)
    else setFeedback(`已请求替换「${item.name}」；此示例保留原文件记录，可选择新文件进行本机检查。`)
  }
  const expand = (button: HTMLButtonElement) => {
    trigger.current = button
    workspace.current?.focus({ preventScroll: true })
    workspace.current?.scrollIntoView({ block: "nearest" })
  }
  const removable = items.filter(item => !["unknown", "removed", "uploading", "received"].includes(item.status.state)).map(item => item.id)
  const common: AgentFileInputProps = {
    title: example.title, items, limits: example.limits, capabilities: example.capabilities, onSelect: select, onAction: action,
    inlineLimit: 2, onExpand: expand, groupBy, onGroupByChange: setGroupBy,
    batchActions: [
      { id: "remove", label: "移除可移除文件", kind: "remove", fileIds: removable },
      { id: "upload", label: "上传全部", kind: "upload", fileIds: items.filter(item => item.status.state !== "removed").map(item => item.id), disabledReason: "此示例不实际上传。" },
    ],
    onBatchAction: intent => {
      if (intent.kind === "remove") setItems(previous => previous.map(item => intent.fileIds.includes(item.id) ? { ...item, status: { state: "removed" } } : item))
      setFeedback("已更新本页示例队列；没有上传或删除原文件。")
    },
    onBack: () => { trigger.current?.focus(); trigger.current?.scrollIntoView({ block: "nearest" }) },
    notice: "示例不实际上传；刷新后本页选择还原。",
    details: <p>类型检查仅依据文件名后缀，大小检查依据本机元数据。既有上传与后续处理记录都是固定示例，选择新文件不会改变这些记录，也不会生成题目。</p>,
  }
  return <div className="min-w-0 space-y-5">
    <p className="text-ui-hint">固定示例 · 两种用途共用文件输入，三处呈现共用本页队列。</p>
    <p role="status" className="break-words text-ui-hint">{feedback}</p>
    <div className="grid min-w-0 gap-6">{([
      ["inline", "default", "对话中的少量文件"], ["workspace", "default", "完整队列与文件管理"], ["inline", "compact", "紧凑文件队列与任务输入"],
    ] as const).map(([view, density, label]) => <section key={`${view}-${density}`} ref={view === "workspace" ? workspace : undefined}
      tabIndex={view === "workspace" ? -1 : undefined} aria-label={label} className={`min-w-0 space-y-3 ${narrow ? "w-full max-w-[320px]" : ""}`}>
      <h3 className="text-block-title">{label}</h3>
      {density === "compact" ? <AgentComposer variant="conversation" value={prompt} onChange={setPrompt} sendDisabledReason="此示例暂不能运行任务。" onSubmit={() => {}}
        attachments={<AgentFileInput {...common} view={view} density={density} />}
        tools={<Button type="button" variant="outline" size="navigation" onClick={event => expand(event.currentTarget)}>查看文件队列</Button>} />
        : <AgentFileInput {...common} view={view} density={density} />}
    </section>)}</div>
  </div>
}

export function AgentFileInputDemo() {
  const [purpose, setPurpose] = useState<keyof typeof fileInputExamples>("scan")
  const [narrow, setNarrow] = useState(false)
  return <section id="file-input" className="mb-12 min-w-0 space-y-5">
    <h2 className="text-section-title">文件输入 v0.1 · 设计候选</h2>
    <div className="flex flex-wrap gap-3">{(["scan", "preparation"] as const).map(value => <Button key={value} type="button" variant={purpose === value ? "secondary" : "outline"} size="navigation"
      aria-pressed={purpose === value} onClick={() => setPurpose(value)}>{value === "scan" ? "扫描试卷示例" : "备课资料示例"}</Button>)}
      <Button type="button" size="navigation" variant="outline" aria-pressed={narrow} onClick={() => setNarrow(value => !value)}>320px 窄容器</Button>
    </div>
    <FileInputExample key={purpose} purpose={purpose} narrow={narrow} />
  </section>
}
