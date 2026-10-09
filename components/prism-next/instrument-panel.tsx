"use client"

import { useId, type ReactNode } from "react"
import { Check } from "lucide-react"
import { Frame, FramePanel } from "@/components/coss/frame"
import { Meter, MeterLabel, MeterValue, MeterTrack, MeterIndicator } from "@/components/coss/meter"
import { Progress, ProgressTrack, ProgressIndicator } from "@/components/coss/progress"
import { Alert, AlertTitle, AlertDescription } from "@/components/coss/alert"
import { Empty } from "@/components/coss/empty"
import { Skeleton } from "@/components/coss/skeleton"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { MetricSummary } from "./data-display"
import { AgentStatus, type AgentStatusTone } from "./agent-visual-parts"

export type InstrumentStatus = { label: string; tone?: AgentStatusTone }
export type InstrumentAction = { label: string; disabled?: boolean }
export type InstrumentPrimaryAction = { label: string } & (
  | { disabled: true; disabledReason: string }
  | { disabled?: false; disabledReason?: never }
)
export type InstrumentItem = {
  id: string; title: string; description?: ReactNode; status?: InstrumentStatus
  /** Only the host can assert completion; status wording never implies a check. */
  completed?: boolean; selectable?: boolean
}
export type InstrumentSecondaryAction = InstrumentAction & { id: string }
export type InstrumentPanelProps = {
  compact?: boolean
  eyebrow?: string; title?: string; description?: ReactNode; headerAction?: InstrumentAction
  metric?: { value: string | number; label: string; status?: InstrumentStatus; linkLabel?: string; progress?: { value: number; max?: number; label: string; kind?: "progress" | "meter" } }
  current?: { label: string; title: string; description?: ReactNode }
  attention?: { label: string; title: string; description?: ReactNode; tone?: "info" | "warning" | "error" }
  list?: { title: string; items: readonly InstrumentItem[] }
  primaryAction?: InstrumentPrimaryAction
  secondaryActions?: readonly [] | readonly [InstrumentSecondaryAction] | readonly [InstrumentSecondaryAction, InstrumentSecondaryAction]
  actionNote?: ReactNode
  next?: { text: string; status?: InstrumentStatus }
  state?: "ready" | "loading" | "empty" | "error"; emptyMessage?: string; errorMessage?: string
  onPrimary?: () => void; onSecondary?: (id: string) => void; onHeaderAction?: () => void
  onMetricLink?: () => void; onItemSelect?: (id: string) => void; onRetry?: () => void
  "aria-label"?: string; className?: string
}

const actionClass = "max-w-full"

