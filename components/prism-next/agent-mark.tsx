"use client"
/** Adapted from Beautiful UI Loading State (2026-09-29 snapshot).
 * Copyright (c) 2026 Shane Levine. MIT License; full permission and warranty
 * notice is retained in docs/third-party/beautifului-LICENSE.txt.
 */
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import "./agent-conversation.css"

export type AgentMarkState = "idle" | "thinking" | "working" | "waiting-for-user" | "error" | "unknown"
export const agentMarkLabels: Record<AgentMarkState, string> = { idle: "就绪", thinking: "正在思考", working: "正在处理", "waiting-for-user": "等待你确认", error: "发生错误", unknown: "状态未知" }
const pixels = Array.from({ length: 9 }, (_, index) => index)
export function AgentMark({ state = "unknown", variant = "Drive", size = "inline", label, startedAt, endedAt }: {
  state?: AgentMarkState; variant?: "Orbit" | "Drive" | "Dots"; size?: "inline" | "loading" | "glyph"; label?: string
  /** Epoch milliseconds from the host. A terminal snapshot needs endedAt. */
  startedAt?: number; endedAt?: number
}) {
  const active = state === "thinking" || state === "working"
  const [now, setNow] = useState<number>()
  useEffect(() => {
    if (size === "glyph" || !active || endedAt !== undefined || startedAt === undefined || !Number.isFinite(startedAt)) return
    setNow(Date.now())
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [size, active, startedAt, endedAt])
  const end = endedAt ?? (active ? now : undefined)
  const elapsed = startedAt !== undefined && end !== undefined && Number.isFinite(startedAt) && Number.isFinite(end)
    ? Math.max(0, Math.floor((end - startedAt) / 1000)) : undefined
  const text = label ?? agentMarkLabels[state]
  if (size === "glyph") return <span data-agent-mark data-state={state} data-size={size} data-variant={variant} role="img" aria-label={text} className={cn("inline-flex shrink-0 items-center justify-center", state === "error" ? "text-destructive-foreground" : state === "waiting-for-user" ? "text-warning-foreground" : "text-foreground")}>
    <span aria-hidden="true" className="agent-mark-grid grid shrink-0 grid-cols-3 gap-0.5">
      {pixels.map(index => <span key={index} className={cn("agent-mark-pixel bg-current", variant === "Dots" && "rounded-full")} style={{ opacity: 1 }} />)}
    </span>
  </span>
  return <span data-agent-mark data-state={state} data-size={size} data-variant={variant} className={cn("inline-flex max-w-full items-center gap-2 text-ui-hint", state === "error" ? "text-destructive-foreground" : state === "waiting-for-user" ? "text-warning-foreground" : "text-foreground")}>
    <span aria-hidden="true" className="agent-mark-grid grid shrink-0 grid-cols-3 gap-0.5">
      {pixels.map(index => <span key={index} className={cn("agent-mark-pixel bg-current", variant === "Dots" && "rounded-full")} style={{ opacity: 1 }} />)}
    </span>
    <span role="status" className={cn(size === "inline" && !label ? "sr-only" : "min-w-0 break-words")}>{text}</span>
    {elapsed !== undefined && <span className="text-ui-meta tabular-nums text-muted-foreground">已用时 {elapsed < 60 ? `${elapsed} 秒` : `${Math.floor(elapsed / 60)} 分 ${elapsed % 60} 秒`}</span>}
  </span>
}
