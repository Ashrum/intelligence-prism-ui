"use client"

import { AgentDemoPreview, useAgentDemoPresentation } from "./agent-demo-presentation"

import { useLayoutEffect, useRef, useState } from "react"
import { AgentRelationGraph, type AgentRelationCapabilities, type AgentRelationEdge, type AgentRelationFilter, type AgentRelationIntent, type AgentRelationNode } from "../agent-relation-graph"
import { Button } from "../button"

export const relationCapabilities: AgentRelationCapabilities = {
  view: { supported: true }, filter: { supported: true }, "edit-node": { supported: true }, "edit-edge": { supported: true }, layout: { supported: true },
}
export const coverageNodes: readonly AgentRelationNode[] = [
  ...["顶点与对称轴", "开口与图像变换", "函数与方程", "二次函数实际应用中的数量关系与条件分析", "函数最值", "参数变化"].map((label, index) => ({
    id: `knowledge-${index}`, label, type: "知识点", level: 1, group: index < 3 ? "二次函数" : "函数应用",
    status: index >= 4 ? "未覆盖" : index === 2 ? "薄弱" : "已覆盖", description: index === 2 ? "示例标记：需要补充不同情境的练习。" : undefined,
    source: { objectId: `knowledge-${index}`, label, version: "example" },
  })),
  ...Array.from({ length: 8 }, (_, index) => ({ id: `question-${index}`, label: `第 ${index + 1} 题${index === 0 ? " · y = (x − 2)² + 3" : ""}`, type: "题目", level: 2, status: "已选", source: { objectId: `question-${index}`, label: `模拟题目 ${index + 1}`, version: "example" } })),
  { id: "chapter-0", label: "二次函数", type: "章节", level: 0 }, { id: "chapter-1", label: "函数应用", type: "章节", level: 0 },
]
export const coverageEdges: readonly AgentRelationEdge[] = [
  ...Array.from({ length: 6 }, (_, index) => ({ id: `chapter-edge-${index}`, from: `chapter-${index < 3 ? 0 : 1}`, to: `knowledge-${index}`, type: "包含" })),
  ...Array.from({ length: 8 }, (_, index) => ({ id: `question-edge-${index}`, from: `knowledge-${index % 4}`, to: `question-${index}`, type: "考查", weight: 1, description: "模拟关联" })),
]
const conceptNodes: readonly AgentRelationNode[] = [
  { id: "concept-0", label: "观察图像", type: "学习活动", level: 0 },
  { id: "concept-1", label: "提出函数性质猜想", type: "学习活动", level: 1 },
  { id: "concept-2", label: "代数验证与反例检验", type: "学习活动", level: 2 },
]
const conceptEdges: readonly AgentRelationEdge[] = [
  { id: "concept-edge-0", from: "concept-0", to: "concept-1", type: "引出" },
  { id: "concept-edge-1", from: "concept-1", to: "concept-2", type: "验证" },
  { id: "concept-edge-2", from: "concept-2", to: "concept-1", type: "修正" },
]
export function RelationGraphExample({ kind = "coverage", narrow = false }: { kind?: "coverage" | "concept" | "large"; narrow?: boolean }) {
  const presentation = useAgentDemoPresentation()
  const [view, setView] = useState<"inline" | "workspace">("inline")
  const [nodes, setNodes] = useState<readonly AgentRelationNode[]>(kind === "concept" ? conceptNodes : coverageNodes)
  const [edges, setEdges] = useState<readonly AgentRelationEdge[]>(kind === "concept" ? conceptEdges : coverageEdges)
  const [revision, setRevision] = useState(1)
  const [selectedNodeId, setSelected] = useState<string | null>(kind === "concept" ? conceptNodes[0].id : null)
  const [filter, setFilter] = useState<AgentRelationFilter>({})
  const [layout, setLayout] = useState<"grid" | "layered">("layered")
  const [feedback, setFeedback] = useState("")
  const panel = useRef<HTMLDivElement>(null)
  const restore = useRef(false)
  const graphId = `example-${kind}`, version = `revision-${revision}`
  useLayoutEffect(() => {
    if (!restore.current) return
    restore.current = false
    if (view === "workspace") panel.current?.focus()
    else panel.current?.querySelector<HTMLButtonElement>("[data-relation-expand]")?.focus()
  }, [view])
  function receive(intent: AgentRelationIntent) {
    if (intent.graphId !== graphId || intent.version !== version) return
    if (intent.type === "select-node") setSelected(intent.nodeId)
    else if (intent.type === "filter") setFilter(intent.filter)
    else if (intent.type === "request-layout") setLayout(intent.layout)
    else if (intent.type === "open-source") setFeedback(`请求查看${intent.source.label}；本示例未连接对象详情。`)
    else {
      if (kind === "concept") return
      if (intent.type === "node-create") setNodes(items => [...items, { id: `added-${revision}`, label: `新节点 ${revision}`, type: "概念" }])
      if (intent.type === "node-update") setNodes(items => items.map(item => item.id === intent.nodeId ? { ...item, label: intent.label } : item))
      if (intent.type === "node-delete") {
        setNodes(items => items.filter(item => item.id !== intent.nodeId)); setEdges(items => items.filter(item => item.from !== intent.nodeId && item.to !== intent.nodeId)); setSelected(null)
      }
      if (intent.type === "edge-create") setEdges(items => [...items, { id: `added-edge-${revision}`, from: intent.from, to: intent.to, type: intent.relationType }])
      if (intent.type === "edge-delete") setEdges(items => items.filter(item => item.id !== intent.edgeId))
      setRevision(value => value + 1); setFeedback("已调整本页模拟资料，未保存。")
    }
  }
  // Counts use explicit node statuses. They never infer learning weakness or coverage from edges.
  const statusCounts = [...new Set(nodes.filter(node => node.type === "知识点").map(node => node.status || "未知"))].map(label => ({ label, count: nodes.filter(node => node.type === "知识点" && (node.status || "未知") === label).length }))
  const missing = nodes.filter(node => node.type === "知识点" && node.status === "未覆盖")
  const capabilities = kind === "concept" ? { ...relationCapabilities, "edit-node": { supported: false as const, reason: "此概念图仅供阅读，尚未提供编辑能力。" }, "edit-edge": { supported: false as const, reason: "此概念图仅供阅读，尚未提供编辑能力。" } } : relationCapabilities
  if (presentation.previewOnly) return <AgentDemoPreview feedback={feedback}><AgentRelationGraph title={kind === "concept" ? "概念推演（模拟）" : kind === "large" ? "超出图示上限（模拟）" : "试卷知识点覆盖（模拟）"}
      graphId={graphId} version={version} versionLabel={`本页资料第 ${revision} 版 · ${revision === 1 ? "预置模拟" : "未保存"}`} nodes={nodes} edges={edges}
      summary={kind === "concept" ? undefined : { statusCounts, gaps: missing.length ? [`未覆盖知识点 ${missing.length} 个：${missing.map(node => node.label).join("、")}`] : [] }}
      capabilities={capabilities} layout={layout} graphThreshold={kind === "large" ? 10 : 80} filter={filter} selectedNodeId={selectedNodeId}
        onIntent={receive}
      details="所有节点、关系和覆盖状态均为模拟；图中位置只用于阅读，不表示掌握程度。示例删除节点时同时移除关联连线，仅改变本页资料。" view={presentation.view ?? "inline"} density={presentation.density ?? "default"} onExpand={presentation.onExpand} onBack={presentation.onBack} /></AgentDemoPreview>
  return <div ref={panel} tabIndex={-1} className={`min-w-0 space-y-2 ${narrow ? "max-w-[320px]" : ""}`}>
    <AgentRelationGraph title={kind === "concept" ? "概念推演（模拟）" : kind === "large" ? "超出图示上限（模拟）" : "试卷知识点覆盖（模拟）"}
      graphId={graphId} version={version} versionLabel={`本页资料第 ${revision} 版 · ${revision === 1 ? "预置模拟" : "未保存"}`} nodes={nodes} edges={edges}
      summary={kind === "concept" ? undefined : { statusCounts, gaps: missing.length ? [`未覆盖知识点 ${missing.length} 个：${missing.map(node => node.label).join("、")}`] : [] }}
      capabilities={capabilities} layout={layout} graphThreshold={kind === "large" ? 10 : 80} filter={filter} selectedNodeId={selectedNodeId}
      view={view} density={kind === "large" ? "compact" : "default"} onIntent={receive}
      onExpand={() => { restore.current = true; setView("workspace") }} onBack={() => { restore.current = true; setView("inline") }}
      details="所有节点、关系和覆盖状态均为模拟；图中位置只用于阅读，不表示掌握程度。示例删除节点时同时移除关联连线，仅改变本页资料。" />
    {feedback && <p role="status" className="text-ui-hint break-words">{feedback}</p>}
  </div>
}
export function AgentRelationGraphDemo() {
  const presentation = useAgentDemoPresentation()
  const [narrow, setNarrow] = useState(false)
  if (presentation.previewOnly) return <RelationGraphExample kind="coverage" narrow={narrow} />
  return <section id={presentation.embedded ? undefined : "relation-graph"} className="min-w-0 space-y-5 py-6">
    {!presentation.embedded && <h2 className="text-section-title">图形关系工作区</h2>}
    <p className="text-ui-body">模拟试卷：6 个知识点、8 道题、2 个章节；2 个知识点未覆盖、1 个薄弱。另含只读概念图与超上限列表示例。窄容器默认展示列表，可选择“仍查看关系图”并滚动浏览，返回“仅列表”。</p>
    <Button type="button" variant="outline" aria-pressed={narrow} onClick={() => setNarrow(value => !value)}>320px 窄容器</Button>
    {(["coverage", "concept", "large"] as const).map(kind => <RelationGraphExample key={kind} kind={kind} narrow={narrow} />)}
  </section>
}
