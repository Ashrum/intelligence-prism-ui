"use client"

import { useEffect } from "react"
import { MeterTrack } from "@/components/coss/meter"
import { Button } from "@/components/prism-next/button"
import { segmentedBarLayout } from "@/lib/prism-next/segmented-bar"
import { cn } from "@/lib/utils"

export type SegmentedBarTone = "neutral" | "info" | "success" | "warning" | "destructive" | "chart-1" | "chart-2" | "chart-3" | "chart-4" | "chart-5"
export type SegmentedBarSegment = { id: string; label: string; value: number; tone?: SegmentedBarTone; description?: string }
export type SegmentedBarProps = {
  segments: readonly SegmentedBarSegment[]
  label: string
  total?: number
  unit?: string
  valueFormatter?: (value: number, segment: SegmentedBarSegment) => string
  legend?: "none" | "below"
  size?: "sm" | "default"
  onSelect?: (segment: SegmentedBarSegment) => void
}

const tones: Record<SegmentedBarTone, string> = {
  neutral: "bg-muted-foreground", info: "bg-info", success: "bg-success", warning: "bg-warning", destructive: "bg-destructive",
  "chart-1": "bg-chart-1", "chart-2": "bg-chart-2", "chart-3": "bg-chart-3", "chart-4": "bg-chart-4", "chart-5": "bg-chart-5",
}
const number = new Intl.NumberFormat("zh-CN", { maximumSignificantDigits: 15 })
const percent = (ratio: number, positive = ratio > 0) => positive && ratio < 0.001 ? "<0.1%" : `${Math.round(ratio * 1000) / 10}%`

export function SegmentedBar({ segments, label, total, unit = "", valueFormatter, legend = "below", size = "default", onSelect }: SegmentedBarProps) {
  const layout = segmentedBarLayout(segments.map(segment => segment.value), total)
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      if (layout.invalidValues) console.warn("SegmentedBar: negative or non-finite values are rendered as 0.")
      if (layout.invalidTotal) console.warn("SegmentedBar: total must be finite and at least the segment sum; using the sum.")
    }
  }, [layout.invalidValues, layout.invalidTotal])
  const rows = segments.map((segment, index) => {
    const value = layout.values[index]
    const formatted = valueFormatter ? valueFormatter(value, segment) : number.format(value)
    const text = `${formatted}${unit ? ` ${unit}` : ""}`
    const share = percent(layout.ratios[index], value > 0)
    return { segment, value, text, share, name: `${segment.label} ${text} ${share}`, tone: tones[segment.tone ?? "neutral"], width: layout.widths[index] }
  })
  const summary = [label, ...rows.map(row => row.name), ...(layout.empty ? ["无数据"] : []), ...(layout.remainderRatio > 0 ? [`余量 ${percent(layout.remainderRatio)}`] : [])].join("；")
  return <div className="grid min-w-0 gap-3" data-segmented-bar>
    {/* Interactive children must not be hidden by the presentational descendants of role=img. */}
    {onSelect && <div role="img" aria-label={summary} className="sr-only" />}
    <MeterTrack role={onSelect ? "group" : "img"} aria-label={onSelect ? `${label}：选择分段` : summary}
      className={cn("flex min-w-0", size === "sm" && "h-1.5")}>
      {rows.filter(row => row.value > 0).map((row, index, visible) => {
        const separator = index < visible.length - 1 ? <span aria-hidden className="pointer-events-none absolute inset-y-0 end-0 w-px max-w-[20%] bg-background" /> : null
        const className = cn("relative block h-full min-w-0 shrink-0", row.tone, onSelect && "cursor-pointer outline-offset-[-2px] focus-visible:outline-2 focus-visible:outline-foreground")
        const style = { width: `${row.width * 100}%` }
        return onSelect
          ? <button key={row.segment.id} type="button" className={className} style={style} aria-label={`${row.name}${row.segment.description ? `；${row.segment.description}` : ""}`} onClick={() => onSelect(row.segment)}>{separator}</button>
          : <span key={row.segment.id} aria-hidden className={className} style={style}>{separator}</span>
      })}
    </MeterTrack>
    {legend === "below" && <ul aria-label={`${label}：图例`} className="grid min-w-0 gap-2">
      {rows.map(row => {
        const content = <><span aria-hidden className={cn("mt-1.5 size-2 shrink-0 rounded-full", row.tone)} /><span className="grid min-w-0 gap-1"><span className="flex flex-wrap gap-x-2"><span className="min-w-0 [overflow-wrap:anywhere]">{row.segment.label}</span><span className="min-w-0 tabular-nums [overflow-wrap:anywhere]">{row.text} · {row.share}</span></span>{row.segment.description && <span className="text-ui-hint text-muted-foreground [overflow-wrap:anywhere]">{row.segment.description}</span>}</span></>
        return <li key={row.segment.id} className="min-w-0">{onSelect
          ? <Button variant="ghost" className="h-auto w-full items-start justify-start whitespace-normal py-2 text-left" onClick={() => onSelect(row.segment)}>{content}</Button>
          : <div className="text-ui-body flex min-w-0 items-start gap-2">{content}</div>}</li>
      })}
    </ul>}
  </div>
}
