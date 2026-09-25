"use client"

import { useId } from "react"
import { ArrowLeft, ArrowUpRight } from "lucide-react"
import { Card } from "@/components/coss/card"
import { Checkbox } from "@/components/coss/checkbox"
import { Badge } from "./badge"
import { Button } from "./button"
import { DataRecordTable, FilterBar, type FilterField } from "./data-display"
import { RecordDetails, type AgentRecordViewProps } from "./agent-record-parts"
import { agentItemReviewLabels, type AgentItemReview, type AgentItemReviewState, type AgentItemReviewTarget } from "./agent-item-reviewer"

export type AgentReviewQueueItem = AgentItemReviewTarget & {
  displayNumber?: string
  typeLabel: string
  review: AgentItemReview
  priority?: { label: string; reason: string }
  assignee?: string
  /** Presence means another person is handling the object, as declared by the host. Not a UI lock. */
  processingByOther?: { name: string; description?: string }
  versionChange?: { currentVersion?: string; description?: string }
  exceptions?: readonly { id: string; label: string; description?: string }[]
  openable?: boolean
  /** Host-declared eligible batch actions; never derived from priority or assignee. */
  batchActionIds?: readonly string[]
  disabledReason?: string
}
export type AgentReviewQueueTarget = { queueId: string; queueVersion: string; itemId: string; version: string }
export type AgentReviewQueueBatchAction = { id: string; label: string; impact: string; disabledReason?: string }
export type AgentReviewQueueBatchIntent = {
  queueId: string
  queueVersion: string
  actionId: string
  items: readonly { itemId: string; version: string }[]
}
export type AgentReviewQueueFilters = {
  fields: FilterField[]
  value: Record<string, string>
  onChange?: (value: Record<string, string>) => void
}
export type AgentReviewQueueProps = AgentRecordViewProps & {
  title: string
  queue: { id: string; version: string; snapshot?: boolean }
  /** Already authorized objects in host order. Filtering and ordering never run in this component. */
  items: readonly AgentReviewQueueItem[]
  counts?: Readonly<Partial<Record<AgentItemReviewState, number>>>
  progress?: { reviewed: number; total: number }
  inlineLimit?: number
  nextItemId?: string
  onNext?: (target: AgentReviewQueueTarget, trigger: HTMLButtonElement) => void
  onOpen?: (target: AgentReviewQueueTarget, trigger: HTMLButtonElement) => void
  onInspectException?: (target: AgentReviewQueueTarget & { exceptionId: string }, trigger: HTMLButtonElement) => void
  filters?: AgentReviewQueueFilters
  sort?: { field: FilterField; value: string; onChange?: (value: string) => void }
  selectedIds?: readonly string[]
  onSelectionChange?: (ids: readonly string[]) => void
  batchActions?: readonly AgentReviewQueueBatchAction[]
  onBatchAction?: (intent: AgentReviewQueueBatchIntent) => void
  disabledReason?: string
  notice?: string
  onBack?: () => void
}

const nameOf = (item: AgentReviewQueueItem) => item.title.trim() || item.displayNumber?.trim() || "未命名对象"
const stateOf = (item: AgentReviewQueueItem) => item.versionChange ? "expired" : item.review.state
const countText = (value: number) => Number.isInteger(value) && value >= 0 ? value : "未确认"
const batchStateReason = (item: AgentReviewQueueItem) => item.processingByOther ? "他人处理中，暂不可操作。"
  : item.versionChange || item.review.state === "expired" ? "已过期，请先逐项重新复核。"
  : item.review.state === "unknown" ? "回执未确认，请先逐项查询原请求。"
  : item.review.state === "waiting" ? "复核提交中，请等待逐项回执。"
  : item.review.state === "resolved" ? "已复核。"
  : !["waiting-human", "draft", "failed"].includes(item.review.state) ? "复核状态未确认。" : undefined

function QueueIdentity({ item }: { item: AgentReviewQueueItem }) {
  return <div className="min-w-0 space-y-1 whitespace-normal break-words">
    <p className="text-item-title">{nameOf(item)}</p>
    <p className="text-ui-hint">{item.displayNumber && <>编号：{item.displayNumber} · </>}{item.typeLabel || "类型未确认"} · 依据版本：{item.version || "版本未确认"}</p>
    {item.priority && <p className="text-ui-hint">优先级：{item.priority.label || "未确认"} · {item.priority.reason || "原因未提供"}</p>}
    <p className="text-ui-hint">责任人：{item.assignee || "未提供"}</p>
  </div>
}

