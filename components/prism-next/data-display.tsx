"use client"

import { PopoverPopup } from "@/components/prism-next/scoped-overlays"
import { useId, type ReactNode } from "react"
import { CircleHelp } from "lucide-react"
import { Button } from "@/components/coss/button"
import { Popover, PopoverTrigger } from "@/components/coss/popover"
import { metricVisualModel, type MetricVisual } from "@/lib/prism-next/metric-visual"
import { Progress } from "@/components/coss/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/coss/table"
import { compositionSummary,formatChartValue,isChartValue } from "@/lib/prism-next/chart-options"
import { QuestionSelect } from "./question-controls"

export type MetricSummaryItem={id:string;label:string;value:ReactNode;detail?:ReactNode;visual?:MetricVisual;help?:ReactNode}
export type {MetricVisual} from "@/lib/prism-next/metric-visual"
function MetricLabel({item}:{item:MetricSummaryItem}){
 return <>{item.label}{item.help!=null&&<Popover><PopoverTrigger render={<Button variant="ghost" size="icon-xs" className="text-muted-foreground hover:text-foreground"/>} aria-label={`${item.label}：指标说明`}><CircleHelp size={14} className="size-3.5" aria-hidden="true" /></PopoverTrigger><PopoverPopup aria-label={`${item.label}：指标说明`} className="max-w-72"><div className="whitespace-normal break-words text-ui-body">{item.help}</div></PopoverPopup></Popover>}</>
}
function MetricMiniVisual({visual,grid=false,dataId}:{visual:MetricVisual;grid?:boolean;dataId?:string}){
 const model=metricVisualModel(visual,dataId)
 return <><svg aria-hidden="true" focusable="false" viewBox={model.kind==="ring"?"0 0 56 56":"0 0 72 40"} className={grid?(model.kind==="ring"?"size-14 shrink-0":"h-10 w-18 shrink-0"):"h-14 w-18 shrink-0"} data-metric-visual={model.kind}>{model.kind==="ring"?<><circle cx={28} cy={28} r={22} fill="none" stroke="var(--border)" strokeWidth={6}/>{model.ratio!==null&&<circle cx={28} cy={28} r={22} fill="none" stroke="var(--chart-1)" strokeWidth={6} pathLength={1} strokeDasharray={`${model.ratio} 1`} transform="rotate(-90 28 28)"/>}</>:model.runs.map((run,index)=><g key={index}>{run.length>=2&&<polyline points={run.map(p=>`${p.x},${p.y}`).join(" ")} fill="none" stroke="var(--chart-1)" strokeWidth={2}/>}{run.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r={2} fill="var(--chart-1)"/>)}</g>)}</svg><span className="sr-only">{model.text}</span></>
}
function VisualMetric({item,onSelect,compact,strip,index=0}:{item:MetricSummaryItem;onSelect?:(id:string)=>void;compact:boolean;strip:boolean;index?:number}){
 return <div className={`grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 ${strip?`@min-[400px]:px-3 ${index?"@min-[400px]:border-l @min-[400px]:border-border":"@min-[400px]:pl-0"}`:""}`}>
  <dt className={`${strip?"text-ui-meta":"text-ui-hint"} col-start-1 text-muted-foreground`}><MetricLabel item={item}/></dt>
  <dd className={`analytics-value col-start-1 break-words ${strip?"my-0! text-stat-display tabular-nums":compact?"my-0!":""}`}>{item.value}</dd>
  {item.detail&&<dd className="col-start-1 text-ui-hint text-muted-foreground">{item.detail}</dd>}
  <dd className="col-start-2 row-span-3 row-start-1"><MetricMiniVisual visual={item.visual!} dataId={item.id}/></dd>
  {onSelect&&<dd className="col-span-2"><Button variant="ghost" size="sm" onClick={()=>onSelect(item.id)}>查看{item.label}明细</Button></dd>}
 </div>
}
export function MetricSummary({items,onSelect,density="default",layout}:{items:MetricSummaryItem[];onSelect?:(id:string)=>void;density?:"default"|"compact";layout?:"row"|"grid"|"strip"}){
 if(layout==="grid") return <dl data-metric-layout="grid" className="@container grid min-w-0 grid-cols-2">{items.map((item,index)=><div key={item.id} className={`grid min-w-0 grid-cols-1 items-center gap-x-3 gap-y-1 p-4 @min-[440px]:grid-cols-[minmax(0,1fr)_auto] ${index%2?"border-l border-border":""} ${index>=2?"border-t border-border":""}`}>
  <dt className="col-start-1 flex flex-wrap items-center gap-1 text-ui-body text-muted-foreground [overflow-wrap:anywhere]"><MetricLabel item={item}/></dt>
  <dd className="col-start-1 break-words text-stat-display tabular-nums">{item.value}</dd>
  {item.detail&&<dd className="col-start-1 text-ui-hint text-muted-foreground [overflow-wrap:anywhere]">{item.detail}</dd>}
  {item.visual&&<dd className="@min-[440px]:col-start-2 @min-[440px]:row-span-3 @min-[440px]:row-start-1"><MetricMiniVisual visual={item.visual} grid dataId={item.id}/></dd>}
  {onSelect&&<dd className="col-span-full"><Button variant="ghost" size="sm" onClick={()=>onSelect(item.id)}>查看{item.label}明细</Button></dd>}
 </div>)}</dl>
 if(layout==="strip"||layout==="row") return <dl data-metric-layout="strip" className="grid min-w-0 grid-cols-1 gap-y-3 @min-[400px]:grid-cols-2 @min-[680px]:grid-cols-4">{items.map((item,index)=>item.visual?<VisualMetric key={item.id} item={item} onSelect={onSelect} compact={density==="compact"} strip index={index}/>:<div key={item.id} className={`min-w-0 space-y-1 @min-[400px]:px-3 ${index ? "@min-[400px]:border-l @min-[400px]:border-border" : "@min-[400px]:pl-0"}`}>
  <dt className="text-ui-meta text-muted-foreground"><MetricLabel item={item}/></dt><dd className="analytics-value my-0! break-words text-stat-display tabular-nums">{item.value}</dd>
  {item.detail&&<dd className="text-ui-hint text-muted-foreground">{item.detail}</dd>}
  {onSelect&&<dd><Button variant="ghost" size="sm" onClick={()=>onSelect(item.id)}>查看{item.label}明细</Button></dd>}
 </div>)}</dl>
 return <dl style={items.some(item=>item.visual)?{gridTemplateColumns:"repeat(auto-fit, minmax(min(100%, 220px), 1fr))"}:undefined} className={density==="compact"?"grid grid-cols-2 gap-x-4 gap-y-2":"analytics-metrics"}>{items.map(item=>item.visual?<VisualMetric key={item.id} item={item} onSelect={onSelect} compact={density==="compact"} strip={false}/>:<div key={item.id} className={density==="compact"?"flex flex-wrap items-baseline gap-x-2":undefined}><dt className="text-ui-hint text-muted-foreground"><MetricLabel item={item}/></dt><dd className={density==="compact"?"analytics-value my-0!":"analytics-value"}>{item.value}</dd>{item.detail&&<dd className={density==="compact"?"w-full text-ui-hint text-muted-foreground":"text-ui-hint text-muted-foreground"}>{item.detail}</dd>}{onSelect&&<dd className="mt-2"><Button variant="ghost" size="sm" onClick={()=>onSelect(item.id)}>查看{item.label}明细</Button></dd>}</div>)}</dl>}
