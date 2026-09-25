"use client"

import { useId, type ReactNode } from "react"
import { Card } from "@/components/coss/card"
import { Checkbox } from "@/components/coss/checkbox"
import { Input } from "@/components/coss/input"
import { Label } from "@/components/coss/label"
import { Badge } from "./badge"
import { Button } from "./button"
import { DataRecordTable, FilterBar, type FilterField } from "./data-display"
import { RecordDetails, type AgentRecordViewProps } from "./agent-record-parts"

export type AgentCandidateAlternative = { candidateId: string; reason: string; disabledReason?: string }
export type AgentCandidateEntry = {
  id: string
  title: string
  type: string
  summary?: string
  /** Null means that the page has no basis/source to disclose. Never inferred from rank. */
  rationale: string | null
  source: string | null
  alternatives?: readonly AgentCandidateAlternative[]
} & ({ status: "available" | "in-collection" } | { status: "invalid" | "unknown"; reason: string })
export type AgentCandidateRestrictedEntry = {
  id: string
  status: "restricted"
  disclosure: { title: string; reason: string }
}
export type AgentCandidate = AgentCandidateEntry | AgentCandidateRestrictedEntry
export type AgentCandidateResult =
  | { state: "ready" }
  | { state: "loading"; message?: string }
  | { state: "empty" | "error"; message: string }
export type AgentCandidateSubmission =
  | { state: "idle" }
  | { state: "submitting" | "unconfirmed" | "submitted"; message?: string }
  | { state: "error"; message: string }
export type AgentCandidatePage = {
  total: number | null
  label?: string
  /** Presence declares a load-more capability; a null cursor is an explicit page value. */
  more?: { cursor: string | null; state: "ready" | "loading" | "error"; message?: string; disabledReason?: string }
}
export type AgentCandidateIntent = { candidateSetId: string; baseVersion: string } & (
  | { type: "select" | "deselect"; candidateIds: readonly string[]; scope: "item" | "visible" | "selection" }
  | { type: "query"; value: string }
  | { type: "filter"; value: Readonly<Record<string, string>> }
  | { type: "sort"; value: string }
  | { type: "load-more"; cursor: string | null }
  | { type: "replace"; candidateId: string; replacementId: string }
  | { type: "confirm"; candidateIds: readonly string[] }
)
export type AgentCandidatePickerProps = AgentRecordViewProps & {
  title: string
  candidateSet: { id: string; version: string }
  /** Exact displayed results, in page-supplied order, including the inline shortlist. */
  candidates: readonly AgentCandidate[]
  /** Current authorized facts for off-page selections and replacement references; never cached here. */
  relatedCandidates?: readonly AgentCandidate[]
  selectedIds: readonly string[]
  result: AgentCandidateResult
  page: AgentCandidatePage
  submission: AgentCandidateSubmission
  query?: { value: string; label?: string; disabledReason?: string }
  filters?: { fields: FilterField[]; value: Record<string, string>; disabledReason?: string }
  sort?: { label: string; options: FilterField["options"]; value: string; description?: string; disabledReason?: string }
  confirm?: { label?: string; disabledReason?: string }
  disabledReason?: string
  onIntent?: (intent: AgentCandidateIntent) => void
  onBack?: () => void
  renderItem?: (item: AgentCandidateEntry, context: { view: "inline" | "workspace"; density: "default" | "compact" }) => ReactNode
  notice?: string
}

const titleOf = (item: AgentCandidate) => (item.status === "restricted" ? item.disclosure.title : item.title) || "未命名候选"
const reasonOf = (item: AgentCandidate) => item.status === "restricted" ? item.disclosure.reason || "当前无权选择此候选。"
  : item.status === "invalid" ? item.reason || "此候选已失效。"
  : item.status === "unknown" ? item.reason || "可用状态未确认。"
  : item.status === "in-collection" ? "已在集合中，无需重复选择。"
  : item.status !== "available" ? "可用状态未确认。" : undefined
const statusLabels = { available: "可选", "in-collection": "已在集合中", invalid: "失效", restricted: "受限", unknown: "状态未知" }
const submissionLabels = { idle: "尚未提交", submitting: "提交中", unconfirmed: "回执未确认", submitted: "已提交", error: "提交失败" }

