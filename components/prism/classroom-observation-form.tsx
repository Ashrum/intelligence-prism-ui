"use client"

import "./classroom-observation-form.css"

import { useId, useRef, useState } from "react"
import type { FormEvent, KeyboardEvent } from "react"
import { Check, PencilLine } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { TextField } from "@/components/ui/text-field"
import type { TextFieldDensity } from "@/components/ui/text-field"

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

export function ClassroomObservationForm({ density: externalDensity }: { density?: TextFieldDensity }) {
  const id = useId()
  const [localDensity, setDensity] = useState<TextFieldDensity>("comfortable")
  const density = externalDensity ?? localDensity
  const [draft, setDraft] = useState<RecordDraft>(initial)
  const [touched, setTouched] = useState<Partial<Record<keyof Errors, boolean>>>({})
  const [errors, setErrors] = useState<Errors>({})
  const [applied, setApplied] = useState<RecordDraft | null>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const lessonRef = useRef<HTMLInputElement>(null)
  const composing = useRef(false)
  const titleError = touched.title ? errors.title : undefined
  const lessonError = touched.lesson ? errors.lesson : undefined
  const baseline = applied ?? initial
  const hasChanges = draft.title !== baseline.title || draft.lesson !== baseline.lesson || draft.note !== baseline.note

  const change = (field: keyof RecordDraft, value: string) => {
    setDraft(current => ({ ...current, [field]: value }))
    if (!composing.current) setErrors(validate({ ...draft, [field]: value }))
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
    const record = { ...draft, title: draft.title.trim(), lesson: String(Number(draft.lesson.trim().normalize("NFKC"))) }
    setDraft(record)
    setApplied(record)
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
  const restore = () => {
    if (!applied) return
    setDraft({ ...applied })
    setTouched({})
    setErrors({})
    titleRef.current?.focus()
  }

  return <section className="tf-form-demo" data-density={density} aria-labelledby={`${id}-title`}>
    <header className="tf-heading">
      <h3 id={`${id}-title`}>创建课堂观察记录</h3>
      <p>记录课堂中的表现与依据。内容仅在本页保留，刷新后恢复初始内容。</p>
    </header>

    <div className="tf-toolbar">
      <p>* 为必填项</p>
      {externalDensity === undefined && <div className="tf-density-choice">
        <span>字段密度</span>
        <SegmentedControl className="tf-density" label="字段密度" value={density}
          onValueChange={value => setDensity(value as TextFieldDensity)}
          items={[["comfortable", "舒适"], ["compact", "紧凑"]]} />
      </div>}
    </div>

    <form className="tf-form" noValidate onSubmit={apply} onKeyDown={guardComposition}
      onCompositionStart={() => { composing.current = true }}
      onCompositionEnd={event => {
        composing.current = false
        const target = event.target as HTMLInputElement | HTMLTextAreaElement
        if (target.name === "title" || target.name === "lesson" || target.name === "note") setErrors(validate({ ...draft, [target.name]: target.value }))
      }}>
      <div className="tf-fields">
        <TextField ref={titleRef} name="title" required className="tf-wide" label="记录标题" density={density}
          value={draft.title} error={titleError} description="例如：九年级数学课堂观察。"
          onChange={event => change("title", event.currentTarget.value)} onBlur={() => blur("title")} />
        <TextField ref={lessonRef} name="lesson" required inputMode="numeric" label="观察节次" density={density}
          prefix="第" suffix="节" value={draft.lesson} error={lessonError} description="输入 1–12 的整数，单位为节。"
          onChange={event => change("lesson", event.currentTarget.value)} onBlur={() => blur("lesson")} />
        <TextField label="证据来源 · 只读" value="课堂观察" readOnly density={density} />
        <TextField multiline name="note" rows={3} className="tf-wide" label="观察说明 · 选填" density={density}
          value={draft.note} description="可分行记录表现、成立条件与原文依据。"
          onChange={event => change("note", event.currentTarget.value)} />
        <TextField label="审核编号 · 不可编辑" value="完成审核后生成" disabled density={density} />
      </div>

      <div className="tf-actions">
        <Button type="submit">{applied && hasChanges ? "应用修改" : "应用记录"}</Button>
        <Button type="button" variant="ghost" onClick={applied && hasChanges ? restore : reset}>{applied && hasChanges ? "撤回修改" : "重置示例"}</Button>
        <p className="tf-status" data-pending={hasChanges || undefined} role="status">
          {hasChanges ? <><PencilLine aria-hidden="true" />{applied ? "有修改，尚未应用" : "尚未应用"}</> : applied ? <><Check aria-hidden="true" />已应用到本页</> : null}
        </p>
      </div>
    </form>

    {applied && <section className="tf-result" aria-labelledby={`${id}-result-title`}>
      <p className="tf-result-meta">已应用记录 · 第 {applied.lesson} 节 · 课堂观察</p>
      <h3 id={`${id}-result-title`}>{applied.title}</h3>
      {applied.note && <p className="tf-result-note">{applied.note}</p>}
    </section>}
  </section>
}
