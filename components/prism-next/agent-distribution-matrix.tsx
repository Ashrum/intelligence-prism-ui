"use client"

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react"
import { ArrowLeft, ArrowUpRight, Check } from "lucide-react"
import { Card } from "@/components/coss/card"
import { Label } from "@/components/coss/label"
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from "@/components/coss/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/coss/table"
import { Badge, type BadgeProps } from "./badge"
import { Button } from "./button"
import { RecordDetails, type AgentRecordViewProps } from "./agent-record-parts"
import type { AgentMetricReading, AgentMetricRecord, AgentMetricScope } from "./agent-metric-summary"

export type AgentDistributionOption = { id: string; label: string }
export type AgentDistributionMember = AgentDistributionOption & { content?: ReactNode }
export type AgentDistributionAxis = AgentDistributionOption & {
  items: readonly AgentDistributionMember[]
  /** Legal alternatives supplied by the page; switching only emits a request. */
  options?: readonly AgentDistributionOption[]
  disabledReason?: string
}
export type AgentDistributionReading = AgentMetricReading
  | { state: "not-applicable"; reason: string; value?: never; unit?: never }
export type AgentDistributionCellRef = { rowId: string; columnId: string }
export type AgentDistributionCell = AgentDistributionCellRef & {
  reading: AgentDistributionReading
  sampleSize?: string
  denominator?: string
  /** Explicit band membership, never inferred from values or from other cells. */
  bandId?: string
  selectable?: boolean
  disabledReason?: string
}
export type AgentDistributionBand = AgentDistributionOption & {
  /** Human-readable interval, including its endpoints and unit. */
  interval: string
  tone: Extract<BadgeProps["variant"], "secondary" | "outline" | "info" | "success" | "warning" | "error">
}
export type AgentDistributionRegion = {
  id: string
  label: string
  summary: ReactNode
  basis: string
  cells?: readonly AgentDistributionCellRef[]
}
export type AgentDistributionFilter = AgentDistributionOption & {
  value: string
  options: readonly AgentDistributionOption[]
  disabledReason?: string
}
export type AgentDistributionComparison = {
  axis: "row" | "column"
  /** Zero to two selections. Two distinct current members show a comparison. */
  memberIds: readonly string[]
  disabledReason?: string
}
export type AgentDistributionIntent = {
  recordId: string
  version: string
  rowDimensionId: string
  columnDimensionId: string
} & (
  | { type: "change-dimension"; axis: "row" | "column"; dimensionId: string }
  | { type: "filter"; filterId: string; value: string }
  | { type: "sort"; sortId: string }
  | ({ type: "select-cell" } & AgentDistributionCellRef)
  | { type: "compare"; axis: "row" | "column"; memberIds: readonly string[] }
)
export type AgentDistributionMatrixProps = AgentRecordViewProps & {
  title: string
  record: AgentMetricRecord
  scope: AgentMetricScope
  rowDimension: AgentDistributionAxis
  columnDimension: AgentDistributionAxis
  cells: readonly AgentDistributionCell[]
  method: string
  /** Whole-matrix facts, in the same wording as semantic 19. */
  sample?: { size: string; denominator?: string }
  /** Explicit common per-cell facts; an empty override stays unknown. */
  cellSample?: { size?: string; denominator?: string }
  keyRegions: readonly AgentDistributionRegion[]
  bands?: readonly AgentDistributionBand[]
  filters?: readonly AgentDistributionFilter[]
  sort?: { value: string; options: readonly AgentDistributionOption[]; basis: string; disabledReason?: string }
  comparison?: AgentDistributionComparison
  selectedCell?: AgentDistributionCellRef
  onIntent?: (intent: AgentDistributionIntent, trigger?: HTMLButtonElement) => void
  onBack?: () => void
  notice?: string
}

const readingLabels = { missing: "缺测", insufficient: "样本不足", unknown: "未知", "not-applicable": "不适用" }
const hasText = (value: string | undefined): value is string => !!value?.trim()
const sentence = (value: string) => value.trim().replace(/[。；;.!！]+$/u, "")
const sameCell = (a: AgentDistributionCellRef | undefined, b: AgentDistributionCellRef) => a?.rowId === b.rowId && a.columnId === b.columnId
const cellKey = (ref: AgentDistributionCellRef) => JSON.stringify([ref.rowId, ref.columnId])

