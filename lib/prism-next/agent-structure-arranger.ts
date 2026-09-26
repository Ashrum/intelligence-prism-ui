/** Ordered references, not the content hierarchy edited by semantic 35. */
export type AgentArrangementVersion = { id: string; label: string }
export type AgentArrangement = {
  id: string
  title: string
  version: AgentArrangementVersion
  baseVersion?: AgentArrangementVersion
  /** Presence marks a host-supplied historical, read-only projection. */
  snapshot?: string
}
export type AgentArrangementAction = { disabledReason?: string }
export type AgentArrangementSource = { objectId: string; versionId?: string; label: string }
export type AgentArrangementAttribute = {
  id: string
  label: string
  description?: string
  readOnlyReason?: string
} & (
  | { type: "number"; value: number | null; unit?: string; step?: number }
  | { type: "select"; value: string | null; options: readonly { value: string; label: string; disabledReason?: string }[] }
)
export type AgentArrangementItem = {
  id: string
  title: string
  type: string
  source: AgentArrangementSource | null
  groupId: string | null
  attributes: readonly AgentArrangementAttribute[]
  description?: string
  lockedReason?: string
  open?: AgentArrangementAction
}
export type AgentArrangementGroup = { id: string; title: string; description?: string; lockedReason?: string }
export type AgentArrangementSummary = {
  groupCount?: number | null
  itemCount?: number | null
  itemCountLabel?: string
  totalScore?: number | null
  targetScore?: number | null
}
export type AgentArrangementValidation = {
  level: "error" | "warning" | "hint"
  message: string
  /** No target means the whole arrangement. */
  target?: { itemId: string; attributeId?: string } | { groupId: string }
}
export type AgentArrangementSave = {
  state: "unsaved" | "saving" | "saved-draft" | "submitted" | "conflict" | "unconfirmed" | "error" | "unknown"
  description?: string
}
export type AgentArrangementActions = Partial<Record<"move" | "groupCreate" | "groupRename" | "groupDelete" | "setAttribute" | "batchMove" | "batchSetAttribute" | "confirm", AgentArrangementAction>>
export type AgentArrangementPosition = {
  groupId: string | null
  /** Final zero-based position AFTER removing all moving items, as in semantic 35. */
  index: number
}
export type AgentArrangementMoveMethod = "up" | "down" | "drag" | "to-group"
export type AgentStructureArrangerIntent = { structureId: string; versionId: string; baseVersionId: string } & (
  | { type: "move"; itemId: string; target: AgentArrangementPosition; via: AgentArrangementMoveMethod }
  | { type: "group-create" }
  | { type: "group-rename"; groupId: string; title: string }
  | { type: "group-delete"; groupId: string }
  | { type: "set-attribute"; itemId: string; attributeId: string; value: number | string | null }
  | { type: "batch-move"; itemIds: readonly string[]; target: AgentArrangementPosition }
  | { type: "batch-set-attribute"; itemIds: readonly string[]; attributeId: string; value: number | string | null }
  | { type: "open-item"; itemId: string; source: AgentArrangementSource }
  | { type: "confirm" }
)

