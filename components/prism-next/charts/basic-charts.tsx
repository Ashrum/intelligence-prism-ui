"use client"
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, LabelList, Rectangle, usePlotArea } from "recharts"
import { comparisonDomain, comparisonReferencePosition, comparisonReferenceSegment, comparisonReferenceLabels, comparisonTextWidth, type ComparisonReferenceLine } from "@/lib/prism-next/comparison-reference"
import { DataRecordTable } from "../data-display"
export type ChartPoint={id:string;label:string;value:number|null}
export type ChartSeries={id:string;label:string;data:ChartPoint[];color?:string}
export type BasicChartProps={label:string;series:ChartSeries[];unit?:string;domain?:[number,number];onSelect?:(pointId:string,seriesId:string)=>void;height?:number;showData?:boolean}
const axis={tickLine:false,axisLine:false,tickMargin:10,tick:{fill:"var(--muted-foreground)",fontSize:12}}
export function TrendChart({label,series,unit="",domain,height=260,onSelect,showData=true}:BasicChartProps){const rows=[...new Set(series.flatMap(s=>s.data.map(p=>p.id)))].map(id=>({id,label:series.flatMap(s=>s.data).find(p=>p.id===id)!.label,...Object.fromEntries(series.map(s=>[s.id,s.data.find(p=>p.id===id)?.value??null]))}));return <div className="space-y-3"><div role="group" aria-label={label} style={{height}}><ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{width:600,height}}><LineChart data={rows} accessibilityLayer margin={{top:12,right:20,left:0,bottom:6}}><CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 4"/><XAxis {...axis} dataKey="label"/><YAxis {...axis} domain={domain} tickFormatter={v=>`${v}${unit}`}/><Tooltip contentStyle={{background:"var(--popover)",color:"var(--popover-foreground)",borderColor:"var(--border)",borderRadius:8}} formatter={v=>`${v??"—"}${unit}`}/>{series.length>1&&<Legend/>}{series.map((s,i)=><Line key={s.id} dataKey={s.id} name={s.label} type="linear" connectNulls={false} stroke={s.color??`var(--chart-${i%5+1})`} strokeWidth={2} isAnimationActive={false} activeDot={{r:5,onClick:(_,payload:unknown)=>{const row=payload as {payload?:{id:string}};if(row.payload)onSelect?.(row.payload.id,s.id)}}}/>)}</LineChart></ResponsiveContainer></div>{showData&&<details><summary className="cursor-pointer text-ui-hint text-muted-foreground">查看数据</summary><DataRecordTable rows={rows} columns={[{id:"label",label:"项目",render:r=>r.label},...series.map(s=>({id:s.id,label:s.label,render:(r:typeof rows[number])=>{const value=(r as Record<string,unknown>)[s.id];return <span>{value==null?"—":`${value}${unit}`}</span>}}))]} onSelect={onSelect?id=>onSelect(id,series[0]?.id??""):undefined}/></details>}</div>}
export type { ComparisonReferenceLine } from "@/lib/prism-next/comparison-reference"
export type ComparisonChartPoint=ChartPoint & {range?:[number,number]}
type PositionedReference=ComparisonReferenceLine & {id:string;position:number}
const referenceColor=(line:ComparisonReferenceLine)=>line.tone&&line.tone!=="neutral"?`var(--${line.tone}-foreground)`:"var(--muted-foreground)"
function ComparisonReferenceLayer({lines,horizontal,binned,unit,placement}:{lines:PositionedReference[];horizontal:boolean;binned:boolean;unit:string;placement:'legend'|'plot'}){
 const plot=usePlotArea()
 if(!plot)return null
 const labels=placement==='plot'?comparisonReferenceLabels(lines.map(line=>({...line,text:`${line.label} ${line.value}${binned?"":unit}`})),plot,horizontal,binned,axis.tick.fontSize):[]
 return <g className="pointer-events-none" data-comparison-reference-lines>
  {lines.map(line=><line key={line.id} {...comparisonReferenceSegment(line.position,plot,horizontal,binned)} stroke={referenceColor(line)} strokeDasharray="3 4" data-reference-value={line.value}><title>{line.label}：{line.value}{binned?"":unit}</title></line>)}
  {labels.map((item,index)=><text key={item.id} {...axis.tick} fill={referenceColor(lines[index])} x={item.x} y={item.y} textAnchor={item.anchor} data-reference-label={lines[index].value} aria-hidden="true"><title>{item.text}</title>{item.rows.map((row,i)=><tspan key={i} x={item.x} dy={i?item.lineHeight:0}>{row}</tspan>)}</text>)}
 </g>
}
export type ComparisonChartProps={
 label:string;data:ComparisonChartPoint[];unit?:string;domain?:[number,number];onSelect?:(id:string)=>void;horizontal?:boolean;height?:number;referenceLines?:ComparisonReferenceLine[]
 showValueLabels?:boolean
 valueLabelFormatter?:(value:number,datum:ComparisonChartPoint)=>string
 referenceLabelPlacement?:'legend'|'plot'
 dataDisclosure?:'details'|'none'
}
export function ComparisonChart({label,data,unit="",domain,onSelect,horizontal=true,height=260,referenceLines,showValueLabels=false,valueLabelFormatter,referenceLabelPlacement='legend',dataDisclosure='details'}:ComparisonChartProps){
 const numericDomain=comparisonDomain(data,domain),binned=data.some(p=>p.range!==undefined)
 const references=(referenceLines??[]).flatMap((line,index)=>{const position=comparisonReferencePosition(line.value,data,numericDomain);return position===null?[]:[{...line,id:`reference-${index}`,position}]})
 const referenceText=(line:ComparisonReferenceLine)=>`${line.label}：${line.value}${binned?"":unit}`
 const description=references.length?`参考线；${references.map(referenceText).join("；")}`:undefined
 const activeDomain=references.length&&!binned?numericDomain:domain
 const valueLabels=showValueLabels?data.map(datum=>typeof datum.value==='number'&&Number.isFinite(datum.value)?(valueLabelFormatter?valueLabelFormatter(datum.value,datum):`${datum.value}${unit}`):''):[]
 const labelSpace=Math.max(0,...valueLabels.map(text=>comparisonTextWidth(text,axis.tick.fontSize)))+12
 // Layout-only headroom: keep the existing numeric domain and reference mapping.
 const margin=showValueLabels?{top:30,right:horizontal?Math.max(16,labelSpace):16,left:horizontal&&data.some(p=>p.value!==null&&p.value<0)?labelSpace:0,bottom:!horizontal&&data.some(p=>p.value!==null&&p.value<0)?24:6}:{top:12,right:16,left:0,bottom:6}
 const dataTable=<><DataRecordTable rows={data} columns={[{id:"label",label:"项目",render:r=>r.label},{id:"value",label:unit||"数值",render:r=>r.value==null?"—":`${r.value}${unit}`}]} onSelect={dataDisclosure==='none'?undefined:onSelect}/>{references.length>0&&<section aria-label="参考线数据"><DataRecordTable rows={references} columns={[{id:"label",label:"参考线",render:r=><span className="whitespace-normal break-words">{r.label}</span>},{id:"value",label:binned?"分段轴数值":unit||"数值",render:r=>`${r.value}${binned?"":unit}`} ]}/></section>}</>
 return <div className="space-y-3">
  <div role="group" aria-label={label} aria-description={description} style={{height}}>
   <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{width:600,height}}>
    <BarChart data={data} layout={horizontal?"vertical":"horizontal"} accessibilityLayer margin={margin}>
     <CartesianGrid horizontal={!horizontal} vertical={horizontal} stroke="var(--border)" strokeDasharray="3 4"/>
     <XAxis {...axis} type={horizontal?"number":"category"} dataKey={horizontal?undefined:"label"} domain={horizontal?activeDomain:undefined} allowDataOverflow={references.length&&!binned?true:undefined}/>
     <YAxis {...axis} type={horizontal?"category":"number"} dataKey={horizontal?"label":undefined} domain={horizontal?undefined:activeDomain} allowDataOverflow={references.length&&!binned?true:undefined} width={horizontal?110:45}/>
     <Tooltip contentStyle={{background:"var(--popover)",color:"var(--popover-foreground)",borderColor:"var(--border)",borderRadius:8}} formatter={v=>`${v??"—"}${unit}`}/>
     {/* Recharts filters zero-sized bars unless shape is explicit; keep zero label entries without enlarging bars. */}
     <Bar shape={showValueLabels?<Rectangle/>:undefined} dataKey="value" name={label} fill="var(--chart-1)" barSize={20} isAnimationActive={false} onClick={row=>{if(row.id)onSelect?.(row.id)}}>
      {showValueLabels&&<LabelList dataKey="id" content={({viewBox,value})=>{
       // Recharts filters missing rectangles; its label index is not the original data index.
       const index=data.findIndex(datum=>datum.id===value),text=valueLabels[index],datum=data[index]
       if(!text||!datum||!viewBox||!('width' in viewBox))return <></>
       const {x=0,y=0,width=0,height:barHeight=0}=viewBox,negative=datum.value!==null&&datum.value<0
       const labelX=horizontal?(negative?Math.min(x,x+width)-6:Math.max(x,x+width)+6):x+width/2
       const labelY=horizontal?y+barHeight/2:negative?Math.max(y,y+barHeight)+6:Math.min(y,y+barHeight)-6
       return <text {...axis.tick} className="pointer-events-none" x={labelX} y={labelY} textAnchor={horizontal?(negative?'end':'start'):'middle'} dominantBaseline={horizontal?'central':negative?'hanging':'auto'} data-value-label={datum.id} aria-hidden="true">{text}</text>
      }}/>}
     </Bar>
     {references.length>0&&<ComparisonReferenceLayer lines={references} horizontal={horizontal} binned={binned} unit={unit} placement={referenceLabelPlacement}/>}
    </BarChart>
   </ResponsiveContainer>
  </div>
  {references.length>0&&referenceLabelPlacement==='legend'&&<ul aria-label="参考线标签" className="space-y-1 text-ui-hint">{references.map(line=><li key={line.id} className="flex min-w-0 items-start gap-2"><span aria-hidden className="mt-2 w-6 shrink-0 border-t border-dashed" style={{borderColor:referenceColor(line)}}/><span className="min-w-0 break-words [overflow-wrap:anywhere]">{referenceText(line)}</span></li>)}</ul>}
  {dataDisclosure==='none'?<div className="sr-only" role="region" aria-label={`${label}：数据`}>{dataTable}</div>:<details><summary className="cursor-pointer text-ui-hint text-muted-foreground">查看数据</summary>{dataTable}</details>}
 </div>
}
