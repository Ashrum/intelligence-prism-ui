"use client"

import { useId } from "react"
import { Card } from "@/components/coss/card"
import { Checkbox } from "@/components/coss/checkbox"
import { Combobox, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList, ComboboxPopup } from "@/components/coss/combobox"
import { Label } from "@/components/coss/label"
import { Badge } from "./badge"
import { Button } from "./button"
import { DataRecordTable, FilterBar, type FilterField } from "./data-display"
import { RecordDetails, type AgentRecordViewProps } from "./agent-record-parts"

export type AgentObjectRecommendation = { reason: string; source: string }
export type AgentObjectAvailableCandidate = {
  id: string
  name: string
  description?: string
  recent?: boolean
  recommendation?: AgentObjectRecommendation
} & ({ status: "available" } | { status: "archived" | "unavailable"; reason: string })
/** Only the host-approved disclosure is accepted for a restricted object. */
export type AgentObjectRestrictedCandidate = {
  id: string
  status: "restricted"
  disclosure: { name: string; reason: string }
}
export type AgentObjectCandidate = AgentObjectAvailableCandidate | AgentObjectRestrictedCandidate
export type AgentObjectSelection = { mode: "single" } | { mode: "multiple"; max?: number }
export type AgentObjectPickerQuery = { search: string; filters: Readonly<Record<string, string>> }
export type AgentObjectPickerResult =
  | { state: "ready" }
  | { state: "loading"; message?: string }
  | { state: "empty" | "error"; message: string }
export type AgentObjectPickerProps = AgentRecordViewProps & {
  title: string
  objectType: { id: string; label: string }
  selection: AgentObjectSelection
  candidates: readonly AgentObjectCandidate[]
  selectedIds: readonly string[]
  /** Current authorized facts for selections outside the supplied results; no internal cache. */
  selectedCandidates?: readonly AgentObjectCandidate[]
  onSelectionChange?: (ids: readonly string[]) => void
  searchValue: string
  onSearchChange?: (value: string) => void
  filters?: { fields: FilterField[]; value: Record<string, string>; onChange?: (value: Record<string, string>) => void }
  /** Omission means host results. Local matching requires this explicit declaration. */
  filtering?: { mode: "host" } | { mode: "local"; matches: (candidate: AgentObjectCandidate, query: AgentObjectPickerQuery) => boolean }
  result: AgentObjectPickerResult
  inlineLimit?: number
  loadMore?: { onLoad: () => void; loading?: boolean; disabledReason?: string }
  onConfirm?: (ids: readonly string[]) => void
  confirmDisabledReason?: string
  disabledReason?: string
  onBack?: () => void
  notice?: string
}

const nameOf = (item: AgentObjectCandidate) => (item.status === "restricted" ? item.disclosure.name : item.name) || "未命名对象"
const recommendationOf = (item: AgentObjectCandidate) => item.status !== "restricted" && item.recommendation?.source?.trim() && item.recommendation.reason?.trim() ? item.recommendation : undefined
const statusLabels = { available: "可选", archived: "已归档", restricted: "无权限", unavailable: "不可用" }
const unavailableReason = (item: AgentObjectCandidate) => item.status === "restricted" ? item.disclosure.reason || "当前无权选择此对象。"
  : item.status === "archived" || item.status === "unavailable" ? item.reason || "当前不可选择此对象。"
  : item.status !== "available" ? "状态未确认，暂不可选。" : undefined

// Restricted payloads are projected before even a host-approved local matcher is called.
function disclosed(item: AgentObjectCandidate): AgentObjectCandidate {
  return item.status === "restricted" ? { id: item.id, status: "restricted", disclosure: { name: item.disclosure.name, reason: item.disclosure.reason } } : item
}

function PickerFacts({ item }: { item: AgentObjectCandidate }) {
  const recommendation = recommendationOf(item)
  return <>
    <Badge variant={item.status === "available" ? "outline" : "warning"}>{statusLabels[item.status] || "状态未确认"}</Badge>
    {item.status !== "restricted" && <>
      {item.description && <p className="whitespace-pre-wrap break-words text-ui-hint text-muted-foreground">{item.description}</p>}
      {item.recent && <p className="text-ui-hint text-muted-foreground">最近使用</p>}
      {recommendation ? <div className="space-y-1"><Badge variant="info">推荐</Badge><p className="break-words text-ui-hint">依据：{recommendation.reason}；来源：{recommendation.source}</p></div>
        : item.recommendation && <p className="text-ui-hint">推荐依据未提供，暂不标为推荐。</p>}
    </>}
  </>
}