function QueueFacts({ item }: { item: AgentReviewQueueItem }) {
  const state = stateOf(item)
  return <div className="min-w-0 space-y-2 whitespace-normal break-words" data-review-state={state}>
    <div className="flex flex-wrap gap-2">
      <Badge variant={state === "resolved" ? "success" : state === "failed" ? "error" : "warning"}>{agentItemReviewLabels[state] || "复核状态未确认"}</Badge>
      {item.versionChange && ["waiting", "unknown"].includes(item.review.state) && <Badge variant="warning">{agentItemReviewLabels[item.review.state]}</Badge>}
      {item.processingByOther && <Badge variant="warning">他人处理中</Badge>}
    </div>
    <p className="text-ui-hint">{item.review.description}</p>
    {item.review.state === "draft" && <p className="text-ui-hint">修改未保存。</p>}
    {item.versionChange && <p className="text-ui-hint">当前版本：{item.versionChange.currentVersion || "版本未确认"} · {item.versionChange.description || "旧确认不再适用，请重新复核。"}</p>}
    {item.processingByOther && <p className="text-ui-hint">正在处理：{item.processingByOther.name || "处理人未确认"}{item.processingByOther.description && <> · {item.processingByOther.description}</>}</p>}
    {item.disabledReason && <p className="text-ui-hint">{item.disabledReason}</p>}
    {item.exceptions?.map(exception => <p key={exception.id} className="text-ui-hint">异常：{exception.label}{exception.description && <> · {exception.description}</>}</p>)}
  </div>
}

function QueueSelection({ item, selected, reason, onChange }: {
  item: AgentReviewQueueItem; selected: boolean; reason?: string; onChange: (checked: boolean) => void
}) {
  const id = useId()
  return <div className="max-w-48 space-y-2 whitespace-normal break-words">
    <Checkbox aria-label={`选择：${nameOf(item)}`} checked={selected} disabled={!!reason} aria-describedby={reason ? id : undefined}
      onCheckedChange={checked => { if (!reason) onChange(checked) }} />
    {reason && <p id={id} className="text-ui-hint">{reason}</p>}
  </div>
}

function QueueButton({ label, accessibleLabel, reason, impact, onClick, primary = false }: {
  label: string; accessibleLabel?: string; reason?: string; impact?: string; onClick: (trigger: HTMLButtonElement) => void; primary?: boolean
}) {
  const id = useId()
  return <div className="min-w-0 space-y-2 whitespace-normal break-words">
    <Button type="button" variant={primary ? "default" : "outline"} className="max-w-full whitespace-normal"
      aria-label={accessibleLabel || label} disabled={!!reason} aria-describedby={impact || reason ? id : undefined}
      onClick={event => { if (!reason) onClick(event.currentTarget) }}>{label}</Button>
    {(impact || reason) && <div id={id} className="text-ui-hint">{impact && <p>{impact}</p>}{reason && <p>{reason}</p>}</div>}
  </div>
}

function QueueFilters({ fields, value, onChange }: AgentReviewQueueFilters) {
  return onChange ? <FilterBar fields={fields} value={value} onChange={onChange} />
    : <dl className="flex flex-wrap gap-3 text-ui-hint">{fields.map(field => <div key={field.id}>
      <dt>{field.label}</dt><dd>{field.options.find(option => option.value === value[field.id])?.label || "未指定"}</dd>
    </div>)}</dl>
}

