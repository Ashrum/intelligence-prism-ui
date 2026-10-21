"use client"

import { cn } from "@/lib/utils"

export interface BpScanTraceProps {
  kind: "beam" | "line"
  active: boolean
  tone: "receive" | "ai"
  className?: string
}

/** Decorative trace inside a positioned, clipped host with its own readable status. */
export function BpScanTrace({ kind, active, tone, className }: BpScanTraceProps) {
  if (!active) return null
  return <span aria-hidden="true" data-slot="bp-scan-trace" data-kind={kind} data-tone={tone} data-active="true" className={cn("bp-scan-trace", className)} />
}

export type BpPaperSlotState = "waiting" | "received" | "grading" | "graded" | "review"
export interface BpPaperSlotProps {
  state: BpPaperSlotState
  name: string
  code: string
  detail: string
  /** One supplied arrival/completion event, never inferred from elapsed time. Reset before a new event. */
  fresh?: boolean
  /** Current answer emphasis; does not move keyboard focus or imply selection permission. */
  focused?: boolean
  href?: string
  onSelect?: () => void
  className?: string
}

/** External facts only. A link takes precedence over an action when both are supplied. */
export function BpPaperSlot({ state, name, code, detail, fresh = false, focused = false, href, onSelect, className }: BpPaperSlotProps) {
  const event = fresh ? state === "received" ? "arrival" : state === "graded" || state === "review" ? "completion" : undefined : undefined
  const props = {
    "data-slot": "bp-paper-slot",
    "data-state": state,
    "data-fresh": event,
    "data-focused": focused ? "true" : undefined,
    "aria-label": `${name} ${detail}`,
    className: cn("bp-paper-slot", className),
  }
  const body = <>
    <BpScanTrace kind="line" tone="ai" active={state === "grading"} />
    <span className="bp-paper-slot-head text-ui-meta font-mono"><span>{code}</span>{state === "graded" && <span className="bp-paper-slot-check" aria-hidden="true">✓</span>}</span>
    <span className="bp-paper-slot-body"><span className="text-item-title">{name}</span><span className="bp-paper-slot-detail text-ui-hint">{detail}</span></span>
  </>
  if (href) return <a {...props} href={href}>{body}</a>
  if (onSelect) return <button {...props} type="button" onClick={onSelect}>{body}</button>
  return <div {...props} role="group">{body}</div>
}
