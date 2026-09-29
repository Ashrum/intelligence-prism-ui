"use client"

import { useId, useRef, useState } from "react"
import { Button } from "../button"
import { QuestionCard } from "../question-card"
import { QuestionDetails, type QuestionDetailTab } from "../question-details"
import { QuestionReference } from "../question-presentation"
import type { QuestionRecord } from "../question-content"
import { QuestionWorkPanel } from "../question-work-panel"
import { AgentSampleTag } from "../agent-visual-parts"
import { questionMetadata } from "../fixtures/question-metadata"

const noLinks = {}
const missingMetadata = { knowledge: [], method: "", demand: "", family: "", source: "", version: "" }

/** Fixture composition only. Missing answers/metadata stay missing; no service, Store or persistence. */
export function QuestionExampleDetails({ question, tabs }: { question: QuestionRecord; tabs?: QuestionDetailTab[] }) {
  const [tab, setTab] = useState<QuestionDetailTab>("answer")
  return <QuestionDetails question={question} metadata={questionMetadata[question.id] ?? missingMetadata} links={noLinks}
    onLinksChange={() => {}} tab={tab} onTabChange={setTab} tabs={tabs} />
}

export function QuestionExampleCard({ question, number }: { question: QuestionRecord; number?: number }) {
  const [open, setOpen] = useState(true)
  return <QuestionCard question={question} number={number} headingLevel={4} header={<AgentSampleTag />}
    detailsOpen={open} onDetailsOpenChange={setOpen} details={<QuestionExampleDetails question={question} />} />
}

/** One open question per example host. Tab survives previous/next; a new opener starts at answer. */
export function useQuestionPreview(questions: readonly QuestionRecord[] = []) {
  const id = useId()
  const [selected, setSelected] = useState<{ question: QuestionRecord; number?: number } | null>(null)
  const [tab, setTab] = useState<QuestionDetailTab>("answer")
  const [detailsOpen, setDetailsOpen] = useState(true)
  const origin = useRef<HTMLButtonElement | null>(null)
  const openQuestion = (question: QuestionRecord, number: number | undefined, trigger: HTMLButtonElement) => {
    origin.current = trigger; setTab("answer"); setDetailsOpen(true); setSelected({ question, number })
  }
  const reference = (question: QuestionRecord, number?: number) => <QuestionReference question={question} number={number}
    onOpen={trigger => openQuestion(question, number, trigger)} />
  const index = selected ? questions.findIndex(question => question.id === selected.question.id) : -1
  const navigate = (offset: number) => {
    const question = questions[index + offset]
    if (question) setSelected({ question, number: index + offset + 1 })
  }
  const panel = <QuestionWorkPanel id={`${id}-question-preview`} open={!!selected} title="单题查看 · 示例"
    description="固定示例；查看题目不改变选择、保存或执行记录。" onClose={() => setSelected(null)} finalFocus={origin}
    className="question-charter-preview w-full max-w-full" showCloseButton={false}
    headerActions={<div className="flex flex-wrap gap-2">
      <Button type="button" variant="ghost" className="min-h-11" onClick={() => setSelected(null)}>返回对话</Button>
      {questions.length > 1 && <><Button type="button" variant="outline" className="min-h-11" disabled={index <= 0} onClick={() => navigate(-1)}>上一题</Button>
        <Button type="button" variant="outline" className="min-h-11" disabled={index < 0 || index >= questions.length - 1} onClick={() => navigate(1)}>下一题</Button></>}
    </div>}>
    {selected && <QuestionCard question={selected.question} number={selected.number} headingLevel={3} header={<AgentSampleTag />} detailsOpen={detailsOpen} onDetailsOpenChange={setDetailsOpen}
      details={<QuestionDetails question={selected.question} metadata={questionMetadata[selected.question.id] ?? missingMetadata} links={noLinks}
        onLinksChange={() => {}} tab={tab} onTabChange={setTab} />} />}
  </QuestionWorkPanel>
  return { openQuestion, reference, panel }
}
