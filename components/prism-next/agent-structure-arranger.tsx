"use client"

import { useId, useMemo, useRef, type DragEvent } from "react"
import { ArrowDown, ArrowLeft, ArrowUp, ArrowUpRight, GripVertical, Plus } from "lucide-react"
import { Card } from "@/components/coss/card"
import { Checkbox } from "@/components/coss/checkbox"
import { Input } from "@/components/coss/input"
import { Label } from "@/components/coss/label"
import { NumberField, NumberFieldGroup, NumberFieldInput, NumberFieldDecrement, NumberFieldIncrement } from "@/components/coss/number-field"
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from "@/components/coss/select"
import { Badge } from "./badge"
import { Button } from "./button"
import { RecordDetails, type AgentRecordViewProps } from "./agent-record-parts"
import {
  arrangementAttributeValueAllowed, arrangementDropTarget, arrangementHasId, arrangementItemBlock,
  arrangementMoveBlock, arrangementMoveTarget, arrangementReason, arrangementSelectionBlock, arrangementSiblings, indexArrangement,
  type AgentArrangement, type AgentArrangementActions, type AgentArrangementAttribute, type AgentArrangementGroup,
  type AgentArrangementItem, type AgentArrangementMoveMethod, type AgentArrangementPosition, type AgentArrangementSave,
  type AgentArrangementSummary, type AgentArrangementValidation, type AgentStructureArrangerIntent,
} from "@/lib/prism-next/agent-structure-arranger"

export type {
  AgentArrangement, AgentArrangementAction, AgentArrangementActions, AgentArrangementAttribute, AgentArrangementGroup,
  AgentArrangementItem, AgentArrangementMoveMethod, AgentArrangementPosition, AgentArrangementSave, AgentArrangementSource,
  AgentArrangementSummary, AgentArrangementValidation, AgentArrangementVersion, AgentStructureArrangerIntent,
} from "@/lib/prism-next/agent-structure-arranger"

export type AgentStructureArrangerProps = AgentRecordViewProps & {
  structure: AgentArrangement
  items: readonly AgentArrangementItem[]
  groups: readonly AgentArrangementGroup[]
  summary?: AgentArrangementSummary
  validation: readonly AgentArrangementValidation[]
  changes?: readonly string[]
  save?: AgentArrangementSave
  actions?: AgentArrangementActions
  readOnlyReason?: string
  onIntent?: (intent: AgentStructureArrangerIntent) => void
  /** View selection only; never changes membership or order. The page keeps it across views. */
  selectedIds?: readonly string[]
  onSelectionChange?: (ids: string[]) => void
  /** Host-supplied common fields/values for the selected items, not inferred by the component. */
  batchAttributes?: readonly AgentArrangementAttribute[]
  /** Readable open action label; blank values use the default. */
  openItemLabel?: string
  onBack?: () => void
  notice?: string
}

const saveLabels = { unsaved: "未保存", saving: "保存中", "saved-draft": "已保存草稿", submitted: "已提交", conflict: "版本冲突", unconfirmed: "回执未确认", error: "保存失败", unknown: "保存状态未知" }
const validationLabels = { error: "错误", warning: "警告", hint: "提示" }
const attributeText = (attribute: AgentArrangementAttribute) => attribute.value === null ? "未指定"
  : attribute.type === "number" ? Number.isFinite(attribute.value) ? `${attribute.value}${attribute.unit ? ` ${attribute.unit}` : ""}` : "—"
    : attribute.options.find(option => option.value === attribute.value)?.label ?? "当前选项未列出"

