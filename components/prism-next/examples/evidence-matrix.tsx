"use client"
import { HeatmapChart } from "@/components/prism-next/charts/advanced-charts"

import { useState } from "react"
import { Button } from "@/components/coss/button"
import { Badge } from "@/components/coss/badge"
import { DemoSection } from "@/components/prism-next/demo-parts"
import { AnalysisFilters, EvidenceTable } from "@/components/prism-next/demos/analysis-adapters"
import { initialFilter, sampleRecords, topics, filterRecords, drillRecords, summarize, isScored, type Drill } from "@/lib/prism-next/analytics-model"

export function EvidenceMatrixDemo() {
  const [filter, setFilter] = useState(initialFilter)
  const [drill, setDrill] = useState<Drill>(null)
  const records = filterRecords(sampleRecords, filter)
  const dates = [...new Set(records.map(row => row.date))].sort()
  const rows = topics.filter(topic => records.some(row => row.topic === topic.id))
  const summary = summarize(records)
  const reset = () => { setFilter(initialFilter); setDrill(null) }
  return <DemoSection title="每次作答，放回知识点与时间中" description="查看分数落在哪一项、哪一轮；点击格子核对原始记录。">
    <div className="analytics-workspace q-workbench space-y-6">
      <div className="flex flex-wrap items-center gap-3 text-sm"><Badge variant="outline">SYN-A · 合成演示数据</Badge><span className="text-muted-foreground">只呈现本组题目表现，不推断知识掌握程度。</span></div>
      <AnalysisFilters value={filter} onChange={next => { setFilter(next); setDrill(null) }} onReset={reset}/>
      {records.length ? <>
        <div className="flex flex-wrap justify-between gap-3 text-sm"><p>{records.length} 条证据 · 已复核 {summary.scored} · 待复核 {summary.pending} · 缺测 {summary.missing}</p><p className="text-muted-foreground">每题满分 2 分 · 评分标准 v1</p></div>
        <HeatmapChart label="知识项与轮次" rows={rows} columns={dates.map(date=>({id:date,label:date.slice(5)}))} cells={records.map(row=>({id:row.id,row:row.topic,column:row.date,value:isScored(row)?row.score:null,label:isScored(row)?`${row.score} / ${row.max}`:row.status==="missing"?"缺测":"待复核"}))} selectedId={drill?.value} onSelect={id=>{const row=records.find(r=>r.id===id)!;setDrill({kind:"record",value:id,label:`${topics.find(t=>t.id===row.topic)?.label} · ${row.date.slice(5)}`})}}/>
        <p role="status" className="text-sm">{drill ? `已选择：${drill.label}。下方显示该格证据；矩阵范围保持不变。` : "选择任意格子，下方即显示对应证据。"}</p>
        <EvidenceTable key={`${filter.learner}-${filter.topic}-${filter.range}-${drill?.value}`} records={drillRecords(records, drill)} drill={drill} onClear={() => setDrill(null)}/>
      </> : <div className="py-10 text-center text-sm"><p>当前范围没有作答记录。</p><Button className="mt-4" variant="outline" onClick={reset}>恢复示例数据</Button></div>}
    </div>
  </DemoSection>
}