function CandidateFacts({ item, selected }: { item: AgentCandidate; selected: boolean }) {
  return <div className="min-w-0 space-y-1">
    <div className="flex flex-wrap gap-2">
      {item.status !== "restricted" && <Badge variant="outline">{item.type}</Badge>}
      <Badge variant={item.status === "available" ? "outline" : item.status === "in-collection" ? "info" : "warning"}>
        {item.status === "available" && selected ? "已选" : statusLabels[item.status] || "状态未知"}
      </Badge>
      {selected && item.status !== "available" && <Badge variant="outline">已选</Badge>}
    </div>
    {item.status !== "restricted" && <>
      {item.summary && <p className="whitespace-pre-wrap break-words text-ui-hint">{item.summary}</p>}
      <p className="whitespace-pre-wrap break-words text-ui-hint">选择依据：{item.rationale?.trim() ? item.rationale : "未提供"}</p>
      <p className="whitespace-pre-wrap break-words text-ui-hint text-muted-foreground">来源：{item.source?.trim() ? item.source : "未确认"}</p>
    </>}
    {reasonOf(item) && <p className="whitespace-pre-wrap break-words text-ui-hint">{reasonOf(item)}</p>}
  </div>
}

function CandidateRow({ item, selected, disabledReason, onToggle, children, content, compact }: {
  item: AgentCandidate; selected: boolean; disabledReason?: string; onToggle: (checked: boolean) => void
  children?: ReactNode; content?: ReactNode; compact: boolean
}) {
  const id = useId()
  return <div className={`min-w-0 ${compact ? "space-y-2 py-1" : "space-y-3 py-2"}`}>
    <Label htmlFor={`${id}-choice`} className="flex min-h-10 min-w-0 items-center gap-3 whitespace-normal pointer-coarse:min-h-11">
      <Checkbox id={`${id}-choice`} checked={selected} disabled={disabledReason !== undefined}
        aria-label={`选择：${titleOf(item)}`} aria-describedby={`${id}-facts${disabledReason !== undefined && disabledReason !== reasonOf(item) ? ` ${id}-disabled` : ""}`}
        onCheckedChange={checked => { if (disabledReason === undefined) onToggle(checked) }} />
      <span className="min-w-0 break-words text-item-title">{titleOf(item)}</span>
    </Label>
    <div id={`${id}-facts`}><CandidateFacts item={item} selected={selected} /></div>
    {disabledReason !== undefined && disabledReason !== reasonOf(item) && <p id={`${id}-disabled`} className="break-words text-ui-hint">{disabledReason}</p>}
    {content != null && <div className="min-w-0">{content}</div>}
    {children}
  </div>
}

function CandidateReplacement({ title, target, selected, rationale, reason, onReplace }: {
  title: string; target?: AgentCandidate; selected: boolean; rationale: string; reason?: string; onReplace: () => void
}) {
  const id = useId()
  return <li className="min-w-0 space-y-1">
    <p className="break-words text-item-title">替代项：{target ? titleOf(target) : "暂不可确认"}</p>
    {target && <CandidateFacts item={target} selected={selected} />}
    {target?.status !== "restricted" && <p className="break-words text-ui-hint">替代依据：{rationale || "未提供"}</p>}
    <Button type="button" variant="outline" size="navigation" className="max-w-full whitespace-normal" disabled={reason !== undefined}
      aria-label={`用${target ? titleOf(target) : "替代项"}替换${title}`} aria-describedby={reason !== undefined ? id : undefined}
      onClick={() => { if (reason === undefined) onReplace() }}>替换本次选择</Button>
    {reason !== undefined && <p id={id} className="break-words text-ui-hint">{reason || "当前不可替换。"}</p>}
  </li>
}

/** Keep opaque field/option identifiers out of primitive DOM values as well as visible labels. */
function CandidateFilters({ fields, value, onChange, reason }: {
  fields: FilterField[]; value: Record<string, string>; onChange?: (value: Record<string, string>) => void; reason?: string
}) {
  const id = useId()
  const localFields = fields.map((field, index) => {
    const current = field.options.findIndex(option => option.value === value[field.id])
    return { id: String(index), label: field.label, options: [
      ...(current < 0 ? [{ value: "", label: value[field.id] ? "当前选项未列出" : "未指定" }] : []),
      ...field.options.map((option, optionIndex) => ({ value: String(optionIndex), label: option.label })),
    ] }
  })
  const localValue = Object.fromEntries(fields.map((field, index) => {
    const selected = field.options.findIndex(option => option.value === value[field.id])
    return [String(index), selected < 0 ? "" : String(selected)]
  }))
  return <div className="min-w-0 space-y-1" role="group" aria-label={fields.map(field => field.label).join("、")} aria-describedby={reason !== undefined ? id : undefined}>
    {onChange && reason === undefined ? <FilterBar fields={localFields} value={localValue} onChange={next => {
      const changed = Object.entries(next).filter(([key, entry]) => entry !== localValue[key])
      if (changed.length !== 1) return
      const [key, entry] = changed[0], field = fields.find((_, index) => String(index) === key)
      const option = field?.options.find((_, index) => String(index) === entry)
      if (field && option) onChange({ ...value, [field.id]: option.value })
    }} /> : <dl className="space-y-1">{fields.map((field, index) => <div key={index} className="text-ui-body">
      <dt>{field.label}</dt><dd>{field.options.find(option => option.value === value[field.id])?.label ?? (value[field.id] ? "当前选项未列出" : "未指定")}</dd>
    </div>)}</dl>}
    {reason !== undefined && <p id={id} className="break-words text-ui-hint">{reason || "当前不可调整。"}</p>}
  </div>
}

