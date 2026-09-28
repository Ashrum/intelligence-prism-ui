"use client"

import { useId, type ReactNode } from "react"
import { ArrowLeft, ArrowUpRight, CircleAlert } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/coss/alert"
import { Card } from "@/components/coss/card"
import { Checkbox } from "@/components/coss/checkbox"
import { Fieldset, FieldsetLegend } from "@/components/coss/fieldset"
import { Label } from "@/components/coss/label"
import { NumberField, NumberFieldDecrement, NumberFieldGroup, NumberFieldIncrement, NumberFieldInput } from "@/components/coss/number-field"
import { Radio, RadioGroup } from "@/components/coss/radio-group"
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from "@/components/coss/select"
import { Badge } from "./badge"
import { Button } from "./button"
import { RecordDetails, type AgentRecordViewProps } from "./agent-record-parts"

/** References the host's existing object/draft. It is not a new task or an authorization token. */
export type AgentConstraintTarget = { objectId: string; version: string }
export type AgentConstraintLocation = AgentConstraintTarget & { label: string; location: string; anchor?: string }
export type AgentConstraintValidation =
  | { state: "valid"; reason?: string }
  | { state: "conflict"; reason: string; targets: readonly AgentConstraintLocation[] }
  | { state: "unavailable"; reason: string }
export type AgentConstraintReconfirmation = { required: false } | { required: true; reason: string }
export type AgentConstraintBounds = { min: number | null; max: number | null }
export type AgentConstraintOption = { value: string; label: string; disabledReason?: string }
type ConstraintBase = {
  id: string
  label: string
  description?: string
  impact?: string
  critical: boolean
  validation: AgentConstraintValidation
  disabledReason?: string
}
type ConstraintValue =
  | { type: "toggle" | "required" | "forbidden"; value: boolean; defaultValue: boolean }
  | { type: "ratio"; value: number | null; defaultValue: number | null; step?: number }
  | { type: "bounds"; value: AgentConstraintBounds; defaultValue: AgentConstraintBounds; unit?: string; step?: number }
  | { type: "rule"; value: string | null; defaultValue: string | null; options: readonly AgentConstraintOption[]; control?: "select" | "radio" }
export type AgentConstraintItem = ConstraintBase & ConstraintValue
export type AgentConstraintGroup = { id: string; label: string; description?: string; items: readonly AgentConstraintItem[] }
type ValueChange<T = ConstraintValue> = T extends ConstraintValue ? Pick<T, "type" | "value"> : never
export type AgentConstraintChange = AgentConstraintTarget & { constraintId: string } & ValueChange
export type AgentConstraintLocateRequest = AgentConstraintTarget & { constraintId: string; target: AgentConstraintLocation }
export type AgentConstraintBuilderProps = AgentRecordViewProps & {
  title: string
  basis: AgentConstraintTarget
  groups: readonly AgentConstraintGroup[]
  reconfirmation: AgentConstraintReconfirmation
  /** Relative to the last confirmation; supplied, never derived by comparing values. */
  changes?: readonly { id: string; label: string; description: string }[]
  onValueChange?: (change: AgentConstraintChange) => void
  onRestoreDefaults?: (target: AgentConstraintTarget) => void
  onLocateConflict?: (request: AgentConstraintLocateRequest) => void
  onBack?: () => void
  disabledReason?: string
  notice?: string
  /** Frame only, independent of the semantic view. Use inline inside a confirmation card. */
  presentation?: "card" | "inline"
}

const typeLabels = { toggle: "开关", required: "必须", forbidden: "禁止", ratio: "比例", bounds: "数值边界", rule: "枚举规则" }
const validationLabels = { valid: "有效", conflict: "条件冲突", unavailable: "不可用" }

function valueText(item: AgentConstraintItem, defaults = false): string {
  switch (item.type) {
    case "toggle": case "required": case "forbidden": return (defaults ? item.defaultValue : item.value) ? "启用" : "关闭"
    case "ratio": {
      const value = defaults ? item.defaultValue : item.value
      return value === null ? "未指定" : `${value}%`
    }
    case "bounds": {
      const value = defaults ? item.defaultValue : item.value
      return `下限 ${value.min === null ? "未指定" : `${value.min}${item.unit ?? ""}`}；上限 ${value.max === null ? "未指定" : `${value.max}${item.unit ?? ""}`}`
    }
    case "rule": {
      const value = defaults ? item.defaultValue : item.value
      return value === null ? "未指定" : item.options.find(option => option.value === value)?.label ?? "当前选项未列出"
    }
  }
}

