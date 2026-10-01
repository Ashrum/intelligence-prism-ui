"use client"

import { useEffect, useRef } from "react"
import { Check, CircleAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import "./stepper.css"

export type StepperState = "done" | "current" | "upcoming" | "pending" | "blocked" | "error"
export type StepperStep = { id: string; label: string; state: StepperState; description?: string }
export type StepperProps = {
  /** Complete ordered list, normally 3–8 steps; IDs must be unique. */
  steps: readonly StepperStep[]
  /** Overrides legacy state=current for summary, aria-current and reveal; unknown IDs stay unknown. */
  currentStepId?: string
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
export function Stepper({ steps, currentStepId, orientation = "horizontal", compact = false, "aria-label": label = "流程阶段", className }: StepperProps) {
  const isCompact = compact && orientation === "horizontal"
  const viewport = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLOListElement>(null)
  const current = steps.findIndex(step => currentStepId !== undefined ? step.id === currentStepId : step.state === "current")
  // Labels can change width without changing identity; observe both viewport and list.
  const signature = JSON.stringify(steps.map(step => [step.id, step.label, step.state, step.description]))
  useEffect(() => {
    const container = viewport.current, content = list.current
    if (!container || !content || orientation !== "horizontal") return
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
    <div ref={viewport} className="prism-stepper-viewport" tabIndex={orientation === "horizontal" ? 0 : undefined} role={orientation === "horizontal" ? "region" : undefined} aria-label={orientation === "horizontal" ? `${label}完整步骤，可横向滚动` : undefined}>
      <ol ref={list} className="prism-stepper-list">
        {steps.map((step, index) => {
          const isCurrent = index === current
          const blocked = step.state === "blocked" || step.state === "error"
          const special = blocked || step.state === "pending"
          const stateLabel = labels[step.state === "current" ? "upcoming" : step.state]
          const status = isCurrent ? `当前阶段${step.state === "current" || step.state === "upcoming" ? "" : ` · ${stateLabel}`}` : stateLabel
          return <li key={step.id} className="prism-stepper-item" data-step-state={step.state} aria-current={isCurrent ? "step" : undefined}>
            <div className="prism-stepper-content" data-step-content>
              <span data-step-marker aria-hidden="true" className={cn("flex size-8 shrink-0 items-center justify-center rounded-full border text-ui-action", markerSurface(step.state, isCurrent))}>
                {step.state === "done" ? <Check className="size-4" /> : blocked ? <CircleAlert className="size-4" /> : index + 1}
              </span>
              <div className="min-w-0 space-y-1">
                <p className={cn("break-words", isCurrent ? "text-item-title" : "text-ui-body")}>{step.label}</p>
                <span className="sr-only">第 {index + 1} 步，{status}</span>
                {special && <p aria-hidden="true" className="text-ui-hint">{status}</p>}
                {step.description && step.description !== stateLabel && <>
                  <p aria-hidden="true" title={step.description} className="line-clamp-2 break-words text-ui-hint">{step.description}</p>
                  <span className="sr-only">{step.description}</span>
                </>}
              </div>
            </div>
            {index < steps.length - 1 && <div className={cn("prism-stepper-connector", step.state === "done" ? "bg-info-foreground" : "bg-border")} aria-hidden="true" data-complete={step.state === "done"} />}
          </li>
        })}
      </ol>
    </div>
  </nav>
}
