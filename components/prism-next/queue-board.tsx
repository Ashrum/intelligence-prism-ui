"use client"

import { useId, useState, type CSSProperties, type ReactNode } from "react"
import { ChevronRight } from "lucide-react"
import { Frame, FrameHeader, FramePanel } from "@/components/coss/frame"
import { ScrollArea } from "@/components/coss/scroll-area"
import { Empty } from "@/components/coss/empty"
import { Skeleton } from "@/components/coss/skeleton"
import { ToggleGroup, ToggleGroupItem } from "@/components/coss/toggle-group"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/coss/table"
import { Badge } from "./badge"
import { Button } from "./button"

export type QueueBoardCategory = {
  id: string; label: string; description: string; count: number | null
  tone: "success" | "info" | "error" | "warning"
}
export type QueueBoardAction = { id: string; label: string; disabled?: boolean; disabledReason?: string }
export type QueueBoardRow = {
  id: string; name: string; examNumber?: string; pages?: number | null; paperTitle?: string
  /** A host-classified category ID; the board does not classify business facts. */
  statusId: string; description?: ReactNode; actions: readonly QueueBoardAction[]
}
export type QueueBoardProps = {
  title?: string; description?: string
  /** Supply 2–6 unique categories. Counts and mutually exclusive classification belong to the host. */
  categories: readonly QueueBoardCategory[]; rows: readonly QueueBoardRow[]
  filter?: string | null; defaultFilter?: string | null
  onFilterChange?: (id: string | null) => void
  onRowAction?: (rowId: string, actionId: string) => void
  headerAction?: Omit<QueueBoardAction, "id">; onHeaderAction?: () => void
  state?: { kind: "ready" | "loading" } | { kind: "empty"; description?: string } | { kind: "error"; reason: string }
  onRetry?: () => void
  /** Constrains only the table scroll region. Pagination can instead be composed by the host. */
  maxHeight?: CSSProperties["maxHeight"]
}

const validCount = (count: number | null) => count !== null && Number.isSafeInteger(count) && count >= 0
function identity(row: QueueBoardRow) {
  const exam = row.examNumber?.trim(), pages = row.pages != null && Number.isSafeInteger(row.pages) && row.pages > 0 ? row.pages : null
  return !exam && pages === null ? "考号、页数未提供" : `考号 ${exam || "未提供"} · ${pages === null ? "页数未提供" : `${pages} 页`}`
}
function BoardAction({ label, accessibleLabel, reason, onClick, children }: { label: string; accessibleLabel?: string; reason?: string; onClick: () => void; children?: ReactNode }) {
  const id = useId()
  return <div className="min-w-0 space-y-1">
    <Button type="button" variant="outline" className="h-auto sm:h-auto min-h-11 max-w-full whitespace-normal" disabled={!!reason}
      title={reason} aria-label={accessibleLabel} aria-describedby={reason ? id : undefined} onClick={() => { if (!reason) onClick() }}>{label}{children}</Button>
    {reason && <p id={id} className="break-words text-ui-hint">{reason}</p>}
  </div>
}
const actionReason = (action: Omit<QueueBoardAction, "id">, available: boolean) =>
  action.disabledReason?.trim() || (action.disabled ? "当前不可操作，原因未提供" : !available ? "操作暂不可用" : undefined)

