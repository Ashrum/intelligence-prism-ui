"use client"

import { useId, type ReactNode } from "react"
import { ArrowLeft, ArrowUpRight } from "lucide-react"
import { Alert, AlertDescription } from "@/components/coss/alert"
import { Button } from "@/components/coss/button"
import { Card } from "@/components/coss/card"
import { Field, FieldLabel } from "@/components/coss/field"
import { Textarea } from "@/components/coss/textarea"
import { Badge } from "./badge"
import { RecordDetails, type AgentRecordViewProps } from "./agent-record-parts"

export type AgentItemReviewState = "waiting-human" | "draft" | "waiting" | "unknown" | "resolved" | "failed" | "expired"
export type AgentItemReviewTarget = { id: string; title: string; version: string }
export type AgentItemReviewAction = { id: string; label: string; impact: string; disabledReason?: string }
export type AgentItemReviewRequest = { id: string; label: string }
export type AgentItemReviewResolution = { reviewer: string; version: string; time?: string }

/** Only the host can supply a receipt. Actions never advance this state. */
export type AgentItemReview = { description: string } & (
  | { state: "waiting-human" | "draft" | "failed"; actions?: readonly AgentItemReviewAction[] }
  | { state: "waiting" | "unknown"; request: AgentItemReviewRequest; query?: AgentItemReviewAction }
  | { state: "resolved"; resolution: AgentItemReviewResolution }
  | { state: "expired" }
)

export type AgentItemReviewIntent = { itemId: string; version: string; actionId: string } & (
  | { kind: "review" }
  | { kind: "query"; requestId: string }
  | { kind: "restart"; currentVersion?: string }
)

/** Historical fields belong to the record, never to the currently displayed item. */
export type AgentItemReviewRecord = {
  id: string
  item: AgentItemReviewTarget
  state: AgentItemReviewState
  description: string
  reviewer?: string
  time?: string
  resultVersion?: string
  reason?: string
  request?: AgentItemReviewRequest
}

export type AgentItemReviewEditor<T> = {
  value: T
  onChange: (value: T) => void
  readOnly: boolean
  describedBy?: string
}

export type AgentItemReviewDraft<T> = {
  value: T
  onChange: (value: T) => void
  /** Use controlled fields; honor readOnly. Domain scoring belongs here, not in the reviewer. */
  render: (editor: AgentItemReviewEditor<T>) => ReactNode
}

export type AgentItemReviewerProps<T = string> = AgentRecordViewProps & {
  item: AgentItemReviewTarget
  review: AgentItemReview
  checkpoints: readonly string[]
  summary: ReactNode
  /** Its presence is the host's explicit version-conflict fact, including when the new version is unknown. */
  versionChange?: { currentVersion?: string; description?: string }
  restart?: AgentItemReviewAction
  draft?: AgentItemReviewDraft<T>
  reason?: { value: string; onChange: (value: string) => void }
  /** Already-authorized, passive content. Neither slot may introduce submission actions. */
  evidence?: ReactNode
  comparison?: ReactNode
  history?: readonly AgentItemReviewRecord[]
  notice?: string
  disabledReason?: string
  onAction?: (intent: AgentItemReviewIntent) => void
  /** View navigation only. The host owns leaving with unsaved inputs and focus restoration. */
  onBack?: () => void
}

const stateLabels: Record<AgentItemReviewState, string> = {
  "waiting-human": "待复核", draft: "已编辑未提交", waiting: "复核提交中", unknown: "回执未确认",
  resolved: "已复核", failed: "已退回 / 失败", expired: "已过期",
}

function ReviewStatus({ state }: { state: AgentItemReviewState }) {
  return <Badge variant={state === "resolved" ? "success" : state === "failed" ? "error" : "warning"}>{stateLabels[state]}</Badge>
}

function ReviewAction({ action, intent, title, primary, disabledReason, onAction }: {
  action: AgentItemReviewAction
  intent: AgentItemReviewIntent
  title: string
  primary: boolean
  disabledReason?: string
  onAction?: (intent: AgentItemReviewIntent) => void
}) {
  const id = useId()
  const reason = [disabledReason, action.disabledReason, !onAction && "当前无法执行此操作。",
    !intent.itemId.trim() && "复核对象未确认。", !intent.version.trim() && "复核依据版本未确认。",
    !intent.actionId.trim() && "操作未确认。", intent.kind === "query" && !intent.requestId.trim() && "原请求未确认，暂不可查询。",
  ].filter(Boolean).join("；")
  return <li className="min-w-0 space-y-2">
    <Button type="button" variant={primary ? "default" : "outline"} className="max-w-full whitespace-normal"
      aria-label={`${action.label}：${title}`} aria-describedby={`${id}-impact${reason ? ` ${id}-disabled` : ""}`} disabled={!!reason}
      onClick={() => { if (!reason) onAction?.(intent) }}>{action.label}</Button>
    <p id={`${id}-impact`} className="break-words text-ui-hint">{action.impact}</p>
    {reason && <p id={`${id}-disabled`} role="status" className="break-words text-ui-hint text-muted-foreground">{reason}</p>}
  </li>
}

