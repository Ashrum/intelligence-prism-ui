"use client"

import { useId, useState, useEffect, useRef } from "react"
import type { KeyboardEvent, ReactNode } from "react"
import { Card } from "@/components/coss/card"
import { Alert, AlertDescription } from "@/components/coss/alert"
import { Button } from "@/components/coss/button"
import { Kbd } from "@/components/coss/kbd"
import { Field, FieldLabel } from "@/components/coss/field"
import { Textarea } from "@/components/coss/textarea"
import { NumberField, NumberFieldGroup, NumberFieldInput, NumberFieldIncrement, NumberFieldDecrement } from "@/components/coss/number-field"
import { Collapsible, CollapsibleTrigger, CollapsiblePanel } from "@/components/coss/collapsible"
import { RadioGroup, Radio } from "@/components/coss/radio-group"
import { Label } from "@/components/coss/label"
import { Check, CircleHelp, Dot } from "lucide-react"
import { AgentMetaLine, AgentStatus } from "./agent-visual-parts"
import { DraftMathPreview } from "./draft-math-preview"

export type ScoreReviewPoint = { id: string; label: string; maxScore: number; score: number | null; uncertain?: boolean }
export type ScoreReviewReasonOption = { id: string; label: string; isOther?: boolean }
export type ScoreReviewActionLabels = Partial<Record<"save" | "retry" | "accept" | "previous" | "skip" | "markUnanswered" | "clearUnanswered", string>>
export type ScoreReviewDraft = { score: number; reason: string; points?: readonly ScoreReviewPoint[]; reasonOptionId?: string | null; unanswered?: boolean }
export type ScoreReviewState =
  | { kind: "ready" }
  | { kind: "saving" }
  | { kind: "failed"; reason: string }
  | { kind: "saved"; score: number; auditUpdated?: boolean }
