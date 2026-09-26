"use client"

import { useId, useMemo, useState } from "react"
import { dragAndDropFeature, hotkeysCoreFeature, syncDataLoaderFeature, type DndState, type DragTarget, type ItemInstance } from "@headless-tree/core"
import { useTree } from "@headless-tree/react"
import { ArrowDown, ArrowLeft, ArrowUp, ArrowUpRight, ChevronRight, IndentDecrease, IndentIncrease, Plus, Trash2 } from "lucide-react"
import { Card } from "@/components/coss/card"
import { Field, FieldLabel } from "@/components/coss/field"
import { Input } from "@/components/coss/input"
import { Badge } from "./badge"
import { Button } from "./button"
import { RecordDetails, type AgentRecordViewProps } from "./agent-record-parts"
import { Tree, TreeItem, TreeItemLabel } from "./tree"
import {
  indexStructure, structureAddBlock, structureChildren, structureDeleteBlock, structureIdentityBlock,
  structureMoveBlock, structureMoveTarget, structureNodeBlock, structureTitle, supportsStructure,
  type AgentStructure, type AgentStructureCapabilities, type AgentStructureCapabilityKind, type AgentStructureChanges,
  type AgentStructureMoveMethod, type AgentStructureNode, type AgentStructurePosition, type AgentStructureSave,
  type AgentStructureSelection, type AgentStructuredContentIntent, type StructureIndex,
} from "@/lib/prism-next/agent-structured-content"

export type {
  AgentStructure, AgentStructureCapabilities, AgentStructureCapability, AgentStructureCapabilityKind, AgentStructureChanges,
  AgentStructureMoveMethod, AgentStructureNode, AgentStructureNodeStatus, AgentStructurePosition, AgentStructureSave,
  AgentStructureSelection, AgentStructuredContentIntent, AgentStructureVersion,
} from "@/lib/prism-next/agent-structured-content"

export type AgentStructuredContentProps = AgentRecordViewProps & {
  structure: AgentStructure
  nodes: readonly AgentStructureNode[]
  capabilities: AgentStructureCapabilities
  selectedNodeId: string | null
  onSelect?: (selection: AgentStructureSelection) => void
  expandedIds?: readonly string[]
  onExpandedChange?: (ids: string[]) => void
  onIntent?: (intent: AgentStructuredContentIntent) => void
  changes?: AgentStructureChanges
  save?: AgentStructureSave
  readOnlyReason?: string
  notice?: string
  onBack?: () => void
}

const capabilityLabels = { view: "查看", rename: "重命名", add: "新增", delete: "删除", move: "移动", nest: "嵌套" }
const capabilityStatus = { supported: "支持", limited: "有限支持", unsupported: "不支持" }
const capabilityKinds = Object.keys(capabilityLabels) as AgentStructureCapabilityKind[]
const nodeStatus = { normal: "正常", added: "新增", modified: "已修改", deleted: "已删除待提交", conflict: "冲突", readonly: "只读" }
const saveLabels = { unsaved: "未保存", "saved-draft": "已保存草稿", submitted: "已提交", conflict: "冲突", unknown: "状态未确认" }
const moveActions = [
  { via: "up", kind: "move", label: "上移", icon: ArrowUp },
  { via: "down", kind: "move", label: "下移", icon: ArrowDown },
  { via: "outdent", kind: "nest", label: "升级", icon: IndentDecrease },
  { via: "indent", kind: "nest", label: "降级", icon: IndentIncrease },
] as const

function StructureStatus({ node }: { node: AgentStructureNode }) {
  return node.status.state === "normal" ? null : <Badge variant={node.status.state === "conflict" ? "warning" : "secondary"}>{nodeStatus[node.status.state]}</Badge>
}

