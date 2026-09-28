"use client"

import { useId, useRef, type ReactNode } from "react"
import { ArrowDown, ArrowUp, ArrowUpRight, X } from "lucide-react"
import { Checkbox } from "@/components/coss/checkbox"
import { Label } from "@/components/coss/label"
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from "@/components/coss/select"
import { Button } from "./button"
import type { AgentRecordViewProps } from "./agent-record-parts"
import { AgentMetaLine, AgentSourceChip, AgentStatus, AgentSurface, AgentVisibleMarkers, AgentWell, type AgentVisualProps } from "./agent-visual-parts"

export type AgentCollectionAvailability = { disabledReason?: string }
export type AgentCollectionAction = AgentCollectionAvailability & { id: string; label: string }
export type AgentCollectionField = { label: string; value: string | number }
export type AgentCollectionGroup = { id: string; label: string; count: number | null }
export type AgentCollectionIdentity = {
  id: string
  title: string
  type: string
  version?: string
  source?: string
  /** Presence marks a read-only historical snapshot, including an empty label. */
  snapshot?: string
}
export type AgentCollectionItemActions = {
  remove?: AgentCollectionAvailability
  move?: { up?: AgentCollectionAvailability; down?: AgentCollectionAvailability }
  group?: AgentCollectionAvailability & { options: readonly { id: string | null; label: string }[] }
  resolve?: readonly AgentCollectionAction[]
}
export type AgentCollectionEntry = {
  id: string
  access?: "available"
  title: string
  type: string
  source?: string
  version?: string
  groupId?: string | null
  summary?: string
  fields?: readonly AgentCollectionField[]
  issue?: { state: "invalid" | "conflict"; reason: string }
  selectable?: AgentCollectionAvailability
  actions?: AgentCollectionItemActions
}
/** No private metadata or renderer payload is accepted for restricted entries. */
export type AgentCollectionRestrictedEntry = {
  id: string
  access: "restricted"
  disclosure: { label: string; reason: string }
  actions?: Pick<AgentCollectionItemActions, "remove" | "resolve">
}
export type AgentCollectionItem = AgentCollectionEntry | AgentCollectionRestrictedEntry
export type AgentCollectionSummary = { count: number | null; unit?: string; fields?: readonly AgentCollectionField[] }
export type AgentCollectionSync = (
  | { state: "local" | "synced" | "unknown"; description?: string }
  | { state: "failed"; description: string }
) & { action?: AgentCollectionAction }
export type AgentCollectionChange = { id: string; kind: "added" | "removed"; description: string }
export type AgentCollectionTarget = { itemId: string; version?: string }
export type AgentCollectionIntent = { collectionId: string; collectionVersion?: string } & (
  | (AgentCollectionTarget & { kind: "remove" })
  | (AgentCollectionTarget & { kind: "move"; direction: "up" | "down"; adjacentId: string })
  | (AgentCollectionTarget & { kind: "group"; groupId: string | null })
  | (AgentCollectionTarget & { kind: "resolve"; actionId: string })
  | { kind: "clear" | "destination" | "batch"; actionId: string; targets: readonly AgentCollectionTarget[] }
  | { kind: "sync"; actionId: string }
)
export type AgentCollectionBatchAction = AgentCollectionAction & { itemIds: readonly string[] }
export type AgentCollectionBasketProps = AgentRecordViewProps & AgentVisualProps & {
  collection: AgentCollectionIdentity
  items: readonly AgentCollectionItem[]
  summary: AgentCollectionSummary
  groups?: readonly AgentCollectionGroup[]
  sync?: AgentCollectionSync
  changes?: readonly AgentCollectionChange[]
  inlineLimit?: number
  groupBy?: "none" | "group"
  onGroupByChange?: (value: "none" | "group") => void
  selectedIds?: readonly string[]
  onSelectionChange?: (ids: readonly string[]) => void
  clear?: AgentCollectionAction
  destinations?: readonly AgentCollectionAction[]
  batchActions?: readonly AgentCollectionBatchAction[]
  onAction?: (intent: AgentCollectionIntent, trigger?: HTMLElement) => void
  /** Workspace-only, authorized passive domain content, e.g. a QuestionCard summary. */
  renderItem?: (item: AgentCollectionEntry, context: { density: "default" | "compact" }) => ReactNode
  /** Opt in to L1 content (including type and score) in both views; renderItem remains workspace-only by default. */
  itemPresentation?: "default" | "summary"
  onBack?: () => void
  notice?: string
  emptyText?: string
}

