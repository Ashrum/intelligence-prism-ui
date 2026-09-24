"use client"
import {EChart} from './echart'
import {useChartTheme} from './chart-theme'
import {DataRecordTable} from '../data-display'
import {chartDomain,withinDomain,formatChartValue} from '@/lib/prism-next/chart-options'
export type PairedRow={id:string;label:string;first:number|null;second:number|null}
export type PairedMetric={id:string;label:string;color?:string}
export type PairedDotChartProps={data:PairedRow[];metrics:[PairedMetric,PairedMetric];label:string;unit?:string;domain?:[number,number];selectedId?:string;onSelect?:(id:string,metricId?:string)=>void}
export function PairedDotChart({data,metrics,label,unit='',domain,selectedId,onSelect}:PairedDotChartProps){
 const {palette,colors}=useChartTheme(),range=chartDomain(data.flatMap(d=>[d.first,d.second]),domain)
 const excluded=data.flatMap(d=>[d.first,d.second]).filter(v=>v!==null&&!withinDomain(v,range)).length
 return <div className="min-w-0 space-y-4">
 <ul className="flex flex-wrap gap-x-5 gap-y-2 text-ui-body" aria-label="指标图例">{metrics.map((m,i)=><li key={m.id} className="flex items-center gap-2"><span aria-hidden className="inline-block size-2.5" style={{background:m.color??colors[i?3:1],borderRadius:i?0:'50%',transform:i?'rotate(45deg)':undefined}}/>{m.label}</li>)}</ul>
 {data.length?<EChart label={label} onSelect={onSelect} height={Math.max(230,data.length*80+75)} option={{grid:{left:170,right:35,top:45,bottom:30},xAxis:{type:'value',min:range[0],max:range[1],position:'top',splitNumber:4,axisLabel:{formatter:(value:number)=>formatChartValue(value,unit)}},yAxis:{type:'category',inverse:true,data:data.map(d=>d.label),axisLabel:{width:156,overflow:'truncate'},axisTick:{show:false},axisLine:{show:false},splitLine:{show:true}},tooltip:{formatter:params=>{const p=Array.isArray(params)?params[0]:params;const d=p.data as {rowLabel:string;raw:number};return `${d.rowLabel}\n${p.seriesName}：${formatChartValue(d.raw,unit)}`}},series:metrics.map((metric,index)=>({id:metric.id,name:metric.label,type:'scatter',symbol:index?'diamond':'circle',symbolSize:12,symbolOffset:[0,index?6:-6],clip:true,data:data.flatMap((row,i)=>{const value=index?row.second:row.first;return withinDomain(value,range)?[{id:row.id,rowLabel:row.label,raw:value,value:[value,i],itemStyle:{color:metric.color??colors[index?3:1],borderColor:row.id===selectedId?palette.foreground:palette.background,borderWidth:row.id===selectedId?2:1}}]:[]}),label:{show:true,position:index?'bottom':'top',distance:5,color:palette.foreground,formatter:p=>formatChartValue((p.data as {raw:number}).raw,unit)},labelLayout:{hideOverlap:true},emphasis:{scale:1.3}})),media:[{option:{grid:{left:170,right:35},xAxis:{splitNumber:4},yAxis:{axisLabel:{width:156}}}},{query:{maxWidth:440},option:{grid:{left:85,right:24},xAxis:{splitNumber:2},yAxis:{axisLabel:{width:72}}}}]}}/>:<p className="py-10 text-ui-hint text-muted-foreground">暂无对比数据。</p>}
 {data.some(d=>d.first===null||d.second===null)&&<p className="text-ui-hint text-muted-foreground">缺测项不绘制；另一项仍按原值显示。</p>}
 {excluded>0&&<p role="alert" className="text-ui-body text-destructive-foreground">{excluded} 项数值无效或超出指定范围，未绘制，请核对数据表。</p>}
 <details><summary className="cursor-pointer text-ui-hint text-muted-foreground">查看数据与选择项目</summary><DataRecordTable rows={data} rowLabel={row=>row.label} selectedId={selectedId} onSelect={onSelect} columns={[{id:'label',label:'项目',render:r=>r.label},...metrics.map((m,i)=>({id:m.id,label:m.label,numeric:true,render:(r:PairedRow)=>formatChartValue(i?r.second:r.first,unit)}))]}/></details>
 </div>
}