function ReviewHistory({ records, compact }: { records: readonly AgentItemReviewRecord[]; compact: boolean }) {
  return <section aria-label="复核记录" className="min-w-0 space-y-3">
    <h4 className="text-block-title">复核记录（当时事实）</h4>
    {records.length ? <ol className={compact ? "space-y-3" : "space-y-5"}>{records.map(record => <li key={record.id} data-review-record={record.id} className="min-w-0 space-y-2">
      <p className="break-words text-item-title">{record.item.title}</p>
      <p className="break-words text-ui-hint">当时对象：{record.item.id} · 当时依据版本：{record.item.version || "版本未确认"}</p>
      <div className="flex flex-wrap items-center gap-2"><span className="text-ui-hint">当时状态</span><ReviewStatus state={record.state} /></div>
      <p className="break-words text-ui-body">{record.description}</p>
      <p className="break-words text-ui-hint">当时复核人：{record.reviewer || "复核人未确认"} · 记录时间：{record.time || "时间未确认"}</p>
      <p className="break-words text-ui-hint">当时结果版本：{record.resultVersion || "版本未确认"}</p>
      <p className="whitespace-pre-wrap break-words text-read-body">当时理由：{record.reason || "未记录"}</p>
      {record.request && <p className="break-words text-ui-hint" data-request-id={record.request.id}>当时请求：{record.request.label}</p>}
    </li>)}</ol> : <p className="text-ui-hint text-muted-foreground">暂无复核记录。</p>}
  </section>
}

