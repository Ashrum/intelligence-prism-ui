"use client"

import { useState } from "react"
import { Card } from "@/components/coss/card"
import { Button } from "@/components/coss/button"
import { Badge } from "../badge"
import { DemoSection, Feedback } from "../demo-parts"
import { MetricSummary, DataRecordTable, type MetricSummaryItem } from "../data-display"
import { TrendChart, ComparisonChart } from "../charts/basic-charts"
import { QuadrantScatterChart } from "../charts/scatter-chart"
import { PairedDotChart } from "../charts/paired-dot-chart"
import { SegmentedBar, type SegmentedBarSegment } from "../charts/segmented-bar"
import { learningTrendSeries } from "./learning-chart-properties"

const value = (number: string, unit: string) => <span className="inline-flex flex-wrap items-baseline gap-1"><span>{number}</span><span className="text-ui-body">{unit}</span></span>
export const overviewMetrics: MetricSummaryItem[] = [
  { id: "score", label: "近期得分率", value: value("72", "%"), detail: "比按难度推算的预期高 3 个百分点", help: "近期得分率与预期怎么算：实际 72%，按题目难度推算的预期 69%。", visual: { kind: "sparkline", values: [65, 68, 70, 72] } },
  { id: "recovery", label: "补回率", value: value("61", "%"), detail: "之前失分的内容，再考时补回的比例", help: "补回率怎么算：比较同一内容失分后的可比再考；没有再考不补零。", visual: { kind: "ring", value: 61, max: 100 } },
  { id: "retention", label: "保持率", value: value("78", "%"), detail: "两周后再考，仍然做对的比例", help: "保持率怎么算：至少间隔两周的可比再考中，仍然做对的比例。", visual: { kind: "ring", value: 78, max: 100 } },
  { id: "focus", label: "需要优先处理", value: value("9", "人 · 2 个知识点"), detail: "按关注规则筛出", help: "关注规则是什么：本例由宿主提供需要支持 6 人、近期回落 3 人；组件不推断规则。" },
]
const focus = [
  { id: "application", label: "二次函数的应用", group: "knowledge", x: 55, y: 38, note: "知识点 · 优先处理" },
  { id: "chapter-22", label: "第二十二章 二次函数", group: "chapter", x: 59, y: 48, note: "章 · 优先处理" },
  { id: "roots", label: "根与系数的关系", group: "knowledge", x: 64, y: 56, note: "知识点 · 继续观察" },
  { id: "chapter-21", label: "第二十一章 一元二次方程", group: "chapter", x: 72, y: 70, note: "章 · 保持" },
]
const progress: SegmentedBarSegment[] = [
  { id: "stable", label: "稳定保持", value: 10, tone: "chart-1", description: "连续 3 次不低于预期" },
  { id: "improving", label: "正在巩固", value: 12, tone: "success", description: "补回率在上升" },
  { id: "awaiting", label: "已纠正待验证", value: 8, tone: "chart-5", description: "已订正，等下一次检测验证" },
  { id: "support", label: "需要支持", value: 6, tone: "warning", description: "连续低于预期，补回率低" },
  { id: "decline", label: "近期回落", value: 3, tone: "destructive", description: "此前做对的内容又出错" },
  { id: "unknown", label: "数据不足", value: 6, tone: "neutral", description: "有效检测不足 3 次" },
]