function ConstraintNumber({ id, label, labelledBy, describedBy, value, disabled, invalid, step, onChange }: {
  id: string; label: string; labelledBy: string; describedBy: string; value: number | null
  disabled: boolean; invalid: boolean; step?: number; onChange: (value: number | null) => void
}) {
  // No min/max, rounding, ratio normalization or cross-field validation here.
  return <NumberField id={id} value={value} disabled={disabled} step={step} onValueChange={value => { if (!disabled) onChange(value) }} className="min-w-0">
    <NumberFieldGroup>
      <NumberFieldDecrement aria-label={`减少${label}`} />
      <NumberFieldInput aria-labelledby={labelledBy} aria-describedby={describedBy} aria-invalid={invalid || undefined} />
      <NumberFieldIncrement aria-label={`增加${label}`} />
    </NumberFieldGroup>
  </NumberField>
}

function ConstraintItem({ item, anchor, issueId, full, compact, basis, disabledReason, onValueChange }: {
  item: AgentConstraintItem; anchor: string; issueId?: string; full: boolean; compact: boolean
  basis: AgentConstraintTarget; disabledReason?: string; onValueChange?: AgentConstraintBuilderProps["onValueChange"]
}) {
  const disabled = !!disabledReason || !!item.disabledReason || item.validation.state === "unavailable" || !onValueChange
  const invalid = item.validation.state === "conflict"
  const describedBy = [`${anchor}-description`, issueId, disabledReason ? `${anchor}-disabled` : undefined].filter(Boolean).join(" ")
  const emit = (change: ValueChange) => {
    if (!disabled) onValueChange?.({ ...basis, constraintId: item.id, ...change })
  }
  const label = <Label id={`${anchor}-label`} htmlFor={item.type === "bounds" || (item.type === "rule" && item.control === "radio") ? undefined : `${anchor}-control`} className="min-w-0 break-words text-ui-action">{item.label}</Label>
  let editor: ReactNode
  switch (item.type) {
    case "toggle": case "required": case "forbidden":
      editor = <Checkbox id={`${anchor}-control`} checked={item.value} disabled={disabled} aria-labelledby={`${anchor}-label`} aria-describedby={describedBy} aria-invalid={invalid || undefined}
        onCheckedChange={value => emit({ type: item.type, value })} />
      break
    case "ratio":
      editor = <ConstraintNumber id={`${anchor}-control`} label={item.label} labelledBy={`${anchor}-label`} describedBy={describedBy} value={item.value} step={item.step} disabled={disabled} invalid={invalid}
        onChange={value => emit({ type: "ratio", value })} />
      break
    case "bounds":
      editor = <div className="grid min-w-0 gap-3 sm:grid-cols-2">{(["min", "max"] as const).map(bound => <div key={bound} className="min-w-0 space-y-2">
        <Label id={`${anchor}-${bound}-label`} htmlFor={`${anchor}-${bound}`} className="text-ui-action">{bound === "min" ? "下限" : "上限"}{item.unit ? `（${item.unit}）` : ""}</Label>
        <ConstraintNumber id={`${anchor}-${bound}`} label={`${item.label}${bound === "min" ? "下限" : "上限"}`} labelledBy={`${anchor}-label ${anchor}-${bound}-label`} describedBy={describedBy}
          value={item.value[bound]} step={item.step} disabled={disabled} invalid={invalid} onChange={value => emit({ type: "bounds", value: { ...item.value, [bound]: value } })} />
      </div>)}</div>
      break
    case "rule": {
      const change = (value: string | null) => {
        if (value !== null && !item.options.some(option => option.value === value && !option.disabledReason)) return
        emit({ type: "rule", value })
      }
      editor = item.control === "radio"
        ? <RadioGroup value={item.value} disabled={disabled} aria-labelledby={`${anchor}-label`} aria-describedby={describedBy} aria-invalid={invalid || undefined} onValueChange={change}>
          {item.options.map((option, index) => <Label key={option.value} htmlFor={`${anchor}-option-${index}`} className="flex min-w-0 items-start gap-2 text-ui-body">
            <Radio id={`${anchor}-option-${index}`} value={option.value} disabled={!!option.disabledReason} />
            <span className="min-w-0 break-words">{option.label}</span>
          </Label>)}
        </RadioGroup>
        : <Select items={item.options} value={item.value} disabled={disabled} onValueChange={change}>
          <SelectTrigger id={`${anchor}-control`} aria-labelledby={`${anchor}-label`} aria-describedby={describedBy} aria-invalid={invalid || undefined} className="min-w-0 max-w-full">
            <SelectValue className="whitespace-normal break-words">{valueText(item)}</SelectValue>
          </SelectTrigger>
          <SelectPopup>{item.options.map(option => <SelectItem key={option.value} value={option.value} disabled={!!option.disabledReason}>{option.label}</SelectItem>)}</SelectPopup>
        </Select>
      break
    }
  }
  const boolean = item.type === "toggle" || item.type === "required" || item.type === "forbidden"
  return <section aria-labelledby={`${anchor}-label`} data-constraint-item="" className={compact ? "min-w-0 space-y-1" : "min-w-0 space-y-2"}>
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      {boolean && editor}{label}
      <Badge variant={item.validation.state === "valid" ? "outline" : "warning"}>{validationLabels[item.validation.state]}</Badge>
      {item.critical && <span className="text-ui-hint text-muted-foreground">关键条件</span>}
    </div>
    <div id={`${anchor}-description`} className="min-w-0 space-y-1 text-ui-hint">
      {full && <p className="text-muted-foreground">{typeLabels[item.type]} · 默认：{valueText(item, true)}</p>}
      {item.description && <p className="break-words">{item.description}</p>}
      {item.impact && <p className="break-words">{item.impact}</p>}
      {item.type === "ratio" && <p>单位：%</p>}
      {item.type === "rule" && item.control === "radio" && item.value !== null && !item.options.some(option => option.value === item.value) && <p>当前选项未列出</p>}
      {item.validation.state === "valid" && item.validation.reason && <p className="break-words">{item.validation.reason}</p>}
      {item.disabledReason && <p className="break-words">{item.disabledReason}</p>}
      {item.type === "rule" && item.options.some(option => option.disabledReason) && <ul className="space-y-1">{item.options.filter(option => option.disabledReason).map(option => <li key={option.value} className="break-words">{option.label}：{option.disabledReason}</li>)}</ul>}
    </div>
    {disabledReason && <span id={`${anchor}-disabled`} className="sr-only">{disabledReason}</span>}
    {!boolean && editor}
  </section>
}

