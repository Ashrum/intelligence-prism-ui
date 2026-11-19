"use client"

import { useId, useState, type ReactNode } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/coss/button"
import { Checkbox } from "@/components/coss/checkbox"
import { Collapsible, CollapsiblePanel } from "@/components/coss/collapsible"
import { Toolbar, ToolbarButton, ToolbarGroup } from "@/components/coss/toolbar"
import { difficultySwatches } from "./difficulty-mix"
import { QuestionContent, type QuestionRecord } from "./question-content"
import { QuestionHeading, QuestionSummaryRow, questionDisplayTitle, type QuestionHeadingLevel } from "./question-presentation"
import { cn } from "@/lib/utils"

export { QuestionReference, QuestionSummaryRow } from "./question-presentation"

type QuestionHold = { title: ReactNode; meta?: ReactNode; status?: ReactNode; body?: ReactNode; note?: ReactNode }
type QuestionCardProps = ({ question: QuestionRecord; hold?: undefined } | {
  question: Omit<QuestionRecord, "stem"> & { stem?: ReactNode }; hold: QuestionHold
}) & {
  appearance?: "default" | "catalog"; index?: number
  /** Host-owned display ordinal only. The archive always uses question.id. */
  number?: number; headingLevel?: QuestionHeadingLevel
  details?: ReactNode; detailsOpen?: boolean; onDetailsOpenChange?: (open: boolean) => void
  checked?: boolean; onCheckedChange?: (value: boolean) => void; actions?: ReactNode; secondaryActions?: ReactNode
  reading?: boolean; compact?: boolean; meta?: ReactNode; status?: ReactNode; header?: ReactNode; showPoints?: boolean
  displayPoints?: number; displayPartPoints?: Record<string, number>; highlighted?: boolean
  /** compact + onOpen opts into L1; legacy compact without an opener shows full L2, without clipping. */
  onOpen?: (trigger: HTMLButtonElement) => void
}

