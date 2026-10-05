"use client"

import { useEffect, useRef } from "react"
import { Check, CircleAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import "./stepper.css"

export type StepperState = "done" | "current" | "upcoming" | "pending" | "blocked" | "error"
export type StepperStep = { id: string; label: string; state: StepperState; description?: string; selectable?: boolean; selectLabel?: string }
export type StepperProps = {
  /** Complete ordered list, normally 3–8 steps; IDs must be unique. */
  steps: readonly StepperStep[]
  /** Overrides legacy state=current for summary, aria-current and reveal; unknown IDs stay unknown. */
  currentStepId?: string
  onStepSelect?: (id: string) => void
  compact?: boolean
  orientation?: "horizontal" | "vertical"
  "aria-label"?: string
  className?: string
}

const labels: Record<StepperState, string> = { done: "已完成", current: "当前阶段", upcoming: "后续阶段", pending: "待完成", blocked: "受阻", error: "受阻" }
// Native decorative marks use existing theme tokens; pinned Badge geometry is untouched.
function markerSurface(state: StepperState, current: boolean) {
  if (state === "blocked" || state === "error") return "border-destructive-foreground bg-destructive/8 text-destructive-foreground"
  if (state === "pending") return "border-warning-foreground text-warning-foreground"
  if (state === "done" || current) return "border-transparent bg-info-foreground text-background"
  return "border-muted-foreground text-muted-foreground"
}

/** Position is a supplied fact, never inferred from completion or list order. */
export function Stepper({ steps, currentStepId, onStepSelect, orientation = "horizontal", compact = false, "aria-label": label = "流程阶段", className }: StepperProps) {
  const isCompact = compact && orientation === "horizontal"
  const viewport = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLOListElement>(null)
  const current = steps.findIndex(step => currentStepId !== undefined ? step.id === currentStepId : step.state === "current")
  // Labels can change width without changing identity; observe both viewport and list.
  const signature = JSON.stringify(steps.map(step => [step.id, step.label, step.state, step.description]))
  useEffect(() => {
    const container = viewport.current, content = list.current
    if (!container || !content || orientation !== "horizontal") return
    if (isCompact) {
      // Measure the expanded content, including long/localized labels. Resize never
      // changes position, eligibility or focus, and compact never scrolls.
      const fit = () => {
        delete container.dataset.collapsed
        container.dataset.collapsed = String(content.scrollWidth > content.clientWidth)
      }
      fit()
      if (typeof ResizeObserver === "undefined") return
      const observer = new ResizeObserver(fit)
      observer.observe(container)
      observer.observe(content)
      return () => observer.disconnect()
    }
    const reveal = () => {
      const active = content.querySelector<HTMLElement>('[aria-current="step"] [data-step-content]')
      if (!active) return
      const bounds = container.getBoundingClientRect(), target = active.getBoundingClientRect()
      const delta = target.left < bounds.left ? target.left - bounds.left : target.right > bounds.right ? target.right - bounds.right : 0
      // Scroll only this region, never the page or keyboard focus. No smooth motion.
      if (delta) container.scrollTo({ left: container.scrollLeft + delta, behavior: "instant" })
    }
    reveal()
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(reveal)
    observer.observe(container)
    observer.observe(content)
    return () => observer.disconnect()
  }, [signature, orientation, current, isCompact])

  return <nav aria-label={label} className={cn("prism-stepper min-w-0 max-w-full", className)} data-orientation={orientation} data-compact={isCompact || undefined}>
    <p className={isCompact ? "sr-only" : "mb-3 break-words text-ui-hint"} data-step-summary>{current >= 0 ? `第 ${current + 1} / ${steps.length} 步 · ${steps[current].label}` : `共 ${steps.length} 步 · 未提供当前阶段`}</p>
    <div ref={viewport} className="prism-stepper-viewport" tabIndex={orientation === "horizontal" && !isCompact ? 0 : undefined} role={orientation === "horizontal" && !isCompact ? "region" : undefined} aria-label={orientation === "horizontal" && !isCompact ? `${label}完整步骤，可横向滚动` : undefined}>
      <ol ref={list} className="prism-stepper-list">
        {steps.map((step, index) => {
          const isCurrent = index === current
          const blocked = step.state === "blocked" || step.state === "error"
          const special = blocked || step.state === "pending"
          const stateLabel = labels[step.state === "current" ? "upcoming" : step.state]
          const status = isCurrent ? `当前阶段${step.state === "current" || step.state === "upcoming" ? "" : ` · ${stateLabel}`}` : stateLabel
          const selectable = !!onStepSelect && step.selectable === true && !isCurrent
          const Content = selectable ? "button" : "div"
          const Details = selectable || isCompact ? "span" : "div"
          const Text = selectable || isCompact ? "span" : "p"
          const compactDescription = `第 ${index + 1} 步，${status}${step.description ? `。${step.description}` : ""}`
          return <li key={step.id} className="prism-stepper-item" data-step-state={step.state} aria-current={isCurrent ? "step" : undefined} aria-label={isCompact && !selectable ? `${step.label} · ${compactDescription}` : undefined}>
            <Content className={cn("prism-stepper-content", selectable && (isCompact
              ? "relative cursor-pointer justify-center text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11"
              : "min-h-11 min-w-11 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"))}
              data-step-content type={selectable ? "button" : undefined}
              aria-label={selectable ? step.selectLabel?.trim() || `前往：${step.label}` : undefined}
              aria-description={isCompact && selectable ? compactDescription : undefined}
              title={isCompact ? `${step.label} · ${compactDescription}` : undefined}
              onClick={selectable ? () => onStepSelect?.(step.id) : undefined}>
              <span data-step-marker aria-hidden="true" className={cn(isCompact ? "flex size-6 shrink-0 items-center justify-center rounded-full border text-ui-action" : "flex size-8 shrink-0 items-center justify-center rounded-full border text-ui-action", markerSurface(step.state, isCurrent))}>
                {step.state === "done" ? <Check className="size-4" /> : blocked ? <CircleAlert className="size-4" /> : index + 1}
              </span>
              <Details className={isCompact ? "prism-stepper-details min-w-0" : "min-w-0 space-y-1"}>
                <Text className={cn(isCompact ? "prism-stepper-label block truncate" : "break-words", selectable && "block", isCurrent ? "text-item-title" : "text-ui-body", isCompact && !isCurrent && !special && step.state !== "done" && "text-muted-foreground")}>{step.label}</Text>
                <span className="sr-only">第 {index + 1} 步，{status}</span>
                {special && <Text aria-hidden="true" className={cn("text-ui-hint", (selectable || isCompact) && "block")}>{status}</Text>}
                {step.description && step.description !== stateLabel && <>
                  <Text aria-hidden="true" title={step.description} className={isCompact ? "sr-only" : "line-clamp-2 break-words text-ui-hint"}>{step.description}</Text>
                  <span className="sr-only">{step.description}</span>
                </>}
              </Details>
            </Content>
            {index < steps.length - 1 && <div className={cn("prism-stepper-connector", step.state === "done" ? "bg-info-foreground" : "bg-border")} aria-hidden="true" data-complete={step.state === "done"} />}
          </li>
        })}
      </ol>
    </div>
  </nav>
}
