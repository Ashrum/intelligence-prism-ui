"use client"

import { useEffect, useId, useRef, useState, type ReactNode } from "react"
import { Card } from "@/components/coss/card"
import { Input } from "@/components/coss/input"
import { Label } from "@/components/coss/label"
import { Button } from "./button"
import { RecordDetails } from "./agent-record-parts"

export type AgentRelationNode = {
  id: string; label: string; type: string; group?: string; level?: number
  status?: string; description?: string
  source?: { objectId: string; version?: string; label: string }
}
export type AgentRelationEdge = { id: string; from: string; to: string; type: string; weight?: number; description?: string }
export type AgentRelationCapability = { supported: true; reason?: string } | { supported: false; reason: string }
export type AgentRelationCapabilities = Record<"view" | "filter" | "edit-node" | "edit-edge" | "layout", AgentRelationCapability>
export type AgentRelationFilter = { type?: string; status?: string }
export type AgentRelationContext = { graphId: string; version: string }
export type AgentRelationIntent = AgentRelationContext & (
  | { type: "select-node"; nodeId: string }
  | { type: "filter"; filter: AgentRelationFilter }
  | { type: "open-source"; nodeId: string; source: NonNullable<AgentRelationNode["source"]> }
  | { type: "node-create" }
  | { type: "node-update"; nodeId: string; label: string }
  | { type: "node-delete"; nodeId: string }
  | { type: "edge-create"; from: string; to: string; relationType: string }
  | { type: "edge-delete"; edgeId: string }
  | { type: "request-layout"; layout: "grid" | "layered" }
)
export type AgentRelationGraphProps = AgentRelationContext & {
  title: string; versionLabel?: string; nodes: readonly AgentRelationNode[]; edges: readonly AgentRelationEdge[]
  capabilities: AgentRelationCapabilities
  summary?: { statusCounts?: readonly { label: string; count: number }[]; gaps?: readonly string[] }
  layout?: "grid" | "layered"; graphThreshold?: number; minGraphWidth?: number
  filter?: AgentRelationFilter; selectedNodeId?: string | null
  view?: "inline" | "workspace"; density?: "default" | "compact"
  readOnlyReason?: string; notice?: string; details?: ReactNode
  onIntent?: (intent: AgentRelationIntent) => void
  onExpand?: (trigger: HTMLButtonElement, context: AgentRelationContext) => void
  onBack?: (context: AgentRelationContext) => void
}
const names = { view: "查看", filter: "筛选", "edit-node": "编辑节点", "edit-edge": "编辑关系", layout: "调整布局" }
const text = (value?: string) => !!value?.trim()
const nodeLabel = (node: AgentRelationNode) => node.label.trim() || "未命名节点"
const nodeStatus = (node: AgentRelationNode) => node.status?.trim() || "未知"

/** View-only induced subgraph. Never infers coverage or changes supplied objects. */
export function relationProjection(nodes: readonly AgentRelationNode[], edges: readonly AgentRelationEdge[], filter: AgentRelationFilter) {
  const visible = nodes.filter(node => (!filter.type || node.type === filter.type) && (!filter.status || nodeStatus(node) === filter.status))
  const ids = new Set(visible.map(node => node.id))
  return { nodes: visible, edges: edges.filter(edge => ids.has(edge.from) && ids.has(edge.to)) }
}
/** Stable input order, optional layers; no force simulation or semantic inference. */
export function relationPositions(nodes: readonly AgentRelationNode[], layout: "grid" | "layered") {
  const levels = [...new Set(nodes.map(node => Number.isFinite(node.level) ? node.level! : 0))].sort((a, b) => a - b)
  const rows = new Map<number, number>()
  return nodes.map((node, index) => {
    const level = Number.isFinite(node.level) ? node.level! : 0
    const row = rows.get(level) ?? 0; rows.set(level, row + 1)
    return { node, x: 120 + (layout === "grid" ? index % 3 : levels.indexOf(level)) * 250, y: 60 + (layout === "grid" ? Math.floor(index / 3) : row) * 110 }
  })
}

