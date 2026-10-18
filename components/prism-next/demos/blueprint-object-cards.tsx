"use client"

import { useState } from "react"
import { AgentStructureArranger } from "../agent-structure-arranger"
import { AgentRelationGraph } from "../agent-relation-graph"
import { arrangementExamples } from "./agent-structure-arranger"
import { coverageNodes, coverageEdges, relationCapabilities } from "./agent-relation-graph"

/** Fixed records: expanding a view never changes the supplied object/save state. */
export function BlueprintObjectCardsDemo() {
  const [arrangementView, setArrangementView] = useState<"inline" | "workspace">("inline")
  const [graphView, setGraphView] = useState<"inline" | "workspace">("inline")
  const record = arrangementExamples.paper
  return <section id="sheet-object-cards" aria-label="图纸内的独立对象卡片" className="mt-9 min-w-0 space-y-4">
    <h3 className="text-block-title">图纸内的独立对象卡片</h3>
    <p className="text-ui-body">固定示例：蓝图与夜图使用墨线外框和墨色标题；编排右侧显示当前记录身份。关系图未提供整体状态，标题右侧留空。展开只切换视图，不代表保存或完成。</p>
    <AgentRelationGraph title="知识点关系图（固定示例）" graphId="blueprint-coverage" version="example-v1" versionLabel="示例 v1"
      nodes={coverageNodes} edges={coverageEdges} capabilities={relationCapabilities} density="compact" view={graphView}
      onExpand={() => setGraphView("workspace")} onBack={() => setGraphView("inline")} />
    <AgentStructureArranger structure={{ id: "blueprint-arrangement", title: "数学课堂练习（固定示例）", version: { id: "example-v1", label: "示例 v1" }, baseVersion: { id: "example-v1", label: "示例 v1" } }}
      items={record.items} groups={record.groups} validation={[]} density="compact" view={arrangementView}
      onExpand={() => setArrangementView("workspace")} onBack={() => setArrangementView("inline")} />
  </section>
}
