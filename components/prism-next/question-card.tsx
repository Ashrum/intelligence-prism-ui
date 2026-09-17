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
  return <article data-question-id={question.id} data-highlight={highlighted||undefined} aria-labelledby={id} className="prism-question w-full min-w-0">
    <div className="q-card-layout min-w-0">
      <header className="q-card-heading">
        <div className="q-card-meta">
          {onCheckedChange&&<Checkbox checked={!!checked} disabled={selectionDisabled} onCheckedChange={onCheckedChange} aria-label={selectionLabel??`批量勾选${number===undefined?question.title:`第${number}题`}：${question.title}`}/>}
          {number!==undefined&&<span aria-label={`第 ${number} 题`} className="q-card-number tabular-nums">{number}.</span>}
          {header}
          <QuestionTypeLabel label={question.kind} tone={tone}/>
          {showPoints&&<QuestionPoints points={displayPoints??question.points} tone={tone}/>}
          {question.parts&&<span className="q-card-meta-extra">整题 · 含 {question.parts.length} 个小问</span>}
          {status}
          {headerActions&&<Toolbar aria-label={`${question.title}快捷操作`} className="ml-auto shrink-0 rounded-none border-0 bg-transparent p-0"><ToolbarGroup>{headerActions}</ToolbarGroup></Toolbar>}
        </div>
        <h3 id={id} className="q-card-title">{number!==undefined&&<span className="sr-only">第 {number} 题 · </span>}{question.title}</h3>
      </header>
      {compact?<div className="prism-question-copy min-w-0"><div className="q-question-stem">{question.stem}</div></div>:<QuestionContent question={content}/>}
      {(details||secondaryActions||actions)&&<Toolbar aria-label={`${question.title}操作`} className="q-card-actions flex-wrap items-center gap-y-2 rounded-none border-0 bg-transparent p-0"><ToolbarGroup className="q-secondary-actions flex-wrap">{details&&<ToolbarButton render={<Button variant="ghost" size="sm"/>} aria-label={`${number===undefined?question.title:`第${number}题`}详情`} aria-expanded={open} aria-controls={`${id}-details`} onClick={()=>changeOpen(!open)}><ChevronDown className={cn("transition-transform",open&&"rotate-180")}/>详情</ToolbarButton>}{secondaryActions}</ToolbarGroup>{actions&&<ToolbarGroup className="q-primary-action ml-auto flex-wrap">{actions}</ToolbarGroup>}</Toolbar>}
      {details&&<Collapsible open={open}><CollapsiblePanel id={`${id}-details`}><div className="question-detail-region mt-5 rounded-lg bg-muted/55 p-4 sm:p-5">{details}</div></CollapsiblePanel></Collapsible>}
    </div>
  </article>
}
