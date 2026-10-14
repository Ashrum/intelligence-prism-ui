"use client"
import { useState } from "react"
import { Button } from "@/components/coss/button"
import { DemoSection, Feedback } from "../demo-parts"
import { TrendChart, ComparisonChart } from "../charts/basic-charts"
import { ComboChart } from "../charts/combo-chart"
import { ScatterChart, QuadrantScatterChart } from "../charts/scatter-chart"
import { PairedDotChart } from "../charts/paired-dot-chart"

const positions = [{ value: undefined, label: "默认位置" }, { value: "top-left", label: "上方左对齐" }, { value: "bottom", label: "底部" }, { value: "none", label: "隐藏图例" }] as const
export function ChartLegendPositionDemo({ kind }: { kind: string }) {
 const [legendPosition, setPosition] = useState<"bottom" | "top-left" | "none" | undefined>("top-left")
 const [narrow, setNarrow] = useState(false), [long, setLong] = useState(false), [notice, setNotice] = useState("选择结果由外部接收。")
 const first = long ? "章：一元二次方程 x² − 3x + 2 = 0，需要结合完整答题证据与检测口径解释" : "章"
 const second = "知识点"
 const categories = [{ id: "a", label: "第一次" }, { id: "b", label: "第二次" }, { id: "c", label: "第三次" }]
 const data = categories.map((c, i) => ({ ...c, value: [60, 72, 80][i] }))
 const shared = { legendPosition, onSelect: (id: string) => setNotice(`请求查看：${id}`) }
 const scatter = { ...shared, label: "章与知识点", xLabel: "得分率", yLabel: "补回率", xUnit: "%", unit: "%", groups: [{ id: "chapter", label: first, symbol: "circle" as const }, { id: "knowledge", label: second, symbol: "diamond" as const }], data: [{ id: "a", label: "方程", group: "chapter", x: 60, y: 70 }, { id: "b", label: "根与系数", group: "knowledge", x: 80, y: 60 }] }
 return <DemoSection id="legend-position" title="图例位置" description="legendPosition 可选 bottom、top-left、none；省略时保持各组件原有位置。文字单色，标记带色；隐藏图例时数据表仍保留。">
  <div className="mb-4 flex flex-wrap gap-2">{positions.map(p => <Button key={p.label} variant="outline" aria-pressed={legendPosition === p.value} onClick={() => setPosition(p.value)}>{p.label}</Button>)}<Button variant="outline" aria-pressed={narrow} onClick={() => setNarrow(!narrow)}>320px 容器</Button><Button variant="outline" aria-pressed={long} onClick={() => setLong(!long)}>长中文与公式</Button></div>
  <div className="min-w-0 max-w-full" style={{ width: narrow ? 320 : 960 }}>
   {legendPosition === "none" && <p className="mb-3 text-ui-hint text-muted-foreground">宿主说明：{kind === "comparison-chart" ? "目标得分率为 70%。" : `${first} / ${second}；完整数据见下方表格。`}</p>}
   {kind === "trend-chart" && <TrendChart {...shared} label="可比检测趋势" unit="%" series={[{ id: "a", label: first, data }, { id: "b", label: second, lineStyle: "dashed", data: data.map(p => ({ ...p, value: p.value - 10 })) }]} />}
   {kind === "comparison-chart" && <ComparisonChart {...shared} label="班级得分率" unit="%" data={data} referenceLines={[{ value: 70, label: long ? first : "目标得分率", tone: "success" }]} />}
   {kind === "combo-chart" && <ComboChart {...shared} label="学习证据积累" categories={categories} axes={[{ id: "count", label: "作答数", unit: "次" }]} series={[{ id: "a", label: first, type: "bar", axisId: "count", data }, { id: "b", label: second, type: "line", axisId: "count", data: data.map(p => ({ ...p, value: p.value - 10 })) }]} />}
   {kind === "scatter-chart" && <ScatterChart {...scatter} />}
   {kind === "quadrant-chart" && <QuadrantScatterChart {...scatter} quadrants={{ x: 70, y: 65, labels: ["低分高补回", "高分高补回", "低分低补回", "高分低补回"] }} />}
   {kind === "paired-dot-chart" && <PairedDotChart {...shared} label="错题对比" unit="%" density="compact" metrics={[{ id: "first", label: first, help: "首次检测得分率。" }, { id: "second", label: second, help: "可比再考得分率；缺测不补零。" }]} data={[{ id: "a", label: "一元二次方程", first: 60, second: 80 }, { id: "b", label: "根与系数", first: 70, second: null }]} />}
  </div><Feedback>{notice}</Feedback>
 </DemoSection>
}
