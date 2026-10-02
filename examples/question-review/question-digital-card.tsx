"use client"
import { useEffect, useState } from 'react'
import { QuestionContent, QuestionSolution } from '@/components/prism-next/question-content'
import { QuestionHeading } from '@/components/prism-next/question-presentation'
import type { QuestionDetailTab } from '@/components/prism-next/question-details'
import { Tabs, TabsList, TabsTab, TabsPanel } from '@/components/coss/tabs'
import { ellipseFigure } from './question-records'
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
// Local composition keeps QuestionDetails' public API and default DOM untouched.
// Typography is explicit on the two content components authorized for Q7.
export function ReviewQuestionDetails({question:q,related,tab,onTabChange,scoring,onKnowledge}:{question:ReviewQuestion;related:string[];tab:QuestionDetailTab;onTabChange:(tab:QuestionDetailTab)=>void;scoring:React.ReactNode;onKnowledge:(id:string)=>void}) {
 const row=(label:string,value:React.ReactNode)=><div key={label}><dt className="text-ui-meta text-muted-foreground">{label}</dt><dd className="break-words text-ui-body">{value}</dd></div>
 return <Tabs value={tab} onValueChange={value=>onTabChange(value as QuestionDetailTab)} className="@container/question-details min-w-0 gap-4">
  <TabsList variant="underline" className="grid w-full min-w-0 auto-cols-fr grid-flow-col" aria-label={`${q.record.title}详情分类`}>{(['answer','teaching','archive'] as const).map(value=><TabsTab key={value} value={value} aria-label={{answer:'答案与解析',teaching:'教学定位',archive:'题目档案'}[value]}><span aria-hidden="true" className="@min-[400px]/question-details:hidden">{{answer:'答案',teaching:'定位',archive:'档案'}[value]}</span><span aria-hidden="true" className="hidden @min-[400px]/question-details:inline">{{answer:'答案与解析',teaching:'教学定位',archive:'题目档案'}[value]}</span></TabsTab>)}</TabsList>
  <TabsPanel value="answer" className="px-4"><QuestionSolution question={q.record} textSize="ui"/>{scoring}</TabsPanel>
  <TabsPanel value="teaching" className="px-4"><dl className="grid gap-4 sm:grid-cols-2">{row('核心知识点',related.map(id=>knowledgePoints.find(k=>k.id===id)!.name).join(' · ')||'未关联')}{row('教材与章节','尚未关联教材章节')}{row('考查方法','未关联')}{row('知识点目录','尚未关联知识点目录')}{row('认知要求','未关联')}{row('课程标准','未关联')}</dl><section aria-label="关联知识点导航" className="mt-4 flex flex-wrap gap-2">{related.map(id=><Button key={id} variant="link" className="h-auto sm:h-auto whitespace-normal text-left" onClick={()=>onKnowledge(id)}>{knowledgePoints.find(k=>k.id===id)!.name}</Button>)}</section></TabsPanel>
  <TabsPanel value="archive" className="px-4"><dl className="grid gap-4 sm:grid-cols-2">{row('题目编号',q.record.id)}{row('题型与结构',`${q.record.kind}${q.record.parts?` · 含 ${q.record.parts.length} 个小问`:''}`)}{row('来源','未提供')}{row('版本','未提供')}{row('可用状态','未提供')}{row('分值',`${q.max} 分`)}</dl></TabsPanel>
 </Tabs>
}
export function QuestionDigitalCard({question:q,answers,selected,onSelect,missing,annotations,onIncludeCorrect,filter,markedPoints,onKnowledge}:{question:ReviewQuestion;answers:StudentAnswer[];selected:string|null;onSelect:(id:string)=>void;missing:boolean;annotations:boolean;onIncludeCorrect:()=>void;filter:string;markedPoints:string[];onKnowledge:(id:string)=>void}) {
 const [tab,setTab]=useState<QuestionDetailTab>('answer'),stats=questionAnalyses[q.id]
 useEffect(()=>{if(markedPoints.length)setTab('answer')},[markedPoints])
 const related=[...new Set(q.points.flatMap(point=>point.knowledge))]
 const scoring=<section data-class-scoring-points className="mt-4 space-y-2" aria-label="评分点"><h4 className="text-item-title">评分点</h4>{q.points.map(point=><div key={point.id} data-scoring-point={point.id} className={`rounded-lg p-2 ${markedPoints.includes(point.id)?'ring-2 ring-info':''}`}><div className="flex flex-wrap items-baseline justify-between gap-2 text-ui-body"><span>{point.label}</span><span className="text-ui-meta">{point.max} 分</span></div>{q.category==='subjective'&&<div className="mt-2 flex items-center gap-2" aria-label={`${point.label}全班得分率 ${point.rate}%`}><ThinBar value={point.rate}/><span className="text-ui-meta tabular-nums">{point.rate}%</span></div>}</div>)}</section>
 const contentRecord={...q.record,figure:[12,17].includes(q.number)?ellipseFigure(q.number,'ui'):q.record.figure}
 return <article data-question-id={q.id} data-question-level="L2" data-digital-question className="q6-question-card prism-question min-w-0 rounded-xl bg-card px-4 py-5 text-ui-body text-card-foreground shadow-xs/5 ring-1 ring-border" aria-labelledby={`digital-${q.id}`}>
  <div className="q7-question-content min-w-0 w-full space-y-4">
  <QuestionHeading question={q.record} number={q.number} id={`digital-${q.id}`}/>
  <QuestionContent question={contentRecord} textSize="ui" optionExtra={q.type==='选择题'?id=>{const option=stats.options!.find(o=>o.label===id)!;return <OptionStatistics key={`${q.id}-${id}`} option={option} students={answers.filter(a=>a.option===id)} selected={selected} onSelect={onSelect} distractor={id===stats.distractor} filter={filter} onIncludeCorrect={onIncludeCorrect}/>} : undefined}/>
  {q.type==='填空题'&&<AnswerGroups question={q} answers={answers} selected={selected} onSelect={onSelect} missing={missing} annotations={annotations} onIncludeCorrect={onIncludeCorrect} filter={filter}/>}
  <div className="question-detail-region min-w-0 rounded-xl bg-secondary py-4">
   <ReviewQuestionDetails question={q} related={related} tab={tab} onTabChange={setTab} scoring={scoring} onKnowledge={onKnowledge}/>
  </div>
  </div>
 </article>
}
