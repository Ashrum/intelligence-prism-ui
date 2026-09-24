"use client"

import { useId, useRef, type ReactNode } from "react"
import { ArrowUpRight, Check, ChevronDown, Circle, CircleAlert, CircleHelp, FileText, History } from "lucide-react"
import { Alert, AlertDescription } from "@/components/coss/alert"
import { Button } from "@/components/coss/button"
import { Card } from "@/components/coss/card"
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "@/components/coss/collapsible"
import { Badge } from "./badge"
import { AgentTaskProgress, type AgentStep } from "./agent-components"
import { agentProgressLabels, type AgentProgressState } from "@/lib/prism-next/agent-progress"
import { RecordDetails, RecordExpand, type AgentRecordViewProps } from "./agent-record-parts"
export type { AgentProgressState } from "@/lib/prism-next/agent-progress"

/** An available host capability. A callback expresses intent; it is never a receipt. */
export type AgentSemanticAction = { label: string; onAction: () => void; disabledReason?: string }
type Fact = { label: string; value: string }
type Presentation = "card" | "inline"

function Surface({ labelledBy, presentation, children, density = "default" }: { labelledBy: string; presentation: Presentation; children: ReactNode; density?: AgentRecordViewProps["density"] }) {
  return presentation === "inline"
    ? <section aria-labelledby={labelledBy} className={density === "compact" ? "@container min-w-0 space-y-3" : "@container min-w-0 space-y-5"}>{children}</section>
    : <Card aria-labelledby={labelledBy} className={density === "compact" ? "@container min-w-0 gap-3 p-4" : "@container min-w-0 gap-5 p-5 sm:p-6"}>{children}</Card>
}

function Facts({ items }: { items: readonly Fact[] }) {
  return <dl className="grid min-w-0 gap-x-6 gap-y-3 @min-[480px]:grid-cols-2">{items.map(item => <div key={item.label} className="min-w-0"><dt className="text-ui-hint text-muted-foreground">{item.label}</dt><dd className="mt-1 break-words text-ui-body">{item.value}</dd></div>)}</dl>
}

function Action({ action, secondary = false, icon }: { action: AgentSemanticAction; secondary?: boolean; icon?: ReactNode }) {
  const id = useId()
  return <div className="min-w-0 space-y-2"><Button variant={secondary ? "outline" : "default"} disabled={!!action.disabledReason} aria-describedby={action.disabledReason ? id : undefined} onClick={action.onAction} className="max-w-full whitespace-normal">{action.label}{icon}</Button>{action.disabledReason && <p id={id} className="text-ui-hint text-muted-foreground">{action.disabledReason}</p>}</div>
}

/** A preview describes an object, independently of execution and publication. */
export function AgentArtifactPreview({ title, version, status, summary, facts = [], children, open, notice, snapshot, presentation = "card" }: {
  title: string; version: string; status: string; summary: string; facts?: readonly Fact[]; children?: ReactNode;
  open?: AgentSemanticAction; notice?: string; snapshot?: string; presentation?: Presentation;
}) {
  const id = useId()
  return <Surface labelledBy={id} presentation={presentation}>
    <div className="flex min-w-0 items-start gap-3"><FileText aria-hidden="true" className="mt-1 size-5 shrink-0 text-muted-foreground" /><div className="min-w-0 flex-1 space-y-1"><p className="text-ui-hint text-muted-foreground">{snapshot ? `历史成果 · ${snapshot}` : "成果预览"}</p><h3 id={id} className="break-words text-block-title">{title}</h3><p className="text-ui-hint text-muted-foreground">{version}</p></div><Badge variant="outline" className="max-w-full whitespace-normal">{snapshot && <History aria-hidden="true" />}{status}</Badge></div>
    <p className="whitespace-pre-wrap break-words text-read-body">{summary}</p>
    {!!facts.length && <Facts items={facts} />}
    {children && <div className="min-w-0 rounded-lg bg-secondary p-4">{children}</div>}
    {notice && <p className="text-ui-hint text-muted-foreground">{notice}</p>}
    {open && <Action action={open} secondary icon={<ArrowUpRight aria-hidden="true" />} />}
  </Surface>
}

export type AgentConfirmationState =
  | { state: "ready"; confirm: AgentSemanticAction }
  | { state: "submitting" | "received" | "recorded"; description: string }
  | { state: "blocked"; description: string; review?: AgentSemanticAction }
  | { state: "unknown"; description: string; query?: AgentSemanticAction }