/** Semantic 08 edits conditions; semantic 25 alone presents execution confirmation. */
export function AgentConstraintBuilder({ title, basis, groups, reconfirmation, changes, view = "inline", density = "default", presentation = "card",
  onValueChange, onRestoreDefaults, onLocateConflict, onExpand, onBack, disabledReason, notice, details }: AgentConstraintBuilderProps) {
  const id = useId(), full = view === "workspace", compact = density === "compact"
  const items = groups.flatMap(group => group.items)
  const identified = !!basis.objectId.trim() && !!basis.version.trim() && items.every(item => !!item.id.trim()) && new Set(items.map(item => item.id)).size === items.length
  const mutationReason = disabledReason || (!identified ? "条件或版本尚未确认。" : undefined)
  const target = { objectId: basis.objectId, version: basis.version }
  const issues = items.filter(item => item.validation.state !== "valid")
  const content = <>
    <header className="min-w-0 space-y-2">
      <h3 id={`${id}-title`} className="break-words text-block-title">{title}</h3>
      {reconfirmation.required && <div role="status" className="space-y-1" data-constraint-reconfirmation="">
        <p className="text-ui-action">条件已变化，需重新确认</p><p className="break-words text-ui-hint">{reconfirmation.reason}</p>
      </div>}
      {mutationReason && <p id={`${id}-disabled`} className="break-words text-ui-hint">{mutationReason}</p>}
    </header>
    {issues.length > 0 && <Alert variant="warning" role="status" data-constraint-issues="">
      <CircleAlert aria-hidden="true" /><AlertTitle>待处理条件</AlertTitle>
      <AlertDescription><ul className="min-w-0 space-y-3">{issues.map(item => <li key={item.id} id={`${id}-issue-${items.indexOf(item)}`} className="min-w-0 space-y-2">
        <p className="break-words text-ui-hint">{item.label} · {validationLabels[item.validation.state]}：{item.validation.reason}</p>
        {item.validation.state === "conflict" && <ul className="min-w-0 space-y-2">{item.validation.targets.map((location, index) => <li key={index} className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="min-w-0 break-words text-ui-hint">{location.label} · {location.location}</span>
          {full && onLocateConflict && <Button type="button" size="sm" variant="outline" aria-label={`定位${location.label}：${location.location}`}
            onClick={() => onLocateConflict({ ...target, constraintId: item.id, target: { ...location } })}>定位</Button>}
        </li>)}</ul>}
      </li>)}</ul></AlertDescription>
    </Alert>}
    <div className={compact ? "min-w-0 space-y-3" : "min-w-0 space-y-5"}>{groups.map((group, groupIndex) => {
      const visible = group.items.filter(item => full || !onExpand || item.critical || item.validation.state !== "valid" || !!item.disabledReason || (item.type === "rule" && item.options.some(option => !!option.disabledReason)))
      if (!visible.length) return null
      return <Fieldset key={group.id} aria-labelledby={`${id}-group-${groupIndex}`} className={compact ? "min-w-0 space-y-3" : "min-w-0 space-y-4"}>
        <FieldsetLegend id={`${id}-group-${groupIndex}`} className={full ? "break-words text-item-title" : "sr-only"}>{group.label}</FieldsetLegend>
        {full && group.description && <p className="break-words text-ui-hint">{group.description}</p>}
        {visible.map(item => <ConstraintItem key={item.id} item={item} anchor={`${id}-group-${groupIndex}-item-${items.indexOf(item)}`} issueId={item.validation.state !== "valid" ? `${id}-issue-${items.indexOf(item)}` : undefined}
          full={full} compact={compact} basis={target} disabledReason={mutationReason} onValueChange={onValueChange} />)}
      </Fieldset>
    })}</div>
    {!items.length && <p className="text-ui-hint">暂未提供处理条件。</p>}
    {items.length > 0 && !full && onExpand && !items.some(item => item.critical || item.validation.state !== "valid" || item.disabledReason) && <p className="text-ui-hint">暂无主要条件，可调整全部条件。</p>}
    {full && <section aria-label="相对上次确认的变化" className="min-w-0 space-y-2">
      <h4 className="text-ui-action">相对上次确认的变化</h4>
      {changes === undefined ? <p className="text-ui-hint">暂未提供变化记录。</p> : changes.length === 0 ? <p className="text-ui-hint">没有条件变化。</p>
        : <ul className="space-y-2">{changes.map(change => <li key={change.id} className="break-words text-ui-hint">{change.label}：{change.description}</li>)}</ul>}
    </section>}
    {notice && <p className="break-words text-ui-hint text-muted-foreground">{notice}</p>}
    <RecordDetails>{details}</RecordDetails>
    <div className="flex min-w-0 flex-wrap gap-2">
      {!full && onExpand && <Button type="button" size="navigation" variant="outline" onClick={event => onExpand(event.currentTarget)}>调整全部条件<ArrowUpRight aria-hidden="true" /></Button>}
      {full && onRestoreDefaults && <Button type="button" size="navigation" variant="outline" disabled={!!mutationReason} aria-describedby={mutationReason ? `${id}-disabled` : undefined}
        onClick={() => { if (!mutationReason) onRestoreDefaults(target) }}>恢复默认</Button>}
      {full && onBack && <Button type="button" size="navigation" variant="outline" onClick={onBack}><ArrowLeft aria-hidden="true" />返回原位置</Button>}
    </div>
  </>
  const shared = { "aria-labelledby": `${id}-title`, "data-agent-constraint-view": view, "data-density": density }
  return presentation === "inline"
    ? <section {...shared} className={compact ? "min-w-0 space-y-3" : "min-w-0 space-y-5"}>{content}</section>
    : <Card {...shared} className={compact ? "min-w-0 gap-3 p-4" : "min-w-0 gap-5 p-5"}>{content}</Card>
}
