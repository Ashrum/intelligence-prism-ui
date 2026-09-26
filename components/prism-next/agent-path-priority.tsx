"use client"

import { useId, useRef, type DragEvent, type ReactNode } from "react"
import { GripVertical } from "lucide-react"
import { Card } from "@/components/coss/card"
import { Label } from "@/components/coss/label"
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from "@/components/coss/select"
import { Badge } from "./badge"
import { Button } from "./button"
import { RecordDetails, type AgentRecordViewProps } from "./agent-record-parts"

export type AgentPathVersion = { id: string; label: string }
export type AgentPath = { id: string; title: string; version: AgentPathVersion; baseVersion?: AgentPathVersion; snapshot?: string }
export type AgentPathAction = { disabledReason?: string }
export type AgentPathOption = AgentPathAction & { id: string; label: string }
export type AgentPathSnoozeOption = AgentPathOption & { until: string }
export type AgentPathStatus =
  | { state: "not-started" | "in-progress" | "completed" | "skipped" | "expired" | "unknown" }
  | { state: "blocked"; reason: string }
  | { state: "snoozed"; until: string | null }
export type AgentPathDependency = {
  id: string; title: string; state: "met" | "unmet" | "unknown"
  /** Only an explicitly supplied capability may request resolution. */
  resolve?: AgentPathAction
}
export type AgentPathItemActions = {
  reorder?: AgentPathAction
  "set-priority"?: AgentPathAction & { options: readonly AgentPathOption[] }
  skip?: AgentPathAction & { options: readonly AgentPathOption[] }
  snooze?: AgentPathAction & { options: readonly AgentPathSnoozeOption[] }
  restore?: AgentPathAction
  "open-item"?: AgentPathAction
  "accept-next"?: AgentPathAction
}
export type AgentPathItem = {
  id: string; title: string; type: string; kind: "suggestion" | "todo"; status: AgentPathStatus
  priority: { label: string | null; reason: string | null; evidence: string | null; certainty: string | null; score?: number | null }
  dependencies: readonly AgentPathDependency[] | null
  description?: string; content?: ReactNode; lockedReason?: string; actions?: AgentPathItemActions
}
export type AgentPathSave = { state: "unsaved" | "saving" | "saved" | "conflict" | "error" | "unconfirmed" | "unknown"; description?: string }
type PathContext = { pathId: string; versionId: string; baseVersionId: string }
export type AgentPathPriorityIntent = PathContext & (
  | { type: "reorder"; itemId: string; toIndex: number; via: "up" | "down" | "drag" | "to-position" }
  | { type: "set-priority" | "skip"; itemId: string; optionId: string }
  | { type: "snooze"; itemId: string; optionId: string; until: string }
  | { type: "restore" | "open-item" | "accept-next"; itemId: string }
  | { type: "mark-dependency-resolved"; itemId: string; dependencyId: string }
)
export type AgentPathPriorityProps = AgentRecordViewProps & {
  path: AgentPath; items: readonly AgentPathItem[]
  /** Page-selected 0–3 next items, in the exact desired presentation order. null means unknown. */
  nextItemIds: readonly string[] | null
  /** Page-declared blockers; not inferred from status or dependency relationships. */
  blockerItemIds: readonly string[] | null
  save?: AgentPathSave; readOnlyReason?: string
  onIntent?: (intent: AgentPathPriorityIntent) => void; onBack?: () => void; notice?: string
}

const statusLabels = { "not-started": "待开始", "in-progress": "进行中", completed: "已完成", blocked: "受阻", skipped: "已跳过", snoozed: "冷却中", expired: "已到期", unknown: "未知" }
const saveLabels = { unsaved: "未保存", saving: "保存中", saved: "已保存", conflict: "版本冲突", error: "保存失败", unconfirmed: "保存回执未确认", unknown: "未知" }
const hasId = (value: string) => !!value.trim()
const unique = (values: readonly string[]) => values.every(hasId) && new Set(values).size === values.length
const known = (value: string | null | undefined) => !!value?.trim() && value !== "未知"
const limitation = (value: string | undefined, fallback: string) => value === undefined ? undefined : value || fallback

