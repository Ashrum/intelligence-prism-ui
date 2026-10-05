"use client"
import { useId, type ReactNode } from "react"
import { ArrowUp, ArrowDown, ChevronsDown, Sparkles } from "lucide-react"
import { Button } from "./button"
import { Badge } from "./badge"
import { Frame, FrameHeader, FrameFooter } from "@/components/coss/frame"
import { ScrollArea } from "@/components/coss/scroll-area"
import { ReviewTip as Tip, ReviewConfirmation as Confirmation, ReviewMeter as ScoreMeter, reviewToneClass, type ReviewTone } from "./review-parts"
import "./review-workspace.css"
export type QuestionInspectorProps = {
  bodyOnly?: boolean
  density?: "default" | "compact"
  showEvidence?: boolean; showConfidence?: boolean; showKnowledge?: boolean; showComparison?: boolean
  scoreSource?: ReactNode; afterScore?: ReactNode; afterPoints?: ReactNode; footer?: ReactNode
  title: string; status: ReactNode
  navigation: { previous: boolean; next: boolean; nextWrong: boolean }
  score: { value: number | null; max: number; text: ReactNode; denominator: ReactNode; judgement: ReactNode }
  points: { id: string; label: ReactNode; value: ReactNode; reason?: ReactNode; tone: ReviewTone; status: string }[]
  pointsEmptyText?: string
  evidence: ReactNode; confidence?: ReactNode; knowledge: ReactNode[]
  comparison: { id: string; label: ReactNode; text: ReactNode; value: number | null; max: number; ariaLabel: string }[]
  comparisonEmptyText?: string
  actions: { id: string; label: ReactNode; primary?: boolean; disabled?: boolean; disabledReason?: string }[]
  extraLink?: ReactNode; onStep: (delta: number) => void; onWrong: () => void; onIntent?: (id: string) => void
}
/** All judgments and rubric facts are external; buttons emit intentions only. */
export function QuestionInspector({ bodyOnly = false, density = "default", showEvidence = true, showConfidence = true, showKnowledge = true, showComparison = true, scoreSource, afterScore, afterPoints, footer, title, status, navigation, score, points, pointsEmptyText, evidence, confidence, knowledge, comparison, comparisonEmptyText, actions, extraLink, onStep, onWrong, onIntent }: QuestionInspectorProps) {
  const compact = density === "compact"
  const hasFooter = footer !== undefined && footer !== null && footer !== false
  const evidenceBody = showEvidence && <section className="overflow-hidden rounded-lg bg-muted" aria-label="AI 判定依据"><div data-ai-source className="h-0.5" style={{ background: 'var(--brand-ai-gradient)' }} /><div className={compact ? "space-y-2 p-3" : "space-y-3 p-4"}><h3 className="flex items-center gap-2 text-block-title"><Sparkles className="size-4" aria-hidden="true" />AI 判定依据</h3><p className="text-ui-body">{evidence}</p>{showConfidence && <p className="text-ui-meta text-muted-foreground">置信度：{confidence ?? "未提供"}</p>}</div></section>
  const body = <div className={compact ? "space-y-4 px-4 py-3" : "space-y-7 px-4 py-5"}>
        {scoreSource === undefined && afterScore === undefined ? <section aria-label="本题得分" className={compact ? "space-y-2" : "space-y-3"}><div className="flex items-baseline gap-1"><span className="text-score-display">{score.text}</span><span className="text-ui-body text-muted-foreground">{score.denominator}</span><Badge className="ml-auto" variant="outline">{score.judgement}</Badge></div>{score.value !== null && Number.isFinite(score.value) && <ScoreMeter value={score.value} max={score.max} label="本题得分" />}</section> : <section aria-label="本题得分" className={compact ? "space-y-2" : "space-y-3"}>
          <div className="flex flex-wrap items-baseline gap-1"><span className="text-score-display">{score.text}</span><span className="text-ui-body text-muted-foreground">{score.denominator}</span><div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-2"><Badge variant="outline">{score.judgement}</Badge>{scoreSource !== undefined && <div data-slot="question-inspector-score-source" className="min-w-0 text-ui-meta wrap-anywhere">{scoreSource}</div>}</div></div>
          {afterScore !== undefined && <div data-slot="question-inspector-after-score" className="text-ui-meta text-muted-foreground wrap-anywhere">{afterScore}</div>}
          {score.value !== null && Number.isFinite(score.value) && <ScoreMeter value={score.value} max={score.max} label="本题得分" />}
        </section>}
        <section className={compact ? "space-y-2" : "space-y-3"} aria-label="评分点"><h3 className="text-block-title">评分点</h3>{points.length === 0 && pointsEmptyText !== undefined && <p className="text-ui-hint text-muted-foreground">{pointsEmptyText}</p>}<ul className={compact ? "space-y-2 text-ui-body" : "space-y-4 text-ui-body"}>{points.map((point, i) => <li key={point.id} className="grid grid-cols-[0.5rem_minmax(0,1fr)_3rem] items-baseline gap-x-3 gap-y-1"><span className={`size-2 shrink-0 rounded-full ${reviewToneClass[point.tone]}`} aria-label={point.status} /><span><span className="mr-2 text-ui-meta text-muted-foreground">{i + 1}.</span>{point.label}</span><span className="text-right tabular-nums">{point.value}</span>{point.reason && <p className="col-span-2 col-start-2 text-ui-meta text-muted-foreground">{point.reason}</p>}</li>)}</ul></section>
        {afterPoints === undefined ? evidenceBody : <>{afterPoints}{evidenceBody}</>}
        {showKnowledge && <section className="space-y-2"><h3 className="text-block-title">知识点</h3>{knowledge.map((item, index) => <Badge key={index} variant="outline" className="whitespace-normal">{item}</Badge>)}</section>}
      </div>
  const comparisonBody = showComparison && <FrameFooter className={compact ? "space-y-2 px-4 py-3" : "space-y-3"}><h3 className="text-block-title">班级对比{extraLink}</h3>{comparison.length === 0 && comparisonEmptyText !== undefined && <p className="text-ui-hint text-muted-foreground">{comparisonEmptyText}</p>}<div className={compact ? "grid grid-cols-2 gap-3" : "grid grid-cols-2 gap-4"}>{comparison.map(item => <div key={item.id} className="space-y-2"><p className="text-ui-meta text-muted-foreground">{item.label}</p><p className="text-block-title tabular-nums">{item.text}</p>{item.value !== null && Number.isFinite(item.value) && <ScoreMeter value={item.value} max={item.max} label={item.ariaLabel} />}</div>)}</div></FrameFooter>
  const customFooter = hasFooter && <footer data-slot="question-inspector-footer" className={compact ? "flex shrink-0 flex-wrap items-center gap-2 border-t px-4 py-3" : "flex shrink-0 flex-wrap items-center gap-3 border-t p-4"}>{footer}</footer>
  if (bodyOnly) return hasFooter ? <div data-question-inspector-body className="flex h-full min-h-0 flex-col overflow-hidden"><div className="min-h-0 flex-1 overflow-hidden"><ScrollArea overscrollContain scrollFade>{body}{comparisonBody}</ScrollArea></div>{customFooter}</div> : <>{body}{comparisonBody}</>
  return <aside aria-label="本题检查器" data-review-inspector className="d1-inspector min-h-0 bg-background">
    <FrameHeader className="d1-inspector-header flex-row items-center justify-between gap-1 px-2 py-0"><h2 className="min-w-0 truncate text-block-title" title={title}>{title}</h2><Confirmation>{status}</Confirmation><div className="flex shrink-0"><Tip label="上一题" keys="↑"><Button variant="ghost" size="icon" aria-label="上一题" disabled={!navigation.previous} onClick={() => onStep(-1)}><ArrowUp /></Button></Tip><Tip label="下一题" keys="↓"><Button variant="ghost" size="icon" aria-label="下一题" disabled={!navigation.next} onClick={() => onStep(1)}><ArrowDown /></Button></Tip><Tip label="下一道错题" keys="N"><Button variant="ghost" size="icon" aria-label="下一道错题" disabled={!navigation.nextWrong} onClick={onWrong}><ChevronsDown /></Button></Tip></div></FrameHeader>
    <div className="min-h-0 overflow-hidden px-4 pb-4"><ScrollArea overscrollContain scrollFade><Frame>
      {body}{comparisonBody}
    </Frame></ScrollArea></div>
    {hasFooter ? customFooter : actions.some(action => (action.disabled || !onIntent) && action.disabledReason) ? <QuestionInspectorDisabledActions actions={actions} onIntent={onIntent} compact={compact} /> : <footer className={compact ? "flex gap-2 border-t px-4 py-3" : "flex gap-3 border-t p-4"}>{actions.map(action => <Button key={action.id} variant={action.primary ? undefined : "outline"} className="flex-1" disabled={action.disabled || !onIntent || undefined} onClick={() => { if (!action.disabled) onIntent?.(action.id) }}>{action.label}</Button>)}</footer>}
  </aside>
}

