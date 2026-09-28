"use client"

import { useId, useRef, useState } from "react"
import { Field, FieldLabel } from "@/components/coss/field"
import { Button } from "../button"
import { QuestionSelect } from "../question-controls"
import { RootFormula } from "../math-content"
import { AgentStructuredContent, type AgentStructureCapabilities, type AgentStructureNode, type AgentStructureSave, type AgentStructuredContentIntent } from "../agent-structured-content"

const supported = { status: "supported" } as const
const textbookRestriction = { status: "unsupported", reason: "教材章节由出版版本确定，仅可折叠查看。" } as const
const lessonCapabilities: AgentStructureCapabilities = { view: supported, rename: supported, add: supported, delete: supported, move: supported, nest: supported }
const textbookCapabilities: AgentStructureCapabilities = { view: { status: "limited", reason: "仅提供本册章节层级与摘要。" }, rename: textbookRestriction, add: textbookRestriction, delete: textbookRestriction, move: textbookRestriction, nest: textbookRestriction }
const saveLabels = { unsaved: "未保存", "saved-draft": "已保存草稿", submitted: "已提交", conflict: "冲突", unknown: "状态未确认" }
const node = (id: string, title: string, children: AgentStructureNode[] = [], level = 1): AgentStructureNode => ({ id, title, type: level === 1 ? "教学环节" : "教学活动", level, status: { state: "normal" }, children })
export const structuredContentExamples = {
  lesson: {
    id: "internal-lesson-structure-example-20260926", title: "勾股定理复习课 · 备课提纲结构（示例）", capabilities: lessonCapabilities,
    nodes: [
      node("goal", "教学目标", [node("explain", "说明直角边与斜边的判断依据", [], 2)]),
      { ...node("calculate", "列式练习与公式说明", [
        { ...node("activity-a", "先标明边的角色，再列式 a² + b² = c²", [], 2), status: { state: "added" } as const },
        { ...node("activity-b", "交换解答并核对等式成立的前提", [], 2), status: { state: "added" } as const },
      ]), status: { state: "modified" } as const },
      node("recognize", "辨认图形", [node("rotate", "旋转直角三角形，说明位置改变后斜边的判断依据", [], 2)]),
      node("check", "课堂检查与解释依据"),
      node("followup", "待补充的教材、课时与学习条件"),
    ],
  },
  textbook: {
    id: "internal-textbook-structure-edition-20260926", title: "数学教材 · 章节结构（示例）", capabilities: textbookCapabilities,
    nodes: [
      { ...node("chapter-1", "第一章 · 一元二次方程", [
        { ...node("section-1", "配方法与等式变形", [], 2), type: "节" },
        { ...node("section-2", "求根公式及判别式", [
          { ...node("topic-1", "判别式与实数根的关系", [], 3), type: "知识主题" },
        ], 2), type: "节", summary: <div className="overflow-x-auto"><RootFormula /></div> },
      ]), type: "章" },
      { ...node("chapter-2", "第二章 · 勾股定理与应用"), type: "章" },
    ],
  },
}
const historicalLesson = [structuredContentExamples.lesson.nodes[0], structuredContentExamples.lesson.nodes[2], node("calculate", "列式练习与公式说明"), structuredContentExamples.lesson.nodes[3], structuredContentExamples.lesson.nodes[4]]

