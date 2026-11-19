"use client"
import { useEffect, useRef, useState, type Dispatch, type SetStateAction, type ReactNode } from "react"
import { Copy } from "lucide-react"
import { Button } from "@/components/coss/button"
import { Tooltip, TooltipTrigger, TooltipPopup } from "@/components/coss/tooltip"
import { Tabs, TabsList, TabsTab, TabsPanel } from "@/components/coss/tabs"
import { QuestionSolution, type QuestionRecord } from "./question-content"
import { TextbookRangePicker } from "./textbook-range-picker"
import type { DirectorySelections, TextbookDefinition } from "./textbook-directory"
import type { QuestionMetadata } from "./question-metadata"

export type QuestionDetailTab = "answer" | "teaching" | "archive"
export type QuestionDetailState = {open:boolean;tab:QuestionDetailTab}
export function directoryLabels(textbooks:TextbookDefinition[],links:DirectorySelections,kind?:"course"|"knowledge") {
  return textbooks.flatMap(book=>(kind?[kind]:["course","knowledge"] as const).flatMap(type=>(links[`${book.id}:${type}`]??[]).map(id=>{
    const data=book.directories[type], path=data.paths[id]??[]
    return {id,kind:type,label:[book.title,...path.map(key=>data.nodes[key]?.title).filter(Boolean)].join(" → ")}
  })))
}
function DataRow({label,children}:{label:string;children:ReactNode}) {
  return <div className="grid grid-cols-[84px_minmax(0,1fr)] gap-x-3"><dt className="text-ui-meta leading-5 tracking-[.04em] text-muted-foreground">{label}</dt><dd className="min-w-0 break-words text-ui-hint leading-5 text-foreground/85 tabular-nums">{children}</dd></div>
}
export type QuestionArchiveSummaryProps = {
  id?: string
  version?: string
  status: string
  rows: { label: string; value: ReactNode }[]
}
export function QuestionArchiveSummary({id,version,status,rows}:QuestionArchiveSummaryProps) {
  const [notice,setNotice]=useState("")
  const tone=status === "可用" ? "bg-success" : status === "草稿" || status === "未入库" ? "bg-warning" : "bg-muted-foreground"
  async function copyId() {
    if (!id) return
    try { await navigator.clipboard.writeText(id); setNotice("编号已复制") }
    catch { setNotice("复制失败，请手动复制编号") }
  }
  return <div className="grid gap-3">
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <span className="min-w-0 break-all font-mono text-ui-hint tracking-[.02em] text-foreground">{id || "添加后生成编号"}</span>
      {id && <Tooltip><TooltipTrigger render={<Button variant="ghost" size="icon-xs" aria-label="复制题目编号" onClick={copyId}/>}><Copy className="size-3" aria-hidden="true"/></TooltipTrigger><TooltipPopup>复制编号</TooltipPopup></Tooltip>}
      {(version || !id) && <><span aria-hidden="true" className="text-ui-meta text-muted-foreground">·</span><span className="font-mono text-ui-meta text-muted-foreground">{version || "草稿"}</span></>}
      <span className="inline-flex items-center gap-1.5 text-ui-meta text-muted-foreground" aria-label={`可用状态：${status}`}><span aria-hidden="true" className={`size-1.5 rounded-full ${tone}`}/>{status}</span>
    </div>
    <div className="h-px bg-border/70"/>
    <dl className="grid gap-y-2">{rows.filter(({value})=>value !== undefined && value !== null && value !== false && !(typeof value === "string" && !value.trim())).map(({label,value})=><DataRow key={label} label={label}>{value}</DataRow>)}</dl>
    <span role="status" aria-live="polite" className={notice ? "text-ui-meta text-muted-foreground" : "sr-only"}>{notice}</span>
  </div>
}
export function QuestionDetails({question,metadata,links,tab,onTabChange,onLinksChange,status="未知",canEdit=false,textbooks=[],tabs=["answer","teaching","archive"],archive,orientation="auto"}:{orientation?:"auto"|"vertical";question:QuestionRecord;metadata:QuestionMetadata;links:DirectorySelections;tab:QuestionDetailTab;onTabChange:(value:QuestionDetailTab)=>void;onLinksChange:Dispatch<SetStateAction<DirectorySelections>>;status?:string;canEdit?:boolean;textbooks?:TextbookDefinition[];tabs?:QuestionDetailTab[];archive?:{label:string;value:React.ReactNode}[]}) {
  const courses=directoryLabels(textbooks,links,"course"),knowledge=directoryLabels(textbooks,links,"knowledge")
  const containerRef=useRef<HTMLDivElement>(null)
  const [wide,setWide]=useState(false)
  const vertical=orientation === "vertical" || wide
  useEffect(()=>{
    const node=containerRef.current
    if (orientation !== "auto" || !node || typeof ResizeObserver === "undefined") return
    const observer=new ResizeObserver(([entry])=>setWide(entry.contentRect.width >= 560))
    observer.observe(node)
    return ()=>observer.disconnect()
  },[orientation,tabs.length])
  if(!tabs.length)return null
  const orderedTabs = (["answer", "teaching", "archive"] as const).filter(value => tabs.includes(value))
  const active=orderedTabs.includes(tab)?tab:orderedTabs[0]
  return <div ref={containerRef} className="@container/question-details min-w-0"><Tabs orientation={vertical ? "vertical" : "horizontal"} value={active} onValueChange={value=>onTabChange(value as QuestionDetailTab)} className={(vertical ? "min-w-0 items-start gap-6 [&_dl>div]:min-h-[30px] [&_dl>div]:pt-[3px] [&_dd]:leading-relaxed" : "min-w-0 gap-5") + (orientation === "vertical"
    ? " @max-[400px]/question-details:[&_[data-slot=tabs-list]]:w-16 @max-[400px]/question-details:[&_dl>div]:grid-cols-1"
    : "")}>
    <TabsList variant="underline" className={vertical ? "w-24 shrink-0 items-stretch data-[orientation=vertical]:px-0 border-s border-border/70" : "grid w-full min-w-0 auto-cols-fr grid-flow-col"} aria-label={`${question.title}详情分类`}>{orderedTabs.map(value => {
      const label = { answer: "答案与解析", teaching: "教学定位", archive: "题目档案" }[value]
      return <TabsTab key={value} value={value} aria-label={label} className={vertical ? "h-[30px] min-h-0 justify-start px-3 text-ui-hint tracking-[.02em] font-normal text-muted-foreground data-active:font-medium data-active:text-foreground" : "pointer-coarse:min-h-11 pointer-coarse:min-w-11 min-w-0 whitespace-normal px-1"}>
        <span aria-hidden="true" className="@min-[400px]/question-details:hidden">{{ answer: "答案", teaching: "定位", archive: "档案" }[value]}</span>
        <span aria-hidden="true" className="hidden @min-[400px]/question-details:inline">{label}</span>
      </TabsTab>
    })}</TabsList>
    {tabs.includes("answer")&&<TabsPanel value="answer" className="min-w-0"><div className={[
      "[&_.question-solution]:space-y-2.5 [&_.question-solution>section:nth-child(-n+2)]:relative [&_.question-solution>section:nth-child(-n+2)]:pl-24 [&_.question-solution>section:nth-child(-n+2)>h4]:absolute [&_.question-solution>section:nth-child(-n+2)>h4]:left-0 [&_.question-solution>section:nth-child(-n+2)>h4]:top-0 [&_.question-solution>section:nth-child(-n+2)>h4]:w-[84px] [&_.question-solution>section:nth-child(-n+2)>h4]:m-0 [&_.question-solution>section:nth-child(-n+2)>h4]:text-ui-meta [&_.question-solution>section:nth-child(-n+2)>h4]:font-normal [&_.question-solution>section:nth-child(-n+2)>h4]:tracking-[.04em] [&_.question-solution>section:nth-child(-n+2)>h4]:text-muted-foreground",
      vertical
        ? "[&_.question-solution>section]:min-h-[30px] [&_.question-solution>section]:pt-[3px] [&_.question-solution>section]:leading-relaxed [&_.question-solution>section:nth-child(-n+2)>h4]:pt-[5px]"
        : "[&_.question-solution>section:nth-child(-n+2)]:min-h-[22px] [&_.question-solution>section:nth-child(-n+2)]:leading-[22px] [&_.question-solution>section:nth-child(2)]:leading-[26px] [&_.question-solution>section:nth-child(-n+2)>h4]:leading-[22px]"
    ].join(" ") + (orientation === "vertical" ? [
      " @max-[400px]/question-details:[&_.question-solution]:space-y-2",
      "@max-[400px]/question-details:[&_.question-solution>section:nth-child(-n+2)]:pl-0",
      "@max-[400px]/question-details:[&_.question-solution>section:nth-child(-n+2)>h4]:static @max-[400px]/question-details:[&_.question-solution>section:nth-child(-n+2)>h4]:w-auto @max-[400px]/question-details:[&_.question-solution>section:nth-child(-n+2)>h4]:pt-0",
      "@max-[400px]/question-details:[&_.question-solution>section>h4]:m-0 @max-[400px]/question-details:[&_.question-solution>section>h4]:text-ui-hint! @max-[400px]/question-details:[&_.question-solution>section>h4]:font-normal @max-[400px]/question-details:[&_.question-solution>section>h4]:text-muted-foreground",
    ].join(" ") : "")}><QuestionSolution question={question} textSize="ui"/></div></TabsPanel>}
    {tabs.includes("teaching")&&<TabsPanel value="teaching" className="min-w-0"><div className="grid gap-2"><dl className="space-y-2"><DataRow label="核心知识点">{metadata.knowledge.join(" · ") || "未关联"}</DataRow><DataRow label="考查方法">{metadata.method || "未关联"}</DataRow><DataRow label="认知要求">{metadata.demand || "未关联"}</DataRow></dl><dl className="space-y-2"><DataRow label="教材与章节">{courses.length?courses.map(item=><p key={item.id}>{item.label}</p>):"尚未关联教材章节"}</DataRow><DataRow label="知识点目录">{knowledge.length?knowledge.map(item=><p key={item.id}>{item.label}</p>):"尚未关联知识点目录"}</DataRow><DataRow label="课程标准">未关联</DataRow></dl></div>{canEdit&&<div className="mt-5"><TextbookRangePicker textbooks={textbooks} selections={links} onSelectionsChange={onLinksChange} compactTrigger triggerLabel="编辑教材与知识点"/></div>}</TabsPanel>}
    {tabs.includes("archive")&&<TabsPanel value="archive" className="min-w-0"><QuestionArchiveSummary id={question.id} version={metadata.version} status={status} rows={[
      {label:"题型与结构",value:`${question.kind}${question.options?.length ? ` · ${question.options.length} 个选项` : ""}${question.parts?.length ? ` · 含 ${question.parts.length} 个小问` : ""}`},
      {label:"来源",value:metadata.source},
      ...(archive?.filter(item=>item.label === "入库") ?? []),
      ...(archive?.filter(item=>item.label !== "入库") ?? []),
      {label:"维护说明",value:metadata.note},
    ]}/></TabsPanel>}
  </Tabs></div>
}