function PickerOption({ item, selected, multiple, reason, compact, onChoose }: {
  item: AgentObjectCandidate; selected: boolean; multiple: boolean; reason?: string; compact: boolean; onChoose: (checked: boolean) => void
}) {
  const id = useId()
  return <div className={`flex min-w-0 items-start gap-3 ${compact ? "py-1" : "py-2"}`}>
    <div className="min-w-0 flex-1 space-y-1">
      <Label id={`${id}-name`} htmlFor={`${id}-choice`} className="min-h-10 whitespace-normal break-words">{nameOf(item)}</Label>
      <PickerFacts item={item} />
      {reason && <p id={`${id}-reason`} className="whitespace-pre-wrap break-words text-ui-hint">{reason}</p>}
    </div>
    <div className="flex min-h-10 shrink-0 items-center">
      {multiple ? <Checkbox id={`${id}-choice`} checked={selected} disabled={!!reason}
        aria-labelledby={`${id}-name`} aria-describedby={reason ? `${id}-reason` : undefined}
        onCheckedChange={checked => { if (!reason) onChoose(checked) }} />
        : <Button id={`${id}-choice`} type="button" size="navigation" variant="outline" aria-label={`选择：${nameOf(item)}`}
          aria-pressed={selected} disabled={!!reason} aria-describedby={reason ? `${id}-reason` : undefined}
          onClick={() => { if (!reason) onChoose(true) }}>{selected ? "已选" : "选择"}</Button>}
    </div>
  </div>
}

