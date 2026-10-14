"use client"

import { useState } from "react"
import { Button } from "@/components/coss/button"
import { Meter } from "@/components/coss/meter"
import { Badge } from "../badge"
import { DataRecordTable } from "../data-display"
import { RecordList } from "../record-list"
import { SegmentedBar } from "../charts/segmented-bar"
import { ComparisonChart } from "../charts/basic-charts"
import { DemoSection, Feedback } from "../demo-parts"

// Host-provided sample facts; no mastery classification or rate calculation in components.
export const learningRecordRows = [
  { id: "a", label: "一元二次方程", recent: 82, recovery: 75, retention: 90, mastery: "已掌握", reason: "" },
  { id: "b", label: "根与系数的关系", recent: 68, recovery: 65, retention: null, mastery: "基本掌握", reason: "暂无间隔至少 14 日的可比再考" },
  { id: "c", label: "二次函数的应用", recent: 52, recovery: 0, retention: 40, mastery: "待巩固", reason: "" },
  { id: "d", label: "数据不足的知识点", recent: null, recovery: null, retention: null, mastery: "数据不足", reason: "有效检测不足，比较依据尚未齐全" },
]

/** Demo-local composition, not a new component API. Null is not a zero-length bar. */
export function LearningRateCell({ value, label, reason }: { value: number | null; label: string; reason: string }) {
  return value === null
    ? <span className="whitespace-normal break-words text-ui-hint">数据不足：{reason}</span>
    : <div className="flex min-w-28 items-center gap-2"><Meter value={value} min={0} max={100} aria-label={label} className="w-20 shrink-0"/><span className="tabular-nums text-ui-body">{value}%</span></div>
}

export function LearningRecordProperties() {
  const [narrow, setNarrow] = useState(false), [long, setLong] = useState(false), [notice, setNotice] = useState("尚未请求查看依据。")
  const rows = learningRecordRows.map(row => ({ ...row, label: long ? `${row.label}：结合完整作答过程与课程位置核对的长中文名称` : row.label }))
  return <DemoSection id="learning-record-properties" title="学情表格与记录组合" description="通过公开 render / description 插槽组合 Meter 与 Badge；单值率用量值条，四档掌握度由宿主提供。零值保留 0%，缺测显示原因。">
    <div className="mb-4 flex flex-wrap gap-2"><Button variant="outline" aria-pressed={narrow} onClick={() => setNarrow(!narrow)}>320px 容器</Button><Button variant="outline" aria-pressed={long} onClick={() => setLong(!long)}>长中文与公式</Button></div>
    <div className="min-w-0 max-w-full space-y-6" style={{ width: narrow ? 320 : 960 }}>
      <DataRecordTable rows={rows} columns={[
        { id: "label", label: "知识点", render: row => <span className="block min-w-32 whitespace-normal break-words">{row.label}{long && <math aria-label="x 的平方加 y 的平方等于 1"><mrow><msup><mi>x</mi><mn>2</mn></msup><mo>+</mo><msup><mi>y</mi><mn>2</mn></msup><mo>=</mo><mn>1</mn></mrow></math>}</span> },
        ...([['recent', '得分率'], ['recovery', '补回率'], ['retention', '保持率']] as const).map(([id, label]) => ({ id, label, render: (row: typeof rows[number]) => <LearningRateCell value={row[id]} label={`${row.label}：${label}`} reason={row.reason}/> })),
        { id: "mastery", label: "掌握度", render: row => <Badge variant="outline">{row.mastery}</Badge> },
        { id: "action", label: "依据", render: row => <Button variant="ghost" onClick={() => setNotice(`请求查看：${row.label}`)}>查看<span className="sr-only">{row.label}依据</span></Button> },
      ]}/>
      <RecordList showHeader={false} showSearch={false} showType={false} showStatus={false} rows={rows.map(row => ({
        id: row.id, type: "知识点", name: row.label, metadata: "九年级数学 · 宿主提供的记录",
        description: <div className="flex flex-wrap items-center gap-3"><span>近期得分率</span><LearningRateCell value={row.recent} label={`${row.label}：近期得分率`} reason={row.reason}/><Badge variant="outline">{row.mastery}</Badge></div>,
        action: { id: "evidence", label: "查看依据" },
      }))} onRowAction={id => setNotice(`请求查看：${rows.find(row => row.id === id)?.label}`)}/>
      <section className="space-y-3" aria-label="掌握度人数构成"><h3 className="text-block-title">掌握度人数构成</h3><SegmentedBar label="四档掌握度人数" unit="人" segments={learningRecordRows.map((row, i) => ({ id: row.id, label: row.mastery, value: [12, 18, 8, 7][i] }))}/></section>
      <section className="space-y-3"><h3 className="text-block-title">只有实际值时的比较</h3><ComparisonChart label="知识点实际得分率" data={rows.map(row => ({ id: row.id, label: row.label, value: row.recent }))} unit="%" domain={[0, 100]} showValueLabels height={280}/></section>
    </div>
    <Feedback>{notice}</Feedback>
  </DemoSection>
}