/** Semantic 16: one controlled collection paired with semantic 17, never an executor or lock owner. */
export function AgentReviewQueue({ title, queue, items, counts, progress, inlineLimit = 3, nextItemId, onNext, onOpen, onInspectException,
  filters, sort, selectedIds = [], onSelectionChange, batchActions = [], onBatchAction, disabledReason, notice, details,
  view = "inline", density = "default", onExpand, onBack }: AgentReviewQueueProps) {
  const id = useId(), workspace = view === "workspace", compact = density === "compact"
  const baseReason = queue.snapshot ? "历史记录仅供查看。" : disabledReason
    || (!queue.id.trim() || !queue.version.trim() ? "队列或版本未确认。" : undefined)
  const duplicateIds = new Set(items.filter((item, index) => items.findIndex(other => other.id === item.id) !== index).map(item => item.id))
  const itemReason = (item: AgentReviewQueueItem) => baseReason || item.disabledReason
    || (!item.id.trim() || !item.version.trim() || duplicateIds.has(item.id) ? "对象或依据版本未确认。" : undefined)
  const target = (item: AgentReviewQueueItem): AgentReviewQueueTarget => ({ queueId: queue.id, queueVersion: queue.version, itemId: item.id, version: item.version })
  const limit = Number.isFinite(inlineLimit) ? Math.max(1, Math.floor(inlineLimit)) : 3
  const visible = workspace || !onExpand ? items : items.filter((item, index) => index < limit || item.id === nextItemId || selectedIds.includes(item.id)
    || ["draft", "waiting", "unknown", "failed", "expired"].includes(item.review.state) || item.versionChange || item.processingByOther || item.disabledReason || item.exceptions?.length)
  const next = items.find(item => item.id === nextItemId)
  const selected = selectedIds.map(selectedId => items.find(item => item.id === selectedId))
  const selectionProblem = new Set(selectedIds).size !== selectedIds.length ? "选择记录有重复，请清空后重新选择。"
    : selected.some(item => !item) ? "部分已选对象不在当前列表，请恢复筛选核对，或清空选择。" : undefined
  const selectionReason = (item: AgentReviewQueueItem) => itemReason(item) || batchStateReason(item)
    || (!onSelectionChange ? "当前仅可查看选择。" : !batchActions.some(action => action.id.trim() && item.batchActionIds?.includes(action.id)) ? "此项未提供批量操作。" : undefined)
  const select = (item: AgentReviewQueueItem, checked: boolean) => {
    if (selectionReason(item)) return
    onSelectionChange?.(checked ? selectedIds.includes(item.id) ? [...selectedIds] : [...selectedIds, item.id] : selectedIds.filter(value => value !== item.id))
  }
  const batchReason = (action: AgentReviewQueueBatchAction) => baseReason || action.disabledReason || selectionProblem
    || (!action.id.trim() ? "操作未确认。" : !onBatchAction ? "当前无法批量操作。" : !selectedIds.length ? "请先选择审核对象。" : undefined)
    || (selected.some(item => !item || itemReason(item) || batchStateReason(item) || !item.batchActionIds?.includes(action.id))
      ? "所选对象包含不可执行此操作的条目，请逐项核对。" : undefined)
  const openActions = (item: AgentReviewQueueItem) => queue.snapshot || item.processingByOther ? null : <div className="min-w-0 space-y-2">
    {item.openable && onOpen && <QueueButton label="打开复核" accessibleLabel={`打开复核：${nameOf(item)}`} reason={itemReason(item)} onClick={trigger => onOpen(target(item), trigger)} />}
    {onInspectException && item.exceptions?.map(exception => <QueueButton key={exception.id} label={`查看异常：${exception.label}`}
      accessibleLabel={`查看异常：${nameOf(item)} · ${exception.label}`} reason={itemReason(item) || (!exception.id.trim() ? "异常记录未确认。" : undefined)}
      onClick={trigger => onInspectException({ ...target(item), exceptionId: exception.id }, trigger)} />)}
  </div>
  const countEntries = (Object.keys(agentItemReviewLabels) as AgentItemReviewState[]).filter(state => counts?.[state] !== undefined)

  return <Card aria-labelledby={`${id}-title`} data-agent-review-queue-view={view} data-density={density}
    className={`min-w-0 ${compact ? "gap-3 p-4" : "gap-5 p-5"}`}>
    <header className="min-w-0 space-y-2">
      <h3 id={`${id}-title`} className="break-words text-block-title">{title}</h3>
      <p className="break-words text-ui-hint">{queue.snapshot ? "当时状态" : "当前状态"} · 队列版本：{queue.version || "版本未确认"}</p>
      {baseReason && <p role="status" className="break-words text-ui-hint">{baseReason}</p>}
    </header>
    <section aria-label="审核汇总" className="min-w-0 space-y-2">
      {countEntries.length ? <dl className="flex flex-wrap gap-x-4 gap-y-2 text-ui-hint">{countEntries.map(state => <div key={state} className="flex flex-wrap gap-x-2">
        <dt>{agentItemReviewLabels[state]}</dt><dd className="tabular-nums">{countText(counts![state]!)}</dd>
      </div>)}</dl> : <p className="text-ui-hint">状态计数未提供。</p>}
      {progress && <p className="text-ui-hint tabular-nums">已复核 {countText(progress.reviewed)}/{countText(progress.total)}</p>}
    </section>
    {workspace && <>
      {(filters || sort) && <section aria-label="筛选与排序" className="flex min-w-0 flex-wrap items-end gap-4">
        {filters && <QueueFilters {...filters} onChange={queue.snapshot ? undefined : filters.onChange} />}
        {sort && <QueueFilters fields={[sort.field]} value={{ [sort.field.id]: sort.value }}
          onChange={!queue.snapshot && sort.onChange ? value => sort.onChange?.(value[sort.field.id]) : undefined} />}
      </section>}
      {(batchActions.length > 0 || selectedIds.length > 0 || onSelectionChange) && <section aria-label="批量审核" className="min-w-0 space-y-3">
        <p className="text-ui-hint">已选 {selectedIds.length} 项</p>
        {selectionProblem && <p role="status" className="text-ui-hint">{selectionProblem}</p>}
        <div className="flex flex-wrap items-start gap-3">{!queue.snapshot && batchActions.map((action, index) => <QueueButton key={action.id} label={action.label}
          reason={batchReason(action)} impact={action.impact} primary={index === 0} onClick={() => {
            if (!batchReason(action)) onBatchAction?.({ queueId: queue.id, queueVersion: queue.version, actionId: action.id,
              items: selected.map(item => ({ itemId: item!.id, version: item!.version })) })
          }} />)}
          {!queue.snapshot && selectedIds.length > 0 && onSelectionChange && <QueueButton label="清空选择" reason={baseReason} onClick={() => onSelectionChange([])} />}
        </div>
      </section>}
      <div role="region" aria-label="审核对象列表" tabIndex={0} className="min-w-0 overflow-x-auto">
        <DataRecordTable rows={[...items]} empty="当前列表没有审核对象。" columns={[
          ...(!queue.snapshot && (batchActions.length || selectedIds.length || onSelectionChange) ? [{ id: "selection", label: "选择", render: (item: AgentReviewQueueItem) =>
            <QueueSelection item={item} selected={selectedIds.includes(item.id)} reason={selectionReason(item)} onChange={checked => select(item, checked)} /> }] : []),
          { id: "identity", label: "审核对象", render: item => <div className="min-w-48 max-w-sm"><QueueIdentity item={item} /></div> },
          { id: "review", label: queue.snapshot ? "当时复核情况" : "复核情况", render: item => <div className="min-w-56 max-w-md"><QueueFacts item={item} /></div> },
          ...(!queue.snapshot && (onOpen || onInspectException) ? [{ id: "actions", label: "操作", render: openActions }] : []),
        ]} />
      </div>
    </>}
    {!workspace && <ol aria-label="优先审核对象" className={compact ? "space-y-3" : "space-y-5"}>
      {visible.map((item, index) => <li key={`${item.id}-${index}`} className={`min-w-0 ${compact ? "space-y-2" : "space-y-3"}`}>
        <QueueIdentity item={item} /><QueueFacts item={item} />{openActions(item)}
      </li>)}
      {!visible.length && <li className="text-ui-hint">当前列表没有审核对象。</li>}
    </ol>}
    <div className="flex flex-wrap items-start gap-3">
      {!queue.snapshot && nextItemId !== undefined && onNext && !next?.processingByOther && <QueueButton label="下一项"
        accessibleLabel={next ? `下一项：${nameOf(next)}` : "下一项"} reason={next ? itemReason(next) || (!next.openable ? "下一项暂不可打开。" : undefined) : "下一项暂不可用，请核对列表。"}
        onClick={trigger => { if (next) onNext(target(next), trigger) }} />}
      {!workspace && onExpand && <Button type="button" variant="outline" onClick={event => onExpand(event.currentTarget)}>进入审核队列<ArrowUpRight aria-hidden="true" /></Button>}
      {workspace && onBack && <Button type="button" variant="ghost" onClick={onBack}><ArrowLeft aria-hidden="true" />返回</Button>}
    </div>
    {notice && <p className="break-words text-ui-hint text-muted-foreground">{notice}</p>}
    <RecordDetails>{details}</RecordDetails>
  </Card>
}