const syncLabels: Record<AgentCollectionSync["state"], string> = { local: "本页暂存", synced: "已同步", failed: "同步失败", unknown: "状态未确认" }
const titleOf = (item: AgentCollectionItem) => item.access === "restricted" ? item.disclosure.label : item.title
const targetOf = (item: AgentCollectionItem): AgentCollectionTarget => item.access === "restricted" ? { itemId: item.id } : { itemId: item.id, version: item.version }
const displayed = (value: string | number | null) => value === null || typeof value === "number" && !Number.isFinite(value) ? "未确认" : value

function BasketFields({ fields }: { fields?: readonly AgentCollectionField[] }) {
  return fields?.length ? <>{fields.map((field, index) => <span key={index}>{index > 0 && " · "}{field.label}：<span className="tabular-nums">{displayed(field.value)}</span></span>)}</> : null
}

function BasketActionButton({ label, scope, reason, primary = false, onClick, children }: {
  label: string; scope: string; reason?: string; primary?: boolean; onClick: (trigger: HTMLButtonElement) => void; children?: ReactNode
}) {
  const id = useId()
  return <div className="min-w-0 max-w-full space-y-1">
    <Button type="button" size="navigation" variant={primary ? "default" : "outline"} className="max-w-full whitespace-normal break-words"
      aria-label={`${label}：${scope}`} disabled={!!reason} aria-describedby={reason ? id : undefined}
      onClick={event => { if (!reason) onClick(event.currentTarget) }}>{children}{label}</Button>
    {reason && <p id={id} className="break-words text-ui-hint">{reason}</p>}
  </div>
}

