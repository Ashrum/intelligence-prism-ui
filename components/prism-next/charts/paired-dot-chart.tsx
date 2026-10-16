"use client"
import { ChartLegend, ChartMarker, type ChartLegendItem } from "./chart-legend"
import { ChartDataDisclosure, type ChartDataDisclosureMode } from "./chart-data-disclosure"
import type {CSSProperties,ReactNode} from 'react'
import type {EChartsOption} from 'echarts'
import {EChart} from './echart'
import {useChartTheme} from './chart-theme'
import {DataRecordTable} from '../data-display'
import {Tooltip,TooltipTrigger,TooltipPopup} from '@/components/coss/tooltip'
import {chartDomain,withinDomain,formatChartValue,type ChartDecimals} from '@/lib/prism-next/chart-options'
export type PairedRow={id:string;label:string;first:number|null;second:number|null;meta?:ReactNode;tag?:ReactNode}
export type PairedMetric={id:string;label:string;color?:string;help?:ReactNode}
export type PairedDotChartProps={legendPosition?:'bottom'|'top-left'|'none';dataDisclosure?:ChartDataDisclosureMode;data:PairedRow[];metrics:[PairedMetric,PairedMetric];label:string;unit?:string;decimals?:ChartDecimals;density?:"default"|"compact";maxTrackWidth?:number;rowLayout?:'stacked'|'inline';labelWidth?:number;connectPairs?:boolean;domain?:[number,number];selectedId?:string;onSelect?:(id:string,metricId?:string)=>void}
export function pairedDotLegendItems(metrics: readonly PairedMetric[]): ChartLegendItem[] {
 return metrics.map((m,i)=>({id:m.id,label:m.label,marker:i?'diamond':'dot',color:m.color,tone:i?'chart-4':'chart-2',help:m.help}))
}
export function PairedDotChart({dataDisclosure="visible",data,metrics,label,unit='',decimals,domain,selectedId,onSelect,density='default',maxTrackWidth,rowLayout='stacked',labelWidth,connectPairs=density==='compact'||rowLayout==='inline',legendPosition}:PairedDotChartProps){
 const {palette,colors}=useChartTheme(),range=chartDomain(data.flatMap(d=>[d.first,d.second]),domain??((density==="compact"||rowLayout==="inline")&&/[%％]/.test(unit)?[0,100]:undefined))
 const capped=typeof maxTrackWidth==='number'&&Number.isFinite(maxTrackWidth)&&maxTrackWidth>0
 const inline=rowLayout==='inline'
 const nameWidth=typeof labelWidth==='number'&&Number.isFinite(labelWidth)&&labelWidth>0?`${labelWidth}px`:'9em'
 const excluded=data.flatMap(d=>[d.first,d.second]).filter(v=>v!==null&&!withinDomain(v,range)).length
 const chartOption=(rows:PairedRow[],compact=false,inlineTrack=false):EChartsOption=>{
  const option:EChartsOption={grid:{left:108,right:35,top:45,bottom:30},xAxis:{type:'value',min:range[0],max:range[1],position:'top',splitNumber:4,axisLabel:{formatter:(value:number)=>formatChartValue(value,unit,decimals)}},yAxis:{type:'category',inverse:true,data:rows.map(d=>d.label),axisLabel:{width:95,overflow:'truncate'},axisTick:{show:false},axisLine:{show:false},splitLine:{show:true}},tooltip:{formatter:params=>{const p=Array.isArray(params)?params[0]:params;const d=p.data as {rowLabel:string;raw:number};return `${d.rowLabel}\n${p.seriesName}：${formatChartValue(d.raw,unit,decimals)}`}},series:metrics.map((metric,index)=>({id:metric.id,name:metric.label,type:'scatter',symbol:index?'diamond':'circle',symbolSize:12,symbolOffset:[0,compact||connectPairs?0:index?6:-6],clip:true,data:rows.flatMap((row,i)=>{const value=index?row.second:row.first;return withinDomain(value,range)?[{id:row.id,rowLabel:row.label,raw:value,value:[value,i],itemStyle:{color:metric.color??colors[index?3:1],borderColor:palette.surface,borderWidth:2}}]:[]}),label:{show:!inlineTrack,position:compact?'top':index?'bottom':'top',distance:5,color:palette.foreground,formatter:p=>formatChartValue((p.data as {raw:number}).raw,unit,decimals)},labelLayout:{hideOverlap:true},emphasis:{scale:1.3,...(inlineTrack?{label:{show:false}}:{})},...(connectPairs&&index===0?{markLine:{z:1,silent:true,symbol:'none',label:{show:false},lineStyle:{color:palette.muted,width:2.5,type:'solid'},data:rows.flatMap((row,i)=>withinDomain(row.first,range)&&withinDomain(row.second,range)?[[{coord:[row.first!,i]},{coord:[row.second!,i]}]]:[])}}:{})})),media:[{option:{grid:{left:108,right:35},xAxis:{splitNumber:4},yAxis:{axisLabel:{width:95}}}},{query:{maxWidth:440},option:{grid:{left:85,right:24},xAxis:{splitNumber:2},yAxis:{axisLabel:{width:72}}}}]}
  if(compact){
   option.grid=inlineTrack?{left:8,right:8,top:8,bottom:8}:{left:30,right:35,top:28,bottom:12}
   option.xAxis={...option.xAxis,show:false,splitLine:{show:false}}
   option.yAxis={...option.yAxis,show:false}
   option.media=[]
   // A silent track uses the same domain as both points; it does not invent an observation.
   option.series=[...(Array.isArray(option.series)?option.series:[]),{id:'paired-track',type:'line',silent:true,z:0,symbol:'none',data:[[range[0],0],[range[1],0]],lineStyle:{color:palette.border,width:1},tooltip:{show:false}}]
  }
  return option
 }
 const legend=!inline&&legendPosition!=="none"&&<ChartLegend label="指标图例" items={pairedDotLegendItems(metrics)} className="flex-nowrap [&>li]:flex-1"/>
 return <div className={inline?"@container/paired min-w-0 space-y-4":"min-w-0 space-y-4"}>
 {legendPosition!=="bottom"&&legend}
 {data.length?(inline?<div data-paired-layout="inline" className="grid min-w-0 text-ui-body gap-x-2 gap-y-2 @min-[360px]/paired:grid-cols-[minmax(0,var(--paired-label-width))_minmax(48px,1fr)_minmax(0,max-content)] @min-[360px]/paired:gap-y-0" style={{'--paired-label-width':nameWidth} as CSSProperties}>
  {data.map(row=><div key={row.id} data-paired-row={row.id} className="grid min-w-0 items-center @min-[360px]/paired:col-span-full @min-[360px]/paired:min-h-9 @min-[360px]/paired:grid-cols-subgrid">
   <div data-paired-name className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
    {row.meta!=null?<Tooltip><TooltipTrigger render={<span tabIndex={0}/>} className="min-w-0 whitespace-normal text-ui-body [overflow-wrap:anywhere] @min-[360px]/paired:truncate">{row.label}</TooltipTrigger><TooltipPopup><div className="max-w-72 whitespace-normal [overflow-wrap:anywhere] text-ui-body"><p>{row.label}</p><div>{row.meta}</div></div></TooltipPopup></Tooltip>:<span title={row.label} className="min-w-0 whitespace-normal text-ui-body [overflow-wrap:anywhere] @min-[360px]/paired:truncate">{row.label}</span>}
    {row.tag!=null&&<span data-paired-tag className="min-w-0 max-w-full whitespace-normal [overflow-wrap:anywhere]">{row.tag}</span>}
    {row.meta!=null&&<div data-paired-meta className="sr-only">{row.meta}</div>}
   </div>
   <div className="min-w-0 w-full" style={capped?{maxWidth:maxTrackWidth}:undefined}><EChart label={`${label}：${row.label}`} onSelect={onSelect} height={36} option={chartOption([row],true,true)}/></div>
   <div data-paired-values className="grid min-w-0 grid-cols-2 items-center gap-x-3 text-ui-body text-foreground text-right tabular-nums">
    {metrics.map((metric,index)=><span key={metric.id} data-paired-metric={metric.id} className="inline-flex items-center justify-end gap-1 whitespace-nowrap">
     <svg aria-hidden="true" focusable="false" width={12} height={16} viewBox="0 0 12 16" className="shrink-0"><ChartMarker marker={index?'diamond':'dot'} color={metric.color??colors[index?3:1]} cx={6} r={3}/></svg>
     <span className="sr-only">{metric.label}：</span>{Number.isFinite(index?row.second:row.first)?formatChartValue(index?row.second:row.first,unit,decimals):<><span aria-hidden="true">—</span><span className="sr-only">缺测</span></>}
    </span>)}
   </div>
  </div>)}
 </div>:density==='compact'?<div className="space-y-3">{data.map(row=><div key={row.id} data-paired-row={row.id} className="min-w-0" style={capped?{maxWidth:maxTrackWidth}:undefined}>
  <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-3 gap-y-1 text-ui-body" style={capped?{paddingLeft:30,paddingRight:35}:undefined}><span className="min-w-0 flex-1 basis-40 whitespace-normal [overflow-wrap:anywhere]">{row.label}</span>{row.meta!=null&&<span className="min-w-0 max-w-full whitespace-normal [overflow-wrap:anywhere]">{row.meta}</span>}{row.tag!=null&&<span className="min-w-0 max-w-full whitespace-normal [overflow-wrap:anywhere]">{row.tag}</span>}</div>
  <EChart label={`${label}：${row.label}`} onSelect={onSelect} height={48} option={chartOption([row],true)}/>
 </div>)}</div>:<EChart label={label} onSelect={onSelect} height={Math.max(230,data.length*80+75)} option={chartOption(data)}/>):<p className="py-10 text-ui-hint text-muted-foreground">暂无对比数据。</p>}
 {legendPosition==="bottom"&&legend}
 <ChartDataDisclosure mode={dataDisclosure} label={label} summary="查看数据与选择项目"> {connectPairs&&<p className="text-ui-hint text-muted-foreground">连线仅连接同一项目的两个有效值；缺测不补零。</p>}
 {data.some(d=>d.first===null||d.second===null)&&<p className="text-ui-hint text-muted-foreground">缺测项不绘制；另一项仍按原值显示。</p>}
 {excluded>0&&<p role="alert" className="text-ui-body text-destructive">{excluded} 项数值无效或超出指定范围，未绘制，请核对数据表。</p>}
<DataRecordTable rows={data} selectedId={selectedId} onSelect={dataDisclosure==="hidden"?undefined:onSelect} columns={[{id:'label',label:'项目',render:r=>r.label},...(!inline&&data.some(r=>r.meta!=null)?[{id:'meta',label:'补充信息',render:(r:PairedRow)=>r.meta}]:[]),...(data.some(r=>r.tag!=null)?[{id:'tag',label:'状态',render:(r:PairedRow)=>r.tag}]:[]),...metrics.map((m,i)=>({id:m.id,label:m.label,render:(r:PairedRow)=>formatChartValue(i?r.second:r.first,unit,decimals)}))]}/></ChartDataDisclosure>
 </div>
}