/** Semantic 17. No local draft, receipt, history, clock, persistence or execution state. */
export function AgentItemReviewer<T = string>({ item, review, checkpoints, summary, versionChange, restart, draft, reason,
  evidence, comparison, history = [], view = "inline", density = "default", notice, details, disabledReason, onAction, onExpand, onBack,
}: AgentItemReviewerProps<T>) {
  const id = useId()
  const compact = density === "compact"
  const pending = review.state === "waiting" || review.state === "unknown"
  const expired = versionChange !== undefined || review.state === "expired"
  const state = expired ? "expired" : review.state
  const editableState = review.state === "waiting-human" || review.state === "draft" || review.state === "failed"
  const readOnly = !editableState || expired || !!disabledReason || !item.id.trim() || !item.version.trim()
  // Runtime whitelisting also rejects actions injected by untyped callers into a blocked state.
  const actions = !expired && editableState && "actions" in review ? review.actions ?? [] : []
  const query = pending ? review.query : undefined
  const request = pending ? review.request : undefined
  const statusText = [
    expired && "当前版本已变化，旧确认不再适用，请重新复核。",
    review.state === "draft" && "修改未保存。",
    review.state === "unknown" && "复核回执未确认，请先查询原请求，不要重复提交。",
    review.state === "waiting" && "复核提交中，等待原请求回执。",
    review.description,
  ].filter(Boolean).join(" ")
  const context = { itemId: item.id, version: item.version }
  return <Card aria-labelledby={`${id}-title`} data-agent-item-review-view={view} data-density={density} data-review-state={state}
    data-item-id={item.id} className={`@container min-w-0 ${compact ? "gap-3 p-4" : "gap-5 p-5"}`}>
    <header className="min-w-0 space-y-2">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
        <h3 id={`${id}-title`} className="break-words text-block-title">{item.title}</h3>
        <div className="flex flex-wrap items-center gap-2"><span className="text-ui-hint">当前状态</span><ReviewStatus state={state} /></div>
      </div>
      <p className="break-words text-ui-hint">对象：{item.id || "对象未确认"} · 复核依据版本：{item.version || "版本未确认"}</p>
      {expired && <p className="break-words text-ui-hint">当前版本：{versionChange?.currentVersion || "版本未确认"}{versionChange?.description && <> · {versionChange.description}</>}</p>}
    </header>
    <div id={`${id}-status`}>
      {expired || review.state === "unknown" || review.state === "failed"
        ? <Alert role="status" variant={review.state === "failed" && !expired ? "error" : "warning"}><AlertDescription className="break-words text-ui-hint">{statusText}</AlertDescription></Alert>
        : <p role="status" className="break-words text-ui-hint">{statusText}</p>}
      {disabledReason && <p role="status" className="mt-2 break-words text-ui-hint">{disabledReason}</p>}
    </div>
    {pending && <p className="break-words text-ui-hint" data-request-id={request?.id}>原请求：{request?.label || "原请求未确认"}</p>}
    {review.state === "resolved" && <section aria-label={expired ? "此前复核记录" : "本次复核记录"} className="space-y-1">
      {expired && <p className="text-ui-hint">此前复核记录（不适用于当前版本）</p>}
      <p className="break-words text-ui-hint">复核人：{review.resolution?.reviewer || "复核人未确认"}</p>
      <p className="break-words text-ui-hint">复核时间：{review.resolution?.time || "时间未确认"} · 复核结果版本：{review.resolution?.version || "版本未确认"}</p>
    </section>}
    <section aria-label="待复核要点" className="min-w-0 space-y-2">
      <h4 className="text-ui-action">待复核要点</h4>
      {checkpoints.length ? <ul className="list-disc space-y-1 pl-5 text-ui-hint">{checkpoints.map((point, index) => <li key={index} className="break-words">{point}</li>)}</ul>
        : <p className="text-ui-hint text-muted-foreground">暂未提供复核要点。</p>}
    </section>
    <section aria-label="当前值摘要" className="min-w-0 space-y-2">
      <h4 className="text-ui-action">当前值摘要</h4><div className="min-w-0 whitespace-pre-wrap break-words text-read-body">{summary}</div>
    </section>
    {view === "workspace" && <>
      <div className="grid min-w-0 gap-5 @min-[800px]:grid-cols-2">
        <section aria-label="原始材料与证据" className="min-w-0 space-y-3">
          <h4 className="text-block-title">原始材料与证据</h4>
          {evidence ?? <p className="text-ui-hint text-muted-foreground">暂未提供可核对的证据。</p>}
        </section>
        <section aria-label="编辑草稿" className="min-w-0 space-y-3">
          <h4 className="text-block-title">编辑草稿</h4>
          {draft ? draft.render({ value: draft.value, onChange: value => { if (!readOnly) draft.onChange(value) }, readOnly, describedBy: `${id}-status` })
            : <p className="text-ui-hint text-muted-foreground">暂未提供编辑内容。</p>}
        </section>
      </div>
      <section aria-label="修改与原值对比" className="min-w-0 space-y-3">
        <h4 className="text-block-title">修改与原值对比</h4>
        {comparison ?? <p className="text-ui-hint text-muted-foreground">暂未提供修改对比。</p>}
      </section>
      {reason ? <Field className="w-full">
        <FieldLabel htmlFor={`${id}-reason`}>复核理由</FieldLabel>
        <Textarea id={`${id}-reason`} value={reason.value} readOnly={readOnly} aria-describedby={`${id}-status`}
          onChange={event => { if (!readOnly) reason.onChange(event.target.value) }} />
      </Field> : <p className="text-ui-hint text-muted-foreground">暂未提供复核理由。</p>}
    </>}
    {(actions.length > 0 || query || (expired && !pending && restart)) && <ul aria-label="复核操作" className="flex min-w-0 flex-wrap gap-4">
      {pending ? query && <ReviewAction action={query} title={item.title} primary disabledReason={disabledReason} onAction={onAction}
        intent={{ ...context, kind: "query", actionId: query.id, requestId: request?.id ?? "" }} />
        : expired ? restart && <ReviewAction action={restart} title={item.title} primary disabledReason={disabledReason} onAction={onAction}
          intent={{ ...context, kind: "restart", actionId: restart.id, currentVersion: versionChange?.currentVersion }} />
          : actions.map((action, index) => <ReviewAction key={action.id} action={action} title={item.title} primary={index === 0}
            disabledReason={disabledReason} onAction={onAction} intent={{ ...context, kind: "review", actionId: action.id }} />)}
    </ul>}
    {pending && !query && <p className="text-ui-hint text-muted-foreground">暂未提供原请求查询入口。</p>}
    {expired && !pending && !restart && <p className="text-ui-hint text-muted-foreground">请从当前对象重新发起复核。</p>}
    {view === "workspace" && <ReviewHistory records={history} compact={compact} />}
    {notice && <p className="break-words text-ui-hint text-muted-foreground">{notice}</p>}
    <RecordDetails>{details}</RecordDetails>
    {view === "inline" && onExpand && review.state !== "unknown" && <div><Button type="button" variant="outline" onClick={event => onExpand(event.currentTarget)}>完整复核<ArrowUpRight aria-hidden="true" /></Button></div>}
    {view === "workspace" && onBack && <div><Button type="button" variant="outline" onClick={onBack}><ArrowLeft aria-hidden="true" />返回原位置</Button></div>}
  </Card>
}
