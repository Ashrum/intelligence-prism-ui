"use client"

import { useId, type ReactNode } from "react"
import { ArrowLeft, ArrowUpRight, ChevronDown } from "lucide-react"
import { Card } from "@/components/coss/card"
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "@/components/coss/collapsible"
import { Button } from "./button"
import { Badge } from "./badge"
import { RecordDetails, type AgentRecordViewProps } from "./agent-record-parts"

/** References to the host's existing scope/draft revision; never displayed as labels. */
export type AgentScopeTarget = { scopeId: string; version: string }
export type AgentScopeChange = AgentScopeTarget & { dimensionId: string; value: unknown }
export type AgentScopeValidation =
  | { state: "valid" | "conflict" | "unavailable"; reason: string }
  | { state: "out-of-scope"; reason: string; count?: number }
export type AgentScopeEditor = {
  /** Opaque domain values/options. The host adapter supplies the matching controlled control. */
  value: unknown
  options: unknown
  onChange: (value: unknown) => void
  controlId: string
  labelledBy: string
  describedBy: string
}
type ScopeDimensionBase = { id: string; label: string; required: boolean; core?: boolean }
export type AgentScopeAvailableDimension = ScopeDimensionBase & {
  access: "available"
  source: { label: string; options: unknown }
  value: unknown
  /** Authorized readable selection; nonblank means a value is selected, null/blank means unspecified. */
  summary: string | null
  validation: Extract<AgentScopeValidation, { state: "valid" | "conflict" | "unavailable" }>
  disabledReason?: string
  renderEditor?: (editor: AgentScopeEditor) => ReactNode
  /** Only genuinely small adjustments, e.g. a time preset, belong in inline. */
  renderInlineEditor?: (editor: AgentScopeEditor) => ReactNode
}
export type AgentScopeRestrictedDimension = ScopeDimensionBase & {
  access: "restricted"
  validation: Extract<AgentScopeValidation, { state: "out-of-scope" }>
  // This branch cannot carry a private value, option source, summary or renderer.
  value?: never
  source?: never
  summary?: never
  renderEditor?: never
  renderInlineEditor?: never
}
export type AgentScopeDimension = AgentScopeAvailableDimension | AgentScopeRestrictedDimension
export type AgentScopeConfirmation =
  | { state: "unconfirmed"; reason?: string }
  | { state: "confirmed"; version: string; reason?: string }
  | { state: "changed"; reason: string }
export type AgentScopeExclusion = { reason: string; count?: number }
export type AgentScopeBuilderProps = AgentRecordViewProps & {
  title: string
  scope: AgentScopeTarget
  dimensions: readonly AgentScopeDimension[]
  /** Already authorized by the host; never assembled from opaque values or restricted items. */
  summary: string | null
  impact?: string
  exclusions?: readonly AgentScopeExclusion[]
  confirmation: AgentScopeConfirmation
  onValueChange?: (change: AgentScopeChange) => void
  onConfirm?: (target: AgentScopeTarget) => void
  onReset?: (target: AgentScopeTarget) => void
  onRestoreDefaults?: (target: AgentScopeTarget) => void
  onBack?: () => void
  disabledReason?: string
  confirmDisabledReason?: string
  notice?: string
}

const validationLabels = { valid: "有效", conflict: "范围冲突", "out-of-scope": "超出授权范围", unavailable: "数据不可用" } as const

function ScopeDimension({ dimension, anchor, view, target, disabledReason, onValueChange }: {
  dimension: AgentScopeDimension; anchor: string; view: "inline" | "workspace"; target: AgentScopeTarget
  disabledReason?: string; onValueChange?: AgentScopeBuilderProps["onValueChange"]
}) {
  // Restriction is checked before inspecting any value, options or renderer, including untyped input.
  const outside = dimension.validation.state === "out-of-scope"
  const restricted = dimension.access === "restricted" || outside
  const available = !restricted && dimension.access === "available" ? dimension : null
  const unspecified = !!available && !available.summary?.trim() && available.validation.state === "valid"
  const editor = available && (view === "workspace" ? available.renderEditor : available.renderInlineEditor)
  const blocked = disabledReason || available?.disabledReason
  const editable = available && available.validation.state !== "unavailable" && !blocked && !!onValueChange
  return <section aria-labelledby={`${anchor}-label`} className="min-w-0 space-y-2" data-scope-dimension="">
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <h4 id={`${anchor}-label`} className="break-words text-ui-action">{dimension.label}{dimension.required ? "（必填）" : "（选填）"}</h4>
      <Badge variant={dimension.validation.state === "valid" ? "outline" : "warning"}>{unspecified ? "未指定" : validationLabels[dimension.validation.state]}</Badge>
    </div>
    {!unspecified && <p id={`${anchor}-validation`} role={dimension.validation.state === "valid" ? undefined : "status"} className="break-words text-ui-hint">
      {dimension.validation.reason}
      {dimension.validation.state === "out-of-scope" && dimension.validation.count !== undefined && <>（{dimension.validation.count} 项）</>}
    </p>}
    {available && <>
      <p id={unspecified ? `${anchor}-validation` : undefined} className="break-words text-ui-body">{available.summary?.trim() ? available.summary : "尚未指定"}</p>
      {view === "workspace" && <p className="break-words text-ui-hint text-muted-foreground">可选项来源：{available.source.label}</p>}
      {blocked && <p id={`${anchor}-disabled`} className="break-words text-ui-hint">{blocked}</p>}
      {editable && editor && <div className="min-w-0" role="group" aria-labelledby={`${anchor}-label`} aria-describedby={`${anchor}-validation`}>
        {editor({ value: available.value, options: available.source.options, controlId: `${anchor}-control`, labelledBy: `${anchor}-label`, describedBy: `${anchor}-validation`,
          onChange: value => { if (editable) onValueChange?.({ ...target, dimensionId: dimension.id, value }) } })}
      </div>}
    </>}
  </section>
}

