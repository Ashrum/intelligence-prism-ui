"use client"

import { useId, useMemo, useRef, type DragEvent, type ReactNode } from "react"
import { ArrowDown, ArrowUp, ArrowUpRight, GripVertical } from "lucide-react"
import { Card } from "@/components/coss/card"
import { Input } from "@/components/coss/input"
import { Label } from "@/components/coss/label"
import { Textarea } from "@/components/coss/textarea"
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from "@/components/coss/select"
import { Badge } from "./badge"
import { Button } from "./button"
import { RecordDetails, type AgentRecordViewProps } from "./agent-record-parts"
import type { AgentResourceLicense, AgentResourceSource } from "./agent-resource-retriever"
import {
  arrangementDropTarget, arrangementMoveBlock, arrangementMoveTarget, indexArrangement,
  type AgentArrangementPosition, type AgentArrangementSave,
} from "@/lib/prism-next/agent-structure-arranger"

export type AgentMaterialPackAction = { disabledReason?: string }
export type AgentMaterialPackVersion = { id: string; label: string }
export type AgentMaterialPackIdentity = {
  id: string
  title: string
  version: AgentMaterialPackVersion
  baseVersion: AgentMaterialPackVersion
  /** Presence means a read-only historical projection, including an empty label. */
  snapshot?: string
}
/** The original resource reference, never a new asset or a copy of its content. */
export type AgentMaterialResourceReference = {
  resourceId: string
  versionId: string | null
  source: AgentResourceSource
}
export type AgentMaterialAvailability =
  | { state: "available" | "unknown"; reason?: string }
  | { state: "invalid" | "restricted"; reason: string }
export type AgentMaterialPackItemAction = "remove" | "move" | "edit-note" | "preview" | "open-source"
export type AgentMaterialPackItem = {
  resource: AgentMaterialResourceReference
  title: string
  /** A readable domain name: 图片、视频、文章、练习题、提纲、课件, etc. */
  type: string
  versionLabel: string | null
  categoryId: string | null
  note: string
  license: AgentResourceLicense
  availability: AgentMaterialAvailability
  lockedReason?: string
  actions?: Partial<Record<AgentMaterialPackItemAction, AgentMaterialPackAction>>
}
export type AgentMaterialPackCategory = { id: string; title: string; count: number | null; lockedReason?: string }
export type AgentMaterialPackSummary = {
  count: number | null
  sourceComposition: string | null
  license: string | null
  availability: string | null
}
export type AgentMaterialReuseRecord = {
  id: string
  target: { objectId: string; versionId: string | null; label: string; versionLabel: string | null; location?: string }
  /** Omitted means the pack; supplied means these original resources, in this order. */
  resourceIds?: readonly string[]
  description?: string
}
export type AgentMaterialPackSave = AgentArrangementSave
export type AgentMaterialPackActionType = "add-request" | "category-create" | "category-rename" | "category-delete" | "rename-pack" | "reuse-request" | "confirm"
export type AgentMaterialPackContext = { packId: string; versionId: string; baseVersionId: string }
export type AgentMaterialPackIntent = AgentMaterialPackContext & (
  | { type: "add-request" | "category-create" }
  | { type: "rename-pack"; title: string }
  | { type: "category-rename"; categoryId: string; title: string }
  | { type: "category-delete"; categoryId: string; resources: readonly AgentMaterialResourceReference[] }
  | { type: "remove" | "preview" | "open-source"; resource: AgentMaterialResourceReference }
  | { type: "edit-note"; resource: AgentMaterialResourceReference; note: string }
  | { type: "move"; resource: AgentMaterialResourceReference; target: { categoryId: string | null; index: number }; via: "up" | "down" | "drag" | "to-category" }
  | { type: "reuse-request" | "confirm"; resources: readonly AgentMaterialResourceReference[] }
)
export type AgentMaterialPackPreview = AgentMaterialPackContext & {
  resourceId: string
  resourceVersionId: string | null
  requestedBy: "user"
  state: "loading" | "ready" | "error"
  message?: string
}
export type AgentMaterialPackProps = AgentRecordViewProps & {
  pack: AgentMaterialPackIdentity
  /** Complete, authorized collection; categories and within-category order come from the page. */
  items: readonly AgentMaterialPackItem[]
  categories: readonly AgentMaterialPackCategory[]
  /** Page-supplied count for categoryId=null; omitted or null means unknown. */
  uncategorizedCount?: number | null
  summary: AgentMaterialPackSummary
  save?: AgentMaterialPackSave
  changes?: readonly string[]
  /** null means unknown coverage; [] means no reuse records in the supplied coverage. */
  reuseRecords: readonly AgentMaterialReuseRecord[] | null
  actions?: Partial<Record<AgentMaterialPackActionType, AgentMaterialPackAction>>
  readOnlyReason?: string
  onIntent?: (intent: AgentMaterialPackIntent) => void
  preview?: AgentMaterialPackPreview | null
  renderPreview?: (item: AgentMaterialPackItem, context: { view: "inline" | "workspace"; density: "default" | "compact" }) => ReactNode
  onBack?: () => void
  notice?: string
}

