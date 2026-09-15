"use client"

import { useId, type ReactNode } from "react"
import { Expand } from "lucide-react"
import { Button } from "@/components/coss/button"
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/coss/dialog"
import type { DirectorySelections } from "@/components/prism-next/textbook-directory"

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
  stem: ReactNode
  /** Ordered material blocks preserve text / figure / table interleaving. */
  blocks?: { id: string; content: ReactNode }[]
  options?: { id: string; content: ReactNode }[]
  optionColumns?: 1 | 2 | 4
  figure?: ReactNode
  parts?: QuestionPart[]
  answer: ReactNode
  explanation: ReactNode
  initialLinks?: DirectorySelections
}

export function QuestionContent({ question }: { question: QuestionRecord }) {
  return <div className="prism-question-copy min-w-0 text-base leading-[1.9] text-foreground">
    <div className="space-y-3">{question.stem}</div>
    {question.blocks?.map(block => <div key={block.id} className="my-4 min-w-0">{block.content}</div>)}
    {question.figure}
    {question.options && <ol aria-label="题目选项（只读）" className={`prism-question-options prism-question-options-${question.optionColumns ?? 1} mt-5 grid gap-x-8 gap-y-3`}>
      {question.options.map(option => <li key={option.id} className="flex min-w-0 items-baseline gap-3"><span className="shrink-0 font-medium">{option.id}.</span><div className="min-w-0">{option.content}</div></li>)}
    </ol>}
    {question.parts && <ol aria-label="题目小问" className="mt-5 space-y-5">{question.parts.map(part => <li key={part.id} data-part-id={part.id} className="flex min-w-0 gap-2"><span className="shrink-0">（{part.id}）</span><div className="min-w-0 flex-1">{part.points !== undefined && <p className="mb-1 text-sm text-muted-foreground">{part.response === "single" ? "单选" : part.response === "fill" ? "填空" : part.response === "boolean" ? "判断" : "解答"} · {part.points} 分</p>}{part.content}{part.options && <ol aria-label={`第${part.id}小问选项（只读）`} className="mt-3 grid gap-2 sm:grid-cols-2">{part.options.map(option => <li key={option.id} className="flex gap-3"><span>{option.id}.</span>{option.content}</li>)}</ol>}</div></li>)}</ol>}
  </div>
}

export function QuestionSolution({ question }: { question: QuestionRecord }) {
  return <div className="prism-question-copy space-y-5 text-base leading-[1.9]"><section><h4 className="mb-2 text-sm font-semibold">参考答案</h4>{question.answer}</section><section><h4 className="mb-2 text-sm font-semibold">解析</h4>{question.explanation}</section>{question.parts?.filter(part => part.answer).map(part => <section key={part.id} className="border-t pt-4" aria-label={`第${part.id}小问答案与评分依据`}><h4 className="mb-2 font-medium">第 {part.id} 小问 · {part.points} 分</h4><div>{part.answer}</div><div className="mt-2 text-muted-foreground">{part.explanation}</div>{part.rubric && <ul className="mt-3 space-y-1 text-sm">{part.rubric.map(item => <li key={item.id}>{item.label} · {item.points} 分</li>)}</ul>}</section>)}</div>
}

export function QuestionMath({ children, label, block = false }: { children: ReactNode; label: string; block?: boolean }) {
  const math = <math className="prism-math" display={block ? "block" : "inline"} aria-label={label}>{children}</math>
  return block ? <div className="prism-question-equation" role="group" aria-label={label} tabIndex={0}>{math}</div> : math
}

// Mathematical geometry, with coordinates mapped directly from O(0,0),
// A(6,0), B(0,4), and the illustrative M(2.4,2.4).
export function CoordinateDiagram() {
  const id = useId()
  return <svg viewBox="0 0 480 310" className="block h-auto w-full text-foreground" role="img" aria-labelledby={`${id}-title ${id}-description`}>
    <title id={`${id}-title`}>直角坐标系中的矩形 ONMP</title>
    <desc id={`${id}-description`}>O为原点，A在x轴坐标6处，B在y轴坐标4处。M为线段AB上的示意点，N和P分别为其在x轴和y轴上的垂足。四点O、N、M、P构成矩形。</desc>
    <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M34 260H435m-9 -5 9 5-9 5M65 282V25m-5 9 5-9 5 9" />
      <path d="M65 60 395 260" strokeWidth="2" />
      <path d="M65 260H197V140H65Z" fill="currentColor" fillOpacity=".045" />
      <path d="M187 260v-10h10M65 150h10v-10" strokeWidth="1" />
    </g>
    <g fill="currentColor"><circle cx="197" cy="140" r="3"/><circle cx="395" cy="260" r="2.5"/><circle cx="65" cy="60" r="2.5"/></g>
    <g fill="currentColor" fontSize="17" fontFamily="system-ui,sans-serif">
      <text x="44" y="280">O</text><text x="385" y="286">A(6, 0)</text><text x="78" y="58">B(0, 4)</text><text x="205" y="136">M</text><text x="191" y="283">N</text><text x="42" y="145">P</text><text x="444" y="265" fontStyle="italic">x</text><text x="73" y="24" fontStyle="italic">y</text>
    </g>
  </svg>
}

export function QuestionFigure() {
  return <figure className="my-5 w-full max-w-[28rem]">
    <CoordinateDiagram />
    <figcaption className="mt-1 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground"><span>M 为示意位置。</span><Dialog><DialogTrigger render={<Button variant="ghost" size="sm" />}><Expand />放大图形</DialogTrigger><DialogPopup className="max-w-3xl" closeProps={{ "aria-label": "关闭图形" }}><DialogHeader><DialogTitle>题目图形</DialogTitle><DialogDescription>M 为线段 AB 上的动点，此图不增加额外已知条件。</DialogDescription></DialogHeader><div className="min-h-0 overflow-auto px-6 pb-6"><CoordinateDiagram /></div></DialogPopup></Dialog></figcaption>
  </figure>
}
