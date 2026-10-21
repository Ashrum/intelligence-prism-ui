"use client"

import { TrendChart, type ChartSeries } from "../charts/basic-charts"
import { ChartLegend } from "../charts/chart-legend"
import { BpSectionCard } from "../blueprint/blueprint"

// Frozen C0 SHEET 01/B data. Duplicate W07 labels represent separate detections.
const ticks: [string, string][] = [["W06", "起点检测"], ["W07", "课堂练习"], ["W07", "课堂诊断"], ["W08", "单元复查"], ["W11", "巩固检测"], ["W12", "新情境"]]
export const blueprintTrendSeries: ChartSeries[] = [
  { id: "actual", label: "实际得分率", tone: "chart-1", data: [77, 72, 70, 77, 70, null].map((value, i) => ({ id: `c0-${i}`, label: ticks[i].join(" · "), tickLabel: ticks[i], value, ...(value === null ? {} : { valueLabel: String(value) }) })) },
  { id: "expected", label: "按难度推算的预期", tone: "neutral", lineStyle: "dashed", showPoints: false, data: [74, 67, 70, 75, 72, null].map((value, i) => ({ id: `c0-${i}`, label: ticks[i].join(" · "), value })) },
  { id: "new-context", label: "新情境", tone: "neutral", connect: false, data: [{ id: "c0-5", label: ticks[5].join(" · "), tickLabel: ticks[5], value: 75, valueLabel: "75", symbol: "diamond" }] },
]

export function BlueprintTrendDemo() {
  return <section id="trend-calibration" aria-label="C0 趋势图对照样例" className="space-y-3">
    <BpSectionCard letter="B" title="班级得分率与预期" action={<ChartLegend label="C0 趋势图图例" items={[
      { id: "actual", label: "实际得分率", marker: "area", tone: "chart-1" },
      { id: "expected", label: "按难度推算的预期", marker: "hatch", tone: "neutral" },
      { id: "new-context", label: "新情境", marker: "diamond", tone: "neutral" },
    ]} />}>
      <TrendChart label="C0 班级得分率与预期（合成数据）" series={blueprintTrendSeries} unit="%" yDomain={[65, 80]} xTickMode="all" height={230} legendPosition="none" />
    </BpSectionCard>
    <p className="text-ui-hint text-muted-foreground">C0 合成数据：实际 77、72、70、77、70；预期 74、67、70、75、72；W12 新情境 75，只画点不连线。窄屏或标注放不下时可在提示框和数据表查看完整数值。</p>
  </section>
}
