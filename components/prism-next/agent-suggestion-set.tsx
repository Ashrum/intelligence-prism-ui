"use client"

import { useId, type ReactNode } from "react"
import { Card } from "@/components/coss/card"
import { Checkbox } from "@/components/coss/checkbox"
import { Input } from "@/components/coss/input"
import { Label } from "@/components/coss/label"
import { Textarea } from "@/components/coss/textarea"
import { NumberField, NumberFieldGroup, NumberFieldInput, NumberFieldDecrement, NumberFieldIncrement } from "@/components/coss/number-field"
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from "@/components/coss/select"
import { Badge } from "./badge"
import { Button } from "./button"
import { RecordDetails, type AgentRecordViewProps } from "./agent-record-parts"

export type AgentSuggestionAction = { disabledReason?: string }
export type AgentSuggestionEvidence = {
  summary: string | null
  /** Existing evidence conclusion and version; never a generated link or reading record. */
  target?: { conclusionId: string; version: string }
  unavailableReason?: string
}
export type AgentSuggestionStatus =
  | { state: "pending" | "adopted" | "adjusted" }
  | { state: "dismissed"; reason?: string }
  | { state: "expired" | "unconfirmed"; reason: string }
export type AgentSuggestionTask = { state: "not-created" | "created" | "unconfirmed"; description?: string }
export type AgentSuggestionFieldValue = string | number | null
export type AgentSuggestionField = {
  id: string
  label: string
  description?: string
  disabledReason?: string
  error?: string
} & (
  | { type: "text" | "textarea"; value: string }
  | { type: "number"; value: number | null; unit?: string; step?: number }
  | { type: "select"; value: string | null; options: readonly { value: string; label: string; disabledReason?: string }[] }
)
export type AgentSuggestionEntry = {
  id: string
  title: string
  content: ReactNode
  reason: string | null
  evidence: AgentSuggestionEvidence | null
  source: string | null
  scope: string | null
  impact: string | null
  certainty: string | null
  status: AgentSuggestionStatus
  /** Task creation is a separate page fact; omission means unconfirmed. */
  task?: AgentSuggestionTask
  disabledReason?: string
  adopt?: AgentSuggestionAction
  adjustment?: AgentSuggestionAction & { open: boolean; fields: readonly AgentSuggestionField[]; message?: string }
  dismiss?: AgentSuggestionAction & { reason?: string }
}
export type AgentSuggestionRestrictedEntry = { id: string; status: { state: "restricted" }; disclosure: { title: string; reason: string } }
export type AgentSuggestion = AgentSuggestionEntry | AgentSuggestionRestrictedEntry
export type AgentSuggestionReceipt = { state: "idle" | "pending" | "received" | "unconfirmed" | "failed"; message?: string }
export type AgentSuggestionIntent = { suggestionSetId: string; baseVersion: string } & (
  | { type: "select" | "deselect"; suggestionIds: readonly string[]; scope: "item" | "visible" | "selection" }
  | { type: "adopt"; suggestionIds: readonly string[]; scope: "item" | "selection" }
  | { type: "adjust"; suggestionId: string; phase: "start" | "change" | "submit" | "cancel"; values: Readonly<Record<string, AgentSuggestionFieldValue>> }
  | { type: "dismiss"; suggestionId: string; phase: "reason" | "submit"; reason?: string }
  | { type: "compare"; phase: "select" | "show" | "close"; suggestionIds: readonly string[] }
  | { type: "open-evidence"; suggestionIds: readonly string[]; target: { conclusionId: string; version: string } }
  | { type: "confirm"; suggestionIds: readonly string[] }
)
export type AgentSuggestionSetProps = AgentRecordViewProps & {
  title: string
  suggestionSet: { id: string; version: string; versionLabel?: string; snapshot?: boolean }
  /** Exact page-provided shortlist/full list; no truncation, ranking or recommendation engine. */
  suggestions: readonly AgentSuggestion[]
  selectedIds: readonly string[]
  receipt: AgentSuggestionReceipt
  comparison?: AgentSuggestionAction & { selectedIds: readonly string[]; open: boolean }
  /** Presence declares the batch adoption / selection-confirmation capability. */
  adopt?: AgentSuggestionAction
  confirm?: AgentSuggestionAction
  disabledReason?: string
  onIntent?: (intent: AgentSuggestionIntent) => void
  onBack?: () => void
  notice?: string
}

