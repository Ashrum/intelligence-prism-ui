"use client"

import { useId, type ReactNode } from "react"
import { ArrowUpRight, FileQuestion } from "lucide-react"
import { Button } from "@/components/coss/button"
import { Checkbox } from "@/components/coss/checkbox"
import { AgentStatus } from "./agent-visual-parts"
import { QuestionContent, type QuestionRecord } from "./question-content"
import { cn } from "@/lib/utils"

export type QuestionHeadingLevel = 1 | 2 | 3 | 4 | 5 | 6
/** number is a host-owned display ordinal, never a replacement for question.id. */
export const questionDisplayTitle = (question: Pick<QuestionRecord, "title">, number?: number) =>
  `${number === undefined ? "" : `第 ${number} 题 · `}${question.title}`

export function QuestionHeading({ question, number, id, headingLevel = 3, showPoints = true, displayPoints, reading = false, trailing }: {
  question: QuestionRecord; number?: number; id: string; headingLevel?: QuestionHeadingLevel
  showPoints?: boolean; displayPoints?: number; reading?: boolean; trailing?: ReactNode
}) {
  const Heading = `h${headingLevel}` as const
  const attributes = [!reading && question.kind, showPoints && `${displayPoints ?? question.points} 分`, !reading && question.difficulty,
    !reading && question.parts?.length ? "整题" : undefined,
    !reading && question.parts?.length ? `含 ${question.parts.length} 个小问` : undefined].filter(Boolean)
  return <div className="prism-question-heading flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-1">
    <div className="flex w-full min-w-0 items-start gap-2">
      <Heading id={id} className="min-w-0 flex-1 break-words text-item-title">{questionDisplayTitle(question, number)}</Heading>
      {trailing && <div className="flex shrink-0 flex-wrap items-start gap-2">{trailing}</div>}
    </div>
    {attributes.length > 0 && <p data-question-attributes="" className="prism-question-attributes w-full min-w-0 text-ui-meta tabular-nums text-muted-foreground">
      {attributes.map((attribute, index) => <span key={index} className="inline-block whitespace-nowrap">{index > 0 && " · "}{attribute}</span>)}
    </p>}
  </div>
}

type ReferenceProps = {
  question: Pick<QuestionRecord, "id" | "title">; number?: number; status?: ReactNode
} & ({ href: string; onOpen?: never } | { href?: never; onOpen: (trigger: HTMLButtonElement) => void })

/** L0. Native link or button; navigation and the single interactive L2 belong to the host. */
export function QuestionReference({ question, number, status, href, onOpen }: ReferenceProps) {
  const title = questionDisplayTitle(question, number)
  return <span data-question-reference={question.id} className="inline-flex max-w-full flex-wrap items-center gap-1.5 align-middle">
    <Button variant="ghost" size="sm" className="h-auto min-h-11 max-w-full justify-start whitespace-normal text-left sm:h-auto"
      {...(href !== undefined ? { render: <a href={href} /> } : { type: "button" as const, onClick: (event: React.MouseEvent<HTMLButtonElement>) => onOpen?.(event.currentTarget) })}
      aria-label={`查看完整题目：${title}`}>
      <FileQuestion aria-hidden="true" className="size-4 shrink-0" /><span className="min-w-0 break-words">{title}</span>
    </Button>{status}
  </span>
}

export type QuestionSummaryRowProps = {
  question: QuestionRecord; number?: number; headingLevel?: QuestionHeadingLevel
  checked?: boolean; onCheckedChange?: (checked: boolean) => void
  onOpen?: (trigger: HTMLButtonElement) => void
  /** Visible open action text; defaults to 查看详情. */
  openLabel?: string
  /** Complete accessible name; defaults to 查看详情：{display title}. */
  openAccessibleLabel?: string
  /** Keep the complete stem block and omit subsequent blocks/options/parts only when onOpen is present. */
  excerpt?: boolean
  showPoints?: boolean; displayPoints?: number; status?: ReactNode; header?: ReactNode
}

/** L1. No outer surface, disclosure, line clamp, or formula/string slicing. */
export function QuestionSummaryRow({ question, number, headingLevel = 3, checked, onCheckedChange, onOpen, openLabel = "查看详情", openAccessibleLabel, excerpt = true,
  showPoints = true, displayPoints, status, header }: QuestionSummaryRowProps) {
  const id = useId()
  const omitted = !!(excerpt && onOpen && (question.blocks?.length || question.figure || question.options?.length || question.parts?.length))
  const content = omitted ? { ...question, blocks: undefined, figure: undefined, options: undefined, parts: undefined } : question
  return <article data-question-summary={question.id} data-question-excerpt={omitted || undefined} aria-labelledby={id}
    className={cn("prism-question min-w-0 space-y-2 py-2", checked && "bg-info/10")}>
    <header className="flex min-w-0 flex-wrap items-start gap-2">
      {onCheckedChange && <label className="flex min-h-11 min-w-11 shrink-0 items-start justify-center">
        <span className="flex h-5 items-center"><Checkbox checked={!!checked} onCheckedChange={onCheckedChange} aria-label={`批量勾选：${questionDisplayTitle(question, number)}`} /></span>
      </label>}
      <QuestionHeading question={question} number={number} id={id} headingLevel={headingLevel} showPoints={showPoints} displayPoints={displayPoints} trailing={(header || status) ? <>{header}{status}</> : undefined} />
    </header>
    <QuestionContent question={content} />
    {(omitted || onOpen) && <div data-question-actions="" className="flex min-w-0 flex-wrap items-center justify-start gap-2">
      {onOpen && <Button type="button" variant="secondary" size="xs" className="max-w-full whitespace-normal pointer-coarse:min-h-11"
        aria-label={openAccessibleLabel ?? `查看详情：${questionDisplayTitle(question, number)}`} onClick={event => onOpen(event.currentTarget)}>
        <ArrowUpRight aria-hidden="true" className="size-4" />{openLabel}
      </Button>}
      {omitted && <AgentStatus>节选</AgentStatus>}
    </div>}
  </article>
}
