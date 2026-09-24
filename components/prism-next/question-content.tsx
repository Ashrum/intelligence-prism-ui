"use client"

import { type ReactNode } from "react"
import { QuestionTypeLabel, QuestionPoints, responsePresentation } from "./question-labels"

export type ResponseModel = "single" | "multiple" | "fill" | "boolean" | "long"
export type QuestionPart = {
  id: string
  content: ReactNode
  response?: ResponseModel
  points?: number
  options?: { id: string; content: ReactNode }[]
  answer?: ReactNode
  explanation?: ReactNode
  rubric?: { id: string; label: string; points: number }[]
}
export type QuestionRecord = {
  id: string
  title: string
  /** Business labels remain independent from the response model. */
  kind: string
  response?: ResponseModel
  points: number
  answerFieldCount?: number
  stem: ReactNode
  /** Ordered material blocks preserve text / figure / table interleaving. */
  blocks?: { id: string; content: ReactNode }[]
  options?: { id: string; content: ReactNode }[]
  optionColumns?: 1 | 2 | 4
  figure?: ReactNode
  parts?: QuestionPart[]
  answer?: ReactNode
  explanation?: ReactNode
}

export function QuestionContent({ question }: { question: QuestionRecord }) {
  return <div className="prism-question-copy min-w-0 text-read-body text-foreground">
    <div className="q-question-material" data-has-figure={!!question.figure||undefined}>
      <div className="min-w-0">
        <div className="q-question-stem space-y-3">{question.stem}</div>
        {question.blocks?.map(block => <div key={block.id} className="my-4 min-w-0">{block.content}</div>)}
      </div>
      {question.figure}
    </div>
    {question.options && <ol aria-label="题目选项（只读）" className={`prism-question-options prism-question-options-${question.optionColumns ?? 1} mt-5 grid gap-x-8 gap-y-3`}>
      {question.options.map(option => <li key={option.id} className="flex min-w-0 items-baseline gap-3"><span className="shrink-0 font-medium">{option.id}.</span><div className="min-w-0">{option.content}</div></li>)}
    </ol>}
    {question.parts && <ol aria-label="题目小问" className="q-question-parts mt-5 space-y-5">{question.parts.map(part => {
      const presentation = responsePresentation(part.response ?? question.response)
      return <li key={part.id} data-part-id={part.id} className="flex min-w-0 gap-2">
        <span className="q-part-number shrink-0">（{part.id}）</span>
        <div className="min-w-0 flex-1">
          {(presentation || part.points !== undefined) && <div className="mb-2"><span className="q-part-identity inline-flex flex-wrap items-center gap-2" data-question-tone={presentation?.tone ?? "neutral"}>
            {presentation && <QuestionTypeLabel label={presentation.label} tone={presentation.tone} inline/>}
            {part.points !== undefined && <QuestionPoints points={part.points} tone={presentation?.tone ?? "neutral"}/>}
          </span></div>}
          {part.content}
          {part.options && <ol aria-label={`第${part.id}小问选项（只读）`} className="q-part-options mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-2">{part.options.map(option => <li key={option.id} className="flex min-w-0 items-baseline gap-3"><span className="shrink-0 font-medium">{option.id}.</span><div className="min-w-0">{option.content}</div></li>)}</ol>}
        </div>
      </li>
    })}</ol>}
  </div>
}

export function QuestionSolution({ question }: { question: QuestionRecord }) {
  return <div className="question-solution prism-question-copy space-y-5 text-read-body"><section><h4 className="mb-2 text-block-title">参考答案</h4>{question.answer}</section><section><h4 className="mb-2 text-block-title">解析</h4>{question.explanation}</section>{question.parts?.filter(part => part.answer).map(part => <section key={part.id} className="pt-1" aria-label={`第${part.id}小问答案与评分依据`}><h4 className="mb-2 text-block-title">第 {part.id} 小问 · {part.points} 分</h4><div>{part.answer}</div><div className="mt-2 text-foreground">{part.explanation}</div>{part.rubric && <ol className="q-rubric mt-3 space-y-1 text-ui-body">{part.rubric.map(item => <li key={item.id}>{item.label} · {item.points} 分</li>)}</ol>}</section>)}</div>
}

export function QuestionMath({ children, label, block = false }: { children: ReactNode; label: string; block?: boolean }) {
  const math = <math className="prism-math" display={block ? "block" : "inline"} aria-label={label}>{children}</math>
  return block ? <div className="prism-question-equation" role="group" aria-label={label} tabIndex={0}>{math}</div> : math
}
