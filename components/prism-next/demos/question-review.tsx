"use client"
import { useState } from "react"
import { QuestionReview, type QuestionReviewProps } from "../question-review"
import { compositeQuestion } from "@/components/prism-next/fixtures/question-composite-samples"
import { initialReviewScores, reviewAttempts } from "@/lib/prism-next/fixtures/review"
export function QuestionReviewDemo(props:Pick<QuestionReviewProps,"editor"|"onEditorChange"|"onConfirm"|"status">){
 const [notice,setNotice]=useState("")
 return <><QuestionReview {...props} onConfirm={props.onConfirm??(()=>setNotice("已发出复核确认意图；示例未接入回执。"))} question={compositeQuestion} attempts={reviewAttempts} initialScores={initialReviewScores} learner="示例学生" description="人工编写的作答与初评分；确认仅发出意图，状态由调用方示例记录提供。" initialNote="第 2 问混淆新增水量与总水量；第 3 问遗漏定义域。"/>{notice&&<p role="status" className="mt-4 text-ui-hint text-muted-foreground">{notice}</p>}</>
}
