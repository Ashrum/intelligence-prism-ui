"use client"
import { useState } from "react"
import { Button } from "@/components/coss/button"
import { Input } from "@/components/coss/input"
import { Textarea } from "@/components/coss/textarea"
import { Label } from "@/components/coss/label"
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription, DialogPanel, DialogFooter } from "@/components/coss/dialog"
import { QuestionSelect } from "./question-controls"
import { TextbookRangePicker } from "./textbook-range-picker"
import { textbooks } from "@/lib/prism-next/textbook-directory"
import type { DirectorySelections } from "./textbook-directory"
import type { QuestionAvailability } from "@/lib/prism-next/question-workspace"

export type QuestionMetadataDraft = {title:string;source:string;note:string;status:QuestionAvailability;links:DirectorySelections}
export function QuestionMetadataEditor({id,value,onClose,onSave}:{id:string;value:QuestionMetadataDraft;onClose:()=>void;onSave:(value:QuestionMetadataDraft)=>void}) {
  const [draft,setDraft]=useState(value),[error,setError]=useState(""),[discard,setDiscard]=useState(false)
  const dirty=JSON.stringify(draft)!==JSON.stringify(value)
  const close=()=>dirty?setDiscard(true):onClose()
  return <Dialog open onOpenChange={open=>{if(!open)close()}}><DialogPopup closeProps={{"aria-label":"关闭题目资料编辑"}}><DialogHeader><DialogTitle>编辑题目资料</DialogTitle><DialogDescription>{id} · {value.title}</DialogDescription></DialogHeader><DialogPanel><form id="question-metadata-form" className="space-y-5" onSubmit={event=>{event.preventDefault();if(!draft.title.trim()||!draft.source.trim()||(draft.status!=="ready"&&!draft.note.trim())){setError("请填写标题、来源，并说明不可用的原因。");return}onSave({...draft,title:draft.title.trim(),source:draft.source.trim(),note:draft.note.trim()})}}>
    <div className="space-y-2"><Label htmlFor="maintenance-title">题目标题</Label><Input id="maintenance-title" value={draft.title} onChange={event=>setDraft({...draft,title:event.target.value})}/></div>
    <div className="space-y-2"><Label htmlFor="maintenance-source">来源</Label><Input id="maintenance-source" value={draft.source} onChange={event=>setDraft({...draft,source:event.target.value})}/></div>
    <div className="space-y-2"><Label>可用状态</Label><QuestionSelect label="题目可用状态" value={draft.status} items={[{value:"ready",label:"可用"},{value:"review",label:"待审核"},{value:"paused",label:"暂停使用"}]} onChange={status=>setDraft({...draft,status:status as QuestionAvailability})}/></div>
    <TextbookRangePicker textbooks={textbooks} selections={draft.links} onSelectionsChange={update=>setDraft(previous=>({...previous,links:typeof update==="function"?update(previous.links):update}))} compactTrigger triggerLabel="教材与知识点关联"/>
    <div className="space-y-2"><Label htmlFor="maintenance-note">维护说明{draft.status!=="ready"?"（必填）":""}</Label><Textarea id="maintenance-note" value={draft.note} onChange={event=>setDraft({...draft,note:event.target.value})}/></div>
    {error&&<p role="alert" className="text-sm text-destructive-foreground">{error}</p>}
  </form>{discard&&<div role="alert" className="mt-5 space-y-3 rounded-lg bg-muted p-4 text-sm"><p>有未保存的修改，是否放弃？</p><div className="flex gap-2"><Button variant="outline" size="sm" onClick={()=>setDiscard(false)}>继续编辑</Button><Button variant="outline" size="sm" onClick={onClose}>放弃修改</Button></div></div>}</DialogPanel><DialogFooter><Button variant="outline" onClick={close}>取消</Button><Button type="submit" form="question-metadata-form" disabled={!dirty}>保存题目资料</Button></DialogFooter></DialogPopup></Dialog>
}
