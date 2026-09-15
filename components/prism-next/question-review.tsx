"use client"
import { useState } from "react"
import { Button } from "@/components/coss/button"
import { Textarea } from "@/components/coss/textarea"
import { Label } from "@/components/coss/label"
import { Tabs, TabsList, TabsTab, TabsPanel } from "@/components/coss/tabs"
import { compositeQuestion } from "./question-composite-samples"
import { QuestionContent, QuestionSolution } from "./question-content"
import { PointsField } from "./question-controls"
import { reviewError } from "@/lib/prism-next/question-workspace"

const criteria = compositeQuestion.parts!.flatMap(part => part.rubric!.map(item=>({...item,label:`第 ${part.id} 问 · ${item.label}`})))
const initial = {choice:4,fill:0,inequality:2,solve:2,domain:0,maximum:2}
const limits = Object.fromEntries(criteria.map(item=>[item.id,item.points]))
export function QuestionReview() {
  const [scores,setScores] = useState<Record<string,number|null>>(initial)
  const [saved,setSaved] = useState<Record<string,number>>(initial)
  const [reason,setReason] = useState("")
  const [record,setRecord] = useState("")
  const [error,setError] = useState("")
  const [references,setReferences] = useState(false)
  const dirty = criteria.some(item=>scores[item.id]!==saved[item.id]) || !!reason.trim()
  const total = Object.values(scores).reduce<number>((sum,value)=>sum+(value??0),0)
  return <div className="space-y-6"><p className="text-sm text-muted-foreground">示例学生 · 人工编写的作答与初评分。此处演示回看、评分点调整和就地复核，结果保留在当前页面。</p><Tabs defaultValue="review"><TabsList aria-label="作答与复核视图"><TabsTab value="attempt">作答回看</TabsTab><TabsTab value="review">教师复核</TabsTab></TabsList><div className="mt-5 grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,1fr)]"><div className="min-w-0 space-y-5"><h3 className="text-lg font-semibold">{compositeQuestion.title}</h3><QuestionContent question={compositeQuestion}/><section className="rounded-xl border bg-muted/30 p-5" aria-label="示例学生作答"><h4 className="mb-3 font-semibold">学生作答</h4><ol className="space-y-3 leading-7"><li>第 1 问：A。</li><li>第 2 问：27 L。计算：V(3) − V(0) = 47 − 20 = 27。</li><li>第 3 问：① −t² + 12t + 20 ≥ 52，得 (t − 4)(t − 8) ≤ 0，所以 4 ≤ t ≤ 8。② V(t) = 56 − (t − 6)²，t = 6 时最大水量为 56 L。</li></ol></section><Button variant="outline" onClick={()=>setReferences(!references)}>{references?"收起参考答案与评分依据":"查看参考答案与评分依据"}</Button>{references && <QuestionSolution question={compositeQuestion}/>}</div><div className="min-w-0"><TabsPanel value="attempt"><section className="rounded-xl border p-5"><h4 className="font-semibold">已记录成绩 {Object.values(saved).reduce((a,b)=>a+b,0)} / 16</h4><p className="mt-3 text-sm leading-7 text-muted-foreground">填空混淆新增水量和总水量；第 3 问遗漏定义域。最大值推导正确，保留对应分数。</p>{record && <p className="mt-3 text-sm">复核记录：{record}</p>}</section></TabsPanel><TabsPanel value="review"><section className="rounded-xl border p-5"><div className="mb-5 flex flex-wrap justify-between gap-2"><h4 className="font-semibold">评分点复核</h4><span className="tabular-nums">草稿 {total} / 16</span></div><div className="space-y-5">{criteria.map(item=><div key={item.id} className="flex flex-wrap items-center justify-between gap-3"><p className="min-w-0 flex-1 text-sm leading-6">{item.label}<span className="block text-xs text-muted-foreground">上限 {item.points} 分</span></p><PointsField label={item.label} value={scores[item.id]} max={item.points} onChange={value=>{setScores(previous=>({...previous,[item.id]:value}));setError("")}}/></div>)}</div><div className="mt-6 space-y-2"><Label htmlFor="question-review-reason">复核理由{criteria.some(item=>scores[item.id]!==saved[item.id])?"（调整分数后必填）":""}</Label><Textarea id="question-review-reason" value={reason} onChange={event=>setReason(event.target.value)} placeholder="说明调整了哪个评分点，以及依据。"/></div>{error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}<div className="mt-4 flex flex-wrap gap-2"><Button disabled={!dirty && !!record} onClick={()=>{const message=reviewError(scores,limits,saved,reason);setError(message);if(!message){setSaved(scores as Record<string,number>);setRecord(reason.trim() || "复核确认，维持各评分点原分数。");setReason("")}}}>确认复核</Button><Button variant="outline" disabled={!dirty} onClick={()=>{setScores({...saved});setReason("");setError("")}}>取消修改</Button></div><p className="mt-4 text-sm text-muted-foreground" role="status">{record?`已记录复核：${record}`:"初评分 10 / 16。单个错误仅影响对应评分点。"}</p></section></TabsPanel></div></div></Tabs></div>
}
