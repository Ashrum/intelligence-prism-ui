"use client"

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react"
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, ListChecks, X } from "lucide-react"
import { Button } from "@/components/coss/button"
import { Checkbox } from "@/components/coss/checkbox"
import { Label } from "@/components/coss/label"
import { Badge } from "@/components/coss/badge"
import { Tabs, TabsList, TabsTab, TabsPanel } from "@/components/coss/tabs"
import { Collapsible, CollapsibleTrigger, CollapsiblePanel } from "@/components/coss/collapsible"
import { Popover, PopoverTrigger, PopoverPopup, PopoverTitle } from "@/components/coss/popover"
import { QuestionContent, type QuestionRecord } from "@/components/prism-next/question-content"
import { questionSamples } from "@/components/prism-next/question-samples"
import { TextbookRangePicker } from "@/components/prism-next/textbook-range-picker"
import type { DirectorySelections } from "@/components/prism-next/textbook-directory"
import { textbooks } from "@/lib/prism-next/textbook-directory"
import { cn } from "@/lib/utils"

type Links = Record<string, DirectorySelections>

export function QuestionsDemo() {
  const [view, setView] = useState<"list" | "reading">("list")
  const [readingId, setReadingId] = useState(questionSamples[0].id)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [answers, setAnswers] = useState<Record<string, boolean>>({})
  const [links, setLinks] = useState<Links>(() => Object.fromEntries(questionSamples.map(question => [question.id, question.initialLinks ?? {}])))
  const readingHeader = useRef<HTMLHeadingElement>(null)
  const readingButtons = useRef<Record<string, HTMLButtonElement | null>>({})
  const pendingFocus = useRef<"reading" | "list" | null>(null)
  const index = questionSamples.findIndex(question => question.id === readingId)
  const current = questionSamples[index]
  const selected = questionSamples.filter(question => selectedIds.includes(question.id))
  const points = selected.reduce((sum, question) => sum + question.points, 0)
  useEffect(() => {
    if (!pendingFocus.current) return
    const target = pendingFocus.current === "reading" ? readingHeader.current : readingButtons.current[readingId]
    target?.focus({ preventScroll: true }); target?.scrollIntoView({ block: "nearest" })
    pendingFocus.current = null
  }, [view, readingId])
  const select = (id: string, checked: boolean) => setSelectedIds(previous => checked ? [...new Set([...previous, id])] : previous.filter(value => value !== id))
  function read(id: string) { pendingFocus.current = "reading"; setReadingId(id); setView("reading") }
  function back() { pendingFocus.current = "list"; setView("list") }
  function questionProps(question: QuestionRecord) {
    return {
      question,
      number: questionSamples.indexOf(question) + 1,
      selected: selectedIds.includes(question.id),
      onSelectedChange: (checked: boolean) => select(question.id, checked),
      answersOpen: !!answers[question.id],
      onAnswersOpenChange: (open: boolean) => setAnswers(previous => ({ ...previous, [question.id]: open })),
      links: links[question.id] ?? {},
      onLinksChange: ((update) => setLinks(previous => ({ ...previous, [question.id]: typeof update === "function" ? update(previous[question.id] ?? {}) : update }))) as Dispatch<SetStateAction<DirectorySelections>>,
    }
  }
  return <section className="prism-demo-section" aria-label="题目组件评审">
    <Tabs value={view} onValueChange={value => setView(value as "list" | "reading")} className="gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <TabsList aria-label="题目呈现方式"><TabsTab value="list">列表选题</TabsTab><TabsTab value="reading">展开阅读</TabsTab></TabsList>
        <div className="flex flex-wrap items-center gap-3"><p className="prism-numeric text-sm text-muted-foreground" role="status">已选 {selected.length} 题 · {points} 分</p><Popover><PopoverTrigger render={<Button variant="outline" size="sm" />}><ListChecks />查看已选</PopoverTrigger><PopoverPopup className="w-80"><PopoverTitle className="text-base">已选题目</PopoverTitle>{selected.length ? <ul className="mt-3 space-y-3">{selected.map(question => <li key={question.id} className="flex items-start gap-2"><div className="min-w-0 flex-1"><p className="break-words text-sm leading-6">{question.title}</p><p className="text-xs text-muted-foreground">{question.id} · {question.kind} · {question.points} 分</p></div><Button size="icon-sm" variant="ghost" aria-label={`移除已选题目${question.id}`} onClick={() => select(question.id, false)}><X /></Button></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">还没有选题。使用题目开头的复选框选用整题。</p>}</PopoverPopup></Popover></div>
      </div>
      <TabsPanel value="list" className="space-y-5">
        <p className="text-sm text-muted-foreground">共 4 道自编示例题。复选框用于选用整题，A／B／C／D 选项仅供阅读。</p>
        <div className="space-y-5">{questionSamples.map(question => <QuestionFrame key={question.id} {...questionProps(question)} onRead={() => read(question.id)} readButtonRef={element => { readingButtons.current[question.id] = element }} />)}</div>
      </TabsPanel>
      <TabsPanel value="reading">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><Button variant="ghost" onClick={back}><ArrowLeft />返回列表</Button><div className="flex items-center gap-3"><Button variant="outline" size="icon" aria-label="阅读上一题" disabled={index === 0} onClick={() => read(questionSamples[index - 1].id)}><ArrowLeft /></Button><span className="prism-numeric text-sm text-muted-foreground">{index + 1} / {questionSamples.length}</span><Button variant="outline" size="icon" aria-label="阅读下一题" disabled={index === questionSamples.length - 1} onClick={() => read(questionSamples[index + 1].id)}><ArrowRight /></Button></div></div>
        <div className="mx-auto max-w-[54rem]"><h2 ref={readingHeader} tabIndex={-1} className="mb-5 rounded-sm text-xl font-semibold text-(--heading) outline-none focus-visible:ring-2 focus-visible:ring-ring">{current.title}</h2><QuestionFrame key={current.id} {...questionProps(current)} reading /></div>
      </TabsPanel>
    </Tabs>
  </section>
}

function QuestionFrame({ question, number, selected, onSelectedChange, answersOpen, onAnswersOpenChange, links, onLinksChange, onRead, reading = false, readButtonRef }: {
  question: QuestionRecord; number: number; selected: boolean; onSelectedChange: (checked: boolean) => void
  answersOpen: boolean; onAnswersOpenChange: (open: boolean) => void
  links: DirectorySelections; onLinksChange: Dispatch<SetStateAction<DirectorySelections>>
  onRead?: () => void; reading?: boolean; readButtonRef?: (element: HTMLButtonElement | null) => void
}) {
  const titleId = `${reading ? "reading" : "list"}-${question.id}`
  const checkboxId = `${titleId}-select`
  const linkNames = textbooks.flatMap(book => (["course", "knowledge"] as const).flatMap(kind => (links[`${book.id}:${kind}`] ?? []).map(id => book.directories[kind].nodes[id]?.title).filter(Boolean)))
  const [metadataOpen, setMetadataOpen] = useState(false)
  return <article aria-labelledby={titleId} data-question-id={question.id} className={cn("prism-question rounded-xl border bg-background px-4 py-5 text-foreground sm:px-6 sm:py-6", selected ? "border-primary/60" : "border-border", reading && "border-transparent px-0 sm:px-0")}>
    <header className="mb-5 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2"><Checkbox id={checkboxId} aria-label={`选用第${number}题：${question.title}`} checked={selected} onCheckedChange={onSelectedChange} /><Label htmlFor={checkboxId}>选用<span className="sr-only">第{number}题：{question.title}</span></Label></div>
      <h3 id={titleId} className="text-sm font-semibold">第 {number} 题</h3><Badge variant="outline">{question.kind}</Badge><span className="prism-numeric text-sm text-muted-foreground">{question.points} 分</span>
      {selected && <span className="flex items-center gap-1 text-sm"><Check className="size-3.5" />已选</span>}
      {onRead && <Button ref={readButtonRef} variant="ghost" size="sm" className="ml-auto" onClick={onRead} aria-label={`展开阅读第${number}题`}><BookOpen />展开阅读</Button>}
    </header>
    <QuestionContent question={question} />
    <Collapsible open={answersOpen} onOpenChange={onAnswersOpenChange} className="mt-5">
      <CollapsibleTrigger render={<Button variant="ghost" size="sm" />} aria-label={`${answersOpen ? "收起" : "查看"}第${number}题答案与解析`}><ChevronDown className={cn("transition-transform", answersOpen && "rotate-180")} />{answersOpen ? "收起答案与解析" : "查看答案与解析"}</CollapsibleTrigger>
      <CollapsiblePanel><div className="prism-question-copy mt-4 space-y-5 border-t pt-5 text-base leading-[1.9]"><section aria-label={`第${number}题参考答案`}><h4 className="mb-2 text-sm font-semibold">参考答案</h4>{question.answer}</section><section aria-label={`第${number}题解析`}><h4 className="mb-2 text-sm font-semibold">解析</h4><div className="space-y-3">{question.explanation}</div></section></div></CollapsiblePanel>
    </Collapsible>
    <Collapsible open={metadataOpen} onOpenChange={setMetadataOpen} className="mt-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2"><p className="text-xs text-muted-foreground">{question.id} · 自编示例</p><p className="min-w-0 flex-1 break-words text-sm text-muted-foreground">{linkNames.length ? `${linkNames.slice(0, 2).join(" · ")}${linkNames.length > 2 ? ` 等 ${linkNames.length} 项关联` : ""}` : "尚未关联教材与知识点"}</p><CollapsibleTrigger render={<Button variant="ghost" size="sm" />} aria-label={`调整第${number}题教材与知识点关联`}>{metadataOpen ? "收起关联" : "教材与知识点"}<ChevronDown className={cn("transition-transform", metadataOpen && "rotate-180")} /></CollapsibleTrigger></div>
      <CollapsiblePanel><div className="mt-5 rounded-lg bg-muted/30 p-4 sm:p-5"><TextbookRangePicker textbooks={textbooks} selections={links} onSelectionsChange={onLinksChange} /></div></CollapsiblePanel>
    </Collapsible>
  </article>
}
