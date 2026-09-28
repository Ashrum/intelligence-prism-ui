"use client"

import { useId, useLayoutEffect, useRef, useState } from "react"
import { Card } from "@/components/coss/card"
import { Field, FieldLabel } from "@/components/coss/field"
import { Textarea } from "@/components/coss/textarea"
import {
  createSubjectHistory, insertSubjectTool, reconcileSubjectHistory, recordSubjectEdit, stepSubjectHistory,
  subjectChangeIntent, subjectQuickTools, subjectSelection, subjectToolGroups,
  type AgentSubjectEditorIntent, type SubjectEdit, type SubjectFormulaMode, type SubjectHistory,
  type SubjectHistorySession, type SubjectSelection, type SubjectTool,
} from "@/lib/prism-next/subject-editor"
import { Button } from "./button"
import { DraftMathPreview } from "./draft-math-preview"
import { RecordDetails, type AgentRecordViewProps } from "./agent-record-parts"

export type { AgentSubjectEditorIntent, SubjectFormulaMode } from "@/lib/prism-next/subject-editor"
export type AgentSubjectEditorProps = AgentRecordViewProps & {
  title?: string
  /** Opaque fragment identity and base token; never printed in the interface. */
  formulaId: string
  baseVersion: string
  location: string
  baseVersionLabel: string
  versionLabel?: string
  /** One exact formula expression; delimiters belong to the surrounding text. */
  value: string
  formulaMode?: SubjectFormulaMode
  readOnlyReason?: string
  applyDisabledReason?: string
  onIntent?: (intent: AgentSubjectEditorIntent) => void
  onBack?: () => void
}

function SubjectToolbar({ label, tools, disabled, describedBy, onInsert }: {
  label: string; tools: readonly SubjectTool[]; disabled: boolean; describedBy?: string; onInsert: (tool: SubjectTool) => void
}) {
  const [active, setActive] = useState(0)
  return <div className="min-w-0 space-y-2">
    <h4 className="text-ui-action">{label}</h4>
    <div role="toolbar" aria-label={label} aria-describedby={describedBy} className="flex flex-wrap gap-2"
      onKeyDown={event => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return
        const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")]
        const index = buttons.indexOf(event.target as HTMLButtonElement)
        if (index < 0) return
        event.preventDefault()
        const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length
        setActive(next); buttons[next]?.focus()
      }}>
      {tools.map((item, index) => <Button key={item.id} type="button" variant="outline" size="navigation" disabled={disabled}
        tabIndex={index === active ? 0 : -1} onFocus={() => setActive(index)} aria-label={`插入${item.label}`}
        onClick={() => { if (!disabled) onInsert(item) }}>{item.label}</Button>)}
    </div>
  </div>
}

