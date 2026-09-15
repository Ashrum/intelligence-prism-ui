"use client"
import { useState } from "react"
import { Printer } from "lucide-react"
import { Button } from "@/components/coss/button"
import { QuestionContent, QuestionSolution, type QuestionRecord } from "./question-content"
import { QuestionSelect } from "./question-controls"
import { entryPoints, type PaperEntry } from "@/lib/prism-next/question-workspace"

export function QuestionPrint({entries,questions,blocked,title,showPoints=true,description,minutes}:{entries:PaperEntry[];questions:QuestionRecord[];blocked:boolean;title:string;showPoints?:boolean;description?:string;minutes:number}) {
  const [mode,setMode] = useState("paper")
  return <div className="question-print-preview space-y-5">
    <div className="q-no-print flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3"><QuestionSelect label="纸面版本" value={mode} onChange={setMode} items={[{value:"paper",label:"题面版 · 含作答留白"},{value:"answers",label:"教师答案版 · 含评分依据"}]}/><span className="text-sm text-muted-foreground">按当前草稿的分组、顺序与分值排版</span></div>
      <Button disabled={!entries.length || blocked} onClick={()=>window.print()}><Printer/>打印 / 保存 PDF</Button>
    </div>
    {blocked&&<p className="q-no-print text-sm text-destructive">当前草稿包含待审核或暂停使用的题目，请先移除或替换，再打印。</p>}
    {!entries.length?<p className="rounded-xl border p-8 text-center text-muted-foreground">当前草稿尚无题目，请先从试题篮导入，或在编排区载入示例。</p>:<div className="question-print-sheet mx-auto max-w-[52rem] p-6 shadow-sm sm:p-10">
      <header className="mb-8 border-b pb-5"><p className="mb-2 text-sm">智能曜彩 · {mode==="paper"?"题面版":"教师参考答案与评分依据"}</p><h3 className="text-2xl font-semibold">{title}</h3>{description&&<p className="mt-3 text-sm">{description}</p>}<p className="mt-3 text-sm tabular-nums">共 {entries.length} 题{showPoints&&` · 满分 ${entries.reduce((sum,item)=>sum+entryPoints(item),0)} 分`} · 建议 {minutes} 分钟</p>{mode==="paper"&&<p className="mt-5 text-sm">姓名：____________　班级：____________</p>}</header>
      {entries.map((entry,index)=>{
        const question=questions.find(item=>item.id===entry.id)
        if(!question)return null
        const display={...question,parts:question.parts?.map(part=>({...part,points:showPoints?entry.partPoints?.[part.id]??part.points:undefined}))}
        const adjusted=entryPoints(entry)!==question.points||Object.entries(entry.partPoints??{}).some(([id,value])=>question.parts?.find(part=>part.id===id)?.points!==value)
        return <section className="question-print-item mb-8" key={entry.id}>
          {entry.group&&entry.group!==entries[index-1]?.group&&<h4 className="mb-6 border-b pb-3 text-lg font-semibold">{entry.group}</h4>}
          <h4 className="mb-4 font-semibold">{index+1}. {question.title}{showPoints&&`（${entryPoints(entry)} 分）`}</h4>
          {mode==="paper"?<><QuestionContent question={display}/>{(question.response==="long"||question.parts?.some(part=>part.response==="long"))&&<div className="question-answer-space mt-6 h-40 border-b" aria-label="解答题作答留白"/>}{question.response==="boolean"&&<p className="mt-5">判断：① ______　② ______　③ ______</p>}</>:<>{adjusted&&showPoints&&<p className="mb-4 text-sm">草稿分值已调整。下方保留原题评分依据；正式使用前请同步核定评分标准。</p>}{!showPoints&&<p className="mb-4 text-sm">本练习不显示题面分值；以下原题评分依据仅供教师参考。</p>}<QuestionSolution question={question}/></>}
        </section>
      })}
      <footer className="mt-10 border-t pt-3 text-xs">自编演示材料 · 纸面布局预览</footer>
    </div>}
  </div>
}
