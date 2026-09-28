"use client"

import { useId, useRef, type ReactNode } from "react"
import { ArrowUpRight, Check, Circle, CircleAlert, FileText, History } from "lucide-react"
import { Alert, AlertDescription } from "@/components/coss/alert"
import { Button } from "@/components/coss/button"
import { AgentTaskProgress, type AgentStep } from "./agent-components"
import { agentProgressLabels, type AgentProgressState } from "@/lib/prism-next/agent-progress"
import { RecordExpand, type AgentRecordViewProps } from "./agent-record-parts"
import { AgentMetaLine, AgentSourceChip, AgentStatus, AgentSurface, AgentTraceRows, AgentUpdatedAt, AgentVisibleMarkers, AgentWell, type AgentVisualProps } from "./agent-visual-parts"
export type { AgentProgressState } from "@/lib/prism-next/agent-progress"

/** An available host capability. A callback expresses intent; it is never a receipt. */
export type AgentSemanticAction = { label: string; onAction: () => void; disabledReason?: string }
type Fact = { label: string; value: string }
type Presentation = "card" | "inline"

function Facts({ items, emphasis = false }: { items: readonly Fact[]; emphasis?: boolean }) {
  return <dl className={emphasis ? "grid min-w-0 grid-cols-1 gap-y-2.5 @min-[320px]:grid-cols-3" : "min-w-0 break-words text-ui-meta text-muted-foreground"}>{items.map((item, index) => <div key={item.label} className={emphasis ? "min-w-0 @min-[320px]:not-first:border-l @min-[320px]:not-first:border-border @min-[320px]:not-first:pl-3" : "inline"}><dt className={emphasis ? "text-ui-meta text-muted-foreground" : "inline"}>{!emphasis && index > 0 && <span aria-hidden="true"> · </span>}{item.label}{!emphasis && "："}</dt><dd className={emphasis ? "break-words text-stat-display tabular-nums" : "inline"}>{item.value}</dd></div>)}</dl>
}

function Action({ action, secondary = false, icon }: { action: AgentSemanticAction; secondary?: boolean; icon?: ReactNode }) {
  const id = useId()
  return <div className="min-w-0 space-y-1.5 @max-[390px]:w-full"><Button variant={secondary ? "outline" : "default"} disabled={!!action.disabledReason} aria-describedby={action.disabledReason ? id : undefined} onClick={action.onAction} className="max-w-full whitespace-normal @max-[390px]:w-full">{action.label}{icon}</Button>{action.disabledReason && <p id={id} className="text-ui-hint text-muted-foreground">{action.disabledReason}</p>}</div>
}

/** A preview describes an object, independently of execution and publication. */
export function AgentArtifactPreview({ title, version, status, summary, facts = [], children, open, notice, snapshot, presentation = "card", visual, source }: AgentVisualProps & {
  title: string; version: string; status: string; summary: string; facts?: readonly Fact[]; children?: ReactNode;
  open?: AgentSemanticAction; notice?: string; snapshot?: string; presentation?: Presentation;
  source?: { label: string; description: ReactNode };
}) {
  const id = useId()
  return <AgentSurface aria-labelledby={id} presentation={presentation}>
    <div className="flex min-w-0 flex-wrap items-start gap-2.5"><FileText aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" /><div className="min-w-0 flex-1 space-y-1"><h3 id={id} className="break-words text-item-title">{title}</h3><p className="text-ui-meta text-muted-foreground">{snapshot ? `历史成果 · ${snapshot}` : "成果预览"} · {version}</p></div><AgentStatus unknown={/未知|未确认/.test(status)} icon={snapshot ? History : undefined}>{status}</AgentStatus></div>
    <AgentVisibleMarkers visual={visual} />
    {/未知|未确认/.test(status) && <AgentUpdatedAt value={visual?.updatedAt} />}
    <p className="whitespace-pre-wrap break-words text-ui-meta text-muted-foreground">{summary}</p>
    {!!facts.length && <Facts items={facts} />}
    {children && <AgentWell>{children}</AgentWell>}
    {notice && <p className="text-ui-hint text-muted-foreground">{notice}</p>}
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
      {source && <AgentSourceChip label={source.label}>{source.description}</AgentSourceChip>}
      {open && <Action action={open} secondary icon={<ArrowUpRight aria-hidden="true" />} />}
    </div>
  </AgentSurface>
}

