"use client"

import { useId } from "react"
import { ArrowLeft, ArrowUpRight } from "lucide-react"
import { Card } from "@/components/coss/card"
import { Input } from "@/components/coss/input"
import { Label } from "@/components/coss/label"
import { NumberField, NumberFieldDecrement, NumberFieldGroup, NumberFieldIncrement, NumberFieldInput } from "@/components/coss/number-field"
import { Radio, RadioGroup } from "@/components/coss/radio-group"
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from "@/components/coss/select"
import { Switch } from "@/components/coss/switch"
import { Badge } from "./badge"
import { Button } from "./button"
import { RecordDetails, type AgentRecordViewProps } from "./agent-record-parts"

export type AgentParameterValue = string | number | boolean | null
export type AgentParameterValidation = { level: "error" | "warning" | "hint"; message: string }
export type AgentParameterStatus = { state: "provided" } | { state: "unconfirmed" | "unknown"; reason: string }
export type AgentParameterOption = { value: string; label: string; disabledReason?: string }
type ParameterBase = {
  id: string
  label: string
  /** One definition list serves both views; the host marks the inline fields. */
  key: boolean
  status: AgentParameterStatus
  validation: readonly AgentParameterValidation[]
  description?: string
  impact?: string
  readOnlyReason?: string
  lockedReason?: string
}
type ParameterValue<T> = { value: T; default?: { value: T; source: string } }
export type AgentParameterDefinition = ParameterBase & (
  | ({ type: "number"; unit?: string; min?: number; max?: number; step?: number; constraintSource?: string } & ParameterValue<number | null>)
  | ({ type: "select" | "radio"; options: readonly AgentParameterOption[] } & ParameterValue<string | null>)
  | ({ type: "switch" } & ParameterValue<boolean>)
  | ({ type: "text-short" } & ParameterValue<string | null>)
)
export type AgentParameterIntent =
  | { type: "change"; parameterId: string; value: AgentParameterValue; baseVersion: string }
  | { type: "reset"; baseVersion: string }
export type AgentParameterConfigProps = AgentRecordViewProps & {
  title: string
  /** Opaque reference to the existing draft, or the frozen snapshot's version. */
  baseVersion: string
  parameters: readonly AgentParameterDefinition[]
  onIntent?: (intent: AgentParameterIntent) => void
  onBack?: () => void
  readOnlyReason?: string
  /** Presence makes the supplied list a host-owned, then-value snapshot. No local capture. */
  frozen?: { versionLabel: string; reason: string }
  /** Optional host capability; resetting never copies defaults inside this component. */
  reset?: { label?: string; disabledReason?: string }
  presentation?: "card" | "inline"
  /** null delegates the single persistent boundary notice to the enclosing card. */
  notice?: string | null
}

const statusLabels = { provided: "", unconfirmed: "未确认", unknown: "未知" }
const validationLabels = { error: "错误", warning: "警告", hint: "提示" }

function valueText(parameter: AgentParameterDefinition, defaults = false): string {
  const value = defaults ? parameter.default?.value : parameter.value
  if (value === null || value === undefined || value === "") return "未指定"
  switch (parameter.type) {
    case "number": return `${value}${parameter.unit ? ` ${parameter.unit}` : ""}`
    case "switch": return value ? "开启" : "关闭"
    case "select": case "radio": return parameter.options.find(option => option.value === value)?.label ?? "当前选项未列出"
    case "text-short": return String(value)
  }
}

function ParameterFacts({ parameter }: { parameter: AgentParameterDefinition }) {
  return <>
    {parameter.status.state !== "provided" && <p className="break-words">{statusLabels[parameter.status.state]}：{parameter.status.reason}</p>}
    {parameter.validation.map((result, index) => <p key={index} className="flex min-w-0 items-start gap-2">
      <Badge variant={result.level === "error" ? "attention" : result.level === "warning" ? "warning" : "outline"}>{validationLabels[result.level]}</Badge>
      <span className="min-w-0 break-words">{result.message}</span>
    </p>)}
    {parameter.impact && <p className="break-words">{parameter.impact}</p>}
    {parameter.readOnlyReason !== undefined && <p className="break-words">只读：{parameter.readOnlyReason || "原因未提供。"}</p>}
    {parameter.lockedReason !== undefined && <p className="break-words">锁定：{parameter.lockedReason || "原因未提供。"}</p>}
    {(parameter.type === "select" || parameter.type === "radio") && parameter.options.filter(option => option.disabledReason).map((option, index) =>
      <p key={index} className="break-words">{option.label}：{option.disabledReason}</p>)}
  </>
}

