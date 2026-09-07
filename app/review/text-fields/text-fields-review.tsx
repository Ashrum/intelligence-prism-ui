"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import type { FormEvent, KeyboardEvent } from "react"
import { AlertCircle, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Textarea } from "@/components/ui/textarea"

type RecordDraft = { title: string; lesson: string; note: string }
type Errors = Partial<Record<"title" | "lesson", string>>
const initial: RecordDraft = { title: "", lesson: "3", note: "" }

function validate(value: RecordDraft): Errors {
  const errors: Errors = {}
  if (!value.title.trim()) errors.title = "请输入记录标题，不能只填写空格。"
  const lesson = value.lesson.trim().normalize("NFKC")
  if (!/^\d+$/.test(lesson) || Number(lesson) < 1 || Number(lesson) > 12) {
    errors.lesson = "请输入 1–12 的整数，例如第 3 节只需输入 3。"
  }
  return errors
}

function Feedback({ id, error, children }: { id: string; error?: string; children: React.ReactNode }) {
  return error
    ? <FieldError id={id} className="tf-feedback tf-error"><AlertCircle aria-hidden="true" />{error}</FieldError>
    : <FieldDescription id={id} className="tf-feedback">{children}</FieldDescription>
}

export function TextFieldsReview() {
  const [draft, setDraft] = useState<RecordDraft>(initial)
  const [touched, setTouched] = useState<Partial<Record<keyof Errors, boolean>>>({})
  const [errors, setErrors] = useState<Errors>({})
  const [applied, setApplied] = useState<RecordDraft | null>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const lessonRef = useRef<HTMLInputElement>(null)
  const noteRef = useRef<HTMLTextAreaElement>(null)
  const composing = useRef(false)
  const titleError = touched.title ? errors.title : undefined
  const lessonError = touched.lesson ? errors.lesson : undefined

  useEffect(() => {
    const resize = () => {
      const el = noteRef.current
      if (!el) return
      el.style.height = "auto"
      el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`
    }
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
  }, [draft.note])

  const change = (field: keyof RecordDraft, value: string) => {
    setDraft(current => ({ ...current, [field]: value }))
    if (!composing.current) setErrors(validate({ ...draft, [field]: value }))
    setApplied(null)
  }
  const blur = (field: keyof Errors) => {
    setTouched(current => ({ ...current, [field]: true }))
    setErrors(validate(draft))
  }
  const apply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (composing.current) return
    const nextErrors = validate(draft)
    setErrors(nextErrors)
    setTouched({ title: true, lesson: true })
    if (nextErrors.title || nextErrors.lesson) {
      requestAnimationFrame(() => (nextErrors.title ? titleRef : lessonRef).current?.focus())
      return
    }
    setApplied({ ...draft, title: draft.title.trim(), lesson: String(Number(draft.lesson.trim().normalize("NFKC"))) })
  }
  const guardComposition = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.target instanceof HTMLInputElement && event.key === "Enter" && (composing.current || event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229)) event.preventDefault()
  }
  const reset = () => {
    setDraft(initial)
    setTouched({})
    setErrors({})
    setApplied(null)
    titleRef.current?.focus()
  }

  return <article className="tf-page">
    <header className="tf-heading">
      <div className="tf-meta"><span>Text Fields · 中文场景候选</span><Link href="/benchmark">返回 Benchmark →</Link></div>
      <h1>创建课堂观察记录</h1>
      <p>记录课堂中的表现与依据。内容仅在本页保留，刷新后恢复初始内容。</p>
    </header>

    <form className="tf-form" noValidate onSubmit={apply} onKeyDown={guardComposition}
      onCompositionStart={() => { composing.current = true }}
      onCompositionEnd={event => {
        composing.current = false
        const target = event.target as HTMLInputElement | HTMLTextAreaElement
        if (target.name === "title" || target.name === "lesson" || target.name === "note") setErrors(validate({ ...draft, [target.name]: target.value }))
      }}>
      <div className="tf-fields">
        <Field className="tf-field tf-wide" data-invalid={Boolean(titleError) || undefined}>
          <FieldLabel htmlFor="tf-title" className="tf-label">记录标题<span>必填</span></FieldLabel>
          <Input ref={titleRef} id="tf-title" name="title" required className="tf-input" value={draft.title} placeholder="例如：九年级数学课堂观察"
            onChange={event => change("title", event.currentTarget.value)} onBlur={() => blur("title")}
            aria-invalid={Boolean(titleError)} aria-describedby="tf-title-feedback" />
          <Feedback id="tf-title-feedback" error={titleError}>建议包含年级、学科和观察内容。</Feedback>
        </Field>

        <Field className="tf-field" data-invalid={Boolean(lessonError) || undefined}>
          <FieldLabel htmlFor="tf-lesson" className="tf-label">观察节次<span>必填</span></FieldLabel>
          <InputGroup className="tf-input-group">
            <InputGroupAddon aria-hidden="true">第</InputGroupAddon>
            <InputGroupInput ref={lessonRef} id="tf-lesson" name="lesson" required inputMode="numeric" className="tf-group-control" value={draft.lesson}
              onChange={event => change("lesson", event.currentTarget.value)} onBlur={() => blur("lesson")}
              aria-invalid={Boolean(lessonError)} aria-describedby="tf-lesson-feedback" />
            <InputGroupAddon align="inline-end" aria-hidden="true">节</InputGroupAddon>
          </InputGroup>
          <Feedback id="tf-lesson-feedback" error={lessonError}>输入 1–12 的整数，单位为节。</Feedback>
        </Field>

        <Field className="tf-field">
          <FieldLabel htmlFor="tf-source" className="tf-label">证据来源<span>只读</span></FieldLabel>
          <Input id="tf-source" className="tf-input" value="课堂观察" readOnly aria-describedby="tf-source-feedback" />
          <Feedback id="tf-source-feedback">来源已确定，可选择并复制。</Feedback>
        </Field>

        <Field className="tf-field tf-wide">
          <FieldLabel htmlFor="tf-note" className="tf-label">观察说明<span>选填</span></FieldLabel>
          <Textarea ref={noteRef} id="tf-note" name="note" rows={3} className="tf-input tf-textarea" value={draft.note}
            onChange={event => change("note", event.currentTarget.value)} placeholder="记录学生的表现、成立条件与原文依据。" aria-describedby="tf-note-feedback" />
          <Feedback id="tf-note-feedback">可分行记录，内容增长时自然增高。</Feedback>
        </Field>

        <Field className="tf-field tf-wide" data-disabled="true">
          <FieldLabel htmlFor="tf-review-id" className="tf-label">审核编号<span>不可编辑</span></FieldLabel>
          <Input id="tf-review-id" className="tf-input" value="尚未生成" disabled aria-describedby="tf-review-id-feedback" />
          <Feedback id="tf-review-id-feedback">完成审核后生成，本页仅应用观察记录。</Feedback>
        </Field>
      </div>

      <div className="tf-actions">
        <Button type="submit">应用记录</Button>
        <Button type="button" variant="ghost" onClick={reset}>重置示例</Button>
        <p className="tf-status" role="status">{applied && <><Check aria-hidden="true" />已应用到本页</>}</p>
      </div>
    </form>

    {applied && <section className="tf-result" aria-labelledby="tf-result-title">
      <p className="tf-result-meta">第 {applied.lesson} 节 · 课堂观察</p>
      <h2 id="tf-result-title">{applied.title}</h2>
      {applied.note && <p className="tf-result-note">{applied.note}</p>}
    </section>}
  </article>
}
