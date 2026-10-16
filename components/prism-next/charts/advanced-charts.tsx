"use client"
import { useEffect, useRef, useState } from "react"
import type { TooltipComponentOption } from "echarts"
import { ChartDataDisclosure, type ChartDataDisclosureMode } from "./chart-data-disclosure"
import { formatChartValue } from "@/lib/prism-next/chart-options"
import { useChartTheme } from "./chart-theme"
import { EChart } from "./echart"
import { DataRecordTable } from "../data-display"
import { matrixExtent, validBox, type AxisItem, type MatrixCell, type ScatterPoint, type BoxSummary } from "@/lib/prism-next/chart-data"
import { sequentialColor, contrastForeground, type SequentialColors } from "@/lib/prism-next/chart-color"
import { chartShapeColors, chartSequentialDefault } from "@/lib/prism-next/chart-palette"
import { heatmapGrid, heatmapAxisLabel } from "@/lib/prism-next/heatmap-layout"
import { heatmapShowsCellLabels, heatmapDescription } from "@/lib/prism-next/heatmap-labels"
export type { AxisItem, MatrixCell, ScatterPoint, BoxSummary } from "@/lib/prism-next/chart-data"
type Shared={dataDisclosure?:ChartDataDisclosureMode;label:string;unit?:string;selectedId?:string;onSelect?:(id:string)=>void;height?:number}
function useChartColors(){const {theme}=useChartTheme();return chartShapeColors(theme)}
// ECharts 6.1 accepts pipe-separated triggers at runtime; its union omits this pair.
const heatmapTooltipTrigger = "mousemove|click" as TooltipComponentOption["triggerOn"]
function useWidth<T extends HTMLElement>() {
 const ref=useRef<T>(null),[width,setWidth]=useState<number>()
 useEffect(()=>{
  const node=ref.current
  if(!node || typeof ResizeObserver === "undefined")return
  const observer=new ResizeObserver(([entry])=>{if(entry)setWidth(entry.contentRect.width)})
  observer.observe(node)
  return()=>observer.disconnect()
 },[])
 return [ref,width] as const
}
export function HeatmapChart({dataDisclosure="visible",rows,columns,cells,label,unit="",selectedId,onSelect,height=320,sequentialColors,compact=false}:Shared&{rows:AxisItem[];columns:AxisItem[];cells:MatrixCell[];sequentialColors?:SequentialColors;compact?:boolean}){
 const {theme,palette}=useChartTheme();const extent=matrixExtent(cells)
 const [frame,width]=useWidth<HTMLDivElement>();const showCellLabels=heatmapShowsCellLabels(width,dataDisclosure,theme)
 const defaultColors=chartSequentialDefault(theme,palette.secondary) as SequentialColors
 const ramp=sequentialColors?.every(c=>/^#[0-9a-f]{6}$/i.test(c))?sequentialColors:defaultColors
 const cellLabel=(c:MatrixCell)=>c.label??(c.value===null||!Number.isFinite(c.value)?"缺测":formatChartValue(c.value,unit))
 const data=cells.filter(c=>rows.some(r=>r.id===c.row)&&columns.some(r=>r.id===c.column)).map(c=>({id:c.id,value:[columns.findIndex(x=>x.id===c.column),rows.findIndex(x=>x.id===c.row),c.value===null||!Number.isFinite(c.value)?extent.missing:c.value],rawLabel:cellLabel(c),rowLabel:rows.find(r=>r.id===c.row)!.label,columnLabel:columns.find(r=>r.id===c.column)!.label,itemStyle:{borderWidth:c.id===selectedId?2:1,borderColor:c.id===selectedId?palette.foreground:palette.background},label:{color:c.value===null||!Number.isFinite(c.value)?palette.muted:contrastForeground(sequentialColor(c.value,extent.min,extent.max,ramp))}}))
 return <div ref={frame} className="space-y-3" data-heatmap-cell-labels={showCellLabels?"shown":"hidden"}>{data.length?<EChart preserveItemTooltip label={heatmapDescription(label,showCellLabels)} height={height} onSelect={onSelect} option={{tooltip:{triggerOn:heatmapTooltipTrigger,formatter:params=>{const p=Array.isArray(params)?params[0]:params;const cell=p.data as typeof data[number];return `${cell.rowLabel} · ${cell.columnLabel}\n${cell.rawLabel}`}},grid:heatmapGrid(compact),xAxis:{type:"category",data:columns.map(c=>c.label),splitArea:{show:false},...heatmapAxisLabel(compact,58)},yAxis:{type:"category",data:rows.map(r=>r.label),inverse:true,...heatmapAxisLabel(compact,64)},visualMap:{min:extent.min,max:extent.max,calculable:false,text:[formatChartValue(extent.max,unit),formatChartValue(extent.min,unit)],orient:"horizontal",left:"center",bottom:0,inRange:{color:[...ramp]},outOfRange:{color:[palette.secondary]},textStyle:{color:palette.muted}},series:[{type:"heatmap",data,label:{show:showCellLabels,formatter:p=>(p.data as typeof data[number]).rawLabel},emphasis:{itemStyle:{color:"inherit",borderColor:palette.foreground,borderWidth:2}}}]}}/>:<p className="py-10 text-ui-hint text-muted-foreground">暂无矩阵数据。</p>}<ChartDataDisclosure mode={dataDisclosure} label={label} summary="查看数据与选择项目" summaryClassName="cursor-pointer py-2 text-ui-hint text-muted-foreground"><p className="text-ui-hint text-muted-foreground">{label} · {unit||"数值"}；缺测单独标记，不按零值绘制。</p><DataRecordTable rows={cells} selectedId={selectedId} onSelect={dataDisclosure==="hidden"?undefined:onSelect} columns={[{id:"row",label:"行",render:c=>rows.find(x=>x.id===c.row)?.label},{id:"column",label:"列",render:c=>columns.find(x=>x.id===c.column)?.label},{id:"value",label:"数值",render:cellLabel}]}/></ChartDataDisclosure></div>
}
export {ScatterChart,QuadrantScatterChart} from "./scatter-chart"
export function BoxPlotChart({dataDisclosure="visible",data,label,unit="",selectedId,onSelect,height=320}:Shared&{data:BoxSummary[]}){const colors=useChartColors();const valid=data.filter(x=>validBox(x.values));return <div className="space-y-3">{valid.length?<EChart label={label} height={height} onSelect={onSelect} option={{grid:{left:55,right:20,top:25,bottom:45},xAxis:{type:"category",data:valid.map(d=>d.label)},yAxis:{type:"value",name:unit,axisLabel:{formatter:(value:number)=>formatChartValue(value,unit)}},tooltip:{formatter:params=>{const p=Array.isArray(params)?params[0]:params;const row=data.find(d=>d.id===(p.data as {id:string}).id);return row?`${row.label}\n${["下须","Q1","中位数","Q3","上须"].map((name,i)=>`${name}：${formatChartValue(row.values[i],unit)}`).join("\n")}`:""}},series:[{type:"boxplot",data:valid.map(d=>({id:d.id,value:d.values,itemStyle:{color:colors.fill,borderColor:d.id===selectedId?colors.selected:colors.base,borderWidth:d.id===selectedId?3:2.5}}))}]}}/>:<p className="py-10 text-ui-hint text-muted-foreground">暂无有效箱线数据。</p>}<ChartDataDisclosure mode={dataDisclosure} label={label} summary="查看数据与选择项目" summaryClassName="cursor-pointer py-2 text-ui-hint text-muted-foreground">{valid.length!==data.length&&<p role="alert" className="text-ui-body text-destructive">部分五数摘要顺序不正确，未绘制。</p>}<p className="text-ui-hint text-muted-foreground">输入顺序：下须、第一四分位、中位数、第三四分位、上须。统计方法由数据提供方确定。</p><DataRecordTable rows={data} selectedId={selectedId} onSelect={dataDisclosure==="hidden"?undefined:onSelect} columns={[{id:"label",label:"分组",render:r=>r.label},...["下须","Q1","中位数","Q3","上须"].map((label,i)=>({id:String(i),label,render:(r:BoxSummary)=>formatChartValue(r.values[i],unit)}))]}/></ChartDataDisclosure></div>}
