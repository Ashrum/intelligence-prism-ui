"use client"

import { useLayoutEffect, useMemo, useRef, useState } from "react"
import { Button } from "../button"
import { AgentDistributionMatrix, type AgentDistributionCell, type AgentDistributionComparison, type AgentDistributionIntent, type AgentDistributionMatrixProps } from "../agent-distribution-matrix"
import { AgentEvidenceDrilldown } from "../agent-evidence-drilldown"

type Fixture = Pick<AgentDistributionMatrixProps, "title" | "record" | "scope" | "rowDimension" | "columnDimension" | "cells" | "method" | "sample" | "cellSample" | "keyRegions" | "bands" | "notice" | "details">
const formula = <math className="prism-math" aria-label="x 等于负 b 除以二 a"><mi>x</mi><mo>=</mo><mo>−</mo><mfrac><mi>b</mi><mrow><mn>2</mn><mi>a</mi></mrow></mfrac></math>
const bands: Fixture["bands"] = [
  { id: "lower", label: "低段", interval: "0% ≤ 得分率 < 60%", tone: "warning" },
  { id: "middle", label: "中段", interval: "60% ≤ 得分率 < 80%", tone: "info" },
  { id: "upper", label: "高段", interval: "80% ≤ 得分率 ≤ 100%", tone: "success" },
]
// Values and memberships are explicitly authored fixtures, never calculated by the component.
const studentValues = [
  [[80, "upper"], [100, "upper"], [60, "middle"], [40, "lower"]],
  [[100, "upper"], [80, "upper"], [80, "upper"], [60, "middle"]],
  [[60, "middle"], [80, "upper"], [40, "lower"], null],
  [[80, "upper"], [60, "middle"], [100, "upper"], [80, "upper"]],
  [[100, "upper"], [80, "upper"], [60, "middle"], [20, "lower"]],
  [[40, "lower"], null, [60, "middle"], [0, "lower"]],
] as const
const studentCells: AgentDistributionCell[] = studentValues.flatMap((values, row) => values.map((value, column) => {
  const ref = { rowId: `s${row + 1}`, columnId: `q${column + 1}` }
  if (!value) return row === 2 ? { ...ref, reading: { state: "insufficient", reason: "仅取得一个评分点，未达到本题要求的两个评分点。" }, sampleSize: "1 个评分点", denominator: "", disabledReason: "仅取得一个评分点，未达到本题要求的两个评分点。" }
    : { ...ref, reading: { state: "missing", reason: "缺交，未收到本题作答。" }, sampleSize: "0 份作答", disabledReason: "缺交，未收到本题作答。" }
  return { ...ref, reading: { state: "available", value: value[0], unit: "%" }, bandId: value[1], selectable: true }
}))

