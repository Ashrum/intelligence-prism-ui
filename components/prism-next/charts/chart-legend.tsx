"use client"

import { PopoverPopup } from "@/components/prism-next/scoped-overlays"

import type { ReactNode } from "react"
import { CircleHelp } from "lucide-react"
import { Button } from "@/components/coss/button"
import { Popover, PopoverTrigger } from "@/components/coss/popover"
import { chartToneColor, type ChartTone, type ChartTheme } from "@/lib/prism-next/polar-chart-options"
import { useChartTheme } from "./chart-theme"

export type ChartLegendMarker = "line" | "dashed-line" | "dot" | "hollow-dot" | "diamond" | "triangle" | "square" | "bar"
export type ChartLegendItem = { id: string; label: string; marker: ChartLegendMarker; color?: string; tone?: ChartTone; help?: ReactNode }
export type ChartLegendProps = { items: readonly ChartLegendItem[]; align?: "left" | "center" | "right"; label?: string; className?: string }

/** Shared by the public legend and chart geometry; explicit colours always win. */
export const chartLegendColor = (item: Pick<ChartLegendItem, "color" | "tone">, index: number, theme: ChartTheme) => item.color ?? chartToneColor(theme, index, item.tone)

export function ChartMarker({ marker, color, cx = 12, cy = 8, r = 6.5 }: { marker: ChartLegendMarker; color: string; cx?: number; cy?: number; r?: number }) {
  if (marker === "line" || marker === "dashed-line") return <line x1={cx - 11} x2={cx + 11} y1={cy} y2={cy} stroke={color} strokeWidth={2.5} strokeDasharray={marker === "dashed-line" ? "5 4" : undefined} />
  if (marker === "diamond") return <path d={`M${cx},${cy-r} L${cx+r},${cy} L${cx},${cy+r} L${cx-r},${cy} Z`} fill={color} stroke="var(--card)" strokeWidth={2} />
  if (marker === "triangle") return <path d={`M${cx},${cy-r} L${cx+r},${cy+r} L${cx-r},${cy+r} Z`} fill={color} stroke="var(--card)" strokeWidth={2} />
  if (marker === "square" || marker === "bar") return <rect x={cx-r} y={cy-(marker === "bar" ? 6 : r)} width={r*2} height={marker === "bar" ? 12 : r*2} fill={color} stroke="var(--card)" strokeWidth={2} />
  return <circle cx={cx} cy={cy} r={r} stroke={marker === "hollow-dot" ? color : "var(--card)"} strokeWidth={2} fill={marker === "hollow-dot" ? "var(--card)" : color} />
}

/** Extracted shared HTML legend, also usable in a host-owned card title row. */
export function ChartLegend({ items, align = "left", label = "图例", className = "" }: ChartLegendProps) {
  const theme = useChartTheme()
  if (!items.length) return null
  return <ul aria-label={label} data-chart-legend className={`flex min-w-0 max-w-full flex-wrap gap-x-5 gap-y-2 text-ui-hint ${align === "right" ? "justify-end" : align === "center" ? "justify-center" : "justify-start"} ${className}`}>
    {items.map((item, index) => <li key={item.id} data-legend-id={item.id} className="flex min-w-0 max-w-full items-start gap-2">
      <svg aria-hidden="true" focusable="false" width={24} height={16} viewBox="0 0 24 16" className="mt-0.5 shrink-0" data-legend-marker={item.marker}><ChartMarker marker={item.marker} color={chartLegendColor(item, index, theme)} /></svg>
      <span className="text-ui-hint text-foreground"><span className="whitespace-normal [overflow-wrap:anywhere]">{item.label}</span></span>
      {item.help != null && <Popover><PopoverTrigger render={<Button variant="ghost" size="icon-xs" className="text-muted-foreground hover:text-foreground" />} aria-label={`${item.label}：指标说明`}><CircleHelp size={14} className="size-3.5" aria-hidden="true" /></PopoverTrigger><PopoverPopup aria-label={`${item.label}：指标说明`} className="max-w-72"><div className="whitespace-normal break-words text-ui-body">{item.help}</div></PopoverPopup></Popover>}
    </li>)}
  </ul>
}