/** An ordered projection of page facts, never a path calculator or an execution controller. */
export function AgentPathPriority({ path, items, nextItemIds, blockerItemIds, save = { state: "unknown" }, readOnlyReason,
  onIntent, view = "inline", density = "default", onExpand, onBack, details,
  notice = "建议与待办分别记录；跳过或冷却不会取消已有工作，接受下一步仅提交请求。",
}: AgentPathPriorityProps) {
  const id = useId(), workspace = view === "workspace"
  const drag = useRef<{ itemId: string; revision: string; items: typeof items } | null>(null)
  const context: PathContext = { pathId: path.id, versionId: path.version.id, baseVersionId: path.baseVersion?.id ?? "" }
  const revision = JSON.stringify(context)
  const validItems = unique(items.map(item => item.id))
  const validSelection = (values: readonly string[] | null, limit = Infinity) => values === null || (values.length <= limit && unique(values) && values.every(value => items.some(item => item.id === value)))
  const nextValid = validSelection(nextItemIds, 3), blockersValid = validSelection(blockerItemIds)
  const identityBlock = !Object.values(context).every(hasId) ? "路径身份或版本未确认，暂不能操作。" : undefined
  const shapeBlock = !validItems || items.some(item => item.dependencies && !unique(item.dependencies.map(dep => dep.id))) ? "路径记录有重复或缺失，请重新核对。" : undefined
  const globalBlock = shapeBlock || identityBlock || (path.snapshot !== undefined ? "历史路径只读。" : undefined)
    || limitation(readOnlyReason, "当前路径只读。")
    || (["saving", "conflict", "unconfirmed"].includes(save.state) ? save.description || `${saveLabels[save.state]}，请先核对。` : undefined)
    || (!onIntent ? "当前仅可查看路径。" : undefined)

  // A single explanation can serve multiple fields, controls and rows. Scope numbers are path positions.
  const notes = new Map<string, { id: string; scopes: Set<number>; labels: Set<string> }>()
  function note(text: string | undefined, scope: number, label: string) {
    if (!text) return undefined
    let entry = notes.get(text)
    if (!entry) { entry = { id: `${id}-note-${notes.size}`, scopes: new Set(), labels: new Set() }; notes.set(text, entry) }
    entry.scopes.add(scope); entry.labels.add(label)
    return entry.id
  }
  note(globalBlock, 0, "操作限制")
  note(save.description, 0, "保存说明")
  if (!nextValid) note("下一步范围需为当前路径中不重复的 1–3 项；没有建议时请提供空列表。", 0, "范围待核对")
  if (!blockersValid) note("阻塞项范围已变化，请重新核对。", 0, "范围待核对")
  const globalUnknown = [!known(path.version.label) && "当前版本", !known(path.baseVersion?.label) && "基准版本", save.state === "unknown" && "保存状态", nextItemIds === null && "下一步建议", blockerItemIds === null && "阻塞项"].filter(Boolean)

  function actionBlock(item: AgentPathItem, type: keyof AgentPathItemActions) {
    const capability = item.actions?.[type]
    const block = (type === "open-item" ? shapeBlock || identityBlock || (!onIntent ? "当前无法打开内容。" : undefined) : globalBlock || limitation(item.lockedReason, "此项暂不可调整。"))
      || (!capability ? "此操作暂不可用。" : limitation(capability.disabledReason, "此操作暂不可用。"))
    if (block) return block
    if (type === "accept-next" && (item.kind !== "suggestion" || !nextValid || !nextItemIds?.includes(item.id) || item.status.state !== "not-started")) return "此项不是可接受的下一步建议。"
    if ((type === "skip" || type === "snooze") && !["not-started", "in-progress", "blocked"].includes(item.status.state)) return "请先核对当前状态，再决定跳过或冷却。"
    if (type === "restore" && !["skipped", "snoozed", "expired"].includes(item.status.state)) return "只有已跳过、冷却中或已到期的内容可请求恢复。"
  }
  function moveBlock(item: AgentPathItem, toIndex: number) {
    const block = actionBlock(item, "reorder"), fromIndex = items.indexOf(item)
    if (block) return block
    if (!Number.isInteger(toIndex) || toIndex < 0 || toIndex >= items.length || toIndex === fromIndex) return "请选择不同的有效位置。"
    return items.slice(Math.min(fromIndex, toIndex), Math.max(fromIndex, toIndex) + 1).map(target => limitation(target.lockedReason, "此位置暂不可调整。") || limitation(target.actions?.reorder?.disabledReason, "此位置暂不可调整。")).find(Boolean)
  }
  function move(item: AgentPathItem, toIndex: number, via: "up" | "down" | "drag" | "to-position") {
    if (workspace && !moveBlock(item, toIndex)) onIntent?.({ ...context, type: "reorder", itemId: item.id, toIndex, via })
  }
  function dragTarget(beforeIndex: number) {
    const active = drag.current
    if (!workspace || !active || active.revision !== revision || active.items !== items) return
    const fromIndex = items.findIndex(item => item.id === active.itemId), item = items[fromIndex]
    const toIndex = beforeIndex - (fromIndex < beforeIndex ? 1 : 0)
    if (item && !moveBlock(item, toIndex)) return { item, toIndex }
  }
  const dropHandlers = (beforeIndex: number) => ({
    onDragOver: (event: DragEvent) => { if (dragTarget(beforeIndex)) { event.preventDefault(); event.dataTransfer.dropEffect = "move" } },
    onDrop: (event: DragEvent) => {
      const target = dragTarget(beforeIndex)
      if (target) { event.preventDefault(); event.stopPropagation(); move(target.item, target.toIndex, "drag") }
      drag.current = null
    },
  })

  function button(item: AgentPathItem, scope: number, type: keyof AgentPathItemActions, label: string, emit: () => void, extraBlock?: string) {
    if (!item.actions?.[type]) return null
    const block = actionBlock(item, type) || extraBlock
    return <Button type="button" size="navigation" variant={type === "accept-next" ? "default" : "outline"}
      data-path-action={type} disabled={!!block} aria-describedby={note(block, scope, "操作限制")}
      onClick={() => { if (!block) emit() }}>{label}</Button>
  }
  function picker(item: AgentPathItem, scope: number, type: "set-priority" | "skip" | "snooze") {
    const capability = item.actions?.[type]
    if (!capability) return null
    const { options } = capability, label = { "set-priority": "调整优先级", skip: "跳过选项", snooze: "冷却至" }[type]
    const block = actionBlock(item, type) || (!options.length || !unique(options.map(option => option.id)) ? "可用选项尚未确认。" : undefined)
    const anchor = `${id}-choice-${scope}-${type}`
    const optionBlock = (option: AgentPathOption) => limitation(option.disabledReason, "此选项暂不可用。") || (type === "snooze" && !(option as AgentPathSnoozeOption).until?.trim() ? "冷却结束时间未确认。" : undefined)
    const describedBy = [note(block, scope, "操作限制"), ...options.map(option => note(optionBlock(option), scope, option.label))].filter(Boolean).join(" ") || undefined
    return <div className="min-w-0 space-y-2"><Label id={`${anchor}-label`} htmlFor={anchor}>{label}</Label>
      <Select value={null} disabled={!!block} items={options.map((option, index) => ({ value: String(index), label: option.label }))} data-path-choice={type}
        onValueChange={value => {
          if (block) return
          const option = options.find((_, index) => String(index) === value)
          if (!option || optionBlock(option)) return
          if (type === "snooze") onIntent?.({ ...context, type, itemId: item.id, optionId: option.id, until: (option as AgentPathSnoozeOption).until })
          else onIntent?.({ ...context, type, itemId: item.id, optionId: option.id })
        }}>
        <SelectTrigger id={anchor} className="w-full min-w-0" aria-labelledby={`${anchor}-label`} aria-describedby={describedBy}><SelectValue placeholder="请选择" /></SelectTrigger>
        <SelectPopup>{options.map((option, index) => <SelectItem key={index} value={String(index)} disabled={!!optionBlock(option)}>{option.label}</SelectItem>)}</SelectPopup>
      </Select>
    </div>
  }
  function positionPicker(item: AgentPathItem, scope: number) {
    if (!item.actions?.reorder) return null
    const block = actionBlock(item, "reorder"), anchor = `${id}-position-${scope}`
    const options = items.map((_, index) => ({ value: String(index), label: `第 ${index + 1} 位` }))
    const reasons = items.flatMap((_, index) => index === scope - 1 ? [] : [note(moveBlock(item, index), scope, "位置限制")])
    return <div className="min-w-0 space-y-2"><Label id={`${anchor}-label`} htmlFor={anchor}>移到位置</Label>
      <Select value={String(scope - 1)} items={options} disabled={!!block} data-path-choice="to-position" onValueChange={value => {
        const index = options.findIndex(option => option.value === value)
        if (index >= 0) move(item, index, "to-position")
      }}><SelectTrigger id={anchor} className="w-full min-w-0" aria-labelledby={`${anchor}-label`} aria-describedby={[note(block, scope, "操作限制"), ...reasons].filter(Boolean).join(" ") || undefined}><SelectValue /></SelectTrigger>
        <SelectPopup>{options.map((option, index) => <SelectItem key={index} value={option.value} disabled={!!moveBlock(item, index)}>{option.label}</SelectItem>)}</SelectPopup>
      </Select>
    </div>
  }

  const nextIds = nextValid ? nextItemIds ?? [] : [], blockerIds = blockersValid ? blockerItemIds ?? [] : []
  const visibleItems = validItems ? (workspace ? [...items] : [...nextIds, ...blockerIds.filter(value => !nextIds.includes(value))].map(value => items.find(item => item.id === value)!)) : []
  const rows = visibleItems.map(item => {
    const index = items.indexOf(item), scope = index + 1, priority = item.priority, status = item.status
    const unknown = [!known(item.type) && "类型", status.state === "unknown" && "状态", !known(priority.label) && "优先级", !known(priority.reason) && "优先级理由", !known(priority.evidence) && "依据", !known(priority.certainty) && "确定性", item.dependencies === null && "依赖"]
    if (priority.score !== undefined && (priority.score === null || !Number.isFinite(priority.score))) unknown.push("优先级得分")
    if (status.state === "snoozed" && !known(status.until)) unknown.push("冷却结束时间")
    if (status.state === "blocked" && !known(status.reason)) unknown.push("受阻原因")
    if (item.description !== item.title) note(item.description, scope, "说明")
    if (known(priority.reason)) note(priority.reason!, scope, "优先级理由")
    if (known(priority.evidence)) note(priority.evidence!, scope, "依据")
    if (status.state === "blocked" && known(status.reason)) note(status.reason, scope, "受阻原因")
    note(limitation(item.lockedReason, "此项暂不可调整。"), scope, "操作限制")
    const controls = <div className="min-w-0 space-y-3">
      <div className="flex flex-wrap gap-2">
        {button(item, scope, "open-item", "打开内容", () => onIntent?.({ ...context, type: "open-item", itemId: item.id }))}
        {button(item, scope, "accept-next", "接受下一步建议", () => onIntent?.({ ...context, type: "accept-next", itemId: item.id }))}
        {button(item, scope, "restore", "请求恢复", () => onIntent?.({ ...context, type: "restore", itemId: item.id }))}
        {workspace && index > 0 && button(item, scope, "reorder", "上移", () => move(item, index - 1, "up"), moveBlock(item, index - 1))}
        {workspace && index < items.length - 1 && button(item, scope, "reorder", "下移", () => move(item, index + 1, "down"), moveBlock(item, index + 1))}
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,12rem),1fr))] gap-3">{workspace && positionPicker(item, scope)}{workspace && picker(item, scope, "set-priority")}{picker(item, scope, "skip")}{picker(item, scope, "snooze")}</div>
    </div>
    const dependencies = item.dependencies && <div className="min-w-0 space-y-2"><p className="text-ui-hint">{item.dependencies.length ? "前置依赖" : "无前置依赖"}</p>
      {item.dependencies.length > 0 && <ul className="min-w-0 space-y-2">{item.dependencies.map((dep, depIndex) => {
        const block = globalBlock || limitation(item.lockedReason, "此项暂不可调整。") || limitation(dep.resolve?.disabledReason, "此依赖暂不可标记。") || (dep.state !== "unmet" ? "仅可请求标记尚未满足的依赖。" : undefined)
        const describedBy = dep.resolve ? note(block, scope, "依赖操作限制") : undefined
        return <li key={depIndex} className="min-w-0 space-y-2"><p className="break-words text-ui-hint">{dep.title || "前置名称未知"} · {dep.state === "met" ? "已满足" : dep.state === "unmet" ? "未满足" : "满足情况未知"}</p>
          {workspace && dep.resolve && <Button type="button" size="navigation" variant="outline" data-path-action="mark-dependency-resolved" disabled={!!block} aria-describedby={describedBy} aria-label={`标记依赖已满足：${dep.title || "前置名称未知"}`}
            onClick={() => { if (!block) onIntent?.({ ...context, type: "mark-dependency-resolved", itemId: item.id, dependencyId: dep.id }) }}>标记已满足</Button>}
        </li>
      })}</ul>}
    </div>
    return { item, index, scope, controls, dependencies, unknown: unknown.filter(Boolean) }
  })
  function renderNotes(scope: number) {
    const entries = [...notes].filter(([, entry]) => scope === 0 ? entry.scopes.has(0) || entry.scopes.size > 1 : entry.scopes.size === 1 && entry.scopes.has(scope))
    return entries.length > 0 && <ul className="min-w-0 space-y-2" aria-label={scope === 0 ? "路径共用说明" : "理由与限制"}>{entries.map(([text, entry]) => <li key={entry.id} id={entry.id} className="break-words text-ui-hint">
      {scope === 0 && !entry.scopes.has(0) && `适用顺序 ${[...entry.scopes].join("、")} · `}{[...entry.labels].join("、")}：{text}
    </li>)}</ul>
  }
  function renderList(selectedRows: typeof rows, label: string) {
    return <ol aria-label={label} className={density === "compact" ? "min-w-0 space-y-4" : "min-w-0 space-y-6"}>{selectedRows.map(({ item, index, scope, controls, dependencies, unknown }) => {
      const { status, priority } = item
      return <li key={item.id} value={scope} className="min-w-0 space-y-3" {...dropHandlers(index)}
        aria-describedby={[...notes.values()].filter(entry => entry.scopes.has(scope)).map(entry => entry.id).join(" ") || undefined}>
        <div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0 flex-1 space-y-1">
          <p className="text-ui-hint">{[`顺序 ${scope}`, known(item.type) && item.type].filter(Boolean).join(" · ")}</p>
          <h3 className="break-words text-item-title">{item.title || "名称未提供"}</h3>
        </div>{workspace && item.actions?.reorder && <span draggable={!actionBlock(item, "reorder")} data-path-drag={scope} aria-label="拖动调整顺序；也可使用移动按钮" className="shrink-0 p-2"
          onDragStart={event => { if (actionBlock(item, "reorder")) { event.preventDefault(); return }; drag.current = { itemId: item.id, revision, items }; event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", "path-item") }}
          onDragEnd={() => { drag.current = null }}><GripVertical aria-hidden="true" /></span>}</div>
        <div className="flex flex-wrap gap-2"><Badge variant="outline">{item.kind === "suggestion" ? "建议" : "待办"}</Badge>
          {status.state !== "unknown" && <Badge variant={status.state === "blocked" || status.state === "expired" ? "warning" : status.state === "completed" ? "success" : "outline"}>{statusLabels[status.state]}</Badge>}
          {workspace && nextIds.includes(item.id) && <Badge variant="outline">下一步</Badge>}{blockerIds.includes(item.id) && <Badge variant="warning">阻塞项</Badge>}
        </div>
        {status.state === "snoozed" && known(status.until) && <p className="text-ui-hint">冷却至：{status.until}</p>}
        {(known(priority.label) || (typeof priority.score === "number" && Number.isFinite(priority.score)) || known(priority.certainty)) && <p className="break-words text-ui-hint">{[known(priority.label) && `优先级：${priority.label}`, typeof priority.score === "number" && Number.isFinite(priority.score) && `得分：${priority.score}`, known(priority.certainty) && `确定性：${priority.certainty}`].filter(value => value !== false).join(" · ")}</p>}
        {unknown.length > 0 && <p className="break-words text-ui-hint" data-path-unknown="item">未知：{unknown.join("、")}。</p>}
        {renderNotes(scope)}{item.content && <div className="max-w-full overflow-x-auto text-read-body">{item.content}</div>}{dependencies}{controls}
      </li>
    })}</ol>
  }
  return <Card data-agent-path-view={view} data-density={density} className={`min-w-0 ${density === "compact" ? "gap-3 p-3" : "gap-5 p-5"}`} aria-labelledby={`${id}-title`}>
    <header className="min-w-0 space-y-3"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 flex-1 space-y-2">
      <p className="text-ui-hint">{path.snapshot !== undefined ? ["历史路径", path.snapshot].filter(Boolean).join(" · ") : "当前路径"}</p><h2 id={`${id}-title`} className="break-words text-block-title">{path.title}</h2>
    </div>{workspace && onBack && <Button type="button" size="navigation" variant="outline" onClick={onBack}>返回原位置</Button>}</div>
      {(known(path.version.label) || known(path.baseVersion?.label)) && <p className="text-ui-hint">{[known(path.version.label) && `版本：${path.version.label}`, known(path.baseVersion?.label) && `基于：${path.baseVersion?.label}`].filter(Boolean).join(" · ")}</p>}
      {save.state !== "unknown" && <Badge variant={save.state === "error" || save.state === "conflict" ? "warning" : "outline"}>{saveLabels[save.state]}</Badge>}
    </header>
    {globalUnknown.length > 0 && <p className="break-words text-ui-hint" data-path-unknown="path">未知：{globalUnknown.join("、")}。</p>}
    {renderNotes(0)}
    {workspace ? <section className="min-w-0 space-y-3"><h3 className="text-block-title">完整路径</h3>{renderList(rows, "完整路径顺序")}
      {!items.length && <p className="text-ui-hint">暂无路径内容。</p>}
      {items.some(item => item.actions?.reorder) && <div className="p-2 text-ui-hint" {...dropHandlers(items.length)}>可拖至此处移到末尾，也可使用“移到位置”。</div>}
    </section> : <>
      {rows.some(row => nextIds.includes(row.item.id)) && <section className="min-w-0 space-y-3"><h3 className="text-block-title">下一步建议</h3>{renderList(rows.filter(row => nextIds.includes(row.item.id)), "下一步建议顺序")}</section>}
      {nextItemIds !== null && nextValid && !nextIds.length && <p className="text-ui-hint">暂无下一步建议。</p>}
      {blockerItemIds !== null && blockersValid && <section className="min-w-0 space-y-3"><h3 className="text-block-title">阻塞项</h3>{renderList(rows.filter(row => !nextIds.includes(row.item.id)), "阻塞项顺序")}
        {!blockerIds.length ? <p className="text-ui-hint">无阻塞项。</p> : blockerIds.some(value => nextIds.includes(value)) && <p className="text-ui-hint">下一步中的阻塞项已在上方标明。</p>}
      </section>}
      {onExpand && <Button type="button" size="navigation" variant="outline" onClick={event => onExpand(event.currentTarget)}>展开完整路径</Button>}
    </>}
    <p className="text-ui-hint">{notice}</p><RecordDetails>{details}</RecordDetails>
  </Card>
}