export type AgentConfirmationState =
  | { state: "ready"; confirm: AgentSemanticAction }
  | { state: "submitting" | "received" | "recorded"; description: string }
  | { state: "blocked"; description: string; review?: AgentSemanticAction }
  | { state: "unknown"; description: string; query?: AgentSemanticAction }

/** Host owns all conditions and authorization. No implicit acknowledgement or local gate. */
export function AgentExecutionConfirmation({ title, target, version, effects, confirmation, conditions, presentation = "card", visual }: AgentVisualProps & {
  title: string; target: string; version: string; effects: readonly string[];
  confirmation: AgentConfirmationState; conditions?: ReactNode; presentation?: Presentation;
}) {
  const id = useId(), heading = useRef<HTMLHeadingElement>(null)
  const labels = { ready: "待确认", submitting: "正在提交", received: "请求已接收", recorded: "确认记录", blocked: "暂不可确认", unknown: "回执未确认" }
  const blocked = confirmation.state === "blocked" || confirmation.state === "unknown"
  return <AgentSurface level={confirmation.state === "ready" || confirmation.state === "blocked" ? "decision" : "normal"} aria-labelledby={id} presentation={presentation}>
    <div className="flex flex-wrap items-start justify-between gap-2.5"><h3 ref={heading} tabIndex={-1} id={id} className="min-w-0 break-words text-item-title outline-none">{title}</h3><AgentStatus unknown={confirmation.state === "unknown"} tone={blocked ? "warning" : "neutral"}>{labels[confirmation.state]}</AgentStatus></div>
    <AgentVisibleMarkers visual={visual} />
    {confirmation.state === "ready" && <AgentStatus>未提交</AgentStatus>}
    {confirmation.state === "unknown" && <AgentUpdatedAt value={visual?.updatedAt} />}
    <Facts items={[{ label: "操作对象", value: target }, { label: "依据版本", value: version }]} />
    <div className="space-y-1.5"><p className="text-ui-action">{confirmation.state === "ready" || confirmation.state === "blocked" ? "确认后的影响" : "本次确认范围"}</p><ul className="space-y-1.5 text-ui-body">{effects.map(effect => <li key={effect} className="flex min-w-0 items-start gap-2 break-words">
      {effect.trim().startsWith("不会") ? <Circle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" /> : <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success-foreground" />}
      <span>{!effect.trim().startsWith("不会") && <span className="mr-1 text-ui-meta text-muted-foreground">将会</span>}{effect}</span>
    </li>)}</ul></div>
    {conditions && <div className="min-w-0" data-execution-conditions="">{conditions}</div>}
    {confirmation.state !== "ready" && (confirmation.state === "blocked" ? <Alert variant="warning" role="status"><CircleAlert aria-hidden="true" /><AlertDescription>{confirmation.description}</AlertDescription></Alert> : <p role="status" className="text-ui-hint text-muted-foreground">{confirmation.description}</p>)}
    {confirmation.state === "ready" && <Action action={{ ...confirmation.confirm, onAction: () => { confirmation.confirm.onAction(); requestAnimationFrame(() => heading.current?.focus({ preventScroll: true })) } }} />}
    {confirmation.state === "blocked" && confirmation.review && <Action action={confirmation.review} secondary />}
    {confirmation.state === "unknown" && confirmation.query && <Action action={confirmation.query} secondary />}
  </AgentSurface>
}

export type AgentExecutionIssue = {
  id: string; title: string; description: string; time?: string
  resolution?: string
}

export type AgentExecutionStage = {
  id: string; title: string; state: AgentProgressState; time?: string
  description?: string; steps: readonly AgentStep[]
}

export type AgentExecutionRun = {
  id: string; label: string; version?: string; state: AgentProgressState
  description: string; updatedAt?: string; steps: readonly AgentStep[]
  stages?: readonly AgentExecutionStage[]; exceptions?: readonly AgentExecutionIssue[]
}

