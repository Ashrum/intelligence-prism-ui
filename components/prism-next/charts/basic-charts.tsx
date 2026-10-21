"use client"
import { ChartDataDisclosure, type ChartDataDisclosureMode } from "./chart-data-disclosure"
import { useCallback, useState } from "react"
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, LabelList, Rectangle, usePlotArea, useYAxisScale } from "recharts"
import { comparisonDomain, comparisonReferencePosition, comparisonReferenceSegment, comparisonReferenceBand, comparisonTextWidth, type ComparisonReferenceLine } from "@/lib/prism-next/comparison-reference"
import { fitTrendTick, sparkTickLayout } from "@/lib/prism-next/trend-ticks"
import { trendLabelLayout } from "@/lib/prism-next/trend-label-layout"
import { formatChartValue, trendAutoScale, blueprintTrendAutoScale, type ChartDecimals } from "@/lib/prism-next/chart-options"
import { chartToneColor, type ChartTone } from "@/lib/prism-next/polar-chart-options"
import { ChartLegend, ChartMarker, type ChartLegendItem } from "./chart-legend"
import { useChartTheme } from "./chart-theme"
import { isBlueprintTheme } from "@/lib/prism-next/config"
import { DataRecordTable } from "../data-display"
export type ChartPoint={id:string;label:string;value:number|null;tickLabel?:[string,string];symbol?:"circle"|"hollow-circle"|"diamond";valueLabel?:string;annotation?:string}
export type ChartSeries={id:string;label:string;data:ChartPoint[];color?:string;lineStyle?:"solid"|"dashed";showPoints?:boolean;connect?:boolean;connectGaps?:boolean;tone?:ChartTone}
/** Pure props adapter: no theme hook or caller-side colour reconstruction required. */
export function trendLegendItems(series: readonly ChartSeries[], theme?: string): ChartLegendItem[] {
 return series.flatMap<ChartLegendItem>((s,i)=>{
  const color=s.color??(s.tone?undefined:`var(--chart-${i%(theme === "blueprint" || theme === "blueprint-night" ? 5 : 6)+1})`)
  if(s.showPoints===false||s.connect!==false)return [{id:s.id,label:s.label,marker:s.lineStyle==="dashed"?"dashed-line":"line",color,tone:s.tone}]
  const symbols=[...new Set(s.data.filter(p=>p.value!==null&&Number.isFinite(p.value)).map(p=>p.symbol??"circle"))]
  if(!symbols.length)symbols.push(s.data[0]?.symbol??"circle")
  return symbols.map(symbol=>({id:symbols.length===1?s.id:`${s.id}:${symbol}`,label:symbols.length===1?s.label:`${s.label} · ${pointSymbolText[symbol]}`,marker:symbol==="diamond"?"diamond":symbol==="hollow-circle"?"hollow-dot":isBlueprintTheme(theme)?"square":"dot",color,tone:s.tone}))
 })
}
export type BasicChartProps={legendPosition?:'bottom'|'top-left'|'none';dataDisclosure?:ChartDataDisclosureMode;label:string;series:ChartSeries[];unit?:string;domain?:[number,number];yDomain?:[number,number]|"auto";decimals?:ChartDecimals;xTickMode?:"auto"|"all";onSelect?:(pointId:string,seriesId:string)=>void;height?:number;showData?:boolean}
const axis={tickLine:false,axisLine:false,tickMargin:10,tick:{fill:"var(--muted-foreground)",fontSize:12}}
const pointSymbolText={circle:"圆点","hollow-circle":"空心圆",diamond:"菱形"}
function TrendDot({cx,cy,point,color,active,blueprint=false,onSelect}:{cx?:number;cy?:number;point?:ChartPoint;color:string;active?:boolean;blueprint?:boolean;onSelect?:()=>void}){
 if(!point||point.value===null||!Number.isFinite(point.value)||cx===undefined||cy===undefined)return <g/>
 const square=blueprint&&(point.symbol===undefined||point.symbol==="circle")
 const r=active?8:square?6:6.5
 return <g onClick={onSelect} data-trend-symbol={point.symbol??"circle"}><ChartMarker marker={point.symbol==="diamond"?"diamond":point.symbol==="hollow-circle"?"hollow-dot":square?"square":"dot"} color={color} cx={cx} cy={cy} r={r}/></g>
}
function TrendLabels({series,ids,blueprint=false}:{series:ChartSeries[];ids:string[];blueprint?:boolean}){
 const plot=usePlotArea(),yScale=useYAxisScale()
 if(!plot||!yScale)return null
 // A category LineChart without padding uses the endpoints of the plot, including duplicate labels.
 const projected=series.map(s=>ids.map((id,index)=>{
  const p=s.data.find(p=>p.id===id),y=p?.value==null?undefined:yScale(p.value)
  return !p||y===undefined||!Number.isFinite(y)||!Number.isFinite(p.value)?null:{id:`${s.id}:${p.id}`,x:plot.x+(ids.length===1?plot.width/2:index*plot.width/(ids.length-1)),y,valueLabel:p.valueLabel,annotation:p.annotation}
 }))
 const points=projected.flatMap(rows=>rows.flatMap(p=>p?[p]:[]))
 const lines=projected.flatMap((rows,i)=>series[i].connect===false?[]:(series[i].connectGaps?rows.filter(p=>p!==null):rows).flatMap((p,index,connected)=>{const next=connected[index+1];return p&&next?[{x1:p.x,y1:p.y,x2:next.x,y2:next.y}]:[]}))
 return <g aria-hidden="true" className="pointer-events-none" data-trend-labels>{trendLabelLayout(points,plot,lines).map(item=><text key={`${item.id}:${item.kind}`} {...axis.tick} {...(blueprint?{fontFamily:"var(--font-mono)",...(item.kind==="valueLabel"?{fontWeight:700}:{})}:{})} fill="var(--foreground)" stroke="var(--card)" strokeWidth={4} strokeLinejoin="round" paintOrder="stroke" x={item.x+item.width/2} y={item.y+13} textAnchor="middle" data-trend-label={item.kind}>{item.text}</text>)}</g>
}
function TrendUnit({unit}:{unit:string}){
 const plot=usePlotArea()
 return plot?<text {...axis.tick} fontFamily="var(--font-mono)" x={plot.x-10} y={plot.y-10} textAnchor="end" data-trend-unit>{unit}</text>:null
}
export function TrendChart({dataDisclosure,label,series,unit="",domain,yDomain,decimals,xTickMode="auto",height=260,onSelect,showData=true,legendPosition}:BasicChartProps){
 const [chartWidth,setChartWidth]=useState(600)
 const measureWidth=useCallback((width:number)=>{if(Number.isFinite(width)&&width>0)setChartWidth(width)},[])
 const measureContainer=useCallback((node:HTMLDivElement|null)=>{if(node)measureWidth(node.getBoundingClientRect().width)},[measureWidth])
 const theme=useChartTheme(),blueprint=isBlueprintTheme(theme.theme)
 const autoScale=yDomain==="auto"?(blueprint?blueprintTrendAutoScale:trendAutoScale)(series.flatMap(s=>s.data.map(p=>p.value)),unit):undefined,activeDomain=yDomain==="auto"?autoScale!.domain:yDomain??domain
 const trendAxis=blueprint?{...axis,tick:{...axis.tick,fontFamily:"var(--font-mono)"}}:axis
 const format=(value:unknown)=>typeof value==="number"&&Number.isFinite(value)?formatChartValue(value,unit,decimals):"—"
 const rows=[...new Set(series.flatMap(s=>s.data.map(p=>p.id)))].map(id=>({id,label:series.flatMap(s=>s.data).find(p=>p.id===id)!.label,...Object.fromEntries(series.map(s=>[s.id,s.data.find(p=>p.id===id)?.value??null]))}))
 const tickRows=rows.map(row=>({id:row.id,lines:series.flatMap(s=>s.data).find(p=>p.id===row.id&&p.tickLabel)?.tickLabel??[row.label]}))
 const customTicks=xTickMode==="all"||tickRows.some(row=>row.lines.length===2)
 // Reserve an endpoint half-slot instead of allowing the last centered tick outside the SVG.
 const tickWidth=Math.max(1,Math.min(Math.max(0,...tickRows.flatMap(row=>row.lines.map(line=>comparisonTextWidth(line,axis.tick.fontSize)))),(chartWidth-80)/(Math.max(1,rows.length)+1)-8))
 const tickHeight=blueprint?(tickRows.some(row=>row.lines.length===2)?36:24):tickRows.some(row=>row.lines.length===2)?54:36
 const margin={top:blueprint&&unit?24:12,right:customTicks?Math.max(20,tickWidth/2+8):20,left:customTicks?Math.max(0,tickWidth/2+8-60):0,bottom:6}
 const enriched=series.some(s=>s.showPoints===false||s.connectGaps||s.connect===false||s.lineStyle==="dashed"||s.data.some(p=>p.symbol||p.valueLabel||p.annotation))
 const annotations=series.some(s=>s.data.some(p=>p.valueLabel||p.annotation))
 const description=enriched?series.map(s=>`${s.label}：${s.connect===false?(s.showPoints===false?"不画点，不连线":"仅画点，不连线"):(s.lineStyle==="dashed"?"虚线":"实线")+(s.connectGaps?"，跨缺测连线":"")+(s.showPoints===false?"，不画点":"")}`).join("；"):undefined
 const legend=legendPosition!=="none"&&(series.length>1||legendPosition!==undefined&&series.length>0)?<ChartLegend items={trendLegendItems(series,theme.theme)} label="系列图例" align={legendPosition==="top-left"?"left":"center"}/>:null
 return <div className="space-y-3">{legendPosition==="top-left"&&legend}<div role="group" aria-label={label} {...(description?{'aria-description':description}:{})} style={{height}}><ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{width:600,height}} ref={customTicks?measureContainer:undefined} onResize={customTicks?measureWidth:undefined}><LineChart data={rows} accessibilityLayer margin={annotations?{...margin,top:30,bottom:blueprint?6:24}:margin}><CartesianGrid vertical={false} stroke="var(--border)" {...(blueprint?{strokeWidth:1,syncWithTicks:true}:{strokeDasharray:"3 4"})}/><XAxis {...trendAxis} {...(blueprint?{height:tickHeight,tickMargin:4,tickSize:0,axisLine:{stroke:"var(--line)",strokeWidth:1.5}}:{})} dataKey={customTicks?"id":"label"} {...(customTicks?{
 interval:xTickMode==="all"?0:"preserveStartEnd" as const,height:tickHeight,
 tickFormatter:(id:string)=>{const lines=tickRows.find(row=>row.id===id)?.lines??[id];return fitTrendTick(lines.reduce((longest,line)=>comparisonTextWidth(line,axis.tick.fontSize)>comparisonTextWidth(longest,axis.tick.fontSize)?line:longest,""),tickWidth)},
 tick:({x,y,payload}:{x:string|number;y:string|number;payload:{value:string}})=>{
 const lines=tickRows.find(row=>row.id===payload.value)?.lines??[payload.value]
 return <text {...trendAxis.tick} x={x} y={Number(y)+(blueprint?0:10)} textAnchor="middle" dominantBaseline="hanging" data-trend-tick={payload.value}><title>{lines.join(" · ")}</title>{lines.map((line,i)=><tspan key={i} x={x} dy={i?(blueprint?16:18):0}>{fitTrendTick(line,tickWidth)}</tspan>)}</text>
 }}:{})}/><YAxis {...trendAxis} {...(unit.includes("%")||unit.includes("％")?{allowDecimals:false}:{})} domain={activeDomain} {...(autoScale?{ticks:autoScale.ticks,interval:0,allowDataOverflow:true}:{})} tickFormatter={v=>formatChartValue(v,blueprint?"":unit,unit.includes("%")||unit.includes("％")?0:decimals)}/>{blueprint&&unit&&<TrendUnit unit={unit}/>}<Tooltip {...(customTicks?{labelFormatter:(id:unknown)=>rows.find(row=>row.id===id)?.label??String(id)}:{})} contentStyle={{background:"var(--popover)",color:"var(--popover-foreground)",borderColor:"var(--border)",borderRadius:"max(0px, var(--radius-md))",...(enriched?{maxWidth:280,whiteSpace:"normal" as const}:{})}} formatter={enriched?(v,name,item)=>{
 const s=series.find(s=>s.id===item.dataKey),p=s?.data.find(p=>p.id===item.payload?.id)
 return [<span className="text-ui-hint text-foreground">{format(v)}{p?.symbol&&` · ${pointSymbolText[p.symbol]}`}{p?.valueLabel&&<span className="block">{p.valueLabel}</span>}{p?.annotation&&<span className="block whitespace-normal break-words">{p.annotation}</span>}</span>,name]
 }:v=>format(v)}/>{series.map((s,i)=>{
 const color=s.color??(s.tone?chartToneColor(theme,i,s.tone):`var(--chart-${i%(theme.theme === "blueprint" || theme.theme === "blueprint-night" ? 5 : 6)+1})`),custom=blueprint||s.connect===false||s.data.some(p=>p.symbol!==undefined)
 const dot=(props:{cx?:number;cy?:number;payload?:{id:string}},active=false)=><TrendDot {...props} blueprint={blueprint} active={active} color={color} point={s.data.find(p=>p.id===props.payload?.id)} onSelect={onSelect?()=>{if(props.payload)onSelect(props.payload.id,s.id)}:undefined}/>
 return <Line key={s.id} dataKey={s.id} name={s.label} type="linear" connectNulls={s.connect!==false&&s.connectGaps===true} stroke={color} {...(s.connect===false?{strokeOpacity:0}:{})} {...(s.lineStyle==="dashed"?{strokeDasharray:"5 4"}:{})} {...(s.showPoints===false?{dot:false,legendType:"line" as const}:custom?{dot:props=>dot(props),legendType:s.connect===false?"circle" as const:undefined}:{dot:{r:6.5,fill:color,stroke:"var(--card)",strokeWidth:2}})} strokeWidth={blueprint&&s.lineStyle==="dashed"?1.5:2.5} isAnimationActive={false} activeDot={s.showPoints===false?false:custom?props=>dot(props,true):{r:8,fill:color,stroke:"var(--card)",strokeWidth:2,onClick:(_,payload:unknown)=>{const row=payload as {payload?:{id:string}};if(row.payload)onSelect?.(row.payload.id,s.id)}}}/>
 })}{annotations&&<TrendLabels blueprint={blueprint} series={series} ids={rows.map(r=>r.id)}/>}</LineChart></ResponsiveContainer></div>{legendPosition!=="top-left"&&legend}{(dataDisclosure!==undefined||showData)&&<ChartDataDisclosure mode={dataDisclosure} label={label}>{description&&<p className="text-ui-hint text-muted-foreground">{description}。标注避让后放不下时仅在提示框和本表显示。</p>}<DataRecordTable rows={rows} columns={[{id:"label",label:"项目",render:r=><>{r.label}{tickRows.find(row=>row.id===r.id)?.lines.length===2&&<span className="block">{tickRows.find(row=>row.id===r.id)!.lines.join(" · ")}</span>}</>},...series.map(s=>({id:s.id,label:s.label,render:(r:typeof rows[number])=>{const value=(r as Record<string,unknown>)[s.id],p=s.data.find(p=>p.id===r.id);return <span>{format(value)}{p?.symbol&&<span className="block">{pointSymbolText[p.symbol]}</span>}{p?.valueLabel&&<span className="block whitespace-normal break-words">{p.valueLabel}</span>}{p?.annotation&&<span className="block whitespace-normal break-words">{p.annotation}</span>}</span>}}))]} onSelect={dataDisclosure!=="hidden"&&onSelect?id=>onSelect(id,series[0]?.id??""):undefined}/></ChartDataDisclosure>}</div>
}
export type { ComparisonReferenceLine } from "@/lib/prism-next/comparison-reference"
export type ComparisonChartPoint=ChartPoint & {range?:[number,number]}
type PositionedReference=ComparisonReferenceLine & {id:string;position:number}
function SparkMissingWeeks({data}:{data:ComparisonChartPoint[]}){
 const plot=usePlotArea(),scale=useYAxisScale()
 if(!plot||!data.length)return null
 const zero=scale?.(0)
 const y=zero===undefined||!Number.isFinite(zero)?plot.y+plot.height:Math.max(plot.y,Math.min(plot.y+plot.height,zero)),slot=plot.width/data.length,half=Math.min(12,slot*.3)
 return <g data-spark-missing-weeks>{data.map((point,index)=>point.value===null||!Number.isFinite(point.value)||point.value===0?<line key={point.id} data-spark-empty={point.id} x1={plot.x+slot*(index+.5)-half} x2={plot.x+slot*(index+.5)+half} y1={y} y2={y} stroke="var(--muted-foreground)" strokeWidth={2}><title>{point.label}：{point.value===0?formatChartValue(0):"缺测"}</title></line>:null)}</g>
}
const referenceColor=(line:ComparisonReferenceLine)=>line.tone&&line.tone!=="neutral"?`var(--${line.tone}-foreground)`:"var(--muted-foreground)"
function ComparisonReferenceLayer({lines,horizontal,binned,unit,band}:{lines:PositionedReference[];horizontal:boolean;binned:boolean;unit:string;band?:ReturnType<typeof comparisonReferenceBand>}){
 const plot=usePlotArea()
 if(!plot)return null
 const labels=band?.labels??[]
 return <g className="pointer-events-none" data-comparison-reference-lines>
  {lines.map(line=>{const segment=comparisonReferenceSegment(line.position,plot,horizontal,binned);return <line key={line.id} {...segment} y1={labels.length&&segment.x1===segment.x2?12:segment.y1} stroke={referenceColor(line)} strokeDasharray="3 4" data-reference-value={line.value}><title>{line.label}：{formatChartValue(line.value,binned?"":unit)}</title></line>})}
  {labels.map((item,index)=><text key={item.id} {...axis.tick} fill={referenceColor(lines[index])} x={item.x} y={item.y} textAnchor={item.anchor} data-reference-label={lines[index].value} aria-hidden="true"><title>{item.text}</title>{item.rows.map((row,i)=><tspan key={i} x={item.x} dy={i?item.lineHeight:0}>{row}</tspan>)}</text>)}
 </g>
}
export type ComparisonChartProps={
 legendPosition?:'bottom'|'top-left'|'none'
 label:string;data:ComparisonChartPoint[];unit?:string;domain?:[number,number];onSelect?:(id:string)=>void;horizontal?:boolean;height?:number;referenceLines?:ComparisonReferenceLine[]
 showValueLabels?:boolean
 valueLabelFormatter?:(value:number,datum:ComparisonChartPoint)=>string
 referenceLabelPlacement?:'legend'|'plot'
 dataDisclosure?:ChartDataDisclosureMode|'details'|'none'
 variant?:'default'|'spark'
}
export function comparisonLegendItems({data,domain,referenceLines,unit=""}: Pick<ComparisonChartProps,"data"|"domain"|"referenceLines"|"unit">): ChartLegendItem[] {
 const numericDomain=comparisonDomain(data,domain),binned=data.some(p=>p.range!==undefined)
 return (referenceLines??[]).flatMap((line,index)=>comparisonReferencePosition(line.value,data,numericDomain)===null?[]:[{id:`reference-${index}`,label:`${line.label}：${formatChartValue(line.value,binned?"":unit)}`,marker:"dashed-line",color:referenceColor(line)}])
}
function SparkTicks({data}:{data:ComparisonChartPoint[]}){
 const plot=usePlotArea()
 if(!plot)return null
 return <g aria-hidden="true">{sparkTickLayout(data.map(d=>d.label),plot.width).map(tick=><text key={tick.index} {...axis.tick} x={plot.x+tick.x} y={plot.y+plot.height+10} dominantBaseline="hanging" textAnchor="middle" data-spark-tick={tick.index}><title>{tick.label}</title>{tick.text}</text>)}</g>
}
export function ComparisonChart({label,data,unit="",domain,onSelect,variant='default',horizontal=variant!=='spark',height=variant==='spark'?120:260,referenceLines,showValueLabels=false,valueLabelFormatter,referenceLabelPlacement='legend',dataDisclosure='details',legendPosition}:ComparisonChartProps){
 const spark=variant==='spark'&&!horizontal
 const [containerWidth,setContainerWidth]=useState(600)
 const measureWidth=useCallback((width:number)=>{if(Number.isFinite(width)&&width>0)setContainerWidth(Math.round(width))},[])
 const measureContainer=useCallback((node:HTMLDivElement|null)=>{if(node)measureWidth(node.getBoundingClientRect().width)},[measureWidth])
 const numericDomain=comparisonDomain(data,domain),binned=data.some(p=>p.range!==undefined)
 const references=(referenceLines??[]).flatMap((line,index)=>{const position=comparisonReferencePosition(line.value,data,numericDomain);return position===null?[]:[{...line,id:`reference-${index}`,position}]})
 const referenceText=(line:ComparisonReferenceLine)=>`${line.label}：${formatChartValue(line.value,binned?"":unit)}`
 const description=references.length?`参考线；${references.map(referenceText).join("；")}`:undefined
 const activeDomain=references.length&&!binned?numericDomain:domain
 const valueLabels=showValueLabels?data.map(datum=>typeof datum.value==='number'&&Number.isFinite(datum.value)?(valueLabelFormatter?valueLabelFormatter(datum.value,datum):formatChartValue(datum.value,unit)):''):[]
 const labelSpace=Math.max(0,...valueLabels.map(text=>comparisonTextWidth(text,axis.tick.fontSize)))+12
 // Layout-only headroom: keep the existing numeric domain and reference mapping.
 const margin=showValueLabels?{top:30,right:horizontal?Math.max(16,labelSpace):16,left:horizontal&&data.some(p=>p.value!==null&&p.value<0)?labelSpace:0,bottom:!horizontal&&data.some(p=>p.value!==null&&p.value<0)?24:6}:{top:12,right:16,left:0,bottom:6}
 const band=referenceLabelPlacement==='plot'&&references.length?comparisonReferenceBand(
  references.map(line=>({...line,text:`${line.label} ${formatChartValue(line.value,binned?"":unit)}`})),
  {x:margin.left+(horizontal?110:45),y:12,width:containerWidth-margin.left-(horizontal?110:45)-margin.right,height:height-margin.top-margin.bottom-30},horizontal,binned,axis.tick.fontSize
 ):undefined
 if(band)margin.top+=band.height
 const showReferenceLegend=referenceLabelPlacement==='legend'||band?.height===0
 const referenceLegend=legendPosition!=="none"&&references.length>0&&(showReferenceLegend||legendPosition!==undefined)&&<ChartLegend label="参考线标签" items={comparisonLegendItems({data,domain,referenceLines,unit})}/>
 const dataTable=<><DataRecordTable rows={data} columns={[{id:"label",label:"项目",render:r=>r.label},{id:"value",label:unit||"数值",render:r=>r.value==null?"—":formatChartValue(r.value,unit)}]} onSelect={(dataDisclosure==='none'||dataDisclosure==='hidden')?undefined:onSelect}/>{references.length>0&&<section aria-label="参考线数据"><DataRecordTable rows={references} columns={[{id:"label",label:"参考线",render:r=><span className="whitespace-normal break-words">{r.label}</span>},{id:"value",label:binned?"分段轴数值":unit||"数值",render:r=>formatChartValue(r.value,binned?"":unit)} ]}/></section>}</>
 return <div className="space-y-3">
  {legendPosition==="top-left"&&referenceLegend}
  <div role="group" aria-label={label} aria-description={description} style={{height}}>
   <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{width:600,height}} ref={referenceLabelPlacement==='plot'?measureContainer:undefined} onResize={referenceLabelPlacement==='plot'?measureWidth:undefined}>
    <BarChart data={data} layout={horizontal?"vertical":"horizontal"} accessibilityLayer margin={margin}>
     {!spark&&<CartesianGrid horizontal={!horizontal} vertical={horizontal} stroke="var(--border)" strokeDasharray="3 4"/>}
     <XAxis {...axis} {...(spark?{axisLine:{stroke:"var(--border)"},interval:0,tick:false}:{} )} {...(horizontal&&unit.includes("%")?{tickFormatter:(v:number)=>formatChartValue(v,unit),allowDecimals:false}:{})} type={horizontal?"number":"category"} dataKey={horizontal?undefined:"label"} domain={horizontal?activeDomain:undefined} allowDataOverflow={references.length&&!binned?true:undefined}/>
     <YAxis {...axis} hide={spark} {...(!horizontal&&unit.includes("%")?{tickFormatter:(v:number)=>formatChartValue(v,unit),allowDecimals:false}:{})} type={horizontal?"category":"number"} dataKey={horizontal?"label":undefined} domain={horizontal?undefined:activeDomain} allowDataOverflow={references.length&&!binned?true:undefined} width={spark?0:horizontal?110:45}/>
     <Tooltip contentStyle={{background:"var(--popover)",color:"var(--popover-foreground)",borderColor:"var(--border)",borderRadius:"max(0px, var(--radius-md))"}} formatter={v=>typeof v==="number"?formatChartValue(v,unit):"—"}/>
     {/* Recharts filters zero-sized bars unless shape is explicit; keep zero label entries without enlarging bars. */}
     <Bar shape={showValueLabels?<Rectangle/>:undefined} dataKey="value" name={label} fill="var(--chart-1)" barSize={spark?24:20} {...(spark?{radius:[2,2,0,0] as [number,number,number,number]}:{})} isAnimationActive={false} onClick={row=>{if(row.id)onSelect?.(row.id)}}>
      {showValueLabels&&<LabelList dataKey="id" content={({viewBox,value})=>{
       // Recharts filters missing rectangles; its label index is not the original data index.
       const index=data.findIndex(datum=>datum.id===value),text=valueLabels[index],datum=data[index]
       if(!text||!datum||!viewBox||!('width' in viewBox))return <></>
       const {x=0,y=0,width=0,height:barHeight=0}=viewBox,negative=datum.value!==null&&datum.value<0
       const labelX=horizontal?(negative?Math.min(x,x+width)-6:Math.max(x,x+width)+6):x+width/2
       const endY=horizontal?y+barHeight/2:negative?Math.max(y,y+barHeight)+6:Math.min(y,y+barHeight)-6
       const labelY=band?.height&&!horizontal?Math.max(margin.top-6,endY):endY
       return <text {...axis.tick} className="pointer-events-none" x={labelX} y={labelY} textAnchor={horizontal?(negative?'end':'start'):'middle'} dominantBaseline={horizontal?'central':negative?'hanging':'auto'} data-value-label={datum.id} aria-hidden="true">{text}</text>
      }}/>}
     </Bar>
     {spark&&<><SparkMissingWeeks data={data}/><SparkTicks data={data}/></>}
     {references.length>0&&<ComparisonReferenceLayer lines={references} horizontal={horizontal} binned={binned} unit={unit} band={band}/>}
    </BarChart>
   </ResponsiveContainer>
  </div>
  {legendPosition!=="top-left"&&referenceLegend}
  {(dataDisclosure==='none'||dataDisclosure==='hidden')?<div className="sr-only" role="region" aria-label={`${label}：数据`}>{dataTable}</div>:<details><summary className="cursor-pointer text-ui-hint text-muted-foreground">查看数据</summary>{dataTable}</details>}
 </div>
}
