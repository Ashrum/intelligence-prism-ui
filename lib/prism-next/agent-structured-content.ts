import type { ReactNode } from "react"

export type AgentStructureVersion = { id: string; label: string }
export type AgentStructure = {
  id: string
  title: string
  version: AgentStructureVersion
  baseVersion?: AgentStructureVersion
  /** Presence, including an empty label, marks a read-only historical snapshot. */
  snapshot?: string
  currentVersion?: AgentStructureVersion
}
export type AgentStructureCapabilityKind = "view" | "rename" | "add" | "delete" | "move" | "nest"
export type AgentStructureCapability =
  | { status: "supported"; reason?: string }
  | { status: "limited" | "unsupported"; reason: string }
export type AgentStructureCapabilities = Record<AgentStructureCapabilityKind, AgentStructureCapability>
export type AgentStructureNodeStatus =
  | { state: "normal" | "added" | "modified" | "deleted" }
  | { state: "conflict" | "readonly"; reason: string }
/** A host projection of a hierarchy, not a shared content AST. Root level is 1. */
export type AgentStructureNode = {
  id: string
  title: string
  type: string
  level: number
  summary?: ReactNode
  status: AgentStructureNodeStatus
  children?: readonly AgentStructureNode[]
  /** Optional restrictions, never an override granting a globally unsupported operation. */
  capabilities?: Partial<Omit<AgentStructureCapabilities, "view">>
}
export type AgentStructureSave = {
  state: "unsaved" | "saved-draft" | "submitted" | "conflict" | "unknown"
  description?: string
}
export type AgentStructurePosition = {
  parentId: string | null
  /** Zero-based final index, after removing the moving node from its old parent. */
  index: number
}
export type AgentStructureSelection = { structureId: string; versionId: string; nodeId: string }
export type AgentStructureMoveMethod = "up" | "down" | "outdent" | "indent" | "drag"
export type AgentStructuredContentIntent = {
  structureId: string
  versionId: string
  baseVersionId: string
} & (
  | { type: "rename"; nodeId: string; title: string }
  | { type: "add"; nodeId: string | null; placement: "child" | "after" | "root"; target: AgentStructurePosition }
  | { type: "delete"; nodeId: string }
  | { type: "move"; nodeId: string; target: AgentStructurePosition; via: AgentStructureMoveMethod }
)
export type AgentStructureChanges = { baseVersion: AgentStructureVersion; summary: readonly string[] }

export type StructureEntry = { node: AgentStructureNode; parentId: string | null; index: number }
export type StructureIndex = { entries: Map<string, StructureEntry>; roots: readonly AgentStructureNode[]; error?: string }
const hasId = (id?: string) => typeof id === "string" && !!id.trim()
export const structureTitle = (node: AgentStructureNode) => node.title || "未命名节点"
export const supportsStructure = (capability?: AgentStructureCapability) => capability?.status === "supported"
  || (capability?.status === "limited" && !!capability.reason?.trim())

/** Reject ambiguous IDs, cycles and inconsistent levels before passing data to Tree. */
export function indexStructure(nodes: readonly AgentStructureNode[]): StructureIndex {
  const entries = new Map<string, StructureEntry>()
  let error: string | undefined
  function walk(siblings: readonly AgentStructureNode[], parentId: string | null, level: number) {
    for (const [index, node] of siblings.entries()) {
      if (!hasId(node.id) || entries.has(node.id) || node.level !== level) {
        error = "结构暂不可用：节点标识或层级不一致，请重新获取。"
        return
      }
      entries.set(node.id, { node, parentId, index })
      walk(node.children ?? [], node.id, level + 1)
      if (error) return
    }
  }
  walk(nodes, null, 1)
  return { entries, roots: nodes, error }
}

export function structureChildren(index: StructureIndex, parentId: string | null) {
  return parentId === null ? index.roots : index.entries.get(parentId)?.node.children ?? []
}

/** UI safety gates only; the receiving host must recheck permission and version. */
export function structureNodeBlock(index: StructureIndex, nodeId: string): string | undefined {
  const entry = index.entries.get(nodeId)
  if (!entry) return "节点暂不可定位。"
  const status = entry.node.status
  if (status.state === "conflict" || status.state === "readonly") return status.reason || "此节点暂不可修改。"
  if (status.state === "deleted") return "节点已删除待提交。"
  return entry.parentId === null ? undefined : structureNodeBlock(index, entry.parentId)
}

