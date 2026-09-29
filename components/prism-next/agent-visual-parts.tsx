"use client"

import { useRef, type ComponentProps, type ReactNode } from "react"
import { Check, ChevronDown, Circle, CircleAlert, CircleHelp, Clock3, Info, LoaderCircle, Unplug, X, type LucideIcon } from "lucide-react"
import { Card } from "@/components/coss/card"
import { Button } from "@/components/coss/button"
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "@/components/coss/collapsible"
import { Popover, PopoverClose, PopoverPopup, PopoverTitle, PopoverTrigger } from "@/components/coss/popover"
import { cn } from "@/lib/utils"

/** Presentation metadata supplied explicitly by the host; never inferred from prose or clicks. */
export type AgentVisualProps = { visual?: { sample?: boolean; excerpt?: boolean; disconnected?: boolean; updatedAt?: string } }

/** Existing radius-xl is 14px (equally near 12px as radius-lg/10px). No new token. */
export function AgentSurface({ level = "normal", presentation = "card", className, ...props }: ComponentProps<"div"> & {
  level?: "normal" | "decision"; presentation?: "card" | "inline"
}) {
  if (presentation === "inline") return <div {...props} data-agent-surface={level} data-agent-presentation="inline" className={cn("@container flex min-w-0 flex-col gap-2.5 [overflow-wrap:anywhere]", className)} />
  return <Card {...props} data-agent-surface={level} className={cn(
    "@container min-w-0 gap-2.5 rounded-xl border-0 px-3.5 py-3 ring-1 ring-border before:hidden [overflow-wrap:anywhere]",
    level === "decision" ? "shadow-lg/5" : "shadow-xs/5",
    className,
  )} />
}

export function AgentWell({ presentation = "card", className, ...props }: ComponentProps<"div"> & { presentation?: "card" | "inline" }) {
  return <div {...props} data-agent-well="" className={cn("@container flex min-w-0 flex-col gap-2.5 rounded-xl bg-secondary p-3 [overflow-wrap:anywhere]",
    presentation === "inline" && "rounded-none bg-transparent p-0", className)} />
}

export type AgentStatusTone = "neutral" | "info" | "success" | "warning" | "error"
const statusTones = {
  neutral: "text-muted-foreground", info: "text-info-foreground",
  success: "text-success-foreground", warning: "text-warning-foreground",
  error: "text-destructive-foreground",
}
const statusIcons = { neutral: Circle, info: Info, success: Check, warning: CircleAlert, error: CircleAlert }

/** A compact status always includes a glyph; unknown overrides the tone and never animates. */
export function AgentStatus({ children, tone = "neutral", icon, unknown = false, running = false, className, ...props }: ComponentProps<"span"> & {
  tone?: AgentStatusTone; icon?: LucideIcon; unknown?: boolean; running?: boolean
}) {
  const Icon = unknown ? CircleHelp : icon ?? (running ? LoaderCircle : statusIcons[tone])
  return <span {...props} data-agent-status={unknown ? "unknown" : tone} className={cn(
    "inline-flex min-w-0 max-w-full items-center gap-1 self-start text-component-label",
    statusTones[unknown ? "neutral" : tone], className,
  )}><Icon aria-hidden="true" className={cn("size-3.5 shrink-0", running && !unknown && "motion-safe:animate-spin motion-reduce:animate-none")} />
    <span className="min-w-0 break-words">{children}{unknown && !(typeof children === "string" && children.includes("未知")) && " · 未知"}</span>
  </span>
}

export function AgentSampleTag() {
  return <span data-agent-sample="" className="inline-flex shrink-0 items-center self-start rounded-md bg-secondary px-1.5 py-0.5 text-component-label text-muted-foreground">示例</span>
}