function StructureSummary({ nodes, level = 1 }: { nodes: readonly AgentStructureNode[]; level?: number }) {
  return <ol className="min-w-0 space-y-2">{nodes.map(node => <li key={node.id} className="min-w-0 space-y-2">
    <div className="flex flex-wrap items-start gap-2"><span className="min-w-0 break-words text-ui-body">{structureTitle(node)}</span><StructureStatus node={node} /></div>
    {level < 2 && !!node.children?.length && <div className="pl-5"><StructureSummary nodes={node.children} level={level + 1} /></div>}
  </li>)}</ol>
}

type TreeDatum = { node?: AgentStructureNode; children: readonly AgentStructureNode[] }
type StructureTreeProps = {
  index: StructureIndex
  revision: string
  selectedNodeId: string | null
  expandedIds?: readonly string[]
  onExpandedChange?: (ids: string[]) => void
  onSelect?: (id: string) => void
  canMove: (nodeId: string, target: AgentStructurePosition) => boolean
  canDrag: (nodeId: string) => boolean
  onMove: (nodeId: string, target: AgentStructurePosition, via: AgentStructureMoveMethod) => void
}

function StructureTree({ index, revision, selectedNodeId, expandedIds, onExpandedChange, onSelect, canMove, canDrag, onMove }: StructureTreeProps) {
  const [localExpanded, setLocalExpanded] = useState(() => index.roots.map(node => node.id))
  const [focusedItem, setFocusedItem] = useState<string | null>(null)
  const [dragSession, setDragSession] = useState<{ index: StructureIndex; revision: string; value: DndState<TreeDatum> | null | undefined }>()
  const activeDrag = dragSession?.index === index && dragSession.revision === revision && dragSession.value?.draggedItems?.every(item => canDrag(item.getId())) ? dragSession.value : null
  const expanded = useMemo(() => [...(expandedIds ?? localExpanded)].filter(id => index.entries.has(id)), [expandedIds, localExpanded, index])
  let rootId = "__prism_structure_root__"
  while (index.entries.has(rootId)) rootId += "_"
  function dropPosition(items: ItemInstance<TreeDatum>[], target: DragTarget<TreeDatum>): AgentStructurePosition {
    const parentId = target.item.getId() === rootId ? null : target.item.getId()
    const moving = items[0]?.getId()
    return { parentId, index: "insertionIndex" in target ? target.insertionIndex : structureChildren(index, parentId).filter(node => node.id !== moving).length }
  }
  let visibleFocus = focusedItem && index.entries.has(focusedItem) ? focusedItem : null
  if (visibleFocus) {
    let parentId = index.entries.get(visibleFocus)!.parentId
    while (parentId !== null) {
      if (!expanded.includes(parentId)) visibleFocus = parentId
      parentId = index.entries.get(parentId)!.parentId
    }
  }
  const tree = useTree<TreeDatum>({
    rootItemId: rootId,
    dataLoader: {
      getItem: id => id === rootId ? { children: index.roots } : { node: index.entries.get(id)!.node, children: structureChildren(index, id) },
      getChildren: id => structureChildren(index, id === rootId ? null : id).map(node => node.id),
    },
    getItemName: item => item.getItemData().node ? structureTitle(item.getItemData().node!) : "内容结构",
    isItemFolder: item => item.getItemData().children.length > 0,
    state: { expandedItems: expanded, focusedItem: visibleFocus, dnd: activeDrag },
    setDndState: update => setDragSession({ index, revision, value: typeof update === "function" ? update(activeDrag ?? undefined) : update }),
    setFocusedItem: setFocusedItem,
    setExpandedItems: update => {
      const next = typeof update === "function" ? update([...expanded]) : update
      if (expandedIds === undefined) setLocalExpanded(next)
      onExpandedChange?.([...next])
    },
    onPrimaryAction: item => onSelect?.(item.getId()),
    canDrag: items => items.length === 1 && canDrag(items[0].getId()),
    canDrop: (items, target) => items.length === 1 && canMove(items[0].getId(), dropPosition(items, target)),
    onDrop: (items, target) => {
      if (items.length === 1) onMove(items[0].getId(), dropPosition(items, target), "drag")
    },
    canDropForeignDragObject: () => false,
    canDragForeignDragObjectOver: () => false,
    openOnDropDelay: 0,
    features: [syncDataLoaderFeature, hotkeysCoreFeature, dragAndDropFeature],
  })
  // Re-project the supplied topology synchronously, retaining Tree's item/focus instances.
  // No data-loader cache, optimistic tree edits, remount-per-version or copied content.
  tree.scheduleRebuildTree()
  const items = tree.getItems()
  const drag = tree.getState().dnd
  const target = drag?.dragTarget
  const position = target && drag?.draggedItems ? dropPosition(drag.draggedItems, target) : undefined
  return <div className="min-w-0 space-y-2">
    {position && <p role="status" className="break-words text-ui-hint">放置位置：{position.parentId === null ? "顶层" : index.entries.has(position.parentId) ? structureTitle(index.entries.get(position.parentId)!.node) : "目标已变化"}，第 {position.index + 1} 项</p>}
    <Tree tree={tree} aria-label="内容层级" className="gap-1">{items.map(item => {
      const node = item.getItemData().node!
      const focus = () => { item.setFocused(); item.getElement()?.focus() }
      return <TreeItem key={node.id} item={item} current={selectedNodeId === node.id} draggable={canDrag(node.id)}
        onClick={() => { focus(); onSelect?.(node.id) }}
        onKeyDown={event => {
          if (event.target !== event.currentTarget || (event.key !== "Enter" && event.key !== " ")) return
          event.preventDefault()
          onSelect?.(node.id)
        }}>
        <TreeItemLabel>
          {item.isFolder() ? <Button type="button" variant="ghost" size="navigation-icon" tabIndex={-1}
            aria-label={`${item.isExpanded() ? "收起" : "展开"}${structureTitle(node)}`} aria-expanded={item.isExpanded()}
            disabled={expandedIds !== undefined && !onExpandedChange}
            onClick={event => { event.stopPropagation(); focus(); if (item.isExpanded()) item.collapse(); else item.expand() }}>
            <ChevronRight aria-hidden="true" className={item.isExpanded() ? "rotate-90" : undefined} />
          </Button> : <span aria-hidden="true" className="w-10 shrink-0" />}
          <div className="min-w-0 flex-1 space-y-1 py-2">
            <div className="flex flex-wrap items-start gap-2"><span className="min-w-0 break-words">{structureTitle(node)}</span><StructureStatus node={node} /></div>
            <p className="break-words text-ui-hint">{node.type} · 第 {node.level} 层</p>
          </div>
        </TreeItemLabel>
      </TreeItem>
    })}</Tree>
  </div>
}