export const distributionMatrixExamples: Record<"students" | "knowledge", Fixture> = {
  students: {
    title: "学生与题目得分率 · 示例",
    record: { id: "fixture-result-students", version: "结果示例 v1", dataTime: "2026-09-26 10:00" },
    scope: { state: "available", summary: "九年级（1）班 · 二次函数练习 · 六名学生、四道题" },
    rowDimension: { id: "student", label: "学生", items: ["陈晨", "李明", "王悦", "赵宁", "周岚", "林晓"].map((label, i) => ({ id: `s${i + 1}`, label })) },
    columnDimension: { id: "question", label: "题目", items: [
      { id: "q1", label: "第 1 题 · 函数识别" }, { id: "q2", label: "第 2 题 · 图像平移" }, { id: "q3", label: "第 3 题 · 最值" },
      { id: "q4", label: "第 4 题 · 结合实际情境解释二次函数对称轴与最值的关系", content: <>第 4 题 · 结合实际情境解释二次函数对称轴 {formula} 与最值的关系</> },
    ] },
    cells: studentCells,
    method: "各题有效得分 ÷ 对应满分；缺交与样本不足分别标注。",
    sample: { size: "6 名学生", denominator: "每题满分 5 分" },
    cellSample: { size: "1 份作答", denominator: "5 分" },
    keyRegions: [{ id: "lower-cells", label: "先核对最值题的两处低值", summary: <>可结合对称轴 {formula} 回看对应过程。</>,
      basis: "教师选定的示例关注区域，按原题序呈现。", cells: [{ rowId: "s1", columnId: "q4" }, { rowId: "s5", columnId: "q4" }] }],
    bands,
    notice: "示例分级仅描述本次得分，不代表稳定学习能力。",
    details: <p>六行四列为固定示例；分级区间、每格归属与关键区域均已给定。查看依据只打开示例说明，没有连接真实作答服务。</p>,
  },
  knowledge: {
    title: "知识点与班级得分率 · 示例",
    record: { id: "fixture-result-knowledge", version: "知识点示例 v2", dataTime: "2026-09-26 11:00" },
    scope: { state: "available", summary: "九年级（1）班与（2）班 · 同一练习范围" },
    rowDimension: { id: "knowledge", label: "知识点", items: [
      { id: "k1", label: "二次函数的图像与性质" },
      { id: "k2", label: "从实际情境中建立函数模型并解释对称轴、最值与自变量取值范围的关系", content: <>从实际情境中建立函数模型并解释对称轴 {formula}、最值与自变量取值范围的关系</> },
      { id: "k3", label: "韦达定理的拓展应用" },
    ] },
    columnDimension: { id: "class", label: "班级", items: [{ id: "c1", label: "九年级（1）班" }, { id: "c2", label: "九年级（2）班" }] },
    cells: [
      { rowId: "k1", columnId: "c1", reading: { state: "available", value: "80.0", unit: "%" }, bandId: "upper", selectable: true },
      { rowId: "k1", columnId: "c2", reading: { state: "available", value: "70.0", unit: "%" }, bandId: "middle", selectable: true },
      { rowId: "k2", columnId: "c1", reading: { state: "available", value: "60.0", unit: "%" }, bandId: "middle", selectable: true },
      { rowId: "k2", columnId: "c2", reading: { state: "available", value: "50.0", unit: "%" }, bandId: "lower", selectable: true },
      { rowId: "k3", columnId: "c1", reading: { state: "not-applicable", reason: "本班本次练习不涉及该知识点。" }, sampleSize: "不适用", denominator: "不适用", disabledReason: "本班本次练习不涉及该知识点。" },
      { rowId: "k3", columnId: "c2", reading: { state: "unknown", reason: "知识点映射尚未核对。" }, sampleSize: "", denominator: "", disabledReason: "知识点映射尚未核对。" },
    ],
    method: "按已映射的有效作答得分与对应满分计算；班级样本由示例记录提供。",
    sample: { size: "两个班级，各 6 名学生", denominator: "各知识点有效作答对应满分" },
    cellSample: { size: "6 名学生", denominator: "30 分" },
    keyRegions: [{ id: "model-region", label: "关注建模题组", summary: <>两班的函数建模题组可结合对称轴 {formula} 并排核对。</>, basis: "示例教研记录指定的关注区域；不由颜色生成诊断。",
      cells: [{ rowId: "k2", columnId: "c1" }, { rowId: "k2", columnId: "c2" }] }],
    bands,
    notice: "班级对照须结合有效样本和对应题组解读。",
  },
}