export type AgentExecutionProgressProps = AgentRecordViewProps & AgentVisualProps & {
  title: string; state: AgentProgressState; description: string; steps: readonly AgentStep[]
  expanded: boolean; onExpandedChange?: (expanded: boolean) => void; updatedAt?: string
  action?: AgentSemanticAction; presentation?: Presentation
  run?: Pick<AgentExecutionRun, "id" | "label" | "version">
  stages?: readonly AgentExecutionStage[]; exceptions?: readonly AgentExecutionIssue[]
  history?: readonly AgentExecutionRun[]; snapshot?: string
}

function IssueRecords({ items, label }: { items: readonly AgentExecutionIssue[]; label: string; density: AgentRecordViewProps["density"] }) {
  return <section className="min-w-0 space-y-1.5" aria-label={label}><h4 className="text-ui-meta text-muted-foreground">{label}</h4>
    {items.length ? <ul className="space-y-1.5">{items.map(item => <li key={item.id} className="min-w-0 space-y-1">
      <div data-agent-trace-row="" className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
        <CircleAlert aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" /><span className="min-w-0 flex-1 break-words text-ui-action">{item.title}</span>
        {item.time && <AgentMetaLine><span className="sr-only">记录时间：</span>{item.time}</AgentMetaLine>}
      </div>
      <p className="break-words text-ui-hint">{item.description}</p>
      <p className="break-words text-ui-hint text-muted-foreground">{item.resolution ? `处置记录：${item.resolution}` : "处置状态未确认"}</p>
    </li>)}</ul> : <p className="text-ui-hint text-muted-foreground">暂无{label}。</p>}
  </section>
}

function StageRecords({ stages, live, density }: { stages: readonly AgentExecutionStage[]; live: boolean; density: AgentRecordViewProps["density"] }) {
  return <section className="min-w-0 space-y-1.5" aria-label="阶段记录"><h4 className="text-ui-meta text-muted-foreground">阶段记录</h4><ol className="space-y-1.5">
    {stages.map(stage => <li key={stage.id} className="min-w-0 space-y-1">
      <div data-agent-trace-row="" className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
        <Circle aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" /><span className="min-w-0 flex-1 break-words text-ui-action">{stage.title}</span>
        <AgentStatus unknown={stage.state === "unknown"} tone={stage.state === "failed" ? "error" : stage.state === "completed" ? "success" : stage.state === "running" && live ? "info" : ["waiting", "waiting-human", "partial"].includes(stage.state) ? "warning" : "neutral"}><span className="sr-only">阶段状态：</span>{agentProgressLabels[stage.state]}</AgentStatus>
        <AgentMetaLine><span className="sr-only">阶段时间：</span>{stage.time || "阶段时间未确认"}</AgentMetaLine>
      </div>
      {stage.description && <p className="break-words text-ui-hint">{stage.description}</p>}
      <AgentTaskProgress appearance="trace" steps={stage.steps} density={density} activity={live && stage.state === "running" ? "live" : "snapshot"} />
    </li>)}
  </ol></section>
}

