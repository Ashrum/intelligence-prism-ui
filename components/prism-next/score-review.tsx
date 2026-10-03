"use client"

import { useId, useState, useEffect, useRef } from "react"
import type { KeyboardEvent } from "react"
import { Card } from "@/components/coss/card"
import { Alert, AlertDescription } from "@/components/coss/alert"
import { Button } from "@/components/coss/button"
import { Kbd } from "@/components/coss/kbd"
import { Field, FieldLabel } from "@/components/coss/field"
import { Textarea } from "@/components/coss/textarea"
import { NumberField, NumberFieldGroup, NumberFieldInput, NumberFieldIncrement, NumberFieldDecrement } from "@/components/coss/number-field"
import { Collapsible, CollapsibleTrigger, CollapsiblePanel } from "@/components/coss/collapsible"
import { AgentMetaLine, AgentStatus } from "./agent-visual-parts"
import { DraftMathPreview } from "./draft-math-preview"

export type ScoreReviewDraft = { score: number; reason: string }
export type ScoreReviewState =
  | { kind: "ready" }
  | { kind: "saving" }
  | { kind: "failed"; reason: string }
  | { kind: "saved"; score: number; auditUpdated?: boolean }
export type ScoreReviewRecord = { id: string; score: number; reason?: string; time?: string }
export type ScoreReviewProps = {
  studentName: string; questionLabel: string; examNumber?: string
  /** Stable review target identity; include student/version when relevant. No focus on initial mount. */
  questionId?: string; focusOnQuestionChange?: boolean
  confidencePercent?: number | null; confidenceLabel?: string; progress?: { current: number; total: number }
  eyebrow?: string; answer?: string; locationNotice?: string
  maxScore: number; step?: number
  quickScores?: readonly number[]; shortcuts?: boolean
  score?: number | null; defaultScore?: number | null; onScoreChange?: (score: number | null) => void
  aiSuggestion?: { score: number; reason?: string; basis?: readonly string[] }
  /** Score at the start of editing. Defaults to a valid AI suggestion; absent baseline requires a reason. */
  baselineScore?: number; requireReasonOnChange?: boolean; showReason?: boolean
  /** Require a non-whitespace reason for every save/retry, even at the baseline score. */
  requireReason?: boolean
  reason?: string; defaultReason?: string; onReasonChange?: (reason: string) => void
  state?: ScoreReviewState; disabledReason?: string; history?: readonly ScoreReviewRecord[]
  /** Host-confirmed save AND audit update. Host clears/replaces this one-shot receipt. */
  lastSaved?: { score: number; label?: string }
  onAcceptAi?: (score: number) => void; onSave?: (draft: ScoreReviewDraft) => void
  onRetry?: (draft: ScoreReviewDraft) => void; onPrev?: () => void; onSkip?: () => void
}

const validScale = (max: number, step: number) => Number.isFinite(max) && max >= 0 && Number.isFinite(step) && step > 0
/** Editing values only. Never normalize source AI scores or historical receipts. */
export function normalizeReviewScore(value: number | null, max: number, step = 1): number | null {
  if (value === null || !Number.isFinite(value) || !validScale(max, step)) return null
  const bounded = Math.min(max, Math.max(0, value))
  if (bounded === 0 || bounded === max) return bounded
  return Math.min(max, Math.max(0, Number((Math.round(bounded / step) * step).toFixed(10))))
}
/** Quick actions must be exact step multiples, including the maximum endpoint. */
export function filterQuickScores(values: readonly number[], max: number, step = 1) {
  if (!validScale(max, step)) return []
  return [...new Set(values.filter(value => Number.isFinite(value) && value >= 0 && value <= max && Math.abs(value / step - Math.round(value / step)) < 1e-8))]
}
const known = (text?: string) => text?.trim() || "未提供"
const actionClass = "min-h-11 h-auto sm:h-auto max-w-full whitespace-normal"

