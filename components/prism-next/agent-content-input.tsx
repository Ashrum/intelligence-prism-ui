"use client"

import { useId, type ReactNode } from "react"
import { Card } from "@/components/coss/card"
import { Field, FieldLabel } from "@/components/coss/field"
import { InputGroup, InputGroupAddon } from "@/components/coss/input-group"
import { Textarea } from "@/components/coss/textarea"
import { Badge } from "./badge"
import { Button } from "./button"
import { RecordDetails, type AgentRecordViewProps } from "./agent-record-parts"

export type AgentContentType = "text" | "markdown" | "url-excerpt"
export type AgentContentValidation =
  | { state: "invalid"; message: string }
  | { state: "valid" | "unknown"; message?: string }
export type AgentContentSource =
  | { kind: "paste"; label: string }
  | { kind: "url"; label: string; url: string; fetch?: {
      state: "not-fetched" | "fetching" | "excerpt" | "full" | "failed" | "unknown"
      description?: string
    } }
export type AgentContentField = {
  /** Stable within the material; never used as a visible label or DOM ID. */
  id: string
  label: string
  type: AgentContentType
  value: string
  onChange?: (value: string) => void
  placeholder?: string
  description?: string
  limits?: { maxLength?: number; format?: string }
  validation?: AgentContentValidation
  source?: AgentContentSource
  readOnlyReason?: string
}
export type AgentContentInputContent = AgentContentField | { type: "structured"; fields: readonly AgentContentField[] }
export type AgentContentSaveState = "unsaved" | "saved-draft" | "submitted" | "conflict" | "unknown"
export type AgentContentSave = { state: AgentContentSaveState; description?: string; autoSave?: string }
export type AgentContentDraftValue = Pick<AgentContentField, "id" | "label" | "type" | "value">
export type AgentContentSubmitIntent = {
  inputId: string
  baseVersion?: string
  draftVersion?: string
  fields: readonly AgentContentDraftValue[]
}
export type AgentContentInputProps = AgentRecordViewProps & {
  title: string
  /** Reference to the host's existing task material, not a new business object. */
  inputId: string
  content: AgentContentInputContent
  baseVersion?: string
  draftVersion?: string
  save?: AgentContentSave
  validation?: AgentContentValidation
  conflict?: { baseVersion: string; currentVersion: string; description: string }
  submitted?: { version: string; fields: readonly { label: string; value: string }[] }
  /** Optional, passive current-draft preview; no math dependency in this component. */
  renderPreview?: (field: AgentContentDraftValue) => ReactNode
  readOnlyReason?: string
  describedBy?: string
  onSubmit?: (intent: AgentContentSubmitIntent) => void
  submitLabel?: string
  submitDisabledReason?: string
  onBack?: () => void
  notice?: string
}

const typeLabels = { text: "纯文本", markdown: "Markdown", "url-excerpt": "URL 摘录", structured: "结构化字段组" }
const saveLabels = { unsaved: "未保存", "saved-draft": "已保存草稿", submitted: "已提交", conflict: "冲突", unknown: "状态未确认" }
const fetchLabels = {
  "not-fetched": "未抓取全文", fetching: "正在抓取 · 全文尚未确认", excerpt: "已取得摘录 · 未抓取全文",
  full: "已抓取全文", failed: "抓取失败", unknown: "全文抓取状态未确认",
}
const currentValue = ({ id, label, type, value }: AgentContentField): AgentContentDraftValue => ({ id, label, type, value })

function ContentValidation({ result, id }: { result?: AgentContentValidation; id: string }) {
  if (!result) return null
  const label = result.state === "invalid" ? "校验未通过" : result.state === "valid" ? "校验通过" : "校验状态未确认"
  return <p id={id} role={result.state === "invalid" ? "alert" : "status"} className="whitespace-pre-wrap break-words text-ui-hint">
    {label}{result.message && `：${result.message}`}
  </p>
}

