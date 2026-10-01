"use client"

import { useId, useState, type ReactNode } from "react"
import { ChevronRight, Circle, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/coss/button"
import { Card } from "@/components/coss/card"
import { Empty } from "@/components/coss/empty"
import { Input } from "@/components/coss/input"
import { Menu, MenuTrigger, MenuPopup, MenuItem } from "@/components/coss/menu"
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/coss/pagination"
import { Progress, ProgressTrack, ProgressIndicator } from "@/components/coss/progress"
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from "@/components/coss/select"
import { Skeleton } from "@/components/coss/skeleton"
import { Tabs, TabsList, TabsTab, TabsPanel } from "@/components/coss/tabs"
import { AgentStatus, type AgentStatusTone } from "./agent-visual-parts"

export type RecordListTab = { id: string; label: string; count: number | null }
export type RecordListStatus = { label: string; tone?: AgentStatusTone }
export type RecordListAction = { id: string; label: string; disabledReason?: string }
export type RecordListRow = {
  id: string; type: string; name: string; metadata: string; description?: ReactNode
  /** Host-classified membership, never inferred from status text. Omit for an already projected page. */
  tabIds?: readonly string[]
  status?: RecordListStatus; progress?: number | null
  action: RecordListAction; menu?: readonly RecordListAction[]
}
export type RecordListFilter = {
  id: string; label: string; value: string
  options: readonly { value: string; label: string }[]
}
export type RecordListState = { kind: "ready" | "loading" | "search-empty" }
  | { kind: "empty"; description?: string } | { kind: "error"; reason: string }
export type RecordListProps = {
  title?: string; description?: string; primaryLabel?: string
  tabs?: readonly RecordListTab[]; tab?: string; defaultTab?: string; onTabChange?: (id: string) => void
  rows: readonly RecordListRow[]; search?: string; searchLabel?: string; searchPlaceholder?: string
  filters?: readonly RecordListFilter[]; activeFilters?: readonly string[]
  summary?: RecordListStatus; state?: RecordListState
  /** Host supplies current page and visible page numbers after its query/projection. No inferred totals. */
  pagination?: { page: number; pages: readonly number[]; label?: string }
  onSearch?: (query: string) => void; onFilterChange?: (id: string, value: string) => void
  onRowAction?: (rowId: string, actionId: string) => void; onRowMenu?: (rowId: string, actionId: string) => void
  onPageChange?: (page: number) => void; onPrimary?: () => void; onRetry?: () => void; onClearFilters?: () => void
}

const targetClass = "h-auto sm:h-auto min-h-11 min-w-11 max-w-full whitespace-normal break-words"
const countLabel = (count: number | null) => count !== null && Number.isSafeInteger(count) && count >= 0 ? count : "未提供"
const knownProgress = (value: number | null | undefined): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100

/** Facts in, intents out. Only an uncontrolled tab is locally stateful. */
export function RecordList({ title = "批阅记录", description = "查看 AI 批阅进度、处理必要异常并管理最终结果", primaryLabel = "开始 AI 批阅",
  tabs = [], tab, defaultTab, onTabChange, rows, search = "", searchLabel = "搜索批阅名称或试卷", searchPlaceholder = "搜索批阅名称或试卷",
  filters = [], activeFilters = [], summary, state = { kind: "ready" }, pagination,
  onSearch, onFilterChange, onRowAction, onRowMenu, onPageChange, onPrimary, onRetry, onClearFilters }: RecordListProps) {
  const id = useId()
  const [localTab, setLocalTab] = useState(defaultTab ?? tabs[0]?.id ?? "")
  const selected = tab === undefined ? localTab : tab
  const visible = rows.filter(row => !row.tabIds || (!tabs.length && tab === undefined) || row.tabIds.includes(selected))
  const primary = <Button type="button" className={targetClass} disabled={!onPrimary} title={!onPrimary ? "操作暂不可用" : undefined} onClick={onPrimary}>{primaryLabel}</Button>
  const content = <div className="min-w-0 space-y-4">
    {state.kind !== "empty" && <div className="flex min-w-0 flex-wrap items-end gap-3" role="group" aria-label="记录搜索与筛选">
      <label className="grid min-w-0 flex-[2_1_240px] gap-2 text-ui-action" htmlFor={`${id}-search`}>{searchLabel}
        <Input id={`${id}-search`} type="search" value={search} placeholder={searchPlaceholder} readOnly={!onSearch}
          className="h-auto sm:h-auto min-h-11 w-full" onChange={event => onSearch?.(event.target.value)} />
      </label>
      {filters.map(filter => <div key={filter.id} className="grid min-w-0 flex-[1_1_150px] gap-2">
        <label htmlFor={`${id}-filter-${filter.id}`} className="break-words text-ui-action">{filter.label}</label>
        <Select items={filter.options} value={filter.value} disabled={!onFilterChange} onValueChange={value => { if (value !== null) onFilterChange?.(filter.id, value) }}>
          <SelectTrigger id={`${id}-filter-${filter.id}`} className="min-h-11 sm:min-h-11 min-w-0 w-full whitespace-normal"><SelectValue /></SelectTrigger>
          <SelectPopup>{filter.options.map(option => <SelectItem key={option.value} value={option.value} className="min-h-11 sm:min-h-11 whitespace-normal break-words">{option.label}</SelectItem>)}</SelectPopup>
        </Select>
      </div>)}
    </div>}
    {!!activeFilters.length && <div className="flex min-w-0 flex-wrap items-center gap-3" data-record-filters>
      <p className="min-w-0 break-words text-ui-hint">当前筛选：{activeFilters.join(" · ")}</p>
      <Button variant="outline" className={targetClass} disabled={!onClearFilters} onClick={onClearFilters}>清除筛选</Button>
    </div>}
    {state.kind === "loading" ? <div role="status" aria-live="polite" aria-busy="true" className="space-y-3">
      <p className="text-ui-hint">正在加载记录…</p>{[0, 1, 2].map(key => <Skeleton key={key} className="h-24 w-full motion-reduce:animate-none" />)}
    </div> : state.kind === "error" ? <Empty>
      <p role="alert" className="break-words text-ui-hint">{state.reason.trim() || "记录加载失败，原因未提供"}</p>
      <Button variant="outline" className={targetClass} disabled={!onRetry} onClick={onRetry}>重试</Button>
    </Empty> : state.kind === "empty" ? <Empty role="status">
      <p className="text-block-title">暂无记录</p><p className="break-words text-ui-hint">{state.description || "完成一次批阅后，处理进度、必要复核与最终结果会保存在这里。"}</p>{primary}
    </Empty> : state.kind === "search-empty" || !visible.length ? <Empty role="status">
      <p className="break-words text-block-title">没有找到匹配的记录</p><p className="break-words text-ui-hint">请调整关键词或清除筛选条件后重试。</p>
      {!!search && <Button variant="outline" className={targetClass} disabled={!onSearch} onClick={() => onSearch?.("")}>清除搜索</Button>}
    </Empty> : <>
      {summary && <div role="status" aria-live="polite"><AgentStatus icon={Circle} tone={summary.tone} className="text-ui-hint">{summary.label}</AgentStatus></div>}
      <ul className="min-w-0 space-y-3" aria-label={`${title}列表`}>
        {visible.map(row => {
          const reason = row.action.disabledReason?.trim() || (!onRowAction ? "操作暂不可用" : undefined)
          return <li key={row.id} className="min-w-0">
            <Card data-record-row={row.id} className="min-w-0 gap-0 overflow-hidden p-0" onClick={event => {
              // React portal events bubble too; isolate the entire menu subtree below.
              if (!reason && !(event.target as HTMLElement).closest("button,a,input,select,textarea,[role=menuitem],[data-record-menu]")) onRowAction?.(row.id, row.action.id)
            }}>
              {knownProgress(row.progress) && <Progress value={row.progress} aria-label={`${row.name}进度`}>
                <ProgressTrack className="h-1"><ProgressIndicator className="motion-reduce:transition-none" /></ProgressTrack>
              </Progress>}
              <div className="grid min-w-0 items-start gap-3 p-4 @min-[720px]:grid-cols-[minmax(0,1fr)_auto]">
                <div className="min-w-0 space-y-1">
                  <p className="break-words text-ui-meta">{row.type.trim() || "类型未提供"}</p>
                  <h4 className="break-words text-item-title">{row.name.trim() || "名称未提供"}</h4>
                  <p className="break-words text-ui-hint">{row.metadata.trim() || "记录信息未提供"}</p>
                  {row.description && <div className="min-w-0 break-words text-ui-hint">{row.description}</div>}
                </div>
                <div className="flex min-w-0 flex-wrap items-center gap-2 @min-[720px]:max-w-80 @min-[720px]:justify-end">
                  <AgentStatus icon={Circle} tone={row.status?.tone} unknown={!row.status?.label.trim()} className="self-center text-ui-hint">{row.status?.label.trim() || "状态未知"}</AgentStatus>
                  <Button variant="ghost" className={targetClass} disabled={!!reason} title={reason}
                    aria-label={`${row.action.label}：${row.name}`} onClick={event => { event.stopPropagation(); if (!reason) onRowAction?.(row.id, row.action.id) }}>
                    {row.action.label}<ChevronRight aria-hidden="true" />
                  </Button>
                  {!!row.menu?.length && <div data-record-menu onClick={event => event.stopPropagation()}>
                    <Menu><MenuTrigger render={<Button variant="ghost" className="min-h-11 min-w-11" aria-label={`更多操作：${row.name}`} disabled={!onRowMenu} />}><MoreHorizontal aria-hidden="true" /></MenuTrigger>
                      <MenuPopup align="end">{row.menu.map(item => <MenuItem key={item.id} className="min-h-11 sm:min-h-11 whitespace-normal break-words" disabled={!!item.disabledReason?.trim() || !onRowMenu}
                        onClick={event => { event.stopPropagation(); if (!item.disabledReason?.trim()) onRowMenu?.(row.id, item.id) }}>{item.label}{item.disabledReason && <span className="text-ui-hint"> · {item.disabledReason}</span>}</MenuItem>)}</MenuPopup>
                    </Menu>
                  </div>}
                  {reason && <p className="w-full break-words text-ui-hint">{reason}</p>}
                </div>
              </div>
            </Card>
          </li>
        })}
      </ul>
      {pagination && <div className="space-y-2">
        {pagination.label && <p className="break-words text-ui-hint">{pagination.label}</p>}
        <Pagination aria-label={`${title}分页`}><PaginationContent className="flex-wrap">
          {pagination.pages.map(page => <PaginationItem key={page}><PaginationLink isActive={page === pagination.page} aria-label={`第 ${page} 页`}
            render={<Button variant={page === pagination.page ? "outline" : "ghost"} className={targetClass} disabled={!onPageChange} />}
            onClick={() => onPageChange?.(page)}>{page}</PaginationLink></PaginationItem>)}
        </PaginationContent></Pagination>
      </div>}
    </>}
  </div>
  return <section data-record-list data-state={state.kind} aria-labelledby={`${id}-title`} className="@container min-w-0 space-y-5">
    <header className="flex min-w-0 flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 space-y-1"><h3 id={`${id}-title`} className="break-words text-block-title">{title}</h3><p className="break-words text-ui-hint">{description}</p></div>{primary}
    </header>
    {tabs.length ? <Tabs value={selected} onValueChange={value => { if (typeof value === "string") { if (tab === undefined) setLocalTab(value); onTabChange?.(value) } }} className="gap-4">
      <TabsList aria-label={`${title}分类`} className="max-w-full flex-wrap justify-start motion-reduce:[&_[data-slot=tab-indicator]]:transition-none">
        {tabs.map(item => <TabsTab key={item.id} value={item.id} className={`${targetClass} motion-reduce:transition-none`}>{item.label} <span className="tabular-nums">{countLabel(item.count)}</span></TabsTab>)}
      </TabsList>
      {tabs.map(item => <TabsPanel key={item.id} value={item.id} className="min-w-0">{item.id === selected ? content : null}</TabsPanel>)}
    </Tabs> : content}
  </section>
}