/** A fact-only queue view. Only the local filter is stateful; actions never advance a row. */
export function QueueBoard({ title = "试卷工作区", description = "选择队列后预览或处理具体试卷", categories, rows,
  filter, defaultFilter = null, onFilterChange, onRowAction, headerAction, onHeaderAction, state = { kind: "ready" }, onRetry, maxHeight }: QueueBoardProps) {
  const id = useId()
  const [localFilter, setLocalFilter] = useState<string | null>(defaultFilter)
  const selected = filter === undefined ? localFilter : filter
  const visible = selected === null ? rows : rows.filter(row => row.statusId === selected)
  const select = (values: string[]) => {
    const next = values[0] ?? null
    if (filter === undefined) setLocalFilter(next)
    onFilterChange?.(next)
  }
  return <section aria-labelledby={`${id}-title`} className="@container min-w-0" data-queue-board data-state={state.kind}><Frame>
    <FrameHeader className="flex min-w-0 flex-row flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 space-y-1"><h3 id={`${id}-title`} className="break-words text-block-title">{title}</h3><p className="break-words text-ui-hint">{description}</p></div>
      {state.kind === "ready" && headerAction && <BoardAction label={headerAction.label} reason={actionReason(headerAction, !!onHeaderAction)} onClick={() => onHeaderAction?.()}><ChevronRight aria-hidden="true" /></BoardAction>}
    </FrameHeader>
    {state.kind !== "ready" ? <FramePanel>{state.kind === "loading" ? <div role="status" aria-live="polite" aria-busy="true" className="space-y-3"><p className="text-ui-hint">正在加载试卷队列…</p><Skeleton className="h-24 w-full motion-reduce:animate-none" /><Skeleton className="h-40 w-full motion-reduce:animate-none" /></div>
      : state.kind === "error" ? <Empty><p role="alert" className="break-words text-ui-hint">{state.reason || "队列加载失败，原因未提供"}</p><BoardAction label="重试" reason={!onRetry ? "重试暂不可用" : undefined} onClick={() => onRetry?.()} /></Empty>
      : <Empty role="status"><p className="text-ui-body">暂无试卷</p>{state.kind === "empty" && state.description && <p className="text-ui-hint">{state.description}</p>}</Empty>}</FramePanel>
      : <>
        <FramePanel className="min-w-0"><ToggleGroup multiple={false} value={selected === null ? [] : [selected]} onValueChange={select} aria-label="队列状态筛选" className="grid w-full min-w-0 grid-cols-1 gap-3 @min-[360px]:grid-cols-2 @min-[760px]:grid-cols-4">
          {categories.map(category => <ToggleGroupItem key={category.id} value={category.id}
            aria-label={`${category.label}：${validCount(category.count) ? category.count : "数量未提供"}`} aria-describedby={`${id}-filter-${category.id}`}
            className="h-auto sm:h-auto min-h-11 min-w-0 justify-start whitespace-normal p-3 text-left motion-reduce:transition-none">
            <span className="grid min-w-0 gap-2"><span className="text-stat-display tabular-nums">{validCount(category.count) ? category.count : "未提供"}</span>
              <Badge variant={category.tone} className="max-w-full whitespace-normal break-words">{category.label}</Badge>
              <span id={`${id}-filter-${category.id}`} className="break-words text-ui-hint">{category.description}</span>
            </span>
          </ToggleGroupItem>)}
        </ToggleGroup></FramePanel>
        <p role="status" aria-live="polite" className="sr-only">{selected === null ? "全部队列" : `当前队列：${categories.find(category => category.id === selected)?.label || "分类未提供"}`}{!visible.length && ` · ${selected === null ? "暂无试卷" : "该队列暂无试卷"}`}</p>
        {visible.length ? <Table variant="card" className="min-w-[680px] table-fixed" render={maxHeight !== undefined
          ? <ScrollArea role="region" aria-label="试卷队列表，可横向滚动" scrollFade overscrollContain className="h-auto min-w-0 overflow-hidden! [&>[data-slot=scroll-area-viewport]]:max-h-[inherit] motion-reduce:[&_[data-slot=scroll-area-viewport]]:transition-none motion-reduce:[&_[data-slot=scroll-area-scrollbar]]:transition-none" style={{ maxHeight }} />
          : <div role="region" aria-label="试卷队列表，可横向滚动" tabIndex={0} />}>
          <TableHeader><TableRow><TableHead scope="col" className="w-1/4">学生 / 试卷</TableHead><TableHead scope="col" className="w-36">当前状态</TableHead><TableHead scope="col">状态说明</TableHead><TableHead scope="col" className="w-40">操作</TableHead></TableRow></TableHeader>
          <TableBody>{visible.map(row => {
            const category = categories.find(category => category.id === row.statusId)
            return <TableRow key={row.id}>
              <TableCell className="whitespace-normal break-words"><p className="text-item-title">{row.name.trim() || "姓名未提供"}</p><p className="text-ui-hint">{identity(row)}</p>{row.paperTitle && <p className="text-ui-hint">{row.paperTitle}</p>}</TableCell>
              <TableCell className="whitespace-normal"><Badge variant={category?.tone || "outline"} className="max-w-full whitespace-normal break-words">{category?.label || "状态未提供"}</Badge></TableCell>
              <TableCell className="whitespace-normal break-words text-ui-hint">{row.description ?? "状态说明未提供"}</TableCell>
              <TableCell className="space-y-2 whitespace-normal break-words">{row.actions.length ? row.actions.map(action => <BoardAction key={action.id} label={action.label}
                accessibleLabel={`${action.label}：${row.name.trim() || "姓名未提供"}`}
                reason={actionReason(action, !!onRowAction)} onClick={() => onRowAction?.(row.id, action.id)} />) : <span className="text-ui-hint">未提供操作</span>}</TableCell>
            </TableRow>
          })}</TableBody>
        </Table> : <Empty><p className="text-ui-body">{selected === null ? "暂无试卷" : "该队列暂无试卷"}</p></Empty>}
      </>}
  </Frame></section>
}
