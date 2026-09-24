"use client"
import { useId, useState, type Dispatch, type SetStateAction } from "react"
import { createReviewEditor, type ReviewEditor } from "@/lib/prism-next/question-review-model"
import { Button } from "@/components/coss/button"
import { Textarea } from "@/components/coss/textarea"
import { Label } from "@/components/coss/label"
import { Tabs, TabsList, TabsTab } from "@/components/coss/tabs"
import { QuestionContent, type QuestionRecord } from "./question-content"
import { PointsField } from "./question-controls"
import { reviewError } from "@/lib/prism-next/question-workspace"

export type QuestionReviewProps={question:QuestionRecord;attempts:Record<string,React.ReactNode>;initialScores:Record<string,number>;learner?:string;description?:string;initialNote?:string;editor?:ReviewEditor;onEditorChange?:Dispatch<SetStateAction<ReviewEditor>>;onConfirm?:(scores:Record<string,number>,reason:string)=>void}
export function QuestionReview({question,attempts,initialScores,learner,description,initialNote,editor,onEditorChange,onConfirm}:QuestionReviewProps) {
  const perPart = question.parts?.length && question.parts.every(part => part.rubric?.length || (part.points !== undefined && Number.isFinite(part.points)))
  const parts = perPart ? question.parts!.map(part => ({...part,rubric:part.rubric?.length?part.rubric:[{id:`${part.id}-score`,label:"小问得分",points:part.points!}]})) : [{id:"1",content:question.parts?.length?<QuestionContent question={question}/>:question.stem,points:question.points,answer:question.answer,explanation:question.explanation,rubric:[{id:"score",label:"整题得分",points:question.points}]}]
  const attemptFor = (id:string) => !perPart && question.parts?.length ? <div className="space-y-2">{Object.entries(attempts).map(([key,value])=><div key={key}>（{key}）{value}</div>)}</div> : attempts[id]
  const criteria=parts.flatMap(part=>(part.rubric??[]).map(item=>({...item,label:`第 ${part.id} 问 · ${item.label}`})))
  const limits=Object.fromEntries(criteria.map(item=>[item.id,item.points]))
  const initial=Object.fromEntries(criteria.filter(item=>initialScores[item.id]!==undefined).map(item=>[item.id,initialScores[item.id]]))
  const maximum=criteria.reduce((sum,item)=>sum+item.points,0)
  const [local,setLocal]=useState(()=>createReviewEditor(initial))
  const reasonId=useId()
  const controlled=editor!==undefined && onEditorChange!==undefined
  const {scores,saved,reason,record,error}=controlled?editor:local
  const change=controlled?onEditorChange:setLocal
  const setScores=(value:Record<string,number|null>|((previous:Record<string,number|null>)=>Record<string,number|null>))=>change(previous=>({...previous,scores:typeof value==="function"?value(previous.scores):value}))
  const setReason=(reason:string)=>change(previous=>({...previous,reason}))
  const setError=(error:string)=>change(previous=>({...previous,error}))
  const [references,setReferences]=useState(false),[material,setMaterial]=useState(false),[view,setView]=useState("review")
  const dirty=criteria.some(item=>scores[item.id]!==saved[item.id])||!!reason.trim()
  const total=criteria.reduce((sum,item)=>sum+(scores[item.id]??0),0)
  return <div className="space-y-6">
    <header className="space-y-2"><h3 className="text-block-title">{question.title}</h3><p className="text-ui-hint text-muted-foreground">{learner?`${learner} · `:""}{question.id} · 原题 {question.points} 分</p><p className="text-ui-hint text-muted-foreground">{description}</p></header>
    <div className="flex flex-wrap items-center justify-between gap-3"><Tabs value={view} onValueChange={value=>setView(String(value))}><TabsList aria-label="作答回看与教师复核视图"><TabsTab value="attempt">作答回看</TabsTab><TabsTab value="review">教师复核</TabsTab></TabsList></Tabs><div className="flex flex-wrap gap-2"><Button variant="outline" aria-expanded={material} onClick={()=>setMaterial(!material)}>{material?"收起完整题面":"查看完整题面"}</Button><Button variant="outline" aria-pressed={references} onClick={()=>setReferences(!references)}>{references?"隐藏参考依据":"显示参考依据"}</Button></div></div>
    {material&&<div className="rounded-lg bg-muted/50 p-5"><QuestionContent question={question}/></div>}
    <div className="flex flex-wrap gap-5 rounded-lg bg-muted/50 p-4 text-ui-body"><span>初评得分 <strong className="tabular-nums">{criteria.some(item=>initial[item.id]===undefined)?"待评分":`${Object.values(initial).reduce((a,b)=>a+b,0)} / ${maximum}`}</strong></span><span>已记录得分 <strong className="tabular-nums">{criteria.some(item=>saved[item.id]===undefined)?"待评分":`${Object.values(saved).reduce((a,b)=>a+b,0)} / ${maximum}`}</strong></span>{view==="review"&&<span>复核中得分 <strong className="tabular-nums">{criteria.some(item=>scores[item.id]==null)?`已评 ${total} 分 · 有待评分项`:`${total} / ${maximum}`}</strong></span>}</div>
    <div className="space-y-8">{parts.map(part=><section key={part.id} aria-label={`第${part.id}小问作答与评分`} className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(16rem,1fr)]"><div className="min-w-0 space-y-3"><h4 className="font-semibold">第 {part.id} 小问 · {part.points} 分</h4><div className="prism-question-copy text-read-body">{part.content}</div><div><p className="mb-2 text-ui-action">学生作答</p><blockquote className="border-l-2 pl-4 text-read-body">{attemptFor(part.id)}</blockquote></div>{references&&<div className="question-solution prism-question-copy rounded-lg bg-muted/50 p-4 text-read-body"><h5 className="mb-2 text-item-title">参考答案与解析</h5><div>{part.answer}</div><div className="mt-3">{part.explanation}</div></div>}</div><div className="space-y-4 lg:pt-9">{(part.rubric??[]).map(item=><div key={item.id} className="flex items-center justify-between gap-3"><div className="min-w-0 text-ui-hint"><p>{item.label}</p><p className="text-ui-hint text-muted-foreground">初评 {initial[item.id]??"未评分"} 分 · 上限 {item.points} 分</p></div>{view==="review"?<PointsField label={`第 ${part.id} 问 · ${item.label}`} value={scores[item.id]??null} max={item.points} onChange={value=>{setScores(previous=>({...previous,[item.id]:value}));setError("")}}/>:<span className="shrink-0 tabular-nums">{saved[item.id]??"未评分"} / {item.points}</span>}</div>)}</div></section>)}</div>
    <p className="text-ui-hint text-muted-foreground">{initialNote}</p>
    {view==="review"&&<section className="space-y-4 rounded-lg bg-muted/50 p-5"><div className="space-y-2"><Label htmlFor={reasonId}>复核理由{criteria.some(item=>scores[item.id]!==saved[item.id])?"（调整分数后必填）":""}</Label><Textarea id={reasonId} value={reason} onChange={event=>setReason(event.target.value)} placeholder="说明调整的评分点与依据。"/></div>{error&&<p role="alert" className="text-ui-body text-destructive">{error}</p>}<div className="flex flex-wrap gap-2"><Button disabled={!dirty&&!!record} onClick={()=>{const message=reviewError(scores,limits,saved,reason);setError(message);if(!message){change(previous=>({...previous,saved:{...scores} as Record<string,number>,record:reason.trim()||"复核确认，维持各评分点原分数。",reason:""}));onConfirm?.(scores as Record<string,number>,reason)}}}>确认复核</Button><Button variant="outline" disabled={!dirty} onClick={()=>{setScores({...saved});setReason("");setError("")}}>取消修改</Button></div></section>}
    <p role="status" className="text-ui-body">{record?`最新复核记录：${record}`:"尚未提交教师复核。"}</p>
  </div>
}
