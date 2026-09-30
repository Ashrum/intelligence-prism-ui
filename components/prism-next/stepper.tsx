"use client"

import { useEffect, useRef } from "react"
import { Check, CircleAlert } from "lucide-react"
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/coss/progress"
import { Badge, type BadgeProps } from "./badge"
import { cn } from "@/lib/utils"
import "./stepper.css"

export type StepperState = "done" | "current" | "upcoming" | "pending" | "blocked" | "error"
export type StepperStep = { id: string; label: string; state: StepperState; description?: string }
export type StepperProps = {
  /** Complete ordered list, normally 3–8 steps; IDs must be unique. */
  steps: readonly StepperStep[]
  orientation?: "horizontal" | "vertical"
  "aria-label"?: string
  className?: string
}

const labels: Record<StepperState, string> = { done: "已完成", current: "当前阶段", upcoming: "后续阶段", pending: "待完成", blocked: "受阻", error: "受阻" }
const variants: Record<StepperState, BadgeProps["variant"]> = { done: "success", current: "info-solid", upcoming: "secondary", pending: "warning", blocked: "error", error: "error" }

/** Position is a supplied fact, never inferred from completion or list order. */
export function Stepper({ steps, orientation = "horizontal", "aria-label": label = "流程阶段", className }: StepperProps) {
  const viewport = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLOListElement>(null)
  const current = steps.findIndex(step => step.state === "current")
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
  }, [signature, orientation])

  return <nav aria-label={label} className={cn("prism-stepper min-w-0 max-w-full", className)} data-orientation={orientation}>
    <p className="mb-3 break-words text-ui-hint" data-step-summary>{current >= 0 ? `第 ${current + 1} / ${steps.length} 步 · ${steps[current].label}` : `共 ${steps.length} 步 · 未提供当前阶段`}</p>
    <div ref={viewport} className="prism-stepper-viewport" tabIndex={orientation === "horizontal" ? 0 : undefined} role={orientation === "horizontal" ? "region" : undefined} aria-label={orientation === "horizontal" ? `${label}完整步骤，可横向滚动` : undefined}>
      <ol ref={list} className="prism-stepper-list">
        {steps.map((step, index) => <li key={step.id} className="prism-stepper-item" data-step-state={step.state} aria-current={step.state === "current" ? "step" : undefined}>
          <div className="prism-stepper-content" data-step-content>
            <Badge variant={variants[step.state]} aria-hidden="true">{step.state === "done" && <Check />}{(step.state === "blocked" || step.state === "error") && <CircleAlert />}{index + 1}</Badge>
            <div className="min-w-0 space-y-1">
              <p className="break-words text-ui-body">{step.label}</p>
              <span className="sr-only">第 {index + 1} 步，{labels[step.state]}</span>
              <p aria-hidden="true" className="text-ui-hint">{labels[step.state]}</p>
              {step.description && step.description !== labels[step.state] && <p className="break-words text-ui-hint">{step.description}</p>}
            </div>
          </div>
          {index < steps.length - 1 && <div className="prism-stepper-connector" aria-hidden="true" data-complete={step.state === "done"}>
            <Progress value={step.state === "done" ? 100 : 0}>
              <ProgressTrack><ProgressIndicator className="transition-none" /></ProgressTrack>
            </Progress>
          </div>}
        </li>)}
      </ol>
    </div>
  </nav>
}