export function AgentScopeBuilder({ title, scope, dimensions, summary, impact, exclusions = [], confirmation,
  view = "inline", density = "default", onValueChange, onConfirm, onReset, onRestoreDefaults, onExpand, onBack,
  disabledReason, confirmDisabledReason, notice, details }: AgentScopeBuilderProps) {
  const id = useId(), compact = density === "compact"
  const identified = !!scope.scopeId.trim() && !!scope.version.trim()
  const target: AgentScopeTarget = { scopeId: scope.scopeId, version: scope.version }
  const mutationReason = disabledReason || (!identified ? "范围或版本尚未确认。" : undefined)
  const hasScope = !!summary?.trim() && dimensions.length > 0
  const hasIssues = dimensions.some(dimension => dimension.access === "restricted" || dimension.validation.state !== "valid")
  const confirmReason = mutationReason || confirmDisabledReason || (!hasScope ? "请先指定本次任务范围。" : hasIssues ? "请先处理范围中的校验问题。" : undefined)
  const changed = confirmation.state === "changed" || (confirmation.state === "confirmed" && confirmation.version !== scope.version)
  const confirmed = confirmation.state === "confirmed" && !changed && !confirmReason
  const visible = dimensions.filter(dimension => view === "workspace" || !onExpand || dimension.core || dimension.access === "restricted" || dimension.validation.state !== "valid" || (dimension.access === "available" && !!dimension.disabledReason))
  const boundaryNotice = notice || "未指定的范围不自动使用全部可用对象。"
  if (compact && view === "inline") {
    // Read authorized summaries only, never inspect opaque domain values or restricted metadata.
    const compactSummary = dimensions.map(dimension => `${dimension.label}：${dimension.validation.state === "out-of-scope" || dimension.access === "restricted"
      ? "超出授权范围" : dimension.summary?.trim() || "未指定"}`).join("；") || "未指定"
    const issues = dimensions.filter(dimension => dimension.access === "restricted" || dimension.validation.state !== "valid" || (dimension.access === "available" && !!dimension.disabledReason))
    const reasons = issues.map(dimension => `${dimension.label}：${dimension.validation.state !== "valid" || dimension.access === "restricted" ? dimension.validation.reason : ""}${dimension.access === "available" && dimension.disabledReason ? ` ${dimension.disabledReason}` : ""}`)
    const attention = issues.length ? `${issues.length} 项需处理` : mutationReason || confirmDisabledReason ? "需处理" : exclusions.length ? "有排除项" : undefined
    const explanation = [changed ? "范围已变化，需重新确认" : undefined, confirmation.reason, ...reasons, mutationReason, confirmDisabledReason, ...exclusions.map(entry => entry.reason)].filter(Boolean).join("；")
    return <Card aria-label={title} data-agent-scope-view={view} data-density={density} className="min-w-0 w-full gap-0 p-2">
      <Collapsible defaultOpen={false}>
        <div data-scope-compact-row="" className="flex min-w-0 flex-wrap items-center gap-2">
          <CollapsibleTrigger aria-controls={`${id}-scope-details`} render={<Button type="button" size="sm" variant="ghost"
            className="min-w-0 flex-[1_1_12rem] justify-start" aria-label={`范围详情：${compactSummary}${explanation ? `；${explanation}` : ""}`} />}>
            <span className="min-w-0 truncate text-ui-body">范围：{compactSummary}</span><ChevronDown aria-hidden="true" />
          </CollapsibleTrigger>
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant="outline" role="status" aria-label={changed ? "范围已变化，需重新确认" : confirmed ? "范围已确认" : "范围待确认"}>{changed ? "需重确认" : confirmed ? "已确认" : "待确认"}</Badge>
            {attention && <Badge variant="warning" role="status" aria-label={`${attention}；${explanation}`}>{attention}</Badge>}
            {onExpand && <Button type="button" size="sm" variant="outline" onClick={event => onExpand(event.currentTarget)}>调整</Button>}
          </div>
        </div>
        <CollapsiblePanel id={`${id}-scope-details`} keepMounted className="motion-reduce:transition-none">
          <div className="min-w-0 space-y-3 pt-3" data-scope-compact-details="">
            <p className="break-words text-ui-body">{summary?.trim() ? summary : "尚未指定范围"}</p>
            {changed && <p className="text-ui-hint">范围已变化，需重新确认</p>}
            {confirmation.reason && <p className="break-words text-ui-hint">{confirmation.reason}</p>}
            {mutationReason && <p className="break-words text-ui-hint">{mutationReason}</p>}
            {confirmDisabledReason && <p className="break-words text-ui-hint">{confirmDisabledReason}</p>}
            {impact && <p data-scope-impact="" className="break-words text-ui-hint">{impact}</p>}
            {exclusions.length > 0 && <ul aria-label="排除与不可用部分" className="space-y-2">{exclusions.map((entry, index) =>
              <li key={index} className="break-words text-ui-hint">{entry.reason}{entry.count !== undefined && <>（{entry.count} 项）</>}</li>)}</ul>}
            {dimensions.map((dimension, index) => <ScopeDimension key={dimension.id} dimension={dimension} anchor={`${id}-dimension-${index}`} view="inline" target={target} disabledReason={mutationReason} />)}
            {!dimensions.length && <p className="text-ui-hint">暂未提供可选范围。</p>}
            <p className="break-words text-ui-hint text-muted-foreground">{boundaryNotice}</p>
            {details}
          </div>
        </CollapsiblePanel>
      </Collapsible>
    </Card>
  }
  return <Card aria-labelledby={`${id}-title`} data-agent-scope-view={view} data-density={density}
    className={`min-w-0 ${compact ? "gap-3 p-4" : "gap-5 p-5"}`}>
    <header className="min-w-0 space-y-2">
      <h3 id={`${id}-title`} className="break-words text-block-title">{title}</h3>
      <p role="status" className="break-words text-ui-hint">{changed ? "范围已变化，需重新确认" : confirmed ? "范围已确认" : "范围待确认"}</p>
      {confirmation.reason && <p className="break-words text-ui-hint">{confirmation.reason}</p>}
      {mutationReason && <p id={`${id}-disabled`} className="break-words text-ui-hint">{mutationReason}</p>}
    </header>
    <section aria-label={view === "workspace" ? "范围预览" : "本次范围"} className="min-w-0 space-y-2">
      <h4 className="text-ui-action">{view === "workspace" ? "范围预览" : "本次范围"}</h4>
      <p className="break-words text-ui-body">{summary?.trim() ? summary : "尚未指定范围"}</p>
      {impact && <p data-scope-impact="" className="break-words text-ui-hint">{impact}</p>}
      {exclusions.length > 0 && <ul aria-label="排除与不可用部分" className="min-w-0 space-y-2">{exclusions.map((entry, index) =>
        <li key={index} className="break-words text-ui-hint">{entry.reason}{entry.count !== undefined && <>（{entry.count} 项）</>}</li>)}</ul>}
    </section>
    <div className={compact ? "min-w-0 space-y-3" : "min-w-0 space-y-5"}>
      {visible.map(dimension => <ScopeDimension key={dimension.id} dimension={dimension} anchor={`${id}-dimension-${dimensions.indexOf(dimension)}`}
        view={view} target={target} disabledReason={mutationReason} onValueChange={onValueChange} />)}
      {!dimensions.length && <p className="text-ui-hint">暂未提供可选范围。</p>}
    </div>
    <p className="break-words text-ui-hint text-muted-foreground">{boundaryNotice}</p>
    <RecordDetails>{details}</RecordDetails>
    {onConfirm && !confirmed && confirmReason && <p id={`${id}-confirm-reason`} className="break-words text-ui-hint">{confirmReason}</p>}
    <div className="flex min-w-0 flex-wrap gap-2">
      {onConfirm && !confirmed && <Button type="button" size="navigation" disabled={!!confirmReason} aria-describedby={confirmReason ? `${id}-confirm-reason` : undefined}
        onClick={() => { if (!confirmReason) onConfirm(target) }}>{changed ? "重新确认范围" : "确认范围"}</Button>}
      {view === "inline" && onExpand && <Button type="button" size="navigation" variant="outline" onClick={event => onExpand(event.currentTarget)}>调整完整范围<ArrowUpRight aria-hidden="true" /></Button>}
      {view === "workspace" && onReset && <Button type="button" size="navigation" variant="outline" disabled={!!mutationReason} aria-describedby={mutationReason ? `${id}-disabled` : undefined}
        onClick={() => { if (!mutationReason) onReset(target) }}>重置范围</Button>}
      {view === "workspace" && onRestoreDefaults && <Button type="button" size="navigation" variant="outline" disabled={!!mutationReason} aria-describedby={mutationReason ? `${id}-disabled` : undefined}
        onClick={() => { if (!mutationReason) onRestoreDefaults(target) }}>恢复默认</Button>}
      {view === "workspace" && onBack && <Button type="button" size="navigation" variant="outline" onClick={onBack}><ArrowLeft aria-hidden="true" />返回原位置</Button>}
    </div>
  </Card>
}
