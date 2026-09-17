"use client"
import { useId, useRef, useState, type Dispatch, type SetStateAction } from "react"
import { Check, CircleAlert, Clock3 } from "lucide-react"
import { createReviewEditor, getReviewStatus, type ReviewEditor } from "@/lib/prism-next/question-review-model"
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
  const reasonRef=useRef<HTMLTextAreaElement>(null)
  const controlled=editor!==undefined && onEditorChange!==undefined
  const current=controlled?editor:local
  const {scores,saved,reason,record,error}=current
  const change=controlled?onEditorChange:setLocal
  const [references,setReferences]=useState(false),[material,setMaterial]=useState(false),[view,setView]=useState("review")
  const status=getReviewStatus(current,limits)
  const dirty=!!status.changed.length||!!reason.trim()
  const total=criteria.reduce((sum,item)=>sum+(Number.isFinite(scores[item.id])?scores[item.id]!:0),0)
  const savedComplete=criteria.every(item=>Number.isFinite(saved[item.id]))
  const initialComplete=criteria.every(item=>Number.isFinite(initial[item.id]))
  const savedTotal=criteria.reduce((sum,item)=>sum+(saved[item.id]??0),0)
  const initialTotal=criteria.reduce((sum,item)=>sum+(initial[item.id]??0),0)
  const historyChanged=criteria.some(item=>saved[item.id]!==initial[item.id])
  const reasonError=!!error&&!status.invalid.length&&!!status.changed.length&&!reason.trim()
  const showScoreErrors=!!error&&!!status.invalid.length
  const statusText={pending:"待复核",incomplete:"有待评分项",invalid:"评分需修正",changed:"评分有调整，待确认",note:"说明待提交",confirmed:"已确认复核"}[status.state]
  const statusTone=["incomplete","invalid","changed"].includes(status.state)?"warning":status.state==="confirmed"?"success":"neutral"
  const StatusIcon=statusTone==="success"?Check:statusTone==="warning"?CircleAlert:Clock3
  function updateScore(id:string,value:number|null) {
    change(previous=>{
      const next={...previous.scores,[id]:value}
      return {...previous,scores:next,error:previous.error?reviewError(next,limits,previous.saved,previous.reason):""}
    })
  }
  function confirm() {
    const message=reviewError(scores,limits,saved,reason)
    change(previous=>({...previous,error:message}))
    if(message) {
      if(!status.invalid.length) reasonRef.current?.focus()
      return
    }
    change(previous=>({...previous,saved:{...scores} as Record<string,number>,record:reason.trim()||"复核确认，维持各评分点原分数。",reason:"",error:""}))
    onConfirm?.(scores as Record<string,number>,reason)
  }
  return <div className="q-review space-y-6">
    <header className="space-y-2"><h3 className="text-lg font-semibold">{question.title}</h3><p className="text-sm text-muted-foreground">{learner?`${learner} · `:""}{question.id} · 原题 {question.points} 分</p>{description&&<p className="text-sm text-muted-foreground">{description}</p>}</header>
    <div className="flex flex-wrap items-center justify-between gap-3"><Tabs value={view} onValueChange={value=>setView(String(value))}><TabsList aria-label="作答回看与教师复核视图"><TabsTab value="attempt">作答回看</TabsTab><TabsTab value="review">教师复核</TabsTab></TabsList></Tabs><div className="flex flex-wrap gap-2"><Button variant="outline" aria-expanded={material} onClick={()=>setMaterial(!material)}>{material?"收起完整题面":"查看完整题面"}</Button><Button variant="outline" aria-pressed={references} onClick={()=>setReferences(!references)}>{references?"隐藏参考依据":"显示参考依据"}</Button></div></div>
    {material&&<div className="rounded-lg bg-muted/50 p-5"><QuestionContent question={question}/></div>}
    <section className="q-review-summary space-y-3" aria-label="得分与复核状态">
      <dl className="q-review-scores">
        <div><dt>初评得分</dt><dd>{initialComplete?<>{initialTotal}<span> / {maximum}</span></>:"待评分"}</dd></div>
        <div><dt>已记录得分</dt><dd>{savedComplete?<>{savedTotal}<span> / {maximum}</span></>:"待评分"}</dd></div>
        {view==="review"&&<div><dt>复核中得分</dt><dd>{status.invalid.length?<><span>已评 </span>{total}<span> 分</span></>:<>{total}<span> / {maximum}</span></>}</dd></div>}
      </dl>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <p className="q-review-status" data-tone={statusTone} role="status"><StatusIcon aria-hidden="true" className="size-4 shrink-0"/>{statusText}</p>
        {view==="review"&&!!status.changed.length&&<span className="text-muted-foreground">{status.changed.length} 个评分点未确认{savedComplete&&!status.invalid.length&&total!==savedTotal?` · 较已记录 ${total-savedTotal>0?"+":""}${total-savedTotal} 分`:""}</span>}
        {historyChanged&&savedComplete&&initialComplete&&<span className="text-muted-foreground">已记录较初评 {savedTotal===initialTotal?"总分不变，评分点有调整":`${savedTotal-initialTotal>0?"+":""}${savedTotal-initialTotal} 分`}</span>}
      </div>
    </section>
    <div className="space-y-8">{parts.map(part=><section key={part.id} aria-label={`第${part.id}小问作答与评分`} className="q-review-part">
      <div className="min-w-0 space-y-4">
        <h4 className="font-semibold">第 {part.id} 小问 · {part.points} 分</h4>
        <div className="prism-question-copy text-base leading-7">{part.content}</div>
        <div><p className="mb-2 text-sm font-semibold">学生作答</p><blockquote className="q-review-attempt prism-question-copy text-base leading-8">{attemptFor(part.id)}</blockquote></div>
        {references&&<div className="q-review-reference question-solution prism-question-copy text-base leading-8"><h5 className="mb-2 text-sm font-semibold">参考答案与解析</h5><div>{part.answer}</div><div className="mt-3">{part.explanation}</div></div>}
      </div>
      <div className="q-review-rubric min-w-0 space-y-5">
        <h5 className="text-sm font-semibold">{view==="review"?"评分细则与复核":"评分细则与记录"}</h5>
        {(part.rubric??[]).map(item=>{
          const changed=status.changed.includes(item.id)
          const invalid=showScoreErrors&&status.invalid.includes(item.id)
          const fieldErrorId=`${reasonId}-${item.id}-error`
          return <div key={item.id} className="q-review-criterion">
            <div className="min-w-0 space-y-1 text-sm leading-6"><p className="font-medium">{item.label}</p><p className="text-muted-foreground">初评 <span className="tabular-nums text-foreground">{initial[item.id]===undefined?"未评分":`${initial[item.id]} 分`}</span>{saved[item.id]!==initial[item.id]&&<> · 已记录 <span className="tabular-nums text-foreground">{saved[item.id]===undefined?"未评分":`${saved[item.id]} 分`}</span></>}</p></div>
            <div className="q-review-score-control">
              <span className="text-sm text-foreground">上限 <strong className="tabular-nums font-semibold">{item.points}</strong> 分</span>
              {view==="review"?<PointsField label={`第 ${part.id} 问 · ${item.label}`} value={scores[item.id]??null} max={item.points} invalid={invalid} describedBy={invalid?fieldErrorId:undefined} onChange={value=>updateScore(item.id,value)}/>:<span className="tabular-nums">{saved[item.id]??"未评分"} / {item.points}</span>}
              {view==="review"&&changed&&!invalid&&<span className="q-review-adjustment text-sm"><CircleAlert className="size-3.5" aria-hidden="true"/>待确认</span>}
            </div>
            {invalid&&<p id={fieldErrorId} className="q-review-field-error text-sm" role="alert">请填写 0–{item.points} 分，步长为 0.5 分。</p>}
          </div>
        })}
      </div>
    </section>)}</div>
    {initialNote&&<p className="text-sm leading-7 text-muted-foreground">{initialNote}</p>}
    {view==="review"&&<section className="q-review-form space-y-4" aria-label="复核理由与确认">
      <div className="space-y-2">
        <Label htmlFor={reasonId}>复核理由{!!status.changed.length?"（调整分数后必填）":""}</Label>
        <Textarea ref={reasonRef} id={reasonId} value={reason} aria-invalid={reasonError||undefined} aria-describedby={reasonError?`${reasonId}-error`:undefined} onChange={event=>{const next=event.target.value;change(previous=>({...previous,reason:next,error:previous.error?reviewError(previous.scores,limits,previous.saved,next):""}))}} placeholder="说明调整的评分点与依据。"/>
        {reasonError&&<p id={`${reasonId}-error`} role="alert" className="q-review-field-error text-sm">{error}</p>}
      </div>
      <div className="flex flex-wrap gap-2"><Button className="q-primary-action" disabled={!dirty&&!!record} onClick={confirm}>确认复核</Button><Button variant="outline" disabled={!dirty} onClick={()=>change(previous=>({...previous,scores:{...previous.saved},reason:"",error:""}))}>取消修改</Button></div>
    </section>}
    {record&&<p className="text-sm leading-7 text-muted-foreground">最新复核记录：{record}</p>}
  </div>
}
