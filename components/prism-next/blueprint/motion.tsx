"use client"

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { BpToast } from "./blueprint"

export interface BpSkeletonProps {
  shape?: "line" | "block" | "stat" | "row"
  width?: CSSProperties["width"]
  height?: CSSProperties["height"]
  lines?: CSSProperties["width"][]
}

/** Static placeholders. The host names the region and owns aria-busy. */
export function BpSkeleton({ shape = "line", width, height, lines = ["60%", "45%", "35%"] }: BpSkeletonProps) {
  const slab = (w: CSSProperties["width"], h: CSSProperties["height"]) => <span className="block max-w-full bg-border/50" style={{ width: w, height: h }} />
  return <div aria-hidden="true" data-shape={shape} className="bp-skeleton min-w-0 max-w-full" style={{ width, height }}>
    {shape === "stat" ? <div className="grid gap-2.5 px-5 py-[18px]">
      <div className="flex h-[18px] items-center">{slab("48%", 12)}</div>
      <div className="flex h-8 items-center">{slab("60%", 22)}</div>
      {slab("100%", 6)}
    </div> : shape === "row" ? <div className="grid grid-cols-[repeat(3,minmax(0,1fr))] gap-4 py-4" style={{ gridTemplateColumns: `repeat(${Math.max(1, lines.length)}, minmax(0, 1fr))` }}>
      {lines.map((w, i) => <div key={i} className="min-w-0">{slab(w, height ?? 10)}</div>)}
    </div> : slab("100%", height ?? (shape === "block" ? 160 : 10))}
  </div>
}

export function useBpPending(loading: boolean, { delay = 400, minVisible = 300 }: { delay?: number; minVisible?: number } = {}) {
  const [visible, setVisible] = useState(false)
  const shownAt = useRef<number | null>(null)
  useEffect(() => {
    if (loading) {
      if (shownAt.current !== null) return
      const timer = setTimeout(() => { shownAt.current = Date.now(); setVisible(true) }, delay)
      return () => clearTimeout(timer)
    }
    if (shownAt.current === null) return
    const timer = setTimeout(() => { shownAt.current = null; setVisible(false) }, Math.max(0, minVisible - (Date.now() - shownAt.current)))
    return () => clearTimeout(timer)
  }, [loading, delay, minVisible])
  return visible
}

export function BpWorkLine() {
  return <div aria-hidden="true" className="bp-work-line relative h-0.5 overflow-hidden bg-border">
    <i className="absolute inset-y-0 left-0 w-[24%] animate-bp-work-line bg-(--brand-blue) motion-reduce:animate-none motion-reduce:left-[38%]" />
  </div>
}

export interface BpWorkingProps {
  tier: "short" | "mid" | "long"
  step: ReactNode
  done?: number
  total?: number
  unit?: string
  eta?: ReactNode
  leaveNote?: ReactNode
  actions?: ReactNode
  children?: ReactNode
}

export function BpWorking({ tier, step, done, total, unit = "份", eta, leaveNote = "可以离开这一页：进度在工作记录里，完成后顶栏通知你。", actions, children }: BpWorkingProps) {
  const progress = done !== undefined && total !== undefined && Number.isFinite(done) && Number.isFinite(total) && total > 0 && done >= 0 && done <= total
  return <div role="status" aria-live="polite" data-tier={tier} className={cn("bp-working min-w-0 space-y-3 text-ui-body [overflow-wrap:anywhere]", tier !== "short" && "border border-(--line) bg-card p-4")}>
    {children}
    {tier === "short" && <BpWorkLine />}
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <span>{step}</span>
      {progress && <span className={cn("font-mono tabular-nums", tier !== "short" && "text-stat-display")}>{done} / {total}{tier !== "short" && <span className="text-ui-body"> {unit}</span>}</span>}
    </div>
    {tier !== "short" && <>
      {progress && <div aria-hidden="true" className="bp-working-progress flex h-1.5 overflow-hidden">
        <span className="bg-(--brand-blue) transition-[width] duration-(--motion-base) ease-bp motion-reduce:transition-none" style={{ width: `${done / total * 100}%` }} />
        <span className="flex-1 bg-(image:--hatch-blue)" />
      </div>}
      <BpWorkLine />
      {(eta != null || actions != null) && <div className="flex flex-wrap items-center justify-between gap-3 text-ui-hint"><span>{eta}</span>{actions}</div>}
      {tier === "long" && <div className="text-ui-hint text-muted-foreground">{leaveNote}</div>}
    </>}
  </div>
}

export interface BpUndoToastProps {
  children: ReactNode
  action?: ReactNode
  duration?: number
  onExpire?: () => void
}

/** Expiry is an intent only; the host owns undo and any actual deletion. */
export function BpUndoToast({ children, action, duration = 6000, onExpire }: BpUndoToastProps) {
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [reduced, setReduced] = useState(false)
  const paused = hovered || focused
  const remaining = useRef(duration)
  const expired = useRef(false)
  const lifetime = useRef(duration)
  const callback = useRef(onExpire)
  callback.current = onExpire
  const bar = useRef<HTMLDivElement>(null)
  const expire = () => { if (!expired.current) { expired.current = true; callback.current?.() } }
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReduced(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])
  useEffect(() => {
    if (lifetime.current !== duration) {
      lifetime.current = duration
      remaining.current = duration
      expired.current = false
    }
    if (paused || expired.current) return
    const start = Date.now()
    // Track elapsed time in either mode, but only reduced motion uses a timeout.
    const timer = reduced ? setTimeout(expire, remaining.current) : undefined
    return () => { clearTimeout(timer); remaining.current = Math.max(0, remaining.current - (Date.now() - start)) }
  }, [paused, reduced, duration])
  useEffect(() => {
    if (!reduced) {
      const animation = bar.current?.getAnimations()[0]
      if (animation) animation.currentTime = Math.max(0, duration - remaining.current)
    }
  }, [reduced, duration])
  return <BpToast className="bp-undo-toast relative min-w-0 animate-in fade-in slide-in-from-bottom-2 duration-(--motion-base) ease-bp motion-reduce:slide-in-from-bottom-0 motion-reduce:[animation-duration:var(--motion-fast)]! motion-reduce:duration-(--motion-fast)!"
    onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false) }}>
    <div className="flex flex-wrap items-center justify-between gap-3 [overflow-wrap:anywhere]"><span className="min-w-0">{children}</span>{action}</div>
    <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 bg-current/20 motion-reduce:hidden">
      <div key={duration} ref={bar} className="h-full origin-left animate-bp-countdown bg-(--brand-green) motion-reduce:animate-none" style={{ animationDuration: `${duration}ms`, animationPlayState: paused ? "paused" : "running" }} onAnimationEnd={event => { if (event.target === event.currentTarget && event.animationName === "bp-countdown") expire() }} />
    </div>
  </BpToast>
}

export function BpCaret() {
  return <span aria-hidden="true" className="bp-caret inline-block h-4 w-0.5 animate-bp-caret bg-(--brand-blue) motion-reduce:animate-none" />
}
