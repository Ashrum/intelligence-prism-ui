"use client"

import { createContext, useContext, useEffect, useRef, type ComponentProps, type ReactNode } from "react"
import { useChartTheme } from "../charts/chart-theme"
import { cn } from "@/lib/utils"
import type { BpFill } from "./blueprint"
import { BpProvenance, type BpProvenanceProps } from "./work"

export interface BpStatusProps {
  tone: "error" | "attention" | "done" | "neutral"
  inactive?: boolean
  children: ReactNode
  className?: string
}

const statusToneClasses = {
  error: "text-destructive-foreground",
  attention: "text-warning-foreground",
  done: "text-success-foreground",
  neutral: "text-muted-foreground",
}

export function BpStatus({ tone, inactive = false, children, className }: BpStatusProps) {
  return <span data-bp-status={tone} data-inactive={inactive || undefined}
    className={cn("inline-flex items-center gap-[6px] [overflow-wrap:anywhere]", statusToneClasses[tone], className)}>
    <span aria-hidden="true" className={cn("size-[7px] shrink-0 rounded-full", inactive ? "border-[1.5px] border-solid border-current bg-transparent" : "bg-current")} />
    {children}
  </span>
}

export interface BpDimensionProps {
  orientation: "vertical" | "horizontal"
  at: number
  from: number
  to: number
  leaderFrom?: number
  tick?: number
  label: string
  refNo?: string
  tone: "up" | "down" | "neutral"
}

/** Coordinates use the host SVG viewBox. The host must repeat these values in its accessible name. */
export function BpDimension({ orientation, at, from, to, leaderFrom, tick = 12, label, refNo, tone }: BpDimensionProps) {
  const vertical = orientation === "vertical"
  const halfTick = Math.min(16, Math.max(6, tick)) / 2
  const point = (along: number, across: number) => vertical ? { x: across, y: along } : { x: along, y: across }
  const start = point(from, at)
  const end = point(to, at)
  const text = point((from + to) / 2, at + (vertical ? halfTick + 6 : 18))
  return <g className="bp-dim-root" data-tone={tone} aria-hidden="true">
    <line className="bp-dim-line" x1={start.x} y1={start.y} x2={end.x} y2={end.y} />
    {[from, to].map((value, index) => {
      const a = point(value, at - halfTick)
      const b = point(value, at + halfTick)
      const leader = point(value, leaderFrom ?? at)
      const leaderEnd = point(value, at + ((leaderFrom ?? at) < at ? -halfTick : halfTick))
      return <g key={index}>
        {leaderFrom !== undefined && <line className="bp-dim-line" strokeDasharray="2 2" x1={leader.x} y1={leader.y} x2={leaderEnd.x} y2={leaderEnd.y} />}
        <line className="bp-dim-line" x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
      </g>
    })}
    <text x={text.x} y={text.y} dominantBaseline="middle" textAnchor={vertical ? "start" : "middle"} className="bp-dim-label text-ui-meta">{label}{refNo && <tspan className="bp-dim-ref" dx="4">{refNo}</tspan>}</text>
  </g>
}

export interface BpUnitGridProps {
  /** Counts are whole, nonnegative people. Groups retain caller order. */
  groups: { id: string; label: string; count: number; fill: BpFill; muted?: boolean }[]
  label: string
  unit?: string
  legend?: boolean
  /** Ids shown as selected; only meaningful with onSelect. */
  selected?: readonly string[]
  /** When set, legend items become buttons and cells become click targets. */
  onSelect?: (groupId: string) => void
}

export function BpUnitGrid({ groups, label, unit = "人", legend = true, selected, onSelect }: BpUnitGridProps) {
  const { theme } = useChartTheme()
  const total = groups.reduce((sum, group) => sum + group.count, 0)
  const warned = useRef(false)
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && total > 60 && !warned.current) {
      warned.current = true
      console.warn("BpUnitGrid: 一格一人适用于 60 人以内，当前仍按全部人数渲染。")
    }
  }, [total])
  const warnedMissingLegend = useRef(false)
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && onSelect && !legend && !warnedMissingLegend.current) {
      warnedMissingLegend.current = true
      console.warn("BpUnitGrid：点选需要图例作为键盘入口")
    }
  }, [legend, onSelect])
  const summary = `${label}；${groups.map(group => `${group.label} ${group.count}${unit}`).join("；")}；总计 ${total}${unit}`
  return <div className="bp-unit-root" data-blueprint={theme === "blueprint" || undefined} role={onSelect ? "group" : "img"} aria-label={summary}>
    <div className="bp-unit-cells" aria-hidden="true">
      {groups.flatMap(group => Array.from({ length: group.count }, (_, index) => <span key={`${group.id}-${index}`} className={`bp-unit-cell bp-fill-${group.fill}`}
        data-muted={group.muted ? "" : undefined} data-pickable={onSelect ? "" : undefined} onClick={onSelect ? () => onSelect(group.id) : undefined} />))}
    </div>
    {legend && <ul className="bp-unit-legend text-ui-meta" aria-hidden={onSelect ? undefined : "true"}>
      {groups.map(group => {
        const content = <>
          <span className={`bp-unit-key bp-fill-${group.fill}`} data-muted={group.muted ? "" : undefined} />
          <span>{group.label}</span><b className="bp-unit-count">{group.count}</b>
        </>
        return <li key={group.id} data-tone={group.fill === "todo" || group.fill === "hatch-todo" ? "todo" : undefined}
          data-muted={group.muted ? "" : undefined} data-selected={onSelect && selected?.includes(group.id) ? "" : undefined}>
          {onSelect ? <button type="button" className="bp-unit-pick" aria-pressed={selected?.includes(group.id) ?? false} onClick={() => onSelect(group.id)}>{content}</button> : content}
        </li>
      })}
    </ul>}
  </div>
}

const DraftState = createContext<"draft" | "confirmed" | null>(null)
export interface BpDraftProps {
  state: "draft" | "confirmed"
  badge?: ReactNode
  meta?: ReactNode
  title: ReactNode
  children: ReactNode
  note?: ReactNode
  actions?: ReactNode
  provenance?: BpProvenanceProps["items"]
}

export function BpDraft({ state, badge, meta, title, children, note, actions, provenance }: BpDraftProps) {
  return <DraftState.Provider value={state}>
    <article className="bp-draft-root" data-state={state}>
      {state === "draft" && <span className="bp-draft-band" aria-hidden="true" />}
      <header className="bp-draft-header text-ui-meta">
        <span className="bp-draft-badge">{badge ?? (state === "draft" ? "AI 草稿 · 待你确认" : "已确认")}</span>
        {meta != null && <span className="bp-draft-meta">{meta}</span>}
      </header>
      <h3 className="bp-draft-title text-section-title">{title}</h3>
      <div className="bp-draft-body text-ui-body">{children}</div>
      {state === "confirmed" && provenance && <BpProvenance items={provenance} />}
      {note != null && <p className="bp-draft-note text-ui-meta">{note}</p>}
      {actions != null && <footer className="bp-draft-actions">{actions}</footer>}
    </article>
  </DraftState.Provider>
}

export function BpInferred({ className, ...props }: ComponentProps<"span">) {
  const state = useContext(DraftState)
  const { theme } = useChartTheme()
  return <span data-blueprint={state === "draft" && theme === "blueprint" || undefined} {...props} className={cn(state === "draft" && "bp-draft-inferred", className)} />
}
