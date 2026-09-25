"use client"
import { useState } from "react"
import { Button } from "@/components/coss/button"
import { QuestionReview, type QuestionReviewProps } from "../question-review"
import type { AgentItemReview } from "../agent-item-reviewer"
import { createReviewEditor } from "@/lib/prism-next/question-review-model"
import { compositeQuestion } from "@/components/prism-next/fixtures/question-composite-samples"
import { initialReviewScores, reviewAttempts } from "@/lib/prism-next/fixtures/review"

type ExampleProps = QuestionReviewProps & { onRecord?: QuestionReviewProps["onConfirm"] }

/** Example host only: a separate, explicit fixture receipt advances the review. No timer or service. */
export function QuestionReviewExample({ editor, onEditorChange, onConfirm, onRecord, review: suppliedReview, ...props }: ExampleProps) {
  const [local, setLocal] = useState(() => createReviewEditor(props.initialScores))
  const value = editor !== undefined && onEditorChange !== undefined ? editor : local
  const change = editor !== undefined && onEditorChange !== undefined ? onEditorChange : setLocal
  const [review, setReview] = useState<AgentItemReview>({ state: "waiting-human", description: "示例作答，等待人工复核。" })
  const [pending, setPending] = useState<{ scores: Record<string, number>; reason: string }>()
  return <div className="space-y-4">
    <p className="text-ui-hint text-muted-foreground">示例：确认后进入提交中，再手动载入示例回执；未连接真实复核服务。</p>
    <QuestionReview {...props} editor={value} onEditorChange={update => {
      change(update)
      setPending(undefined)
      setReview({ state: "draft", description: "示例草稿已变更，需重新确认。" })
    }} review={suppliedReview ?? review} onConfirm={(scores, reason) => {
      setPending({ scores: { ...scores }, reason })
      setReview({ state: "waiting", description: "示例请求已提交，等待示例回执。", request: { id: `${props.question.id}-example-review`, label: "本次示例复核请求" } })
      onConfirm?.(scores, reason)
    }} />
    {!suppliedReview && <Button variant="outline" disabled={!pending} onClick={() => {
      if (!pending) return
      const record = pending.reason.trim() || "复核确认，维持各评分点原分数。"
      change(previous => ({ ...previous, saved: { ...pending.scores }, record, reason: "", error: "" }))
      setReview({ state: "resolved", description: `示例复核记录：${record}`, resolution: { reviewer: "示例教师", version: "示例版本" } })
      setPending(undefined)
      onRecord?.({ ...pending.scores }, pending.reason)
    }}>载入示例回执</Button>}
  </div>
}

export function QuestionReviewDemo(props: Pick<ExampleProps, "editor" | "onEditorChange" | "onConfirm" | "onRecord" | "review">) {
  return <QuestionReviewExample {...props} question={compositeQuestion} attempts={reviewAttempts} initialScores={initialReviewScores} learner="示例学生" description="人工编写的作答与初评分；复核结果保留在当前示例。" initialNote="第 2 问混淆新增水量与总水量；第 3 问遗漏定义域。" />
}