function MatrixSelect({ label, value, options, onChange, disabled, describedBy, emptyLabel = "未知" }: {
  label: string; value: string; options: readonly AgentDistributionOption[]; onChange?: (id: string) => void
  disabled?: boolean; describedBy?: string; emptyLabel?: string
}) {
  const id = useId()
  const index = options.findIndex(option => option.id === value)
  // Only local ordinals enter the Select DOM. Opaque IDs remain in requests.
  const items = [{ value: "none", label: emptyLabel }, ...options.map((option, i) => ({ value: String(i), label: option.label }))]
  return <div className="grid min-w-0 gap-2" aria-describedby={describedBy}>
    <Label htmlFor={onChange ? id : undefined}>{label}</Label>
    {onChange ? <Select value={index < 0 ? "none" : String(index)} items={items} disabled={disabled}
      onValueChange={next => { const option = options[Number(next)]; if (!disabled && next !== null && next !== "none" && option) onChange(option.id) }}>
      <SelectTrigger id={id} aria-label={label} aria-describedby={describedBy} className="h-auto min-w-36 max-w-full"><SelectValue className="overflow-visible whitespace-normal break-words text-clip" /></SelectTrigger>
      <SelectPopup>{items.map(item => <SelectItem key={item.value} value={item.value} className="whitespace-normal break-words">{item.label}</SelectItem>)}</SelectPopup>
    </Select>
      : <p className="break-words text-ui-body">{options[index]?.label ?? emptyLabel}</p>}
  </div>
}

type Entry = {
  ref: AgentDistributionCellRef
  row: AgentDistributionMember
  column: AgentDistributionMember
  reading: AgentDistributionReading
  band?: AgentDistributionBand
  notes: string[]
  selectionReason?: string
}

function CellReading({ entry, id }: { entry: Entry; id?: string }) {
  return <Badge id={id} variant={entry.reading.state === "available" ? entry.band?.tone ?? "secondary" : "outline"}
    className="h-auto max-w-full whitespace-normal break-words py-1">
    {entry.reading.state === "available" ? <span className="tabular-nums">{entry.reading.value}{entry.reading.unit}{entry.band && <> · {entry.band.label}</>}</span> : readingLabels[entry.reading.state]}
  </Badge>
}