/** Overall state is independent of step state. History is always a static snapshot. */
export function AgentExecutionProgress({ title, state, description, steps, expanded, onExpandedChange, updatedAt, action, presentation = "card", view = "inline", density = "default", onExpand, details, run, stages, exceptions, history, snapshot, visual }: AgentExecutionProgressProps) {
  const id = useId()
  const tone = state === "failed" ? "error" : state === "completed" ? "success" : state === "running" ? "info" : state === "waiting" || state === "waiting-human" || state === "partial" ? "warning" : "neutral"
  const live = state === "running" && !snapshot
  const full = view === "workspace"
  const recordView = full || density === "compact" || !!run || !!snapshot
  const stepList = steps.length ? <AgentTaskProgress appearance="trace" steps={steps} density={density} activity={live ? "live" : "snapshot"} /> : <p className="pt-3 text-ui-hint text-muted-foreground">暂无步骤记录。</p>
  return <AgentWell aria-labelledby={id} presentation={presentation}>
    <div className="flex flex-wrap items-start justify-between gap-2.5" data-agent-record-view={recordView ? view : undefined} data-agent-record-density={recordView ? density : undefined} data-run-id={run?.id} data-activity={recordView ? live ? "live" : "snapshot" : undefined}><div className="min-w-0 space-y-1"><h3 id={id} className="break-words text-item-title">{title}</h3>{(recordView || updatedAt || full || state === "unknown") && <AgentMetaLine>
      {recordView && <>{snapshot ? `当时状态 · ${snapshot}` : "当前状态"}{run ? ` · ${run.label}${run.version ? ` · ${run.version}` : ""}` : full ? " · 当前轮次未确认" : ""}</>}
      {(updatedAt || full || state === "unknown") && <>{recordView && " · "}最近更新：{updatedAt || visual?.updatedAt || "更新时间未确认"}</>}
    </AgentMetaLine>}</div><AgentStatus tone={tone} unknown={state === "unknown"}>{agentProgressLabels[state]}</AgentStatus></div>
    <AgentVisibleMarkers visual={visual} />
    <p role="status" className="break-words text-ui-body">{description}</p>
    <AgentTraceRows expanded={expanded} onExpandedChange={onExpandedChange} alwaysExpanded={full || density === "compact"}>{stepList}</AgentTraceRows>
    {stages && <StageRecords stages={stages} live={live} density={density} />}
    {(exceptions || full) && <IssueRecords items={exceptions ?? []} label="异常与处置记录" density={density} />}
    {(history || full) && <section className="min-w-0 space-y-1.5" aria-label="历次执行"><h4 className="text-ui-meta text-muted-foreground">历次执行</h4>{history?.length ? <ol className="space-y-2.5">{history.map(previous => <li key={previous.id} data-run-id={previous.id} data-activity="snapshot" className="min-w-0 space-y-1.5">
      <div data-agent-trace-row="" className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1"><History aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" /><span className="min-w-0 flex-1 break-words text-ui-action">{previous.label}</span>
        <AgentStatus unknown={previous.state === "unknown"} tone={previous.state === "failed" ? "error" : previous.state === "completed" ? "success" : ["waiting", "waiting-human", "partial"].includes(previous.state) ? "warning" : "neutral"}>当时状态 · {agentProgressLabels[previous.state]}</AgentStatus>
        <AgentMetaLine>{previous.version && <>当时版本 · {previous.version} · </>}{previous.updatedAt || "当时更新时间未确认"}</AgentMetaLine>
      </div>
      <p className="break-words text-ui-hint">{previous.description}</p>
      <AgentTaskProgress appearance="trace" steps={previous.steps} activity="snapshot" density={density} />
      {previous.stages && <StageRecords stages={previous.stages} live={false} density={density} />}
      {previous.exceptions && <IssueRecords items={previous.exceptions} label="当时异常与处置记录" density={density} />}
    </li>)}</ol> : <p className="text-ui-hint text-muted-foreground">暂无较早执行记录。</p>}</section>}
    {action && <Action action={action} secondary />}
    <RecordExpand view={view} onExpand={onExpand} />
    <AgentSourceChip>{details}</AgentSourceChip>
  </AgentWell>
}

export type AgentExecutionReceipt = (
  | { status: "succeeded" | "partial" | "failed"; completed: readonly string[]; remaining: readonly string[]; next?: AgentSemanticAction; secondary?: AgentSemanticAction }
  | { status: "unknown"; query?: AgentSemanticAction }
) & { record?: { request: string; run: string; version?: string; receivedAt?: string } }

export type AgentExecutionOutput = {
  id: string; title: string; version: string; status: string; open?: AgentSemanticAction
}

export type AgentExecutionResultProps = AgentRecordViewProps & AgentVisualProps & {
  title: string; description: string; receipt: AgentExecutionReceipt; facts?: readonly Fact[]
  children?: ReactNode; presentation?: Presentation
  outputs?: readonly AgentExecutionOutput[]; failures?: readonly AgentExecutionIssue[]
}

