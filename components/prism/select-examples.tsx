"use client"

import { useId, useRef, useState } from "react"
import type { Ref } from "react"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Choice = { value: string; label: string; disabled?: boolean }
export const evidenceChoices: Choice[] = [
  { value: "classroom", label: "课堂观察" },
  { value: "homework", label: "作业表现" },
  { value: "assessment", label: "阶段测评" },
  { value: "archived", label: "历史归档 · 暂不可用", disabled: true },
]
export const evidenceLabel = (value: string) => evidenceChoices.find(choice => choice.value === value)?.label || "未选择类型"

export function SelectionField({ label, value, onValueChange, options = evidenceChoices, placeholder = "请选择证据类型", description, error, required, disabled, density = "comfortable", triggerRef }: {
  label: string
  value: string
  onValueChange?: (value: string) => void
  options?: Choice[]
  placeholder?: string
  description?: string
  error?: string
  required?: boolean
  disabled?: boolean
  density?: "comfortable" | "compact"
  triggerRef?: Ref<HTMLButtonElement>
}) {
  const id = useId()
  const feedbackId = `${id}-feedback`
  return <Field className="prism-selection-field" data-invalid={Boolean(error)} data-disabled={disabled || undefined}>
    <FieldLabel htmlFor={id}>{label}{required && <span aria-hidden="true"> *</span>}{disabled && <span className="selection-mode">不可用</span>}</FieldLabel>
    <Select value={value} onValueChange={onValueChange} required={required} disabled={disabled}>
      <SelectTrigger id={id} ref={triggerRef} className="prism-select-trigger" size={density === "compact" ? "sm" : "default"} aria-invalid={Boolean(error)} aria-describedby={error || description ? feedbackId : undefined}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent position="popper" className="prism-select-content">
        {options.map(option => <SelectItem key={option.value} value={option.value} disabled={option.disabled} className="prism-select-item">{option.label}</SelectItem>)}
      </SelectContent>
    </Select>
    {error ? <FieldError id={feedbackId}>{error}</FieldError> : description ? <FieldDescription id={feedbackId}>{description}</FieldDescription> : null}
  </Field>
}

export function SelectExamples() {
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable")
  const [draft, setDraft] = useState("")
  const [applied, setApplied] = useState("")
  const [error, setError] = useState("")
  const [feedback, setFeedback] = useState("")
  const [longValue, setLongValue] = useState("all-evidence")
  const triggerRef = useRef<HTMLButtonElement>(null)

  return <div className="preview-stack">
    <div className="control-preview-toolbar"><span>界面密度</span><SegmentedControl label="Select 界面密度" size="sm" value={density} onValueChange={value => setDensity(value as typeof density)} items={[["comfortable", "舒适 · 36px"], ["compact", "紧凑 · 32px"]]} /></div>
    <section className="selection-example" aria-labelledby="select-scope-title">
      <div><h3 id="select-scope-title">选择证据范围</h3><p className="button-demo-note">九年级 1 班 · 数学。选择后应用，才更新当前范围。</p></div>
      <form noValidate onSubmit={event => {
        event.preventDefault()
        if (!draft) { setError("请选择证据类型后再应用。"); setFeedback(""); triggerRef.current?.focus(); return }
        setApplied(draft); setError(""); setFeedback(`已应用：${evidenceLabel(draft)}。`)
      }}>
        <SelectionField label="证据类型" required value={draft} onValueChange={value => { setDraft(value); setError(""); setFeedback("") }} density={density} triggerRef={triggerRef} error={error} description="单选。历史归档尚未开放，不能选择。" />
        <div className="selection-actions"><Button type="submit" size={density === "compact" ? "sm" : "default"}>应用范围</Button><Button type="button" variant="outline" size={density === "compact" ? "sm" : "default"} disabled={draft === applied && !error} onClick={() => { setDraft(applied); setError(""); setFeedback("已撤回修改。") }}>撤回修改</Button></div>
      </form>
      <div className="selection-result"><span>当前范围</span><strong>{applied ? evidenceLabel(applied) : "尚未应用"}</strong>{draft !== applied && <p>修改尚未应用，当前范围保持不变。</p>}</div>
      <p className="control-feedback" role="status">{feedback}</p>
    </section>
    <section className="control-boundary" aria-labelledby="select-boundary-title">
      <h3 id="select-boundary-title" className="control-caption">长选项与禁用状态</h3>
      <div className="selection-boundaries">
        <div className="control-narrow"><SelectionField label="复核依据 · 304px 容器" density={density} value={longValue} onValueChange={setLongValue} options={[
          { value: "all-evidence", label: "结合课堂观察、作业表现与阶段测评的完整学习证据" },
          { value: "recent-evidence", label: "最近两周的课堂观察与作业表现" },
        ]} description="选中值与菜单内长选项均完整换行。" /></div>
        <div className="control-narrow"><SelectionField label="历史归档" value="archived" options={[{ value: "archived", label: "上学期学习证据" }]} disabled density={density} description="历史归档尚未开放，当前不可修改。" /></div>
      </div>
    </section>
  </div>
}