/** Semantic 20: no statistics, ranking, interpolation, data fetching or business state. */
export function AgentDistributionMatrix({ title, record, scope, rowDimension, columnDimension, cells, method, sample, cellSample,
  keyRegions, bands = [], filters = [], sort, comparison, selectedCell, view = "inline", density = "default", onIntent,
  onExpand, onBack, details, notice = "分布描述本次记录；判断前请核对样本与口径。" }: AgentDistributionMatrixProps) {
  const id = useId()
  const workspace = view === "workspace"
  const signature = JSON.stringify([record.id, record.version, rowDimension.id, columnDimension.id])
  const [focus, setFocus] = useState<{ signature: string; cell: AgentDistributionCellRef } | null>(null)
  const buttons = useRef(new Map<number, HTMLButtonElement>())
  const available = scope.state === "available"
  const target = { recordId: record.id, version: record.version, rowDimensionId: rowDimension.id, columnDimensionId: columnDimension.id }
  const targetValid = Object.values(target).every(hasText)
  const request = onIntent && targetValid && available ? onIntent : undefined
  const globalReason = !targetValid ? "记录或维度信息不完整，暂不能调整视图或查看依据。" : !onIntent ? "当前未开放视图调整与单元格下钻。" : undefined
  const cellIndex = new Map<string, AgentDistributionCell | null>()
  if (available) for (const cell of cells) {
    const key = cellKey(cell)
    cellIndex.set(key, cellIndex.has(key) ? null : cell)
  }
  const entries: Entry[] = available ? rowDimension.items.flatMap(row => columnDimension.items.map(column => {
    const cell = cellIndex.get(cellKey({ rowId: row.id, columnId: column.id }))
    let reading: AgentDistributionReading = cell?.reading ?? { state: "unknown", reason: cell === null ? "同一位置有多份记录，需核对后查看。" : "此位置未提供记录。" }
    if (reading.state === "available" && (typeof reading.value === "number" ? !Number.isFinite(reading.value) : !hasText(reading.value))) {
      reading = { state: "unknown", reason: "未提供有效数值。" }
    }
    const band = reading.state === "available" && cell?.bandId ? bands.find(item => item.id === cell.bandId) : undefined
    const notes: string[] = []
    if (reading.state !== "available") notes.push(`${readingLabels[reading.state]}：${sentence(reading.reason) || "原因未知"}。`)
    if (reading.state === "available" && cell?.bandId && !band) notes.push("颜色分级未知。")
    const unknown: string[] = []
    for (const [label, own, shared] of [["样本量", cell?.sampleSize, cellSample?.size], ["分母", cell?.denominator, cellSample?.denominator]] as const) {
      const value = own === undefined ? shared : own
      if (!hasText(value)) unknown.push(label)
      else if (value !== shared) notes.push(`${label}：${sentence(value)}。`)
    }
    if (unknown.length) notes.push(`未知：${unknown.join("、")}。`)
    const selectionReason = globalReason ?? (hasText(cell?.disabledReason) ? cell.disabledReason
      : !hasText(row.id) || !hasText(column.id) ? "行列信息不完整，暂不能查看依据。"
      : !cell?.selectable ? "暂未提供可查看的单元格依据。" : undefined)
    if (selectionReason && selectionReason !== globalReason && (reading.state === "available" || sentence(selectionReason) !== sentence(reading.reason))) notes.push(`${sentence(selectionReason)}。`)
    return { ref: { rowId: row.id, columnId: column.id }, row, column, reading, band, notes: [...new Set(notes)], selectionReason }
  })) : []
  const entryIndex = new Map(entries.map(entry => [cellKey(entry.ref), entry]))
  // Deduplicate explanations only; this does not derive counts or statistical summaries.
  const notes = new Map<string, Entry[]>()
  for (const entry of entries) for (const note of entry.notes) notes.set(note, [...(notes.get(note) ?? []), entry])
  const noteRows: { text: string; members: Entry[]; id: string }[] = []
  for (const [text, members] of notes) {
    const group = noteRows.find(note => note.members.length === members.length && note.members.every((member, i) => member === members[i]))
    if (group) group.text += ` ${text}`
    else noteRows.push({ text, members, id: `${id}-note-${noteRows.length}` })
  }
  const controlReasons = available ? [...new Set([globalReason, rowDimension.disabledReason, columnDimension.disabledReason,
    ...filters.map(filter => filter.disabledReason), sort?.disabledReason, comparison?.disabledReason].filter(hasText).map(value => `${sentence(value)}。`))] : []
  const cellDescription = (entry: Entry) => [`${id}-cell-sample`, ...noteRows.filter(note => note.members.includes(entry)).map(note => note.id),
    globalReason ? `${id}-controls` : ""].filter(Boolean).join(" ")
  const choose = (entry: Entry, trigger: HTMLButtonElement) => {
    if (request && !entry.selectionReason) request({ ...target, type: "select-cell", ...entry.ref }, trigger)
  }

  const comparedAxis = comparison?.axis === "row" ? rowDimension : columnDimension
  const comparisonValid = !!comparison && comparison.memberIds.length === 2 && comparison.memberIds[0] !== comparison.memberIds[1]
    && comparison.memberIds.every(member => comparedAxis.items.some(item => item.id === member))
  const comparisonInvalid = !!comparison?.memberIds.length && !comparisonValid
  const rows = comparisonValid && comparison?.axis === "row" ? comparison.memberIds.map(member => rowDimension.items.find(item => item.id === member)!) : rowDimension.items
  const columns = comparisonValid && comparison?.axis === "column" ? comparison.memberIds.map(member => columnDimension.items.find(item => item.id === member)!) : columnDimension.items
  const visibleEntries = rows.flatMap(row => columns.map(column => entryIndex.get(cellKey({ rowId: row.id, columnId: column.id }))!)).filter(Boolean)
  const focused = focus?.signature === signature ? focus.cell : selectedCell
  const active = visibleEntries.find(entry => sameCell(focused, entry.ref)) ?? visibleEntries[0]
  const move = (event: KeyboardEvent<HTMLButtonElement>, row: number, column: number) => {
    let nextRow = row, nextColumn = column
    if (event.key === "ArrowRight") nextColumn = Math.min(column + 1, columns.length - 1)
    else if (event.key === "ArrowLeft") nextColumn = Math.max(column - 1, 0)
    else if (event.key === "ArrowDown") nextRow = Math.min(row + 1, rows.length - 1)
    else if (event.key === "ArrowUp") nextRow = Math.max(row - 1, 0)
    else if (event.key === "Home") { nextColumn = 0; if (event.ctrlKey || event.metaKey) nextRow = 0 }
    else if (event.key === "End") { nextColumn = columns.length - 1; if (event.ctrlKey || event.metaKey) nextRow = rows.length - 1 }
    else return
    event.preventDefault()
    buttons.current.get(nextRow * columns.length + nextColumn)?.focus()
  }
  const metadata = [hasText(record.version) && `数据版本：${record.version}`, hasText(record.dataTime) && `数据时间：${record.dataTime}`].filter(Boolean).join(" · ")
  const summaryFacts = [hasText(sample?.size) && `样本量：${sample.size}`, hasText(sample?.denominator) && `分母：${sample.denominator}`, hasText(method) && `统计口径：${sentence(method)}`].filter(Boolean).join(" · ")
  const unknownFacts = [["数据版本", record.version], ["数据时间", record.dataTime], ["样本量", sample?.size], ["分母", sample?.denominator], ["统计口径", method]].filter(([, value]) => !hasText(value)).map(([label]) => label)
  const sharedCellFacts = [hasText(cellSample?.size) && `样本量：${cellSample.size}`, hasText(cellSample?.denominator) && `分母：${cellSample.denominator}`].filter(Boolean).join(" · ")
  const showTable = workspace || !onExpand

  return <Card aria-labelledby={`${id}-title`} data-agent-distribution-view={view} data-density={density}
    className={`@container min-w-0 break-words ${density === "compact" ? "gap-3 p-4" : "gap-5 p-5"}`}>
    <header className="min-w-0 space-y-2">
      <h3 id={`${id}-title`} className="text-block-title">{available ? title : "分布矩阵"}</h3>
      {available ? <>
        <p className="text-ui-hint">{record.snapshot ? "当时数据" : "当前状态"}{metadata && ` · ${metadata}`}</p>
        <p className="text-ui-hint">数据范围：{scope.summary.trim() || "未指定"}</p>
        {summaryFacts && <p className="text-ui-hint">{summaryFacts}</p>}
        {!!unknownFacts.length && <p className="text-ui-hint">未知：{unknownFacts.join("、")}。</p>}
        {scope.restricted && <p className="text-ui-hint">访问受限{scope.restricted.count ? `（${scope.restricted.count}）` : ""}：{scope.restricted.reason}</p>}
      </> : <p className="text-ui-hint">访问受限{scope.disclosure.count ? `（${scope.disclosure.count}）` : ""}：{scope.disclosure.reason}</p>}
    </header>
    {available && <>
      {!workspace && <section aria-label="关键区域摘要" className="min-w-0 space-y-3">
        {!keyRegions.length && <p className="text-ui-hint">暂未提供关键区域摘要。</p>}
        {keyRegions.map(region => <div key={region.id} className="min-w-0 space-y-2">
          <h4 className="text-item-title">{region.label}</h4>
          <div className="max-w-[40em] whitespace-pre-wrap text-ui-body">{region.summary}</div>
          <p className="text-ui-hint">摘要依据：{region.basis.trim() || "未知"}</p>
          {!!region.cells?.length && <ul className="space-y-2">{region.cells.map((ref, index) => {
            const entry = entryIndex.get(cellKey(ref))
            return <li key={index} className="text-ui-body">{entry ? <div className="flex flex-wrap items-center gap-2">
              <span>{entry.row.label} · {entry.column.label}</span><CellReading entry={entry} />
              {request && !entry.selectionReason && <Button type="button" variant="ghost" size="sm" aria-label={`查看${entry.row.label}、${entry.column.label}的依据`}
                onClick={event => choose(entry, event.currentTarget)}>查看依据<ArrowUpRight aria-hidden="true" /></Button>}
            </div> : "摘要关联的单元格未提供，请核对当前范围。"}</li>
          })}</ul>}
        </div>)}
      </section>}
      {workspace && <div className="flex min-w-0 flex-wrap items-end gap-4">
        {([['row', rowDimension, '行维度'], ['column', columnDimension, '列维度']] as const).map(([axis, dimension, label]) => <MatrixSelect key={axis} label={label}
          value={dimension.id} options={dimension.options ?? [dimension]} disabled={!!dimension.disabledReason} describedBy={controlReasons.length ? `${id}-controls` : undefined}
          onChange={request && dimension.options?.length ? dimensionId => { if (!dimension.disabledReason) request({ ...target, type: "change-dimension", axis, dimensionId }) } : undefined} />)}
        {filters.map(filter => <MatrixSelect key={filter.id} label={filter.label} value={filter.value} options={filter.options} disabled={!!filter.disabledReason}
          describedBy={controlReasons.length ? `${id}-controls` : undefined} onChange={request ? value => { if (!filter.disabledReason) request({ ...target, type: "filter", filterId: filter.id, value }) } : undefined} />)}
        {sort && <MatrixSelect label="排序" value={sort.value} options={sort.options} disabled={!!sort.disabledReason}
          describedBy={controlReasons.length ? `${id}-controls` : undefined} onChange={request ? sortId => { if (!sort.disabledReason) request({ ...target, type: "sort", sortId }) } : undefined} />}
      </div>}
      {sort && <p className="text-ui-hint">排序依据：{sort.basis.trim() || "未知"}</p>}
      {!workspace && comparisonValid && comparison && <p className="text-ui-hint">当前对照：{comparedAxis.label} · {comparison.memberIds.map(member => comparedAxis.items.find(item => item.id === member)!.label).join(" / ")}</p>}
      {workspace && comparison && <section aria-label="两组对照" className="flex min-w-0 flex-wrap items-end gap-4">
        <MatrixSelect label="对照维度" value={comparison.axis} options={[{ id: "row", label: rowDimension.label }, { id: "column", label: columnDimension.label }]}
          disabled={!!comparison.disabledReason} onChange={request ? axis => { if (!comparison.disabledReason && (axis === "row" || axis === "column")) request({ ...target, type: "compare", axis, memberIds: [] }) } : undefined} />
        {([0, 1] as const).map(index => <MatrixSelect key={index} label={index === 0 ? "对照一" : "对照二"} value={comparison.memberIds[index] ?? ""}
          options={comparedAxis.items} emptyLabel="未选择" disabled={!!comparison.disabledReason} onChange={request ? memberId => {
            if (comparison.disabledReason) return
            const memberIds = [comparison.memberIds[0] ?? "", comparison.memberIds[1] ?? ""]
            memberIds[index] = memberId
            request({ ...target, type: "compare", axis: comparison.axis, memberIds })
          } : undefined} />)}
        {!!comparison.memberIds.length && request && <Button type="button" variant="outline" size="navigation" disabled={!!comparison.disabledReason}
          onClick={() => { if (!comparison.disabledReason) request({ ...target, type: "compare", axis: comparison.axis, memberIds: [] }) }}>取消比较</Button>}
      </section>}
      {comparisonInvalid && <p className="text-ui-hint">请选择两个不同且在当前范围内的对象进行比较；当前仍显示完整矩阵。</p>}
      {!!controlReasons.length && <p id={`${id}-controls`} className="text-ui-hint">{controlReasons.join(" ")}</p>}
      <p id={`${id}-cell-sample`} className={sharedCellFacts ? "text-ui-hint" : "sr-only"}>{sharedCellFacts ? `单元格共用口径：${sharedCellFacts}；不同处见数据提示。` : "单元格样本与分母见数据提示。"}</p>
      {showTable && <>
        {!!bands.length && <ul aria-label="颜色分级区间" className="flex flex-wrap gap-3">{bands.map(band => <li key={band.id} className="flex max-w-full flex-wrap items-center gap-2 text-ui-hint">
          <Badge variant={band.tone} className="h-auto whitespace-normal break-words py-1">{band.label}</Badge><span>{band.interval}</span>
        </li>)}</ul>}
        {!rows.length || !columns.length ? <p className="text-ui-hint">当前范围暂无矩阵数据。</p> : <>
          <p id={`${id}-keyboard`} className="text-ui-hint">方向键逐格移动，Home / End 移至行首或行尾，Enter / 空格查看可用依据；窄容器可横向滚动。</p>
          <Table className="min-w-max text-ui-body" aria-label={`${rowDimension.label} × ${columnDimension.label}分布数据表`}
            aria-describedby={`${id}-keyboard ${id}-cell-sample`} render={<div role="region" aria-label="分布矩阵滚动区域" tabIndex={0} />}>
            <TableHeader><TableRow>
              <TableHead scope="col" className="max-w-48 whitespace-normal break-words text-ui-action">{rowDimension.label} / {columnDimension.label}</TableHead>
              {columns.map((column, ci) => <TableHead key={column.id} scope="col" id={`${id}-column-${ci}`} className="max-w-48 whitespace-normal break-words text-ui-action">{column.content ?? column.label}</TableHead>)}
            </TableRow></TableHeader>
            <TableBody>{rows.map((row, ri) => <TableRow key={row.id}>
              <TableHead scope="row" id={`${id}-row-${ri}`} className="max-w-48 whitespace-normal break-words text-ui-action">{row.content ?? row.label}</TableHead>
              {columns.map((column, ci) => {
                const entry = visibleEntries[ri * columns.length + ci]
                const selected = sameCell(selectedCell, entry.ref)
                return <TableCell key={column.id} className="max-w-56 whitespace-normal align-top">
                  <Button type="button" variant={selected ? "secondary" : "ghost"} size="navigation" className="w-full justify-start whitespace-normal text-left"
                    ref={element => { const index = ri * columns.length + ci; if (element) buttons.current.set(index, element); else buttons.current.delete(index) }}
                    data-matrix-cell="" aria-labelledby={`${id}-row-${ri} ${id}-column-${ci} ${id}-value-${ri}-${ci}`}
                    aria-describedby={cellDescription(entry)} aria-pressed={selected} aria-disabled={!!entry.selectionReason}
                    tabIndex={entry === active ? 0 : -1} onFocus={() => setFocus({ signature, cell: entry.ref })}
                    onKeyDown={event => move(event, ri, ci)} onClick={event => choose(entry, event.currentTarget)}>
                    <CellReading entry={entry} id={`${id}-value-${ri}-${ci}`} />{selected && <Check aria-label="已选择" />}
                  </Button>
                </TableCell>
              })}
            </TableRow>)}</TableBody>
          </Table>
        </>}
      </>}
      {!!noteRows.length && <ul aria-label="数据提示" className="min-w-0 space-y-2 text-ui-hint">{noteRows.map(note => <li key={note.id} id={note.id}>
        <span>{note.members.length === entries.length ? "全部单元格" : note.members.map(entry => `${entry.row.label} · ${entry.column.label}`).join("；")}：</span>{note.text}
      </li>)}</ul>}
      {hasText(notice) && <p className="text-ui-hint text-muted-foreground">{notice}</p>}
      <RecordDetails>{details}</RecordDetails>
      {!workspace && onExpand && <div><Button type="button" variant="outline" size="navigation" onClick={event => onExpand(event.currentTarget)}>查看完整分布<ArrowUpRight aria-hidden="true" /></Button></div>}
    </>}
    {workspace && onBack && <div><Button type="button" variant="outline" size="navigation" onClick={onBack}><ArrowLeft aria-hidden="true" />返回原位置</Button></div>}
  </Card>
}
