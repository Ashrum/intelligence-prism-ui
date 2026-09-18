"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { type ColumnDef, columnSizingFeature, columnVisibilityFeature, createPaginatedRowModel, createSortedRowModel, flexRender, rowPaginationFeature, rowSelectionFeature, rowSortingFeature, sortFn_alphanumeric, sortFn_text, tableFeatures, useTable } from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ArrowUpDown, Search, X, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/coss/button"
import { Checkbox } from "@/components/coss/checkbox"
import { StatusBadge } from "@/components/prism-next/status-badge"
import { Frame, FrameFooter } from "@/components/coss/frame"
import { Label } from "@/components/coss/label"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/coss/input-group"
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from "@/components/coss/select"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableCaption } from "@/components/coss/table"
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/coss/pagination"
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/coss/empty"
import { Skeleton } from "@/components/coss/skeleton"
import { DemoSection, Feedback } from "@/components/prism-next/demo-parts"
import { filterMaterials, materialRows, setMaterialStatus, type MaterialRow } from "@/lib/prism-next/material-table"

const features = tableFeatures({ columnSizingFeature, columnVisibilityFeature, rowPaginationFeature, paginatedRowModel: createPaginatedRowModel(), rowSelectionFeature, rowSortingFeature, sortedRowModel: createSortedRowModel(), sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text } })
const columns: ColumnDef<typeof features, MaterialRow>[] = [
  { id: "select", size: 40, enableSorting: false, header: ({ table }) => <Checkbox aria-label="选择本页全部材料" checked={table.getIsAllPageRowsSelected()} indeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()} onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)} />, cell: ({ row }) => <Checkbox aria-label={`选择${row.original.title}`} checked={row.getIsSelected()} onCheckedChange={value => row.toggleSelected(!!value)} /> },
  { accessorKey: "title", header: "材料", size: 270, cell: ({ row }) => <div><p className="font-medium">{row.original.title}</p><p className="mt-1 text-xs text-muted-foreground">{row.original.id} · {row.original.subject}</p></div> },
  { accessorKey: "minutes", header: "时长", size: 100, cell: ({ row }) => <span className="prism-numeric">{row.original.minutes} 分钟</span> },
  { accessorKey: "score", header: "评分", size: 100, cell: ({ row }) => <span className="prism-numeric">{row.original.score.toFixed(2)}</span> },
  { accessorKey: "status", header: "状态", size: 110, enableSorting: false, cell: ({ row }) => <StatusBadge tone={row.original.status === "reviewed" ? "complete" : "pending"}>{row.original.status === "reviewed" ? "已复核" : "待复核"}</StatusBadge> },
]
const statuses = [{ value: "all", label: "全部状态" }, { value: "pending", label: "待复核" }, { value: "reviewed", label: "已复核" }]

