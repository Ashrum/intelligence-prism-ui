"use client"

import { useId, useState } from "react"
import { Card } from "@/components/coss/card"
import { Alert, AlertDescription } from "@/components/coss/alert"
import { Button } from "@/components/coss/button"
import { Field, FieldLabel } from "@/components/coss/field"
import { Textarea } from "@/components/coss/textarea"
import { NumberField, NumberFieldGroup, NumberFieldInput, NumberFieldIncrement, NumberFieldDecrement } from "@/components/coss/number-field"
import { Collapsible, CollapsibleTrigger, CollapsiblePanel } from "@/components/coss/collapsible"
import { AgentMetaLine, AgentStatus } from "./agent-visual-parts"
import { DraftMathPreview } from "./draft-math-preview"
import { PaperPreview, type PaperPreviewProps } from "./paper-preview"

export type ScoreReviewDraft = { score: number; reason: string }
export type ScoreReviewState =
  | { kind: "ready" }
  | { kind: "saving" }
  | { kind: "failed"; reason: string }
  | { kind: "saved"; score: number; auditUpdated?: boolean }
export type ScoreReviewRecord = { id: string; score: number; reason?: string; time?: string }
export type ScoreReviewProps = {
  studentName: string; questionLabel: string; examNumber?: string
  confidencePercent?: number | null; confidenceLabel?: string; progress?: { current: number; total: number }
  eyebrow?: string; answer?: string; locationNotice?: string
  paper?: PaperPreviewProps
  maxScore: number; step?: number
  score?: number | null; defaultScore?: number | null; onScoreChange?: (score: number | null) => void
  aiSuggestion?: { score: number; reason?: string; basis?: readonly string[] }
  /** Score at the start of editing. Defaults to a valid AI suggestion; absent baseline requires a reason. */
  baselineScore?: number; requireReasonOnChange?: boolean; showReason?: boolean
  reason?: string; defaultReason?: string; onReasonChange?: (reason: string) => void
  state?: ScoreReviewState; disabledReason?: string; history?: readonly ScoreReviewRecord[]
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
const known = (text?: string) => text?.trim() || "未提供"
const actionClass = "min-h-11 h-auto sm:h-auto max-w-full whitespace-normal"

/** UI draft only. Saving, receipts, audit and navigation remain host facts/intents. */
export function ScoreReview(props: ScoreReviewProps) {
  const id = useId()
  const [localScore, setLocalScore] = useState<number | null>(props.defaultScore ?? null)
  const [localReason, setLocalReason] = useState(props.defaultReason ?? "")
  const { maxScore, step = 1, state = { kind: "ready" }, aiSuggestion: ai, paper } = props
  const scaleValid = validScale(maxScore, step)
  const score = normalizeReviewScore(props.score === undefined ? localScore : props.score, maxScore, step)
  const reason = props.reason ?? localReason
  const locked = state.kind === "saving" || state.kind === "saved" || !!props.disabledReason || !scaleValid
  const aiValid = !!ai && Number.isFinite(ai.score) && ai.score >= 0 && ai.score <= maxScore && normalizeReviewScore(ai.score, maxScore, step) === ai.score
  const baseline = props.baselineScore ?? (aiValid ? ai?.score : undefined)
  const reasonRequired = !!props.requireReasonOnChange && (baseline === undefined || score !== baseline)
  const validation = !scaleValid ? "评分范围或步长无效，请由调用方核对。" : score === null ? "请填写教师最终评分。" : reasonRequired && !reason.trim() ? "调整分数后，请填写修改理由。" : undefined
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
  const panel = <Card render={<section aria-labelledby={`${id}-title`} />} className="min-w-0 gap-5 p-4" aria-busy={state.kind === "saving"} data-score-review-panel data-state={state.kind}>
    <header className="min-w-0 space-y-2">
      {props.eyebrow && <p className="text-ui-hint">{props.eyebrow}</p>}
      <h2 id={`${id}-title`} className="break-words text-block-title">{known(props.studentName)} · {known(props.questionLabel)}</h2>
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
          <NumberFieldGroup><NumberFieldDecrement aria-label={`减少 ${step} 分`} /><NumberFieldInput aria-describedby={`${id}-instructions ${id}-gate`} /><NumberFieldIncrement aria-label={`增加 ${step} 分`} /></NumberFieldGroup>
        </NumberField>
      </Field>
      <p id={`${id}-instructions`} className="text-ui-hint">接受 AI 建议，或调整分数后保存。人工修改将保留审计记录。</p>
      {(props.showReason || props.requireReasonOnChange) && <Field>
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
    {state.kind === "saved" && <Alert variant="success" role="status"><AlertDescription className="break-words text-ui-body">已保存 {Number.isFinite(state.score) ? state.score : "未提供"} 分{state.auditUpdated ? "，审计记录已更新" : "；审计记录状态未提供"}</AlertDescription></Alert>}
    <div className="flex min-w-0 flex-wrap gap-2" aria-label="评分操作">
      <Button type="button" variant="outline" className={actionClass} disabled={locked || !aiValid || !props.onAcceptAi} onClick={() => { if (!locked && aiValid && ai && props.onAcceptAi) { changeScore(ai.score); props.onAcceptAi(ai.score) } }}>接受 AI 建议</Button>
      {state.kind === "failed" ? <Button type="button" className={actionClass} aria-describedby={`${id}-gate`} disabled={!!block || !props.onRetry} onClick={() => submit(props.onRetry)}>重试保存</Button>
        : <Button type="button" className={actionClass} aria-describedby={`${id}-gate`} disabled={!!block || !props.onSave} onClick={() => submit(props.onSave)}>保存并处理下一份</Button>}
      {props.onPrev && <Button type="button" variant="outline" className={actionClass} disabled={state.kind === "saving" || !!props.disabledReason} onClick={() => { if (state.kind !== "saving" && !props.disabledReason) props.onPrev?.() }}>上一题</Button>}
      {props.onSkip && <Button type="button" variant="ghost" className={actionClass} disabled={state.kind === "saving" || !!props.disabledReason} onClick={() => { if (state.kind !== "saving" && !props.disabledReason) props.onSkip?.() }}>跳过</Button>}
    </div>
    {props.history && <Collapsible><CollapsibleTrigger render={<Button type="button" variant="outline" className={actionClass} />}>历史记录（{props.history.length}）</CollapsibleTrigger><CollapsiblePanel>
      {props.history.length ? <ol className="space-y-3 pt-3">{props.history.map(record => <li key={record.id} className="space-y-1"><p className="text-ui-body">过往评分 {Number.isFinite(record.score) ? record.score : "未提供"} 分</p><p className="break-words text-read-body">理由：{known(record.reason)}</p><AgentMetaLine>时间：{known(record.time)}</AgentMetaLine></li>)}</ol> : <p className="pt-3 text-ui-hint">暂无历史记录</p>}
    </CollapsiblePanel></Collapsible>}
  </Card>
  return <div className="@container min-w-0" data-score-review><div className={paper ? "grid min-w-0 items-start gap-5 @min-[960px]:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]" : "min-w-0"}>
    {paper && <div className="min-w-0" data-score-review-paper><PaperPreview {...paper} variant="canvas" /></div>}{panel}
  </div></div>
}