export function GoalComparison({baseline,current,target,unit="",labels=["基线","当前","目标"],status,children}:{baseline:number|null;current:number|null;target:number|null;unit?:string;labels?:[string,string,string];status?:ReactNode;children?:ReactNode}){
 const progress=baseline!==null&&current!==null&&target!==null&&Number.isFinite(baseline+current+target)&&target>baseline?Math.max(0,Math.min(100,(current-baseline)/(target-baseline)*100)):null
 return <div className="space-y-4"><dl className="analytics-goal-values">{[baseline,current,target].map((value,i)=><div key={i}><dt className="text-ui-hint text-muted-foreground">{labels[i]}</dt><dd className="mt-2 text-section-title tabular-nums">{value===null?"—":`${value}${unit}`}</dd></div>)}</dl>{progress!==null&&<Progress value={progress} aria-label="基线至目标的数值进展"/>}{status}{children}</div>
}
export function StatusComposition({items,onSelect,selectedId,unit="",label="状态组成",density="default"}:{items:{id:string;label:string;value:number|null;color?:string}[];onSelect?:(id:string)=>void;selectedId?:string;unit?:string;label?:string;density?:"default"|"compact"}){
 const colored=items.map((item,i)=>({...item,color:item.color??(i%6===5?"var(--muted-foreground)":`var(--chart-${i%6+1})`)}))
 const {total,invalid,missing}=compositionSummary(items)
 const summary=(item:typeof items[number])=>`${item.label}：${item.value===null?"缺测":!isChartValue(item.value)||item.value<0?"无效数值":`${formatChartValue(item.value,unit)} · ${total?`${Math.round(item.value/total*1000)/10}%`:"占比 —"}`}`
 return <div className={density==="compact"?"space-y-2":"space-y-4"} role="group" aria-label={label}>
 {total>0?<div className={`flex ${density==="compact"&&!onSelect?"h-2":"h-8"} gap-px overflow-hidden rounded-md`}>{colored.filter(x=>isChartValue(x.value)&&x.value>0).map(item=>onSelect?<button key={item.id} type="button" aria-label={summary(item)} aria-pressed={selectedId===item.id} title={summary(item)} onClick={()=>onSelect(item.id)} className="min-w-0 cursor-pointer outline-offset-[-3px] focus-visible:outline-2 focus-visible:outline-foreground" style={{flex:item.value!,background:item.color,opacity:selectedId&&selectedId!==item.id?0.55:1}}/>:<span key={item.id} aria-label={summary(item)} title={density==="compact"?summary(item):undefined} style={{flex:item.value!,background:item.color}}/>)}</div>:<p className="rounded-md bg-muted px-4 py-3 text-ui-hint text-muted-foreground">{!items.length?"暂无分类数据。":missing===items.length?"所有分类均缺测。":"有效数量合计为 0。"}</p>}
 <ul className={density==="compact"?"flex flex-wrap gap-x-4 gap-y-1":"space-y-1"}>{colored.map(item=><li key={item.id}>{onSelect?<Button variant="ghost" aria-pressed={selectedId===item.id} className="h-auto min-h-8 w-full justify-between gap-3 whitespace-normal px-2 py-1.5 text-left" onClick={()=>onSelect(item.id)}><span className="flex min-w-0 items-center gap-2"><span aria-hidden className="size-2.5 shrink-0 rounded-sm" style={{background:item.color}}/>{item.label}</span><span className="shrink-0 font-normal tabular-nums">{summary(item).split('：').slice(1).join('：')}</span></Button>:<div className={`flex items-center ${density==="compact"?"flex-wrap gap-x-2 gap-y-1":"justify-between gap-3 py-1"} text-ui-body`} role={density==="compact"?"group":undefined} aria-label={density==="compact"?summary(item):undefined} title={density==="compact"?summary(item):undefined}><span className="flex items-center gap-2"><span aria-hidden className="size-2.5 shrink-0 rounded-sm" style={{background:item.color}}/>{item.label}</span><span className="tabular-nums">{density==="compact"?summary(item).split('：').slice(1).join('：').split(' · ')[0]:summary(item).split('：').slice(1).join('：')}</span></div>}</li>)}</ul>
 {invalid>0&&<p role="alert" className="text-ui-body text-destructive">{invalid} 项数量无效，未计入合计和比例。</p>}{missing>0&&<p className="text-ui-hint text-muted-foreground">缺测 {missing} 项；比例仅按有效数量计算。</p>}
 </div>
}
export type FilterField={id:string;label:string;options:{value:string;label:string}[]}
export function FilterBar({fields,value,onChange,onReset}:{fields:FilterField[];value:Record<string,string>;onChange:(value:Record<string,string>)=>void;onReset?:()=>void}){const id=useId();return <div className="flex flex-wrap items-end gap-3">{fields.map(field=><label key={field.id} className="grid gap-2 text-ui-body" htmlFor={`${id}-${field.id}`}>{field.label}<QuestionSelect id={`${id}-${field.id}`} label={field.label} value={value[field.id]??""} items={field.options} onChange={next=>onChange({...value,[field.id]:next})}/></label>)}{onReset&&<Button variant="ghost" onClick={onReset}>重置筛选</Button>}</div>}
export function DataRecordTable<T extends {id:string}>({rows,columns,onSelect,selectedId,empty="暂无记录"}:{rows:T[];columns:{id:string;label:string;render:(row:T)=>ReactNode;ariaLabel?:(row:T)=>string|undefined}[];onSelect?:(id:string)=>void;selectedId?:string;empty?:string}){return <div className="overflow-x-auto"><Table><TableHeader><TableRow>{columns.map(c=><TableHead key={c.id}>{c.label}</TableHead>)}{onSelect&&<TableHead>操作</TableHead>}</TableRow></TableHeader><TableBody>{rows.map(row=><TableRow key={row.id} data-state={selectedId===row.id?"selected":undefined}>{columns.map(c=><TableCell key={c.id} aria-label={c.ariaLabel?.(row)}>{c.render(row)}</TableCell>)}{onSelect&&<TableCell><Button variant="ghost" size="sm" aria-label={`查看 ${row.id}`} onClick={()=>onSelect(row.id)}>查看</Button></TableCell>}</TableRow>)}</TableBody></Table>{!rows.length&&<p className="py-8 text-center text-ui-hint text-muted-foreground">{empty}</p>}</div>}