function ContentSource({ field, id }: { field: AgentContentField; id: string }) {
  const source = field.source
  if (!source && field.type !== "url-excerpt") return null
  return <div id={id} className="min-w-0 space-y-1 text-ui-hint">
    <p className="whitespace-pre-wrap break-words">{source?.kind === "paste" ? "粘贴来源" : "来源"}：{source?.label || "未提供"}</p>
    {source?.kind === "url" && <p className="break-all">{source.url}</p>}
    {(source?.kind === "url" || field.type === "url-excerpt") && <p role="status" className="whitespace-pre-wrap break-words">
      {source?.kind === "url" ? fetchLabels[source.fetch?.state ?? "unknown"] : fetchLabels.unknown}
      {source?.kind === "url" && source.fetch?.description && `：${source.fetch.description}`}
    </p>}
  </div>
}

function ContentField({ field, workspace, compact, readOnlyReason, describedBy, renderPreview }: {
  field: AgentContentField; workspace: boolean; compact: boolean; readOnlyReason?: string; describedBy?: string
  renderPreview?: AgentContentInputProps["renderPreview"]
}) {
  const id = useId()
  const reason = readOnlyReason || field.readOnlyReason || (!field.onChange ? "当前内容只读。" : undefined)
  const hasSource = !!field.source || field.type === "url-excerpt"
  const descriptions = [describedBy, `${id}-count`, field.description && `${id}-description`,
    field.limits?.format && `${id}-format`, field.validation && `${id}-validation`, hasSource && `${id}-source`, reason && `${id}-readonly`].filter(Boolean).join(" ")
  return <section className={`min-w-0 ${compact ? "space-y-2" : "space-y-3"}`} aria-labelledby={`${id}-label`}>
    <Field invalid={field.validation?.state === "invalid"} className="w-full min-w-0">
      <FieldLabel id={`${id}-label`} htmlFor={`${id}-value`}>{field.label}</FieldLabel>
      {field.description && <p id={`${id}-description`} className="text-ui-hint whitespace-pre-wrap break-words">{field.description}</p>}
      <InputGroup aria-labelledby={`${id}-label`}>
        <Textarea unstyled id={`${id}-value`} value={field.value} rows={workspace ? 8 : 3}
          placeholder={field.placeholder} readOnly={!!reason} aria-invalid={field.validation?.state === "invalid" || undefined}
          aria-describedby={descriptions} className="text-read-body"
          onChange={event => { if (!reason) field.onChange?.(event.target.value) }} />
        <InputGroupAddon align="block-end" className="flex-wrap">
          <p id={`${id}-count`} className="text-ui-hint break-words">{[...field.value].length} 字符{field.limits?.maxLength !== undefined && ` / 上限 ${field.limits.maxLength} 字符`}</p>
          <span className="text-ui-hint">{typeLabels[field.type]}</span>
        </InputGroupAddon>
      </InputGroup>
      {field.limits?.format && <p id={`${id}-format`} className="text-ui-hint whitespace-pre-wrap break-words">格式要求：{field.limits.format}</p>}
      <ContentValidation result={field.validation} id={`${id}-validation`} />
      {reason && <p id={`${id}-readonly`} className="text-ui-hint whitespace-pre-wrap break-words">{reason}</p>}
    </Field>
    <ContentSource field={field} id={`${id}-source`} />
    {workspace && renderPreview && <div className="min-w-0 max-w-[40em] text-read-body">{renderPreview(currentValue(field))}</div>}
  </section>
}

