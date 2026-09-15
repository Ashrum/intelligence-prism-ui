"use client"
import type { Dispatch, SetStateAction } from "react"
import { Tabs, TabsList, TabsTab, TabsPanel } from "@/components/coss/tabs"
import { QuestionSolution, type QuestionRecord } from "./question-content"
import { TextbookRangePicker } from "./textbook-range-picker"
import type { DirectorySelections } from "./textbook-directory"
import type { QuestionMetadata } from "./question-metadata"
import { textbooks } from "@/lib/prism-next/textbook-directory"

export type QuestionDetailTab = "answer" | "teaching" | "archive"
export type QuestionDetailState = {open:boolean;tab:QuestionDetailTab}
export function directoryLabels(links:DirectorySelections,kind?:"course"|"knowledge") {
  return textbooks.flatMap(book=>(kind?[kind]:["course","knowledge"] as const).flatMap(type=>(links[`${book.id}:${type}`]??[]).map(id=>{
    const data=book.directories[type], path=data.paths[id]??[]
    return {id,kind:type,label:[book.title,...path.map(key=>data.nodes[key]?.title).filter(Boolean)].join(" → ")}
  })))
}
function DataRow({label,children}:{label:string;children:React.ReactNode}) {return <div><dt className="mb-1 text-sm text-muted-foreground">{label}</dt><dd className="text-sm leading-7 text-foreground">{children}</dd></div>}
export function QuestionDetails({question,metadata,links,tab,onTabChange,onLinksChange,status="可用",canEdit=false}:{question:QuestionRecord;metadata:QuestionMetadata;links:DirectorySelections;tab:QuestionDetailTab;onTabChange:(value:QuestionDetailTab)=>void;onLinksChange:Dispatch<SetStateAction<DirectorySelections>>;status?:string;canEdit?:boolean}) {
  const courses=directoryLabels(links,"course"),knowledge=directoryLabels(links,"knowledge")
  return <Tabs value={tab} onValueChange={value=>onTabChange(value as QuestionDetailTab)} className="gap-5">
    <div className="overflow-x-auto overflow-y-hidden"><TabsList variant="underline" aria-label={`${question.title}详情分类`}><TabsTab value="answer">答案与解析</TabsTab><TabsTab value="teaching">教学定位</TabsTab><TabsTab value="archive">题目档案</TabsTab></TabsList></div>
    <TabsPanel value="answer"><QuestionSolution question={question}/></TabsPanel>
    <TabsPanel value="teaching"><div className="grid gap-6 sm:grid-cols-2"><dl className="space-y-4"><DataRow label="核心知识点">{metadata.knowledge.join(" · ")}</DataRow><DataRow label="考查方法">{metadata.method}</DataRow><DataRow label="认知要求">{metadata.demand}</DataRow></dl><dl className="space-y-4"><DataRow label="教材与章节">{courses.length?courses.map(item=><p key={item.id}>{item.label}</p>):"尚未关联教材章节"}</DataRow><DataRow label="知识点目录">{knowledge.length?knowledge.map(item=><p key={item.id}>{item.label}</p>):"尚未关联知识点目录"}</DataRow><DataRow label="课程标准">未关联</DataRow></dl></div>{canEdit&&<div className="mt-5"><TextbookRangePicker textbooks={textbooks} selections={links} onSelectionsChange={onLinksChange} compactTrigger triggerLabel="编辑教材与知识点"/></div>}</TabsPanel>
    <TabsPanel value="archive"><dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2"><DataRow label="题目编号">{question.id}</DataRow><DataRow label="题型与结构">{question.kind}{question.parts?` · 含 ${question.parts.length} 个小问`:""}</DataRow><DataRow label="来源">{metadata.source}</DataRow><DataRow label="版本">{metadata.version}</DataRow><DataRow label="可用状态">{status}</DataRow><DataRow label="使用范围">本组件库演示</DataRow><DataRow label="统计难度与使用记录">暂无真实作答及使用统计</DataRow><DataRow label="校验记录">人工编写的内容样例，未关联业务审核记录</DataRow>{metadata.note&&<DataRow label="维护说明">{metadata.note}</DataRow>}</dl></TabsPanel>
  </Tabs>
}
