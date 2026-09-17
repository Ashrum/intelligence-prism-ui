"use client"
import { useState } from "react"
import Link from "next/link"
import { X } from "lucide-react"
import { Button } from "@/components/coss/button"
import { ToolbarButton } from "@/components/coss/toolbar"
import { DemoSection } from "../demo-parts"
import { QuestionCard } from "../question-card"
import { QuestionDetails,type QuestionDetailTab } from "../question-details"
import { QuestionSelect } from "../question-controls"
import { QuestionResponse,type ResponseValue } from "../question-response"
import { QuestionReview } from "../question-review"
import { QuestionActions } from "../question-actions"
import { questionSamples } from "@/components/prism-next/fixtures/question-samples"
import { judgmentQuestion,compositeQuestion } from "@/components/prism-next/fixtures/question-composite-samples"
import { questionMetadata } from "../fixtures/question-metadata"
import { textbooks } from "@/lib/prism-next/textbook-directory"
import { initialReviewScores,reviewAttempts } from "@/lib/prism-next/fixtures/review"
import type { DirectorySelections } from "../textbook-directory"
const samples=[...questionSamples,judgmentQuestion,compositeQuestion]
export function QuestionComponentDemo(){
 const [id,setId]=useState(samples[0].id),[listIds,setListIds]=useState(samples.slice(0,3).map(q=>q.id))
 return <>
  <DemoSection title="独立题目卡片" description="标题、题型与分值、题面分层呈现。题目数据、详情、作答与操作由调用方传入。">
   <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><QuestionSelect label="题型样本" value={id} onChange={setId} items={samples.map(q=>({value:q.id,label:`${q.kind} · ${q.title}`}))}/><Button variant="outline" render={<Link href="/next/examples/questions"/>}>题库与组卷应用示例</Button></div>
   <QuestionSpecimen key={id} id={id}/>
   <details className="mt-6 text-sm"><summary className="cursor-pointer text-muted-foreground">使用接口</summary><pre className="mt-3 overflow-x-auto rounded-lg bg-muted p-4 text-xs leading-6">{'<QuestionCard question={question} />\n<QuestionCard question={question} number={1}\n  checked={selected} onCheckedChange={setSelected}\n  actions={actions} details={details} />\n<QuestionCard question={question} number={1}\n  variant="list" compact headerActions={removeAction} />'}</pre></details>
  </DemoSection>
  <DemoSection title="列表中的题目卡片" description="用于试题篮、候选列表和题目摘要。保留题干与分值，右侧提供单题操作；条目之间用一条细线分隔。">
   <div className="max-w-3xl"><ol className="divide-y divide-border">{listIds.map((id,index)=>{const question=samples.find(q=>q.id===id)!;return <li key={id}><QuestionCard question={question} number={index+1} variant="list" compact headerActions={<ToolbarButton render={<Button variant="ghost" size="icon-sm"/>} aria-label={`移除示例：${question.title}`} onClick={()=>setListIds(previous=>previous.filter(value=>value!==id))}><X/></ToolbarButton>}/></li>})}</ol>{listIds.length===0&&<p className="py-6 text-sm text-muted-foreground">当前列表为空。</p>}<div className="mt-4 flex items-center justify-between gap-3"><p role="status" className="text-sm text-muted-foreground">{listIds.length} 道题 · {listIds.reduce((sum,id)=>sum+samples.find(q=>q.id===id)!.points,0)} 分</p>{listIds.length!==3&&<Button variant="outline" size="sm" onClick={()=>setListIds(samples.slice(0,3).map(q=>q.id))}>恢复示例</Button>}</div></div>
  </DemoSection>
 </>
}
function QuestionSpecimen({id}:{id:string}){const question=samples.find(q=>q.id===id)!;const [mode,setMode]=useState("select"),[checked,setChecked]=useState(false),[favorite,setFavorite]=useState(false),[open,setOpen]=useState(false),[tab,setTab]=useState<QuestionDetailTab>("answer"),[links,setLinks]=useState<DirectorySelections>({}),[response,setResponse]=useState<Record<string,ResponseValue>>({}),[notice,setNotice]=useState("")
return <div className="space-y-6"><QuestionCard question={question}/><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-medium">可组合的内容与操作</p><QuestionSelect label="题卡组合" value={mode} onChange={value=>{setMode(value);setOpen(false);setNotice("")}} items={[{value:"select",label:"选择"},{value:"compose",label:"编排"},{value:"answer",label:"作答"},{value:"review",label:"复核"}]}/></div>{mode==="review"?<QuestionReview key={id} question={question} attempts={question.id===compositeQuestion.id?reviewAttempts:{"1":"示例作答，待人工复核。"}} initialScores={question.id===compositeQuestion.id?initialReviewScores:{score:0}} learner="示例学生" onConfirm={()=>setNotice("当前实例已记录复核。")}/>:<><QuestionCard question={question} number={1} checked={checked} onCheckedChange={mode==="select"?setChecked:undefined} showPoints={mode!=="answer"} displayPoints={mode==="compose"?8:undefined} detailsOpen={open} onDetailsOpenChange={setOpen} details={mode!=="answer"?<QuestionDetails question={question} metadata={questionMetadata[id]} textbooks={textbooks} links={links} onLinksChange={setLinks} tab={tab} onTabChange={setTab} tabs={mode==="compose"?["teaching","archive"]:["answer","teaching","archive"]}/>:undefined} secondaryActions={mode==="select"?<QuestionActions title={question.title} favorite={favorite} onFavorite={()=>setFavorite(!favorite)}/>:undefined} actions={mode==="select"?<ToolbarButton render={<Button size="sm"/>} onClick={()=>setNotice("外部容器收到加入请求。")}>加入</ToolbarButton>:mode==="compose"?<ToolbarButton render={<Button size="sm" variant="outline"/>} onClick={()=>setNotice("外部容器收到替换请求。")}>替换</ToolbarButton>:undefined}/>{mode==="answer"&&<div className="space-y-5 rounded-xl border p-5">{(question.parts??[{...question,id:"1"}]).map(part=><QuestionResponse key={part.id} question={part} value={response[part.id]??""} onChange={value=>setResponse({...response,[part.id]:value})} label={question.parts?`第 ${part.id} 问作答`:"我的作答"}/>)}<Button onClick={()=>setNotice("外部容器已收到作答，未进行自动评分。")}>提交作答</Button></div>}</>}<p role="status" className="min-h-5 text-sm text-muted-foreground">{notice||`勾选：${checked?"已选":"未选"} · 收藏：${favorite?"已收藏":"未收藏"}`}</p></div>}
