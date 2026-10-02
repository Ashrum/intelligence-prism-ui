"use client"
import { useEffect, useState } from 'react'
import { Button } from '@/components/prism-next/button'
import { Collapsible, CollapsibleTrigger, CollapsiblePanel } from '@/components/coss/collapsible'
import { Avatar, AvatarFallback } from '@/components/coss/avatar'
import { objectiveGroups } from './analysis'
import { questionAnalyses, type ReviewQuestion, type StudentAnswer } from './fixture'
import { answerImage } from './artwork'

// Local host composition; coss controls retain their standard sizes.
export function AnswerGroups({question:q,answers,selected,onSelect,missing,annotations,onIncludeCorrect,filter}:{question:ReviewQuestion;answers:StudentAnswer[];selected:string|null;onSelect:(id:string)=>void;missing:boolean;annotations:boolean;onIncludeCorrect:()=>void;filter:string}) {
 const [correctOpen,setCorrectOpen]=useState(false)
 useEffect(()=>{if(filter==='loss')setCorrectOpen(false)},[filter])
 const groups=objectiveGroups(q,answers,questionAnalyses[q.id])
 const names=(students:StudentAnswer[])=><div className="flex flex-wrap gap-2">{students.map(a=><Button key={a.student.id} variant="ghost" aria-pressed={selected===a.student.id} onClick={()=>onSelect(a.student.id)}><Avatar aria-hidden="true"><AvatarFallback>{a.student.name[0]}</AvatarFallback></Avatar>{a.student.name}</Button>)}</div>
 return <section data-objective-groups className="space-y-6 p-10"><h2 className="text-block-title">作答分组</h2>{groups.errors.map(g=><section key={g.label} className="space-y-2"><h3 className="text-ui-action">{g.label} · {g.students.length} 人</h3>{names(g.students)}{q.type==='填空题'&&<img src={answerImage(q,g.students[0],annotations,missing)} alt={`${g.students[0].student.name} · 代表性作答裁切`} className="w-full"/>}</section>)}{groups.correct.length>0&&<Collapsible data-correct-group open={correctOpen} onOpenChange={open=>{setCorrectOpen(open);if(open)onIncludeCorrect()}}><CollapsibleTrigger render={<Button variant="ghost"/>}>{groups.correctLabel} · {groups.correct.length} 人</CollapsibleTrigger><CollapsiblePanel className="motion-reduce:transition-none">{names(groups.correct)}</CollapsiblePanel></Collapsible>}{!answers.length&&<p className="text-ui-body">没有符合筛选的学生</p>}</section>
}
export function FullScoreGroup({count,open,onOpenChange}:{count:number;open:boolean;onOpenChange:(open:boolean)=>void}) {
 return <Collapsible data-full-score-group open={open} onOpenChange={onOpenChange} className="p-4"><CollapsibleTrigger render={<Button variant="ghost"/>}>满分 {count} 人</CollapsibleTrigger><CollapsiblePanel className="motion-reduce:transition-none"><p className="text-ui-meta text-muted-foreground">满分作答已展开，见下方纸张。</p></CollapsiblePanel></Collapsible>
}