export function MaterialTableParticle() {
  const [rows, setRows] = useState(materialRows)
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("all")
  const [message, setMessage] = useState("")
  const [loadState, setLoadState] = useState<"ready" | "loading" | "error">("ready")
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])
  const filtered = useMemo(() => filterMaterials(rows, query, status), [rows, query, status])
  const table = useTable({ columns, data: filtered, features, getRowId: row => row.id, enableSortingRemoval: false, initialState: { pagination: { pageIndex: 0, pageSize: 5 }, sorting: [{ id: "score", desc: true }] } }, state => ({ pagination: state.pagination, rowSelection: state.rowSelection, sorting: state.sorting }))
  const selectedIds = Object.entries(table.state.rowSelection).filter(([, selected]) => selected).map(([id]) => id)
  function resetView() { table.setPageIndex(0); table.resetRowSelection(); setMessage("") }
  function reload(fail: boolean) {
    if (timer.current) clearTimeout(timer.current)
    table.resetRowSelection(); setMessage(""); setLoadState("loading")
    timer.current = setTimeout(() => { setLoadState(fail ? "error" : "ready"); timer.current = null }, 700)
  }
  function markSelected(next: MaterialRow["status"]) {
    if (!selectedIds.length) return
    setRows(current => setMaterialStatus(current, selectedIds, next))
    setMessage(`已将 ${selectedIds.length} 份材料标记为${next === "reviewed" ? "已复核" : "待复核"}。`)
    table.resetRowSelection(); table.setPageIndex(0)
  }
  const page = table.state.pagination.pageIndex
  const pageSize = table.state.pagination.pageSize
  return <DemoSection title="筛选、选择与批量操作" description="勾选可跨页保留；更换筛选条件会清空选择并返回第一页。所有操作仅影响本页示例。" sources={["p-table-3", "p-table-4"]}>
    <div className="mb-5 flex flex-wrap items-end gap-4"><div className="min-w-48 flex-1 max-w-sm"><Label htmlFor="table-search">搜索材料</Label><InputGroup><InputGroupAddon><Search /></InputGroupAddon><InputGroupInput id="table-search" ref={searchRef} value={query} disabled={loadState !== "ready"} onChange={e => { setQuery(e.target.value); resetView() }} placeholder="名称、编号或学科" />{query && <InputGroupAddon align="inline-end"><Button variant="ghost" size="icon-xs" disabled={loadState !== "ready"} aria-label="清除表格搜索" onClick={() => { setQuery(""); resetView(); searchRef.current?.focus() }}><X /></Button></InputGroupAddon>}</InputGroup></div>
      <div className="w-40"><Label htmlFor="table-status">复核状态</Label><Select items={statuses} value={status} disabled={loadState !== "ready"} onValueChange={value => { if (value) setStatus(value); resetView() }}><SelectTrigger id="table-status"><SelectValue /></SelectTrigger><SelectPopup>{statuses.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectPopup></Select></div>
      <Button variant="outline" disabled={loadState === "loading"} onClick={() => reload(false)}><RotateCcw />重新加载</Button>
    </div>
    <div className="mb-3 flex min-h-8 flex-wrap items-center gap-3"><span className="text-sm text-muted-foreground" role="status">已选 {selectedIds.length} 份{selectedIds.length > 0 ? "（可跨页）" : ""}</span><Button size="sm" variant="outline" disabled={!selectedIds.length || loadState !== "ready"} onClick={() => markSelected("reviewed")}>标记已复核</Button><Button size="sm" variant="ghost" disabled={!selectedIds.length || loadState !== "ready"} onClick={() => markSelected("pending")}>标记待复核</Button>{selectedIds.length > 0 && <Button size="sm" variant="ghost" onClick={() => table.resetRowSelection()}>取消选择</Button>}</div>
    <Frame className="w-full" aria-busy={loadState === "loading"}>
      {loadState === "error" ? <Empty role="alert"><EmptyHeader><EmptyTitle>材料加载失败</EmptyTitle><EmptyDescription>当前修改和筛选条件已保留，请重试。</EmptyDescription></EmptyHeader><EmptyContent><Button onClick={() => reload(false)}>重试加载</Button></EmptyContent></Empty> : <Table variant="card" className="min-w-[600px] table-fixed"><TableCaption className="sr-only">材料复核清单，评分可排序，表头复选框选择本页。</TableCaption><TableHeader>{table.getHeaderGroups().map(group => <TableRow key={group.id}>{group.headers.map(header => <TableHead key={header.id} style={{ width: header.column.getSize() }} aria-sort={header.column.getCanSort() ? header.column.getIsSorted() === "asc" ? "ascending" : header.column.getIsSorted() === "desc" ? "descending" : "none" : undefined} className={header.id === "score" || header.id === "minutes" ? "text-right" : undefined}>{header.isPlaceholder ? null : header.column.getCanSort() ? <Button variant="ghost" size="sm" disabled={loadState === "loading"} onClick={header.column.getToggleSortingHandler()}>{flexRender(header.column.columnDef.header, header.getContext())}{header.column.getIsSorted() === "asc" ? <ArrowUp /> : header.column.getIsSorted() === "desc" ? <ArrowDown /> : <ArrowUpDown />}</Button> : header.id === "select" && loadState === "loading" ? <Checkbox disabled aria-label="选择本页全部材料" /> : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>)}</TableRow>)}</TableHeader>
        <TableBody>{loadState === "loading" ? Array.from({ length: 5 }, (_, i) => <TableRow key={i}>{columns.map((_, j) => <TableCell key={j}><Skeleton className={j === 0 ? "size-4" : "h-5 w-3/4"} /></TableCell>)}</TableRow>) : table.getRowModel().rows.length ? table.getRowModel().rows.map(row => <TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : undefined}>{row.getVisibleCells().map(cell => <TableCell key={cell.id} className={cell.column.id === "score" || cell.column.id === "minutes" ? "text-right" : undefined}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>) : <TableRow><TableCell colSpan={columns.length}><Empty><EmptyHeader><EmptyTitle>没有符合条件的材料</EmptyTitle><EmptyDescription>尝试其他关键词，或清除筛选条件。</EmptyDescription></EmptyHeader><EmptyContent><Button variant="outline" onClick={() => { setQuery(""); setStatus("all"); resetView() }}>清除筛选</Button></EmptyContent></Empty></TableCell></TableRow>}</TableBody>
      </Table>}
      <FrameFooter className="p-3"><div className="flex flex-wrap items-center justify-between gap-3"><span className="text-sm text-muted-foreground">{filtered.length ? `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, filtered.length)}` : "0"} / {filtered.length} 份</span><div className="flex items-center gap-2"><Label htmlFor="table-page-size" className="whitespace-nowrap">每页</Label><Select value={pageSize} items={[{ value: 5, label: "5 份" }, { value: 10, label: "10 份" }]} disabled={loadState !== "ready"} onValueChange={value => { if (value) table.setPageSize(value); table.setPageIndex(0) }}><SelectTrigger id="table-page-size" size="sm" className="w-fit min-w-0"><SelectValue /></SelectTrigger><SelectPopup><SelectItem value={5}>5 份</SelectItem><SelectItem value={10}>10 份</SelectItem></SelectPopup></Select></div><Pagination aria-label="材料清单分页" className="mx-0 w-auto"><PaginationContent><PaginationItem><PaginationLink render={<Button size="sm" variant="outline" disabled={!table.getCanPreviousPage() || loadState !== "ready"} onClick={() => table.previousPage()} />} aria-label="上一页"><ChevronLeft />上一页</PaginationLink></PaginationItem><PaginationItem><PaginationLink render={<Button size="sm" variant="outline" disabled={!table.getCanNextPage() || loadState !== "ready"} onClick={() => table.nextPage()} />} aria-label="下一页">下一页<ChevronRight /></PaginationLink></PaginationItem></PaginationContent></Pagination></div></FrameFooter>
    </Frame>
    <Feedback>{loadState === "loading" ? "正在加载材料……" : message || "点击评分或时长排序，勾选材料后可批量标记。"}</Feedback>
    <div className="mt-4 flex flex-wrap items-center gap-3 border-t pt-4 text-sm text-muted-foreground"><span>状态演示</span><Button variant="ghost" size="sm" disabled={loadState === "loading"} onClick={() => reload(true)}>模拟加载失败</Button><Button variant="ghost" size="sm" disabled={loadState === "loading"} onClick={() => { setRows(materialRows); setQuery(""); setStatus("all"); resetView(); setLoadState("ready") }}>恢复示例数据</Button></div>
  </DemoSection>
}
