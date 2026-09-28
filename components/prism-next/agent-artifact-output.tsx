"use client"

import { useId, type ReactNode } from "react"
import { ArrowLeft, ArrowUpRight, Download } from "lucide-react"
import { Card } from "@/components/coss/card"
import { Field, FieldLabel } from "@/components/coss/field"
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from "@/components/coss/select"
import { Badge, type BadgeProps } from "./badge"
import { Button } from "./button"
import { RecordDetails, type AgentRecordViewProps } from "./agent-record-parts"

/** IDs are opaque references for callbacks/keys. Only host-approved labels are displayed. */
export type AgentArtifactVersion = { id: string; label: string }
export type AgentOutputArtifact = { id: string; title: string; version: AgentArtifactVersion }
export type AgentArtifactFormat = { id: string; label: string } & (
  | { support: "supported" }
  | { support: "lossy"; risk: string }
  | { support: "unsupported"; reason: string }
)
export type AgentArtifactOption = { id: string; label: string; disabledReason?: string }
export type AgentArtifactOutputOptions = { formatId: string | null; layoutId: string | null; rangeId: string | null; versionId: string | null }
export type AgentArtifactOutputAction = { label: string; disabledReason?: string }
export type AgentArtifactOutputRequest = { id: string; runId: string }
export type AgentArtifactOutputFile = {
  id: string
  /** Display filename only, never a storage path or URL. */
  name: string
  version: AgentArtifactVersion
  sizeBytes?: number
  generatedAt?: string
  /** Host asserts that this exact file exists and is accessible under current permission. */
  download?: AgentArtifactOutputAction
}
export type AgentArtifactOutputStatus =
  | { state: "idle"; description?: string }
  | { state: "generating"; request: AgentArtifactOutputRequest; progress?: number; description?: string }
  | { state: "ready"; file: AgentArtifactOutputFile; description?: string }
  | { state: "failed"; reason: string }
  | { state: "unknown"; request: AgentArtifactOutputRequest; reason: string; query?: AgentArtifactOutputAction }
  | { state: "expired" | "forbidden"; reason: string }
/** Configuration here is the then-request's readable snapshot, independent of the current selectors. */
export type AgentArtifactOutputRecord = {
  id: string
  artifactId: string
  title: string
  version: AgentArtifactVersion
  format: string
  layout: string
  range: string
  status: AgentArtifactOutputStatus
}
export type AgentArtifactGenerateIntent = { artifactId: string; currentVersionId: string; options: AgentArtifactOutputOptions }
export type AgentArtifactQueryIntent = { artifactId: string; recordId: string; versionId: string; request: AgentArtifactOutputRequest }
export type AgentArtifactDownloadIntent = { artifactId: string; recordId: string; versionId: string; fileId: string }
export type AgentArtifactOutputProps = AgentRecordViewProps & {
  artifact: AgentOutputArtifact
  formats: readonly AgentArtifactFormat[]
  layouts: readonly AgentArtifactOption[]
  ranges: readonly AgentArtifactOption[]
  versions: readonly AgentArtifactOption[]
  value: AgentArtifactOutputOptions
  recommendedFormatId?: string
  output: AgentArtifactOutputRecord
  onValueChange?: (intent: AgentArtifactGenerateIntent) => void
  onGenerate?: (intent: AgentArtifactGenerateIntent) => void
  generateDisabledReason?: string
  onQuery?: (intent: AgentArtifactQueryIntent) => void
  onDownload?: (intent: AgentArtifactDownloadIntent) => void
  /** Host-owned content for the selected version/range. May compose QuestionPrint. */
  preview?: ReactNode
  queue?: readonly AgentArtifactOutputRecord[]
  /** Then-snapshots, always passive: no generation, query or download actions. */
  history?: readonly AgentArtifactOutputRecord[]
  notice?: string
  onBack?: () => void
}