function RelationCanvas({ nodes, edges, layout, thumbnail = false, readable = false, selectedNodeId, onSelect }: {
  nodes: readonly AgentRelationNode[]; edges: readonly AgentRelationEdge[]; layout: "grid" | "layered"; thumbnail?: boolean; readable?: boolean
  selectedNodeId?: string | null; onSelect?: (id: string) => void
}) {
  const id = useId()
  const [camera, setCamera] = useState({ zoom: 1, x: 0, y: 0 })
  const drag = useRef<{ id: number; x: number; y: number } | null>(null)
  const positions = relationPositions(nodes, layout)
  const byId = new Map(positions.map(point => [point.node.id, point]))
  const width = Math.max(360, ...positions.map(point => point.x + 130))
  const height = Math.max(180, ...positions.map(point => point.y + 60))
  const pan = (x: number, y: number) => setCamera(value => ({ ...value, x: value.x + x, y: value.y + y }))
  const zoom = (delta: number) => setCamera(value => ({ ...value, zoom: Math.max(readable ? 1 : .5, Math.min(3, value.zoom + delta)) }))
  return <div className="min-w-0 space-y-2">
    {!thumbnail && <div className="flex min-w-0 flex-wrap gap-2" role="group" aria-label="关系图视野">
      <Button type="button" variant="outline" onClick={() => zoom(.25)}>放大</Button>
      <Button type="button" variant="outline" onClick={() => zoom(-.25)}>缩小</Button>
      <Button type="button" variant="outline" onClick={() => setCamera({ zoom: 1, x: 0, y: 0 })}>重置视野</Button>
      {([["左移", -40, 0], ["右移", 40, 0], ["上移", 0, -40], ["下移", 0, 40]] as const).map(([label, x, y]) => <Button key={label} type="button" variant="outline" onClick={() => pan(x, y)}>{label}</Button>)}
      <span className="text-ui-hint">缩放 {Math.round(camera.zoom * 100)}%</span>
    </div>}
    {!thumbnail && <p id={`${id}-help`} className="text-ui-hint">方向键平移，加减键缩放，Home 重置；节点和关系可在下方列表中完整查看。</p>}
    <div className={readable ? "max-h-80 w-full max-w-full min-w-0 overflow-x-auto [contain:inline-size]" : undefined}
      style={readable ? { minWidth: 0, maxWidth: "100%", overflowX: "auto", overflowY: "auto", overscrollBehaviorX: "contain" } : undefined}
      role={readable ? "region" : undefined} aria-label={readable ? "关系图（可横向滚动）" : undefined} tabIndex={readable ? 0 : undefined}>
    <svg style={readable ? { width, minWidth: width, height } : undefined} viewBox={`0 0 ${width} ${height}`} className={`w-full ${thumbnail ? "h-36" : "h-80 touch-none"}`} role="img"
      aria-label={thumbnail ? "关系缩略图，完整内容见关系列表" : "关系图"} tabIndex={thumbnail ? undefined : 0}
      aria-describedby={thumbnail ? undefined : `${id}-help`}
      onKeyDown={event => {
        if (thumbnail || event.target !== event.currentTarget) return
        const moves: Record<string, [number, number]> = { ArrowLeft: [-40, 0], ArrowRight: [40, 0], ArrowUp: [0, -40], ArrowDown: [0, 40] }
        if (moves[event.key]) { event.preventDefault(); pan(...moves[event.key]) }
        else if (["+", "=", "-"].includes(event.key)) { event.preventDefault(); zoom(event.key === "-" ? -.25 : .25) }
        else if (event.key === "Home") { event.preventDefault(); setCamera({ zoom: 1, x: 0, y: 0 }) }
      }}
      onPointerDown={event => {
        if (thumbnail || event.button !== 0 || event.target !== event.currentTarget) return
        drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId)
      }}
      onPointerMove={event => {
        if (!drag.current || drag.current.id !== event.pointerId) return
        const rect = event.currentTarget.getBoundingClientRect()
        const scale = Math.max(width / rect.width, height / rect.height)
        pan((event.clientX - drag.current.x) * scale, (event.clientY - drag.current.y) * scale)
        drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY }
      }} onPointerUp={() => { drag.current = null }} onPointerCancel={() => { drag.current = null }} onLostPointerCapture={() => { drag.current = null }}>
      <defs><marker id={`${id}-arrow`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8" fill="currentColor" /></marker></defs>
      <g transform={`translate(${camera.x} ${camera.y}) scale(${camera.zoom})`}>
        {edges.map(edge => {
          const a = byId.get(edge.from)!, b = byId.get(edge.to)!
          const path = edge.from === edge.to ? `M${a.x} ${a.y - 10} c-60 -70 60 -70 0 0` : `M${a.x} ${a.y} L${b.x} ${b.y - 14}`
          return <path key={edge.id} d={path} fill="none" stroke="currentColor" markerEnd={`url(#${id}-arrow)`}><title>{`${nodeLabel(a.node)} → ${nodeLabel(b.node)}：${edge.type}${edge.weight !== undefined ? `，权重 ${edge.weight}` : ""}${edge.description ? `，${edge.description}` : ""}`}</title></path>
        })}
        {positions.map(({ node, x, y }) => <g key={node.id} transform={`translate(${x} ${y})`} onClick={thumbnail ? undefined : () => onSelect?.(node.id)}>
          <title>{`${nodeLabel(node)} · ${node.type} · ${nodeStatus(node)}`}</title>
          <circle r={selectedNodeId === node.id ? 16 : 12} fill="currentColor" />
          <text y="32" textAnchor="middle" fill="currentColor" className="text-ui-body">{nodeLabel(node).length > 12 ? `${nodeLabel(node).slice(0, 12)}…` : nodeLabel(node)}</text>
        </g>)}
      </g>
    </svg>
    </div>
  </div>
}