function BasketRow({ item, previous, next, props, baseReason }: {
  item: AgentCollectionItem; previous?: AgentCollectionItem; next?: AgentCollectionItem; props: AgentCollectionBasketProps; baseReason?: string
}) {
  const id = useId(), title = titleOf(item), full = props.view === "workspace"
  const groupTrigger = useRef<HTMLButtonElement>(null)
  const compact = props.density === "compact", restricted = item.access === "restricted"
  const entry = !restricted ? item : undefined
  const common = { collectionId: props.collection.id, collectionVersion: props.collection.version, ...targetOf(item) }
  const reason = baseReason || (!item.id.trim() ? "条目标识未确认。" : undefined)
  const actionReason = reason || (!props.onAction ? "当前无法操作。" : undefined)
  const selectReason = reason || entry?.selectable?.disabledReason || (!props.onSelectionChange ? "当前无法选择。" : undefined)
  const changeGroup = entry?.actions?.group
  const groupReason = actionReason || changeGroup?.disabledReason || (!changeGroup?.options.length ? "当前没有可用分组。" : undefined)
  const groupIndex = changeGroup?.options.findIndex(option => option.id === (entry?.groupId ?? null)) ?? -1
  const groupLabel = entry?.groupId == null ? "未分组" : props.groups?.find(group => group.id === entry.groupId)?.label || "分组未确认"
  const content = entry && (full || props.itemPresentation === "summary") ? props.renderItem?.(entry, { density: props.density ?? "default" }) : undefined
  const summaryContent = props.itemPresentation === "summary" && content != null && typeof content !== "boolean"
  const summaryMode = props.itemPresentation === "summary"
  // L1 owns type and score. Keep other host fields, grouping and version visible.
  const extraFields = summaryContent ? entry?.fields?.filter(field => !["题型", "类型", "分值"].includes(field.label)) : entry?.fields
  const removeReason = actionReason || item.actions?.remove?.disabledReason
  return <li data-collection-item={item.id} data-collection-access={restricted ? "restricted" : "available"}
    className="min-w-0"><AgentSurface presentation={summaryContent ? "inline" : "card"} className="min-h-11 gap-2.5 p-3">
    <div data-collection-summary-row={summaryMode ? "" : undefined} className={summaryMode ? "flex min-w-0 items-start gap-2" : "flex min-w-0 flex-wrap items-start gap-3"}>
      {full && entry?.selectable && <div className="min-w-0 space-y-1">
        <Label className="min-h-11 max-w-full" htmlFor={`${id}-select`}>
          <Checkbox id={`${id}-select`} checked={props.selectedIds?.includes(item.id) ?? false} disabled={!!selectReason}
            aria-label={`选择：${title}`} aria-describedby={selectReason ? `${id}-selection-reason` : undefined}
            onCheckedChange={checked => {
              if (selectReason) return
              const selected = props.selectedIds ?? []
              props.onSelectionChange?.(checked ? selected.includes(item.id) ? [...selected] : [...selected, item.id] : selected.filter(value => value !== item.id))
            }} />选择
        </Label>
        {selectReason && <p id={`${id}-selection-reason`} className="text-ui-hint">{selectReason}</p>}
      </div>}
      <div className="min-w-0 flex-1 space-y-1">{!summaryContent && <h4 className="break-words text-item-title">{title}</h4>}
        {summaryContent && <div className="min-w-0" data-collection-content>{content}</div>}
        {entry && <AgentMetaLine>{!summaryContent && <><span className="sr-only">类型：</span>{entry.type} · </>}<span className="sr-only">分组：</span>{groupLabel} · 版本：{entry.version || "未确认"}{!!extraFields?.length && <> · <BasketFields fields={extraFields} /></>}</AgentMetaLine>}
      </div>
      {summaryMode && item.actions?.remove && <Button type="button" size="navigation-icon" variant="ghost" className="min-h-11 min-w-11 shrink-0"
        aria-label={`移出试题篮：${title}`} title="移出" disabled={!!removeReason} aria-describedby={removeReason ? `${id}-remove-reason` : undefined}
        onClick={event => { if (!removeReason) props.onAction?.({ ...common, kind: "remove" }, event.currentTarget) }}><X aria-hidden="true" /></Button>}
    </div>
    {summaryMode && item.actions?.remove && removeReason && <p id={`${id}-remove-reason`} className="break-words text-ui-hint">{removeReason}</p>}
    {restricted ? <p role="status" className="break-words text-ui-hint">访问受限 · {item.disclosure.reason}</p> : <>
      {(!summaryMode || !item.source || item.source !== props.collection.source) && <div className="flex min-w-0 flex-wrap items-center gap-2">
        {item.source ? <AgentSourceChip label={`来源：${item.source}`}>{item.source}</AgentSourceChip> : <p className="text-ui-meta text-muted-foreground">来源：未确认</p>}
      </div>}
      {item.issue && <p role="status" data-collection-issue={item.issue.state} className="break-words text-ui-hint">{item.issue.state === "invalid" ? "条目已失效" : "版本冲突"} · {item.issue.reason}</p>}
      {item.summary && <p className="whitespace-pre-wrap break-words text-ui-body">{item.summary}</p>}
      {!summaryContent && content != null && <div className="min-w-0" data-collection-content>{content}</div>}
    </>}
    {(!summaryMode || !!item.actions?.resolve?.length || full && (entry?.actions?.move?.up || entry?.actions?.move?.down)) && <div className="flex min-w-0 flex-wrap gap-2">
      {!summaryMode && item.actions?.remove && <BasketActionButton label="移除" scope={title} reason={actionReason || item.actions.remove.disabledReason}
        onClick={trigger => props.onAction?.({ ...common, kind: "remove" }, trigger)} />}
      {item.actions?.resolve?.map(action => <BasketActionButton key={action.id} label={action.label} scope={title}
        reason={actionReason || action.disabledReason} onClick={trigger => props.onAction?.({ ...common, kind: "resolve", actionId: action.id }, trigger)} />)}
      {full && entry?.actions?.move && (["up", "down"] as const).map(direction => {
        const capability = entry.actions?.move?.[direction]
        if (!capability) return null
        const adjacent = direction === "up" ? previous : next
        const moveReason = actionReason || capability.disabledReason || (props.groupBy === "group" ? "请切回集合顺序后调整。" : !adjacent ? direction === "up" ? "已经是第一项。" : "已经是最后一项。" : undefined)
        return <BasketActionButton key={direction} label={direction === "up" ? "上移" : "下移"} scope={title} reason={moveReason}
          onClick={trigger => { if (adjacent) props.onAction?.({ ...common, kind: "move", direction, adjacentId: adjacent.id }, trigger) }}>
          {direction === "up" ? <ArrowUp aria-hidden="true" /> : <ArrowDown aria-hidden="true" />}
        </BasketActionButton>
      })}
    </div>}
    {full && changeGroup && <div className="min-w-0 space-y-1.5">
      <Label htmlFor={`${id}-group`}>分组 · {title}</Label>
      <Select value={groupIndex >= 0 ? String(groupIndex) : null} disabled={!!groupReason}
        items={changeGroup.options.map((option, index) => ({ value: String(index), label: option.label }))}
        onValueChange={value => {
          const option = changeGroup.options.find((_, index) => String(index) === value)
          if (!groupReason && option && option.id !== (entry?.groupId ?? null)) {
            props.onAction?.({ ...common, kind: "group", groupId: option.id }, groupTrigger.current ?? undefined)
          }
        }}>
        <SelectTrigger ref={groupTrigger} id={`${id}-group`} className="min-w-0 max-w-full" aria-describedby={groupReason ? `${id}-group-reason` : undefined}><SelectValue placeholder={groupLabel} /></SelectTrigger>
        <SelectPopup>{changeGroup.options.map((option, index) => <SelectItem key={index} value={String(index)}>{option.label}</SelectItem>)}</SelectPopup>
      </Select>
      {groupReason && <p id={`${id}-group-reason`} className="text-ui-hint">{groupReason}</p>}
    </div>}
  </AgentSurface></li>
}