/** Review fixture only: external facts from the approved canvas; no Workspace business logic. */
export function LearningOverviewCards() {
  const [narrow, setNarrow] = useState(false), [edge, setEdge] = useState(false), [hidden, setHidden] = useState(true)
  const [notice, setNotice] = useState("示例数据；选择操作仅发出查看意图。")
  const select = (id: string) => setNotice(`请求查看：${id}`)
  const disclosure = hidden ? "hidden" : "visible"
  return <DemoSection id="embedded-cards" title="学情概览 · 嵌入卡片" description="依据已确认画布组合四个指标、趋势、课程聚焦和三张底卡；数据为固定示例。">
    <div className="mb-4 flex flex-wrap gap-2">
      <Button variant="outline" aria-pressed={narrow} onClick={() => setNarrow(!narrow)}>320px 卡片容器</Button>
      <Button variant="outline" aria-pressed={edge} onClick={() => setEdge(!edge)}>长中文、公式与单点</Button>
      <Button variant="outline" aria-pressed={!hidden} onClick={() => setHidden(!hidden)}>显示图表数据入口</Button>
    </div>
    <div className="@container grid min-w-0 max-w-full gap-4" style={{ width: narrow ? 320 : 1200 }}>
      <div className="grid min-w-0 items-start gap-4 @min-[900px]:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Card><MetricSummary layout="grid" items={edge ? overviewMetrics.map((item, i) => ({ ...item, label: i === 0 ? "近期得分率与长中文公式 x² + y² = 1 的适用范围" : item.label, visual: i === 0 ? { kind: "sparkline", values: [null, 0, null] } : item.visual })) : overviewMetrics} /></Card>
        <Card className="min-w-0 gap-3 p-4">
          <h3 className="text-block-title">班级得分率与预期</h3>
          <TrendChart label="班级得分率与预期" series={learningTrendSeries} unit="%" yDomain="auto" xTickMode="all" height={320} dataDisclosure={disclosure} onSelect={select} />
        </Card>
      </div>
      <Card className="min-w-0 gap-3 p-4">
        <h3 className="text-block-title">课程与知识点聚焦</h3>
        <p className="text-ui-hint text-muted-foreground">横轴看现在得分多少，纵轴看失分后补回多少；越靠左下越需要先处理。</p>
        <div className="grid min-w-0 gap-4 @min-[800px]:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <QuadrantScatterChart label="课程与知识点聚焦" data={focus} xLabel="近期得分率" yLabel="补回率" xUnit="%" unit="%" xDomain={[50, 90]} yDomain={[0, 100]} labelIds={["application", "roots"]} quadrants={{ x: 70, y: 61, labels: ["得分低 · 补得快", "得分高 · 补得快", "优先处理", "得分高 · 补得慢"], highlight: { quadrant: "bottom-left", tone: "destructive" } }} groups={[{ id: "chapter", label: "章", symbol: "circle" }, { id: "knowledge", label: "知识点", symbol: "diamond" }]} dataDisclosure={disclosure} onSelect={select} />
          <DataRecordTable rows={focus} columns={[{ id: "label", label: "章 / 知识点", render: row => <div className="whitespace-normal"><p>{row.label}</p><p className="text-ui-hint text-muted-foreground">{row.note}</p></div> }, { id: "x", label: "得分率", render: row => `${row.x}%` }, { id: "y", label: "补回率", render: row => `${row.y}%` }]} />
        </div>
        <Button variant="ghost" className="self-end" onClick={() => select("课程与知识点")}>查看课程与知识点 →</Button>
      </Card>
      <div className="grid min-w-0 gap-4 @min-[1000px]:grid-cols-3">
        <Card className="min-w-0 gap-3 p-4">
          <h3 className="text-block-title">学生学习进展</h3>
          <SegmentedBar label="学生学习进展" segments={progress} total={45} unit="人" legend="none" size="sm" dataDisclosure={disclosure} />
          <ul className="divide-y divide-border">{progress.map(item => <li key={item.id} className="flex items-center justify-between gap-3 py-2"><div className="min-w-0"><p className="text-ui-body">{item.label}</p><p className="text-ui-hint text-muted-foreground">{item.description}</p></div><span className="shrink-0 text-stat-display tabular-nums">{item.value}<span className="ml-1 text-ui-body">人</span></span></li>)}</ul>
          <Button variant="outline" className="h-auto whitespace-normal" onClick={() => select("需要支持和近期回落的 9 人")}>看需要支持和近期回落的 9 人</Button>
        </Card>
        <Card className="min-w-0 gap-3 p-4">
          <h3 className="text-block-title">错题：出错与再错</h3>
          <PairedDotChart label="错题：出错与再错" density="compact" unit="%" dataDisclosure={disclosure} metrics={[{ id: "error", label: "出错的学生占比", help: "本题未得满分学生数 / 本题有有效作答学生数。" }, { id: "repeat", label: "再考时仍然出错", help: "原失分学生中可比再考仍失分人数 / 有可比再考人数。" }]} data={[
            { id: "Q21", label: edge ? "第 21 题 矩形面积最大值 x(20 − x)，请结合完整中文题干核对" : "第 21 题 矩形面积最大值", first: 60, second: edge ? null : 47, tag: <Badge variant="secondary">优先重讲</Badge> },
            { id: "Q20", label: "第 20 题 销售利润", first: edge ? 50 : 57, second: edge ? 50 : 41, tag: <Badge variant="secondary">优先重讲</Badge> },
            { id: "Q14", label: "第 14 题 由两根求参数", first: edge ? 0 : 49, second: edge ? 100 : 33, tag: <Badge variant="secondary">继续观察</Badge> },
          ]} onSelect={select} />
          <Button variant="ghost" className="mt-auto self-end" onClick={() => select("错题")}>查看错题 →</Button>
        </Card>
        <Card className="min-w-0 gap-3 p-4">
          <h3 className="text-block-title">批阅数据积累</h3>
          <p className="text-ui-hint text-muted-foreground">近 8 周每周新增的有效作答</p>
          <ComparisonChart label="每周新增有效作答" variant="spark" unit="次" dataDisclosure={disclosure} data={[0, 168, 0, 248, 212, edge ? null : 0, 284, 336].map((amount, i) => ({ id: `week-${i + 1}`, label: i === 7 ? "第 8 周" : String(i + 1), value: amount }))} onSelect={select} />
          <dl className="divide-y divide-border text-ui-body">{[["已批阅的检测", "6 次"], ["覆盖的知识点", "24 / 31 个"], ["已对应到知识点的作答", "1,128 / 1,248 次"]].map(([label, text]) => <div key={label} className="flex flex-wrap justify-between gap-2 py-2"><dt>{label}</dt><dd className="tabular-nums">{text}</dd></div>)}</dl>
          <Button variant="ghost" className="self-end" onClick={() => select("未对应的 120 次")}>查看未对应的 120 次 →</Button>
          <div className="mt-auto flex flex-wrap justify-end gap-2"><Button variant="ghost" onClick={() => select("批阅记录")}>查看批阅记录 →</Button><Button variant="ghost" onClick={() => select("AI 批阅")}>开始一次 AI 批阅 →</Button></div>
        </Card>
      </div>
    </div>
    <Feedback>{notice}</Feedback>
  </DemoSection>
}