const saveLabels: Record<AgentMaterialPackSave["state"], string> = {
  unsaved: "未保存", saving: "保存中", "saved-draft": "已保存草稿", submitted: "已提交", conflict: "版本冲突", unconfirmed: "回执未确认", error: "保存失败", unknown: "保存状态未知",
}
const licenseLabels = { available: "可用", restricted: "受限", "confirmation-required": "需确认", unknown: "未知" }
const availabilityLabels = { available: "可用", invalid: "来源失效", restricted: "访问受限", unknown: "未知" }
const countKnown = (value: number | null) => typeof value === "number" && Number.isInteger(value) && value >= 0
const reasonOf = (value: string | undefined, fallback: string) => value === undefined ? undefined : value.trim() ? value : fallback
const titleOf = (item: AgentMaterialPackItem) => item.title.trim() || "未命名素材"

/** Presentation and requests only. No resource contents, business draft or saved state is owned here. */
export function AgentMaterialPack({ pack, items, categories, uncategorizedCount = null, summary, save = { state: "unknown" }, changes, reuseRecords,
  actions = {}, readOnlyReason, onIntent, preview, renderPreview, view = "inline", density = "default", onExpand, onBack,
  notice = "整理与确认不代表已保存或已在其他对象中使用。", details }: AgentMaterialPackProps) {
  const id = useId(), full = view === "workspace", compact = density === "compact"
  const context = { packId: pack.id, versionId: pack.version.id, baseVersionId: pack.baseVersion.id }
  const revision = JSON.stringify(context)
  const drag = useRef<{ resourceId: string; revision: string; items: typeof items; categories: typeof categories } | null>(null)
  // Reuse 12's position validation, including locked-position protection. This projection is not a draft.
  const index = useMemo(() => indexArrangement(items.map(item => ({
    id: item.resource.resourceId, title: titleOf(item), type: item.type, groupId: item.categoryId, source: null, attributes: [],
    lockedReason: reasonOf(item.lockedReason, "此素材已锁定。")
      || (!item.actions?.move ? "此素材尚未开放排序。" : reasonOf(item.actions.move.disabledReason, "此素材暂不能移动。")),
  })), categories), [items, categories])
  const identityBlock = !Object.values(context).every(value => value.trim()) ? "素材包身份或版本未确认，暂不能操作。" : undefined
  const referenceBlock = index.error ? "素材或分类无法定位，请重新核对素材包。" : undefined
  const requestBlock = identityBlock || referenceBlock || (!onIntent ? "当前仅可查看素材包。" : undefined)
  const editBlock = requestBlock || (pack.snapshot !== undefined ? "历史素材包只读。" : undefined)
    || reasonOf(readOnlyReason, "当前素材包只读。")
    || (["saving", "conflict", "unconfirmed"].includes(save.state) ? save.description || `${saveLabels[save.state]}，请先核对原保存记录。` : undefined)
  const packBlock = (type: AgentMaterialPackActionType) => editBlock || (!actions[type] ? "此操作暂不可用。" : reasonOf(actions[type]?.disabledReason, "此操作暂不可用。"))
    || (type === "confirm" && save.state === "submitted" ? "此版本已提交，请先核对原记录。" : undefined)
  const itemBlock = (item: AgentMaterialPackItem, type: AgentMaterialPackItemAction) =>
    (type === "preview" || type === "open-source" ? requestBlock : editBlock
      || reasonOf(item.lockedReason, "此素材已锁定。") || reasonOf(categories.find(category => category.id === item.categoryId)?.lockedReason, "此分类已锁定。"))
    || (!item.actions?.[type] ? "此操作暂不可用。" : reasonOf(item.actions[type]?.disabledReason, "此操作暂不可用。"))
    || (type === "preview" && !renderPreview ? "暂未提供素材预览。" : undefined)

  // Exact prose is shared once; coverage tracks resource identities rather than possibly repeated titles.
  const notes = new Map<string, { id: string; labels: Set<string>; resources: Set<string>; global: boolean }>()
  function note(text: string | null | undefined, label: string, resourceId?: string) {
    if (!text?.trim()) return undefined
    let entry = notes.get(text)
    if (!entry) { entry = { id: `${id}-note-${notes.size}`, labels: new Set(), resources: new Set(), global: false }; notes.set(text, entry) }
    entry.labels.add(label)
    if (resourceId) entry.resources.add(resourceId)
    else entry.global = true
    return entry.id
  }
  const unknowns: string[] = []
  const unknownId = `${id}-unknown`
  if (!pack.version.label.trim()) unknowns.push("当前版本")
  if (!pack.baseVersion.label.trim()) unknowns.push("基准版本")
  if (!countKnown(summary.count)) unknowns.push("素材总数")
  if (save.state === "unknown") unknowns.push("保存状态")
  if (changes === undefined) unknowns.push("关键变化")
  if (reuseRecords === null) unknowns.push("复用记录")
  for (const [label, text] of [["来源构成", summary.sourceComposition], ["许可摘要", summary.license], ["可用性摘要", summary.availability]]) {
    if (text?.trim()) note(text, label!)
    else unknowns.push(label!)
  }
  note(editBlock, "素材包操作")
  note(save.description, "保存状态")
  for (const change of changes ?? []) note(change, "关键变化")

  function sendPack(type: AgentMaterialPackActionType, intent: AgentMaterialPackIntent) {
    if (!packBlock(type)) onIntent?.(intent)
  }
  function move(item: AgentMaterialPackItem, target: AgentArrangementPosition | undefined, via: Extract<AgentMaterialPackIntent, { type: "move" }>["via"]) {
    if (full && !itemBlock(item, "move") && target && !arrangementMoveBlock(index, [item.resource.resourceId], target)) {
      onIntent?.({ ...context, type: "move", resource: item.resource, target: { categoryId: target.groupId, index: target.index }, via })
    }
  }
  function dragTarget(categoryId: string | null, beforeId: string | null) {
    const active = drag.current
    if (!active || active.revision !== revision || active.items !== items || active.categories !== categories || !full) return
    const item = items.find(item => item.resource.resourceId === active.resourceId)
    if (!item || itemBlock(item, "move")) return
    const target = arrangementDropTarget(index, [active.resourceId], categoryId, beforeId)
    return target && !arrangementMoveBlock(index, [active.resourceId], target) ? { item, target } : undefined
  }
  const dropHandlers = (categoryId: string | null, beforeId: string | null) => ({
    onDragOver: (event: DragEvent) => { if (dragTarget(categoryId, beforeId)) { event.preventDefault(); event.dataTransfer.dropEffect = "move" } },
    onDrop: (event: DragEvent) => {
      const destination = dragTarget(categoryId, beforeId)
      if (destination) { event.preventDefault(); event.stopPropagation(); move(destination.item, destination.target, "drag") }
      drag.current = null
    },
  })

  function actionButton(label: string, type: string, block: string | undefined, onClick: () => void, resourceId?: string, primary = false, icon?: ReactNode, scope?: string) {
    const resource = items.find(item => item.resource.resourceId === resourceId)
    return <Button key={type} type="button" size="navigation" variant={primary ? "default" : "outline"}
      className="max-w-full whitespace-normal break-words" data-material-action={type} disabled={!!block}
      aria-label={`${label}：${scope || (resource ? titleOf(resource) : pack.title || "素材包")}`}
      aria-describedby={note(block, scope ? `${scope} · ${label}` : label, resourceId)} onClick={() => { if (!block) onClick() }}>{icon}{label}</Button>
  }
  const renderItem = (item: AgentMaterialPackItem, ordinal: number) => {
    const resourceId = item.resource.resourceId, anchor = `${id}-resource-${ordinal}`, title = titleOf(item)
    const missing: string[] = [], associations: (string | undefined)[] = []
    const source = item.resource.source
    if (source.label?.trim()) associations.push(note([source.label, source.location].filter(Boolean).join(" · "), "来源", resourceId))
    else missing.push("来源")
    if (!item.versionLabel?.trim()) missing.push("资源版本")
    const licenseReason = item.license.state === "available" ? undefined : reasonOf(item.license.reason, "使用限制未说明。")
    if (item.license.state === "unknown" && !item.license.name && !licenseReason) missing.unshift("许可")
    else associations.push(note([licenseLabels[item.license.state], item.license.name].filter(Boolean).join(" · "), "许可", resourceId))
    associations.push(note(licenseReason, "许可原因", resourceId))
    if (item.availability.state === "unknown" && !item.availability.reason) missing.push("可用性")
    else associations.push(note(availabilityLabels[item.availability.state], "可用性", resourceId))
    associations.push(note(reasonOf(item.availability.reason, "可用性原因未说明。"), "可用性原因", resourceId))
    associations.push(note(reasonOf(item.lockedReason, "此素材已锁定。"), "整理限制", resourceId))
    const buttons = full ? <div className="flex min-w-0 flex-wrap gap-2">
      {(["preview", "open-source", "remove"] as const).map(type => item.actions?.[type] && actionButton(
        { preview: "预览素材", "open-source": "打开来源", remove: "移出素材包" }[type], type, itemBlock(item, type),
        () => onIntent?.({ ...context, type, resource: item.resource }), resourceId))}
      {item.actions?.move && (["up", "down"] as const).map(via => {
        const target = arrangementMoveTarget(index, resourceId, via)
        const block = itemBlock(item, "move") || (!target ? via === "up" ? "已在分类最前，不能上移。" : "已在分类最后，不能下移。" : arrangementMoveBlock(index, [resourceId], target))
        return actionButton(via === "up" ? "上移" : "下移", via, block, () => move(item, target, via), resourceId, false, via === "up" ? <ArrowUp aria-hidden="true" /> : <ArrowDown aria-hidden="true" />)
      })}
    </div> : null
    const moveReason = itemBlock(item, "move")
    const options = [...categories.map(category => ({ id: category.id as string | null, title: category.title })), { id: null, title: "未分类" }]
      .filter(category => category.id !== item.categoryId).map(category => {
        const target = arrangementDropTarget(index, [resourceId], category.id, null)
        return { ...category, target, block: moveReason || arrangementMoveBlock(index, [resourceId], target) }
      })
    const canDrag = full && !!item.actions?.move && !moveReason
    const noteBlock = itemBlock(item, "edit-note")
    const noteId = full && item.actions?.["edit-note"] ? note(noteBlock, "素材备注", resourceId) : undefined
    const descriptions = [...associations, missing.length ? `${anchor}-unknown` : undefined].filter(Boolean).join(" ") || undefined
    return <li key={ordinal} data-material-item={ordinal} aria-labelledby={`${anchor}-title`} aria-describedby={descriptions}
      {...(full ? dropHandlers(item.categoryId, resourceId) : {})} className={compact ? "min-w-0 space-y-2" : "min-w-0 space-y-3"}>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {canDrag && <span aria-hidden="true" data-material-drag={ordinal} draggable className="shrink-0 cursor-grab"
          onDragStart={event => { if (itemBlock(item, "move")) { event.preventDefault(); return }; drag.current = { resourceId, revision, items, categories }; event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", "material-resource") }}
          onDragEnd={() => { drag.current = null }}><GripVertical /></span>}
        <h5 id={`${anchor}-title`} className="min-w-0 break-words text-item-title">{title}</h5>
        <Badge variant="outline">{item.type}</Badge>
        {item.availability.state === "invalid" && <Badge variant="error">来源失效</Badge>}
        {item.availability.state === "restricted" && <Badge variant="warning">访问受限</Badge>}
        {item.license.state === "restricted" && <Badge variant="warning">许可受限</Badge>}
      </div>
      {item.versionLabel?.trim() && <p className="text-ui-hint">资源版本：{item.versionLabel}</p>}
      {missing.length > 0 && <p id={`${anchor}-unknown`} data-material-unknown="resource" className="break-words text-ui-hint">未知：{missing.join("、")}。</p>}
      {full && item.actions?.["edit-note"] && !noteBlock ? <div className="min-w-0 space-y-2"><Label htmlFor={`${anchor}-note`}>素材备注</Label>
        <Textarea id={`${anchor}-note`} data-material-field="edit-note" value={item.note} className="w-full min-w-0" aria-label={`素材备注：${title}`} aria-describedby={noteId}
          onChange={event => { if (!itemBlock(item, "edit-note")) onIntent?.({ ...context, type: "edit-note", resource: item.resource, note: event.target.value }) }} />
      </div> : item.note && <p aria-describedby={noteId} className="whitespace-pre-wrap break-words text-ui-body">备注：{item.note}</p>}
      {buttons}
      {full && item.actions?.move && options.length > 0 && <div className="min-w-0 space-y-2"><Label htmlFor={`${anchor}-category`}>移到分类末尾</Label>
        <Select data-material-category={ordinal} value={null} items={options.map((option, i) => ({ value: String(i), label: option.title }))}
          disabled={!!moveReason || options.every(option => !!option.block)} onValueChange={value => {
            const option = options.find((_, i) => String(i) === value)
            if (option && !option.block) move(item, option.target, "to-category")
          }}>
          <SelectTrigger id={`${anchor}-category`} className="min-w-0 w-full" aria-label={`移到分类末尾：${title}`} aria-describedby={options.map(option => note(option.block, "移动分类", resourceId)).filter(Boolean).join(" ") || undefined}>
            <SelectValue placeholder="选择目标分类" /></SelectTrigger>
          <SelectPopup>{options.map((option, i) => <SelectItem key={i} value={String(i)} disabled={!!option.block}>{option.title}</SelectItem>)}</SelectPopup>
        </Select>
      </div>}
    </li>
  }

  const sections = [...categories.map(category => ({ ...category, members: items.filter(item => item.categoryId === category.id) })),
    ...(items.some(item => item.categoryId === null) ? [{ id: null, title: "未分类", count: uncategorizedCount, members: items.filter(item => item.categoryId === null), lockedReason: undefined }] : []),
    ...(referenceBlock ? [{ id: null, title: "待核对分类", count: null, members: items.filter(item => item.categoryId !== null && !categories.some(category => category.id === item.categoryId)), lockedReason: referenceBlock }] : []),
  ].map((category, categoryIndex) => {
    const anchor = `${id}-category-${categoryIndex}`
    const categoryReason = reasonOf(category.lockedReason, "此分类已锁定。")
    note(categoryReason, category.title)
    const renameBlock = packBlock("category-rename") || categoryReason
    const deleteBlock = packBlock("category-delete") || categoryReason
      || category.members.map(item => reasonOf(item.lockedReason, "此素材已锁定。")).find(Boolean)
    const heading = full && category.id !== null && actions["category-rename"] && !renameBlock
      ? <div className="min-w-0 space-y-2"><Label id={`${anchor}-title`} htmlFor={`${anchor}-name`}>分类名称</Label><Input id={`${anchor}-name`} data-material-field="category-rename" value={category.title} aria-label={`分类名称：${category.title}`}
        className="min-w-0 w-full" onChange={event => { if (!renameBlock && category.id !== null) onIntent?.({ ...context, type: "category-rename", categoryId: category.id, title: event.target.value }) }} /></div>
      : <h4 id={`${anchor}-title`} className="break-words text-item-title">{category.title}</h4>
    if (full && category.id !== null && actions["category-rename"]) note(renameBlock, category.title)
    return <section key={categoryIndex} aria-labelledby={`${anchor}-title`} className={compact ? "min-w-0 space-y-3" : "min-w-0 space-y-4"}>
      {heading}
      <p className="text-ui-hint">{countKnown(category.count) ? `数量：${category.count} 项` : "未知：分类数量。"}</p>
      {full && category.id !== null && actions["category-delete"] && actionButton("删除分类", `category-delete-${categoryIndex}`, deleteBlock,
        () => onIntent?.({ ...context, type: "category-delete", categoryId: category.id!, resources: category.members.map(item => item.resource) }), undefined, false, undefined, category.title)}
      <ol className={compact ? "space-y-4" : "space-y-6"}>{category.members.map(item => renderItem(item, items.indexOf(item)))}</ol>
      {!category.members.length && <p className="text-ui-hint">此分类还没有素材。</p>}
      {full && !referenceBlock && <div data-material-drop-category={categoryIndex} {...dropHandlers(category.id, null)} className="min-h-11 py-3 text-ui-hint text-muted-foreground">分类末尾</div>}
    </section>
  })
  const toolbar = <div className="flex min-w-0 flex-wrap gap-2">
    {(["add-request", "category-create", "reuse-request", "confirm"] as const).map(type => actions[type] && (full || type === "reuse-request" || type === "confirm") && actionButton(
      { "add-request": "查找并添加素材", "category-create": "新建分类", "reuse-request": "用于其他教学对象", confirm: "确认素材包" }[type], type, packBlock(type),
      () => sendPack(type, type === "reuse-request" || type === "confirm" ? { ...context, type, resources: items.map(item => item.resource) } : { ...context, type }), undefined, type === "confirm"))}
    {!full && onExpand && <Button data-material-expand="" type="button" size="navigation" variant="outline" onClick={event => onExpand(event.currentTarget)}>整理素材包<ArrowUpRight aria-hidden="true" /></Button>}
    {full && onBack && <Button type="button" size="navigation" variant="ghost" onClick={onBack}>返回原位置</Button>}
  </div>
  const renameBlock = packBlock("rename-pack")
  const title = full && actions["rename-pack"] && !renameBlock
    ? <div className="min-w-0 space-y-2"><Label id={`${id}-title`} htmlFor={`${id}-name`}>素材包名称</Label><Input id={`${id}-name`} data-material-field="rename-pack" value={pack.title} className="min-w-0 w-full"
      onChange={event => sendPack("rename-pack", { ...context, type: "rename-pack", title: event.target.value })} /></div>
    : <h3 id={`${id}-title`} className="break-words text-block-title">{pack.title || "未命名素材包"}</h3>
  if (full && actions["rename-pack"]) note(renameBlock, "素材包名称")
  const records = reuseRecords?.map((record, ordinal) => {
    const scope = record.resourceIds === undefined ? "素材包" : record.resourceIds.map(resourceId => items.find(item => item.resource.resourceId === resourceId)).map(item => item ? titleOf(item) : "未提供名称的原素材").join("、") || "引用范围未知"
    const descriptionId = note(record.description, "复用说明")
    return <li key={ordinal} className="min-w-0 space-y-1" aria-describedby={descriptionId} data-material-reuse="">
      <p className="break-words text-ui-body">{scope} → {record.target.label || "引用对象名称未知"}</p>
      <p className="break-words text-ui-hint">{record.target.versionLabel ? `对象版本：${record.target.versionLabel}` : "未知：对象版本。"}{record.target.location && ` · ${record.target.location}`}</p>
    </li>
  })
  const previewItem = preview && preview.requestedBy === "user" && preview.packId === pack.id && preview.versionId === pack.version.id && preview.baseVersionId === pack.baseVersion.id
    ? items.find(item => item.resource.resourceId === preview.resourceId && item.resource.versionId === preview.resourceVersionId && !itemBlock(item, "preview")) : undefined
  return <Card aria-labelledby={`${id}-title`} data-agent-material-view={view} data-agent-material-density={density}
    className={compact ? "min-w-0 gap-3 p-4 [overflow-wrap:anywhere]" : "min-w-0 gap-5 p-5 sm:p-6 [overflow-wrap:anywhere]"}>
    <header className="min-w-0 space-y-2"><p className="text-ui-hint text-muted-foreground">{pack.snapshot !== undefined ? `历史素材包 · ${pack.snapshot || "当时记录"}` : "当前素材包"}</p>{title}
      <p className="break-words text-ui-hint">{[pack.version.label && `包版本：${pack.version.label}`, pack.baseVersion.label && `基于：${pack.baseVersion.label}`, countKnown(summary.count) && `素材总数：${summary.count} 项`].filter(Boolean).join(" · ")}</p>
      {save.state !== "unknown" && <Badge variant={save.state === "error" || save.state === "conflict" ? "error" : "outline"}>{saveLabels[save.state]}</Badge>}
      {changes?.length === 0 && <p className="text-ui-hint">未记录关键变化。</p>}
      {unknowns.length > 0 && <p id={unknownId} data-material-unknown="pack" className="break-words text-ui-hint">未知：{unknowns.join("、")}。</p>}
    </header>
    <div className="min-w-0 space-y-2" data-material-explanations="">{[...notes].map(([text, entry]) => {
      const all = entry.global || items.length > 0 && items.every(item => entry.resources.has(item.resource.resourceId))
      const scope = all ? "" : items.filter(item => entry.resources.has(item.resource.resourceId)).map(titleOf).join("、")
      return <p key={entry.id} id={entry.id} className="break-words text-ui-hint">{[scope, [...entry.labels].join("／")].filter(Boolean).join(" · ")}：{text}</p>
    })}</div>
    <p data-material-boundary="" className="text-ui-hint text-muted-foreground">{notice}</p>
    {toolbar}
    {!items.length && !categories.length && <p role="status" className="text-ui-hint">素材包中还没有素材。</p>}
    {sections}
    {reuseRecords !== null && <section aria-label="复用记录" className="min-w-0 space-y-2"><h4 className="text-item-title">复用记录</h4>
      {reuseRecords.length === 0 ? <p className="text-ui-hint">暂无复用记录。</p> : <ul className="space-y-3">{records}</ul>}
    </section>}
    {previewItem && preview && <section aria-label="素材预览" data-material-preview="" className="min-w-0 space-y-3"><h4 className="text-item-title">素材预览</h4>
      {preview.state === "ready" ? renderPreview?.(previewItem, { view, density }) : <p role="status" className="text-ui-hint">{preview.message || (preview.state === "loading" ? "正在加载素材预览。" : "素材预览暂不可用。")}</p>}
    </section>}
    <RecordDetails>{details}</RecordDetails>
  </Card>
}