export function AgentContentInput({ title, inputId, content, baseVersion, draftVersion, save, validation, conflict, submitted,
  renderPreview, readOnlyReason, describedBy, onSubmit, submitLabel = "提交内容", submitDisabledReason, onExpand, onBack,
  view = "inline", density = "default", notice, details }: AgentContentInputProps) {
  const id = useId(), workspace = view === "workspace", compact = density === "compact"
  const fields = content.type === "structured" ? content.fields : [content]
  const state = save?.state ?? "unknown"
  const blocked = readOnlyReason || submitDisabledReason || (conflict || state === "conflict" ? "请先核对冲突版本，再提交内容。" : undefined)
    || (!inputId.trim() || fields.some(field => !field.id.trim()) || new Set(fields.map(field => field.id)).size !== fields.length ? "内容归属未确认，暂不可提交。" : undefined)
  const descriptions = [describedBy, `${id}-save`, validation && `${id}-validation`, conflict && `${id}-conflict`].filter(Boolean).join(" ")
  return <Card data-content-input-view={view} data-content-input-density={density} className={`min-w-0 ${compact ? "gap-3 p-3" : "gap-4 p-4"}`}>
    <header className="min-w-0 space-y-2">
      <h3 className="break-words text-block-title">{title}</h3>
      <p className="text-ui-hint">{typeLabels[content.type]} · 当前草稿{draftVersion && ` ${draftVersion}`}</p>
      {baseVersion && <p className="text-ui-hint break-words">基准版本：{baseVersion}</p>}
      <div id={`${id}-save`} role="status" className="space-y-1">
        <Badge variant={state === "conflict" || state === "unknown" ? "warning" : "outline"}>{saveLabels[state]}</Badge>
        {save?.description && <p className="text-ui-hint whitespace-pre-wrap break-words">{save.description}</p>}
        {save?.autoSave && <p className="text-ui-hint whitespace-pre-wrap break-words">自动保存：{save.autoSave}</p>}
      </div>
      {submitted && <p className="text-ui-hint break-words">已提交版本：{submitted.version}</p>}
    </header>
    {conflict && <div id={`${id}-conflict`} role="alert" className="space-y-1 text-ui-hint">
      <p className="break-words">版本冲突 · 基准 {conflict.baseVersion} / 当前 {conflict.currentVersion}</p>
      <p className="whitespace-pre-wrap break-words">{conflict.description}</p>
    </div>}
    <ContentValidation result={validation} id={`${id}-validation`} />
    <div className={`min-w-0 ${workspace ? "max-w-[40em]" : ""} ${compact ? "space-y-3" : "space-y-5"}`}>
      {fields.map(field => <ContentField key={field.id} field={field} workspace={workspace} compact={compact}
        readOnlyReason={readOnlyReason} describedBy={descriptions} renderPreview={renderPreview} />)}
      {!fields.length && <p className="text-ui-hint">尚未提供输入字段。</p>}
    </div>
    {workspace && submitted && <section aria-label="已提交内容" className="min-w-0 max-w-[40em] space-y-3">
      <h4 className="text-block-title">已提交内容 · {submitted.version}</h4>
      {submitted.fields.map((field, index) => <div key={index} className="space-y-1">
        <h5 className="text-ui-action break-words">{field.label}</h5><p className="text-read-body whitespace-pre-wrap break-words">{field.value}</p>
      </div>)}
    </section>}
    {notice && <p className="text-ui-hint text-muted-foreground whitespace-pre-wrap break-words">{notice}</p>}
    <RecordDetails>{details}</RecordDetails>
    <footer className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {onSubmit && <Button type="button" size="navigation" disabled={!!blocked} aria-describedby={blocked ? `${id}-blocked` : descriptions}
          onClick={() => { if (!blocked) onSubmit({ inputId, baseVersion, draftVersion, fields: fields.map(currentValue) }) }}>{submitLabel}</Button>}
        {!workspace && onExpand && <Button type="button" size="navigation" variant="outline" onClick={event => onExpand(event.currentTarget)}>展开编辑</Button>}
        {workspace && onBack && <Button type="button" size="navigation" variant="ghost" onClick={onBack}>返回原位置</Button>}
      </div>
      {onSubmit && blocked && <p id={`${id}-blocked`} className="text-ui-hint whitespace-pre-wrap break-words">{blocked}</p>}
    </footer>
  </Card>
}