function mapNodes(nodes: readonly AgentStructureNode[], change: (node: AgentStructureNode) => AgentStructureNode): AgentStructureNode[] {
  return nodes.map(item => change({ ...item, children: mapNodes(item.children ?? [], change) }))
}
function removeNode(nodes: readonly AgentStructureNode[], id: string): AgentStructureNode[] {
  return nodes.filter(item => item.id !== id).map(item => ({ ...item, children: removeNode(item.children ?? [], id) }))
}
function relevel(item: AgentStructureNode, level: number): AgentStructureNode {
  return { ...item, level, children: (item.children ?? []).map(child => relevel(child, level + 1)) }
}
function insertNode(nodes: readonly AgentStructureNode[], item: AgentStructureNode, parentId: string | null, index: number): AgentStructureNode[] {
  if (parentId === null) {
    const next = [...nodes]
    next.splice(index, 0, relevel(item, 1))
    return next
  }
  return nodes.map(parent => parent.id === parentId
    ? { ...parent, children: [...(parent.children ?? []).slice(0, index), relevel(item, parent.level + 1), ...(parent.children ?? []).slice(index)] }
    : { ...parent, children: insertNode(parent.children ?? [], item, parentId, index) })
}
function findNode(nodes: readonly AgentStructureNode[], id: string): AgentStructureNode | undefined {
  for (const item of nodes) {
    if (item.id === id) return item
    const child = findNode(item.children ?? [], id)
    if (child) return child
  }
}
/** Example-only adapter: immutable session state, no save service or persistent storage. */
export function applyStructureExample(nodes: readonly AgentStructureNode[], intent: AgentStructuredContentIntent, newId: string): AgentStructureNode[] {
  if (intent.type === "rename") return mapNodes(nodes, item => item.id === intent.nodeId ? { ...item, title: intent.title, status: { state: item.status.state === "added" ? "added" : "modified" } } : item)
  if (intent.type === "delete") return mapNodes(nodes, item => item.id === intent.nodeId ? { ...item, status: { state: "deleted" } } : item)
  if (intent.type === "add") return insertNode(nodes, { ...node(newId, "新增教学活动"), status: { state: "added" } }, intent.target.parentId, intent.target.index)
  const moving = findNode(nodes, intent.nodeId)
  return moving ? insertNode(removeNode(nodes, intent.nodeId), { ...moving, status: { state: moving.status.state === "added" ? "added" : "modified" } }, intent.target.parentId, intent.target.index) : [...nodes]
}

