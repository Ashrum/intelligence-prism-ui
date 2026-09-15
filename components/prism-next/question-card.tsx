"use client"
import { useId, type ReactNode, type Dispatch, type SetStateAction } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/coss/button"
import { Checkbox } from "@/components/coss/checkbox"
import { Badge } from "@/components/coss/badge"
import { Collapsible, CollapsiblePanel } from "@/components/coss/collapsible"
import { Toolbar, ToolbarButton, ToolbarGroup } from "@/components/coss/toolbar"
import { QuestionContent, type QuestionRecord } from "./question-content"
import { QuestionDetails, type QuestionDetailState } from "./question-details"
import type { QuestionMetadata } from "./question-metadata"
import type { DirectorySelections } from "./textbook-directory"
import { cn } from "@/lib/utils"

export function QuestionCard({question,number,metadata,detail,onDetailChange,links,onLinksChange,checked,onCheckedChange,actions,secondaryActions,reading=false,compact=false,status,detailStatus="可用",canEdit=false,header,showPoints=true,displayPoints,displayPartPoints,highlighted=false}:{
  question:QuestionRecord;number:number;metadata:QuestionMetadata;detail:QuestionDetailState;onDetailChange:(value:QuestionDetailState)=>void
  links:DirectorySelections;onLinksChange:Dispatch<SetStateAction<DirectorySelections>>
  checked?:boolean;onCheckedChange?:(value:boolean)=>void;actions?:ReactNode;secondaryActions?:ReactNode;reading?:boolean;compact?:boolean;status?:ReactNode;detailStatus?:string;canEdit?:boolean;header?:ReactNode;showPoints?:boolean;displayPoints?:number;displayPartPoints?:Record<string,number>;highlighted?:boolean
}) {
  const id=useId()
  const content={...question,parts:question.parts?.map(part=>({...part,points:showPoints?displayPartPoints?.[part.id]??part.points:undefined}))}
  return <article data-question-id={question.id} data-highlight={highlighted||undefined} aria-labelledby={id} className={cn("prism-question min-w-0 rounded-xl border bg-background px-4 py-5 text-foreground sm:px-6",checked&&"border-primary/60",reading&&"border-transparent px-0 sm:px-0")}>
    <header className="mb-4 flex flex-wrap items-center gap-3">{header}{onCheckedChange&&<Checkbox checked={!!checked} onCheckedChange={onCheckedChange} aria-label={`批量勾选第${number}题：${question.title}`}/>}<h3 id={id} className="text-sm font-semibold">第 {number} 题 · {question.title}</h3><Badge variant="outline">{question.kind}</Badge>{showPoints&&<span className="text-sm tabular-nums text-muted-foreground">{displayPoints??question.points} 分</span>}{question.parts&&<span className="text-xs text-muted-foreground">整题 · 含 {question.parts.length} 个小问</span>}{status}</header>
    {compact?<div className="prism-question-copy line-clamp-2 text-base leading-[1.9]">{question.stem}</div>:<QuestionContent question={content}/>}
    <Toolbar aria-label={`${question.title}操作`} className="mt-5 flex-wrap items-center gap-y-2 rounded-none border-0 bg-transparent p-0 text-foreground"><ToolbarGroup className="flex-wrap"><ToolbarButton render={<Button variant="ghost" size="sm"/>} aria-label={`第${number}题详情`} aria-expanded={detail.open} aria-controls={`${id}-details`} onClick={()=>onDetailChange({...detail,open:!detail.open})}><ChevronDown className={cn("transition-transform",detail.open&&"rotate-180")}/>详情</ToolbarButton>{secondaryActions}</ToolbarGroup>{actions&&<ToolbarGroup className="ml-auto flex-wrap">{actions}</ToolbarGroup>}</Toolbar>
    <Collapsible open={detail.open}><CollapsiblePanel id={`${id}-details`}><div className="question-detail-region mt-5 rounded-lg bg-muted/55 p-4 sm:p-5"><QuestionDetails question={question} metadata={metadata} links={links} onLinksChange={onLinksChange} tab={detail.tab} onTabChange={tab=>onDetailChange({open:true,tab})} canEdit={canEdit} status={detailStatus}/></div></CollapsiblePanel></Collapsible>
  </article>
}
