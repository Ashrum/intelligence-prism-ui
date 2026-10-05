"use client"

import { useEffect, useId, useRef, type ReactNode } from "react"
import { PencilLine } from "lucide-react"
import { Frame, FramePanel } from "@/components/coss/frame"
import { Input } from "@/components/coss/input"
import { Radio, RadioGroup } from "@/components/coss/radio-group"
import { Badge } from "./badge"
import { Button } from "./button"

export type ErrorCauseReviewValue = { category: string; explanation: string }
export type ErrorCauseReviewCategory = { id: string; label: ReactNode; isOther?: boolean }
export type ErrorCauseReviewState =
  | { kind: "ready" }
  | { kind: "saving"; message?: string }
  | { kind: "failed"; reason: string }
  | { kind: "saved"; message: string }
export type ErrorCauseReviewHistoryEntry = {
  id: string
  category: ReactNode
  explanation?: ReactNode
  operator?: ReactNode
  time?: { label: ReactNode; dateTime?: string }
  status?: ReactNode
}
export type ErrorCauseReviewProps = {
  density?: "default" | "compact"
  categories: ErrorCauseReviewCategory[]
  /** Committed fact. Draft changes never replace this value inside the component. */
  value: ErrorCauseReviewValue | null
  editing?: boolean
  draft?: ErrorCauseReviewValue
  state?: ErrorCauseReviewState
  disabledReason?: string
  saveDisabledReason?: string
  history?: ErrorCauseReviewHistoryEntry[]
  title?: string
  missingText?: string
  editLabel?: string
  hideEditAction?: boolean
  onEdit?: () => void
  onChange?: (value: ErrorCauseReviewValue) => void
  onSave?: (value: ErrorCauseReviewValue) => void
  onCancel?: () => void
}

