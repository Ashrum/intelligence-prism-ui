"use client"

import { useId, type ReactNode } from "react"
import { ArrowRight, Sparkles } from "lucide-react"
import { Frame, FrameFooter, FrameHeader, FramePanel } from "@/components/coss/frame"
import { cn } from "@/lib/utils"
import { Badge } from "./badge"
import { Button } from "./button"
import { ReviewConfirmation, ReviewMeter } from "./review-parts"

export type StudentPaperReportCounts = {
  full?: number | null
  partial?: number | null
  wrong?: number | null
  unanswered?: number | null
  unprovided?: number | null
}

export type StudentPaperReportCause = {
  id: string
  category: ReactNode
  count?: number | null
  lost?: number | null
  /** The host declares the distribution scale and accessible description. */
  meter?: { value: number; max: number; label: string }
}

export type StudentPaperReportProps = {
  density?: "default" | "compact"
  pendingEmphasis?: "default" | "strong"
  title?: ReactNode
  studentName?: ReactNode
  status?: ReactNode
  score?: number | null
  maxScore?: number | null
  counts?: StudentPaperReportCounts
  complete?: boolean
  provided?: number | null
  coverageText?: ReactNode
  causes?: readonly StudentPaperReportCause[]
  totalLost?: number | null
  missingCauses?: number | null
  unattributedLost?: number | null
  causesEmptyText?: ReactNode
  analysis?: ReactNode
  analysisSource?: ReactNode
  pendingCount?: number | null
  pendingText?: ReactNode
  onFirstPending?: () => void
  firstPendingDisabledReason?: string
  footer?: ReactNode
  className?: string
}

const judgements = [
  { key: "full", label: "全对", variant: "success" },
  { key: "partial", label: "部分对", variant: "warning" },
  { key: "wrong", label: "错", variant: "error" },
  { key: "unanswered", label: "未作答", variant: "outline" },
] as const

function knownNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
}
function knownCount(value: number | null | undefined): value is number {
  return knownNumber(value) && Number.isInteger(value)
}
function displayNumber(value: number | null | undefined) {
  return knownNumber(value) ? value : "未提供"
}
function displayCount(value: number | null | undefined) {
  return knownCount(value) ? value : "未提供"
}
function content(value: ReactNode) {
  return value === null || value === undefined || typeof value === "boolean" || typeof value === "string" && !value.trim() ? "未提供" : value
}

