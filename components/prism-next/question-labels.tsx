"use client"

import { Badge } from "@/components/prism-next/badge"
import type { QuestionRecord, ResponseModel } from "./question-content"

export type QuestionTone = "blue" | "magenta" | "lime" | "neutral"
const responses: Record<ResponseModel, { label: string; tone: QuestionTone }> = {
  single: { label: "单选", tone: "blue" },
  multiple: { label: "多选", tone: "blue" },
  fill: { label: "填空", tone: "blue" },
  boolean: { label: "判断", tone: "blue" },
  long: { label: "解答", tone: "magenta" },
}

/** Presentation groups describe response formats, never grading policy. */
export function responsePresentation(response?: ResponseModel) {
  return response && Object.hasOwn(responses, response) ? responses[response] : undefined
}

export function questionTone(question: Pick<QuestionRecord, "response" | "parts">): QuestionTone {
  const models = question.parts?.length
    ? question.parts.map(part => part.response ?? question.response)
    : [question.response]
  const known = models.map(responsePresentation)
  // Incomplete metadata stays neutral rather than inventing a classification.
  if (known.some(value => !value)) return "neutral"
  return new Set(models).size > 1 ? "lime" : known[0]?.tone ?? "neutral"
}

export function QuestionTypeLabel({ label, tone, inline = false }: { label: string; tone: QuestionTone; inline?: boolean }) {
  const content = label
  return inline
    ? <span className="q-type-text inline-flex items-center gap-1.5 text-ui-body" data-question-tone={tone}>{content}</span>
    : <Badge variant="outline" size="lg" className="q-type-label" data-question-tone={tone}>{content}</Badge>
}

export function QuestionPoints({ points, tone }: { points: number; tone: QuestionTone }) {
  return <Badge variant="secondary" size="lg" className="q-score tabular-nums" data-question-tone={tone}>{points} 分</Badge>
}
