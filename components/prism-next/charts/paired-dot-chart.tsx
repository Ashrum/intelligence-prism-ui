"use client"
import { ChartDataDisclosure, type ChartDataDisclosureMode } from "./chart-data-disclosure"
import type {ReactNode} from 'react'
import type {EChartsOption} from 'echarts'
import {Button} from '@/components/coss/button'
import {Popover,PopoverTrigger,PopoverPopup} from '@/components/coss/popover'
import {EChart} from './echart'
import {useChartTheme} from './chart-theme'
import {DataRecordTable} from '../data-display'
import {chartDomain,withinDomain,formatChartValue,type ChartDecimals} from '@/lib/prism-next/chart-options'
export type PairedRow={id:string;label:string;first:number|null;second:number|null;tag?:ReactNode}
export type PairedMetric={id:string;label:string;color?:string;help?:ReactNode}
export type PairedDotChartProps={dataDisclosure?:ChartDataDisclosureMode;data:PairedRow[];metrics:[PairedMetric,PairedMetric];label:string;unit?:string;decimals?:ChartDecimals;density?:"default"|"compact";connectPairs?:boolean;domain?:[number,number];selectedId?:string;onSelect?:(id:string,metricId?:string)=>void}
export function PairedDotChart({dataDisclosure="visible",data,metrics,label,unit='',decimals,domain,selectedId,onSelect,density='default',connectPairs=density==='compact'}:PairedDotChartProps){
 const {palette,colors}=useChartTheme(),range=chartDomain(data.flatMap(d=>[d.first,d.second]),domain??(density==="compact"&&/[%％]/.test(unit)?[0,100]:undefined))
 const excluded=data.flatMap(d=>[d.first,d.second]).filter(v=>v!==null&&!withinDomain(v,range)).length
 const chartOption=(rows:PairedRow[],compact=false):EChartsOption=>{
  const option:EChartsOption={grid:{left:108,right:35,top:45,bottom:30},xAxis:{type:'value',min:range[0],max:range[1],position:'top',splitNumber:4,axisLabel:{formatter:(value:number)=>formatChartValue(value,unit,decimals)}},yAxis:{type:'category',inverse:true,data:rows.map(d=>d.label),axisLabel:{width:95,overflow:'truncate'},axisTick:{show:false},axisLine:{show:false},splitLine:{show:true}},tooltip:{formatter:params=>{const p=Array.isArray(params)?params[0]:params;const d=p.data as {rowLabel:string;raw:number};return `${d.rowLabel}\n${p.seriesName}：${formatChartValue(d.raw,unit,decimals)}`}},series:metrics.map((metric,index)=>({id:metric.id,name:metric.label,type:'scatter',symbol:index?'diamond':'circle',symbolSize:12,symbolOffset:[0,compact||connectPairs?0:index?6:-6],clip:true,data:rows.flatMap((row,i)=>{const value=index?row.second:row.first;return withinDomain(value,range)?[{id:row.id,rowLabel:row.label,raw:value,value:[value,i],itemStyle:{color:metric.color??colors[index?3:1],borderColor:row.id===selectedId?palette.foreground:palette.background,borderWidth:row.id===selectedId?2:1}}]:[]}),label:{show:true,position:compact?'top':index?'bottom':'top',distance:5,color:palette.foreground,formatter:p=>formatChartValue((p.data as {raw:number}).raw,unit,decimals)},labelLayout:{hideOverlap:true},emphasis:{scale:1.3},...(connectPairs&&index===0?{markLine:{z:1,silent:true,symbol:'none',label:{show:false},lineStyle:{color:palette.muted,width:1,type:'solid'},data:rows.flatMap((row,i)=>withinDomain(row.first,range)&&withinDomain(row.second,range)?[[{coord:[row.first!,i]},{coord:[row.second!,i]}]]:[])}}:{})})),media:[{option:{grid:{left:108,right:35},xAxis:{splitNumber:4},yAxis:{axisLabel:{width:95}}}},{query:{maxWidth:440},option:{grid:{left:85,right:24},xAxis:{splitNumber:2},yAxis:{axisLabel:{width:72}}}}]}
  if(compact){
   option.grid={left:30,right:35,top:28,bottom:12}
   option.xAxis={...option.xAxis,show:false,splitLine:{show:false}}
   option.yAxis={...option.yAxis,show:false}
   option.media=[]
   // A silent track uses the same domain as both points; it does not invent an observation.
   option.series=[...(Array.isArray(option.series)?option.series:[]),{id:'paired-track',type:'line',silent:true,z:0,symbol:'none',data:[[range[0],0],[range[1],0]],lineStyle:{color:palette.border,width:1},tooltip:{show:false}}]
  }
  return option
 }
 return <div className="min-w-0 space-y-4">
 <ul className="flex flex-wrap gap-x-5 gap-y-2 text-ui-body" aria-label="指标图例">{metrics.map((m,i)=><li key={m.id} className="flex items-center gap-2"><span aria-hidden className="inline-block size-2.5" style={{background:m.color??colors[i?3:1],borderRadius:i?0:'50%',transform:i?'rotate(45deg)':undefined}}/>{m.label}{m.help!=null&&<Popover><PopoverTrigger render={<Button variant="ghost" size="icon-xs"/>} aria-label={`${m.label}：指标说明`}>?</PopoverTrigger><PopoverPopup aria-label={`${m.label}：指标说明`} className="max-w-72"><div className="whitespace-normal break-words text-ui-body">{m.help}</div></PopoverPopup></Popover>}</li>)}</ul>
 {data.length?(density==='compact'?<div className="space-y-3">{data.map(row=><div key={row.id} data-paired-row={row.id} className="min-w-0">
  <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-3 gap-y-1 text-ui-body"><span className="min-w-0 flex-1 basis-40 whitespace-normal [overflow-wrap:anywhere]">{row.label}</span>{row.tag!=null&&<span className="min-w-0 max-w-full whitespace-normal [overflow-wrap:anywhere]">{row.tag}</span>}</div>
  <EChart label={`${label}：${row.label}`} onSelect={onSelect} height={48} option={chartOption([row],true)}/>
 </div>)}</div>:<EChart label={label} onSelect={onSelect} height={Math.max(230,data.length*80+75)} option={chartOption(data)}/>):<p className="py-10 text-ui-hint text-muted-foreground">暂无对比数据。</p>}
 <ChartDataDisclosure mode={dataDisclosure} label={label} summary="查看数据与选择项目"> {connectPairs&&<p className="text-ui-hint text-muted-foreground">连线仅连接同一项目的两个有效值；缺测不补零。</p>}
 {data.some(d=>d.first===null||d.second===null)&&<p className="text-ui-hint text-muted-foreground">缺测项不绘制；另一项仍按原值显示。</p>}
 {excluded>0&&<p role="alert" className="text-ui-body text-destructive">{excluded} 项数值无效或超出指定范围，未绘制，请核对数据表。</p>}
<DataRecordTable rows={data} selectedId={selectedId} onSelect={dataDisclosure==="hidden"?undefined:onSelect} columns={[{id:'label',label:'项目',render:r=>r.label},...(data.some(r=>r.tag!=null)?[{id:'tag',label:'状态',render:(r:PairedRow)=>r.tag}]:[]),...metrics.map((m,i)=>({id:m.id,label:m.label,render:(r:PairedRow)=>formatChartValue(i?r.second:r.first,unit,decimals)}))]}/></ChartDataDisclosure>
 </div>
}
