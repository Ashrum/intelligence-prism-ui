"use client"

import { useId, useRef, type ReactNode } from "react"
import { ArrowUpRight, Check, ChevronDown, CircleAlert, FileText, History } from "lucide-react"
import { Alert, AlertDescription } from "@/components/coss/alert"
import { Button } from "@/components/coss/button"
import { Card } from "@/components/coss/card"
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "@/components/coss/collapsible"
import { Badge } from "./badge"
import { AgentTaskProgress, type AgentStep } from "./agent-components"

/** An available host capability. A callback expresses intent; it is never a receipt. */
export type AgentSemanticAction = { label: string; onAction: () => void; disabledReason?: string }
type Fact = { label: string; value: string }
type Presentation = "card" | "inline"

function Surface({ labelledBy, presentation, children }: { labelledBy: string; presentation: Presentation; children: ReactNode }) {
  return presentation === "inline"
    ? <section aria-labelledby={labelledBy} className="@container min-w-0 space-y-5">{children}</section>
    : <Card aria-labelledby={labelledBy} className="@container min-w-0 gap-5 p-5 sm:p-6">{children}</Card>
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

export type AgentProgressState = "pending" | "running" | "waiting" | "unknown" | "completed" | "partial" | "failed"
const progressLabels: Record<AgentProgressState, string> = { pending: "待开始", running: "进行中", waiting: "等待处理", unknown: "状态未确认", completed: "已完成", partial: "部分完成", failed: "执行失败" }

/** Overall state is independent of step state. Unknown/waiting states never animate old steps. */
export function AgentExecutionProgress({ title, state, description, steps, expanded, onExpandedChange, updatedAt, action, presentation = "card" }: {
  title: string; state: AgentProgressState; description: string; steps: readonly AgentStep[];
  expanded: boolean; onExpandedChange?: (expanded: boolean) => void; updatedAt?: string;
  action?: AgentSemanticAction; presentation?: Presentation;
}) {
  const id = useId()
  const tone = state === "failed" ? "error" : state === "completed" ? "success" : state === "running" ? "info" : state === "waiting" || state === "unknown" || state === "partial" ? "warning" : "outline"
  return <Surface labelledBy={id} presentation={presentation}>
    <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 space-y-1"><h3 id={id} className="break-words text-block-title">{title}</h3>{updatedAt && <p className="text-ui-hint text-muted-foreground">{updatedAt}</p>}</div><Badge variant={tone}>{progressLabels[state]}</Badge></div>
    <p role="status" className="break-words text-ui-body">{description}</p>
    <Collapsible open={expanded} onOpenChange={onExpandedChange}>
      {onExpandedChange && <CollapsibleTrigger render={<Button variant="ghost" size="sm" />}><ChevronDown aria-hidden="true" className={expanded ? "rotate-180" : undefined} />{expanded ? "收起步骤" : "查看步骤"}</CollapsibleTrigger>}
      <CollapsiblePanel className="motion-reduce:transition-none">{steps.length ? <AgentTaskProgress steps={steps} activity={state === "running" ? "live" : "snapshot"} /> : <p className="pt-3 text-ui-hint text-muted-foreground">暂无步骤记录。</p>}</CollapsiblePanel>
    </Collapsible>
    {action && <Action action={action} secondary />}
  </Surface>
}

export type AgentExecutionReceipt =
  | { status: "succeeded" | "partial" | "failed"; completed: readonly string[]; remaining: readonly string[]; next?: AgentSemanticAction; secondary?: AgentSemanticAction }
  | { status: "unknown"; query?: AgentSemanticAction }

/** Unknown receipt accepts only a query intent, never a generic resubmit action. */
export function AgentExecutionResult({ title, description, receipt, facts = [], children, presentation = "card" }: {
  title: string; description: string; receipt: AgentExecutionReceipt; facts?: readonly Fact[];
  children?: ReactNode; presentation?: Presentation;
}) {
  const id = useId()
  const tone = receipt.status === "succeeded" ? "success" : receipt.status === "failed" ? "error" : "warning"
  return <Surface labelledBy={id} presentation={presentation}>
    <div className="flex items-start gap-3">{receipt.status === "succeeded" ? <Check aria-hidden="true" className="mt-1 size-5 shrink-0 text-success-foreground" /> : <CircleAlert aria-hidden="true" className={`mt-1 size-5 shrink-0 ${receipt.status === "failed" ? "text-destructive-foreground" : "text-warning-foreground"}`} />}<div className="min-w-0 flex-1 space-y-2"><div className="flex flex-wrap items-start justify-between gap-3"><h3 id={id} className="min-w-0 break-words text-block-title">{title}</h3><Badge variant={tone}>{{ succeeded: "已完成", partial: "部分完成", failed: "明确失败", unknown: "状态未确认" }[receipt.status]}</Badge></div><p role="status" className="break-words text-read-body">{description}</p></div></div>
    {!!facts.length && <Facts items={facts} />}
    {receipt.status !== "unknown" && <div className="grid gap-5 @min-[540px]:grid-cols-2">{[{ label: "已完成", items: receipt.completed, empty: "未报告已完成事项" }, { label: "未完成", items: receipt.remaining, empty: "回执未列出未完成事项" }].map(group => <section key={group.label} className="min-w-0 space-y-2"><h4 className="text-ui-action">{group.label}</h4>{group.items.length ? <ul className="list-disc space-y-1 pl-5 text-ui-body">{group.items.map(item => <li key={item} className="break-words">{item}</li>)}</ul> : <p className="text-ui-hint text-muted-foreground">{group.empty}</p>}</section>)}</div>}
    {children}
    {receipt.status === "unknown" ? receipt.query && <Action action={receipt.query} secondary /> : (receipt.next || receipt.secondary) && <div className="flex flex-wrap items-start gap-3">{receipt.next && <Action action={receipt.next} />}{receipt.secondary && <Action action={receipt.secondary} secondary />}</div>}
  </Surface>
}