/** Present host facts and emit intent; there is no local execution or business state. */
export function InstrumentPanel(props: InstrumentPanelProps) {
  const { eyebrow, title, description, headerAction, metric, current, attention, list, primaryAction, secondaryActions = [], actionNote, next, state = "ready" } = props
  const id = useId()
  const ready = state === "ready"
  const primaryDisabled = !!primaryAction?.disabled || !props.onPrimary
  const reason = primaryAction && primaryDisabled ? primaryAction.disabledReason?.trim() || "操作暂不可用" : undefined
  const progress = metric?.progress
  const max = progress?.max ?? 100
  const knownProgress = progress && Number.isFinite(progress.value) && Number.isFinite(max) && max > 0 && progress.value >= 0 && progress.value <= max
  const hasHeader = eyebrow || title || description || (ready && headerAction)

  const currentPanel = current && <FramePanel role="region" className={cn("min-w-0 space-y-2", props.compact && "p-4")} aria-labelledby={`${id}-current`} data-instrument-current>
          <h3 id={`${id}-current`} className="text-ui-hint">{current.label}</h3>{(!props.compact || current.title) && <p className="text-item-title">{current.title}</p>}
          {current.description && <div className="text-ui-hint">{current.description}</div>}
        </FramePanel>

  return <aside data-instrument-panel data-state={state} data-compact={props.compact || undefined}
    aria-labelledby={title ? `${id}-title` : undefined} aria-label={title ? undefined : props["aria-label"] || "任务状态面板"}
    className={cn("min-w-0 w-full max-w-full self-start [overflow-wrap:anywhere]", props.className)}>
    <Frame>
    {hasHeader && <FramePanel className={cn("min-w-0", props.compact && "p-4")} data-instrument-header><header className="flex min-w-0 flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 flex-1 space-y-2">
        {eyebrow && <p className="text-ui-meta">{eyebrow}</p>}
        {title && <h2 id={`${id}-title`} className="text-block-title">{title}</h2>}
        {description && <div className="text-ui-hint">{description}</div>}
      </div>
      {ready && headerAction && <Button type="button" variant="ghost" className={actionClass} disabled={headerAction.disabled || !props.onHeaderAction} onClick={() => { if (!headerAction.disabled) props.onHeaderAction?.() }}><span className="truncate">{headerAction.label}</span></Button>}
    </header></FramePanel>}
    {!ready ? <FramePanel>{state === "loading" ? <div role="status" aria-busy="true" className="grid gap-3">
      <span className="text-ui-hint">正在加载任务状态…</span><Skeleton className="h-24 w-full motion-reduce:animate-none" /><Skeleton className="h-12 w-full motion-reduce:animate-none" />
    </div> : state === "error" ? <Empty className="px-0 py-6 md:py-6"><p role="alert" className="text-ui-body">{props.errorMessage || "任务状态加载失败"}</p>{props.onRetry && <Button type="button" className={actionClass} onClick={props.onRetry}>重试</Button>}</Empty>
      : <Empty className="px-0 py-6 md:py-6"><p className="text-ui-body">{props.emptyMessage || "暂无任务状态"}</p></Empty>}</FramePanel>
      : <>
        {metric && <FramePanel className={cn("@container grid min-w-0 gap-3 [&>dl]:grid-cols-1!", props.compact && "gap-1 p-4")} data-instrument-metric>
          <MetricSummary layout="strip" items={[{ id: "metric", label: metric.label, value: metric.value }]} />
          {metric.status && <AgentStatus tone={metric.status.tone}>{metric.status.label}</AgentStatus>}
          {metric.linkLabel && <Button type="button" variant="link" className={cn(actionClass, "self-start")} disabled={!props.onMetricLink} onClick={props.onMetricLink}><span className="truncate">{metric.linkLabel}</span></Button>}
          {knownProgress && (progress.kind === "meter" ? <Meter value={progress.value} max={max}>
            <div className="flex min-w-0 flex-wrap items-start justify-between gap-2"><MeterLabel className="min-w-0 text-ui-hint">{progress.label}</MeterLabel><MeterValue className="text-ui-hint">{(_formatted, value) => `${value} / ${max}`}</MeterValue></div>
            <MeterTrack><MeterIndicator className="motion-reduce:transition-none" /></MeterTrack>
          </Meter> : <Progress value={progress.value} max={max} aria-label={progress.label}><ProgressTrack><ProgressIndicator className="motion-reduce:transition-none" /></ProgressTrack></Progress>)}
        </FramePanel>}
        {!props.compact && currentPanel}
        {attention && <FramePanel className={props.compact ? "p-4" : undefined} data-instrument-attention><Alert variant={attention.tone || "warning"} role="note">
          <AlertTitle><AgentStatus tone={attention.tone || "warning"}>{attention.label}</AgentStatus></AlertTitle>
          <AlertDescription><p className="text-item-title">{attention.title}</p>{attention.description && <div className="text-ui-hint">{attention.description}</div>}</AlertDescription>
        </Alert></FramePanel>}
        {list && <FramePanel role="region" className={cn("min-w-0 space-y-3", props.compact && "p-4")} aria-labelledby={`${id}-list`} data-instrument-list>
          <h3 id={`${id}-list`} className="text-item-title">{list.title}</h3>
          <ol className="grid gap-4">{list.items.map((item, index) => <li key={item.id} className="flex min-w-0 items-start gap-3">
            <span className="flex min-h-6 min-w-6 shrink-0 items-center justify-center text-ui-hint" aria-hidden="true">{item.completed ? <Check className="size-4" /> : index + 1}</span>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                {item.selectable ? <Button type="button" variant="link" size={null} className="max-w-full justify-start whitespace-normal text-left" disabled={!props.onItemSelect} onClick={() => props.onItemSelect?.(item.id)}><span className="min-w-0 break-words">{item.title}</span></Button> : <p className="min-w-0 text-ui-body">{item.title}</p>}
                {item.status && <AgentStatus tone={item.status.tone}>{item.status.label}</AgentStatus>}
              </div>
              {item.completed && <span className="sr-only">已完成</span>}
              {item.description && <div className="text-ui-hint">{item.description}</div>}
            </div>
          </li>)}</ol>
        </FramePanel>}
        {props.compact && currentPanel}
        {(primaryAction || secondaryActions.length > 0 || actionNote) && <FramePanel className={cn("grid min-w-0 gap-3", props.compact && "p-4")} data-instrument-actions>
          {primaryAction && <Button type="button" data-instrument-primary className={actionClass} disabled={primaryDisabled} aria-describedby={reason || actionNote ? `${id}-action-note` : undefined} onClick={() => { if (!primaryDisabled) props.onPrimary?.() }}><span className="truncate">{primaryAction.label}</span></Button>}
          {(reason || actionNote) && <div id={`${id}-action-note`} className="space-y-1 text-ui-hint">{reason && <p>{reason}</p>}{actionNote && <div>{actionNote}</div>}</div>}
          {secondaryActions.slice(0, 2).map(action => <Button type="button" key={action.id} variant="outline" className={actionClass} disabled={action.disabled || !props.onSecondary} onClick={() => { if (!action.disabled) props.onSecondary?.(action.id) }}><span className="truncate">{action.label}</span></Button>)}
        </FramePanel>}
        {next && <FramePanel className={cn("flex min-w-0 flex-wrap items-start justify-between gap-3", props.compact && "p-4")} data-instrument-next>
          <div className="min-w-0 flex-1 space-y-1"><p className="text-ui-hint">下一步</p><p className="text-ui-body">{next.text}</p></div>
          {next.status && <AgentStatus tone={next.status.tone}>{next.status.label}</AgentStatus>}
        </FramePanel>}
      </>}
    </Frame>
  </aside>
}
