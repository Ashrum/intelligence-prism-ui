"use client"

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { BpWorkLine } from "./motion"

export interface BpCollapseProps {
  open: boolean
  children: ReactNode
  id?: string
  className?: string
}

export function BpCollapse({ open, children, id, className }: BpCollapseProps) {
  return <div id={id} className={cn("bp-collapse grid min-w-0 transition-[grid-template-rows] ease-bp motion-reduce:transition-none", open ? "grid-rows-[1fr] duration-(--motion-slow)" : "grid-rows-[0fr] duration-(--motion-base)", className)}>
    <div className="min-h-0 overflow-hidden" inert={!open} aria-hidden={open ? undefined : true}>{children}</div>
  </div>
}

export function useBpAutoExpand(failed: boolean, resetKey?: unknown) {
  const [state, setState] = useState({ open: failed, manual: false, failed, resetKey })
  if (!Object.is(state.resetKey, resetKey)) {
    setState({ open: false, manual: false, failed, resetKey })
  } else if (state.failed !== failed) {
    setState({ ...state, failed, open: state.manual ? state.open : failed })
  }
  const toggle = () => setState(previous => ({ ...previous, open: !previous.open, manual: true }))
  return { open: state.open, toggle }
}

export function formatBpElapsed(ms: number) {
  if (!Number.isFinite(ms) || ms < 0) return ""
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds} s`
  return `${Math.floor(seconds / 60)} 分 ${String(seconds % 60).padStart(2, "0")} s`
}

export interface BpElapsedProps {
  startedAt: number
  endedAt?: number
  threshold?: number
}

export function BpElapsed({ startedAt, endedAt, threshold = 10000 }: BpElapsedProps) {
  // The first render is deterministic for hydration. Completed durations are host facts.
  const [now, setNow] = useState(startedAt)
  useEffect(() => {
    if (endedAt !== undefined) return
    setNow(Date.now())
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [startedAt, endedAt])
  const elapsed = (endedAt ?? now) - startedAt
  const text = formatBpElapsed(elapsed)
  if (!text || (endedAt === undefined && elapsed < threshold)) return null
  return <span aria-hidden="true" className="bp-elapsed font-mono tabular-nums text-muted-foreground animate-in fade-in duration-(--motion-base) motion-reduce:[animation-duration:var(--motion-fast)]!">{text}</span>
}

export interface BpStep {
  id: string
  label: ReactNode
  state: "done" | "running" | "pending" | "error"
  durationMs?: number
  detail?: ReactNode
  action?: ReactNode
}

export interface BpStepGroupProps {
  status: "preparing" | "answering" | "done" | "error" | "stopped"
  steps: BpStep[]
  startedAt: number
  endedAt?: number
  resetKey?: unknown
  onStop?: () => void
  stopLabel?: string
  summaryLabel?: ReactNode
  expandLabel?: string
  collapseLabel?: string
}

const stepClasses = {
  done: "text-success-foreground",
  running: "font-semibold",
  pending: "text-muted-foreground",
  error: "font-semibold text-destructive",
}
const stepMarks = { done: "✓ ", running: "", pending: "", error: "✕ " }

export function BpStepGroup({ status, steps, startedAt, endedAt, resetKey, onStop, stopLabel = "停止", summaryLabel, expandLabel = "展开", collapseLabel = "收起" }: BpStepGroupProps) {
  const { open, toggle } = useBpAutoExpand(status === "error", resetKey)
  const detailsId = useId()
  const running = steps.find(step => step.state === "running")
  const phase = running ? <>正在{running.label}</> : "正在处理"
  const elapsed = <BpElapsed startedAt={startedAt} endedAt={endedAt} />
  const total = endedAt === undefined ? "" : formatBpElapsed(endedAt - startedAt)
  const used = total ? <>用了 <span className="font-mono tabular-nums">{total}</span></> : "用时未知"
  const stop = onStop && <button type="button" className="shrink-0 text-ui-action underline" onClick={onStop}>{stopLabel}</button>
  const summaries = {
    preparing: phase,
    answering: <><span className="text-success-foreground">✓</span> 用了 {steps.filter(step => step.state === "done").length} 步 · {phase}</>,
    done: <><span className="text-success-foreground">✓</span> 用了 {steps.length} 步 · <span className="font-mono tabular-nums">{total || "用时未知"}</span></>,
    error: <>✕ {steps.filter(step => step.state === "error").length} 步失败 · {used}</>,
    stopped: <>已停止 · {used}</>,
  }
  return <div className="bp-step-group min-w-0 space-y-2 text-ui-body [overflow-wrap:anywhere]" data-status={status}>
    {status === "preparing" ? <>
      <div className="flex flex-wrap items-baseline gap-2.5"><span>{summaryLabel ?? phase}</span>{elapsed}<span className="flex-1" />{stop}</div>
      <div className="w-3/5"><BpWorkLine /></div>
      <ol className="flex list-none flex-wrap gap-x-4 gap-y-1 text-ui-hint">
        {steps.map(step => <li key={step.id} className={stepClasses[step.state]}>{stepMarks[step.state]}{step.label}</li>)}
      </ol>
    </> : <>
      <div className="flex flex-wrap items-baseline gap-2 text-ui-hint">
        <span className={status === "error" ? "font-semibold text-destructive" : "text-muted-foreground"}>{summaryLabel ?? summaries[status]}</span>
        {status === "answering" && <span className="inline-flex items-baseline gap-2 text-muted-foreground [&:has(.bp-elapsed)]:before:content-['·']">{elapsed}</span>}
        <button type="button" className="shrink-0 text-(--link) underline" aria-expanded={open} aria-controls={detailsId} onClick={toggle}>{open ? collapseLabel : expandLabel}</button>
        {status === "answering" && stop}
      </div>
      <BpCollapse id={detailsId} open={open}>
        <ol className="list-none border-t border-border text-ui-hint">
          {steps.map(step => <li key={step.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 border-b border-border py-1.5">
            <span className={stepClasses[step.state]}>{stepMarks[step.state]}{step.label}</span>
            <span className={cn("text-right font-mono tabular-nums", step.state === "error" ? "text-destructive" : "text-muted-foreground")}>{step.durationMs === undefined ? "" : formatBpElapsed(step.durationMs)}</span>
            {step.state === "error" && (step.detail != null || step.action != null) && <div className="col-span-2 flex flex-wrap items-baseline gap-2 pt-1.5 text-destructive">{step.detail}{step.action}</div>}
          </li>)}
        </ol>
      </BpCollapse>
    </>}
  </div>
}

const BpAnnouncerContext = createContext<(text: string) => void>(() => {})

export interface BpAnnouncerProviderProps { children: ReactNode }

export function BpAnnouncerProvider({ children }: BpAnnouncerProviderProps) {
  const [text, setText] = useState("")
  const frame = useRef<number | null>(null)
  const announce = useCallback((message: string) => {
    if (frame.current !== null) cancelAnimationFrame(frame.current)
    setText("")
    frame.current = requestAnimationFrame(() => { setText(message); frame.current = null })
  }, [])
  useEffect(() => () => { if (frame.current !== null) cancelAnimationFrame(frame.current) }, [])
  return <BpAnnouncerContext.Provider value={announce}>
    {children}
    <div role="status" aria-live="polite" aria-atomic="true" className="bp-announcer sr-only">{text}</div>
  </BpAnnouncerContext.Provider>
}

export function useBpAnnounce() { return useContext(BpAnnouncerContext) }
