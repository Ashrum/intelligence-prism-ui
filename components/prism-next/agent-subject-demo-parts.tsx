"use client"

import { useId } from "react"
import { Field, FieldLabel } from "@/components/coss/field"
import { Input } from "@/components/coss/input"
import { Slider } from "@/components/coss/slider"

/** Internal shared presentation, not a catalog component or a domain engine. */
export type SubjectCapability = { supported: true; reason?: string } | { supported: false; reason: string }
export type SubjectNumber = { id: string; label: string; min: number; max: number; step: number; value: number | null; unit?: string }
export const hasText = (value?: string) => !!value?.trim()
export const uniqueIds = (items: readonly { id: string }[]) => items.every(item => hasText(item.id)) && new Set(items.map(item => item.id)).size === items.length
export const validDefinition = (item: SubjectNumber) => [item.min, item.max, item.step].every(Number.isFinite) && item.min < item.max && item.step > 0
export const validValue = (item: SubjectNumber, value: number | null): value is number => value !== null && Number.isFinite(value) && value >= item.min && value <= item.max && Math.abs((value - item.min) / item.step - Math.round((value - item.min) / item.step)) < 1e-7

export function SubjectCapabilities({ labels, capabilities, id }: { labels: Record<string, string>; capabilities: Record<string, SubjectCapability>; id: string }) {
  const groups = new Map<string, string[]>()
  for (const [name, label] of Object.entries(labels)) {
    const capability = capabilities[name]
    const reason = capability?.supported ? `可用${hasText(capability.reason) ? `：${capability.reason}` : ""}` : `不支持：${capability?.reason?.trim() || "暂未提供可用能力。"}`
    groups.set(reason, [...(groups.get(reason) ?? []), label])
  }
  return <ul id={id} className="space-y-1 text-ui-hint break-words">{[...groups].map(([reason, names]) => <li key={reason}>{names.join("、")} · {reason}</li>)}</ul>
}

export function SubjectNumberControl({ item, disabled, describedBy, slider = false, onChange }: { item: SubjectNumber; disabled: boolean; describedBy: string; slider?: boolean; onChange: (value: number | null) => void }) {
  const id = useId()
  const valid = validDefinition(item)
  function change(value: number | null) {
    if (!disabled && valid && (value === null || Number.isFinite(value))) onChange(value)
  }
  return <Field className="min-w-0">
    <FieldLabel id={`${id}-label`} htmlFor={`${id}-number`}>{item.label}{item.unit ? `（${item.unit}）` : ""}</FieldLabel>
    <Input nativeInput id={`${id}-number`} type="number" min={item.min} max={item.max} step={item.step}
      value={item.value !== null && Number.isFinite(item.value) ? item.value : ""} disabled={disabled || !valid}
      aria-describedby={`${describedBy} ${id}-range`}
      onChange={event => change(event.target.value === "" ? null : Number(event.target.value))} />
    {slider && valid && validValue(item, item.value) && <Slider min={item.min} max={item.max} step={item.step} value={[item.value]}
      aria-labelledby={`${id}-label`} aria-describedby={`${describedBy} ${id}-range`} disabled={disabled}
      onValueChange={value => change(Array.isArray(value) ? value[0] : value)} />}
    <p id={`${id}-range`} className="text-ui-hint">{valid ? `范围 ${item.min} 至 ${item.max}，步长 ${item.step}` : "范围或步长未确认"}</p>
  </Field>
}

export function SubjectValues({ items }: { items: readonly SubjectNumber[] }) {
  return <dl className="grid min-w-0 gap-2 text-ui-body">{items.map((item, index) => <div key={index} className="flex flex-wrap gap-x-2">
    <dt className="break-words">{item.label}</dt><dd className="break-words">{item.value !== null && Number.isFinite(item.value) ? `${item.value}${item.unit ? ` ${item.unit}` : ""}` : "—"}</dd>
  </div>)}</dl>
}
