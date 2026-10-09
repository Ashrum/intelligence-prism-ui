"use client"

import {useRef, useState, type ReactNode} from 'react'
import {ChevronDown, Info} from 'lucide-react'
import {Alert} from '@/components/coss/alert'
import {Collapsible, CollapsiblePanel, CollapsibleTrigger} from '@/components/coss/collapsible'
import {Meter, MeterIndicator, MeterTrack} from '@/components/coss/meter'
import {Popover, PopoverPopup, PopoverTitle, PopoverTrigger} from '@/components/coss/popover'
import {Button} from './button'
import {Badge} from './badge'
import {SegmentedBar, type SegmentedBarSegment} from './charts/segmented-bar'
import {KnowledgeEvidenceList} from './knowledge-rail'
import {Rate} from './question-analysis-parts'
import type {QuestionAnalysisPanelDetailedProps} from './question-analysis-panel'

export type QuestionAnalysisMetric = {id:string; label:string; value:ReactNode; hint?:ReactNode; badge?:ReactNode}
export type QuestionAnalysisDistribution =
 | {kind:'options'; title:string; aside?:ReactNode; options:{id:string; label:string; count:number|null; correct?:boolean; emphasis?:boolean}[]; legend?:ReactNode}
 | {kind:'segments'; title:string; aside?:ReactNode; segments:readonly SegmentedBarSegment[]}
export type QuestionAnalysisComparison = {id:string; label:string; value:number|null; source?:ReactNode; date?:ReactNode}
export type QuestionAnalysisPanelCompactProps = Partial<Omit<QuestionAnalysisPanelDetailedProps,'layout'|'distribution'>> & {
 layout:'compact'
 title?:string
 verdict?:{label:string; tone:'neutral'|'info'|'success'|'warning'|'destructive'; summary:ReactNode}
 keyMetrics?:QuestionAnalysisMetric[]
 distribution?:QuestionAnalysisDistribution | number[]
 distributionSlot?:ReactNode
 comparisons?:{title:string; unit?:string; items:QuestionAnalysisComparison[]; maxVisible?:number}
 causes?:{title:string; items:{id:string; label:string; count:number|null}[]; maxVisible?:number}
 disclosures?:{id:string; label:string; meta?:ReactNode; content:ReactNode}[]
 notes?:{title?:string; sections:{id:string; heading:string; content:ReactNode}[]}
 actions?:ReactNode
}

const known = (value:number|null):value is number => typeof value==='number' && Number.isFinite(value)
const supplied = (value:ReactNode) => value ?? '未提供'
const percentage = (value:ReactNode) => value==null?'未提供':typeof value==='number'||(typeof value==='string'&&value.trim()!==''&&Number.isFinite(Number(value)))?`${value}%`:value
const signed = (value:number|null, unit='') => known(value)?`${value>0?'+':''}${value}${unit?` ${unit}`:''}`:'未提供'
const visibleCount = (value:number|undefined, fallback:number) => value!==undefined&&Number.isFinite(value)&&value>=0?Math.floor(value):fallback
const toneVariants = {neutral:'default', info:'info', success:'success', warning:'warning', destructive:'error'} as const

function Metrics({items, primary=false}:{items:QuestionAnalysisMetric[]; primary?:boolean}) {
 return <dl data-analysis-metrics={primary?'primary':'notes'} className={primary?'grid grid-cols-3 gap-3':'grid gap-3'}>{items.map(item=><div key={item.id} className="min-w-0 space-y-1 [overflow-wrap:anywhere]">
  <dt className="text-ui-meta text-muted-foreground">{item.label}</dt>
  <dd className={`${primary?'text-stat-display':'text-ui-body'} tabular-nums`}>{supplied(item.value)}</dd>
  {item.hint!=null&&<dd className="text-ui-hint text-muted-foreground">{item.hint}</dd>}
  {item.badge!=null&&<dd><Badge variant="outline" className="max-w-full whitespace-normal">{item.badge}</Badge></dd>}
 </div>)}</dl>
}

