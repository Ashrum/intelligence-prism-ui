"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

export type ResponseModel = "single" | "multiple" | "fill" | "boolean" | "long"
const responseLabels: Record<ResponseModel, string> = { single: "单选", multiple: "多选", fill: "填空", boolean: "判断", long: "解答" }
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
  /** Optional host-supplied difficulty label; never inferred from the content. */
  difficulty?: string
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
    <div className="space-y-3">{question.stem}</div>
    {question.blocks?.map(block => <div key={block.id} className="my-4 min-w-0">{block.content}</div>)}
    {question.figure}
    {question.options && <ol aria-label="题目选项（只读）" className={`prism-question-options prism-question-options-${question.optionColumns ?? 2} mt-5 grid gap-x-8 gap-y-3`}>
      {question.options.map(option => <li key={option.id} className="flex min-w-0 items-baseline gap-3"><span className="shrink-0 font-medium">{option.id}.</span><div className="min-w-0">{option.content}</div></li>)}
    </ol>}
    {question.parts && <ol aria-label="题目小问" className="mt-5 space-y-5">{question.parts.map(part => <li key={part.id} data-part-id={part.id} className="flex min-w-0 gap-2"><span className="shrink-0">（{part.id}）</span><div className="min-w-0 flex-1">{(part.response || part.points !== undefined) && <p className="mb-1 text-ui-hint text-muted-foreground">{responseLabels[part.response ?? "long"]}{part.points !== undefined && <> · {part.points} 分</>}</p>}{part.content}{part.options && <ol aria-label={`第${part.id}小问选项（只读）`} className="prism-question-options prism-question-options-2 mt-3 grid gap-2">{part.options.map(option => <li key={option.id} className="flex min-w-0 gap-3"><span className="shrink-0">{option.id}.</span><div className="min-w-0">{option.content}</div></li>)}</ol>}</div></li>)}</ol>}
  </div>
}

export function QuestionSolution({ question }: { question: QuestionRecord }) {
  const provided = (value: ReactNode, fallback: string) => value == null || typeof value === "boolean" || typeof value === "string" && !value.trim()
    ? <p className="text-ui-hint text-muted-foreground">{fallback}</p> : value
  return <div className="question-solution prism-question-copy min-w-0 space-y-5 text-read-body"><section><h4 className="mb-2 text-item-title">参考答案</h4>{provided(question.answer, "未提供参考答案")}</section><section><h4 className="mb-2 text-item-title">解析</h4>{provided(question.explanation, "未提供解析")}</section>{question.parts?.map(part => <section key={part.id} className="pt-1" aria-label={`第${part.id}小问答案与评分依据`}><h4 className="mb-2 text-item-title">第 {part.id} 小问{part.points !== undefined && <> · {part.points} 分</>}</h4><div>{provided(part.answer, "未提供参考答案")}</div><div className="mt-2 text-foreground">{provided(part.explanation, "未提供解析")}</div>{part.rubric && <ol className="q-rubric mt-3 space-y-1 text-ui-body">{part.rubric.map(item => <li key={item.id}>{item.label} · {item.points} 分</li>)}</ol>}</section>)}</div>
}

/** Observe actual overflow, including font loading; cues never cover or clip the formula. */
function QuestionEquation({ children, label }: { children: ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ left: false, right: false })
  useEffect(() => {
    const node = ref.current
    if (!node) return
    let active = true
    const update = () => { if (active) setEdges({ left: node.scrollLeft > 1, right: node.scrollWidth - node.clientWidth - node.scrollLeft > 1 }) }
    const observer = new ResizeObserver(update)
    observer.observe(node)
    if (node.firstElementChild) observer.observe(node.firstElementChild)
    node.addEventListener("scroll", update, { passive: true })
    void document.fonts.ready.then(update)
    update()
    return () => { active = false; observer.disconnect(); node.removeEventListener("scroll", update) }
  }, [])
  return <div className="relative min-w-0" data-question-equation="">
    <div ref={ref} className="prism-question-equation" role="group" aria-label={`${label}（超出宽度时可横向滚动）`} tabIndex={0}>{children}</div>
    {edges.left && <span aria-hidden="true" data-scroll-cue="left" className="pointer-events-none absolute inset-y-0 left-0 w-3 bg-linear-to-r from-border to-transparent" />}
    {edges.right && <span aria-hidden="true" data-scroll-cue="right" className="pointer-events-none absolute inset-y-0 right-0 w-3 bg-linear-to-l from-border to-transparent" />}
  </div>
}

export function QuestionMath({ children, label, block = false }: { children: ReactNode; label: string; block?: boolean }) {
  const math = <math className="prism-math" display={block ? "block" : "inline"} aria-label={label}>{children}</math>
  return block ? <QuestionEquation label={label}>{math}</QuestionEquation> : math
}
