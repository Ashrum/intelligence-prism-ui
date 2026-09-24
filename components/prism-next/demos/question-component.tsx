"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/coss/button"
import { ToolbarButton } from "@/components/coss/toolbar"
import { DemoSection } from "../demo-parts"
import { QuestionCard } from "../question-card"
import { QuestionDetails, type QuestionDetailTab } from "../question-details"
import { QuestionSelect } from "../question-controls"
import { QuestionResponse, type ResponseValue } from "../question-response"
import { QuestionReview } from "../question-review"
import { QuestionActions } from "../question-actions"
import { questionSamples, additionalQuestionSamples } from "../fixtures/question-samples"
import { judgmentQuestion, compositeQuestion } from "../fixtures/question-composite-samples"
import { questionMetadata } from "../fixtures/question-metadata"
import { textbooks } from "@/lib/prism-next/textbook-directory"
import { initialReviewScores, reviewAttempts } from "@/lib/prism-next/fixtures/review"
import type { DirectorySelections } from "../textbook-directory"

const samples = [...questionSamples, judgmentQuestion, compositeQuestion, ...additionalQuestionSamples]
const modes = [{value:"select",label:"选择"},{value:"compose",label:"编排"},{value:"answer",label:"作答"},{value:"review",label:"复核"}]

export function QuestionComponentDemo({standalone=false}:{standalone?:boolean}) {
  const [kind,setKind]=useState("all"), [mode,setMode]=useState("select")
  const visible=samples.filter(question=>kind==="all"||question.kind===kind)
  return <DemoSection id="question-component" title="题目卡片" description="12 道自编示例，覆盖运算、函数、几何、集合、概率、数列与统计；共用同一套题卡排版。">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <QuestionSelect label="题型筛选" value={kind} onChange={setKind} items={[{value:"all",label:"全部题型 · "+samples.length+" 道"},...Array.from(new Set(samples.map(question=>question.kind)),value=>({value,label:value}))]}/>
        <QuestionSelect label="题卡组合" value={mode} onChange={setMode} items={modes}/>
      </div>
      {!standalone&&<Button variant="outline" render={<a href="/next/examples/questions"/>}>题库与组卷应用示例</Button>}
    </div>
    <div className="grid gap-6">{visible.map(question=><QuestionSpecimen key={question.id} id={question.id} number={samples.findIndex(item=>item.id===question.id)+1} mode={mode}/>)}</div>
    <p className="mt-4 text-ui-hint text-muted-foreground" role="status">当前展示 {visible.length} 道题 · 交互状态仅保留在本次打开期间。</p>
    {!standalone&&<details className="mt-6 text-ui-body"><summary className="cursor-pointer text-muted-foreground">使用接口</summary><pre className="mt-3 overflow-x-auto rounded-lg bg-muted p-4 text-ui-hint">{'<QuestionCard question={question} />\n<QuestionCard question={question} number={1}\n  checked={selected} onCheckedChange={setSelected}\n  actions={actions} details={details} />\n<QuestionCard question={question} number={1}\n  compact headerActions={removeAction} />'}</pre></details>}
  </DemoSection>
}

function QuestionSpecimen({id,number,mode}:{id:string;number:number;mode:string}) {
  const question=samples.find(item=>item.id===id)!
  const [checked,setChecked]=useState(false), [favorite,setFavorite]=useState(false), [open,setOpen]=useState(false)
  const [tab,setTab]=useState<QuestionDetailTab>("answer"), [links,setLinks]=useState<DirectorySelections>({})
  const [response,setResponse]=useState<Record<string,ResponseValue>>({}), [notice,setNotice]=useState("")
  useEffect(()=>{setOpen(false);setNotice("")},[mode])
  return <div>
    {mode==="review"?<div className="py-6"><QuestionReview question={question} attempts={question.id===compositeQuestion.id?reviewAttempts:Object.fromEntries((question.parts??[{id:"1"}]).map(part=>[part.id,"示例作答，待人工复核。"]))} initialScores={question.id===compositeQuestion.id?initialReviewScores:{score:0}} learner="示例学生" onConfirm={()=>setNotice("已发出复核确认意图；示例未接入回执。")}/></div>:<>
      <QuestionCard question={question} number={number} checked={checked} onCheckedChange={mode==="select"?setChecked:undefined} showPoints={mode!=="answer"} displayPoints={mode==="compose"?8:undefined} detailsOpen={open} onDetailsOpenChange={setOpen}
        details={mode!=="answer"?<QuestionDetails question={question} metadata={questionMetadata[id]} textbooks={textbooks} links={links} onLinksChange={setLinks} tab={tab} onTabChange={setTab} tabs={mode==="compose"?["teaching","archive"]:["answer","teaching","archive"]}/>:undefined}
        secondaryActions={mode==="select"?<QuestionActions title={question.title} favorite={favorite} onFavorite={()=>setFavorite(!favorite)}/>:undefined}
        actions={mode==="select"?<ToolbarButton render={<Button size="sm" />} onClick={()=>setNotice("已记录加入请求。")}>加入</ToolbarButton>:mode==="compose"?<ToolbarButton render={<Button size="sm" variant="outline"/>} onClick={()=>setNotice("已记录替换请求。")}>替换</ToolbarButton>:undefined}/>
      {mode==="answer"&&<div className="mb-6 space-y-5 rounded-xl border p-5">
        {(question.parts??[{...question,id:"1"}]).map(part=><QuestionResponse key={part.id} question={part} value={response[part.id]??""} onChange={value=>setResponse({...response,[part.id]:value})} label={question.parts?"第 "+number+" 题 · 第 "+part.id+" 问作答":"第 "+number+" 题 · 我的作答"}/>)}
        <Button  onClick={()=>setNotice("已收到作答，未进行自动评分。")}>提交作答</Button>
      </div>}
    </>}
    {notice&&<p role="status" className="mb-4 text-ui-hint text-muted-foreground">{notice}</p>}
  </div>
}
