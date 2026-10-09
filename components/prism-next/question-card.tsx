"use client"

import { useId, useState, type ReactNode } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/coss/button"
import { Checkbox } from "@/components/coss/checkbox"
import { Collapsible, CollapsiblePanel } from "@/components/coss/collapsible"
import { Toolbar, ToolbarButton, ToolbarGroup } from "@/components/coss/toolbar"
import { QuestionContent, type QuestionRecord } from "./question-content"
import { QuestionHeading, QuestionSummaryRow, questionDisplayTitle, type QuestionHeadingLevel } from "./question-presentation"
import { cn } from "@/lib/utils"

export { QuestionReference, QuestionSummaryRow } from "./question-presentation"

export function QuestionCard({ question, number, headingLevel = 3, details, detailsOpen, onDetailsOpenChange, checked, onCheckedChange,
  actions, secondaryActions, reading = false, compact = false, status, header, showPoints = true, displayPoints, displayPartPoints, highlighted = false, onOpen }: {
  question: QuestionRecord
  /** Host-owned display ordinal only. The archive always uses question.id. */
  number?: number; headingLevel?: QuestionHeadingLevel
  details?: ReactNode; detailsOpen?: boolean; onDetailsOpenChange?: (open: boolean) => void
  checked?: boolean; onCheckedChange?: (value: boolean) => void; actions?: ReactNode; secondaryActions?: ReactNode
  reading?: boolean; compact?: boolean; status?: ReactNode; header?: ReactNode; showPoints?: boolean
  displayPoints?: number; displayPartPoints?: Record<string, number>; highlighted?: boolean
  /** compact + onOpen opts into L1; legacy compact without an opener shows full L2, without clipping. */
  onOpen?: (trigger: HTMLButtonElement) => void
}) {
  const id = useId()
  const [localOpen, setLocalOpen] = useState(false)
  const open = detailsOpen ?? localOpen
  const changeOpen = (next: boolean) => { if (detailsOpen === undefined) setLocalOpen(next); onDetailsOpenChange?.(next) }
  const content = { ...question, parts: question.parts?.map(part => ({ ...part, points: showPoints ? displayPartPoints?.[part.id] ?? part.points : undefined })) }
  const summary = compact && onOpen && !reading
  return <article data-question-id={question.id} data-question-level={reading ? "L3" : summary ? "L1" : "L2"} data-highlight={highlighted || undefined}
    aria-labelledby={summary ? undefined : id} className={cn("prism-question min-w-0",
      reading || summary ? "py-2" : "rounded-xl bg-card p-4 text-card-foreground shadow-xs/5 ring-1 ring-border",
      !reading && !summary && checked && "bg-info/10 ring-primary/60")}>
    {summary ? <QuestionSummaryRow question={content} number={number} headingLevel={headingLevel} checked={checked} onCheckedChange={onCheckedChange}
      onOpen={onOpen} showPoints={showPoints} displayPoints={displayPoints} header={header} status={status} /> : <>
      <header className="mb-3 flex min-w-0 flex-wrap items-start gap-2.5">
        {!reading && onCheckedChange && <label className="flex pointer-coarse:min-h-11 pointer-coarse:min-w-11 shrink-0 items-start justify-center">
          <span className="flex h-5 items-center"><Checkbox checked={!!checked} onCheckedChange={onCheckedChange} aria-label={`批量勾选：${questionDisplayTitle(question, number)}`} /></span>
        </label>}
        <QuestionHeading question={question} number={number} id={id} headingLevel={headingLevel} showPoints={showPoints} displayPoints={displayPoints} reading={reading} trailing={!reading && (header || status) ? <>{header}{status}</> : undefined} />
      </header>
      <QuestionContent question={content} />
    </>}
    {!reading && ((!summary && details) || secondaryActions || actions) && <Toolbar aria-label={`${question.title}操作`} className="mt-3 flex-wrap items-center gap-y-2 rounded-none border-0 bg-transparent p-0 text-foreground">
      <ToolbarGroup className="flex-wrap">{!summary && details && <ToolbarButton render={<Button variant="ghost" />}
        aria-label={`${number === undefined ? question.title : `第${number}题`}详情`} aria-expanded={open} aria-controls={`${id}-details`} onClick={() => changeOpen(!open)}>
        <ChevronDown aria-hidden="true" className={cn("motion-safe:transition-transform", open && "rotate-180")} />详情
      </ToolbarButton>}{secondaryActions}</ToolbarGroup>{actions && <ToolbarGroup className="ml-auto flex-wrap">{actions}</ToolbarGroup>}
    </Toolbar>}
    {!reading && !summary && details && <Collapsible open={open}><CollapsiblePanel id={`${id}-details`} className="motion-reduce:transition-none">
      <div className="question-detail-region mt-3 min-w-0 rounded-xl bg-secondary p-4">{details}</div>
    </CollapsiblePanel></Collapsible>}
  </article>
}