function ArrangementAttributeField({ attribute, anchor, reason, describedBy, editable, invalid, onValue }: {
  attribute: AgentArrangementAttribute; anchor: string; reason?: string; describedBy?: string; editable: boolean; invalid: boolean
  onValue: (value: number | string | null) => void
}) {
  const emit = (value: number | string | null) => { if (editable && !reason && arrangementAttributeValueAllowed(attribute, value)) onValue(value) }
  const labelId = `${anchor}-label`
  return <div className="min-w-0 space-y-2" data-arranger-field="">
    <Label id={labelId} htmlFor={editable && !reason ? `${anchor}-input` : undefined}>{attribute.label}{editable && !reason && attribute.type === "number" && attribute.unit ? `（${attribute.unit}）` : ""}</Label>
    {!editable || reason ? <p className="break-words text-ui-body" aria-describedby={describedBy}>{attributeText(attribute)}</p>
      : attribute.type === "number" ? <NumberField id={`${anchor}-input`} value={Number.isFinite(attribute.value) ? attribute.value : null} step={attribute.step}
        onValueChange={emit} className="min-w-0 w-full">
        <NumberFieldGroup><NumberFieldDecrement aria-label={`减少${attribute.label}`} aria-describedby={describedBy} />
          <NumberFieldInput aria-labelledby={labelId} aria-describedby={describedBy} aria-invalid={invalid || undefined} />
          <NumberFieldIncrement aria-label={`增加${attribute.label}`} aria-describedby={describedBy} /></NumberFieldGroup>
      </NumberField>
        : <Select items={attribute.options.map((option, i) => ({ value: String(i), label: option.label }))}
          value={attribute.value === null ? null : attribute.options.some(option => option.value === attribute.value) ? String(attribute.options.findIndex(option => option.value === attribute.value)) : null}
          onValueChange={value => { const option = attribute.options.find((_, i) => String(i) === value); if (option && option.disabledReason === undefined) emit(option.value) }}>
          <SelectTrigger id={`${anchor}-input`} className="w-full min-w-0" aria-labelledby={labelId} aria-describedby={describedBy} aria-invalid={invalid || undefined}>
            <SelectValue placeholder={attribute.value === null ? "未指定" : "当前选项未列出"} /></SelectTrigger>
          <SelectPopup>{attribute.options.map((option, i) => <SelectItem key={i} value={String(i)} disabled={option.disabledReason !== undefined}>{option.label}</SelectItem>)}</SelectPopup>
        </Select>}
  </div>
}