export function QuestionCard({ question, hold, number, headingLevel = 3, details, detailsOpen, onDetailsOpenChange, checked, onCheckedChange,
  actions, secondaryActions, reading = false, compact = false, meta, status, header, showPoints = true, displayPoints, displayPartPoints, highlighted = false, onOpen, appearance = "default", index }: QuestionCardProps) {
  const id = useId()
  const [localOpen, setLocalOpen] = useState(false)
  const open = detailsOpen ?? localOpen
  const changeOpen = (next: boolean) => { if (detailsOpen === undefined) setLocalOpen(next); onDetailsOpenChange?.(next) }
  const content = !hold ? { ...question, parts: question.parts?.map(part => ({ ...part, points: showPoints ? displayPartPoints?.[part.id] ?? part.points : undefined })) } : undefined
  const summary = !hold && compact && onOpen && !reading
  const catalog = appearance === "catalog" && !reading && !summary
  const Heading = `h${headingLevel}` as const
  const catalogMeta = meta ?? hold?.meta
  const hasMeta = catalogMeta != null && typeof catalogMeta !== "boolean" && catalogMeta !== ""
  const trailing = hold ? (!reading && hold.status != null ? <span className="min-w-0 break-words text-ui-meta text-[color:var(--brand-magenta-text)]">{hold.status}</span> : undefined)
    : !reading && (header || status) ? <>{header}{status}</> : undefined
  const checkbox = !reading && onCheckedChange && <label className={catalog ? "inline-flex shrink-0 items-center pointer-coarse:-mx-3.5 pointer-coarse:min-h-11 pointer-coarse:px-3.5" : "flex pointer-coarse:min-h-11 pointer-coarse:min-w-11 shrink-0 items-start justify-center"}>
    <span className="flex h-5 items-center"><Checkbox checked={!!checked} onCheckedChange={onCheckedChange} aria-label={`批量勾选：${questionDisplayTitle(question, number)}`} /></span>
  </label>
  const swatch = question.difficulty === "基础" ? difficultySwatches.basic : question.difficulty === "巩固" ? difficultySwatches.consolidate : question.difficulty === "提升" ? difficultySwatches.advance : undefined
  const separator = <span aria-hidden="true" className="text-muted-foreground/50">·</span>
  return <article data-question-id={question.id} data-question-level={reading ? "L3" : summary ? "L1" : "L2"} data-highlight={highlighted || undefined} data-question-hold={hold ? "" : undefined}
    aria-labelledby={summary ? undefined : id} className={cn("prism-question min-w-0",
      reading || summary ? "py-2" : catalog ? "prism-question-catalog relative rounded-[10px] border border-border bg-card text-card-foreground" : "rounded-xl bg-card p-4 text-card-foreground shadow-xs/5 ring-1 ring-border",
      !reading && !summary && checked && "prism-question-selected ring-2 ring-primary/60")}>
    {summary ? <QuestionSummaryRow question={content!} number={number} headingLevel={headingLevel} checked={checked} onCheckedChange={onCheckedChange}
      onOpen={onOpen} showPoints={showPoints} displayPoints={displayPoints} header={header} status={status} /> : <>
      {catalog ? <header className="prism-question-catalog-header mb-3 flex min-w-0 items-center gap-3 text-ui-meta text-muted-foreground">
        <Heading id={id} className="sr-only">{hold?.title !== undefined ? hold.title : questionDisplayTitle(question, number)}</Heading>
        {checkbox}
        {index !== undefined && <span aria-hidden="true" className="prism-question-index shrink-0 font-mono tabular-nums">{String(index).padStart(2, "0")}</span>}
        <div data-question-attributes="" className="flex min-w-0 flex-wrap items-center gap-x-2">
          {question.kind && <span className="text-foreground">{question.kind}</span>}
          {showPoints && <>{question.kind && separator}<span className="prism-question-points whitespace-nowrap">{displayPoints ?? question.points} 分</span></>}
          {question.difficulty && <>{(question.kind || showPoints) && separator}<span className="inline-flex items-center whitespace-nowrap">
            {swatch && <span aria-hidden="true" className="prism-question-difficulty-swatch" style={{ background: swatch }} />}{question.difficulty}
          </span></>}
        </div>
        {(hasMeta || trailing) && <div className="prism-question-catalog-extra flex min-w-0 flex-1 items-center gap-x-2">
          {hasMeta && <>{(question.kind || showPoints || question.difficulty) && <span aria-hidden="true" className="prism-question-meta-separator text-muted-foreground/50">·</span>}
            <div className="min-w-0 truncate">{catalogMeta}</div></>}
          {trailing && <div className="prism-question-catalog-status ml-auto flex shrink-0 flex-wrap items-center gap-3">{trailing}</div>}
        </div>}
      </header> : <header className="mb-3 flex min-w-0 flex-wrap items-start gap-2.5">
        {checkbox}
        <QuestionHeading question={question} number={number} id={id} headingLevel={headingLevel} showPoints={showPoints} displayPoints={displayPoints} reading={reading} titleOverride={hold?.title} trailing={trailing} />
        {hold?.meta != null && <div className="w-full min-w-0 text-ui-meta text-muted-foreground">{hold.meta}</div>}
      </header>}
      {hold ? <div className={cn("min-w-0 space-y-3", catalog && "prism-question-catalog-body")}>
        {hold.body != null && <div data-question-hold-body="" className="min-w-0 text-read-body text-muted-foreground">{hold.body}</div>}
        {hold.note != null && <div data-question-hold-note="" className="min-w-0 text-ui-meta">{hold.note}</div>}
      </div> : <QuestionContent question={content!} optionStyle={catalog ? "badge" : "text"} />}
    </>}
    {!reading && ((!summary && details) || secondaryActions || actions) && <Toolbar aria-label={`${question.title}操作`} className={cn("mt-3 flex-wrap items-center gap-y-2 rounded-none border-0 bg-transparent p-0 text-foreground", catalog && "prism-question-catalog-actions")}>
      <ToolbarGroup className="flex-wrap">{!summary && details && <ToolbarButton render={<Button variant="ghost" />}
        aria-label={`${number === undefined ? question.title : `第${number}题`}详情`} aria-expanded={open} aria-controls={`${id}-details`} onClick={() => changeOpen(!open)}>
        <ChevronDown aria-hidden="true" className={cn("motion-safe:transition-transform", open && "rotate-180")} />详情
      </ToolbarButton>}{secondaryActions}</ToolbarGroup>{actions && <ToolbarGroup className="ml-auto flex-wrap">{actions}</ToolbarGroup>}
    </Toolbar>}
    {!reading && !summary && details && <Collapsible open={open}><CollapsiblePanel id={`${id}-details`} className="motion-reduce:transition-none">
      <div className={catalog ? "prism-question-catalog-details mt-3 min-w-0 border-t pt-3" : "question-detail-region mt-3 min-w-0 rounded-xl bg-secondary p-4"}>{details}</div>
    </CollapsiblePanel></Collapsible>}
  </article>
}