export function structureCapabilityBlock(capabilities: AgentStructureCapabilities, kind: AgentStructureCapabilityKind, node?: AgentStructureNode) {
  const global = capabilities[kind]
  if (!supportsStructure(global)) return global?.reason || "此操作暂不可用。"
  const local = kind === "view" ? undefined : node?.capabilities?.[kind]
  return local && !supportsStructure(local) ? local.reason || "此节点不支持此操作。" : undefined
}

function subtreeBlock(index: StructureIndex, node: AgentStructureNode, capabilities: AgentStructureCapabilities, kind: "move" | "nest" | "delete"): string | undefined {
  const blocked = structureNodeBlock(index, node.id) || structureCapabilityBlock(capabilities, kind, node)
  if (blocked) return blocked
  for (const child of node.children ?? []) {
    const reason = subtreeBlock(index, child, capabilities, kind)
    if (reason) return `下级节点「${structureTitle(child)}」：${reason}`
  }
}

export function structureDeleteBlock(index: StructureIndex, node: AgentStructureNode, capabilities: AgentStructureCapabilities) {
  return subtreeBlock(index, node, capabilities, "delete")
}

export function structureAddBlock(index: StructureIndex, capabilities: AgentStructureCapabilities, nodeId: string | null, target: AgentStructurePosition) {
  const node = nodeId === null ? undefined : index.entries.get(nodeId)?.node
  if (nodeId !== null && !node) return "节点暂不可定位。"
  const blocked = structureCapabilityBlock(capabilities, "add", node) || (nodeId === null ? undefined : structureNodeBlock(index, nodeId))
  if (blocked) return blocked
  if (target.parentId !== null) {
    const parent = index.entries.get(target.parentId)?.node
    if (!parent) return "目标节点暂不可定位。"
    const parentBlock = structureNodeBlock(index, parent.id) || structureCapabilityBlock(capabilities, "add", parent)
    if (parentBlock) return `目标节点：${parentBlock}`
  }
  if (!Number.isInteger(target.index) || target.index < 0 || target.index > structureChildren(index, target.parentId).length) return "目标位置暂不可用。"
}

export function structureMoveTarget(index: StructureIndex, nodeId: string, via: Exclude<AgentStructureMoveMethod, "drag">): AgentStructurePosition | undefined {
  const entry = index.entries.get(nodeId)
  if (!entry) return
  const siblings = structureChildren(index, entry.parentId)
  if (via === "up" && entry.index > 0) return { parentId: entry.parentId, index: entry.index - 1 }
  if (via === "down" && entry.index < siblings.length - 1) return { parentId: entry.parentId, index: entry.index + 1 }
  if (via === "indent" && entry.index > 0) {
    const previous = siblings[entry.index - 1]
    return { parentId: previous.id, index: previous.children?.length ?? 0 }
  }
  if (via === "outdent" && entry.parentId !== null) {
    const parent = index.entries.get(entry.parentId)!
    return { parentId: parent.parentId, index: parent.index + 1 }
  }
}

export function structureMoveBlock(index: StructureIndex, capabilities: AgentStructureCapabilities, nodeId: string, target?: AgentStructurePosition): string | undefined {
  const entry = index.entries.get(nodeId)
  if (!entry || !target) return "当前位置无法这样调整。"
  const kind = target.parentId === entry.parentId ? "move" : "nest"
  const blocked = subtreeBlock(index, entry.node, capabilities, kind)
  if (blocked) return blocked
  if (target.parentId !== null) {
    const parent = index.entries.get(target.parentId)
    if (!parent) return "目标节点暂不可定位。"
    const parentBlock = structureNodeBlock(index, target.parentId) || structureCapabilityBlock(capabilities, kind, parent.node)
    if (parentBlock) return `目标节点：${parentBlock}`
    let ancestor: StructureEntry | undefined = parent
    while (ancestor) {
      if (ancestor.node.id === nodeId) return "不能移入自身或下级节点。"
      ancestor = ancestor.parentId === null ? undefined : index.entries.get(ancestor.parentId)
    }
  }
  const length = structureChildren(index, target.parentId).length - (target.parentId === entry.parentId ? 1 : 0)
  if (!Number.isInteger(target.index) || target.index < 0 || target.index > length) return "目标位置暂不可用。"
  if (target.parentId === entry.parentId && target.index === entry.index) return "节点已在此位置。"
}

export function structureIdentityBlock(structure: AgentStructure) {
  return !hasId(structure.id) || !hasId(structure.version.id) ? "结构身份或版本未确认。" : undefined
}