export function StructuredContentExample({ purpose, narrow }: { purpose: keyof typeof structuredContentExamples; narrow: boolean }) {
  const example = structuredContentExamples[purpose]
  const id = useId()
  const workspace = useRef<HTMLElement>(null)
  const trigger = useRef<HTMLButtonElement | null>(null)
  const sequence = useRef(0)
  const [nodes, setNodes] = useState<readonly AgentStructureNode[]>(example.nodes)
  const [selected, setSelected] = useState<string | null>(purpose === "lesson" ? "calculate" : "section-2")
  const [expanded, setExpanded] = useState<string[]>(example.nodes.map(item => item.id))
  const [historical, setHistorical] = useState(false)
  const [conflict, setConflict] = useState(false)
  const [save, setSave] = useState<AgentStructureSave["state"]>(purpose === "lesson" ? "unsaved" : "unknown")
  const [changes, setChanges] = useState<string[]>(purpose === "lesson" ? ["新增 2 个教学活动；列式练习上移 1 位。"] : [])
  const [feedback, setFeedback] = useState("尚未调整结构。")
  const displayed = historical ? purpose === "lesson" ? historicalLesson : example.nodes : nodes
  const supplied = conflict && !historical ? mapNodes(displayed, item => item.id === (purpose === "lesson" ? "activity-b" : "topic-1")
    ? { ...item, status: { state: "conflict", reason: "另一版本调整了此节点的归属，请先核对。" } } : item) : displayed
  function receive(intent: AgentStructuredContentIntent) {
    if (historical || purpose !== "lesson" || intent.structureId !== example.id || intent.versionId !== "current-v2" || intent.baseVersionId !== "base-v1") return
    sequence.current += 1
    const newId = `example-added-${sequence.current}`
    const title = intent.nodeId ? findNode(nodes, intent.nodeId)?.title || "所选节点" : "顶层"
    const action = intent.type === "move" ? "移动" : intent.type === "rename" ? "重命名" : intent.type === "add" ? "新增" : "删除"
    setNodes(current => applyStructureExample(current, intent, newId))
    setSave("unsaved")
    setChanges(current => [...current, `${action}「${title}」${intent.type === "move" || intent.type === "add" ? `，目标第 ${intent.target.index + 1} 项` : ""}。`])
    setFeedback(`示例结构已调整：${action}。修改未保存。`)
  }
  return <div className="space-y-5">
    <div className="flex flex-wrap items-end gap-3">
      <Field><FieldLabel htmlFor={`${id}-save`}>保存状态示例</FieldLabel><QuestionSelect id={`${id}-save`} label="保存状态示例" value={save} onChange={value => setSave(value as AgentStructureSave["state"])} items={Object.entries(saveLabels).map(([value, label]) => ({ value, label }))} /></Field>
      <Button type="button" variant="outline" aria-pressed={historical} onClick={() => setHistorical(value => !value)}>历史版本示例</Button>
      <Button type="button" variant="outline" aria-pressed={conflict} onClick={() => setConflict(value => !value)}>下级节点冲突示例</Button>
    </div>
    <p className="text-ui-hint">固定示例；保存状态由上方单独切换。</p><p role="status" className="text-ui-hint">{feedback}</p>
    <div className="grid min-w-0 gap-6">{([
      ["inline", "default", "对话摘要"], ["workspace", "default", "完整层级编辑"], ["inline", "compact", "紧凑摘要"],
    ] as const).map(([view, density, label]) => <section key={`${view}-${density}`} ref={view === "workspace" ? workspace : undefined}
      tabIndex={view === "workspace" ? -1 : undefined} aria-label={label} className={`min-w-0 space-y-3 ${narrow ? "w-full max-w-[320px]" : ""}`}>
      <h3 className="text-block-title">{label}</h3>
      <AgentStructuredContent structure={{ id: example.id, title: example.title, version: { id: historical ? "history-v1" : "current-v2", label: historical ? "示例 v1" : "示例 v2" },
        baseVersion: { id: "base-v1", label: "示例 v1" }, ...(historical ? { snapshot: "固定历史结构", currentVersion: { id: "current-v2", label: "示例 v2" } } : {}) }}
        nodes={supplied} capabilities={example.capabilities} selectedNodeId={selected} onSelect={selection => setSelected(selection.nodeId)} expandedIds={expanded} onExpandedChange={setExpanded}
        view={view} density={density} onIntent={receive} save={historical ? { state: "unknown" } : { state: save, description: save === "conflict" ? "基准版本已有更新，当前结构保留，暂不能修改。" : undefined }}
        changes={{ baseVersion: { id: "base-v1", label: "示例 v1" }, summary: historical ? [] : changes }}
        onExpand={button => { trigger.current = button; workspace.current?.focus({ preventScroll: true }); workspace.current?.scrollIntoView({ block: "nearest" }) }}
        onBack={() => { trigger.current?.focus(); trigger.current?.scrollIntoView({ block: "nearest" }) }}
        notice="示例修改仅在本次页面中保留，刷新后还原。" details={<p>选择节点后，可用名称输入框和按钮调整结构。方向键浏览与折叠，Enter 或空格选择；上移、下移、升级、降级也可通过触屏或键盘操作。拖拽仅辅助移动，正文请在文档视图编辑。</p>} />
    </section>)}</div>
  </div>
}

export function AgentStructuredContentDemo() {
  const [purpose, setPurpose] = useState<keyof typeof structuredContentExamples>("lesson")
  const [narrow, setNarrow] = useState(false)
  return <section id="structured-content" className="mb-12 min-w-0 space-y-5">
    <h2 className="text-section-title">结构化内容工作区 v0.1 · 设计候选</h2>
    <div className="flex flex-wrap gap-3">{(["lesson", "textbook"] as const).map(value => <Button key={value} type="button" variant={purpose === value ? "secondary" : "outline"} aria-pressed={purpose === value} onClick={() => setPurpose(value)}>{value === "lesson" ? "备课提纲结构示例" : "教材章节结构示例"}</Button>)}
      <Button type="button" variant="outline" aria-pressed={narrow} onClick={() => setNarrow(value => !value)}>320px 窄容器</Button>
    </div>
    <StructuredContentExample key={purpose} purpose={purpose} narrow={narrow} />
  </section>
}
