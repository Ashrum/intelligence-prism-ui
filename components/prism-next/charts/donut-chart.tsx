"use client"

import { Button } from "../button"
import { DataRecordTable } from "../data-display"
import { EChart } from "./echart"
import { useChartTheme } from "./chart-theme"
import { donutChartOption, donutModel, type DonutSegment } from "@/lib/prism-next/polar-chart-options"

export type { DonutSegment, ChartTone } from "@/lib/prism-next/polar-chart-options"
export type DonutChartProps = {
  label: string
  segments: readonly DonutSegment[]
  centerText?: string
  centerSubtext?: string
  legend?: "below" | "right"
  valueFormatter?: (value: number, segment: DonutSegment) => string
  onSelect?: (id: string) => void
  height?: number
}

export function DonutChart({ label, segments, centerText, centerSubtext, legend = "below", valueFormatter, onSelect, height = 180 }: DonutChartProps) {
  const theme = useChartTheme(), model = donutModel(segments, theme, valueFormatter)
  const chartHeight = Number.isFinite(height) && height > 0 ? height : 180
  const summary = model.tooMany ? "环形图最多显示 6 个非零分段，请先合并“其他”；完整数据见下表。" : model.ready ? `${label}；零值仅保留在图例与数据表中。` : "暂无可绘制的环形数据。"
  return <div className="@container min-w-0 space-y-3" data-donut-chart>
    <div className={legend === "right" ? "grid min-w-0 items-center gap-4 @min-[480px]:grid-cols-[minmax(0,1fr)_12rem]" : "grid min-w-0 gap-3"}>
      {model.ready && <div className="relative min-w-0">
        <EChart label={label} height={chartHeight} option={donutChartOption(model, theme)} onSelect={onSelect} />
        {(centerText !== undefined || centerSubtext !== undefined) && <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="grid min-w-0 gap-1 text-center text-foreground" style={{ width: `min(46%, ${chartHeight * .46}px)` }}>
            {centerText !== undefined && <span className="pointer-events-auto block truncate text-stat-display tabular-nums" title={centerText}>{centerText}</span>}
            {centerSubtext !== undefined && <span className="pointer-events-auto block truncate text-ui-hint" title={centerSubtext}>{centerSubtext}</span>}
          </div>
        </div>}
      </div>}
      <ul aria-label={`${label}：图例`} className="grid min-w-0 gap-2">
        {model.rows.map(row => {
          const content = <><span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full" style={{ background: row.color }} /><span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{row.label}</span><span className="min-w-0 tabular-nums [overflow-wrap:anywhere]">{row.text}</span></>
          return <li key={row.id} className="min-w-0">{onSelect
            ? <Button variant="ghost" className="h-auto w-full items-start justify-start whitespace-normal py-2 text-left" aria-label={`${row.label}：${row.text}`} onClick={() => onSelect(row.id)}>{content}</Button>
            : <div className="flex min-w-0 items-start gap-2 text-ui-body text-foreground">{content}</div>}</li>
        })}
      </ul>
    </div>
    {!model.ready && <p className="text-ui-hint text-muted-foreground">暂无可绘制的环形数据。</p>}
    <details><summary className="cursor-pointer text-ui-hint text-muted-foreground">查看数据</summary>    <p className="text-ui-hint text-muted-foreground">{summary}</p>
    {model.invalid > 0 && <p role="alert" className="text-ui-hint text-muted-foreground">{model.invalid} 项数值无效，未绘制；请核对数据表。</p>}
<div role="region" aria-label={`${label}：数据`}><DataRecordTable rows={model.rows} columns={[
      { id: "label", label: "项目", render: row => <span className="whitespace-normal [overflow-wrap:anywhere]">{row.label}</span> },
      { id: "value", label: "数值", render: row => row.text },
    ]} /></div></details>
  </div>
}