export const arrangementHasId = (id?: string) => typeof id === "string" && !!id.trim()
export const arrangementReason = (value: string | undefined, fallback: string) => value === undefined ? undefined : value || fallback
export type ArrangementIndex = {
  items: readonly AgentArrangementItem[]
  groups: readonly AgentArrangementGroup[]
  itemMap: Map<string, AgentArrangementItem>
  groupMap: Map<string, AgentArrangementGroup>
  error?: string
}
const uniqueIds = (items: readonly { id: string }[]) => items.every(item => arrangementHasId(item.id)) && new Set(items.map(item => item.id)).size === items.length
export function indexArrangement(items: readonly AgentArrangementItem[], groups: readonly AgentArrangementGroup[]): ArrangementIndex {
  const groupMap = new Map(groups.map(group => [group.id, group]))
  const valid = uniqueIds(items) && uniqueIds(groups) && items.every(item =>
    (item.groupId === null || groupMap.has(item.groupId)) && uniqueIds(item.attributes) && item.attributes.every(attribute =>
      attribute.type !== "select" || new Set(attribute.options.map(option => option.value)).size === attribute.options.length))
  return { items, groups, itemMap: new Map(items.map(item => [item.id, item])), groupMap,
    error: valid ? undefined : "编排暂不可用，请重新核对条目与分组。" }
}
export const arrangementSiblings = (index: ArrangementIndex, groupId: string | null) => index.items.filter(item => item.groupId === groupId)
export function arrangementItemBlock(index: ArrangementIndex, itemId: string) {
  const item = index.itemMap.get(itemId)
  if (!item) return "所选条目已变化，请重新选择。"
  return arrangementReason(item.lockedReason, "此条目已锁定。")
    || (item.groupId === null ? undefined : arrangementReason(index.groupMap.get(item.groupId)?.lockedReason, "此分组已锁定。"))
}
/** Same sibling up/down and remove-before-insert convention as structureMoveTarget (35). */
export function arrangementMoveTarget(index: ArrangementIndex, itemId: string, via: "up" | "down"): AgentArrangementPosition | undefined {
  const item = index.itemMap.get(itemId)
  if (!item) return
  const siblings = arrangementSiblings(index, item.groupId)
  const position = siblings.findIndex(entry => entry.id === itemId)
  if (via === "up" && position > 0) return { groupId: item.groupId, index: position - 1 }
  if (via === "down" && position < siblings.length - 1) return { groupId: item.groupId, index: position + 1 }
}
/** A list drop before a row, or at a group end; no optimistic reorder. */
export function arrangementDropTarget(index: ArrangementIndex, itemIds: readonly string[], groupId: string | null, beforeId: string | null): AgentArrangementPosition | undefined {
  const remaining = arrangementSiblings(index, groupId).filter(item => !itemIds.includes(item.id))
  if (beforeId !== null && !remaining.some(item => item.id === beforeId)) return
  return { groupId, index: beforeId === null ? remaining.length : remaining.findIndex(item => item.id === beforeId) }
}
export function arrangementSelectionBlock(index: ArrangementIndex, itemIds: readonly string[]) {
  if (!itemIds.length) return "请先选择条目。"
  if (new Set(itemIds).size !== itemIds.length || itemIds.some(id => !index.itemMap.has(id))) return "所选条目已变化，请重新选择。"
  return itemIds.map(id => arrangementItemBlock(index, id)).find(Boolean)
}
export function arrangementMoveBlock(index: ArrangementIndex, itemIds: readonly string[], target?: AgentArrangementPosition) {
  if (index.error) return index.error
  const selectionBlock = arrangementSelectionBlock(index, itemIds)
  if (selectionBlock) return selectionBlock
  if (!target) return "当前位置无法这样调整。"
  if (target.groupId !== null && !index.groupMap.has(target.groupId)) return "目标分组已变化。"
  const targetLock = target.groupId === null ? undefined : arrangementReason(index.groupMap.get(target.groupId)?.lockedReason, "此分组已锁定。")
  if (targetLock) return targetLock
  const siblings = arrangementSiblings(index, target.groupId)
  const remaining = siblings.filter(item => !itemIds.includes(item.id))
  if (!Number.isInteger(target.index) || target.index < 0 || target.index > remaining.length) return "目标位置暂不可用。"
  const sources = index.items.filter(item => itemIds.includes(item.id))
  // Position checks only. These arrays never become component state or rendered facts.
  const proposed = [...remaining.slice(0, target.index), ...sources, ...remaining.slice(target.index)]
  if (sources.every(item => item.groupId === target.groupId) && proposed.every((item, i) => item.id === siblings[i]?.id)) return "条目已在此位置。"
  // A locked position cannot be moved indirectly by another item crossing it.
  for (const item of index.items) {
    const lock = arrangementItemBlock(index, item.id)
    if (!lock || itemIds.includes(item.id)) continue
    const before = arrangementSiblings(index, item.groupId)
    const after = item.groupId === target.groupId ? proposed : before.filter(entry => !itemIds.includes(entry.id))
    if (before.findIndex(entry => entry.id === item.id) !== after.findIndex(entry => entry.id === item.id)) return lock
  }
}
export function arrangementAttributeValueAllowed(attribute: AgentArrangementAttribute, value: number | string | null) {
  if (attribute.readOnlyReason !== undefined) return false
  if (attribute.type === "number") return value === null || typeof value === "number" && Number.isFinite(value)
  return value === null || typeof value === "string" && attribute.options.filter(option => option.value === value).length === 1
    && attribute.options.find(option => option.value === value)?.disabledReason === undefined
}