const restricted = (item: AgentSuggestion): item is AgentSuggestionRestrictedEntry => item.status.state === "restricted"
const titleOf = (item: AgentSuggestion) => (restricted(item) ? item.disclosure.title : item.title) || "未命名建议"
const textOr = (value: string | null | undefined, fallback: string) => value?.trim() ? value : fallback
const statusLabels = { pending: "待定", adopted: "已采纳", adjusted: "已调整", dismissed: "已驳回", expired: "已过期", restricted: "受限", unconfirmed: "未确认" }
const taskLabels = { "not-created": "任务未创建", created: "任务已创建", unconfirmed: "任务状态未确认" }
const receiptLabels = { idle: "", pending: "等待回执", received: "已收到回执", unconfirmed: "回执未确认", failed: "操作失败" }
const fieldsIdentified = (fields: readonly AgentSuggestionField[]) => fields.length > 0 && fields.every(field => !!field.id.trim()) && new Set(fields.map(field => field.id)).size === fields.length
const fieldValues = (fields: readonly AgentSuggestionField[]) => Object.fromEntries(fields.map(field => [field.id, field.value]))

type SharedFact = { kind: "evidence" | "source"; key: string; indexes: number[]; label: string; anchor: string }
const evidenceKey = (value: AgentSuggestionEvidence | null) => JSON.stringify([value?.summary ?? null, value?.target?.conclusionId ?? null, value?.target?.version ?? null, value?.unavailableReason ?? null])
/** Exact fact equality only. Different evidence targets, versions or availability never merge. */
function sharedFacts(items: readonly AgentSuggestion[], id: string): SharedFact[] {
  return (["evidence", "source"] as const).flatMap(kind => {
    const groups = new Map<string, number[]>()
    items.forEach((item, index) => {
      if (restricted(item)) return
      const key = kind === "evidence" ? evidenceKey(item.evidence) : JSON.stringify(item.source)
      groups.set(key, [...(groups.get(key) ?? []), index])
    })
    return [...groups].filter(([, indexes]) => indexes.length > 1).map(([key, indexes], index) => ({
      kind, key, indexes, label: `${kind === "evidence" ? "依据" : "来源"} ${index + 1}`, anchor: `${id}-${kind}-${index}`,
    }))
  })
}

function SuggestionButton({ children, label, reason, reasonId, onClick, primary = false }: {
  children: ReactNode; label?: string; reason?: string; reasonId?: string; onClick: () => void; primary?: boolean
}) {
  const id = useId()
  return <div className="min-w-0 space-y-1">
    <Button type="button" size="navigation" variant={primary ? "default" : "outline"} className="max-w-full whitespace-normal"
      aria-label={label} disabled={reason !== undefined} aria-describedby={reason !== undefined ? reasonId ?? id : undefined}
      onClick={() => { if (reason === undefined) onClick() }}>{children}</Button>
    {reason !== undefined && !reasonId && <p id={id} className="break-words text-ui-hint">{reason || "当前不可操作。"}</p>}
  </div>
}

function SuggestionEvidence({ evidence, onOpen }: { evidence: AgentSuggestionEvidence | null; onOpen?: () => void }) {
  return <div className="min-w-0 space-y-1">
    <p className="whitespace-pre-wrap break-words text-ui-hint">{textOr(evidence?.summary, "依据未提供")}</p>
    {evidence?.unavailableReason !== undefined && <p className="break-words text-ui-hint">{evidence.unavailableReason || "依据暂不可查看。"}</p>}
    {onOpen && <Button type="button" size="navigation" variant="ghost" onClick={onOpen}>查看依据</Button>}
  </div>
}