export function AgentStructureArranger({
  structure, items, groups, summary = {}, validation, changes, save = { state: "unknown" }, actions = {}, readOnlyReason,
  onIntent, selectedIds = [], onSelectionChange, batchAttributes = [], view = "inline", density = "default", onExpand, onBack,
  notice = "编排调整不代表已保存或发布。", details, openItemLabel,
}: AgentStructureArrangerProps) {
  const id = useId()
  const index = useMemo(() => indexArrangement(items, groups), [items, groups])
  const context = { structureId: structure.id, versionId: structure.version.id, baseVersionId: structure.baseVersion?.id ?? "" }
  const revision = JSON.stringify(context)
  const drag = useRef<{ itemId: string; revision: string; items: typeof items; groups: typeof groups } | null>(null)
  const historical = structure.snapshot !== undefined
  const identityBlock = ![context.structureId, context.versionId, context.baseVersionId].every(arrangementHasId) ? "编排身份或版本未确认，暂不能操作。" : undefined
  const globalBlock = index.error || identityBlock || (historical ? "历史编排只读。" : undefined)
    || arrangementReason(readOnlyReason, "当前编排只读。")
    || (["saving", "conflict", "unconfirmed"].includes(save.state) ? save.description || `${saveLabels[save.state]}，请先核对。` : undefined)
    || (!onIntent ? "当前仅可查看编排。" : undefined)
  const actionBlock = (kind: keyof AgentArrangementActions) => globalBlock
    || (!actions[kind] ? "此操作暂不可用。" : arrangementReason(actions[kind]?.disabledReason, "此操作暂不可用。"))

  // Shared standing copy, keyed by exact text. All affected controls reference it.
  const notes = new Map<string, { id: string; scopes: Set<string>; itemIds: Set<string>; levels: Set<string> }>()
  function note(text: string | undefined, scope: string, level?: string, itemId?: string) {
    if (!text) return undefined
    let entry = notes.get(text)
    if (!entry) { entry = { id: `${id}-note-${notes.size}`, scopes: new Set(), itemIds: new Set(), levels: new Set() }; notes.set(text, entry) }
    if (itemId) entry.itemIds.add(itemId)
    else entry.scopes.add(scope)
    if (level) entry.levels.add(level)
    return entry.id
  }
  // Track identities, not labels: distinct items may have the same readable title.
  const sharedNotes = new Map<string, { id: string; text: string; label: string; itemIds: Set<string> }>()
  function itemNote(text: string | undefined, itemId: string, label = "") {
    if (!text) return undefined
    const key = JSON.stringify([label, text])
    let entry = sharedNotes.get(key)
    if (!entry) { entry = { id: `${id}-shared-${sharedNotes.size}`, text, label, itemIds: new Set() }; sharedNotes.set(key, entry) }
    entry.itemIds.add(itemId)
    return entry.id
  }
  function sharedScope(entry: { label: string; itemIds: Set<string> }) {
    if (items.every(item => entry.itemIds.has(item.id))) return entry.label
    return [items.filter(item => entry.itemIds.has(item.id)).map(item => itemScope(item.id)).join("、"), entry.label].filter(Boolean).join(" · ")
  }
  const unknowns: string[] = []
  const unknownId = `${id}-unknown`
  const itemScope = (itemId: string) => { const item = index.itemMap.get(itemId); return item?.scopeLabel?.trim() || item?.title || "未命名条目" }
  const groupScope = (groupId: string) => groups.find(group => group.id === groupId)?.title || "未命名分组"
  const factsFor = (itemId: string, attributeId?: string) => validation.filter(result => result.target && "itemId" in result.target
    && result.target.itemId === itemId && (result.target.attributeId === undefined || result.target.attributeId === attributeId))
  for (const result of validation) {
    const scope = !result.target ? "整体" : "groupId" in result.target ? groupScope(result.target.groupId) : itemScope(result.target.itemId)
    note(result.message, scope, validationLabels[result.level], result.target && "itemId" in result.target ? result.target.itemId : undefined)
  }
  note(globalBlock, "编排操作")
  note(save.description, "保存状态")
  if (!structure.version.label) unknowns.push("当前版本")
  if (!structure.baseVersion?.label) unknowns.push("基准版本")
  if (save.state === "unknown") unknowns.push("保存状态")
  if (changes === undefined) unknowns.push("关键变化")
  const totals: string[] = []
  const metrics = [
    ["分组数", summary.groupCount, true], [summary.itemCountLabel || "题数", summary.itemCount, true],
    ["总分", summary.totalScore, false], ...(summary.targetScore !== undefined ? [["目标总分", summary.targetScore, false]] : []),
  ] as [string, number | null | undefined, boolean][]
  for (const [label, value, integer] of metrics) {
    if (typeof value === "number" && Number.isFinite(value) && (!integer || Number.isInteger(value) && value >= 0)) totals.push(`${label}：${value}`)
    else unknowns.push(label)
  }

  function move(itemId: string, target: AgentArrangementPosition | undefined, via: AgentArrangementMoveMethod) {
    if (!actionBlock("move") && target && !arrangementMoveBlock(index, [itemId], target)) onIntent?.({ ...context, type: "move", itemId, target: { ...target }, via })
  }
  const batchBlock = arrangementSelectionBlock(index, selectedIds)
  function moveBatch(target: AgentArrangementPosition) {
    if (view === "workspace" && !actionBlock("batchMove") && !batchBlock && !arrangementMoveBlock(index, selectedIds, target)) {
      onIntent?.({ ...context, type: "batch-move", itemIds: items.filter(item => selectedIds.includes(item.id)).map(item => item.id), target: { ...target } })
    }
  }
  function dragTarget(groupId: string | null, beforeId: string | null) {
    const active = drag.current
    if (!active || active.revision !== revision || active.items !== items || active.groups !== groups || view !== "workspace" || actionBlock("move")) return
    const target = arrangementDropTarget(index, [active.itemId], groupId, beforeId)
    return target && !arrangementMoveBlock(index, [active.itemId], target) ? { itemId: active.itemId, target } : undefined
  }
  const dropHandlers = (groupId: string | null, beforeId: string | null) => ({
    onDragOver: (event: DragEvent) => { if (dragTarget(groupId, beforeId)) { event.preventDefault(); event.dataTransfer.dropEffect = "move" } },
    onDrop: (event: DragEvent) => {
      const destination = dragTarget(groupId, beforeId)
      if (destination) { event.preventDefault(); event.stopPropagation(); move(destination.itemId, destination.target, "drag") }
      drag.current = null
    },
  })

  function groupPicker(itemIds: readonly string[], scope: string, anchor: string, batch = false) {
    const reason = actionBlock(batch ? "batchMove" : "move") || arrangementSelectionBlock(index, itemIds)
    const options = [...groups.map(group => ({ groupId: group.id as string | null, label: group.title || "未命名分组" })), { groupId: null, label: "未分组" }]
      .filter(option => batch || option.groupId !== index.itemMap.get(itemIds[0])?.groupId)
      .map(option => { const target = arrangementDropTarget(index, itemIds, option.groupId, null); return { ...option, target, reason: reason || arrangementMoveBlock(index, itemIds, target) } })
    if (!options.length) return null
    const describedBy = [note(reason, scope, undefined, batch ? undefined : itemIds[0]), ...options.map(option => note(option.reason, scope, undefined, batch ? undefined : itemIds[0]))].filter(Boolean).join(" ") || undefined
    return <div className="min-w-0 space-y-2"><Label id={`${anchor}-label`} htmlFor={anchor}>{batch ? "将所选移到分组末尾" : "移到分组末尾"}</Label>
      <Select value={null} items={options.map((option, i) => ({ value: String(i), label: option.label }))} disabled={!!reason || !options.some(option => !option.reason)}
        onValueChange={value => {
          const option = options.find((_, i) => String(i) === value)
          if (option?.target && !option.reason) { if (batch) moveBatch(option.target); else move(itemIds[0], option.target, "to-group") }
        }}>
        <SelectTrigger id={anchor} className="w-full min-w-0" aria-labelledby={`${anchor}-label`} aria-describedby={describedBy}><SelectValue placeholder="选择目标分组" /></SelectTrigger>
        <SelectPopup>{options.map((option, i) => <SelectItem key={i} value={String(i)} disabled={!!option.reason}>{option.label}</SelectItem>)}</SelectPopup>
      </Select>
    </div>
  }

  function attributeField(attribute: AgentArrangementAttribute, itemIds: readonly string[], anchor: string, batch = false) {
    const scope = batch ? "批量属性" : itemScope(itemIds[0])
    const fields = itemIds.map(itemId => index.itemMap.get(itemId)?.attributes.find(field => field.id === attribute.id))
    const fieldBlock = batch && batchAttributes.filter(field => field.id === attribute.id).length !== 1 ? "批量属性暂不可用，请重新核对。"
      : fields.some(field => !field || field.type !== attribute.type) ? "所选条目没有相同的编排属性。" : fields.map(field => arrangementReason(field?.readOnlyReason, "此属性只读。")).find(Boolean)
    const kind = batch ? "batchSetAttribute" : "setAttribute"
    const reason = (actions[kind] ? actionBlock(kind) : globalBlock) || arrangementSelectionBlock(index, itemIds)
      || arrangementReason(attribute.readOnlyReason, "此属性只读。") || fieldBlock
    const presented = batch && attribute.type === "select" ? { ...attribute, options: attribute.options.map(option => {
      const unsupported = fields.some(field => field?.type !== "select" || !field.options.some(candidate => candidate.value === option.value))
      const restricted = fields.flatMap(field => field?.type === "select" ? field.options.filter(candidate => candidate.value === option.value) : [])
        .find(candidate => candidate.disabledReason !== undefined)
      const disabledReason = option.disabledReason ?? (unsupported ? "部分所选条目不支持此选项。" : restricted?.disabledReason)
      return { ...option, ...(disabledReason !== undefined ? { disabledReason } : {}) }
    }) } : attribute
    const facts = itemIds.flatMap(itemId => factsFor(itemId, attribute.id))
    const descriptions = [note(reason, scope, undefined, batch ? undefined : itemIds[0]), note(attribute.description, scope, undefined, batch ? undefined : itemIds[0]), ...facts.map(fact => note(fact.message, scope, validationLabels[fact.level], batch ? undefined : itemIds[0]))]
    if (presented.type === "select") for (const option of presented.options) descriptions.push(note(arrangementReason(option.disabledReason, "此选项暂不可用。"), `${scope} · ${option.label}`))
    if (attribute.type === "number" && attribute.value !== null && !Number.isFinite(attribute.value)) unknowns.push(`${scope}的${attribute.label}`)
    if (view === "inline") return <p key={anchor} className="break-words text-ui-body" aria-describedby={[...new Set(descriptions.filter(Boolean)), unknownId].join(" ")}>
      {attribute.label}：{attributeText(attribute)}
    </p>
    return <ArrangementAttributeField key={anchor} attribute={presented} anchor={anchor} reason={reason}
      editable={view === "workspace" && !!actions[kind]}
      describedBy={[...new Set(descriptions.filter(Boolean)), unknownId].join(" ")} invalid={facts.some(fact => fact.level === "error")}
      onValue={value => {
        if (view !== "workspace" || !actions[kind] || reason || !arrangementAttributeValueAllowed(presented, value) || fields.some(field => !field || !arrangementAttributeValueAllowed(field, value))) return
        onIntent?.(batch ? { ...context, type: "batch-set-attribute", itemIds: [...itemIds], attributeId: attribute.id, value }
          : { ...context, type: "set-attribute", itemId: itemIds[0], attributeId: attribute.id, value })
      }} />
  }

  const batch = !index.error && view === "workspace" && (actions.batchMove || actions.batchSetAttribute) ? <section aria-label="批量编排" className="min-w-0 space-y-3">
    <div className="flex flex-wrap items-center gap-2"><h4 className="text-ui-action">批量编排 · 已选 {selectedIds.length} 项</h4>
      {onSelectionChange && <Button type="button" variant="ghost" size="navigation" disabled={!selectedIds.length} data-arranger-action="clear-selection" onClick={() => onSelectionChange([])}>清除选择</Button>}</div>
    {actions.batchMove && groupPicker(selectedIds, "批量移动", `${id}-batch-group`, true)}
    {actions.batchSetAttribute && batchAttributes.map((attribute, i) => attributeField(attribute, selectedIds, `${id}-batch-attribute-${i}`, true))}
  </section> : null

  const renderItem = (item: AgentArrangementItem) => {
    const ordinal = items.indexOf(item), scope = itemScope(item.id), anchor = `${id}-item-${ordinal}`
    const locked = arrangementItemBlock(index, item.id)
    const descriptionIds = [itemNote(item.description, item.id), note(locked, scope, undefined, item.id), ...factsFor(item.id).map(fact => note(fact.message, scope, validationLabels[fact.level], item.id))]
    if (item.source?.label) descriptionIds.push(itemNote(item.source.label, item.id, "来源"))
    else unknowns.push(`${scope}来源`)
    const selectionReason = globalBlock || locked || (!onSelectionChange ? "当前不能更改选择。" : undefined)
    const selectable = view === "workspace" && (actions.batchMove || actions.batchSetAttribute)
    const selectionDescription = selectable ? note(selectionReason, "批量选择") : undefined
    const canDrag = view === "workspace" && !!actions.move && !actionBlock("move") && !locked
    const openReason = index.error || identityBlock || (!onIntent ? "当前不能打开条目。" : undefined)
      || (!item.source || !arrangementHasId(item.source.objectId) ? "来源对象未确认，暂不能打开。" : undefined)
      || arrangementReason(item.open?.disabledReason, "当前不能打开条目。")
    return <li key={item.id} className="min-w-0" {...(view === "workspace" ? dropHandlers(item.groupId, item.id) : {})} data-arranger-row={ordinal}>
      <Card className={`min-w-0 ${density === "compact" ? "gap-2 p-3" : "gap-3 p-4"}`}>
        <div className="flex min-w-0 items-start gap-2">
          {selectable && <Checkbox aria-labelledby={`${anchor}-title`} aria-describedby={selectionDescription} checked={selectedIds.includes(item.id)} disabled={!!selectionReason}
            onCheckedChange={checked => { if (!selectionReason) onSelectionChange?.(checked ? [...new Set([...selectedIds, item.id])] : selectedIds.filter(value => value !== item.id)) }} />}
          {view === "workspace" && actions.move && <span draggable={canDrag} data-arranger-drag={ordinal} aria-label={`拖动${scope}`} className="shrink-0 p-2"
            onDragStart={event => {
              if (!canDrag) { event.preventDefault(); return }
              drag.current = { itemId: item.id, revision, items, groups }
              event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", "编排条目")
            }} onDragEnd={() => { drag.current = null }}><GripVertical aria-hidden="true" /></span>}
          <div className="min-w-0 flex-1 space-y-1"><h5 id={`${anchor}-title`} className="break-words text-item-title" aria-describedby={[...descriptionIds.filter(Boolean), unknownId].join(" ")}>{item.title || "未命名条目"}</h5>
            <p className="break-words text-ui-hint">{item.scopeLabel?.trim() && `${item.scopeLabel.trim()} · `}{item.type}{locked ? " · 已锁定" : ""}</p></div>
        </div>
        {!!item.attributes.length && <div className={view === "inline" ? "flex min-w-0 flex-wrap gap-x-4 gap-y-1" : "grid min-w-0 gap-3"}>{item.attributes.map((attribute, i) => attributeField(attribute, [item.id], `${anchor}-attribute-${i}`))}</div>}
        <div className="flex flex-wrap gap-2">{actions.move && (["up", "down"] as const).map(via => {
          const target = arrangementMoveTarget(index, item.id, via)
          const boundary = !actionBlock("move") && !locked && !target
          const reason = actionBlock("move") || locked || (target ? arrangementMoveBlock(index, [item.id], target)
            : item.moveBoundaryReasons?.[via]?.trim() || (via === "up" ? "已在最前，不能上移" : "已在最后，不能下移"))
          return <Button key={via} type="button" variant="outline" size="navigation" data-arranger-action={via} disabled={!!reason}
            aria-describedby={note(reason, scope, undefined, boundary ? undefined : item.id)} onClick={() => move(item.id, target, via)}>{via === "up" ? <ArrowUp aria-hidden="true" /> : <ArrowDown aria-hidden="true" />}{via === "up" ? "上移" : "下移"}</Button>
        })}
          {item.open && <Button type="button" variant="ghost" size="navigation" data-arranger-action="open-item" disabled={!!openReason} aria-describedby={note(openReason, scope, undefined, item.id)}
            onClick={() => { if (!openReason && item.source) onIntent?.({ ...context, type: "open-item", itemId: item.id, source: { ...item.source } }) }}>{openItemLabel?.trim() || "查看详情"}</Button>}
        </div>
        {view === "workspace" && actions.move && groupPicker([item.id], scope, `${anchor}-group`)}
      </Card>
    </li>
  }

  const renderGroup = (group: AgentArrangementGroup | null, ordinal: number) => {
    const groupId = group?.id ?? null, children = arrangementSiblings(index, groupId), scope = group ? groupScope(group.id) : "未分组"
    const anchor = `${id}-group-${ordinal}`
    const locked = arrangementReason(group?.lockedReason, "此分组已锁定。")
    const renameReason = actionBlock("groupRename") || locked
    const deleteReason = actionBlock("groupDelete") || locked || children.map(item => arrangementItemBlock(index, item.id)).find(Boolean)
    note(group?.description, scope); note(locked, scope)
    return <section key={groupId ?? "ungrouped"} aria-labelledby={`${anchor}-label`} className="min-w-0 space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        {group && view === "workspace" && actions.groupRename && !historical ? <div className="min-w-0 flex-1 space-y-2">
          <Label id={`${anchor}-label`} htmlFor={`${anchor}-title`}>{scope}名称</Label>
          <Input id={`${anchor}-title`} value={group.title} readOnly={!!renameReason} aria-describedby={note(renameReason, scope)} data-arranger-action="group-rename"
            onChange={event => { if (!renameReason) onIntent?.({ ...context, type: "group-rename", groupId: group.id, title: event.currentTarget.value }) }} />
        </div> : <h4 id={`${anchor}-label`} className="min-w-0 break-words text-item-title">{group?.title || (group ? "未命名分组" : "未分组")}</h4>}
        {group && view === "workspace" && actions.groupDelete && <Button type="button" variant="outline" size="navigation" data-arranger-action="group-delete"
          disabled={!!deleteReason} aria-describedby={note(deleteReason, scope)} onClick={() => { if (!deleteReason) onIntent?.({ ...context, type: "group-delete", groupId: group.id }) }}>删除分组</Button>}
      </div>
      {!!children.length && <ol className="min-w-0 space-y-3">{children.map(renderItem)}</ol>}
      {(view === "workspace" || !children.length) && <p className="min-h-10 break-words py-2 text-ui-hint" data-arranger-drop-end={ordinal}
        {...(view === "workspace" ? dropHandlers(groupId, null) : {})}>{children.length ? "分组末尾" : "暂无条目"}</p>}
    </section>
  }
  const body = !index.error && <div className={`min-w-0 ${density === "compact" ? "space-y-4" : "space-y-6"}`}>
    {groups.map(renderGroup)}{(view === "workspace" || items.some(item => item.groupId === null) || !groups.length) && renderGroup(null, groups.length)}
  </div>
  const createReason = actionBlock("groupCreate")
  const confirmReason = actionBlock("confirm") || (validation.some(result => result.level === "error") ? "请先处理编排中的校验错误。" : undefined)
    || (save.state === "submitted" ? "当前编排已提交。" : undefined)
  const footer = <div className="flex flex-wrap gap-2">
    {view === "workspace" && actions.groupCreate && <Button type="button" variant="outline" size="navigation" disabled={!!createReason} data-arranger-action="group-create"
      aria-describedby={note(createReason, "新增分组")} onClick={() => { if (!createReason) onIntent?.({ ...context, type: "group-create" }) }}><Plus aria-hidden="true" />新增分组</Button>}
    {actions.confirm && <Button type="button" size="navigation" disabled={!!confirmReason} data-arranger-action="confirm" aria-describedby={note(confirmReason, "确认编排")}
      onClick={() => { if (!confirmReason) onIntent?.({ ...context, type: "confirm" }) }}>确认编排</Button>}
    {view === "inline" && onExpand && <Button type="button" variant="outline" size="navigation" onClick={event => onExpand(event.currentTarget)}><ArrowUpRight aria-hidden="true" />展开编排</Button>}
    {view === "workspace" && onBack && <Button type="button" variant="ghost" size="navigation" onClick={onBack}><ArrowLeft aria-hidden="true" />返回原位置</Button>}
  </div>
  return <Card data-agent-arranger-view={view} data-density={density} className={`min-w-0 ${density === "compact" ? "gap-3 p-3" : "gap-5 p-5"}`}>
    <header className="min-w-0 space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-2"><h3 className="min-w-0 break-words text-block-title">{structure.title}</h3><Badge variant="secondary">{historical ? "历史编排" : "当前编排"}</Badge></div>
      {(structure.version.label || structure.baseVersion?.label || save.state !== "unknown") && <p className="break-words text-ui-hint">{[
        structure.version.label && `${historical ? "当时版本" : "当前版本"}：${structure.version.label}`, structure.baseVersion?.label && `基准版本：${structure.baseVersion.label}`,
        save.state !== "unknown" && `${historical ? "当时" : ""}${saveLabels[save.state]}`,
      ].filter(Boolean).join(" · ")}</p>}
      {historical && structure.snapshot && <p className="break-words text-ui-hint">{structure.snapshot}</p>}
      {!!totals.length && <p className="break-words text-ui-body">{totals.join(" · ")}</p>}
      <p id={unknownId} className="break-words text-ui-hint">{unknowns.length ? `未知：${[...new Set(unknowns)].join("、")}。` : null}</p>
      {changes !== undefined && <p className="break-words text-ui-hint">关键变化：{[...new Set(changes)].join("；") || "未记录编排变化"}</p>}
    </header>
    {(!!notes.size || !!sharedNotes.size) && <section aria-label="编排说明与校验" className="min-w-0 space-y-2">{[...notes].map(([text, entry]) => <p key={entry.id} id={entry.id} role={entry.levels.has("错误") ? "alert" : undefined} className="break-words text-ui-hint">
      {entry.levels.size ? `${[...entry.levels].join("／")} · ` : ""}{[...entry.scopes, ...(items.length && items.every(item => entry.itemIds.has(item.id)) ? [] : [...entry.itemIds].map(itemScope))].join("、") || "编排说明"}：{text}
    </p>)}{[...sharedNotes.values()].map(entry => <p key={entry.id} id={entry.id} className="break-words text-ui-hint">
      {sharedScope(entry) && `${sharedScope(entry)}：`}{entry.text}
    </p>)}</section>}
    {batch}{body}{footer}
    <p className="break-words text-ui-hint text-muted-foreground">{notice}</p>
    <RecordDetails>{details}</RecordDetails>
  </Card>
}
