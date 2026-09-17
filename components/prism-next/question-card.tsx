"use client"
import { useId, useState, type ReactNode } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/coss/button"
import { Checkbox } from "@/components/coss/checkbox"
import { QuestionTypeLabel, QuestionPoints, questionTone } from "./question-labels"
import { Collapsible, CollapsiblePanel } from "@/components/coss/collapsible"
import { Toolbar, ToolbarButton, ToolbarGroup } from "@/components/coss/toolbar"
import { QuestionContent, type QuestionRecord } from "./question-content"
import { cn } from "@/lib/utils"

export function QuestionCard({question,number,details,detailsOpen,onDetailsOpenChange,checked,onCheckedChange,selectionDisabled=false,selectionLabel,actions,secondaryActions,headerActions,compact=false,status,header,showPoints=true,displayPoints,displayPartPoints,highlighted=false}:{
  question:QuestionRecord;number?:number;details?:ReactNode;detailsOpen?:boolean;onDetailsOpenChange?:(open:boolean)=>void
  checked?:boolean;onCheckedChange?:(value:boolean)=>void;selectionDisabled?:boolean;selectionLabel?:string
  actions?:ReactNode;secondaryActions?:ReactNode;headerActions?:ReactNode;compact?:boolean
  status?:ReactNode;header?:ReactNode;showPoints?:boolean;displayPoints?:number;displayPartPoints?:Record<string,number>;highlighted?:boolean
}) {
  const id=useId()
  const [localOpen,setLocalOpen]=useState(false)
  const open=detailsOpen??localOpen
  const changeOpen=(next:boolean)=>{if(detailsOpen===undefined)setLocalOpen(next);onDetailsOpenChange?.(next)}
  const content={...question,parts:question.parts?.map(part=>({...part,points:showPoints?displayPartPoints?.[part.id]??part.points:undefined}))}
  const tone=questionTone(question)
  const hasRail=number!==undefined||!!onCheckedChange
  return <article data-question-id={question.id} data-highlight={highlighted||undefined} aria-labelledby={id} className="prism-question min-w-0 py-6 text-foreground">
    <div className={cn("grid min-w-0 gap-x-4 sm:gap-x-5",hasRail?"grid-cols-[2rem_minmax(0,1fr)]":"grid-cols-1")}>
      {hasRail&&<div className="flex flex-col items-center gap-3 pt-0.5">
        {number!==undefined&&<span aria-label={`第 ${number} 题`} className="flex size-8 shrink-0 items-center justify-center rounded-full border text-sm tabular-nums text-muted-foreground">{number}</span>}
        {onCheckedChange&&<Checkbox checked={!!checked} disabled={selectionDisabled} onCheckedChange={onCheckedChange} aria-label={selectionLabel??`批量勾选${number===undefined?question.title:`第${number}题`}：${question.title}`}/>}
      </div>}
      <div className="min-w-0">
        <header className="mb-4">
          <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 flex-1 items-start gap-2">{header}<h3 id={id} className="min-w-0 flex-1 break-words text-base font-semibold leading-7 text-(--heading)">{number!==undefined&&<span className="sr-only">第 {number} 题 · </span>}{question.title}</h3></div>{headerActions&&<Toolbar aria-label={`${question.title}快捷操作`} className="shrink-0 rounded-none border-0 bg-transparent p-0"><ToolbarGroup>{headerActions}</ToolbarGroup></Toolbar>}</div>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-2"><QuestionTypeLabel label={question.kind} tone={tone}/>{showPoints&&<QuestionPoints points={displayPoints??question.points} tone={tone}/>}{question.parts&&<span className="text-xs text-muted-foreground">整题 · 含 {question.parts.length} 个小问</span>}{status}</div>
        </header>
        {compact?<div className="prism-question-copy min-w-0 text-base leading-[1.9] text-muted-foreground">{question.stem}</div>:<QuestionContent question={content}/>}
        {(details||secondaryActions||actions)&&<Toolbar aria-label={`${question.title}操作`} className="mt-4 flex-wrap items-center gap-y-2 rounded-none border-0 bg-transparent p-0 text-foreground"><ToolbarGroup className="flex-wrap">{details&&<ToolbarButton render={<Button variant="ghost" size="sm"/>} aria-label={`${number===undefined?question.title:`第${number}题`}详情`} aria-expanded={open} aria-controls={`${id}-details`} onClick={()=>changeOpen(!open)}><ChevronDown className={cn("transition-transform",open&&"rotate-180")}/>详情</ToolbarButton>}{secondaryActions}</ToolbarGroup>{actions&&<ToolbarGroup className="q-primary-action ml-auto flex-wrap">{actions}</ToolbarGroup>}</Toolbar>}
        {details&&<Collapsible open={open}><CollapsiblePanel id={`${id}-details`}><div className="question-detail-region mt-5 rounded-lg bg-muted/55 p-4 sm:p-5">{details}</div></CollapsiblePanel></Collapsible>}
      </div>
    </div>
  </article>
}