export function AgentSubjectEditor({ title = "数学公式", formulaId, location, value, baseVersion, baseVersionLabel, versionLabel,
  formulaMode = "inline", view = "inline", density = "default", readOnlyReason, applyDisabledReason,
  onIntent, onExpand, onBack, details }: AgentSubjectEditorProps) {
  const id = useId(), workspace = view === "workspace", compact = density === "compact"
  const scope = JSON.stringify([formulaId, baseVersion, formulaMode])
  const [session, setSession] = useState<SubjectHistorySession>(() => ({ scope, history: createSubjectHistory(value) }))
  const current = reconcileSubjectHistory(session, scope, value)
  // Reset before children render: old-object undo must never be briefly actionable.
  if (current !== session) setSession(current)
  const textarea = useRef<HTMLTextAreaElement>(null)
  const caret = useRef<{ scope: string; value: string; selection: SubjectSelection } | null>(null)
  const requestedFocus = useRef<{ scope: string; edit: SubjectEdit } | null>(null)
  const composing = useRef(false)
  const identityReason = !formulaId.trim() || !baseVersion.trim() || !location.trim() ? "公式位置或基准版本未确认，暂不可编辑。" : undefined
  const reason = readOnlyReason || identityReason || (!onIntent ? "当前公式只读。" : undefined)
  const applyReason = reason || applyDisabledReason
  const target = { formulaId, baseVersion, formulaMode }
  const selection = () => caret.current?.scope === scope && caret.current.value === value ? caret.current.selection : subjectSelection(value)

  useLayoutEffect(() => {
    const request = requestedFocus.current
    if (!request) return
    // A rejected request cannot steal focus when unrelated external text arrives.
    requestedFocus.current = null
    if (request.scope !== scope || request.edit.value !== value) return
    textarea.current?.focus({ preventScroll: true })
    textarea.current?.setSelectionRange(request.edit.selection.start, request.edit.selection.end)
    caret.current = { scope, value, selection: request.edit.selection }
  }, [scope, value, session.pending])

  function requestEdit(next: SubjectEdit, history: SubjectHistory, restoreFocus = false) {
    if (reason || !onIntent || composing.current || next.value === value) return
    requestedFocus.current = restoreFocus ? { scope, edit: next } : null
    setSession({ scope, history: current.history, pending: history })
    onIntent(subjectChangeIntent(target, next))
  }
  function insert(item: SubjectTool) {
    const before = selection(), next = insertSubjectTool(value, item, before)
    requestEdit(next, recordSubjectEdit(current.history, next, before), true)
  }
  function historyStep(direction: "undo" | "redo") {
    const next = stepSubjectHistory(current.history, direction)
    if (next !== current.history) requestEdit(next.present, next, true)
  }
  function rememberSelection(element: HTMLTextAreaElement) {
    caret.current = { scope, value: element.value, selection: { start: element.selectionStart, end: element.selectionEnd } }
  }

  return <Card data-subject-editor-view={view} data-subject-editor-density={density} className={`min-w-0 ${compact ? "gap-3 p-3" : "gap-4 p-4"}`}>
    <header className="min-w-0 space-y-2">
      <h3 className="break-words text-block-title">{title}</h3>
      <p className="text-ui-body break-words">{location || "公式位置未确认"}</p>
      <p className="text-ui-hint break-words">{formulaMode === "block" ? "行间公式" : "行内公式"} · 当前草稿{versionLabel && ` ${versionLabel}`}</p>
      <p className="text-ui-hint break-words">基准版本：{baseVersionLabel || "未确认"}</p>
      {reason && <p id={`${id}-readonly`} className="text-ui-hint break-words">{reason}</p>}
    </header>
    <div className={`min-w-0 ${compact ? "space-y-3" : "space-y-4"}`}>
      {(workspace ? subjectToolGroups : [{ label: "常用插入", tools: subjectQuickTools }]).map(group => <SubjectToolbar key={group.label}
        {...group} disabled={!!reason} describedBy={reason ? `${id}-readonly` : undefined} onInsert={insert} />)}
      {workspace && <div role="group" aria-label="本次公式编辑历史" className="flex flex-wrap gap-2">
        <Button type="button" size="navigation" variant="outline" disabled={!!reason || !current.history.past.length}
          onClick={() => historyStep("undo")}>撤销</Button>
        <Button type="button" size="navigation" variant="outline" disabled={!!reason || !current.history.future.length}
          onClick={() => historyStep("redo")}>重做</Button>
      </div>}
      <Field className="min-w-0 w-full max-w-[40em]">
        <FieldLabel htmlFor={`${id}-source`}>公式原文</FieldLabel>
        <Textarea ref={textarea} id={`${id}-source`} value={value} rows={workspace ? 6 : 3} readOnly={!!reason}
          aria-describedby={[`${id}-boundary`, `${id}-preview`, reason && `${id}-readonly`].filter(Boolean).join(" ")}
          className="text-read-body" onSelect={event => rememberSelection(event.currentTarget)} onBlur={event => rememberSelection(event.currentTarget)}
          onCompositionStart={() => { composing.current = true }} onCompositionEnd={() => { composing.current = false }}
          onKeyDown={event => {
            if (event.nativeEvent.isComposing || composing.current || !(event.metaKey || event.ctrlKey) || event.altKey) return
            const key = event.key.toLowerCase()
            if (key === "z" || (key === "y" && !event.shiftKey)) {
              event.preventDefault(); historyStep(key === "y" || event.shiftKey ? "redo" : "undo")
            }
          }}
          onChange={event => {
            if (reason || !onIntent) return
            const next = { value: event.target.value, selection: { start: event.target.selectionStart, end: event.target.selectionEnd } }
            // Composition text remains controlled; undo/toolbar shortcuts alone are suspended.
            setSession({ scope, history: current.history, pending: recordSubjectEdit(current.history, next, selection()) })
            onIntent(subjectChangeIntent(target, next))
            rememberSelection(event.target)
          }} />
      </Field>
      <div id={`${id}-preview`} className="min-w-0 max-w-[40em]">
        <DraftMathPreview value={value} label="当前公式预览" formulaMode={formulaMode} notice={null} showHelp={false}
          onLocateError={range => { textarea.current?.focus(); textarea.current?.setSelectionRange(range.start, range.end) }} />
      </div>
    </div>
    <p id={`${id}-boundary`} className="text-ui-hint text-muted-foreground">仅排版，不校验数学结论。确认后替换原内容，保存请在原内容中完成。</p>
    <RecordDetails>{details}</RecordDetails>
    <footer className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {onIntent && <>
          <Button type="button" size="navigation" disabled={!!applyReason} aria-describedby={applyReason ? reason ? `${id}-readonly` : `${id}-apply` : `${id}-boundary`}
            onClick={() => { if (!applyReason) onIntent({ ...target, type: "apply", value }) }}>确认替换</Button>
          <Button type="button" size="navigation" variant="ghost" onClick={() => onIntent({ ...target, type: "cancel" })}>取消编辑</Button>
        </>}
        {!workspace && onExpand && <Button type="button" size="navigation" variant="outline" onClick={event => onExpand(event.currentTarget)}>展开公式编辑</Button>}
        {workspace && onBack && <Button type="button" size="navigation" variant="ghost" onClick={onBack}>返回原位置</Button>}
      </div>
      {!reason && applyDisabledReason && <p id={`${id}-apply`} className="text-ui-hint break-words">{applyDisabledReason}</p>}
    </footer>
  </Card>
}
