"use client"

import "./text-field.css"

import { useEffect, useId, useRef } from "react"
import type { ComponentProps, ReactNode } from "react"
import { AlertCircle } from "lucide-react"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputGroupAddon } from "@/components/ui/input-group"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

export type TextFieldDensity = "comfortable" | "compact"
type FieldDetails = {
  label: string
  description?: ReactNode
  error?: string
  prefix?: ReactNode
  suffix?: ReactNode
  density?: TextFieldDensity
}
export type TextFieldProps = FieldDetails & (
  | ({ multiline?: false } & Omit<ComponentProps<typeof Input>, "prefix" | "children">)
  | ({ multiline: true } & Omit<ComponentProps<typeof Textarea>, "prefix" | "children">)
)

export function TextField(props: TextFieldProps) {
  const generatedId = useId()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { id = generatedId, label, description, error, prefix, suffix, density = "comfortable", className, ...control } = props
  const invalid = Boolean(error) || control["aria-invalid"] === true || control["aria-invalid"] === "true"
  const feedbackId = `${id}-feedback`
  const describedBy = [control["aria-describedby"], error || description ? feedbackId : undefined].filter(Boolean).join(" ") || undefined
  const resize = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`
  }

  useEffect(() => {
    if (!props.multiline) return
    resize()
    let mounted = true
    document.fonts.ready.then(() => { if (mounted) resize() })
    document.fonts.addEventListener("loadingdone", resize)
    window.addEventListener("resize", resize)
    return () => {
      mounted = false
      document.fonts.removeEventListener("loadingdone", resize)
      window.removeEventListener("resize", resize)
    }
  }, [props.multiline, props.value, density])

  let input: ReactNode
  if (control.multiline) {
    const { multiline, ref, onChange, ...textareaProps } = control
    input = <Textarea {...textareaProps} id={id} className="tf-control tf-textarea" placeholder={textareaProps.placeholder || " "}
      aria-invalid={invalid} aria-describedby={describedBy}
      ref={node => {
        textareaRef.current = node
        if (typeof ref === "function") return ref(node)
        if (ref) ref.current = node
      }}
      onChange={event => { resize(); onChange?.(event) }} />
  } else {
    const { multiline, ...inputProps } = control
    input = <Input {...inputProps} id={id} className="tf-control" placeholder={inputProps.placeholder || " "}
      aria-invalid={invalid} aria-describedby={describedBy} />
  }

  return <Field className={cn("tf-field", className)} data-density={density} data-invalid={invalid || undefined} data-disabled={control.disabled || undefined}>
    <div className={cn("tf-outline", (prefix || suffix) && "tf-with-affixes", control.multiline && "tf-multiline")}
      data-invalid={invalid || undefined} data-readonly={control.readOnly || undefined} data-disabled={control.disabled || undefined}>
      {prefix && <InputGroupAddon className="tf-affix tf-prefix" aria-hidden="true">{prefix}</InputGroupAddon>}
      {input}
      {suffix && <InputGroupAddon className="tf-affix tf-suffix" align="inline-end" aria-hidden="true">{suffix}</InputGroupAddon>}
      {(control.required || invalid) && <AlertCircle className="tf-error-icon" aria-hidden="true" />}
      <FieldLabel htmlFor={id} className="tf-label">{label}{control.required && <span aria-hidden="true"> *</span>}{control.disabled ? <span className="tf-mode-label">不可用</span> : control.readOnly ? <span className="tf-mode-label">只读</span> : null}</FieldLabel>
    </div>
    {error ? <FieldError id={feedbackId} className="tf-feedback tf-error">{error}</FieldError>
      : description ? <FieldDescription id={feedbackId} className="tf-feedback">{description}</FieldDescription> : null}
  </Field>
}
