"use client"
import { useEffect, useRef, useState } from "react"
import { useChartTheme } from "./chart-theme"
import type { EChartsOption } from "echarts"
import type { ECharts } from "echarts/core"
import { themeAxes } from "@/lib/prism-next/chart-options"
import { themePalette } from "@/lib/prism-next/config"
import { blueprintChartOverrides } from "@/lib/prism-next/chart-palette"
import { createItemTooltipTracker } from "@/lib/prism-next/chart-item-tooltip"
import { chartDescription } from "@/lib/prism-next/chart-description"

let engine:Promise<typeof import("./echart-engine")>|undefined
export function loadChartEngine(){return engine??=import("./echart-engine")}
export function EChart({option,label,height=300,onSelect,preserveItemTooltip=false,resolveLayout}:{option:EChartsOption;label:string;height?:number;onSelect?:(id:string,seriesId?:string)=>void;preserveItemTooltip?:boolean;resolveLayout?:(option:EChartsOption,width:number,height:number)=>EChartsOption}){
 const node=useRef<HTMLDivElement>(null),chart=useRef<ECharts|null>(null),latest=useRef({option,onSelect,label,theme:"light",preserveItemTooltip,resolveLayout})
 const tooltip=useRef(createItemTooltipTracker())
 const {theme}=useChartTheme();latest.current={option,onSelect,label,theme:theme??"light",preserveItemTooltip,resolveLayout}
 const [error,setError]=useState(false)
 useEffect(()=>{
  let gone=false;let observer:ResizeObserver|undefined
  const outside=(event:PointerEvent)=>{if(latest.current.preserveItemTooltip&&chart.current&&event.target instanceof Node&&!node.current?.contains(event.target))tooltip.current.dismiss(chart.current)}
  loadChartEngine().then(core=>{
   if(gone||!node.current)return
   const instance=core.init(node.current,undefined,{renderer:"svg"});chart.current=instance
   instance.on("click",event=>{
    if(latest.current.preserveItemTooltip)tooltip.current.click(event)
    const data=event.data as {id?:string}|undefined
    if(data?.id)latest.current.onSelect?.(data.id,event.seriesId)
   })
   // These listeners only maintain the opt-in tracker; ECharts owns normal hover/hide.
   instance.on("hideTip",()=>tooltip.current.clear())
   instance.on("mouseover",()=>tooltip.current.clear())
   instance.getZr().on("globalout",()=>tooltip.current.clear())
   instance.getZr().on("click",event=>{if(latest.current.preserveItemTooltip&&!event.target)tooltip.current.dismiss(instance)})
   document.addEventListener("pointerdown",outside)
   observer=new ResizeObserver(()=>{instance.resize();if(latest.current.resolveLayout)apply()});observer.observe(node.current);apply()
  }).catch(()=>{if(!gone)setError(true)})
  return()=>{gone=true;document.removeEventListener("pointerdown",outside);observer?.disconnect();tooltip.current.clear();chart.current?.dispose();chart.current=null}
 },[])
 function apply(){
  const instance=chart.current;if(!instance)return
  const current=latest.current.theme;const palette=themePalette[current as keyof typeof themePalette]??themePalette.light
  const bp=blueprintChartOverrides(current) as {aria?:object;tooltip?:object}
  const description=chartDescription(latest.current.label)
  const layout=latest.current.resolveLayout?.(latest.current.option,instance.getWidth(),instance.getHeight())??latest.current.option
  const setOption=()=>instance.setOption({animation:false,aria:{enabled:true,label:{description},...bp.aria},backgroundColor:"transparent",textStyle:{color:palette.foreground,fontFamily:"system-ui, sans-serif"},...layout,tooltip:{trigger:"item",renderMode:"richText",backgroundColor:palette.surface,borderColor:palette.border,textStyle:{color:palette.foreground},...bp.tooltip,...layout.tooltip as object},xAxis:themeAxes(layout.xAxis,palette),yAxis:themeAxes(layout.yAxis,palette)},true)
  if(latest.current.preserveItemTooltip)tooltip.current.apply(instance,latest.current.option.series,setOption)
  else setOption()
 }
 useEffect(()=>{apply()},[option,theme,label,preserveItemTooltip,resolveLayout])
 return <div className="min-w-0"><div ref={node} role="img" aria-label={label} style={{height,width:"100%"}} data-chart-engine="echarts"/>{error&&<p role="alert" className="text-ui-body text-destructive">图形未能加载，请查看下方数据。</p>}</div>
}
