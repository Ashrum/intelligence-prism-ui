"use client"
import type { Dispatch, SetStateAction } from "react"
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
function DataRow({label,children}:{label:string;children:React.ReactNode}) {return <div><dt className="mb-1 text-ui-hint text-muted-foreground">{label}</dt><dd className="text-ui-hint text-foreground">{children}</dd></div>}
export function QuestionDetails({question,metadata,links,tab,onTabChange,onLinksChange,status="可用",canEdit=false,textbooks=[],tabs=["answer","teaching","archive"],archive}:{question:QuestionRecord;metadata:QuestionMetadata;links:DirectorySelections;tab:QuestionDetailTab;onTabChange:(value:QuestionDetailTab)=>void;onLinksChange:Dispatch<SetStateAction<DirectorySelections>>;status?:string;canEdit?:boolean;textbooks?:TextbookDefinition[];tabs?:QuestionDetailTab[];archive?:{label:string;value:React.ReactNode}[]}) {
  const courses=directoryLabels(textbooks,links,"course"),knowledge=directoryLabels(textbooks,links,"knowledge")
  if(!tabs.length)return null
  const active=tabs.includes(tab)?tab:tabs[0]
  return <Tabs value={active} onValueChange={value=>onTabChange(value as QuestionDetailTab)} className="gap-5">
    <div className="overflow-x-auto overflow-y-hidden"><TabsList variant="underline" aria-label={`${question.title}详情分类`}>{tabs.map(value=><TabsTab key={value} value={value}>{{answer:"答案与解析",teaching:"教学定位",archive:"题目档案"}[value]}</TabsTab>)}</TabsList></div>
    {tabs.includes("answer")&&<TabsPanel value="answer"><QuestionSolution question={question}/></TabsPanel>}
    {tabs.includes("teaching")&&<TabsPanel value="teaching"><div className="grid gap-6 sm:grid-cols-2"><dl className="space-y-4"><DataRow label="核心知识点">{metadata.knowledge.join(" · ")}</DataRow><DataRow label="考查方法">{metadata.method}</DataRow><DataRow label="认知要求">{metadata.demand}</DataRow></dl><dl className="space-y-4"><DataRow label="教材与章节">{courses.length?courses.map(item=><p key={item.id}>{item.label}</p>):"尚未关联教材章节"}</DataRow><DataRow label="知识点目录">{knowledge.length?knowledge.map(item=><p key={item.id}>{item.label}</p>):"尚未关联知识点目录"}</DataRow><DataRow label="课程标准">未关联</DataRow></dl></div>{canEdit&&<div className="mt-5"><TextbookRangePicker textbooks={textbooks} selections={links} onSelectionsChange={onLinksChange} compactTrigger triggerLabel="编辑教材与知识点"/></div>}</TabsPanel>}
    {tabs.includes("archive")&&<TabsPanel value="archive"><dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2"><DataRow label="题目编号">{question.id}</DataRow><DataRow label="题型与结构">{question.kind}{question.parts?` · 含 ${question.parts.length} 个小问`:""}</DataRow><DataRow label="来源">{metadata.source}</DataRow><DataRow label="版本">{metadata.version}</DataRow><DataRow label="可用状态">{status}</DataRow>{archive?.map(item=><DataRow key={item.label} label={item.label}>{item.value}</DataRow>)}{metadata.note&&<DataRow label="维护说明">{metadata.note}</DataRow>}</dl></TabsPanel>}
  </Tabs>
}