/** UI draft only. Saving, receipts, audit and navigation remain host facts/intents. */
export function ScoreReview(props: ScoreReviewProps) {
  const id = useId()
  const titleRef = useRef<HTMLHeadingElement>(null)
  const previousQuestionId = useRef(props.questionId)
  useEffect(() => {
    const changed = previousQuestionId.current !== props.questionId
    previousQuestionId.current = props.questionId
    if (props.focusOnQuestionChange && changed && props.questionId !== undefined) titleRef.current?.focus()
  }, [props.questionId, props.focusOnQuestionChange])
  const [localScore, setLocalScore] = useState<number | null>(props.defaultScore ?? null)
  const [localReason, setLocalReason] = useState(props.defaultReason ?? "")
  const { maxScore, step = 1, state = { kind: "ready" }, aiSuggestion: ai } = props
  const scaleValid = validScale(maxScore, step)
  const score = normalizeReviewScore(props.score === undefined ? localScore : props.score, maxScore, step)
  const reason = props.reason ?? localReason
  const locked = state.kind === "saving" || state.kind === "saved" || !!props.disabledReason || !scaleValid
  const aiValid = !!ai && Number.isFinite(ai.score) && ai.score >= 0 && ai.score <= maxScore && normalizeReviewScore(ai.score, maxScore, step) === ai.score
  const baseline = props.baselineScore ?? (aiValid ? ai?.score : undefined)
  const reasonRequired = !!props.requireReason || (!!props.requireReasonOnChange && (baseline === undefined || score !== baseline))
  const validation = !scaleValid ? "评分范围或步长无效，请由调用方核对。" : score === null ? "请填写教师最终评分。" : reasonRequired && !reason.trim() ? (props.requireReason ? "请填写修改理由。" : "调整分数后，请填写修改理由。") : undefined
  const block = props.disabledReason || (state.kind === "saving" ? "正在保存，请等待处理结果。" : state.kind === "saved" ? "本次评分已保存，等待调用方切换题项。" : validation)
  const confidence = props.confidencePercent
  const confidenceKnown = confidence !== null && confidence !== undefined && Number.isFinite(confidence) && confidence >= 0 && confidence <= 100
  function changeScore(value: number | null) {
    if (locked) return
    const next = normalizeReviewScore(value, maxScore, step)
    if (props.score === undefined) setLocalScore(next)
    props.onScoreChange?.(next)
  }
  function submit(callback?: (draft: ScoreReviewDraft) => void) {
    if (!locked && !validation && score !== null) callback?.({ score, reason: reason.trim() })
  }
  function acceptAi() {
    if (!locked && aiValid && ai && props.onAcceptAi) { changeScore(ai.score); props.onAcceptAi(ai.score) }
  }
  const navigationLocked = state.kind === "saving" || !!props.disabledReason
  function navigate(callback?: () => void) { if (!navigationLocked) callback?.() }
  function handleShortcut(event: KeyboardEvent<HTMLDivElement>) {
    if (event.defaultPrevented || event.nativeEvent.isComposing || event.repeat) return
    if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && event.key === "Enter") {
      event.preventDefault(); submit(state.kind === "failed" ? props.onRetry : props.onSave)
    } else if (event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
      if (event.key.toLowerCase() === "a") { event.preventDefault(); acceptAi() }
      else if (event.key === "ArrowLeft" && props.onPrev) { event.preventDefault(); navigate(props.onPrev) }
      else if (event.key === "ArrowRight" && props.onSkip) { event.preventDefault(); navigate(props.onSkip) }
    }
  }
  const panel = <Card render={<section aria-labelledby={`${id}-title`} />} className="min-w-0 gap-5 p-4" aria-busy={state.kind === "saving"} data-score-review-panel data-state={state.kind}>
    <header className="min-w-0 space-y-2">
      {props.eyebrow && <p className="text-ui-hint">{props.eyebrow}</p>}
      <h2 ref={titleRef} tabIndex={props.focusOnQuestionChange ? -1 : undefined} id={`${id}-title`} className="break-words text-block-title">{known(props.studentName)} · {known(props.questionLabel)}</h2>
      <AgentMetaLine>考号 {known(props.examNumber)} · {confidenceKnown ? `${props.confidenceLabel || "置信度"} ${confidence}%` : "置信度 未提供"}</AgentMetaLine>
      {props.progress && <AgentMetaLine>第 {props.progress.current} / {props.progress.total} 题</AgentMetaLine>}
    </header>
    <section aria-label="学生原始作答" className="min-w-0 space-y-2">
      <h3 className="text-item-title">学生原始作答</h3>
      {props.answer?.trim() ? <DraftMathPreview label="OCR 文本" value={props.answer} showHelp={false} notice={null} /> : <p className="text-read-body">OCR 文本未提供</p>}
      {props.locationNotice && <p className="break-words text-ui-hint">{props.locationNotice}</p>}
    </section>
    <Card className="min-w-0 gap-2 p-4" render={<section aria-label="AI 建议评分" />}>
      <h3 className="text-item-title">AI 建议评分</h3>
      <p className="text-block-title">{ai && Number.isFinite(ai.score) ? ai.score : "未提供"} / {Number.isFinite(maxScore) && maxScore >= 0 ? maxScore : "未提供"} 分</p>
      <p className="break-words text-read-body">{known(ai?.reason)}</p>
      <div className="space-y-1 text-ui-hint"><p>依据</p>{ai?.basis?.length ? <ul className="list-disc space-y-1 pl-5">{ai.basis.map((basis, index) => <li key={index} className="break-words">{known(basis)}</li>)}</ul> : <p>未提供</p>}</div>
      {ai && !aiValid && <p className="text-ui-hint">AI 建议分值不符合当前范围或步长，暂不可接受。</p>}
    </Card>
    <div className="min-w-0 space-y-3">
      <Field>
        <FieldLabel htmlFor={`${id}-score`}>教师最终评分{scaleValid ? `（0–${maxScore} 分，步长 ${step}）` : ""}</FieldLabel>
        <NumberField id={`${id}-score`} value={score} min={0} max={scaleValid ? maxScore : 0} step={scaleValid ? step : 1} snapOnStep disabled={locked} onValueChange={changeScore}>
          <NumberFieldGroup><NumberFieldDecrement aria-label={`减少 ${step} 分`} /><NumberFieldInput className="min-h-11 h-11 sm:h-11" aria-describedby={`${id}-instructions ${id}-gate`} /><NumberFieldIncrement aria-label={`增加 ${step} 分`} /></NumberFieldGroup>
        </NumberField>
      </Field>
      {props.quickScores && <div role="group" aria-label="快捷给分" className="flex flex-wrap gap-2">{filterQuickScores(props.quickScores, maxScore, step).map(value => <Button key={value} type="button" variant="outline" className="min-h-12 h-auto sm:h-auto whitespace-normal" disabled={locked} aria-pressed={score === value} onClick={() => changeScore(value)}>{value === maxScore && value !== 0 ? `满分 ${value}` : `${value} 分`}</Button>)}</div>}
      <p id={`${id}-instructions`} className="text-ui-hint">接受 AI 建议，或调整分数后保存。人工修改将保留审计记录。</p>
      {(props.showReason || props.requireReasonOnChange || props.requireReason) && <Field>
        <FieldLabel htmlFor={`${id}-reason`}>修改理由{reasonRequired ? "（必填）" : "（选填）"}</FieldLabel>
        <Textarea id={`${id}-reason`} value={reason} disabled={locked} required={reasonRequired} aria-describedby={`${id}-gate`} onChange={event => {
          if (locked) return
          if (props.reason === undefined) setLocalReason(event.target.value)
          props.onReasonChange?.(event.target.value)
        }} />
      </Field>}
      <p id={`${id}-gate`} role="status" className="text-ui-hint">{block || (state.kind === "failed" && !props.onRetry ? "重试操作未提供。" : !props.onSave && state.kind === "ready" ? "保存操作未提供。" : "评分输入待提交。")}</p>
    </div>
    {state.kind === "saving" && <AgentStatus running>保存中</AgentStatus>}
    {state.kind === "failed" && <Alert variant="error"><AlertDescription className="break-words text-ui-body">保存失败：{known(state.reason)}</AlertDescription></Alert>}
    <div role="status" aria-live="polite" aria-atomic="true" className={!props.lastSaved && state.kind !== "saved" ? "sr-only" : undefined} data-score-review-receipt>
      {props.lastSaved ? <Alert variant="success" role={undefined}><AlertDescription className="break-words text-ui-body">{props.lastSaved.label?.trim() ? `${props.lastSaved.label}：` : ""}已保存 {Number.isFinite(props.lastSaved.score) ? props.lastSaved.score : "未提供"} 分，审计记录已更新</AlertDescription></Alert>
        : state.kind === "saved" && <Alert variant="success" role={undefined}><AlertDescription className="break-words text-ui-body">已保存 {Number.isFinite(state.score) ? state.score : "未提供"} 分{state.auditUpdated ? "，审计记录已更新" : "；审计记录状态未提供"}</AlertDescription></Alert>}
    </div>
    <div className="flex min-w-0 flex-wrap gap-2" aria-label="评分操作">
      <Button type="button" variant="outline" className={actionClass} disabled={locked || !aiValid || !props.onAcceptAi} onClick={acceptAi}>接受 AI 建议{props.shortcuts && <Kbd>Alt+A</Kbd>}</Button>
      {state.kind === "failed" ? <Button type="button" className={actionClass} aria-describedby={`${id}-gate`} disabled={!!block || !props.onRetry} onClick={() => submit(props.onRetry)}>重试保存{props.shortcuts && <Kbd>Ctrl/⌘+Enter</Kbd>}</Button>
        : <Button type="button" className={actionClass} aria-describedby={`${id}-gate`} disabled={!!block || !props.onSave} onClick={() => submit(props.onSave)}>保存并处理下一份{props.shortcuts && <Kbd>Ctrl/⌘+Enter</Kbd>}</Button>}
      {props.onPrev && <Button type="button" variant="outline" className={actionClass} disabled={state.kind === "saving" || !!props.disabledReason} onClick={() => navigate(props.onPrev)}>上一题{props.shortcuts && <Kbd>Alt+←</Kbd>}</Button>}
      {props.onSkip && <Button type="button" variant="ghost" className={actionClass} disabled={state.kind === "saving" || !!props.disabledReason} onClick={() => navigate(props.onSkip)}>跳过{props.shortcuts && <Kbd>Alt+→</Kbd>}</Button>}
    </div>
    {props.history && <Collapsible><CollapsibleTrigger render={<Button type="button" variant="outline" className={actionClass} />}>历史记录（{props.history.length}）</CollapsibleTrigger><CollapsiblePanel>
      {props.history.length ? <ol className="space-y-3 pt-3">{props.history.map(record => <li key={record.id} className="space-y-1"><p className="text-ui-body">过往评分 {Number.isFinite(record.score) ? record.score : "未提供"} 分</p><p className="break-words text-read-body">理由：{known(record.reason)}</p><AgentMetaLine>时间：{known(record.time)}</AgentMetaLine></li>)}</ol> : <p className="pt-3 text-ui-hint">暂无历史记录</p>}
    </CollapsiblePanel></Collapsible>}
  </Card>
  return <div className="@container min-w-0" data-score-review onKeyDown={props.shortcuts ? handleShortcut : undefined}><div className="min-w-0">
    {panel}
  </div></div>
}
