"use client"

import { useId, type ComponentProps, type ReactNode } from "react"
import { cn } from "@/lib/utils"

export interface BpTargetLockProps {
  x: number
  y: number
  /** Full bracket width in host viewBox units. */
  size?: number
  active: boolean
  halo?: boolean
}

/** Decorative only. The host owns selection and provides equivalent readable content. */
export function BpTargetLock({ x, y, size = 32, active, halo = false }: BpTargetLockProps) {
  const half = size / 2
  const inner = size / 4
  return <g className="bp-target-lock" aria-hidden="true" transform={`translate(${x} ${y})`} data-active={active ? "" : undefined}>
    {active && <>
      {halo && <circle className="bp-target-lock-halo" r={size * 0.65} />}
      <g className="bp-target-lock-brackets"><path d={`M${-half},${-inner} V${-half} H${-inner} M${inner},${-half} H${half} V${-inner} M${half},${inner} V${half} H${inner} M${-inner},${half} H${-half} V${inner}`} /></g>
    </>}
  </g>
}

export interface BpDiagramCalloutProps {
  x: number
  y: number
  /** Positive width and height; host overlay and SVG must share the same bounds. */
  viewBox: [number, number]
  direction: "ne" | "nw" | "se" | "sw"
  code?: string
  label: string
  meta?: string
  active: boolean
}

/** Repeats existing page text; must never be the only source of information. */
export function BpDiagramCallout({ x, y, viewBox, direction, code, label, meta, active }: BpDiagramCalloutProps) {
  const left = x / viewBox[0] * 100
  const top = y / viewBox[1] * 100
  const west = direction.endsWith("w")
  const north = direction.startsWith("n")
  return <div className="bp-diagram-callout" aria-hidden="true" hidden={!active} data-direction={direction}
    style={{ left: `${left}%`, top: `${top}%`, width: `${west ? left : 100 - left}%` }}>
    <div className="bp-diagram-callout-branch">
      <svg className="bp-diagram-callout-leader" width="32" height="32" viewBox="0 0 32 32" aria-hidden="true"><polyline points={north ? "0,32 20,12 32,12" : "0,0 20,20 32,20"} /></svg>
      <div className="bp-diagram-callout-copy">
        <div className="bp-diagram-callout-label text-ui-hint">{code && <span className="bp-diagram-callout-code text-ui-meta">{code}</span>}<span>{label}</span></div>
        {meta && <p className="bp-diagram-callout-meta text-ui-meta">{meta}</p>}
      </div>
    </div>
  </div>
}

interface EntryContent {
  code?: string
  /** Decorative, non-interactive linear icon; rendered in a 20px slot. */
  icon?: ReactNode
  title: string
  description?: string
  actionLabel: string
  emphasis?: boolean
  onSelect?: () => void
}
type NativeOmissions = keyof EntryContent | "children" | "dangerouslySetInnerHTML" | "type"
export type BpEntryRowProps = EntryContent & (
  | (Omit<ComponentProps<"a">, NativeOmissions> & { href: string })
  | (Omit<ComponentProps<"button">, NativeOmissions> & { href?: undefined; target?: never })
)

/** One native target per row. Text props cannot introduce nested controls. */
export function BpEntryRow({ code, icon, title, description, actionLabel, emphasis = false, onSelect, className, ...props }: BpEntryRowProps) {
  const id = useId()
  const labelledBy = `${id}-title${description ? ` ${id}-description` : ""} ${id}-action`
  const content = <>
    <span className="bp-entry-row-code text-ui-meta" aria-hidden="true">{code}</span>
    <span className="bp-entry-row-icon" aria-hidden="true">{icon}</span>
    <span className="bp-entry-row-copy"><span id={`${id}-title`} className="bp-entry-row-title text-item-title">{title}</span>{description && <span id={`${id}-description`} className="bp-entry-row-description text-ui-hint">{description}</span>}</span>
    <span className="bp-entry-row-action text-ui-action"><span id={`${id}-action`}>{actionLabel}</span><span className="bp-entry-row-arrow" aria-hidden="true">→</span></span>
  </>
  const shared = { className: cn("bp-entry-row", className), "aria-labelledby": labelledBy, "data-emphasis": emphasis ? "" : undefined }
  if (props.href !== undefined) return <a {...props} {...shared} onClick={event => { props.onClick?.(event); if (!event.defaultPrevented) onSelect?.() }}>{content}</a>
  return <button {...props} {...shared} type="button" onClick={event => { props.onClick?.(event); if (!event.defaultPrevented) onSelect?.() }}>{content}</button>
}
