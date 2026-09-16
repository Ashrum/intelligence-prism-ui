"use client"
import { QuestionReview, type QuestionReviewProps } from "../question-review"
import { compositeQuestion } from "@/components/prism-next/fixtures/question-composite-samples"
import { initialReviewScores, reviewAttempts } from "@/lib/prism-next/fixtures/review"
export function QuestionReviewDemo(props:Pick<QuestionReviewProps,"editor"|"onEditorChange"|"onConfirm">){return <QuestionReview {...props} question={compositeQuestion} attempts={reviewAttempts} initialScores={initialReviewScores} learner="示例学生" description="人工编写的作答与初评分；复核结果保留在当前示例。" initialNote="第 2 问混淆新增水量与总水量；第 3 问遗漏定义域。"/>}