export function AgentCandidatePicker({ title, candidateSet, candidates, relatedCandidates = [], selectedIds, result, page, submission,
  query, filters, sort, confirm, disabledReason, onIntent, onExpand, onBack, renderItem, notice, details,
  view = "inline", density = "default" }: AgentCandidatePickerProps) {
  const id = useId(), workspace = view === "workspace", compact = density === "compact"
  // Current result facts take precedence over retained facts, including access revocation.
  const records = new Map<string, AgentCandidate>(), counts = new Map<string, number>()
  for (const pool of [candidates, relatedCandidates]) {
    const poolCounts = new Map<string, number>()
    for (const item of pool) poolCounts.set(item.id, (poolCounts.get(item.id) ?? 0) + 1)
    for (const item of pool) if (!records.has(item.id)) { records.set(item.id, item); counts.set(item.id, poolCounts.get(item.id)!) }
  }
  const identityReason = (item?: AgentCandidate) => !item || !item.id.trim() || counts.get(item.id) !== 1 ? "候选信息未确认。" : undefined
  const channelReason = !candidateSet.id.trim() || !candidateSet.version.trim() ? "候选版本未确认。" : !onIntent ? "当前仅可查看候选。" : undefined
  const pendingReason = submission.state === "submitting" ? "正在提交，请等待结果。" : submission.state === "unconfirmed" ? "回执未确认，请先核对原提交。" : undefined
  const editReason = disabledReason !== undefined ? disabledReason || "当前不可修改选择。" : channelReason ?? pendingReason
  const resultReason = result.state === "loading" || result.state === "error" ? "请等待候选恢复后再选择或提交。" : undefined
  const selected = new Set(selectedIds)
  const invalidSelection = selected.size !== selectedIds.length ? "选择记录有重复，请取消后重新选择。"
    : selectedIds.some(value => identityReason(records.get(value)) || reasonOf(records.get(value)!)) ? "部分已选候选不可用，请取消或替换后再提交。" : undefined
  const choiceReason = (item: AgentCandidate) => editReason ?? (selected.has(item.id) ? undefined : resultReason ?? identityReason(item) ?? reasonOf(item))
  const confirmReason = editReason ?? confirm?.disabledReason ?? resultReason ?? invalidSelection
    ?? (submission.state === "submitted" ? "本次选择已提交。" : !selectedIds.length ? "请先选择候选。" : undefined)
  const envelope = { candidateSetId: candidateSet.id, baseVersion: candidateSet.version }
  const emit = (intent: AgentCandidateIntent) => { if (channelReason === undefined) onIntent?.(intent) }
  const toggle = (item: AgentCandidate, checked: boolean) => {
    if (choiceReason(item) !== undefined || checked === selected.has(item.id)) return
    emit({ ...envelope, type: checked ? "select" : "deselect", candidateIds: [item.id], scope: "item" })
  }
  const additions = candidates.filter(item => !selected.has(item.id) && !identityReason(item) && !reasonOf(item)).map(item => item.id)
  const visibleSelected = [...new Set(candidates.filter(item => selected.has(item.id)).map(item => item.id))]
  const batchReason = editReason ?? resultReason
  const moreReason = channelReason ?? page.more?.disabledReason ?? (page.more?.state === "loading" ? "正在加载更多…" : resultReason)
  const total = typeof page.total === "number" && Number.isInteger(page.total) && page.total >= 0 ? `总数 ${page.total} 项` : "总数未知"
  const message = result.state === "loading" ? result.message || "正在加载候选…" : result.state === "error" ? `加载失败：${result.message}` : result.state === "empty" ? result.message : undefined
  const replacementReason = (item: AgentCandidateEntry, alternative: AgentCandidateAlternative) => {
    const target = records.get(alternative.candidateId)
    return editReason ?? resultReason ?? alternative.disabledReason ?? identityReason(item)
      ?? (!selected.has(item.id) ? "请先选择原候选。" : item.status === "in-collection" ? "集合中的条目请到集合中调整。" : undefined)
      ?? (!alternative.reason.trim() ? "替代依据未提供。" : undefined)
      ?? identityReason(target) ?? (target ? reasonOf(target) : undefined)
      ?? (item.id === alternative.candidateId || selected.has(alternative.candidateId) ? "替代项已经选中。" : undefined)
  }
  const renderRow = (item: AgentCandidate) => <CandidateRow item={item} selected={selected.has(item.id)} compact={compact}
    disabledReason={choiceReason(item)} onToggle={checked => toggle(item, checked)}
    content={item.status !== "restricted" ? renderItem?.(item, { view, density }) : undefined}>
    {item.status !== "restricted" && !!item.alternatives?.length && <ul aria-label={`${titleOf(item)}的替代项`} className="space-y-3">
      {item.alternatives.map((alternative, index) => {
        const target = records.get(alternative.candidateId), reason = replacementReason(item, alternative)
        return <CandidateReplacement key={index} title={titleOf(item)} target={target} selected={selected.has(alternative.candidateId)} rationale={alternative.reason} reason={reason}
          onReplace={() => { if (reason === undefined) emit({ ...envelope, type: "replace", candidateId: item.id, replacementId: alternative.candidateId }) }} />
      })}
    </ul>}
  </CandidateRow>

  return <Card data-candidate-picker-view={view} data-candidate-picker-density={density} className={`min-w-0 ${compact ? "gap-3 p-3" : "gap-4 p-4"}`}>
    <header className="min-w-0 space-y-2"><h3 className="break-words text-block-title">{title}</h3>
      <p className="break-words text-ui-hint">{total}{page.label && ` · ${page.label}`}</p>
      <div role="status" className="space-y-1"><Badge variant={submission.state === "error" || submission.state === "unconfirmed" ? "warning" : "outline"}>{submissionLabels[submission.state]}</Badge>
        {submission.state !== "idle" && submission.message && <p className="break-words text-ui-hint">{submission.message}</p>}
      </div>
    </header>
    <section aria-label="本次选择" className="min-w-0 space-y-2">
      <p className="text-ui-body" aria-live="polite">本次已选 {selectedIds.length} 项</p>
      {!!selectedIds.length && <ul className="space-y-2">{[...selected].map((value, index) => {
        const item = records.get(value), reason = identityReason(item) ?? (item ? reasonOf(item) : undefined)
        return <li key={index} className="flex min-w-0 flex-wrap items-start gap-2">
          <div className="min-w-0 flex-1"><p className="break-words text-ui-body">{item ? titleOf(item) : "候选暂不可确认"}</p>
            {reason && <p className="break-words text-ui-hint">{reason}</p>}</div>
          <Button type="button" variant="ghost" size="navigation" aria-label={`取消选择：${item ? titleOf(item) : "暂不可确认的候选"}`} disabled={editReason !== undefined}
            aria-describedby={editReason !== undefined ? `${id}-edit` : undefined}
            onClick={() => { if (editReason === undefined) emit({ ...envelope, type: "deselect", candidateIds: [value], scope: "item" }) }}>取消选择</Button>
        </li>
      })}</ul>}
      {invalidSelection && <p role="status" className="text-ui-hint">{invalidSelection}</p>}
      {editReason !== undefined && <p id={`${id}-edit`} className="break-words text-ui-hint">{editReason}</p>}
    </section>
    {workspace && (query || filters || sort) && <section aria-label="检索与排序" className="min-w-0 space-y-3">
      {query && <div className="space-y-2"><Label htmlFor={`${id}-query`}>{query.label || "检索候选"}</Label>
        <Input id={`${id}-query`} value={query.value} readOnly={channelReason !== undefined || query.disabledReason !== undefined}
          aria-describedby={query.disabledReason !== undefined ? `${id}-query-reason` : undefined}
          onChange={event => { if (channelReason === undefined && query.disabledReason === undefined) emit({ ...envelope, type: "query", value: event.currentTarget.value }) }} />
        {query.disabledReason !== undefined && <p id={`${id}-query-reason`} className="text-ui-hint">{query.disabledReason || "当前不可检索。"}</p>}
      </div>}
      {filters && <CandidateFilters fields={filters.fields} value={filters.value} reason={channelReason ?? filters.disabledReason}
        onChange={value => emit({ ...envelope, type: "filter", value })} />}
      {sort && <div className="space-y-1"><CandidateFilters fields={[{ id: "sort", label: sort.label, options: sort.options }]} value={{ sort: sort.value }} reason={channelReason ?? sort.disabledReason}
        onChange={value => emit({ ...envelope, type: "sort", value: value.sort })} />
        {sort.description && <p className="break-words text-ui-hint">{sort.description}</p>}
      </div>}
    </section>}
    <section aria-label="候选结果" aria-busy={result.state === "loading"} className="min-w-0 space-y-3">
      {message && <p role={result.state === "error" ? "alert" : "status"} className="whitespace-pre-wrap break-words text-ui-hint">{message}</p>}
      {result.state === "ready" && <>
        <p className="text-ui-hint">当前显示 {candidates.length} 项</p>
        {workspace && <div className="space-y-1"><div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="navigation" disabled={batchReason !== undefined || !additions.length} aria-describedby={batchReason !== undefined ? `${id}-batch` : undefined}
            onClick={() => { if (batchReason === undefined && additions.length) emit({ ...envelope, type: "select", candidateIds: [...additions], scope: "visible" }) }}>选择当前可选项</Button>
          <Button type="button" variant="ghost" size="navigation" disabled={editReason !== undefined || !visibleSelected.length} aria-describedby={editReason !== undefined ? `${id}-edit` : undefined}
            onClick={() => { if (editReason === undefined && visibleSelected.length) emit({ ...envelope, type: "deselect", candidateIds: [...visibleSelected], scope: "visible" }) }}>取消当前结果选择</Button>
        </div>{batchReason !== undefined && <p id={`${id}-batch`} className="text-ui-hint">{batchReason}</p>}</div>}
        {workspace ? <div className="min-w-0 [&_table]:table-fixed [&_td]:whitespace-normal [&_th]:whitespace-normal">
          <DataRecordTable rows={candidates.map((item, index) => ({ id: String(index), item }))} columns={[{ id: "candidate", label: "候选与选择依据", render: row => renderRow(row.item) }]} empty="当前没有候选。" />
        </div> : candidates.length ? <ul className={compact ? "space-y-2" : "space-y-4"}>{candidates.map((item, index) => <li key={index}>{renderRow(item)}</li>)}</ul> : <p className="text-ui-hint">当前没有候选。</p>}
      </>}
      {page.more && <div className="space-y-1"><Button type="button" variant="outline" size="navigation" disabled={moreReason !== undefined}
        aria-describedby={moreReason !== undefined || page.more.message || page.more.state === "error" ? `${id}-more` : undefined}
        onClick={() => { if (moreReason === undefined && page.more) emit({ ...envelope, type: "load-more", cursor: page.more.cursor }) }}>{page.more.state === "error" ? "重试加载更多" : "加载更多"}</Button>
        {(moreReason !== undefined || page.more.message || page.more.state === "error") && <p id={`${id}-more`} role={page.more.state === "error" ? "alert" : "status"} className="break-words text-ui-hint">{page.more.message || moreReason || "加载更多失败。"}</p>}
      </div>}
    </section>
    <p className="text-ui-hint text-muted-foreground">{notice || "选择或提交不代表已加入集合。"}</p>
    <RecordDetails>{details}</RecordDetails>
    <footer className="space-y-2"><div className="flex flex-wrap gap-2">
      {confirm && <Button type="button" size="navigation" disabled={confirmReason !== undefined} aria-describedby={confirmReason !== undefined ? `${id}-confirm` : undefined}
        onClick={() => { if (confirmReason === undefined) emit({ ...envelope, type: "confirm", candidateIds: [...selectedIds] }) }}>{confirm.label || "提交本次选择"}</Button>}
      {!!selectedIds.length && <Button type="button" variant="ghost" size="navigation" disabled={editReason !== undefined} aria-describedby={editReason !== undefined ? `${id}-edit` : undefined}
        onClick={() => { if (editReason === undefined) emit({ ...envelope, type: "deselect", candidateIds: [...selectedIds], scope: "selection" }) }}>取消全部选择</Button>}
      {!workspace && onExpand && <Button type="button" size="navigation" variant="outline" onClick={event => onExpand(event.currentTarget)}>展开筛选与选择</Button>}
      {workspace && onBack && <Button type="button" size="navigation" variant="outline" onClick={onBack}>返回原位置</Button>}
    </div>{confirm && confirmReason !== undefined && <p id={`${id}-confirm`} className="break-words text-ui-hint">{confirmReason || "当前不可提交。"}</p>}</footer>
  </Card>
}
