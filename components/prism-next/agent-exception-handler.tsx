"use client"

import { useId, type ReactNode } from "react"
import { ArrowLeft, ArrowUpRight, Check, CircleAlert, CircleHelp, CircleMinus, Clock3 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/coss/alert"
import { Button } from "@/components/coss/button"
import { Card } from "@/components/coss/card"
import { Badge } from "./badge"
import { AgentStepStatus } from "./agent-components"
import { RecordDetails, type AgentRecordViewProps } from "./agent-record-parts"

export type AgentExceptionKind = "low-confidence" | "conflict" | "missing" | "unparseable"
export type AgentExceptionState = "waiting-human" | "waiting" | "unknown" | "resolved" | "failed" | "ignored" | "skipped"

/** IDs identify host-registered capabilities, not scripts, URLs or authorization. */
export type AgentExceptionAction = {
  id: string
  label: string
  impact: string
  disabledReason?: string
}

export type AgentExceptionRequest = { id: string; label: string }
export type AgentExceptionResolution = { method: string; time?: string }

export type AgentExceptionDisposition = { description: string } & (
  | { state: "waiting-human" | "failed"; actions?: readonly AgentExceptionAction[] }
  | { state: "waiting" | "unknown"; request: AgentExceptionRequest; query?: AgentExceptionAction }
  | { state: "resolved" | "ignored" | "skipped"; resolution: AgentExceptionResolution; actions?: readonly AgentExceptionAction[] }
)

export type AgentExceptionIntent =
  | { kind: "handle"; exceptionId: string; actionId: string }
  | { kind: "query"; exceptionId: string; actionId: string; requestId: string }

/** Passive, already-authorized evidence. Previewing never creates a read/citation fact. */
export type AgentExceptionEvidence = {
  id: string
  label: string
  location: string
  version?: string
  preview?: ReactNode
  unavailableReason?: string
}

/** An immutable input snapshot; no field is filled from the current disposition. */
export type AgentExceptionRecord = {
  id: string
  state: AgentExceptionState
  description: string
  scope: string
  basis: string
  method?: string
  time?: string
  request?: AgentExceptionRequest
}

export type AgentExceptionItem = {
  id: string
  title: string
  kind: AgentExceptionKind
  scope: string
  retained: string
  basis: string
  disposition: AgentExceptionDisposition
  critical?: boolean
  disabledReason?: string
  evidence?: readonly AgentExceptionEvidence[]
  history?: readonly AgentExceptionRecord[]
}

export type AgentExceptionHandlerProps = AgentRecordViewProps & {
  title: string
  items: readonly AgentExceptionItem[]
  inlineLimit?: number
  notice?: string
  disabledReason?: string
  onAction?: (intent: AgentExceptionIntent) => void
  /** Pure view navigation. Returning does not resume, cancel or submit anything. */
  onBack?: () => void
}

const kindLabels: Record<AgentExceptionKind, string> = {
  "low-confidence": "识别不确定", conflict: "内容冲突", missing: "信息缺失", unparseable: "无法解析",
}

function ExceptionStatus({ state }: { state: AgentExceptionState }) {
  const Icon = state === "resolved" ? Check : state === "unknown" ? CircleHelp : state === "waiting" ? Clock3 : state === "ignored" || state === "skipped" ? CircleMinus : CircleAlert
  return <span className="inline-flex max-w-full items-center gap-2">
    <Icon aria-hidden="true" className="size-4 shrink-0" />
    {state === "resolved" || state === "ignored" || state === "skipped"
      ? <Badge variant={state === "resolved" ? "success" : "outline"}>{{ resolved: "已处置", ignored: "已忽略", skipped: "已跳过" }[state]}</Badge>
      : <AgentStepStatus state={state === "failed" ? "error" : state} />}
  </span>
}

function ExceptionAction({ action, title, intent, disabledReason, onAction }: {
  action: AgentExceptionAction
  title: string
  intent: AgentExceptionIntent
  disabledReason?: string
  onAction?: AgentExceptionHandlerProps["onAction"]
}) {
  const id = useId()
  const reason = [disabledReason, action.disabledReason, !onAction && "当前无法执行此操作。", intent.kind === "query" && !intent.requestId && "原请求未确认，暂不可查询。"].filter(Boolean).join("；")
  return <li className="min-w-0 space-y-2">
    <Button type="button" variant="outline" className="max-w-full whitespace-normal" aria-label={`${action.label}：${title}`} disabled={!!reason}
      aria-describedby={`${id}-impact${reason ? ` ${id}-disabled` : ""}`}
      onClick={() => { if (!reason && onAction) onAction(intent) }}>{action.label}</Button>
    <p id={`${id}-impact`} className="break-words text-ui-hint">{action.impact}</p>
    {reason && <p id={`${id}-disabled`} role="status" className="break-words text-ui-hint text-muted-foreground">{reason}</p>}
  </li>
}

function Evidence({ items }: { items: readonly AgentExceptionEvidence[] }) {
  return <section className="min-w-0 space-y-3" aria-label="原始材料与证据">
    <h5 className="text-ui-action">原始材料与证据</h5>
    {items.length ? <ul className="space-y-4">{items.map(item => <li key={item.id} className="min-w-0 space-y-2">
      <p className="break-words text-item-title">{item.label}</p>
      <p className="break-words text-ui-hint">{item.location} · {item.version || "来源版本未确认"}</p>
      {item.unavailableReason
        ? <p role="status" className="break-words text-ui-hint">{item.unavailableReason}</p>
        : item.preview != null ? <div className="min-w-0 break-words">{item.preview}</div>
          : <p className="text-ui-hint text-muted-foreground">暂未提供材料预览。</p>}
    </li>)}</ul> : <p className="text-ui-hint text-muted-foreground">暂无可核对的材料记录。</p>}
  </section>
}

function HistoryRecords({ records, compact }: { records: readonly AgentExceptionRecord[]; compact: boolean }) {
  return <section className="min-w-0 space-y-3" aria-label="处置记录">
    <h5 className="text-ui-action">处置记录（当时事实）</h5>
    {records.length ? <ol className={compact ? "space-y-3" : "space-y-5"}>{records.map(record => <li key={record.id} data-exception-record={record.id} className="min-w-0 space-y-2">
      <div className="flex flex-wrap items-center gap-2"><span className="text-ui-hint">当时状态</span><ExceptionStatus state={record.state} /></div>
      <p className="break-words text-ui-body">{record.description}</p>
      <p className="break-words text-ui-hint">当时范围：{record.scope}</p>
      <p className="break-words text-ui-hint">当时依据：{record.basis}</p>
      <p className="break-words text-ui-hint">当时处置方式：{record.method || "未记录"}</p>
      <p className="break-words text-ui-hint">记录时间：{record.time || "时间未确认"}</p>
      {record.request && <p className="break-words text-ui-hint" data-request-id={record.request.id}>当时请求：{record.request.label}</p>}
    </li>)}</ol> : <p className="text-ui-hint text-muted-foreground">暂无处置记录。</p>}
  </section>
}

function ExceptionItem({ item, full, compact, disabledReason, onAction }: {
  item: AgentExceptionItem
  full: boolean
  compact: boolean
  disabledReason?: string
  onAction?: AgentExceptionHandlerProps["onAction"]
}) {
  const id = useId()
  const disposition = item.disposition
  const pending = disposition.state === "waiting" || disposition.state === "unknown"
  const reason = [disabledReason, item.disabledReason].filter(Boolean).join("；") || undefined
  // The discriminant is also checked at runtime: untyped actions cannot bypass unknown/waiting.
  const actions = pending ? [] : "actions" in disposition ? disposition.actions ?? [] : []
  const query = pending ? disposition.query : undefined
  const request = pending ? disposition.request : undefined
  const terminal = disposition.state === "resolved" || disposition.state === "ignored" || disposition.state === "skipped"
  const statusText = `${disposition.state === "unknown" ? "处置回执未确认。" : disposition.state === "waiting" ? "处置提交中。" : disposition.state === "failed" ? "处置失败。" : ""}${disposition.description}`
  return <li data-exception-id={item.id} data-exception-state={disposition.state} className={compact ? "min-w-0 space-y-3" : "min-w-0 space-y-4"} aria-labelledby={id}>
    <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
      <div className="min-w-0 space-y-1"><h4 id={id} className="break-words text-item-title">{item.title}</h4><p className="text-ui-hint text-muted-foreground">{kindLabels[item.kind]}</p></div>
      <div className="flex max-w-full flex-wrap items-center gap-2"><span className="text-ui-hint">当前处置</span><ExceptionStatus state={disposition.state} /></div>
    </div>
    <dl className={compact ? "flex min-w-0 flex-wrap gap-x-6 gap-y-2" : "grid min-w-0 gap-3 @min-[540px]:grid-cols-2"}>
      {[{ label: "影响范围", value: item.scope }, { label: "已保留", value: item.retained }].map(fact => <div key={fact.label} className="min-w-0"><dt className="text-ui-hint text-muted-foreground">{fact.label}</dt><dd className="break-words text-ui-body">{fact.value}</dd></div>)}
    </dl>
    {disposition.state === "unknown" || disposition.state === "failed"
      ? <Alert role="status" variant={disposition.state === "failed" ? "error" : "warning"}><AlertDescription className="break-words text-ui-hint">{statusText}</AlertDescription></Alert>
      : <p role="status" className="break-words text-ui-hint">{statusText}</p>}
    {pending && <p className="break-words text-ui-hint" data-request-id={disposition.request?.id}>原请求：{disposition.request?.label || "原请求未确认"}</p>}
    {terminal && <div className="space-y-1"><p className="break-words text-ui-hint">处置方式：{disposition.resolution?.method || "方式未确认"}</p><p className="break-words text-ui-hint">处置时间：{disposition.resolution?.time || "时间未确认"}</p></div>}
    {reason && !actions.length && !query && <p role="status" className="break-words text-ui-hint text-muted-foreground">{reason}</p>}
    {full && <>
      <Evidence items={item.evidence ?? []} />
      <section className="min-w-0 space-y-2" aria-label="判定依据"><h5 className="text-ui-action">判定依据</h5><p className="whitespace-pre-wrap break-words text-ui-body">{item.basis}</p></section>
    </>}
    {(actions.length > 0 || query) && <ul aria-label={`可选处置：${item.title}`} className={compact ? "grid min-w-0 gap-3" : "grid min-w-0 gap-4 @min-[540px]:grid-cols-2"}>
      {query && <ExceptionAction action={query} title={item.title} intent={{ kind: "query", exceptionId: item.id, actionId: query.id, requestId: request?.id ?? "" }} disabledReason={reason} onAction={onAction} />}
      {actions.map(action => <ExceptionAction key={action.id} action={action} title={item.title} intent={{ kind: "handle", exceptionId: item.id, actionId: action.id }} disabledReason={reason} onAction={onAction} />)}
    </ul>}
    {pending && !query && <p className="text-ui-hint text-muted-foreground">暂未提供原请求查询入口。</p>}
    {!pending && !actions.length && <p className="text-ui-hint text-muted-foreground">暂无可用的处置操作。</p>}
    {full && <HistoryRecords records={item.history ?? []} compact={compact} />}
  </li>
}

/** Inline + dedicated workspace content. All business facts and capabilities remain external. */
export function AgentExceptionHandler({ title, items, view = "inline", density = "default", inlineLimit = 2, notice, details, disabledReason, onAction, onExpand, onBack }: AgentExceptionHandlerProps) {
  const id = useId()
  const full = view === "workspace", compact = density === "compact"
  const limit = Number.isFinite(inlineLimit) ? Math.max(1, Math.floor(inlineLimit)) : 2
  // Match ExecutionResult: unknown never exposes a non-query execution/expansion entry.
  // Without an expansion entry, preserve all items, including unresolved ones beyond the limit.
  const expandable = !full && !!onExpand && !items.some(item => item.disposition.state === "unknown")
  const shown = !expandable ? items : items.filter((item, index) => index < limit || item.critical || item.disposition.state === "failed" || item.disposition.state === "waiting")
  return <Card aria-labelledby={id} data-agent-exception-view={view} data-agent-exception-density={density} className={compact ? "@container min-w-0 gap-3 p-4" : "@container min-w-0 gap-5 p-5 sm:p-6"}>
    <div className="min-w-0 space-y-2"><h3 id={id} className="break-words text-block-title">{title}</h3><p className="text-ui-hint">共 {items.length} 项异常{shown.length < items.length && <> · 当前显示 {shown.length} 项</>}</p></div>
    {notice && <p role="status" className="break-words text-ui-hint text-muted-foreground">{notice}</p>}
    {items.length ? <ol aria-label="异常列表" className={compact ? "space-y-4" : "space-y-6"}>{shown.map(item => <ExceptionItem key={item.id} item={item} full={full} compact={compact} disabledReason={disabledReason} onAction={onAction} />)}</ol>
      : <p className="text-ui-hint text-muted-foreground">暂无异常记录。</p>}
    {expandable && items.length > 0 && <div className="space-y-2">{shown.length < items.length && <p className="text-ui-hint text-muted-foreground">另有 {items.length - shown.length} 项异常，展开查看全部。</p>}<Button type="button" variant="outline" className="max-w-full whitespace-normal" onClick={event => onExpand?.(event.currentTarget)}>查看全部 {items.length} 项异常<ArrowUpRight aria-hidden="true" /></Button></div>}
    {full && onBack && <Button type="button" variant="outline" className="max-w-full self-start whitespace-normal" onClick={onBack}><ArrowLeft aria-hidden="true" />返回</Button>}
    <RecordDetails>{details}</RecordDetails>
  </Card>
}