/** All totals, judgments, distribution scales and completion facts belong to the host. */
export function StudentPaperReport({
  density = "default", pendingEmphasis = "default", title = "整卷报告", studentName, status, score, maxScore, counts, complete, provided,
  coverageText, causes = [], totalLost, missingCauses, unattributedLost, causesEmptyText,
  analysis, analysisSource = "AI", pendingCount, pendingText, onFirstPending,
  firstPendingDisabledReason, footer, className,
}: StudentPaperReportProps) {
  const id = useId()
  const compact = density === "compact"
  const strong = pendingEmphasis === "strong"
  const hasPending = knownCount(pendingCount) && pendingCount > 0
  const pendingReason = firstPendingDisabledReason || (!onFirstPending ? "定位操作未提供。" : undefined)
  const coverage = coverageText ?? (complete === true ? null : complete === false && knownCount(provided)
    ? `仅统计已提供的 ${provided} 题` : "统计范围：未提供")
  const pending = pendingText ?? (knownCount(pendingCount)
    ? hasPending ? `还有 ${pendingCount} 题待你处理` : "待办 0 题" : "待办题数：未提供")
  const lostLabel = complete === true ? "共失" : complete === false ? "已提供题目共失" : "已提供失分"

  return <section aria-labelledby={`${id}-title`} data-student-paper-report className={cn("min-w-0", className)}>
    <Frame>
      {strong && <FramePanel className={cn("bg-warning/15 text-warning-foreground", compact && "p-3")}>
        <section aria-label="学生待办" className="space-y-2">
          <p className="text-ui-body wrap-anywhere">{pendingText ?? (knownCount(pendingCount)
            ? hasPending ? <>还有 <span className="text-block-title tabular-nums">{pendingCount}</span> 题待你处理</> : <>待办 <span className="text-block-title tabular-nums">0</span> 题</>
            : "待办题数：未提供")}</p>
          {pendingText != null && <p className="text-ui-body wrap-anywhere">待办题数：<span className="text-block-title tabular-nums">{displayCount(pendingCount)}</span></p>}
          {hasPending && <Button variant="default" size="default" disabled={!!pendingReason} aria-describedby={pendingReason ? `${id}-pending-reason` : undefined} onClick={() => { if (!pendingReason) onFirstPending?.() }}>定位第一道待办题<ArrowRight aria-hidden="true" /></Button>}
          {hasPending && pendingReason && <p id={`${id}-pending-reason`} className="text-ui-hint wrap-anywhere">{pendingReason}</p>}
        </section>
      </FramePanel>}
      <FrameHeader className={compact ? "gap-1 px-3 py-2" : "gap-2"}>
        <h2 id={`${id}-title`} className="text-block-title wrap-anywhere">{title}</h2>
        <p className="text-ui-hint wrap-anywhere">学生：{content(studentName)}</p>
      </FrameHeader>
      <FramePanel className={compact ? "space-y-4 p-3" : "space-y-7"}>
        {!strong && <section aria-label="学生待办" className="space-y-2">
          <p className="text-ui-hint wrap-anywhere">{pending}</p>
          {hasPending && <Button variant="outline" disabled={!!pendingReason} aria-describedby={pendingReason ? `${id}-pending-reason` : undefined} onClick={() => { if (!pendingReason) onFirstPending?.() }}>定位第一道待办题</Button>}
          {hasPending && pendingReason && <p id={`${id}-pending-reason`} className="text-ui-hint text-muted-foreground wrap-anywhere">{pendingReason}</p>}
        </section>}
        <section aria-label="整卷得分" className={compact ? "space-y-2" : "space-y-3"}>
          <div className="flex flex-wrap items-baseline gap-1">
            <span className="text-score-display">{displayNumber(score)}</span>
            <span className="text-ui-body text-muted-foreground">/ {displayNumber(maxScore)} 分</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-ui-hint"><span>状态：</span><ReviewConfirmation><span className="whitespace-normal wrap-anywhere">{content(status)}</span></ReviewConfirmation></div>
        </section>
        {coverage !== null && <p data-report-coverage className="text-ui-hint text-muted-foreground wrap-anywhere">{coverage}</p>}
        <section aria-label="每题对错" className={compact ? "space-y-2" : "space-y-3"}>
          <h3 className="text-block-title">每题对错</h3>
          <dl className="grid grid-cols-[repeat(auto-fit,minmax(5rem,1fr))] gap-3">
            {judgements.map(({ key, label, variant }) => <div key={key} className="space-y-2">
              <dt><Badge variant={variant}>{label}</Badge></dt>
              <dd className="text-stat-display tabular-nums">{displayCount(counts?.[key])}</dd>
            </div>)}
          </dl>
          {counts?.unprovided !== undefined && <p className="text-ui-hint text-muted-foreground">另有 {displayCount(counts.unprovided)} 题未提供</p>}
        </section>
        <section aria-label="失分原因" className={compact ? "space-y-2" : "space-y-3"}>
          <h3 className="text-block-title">失分原因</h3>
          <p className="text-ui-hint text-muted-foreground">{knownNumber(totalLost) ? `${lostLabel} ${totalLost} 分` : "失分总量：未提供"}</p>
          {causes.length ? <ul className={compact ? "space-y-2" : "space-y-4"}>{causes.map(cause => <li key={cause.id} className="space-y-2">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-ui-body">
              <span className="min-w-0 wrap-anywhere">{content(cause.category)}</span>
              <span className="tabular-nums">{displayCount(cause.count)} 题 · 失 {displayNumber(cause.lost)} 分</span>
            </div>
            {cause.meter && knownNumber(cause.meter.value) && knownNumber(cause.meter.max) && cause.meter.max > 0 && cause.meter.value <= cause.meter.max && cause.meter.label.trim()
              ? <ReviewMeter value={cause.meter.value} max={cause.meter.max} label={cause.meter.label} />
              : <p className="text-ui-hint text-muted-foreground">分布量值未提供</p>}
          </li>)}</ul> : <p className="text-ui-body text-muted-foreground">{content(causesEmptyText)}</p>}
          {(missingCauses !== undefined || unattributedLost !== undefined) && <p className="text-ui-hint text-muted-foreground">{displayCount(missingCauses)} 题错因未提供 · 失 {displayNumber(unattributedLost)} 分</p>}
        </section>
      </FramePanel>
      <FramePanel className={compact ? "overflow-hidden p-3" : "overflow-hidden"}>
        <div aria-hidden="true" data-ai-source className="absolute inset-x-0 top-0 h-0.5" style={{ background: "var(--brand-ai-gradient)" }} />
        <section aria-label="AI 分析" className={compact ? "space-y-2" : "space-y-3"}>
          <h3 className="flex items-center gap-2 text-block-title"><Sparkles className="size-4" aria-hidden="true" />AI 分析</h3>
          <p className="text-ui-hint text-muted-foreground wrap-anywhere">来源：{content(analysisSource)}</p>
          <div className="max-w-[40em] whitespace-pre-wrap text-read-body wrap-anywhere">{content(analysis)}</div>
        </section>
      </FramePanel>
      {footer !== undefined && footer !== null && <FrameFooter className={compact ? "px-3 py-2 text-ui-hint wrap-anywhere" : "text-ui-hint wrap-anywhere"}>{footer}</FrameFooter>}
    </Frame>
  </section>
}