export function AgentRelationGraph({ title, graphId, version, versionLabel, nodes, edges, capabilities, summary,
  layout = "grid", graphThreshold = 80, minGraphWidth = 480, filter = {}, selectedNodeId, view = "inline", density = "default", readOnlyReason,
  notice = "关系与覆盖状态仅反映当前提供的资料，调整后是否保存请以记录为准。", details, onIntent, onExpand, onBack,
}: AgentRelationGraphProps) {
  const id = useId()
  const [display, setDisplay] = useState<"graph" | "list">("graph")
  const container = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState<number | null>(null)
  const [narrowDisplay, setNarrowDisplay] = useState<"graph" | "list">("list")
  const minimum = Number.isFinite(minGraphWidth) && minGraphWidth > 0 ? minGraphWidth : 480
  const narrow = containerWidth !== null && containerWidth < minimum
  const activeDisplay = narrow ? narrowDisplay : display
  const chooseDisplay = narrow ? setNarrowDisplay : setDisplay
  useEffect(() => {
    const element = container.current
    if (!element || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(entries => {
      const entry = entries.find(item => item.target === element)
      if (entry) setContainerWidth(entry.contentRect.width)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  const context = { graphId, version }
  const workspace = view === "workspace"
  const validIds = (items: readonly { id: string }[]) => items.every(item => text(item.id)) && new Set(items.map(item => item.id)).size === items.length
  const nodeById = new Map(nodes.map(node => [node.id, node]))
  const ids = new Set(nodeById.keys())
  const invalid = !validIds(nodes) || !validIds(edges) || edges.some(edge => !ids.has(edge.from) || !ids.has(edge.to) || (edge.weight !== undefined && !Number.isFinite(edge.weight)))
  const viewable = capabilities.view.supported && !invalid
  const ready = text(graphId) && text(version) && !!onIntent && viewable
  const can = (key: keyof AgentRelationCapabilities) => ready && capabilities[key].supported && (!["edit-node", "edit-edge", "layout"].includes(key) || readOnlyReason === undefined)
  const projected = relationProjection(nodes, edges, filter)
  const selected = projected.nodes.find(node => node.id === selectedNodeId)
  const threshold = Number.isInteger(graphThreshold) && graphThreshold >= 0 ? graphThreshold : 80
  const large = nodes.length > threshold
  const send = (intent: AgentRelationIntent, ability: keyof AgentRelationCapabilities = "view") => { if (can(ability)) onIntent?.(intent) }
  const reasons = new Map<string, string[]>()
  for (const key of Object.keys(names) as (keyof typeof names)[]) {
    const capability = capabilities[key]
    const label = capability.supported ? capability.reason?.trim() : capability.reason?.trim() || "暂不支持。"
    if (label) reasons.set(label, [...(reasons.get(label) ?? []), names[key]])
  }
  const edgeText = (edge: AgentRelationEdge) => `${nodeLabel(nodeById.get(edge.from)!)} → ${nodeLabel(nodeById.get(edge.to)!)} · ${edge.type || "关系类型未知"}${edge.weight !== undefined ? ` · 权重 ${edge.weight}` : ""}${edge.description ? ` · ${edge.description}` : ""}`
  const list = viewable && <div className="min-w-0 space-y-3" aria-label="节点与关系列表">
    <h4 className="text-item-title">节点（{projected.nodes.length}）</h4>
    <ul className="space-y-3">{projected.nodes.map(node => <li key={node.id} className="min-w-0 space-y-1 break-words">
      <Button type="button" variant="outline" className="max-w-full whitespace-normal" aria-pressed={selectedNodeId === node.id} disabled={!ready}
        onClick={() => send({ ...context, type: "select-node", nodeId: node.id })}>{nodeLabel(node)}</Button>
      <p className="text-ui-body">{node.type || "类型未知"} · {nodeStatus(node)}{node.group ? ` · ${node.group}` : ""}{Number.isFinite(node.level) ? ` · 层级 ${node.level}` : ""}</p>
      {node.description && <p className="text-ui-hint">{node.description}</p>}
      {node.source && <p className="text-ui-hint">来源：{node.source.label || "名称未知"}</p>}
    </li>)}</ul>
    {!projected.nodes.length && <p className="text-ui-hint">没有符合条件的节点。</p>}
    <h4 className="text-item-title">关系（{projected.edges.length}）</h4>
    <ul className="space-y-2">{projected.edges.map(edge => <li key={edge.id} className="break-words text-ui-body">{edgeText(edge)}{workspace && capabilities["edit-edge"].supported && <Button type="button" variant="outline" disabled={!can("edit-edge")} aria-label={`删除关系：${edgeText(edge)}`} onClick={() => send({ ...context, type: "edge-delete", edgeId: edge.id }, "edit-edge")}>删除关系</Button>}</li>)}</ul>
    {!projected.edges.length && <p className="text-ui-hint">当前范围没有关系。</p>}
  </div>
  return <Card ref={container} data-agent-relation-view={view} data-density={density} className={`min-w-0 ${density === "compact" ? "gap-3 p-3" : "gap-4 p-4"}`}>
    <h3 className="break-words text-block-title">{title}</h3>
    <ul id={`${id}-abilities`} className="space-y-1 break-words text-ui-hint">{[...reasons].map(([reason, scope]) => <li key={reason}>{scope.join("、")}：{reason}</li>)}</ul>
    {readOnlyReason !== undefined && <p className="text-ui-hint">{readOnlyReason || "当前关系只读。"}</p>}
    {invalid && capabilities.view.supported && <p className="text-ui-hint">关系资料不完整或重复，请核对后查看。</p>}
    {viewable && <>
      <p className="text-ui-hint">{versionLabel?.trim() || "版本未知"} · {nodes.length} 个节点 · {edges.length} 条关系</p>
      {!ready && <p className="text-ui-hint">当前仅供查看，操作条件未齐备。</p>}
      <p className="text-ui-body break-words">按状态计数：{summary?.statusCounts?.length ? summary.statusCounts.map(item => `${item.label} ${Number.isInteger(item.count) && item.count >= 0 ? item.count : "未知"}`).join(" · ") : "未知"}</p>
      {summary?.gaps === undefined ? <p className="text-ui-hint">关键缺口未知</p> : summary.gaps.length ? <ul className="text-ui-hint space-y-1">{[...new Set(summary.gaps)].map(gap => <li key={gap}>{gap}</li>)}</ul> : <p className="text-ui-hint">未记录关键缺口</p>}
      {large && <p className="text-ui-hint">节点超过图示上限（{threshold}），请使用列表查看与筛选。</p>}
      {narrow && !large && <p className="text-ui-hint">当前区域较窄，默认仅显示列表；查看关系图时可滚动浏览。</p>}
      {narrow && !workspace && !large && <div className="flex min-w-0 flex-wrap gap-2" role="group" aria-label="呈现方式">
        <Button type="button" variant="outline" aria-pressed={activeDisplay === "graph"} onClick={() => chooseDisplay("graph")}>仍查看关系图</Button>
        <Button type="button" variant="outline" aria-pressed={activeDisplay === "list"} onClick={() => chooseDisplay("list")}>仅列表</Button>
      </div>}
      {workspace && <>
        <div className="min-w-0 space-y-3" aria-label="关系筛选">
          {(["type", "status"] as const).map(key => <div key={key} role="group" aria-label={key === "type" ? "按类型筛选" : "按状态筛选"} className="flex min-w-0 flex-wrap gap-2">
            {[undefined, ...new Set(nodes.map(node => key === "type" ? node.type : nodeStatus(node)))].map((value, index) => <Button key={index} type="button" variant="outline" aria-pressed={filter[key] === value} disabled={!can("filter")} aria-describedby={`${id}-abilities`}
              onClick={() => send({ ...context, type: "filter", filter: { ...filter, [key]: value } }, "filter")}>{value ?? (key === "type" ? "全部类型" : "全部状态")}</Button>)}
          </div>)}
        </div>
        <div className="flex min-w-0 flex-wrap gap-2" role="group" aria-label="呈现方式">
          <Button type="button" variant="outline" disabled={large} aria-pressed={!large && activeDisplay === "graph"} onClick={() => { if (!large) chooseDisplay("graph") }}>{narrow && !large ? "仍查看关系图" : "图与列表"}</Button>
          <Button type="button" variant="outline" aria-pressed={large || activeDisplay === "list"} onClick={() => chooseDisplay("list")}>仅列表</Button>
          <Button type="button" variant="outline" disabled={!can("layout")} onClick={() => send({ ...context, type: "request-layout", layout: layout === "grid" ? "layered" : "grid" }, "layout")}>切换布局</Button>
        </div>
      </>}
      {!large && ((!workspace && !narrow) || activeDisplay === "graph") && <RelationCanvas key={`${graphId}:${version}:${view}:${narrow}`} readable={narrow} nodes={projected.nodes} edges={projected.edges} layout={layout} thumbnail={!workspace && !narrow} selectedNodeId={selectedNodeId} onSelect={nodeId => send({ ...context, type: "select-node", nodeId })} />}
      {(workspace || !onExpand || large || narrow) && list}
      {!workspace && onExpand && !large && !narrow && <details><summary className="text-ui-action">查看节点与关系列表</summary>{list}</details>}
      {workspace && <>
        {selected ? <section aria-label="选中节点的邻接关系" className="min-w-0 space-y-3">
          <h4 className="text-item-title">已选：{nodeLabel(selected)}</h4>
          <p className="text-ui-hint">相邻关系（完整资料，包含筛选范围外的节点）</p>
          <ul className="text-ui-body space-y-2 break-words">{edges.filter(edge => edge.from === selected.id || edge.to === selected.id).map(edge => <li key={edge.id}>{edgeText(edge)}</li>)}</ul>
          {!edges.some(edge => edge.from === selected.id || edge.to === selected.id) && <p className="text-ui-hint">此节点暂无相邻关系。</p>}
          {capabilities["edit-node"].supported && <><Label htmlFor={`${id}-label`}>节点名称</Label>
          <Input id={`${id}-label`} value={selected.label} readOnly={!can("edit-node")} onChange={event => send({ ...context, type: "node-update", nodeId: selected.id, label: event.target.value }, "edit-node")} /></>}
          <div className="flex min-w-0 flex-wrap gap-2">
            {capabilities["edit-node"].supported && <Button type="button" variant="outline" disabled={!can("edit-node")} onClick={() => send({ ...context, type: "node-delete", nodeId: selected.id }, "edit-node")}>删除节点</Button>}
            {selected.source && <Button type="button" variant="outline" disabled={!ready || !text(selected.source.objectId)} onClick={() => { if (selected.source && text(selected.source.objectId)) send({ ...context, type: "open-source", nodeId: selected.id, source: selected.source }) }}>查看来源</Button>}
          </div>
          {capabilities["edit-edge"].supported && <RelationEdgeForm key={`${graphId}:${version}:${selected.id}`} nodes={nodes} from={selected} disabled={!can("edit-edge")} onCreate={(to, relationType) => { if (nodes.some(node => node.id === to) && text(relationType)) send({ ...context, type: "edge-create", from: selected.id, to, relationType }, "edit-edge") }} />}
        </section> : <p className="text-ui-hint">{selectedNodeId ? "所选节点不在当前范围，请重新选择。" : "选择节点可查看相邻关系与说明。"}</p>}
        {capabilities["edit-node"].supported && <div><Button type="button" variant="outline" disabled={!can("edit-node")} onClick={() => send({ ...context, type: "node-create" }, "edit-node")}>新增节点</Button></div>}
      </>}
      <p className="text-ui-hint break-words">{notice}</p>
      <RecordDetails>{details}</RecordDetails>
      {!workspace && onExpand && <div><Button data-relation-expand type="button" variant="outline" onClick={event => onExpand(event.currentTarget, context)}>查看关系图</Button></div>}
    </>}
    {workspace && onBack && <div><Button type="button" variant="outline" onClick={() => onBack(context)}>返回原位置</Button></div>}
  </Card>
}

function RelationEdgeForm({ nodes, from, disabled, onCreate }: { nodes: readonly AgentRelationNode[]; from: AgentRelationNode; disabled: boolean; onCreate: (to: string, relationType: string) => void }) {
  const id = useId()
  const [to, setTo] = useState<string | null>(null)
  const [relationType, setRelationType] = useState("")
  const valid = !disabled && nodes.some(node => node.id === to) && text(relationType)
  return <div className="min-w-0 space-y-2">
    <p className="text-ui-action">新增关系 · 起点：{nodeLabel(from)}</p>
    <div role="group" aria-label="选择关系终点" className="flex min-w-0 flex-wrap gap-2">{nodes.map(node => <Button key={node.id} type="button" variant="outline" className="max-w-full whitespace-normal" disabled={disabled} aria-pressed={to === node.id} onClick={() => { if (!disabled) setTo(node.id) }}>{nodeLabel(node)}</Button>)}</div>
    <Label htmlFor={`${id}-relation`}>关系名称</Label>
    <Input id={`${id}-relation`} value={relationType} readOnly={disabled} onChange={event => { if (!disabled) setRelationType(event.target.value) }} />
    <Button type="button" variant="outline" disabled={!valid} onClick={() => { if (valid && to) onCreate(to, relationType) }}>新增关系</Button>
  </div>
}