/** Allocate description IDs only for the opt-in footer, preserving legacy SSR IDs. */
function QuestionInspectorDisabledActions({ actions, onIntent, compact = false }: Pick<QuestionInspectorProps, "actions" | "onIntent"> & { compact?: boolean }) {
  const reasonPrefix = useId()
  const hasReason = (action: QuestionInspectorProps['actions'][number]) => Boolean((action.disabled || !onIntent) && action.disabledReason)
  const actionButtons = actions.map((action, index) => <Button key={action.id} variant={action.primary ? undefined : "outline"} className="flex-1" disabled={action.disabled || !onIntent || undefined} aria-describedby={hasReason(action) ? `${reasonPrefix}-reason-${index}` : undefined} onClick={() => { if (!action.disabled) onIntent?.(action.id) }}>{action.label}</Button>)
  return <footer className={compact ? "space-y-2 border-t px-4 py-3" : "space-y-2 border-t p-4"}><div className={compact ? "flex gap-2" : "flex gap-3"}>{actionButtons}</div><div className="space-y-1">{actions.map((action, index) => hasReason(action) && <p key={action.id} id={`${reasonPrefix}-reason-${index}`} className="text-ui-hint text-muted-foreground wrap-anywhere">{action.label}：{action.disabledReason}</p>)}</div></footer>
}