function SuggestionField({ field, readOnly, onChange }: { field: AgentSuggestionField; readOnly: boolean; onChange: (value: AgentSuggestionFieldValue) => void }) {
  const id = useId(), blocked = readOnly || field.disabledReason !== undefined
  const choose = (value: AgentSuggestionFieldValue) => { if (!blocked) onChange(value) }
  const props = { id, "aria-labelledby": `${id}-label`, "aria-describedby": `${id}-facts`, "aria-invalid": field.error !== undefined || undefined }
  const valueText = field.type === "select" ? field.options.find(option => option.value === field.value)?.label ?? (field.value === null ? "未指定" : "当前选项未列出") : field.value ?? "未指定"
  return <div className="min-w-0 space-y-2">
    <Label id={`${id}-label`} htmlFor={blocked ? undefined : id} className="whitespace-normal break-words">{field.label}{field.type === "number" && field.unit ? `（${field.unit}）` : ""}</Label>
    {blocked ? <p className="whitespace-pre-wrap break-words text-ui-body">{valueText}</p>
      : field.type === "text" ? <Input {...props} value={field.value} onChange={event => choose(event.currentTarget.value)} />
      : field.type === "textarea" ? <Textarea {...props} value={field.value} onChange={event => choose(event.currentTarget.value)} />
      : field.type === "number" ? <NumberField id={id} value={field.value} step={field.step} onValueChange={value => { if (value === null || Number.isFinite(value)) choose(value) }}>
        <NumberFieldGroup><NumberFieldDecrement aria-label={`减少${field.label}`} /><NumberFieldInput aria-labelledby={props["aria-labelledby"]} aria-describedby={props["aria-describedby"]} aria-invalid={props["aria-invalid"]} /><NumberFieldIncrement aria-label={`增加${field.label}`} /></NumberFieldGroup>
      </NumberField> : field.type === "select" ? <Select value={field.options.some(option => option.value === field.value) ? String(field.options.findIndex(option => option.value === field.value)) : null}
        items={field.options.map((option, index) => ({ value: String(index), label: option.label }))}
        onValueChange={value => { const option = field.options.find((_, index) => String(index) === value); if (option && option.disabledReason === undefined) choose(option.value) }}>
        <SelectTrigger {...props} className="w-full min-w-0"><SelectValue className="whitespace-normal break-words">{valueText}</SelectValue></SelectTrigger>
        <SelectPopup>{field.options.map((option, index) => <SelectItem key={index} value={String(index)} disabled={option.disabledReason !== undefined}>{option.label}</SelectItem>)}</SelectPopup>
      </Select> : null}
    <div id={`${id}-facts`} className="space-y-1 text-ui-hint">
      {field.description && <p className="break-words">{field.description}</p>}
      {field.error !== undefined && <p role="alert" className="break-words">{field.error || "字段校验未通过。"}</p>}
      {field.disabledReason !== undefined && <p className="break-words">{field.disabledReason || "此字段只读。"}</p>}
      {field.type === "select" && field.options.filter(option => option.disabledReason !== undefined).map((option, index) => <p key={index} className="break-words">{option.label}：{option.disabledReason || "当前不可选择。"}</p>)}
    </div>
  </div>
}