function ParameterField({ parameter, anchor, full, compact, baseVersion, readOnly, onIntent }: {
  parameter: AgentParameterDefinition; anchor: string; full: boolean; compact: boolean; baseVersion: string
  readOnly: boolean; onIntent?: AgentParameterConfigProps["onIntent"]
}) {
  const blocked = readOnly || parameter.readOnlyReason !== undefined || parameter.lockedReason !== undefined || parameter.status.state === "unknown" || !onIntent
  const invalid = parameter.validation.some(result => result.level === "error")
  const controlProps = { id: `${anchor}-control`, "aria-labelledby": `${anchor}-label`, "aria-describedby": `${anchor}-facts`, "aria-invalid": invalid || undefined }
  const emit = (value: AgentParameterValue) => {
    if (!blocked) onIntent?.({ type: "change", parameterId: parameter.id, value, baseVersion })
  }
  let editor
  if (blocked) {
    editor = <p className="whitespace-pre-wrap break-words text-ui-body" data-parameter-value="">{parameter.status.state === "unknown" ? "当前值未知" : valueText(parameter)}</p>
  } else if (parameter.type === "number") {
    // Bounds are host rules, not UI clamping. Only parse finite numbers / cleared input.
    editor = <NumberField id={controlProps.id} value={parameter.value} step={parameter.step} className="min-w-0 w-full"
      onValueChange={value => { if (value === null || Number.isFinite(value)) emit(value) }}>
      <NumberFieldGroup>
        <NumberFieldDecrement aria-label={`减少${parameter.label}`} />
        <NumberFieldInput aria-labelledby={controlProps["aria-labelledby"]} aria-describedby={controlProps["aria-describedby"]} aria-invalid={controlProps["aria-invalid"]} />
        <NumberFieldIncrement aria-label={`增加${parameter.label}`} />
      </NumberFieldGroup>
    </NumberField>
  } else if (parameter.type === "text-short") {
    editor = <Input {...controlProps} value={parameter.value ?? ""} className="min-w-0 w-full" onChange={event => emit(event.currentTarget.value)} />
  } else if (parameter.type === "switch") {
    editor = <Switch {...controlProps} checked={parameter.value} onCheckedChange={value => emit(value)} />
  } else {
    // Local option indexes keep opaque values out of visible/native DOM values.
    const options = parameter.options.map((option, index) => ({ ...option, value: String(index) }))
    const selected = parameter.options.findIndex(option => option.value === parameter.value)
    const choose = (value: string | null) => {
      if (value === null) { emit(null); return }
      const index = options.findIndex(option => option.value === value)
      const option = parameter.options[index]
      if (option && !option.disabledReason) emit(option.value)
    }
    editor = parameter.type === "radio"
      ? <RadioGroup {...controlProps} value={selected < 0 ? null : String(selected)} onValueChange={choose}>
        {options.map((option, index) => <Label key={index} htmlFor={`${anchor}-option-${index}`} className="flex min-w-0 items-start gap-2 text-ui-body">
          <Radio id={`${anchor}-option-${index}`} value={option.value} disabled={!!option.disabledReason} />
          <span className="min-w-0 break-words">{option.label}</span>
        </Label>)}
      </RadioGroup>
      : <Select items={options} value={selected < 0 ? null : String(selected)} onValueChange={choose}>
        <SelectTrigger {...controlProps} className="min-w-0 w-full max-w-full">
          <SelectValue className="whitespace-normal break-words">{valueText(parameter)}</SelectValue>
        </SelectTrigger>
        <SelectPopup>{options.map(option => <SelectItem key={option.value} value={option.value} disabled={!!option.disabledReason}>{option.label}</SelectItem>)}</SelectPopup>
      </Select>
  }
  return <section aria-labelledby={`${anchor}-label`} data-parameter-field="" className={compact ? "min-w-0 space-y-1" : "min-w-0 space-y-2"}>
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <Label id={`${anchor}-label`} htmlFor={blocked || parameter.type === "radio" ? undefined : controlProps.id} className="min-w-0 break-words text-ui-action">
        {parameter.label}{parameter.type === "number" && parameter.unit ? `（${parameter.unit}）` : ""}
      </Label>
      {parameter.key && full && <span className="text-ui-hint text-muted-foreground">关键参数</span>}
    </div>
    {editor}
    <div id={`${anchor}-facts`} className="min-w-0 space-y-1 text-ui-hint">
      {parameter.description && <p className="break-words">{parameter.description}</p>}
      {!blocked && parameter.type === "number" && <>
        {(parameter.min !== undefined || parameter.max !== undefined) && <p>范围：{parameter.min !== undefined ? `下限 ${parameter.min}${parameter.unit ?? ""}` : "未提供下限"}；{parameter.max !== undefined ? `上限 ${parameter.max}${parameter.unit ?? ""}` : "未提供上限"}</p>}
        {parameter.step !== undefined && <p>步长：{parameter.step}{parameter.unit ?? ""}</p>}
        {parameter.constraintSource && <p className="break-words">{parameter.constraintSource}</p>}
      </>}
      {parameter.type === "radio" && parameter.value !== null && !parameter.options.some(option => option.value === parameter.value) && <p>当前选项未列出</p>}
      <ParameterFacts parameter={parameter} />
      {full && parameter.default && <p className="break-words text-muted-foreground">{`默认：${valueText(parameter, true)}；来源：${parameter.default.source || "未提供"}`}</p>}
    </div>
  </section>
}

