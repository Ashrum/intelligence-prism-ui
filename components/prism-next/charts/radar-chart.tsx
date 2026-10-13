"use client"

import { DataRecordTable } from "../data-display"
import { EChart } from "./echart"
import { useChartTheme } from "./chart-theme"
import { formatChartValue } from "@/lib/prism-next/chart-options"
import { chartToneColor, polarValueText, radarChartOption, radarModel, type RadarAxis, type RadarSeries } from "@/lib/prism-next/polar-chart-options"

export type { RadarAxis, RadarSeries } from "@/lib/prism-next/polar-chart-options"
export type RadarChartProps = { label: string; axes: readonly RadarAxis[]; series: readonly RadarSeries[]; height?: number }

export function RadarChart({ label, axes, series, height = 280 }: RadarChartProps) {
  const theme = useChartTheme(), model = radarModel(axes, series)
  const chartHeight = Number.isFinite(height) && height > 0 ? height : 280
  const message = !model.dimensionOK ? "雷达图需要 3–8 个轴，当前仅显示数据表。" : !series.length ? "暂无雷达数据。" : !model.countOK ? "雷达图支持 1–2 组数据，当前仅显示数据表。" : model.invalidAxes ? "轴上限必须是正的有限数值，当前仅显示数据表。" : !model.ready ? "暂无有效雷达数据，请核对数据表。" : `${label}；各轴从 0 起，上限见数据表。`
  const table = <div role="region" aria-label={`${label}：数据`}><DataRecordTable rows={axes.map((axis, index) => ({ ...axis, index }))} columns={[
    { id: "axis", label: "维度", render: row => <span className="whitespace-normal [overflow-wrap:anywhere]">{row.label}</span> },
    { id: "max", label: "上限", render: row => formatChartValue(model.maxima[row.index]) },
    ...series.map(item => ({ id: item.id, label: item.label, render: (row: { index: number }) => polarValueText(item.values[row.index]) })),
  ]} /></div>
  return <div className="min-w-0 space-y-3" data-radar-chart>
    <ul className="flex min-w-0 flex-wrap gap-x-5 gap-y-2 text-ui-body" aria-label={`${label}：图例`}>{series.map((item, index) => <li key={item.id} className="flex min-w-0 items-start gap-2">
      <span aria-hidden className={`mt-2 w-4 shrink-0 border-t-2 ${index === 0 ? "border-solid" : "border-dashed"}`} style={{ borderColor: chartToneColor(theme, index, item.tone) }} />
      <span className="min-w-0 [overflow-wrap:anywhere]">{item.label}</span>
    </li>)}</ul>
    {model.ready && <EChart label={label} height={chartHeight} option={radarChartOption(axes, series, theme)} />}
    <p className="text-ui-hint text-muted-foreground">{message}</p>
    {model.invalid > 0 && <p role="alert" className="text-ui-hint text-muted-foreground">{model.invalid} 组数据长度不匹配、数值无效或超出轴上限，未绘制；未补零或截断。</p>}
    {model.ready ? <details><summary className="cursor-pointer text-ui-hint text-muted-foreground">查看数据</summary>{table}</details> : table}
  </div>
}
