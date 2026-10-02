"use client"
import {useEffect,useState,type ReactNode} from 'react'
import {Button} from './button'
import {Avatar,AvatarFallback} from '@/components/coss/avatar'
import {Collapsible,CollapsibleTrigger,CollapsiblePanel} from '@/components/coss/collapsible'
import type {AnalysisStudent} from './question-analysis-card'
export type QuestionAnalysisGroupsProps = {groups:{errors:{label:ReactNode;students:AnalysisStudent[];image?:{src:string;alt:string}}[];correct:AnalysisStudent[];correctLabel:ReactNode};empty?:boolean;selected:string|null;onSelect:(id:string)=>void;onIncludeCorrect:()=>void;filter:string}
export function QuestionAnalysisGroups({groups,empty,selected,onSelect,onIncludeCorrect,filter}:QuestionAnalysisGroupsProps) {
 const [correctOpen,setCorrectOpen]=useState(false)
 useEffect(()=>{if(filter==='loss')setCorrectOpen(false)},[filter])

 const names=(students:AnalysisStudent[])=><div className="flex flex-wrap gap-2">{students.map(a=><Button key={a.id} variant="ghost" aria-pressed={selected===a.id} onClick={()=>onSelect(a.id)}><Avatar aria-hidden="true"><AvatarFallback>{a.name[0]}</AvatarFallback></Avatar>{a.name}</Button>)}</div>
 return <section data-objective-groups className="space-y-4"><h2 className="text-item-title">作答情况</h2>{groups.errors.map((g,index)=><section key={index} className="space-y-2"><h3 className="text-ui-action">{g.label} · {g.students.length} 人</h3>{names(g.students)}{g.image&&<img src={g.image.src} alt={g.image.alt} className="w-full max-w-sm"/>}</section>)}{groups.correct.length>0&&<Collapsible data-correct-group open={correctOpen} onOpenChange={open=>{setCorrectOpen(open);if(open)onIncludeCorrect()}}><CollapsibleTrigger render={<Button variant="ghost"/>}>{groups.correctLabel} · {groups.correct.length} 人</CollapsibleTrigger><CollapsiblePanel className="motion-reduce:transition-none">{names(groups.correct)}</CollapsiblePanel></Collapsible>}{empty&&<p className="text-ui-body">没有符合筛选的学生</p>}</section>
}