export function AgentObjectPicker({ title, objectType, selection, candidates, selectedIds, selectedCandidates = [], onSelectionChange,
  searchValue, onSearchChange, filters, filtering, result, view = "inline", density = "default", inlineLimit = 3,
  loadMore, onConfirm, confirmDisabledReason, disabledReason, onExpand, onBack, notice, details }: AgentObjectPickerProps) {
  const id = useId(), workspace = view === "workspace", compact = density === "compact", multiple = selection.mode === "multiple"
  const max = selection.mode === "multiple" ? selection.max : 1
  const invalidMax = max !== undefined && (!Number.isInteger(max) || max < 0)
  const rows = candidates.map(disclosed)
  const query = { search: searchValue, filters: filters?.value ?? {} }
  const results = result.state === "ready" ? filtering?.mode === "local" ? rows.filter(item => filtering.matches(item, query)) : rows : []
  const limit = Number.isFinite(inlineLimit) ? Math.max(1, Math.floor(inlineLimit)) : 3
  const quickIds = new Set(results.filter(item => recommendationOf(item) || item.status !== "restricted" && item.recent).slice(0, limit).map(item => item.id))
  const visible = workspace || !onExpand ? results : results.filter(item => quickIds.has(item.id) || selectedIds.includes(item.id) || unavailableReason(item))
  // Candidate-page facts win over an older selected summary, including revocation.
  const selected = selectedIds.map(selectedId => rows.find(item => item.id === selectedId) ?? selectedCandidates.find(item => item.id === selectedId))
  const ambiguousIds = new Set(rows.filter((item, index) => rows.findIndex(other => other.id === item.id) !== index).map(item => item.id))
  const selectionProblem = new Set(selectedIds).size !== selectedIds.length ? "选择记录有重复，请移除后重新选择。"
    : !multiple && selectedIds.length > 1 ? "当前只可选择一个对象，请重新选择。"
    : invalidMax ? "选择上限未确认，暂不可新增或确认。"
    : max !== undefined && selectedIds.length > max ? `已超过 ${max} 项上限，请先减少选择。`
    : selected.some(item => !item || !item.id.trim() || ambiguousIds.has(item.id) || unavailableReason(item)) ? "部分已选对象暂不可用，请移除后重新选择。" : undefined
  const baseReason = disabledReason || (!objectType.id.trim() ? "对象类型未确认。" : !onSelectionChange ? "当前仅可查看选择。" : undefined)
  const addReason = (item: AgentObjectCandidate) => unavailableReason(item) || baseReason
    || (!item.id.trim() || ambiguousIds.has(item.id) ? "对象信息未确认，暂不可选。" : undefined)
    || (result.state !== "ready" ? "候选尚不可用。" : undefined)
    || (invalidMax ? "选择上限未确认。" : multiple && !selectedIds.includes(item.id) && max !== undefined && selectedIds.length >= max ? `最多选择 ${max} 项，请先取消其他选择。` : undefined)
  const choose = (item: AgentObjectCandidate, checked: boolean) => {
    if (addReason(item)) return
    if (!checked && multiple) { onSelectionChange?.(selectedIds.filter(value => value !== item.id)); return }
    if (selectedIds.includes(item.id) && (multiple || selectedIds.length === 1)) return
    onSelectionChange?.(multiple ? [...selectedIds, item.id] : [item.id])
  }
  const remove = (selectedId: string) => { if (!baseReason) onSelectionChange?.(selectedIds.filter(value => value !== selectedId)) }
  const selectable = visible.filter(item => !unavailableReason(item) && item.id.trim() && !ambiguousIds.has(item.id))
  const additions = selectable.filter(item => !selectedIds.includes(item.id))
  const batchReason = baseReason || (invalidMax ? "选择上限未确认。" : max !== undefined && selectedIds.length + additions.length > max ? "本页可选对象超过剩余名额，请逐项选择。" : undefined)
  const confirmReason = disabledReason || confirmDisabledReason || (!objectType.id.trim() ? "对象类型未确认。" : undefined)
    || (result.state === "loading" || result.state === "error" ? "请等待候选恢复后再确认。" : undefined)
    || selectionProblem || (!selectedIds.length ? "请先选择对象。" : undefined)
  const message = result.state === "loading" ? result.message || "正在加载候选…" : result.state === "error" ? `加载失败：${result.message || "候选暂不可用。"}`
    : result.state === "empty" ? result.message || "当前没有候选对象。" : undefined
  const renderOption = (item: AgentObjectCandidate) => <PickerOption item={item} selected={selectedIds.includes(item.id)} multiple={multiple}
    reason={addReason(item)} compact={compact} onChoose={checked => choose(item, checked)} />
  const moreReason = loadMore?.disabledReason || (loadMore?.loading ? "正在加载更多…" : result.state === "loading" || result.state === "error" ? "候选尚不可用。" : undefined)

  return <Card data-object-picker-view={view} data-object-picker-density={density} className={`min-w-0 ${compact ? "gap-3 p-3" : "gap-4 p-4"}`}>
    <header className="min-w-0 space-y-1"><h3 className="break-words text-block-title">{title}</h3>
      <p className="text-ui-hint">{objectType.label} · {multiple ? max === undefined ? "可多选" : invalidMax ? "选择上限未确认" : `最多选择 ${max} 项` : "单选"}</p>
    </header>
    <section aria-label="已选对象" className="min-w-0 space-y-2">
      <p className="text-ui-body" aria-live="polite">已选 {selectedIds.length} 项{!selectedIds.length && " · 尚未选择"}</p>
      {selectedIds.length > 0 && <ul className="space-y-2">{selectedIds.map((selectedId, index) => {
        const item = selected[index], reason = item ? unavailableReason(item) : "当前未提供可核对的信息。"
        return <li key={index} className="flex min-w-0 flex-wrap items-start gap-2">
          <div className="min-w-0 flex-1"><p className="break-words text-ui-body">{item ? nameOf(item) : "对象暂不可确认"}</p>
            {reason && <p className="break-words text-ui-hint">{item ? `${statusLabels[item.status] || "状态未确认"} · ` : ""}{reason}</p>}</div>
          {onSelectionChange && <Button type="button" variant="ghost" size="sm" aria-label={`移除选择：${item ? nameOf(item) : "暂不可确认的对象"}`}
            disabled={!!baseReason} aria-describedby={baseReason ? `${id}-disabled` : undefined} onClick={() => remove(selectedId)}>移除</Button>}
        </li>
      })}</ul>}
      {selectionProblem && <p role="status" className="text-ui-hint">{selectionProblem}</p>}
      {baseReason && <p id={`${id}-disabled`} className="text-ui-hint">{baseReason}</p>}
    </section>
    {workspace && <section aria-label="搜索与筛选" className="min-w-0 space-y-3">
      <div className="space-y-2"><Label htmlFor={`${id}-search`}>搜索{objectType.label}</Label>
        <Combobox items={results.map((_, index) => String(index))} value={null} inputValue={searchValue} filter={null}
          itemToStringLabel={value => results[Number(value)] ? nameOf(results[Number(value)]) : ""}
          onInputValueChange={(value, event) => { if (event.reason === "input-change") onSearchChange?.(value) }}
          onValueChange={value => { const item = value === null ? undefined : results[Number(value)]; if (item) choose(item, true) }}>
          <ComboboxInput id={`${id}-search`} readOnly={!onSearchChange} placeholder={`输入${objectType.label}名称`}
            triggerProps={{ "aria-label": `查看${objectType.label}候选` }} aria-describedby={!onSearchChange ? `${id}-search-reason` : undefined} />
          <ComboboxPopup><ComboboxEmpty>{message || "没有匹配的候选。"}</ComboboxEmpty><ComboboxList>{(value: string) => {
            const item = results[Number(value)], reason = addReason(item)
            return <ComboboxItem key={value} value={value} disabled={!!reason}>
              <div className="space-y-1"><p className="text-ui-body">{nameOf(item)}{selectedIds.includes(item.id) && " · 已选"}</p>
                <PickerFacts item={item} />{reason && <p className="text-ui-hint">{reason}</p>}</div>
            </ComboboxItem>
          }}</ComboboxList></ComboboxPopup>
        </Combobox>
        {!onSearchChange && <p id={`${id}-search-reason`} className="text-ui-hint">搜索暂不可用。</p>}
      </div>
      {filters && (filters.onChange ? <FilterBar fields={filters.fields} value={filters.value} onChange={value => filters.onChange?.(value)} />
        : <dl className="space-y-1">{filters.fields.map(field => <div key={field.id} className="text-ui-body"><dt>{field.label}</dt><dd>{field.options.find(option => option.value === filters.value[field.id])?.label || "未指定"}</dd></div>)}</dl>)}
    </section>}
    <section aria-label="候选对象" aria-busy={result.state === "loading"} className="min-w-0 space-y-3">
      {message && <p role={result.state === "error" ? "alert" : "status"} className="whitespace-pre-wrap break-words text-ui-hint">{message}</p>}
      {workspace && multiple && result.state === "ready" && <div className="space-y-1">
        <div className="flex flex-wrap gap-2"><Button type="button" size="navigation" variant="outline" disabled={!!batchReason || !additions.length}
          aria-describedby={batchReason ? `${id}-batch` : undefined} onClick={() => { if (!batchReason && additions.length) onSelectionChange?.([...selectedIds, ...additions.map(item => item.id)]) }}>选择本页可选对象</Button>
          <Button type="button" size="navigation" variant="ghost" disabled={!!baseReason || !visible.some(item => selectedIds.includes(item.id))}
            aria-describedby={baseReason ? `${id}-disabled` : undefined} onClick={() => {
              if (!baseReason && visible.some(item => selectedIds.includes(item.id))) onSelectionChange?.(selectedIds.filter(value => !visible.some(item => item.id === value)))
            }}>取消本页选择</Button></div>
        {batchReason && <p id={`${id}-batch`} className="text-ui-hint">{batchReason}</p>}
      </div>}
      {result.state === "ready" && (workspace ? <div className="min-w-0 [&_table]:table-fixed [&_td]:whitespace-normal [&_th]:whitespace-normal">
        <DataRecordTable rows={visible} columns={[{ id: "object", label: `${objectType.label}与可用情况`, render: renderOption }]} empty="当前没有候选对象。" />
      </div> : visible.length ? <ul className={compact ? "space-y-1" : "space-y-3"}>{visible.map((item, index) => <li key={index}>{renderOption(item)}</li>)}</ul>
        : <p className="text-ui-hint">{results.length ? "暂无快捷候选，可打开更多选择。" : "当前没有候选对象。"}</p>)}
      {workspace && loadMore && <div className="space-y-1"><Button type="button" size="navigation" variant="outline" disabled={!!moreReason}
        aria-describedby={moreReason ? `${id}-more` : undefined} onClick={() => { if (!moreReason) loadMore.onLoad() }}>加载更多</Button>
        {moreReason && <p id={`${id}-more`} className="text-ui-hint">{moreReason}</p>}</div>}
    </section>
    <p className="text-ui-hint text-muted-foreground">{notice || "选择对象不会授予访问权限。"}</p>
    <RecordDetails>{details}</RecordDetails>
    <footer className="space-y-2"><div className="flex flex-wrap gap-2">
      {onConfirm && <Button type="button" size="navigation" disabled={!!confirmReason} aria-describedby={confirmReason ? `${id}-confirm` : undefined}
        onClick={() => { if (!confirmReason) onConfirm([...selectedIds]) }}>确认选择</Button>}
      {!workspace && onExpand && <Button type="button" size="navigation" variant="outline" onClick={event => onExpand(event.currentTarget)}>更多选择</Button>}
      {workspace && onBack && <Button type="button" size="navigation" variant="ghost" onClick={onBack}>返回原位置</Button>}
    </div>{onConfirm && confirmReason && <p id={`${id}-confirm`} className="text-ui-hint">{confirmReason}</p>}</footer>
  </Card>
}