/** Host owns all conditions and authorization. No implicit acknowledgement or local gate. */
export function AgentExecutionConfirmation({ title, target, version, effects, confirmation, presentation = "card" }: {
  title: string; target: string; version: string; effects: readonly string[];
  confirmation: AgentConfirmationState; presentation?: Presentation;
}) {
  const id = useId(), heading = useRef<HTMLHeadingElement>(null)
  const labels = { ready: "待确认", submitting: "正在提交", received: "请求已接收", recorded: "确认记录", blocked: "暂不可确认", unknown: "回执未确认" }
  const blocked = confirmation.state === "blocked" || confirmation.state === "unknown"
  return <Surface labelledBy={id} presentation={presentation}>
    <div className="flex flex-wrap items-start justify-between gap-3"><h3 ref={heading} tabIndex={-1} id={id} className="min-w-0 break-words text-block-title outline-none">{title}</h3><Badge variant={blocked ? "warning" : "outline"}>{labels[confirmation.state]}</Badge></div>
    <Facts items={[{ label: "操作对象", value: target }, { label: "依据版本", value: version }]} />
    <div className="space-y-2"><p className="text-ui-action">{confirmation.state === "ready" || confirmation.state === "blocked" ? "确认后的影响" : "本次确认范围"}</p><ul className="list-disc space-y-1 pl-5 text-read-body">{effects.map(effect => <li key={effect} className="break-words">{effect}</li>)}</ul></div>
    {confirmation.state !== "ready" && (blocked ? <Alert variant="warning" role="status"><CircleAlert aria-hidden="true" /><AlertDescription>{confirmation.description}</AlertDescription></Alert> : <p role="status" className="text-ui-hint text-muted-foreground">{confirmation.description}</p>)}
    {confirmation.state === "ready" && <Action action={{ ...confirmation.confirm, onAction: () => { confirmation.confirm.onAction(); requestAnimationFrame(() => heading.current?.focus({ preventScroll: true })) } }} />}
    {confirmation.state === "blocked" && confirmation.review && <Action action={confirmation.review} secondary />}
    {confirmation.state === "unknown" && confirmation.query && <Action action={confirmation.query} secondary />}
  </Surface>
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

export type AgentExecutionProgressProps = AgentRecordViewProps & {
  title: string; state: AgentProgressState; description: string; steps: readonly AgentStep[]
  expanded: boolean; onExpandedChange?: (expanded: boolean) => void; updatedAt?: string
  action?: AgentSemanticAction; presentation?: Presentation
  run?: Pick<AgentExecutionRun, "id" | "label" | "version">
  stages?: readonly AgentExecutionStage[]; exceptions?: readonly AgentExecutionIssue[]
  history?: readonly AgentExecutionRun[]; snapshot?: string
}

function ProgressGlyph({ state }: { state: AgentProgressState }) {
  const Icon = state === "completed" ? Check : state === "unknown" ? CircleHelp : ["failed", "partial", "waiting", "waiting-human"].includes(state) ? CircleAlert : Circle
  return <Icon aria-hidden="true" className="size-4 shrink-0" />
}

function IssueRecords({ items, label, density }: { items: readonly AgentExecutionIssue[]; label: string; density: AgentRecordViewProps["density"] }) {
  return <section className="min-w-0 space-y-2" aria-label={label}><h4 className="text-ui-action">{label}</h4>
    {items.length ? <ul className={density === "compact" ? "space-y-2" : "space-y-4"}>{items.map(item => <li key={item.id} className="flex min-w-0 items-start gap-2">
      <CircleAlert aria-hidden="true" className="mt-1 size-4 shrink-0" /><div className={density === "compact" ? "flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1" : "min-w-0 space-y-1"}><p className="break-words text-item-title">{item.title}</p><p className="break-words text-ui-hint">{item.description}</p>
        {item.time && <p className="break-words text-ui-hint text-muted-foreground">{item.time}</p>}
        <p className="break-words text-ui-hint text-muted-foreground">{item.resolution ? `处置记录：${item.resolution}` : "处置状态未确认"}</p>
      </div>
    </li>)}</ul> : <p className="text-ui-hint text-muted-foreground">暂无{label}。</p>}
  </section>
}

function StageRecords({ stages, live, density }: { stages: readonly AgentExecutionStage[]; live: boolean; density: AgentRecordViewProps["density"] }) {
  return <section className="min-w-0 space-y-3" aria-label="阶段记录"><h4 className="text-ui-action">阶段记录</h4><ol className={density === "compact" ? "space-y-2" : "space-y-5"}>
    {stages.map(stage => <li key={stage.id} className="min-w-0 space-y-2">
      <div className={density === "compact" ? "flex flex-wrap items-center gap-x-3 gap-y-1" : "space-y-2"}><div className="flex flex-wrap items-center gap-x-3 gap-y-1"><span className="break-words text-item-title">{stage.title}</span><span className="flex items-center gap-2 text-ui-hint"><ProgressGlyph state={stage.state} />{agentProgressLabels[stage.state]}</span></div>
        <p className="break-words text-ui-hint text-muted-foreground">{stage.time || "阶段时间未确认"}</p>
        {stage.description && <p className="break-words text-ui-hint">{stage.description}</p>}
      </div>
      <AgentTaskProgress steps={stage.steps} density={density} activity={live && stage.state === "running" ? "live" : "snapshot"} />
    </li>)}
  </ol></section>
}

/** Overall state is independent of step state. History is always a static snapshot. */
export function AgentExecutionProgress({ title, state, description, steps, expanded, onExpandedChange, updatedAt, action, presentation = "card", view = "inline", density = "default", onExpand, details, run, stages, exceptions, history, snapshot }: AgentExecutionProgressProps) {
  const id = useId()
  const tone = state === "failed" ? "error" : state === "completed" ? "success" : state === "running" ? "info" : state === "waiting" || state === "waiting-human" || state === "unknown" || state === "partial" ? "warning" : "outline"
  const live = state === "running" && !snapshot
  const full = view === "workspace"
  const recordView = full || density === "compact" || !!run || !!snapshot
  const stepList = steps.length ? <AgentTaskProgress steps={steps} density={density} activity={live ? "live" : "snapshot"} /> : <p className="pt-3 text-ui-hint text-muted-foreground">暂无步骤记录。</p>
  return <Surface labelledBy={id} presentation={presentation} density={density}>
    <div className="flex flex-wrap items-start justify-between gap-3" data-agent-record-view={recordView ? view : undefined} data-agent-record-density={recordView ? density : undefined} data-run-id={run?.id} data-activity={recordView ? live ? "live" : "snapshot" : undefined}><div className="min-w-0 space-y-1"><h3 id={id} className="break-words text-block-title">{title}</h3>{recordView && <p className="break-words text-ui-hint text-muted-foreground">{snapshot ? `当时状态 · ${snapshot}` : "当前状态"}{run ? ` · ${run.label}${run.version ? ` · ${run.version}` : ""}` : full ? " · 当前轮次未确认" : ""}</p>}{updatedAt && <p className="text-ui-hint text-muted-foreground">{updatedAt}</p>}{full && !updatedAt && <p className="text-ui-hint text-muted-foreground">更新时间未确认</p>}</div><Badge variant={tone}>{recordView && <ProgressGlyph state={state} />}{agentProgressLabels[state]}</Badge></div>
    <p role="status" className="break-words text-ui-body">{description}</p>
    {full || density === "compact" ? stepList : <Collapsible open={expanded} onOpenChange={onExpandedChange}>
      {onExpandedChange && <CollapsibleTrigger render={<Button variant="ghost" size="sm" />}><ChevronDown aria-hidden="true" className={expanded ? "rotate-180" : undefined} />{expanded ? "收起步骤" : "查看步骤"}</CollapsibleTrigger>}
      <CollapsiblePanel className="motion-reduce:transition-none">{stepList}</CollapsiblePanel>
    </Collapsible>}
    {stages && <StageRecords stages={stages} live={live} density={density} />}
    {(exceptions || full) && <IssueRecords items={exceptions ?? []} label="异常与处置记录" density={density} />}
    {(history || full) && <section className="min-w-0 space-y-3" aria-label="历次执行"><h4 className="text-ui-action">历次执行</h4>{history?.length ? <ol className={density === "compact" ? "space-y-3" : "space-y-6"}>{history.map(previous => <li key={previous.id} data-run-id={previous.id} data-activity="snapshot" className="min-w-0 space-y-3">
      <div className="flex flex-wrap items-center gap-2"><History aria-hidden="true" className="size-4 shrink-0" /><span className="break-words text-item-title">{previous.label}</span><span className="break-words text-ui-hint">当时状态 · {agentProgressLabels[previous.state]}</span></div>
      {previous.version && <p className="break-words text-ui-hint">当时版本 · {previous.version}</p>}
      <p className="break-words text-ui-hint text-muted-foreground">{previous.updatedAt || "当时更新时间未确认"}</p><p className="break-words text-ui-hint">{previous.description}</p>
      <AgentTaskProgress steps={previous.steps} activity="snapshot" density={density} />
      {previous.stages && <StageRecords stages={previous.stages} live={false} density={density} />}
      {previous.exceptions && <IssueRecords items={previous.exceptions} label="当时异常与处置记录" density={density} />}
    </li>)}</ol> : <p className="text-ui-hint text-muted-foreground">暂无较早执行记录。</p>}</section>}
    {action && <Action action={action} secondary />}
    <RecordExpand view={view} onExpand={onExpand} />
    <RecordDetails>{details}</RecordDetails>
  </Surface>
}

export type AgentExecutionReceipt = (
  | { status: "succeeded" | "partial" | "failed"; completed: readonly string[]; remaining: readonly string[]; next?: AgentSemanticAction; secondary?: AgentSemanticAction }
  | { status: "unknown"; query?: AgentSemanticAction }
) & { record?: { request: string; run: string; version?: string; receivedAt?: string } }

export type AgentExecutionOutput = {
  id: string; title: string; version: string; status: string; open?: AgentSemanticAction
}

export type AgentExecutionResultProps = AgentRecordViewProps & {
  title: string; description: string; receipt: AgentExecutionReceipt; facts?: readonly Fact[]
  children?: ReactNode; presentation?: Presentation
  outputs?: readonly AgentExecutionOutput[]; failures?: readonly AgentExecutionIssue[]
}

/** Unknown receipt accepts only a query intent, never a generic resubmit action. */
export function AgentExecutionResult({ title, description, receipt, facts = [], children, presentation = "card", view = "inline", density = "default", onExpand, details, outputs, failures }: AgentExecutionResultProps) {
  const id = useId()
  const tone = receipt.status === "succeeded" ? "success" : receipt.status === "failed" ? "error" : "warning"
  const full = view === "workspace", compact = density === "compact"
  return <Surface labelledBy={id} presentation={presentation} density={density}>
    <div className="flex items-start gap-3" data-agent-record-view={full || compact ? view : undefined} data-agent-record-density={full || compact ? density : undefined}>{receipt.status === "succeeded" ? <Check aria-hidden="true" className="mt-1 size-5 shrink-0 text-success-foreground" /> : <CircleAlert aria-hidden="true" className={`mt-1 size-5 shrink-0 ${receipt.status === "failed" ? "text-destructive-foreground" : "text-warning-foreground"}`} />}<div className="min-w-0 flex-1 space-y-2"><div className="flex flex-wrap items-start justify-between gap-3"><h3 id={id} className="min-w-0 break-words text-block-title">{title}</h3><Badge variant={tone}>{{ succeeded: "已完成", partial: "部分完成", failed: "明确失败", unknown: "状态未确认" }[receipt.status]}</Badge></div><p role="status" className="break-words text-read-body">{description}</p></div></div>
    {receipt.record && <Facts items={[{ label: "原请求", value: receipt.record.request }, { label: "对应执行", value: receipt.record.run }, { label: "回执版本", value: receipt.record.version || "版本未确认" }, { label: "回执时间", value: receipt.record.receivedAt || "时间未确认" }]} />}
    {!!facts.length && <Facts items={facts} />}
    {receipt.status !== "unknown" && <div className={compact ? "grid gap-3" : "grid gap-5 @min-[540px]:grid-cols-2"}>{[{ label: "已完成", items: receipt.completed, empty: "未报告已完成事项" }, { label: "未完成", items: receipt.remaining, empty: "回执未列出未完成事项" }].map(group => <section key={group.label} className="min-w-0 space-y-2"><h4 className="text-ui-action">{group.label}</h4>{group.items.length ? <ul className="list-disc space-y-1 pl-5 text-ui-body">{group.items.map(item => <li key={item} className="break-words">{item}</li>)}</ul> : <p className="text-ui-hint text-muted-foreground">{group.empty}</p>}</section>)}</div>}
    {receipt.status === "unknown" && (full || compact || outputs) && <p className="text-ui-hint">完成与未完成范围：状态未确认</p>}
    {(outputs || full) && <section className="min-w-0 space-y-3" aria-label="产出清单"><h4 className="text-ui-action">产出清单</h4>{outputs?.length ? <ul className={compact ? "space-y-2" : "space-y-4"}>{outputs.map(output => <li key={output.id} data-output-id={output.id} className="flex min-w-0 flex-wrap items-start gap-3">
      <FileText aria-hidden="true" className="mt-1 size-4 shrink-0" /><div className={compact ? "flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-1" : "min-w-0 flex-1 space-y-1"}><p className="break-words text-item-title">{output.title}</p><p className="break-words text-ui-hint">{output.version} · {output.status}</p><p className="text-ui-hint text-muted-foreground">{receipt.status !== "unknown" && output.open && !output.open.disabledReason ? "可打开" : "暂不可打开"}</p></div>
      {receipt.status !== "unknown" && output.open && <Action action={output.open} secondary icon={<ArrowUpRight aria-hidden="true" />} />}
    </li>)}</ul> : <p className="text-ui-hint text-muted-foreground">暂无产出记录。</p>}</section>}
    {(failures || full) && <IssueRecords items={failures ?? []} label="失败明细" density={density} />}
    {children}
    {receipt.status === "unknown" ? receipt.query && <Action action={receipt.query} secondary /> : (receipt.next || receipt.secondary) && <div className="flex flex-wrap items-start gap-3">{receipt.next && <Action action={receipt.next} />}{receipt.secondary && <Action action={receipt.secondary} secondary />}</div>}
    {receipt.status !== "unknown" && <RecordExpand view={view} onExpand={onExpand} />}
    <RecordDetails>{details}</RecordDetails>
  </Surface>
}
