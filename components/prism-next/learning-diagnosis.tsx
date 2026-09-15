"use client"

import { useState } from "react"
import { Button } from "@/components/coss/button"
import { Badge } from "@/components/coss/badge"
import { Field, FieldLabel } from "@/components/coss/field"
import { Textarea } from "@/components/coss/textarea"
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/coss/table"
import { QuestionWorkPanel } from "./question-work-panel"
import { QuestionContent } from "./question-content"
import { compositeQuestion } from "./question-composite-samples"
import { reviewAttempts } from "@/lib/prism-next/question-review-model"
import { useLearning } from "./learning-provider"
import { evidenceDefinitions, latestReview, diagnosisValid, type DiagnosisId, type Stage } from "@/lib/prism-next/learning-workflow"
import { futureDate, SourceNotice } from "./learning-controls"

export function LearningDiagnosis({ go, active }: { go: (stage: Stage) => void; active: boolean }) {
  const { state, dispatch } = useLearning()
  const [selected, setSelected] = useState<DiagnosisId | null>(null)
  const [note, setNote] = useState("")
  const [formError, setFormError] = useState("")
  const [showQuestion, setShowQuestion] = useState(false)
  const review = latestReview(state)
  const evidence = evidenceDefinitions.find(item => item.id === selected)
  const diagnosis = state.diagnoses.find(item => item.id === selected)
  const referenced = state.reviews.find(item => item.version === diagnosis?.sourceVersion) ?? review
  const part = compositeQuestion.parts?.find(item => item.id === evidence?.partId)
  const confirmed = state.diagnoses.filter(item => diagnosisValid(state, item)).length
  const action = (decision: "confirmed" | "rejected" | "pending") => {
    if (!note.trim()) { setFormError("请写明判断依据。"); return }
    dispatch({ type: "diagnosis", id: selected!, decision, note }); setSelected(null)
  }
  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div className="space-y-1"><h3 className="text-base font-semibold">从作答证据到教学判断</h3><p className="text-sm leading-6 text-muted-foreground">2 个候选 · {confirmed} 个当前有效判断。单次作答仅支持本次观察，不代表稳定能力结论。</p></div><Button disabled={!confirmed} onClick={() => { dispatch({ type: "create-goal", due: futureDate(7) }); go("goals") }}>创建目标草稿</Button></div>
    {!review && <SourceNotice>评价尚未确认。可先查看证据，完成教师复核后再确认诊断。<Button variant="ghost" size="sm" onClick={() => go("evaluation")}>前往评价</Button></SourceNotice>}
    <Table><TableHeader><TableRow><TableHead>观察与证据</TableHead><TableHead>课程定位</TableHead><TableHead>判断状态</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader><TableBody>{evidenceDefinitions.map(item => {
      const d = state.diagnoses.find(d => d.id === item.id)!
      const stale = !!d.sourceVersion && d.sourceVersion !== review?.version
      return <TableRow key={item.id}><TableCell className="min-w-60 max-w-lg whitespace-normal"><p className="font-medium">{item.title}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{item.observed}</p><p className="mt-2 text-xs text-muted-foreground">Q-M-006 · 第 {item.partId} 问 · {d.sourceVersion ? `评价 v${d.sourceVersion}` : review ? `评价 v${review.version} · 待诊断` : "初评分未确认"}</p></TableCell><TableCell className="min-w-36 whitespace-normal leading-6">{item.curriculum}</TableCell><TableCell><Badge variant={stale ? "warning" : d.decision === "confirmed" ? "success" : "outline"}>{stale ? "来源已变化" : d.decision === "confirmed" ? "已确认" : d.decision === "rejected" ? "已排除" : "待复核"}</Badge></TableCell><TableCell className="text-right"><Button disabled={!!selected} variant="outline" aria-controls="learning-evidence" onClick={() => { setSelected(item.id); setNote(d.note); setFormError(""); setShowQuestion(false) }}>查看证据</Button></TableCell></TableRow>
    })}</TableBody></Table>
    <p className="text-sm leading-6 text-muted-foreground">确认后才能作为目标来源；排除会保留判断记录。评价变更后，诊断需要再次人工复核。</p>
    <QuestionWorkPanel id="learning-evidence" open={active && !!selected} title={evidence?.title ?? "诊断证据"} description="对照原始作答、评分点和参考解析，确认这一次作答的教学判断。" onClose={() => setSelected(null)} footer={<><Button disabled={!review} onClick={() => action("confirmed")}>确认判断</Button><Button variant="outline" disabled={!review} onClick={() => action("rejected")}>排除候选</Button></>}>
      {evidence && diagnosis && part && <div className="space-y-6">
        <div className="space-y-1 text-xs leading-6 text-muted-foreground"><p>示例学生 DEMO-001 · 作答 DEMO-A</p><p>题目 Q-M-006 v1 · 评分标准 v1 · {referenced ? `评价 v${referenced.version}` : "初评分未确认"}</p><p className="break-all">评分点 Q-M-006/{evidence.partId}/{evidence.criterionId}</p></div>
        {diagnosis.sourceVersion && diagnosis.sourceVersion !== review?.version && <SourceNotice>此判断引用旧评价。请检查当前 v{review?.version}，重新确认后才更新来源。</SourceNotice>}
        <section className="space-y-3"><h4 className="text-sm font-semibold">第 {part.id} 问题面</h4><div className="prism-question-copy text-base leading-7">{part.content}</div><Button variant="ghost" size="sm" aria-expanded={showQuestion} onClick={() => setShowQuestion(!showQuestion)}>{showQuestion ? "收起共享材料" : "查看共享材料"}</Button>{showQuestion && <QuestionContent question={compositeQuestion} />}</section>
        <section className="space-y-2"><h4 className="text-sm font-semibold">原始作答</h4><blockquote className="border-l-2 pl-4 text-base leading-7">{reviewAttempts[part.id]}</blockquote></section>
        <section className="space-y-2 rounded-lg bg-muted/50 p-4"><h4 className="text-sm font-semibold">参考答案与依据</h4><div className="prism-question-copy text-base leading-7">{part.answer}<div className="mt-3">{part.explanation}</div></div></section>
        <p className="text-sm leading-6">引用评分：{referenced?.scores[evidence.criterionId] ?? 0} 分{review && referenced?.version !== review.version && <> · 当前评分：{review.scores[evidence.criterionId]} 分</>}</p>
        <Field><FieldLabel htmlFor="diagnosis-note">判断与后续验证建议</FieldLabel><Textarea id="diagnosis-note" value={note} onChange={event => { setNote(event.target.value); setFormError("") }} /></Field>
        {formError && <p role="alert" className="text-sm text-destructive-foreground">{formError}</p>}
        {diagnosis.decision !== "pending" && <Button variant="ghost" onClick={() => action("pending")}>恢复待复核</Button>}
      </div>}
    </QuestionWorkPanel>
  </div>
}
