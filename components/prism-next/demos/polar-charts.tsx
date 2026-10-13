"use client"

import { useState } from "react"
import { Button } from "@/components/coss/button"
import { DonutChart, type DonutSegment } from "../charts/donut-chart"
import { RadarChart, type RadarAxis } from "../charts/radar-chart"
import { HeatmapChart } from "../charts/advanced-charts"
import { DemoSection, Feedback } from "../demo-parts"

const segments: DonutSegment[] = [
  { id: "choice", label: "单项选择", value: 40 }, { id: "multiple", label: "多项选择", value: 12 },
  { id: "fill", label: "填空", value: 16 }, { id: "solution", label: "解答与综合应用", value: 52 },
  { id: "optional", label: "本卷未安排的拓展探究题", value: 0 },
]
const axes: RadarAxis[] = ["运算求解与计算过程的完整表达", "函数模型与图像理解", "几何推理与证明", "数据分析与概率", "跨情境综合应用", "数学抽象", "直观想象", "数学表达"].map((label, index) => ({ id: `axis-${index}`, label, max: 100 }))

export function DonutChartDemo() {
  const [narrow, setNarrow] = useState(true), [right, setRight] = useState(false), [empty, setEmpty] = useState(false)
  const [notice, setNotice] = useState("点击扇区或图例，查看发出的项目 ID。")
  return <>
    <DemoSection id="donut-main" title="试卷分值组成" description="图高 180px；中心文字由调用方提供，所有文字与数字使用单色。主题随页面切换。">
      <div className="mb-4 flex flex-wrap gap-2">
        <Button variant="outline" aria-pressed={narrow} onClick={() => setNarrow(!narrow)}>300px 环形图</Button>
        <Button variant="outline" aria-pressed={right} onClick={() => setRight(!right)}>右侧图例</Button>
        <Button variant="outline" aria-pressed={empty} onClick={() => setEmpty(!empty)}>{empty ? "恢复数据" : "查看空数据"}</Button>
      </div>
      <div style={{ width: narrow ? 300 : 640, maxWidth: "100%" }}><DonutChart label="试卷分值组成" segments={empty ? [] : segments} centerText="120" centerSubtext="总分" legend={right ? "right" : "below"} valueFormatter={value => `${value} 分`} onSelect={id => setNotice(`请求查看：${id}；等待调用方处理。`)} /></div>
      <Feedback>{notice}</Feedback>
    </DemoSection>
    <DemoSection id="donut-boundaries" title="六分类、长中文与零值" description="六个非零分段逐一取色；零值只显示图例。更多分类由调用方先合并“其他”。">
      <div className="grid gap-6"><div className="w-[300px] max-w-full"><DonutChart label="六类组成" segments={Array.from({ length: 6 }, (_, index) => ({ id: `part-${index}`, label: `第 ${index + 1} 类 · 需要保留完整来源与统计口径的中文分类`, value: index + 1 }))} centerText="长中文中心文字" centerSubtext="长中文口径说明" /></div>
        <DonutChart label="全部为零" segments={segments.map(segment => ({ ...segment, value: 0 }))} />
      </div>
    </DemoSection>
  </>
}

export function RadarChartDemo() {
  const [narrow, setNarrow] = useState(true), [count, setCount] = useState(5), [empty, setEmpty] = useState(false), [compare, setCompare] = useState(true)
  const first = { id: "current", label: "本次测评", values: [72, 64, 83, 58, 69, 50, 80, 62].slice(0, count) }
  const second = { id: "baseline", label: "参考测评", values: [65, 71, 74, 62, 60, 58, 78, 66].slice(0, count) }
  return <>
    <DemoSection id="radar-main" title="多个维度的同尺度对照" description="轴上限均由调用方指定为 100。实线圆点与虚线菱形区分两组；长轴名悬停查看全文，数据表始终保留全名。主题随页面切换。">
      <div className="mb-4 flex flex-wrap gap-2">
        <Button variant="outline" aria-pressed={narrow} onClick={() => setNarrow(!narrow)}>300px 雷达图</Button>
        <Button variant="outline" aria-pressed={compare} onClick={() => setCompare(!compare)}>对照两组数据</Button>
        <Button variant="outline" aria-pressed={empty} onClick={() => setEmpty(!empty)}>{empty ? "恢复数据" : "查看空数据"}</Button>
        {[2, 3, 5, 8].map(value => <Button key={value} variant={count === value ? "default" : "outline"} aria-pressed={count === value} onClick={() => setCount(value)}>{value} 个轴</Button>)}
      </div>
      <div style={{ width: narrow ? 300 : 640, maxWidth: "100%" }}><RadarChart label="试卷能力维度对照" axes={axes.slice(0, count)} series={empty ? [] : compare ? [first, second] : [first]} /></div>
    </DemoSection>
    <DemoSection id="radar-fallback" title="轴数不足与全零数据" description="少于三个轴直接呈现数据表；零值是有效数据。">
      <div className="grid gap-6"><RadarChart label="两维数据替代" axes={axes.slice(0, 2)} series={[{ id: "current", label: "本次测评", values: [72, 64] }]} />
        <div className="w-[300px] max-w-full"><RadarChart label="全零雷达数据" axes={axes.slice(0, 3)} series={[{ id: "zero", label: "零值记录", values: [0, 0, 0] }]} /></div>
      </div>
    </DemoSection>
  </>
}

export function CompactHeatmapFixture() {
  const [five, setFive] = useState(false), [notice, setNotice] = useState("选择单元格或数据表项目，查看项目 ID。")
  const rows = ["运算求解", "推理论证", "数据分析", "模型建立", "综合应用"].slice(0, five ? 5 : 3).map((label, index) => ({ id: `row-${index}`, label }))
  const columns = ["基础", "进阶", "综合"].map((label, index) => ({ id: `column-${index}`, label }))
  return <DemoSection id="compact-heatmap" title="300px 紧凑矩阵" description="可选 compact 布局，保留格内数值、零值与缺测；原热力矩阵默认布局保持不变。">
    <Button variant="outline" className="mb-4" aria-pressed={five} onClick={() => setFive(!five)}>{five ? "切到 3 × 3" : "切到 5 × 3"}</Button>
    <div className="w-[300px] max-w-full"><HeatmapChart compact height={240} label="能力与题目层级" rows={rows} columns={columns} cells={rows.flatMap((row, r) => columns.map((column, c) => ({ id: `${row.id}-${column.id}`, row: row.id, column: column.id, value: r === 0 && c === 0 ? 0 : r === 1 && c === 2 ? null : (r + 1) * 10 + c * 5 })))} onSelect={id => setNotice(`请求查看：${id}；等待调用方处理。`)} /></div>
    <Feedback>{notice}</Feedback>
  </DemoSection>
}
