"use client"
import { useEffect, useState } from 'react'
import { QuestionContent } from '@/components/prism-next/question-content'
import { QuestionHeading } from '@/components/prism-next/question-presentation'
import { QuestionDetails, type QuestionDetailTab } from '@/components/prism-next/question-details'
import { Button } from '@/components/prism-next/button'
import { Badge } from '@/components/coss/badge'
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from '@/components/coss/collapsible'
import { Avatar, AvatarFallback } from '@/components/coss/avatar'
import { AnswerGroups } from './answer-groups'
import { ThinBar } from './parts'
import { knowledgePoints, questionAnalyses, type ReviewQuestion, type StudentAnswer } from './fixture'

function OptionStatistics({option,students,selected,onSelect,distractor,onIncludeCorrect,filter}:{option:NonNullable<typeof questionAnalyses[string]['options']>[number];students:StudentAnswer[];selected:string|null;onSelect:(id:string)=>void;distractor:boolean;onIncludeCorrect:()=>void;filter:string}) {
 const [open,setOpen]=useState(!option.correct)
 useEffect(()=>{if(filter==='loss'&&option.correct)setOpen(false)},[filter,option.correct])
 return <>
  <div data-option-statistics={option.label} className="q6-option-statistics flex min-w-0 items-center gap-2 text-ui-meta tabular-nums"><ThinBar value={option.count/36*100}/><span className="whitespace-nowrap">{option.count} 人 · {Math.round(option.count/36*100)}%</span></div>
  <div className="col-span-2 col-start-2 flex flex-wrap items-center gap-2 text-ui-meta text-muted-foreground"><span>高分组 {option.high} · 低分组 {option.low}</span>{option.correct&&<Badge size="sm" variant="success">✓ 正确</Badge>}{distractor&&<Badge size="sm" variant="outline">主要干扰项</Badge>}</div>
  <Collapsible className="col-span-2 col-start-2" data-correct-group={option.correct||undefined} data-option-group={option.label} open={open} onOpenChange={value=>{setOpen(value);if(value&&option.correct)onIncludeCorrect()}}>
   <CollapsibleTrigger render={<Button variant="ghost"/>}>{option.count} 人，{open?'收起名单':'展开查看'}</CollapsibleTrigger>
   <CollapsiblePanel className="motion-reduce:transition-none"><div className="flex flex-wrap gap-2 pt-2">{students.map(a=><Button key={a.student.id} variant="ghost" aria-pressed={a.student.id===selected} onClick={()=>onSelect(a.student.id)}><Avatar aria-hidden="true"><AvatarFallback>{a.student.name[0]}</AvatarFallback></Avatar>{a.student.name}</Button>)}</div></CollapsiblePanel>
  </Collapsible>
 </>
}
export function QuestionDigitalCard({question:q,answers,selected,onSelect,missing,annotations,onIncludeCorrect,filter,markedPoints,onKnowledge}:{question:ReviewQuestion;answers:StudentAnswer[];selected:string|null;onSelect:(id:string)=>void;missing:boolean;annotations:boolean;onIncludeCorrect:()=>void;filter:string;markedPoints:string[];onKnowledge:(id:string)=>void}) {
 const [tab,setTab]=useState<QuestionDetailTab>('answer'),stats=questionAnalyses[q.id]
 useEffect(()=>{if(markedPoints.length)setTab('answer')},[markedPoints])
 const related=[...new Set(q.points.flatMap(point=>point.knowledge))]
 const scoring=<section data-class-scoring-points className="mt-6 space-y-3" aria-label="评分点"><h4 className="text-item-title">评分点</h4>{q.points.map(point=><div key={point.id} data-scoring-point={point.id} className={`rounded-lg p-2 ${markedPoints.includes(point.id)?'ring-2 ring-info':''}`}><div className="flex flex-wrap items-baseline justify-between gap-2 text-ui-body"><span>{point.label}</span><span className="text-ui-meta">{point.max} 分</span></div>{q.category==='subjective'&&<div className="mt-2 flex items-center gap-2" aria-label={`${point.label}全班得分率 ${point.rate}%`}><ThinBar value={point.rate}/><span className="text-ui-meta tabular-nums">{point.rate}%</span></div>}</div>)}</section>
 // QuestionRecord.explanation is the existing ReactNode extension, keeping the
 // host rubric within QuestionDetails' answer tab without a second tabs widget.
 const detailRecord={...q.record,explanation:<>{q.record.explanation}{scoring}</>}
 return <article data-question-id={q.id} data-question-level="L2" data-digital-question className="q6-question-card prism-question min-w-0 space-y-5 rounded-xl bg-card p-4 text-card-foreground shadow-xs/5 ring-1 ring-border" aria-labelledby={`digital-${q.id}`}>
  <QuestionHeading question={q.record} number={q.number} id={`digital-${q.id}`}/>
  <QuestionContent question={q.record} optionExtra={q.type==='选择题'?id=>{const option=stats.options!.find(o=>o.label===id)!;return <OptionStatistics key={`${q.id}-${id}`} option={option} students={answers.filter(a=>a.option===id)} selected={selected} onSelect={onSelect} distractor={id===stats.distractor} filter={filter} onIncludeCorrect={onIncludeCorrect}/>} : undefined}/>
  {q.type==='填空题'&&<AnswerGroups question={q} answers={answers} selected={selected} onSelect={onSelect} missing={missing} annotations={annotations} onIncludeCorrect={onIncludeCorrect} filter={filter}/>}
  <div className="question-detail-region min-w-0 rounded-xl bg-secondary p-4">
   <QuestionDetails question={detailRecord} metadata={{knowledge:related.map(id=>knowledgePoints.find(k=>k.id===id)!.name),method:'',demand:'',family:'',source:'未提供',version:'未提供'}} links={{}} onLinksChange={()=>{}} tab={tab} onTabChange={setTab} status="未提供" archive={[{label:'分值',value:`${q.max} 分`}]}/>
   {tab==='teaching'&&<section aria-label="关联知识点导航" className="mt-4 flex flex-wrap gap-2">{related.map(id=><Button key={id} variant="link" className="h-auto sm:h-auto whitespace-normal text-left" onClick={()=>onKnowledge(id)}>{knowledgePoints.find(k=>k.id===id)!.name}</Button>)}</section>}
  </div>
 </article>
}
