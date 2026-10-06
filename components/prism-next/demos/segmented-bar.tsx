"use client"

import { useState } from "react"
import { SegmentedBar, type SegmentedBarSegment } from "../charts/segmented-bar"
import { DemoSection, Feedback } from "../demo-parts"
import { ReviewDemoThemes, reviewFormula } from "./review-workspace-fixtures"

export const segmentedBarFixture: SegmentedBarSegment[] = [
  { id: "a", label: "资料整理", value: 55, tone: "info", description: "来自本次提供的分类数据。" },
  { id: "b", label: "内容核对", value: 30, tone: "success" },
  { id: "c", label: "补充说明", value: 15, tone: "warning" },
]
const tiny: SegmentedBarSegment[] = [
  { id: "major", label: "需要完整阅读并核对所有条件、推导步骤与最终结论之间关系的长中文分类名称", value: 98.99, tone: "chart-1", description: "长中文说明保留完整内容，空间不足时自然换行，不缩小字号。" },
  { id: "one", label: "百分之一", value: 1, tone: "chart-2" },
  { id: "tiny", label: "极小正值", value: 0.01, tone: "destructive" },
  { id: "zero", label: "零值仍在图例", value: 0, tone: "neutral" },
]
function Selectable({ legend = "below" }: { legend?: "none" | "below" }) {
  const [notice, setNotice] = useState("请选择分段或图例项。")
  return <><SegmentedBar segments={tiny} label="可选择的分类组成" legend={legend} onSelect={segment => setNotice(`已请求选择：${segment.label}`)} /><Feedback>{notice}</Feedback></>
}
export function SegmentedBarDemo() {
  return <>
    <DemoSection title="默认分段与图例" description="同一个总量的组成；图例显示真实数值、占比及外部说明。">
      <SegmentedBar label="分类数量组成" segments={segmentedBarFixture} unit="项" />
    </DemoSection>
    <DemoSection title="无图例与紧凑轨道" description="隐藏图例仍保留整条的可访问名称和所有分段数值。">
      <SegmentedBar label="紧凑分类组成" segments={segmentedBarFixture} legend="none" size="sm" />
    </DemoSection>
    <DemoSection title="总量中的余量" description="分段合计 100，总量 125；剩余 20% 保留轨道底色。">
      <SegmentedBar label="总量中的分类组成" segments={segmentedBarFixture} total={125} unit="项" valueFormatter={value => value.toFixed(1)} />
    </DemoSection>
    <DemoSection title="三主题 · 极小段、零值与 320px" description="极小正值保留可见宽度；占比仍按真实数据计算，条宽不适合用作精确测量。">
      <ReviewDemoThemes>{() => <><SegmentedBar label="长中文与极小值组成" segments={tiny} /><p className="text-ui-hint">公式上下文：{reviewFormula}</p><SegmentedBar label="全部为零" segments={[{ id: "zero", label: "零值", value: 0 }]} /><SegmentedBar label="空数组" segments={[]} legend="none" /></>}</ReviewDemoThemes>
    </DemoSection>
    <DemoSection title="可选择" description="Tab 到达正值段及全部图例项，Enter / Space 发出选择请求；数据不会随点击改变。">
      <ReviewDemoThemes>{() => <Selectable />}</ReviewDemoThemes>
    </DemoSection>
    <DemoSection title="仅条的键盘选择" description="没有图例时，正值段仍可聚焦和选择。">
      <Selectable legend="none" />
    </DemoSection>
  </>
}