function Block({title, aside, children}:{title:string; aside?:ReactNode; children:ReactNode}) {
 return <section aria-label={title} className="space-y-2 border-t pt-4"><div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="text-ui-action">{title}</h3>{aside!=null&&<div className="text-ui-meta text-muted-foreground">{aside}</div>}</div>{children}</section>
}

function CountRow({label,count,max,correct,emphasis}:{label:string;count:number|null;max:number;correct?:boolean;emphasis?:boolean}) {
 const text=known(count)&&count>=0?`${count} 人`:'未提供'
 return <div data-analysis-count className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_minmax(3rem,auto)] items-center gap-2 text-ui-body">
  <span className="min-w-0 [overflow-wrap:anywhere]">{label}{correct&&<span className="block text-ui-meta">正确</span>}</span>
  {known(count)&&count>=0?<Meter value={count} min={0} max={max} aria-label={`${label}${correct?'（正确选项）':''}：${text}`} aria-valuetext={text}>
   <MeterTrack><MeterIndicator className={`${correct?'bg-success':emphasis?'bg-destructive':'bg-chart-1'} motion-reduce:transition-none`}/></MeterTrack>
  </Meter>:<span/>}
  <span className="text-right tabular-nums [overflow-wrap:anywhere]">{text}</span>
 </div>
}

function Disclosure({label,meta,children}:{label:string;meta?:ReactNode;children:ReactNode}) {
 const [open,setOpen]=useState(false), trigger=useRef<HTMLButtonElement>(null)
 return <Collapsible open={open} onOpenChange={setOpen} onKeyDown={event=>{
  if(event.key==='Escape'&&open&&!event.defaultPrevented){event.preventDefault();event.stopPropagation();setOpen(false);trigger.current?.focus()}
 }}>
  <CollapsibleTrigger ref={trigger} render={<Button variant="outline" className="h-auto w-full justify-between whitespace-normal py-2 text-left"/>}>
   <span>{label}{meta!=null&&<span className="text-ui-meta text-muted-foreground"> · {meta}</span>}</span><ChevronDown aria-hidden className="size-4 shrink-0"/>
  </CollapsibleTrigger>
  <CollapsiblePanel className="motion-reduce:transition-none"><div className="space-y-2 pt-3">{children}</div></CollapsiblePanel>
 </Collapsible>
}