const stateLabels = { idle: "未开始", generating: "生成中", ready: "已生成可下载", failed: "生成失败", unknown: "状态未确认", expired: "已过期", forbidden: "无权下载" }
const stateVariants: Record<AgentArtifactOutputStatus["state"], BadgeProps["variant"]> = {
  idle: "secondary", generating: "info", ready: "success", failed: "error", unknown: "warning", expired: "warning", forbidden: "warning",
}
const supportLabels = { supported: "支持", lossy: "有损", unsupported: "不支持" }
const validId = (value?: string) => typeof value === "string" && !!value.trim()
const uniqueIds = (items: readonly { id: string }[]) => items.every(item => validId(item.id)) && new Set(items.map(item => item.id)).size === items.length
const optionAvailable = (option?: AgentArtifactOption) => !!option && option.disabledReason === undefined
function formatAvailable(format?: AgentArtifactFormat) {
  return format?.support === "supported" || (format?.support === "lossy" && !!format.risk?.trim())
}
function sizeLabel(bytes?: number) {
  if (bytes === undefined || !Number.isFinite(bytes) || bytes < 0) return "大小未确认"
  if (bytes < 1024) return `${bytes} B`
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
function fileLabel(name?: string) {
  return name?.trim() && !/[/\\\r\n]/.test(name) ? name : "文件名称未确认"
}
function OldVersion({ version, current }: { version: AgentArtifactVersion; current: AgentArtifactVersion }) {
  return validId(version.id) && validId(current.id) && version.id !== current.id ? <Badge variant="warning">基于旧版本</Badge> : null
}

function OutputChoice({ label, options, value, disabled, describedBy, showReasons = true, onChange }: {
  label: string; options: readonly AgentArtifactOption[]; value: string | null; disabled: boolean; describedBy: string; showReasons?: boolean; onChange: (id: string) => void
}) {
  const id = useId(), index = options.findIndex(option => option.id === value)
  // Primitive values are local indices; opaque object/format/version IDs never enter DOM attributes.
  const items = options.map((option, position) => ({ value: String(position), label: option.label }))
  return <Field className="min-w-0">
    <FieldLabel htmlFor={id}>{label}</FieldLabel>
    <Select items={items} value={index < 0 ? null : String(index)} disabled={disabled} onValueChange={next => {
      const option = options.find((_, position) => String(position) === next)
      if (!disabled && optionAvailable(option) && option) onChange(option.id)
    }}>
      <SelectTrigger id={id} aria-describedby={`${describedBy}${showReasons ? ` ${id}-options` : ""}`} className="min-w-0 whitespace-normal"><SelectValue className="min-w-0 overflow-visible whitespace-normal break-words text-clip" placeholder={value === null ? "请选择" : "当前选择不可用"} /></SelectTrigger>
      <SelectPopup>{options.map((option, position) => <SelectItem key={option.id} value={String(position)} disabled={!optionAvailable(option)} className="whitespace-normal">{option.label}</SelectItem>)}</SelectPopup>
    </Select>
    {showReasons && <ul id={`${id}-options`} className="space-y-1 text-ui-hint">{options.filter(option => option.disabledReason !== undefined).map(option => <li key={option.id} className="break-words">{option.label}：{option.disabledReason || "当前不可选择。"}</li>)}</ul>}
  </Field>
}

function OutputRecord({ record, artifact, historical = false, queryOnly, actionsAllowed, onQuery, onDownload, compact }: {
  record: AgentArtifactOutputRecord; artifact: AgentOutputArtifact; historical?: boolean; queryOnly: boolean; actionsAllowed: boolean
  onQuery?: AgentArtifactOutputProps["onQuery"]; onDownload?: AgentArtifactOutputProps["onDownload"]; compact: boolean
}) {
  const id = useId(), status = record.status
  const identified = actionsAllowed && validId(record.id) && record.artifactId === artifact.id && validId(record.version.id)
  const file = status.state === "ready" ? status.file : undefined
  const download = file?.download
  const fileMatches = !!file && validId(file.id) && validId(file.version?.id) && file.version.id === record.version.id
  const canDownload = !historical && !queryOnly && identified && fileMatches && download && onDownload
  const query = status.state === "unknown" ? status.query : undefined
  const request = status.state === "unknown" ? status.request : undefined
  const canQuery = !historical && identified && request && validId(request.id) && validId(request.runId) && query && onQuery
  const progress = status.state === "generating" && Number.isFinite(status.progress) && status.progress! >= 0 && status.progress! <= 100 ? status.progress : undefined
  const description = "reason" in status ? status.reason : status.description
  return <section aria-label={record.title} data-output-state={status.state} data-output-history={historical || undefined} className={`min-w-0 ${compact ? "space-y-2" : "space-y-3"}`}>
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <h4 className="min-w-0 break-words text-item-title">{record.title}</h4>
      <Badge variant={stateVariants[status.state]}>{historical ? "当时状态：" : ""}{stateLabels[status.state] ?? "状态未确认"}</Badge>
      <OldVersion version={file?.version ?? record.version} current={artifact.version} />
    </div>
    <p className="break-words text-ui-hint">{historical ? "当时版本" : "输出版本"}：{record.version.label || "版本未确认"} · {record.format || "格式未确认"} · {record.layout || "版式未确认"} · {record.range || "范围未确认"}</p>
    <div id={`${id}-status`} className="min-w-0 space-y-1" role={historical ? undefined : "status"}>
      {description && <p className="break-words text-ui-hint">{description}</p>}
      {progress !== undefined && <p className="text-ui-hint">生成进度：{progress}%</p>}
      {!identified && !historical && <p className="text-ui-hint">输出记录关联未确认，暂不可操作。</p>}
      {status.state === "unknown" && !historical && !canQuery && <p className="text-ui-hint">暂不可查询原请求，请等待状态核实。</p>}
      {file && <div className="min-w-0 space-y-1">
        <p className="break-words text-ui-body">{fileLabel(file.name)}</p>
        <p className="break-words text-ui-hint">文件版本：{file.version?.label || "版本未确认"} · {sizeLabel(file.sizeBytes)} · {file.generatedAt ? `生成于 ${file.generatedAt}` : "生成时间未确认"}</p>
      </div>}
      {status.state === "ready" && !historical && !canDownload && <p className="text-ui-hint">{file && !fileMatches ? "文件与输出版本未能对应，暂不可下载。" : queryOnly ? "请先查询原请求，核实输出状态。" : "暂未提供可用的下载入口。"}</p>}
      {!historical && (canQuery ? query?.disabledReason : canDownload ? download?.disabledReason : undefined) !== undefined && <p className="break-words text-ui-hint">{canQuery ? query?.disabledReason || "当前暂不可查询。" : download?.disabledReason || "当前暂不可下载。"}</p>}
    </div>
    {canQuery && <Button type="button" variant="outline" className="h-auto max-w-full whitespace-normal py-2 sm:h-auto" aria-label={`${query.label}：${record.title}`} aria-describedby={`${id}-status`} disabled={query.disabledReason !== undefined}
      onClick={() => { if (query.disabledReason === undefined) onQuery({ artifactId: artifact.id, recordId: record.id, versionId: record.version.id, request: { ...request } }) }}>{query.label}</Button>}
    {canDownload && <Button type="button" variant="outline" className="h-auto max-w-full whitespace-normal py-2 sm:h-auto" aria-label={`${download.label}：${fileLabel(file.name)}`} aria-describedby={`${id}-status`} disabled={download.disabledReason !== undefined}
      onClick={() => { if (download.disabledReason === undefined) onDownload({ artifactId: artifact.id, recordId: record.id, versionId: file.version.id, fileId: file.id }) }}><Download aria-hidden="true" />{download.label}</Button>}
  </section>
}

/** Semantic 33: output configuration and delivery. Execution (27) and manuscript editing (28) stay separate. */
export function AgentArtifactOutput({ artifact, formats, layouts, ranges, versions, value, recommendedFormatId, output, onValueChange, onGenerate,
  generateDisabledReason, onQuery, onDownload, preview, queue, history, notice, details, onExpand, onBack, view = "inline", density = "default",
}: AgentArtifactOutputProps) {
  const id = useId(), compact = density === "compact"
  const records = [output, ...(queue ?? [])]
  const queryOnly = records.some(record => record.status.state === "unknown")
  const busy = records.some(record => record.status.state === "generating")
  const identified = validId(artifact.id) && validId(artifact.version.id)
  const recordsValid = uniqueIds(records) && records.every(record => record.artifactId === artifact.id && validId(record.version.id))
  const optionsValid = [formats, layouts, ranges, versions].every(uniqueIds)
  const mutable = identified && recordsValid && optionsValid && !queryOnly && !busy && ["idle", "ready", "failed"].includes(output.status.state)
  const format = formats.find(item => item.id === (view === "inline" ? recommendedFormatId : value.formatId))
  const layout = layouts.find(item => item.id === value.layoutId), range = ranges.find(item => item.id === value.rangeId), version = versions.find(item => item.id === value.versionId)
  const selectionValid = formatAvailable(format) && optionAvailable(layout) && optionAvailable(range) && optionAvailable(version)
  const generationVisible = mutable && formatAvailable(format) && !!onGenerate
  const generationBlocked = !selectionValid || generateDisabledReason !== undefined
  const makeIntent = (options: AgentArtifactOutputOptions): AgentArtifactGenerateIntent => ({ artifactId: artifact.id, currentVersionId: artifact.version.id, options: { ...options } })
  const change = (key: keyof AgentArtifactOutputOptions, next: string) => { if (mutable && onValueChange) onValueChange(makeIntent({ ...value, [key]: next })) }
  const choices: { key: keyof AgentArtifactOutputOptions; label: string; options: readonly AgentArtifactOption[] }[] = [
    { key: "formatId", label: "输出格式", options: formats.map(item => ({ id: item.id, label: item.label, disabledReason: formatAvailable(item) ? undefined : item.support === "unsupported" ? item.reason || "不支持此格式。" : "转换风险未确认。" })) },
    { key: "layoutId", label: "版式", options: layouts }, { key: "rangeId", label: "输出范围", options: ranges }, { key: "versionId", label: "成果版本", options: versions },
  ]
  // Inline keeps queue/history facts too: compact must not hide a failed, unknown or old-version file.
  const recordProps = { artifact, queryOnly, actionsAllowed: identified && recordsValid, onQuery, onDownload, compact }
  return <Card aria-labelledby={`${id}-title`} data-agent-artifact-output-view={view} data-density={density} className={`@container min-w-0 ${compact ? "gap-3 p-4" : "gap-5 p-5"}`}>
    <header className="min-w-0 space-y-2">
      <h3 id={`${id}-title`} className="break-words text-block-title">{artifact.title}</h3>
      <p className="break-words text-ui-hint">当前成果版本：{artifact.version.label || "版本未确认"}</p>
    </header>
    <section aria-label="输出设置" className="min-w-0 space-y-3">
      {view === "workspace" ? <div className="grid min-w-0 gap-4 @min-[480px]:grid-cols-2">{choices.map(choice => <OutputChoice key={choice.key} label={choice.label} options={choice.options} value={value[choice.key]}
        disabled={!mutable || !onValueChange} showReasons={choice.key !== "formatId"} describedBy={`${id}-settings`} onChange={next => change(choice.key, next)} />)}</div>
        : <div className="min-w-0 space-y-1">
          <p className="break-words text-ui-action">推荐格式：{format?.label ?? "暂未提供"}</p>
          <p className="break-words text-ui-hint">{layout?.label || "版式未选择"} · {range?.label || "范围未选择"} · {version?.label || "版本未选择"}</p>
        </div>}
      {version && <OldVersion version={version} current={artifact.version} />}
      <div id={`${id}-settings`} className="min-w-0 space-y-2">
        {formats.length ? <ul aria-label="格式支持情况" className="min-w-0 space-y-2">{formats.map(item => <li key={item.id} className="min-w-0 space-y-1">
          <p className="break-words text-ui-hint">{item.label} · {supportLabels[item.support] ?? "能力未确认"}</p>
          {item.support === "lossy" && <p className="break-words text-ui-hint">转换风险：{item.risk || "风险说明未确认。"}</p>}
          {item.support === "unsupported" && <p className="break-words text-ui-hint">{item.reason || "暂未提供不支持的原因。"}</p>}
        </li>)}</ul> : <p className="text-ui-hint">暂未提供格式能力。</p>}
        {view === "inline" && [layout, range, version].filter(item => item?.disabledReason !== undefined).map((item, index) => <p key={index} className="break-words text-ui-hint">{item!.label}：{item!.disabledReason || "当前不可选择。"}</p>)}
        {(!identified || !recordsValid || !optionsValid) && <p className="text-ui-hint">输出关联或选项未确认，暂不可生成。</p>}
        {!selectionValid && <p className="text-ui-hint">请核对可用格式、版式、范围与版本。</p>}
        {generateDisabledReason !== undefined && <p className="break-words text-ui-hint">{generateDisabledReason || "当前暂不可生成。"}</p>}
      </div>
      {generationVisible && <Button type="button" className="h-auto max-w-full whitespace-normal py-2 sm:h-auto" disabled={generationBlocked} aria-describedby={`${id}-settings`}
        onClick={() => { if (!generationBlocked) onGenerate(makeIntent({ ...value, formatId: format!.id })) }}>导出 {format!.label}</Button>}
    </section>
    <OutputRecord {...recordProps} record={output} />
    {view === "workspace" && preview !== undefined && !queryOnly && identified && recordsValid && output.status.state !== "forbidden" && output.status.state !== "expired" && <section aria-label="输出预览" className="min-w-0 space-y-3"><h4 className="text-block-title">预览</h4>{preview}</section>}
    {queue !== undefined && <section aria-label="批量输出队列" className={compact ? "min-w-0 space-y-3" : "min-w-0 space-y-5"}>
      <h4 className="text-block-title">批量输出队列</h4>
      {queue.length ? queue.map(record => <OutputRecord key={record.id} {...recordProps} record={record} />) : <p className="text-ui-hint text-muted-foreground">暂无批量输出任务。</p>}
    </section>}
    {history !== undefined && <section aria-label="历史输出记录" className={compact ? "min-w-0 space-y-3" : "min-w-0 space-y-5"}>
      <h4 className="text-block-title">历史输出记录（只读）</h4>
      {history.length ? history.map(record => <OutputRecord key={record.id} {...recordProps} record={record} historical />) : <p className="text-ui-hint text-muted-foreground">暂无历史输出记录。</p>}
    </section>}
    {notice && <p className="break-words text-ui-hint text-muted-foreground">{notice}</p>}
    <RecordDetails>{details}</RecordDetails>
    {view === "inline" && onExpand && !queryOnly && <div><Button type="button" variant="outline" className="h-auto max-w-full whitespace-normal py-2 sm:h-auto" onClick={event => onExpand(event.currentTarget)}>更多输出选项<ArrowUpRight aria-hidden="true" /></Button></div>}
    {view === "workspace" && onBack && <div><Button type="button" variant="outline" onClick={onBack}><ArrowLeft aria-hidden="true" />返回原位置</Button></div>}
  </Card>
}
