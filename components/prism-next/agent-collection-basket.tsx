"use client"

import { useEffect, useId, useRef, useState, type ReactNode } from "react"
import { ArrowDown, ArrowUp, ArrowUpRight, MoreHorizontal, X } from "lucide-react"
import { Checkbox } from "@/components/coss/checkbox"
import { Menu, MenuItem, MenuPopup, MenuTrigger } from "@/components/coss/menu"
import { Dialog, DialogHeader, DialogPanel, DialogPopup, DialogTitle } from "@/components/coss/dialog"
import { Separator } from "@/components/coss/separator"
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
  /** Inline inherits its host surface; card retains the default inset well. */
  presentation?: "card" | "inline"
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
  /** Hide only the built-in selection controls when the host supplies its own toolbar. */
  selectionToolbar?: boolean
  clear?: AgentCollectionAction
  destinations?: readonly AgentCollectionAction[]
  batchActions?: readonly AgentCollectionBatchAction[]
  onAction?: (intent: AgentCollectionIntent, trigger?: HTMLElement) => void
  /** Workspace-only, authorized passive domain content, e.g. a QuestionCard summary. */
  renderItem?: (item: AgentCollectionEntry, context: { density: "default" | "compact" }) => ReactNode
  /** Passive L1 content in summary mode. Requires onOpenItem for one-step access to the full item.
   * Use QuestionContent for question stems; excerpt declares any host-side omissions. */
  renderSummary?: (item: AgentCollectionEntry) => { content: ReactNode; excerpt?: boolean } | null
  /** Compact title/facts/stem rows in both views. Never invokes renderItem or displays item.summary. */
  itemPresentation?: "default" | "summary"
  /** Summary title action; host opens the permitted item and restores focus to the trigger. */
  onOpenItem?: (item: AgentCollectionEntry, trigger: HTMLButtonElement) => void
  openLabel?: string
  /** Workspace-only passive host statistics; replaces header summary fields and group counts. */
  overview?: ReactNode
  /** Opt-in compact workspace summary header. Other views and default hosts stay unchanged. */
  infoPlacement?: "inline" | "menu"
  /** A render function places the built-in infoMenuItem inside the host MenuPopup.
   * A plain node remains supported; menu placement then adds a fallback more menu. */
  headerActions?: ReactNode | ((context: { infoMenuItem: ReactNode }) => ReactNode)
  onBack?: () => void
  /** Host-reported actionable failure, e.g. local storage failure; never inferred from notice. */
  attention?: string
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

function BasketActionButton({ label, scope, reason, primary = false, compact = false, onClick, children }: {
  label: string; scope: string; reason?: string; primary?: boolean; compact?: boolean; onClick: (trigger: HTMLButtonElement) => void; children?: ReactNode
}) {
  const id = useId()
  return <div className="min-w-0 max-w-full space-y-1">
    <Button type="button" size={compact ? "sm" : "navigation"} variant={primary ? "default" : compact ? "ghost" : "outline"} className="max-w-full whitespace-normal break-words"
      aria-label={`${label}：${scope}`} disabled={!!reason} aria-describedby={reason ? id : undefined}
      onClick={event => { if (!reason) onClick(event.currentTarget) }}>{children}{label}</Button>
    {reason && <p id={id} className="break-words text-ui-hint">{reason}</p>}
  </div>
}

/** Measure actual clipping after layout, font loading and slot updates; never slice MathML. */
function BasketSummary({ content, excerpt }: { content: ReactNode; excerpt?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const [clipped, setClipped] = useState(false)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    let active = true
    const measure = () => { if (active) setClipped(node.scrollHeight > node.clientHeight + 1 || node.scrollWidth > node.clientWidth + 1) }
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    // The slot can change height while the clamped viewport remains two lines tall.
    for (const child of node.children) observer.observe(child)
    const mutations = new MutationObserver(measure)
    mutations.observe(node, { childList: true, subtree: true, characterData: true })
    node.addEventListener("load", measure, true)
    document.fonts.addEventListener("loadingdone", measure)
    void document.fonts.ready.then(measure)
    measure()
    return () => { active = false; observer.disconnect(); mutations.disconnect(); node.removeEventListener("load", measure, true); document.fonts.removeEventListener("loadingdone", measure) }
  }, [content])
  return <div data-collection-summary-content className="min-w-0">
    <div ref={ref} data-collection-summary-clamp className="line-clamp-2 min-w-0 text-read-body">{content}</div>
    {(excerpt || clipped) && <span data-collection-excerpt className="text-ui-meta text-muted-foreground">节选</span>}
  </div>
}

