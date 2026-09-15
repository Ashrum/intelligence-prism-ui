"use client"
import { useState } from "react"
import { Button } from "@/components/coss/button"
import { Textarea } from "@/components/coss/textarea"
import { Label } from "@/components/coss/label"
import { Tabs, TabsList, TabsTab } from "@/components/coss/tabs"
import { compositeQuestion } from "./question-composite-samples"
import { QuestionContent } from "./question-content"
import { PointsField } from "./question-controls"
import { reviewError } from "@/lib/prism-next/question-workspace"

const criteria=compositeQuestion.parts!.flatMap(part=>part.rubric!.map(item=>({...item,label:`第 ${part.id} 问 · ${item.label}`})))
const initial={choice:4,fill:0,inequality:2,solve:2,domain:0,maximum:2}
const limits=Object.fromEntries(criteria.map(item=>[item.id,item.points]))
const attempts:Record<string,string>={"1":"A。","2":"27 L。计算：V(3) − V(0) = 47 − 20 = 27。","3":"① −t² + 12t + 20 ≥ 52，得 (t − 4)(t − 8) ≤ 0，所以 4 ≤ t ≤ 8。② V(t) = 56 − (t − 6)²，t = 6 时最大水量为 56 L。"}
export function QuestionReview() {
  const [scores,setScores]=useState<Record<string,number|null>>(initial),[saved,setSaved]=useState<Record<string,number>>(initial)
  const [reason,setReason]=useState(""),[record,setRecord]=useState(""),[error,setError]=useState("")
  const [references,setReferences]=useState(false),[material,setMaterial]=useState(false),[view,setView]=useState("review")
  const dirty=criteria.some(item=>scores[item.id]!==saved[item.id])||!!reason.trim()
  const total=Object.values(scores).reduce<number>((sum,value)=>sum+(value??0),0)
  return <div className="space-y-6">
    <header className="space-y-2"><h3 className="text-lg font-semibold">{compositeQuestion.title}</h3><p className="text-sm text-muted-foreground">示例学生 · {compositeQuestion.id} · 原题 16 分</p><p className="text-sm text-muted-foreground">人工编写的作答与初评分；复核结果保留在本页。此记录独立于组卷分值。</p></header>
    <div className="flex flex-wrap items-center justify-between gap-3"><Tabs value={view} onValueChange={value=>setView(String(value))}><TabsList aria-label="作答回看与教师复核视图"><TabsTab value="attempt">作答回看</TabsTab><TabsTab value="review">教师复核</TabsTab></TabsList></Tabs><div className="flex flex-wrap gap-2"><Button variant="outline" aria-expanded={material} onClick={()=>setMaterial(!material)}>{material?"收起完整题面":"查看完整题面"}</Button><Button variant="outline" aria-pressed={references} onClick={()=>setReferences(!references)}>{references?"隐藏参考依据":"显示参考依据"}</Button></div></div>
    {material&&<div className="rounded-lg bg-muted/50 p-5"><QuestionContent question={compositeQuestion}/></div>}
    <div className="flex flex-wrap gap-5 rounded-lg bg-muted/50 p-4 text-sm"><span>初评得分 <strong className="tabular-nums">10 / 16</strong></span><span>已记录得分 <strong className="tabular-nums">{Object.values(saved).reduce((a,b)=>a+b,0)} / 16</strong></span>{view==="review"&&<span>复核中得分 <strong className="tabular-nums">{total} / 16</strong></span>}</div>
    <div className="space-y-8">{compositeQuestion.parts!.map(part=><section key={part.id} aria-label={`第${part.id}小问作答与评分`} className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(16rem,1fr)]"><div className="min-w-0 space-y-3"><h4 className="font-semibold">第 {part.id} 小问 · {part.points} 分</h4><div className="prism-question-copy text-base leading-7">{part.content}</div><div><p className="mb-2 text-sm font-medium">学生作答</p><blockquote className="border-l-2 pl-4 text-base leading-8">{attempts[part.id]}</blockquote></div>{references&&<div className="question-solution prism-question-copy rounded-lg bg-muted/50 p-4 text-base leading-8"><h5 className="mb-2 text-sm font-semibold">参考答案与解析</h5><div>{part.answer}</div><div className="mt-3">{part.explanation}</div></div>}</div><div className="space-y-4 lg:pt-9">{part.rubric!.map(item=><div key={item.id} className="flex items-center justify-between gap-3"><div className="min-w-0 text-sm leading-6"><p>{item.label}</p><p className="text-xs text-muted-foreground">初评 {initial[item.id as keyof typeof initial]} 分 · 上限 {item.points} 分</p></div>{view==="review"?<PointsField label={`第 ${part.id} 问 · ${item.label}`} value={scores[item.id]} max={item.points} onChange={value=>{setScores(previous=>({...previous,[item.id]:value}));setError("")}}/>:<span className="shrink-0 tabular-nums">{saved[item.id]} / {item.points}</span>}</div>)}</div></section>)}</div>
    <p className="text-sm leading-7 text-muted-foreground">初评说明：第 2 问混淆新增水量与总水量；第 3 问遗漏定义域，最大值推导正确。</p>
    {view==="review"&&<section className="space-y-4 rounded-lg bg-muted/50 p-5"><div className="space-y-2"><Label htmlFor="question-review-reason">复核理由{criteria.some(item=>scores[item.id]!==saved[item.id])?"（调整分数后必填）":""}</Label><Textarea id="question-review-reason" value={reason} onChange={event=>setReason(event.target.value)} placeholder="说明调整的评分点与依据。"/></div>{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}<div className="flex flex-wrap gap-2"><Button disabled={!dirty&&!!record} onClick={()=>{const message=reviewError(scores,limits,saved,reason);setError(message);if(!message){setSaved(scores as Record<string,number>);setRecord(reason.trim()||"复核确认，维持各评分点原分数。");setReason("")}}}>确认复核</Button><Button variant="outline" disabled={!dirty} onClick={()=>{setScores({...saved});setReason("");setError("")}}>取消修改</Button></div></section>}
    <p role="status" className="text-sm">{record?`最新复核记录：${record}`:"尚未提交教师复核。"}</p>
  </div>
}