/** Controlled facts and intentions only; the host owns draft, persistence and receipts. */
export function ErrorCauseReview({
  density = "default", categories, value, editing = false, draft, state = { kind: "ready" }, disabledReason,
  saveDisabledReason, history, title = "错因", missingText = "未提供", editLabel = "修改", hideEditAction = false,
  onEdit, onChange, onSave, onCancel,
}: ErrorCauseReviewProps) {
  const id = useId()
  const compact = density === "compact"
  const trigger = useRef<HTMLButtonElement>(null)
  const editor = useRef<HTMLDivElement>(null)
  const previousEditing = useRef(editing)
  const saving = state.kind === "saving"
  const editReason = hideEditAction ? undefined : disabledReason || (!onEdit ? "修改操作未提供" : undefined)
  const inputReason = disabledReason || (!draft ? "编辑草稿未提供" : !onChange ? "修改操作未提供" : undefined)
  const selected = categories.find(category => category.id === draft?.category)
  const categoryIssue = !selected ? "请选择有效的错因分类。" : undefined
  const explanationIssue = selected?.isOther && !draft?.explanation.trim() ? "选择其他时，请填写错因说明。" : undefined
  const saveReason = inputReason || saveDisabledReason || (!onSave ? "保存操作未提供" : undefined)
  const canChange = editing && !saving && !inputReason
  const canSave = editing && !saving && !saveReason && !categoryIssue && !explanationIssue
  const categoryLabel = value && (categories.find(category => category.id === value.category)?.label ?? (value.category || missingText))

  useEffect(() => {
    if (previousEditing.current === editing) return
    previousEditing.current = editing
    if (editing) {
      const checked = editor.current?.querySelector<HTMLButtonElement>('[role="radio"][aria-checked="true"]:not([disabled])')
      const first = editor.current?.querySelector<HTMLButtonElement>('[role="radio"]:not([disabled])')
      const target = checked ?? first
      target?.focus()
    } else trigger.current?.focus({ preventScroll: true })
  }, [editing])

  return <section aria-labelledby={`${id}-title`} aria-busy={saving || undefined} className={compact ? "min-w-0 space-y-2" : "min-w-0 space-y-3"} data-error-cause-review>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 id={`${id}-title`} className="text-block-title">{title}</h3>
      {!editing && !hideEditAction && <Button ref={trigger} variant="ghost" disabled={saving || !!editReason}
        aria-describedby={editReason ? `${id}-blocked` : undefined}
        onClick={() => { if (!saving && !editReason) onEdit?.() }}><PencilLine />{editLabel}</Button>}
    </div>
    {editing ? <div ref={editor} className={compact ? "min-w-0 space-y-2" : "min-w-0 space-y-3"}>
      <div className={compact ? "space-y-2" : "space-y-3"}>
        <p id={`${id}-category-label`} className="text-ui-action">错因分类 · 必选</p>
        <RadioGroup aria-labelledby={`${id}-category-label`} aria-required="true"
          aria-invalid={!!categoryIssue || undefined} aria-describedby={categoryIssue ? `${id}-category-issue` : undefined}
          value={draft?.category ?? ""} disabled={!canChange}
          onValueChange={category => {
            if (canChange && draft && typeof category === "string" && categories.some(item => item.id === category)) onChange?.({ ...draft, category })
          }}>
          {categories.map(category => <label key={category.id} className="flex min-w-0 items-start gap-2 text-ui-body"><Radio value={category.id} /><span className="min-w-0 wrap-anywhere">{category.label}</span></label>)}
        </RadioGroup>
        {categoryIssue && <p id={`${id}-category-issue`} className="text-ui-hint text-muted-foreground">{categoryIssue}</p>}
      </div>
      <div className="space-y-2">
        <label htmlFor={`${id}-explanation`} className="text-ui-action">说明{selected?.isOther ? " · 必填" : ""}</label>
        <Input id={`${id}-explanation`} value={draft?.explanation ?? ""} disabled={!canChange}
          required={selected?.isOther || undefined} aria-invalid={!!explanationIssue || undefined}
          aria-describedby={explanationIssue ? `${id}-explanation-issue` : undefined}
          onChange={event => { if (canChange && draft) onChange?.({ ...draft, explanation: event.target.value }) }} />
        {explanationIssue && <p id={`${id}-explanation-issue`} className="text-ui-hint text-muted-foreground">{explanationIssue}</p>}
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" disabled={saving || !onCancel} onClick={() => { if (!saving) onCancel?.() }}>取消</Button>
        <Button disabled={!canSave} aria-describedby={saveReason ? `${id}-blocked` : categoryIssue ? `${id}-category-issue` : explanationIssue ? `${id}-explanation-issue` : undefined}
          onClick={() => { if (canSave && draft) onSave?.({ ...draft }) }}>{state.kind === "failed" ? "重试保存" : "保存错因"}</Button>
      </div>
    </div> : <Frame><FramePanel className={compact ? "p-3" : undefined}><div className="min-w-0 space-y-2">
      {value ? <><Badge variant="outline" className="max-w-full whitespace-normal wrap-anywhere">{categoryLabel}</Badge><p className="wrap-anywhere whitespace-pre-wrap text-ui-body">{value.explanation.trim() ? value.explanation : missingText}</p></> : <p className="text-ui-body text-muted-foreground">{missingText}</p>}
    </div></FramePanel></Frame>}
    {(editing ? saveReason : editReason) && <p id={`${id}-blocked`} className="wrap-anywhere text-ui-hint text-muted-foreground">{editing ? saveReason : editReason}</p>}
    {state.kind === "saving" && <p role="status" className="text-ui-hint">{state.message ?? "正在保存错因…"}</p>}
    {state.kind === "failed" && <p role="alert" className="wrap-anywhere text-ui-hint text-destructive">保存失败：{state.reason}</p>}
    {state.kind === "saved" && <p role="status" className="wrap-anywhere text-ui-hint">{state.message}</p>}
    {!!history?.length && <section aria-labelledby={`${id}-history-title`} className={compact ? "space-y-2" : "space-y-3"}>
      <h4 id={`${id}-history-title`} className="text-item-title">修改记录</h4>
      <ul className={compact ? "space-y-2 text-ui-hint" : "space-y-3 text-ui-hint"}>{history.map(entry => <li key={entry.id} className="min-w-0 space-y-1 wrap-anywhere">
        <p>{entry.category} · {entry.explanation === "" ? missingText : entry.explanation ?? missingText}</p>
        {(entry.operator || entry.time) && <p className="text-ui-meta text-muted-foreground">{entry.operator}{entry.operator && entry.time ? " · " : null}{entry.time && <time dateTime={entry.time.dateTime}>{entry.time.label}</time>}</p>}
        {entry.status && <p>{entry.status}</p>}
      </li>)}</ul>
    </section>}
  </section>
}