function BasketRow({ item, previous, next, props, baseReason }: {
  item: AgentCollectionItem; previous?: AgentCollectionItem; next?: AgentCollectionItem; props: AgentCollectionBasketProps; baseReason?: string
}) {
  const id = useId(), title = titleOf(item), full = props.view === "workspace"
  const groupTrigger = useRef<HTMLButtonElement>(null)
  const restricted = item.access === "restricted"
  const entry = !restricted ? item : undefined
  const common = { collectionId: props.collection.id, collectionVersion: props.collection.version, ...targetOf(item) }
  const reason = baseReason || (!item.id.trim() ? "条目标识未确认。" : undefined)
  const actionReason = reason || (!props.onAction ? "当前无法操作。" : undefined)
  const selectReason = reason || entry?.selectable?.disabledReason || (!props.onSelectionChange ? "当前无法选择。" : undefined)
  const changeGroup = entry?.actions?.group
  const groupReason = actionReason || changeGroup?.disabledReason || (!changeGroup?.options.length ? "当前没有可用分组。" : undefined)
  const groupIndex = changeGroup?.options.findIndex(option => option.id === (entry?.groupId ?? null)) ?? -1
  const groupLabel = entry?.groupId == null ? "未分组" : props.groups?.find(group => group.id === entry.groupId)?.label || "分组未确认"
  const summaryMode = props.itemPresentation === "summary"
  const content = entry && full && !summaryMode ? props.renderItem?.(entry, { density: props.density ?? "default" }) : undefined
  const stem = summaryMode && entry && props.onOpenItem ? props.renderSummary?.(entry) : undefined
  const extraFields = summaryMode ? entry?.fields?.filter(field => field.label === "分值") : entry?.fields
  const rowTitle = summaryMode && entry ? `第 ${props.items.indexOf(item) + 1} 题 · ${title}` : title
  const showSummaryGroup = summaryMode && !!entry?.groupId
  function moveButtons() {
    return full && entry?.actions?.move && (["up", "down"] as const).map(direction => {
      const capability = entry.actions?.move?.[direction]
      if (!capability) return null
      const adjacent = direction === "up" ? previous : next
      const moveReason = actionReason || capability.disabledReason || (props.groupBy === "group" ? "请切回集合顺序后调整。" : !adjacent ? direction === "up" ? "已经是第一项。" : "已经是最后一项。" : undefined)
      const label = direction === "up" ? "上移" : "下移"
      const icon = direction === "up" ? <ArrowUp aria-hidden="true" /> : <ArrowDown aria-hidden="true" />
      const onClick = (trigger: HTMLButtonElement) => { if (!moveReason && adjacent) props.onAction?.({ ...common, kind: "move", direction, adjacentId: adjacent.id }, trigger) }
      return summaryMode ? <span key={direction} className="relative z-10 shrink-0">
        <Button type="button" size="icon-sm" variant="ghost" className="pointer-coarse:min-h-11 pointer-coarse:min-w-11" aria-label={`${label}：${rowTitle}`}
          title={moveReason || label} disabled={!!moveReason} aria-describedby={moveReason ? `${id}-${direction}-reason` : undefined}
          onClick={event => onClick(event.currentTarget)}>{icon}</Button>
        {moveReason && <span id={`${id}-${direction}-reason`} className="sr-only">{moveReason}</span>}
      </span> : <BasketActionButton key={direction} label={label} scope={title} reason={moveReason} onClick={onClick}>{icon}</BasketActionButton>
    })
  }
  const removeReason = actionReason || item.actions?.remove?.disabledReason
  return <li data-collection-item={item.id} data-collection-access={restricted ? "restricted" : "available"}
    className="min-w-0"><AgentSurface presentation={summaryMode ? "inline" : "card"} className={summaryMode ? "relative gap-1 py-2" : "min-h-11 gap-2.5 p-3"}>
    <div data-collection-summary-row={summaryMode ? "" : undefined} className={summaryMode ? "flex min-w-0 items-start gap-2" : "flex min-w-0 flex-wrap items-start gap-3"}>
      {full && entry?.selectable && <div className={summaryMode ? "relative z-10 min-w-0 space-y-1" : "min-w-0 space-y-1"}>
        <Label className={summaryMode ? "min-h-7 max-w-full pointer-coarse:min-h-11" : "pointer-coarse:min-h-11 max-w-full"} htmlFor={`${id}-select`}>
          <Checkbox id={`${id}-select`} checked={props.selectedIds?.includes(item.id) ?? false} disabled={!!selectReason}
            aria-label={summaryMode ? `选择${rowTitle}` : `选择：${rowTitle}`} aria-describedby={selectReason ? `${id}-selection-reason` : undefined}
            onCheckedChange={checked => {
              if (selectReason) return
              const selected = props.selectedIds ?? []
              props.onSelectionChange?.(checked ? selected.includes(item.id) ? [...selected] : [...selected, item.id] : selected.filter(value => value !== item.id))
            }} />{!summaryMode && "选择"}
        </Label>
        {selectReason && <p id={`${id}-selection-reason`} className="text-ui-hint">{selectReason}</p>}
      </div>}
      <div className="min-w-0 flex-1 space-y-1">
        <h4 className="break-words text-item-title">{summaryMode && entry && props.onOpenItem ? <Button type="button" variant="ghost" size="sm"
          className="static h-auto min-h-7 max-w-full justify-start whitespace-normal break-words px-0 text-left text-item-title after:absolute after:inset-0 pointer-coarse:min-h-11"
          aria-label={`${props.openLabel || "查看题目"}：${rowTitle}`} title={props.openLabel || "查看题目"}
          onClick={event => props.onOpenItem?.(entry, event.currentTarget)}>{rowTitle}</Button> : rowTitle}</h4>
        {entry && (summaryMode ? <AgentMetaLine>
          {entry.type}{!!extraFields?.length && <> · <BasketFields fields={extraFields} /></>}
          {(!entry.source || entry.source !== props.collection.source) && <> · 来源：{entry.source || "未确认"}</>}
          {showSummaryGroup && <> · 分组：{groupLabel}</>}
        </AgentMetaLine> : <AgentMetaLine><span className="sr-only">类型：</span>{entry.type} · <span className="sr-only">分组：</span>{groupLabel} · 版本：{entry.version || "未确认"}{!!extraFields?.length && <> · <BasketFields fields={extraFields} /></>}</AgentMetaLine>)}
        {stem?.content != null && <BasketSummary {...stem} />}
      </div>
      {summaryMode && moveButtons()}
      {summaryMode && item.actions?.remove && <Button type="button" size="icon-sm" variant="ghost" className="relative z-10 shrink-0 pointer-coarse:min-h-11 pointer-coarse:min-w-11"
        aria-label={`移出试题篮：${title}`} title="移出" disabled={!!removeReason} aria-describedby={removeReason ? `${id}-remove-reason` : undefined}
        onClick={event => { if (!removeReason) props.onAction?.({ ...common, kind: "remove" }, event.currentTarget) }}><X aria-hidden="true" /></Button>}
    </div>
    {summaryMode && item.actions?.remove && removeReason && <p id={`${id}-remove-reason`} className="break-words text-ui-hint">{removeReason}</p>}
    {restricted ? <p role="status" className="break-words text-ui-hint">访问受限 · {item.disclosure.reason}</p> : <>
      {!summaryMode && <div className="flex min-w-0 flex-wrap items-center gap-2">
        {item.source ? <AgentSourceChip label={`来源：${item.source}`}>{item.source}</AgentSourceChip> : <p className="text-ui-meta text-muted-foreground">来源：未确认</p>}
      </div>}
      {!summaryMode && item.issue && <p role="status" data-collection-issue={item.issue.state} className="break-words text-ui-hint">{item.issue.state === "invalid" ? "条目已失效" : "版本冲突"} · {item.issue.reason}</p>}
      {!summaryMode && item.summary && <p className="whitespace-pre-wrap break-words text-ui-body">{item.summary}</p>}
      {content != null && <div className="min-w-0" data-collection-content>{content}</div>}
    </>}
    {(!summaryMode || entry?.issue || !!item.actions?.resolve?.length) && <div className={summaryMode ? "relative z-10 flex min-w-0 flex-wrap items-center gap-2" : "flex min-w-0 flex-wrap gap-2"}>
      {summaryMode && entry?.issue && <p role="status" data-collection-issue={entry.issue.state} className="break-words text-ui-hint">{entry.issue.state === "invalid" ? "条目已失效" : "版本冲突"} · {entry.issue.reason}</p>}
      {!summaryMode && item.actions?.remove && <BasketActionButton label="移除" scope={title} reason={actionReason || item.actions.remove.disabledReason}
        onClick={trigger => props.onAction?.({ ...common, kind: "remove" }, trigger)} />}
      {item.actions?.resolve?.map(action => <BasketActionButton key={action.id} compact={summaryMode} label={action.label} scope={title}
        reason={actionReason || action.disabledReason} onClick={trigger => props.onAction?.({ ...common, kind: "resolve", actionId: action.id }, trigger)} />)}
      {!summaryMode && moveButtons()}
    </div>}
    {full && changeGroup && <div className={summaryMode ? "relative z-10 min-w-0 space-y-1.5" : "min-w-0 space-y-1.5"}>
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
  </AgentSurface>{summaryMode && next && <Separator />}</li>
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
  const hasOverview = full && props.overview != null && typeof props.overview !== "boolean"
  const compactHeader = summaryMode || hasOverview
  const menuInfo = full && summaryMode && props.infoPlacement === "menu"
  const [infoOpen, setInfoOpen] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)
  const infoMenuItem = menuInfo ? <MenuItem onClick={() => setInfoOpen(true)}>题篮信息</MenuItem> : null
  const hostHeaderActions = typeof props.headerActions === "function" ? props.headerActions({ infoMenuItem }) : props.headerActions
  const headerActions = <>{hostHeaderActions}{menuInfo && typeof props.headerActions !== "function" && <Menu>
    <MenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="题篮更多操作" />}><MoreHorizontal /></MenuTrigger>
    <MenuPopup align="end">{infoMenuItem}</MenuPopup>
  </Menu>}</>
  const hasHeaderActions = menuInfo || hostHeaderActions != null && typeof hostHeaderActions !== "boolean"
  const headerStatus = <AgentStatus unknown={sync.state === "unknown"} tone={sync.state === "failed" ? "error" : sync.state === "synced" ? "success" : "neutral"}>{syncLabels[sync.state]}</AgentStatus>
  const missingSyncFacts = [!collection.version && (historical ? "当时版本" : "集合版本"), !visual?.updatedAt && "更新时间"].filter(Boolean)
  const visibleSyncDescription = !compactHeader || sync.state === "failed" || !menuInfo && sync.state === "unknown"
  const issues = items.flatMap(item => item.access !== "restricted" && item.issue ? [`${item.issue.state === "invalid" ? "条目已失效" : "版本冲突"}：${item.issue.reason}`] : [])
  const urgent = [props.attention, sync.state === "failed" && `同步失败：${sync.description}`, ...issues].filter(Boolean)
  return <AgentWell presentation={props.presentation} aria-labelledby={id} data-agent-collection-view={view} data-agent-collection-density={density} data-collection-id={collection.id}>
    <header className="min-w-0 space-y-1.5">
      {!compactHeader && <p className="break-words text-ui-hint text-muted-foreground">{historical ? `历史集合 · ${collection.snapshot || "当时记录"}` : "当前集合"} · {collection.type}</p>}
      <div className={hasHeaderActions ? "flex min-w-0 items-start justify-between gap-2" : "flex min-w-0 flex-wrap items-start justify-between gap-2"}><h3 id={id} className="min-w-0 flex-1 break-words text-item-title">{collection.title}{compactHeader && <> · {displayed(summary.count)}{summary.count !== null && (summary.unit || "项")}</>}</h3>
        {!menuInfo && !(compactHeader && hasHeaderActions) && headerStatus}
        {hasHeaderActions && <div ref={headerRef} className="flex shrink-0 items-center gap-2" data-collection-header-actions>{headerActions}</div>}
      </div>
      {!menuInfo && <AgentVisibleMarkers visual={visual} />}
      {menuInfo ? null : compactHeader ? <AgentMetaLine data-collection-header-facts>
        {hasHeaderActions && headerStatus}
        {historical ? `历史集合 · ${collection.snapshot || "当时记录"}` : "当前集合"} · {collection.type}{collection.version && <> · {historical ? "当时版本" : "集合版本"}：{collection.version}</>} · <AgentSourceChip label={`来源：${collection.source || "未确认"}`}>
          <p>{collection.source || "来源未确认"}</p>
          {!visibleSyncDescription && sync.description && <p>{sync.description}</p>}
          {notice && <p>{notice}</p>}{details}
        </AgentSourceChip>{visual?.updatedAt && <> · 最近更新：{visual.updatedAt}</>}{missingSyncFacts.length > 0 && <> · 同步信息不完整（{missingSyncFacts.join("、")}未提供）</>}{!hasOverview && !!summary.fields?.length && <> · <BasketFields fields={summary.fields} /></>}
      </AgentMetaLine> : <AgentMetaLine>{historical ? "当时版本" : "集合版本"}：{collection.version || "未确认"}{collection.source && <> · 来源：{collection.source}</>} · <span className="tabular-nums">数量：{displayed(summary.count)}{summary.count !== null && <>{summary.unit || "项"}</>}</span>{!hasOverview && !!summary.fields?.length && <> · <BasketFields fields={summary.fields} /></>}{sync.state === "unknown" && <> · 最近更新：{visual?.updatedAt || "未提供"}</>}</AgentMetaLine>}
      {!menuInfo && !hasOverview && groups.length > 0 && <ul aria-label="分组数量" className="flex min-w-0 flex-wrap gap-x-5 gap-y-2">{groups.map(group => <li key={group.id} className="break-words text-ui-hint">{group.label}：{displayed(group.count)}</li>)}</ul>}
      {menuInfo && urgent.length > 0 && <p role="status" data-collection-attention className="break-words text-ui-hint">{urgent.join("；")}</p>}
    </header>
    {menuInfo && <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
      <DialogPopup finalFocus={() => headerRef.current?.querySelector<HTMLButtonElement>("button") ?? false} closeProps={{ "aria-label": "关闭题篮信息" }}>
        <DialogHeader><DialogTitle className="text-block-title">题篮信息</DialogTitle></DialogHeader>
        <DialogPanel><div data-collection-info className="min-w-0 space-y-2 break-words text-ui-hint">
          {headerStatus}<AgentVisibleMarkers visual={visual} />
          <p>{historical ? `历史集合 · ${collection.snapshot || "当时记录"}` : "当前集合"} · {collection.type}</p>
          <p>{historical ? "当时版本" : "集合版本"}：{collection.version || "未确认"}</p>
          <p>来源：{collection.source || "未确认"}</p>
          <p>最近更新：{visual?.updatedAt || "未提供"}</p>
          {missingSyncFacts.length > 0 && <p>同步信息不完整（{missingSyncFacts.join("、")}未提供）</p>}
          <p>数量：{displayed(summary.count)}{summary.count !== null && (summary.unit || "项")}</p>
          <p><BasketFields fields={summary.fields} /></p>
          {groups.map(group => <p key={group.id}>{group.label}：{displayed(group.count)}</p>)}
          {sync.description && <p>{sync.description}</p>}{props.attention && <p>{props.attention}</p>}{notice && <p>{notice}</p>}{details}
        </div></DialogPanel>
      </DialogPopup>
    </Dialog>}
    {!menuInfo && props.attention && <p role="status" className="break-words text-ui-hint">{props.attention}</p>}
    {hasOverview && <div data-collection-overview className="min-w-0 space-y-3">{props.overview}<Separator /></div>}
    {(!menuInfo && (!compactHeader || visibleSyncDescription && sync.description) || sync.action) && <div className="min-w-0 space-y-1.5" data-collection-sync={sync.state}>
      {!menuInfo && (!compactHeader || visibleSyncDescription && sync.description) && <div role="status" className="flex min-w-0 flex-wrap items-start gap-2">
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
      {props.selectionToolbar !== false && (selectable.length > 0 || selectedIds.length > 0) && <div className="min-w-0 space-y-1.5">
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
    {items.length === 0 ? <p role="status" className="text-ui-hint">{props.emptyText || "集合中还没有条目。"}</p> : sections.map(section => <section key={section.key} aria-label={summaryMode && section.key === "ungrouped" ? undefined : section.label} className="min-w-0 space-y-2.5">
      {!(summaryMode && (section.key === "ungrouped" || section.key === "all")) && <h4 className="break-words text-item-title">{section.label}</h4>}
      <ol className={summaryMode ? "space-y-0" : "space-y-2.5"}>{section.items.map(item => {
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
