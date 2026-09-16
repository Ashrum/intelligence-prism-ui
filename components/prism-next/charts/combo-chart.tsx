"use client"
import type {EChartsOption} from 'echarts'
import {EChart} from './echart'
import {useChartTheme} from './chart-theme'
import {DataRecordTable} from '../data-display'
import {isChartValue,formatChartValue,chartDomain,validDomain,alignChartValues} from '@/lib/prism-next/chart-options'
export type ComboAxis={id:string;label:string;unit:string;domain?:[number,number]}
export type ComboSeries={id:string;label:string;type:'bar'|'line';axisId:string;color?:string;data:{id:string;value:number|null}[]}
export type ComboChartProps={label:string;categories:{id:string;label:string}[];axes:[ComboAxis]|[ComboAxis,ComboAxis];series:ComboSeries[];selectedId?:string;onSelect?:(id:string,seriesId?:string)=>void;height?:number}
export function ComboChart({label,categories,axes,series,selectedId,onSelect,height=340}:ComboChartProps){
 const {palette,colors}=useChartTheme();const valid=series.filter(s=>axes.some(a=>a.id===s.axisId)).map(s=>({...s,color:s.color??colors[series.findIndex(item=>item.id===s.id)%colors.length],data:alignChartValues(categories,s.data)}));const values=valid.flatMap(s=>s.data.map(d=>d.value));const ready=categories.length>0&&values.some(isChartValue)
 const ranges=axes.map(a=>chartDomain(valid.filter(s=>s.axisId===a.id).flatMap(s=>s.data.map(d=>d.value)),a.domain));const invalid=values.filter(v=>v!==null&&!isChartValue(v)).length;const invalidRanges=axes.filter(a=>a.domain&&!validDomain(a.domain)).length;const unknown=series.reduce((sum,s)=>sum+s.data.filter(d=>!categories.some(c=>c.id===d.id)).length,0)
 const clipped=valid.reduce((sum,s)=>{const range=ranges[axes.findIndex(a=>a.id===s.axisId)];return sum+s.data.filter(d=>isChartValue(d.value)&&(d.value<range[0]||d.value>range[1])).length},0)
 const chartSeries=valid.map((s,i)=>({id:s.id,name:s.label,type:s.type,yAxisIndex:axes.findIndex(a=>a.id===s.axisId),data:categories.map(c=>{const value=s.data.find(d=>d.id===c.id)?.value;return {id:c.id,value:isChartValue(value)?value:null,itemStyle:{borderColor:palette.foreground,borderWidth:c.id===selectedId?2:0}}}),color:s.color??colors[i%colors.length],itemStyle:{color:s.color??colors[i%colors.length]},lineStyle:{color:s.color??colors[i%colors.length],width:2.5},barMaxWidth:42,symbol:'circle',symbolSize:7,connectNulls:false,clip:true}))
 return <div className="min-w-0 space-y-4"><ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="系列与坐标轴">{series.map((s,i)=><li key={s.id} className="flex items-center gap-2"><span aria-hidden className={s.type==='bar'?'inline-block h-3 w-2.5':'inline-block h-0.5 w-4'} style={{background:s.color??colors[i%colors.length]}}/>{s.label} · {axes.findIndex(a=>a.id===s.axisId)===0?'左轴':'右轴'}（{axes.find(a=>a.id===s.axisId)?.unit??'未绑定'}）</li>)}</ul>
 {ready?<EChart label={label} height={height} onSelect={onSelect} option={{grid:{left:58,right:axes.length>1?58:20,top:45,bottom:40},xAxis:{type:'category',data:categories.map(c=>c.label),axisTick:{show:false},axisLine:{show:false}},yAxis:axes.map((a,i)=>({type:'value',name:`${i?'右轴':'左轴'} · ${a.unit}`,min:ranges[i][0],max:ranges[i][1],position:i?'right':'left',splitNumber:4,splitLine:{show:i===0}})),tooltip:{trigger:'axis',formatter:params=>{const list=Array.isArray(params)?params:[params];return [list[0]?.name,...list.map(p=>{const s=series.find(s=>s.id===p.seriesId)!;const a=axes.find(a=>a.id===s?.axisId);return `${p.seriesName}：${formatChartValue(p.value as number|null,a?.unit)}`})].join('\n')}},series:chartSeries as EChartsOption['series'],media:[{option:{grid:{left:58,right:axes.length>1?58:20}}},{query:{maxWidth:440},option:{grid:{left:38,right:axes.length>1?32:16}}}]}}/>:<p className="py-10 text-sm text-muted-foreground">暂无可绘制的组合数据。</p>}
 {valid.length!==series.length&&<p role="alert" className="text-sm text-destructive">部分系列未绑定有效坐标轴，未绘制。</p>}
 {invalidRanges>0&&<p role="alert" className="text-sm text-destructive">指定坐标范围无效，已按有效数据确定范围。</p>}
 {invalid>0&&<p role="alert" className="text-sm text-destructive">{invalid} 项数值无效，未绘制。</p>}
 {unknown>0&&<p role="alert" className="text-sm text-destructive">{unknown} 项未匹配分类，未绘制。</p>}
 {clipped>0&&<p role="alert" className="text-sm text-destructive">{clipped} 项数值超出指定坐标范围，请调整范围或核对数据。</p>}
 <p className="text-xs text-muted-foreground">{axes.map((a,i)=>`${i?'右轴':'左轴'}：${a.label}（${a.unit}）`).join('；')}。缺测保留间断。</p>
 <details><summary className="cursor-pointer text-sm text-muted-foreground">查看数据与选择项目</summary><DataRecordTable rows={categories} selectedId={selectedId} onSelect={onSelect} columns={[{id:'category',label:'周期',render:c=>c.label},...series.map(s=>({id:s.id,label:s.label,render:(c:{id:string})=>formatChartValue(s.data.find(d=>d.id===c.id)?.value,axes.find(a=>a.id===s.axisId)?.unit)}))]}/></details></div>
}