/** Internal compact composition; does not add a catalog component. */
export function QuestionAnalysisPanelCompact(props:QuestionAnalysisPanelCompactProps) {
 const {title='本题分析',verdict,keyMetrics=[],distribution,distributionSlot,comparisons,disclosures=[],notes,actions,statistics,supplementaryMetrics=[],max,knowledge:k}=props
 const [root,setRoot]=useState<HTMLElement|null>(null)
 const legacy:QuestionAnalysisMetric[]=statistics?[
  {id:'mean',label:'平均分',value:statistics.mean,hint:max!=null?<>满分 {max}</>:undefined},
  {id:'sd',label:'标准差',value:statistics.sd},
  {id:'d',label:'区分度',value:statistics.d,badge:statistics.discrimination},
  {id:'fullRate',label:'满分率',value:percentage(statistics.fullRate)},
  {id:'zeroRate',label:'零分率',value:percentage(statistics.zeroRate)},
 ]:[]
 legacy.push(...supplementaryMetrics.map(item=>({...item,id:item.id??item.label})))
 const matches=(key:QuestionAnalysisMetric,item:QuestionAnalysisMetric)=>key.id===item.id||key.label===item.label
 const selected=keyMetrics.map(key=>({...legacy.find(item=>matches(key,item)),...key}))
 const otherMetrics=[...selected.slice(3),...legacy.filter(item=>!keyMetrics.some(key=>matches(key,item)))]
 const comparisonItems=comparisons?.items??[], limit=visibleCount(comparisons?.maxVisible,3)
 const visibleComparisons=comparisonItems.slice(0,limit), hiddenComparisons=comparisonItems.slice(limit)
 const comparisonNotes=comparisonItems.filter((item,index)=>index>=limit||item.source!=null||item.date!=null)
 const amplitude=Math.max(1,...comparisonItems.map(item=>known(item.value)?Math.abs(item.value):0))
 const causes=props.causes??(props.reasons?{title:'错因',items:props.reasons.map((item,index)=>({id:`reason-${index}`,label:item.text,count:item.count}))}:undefined)
 const causeLimit=Math.min(4,visibleCount(props.causes?.maxVisible,4)), causeMax=Math.max(1,...(causes?.items??[]).map(item=>known(item.count)?item.count:0))
 const hasLegacyNotes=Array.isArray(distribution)&&distribution.length>0||props.insight!=null||props.pending!=null
 const hasNotes=!!(notes?.sections.length||otherMetrics.length||comparisonNotes.length||hasLegacyNotes)
 const notesContent=<div className="space-y-4 text-ui-body [overflow-wrap:anywhere]">
  {(notes?.sections??[]).map(section=><section key={section.id} className="space-y-1"><h4 className="text-ui-action">{section.heading}</h4><div>{section.content}</div></section>)}
  {otherMetrics.length>0&&<section className="space-y-2"><h4 className="text-ui-action">其他统计</h4><Metrics items={otherMetrics}/></section>}
  {comparisonNotes.length>0&&<section className="space-y-2"><h4 className="text-ui-action">参照说明</h4><ul className="space-y-3">{comparisonNotes.map(item=><li key={item.id} data-analysis-reference-note={item.id}>
   <span>{item.label}{hiddenComparisons.includes(item)&&<>：{signed(item.value,comparisons?.unit)}</>}</span>
   <p className="text-ui-hint text-muted-foreground">来源：{supplied(item.source)} · 日期：{supplied(item.date)}</p>
  </li>)}</ul></section>}
  {hasLegacyNotes&&<section className="space-y-2"><h4 className="text-ui-action">补充说明</h4>{Array.isArray(distribution)&&distribution.length>0&&<p>分布（按提供顺序）：{distribution.join(' · ')}</p>}{props.insight!=null&&<div>{props.insight}</div>}{props.pending!=null&&<p>待复核：{props.pending}</p>}</section>}
 </div>
 return <section ref={setRoot} data-analysis-layout="compact" aria-label={title} className="min-w-0 space-y-4 [overflow-wrap:anywhere]">
  <header className="flex items-start justify-between gap-2"><h2 className="text-block-title">{title}</h2>{hasNotes&&<Popover>
   <PopoverTrigger render={<Button variant="ghost" size="sm"/>}><Info aria-hidden className="size-4"/>说明</PopoverTrigger>
   <PopoverPopup align="end" portalProps={{container:root}} className="w-80 max-w-[calc(100vw-2rem)] motion-reduce:transition-none" aria-label={notes?.title??'说明'}>
    <PopoverTitle className="text-ui-action mb-3">{notes?.title??'说明'}</PopoverTitle>{notesContent}
   </PopoverPopup>
  </Popover>}</header>
  {verdict&&<Alert role="group" aria-label="结论" variant={toneVariants[verdict.tone]} className="gap-y-2"><div><Badge variant={verdict.tone==='neutral'?'outline':toneVariants[verdict.tone]}>{verdict.label}</Badge></div><p className="text-ui-body">{supplied(verdict.summary)}</p></Alert>}
  {selected.length>0&&<Metrics items={selected.slice(0,3)} primary/>}
  {distribution&&!Array.isArray(distribution)&&<Block title={distribution.title} aside={distribution.aside}>
   {distribution.kind==='segments'?<SegmentedBar label={distribution.title} segments={distribution.segments} unit="人"/>:<>
    <div className="space-y-2">{distribution.options.map(item=><CountRow key={item.id} {...item} max={Math.max(1,...distribution.options.map(option=>known(option.count)?option.count:0))}/>)}</div>
    {distribution.legend!=null&&<p className="text-ui-hint text-muted-foreground">{distribution.legend}</p>}
   </>}
  </Block>}
  {distributionSlot}
  {comparisonItems.length>0&&comparisons&&<Block title={comparisons.title} aside={comparisons.unit}>
   <div className="space-y-2">{visibleComparisons.map(item=><div key={item.id} data-analysis-comparison={item.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_minmax(3rem,auto)] items-center gap-2 text-ui-body">
    <span className="min-w-0 [overflow-wrap:anywhere]">{item.label}</span>
    <div role="img" aria-label={`${item.label}：${signed(item.value,comparisons.unit)}`} className="relative h-4">
     <span aria-hidden className="absolute inset-y-0 left-1/2 border-l"/>
     {known(item.value)&&item.value!==0&&<span aria-hidden data-direction={item.value<0?'negative':'positive'} className={`absolute top-1 h-2 ${item.value<0?'bg-destructive':'bg-success'}`} style={{[item.value<0?'right':'left']:'50%',width:`${Math.abs(item.value)/amplitude*50}%`}}/>}
    </div>
    <span className="text-right tabular-nums [overflow-wrap:anywhere]">{signed(item.value)}</span>
   </div>)}</div>
   {hiddenComparisons.length>0&&<p className="text-ui-hint text-muted-foreground">另有 {hiddenComparisons.length} 个参照</p>}
  </Block>}
  {causes&&<Block title={causes.title}>
   {causes.items.slice(0,causeLimit).map(item=><CountRow key={item.id} {...item} max={causeMax}/>)}
   {causes.items.length===0&&props.reasonsEmptyText}
   {causes.items.length>causeLimit&&<Disclosure label="更多错因" meta={`${causes.items.length-causeLimit} 项`}>{causes.items.slice(causeLimit).map(item=><CountRow key={item.id} {...item} max={causeMax}/>)}</Disclosure>}
  </Block>}
  {disclosures.map(item=><Disclosure key={item.id} label={item.label} meta={item.meta}>{item.content}</Disclosure>)}
  {props.errorAnswersSlot!==undefined?props.errorAnswersSlot:props.errorAnswers&&<Block title="典型错误答案"><ul className="space-y-2 text-ui-body">{props.errorAnswers.map((item,index)=><li key={index}>{item.text} · {item.count} 人</li>)}</ul></Block>}
  {(props.related?.length||props.relatedEmptyText!=null)?<Block title="关联知识点"><div className="flex flex-wrap gap-1">{props.related?.map(item=><Button key={item.id} variant="link" className="h-auto whitespace-normal" disabled={!props.onKnowledge} onClick={()=>props.onKnowledge?.(item.id)}>{item.name}</Button>)}</div>{!props.related?.length&&<p className="text-ui-hint text-muted-foreground">{props.relatedEmptyText}</p>}</Block>:null}
  {k&&<Block title="知识点概况"><p className="text-ui-body">{k.topic}</p>{known(k.rate??null)?<Rate value={k.rate!} label="知识点本次得分率"/>:k.rateEmptyText}<p className="text-ui-body">{props.affectedLabel??'受影响'} {supplied(k.affected)} / {supplied(props.total)} 名学生</p><p className="text-ui-body">{k.volumeText??k.volume}</p>{k.status&&<Badge variant="outline">{k.status}</Badge>}{!k.evidence.length&&props.evidenceEmptyText}<KnowledgeEvidenceList items={k.evidence} onEvidence={props.onEvidence??(()=>{})}/><p className="text-ui-meta text-muted-foreground">单次试卷不表达长期掌握度</p></Block>}
  {actions}
 </section>
}