/** Semantic 07: scalar parameters. Rules belong to 08; execution confirmation to 25. */
export function AgentParameterConfig({ title, baseVersion, parameters, view = "inline", density = "default", presentation = "card", onIntent, onExpand, onBack,
  frozen, readOnlyReason, reset, notice = "参数修改不代表已确认或执行。", details }: AgentParameterConfigProps) {
  const id = useId(), full = view === "workspace", compact = density === "compact"
  const identified = !!baseVersion.trim() && parameters.every(parameter => !!parameter.id.trim()) && new Set(parameters.map(parameter => parameter.id)).size === parameters.length
  const reason = frozen ? frozen.reason || "当前参数已冻结。" : readOnlyReason !== undefined ? readOnlyReason || "当前仅供查看。" : !identified ? "参数或版本尚未确认。" : !onIntent ? "当前仅供查看。" : undefined
  const readOnly = frozen !== undefined || readOnlyReason !== undefined || !identified || !onIntent
  const visible = parameters.filter(parameter => full || parameter.key)
  const hiddenFacts = full ? [] : parameters.filter(parameter => !parameter.key && (
    parameter.validation.length || parameter.status.state !== "provided" || parameter.readOnlyReason !== undefined || parameter.lockedReason !== undefined || parameter.impact ||
    ((parameter.type === "select" || parameter.type === "radio") && parameter.options.some(option => option.disabledReason))
  ))
  const resetReason = reason || (reset?.disabledReason !== undefined ? reset.disabledReason || "暂不能恢复默认。" : undefined) || (!parameters.length ? "暂未提供参数。" : parameters.some(parameter => parameter.readOnlyReason !== undefined || parameter.lockedReason !== undefined || parameter.status.state === "unknown") ? "部分参数只读、锁定或未知，暂不能整体重置。" : undefined)
  const content = <>
    <header className="min-w-0 space-y-2">
      <div className="flex min-w-0 flex-wrap items-center gap-2"><h3 id={`${id}-title`} className="min-w-0 break-words text-block-title">{title}</h3>
        {frozen && <Badge variant="outline">已冻结</Badge>}
      </div>
      {frozen && <p className="break-words text-ui-hint">确认时的参数 · {frozen.versionLabel}</p>}
      {reason && <p id={`${id}-reason`} className="break-words text-ui-hint">{reason}</p>}
    </header>
    <div className={compact ? "min-w-0 space-y-3" : "min-w-0 space-y-5"}>{visible.map(parameter =>
      <ParameterField key={parameter.id} parameter={parameter} anchor={`${id}-parameter-${parameters.indexOf(parameter)}`} full={full} compact={compact}
        baseVersion={baseVersion} readOnly={readOnly} onIntent={onIntent} />
    )}</div>
    {full && visible.some(parameter => !parameter.default) && <p className="break-words text-ui-hint text-muted-foreground">未提供默认值：{visible.filter(parameter => !parameter.default).map(parameter => parameter.label).join("、")}。</p>}
    {!parameters.length && <p className="text-ui-hint">暂未提供参数。</p>}
    {!!parameters.length && !visible.length && <p className="text-ui-hint">尚未指定关键参数。</p>}
    {!!hiddenFacts.length && <section aria-label="其他参数说明" className="min-w-0 space-y-3" data-parameter-other-facts="">
      <h4 className="text-ui-action">其他参数说明</h4>
      {hiddenFacts.map((parameter, index) => <div key={index} className="min-w-0 space-y-1 text-ui-hint"><p className="break-words text-ui-action">{parameter.label}</p><ParameterFacts parameter={parameter} /></div>)}
    </section>}
    {notice && <p className="break-words text-ui-hint text-muted-foreground" data-parameter-notice="">{notice}</p>}
    <RecordDetails>{details}</RecordDetails>
    <div className="flex min-w-0 flex-wrap gap-2">
      {!full && onExpand && <Button type="button" variant="outline" size="navigation" onClick={event => onExpand(event.currentTarget)}>{readOnly ? "查看全部参数" : "调整全部参数"}<ArrowUpRight aria-hidden="true" /></Button>}
      {full && reset && onIntent && !readOnly && <Button type="button" variant="outline" size="navigation" disabled={!!resetReason} aria-describedby={resetReason ? `${id}-reset-reason` : undefined}
        onClick={() => { if (!readOnly && !resetReason && parameters.length) onIntent({ type: "reset", baseVersion }) }}>{reset.label ?? "恢复默认"}</Button>}
      {full && onBack && <Button type="button" variant="outline" size="navigation" onClick={onBack}><ArrowLeft aria-hidden="true" />返回原位置</Button>}
    </div>
    {full && reset && onIntent && !readOnly && resetReason && <p id={`${id}-reset-reason`} className="break-words text-ui-hint">{resetReason}</p>}
  </>
  const shared = { "aria-labelledby": `${id}-title`, "data-agent-parameter-view": view, "data-density": density }
  return presentation === "inline"
    ? <section {...shared} className={compact ? "min-w-0 space-y-3" : "min-w-0 space-y-5"}>{content}</section>
    : <Card {...shared} className={compact ? "min-w-0 gap-3 p-4" : "min-w-0 gap-5 p-5"}>{content}</Card>
}
