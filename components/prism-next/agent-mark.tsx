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
const orbitOrder = [0, 1, 2, 5, 8, 7, 6, 3]
const patterns = {
  Orbit: { delays: Array.from({ length: 9 }, (_, i) => orbitOrder.includes(i) ? orbitOrder.indexOf(i) * 110 : null), duration: 950 },
  Drive: { delays: Array.from({ length: 9 }, (_, i) => (i % 3 + Math.abs(Math.floor(i / 3) - 1)) * 90), duration: 650 },
  Dots: { delays: Array.from({ length: 9 }, (_, i) => (i % 3 + Math.abs(Math.floor(i / 3) - 1)) * 90), duration: 650 },
}
export function AgentMark({ state = "unknown", variant = "Orbit", size = "inline", label, startedAt, endedAt }: {
  state?: AgentMarkState; variant?: keyof typeof patterns; size?: "inline" | "loading"; label?: string
  /** Epoch milliseconds from the host. A terminal snapshot needs endedAt. */
  startedAt?: number; endedAt?: number
}) {
  const active = state === "thinking" || state === "working"
  const [now, setNow] = useState<number>()
  useEffect(() => {
    if (!active || endedAt !== undefined || startedAt === undefined || !Number.isFinite(startedAt)) return
    setNow(Date.now())
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [active, startedAt, endedAt])
  const end = endedAt ?? (active ? now : undefined)
  const elapsed = startedAt !== undefined && end !== undefined && Number.isFinite(startedAt) && Number.isFinite(end)
    ? Math.max(0, Math.floor((end - startedAt) / 1000)) : undefined
  const text = label ?? agentMarkLabels[state]
  const { delays, duration } = patterns[variant]
  return <span data-agent-mark data-state={state} data-size={size} data-variant={variant} className={cn("inline-flex max-w-full items-center gap-2 text-ui-hint", state === "error" ? "text-destructive-foreground" : state === "waiting-for-user" ? "text-warning-foreground" : "text-foreground")}>
    <span aria-hidden="true" className="agent-mark-grid grid shrink-0 grid-cols-3 gap-0.5">
      {delays.map((delay, index) => <span key={index} className={cn("agent-mark-pixel bg-current", variant === "Dots" && "rounded-full")} style={{ opacity: active && delay === null ? .15 : 1, animation: active && delay !== null ? `prism-agent-pixel ${duration}ms ease-in-out ${delay}ms infinite` : undefined }} />)}
    </span>
    <span role="status" className={cn(size === "inline" && !label ? "sr-only" : "min-w-0 break-words", active && "agent-mark-shimmer")}>{text}</span>
    {elapsed !== undefined && <span className="text-ui-meta tabular-nums text-muted-foreground">已用时 {elapsed < 60 ? `${elapsed} 秒` : `${Math.floor(elapsed / 60)} 分 ${elapsed % 60} 秒`}</span>}
  </span>
}
