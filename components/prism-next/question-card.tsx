"use client"
import { useId, useState, type ReactNode, type Dispatch, type SetStateAction } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/coss/button"
import { Checkbox } from "@/components/coss/checkbox"
import { Badge } from "@/components/coss/badge"
import { Collapsible, CollapsibleTrigger, CollapsiblePanel } from "@/components/coss/collapsible"
import { QuestionContent, QuestionSolution, type QuestionRecord } from "./question-content"
import { TextbookRangePicker } from "./textbook-range-picker"
import type { DirectorySelections } from "./textbook-directory"
import { textbooks } from "@/lib/prism-next/textbook-directory"
import { cn } from "@/lib/utils"

export function QuestionCard({ question, number, checked, onCheckedChange, actions, answersOpen, onAnswersOpenChange, links, onLinksChange, reading = false, compact = false, status }: {
  question: QuestionRecord; number: number; checked?: boolean; onCheckedChange?: (value:boolean)=>void
  actions?: ReactNode; answersOpen: boolean; onAnswersOpenChange: (value:boolean)=>void
  links?: DirectorySelections; onLinksChange?: Dispatch<SetStateAction<DirectorySelections>>
  reading?: boolean; compact?: boolean; status?: ReactNode
}) {
  const id = useId(), [metadataOpen,setMetadataOpen] = useState(false)
  const linkNames = textbooks.flatMap(book => (["course","knowledge"] as const).flatMap(kind => (links?.[`${book.id}:${kind}`] ?? []).map(key => book.directories[kind].nodes[key]?.title).filter(Boolean)))
  return <article data-question-id={question.id} aria-labelledby={id} className={cn("prism-question min-w-0 rounded-xl border bg-background px-4 py-5 text-foreground sm:px-6",checked && "border-primary/60",reading && "border-transparent px-0 sm:px-0")}>
    <header className="mb-4 flex flex-wrap items-center gap-3">
      {onCheckedChange && <Checkbox checked={!!checked} onCheckedChange={onCheckedChange} aria-label={`批量勾选第${number}题：${question.title}`} />}
      <h3 id={id} className="text-sm font-semibold">第 {number} 题 · {question.title}</h3><Badge variant="outline">{question.kind}</Badge><span className="text-sm tabular-nums text-muted-foreground">{question.points} 分</span>{status}
      {actions && <div className="ml-auto flex flex-wrap gap-2">{actions}</div>}
    </header>
    {compact ? <div className="prism-question-copy line-clamp-2 text-base leading-[1.9]">{question.stem}</div> : <QuestionContent question={question}/>}
    {!compact && <Collapsible open={answersOpen} onOpenChange={onAnswersOpenChange} className="mt-5"><CollapsibleTrigger render={<Button variant="ghost" size="sm"/>} aria-label={`${answersOpen ? "收起" : "查看"}第${number}题答案与解析`}><ChevronDown className={cn("transition-transform",answersOpen && "rotate-180")}/>{answersOpen ? "收起答案与解析" : "查看答案与解析"}</CollapsibleTrigger><CollapsiblePanel><div className="mt-4 border-t pt-5" aria-label={`第${number}题参考答案`}><QuestionSolution question={question}/></div></CollapsiblePanel></Collapsible>}
    {onLinksChange && <Collapsible open={metadataOpen} onOpenChange={setMetadataOpen} className="mt-4"><div className="flex flex-wrap items-center gap-x-4 gap-y-2"><p className="text-xs text-muted-foreground">{question.id} · 自编示例</p><p className="min-w-0 flex-1 break-words text-sm text-muted-foreground">{linkNames.length ? `${linkNames.slice(0,2).join(" · ")}${linkNames.length > 2 ? ` 等 ${linkNames.length} 项关联` : ""}` : "尚未关联教材与知识点"}</p><CollapsibleTrigger render={<Button variant="ghost" size="sm"/>} aria-label={`调整第${number}题教材与知识点关联`}>{metadataOpen ? "收起关联" : "教材与知识点"}<ChevronDown/></CollapsibleTrigger></div><CollapsiblePanel><div className="mt-4 rounded-lg bg-muted/30 p-4"><TextbookRangePicker textbooks={textbooks} selections={links ?? {}} onSelectionsChange={onLinksChange}/></div></CollapsiblePanel></Collapsible>}
  </article>
}
