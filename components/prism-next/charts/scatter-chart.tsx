"use client"
import { ChartLegend, type ChartLegendItem } from "./chart-legend"
import { ChartDataDisclosure, type ChartDataDisclosureMode } from "./chart-data-disclosure"
import {comparisonTextWidth} from '@/lib/prism-next/comparison-reference'
import {scatterLabelLayout} from '@/lib/prism-next/scatter-label-layout'
import type {EChartsOption,ScatterSeriesOption} from 'echarts'
import {EChart} from './echart'
import {useChartTheme} from './chart-theme'
import {DataRecordTable} from '../data-display'
import {chartDomain,chartAutoScale,withinDomain,formatChartValue,type ChartDecimals} from '@/lib/prism-next/chart-options'
import {chartToneColor,type ChartTone} from '@/lib/prism-next/polar-chart-options'
export type {ChartTone} from '@/lib/prism-next/polar-chart-options'
import type {ScatterPoint} from '@/lib/prism-next/chart-data'
export type ScatterGroup={id:string;label:string;symbol?:'circle'|'diamond'|'triangle'|'rect';color?:string}
export type Quadrants={x:number;y:number;labels:[string,string,string,string];highlight?:{quadrant:"bottom-left"|"top-left"|"top-right"|"bottom-right";tone:ChartTone}}
export type ScatterChartProps={legendPosition?:'bottom'|'top-left'|'none';dataDisclosure?:ChartDataDisclosureMode;data:ScatterPoint[];label:string;xLabel:string;yLabel:string;unit?:string;xUnit?:string;xDomain?:[number,number]|"auto";yDomain?:[number,number]|"auto";groups?:ScatterGroup[];quadrants?:Quadrants;selectedId?:string;onSelect?:(id:string)=>void;height?:number;labelMode?:"auto"|"none";labelIds?:string[];decimals?:ChartDecimals}
export function scatterLegendItems(groups: readonly ScatterGroup[] = []): ChartLegendItem[] {
 return groups.map((g,i)=>({id:g.id,label:g.label,marker:g.symbol==='diamond'?'diamond':g.symbol==='triangle'?'triangle':g.symbol==='rect'?'square':'dot',color:g.color,tone:`chart-${i%6+1}` as ChartLegendItem['tone']}))
}
export const quadrantLegendItems = scatterLegendItems
export function ScatterChart({dataDisclosure="visible",data,label,xLabel,yLabel,unit='',xUnit='',xDomain,yDomain,groups,quadrants,selectedId,onSelect,height=340,labelMode="auto",labelIds,decimals,legendPosition}:ScatterChartProps){
 const {palette,colors}=useChartTheme(),xAuto=xDomain==="auto"?chartAutoScale(data.map(d=>d.x),xUnit):undefined,yAuto=yDomain==="auto"?chartAutoScale(data.map(d=>d.y),unit):undefined
 const xr=xAuto?.domain??chartDomain(data.map(d=>d.x),xDomain==="auto"?undefined:xDomain),yr=yAuto?.domain??chartDomain(data.map(d=>d.y),yDomain==="auto"?undefined:yDomain)
 const grouping=groups?.length?groups:[{id:'all',label}];const coordinates=data.filter(p=>withinDomain(p.x,xr)&&withinDomain(p.y,yr));const valid=coordinates.filter(p=>!groups?.length||groups.some(g=>g.id===p.group));const ungrouped=coordinates.length-valid.length
 const divided=quadrants&&withinDomain(quadrants.x,xr)&&withinDomain(quadrants.y,yr)?quadrants:undefined
 const quadrantKeys=['top-left','top-right','bottom-left','bottom-right'] as const
 const highlightStyle=(index:number)=>divided?.highlight?.quadrant===quadrantKeys[index]?{itemStyle:{color:chartToneColor({palette,colors},0,divided.highlight.tone),opacity:0.1}}:{}
 const cornerPositions=['insideTopLeft','insideTopRight','insideBottomLeft','insideBottomRight'] as const
 const quadrantLabel=(index:number)=>({position:cornerPositions[index],color:divided?.highlight?.quadrant===quadrantKeys[index]?chartToneColor({palette,colors},0,divided.highlight.tone):palette.muted})
 const series:ScatterSeriesOption[]=grouping.map((group,i)=>({id:group.id,name:group.label,type:'scatter',symbol:group.symbol??'circle',clip:true,data:valid.filter(p=>!groups?.length||p.group===group.id).map(p=>({id:p.id,name:p.label,...(labelIds!==undefined?{label:{show:!!quadrants&&labelMode!=="none"&&labelIds.includes(p.id)},emphasis:{label:{show:labelMode!=="none"&&labelIds.includes(p.id)}}}:{}),value:[p.x,p.y],symbolSize:p.size?Math.max(8,Math.min(36,p.size)):13,itemStyle:{color:group.color??colors[i%colors.length],borderColor:p.id===selectedId?palette.foreground:palette.background,borderWidth:p.id===selectedId?3:1}})),label:{show:!!quadrants&&labelMode!=="none",position:'right',color:palette.foreground,fontSize:12,formatter:p=>comparisonTextWidth(p.name,12)<=110?p.name:'',width:110},labelLayout:{hideOverlap:true},emphasis:{label:{show:labelMode!=="none"}},...(i===0&&divided?{markLine:{silent:true,symbol:'none',label:{show:false},lineStyle:{color:palette.muted,type:'solid',width:1},data:[{xAxis:divided.x},{yAxis:divided.y}]},markArea:{silent:true,itemStyle:{color:'transparent'},label:{show:true,color:palette.muted,fontSize:12,position:'insideTop'},data:[[{name:divided.labels[0],label:quadrantLabel(0),...highlightStyle(0),coord:[xr[0],yr[1]]},{coord:[divided.x,divided.y]}],[{name:divided.labels[1],label:quadrantLabel(1),...highlightStyle(1),coord:[divided.x,yr[1]]},{coord:[xr[1],divided.y]}],[{name:divided.labels[2],label:quadrantLabel(2),...highlightStyle(2),coord:[xr[0],divided.y]},{coord:[divided.x,yr[0]]}],[{name:divided.labels[3],label:quadrantLabel(3),...highlightStyle(3),coord:[divided.x,divided.y]},{coord:[xr[1],yr[0]]}]]}}:{})}))
 // Internal renderer hook uses the actual engine size on mount, resize and data/theme changes.
 const resolveLayout=(option:EChartsOption,width:number,chartHeight:number):EChartsOption=>{
  const plot={x:60,y:40,width:Math.max(0,width-88),height:Math.max(0,chartHeight-95)}
  const points=valid.map(p=>({id:p.id,label:p.label,x:plot.x+(p.x!-xr[0])/(xr[1]-xr[0])*plot.width,y:plot.y+(yr[1]-p.y!)/(yr[1]-yr[0])*plot.height,radius:(p.size?Math.max(8,Math.min(36,p.size)):13)/2,show:width>440&&!!quadrants&&labelMode!=="none"&&(labelIds===undefined||labelIds.includes(p.id))}))
  const titles=divided&&width>440?divided.labels.map((text,i)=>{const w=comparisonTextWidth(text,12)+10;return {x:i%2?plot.x+plot.width-w:plot.x,y:i<2?plot.y:plot.y+plot.height-24,width:w,height:24}}):[]
  const placed=scatterLabelLayout(points,plot,titles)
  return {...option,media:[],series:series.map(s=>{
   const rows=s.data as {id:string;label?:object;emphasis?:object}[]
   return {...s,data:rows.map(p=>({...p,label:{show:placed.has(p.id)},emphasis:{label:{show:placed.has(p.id)}}})),
    labelLayout:params=>{const id=rows[params.dataIndex??-1]?.id,box=placed.get(id);return box?{x:box.x+box.width/2,y:box.y+box.height/2,align:'center',verticalAlign:'middle',hideOverlap:true}:{hideOverlap:true}},
    ...(s.markArea?{markArea:{...s.markArea,label:{...s.markArea.label,show:width>440}}}:{})}
  })}
 }
 const missing=data.filter(p=>p.x===null||p.y===null).length,excluded=data.length-coordinates.length-missing
 const legend=!!groups?.length&&legendPosition!=="none"&&<ChartLegend label="点形图例" items={scatterLegendItems(groups)}/>
 return <div className="min-w-0 space-y-4">
 {legendPosition!=="bottom"&&legend}
 {valid.length?<EChart label={label} height={height} resolveLayout={quadrants?resolveLayout:undefined} onSelect={id=>onSelect?.(id)} option={{grid:{left:60,right:28,top:40,bottom:55},xAxis:{type:'value',min:xr[0],max:xr[1],name:xLabel,nameLocation:'middle',nameGap:34,splitNumber:4,...(xAuto?{interval:xAuto.interval}:{}),...(xDomain==="auto"&&(xUnit.includes('%')||xUnit.includes('％'))?{minInterval:1}:{}),axisLabel:{formatter:(v:number)=>formatChartValue(v,xUnit,xDomain==="auto"&&(xUnit.includes('%')||xUnit.includes('％'))?0:decimals)}},yAxis:{type:'value',min:yr[0],max:yr[1],name:yLabel,splitNumber:4,...(yAuto?{interval:yAuto.interval}:{}),...(yDomain==="auto"&&(unit.includes('%')||unit.includes('％'))?{minInterval:1}:{}),axisLabel:{formatter:(v:number)=>formatChartValue(v,unit,yDomain==="auto"&&(unit.includes('%')||unit.includes('％'))?0:decimals)}},tooltip:{formatter:params=>{const p=Array.isArray(params)?params[0]:params;const values=p.value as number[];return `${p.name}\n${xLabel}：${formatChartValue(values[0],xUnit,decimals)}\n${yLabel}：${formatChartValue(values[1],unit,decimals)}`}},series,media:[{option:{series:series.map(s=>({id:s.id,...(labelIds!==undefined?{data:s.data}:{}),label:{show:!!quadrants&&labelMode!=="none"},markArea:{label:{show:!!divided}}}))}},{query:{maxWidth:440},option:{series:series.map(s=>({id:s.id,...(labelIds!==undefined?{data:(s.data as {id:string}[]).map(p=>({...p,label:{show:false}}))}:{}),label:{show:false},markArea:{label:{show:false}}}))}}]}}/>:<p className="py-10 text-ui-hint text-muted-foreground">暂无范围内的散点数据。</p>}
 {legendPosition==="bottom"&&legend}
 <ChartDataDisclosure mode={dataDisclosure} label={label} summary="查看数据与选择项目"> {divided&&<><p className="text-ui-hint text-muted-foreground">分界：{xLabel} {formatChartValue(divided.x,xUnit,decimals)}；{yLabel} {formatChartValue(divided.y,unit,decimals)}。分界线上的点保留原坐标。</p><ul className="grid grid-cols-2 gap-x-5 gap-y-2 text-ui-hint text-muted-foreground" aria-label="象限说明">{['左上','右上','左下','右下'].map((position,i)=><li key={position}>{position} · {divided.labels[i]}{divided.highlight?.quadrant===quadrantKeys[i]?"（高亮区域）":null}</li>)}</ul></>}
 {ungrouped>0&&<p role="alert" className="text-ui-body text-destructive">{ungrouped} 项未匹配分组，未绘制；可在数据表查看。</p>}
 {quadrants&&!divided&&<p role="alert" className="text-ui-body text-destructive">分界值超出坐标范围，未绘制象限。</p>}
 {(missing>0||excluded>0)&&<p className="text-ui-hint text-muted-foreground">缺测 {missing} 项；无效或超出范围 {excluded} 项。未绘制的项目仍保留在数据表中。</p>}
<DataRecordTable rows={data} selectedId={selectedId} onSelect={dataDisclosure==="hidden"?undefined:onSelect} columns={[{id:'label',label:'项目',render:p=>p.label},{id:'x',label:xLabel,render:p=>formatChartValue(p.x,xUnit,decimals)},{id:'y',label:yLabel,render:p=>formatChartValue(p.y,unit,decimals)}]}/></ChartDataDisclosure>
 </div>
}
export function QuadrantScatterChart(props:ScatterChartProps&{quadrants:Quadrants}){return <ScatterChart {...props}/>}