export function DistributionMatrixExample({ purpose, narrow = false, initialView = "inline" }: { purpose: "students" | "knowledge"; narrow?: boolean; initialView?: "inline" | "workspace" }) {
  const fixture = distributionMatrixExamples[purpose]
  const [view, setView] = useState(initialView)
  const [compact, setCompact] = useState(false)
  const [transposed, setTransposed] = useState(false)
  const [filter, setFilter] = useState("all")
  const [sort, setSort] = useState("source")
  const [comparison, setComparison] = useState<AgentDistributionComparison>({ axis: "column", memberIds: [] })
  const [selection, setSelection] = useState<Extract<AgentDistributionIntent, { type: "select-cell" }> | null>(null)
  const [showEvidence, setShowEvidence] = useState(false)
  const container = useRef<HTMLDivElement>(null)
  const evidence = useRef<HTMLElement>(null)
  const evidenceTrigger = useRef<HTMLButtonElement>(null)
  const focusPending = useRef(false)
  useLayoutEffect(() => {
    if (!focusPending.current) return
    focusPending.current = false
    if (showEvidence) evidence.current?.focus({ preventScroll: true })
    else if (evidenceTrigger.current?.isConnected) evidenceTrigger.current.focus({ preventScroll: true })
    else if (view === "workspace") container.current?.focus({ preventScroll: true })
    else [...(container.current?.querySelectorAll<HTMLButtonElement>("button") ?? [])].find(button => button.textContent?.includes("查看完整分布"))?.focus({ preventScroll: true })
  }, [view, showEvidence])
  const sourceRows = transposed ? fixture.columnDimension : fixture.rowDimension
  const sourceColumns = transposed ? fixture.rowDimension : fixture.columnDimension
  const projected = useMemo(() => {
    const rows = sourceRows.items.filter(row => filter === "all" || row.id === filter)
    if (sort === "label") rows.sort((a, b) => a.label.localeCompare(b.label, "zh-CN"))
    return { rows, cells: fixture.cells.map(cell => transposed ? { ...cell, rowId: cell.columnId, columnId: cell.rowId } : cell) }
  }, [fixture, sourceRows, filter, sort, transposed])
  const intent = (event: AgentDistributionIntent, trigger?: HTMLButtonElement) => {
    if (event.type === "select-cell") { evidenceTrigger.current = trigger ?? null; setSelection(event); focusPending.current = true; setShowEvidence(true) }
    else if (event.type === "filter") { setFilter(event.value); setComparison({ axis: "column", memberIds: [] }) }
    else if (event.type === "sort") setSort(event.sortId)
    else if (event.type === "compare") setComparison({ axis: event.axis, memberIds: event.memberIds })
    else {
      setTransposed(event.axis === "row" ? event.dimensionId === fixture.columnDimension.id : event.dimensionId === fixture.rowDimension.id)
      setFilter("all"); setComparison({ axis: "column", memberIds: [] }); setSelection(null)
    }
  }
  const changeView = (next: "inline" | "workspace") => { evidenceTrigger.current = null; focusPending.current = true; setView(next) }
  const selectedRow = selection && sourceRows.items.find(row => row.id === selection.rowId)
  const selectedColumn = selection && sourceColumns.items.find(column => column.id === selection.columnId)
  const options = [fixture.rowDimension, fixture.columnDimension].map(({ id, label }) => ({ id, label }))
  const props: AgentDistributionMatrixProps = { ...fixture,
    rowDimension: { ...sourceRows, items: projected.rows, options }, columnDimension: { ...sourceColumns, options }, cells: projected.cells,
    keyRegions: filter === "all" ? fixture.keyRegions.map(region => ({ ...region, cells: region.cells?.map(cell => transposed ? { rowId: cell.columnId, columnId: cell.rowId } : cell) })) : [],
    sample: filter === "all" ? fixture.sample : { size: "所选行对应的有效作答，逐格见数据提示", denominator: "所选行对应满分" },
    scope: { state: "available", summary: `${sourceRows.label} × ${sourceColumns.label}${filter !== "all" ? ` · ${projected.rows[0]?.label ?? "未选择"}` : " · 完整示例范围"}` },
    filters: [{ id: "row", label: "显示范围", value: filter, options: [{ id: "all", label: "全部行" }, ...sourceRows.items] }],
    sort: { value: sort, options: [{ id: "source", label: "原记录顺序" }, { id: "label", label: "行名称升序" }], basis: sort === "source" ? "按示例记录顺序排列。" : "仅按行名称升序排列。" },
    comparison, selectedCell: selection ?? undefined, onIntent: intent,
    onExpand: () => changeView("workspace"), onBack: () => changeView("inline"),
  }
  return <div className={`min-w-0 space-y-4 ${narrow ? "w-full max-w-[320px]" : ""}`}>
    <p className="text-ui-hint">固定示例 · 展开与返回共用同一结果；筛选、排序和比较只调整本次查看范围。</p>
    <Button type="button" variant="outline" size="navigation" aria-pressed={compact} onClick={() => setCompact(value => !value)}>紧凑密度</Button>
    {showEvidence && selection && <section ref={evidence} tabIndex={-1} aria-label="单元格依据示例">
      <AgentEvidenceDrilldown view="workspace" conclusion={{ id: "fixture-cell-basis", statement: `${selectedRow?.label} · ${selectedColumn?.label}`, version: selection.version,
        coverage: { state: "incomplete", description: "固定示例只提供口径说明，没有真实学生作答。" } }}
        nodes={[{ kind: "evidence", id: "fixture-source", title: "示例评分记录", type: "口径说明", source: { objectId: fixture.record.id, label: fixture.title, version: selection.version, location: `${selectedRow?.label} · ${selectedColumn?.label}` },
          relation: "pending", facts: [{ state: "unknown", description: "真实作答证据尚未接入。" }], summary: fixture.method }]}
        onBack={() => { focusPending.current = true; setShowEvidence(false) }} />
    </section>}
    <div ref={container} tabIndex={-1} aria-label={view === "workspace" ? "完整分布视图" : "分布记录摘要"}>
      <AgentDistributionMatrix {...props} view={view} density={compact ? "compact" : "default"} />
    </div>
  </div>
}

export function AgentDistributionMatrixDemo() {
  const [purpose, setPurpose] = useState<"students" | "knowledge">("students")
  const [narrow, setNarrow] = useState(false)
  return <section id="distribution-matrix" className="mb-12 min-w-0 space-y-5">
    <h2 className="text-section-title">分布矩阵 v0.1 · 设计候选</h2>
    <div className="flex flex-wrap gap-3">{(["students", "knowledge"] as const).map(value => <Button key={value} type="button" size="navigation"
      variant={purpose === value ? "secondary" : "outline"} aria-pressed={purpose === value} onClick={() => setPurpose(value)}>{value === "students" ? "学生 × 题目（6 × 4）" : "知识点 × 班级"}</Button>)}
      <Button type="button" size="navigation" variant="outline" aria-pressed={narrow} onClick={() => setNarrow(value => !value)}>320px 窄容器</Button>
    </div>
    <DistributionMatrixExample key={purpose} purpose={purpose} narrow={narrow} />
  </section>
}