export type ScoreReviewRecord = { id: string; score: number; reason?: string; time?: string }
export type ScoreReviewProps = {
  /** Opt-in function-area modes; review retains the original presentation. */
  mode?: "review" | "confirm" | "edit" | "manual"
  showBasis?: boolean; showConfidence?: boolean; instruction?: ReactNode | false
  sectionsPlacement?: "top" | "bottom"
  sectionLabels?: Partial<Record<"answer" | "standardAnswer" | "history", string>>
  /** Host-supplied baseline text beside the total, e.g. 原 6 分. */
  scoreContext?: ReactNode
  onEdit?: () => void; onCancel?: () => void
  /** Compact changes spacing only; long sections use the existing coss Collapsible. */
  density?: "default" | "compact"; showIdentity?: boolean
  standardAnswer?: string
  /** Initial open state; remount by review identity to apply new defaults. */
  sectionsDefaultOpen?: Partial<Record<"answer" | "standardAnswer" | "history", boolean>>
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
  /** Controlled point drafts. A supplied array derives the total; empty/incomplete stays unknown. */
  points?: readonly ScoreReviewPoint[]; pointStep?: number; pointsReadOnly?: boolean
  onPointsChange?: (points: readonly ScoreReviewPoint[]) => void
  reasonOptions?: readonly ScoreReviewReasonOption[]; selectedReasonId?: string | null
  onReasonSelect?: (id: string | null) => void; requireReasonSelection?: boolean
  unanswered?: boolean; onUnansweredChange?: (unanswered: boolean) => void; unansweredDisabledReason?: string
  actionLabels?: ScoreReviewActionLabels; scoreReadOnly?: boolean; saveDisabledReason?: string
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
const actionClass = "max-w-full"

function pointStatus(point: ScoreReviewPoint) {
  if (point.uncertain) return "存疑"
  if (point.score === null || !Number.isFinite(point.score)) return "评分未提供"
  if (!Number.isFinite(point.maxScore) || point.score < 0 || point.score > point.maxScore) return "评分无效"
  return point.score === point.maxScore ? "满分" : "未得满分"
}

function pointTotal(points: readonly ScoreReviewPoint[], step: number): number | null {
  if (!points.length || new Set(points.map(point => point.id)).size !== points.length) return null
  if (points.some(point => !validScale(point.maxScore, step) || point.score === null || !Number.isFinite(point.score) || point.score < 0 || point.score > point.maxScore || normalizeReviewScore(point.score, point.maxScore, step) !== point.score)) return null
  const sum = Number(points.reduce((total, point) => total + point.score!, 0).toFixed(10))
  return Number.isFinite(sum) ? sum : null
}

/** UI draft only. Saving, receipts, audit and navigation remain host facts/intents. */
export function ScoreReview(props: ScoreReviewProps) {
  const id = useId()
  const compact = props.density === "compact"
  const mode = props.mode ?? "review"
  const confirming = mode === "confirm"
  const functionArea = mode !== "review" || props.sectionsPlacement === "bottom"
  const docked = compact && functionArea
  const instructionsVisible = props.instruction !== false
  const panelRef = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const previousQuestionId = useRef(props.questionId)
  useEffect(() => {
    const changed = previousQuestionId.current !== props.questionId
    previousQuestionId.current = props.questionId
    if (props.focusOnQuestionChange && changed && props.questionId !== undefined) (props.showIdentity === false ? panelRef.current : titleRef.current)?.focus()
  }, [props.questionId, props.focusOnQuestionChange, props.showIdentity])
  const [localScore, setLocalScore] = useState<number | null>(props.defaultScore ?? null)
  const [localReason, setLocalReason] = useState(props.defaultReason ?? "")
  const { maxScore, step = 1, state = { kind: "ready" }, aiSuggestion: ai } = props
  const scaleValid = validScale(maxScore, step)
  const pointStep = props.pointStep ?? step
  const total = props.points === undefined ? undefined : pointTotal(props.points, pointStep)
  const scoreInput = props.score === undefined ? localScore : props.score
  const score = confirming ? ai?.score ?? null : props.unanswered ? 0 : total !== undefined ? total : props.scoreReadOnly ? scoreInput : normalizeReviewScore(scoreInput, maxScore, step)
  const reason = props.reason ?? localReason
  const selectedReason = props.reasonOptions?.find(option => option.id === props.selectedReasonId)
  const effectiveReason = confirming ? ai?.reason ?? "" : selectedReason && !selectedReason.isOther ? selectedReason.label : reason
  const scoreReadOnly = confirming || !!props.scoreReadOnly || props.points !== undefined || !!props.unanswered
  const locked = state.kind === "saving" || state.kind === "saved" || !!props.disabledReason || !scaleValid
  const aiValid = !!ai && Number.isFinite(ai.score) && ai.score >= 0 && ai.score <= maxScore && normalizeReviewScore(ai.score, maxScore, step) === ai.score
  const baseline = props.baselineScore ?? (aiValid ? ai?.score : undefined)
  const reasonRequired = !!selectedReason?.isOther || !!props.requireReason || (!!props.requireReasonOnChange && (baseline === undefined || score !== baseline))
  const validation = !scaleValid ? "评分范围或步长无效，请由调用方核对。" : confirming ? (!aiValid ? "AI 建议分值未提供或无效，暂不可采纳。" : undefined) : score === null ? (props.points !== undefined ? "请完整填写有效的评分点得分。" : "请填写教师最终评分。") : !Number.isFinite(score) || score < 0 || score > maxScore ? (props.points !== undefined ? "评分点合计超出满分，请核对。" : "评分不在有效范围内，请核对。") : props.requireReasonSelection && !selectedReason ? "请选择修改理由。" : props.selectedReasonId && props.reasonOptions && !selectedReason ? "所选修改理由不在当前选项中，请重新选择。" : reasonRequired && !effectiveReason.trim() ? (selectedReason?.isOther ? "请填写其他修改理由。" : props.requireReason ? "请填写修改理由。" : "调整分数后，请填写修改理由。") : undefined
  const block = props.disabledReason || (state.kind === "saving" ? "正在保存，请等待处理结果。" : state.kind === "saved" ? "本次评分已保存，等待调用方切换题项。" : props.saveDisabledReason || validation)
  const confidence = props.confidencePercent
  const confidenceKnown = confidence !== null && confidence !== undefined && Number.isFinite(confidence) && confidence >= 0 && confidence <= 100
  function changeScore(value: number | null) {
    if (locked || scoreReadOnly) return
    const next = normalizeReviewScore(value, maxScore, step)
    if (props.score === undefined) setLocalScore(next)
    props.onScoreChange?.(next)
  }
  function submit(callback?: (draft: ScoreReviewDraft) => void) {
    if (!block && score !== null) callback?.({ score, reason: effectiveReason.trim(),
      ...(props.points !== undefined ? { points: props.points } : {}),
      ...(!confirming && props.reasonOptions !== undefined ? { reasonOptionId: props.selectedReasonId ?? null } : {}),
      ...(!confirming && props.unanswered !== undefined ? { unanswered: props.unanswered } : {}),
    })
  }
  function acceptAi() {
    if (confirming) { submit(state.kind === "failed" ? props.onRetry : props.onSave); return }
    if (mode !== "review") return
    if (!locked && !props.unanswered && aiValid && ai && props.onAcceptAi) { changeScore(ai.score); props.onAcceptAi(ai.score) }
  }
  function changeReason(value: string) {
    if (locked || (selectedReason && !selectedReason.isOther)) return
    if (props.reason === undefined) setLocalReason(value)
    props.onReasonChange?.(value)
  }
  function selectReason(value: unknown) {
    if (locked || !props.onReasonSelect) return
    const option = props.reasonOptions?.find(item => item.id === value)
    if (!option) return
    props.onReasonSelect(option.id)
    const nextReason = option.isOther ? "" : option.label
    if (props.reason === undefined) setLocalReason(nextReason)
    props.onReasonChange?.(nextReason)
  }
  const navigationLocked = state.kind === "saving" || !!props.disabledReason
  function navigate(callback?: () => void) { if (!navigationLocked) callback?.() }
  function handleShortcut(event: KeyboardEvent<HTMLDivElement>) {
    if (event.defaultPrevented || event.nativeEvent.isComposing || event.repeat) return
    if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && event.key === "Enter") {
      event.preventDefault(); submit(state.kind === "failed" ? props.onRetry : props.onSave)
    } else if (event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
      if (event.key.toLowerCase() === "a") { event.preventDefault(); acceptAi() }
      else if (mode === "review" && event.key === "ArrowLeft" && props.onPrev) { event.preventDefault(); navigate(props.onPrev) }
      else if (mode === "review" && event.key === "ArrowRight" && props.onSkip) { event.preventDefault(); navigate(props.onSkip) }
    }
  }
  const scoreField = <Field>
    <FieldLabel htmlFor={`${id}-score`}>{props.scoreContext !== undefined ? <>教师最终评分{scaleValid ? `（0–${maxScore} 分，步长 ${step}）` : ""} <span className="text-ui-hint text-muted-foreground">{props.scoreContext}</span></> : <>教师最终评分{scaleValid ? `（0–${maxScore} 分，步长 ${step}）` : ""}</>}</FieldLabel>
    <NumberField id={`${id}-score`} value={score} min={0} max={scaleValid ? maxScore : 0} step={scaleValid ? step : 1} snapOnStep disabled={locked} onValueChange={changeScore}>
      <NumberFieldGroup><NumberFieldDecrement aria-label={`减少 ${step} 分`} /><NumberFieldInput className="pointer-coarse:min-h-11" aria-describedby={instructionsVisible ? `${id}-instructions ${id}-gate` : `${id}-gate`} /><NumberFieldIncrement aria-label={`增加 ${step} 分`} /></NumberFieldGroup>
    </NumberField>
  </Field>
  const reasonField = <Field>
    <FieldLabel htmlFor={`${id}-reason`}>修改理由{reasonRequired ? "（必填）" : "（选填）"}</FieldLabel>
    <Textarea id={`${id}-reason`} value={effectiveReason} disabled={locked} required={reasonRequired} readOnly={props.reasonOptions !== undefined ? !!selectedReason && !selectedReason.isOther : undefined} aria-describedby={`${id}-gate`} onChange={event => changeReason(event.target.value)} />
  </Field>
  const identity = <header className={props.showIdentity === false ? "sr-only" : compact ? "flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1" : "min-w-0 space-y-2"}>
      {props.eyebrow && <p className="text-ui-hint">{props.eyebrow}</p>}
      <h2 ref={titleRef} tabIndex={props.focusOnQuestionChange ? -1 : undefined} id={`${id}-title`} className="break-words text-block-title">{known(props.studentName)} · {known(props.questionLabel)}</h2>
      {props.showConfidence === false ? <AgentMetaLine>考号 {known(props.examNumber)}</AgentMetaLine> : <AgentMetaLine>考号 {known(props.examNumber)} · {confidenceKnown ? `${props.confidenceLabel || "置信度"} ${confidence}%` : "置信度 未提供"}</AgentMetaLine>}
      {props.progress && <AgentMetaLine>第 {props.progress.current} / {props.progress.total} 题</AgentMetaLine>}
    </header>
  const answerSection = compact ? <Collapsible defaultOpen={props.sectionsDefaultOpen?.answer ?? false}>
      <CollapsibleTrigger render={<Button type="button" variant="outline" />}>{props.sectionLabels?.answer ?? "学生原始作答"}</CollapsibleTrigger>
      <CollapsiblePanel className="motion-reduce:transition-none"><div className="min-w-0 space-y-2 pt-2">
        {props.answer?.trim() ? <DraftMathPreview label="OCR 文本" value={props.answer} showHelp={false} notice={null} /> : <p className="text-read-body">OCR 文本未提供</p>}
        {props.locationNotice && <p className="break-words text-ui-hint">{props.locationNotice}</p>}
      </div></CollapsiblePanel>
    </Collapsible> : <section aria-label={props.sectionLabels?.answer ?? "学生原始作答"} className="min-w-0 space-y-2">
      <h3 className="text-item-title">{props.sectionLabels?.answer ?? "学生原始作答"}</h3>
      {props.answer?.trim() ? <DraftMathPreview label="OCR 文本" value={props.answer} showHelp={false} notice={null} /> : <p className="text-read-body">OCR 文本未提供</p>}
      {props.locationNotice && <p className="break-words text-ui-hint">{props.locationNotice}</p>}
    </section>
  const aiSection = (mode === "review" || confirming) && <Card className={compact ? "min-w-0 gap-1 p-3" : "min-w-0 gap-2 p-4"} render={<section aria-label="AI 建议评分" />}>
      <h3 className="text-item-title">AI 建议评分</h3>
      <p className="text-block-title">{ai && Number.isFinite(ai.score) ? ai.score : "未提供"} / {Number.isFinite(maxScore) && maxScore >= 0 ? maxScore : "未提供"} 分</p>
      <p className="break-words text-read-body">{known(ai?.reason)}</p>
      {props.showBasis !== false && <div className="space-y-1 text-ui-hint"><p>依据</p>{ai?.basis?.length ? <ul className="list-disc space-y-1 pl-5">{ai.basis.map((basis, index) => <li key={index} className="break-words">{known(basis)}</li>)}</ul> : <p>未提供</p>}</div>}
      {ai && !aiValid && <p className="text-ui-hint">AI 建议分值不符合当前范围或步长，暂不可接受。</p>}
    </Card>
  const scoringSection = <div className={compact ? "min-w-0 space-y-2" : "min-w-0 space-y-3"}>
      {scoreReadOnly || props.unanswered !== undefined || props.onUnansweredChange ? <>
        {props.points !== undefined && <section aria-label="评分点" className={compact ? "min-w-0 space-y-2" : "min-w-0 space-y-3"} data-score-review-points>
          <h3 className="text-block-title">评分点</h3>
          {!props.points.length && <p className="text-ui-hint">评分点未提供</p>}
          <ul className={compact ? "min-w-0 space-y-2" : "min-w-0 space-y-3"}>{props.points.map((point, index) => <li key={point.id} className="min-w-0 space-y-2">
            {confirming || props.pointsReadOnly || !props.onPointsChange ? <div className="flex min-w-0 flex-wrap items-start gap-2 text-ui-body">
              <span role="img" aria-label={pointStatus(point)}>{point.uncertain ? <CircleHelp className="size-4" aria-hidden="true" /> : pointStatus(point) === "满分" ? <Check className="size-4" aria-hidden="true" /> : <Dot className="size-4" aria-hidden="true" />}</span>
              <span className="min-w-0 flex-1 break-words">{point.label}</span><span className="tabular-nums">{point.score !== null && Number.isFinite(point.score) ? point.score : "未提供"} / {Number.isFinite(point.maxScore) && point.maxScore >= 0 ? point.maxScore : "未提供"} 分</span>
            </div> : <Field>
              <FieldLabel id={`${id}-point-label-${index}`} className="break-words">{point.label}（满分 {Number.isFinite(point.maxScore) && point.maxScore >= 0 ? point.maxScore : "未提供"} 分{point.uncertain ? "，存疑" : ""}）</FieldLabel>
              <NumberField id={`${id}-point-${index}`} value={point.score} min={0} max={validScale(point.maxScore, pointStep) ? point.maxScore : 0} step={validScale(point.maxScore, pointStep) ? pointStep : 1} snapOnStep disabled={locked || !!props.unanswered || !validScale(point.maxScore, pointStep)} onValueChange={value => {
                if (locked || props.unanswered || !validScale(point.maxScore, pointStep)) return
                props.onPointsChange?.(props.points!.map((item, pointIndex) => pointIndex === index ? { ...item, score: normalizeReviewScore(value, point.maxScore, pointStep) } : item))
              }}>
                <NumberFieldGroup><NumberFieldDecrement aria-label={`${point.label}减少 ${pointStep} 分`} /><NumberFieldInput aria-labelledby={`${id}-point-label-${index}`} aria-describedby={`${id}-gate`} /><NumberFieldIncrement aria-label={`${point.label}增加 ${pointStep} 分`} /></NumberFieldGroup>
              </NumberField>
            </Field>}
          </li>)}</ul>
        </section>}
        {confirming ? null : scoreReadOnly ? <section aria-label="教师最终评分" className="space-y-1" data-score-review-total>
          <h3 className="text-item-title">{props.scoreContext !== undefined ? <>{mode === "review" ? "教师最终评分" : "合计"}{props.points !== undefined ? " · 评分点合计" : ""} <span className="text-ui-hint text-muted-foreground">{props.scoreContext}</span></> : <>{mode === "review" ? "教师最终评分" : "合计"}{props.points !== undefined ? " · 评分点合计" : ""}</>}</h3>
          <p className="text-block-title" aria-describedby={`${id}-gate`}>{score !== null && Number.isFinite(score) ? score : "未提供"} / {scaleValid ? maxScore : "未提供"} 分{props.unanswered ? " · 未作答" : ""}</p>
        </section> : scoreField}
        {!confirming && (props.unanswered !== undefined || props.onUnansweredChange) && <div className="space-y-2">
          <Button type="button" variant="outline" className="max-w-full" aria-pressed={!!props.unanswered} aria-describedby={props.unansweredDisabledReason ? `${id}-unanswered-reason` : undefined} disabled={locked || !!props.unansweredDisabledReason || !props.onUnansweredChange} onClick={() => { if (!locked && !props.unansweredDisabledReason) props.onUnansweredChange?.(!props.unanswered) }}><span className="truncate">{props.unanswered ? props.actionLabels?.clearUnanswered ?? "撤销未作答" : props.actionLabels?.markUnanswered ?? "标记为未作答"}</span></Button>
          {props.unansweredDisabledReason && <p id={`${id}-unanswered-reason`} className="text-ui-hint">{props.unansweredDisabledReason}</p>}
        </div>}
      </> : scoreField}
      {props.quickScores && !scoreReadOnly && <div role="group" aria-label="快捷给分" className="flex flex-wrap gap-2">{filterQuickScores(props.quickScores, maxScore, step).map(value => <Button key={value} type="button" variant="outline" className="max-w-full" disabled={locked} aria-pressed={score === value} onClick={() => changeScore(value)}>{value === maxScore && value !== 0 ? `满分 ${value}` : `${value} 分`}</Button>)}</div>}
      {instructionsVisible && <p id={`${id}-instructions`} className="text-ui-hint">{props.instruction ?? (confirming ? "核对 AI 建议后采纳，或改分。" : mode !== "review" ? "核对评分后保存。" : compact ? "接受建议或改分保存；人工修改保留审计记录。" : "接受 AI 建议，或调整分数后保存。人工修改将保留审计记录。")}</p>}
      {confirming ? null : props.reasonOptions !== undefined ? <div className={compact ? "min-w-0 space-y-2" : "min-w-0 space-y-3"}>
        <p className="text-item-title">预置修改理由{props.requireReasonSelection ? "（必选）" : "（选填）"}</p>
        <RadioGroup aria-label="预置修改理由" aria-required={!!props.requireReasonSelection} aria-describedby={`${id}-gate`} value={props.selectedReasonId ?? null} disabled={locked || !props.onReasonSelect} onValueChange={selectReason}>
          {props.reasonOptions.map(option => <Label key={option.id} className="flex min-w-0 items-start gap-2"><Radio value={option.id} /><span className="min-w-0 break-words text-ui-body">{option.label}</span></Label>)}
        </RadioGroup>{reasonField}
      </div> : ((props.showReason ?? (mode !== "review")) || props.requireReasonOnChange || props.requireReason) && reasonField}
      <p id={`${id}-gate`} role="status" className="text-ui-hint">{block || (state.kind === "failed" && !props.onRetry ? "重试操作未提供。" : !props.onSave && state.kind === "ready" ? "保存操作未提供。" : mode === "review" ? "评分输入待提交。" : null)}</p>
    </div>
  const savingStatus = state.kind === "saving" && <AgentStatus running>保存中</AgentStatus>
  const failureStatus = state.kind === "failed" && <Alert variant="error"><AlertDescription className="break-words text-ui-body">保存失败：{known(state.reason)}</AlertDescription></Alert>
  const receipt = <div role="status" aria-live="polite" aria-atomic="true" className={!props.lastSaved && state.kind !== "saved" ? "sr-only" : undefined} data-score-review-receipt>
      {props.lastSaved ? <Alert variant="success" role={undefined}><AlertDescription className="break-words text-ui-body">{props.lastSaved.label?.trim() ? `${props.lastSaved.label}：` : ""}已保存 {Number.isFinite(props.lastSaved.score) ? props.lastSaved.score : "未提供"} 分，审计记录已更新</AlertDescription></Alert>
        : state.kind === "saved" && <Alert variant="success" role={undefined}><AlertDescription className="break-words text-ui-body">已保存 {Number.isFinite(state.score) ? state.score : "未提供"} 分{state.auditUpdated ? "，审计记录已更新" : "；审计记录状态未提供"}</AlertDescription></Alert>}
    </div>
  const actions = <div className="flex min-w-0 flex-wrap gap-2" aria-label="评分操作">
      <Button type="button" variant="outline" className={actionClass} disabled={locked || !!props.unanswered || !aiValid || !props.onAcceptAi} onClick={acceptAi}><span className="truncate">{props.actionLabels?.accept ?? "接受 AI 建议"}</span>{props.shortcuts && <Kbd>Alt+A</Kbd>}</Button>
      {state.kind === "failed" ? <Button type="button" className={actionClass} aria-describedby={`${id}-gate`} disabled={!!block || !props.onRetry} onClick={() => submit(props.onRetry)}><span className="truncate">{props.actionLabels?.retry ?? "重试保存"}</span>{props.shortcuts && <Kbd>Ctrl/⌘+Enter</Kbd>}</Button>
        : <Button type="button" className={actionClass} aria-describedby={`${id}-gate`} disabled={!!block || !props.onSave} onClick={() => submit(props.onSave)}><span className="truncate">{props.actionLabels?.save ?? "保存并处理下一份"}</span>{props.shortcuts && <Kbd>Ctrl/⌘+Enter</Kbd>}</Button>}
      {props.onPrev && <Button type="button" variant="outline" className={actionClass} disabled={state.kind === "saving" || !!props.disabledReason} onClick={() => navigate(props.onPrev)}><span className="truncate">{props.actionLabels?.previous ?? "上一题"}</span>{props.shortcuts && <Kbd>Alt+←</Kbd>}</Button>}
      {props.onSkip && <Button type="button" variant="ghost" className={actionClass} disabled={state.kind === "saving" || !!props.disabledReason} onClick={() => navigate(props.onSkip)}><span className="truncate">{props.actionLabels?.skip ?? "跳过"}</span>{props.shortcuts && <Kbd>Alt+→</Kbd>}</Button>}
    </div>
  const standardSection = props.standardAnswer !== undefined ? <>
      {compact ? <Collapsible defaultOpen={props.sectionsDefaultOpen?.standardAnswer ?? false}>
        <CollapsibleTrigger render={<Button type="button" variant="outline" />}>{props.sectionLabels?.standardAnswer ?? "标准答案"}</CollapsibleTrigger>
        <CollapsiblePanel className="motion-reduce:transition-none"><div className="pt-2"><DraftMathPreview label="标准答案" value={props.standardAnswer} showHelp={false} notice={null} /></div></CollapsiblePanel>
      </Collapsible> : <section aria-label={props.sectionLabels?.standardAnswer ?? "标准答案"} className="min-w-0 space-y-2"><h3 className="text-item-title">{props.sectionLabels?.standardAnswer ?? "标准答案"}</h3><DraftMathPreview label={props.sectionLabels?.standardAnswer ?? "标准答案"} value={props.standardAnswer} showHelp={false} notice={null} /></section>}
    </> : null
  const historySection = props.history && <Collapsible defaultOpen={props.sectionsDefaultOpen?.history}><CollapsibleTrigger render={<Button type="button" variant="outline" className={mode === "review" ? actionClass : undefined} />}><span className="truncate">{props.sectionLabels?.history ?? "历史记录"}（{props.history.length}）</span></CollapsibleTrigger><CollapsiblePanel className={compact ? "motion-reduce:transition-none" : undefined}>
      {props.history.length ? <ol className={compact ? "space-y-2 pt-2" : "space-y-3 pt-3"}>{props.history.map(record => <li key={record.id} className="space-y-1"><p className="text-ui-body">过往评分 {Number.isFinite(record.score) ? record.score : "未提供"} 分</p><p className="break-words text-read-body">理由：{known(record.reason)}</p><AgentMetaLine>时间：{known(record.time)}</AgentMetaLine></li>)}</ol> : <p className="pt-3 text-ui-hint">暂无历史记录</p>}
    </CollapsiblePanel></Collapsible>
  const modeActions = mode === "review" ? actions : <div className="flex min-w-0 flex-wrap justify-end gap-2" aria-label="评分操作">
    {confirming && <Button type="button" variant="outline" disabled={locked || !props.onEdit} onClick={() => { if (!locked) props.onEdit?.() }}>改分</Button>}
    {mode === "edit" && <Button type="button" variant="outline" disabled={state.kind === "saving" || !props.onCancel} onClick={() => { if (state.kind !== "saving") props.onCancel?.() }}>取消</Button>}
    {state.kind === "failed" ? <Button type="button" aria-describedby={`${id}-gate`} disabled={!!block || !props.onRetry} onClick={() => submit(props.onRetry)}>{props.actionLabels?.retry ?? (confirming ? "重试采纳" : "重试保存")}{props.shortcuts && <Kbd>Ctrl/⌘+Enter</Kbd>}</Button>
      : <Button type="button" aria-describedby={`${id}-gate`} disabled={!!block || !props.onSave} onClick={() => submit(props.onSave)}>{props.actionLabels?.save ?? (confirming ? "采纳" : "保存")}{props.shortcuts && <Kbd>Ctrl/⌘+Enter</Kbd>}</Button>}
  </div>
  const panel = <Card render={<section aria-labelledby={`${id}-title`} ref={props.showIdentity === false ? panelRef : undefined} tabIndex={props.showIdentity === false && props.focusOnQuestionChange ? -1 : undefined} />} className={compact ? "min-w-0 gap-3 p-3" : "min-w-0 gap-5 p-4"} aria-busy={state.kind === "saving"} data-score-review-panel data-state={state.kind}>
    {identity}
    {answerSection}
    {aiSection}
    {scoringSection}
    {savingStatus}
    {failureStatus}
    {receipt}
    {actions}
    {standardSection}
    {historySection}
  </Card>
  if (functionArea) return <div className={docked ? "@container flex h-full min-h-0 min-w-0 flex-col" : "@container min-w-0"} data-score-review data-score-review-mode={mode} onKeyDown={props.shortcuts ? handleShortcut : undefined}>
    <Card render={<section aria-labelledby={`${id}-title`} ref={props.showIdentity === false ? panelRef : undefined} tabIndex={props.showIdentity === false && props.focusOnQuestionChange ? -1 : undefined} />}
      className={docked ? "min-h-0 min-w-0 flex-1 overflow-hidden" : compact ? "min-w-0 gap-3 p-3" : "min-w-0 gap-5 p-4"} aria-busy={state.kind === "saving"} data-score-review-panel data-state={state.kind}>
      <div data-score-review-body className={docked ? "min-h-0 min-w-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3" : "min-w-0 space-y-3"}>
        {identity}
        {props.sectionsPlacement !== "bottom" && <>{answerSection}{standardSection}{historySection}</>}
        {aiSection}{scoringSection}{savingStatus}{failureStatus}{receipt}
        {props.sectionsPlacement === "bottom" && <div data-score-review-sections className="min-w-0 space-y-2">{standardSection}{answerSection}{historySection}</div>}
      </div>
      <footer data-score-review-footer className={docked ? "shrink-0 border-t p-3" : undefined}>{modeActions}</footer>
    </Card>
  </div>
  return <div className="@container min-w-0" data-score-review onKeyDown={props.shortcuts ? handleShortcut : undefined}><div className="min-w-0">
    {panel}
  </div></div>
}
