"use client"

import { useState } from "react"
import { Button } from "@/components/coss/button"
import { Badge } from "@/components/coss/badge"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/coss/table"
import { DemoSection } from "./demo-parts"
import { AnalysisFilters, EvidenceTable } from "./analytics-components"
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
        <div className="evidence-matrix">
          <Table><TableCaption>横轴为测评轮次，纵轴为知识项。数字表示得分 / 满分；缺测与待复核均不按零分计算。</TableCaption>
            <TableHeader><TableRow><TableHead className="matrix-row-label">知识项 / 轮次</TableHead>{dates.map(date => <TableHead key={date} className="text-center tabular-nums">{date.slice(5).replace("-", "/")}</TableHead>)}</TableRow></TableHeader>
            <TableBody>{rows.map(topic => <TableRow key={topic.id}><TableHead scope="row" className="matrix-row-label">{topic.label}</TableHead>{dates.map(date => {
              const record = records.find(row => row.date === date && row.topic === topic.id)
              if (!record) return <TableCell key={date} className="text-center text-muted-foreground">未安排</TableCell>
              const scored = isScored(record)
              const label = scored ? `${record.score} / ${record.max}` : record.status === "missing" ? "缺测" : "待复核"
              return <TableCell key={date}><Button variant="ghost" className="matrix-cell" data-level={scored ? record.score : record.status} aria-pressed={drill?.value === record.id} aria-label={`${topic.label}，${date}，${label}，查看证据`} onClick={() => setDrill({ kind: "record", value: record.id, label: `${topic.label} · ${date.slice(5)}` })}>{label}</Button></TableCell>
            })}</TableRow>)}</TableBody>
          </Table>
        </div>
        <div className="matrix-legend text-xs text-muted-foreground" aria-label="矩阵图例">{[{ level: 0, text: "0 / 2" }, { level: 1, text: "1 / 2" }, { level: 2, text: "2 / 2" }, { level: "pending", text: "待复核" }, { level: "missing", text: "缺测" }].map(item => <span key={item.level}><i data-level={item.level}/>{item.text}</span>)}</div>
        <p role="status" className="text-sm">{drill ? `已选择：${drill.label}。下方显示该格证据；矩阵范围保持不变。` : "选择任意格子，下方即显示对应证据。"}</p>
        <EvidenceTable key={`${filter.learner}-${filter.topic}-${filter.range}-${drill?.value}`} records={drillRecords(records, drill)} drill={drill} onClear={() => setDrill(null)}/>
      </> : <div className="py-10 text-center text-sm"><p>当前范围没有作答记录。</p><Button className="mt-4" variant="outline" onClick={reset}>恢复示例数据</Button></div>}
    </div>
  </DemoSection>
}