/** Semantic 22: controlled action proposals. Selection, adoption and task creation are independent. */
export function AgentSuggestionSet({ title, suggestionSet, suggestions, selectedIds, receipt, comparison, adopt, confirm, disabledReason, onIntent, onExpand, onBack,
  notice, details, view = "inline", density = "default" }: AgentSuggestionSetProps) {
  const id = useId(), workspace = view === "workspace", compact = density === "compact"
  const selected = new Set(selectedIds), records = new Map(suggestions.map(item => [item.id, item]))
  const identityReason = !suggestionSet.id.trim() || !suggestionSet.version.trim() || suggestions.some(item => !item.id.trim()) || records.size !== suggestions.length ? "建议或版本信息未确认。" : undefined
  const channelReason = identityReason ?? (!onIntent ? "当前仅可查看建议。" : undefined)
  const editReason = channelReason ?? (suggestionSet.snapshot ? "历史建议只读。" : undefined) ?? disabledReason
    ?? (receipt.state === "pending" || receipt.state === "unconfirmed" ? "请先核对原请求，结果未确认前不能重复操作。" : undefined)
  const envelope = { suggestionSetId: suggestionSet.id, baseVersion: suggestionSet.version }
  const emit = (intent: AgentSuggestionIntent) => { if (channelReason === undefined) onIntent?.(intent) }
  const itemReason = (item: AgentSuggestion): string | undefined => restricted(item) ? item.disclosure.reason || "当前建议受限。"
    : item.disabledReason ?? (item.status.state === "expired" || item.status.state === "unconfirmed" ? item.status.reason || "建议状态未确认。" : undefined)
  const choiceReason = (item: AgentSuggestion) => editReason ?? (selected.has(item.id) ? undefined : itemReason(item))
  const adoptReason = (item: AgentSuggestion) => editReason ?? itemReason(item)
    ?? (restricted(item) || !item.adopt ? "未提供采纳能力。" : item.adopt.disabledReason)
    ?? (item.status.state === "adopted" ? "此建议已采纳。" : item.status.state === "dismissed" ? "此建议已驳回。" : undefined)
  const selectionReason = !selectedIds.length ? "请先选择建议。" : selected.size !== selectedIds.length || selectedIds.some(value => !records.has(value)) ? "部分选择未能匹配当前建议，请取消后重新选择。" : undefined
  // Never silently drop an ineligible selected member from a batch adoption.
  const batchAdoptReason = editReason ?? adopt?.disabledReason ?? selectionReason
    ?? (selectedIds.some(value => { const item = records.get(value); return !item || adoptReason(item) !== undefined }) ? "部分已选建议不可采纳，请调整选择。" : undefined)
  const confirmReason = editReason ?? confirm?.disabledReason ?? selectionReason
    ?? (selectedIds.some(value => { const item = records.get(value); return !item || itemReason(item) !== undefined }) ? "部分已选建议已过期、受限或未确认。" : undefined)
  const additions = suggestions.filter(item => !selected.has(item.id) && choiceReason(item) === undefined).map(item => item.id)
  const compareIds = comparison?.selectedIds ?? []
  const compareReason = channelReason ?? comparison?.disabledReason
  const compareInvalid = compareIds.length < 2 || new Set(compareIds).size !== compareIds.length || compareIds.some(value => !records.has(value) || restricted(records.get(value)!))
  const facts = sharedFacts(suggestions, id)
  const openEvidence = (evidence: AgentSuggestionEvidence | null, indexes: number[]) => {
    const target = evidence?.target
    return channelReason === undefined && evidence?.unavailableReason === undefined && target?.conclusionId.trim() && target.version.trim()
      ? () => emit({ ...envelope, type: "open-evidence", suggestionIds: indexes.map(index => suggestions[index].id), target: { ...target } }) : undefined
  }
  const compareSelection = (item: AgentSuggestion, checked: boolean) => {
    if (compareReason !== undefined || restricted(item) || checked === compareIds.includes(item.id)) return
    emit({ ...envelope, type: "compare", phase: "select", suggestionIds: checked ? [...compareIds, item.id] : compareIds.filter(value => value !== item.id) })
  }

  const globalReasonId = (reason: string | undefined) => reason !== undefined && reason === editReason ? `${id}-edit`
    : reason !== undefined && workspace && comparison && reason === compareReason ? `${id}-compare-reason` : undefined

  const renderItem = (item: AgentSuggestion, index: number) => {
    const anchor = `${id}-item-${index}`, itemTitle = titleOf(item), shared = facts.filter(fact => fact.indexes.includes(index))
    const choice = choiceReason(item), status = item.status.state
    const block = editReason ?? itemReason(item)
    const adjustment = !restricted(item) ? item.adjustment : undefined
    const adjustBlock = block ?? adjustment?.disabledReason ?? (adjustment && !fieldsIdentified(adjustment.fields) ? "可调整字段未确认。" : undefined)
    const submitAdjustBlock = adjustBlock ?? (adjustment?.fields.some(field => field.error !== undefined) ? "请先修正标出的字段。" : undefined)
    const adjust = (phase: "start" | "change" | "submit" | "cancel", values = fieldValues(adjustment?.fields ?? [])) => {
      if (!adjustment || (phase === "submit" ? submitAdjustBlock : adjustBlock) !== undefined) return
      emit({ ...envelope, type: "adjust", suggestionId: item.id, phase, values: { ...values } })
    }
    const dismissBlock = block ?? (!restricted(item) ? item.dismiss?.disabledReason : undefined) ?? (status === "dismissed" ? "此建议已驳回。" : undefined)
    const itemFactReason = itemReason(item) ?? (!restricted(item) && item.status.state === "dismissed" ? item.status.reason : undefined)
    const actionReasons = [...new Set([
      ...(!restricted(item) && item.adopt ? [adoptReason(item)] : []),
      ...(workspace && adjustment ? adjustment.open ? [submitAdjustBlock, adjustBlock] : [adjustBlock] : []),
      ...(!restricted(item) && item.dismiss ? [dismissBlock] : []),
    ].filter((reason): reason is string => reason !== undefined && !globalReasonId(reason) && reason !== itemFactReason))]
    const reasonId = (reason: string | undefined) => globalReasonId(reason) ?? (reason !== undefined && reason === itemFactReason ? `${anchor}-choice-reason`
      : reason !== undefined ? `${anchor}-action-reason-${actionReasons.indexOf(reason)}` : undefined)
    const detailFields = !restricted(item) ? [["理由", textOr(item.reason, "未提供")], ["适用对象／范围", textOr(item.scope, "未指定")], ["预期影响／代价", textOr(item.impact, "未知")], ["确定性", textOr(item.certainty, "未知")]] : []
    const allUnknown = detailFields.every(([, value]) => ["未提供", "未指定", "未知"].includes(value))
    const unknownGroups = new Map<string, string[]>()
    if (allUnknown) for (const [label, value] of detailFields) unknownGroups.set(value, [...(unknownGroups.get(value) ?? []), label])
    return <article key={item.id} aria-labelledby={`${anchor}-title`} className={`min-w-0 ${compact ? "space-y-2" : "space-y-3"}`}>
      <div className="flex min-w-0 items-start gap-3">
        <Label htmlFor={`${anchor}-choice`} className="min-h-10 min-w-10 shrink-0 justify-center pointer-coarse:min-h-11 pointer-coarse:min-w-11">
          <Checkbox id={`${anchor}-choice`} checked={selected.has(item.id)} disabled={choice !== undefined} aria-label={`选择：${itemTitle}`}
            aria-describedby={`${anchor}-status${choice !== undefined && editReason === undefined ? ` ${anchor}-choice-reason` : editReason !== undefined ? ` ${id}-edit` : ""}${shared.map(fact => ` ${fact.anchor}`).join("")}`}
            onCheckedChange={checked => { if (choice === undefined && checked !== selected.has(item.id)) emit({ ...envelope, type: checked ? "select" : "deselect", suggestionIds: [item.id], scope: "item" }) }} />
          <span className="sr-only">选择建议 {index + 1}</span>
        </Label>
        <h4 id={`${anchor}-title`} className="min-w-0 self-center break-words text-item-title">{index + 1}. {itemTitle}</h4>
      </div>
      <div id={`${anchor}-status`} className="flex flex-wrap gap-2">
        <Badge variant={status === "expired" || status === "restricted" || status === "unconfirmed" ? "warning" : "outline"}>{status === "pending" && selected.has(item.id) ? "已选" : statusLabels[status]}</Badge>
        {selected.has(item.id) && status !== "pending" && <Badge variant="outline">已选</Badge>}
        {!restricted(item) && <Badge variant="outline">{taskLabels[item.task?.state ?? "unconfirmed"]}</Badge>}
      </div>
      {restricted(item) ? <p id={`${anchor}-choice-reason`} className="break-words text-ui-hint">{item.disclosure.reason || "当前建议受限。"}</p> : <>
        <div className="max-w-[40em] whitespace-pre-wrap break-words text-read-body">{item.content}</div>
        {allUnknown && <p className="break-words text-ui-hint">{[...unknownGroups].map(([value, labels]) => `${labels.join("、")}：${value}`).join("；")}</p>}
        <dl className="min-w-0 space-y-2 text-ui-hint">
          {!allUnknown && detailFields.map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-ui-action">{label}</dt><dd className="whitespace-pre-wrap break-words">{value}</dd></div>)}
          {!shared.some(fact => fact.kind === "evidence") && <div><dt className="text-ui-action">依据</dt><dd><SuggestionEvidence evidence={item.evidence} onOpen={openEvidence(item.evidence, [index])} /></dd></div>}
          {!shared.some(fact => fact.kind === "source") && <div><dt className="text-ui-action">来源</dt><dd className="break-words">{textOr(item.source, "未确认")}</dd></div>}
        </dl>
        {!!shared.length && <p className="text-ui-hint">共用说明：{shared.map(fact => fact.label).join(" · ")}</p>}
        {item.task?.description && <p className="break-words text-ui-hint">{item.task.description}</p>}
        {(itemReason(item) !== undefined || item.status.state === "dismissed" && item.status.reason) && <p id={`${anchor}-choice-reason`} className="break-words text-ui-hint">{(itemReason(item) ?? (item.status.state === "dismissed" ? item.status.reason : undefined)) || "当前不可修改此建议。"}</p>}
        {workspace && comparison && <Label htmlFor={`${anchor}-compare`} className="min-h-10 whitespace-normal pointer-coarse:min-h-11">
          <Checkbox id={`${anchor}-compare`} checked={compareIds.includes(item.id)} disabled={compareReason !== undefined} aria-label={`加入比较：${itemTitle}`} aria-describedby={compareReason !== undefined ? `${id}-compare-reason` : undefined} onCheckedChange={checked => compareSelection(item, checked)} />加入比较
        </Label>}
        <div className="flex flex-wrap items-start gap-2">
          {item.adopt && <SuggestionButton label={`采纳：${itemTitle}`} reason={adoptReason(item)} reasonId={reasonId(adoptReason(item))} onClick={() => emit({ ...envelope, type: "adopt", suggestionIds: [item.id], scope: "item" })}>采纳</SuggestionButton>}
          {workspace && adjustment && !adjustment.open && <SuggestionButton label={`调整：${itemTitle}`} reason={adjustBlock} reasonId={reasonId(adjustBlock)} onClick={() => adjust("start")}>调整</SuggestionButton>}
        </div>
        {workspace && adjustment?.open && <section aria-label="调整建议" className="min-w-0 space-y-3">
          <p className="text-ui-action">调整草稿</p>
          {adjustment.message && <p className="break-words text-ui-hint">{adjustment.message}</p>}
          {adjustment.fields.map(field => <SuggestionField key={field.id} field={field} readOnly={adjustBlock !== undefined} onChange={value => adjust("change", { ...fieldValues(adjustment.fields), [field.id]: value })} />)}
          <div className="flex flex-wrap items-start gap-2"><SuggestionButton reason={submitAdjustBlock} reasonId={reasonId(submitAdjustBlock)} onClick={() => adjust("submit")}>提交调整</SuggestionButton><SuggestionButton reason={adjustBlock} reasonId={reasonId(adjustBlock)} onClick={() => adjust("cancel")}>收起调整</SuggestionButton></div>
        </section>}
        {item.dismiss && <div className="min-w-0 space-y-2">
          {workspace && item.dismiss.reason !== undefined && <><Label htmlFor={`${anchor}-dismiss`}>驳回原因（可选）</Label><Input id={`${anchor}-dismiss`} value={item.dismiss.reason} readOnly={block !== undefined || item.dismiss.disabledReason !== undefined || status === "dismissed"}
            onChange={event => { if (block === undefined && item.dismiss?.disabledReason === undefined && status !== "dismissed") emit({ ...envelope, type: "dismiss", suggestionId: item.id, phase: "reason", reason: event.currentTarget.value }) }} /></>}
          <SuggestionButton label={`驳回：${itemTitle}`} reason={dismissBlock} reasonId={reasonId(dismissBlock)} onClick={() => emit({ ...envelope, type: "dismiss", suggestionId: item.id, phase: "submit", ...(item.dismiss?.reason !== undefined ? { reason: item.dismiss.reason } : {}) })}>驳回</SuggestionButton>
        </div>}
        {actionReasons.map((reason, reasonIndex) => <p key={reasonIndex} id={`${anchor}-action-reason-${reasonIndex}`} className="break-words text-ui-hint">{reason || "当前不可操作。"}</p>)}
      </>}
    </article>
  }
  const comparing = workspace && comparison?.open
  const comparisonIndexes = suggestions.flatMap((item, index) => comparing && compareIds.includes(item.id) && !restricted(item) ? [index] : [])
  return <Card aria-labelledby={`${id}-title`} data-suggestion-set-view={view} data-suggestion-set-density={density} className={`min-w-0 ${compact ? "gap-3 p-3" : "gap-5 p-5"}`}>
    <header className="min-w-0 space-y-2"><h3 id={`${id}-title`} className="break-words text-block-title">{title}</h3>
      <p className="break-words text-ui-hint">{suggestionSet.snapshot ? "当时建议" : "当前建议"}{suggestionSet.versionLabel ? ` · ${suggestionSet.versionLabel}` : ""} · 本次已选 {selected.size} 项</p>
      {receipt.state !== "idle" && <div role="status" className="space-y-1"><Badge variant={receipt.state === "unconfirmed" || receipt.state === "failed" ? "warning" : "outline"}>{receiptLabels[receipt.state]}</Badge>{receipt.message && <p className="break-words text-ui-hint">{receipt.message}</p>}</div>}
      {editReason !== undefined && <p id={`${id}-edit`} className="break-words text-ui-hint">{editReason || "当前不可修改建议。"}</p>}
      {selectedIds.length > 0 && selectionReason && <p role="status" className="break-words text-ui-hint">{selectionReason}</p>}
    </header>
    {!!facts.length && <section aria-label="共用依据与来源" className="min-w-0 space-y-3">{facts.map(fact => {
      const item = suggestions[fact.indexes[0]] as AgentSuggestionEntry
      return <div key={fact.anchor} id={fact.anchor} className="min-w-0 space-y-1"><p className="text-ui-action">{fact.label} · 适用建议 {fact.indexes.map(index => index + 1).join("、")}</p>
        {fact.kind === "evidence" ? <SuggestionEvidence evidence={item.evidence} onOpen={openEvidence(item.evidence, fact.indexes)} /> : <p className="whitespace-pre-wrap break-words text-ui-hint">{textOr(item.source, "来源未确认")}</p>}
      </div>
    })}</section>}
    {workspace && comparison && compareReason !== undefined && <p id={`${id}-compare-reason`} className="break-words text-ui-hint">{compareReason || "当前不可调整比较项。"}</p>}
    {workspace && <div className="flex flex-wrap items-start gap-2">
      <SuggestionButton reason={editReason ?? (!additions.length ? "没有其他可选建议。" : undefined)} reasonId={globalReasonId(editReason)} onClick={() => emit({ ...envelope, type: "select", suggestionIds: [...additions], scope: "visible" })}>选择当前可选项</SuggestionButton>
      <SuggestionButton reason={editReason ?? (!selectedIds.length ? "当前没有选择。" : undefined)} reasonId={globalReasonId(editReason)} onClick={() => emit({ ...envelope, type: "deselect", suggestionIds: suggestions.filter(item => selected.has(item.id)).map(item => item.id), scope: "visible" })}>取消当前列表选择</SuggestionButton>
      {adopt && <SuggestionButton primary reason={batchAdoptReason} reasonId={globalReasonId(batchAdoptReason)} onClick={() => emit({ ...envelope, type: "adopt", suggestionIds: [...selectedIds], scope: "selection" })}>采纳已选建议</SuggestionButton>}
      {comparison && <SuggestionButton reason={compareReason ?? (compareInvalid ? "请为比较选择至少两条当前可查看的建议。" : undefined)} reasonId={globalReasonId(compareReason)} onClick={() => emit({ ...envelope, type: "compare", phase: "show", suggestionIds: [...compareIds] })}>比较选中建议</SuggestionButton>}
      {comparing && <SuggestionButton reason={channelReason} reasonId={globalReasonId(channelReason)} onClick={() => emit({ ...envelope, type: "compare", phase: "close", suggestionIds: [...compareIds] })}>返回建议列表</SuggestionButton>}
    </div>}
    {comparing && <section aria-label="建议比较" className="min-w-0 space-y-3">
      <h4 className="text-block-title">建议比较</h4>
      {compareInvalid && <p role="status" className="text-ui-hint">部分比较项未确认；请返回列表重新选择，其他建议仍保留。</p>}
      <div className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] items-start gap-6">{comparisonIndexes.map(index => renderItem(suggestions[index], index))}</div>
    </section>}
    <section aria-label={comparing ? "其他建议" : "建议列表"} className={`min-w-0 ${compact ? "space-y-4" : "space-y-6"}`}>
      {comparing && suggestions.length > comparisonIndexes.length && <h4 className="text-block-title">其他建议</h4>}
      {suggestions.map((item, index) => comparisonIndexes.includes(index) ? null : renderItem(item, index))}
      {!suggestions.length && <p className="text-ui-hint">当前没有建议。</p>}
    </section>
    <p className="break-words text-ui-hint text-muted-foreground">{notice || "选择、采纳与创建任务是三件事，结果以各自记录为准。"}</p>
    <RecordDetails>{details}</RecordDetails>
    <footer className="flex flex-wrap items-start gap-2">
      {confirm && <SuggestionButton reason={confirmReason} reasonId={globalReasonId(confirmReason)} onClick={() => emit({ ...envelope, type: "confirm", suggestionIds: [...selectedIds] })}>确认本次选择</SuggestionButton>}
      {!!selectedIds.length && <SuggestionButton reason={editReason} reasonId={globalReasonId(editReason)} onClick={() => emit({ ...envelope, type: "deselect", suggestionIds: [...selectedIds], scope: "selection" })}>取消全部选择</SuggestionButton>}
      {!workspace && onExpand && <Button type="button" size="navigation" variant="outline" className="whitespace-normal" onClick={event => onExpand(event.currentTarget)}>展开比较与调整</Button>}
      {workspace && onBack && <Button type="button" size="navigation" variant="outline" onClick={onBack}>返回原位置</Button>}
    </footer>
  </Card>
}
