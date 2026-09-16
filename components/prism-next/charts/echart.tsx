"use client"
import { useEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"
import type { EChartsOption } from "echarts"
import type { ECharts } from "echarts/core"
import { themeAxes } from "@/lib/prism-next/chart-options"
import { themePalette } from "@/lib/prism-next/config"

let engine:Promise<typeof import("./echart-engine")>|undefined
export function loadChartEngine(){return engine??=import("./echart-engine")}
export function EChart({option,label,height=300,onSelect}:{option:EChartsOption;label:string;height?:number;onSelect?:(id:string,seriesId?:string)=>void}){
 const node=useRef<HTMLDivElement>(null),chart=useRef<ECharts|null>(null),latest=useRef({option,onSelect,label,theme:"light"})
 const {theme}=useTheme();latest.current={option,onSelect,label,theme:theme??"light"}
 const [error,setError]=useState(false)
 useEffect(()=>{let gone=false;let observer:ResizeObserver|undefined;loadChartEngine().then(core=>{if(gone||!node.current)return;const instance=core.init(node.current,undefined,{renderer:"svg"});chart.current=instance;instance.on("click",event=>{const data=event.data as {id?:string}|undefined;if(data?.id)latest.current.onSelect?.(data.id,event.seriesId)});observer=new ResizeObserver(()=>instance.resize());observer.observe(node.current);apply();}).catch(()=>{if(!gone)setError(true)});return()=>{gone=true;observer?.disconnect();chart.current?.dispose();chart.current=null}},[])
 function apply(){const palette=themePalette[latest.current.theme as keyof typeof themePalette]??themePalette.light;chart.current?.setOption({animation:false,aria:{enabled:true,label:{description:`${latest.current.label}。完整数值及缺测说明见下方数据表。`}},backgroundColor:"transparent",textStyle:{color:palette.foreground,fontFamily:"system-ui, sans-serif"},...latest.current.option,tooltip:{trigger:"item",renderMode:"richText",backgroundColor:palette.surface,borderColor:palette.border,textStyle:{color:palette.foreground},...latest.current.option.tooltip as object},xAxis:themeAxes(latest.current.option.xAxis,palette),yAxis:themeAxes(latest.current.option.yAxis,palette)},true)}
 useEffect(()=>{apply()},[option,theme])
 return <div className="min-w-0"><div ref={node} role="img" aria-label={label} style={{height,width:"100%"}} data-chart-engine="echarts"/>{error&&<p role="alert" className="text-sm text-destructive">图形未能加载，请查看下方数据。</p>}</div>
}