/** Unknown receipt accepts only a query intent, never a generic resubmit action. */
export function AgentExecutionResult({ title, description, receipt, facts = [], children, presentation = "card", view = "inline", density = "default", onExpand, details, outputs, failures, visual }: AgentExecutionResultProps) {
  const id = useId()
  const tone = receipt.status === "succeeded" ? "success" : receipt.status === "failed" ? "error" : receipt.status === "unknown" ? "neutral" : "warning"
  const full = view === "workspace", compact = density === "compact"
  return <AgentSurface aria-labelledby={id} presentation={presentation}>
    <div className="flex min-w-0 flex-wrap items-start justify-between gap-2.5" data-agent-record-view={full || compact ? view : undefined} data-agent-record-density={full || compact ? density : undefined}>
      <h3 id={id} className="min-w-0 flex-1 break-words text-item-title">{title}</h3>
      <AgentStatus tone={tone} unknown={receipt.status === "unknown"}>{{ succeeded: "已完成", partial: "部分完成", failed: "明确失败", unknown: "状态未确认" }[receipt.status]}</AgentStatus>
    </div>
    <AgentVisibleMarkers visual={visual} />
    {receipt.status === "unknown" && <AgentUpdatedAt value={receipt.record?.receivedAt || visual?.updatedAt} />}
    <p role="status" className="break-words text-ui-hint">{description}</p>
    {receipt.record && <Facts items={[{ label: "原请求", value: receipt.record.request }, { label: "对应执行", value: receipt.record.run }, { label: "回执版本", value: receipt.record.version || "版本未确认" }, { label: "回执时间", value: receipt.record.receivedAt || "时间未确认" }]} />}
    {!!facts.length && <Facts items={facts} emphasis />}
    {receipt.status !== "unknown" && <div className="grid gap-2.5 @min-[540px]:grid-cols-2">{[{ label: "已完成", items: receipt.completed, empty: "未报告已完成事项" }, { label: "未完成", items: receipt.remaining, empty: "回执未列出未完成事项" }].map(group => <section key={group.label} className="min-w-0 space-y-1.5"><h4 className="text-ui-action">{group.label}</h4>{group.items.length ? <ul className="list-disc space-y-1 pl-5 text-ui-body">{group.items.map(item => <li key={item} className="break-words">{item}</li>)}</ul> : <p className="text-ui-hint text-muted-foreground">{group.empty}</p>}</section>)}</div>}
    {receipt.status === "unknown" && (full || compact || outputs) && <p className="text-ui-hint">完成与未完成范围：状态未确认</p>}
    {(outputs || full) && <section className="min-w-0 space-y-2.5" aria-label="产出清单"><h4 className="text-ui-action">产出清单</h4>{outputs?.length ? <ul className="space-y-1.5">{outputs.map(output => <li key={output.id} data-output-id={output.id} className="flex min-w-0 flex-wrap items-start gap-3">
      <FileText aria-hidden="true" className="mt-1 size-4 shrink-0" /><div className={compact ? "flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-1" : "min-w-0 flex-1 space-y-1"}><p className="break-words text-item-title">{output.title}</p><AgentMetaLine><span className="sr-only">产出版本：</span>{output.version} · <span className="sr-only">产出状态：</span>{output.status} · <span>{receipt.status !== "unknown" && output.open && !output.open.disabledReason ? "可打开" : "暂不可打开"}</span></AgentMetaLine></div>
      {receipt.status !== "unknown" && output.open && <Action action={output.open} secondary icon={<ArrowUpRight aria-hidden="true" />} />}
    </li>)}</ul> : <p className="text-ui-hint text-muted-foreground">暂无产出记录。</p>}</section>}
    {(failures || full) && <IssueRecords items={failures ?? []} label="失败明细" density={density} />}
    {children}
    {receipt.status === "unknown" ? receipt.query && <Action action={receipt.query} secondary /> : (receipt.next || receipt.secondary) && <div className="flex flex-wrap items-start gap-3">{receipt.next && <Action action={receipt.next} />}{receipt.secondary && <Action action={receipt.secondary} secondary />}</div>}
    {receipt.status !== "unknown" && <RecordExpand view={view} onExpand={onExpand} />}
    <AgentSourceChip>{details}</AgentSourceChip>
  </AgentSurface>
}