/** Controlled collection content, without a drawer, data source, scoring or saving implementation. */
export function AgentCollectionBasket({ view = "inline", density = "default", inlineLimit = 3, groupBy = "none", sync = { state: "unknown" }, ...rest }: AgentCollectionBasketProps) {
  const props = { ...rest, view, density, groupBy, sync }, id = useId()
  const { collection, items, summary, groups = [], changes = [], selectedIds = [], onSelectionChange, onAction, onExpand, onBack, notice, details, visual } = props
  const full = view === "workspace", compact = density === "compact", historical = collection.snapshot !== undefined
  const baseReason = historical ? "历史集合仅供查看。" : !collection.id.trim() ? "集合标识未确认。" : undefined
  const actionReason = baseReason || (!onAction ? "当前无法操作。" : undefined)
  const common = { collectionId: collection.id, collectionVersion: collection.version }
  const limit = Number.isFinite(inlineLimit) ? Math.max(1, Math.floor(inlineLimit)) : 3
  const shown = !full && onExpand ? items.filter((item, index) => index < limit || item.access === "restricted" || item.issue) : items
  const sections = full && groupBy === "group" ? [
    ...groups.map(group => ({ key: `group:${group.id}`, label: group.label, items: shown.filter(item => item.access !== "restricted" && item.groupId === group.id) })),
    { key: "ungrouped", label: "未分组", items: shown.filter(item => item.access !== "restricted" && item.groupId == null) },
    { key: "unknown", label: "分组未确认", items: shown.filter(item => item.access !== "restricted" && item.groupId != null && !groups.some(group => group.id === item.groupId)) },
    { key: "restricted", label: "受限条目", items: shown.filter(item => item.access === "restricted") },
  ].filter(section => section.items.length) : [{ key: "all", label: full ? "全部条目" : "关键条目", items: shown }]
  const selectable = items.filter(item => item.access !== "restricted" && item.selectable && !item.selectable.disabledReason)
  const allSelected = selectable.length > 0 && selectable.every(item => selectedIds.includes(item.id))
  const selectionReason = baseReason || (!onSelectionChange ? "当前无法选择。" : undefined)
  const targets = items.map(targetOf)
  const summaryMode = props.itemPresentation === "summary"
  const visibleSyncDescription = !summaryMode || sync.state === "failed" || sync.state === "unknown"
  return <AgentWell aria-labelledby={id} data-agent-collection-view={view} data-agent-collection-density={density} data-collection-id={collection.id}>
    <header className="min-w-0 space-y-1.5">
      {!summaryMode && <p className="break-words text-ui-hint text-muted-foreground">{historical ? `历史集合 · ${collection.snapshot || "当时记录"}` : "当前集合"} · {collection.type}</p>}
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-2"><h3 id={id} className="min-w-0 flex-1 break-words text-item-title">{collection.title}{summaryMode && <> · {displayed(summary.count)}{summary.count !== null && (summary.unit || "项")}</>}</h3>
        <AgentStatus unknown={sync.state === "unknown"} tone={sync.state === "failed" ? "error" : sync.state === "synced" ? "success" : "neutral"}>{syncLabels[sync.state]}</AgentStatus>
      </div>
      <AgentVisibleMarkers visual={visual} />
      {summaryMode ? <AgentMetaLine data-collection-header-facts>
        {historical ? `历史集合 · ${collection.snapshot || "当时记录"}` : "当前集合"} · {collection.type} · {historical ? "当时版本" : "集合版本"}：{collection.version || "未确认"} · <AgentSourceChip label={`来源：${collection.source || "未确认"}`}>
          <p>{collection.source || "来源未确认"}</p>
          {!visibleSyncDescription && sync.description && <p>{sync.description}</p>}
          {notice && <p>{notice}</p>}{details}
        </AgentSourceChip> · 最近更新：{visual?.updatedAt || "未提供"}{!!summary.fields?.length && <> · <BasketFields fields={summary.fields} /></>}
      </AgentMetaLine> : <AgentMetaLine>{historical ? "当时版本" : "集合版本"}：{collection.version || "未确认"}{collection.source && <> · 来源：{collection.source}</>} · <span className="tabular-nums">数量：{displayed(summary.count)}{summary.count !== null && <>{summary.unit || "项"}</>}</span>{!!summary.fields?.length && <> · <BasketFields fields={summary.fields} /></>}{sync.state === "unknown" && <> · 最近更新：{visual?.updatedAt || "未提供"}</>}</AgentMetaLine>}
      {groups.length > 0 && <ul aria-label="分组数量" className="flex min-w-0 flex-wrap gap-x-5 gap-y-2">{groups.map(group => <li key={group.id} className="break-words text-ui-hint">{group.label}：{displayed(group.count)}</li>)}</ul>}
    </header>
    {(!summaryMode || visibleSyncDescription && sync.description || sync.action) && <div className="min-w-0 space-y-1.5" data-collection-sync={sync.state}>
      {(!summaryMode || visibleSyncDescription && sync.description) && <div role="status" className="flex min-w-0 flex-wrap items-start gap-2">
        {visibleSyncDescription && sync.description && <p className="min-w-0 break-words text-ui-hint">{sync.description}</p>}
      </div>}
      {sync.action && <BasketActionButton label={sync.action.label} scope={collection.title} reason={actionReason || sync.action.disabledReason}
        onClick={trigger => onAction?.({ ...common, kind: "sync", actionId: sync.action!.id }, trigger)} />}
    </div>}
    {changes.length > 0 && <ul aria-label="最近变化" aria-live="polite" className="space-y-1">{changes.map(change => <li key={change.id} data-collection-change={change.kind} className="break-words text-ui-hint">{change.kind === "added" ? "已加入" : "已移除"} · {change.description}</li>)}</ul>}
    {!summaryMode && notice && <p className="break-words text-ui-hint text-muted-foreground">{notice}</p>}
    {full && <div className="min-w-0 space-y-2.5">
      {(groups.length > 0 || groupBy === "group") && <div className="flex min-w-0 flex-wrap items-center gap-2" role="group" aria-label="列表排列">
        <span className="text-ui-action">列表排列</span>{(["none", "group"] as const).map(value => props.onGroupByChange
          ? <Button key={value} type="button" size="navigation" variant="outline" aria-pressed={groupBy === value} onClick={() => props.onGroupByChange?.(value)}>{value === "none" ? "集合顺序" : "按分组查看"}</Button>
          : groupBy === value && <span key={value} className="text-ui-body">{value === "none" ? "集合顺序" : "按分组查看"}</span>)}
      </div>}
      {(selectable.length > 0 || selectedIds.length > 0) && <div className="min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-3"><p className="text-ui-hint">已选择 {selectedIds.length} 项</p>
          <BasketActionButton label={allSelected ? "取消全选" : "全选可选条目"} scope={collection.title} reason={selectionReason || (!selectable.length ? "当前没有可选条目。" : undefined)}
            onClick={() => onSelectionChange?.(allSelected ? selectedIds.filter(value => !selectable.some(item => item.id === value)) : [...new Set([...selectedIds, ...selectable.map(item => item.id)])])} />
          {selectedIds.length > 0 && <BasketActionButton label="清除选择" scope={collection.title} reason={selectionReason} onClick={() => onSelectionChange?.([])} />}
        </div>
        {selectedIds.some(value => !selectable.some(item => item.id === value)) && <p role="status" className="text-ui-hint">部分已选条目已不可选，请重新核对选择。</p>}
      </div>}
      {!!props.batchActions?.length && <div className="flex min-w-0 flex-wrap gap-2" aria-label="批量操作">{props.batchActions.map(action => {
        // Never silently narrow a host-scoped action, even when stale IDs remain selected.
        const valid = action.itemIds.length > 0 && new Set(action.itemIds).size === action.itemIds.length && new Set(selectedIds).size === selectedIds.length
          && action.itemIds.length === selectedIds.length && action.itemIds.every(value => selectedIds.includes(value) && selectable.some(item => item.id === value))
        return <BasketActionButton key={action.id} label={action.label} scope={collection.title} reason={actionReason || action.disabledReason || (!valid ? "请核对已选条目与操作范围。" : undefined)}
          onClick={trigger => onAction?.({ ...common, kind: "batch", actionId: action.id, targets: action.itemIds.map(value => targetOf(items.find(item => item.id === value)!)) }, trigger)} />
      })}</div>}
    </div>}
    {items.length === 0 ? <p role="status" className="text-ui-hint">{props.emptyText || "集合中还没有条目。"}</p> : sections.map(section => <section key={section.key} aria-label={section.label} className="min-w-0 space-y-2.5">
      <h4 className="break-words text-item-title">{section.label}</h4>
      <ol className="space-y-2.5">{section.items.map(item => {
        const index = items.indexOf(item)
        return <BasketRow key={item.id} item={item} previous={items[index - 1]} next={items[index + 1]} props={props} baseReason={baseReason} />
      })}</ol>
    </section>)}
    <div className="flex min-w-0 flex-wrap gap-2">
      {props.destinations?.map((action, index) => <BasketActionButton key={action.id} label={action.label} scope={collection.title} primary={index === 0}
        reason={actionReason || action.disabledReason} onClick={trigger => onAction?.({ ...common, kind: "destination", actionId: action.id, targets }, trigger)} />)}
      {full && props.clear && <BasketActionButton label={props.clear.label} scope={collection.title} reason={actionReason || props.clear.disabledReason}
        onClick={trigger => onAction?.({ ...common, kind: "clear", actionId: props.clear!.id, targets }, trigger)} />}
      {!full && onExpand && <Button type="button" size="navigation" variant="outline" onClick={event => onExpand(event.currentTarget)}>管理全部<ArrowUpRight aria-hidden="true" /></Button>}
      {full && onBack && <Button type="button" size="navigation" variant="ghost" onClick={onBack}>返回原位置</Button>}
    </div>
    {!summaryMode && <AgentSourceChip>{details}</AgentSourceChip>}
  </AgentWell>
}