export function AgentStructuredContent({
  structure, nodes, capabilities, selectedNodeId, onSelect, expandedIds, onExpandedChange, onIntent,
  changes, save = { state: "unknown" }, readOnlyReason, view = "inline", density = "default", onExpand, onBack, notice, details,
}: AgentStructuredContentProps) {
  const id = useId()
  const index = useMemo(() => indexStructure(nodes), [nodes])
  const historical = structure.snapshot !== undefined
  const identityBlock = structureIdentityBlock(structure)
  const viewable = supportsStructure(capabilities.view) && !identityBlock && !index.error
  const selected = selectedNodeId === null ? undefined : index.entries.get(selectedNodeId)?.node
  const writeBlock = identityBlock || index.error || (historical ? "历史版本只读。" : undefined)
    || (readOnlyReason !== undefined ? readOnlyReason || "当前结构只读。" : undefined)
    || (!structure.baseVersion?.id.trim() ? "基准版本未确认，暂不能修改。" : undefined)
    || (save.state === "conflict" ? save.description || "版本存在冲突，请先核对。" : undefined)
  const editBlock = writeBlock || (view === "workspace" && !onIntent ? "当前仅可查看结构。" : undefined)
  const writable = viewable && view === "workspace" && !editBlock
  const context = { structureId: structure.id, versionId: structure.version.id, baseVersionId: structure.baseVersion?.id ?? "" }
  const allowed = (kind: AgentStructureCapabilityKind, node?: AgentStructureNode) => supportsStructure(capabilities[kind])
    && (kind === "view" || !node?.capabilities?.[kind] || supportsStructure(node.capabilities[kind]))
  const nodeBlock = selected ? structureNodeBlock(index, selected.id) : undefined
  function move(nodeId: string, target: AgentStructurePosition, via: AgentStructureMoveMethod) {
    if (writable && !structureMoveBlock(index, capabilities, nodeId, target)) onIntent?.({ ...context, type: "move", nodeId, target: { ...target }, via })
  }
  const canMove = (nodeId: string, target: AgentStructurePosition) => writable && !structureMoveBlock(index, capabilities, nodeId, target)
  const canDrag = (nodeId: string) => writable && [null, ...index.entries.keys()].some(parentId => {
    const last = structureChildren(index, parentId).filter(node => node.id !== nodeId).length
    return canMove(nodeId, { parentId, index: 0 }) || canMove(nodeId, { parentId, index: last })
  })
  const issues = viewable ? [...index.entries.values()].filter(({ node }) => ["conflict", "readonly", "deleted"].includes(node.status.state)
    || Object.values(node.capabilities ?? {}).some(cap => cap?.status !== "supported")) : []
  function addTarget(placement: "child" | "after" | "root"): AgentStructurePosition {
    const entry = selected ? index.entries.get(selected.id) : undefined
    return placement === "child" && selected ? { parentId: selected.id, index: selected.children?.length ?? 0 }
      : placement === "after" && entry ? { parentId: entry.parentId, index: entry.index + 1 } : { parentId: null, index: 0 }
  }
  function add(placement: "child" | "after" | "root") {
    if (!writable || !allowed("add", selected) || nodeBlock) return
    const target = addTarget(placement)
    if (structureAddBlock(index, capabilities, selected?.id ?? null, target)) return
    if (placement === "root") {
      if (!nodes.length) onIntent?.({ ...context, type: "add", nodeId: null, placement, target })
      return
    }
    if (!selected) return
    onIntent?.({ ...context, type: "add", nodeId: selected.id, placement, target })
  }
  const entries = [...index.entries.values()]
  const maxLevel = entries.reduce((max, entry) => Math.max(max, entry.node.level), 0)
  const capabilityReasons = new Map<string, string[]>()
  for (const kind of capabilityKinds) {
    const reason = capabilities[kind]?.reason
    if (reason) capabilityReasons.set(reason, [...(capabilityReasons.get(reason) ?? []), capabilityLabels[kind]])
  }
  return <Card data-agent-structured-view={view} data-density={density} className={`min-w-0 ${density === "compact" ? "gap-3 p-3" : "gap-5 p-5"}`}>
    <header className="min-w-0 space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-2"><h3 className="min-w-0 break-words text-block-title">{structure.title}</h3><Badge variant={historical ? "secondary" : "info"}>{historical ? "历史版本（只读）" : "当前状态"}</Badge></div>
      <p className="break-words text-ui-hint">{historical ? "当时版本" : "当前版本"}：{structure.version.label || "未确认"}{structure.baseVersion && ` · 基准版本：${structure.baseVersion.label || "未确认"}`}</p>
      {historical && structure.snapshot && <p className="break-words text-ui-hint">{structure.snapshot}</p>}
      {historical && structure.currentVersion && <p className="break-words text-ui-hint">当前版本：{structure.currentVersion.label || "未确认"}</p>}
      <div className="flex flex-wrap items-center gap-2 text-ui-hint"><span>{historical ? "当时保存状态" : "保存状态"}</span><Badge variant={save.state === "conflict" || save.state === "unknown" ? "warning" : "secondary"}>{saveLabels[save.state]}</Badge></div>
      {save.description && <p className="break-words text-ui-hint">{save.description}</p>}
    </header>
    <section aria-label="结构能力" className="min-w-0 space-y-2">
      <p className="break-words text-ui-hint">{historical ? "历史版本只读，结构编辑能力不适用。" : editBlock || !onIntent ? "当前结构只读，结构编辑能力不适用。" : capabilityKinds.map(kind => `${capabilityLabels[kind]}：${capabilityStatus[capabilities[kind]?.status] ?? "未确认"}`).join(" · ")}</p>
      {[...capabilityReasons].map(([reason, labels]) => <p key={reason} className="break-words text-ui-hint">{labels.join("、")}：{reason}</p>)}
    </section>
    {(identityBlock || index.error) && <p role="alert" className="text-ui-hint">{identityBlock || index.error}</p>}
    {viewable && <>
      {editBlock && <p id={`${id}-edit-block`} className="break-words text-ui-hint">{editBlock}</p>}
      {!!issues.length && <section aria-label="需要留意的节点" className="min-w-0 space-y-2">
        <h4 className="text-ui-action">需要留意的节点</h4>
        <ul className="space-y-2">{issues.map(({ node }) => <li key={node.id} className="break-words text-ui-hint">
          {structureTitle(node)} · {nodeStatus[node.status.state]}{"reason" in node.status && `：${node.status.reason}`}
          {Object.entries(node.capabilities ?? {}).map(([kind, cap]) => cap?.reason && <p key={kind}>{capabilityLabels[kind as AgentStructureCapabilityKind]}：{cap.reason}</p>)}
        </li>)}</ul>
      </section>}
      <section aria-label={view === "inline" ? "层级摘要" : "完整结构"} className="min-w-0 space-y-3">
        <h4 className="text-ui-action">{view === "inline" ? "层级摘要 · 前两层" : "完整结构"}</h4>
        <p className="text-ui-hint">已提供 {entries.length} 个节点 · {maxLevel} 层</p>
        {!nodes.length ? <p className="text-ui-hint">尚未提供节点。</p> : view === "inline" ? <StructureSummary nodes={nodes} /> : <StructureTree
          key={`${structure.id}:${historical ? "history" : "current"}`} index={index} revision={JSON.stringify([structure.version.id, structure.baseVersion?.id])} selectedNodeId={selectedNodeId}
          expandedIds={expandedIds} onExpandedChange={onExpandedChange}
          onSelect={onSelect ? nodeId => onSelect({ structureId: structure.id, versionId: structure.version.id, nodeId }) : undefined}
          canMove={canMove} canDrag={canDrag} onMove={move} />}
      </section>
      <section aria-label="变更摘要" className="min-w-0 space-y-2">
        <h4 className="text-ui-action">{view === "inline" ? "关键变化" : "变更摘要"}{changes && ` · 相对 ${changes.baseVersion.label || "未确认版本"}`}</h4>
        {changes ? changes.summary.length ? <ul className="space-y-1">{changes.summary.map((line, i) => <li key={i} className="break-words text-ui-hint">{line}</li>)}</ul> : <p className="text-ui-hint">未记录结构变化。</p> : <p className="text-ui-hint">变更情况未确认。</p>}
      </section>
      {view === "workspace" && <section aria-label="节点操作" className="min-w-0 space-y-3">
        <h4 className="text-ui-action">{selected ? `当前节点：${structureTitle(selected)}` : selectedNodeId === null ? "请选择节点" : "所选节点暂不可定位，请重新选择。"}</h4>
        {selected?.summary && <div className="min-w-0 break-words text-ui-hint">{selected.summary}</div>}
        {nodeBlock && <p id={`${id}-node-block`} className="break-words text-ui-hint">{nodeBlock}</p>}
        {!historical && selected && <>
          {allowed("rename", selected) && <Field><FieldLabel htmlFor={`${id}-title`}>节点名称</FieldLabel><Input id={`${id}-title`} value={selected.title}
            readOnly={!writable || !!nodeBlock} aria-describedby={editBlock ? `${id}-edit-block` : nodeBlock ? `${id}-node-block` : undefined}
            onChange={event => { if (writable && !nodeBlock) onIntent?.({ ...context, type: "rename", nodeId: selected.id, title: event.target.value }) }} /></Field>}
          <div className="flex flex-wrap gap-2">
            {allowed("add", selected) && <>{(["child", "after"] as const).map(placement => {
              const reason = editBlock || nodeBlock || structureAddBlock(index, capabilities, selected.id, addTarget(placement))
              const reasonId = editBlock ? `${id}-edit-block` : nodeBlock ? `${id}-node-block` : `${id}-add-${placement}`
              return <div key={placement} className="min-w-0 max-w-full space-y-1"><Button type="button" size="navigation" variant="outline"
                data-structure-action={`add-${placement}`} disabled={!!reason} aria-describedby={reason ? reasonId : undefined}
                onClick={() => add(placement)}><Plus aria-hidden="true" />{placement === "child" ? "新增子节点" : "新增同级节点"}</Button>
                {reason && !editBlock && !nodeBlock && <p id={reasonId} className="max-w-[24em] break-words text-ui-hint">{reason}</p>}
              </div>
            })}</>}
          </div>
          <div className="flex flex-wrap items-start gap-3">{moveActions.filter(action => allowed(action.kind, selected)).map(({ via, label, icon: Icon }) => {
            const target = structureMoveTarget(index, selected.id, via)
            const reason = editBlock || structureMoveBlock(index, capabilities, selected.id, target)
            const reasonId = editBlock ? `${id}-edit-block` : nodeBlock ? `${id}-node-block` : `${id}-${via}`
            return <div key={via} className="min-w-0 max-w-full space-y-1"><Button type="button" variant="outline" size="navigation" data-structure-action={via}
              disabled={!!reason} aria-describedby={reason ? reasonId : undefined} onClick={() => { if (target) move(selected.id, target, via) }}><Icon aria-hidden="true" />{label}</Button>
              {reason && !editBlock && !nodeBlock && <p id={reasonId} className="max-w-[24em] break-words text-ui-hint">{reason}</p>}
            </div>
          })}</div>
          {allowed("delete", selected) && <div className="space-y-1"><Button type="button" size="navigation" variant="outline" data-structure-action="delete"
            disabled={!writable || !!structureDeleteBlock(index, selected, capabilities)} aria-describedby={editBlock ? `${id}-edit-block` : nodeBlock ? `${id}-node-block` : `${id}-delete`}
            onClick={() => { if (writable && !structureDeleteBlock(index, selected, capabilities)) onIntent?.({ ...context, type: "delete", nodeId: selected.id }) }}><Trash2 aria-hidden="true" />删除节点</Button>
            {!editBlock && !nodeBlock && <p id={`${id}-delete`} className="break-words text-ui-hint">{structureDeleteBlock(index, selected, capabilities) || "删除范围包含此节点及全部下级。"}</p>}
          </div>}
        </>}
        {!nodes.length && !historical && allowed("add") && <Button type="button" variant="outline" size="navigation" disabled={!writable} aria-describedby={editBlock ? `${id}-edit-block` : undefined} data-structure-action="add-root" onClick={() => add("root")}><Plus aria-hidden="true" />新增顶层节点</Button>}
      </section>}
      {view === "inline" && onExpand && <div><Button type="button" variant="outline" size="navigation" onClick={event => onExpand(event.currentTarget)}><ArrowUpRight aria-hidden="true" />{writeBlock || !["rename", "add", "delete", "move", "nest"].some(kind => supportsStructure(capabilities[kind as AgentStructureCapabilityKind])) ? "查看完整结构" : "编辑结构"}</Button></div>}
    </>}
    {notice && <p className="break-words text-ui-hint text-muted-foreground">{notice}</p>}
    <RecordDetails>{details}</RecordDetails>
    {view === "workspace" && onBack && <div><Button type="button" variant="ghost" size="navigation" onClick={onBack}><ArrowLeft aria-hidden="true" />返回原位置</Button></div>}
  </Card>
}