export function AgentVisibleMarkers({ visual }: AgentVisualProps) {
  return visual?.sample || visual?.excerpt || visual?.disconnected ? <div className="flex min-w-0 flex-wrap items-center gap-1.5">
    {visual.sample && <AgentSampleTag />}
    {visual.excerpt && <AgentStatus icon={Info}>节选</AgentStatus>}
    {visual.disconnected && <AgentStatus icon={Unplug}>未连接</AgentStatus>}
  </div> : null
}

/** Short host facts share one wrapping line; labels and values stay in the DOM. */
export function AgentMetaLine({ className, ...props }: ComponentProps<"p">) {
  return <p {...props} data-agent-meta="" className={cn("min-w-0 break-words text-ui-meta text-muted-foreground", className)} />
}

export function AgentUpdatedAt({ value }: { value?: string }) {
  return <p className="break-words text-ui-meta text-muted-foreground">最近更新：{value || "未提供"}</p>
}

/** coss/Base UI owns Enter/Space, Escape dismissal and focus restoration. */
export function AgentSourceChip({ label = "来源与说明", children }: { label?: string; children?: ReactNode }) {
  const trigger = useRef<HTMLButtonElement>(null)
  if (children == null) return null
  return <Popover>
    <PopoverTrigger ref={trigger} data-agent-source="" render={<Button type="button" variant="ghost" size="sm" className="h-auto min-h-6 max-w-full gap-1.5 whitespace-normal rounded-md bg-secondary px-2 py-1 text-ui-action" />}>
      <Info aria-hidden="true" className="size-3.5 shrink-0" /><span className="min-w-0 break-words">{label}</span>
    </PopoverTrigger>
    <PopoverPopup align="start" finalFocus={trigger} className="w-80 max-w-[calc(100vw-2rem)] motion-reduce:transition-none">
      <div className="flex min-w-0 items-start justify-between gap-2">
        <PopoverTitle className="text-item-title">{label}</PopoverTitle>
        <PopoverClose render={<Button type="button" variant="ghost" size="icon-sm" aria-label="关闭来源说明" />}><X aria-hidden="true" /></PopoverClose>
      </div>
      <div className="mt-2.5 min-w-0 space-y-2 whitespace-pre-wrap break-words text-ui-hint">{children}</div>
    </PopoverPopup>
  </Popover>
}

/** Controlled hosts retain their disclosure semantics; an uncontrolled trace starts closed. */
export function AgentTraceRows({ children, expanded, onExpandedChange, alwaysExpanded = false }: {
  children: ReactNode; expanded?: boolean; onExpandedChange?: (expanded: boolean) => void; alwaysExpanded?: boolean
}) {
  if (alwaysExpanded) return <div data-agent-trace="">{children}</div>
  return <Collapsible data-agent-trace="" open={expanded} defaultOpen={false} onOpenChange={onExpandedChange}>
    {(expanded === undefined || onExpandedChange) && <CollapsibleTrigger render={<Button type="button" variant="ghost" size="sm" className="min-h-11 max-w-full whitespace-normal" />}>
      <ChevronDown aria-hidden="true" />{expanded ? "收起步骤" : "查看步骤"}
    </CollapsibleTrigger>}
    <CollapsiblePanel className="motion-reduce:transition-none">{children}</CollapsiblePanel>
  </Collapsible>
}

/** The capsule summary is 44px; required facts continue below it, without truncation. */
export function AgentCapsuleRow({ title, status, children }: { title: string; status: ReactNode; children?: ReactNode }) {
  return <div className="min-w-0 space-y-1.5">
    <div data-agent-capsule="" className="flex h-11 min-w-0 items-center gap-2 rounded-full bg-card px-3 text-card-foreground shadow-xs/5 ring-1 ring-border">
      <span className="min-w-0 flex-1 truncate text-item-title" title={title}>{title}</span>{status}
    </div>
    {children && <div className="min-w-0 space-y-1 px-3">{children}</div>}
  </div>
}

export { Clock3 as AgentWaitingIcon }
